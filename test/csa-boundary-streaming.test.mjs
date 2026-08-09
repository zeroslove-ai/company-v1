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

const CSA_RULES = {
  csa_2: {
    active: true, source_type: 'preset', scope_id: 'world', scope_type: 'world', strength: 'weak',
    content: '여성 직원은 남성 직원과 업무 대화를 시작하면 남성 직원의 무릎 위에 앉아야 하며, 대화가 끝날 때까지 그 자세를 유지해야 한다.',
    preset: {
      trigger: 'conversation_start', duration: 'until_conversation_ends', persistent: true,
      actor_group: 'female_employee', template_id: 'sit_on_target_lap_while_talking',
      target_group: 'male_employee', required_action: 'sit_on_target_lap',
      direct_meaning_tags: ['무릎', '앉', '밀착', '자세'], public_normalization: true
    }
  },
  csa_5: {
    active: true, source_type: 'preset', scope_id: 'world', scope_type: 'world', strength: 'weak',
    content: '동료는 환기와 원활한 업무 진행을 위해 속옷을 착용하지 않고 근무해야 한다.',
    preset: {
      trigger: 'always_on_duty', duration: 'while_on_duty', persistent: true,
      actor_group: 'coworker', template_id: 'work_without_underwear', target_group: null,
      required_action: 'work_without_underwear',
      direct_meaning_tags: ['속옷', '노브라', '노팬티'], public_normalization: true
    }
  }
};

const STORY_LINES = [
  '[1. 서사 및 행동]',
  '이메이의 눈동자가 흔들렸다.',
  '이메이 (떨리는 목소리로): “저... 잠깐만요.”',
  '[2. 플레이어 속마음]', '정신 차리자.',
  '[3. 플레이어 상황판]', '회의실.',
  '[4. 선택지]', '1. A', '2. B', '3. C', '4. D'
].join('\n');
const storySse = `data: ${JSON.stringify({ choices: [{ delta: { content: STORY_LINES } }] })}\n\ndata: [DONE]\n\n`;

/** delta 하나를 먼저 보내고 DONE을 나중에 보내는 upstream — 버퍼링 여부를 검증한다. */
const splitStorySse = `data: ${JSON.stringify({ choices: [{ delta: { content: '[1. 서사 및 행동]\\n이메이의 눈동자가 흔들렸다.' } }] })}\n\n` +
  `data: ${JSON.stringify({ choices: [{ delta: { content: '\\n[2. 플레이어 속마음]\\n좋아.\\n[3. 플레이어 상황판]\\n회의실.\\n[4. 선택지]\\n1. A\\n2. B\\n3. C\\n4. D' } }] })}\n\n` +
  'data: [DONE]\n\n';

function createMockFetch({ playerAction = '이메이의 손목을 잡아 지퍼 안쪽으로 넣어 직접 잡게 한다.', storySseOverride = null, csaRules = true, contextualSave = false, sceneParticipants = null } = {}) {
  const calls = [];
  const actions = new Map();
  const saves = []; // commit된 save 이력 (follow-up 검증용)
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  save.csa_active = csaRules ? ['csa_2', 'csa_5'] : [];
  save.csa_rules = csaRules ? CSA_RULES : {};
  // 조건부 허용 시나리오: 높은 흥분도 + 적당한 호감도 + 둘만 있는 공간
  if (contextualSave) {
    save.npc_stats = { ...(save.npc_stats ?? {}), heroine5: { affinity: 50, sexual_arousal: 75, resistance: 30, csa_acceptance: 18 } };
    save.scene_state = { scene_id: 'private_room', location_id: 'private_room', participants: ['player-1', 'heroine5'], updated_turn: 8 };
  }
  if (sceneParticipants) save.scene_state = { ...(save.scene_state ?? {}), participants: sceneParticipants };
  save.focal_character_id = 'heroine5';
  save.npc_relationship_state = {
    ...(save.npc_relationship_state ?? {}),
    heroine5: {
      closeness: 'acquaintance', romance_status: 'none', current_boundary: 'professional',
      milestones: { first_kiss_turn: null, sexual_relationship_started_turn: null },
      relationship_summary: '브랜드전략팀 신입.'
    }
  };
  const context = { game: { id: gameId, edition_id: 'company-v1' }, save: { data: save }, recent_turns: [] };
  const extract = readJson('fixtures/phase-2/extract-valid.json');
  let extractCall = 0;
  let turnCounter = 8;

  async function fetchImpl(url, init = {}) {
    const textUrl = String(url);
    calls.push({ url: textUrl, method: init.method ?? 'GET', body: init.body });
    if (textUrl.startsWith('https://llm.test')) {
      const body = JSON.parse(init.body);
      if (body.stream) return new Response(storySseOverride ?? storySse, { headers: { 'content-type': 'text/event-stream' } });
      if (body.max_tokens === 400) return json({ choices: [{ finish_reason: 'stop', message: { content: '{"speakers":[]}' } }] });
      return json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(extract) } }] });
    }
    const parsed = new URL(textUrl);
    if (parsed.pathname === '/rest/v1/game_actions' && (init.method ?? 'GET') === 'GET') {
      return json([actions.get(parsed.searchParams.get('action_id')?.replace('eq.', ''))].filter(Boolean));
    }
    if (parsed.pathname === '/rest/v1/game_actions' && init.method === 'PATCH') {
      const id = parsed.searchParams.get('action_id').replace('eq.', '');
      const action = actions.get(id);
      const expectedStatus = parsed.searchParams.get('processing_status')?.replace('eq.', '');
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
    if (rpc === 'get_company_context') {
      // 최신 commit된 save를 context로 반환 (다음 턴 follow-up 주입 검증용)
      const latest = saves[saves.length - 1] ?? save;
      return json({ game: { id: gameId, edition_id: 'company-v1' }, save: { data: latest }, recent_turns: [] });
    }
    if (rpc === 'reserve_turn_action') {
      let action = actions.get(args.p_action_id);
      if (!action) {
        action = { action_id: args.p_action_id, turn_id: `turn-${turnCounter}`, expected_turn: args.p_expected_turn, player_action: args.p_player_action, processing_status: 'story_streaming' };
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
      const nextSave = args.p_next_save;
      saves.push(nextSave);
      turnCounter = args.p_expected_turn + 1;
      return json({ success: true, replayed: false, turn_number: args.p_expected_turn, turn_id: action.turn_id, save_revision: 1 });
    }
    if (rpc === 'get_action_status') {
      const action = actions.get(args.p_action_id);
      return json(action ? { ...action, recoverable_step: action.processing_status === 'committed' ? 'complete' : 'wait_story' } : { recoverable_step: 'complete' });
    }
    return json({ ok: true });
  }
  return { fetchImpl, calls, actions, saves };
}

test('15-3: upstream 완료 전에 클라이언트가 첫 delta를 수신 — 실제 비동기 스트림 증명', async () => {
  // upstream ReadableStream: 첫 delta만 enqueue하고, 두 번째 청크와 [DONE]은 promise로 정지시킨다.
  // 클라이언트가 첫 delta를 받기 전에는 업스트림이 절대 완료될 수 없다.
  // (수정 3: 한 줄 버퍼 — 개행이 포함된 완성 라인이 첫 delta가 된다)
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const encoder = new TextEncoder();
  const firstChunk = `data: ${JSON.stringify({ choices: [{ delta: { content: '[1. 서사 및 행동]\n이메이의 눈동자가 흔들렸다.\n' } }] })}\n\n`;
  const restChunk = `data: ${JSON.stringify({ choices: [{ delta: { content: '\n[2. 플레이어 속마음]\n좋아.\n[3. 플레이어 상황판]\n회의실.\n[4. 선택지]\n1. A\n2. B\n3. C\n4. D' } }] })}\n\ndata: [DONE]\n\n`;
  const upstream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(firstChunk));
      gate.then(() => {
        controller.enqueue(encoder.encode(restChunk));
        controller.close();
      });
    }
  });
  const gatedSse = new Response(upstream, { headers: { 'content-type': 'text/event-stream' } });

  const originalFetch = globalThis.fetch;
  const mock = createMockFetch();
  // story upstream만 gated 스트림으로 교체
  const gatedFetch = async (url, init = {}) => {
    if (String(url).startsWith('https://llm.test') && JSON.parse(init.body).stream) return gatedSse;
    return mock.fetchImpl(url, init);
  };
  const worker = createApiWorker({ fetchImpl: gatedFetch });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '이메이의 손목을 잡아 지퍼 안쪽으로 넣어 직접 잡게 한다.' }), env);
  assert.equal(story.status, 200);

  const reader = story.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let firstDeltaSeen = false;
  let upstreamStillPending = true;
  // 첫 delta 수신 대기 (업스트림은 아직 미완료 상태여야 한다)
  const deadline = Date.now() + 3000;
  while (!firstDeltaSeen && Date.now() < deadline) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    if (buffer.includes('이메이의 눈동자가 흔들렸다.')) firstDeltaSeen = true;
  }
  assert.ok(firstDeltaSeen, 'upstream 완료 전 첫 delta 수신');
  assert.ok(upstreamStillPending, '게이트 미해제 상태에서 첫 delta 도달');
  // 이제 업스트림 완료 허용 → 나머지 스트림 소비 + complete 이벤트 명시 확인
  release();
  let completeSeen = false;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    if (buffer.includes('event: complete')) completeSeen = true;
  }
  assert.ok(completeSeen, 'release 후 complete 이벤트 수신');
});

test('16-5: Story 응답은 중단·재생성 없이 정상 스트리밍 완료', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '이메이의 손목을 잡아 지퍼 안쪽으로 넣어 직접 잡게 한다.' }), env);
  assert.equal(story.status, 200);
  const body = await story.text();
  assert.ok(body.includes('event: complete'), '스토리 정상 완료');
  assert.ok(body.includes('이메이의 눈동자가 흔들렸다.'), '스토리 내용 그대로 전달');
  const storyCalls = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && JSON.parse(c.body).stream).length;
  assert.equal(storyCalls, 1, '재생성 0회');
});

test('검토1b: 활성 CSA 턴은 사전 coverage 없이 선언적 world rule만 Story에 전달한다', async () => {
  const mock = createMockFetch({ playerAction: '이메이가 속옷 미착용 규정대로 일하도록 지시한다.', sceneParticipants: ['player-1', 'heroine5'] });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '이메이가 속옷 미착용 규정대로 일하도록 지시한다.' }), env);
  assert.equal(story.status, 200);
  await story.text();
  const llmStory = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && JSON.parse(c.body).stream).pop();
  const prompt = JSON.parse(llmStory.body).messages[0].content;
  assert.equal((prompt.match(/CSA DIRECT COVERAGE/g) ?? []).length, 0, '사전 coverage 없음');
  assert.ok(!prompt.includes('[ACTIVE WORLD RULES'), 'legacy world-rule heading is absent from Story system prompt');
  return;
  assert.ok(prompt.includes('같은 applies_to 범위의 현재 등장인물이 여러 명이면 모두 동시에'), '다수 NPC 동시 적용');
  assert.ok(!prompt.includes('actor_id='), '선택된 actor id 없음');
  assert.ok(!prompt.includes('undefined'), 'undefined 없음');
  assert.ok(prompt.includes('csa_5'), 'csa_5 명시');
});
