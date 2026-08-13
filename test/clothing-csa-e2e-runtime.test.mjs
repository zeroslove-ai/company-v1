import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTurnRoutes } from '../src/api/turn-routes.js';
import { projectGlobalCsa } from '../src/engine/gameplay-state.js';
import { stableStringify, sha256Base64url, signAppValidationProof } from '../src/engine/csa/transaction-validator.js';
import edition from '../src/api/edition.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

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

// 운영 save와 동일한 fixture — committed_turn 54, active csa_42/csa_42_1,
// inactive csa_2/csa_5 존재, heroine3 clothing={}, story_summary_recent에
// "속옷 차림 준수" 주장.
function operatingSave() {
  const base = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  return {
    ...base,
    edition: 'company-v1',
    save_schema_version: 1,
    turn_state: { committed_turn: 54, expected_turn: 55, processing_status: 'ready' },
    csa_active: ['csa_42', 'csa_42_1'],
    csa_rules: {
      csa_42: { active: true, content: '성적 긴장 원인 확인 및 완화', strength: 'medium', preset: { template_id: 'identify_and_relieve_sexual_tension' }, created_turn: 42, activated_game_time: { day: 1, minute_of_day: 954 } },
      csa_42_1: { active: true, content: '여성 직원 속옷 차림 근무', strength: 'medium', preset: { template_id: 'work_in_underwear_only', affected_group: 'female_employee', mode: 'continuous' }, created_turn: 42, activated_game_time: { day: 1, minute_of_day: 954 } },
      csa_2: { active: false, content: '대화할 때 무릎 위에 앉기', strength: 'weak', preset: { template_id: 'sit_on_target_lap_while_talking' }, created_turn: 2 },
      csa_5: { active: false, content: '속옷 미착용 근무', strength: 'weak', preset: { template_id: 'work_without_underwear' }, created_turn: 5 }
    },
    csa_runtime_state: {
      csa_42: { lifecycle: 'active', character_id: 'heroine2', started_turn: 42, applicability: 'applicable', execution_state: 'executed', last_confirmed_turn: 48 },
      csa_42_1: { lifecycle: 'active', character_id: 'heroine2', started_turn: 42, applicability: 'applicable', execution_state: 'executed', last_confirmed_turn: 48 },
      csa_2: { lifecycle: 'deactivated', end_reason: '비활성화', character_id: 'heroine2', started_turn: 2, applicability: 'applicable', execution_state: 'not_started', last_confirmed_turn: 39 },
      csa_5: { lifecycle: 'deactivated', end_reason: '비활성화', character_id: 'heroine2', started_turn: 5, applicability: 'applicable', execution_state: 'not_started', last_confirmed_turn: 39 }
    },
    scene_state: {
      ...(base.scene_state ?? {}),
      scene_id: 'brand_strategy_meeting',
      location_id: 'brand_strategy_meeting_room',
      participants: ['player-1', 'heroine2'],
      updated_turn: 54
    },
    last_npcs_present: ['heroine2'],
    npc_scene_state: {
      heroine2: { present: true, location_id: 'brand_strategy_meeting_room', clothing: {}, updated_turn: 54 },
      heroine3: { present: false, clothing: {}, updated_turn: 32 }
    },
    focal_character_id: 'heroine2',
    last_speaker_id: 'heroine2',
    story_summary_recent: '김제나는 규정대로 속옷 차림으로 근무 중이라고 답했다',
    npc_stats: {
      heroine1: { affinity: 6, resistance: 45, csa_acceptance: 4, sexual_arousal: 28 },
      heroine2: { affinity: 6, resistance: 60, csa_acceptance: 31, sexual_arousal: 1 },
      heroine3: { affinity: 12, resistance: 35, csa_acceptance: 65, sexual_arousal: 0 },
      heroine4: { affinity: 6, resistance: 65, csa_acceptance: 30, sexual_arousal: 0 },
      heroine5: { affinity: 10, resistance: 30, csa_acceptance: 37, sexual_arousal: 24 }
    },
    npc_relationship_state: {},
    npc_emotion: {},
    npc_work_state: {},
    event_ledger: [],
    sexual_event_ledger: [],
    csa_attitudes: {},
    world_state: { weekday: '월요일', game_time: { day: 1, minute_of_day: 1003 } }
  };
}

function allMessagesText(messages) {
  return messages.map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? '')).join('\n');
}

/** 운영 save fixture에서 inactive 규정이 어떤 payload에도 없는지 검증. */
function assertNoInactiveCsa(messages, label) {
  const allText = allMessagesText(messages);
  assert.ok(!allText.includes('무릎 위에 앉기'), `${label}: csa_2 content 미노출`);
  assert.ok(!allText.includes('속옷 미착용 근무'), `${label}: csa_5 content 미노출`);
  for (const m of messages) {
    if (m.role !== 'user' || typeof m.content !== 'string') continue;
    let payload;
    try { payload = JSON.parse(m.content); } catch { continue; }
    const rules = payload?.context?.global_csa?.rules ?? {};
    const runtime = payload?.context?.global_csa?.runtime_state ?? {};
    assert.ok(!('csa_2' in rules), `${label}: global_csa.rules에 csa_2 없음`);
    assert.ok(!('csa_5' in rules), `${label}: global_csa.rules에 csa_5 없음`);
    assert.ok(!('csa_2' in runtime), `${label}: runtime_state에 csa_2 없음`);
    assert.ok(!('csa_5' in runtime), `${label}: runtime_state에 csa_5 없음`);
  }
}

/** 앱이 /api/app-validate에서 받아 Story에 실어 보내는 signed structured_action을 만든다.
 * 운영 save와 동일하게 csa_42/csa_42_1이 이미 활성이므로, 이력 검증을 위해
 * csa_42_1을 deactivate하는 transaction을 사용한다. */
async function signedStructuredAction() {
  const operations = [{
    client_id: 'csa:csa_42_1',
    domain: 'csa', operation: 'deactivate',
    id: 'csa_42_1'
  }];
  const base = { version: 1, type: 'app_transaction', base_turn_count: 54, operations };
  const actionDigest = await sha256Base64url(stableStringify(base));
  const semanticResults = [];
  const semantic_validation = { version: 1, game_id: gameId, base_turn_count: 54, action_digest: actionDigest, results: semanticResults };
  const validation_proof = await signAppValidationProof(env.SUPABASE_SERVICE_ROLE_KEY, {
    game_id: gameId, base_turn_count: 54, action_digest: actionDigest, semantic_results: semanticResults
  });
  return { ...base, semantic_validation, validation_proof };
}

function makeRuntimeHarness() {
  const save = operatingSave();
  const context = { game: { id: gameId, edition_id: 'company-v1' }, save: { data: save }, recent_turns: [] };
  const actions = new Map();
  const completionBodies = [];

  const storyText = '[SCENE]\n규정 안내가 시작됐다.\n[DIALOGUE speaker_id="heroine2"]\n[ACTING] 정중하게\n안내리는 것을 설명한다.\n[THOUGHT]\n다음 순서를 생각한다.\n[CHOICE label="질문"]\n질문한다.\n[CHOICE label="대기"]\n그대로 둔다.\n[CHOICE label="확인"]\n내용을 확인한다.\n[CHOICE label="이동"]\n다른 장소로 이동한다.';
  const freshStoryText = storyText
    .replace(/\[DIALOGUE speaker_id="([^"]+)"\]\n\[ACTING\] ([^\n]+)\n([^\n]+)\n/g, '[DIALOGUE speaker_id="$1"]$3[/DIALOGUE]\n[ACTING]$2[/ACTING]\n')
    .replace(/\[CHOICE label="[^"]+"\]/g, '[CHOICE]');
  const storySse = `data: ${JSON.stringify({ choices: [{ delta: { content: freshStoryText } }] })}\n\ndata: [DONE]\n\n`;

  async function fetchImpl(url, init = {}) {
    const textUrl = String(url);
    if (textUrl.startsWith('https://llm.test')) {
      const body = JSON.parse(init.body);
      completionBodies.push(body);
      if (body.stream) return new Response(storySse, { headers: { 'content-type': 'text/event-stream' } });
      return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
        extract_version: 2, outcome: 'success',
        scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, focal_candidate_id: null, remote_speaker_ids: [], evidence: [] },
        player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, mind_monitor: { heroine2: { surface: '오늘 일부터 하자.', subconscious: '조금 신경 쓰이네.' } }, action_target_id: null, image_character_id: null, image_selection: null,
        elapsed_minutes: 15, csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '규정 안내를 받았다.', warnings: []
      }) } }] }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const parsed = new URL(textUrl);
    const rpc = parsed.pathname.split('/').pop();
    if (parsed.pathname === '/rest/v1/game_actions' && (init.method ?? 'GET') === 'GET') {
      const id = parsed.searchParams.get('action_id')?.replace('eq.', '');
      return new Response(JSON.stringify(id ? [actions.get(id)].filter(Boolean) : []), { status: 200 });
    }
    if (parsed.pathname === '/rest/v1/game_actions' && init.method === 'PATCH') {
      const id = parsed.searchParams.get('action_id')?.replace('eq.', '');
      const expectedStatus = parsed.searchParams.get('processing_status')?.replace('eq.', '');
      const action = actions.get(id);
      if (!action) return new Response(JSON.stringify([]), { status: 200 });
      if (expectedStatus && action.processing_status !== expectedStatus) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      Object.assign(action, JSON.parse(init.body));
      return new Response(JSON.stringify([action]), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const args = JSON.parse(init.body);
    if (rpc === 'get_company_context') return new Response(JSON.stringify(context), { status: 200 });
    if (rpc === 'reserve_turn_action') {
      const a = { action_id: args.p_action_id, turn_id: 'turn-55', expected_turn: args.p_expected_turn, player_action: args.p_player_action, structured_action: args.p_structured_action ?? null, processing_status: 'story_streaming' };
      actions.set(args.p_action_id, a);
      return new Response(JSON.stringify({ ...a, replayed: false }), { status: 200 });
    }
    if (rpc === 'claim_game_action_stage' || rpc === 'fail_game_action_stage') {
      const a = actions.get(args.p_action_id);
      const errorMatches = args.p_expected_error_mode === 'ANY'
        || (args.p_expected_error_mode === 'NULL' && a?.error_code == null)
        || (args.p_expected_error_mode === 'EXACT' && a?.error_code === args.p_expected_error_code);
      if (!a || a.processing_status !== args.p_expected_status || !errorMatches) return new Response('null', { status: 200 });
      Object.assign(a, { processing_status: args.p_next_status, error_code: args.p_next_error_code });
      return new Response(JSON.stringify(a), { status: 200 });
    }
    if (rpc === 'record_story_result') {
      const a = actions.get(args.p_action_id);
      if (a) Object.assign(a, { story_text: args.p_story_text, parsed_blocks: args.p_parsed_blocks, processing_status: 'extracting' });
      return new Response(JSON.stringify({ replayed: false }), { status: 200 });
    }
    if (rpc === 'record_extract_result') {
      const a = actions.get(args.p_action_id);
      if (a) Object.assign(a, { extract_result: args.p_extract_result, processing_status: 'committing' });
      return new Response(JSON.stringify({ replayed: false }), { status: 200 });
    }
    if (rpc === 'apply_reserved_csa_transaction') return new Response(JSON.stringify({ success: true, applied: true, replayed: false }), { status: 200 });
    if (rpc === 'commit_company_turn') {
      return new Response(JSON.stringify({ replayed: false, committed_turn: 55 }), { status: 200 });
    }
    if (rpc === 'get_action_status') {
      const id = args.p_action_id ?? args.action_id;
      return new Response(JSON.stringify(actions.get(id) ?? { processing_status: 'ready' }), { status: 200 });
    }
    if (rpc === 'claim_action_status') {
      const id = args.p_action_id;
      const a = actions.get(id);
      if (!a) return new Response(JSON.stringify(null), { status: 200 });
      Object.assign(a, { processing_status: args.p_to_status });
      return new Response(JSON.stringify(a), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const routes = createTurnRoutes({ fetchImpl, edition });
  const req = (p, b) => new Request(`https://worker.test${p}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
  return { routes, req, completionBodies, actions };
}

// ---------------------------------------------------------------------------
// E2E 1 — runtime wrapper 통과 CSA activate Story 요청: completion body 검사
// ---------------------------------------------------------------------------

test('P0-1 E2E: runtime wrapper 통과 Story completion body에 inactive csa_2/csa_5 0건', async () => {
  const { routes, req, completionBodies } = makeRuntimeHarness();
  const structuredAction = await signedStructuredAction();
  const story = await routes.story(req('/api/story', {
    game_id: gameId, action_id: actionId, expected_turn: 55,
    player_action: '상식개변 앱에서 새 규정을 적용한다.',
    structured_action: structuredAction
  }), env, {});
  assert.equal(story.status, 200, 'Story 응답 정상');
  const storyText = await story.clone().text();
  assert.ok(completionBodies.length >= 1, `completion 호출 발생 (${storyText.slice(0, 600)})`);
  assertNoInactiveCsa(completionBodies[0].messages, 'Story');
  const allText = allMessagesText(completionBodies[0].messages);
  assert.ok(allText.includes('성적 긴장 원인 확인'), 'csa_42 content 노출');
  assert.equal(completionBodies[0].messages.length, 2, 'Story transport is exactly SYSTEM + USER');
  assert.doesNotMatch(allText, /APP TRANSACTION INPUT FIREWALL/);
  // deactivate transaction이므로 csa_42_1은 활성 목록에서 빠진다 (그래도 비활성 csa_2/csa_5는 미노출)
  assert.ok(!allText.includes('무릎 위에 앉기') && !allText.includes('속옷 미착용 근무'), '비활성 이력 미노출');
});

// ---------------------------------------------------------------------------
// E2E 2 — Extract completion body도 inactive 0건 (runtime wrapper 통과)
// ---------------------------------------------------------------------------

test('P0-1 E2E: runtime wrapper 통과 Extract completion body에 inactive csa_2/csa_5 0건', async () => {
  const { routes, req, completionBodies } = makeRuntimeHarness();
  const structuredAction = await signedStructuredAction();
  // 먼저 Story를 진행해 action 상태를 만든다 (body를 소비해야 record_story_result가 완료된다)
  const storyRes = await routes.story(req('/api/story', {
    game_id: gameId, action_id: actionId, expected_turn: 55,
    player_action: '상식개변 앱에서 새 규정을 적용한다.',
    structured_action: structuredAction
  }), env, {});
  assert.equal(storyRes.status, 200, 'Story 선행 응답 정상');
  await storyRes.text();
  const before = completionBodies.length;
  const extract = await routes.extract(req('/api/extract', {
    game_id: gameId, action_id: actionId, expected_turn: 55,
    player_action: '상식개변 앱에서 새 규정을 적용한다.'
  }), env, {});
  assert.equal(extract.status, 200, 'Extract 응답 정상');
  const extractBody = completionBodies[before];
  assert.ok(extractBody, 'Extract completion 호출 발생');
  assertNoInactiveCsa(extractBody.messages, 'Extract');
});

// ---------------------------------------------------------------------------
// E2E 3 — projectGlobalCsa 단일 정본
// ---------------------------------------------------------------------------

test('P0-1: projectGlobalCsa가 활성 규정만 반환한다', () => {
  const save = operatingSave();
  const projected = projectGlobalCsa(save);
  assert.deepEqual(Object.keys(projected.rules).sort(), ['csa_42', 'csa_42_1']);
  assert.deepEqual(Object.keys(projected.runtime_state).sort(), ['csa_42', 'csa_42_1']);
  assert.deepEqual(projected.active_ids, ['csa_42', 'csa_42_1']);
});

// ---------------------------------------------------------------------------
// 검토 판정: 남성 NPC·gender 미상 NPC에게 female_employee 규정 미적용
// ---------------------------------------------------------------------------

test('검토: 남성 NPC·gender 미상 NPC는 female_employee 착의 규정이 적용되지 않는다', async () => {
  const { requiredClothingFromActiveCsa } = await import('../src/engine/state/clothing.js');
  const rules = [
    { csa_id: 'csa_42_1', active: true, preset: { template_id: 'work_in_underwear_only', affected_group: 'female_employee', mode: 'continuous' }, created_turn: 42 }
  ];
  // 남성 NPC — female_employee 규정 적용 금지
  const male = requiredClothingFromActiveCsa(rules, { gender: 'male' });
  assert.deepEqual(male.required_clothing, {});
  assert.equal(male.source_csa_id, null);
  // gender 미상 — 적용 금지 (성별 미상 허용 제거)
  const unknown = requiredClothingFromActiveCsa(rules, {});
  assert.deepEqual(unknown.required_clothing, {});
  // 여성 NPC — 적용
  const female = requiredClothingFromActiveCsa(rules, { gender: 'female' });
  assert.equal(female.required_clothing.uniform_top, 'removed');
  assert.equal(female.source_csa_id, 'csa_42_1');
});
