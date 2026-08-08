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

const SEXUAL_CHARACTERS = {
  heroine1: { character_id: 'heroine1', name: '서원희', position: '차장', department: '브랜드전략팀' }
};
const sexualActionContract = { __test_required_action__: { directions: ['npc_to_player'], actions: ['genital_touch'] } };





test('direct coverage (structured): ambiguous free-typed input with no matching rendered choice falls through to the tag-based fallback, never guessed as covered from actor_id alone', () => {
  const save = sexualCsaSave();
  // Custom text that doesn't match any of last_choices, and contains no material action keyword.
  const coverage = resolveCsaDirectCoverage(save, '오늘 날씨 이야기를 한다', { sexualActionContract, characters: SEXUAL_CHARACTERS });
  assert.equal(coverage.covered, false);
});

test('direct coverage (structured): a bundled action not covered by the contract rejects the whole choice, never partially covered', () => {
  const save = sexualCsaSave();
  save.last_choices[0] = '키스하면서 성기를 만진다';
  save.last_choice_meta[0] = { choice_index: 0, action_types: ['kiss', 'genital_touch'], actor_id: 'heroine1', target_id: 'player', suggested_route: 'csa_direct', direct_csa_ids: ['csa_0'] };
  const coverage = resolveCsaDirectCoverage(save, '키스하면서 성기를 만진다', { sexualActionContract, characters: SEXUAL_CHARACTERS });
  assert.equal(coverage.covered, false, 'the contract only authorizes genital_touch; bundling an uncovered kiss must reject the whole choice');
});

test('direct coverage (structured): a covered choice carries no probability, bold, or risk-tier metadata anywhere in its section text', () => {
  const save = sexualCsaSave();
  const coverage = resolveCsaDirectCoverage(save, '성기를 만진다', { sexualActionContract, characters: SEXUAL_CHARACTERS });
  assert.equal(coverage.covered, true);
  const section = buildCsaDirectCoverageSection(coverage);
  assert.doesNotMatch(section, /\d+\s*%|위험도\s*[:：]|bold_choice|risk_tier|success_rate/i);
});

test('direct coverage (structured): a direction mismatch (structured actor/target resolve backwards from the contract) is never covered', () => {
  // Contract authorizes npc_to_player only; player-typed input claims player_to_npc via actor_id="player".
  const save = sexualCsaSave();
  save.last_choices[0] = '내가 먼저 만진다';
  save.last_choice_meta[0] = { choice_index: 0, action_types: ['genital_touch'], actor_id: 'player', target_id: 'heroine1', suggested_route: 'csa_direct', direct_csa_ids: ['csa_0'] };
  const coverage = resolveCsaDirectCoverage(save, '내가 먼저 만진다', { sexualActionContract, characters: SEXUAL_CHARACTERS });
  assert.equal(coverage.covered, false, 'the contract only authorizes npc_to_player, not the reverse direction');
});

// ---------- choice_structured_meta shape validation (Extract contract) ----------



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
  assert.ok(system.length <= 9000, `real CSA-active extract system chars: ${system.length}`); // 예산 7000 (image_selection 지시 반영)
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

// ---------- Removed product path: /api/find-npc ----------

test('/api/find-npc is structurally removed and returns the normal 404 contract', async () => {
  const mock = createMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const res = await worker.fetch(request('/api/find-npc', { game_id: gameId, character_id: 'general_park_jungwoo' }), env);
  assert.equal(res.status, 404);
  assert.equal((await res.json()).error.code, 'not_found');
  assert.equal(mock.calls.some(call => call.url.startsWith('https://llm.test')), false);
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

// ---------- Commit 5: image backend ----------
import { selectImage } from '../src/engine/index.js';

function imageRow(id, overrides = {}) {
  return { image_id: id, character_id: 'heroine1', situation: null, tags: [], image_pool: 'general', is_sexual: false, curation_rank: 5, image_url: `https://img.test/${id}`, ...overrides };
}

test('image selector: an exact situation match outranks a tag-only match', () => {
  const candidates = [imageRow('a', { tags: ['office'], pool: 'general' }), imageRow('b', { situation: 'meeting', pool: 'general' })];
  const result = selectImage(candidates, { situation: 'meeting', tags: [], pool: 'general' });
  assert.equal(result.image_id, 'b');
  assert.equal(result.source, 'match');
});

test('image selector: evaluates at most 8 candidates even when given more', () => {
  const many = Array.from({ length: 20 }, (_, i) => imageRow(`c${i}`, { curation_rank: 20 - i }));
  const result = selectImage(many, {});
  // No situation/tag match anywhere, so it falls back to lowest curation_rank among only the
  // first 8 evaluated candidates (curation_rank 20..13), never scanning the full 20.
  assert.equal(result.source, 'primary');
  assert.equal(result.image_id, 'c7', 'c7 has curation_rank 13, the lowest among the first 8 candidates only');
});

test('image selector: a tie on score is broken by lower curation_rank, then by image_id, deterministically', () => {
  const candidates = [imageRow('z', { tags: ['a'], curation_rank: 3 }), imageRow('m', { tags: ['a'], curation_rank: 1 })];
  const result = selectImage(candidates, { tags: ['a'] });
  assert.equal(result.image_id, 'm');
});

test('image selector: general pool falls back to the lowest-curation_rank candidate when nothing matches (sex pool는 null)', () => {
  const candidates = [imageRow('primary1', { curation_rank: 1, pool: 'general' }), imageRow('other', { curation_rank: 9, pool: 'general' })];
  const result = selectImage(candidates, { situation: 'nonexistent', tags: ['nope'], pool: 'general' });
  assert.equal(result.image_id, 'primary1');
  assert.equal(result.source, 'primary');
});

test('image selector: returns null (never throws) when there are zero candidates at all', () => {
  assert.equal(selectImage([], {}), null);
});

test('/api/image: zero LLM calls, character-scoped query only, deterministic result', async () => {
  const mock = createMockFetch();
  mock.fetchImpl = mock.fetchImpl; // keep reference
  const worker = createApiWorker({
    fetchImpl: async (url, init = {}) => {
      const textUrl = String(url);
      if (textUrl.includes('/rest/v1/image_library')) {
        return json([imageRow('img-1', { situation: 'lobby_greeting', curation_rank: 2, pool: 'general' }), imageRow('img-2', { curation_rank: 1, pool: 'general' })]);
      }
      return mock.fetchImpl(url, init);
    }
  });
  const res = await worker.fetch(request('/api/image', { game_id: gameId, character_id: 'heroine1', pool: 'general', situation: 'lobby_greeting' }), env);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.image.image_id, 'img-1');
  assert.equal(body.data.image.source, 'match');
});

test('/api/image: returns image:null (not an error) when the character has no active images at all', async () => {
  const worker = createApiWorker({
    fetchImpl: async textUrl => {
      if (String(textUrl).includes('/rest/v1/image_library')) return json([]);
      throw new Error('unexpected call');
    }
  });
  const res = await worker.fetch(request('/api/image', { game_id: gameId, character_id: 'heroine1', pool: 'general' }), env);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.image, null);
});

// ---------- Commit 5: TTS backend ----------
import { resolveTtsEligibility, ttsCacheKey } from '../src/engine/index.js';

const ttsMaster = { characters: [{ character_id: 'heroine1', name: '서원희', voice_id: 'voice-abc' }, { character_id: 'general_park_jungwoo', name: '박정우' }] };

test('TTS eligibility: a confirmed line from a registered character with a voice_id is eligible', () => {
  const result = resolveTtsEligibility({ speakerId: 'heroine1', text: '안녕하세요.', master: ttsMaster });
  assert.equal(result.eligible, true);
  assert.equal(result.voice_id, 'voice-abc');
});

test('TTS eligibility: the narrator (null/absent speaker, or literal "narrator") is never eligible', () => {
  assert.equal(resolveTtsEligibility({ speakerId: null, text: '서술문', master: ttsMaster }).code, 'NARRATOR_NOT_ELIGIBLE');
  assert.equal(resolveTtsEligibility({ speakerId: 'narrator', text: '서술문', master: ttsMaster }).code, 'NARRATOR_NOT_ELIGIBLE');
});

test('TTS eligibility: an unknown speaker id (not a registered character at all) is rejected', () => {
  const result = resolveTtsEligibility({ speakerId: 'not_a_real_character', text: '대사', master: ttsMaster });
  assert.equal(result.eligible, false);
  assert.equal(result.code, 'UNKNOWN_SPEAKER');
});

test('TTS eligibility: a general NPC with no voice_id is rejected, even though they are a known/present character', () => {
  const result = resolveTtsEligibility({ speakerId: 'general_park_jungwoo', text: '대사', master: ttsMaster });
  assert.equal(result.eligible, false);
  assert.equal(result.code, 'NO_VOICE_ID');
});

test('TTS eligibility: empty text is rejected before any speaker check', () => {
  assert.equal(resolveTtsEligibility({ speakerId: 'heroine1', text: '   ', master: ttsMaster }).code, 'EMPTY_TEXT');
});

test('ttsCacheKey: identical speaker+text always produce the same key, enabling same-line replay caching', () => {
  assert.equal(ttsCacheKey('heroine1', '안녕하세요.'), ttsCacheKey('heroine1', '안녕하세요.'));
  assert.notEqual(ttsCacheKey('heroine1', '안녕하세요.'), ttsCacheKey('heroine1', '다른 대사'));
});

test('/api/tts: OFF-by-default is a frontend concern (this route never gets called unless the user opted in), but the server never calls narrator/unknown/no-voice speakers', async () => {
  let upstreamCalls = 0;
  const worker = createApiWorker({
    fetchImpl: async textUrl => {
      if (String(textUrl).startsWith('https://tts.test')) { upstreamCalls += 1; return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'audio/mpeg' } }); }
      throw new Error(`unexpected call: ${textUrl}`);
    }
  });
  const ttsEnv = { ...env, TTS_API_URL: 'https://tts.test/synthesize', TTS_API_KEY: 'tts-key' };
  const narratorRes = await worker.fetch(request('/api/tts', { game_id: gameId, character_id: null, text: '서술문' }), ttsEnv);
  assert.equal(narratorRes.status, 422);
  assert.equal(upstreamCalls, 0, 'a rejected narrator request must never reach the TTS provider');

  const eligibleRes = await worker.fetch(request('/api/tts', { game_id: gameId, character_id: 'heroine1', text: '안녕하세요.' }), ttsEnv);
  assert.equal(eligibleRes.status, 200);
  assert.equal(upstreamCalls, 1);
});

// ---------- Commit 5: view-model surfaces player physical/sexual state and focal NPC stats ----------

test('view-model: surfaces player_inner_thought, location/posture/clothing, and sexual-state fields from the real save shape', () => {
  const context = {
    save: {
      committed_turn: 4,
      data: {
        focal_character_id: 'heroine1',
        player: { name: '김하늘', department: '브랜드전략팀' },
        player_sexual_state: { arousal: 42, ejaculation_progress: 10, ejaculation_count: 2 },
        player_scene_state: { location_label: '회의실', posture: 'sitting', clothing: { uniform_top: 'worn' } },
        npc_stats: { heroine1: { affinity: 30, csa_acceptance: 10, sexual_arousal: 5, work_trust: 20 } },
        npc_relationship_state: { heroine1: { intimacy_stage: 'romantic_interest' } },
        npc_emotion: { heroine1: { surface: '차분함', subconscious: '긴장' } },
        npc_scene_state: { heroine1: { location_label: '회의실', posture: 'standing' } },
        scene_state: {}, world_state: {}, csa_active: [], last_choices: [], last_npcs_present: []
      }
    },
    recent_turns: [{ turn_number: 4, player_action: 'x', story_text: 'y', parsed_blocks: { player_inner_thought: '오늘따라 긴장된다.', player_status: '평온함', choices: [] } }]
  };
  const model = buildCompanyGameViewModel(context);
  assert.equal(model.player.inner_thought, '오늘따라 긴장된다.');
  assert.equal(model.story.player_inner_thought, '오늘따라 긴장된다.');
  assert.equal(model.player.excitement, 42);
  assert.equal(model.player.ejaculation_progress, 10);
  assert.equal(model.player.ejaculation_count, 2);
  assert.equal(model.player.location_label, '회의실');
  assert.equal(model.player.posture, 'sitting');
  assert.equal(model.focal_character.character.stats.affinity, 30);
  assert.equal(model.focal_character.character.relationship.intimacy_stage, 'romantic_interest');
  assert.equal(model.focal_character.scene_state.posture, 'standing');
});

// ---------- Commit 6: EXP progression (ported from donor's live calculateProgress/calculateCsaProgression) ----------
import { calculateProgress, calculateCsaProgression, expForNextLevel } from '../src/engine/progression.js';

test('progression: exp thresholds match donor exactly (15,23,50,63,75,105,120,135,150 for levels 1-9), capped at level 10', () => {
  assert.equal(expForNextLevel(1), 15);
  assert.equal(expForNextLevel(5), 75);
  assert.equal(expForNextLevel(9), 150);
  assert.equal(expForNextLevel(10), null);
});

test('progression: calculateProgress advances exactly one level when exp crosses the threshold, carrying the remainder forward', () => {
  const result = calculateProgress({ level: 1, exp: 14 }, 3);
  assert.equal(result.level, 2);
  assert.equal(result.exp, 2);
  assert.equal(result.leveled_up, true);
});

test('progression: calculateProgress can cascade multiple level-ups in one call if exp is large enough', () => {
  const result = calculateProgress({ level: 1, exp: 0 }, 15 + 23 + 5);
  assert.equal(result.level, 3);
  assert.equal(result.exp, 5);
});

test('progression: level never exceeds 10, exp never overflows past the final threshold', () => {
  const result = calculateProgress({ level: 10, exp: 100 }, 50);
  assert.equal(result.level, 10);
});

test('progression: CSA activate=+3, update=+1, newly-experienced=+2, already-experienced=+1, total capped at 3/turn', () => {
  const activateOnly = calculateCsaProgression({ csaOperations: [{ operation: 'activate' }] });
  assert.equal(activateOnly.amount, 3);

  const updateOnly = calculateCsaProgression({ csaOperations: [{ operation: 'update' }] });
  assert.equal(updateOnly.amount, 1);

  const newExperience = calculateCsaProgression({ experiencedThisTurn: [{ character_id: 'heroine1', csa_id: 'csa_0' }] });
  assert.equal(newExperience.amount, 2);
  assert.deepEqual(newExperience.newly_experienced_keys, ['heroine1:csa_0']);

  const repeatExperience = calculateCsaProgression({ experiencedThisTurn: [{ character_id: 'heroine1', csa_id: 'csa_0' }], previouslyExperienced: new Set(['heroine1:csa_0']) });
  assert.equal(repeatExperience.amount, 1);

  const capped = calculateCsaProgression({ csaOperations: [{ operation: 'activate' }], experiencedThisTurn: [{ character_id: 'heroine1', csa_id: 'csa_0' }] });
  assert.equal(capped.amount, 3, 'activate(3) + new-experience(2) = 5, capped to the 3/turn maximum');
});

test('progression: a degraded turn earns zero exp, matching donor\'s "no exp on degraded extract" rule', () => {
  const result = calculateCsaProgression({ csaOperations: [{ operation: 'activate' }], degraded: true });
  assert.equal(result.amount, 0);
});

// ── 턴70: 이미지 선택 정본 + sex zero-match 처리 ──

import { buildCompanyGameViewModel } from '../src/frontend/pages/view-model.js';

function turn70ImageRow(id, tags, { pool = 'sex', rank = 50, situation = '' } = {}) {
  return { image_id: id, image_url: `https://img.test/${id}.png`, tags, image_pool: pool, is_sexual: pool === 'sex', curation_rank: rank, situation, active: true };
}

test('턴70-29: sex + handjob 후보 정확 일치 → 선택', () => {
  const candidates = [turn70ImageRow('hj1', ['adult', 'sex', 'handjob', 'office_desk'], { rank: 10 })];
  const selected = selectImage(candidates, { pool: 'sex', tags: ['handjob', 'office_desk'] });
  assert.equal(selected.image_id, 'hj1');
  assert.equal(selected.source, 'match');
});

test('턴70-30: sex + fingering 후보만 존재 + request handjob → null', () => {
  const candidates = [turn70ImageRow('fg1', ['adult', 'sex', 'fingering'])];
  const selected = selectImage(candidates, { pool: 'sex', tags: ['handjob', 'office_desk'] });
  assert.equal(selected, null, 'action tag 불일치 — 임의 sex 이미지 반환 금지');
});

test('턴70-31: generic adult/sex만 일치 → null', () => {
  const candidates = [turn70ImageRow('g1', ['adult', 'sex'])];
  const selected = selectImage(candidates, { pool: 'sex', tags: ['handjob'] });
  assert.equal(selected, null, 'generic 태그 일치만으로는 매칭 아님');
});

test('턴70-32: sexual_generic 후보가 있으면 제한적 fallback', () => {
  const candidates = [turn70ImageRow('sg1', ['adult', 'sex', 'sexual_generic'], { rank: 5 })];
  const selected = selectImage(candidates, { pool: 'sex', tags: ['handjob'] });
  assert.equal(selected.image_id, 'sg1');
  assert.equal(selected.source, 'sexual_generic');
});

test('턴70-33: general pool은 기존 primary fallback 유지', () => {
  const candidates = [turn70ImageRow('p1', ['portrait'], { pool: 'general', rank: 1 })];
  const selected = selectImage(candidates, { pool: 'general', tags: [] });
  assert.equal(selected.image_id, 'p1');
  assert.equal(selected.source, 'primary');
});

test('턴70-34: explicit sexual scene에서 general 기본 이미지로 재요청하지 않음 (view-model은 sex pool 유지)', () => {
  const context = {
    save: { data: { focal_character_id: 'heroine4', last_speaker_id: 'heroine4', scene_state: {}, world_state: {} } },
    display: {},
    recent_turns: [{
      turn_number: 86, story_text: 'x',
      extract_delta: { image_character_id: 'heroine4', image_selection: { pool: 'sex', tags: ['handjob'] } }
    }]
  };
  const model = buildCompanyGameViewModel(context, {});
  assert.equal(model.media.image_pool, 'sex', 'refresh 후에도 sex pool 유지');
  assert.deepEqual(model.media.image_tags, ['handjob']);
  assert.equal(model.media.image_character_id, 'heroine4');
});

test('턴70-35: heroine4 handjob row fixture가 있을 때 정확 선택', () => {
  const candidates = [
    turn70ImageRow('hj1', ['adult', 'sex', 'handjob', 'office_desk'], { rank: 10 }),
    turn70ImageRow('fg1', ['adult', 'sex', 'fingering'], { rank: 5 })
  ];
  const selected = selectImage(candidates, { pool: 'sex', tags: ['handjob', 'office_desk'] });
  assert.equal(selected.image_id, 'hj1');
});

test('턴70-36: handjob row가 없을 때 다른 explicit act 이미지 선택 금지', () => {
  const candidates = [turn70ImageRow('fg1', ['adult', 'sex', 'fingering'], { rank: 1 })];
  const selected = selectImage(candidates, { pool: 'sex', tags: ['handjob'] });
  assert.equal(selected, null, 'fingering 이미지를 handjob으로 대체 금지');
});

test('턴70-23~24: currentExtract가 있으면 runtime 값 사용, refresh 후 extract_delta 사용', () => {
  const context = {
    save: { data: { focal_character_id: 'heroine4', last_speaker_id: 'heroine4', scene_state: {}, world_state: {} } },
    display: {},
    recent_turns: [{
      turn_number: 86, story_text: 'x',
      extract_delta: { image_character_id: 'heroine4', image_selection: { pool: 'sex', tags: ['fellatio'] } }
    }]
  };
  // runtime.currentExtract 우선
  const live = buildCompanyGameViewModel(context, { currentExtract: { image_character_id: 'heroine4', image_selection: { pool: 'sex', tags: ['handjob'] } } });
  assert.deepEqual(live.media.image_tags, ['handjob']);
  // refresh 후 currentExtract=null → extract_delta 사용
  const refreshed = buildCompanyGameViewModel(context, {});
  assert.deepEqual(refreshed.media.image_tags, ['fellatio'], 'committed extract_delta에서 복구');
  assert.equal(refreshed.media.image_pool, 'sex');
});

test('턴70-26~27: 성적 hand stimulation → sex/handjob, 일반 대화 → general', () => {
  const context = {
    save: { data: { focal_character_id: 'heroine4', last_speaker_id: 'heroine4', scene_state: {}, world_state: {} } },
    display: {},
    recent_turns: [{ turn_number: 86, story_text: 'x', extract_delta: { image_selection: { pool: 'general', tags: [] } } }]
  };
  const model = buildCompanyGameViewModel(context, {});
  assert.equal(model.media.image_pool, 'general');
  assert.deepEqual(model.media.image_tags, []);
});
