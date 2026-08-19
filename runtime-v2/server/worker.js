import { companyV2Content } from '../domain/content.js';
import { boundedSummary, assertExpectedTurn, reduceObservation, requireLiteralAction } from '../domain/contracts.js';
import { COMPANY_APP_PREMISE, openingStory, parseStoryBlocks } from '../domain/story.js';
import { body, errorResponse, json, sse, V2_CORS_HEADERS, V2HttpError } from './http.js';
import { MAX_PROGRESS_WRITES_PER_ATTEMPT, PROGRESS_SNAPSHOT_INTERVAL_CHARS } from './job-policy.js';
import { createV2Provider } from './provider.js';
import { SupabaseV2Store, V2ConfigurationError } from './supabase-store.js';
import { summarizeJob, V2_ATTEMPT_FENCE_CONFLICT } from './store.js';

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
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: V2_CORS_HEADERS });
        if (request.method === 'GET' && url.pathname === '/api/v2/context') return json(decorateContext(await resolvedStore.context(requiredQuery(url, 'game_id')), content));
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
  const storyText = (provider.opening ?? openingStory)({ playerName: context.state.state.player.name, content });
  const parsed = parseWith(provider, storyText, content);
  const summary = boundedSummary(parsed.displayText, 'Opening begins the Company v2 story.');
  await store.createOpening(gameId, { storyText: parsed.displayText, parsedBlocks: parsed.blocks, choices: parsed.choices, summary });
  return decorateContext(await store.context(gameId), content);
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
      return json({ status: existingJob.status, reconnect: true, progress_story_text: existingJob.story_text, job: summarizeJob(existingJob), context: existingJob.status === 'committed' ? decorateContext(await store.context(gameId), content) : undefined });
    }
    assertExpectedTurn({ expectedTurn: input.expected_turn, committedTurn: context.state.committed_turn });
    const reservation = await store.reserveTurn({ gameId, turnNumber: input.expected_turn, actionId, literalAction, retryFailed: explicitRetry });
    const { job, created } = reservation;
    if (!created) return json({ status: job.status, reconnect: true, progress_story_text: job.story_text, job: summarizeJob(job), context: job.status === 'committed' ? decorateContext(await store.context(gameId), content) : undefined });
    const attempt = Object.freeze({ gameId: job.game_id, turnNumber: job.turn_number, actionId: job.action_id, attemptNo: job.attempt_no, literalAction: job.literal_action });
    return streamTurn({ store, provider, content, gameId, job, attempt });
  } catch (error) { return errorResponse(error); }
}

function streamTurn({ store, provider, content, gameId, job, attempt }) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      if (job.running) return;
      job.running = true;
      return processTurn({ store, provider, content, gameId, attempt, emit: (name, data) => controller.enqueue(encoder.encode(sse(name, data))) })
        .then(() => controller.close(), (error) => { controller.enqueue(encoder.encode(sse('terminal', { status: 'failed', error_code: error.message }))); controller.close(); });
    }
  });
  return new Response(stream, { status: 200, headers: { ...V2_CORS_HEADERS, 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' } });
}

async function processTurn({ store, provider, content, gameId, attempt, emit }) {
  const before = await store.context(gameId);
  let storyText = '';
  let lastPersistedLength = 0;
  let progressWrites = 0;
  const persistProgress = async () => {
    if (!storyText.length || storyText.length === lastPersistedLength || progressWrites >= MAX_PROGRESS_WRITES_PER_ATTEMPT) return;
    await store.updateProgress({ gameId, turnNumber: attempt.turnNumber, attempt, storyText });
    progressWrites += 1;
    lastPersistedLength = storyText.length;
  };
  try {
    for await (const delta of provider.story({ literalAction: attempt.literalAction, playerName: before.state.state.player.name, context: before })) {
      const text = String(delta);
      storyText += text;
      emit('story_delta', { text });
      if (progressWrites === 0 || storyText.length - lastPersistedLength >= PROGRESS_SNAPSHOT_INTERVAL_CHARS) await persistProgress();
    }
    await persistProgress();
    const parsed = parseWith(provider, storyText, content);
    let observation = {};
    try { observation = await provider.observe({ literalAction: attempt.literalAction, storyText: parsed.displayText, context: before }); }
    catch { observation = {}; }
    const targetIds = parsed.blocks.filter((block) => block.type === 'dialogue').map((block) => block.speaker_id);
    const reduced = reduceObservation({ state: before.state.state, observation: observation ?? {}, storyText: parsed.displayText, content, targetIds });
    const summary = boundedSummary(parsed.displayText, observation?.turn_summary);
    const context = await store.commitTurn({ gameId, turnNumber: attempt.turnNumber, attempt, expectedRevision: before.state.revision, storyText: parsed.displayText, parsedBlocks: parsed.blocks, choices: parsed.choices, summary, mindMonitor: reduced.mindMonitor, stateAfter: reduced.state });
    emit('terminal', { status: 'committed', context: decorateContext(context, content) });
  } catch (error) {
    if (error.code === V2_ATTEMPT_FENCE_CONFLICT || error.message === V2_ATTEMPT_FENCE_CONFLICT) return;
    const errorCode = error.message || 'turn_failed';
    try {
      const context = await store.failJob(gameId, attempt.turnNumber, attempt, errorCode);
      emit('terminal', { status: 'failed', error_code: errorCode, context: decorateContext(context, content) });
    } catch (failure) {
      if (failure.code === V2_ATTEMPT_FENCE_CONFLICT || failure.message === V2_ATTEMPT_FENCE_CONFLICT) return;
      throw failure;
    }
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

function decorateContext(context, content) {
  return {
    ...context,
    catalog: {
      edition: content.edition,
      app: COMPANY_APP_PREMISE,
      npcs: content.npcIds().map((id) => { const npc = content.getNpc(id); return { id: npc.id, name: npc.name, kind: npc.kind, department: npc.department ?? npc.department_id, role: npc.role ?? npc.role_title }; }),
      locations: content.locationIds().map((id) => { const location = content.getLocation(id); return { id: location.id, name: location.name, description: location.description, department_id: location.department_id, location_type: location.location_type, default_npc_ids: location.default_npc_ids }; })
    }
  };
}

export default {
  async fetch(request, env) {
    try { return await createProductionV2Worker({ env }).fetch(request); }
    catch (error) { return errorResponse(error); }
  }
};
