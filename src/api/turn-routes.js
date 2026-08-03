import { HttpError, ok, readJson, requireString, sseEvent, sseResponse } from './http.js';
import { createSupabaseClient } from './supabase.js';
import { runExtract, streamStory } from './llm.js';
import {
  applyGuardedStateDelta,
  buildExtractPrompt,
  buildStoryPrompt,
  deriveRecoverableStep,
  normalizeExtractEnvelope,
  parseNarrative
} from '../engine/index.js';
import { GameCoreError } from '../engine/errors.js';

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
  return {
    async context(request, env) {
      const body = await readJson(request);
      const gameId = requireString(body.game_id, 'game_id');
      const recentTurns = Math.min(Math.max(Number.isInteger(body.recent_turns) ? body.recent_turns : 15, 1), 50);
      const db = createSupabaseClient(env, fetchImpl);
      const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: recentTurns });
      return ok({ context });
    },

    async story(request, env) {
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
        try {
          const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 15 });
          const messages = buildStoryPrompt({ edition, context, playerAction, expectedTurn });
          const stream = await streamStory({ env, fetchImpl, messages });
          for await (const text of stream) {
            raw += text;
            emit('delta', { text });
          }
          const parsed = parseNarrative(raw);
          await db.callRpc('record_story_result', { p_game_id: gameId, p_action_id: actionId, p_story_text: raw, p_parsed_blocks: parsed });
          storyPersisted = true;
          emit('complete', { action_id: meta.action_id, turn_id: meta.turn_id, warnings: parsed.warnings, replayed: false });
        } catch (error) {
          if (!storyPersisted) {
            await db.updateActionStatus(gameId, actionId, 'story_failed', error.code ?? 'story_failed').catch(() => undefined);
          }
          throw error;
        }
      } });
    },

    async extract(request, env) {
      const body = await readJson(request);
      const { gameId, actionId } = actionIds(body);
      const db = createSupabaseClient(env, fetchImpl);
      const action = actionOrNotFound(await db.getAction(gameId, actionId));
      if (!action.story_text) throw new HttpError(409, 'story_required', 'A completed Story is required before Extract', true);
      if (action.extract_delta) {
        const extract = normalizeExtractEnvelope(action.extract_delta);
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
      try {
        const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 15 });
        const parsedStory = action.parsed_blocks ?? parseNarrative(action.story_text);
        const messages = buildExtractPrompt({ context, storyText: action.story_text, parsedStory, playerAction: action.player_action, expectedTurn: action.expected_turn });
        const raw = await runExtract({ env, fetchImpl, messages });
        const extract = normalizeExtractEnvelope(raw);
        const storyChoices = Array.isArray(parsedStory?.choices)
          ? parsedStory.choices.filter(choice => typeof choice === 'string' && choice.trim())
          : [];
        if (storyChoices.length > 0) extract.choices = storyChoices;
        await db.callRpc('record_extract_result', { p_game_id: gameId, p_action_id: actionId, p_extract_delta: extract });
        await db.updateActionStatus(gameId, actionId, 'committing').catch(() => undefined);
        return ok({ action_id: actionId, extract, warnings: extract.warnings, replayed: false });
      } catch (error) {
        await db.updateActionStatus(gameId, actionId, 'extract_failed', error.code ?? 'extract_failed').catch(() => undefined);
        throw error;
      }
    },

    async commit(request, env) {
      const body = await readJson(request);
      const { gameId, actionId } = actionIds(body);
      const expectedTurn = body.expected_turn;
      if (!Number.isInteger(expectedTurn) || expectedTurn < 1) throw new HttpError(400, 'invalid_request', 'expected_turn must be a positive integer');
      const db = createSupabaseClient(env, fetchImpl);
      const action = actionOrNotFound(await db.getAction(gameId, actionId));
      if (!action.story_text || !action.extract_delta) throw new HttpError(409, 'action_incomplete', 'Story and Extract are required before Commit', true);
      const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 15 });
      const currentSave = context.save?.data ?? context.save;
      const extract = normalizeExtractEnvelope(action.extract_delta);
      const { nextSave, warnings } = applyGuardedStateDelta(currentSave, extract, {
        expectedTurn, actionId, turnId: action.turn_id, playerAction: action.player_action
      });
      const commit = await db.callRpc('commit_company_turn', {
        p_game_id: gameId, p_action_id: actionId, p_expected_turn: expectedTurn,
        p_next_save: nextSave, p_turn_summary: extract.turn_summary,
        p_mind_monitor: extract.mind_monitor, p_choices: extract.choices
      });
      return ok({ commit, next_save: nextSave, warnings });
    },

    async actionStatus(request, env) {
      const body = await readJson(request);
      const { gameId, actionId } = actionIds(body);
      const db = createSupabaseClient(env, fetchImpl);
      const status = await db.callRpc('get_action_status', { p_game_id: gameId, p_action_id: actionId });
      return ok({ status, recoverable_step: deriveRecoverableStep(status) });
    }
  };
}
