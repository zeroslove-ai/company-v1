import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileTurnTransport } from '../frontend-r3/turn-transport.js';

function context({ committedTurn = 1, turns = [], job = null } = {}) {
  return { state: { committed_turn: committedTurn }, turns, job };
}

function harness(readContext) {
  const calls = { context: 0, cleared: 0, statuses: [], rendered: 0, recovered: 0 };
  const client = { context: async () => { calls.context += 1; return readContext(); } };
  return {
    calls,
    client,
    renderContext: () => { calls.rendered += 1; },
    recoverPendingTurn: async () => { calls.recovered += 1; },
    clearLiteral: () => { calls.cleared += 1; },
    setStatus: (message, error) => calls.statuses.push({ message, error })
  };
}

const literal = '회의실로 이동해 창가 자리에 앉는다.';

test('transport failure with no server footprint reads context once and preserves literal', async () => {
  const h = harness(() => context());
  const result = await reconcileTurnTransport({ ...h, gameId: 'g1', expectedTurn: 2, literalAction: literal, originalError: new TypeError('Failed to fetch') });
  assert.equal(result.kind, 'not_sent');
  assert.equal(h.calls.context, 1);
  assert.equal(h.calls.cleared, 0);
  assert.equal(h.calls.recovered, 0);
  assert.match(h.calls.statuses[0].message, /전송되거나 저장되지 않았습니다/);
});

test('transport failure with exact committed literal renders canonical context and clears input', async () => {
  const h = harness(() => context({ committedTurn: 2, turns: [{ turn_number: 2, literal_action: literal }] }));
  const result = await reconcileTurnTransport({ ...h, gameId: 'g1', expectedTurn: 2, literalAction: literal, originalError: new Error('stream lost') });
  assert.equal(result.kind, 'committed');
  assert.equal(h.calls.context, 1);
  assert.equal(h.calls.cleared, 1);
  assert.equal(h.calls.recovered, 0);
});

test('transport failure with processing context uses existing recovery without another submission', async () => {
  const h = harness(() => context({ job: { status: 'processing' } }));
  const result = await reconcileTurnTransport({ ...h, gameId: 'g1', expectedTurn: 2, literalAction: literal, originalError: new Error('stream lost') });
  assert.equal(result.kind, 'processing');
  assert.equal(h.calls.context, 1);
  assert.equal(h.calls.recovered, 1);
  assert.equal(h.calls.cleared, 0);
});

test('transport failure with failed context preserves explicit retry-only state', async () => {
  const h = harness(() => context({ job: { status: 'failed', error_code: 'r3_story_failed' } }));
  const result = await reconcileTurnTransport({ ...h, gameId: 'g1', expectedTurn: 2, literalAction: literal, originalError: new Error('stream lost') });
  assert.equal(result.kind, 'failed');
  assert.equal(h.calls.context, 1);
  assert.equal(h.calls.cleared, 0);
  assert.deepEqual(h.calls.statuses[0], { message: '이번 장면을 저장하지 못했습니다. 입력을 확인한 뒤 한 번만 다시 시도해 주세요.', error: true });
});

test('context reconciliation failure keeps the original transport error and literal', async () => {
  const h = harness(() => { throw new Error('context unavailable'); });
  const result = await reconcileTurnTransport({ ...h, gameId: 'g1', expectedTurn: 2, literalAction: literal, originalError: new TypeError('Failed to fetch') });
  assert.equal(result.kind, 'unknown');
  assert.equal(h.calls.context, 1);
  assert.equal(h.calls.cleared, 0);
  assert.deepEqual(h.calls.statuses[0], { message: '서버 연결을 확인하지 못했습니다. 입력은 그대로 남아 있습니다.', error: true });
});
