import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  SmokeError,
  assertContext,
  main,
  requiredGameId,
  runSmoke
} from '../scripts/smoke-api-worker.mjs';

const gameId = '2d00d76e-85b1-4cf0-8dab-a04e8a044b84';

function context({ save, game = { id: gameId, edition_id: 'company-v1' } } = {}) {
  return { ok: true, data: { context: { game, save } } };
}

function save(committedTurn = 18) {
  return {
    edition: 'company-v1',
    save_schema_version: 1,
    turn_state: { committed_turn: committedTurn }
  };
}

test('valid wrapped Company context with nonzero committed turn passes', () => {
  assert.doesNotThrow(() => assertContext(context({ save: { data: save(18), committed_turn: 18 } }), gameId));
});

test('valid direct save with nonzero committed turn passes', () => {
  assert.doesNotThrow(() => assertContext(context({ save: save(11) }), gameId));
});

test('wrapped and nested committed turns must agree', () => {
  assert.throws(
    () => assertContext(context({ save: { data: save(18), committed_turn: 17 } }), gameId),
    error => error instanceof SmokeError && error.code === 'unexpected_context_payload'
  );
});

test('context identity and schema remain strict', () => {
  assert.throws(() => assertContext(context({ save: save(18), game: { id: gameId, edition_id: 'other' } }), gameId), /context failed/);
  assert.throws(() => assertContext(context({ save: { data: { ...save(18), save_schema_version: 2 }, committed_turn: 18 } }), gameId), /context failed/);
  assert.throws(() => assertContext(context({ save: save(18), game: { id: '00000000-0000-4000-8000-000000000000', edition_id: 'company-v1' } }), gameId), /context failed/);
});

test('negative and non-integer committed turns fail', () => {
  assert.throws(() => assertContext(context({ save: save(-1) }), gameId), /context failed/);
  assert.throws(() => assertContext(context({ save: save(1.5) }), gameId), /context failed/);
});

test('missing and invalid game IDs fail closed before fetch', () => {
  assert.throws(() => requiredGameId(), error => error.code === 'missing_game_id');
  assert.throws(() => requiredGameId('not-a-uuid'), error => error.code === 'invalid_game_id');
});

test('CLI missing game ID fails before any network request', async () => {
  let fetchCalls = 0;
  await assert.rejects(
    () => main(['node', 'smoke-api-worker.mjs', 'https://worker.test'], async () => {
      fetchCalls += 1;
      throw new Error('network must not be reached');
    }),
    error => error.code === 'missing_game_id'
  );
  assert.equal(fetchCalls, 0);
});

test('smoke requires health, version, context, and explicit game ID', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/health') || url.endsWith('/api/version')) {
      return new Response(JSON.stringify({ ok: true, edition_id: 'company-v1', phase: 'phase-2-vertical-loop' }), { status: 200 });
    }
    return new Response(JSON.stringify(context({ save: { data: save(18), committed_turn: 18 } })), { status: 200 });
  };
  await runSmoke('https://worker.test', gameId, fetchImpl);
  assert.deepEqual(calls.map(call => new URL(call.url).pathname), ['/health', '/api/version', '/api/context']);
  assert.deepEqual(JSON.parse(calls[2].options.body), { game_id: gameId, recent_turns: 1 });
});

test('smoke source does not contain the protected sentinel fixture', () => {
  const source = fs.readFileSync(new URL('../scripts/smoke-api-worker.mjs', import.meta.url), 'utf8');
  assert.equal(source.includes('11111111-1111-4111-8111-111111111111'), false);
});
