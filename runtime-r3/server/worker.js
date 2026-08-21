import { assertExpectedTurn, boundedSummary, requireLiteralAction } from '../domain/contracts.js';
import { buildOpeningContext } from '../domain/story.js';
import { normalizeObserver } from '../domain/observer-normalizer.js';
import { reduceObservation } from '../domain/reducer.js';
import { validateProfile } from '../domain/profile.js';
import { R3_MAX_PROGRESS_WRITES, R3_PROGRESS_INTERVAL_CHARS } from './job-policy.js';
import { body, errorResponse, json, R3_CORS_HEADERS, sse } from './http.js';
import { createR3Provider } from './provider.js';
import { R3_ATTEMPT_FENCE_CONFLICT } from './store.js';

export function createR3Worker({ store, provider, content, env, fetchImpl = fetch } = {}) {
  const resolvedStore = store;
  const resolvedProvider = provider;
  if (!resolvedStore || !resolvedProvider || !content) throw new Error('r3_worker_requires_store_provider_content');
  return {
    store: resolvedStore,
    provider: resolvedProvider,
    async fetch(request) {
      try {
        const url = new URL(request.url);
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: R3_CORS_HEADERS });
        if (request.method === 'GET' && url.pathname === '/api/r3/catalogs') return json(catalogResponse(content));
        if (request.method === 'POST' && url.pathname === '/api/r3/games') return setup(resolvedStore, content, await body(request));
        const match = url.pathname.match(/^\/api\/r3\/games\/([^/]+)(?:\/(context|opening|turn))?$/);
        if (!match) return errorResponse(new Error('r3_not_found'));
        const gameId = match[1]; const action = match[2] ?? 'context';
        if (request.method === 'GET' && action === 'context') return json(resolvedStore.context(gameId));
        if (request.method === 'POST' && action === 'opening') return openingResponse(resolvedStore, resolvedProvider, content, gameId);
        if (request.method === 'POST' && action === 'turn') return turnResponse(request, resolvedStore, resolvedProvider, content, gameId);
        return errorResponse(new Error('r3_not_found'));
      } catch (error) { return errorResponse(error); }
    }
  };
}

export function createProductionR3Worker({ env, fetchImpl = fetch, content } = {}) {
  return createR3Worker({ env, fetchImpl, content, store: env?.R3_STORE, provider: env?.R3_PROVIDER });
}

async function setup(store, content, input) {
  const result = validateProfile(input?.profile ?? input?.player, content);
  if (!result.valid) return json({ code: 'r3_profile_invalid', errors: result.errors }, 400);
  return json(store.createGame({ profile: result.profile, locationId: chooseOpeningLocation(content, result.profile) }));
}

function chooseOpeningLocation(content, profile) {
  const match = (content.locations ?? []).find(location => location.department_id === profile.department_id && location.opening_enabled !== false);
  return match?.location_id ?? content.locations?.find(location => location.opening_enabled !== false)?.location_id ?? content.locations?.[0]?.location_id ?? null;
}

function catalogResponse(content) {
  return {
    departments: content.departments ?? [],
    positions: content.positions ?? [],
    body_types: content.bodyTypes ?? [],
    speech_styles: content.speechStyles ?? [],
    locations: (content.locations ?? []).map(({ location_id, name, floor, department_id }) => ({ location_id, name, floor, department_id }))
  };
}

function openingResponse(store, provider, content, gameId) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({ start(controller) { processOpening({ store, provider, content, gameId, emit: (name, data) => controller.enqueue(encoder.encode(sse(name, data))) }).then(() => controller.close(), error => { controller.enqueue(encoder.encode(sse('terminal', { status: 'failed', error_code: error.message }))); controller.close(); }); } });
  return new Response(stream, { status: 200, headers: { ...R3_CORS_HEADERS, 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' } });
}

async function processOpening({ store, provider, content, gameId, emit }) {
  const before = store.context(gameId); if (before.turns.length) { emit('terminal', { status: 'committed', context: before }); return; }
  emit('meta', { game_id: gameId, turn_number: 0 }); let storyText = '';
  for await (const delta of provider.story({ opening: true, context: buildOpeningContext(before) })) { storyText += String(delta); emit('story_delta', { text: String(delta) }); }
  let observer = {}; let observerFailed = false; try { observer = await provider.observe({ context: before, literalAction: '', storyText }); } catch { observerFailed = true; }
  const normalized = normalizeObserver(observer, { storyText, content, currentState: before.state.state });
  if (observerFailed) normalized.warnings.unshift('observer_failed');
  const reduced = reduceObservation({ state: before.state.state, observation: normalized, turnNumber: 0 });
  const context = store.createOpening(gameId, { storyText, choices: normalized.choices ?? [], summary: boundedSummary(storyText, normalized.turn_summary), mindMonitor: normalized.mind_monitor, observerRaw: observer, observerApplied: reduced.applied, warnings: normalized.warnings });
  emit('terminal', { status: 'committed', context });
}

async function turnResponse(request, store, provider, content, gameId) {
  const input = await body(request); const literalAction = requireLiteralAction(input.literal_action); const actionId = String(input.action_id ?? '');
  if (!actionId) throw new Error('r3_action_id_required');
  const before = store.context(gameId); const expectedTurn = input.expected_turn;
  const existing = Number.isInteger(expectedTurn) ? store.getJob(gameId, expectedTurn) : null;
  if (existing) return json({ status: existing.status, reconnect: true, job: existing, context: existing.status === 'committed' ? store.context(gameId) : undefined });
  assertExpectedTurn(expectedTurn, before.state.committed_turn);
  const reservation = store.reserveTurn({ gameId, turnNumber: expectedTurn, actionId, literalAction, retryFailed: input.retry_failed === true });
  if (!reservation.created) return json({ status: reservation.job.status, reconnect: true, job: reservation.job, context: reservation.job.status === 'committed' ? store.context(gameId) : undefined });
  return streamTurn({ store, provider, content, gameId, job: reservation.job });
}

function streamTurn({ store, provider, content, gameId, job }) {
  const encoder = new TextEncoder(); const stream = new ReadableStream({ start(controller) { processTurn({ store, provider, content, gameId, job, emit: (name, data) => controller.enqueue(encoder.encode(sse(name, data))) }).then(() => controller.close(), error => { controller.enqueue(encoder.encode(sse('terminal', { status: 'failed', error_code: error.message }))); controller.close(); }); } });
  return new Response(stream, { status: 200, headers: { ...R3_CORS_HEADERS, 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' } });
}

async function processTurn({ store, provider, content, gameId, job, emit }) {
  const before = store.context(gameId); const attempt = { gameId, turnNumber: job.turn_number, actionId: job.action_id, attemptNo: job.attempt_no, literalAction: job.literal_action }; let storyText = ''; let lastProgress = 0; let writes = 0;
  emit('meta', { game_id: gameId, turn_number: job.turn_number, action_id: job.action_id });
  try {
    for await (const delta of provider.story({ literalAction: attempt.literalAction, context: before })) { const text = String(delta); storyText += text; emit('story_delta', { text }); if (writes < R3_MAX_PROGRESS_WRITES && (writes === 0 || storyText.length - lastProgress >= R3_PROGRESS_INTERVAL_CHARS)) { store.updateProgress({ gameId, turnNumber: attempt.turnNumber, attempt, storyText }); writes += 1; lastProgress = storyText.length; } }
    store.markStoryComplete({ gameId, turnNumber: attempt.turnNumber, attempt, storyText });
    let rawObserver = {}; let observerFailed = false; try { rawObserver = await provider.observe({ literalAction: attempt.literalAction, storyText, context: before }); } catch { observerFailed = true; }
    const normalized = normalizeObserver(rawObserver, { storyText, content, currentState: before.state.state });
    if (observerFailed) normalized.warnings.unshift('observer_failed');
    const reduced = reduceObservation({ state: before.state.state, observation: normalized, turnNumber: attempt.turnNumber });
    const context = store.commitTurn({ gameId, turnNumber: attempt.turnNumber, attempt, expectedRevision: before.state.revision, storyText, choices: normalized.choices ?? [], summary: boundedSummary(storyText, normalized.turn_summary), mindMonitor: normalized.mind_monitor, observerRaw: rawObserver, observerApplied: reduced.applied, warnings: normalized.warnings, stateAfter: reduced.state });
    emit('terminal', { status: 'committed', context });
  } catch (error) {
    if (error?.code === R3_ATTEMPT_FENCE_CONFLICT || error?.message === R3_ATTEMPT_FENCE_CONFLICT) return;
    const context = store.failJob({ gameId, turnNumber: attempt.turnNumber, attempt, errorCode: error.message }); emit('terminal', { status: 'failed', error_code: error.message, context });
  }
}

export default { fetch(request, env) { return createProductionR3Worker({ env }).fetch(request); } };
