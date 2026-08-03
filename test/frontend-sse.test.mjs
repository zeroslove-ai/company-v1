import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../src/frontend/pages/api.js';
import { consumeStorySse, parseSseFrames } from '../src/frontend/pages/sse.js';

function stream(chunks) {
  const encoder = new TextEncoder();
  return new ReadableStream({ start(controller) { chunks.forEach(chunk => controller.enqueue(encoder.encode(chunk))); controller.close(); } });
}

test('SSE parser handles frame boundaries and multiple events', async () => {
  const seen = [];
  await consumeStorySse(new Response(stream(['event: me', 'ta\ndata: {"replayed":false}\n\nevent: delta\ndata: {"text":"hello"}\n\n', 'event: complete\ndata: {}\n\n'])), item => seen.push(item));
  assert.deepEqual(seen.map(item => item.event), ['meta', 'delta', 'complete']);
  assert.equal(seen[1].data.text, 'hello');
  assert.deepEqual(parseSseFrames('event: delta\ndata: {"text":"x"}', { flush: true }).events[0].data, { text: 'x' });
});

test('SSE parser rejects malformed JSON and error events', async () => {
  assert.throws(() => parseSseFrames('event: delta\ndata: {bad}\n\n'), ApiError);
  await assert.rejects(() => consumeStorySse(new Response(stream(['event: error\ndata: {"code":"story_failed","message":"no"}\n\n'])), () => {}), error => error.code === 'story_failed');
});
