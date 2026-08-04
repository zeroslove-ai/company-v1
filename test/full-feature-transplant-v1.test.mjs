import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveCsaDirectCoverage, buildCsaDirectCoverageSection,
  normalizeGameplayExtractEnvelope
} from '../src/engine/index.js';
import { createApiWorker } from '../src/api/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const catalog = readJson('content/csa_presets.json');
const gameId = '11111111-1111-4111-8111-111111111111';
const env = {
  SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
  LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'test-llm-key', STORY_MODEL: 'story-test', EXTRACT_MODEL: 'extract-test'
};
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
const request = (pathName, body) => new Request(`https://worker.test${pathName}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

function freshSave(overrides = {}) {
  return {
    save_schema_version: 1, edition: 'company-v1',
    turn_state: { committed_turn: 0 },
    player: { name: '김하늘' }, player_progress: { level: 1, exp: 0 }, scene_state: {}, world_state: {},
    npc_stats: {}, npc_emotion: {}, npc_relationship_state: {}, npc_scene_state: {}, npc_work_state: {},
    csa_active: [], csa_rules: {}, csa_attitudes: {}, csa_runtime_state: {}, csa_aftereffect_state: {},
    event_ledger: [], story_summary_overall: '', story_summary_recent: '',
    focal_character_id: null, last_speaker_id: null, last_npcs_present: [], last_image_id: null,
    last_choices: [], last_choice_meta: [], player_setup: { completed: true },
    ...overrides
  };
}

function createMockFetch({ initialSave = freshSave(), storySseText, llmJsonResponses = [], turnsFixture = [] } = {}) {
  const calls = [];
  let currentSave = structuredClone(initialSave);
  let saveRevision = 1;
  let jsonCallIndex = 0;
  const sse = storySseText ?? 'data: {"choices":[{"delta":{"content":"[1. 서사 및 행동]\\n본문"}}]}\n\n'
    + 'data: {"choices":[{"delta":{"content":"\\n[4. 선택지]\\n1. A\\n2. B\\n3. C\\n4. D"}}]}\n\n'
    + 'data: [DONE]\n';

  async function fetchImpl(url, init = {}) {
    const textUrl = String(url);
    calls.push({ url: textUrl, method: init.method ?? 'GET', body: init.body });
    if (textUrl.startsWith('https://llm.test')) {
      const body = JSON.parse(init.body);
      if (body.stream) return new Response(sse, { headers: { 'content-type': 'text/event-stream' } });
      const payload = llmJsonResponses[Math.min(jsonCallIndex, llmJsonResponses.length - 1)];
      jsonCallIndex += 1;
      return json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(payload) } }] });
    }
    const parsed = new URL(textUrl);
    if (parsed.pathname === '/rest/v1/game_actions' && (init.method ?? 'GET') === 'GET') {
      return json([calls.__action].filter(Boolean));
    }
    if (parsed.pathname === '/rest/v1/game_turns' && (init.method ?? 'GET') === 'GET') {
      const before = parsed.searchParams.get('turn_number')?.startsWith('lt.') ? Number(parsed.searchParams.get('turn_number').slice(3)) : null;
      const limit = Number(parsed.searchParams.get('limit') ?? '20');
      let rows = [...turnsFixture].sort((a, b) => b.turn_number - a.turn_number);
      if (before !== null) rows = rows.filter(row => row.turn_number < before);
      return json(rows.slice(0, limit));
    }
    if (parsed.pathname === '/rest/v1/game_actions' && init.method === 'PATCH') {
      const expectedStatus = parsed.searchParams.get('processing_status')?.replace('eq.', '');
      const requiresEmptyErrorCode = parsed.searchParams.get('error_code') === 'is.null';
      if (!calls.__action || (expectedStatus && calls.__action.processing_status !== expectedStatus) || (requiresEmptyErrorCode && calls.__action.error_code != null)) return json([]);
      Object.assign(calls.__action, JSON.parse(init.body));
      if (init.headers?.prefer === 'return=representation') return json([calls.__action]);
      return new Response(null, { status: 204 });
    }
    const rpc = parsed.pathname.split('/').pop();
    const args = init.body ? JSON.parse(init.body) : {};
    if (rpc === 'get_company_context') {
      return json({ game: { id: gameId, edition_id: 'company-v1', title: 'T' }, save: { data: currentSave, committed_turn: currentSave.turn_state.committed_turn }, recent_turns: [] });
    }
    if (rpc === 'reserve_turn_action') {
      if (calls.__action && calls.__action.action_id === args.p_action_id) return json({ ...calls.__action, replayed: true });
      calls.__action = { action_id: args.p_action_id, turn_id: 'turn-1', expected_turn: args.p_expected_turn, player_action: args.p_player_action, processing_status: 'story_streaming', action_kind: 'player_turn' };
      return json({ ...calls.__action, replayed: false });
    }
    if (rpc === 'record_story_result') {
      Object.assign(calls.__action, { story_text: args.p_story_text, parsed_blocks: args.p_parsed_blocks, processing_status: 'extracting' });
      return json({ replayed: false });
    }
    if (rpc === 'record_extract_result') {
      Object.assign(calls.__action, { extract_delta: args.p_extract_delta, processing_status: 'committing' });
      return json({ replayed: false });
    }
    if (rpc === 'commit_company_turn') {
      currentSave = args.p_next_save;
      saveRevision += 1;
      return json({ success: true, replayed: false, turn_number: args.p_expected_turn, turn_id: 'turn-1', save_revision: saveRevision });
    }
    if (rpc === 'reserve_feedback_revision') {
      calls.__action = {
        action_id: 'feedback-action-1', turn_id: 'turn-1', expected_turn: currentSave.turn_state.committed_turn,
        player_action: calls.__lastPlayerAction ?? '원래 행동', feedback_text: args.p_feedback_text,
        revision_request_id: args.p_revision_request_id, processing_status: 'story_streaming', action_kind: 'feedback_revision'
      };
      return json({
        revision_request_id: args.p_revision_request_id, action_id: calls.__action.action_id, replacement_turn_id: 'turn-1',
        target_turn_number: currentSave.turn_state.committed_turn, original_turn_id: 'turn-0',
        original_player_action: calls.__action.player_action, pre_save: currentSave, processing_status: 'story_streaming', replayed: false
      });
    }
    if (rpc === 'commit_feedback_revision') {
      currentSave = args.p_next_save;
      saveRevision += 1;
      return json({ success: true, replayed: false, turn_number: calls.__action.expected_turn, turn_id: calls.__action.turn_id, save_revision: saveRevision });
    }
    throw new Error(`Unhandled mock RPC: ${rpc}`);
  }
  return { fetchImpl, calls, getSave: () => currentSave };
}

// ---------- Commit 1: structured-signal direct coverage ----------

function sexualCsaSave({ actorGroup = 'nurse', targetGroup = 'player', requiredAction = '__test_required_action__' } = {}) {
  return {
    csa_active: ['csa_0'],
    csa_rules: {
      csa_0: {
        active: true, source_type: 'preset', content: '테스트', strength: 'medium',
        preset: { template_id: 'test_template', actor_group: actorGroup, target_group: targetGroup, trigger: 'on_request', duration: 'continuous', required_action: requiredAction, public_normalization: true }
      }
    },
    focal_character_id: 'heroine1',
    scene_state: { participants: ['heroine1'] },
    last_choices: ['성기를 만진다', '다른 대화를 계속한다', '자리를 뜬다', '다시 확인한다'],
    last_choice_meta: [
      { choice_index: 0, action_types: ['genital_touch'], actor_id: 'heroine1', target_id: 'player', suggested_route: 'csa_direct', direct_csa_ids: ['csa_0'] }
    ]
  };
}

const sexualActionContract = { __test_required_action__: { directions: ['npc_to_player'], actions: ['genital_touch'] } };

test('direct coverage (structured): an exact actor_id/target_id/action_type/direction match on a rendered choice is covered', () => {
  const save = sexualCsaSave();
  const coverage = resolveCsaDirectCoverage(save, '성기를 만진다', { sexualActionContract });
  assert.equal(coverage.covered, true);
  assert.equal(coverage.route, 'csa_direct');
  assert.equal(coverage.direction, 'npc_to_player');
  assert.match(coverage.reason, /structured signal match/);
});

test('direct coverage (structured): a structured actor_id that does not match the CSA-resolved participant is never covered, even though the action/direction would otherwise qualify', () => {
  const save = sexualCsaSave();
  // Extract mis-reports actor_id as an id that isn't the actually-resolved present NPC.
  save.last_choice_meta[0] = { ...save.last_choice_meta[0], actor_id: 'someone_not_present' };
  const coverage = resolveCsaDirectCoverage(save, '성기를 만진다', { sexualActionContract });
  assert.equal(coverage.covered, false, 'actor_id must be cross-validated against the live save, never trusted on its own');
});

test('direct coverage (structured): ambiguous free-typed input with no matching rendered choice falls through to the tag-based fallback, never guessed as covered from actor_id alone', () => {
  const save = sexualCsaSave();
  // Custom text that doesn't match any of last_choices, and contains no material action keyword.
  const coverage = resolveCsaDirectCoverage(save, '오늘 날씨 이야기를 한다', { sexualActionContract });
  assert.equal(coverage.covered, false);
});

test('direct coverage (structured): a bundled action not covered by the contract rejects the whole choice, never partially covered', () => {
  const save = sexualCsaSave();
  save.last_choices[0] = '키스하면서 성기를 만진다';
  save.last_choice_meta[0] = { choice_index: 0, action_types: ['kiss', 'genital_touch'], actor_id: 'heroine1', target_id: 'player', suggested_route: 'csa_direct', direct_csa_ids: ['csa_0'] };
  const coverage = resolveCsaDirectCoverage(save, '키스하면서 성기를 만진다', { sexualActionContract });
  assert.equal(coverage.covered, false, 'the contract only authorizes genital_touch; bundling an uncovered kiss must reject the whole choice');
});

test('direct coverage (structured): a covered choice carries no probability, bold, or risk-tier metadata anywhere in its section text', () => {
  const save = sexualCsaSave();
  const coverage = resolveCsaDirectCoverage(save, '성기를 만진다', { sexualActionContract });
  assert.equal(coverage.covered, true);
  const section = buildCsaDirectCoverageSection(coverage);
  assert.doesNotMatch(section, /\d+\s*%|위험도\s*[:：]|bold_choice|risk_tier|success_rate/i);
});

test('direct coverage (structured): a direction mismatch (structured actor/target resolve backwards from the contract) is never covered', () => {
  // Contract authorizes npc_to_player only; player-typed input claims player_to_npc via actor_id="player".
  const save = sexualCsaSave();
  save.last_choices[0] = '내가 먼저 만진다';
  save.last_choice_meta[0] = { choice_index: 0, action_types: ['genital_touch'], actor_id: 'player', target_id: 'heroine1', suggested_route: 'csa_direct', direct_csa_ids: ['csa_0'] };
  const coverage = resolveCsaDirectCoverage(save, '내가 먼저 만진다', { sexualActionContract });
  assert.equal(coverage.covered, false, 'the contract only authorizes npc_to_player, not the reverse direction');
});

// ---------- choice_structured_meta shape validation (Extract contract) ----------

test('normalizeGameplayExtractEnvelope keeps a valid choice_structured_meta entry and drops an out-of-range or duplicate one with a warning', () => {
  const npcIds = new Set(['heroine1']);
  const envelope = normalizeGameplayExtractEnvelope({
    state_delta: {}, outcome: 'success', evidence: {}, turn_summary: '', mind_monitor: {},
    choices: ['a', 'b', 'c', 'd'], dialogue_lines: [], npcs_present: ['heroine1'],
    action_target_id: null, focal_character_id: null, last_speaker_id: null, image_character_id: null,
    player_inner_thought: '', player_status: '', elapsed_minutes: 5,
    choice_structured_meta: [
      { choice_index: 0, action_types: ['genital_touch'], actor_id: 'heroine1', target_id: 'player', suggested_route: 'csa_direct', direct_csa_ids: ['csa_0'] },
      { choice_index: 9, action_types: ['kiss'], actor_id: 'heroine1', target_id: 'player', suggested_route: 'csa_direct', direct_csa_ids: [] }, // out of range (only 4 choices) -> dropped
      { choice_index: 0, action_types: ['kiss'], actor_id: 'heroine1', target_id: 'player', suggested_route: 'csa_direct', direct_csa_ids: [] } // duplicate index -> dropped
    ]
  }, { parsedStory: { choices: ['a', 'b', 'c', 'd'] }, npcIds });
  assert.equal(envelope.choice_structured_meta.length, 1);
  assert.equal(envelope.choice_structured_meta[0].choice_index, 0);
  assert.equal(envelope.choice_structured_meta[0].action_types[0], 'genital_touch');
  assert.ok(envelope.warnings.includes('invalid_choice_structured_meta'));
});

// ---------- Real end-to-end Extract system prompt size (closes a pre-existing test gap) ----------
//
// The pre-existing "Extract request size budget: system <=3000" test (company-heroines-v1.test.mjs)
// only ever calls buildExtractPrompt() directly — it never exercises the conditional CSA sections
// (buildMindEffectExtractFirewallSection/buildCsaApplicationCheckSection/
// buildCsaRuntimeExtractContractSection) that turn-routes.js's real extract() handler appends when a
// CSA is applicable. Measuring the actual /api/extract system prompt here shows the true CSA-active
// total was already ~3488 chars before this branch's own choice_structured_meta addition — i.e. the
// <=3000 claim was never true for the with-CSA path, just never end-to-end tested. This test
// documents the REAL current total with a real, honest cap instead of a number nobody ever verified.
test('Extract system prompt: the real CSA-active total (firewall+application-check+runtime-tracking+choice-structured-meta) stays under a real, verified cap', async () => {
  const presetItem = catalog.items.find(item => item.category === 'contact' && item.strength === 'medium');
  const save = freshSave({
    csa_active: ['csa_0'],
    csa_rules: {
      csa_0: {
        active: true, content: '테스트 상식개변 내용', strength: 'medium', source_type: 'preset',
        preset: { template_id: presetItem.id, actor_group: presetItem.default_actor, target_group: presetItem.default_target, trigger: presetItem.default_trigger, duration: presetItem.default_duration, required_action: presetItem.required_action, public_normalization: true, direct_meaning_tags: presetItem.direct_meaning_tags }
      }
    }
  });
  const mock = createMockFetch({ initialSave: save });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const actionId = '66666666-6666-4666-8666-666666666666';
  const storyRes = await worker.fetch(request('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 1, player_action: '평범하게 대화한다.' }), env);
  await storyRes.text();
  const extractRes = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: actionId }), env);
  assert.equal(extractRes.status, 200);
  const llmCall = mock.calls.filter(call => call.url.startsWith('https://llm.test')).at(-1);
  const system = JSON.parse(llmCall.body).messages[0].content;
  assert.ok(system.length <= 4000, `real CSA-active extract system chars: ${system.length}`);
});

test('normalizeGameplayExtractEnvelope drops an unknown action_type/suggested_route value instead of failing the whole entry', () => {
  const npcIds = new Set(['heroine1']);
  const envelope = normalizeGameplayExtractEnvelope({
    state_delta: {}, outcome: 'success', evidence: {}, turn_summary: '', mind_monitor: {},
    choices: ['a', 'b', 'c', 'd'], dialogue_lines: [], npcs_present: ['heroine1'],
    action_target_id: null, focal_character_id: null, last_speaker_id: null, image_character_id: null,
    player_inner_thought: '', player_status: '', elapsed_minutes: 5,
    choice_structured_meta: [
      { choice_index: 0, action_types: ['genital_touch', 'not_a_real_action'], actor_id: 'heroine1', target_id: 'player', suggested_route: 'made_up_route', direct_csa_ids: [] }
    ]
  }, { parsedStory: { choices: ['a', 'b', 'c', 'd'] }, npcIds });
  assert.equal(envelope.choice_structured_meta.length, 1);
  assert.deepEqual(envelope.choice_structured_meta[0].action_types, ['genital_touch']);
  assert.equal(envelope.choice_structured_meta[0].suggested_route, 'none');
});

// ---------- Commit 3: Extract JSON repair ----------
import { extractBalancedJsonObject, stripTrailingCommas, repairAndParseExtractJson } from '../src/engine/extract/json-repair.js';

test('json-repair: extracts a balanced {...} object even when the model wrapped it in stray prose', () => {
  const text = 'Sure, here is the JSON:\n{"a":1,"b":{"c":2}}\nHope that helps!';
  assert.equal(extractBalancedJsonObject(text), '{"a":1,"b":{"c":2}}');
});

test('json-repair: respects braces inside quoted strings when finding the balanced object', () => {
  const text = '{"note":"a { b } c","n":1}';
  assert.equal(extractBalancedJsonObject(text), text);
});

test('json-repair: strips a trailing comma before a closing brace or bracket, but not inside strings', () => {
  assert.equal(stripTrailingCommas('{"a":1,"b":[1,2,],}'), '{"a":1,"b":[1,2],}'.replace(',}', '}'));
  assert.equal(stripTrailingCommas('{"note":"a, b,"}'), '{"note":"a, b,"}');
});

test('json-repair: repairAndParseExtractJson recovers from stray-prose-wrapped JSON with a trailing comma', () => {
  const text = 'Here you go:\n{"outcome":"success","state_delta":{},}\nDone.';
  const parsed = repairAndParseExtractJson(text);
  assert.equal(parsed.outcome, 'success');
});

test('json-repair: repairAndParseExtractJson still throws when nothing is recoverable (unbalanced braces)', () => {
  assert.throws(() => repairAndParseExtractJson('{"outcome":"success"'));
});

test('json-repair: valid JSON passes through unchanged on the first attempt (repair never mutates already-valid content)', () => {
  const parsed = repairAndParseExtractJson('{"outcome":"success","state_delta":{}}');
  assert.deepEqual(parsed, { outcome: 'success', state_delta: {} });
});

// ---------- Commit 4: /api/find-npc route ----------

test('/api/find-npc: zero-LLM, zero-turn lookup succeeds for a general NPC with a known location', async () => {
  const save = freshSave({ npc_scene_state: { general_park_jungwoo: { location_label: '대회의실', location_id: 'large_meeting_room' } } });
  const mock = createMockFetch({ initialSave: save });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const res = await worker.fetch(request('/api/find-npc', { game_id: gameId, character_id: 'general_park_jungwoo' }), env);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.location_id, 'large_meeting_room');
  assert.equal(body.data.name, '박정우');
  assert.equal(mock.calls.some(call => call.url.startsWith('https://llm.test')), false, 'find_npc must never call the LLM');
});

test('/api/find-npc: rejects an id that is neither a heroine nor a general NPC', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const res = await worker.fetch(request('/api/find-npc', { game_id: gameId, character_id: 'not_a_real_person' }), env);
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.error.code, 'npc_not_found');
});

test('/api/find-npc: rejects with NPC_LOCATION_UNKNOWN when nothing has ever been recorded', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const res = await worker.fetch(request('/api/find-npc', { game_id: gameId, character_id: 'general_oh_sehoon' }), env);
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.error.code, 'npc_location_unknown');
});

// ---------- Commit 5: /api/history ----------

function turnFixture(n, overrides = {}) {
  return {
    turn_number: n, player_action: `행동 ${n}`, feedback_text: null, story_text: `[1. 서사 및 행동]\n본문 ${n}`,
    parsed_blocks: { player_inner_thought: `속마음 ${n}`, player_status: '', choices: ['a', 'b', 'c', 'd'], dialogue_lines: [], warnings: [] },
    turn_summary: `요약 ${n}`, mind_monitor: {}, choices: ['a', 'b', 'c', 'd'], committed_at: `2026-01-0${Math.min(n, 9)}T00:00:00Z`,
    ...overrides
  };
}

test('/api/history: returns committed-turn-only records with narrative_text/turn_summary kept separate, zero LLM calls', async () => {
  const turnsFixture = [turnFixture(1), turnFixture(2), turnFixture(3)];
  const mock = createMockFetch({ turnsFixture });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const res = await worker.fetch(request('/api/history', { game_id: gameId, limit: 20 }), env);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.records.length, 3);
  assert.equal(body.data.records[0].turn_number, 3, 'newest turn first');
  assert.equal(body.data.records[0].turn_summary, '요약 3');
  assert.equal(body.data.records[0].story_text, '[1. 서사 및 행동]\n본문 3');
  assert.notEqual(body.data.records[0].turn_summary, body.data.records[0].story_text, 'summary and raw story stay distinct fields');
  assert.equal(body.data.records[0].player_inner_thought, '속마음 3');
  assert.equal(body.data.has_more, false);
  assert.equal(mock.calls.some(call => call.url.startsWith('https://llm.test')), false, '/api/history must never call the LLM');
});

test('/api/history: pagination via before_turn returns next_before_turn and has_more correctly', async () => {
  const turnsFixture = Array.from({ length: 5 }, (_, i) => turnFixture(i + 1));
  const mock = createMockFetch({ turnsFixture });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const first = await (await worker.fetch(request('/api/history', { game_id: gameId, limit: 2 }), env)).json();
  assert.deepEqual(first.data.records.map(r => r.turn_number), [5, 4]);
  assert.equal(first.data.has_more, true);
  assert.equal(first.data.next_before_turn, 4);
  const second = await (await worker.fetch(request('/api/history', { game_id: gameId, limit: 2, before_turn: first.data.next_before_turn }), env)).json();
  assert.deepEqual(second.data.records.map(r => r.turn_number), [3, 2]);
  assert.equal(second.data.has_more, true);
});

test('/api/history: limit is clamped to a maximum of 50 and defaults to 20', async () => {
  const turnsFixture = Array.from({ length: 60 }, (_, i) => turnFixture(i + 1));
  const mock = createMockFetch({ turnsFixture });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const overLimit = await (await worker.fetch(request('/api/history', { game_id: gameId, limit: 200 }), env)).json();
  assert.equal(overLimit.data.records.length, 50);
  const defaultLimit = await (await worker.fetch(request('/api/history', { game_id: gameId }), env)).json();
  assert.equal(defaultLimit.data.records.length, 20);
});

// ---------- Commit 5: numbered choice input resolution ----------
import { resolveNumberedChoiceInput } from '../src/engine/index.js';

function saveWithChoices(choices, meta = []) {
  return { last_choices: choices, last_choice_meta: meta };
}

test('choice input: digits, letters (upper/lower), and circled numerals all resolve to the same stored choice text', () => {
  const save = saveWithChoices(['첫째', '둘째', '셋째', '넷째']);
  for (const input of ['2', 'b', 'B', '②']) {
    const result = resolveNumberedChoiceInput(input, save);
    assert.equal(result.ok, true, `input "${input}" should resolve`);
    assert.equal(result.choice_index, 1);
    assert.equal(result.text, '둘째');
  }
});

test('choice input: resolving restores the stored structured_meta for that index', () => {
  const meta = [{ choice_index: 2, action_types: ['kiss'], actor_id: 'heroine1', target_id: 'player', suggested_route: 'csa_direct', direct_csa_ids: ['csa_0'] }];
  const save = saveWithChoices(['첫째', '둘째', '셋째', '넷째'], meta);
  const result = resolveNumberedChoiceInput('3', save);
  assert.equal(result.ok, true);
  assert.deepEqual(result.structured_meta, meta[0]);
});

test('choice input: plain free-typed text (not a numbered form) resolves to null, falling through to ordinary text handling', () => {
  const save = saveWithChoices(['첫째', '둘째', '셋째', '넷째']);
  assert.equal(resolveNumberedChoiceInput('오늘 날씨가 좋다', save), null);
  assert.equal(resolveNumberedChoiceInput('5', save), null, 'out of the 1-4 digit range is not a recognized numbered form at all');
});

test('choice input: a numbered form is never silently executed as free text when there is no current choice set (explicit error, not fallback)', () => {
  const save = saveWithChoices([]);
  const result = resolveNumberedChoiceInput('2', save);
  assert.deepEqual(result, { ok: false, code: 'CHOICE_INDEX_OUT_OF_RANGE' });
});

test('choice input: an in-range letter but with fewer than 4 currently-rendered choices is rejected, not guessed', () => {
  const save = saveWithChoices(['첫째', '둘째']);
  const result = resolveNumberedChoiceInput('c', save);
  assert.deepEqual(result, { ok: false, code: 'CHOICE_INDEX_OUT_OF_RANGE' });
});

// ---------- Commit 5: feedback/restore ----------

test('/api/feedback -> normal Story/Extract/Commit pipeline regenerates the last turn via commit_feedback_revision, never advancing committed_turn', async () => {
  const save = freshSave({ turn_state: { committed_turn: 3 } });
  const mock = createMockFetch({ initialSave: save });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });

  const feedbackRes = await worker.fetch(request('/api/feedback', { game_id: gameId, revision_request_id: 'rev-1', feedback_text: '더 자세하게 써줘' }), env);
  assert.equal(feedbackRes.status, 200);
  const feedbackBody = (await feedbackRes.json()).data;
  assert.equal(feedbackBody.expected_turn, 3, 'targets the currently-committed turn, not turn+1');

  const storyRes = await worker.fetch(request('/api/story', { game_id: gameId, action_id: feedbackBody.action_id, expected_turn: feedbackBody.expected_turn, player_action: feedbackBody.original_player_action }), env);
  assert.equal(storyRes.status, 200);
  const storyText = await storyRes.text();
  assert.match(storyText, /event: complete/);
  const storyCall = mock.calls.filter(c => c.url.startsWith('https://llm.test')).at(-1);
  const systemPrompt = JSON.parse(storyCall.body).messages[0].content;
  assert.match(systemPrompt, /재생성 최우선 지시/, 'the feedback text must be injected into the Story system prompt as highest priority');
  assert.match(systemPrompt, /더 자세하게 써줘/);

  const extractRes = await worker.fetch(request('/api/extract', { game_id: gameId, action_id: feedbackBody.action_id }), env);
  assert.equal(extractRes.status, 200);

  const commitRes = await worker.fetch(request('/api/commit', { game_id: gameId, action_id: feedbackBody.action_id, expected_turn: feedbackBody.expected_turn }), env);
  assert.equal(commitRes.status, 200);
  assert.equal(mock.getSave().turn_state.committed_turn, 3, 'a feedback revision replaces the targeted turn, it never advances committed_turn');
  assert.equal(mock.calls.some(c => c.url.includes('commit_feedback_revision')), true);
  assert.equal(mock.calls.some(c => c.url.includes('commit_company_turn')), false, 'must never call the normal turn-advancing commit RPC for a feedback revision');
});

test('/api/feedback: the same revision_request_id replayed is idempotent (returns the same pending action, never reserves twice)', async () => {
  const save = freshSave({ turn_state: { committed_turn: 5 } });
  const mock = createMockFetch({ initialSave: save });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const first = await (await worker.fetch(request('/api/feedback', { game_id: gameId, revision_request_id: 'rev-idempotent', feedback_text: '피드백' }), env)).json();
  const second = await (await worker.fetch(request('/api/feedback', { game_id: gameId, revision_request_id: 'rev-idempotent', feedback_text: '피드백' }), env)).json();
  assert.equal(first.data.action_id, second.data.action_id);
});

test('/api/feedback: game_save is completely untouched until commit_feedback_revision actually runs — nothing destructive happens upfront', async () => {
  const save = freshSave({ turn_state: { committed_turn: 5 } });
  const mock = createMockFetch({ initialSave: save });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  await worker.fetch(request('/api/feedback', { game_id: gameId, revision_request_id: 'rev-untouched', feedback_text: '피드백' }), env);
  assert.deepEqual(mock.getSave(), save, 'reserving a feedback revision must never mutate game_save by itself');
});
