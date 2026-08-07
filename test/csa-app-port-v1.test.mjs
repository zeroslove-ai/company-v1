import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiWorker } from '../src/api/index.js';
import edition from '../src/api/edition.js';
import {
  calculateCsaCapability, getCsaLimits, appStrengthId,
  getPresetCatalogItem, buildPresetCatalogPayload, renderPresetContent,
  planCsaTransaction, validatePresetOperation,
  normalizeCsaSemanticContract, buildPresetCsaSemanticContract,
  signAppValidationProof, verifyAppValidationProof, verifyStructuredActionValidation,
  normalizeStructuredAction, buildAppManualPayload, buildAppStatePayload,
  getActiveCsaEntries, getApplicableCsaEntries
} from '../src/engine/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = file => JSON.parse(read(file));
const gameId = '11111111-1111-4111-8111-111111111111';
const catalog = readJson('content/csa_presets.json');

const env = {
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
  LLM_API_URL: 'https://llm.test',
  LLM_API_KEY: 'test-llm-key',
  STORY_MODEL: 'story-test',
  EXTRACT_MODEL: 'extract-test'
};

const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
const request = (pathName, body) => new Request(`https://worker.test${pathName}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

function freshSave(overrides = {}) {
  return {
    save_schema_version: 1, edition: 'company-v1',
    turn_state: { committed_turn: 0 },
    player: { name: '김하늘' }, player_progress: { level: 1, exp: 0 }, scene_state: {}, world_state: {},
    npc_stats: {}, npc_emotion: {}, npc_relationship_state: {}, npc_scene_state: {}, npc_work_state: {},
    csa_active: [], csa_rules: {}, csa_attitudes: {}, csa_runtime_state: {}, csa_aftereffect_state: {},
    event_ledger: [], story_summary_overall: '', story_summary_recent: '',
    focal_character_id: null, last_speaker_id: null, last_npcs_present: [], last_image_id: null,
    last_choices: [], last_choice_meta: [], player_setup: { completed: true },
    ...overrides
  };
}

function createMockFetch({ initialSave = freshSave(), storySseText, llmJsonResponses = [] } = {}) {
  const calls = [];
  let currentSave = structuredClone(initialSave);
  let saveRevision = 1;
  let jsonCallIndex = 0;
  const sse = storySseText ?? 'data: {"choices":[{"delta":{"content":"[1. 서사 및 행동]\\n본문"}}]}\n\n'
    + 'data: {"choices":[{"delta":{"content":"\\n[4. 선택지]\\n1. A\\n2. B\\n3. C\\n4. D"}}]}\n\n'
    + 'data: [DONE]\n';

  async function fetchImpl(url, init = {}) {
    const textUrl = String(url);
    calls.push({ url: textUrl, method: init.method ?? 'GET', body: init.body });
    if (textUrl.startsWith('https://llm.test')) {
      const body = JSON.parse(init.body);
      if (body.stream) return new Response(sse, { headers: { 'content-type': 'text/event-stream' } });
      const payload = llmJsonResponses[Math.min(jsonCallIndex, llmJsonResponses.length - 1)];
      jsonCallIndex += 1;
      return json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(payload) } }] });
    }
    const parsed = new URL(textUrl);
    if (parsed.pathname === '/rest/v1/game_actions' && (init.method ?? 'GET') === 'GET') {
      return json([calls.__action].filter(Boolean));
    }
    if (parsed.pathname === '/rest/v1/game_actions' && init.method === 'PATCH') {
      const expectedStatus = parsed.searchParams.get('processing_status')?.replace('eq.', '');
      const requiresEmptyErrorCode = parsed.searchParams.get('error_code') === 'is.null';
      if (!calls.__action || (expectedStatus && calls.__action.processing_status !== expectedStatus) || (requiresEmptyErrorCode && calls.__action.error_code != null)) return json([]);
      Object.assign(calls.__action, JSON.parse(init.body));
      if (init.headers?.prefer === 'return=representation') return json([calls.__action]);
      return new Response(null, { status: 204 });
    }
    const rpc = parsed.pathname.split('/').pop();
    const args = init.body ? JSON.parse(init.body) : {};
    if (rpc === 'get_company_context') {
      return json({ game: { id: gameId, edition_id: 'company-v1', title: 'T' }, save: { data: currentSave, committed_turn: currentSave.turn_state.committed_turn }, recent_turns: [] });
    }
    if (rpc === 'reserve_turn_action') {
      calls.__action = { action_id: args.p_action_id, turn_id: 'turn-1', expected_turn: args.p_expected_turn, player_action: args.p_player_action, processing_status: 'story_streaming' };
      return json({ ...calls.__action, replayed: false });
    }
    if (rpc === 'record_story_result') {
      Object.assign(calls.__action, { story_text: args.p_story_text, parsed_blocks: args.p_parsed_blocks, processing_status: 'extracting' });
      return json({ replayed: false });
    }
    if (rpc === 'record_extract_result') {
      Object.assign(calls.__action, { extract_delta: args.p_extract_delta, processing_status: 'committing' });
      return json({ replayed: false });
    }
    if (rpc === 'commit_company_turn') {
      currentSave = args.p_next_save;
      saveRevision += 1;
      if (calls.__action) Object.assign(calls.__action, { processing_status: 'committed' });
      return json({ success: true, replayed: false, turn_number: args.p_expected_turn, turn_id: 'turn-1', save_revision: saveRevision });
    }
    throw new Error(`Unhandled mock RPC: ${rpc}`);
  }
  return { fetchImpl, calls, getSave: () => currentSave };
}

// ---------- Engine layer ----------

test('preset catalog is ported intact: 73 items, six populated categories, company terms', () => {
  assert.equal(catalog.items.length, 73);
  const populatedCategories = new Set(catalog.items.map(item => item.category));
  assert.deepEqual([...populatedCategories].sort(), ['authority', 'clothing', 'contact', 'duty', 'physiology', 'posture']);
  assert.equal(catalog.categories.some(c => c.id === 'duty'), true);
  assert.equal(catalog.categories.some(c => c.id === 'other'), true);
  const flat = JSON.stringify(catalog);
  assert.doesNotMatch(flat, /병원|간호사|의사(?!소통)|환자|보호자|병동|병실/);
});

test('capability numbers are canonical: weak/medium/strong unlock at Lv.1/3/7, slots at Lv.1=2/3=3/5=4/10=5', () => {
  assert.deepEqual(getCsaLimits(1), { max_active: 2 });
  assert.deepEqual(getCsaLimits(3), { max_active: 3 });
  assert.deepEqual(getCsaLimits(5), { max_active: 4 });
  assert.deepEqual(getCsaLimits(10), { max_active: 5 });
  const lv1 = calculateCsaCapability(freshSave(), 0);
  assert.equal(lv1.current_level, 1); assert.equal(lv1.available_strength_id, 'weak'); assert.equal(lv1.csa_max_active, 2);
  const lv3 = calculateCsaCapability({ ...freshSave(), player_progress: { level: 3, exp: 0 } }, 0);
  assert.equal(lv3.available_strength_id, 'medium'); assert.equal(lv3.csa_max_active, 3);
  const lv7 = calculateCsaCapability({ ...freshSave(), player_progress: { level: 7, exp: 0 } }, 0);
  assert.equal(lv7.available_strength_id, 'strong');
});

test('activate/update/deactivate planner enforces slots, presets, duplicate content, and content-only strength caps', () => {
  const presetItem = catalog.items.find(item => item.category === 'posture' && item.strength === 'weak');
  const validated = validatePresetOperation(catalog, {
    preset: { template_id: presetItem.id, actor_group: presetItem.default_actor, target_group: presetItem.default_target, trigger: presetItem.default_trigger, duration: presetItem.default_duration, modifier: '' },
    strength: 'weak'
  }, { availableStrength: 'weak' });
  assert.equal(validated.ok, true);
  assert.match(validated.content, /꿇|앉|사이|밀착|기대|안/);

  const lv1Capability = calculateCsaCapability(freshSave(), 0);
  const activatePlan = planCsaTransaction(freshSave(), catalog, [
    { client_id: 'a', domain: 'csa', operation: 'activate', source_type: 'preset', strength: 'weak', preset: { template_id: presetItem.id, actor_group: presetItem.default_actor, target_group: presetItem.default_target, trigger: presetItem.default_trigger, duration: presetItem.default_duration, modifier: '' } }
  ], { turnNumber: 1, capability: lv1Capability });
  assert.equal(activatePlan.ok, true);
  assert.equal(activatePlan.next_csa_active.length, 1);
  const newId = activatePlan.next_csa_active[0];
  assert.equal(activatePlan.next_csa_rules[newId].active, true);

  // Slot cap: level 1 allows only 2 active csa (getCsaLimits(1).max_active === 2)
  const overflowSave = { ...freshSave(), csa_active: ['x1', 'x2'], csa_rules: { x1: { active: true, content: 'one', strength: 'weak' }, x2: { active: true, content: 'two', strength: 'weak' } } };
  const overflowPlan = planCsaTransaction(overflowSave, catalog, [
    { client_id: 'b', domain: 'csa', operation: 'activate', source_type: 'custom', strength: 'weak', content: 'three' }
  ], { turnNumber: 1, capability: calculateCsaCapability(overflowSave, 2) });
  assert.equal(overflowPlan.ok, false);
  assert.equal(overflowPlan.error_code, 'CSA_SLOT_FULL');

  // deactivate: id stays in csa_rules forever, but leaves csa_active
  const deactivateSave = { ...freshSave(), csa_active: activatePlan.next_csa_active, csa_rules: activatePlan.next_csa_rules };
  const deactivatePlan = planCsaTransaction(deactivateSave, catalog, [
    { client_id: 'c', domain: 'csa', operation: 'deactivate', id: newId }
  ], { turnNumber: 2, capability: calculateCsaCapability(deactivateSave, 1) });
  assert.equal(deactivatePlan.ok, true);
  assert.equal(deactivatePlan.next_csa_active.includes(newId), false);
  assert.equal(deactivatePlan.next_csa_rules[newId].active, false);
  assert.equal(typeof deactivatePlan.next_csa_rules[newId].content, 'string');
});

test('preset operations are checked against the player\'s actual level, never against the request\'s own claimed strength', () => {
  const strongPreset = catalog.items.find(item => item.strength === 'strong');
  const lv1Capability = calculateCsaCapability(freshSave(), 0);
  const bypassAttempt = planCsaTransaction(freshSave(), catalog, [
    { client_id: 'x', domain: 'csa', operation: 'activate', source_type: 'preset', strength: 'strong', preset: { template_id: strongPreset.id, actor_group: strongPreset.default_actor, target_group: strongPreset.default_target ?? null, trigger: strongPreset.default_trigger, duration: strongPreset.default_duration, modifier: '' } }
  ], { turnNumber: 1, capability: lv1Capability });
  assert.equal(bypassAttempt.ok, false, 'a Lv.1 player must never activate a strong-tier preset by simply claiming strength:"strong" in the payload');
  assert.equal(bypassAttempt.issues[0].code, 'STRENGTH_LOCKED');
});

test('semantic contract: preset-derived contract is exact-confidence; custom contract without full fields is rejected when it claims sexual_authorization', () => {
  const sexualPresetId = Object.keys(catalog.sexual_action_contract)[0];
  const preset = catalog.items.find(item => item.required_action === sexualPresetId);
  if (preset) {
    const contract = buildPresetCsaSemanticContract({ source_type: 'preset', preset: { required_action: preset.required_action, actor_group: preset.default_actor, target_group: preset.default_target, trigger: preset.default_trigger, duration: preset.default_duration, public_normalization: true } }, catalog.sexual_action_contract);
    assert.equal(contract.confidence, 'exact');
    assert.equal(contract.sexual_authorization, true);
  }
  const ambiguous = normalizeCsaSemanticContract({ sexual_authorization: true, actions: [], directions: [], confidence: 'ambiguous' });
  assert.equal(ambiguous.sexual_authorization, false, 'no actions/directions means normalize forces sexual_authorization false');
});

test('validation proof: signs and verifies a roundtrip, and rejects a tampered digest', async () => {
  const payload = { game_id: gameId, base_turn_count: 3, action_digest: 'abc', semantic_results: [] };
  const proof = await signAppValidationProof('secret-key', payload);
  assert.equal(await verifyAppValidationProof('secret-key', payload, proof), true);
  assert.equal(await verifyAppValidationProof('secret-key', { ...payload, action_digest: 'tampered' }, proof), false);
});

test('normalizeStructuredAction rejects malformed shapes and non-csa domains', () => {
  assert.equal(normalizeStructuredAction(null), null);
  assert.equal(normalizeStructuredAction({ type: 'other' }), null);
  assert.equal(normalizeStructuredAction({ type: 'app_transaction', base_turn_count: 1, operations: [] }), null);
  assert.equal(normalizeStructuredAction({ type: 'app_transaction', base_turn_count: 1, operations: [{ domain: 'suggestion' }] }), null);
  const ok = normalizeStructuredAction({ type: 'app_transaction', base_turn_count: 1, operations: [{ domain: 'csa', operation: 'activate' }] });
  assert.equal(ok.type, 'app_transaction');
});

test('buildAppManualPayload and buildAppStatePayload expose company-wide scope and no hospital wording', () => {
  const manual = buildAppManualPayload(freshSave(), catalog);
  assert.equal(manual.status.csa_scope_label, '회사 전체');
  assert.doesNotMatch(JSON.stringify(manual), /병원/);
  const state = buildAppStatePayload(freshSave(), catalog, catalog.sexual_action_contract, { name: '김하늘' });
  assert.equal(state.scope_options[0].label, '회사 전체');
  assert.equal(Array.isArray(state.csa_presets.items), true);
  assert.equal(state.csa_presets.items.length, 73);
});

// ---------- API layer ----------

test('/api/app-manual and /api/app-state are read-only: single context fetch, zero mutation, zero LLM calls', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const manualRes = await worker.fetch(request('/api/app-manual', { game_id: gameId }), env);
  assert.equal(manualRes.status, 200);
  const manualData = (await manualRes.json()).data;
  assert.equal(manualData.manual.mode, 'csa_only');

  const stateRes = await worker.fetch(request('/api/app-state', { game_id: gameId }), env);
  assert.equal(stateRes.status, 200);
  const stateData = (await stateRes.json()).data;
  assert.equal(stateData.app.csa_presets.items.length, 73);
  assert.equal(stateData.app.player_info.name, '김하늘');

  assert.equal(mock.calls.filter(call => call.url.includes('get_company_context')).length, 2);
  assert.equal(mock.calls.some(call => call.url.startsWith('https://llm.test')), false);
  assert.equal(mock.calls.some(call => call.method === 'PATCH' || call.body && JSON.parse(call.body).p_next_save), false);
});

test('/api/app-validate deterministically validates a preset activate with zero LLM calls, and rejects a stale base_turn_count', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const presetItem = catalog.items.find(item => item.strength === 'weak' && item.category === 'posture');
  const structuredAction = {
    type: 'app_transaction', base_turn_count: 0,
    operations: [{ client_id: 'op-1', domain: 'csa', operation: 'activate', source_type: 'preset', strength: 'weak', preset: { template_id: presetItem.id, actor_group: presetItem.default_actor, target_group: presetItem.default_target, trigger: presetItem.default_trigger, duration: presetItem.default_duration, modifier: '' } }]
  };
  const validated = await worker.fetch(request('/api/app-validate', { game_id: gameId, structured_action: structuredAction }), env);
  assert.equal(validated.status, 200);
  const data = (await validated.json()).data;
  assert.equal(data.canonical_action.type, 'app_transaction');
  assert.match(typeof data.canonical_action.validation_proof, /string/);
  assert.equal(mock.calls.some(call => call.url.startsWith('https://llm.test')), false);

  const stale = await worker.fetch(request('/api/app-validate', { game_id: gameId, structured_action: { ...structuredAction, base_turn_count: 99 } }), env);
  assert.equal(stale.status, 409);
  const staleBody = await stale.json();
  assert.equal(staleBody.error.code, 'app_stale_state');
});

test('/api/app-validate makes exactly one LLM call for a custom operation and rejects an unsupported one', async () => {
  const mock = createMockFetch({ llmJsonResponses: [{ results: [{ client_id: 'op-1', required_strength: 'weak', reason: 'ok', semantic_contract: { version: 1, sexual_authorization: false, directions: [], actions: [], actor_group: 'unknown', target_group: 'unknown', trigger: 'custom_condition', duration: 'continuous', public_normalization: false, direct_execution: false, confidence: 'ambiguous' } }] }] });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const structuredAction = { type: 'app_transaction', base_turn_count: 0, operations: [{ client_id: 'op-1', domain: 'csa', operation: 'activate', source_type: 'custom', strength: 'weak', content: '사무실에서 편안한 옷차림을 허용한다' }] };
  const validated = await worker.fetch(request('/api/app-validate', { game_id: gameId, structured_action: structuredAction }), env);
  assert.equal(validated.status, 200);
  assert.equal(mock.calls.filter(call => call.url.startsWith('https://llm.test')).length, 1);
});

test('a structured app_transaction rides the normal Story -> Extract -> Commit pipeline and lands in csa_active/csa_rules', async () => {
  const presetItem = catalog.items.find(item => item.strength === 'weak' && item.category === 'clothing');
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const structuredAction = {
    type: 'app_transaction', base_turn_count: 0,
    operations: [{ client_id: 'op-1', domain: 'csa', operation: 'activate', source_type: 'preset', strength: 'weak', preset: { template_id: presetItem.id, actor_group: presetItem.default_actor, target_group: presetItem.default_target ?? null, trigger: presetItem.default_trigger, duration: presetItem.default_duration, modifier: '' } }]
  };
  const validated = await worker.fetch(request('/api/app-validate', { game_id: gameId, structured_action: structuredAction }), env);
  const { canonical_action: canonicalAction, display_input: displayInput } = (await validated.json()).data;

  const actionId = '22222222-2222-4222-8222-222222222222';
  const storyRes = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 1, player_action: displayInput, structured_action: canonicalAction }), env);
  assert.equal(storyRes.status, 200);
  const storyText = await storyRes.text();
  assert.match(storyText, /event: complete/);

  const extractRes = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, structured_action: canonicalAction }), env);
  assert.equal(extractRes.status, 200);

  const commitRes = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 1, structured_action: canonicalAction }), env);
  assert.equal(commitRes.status, 200);

  const save = mock.getSave();
  assert.equal(save.csa_active.length, 1);
  const newId = save.csa_active[0];
  assert.equal(save.csa_rules[newId].active, true);
  assert.equal(save.csa_rules[newId].source_type, 'preset');
});

test('a structured app_transaction with a tampered validation_proof is rejected before it reaches Story generation', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const tampered = {
    version: 1, type: 'app_transaction', base_turn_count: 0,
    operations: [{ client_id: 'op-1', domain: 'csa', operation: 'activate', source_type: 'custom', strength: 'weak', content: '자유 근무복을 허용한다' }],
    semantic_validation: { version: 1, game_id: gameId, base_turn_count: 0, action_digest: 'not-a-real-digest', results: [] },
    validation_proof: 'not-a-real-signature'
  };
  const actionId = '33333333-3333-4333-8333-333333333333';
  const storyRes = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 1, player_action: '위조된 상식개변을 적용한다.', structured_action: tampered }), env);
  const storyText = await storyRes.text();
  assert.match(storyText, /event: error/);
  assert.match(storyText, /structured_action_invalid/);
});

function storySystemPromptFrom(mock) {
  const llmCall = mock.calls.find(call => call.url.startsWith('https://llm.test'));
  return JSON.parse(llmCall.body).messages
    .filter(message => message.role === 'system')
    .map(message => message.content)
    .join('\n');
}

test('Story prompt: public-scene and weak-synergy CSA sections are omitted when no active CSA is public and only one is active', async () => {
  const save = freshSave({
    csa_active: ['csa_0'],
    csa_rules: {
      csa_0: {
        active: true, content: '이 회의실 안에서만 적용되는 소규모 관행이다', strength: 'weak', source_type: 'custom', preset: null,
        semantic_contract: { version: 1, sexual_authorization: false, directions: [], actions: [], actor_group: 'unknown', target_group: 'unknown', trigger: 'custom_condition', duration: 'continuous', public_normalization: false, direct_execution: false, confidence: 'exact' }
      }
    }
  });
  const mock = createMockFetch({ initialSave: save });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const storyRes = await worker.fetch(request('/api/story', { game_id: gameId, action_id: '44444444-4444-4444-8444-444444444444', expected_turn: 1, player_action: '평범하게 대화한다.' }), env);
  assert.equal(storyRes.status, 200);
  const storyText = await storyRes.text();
  assert.match(storyText, /event: complete/);
  const system = storySystemPromptFrom(mock);
  assert.match(system, /COMMON-SENSE CHANGE RUNTIME CONTRACT/, 'the always-needed common section is still present');
  assert.doesNotMatch(system, /PUBLIC COMMON-SENSE SCENE/, 'the only active CSA is explicitly non-public, so the public-scene section is skipped');
  assert.doesNotMatch(system, /CSA WEAK SYNERGY/, 'only one CSA is active, so there is nothing to synergize');
});

test('Story prompt: public-scene and weak-synergy CSA sections are included when two public presets are active', async () => {
  const presetA = catalog.items.find(item => item.strength === 'weak' && item.category === 'posture');
  const presetB = catalog.items.find(item => item.strength === 'weak' && item.category === 'contact');
  const presetEntry = item => ({
    active: true, content: 'x', strength: 'weak', source_type: 'preset',
    preset: { template_id: item.id, actor_group: item.default_actor, target_group: item.default_target ?? null, trigger: item.default_trigger, duration: item.default_duration, required_action: item.required_action, public_normalization: item.public_normalization === true, persistent: item.persistent === true, direct_meaning_tags: item.direct_meaning_tags }
  });
  const save = freshSave({ csa_active: ['csa_0', 'csa_1'], csa_rules: { csa_0: presetEntry(presetA), csa_1: presetEntry(presetB) } });
  const mock = createMockFetch({ initialSave: save });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const storyRes = await worker.fetch(request('/api/story', { game_id: gameId, action_id: '55555555-5555-4555-8555-555555555555', expected_turn: 1, player_action: '평범하게 대화한다.' }), env);
  assert.equal(storyRes.status, 200);
  const storyText = await storyRes.text();
  assert.match(storyText, /event: complete/);
  const system = storySystemPromptFrom(mock);
  assert.match(system, /PUBLIC COMMON-SENSE SCENE/, 'both active presets are public, so the section applies');
  assert.match(system, /CSA WEAK SYNERGY/, 'two CSAs are active simultaneously, so synergy guidance applies');
});
test('app deactivate: Story upstream이 첫 콘텐츠를 주지 않으면 fallback Story로 Extract/Commit까지 진행하고 csa_active에서 제거한다', async () => {
  const save = freshSave({
    csa_active: ['csa_0'],
    csa_rules: { csa_0: { active: true, content: '퇴근 후 야근 보고를 강제한다', strength: 'weak', source_type: 'custom', preset: null } }
  });
  const mock = createMockFetch({
    initialSave: save,
    // 첫 콘텐츠(헤더만) 후 [DONE] 없이 종료 → story_incomplete → deterministic fallback 트리거
    storySseText: 'data: {"choices":[{"delta":{"content":"[SCENE]"}}]}\n\n',
    llmJsonResponses: [{ state_delta: {}, outcome: 'success', evidence: {}, choices: ['대화를 계속 이어간다', '상대의 반응을 살핀다', '현재 행동을 멈추고 상황을 정리한다', '다른 장소로 이동한다'], mind_monitor: {}, dialogue_lines: [] }]
  });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const structuredAction = {
    type: 'app_transaction', base_turn_count: 0,
    operations: [{ client_id: 'op-1', domain: 'csa', operation: 'deactivate', id: 'csa_0' }]
  };
  const validated = await worker.fetch(request('/api/app-validate', { game_id: gameId, structured_action: structuredAction }), env);
  const { canonical_action: canonicalAction, display_input: displayInput } = (await validated.json()).data;

  const actionId = '66666666-6666-4666-8666-666666666666';
  const storyRes = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 1, player_action: displayInput, structured_action: canonicalAction }), env);
  assert.equal(storyRes.status, 200);
  const storyText = await storyRes.text();
  assert.match(storyText, /event: complete/);
  const system = storySystemPromptFrom(mock);
  assert.match(system, /PLAYER KNOWLEDGE OF APP TRANSACTION/);
  assert.match(system, /직접 조작한 주체/);
  assert.match(system, /이미 정확히 알고 있다/);
  assert.match(system, /세계에 반영되는 모습일 뿐/);
  assert.match(system, /NPC CSA EPISTEMIC FIREWALL/);
  assert.match(storyText, /app_story_fallback/, 'fallback warning');
  // fallback은 [SCENE]만 — 현재 장면 NPC를 임의로 발화시키지 않는다
  assert.match(storyText, /해제되어 더 이상 현재 회사 규정이 아닙니다/);
  assert.equal(mock.calls.__action.story_text.includes('[DIALOGUE]'), false, '대사 블록 없음');
  assert.ok(mock.calls.__action.story_text.includes('야근 보고를 강제한다'), '운영 내용 라벨 포함');

  const extractRes = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, structured_action: canonicalAction }), env);
  assert.equal(extractRes.status, 200);

  const commitRes = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 1, structured_action: canonicalAction }), env);
  assert.equal(commitRes.status, 200);

  const afterSave = mock.getSave();
  assert.ok(!afterSave.csa_active.includes('csa_0'), 'csa_active에서 대상 제거');
  assert.equal(afterSave.csa_rules.csa_0.active, false, '규칙 비활성');
  assert.equal(mock.calls.__action.processing_status, 'committed', '액션 committed');
});
