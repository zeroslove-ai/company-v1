import { GameCoreError } from './errors.js';
import { buildTurnState } from './turn-state.js';
import {
  advanceGameTime,
  hydrateGameplayState,
  normalizeGameplayExtractEnvelope,
  reducePlayerSexualState,
  validateCsaRuntimeStatePatch
} from './gameplay-state.js';

const ALLOWED = new Set([
  'player', 'player_scene_state', 'player_sexual_state', 'world_state', 'scene_state',
  'npc_stats', 'npc_emotion', 'npc_relationship_state', 'npc_scene_state', 'npc_work_state',
  'csa_attitudes', 'csa_runtime_state', 'csa_aftereffect_state', 'event_ledger',
  'story_summary_overall', 'story_summary_recent', 'focal_character_id', 'last_speaker_id',
  'last_npcs_present', 'last_image_id', 'last_choices', 'last_choice_meta'
]);
const SNAPSHOTS = new Set(['last_choice_meta']);
const NULLABLE = new Set(['last_image_id']);
const NPC_MAPS = new Set(['npc_stats', 'npc_emotion', 'npc_relationship_state', 'npc_scene_state', 'npc_work_state', 'csa_attitudes']);
// The top-level Extract envelope (focal_character_id/last_speaker_id/choices/npcs_present)
// is the sole writer for these paths; a state_delta proposal for the same path is redundant.
const ENVELOPE_AUTHORITATIVE = new Set(['focal_character_id', 'last_speaker_id', 'last_choices', 'last_npcs_present']);

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

function sexualCompletionWithoutEvidence(delta, evidence) {
  const state = delta.player_sexual_state;
  const playerMarksCompletion = plainObject(state) && Object.entries(state).some(([key, value]) =>
    /sexual.*(complete|relationship)|(?:complete|relationship).*sexual/i.test(key) && Boolean(value)
  );
  return playerMarksCompletion && evidence?.sexual_resolution !== true;
}

/**
 * A new npc_relationship_state.milestones.sexual_relationship_started_turn value requires
 * evidence.sexual_resolution === true. Without it, only that one field is dropped with a
 * warning — the rest of the NPC's relationship patch, and the rest of the turn, still apply.
 */
function sanitizeRelationshipMilestonePatch(currentSave, npcId, patch, evidence) {
  const nextTurn = patch?.milestones?.sexual_relationship_started_turn;
  const currentTurn = currentSave.npc_relationship_state?.[npcId]?.milestones?.sexual_relationship_started_turn;
  const attemptsChange = nextTurn !== null && nextTurn !== undefined && nextTurn !== currentTurn;
  if (!attemptsChange || evidence?.sexual_resolution === true || !plainObject(patch.milestones)) {
    return { patch, warning: null };
  }
  const { sexual_relationship_started_turn, ...restMilestones } = patch.milestones;
  return {
    patch: { ...patch, milestones: restMilestones },
    warning: `unauthorized_sexual_milestone_ignored:${npcId}`
  };
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
  const preSave = hydrateGameplayState(currentSave, options?.master ?? {});
  const envelope = normalizeGameplayExtractEnvelope(extractEnvelope, { parsedStory: options?.parsedStory, npcIds: options?.npcIds });
  if (sexualCompletionWithoutEvidence(envelope.state_delta, envelope.evidence)) {
    throw new GameCoreError('UNAUTHORIZED_SEXUAL_COMPLETION', 'Sexual completion requires evidence');
  }

  const nextSave = clone(preSave);
  const warnings = [...envelope.warnings];
  const allowedNpcs = allowedNpcIds(preSave);
  if (options?.npcIds instanceof Set) {
    for (const id of envelope.npcs_present) allowedNpcs.add(id);
    if (envelope.action_target_id) allowedNpcs.add(envelope.action_target_id);
  }

  for (const [path, patch] of Object.entries(envelope.state_delta)) {
    if (ENVELOPE_AUTHORITATIVE.has(path)) {
      warnings.push(`duplicate_state_path:${path}`);
      continue;
    }
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
    if (path === 'player_sexual_state') {
      if (!plainObject(patch)) {
        warnings.push('invalid_player_sexual_state');
        continue;
      }
      const reduced = reducePlayerSexualState(nextSave.player_sexual_state, patch, {
        storyEvidence: envelope.evidence, updatedTurn: options.expectedTurn
      });
      nextSave.player_sexual_state = reduced.state;
      warnings.push(...reduced.warnings);
      continue;
    }
    if (path === 'csa_runtime_state') {
      if (!plainObject(patch)) {
        warnings.push('invalid_csa_runtime_state');
        continue;
      }
      nextSave.csa_runtime_state = plainObject(nextSave.csa_runtime_state) ? nextSave.csa_runtime_state : {};
      for (const [csaId, csaPatch] of Object.entries(patch)) {
        const validated = validateCsaRuntimeStatePatch(csaId, csaPatch);
        warnings.push(...validated.warnings);
        if (!validated.patch || Object.keys(validated.patch).length === 0) continue;
        nextSave.csa_runtime_state[csaId] = deepMerge(nextSave.csa_runtime_state[csaId] ?? {}, validated.patch);
      }
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
        let sanitizedPatch = npcPatch;
        if (path === 'npc_relationship_state' && plainObject(npcPatch)) {
          const sanitized = sanitizeRelationshipMilestonePatch(preSave, npcId, npcPatch, envelope.evidence);
          sanitizedPatch = sanitized.patch;
          if (sanitized.warning) warnings.push(sanitized.warning);
        }
        if (isStale(nextSave[path][npcId], sanitizedPatch)) {
          warnings.push(`stale_updated_turn:${path}:${npcId}`);
          continue;
        }
        nextSave[path][npcId] = plainObject(sanitizedPatch) ? deepMerge(nextSave[path][npcId] ?? {}, sanitizedPatch) : clone(sanitizedPatch);
      }
      continue;
    }
    if (isStale(nextSave[path], patch)) {
      warnings.push(`stale_updated_turn:${path}`);
      continue;
    }
    nextSave[path] = plainObject(patch) ? deepMerge(nextSave[path] ?? {}, patch) : clone(patch);
  }

  nextSave.last_choices = clone(envelope.choices);
  if (envelope.choices.length !== 4) warnings.push('choices_not_exactly_four');
  if (envelope.npcs_present.length > 0) nextSave.last_npcs_present = clone(envelope.npcs_present);
  if (envelope.focal_character_id !== null) nextSave.focal_character_id = envelope.focal_character_id;
  if (envelope.last_speaker_id !== null) nextSave.last_speaker_id = envelope.last_speaker_id;

  const timeBefore = preSave.world_state.game_time;
  const timeAfter = advanceGameTime(timeBefore, envelope.elapsed_minutes, envelope.evidence);
  nextSave.world_state = plainObject(nextSave.world_state) ? { ...nextSave.world_state, game_time: timeAfter } : { game_time: timeAfter };

  nextSave.turn_state = buildTurnState({
    currentTurn: currentSave.turn_state?.committed_turn ?? 0,
    expectedTurn: options.expectedTurn,
    actionId: options.actionId,
    turnId: options.turnId
  });
  return {
    nextSave,
    warnings,
    time_before: timeBefore,
    elapsed_minutes: envelope.elapsed_minutes,
    time_after: timeAfter,
    action_target_id: envelope.action_target_id,
    image_character_id: envelope.image_character_id,
    mind_monitor: envelope.mind_monitor,
    dialogue_lines: envelope.dialogue_lines
  };
}
