import { GameCoreError } from '../errors.js';
import { normalizeExtractObservationV2 } from './extract-observation.js';
import { adaptLegacyExtractDelta } from './legacy-extract-adapter.js';

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }

/**
 * Historical read boundary for stored Extract rows.  Fresh LLM output never
 * enters this function; it exists only so replay/Commit can read old rows.
 */
export function normalizePersistedExtractObservation(value, options = {}) {
  if (!object(value)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Persisted Extract must be an object');
  if (value.extract_version === 2) return normalizeExtractObservationV2(value, options);
  if (object(value.state_delta)) return adaptLegacyExtractDelta(value, options);
  throw new GameCoreError('EXTRACT_VERSION_UNSUPPORTED', 'Persisted Extract format is unsupported');
}
