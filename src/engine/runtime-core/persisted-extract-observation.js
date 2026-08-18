import { GameCoreError } from '../errors.js';
import { normalizeExtractObservationV2 } from './extract-observation.js';
import { adaptLegacyExtractDelta } from './legacy-extract-adapter.js';

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }

const CURRENT_V2_TOP_LEVEL = new Set([
  'extract_version', 'outcome', 'scene_observation', 'player_observation', 'npc_observations',
  'evidence', 'elapsed_minutes', 'mind_monitor', 'turn_summary', 'warnings'
]);
const CURRENT_V2_SCENE_FIELDS = new Set([
  'location_id', 'final_present_npc_ids', 'entered_npc_ids', 'exited_npc_ids',
  'focal_candidate_id', 'remote_speaker_ids', 'evidence'
]);

function isCurrentV2(value) {
  const scene = value?.scene_observation;
  return object(scene)
    && !Object.hasOwn(scene, 'scene_id')
    && !Object.hasOwn(scene, 'presence_is_final')
    && Object.keys(value).every(key => CURRENT_V2_TOP_LEVEL.has(key))
    && Object.keys(scene).every(key => CURRENT_V2_SCENE_FIELDS.has(key));
}

function inertSemanticResidue(value) {
  const persisted = { ...value };
  delete persisted.relation_updates;
  for (const key of ['events', 'action_target_id', 'image_character_id', 'image_selection', 'csa_trigger_evaluations', 'csa_runtime_updates']) delete persisted[key];
  if (object(persisted.evidence) && !Object.hasOwn(persisted.evidence, 'actors')) persisted.evidence = {};
  if (object(persisted.npc_observations)) {
    persisted.npc_observations = {};
    for (const [npcId, domains] of Object.entries(value.npc_observations)) {
      const next = object(domains) ? { ...domains } : {};
      delete next.relationship;
      delete next.emotion;
      delete next.work;
      persisted.npc_observations[npcId] = next;
    }
  }
  return persisted;
}

/**
 * Historical read boundary for stored Extract rows.  Fresh LLM output never
 * enters this function; it exists only so replay/Commit can read old rows.
 */
export function normalizePersistedExtractObservation(value, options = {}) {
  if (!object(value)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Persisted Extract must be an object');
  if (value.extract_version === 2) {
    if (isCurrentV2(value)) {
      return normalizeExtractObservationV2(
        inertSemanticResidue(value),
        { ...options, persistedCanonical: true }
      );
    }
    // Historical V2 rows may retain the superseded fact-ledger fields. They
    // remain inert compatibility data and are deliberately not revalidated or
    // projected into the active turn reducer.
    const { observation_coverage: _legacyCoverage, block_observations: _legacyBlocks, open_facts: _legacyFacts, ...current } = value;
    return normalizeExtractObservationV2(
      inertSemanticResidue(current),
      options
    );
  }
  if (object(value.state_delta)) return adaptLegacyExtractDelta(value, options);
  throw new GameCoreError('EXTRACT_VERSION_UNSUPPORTED', 'Persisted Extract format is unsupported');
}
