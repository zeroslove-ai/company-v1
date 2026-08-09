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

// Story fixture: raw scene/dialogue markers are preserved byte-for-byte.
// 대사 2개 모두 허용된 cast(heroine5) 안에서 명시 화자 + 구체 연기 지시
const STORY_LINES = [
  '[SCENE]',
  '이메이의 눈동자가 흔들렸다.',
  '',
  '[DIALOGUE speaker_id="heroine5" acting_direction="떨리는 목소리로 손끝을 만지작거리며"]',
  '저... 이번 주말에 시간 괜찮으세요?',
  '',
  '[DIALOGUE speaker_id="heroine5" acting_direction="고개를 숙이며 조심스럽게"]',
  '처음이니까 더 잘해주고 싶은 거예요.',
  '',
  '[SCENE]',
  '잠시 침묵이 흘렀다.'
].join('\n');
// SSE data 라인은 JSON.stringify가 개행을 자동 이스케이프한다
const STORY = STORY_LINES;
const storySse = `data: ${JSON.stringify({ choices: [{ delta: { content: STORY } }] })}\n\ndata: [DONE]\n\n`;

// Test save with a registered Company NPC(heroine5=이메이) in the scene.
function v2Save() {
  const base = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  return {
    ...base,
    scene_state: {
      ...(base.scene_state ?? {}),
      scene_id: 'campaign-review',
      location_id: 'meeting_room_5f',
      participants: ['player-1', 'heroine5'],
      updated_turn: 7
    },
    last_npcs_present: ['heroine5'],
    npc_scene_state: { heroine5: { present: true, location_id: 'meeting_room_5f' } },
    focal_character_id: 'heroine5',
    last_speaker_id: 'heroine5'
  };
}

function createMockFetch({
  extractEnvelope,
  storySseOverride,
  failRecordExtract = false,    // record_extract_result RPC 실패
  saveOverride = null
} = {}) {
  const calls = [];
  const actions = new Map();
  const gameTurns = new Map();
  const baseSave = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  const save = saveOverride ?? baseSave;
  const context = { game: { id: gameId, edition_id: 'company-v1' }, save: { data: save }, recent_turns: [] };
  const extract = extractEnvelope ?? readJson('fixtures/phase-2/extract-valid.json');
  const extractContents = [JSON.stringify(extract)];
  let storyCall = 0;
  let extractCall = 0;
  let recordExtractFailedOnce = false;
  let lastCommitSave = null;

  async function fetchImpl(url, init = {}) {
    const textUrl = String(url);
    calls.push({ url: textUrl, method: init.method ?? 'GET', body: init.body });
    if (textUrl.startsWith('https://llm.test')) {
      const body = JSON.parse(init.body);
      if (body.stream) return new Response(storySseOverride ?? storySse, { headers: { 'content-type': 'text/event-stream' } });
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
      if (!action) return json([]);
      if (expectedStatus && action.processing_status !== expectedStatus) return json([]);
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
      lastCommitSave = structuredClone(args.p_next_save);
      context.save.data = structuredClone(args.p_next_save);
      gameTurns.set(args.p_expected_turn, { turn_number: args.p_expected_turn, turn_id: action.turn_id, parsed_blocks: action.parsed_blocks });
      return json({ success: true, replayed: false, turn_number: args.p_expected_turn, turn_id: action.turn_id, save_revision: 1 });
    }
    if (rpc === 'get_action_status') {
      const action = actions.get(args.p_action_id);
      return json(action ? { ...action, recoverable_step: action.processing_status === 'committed' ? 'complete' : 'wait_story' } : { recoverable_step: 'complete' });
    }
    return json({ ok: true });
  }
  return { fetchImpl, calls, actions, gameTurns, getLastCommitSave: () => lastCommitSave };
}

test('14-4: full turn pipeline — raw Story streaming → Extract → Commit and replay', async () => {
  const mock = createMockFetch({ saveOverride: v2Save() });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });

  // 1) Story — SSE
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '주말에 만나자고 한다.' }), env);
  assert.equal(story.status, 200);
  const storyBody = await story.text();
  assert.ok(storyBody.includes('event: complete'));
  assert.ok(storyBody.includes('parsed_blocks')); // canonical parsed_blocks가 SSE complete에 포함
  assert.equal(storyBody.includes('event: block'), false, 'raw streaming has no block event');
  assert.equal(storyBody.includes(JSON.stringify({ text: STORY })), true, 'first raw chunk is emitted unchanged');

  const saved = mock.actions.get(actionId);
  assert.equal(saved.story_text, STORY, 'stored action story is the upstream raw Story');
  const dialogueCount = saved.parsed_blocks.blocks.filter(b => b.type === 'dialogue').length;
  assert.equal(dialogueCount, 2);
  // 2) Extract — raw Story 1회
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(extract.status, 200);
  const extractBody = await extract.json();
  assert.ok(extractBody.data.extract);
  const extractRequest = mock.calls.find(c => String(c.url).startsWith('https://llm.test') && c.body && JSON.parse(c.body).max_tokens === 5000 && JSON.parse(c.body).stream !== true);
  assert.equal(JSON.parse(JSON.parse(extractRequest.body).messages[1].content).story_text, STORY, 'Extract receives the raw Story verbatim');

  const llmBody = c => (c.body ? JSON.parse(c.body) : null);
  const extractCalls = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && c.body && llmBody(c).max_tokens === 5000 && !llmBody(c).stream).length;
  assert.equal(extractCalls, 1, 'extract 1회');

  // 3) Parsed projection preserves explicit speaker metadata without changing raw Story.
  const savedAfter = mock.actions.get(actionId);
  const dialogues = savedAfter.parsed_blocks.blocks.filter(b => b.type === 'dialogue');
  assert.equal(dialogues.length, 2, '대사 수 보존');
  for (const d of dialogues) {
    assert.equal(d.speaker_id, 'heroine5');
    assert.equal(d.speaker_name, '이메이', 'canon 기반 이름');
    assert.ok(d.direction && d.direction.length > 0, '구체 연기 지시 보존');
  }

  // 4) Commit
  const commit = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(commit.status, 200);
  const commitBody = await commit.json();
  assert.equal(commitBody.data.commit.success, true);

  const replayStory = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '주말에 만나자고 한다.' }), env);
  const replayStoryBody = await replayStory.text();
  assert.equal(replayStoryBody.includes('event: block'), false, 'replay has no block event');
  assert.equal(replayStoryBody.includes(JSON.stringify({ text: STORY })), true, 'replay delta uses stored raw Story');

  // 5) Replay — extract_delta가 있으면 추가 LLM 호출 없음
  const beforeReplay = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && !llmBody(c).stream).length;
  const replay = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(replay.status, 200);
  const replayBody = await replay.json();
  assert.equal(replayBody.data.replayed, true);
  const afterReplay = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && !llmBody(c).stream).length;
  assert.equal(afterReplay, beforeReplay, 'replay 시 추가 LLM 호출 없음');
});

test('movement Commit recomputes the scene cast instead of reading removed parsed_blocks metadata', async () => {
  const extractEnvelope = {
    state_delta: {},
    outcome: 'success',
    evidence: {},
    choices: ['A', 'B', 'C', 'D'],
    dialogue_lines: [],
    npcs_present: ['heroine2'],
    mind_monitor: {},
    warnings: []
  };
  const mock = createMockFetch({ saveOverride: v2Save(), extractEnvelope });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const playerAction = '민아 보러 간다';

  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: playerAction }), env);
  assert.equal(story.status, 200);
  await story.text();
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(extract.status, 200);
  const commit = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(commit.status, 200);

  const nextSave = mock.getLastCommitSave();
  assert.equal(nextSave.scene_state.location_id, 'brand_strategy_office');
  assert.deepEqual(nextSave.scene_state.participants, ['player-1', 'heroine2']);
  assert.deepEqual(nextSave.last_npcs_present, ['heroine2']);
  assert.equal(nextSave.focal_character_id, 'heroine2');
  assert.equal(nextSave.npc_scene_state.heroine5.present, false);
  assert.equal(nextSave.npc_scene_state.heroine2.present, true);
});
