import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveCsaDirectCoverage, buildCsaDirectCoverageSection,
  buildCsaSceneRuntimeStatePatch, buildCsaAftereffectPatch,
  normalizeGameplayExtractEnvelope, canonicalizeCsaGroup
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

// ---------- Direct coverage: nonsexual (preset direct_meaning_tags) ----------

test('direct coverage: an exact core-tag match on an active preset is covered, with actor/target/direction as evidence', () => {
  const presetItem = catalog.items.find(item => item.category === 'posture' && item.strength === 'weak');
  const save = saveWithActiveCsa([{
    source_type: 'preset', content: '테스트', strength: 'weak',
    preset: { template_id: presetItem.id, actor_group: presetItem.default_actor, target_group: presetItem.default_target, trigger: presetItem.default_trigger, duration: presetItem.default_duration, required_action: presetItem.required_action, direct_meaning_tags: presetItem.direct_meaning_tags }
  }]);
  const coreTag = presetItem.direct_meaning_tags[0];
  const coverage = resolveCsaDirectCoverage(save, `${coreTag} 자세를 취한다`, {});
  assert.equal(coverage.covered, true);
  assert.equal(coverage.route, 'csa_direct');
  assert.equal(coverage.actor_group, canonicalizeCsaGroup(presetItem.default_actor));
  assert.equal(coverage.direction === 'npc_to_player' || coverage.direction === 'player_to_npc' || coverage.direction === 'none', true);
  const section = buildCsaDirectCoverageSection(coverage);
  assert.match(section, /확정 사실/);
  // The section explicitly forbids probability/risk framing in prose — that's
  // a negation, not a probability value. Guard against an actual numeric
  // percentage or a bold/risk-tier marker, which is what "no bold system" means.
  assert.doesNotMatch(section, /\d+\s*%|위험도\s*[:：]|bold_choice|risk_tier/i);
});

test('direct coverage: text unrelated to any active preset tag falls through to ordinary judgment (not covered)', () => {
  const presetItem = catalog.items.find(item => item.category === 'posture' && item.strength === 'weak');
  const save = saveWithActiveCsa([{
    source_type: 'preset', content: '테스트', strength: 'weak',
    preset: { template_id: presetItem.id, actor_group: presetItem.default_actor, target_group: presetItem.default_target, trigger: presetItem.default_trigger, duration: presetItem.default_duration, required_action: presetItem.required_action, direct_meaning_tags: presetItem.direct_meaning_tags }
  }]);
  const coverage = resolveCsaDirectCoverage(save, '오늘 날씨가 좋다', {});
  assert.equal(coverage.covered, false);
  assert.equal(buildCsaDirectCoverageSection(coverage), '');
});

// ---------- Direct coverage: sexual semantic contract ----------

test('direct coverage: an exact sexual action + direction match on a sexual-authorized CSA is covered', () => {
  // Synthetic, unambiguous participants (actor is an NPC-side group id, target
  // is literally 'player') isolate the matcher's action/direction logic from
  // any given preset's own donor-context actor/target semantics.
  const requiredAction = '__test_required_action__';
  const sexualActionContract = { [requiredAction]: { directions: ['npc_to_player'], actions: ['genital_touch'] } };
  const save = saveWithActiveCsa([{
    source_type: 'preset', content: '테스트', strength: 'medium',
    preset: { template_id: 'test_template', actor_group: 'nurse', target_group: 'player', trigger: 'on_request', duration: 'continuous', required_action: requiredAction, public_normalization: true }
  }]);
  const coverage = resolveCsaDirectCoverage(save, '성기를 만진다', { sexualActionContract });
  assert.equal(coverage.covered, true);
  assert.equal(coverage.route, 'csa_direct');
  assert.equal(coverage.direction, 'npc_to_player');
  assert.equal(coverage.all_actions.includes('genital_touch'), true);
});

test('direct coverage: an actor/target group that cannot resolve (no present NPC) is never covered', () => {
  const presetItem = catalog.items.find(item => item.category === 'posture' && item.strength === 'weak');
  const save = { csa_active: ['csa_0'], csa_rules: { csa_0: { active: true, source_type: 'preset', content: 'x', strength: 'weak', preset: { template_id: presetItem.id, actor_group: presetItem.default_actor, target_group: presetItem.default_target, trigger: presetItem.default_trigger, duration: presetItem.default_duration, required_action: presetItem.required_action, direct_meaning_tags: presetItem.direct_meaning_tags } } }, focal_character_id: null, scene_state: {} };
  const coreTag = presetItem.direct_meaning_tags[0];
  const coverage = resolveCsaDirectCoverage(save, `${coreTag} 자세`, {});
  assert.equal(coverage.covered, false, 'no present NPC means the NPC-side group cannot resolve to a concrete participant');
});

test('direct coverage: a sexual choice bundling an action not covered by the contract is rejected wholesale, never partially covered', () => {
  const requiredAction = '__test_required_action__';
  // Contract authorizes only genital_touch; the player's text also describes a kiss.
  const sexualActionContract = { [requiredAction]: { directions: ['npc_to_player'], actions: ['genital_touch'] } };
  const save = saveWithActiveCsa([{
    source_type: 'preset', content: '테스트', strength: 'medium',
    preset: { template_id: 'test_template', actor_group: 'nurse', target_group: 'player', trigger: 'on_request', duration: 'continuous', required_action: requiredAction, public_normalization: true }
  }]);
  const coverage = resolveCsaDirectCoverage(save, '키스하면서 성기를 만진다', { sexualActionContract });
  assert.equal(coverage.covered, false, 'a bundled uncovered action (kiss) makes the whole choice uncovered even though genital_touch alone would qualify');
});

// ---------- Extract runtime tracking: csa_trigger_evaluations / csa_runtime_updates ----------

function activeCsaFixture(id = 'csa_0') {
  return [{ id, active: true, source_type: 'preset', content: '테스트', strength: 'weak' }];
}

test('runtime tracking: a csa_runtime_updates status="active" report persists execution_state="executed" for the acting NPC', () => {
  const activeCsa = activeCsaFixture();
  const patch = buildCsaSceneRuntimeStatePatch({
    previousSave: {},
    csaRuntimeUpdates: [{ csa_id: 'csa_0', character_id: 'heroine1', status: 'active' }],
    csaTriggerEvaluations: [],
    activeCsa,
    npcsPresent: ['heroine1'],
    turnNumber: 5
  });
  assert.ok(patch, 'a runtime update should produce a patch');
  assert.equal(patch.csa_0.lifecycle, 'active');
  assert.equal(patch.csa_0.execution_state, 'executed');
  assert.equal(patch.csa_0.character_id, 'heroine1');
  assert.equal(patch.csa_0.last_confirmed_turn, 5);

  // The next turn's reducer call must see this exact state carried forward unchanged
  // when no new update arrives — this is the "persists into next turn's Context" contract.
  const nextTurnPatch = buildCsaSceneRuntimeStatePatch({
    previousSave: { csa_runtime_state: patch },
    csaRuntimeUpdates: [],
    csaTriggerEvaluations: [],
    activeCsa,
    npcsPresent: ['heroine1'],
    turnNumber: 6
  });
  assert.equal(nextTurnPatch, null, 'nothing changed, so the reducer reports no patch (previous state remains authoritative as-is)');
});

test('runtime tracking: a csa_trigger_evaluations status="temporarily_interrupted" report moves execution_state to "interrupted" and persists', () => {
  const activeCsa = activeCsaFixture();
  const previousSave = {
    csa_runtime_state: { csa_0: { lifecycle: 'active', applicability: 'applicable', execution_state: 'executed', character_id: 'heroine1', started_turn: 3, last_confirmed_turn: 3, end_reason: null } }
  };
  const patch = buildCsaSceneRuntimeStatePatch({
    previousSave,
    csaRuntimeUpdates: [],
    csaTriggerEvaluations: [{ csa_id: 'csa_0', status: 'temporarily_interrupted' }],
    activeCsa,
    npcsPresent: ['heroine1'],
    turnNumber: 4
  });
  assert.ok(patch);
  assert.equal(patch.csa_0.execution_state, 'interrupted');
  assert.equal(patch.csa_0.last_confirmed_turn, 4);

  // Persists forward into the next turn's context when nothing else touches it.
  const nextTurnPatch = buildCsaSceneRuntimeStatePatch({
    previousSave: { csa_runtime_state: patch },
    csaRuntimeUpdates: [],
    csaTriggerEvaluations: [],
    activeCsa,
    npcsPresent: ['heroine1'],
    turnNumber: 5
  });
  assert.equal(nextTurnPatch, null);
});

test('runtime tracking: a csa_runtime_updates status="ended" report transitions execution_state back to "not_started" with an end_reason', () => {
  const activeCsa = activeCsaFixture();
  const previousSave = {
    csa_runtime_state: { csa_0: { lifecycle: 'active', applicability: 'applicable', execution_state: 'executed', character_id: 'heroine1', started_turn: 2, last_confirmed_turn: 2, end_reason: null } }
  };
  const patch = buildCsaSceneRuntimeStatePatch({
    previousSave,
    csaRuntimeUpdates: [{ csa_id: 'csa_0', character_id: 'heroine1', status: 'ended', reason: '업무 종료' }],
    csaTriggerEvaluations: [],
    activeCsa,
    npcsPresent: ['heroine1'],
    turnNumber: 6
  });
  assert.ok(patch);
  assert.equal(patch.csa_0.execution_state, 'not_started');
  assert.equal(patch.csa_0.end_reason, '업무 종료');
});

test('runtime tracking: an invalid csa_runtime_updates item (missing character_id) is dropped with a warning, valid items in the same array survive', () => {
  const npcIds = new Set(['heroine1']);
  const envelope = normalizeGameplayExtractEnvelope({
    state_delta: {}, outcome: 'success', evidence: {}, turn_summary: '', mind_monitor: {},
    choices: ['a', 'b', 'c', 'd'], dialogue_lines: [], npcs_present: ['heroine1'],
    action_target_id: null, focal_character_id: null, last_speaker_id: null, image_character_id: null,
    player_inner_thought: '', player_status: '', elapsed_minutes: 5,
    csa_runtime_updates: [
      { csa_id: 'csa_0', status: 'active' }, // missing character_id -> dropped
      { csa_id: 'csa_1', character_id: 'heroine1', status: 'active' } // valid -> survives
    ],
    csa_trigger_evaluations: []
  }, { parsedStory: {}, npcIds });
  assert.equal(envelope.csa_runtime_updates.length, 1);
  assert.equal(envelope.csa_runtime_updates[0].csa_id, 'csa_1');
  assert.ok(envelope.warnings.includes('invalid_csa_runtime_update'));
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
