import { ApiError } from './api.js';

export function parseSseFrames(buffer, { flush = false } = {}) {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const frames = normalized.split('\n\n');
  const remainder = flush ? '' : frames.pop();
  const events = frames.filter(Boolean).map(frame => {
    const lines = frame.split('\n');
    const event = lines.find(line => line.startsWith('event:'))?.slice(6).trim() ?? 'message';
    const data = lines.filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\n');
    try { return { event, data: data ? JSON.parse(data) : null }; }
    catch { throw new ApiError({ endpoint: '/api/story', status: 502, code: 'invalid_sse_json', message: '서사 스트림 형식이 올바르지 않습니다.' }); }
  });
  return { events, remainder };
}

export async function consumeStorySse(response, onEvent) {
  if (!response.body) throw new ApiError({ endpoint: '/api/story', status: response.status, code: 'missing_sse_body', message: '서사 스트림이 비어 있습니다.' });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let sawComplete = false;
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const parsed = parseSseFrames(buffer, { flush: done });
    buffer = parsed.remainder;
    for (const item of parsed.events) {
      if (!['meta', 'delta', 'complete', 'error'].includes(item.event)) continue;
      if (item.event === 'error') throw new ApiError({ endpoint: '/api/story', status: 502, code: item.data?.code ?? 'story_failed', message: item.data?.message ?? '서사 생성에 실패했습니다.', retryable: Boolean(item.data?.retryable) });
      if (item.event === 'complete') sawComplete = true;
      onEvent(item);
    }
    if (done) break;
  }
  if (!sawComplete) throw new ApiError({ endpoint: '/api/story', status: 502, code: 'incomplete_story_stream', message: '서사 스트림이 완료되지 않았습니다.', retryable: true });
}
