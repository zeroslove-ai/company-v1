import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, createApiClient } from '../src/frontend/pages/api.js';

function json(value, status = 200) { return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } }); }

test('frontend API client sends only the Phase 2 request contracts', async () => {
  const calls = [];
  const api = createApiClient({ baseUrl: 'https://worker.example', fetchImpl: async (url, init) => { calls.push({ url, init }); return json({ ok: true, data: { context: {} } }); } });
  await api.context({ game_id: 'game', recent_turns: 15 });
  await api.extract({ game_id: 'game', action_id: 'action' });
  await api.commit({ game_id: 'game', action_id: 'action', expected_turn: 1 });
  await api.actionStatus({ game_id: 'game', action_id: 'action' });
  assert.deepEqual(calls.map(call => new URL(call.url).pathname), ['/api/context', '/api/extract', '/api/commit', '/api/action-status']);
  assert.equal(JSON.parse(calls[2].init.body).next_save, undefined);
});

test('frontend API client serializes the /api/app-state request body as a JSON object, never a bare id string', async () => {
  const calls = [];
  const api = createApiClient({ baseUrl: 'https://worker.example', fetchImpl: async (url, init) => { calls.push({ url, init }); return json({ ok: true, data: { app: {} } }); } });
  await api.appState({ game_id: 'game-1' });
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0].url).pathname, '/api/app-state');
  const parsedBody = JSON.parse(calls[0].init.body);
  assert.equal(typeof parsedBody, 'object');
  assert.ok(parsedBody !== null && !Array.isArray(parsedBody));
  assert.deepEqual(parsedBody, { game_id: 'game-1' });
});

test('frontend API client normalizes JSON and network errors', async () => {
  const rejected = createApiClient({ fetchImpl: async () => json({ ok: false, error: { code: 'turn_conflict', message: 'conflict', retryable: false } }, 409) });
  await assert.rejects(() => rejected.context({}), error => error instanceof ApiError && error.status === 409 && error.code === 'turn_conflict');
  const network = createApiClient({ fetchImpl: async () => { throw new Error('offline'); } });
  await assert.rejects(() => network.context({}), error => error.code === 'network_error' && error.retryable === true);
});

test('frontend API client returns Story SSE response without parsing as JSON', async () => {
  const api = createApiClient({ fetchImpl: async () => new Response('event: complete\\ndata: {}\\n\\n', { status: 200 }) });
  const response = await api.story({ game_id: 'game', action_id: 'action', expected_turn: 1, player_action: 'act' });
  assert.equal(response.status, 200);
});
