import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { createR3Worker } from '../runtime-r3/server/worker.js';
import { createDeterministicR3Provider } from '../runtime-r3/server/provider.js';
import { InMemoryR3Store } from '../runtime-r3/server/store.js';
import { R3_OBSERVER_STAGE_LEASE_MS, R3_STORY_STAGE_LEASE_MS } from '../runtime-r3/server/job-policy.js';

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
  assert.deepEqual(opening.filter(item => item.event === 'timing').map(item => item.data.stage), [
    'story_request_start', 'story_complete', 'observer_start', 'observer_complete', 'terminal_commit'
  ]);
  const literal = '브랜드 전략 회의실로 이동해 서원희에게 인사한다.';
  const turn = await events(await request(worker, `/api/r3/games/${gameId}/turn`, { method: 'POST', body: { action_id: 'action-1', expected_turn: 1, literal_action: literal } }));
  assert.equal(turn[0].event, 'meta');
  assert.ok(turn.some(item => item.event === 'story_delta'));
  assert.equal(turn.at(-1).data.status, 'committed');
  assert.deepEqual(turn.filter(item => item.event === 'timing').map(item => item.data.stage), [
    'story_request_start', 'story_complete', 'observer_start', 'observer_complete', 'terminal_commit'
  ]);
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

test('observer failure is fail-open and Story-authored choices survive', async () => {
  const base = createDeterministicR3Provider();
  const provider = { story: base.story, async observe() { throw new Error('observer_unavailable'); } };
  const worker = createR3Worker({ store: new InMemoryR3Store(), provider, content });
  const gameId = await setupGame(worker);
  const opening = await events(await request(worker, `/api/r3/games/${gameId}/opening`, { method: 'POST' }));
  assert.equal(opening.at(-1).data.status, 'committed');
  assert.equal(opening.at(-1).data.context.turns[0].choices.length, 4);
  assert.ok(opening.at(-1).data.context.turns[0].warnings.includes('observer_failed'));
  const literal = '현재 장면을 다시 확인한다.';
  const turn = await events(await request(worker, `/api/r3/games/${gameId}/turn`, { method: 'POST', body: { action_id: 'action-fail-open', expected_turn: 1, literal_action: literal } }));
  const terminal = turn.at(-1).data;
  assert.equal(terminal.status, 'committed');
  assert.ok(terminal.context.turns.at(-1).story_text.includes(literal));
  assert.equal(terminal.context.turns.at(-1).choices.length, 4);
  assert.ok(terminal.context.turns.at(-1).warnings.includes('observer_failed'));
});

test('failed R3 turn is readback-only until one explicit retry reuses the row', async () => {
  const base = createDeterministicR3Provider(); let turnStoryCalls = 0;
  const provider = {
    async *story(args) {
      if (!args.opening) { turnStoryCalls += 1; if (turnStoryCalls === 1) throw new Error('first_story_failed'); }
      yield* base.story(args);
    },
    observe: base.observe
  };
  const store = new InMemoryR3Store(); const worker = createR3Worker({ store, provider, content }); const gameId = await setupGame(worker);
  assert.equal((await events(await request(worker, `/api/r3/games/${gameId}/opening`, { method: 'POST' }))).at(-1).data.status, 'committed');
  const firstAction = '첫 번째 시도는 실패로 남긴다.';
  const first = await events(await request(worker, `/api/r3/games/${gameId}/turn`, { method: 'POST', body: { action_id: 'failed-action', expected_turn: 1, literal_action: firstAction } }));
  assert.equal(first.at(-1).data.status, 'failed'); assert.equal(turnStoryCalls, 1);
  const failedContext = (await (await request(worker, `/api/r3/games/${gameId}/context`)).json()).data;
  assert.equal(failedContext.state.committed_turn, 0); assert.equal(failedContext.job.status, 'failed'); assert.equal(failedContext.job.attempt_no, 1); assert.equal(failedContext.job.literal_action, firstAction);
  const readback = await request(worker, `/api/r3/games/${gameId}/turn`, { method: 'POST', body: { action_id: 'ignored-action', expected_turn: 1, literal_action: '자동 재시도 금지' } });
  const readbackPayload = await readback.json(); assert.equal(readbackPayload.data.reconnect, true); assert.equal(readbackPayload.data.job.status, 'failed'); assert.equal(turnStoryCalls, 1);
  const retry = await events(await request(worker, `/api/r3/games/${gameId}/turn`, { method: 'POST', body: { action_id: 'fresh-retry-action', expected_turn: 1, literal_action: '수정한 행동으로 명시적으로 다시 시도한다.', retry_failed: true } }));
  assert.equal(retry.at(-1).data.status, 'committed'); assert.equal(turnStoryCalls, 2);
  const final = store.context(gameId); const committedJob = store.jobs.get(`${gameId}:1`);
  assert.equal(final.state.committed_turn, 1); assert.equal(final.state.revision, 1); assert.equal(final.job, null);
  assert.equal(committedJob.attempt_no, 2); assert.equal(committedJob.action_id, 'fresh-retry-action'); assert.equal(final.turns.at(-1).literal_action, '수정한 행동으로 명시적으로 다시 시도한다.');
});

test('R3 stale expiry uses a Story lease then an independent Observer lease', () => {
  let now = Date.parse('2026-08-22T00:00:00.000Z'); const store = new InMemoryR3Store({ clock: () => now });
  const game = store.createGame({ profile, locationId: content.locations[0].location_id }); const reservation = store.reserveTurn({ gameId: game.game.game_id, turnNumber: 1, actionId: 'stage-action', literalAction: 'stage lease' });
  now += R3_STORY_STAGE_LEASE_MS + 1; assert.equal(store.context(game.game.game_id).job.status, 'failed');
  const retry = store.reserveTurn({ gameId: game.game.game_id, turnNumber: 1, actionId: 'stage-retry', literalAction: 'stage retry', retryFailed: true });
  store.markStoryComplete({ gameId: game.game.game_id, turnNumber: 1, attempt: { gameId: game.game.game_id, turnNumber: 1, actionId: 'stage-retry', attemptNo: retry.job.attempt_no }, storyText: 'complete Story' });
  now += R3_OBSERVER_STAGE_LEASE_MS - 1; assert.equal(store.context(game.game.game_id).job.status, 'processing');
  now += 2; assert.equal(store.context(game.game.game_id).job.error_code, 'r3_stale_turn_timeout');
  assert.equal(store.context(game.game.game_id).state.committed_turn, 0); assert.equal(reservation.job.attempt_no, 1);
});

test('stale attempt cannot progress or commit after the job fence changes', () => {
  const store = new InMemoryR3Store();
  const game = store.createGame({ profile, locationId: content.locations[0].location_id });
  const reservation = store.reserveTurn({ gameId: game.game.game_id, turnNumber: 1, actionId: 'fresh', literalAction: '확인한다.' });
  assert.throws(() => store.updateProgress({ gameId: game.game.game_id, turnNumber: 1, attempt: { gameId: game.game.game_id, turnNumber: 1, actionId: 'stale', attemptNo: reservation.job.attempt_no, literalAction: '오래된 입력' }, storyText: 'stale' }), /r3_attempt_fence_conflict/);
  assert.equal(store.context(game.game.game_id).state.committed_turn, 0);
});

test('reservation rejects a non-next turn before creating a job', () => {
  const store = new InMemoryR3Store();
  const game = store.createGame({ profile, locationId: content.locations[0].location_id });
  assert.throws(() => store.reserveTurn({ gameId: game.game.game_id, turnNumber: 2, actionId: 'skipped', literalAction: '건너뛴다.' }), /r3_turn_conflict/);
  assert.equal(store.context(game.game.game_id).job, null);
});
