import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiWorker } from '../src/api/index.js';
import { masterFromEdition } from '../src/api/turn-routes.js';
import edition from '../src/api/edition.js';
import { HttpError } from '../src/api/http.js';
import { parsedTurnNarrative } from '../src/frontend/pages/render.js';
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
// Fresh semantic Story fixture: raw blocks are preserved byte-for-byte.
const STORY_LINES = [
  '[SCENE]',
  '이메이의 눈동자가 흔들렸다.',
  '',
  '[DIALOGUE speaker_id="heroine5"]first dialogue line[/DIALOGUE]',
  '[ACTING] 떨리는 목소리로 손끝을 만지작거리며',
  '저... 이번 주말에 시간 괜찮으세요?',
  '',
  '[/ACTING]\n[DIALOGUE speaker_id="heroine5"]second dialogue line[/DIALOGUE]',
  '[ACTING] 고개를 숙이며 조심스럽게',
  '처음이니까 더 잘해주고 싶은 거예요.',
  '',
  '[/ACTING]\n[SCENE]',
  '잠시 침묵이 흘렀다.'
].join('\n');
// SSE data 라인은 JSON.stringify가 개행을 자동 이스케이프한다
const STORY = [
  STORY_LINES,
  '[THOUGHT]',
  '\uC0C1\uD669\uC744 \uC815\uB9AC\uD574\uC57C \uD55C\uB2E4.',
  '[CHOICE]', '\uC8FC\uBCC0\uC744 \uC0B4\uD3B4\uBCF8\uB2E4.',
  '[CHOICE]', '\uB300\uD654\uB97C \uC2DC\uC791\uD55C\uB2E4.',
  '[CHOICE]', '\uC7A0\uC2DC \uAE30\uB2E4\uB9B0\uB2E4.',
  '[CHOICE]', '\uB2E4\uB978 \uC7A5\uC18C\uB85C \uAC04\uB2E4.'
].join('\n');
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
  saveOverride = null,
  reservationStructuredAction,
  persistedStructuredAction,
  actionKind = null
} = {}) {
  const calls = [];
  const actions = new Map();
  const gameTurns = new Map();
  const baseSave = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  const save = saveOverride ?? baseSave;
  const context = { game: { id: gameId, edition_id: 'company-v1' }, save: { data: save }, recent_turns: [] };
  const extract = extractEnvelope ?? {
    extract_version: 2,
    outcome: 'partial',
    scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, focal_candidate_id: null, remote_speaker_ids: [], evidence: [] },
    player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3,
    mind_monitor: { heroine1: { surface: '오늘 일부터 하자.', subconscious: '조금 신경 쓰이네.' }, heroine2: { surface: '자료를 확인하자.', subconscious: '괜찮아.' }, heroine5: { surface: '자료를 확인하자.', subconscious: '괜찮아.' } }, action_target_id: null, image_character_id: null, image_selection: null,
    csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '', warnings: []
  };
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
        action = {
          action_id: args.p_action_id, turn_id: 'turn-8', expected_turn: args.p_expected_turn,
          player_action: args.p_player_action,
          structured_action: persistedStructuredAction !== undefined ? persistedStructuredAction : (args.p_structured_action ?? null),
          processing_status: 'story_streaming',
          ...(actionKind ? { action_kind: actionKind } : {})
        };
        actions.set(args.p_action_id, action);
        return json({ ...action, structured_action: reservationStructuredAction !== undefined ? reservationStructuredAction : action.structured_action, replayed: false });
      }
      if (args.p_player_action !== action.player_action) return json({ code: 'action_conflict', message: 'action_id is already bound to another player action' }, 409);
      return json({ ...action, structured_action: reservationStructuredAction !== undefined ? reservationStructuredAction : action.structured_action, replayed: true });
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
    if (rpc === 'apply_reserved_csa_transaction') return json({ success: true, applied: true, replayed: false });
    if (rpc === 'commit_company_turn') {
      const action = actions.get(args.p_action_id);
      action.processing_status = 'committed';
      lastCommitSave = structuredClone(args.p_next_save);
      context.save.data = structuredClone(args.p_next_save);
      gameTurns.set(args.p_expected_turn, { turn_number: args.p_expected_turn, turn_id: action.turn_id, story_text: action.story_text, structured_action: action.structured_action, parsed_blocks: action.parsed_blocks });
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
  assert.equal(storyBody.includes('event: block_start'), true, 'stream exposes structured block metadata');
  assert.equal(storyBody.includes(JSON.stringify({ text: STORY })), false, 'visible stream does not emit the raw wire protocol');

  const saved = mock.actions.get(actionId);
  assert.equal(saved.story_text, STORY, 'stored action story is the upstream raw Story');
  const dialogueCount = saved.parsed_blocks.blocks.filter(b => b.type === 'dialogue').length;
  assert.equal(dialogueCount, 2);
  const frontendProjection = parsedTurnNarrative({ story_text: saved.story_text, parsed_blocks: saved.parsed_blocks });
  assert.deepEqual(
    frontendProjection.blocks.map(block => block.type),
    saved.parsed_blocks.blocks.map(block => block.type),
    'frontend consumes persisted semantic blocks without the legacy section parser'
  );
  assert.deepEqual(
    frontendProjection.blocks.filter(block => block.type === 'dialogue').map(block => block.speaker_id),
    ['heroine5', 'heroine5']
  );
  assert.equal(frontendProjection.choices.length, 4);
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
    assert.equal(d.direction, null, 'Fresh ACTING is not dialogue direction metadata');
  }
  assert.equal(savedAfter.parsed_blocks.acting_events.length, 2);
  assert.ok(savedAfter.parsed_blocks.acting_events.every(event => event.text.length > 0));

  // 4) Commit
  const commit = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(commit.status, 200);
  const commitBody = await commit.json();
  assert.equal(commitBody.data.commit.success, true);
  assert.equal(mock.gameTurns.get(8).story_text, mock.actions.get(actionId).story_text);
  assert.deepEqual(mock.gameTurns.get(8).structured_action, mock.actions.get(actionId).structured_action);

  const replayStory = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '주말에 만나자고 한다.' }), env);
  const replayStoryBody = await replayStory.text();
  assert.equal(replayStoryBody.includes('event: block_start'), true, 'replay exposes structured block metadata');
  assert.equal(replayStoryBody.includes(JSON.stringify({ text: STORY })), false, 'replay projects raw wire protocol to visible text');
  const differentReplay = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '다른 행동' }), env);
  assert.equal(differentReplay.status, 409, 'same action_id cannot replay a different player action');

  // 5) Replay — extract_delta가 있으면 추가 LLM 호출 없음
  const beforeReplay = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && !llmBody(c).stream).length;
  const replay = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(replay.status, 200);
  const replayBody = await replay.json();
  assert.equal(replayBody.data.replayed, true);
  const afterReplay = mock.calls.filter(c => String(c.url).startsWith('https://llm.test') && !llmBody(c).stream).length;
  assert.equal(afterReplay, beforeReplay, 'replay 시 추가 LLM 호출 없음');
});

test('stored action route parity rejects reservation/row divergence before Story LLM and preserves exact rows when omitted', async () => {
  const actionA = { type: 'app_transaction', version: 1, operations: [{ operation: 'activate', id: 'csa_1' }] };
  const actionB = { type: 'app_transaction', version: 1, operations: [{ operation: 'deactivate', id: 'csa_1' }] };
  const mismatchCases = [
    { reservationStructuredAction: actionA, persistedStructuredAction: null },
    { reservationStructuredAction: null, persistedStructuredAction: actionA },
    { reservationStructuredAction: actionA, persistedStructuredAction: actionB }
  ];
  for (const options of mismatchCases) {
    const mock = createMockFetch(options);
    const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
    const before = mock.calls.filter(call => String(call.url).startsWith('https://llm.test')).length;
    const response = await worker.fetch(request('/api/story', {
      game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '일반 행동'
    }), env);
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error.code, 'structured_action_persistence_mismatch');
    assert.equal(mock.calls.filter(call => String(call.url).startsWith('https://llm.test')).length, before);
  }

  const mock = createMockFetch({ reservationStructuredAction: actionA, persistedStructuredAction: actionA, actionKind: 'feedback_revision' });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', {
    game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '앱 변경을 이어간다.'
  }), env);
  assert.equal(story.status, 200);
  await story.text();
  const stored = mock.actions.get(actionId);
  assert.deepEqual(stored.structured_action, actionA);
});

test('navigation Commit uses the current deterministic location and generic scene observation', async () => {
  const extractEnvelope = {
    extract_version: 2,
    outcome: 'success',
    scene_observation: {
      scene_id: 'brand-strategy-scene', location_id: 'brand_strategy_office',
      final_present_npc_ids: ['heroine2'],
      focal_candidate_id: null,
      remote_speaker_ids: ['heroine5'], evidence: [
        { kind: 'presence', character_id: 'heroine2', quote: STORY_LINES.split('\n')[1] }
      ]
    },
    player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] },
    evidence: {}, elapsed_minutes: 3, action_target_id: null, image_character_id: null,
    image_selection: null, csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '',
    mind_monitor: { heroine2: { surface: '오늘 일부터 하자.', subconscious: '조금 신경 쓰이네.' }, heroine5: { surface: '자료를 확인하자.', subconscious: '괜찮아.' } },
    warnings: []
  };
  const mock = createMockFetch({ saveOverride: v2Save(), extractEnvelope });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const playerAction = '윤민아 보러 간다';

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
  assert.equal(nextSave.focal_character_id, null);
  assert.equal(nextSave.npc_scene_state.heroine5?.present ?? false, false);
  assert.equal(nextSave.npc_scene_state.heroine2?.present ?? true, true);
});

test('engine mandatory clothing composes before provider Story and wins at Commit', async () => {
  const save = v2Save();
  save.csa_active = ['csa_clothing'];
  save.csa_rules = {
    csa_clothing: {
      id: 'csa_clothing', source_type: 'preset', active: true, created_turn: 1,
      content: '회사 여성 직원은 근무 중 팬티 없이 평소 근무복을 입어야 한다.',
      preset: {
        template_id: 'no_panties_under_work_clothes', subject_scope: 'female_employee', mode: 'continuous',
        execution: { kind: 'clothing_state', action: 'set_clothing_state', trigger_kind: 'always_during_work', target_required: false, required_state: { underwear_bottom: 'removed' } }
      }
    }
  };
  save.npc_scene_state.heroine5 = { ...save.npc_scene_state.heroine5, clothing: { underwear_bottom: 'worn' } };
  const providerStory = STORY.replace('[THOUGHT]', '[ACTING enactment_id="turn:8:csa_clothing:heroine5:0"]\nThe required clothing state is established.\n[/ACTING]\n[THOUGHT]');
  const storySseOverride = 'data: ' + JSON.stringify({ choices: [{ delta: { content: providerStory } }] }) + '\n\ndata: [DONE]\n\n';
  const mock = createMockFetch({ saveOverride: save, storySseOverride });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const story = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 8, player_action: '업무를 시작한다.' }), env);
  assert.equal(story.status, 200);
  const storyBody = await story.text();
  const stored = mock.actions.get(actionId);
  const storyRequest = mock.calls.find(call => String(call.url).startsWith('https://llm.test') && call.body && JSON.parse(call.body).stream === true);
  const storyPayload = JSON.parse(JSON.parse(storyRequest.body).messages[1].content);
  assert.equal(storyPayload.engine_canonical_segments.length, 1);
  assert.deepEqual(storyPayload.engine_canonical_segments[0], {
    segment_id: storyPayload.engine_canonical_segments[0].segment_id,
    segment_kind: 'clothing_state',
    source_rule_id: 'csa_clothing',
    actor_id: 'heroine5',
    execution_kind: 'clothing_state',
    action: 'set_clothing_state',
    state_effect: 'transitioned',
    required_state: { underwear_bottom: 'removed' },
  });
  assert.equal('canonical_text' in storyPayload.engine_canonical_segments[0], false);
  assert.doesNotMatch(stored.story_text, /canonical_text/);
  assert.match(stored.story_text, /enactment_id="turn:8:csa_clothing:heroine5:0"/);
  assert.equal(stored.parsed_blocks.engine_enactments.length, 1);
  const extract = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(extract.status, 200);
  const commit = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 8 }), env);
  assert.equal(commit.status, 200);
  assert.equal(mock.getLastCommitSave().npc_scene_state.heroine5.clothing.underwear_bottom, 'removed');
});
