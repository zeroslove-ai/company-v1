import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';
import { buildExtractPrompt } from '../src/engine/extract-prompt.js';
import { parseNarrative } from '../src/engine/narrative-parser.js';
import { applyGuardedStateDelta } from '../src/engine/guarded-merge.js';
import { buildDegradedExtractEnvelope, hydrateGameplayState, migrateCompanySave } from '../src/engine/gameplay-state.js';
import { createApiWorker } from '../src/api/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = file => JSON.parse(read(file));
const clone = value => structuredClone(value);

test('Story prompt carries the four-section, freedom, choices, and status-board contract without a separate DIALOGUE section', () => {
  const prompt = buildStoryPrompt({
    edition: { editionId: 'company-v1' },
    context: { game: {}, save: { player: { name: 'X' } }, recent_turns: [] },
    playerAction: '검토한다.',
    expectedTurn: 3
  });
  const system = prompt[0].content;
  assert.match(system, /\[1\. 서사 및 행동\].*\[2\. 플레이어 속마음\].*\[3\. 플레이어 상황판\].*\[4\. 선택지\]/);
  assert.match(system, /사용자용.*별도의.*\[DIALOGUE\].*만들지 않는다/);
  assert.match(system, /800~1000자/);
  assert.match(system, /1000~1500자/);
  assert.match(system, /1200~2000자/);
  assert.match(system, /대신 완료하지 않는다/);
  assert.match(system, /정확히 4개를 목표로/);
  assert.match(system, /어떤 CSA도 플레이어의 자유 입력 자체를 막지 않는다/);
  const userPayload = JSON.parse(prompt[1].content);
  assert.equal(userPayload.expected_turn, 3);
  assert.ok('status_snapshot' in userPayload);
});

test('Extract prompt requires independent identity axes, Story-authoritative precedence, and elapsed_minutes-only time proposals', () => {
  const prompt = buildExtractPrompt({ context: {}, storyText: 'x', parsedStory: {}, playerAction: 'x', expectedTurn: 1 });
  const system = prompt[0].content;
  assert.match(system, /never copy one into another/);
  assert.match(system, /Story choices are always authoritative/);
  assert.match(system, /can never override the Story-authored versions/);
  assert.match(system, /elapsed_minutes is your only time proposal/);
  assert.match(system, /csa_runtime_state\[csa_id\]/);
  assert.match(system, /arousal_delta, ejaculation_progress_delta, and ejaculation_completed/);
  assert.match(system, /evidence\.sexual_resolution === true/);
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
