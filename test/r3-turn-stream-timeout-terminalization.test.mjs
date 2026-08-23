import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { createR3Worker } from '../runtime-r3/server/worker.js';
import { createDeterministicR3Provider } from '../runtime-r3/server/provider.js';
import { InMemoryR3Store } from '../runtime-r3/server/store.js';

const content = loadCanonicalCompanyR3Content();
const secret = 'r3-test-secret';
const profile = {
  name: 'R3 Timeout Player',
  department_id: content.departments[0].department_id,
  position_id: content.positions[0].position_id,
  age: 28,
  height_cm: 178,
  weight_kg: 72,
  penis_length_cm: 16,
  body_type_id: content.bodyTypes[0].body_type_id,
  speech_style_id: content.speechStyles[0].speech_style_id
};

async function request(worker, path, { method = 'GET', body } = {}) {
  const gameId = path.match(/^\/api\/r3\/games\/([^/]+)/)?.[1];
  const headers = body ? { 'content-type': 'application/json' } : {};
  const capability = worker.capabilities?.get(gameId);
  if (capability) headers.authorization = `Bearer ${capability}`;
  return worker.fetch(new Request(`https://r3.test${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined }));
}

async function setupGame(worker) {
  const response = await request(worker, '/api/r3/games', { method: 'POST', body: { profile } });
  const payload = await response.json();
  assert.equal(payload.ok, true);
  const gameId = payload.data.game.game_id;
  worker.capabilities ??= new Map();
  worker.capabilities.set(gameId, payload.data.game_capability);
  const opening = await request(worker, `/api/r3/games/${gameId}/opening`, { method: 'POST' });
  assert.equal((await opening.text()).includes('"status":"committed"'), true);
  return gameId;
}

function timeoutAfterPartialProvider() {
  const base = createDeterministicR3Provider();
  let turnCalls = 0;
  return {
    get turnCalls() { return turnCalls; },
    async *story(args) {
      if (args.opening) {
        yield* base.story(args);
        return;
      }
      turnCalls += 1;
      yield 'partial Story before the compressed timeout';
      await new Promise(resolve => setTimeout(resolve, 15));
      const error = new Error('r3_story_timeout');
      error.code = 'r3_story_timeout';
      throw error;
    },
    observe: base.observe
  };
}

async function cancelAfterStoryDelta(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  for (let index = 0; index < 5; index += 1) {
    const result = await reader.read();
    if (result.done) break;
    text += decoder.decode(result.value, { stream: true });
    if (text.includes('partial Story before the compressed timeout')) break;
  }
  assert.match(text, /partial Story before the compressed timeout/);
  await reader.cancel('client_disconnect_after_partial_story');
}

test('partial Story timeout after downstream cancellation is retained by the execution context', async () => {
  const store = new InMemoryR3Store();
  const provider = timeoutAfterPartialProvider();
  const worker = createR3Worker({ store, provider, content, gameAccessSecret: secret });
  const gameId = await setupGame(worker);
  const executionPromises = [];
  const executionContext = { waitUntil(promise) { executionPromises.push(promise); } };

  const response = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/turn`, {
    method: 'POST',
    headers: { authorization: `Bearer ${worker.capabilities.get(gameId)}`, 'content-type': 'application/json' },
    body: JSON.stringify({ action_id: 'cancelled-timeout', expected_turn: 1, literal_action: 'compressed timeout after partial Story' })
  }), {}, executionContext);
  await cancelAfterStoryDelta(response);

  assert.equal(executionPromises.length, 1);
  await Promise.all(executionPromises);
  const context = store.context(gameId);
  assert.equal(provider.turnCalls, 1);
  assert.equal(context.state.committed_turn, 0);
  assert.equal(context.turns.length, 1);
  assert.equal(context.job.status, 'failed');
  assert.equal(context.job.error_code, 'r3_story_timeout');
  assert.equal(context.job.progress_writes >= 1, true);
  assert.equal(context.job.attempt_no, 1);
});
