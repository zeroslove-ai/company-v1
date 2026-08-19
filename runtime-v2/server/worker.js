import { companyV2Content } from '../domain/content.js';
import { boundedSummary, assertExpectedTurn, clone, reduceObservation, requireLiteralAction } from '../domain/contracts.js';
import { openingStory, parseStoryBlocks } from '../domain/story.js';
import { body, errorResponse, json, sse, V2HttpError } from './http.js';
import { createDeterministicProvider } from './provider.js';
import { InMemoryV2Store, summarizeJob } from './store.js';

export function createV2Worker({ store = new InMemoryV2Store({ content: companyV2Content }), provider = createDeterministicProvider(), content = companyV2Content } = {}) {
  return {
    store,
    async fetch(request) {
      try {
        const url = new URL(request.url);
        if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
        if (request.method === 'GET' && url.pathname === '/api/v2/context') return json(store.context(requiredQuery(url, 'game_id')));
        if (request.method === 'POST' && url.pathname === '/api/v2/setup') {
          const input = await body(request);
          return json(store.createGame({ playerName: String(input.player_name ?? '플레이어') }));
        }
        if (request.method === 'POST' && url.pathname === '/api/v2/opening') return json(await opening(store, provider, content, await body(request)));
        if (request.method === 'POST' && url.pathname === '/api/v2/turn') return turnResponse(request, store, provider, content);
        throw new V2HttpError(404, 'not_found', 'Company v2 route not found');
      } catch (error) { return errorResponse(error); }
    }
  };
}

async function opening(store, provider, content, input) {
  const gameId = String(input.game_id ?? '');
  const context = store.context(gameId);
  if (context.state.committed_turn > 0 || context.turns.length > 0) return context;
  const storyText = (provider.opening ?? openingStory)({ playerName: context.state.state.player.name });
  const parsed = parseWith(provider, storyText, content);
  const summary = boundedSummary(parsed.displayText, '회사 로비에서 첫 업무를 시작한다.');
  store.createOpening(gameId, { storyText: parsed.displayText, parsedBlocks: parsed.blocks, choices: parsed.choices, summary });
  return store.context(gameId);
}

function turnResponse(request, store, provider, content) {
  return body(request).then((input) => {
    const gameId = String(input.game_id ?? '');
    const actionId = String(input.action_id ?? '');
    const literalAction = requireLiteralAction(input.literal_action);
    if (!actionId) throw new V2HttpError(400, 'action_id_required', 'action_id is required');
    const context = store.context(gameId);
    const existingJob = Number.isInteger(input.expected_turn) ? store.getJob(gameId, input.expected_turn) : null;
    if (existingJob) return json({ status: existingJob.status, reconnect: true, job: summarizeJob(existingJob), context: existingJob.status === 'committed' ? store.context(gameId) : undefined });
    assertExpectedTurn({ expectedTurn: input.expected_turn, committedTurn: context.state.committed_turn });
    const { job, created } = store.reserveTurn({ gameId, turnNumber: input.expected_turn, actionId, literalAction });
    if (!created) return json({ status: job.status, reconnect: true, job: summarizeJob(job), context: job.status === 'committed' ? store.context(gameId) : undefined });
    return streamTurn({ request, store, provider, content, gameId, job });
  }).catch(errorResponse);
}

function streamTurn({ request, store, provider, content, gameId, job }) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      if (job.running) return;
      job.running = true;
      void processTurn({ request, store, provider, content, gameId, job, emit: (name, data) => controller.enqueue(encoder.encode(sse(name, data))) })
        .then(() => controller.close(), (error) => { controller.enqueue(encoder.encode(sse('terminal', { status: 'failed', error_code: error.message }))); controller.close(); });
    }
  });
  return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache', 'access-control-allow-origin': '*' } });
}

async function processTurn({ store, provider, content, gameId, job, emit }) {
  const before = store.context(gameId);
  let storyText = '';
  try {
    for await (const delta of provider.story({ literalAction: job.literal_action, playerName: before.state.state.player.name, context: before })) {
      const text = String(delta);
      storyText += text;
      emit('story_delta', { text });
    }
    const parsed = parseWith(provider, storyText, content);
    let observation = {};
    try {
      observation = await provider.observe({ literalAction: job.literal_action, storyText: parsed.displayText, context: before });
    } catch {
      // Observation is optional. A valid Story still commits with safe state.
      observation = {};
    }
    const targetIds = parsed.blocks.filter((block) => block.type === 'dialogue').map((block) => block.speaker_id);
    const reduced = reduceObservation({ state: before.state.state, observation: observation ?? {}, storyText: parsed.displayText, content, targetIds });
    const summary = boundedSummary(parsed.displayText, observation?.turn_summary);
    const context = store.commitTurn({ gameId, turnNumber: job.turn_number, expectedRevision: before.state.revision, storyText: parsed.displayText, parsedBlocks: parsed.blocks, choices: parsed.choices, summary, mindMonitor: reduced.mindMonitor, stateAfter: reduced.state });
    emit('terminal', { status: 'committed', context });
  } catch (error) {
    const context = store.failJob(gameId, job.turn_number, error.message || 'turn_failed');
    emit('terminal', { status: 'failed', error_code: error.message || 'turn_failed', context });
  }
}

function requiredQuery(url, name) {
  const value = url.searchParams.get(name);
  if (!value) throw new V2HttpError(400, `${name}_required`, `${name} is required`);
  return value;
}

function parseWith(provider, storyText, content) {
  return provider.parse ? provider.parse(storyText, content) : parseStoryBlocks(storyText, { content });
}

export default createV2Worker();
