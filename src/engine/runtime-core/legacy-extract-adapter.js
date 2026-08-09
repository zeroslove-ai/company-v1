import { GameCoreError } from '../errors.js';
import { normalizeExtractObservationV2 } from './extract-observation.js';

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null; }
function clone(value) { return value === undefined ? undefined : structuredClone(value); }

function physicalOnly(value) {
  if (!object(value)) return null;
  const result = {};
  for (const key of ['posture', 'position_label', 'clothing']) if (key in value) result[key] = clone(value[key]);
  return Object.keys(result).length ? result : null;
}
function pick(value, keys) {
  if (!object(value)) return null;
  const result = {};
  for (const key of keys) if (key in value) result[key] = clone(value[key]);
  return Object.keys(result).length ? result : null;
}
function known(value, npcIds) {
  if (typeof value !== 'string') return null;
  if (!(npcIds instanceof Set) || !npcIds.size || npcIds.has(value) || /^player(?:[-_].*)?$/i.test(value)) return value;
  return null;
}

/** Converts persisted V1 Extract rows only; fresh Extract output must be V2. */
export function adaptLegacyExtractDelta(value, { npcIds = new Set() } = {}) {
  if (!object(value) || !object(value.state_delta)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Legacy Extract requires state_delta');
  const delta = value.state_delta;
  const evidence = object(value.evidence) ? clone(value.evidence) : {};
  const sceneState = object(delta.scene_state) ? delta.scene_state : {};
  const typedSceneEvidence = Array.isArray(evidence.scene_observation) ? evidence.scene_observation : [];
  const final = value.evidence?.scene_presence_final === true && typedSceneEvidence.length
    ? (Array.isArray(value.npcs_present) ? value.npcs_present.map(id => known(id, npcIds)).filter(Boolean) : [])
    : null;
  const remote = Array.isArray(value.evidence?.remote_speaker_ids)
    ? value.evidence.remote_speaker_ids.map(id => known(id, npcIds)).filter(Boolean)
    : [];
  const npcObservations = {};
  for (const [id, patch] of Object.entries(object(delta.npc_scene_state) ? delta.npc_scene_state : {})) {
    if (npcIds instanceof Set && npcIds.size && !npcIds.has(id)) continue;
    const physical = object(patch) ? { ...patch } : {};
    delete physical.present; delete physical.scene_id; delete physical.location_id; delete physical.updated_turn;
    npcObservations[id] ??= {};
    const physicalOnlyPatch = physicalOnly(physical);
    if (physicalOnlyPatch) npcObservations[id].physical = physicalOnlyPatch;
  }
  for (const domain of ['npc_emotion', 'npc_relationship_state', 'npc_stats', 'npc_work_state', 'csa_attitudes']) {
    for (const [id, patch] of Object.entries(object(delta[domain]) ? delta[domain] : {})) {
      if (npcIds instanceof Set && npcIds.size && !npcIds.has(id)) continue;
      npcObservations[id] ??= {};
      const key = domain === 'npc_relationship_state' ? 'relationship' : domain === 'npc_work_state' ? 'work' : domain === 'csa_attitudes' ? 'csa_attitude' : domain.replace(/^npc_/, '');
      const allowed = key === 'emotion' ? ['mood']
        : key === 'relationship' ? ['closeness', 'romance_status', 'current_boundary', 'milestones']
          : key === 'stats' ? ['affinity_delta', 'csa_acceptance_delta', 'sexual_arousal_delta', 'reasons', 'reason']
            : key === 'work' ? ['task']
              : ['familiarity'];
      const filtered = pick(patch, allowed);
      if (filtered) {
        if (key === 'relationship' && object(filtered.milestones)) filtered.milestones = pick(filtered.milestones, ['first_kiss_turn', 'sexual_relationship_started_turn']);
        npcObservations[id][key] = filtered;
      }
    }
  }
  return normalizeExtractObservationV2({
    extract_version: 2,
    outcome: value.outcome === 'degraded' ? 'degraded' : value.outcome,
    scene_observation: {
      scene_id: typedSceneEvidence.length ? (sceneState.scene_id ?? null) : null,
      location_id: typedSceneEvidence.length ? (sceneState.location_id ?? null) : null,
      final_present_npc_ids: final,
      entered_npc_ids: [], exited_npc_ids: [],
      focal_candidate_id: known(value.focal_character_id, npcIds),
      presence_is_final: final !== null,
      remote_speaker_ids: remote, evidence: typedSceneEvidence
    },
    player_observation: {
      physical: physicalOnly(delta.player_scene_state),
      sexual: pick(delta.player_sexual_state, ['arousal_delta', 'ejaculation_progress_delta', 'ejaculation_completed', 'erection_state'])
    },
    npc_observations: npcObservations,
    events: {
      general: (Array.isArray(delta.event_ledger) ? delta.event_ledger : []).map(item => ({
        event_id: item?.event_id ?? null, type: item?.event_type ?? item?.type ?? 'general', actor_id: item?.actor_id ?? null,
        target_id: item?.target_id ?? null, completed: item?.completed, interrupted: item?.interrupted,
        evidence: item?.evidence ?? item?.summary ?? ''
      })),
      sexual: Array.isArray(delta.sexual_event_ledger) ? delta.sexual_event_ledger : []
    },
    evidence,
    elapsed_minutes: value.elapsed_minutes ?? 3,
    mind_monitor: {},
    action_target_id: known(value.action_target_id, npcIds),
    image_character_id: known(value.image_character_id, npcIds),
    image_selection: value.image_selection ?? null,
    csa_trigger_evaluations: value.csa_trigger_evaluations ?? [],
    csa_runtime_updates: value.csa_runtime_updates ?? [],
    turn_summary: value.turn_summary ?? '',
    warnings: ['legacy_extract_adapter_used', ...(Array.isArray(value.warnings) ? value.warnings : [])]
  }, { npcIds });
}
