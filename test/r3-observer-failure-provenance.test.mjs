import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { createR3Worker } from '../runtime-r3/server/worker.js';
import { createDeterministicR3Provider, createR3Provider, R3_OBSERVER_FAILURE_CODES } from '../runtime-r3/server/provider.js';
import { InMemoryR3Store } from '../runtime-r3/server/store.js';

const content = loadCanonicalCompanyR3Content();
const GAME_ACCESS_SECRET = 'r3-observer-provenance-test-secret';
const profile = {
  name: 'R3 Player', department_id: content.departments[0].department_id, position_id: content.positions[0].position_id,
  age: 28, height_cm: 178, weight_kg: 72, penis_length_cm: 16,
  body_type_id: content.bodyTypes[0].body_type_id, speech_style_id: content.speechStyles[0].speech_style_id
};

function observerProvider(fetchImpl, timeouts = {}) {
  return createR3Provider({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'key', STORY_MODEL: 'story', EXTRACT_MODEL: 'observer' },
    fetchImpl, timeouts
  });
}

function observerResponse(content, status = 200, { finish_reason, completion_tokens } = {}) {
  return new Response(JSON.stringify({ choices: [{ message: { content }, ...(finish_reason === undefined ? {} : { finish_reason }) }], ...(completion_tokens === undefined ? {} : { usage: { completion_tokens } }) }), { status });
}

function countedProvider(fetchImpl, timeouts = {}) {
  let calls = 0;
  return {
    provider: observerProvider(async (...args) => { calls += 1; return fetchImpl(...args); }, timeouts),
    calls: () => calls
  };
}

async function observerError(provider) {
  try {
    await provider.observe({ context: {}, literalAction: '현재 장면을 확인한다.', storyText: '현재 장면이다.', content });
    assert.fail('Observer should fail');
  } catch (error) {
    return error;
  }
}

test('Observer provider maps every bounded failure to a stable sanitized code without retry', async () => {
  const cases = [
    ['timeout', 'r3_observer_timeout', countedProvider(async (_url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })), { observerMs: 5 })],
    ['non-2xx', 'r3_observer_provider_http', countedProvider(async () => observerResponse('provider failure', 502))],
    ['response JSON invalid', 'r3_observer_response_json_invalid', countedProvider(async () => new Response('{not-json', { status: 200 }))],
    ['message missing', 'r3_observer_message_missing', countedProvider(async () => new Response(JSON.stringify({ choices: [{ message: {} }] }), { status: 200 }))],
    ['Observer JSON invalid', 'r3_observer_json_invalid', countedProvider(async () => observerResponse('{not-json'))],
    ['unknown', 'r3_observer_unknown', countedProvider(async () => { throw new Error('sensitive provider detail'); })]
  ];
  for (const [label, expectedCode, counted] of cases) {
    const error = await observerError(counted.provider);
    assert.equal(error.code, expectedCode, label);
    assert.equal(error.message, expectedCode, label);
    assert.doesNotMatch(error.message, /sensitive|502|not-json/i, label);
    assert.ok(R3_OBSERVER_FAILURE_CODES.includes(error.code), label);
    assert.equal(counted.calls(), 1, `${label} must not retry Observer`);
  }
});

test('Observer JSON-invalid evidence preserves only an allowlisted finish class and bounded completion tokens', async () => {
  const cases = [
    ['length', 'r3_observer_finish_length', observerResponse('{not-json', 200, { finish_reason: 'length', completion_tokens: 1600 })],
    ['stop', 'r3_observer_finish_stop', observerResponse('{not-json', 200, { finish_reason: 'stop', completion_tokens: 1599 })],
    ['missing', 'r3_observer_finish_unknown', observerResponse('{not-json')],
    ['unexpected', 'r3_observer_finish_other', observerResponse('{not-json', 200, { finish_reason: 'content_filter', completion_tokens: 2_000_001 })]
  ];
  for (const [label, warning, response] of cases) {
    const error = await observerError(observerProvider(async () => response.clone()));
    assert.equal(error.code, 'r3_observer_json_invalid', label);
    assert.equal(error.observerFinishClass, warning.replace('r3_observer_finish_', ''), label);
    assert.equal(error.observerCompletionTokens, label === 'length' ? 1600 : label === 'stop' ? 1599 : null, label);
  }
});

test('successful Observer output is unchanged and performs one call', async () => {
  let calls = 0;
  const expected = { elapsed_minutes: 2, choices: ['one', 'two', 'three', 'four'], scene_note: 'current' };
  const provider = observerProvider(async () => { calls += 1; return observerResponse(JSON.stringify(expected)); });
  const result = await provider.observe({ context: {}, literalAction: '장면을 살핀다.', storyText: '현재 장면이다.', content });
  assert.deepEqual(result, expected);
  assert.equal(calls, 1);
});

test('worker fail-open persists sanitized Observer provenance while committing Story choices', async () => {
  const base = createDeterministicR3Provider();
  const provider = { story: base.story, async observe() { throw new Error('private raw provider failure'); } };
  const store = new InMemoryR3Store();
  const worker = createR3Worker({ store, provider, content, gameAccessSecret: GAME_ACCESS_SECRET });
  const created = await worker.fetch(new Request('https://r3.test/api/r3/games', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profile }) }));
  const createdPayload = await created.json();
  assert.equal(createdPayload.ok, true, JSON.stringify(createdPayload));
  const gameId = createdPayload.data.game.game_id;
  worker.gameCapabilities ??= new Map();
  worker.gameCapabilities.set(gameId, createdPayload.data.game_capability);
  const openingResponse = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/opening`, { method: 'POST', headers: { authorization: `Bearer ${createdPayload.data.game_capability}` } }));
  const openingText = await openingResponse.text();
  const openingTerminal = JSON.parse(openingText.match(/event: terminal\ndata: ([^\n]+)/)?.[1]);
  assert.equal(openingTerminal.status, 'committed');
  const openingWarnings = openingTerminal.context.turns[0].warnings;
  assert.ok(openingWarnings.includes('observer_failed'));
  assert.ok(openingWarnings.includes('r3_observer_unknown'));
  assert.ok(openingWarnings.every(value => !String(value).includes('private raw')));
  assert.equal(openingTerminal.context.turns[0].choices.length, 4);
  const timingFailure = [...openingText.matchAll(/event: timing\ndata: ([^\n]+)/g)].map(match => JSON.parse(match[1])).find(item => item.stage === 'observer_failed');
  assert.equal(timingFailure.observer_error_code, 'r3_observer_unknown');
});

test('worker commits Story while persisting sanitized finish provenance for message JSON failure', async () => {
  const base = createDeterministicR3Provider();
  const provider = { story: base.story, async observe() { const error = new Error('r3_observer_json_invalid'); error.code = 'r3_observer_json_invalid'; error.observerFinishClass = 'length'; error.observerCompletionTokens = 1600; throw error; } };
  const store = new InMemoryR3Store();
  const worker = createR3Worker({ store, provider, content, gameAccessSecret: GAME_ACCESS_SECRET });
  const created = await worker.fetch(new Request('https://r3.test/api/r3/games', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profile }) }));
  const createdPayload = await created.json();
  const gameId = createdPayload.data.game.game_id;
  const openingResponse = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/opening`, { method: 'POST', headers: { authorization: `Bearer ${createdPayload.data.game_capability}` } }));
  const openingText = await openingResponse.text();
  const openingTerminal = JSON.parse(openingText.match(/event: terminal\ndata: ([^\n]+)/)?.[1]);
  assert.equal(openingTerminal.status, 'committed');
  const warnings = openingTerminal.context.turns[0].warnings;
  assert.deepEqual(warnings.slice(0, 3), ['observer_failed', 'r3_observer_json_invalid', 'r3_observer_finish_length']);
  assert.ok(warnings.every(value => !String(value).includes('1600')));
  const timingFailure = [...openingText.matchAll(/event: timing\ndata: ([^\n]+)/g)].map(match => JSON.parse(match[1])).find(item => item.stage === 'observer_failed');
  assert.deepEqual(timingFailure, { stage: 'observer_failed', elapsed_ms: timingFailure.elapsed_ms, observer_error_code: 'r3_observer_json_invalid', observer_finish_warning: 'r3_observer_finish_length', observer_completion_tokens: 1600 });
});
