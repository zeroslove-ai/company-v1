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

test('SSE consumer accepts structured Story protocol events without exposing wire markers as deltas', async () => {
  const seen = [];
  await consumeStorySse(new Response(stream([
    'event: meta\ndata: {}\n\n',
    'event: section_start\ndata: {"section":1}\n\n',
    'event: block_start\ndata: {"block_type":"dialogue","speaker_id":"heroine2","speaker_name":"윤민아","acting_direction":"당황하며"}\n\n',
    'event: delta\ndata: {"text":"네."}\n\n',
    'event: complete\ndata: {}\n\n'
  ])), item => seen.push(item));
  assert.equal(seen.some(item => item.event === 'block_start' && item.data.speaker_id === 'heroine2'), true);
  assert.equal(seen.some(item => item.event === 'delta' && /DIALOGUE|speaker_id/.test(item.data.text)), false);
});
