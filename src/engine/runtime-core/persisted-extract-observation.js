import { GameCoreError } from '../errors.js';
import { normalizeExtractObservationV2 } from './extract-observation.js';
import { adaptLegacyExtractDelta } from './legacy-extract-adapter.js';

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }

function inertSemanticResidue(value) {
  const persisted = { ...value };
  delete persisted.relation_updates;
  if (object(persisted.events)) {
    persisted.events = { ...persisted.events, general: [] };
  }
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
