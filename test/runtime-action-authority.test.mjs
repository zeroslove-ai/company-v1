import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveStoredStructuredAction,
  assertStoredActionPersistenceParity,
  applyAuthorizedRuleDefinitions,
  assertRuleDefinitionAuthority,
  StoredActionAuthorityError
} from '../src/engine/runtime-core/action-authority.js';

const plan = {
  next_csa_active: ['csa_1'],
  next_csa_rules: { csa_1: { active: true, content: '회사 여성 직원은 재킷을 벗는다.' } },
  canonical_action: { operations: [{ operation: 'activate', id: 'csa_1' }] }
};

function storedAction(structured_action) {
  return { action_id: 'action-1', structured_action };
}

test('stored structured action is reused when omitted and key order alone is not a mismatch', () => {
  const value = { version: 1, operations: [{ id: 'csa_1', operation: 'activate' }] };
  assert.deepEqual(resolveStoredStructuredAction({ action: storedAction(value), stage: 'extract' }), value);
  assert.deepEqual(resolveStoredStructuredAction({
    action: storedAction(value),
    requestedStructuredAction: { operations: value.operations, version: value.version },
    stage: 'commit'
  }), value);
});

test('different structured action is rejected as a non-retryable conflict', () => {
  assert.throws(
    () => resolveStoredStructuredAction({
      action: storedAction({ version: 1, operations: [] }),
      requestedStructuredAction: { version: 1, operations: [{ id: 'csa_2' }] },
      stage: 'story'
    }),
    error => error instanceof StoredActionAuthorityError
      && error.status === 409
      && error.code === 'structured_action_mismatch'
      && error.retryable === false
  );
});

test('non-null request cannot proceed when the reservation did not persist it', () => {
  assert.throws(
    () => resolveStoredStructuredAction({
      action: storedAction(null),
      requestedStructuredAction: { version: 1, operations: [] },
      stage: 'reservation'
    }),
    error => error.code === 'structured_action_not_persisted' && error.status === 409 && error.retryable === false
  );
  assert.equal(resolveStoredStructuredAction({ action: storedAction(null), stage: 'story' }), null);
});

test('reservation and persisted action rows must have exact structured action parity', () => {
  const value = { version: 1, operations: [{ operation: 'activate', id: 'csa_1' }] };
  assert.equal(assertStoredActionPersistenceParity({
    reservation: storedAction(null), action: storedAction(null), stage: 'story'
  }), null);
  assert.deepEqual(assertStoredActionPersistenceParity({
    reservation: storedAction(value), action: storedAction(structuredClone(value)), stage: 'story'
  }), value);

  for (const [reservation, action] of [
    [value, null],
    [null, value],
    [value, { version: 1, operations: [{ operation: 'deactivate', id: 'csa_1' }] }]
  ]) {
    assert.throws(
      () => assertStoredActionPersistenceParity({
        reservation: storedAction(reservation), action: storedAction(action), stage: 'story'
      }),
      error => error.code === 'structured_action_persistence_mismatch' && error.status === 409
    );
  }
});

test('requested structured action keeps not-persisted and mismatch error distinctions', () => {
  const requested = { version: 1, operations: [{ operation: 'activate', id: 'csa_1' }] };
  assert.throws(
    () => assertStoredActionPersistenceParity({
      reservation: storedAction(null), action: storedAction(null), requestedStructuredAction: requested, stage: 'story'
    }),
    error => error.code === 'structured_action_not_persisted'
  );
  assert.throws(
    () => assertStoredActionPersistenceParity({
      reservation: storedAction(requested), action: storedAction(null), requestedStructuredAction: requested, stage: 'story'
    }),
    error => error.code === 'structured_action_mismatch'
  );
});

test('ordinary turns preserve csa definitions and reject malicious Extract mutations', () => {
  const currentSave = { csa_active: ['csa_1'], csa_rules: { csa_1: { active: true } } };
  const nextSave = structuredClone(currentSave);
  assertRuleDefinitionAuthority({ currentSave, nextSave, structuredAction: null, stage: 'commit' });
  nextSave.csa_active = [];
  assert.throws(
    () => assertRuleDefinitionAuthority({ currentSave, nextSave, structuredAction: null, stage: 'commit' }),
    error => error.code === 'unauthorized_rule_definition_mutation' && error.status === 409
  );
});

test('validated stored transaction is the only writer of csa_active and csa_rules', () => {
  const currentSave = { csa_active: [], csa_rules: {} };
  const nextSave = { ...currentSave, unrelated: true, csa_active: ['forged'], csa_rules: { forged: {} } };
  applyAuthorizedRuleDefinitions({ currentSave, nextSave, csaPlan: plan, structuredAction: { version: 1 }, stage: 'commit' });
  assert.deepEqual(nextSave.csa_active, plan.next_csa_active);
  assert.deepEqual(nextSave.csa_rules, plan.next_csa_rules);
  assert.equal(nextSave.unrelated, true);
});

test('transaction writer rejects missing or drifting plans', () => {
  const currentSave = { csa_active: [], csa_rules: {} };
  assert.throws(
    () => applyAuthorizedRuleDefinitions({ currentSave, nextSave: structuredClone(currentSave), structuredAction: { version: 1 }, stage: 'commit' }),
    error => error.code === 'unauthorized_rule_definition_mutation'
  );
  const nextSave = { ...currentSave, csa_active: ['wrong'], csa_rules: {} };
  assert.throws(
    () => assertRuleDefinitionAuthority({ currentSave, nextSave, csaPlan: plan, structuredAction: { version: 1 }, stage: 'commit-final' }),
    error => error.code === 'unauthorized_rule_definition_mutation'
  );
});
