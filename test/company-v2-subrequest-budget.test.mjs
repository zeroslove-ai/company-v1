import test from 'node:test';
import assert from 'node:assert/strict';
import { createContentAdapter } from '../runtime-v2/domain/content.js';
import { createV2Worker } from '../runtime-v2/server/worker.js';
import { InMemoryV2Store, createInMemoryPersistence } from '../runtime-v2/server/store.js';

const content = createContentAdapter();
const SUBREQUEST_LIMIT = 50;

function createBudget({ providerCalls = true } = {}) {
  const base = new InMemoryV2Store({ content });
  const counts = { total: 0, store: {}, provider: 0 };
  const storeWeights = { context: 5, getJob: 2, reserveTurn: 1, updateProgress: 1, commitTurn: 6, failJob: 6 };
  const charge = (units, label) => {
    counts.total += units;
    if (label.startsWith('provider')) counts.provider += 1;
    else counts.store[label] = (counts.store[label] ?? 0) + 1;
    if (counts.total > SUBREQUEST_LIMIT) throw new Error('subrequest_budget_exceeded');
  };
  const store = new Proxy(base, {
    get(target, key) {
      const value = target[key];
      if (typeof value !== 'function' || !(key in storeWeights)) return value;
      return (...args) => { charge(storeWeights[key], key); return value.apply(target, args); };
    }
  });
  const providerCharge = () => { if (providerCalls) charge(1, 'provider_request'); };
  return { base, store, counts, providerCharge, reset: () => { counts.total = 0; counts.store = {}; counts.provider = 0; } };
}

function longStoryChunks(count = 120) {
  return Array.from({ length: count }, (_, index) => index === 0 ? '[NARRATIVE]\nchunk-000 ' : `chunk-${String(index).padStart(3, '0')} `);
}

function providerFor(chunks, budget, { failAfter = null } = {}) {
  return {
    async *story() {
      budget.providerCharge();
      for (const [index, chunk] of chunks.entries()) {
        yield chunk;
        if (failAfter !== null && index + 1 === failAfter) throw new Error('late_story_failure');
      }
    },
    async observe() {
      budget.providerCharge();
      return { turn_summary: 'long story completed' };
    }
  };
}

async function createOpenedGame(worker, reset = () => {}) {
  const setup = await worker.fetch(new Request('https://v2.test/api/v2/setup', { method: 'POST', body: JSON.stringify({ player_name: 'budget test' }) }));
  const gameId = (await setup.json()).data.game.game_id;
  await worker.fetch(new Request('https://v2.test/api/v2/opening', { method: 'POST', body: JSON.stringify({ game_id: gameId }) }));
  reset();
  return gameId;
}

function turnRequest(gameId, actionId = crypto.randomUUID()) {
  return new Request('https://v2.test/api/v2/turn', { method: 'POST', body: JSON.stringify({ game_id: gameId, action_id: actionId, expected_turn: 1, retry_failed: false, literal_action: 'long story budget action' }) });
}

function parseSse(text) {
  return text.trim().split('\n\n').filter(Boolean).map((block) => {
    const event = block.match(/^event: (.+)$/m)?.[1];
    const data = JSON.parse(block.match(/^data: (.+)$/m)?.[1] ?? '{}');
    return { event, data };
  });
}

test('100+ Story deltas stream in order, commit once, and stay under 50 subrequests', async () => {
  const budget = createBudget();
  const chunks = longStoryChunks();
  const worker = createV2Worker({ content, store: budget.store, provider: providerFor(chunks, budget) });
  const gameId = await createOpenedGame(worker, budget.reset);
  const response = await worker.fetch(turnRequest(gameId));
  const events = parseSse(await response.text());
  const story = events.filter(({ event }) => event === 'story_delta').map(({ data }) => data.text);
  const terminals = events.filter(({ event }) => event === 'terminal');
  const job = budget.base.getJob(gameId, 1);

  assert.equal(story.length, chunks.length);
  assert.deepEqual(story, chunks);
  assert.equal(terminals.length, 1);
  assert.equal(terminals[0].data.status, 'committed');
  assert.equal(budget.counts.store.updateProgress ?? 0, 4);
  assert.equal(budget.counts.total, 25);
  assert.ok(budget.counts.total <= SUBREQUEST_LIMIT);
  assert.equal(job.status, 'committed');
  assert.equal(job.attempt_no, 1);
  assert.equal(budget.base.turns.size, 2);
});

test('100+ Story deltas late-fail through the canonical failed state under 50 subrequests', async () => {
  const budget = createBudget();
  const chunks = longStoryChunks();
  const worker = createV2Worker({ content, store: budget.store, provider: providerFor(chunks, budget, { failAfter: chunks.length }) });
  const gameId = await createOpenedGame(worker, budget.reset);
  const response = await worker.fetch(turnRequest(gameId));
  const events = parseSse(await response.text());
  const story = events.filter(({ event }) => event === 'story_delta').map(({ data }) => data.text);
  const terminals = events.filter(({ event }) => event === 'terminal');
  const job = budget.base.getJob(gameId, 1);

  assert.deepEqual(story, chunks);
  assert.equal(terminals.length, 1);
  assert.equal(terminals[0].data.status, 'failed');
  assert.equal(terminals[0].data.error_code, 'late_story_failure');
  assert.equal(budget.counts.store.updateProgress ?? 0, 3);
  assert.equal(budget.counts.total, 23);
  assert.ok(budget.counts.total <= SUBREQUEST_LIMIT);
  assert.equal(job.status, 'failed');
  assert.equal(job.error_code, 'late_story_failure');
  assert.equal(job.attempt_no, 1);
  assert.equal(budget.base.turns.size, 1);
});

test('reconstructed Worker sees non-empty durable partial progress before Story completion', async () => {
  let release;
  const persistence = createInMemoryPersistence();
  const base = new InMemoryV2Store({ content, persistence });
  const provider = {
    async *story() {
      yield '[NARRATIVE]\npartial reconnect story';
      await new Promise((resolve) => { release = resolve; });
      yield '\ncompletion';
    },
    async observe() { return { turn_summary: 'reconnected' }; }
  };
  const worker1 = createV2Worker({ content, store: base, provider });
  const gameId = await createOpenedGame(worker1);
  const first = await worker1.fetch(turnRequest(gameId));
  for (let i = 0; i < 50 && !release; i += 1) await new Promise((resolve) => setTimeout(resolve, 2));
  assert.equal(typeof release, 'function');
  const worker2 = createV2Worker({ content, store: new InMemoryV2Store({ content, persistence }), provider });
  const context = (await (await worker2.fetch(new Request(`https://v2.test/api/v2/context?game_id=${gameId}`))).json()).data;
  assert.equal(context.job.status, 'processing');
  assert.match(context.job.story_text, /partial reconnect story/);
  release();
  await first.text();
  assert.equal(worker2.store.context(gameId).state.committed_turn, 1);
});
