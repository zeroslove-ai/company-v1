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
  if (value.extract_version === 2) {
    // Older persisted V2 rows may retain the superseded provider accounting
    // field. It is not read as fresh authority; canonical durable open_facts
    // remain the only replay input we preserve.
    const { observation_coverage: _legacyCoverage, block_observations: _freshWire, ...persisted } = value;
    const facts = Array.isArray(persisted.open_facts) ? persisted.open_facts : [];
    const hasExpectedTurn = Object.hasOwn(options, 'expectedTurn') && options.expectedTurn !== undefined;
    const hasActionId = Object.hasOwn(options, 'actionId') && options.actionId !== undefined;
    const turns = [...new Set(facts.filter(item => Object.hasOwn(item ?? {}, 'turn_number')).map(item => item?.turn_number))];
    const actionIds = [...new Set(facts.filter(item => Object.hasOwn(item ?? {}, 'action_id')).map(item => item?.action_id))];
    if (turns.some(turn => !Number.isInteger(turn) || turn < 0)) throw new GameCoreError('PERSISTED_OPEN_FACT_TURN_MISMATCH', 'Persisted open fact turn_number must be a non-negative integer');
    if (actionIds.some(actionId => actionId !== null && (typeof actionId !== 'string' || !actionId.trim()))) throw new GameCoreError('PERSISTED_OPEN_FACT_ACTION_MISMATCH', 'Persisted open fact action_id must be a non-empty string or null');
    if (turns.length > 1 || (hasExpectedTurn && turns.some(turn => turn !== options.expectedTurn))) {
      throw new GameCoreError('PERSISTED_OPEN_FACT_TURN_MISMATCH', 'Persisted open facts contain a turn_number that disagrees with the Commit boundary');
    }
    if (actionIds.length > 1 || (hasActionId && actionIds.some(actionId => actionId !== options.actionId))) {
      throw new GameCoreError('PERSISTED_OPEN_FACT_ACTION_MISMATCH', 'Persisted open facts contain an action_id that disagrees with the Commit boundary');
    }
    const expectedTurn = hasExpectedTurn ? options.expectedTurn : (turns[0] ?? 0);
    const actionId = hasActionId ? options.actionId : (actionIds[0] ?? null);
    return normalizeExtractObservationV2(
      persisted,
      { ...options, expectedTurn, actionId, persistedCanonical: true }
    );
  }
  if (object(value.state_delta)) return adaptLegacyExtractDelta(value, options);
  throw new GameCoreError('EXTRACT_VERSION_UNSUPPORTED', 'Persisted Extract format is unsupported');
}
