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
  normalizeCsaSemanticContract,
  signAppValidationProof, verifyAppValidationProof, verifyStructuredActionValidation,
  normalizeStructuredAction, buildAppManualPayload, buildAppStatePayload,
  getActiveCsaEntries, getApplicableCsaEntries,
  canonicalizeCsaGroup, CSA_CONTRACT_TARGET_GROUPS,
  normalizeCompanyCsaCatalog
} from '../src/engine/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = file => JSON.parse(read(file));
const gameId = '11111111-1111-4111-8111-111111111111';
const catalog = readJson('content/csa_presets.json');
const presetFor = item => ({ template_id: item.id });

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

function createMockFetch({ initialSave = freshSave(), storySseText, llmJsonResponses = [], dropStructuredAction = false } = {}) {
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
      calls.__action = { action_id: args.p_action_id, turn_id: 'turn-1', expected_turn: args.p_expected_turn, player_action: args.p_player_action, structured_action: dropStructuredAction ? null : (args.p_structured_action ?? null), processing_status: 'story_streaming' };
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

test('preset catalog uses the role-slot Company v2 catalog', () => {
  assert.equal(catalog.items.length, 44);
  const populatedCategories = new Set(catalog.items.map(item => item.category));
  assert.deepEqual([...populatedCategories].sort(), ['clothing', 'contact', 'posture', 'sexual_action', 'world_behavior']);
  assert.equal(catalog.schema_version, 2);
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
  const presetItem = catalog.items.find(item => item.id === 'sit_on_recipient_lap');
  const validated = validatePresetOperation(catalog, {
    preset: presetFor(presetItem),
    strength: 'weak'
  }, { availableStrength: 'weak' });
  assert.equal(validated.ok, true);
  assert.match(validated.content, /꿇|앉|사이|밀착|기대|안/);

  const lv1Capability = calculateCsaCapability(freshSave(), 0);
  const activatePlan = planCsaTransaction(freshSave(), catalog, [
    { client_id: 'a', domain: 'csa', operation: 'activate', source_type: 'preset', strength: 'weak', preset: presetFor(presetItem) }
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
    { client_id: 'x', domain: 'csa', operation: 'activate', source_type: 'preset', strength: 'strong', preset: presetFor(strongPreset) }
  ], { turnNumber: 1, capability: lv1Capability });
  assert.equal(bypassAttempt.ok, false, 'a Lv.1 player must never activate a strong-tier preset by simply claiming strength:"strong" in the payload');
  assert.equal(bypassAttempt.issues[0].code, 'STRENGTH_LOCKED');
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
  const state = buildAppStatePayload(freshSave(), catalog, null, { name: '김하늘' });
  assert.equal(state.scope_options[0].label, '회사 전체');
  assert.equal(Array.isArray(state.csa_presets.items), true);
  assert.equal(state.csa_presets.items.length, 44);
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
  assert.equal(stateData.app.csa_presets.items.length, 44);
  assert.equal(stateData.app.player_info.name, '김하늘');

  assert.equal(mock.calls.filter(call => call.url.includes('get_company_context')).length, 2);
  assert.equal(mock.calls.some(call => call.url.startsWith('https://llm.test')), false);
  assert.equal(mock.calls.some(call => call.method === 'PATCH' || call.body && JSON.parse(call.body).p_next_save), false);
});

test('/api/app-validate deterministically validates a preset activate with zero LLM calls, and rejects a stale base_turn_count', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const presetItem = catalog.items.find(item => item.id === 'sit_on_recipient_lap');
  const structuredAction = {
    type: 'app_transaction', base_turn_count: 0,
    operations: [{ client_id: 'op-1', domain: 'csa', operation: 'activate', source_type: 'preset', strength: 'weak', preset: presetFor(presetItem) }]
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
  const presetItem = catalog.items.find(item => item.id === 'press_body_against_recipient');
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const structuredAction = {
    type: 'app_transaction', base_turn_count: 0,
    operations: [{ client_id: 'op-1', domain: 'csa', operation: 'activate', source_type: 'preset', strength: 'weak', preset: presetFor(presetItem) }]
  };
  const validated = await worker.fetch(request('/api/app-validate', { game_id: gameId, structured_action: structuredAction }), env);
  const { canonical_action: canonicalAction, display_input: displayInput } = (await validated.json()).data;

  const actionId = '22222222-2222-4222-8222-222222222222';
  const storyRes = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 1, player_action: displayInput, structured_action: canonicalAction }), env);
  assert.equal(storyRes.status, 200);
  const storyText = await storyRes.text();
  assert.match(storyText, /event: complete/);
  const storyPayload = storyUserPayloadFrom(mock);
  const activatedContent = canonicalAction.operations[0].content;
  assert.equal(storyPayload.context.active_world_rules.filter(rule => rule.content === activatedContent).length, 1);
  const projectedRule = storyPayload.context.active_world_rules[0];
  assert.equal(projectedRule.affected_group, 'female_employee');
  assert.equal(projectedRule.subject_scope, 'female_employee');
  assert.equal(projectedRule.counterparty_scope, 'company_employee');
  assert.equal(projectedRule.trigger, 'contextual');
  assert.equal(projectedRule.authority_tier, 'weak');
  assert.equal('roles' in projectedRule, false);
  assert.equal('sexual_actions' in projectedRule, false);
  assert.ok(!('global_csa' in storyPayload.context));

  assert.deepEqual(mock.calls.__action.structured_action, canonicalAction);
  const extractRes = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId }), env);
  assert.equal(extractRes.status, 200);
  const extractCall = mock.calls.filter(call => call.url.startsWith('https://llm.test') && !JSON.parse(call.body).stream).at(-1);
  const extractPayload = JSON.parse(JSON.parse(extractCall.body).messages.find(message => message.role === 'user').content);
  assert.ok(extractPayload.context.global_csa, 'Extract 전용 CSA 관찰 projection 유지');
  assert.deepEqual(new Set(extractPayload.context.global_csa.active_ids), new Set(storyPayload.context.active_world_rules.map(rule => rule.csa_id)));

  const commitRes = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 1, structured_action: canonicalAction }), env);
  assert.equal(commitRes.status, 200);

  const save = mock.getSave();
  assert.equal(save.csa_active.length, 1);
  const newId = save.csa_active[0];
  assert.equal(save.csa_rules[newId].active, true);
  assert.equal(save.csa_rules[newId].source_type, 'preset');
  assert.equal(save.csa_rules[newId].preset.subject_scope, 'female_employee');
  assert.equal(save.csa_rules[newId].preset.counterparty_scope, 'company_employee');
});

test('a non-null structured action that the reservation fails to persist stops Story before the LLM', async () => {
  const presetItem = catalog.items.find(item => item.id === 'press_body_against_recipient');
  const mock = createMockFetch({ dropStructuredAction: true });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const raw = {
    type: 'app_transaction', base_turn_count: 0,
    operations: [{ client_id: 'op-1', domain: 'csa', operation: 'activate', source_type: 'preset', strength: 'weak', preset: presetFor(presetItem) }]
  };
  const validated = await worker.fetch(request('/api/app-validate', { game_id: gameId, structured_action: raw }), env);
  const canonicalAction = (await validated.json()).data.canonical_action;
  const beforeLlm = mock.calls.filter(call => call.url.startsWith('https://llm.test')).length;
  const response = await worker.fetch(request('/api/story', {
    game_id: gameId, action_id: '99999999-9999-4999-8999-999999999999', expected_turn: 1,
    player_action: '앱 변경을 적용한다.', structured_action: canonicalAction
  }), env);
  assert.equal(response.status, 409);
  const payload = await response.json();
  assert.equal(payload.error.code, 'structured_action_not_persisted');
  assert.equal(mock.calls.filter(call => call.url.startsWith('https://llm.test')).length, beforeLlm);
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

test('route-level CSA update replaces the old Story rule once and commits the new rule', async () => {
  const oldContent = '기존 규정은 더 이상 Story에 전달되지 않는다.';
  const newContent = '수정된 규정은 현재 장면의 세계 사실이다.';
  const mock = createMockFetch({
    initialSave: freshSave({
      csa_active: ['csa_old'],
      csa_rules: { csa_old: { active: true, content: oldContent, strength: 'weak', source_type: 'custom' } }
    }),
    llmJsonResponses: [{ results: [{
      client_id: 'op-update', required_strength: 'weak', reason: 'valid',
      semantic_contract: {
        version: 1, sexual_authorization: false, directions: [], actions: [],
        actor_group: 'unknown', target_group: 'unknown', trigger: 'custom_condition',
        duration: 'continuous', public_normalization: false, direct_execution: false, confidence: 'ambiguous'
      }
    }] }, { extract_version: 2, outcome: 'success', scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null, presence_is_final: false, remote_speaker_ids: [], evidence: [] }, player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3, mind_monitor: {}, action_target_id: null, image_character_id: null, image_selection: null, csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '', warnings: [] }]
  });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const structuredAction = {
    type: 'app_transaction', base_turn_count: 0,
    operations: [{ client_id: 'op-update', domain: 'csa', operation: 'update', id: 'csa_old', source_type: 'custom', strength: 'weak', content: newContent }]
  };
  const validated = await worker.fetch(request('/api/app-validate', { game_id: gameId, structured_action: structuredAction }), env);
  assert.equal(validated.status, 200);
  const { canonical_action: canonicalAction, display_input: displayInput } = (await validated.json()).data;
  const actionId = '88888888-8888-4888-8888-888888888888';
  const storyRes = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 1, player_action: displayInput, structured_action: canonicalAction }), env);
  assert.equal(storyRes.status, 200);
  await storyRes.text();
  const payload = storyUserPayloadFrom(mock);
  assert.equal(payload.context.active_world_rules.filter(rule => rule.content === oldContent).length, 0);
  assert.equal(payload.context.active_world_rules.filter(rule => rule.content === newContent).length, 1);
  assert.ok(!('global_csa' in payload.context));
  const extractRes = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, structured_action: canonicalAction }), env);
  assert.equal(extractRes.status, 200);
  const extractCall = mock.calls.filter(call => call.url.startsWith('https://llm.test') && !JSON.parse(call.body).stream).at(-1);
  const extractPayload = JSON.parse(JSON.parse(extractCall.body).messages.find(message => message.role === 'user').content);
  assert.ok(extractPayload.context.global_csa, 'Extract 전용 CSA 관찰 projection 유지');
  assert.ok(extractPayload.context.global_csa.active_ids.includes('csa_old'));
  assert.equal(extractPayload.context.global_csa.rules.csa_old.content, newContent);
  const commitRes = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 1 }), env);
  assert.equal(commitRes.status, 200);
  const save = mock.getSave();
  assert.equal(save.csa_active.includes('csa_old'), true);
  assert.equal(save.csa_rules.csa_old.content, newContent);
  assert.equal(save.csa_rules.csa_old.active, true);
  assert.equal(mock.calls.__action.processing_status, 'committed');
});

function storyUserPayloadFrom(mock) {
  const llmCall = mock.calls.find(call => call.url.startsWith('https://llm.test') && JSON.parse(call.body).stream === true);
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
  const activeWorldRules = payload.context.active_world_rules;
  assert.equal(activeWorldRules.length, 2);
  assert.deepEqual(activeWorldRules.map(rule => rule.csa_id), ['csa_1', 'csa_1_1']);
  for (const rule of activeWorldRules) assert.equal(rule.active, true);
  assert.ok(canonicalAction.operations.every(operation => activeWorldRules.some(rule => rule.content === operation.content)));
  assert.equal(new Set(activeWorldRules.map(rule => rule.csa_id)).size, activeWorldRules.length);
  assert.ok(!('global_csa' in payload.context));
  const storyMessages = JSON.parse(mock.calls.find(call => call.url.startsWith('https://llm.test') && JSON.parse(call.body).stream === true).body).messages;
  const storyTextForAssertions = storyMessages.map(message => message.content).join('\n');
  for (const operation of canonicalAction.operations) {
    assert.equal(storyTextForAssertions.split(operation.content).length - 1, 1);
  }
  assert.doesNotMatch(storyTextForAssertions, /actor_id=|target_id=|undefined/);
  assert.doesNotMatch(storyTextForAssertions, /PUBLIC COMMON-SENSE SCENE|CSA WEAK SYNERGY|NPC CSA EPISTEMIC FIREWALL|CONFIRMED COMMON-SENSE APP TRANSACTION/);
});

test('Story route: one active CSA uses only active_world_rules without global_csa or legacy sections', async () => {
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
  const payload = storyUserPayloadFrom(mock);
  assert.equal(payload.context.active_world_rules.length, 1);
  assert.ok(!('global_csa' in payload.context));
});

test('Story route: multiple active CSAs remain in one declarative projection', async () => {
  const presetA = catalog.items.find(item => item.strength === 'weak' && item.category === 'posture');
  const presetB = catalog.items.find(item => item.strength === 'weak' && item.category === 'contact');
  const presetEntry = item => ({
    active: true, content: item.label, strength: 'weak', source_type: 'preset',
    preset: presetFor(item)
  });
  const save = freshSave({ csa_active: ['csa_0', 'csa_1'], csa_rules: { csa_0: presetEntry(presetA), csa_1: presetEntry(presetB) } });
  const mock = createMockFetch({ initialSave: save });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const storyRes = await worker.fetch(request('/api/story', { game_id: gameId, action_id: '55555555-5555-4555-8555-555555555555', expected_turn: 1, player_action: '평범하게 대화한다.' }), env);
  assert.equal(storyRes.status, 200);
  const storyText = await storyRes.text();
  assert.match(storyText, /event: complete/);
  const payload = storyUserPayloadFrom(mock);
  assert.equal(payload.context.active_world_rules.length, 2);
  assert.ok(!('global_csa' in payload.context));
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
    llmJsonResponses: [{ extract_version: 2, outcome: 'success', scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null, presence_is_final: false, remote_speaker_ids: [], evidence: [] }, player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3, mind_monitor: {}, action_target_id: null, image_character_id: null, image_selection: null, csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '', warnings: [] }]
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
  const storyPayload = storyUserPayloadFrom(mock);
  assert.deepEqual(storyPayload.context.active_world_rules, []);
  assert.ok(!('global_csa' in storyPayload.context));
  const storyPrompt = JSON.parse(mock.calls.find(call => call.url.startsWith('https://llm.test')).body).messages.map(message => message.content).join('\n');
  assert.doesNotMatch(storyPrompt, /PUBLIC COMMON-SENSE SCENE|CSA WEAK SYNERGY|NPC CSA EPISTEMIC FIREWALL|CONFIRMED COMMON-SENSE APP TRANSACTION/);
  assert.doesNotMatch(storyPrompt, /actor_id=|target_id=|undefined/);
  assert.match(storyText, /app_story_fallback/, 'fallback warning');
  // fallback은 [SCENE]만 — 현재 장면 NPC를 임의로 발화시키지 않는다
  assert.match(storyText, /현재 장면은 직전 행동의 결과를 이어간다/);
  assert.doesNotMatch(storyText, /규칙|회사 규정|새로 적용|규칙 해제|규칙 변경|업무 환경에 반영/);
  assert.equal(mock.calls.__action.story_text.includes('[DIALOGUE]'), false, '대사 블록 없음');

  const extractRes = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, structured_action: canonicalAction }), env);
  assert.equal(extractRes.status, 200);
  const extractCall = mock.calls.filter(call => call.url.startsWith('https://llm.test') && !JSON.parse(call.body).stream).at(-1);
  const extractPayload = JSON.parse(JSON.parse(extractCall.body).messages.find(message => message.role === 'user').content);
  assert.ok(extractPayload.context.global_csa, 'Extract 전용 CSA projection 유지');
  assert.ok(!extractPayload.context.global_csa.active_ids.includes('csa_0'));

  const commitRes = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 1, structured_action: canonicalAction }), env);
  assert.equal(commitRes.status, 200);

  const afterSave = mock.getSave();
  assert.ok(!afterSave.csa_active.includes('csa_0'), 'csa_active에서 대상 제거');
  assert.equal(afterSave.csa_rules.csa_0.active, false, '규칙 비활성');
  assert.equal(mock.calls.__action.processing_status, 'committed', '액션 committed');
});
test('preset catalog exposes only Company v2 stable selectors', () => {
  const normalized = normalizeCompanyCsaCatalog(catalog);
  const flat = JSON.stringify(normalized);
  for (const legacy of ['nurse', 'doctor', 'medical_staff', 'hospital_staff', 'female_staff', 'male_staff',
    'everyone_in_hospital', 'patient', 'assigned_patient', 'guardian', 'visitor']) {
    assert.ok(!flat.includes(`"${legacy}"`), `${legacy} 노출 금지`);
  }
  for (const g of ['business_visitor', 'assigned_visitor', 'partner_contact', 'guest']) {
    assert.ok(!flat.includes(`"${g}"`), `${g} 노출 금지`);
  }
  for (const id of ['company_employee', 'female_employee', 'male_employee']) {
    assert.ok(normalized.selector_options.some(o => o.id === id), `selector ${id}`);
  }
  const label = id => normalized.selector_options.find(o => o.id === id)?.label;
  assert.equal(label('company_employee'), '회사 직원 전체');
  assert.equal(label('female_employee'), '회사 여성 직원 전체');
  assert.equal(label('male_employee'), '회사 남성 직원 전체');
  assert.equal(label('company_employee'), '회사 직원 전체');
  const userFacing = JSON.stringify({
    labels: normalized.items.map(i => i.label),
    templates: normalized.items.map(i => i.content_template),
    optionLabels: normalized.selector_options.map(o => o.label)
  });
  for (const word of ['병원', '간호사', '의사', '환자', '보호자', '진료', '체온', '검사 위치', '상담 자세', '상담이 끝날', '외부 방문자', '협력사', '방문객']) {
    assert.ok(!userFacing.includes(word), `사용자 노출 문구 금지: ${word}`);
  }
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
  assert.ok(CSA_CONTRACT_TARGET_GROUPS.has('company_employee'), 'target 그룹에 company_employee');
});

test('catalog content has no malformed authority template', () => {
  assert.equal(catalog.items.some(entry => entry.id === 'department_bonus_tied_to_supervisor_satisfaction'), false);
  assert.doesNotMatch(JSON.stringify(catalog), /플레이어는에/);
});
