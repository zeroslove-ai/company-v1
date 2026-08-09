import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCsaSceneRuntimeStatePatch, buildCsaAftereffectPatch
} from '../src/engine/index.js';
import { toolbarCapabilities } from '../src/frontend/pages/app.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const catalog = readJson('content/csa_presets.json');

function saveWithActiveCsa(entries) {
  const csa_active = entries.map((_, index) => `csa_${index}`);
  const csa_rules = Object.fromEntries(entries.map((entry, index) => [`csa_${index}`, { active: true, ...entry }]));
  return { csa_active, csa_rules, focal_character_id: 'heroine1', scene_state: { participants: ['heroine1'] } };
}

function activeCsaFixture(id = 'csa_0') {
  return [{ id, active: true, source_type: 'preset', content: '테스트', strength: 'weak', preset: { affected_group: 'company_employee', mode: 'on_player_request' } }];
}

test('runtime tracking: Story 후행 active 관찰은 action_state metadata 없이 executed로 기록한다', () => {
  const activeCsa = activeCsaFixture();
  const result = buildCsaSceneRuntimeStatePatch({
    previousSave: {},
    csaRuntimeUpdates: [{ csa_id: 'csa_0', character_id: 'heroine1', status: 'active', action_state: 'relieve_tension' }],
    csaTriggerEvaluations: [],
    activeCsa,
    npcsPresent: ['heroine1'],
    turnNumber: 5
  });
  assert.ok(result.patch, 'a runtime update should produce a patch');
  assert.equal(result.patch.csa_0.lifecycle, 'active');
  assert.equal(result.patch.csa_0.execution_state, 'executed');
  assert.equal(result.patch.csa_0.character_id, 'heroine1');
  assert.equal(result.patch.csa_0.last_confirmed_turn, 5);

  // The next turn's reducer call must see this exact state carried forward unchanged
  // when no new update arrives — this is the "persists into next turn's Context" contract.
  const nextTurnPatch = buildCsaSceneRuntimeStatePatch({
    previousSave: { csa_runtime_state: result.patch },
    csaRuntimeUpdates: [],
    csaTriggerEvaluations: [],
    activeCsa,
    npcsPresent: ['heroine1'],
    turnNumber: 6
  });
  assert.equal(nextTurnPatch.patch, null, 'nothing changed, so the reducer reports no patch (previous state remains authoritative as-is)');
});

test('runtime tracking: action_state는 preset metadata와 비교하지 않고 Story 관찰을 기록한다', () => {
  const activeCsa = activeCsaFixture();
  const previousSave = {
    csa_runtime_state: { csa_0: { lifecycle: 'active', applicability: 'applicable', execution_state: 'not_started', character_id: 'heroine1', started_turn: null, last_confirmed_turn: 4, end_reason: null } }
  };
  const result = buildCsaSceneRuntimeStatePatch({
    previousSave,
    csaRuntimeUpdates: [{ csa_id: 'csa_0', character_id: 'heroine1', status: 'active', action_state: 'unrelated_action' }],
    csaTriggerEvaluations: [],
    activeCsa,
    npcsPresent: ['heroine1'],
    turnNumber: 5
  });
  // 구조·범위 검증 — Story quote/evidence 검사는 사용하지 않지만,
  assert.equal(result.patch.csa_0.execution_state, 'executed');
  assert.equal(result.warnings.some(w => w.includes('action_state_mismatch')), false);
});

test('runtime tracking: trigger evaluation은 execution_state를 강등하지 않는다 (not_satisfied/temporarily_interrupted)', () => {
  const activeCsa = activeCsaFixture();
  const previousSave = {
    csa_runtime_state: { csa_0: { lifecycle: 'active', applicability: 'applicable', execution_state: 'executed', character_id: 'heroine1', started_turn: 3, last_confirmed_turn: 3, end_reason: null } }
  };
  const result = buildCsaSceneRuntimeStatePatch({
    previousSave,
    csaRuntimeUpdates: [],
    csaTriggerEvaluations: [{ csa_id: 'csa_0', status: 'temporarily_interrupted' }],
    activeCsa,
    npcsPresent: ['heroine1'],
    turnNumber: 4
  });
  // trigger evaluation은 execution_state를 변경하지 않는다 (57턴 역행 방지)
  assert.equal(result.patch, null, 'trigger evaluation은 execution_state를 바꾸지 않는다');

  const notSatisfiedResult = buildCsaSceneRuntimeStatePatch({
    previousSave,
    csaRuntimeUpdates: [],
    csaTriggerEvaluations: [{ csa_id: 'csa_0', status: 'not_satisfied' }],
    activeCsa,
    npcsPresent: ['heroine1'],
    turnNumber: 4
  });
  assert.equal(notSatisfiedResult.patch, null, 'not_satisfied도 execution_state를 강등하지 않는다');
});

test('runtime tracking: a csa_runtime_updates status="ended" report transitions execution_state back to "not_started" with an end_reason', () => {
  const activeCsa = activeCsaFixture();
  const previousSave = {
    csa_runtime_state: { csa_0: { lifecycle: 'active', applicability: 'applicable', execution_state: 'executed', character_id: 'heroine1', started_turn: 2, last_confirmed_turn: 2, end_reason: null } }
  };
  const result = buildCsaSceneRuntimeStatePatch({
    previousSave,
    csaRuntimeUpdates: [{ csa_id: 'csa_0', character_id: 'heroine1', status: 'ended', reason: '업무 종료' }],
    csaTriggerEvaluations: [],
    activeCsa,
    npcsPresent: ['heroine1'],
    turnNumber: 6
  });
  assert.ok(result.patch);
  assert.equal(result.patch.csa_0.execution_state, 'not_started');
  assert.equal(result.patch.csa_0.end_reason, '업무 종료');
});

// ---------- App button toolbar gating ----------

const readyContext = { save: { data: { player_setup: { completed: true }, opening_state: { status: 'complete' } } } };

test('toolbar: the app button is disabled before player_setup or opening is complete', () => {
  assert.equal(toolbarCapabilities({}, null, { context: undefined }).canOpenApps, false, 'no context at all');
  assert.equal(toolbarCapabilities({}, null, { context: { save: { data: { player_setup: { completed: false }, opening_state: { status: 'complete' } } } } }).canOpenApps, false, 'setup incomplete');
  assert.equal(toolbarCapabilities({}, null, { context: { save: { data: { player_setup: { completed: true }, opening_state: { status: 'pending' } } } } }).canOpenApps, false, 'opening not complete');
  assert.equal(toolbarCapabilities({}, null, { context: readyContext }).canOpenApps, true, 'setup and opening both complete, otherwise idle');
});

test('toolbar: the app button is disabled while busy, while a turn is pending, or during recovery', () => {
  assert.equal(toolbarCapabilities({}, null, { context: readyContext, busy: true }).canOpenApps, false, 'busy');
  assert.equal(toolbarCapabilities({}, { action_id: 'pending' }, { context: readyContext }).canOpenApps, false, 'pending action');
  assert.equal(toolbarCapabilities({}, null, { context: readyContext, recoveryPending: true }).canOpenApps, false, 'recovery pending');
  assert.equal(toolbarCapabilities({}, null, { context: readyContext, busy: false, recoveryPending: false }).canOpenApps, true, 'none of the blockers apply');
});

test('deactivate aftermath: the executing NPC is identified from runtime_state and gets a fresh shock-phase aftereffect entry, current physical state untouched', () => {
  const previousSave = {
    csa_rules: { csa_0: { active: false, content: '테스트 규범', strength: 'medium' } },
    csa_runtime_state: { csa_0: { lifecycle: 'deactivated', applicability: 'not_applicable', execution_state: 'executed', character_id: 'heroine1', started_turn: 1, last_confirmed_turn: 7, end_reason: null } },
    csa_aftereffect_state: {}
  };
  const patch = buildCsaAftereffectPatch({ previousSave, deactivatedIds: ['csa_0'], npcsPresent: ['heroine1'], turnNumber: 8 });
  assert.ok(patch, 'an executing NPC should be identifiable and produce an aftermath entry');
  assert.equal(patch.heroine1.csa_0.phase, 'shock');
  assert.equal(patch.heroine1.csa_0.canonical_content, '테스트 규범');
  // No player/npc physical-state fields are touched by this patch — it is purely a memory/aftermath ledger.
  assert.equal(previousSave.csa_rules.csa_0.active, false);
});
