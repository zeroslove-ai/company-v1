import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { consumeR3Sse } from '../frontend-r3/r3-client.js';
import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { createInitialState } from '../runtime-r3/domain/contracts.js';
import { createR3Provider } from '../runtime-r3/server/provider.js';

const content = loadCanonicalCompanyR3Content();
const context = { state: { state: createInitialState({ name: 'Player' }, content.locations[0].location_id) }, turns: [] };

function sseResponse(frames) {
  return new Response(frames.map(frame => `event: ${frame.event}\ndata: ${JSON.stringify(frame.data)}\n\n`).join(''), { headers: { 'content-type': 'text/event-stream' } });
}

function delayedStoryResponse(chunks) {
  const timers = []; let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) timers.push(setTimeout(() => { if (!cancelled) controller.enqueue(new TextEncoder().encode(chunk.text)); }, chunk.afterMs));
      timers.push(setTimeout(() => { if (!cancelled) controller.close(); }, Math.max(...chunks.map(chunk => chunk.afterMs)) + 1));
    },
    cancel() { cancelled = true; timers.forEach(clearTimeout); }
  });
  return new Response(stream, { headers: { 'content-type': 'text/event-stream' } });
}

function storyChunk(text) { return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`; }

function neverEndingTerminalResponse() {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('event: terminal\ndata: {"status":"committed","context":{"ok":true}}\n\n'));
    },
    cancel() { cancelled = true; }
  });
  return { response: new Response(stream, { headers: { 'content-type': 'text/event-stream' } }), wasCancelled: () => cancelled };
}

test('R3 SSE resolves at a valid terminal without waiting for EOF and delivers it once', async () => {
  const source = neverEndingTerminalResponse(); const seen = [];
  const terminal = await consumeR3Sse(source.response, (event, data) => seen.push({ event, data }));
  assert.equal(terminal.status, 'committed');
  assert.equal(seen.length, 1);
  assert.equal(seen[0].event, 'terminal');
  assert.equal(source.wasCancelled(), true);
});

test('R3 SSE requires exactly one committed terminal before success', async () => {
  const seen = [];
  const terminal = await consumeR3Sse(sseResponse([{ event: 'story_delta', data: { text: '스트림' } }, { event: 'terminal', data: { status: 'committed', context: { ok: true } } }]), (event, data) => seen.push({ event, data }));
  assert.equal(terminal.status, 'committed');
  assert.equal(seen.at(-1).event, 'terminal');
});

test('R3 SSE failed terminal is never success and EOF without terminal requires readback', async () => {
  await assert.rejects(() => consumeR3Sse(sseResponse([{ event: 'terminal', data: { status: 'failed', error_code: 'r3_failed' } }]), () => {}), error => error.code === 'r3_stream_failed');
  const seen = [];
  await assert.rejects(() => consumeR3Sse(sseResponse([{ event: 'story_delta', data: { text: '유지할 Story' } }]), (event, data) => seen.push({ event, data })), error => error.code === 'r3_stream_reconnect_required');
  assert.equal(seen[0].data.text, '유지할 Story');
});

test('R3 SSE completes at the first valid terminal and rejects malformed terminal framing', async () => {
  const seen = [];
  const terminal = await consumeR3Sse(sseResponse([{ event: 'terminal', data: { status: 'committed' } }, { event: 'terminal', data: { status: 'committed' } }]), (event, data) => seen.push({ event, data }));
  assert.equal(terminal.status, 'committed');
  assert.equal(seen.length, 1);
  await assert.rejects(() => consumeR3Sse(sseResponse([{ event: 'terminal', data: { status: 'processing' } }]), () => {}), error => error.code === 'r3_stream_terminal_invalid');
});

test('R3 frontend only reaches saved status after consumeR3Sse success', async () => {
  const app = await readFile(new URL('../frontend-r3/app.js', import.meta.url), 'utf8');
  assert.match(app, /const turnResponse = await client\.turn[\s\S]*await consumeR3Sse\(turnResponse, handleEvent\)[\s\S]*setStatus\('저장되었습니다\.'/);
  assert.match(app, /!turnResponse\.ok \|\| !turnResponse\.body[\s\S]*r3_stream_reconnect_required/);
});

test('R3 deployment boundary resolves the reviewed entrypoint and isolated configs', async () => {
  const apiConfig = JSON.parse(await readFile(new URL('../wrangler.r3.api.jsonc', import.meta.url), 'utf8'));
  const frontendConfig = JSON.parse(await readFile(new URL('../wrangler.r3.frontend.jsonc', import.meta.url), 'utf8'));
  const entry = await readFile(new URL('../runtime-r3/worker-entry.js', import.meta.url), 'utf8');
  assert.deepEqual({ name: apiConfig.name, main: apiConfig.main }, { name: 'game-proxy-company-r3', main: 'runtime-r3/worker-entry.js' });
  assert.deepEqual({ name: frontendConfig.name, directory: frontendConfig.assets.directory }, { name: 'gamebuilder-company-r3', directory: 'frontend-r3' });
  assert.match(entry, /createProductionR3Worker/);
  assert.match(entry, /export default/);
  const { default: worker } = await import('../runtime-r3/worker-entry.js');
  const response = await worker.fetch(new Request('https://r3.test/api/r3/catalogs', { headers: { 'x-r3-request-id': 'r3-test-correlation' } }), {
    SUPABASE_URL: 'https://db.test',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    LLM_API_URL: 'https://llm.test',
    LLM_API_KEY: 'llm-key',
    STORY_MODEL: 'story-test',
    EXTRACT_MODEL: 'extract-test',
    R3_GAME_ACCESS_SECRET: 'r3-test-secret'
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-r3-request-id'), 'r3-test-correlation');
  const payload = await response.json();
  assert.equal(Array.isArray(payload.data.departments), true);
});

test('R3 Story first-content deadline clears after first delta and total deadline remains active', async () => {
  let calls = 0;
  const provider = createR3Provider({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'key', STORY_MODEL: 'story', EXTRACT_MODEL: 'observer' },
    timeouts: { storyFirstContentMs: 10, storyTotalMs: 80 },
    fetchImpl: async () => { calls += 1; return delayedStoryResponse([{ afterMs: 5, text: storyChunk('첫 내용') }, { afterMs: 25, text: storyChunk('이어지는 내용') }]); }
  });
  let text = '';
  for await (const delta of provider.story({ context, content, literalAction: '행동' })) text += delta;
  assert.equal(text, '첫 내용이어지는 내용');
  assert.equal(calls, 1);
});

test('R3 provider exposes response and first-delta timing hooks without changing Story output', async () => {
  const seen = [];
  const provider = createR3Provider({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'key', STORY_MODEL: 'story', EXTRACT_MODEL: 'observer' },
    timeouts: { storyFirstContentMs: 40, storyTotalMs: 80 },
    fetchImpl: async () => delayedStoryResponse([{ afterMs: 5, text: storyChunk('첫 내용') }])
  });
  let text = '';
  for await (const delta of provider.story({ context, content, onTiming: stage => seen.push(stage) })) text += delta;
  assert.equal(text, '첫 내용');
  assert.deepEqual(seen, ['story_response_headers', 'story_first_delta']);
});

test('R3 Story first-content and total deadlines fail without retry', async () => {
  let calls = 0;
  const firstTimeoutProvider = createR3Provider({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'key', STORY_MODEL: 'story', EXTRACT_MODEL: 'observer' },
    timeouts: { storyFirstContentMs: 10, storyTotalMs: 80 },
    fetchImpl: async () => { calls += 1; return delayedStoryResponse([{ afterMs: 30, text: storyChunk('늦은 내용') }]); }
  });
  await assert.rejects(async () => { for await (const _ of firstTimeoutProvider.story({ context, content })) {} }, error => error.code === 'r3_story_first_content_timeout');
  const totalTimeoutProvider = createR3Provider({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'key', STORY_MODEL: 'story', EXTRACT_MODEL: 'observer' },
    timeouts: { storyFirstContentMs: 10, storyTotalMs: 20 },
    fetchImpl: async () => { calls += 1; return delayedStoryResponse([{ afterMs: 5, text: storyChunk('첫 내용') }, { afterMs: 30, text: storyChunk('늦은 내용') }]); }
  });
  await assert.rejects(async () => { for await (const _ of totalTimeoutProvider.story({ context, content })) {} }, error => error.code === 'r3_story_timeout');
  assert.equal(calls, 2);
});
