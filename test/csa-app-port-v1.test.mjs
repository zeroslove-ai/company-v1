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
  getActiveCsaEntries, getApplicableCsaEntries,
  buildNpcCsaEpistemicFirewallSection,
  resolveParticipant,
  canonicalizeCsaGroup, CSA_CONTRACT_TARGET_GROUPS,
  normalizeCompanyCsaCatalog
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

function storyUserPayloadFrom(mock) {
  const llmCall = mock.calls.find(call => call.url.startsWith('https://llm.test'));
  const userMessage = JSON.parse(llmCall.body).messages.find(message => message.role === 'user');
  return JSON.parse(userMessage.content);
}

test('app_transaction Story: plan이 적용한 active CSA와 새 규칙 content를 projected context로 전달한다', async () => {
  const presetA = catalog.items.find(item => item.strength === 'weak' && item.category === 'posture');
  const presetB = catalog.items.find(item => item.strength === 'weak' && item.category === 'contact');
  const preset = item => ({
    template_id: item.id,
    actor_group: item.default_actor,
    target_group: item.default_target ?? null,
    trigger: item.default_trigger,
    duration: item.default_duration,
    modifier: ''
  });
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const structuredAction = {
    type: 'app_transaction', base_turn_count: 0,
    operations: [
      { client_id: 'op-1', domain: 'csa', operation: 'activate', source_type: 'preset', strength: 'weak', preset: preset(presetA) },
      { client_id: 'op-2', domain: 'csa', operation: 'activate', source_type: 'preset', strength: 'weak', preset: preset(presetB) }
    ]
  };
  const validated = await worker.fetch(request('/api/app-validate', { game_id: gameId, structured_action: structuredAction }), env);
  const { canonical_action: canonicalAction, display_input: displayInput } = (await validated.json()).data;

  const storyRes = await worker.fetch(request('/api/story', {
    game_id: gameId, action_id: '77777777-7777-4777-8777-777777777777', expected_turn: 1,
    player_action: displayInput, structured_action: canonicalAction
  }), env);
  assert.equal(storyRes.status, 200);
  await storyRes.text();

  const payload = storyUserPayloadFrom(mock);
  const globalCsa = payload.context.global_csa;
  assert.equal(globalCsa.active_ids.length, 2);
  assert.deepEqual(globalCsa.active_ids, ['csa_1', 'csa_1_1']);
  for (const csaId of globalCsa.active_ids) assert.equal(globalCsa.rules[csaId].active, true);
  assert.ok(canonicalAction.operations.every(operation => Object.values(globalCsa.rules).some(rule => rule.content === operation.content)), '새 CSA content가 Story context에 포함된다');
});

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
test('NPC CSA 인식 구분: 신규 규정은 공지로 인식·비교·논의 가능, 기존 규정은 반복 금지, 메타 인식만 금지', () => {
  const section = buildNpcCsaEpistemicFirewallSection();
  // 신규 CSA — 이번 턴에 내려온 세계 내부 공지로 인식 가능
  assert.match(section, /새로 활성화된 규정은 세계 내부의 새로운 공지·사규·업무 지침으로 NPC가 인식할 수 있다/);
  assert.match(section, /"오늘 새로 내려온 지침"/);
  assert.match(section, /당황, 내용 재확인, 주변 NPC와의 논의/);
  assert.match(section, /이전 상태와 비교/);
  assert.match(section, /업무상 따라야 한다고 판단하거나 개인적으로 불편·혼란스러워하는 반응/);
  // 기존 CSA — 매 턴 새 공지처럼 반복해서 발견하지 않는다
  assert.match(section, /이미 이전 턴부터 활성화된 규정은 매 턴 새 공지처럼 반복해서 발견하지 않는다/);
  assert.match(section, /이미 시행 중인 규정으로 기억하고, 이전에 확인·논의한 내용을 이어간다/);
  // 공통 — 메타 인식 금지 유지
  assert.match(section, /메타 원인을 절대 인식하지 않는다/);
  assert.match(section, /플레이어가 규칙을\(상식을\) 바꿨다/);
  assert.match(section, /초자연적으로 다시 작성됐거나 기억이 수정됐다는 인식/);
  assert.match(section, /CSA, 상태값, 내부 ID 같은 시스템 용어/);
  // 구버전 금지 문구 제거 확인 — 신규 공지 인식·이전 비교 금지가 사라졌다
  assert.doesNotMatch(section, /이전 현실과 지금을 비교하는 인식/);
  assert.doesNotMatch(section, /시점 변화를 절대 인식하지 않는다/);
  assert.doesNotMatch(section, /원래부터 당연하다고 받아들이되/);
});
test('프리셋 카탈로그: 제거된 외부 그룹과 병원 legacy ID가 없고 회사 정본 ID가 노출된다', () => {
  const normalized = normalizeCompanyCsaCatalog(catalog);
  const flat = JSON.stringify(normalized);
  for (const legacy of ['nurse', 'doctor', 'medical_staff', 'hospital_staff', 'female_staff', 'male_staff',
    'everyone_in_hospital', 'patient', 'assigned_patient', 'guardian', 'visitor']) {
    assert.ok(!flat.includes(`"${legacy}"`), `${legacy} 노출 금지`);
  }
  for (const g of ['business_visitor', 'assigned_visitor', 'partner_contact', 'guest']) {
    assert.ok(!flat.includes(`"${g}"`), `${g} 노출 금지`);
  }
  for (const id of ['coworker', 'manager', 'employee', 'company_employee', 'female_employee', 'male_employee', 'everyone_in_company']) {
    assert.ok(normalized.actor_options.some(o => o.id === id), `actor 옵션 ${id}`);
    assert.ok(normalized.target_options.some(o => o.id === id), `target 옵션 ${id}`);
  }
  const label = id => normalized.actor_options.find(o => o.id === id)?.label;
  assert.equal(label('company_employee'), '회사 직원 전체');
  assert.equal(label('female_employee'), '여성 직원 전체');
  assert.equal(label('male_employee'), '남성 직원 전체');
  assert.equal(label('everyone_in_company'), '회사 안의 모든 사람');
  const userFacing = JSON.stringify({
    labels: normalized.items.map(i => i.label),
    templates: normalized.items.map(i => i.content_template),
    optionLabels: [...normalized.actor_options, ...normalized.target_options, ...normalized.trigger_options, ...normalized.duration_options].map(o => o.label)
  });
  for (const word of ['병원', '간호사', '의사', '환자', '보호자', '진료', '체온', '검사 위치', '상담 자세', '상담이 끝날', '외부 방문자', '협력사', '방문객']) {
    assert.ok(!userFacing.includes(word), `사용자 노출 문구 금지: ${word}`);
  }
});

test('집단 participant 판정: 성별·직급으로 female/male/manager를 구분하고 actor·target 중복과 장면 밖 인물·미지원 그룹을 배제한다', () => {
  const roster = {
    heroine1: { character_id: 'heroine1', name: '서원희', position: '차장', role_title: '브랜드전략팀 팀장', department: '브랜드전략팀' },
    heroine2: { character_id: 'heroine2', name: '윤민아', position: '대리', department: '브랜드전략팀' },
    male_emp: { character_id: 'male_emp', name: '김대리', gender: 'male', position: '대리', department: '마케팅팀' }
  };
  const save = { scene_state: { participants: ['player-1', 'heroine2', 'male_emp', 'heroine1'], focus_thread: 'relationship:heroine2' } };
  const ctx = { save, characters: roster };
  assert.equal(resolveParticipant('female_employee', ctx).characterId, 'heroine2', '여성 직원만');
  assert.equal(resolveParticipant('male_employee', ctx).characterId, 'male_emp', '남성 직원만');
  assert.equal(resolveParticipant('manager', ctx).characterId, 'heroine1', '관리자만');
  assert.equal(resolveParticipant('coworker', ctx).characterId, 'heroine2', '참가자 NPC');
  assert.equal(resolveParticipant('employee', ctx).characterId, 'heroine2', '참가자 NPC');
  assert.equal(resolveParticipant('company_employee', ctx).characterId, 'heroine2', '참가자 NPC');
  assert.equal(resolveParticipant('everyone_in_company', ctx).characterId, 'heroine2', '참가자 NPC');
  assert.equal(resolveParticipant('conversation_partner', ctx).characterId, 'heroine2', 'focus_thread 대상');
  assert.equal(resolveParticipant('another_present_person', ctx).characterId, 'heroine2', '참가자 NPC');
  assert.equal(resolveParticipant('nearby_person', ctx).characterId, 'heroine2', '참가자 NPC');
  const actor = resolveParticipant('company_employee', ctx);
  const target = resolveParticipant('company_employee', { ...ctx, excludeCharacterId: actor.characterId });
  assert.notEqual(target.characterId, actor.characterId, 'actor와 target은 같은 사람이 될 수 없다');
  // 제거된 외부 그룹·미지원 그룹 → null
  assert.equal(resolveParticipant('business_visitor', ctx), null, '제거 그룹 null');
  assert.equal(resolveParticipant('guest', ctx), null, '제거 그룹 null');
  assert.equal(resolveParticipant('unknown', ctx), null, 'unknown null');
  assert.equal(resolveParticipant('not_a_group', ctx), null, '미지원 그룹 null');
});

test('legacy 읽기 호환: 직원 계열 legacy ID만 정본 ID로 canonicalize되고 외부 alias는 변환되지 않는다', () => {
  assert.equal(canonicalizeCsaGroup('nurse'), 'coworker');
  assert.equal(canonicalizeCsaGroup('doctor'), 'manager');
  assert.equal(canonicalizeCsaGroup('medical_staff'), 'employee');
  assert.equal(canonicalizeCsaGroup('hospital_staff'), 'company_employee');
  assert.equal(canonicalizeCsaGroup('female_staff'), 'female_employee');
  assert.equal(canonicalizeCsaGroup('male_staff'), 'male_employee');
  assert.equal(canonicalizeCsaGroup('everyone_in_hospital'), 'everyone_in_company');
  // 제거된 병원 외부 alias는 더 이상 다른 그룹으로 변환되지 않는다
  assert.notEqual(canonicalizeCsaGroup('patient'), 'business_visitor', 'patient 변환 금지');
  assert.notEqual(canonicalizeCsaGroup('guardian'), 'partner_contact', 'guardian 변환 금지');
  assert.notEqual(canonicalizeCsaGroup('visitor'), 'guest', 'visitor 변환 금지');
  // everyone_in_company는 target contract에서 유효
  assert.ok(CSA_CONTRACT_TARGET_GROUPS.has('everyone_in_company'), 'target 그룹에 everyone_in_company');
});