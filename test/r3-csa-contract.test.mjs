import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { canonicalActors } from '../runtime-r3/domain/content.js';
import { applyR3Csa, buildActiveS1StoryBinding, buildRuleChangeInstitutionalAnnouncement, buildRuleChangeStoryBinding, createR3CsaCatalog, R3_CSA_TEMPLATE_IDS } from '../runtime-r3/domain/csa.js';
import { buildStoryContext } from '../runtime-r3/domain/memory.js';
import { createR3Worker } from '../runtime-r3/server/worker.js';
import { InMemoryR3Store } from '../runtime-r3/server/store.js';
import { createCsaDraft, csaDraftOperation, stageCsaOperation } from '../frontend-r3/csa-draft.js';
import { csaConflictMessage, csaSelectorOperation, isCsaSelectorOperationReady, mergeCsaSelectorActor, mergeCsaSelectorScope, playerFacingS1ActionLabels, playerFacingTierLabel } from '../frontend-r3/csa.js';
import { createR3Client } from '../frontend-r3/r3-client.js';
import { isR3CsaCompatibilityConflict, playerFacingStatus } from '../frontend-r3/status.js';

const content = loadCanonicalCompanyR3Content();
const GAME_ACCESS_SECRET = 'r3-test-secret';
const profile = {
  name: 'R3 Player', department_id: content.departments[0].department_id, position_id: content.positions[0].position_id,
  age: 29, height_cm: 178, weight_kg: 72, penis_length_cm: 14,
  body_type_id: content.bodyTypes[0].body_type_id, speech_style_id: content.speechStyles[0].speech_style_id
};

async function events(response) {
  const text = await response.text();
  return [...text.matchAll(/event: ([^\n]+)\ndata: ([^\n]+)/g)].map(match => ({ event: match[1], data: JSON.parse(match[2]) }));
}

async function setupGame(worker) {
  const response = await worker.fetch(new Request('https://r3.test/api/r3/games', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profile }) }));
  const payload = await response.json(); const gameId = payload.data.game.game_id;
  return { gameId, auth: { authorization: `Bearer ${payload.data.game_capability}` } };
}

async function postTurn(worker, gameId, auth, payload) {
  return events(await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/turn`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify(payload) })));
}

function providerFor({ failCsa = false, calls = [] } = {}) {
  return {
    async *story({ opening = false, literalAction = '', csaOperation = null, ruleChangeBinding = null }) {
      calls.push({ stage: 'story', literalAction, csaOperation, ruleChangeBinding });
      if (failCsa && csaOperation) throw new Error('csa_story_failed');
      const prefix = opening ? 'Opening' : `Story: ${literalAction}`;
      yield `${prefix}\n\n1. Continue naturally\n2. Move to the next scene\n3. Speak with the colleague\n4. Write a free action`;
    },
    async observe({ literalAction, csaOperation, storyText }) {
      calls.push({ stage: 'observer', literalAction, csaOperation });
      return { choices: ['Continue naturally', 'Move to the next scene', 'Speak with the colleague', 'Write a free action'], turn_summary: storyText.slice(0, 80), mind_monitor: {} };
    }
  };
}

class RecordingStore extends InMemoryR3Store {
  constructor() { super(); this.reservations = []; }
  reserveTurn(input) { this.reservations.push(input); return super.reserveTurn(input); }
}

async function openGame(worker, gameId, auth) {
  const opening = await events(await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/opening`, { method: 'POST', headers: auth })));
  assert.equal(opening.at(-1).data.status, 'committed');
}

test('R3 CSA catalog is the bounded 21-slot canonical catalog with explicit lineage', () => {
  const catalog = createR3CsaCatalog(content.csaPresets);
  assert.deepEqual(catalog.items.map(item => item.id), R3_CSA_TEMPLATE_IDS);
  assert.equal(catalog.items.length, 21);
  assert.deepEqual(catalog.items.slice(0, 7).map(item => item.tier), Array(7).fill('weak'));
  assert.deepEqual(catalog.items.slice(7, 14).map(item => item.tier), Array(7).fill('medium'));
  assert.deepEqual(catalog.items.slice(14).map(item => item.tier), Array(7).fill('strong'));
  assert.equal(catalog.compatibility_lineage.no_bra_under_work_clothes, 'no_bra_under_work_clothes');
  assert.equal(catalog.compatibility_lineage.work_nude, 'work_nude');
  assert.deepEqual(catalog.items.map(item => item.selector_schema), [
    'none', 'none', 'none', 'actor_pair', 'actor_pair', 'actor_pair', 'actor_pair',
    'none', 'none', 'actor_pair', 'actor_pair', 'actor_pair', 'actor_pair', 'actor_pair',
    'actor_pair', 'named_actor', 'named_actor', 'actor_pair', 'named_actor', 'named_actor', 'actor_pair'
  ]);
  assert.deepEqual(catalog.items.slice(9, 14).map(item => item.counterparty_scopes), [
    ['male_employee'], ['male_employee'], ['male_employee'], ['female_employee', 'male_employee'], ['male_employee', 'female_employee']
  ]);
  assert.equal(catalog.items.find(item => item.slot === 'S2').id, 'player_dedicated_sexual_support_designation');
  assert.equal(catalog.items.find(item => item.slot === 'S7').selector_schema, 'actor_pair');
  assert.deepEqual(catalog.compatibility_conflicts.map(item => [item.left_slot, item.right_slot]), [['W3', 'M1'], ['W3', 'M2'], ['W1', 'M1'], ['W2', 'M1']]);
  assert.ok(catalog.items.every(item => !/^(?:W|M|S)[1-7]$/.test(item.id)));
  assert.ok(catalog.retired_template_ids.includes('continue_until_recipient_orgasm'));
});

test('bounded clothing projection remains a pure state projection; active UI path is a turn', () => {
  const state = { revision: 2, committed_turn: 4, scene: { present_actor_ids: ['heroine1', 'general_park_jungwoo'] }, csa_active: [], csa_rules: {}, clothing: {} };
  const next = applyR3Csa({ state, content, rawOperations: [{ operation: 'activate', template_id: 'no_bra_under_work_clothes', subject_scope: 'female_employee', subject_actor_id: 'heroine1' }] });
  assert.equal(next.committed_turn, 4);
  assert.equal(next.clothing.heroine1.underwear_top, 'removed');
});

test('worker.fetch returns the structured conflict before reserve, Story, Observer, or Commit', async () => {
  const store = new RecordingStore(); const calls = [];
  const worker = createR3Worker({ store, provider: providerFor({ calls }), content, gameAccessSecret: GAME_ACCESS_SECRET });
  const { gameId, auth } = await setupGame(worker); await openGame(worker, gameId, auth);
  await postTurn(worker, gameId, auth, { action_id: 'worker-w3', expected_turn: 1, literal_action: 'Apply W3', csa_operation: { operation: 'activate', template_id: 'cleavage_exposed_work', subject_scope: 'female_employee' } });
  const before = await (await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/context`, { headers: auth }))).json();
  const reservationsBefore = store.reservations.length; const callsBefore = calls.length;
  const response = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/turn`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ action_id: 'worker-m1-conflict', expected_turn: 2, literal_action: 'Apply M1', csa_operation: { operation: 'activate', template_id: 'work_in_underwear_only', subject_scope: 'female_employee' } }) }));
  const payload = await response.json();
  assert.equal(response.status, 400); assert.equal(payload.ok, false); assert.match(payload.data.code, /^r3_csa_compatibility_conflict:/);
  assert.equal(store.reservations.length, reservationsBefore); assert.equal(calls.length, callsBefore);
  const after = (await (await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/context`, { headers: auth }))).json()).data;
  assert.equal(after.state.revision, before.data.state.revision); assert.equal(after.state.committed_turn, before.data.state.committed_turn); assert.deepEqual(after.state.state.csa_active, before.data.state.state.csa_active);
});

test('conflict classification preserves exact player-facing copy through submit and CSA draft', async () => {
  const error = { code: 'r3_csa_compatibility_conflict:가슴골 노출 근무와 속옷 근무는 같은 여성 직원 범위에서 동시에 적용할 수 없습니다.' };
  assert.equal(isR3CsaCompatibilityConflict(error), true); assert.equal(isR3CsaCompatibilityConflict({ code: 'r3_stream_reconnect_required' }), false);
  const message = playerFacingStatus(error); assert.match(message, /가슴골 노출 근무/); assert.match(message, /속옷 근무/); assert.doesNotMatch(message, /r3_/);
  assert.equal(csaConflictMessage(error), message); assert.equal(csaConflictMessage({ code: 'r3_stream_reconnect_required' }), null);
  const client = createR3Client('/api/r3', { storage: { getItem: () => 'cap' }, fetchImpl: async () => new Response(JSON.stringify({ ok: false, data: error }), { status: 400, headers: { 'content-type': 'application/json' } }) });
  await assert.rejects(client.turn('game', { action_id: 'conflict' }), caught => caught.code === error.code);
  const app = fs.readFileSync(new URL('../frontend-r3/app.js', import.meta.url), 'utf8'); const csa = fs.readFileSync(new URL('../frontend-r3/csa.js', import.meta.url), 'utf8');
  assert.match(app, /isR3CsaCompatibilityConflict\(error\)/); assert.match(app, /conflictMessage/); assert.match(csa, /result\?\.conflictMessage/); assert.match(csa, /csaConflictMessage\(error\)/);
});

test('named strong selectors stay bounded and the server records one structured rule-change event', () => {
  const state = { revision: 0, committed_turn: 0, scene: { present_actor_ids: ['heroine1'] }, csa_active: [], csa_rules: {}, clothing: {} };
  const next = applyR3Csa({ state, content, rawOperations: [{ operation: 'activate', template_id: 'S2', subject_scope: 'female_employee', counterparty_scope: 'player', subject_actor_id: 'heroine1' }] });
  const rule = next.csa_rules[next.csa_active[0]];
  assert.equal(rule.template_id, 'player_dedicated_sexual_support_designation');
  assert.deepEqual(rule.selector, { subject_actor_id: 'heroine1' });
  assert.equal(next.last_rule_change.type, 'rule_change_turn');
  assert.equal(next.last_rule_change.slot, 'S2');
  assert.throws(() => applyR3Csa({ state, content, rawOperations: [{ operation: 'activate', template_id: 'S2', subject_scope: 'female_employee', subject_actor_id: 'not-registered' }] }), /actor_selector_invalid/);
});

test('rule-change Story binding preserves exact W5 actors and direction without player substitution', () => {
  const state = { revision: 0, committed_turn: 0, scene: { present_actor_ids: ['heroine5', 'general_park_jungwoo'] }, csa_active: [], csa_rules: {}, clothing: {} };
  const next = applyR3Csa({ state, content, rawOperations: [{ operation: 'activate', template_id: 'breast_touch_conversation', subject_scope: 'female_employee', counterparty_scope: 'male_employee', subject_actor_id: 'heroine5', counterparty_actor_id: 'general_park_jungwoo' }] });
  const binding = buildRuleChangeStoryBinding({ event: next.last_rule_change, content });
  assert.equal(binding.rule.template_id, 'breast_touch_conversation'); assert.equal(binding.rule.slot, 'W5');
  assert.deepEqual(binding.selected_actor_ids, ['heroine5', 'general_park_jungwoo']);
  assert.deepEqual(binding.selected_actors.map(actor => [actor.actor_id, actor.name]), [['heroine5', '이메이'], ['general_park_jungwoo', '박정우']]);
  assert.equal(binding.subject.actor_id, 'heroine5'); assert.equal(binding.counterparty.actor_id, 'general_park_jungwoo');
  assert.match(binding.direction, /박정우.*이메이/); assert.doesNotMatch(binding.direction, /player/i);
  assert.match(binding.rule.rule_text, /가슴/);
});

test('finite clothing conflicts reject before a Story reservation and compatible rules remain active', () => {
  const base = { scene: { present_actor_ids: ['heroine1'] }, csa_active: [], csa_rules: {}, clothing: {} };
  const w3 = applyR3Csa({ state: base, content, rawOperations: [{ operation: 'activate', template_id: 'cleavage_exposed_work', subject_scope: 'female_employee' }] });
  assert.throws(() => applyR3Csa({ state: w3, content, rawOperations: [{ operation: 'activate', template_id: 'work_in_underwear_only', subject_scope: 'female_employee' }] }), /r3_csa_compatibility_conflict:.*가슴골 노출 근무.*속옷 근무/);
  const w1 = applyR3Csa({ state: base, content, rawOperations: [{ operation: 'activate', template_id: 'no_bra_under_work_clothes', subject_scope: 'female_employee' }] });
  assert.throws(() => applyR3Csa({ state: w1, content, rawOperations: [{ operation: 'activate', template_id: 'work_in_underwear_only', subject_scope: 'female_employee' }] }), /r3_csa_compatibility_conflict/);
  const compatible = applyR3Csa({ state: base, content, rawOperations: [{ operation: 'activate', template_id: 'no_bra_under_work_clothes', subject_scope: 'female_employee' }] });
  const compatibleNext = applyR3Csa({ state: compatible, content, rawOperations: [{ operation: 'activate', template_id: 'no_panties_under_work_clothes', subject_scope: 'female_employee' }] });
  assert.equal(compatibleNext.csa_active.length, 2);
});

test('server-owned institutional announcement carries exact S7 designation even when Story omits it', () => {
  const state = { scene: { present_actor_ids: ['heroine1', 'heroine2'] }, csa_active: [], csa_rules: {}, clothing: {} };
  const next = applyR3Csa({ state, content, rawOperations: [{ operation: 'activate', template_id: 'sexual_work_training_designation', subject_scope: 'female_employee', counterparty_scope: 'female_employee', subject_actor_id: 'heroine1', counterparty_actor_id: 'heroine2' }] });
  const binding = buildRuleChangeStoryBinding({ event: next.last_rule_change, content });
  const announcement = buildRuleChangeInstitutionalAnnouncement({ event: next.last_rule_change, binding });
  assert.match(announcement, /공식 공지/); assert.match(announcement, /서원희/); assert.match(announcement, /윤민아/); assert.match(announcement, /공식 기관 채널/); assert.doesNotMatch(announcement, /앱|초자연/);
});

test('active S1 projection exposes player authority and exact finite pair binding', () => {
  const state = { profile, scene: { location_id: content.locations[0].location_id, present_actor_ids: ['heroine5', 'general_park_jungwoo'] }, csa_active: ['r3_csa_1'], csa_rules: {
    r3_csa_1: { id: 'r3_csa_1', active: true, slot: 'S1', template_id: 'sexual_work_instruction_authority', content: 'bounded S1', mode: 'on_player_request', trigger: 'on_player_request', subject_scope: 'female_employee', counterparty_scope: 'male_employee', selector: { subject_actor_id: 'heroine5', counterparty_actor_id: 'general_park_jungwoo' }, supported_action_families: ['kiss', 'sexual_touch', 'genital_exposure', 'genital_touch', 'oral', 'penetration'] }
  } };
  const literalAction = 'literal-preserved';
  const context = buildStoryContext({ state: { state }, turns: [] }, literalAction, { content });
  const binding = context.active_s1_story_binding;
  assert.equal(binding.issuer.actor_id, 'player');
  assert.equal(binding.issuer.name, profile.name);
  assert.deepEqual(binding.issuer.canonical_player_identity, { name: profile.name, department: { id: profile.department_id, name: content.departments[0].name }, position: { id: profile.position_id, name: content.positions[0].name } });
  assert.equal(binding.subject.actor_id, 'heroine5');
  assert.equal(binding.subject.name, content.characters.heroine5.name);
  assert.equal(binding.counterparty.actor_id, 'general_park_jungwoo');
  assert.equal(binding.counterparty.name, content.generalNpcs.find(actor => actor.id === 'general_park_jungwoo').name);
  assert.deepEqual(binding.supported_action_families, ['kiss', 'sexual_touch', 'genital_exposure', 'genital_touch', 'oral', 'penetration']);
  assert.match(binding.direction, /player.*issuer|player.*issues/i);
  assert.match(binding.unsupported_boundary, /outside.*not mandatory/i);
  assert.equal(context.literal_action, literalAction);
  assert.equal(context.active_rules[0].selector, undefined);
  assert.equal(binding.immutable, true);
  assert.equal(buildActiveS1StoryBinding({ rule: { ...state.csa_rules.r3_csa_1, active: false }, content }), null);
});

test('active CSA context preserves the exact ordinary literal instead of shadowing actor, target, or action', () => {
  const literalAction = '서원희 차장님, 윤민아 대리에게 오늘 지정된 성적 업무 교육을 어떻게 시작할지 차분히 설명해 주세요.';
  const state = { profile, scene: { location_id: content.locations[0].location_id, present_actor_ids: ['heroine1', 'heroine2'] }, csa_active: ['r3_csa_1'], csa_rules: {
    r3_csa_1: { id: 'r3_csa_1', active: true, slot: 'S7', template_id: 'sexual_work_training_designation', content: 'bounded S7', mode: 'continuous', trigger: 'continuous', subject_scope: 'female_employee', counterparty_scope: 'female_employee', selector: { subject_actor_id: 'heroine1', counterparty_actor_id: 'heroine2' } }
  } };
  const context = buildStoryContext({ state: { state }, turns: [] }, literalAction, { content });
  assert.equal(context.literal_action, literalAction);
  assert.equal(context.active_csa_literal_contract.literal_action, literalAction);
  assert.equal(context.active_csa_literal_contract.preserve_actor_target_action_topic, true);
  assert.equal(context.active_csa_literal_contract.active_rules_may_not_erase_or_redirect_literal, true);
});

/* test('ordinary active S1 Story projection binds player issuer to exact selected pair and finite boundary', () => {
  const state = { profile, scene: { location_id: content.locations[0].location_id, present_actor_ids: ['heroine5', 'general_park_jungwoo'] }, csa_active: ['r3_csa_1'], csa_rules: {
    r3_csa_1: {
      id: 'r3_csa_1', active: true, slot: 'S1', template_id: 'sexual_work_instruction_authority', content: 'bounded S1', mode: 'on_player_request', trigger: 'on_player_request',
      subject_scope: 'female_employee', counterparty_scope: 'male_employee', selector: { subject_actor_id: 'heroine5', counterparty_actor_id: 'general_park_jungwoo' },
      supported_action_families: ['kiss', 'sexual_touch', 'genital_exposure', 'genital_touch', 'oral', 'penetration']
    }
  } };
  const context = buildStoryContext({ state: { state }, turns: [] }, '서원희 차장이 박정우 팀장에게 키스하도록 업무지시한다.', { content });
  assert.deepEqual(context.active_s1_story_binding.issuer, { actor_id: 'player', name: 'player', canonical_name: 'player', role: 'player / authority issuer', scope: 'player' });
  assert.deepEqual([context.active_s1_story_binding.subject.actor_id, context.active_s1_story_binding.subject.name], ['heroine5', '?대찓??]);
  assert.deepEqual([context.active_s1_story_binding.counterparty.actor_id, context.active_s1_story_binding.counterparty.name], ['general_park_jungwoo', '諛뺤젙??']);
  assert.deepEqual(context.active_s1_story_binding.supported_action_families, ['kiss', 'sexual_touch', 'genital_exposure', 'genital_touch', 'oral', 'penetration']);
  assert.match(context.active_s1_story_binding.direction, /player.*issuer|player.*issues/i);
  assert.match(context.active_s1_story_binding.unsupported_boundary, /outside.*not mandatory/i);
  assert.equal(context.literal_action, '서원희 차장이 박정우 팀장에게 키스하도록 업무지시한다.');
  assert.equal(context.active_rules[0].selector, undefined);
  assert.equal(context.active_s1_story_binding.immutable, true);
  assert.equal(buildActiveS1StoryBinding({ rule: { ...state.csa_rules.r3_csa_1, active: false }, content }), null);
});

*/
test('actor-pair Story bindings keep finite direction for W4/W6/W7, M3/M4, and M6/M7', () => {
  const cases = [
    ['lap_facing_conversation', 'W4', 'heroine5', 'general_park_jungwoo', /박정우/],
    ['buttock_touch_conversation', 'W6', 'heroine5', 'general_park_jungwoo', /박정우.*이메이/],
    ['recurring_light_kiss_conversation', 'W7', 'heroine5', 'general_park_jungwoo', /이메이.*박정우/],
    ['breast_stimulation_ejaculation_support', 'M3', 'heroine5', 'general_park_jungwoo', /이메이.*박정우/],
    ['manual_stimulation_ejaculation_support', 'M4', 'heroine5', 'general_park_jungwoo', /이메이.*박정우/],
    ['semen_fatigue_recovery_practice', 'M5', 'heroine5', 'general_park_jungwoo', /이메이.*박정우/],
    ['direct_genital_exam', 'M6', 'general_park_jungwoo', 'heroine5', /이메이.*박정우/],
    ['direct_breast_nipple_exam', 'M7', 'heroine5', 'general_park_jungwoo', /박정우.*이메이/],
    ['sexual_work_instruction_authority', 'S1', 'heroine5', 'general_park_jungwoo', /박정우.*이메이/],
    ['sexual_work_training_designation', 'S7', 'heroine5', 'general_park_jungwoo', /이메이.*박정우/]
  ];
  for (const [template_id, slot, subject_actor_id, counterparty_actor_id, expected] of cases) {
    const item = createR3CsaCatalog(content.csaPresets).items.find(candidate => candidate.id === template_id);
    const next = applyR3Csa({ state: { scene: { present_actor_ids: [subject_actor_id, counterparty_actor_id] }, csa_active: [], csa_rules: {}, clothing: {} }, content, rawOperations: [{ operation: 'activate', template_id, subject_scope: item.default_subject_scope, counterparty_scope: item.default_counterparty_scope, subject_actor_id, counterparty_actor_id }] });
    const binding = buildRuleChangeStoryBinding({ event: next.last_rule_change, content });
    assert.equal(binding.rule.slot, slot); assert.match(binding.direction, expected);
  }
});

test('named designation bindings preserve exact adults and S4 excludes unselected bystanders', () => {
  for (const template_id of ['player_dedicated_sexual_support_designation', 'company_sexual_support_designation', 'sexual_work_assignee_designation', 'sexual_work_performance_evaluation']) {
    const item = createR3CsaCatalog(content.csaPresets).items.find(candidate => candidate.id === template_id);
    const next = applyR3Csa({ state: { scene: { present_actor_ids: ['heroine5'] }, csa_active: [], csa_rules: {}, clothing: {} }, content, rawOperations: [{ operation: 'activate', template_id, subject_scope: item.default_subject_scope, counterparty_scope: item.default_counterparty_scope, subject_actor_id: 'heroine5' }] });
    const binding = buildRuleChangeStoryBinding({ event: next.last_rule_change, content });
    assert.deepEqual(binding.selected_actor_ids, ['heroine5']); assert.equal(binding.selected_actors[0].name, '이메이');
  }
  const next = applyR3Csa({ state: { scene: { present_actor_ids: ['heroine5', 'general_park_jungwoo'] }, csa_active: [], csa_rules: {}, clothing: {} }, content, rawOperations: [{ operation: 'activate', template_id: 'joint_participation_approval', subject_scope: 'female_employee', counterparty_scope: 'male_employee', subject_actor_id: 'heroine5', counterparty_actor_id: 'general_park_jungwoo' }] });
  const binding = buildRuleChangeStoryBinding({ event: next.last_rule_change, content });
  assert.deepEqual(binding.selected_actor_ids, ['heroine5', 'general_park_jungwoo']); assert.match(binding.direction, /unselected bystander/i);
});

test('visible APPLY uses exactly one Story/Observer/commit and never the zero-turn writer', async () => {
  const store = new InMemoryR3Store(); let applyCsaCalls = 0; store.applyCsa = () => { applyCsaCalls += 1; throw new Error('zero_turn_writer_must_not_run'); };
  const calls = []; const worker = createR3Worker({ store, provider: providerFor({ calls }), content, gameAccessSecret: GAME_ACCESS_SECRET }); const { gameId, auth } = await setupGame(worker); await openGame(worker, gameId, auth);
  const operation = { operation: 'activate', template_id: 'no_bra_under_work_clothes', subject_scope: 'female_employee', subject_actor_id: 'heroine1' };
  const result = await postTurn(worker, gameId, auth, { action_id: 'apply-1', expected_turn: 1, literal_action: 'Apply the selected rule for female_employee', csa_operation: operation });
  assert.equal(result.at(-1).data.status, 'committed'); assert.equal(applyCsaCalls, 0);
  assert.equal(result.at(-1).data.context.state.committed_turn, 1); assert.equal(result.at(-1).data.context.turns.length, 2);
  assert.match(result.at(-1).data.context.turns[1].story_text, /\[공식 공지\]/);
  assert.deepEqual(calls.filter(call => call.stage === 'story').at(-1).csaOperation, operation);
  assert.equal(result.at(-1).data.context.state.state.csa_active.length, 1);
});

test('exact W5 browser payload crosses /turn, reserve, Story binding, Observer, and one commit', async () => {
  const store = new RecordingStore(); const calls = [];
  const worker = createR3Worker({ store, provider: providerFor({ calls }), content, gameAccessSecret: GAME_ACCESS_SECRET });
  const { gameId, auth } = await setupGame(worker); await openGame(worker, gameId, auth);
  const literalAction = 'CSA W5 APPLY audit: breast_touch_conversation heroine5 general_park_jungwoo';
  const csaOperation = { operation: 'activate', template_id: 'breast_touch_conversation', subject_scope: 'female_employee', counterparty_scope: 'male_employee', subject_actor_id: 'heroine5', counterparty_actor_id: 'general_park_jungwoo' };
  const result = await postTurn(worker, gameId, auth, { action_id: 'browser-w5-transport', expected_turn: 1, literal_action: literalAction, csa_operation: csaOperation });
  const terminal = result.at(-1).data; assert.equal(terminal.status, 'committed');
  assert.equal(store.reservations.length, 1); assert.equal(store.reservations[0].turnNumber, 1); assert.equal(store.reservations[0].literalAction, literalAction); assert.deepEqual(store.reservations[0].csaOperation, csaOperation);
  const story = calls.find(call => call.stage === 'story' && call.csaOperation); const observer = calls.find(call => call.stage === 'observer' && call.csaOperation);
  assert.deepEqual(story.csaOperation, csaOperation); assert.equal(story.literalAction, ''); assert.deepEqual(story.ruleChangeBinding.selected_actor_ids, ['heroine5', 'general_park_jungwoo']); assert.equal(story.ruleChangeBinding.subject.actor_id, 'heroine5'); assert.equal(story.ruleChangeBinding.counterparty.actor_id, 'general_park_jungwoo');
  assert.equal(observer.literalAction, literalAction); assert.deepEqual(observer.csaOperation, csaOperation);
  assert.equal(terminal.context.state.committed_turn, 1); assert.equal(terminal.context.turns.length, 2); assert.equal(terminal.context.job, null); assert.deepEqual(terminal.context.state.state.last_rule_change.selector, { subject_actor_id: 'heroine5', counterparty_actor_id: 'general_park_jungwoo' }); assert.equal(terminal.context.state.state.last_rule_change.template_id, 'breast_touch_conversation');
  assert.equal(terminal.context.turns[1].literal_action, literalAction);
});

test('legacy /csa endpoint delegates to the same chronological turn stream', async () => {
  const store = new InMemoryR3Store(); let applyCsaCalls = 0; store.applyCsa = () => { applyCsaCalls += 1; throw new Error('zero_turn_writer_must_not_run'); };
  const worker = createR3Worker({ store, provider: providerFor(), content, gameAccessSecret: GAME_ACCESS_SECRET }); const { gameId, auth } = await setupGame(worker); await openGame(worker, gameId, auth);
  const response = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/csa`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ expected_revision: 0, operations: [{ operation: 'activate', template_id: 'work_nude', subject_scope: 'female_employee', subject_actor_id: 'heroine1' }] }) }));
  const result = await events(response); assert.equal(result.at(-1).data.status, 'committed'); assert.equal(applyCsaCalls, 0); assert.equal(result.at(-1).data.context.state.committed_turn, 1);
});

test('CHANGE then REMOVE each consume one turn and preserve historical Story chronology', async () => {
  const worker = createR3Worker({ store: new InMemoryR3Store(), provider: providerFor(), content, gameAccessSecret: GAME_ACCESS_SECRET }); const { gameId, auth } = await setupGame(worker); await openGame(worker, gameId, auth);
  const apply = await postTurn(worker, gameId, auth, { action_id: 'apply-2', expected_turn: 1, literal_action: 'Apply a rule', csa_operation: { operation: 'activate', template_id: 'work_nude', subject_scope: 'female_employee', subject_actor_id: 'heroine1' } });
  const ruleId = apply.at(-1).data.context.state.state.csa_active[0];
  const change = await postTurn(worker, gameId, auth, { action_id: 'change-2', expected_turn: 2, literal_action: 'Change the selected rule', csa_operation: { operation: 'update', id: ruleId, template_id: 'work_in_underwear_only', subject_scope: 'female_employee', subject_actor_id: 'heroine1' } });
  assert.equal(change.at(-1).data.status, 'committed'); assert.equal(change.at(-1).data.context.state.state.csa_rules[ruleId].template_id, 'work_in_underwear_only');
  const remove = await postTurn(worker, gameId, auth, { action_id: 'remove-2', expected_turn: 3, literal_action: 'Remove the selected rule', csa_operation: { operation: 'deactivate', id: ruleId } });
  const final = remove.at(-1).data.context; assert.equal(final.state.committed_turn, 3); assert.equal(final.state.state.csa_active.length, 0); assert.equal(final.turns.length, 4); assert.equal(final.turns[1].literal_action, 'Apply a rule'); assert.equal(final.turns[2].literal_action, 'Change the selected rule'); assert.equal(final.turns[3].literal_action, 'Remove the selected rule'); assert.ok(final.turns.slice(1).every(turn => turn.story_text.length > 0));
});

test('failed CSA Story leaves the previous active-rule state authoritative', async () => {
  const store = new InMemoryR3Store(); const worker = createR3Worker({ store, provider: providerFor({ failCsa: true }), content, gameAccessSecret: GAME_ACCESS_SECRET }); const { gameId, auth } = await setupGame(worker); await openGame(worker, gameId, auth);
  const failed = await postTurn(worker, gameId, auth, { action_id: 'failed-csa', expected_turn: 1, literal_action: 'Apply a rule', csa_operation: { operation: 'activate', template_id: 'work_nude', subject_scope: 'female_employee', subject_actor_id: 'heroine1' } });
  const context = failed.at(-1).data.context; assert.equal(failed.at(-1).data.status, 'failed'); assert.equal(context.state.committed_turn, 0); assert.deepEqual(context.state.state.csa_active, []); assert.equal(context.turns.length, 1); assert.equal(context.job.status, 'failed');
});

test('duplicate operation requests remain fenced to one job and one committed turn', async () => {
  const worker = createR3Worker({ store: new InMemoryR3Store(), provider: providerFor(), content, gameAccessSecret: GAME_ACCESS_SECRET }); const { gameId, auth } = await setupGame(worker); await openGame(worker, gameId, auth);
  const payload = { action_id: 'duplicate-csa', expected_turn: 1, literal_action: 'Apply a rule', csa_operation: { operation: 'activate', template_id: 'work_nude', subject_scope: 'female_employee', subject_actor_id: 'heroine1' } };
  const first = await postTurn(worker, gameId, auth, payload); const second = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/turn`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify(payload) })); const secondPayload = await second.json();
  assert.equal(first.at(-1).data.status, 'committed'); assert.equal(secondPayload.data.reconnect, true); assert.equal((await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/context`, { headers: auth }))).status, 200);
  assert.equal((await secondPayload.data.context).state?.committed_turn ?? 1, 1);
});

test('ordinary free input stays Story-first after a CSA operation', async () => {
  const calls = []; const worker = createR3Worker({ store: new InMemoryR3Store(), provider: providerFor({ calls }), content, gameAccessSecret: GAME_ACCESS_SECRET }); const { gameId, auth } = await setupGame(worker); await openGame(worker, gameId, auth);
  await postTurn(worker, gameId, auth, { action_id: 'apply-ordinary', expected_turn: 1, literal_action: 'Apply a rule', csa_operation: { operation: 'activate', template_id: 'work_nude', subject_scope: 'female_employee', subject_actor_id: 'heroine1' } });
  const ordinary = await postTurn(worker, gameId, auth, { action_id: 'ordinary-after-csa', expected_turn: 2, literal_action: 'I walk to the lounge and greet my colleague.' });
  assert.equal(ordinary.at(-1).data.status, 'committed'); const ruleStory = calls.find(call => call.stage === 'story' && call.csaOperation); assert.equal(ruleStory.literalAction, ''); assert.equal(ruleStory.ruleChangeBinding.rule.template_id, 'work_nude'); assert.equal(calls.at(-2).csaOperation, null); assert.equal(calls.at(-2).literalAction, 'I walk to the lounge and greet my colleague.'); assert.equal(ordinary.at(-1).data.context.turns.at(-1).literal_action, 'I walk to the lounge and greet my colleague.');
});

test('frontend CSA draft UI uses one existing turn handoff and no legacy app writer', () => {
  const source = fs.readFileSync(new URL('../frontend-r3/csa.js', import.meta.url), 'utf8'); const app = fs.readFileSync(new URL('../frontend-r3/app.js', import.meta.url), 'utf8');
  const html = fs.readFileSync(new URL('../frontend-r3/index.html', import.meta.url), 'utf8');
  assert.match(source, /stageCsaOperation/); assert.match(source, /미적용 변경 1건/); assert.match(source, /onOperation/); assert.match(source, /overlay\.hidden = true/); assert.match(source, /상식개변 적용/); assert.doesNotMatch(source, /client\.csa|\/api\/app-state|\/api\/app-validate|batch/i);
  assert.match(html, /data-tab="home"/); assert.match(html, /data-tab="player"/); assert.match(html, /data-tab="npc"/); assert.match(html, /data-tab="csa"/); assert.match(html, /data-tab="manual"/); assert.match(app, /csa_operation/); assert.match(app, /client\.turn/); assert.match(app, /return submit\(literalAction/);
});

test('frontend W5 selector handoff preserves both actor ids through draft and turn payload split', () => {
  const operation = { operation: 'activate', template_id: 'breast_touch_conversation', subject_scope: 'female_employee', counterparty_scope: 'male_employee', subject_actor_id: 'heroine5', counterparty_actor_id: 'general_park_jungwoo' };
  const staged = stageCsaOperation(createCsaDraft({ state: { revision: 7 } }), operation);
  assert.equal(staged.blocked, false); assert.deepEqual(csaDraftOperation(staged.draft), operation);
  const submitted = { literal_action: 'W5 audit', ...csaDraftOperation(staged.draft) }; const { literal_action, ...csaOperation } = submitted;
  assert.equal(literal_action, 'W5 audit'); assert.deepEqual(csaOperation, operation);
  const source = fs.readFileSync(new URL('../frontend-r3/csa.js', import.meta.url), 'utf8'); const app = fs.readFileSync(new URL('../frontend-r3/app.js', import.meta.url), 'utf8');
  assert.match(source, /const operation = clone\(csaDraftOperation\(draft\)\)/); assert.match(source, /onOperation\?\.\(\{ \.\.\.operation, literal_action/); assert.match(app, /const \{ literal_action: literalAction, \.\.\.csaOperation \} = operation/); assert.match(app, /payload\.csa_operation = pendingOperation/);
});

test('real R3 actor catalog preserves canonical gender for bounded selector scopes', async () => {
  assert.equal(content.characters.heroine1.gender, 'female');
  assert.equal(content.characters.heroine2.gender, 'female');
  const ids = ['heroine1', 'heroine2', 'general_park_jungwoo'];
  const projected = canonicalActors(content, ids);
  const projectedById = Object.fromEntries(projected.map(actor => [actor.id, actor]));
  assert.equal(projectedById.heroine1.gender, 'female');
  assert.equal(projectedById.heroine2.gender, 'female');
  assert.equal(projectedById.general_park_jungwoo.sex, 'male');
  for (const actor of projected) assert.doesNotMatch(JSON.stringify(actor), /private_info|voice_id|storage|intimate|body/);

  const worker = createR3Worker({ store: new InMemoryR3Store(), provider: providerFor(), content, gameAccessSecret: GAME_ACCESS_SECRET });
  const response = await worker.fetch(new Request('https://r3.test/api/r3/catalogs'));
  assert.equal(response.status, 200);
  const catalogActors = (await response.json()).data.actors;
  const catalogById = Object.fromEntries(catalogActors.map(actor => [actor.id, actor]));
  assert.equal(catalogById.heroine1.gender, 'female');
  assert.equal(catalogById.heroine2.gender, 'female');
  assert.equal(catalogById.general_park_jungwoo.sex, 'male');
  for (const actor of catalogActors) assert.doesNotMatch(JSON.stringify(actor), /private_info|voice_id|storage|intimate|body/);

  const catalog = createR3CsaCatalog(content.csaPresets);
  const s7 = catalog.items.find(item => item.slot === 'S7');
  let operation = csaSelectorOperation({ item: s7 });
  operation = mergeCsaSelectorActor({ item: s7, operation, side: 'subject', actorId: 'heroine1', actors: catalogActors });
  operation = mergeCsaSelectorActor({ item: s7, operation, side: 'counterparty', actorId: 'heroine2', actors: catalogActors });
  assert.deepEqual(operation, {
    operation: 'activate', template_id: 'sexual_work_training_designation', subject_scope: 'female_employee', counterparty_scope: 'female_employee',
    subject_actor_id: 'heroine1', counterparty_actor_id: 'heroine2'
  });
  assert.equal(isCsaSelectorOperationReady(s7, operation, catalogActors), true);
  assert.doesNotThrow(() => applyR3Csa({ state: { scene: { present_actor_ids: ids }, csa_active: [], csa_rules: {}, clothing: {} }, content, rawOperations: [operation] }));
  const sameScope = mergeCsaSelectorScope({ item: s7, operation, side: 'subject', scope: 'female_employee', actors: catalogActors });
  assert.equal(sameScope.subject_actor_id, 'heroine1');

  const s1 = catalog.items.find(item => item.slot === 'S1');
  let s1Operation = csaSelectorOperation({ item: s1 });
  s1Operation = mergeCsaSelectorActor({ item: s1, operation: s1Operation, side: 'subject', actorId: 'heroine1', actors: catalogActors });
  s1Operation = mergeCsaSelectorActor({ item: s1, operation: s1Operation, side: 'counterparty', actorId: 'general_park_jungwoo', actors: catalogActors });
  assert.deepEqual(s1Operation, {
    operation: 'activate', template_id: 'sexual_work_instruction_authority', subject_scope: 'female_employee', counterparty_scope: 'male_employee',
    subject_actor_id: 'heroine1', counterparty_actor_id: 'general_park_jungwoo'
  });
});

test('frontend bounded selectors merge actor ids and resolve compatible scopes', () => {
  const catalog = createR3CsaCatalog(content.csaPresets);
  const s7 = catalog.items.find(item => item.slot === 'S7');
  const s1 = catalog.items.find(item => item.slot === 'S1');
  const actors = [
    { id: 'heroine1', gender: 'female' }, { id: 'heroine2', gender: 'female' }, { id: 'heroine5', gender: 'female' },
    { id: 'general_park_jungwoo', gender: 'male' }
  ];
  let s7Operation = csaSelectorOperation({ item: s7 });
  s7Operation = mergeCsaSelectorActor({ item: s7, operation: s7Operation, side: 'subject', actorId: 'heroine1', actors });
  s7Operation = mergeCsaSelectorActor({ item: s7, operation: s7Operation, side: 'counterparty', actorId: 'heroine2', actors });
  assert.deepEqual(s7Operation, {
    operation: 'activate', template_id: 'sexual_work_training_designation', subject_scope: 'female_employee', counterparty_scope: 'female_employee',
    subject_actor_id: 'heroine1', counterparty_actor_id: 'heroine2'
  });
  assert.equal(isCsaSelectorOperationReady(s7, s7Operation, actors), true);
  const applied = applyR3Csa({ state: { scene: { present_actor_ids: ['heroine1', 'heroine2'] }, csa_active: [], csa_rules: {}, clothing: {} }, content, rawOperations: [s7Operation] });
  assert.deepEqual(applied.last_rule_change.selector, { subject_actor_id: 'heroine1', counterparty_actor_id: 'heroine2' });

  const changedTrainer = mergeCsaSelectorActor({ item: s7, operation: s7Operation, side: 'subject', actorId: 'heroine5', actors });
  assert.equal(changedTrainer.subject_actor_id, 'heroine5'); assert.equal(changedTrainer.counterparty_actor_id, 'heroine2');
  const femaleCounterparty = mergeCsaSelectorScope({ item: s7, operation: changedTrainer, side: 'counterparty', scope: 'female_employee', actors });
  assert.equal(femaleCounterparty.counterparty_actor_id, 'heroine2');
  const maleCounterparty = mergeCsaSelectorScope({ item: s7, operation: femaleCounterparty, side: 'counterparty', scope: 'male_employee', actors });
  assert.equal(maleCounterparty.counterparty_actor_id, undefined); assert.equal(maleCounterparty.subject_actor_id, 'heroine5');
  assert.equal(isCsaSelectorOperationReady(s7, maleCounterparty, actors), false);

  let s1Operation = csaSelectorOperation({ item: s1 });
  s1Operation = mergeCsaSelectorActor({ item: s1, operation: s1Operation, side: 'subject', actorId: 'heroine1', actors });
  s1Operation = mergeCsaSelectorActor({ item: s1, operation: s1Operation, side: 'counterparty', actorId: 'general_park_jungwoo', actors });
  assert.deepEqual(s1Operation, {
    operation: 'activate', template_id: 'sexual_work_instruction_authority', subject_scope: 'female_employee', counterparty_scope: 'male_employee',
    subject_actor_id: 'heroine1', counterparty_actor_id: 'general_park_jungwoo'
  });
  assert.equal(isCsaSelectorOperationReady(s7, csaSelectorOperation({ item: s7 }), actors), false);
  assert.equal(isCsaSelectorOperationReady(s7, { ...s7Operation, counterparty_scope: 'male_employee' }, actors), false);
  const source = fs.readFileSync(new URL('../frontend-r3/csa.js', import.meta.url), 'utf8');
  assert.match(source, /isCsaSelectorOperationReady\(item, operation, catalog\(\)\.actors\)/);
});

test('frontend CSA exposes the three canonical tiers and no exact-nine label', () => {
  const source = fs.readFileSync(new URL('../frontend-r3/csa.js', import.meta.url), 'utf8');
  assert.match(source, /csa-tier-tabs/); assert.match(source, /dataset\.tier/); assert.match(source, /약함/); assert.match(source, /중간/); assert.match(source, /강함/); assert.doesNotMatch(source, /9-rule/);
});

test('player-facing CSA projection localizes finite S1 families and hides internal fallbacks', () => {
  assert.deepEqual(playerFacingS1ActionLabels(['kiss', 'sexual_touch', 'genital_exposure', 'genital_touch', 'oral', 'penetration']), ['키스', '성적 접촉', '성기 노출', '성기 접촉', '구강 자극', '삽입 행위']);
  assert.deepEqual(playerFacingS1ActionLabels(['future_internal_family']), []);
  assert.equal(playerFacingTierLabel('weak'), '약함');
  assert.equal(playerFacingTierLabel('medium'), '중간');
  assert.equal(playerFacingTierLabel('strong'), '강함');
  assert.equal(playerFacingTierLabel('future_internal_tier'), '규칙');
  const renderedActionText = playerFacingS1ActionLabels(['kiss', 'sexual_touch', 'genital_exposure', 'genital_touch', 'oral', 'penetration']).join(', ');
  assert.doesNotMatch(renderedActionText, /sexual_touch|genital_exposure|genital_touch|\boral\b|\bpenetration\b/);
});

test('player-facing CSA copy does not expose stale or technical presentation metadata', () => {
  const source = fs.readFileSync(new URL('../frontend-r3/csa.js', import.meta.url), 'utf8');
  assert.match(source, /지원 범위/);
  assert.match(source, /상식개변 규칙/);
  assert.match(source, /총 21개의 규칙/);
  assert.doesNotMatch(source, /21-slot canonical catalog|world_behavior|9개 프리셋 규칙/);
});

test('Story/Observer boundary states that compliance does not prove private positive emotion', () => {
  const provider = fs.readFileSync(new URL('../runtime-r3/server/provider.js', import.meta.url), 'utf8');
  assert.match(provider, /pending_csa_operation/); assert.match(provider, /Compliance with an institutional rule/); assert.match(provider, /independent Story\/character evidence/);
  assert.match(provider, /Never narrate the private app screen/); assert.match(provider, /grounded institutional announcement/); assert.match(provider, /Keep the private app unknown to NPCs/);
});
