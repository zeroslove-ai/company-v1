import { canonicalActors, openingActorIds, registeredActorIds } from '../domain/content.js';
import { assertExpectedTurn, boundedSummary, createInitialState, requireLiteralAction } from '../domain/contracts.js';
import { normalizeObserver } from '../domain/observer-normalizer.js';
import { applyR3Csa, createR3CsaCatalog } from '../domain/csa.js';
import { reduceObservation } from '../domain/reducer.js';
import { projectNavigationContext, resolvePlayerNavigationIntent } from '../domain/navigation.js';
import { validateProfile } from '../domain/profile.js';
import { R3_MAX_PROGRESS_WRITES, R3_PROGRESS_INTERVAL_CHARS } from './job-policy.js';
import { body, errorResponse, json, R3_CORS_HEADERS, sse } from './http.js';
import { bearerCapability, issueGameCapability, requireGameAccessSecret, verifyGameCapability } from './game-capability.js';
import { R3_ATTEMPT_FENCE_CONFLICT } from './store.js';
import { createR3Provider, sanitizeObserverFailure } from './provider.js';
import { SupabaseR3Store } from './supabase-store.js';
import { loadWorkerCanonicalContent } from '../domain/worker-content.js';
import { projectCurrentMedia, resolveCommittedTtsBatch, resolveCommittedTtsVoice, selectApprovedImage } from '../domain/media.js';

export function createR3Worker({ store, provider, content, gameAccessSecret, env = {} } = {}) {
  if (!store || !provider || !content) throw new Error('r3_worker_requires_store_provider_content');
  return {
    store,
    provider,
    async fetch(request, requestEnv = env, executionCtx = null) {
      try {
        const url = new URL(request.url);
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: R3_CORS_HEADERS });
        if (request.method === 'GET' && url.pathname === '/api/r3/catalogs') return json(catalogResponse(content));
        if (request.method === 'POST' && url.pathname === '/api/r3/games') return await setup(store, content, await body(request), gameAccessSecret);
        const match = url.pathname.match(/^\/api\/r3\/games\/([^/]+)(?:\/(context|opening|turn|csa|feedback|reset))?$/);
        const mediaMatch = url.pathname.match(/^\/api\/r3\/games\/([^/]+)\/media\/(image|tts)$/);
        if (mediaMatch) {
          const gameId = mediaMatch[1];
          if (!(await verifyGameCapability(gameId, bearerCapability(request), gameAccessSecret))) return accessDeniedResponse();
          return mediaMatch[2] === 'image'
            ? imageMediaResponse({ request, url, store, content, gameId })
            : ttsMediaResponse({ request, url, store, content, gameId, env: requestEnv });
        }
        if (!match) return errorResponse(new Error('r3_not_found'));
        const gameId = match[1]; const action = match[2] ?? 'context';
        if (!(await verifyGameCapability(gameId, bearerCapability(request), gameAccessSecret))) return accessDeniedResponse();
        if (request.method === 'GET' && action === 'context') return json(await store.context(gameId));
        if (request.method === 'POST' && action === 'opening') return openingResponse(store, provider, content, gameId);
        if (request.method === 'POST' && action === 'turn') return turnResponse(request, store, provider, content, gameId, executionCtx);
        if (request.method === 'POST' && action === 'feedback') return feedbackResponse(request, store, provider, content, gameId);
        if (request.method === 'POST' && action === 'csa') return csaResponse(store, provider, content, gameId, await body(request));
        if (request.method === 'POST' && action === 'reset') return await resetResponse(request, store, provider, content, gameId);
        return errorResponse(new Error('r3_not_found'));
      } catch (error) { return errorResponse(error); }
    }
  };
}

export function createProductionR3Worker({ env, fetchImpl = fetch, content = loadWorkerCanonicalContent(), store, provider } = {}) {
  const resolvedStore = store ?? new SupabaseR3Store({ env, fetchImpl });
  const resolvedProvider = provider ?? createR3Provider({ env, fetchImpl });
  return createR3Worker({ store: resolvedStore, provider: resolvedProvider, content, gameAccessSecret: env?.R3_GAME_ACCESS_SECRET, env });
}

async function imageMediaResponse({ url, store, content, gameId }) {
  const context = await (store.presentationContext?.(gameId) ?? store.context(gameId));
  const projection = projectCurrentMedia({ context, content, requestedCharacterId: url.searchParams.get('character_id') ?? '', requestedPool: url.searchParams.get('pool') ?? 'general' });
  if (!projection.character_id) return json({ character_id: null, image: null, pool: projection.pool, reason: projection.reason });
  try {
    const candidates = await (store.listImageCandidates?.(projection.character_id, projection.pool) ?? []);
    return json({ character_id: projection.character_id, pool: projection.pool, image: selectApprovedImage({ candidates, projection }) });
  } catch {
    return json({ character_id: projection.character_id, pool: projection.pool, image: null, reason: 'media_fail_open' });
  }
}

async function ttsMediaResponse({ url, store, content, gameId, env }) {
  const context = await (store.presentationContext?.(gameId) ?? store.context(gameId));
  const speakerId = url.searchParams.get('speaker_id') ?? url.searchParams.get('character_id') ?? '';
  const spokenText = url.searchParams.get('text') ?? '';
  const batch = resolveCommittedTtsBatch({ context, content, speakerId, spokenText });
  if (!batch) return json({ url: null, reason: 'dialogue_not_committed' }, 400);
  const eligibility = resolveCommittedTtsVoice({ content, speakerId, spokenText: batch.text });
  if (!eligibility.eligible) return json({ url: null, reason: eligibility.code }, 400);
  if (!env?.TTS_WORKER?.fetch) throw new Error('r3_tts_service_binding_missing');
  const direction = url.searchParams.get('direction') ?? batch.direction ?? '';
  const response = await env.TTS_WORKER.fetch(env.TTS_WORKER_URL || 'https://fancy-dust-7f8c.zeroslove.workers.dev/', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ voice_id: eligibility.voice_id, text: batch.text, direction })
  });
  if (!response.ok) throw new Error('r3_tts_upstream_failed');
  const payload = await response.json(); const audioUrl = typeof payload?.url === 'string' ? payload.url : '';
  if (!/^https?:\/\//i.test(audioUrl) && !/^data:audio\//i.test(audioUrl)) throw new Error('r3_tts_url_invalid');
  return json({ url: audioUrl, speaker_id: speakerId, text: batch.text, direction });
}

async function setup(store, content, input, gameAccessSecret) {
  requireGameAccessSecret(gameAccessSecret);
  const result = validateProfile(input?.profile ?? input?.player, content);
  if (!result.valid) return json({ code: 'r3_profile_invalid', errors: result.errors }, 400);
  const locationId = chooseOpeningLocation(content, result.profile);
  const created = await store.createGame({ profile: result.profile, locationId, presentActorIds: openingActorIds(content, locationId) });
  const gameId = created?.game?.game_id ?? created?.game_id;
  return json({ ...created, game_capability: await issueGameCapability(gameId, gameAccessSecret) });
}

function chooseOpeningLocation(content, profile) {
  const match = (content.locations ?? []).find(location => location.department_id === profile.department_id && location.opening_enabled !== false);
  return match?.location_id ?? content.locations?.find(location => location.opening_enabled !== false)?.location_id ?? content.locations?.[0]?.location_id ?? null;
}

function catalogResponse(content) {
  const actorIds = [...registeredActorIds(content)];
  return { departments: content.departments ?? [], positions: content.positions ?? [], body_types: content.bodyTypes ?? [], speech_styles: content.speechStyles ?? [], locations: content.locations ?? [], actors: canonicalActors(content, actorIds), csa_presets: createR3CsaCatalog(content.csaPresets) };
}

function accessDeniedResponse() {
  return json({ code: 'r3_game_access_denied', message: 'r3_game_access_denied' }, 401);
}

async function csaResponse(store, provider, content, gameId, input) {
  const before = await store.context(gameId); const expectedRevision = input?.expected_revision;
  if (!Number.isInteger(expectedRevision) || expectedRevision !== before.state.revision) throw new Error('r3_csa_revision_conflict');
  const operations = Array.isArray(input?.operations) ? input.operations : [];
  if (operations.length !== 1) throw new Error('r3_csa_operations_invalid');
  const csaOperation = operations[0];
  const literalAction = requireLiteralAction(input?.literal_action ?? csaLiteralAction(csaOperation, content));
  return startTurn(store, provider, content, gameId, { action_id: String(input?.action_id ?? globalThis.crypto?.randomUUID?.() ?? `r3-csa-${Date.now()}`), expected_turn: before.state.committed_turn + 1, literal_action: literalAction, csa_operation: csaOperation });
}

function csaLiteralAction(operation, content) {
  const catalog = createR3CsaCatalog(content?.csaPresets); const item = catalog.items.find(candidate => candidate.id === operation?.template_id);
  const verb = operation?.operation === 'activate' ? 'Apply' : operation?.operation === 'update' ? 'Change' : 'Remove';
  const label = item?.label ?? operation?.id ?? 'CSA rule';
  const scope = operation?.subject_scope ? ` for ${operation.subject_scope}` : '';
  return `${verb} ${label}${scope}`;
}

async function resetResponse(request, store, provider, content, gameId) {
  const input = await body(request);
  const expectedRevision = input?.expected_state_revision;
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) throw new Error('r3_reset_revision_invalid');
  const before = await store.context(gameId);
  if (before.state.revision !== expectedRevision) throw new Error('r3_reset_revision_conflict');
  const profile = before.game?.profile;
  const locationId = chooseOpeningLocation(content, profile);
  const stateAfter = createInitialState(profile, locationId, openingActorIds(content, locationId));
  await store.resetGame({ gameId, expectedRevision, stateAfter });
  return openingResponse(store, provider, content, gameId);
}

function openingResponse(store, provider, content, gameId) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({ start(controller) { processOpening({ store, provider, content, gameId, emit: (name, data) => controller.enqueue(encoder.encode(sse(name, data))) }).then(() => controller.close(), error => { controller.enqueue(encoder.encode(sse('terminal', { status: 'failed', error_code: error.message }))); controller.close(); }); } });
  return new Response(stream, { status: 200, headers: { ...R3_CORS_HEADERS, 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' } });
}

function timingMark(emit, startedAt, stage, details = {}) {
  emit('timing', { stage, elapsed_ms: Math.max(0, Date.now() - startedAt), ...details });
}

async function processOpening({ store, provider, content, gameId, emit }) {
  const startedAt = Date.now(); const mark = (stage, details) => timingMark(emit, startedAt, stage, details);
  const before = await store.context(gameId); if (before.turns.length) { mark('terminal_commit', { replay: true }); emit('terminal', { status: 'committed', context: before }); return; }
  emit('meta', { game_id: gameId, turn_number: 0 }); let storyText = ''; mark('story_request_start');
  for await (const delta of provider.story({ opening: true, context: before, content, onTiming: mark })) { storyText += String(delta); emit('story_delta', { text: String(delta) }); }
  mark('story_complete'); let observer = {}; let observerFailed = false; let observerFailureCode = null; mark('observer_start'); try { observer = await provider.observe({ context: before, literalAction: '', storyText, content }); mark('observer_complete'); } catch (error) { observerFailed = true; observerFailureCode = sanitizeObserverFailure(error); mark('observer_failed', { observer_error_code: observerFailureCode }); }
  const normalized = normalizeObserver(observer, { storyText, content, currentState: before.state.state }); if (observerFailed) normalized.warnings.unshift('observer_failed', observerFailureCode);
  const reduced = reduceObservation({ state: before.state.state, observation: normalized, turnNumber: 0 });
  const context = await store.createOpening(gameId, { expectedRevision: before.state.revision, storyText, choices: normalized.choices ?? [], summary: boundedSummary(storyText, normalized.turn_summary), mindMonitor: normalized.mind_monitor, observerRaw: observer, observerApplied: reduced.applied, warnings: normalized.warnings, stateAfter: reduced.state });
  mark('terminal_commit');
  emit('terminal', { status: 'committed', context });
}

async function turnResponse(request, store, provider, content, gameId, executionCtx) {
  return startTurn(store, provider, content, gameId, await body(request), executionCtx);
}

async function startTurn(store, provider, content, gameId, input, executionCtx = null) {
  const literalAction = requireLiteralAction(input.literal_action); const actionId = String(input.action_id ?? ''); if (!actionId) throw new Error('r3_action_id_required');
  const csaOperation = input?.csa_operation ?? null;
  const before = await store.context(gameId); const expectedTurn = input.expected_turn; const existing = Number.isInteger(expectedTurn) ? await store.getJob(gameId, expectedTurn) : null;
  if (existing && !(existing.status === 'failed' && input.retry_failed === true)) return json({ status: existing.status, reconnect: true, job: existing, context: existing.status === 'committed' ? await store.context(gameId) : undefined });
  if (csaOperation) applyR3Csa({ state: before.state.state, content, rawOperations: [csaOperation], catalog: createR3CsaCatalog(content.csaPresets) });
  assertExpectedTurn(expectedTurn, before.state.committed_turn);
  const reservation = await store.reserveTurn({ gameId, turnNumber: expectedTurn, actionId, literalAction, csaOperation, retryFailed: input.retry_failed === true });
  if (!reservation.created) return json({ status: reservation.job.status, reconnect: true, job: reservation.job, context: reservation.job.status === 'committed' ? await store.context(gameId) : undefined });
  return streamTurn({ store, provider, content, gameId, job: { ...reservation.job, ...(csaOperation ? { csa_operation: csaOperation } : {}) }, executionCtx });
}

async function feedbackResponse(request, store, provider, content, gameId) {
  const input = await body(request);
  const revisionRequestId = String(input?.revision_request_id ?? '');
  const expectedTurn = input?.expected_turn;
  const expectedStateRevision = input?.expected_state_revision;
  const feedbackText = typeof input?.feedback_text === 'string' ? input.feedback_text.trim() : '';
  let context = null;
  try {
    const result = await store.beginFeedbackRevision({ gameId, revisionRequestId, expectedTurn, expectedStateRevision, feedbackText });
    context = await store.context(gameId);
    if (!result.created) {
      const status = result.attempt?.status === 'committed' ? 'committed' : 'failed';
      return singleFeedbackResponse({ status, errorCode: result.attempt?.error_code ?? (status === 'failed' ? 'r3_feedback_in_flight' : null), context });
    }
    return streamFeedback({ store, provider, content, gameId, attempt: normalizeFeedbackAttempt(result.attempt), snapshot: result.snapshot });
  } catch (error) {
    try { context = context ?? await store.context(gameId); } catch {}
    return singleFeedbackResponse({ status: 'failed', errorCode: error.message, context });
  }
}

function feedbackResponseHeaders() {
  return { ...R3_CORS_HEADERS, 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' };
}

function singleFeedbackResponse({ status, errorCode = null, context }) {
  const payload = { status, ...(errorCode ? { error_code: errorCode } : {}), ...(context ? { context } : {}) };
  return new Response(sse('terminal', payload), { status: 200, headers: feedbackResponseHeaders() });
}

function normalizeFeedbackAttempt(attempt) {
  return { ...attempt, attemptId: attempt?.attemptId ?? attempt?.attempt_id, revisionRequestId: attempt?.revisionRequestId ?? attempt?.revision_request_id, targetTurnNumber: attempt?.targetTurnNumber ?? attempt?.target_turn_number, targetRevision: attempt?.targetRevision ?? attempt?.target_revision, expectedStateRevision: attempt?.expectedStateRevision ?? attempt?.expected_state_revision, originalLiteralAction: attempt?.originalLiteralAction ?? attempt?.original_literal_action, feedbackText: attempt?.feedbackText ?? attempt?.feedback_text };
}

function streamFeedback({ store, provider, content, gameId, attempt, snapshot }) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({ start(controller) {
    processFeedback({ store, provider, content, gameId, attempt, snapshot, emit: (name, data) => controller.enqueue(encoder.encode(sse(name, data))) })
      .then(() => controller.close(), error => { controller.enqueue(encoder.encode(sse('terminal', { status: 'failed', error_code: error.message }))); controller.close(); });
  } });
  return new Response(stream, { status: 200, headers: feedbackResponseHeaders() });
}

async function processFeedback({ store, provider, content, gameId, attempt, snapshot, emit }) {
  const startedAt = Date.now(); const mark = (stage, details) => timingMark(emit, startedAt, stage, details);
  const before = await store.feedbackContext(gameId, snapshot);
  const literalAction = attempt.originalLiteralAction;
  let storyText = '';
  emit('meta', { game_id: gameId, turn_number: attempt.targetTurnNumber, revision: attempt.targetRevision + 1, revision_request_id: attempt.revisionRequestId });
  mark('story_request_start');
  try {
    for await (const delta of provider.story({ context: before, content, literalAction, feedbackText: attempt.feedbackText, feedbackReferenceStory: snapshot.turn.story_text, onTiming: mark })) {
      const text = String(delta); storyText += text; emit('story_delta', { text });
    }
    mark('story_complete');
    let rawObserver = {}; let observerFailed = false; let observerFailureCode = null; mark('observer_start');
    try { rawObserver = await provider.observe({ context: before, literalAction, storyText, content }); mark('observer_complete'); }
    catch (error) { observerFailed = true; observerFailureCode = sanitizeObserverFailure(error); mark('observer_failed', { observer_error_code: observerFailureCode }); }
    const normalized = normalizeObserver(rawObserver, { storyText, content, currentState: before.state.state });
    if (observerFailed) normalized.warnings.unshift('observer_failed', observerFailureCode);
    const reduced = reduceObservation({ state: before.state.state, observation: normalized, turnNumber: attempt.targetTurnNumber });
    const context = await store.commitFeedbackRevision({ gameId, attemptId: attempt.attemptId, attempt, revisionRequestId: attempt.revisionRequestId, expectedTurn: attempt.targetTurnNumber, expectedStateRevision: attempt.expectedStateRevision, storyText, choices: normalized.choices ?? [], summary: boundedSummary(storyText, normalized.turn_summary), mindMonitor: normalized.mind_monitor, observerRaw: rawObserver, observerApplied: reduced.applied, warnings: normalized.warnings, stateAfter: reduced.state });
    mark('terminal_commit'); emit('terminal', { status: 'committed', context });
  } catch (error) {
    try { await store.failFeedbackRevision({ gameId, attemptId: attempt.attemptId, revisionRequestId: attempt.revisionRequestId, errorCode: error.message }); } catch {}
    let context = null; try { context = await store.context(gameId); } catch {}
    emit('terminal', { status: 'failed', error_code: error.message, ...(context ? { context } : {}) });
  }
}

function streamTurn({ store, provider, content, gameId, job, executionCtx = null }) {
  const encoder = new TextEncoder(); let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      const emit = (name, data) => { if (!cancelled) controller.enqueue(encoder.encode(sse(name, data))); };
      const task = processTurn({ store, provider, content, gameId, job, emit });
      executionCtx?.waitUntil?.(task);
      task.then(() => { if (!cancelled) controller.close(); }, error => { if (!cancelled) { emit('terminal', { status: 'failed', error_code: error.message }); controller.close(); } });
    },
    cancel() { cancelled = true; }
  });
  return new Response(stream, { status: 200, headers: { ...R3_CORS_HEADERS, 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' } });
}

async function processTurn({ store, provider, content, gameId, job, emit }) {
  const startedAt = Date.now(); const mark = (stage, details) => timingMark(emit, startedAt, stage, details);
  const before = await store.context(gameId); const csaOperation = job.csa_operation ?? null; const attempt = { gameId, turnNumber: job.turn_number, actionId: job.action_id, attemptNo: job.attempt_no, literalAction: job.literal_action, ...(csaOperation ? { csaOperation } : {}) }; const navigationIntent = resolvePlayerNavigationIntent({ content, state: before.state.state, literalAction: attempt.literalAction }); const storyContext = projectNavigationContext(before, navigationIntent, content); let storyText = ''; let lastProgress = 0; let writes = 0;
  emit('meta', { game_id: gameId, turn_number: job.turn_number, action_id: job.action_id }); mark('story_request_start');
  try {
    for await (const delta of provider.story({ literalAction: attempt.literalAction, context: storyContext, csaOperation, content, onTiming: mark })) { const text = String(delta); storyText += text; emit('story_delta', { text }); if (writes < R3_MAX_PROGRESS_WRITES && (writes === 0 || storyText.length - lastProgress >= R3_PROGRESS_INTERVAL_CHARS)) { await store.updateProgress({ gameId, turnNumber: attempt.turnNumber, attempt, storyText }); writes += 1; lastProgress = storyText.length; } }
    mark('story_complete'); await store.markStoryComplete({ gameId, turnNumber: attempt.turnNumber, attempt, storyText });
    let rawObserver = {}; let observerFailed = false; let observerFailureCode = null; mark('observer_start'); try { rawObserver = await provider.observe({ literalAction: attempt.literalAction, storyText, context: storyContext, csaOperation, content }); mark('observer_complete'); } catch (error) { observerFailed = true; observerFailureCode = sanitizeObserverFailure(error); mark('observer_failed', { observer_error_code: observerFailureCode }); }
    const normalized = normalizeObserver(rawObserver, { storyText, content, currentState: storyContext.state.state }); if (observerFailed) normalized.warnings.unshift('observer_failed', observerFailureCode);
    if (navigationIntent) normalized.warnings.unshift('canonical_navigation_applied');
    const reduced = reduceObservation({ state: before.state.state, observation: normalized, turnNumber: attempt.turnNumber, navigationIntent, content });
    const stateAfter = csaOperation ? applyR3Csa({ state: reduced.state, content, rawOperations: [csaOperation], catalog: createR3CsaCatalog(content.csaPresets) }) : reduced.state;
    const context = await store.commitTurn({ gameId, turnNumber: attempt.turnNumber, attempt, expectedRevision: before.state.revision, storyText, choices: normalized.choices ?? [], summary: boundedSummary(storyText, normalized.turn_summary), mindMonitor: normalized.mind_monitor, observerRaw: rawObserver, observerApplied: reduced.applied, warnings: normalized.warnings, stateAfter });
    mark('terminal_commit');
    emit('terminal', { status: 'committed', context });
  } catch (error) {
    if (error?.code === R3_ATTEMPT_FENCE_CONFLICT || error?.message === R3_ATTEMPT_FENCE_CONFLICT) return;
    const context = await store.failJob({ gameId, turnNumber: attempt.turnNumber, attempt, errorCode: error.message }); emit('terminal', { status: 'failed', error_code: error.message, context });
  }
}

export default { fetch(request, env) { return createProductionR3Worker({ env }).fetch(request); } };
