import { HttpError, ok, readJson, requireString, sseEvent, sseResponse } from './http.js';
import { createSupabaseClient } from './supabase.js';
import { runExtract, streamStory, runSpeakerTagging } from './llm.js';
import {
  collectUnresolvedDialogue,
  buildTaggingMessages,
  buildSceneCandidateIds,
  applySpeakerTags,
  allowedSpeakerIds
} from '../engine/speaker-tagger.js';
import { buildFullPlayerInfo } from './product-recovery.js';
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
  validatePlayerSetupInput,
  buildAppManualPayload,
  buildAppStatePayload,
  buildAppUsageStorySection,
  buildCsaAftereffectPatch,
  buildCsaSceneRuntimeStatePatch,
  buildCsaAcceptanceScopeSection,
  buildCsaApplicationCheckSection,
  buildCsaDeactivationStorySection,
  buildCsaDirectExecutionPrioritySection,
  buildCsaPersistentSceneSection,
  buildCsaPhysicalTransitionSection,
  buildCsaPublicSceneSection,
  buildCsaRuntimeExtractContractSection,
  buildChoiceStructuredMetaExtractContractSection,
  buildCsaSemanticContract,
  buildCsaRuntimeSection,
  buildCsaWeakSynergySection,
  buildMindEffectExtractFirewallSection,
  buildNpcCsaEpistemicFirewallSection,
  buildStructuredActionStorySection,
  calculateCsaCapability,
  classifyAppOperationStrengths,
  collectSemanticStrengthCandidates,
  getApplicableCsaEntries,
  getCsaLimits,
  getCsaRules,
  isAppUsageInfoRequest,
  normalizeStructuredAction,
  normalizeCompanyCsaCatalog,
  planCsaTransaction,
  resolveCsaDirectCoverage,
  buildCsaDirectCoverageSection,
  semanticStrengthIssues,
  sha256Base64url,
  signAppValidationProof,
  stableStringify,
  verifyStructuredActionValidation,
  buildRegenerationFeedbackSection,
  resolveNumberedChoiceInput,
  selectImage,
  resolveTtsEligibility,
  calculateProgress,
  calculateCsaProgression
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

/**
 * Once an action has been reserved, its stored structured_action is authoritative.
 * Repeated stages may resend the same value, but cannot substitute a different one.
 */
function structuredActionFor(action, requestedStructuredAction = null) {
  const stored = action?.structured_action ?? null;
  const requested = requestedStructuredAction ?? null;
  if (stored !== null && requested !== null && stableStringify(stored) !== stableStringify(requested)) {
    throw new HttpError(409, 'structured_action_mismatch', 'structured_action does not match the reserved action', false);
  }
  return stored ?? requested;
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
  return {
    characters: toEntryArray(edition?.characters?.characters, 'character_id'),
    general_npcs: toEntryArray(edition?.generalNpcs?.profiles, 'npc_id')
  };
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

function csaCatalogFromEdition(edition) {
  const source = plainObject(edition?.csaPresets) ? edition.csaPresets : { actor_options: [], target_options: [], trigger_options: [], duration_options: [], categories: [], items: [], sexual_action_contract: {} };
  return normalizeCompanyCsaCatalog(source);
}


function appValidationSecret(env) {
  return env?.APP_VALIDATION_SECRET || env?.SUPABASE_SERVICE_ROLE_KEY;
}

function playerInfoPayload(save, catalogs, capability) {
  const player = plainObject(save?.player) ? save.player : {};
  const canonical = resolvePlayerCanonicalNames(player, catalogs);
  return {
    name: typeof player.name === 'string' ? player.name : '',
    department: canonical.departmentName,
    position: canonical.positionName,
    speech_style: canonical.speechStyleName,
    level: capability.current_level,
    exp: capability.exp,
    next_level_exp: capability.next_level_exp,
    active_csa_count: capability.csa_active_count,
    max_active_csa: capability.csa_max_active
  };
}

/**
 * Re-verifies a structured_action's validation proof and re-derives its plan
 * fresh from the currently-persisted save — never trusts the client's own
 * plan content, only that the signed operations digest matches. Called
 * independently at Story, Extract, and Commit (matching the donor's own
 * re-derive-at-each-stage pattern) instead of persisting the plan once.
 */
async function resolveCsaTransactionPlan({ env, gameId, structuredAction, save, csaCatalog, expectedTurn }) {
  if (structuredAction == null) return null;
  const normalized = normalizeStructuredAction(structuredAction);
  if (!normalized) throw new HttpError(400, 'invalid_structured_action', 'structured_action has an invalid shape');
  const verification = await verifyStructuredActionValidation(appValidationSecret(env), gameId, structuredAction);
  if (!verification.ok) throw new HttpError(409, 'structured_action_invalid', 'structured_action failed validation-proof verification', false);
  if (normalized.base_turn_count !== expectedTurn - 1) throw new HttpError(409, 'app_stale_state', '상식개변 앱을 연 뒤 게임 상태가 변경되었습니다.', false);
  const capability = calculateCsaCapability(save, getApplicableCsaEntries(save).length);
  const plan = planCsaTransaction(save, csaCatalog, normalized.operations, { turnNumber: expectedTurn, capability });
  if (!plan.ok) throw new HttpError(422, (plan.error_code ?? 'app_action_invalid').toLowerCase(), '상식개변 앱 변경사항을 적용할 수 없습니다.', false);
  return plan;
}

/**
 * Appends the CSA-specific Story prompt sections onto an already-built messages array, only when
 * relevant. Runtime/acceptance/direct-execution-priority/persistent-scene and the physical-
 * transition guard are foundational contract language that applies to any active or just-changed
 * CSA regardless of its specific content, so they stay unconditional whenever this function
 * contributes anything at all (same as before). Public-scene and weak-synergy, by contrast, are
 * gated on properties the plan/catalog already validated — no active CSA is public, or fewer than
 * two are active — because false-including them costs tokens without changing any behavior, and
 * false-excluding them is never possible without a real signal (public_normalization is a
 * classified/validated field, not a guess; synergy is definitionally about >=2 rules). Deactivation
 * (hasDeactivation) and CSA direct coverage (coverage.covered) were already conditional before this
 * pass. This only trims prompt tokens — every gated section's underlying feature contract is
 * unchanged when its condition holds.
 */
function applyCsaStorySections(messages, { save, plan, playerAction, csaCatalog }) {
  const applicableCsa = getApplicableCsaEntries(save);
  const hasApplicableCsa = applicableCsa.length > 0;
  const isAppTransactionTurn = Boolean(plan);
  if (!hasApplicableCsa && !isAppTransactionTurn) return messages;
  const hasPublicCsa = applicableCsa.some(csa => csa.preset?.public_normalization === true || csa.semantic_contract?.public_normalization === true);
  const hasSynergyCandidate = applicableCsa.length >= 2;
  let extra = buildCsaRuntimeSection() + buildCsaAcceptanceScopeSection() + buildCsaDirectExecutionPrioritySection()
    + buildCsaPersistentSceneSection()
    + (hasPublicCsa ? buildCsaPublicSceneSection() : '')
    + (hasSynergyCandidate ? buildCsaWeakSynergySection() : '')
    + buildCsaPhysicalTransitionSection(hasApplicableCsa, isAppTransactionTurn);
  if (plan) {
    const csaOperations = plan.canonical_action.operations;
    const activeCsaCount = plan.next_csa_active.length;
    const level = calculateCsaCapability(save, activeCsaCount).current_level;
    extra += buildStructuredActionStorySection(csaOperations, activeCsaCount, getCsaLimits(level).max_active);
    extra += buildCsaDeactivationStorySection(csaOperations.some(operation => operation.operation === 'deactivate'));
  }
  if (hasApplicableCsa && playerAction) {
    const coverage = resolveCsaDirectCoverage(save, playerAction, { sexualActionContract: csaCatalog?.sexual_action_contract });
    extra += buildCsaDirectCoverageSection(coverage);
  }
  const next = [{ ...messages[0], content: messages[0].content + extra }, ...messages.slice(1)];
  next.push({ role: 'system', content: buildNpcCsaEpistemicFirewallSection() });
  return next;
}

export function createTurnRoutes({ fetchImpl, edition }) {
  const master = masterFromEdition(edition);
  const npcIds = npcIdsFromEdition(edition);
  const catalogs = catalogsFromEdition(edition);
  const heroineIds = Object.keys(edition?.characters?.characters ?? {});
  const csaCatalog = csaCatalogFromEdition(edition);

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

    /**
     * Read-only, paginated turn history. game_turns already carries everything needed (no new
     * RPC); record_status='active' dedupes a revised turn to only its current revision. Zero
     * LLM calls, zero mutation. player_inner_thought is read from the stored parsed_blocks;
     * only falls back to re-parsing story_text (never writing the result back to the DB) for a
     * legacy/empty parsed_blocks row.
     */
    async history(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, 'game_id');
      const beforeTurn = Number.isInteger(body.before_turn) && body.before_turn > 0 ? body.before_turn : null;
      const limit = Math.min(Math.max(Number.isInteger(body.limit) ? body.limit : 20, 1), 50);
      const db = createSupabaseClient(env, fetchImpl);
      try {
        const rows = await db.listTurns(gameId, { beforeTurn, limit: limit + 1 });
        const hasMore = rows.length > limit;
        const page = hasMore ? rows.slice(0, limit) : rows;
        const records = page.map(row => {
          const parsedBlocks = plainObject(row.parsed_blocks) && Object.keys(row.parsed_blocks).length
            ? row.parsed_blocks
            : parseNarrative(row.story_text ?? '', { master });
          return {
            turn_number: row.turn_number,
            player_input: row.player_action,
            player_action: row.player_action,
            story_text: row.story_text,
            parsed_blocks: parsedBlocks,
            turn_summary: row.turn_summary,
            mind_monitor: row.mind_monitor,
            player_inner_thought: typeof parsedBlocks?.player_inner_thought === 'string' ? parsedBlocks.player_inner_thought : '',
            structured_action: row.structured_action ?? null,
            feedback_text: row.feedback_text ?? null,
            committed_at: row.committed_at
          };
        });
        return ok({ records, has_more: hasMore, next_before_turn: hasMore ? page[page.length - 1]?.turn_number ?? null : null });
      } finally {
        logTurnTiming({ event_stage: 'history', request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },

    async story(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const { gameId, actionId } = actionIds(body);
      const expectedTurn = body.expected_turn;
      const requestedStructuredAction = body.structured_action ?? null;
      const playerAction = requireString(body.player_action, 'player_action');
      if (!Number.isInteger(expectedTurn) || expectedTurn < 1) throw new HttpError(400, 'invalid_request', 'expected_turn must be a positive integer');
      const db = createSupabaseClient(env, fetchImpl);
      // A feedback_revision action is reserved by /api/feedback (reserve_feedback_revision), not
      // reserve_turn_action — that RPC's "already exists" branch would report replayed:true even
      // though no Story has been generated for it yet, wrongly tripping the in-progress guard
      // below. Skip the normal-turn reservation entirely when the action already exists as one.
      const existingAction = await db.getAction(gameId, actionId).catch(() => null);
      const reservation = existingAction?.action_kind === 'feedback_revision'
        ? { action_id: existingAction.action_id, turn_id: existingAction.turn_id, expected_turn: existingAction.expected_turn, replayed: false }
        : await db.reserveTurnAction(gameId, actionId, expectedTurn, playerAction, requestedStructuredAction);
      const action = actionOrNotFound(existingAction ?? await db.getAction(gameId, actionId));
      const structuredAction = structuredActionFor(action, requestedStructuredAction);
      let retryingStory = false;
      // story_failed뿐 아니라 story_streaming(스토리 미완료 좌초)도 재시도를 허용한다.
      // 기존 액션은 reserve_turn_action이 replayed=true를 반환하므로,
      // 이 claim 없이는 (replayed && !retryingStory) 조건이 항상 409로 거부된다.
      if (!action.story_text && (action.processing_status === 'story_failed' || action.processing_status === 'story_streaming')) {
        const claimed = await db.claimActionStatus(gameId, actionId, action.processing_status, 'story_streaming', null);
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
          const hydratedSave = hydratedContext.save?.data ?? hydratedContext.save;
          const csaPlan = await resolveCsaTransactionPlan({ env, gameId, structuredAction, save: hydratedSave, csaCatalog, expectedTurn });
          const promptStart = Date.now();
          let messages = buildStoryPrompt({ edition, context: hydratedContext, playerAction, expectedTurn, npcIds, catalogs });
          messages = applyCsaStorySections(messages, { save: hydratedSave, plan: csaPlan, playerAction, csaCatalog });
          if (!csaPlan && isAppUsageInfoRequest(playerAction)) {
            messages = [{ ...messages[0], content: messages[0].content + buildAppUsageStorySection() }, ...messages.slice(1)];
          }
          if (action.action_kind === 'feedback_revision' && action.feedback_text) {
            messages = [{ ...messages[0], content: messages[0].content + buildRegenerationFeedbackSection(action.feedback_text) }, ...messages.slice(1)];
          }
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
          emit('complete', { action_id: meta.action_id, turn_id: meta.turn_id, warnings: parsed.warnings, replayed: false, parsed_blocks: parsed });
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
      const structuredAction = structuredActionFor(action, body.structured_action ?? null);
      if (action.extract_delta) {
        const replayParsedStory = action.parsed_blocks ?? parseNarrative(action.story_text, { master });
        const extract = normalizeGameplayExtractEnvelope(action.extract_delta, { parsedStory: replayParsedStory, npcIds });
        logTurnTiming({ event_stage: 'extract', request_id: requestId, action_id: actionId, game_id: gameId, replayed: true, turn_total_ms: Date.now() - startedAt });
        return ok({ action_id: actionId, extract, warnings: extract.warnings, replayed: true, parsed_blocks: replayParsedStory });
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
        let parsedStory = action.parsed_blocks ?? parseNarrative(action.story_text, { master });
        // 근본 해결: extract는 원본이 아니라 파서가 화자명을 확정·삽입한 normalized_raw를 본다.
        // → 화자명 없는 대사가 있어도 extract가 추론할 필요 없이 명시된 화자명을 그대로 쓴다.
        let storyForExtract = (parsedStory?.normalized_raw ?? '').trim() ? parsedStory.normalized_raw : action.story_text;
        let extract;
        try {
          const contextRpcStart = Date.now();
          const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 15 });
          timing.context_rpc_ms = Date.now() - contextRpcStart;
          const hydratedContext = hydratedSaveContext(context, master);
          const hydratedSave = hydratedContext.save?.data ?? hydratedContext.save;
          const csaPlan = await resolveCsaTransactionPlan({ env, gameId, structuredAction, save: hydratedSave, csaCatalog, expectedTurn: action.expected_turn });
          const applicableCsa = getApplicableCsaEntries(hydratedSave);
          const hasSexualCsa = applicableCsa.some(csa => buildCsaSemanticContract(csa, csaCatalog?.sexual_action_contract).sexual_authorization === true);
          // 스피커 태깅: parser가 dialogue block으로 분류했으나 화자 미확정(speaker_id=null)인
          // 대사가 있을 때만 전용 LLM을 1회 호출한다. 정상 턴(모두 확정)에서는 호출하지 않는다.
          // 멱등성: 태거 호출 전에 speaker_tagging_attempted=true를 조건부 PATCH로 먼저 영속하고,
          // 1행 갱신이 확인된 경우에만 호출한다. 저장 실패/타임아웃/무효 응답은 파이프라인을
          // 막지 않되, 로컬 태거 결과는 DB 저장이 확인된 경우에만 canonical로 승격한다.
          try {
            const playerName = hydratedSave?.player?.name ?? '플레이어';
            // 플레이어 정보는 master.player를 읽지 않고 실제 save + catalogs에서 동적으로 만든다
            const playerCanonical = resolvePlayerCanonicalNames(hydratedSave?.player ?? {}, catalogs);
            const playerInfo = {
              departmentName: playerCanonical?.departmentName ?? hydratedSave?.player?.department ?? '',
              positionName: playerCanonical?.positionName ?? '',
              roleTitle: typeof hydratedSave?.player?.role_title === 'string' ? hydratedSave.player.role_title : '',
              addresses: []
            };
            const sceneParticipantIds = buildSceneCandidateIds(parsedStory, {
              sceneParticipants: Array.isArray(hydratedSave?.last_npcs_present) ? hydratedSave.last_npcs_present : [],
              focalCharacterId: hydratedSave?.focal_character_id ?? null,
              lastSpeakerId: hydratedSave?.last_speaker_id ?? null
            });
            const unresolvedItems = collectUnresolvedDialogue(parsedStory);
            const attempted = action.parsed_blocks?.speaker_tagging_attempted === true;
            if (unresolvedItems.length && !attempted) {
              // 1) 호출 전 시도 상태 영속 — 1행 갱신이 확인돼야 태거를 호출한다
              const claimed = await db.markSpeakerTaggingAttempted(gameId, actionId, parsedStory);
              if (claimed) {
                const tagMessages = buildTaggingMessages(parsedStory, master, {
                  playerName, playerInfo,
                  sceneParticipants: sceneParticipantIds,
                  focalCharacterId: hydratedSave?.focal_character_id ?? null,
                  lastSpeakerId: hydratedSave?.last_speaker_id ?? null
                });
                const tagStart = Date.now();
                const tagResult = await runSpeakerTagging({
                  env, fetchImpl,
                  messages: tagMessages,
                  allowlist: allowedSpeakerIds(master),
                  timeoutMs: 10000
                });
                timing.tagging_ms = Date.now() - tagStart;
                timing.speaker_tagging_attempted = 1;
                timing.speaker_tagging_unresolved_count = unresolvedItems.length;
                if (tagResult.warning) timing.speaker_tagging_warning = tagResult.warning;

                // 상태 결정: applied | unresolved | timeout | invalid_response | upstream_failure
                let status = 'unresolved';
                if (tagResult.warning === 'speaker_tagging_timeout') status = 'timeout';
                else if (tagResult.warning === 'speaker_tagging_upstream_failure') status = 'upstream_failure';
                else if (tagResult.warning === 'speaker_tagging_invalid_json' || tagResult.warning === 'speaker_tagging_truncated') status = 'invalid_response';
                else if (tagResult.speakers?.some(s => s.speaker_id)) status = 'applied';

                if (status === 'applied') {
                  const applied = applySpeakerTags(parsedStory, tagResult.speakers, master, { playerName, unresolvedItems });
                  timing.speaker_tagging_resolved_count = applied.appliedCount;
                  timing.speaker_tagging_rejected_count = applied.rejectedCount;
                  if (applied.changed) {
                    // 2) 최종 결과 PATCH — return=representation으로 실제 저장 성공 확인
                    const saved = await db.updateActionParsedBlocks(gameId, actionId, applied.parsedStory);
                    if (saved) {
                      // 저장이 확인된 taggedParsedStory만 canonical로 승격 (화면·extract·commit·reload 일치)
                      parsedStory = applied.parsedStory;
                      storyForExtract = applied.parsedStory.normalized_raw.trim() ? applied.parsedStory.normalized_raw : storyForExtract;
                    } else {
                      // 저장 실패 → 로컬 태거 결과 사용 금지, parser 결과로 계속
                      timing.speaker_tagging_error = 'parsed_blocks_save_failed';
                      await db.updateSpeakerTaggingStatus(gameId, actionId, { ...parsedStory, speaker_tagging_attempted: true }, 'unresolved').catch(() => undefined);
                    }
                  } else {
                    await db.updateSpeakerTaggingStatus(gameId, actionId, { ...parsedStory, speaker_tagging_attempted: true }, 'unresolved').catch(() => undefined);
                  }
                } else {
                  // 적용할 항목 없음 — 시도 상태만 남기고 parser 결과로 계속
                  await db.updateSpeakerTaggingStatus(gameId, actionId, { ...parsedStory, speaker_tagging_attempted: true }, status).catch(() => undefined);
                }
              } else {
                timing.speaker_tagging_error = 'attempt_marker_save_failed';
              }
            }
          } catch (tagError) {
            timing.speaker_tagging_error = String(tagError?.message ?? tagError).slice(0, 200);
          }

          const promptStart = Date.now();
          let messages = buildExtractPrompt({ context: hydratedContext, storyText: storyForExtract, parsedStory, playerAction: action.player_action, expectedTurn: action.expected_turn, edition, npcIds });
          const extractFirewall = buildMindEffectExtractFirewallSection({ hasApplicableCsa: applicableCsa.length > 0, hasCsaTransaction: Boolean(csaPlan) })
            + buildCsaApplicationCheckSection(applicableCsa)
            + buildCsaRuntimeExtractContractSection(applicableCsa)
            + buildChoiceStructuredMetaExtractContractSection(hasSexualCsa);
          if (extractFirewall) messages = [{ ...messages[0], content: messages[0].content + extractFirewall }, ...messages.slice(1)];
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
        return ok({ action_id: actionId, extract, warnings: extract.warnings, replayed: false, degraded, parsed_blocks: parsedStory });
      } finally {
        logTurnTiming({
          event_stage: 'extract', request_id: requestId, action_id: actionId, game_id: gameId,
          context_rpc_ms: timing.context_rpc_ms, extract_prompt_ms: timing.extract_prompt_ms, extract_llm_ms: timing.extract_llm_ms,
          extract_parse_ms: timing.extract_parse_ms, extract_degraded: degraded,
          extract_system_chars: timing.extract_system_chars, extract_context_chars: timing.extract_context_chars,
          parsed_story_chars: timing.parsed_story_chars, extract_request_chars: timing.extract_request_chars,
          active_character_count: timing.active_character_count,
          tagging_ms: timing.tagging_ms, speaker_tagging_attempted: timing.speaker_tagging_attempted,
          speaker_tagging_unresolved_count: timing.speaker_tagging_unresolved_count,
          speaker_tagging_resolved_count: timing.speaker_tagging_resolved_count,
          speaker_tagging_rejected_count: timing.speaker_tagging_rejected_count,
          speaker_tagging_warning: timing.speaker_tagging_warning,
          speaker_tagging_error: timing.speaker_tagging_error,
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
        const structuredAction = structuredActionFor(action, body.structured_action ?? null);
        if (!action.story_text || !action.extract_delta) throw new HttpError(409, 'action_incomplete', 'Story and Extract are required before Commit', true);
        const contextRpcStart = Date.now();
        const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 15 });
        timing.context_rpc_ms = Date.now() - contextRpcStart;
        const currentSave = context.save?.data ?? context.save;
        let parsedStory = action.parsed_blocks ?? parseNarrative(action.story_text, { master });
        const extract = normalizeGameplayExtractEnvelope(action.extract_delta, { parsedStory, npcIds });

        const mergeStart = Date.now();
        const merged = applyGuardedStateDelta(currentSave, extract, {
          expectedTurn, actionId, turnId: action.turn_id, playerAction: action.player_action, parsedStory, master, npcIds,
          storyText: (parsedStory?.normalized_raw ?? '').trim() ? parsedStory.normalized_raw : action.story_text
        });
        timing.guarded_merge_ms = Date.now() - mergeStart;
        const { nextSave, warnings } = merged;
        // The app transaction never gets its own save API — its csa_active/csa_rules result rides
        // through this same guarded-merge commit, applied on top of the normal Extract delta.
        const csaPlan = await resolveCsaTransactionPlan({ env, gameId, structuredAction, save: currentSave, csaCatalog, expectedTurn });
        if (csaPlan) {
          nextSave.csa_active = csaPlan.next_csa_active;
          nextSave.csa_rules = csaPlan.next_csa_rules;
        }
        // Extract's csa_trigger_evaluations/csa_runtime_updates persist scene-execution
        // status (active/temporarily_interrupted/paused/ended) into next turn's Context.
        // Validated per-item against the *post-transaction* active-preset-CSA set and the
        // NPCs actually present this turn — an item naming anything else is silently
        // dropped inside buildCsaRuntimeStatePatch itself.
        const activeCsaAfterPlan = getApplicableCsaEntries(nextSave);
        const runtimeStatePatch = buildCsaSceneRuntimeStatePatch({
          previousSave: currentSave, csaRuntimeUpdates: extract.csa_runtime_updates, csaTriggerEvaluations: extract.csa_trigger_evaluations,
          activeCsa: activeCsaAfterPlan, npcsPresent: nextSave.last_npcs_present, turnNumber: expectedTurn
        });
        if (runtimeStatePatch) nextSave.csa_runtime_state = { ...(nextSave.csa_runtime_state ?? {}), ...runtimeStatePatch };
        if (csaPlan) {
          const deactivatedIds = csaPlan.canonical_action.operations.filter(operation => operation.operation === 'deactivate').map(operation => operation.id);
          if (deactivatedIds.length) {
            const aftereffectPatch = buildCsaAftereffectPatch({ previousSave: nextSave, deactivatedIds, npcsPresent: nextSave.last_npcs_present, turnNumber: expectedTurn });
            if (aftereffectPatch) nextSave.csa_aftereffect_state = aftereffectPatch;
          }
        }
        // Player level/exp — ported verbatim from donor's live calculateProgress/
        // calculateCsaProgression (see src/engine/progression.js); Company had no progression
        // writer of its own before this. Never grants exp on a degraded-Extract turn or for a
        // feedback revision (replacing a turn's content is not a new turn earning fresh exp).
        if (action.action_kind !== 'feedback_revision') {
          const experiencedThisTurn = (Array.isArray(extract.csa_runtime_updates) ? extract.csa_runtime_updates : [])
            .filter(update => update.status === 'active')
            .map(update => ({ character_id: update.character_id, csa_id: update.csa_id }));
          const previouslyExperienced = new Set(Array.isArray(currentSave.csa_experienced_ids) ? currentSave.csa_experienced_ids : []);
          const progressionAmount = calculateCsaProgression({
            csaOperations: csaPlan?.canonical_action?.operations ?? [], experiencedThisTurn, previouslyExperienced,
            degraded: extract.outcome === 'degraded'
          });
          if (progressionAmount.newly_experienced_keys.length) {
            nextSave.csa_experienced_ids = [...previouslyExperienced, ...progressionAmount.newly_experienced_keys];
          }
          if (progressionAmount.amount > 0) {
            const progress = calculateProgress(currentSave.player_progress, progressionAmount.amount);
            nextSave.player_progress = { level: progress.level, exp: progress.exp };
          }
        }
        const turnChanges = deriveTurnChanges(currentSave, nextSave);

        const commitRpcStart = Date.now();
        // A feedback-revision action never advances committed_turn — it replaces the content of
        // the turn it targets, preserved as a new revision row (record_status flips the prior
        // one to 'superseded'), so it goes through commit_feedback_revision instead of the
        // normal expected_turn-advancing commit_company_turn.
        const commit = action.action_kind === 'feedback_revision'
          ? await db.commitFeedbackRevision(gameId, actionId, action.revision_request_id, nextSave, extract.turn_summary, merged.mind_monitor, extract.choices)
          : await db.callRpc('commit_company_turn', {
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

    /**
     * Deterministic, zero-LLM image selection. Queries only the requested character's active
     * rows for the requested pool (at most 8, already ordered by curation_rank at the DB layer)
     * and scores them in image-selector.js — the full image_library catalog never reaches this
     * route's caller, let alone a Story prompt. A selection failure (no candidates in either
     * pool) returns image: null rather than throwing; this must never block a turn.
     */
    async image(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, 'game_id');
      const characterId = requireString(body.character_id, 'character_id');
      const pool = body.pool === 'sex' ? 'sex' : 'general';
      const db = createSupabaseClient(env, fetchImpl);
      try {
        const candidates = await db.listImageCandidates(characterId, pool);
        const selected = selectImage(candidates, {
          situation: typeof body.situation === 'string' ? body.situation : null,
          tags: Array.isArray(body.tags) ? body.tags : [],
          locationId: typeof body.location_id === 'string' ? body.location_id : null
        });
        return ok({ character_id: characterId, image: selected });
      } finally {
        logTurnTiming({ event_stage: 'image', request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },

    /**
     * TTS is opt-in and only ever called by the frontend for a confirmed, already-rendered
     * dialogue line — this route's own job is the server-side backstop: narrator lines, unknown
     * speakers, and characters with no voice_id are all rejected before any external call is
     * made, regardless of what the client requests. A rejection or an upstream TTS failure
     * returns a normal error response; it can never fail Story/Extract/Commit since nothing in
     * that pipeline ever calls this route.
     */
    async tts(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, 'game_id');
      const text = requireString(body.text, 'text');
      const speakerId = typeof body.character_id === 'string' ? body.character_id : null;
      try {
        const eligibility = resolveTtsEligibility({ speakerId, text, master });
        if (!eligibility.eligible) throw new HttpError(422, eligibility.code.toLowerCase(), 'TTS를 재생할 수 없습니다.', false);
        const ttsUrl = env?.TTS_API_URL;
        const ttsKey = env?.TTS_API_KEY;
        if (typeof ttsUrl !== 'string' || !ttsUrl || typeof ttsKey !== 'string' || !ttsKey) {
          throw new HttpError(500, 'configuration_error', 'TTS_API_URL/TTS_API_KEY is not configured', false);
        }
        let response;
        try {
          response = await fetchImpl(ttsUrl, {
            method: 'POST',
            headers: { authorization: `Bearer ${ttsKey}`, 'content-type': 'application/json' },
            body: JSON.stringify({ voice_id: eligibility.voice_id, text })
          });
        } catch {
          throw new HttpError(502, 'tts_upstream_failure', 'TTS upstream request failed', true);
        }
        if (!response.ok) throw new HttpError(502, 'tts_upstream_failure', 'TTS upstream request failed', true);
        return new Response(response.body, { headers: { 'content-type': response.headers.get('content-type') ?? 'audio/mpeg', 'cache-control': 'public, max-age=86400' } });
      } finally {
        logTurnTiming({ event_stage: 'tts', request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },

    async actionStatus(request, env) {
      const body = await readJson(request);
      const { gameId, actionId } = actionIds(body);
      const db = createSupabaseClient(env, fetchImpl);
      const status = await db.callRpc('get_action_status', { p_game_id: gameId, p_action_id: actionId });
      return ok({ status, recoverable_step: deriveRecoverableStep(status) });
    },

    /**
     * Rollback-only: reserve_feedback_revision never calls Story/Extract itself, it just stages
     * a feedback_revision action targeting the latest committed turn and returns everything the
     * frontend needs to regenerate it through the completely normal /api/story -> /api/extract
     * -> /api/commit pipeline (commit() branches to commit_feedback_revision for this
     * action_kind). revision_request_id is client-supplied, matching action_id's own
     * idempotency contract — the same request replayed with the same id returns the same
     * pending/committed action rather than reserving a second one.
     */
    async feedback(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, 'game_id');
      const revisionRequestId = requireString(body.revision_request_id, 'revision_request_id');
      const feedbackText = requireString(body.feedback_text, 'feedback_text');
      const db = createSupabaseClient(env, fetchImpl);
      try {
        const reservation = await db.reserveFeedbackRevision(gameId, revisionRequestId, feedbackText);
        return ok({
          action_id: reservation.action_id,
          expected_turn: reservation.target_turn_number,
          original_player_action: reservation.original_player_action,
          structured_action: reservation.structured_action ?? null,
          revision_request_id: revisionRequestId,
          replayed: Boolean(reservation.replayed)
        });
      } finally {
        logTurnTiming({ event_stage: 'feedback', request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
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
        const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 1 });
        const existingSetupId = (context?.save?.data ?? context?.save)?.player_setup?.setup_id;
        if (typeof existingSetupId === 'string' && existingSetupId) {
          throw new HttpError(409, 'opening_retry_required', 'A player setup is already reserved; retry the opening or reset the game first', false);
        }
        const setupId = randomUuid();
        const openingPlan = buildOpeningPlan({ positionId: validation.player.position_id, seedBytes: randomSeedBytes(), heroineIds, locations: edition?.map?.locations });
        const result = await db.callRpc('reserve_company_player_setup', {
          p_game_id: gameId, p_setup_id: setupId, p_player: validation.player, p_opening_plan: openingPlan
        });
        return ok({ setup_id: result.setup_id, opening_plan: result.opening_plan, idempotent: Boolean(result.idempotent) });
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
    },

    /** Read-only. Context fetch only — no mutation, no LLM call. */
    async appManual(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, 'game_id');
      const db = createSupabaseClient(env, fetchImpl);
      try {
        const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 1 });
        const save = hydratedSaveContext(context, master).save?.data ?? context.save?.data ?? context.save;
        return ok({ manual: buildAppManualPayload(save, csaCatalog) });
      } finally {
        logTurnTiming({ event_stage: 'app_manual', request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },

    /** Read-only. Context fetch only — no mutation, no LLM call. Single source for every dropdown the app UI renders. */
    async appState(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, 'game_id');
      const db = createSupabaseClient(env, fetchImpl);
      try {
        const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 1 });
        const save = hydratedSaveContext(context, master).save?.data ?? context.save?.data ?? context.save;
        const capability = calculateCsaCapability(save, getApplicableCsaEntries(save).length);
        const player = buildFullPlayerInfo(save, edition);
        return ok({ app: buildAppStatePayload(save, csaCatalog, csaCatalog.sexual_action_contract, player) });
      } finally {
        logTurnTiming({ event_stage: 'app_state', request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },


    /**
     * Read-only preflight: plans the transaction deterministically (activate/update/deactivate,
     * preset validation, slot/strength caps), and — only for custom (non-preset) operations —
     * makes exactly one LLM call to classify the required strength. Signs a validation_proof the
     * client carries unmodified into /api/story, /api/extract, /api/commit, each of which
     * independently re-verifies it and re-derives the same plan; this route never mutates state.
     */
    async appValidate(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, 'game_id');
      const db = createSupabaseClient(env, fetchImpl);
      let contextRpcCalls = 0;
      let llmCalls = 0;
      try {
        const normalized = normalizeStructuredAction(body.structured_action);
        if (!normalized) throw new HttpError(400, 'invalid_structured_action', 'structured_action has an invalid shape', false);
        contextRpcCalls += 1;
        const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 1 });
        const save = hydratedSaveContext(context, master).save?.data ?? context.save?.data ?? context.save;
        const committedTurn = Number.isInteger(save?.turn_state?.committed_turn) ? save.turn_state.committed_turn : 0;
        if (normalized.base_turn_count !== committedTurn) {
          throw new HttpError(409, 'app_stale_state', '상식개변 앱을 연 뒤 게임 상태가 변경되었습니다.', false);
        }
        const capability = calculateCsaCapability(save, getApplicableCsaEntries(save).length);
        const plan = planCsaTransaction(save, csaCatalog, normalized.operations, { turnNumber: committedTurn + 1, capability });
        if (!plan.ok) {
          throw new HttpError(plan.status ?? 422, (plan.error_code ?? 'app_action_invalid').toLowerCase(), '변경사항을 적용할 수 없습니다.', false, plan.issues);
        }

        const candidates = collectSemanticStrengthCandidates(save, plan.canonical_action, getCsaRules(save));
        let semanticResults = [];
        if (candidates.length) {
          llmCalls += 1;
          semanticResults = await classifyAppOperationStrengths(candidates, async systemPrompt =>
            runExtract({ env, fetchImpl, messages: [{ role: 'system', content: systemPrompt }] }));
          const issues = semanticStrengthIssues(candidates, semanticResults, capability.available_strength_id);
          if (issues.length) throw new HttpError(422, 'app_action_invalid', '변경사항을 적용할 수 없습니다.', false, issues);
        }

        let canonicalAction = plan.canonical_action;
        if (semanticResults.length) {
          const contractByClientId = new Map(semanticResults.map(item => [item.client_id, item.semantic_contract]));
          canonicalAction = {
            ...canonicalAction,
            operations: canonicalAction.operations.map(operation => (
              operation.source_type === 'custom' && contractByClientId.has(operation.client_id)
                ? { ...operation, semantic_contract: contractByClientId.get(operation.client_id) }
                : operation
            ))
          };
        }
        const actionDigest = await sha256Base64url(stableStringify({ version: canonicalAction.version, type: canonicalAction.type, base_turn_count: canonicalAction.base_turn_count, operations: canonicalAction.operations }));
        const resolvedResults = semanticResults.map(item => ({ client_id: item.client_id, required_strength: item.required_strength, semantic_contract: item.semantic_contract }));
        const semantic_validation = { version: 1, game_id: gameId, base_turn_count: canonicalAction.base_turn_count, action_digest: actionDigest, results: resolvedResults };
        const validation_proof = await signAppValidationProof(appValidationSecret(env), { game_id: gameId, base_turn_count: canonicalAction.base_turn_count, action_digest: actionDigest, semantic_results: resolvedResults });
        canonicalAction = { ...canonicalAction, semantic_validation, validation_proof };

        return ok({ canonical_action: canonicalAction, display_input: plan.display_input, summary: plan.summary });
      } finally {
        logTurnTiming({ event_stage: 'app_validate', request_id: requestId, game_id: gameId, context_rpc_ms: contextRpcCalls, llm_calls: llmCalls, turn_total_ms: Date.now() - startedAt });
      }
    }
  };
}
