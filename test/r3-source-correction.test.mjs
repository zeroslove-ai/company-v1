import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { loadWorkerCanonicalContent } from '../runtime-r3/domain/worker-content.js';
import { buildStoryContext } from '../runtime-r3/domain/memory.js';
import { buildOpeningContext } from '../runtime-r3/domain/story.js';
import { createInitialState } from '../runtime-r3/domain/contracts.js';
import { SupabaseR3Store } from '../runtime-r3/server/supabase-store.js';
import { InMemoryR3Store } from '../runtime-r3/server/store.js';
import { createR3Provider } from '../runtime-r3/server/provider.js';
import { normalizeObserver } from '../runtime-r3/domain/observer-normalizer.js';

const content = loadCanonicalCompanyR3Content();

function storyWithChoices(choices, { body = 'Current Story' } = {}) {
  return `${body}\n1. ${choices[0]}\n2. ${choices[1]}\n3. ${choices[2]}\n4. ${choices[3]}`;
}

test('R3 choice projection binds only the terminal Story tail and preserves exact Story literals', () => {
  const exact = ['inspect the desk', 'ask "hello"', 'write a note', 'leave the room'];
  const story = storyWithChoices(exact, { body: 'Earlier list\n1. stale one\n2. stale two\n3. stale three\n4. stale four\n\nCurrent Story' });
  assert.deepEqual(normalizeObserver({ choices: exact }, { storyText: story, content }).choices, exact);
  assert.deepEqual(normalizeObserver({ choices: exact }, { storyText: storyWithChoices(exact.map(choice => choice.replace('"', '\\"'))), content }).choices, exact.map(choice => choice.replace('"', '\\"')));
  assert.deepEqual(normalizeObserver({ choices: exact.map(choice => choice.replace('"', '\\"')) }, { storyText: story, content }).choices, exact);
  assert.deepEqual(normalizeObserver({ choices: ['inspect  the desk', ...exact.slice(1)] }, { storyText: story, content }).choices, exact);
  assert.deepEqual(normalizeObserver({ choices: ['inspect the desk!', ...exact.slice(1)] }, { storyText: story, content }).choices, exact);
  assert.deepEqual(normalizeObserver({ choices: ['inspect the desk', 'ask “hello”', ...exact.slice(2)] }, { storyText: story, content }).choices, exact);
  assert.deepEqual(normalizeObserver({ choices: ['inspect the desk', 'say goodbye', ...exact.slice(2)] }, { storyText: story, content }).choices, exact);
  assert.deepEqual(normalizeObserver({ choices: exact.slice(0, 3) }, { storyText: story, content }).choices, exact);
  assert.deepEqual(normalizeObserver({ choices: [...exact, 'extra'] }, { storyText: story, content }).choices, exact);
  assert.deepEqual(normalizeObserver({ choices: [exact[0], exact[0], exact[2], exact[3]] }, { storyText: story, content }).choices, exact);
  assert.deepEqual(normalizeObserver({ choices: [exact[1], exact[0], exact[2], exact[3]] }, { storyText: story, content }).choices, exact);
  assert.deepEqual(normalizeObserver({ choices: exact }, { storyText: 'Narrative only', content }).choices, null);
});

test('R3 Observer choice mismatches are diagnostic-only when Story authored the tail', () => {
  const storyChoices = ['one', 'two', 'three', 'four'];
  const story = storyWithChoices(storyChoices);
  for (const observerChoices of [
    storyChoices.map((choice, index) => `${index + 1}. ${choice}`),
    ['unrelated one', 'unrelated two', 'unrelated three', 'unrelated four'],
    [],
    [storyChoices[1], storyChoices[0], storyChoices[2], storyChoices[3]],
    [storyChoices[0], storyChoices[0], storyChoices[2], storyChoices[3]],
  ]) {
    const normalized = normalizeObserver({ choices: observerChoices }, { storyText: story, content });
    assert.deepEqual(normalized.choices, storyChoices);
    assert.ok(normalized.warnings.includes('choices_observer_mismatch'));
    assert.equal(normalized.warnings.includes('choices_projection_dropped'), false);
  }
  const missing = normalizeObserver({}, { storyText: story, content });
  assert.deepEqual(missing.choices, storyChoices);
  assert.ok(missing.warnings.includes('choices_observer_mismatch'));
});

test('R3 choice tail accepts the existing 1) form without using earlier numbered prose', () => {
  const choices = ['one', 'two', 'three', 'four'];
  const story = `Body\n1. earlier\n2. list\n\nNow\n1) ${choices[0]}\n2) ${choices[1]}\n3) ${choices[2]}\n4) ${choices[3]}\n`;
  assert.deepEqual(normalizeObserver({ choices }, { storyText: story, content }).choices, choices);
});

test('R3 mind monitor accepts pre-turn actors and grounded same-turn entrants only', () => {
  const [currentActor, entrant, offsceneActor] = Object.values(content.characters);
  const locationId = currentActor.default_location_id;
  const state = createInitialState({ name: 'Player' }, locationId, [currentActor.character_id]);
  const story = `${entrant.name} enters the meeting room. ${currentActor.name} watches the doorway.`;
  const normalized = normalizeObserver({
    entered: [{ actor_id: entrant.character_id, quote: `${entrant.name} enters the meeting room.` }],
    present_actor_ids: [entrant.character_id],
    mind_monitor: {
      [currentActor.character_id]: { surface: 'current surface', subconscious: 'current subconscious' },
      [entrant.character_id]: { surface: 'entrant surface', subconscious: 'entrant subconscious' },
      [offsceneActor.character_id]: { surface: 'offscene surface', subconscious: 'offscene subconscious' },
      [entrant.name]: { surface: 'name keyed', subconscious: 'must drop' }
    }
  }, { storyText: story, content, currentState: state });
  assert.deepEqual(normalized.entered, [{ actor_id: entrant.character_id, quote: `${entrant.name} enters the meeting room.` }]);
  assert.deepEqual(Object.keys(normalized.mind_monitor).sort(), [currentActor.character_id, entrant.character_id].sort());
  assert.equal(normalized.mind_monitor[entrant.character_id].surface, 'entrant surface');
  assert.equal(normalized.mind_monitor[offsceneActor.character_id], undefined);
  assert.ok(normalized.warnings.filter(warning => warning === 'mind_monitor_projection_dropped').length >= 2);
});

test('R3 mind monitor does not infer actor transitions from player movement or Observer present IDs', () => {
  const [currentActor, entrant, unrelatedActor] = Object.values(content.characters);
  const state = createInitialState({ name: 'Player' }, currentActor.default_location_id, [currentActor.character_id]);
  const story = 'Player moves to the lobby while the meeting continues.';
  const normalized = normalizeObserver({
    entered: [{ actor_id: entrant.character_id, quote: 'Player moves to the lobby.' }],
    present_actor_ids: [unrelatedActor.character_id],
    mind_monitor: {
      [entrant.character_id]: { surface: 'not grounded', subconscious: 'not grounded' },
      [unrelatedActor.character_id]: { surface: 'present-only', subconscious: 'present-only' },
      [currentActor.character_id]: { surface: 'valid current', subconscious: 'valid current' }
    }
  }, { storyText: story, content, currentState: state });
  assert.deepEqual(normalized.entered, []);
  assert.deepEqual(Object.keys(normalized.mind_monitor), [currentActor.character_id]);
  assert.ok(normalized.warnings.includes('entered_projection_dropped'));
  assert.ok(normalized.warnings.includes('mind_monitor_projection_dropped'));
});

test('R3 mind monitor removes grounded exits and drops unknown or malformed keys fail-open', () => {
  const [currentActor, exitingActor] = Object.values(content.characters);
  const state = createInitialState({ name: 'Player' }, currentActor.default_location_id, [currentActor.character_id, exitingActor.character_id]);
  const story = `${exitingActor.name} exits the meeting room.`;
  const normalized = normalizeObserver({
    exited: [{ actor_id: exitingActor.character_id, quote: `${exitingActor.name} exits the meeting room.` }],
    mind_monitor: {
      [currentActor.character_id]: { surface: 'still here', subconscious: 'still here' },
      [exitingActor.character_id]: { surface: 'left', subconscious: 'left' },
      unknown_actor: { surface: 'unknown', subconscious: 'unknown' },
      [currentActor.name]: { surface: 'name', subconscious: 'name' },
      malformed: 'not an object'
    }
  }, { storyText: story, content, currentState: state });
  assert.deepEqual(normalized.exited, [{ actor_id: exitingActor.character_id, quote: `${exitingActor.name} exits the meeting room.` }]);
  assert.deepEqual(Object.keys(normalized.mind_monitor), [currentActor.character_id]);
  assert.ok(normalized.warnings.includes('mind_monitor_projection_dropped'));
});

test('R3 actor evidence requires an exact Story quote containing the canonical actor name', () => {
  const [currentActor, entrant] = Object.values(content.characters);
  const state = createInitialState({ name: 'Player' }, currentActor.default_location_id, [currentActor.character_id]);
  const story = `${entrant.name} enters the meeting room.`;
  const normalized = normalizeObserver({
    entered: [
      { actor_id: entrant.character_id, quote: 'enters the meeting room.' },
      { actor_id: entrant.character_id, quote: `${entrant.name} enters the meeting room.` }
    ],
    mind_monitor: { [entrant.character_id]: { surface: 'grounded entrant', subconscious: 'grounded entrant' } }
  }, { storyText: story, content, currentState: state });
  assert.deepEqual(normalized.entered, [{ actor_id: entrant.character_id, quote: `${entrant.name} enters the meeting room.` }]);
  assert.deepEqual(Object.keys(normalized.mind_monitor), [entrant.character_id]);
  assert.ok(normalized.warnings.includes('entered_projection_dropped'));
});

test('R3 Story context carries canonical product, location, heroine cards, and general-NPC facts', () => {
  const heroine = Object.values(content.characters)[0];
  const locationId = heroine.default_location_id;
  const location = content.locations.find(item => item.location_id === locationId);
  const npcId = location.default_npc_ids[0];
  const profile = { name: 'R3 Player', department_id: content.departments[0].department_id };
  const state = createInitialState(profile, locationId, [heroine.character_id, npcId]);
  state.scene.scene_note = '현재 장면의 최소 연속성 메모';
  const context = { state: { state }, turns: [] };
  const opening = buildOpeningContext(context, content);
  const turn = buildStoryContext(context, '한국어 원문 행동', { content });
  assert.equal(opening.opening, true);
  assert.equal(turn.literal_action, '한국어 원문 행동');
  assert.equal(turn.product.title, content.edition.title);
  assert.match(turn.product.private_discovery, /NPC/);
  assert.equal(turn.location.name, location.name);
  assert.equal(turn.location.description, location.description);
  assert.equal(turn.scene.scene_note, '현재 장면의 최소 연속성 메모');
  assert.ok(turn.actors.some(actor => actor.id === heroine.character_id && actor.prompt_card.personality));
  assert.ok(turn.actors.some(actor => actor.id === npcId && actor.role && actor.age));
});

test('R3 Story context projects active CSA rules once with scope and no legacy global mirror', () => {
  const heroine = Object.values(content.characters)[0];
  const state = createInitialState({ name: 'R3 CSA Player' }, heroine.default_location_id, [heroine.character_id]);
  state.csa_active = ['r3_csa_1', 'inactive'];
  state.csa_rules = {
    r3_csa_1: {
      id: 'r3_csa_1', active: true, template_id: 'no_panties_under_work_clothes',
      content: 'CANONICAL INSTITUTIONAL RULE', mode: 'continuous', trigger: 'continuous', strength: 'weak',
      subject_scope: 'female_employee', counterparty_scope: null
    },
    inactive: { id: 'inactive', active: false, content: 'MUST NOT APPEAR' }
  };
  const context = buildStoryContext({ state: { state }, turns: [] }, 'canonical action', { content });
  assert.deepEqual(context.active_rules, [{
    id: 'r3_csa_1', template_id: 'no_panties_under_work_clothes', content: 'CANONICAL INSTITUTIONAL RULE',
    mode: 'continuous', trigger: 'continuous', strength: 'weak', subject_scope: 'female_employee', counterparty_scope: null
  }]);
});

test('R3 real Story provider sends each active rule once and excludes inactive rules', async () => {
  const heroine = Object.values(content.characters)[0];
  const state = createInitialState({ name: 'R3 provider player' }, heroine.default_location_id, [heroine.character_id]);
  state.csa_active = ['active-rule', 'inactive-rule'];
  state.csa_rules = {
    'active-rule': {
      id: 'active-rule', active: true, template_id: 'institutional_rule',
      content: 'ACTIVE RULE CONTENT', mode: 'continuous', trigger: 'during work', strength: 'strong',
      subject_scope: 'female_employee', counterparty_scope: 'company_employee'
    },
    'inactive-rule': { id: 'inactive-rule', active: false, content: 'INACTIVE RULE MUST NOT APPEAR' }
  };
  const payloads = [];
  const provider = createR3Provider({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'key', STORY_MODEL: 'story', EXTRACT_MODEL: 'observer' },
    fetchImpl: async (_url, init) => {
      const payload = JSON.parse(init.body);
      payloads.push(payload);
      const stream = ['data: {"choices":[{"delta":{"content":"[SCENE] Story"}}]}', 'data: {"choices":[{"delta":{"content":"\\n1. one\\n2. two\\n3. three\\n4. four"}}]}', 'data: [DONE]', ''].join('\n\n');
      return new Response(stream, { headers: { 'content-type': 'text/event-stream' } });
    }
  });
  let story = '';
  for await (const delta of provider.story({ context: { state: { state }, turns: [] }, content, literalAction: 'observe the work scene' })) story += delta;
  assert.equal(payloads.length, 1);
  const requestContext = JSON.parse(payloads[0].messages[1].content);
  assert.deepEqual(requestContext.active_rules, [{
    id: 'active-rule', template_id: 'institutional_rule', content: 'ACTIVE RULE CONTENT', mode: 'continuous', trigger: 'during work', strength: 'strong',
    subject_scope: 'female_employee', counterparty_scope: 'company_employee'
  }]);
  assert.equal(JSON.stringify(requestContext).match(/ACTIVE RULE CONTENT/g)?.length, 1);
  assert.equal(JSON.stringify(requestContext).includes('INACTIVE RULE MUST NOT APPEAR'), false);
  assert.match(payloads[0].messages[0].content, /authoritative current-world institutional\/system fact already in force/i);
  assert.equal(story.includes('[SCENE] Story'), true);
});

test('Worker content is a bundled canonical JSON path and production wiring selects async Supabase store', async () => {
  const workerContent = loadWorkerCanonicalContent();
  assert.equal(workerContent.edition.edition_id, 'company-v1');
  assert.equal(workerContent.locations.length, content.locations.length);
  const workerContentSource = await readFile(new URL('../runtime-r3/domain/worker-content.js', import.meta.url), 'utf8');
  const workerSource = await readFile(new URL('../runtime-r3/server/worker.js', import.meta.url), 'utf8');
  assert.doesNotMatch(workerContentSource, /node:fs|readFile/i);
  assert.match(workerSource, /new SupabaseR3Store/);
  assert.match(workerSource, /loadWorkerCanonicalContent/);
  assert.match(workerSource, /await store\.context/);
});

test('Supabase R3 adapter keeps async RPC names and attempt-fenced boundary', async () => {
  const calls = [];
  const gameId = '11111111-1111-4111-8111-111111111111';
  const actionId = '22222222-2222-4222-8222-222222222222';
  const job = { game_id: gameId, turn_number: 1, action_id: actionId, attempt_no: 1, status: 'processing', stage: 'reserved', literal_action: '한국어 입력' };
  const state = { game_id: gameId, revision: 0, committed_turn: 0, state: createInitialState({ name: 'Player' }, content.locations[0].location_id) };
  const response = payload => new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } });
  const fetchImpl = async (url, options = {}) => {
    const path = new URL(url).pathname; const name = path.split('/').at(-1); calls.push({ name, rpc: path.includes('/rpc/'), body: options.body ? JSON.parse(options.body) : null });
    if (path.endsWith('/rpc/company_r3_create_game')) return response({ game_id: gameId });
    if (path.endsWith('/rpc/company_r3_reserve_turn')) return response({ created: true, job });
    if (path.endsWith('/rpc/company_r3_expire_stale_turn')) return response(null);
    if (path.endsWith('/rpc/company_r3_update_turn_progress')) return response(job);
    if (path.endsWith('/rpc/company_r3_mark_story_complete')) return response({ ...job, stage: 'story_complete' });
    if (path.endsWith('/rpc/company_r3_commit_turn')) return response({ game_id: gameId, turn_number: 1, revision: 1 });
    if (path.endsWith('/rpc/company_r3_fail_turn')) return response({ ...job, status: 'failed' });
    if (path.endsWith('/company_r3_games')) return response([{ game_id: gameId, profile: { name: 'Player' } }]);
    if (path.endsWith('/company_r3_state')) return response([state]);
    if (path.endsWith('/company_r3_turns')) return response([]);
    if (path.endsWith('/company_r3_turn_jobs')) return response([job]);
    throw new Error(`unexpected ${path}`);
  };
  const store = new SupabaseR3Store({ env: { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service' }, fetchImpl });
  await store.createGame({ profile: { name: 'Player' }, locationId: content.locations[0].location_id });
  await store.reserveTurn({ gameId, turnNumber: 1, actionId, literalAction: '한국어 입력' });
  const attempt = { gameId, turnNumber: 1, actionId, attemptNo: 1 };
  await store.updateProgress({ gameId, turnNumber: 1, attempt, storyText: 'Story' });
  await store.markStoryComplete({ gameId, turnNumber: 1, attempt, storyText: 'Story' });
  await store.commitTurn({ gameId, turnNumber: 1, attempt, expectedRevision: 0, storyText: 'Story', choices: [], summary: 'Summary', stateAfter: state.state });
  await store.failJob({ gameId, turnNumber: 1, attempt, errorCode: 'failed' });
  assert.deepEqual(calls.filter(call => call.rpc).map(call => call.name), [
    'company_r3_create_game', 'company_r3_expire_stale_turn', 'company_r3_reserve_turn', 'company_r3_update_turn_progress', 'company_r3_mark_story_complete', 'company_r3_commit_turn', 'company_r3_expire_stale_turn', 'company_r3_fail_turn', 'company_r3_expire_stale_turn'
  ]);
  assert.equal(calls.find(call => call.name === 'company_r3_reserve_turn').body.p_literal_action, '한국어 입력');
});

test('Supabase Opening adapter preserves one canonical state across duplicate calls', async () => {
  const calls = [];
  const gameId = '33333333-3333-4333-8333-333333333333';
  const initialState = createInitialState({ name: 'Player' }, content.locations[0].location_id);
  const canonicalState = { ...initialState, scene: { ...initialState.scene, scene_note: '오프닝에서 확정된 장면 메모' } };
  const state = { game_id: gameId, revision: 0, committed_turn: 0, state: initialState };
  let turns = [];
  const response = payload => new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } });
  const fetchImpl = async (url, options = {}) => {
    const path = new URL(url).pathname; const name = path.split('/').at(-1); const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ name, body });
    if (path.endsWith('/rpc/company_r3_create_opening')) {
      const created = !turns.length;
      if (created) { state.state = body.p_state_after; turns = [{ game_id: gameId, turn_number: 0, state_after: body.p_state_after, story_text: body.p_story_text }]; }
      return response({ game_id: gameId, turn_number: 0, created });
    }
    if (path.endsWith('/rpc/company_r3_expire_stale_turn')) return response(null);
    if (path.endsWith('/company_r3_games')) return response([{ game_id: gameId, profile: { name: 'Player' } }]);
    if (path.endsWith('/company_r3_state')) return response([state]);
    if (path.endsWith('/company_r3_turns')) return response(turns);
    if (path.endsWith('/company_r3_turn_jobs')) return response([]);
    throw new Error(`unexpected ${path}`);
  };
  const store = new SupabaseR3Store({ env: { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service' }, fetchImpl });
  const first = await store.createOpening(gameId, { expectedRevision: 0, storyText: 'Opening', summary: 'Opening', stateAfter: canonicalState });
  const second = await store.createOpening(gameId, { expectedRevision: 0, storyText: 'Different', summary: 'Different', stateAfter: { ...initialState, scene: { ...initialState.scene, scene_note: '덮어쓰면 안 됨' } } });
  assert.deepEqual(first.state.state, canonicalState);
  assert.deepEqual(first.turns[0].state_after, canonicalState);
  assert.deepEqual(second.state.state, canonicalState);
  assert.equal(second.turns.length, 1);
  assert.deepEqual(calls.filter(call => call.name === 'company_r3_create_opening').map(call => call.body.p_state_after), [canonicalState, { ...initialState, scene: { ...initialState.scene, scene_note: '덮어쓰면 안 됨' } }]);
  const memoryStore = new InMemoryR3Store();
  const memoryGame = memoryStore.createGame({ profile: { name: 'Player' }, locationId: content.locations[0].location_id });
  const memoryFirst = memoryStore.createOpening(memoryGame.game.game_id, { expectedRevision: 0, storyText: 'Opening', summary: 'Opening', stateAfter: canonicalState });
  const memorySecond = memoryStore.createOpening(memoryGame.game.game_id, { expectedRevision: 0, storyText: 'Different', summary: 'Different', stateAfter: { ...initialState, scene: { ...initialState.scene, scene_note: '덮어쓰면 안 됨' } } });
  assert.deepEqual(memoryFirst.state.state, first.state.state);
  assert.deepEqual(memorySecond.state.state, memoryFirst.state.state);
  assert.equal(memorySecond.turns.length, 1);
});

test('R3 migration source fences Opening against stale revisions and rejects non-next reservations', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20260821000100_company_r3_milestone0.sql', import.meta.url), 'utf8');
  assert.match(migration, /from public\.company_r3_state where game_id = p_game_id for update/);
  assert.match(migration, /update public\.company_r3_state set state = p_state_after/);
  assert.match(migration, /v_state\.committed_turn \+ 1 <> p_turn_number/);
  const closure = await readFile(new URL('../supabase/migrations/20260822000200_company_r3_opening_revision_fence.sql', import.meta.url), 'utf8');
  assert.match(closure, /drop function if exists public\.company_r3_create_opening\(uuid, text, jsonb, text, jsonb, jsonb, jsonb, jsonb, jsonb\)/i);
  assert.match(closure, /p_expected_revision integer/);
  assert.match(closure, /v_state\.revision <> p_expected_revision/);
  assert.match(closure, /company_r3_opening_conflict/);
});

test('R3 additive lease migration is stage-aware and keeps the provider budgets unchanged', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20260822000100_company_r3_failed_retry_stage_leases.sql', import.meta.url), 'utf8');
  assert.match(migration, /add column if not exists stage_started_at timestamptz/i);
  assert.match(migration, /stage in \('reserved', 'story_streaming'\) then interval '130 seconds'/i);
  assert.match(migration, /stage = 'story_complete' then interval '85 seconds'/i);
  assert.match(migration, /p_retry_failed boolean default false/i);
  assert.match(migration, /attempt_no = attempt_no \+ 1/i);
  assert.doesNotMatch(migration, /120 seconds/);
  assert.doesNotMatch(migration, /75 seconds/);
});

test('Story first-content timeout includes slow response headers', async () => {
  const provider = createR3Provider({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'key', STORY_MODEL: 'story', EXTRACT_MODEL: 'observer' },
    timeouts: { storyFirstContentMs: 5, storyTotalMs: 200, observerMs: 200 },
    fetchImpl: async () => { await new Promise(resolve => setTimeout(resolve, 25)); return new Response('data: no-content\n\n', { status: 200 }); }
  });
  await assert.rejects(provider.story({ context: {}, content, literalAction: '느리게 응답하는 요청' }).next(), error => error?.code === 'r3_story_first_content_timeout');
});

test('Story total deadline starts at invocation and includes response-header latency', async () => {
  const provider = createR3Provider({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'key', STORY_MODEL: 'story', EXTRACT_MODEL: 'observer' },
    timeouts: { storyFirstContentMs: 100, storyTotalMs: 40 },
    fetchImpl: async () => {
      await new Promise(resolve => setTimeout(resolve, 30));
      let timer;
      const stream = new ReadableStream({ start(controller) { timer = setTimeout(() => { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"late"}}]}\\n\\n')); controller.close(); }, 20); }, cancel() { clearTimeout(timer); } });
      return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
    }
  });
  await assert.rejects(async () => { for await (const _ of provider.story({ context: {}, content, literalAction: 'header latency' })) {} }, error => error?.code === 'r3_story_timeout');
});
