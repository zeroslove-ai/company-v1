import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiWorker } from '../src/api/index.js';

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
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
const request = (pathName, body) => new Request(`https://worker.test${pathName}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

// Story: 대사 2개 — 하나는 명시 화자(이메이), 하나는 화자명 없는 미확정 대사
const STORY_LINES = [
  '[1. 서사 및 행동]',
  '이메이의 눈동자가 흔들렸다.',
  '이메이 (떨리는 목소리로): “저... 이번 주말에 시간 괜찮으세요?”',
  '“처음이니까 더 잘해주고 싶은 거예요.”',
  '[2. 플레이어 속마음]', '정신 차리자.',
  '[3. 플레이어 상황판]', '회의실.',
  '[4. 선택지]', '1. A', '2. B', '3. C', '4. D'
].join('\n');
// SSE data 라인은 JSON.stringify가 개행을 자동 이스케이프한다
const STORY = STORY_LINES;
const storySse = `data: ${JSON.stringify({ choices: [{ delta: { content: STORY } }] })}\n\ndata: [DONE]\n\n`;

function createMockFetch({ taggerEnvelope, extractEnvelope, storySseOverride } = {}) {
  const calls = [];
  const actions = new Map();
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  const context = { game: { id: gameId, edition_id: 'company-v1' }, save: { data: save }, recent_turns: [] };
  const tagger = taggerEnvelope ?? { choices: [{ finish_reason: 'stop', message: { content: '{"speakers":[{"dialogue_index":1,"speaker_id":"heroine5"}]}' } }] };
  const extract = extractEnvelope ?? readJson('fixtures/phase-2/extract-valid.json');
  const extractContents = [JSON.stringify(extract)];
  let storyCall = 0;
  let taggerCall = 0;
  let extractCall = 0;

  async function fetchImpl(url, init = {}) {
    const textUrl = String(url);
    calls.push({ url: textUrl, method: init.method ?? 'GET', body: init.body });
    if (textUrl.startsWith('https://llm.test')) {
      const body = JSON.parse(init.body);
      if (body.stream) return new Response(storySseOverride ?? storySse, { headers: { 'content-type': 'text/event-stream' } });
      // 태거: max_tokens 400 / extract: max_tokens 5000
      if (body.max_tokens === 400) return json(tagger);
      return json({ choices: [{ finish_reason: 'stop', message: { content: extractContents[Math.min(extractCall++, extractContents.length - 1)] } }] });
    }
    const parsed = new URL(textUrl);
    if (parsed.pathname === '/rest/v1/game_actions' && (init.method ?? 'GET') === 'GET') {
      return json([actions.get(parsed.searchParams.get('action_id')?.replace('eq.', ''))].filter(Boolean));
    }
    if (parsed.pathname === '/rest/v1/game_actions' && init.method === 'PATCH') {
      const id = parsed.searchParams.get('action_id').replace('eq.', '');
      const action = actions.get(id);
      const expectedStatus = parsed.searchParams.get('processing_status')?.replace('eq.', '');
      // story_text=not.is.null 조건(태거 저장 PATCH)이 붙었을 때만 story_text 존재를 요구
      const storyExists = parsed.searchParams.get('story_text') === 'not.is.null';
      if (!action) return json([]);
      if (expectedStatus && action.processing_status !== expectedStatus) return json([]);
      if (storyExists && !action.story_text) return json([]);
      Object.assign(action, JSON.parse(init.body));
      if (init.headers?.prefer === 'return=representation') return json([action]);
      return new Response(null, { status: 204 });
    }
    const rpc = parsed.pathname.split('/').pop();
    const args = JSON.parse(init.body);
    if (rpc === 'get_company_context') return json(context);
    if (rpc === 'reserve_turn_action') {
      let action = actions.get(args.p_action_id);
      if (!action) {
        action = { action_id: args.p_action_id, turn_id: 'turn-8', expected_turn: args.p_expected_turn, player_action: args.p_player_action, processing_status: 'story_streaming' };
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
    if (rpc === 'commit_company_turn') {
      const action = actions.get(args.p_action_id);
      action.processing_status = 'committed';
      return json({ success: true, replayed: false, turn_number: args.p_expected_turn, turn_id: action.turn_id, save_revision: 1 });
    }
    if (rpc === 'get_action_status') {
      const action = actions.get(args.p_action_id);
      return json(action ? { ...action, recoverable_step: action.processing_status === 'committed' ? 'complete' : 'wait_story' } : { recoverable_step: 'complete' });
    }
    return json({ ok: true });
  }
  return { fetchImpl, calls, actions };
}

test('14-4: full turn pipeline — story → tagger(1 call) → tagged parsed_blocks saved → extract(1 call) → commit', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });

  // 1) Story — SSE
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '주말에 만나자고 한다.' }), env);
  assert.equal(story.status, 200);
  const storyBody = await story.text();
  assert.ok(storyBody.includes('event: complete'));
  assert.ok(storyBody.includes('parsed_blocks')); // canonical parsed_blocks가 SSE complete에 포함

  const saved = mock.actions.get(actionId);
  assert.ok(saved.story_text);
  const dialogueCount = saved.parsed_blocks.blocks.filter(b => b.type === 'dialogue').length;
  assert.equal(dialogueCount, 2);
  // 태거는 extract 라우트(extracting 상태)에서 실행 → 아직 story 단계에선 0회
  const taggerCallsBefore = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && c.body && JSON.parse(c.body).max_tokens === 400).length;
  assert.equal(taggerCallsBefore, 0);

  // 2) Extract — 태거 1회 호출 + extract 1회
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(extract.status, 200);
  const extractBody = await extract.json();
  assert.ok(extractBody.data.extract);

  const llmBody = c => (c.body ? JSON.parse(c.body) : null);
  const taggerCalls = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && c.body && llmBody(c).max_tokens === 400 && !llmBody(c).stream).length;
  const extractCalls = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && c.body && llmBody(c).max_tokens === 5000 && !llmBody(c).stream).length;
  assert.equal(taggerCalls, 1, '미확정 대사가 있으면 태거 정확히 1회');
  assert.equal(extractCalls, 1, 'extract 1회');

  // 3) tagged parsed_blocks가 조건부 PATCH로 저장됨 (tagged 플래그 + 미확정 해소)
  const savedAfter = mock.actions.get(actionId);
  const dialogues = savedAfter.parsed_blocks.blocks.filter(b => b.type === 'dialogue');
  assert.equal(dialogues[0].speaker_id, 'heroine5'); // 명시 화자 유지
  assert.equal(dialogues[1].speaker_id, 'heroine5'); // 태거가 확정 (tagging 응답)
  assert.equal(dialogues[1].text, '처음이니까 더 잘해주고 싶은 거예요.');
  assert.equal(dialogues.length, 2, '대사 수 보존');
  assert.equal(savedAfter.parsed_blocks.tagged, true);

  // 4) Commit
  const commit = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(commit.status, 200);
  const commitBody = await commit.json();
  assert.equal(commitBody.data.commit.success, true);

  // 5) Replay — extract_delta가 있으면 태거/추가 LLM 호출 없음
  const beforeReplay = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && !llmBody(c).stream).length;
  const replay = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(replay.status, 200);
  const replayBody = await replay.json();
  assert.equal(replayBody.data.replayed, true);
  const afterReplay = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && !llmBody(c).stream).length;
  assert.equal(afterReplay, beforeReplay, 'replay 시 추가 LLM 호출 없음');
});

test('14-4b: fully assigned story → tagger is never called (zero extra LLM calls)', async () => {
  // 화자명 없는 대사가 없는 스토리 — 전부 확정이면 태거 호출 자체가 없어야 한다
  const noUnresolvedSse = `data: ${JSON.stringify({ choices: [{ delta: { content: '[1. 서사 및 행동]\n이메이 (차분하게): “알겠습니다.”\n[2. 플레이어 속마음]\n좋아.\n[3. 플레이어 상황판]\n회의실.\n[4. 선택지]\n1. A\n2. B\n3. C\n4. D' } }] })}\n\ndata: [DONE]\n\n`;
  const mock = createMockFetch({ storySseOverride: noUnresolvedSse });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });

  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 9, player_action: 'x' }), env);
  assert.equal(story.status, 200);
  await story.text();
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 9 }), env);
  assert.equal(extract.status, 200);
  await extract.json();

  const llmBody2 = c => (c.body ? JSON.parse(c.body) : null);
  const taggerCalls = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && c.body && llmBody2(c).max_tokens === 400 && !llmBody2(c).stream).length;
  assert.equal(taggerCalls, 0, '모두 확정된 정상 턴은 태거 호출 0회');
});
