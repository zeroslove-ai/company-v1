import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiWorker } from '../src/api/index.js';
import { masterFromEdition } from '../src/api/turn-routes.js';
import edition from '../src/api/edition.js';
import { HttpError } from '../src/api/http.js';

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

function createMockFetch({
  taggerEnvelope,
  extractEnvelope,
  storySseOverride,
  taggerBehavior = 'ok',        // 'ok' | 'timeout' | 'invalid' | 'null_only'
  failParsedBlocksSave = false, // 태거 최종 결과 PATCH를 0행으로 (저장 실패)
  failRecordExtract = false     // record_extract_result RPC 실패
} = {}) {
  const calls = [];
  const actions = new Map();
  const gameTurns = new Map();
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  const context = { game: { id: gameId, edition_id: 'company-v1' }, save: { data: save }, recent_turns: [] };
  const tagger = taggerEnvelope ?? { choices: [{ finish_reason: 'stop', message: { content: '{"speakers":[{"dialogue_index":1,"speaker_id":"heroine5"}]}' } }] };
  const extract = extractEnvelope ?? readJson('fixtures/phase-2/extract-valid.json');
  const extractContents = [JSON.stringify(extract)];
  let storyCall = 0;
  let extractCall = 0;
  let recordExtractFailedOnce = false;

  function taggerResponse() {
    if (taggerBehavior === 'timeout') throw Object.assign(new Error('tagging aborted'), { name: 'AbortError' });
    if (taggerBehavior === 'invalid') return { choices: [{ finish_reason: 'stop', message: { content: 'not-json{{{' } }] };
    if (taggerBehavior === 'null_only') return { choices: [{ finish_reason: 'stop', message: { content: '{"speakers":[{"dialogue_index":1,"speaker_id":null}]}' } }] };
    return tagger;
  }

  async function fetchImpl(url, init = {}) {
    const textUrl = String(url);
    calls.push({ url: textUrl, method: init.method ?? 'GET', body: init.body });
    if (textUrl.startsWith('https://llm.test')) {
      const body = JSON.parse(init.body);
      if (body.stream) return new Response(storySseOverride ?? storySse, { headers: { 'content-type': 'text/event-stream' } });
      // 태거: max_tokens 400 / extract: max_tokens 5000
      if (body.max_tokens === 400) return json(taggerResponse());
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
      // 태거 최종 결과 저장 실패 시뮬레이션 — tagged 결과가 담긴 PATCH만 0행으로 거부
      if (failParsedBlocksSave && JSON.parse(init.body)?.parsed_blocks?.tagged === true) return json([]);
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
      if (failRecordExtract && !recordExtractFailedOnce) {
        recordExtractFailedOnce = true; // 첫 저장 실패만 시뮬레이션 — 재시도는 성공해야 한다
        return json({ code: 'XX', message: 'record failed' }, 500);
      }
      const action = actions.get(args.p_action_id);
      Object.assign(action, { extract_delta: args.p_extract_delta, processing_status: 'committing' });
      return json({ replayed: false });
    }
    if (rpc === 'commit_company_turn') {
      const action = actions.get(args.p_action_id);
      action.processing_status = 'committed';
      gameTurns.set(args.p_expected_turn, { turn_number: args.p_expected_turn, turn_id: action.turn_id, parsed_blocks: action.parsed_blocks });
      return json({ success: true, replayed: false, turn_number: args.p_expected_turn, turn_id: action.turn_id, save_revision: 1 });
    }
    if (rpc === 'get_action_status') {
      const action = actions.get(args.p_action_id);
      return json(action ? { ...action, recoverable_step: action.processing_status === 'committed' ? 'complete' : 'wait_story' } : { recoverable_step: 'complete' });
    }
    return json({ ok: true });
  }
  return { fetchImpl, calls, actions, gameTurns };
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


const llmCallFilter = (mock, maxTokens) => mock.calls.filter(c =>
  String(c.url).startsWith('https://llm.test') && c.body && JSON.parse(c.body).max_tokens === maxTokens && !JSON.parse(c.body).stream).length;

function dialogueSpeakers(parsedStory) {
  return (parsedStory?.blocks ?? []).filter(b => b.type === 'dialogue').map(b => b.speaker_id);
}

test('보완-1: 운영 master 조립 — characters 5 + general_npcs 8, 실제 createApiWorker 태거 roster에 일반 NPC·in_scene·플레이어 정보 포함', async () => {
  const master = masterFromEdition(edition);
  assert.equal(master.characters.length, 5);
  assert.equal(master.general_npcs.length, 8);
  assert.ok(master.general_npcs.some(n => n.npc_id === 'general_park_jungwoo'));

  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '주말에 만나자고 한다.' }), env);
  assert.equal(story.status, 200);
  await story.text();
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(extract.status, 200);
  await extract.json();

  const taggerBody = mock.calls.find(c => String(c.url).startsWith('https://llm.test') && c.body && JSON.parse(c.body).max_tokens === 400 && !JSON.parse(c.body).stream);
  assert.ok(taggerBody, '태거 호출 확인');
  const userContent = JSON.parse(taggerBody.body).messages[1].content;
  assert.ok(userContent.includes('general_park_jungwoo'), '일반 NPC roster 포함');
  assert.ok(userContent.includes('"in_scene"'), '장면 참여 여부 포함');
  assert.ok(userContent.includes('"department"'), '부서 정보 포함');
  // 미확정 대사 1개 + 장면 후보(heroine5, player)가 in_scene true로 우선 배치
  const rosterLines = userContent.split('\n').filter(l => l.startsWith('{'));
  assert.ok(rosterLines.length >= 9, `roster ${rosterLines.length}개 (player 1 + heroine 5 + general 8)`);
});

test('보완-2a: 태거 timeout 후 Extract 재시도 — 동일 action 태거 LLM 총합 1회, 상태 timeout', async () => {
  const mock = createMockFetch({ taggerBehavior: 'timeout' });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: 'x' }), env);
  assert.equal(story.status, 200);
  await story.text();
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(extract.status, 200);
  await extract.json();
  const replay = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(replay.status, 200);
  const rb = await replay.json();
  assert.equal(rb.data.replayed, true);
  assert.equal(llmCallFilter(mock, 400), 1, '태거 호출 총합 1회');
  assert.equal(mock.actions.get(actionId).parsed_blocks?.speaker_tagging_attempted, true);
  assert.equal(mock.actions.get(actionId).parsed_blocks?.speaker_tagging_status, 'timeout');
});

test('보완-2b: 태거 null-only 결과 후 Extract 재시도 — 태거 총합 1회, 상태 unresolved', async () => {
  const mock = createMockFetch({ taggerBehavior: 'null_only' });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: 'x' }), env);
  await story.text();
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(extract.status, 200);
  await extract.json();
  const replay = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  const rb = await replay.json();
  assert.equal(rb.data.replayed, true);
  assert.equal(llmCallFilter(mock, 400), 1, '태거 호출 총합 1회');
  assert.equal(mock.actions.get(actionId).parsed_blocks?.speaker_tagging_status, 'unresolved');
});

test('보완-2c: 태거 invalid JSON 후 Extract 재시도 — 태거 총합 1회, 상태 invalid_response', async () => {
  const mock = createMockFetch({ taggerBehavior: 'invalid' });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: 'x' }), env);
  await story.text();
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(extract.status, 200);
  await extract.json();
  const replay = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  const rb = await replay.json();
  assert.equal(rb.data.replayed, true);
  assert.equal(llmCallFilter(mock, 400), 1, '태거 호출 총합 1회');
  assert.equal(mock.actions.get(actionId).parsed_blocks?.speaker_tagging_status, 'invalid_response');
});

test('보완-2d: Extract 결과 저장 실패 후 재시도 — 태거 총합 1회(재시도는 태거 생략)', async () => {
  const mock = createMockFetch({ failRecordExtract: true });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: 'x' }), env);
  await story.text();
  // 1차 extract: 태거 1회 호출 + record_extract_result 실패 → extract_failed
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.ok(extract.status >= 500, `record_extract_result 실패로 extract_failed (${extract.status})`);
  // 2차 extract 재시도: attempted=true이므로 태거 호출 없이 extract만 재시도
  const retry = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(retry.status, 200);
  await retry.json();
  assert.equal(llmCallFilter(mock, 400), 1, '태거 호출 총합 1회');
  const extractCalls = llmCallFilter(mock, 5000);
  assert.equal(extractCalls, 2, 'extract는 재시도로 2회');
});

test('보완-3: 태거 결과 저장 실패 시 로컬 결과 미사용 — 화면·extract·DB 모두 parser 결과로 일관', async () => {
  const mock = createMockFetch({ failParsedBlocksSave: true });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '주말에 만나자고 한다.' }), env);
  assert.equal(story.status, 200);
  await story.text();
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(extract.status, 200);
  const eb = await extract.json();

  // Extract 응답 parsed_blocks = parser 결과 (태거 미적용 — 저장 실패)
  const respSpeakers = dialogueSpeakers(eb.data.parsed_blocks);
  assert.equal(respSpeakers[1], null, '로컬 태거 결과가 canonical로 승격되지 않음');
  // DB(game_actions.parsed_blocks)도 동일 parser 결과
  const dbSpeakers = dialogueSpeakers(mock.actions.get(actionId).parsed_blocks);
  assert.deepEqual(dbSpeakers, respSpeakers, 'DB와 Extract 응답 일치');
  // 시도 상태는 영속됨 (멱등성), 최종 상태는 unresolved
  assert.equal(mock.actions.get(actionId).parsed_blocks?.speaker_tagging_attempted, true);
  assert.equal(mock.actions.get(actionId).parsed_blocks?.speaker_tagging_status, 'unresolved');
  // 2차 재시도는 replay — 태거 추가 호출 없음
  const replay = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  const rb = await replay.json();
  assert.equal(rb.data.replayed, true);
  assert.equal(llmCallFilter(mock, 400), 1, '태거 호출 총합 1회');
});

test('보완-4: Extract→프론트 카드→game_actions→game_turns→reload→TTS 화자 일치', async () => {
  const mock = createMockFetch(); // 태거가 heroine5로 확정
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '주말에 만나자고 한다.' }), env);
  assert.equal(story.status, 200);
  await story.text();

  // 1) Story SSE complete의 parsed_blocks는 parser_canonical — 태거 적용 전
  const storyBody = await (async () => {
    const r = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: 'x' }), env);
    return r.text();
  })();
  void storyBody;

  // 2) Extract — 태거 결과 canonical 수신
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(extract.status, 200);
  const eb = await extract.json();
  const extractSpeakers = dialogueSpeakers(eb.data.parsed_blocks);
  assert.equal(extractSpeakers[1], 'heroine5', '태거 적용');
  assert.equal(extractSpeakers[0], 'heroine5', '명시 화자 유지');

  // 3) 프론트 대사 카드 — renderNarrative가 data-speaker-id로 사용하는 값 == blocks.speaker_id
  //    (app.js onExtract가 extracted.parsed_blocks를 renderNarrative에 전달 — canonical 객체가 곧 카드 화자)
  const frontendSpeakers = dialogueSpeakers(eb.data.parsed_blocks);
  assert.deepEqual(frontendSpeakers, extractSpeakers, '프론트 카드 화자 = Extract 응답');

  // 4) game_actions.parsed_blocks 일치
  const dbSpeakers = dialogueSpeakers(mock.actions.get(actionId).parsed_blocks);
  assert.deepEqual(dbSpeakers, extractSpeakers, 'game_actions.parsed_blocks 일치');

  // 5) Commit → game_turns.parsed_blocks 일치
  const commit = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(commit.status, 200);
  await commit.json();
  const turnSpeakers = dialogueSpeakers(mock.gameTurns.get(8)?.parsed_blocks);
  assert.deepEqual(turnSpeakers, extractSpeakers, 'game_turns.parsed_blocks 일치');

  // 6) 새로고침 — extract replay 응답이 저장된 action.parsed_blocks를 그대로 반환
  const replay = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  const rb = await replay.json();
  assert.equal(rb.data.replayed, true);
  const reloadSpeakers = dialogueSpeakers(rb.data.parsed_blocks);
  assert.deepEqual(reloadSpeakers, extractSpeakers, '새로고침(replay) 후 화자 일치');

  // 7) TTS character_id == speaker_id (extract dialogue_lines의 speaker_id 기준)
  const ttsIds = (eb.data.extract?.dialogue_lines ?? []).map(l => l.speaker_id);
  assert.ok(ttsIds.includes('heroine5'), `TTS character_id에 heroine5 포함: ${JSON.stringify(ttsIds)}`);
});
