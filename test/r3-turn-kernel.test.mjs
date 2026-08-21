import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { createR3Worker } from '../runtime-r3/server/worker.js';
import { createDeterministicR3Provider } from '../runtime-r3/server/provider.js';
import { InMemoryR3Store } from '../runtime-r3/server/store.js';

const content = loadCanonicalCompanyR3Content();
const profile = {
  name: 'R3 Player', department_id: content.departments[0].department_id, position_id: content.positions[0].position_id,
  age: 28, height_cm: 178, weight_kg: 72, penis_length_cm: 16,
  body_type_id: content.bodyTypes[0].body_type_id, speech_style_id: content.speechStyles[0].speech_style_id
};

async function request(worker, path, { method = 'GET', body } = {}) {
  return worker.fetch(new Request(`https://r3.test${path}`, { method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined }));
}

async function events(response) {
  const text = await response.text();
  return [...text.matchAll(/event: ([^\n]+)\ndata: ([^\n]+)/g)].map(match => ({ event: match[1], data: JSON.parse(match[2]) }));
}

async function setupGame(worker) {
  const response = await request(worker, '/api/r3/games', { method: 'POST', body: { profile } });
  const payload = await response.json();
  assert.equal(payload.ok, true);
  return payload.data.game.game_id;
}

test('one R3 turn streams Story, fences the job, reconnects, and atomically commits', async () => {
  const store = new InMemoryR3Store();
  const worker = createR3Worker({ store, provider: createDeterministicR3Provider(), content });
  const gameId = await setupGame(worker);
  const opening = await events(await request(worker, `/api/r3/games/${gameId}/opening`, { method: 'POST' }));
  assert.equal(opening.at(-1).data.status, 'committed');
  const literal = '브랜드 전략 회의실로 이동해 서원희에게 인사한다.';
  const turn = await events(await request(worker, `/api/r3/games/${gameId}/turn`, { method: 'POST', body: { action_id: 'action-1', expected_turn: 1, literal_action: literal } }));
  assert.equal(turn[0].event, 'meta');
  assert.ok(turn.some(item => item.event === 'story_delta'));
  assert.equal(turn.at(-1).data.status, 'committed');
  assert.equal(turn.at(-1).data.context.state.committed_turn, 1);
  assert.equal(turn.at(-1).data.context.turns.at(-1).literal_action, literal);
  assert.equal(turn.at(-1).data.context.turns.at(-1).choices.length, 4);
  const reconnect = await request(worker, `/api/r3/games/${gameId}/turn`, { method: 'POST', body: { action_id: 'action-1', expected_turn: 1, literal_action: literal } });
  const reconnectPayload = await reconnect.json();
  assert.equal(reconnectPayload.data.reconnect, true);
  assert.equal(reconnectPayload.data.context.state.committed_turn, 1);
  const catalog = await request(worker, '/api/r3/catalogs');
  assert.equal((await catalog.json()).data.locations.length, content.locations.length);
});

test('observer failure is fail-open and stale choices do not survive', async () => {
  const base = createDeterministicR3Provider();
  const provider = { story: base.story, async observe() { throw new Error('observer_unavailable'); } };
  const worker = createR3Worker({ store: new InMemoryR3Store(), provider, content });
  const gameId = await setupGame(worker);
  const opening = await events(await request(worker, `/api/r3/games/${gameId}/opening`, { method: 'POST' }));
  assert.equal(opening.at(-1).data.status, 'committed');
  assert.deepEqual(opening.at(-1).data.context.turns[0].choices, []);
  assert.ok(opening.at(-1).data.context.turns[0].warnings.includes('observer_failed'));
  const literal = '현재 장면을 다시 확인한다.';
  const turn = await events(await request(worker, `/api/r3/games/${gameId}/turn`, { method: 'POST', body: { action_id: 'action-fail-open', expected_turn: 1, literal_action: literal } }));
  const terminal = turn.at(-1).data;
  assert.equal(terminal.status, 'committed');
  assert.ok(terminal.context.turns.at(-1).story_text.includes(literal));
  assert.deepEqual(terminal.context.turns.at(-1).choices, []);
  assert.ok(terminal.context.turns.at(-1).warnings.includes('observer_failed'));
});

test('stale attempt cannot progress or commit after the job fence changes', () => {
  const store = new InMemoryR3Store();
  const game = store.createGame({ profile, locationId: content.locations[0].location_id });
  const reservation = store.reserveTurn({ gameId: game.game.game_id, turnNumber: 1, actionId: 'fresh', literalAction: '확인한다.' });
  assert.throws(() => store.updateProgress({ gameId: game.game.game_id, turnNumber: 1, attempt: { gameId: game.game.game_id, turnNumber: 1, actionId: 'stale', attemptNo: reservation.job.attempt_no, literalAction: '오래된 입력' }, storyText: 'stale' }), /r3_attempt_fence_conflict/);
  assert.equal(store.context(game.game.game_id).state.committed_turn, 0);
});
