import { HttpError, ok, readJson, requireString, sseEvent, sseResponse } from './http.js';
import { createSupabaseClient } from './supabase.js';
import { runExtract, streamStory } from './llm.js';
import {
  applyGuardedStateDelta,
  buildDegradedExtractEnvelope,
  buildExtractPrompt,
  buildOpeningPlan,
  buildOpeningPrompt,
  buildStableNpcIdSet,
  buildStoryPrompt,
  deriveRecoverableStep,
  deriveTurnChanges,
  hydrateGameplayState,
  normalizeGameplayExtractEnvelope,
  parseNarrative,
  resolvePlayerCanonicalNames,
  splitOpeningSections,
  validatePlayerSetupInput
} from '../engine/index.js';
import { GameCoreError } from '../engine/errors.js';
import { logTurnTiming, newRequestId } from './timing.js';

const EXTRACT_DEGRADE_CODES = new Set(['llm_upstream_failure', 'extract_timeout', 'extract_invalid_json', 'extract_truncated']);

function asHttpError(error) {
  if (error instanceof HttpError) return error;
  if (error instanceof GameCoreError) return new HttpError(422, error.code.toLowerCase(), error.message);
  return new HttpError(500, 'internal_error', 'Unexpected server error');
}

function actionOrNotFound(action) {
  if (!action) throw new HttpError(404, 'action_not_found', 'Action was not found');
  return action;
}

function actionIds(body) {
  return {
    gameId: requireString(body.game_id, 'game_id'),
    actionId: requireString(body.action_id, 'action_id')
  };
}

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Normalizes either an already-array character/NPC list or an id-keyed content map into an array. */
function toEntryArray(mapOrArray, idField) {
  if (Array.isArray(mapOrArray)) return mapOrArray;
  if (plainObject(mapOrArray)) {
    return Object.entries(mapOrArray).map(([id, value]) => ({ [idField]: id, ...(plainObject(value) ? value : {}) }));
  }
  return [];
}

export function masterFromEdition(edition) {
  return { characters: toEntryArray(edition?.characters?.characters, 'character_id') };
}

export function npcIdsFromEdition(edition) {
  return buildStableNpcIdSet({
    characters: toEntryArray(edition?.characters?.characters, 'character_id'),
    generalNpcs: toEntryArray(edition?.generalNpcs?.profiles, 'npc_id')
  });
}

function catalogsFromEdition(edition) {
  return {
    departments: toEntryArray(edition?.organization?.departments, 'department_id'),
    positions: toEntryArray(edition?.positions?.positions, 'position_id'),
    bodyTypes: toEntryArray(edition?.bodyTypes?.body_types, 'body_type_id'),
    speechStyles: toEntryArray(edition?.speechStyles?.speech_styles, 'speech_style_id')
  };
}

function randomSeedBytes(length = 16) {
  if (typeof crypto?.getRandomValues === 'function') return Array.from(crypto.getRandomValues(new Uint8Array(length)));
  return Array.from({ length }, () => Math.floor(Math.random() * 256));
}

function randomUuid() {
  return typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function activeCountFromNpcState(activeNpcState) {
  const ids = new Set();
  for (const map of Object.values(plainObject(activeNpcState) ? activeNpcState : {})) {
    for (const id of Object.keys(plainObject(map) ? map : {})) ids.add(id);
  }
  return ids.size;
}

function hydratedSaveContext(context, master) {
  const wrapped = context?.save && typeof context.save === 'object' && 'data' in context.save;
  const save = wrapped ? context.save.data : context.save;
  if (!save || typeof save !== 'object' || save.edition !== 'company-v1' || save.save_schema_version !== 1) return context;
  const hydrated = hydrateGameplayState(save, master);
  return { ...context, save: wrapped ? { ...context.save, data: hydrated } : hydrated };
}

function storySse({ meta, run }) {
  const encoder = new TextEncoder();
  return sseResponse(new ReadableStream({
    async start(controller) {
      const emit = (name, data) => controller.enqueue(encoder.encode(sseEvent(name, data)));
      emit('meta', meta);
      try {
        await run(emit);
      } catch (error) {
        const normalized = asHttpError(error);
        emit('error', { code: normalized.code, message: normalized.message, retryable: normalized.retryable });
      } finally {
        controller.close();
      }
    }
  }));
}

export function createTurnRoutes({ fetchImpl, edition }) {
  const master = masterFromEdition(edition);
  const npcIds = npcIdsFromEdition(edition);
  const catalogs = catalogsFromEdition(edition);
  const heroineIds = Object.keys(edition?.characters?.characters ?? {});

  return {
    async context(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, 'game_id');
      const recentTurns = Math.min(Math.max(Number.isInteger(body.recent_turns) ? body.recent_turns : 15, 1), 50);
      const db = createSupabaseClient(env, fetchImpl);
      const timing = {};
      try {
        const contextRpcStart = Date.now();
        const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: recentTurns });
        timing.context_rpc_ms = Date.now() - contextRpcStart;
        return ok({ context: hydratedSaveContext(context, master) });
      } finally {
        logTurnTiming({ event_stage: 'context', request_id: requestId, game_id: gameId, context_rpc_ms: timing.context_rpc_ms, turn_total_ms: Date.now() - startedAt });
      }
    },

    async story(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const { gameId, actionId } = actionIds(body);
      const expectedTurn = body.expected_turn;
      const playerAction = requireString(body.player_action, 'player_action');
      if (!Number.isInteger(expectedTurn) || expectedTurn < 1) throw new HttpError(400, 'invalid_request', 'expected_turn must be a positive integer');
      const db = createSupabaseClient(env, fetchImpl);
      const reservation = await db.callRpc('reserve_turn_action', {
        p_game_id: gameId, p_action_id: actionId, p_expected_turn: expectedTurn, p_player_action: playerAction
      });
      const action = actionOrNotFound(await db.getAction(gameId, actionId));
      let retryingStory = false;
      if (!action.story_text && action.processing_status === 'story_failed') {
        const claimed = await db.claimActionStatus(gameId, actionId, 'story_failed', 'story_streaming', null);
        if (!claimed) throw new HttpError(409, 'action_in_progress', 'Action retry is already in progress', true);
        Object.assign(action, claimed);
        retryingStory = true;
      }
      const meta = { action_id: reservation.action_id ?? actionId, turn_id: reservation.turn_id ?? action.turn_id, expected_turn: reservation.expected_turn ?? expectedTurn, replayed: Boolean(action.story_text) };

      if (action.story_text) {
        logTurnTiming({ event_stage: 'story', request_id: requestId, action_id: meta.action_id, game_id: gameId, expected_turn: meta.expected_turn, replayed: true, turn_total_ms: Date.now() - startedAt });
        return storySse({ meta: { ...meta, replayed: true }, run: async emit => {
          emit('delta', { text: action.story_text });
          const parsed = action.parsed_blocks ?? parseNarrative(action.story_text);
          emit('complete', { action_id: meta.action_id, turn_id: meta.turn_id, warnings: parsed.warnings ?? [], replayed: true });
        } });
      }
      if ((reservation.replayed && !retryingStory) || action.processing_status !== 'story_streaming') {
        throw new HttpError(409, 'action_in_progress', 'Action already has recoverable work in progress', true);
      }

      return storySse({ meta, run: async emit => {
        let raw = '';
        let storyPersisted = false;
        const timing = {};
        try {
          const contextRpcStart = Date.now();
          const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 15 });
          timing.context_rpc_ms = Date.now() - contextRpcStart;
          const hydratedContext = hydratedSaveContext(context, master);
          const promptStart = Date.now();
          const messages = buildStoryPrompt({ edition, context: hydratedContext, playerAction, expectedTurn, npcIds, catalogs });
          timing.story_prompt_ms = Date.now() - promptStart;
          const storyUserPayload = JSON.parse(messages[1].content);
          timing.story_system_chars = messages[0].content.length;
          timing.story_context_chars = JSON.stringify(storyUserPayload.context).length;
          timing.active_character_canon_chars = JSON.stringify(storyUserPayload.active_character_canon).length;
          timing.story_request_chars = messages[0].content.length + messages[1].content.length;
          timing.active_character_count = Object.keys(storyUserPayload.active_character_canon ?? {}).length;
          timing.recent_turn_count = Array.isArray(storyUserPayload.context?.recent_turns) ? storyUserPayload.context.recent_turns.length : 0;
          const stream = await streamStory({ env, fetchImpl, messages, timing });
          for await (const text of stream.chunks) {
            raw += text;
            emit('delta', { text });
          }
          const parsed = parseNarrative(raw, { master });
          await db.callRpc('record_story_result', { p_game_id: gameId, p_action_id: actionId, p_story_text: raw, p_parsed_blocks: parsed });
          storyPersisted = true;
          emit('complete', { action_id: meta.action_id, turn_id: meta.turn_id, warnings: parsed.warnings, replayed: false });
        } catch (error) {
          if (!storyPersisted) {
            await db.updateActionStatus(gameId, actionId, 'story_failed', error.code ?? 'story_failed').catch(() => undefined);
          }
          throw error;
        } finally {
          logTurnTiming({
            event_stage: 'story', request_id: requestId, action_id: meta.action_id, game_id: gameId, expected_turn: meta.expected_turn,
            context_rpc_ms: timing.context_rpc_ms, story_prompt_ms: timing.story_prompt_ms, story_headers_ms: timing.story_headers_ms,
            story_first_content_ms: timing.story_first_content_ms, story_network_total_ms: timing.story_network_total_ms,
            story_character_count: timing.story_character_count,
            story_system_chars: timing.story_system_chars, story_context_chars: timing.story_context_chars,
            active_character_canon_chars: timing.active_character_canon_chars, story_request_chars: timing.story_request_chars,
            active_character_count: timing.active_character_count, recent_turn_count: timing.recent_turn_count,
            turn_total_ms: Date.now() - startedAt
          });
        }
      } });
    },

    async extract(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const { gameId, actionId } = actionIds(body);
      const db = createSupabaseClient(env, fetchImpl);
      const action = actionOrNotFound(await db.getAction(gameId, actionId));
      if (!action.story_text) throw new HttpError(409, 'story_required', 'A completed Story is required before Extract', true);
      if (action.extract_delta) {
        const extract = normalizeGameplayExtractEnvelope(action.extract_delta, { parsedStory: action.parsed_blocks ?? parseNarrative(action.story_text, { master }), npcIds });
        logTurnTiming({ event_stage: 'extract', request_id: requestId, action_id: actionId, game_id: gameId, replayed: true, turn_total_ms: Date.now() - startedAt });
        return ok({ action_id: actionId, extract, warnings: extract.warnings, replayed: true });
      }
      if (action.processing_status === 'extract_failed') {
        const claimedRetry = await db.claimActionStatus(gameId, actionId, 'extract_failed', 'extracting', null);
        if (!claimedRetry) throw new HttpError(409, 'action_in_progress', 'Action retry is already in progress', true);
        Object.assign(action, claimedRetry);
      }
      if (action.processing_status !== 'extracting') throw new HttpError(409, 'action_in_progress', 'Action is not ready for Extract', true);
      if (action.error_code === 'extract_in_progress') throw new HttpError(409, 'action_in_progress', 'Extract is already in progress', true);
      const claimedExtract = await db.claimActionStatus(gameId, actionId, 'extracting', 'extracting', 'extract_in_progress', true);
      if (!claimedExtract) throw new HttpError(409, 'action_in_progress', 'Extract is already in progress', true);
      Object.assign(action, claimedExtract);

      const timing = {};
      let degraded = false;
      try {
        const parsedStory = action.parsed_blocks ?? parseNarrative(action.story_text, { master });
        let extract;
        try {
          const contextRpcStart = Date.now();
          const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 15 });
          timing.context_rpc_ms = Date.now() - contextRpcStart;
          const hydratedContext = hydratedSaveContext(context, master);
          const promptStart = Date.now();
          const messages = buildExtractPrompt({ context: hydratedContext, storyText: action.story_text, parsedStory, playerAction: action.player_action, expectedTurn: action.expected_turn, edition, npcIds });
          timing.extract_prompt_ms = Date.now() - promptStart;
          const extractUserPayload = JSON.parse(messages[1].content);
          timing.extract_system_chars = messages[0].content.length;
          timing.extract_context_chars = JSON.stringify(extractUserPayload.context).length;
          timing.parsed_story_chars = JSON.stringify(extractUserPayload.parsed_story).length;
          timing.extract_request_chars = messages[0].content.length + messages[1].content.length;
          timing.active_character_count = activeCountFromNpcState(extractUserPayload.context?.active_npc_state);
          const llmStart = Date.now();
          const raw = await runExtract({ env, fetchImpl, messages });
          timing.extract_llm_ms = Date.now() - llmStart;
          const parseStart = Date.now();
          extract = normalizeGameplayExtractEnvelope(raw, { parsedStory, npcIds });
          timing.extract_parse_ms = Date.now() - parseStart;
        } catch (error) {
          const degradable = (error instanceof HttpError && EXTRACT_DEGRADE_CODES.has(error.code))
            || (error instanceof GameCoreError && error.code === 'INVALID_EXTRACT');
          if (!degradable) {
            await db.updateActionStatus(gameId, actionId, 'extract_failed', error.code ?? 'extract_failed').catch(() => undefined);
            throw error;
          }
          degraded = true;
          extract = buildDegradedExtractEnvelope({ parsedStory, playerAction: action.player_action, extraWarnings: [`extract_error:${error.code ?? error.name ?? 'unknown'}`] });
        }
        try {
          await db.callRpc('record_extract_result', { p_game_id: gameId, p_action_id: actionId, p_extract_delta: extract });
        } catch (error) {
          await db.updateActionStatus(gameId, actionId, 'extract_failed', error.code ?? 'extract_failed').catch(() => undefined);
          throw error;
        }
        try {
          await db.updateActionStatus(gameId, actionId, 'committing');
        } catch {
          // The Extract result is already durably saved; a failed status-transition patch must
          // not turn a successful Extract into a stuck action, so resync with the source of truth.
          await db.getAction(gameId, actionId).catch(() => null);
        }
        return ok({ action_id: actionId, extract, warnings: extract.warnings, replayed: false, degraded });
      } finally {
        logTurnTiming({
          event_stage: 'extract', request_id: requestId, action_id: actionId, game_id: gameId,
          context_rpc_ms: timing.context_rpc_ms, extract_prompt_ms: timing.extract_prompt_ms, extract_llm_ms: timing.extract_llm_ms,
          extract_parse_ms: timing.extract_parse_ms, extract_degraded: degraded,
          extract_system_chars: timing.extract_system_chars, extract_context_chars: timing.extract_context_chars,
          parsed_story_chars: timing.parsed_story_chars, extract_request_chars: timing.extract_request_chars,
          active_character_count: timing.active_character_count,
          turn_total_ms: Date.now() - startedAt
        });
      }
    },

    async commit(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const { gameId, actionId } = actionIds(body);
      const expectedTurn = body.expected_turn;
      if (!Number.isInteger(expectedTurn) || expectedTurn < 1) throw new HttpError(400, 'invalid_request', 'expected_turn must be a positive integer');
      const db = createSupabaseClient(env, fetchImpl);
      const timing = {};
      try {
        const action = actionOrNotFound(await db.getAction(gameId, actionId));
        if (!action.story_text || !action.extract_delta) throw new HttpError(409, 'action_incomplete', 'Story and Extract are required before Commit', true);
        const contextRpcStart = Date.now();
        const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 15 });
        timing.context_rpc_ms = Date.now() - contextRpcStart;
        const currentSave = context.save?.data ?? context.save;
        const parsedStory = action.parsed_blocks ?? parseNarrative(action.story_text, { master });
        const extract = normalizeGameplayExtractEnvelope(action.extract_delta, { parsedStory, npcIds });

        const mergeStart = Date.now();
        const merged = applyGuardedStateDelta(currentSave, extract, {
          expectedTurn, actionId, turnId: action.turn_id, playerAction: action.player_action, parsedStory, master, npcIds
        });
        timing.guarded_merge_ms = Date.now() - mergeStart;
        const { nextSave, warnings } = merged;
        const turnChanges = deriveTurnChanges(currentSave, nextSave);

        const commitRpcStart = Date.now();
        const commit = await db.callRpc('commit_company_turn', {
          p_game_id: gameId, p_action_id: actionId, p_expected_turn: expectedTurn,
          p_next_save: nextSave, p_turn_summary: extract.turn_summary,
          p_mind_monitor: merged.mind_monitor, p_choices: extract.choices
        });
        timing.commit_rpc_ms = Date.now() - commitRpcStart;
        return ok({
          commit, next_save: nextSave, warnings, turn_changes: turnChanges,
          time_before: merged.time_before, elapsed_minutes: merged.elapsed_minutes, time_after: merged.time_after
        });
      } finally {
        logTurnTiming({
          event_stage: 'commit', request_id: requestId, action_id: actionId, game_id: gameId, expected_turn: expectedTurn,
          context_rpc_ms: timing.context_rpc_ms, guarded_merge_ms: timing.guarded_merge_ms, commit_rpc_ms: timing.commit_rpc_ms,
          turn_total_ms: Date.now() - startedAt
        });
      }
    },

    async actionStatus(request, env) {
      const body = await readJson(request);
      const { gameId, actionId } = actionIds(body);
      const db = createSupabaseClient(env, fetchImpl);
      const status = await db.callRpc('get_action_status', { p_game_id: gameId, p_action_id: actionId });
      return ok({ status, recoverable_step: deriveRecoverableStep(status) });
    },

    /** Restores turn/action/history/player/opening_state to the game_master initial save. Static content and game_master are never touched. */
    async reset(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, 'game_id');
      const db = createSupabaseClient(env, fetchImpl);
      try {
        const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 1 });
        const title = context?.game?.title;
        if (typeof title !== 'string' || !title) throw new HttpError(502, 'invalid_game_title', 'Game title is missing or invalid', false);
        const result = await db.callRpc('reset_company_game', { p_game_id: gameId, p_expected_title: title });
        return ok({ reset: result });
      } finally {
        logTurnTiming({ event_stage: 'reset', request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },

    /** Server-side re-validates the submission against the catalog allow-lists and rolls one crypto-seeded opening plan, reused by every /api/opening retry. */
    async playerSetup(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, 'game_id');
      const db = createSupabaseClient(env, fetchImpl);
      try {
        const validation = validatePlayerSetupInput(body.player, catalogs);
        if (!validation.valid) throw new HttpError(400, 'invalid_player_setup', `Invalid player setup: ${validation.errors.join(', ')}`, false);
        const setupId = randomUuid();
        const openingPlan = buildOpeningPlan({ positionId: validation.player.position_id, seedBytes: randomSeedBytes(), heroineIds });
        const result = await db.callRpc('reserve_company_player_setup', {
          p_game_id: gameId, p_setup_id: setupId, p_player: validation.player, p_opening_plan: openingPlan
        });
        return ok({ setup_id: result.setup_id, player: result.player, opening_state: result.opening_state });
      } finally {
        logTurnTiming({ event_stage: 'player_setup', request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },

    /** Streams and commits the turn-0 opening. Never re-sends player profile or plan from the client; the server reads its own saved values. A completed setup_id replays with zero LLM calls. */
    async opening(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, 'game_id');
      const setupId = requireString(body.setup_id, 'setup_id');
      const db = createSupabaseClient(env, fetchImpl);
      const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 1 });
      const hydratedContext = hydratedSaveContext(context, master);
      const preSave = hydratedContext.save?.data ?? hydratedContext.save;
      if (preSave?.player_setup?.setup_id !== setupId) throw new HttpError(409, 'setup_id_mismatch', 'Player setup does not match the current game state', false);

      if (preSave?.player_setup?.completed === true && preSave?.opening_state?.status === 'complete') {
        return storySse({ meta: { setup_id: setupId, replayed: true }, run: async emit => {
          emit('delta', { text: preSave.opening_state.story_text });
          emit('complete', { setup_id: setupId, choices: preSave.opening_state.choices, replayed: true });
        } });
      }

      return storySse({ meta: { setup_id: setupId, replayed: false }, run: async emit => {
        const timing = {};
        try {
          const openingPlan = preSave.opening_state?.plan;
          if (!openingPlan) throw new HttpError(409, 'opening_plan_missing', 'No opening plan was saved for this setup', false);
          const player = preSave.player ?? {};
          const canonical = resolvePlayerCanonicalNames(player, catalogs);
          const messages = buildOpeningPrompt({ edition, player, canonical, openingPlan });
          const stream = await streamStory({ env, fetchImpl, messages, timing });
          let raw = '';
          for await (const text of stream.chunks) {
            raw += text;
            emit('delta', { text });
          }
          const { background, body: sections, warnings: splitWarnings } = splitOpeningSections(raw);
          const parsedOpening = parseNarrative(sections, { master });
          const commit = await db.callRpc('commit_company_opening', {
            p_game_id: gameId,
            p_setup_id: setupId,
            p_background: background,
            p_story_text: parsedOpening.raw,
            p_choices: parsedOpening.choices
          });
          emit('complete', {
            setup_id: setupId, choices: parsedOpening.choices, background,
            warnings: [...splitWarnings, ...parsedOpening.warnings], replayed: false, commit
          });
        } finally {
          logTurnTiming({
            event_stage: 'opening', request_id: requestId, game_id: gameId,
            story_headers_ms: timing.story_headers_ms, story_first_content_ms: timing.story_first_content_ms,
            story_network_total_ms: timing.story_network_total_ms, story_character_count: timing.story_character_count,
            turn_total_ms: Date.now() - startedAt
          });
        }
      } });
    }
  };
}
