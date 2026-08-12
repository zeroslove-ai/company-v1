import test from 'node:test';
import assert from 'node:assert/strict';
import { reduceCsaCommitState } from '../src/engine/runtime-core/csa-commit-reducer.js';

function rule(active = true) {
  return {
    active,
    source_type: 'preset',
    content: '사내 규정',
    strength: 'medium',
    preset: { mode: 'continuous', subject_scope: 'company_employee' }
  };
}

function save(overrides = {}) {
  return {
    csa_active: [],
    csa_rules: {},
    csa_runtime_state: {},
    csa_aftereffect_state: {},
    csa_experienced_ids: [],
    player_progress: { level: 1, exp: 0 },
    ...overrides
  };
}

function ordinary(current, observation = {}) {
  const nextSave = structuredClone(current);
  return reduceCsaCommitState({
    currentSave: current,
    nextSave,
    observation,
    canonicalScene: { present_npc_ids: ['heroine1'] },
    action: { action_kind: 'ordinary' },
    expectedTurn: 3
  });
}

test('Phase 6 ordinary commit preserves rule definitions through the reducer', () => {
  const current = save({ csa_active: ['csa_1'], csa_rules: { csa_1: rule() } });
  const result = ordinary(current);
  assert.deepEqual(result.nextSave.csa_active, current.csa_active);
  assert.deepEqual(result.nextSave.csa_rules, current.csa_rules);
});

test('Phase 6 signed activation applies definitions inside the CSA commit reducer', () => {
  const current = save();
  const resolution = { next_csa_active: ['csa_1'], next_csa_rules: { csa_1: rule() } };
  const result = reduceCsaCommitState({
    currentSave: current,
    nextSave: structuredClone(current),
    observation: {},
    canonicalScene: { present_npc_ids: ['heroine1'] },
    action: { action_kind: 'app_transaction' },
    structuredAction: { version: 2, operations: [{ operation: 'activate', id: 'csa_1' }] },
    transactionResolution: resolution,
    expectedTurn: 1
  });
  assert.deepEqual(result.nextSave.csa_active, resolution.next_csa_active);
  assert.deepEqual(result.nextSave.csa_rules, resolution.next_csa_rules);
});

test('Phase 6 signed update and deactivate use the same reducer writer', () => {
  const current = save({ csa_active: ['csa_1'], csa_rules: { csa_1: rule() } });
  const updateResolution = { next_csa_active: ['csa_1'], next_csa_rules: { csa_1: { ...rule(), content: '갱신 규정' } } };
  const updated = reduceCsaCommitState({
    currentSave: current,
    nextSave: structuredClone(current),
    observation: {}, canonicalScene: { present_npc_ids: ['heroine1'] },
    action: { action_kind: 'app_transaction' },
    structuredAction: { version: 2, operations: [{ operation: 'update', id: 'csa_1' }] },
    transactionResolution: updateResolution, expectedTurn: 2
  });
  assert.equal(updated.nextSave.csa_rules.csa_1.content, '갱신 규정');

  const deactivateResolution = { next_csa_active: [], next_csa_rules: { csa_1: { ...updateResolution.next_csa_rules.csa_1, active: false } } };
  const deactivated = reduceCsaCommitState({
    currentSave: updated.nextSave,
    nextSave: structuredClone(updated.nextSave),
    observation: {}, canonicalScene: { present_npc_ids: ['heroine1'] },
    action: { action_kind: 'app_transaction' },
    structuredAction: { version: 2, operations: [{ operation: 'deactivate', id: 'csa_1' }] },
    transactionResolution: deactivateResolution, expectedTurn: 3
  });
  assert.deepEqual(deactivated.nextSave.csa_active, []);
  assert.equal(deactivated.nextSave.csa_rules.csa_1.active, false);
});

test('Phase 6 accepted runtime execution is the only progression source', () => {
  const current = save({ csa_active: ['csa_1'], csa_rules: { csa_1: rule() } });
  const result = ordinary(current, {
    csa_runtime_updates: [{ csa_id: 'csa_1', character_id: 'heroine1', status: 'active' }]
  });
  assert.deepEqual(result.acceptedExecutions, [{ csa_id: 'csa_1', character_id: 'heroine1' }]);
  assert.deepEqual(result.nextSave.csa_experienced_ids, ['heroine1:csa_1']);
  assert.equal(result.nextSave.player_progress.exp, 2);
});

test('Phase 6 out-of-scope runtime updates do not progress experience', () => {
  const current = save({ csa_active: ['csa_1'], csa_rules: { csa_1: rule() } });
  const result = ordinary(current, {
    csa_runtime_updates: [{ csa_id: 'csa_1', character_id: 'heroine2', status: 'active' }]
  });
  assert.deepEqual(result.acceptedExecutions, []);
  assert.deepEqual(result.nextSave.csa_experienced_ids, []);
  assert.equal(result.nextSave.player_progress.exp, 0);
});

test('Phase 6 deactivation uses pre-commit executed runtime to create shock', () => {
  const current = save({
    csa_active: ['csa_1'],
    csa_rules: { csa_1: rule() },
    csa_runtime_state: { csa_1: { lifecycle: 'active', execution_state: 'executed', character_id: 'heroine1' } }
  });
  const resolution = { next_csa_active: [], next_csa_rules: { csa_1: { ...rule(false) } } };
  const result = reduceCsaCommitState({
    currentSave: current, nextSave: structuredClone(current), observation: {},
    canonicalScene: { present_npc_ids: ['heroine1'] }, action: { action_kind: 'app_transaction' },
    structuredAction: { version: 2, operations: [{ operation: 'deactivate', id: 'csa_1' }] },
    transactionResolution: resolution, expectedTurn: 4
  });
  assert.equal(result.nextSave.csa_runtime_state.csa_1.lifecycle, 'deactivated');
  assert.equal(result.nextSave.csa_aftereffect_state.heroine1.csa_1.phase, 'shock');
});

test('Phase 6 ordinary present encounter advances an existing aftereffect', () => {
  const current = save({
    csa_active: ['csa_1'], csa_rules: { csa_1: rule() },
    csa_aftereffect_state: { heroine1: { csa_1: { phase: 'shock', processed_encounters: 0, required_processing_encounters: 2 } } }
  });
  const result = ordinary(current);
  assert.equal(result.nextSave.csa_aftereffect_state.heroine1.csa_1.phase, 'processing');
  assert.equal(result.nextSave.csa_aftereffect_state.heroine1.csa_1.processed_encounters, 1);
});

test('Phase 6 absent NPC does not advance an aftereffect', () => {
  const current = save({
    csa_active: ['csa_1'], csa_rules: { csa_1: rule() },
    csa_aftereffect_state: { heroine1: { csa_1: { phase: 'shock', processed_encounters: 0, required_processing_encounters: 2 } } }
  });
  const result = reduceCsaCommitState({ currentSave: current, nextSave: structuredClone(current), observation: {}, canonicalScene: { present_npc_ids: [] }, action: { action_kind: 'ordinary' }, expectedTurn: 3 });
  assert.deepEqual(result.nextSave.csa_aftereffect_state, current.csa_aftereffect_state);
});

test('Phase 6 feedback revision preserves cumulative CSA state and grants no progression', () => {
  const current = save({
    csa_active: ['csa_1'], csa_rules: { csa_1: rule() },
    csa_runtime_state: { csa_1: { lifecycle: 'active', execution_state: 'executed', character_id: 'heroine1' } },
    csa_aftereffect_state: { heroine1: { csa_1: { phase: 'shock' } } },
    csa_experienced_ids: ['heroine1:csa_1'], player_progress: { level: 1, exp: 2 }
  });
  const result = reduceCsaCommitState({ currentSave: current, nextSave: structuredClone(current), observation: { outcome: 'success' }, canonicalScene: { present_npc_ids: ['heroine1'] }, action: { action_kind: 'feedback_revision' }, expectedTurn: 3 });
  assert.deepEqual(result.nextSave, current);
  assert.equal(result.progression.amount, 0);
});

test('Phase 6 degraded observations grant no progression', () => {
  const current = save({ csa_active: ['csa_1'], csa_rules: { csa_1: rule() } });
  const result = ordinary(current, {
    outcome: 'degraded',
    csa_runtime_updates: [{ csa_id: 'csa_1', character_id: 'heroine1', status: 'active' }]
  });
  assert.deepEqual(result.nextSave.csa_experienced_ids, []);
  assert.equal(result.nextSave.player_progress.exp, 0);
});
