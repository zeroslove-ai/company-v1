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

function createMockFetch({ playerAction = '이메이의 손목을 잡아 지퍼 안쪽으로 넣어 직접 잡게 한다.', storySseOverride = null, csaRules = true, contextualSave = false } = {}) {
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

async function runBlockedTurn(worker, mock, expectedTurn) {
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: expectedTurn, player_action: '이메이의 손목을 잡아 지퍼 안쪽으로 넣어 직접 잡게 한다.' }), env);
  assert.equal(story.status, 200);
  const storyBody = await story.text();
  assert.ok(storyBody.includes('action_route'), 'complete에 action_route 포함');
  assert.ok(storyBody.includes('ordinary_direct_blocked'), 'blocked route');
  assert.ok(storyBody.includes('"csa_covered":false'), 'csa_covered false');
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: expectedTurn }), env);
  assert.equal(extract.status, 200);
  await extract.json();
  const commit = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: expectedTurn }), env);
  assert.equal(commit.status, 200);
  await commit.json();
}

test('15-1: CSA 범위 이탈 턴 — 추가 LLM 호출 없음 (Story 1 + Extract 1, contract 0)', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  await runBlockedTurn(worker, mock, 8);

  const llmCalls = mock.calls.filter(c => String(c.url).startsWith('https://llm.test'));
  const storyCalls = llmCalls.filter(c => JSON.parse(c.body).stream).length;
  const extractCalls = llmCalls.filter(c => !JSON.parse(c.body).stream && JSON.parse(c.body).max_tokens === 5000).length;
  const taggerCalls = llmCalls.filter(c => JSON.parse(c.body).max_tokens === 400).length;
  assert.equal(storyCalls, 1, 'Story 1회');
  assert.equal(extractCalls, 1, 'Extract 1회');
  assert.equal(taggerCalls, 0, '태거 0회 (화자 모두 확정)');
  assert.equal(llmCalls.length, 2, '전체 LLM 2회 — classifier/verifier/repair 0');
});

test('15-2: contract 계산 중 추가 네트워크 호출 없음', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '이메이의 손목을 잡아 지퍼 안쪽으로 넣어 직접 잡게 한다.' }), env);
  assert.equal(story.status, 200);
  await story.text();

  // contract는 context RPC 직후(LLM 직전) 순수 함수로 계산된다 — context 이후 LLM까지
  // 추가 fetch/DB 왕복이 0이어야 한다 (지시 15-2)
  const llmIndex = mock.calls.findIndex(c => String(c.url).startsWith('https://llm.test'));
  assert.ok(llmIndex >= 0, 'LLM 호출 존재');
  const contextIndex = mock.calls.slice(0, llmIndex).findIndex(c => String(c.url).includes('get_company_context'));
  assert.ok(contextIndex >= 0, 'context RPC 존재');
  const afterContext = mock.calls.slice(contextIndex + 1, llmIndex);
  assert.equal(afterContext.length, 0, `context 이후 LLM까지 추가 호출 0 (실제 ${afterContext.length})`);
});

test('15-3: upstream 완료 전에 클라이언트가 첫 delta를 수신 — 실제 비동기 스트림 증명', async () => {
  // upstream ReadableStream: 첫 delta만 enqueue하고, 두 번째 청크와 [DONE]은 promise로 정지시킨다.
  // 클라이언트가 첫 delta를 받기 전에는 업스트림이 절대 완료될 수 없다.
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const encoder = new TextEncoder();
  const firstChunk = `data: ${JSON.stringify({ choices: [{ delta: { content: '[1. 서사 및 행동]\n이메이의 눈동자가 흔들렸다.' } }] })}\n\n`;
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

test('15-4: action_contract_ms/action_route/action_csa_covered timing 로그', async () => {
  const logs = [];
  const originalLog = console.log;
  console.log = (...args) => { logs.push(args.join(' ')); };
  try {
    const mock = createMockFetch();
    const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
    await runBlockedTurn(worker, mock, 8);
  } finally {
    console.log = originalLog;
  }
  const timingLine = logs.find(l => l.includes('company_turn_timing') && l.includes('event_stage":"story"'));
  assert.ok(timingLine, 'story timing 로그 존재');
  const timing = JSON.parse(timingLine.slice(timingLine.indexOf('{')));
  assert.ok(Number.isFinite(timing.action_contract_ms), 'action_contract_ms 존재');
  assert.equal(timing.action_route, 'ordinary_direct_blocked');
  assert.equal(timing.action_csa_covered, 0);
  assert.equal(timing.action_material, 1);
});

test('15-5: record_story_result의 parsed_blocks에 action_execution_contract 영속', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  await runBlockedTurn(worker, mock, 8);
  const contract = mock.actions.get(actionId)?.parsed_blocks?.action_execution_contract;
  assert.ok(contract, '계약 영속');
  assert.equal(contract.route, 'ordinary_direct_blocked');
  assert.deepEqual(contract.action_types, ['genital_touch']);
  assert.equal(contract.schedule_boundary_followup, true);
  assert.equal(contract.reason_code, 'HARD_BLOCKER');
  assert.ok(contract.contextual_permission.blockers.includes('coercive_physical_control'), '강압 blocker');
});

test('16: pending boundary follow-up 생성 → 다음 턴 주입 → 소비 후 삭제 → 반복 금지', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });

  // Turn 8: blocked 계약 + commit → pending 생성
  await runBlockedTurn(worker, mock, 8);
  const saveAfterBlock = mock.saves[mock.saves.length - 1];
  assert.ok(saveAfterBlock.pending_boundary_followup, 'pending 생성');
  assert.equal(saveAfterBlock.pending_boundary_followup.source_turn, 8);
  assert.equal(saveAfterBlock.pending_boundary_followup.expires_after_turn, 9);
  assert.equal(saveAfterBlock.pending_boundary_followup.target_character_id, 'heroine5');

  // Turn 9: 다음 턴 story prompt에 BOUNDARY CONTINUITY FOLLOW-UP 주입 (턴별 새 actionId)
  const actionId9 = '33333333-3333-4333-8333-333333333333';
  const story9 = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId9, expected_turn: 9, player_action: '자리에 앉아 업무를 계속한다.' }), env);
  assert.equal(story9.status, 200);
  await story9.text();
  const story9Calls = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && JSON.parse(c.body).stream);
  const story9Prompt = JSON.parse(story9Calls[story9Calls.length - 1].body).messages[0].content;
  assert.ok(story9Prompt.includes('[BOUNDARY CONTINUITY FOLLOW-UP — 이메이]'), '다음 턴 section 주입 + 대상 이름 명시');
  assert.ok(story9Prompt.includes('반복하지 말고'), '이미 거절 시 반복 금지 문구 포함');
  assert.ok(story9Prompt.includes('다른 NPC에게 전파하지 않는다'), '대상 한정');

  // Turn 9 extract+commit → pending 삭제
  const extract9 = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId9, expected_turn: 9 }), env);
  assert.equal(extract9.status, 200);
  await extract9.json();
  const commit9 = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId9, expected_turn: 9 }), env);
  assert.equal(commit9.status, 200);
  await commit9.json();
  const saveAfter9 = mock.saves[mock.saves.length - 1];
  assert.equal(saveAfter9.pending_boundary_followup, undefined, '소비 후 삭제');

  // Turn 10: section 없음 (반복 금지)
  const actionId10 = '44444444-4444-4444-8444-444444444444';
  const story10 = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId10, expected_turn: 10, player_action: '업무를 이어간다.' }), env);
  assert.equal(story10.status, 200);
  await story10.text();
  const story10Calls = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && JSON.parse(c.body).stream);
  const story10Prompt = JSON.parse(story10Calls[story10Calls.length - 1].body).messages[0].content;
  assert.ok(!story10Prompt.includes('[BOUNDARY CONTINUITY FOLLOW-UP]'), '그다음 턴 section 없음');
});

test('16-5: blocked 턴에도 Story 응답 중단·재생성 없음 (정상 스트리밍 완료)', async () => {
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

test('state firewall: blocked 계약 턴의 commit에서 sexual milestone 승격 차단 (대상 NPC 한정)', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const blockedContract = {
    version: 1, route: 'ordinary_direct_blocked', action_types: ['genital_touch'],
    schedule_boundary_followup: true, target_id: 'heroine5'
  };
  const evilExtract = {
    state_delta: {
      npc_relationship_state: {
        heroine5: { milestones: { first_kiss_turn: 8, sexual_relationship_started_turn: 8 } },
        heroine1: { milestones: { first_kiss_turn: 3, sexual_relationship_started_turn: null } }
      },
      event_ledger: [
        { event_id: 'e1', event_type: 'sexual_event', turn: 8, summary: '키스가 이루어졌다.', participants: ['heroine5'] },
        { event_id: 'e2', event_type: 'work_event', turn: 8, summary: '회의가 끝났다.', participants: ['heroine5'] }
      ],
      npc_emotion: { heroine5: { mood: 'confused' } }
    }
  };
  const firewalled = applyContractStateFirewall(evilExtract, blockedContract);
  // 대상(heroine5) milestone 차단
  assert.equal(firewalled.state_delta.npc_relationship_state.heroine5.milestones.first_kiss_turn, undefined, 'first kiss 차단');
  assert.equal(firewalled.state_delta.npc_relationship_state.heroine5.milestones.sexual_relationship_started_turn, undefined, 'sexual milestone 차단');
  // 비대상(heroine1) milestone 보존
  assert.equal(firewalled.state_delta.npc_relationship_state.heroine1.milestones.first_kiss_turn, 3, '비대상 NPC 변화 보존');
  const events = firewalled.state_delta.event_ledger.map(e => e.event_id);
  assert.ok(!events.includes('e1'), '성적 완료 event 차단');
  assert.ok(events.includes('e2'), '일반 event 유지');
  assert.equal(firewalled.state_delta.npc_emotion.heroine5.mood, 'confused', 'emotion 변화 허용');
});

test('검토6: firewall은 거절·신고·시도 event를 보존하고 완료 event만 제거', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const blockedContract = {
    version: 1, route: 'ordinary_direct_blocked', action_types: ['genital_touch'],
    schedule_boundary_followup: true, target_id: 'heroine5'
  };
  const extract = {
    state_delta: {
      event_ledger: [
        { event_id: 'a', event_type: 'sexual_contact_completed', turn: 8, summary: '접촉이 완료되었다.', participants: ['heroine5'] },
        { event_id: 'b', event_type: 'kiss_refused', turn: 8, summary: '키스를 거절했다.', participants: ['heroine5'] },
        { event_id: 'c', event_type: 'sexual_harassment_reported', turn: 8, summary: '부적절한 행동이 신고되었다.', participants: ['heroine5'] },
        { event_id: 'd', event_type: 'genital_touch_attempt_blocked', turn: 8, summary: '시도가 막혔다.', participants: ['heroine5'] },
        { event_id: 'e', event_type: 'work_event', turn: 8, summary: '회의가 끝났다.', participants: ['heroine5'] }
      ]
    }
  };
  const firewalled = applyContractStateFirewall(extract, blockedContract);
  const ids = firewalled.state_delta.event_ledger.map(e => e.event_id);
  assert.ok(!ids.includes('a'), 'sexual_contact_completed 제거');
  assert.ok(ids.includes('b'), 'kiss_refused 유지');
  assert.ok(ids.includes('c'), 'sexual_harassment_reported 유지');
  assert.ok(ids.includes('d'), 'genital_touch_attempt_blocked 유지');
  assert.ok(ids.includes('e'), 'work_event 유지');
});

test('검토7: firewall은 대상이 다른 NPC의 성적 완료 event도 보존', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const blockedContract = { version: 1, route: 'ordinary_direct_blocked', action_types: ['genital_touch'], target_id: 'heroine5' };
  const extract = {
    state_delta: {
      // 당사자가 둘 다 명확해야 비대상 NPC↔NPC 사건으로 보존된다 (한 명만 적힌
      // 성적 완료는 나머지 한쪽이 player일 수 있어 fail-closed로 제거).
      event_ledger: [
        { event_id: 'x', event_type: 'sexual_event', turn: 8, summary: '키스가 이루어졌다.', participants: ['heroine1', 'heroine2'] }
      ]
    }
  };
  const firewalled = applyContractStateFirewall(extract, blockedContract);
  assert.ok(firewalled.state_delta.event_ledger.some(e => e.event_id === 'x'), '비대상 NPC 사건 보존');
});

test('검토3: 활성 CSA 없이 직접 성적 행동 → Story prompt에 AUTHORITATIVE 음수 계약 존재', async () => {
  const mock = createMockFetch({ csaRules: false });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '이메이의 손목을 잡아 지퍼 안쪽으로 넣어 직접 잡게 한다.' }), env);
  assert.equal(story.status, 200);
  await story.text();
  const llmStory = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && JSON.parse(c.body).stream).pop();
  const prompt = JSON.parse(llmStory.body).messages[0].content;
  assert.ok(prompt.includes('[ACTION EXECUTION CONTRACT — AUTHORITATIVE]'), 'CSA 유무와 무관한 음수 계약');
  assert.ok(prompt.includes('완료 사실로 바로 확정하지 말고'), 'attempt_only 지시');
});

test('검토1b: csa_direct 턴 — [CSA DIRECT COVERAGE] 정확히 1회 + EXACT-SCOPE LIMIT + undefined 없음', async () => {
  const mock = createMockFetch({ playerAction: '이메이와 업무 대화를 계속하며 무릎 위에 앉게 한다.' });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '이메이와 업무 대화를 계속하며 무릎 위에 앉게 한다.' }), env);
  assert.equal(story.status, 200);
  await story.text();
  const llmStory = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && JSON.parse(c.body).stream).pop();
  const prompt = JSON.parse(llmStory.body).messages[0].content;
  const coverageCount = (prompt.match(/\[CSA DIRECT COVERAGE/g) ?? []).length;
  assert.equal(coverageCount, 1, '[CSA DIRECT COVERAGE] 정확히 1회');
  assert.ok(prompt.includes('[CSA EXACT-SCOPE LIMIT]'), 'exact-scope 제한');
  assert.ok(!prompt.includes('undefined'), 'undefined 없음');
  assert.ok(!/exact action\(\)/.test(prompt), '빈 행동명 없음');
  // csa_2 정확 행동은 정상 확정
  assert.ok(prompt.includes('CSA DIRECT COVERAGE — ESTABLISHED FACT'), '정상 coverage section');
  assert.ok(prompt.includes('csa_2'), 'csa_2 명시');
});

// ---------- 조건부 허용: Extract 정본화 / LLM 회귀 (19-13, 19-14, 19-19) ----------

test('19-13: accepted+voluntary는 completed 범위만 정본화 — sexual_touch 완료는 kiss milestone을 열지 않음', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const attemptContract = { version: 1, route: 'ordinary_direct_attempt', action_types: ['sexual_touch'], target_id: 'heroine5' };
  const extract = {
    action_resolution: { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'accepted', voluntary: true, completed_action_types: ['sexual_touch'] },
    state_delta: {
      npc_relationship_state: { heroine5: { milestones: { first_kiss_turn: 8, sexual_relationship_started_turn: 8 } } },
      event_ledger: [
        { event_id: 'st', event_type: 'sexual_event', turn: 8, summary: '가슴 접촉이 이루어졌다.', action_type: 'sexual_touch', participants: ['heroine5'] }
      ]
    }
  };
  const out = applyContractStateFirewall(extract, attemptContract);
  // sexual_touch 완료 event는 보존
  assert.ok(out.state_delta.event_ledger.some(e => e.event_id === 'st'), 'completed 범위 event 보존');
  // kiss/explicit 완료가 없으므로 milestone은 열리지 않는다
  assert.equal(out.state_delta.npc_relationship_state.heroine5.milestones.first_kiss_turn, undefined, 'kiss 미완료 → first_kiss 차단');
  assert.equal(out.state_delta.npc_relationship_state.heroine5.milestones.sexual_relationship_started_turn, undefined, 'explicit 미완료 → sexual milestone 차단');
});

test('19-14: contextual attempt + ambiguous → milestone·완료 event 차단, 감정 변화 보존', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const attemptContract = { version: 1, route: 'ordinary_direct_attempt', action_types: ['sexual_touch'], target_id: 'heroine5' };
  const extract = {
    action_resolution: { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'ambiguous', voluntary: false, completed_action_types: [] },
    state_delta: {
      npc_relationship_state: { heroine5: { milestones: { first_kiss_turn: 8, sexual_relationship_started_turn: 8 } } },
      event_ledger: [
        { event_id: 'm', event_type: 'sexual_event', turn: 8, summary: '키스가 이루어졌다.', participants: ['heroine5'] },
        { event_id: 'n', event_type: 'work_event', turn: 8, summary: '대화가 이어졌다.', participants: ['heroine5'] }
      ],
      npc_emotion: { heroine5: { mood: 'confused' } }
    }
  };
  const out = applyContractStateFirewall(extract, attemptContract);
  assert.equal(out.state_delta.npc_relationship_state.heroine5.milestones.first_kiss_turn, undefined, 'ambiguous milestone 차단');
  assert.equal(out.state_delta.npc_relationship_state.heroine5.milestones.sexual_relationship_started_turn, undefined);
  const ids = out.state_delta.event_ledger.map(e => e.event_id);
  assert.ok(!ids.includes('m'), '완료 event 차단');
  assert.ok(ids.includes('n'), '일반 event 유지');
  assert.equal(out.state_delta.npc_emotion.heroine5.mood, 'confused', '감정 변화 보존');
});

test('19-19: contextual attempt 턴도 추가 LLM 0 (Story 1 + Extract 1) + route=attempt', async () => {
  const mock = createMockFetch({ contextualSave: true, playerAction: '이메이의 가슴을 만진다.' });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '이메이의 가슴을 만진다.' }), env);
  assert.equal(story.status, 200);
  const body = await story.text();
  assert.ok(body.includes('"action_route":"ordinary_direct_attempt"'), 'attempt route');
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(extract.status, 200);
  await extract.json();
  const llmCalls = mock.calls.filter(c => String(c.url).startsWith('https://llm.test'));
  assert.equal(llmCalls.filter(c => JSON.parse(c.body).stream).length, 1, 'Story 1회');
  assert.equal(llmCalls.filter(c => !JSON.parse(c.body).stream && JSON.parse(c.body).max_tokens === 5000).length, 1, 'Extract 1회');
  assert.equal(llmCalls.length, 2, 'classifier/verifier/repair 0');
});
