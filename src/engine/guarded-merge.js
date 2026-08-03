import { GameCoreError } from './errors.js';
import { normalizeExtractEnvelope } from './extract-envelope.js';
import { buildTurnState } from './turn-state.js';

const ALLOWED = new Set([
  'player', 'player_scene_state', 'player_sexual_state', 'world_state', 'scene_state',
  'npc_stats', 'npc_emotion', 'npc_relationship_state', 'npc_scene_state', 'npc_work_state',
  'csa_attitudes', 'csa_runtime_state', 'csa_aftereffect_state', 'event_ledger',
  'story_summary_overall', 'story_summary_recent', 'focal_character_id', 'last_speaker_id',
  'last_npcs_present', 'last_image_id', 'last_choices', 'last_choice_meta'
]);
const SNAPSHOTS = new Set(['last_npcs_present', 'last_choices', 'last_choice_meta']);
const NULLABLE = new Set(['focal_character_id', 'last_speaker_id', 'last_image_id']);
const NPC_MAPS = new Set(['npc_stats', 'npc_emotion', 'npc_relationship_state', 'npc_scene_state', 'npc_work_state', 'csa_attitudes']);

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  return structuredClone(value);
}

function deepMerge(base, patch) {
  if (!plainObject(base) || !plainObject(patch)) return clone(patch);
  const merged = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    merged[key] = plainObject(value) ? deepMerge(base[key], value) : clone(value);
  }
  return merged;
}

function isStale(base, patch) {
  return plainObject(patch) && Number.isFinite(patch.updated_turn)
    && Number.isFinite(base?.updated_turn) && patch.updated_turn < base.updated_turn;
}

function allowedNpcIds(save) {
  const ids = new Set([...(save.scene_state?.participants ?? []), ...(save.last_npcs_present ?? [])]);
  for (const [id, state] of Object.entries(save.npc_scene_state ?? {})) {
    if (state?.present === true) ids.add(id);
  }
  ids.delete(save.player?.player_id);
  return ids;
}

function sexualCompletionWithoutEvidence(currentSave, delta, evidence) {
  const state = delta.player_sexual_state;
  const playerMarksCompletion = plainObject(state) && Object.entries(state).some(([key, value]) =>
    /sexual.*(complete|relationship)|(?:complete|relationship).*sexual/i.test(key) && Boolean(value)
  );
  const milestoneMarksCompletion = Object.entries(delta.npc_relationship_state ?? {}).some(([npcId, patch]) => {
    const nextTurn = patch?.milestones?.sexual_relationship_started_turn;
    const currentTurn = currentSave.npc_relationship_state?.[npcId]?.milestones?.sexual_relationship_started_turn;
    return nextTurn !== null && nextTurn !== undefined && nextTurn !== currentTurn;
  });
  return (playerMarksCompletion || milestoneMarksCompletion) && evidence?.sexual_resolution !== true;
}

function mergeEventLedger(current, patch) {
  const byId = new Map((Array.isArray(current) ? current : []).map(item => [item?.event_id, item]));
  for (const event of patch) {
    if (plainObject(event) && typeof event.event_id === 'string' && !byId.has(event.event_id)) byId.set(event.event_id, clone(event));
  }
  return [...byId.values()];
}

export function applyGuardedStateDelta(currentSave, extractEnvelope, options) {
  if (!plainObject(currentSave)) throw new GameCoreError('INVALID_SAVE', 'Current save must be an object');
  if (currentSave.save_schema_version !== 1 || currentSave.edition !== 'company-v1') {
    throw new GameCoreError('INVALID_SAVE', 'Current save edition or schema is invalid');
  }
  const envelope = normalizeExtractEnvelope(extractEnvelope);
  if (sexualCompletionWithoutEvidence(currentSave, envelope.state_delta, envelope.evidence)) {
    throw new GameCoreError('UNAUTHORIZED_SEXUAL_COMPLETION', 'Sexual completion requires evidence');
  }

  const nextSave = clone(currentSave);
  const warnings = [...envelope.warnings];
  const allowedNpcs = allowedNpcIds(currentSave);

  for (const [path, patch] of Object.entries(envelope.state_delta)) {
    if (!ALLOWED.has(path)) {
      warnings.push(`unknown_state_path:${path}`);
      continue;
    }
    if (patch === null) {
      if (NULLABLE.has(path)) nextSave[path] = null;
      else warnings.push(`null_not_allowed:${path}`);
      continue;
    }
    if (path === 'event_ledger') {
      if (Array.isArray(patch)) nextSave.event_ledger = mergeEventLedger(nextSave.event_ledger, patch);
      else warnings.push('invalid_event_ledger');
      continue;
    }
    if (SNAPSHOTS.has(path)) {
      if (Array.isArray(patch)) nextSave[path] = clone(patch);
      else warnings.push(`invalid_snapshot:${path}`);
      continue;
    }
    if (NPC_MAPS.has(path)) {
      if (!plainObject(patch)) {
        warnings.push(`invalid_npc_map:${path}`);
        continue;
      }
      nextSave[path] ??= {};
      for (const [npcId, npcPatch] of Object.entries(patch)) {
        if (!allowedNpcs.has(npcId)) {
          warnings.push(`absent_npc_patch:${path}:${npcId}`);
          continue;
        }
        if (isStale(nextSave[path][npcId], npcPatch)) {
          warnings.push(`stale_updated_turn:${path}:${npcId}`);
          continue;
        }
        nextSave[path][npcId] = plainObject(npcPatch) ? deepMerge(nextSave[path][npcId] ?? {}, npcPatch) : clone(npcPatch);
      }
      continue;
    }
    if (isStale(nextSave[path], patch)) {
      warnings.push(`stale_updated_turn:${path}`);
      continue;
    }
    nextSave[path] = plainObject(patch) ? deepMerge(nextSave[path] ?? {}, patch) : clone(patch);
  }

  nextSave.turn_state = buildTurnState({
    currentTurn: currentSave.turn_state?.committed_turn ?? 0,
    expectedTurn: options.expectedTurn,
    actionId: options.actionId,
    turnId: options.turnId
  });
  return { nextSave, warnings };
}
