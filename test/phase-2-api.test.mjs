import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiWorker } from '../src/api/index.js';
import { makeJsonRequest as request, makeJsonResponse as json } from './helpers/http-mocks.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = file => JSON.parse(read(file));
const gameId = '11111111-1111-4111-8111-111111111111';
const actionId = '22222222-2222-4222-8222-222222222222';
const env = {
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
  LLM_API_URL: 'https://llm.test',
  LLM_API_KEY: 'test-llm-key',
  STORY_MODEL: 'story-test',
  EXTRACT_MODEL: 'extract-test'
};

const canonicalStoryText = '[SCENE]\nA canonical scene.\n[DIALOGUE speaker_id="heroine2"]\nAcknowledged.\n[THOUGHT]\nI consider the situation.\n[CHOICE]\nContinue carefully.\n[CHOICE]\nAsk a question.\n[CHOICE]\nWait a moment.\n[CHOICE]\nChange the subject.';
const canonicalSse = `data: ${JSON.stringify({ choices: [{ delta: { content: canonicalStoryText } }] })}\n\ndata: [DONE]\n\n`;

const v2ExtractFixture = ({ outcome = 'partial', npcMood = null, elapsed_minutes = 3 } = {}) => ({
  extract_version: 2,
  outcome,
  scene_observation: {
    scene_id: null, location_id: null, final_present_npc_ids: null,
    focal_candidate_id: null,
    remote_speaker_ids: [], evidence: []
  },
  player_observation: {},
  npc_observations: npcMood ? { 'npc-hayeon': { emotion: { mood: npcMood } } } : {},
  events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes,
  mind_monitor: { heroine2: { surface: '오늘 일부터 하자.', subconscious: '조금 신경 쓰이네.' } }, action_target_id: null, image_character_id: null, image_selection: null,
  csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '캠페인 검토가 진전됐다.', warnings: []
});

function createMockFetch({ incompleteStory = false, conflict = false, missingContext = false, failContextOnCall = null, storySseSequence, extractContentSequence, extractEnvelope, extractFinishReason } = {}) {
  const calls = [];
  const actions = new Map();
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  const context = { game: { id: gameId, edition_id: 'company-v1' }, save: { data: save }, recent_turns: [] };
  const incompleteSse = 'data: {"choices":[{"delta":{"content":"[SCENE] broken"}}]}\n\n';
  const storySses = storySseSequence ?? [incompleteStory ? incompleteSse : canonicalSse];
  const extract = extractEnvelope ?? v2ExtractFixture();
  const extractContents = extractContentSequence ?? [JSON.stringify(extract)];
  let storyCall = 0;
  let extractCall = 0;
  let contextCall = 0;

  async function fetchImpl(url, init = {}) {
    const textUrl = String(url);
    calls.push({ url: textUrl, method: init.method ?? 'GET', body: init.body });
    if (textUrl.startsWith('https://llm.test')) {
      const body = JSON.parse(init.body);
      if (body.stream) return new Response(storySses[Math.min(storyCall++, storySses.length - 1)], { headers: { 'content-type': 'text/event-stream' } });
      return json({ choices: [{ finish_reason: extractFinishReason, message: { content: extractContents[Math.min(extractCall++, extractContents.length - 1)] } }] });
    }
    const parsed = new URL(textUrl);
    if (parsed.pathname === '/rest/v1/game_actions' && (init.method ?? 'GET') === 'GET') {
      return json([actions.get(parsed.searchParams.get('action_id')?.replace('eq.', ''))].filter(Boolean));
    }
    if (parsed.pathname === '/rest/v1/game_actions' && init.method === 'PATCH') {
      const id = parsed.searchParams.get('action_id').replace('eq.', '');
      const action = actions.get(id);
      const expectedStatus = parsed.searchParams.get('processing_status')?.replace('eq.', '');
      const requiresEmptyErrorCode = parsed.searchParams.get('error_code') === 'is.null';
      if (!action || (expectedStatus && action.processing_status !== expectedStatus) || (requiresEmptyErrorCode && action.error_code != null)) return json([]);
      Object.assign(action, JSON.parse(init.body));
      if (init.headers?.prefer === 'return=representation') return json([action]);
      return new Response(null, { status: 204 });
    }
    const rpc = parsed.pathname.split('/').pop();
    const args = JSON.parse(init.body);
    if (rpc === 'get_company_context') {
      contextCall += 1;
      if (missingContext) return json({ code: 'P0002', message: 'game not found' }, 500);
      if (failContextOnCall === contextCall) return json({ code: 'XXUNK', message: 'transient context failure' }, 500);
      return json(context);
    }
    if (rpc === 'reserve_turn_action') {
      let action = actions.get(args.p_action_id);
      if (!action) {
        action = { action_id: args.p_action_id, turn_id: 'turn-8', expected_turn: args.p_expected_turn, player_action: args.p_player_action, structured_action: args.p_structured_action ?? null, processing_status: 'story_streaming' };
        actions.set(args.p_action_id, action);
        return json({ ...action, replayed: false });
      }
      return json({ ...action, replayed: true });
    }
    if (rpc === 'record_story_result') {
      const action = actions.get(args.p_action_id);
      Object.assign(action, { story_text: args.p_story_text, parsed_blocks: args.p_parsed_blocks, processing_status: 'extracting' });
      return json({ replayed: false });
    }
    if (rpc === 'record_extract_result') {
      const action = actions.get(args.p_action_id);
      Object.assign(action, { extract_delta: args.p_extract_delta, processing_status: 'committing' });
      return json({ replayed: false });
    }
    if (rpc === 'apply_reserved_csa_transaction') return json({ success: true, applied: true, replayed: false });
    if (rpc === 'commit_company_turn') {
      if (conflict) return json({ code: '40001', message: 'expected turn conflict', details: null, hint: null }, 500);
      const action = actions.get(args.p_action_id);
      action.processing_status = 'committed';
      return json({ success: true, replayed: false, turn_number: args.p_expected_turn, turn_id: action.turn_id, save_revision: 1 });
    }
    if (rpc === 'get_action_status') {
      const action = actions.get(args.p_action_id);
      return json({ action_id: action.action_id, turn_id: action.turn_id, expected_turn: action.expected_turn, processing_status: action.processing_status, has_story: Boolean(action.story_text), has_extract: Boolean(action.extract_delta), error_code: action.error_code ?? null });
    }
    throw new Error(`Unhandled mock RPC: ${rpc}`);
  }
  return { fetchImpl, calls, actions };
}

test('Phase 2 worker preserves health and context RPC behavior', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const health = await worker.fetch(new Request('https://worker.test/health'), {});
  assert.equal(health.status, 200);
  const response = await worker.fetch(request('/api/context', { game_id: gameId }), env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.context.game.id, gameId);
  assert.equal(mock.calls.filter(call => call.url.includes('/get_company_context')).length, 1);
});

test('Phase 2 Story streams once, records, and replays without another LLM call', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const body = { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '수정안을 검토한다.' };
  const first = await worker.fetch(request('/api/story', body), env);
  const firstText = await first.text();
  assert.match(firstText, /event: delta/);
  assert.match(firstText, /event: complete/);
  assert.equal(mock.calls.filter(call => call.url.startsWith('https://llm.test')).length, 1);
  assert.ok(mock.actions.get(actionId).story_text);
  const replay = await worker.fetch(request('/api/story', body), env);
  assert.match(await replay.text(), /"replayed":true/);
  assert.equal(mock.calls.filter(call => call.url.startsWith('https://llm.test')).length, 1);
});

test('Phase 2 incomplete Story is not recorded and Extract plus Commit use stored server data', async () => {
  const broken = createMockFetch({ incompleteStory: true });
  const brokenWorker = createApiWorker({ fetchImpl: broken.fetchImpl });
  const body = { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '검토한다.' };
  const response = await brokenWorker.fetch(request('/api/story', body), env);
  assert.match(await response.text(), /story_incomplete/);
  assert.equal(broken.actions.get(actionId).story_text, undefined);

  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  await (await worker.fetch(request('/api/story', body), env)).text();
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId }), env);
  assert.equal((await extract.json()).data.replayed, false);
  const llmCalls = mock.calls.filter(call => call.url.startsWith('https://llm.test')).length;
  const replay = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId }), env);
  assert.equal((await replay.json()).data.replayed, true);
  assert.equal(mock.calls.filter(call => call.url.startsWith('https://llm.test')).length, llmCalls);
  const commit = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 8, next_save: { ignored: true } }), env);
  assert.equal(commit.status, 200);
  assert.equal(mock.calls.filter(call => call.url.includes('/commit_company_turn')).length, 1);
  const commitReplay = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(commitReplay.status, 200);
  assert.equal(mock.calls.filter(call => call.url.includes('/commit_company_turn')).length, 2);
  const status = await worker.fetch(request('/api/action-status', { game_id: gameId, action_id: actionId }), env);
  assert.equal((await status.json()).data.recoverable_step, 'complete');
});

test('Phase 2 maps commit conflicts without repair calls', async () => {
  const mock = createMockFetch({ conflict: true });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const body = { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '검토한다.' };
  await (await worker.fetch(request('/api/story', body), env)).text();
  await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId }), env);
  const commit = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(commit.status, 409);
  assert.deepEqual((await commit.json()).error, { code: 'turn_conflict', message: 'expected turn conflict', retryable: false });
  assert.equal(mock.calls.filter(call => call.url.startsWith('https://llm.test')).length, 2);
});

test('Phase 2 maps PostgREST not-found SQLSTATE responses', async () => {
  const mock = createMockFetch({ missingContext: true });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const response = await worker.fetch(request('/api/context', { game_id: gameId }), env);
  assert.equal(response.status, 404);
  assert.deepEqual((await response.json()).error, { code: 'not_found', message: 'game not found', retryable: false });
});

test('Phase 2 retries one failed Story explicitly and then replays the persisted result', async () => {
  const mock = createMockFetch({ storySseSequence: [
    'data: {"choices":[{"delta":{"content":"[SCENE] broken"}}]}\n\n',
    canonicalSse
  ] });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const body = { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '재시도한다.' };
  assert.match(await (await worker.fetch(request('/api/story', body), env)).text(), /story_incomplete/);
  const failedStatus = await worker.fetch(request('/api/action-status', { game_id: gameId, action_id: actionId }), env);
  assert.equal((await failedStatus.json()).data.recoverable_step, 'complete');
  assert.match(await (await worker.fetch(request('/api/story', body), env)).text(), /event: complete/);
  assert.equal(mock.calls.filter(call => call.url.startsWith('https://llm.test')).length, 2);
  assert.equal(mock.actions.get(actionId).processing_status, 'extracting');
  await (await worker.fetch(request('/api/story', body), env)).text();
  assert.equal(mock.calls.filter(call => call.url.startsWith('https://llm.test')).length, 2);
});

test('Extract malformed JSON fails open to a degraded observation', async () => {
  const mock = createMockFetch({ extractContentSequence: ['not JSON'] });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const storyBody = { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '재시도한다.' };
  await (await worker.fetch(request('/api/story', storyBody), env)).text();
  const extractResponse = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId }), env);
  assert.equal(extractResponse.status, 200);
  const extractPayload = await extractResponse.json();
  assert.equal(extractPayload.data.extract.outcome, 'degraded');
  assert.equal(mock.actions.get(actionId).processing_status, 'committing');
  assert.equal(mock.actions.get(actionId).extract_delta.outcome, 'degraded');
  assert.equal(mock.calls.some(call => call.url.includes('record_extract_result')), true);
});

test('Phase 2 keeps infrastructure/context failures retryable', async () => {
  const mock = createMockFetch({ failContextOnCall: 2 });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const storyBody = { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '재시도한다.' };
  await (await worker.fetch(request('/api/story', storyBody), env)).text();
  const failedExtract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId }), env);
  assert.equal(failedExtract.status, 502);
  const failedStatus = await worker.fetch(request('/api/action-status', { game_id: gameId, action_id: actionId }), env);
  assert.equal((await failedStatus.json()).data.recoverable_step, 'complete');
  const recovered = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId }), env);
  assert.equal(recovered.status, 200);
  assert.equal('degraded' in (await recovered.json()).data, false);
  assert.equal(mock.calls.filter(call => call.url.startsWith('https://llm.test')).length, 2);
});

test('a stuck story_streaming action retries the story once, but Extract in progress still blocks duplicates', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  // story_streaming + 스토리 없음 = 좌초 액션 → 재시도 허용 (재개 경로)
  mock.actions.set(actionId, { action_id: actionId, turn_id: 'turn-8', expected_turn: 8, player_action: 'wait', processing_status: 'story_streaming' });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: 'wait' }), env);
  assert.equal(story.status, 200);
  await story.text();  // SSE body 소비 → run 실행 → LLM 호출
  assert.equal(mock.calls.filter(call => call.url.startsWith('https://llm.test')).length, 1);
  // extract 진행 중(extracting + 스토리 있음)이면 중복 extract 차단 (409 유지)
  mock.actions.set(actionId, { action_id: actionId, turn_id: 'turn-8', expected_turn: 8, player_action: 'wait', story_text: '[SCENE]\nSaved', processing_status: 'extracting', error_code: 'extract_in_progress' });
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId }), env);
  assert.equal(extract.status, 409);
  assert.equal(mock.calls.filter(call => call.url.startsWith('https://llm.test')).length, 1);
});

test('authority-violating Extract envelopes fail open without becoming runtime authority', async () => {
  const mock = createMockFetch({ extractContentSequence: [JSON.stringify({ state_delta: {}, outcome: 'not_allowed' })] });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const body = { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: 'validate extract' };
  await (await worker.fetch(request('/api/story', body), env)).text();
  const response = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId }), env);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.data.extract.outcome, 'degraded');
  assert.equal(mock.actions.get(actionId).extract_delta.outcome, 'degraded');
  assert.equal(mock.calls.some(call => call.url.includes('record_extract_result')), true);
});

test('Extract uses Story choices and the 5000-token envelope, while truncated JSON fails open', async () => {
  const storySse = 'data: {"choices":[{"delta":{"content":"[4. 선택지]\\n1. A\\n2. B\\n3. C\\n4. D"}}]}\n\ndata: [DONE]\n\n';
  const mock = createMockFetch({ storySseSequence: [canonicalSse], extractEnvelope: v2ExtractFixture() });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  await (await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: 'test' }), env)).text();
  const response = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId }), env);
  assert.equal(response.status, 200);
  assert.equal('choices' in mock.actions.get(actionId).extract_delta, false);
  assert.deepEqual(mock.actions.get(actionId).parsed_blocks.choices, ['Continue carefully.', 'Ask a question.', 'Wait a moment.', 'Change the subject.']);
  const extractCall = mock.calls.map(call => ({ ...call, parsed: call.body && JSON.parse(call.body) })).find(call => call.url.startsWith('https://llm.test') && !call.parsed.stream);
  assert.deepEqual(extractCall.parsed.thinking, { type: 'disabled' }); assert.deepEqual(extractCall.parsed.response_format, { type: 'json_object' }); assert.equal(extractCall.parsed.temperature, 0); assert.equal(extractCall.parsed.max_tokens, 5000);
  const truncated = createMockFetch({ extractFinishReason: 'length' }); const truncatedWorker = createApiWorker({ fetchImpl: truncated.fetchImpl });
  await (await truncatedWorker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: 'test' }), env)).text();
  const failed = await truncatedWorker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId }), env);
  assert.equal(failed.status, 200);
  const failedPayload = await failed.json();
  assert.equal(failedPayload.data.extract.outcome, 'degraded');
  assert.equal(truncated.actions.get(actionId).extract_delta.outcome, 'degraded');
});
