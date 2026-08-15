/**
 * Canonical SSE decoder for Company v1 live-acceptance tooling.
 *
 * This is deliberately transport-only. It does not interpret Story semantics;
 * it only turns Worker event/data frames into observable events and reports
 * malformed/non-SSE responses as harness decode failures.
 */

export class SseDecodeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SseDecodeError';
    this.code = code;
  }
}

export function parseSseEntry(entry, atMs = 0) {
  const text = String(entry ?? '');
  if (!text.trim()) return null;

  const lines = text.split(/\r?\n/);
  const eventLine = lines.find(line => line.startsWith('event:'));
  const dataLines = lines.filter(line => line.startsWith('data:'));
  if (!eventLine && dataLines.length === 0) return null;
  if (!eventLine || dataLines.length === 0) {
    throw new SseDecodeError('SSE_FRAME_INVALID', 'SSE frame must contain event and data fields');
  }

  const data = dataLines.map(line => line.slice(5).trim()).join('\n');
  try {
    return { name: eventLine.slice(6).trim(), data: JSON.parse(data), at_ms: atMs };
  } catch {
    throw new SseDecodeError('SSE_INVALID_JSON_DATA', 'SSE data field is not valid JSON');
  }
}

export function parseSseEvents(text, startedAt = Date.now()) {
  const source = String(text ?? '');
  const events = source.split(/\r?\n\r?\n/)
    .map(entry => parseSseEntry(entry, Date.now() - startedAt))
    .filter(Boolean);
  if (source.trim() && events.length === 0) {
    throw new SseDecodeError('SSE_NON_SSE_BODY', 'response body contained no SSE event frames');
  }
  return events;
}

export function createSseStreamDecoder({ startedAt = Date.now(), now = Date.now } = {}) {
  let buffer = '';
  let sawNonEmptyInput = false;
  let eventCount = 0;

  function consume(final = false) {
    if (final) {
      const remainder = buffer;
      buffer = '';
      if (!remainder.trim()) return [];
      const event = parseSseEntry(remainder, now() - startedAt);
      if (!event) {
        throw new SseDecodeError('SSE_FRAME_INCOMPLETE', 'SSE response ended with an incomplete frame');
      }
      eventCount += 1;
      return [event];
    }

    const entries = buffer.split(/\r?\n\r?\n/);
    buffer = entries.pop() ?? '';

    const parsed = [];
    for (const entry of entries) {
      if (!entry.trim()) continue;
      const event = parseSseEntry(entry, now() - startedAt);
      if (event) {
        parsed.push(event);
        eventCount += 1;
      }
    }
    return parsed;
  }

  return {
    push(chunk) {
      const text = String(chunk ?? '');
      if (text) {
        sawNonEmptyInput = true;
        buffer += text;
      }
      return consume(false);
    },
    finish() {
      const parsed = consume(true);
      if (sawNonEmptyInput && eventCount === 0) {
        throw new SseDecodeError('SSE_NON_SSE_BODY', 'response body contained no SSE event frames');
      }
      return parsed;
    }
  };
}
