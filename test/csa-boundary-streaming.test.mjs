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

function createMockFetch({ playerAction = '이메이의 손목을 잡아 지퍼 안쪽으로 넣어 직접 잡게 한다.', storySseOverride = null } = {}) {
  const calls = [];
  const actions = new Map();
  const saves = []; // commit된 save 이력 (follow-up 검증용)
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  save.csa_active = ['csa_2', 'csa_5'];
  save.csa_rules = CSA_RULES;
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

test('15-3: SSE 첫 delta가 [DONE] 수신 전 클라이언트에 즉시 전달 (버퍼링 없음)', async () => {
  const mock = createMockFetch({ storySseOverride: splitStorySse });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '이메이의 손목을 잡아 지퍼 안쪽으로 넣어 직접 잡게 한다.' }), env);
  assert.equal(story.status, 200);

  // 응답 스트림을 순차 소비 — 첫 delta가 DONE보다 먼저 와야 한다
  const reader = story.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let firstDeltaSeen = false;
  let doneSeen = false;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.startsWith('data:') && line.includes('이메이의 눈동자')) {
        assert.equal(doneSeen, false, '첫 delta는 DONE보다 먼저 전달');
        firstDeltaSeen = true;
      }
      if (line === 'data: [DONE]') doneSeen = true;
    }
  }
  assert.ok(firstDeltaSeen, '첫 delta가 실제로 전달됨');
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
  assert.equal(contract.reason_code, 'OUTSIDE_CSA_WITHOUT_RELATIONSHIP_PERMISSION');
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
  assert.ok(story9Prompt.includes('[BOUNDARY CONTINUITY FOLLOW-UP]'), '다음 턴 section 주입');
  assert.ok(story9Prompt.includes('반복하지 말고'), '이미 거절 시 반복 금지 문구 포함');

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

test('state firewall: blocked 계약 턴의 commit에서 sexual milestone 승격 차단', async () => {
  // extract가 first_kiss milestone을 제안해도 firewall이 차단한다
  const mock = createMockFetch();
  // extract-valid.json이 milestones를 제안하지 않으므로, guarded-merge에 milestone 제안을 주입할 수 없어
  // firewall 단위 검증은 applyContractStateFirewall 함수를 직접 사용한다.
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const blockedContract = {
    version: 1, route: 'ordinary_direct_blocked', action_types: ['genital_touch'],
    schedule_boundary_followup: true, target_id: 'heroine5'
  };
  const evilExtract = {
    state_delta: {
      npc_relationship_state: { heroine5: { milestones: { first_kiss_turn: 8, sexual_relationship_started_turn: 8 } } },
      event_ledger: [
        { event_id: 'e1', event_type: 'sexual_event', turn: 8, summary: '키스가 이루어졌다.', participants: ['heroine5'] },
        { event_id: 'e2', event_type: 'work_event', turn: 8, summary: '회의가 끝났다.', participants: ['heroine5'] }
      ],
      npc_emotion: { heroine5: { mood: 'confused' } }
    }
  };
  const firewalled = applyContractStateFirewall(evilExtract, blockedContract);
  assert.equal(firewalled.state_delta.npc_relationship_state.heroine5.milestones.first_kiss_turn, undefined, 'first kiss 차단');
  assert.equal(firewalled.state_delta.npc_relationship_state.heroine5.milestones.sexual_relationship_started_turn, undefined, 'sexual milestone 차단');
  const events = firewalled.state_delta.event_ledger.map(e => e.event_id);
  assert.ok(!events.includes('e1'), '성적 완료 event 차단');
  assert.ok(events.includes('e2'), '일반 event 유지');
  assert.equal(firewalled.state_delta.npc_emotion.heroine5.mood, 'confused', 'emotion 변화 허용');
});
