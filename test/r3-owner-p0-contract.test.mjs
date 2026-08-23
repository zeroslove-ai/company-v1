import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { createInitialState } from '../runtime-r3/domain/contracts.js';
import { buildStoryContext } from '../runtime-r3/domain/memory.js';
import { applyNavigationPostcondition, projectNavigationContext, resolvePlayerNavigationIntent } from '../runtime-r3/domain/navigation.js';
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
  assert.deepEqual(intent, { kind: 'player_navigation', destination_location_id: 'employee_lounge', source: 'explicit_location' });
  const projected = projectNavigationContext({ state: { state: source }, turns: [] }, intent, content);
  assert.equal(projected.state.state.scene.location_id, 'employee_lounge');
  assert.deepEqual(projected.state.state.scene.present_actor_ids, []);
  const staleObservation = { present_actor_ids: ['general_park_jungwoo'], entered: [], scene_note: 'old office leaked by observer' };
  const after = applyNavigationPostcondition(source, staleObservation, intent, content);
  assert.equal(after.scene.location_id, 'employee_lounge');
  assert.deepEqual(after.scene.present_actor_ids, []);
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

test('ambiguous or non-movement location mentions fail open without fabricated navigation', () => {
  const state = createInitialState({ name: 'Player' }, 'brand_strategy_office', ['general_park_jungwoo']);
  assert.equal(resolvePlayerNavigationIntent({ content, state, literalAction: '직원 라운지 자료를 확인한다' }), null);
  assert.equal(resolvePlayerNavigationIntent({ content, state, literalAction: '알 수 없는 방으로 이동한다' }), null);
});
