import test from 'node:test';
import assert from 'node:assert/strict';

import { createR3Client } from '../frontend-r3/r3-client.js';
import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { createProductionR3Worker, createR3Worker } from '../runtime-r3/server/worker.js';
import { InMemoryR3Store } from '../runtime-r3/server/store.js';

const content = loadCanonicalCompanyR3Content();
const GAME_ACCESS_SECRET = 'r3-test-secret';
const profile = {
  name: 'Capability Player',
  department_id: content.departments[0].department_id,
  position_id: content.positions[0].position_id,
  age: 29,
  height_cm: 178,
  weight_kg: 72,
  penis_length_cm: 14,
  body_type_id: content.bodyTypes[0].body_type_id,
  speech_style_id: content.speechStyles[0].speech_style_id
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify({ ok: status < 400, data }), { status, headers: { 'content-type': 'application/json' } });
}

async function setup(worker) {
  const response = await worker.fetch(new Request('https://r3.test/api/r3/games', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ profile })
  }));
  const payload = await response.json();
  assert.equal(response.status, 200);
  return { ...payload.data, gameId: payload.data.game.game_id, capability: payload.data.game_capability };
}

function auth(capability) { return { authorization: `Bearer ${capability}` }; }

test('R3 capability is returned only by setup and gates every game route before store/provider work', async () => {
  const store = new InMemoryR3Store();
  const providerCalls = [];
  const provider = {
    async *story() { providerCalls.push('story'); },
    async observe() { providerCalls.push('observe'); return {}; }
  };
  const worker = createR3Worker({ store, provider, content, gameAccessSecret: GAME_ACCESS_SECRET });
  const first = await setup(worker);
  const second = await setup(worker);
  assert.match(first.capability, /^r3\.v1\.[^.]+\.[A-Za-z0-9_-]+$/);
  assert.equal(JSON.stringify(store.games.get(first.gameId)).includes(first.capability), false);
  assert.equal(JSON.stringify(store.states.get(first.gameId)).includes(first.capability), false);
  store.contextCalls = 0;
  const originalContext = store.context.bind(store);
  store.context = (...args) => { store.contextCalls += 1; return originalContext(...args); };
  const protectedRoutes = [
    ['context', 'GET', null],
    ['opening', 'POST', {}],
    ['turn', 'POST', { expected_turn: 1 }],
    ['feedback', 'POST', {}],
    ['csa', 'POST', {}]
  ];
  for (const [route, method, requestBody] of protectedRoutes) {
    for (const headers of [{}, auth('malformed'), auth(second.capability)]) {
      const response = await worker.fetch(new Request(`https://r3.test/api/r3/games/${first.gameId}/${route}`, {
        method,
        headers: method === 'POST' ? { ...headers, 'content-type': 'application/json' } : headers,
        body: requestBody ? JSON.stringify(requestBody) : undefined
      }));
      assert.equal(response.status, 401);
    }
  }
  assert.equal(store.contextCalls, 0);
  assert.deepEqual(providerCalls, []);
  const valid = await worker.fetch(new Request(`https://r3.test/api/r3/games/${first.gameId}/context`, { headers: auth(first.capability) }));
  assert.equal(valid.status, 200);
  const validPayload = await valid.json();
  assert.equal('game_capability' in validPayload.data, false);
});

test('R3 production worker fails closed before creating a game when the access secret is missing', async () => {
  const store = new InMemoryR3Store();
  let creates = 0;
  const createGame = store.createGame.bind(store);
  store.createGame = (...args) => { creates += 1; return createGame(...args); };
  const worker = createProductionR3Worker({ env: {}, store, provider: { async *story() {}, async observe() { return {}; } }, content });
  const response = await worker.fetch(new Request('https://r3.test/api/r3/games', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ profile })
  }));
  assert.equal(response.status, 500);
  assert.equal(creates, 0);
});

function memoryStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
}

test('R3 client persists exact-game capability, authenticates protected calls, and never puts it in a URL', async () => {
  const gameId = 'game-a';
  const capability = 'r3.v1.game-a.test-signature';
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith('/games')) return jsonResponse({ game: { game_id: gameId }, game_capability: capability });
    return jsonResponse({ ok: true });
  };
  const storage = memoryStorage();
  const client = createR3Client('/api/r3', { storage, fetchImpl });
  await client.setup(profile);
  await client.context(gameId);
  await client.opening(gameId);
  await client.turn(gameId, { expected_turn: 1 });
  await client.feedback(gameId, { feedback_text: 'keep going' });
  await client.csa(gameId, { operations: [] });
  assert.equal(storage.getItem(`company-r3:game-capability:${gameId}`), capability);
  assert.equal(calls[0].options.headers?.authorization, undefined);
  for (const call of calls.slice(1)) assert.equal(call.options.headers.authorization, `Bearer ${capability}`);
  assert.equal(calls.every(call => !call.url.includes(capability)), true);
  const reloaded = createR3Client('/api/r3', { storage, fetchImpl });
  await reloaded.context(gameId);
  assert.equal(calls.at(-1).options.headers.authorization, `Bearer ${capability}`);
});

test('R3 client rejects missing or differently keyed capability before sending a request', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return jsonResponse({}); };
  const client = createR3Client('/api/r3', { storage: memoryStorage({ 'company-r3:game-capability:game-b': 'r3.v1.game-b.signature' }), fetchImpl });
  assert.throws(() => client.context('game-a'), /r3_game_access_required/);
  assert.equal(calls, 0);
});
