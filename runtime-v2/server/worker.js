import { companyV2Content } from '../domain/content.js';
import { boundedSummary, assertExpectedTurn, reduceObservation, requireLiteralAction } from '../domain/contracts.js';
import { openingStory, parseStoryBlocks } from '../domain/story.js';
import { body, errorResponse, json, sse, V2HttpError } from './http.js';
import { createV2Provider } from './provider.js';
import { SupabaseV2Store, V2ConfigurationError } from './supabase-store.js';
import { summarizeJob } from './store.js';

export function createV2Worker({ store, provider, content = companyV2Content, env, fetchImpl = fetch } = {}) {
  const resolvedStore = store ?? (env ? new SupabaseV2Store({ env, fetchImpl }) : null);
  const resolvedProvider = provider ?? (env ? createV2Provider({ env, fetchImpl, content }) : null);
  if (!resolvedStore || !resolvedProvider) throw new V2ConfigurationError('Company v2 production worker requires env-backed store/provider; inject both explicitly only in tests');
  return {
    store: resolvedStore,
    provider: resolvedProvider,
    async fetch(request) {
      try {
        const url = new URL(request.url);
        if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
        if (request.method === 'GET' && url.pathname === '/api/v2/context') return json(await resolvedStore.context(requiredQuery(url, 'game_id')));
        if (request.method === 'POST' && url.pathname === '/api/v2/setup') {
          const input = await body(request);
          return json(await resolvedStore.createGame({ playerName: String(input.player_name ?? 'Player') }));
        }
        if (request.method === 'POST' && url.pathname === '/api/v2/opening') return json(await opening(resolvedStore, resolvedProvider, content, await body(request)));
        if (request.method === 'POST' && url.pathname === '/api/v2/turn') return await turnResponse(request, resolvedStore, resolvedProvider, content);
        throw new V2HttpError(404, 'not_found', 'Company v2 route not found');
      } catch (error) { return errorResponse(error); }
    }
  };
}

export function createProductionV2Worker({ env, fetchImpl = fetch } = {}) {
  return createV2Worker({ env, fetchImpl });
}

async function opening(store, provider, content, input) {
  const gameId = String(input.game_id ?? '');
  const context = await store.context(gameId);
  if (context.state.committed_turn > 0 || context.turns.length > 0) return context;
  const storyText = (provider.opening ?? openingStory)({ playerName: context.state.state.player.name });
  const parsed = parseWith(provider, storyText, content);
  const summary = boundedSummary(parsed.displayText, 'Opening begins the Company v2 story.');
  await store.createOpening(gameId, { storyText: parsed.displayText, parsedBlocks: parsed.blocks, choices: parsed.choices, summary });
  return store.context(gameId);
}

async function turnResponse(request, store, provider, content) {
  try {
    const input = await body(request);
    const gameId = String(input.game_id ?? '');
    const actionId = String(input.action_id ?? '');
    const literalAction = requireLiteralAction(input.literal_action);
    if (!actionId) throw new V2HttpError(400, 'action_id_required', 'action_id is required');
    const context = await store.context(gameId);
    const existingJob = Number.isInteger(input.expected_turn) ? await store.getJob(gameId, input.expected_turn) : null;
    const explicitRetry = input.retry_failed === true;
    if (existingJob && !(existingJob.status === 'failed' && explicitRetry)) {
      return json({ status: existingJob.status, reconnect: true, progress_story_text: existingJob.story_text, job: summarizeJob(existingJob), context: existingJob.status === 'committed' ? await store.context(gameId) : undefined });
    }
    assertExpectedTurn({ expectedTurn: input.expected_turn, committedTurn: context.state.committed_turn });
    const reservation = await store.reserveTurn({ gameId, turnNumber: input.expected_turn, actionId, literalAction, retryFailed: explicitRetry });
    const { job, created } = reservation;
    if (!created) return json({ status: job.status, reconnect: true, progress_story_text: job.story_text, job: summarizeJob(job), context: job.status === 'committed' ? await store.context(gameId) : undefined });
    return streamTurn({ store, provider, content, gameId, job });
  } catch (error) { return errorResponse(error); }
}

function streamTurn({ store, provider, content, gameId, job }) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      if (job.running) return;
      job.running = true;
      void processTurn({ store, provider, content, gameId, job, emit: (name, data) => controller.enqueue(encoder.encode(sse(name, data))) })
        .then(() => controller.close(), (error) => { controller.enqueue(encoder.encode(sse('terminal', { status: 'failed', error_code: error.message }))); controller.close(); });
    }
  });
  return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache', 'access-control-allow-origin': '*' } });
}

async function processTurn({ store, provider, content, gameId, job, emit }) {
  const before = await store.context(gameId);
  let storyText = '';
  let lastProgressAt = 0;
  let lastPersistedLength = 0;
  try {
    for await (const delta of provider.story({ literalAction: job.literal_action, playerName: before.state.state.player.name, context: before })) {
      const text = String(delta);
      storyText += text;
      emit('story_delta', { text });
      const now = Date.now();
      if (!lastProgressAt || now - lastProgressAt >= 100 || storyText.length - lastPersistedLength >= 256) {
        await store.updateProgress({ gameId, turnNumber: job.turn_number, storyText });
        lastProgressAt = now;
        lastPersistedLength = storyText.length;
      }
    }
    if (storyText.length !== lastPersistedLength) await store.updateProgress({ gameId, turnNumber: job.turn_number, storyText });
    const parsed = parseWith(provider, storyText, content);
    let observation = {};
    try { observation = await provider.observe({ literalAction: job.literal_action, storyText: parsed.displayText, context: before }); }
    catch { observation = {}; }
    const targetIds = parsed.blocks.filter((block) => block.type === 'dialogue').map((block) => block.speaker_id);
    const reduced = reduceObservation({ state: before.state.state, observation: observation ?? {}, storyText: parsed.displayText, content, targetIds });
    const summary = boundedSummary(parsed.displayText, observation?.turn_summary);
    const context = await store.commitTurn({ gameId, turnNumber: job.turn_number, expectedRevision: before.state.revision, storyText: parsed.displayText, parsedBlocks: parsed.blocks, choices: parsed.choices, summary, mindMonitor: reduced.mindMonitor, stateAfter: reduced.state });
    emit('terminal', { status: 'committed', context });
  } catch (error) {
    const context = await store.failJob(gameId, job.turn_number, error.message || 'turn_failed');
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

export default {
  async fetch(request, env) {
    try { return await createProductionV2Worker({ env }).fetch(request); }
    catch (error) { return errorResponse(error); }
  }
};
