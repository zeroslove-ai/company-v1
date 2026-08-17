import { stableStringify } from '../csa/transaction-validator.js';

/**
 * A stored-action authority failure is intentionally distinct from a generic
 * engine error: clients must receive a non-retryable 409 and, most
 * importantly, the Story/Extract/Commit stage must stop before doing work.
 */
export class StoredActionAuthorityError extends Error {
  constructor(code, message, stage = null) {
    super(message);
    this.name = 'StoredActionAuthorityError';
    this.status = 409;
    this.code = code;
    this.retryable = false;
    this.stage = stage;
  }
}

function authorityError(code, message, stage) {
  return new StoredActionAuthorityError(code, message, stage);
}

function storedValue(action) {
  return action?.structured_action ?? null;
}

function sameJson(left, right) {
  return stableStringify(left) === stableStringify(right);
}

function ruleDefinitions(save) {
  return {
    csa_active: save?.csa_active ?? null,
    csa_rules: save?.csa_rules ?? null
  };
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

/**
 * Resolve the action plan persisted by reserve_turn_action. A request may
 * repeat the exact value, but it can never introduce a value after reservation
 * or replace the stored value with a different object.
 */
export function resolveStoredStructuredAction({ action, requestedStructuredAction = null, stage = 'turn' } = {}) {
  const stored = storedValue(action);
  const requested = requestedStructuredAction ?? null;

  if (stored !== null && requested !== null) {
    if (!sameJson(stored, requested)) {
      throw authorityError(
        'structured_action_mismatch',
        `structured_action does not match the reserved action (${stage})`,
        stage
      );
    }
    return stored;
  }

  if (stored === null && requested !== null) {
    throw authorityError(
      'structured_action_not_persisted',
      `structured_action was not persisted for the reserved action (${stage})`,
      stage
    );
  }

  return stored;
}

/**
 * Reservation and the persisted action row are independent authorities at the
 * reservation boundary. They must carry the exact same structured action
 * before any Story work starts, including when the request omitted one.
 */
export function assertStoredActionPersistenceParity({
  reservation,
  action,
  requestedStructuredAction = null,
  stage = 'turn'
} = {}) {
  const reservationStored = storedValue(reservation);
  const actionStored = storedValue(action);
  const requested = requestedStructuredAction ?? null;

  if (requested !== null) {
    if (reservationStored === null && actionStored === null) {
      throw authorityError(
        'structured_action_not_persisted',
        `structured_action was not persisted for the reserved action (${stage})`,
        stage
      );
    }
    if (!sameJson(reservationStored, requested) || !sameJson(actionStored, requested)) {
      throw authorityError(
        'structured_action_mismatch',
        `structured_action does not match the reserved action (${stage})`,
        stage
      );
    }
  }

  if (!sameJson(reservationStored, actionStored)) {
    throw authorityError(
      'structured_action_persistence_mismatch',
      `reservation and persisted action structured_action differ (${stage})`,
      stage
    );
  }

  return actionStored;
}

/**
 * Verify that csa_active/csa_rules can only change through the signed
 * transaction resolution. Ordinary turns must preserve both values exactly.
 */
export function assertRuleDefinitionAuthority({
  currentSave,
  nextSave,
  transactionResolution = null,
  structuredAction = null,
  stage = 'commit'
} = {}) {
  const current = ruleDefinitions(currentSave);
  const next = ruleDefinitions(nextSave);

  if (structuredAction === null) {
    if (!sameJson(current, next)) {
      throw authorityError(
        'unauthorized_rule_definition_mutation',
        `csa rule definitions changed without a stored structured action (${stage})`,
        stage
      );
    }
    return true;
  }

  if (!transactionResolution || !Object.prototype.hasOwnProperty.call(transactionResolution, 'next_csa_active')
    || !Object.prototype.hasOwnProperty.call(transactionResolution, 'next_csa_rules')) {
    throw authorityError(
      'unauthorized_rule_definition_mutation',
      `signed transaction resolution is missing (${stage})`,
      stage
    );
  }

  const authorized = {
    csa_active: transactionResolution.next_csa_active,
    csa_rules: transactionResolution.next_csa_rules
  };
  if (!sameJson(next, authorized)) {
    throw authorityError(
      'unauthorized_rule_definition_mutation',
      `csa rule definitions do not match the signed transaction resolution (${stage})`,
      stage
    );
  }
  return true;
}

/**
 * Apply the only authorized CSA definition write. The caller must have
 * verified the stored action's signed transaction resolution.
 */
export function applyAuthorizedRuleDefinitions({
  currentSave,
  nextSave,
  transactionResolution = null,
  structuredAction = null,
  stage = 'commit'
} = {}) {
  if (structuredAction === null) {
    assertRuleDefinitionAuthority({ currentSave, nextSave, transactionResolution, structuredAction, stage });
    return nextSave;
  }

  if (!transactionResolution) {
    throw authorityError(
      'unauthorized_rule_definition_mutation',
      `signed transaction resolution is required (${stage})`,
      stage
    );
  }

  nextSave.csa_active = clone(transactionResolution.next_csa_active);
  nextSave.csa_rules = clone(transactionResolution.next_csa_rules);
  assertRuleDefinitionAuthority({ currentSave, nextSave, transactionResolution, structuredAction, stage });
  return nextSave;
}
