import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';
import { buildExtractPrompt } from '../src/engine/extract-prompt.js';
import { parseNarrative } from '../src/engine/narrative-parser.js';
import { applyGuardedStateDelta } from '../src/engine/guarded-merge.js';
import {
  buildDegradedExtractEnvelope,
  hydrateGameplayState,
  migrateCompanySave,
  normalizeGameplayExtractEnvelope,
  reducePlayerSexualState
} from '../src/engine/gameplay-state.js';
import { createApiWorker } from '../src/api/index.js';
import { createTurnRoutes, masterFromEdition, npcIdsFromEdition } from '../src/api/turn-routes.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = file => JSON.parse(read(file));
const clone = value => structuredClone(value);

test('Story prompt carries the four-section, freedom, choices, and status-board contract without a separate DIALOGUE section, and stays under the size budget', () => {
  const prompt = buildStoryPrompt({
    edition: { editionId: 'company-v1', characters: { characters: {} } },
    context: { game: {}, save: { player: { name: 'X' } }, recent_turns: [] },
    playerAction: '검토한다.',
    expectedTurn: 3
  });
  const system = prompt[0].content;
  assert.match(system, /\[1\. 서사 및 행동\].*\[2\. 플레이어 속마음\].*\[3\. 플레이어 상황판\].*\[4\. 선택지\]/);
  assert.match(system, /사용자용 섹션\(예: 별도 \[DIALOGUE\]\).*쓰지 않는다/);
  assert.match(system, /800~1000자/);
  assert.match(system, /1000~1500자/);
  assert.match(system, /1200~2000자/);
  assert.match(system, /대신 완료하지 않는다/);
  assert.match(system, /정확히 4개\. 각 줄은/);
  assert.match(system, /플레이어의 자유 입력 자체는 막지 않는다/);
  assert.ok(system.length <= 6700, `story system chars: ${system.length}`);
  const userPayload = JSON.parse(prompt[1].content);
  assert.equal(userPayload.expected_turn, 3);
  assert.ok('context' in userPayload);
  assert.ok('active_character_canon' in userPayload);
  assert.equal('status_snapshot' in userPayload, false);
});

test('Extract prompt requires independent identity axes, Story-authoritative precedence, elapsed_minutes-only time proposals, and stays under the size budget', () => {
  const prompt = buildExtractPrompt({ context: {}, storyText: 'x', parsedStory: {}, playerAction: 'x', expectedTurn: 1 });
  const system = prompt[0].content;
  assert.match(system, /never copy one into another/);
  assert.match(system, /Story choices are always authoritative/);
  assert.match(system, /Extract can never override them/);
  assert.match(system, /elapsed_minutes is your only time proposal/);
  assert.match(system, /csa_runtime_state\[csa_id\]/);
  assert.match(system, /arousal_delta, ejaculation_progress_delta, and ejaculation_completed/);
  assert.match(system, /evidence\.sexual_resolution === true/);
  assert.ok(system.length <= 5000, `extract system chars: ${system.length}`); // 예산 5000 확장 (UI 개선 지시문 반영)
});

test('Parser recognizes the Korean four-section output, extracts inline dialogue with a resolved speaker_id, and preserves legacy internal markers', () => {
  const master = { characters: [{ character_id: 'npc-seowonhee', name: '서원희' }] };
  const korean = [
    '[1. 서사 및 행동]',
    '서원희 (자료 위에 손가락을 올리고 밝게 웃으며): "이 부분부터 같이 볼까요?"',
    '나는 잠시 고민하다가 고개를 끄덕였다.',
    '',
    '[2. 플레이어 속마음]',
    '오늘 회의는 생각보다 순조롭게 흘러가고 있다.',
    '',
    '[3. 플레이어 상황판]',
    'Day 1 09:20',
    '',
    '[4. 선택지]',
    '1. 자료를 검토한다.',
    '2. 질문을 던진다.',
    '3. 잠시 생각한다.',
    '4. 주제를 바꾼다.'
  ].join('\n');
  const parsed = parseNarrative(korean, { master });
  assert.equal(parsed.choices.length, 4);
  assert.equal(parsed.player_inner_thought, '오늘 회의는 생각보다 순조롭게 흘러가고 있다.');
  assert.equal(parsed.player_status, 'Day 1 09:20');
  assert.equal(parsed.dialogue_lines.length, 1);
  assert.equal(parsed.dialogue_lines[0].speaker_id, 'npc-seowonhee');
  assert.equal(parsed.dialogue_lines[0].speaker_name, '서원희');
  assert.equal(parsed.dialogue_lines[0].text, '이 부분부터 같이 볼까요?');
  assert.ok(parsed.raw.includes(parsed.dialogue_lines[0].text));
  assert.deepEqual(parsed.warnings, []);

  const ambiguousMaster = { characters: [{ character_id: 'npc-a', name: '민준' }, { character_id: 'npc-b', name: '민준' }] };
  const ambiguous = parseNarrative(korean, { master: ambiguousMaster });
  assert.equal(ambiguous.dialogue_lines[0].speaker_id, null);

  const legacy = parseNarrative(read('fixtures/gameplay-state-v1/story-structured.txt'));
  assert.equal(legacy.choices.length, 4);
  assert.ok(legacy.player_inner_thought.length >= 180);
});

test('guarded merge computes authoritative game time, rolls over days, and defaults invalid elapsed minutes to three', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  save.world_state.game_time = { day: 2, minute_of_day: 1438 };
  const options = { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' };
  const rolled = applyGuardedStateDelta(save, { state_delta: {}, outcome: 'success', evidence: {}, choices: [], mind_monitor: {}, dialogue_lines: [], elapsed_minutes: 5 }, options);
  assert.deepEqual(rolled.time_before, { day: 2, minute_of_day: 1438 });
  assert.deepEqual(rolled.time_after, { day: 3, minute_of_day: 3 });
  assert.deepEqual(rolled.nextSave.world_state.game_time, { day: 3, minute_of_day: 3 });

  const invalid = applyGuardedStateDelta(save, { state_delta: {}, outcome: 'success', evidence: {}, choices: [], mind_monitor: {}, dialogue_lines: [], elapsed_minutes: -5 }, options);
  assert.equal(invalid.elapsed_minutes, 3);

  const noTimeField = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  const defaulted = applyGuardedStateDelta(noTimeField, { state_delta: {}, outcome: 'success', evidence: {}, choices: [], mind_monitor: {}, dialogue_lines: [] }, options);
  assert.deepEqual(defaulted.time_before, { day: 1, minute_of_day: 540 });
});

test('guarded merge validates CSA runtime axes independently and ignores only the invalid axis', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  const options = { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' };
  const result = applyGuardedStateDelta(save, {
    state_delta: {
      csa_runtime_state: {
        'csa-dress-code': { lifecycle: 'temporarily_interrupted', applicability: 'not_a_real_value', execution_state: 'interrupted' }
      }
    }, outcome: 'success', evidence: {}, choices: [], mind_monitor: {}, dialogue_lines: []
  }, options);
  assert.deepEqual(result.nextSave.csa_runtime_state['csa-dress-code'], { lifecycle: 'temporarily_interrupted', execution_state: 'interrupted' });
  assert.ok(result.warnings.some(warning => warning.includes('invalid_csa_applicability')));
});

test('guarded merge applies the player sexual-state reducer through state_delta and requires evidence for completion', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  save.player_sexual_state = { arousal: 10, ejaculation_progress: 0, ejaculation_count: 0, updated_turn: 7 };
  const options = { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' };
  const withoutEvidence = applyGuardedStateDelta(save, {
    state_delta: { player_sexual_state: { arousal_delta: 20, ejaculation_completed: true } }, outcome: 'success', evidence: {}, choices: [], mind_monitor: {}, dialogue_lines: []
  }, options);
  assert.equal(withoutEvidence.nextSave.player_sexual_state.arousal, 30);
  assert.equal(withoutEvidence.nextSave.player_sexual_state.ejaculation_count, 0);
  assert.ok(withoutEvidence.warnings.includes('unauthorized_ejaculation_completion_ignored'));

  const withEvidence = applyGuardedStateDelta(save, {
    state_delta: { player_sexual_state: { ejaculation_completed: true } }, outcome: 'success', evidence: { sexual_resolution: true }, choices: [], mind_monitor: {}, dialogue_lines: []
  }, options);
  assert.equal(withEvidence.nextSave.player_sexual_state.ejaculation_count, 1);
  assert.equal(withEvidence.nextSave.player_sexual_state.arousal, 0);
  assert.equal(withEvidence.nextSave.player_sexual_state.updated_turn, 8);
});

test('guarded merge keeps identity fields, npcs_present, mind_monitor, and dialogue_lines independent and non-destructive when unknown', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  const options = { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' };
  const result = applyGuardedStateDelta(save, {
    state_delta: {}, outcome: 'success', evidence: {}, choices: [],
    mind_monitor: { 'npc-hayeon': { surface: 'x'.repeat(150), subconscious: 'y'.repeat(180) } },
    dialogue_lines: [], npcs_present: ['npc-hayeon'], focal_character_id: 'npc-hayeon', last_speaker_id: null,
    action_target_id: 'npc-hayeon', image_character_id: null
  }, options);
  assert.equal(result.nextSave.last_npcs_present.length, 1);
  assert.equal(result.nextSave.focal_character_id, 'npc-hayeon');
  assert.equal(result.nextSave.last_speaker_id, 'npc-areum');
  assert.equal(result.action_target_id, 'npc-hayeon');
  assert.equal(result.image_character_id, null);
  assert.equal(result.mind_monitor['npc-hayeon'].surface.length, 150);

  const unknown = applyGuardedStateDelta(save, {
    state_delta: {}, outcome: 'degraded', evidence: {}, choices: [], mind_monitor: {}, dialogue_lines: [], npcs_present: []
  }, options);
  assert.deepEqual(unknown.nextSave.last_npcs_present, save.last_npcs_present);
});

test('migrate and hydrate never mutate their input and stay idempotent under repeated application', () => {
  const legacy = readJson('fixtures/gameplay-state-v1/legacy-current-save.json');
  const copy = structuredClone(legacy);
  const once = hydrateGameplayState(legacy, { characters: [] });
  const twice = hydrateGameplayState(once, { characters: [] });
  assert.deepEqual(legacy, copy);
  assert.deepEqual(once, twice);
  assert.deepEqual(migrateCompanySave(once), once);
});

test('buildDegradedExtractEnvelope preserves Story text, choices, inner thought, and status with zero extra LLM calls', () => {
  const parsedStory = parseNarrative(read('fixtures/gameplay-state-v1/story-structured.txt'));
  const degraded = buildDegradedExtractEnvelope({ parsedStory, playerAction: '검토한다.' });
  assert.equal(degraded.outcome, 'degraded');
  assert.deepEqual(degraded.state_delta, {});
  assert.equal(degraded.elapsed_minutes, 3);
  assert.equal(degraded.player_inner_thought, parsedStory.player_inner_thought);
  assert.deepEqual(degraded.choices, parsedStory.choices);
  assert.ok(degraded.warnings.includes('extract_degraded'));
  assert.equal(typeof degraded.turn_summary, 'string');
  assert.ok(degraded.turn_summary.length > 0);
});

test('Story request streams, disables thinking, uses a 5000 max_tokens envelope, and never hardcodes a model name', async () => {
  assert.doesNotMatch(read('src/api/llm.js'), /deepseek|gpt-|claude-|gemini/i);
  const gameId = '11111111-1111-4111-8111-111111111111';
  const actionId = '22222222-2222-4222-8222-222222222222';
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  const actions = new Map();
  let storyRequestBody = null;
  const fetchImpl = async (url, init = {}) => {
    const textUrl = String(url);
    if (textUrl.startsWith('https://llm.test')) {
      storyRequestBody = JSON.parse(init.body);
      return new Response('data: {"choices":[{"delta":{"content":"[SCENE]\\nhi"}}]}\n\ndata: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } });
    }
    const parsed = new URL(textUrl);
    if (parsed.pathname === '/rest/v1/game_actions' && (init.method ?? 'GET') === 'GET') {
      const found = actions.get(parsed.searchParams.get('action_id')?.replace('eq.', ''));
      return new Response(JSON.stringify([found].filter(Boolean)), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (parsed.pathname === '/rest/v1/game_actions' && init.method === 'PATCH') {
      const found = actions.get(parsed.searchParams.get('action_id')?.replace('eq.', ''));
      const expectedStatus = parsed.searchParams.get('processing_status')?.replace('eq.', '');
      if (!found || (expectedStatus && found.processing_status !== expectedStatus)) return new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } });
      Object.assign(found, JSON.parse(init.body));
      return new Response(JSON.stringify([found]), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const rpc = parsed.pathname.split('/').pop();
    const args = JSON.parse(init.body);
    if (rpc === 'reserve_turn_action') {
      const action = { action_id: args.p_action_id, turn_id: 'turn-8', expected_turn: args.p_expected_turn, player_action: args.p_player_action, processing_status: 'story_streaming' };
      actions.set(args.p_action_id, action);
      return new Response(JSON.stringify({ ...action, replayed: false }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (rpc === 'get_company_context') return new Response(JSON.stringify({ game: { id: gameId }, save: { data: save }, recent_turns: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
    if (rpc === 'record_story_result') {
      Object.assign(actions.get(args.p_action_id), { story_text: args.p_story_text, processing_status: 'extracting' });
      return new Response(JSON.stringify({ replayed: false }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify(actions.get(args?.p_action_id) ?? null), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const worker = createApiWorker({ fetchImpl });
  const env = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'k', LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'k', STORY_MODEL: 'story-test-model', EXTRACT_MODEL: 'extract-test-model' };
  await (await worker.fetch(new Request('https://worker.test/api/story', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ game_id: gameId, action_id: actionId, expected_turn: 8, player_action: 'x' })
  }), env)).text();
  assert.equal(storyRequestBody.model, 'story-test-model');
  assert.equal(storyRequestBody.stream, true);
  assert.deepEqual(storyRequestBody.thinking, { type: 'disabled' });
  assert.equal(storyRequestBody.max_tokens, 5000);
});

test('read-only Context hydrates missing game_time and player_sexual_state without writing to the database', async () => {
  const gameId = '11111111-1111-4111-8111-111111111111';
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  assert.equal('game_time' in save.world_state, false);
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method ?? 'GET' });
    return new Response(JSON.stringify({ game: { id: gameId }, save: { data: save }, recent_turns: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const worker = createApiWorker({ fetchImpl });
  const env = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'k', LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'k', STORY_MODEL: 's', EXTRACT_MODEL: 'e' };
  const response = await worker.fetch(new Request('https://worker.test/api/context', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game_id: gameId }) }), env);
  const payload = await response.json();
  assert.deepEqual(payload.data.context.save.data.world_state.game_time, { day: 1, minute_of_day: 540 });
  assert.deepEqual(payload.data.context.save.data.player_sexual_state, { arousal: 0, ejaculation_progress: 0, ejaculation_count: 0, updated_turn: 7 });
  assert.equal(calls.every(call => call.method === 'GET' || call.url.includes('get_company_context')), true);
  assert.equal(calls.some(call => call.method === 'PATCH'), false);
});

const GAME_ID = '11111111-1111-4111-8111-111111111111';
const ACTION_ID = '22222222-2222-4222-8222-222222222222';
const ENV = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'k', LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'k', STORY_MODEL: 's', EXTRACT_MODEL: 'e' };

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
}

/**
 * A fuller lifecycle mock than the read-only fixtures above: it does not auto-advance
 * processing_status on record_extract_result, so status-transition-failure recovery can
 * be exercised, and it supports failing a named RPC N times or a specific status PATCH.
 */
function createLifecycleMock({ saveOverride, storySse, extractContent, extractFinishReason, failRpc = {}, failPatchTo = null } = {}) {
  const actions = new Map();
  const save = saveOverride ?? readJson('fixtures/phase-0.5/canonical-save-v1.json');
  const context = { game: { id: GAME_ID }, save: { data: save }, recent_turns: [] };
  const calls = [];
  const rpcCallCounts = {};
  let lastExtractRequestBody = null;

  const fetchImpl = async (url, init = {}) => {
    const textUrl = String(url);
    calls.push({ url: textUrl, method: init.method ?? 'GET', body: init.body });
    if (textUrl.startsWith('https://llm.test')) {
      const body = JSON.parse(init.body);
      if (body.stream) {
        return new Response(storySse ?? 'data: {"choices":[{"delta":{"content":"[SCENE]\\nhi"}}]}\n\ndata: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } });
      }
      lastExtractRequestBody = body;
      const content = extractContent ?? JSON.stringify({ state_delta: {}, outcome: 'success', evidence: {}, choices: [], mind_monitor: {}, dialogue_lines: [] });
      return json({ choices: [{ finish_reason: extractFinishReason, message: { content } }] });
    }
    const parsed = new URL(textUrl);
    if (parsed.pathname === '/rest/v1/game_actions' && (init.method ?? 'GET') === 'GET') {
      const found = actions.get(parsed.searchParams.get('action_id')?.replace('eq.', ''));
      return json([found].filter(Boolean));
    }
    if (parsed.pathname === '/rest/v1/game_actions' && init.method === 'PATCH') {
      const id = parsed.searchParams.get('action_id').replace('eq.', '');
      const action = actions.get(id);
      const body = JSON.parse(init.body);
      if (failPatchTo && body.processing_status === failPatchTo) return json({ code: 'XXUNK', message: 'patch failed' }, 500);
      const expectedStatus = parsed.searchParams.get('processing_status')?.replace('eq.', '');
      const requiresEmptyErrorCode = parsed.searchParams.get('error_code') === 'is.null';
      if (!action || (expectedStatus && action.processing_status !== expectedStatus) || (requiresEmptyErrorCode && action.error_code != null)) return json([]);
      Object.assign(action, body);
      if (init.headers?.prefer === 'return=representation') return json([action]);
      return new Response(null, { status: 204 });
    }
    const rpc = parsed.pathname.split('/').pop();
    const args = JSON.parse(init.body);
    rpcCallCounts[rpc] = (rpcCallCounts[rpc] ?? 0) + 1;
    if (failRpc[rpc] && rpcCallCounts[rpc] <= failRpc[rpc]) return json({ code: 'XXUNK', message: `${rpc} failed` }, 500);
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
      Object.assign(action, { extract_delta: args.p_extract_delta });
      return json({ replayed: false });
    }
    if (rpc === 'commit_company_turn') {
      const action = actions.get(args.p_action_id);
      action.processing_status = 'committed';
      return json({ success: true, replayed: false, turn_number: args.p_expected_turn, turn_id: action.turn_id, save_revision: 1 });
    }
    if (rpc === 'get_action_status') {
      const action = actions.get(args.p_action_id);
      return json({ action_id: action.action_id, turn_id: action.turn_id, expected_turn: action.expected_turn, processing_status: action.processing_status, has_story: Boolean(action.story_text), has_extract: Boolean(action.extract_delta), error_code: action.error_code ?? null });
    }
    throw new Error(`Unhandled mock RPC: ${rpc}`);
  };
  return { fetchImpl, actions, calls, getLastExtractRequestBody: () => lastExtractRequestBody };
}

async function driveStoryToExtracting(worker, playerAction = 'x') {
  await (await worker.fetch(new Request(`https://worker.test/api/story`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ game_id: GAME_ID, action_id: ACTION_ID, expected_turn: 8, player_action: playerAction })
  }), ENV)).text();
}

test('Extract prompt receives the same hydrated Context as Story (defaulted game_time) through the compact context projection', async () => {
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  assert.equal('game_time' in save.world_state, false);
  const mock = createLifecycleMock({ saveOverride: save });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  await driveStoryToExtracting(worker);
  await worker.fetch(new Request('https://worker.test/api/extract', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game_id: GAME_ID, action_id: ACTION_ID }) }), ENV);
  const requestPayload = JSON.parse(mock.getLastExtractRequestBody().messages[1].content);
  assert.deepEqual(requestPayload.context.time, { day: 1, minute_of_day: 540 });
  assert.equal('save' in requestPayload.context, false);
});

test('record_extract_result failure marks the action extract_failed and stays recoverable via retry_extract', async () => {
  const mock = createLifecycleMock({ failRpc: { record_extract_result: 1 } });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  await driveStoryToExtracting(worker);
  const failed = await worker.fetch(new Request('https://worker.test/api/extract', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game_id: GAME_ID, action_id: ACTION_ID }) }), ENV);
  assert.equal(failed.status, 502);
  assert.equal(mock.actions.get(ACTION_ID).processing_status, 'extract_failed');
  const status = await worker.fetch(new Request('https://worker.test/api/action-status', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game_id: GAME_ID, action_id: ACTION_ID }) }), ENV);
  assert.equal((await status.json()).data.recoverable_step, 'retry_extract');
  const recovered = await worker.fetch(new Request('https://worker.test/api/extract', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game_id: GAME_ID, action_id: ACTION_ID }) }), ENV);
  assert.equal(recovered.status, 200);
});

test('a failed committing status-transition patch never leaves the action stuck: Extract still succeeds and Commit still completes', async () => {
  const mock = createLifecycleMock({ failPatchTo: 'committing' });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  await driveStoryToExtracting(worker);
  const extractResponse = await worker.fetch(new Request('https://worker.test/api/extract', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game_id: GAME_ID, action_id: ACTION_ID }) }), ENV);
  assert.equal(extractResponse.status, 200);
  assert.ok(mock.actions.get(ACTION_ID).extract_delta);
  const status = await worker.fetch(new Request('https://worker.test/api/action-status', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game_id: GAME_ID, action_id: ACTION_ID }) }), ENV);
  assert.equal((await status.json()).data.recoverable_step, 'resume_extract');
  const replay = await worker.fetch(new Request('https://worker.test/api/extract', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game_id: GAME_ID, action_id: ACTION_ID }) }), ENV);
  assert.equal((await replay.json()).data.replayed, true);
  const commit = await worker.fetch(new Request('https://worker.test/api/commit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game_id: GAME_ID, action_id: ACTION_ID, expected_turn: 8 }) }), ENV);
  assert.equal(commit.status, 200);
  const llmCalls = mock.calls.filter(call => call.url.startsWith('https://llm.test'));
  assert.equal(llmCalls.length, 2);
});

test('Context timing log includes context_rpc_ms', async () => {
  const mock = createLifecycleMock();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const originalLog = console.log;
  const lines = [];
  console.log = message => lines.push(message);
  try {
    await worker.fetch(new Request('https://worker.test/api/context', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game_id: GAME_ID }) }), ENV);
  } finally {
    console.log = originalLog;
  }
  const timingLine = lines.map(line => JSON.parse(line)).find(entry => entry.event === 'company_turn_timing' && entry.event_stage === 'context');
  assert.ok(timingLine);
  assert.equal(typeof timingLine.context_rpc_ms, 'number');
});

test('masterFromEdition and npcIdsFromEdition convert id-keyed content maps into stable arrays and an NPC id set', () => {
  const edition = {
    characters: { characters: { 'npc-hayeon': { name: 'Hayeon', initial_stats: { affection: 0 } } } },
    generalNpcs: { profiles: { 'npc-general-1': { name: 'General' } } }
  };
  const master = masterFromEdition(edition);
  assert.deepEqual(master.characters, [{ character_id: 'npc-hayeon', name: 'Hayeon', initial_stats: { affection: 0 } }]);
  const npcIds = npcIdsFromEdition(edition);
  assert.equal(npcIds.has('npc-hayeon'), true);
  assert.equal(npcIds.has('npc-general-1'), true);
  assert.equal(npcIds.has('npc-unknown'), false);
});

test('normalizeGameplayExtractEnvelope drops unknown identity ids and Mind Monitor entries with warnings', () => {
  const npcIds = new Set(['npc-hayeon']);
  const raw = {
    state_delta: {}, outcome: 'success', evidence: {}, dialogue_lines: [],
    npcs_present: ['npc-hayeon', 'npc-ghost'],
    action_target_id: 'npc-ghost', focal_character_id: 'npc-hayeon', last_speaker_id: 'npc-unknown', image_character_id: 'npc-hayeon',
    mind_monitor: { 'npc-hayeon': { surface: 'x'.repeat(150), subconscious: 'y'.repeat(180) }, 'npc-ghost': { surface: 'x'.repeat(150), subconscious: 'y'.repeat(180) } }
  };
  const normalized = normalizeGameplayExtractEnvelope(raw, { parsedStory: {}, npcIds });
  assert.deepEqual(normalized.npcs_present, ['npc-hayeon']);
  assert.equal(normalized.action_target_id, null);
  assert.equal(normalized.focal_character_id, 'npc-hayeon');
  assert.equal(normalized.last_speaker_id, null);
  assert.equal(normalized.image_character_id, 'npc-hayeon');
  assert.deepEqual(Object.keys(normalized.mind_monitor), ['npc-hayeon']);
  assert.ok(normalized.warnings.includes('unknown_npc_id:npcs_present:npc-ghost'));
  assert.ok(normalized.warnings.includes('unknown_npc_id:action_target_id:npc-ghost'));
  assert.ok(normalized.warnings.includes('unknown_npc_id:last_speaker_id:npc-unknown'));
  assert.ok(normalized.warnings.includes('unknown_npc_id:mind_monitor:npc-ghost'));
});

test('normalizeGameplayExtractEnvelope skips NPC id validation entirely when no npcIds set is supplied', () => {
  const raw = { state_delta: {}, outcome: 'success', evidence: {}, dialogue_lines: [], npcs_present: ['npc-anything'], focal_character_id: 'npc-anything', mind_monitor: {} };
  const normalized = normalizeGameplayExtractEnvelope(raw, { parsedStory: {} });
  assert.deepEqual(normalized.npcs_present, ['npc-anything']);
  assert.equal(normalized.focal_character_id, 'npc-anything');
  assert.equal(normalized.warnings.some(w => w.startsWith('unknown_npc_id')), false);
});

test('guarded merge allows a state delta for a newly-present NPC validated this turn', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  const npcIds = new Set(['npc-newcomer']);
  const options = { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x', npcIds };
  // npc_stats deltas are clamped through the relationship reducer (affinity/csa_acceptance/
  // sexual_arousal/work_trust), not free-form assignment — a bare +1 affinity delta with no
  // reason string is well within the +-5/turn cap and applies cleanly.
  const result = applyGuardedStateDelta(save, {
    state_delta: { npc_stats: { 'npc-newcomer': { affinity: 1 } } }, outcome: 'success', evidence: {},
    choices: [], mind_monitor: {}, dialogue_lines: [], npcs_present: ['npc-newcomer']
  }, options);
  assert.equal(result.nextSave.npc_stats['npc-newcomer'].affinity, 1);
  assert.ok(!result.warnings.some(w => w.startsWith('absent_npc_patch')));

  const withoutValidation = applyGuardedStateDelta(save, {
    state_delta: { npc_stats: { 'npc-newcomer': { affection: 1 } } }, outcome: 'success', evidence: {},
    choices: [], mind_monitor: {}, dialogue_lines: [], npcs_present: ['npc-newcomer']
  }, { ...options, npcIds: undefined });
  assert.ok(withoutValidation.warnings.some(w => w.startsWith('absent_npc_patch:npc_stats:npc-newcomer')));
});

test('Extract may only enrich a parser dialogue line speaker_id for a matching order and text, never rewrite it', () => {
  const parsedStory = {
    dialogue_lines: [
      { speaker_id: null, speaker_name: '서원희', direction: '웃으며', text: '안녕하세요.', order: 0 },
      { speaker_id: 'npc-already-known', speaker_name: '민준', direction: '', text: '네.', order: 1 }
    ]
  };
  const raw = {
    state_delta: {}, outcome: 'success', evidence: {}, npcs_present: [], mind_monitor: {},
    dialogue_lines: [
      { speaker_id: 'npc-seowonhee', speaker_name: '서원희', direction: 'REWRITTEN', text: '안녕하세요.', order: 0 },
      { speaker_id: 'npc-different', speaker_name: '민준', direction: '', text: '네.', order: 1 },
      { speaker_id: 'npc-x', speaker_name: '???', direction: '', text: '전혀 다른 대사', order: 0 }
    ]
  };
  const normalized = normalizeGameplayExtractEnvelope(raw, { parsedStory });
  assert.equal(normalized.dialogue_lines.length, 2);
  assert.equal(normalized.dialogue_lines[0].speaker_id, 'npc-seowonhee');
  assert.equal(normalized.dialogue_lines[0].direction, '웃으며');
  assert.equal(normalized.dialogue_lines[0].text, '안녕하세요.');
  assert.equal(normalized.dialogue_lines[1].speaker_id, 'npc-already-known');
});

test('reducePlayerSexualState and migrateCompanySave preserve unknown nested player_sexual_state fields', () => {
  const base = { arousal: 10, ejaculation_progress: 0, ejaculation_count: 0, updated_turn: 3, custom_note: { source: 'story', tags: ['a', 'b'] } };
  const reduced = reducePlayerSexualState(base, { arousal_delta: 5 });
  assert.deepEqual(reduced.state.custom_note, { source: 'story', tags: ['a', 'b'] });
  assert.equal(reduced.state.arousal, 15);

  const save = { save_schema_version: 1, edition: 'company-v1', player_sexual_state: base, world_state: {} };
  const migrated = migrateCompanySave(save);
  assert.deepEqual(migrated.player_sexual_state.custom_note, { source: 'story', tags: ['a', 'b'] });
});

test('the top-level envelope is the sole writer for identity/snapshot fields; a duplicate state_delta path is dropped with a warning', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  const options = { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' };
  const result = applyGuardedStateDelta(save, {
    state_delta: { focal_character_id: 'npc-areum', last_speaker_id: 'npc-hayeon', last_choices: ['stale-a', 'stale-b'] },
    outcome: 'success', evidence: {}, choices: ['real-1', 'real-2', 'real-3', 'real-4'], mind_monitor: {}, dialogue_lines: [],
    focal_character_id: 'npc-hayeon', last_speaker_id: 'npc-areum'
  }, options);
  assert.equal(result.nextSave.focal_character_id, 'npc-hayeon');
  assert.equal(result.nextSave.last_speaker_id, 'npc-areum');
  assert.deepEqual(result.nextSave.last_choices, ['real-1', 'real-2', 'real-3', 'real-4']);
  assert.ok(result.warnings.includes('duplicate_state_path:focal_character_id'));
  assert.ok(result.warnings.includes('duplicate_state_path:last_speaker_id'));
  assert.ok(result.warnings.includes('duplicate_state_path:last_choices'));
  assert.ok(!result.warnings.some(w => w.startsWith('unknown_state_path:focal_character_id')));
});

test('hydrateGameplayState fills npc_relationship_state, npc_stats, and csa_attitudes from the contract canonical initial_* fields', () => {
  const save = migrateCompanySave({ save_schema_version: 1, edition: 'company-v1', world_state: {} });
  const master = {
    characters: [{
      character_id: 'npc-hayeon',
      initial_stats: { affection: 2 },
      initial_relationship: { closeness: 'acquaintance' },
      initial_csa_attitudes: { 'csa-dress-code': { familiarity: 0, resistance: 10, acceptance: 0, discomfort: 0, conscious_violation: false, last_changed_turn: 0 } }
    }]
  };
  const hydrated = hydrateGameplayState(save, master);
  assert.deepEqual(hydrated.npc_stats['npc-hayeon'], { affinity: 2, sexual_arousal: 0 }); // 레거시 affection은 affinity로 정본화 + sexual_arousal 0 보충
  assert.deepEqual(hydrated.npc_relationship_state['npc-hayeon'], { closeness: 'acquaintance' });
  assert.deepEqual(hydrated.csa_attitudes['npc-hayeon']['csa-dress-code'], { familiarity: 0, resistance: 10, acceptance: 0, discomfort: 0, conscious_violation: false, last_changed_turn: 0 });

  const legacyAliasMaster = { characters: [{ character_id: 'npc-legacy', initial_relationship_state: { closeness: 'familiar' } }] };
  const hydratedLegacy = hydrateGameplayState(save, legacyAliasMaster);
  assert.deepEqual(hydratedLegacy.npc_relationship_state['npc-legacy'], { closeness: 'familiar' });

  const bothMaster = { characters: [{ character_id: 'npc-both', initial_relationship: { closeness: 'canonical' }, initial_relationship_state: { closeness: 'legacy' } }] };
  const hydratedBoth = hydrateGameplayState(save, bothMaster);
  assert.deepEqual(hydratedBoth.npc_relationship_state['npc-both'], { closeness: 'canonical' });
});

test('an unknown player_sexual_state delta key never fails the whole turn, and only that key is removed with a warning', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  const options = { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' };
  const envelope = {
    state_delta: { player_sexual_state: { sexual_relationship_completed: true, arousal_delta: 12 } },
    outcome: 'success', evidence: {}, choices: [], mind_monitor: {}, dialogue_lines: []
  };
  assert.doesNotThrow(() => applyGuardedStateDelta(save, envelope, options));
  const result = applyGuardedStateDelta(save, envelope, options);
  assert.equal(result.nextSave.player_sexual_state.arousal, save.player_sexual_state.arousal + 12);
  assert.equal(result.nextSave.player_sexual_state.ejaculation_count, 0);
  assert.ok(result.warnings.includes('unauthorized_sexual_completion_field_ignored:sexual_relationship_completed'));
});

test('a genuinely unrelated player_sexual_state key is dropped as unknown_player_sexual_state_delta, not a completion claim', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  const options = { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' };
  const result = applyGuardedStateDelta(save, {
    state_delta: { player_sexual_state: { mood_hint: 'flushed', arousal_delta: 3 } },
    outcome: 'success', evidence: {}, choices: [], mind_monitor: {}, dialogue_lines: []
  }, options);
  assert.equal(result.nextSave.player_sexual_state.arousal, save.player_sexual_state.arousal + 3);
  assert.ok(result.warnings.includes('unknown_player_sexual_state_delta:mood_hint'));
  assert.equal(result.warnings.some(w => w.startsWith('unauthorized_sexual_completion_field_ignored')), false);
});

test('ejaculation_completed without evidence still only drops that flag; with evidence it applies normally, alongside the sanitized delta', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  save.player_sexual_state = { arousal: 50, ejaculation_progress: 80, ejaculation_count: 0, updated_turn: 7 };
  const options = { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' };
  const envelope = evidence => ({
    state_delta: { player_sexual_state: { ejaculation_completed: true, illegal_field: 'x' } },
    outcome: 'success', evidence, choices: [], mind_monitor: {}, dialogue_lines: []
  });

  const withoutEvidence = applyGuardedStateDelta(save, envelope({}), options);
  assert.equal(withoutEvidence.nextSave.player_sexual_state.ejaculation_count, 0);
  assert.equal(withoutEvidence.nextSave.player_sexual_state.arousal, 50);
  assert.ok(withoutEvidence.warnings.includes('unauthorized_ejaculation_completion_ignored'));
  assert.ok(withoutEvidence.warnings.includes('unknown_player_sexual_state_delta:illegal_field'));

  const withEvidence = applyGuardedStateDelta(save, envelope({ sexual_resolution: true }), options);
  assert.equal(withEvidence.nextSave.player_sexual_state.ejaculation_count, 1);
  assert.equal(withEvidence.nextSave.player_sexual_state.arousal, 0);
  assert.equal(withEvidence.nextSave.player_sexual_state.ejaculation_progress, 0);
  assert.ok(!withEvidence.warnings.includes('unauthorized_ejaculation_completion_ignored'));
});
