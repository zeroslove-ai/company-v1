import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { createInitialState } from '../runtime-r3/domain/contracts.js';
import { buildStoryContext } from '../runtime-r3/domain/memory.js';
import { applyNavigationPostcondition, projectNavigationContext, resolvePlayerNavigationIntent } from '../runtime-r3/domain/navigation.js';
import { normalizeObserver } from '../runtime-r3/domain/observer-normalizer.js';
import { reduceObservation } from '../runtime-r3/domain/reducer.js';
import { createR3Provider } from '../runtime-r3/server/provider.js';
import { createR3Worker } from '../runtime-r3/server/worker.js';
import { InMemoryR3Store } from '../runtime-r3/server/store.js';

const content = loadCanonicalCompanyR3Content();
const SECRET = 'owner-p0-test-secret';
const profile = {
  name: 'P0 Test Player',
  department_id: content.departments[0].department_id,
  position_id: content.positions[0].position_id,
  age: 29,
  height_cm: 178,
  weight_kg: 72,
  penis_length_cm: 14,
  body_type_id: content.bodyTypes[0].body_type_id,
  speech_style_id: content.speechStyles[0].speech_style_id
};

function actionRequest(worker, path, { method = 'GET', body } = {}) {
  const gameId = path.match(/^\/api\/r3\/games\/([^/]+)/)?.[1];
  const headers = body ? { 'content-type': 'application/json' } : {};
  const capability = gameId ? worker.gameCapabilities?.get(gameId) : null;
  if (capability) headers.authorization = `Bearer ${capability}`;
  return worker.fetch(new Request(`https://r3.test${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined }));
}

async function sseEvents(response) {
  const text = await response.text();
  return [...text.matchAll(/event: ([^\n]+)\ndata: ([^\n]+)/g)].map(match => ({ event: match[1], data: JSON.parse(match[2]) }));
}

async function setup(worker) {
  const response = await actionRequest(worker, '/api/r3/games', { method: 'POST', body: { profile } });
  const payload = await response.json();
  const gameId = payload.data.game.game_id;
  worker.gameCapabilities ??= new Map();
  worker.gameCapabilities.set(gameId, payload.data.game_capability);
  return gameId;
}

function storyWithChoices(choices, body) {
  return `${body}\n1. ${choices[0]}\n2. ${choices[1]}\n3. ${choices[2]}\n4. ${choices[3]}`;
}

test('R3 Worker passes current literal authority with prior Story choice menu removed from memory', async () => {
  const openingChoices = ['고개를 끄덕인다.', '창가로 간다.', '질문한다.', '잠시 기다린다.'];
  const turnChoices = ['주변을 살핀다.', '자리에 앉는다.', '메모한다.', '자유 입력을 한다.'];
  const currentLiteral = '이메이는 브랜드전략팀 사무실을 떠나 2층 공용 회의실로 이동한다.';
  const storyRequests = [];
  const provider = {
    async *story({ opening, context, literalAction }) {
      storyRequests.push({ opening, context, literalAction });
      yield storyWithChoices(opening ? openingChoices : turnChoices, opening ? 'Opening committed narrative.' : 'Current literal narrative.');
    },
    async observe({ storyText }) {
      return { choices: storyText.includes('Opening committed') ? openingChoices : turnChoices, turn_summary: 'summary' };
    }
  };
  const worker = createR3Worker({ store: new InMemoryR3Store(), provider, content, gameAccessSecret: SECRET });
  const gameId = await setup(worker);
  const opening = await sseEvents(await actionRequest(worker, `/api/r3/games/${gameId}/opening`, { method: 'POST' }));
  assert.equal(opening.at(-1).data.status, 'committed');
  const turn = await sseEvents(await actionRequest(worker, `/api/r3/games/${gameId}/turn`, {
    method: 'POST',
    body: { action_id: 'current-literal', expected_turn: 1, literal_action: currentLiteral }
  }));
  assert.equal(turn.at(-1).data.status, 'committed');
  const ordinary = storyRequests.at(-1);
  assert.equal(ordinary.opening ?? false, false);
  assert.equal(ordinary.literalAction, currentLiteral);
  assert.deepEqual(ordinary.context.turns[0].literal_action, '');
  assert.match(ordinary.context.turns[0].story_text, /Opening committed narrative/);
});

test('R3 Worker Opening applies grounded final-presence evidence instead of copied prior/default presence', async () => {
  const absentActor = content.characters.heroine5;
  const currentActor = content.characters.heroine1;
  const choices = ['one', 'two', 'three', 'four'];
  const absenceQuote = `${absentActor.name} is absent because she has not arrived and her seat is empty.`;
  const story = `${absenceQuote} ${currentActor.name} remains in the office.\n1. ${choices[0]}\n2. ${choices[1]}\n3. ${choices[2]}\n4. ${choices[3]}`;
  const provider = {
    async *story() { yield story; },
    async observe() {
      return {
        present_actor_ids: [absentActor.character_id, currentActor.character_id],
        presence_reconciliation: [{ actor_id: absentActor.character_id, status: 'absent', quote: absenceQuote }],
        scene_note: `${currentActor.name} remains in the office.`,
        turn_summary: 'The absent actor is not in the final scene.',
        choices
      };
    }
  };
  const store = new InMemoryR3Store();
  const worker = createR3Worker({ store, provider, content, gameAccessSecret: SECRET });
  const gameId = await setup(worker);
  const gameState = store.states.get(gameId);
  gameState.state.scene.present_actor_ids = [absentActor.character_id, currentActor.character_id];
  const events = await sseEvents(await actionRequest(worker, `/api/r3/games/${gameId}/opening`, { method: 'POST' }));
  const terminal = events.at(-1).data;
  assert.equal(terminal.status, 'committed');
  assert.deepEqual(terminal.context.state.state.scene.present_actor_ids, [currentActor.character_id]);
  assert.deepEqual(terminal.context.turns.at(-1).observer_applied.presence_reconciliation, [{ actor_id: absentActor.character_id, quote: absenceQuote, status: 'absent' }]);
});

test('owner P0 agency contract keeps an addressed request from authorizing private-app interaction', () => {
  const state = createInitialState({ name: 'Player' }, content.locations[0].location_id, ['general_park_jungwoo']);
  const literal = '박정우 팀장에게 상식개변 앱에 대해 먼저 묻는다.';
  const context = buildStoryContext({ state: { state }, turns: [] }, literal, { content });
  assert.equal(context.literal_action, literal);
  assert.equal(context.player_agency_contract.app_topic_boundary, 'Mentioning the private app, a rule, or a topic is not a player app interaction.');
  assert.equal(context.player_agency_contract.app_interaction_boundary.includes('requires that voluntary action to be explicit'), true);
  assert.equal(context.player_agency_contract.preserve_explicit_dimensions.includes('target'), true);
});

test('exact canonical location navigation projects the destination before Story and clears source presence', () => {
  const source = createInitialState({ name: 'Player' }, 'brand_strategy_office', ['general_park_jungwoo']);
  const literal = '\uC9C1\uC6D0 \uB77C\uC6B4\uC9C0\uB85C \uC774\uB3D9\uD55C\uB2E4';
  const intent = resolvePlayerNavigationIntent({ content, state: source, literalAction: literal });
  assert.deepEqual(intent, { kind: 'player_navigation', destination_location_id: 'employee_lounge', source: 'explicit_player_binding' });
  const projected = projectNavigationContext({ state: { state: source }, turns: [] }, intent, content);
  assert.equal(projected.state.state.scene.location_id, 'employee_lounge');
  assert.deepEqual(projected.state.state.scene.present_actor_ids, []);
  const staleObservation = { present_actor_ids: ['general_park_jungwoo'], entered: [], scene_note: 'old office leaked by observer' };
  const after = applyNavigationPostcondition(source, staleObservation, intent, content);
  assert.equal(after.scene.location_id, 'employee_lounge');
  assert.deepEqual(after.scene.present_actor_ids, []);
});

test('current-turn player movement authority binds resolver output for NPC-only and explicit navigation', () => {
  const state = createInitialState({ name: 'Player' }, 'brand_strategy_office', ['heroine1', 'heroine2']);
  const npcOnlyLiteral = '\uC11C\uC6D0\uD76C\uAC00 \uBC15\uC815\uC6B0\uAC00 2\uCE35 \uACF5\uC6A9 \uD68C\uC758\uC2E4\uB85C \uC774\uB3D9\uD55C\uB2E4.';
  const npcIntent = resolvePlayerNavigationIntent({ content, state, literalAction: npcOnlyLiteral });
  assert.equal(npcIntent, null);
  const npcStoryContext = buildStoryContext(projectNavigationContext({ state: { state }, turns: [] }, npcIntent, content), npcOnlyLiteral, { content });
  assert.equal(npcStoryContext.current_turn_player_movement_authority.authorized, false);
  assert.equal(npcStoryContext.current_turn_player_movement_authority.player_voluntary_navigation_authorized, false);
  assert.equal(npcStoryContext.current_turn_player_movement_authority.preserve_location_id, 'brand_strategy_office');
  assert.equal(npcStoryContext.current_turn_player_movement_authority.destination_location_id, null);
  assert.equal(npcStoryContext.current_turn_player_movement_authority.npc_or_remote_movement_cannot_authorize_player_bridge, true);

  const explicitLiteral = '\uB098\uB294 2\uCE35 \uACF5\uC6A9 \uD68C\uC758\uC2E4\uB85C \uC774\uB3D9\uD55C\uB2E4.';
  const explicitIntent = resolvePlayerNavigationIntent({ content, state, literalAction: explicitLiteral });
  assert.deepEqual(explicitIntent, { kind: 'player_navigation', destination_location_id: 'meeting_room', source: 'explicit_player_binding' });
  const explicitStoryContext = buildStoryContext(projectNavigationContext({ state: { state }, turns: [] }, explicitIntent, content), explicitLiteral, { content });
  assert.equal(explicitStoryContext.current_turn_player_movement_authority.authorized, true);
  assert.equal(explicitStoryContext.current_turn_player_movement_authority.player_voluntary_navigation_authorized, true);
  assert.equal(explicitStoryContext.current_turn_player_movement_authority.destination_location_id, 'meeting_room');
});

test('R3 Story provider gives current-turn movement binding precedence over narrative convenience', async () => {
  const state = createInitialState({ name: 'Player' }, 'brand_strategy_office', ['heroine1']);
  const literal = '\uC11C\uC6D0\uD76C\uAC00 \uBC15\uC815\uC6B0\uAC00 2\uCE35 \uACF5\uC6A9 \uD68C\uC758\uC2E4\uB85C \uC774\uB3D9\uD55C\uB2E4.';
  const requests = [];
  const provider = createR3Provider({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'key', STORY_MODEL: 'story', EXTRACT_MODEL: 'observer' },
    fetchImpl: async (_url, init) => {
      requests.push(JSON.parse(init.body));
      return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: 'grounded Story' } }] })}\n\ndata: [DONE]\n\n`, { headers: { 'content-type': 'text/event-stream' } });
    }
  });
  const intent = resolvePlayerNavigationIntent({ content, state, literalAction: literal });
  for await (const _ of provider.story({
    context: projectNavigationContext({ state: { state }, turns: [] }, intent, content),
    content,
    literalAction: literal
  })) {}
  assert.equal(requests.length, 1);
  const payload = JSON.parse(requests[0].messages[1].content);
  assert.equal(payload.current_turn_player_movement_authority.authorized, false);
  assert.equal(payload.current_turn_player_movement_authority.preserve_location_id, 'brand_strategy_office');
  assert.match(requests[0].messages[0].content, /current_turn_player_movement_authority/);
  assert.match(requests[0].messages[0].content, /preserve_location_id/);
  assert.match(requests[0].messages[0].content, /cannot be overridden/);
});

test('NPC-only movement does not bind player navigation, while explicit player clauses still win', () => {
  const state = createInitialState({ name: 'Player' }, 'brand_strategy_office', ['heroine1', 'heroine2']);
  const context = buildStoryContext({ state: { state }, turns: [] }, 'NPC-only movement probe', { content });
  assert.match(context.player_agency_contract.npc_movement_boundary, /NPC-only movement.*never authorizes PLAYER follow, entry, accompaniment, teleport/i);
  assert.equal(resolvePlayerNavigationIntent({ content, state, literalAction: '서원희 차장과 박정우 팀장이 회의실로 이동한 뒤에도 나는 윤민아 대리에게 업무를 묻는다.' }), null);
  assert.deepEqual(resolvePlayerNavigationIntent({ content, state, literalAction: '나는 회의실로 이동한다.' }), { kind: 'player_navigation', destination_location_id: 'meeting_room', source: 'explicit_player_binding' });
  assert.deepEqual(resolvePlayerNavigationIntent({ content, state, literalAction: '서원희 차장은 회의실로 이동한 뒤 나는 직원 라운지로 이동한다.' }), { kind: 'player_navigation', destination_location_id: 'employee_lounge', source: 'explicit_player_binding' });
});

test('exact self-stay frame does not bind an NPC-owned destination to player navigation', () => {
  const state = createInitialState({ name: 'Player' }, 'brand_strategy_office', ['heroine1', 'heroine2']);
  const selfStay = '나는 자리에 그대로 남은 채 서원희 차장과 박정우 팀장이 브랜드전략팀 회의실로 이동하는 모습을 지켜본다.';
  const observesNpcMovement = '나는 서원희 차장과 박정우 팀장이 브랜드전략팀 회의실로 이동하는 모습을 본다.';
  assert.equal(resolvePlayerNavigationIntent({ content, state, literalAction: selfStay }), null);
  assert.equal(resolvePlayerNavigationIntent({ content, state, literalAction: observesNpcMovement }), null);
  assert.deepEqual(resolvePlayerNavigationIntent({ content, state, literalAction: '나는 브랜드전략팀 회의실로 이동한다.' }), { kind: 'player_navigation', destination_location_id: 'brand_strategy_meeting_room', source: 'explicit_player_binding' });

  const observerOffice = {
    location: { location_id: 'brand_strategy_office' },
    present_actor_ids: ['heroine2', 'heroine3', 'heroine4', 'heroine5'],
    scene_note: 'The player remains in the office while the NPC pair leaves.'
  };
  const after = applyNavigationPostcondition(state, observerOffice, null, content);
  assert.equal(after.scene.location_id, 'brand_strategy_office');
  assert.deepEqual(after.scene.present_actor_ids, ['heroine1', 'heroine2']);
});

test('registered heroine destination is explicit player navigation, not NPC motion', () => {
  const state = createInitialState({ name: 'Player' }, 'employee_lounge', []);
  assert.deepEqual(resolvePlayerNavigationIntent({ content, state, literalAction: '나는 서원희에게 간다.' }), { kind: 'player_navigation', destination_location_id: 'brand_strategy_office', source: 'explicit_player_binding' });
  assert.equal(resolvePlayerNavigationIntent({ content, state, literalAction: '서원희는 브랜드전략팀 사무실로 이동한다.' }), null);
});

test('R3 Worker carries exact navigation through Story/Observer/Commit and does not accept stale source presence', async () => {
  const contexts = [];
  const choices = ['첫 번째 행동을 한다', '두 번째 행동을 한다', '세 번째 행동을 한다', '네 번째 행동을 한다'];
  const provider = {
    async *story({ opening = false, context, literalAction = '' }) {
      if (!opening) contexts.push(structuredClone(context));
      yield `${opening ? '첫 출근의 장면이 열린다.' : `${literalAction} 직원 라운지에 도착한다.`}\n1. ${choices[0]}\n2. ${choices[1]}\n3. ${choices[2]}\n4. ${choices[3]}`;
    },
    async observe({ literalAction = '' }) {
      return { present_actor_ids: literalAction ? ['general_park_jungwoo'] : [], choices, scene_note: '현재 장면' };
    }
  };
  const store = new InMemoryR3Store();
  const worker = createR3Worker({ store, provider, content, gameAccessSecret: SECRET });
  const gameId = await setup(worker);
  assert.equal((await sseEvents(await actionRequest(worker, `/api/r3/games/${gameId}/opening`, { method: 'POST' }))).at(-1).data.status, 'committed');
  const literal = '\uC9C1\uC6D0 \uB77C\uC6B4\uC9C0\uB85C \uC774\uB3D9\uD55C\uB2E4';
  const turn = await sseEvents(await actionRequest(worker, `/api/r3/games/${gameId}/turn`, { method: 'POST', body: { action_id: 'owner-navigation', expected_turn: 1, literal_action: literal } }));
  const terminal = turn.at(-1).data;
  assert.equal(terminal.status, 'committed');
  assert.equal(contexts[0].state.state.scene.location_id, 'employee_lounge');
  assert.equal(terminal.context.state.state.scene.location_id, 'employee_lounge');
  assert.deepEqual(terminal.context.state.state.scene.present_actor_ids, []);
  assert.equal(terminal.context.turns.at(-1).literal_action, literal);
  assert.ok(terminal.context.turns.at(-1).warnings.includes('canonical_navigation_applied'));
});

test('R3 player location authority rejects NPC-only compound movement at the worker boundary', async () => {
  const seowonhui = Object.values(content.characters).find(actor => actor.name === '\uC11C\uC6D0\uD76C');
  const park = content.generalNpcs.find(actor => actor.name === '\uBC15\uC815\uC6B0');
  assert.ok(seowonhui && park);
  const state = createInitialState({ name: 'Player' }, 'brand_strategy_office', [seowonhui.character_id, park.id]);
  const npcOnlyLiteral = seowonhui.name + '\uC640 ' + park.name + '\uAC00 \uC0AC\uBB34\uC2E4\uC744 \uB098\uAC00 2\uCE35 \uACF5\uC6A9 \uD68C\uC758\uC2E4\uB85C \uC774\uB3D9\uD55C\uB2E4.';
  const npcOnlyQuote = seowonhui.name + '\uC640 ' + park.name + '\uAC00 2\uCE35 \uACF5\uC6A9 \uD68C\uC758\uC2E4\uB85C \uB4E4\uC5B4\uAC04\uB2E4.';
  const seowonhuiExitQuote = seowonhui.name + '\uC640 ' + park.name + '\uAC00 \uC0AC\uBB34\uC2E4\uC744 \uB098\uAC14\uB2E4.';
  const parkExitQuote = park.name + '\uAC00 \uC0AC\uBB34\uC2E4\uC744 \uB098\uAC14\uB2E4.';
  const npcOnlyStory = npcOnlyQuote + ' ' + seowonhuiExitQuote + ' ' + parkExitQuote + ' \uD50C\uB808\uC774\uC5B4\uB294 \uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300 \uC0AC\uBB34\uC2E4 \uBCF5\uB3C4\uC5D0 \uB0A8\uC544 \uC788\uB2E4.';
  const choices = ['one', 'two', 'three', 'four'];
  assert.equal(resolvePlayerNavigationIntent({ content, state, literalAction: npcOnlyLiteral }), null);
  assert.equal(resolvePlayerNavigationIntent({ content, state, literalAction: seowonhui.name + '\uAC00 2\uCE35 \uACF5\uC6A9 \uD68C\uC758\uC2E4\uB85C \uC774\uB3D9\uD55C\uB2E4.' }), null);
  assert.equal(resolvePlayerNavigationIntent({ content, state, literalAction: '\uB098\uB294 \uC2E0\uC0AC\uC5C5TF \uC0AC\uBB34\uC2E4\uB85C \uC774\uB3D9\uD55C\uB2E4.' }), null);
  assert.deepEqual(resolvePlayerNavigationIntent({ content, state, literalAction: seowonhui.name + '\uAC00 \uD68C\uC758\uC2E4\uB85C \uC774\uB3D9\uD55C \uB4A4 \uB098\uB294 \uC9C1\uC6D0 \uB77C\uC6B4\uC9C0\uB85C \uC774\uB3D9\uD55C\uB2E4.' }), { kind: 'player_navigation', destination_location_id: 'employee_lounge', source: 'explicit_player_binding' });

  const normalizedNpcOnly = normalizeObserver({
    location: { location_id: 'meeting_room', quote: npcOnlyQuote },
    exited: [
      { actor_id: seowonhui.character_id, quote: seowonhuiExitQuote },
      { actor_id: park.id, quote: parkExitQuote }
    ],
    present_actor_ids: [],
    scene_note: '\uD50C\uB808\uC774\uC5B4\uB294 \uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300 \uC0AC\uBB34\uC2E4 \uBCF5\uB3C4\uC5D0 \uB0A8\uC544 \uC788\uB2E4.'
  }, { storyText: npcOnlyStory, content, currentState: state });
  assert.equal(normalizedNpcOnly.location, undefined);
  assert.ok(normalizedNpcOnly.warnings.includes('location_projection_dropped'));
  assert.equal(normalizedNpcOnly.exited.length, 2);
  const reducedNpcOnly = reduceObservation({ state, observation: normalizedNpcOnly, turnNumber: 1 });
  assert.equal(reducedNpcOnly.state.scene.location_id, 'brand_strategy_office');
  assert.deepEqual(reducedNpcOnly.state.scene.present_actor_ids, []);
  assert.equal(reducedNpcOnly.state.scene.scene_note, normalizedNpcOnly.scene_note);

  const explicitPlayerStory = '\uB098\uB294 \uC9C1\uC6D0 \uB77C\uC6B4\uC9C0\uC5D0 \uB3C4\uCC29\uD588\uB2E4.';
  const normalizedPlayer = normalizeObserver({ location: { location_id: 'brand_strategy_office', quote: explicitPlayerStory } }, { storyText: explicitPlayerStory, content, currentState: state });
  assert.equal(normalizedPlayer.location.location_id, 'employee_lounge');

  const storyContexts = [];
  const provider = {
    async *story({ opening = false, context }) {
      if (!opening) storyContexts.push(structuredClone(context));
      yield (opening ? '\uCCAB \uCD9C\uADFC \uC624\uD508\uB2DD\uC774 \uC5F4\uB9B0\uB2E4.' : npcOnlyStory) + '\n1. ' + choices[0] + '\n2. ' + choices[1] + '\n3. ' + choices[2] + '\n4. ' + choices[3];
    },
    async observe({ literalAction = '' }) {
      if (!literalAction) return { present_actor_ids: [seowonhui.character_id, park.id], choices };
      return {
        location: { location_id: 'meeting_room', quote: npcOnlyQuote },
        exited: [
          { actor_id: seowonhui.character_id, quote: seowonhuiExitQuote },
          { actor_id: park.id, quote: parkExitQuote }
        ],
        present_actor_ids: [],
        scene_note: '\uD50C\uB808\uC774\uC5B4\uB294 \uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300 \uC0AC\uBB34\uC2E4 \uBCF5\uB3C4\uC5D0 \uB0A8\uC544 \uC788\uB2E4.',
        choices
      };
    }
  };
  const worker = createR3Worker({ store: new InMemoryR3Store(), provider, content, gameAccessSecret: SECRET });
  const gameId = await setup(worker);
  assert.equal((await sseEvents(await actionRequest(worker, '/api/r3/games/' + gameId + '/opening', { method: 'POST' }))).at(-1).data.status, 'committed');
  const events = await sseEvents(await actionRequest(worker, '/api/r3/games/' + gameId + '/turn', { method: 'POST', body: { action_id: 'npc-only-authority', expected_turn: 1, literal_action: npcOnlyLiteral } }));
  const terminal = events.at(-1).data;
  assert.equal(terminal.status, 'committed');
  assert.equal(terminal.context.state.state.scene.location_id, 'brand_strategy_office');
  assert.deepEqual(terminal.context.state.state.scene.present_actor_ids, []);
  assert.equal(terminal.context.turns.at(-1).observer_applied.location, undefined);
  assert.equal(terminal.context.turns.at(-1).literal_action, npcOnlyLiteral);
  assert.equal(storyContexts[0].current_turn_player_movement_authority.authorized, false);
  assert.equal(storyContexts[0].current_turn_player_movement_authority.preserve_location_id, 'brand_strategy_office');
});

test('ambiguous or non-movement location mentions fail open without fabricated navigation', () => {
  const state = createInitialState({ name: 'Player' }, 'brand_strategy_office', ['general_park_jungwoo']);
  assert.equal(resolvePlayerNavigationIntent({ content, state, literalAction: '직원 라운지 자료를 확인한다' }), null);
  assert.equal(resolvePlayerNavigationIntent({ content, state, literalAction: '알 수 없는 방으로 이동한다' }), null);
});
