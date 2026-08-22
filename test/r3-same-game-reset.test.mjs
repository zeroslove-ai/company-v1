import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { createInitialState } from '../runtime-r3/domain/contracts.js';
import { openingActorIds } from '../runtime-r3/domain/content.js';
import { createR3Worker } from '../runtime-r3/server/worker.js';
import { createDeterministicR3Provider } from '../runtime-r3/server/provider.js';
import { InMemoryR3Store } from '../runtime-r3/server/store.js';

const content = loadCanonicalCompanyR3Content();
const GAME_ACCESS_SECRET = 'r3-reset-test-secret';
const profile = {
  name: 'R3 Reset Player', department_id: content.departments[0].department_id, position_id: content.positions[0].position_id,
  age: 28, height_cm: 178, weight_kg: 72, penis_length_cm: 16,
  body_type_id: content.bodyTypes[0].body_type_id, speech_style_id: content.speechStyles[0].speech_style_id
};

async function call(worker, path, { method = 'GET', body, capability } = {}) {
  const headers = { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(capability ? { authorization: `Bearer ${capability}` } : {}) };
  return worker.fetch(new Request(`https://r3.reset.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }));
}

async function readSse(response) {
  const text = await response.text();
  return [...text.matchAll(/event: ([^\n]+)\ndata: ([^\n]+)/g)].map(match => ({ event: match[1], data: JSON.parse(match[2]) }));
}

async function setupGame(worker) {
  const response = await call(worker, '/api/r3/games', { method: 'POST', body: { profile } });
  const payload = await response.json();
  assert.equal(payload.ok, true);
  return { gameId: payload.data.game.game_id, capability: payload.data.game_capability };
}

function countedProvider(calls) {
  const base = createDeterministicR3Provider();
  return {
    async *story(args) {
      if (args.opening) calls.openingContexts.push(args.context);
      calls.story += 1;
      yield* base.story(args);
    },
    async observe(args) { calls.observe += 1; return base.observe(args); }
  };
}

test('same-game reset fences revision, clears chronology, preserves identity, and reuses Opening once', async () => {
  const calls = { story: 0, observe: 0, openingContexts: [] };
  const store = new InMemoryR3Store();
  const worker = createR3Worker({ store, provider: countedProvider(calls), content, gameAccessSecret: GAME_ACCESS_SECRET });
  const { gameId, capability } = await setupGame(worker);

  assert.equal((await readSse(await call(worker, `/api/r3/games/${gameId}/opening`, { method: 'POST', capability }))).at(-1).data.status, 'committed');
  assert.equal((await readSse(await call(worker, `/api/r3/games/${gameId}/turn`, {
    method: 'POST', capability, body: { action_id: 'reset-turn', expected_turn: 1, literal_action: '회사의 복도를 걸어 현재 장면을 확인한다.' }
  }))).at(-1).data.status, 'committed');
  const before = store.context(gameId);
  const staleState = { ...before.state.state, active_rules: ['stale-rule'], scene: { ...before.state.state.scene, scene_note: 'stale chronology' } };
  store.applyCsa({ gameId, expectedRevision: before.state.revision, stateAfter: staleState, operations: [] });
  store.feedbackAttempts.set(`${gameId}:failed-feedback`, { game_id: gameId, status: 'failed' });
  const revisionBeforeReset = store.context(gameId).state.revision;
  const storyCallsBeforeReset = calls.story;

  const resetEvents = await readSse(await call(worker, `/api/r3/games/${gameId}/reset`, {
    method: 'POST', capability, body: { expected_state_revision: revisionBeforeReset }
  }));
  assert.equal(resetEvents.at(-1).data.status, 'committed');
  assert.equal(calls.story, storyCallsBeforeReset + 1);
  assert.equal(calls.observe, 3);

  const after = store.context(gameId);
  const openingLocationId = after.game.profile.department_id
    ? content.locations.find(location => location.department_id === after.game.profile.department_id && location.opening_enabled !== false)?.location_id
      ?? content.locations.find(location => location.opening_enabled !== false)?.location_id
      ?? content.locations[0].location_id
    : content.locations[0].location_id;
  assert.equal(after.game.game_id, gameId);
  assert.deepEqual(after.game.profile, profile);
  assert.equal(after.state.revision, revisionBeforeReset + 1);
  assert.equal(after.state.committed_turn, 0);
  assert.equal(after.turns.length, 1);
  assert.equal(after.turns[0].turn_number, 0);
  assert.equal(store.jobs.size, 0);
  assert.equal(store.revisionHistory.size, 1);
  assert.equal(store.feedbackAttempts.size, 0);
  assert.deepEqual(calls.openingContexts.at(-1).state.state, createInitialState(profile, openingLocationId, openingActorIds(content, openingLocationId)));
  assert.equal((await (await call(worker, `/api/r3/games/${gameId}/context`, { capability })).json()).ok, true);
});

test('same-game reset rejects stale revisions, missing or cross-game capability, and in-flight work without mutation', async () => {
  const store = new InMemoryR3Store();
  const worker = createR3Worker({ store, provider: createDeterministicR3Provider(), content, gameAccessSecret: GAME_ACCESS_SECRET });
  const first = await setupGame(worker);
  const second = await setupGame(worker);
  const initial = store.context(first.gameId);

  const missing = await call(worker, `/api/r3/games/${first.gameId}/reset`, { method: 'POST', body: { expected_state_revision: 0 } });
  assert.equal(missing.status, 401);
  const wrong = await call(worker, `/api/r3/games/${first.gameId}/reset`, { method: 'POST', capability: 'wrong', body: { expected_state_revision: 0 } });
  assert.equal(wrong.status, 401);
  const cross = await call(worker, `/api/r3/games/${first.gameId}/reset`, { method: 'POST', capability: second.capability, body: { expected_state_revision: 0 } });
  assert.equal(cross.status, 401);
  const stale = await call(worker, `/api/r3/games/${first.gameId}/reset`, { method: 'POST', capability: first.capability, body: { expected_state_revision: 99 } });
  assert.equal(stale.ok, false);
  assert.deepEqual(store.context(first.gameId).state, initial.state);

  store.reserveTurn({ gameId: first.gameId, turnNumber: 1, actionId: 'in-flight', literalAction: '대기 중인 입력' });
  const inFlight = await call(worker, `/api/r3/games/${first.gameId}/reset`, { method: 'POST', capability: first.capability, body: { expected_state_revision: 0 } });
  assert.equal(inFlight.ok, false);
  assert.equal(store.context(first.gameId).job.status, 'processing');
});

test('reset source keeps the capability boundary and additive SQL contract explicit', async () => {
  const [worker, client, app, migration, html] = await Promise.all([
    readFile(new URL('../runtime-r3/server/worker.js', import.meta.url), 'utf8'),
    readFile(new URL('../frontend-r3/r3-client.js', import.meta.url), 'utf8'),
    readFile(new URL('../frontend-r3/app.js', import.meta.url), 'utf8'),
    readFile(new URL('../supabase/migrations/20260823000100_company_r3_same_game_reset.sql', import.meta.url), 'utf8'),
    readFile(new URL('../frontend-r3/index.html', import.meta.url), 'utf8')
  ]);
  assert.match(worker, /resetResponse/);
  assert.match(worker, /verifyGameCapability\(gameId, bearerCapability\(request\)/);
  assert.match(worker, /createInitialState\(profile, locationId, openingActorIds/);
  assert.match(client, /reset\(gameId, payload\)/);
  assert.match(client, /authHeaders\(gameId, \{ 'content-type': 'application\/json' \}\)/);
  assert.match(app, /consumeR3Sse\(await client\.reset/);
  assert.match(app, /confirm\('현재 게임을 초기화하고 Opening부터 다시 시작할까요\?'/);
  assert.match(app, /reset-game.*addEventListener|addEventListener\('click', resetGame\)/);
  assert.match(migration, /for update/);
  assert.match(migration, /company_r3_reset_revision_conflict/);
  assert.match(migration, /company_r3_reset_in_flight/);
  assert.match(migration, /delete from public\.company_r3_turns/);
  assert.match(migration, /revision = v_next_revision/);
  assert.match(migration, /grant execute on function public\.company_r3_reset_game/);
  assert.match(html, /id="reset-game"/);
});
