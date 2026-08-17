import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SseDecodeError,
  createSseStreamDecoder,
  parseSseEntry,
  parseSseEvents
} from '../scripts/live-sse-decoder.mjs';

test('canonical decoder parses an LF-delimited complete event', () => {
  const events = parseSseEvents('event: complete\ndata: {"ok":true}\n\n');
  assert.deepEqual(events.map(event => event.name), ['complete']);
  assert.deepEqual(events[0].data, { ok: true });
});

test('canonical decoder parses a CRLF-delimited complete event', () => {
  const events = parseSseEvents('event: complete\r\ndata: {"ok":true}\r\n\r\n');
  assert.equal(events[0].name, 'complete');
  assert.deepEqual(events[0].data, { ok: true });
});

test('canonical decoder parses multiple events and multiple data lines', () => {
  const events = parseSseEvents([
    'event: meta',
    'data: {',
    'data: "action_id":"v5-action",',
    'data: "replayed":false',
    'data:}',
    '',
    'event: complete',
    'data: {"parsed_blocks":{"raw":"Story"}}',
    '',
    ''
  ].join('\n'));
  assert.deepEqual(events.map(event => event.name), ['meta', 'complete']);
  assert.deepEqual(events[0].data, { action_id: 'v5-action', replayed: false });
  assert.equal(events[1].data.parsed_blocks.raw, 'Story');
});

test('canonical decoder preserves a terminal error event as an observable Worker event', () => {
  const events = parseSseEvents('event: error\ndata: {"code":"story_failed","retryable":true}\n\n');
  assert.equal(events[0].name, 'error');
  assert.deepEqual(events[0].data, { code: 'story_failed', retryable: true });
});

test('malformed JSON is a harness decode failure, not a gameplay/provider error', () => {
  assert.throws(
    () => parseSseEvents('event: complete\ndata: {not-json}\n\n'),
    error => error instanceof SseDecodeError && error.code === 'SSE_INVALID_JSON_DATA'
  );
});

test('non-SSE response is classified as a harness decode failure', () => {
  assert.throws(
    () => parseSseEvents('{"ok":false,"error":"upstream"}'),
    error => error instanceof SseDecodeError && error.code === 'SSE_NON_SSE_BODY'
  );
});

test('chunk-safe decoder parses the V5-compatible meta/complete frame shape', () => {
  const decoder = createSseStreamDecoder({ startedAt: 0, now: () => 42 });
  const chunks = [
    'event: me',
    'ta\ndata: {"action_id":"v5-action","replayed":false}\n\n',
    'event: block_start\ndata: {"block_type":"narrative"}\n\n',
    'event: complete\ndata: {"parsed_blocks":{"raw":"[SCENE] Story"}}\n\n'
  ];
  const events = chunks.flatMap(chunk => decoder.push(chunk));
  events.push(...decoder.finish());
  assert.deepEqual(events.map(event => event.name), ['meta', 'block_start', 'complete']);
  assert.equal(events[0].data.action_id, 'v5-action');
  assert.equal(events[2].data.parsed_blocks.raw, '[SCENE] Story');
});

test('single-frame parser reports incomplete event/data structure', () => {
  assert.throws(
    () => parseSseEntry('event: complete\n', 0),
    error => error instanceof SseDecodeError && error.code === 'SSE_FRAME_INVALID'
  );
});
