import { HttpError, ok, readJson, requireString, sseEvent, sseResponse } from './http.js';
import { createSupabaseClient } from './supabase.js';
import { runExtract, streamStory } from './llm.js';
import { isCanonicalNpcDestinationIntent, resolvePlayerNavigationIntent } from '../engine/scene-cast.js';
import { buildFullPlayerInfo } from './product-recovery.js';
import {
  buildExtractPrompt,
  buildMindMonitorTargetIds,
  buildDegradedExtractObservation,
  buildOpeningPlan,
  buildOpeningPrompt,
  buildStableNpcIdSet,
  buildStoryPrompt,
  buildStoryWorldProjection,
  buildInstitutionalSegments,
  composeCanonicalStory,
  attachEngineEnactments,
  deriveRecoverableStep,
  deriveTurnChanges,
  hydrateGameplayState,
  normalizeFreshExtractObservationV2,
  normalizePersistedExtractObservation,
  reduceGameplayCommit,
  reduceStoryChoiceProjection,
  parseFreshNarrativeV2,
  resolvePlayerCanonicalNames,
  splitOpeningSections,
  validatePlayerSetupInput,
  buildAppManualPayload,
  buildAppStatePayload,
  calculateCsaCapability,
  classifyAppOperationStrengths,
  collectSemanticStrengthCandidates,
  getApplicableCsaEntries,
  getCsaLimits,
  getCsaRules,
  normalizeStructuredAction,
  normalizeCompanyCsaCatalog,
  planCsaTransaction,
  semanticStrengthIssues,
  sha256Base64url,
  signTransactionValidationProof,
  buildTransactionResolution,
  verifySignedTransactionResolution,
  verifyStructuredActionValidation,
  stableStringify,
  resolveNumberedChoiceInput,
  selectImage,
  resolveStoredStructuredAction,
  assertStoredActionPersistenceParity,
  createStoryStreamDecoder,
  applyAuthorizedRuleDefinitions,
} from '../engine/index.js';
import { GameCoreError } from '../engine/errors.js';
import { StoredActionAuthorityError } from '../engine/runtime-core/action-authority.js';
import { readCanonicalSceneV1 } from '../engine/runtime-core/scene-reducer.js';
import { logTurnTiming, newRequestId } from './timing.js';

function asHttpError(error) {
  if (error instanceof HttpError) return error;
  if (error instanceof StoredActionAuthorityError) {
    return new HttpError(409, error.code, error.message, false);
  }
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

export function projectStorySaveForNavigation(save, navigationIntent, { master, mapLocations } = {}) {
  const locationId = navigationIntent?.kind === 'player_navigation'
    ? navigationIntent.destination_location_id
    : null;
  if (typeof locationId !== 'string' || !locationId.trim()) return save;
  const scene = readCanonicalSceneV1(save, { master, mapLocations });
  if (scene.location_id === locationId) return save;
  const presentNpcIds = isCanonicalNpcDestinationIntent(navigationIntent, { master, mapLocations })
    ? [navigationIntent.target_npc_id]
    : [];
  return {
    ...save,
    scene: {
      ...scene,
      version: 1,
      scene_id: locationId,
      location_id: locationId,
      beat: 0,
      goal: null,
      focus_thread: null,
      present_npc_ids: presentNpcIds,
      focal_character_id: presentNpcIds[0] ?? null,
      last_speaker_id: null
    }
  };
}

function projectCsaTransactionSave(save, structuredAction, transactionResolution, stage) {
  if (!structuredAction || !transactionResolution) return save;
  const projected = structuredClone(save ?? {});
  applyAuthorizedRuleDefinitions({
    currentSave: save,
    nextSave: projected,
    transactionResolution,
    structuredAction,
    stage
  });
  return projected;
}

function playerPrivateOriginFor(structuredAction, csaResolution) {
  if (!structuredAction || !csaResolution) return null;
  const operations = Array.isArray(structuredAction.operations) ? structuredAction.operations : [];
  const affected = [...new Set(operations
    .map(operation => operation?.id ?? operation?.rule_id ?? operation?.client_id)
    .filter(id => typeof id === 'string' && id.trim()))];
  const previousIds = new Set(Array.isArray(csaResolution.previous_csa_active) ? csaResolution.previous_csa_active : []);
  const nextIds = Array.isArray(csaResolution.next_csa_active) ? csaResolution.next_csa_active : [];
  for (const id of nextIds) if (!previousIds.has(id)) affected.push(id);
  for (const id of Object.keys(csaResolution.next_csa_rules ?? {})) {
    const before = csaResolution.previous_csa_rules?.[id];
    const after = csaResolution.next_csa_rules?.[id];
    if (JSON.stringify(before) !== JSON.stringify(after)) affected.push(id);
  }
  const operationSet = [...new Set(operations
    .map(operation => operation?.operation)
    .filter(operation => typeof operation === 'string' && operation.trim()))];
  return {
    kind: 'csa_transaction',
    initiated_by_player: true,
    operation: operationSet.length === 1 ? operationSet[0] : 'multiple',
    affected_rule_ids: [...new Set(affected)]
  };
}

function buildStoryTurnTrigger({ actionKind, csaResolution, preSave }) {
  if (actionKind === 'feedback_revision') return { kind: 'feedback_revision' };
  if (!csaResolution) return { kind: 'player_action' };
  const before = new Set(Array.isArray(preSave?.csa_active) ? preSave.csa_active : []);
  const after = new Set(Array.isArray(csaResolution.next_csa_active) ? csaResolution.next_csa_active : []);
  return {
    kind: 'institutional_rule_change',
    activated_rule_ids: [...after].filter(id => !before.has(id)),
    deactivated_rule_ids: [...before].filter(id => !after.has(id))
  };
}

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function turnContextFor({ save = {}, locationId = null, mapLocations = [] } = {}) {
  const time = plainObject(save?.world_state?.game_time) ? save.world_state.game_time : {};
  const resolvedId = typeof locationId === 'string' && locationId.trim()
    ? locationId.trim()
    : (typeof save?.scene?.location_id === 'string' ? save.scene.location_id : null);
  const location = (Array.isArray(mapLocations) ? mapLocations : []).find(item => item?.location_id === resolvedId);
  return {
    day: Number.isInteger(time.day) ? time.day : null,
    minute_of_day: Number.isInteger(time.minute_of_day) ? time.minute_of_day : null,
    location_id: resolvedId,
    location_name: typeof location?.name === 'string' ? location.name : resolvedId
  };
}

// 이미지 태그 allowlist — 알 수 없는 태그는 버린다 (턴70 지시 10).
const IMAGE_TAG_ALLOWLIST = new Set([
  // 성적 행동
  'handjob', 'fellatio', 'deepthroat', 'fingering', 'cunnilingus', 'breast_sucking',
  'missionary', 'doggystyle', 'cowgirl', 'anal', 'standing_rear', 'penetration',
  // 사정
  'facial_cumshot', 'body_cumshot', 'oral_cumshot', 'creampie', 'cumshot',
  // 장소·컨텍스트
  'office_desk', 'office', 'desk', 'meeting_room', 'private_room', 'lounge', 'restroom',
  // generic (성적 행동 매칭으로 보지 않음)
  'adult', 'sex', 'general', 'default', 'portrait', 'solo', 'sexual_generic'
]);

function normalizeImageTags(tags) {
  return [...new Set((Array.isArray(tags) ? tags : [])
    .filter(tag => typeof tag === 'string' && tag.trim())
    .map(tag => tag.trim())
    .filter(tag => IMAGE_TAG_ALLOWLIST.has(tag)))];
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

function openingTurnProjection(save) {
  const opening = plainObject(save?.opening_state) ? save.opening_state : null;
  if (opening?.status !== 'complete' || typeof opening.story_text !== 'string' || !opening.story_text.trim()) return null;
  const parsedBlocks = {
    ...(plainObject(opening.parsed_blocks) ? opening.parsed_blocks : {}),
    turn_context: {
      day: 1,
      minute_of_day: Number.isInteger(opening?.plan?.minute_of_day) ? opening.plan.minute_of_day : null,
      location_id: opening?.plan?.location_id ?? null,
      location_name: opening?.plan?.location_name ?? null
    }
  };
  const choices = Array.isArray(opening.choices) && opening.choices.length
    ? opening.choices
    : (Array.isArray(parsedBlocks?.choices) ? parsedBlocks.choices : []);
  return {
    player_action: '(opening)',
    story_text: opening.story_text,
    parsed_blocks: parsedBlocks,
    turn_summary: '',
    choices,
    turn_number: 0,
    turn_id: 'opening',
    action_id: 'opening'
  };
}

function withOpeningTurnProjection(context) {
  const save = context?.save?.data ?? context?.save;
  return { ...context, opening_turn: openingTurnProjection(save) };
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
  const source = plainObject(edition?.csaPresets) ? edition.csaPresets : { selector_options: [], strengths: [], categories: [], items: [] };
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
 * Re-verifies a structured_action's signed proof and reserved resolution
 * fresh from the currently-persisted save — never trusts the client's own
 * plan content, only that the signed operations digest matches. Called
 * independently at Story, Extract, and Commit (matching the donor's own
 * immutable proof and canonical definition parity. Legacy structured actions
 * retain their explicit compatibility verification.
 */
async function resolveSignedCsaTransactionResolution({ env, gameId, structuredAction, save, csaCatalog, expectedTurn }) {
  if (structuredAction == null) return null;
  const normalized = normalizeStructuredAction(structuredAction);
  if (!normalized) throw new HttpError(400, 'invalid_structured_action', 'structured_action has an invalid shape');
  if (!structuredAction.transaction_resolution) {
    const legacyVerification = await verifyStructuredActionValidation(appValidationSecret(env), gameId, structuredAction);
    if (!legacyVerification.ok) throw new HttpError(409, 'structured_action_invalid', 'legacy structured_action proof verification failed', false);
    if (normalized.base_turn_count !== expectedTurn - 1) throw new HttpError(409, 'app_stale_state', 'legacy structured_action base state is stale', false);
    const capability = calculateCsaCapability(save, getApplicableCsaEntries(save).length);
    const legacyPlan = planCsaTransaction(save, csaCatalog, normalized.operations, { turnNumber: expectedTurn, capability });
    if (!legacyPlan.ok) throw new HttpError(422, (legacyPlan.error_code ?? 'app_action_invalid').toLowerCase(), 'legacy structured_action is no longer valid', false);
    return legacyPlan;
  }
  const verification = await verifySignedTransactionResolution({ secret: appValidationSecret(env), gameId, structuredAction, save, expectedTurn });
  if (!verification.ok) {
    const code = verification.code ?? (verification.reason === 'missing transaction resolution' ? 'app_validation_expired' : 'structured_action_invalid');
    throw new HttpError(409, code, 'signed transaction resolution verification failed', false);
  }
  if (normalized.base_turn_count !== expectedTurn - 1) throw new HttpError(409, 'app_stale_state', '상식개변 앱을 연 뒤 게임 상태가 변경되었습니다.', false);
  return verification.resolution;
}

function emitStoryWireEvents(emit, events, timing, visibleStartedAt) {
  for (const event of events ?? []) {
    if (event.type === 'section_start') emit('section_start', event);
    else if (event.type === 'block_start') emit('block_start', event);
    else if (event.type === 'block_end') emit('block_end', event);
    else if (event.type === 'acting') emit('acting', event);
    else if (event.type === 'text_delta' && event.text) {
      if (timing && timing.story_visible_first_content_ms === undefined) {
        timing.story_visible_first_content_ms = Date.now() - visibleStartedAt;
        if (timing.story_first_content_ms !== undefined) {
          timing.story_decode_overhead_ms = Math.max(0, timing.story_visible_first_content_ms - timing.story_first_content_ms);
        }
      }
      emit('delta', { text: event.text });
    }
  }
}

function emitVisibleStory(emit, raw, { master, timing } = {}) {
  const decoder = createStoryStreamDecoder({ master });
  const visibleStartedAt = Date.now();
  emitStoryWireEvents(emit, decoder.push(raw), timing, visibleStartedAt);
  emitStoryWireEvents(emit, decoder.finish(), timing, visibleStartedAt);
}

function persistedEngineMetadata(parsedBlocks = {}) {
  return {
    enactments: Array.isArray(parsedBlocks?.engine_enactments) ? parsedBlocks.engine_enactments : [],
    institutional: Array.isArray(parsedBlocks?.engine_institutional_segments) ? parsedBlocks.engine_institutional_segments : []
  };
}

function mergePersistedEngineMetadata(parsedBlocks, persistedBlocks) {
  const metadata = persistedEngineMetadata(persistedBlocks);
  const merged = (metadata.enactments.length || metadata.institutional.length)
    ? attachEngineEnactments(parsedBlocks, metadata.enactments, metadata.institutional)
    : { ...parsedBlocks };
  if (plainObject(persistedBlocks?.turn_context)) merged.turn_context = { ...persistedBlocks.turn_context };
  return merged;
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
        const hydrated = hydratedSaveContext(context, master);
        return ok({ context: withOpeningTurnProjection(hydrated) });
      } finally {
        logTurnTiming({ event_stage: 'context', request_id: requestId, game_id: gameId, context_rpc_ms: timing.context_rpc_ms, turn_total_ms: Date.now() - startedAt });
      }
    },

    /**
     * Read-only, paginated turn history. game_turns already carries everything needed (no new
     * RPC); record_status='active' dedupes a revised turn to only its current revision. Zero
     * LLM calls, zero mutation. player_inner_thought is read from the stored parsed_blocks;
     * committed structured blocks are the only replay/history narrative authority.
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
          const parsedBlocks = plainObject(row.parsed_blocks) ? row.parsed_blocks : {};
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
      const storyOwnerToken = `story:${requestId}`;
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
      if (existingAction && requestedStructuredAction !== null) {
        resolveStoredStructuredAction({ action: existingAction, requestedStructuredAction, stage: 'story-existing' });
      }
      const reservation = existingAction?.action_kind === 'feedback_revision'
        ? { ...existingAction, replayed: false }
        : await db.reserveTurnAction(
            gameId,
            actionId,
            expectedTurn,
            playerAction,
            requestedStructuredAction ?? existingAction?.structured_action ?? null
          );
      // 같은 입력 중복 예약이면 서버가 기존 액션(action_id가 다름)을 재사용한다 —
      // 이후 조회·claim·SSE meta 모두 서버 정본 액션 ID를 따른다.
      const resolvedActionId = reservation?.action_id ?? actionId;
      const action = actionOrNotFound(existingAction ?? await db.getAction(gameId, resolvedActionId));
      const feedbackSourceTurn = action.action_kind === 'feedback_revision' && action.target_turn_id
        ? await db.getTurnById(gameId, action.target_turn_id).catch(() => null)
        : null;
      const structuredAction = assertStoredActionPersistenceParity({
        reservation,
        action,
        requestedStructuredAction,
        stage: 'story'
      });
      let storyClaimed = false;
      // story_failed뿐 아니라 story_streaming(스토리 미완료 좌초)도 재시도를 허용한다.
      // 기존 액션은 reserve_turn_action이 replayed=true를 반환하므로,
      // 이 claim 없이는 (replayed && !retryingStory) 조건이 항상 409로 거부된다.
      if (!action.story_text && action.processing_status === 'story_failed') {
        const claimed = await db.claimGameActionStage(gameId, resolvedActionId, 'story_failed', 'NULL', null, 'story_streaming', storyOwnerToken);
        if (!claimed) throw new HttpError(409, 'action_in_progress', 'Action retry is already in progress', true);
        Object.assign(action, claimed);
        storyClaimed = true;
      } else if (!action.story_text && action.processing_status === 'story_streaming') {
        const hasOwner = typeof action.stage_owner_token === 'string' && action.stage_owner_token.length > 0;
        const claimed = await db.claimGameActionStage(
          gameId,
          resolvedActionId,
          'story_streaming',
          hasOwner ? 'ANY' : 'NULL',
          null,
          'story_streaming',
          storyOwnerToken,
          null,
          hasOwner
        );
        if (!claimed) throw new HttpError(409, 'action_in_progress', 'Action retry is already in progress', true);
        Object.assign(action, claimed);
        storyClaimed = true;
      }
      const meta = { action_id: reservation.action_id ?? actionId, turn_id: reservation.turn_id ?? action.turn_id, expected_turn: reservation.expected_turn ?? expectedTurn, replayed: Boolean(action.story_text) };

      if (action.story_text) {
        logTurnTiming({ event_stage: 'story', request_id: requestId, action_id: meta.action_id, game_id: gameId, expected_turn: meta.expected_turn, replayed: true, turn_total_ms: Date.now() - startedAt });
        return storySse({ meta: { ...meta, replayed: true }, run: async emit => {
          // live와 동일한 이벤트 계약을 유지한다. 레거시 턴은 기존 단일 delta 유지.
          const persistedStory = plainObject(action.parsed_blocks) ? action.parsed_blocks : {};
          const parsed = mergePersistedEngineMetadata(persistedStory, action.parsed_blocks);
          emitVisibleStory(emit, action.story_text, { master });
          emit('complete', { action_id: meta.action_id, turn_id: meta.turn_id, warnings: parsed.warnings ?? [], parsed_blocks: parsed, replayed: true });
        } });
      }
      if ((!storyClaimed && !action.story_text) || action.processing_status !== 'story_streaming') {
        throw new HttpError(409, 'action_in_progress', 'Action already has recoverable work in progress', true);
      }

      return storySse({ meta, run: async emit => {
        let raw = '';
        let storyPersisted = false;
        const timing = {};
        try {
          const contextRpcStart = Date.now();
          const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 50 });
          timing.context_rpc_ms = Date.now() - contextRpcStart;
          const hydratedContext = hydratedSaveContext(context, master);
          const hydratedSave = hydratedContext.save?.data ?? hydratedContext.save;
          const csaResolution = action.action_kind === 'feedback_revision'
            ? null
            : await resolveSignedCsaTransactionResolution({ env, gameId, structuredAction, save: hydratedSave, csaCatalog, expectedTurn });
          const storyPlayerAction = csaResolution ? '' : playerAction;
          const projectedTransactionSave = projectCsaTransactionSave(
            hydratedSave,
            csaResolution ? structuredAction : null,
            csaResolution,
            'story-projection'
          );
          const navigationIntent = resolvePlayerNavigationIntent({
            save: projectedTransactionSave,
            master,
            playerAction: storyPlayerAction,
            mapLocations: Array.isArray(edition?.map?.locations) ? edition.map.locations : []
          });
          const storyBaseSave = projectStorySaveForNavigation(projectedTransactionSave, navigationIntent, {
            master,
            mapLocations: Array.isArray(edition?.map?.locations) ? edition.map.locations : []
          });
          const storySave = storyBaseSave;
          const storyContext = {
            ...hydratedContext,
            save: hydratedContext.save?.data
              ? { ...hydratedContext.save, data: storySave }
              : storySave
          };
          // Scene Cast는 현재 장면 사실과 이동 문맥만 제공한다.
          const sceneCastContract = { present_npc_ids: readCanonicalSceneV1(storySave).present_npc_ids };
          const promptStart = Date.now();
          const actionKind = action.action_kind === 'feedback_revision'
            ? 'feedback_revision'
            : (csaResolution ? 'institutional_rule_change' : 'ordinary');
          const storyWorld = buildStoryWorldProjection({
            save: storySave,
            master,
            sceneActorIds: sceneCastContract.present_npc_ids,
            expectedTurn,
            playerAction: storyPlayerAction
          });
          let institutionalSegments = [];
          if (actionKind === 'feedback_revision') {
            const previous = persistedEngineMetadata(feedbackSourceTurn?.parsed_blocks);
            institutionalSegments = previous.institutional;
          } else {
            institutionalSegments = buildInstitutionalSegments({ worldRules: storyWorld.world_rules, expectedTurn });
          }
          const messages = buildStoryPrompt({
            edition,
            context: storyContext,
            playerAction: storyPlayerAction,
            expectedTurn,
            npcIds,
            catalogs,
            sceneCastContract,
            turnTrigger: buildStoryTurnTrigger({ actionKind, csaResolution, preSave: hydratedSave }),
            feedbackText: action.action_kind === 'feedback_revision' ? action.feedback_text : '',
            storyWorld,
            playerPrivateOrigin: playerPrivateOriginFor(structuredAction, csaResolution)
          });
          timing.story_prompt_ms = Date.now() - promptStart;
          const storyUserPayload = JSON.parse(messages[1].content);
          timing.story_system_chars = messages[0].content.length;
          timing.story_context_chars = JSON.stringify(storyUserPayload.context).length;
          timing.scene_actor_chars = JSON.stringify(storyUserPayload.scene_actors ?? {}).length;
          timing.story_request_chars = messages[0].content.length + messages[1].content.length;
          timing.scene_actor_count = Object.keys(storyUserPayload.scene_actors ?? {}).length;
          timing.recent_turn_count = Array.isArray(storyUserPayload.context?.recent_turns) ? storyUserPayload.context.recent_turns.length : 0;
          let stream = null;
          let upstreamRaw = '';
          const wireDecoder = createStoryStreamDecoder({ master });
          const visibleStartedAt = Date.now();
          const engineText = institutionalSegments.map(segment => segment.canonical_text).filter(Boolean).join('\n\n');
          if (engineText) emitVisibleStory(emit, engineText, { master, timing });
          try {
            stream = await streamStory({ env, fetchImpl, messages, timing });
            for await (const text of stream.chunks) {
              upstreamRaw += text;
              emitStoryWireEvents(emit, wireDecoder.push(text), timing, visibleStartedAt);
            }
            emitStoryWireEvents(emit, wireDecoder.finish(), timing, visibleStartedAt);
            timing.story_visible_network_total_ms = Date.now() - visibleStartedAt;
          } catch (error) {
            throw error;
          }
          // 문서 5절 — 정본 story_text는 upstreamRaw(플레이어 가시 원문)다.
          // gate는 검증만 수행하고 원문을 재작성·삭제하지 않는다.
          const canonicalStory = composeCanonicalStory({ institutionalSegments, providerNarrative: upstreamRaw });
          raw = canonicalStory;
          const parsed = parseFreshNarrativeV2(canonicalStory, { master });
          // 수정 11 — gate warnings를 포함한 병합 warnings (complete에도 그대로 전달)
          const mergedWarnings = [...(parsed.warnings ?? [])];
          const contractPersisted = attachEngineEnactments({
            ...parsed,
            turn_context: turnContextFor({
              save: storySave,
              locationId: navigationIntent?.destination_location_id ?? storySave?.scene?.location_id,
              mapLocations: Array.isArray(edition?.map?.locations) ? edition.map.locations : []
            }),
            // 수정 H — live/replay 동일 순서 재생용
            warnings: mergedWarnings
          }, [], institutionalSegments);
          timing.upstream_story_chars = upstreamRaw.length;
          timing.canonical_story_chars = canonicalStory.length;
          const ownedResult = await db.recordStoryResultOwned(gameId, resolvedActionId, raw, contractPersisted, storyOwnerToken);
          if (!ownedResult) throw new HttpError(409, 'story_owner_lost', 'Story ownership was lost before persistence', true);
          storyPersisted = true;
          emit('complete', {
            action_id: meta.action_id, turn_id: meta.turn_id, warnings: mergedWarnings, replayed: false,
            parsed_blocks: contractPersisted
          });
        } catch (error) {
          if (!storyPersisted) {
            await db.failGameActionStage(gameId, resolvedActionId, 'story_streaming', 'EXACT', storyOwnerToken, 'story_failed', error.code ?? 'story_failed').catch(() => undefined);
          }
          throw error;
        } finally {
          logTurnTiming({
            event_stage: 'story', request_id: requestId, action_id: meta.action_id, game_id: gameId, expected_turn: meta.expected_turn,
            context_rpc_ms: timing.context_rpc_ms, story_prompt_ms: timing.story_prompt_ms, story_headers_ms: timing.story_headers_ms,
            story_first_content_ms: timing.story_first_content_ms, story_network_total_ms: timing.story_network_total_ms,
            story_visible_first_content_ms: timing.story_visible_first_content_ms,
            story_decode_overhead_ms: timing.story_decode_overhead_ms,
            story_visible_network_total_ms: timing.story_visible_network_total_ms,
            story_character_count: timing.story_character_count,
            story_system_chars: timing.story_system_chars, story_context_chars: timing.story_context_chars,
            scene_actor_chars: timing.scene_actor_chars, story_request_chars: timing.story_request_chars,
            scene_actor_count: timing.scene_actor_count, recent_turn_count: timing.recent_turn_count,
            turn_total_ms: Date.now() - startedAt
          });
        }
      } });
    },

    async extract(request, env) {
      const requestId = newRequestId();
      const extractOwnerToken = `extract:${requestId}`;
      const startedAt = Date.now();
      const body = await readJson(request);
      const { gameId, actionId } = actionIds(body);
      const db = createSupabaseClient(env, fetchImpl);
      const action = actionOrNotFound(await db.getAction(gameId, actionId));
      if (!action.story_text) throw new HttpError(409, 'story_required', 'A completed Story is required before Extract', true);
      const structuredAction = resolveStoredStructuredAction({
        action,
        requestedStructuredAction: body.structured_action ?? null,
        stage: 'extract'
      });
      if (action.extract_delta) {
        const persistedStory = plainObject(action.parsed_blocks) ? action.parsed_blocks : {};
        const replayParsedStory = mergePersistedEngineMetadata(persistedStory, action.parsed_blocks);
        const extract = normalizePersistedExtractObservation(action.extract_delta, { npcIds, storyText: action.story_text, storyBlocks: replayParsedStory.blocks, expectedTurn: action.expected_turn, actionId });
        logTurnTiming({ event_stage: 'extract', request_id: requestId, action_id: actionId, game_id: gameId, replayed: true, turn_total_ms: Date.now() - startedAt });
        return ok({ action_id: actionId, extract, warnings: extract.warnings, replayed: true, parsed_blocks: replayParsedStory });
      }
      let extractClaimed = false;
      if (action.processing_status === 'extract_failed') {
        const claimedRetry = await db.claimGameActionStage(gameId, actionId, 'extract_failed', 'NULL', null, 'extracting', extractOwnerToken);
        if (!claimedRetry) throw new HttpError(409, 'action_in_progress', 'Action retry is already in progress', true);
        Object.assign(action, claimedRetry);
        extractClaimed = true;
      }
      if (action.processing_status !== 'extracting') throw new HttpError(409, 'action_in_progress', 'Action is not ready for Extract', true);
      if (!extractClaimed) {
        const hasExtractOwner = typeof action.stage_owner_token === 'string' && action.stage_owner_token.length > 0;
        const claimedExtract = await db.claimGameActionStage(
          gameId,
          actionId,
          'extracting',
          hasExtractOwner ? 'ANY' : 'NULL',
          null,
          'extracting',
          extractOwnerToken,
          null,
          hasExtractOwner
        );
        if (!claimedExtract) throw new HttpError(409, 'action_in_progress', 'Extract is already in progress', true);
        Object.assign(action, claimedExtract);
      }

      const timing = {};
      try {
        const persistedStory = plainObject(action.parsed_blocks) ? action.parsed_blocks : {};
        let parsedStory = mergePersistedEngineMetadata(persistedStory, action.parsed_blocks);
        // Extract observes the same raw Story text that was streamed to the player.
        const storyForExtract = action.story_text;
        let extract;
        const contextRpcStart = Date.now();
          const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 15 });
          timing.context_rpc_ms = Date.now() - contextRpcStart;
          const hydratedContext = hydratedSaveContext(context, master);
          const hydratedSave = hydratedContext.save?.data ?? hydratedContext.save;
          const csaResolution = action.action_kind === 'feedback_revision'
            ? null
            : await resolveSignedCsaTransactionResolution({ env, gameId, structuredAction, save: hydratedSave, csaCatalog, expectedTurn: action.expected_turn });
           // Speaker identity remains a post-hoc projection; raw Story is passed to Extract unchanged.

          const promptStart = Date.now();
          // CSA transaction 턴에는 post-transaction save로 Extract context를 만든다
          // (Story 경로와 동일한 단일 정본 — runtime wrapper가 다시 덮어쓸 필요가 없다).
          const projectedTransactionSave = projectCsaTransactionSave(
            hydratedSave,
            csaResolution ? structuredAction : null,
            csaResolution,
            'extract-projection'
          );
          const extractBaseSave = projectedTransactionSave;
          // Extract observes the same canonical save that Story observed; the
          // signed resolution is not a second, ephemeral state projection.
          const extractSave = extractBaseSave;
          const extractContext = {
            ...hydratedContext,
            save: hydratedContext.save?.data
              ? { ...hydratedContext.save, data: extractSave }
              : extractSave
          };
          const mindMonitorTargets = buildMindMonitorTargetIds({ context: extractContext, parsedStory, npcIds });
          const messages = buildExtractPrompt({ context: extractContext, storyText: storyForExtract, parsedStory, expectedTurn: action.expected_turn, edition, npcIds, mindMonitorTargets });
          timing.extract_prompt_ms = Date.now() - promptStart;
          const extractUserPayload = JSON.parse(messages[1].content);
          timing.extract_system_chars = messages[0].content.length;
          timing.extract_context_chars = JSON.stringify(extractUserPayload.context).length;
          timing.parsed_story_chars = JSON.stringify(parsedStory).length;
          timing.extract_request_chars = messages[0].content.length + messages[1].content.length;
          timing.active_character_count = activeCountFromNpcState(extractUserPayload.context?.active_npc_state);
          try {
            const llmStart = Date.now();
            const raw = await runExtract({
              env,
              fetchImpl,
              messages,
              onRawResponse: env.COMPANY_V1_EXTRACT_DIAGNOSTIC === 'true'
                ? response => { timing.extract_provider_response = response; }
                : null
            });
            timing.extract_llm_ms = Date.now() - llmStart;
            const parseStart = Date.now();
            // Fresh Extract calls are V2-only. The legacy adapter is reserved for
            // persisted V1 rows during replay/recovery, never for a new LLM result.
            extract = normalizeFreshExtractObservationV2(raw, {
              npcIds,
              storyText: storyForExtract,
              expectedTurn: action.expected_turn,
              actionId,
              storyBlocks: parsedStory.blocks,
              requiredMindMonitorIds: mindMonitorTargets,
            });
            timing.extract_parse_ms = Date.now() - parseStart;
          } catch (error) {
            // Extract is an optional observation. Invalid, truncated, or
            // contract-invalid output degrades deterministically and still
            // reaches the owned Extract completion RPC and the single Commit path.
            const failOpen = error instanceof GameCoreError
              || error?.code === 'extract_invalid_json'
              || error?.code === 'extract_truncated';
            if (!failOpen) throw error;
            extract = buildDegradedExtractObservation({
              extraWarnings: [`extract_fail_open:${error?.code ?? 'invalid_observation'}`]
            });
          }
        const ownedResult = await db.recordExtractResultOwned(gameId, actionId, extract, extractOwnerToken);
        if (!ownedResult) throw new HttpError(409, 'extract_owner_lost', 'Extract ownership was lost before persistence', true);
        return ok({ action_id: actionId, extract, warnings: extract.warnings, replayed: false, parsed_blocks: parsedStory });
      } catch (error) {
        // Infrastructure/context/persistence failures remain retryable. Only
        // the single Extract completion itself is fail-open degraded above.
        await db.failGameActionStage(gameId, actionId, 'extracting', 'EXACT', extractOwnerToken, 'extract_failed', error.code ?? 'extract_failed').catch(() => undefined);
        throw error;
      } finally {
        logTurnTiming({
          event_stage: 'extract', request_id: requestId, action_id: actionId, game_id: gameId,
          context_rpc_ms: timing.context_rpc_ms, extract_prompt_ms: timing.extract_prompt_ms, extract_llm_ms: timing.extract_llm_ms,
          extract_parse_ms: timing.extract_parse_ms,
          extract_system_chars: timing.extract_system_chars, extract_context_chars: timing.extract_context_chars,
          parsed_story_chars: timing.parsed_story_chars, extract_request_chars: timing.extract_request_chars,
          active_character_count: timing.active_character_count,
          extract_provider_response: timing.extract_provider_response,
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
        const structuredAction = resolveStoredStructuredAction({
          action,
          requestedStructuredAction: body.structured_action ?? null,
          stage: 'commit'
        });
        if (!action.story_text || !action.extract_delta) throw new HttpError(409, 'action_incomplete', 'Story and Extract are required before Commit', true);
        const contextRpcStart = Date.now();
        const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 15 });
        timing.context_rpc_ms = Date.now() - contextRpcStart;
        const currentSave = hydratedSaveContext(context, master).save?.data ?? context.save?.data ?? context.save;
        const csaResolution = action.action_kind === 'feedback_revision'
          ? null
          : await resolveSignedCsaTransactionResolution({ env, gameId, structuredAction, save: currentSave, csaCatalog, expectedTurn });
        const commitValidationSave = projectCsaTransactionSave(
          currentSave,
          csaResolution ? structuredAction : null,
          csaResolution,
          'commit-validation'
        );
        const navigationIntent = resolvePlayerNavigationIntent({
          save: commitValidationSave,
          master,
          playerAction: csaResolution ? '' : action.player_action,
          mapLocations: Array.isArray(edition?.map?.locations) ? edition.map.locations : []
        });
        const persistedStory = plainObject(action.parsed_blocks) ? action.parsed_blocks : {};
        let parsedStory = mergePersistedEngineMetadata(persistedStory, action.parsed_blocks);
        const extract = normalizePersistedExtractObservation(action.extract_delta, { npcIds, storyText: action.story_text, storyBlocks: parsedStory.blocks, expectedTurn, actionId });
        const reducerStart = Date.now();
        const merged = reduceGameplayCommit({
          currentSave, observation: extract, parsedStory, rawStory: action.story_text,
          action, expectedTurn, master, npcIds,
          mapLocations: Array.isArray(edition?.map?.locations) ? edition.map.locations : [],
          navigationIntent,
          structuredAction: action.action_kind === 'feedback_revision' ? null : structuredAction,
          transactionResolution: csaResolution
        });
        timing.commit_reducer_ms = Date.now() - reducerStart;
        let nextSave = merged.nextSave;
        const warnings = merged.warnings;
        // Commit gameplay state is reduced by reduceGameplayCommit.
        // NPCs actually present this turn — an item naming anything else is silently
          // 진행도는 reducer가 승인한 실행(accepted_executions)만 반영한다 —
          // 잘못된(범위 밖/장면 외/action_state 불일치) update는 경험치도 주지 않는다.
        const turnChanges = deriveTurnChanges(currentSave, nextSave);

        // Extract가 같은 Story에서 생성한 summary가 이 턴의 유일한 압축 memory 입력이다.
        // 빈 문자열은 provider가 실제로 요약할 내용이 없을 때만 허용되며, 서버가 합성하지 않는다.
        const finalTurnSummary = typeof extract.turn_summary === 'string' ? extract.turn_summary : '';
        // 선택지 단일 writer — gameplay commit reducer가 확정한 last_choices를
        // 그대로 쓴다 (Story 1~3개 보존 + 부족분 보충 결과 = save와 history 일치).
        const finalChoices = Array.isArray(nextSave.last_choices) ? nextSave.last_choices : [];

        const commitRpcStart = Date.now();
        // A feedback-revision action never advances committed_turn — it replaces the content of
        // the turn it targets, preserved as a new revision row (record_status flips the prior
        // one to 'superseded'), so it goes through commit_feedback_revision instead of the
        // normal expected_turn-advancing commit_company_turn.
        const commit = action.action_kind === 'feedback_revision'
          ? await db.commitFeedbackRevision(gameId, actionId, action.revision_request_id, nextSave, finalTurnSummary, merged.mind_monitor, finalChoices)
          : await db.callRpc('commit_company_turn', {
              p_game_id: gameId, p_action_id: actionId, p_expected_turn: expectedTurn,
              p_next_save: nextSave, p_turn_summary: finalTurnSummary,
              p_mind_monitor: merged.mind_monitor, p_choices: finalChoices
            });
        timing.commit_rpc_ms = Date.now() - commitRpcStart;
        // expected_turn_conflict — RPC가 액션을 commit_failed로 종료했다. committing에
        // 남기지 않고 프론트가 정상 종료로 인식해 pending을 비우고 context를 새로
        // 불러오게 한다 (고아 액션 고착 방지).
        if (commit?.success === false && commit?.error === 'expected_turn_conflict') {
          return ok({ commit, next_save: null, warnings, turn_changes: [], terminated: true });
        }
        return ok({
          commit, next_save: nextSave, warnings, turn_changes: turnChanges,
          time_before: merged.time_before, elapsed_minutes: merged.elapsed_minutes, time_after: merged.time_after
        });
      } finally {
        logTurnTiming({
          event_stage: 'commit', request_id: requestId, action_id: actionId, game_id: gameId, expected_turn: expectedTurn,
          context_rpc_ms: timing.context_rpc_ms, commit_reducer_ms: timing.commit_reducer_ms, commit_rpc_ms: timing.commit_rpc_ms,
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
        // 태그 allowlist normalize — 알 수 없는 태그는 버린다 (지시 10).
        const tags = normalizeImageTags(Array.isArray(body.tags) ? body.tags : []);
        const selected = selectImage(candidates, {
          situation: typeof body.situation === 'string' ? body.situation : null,
          tags,
          pool,
          locationId: typeof body.location_id === 'string' ? body.location_id : null
        });
        return ok({ character_id: characterId, image: selected });
      } finally {
        logTurnTiming({ event_stage: 'image', request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
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
        const openingPlan = buildOpeningPlan({ positionId: validation.player.position_id, departmentId: validation.player.department_id, seedBytes: randomSeedBytes(), heroineIds, locations: edition?.map?.locations });
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
          const projection = openingTurnProjection(preSave);
          const parsedOpening = projection?.parsed_blocks ?? {};
          emitVisibleStory(emit, preSave.opening_state.story_text, { master });
          emit('complete', {
            setup_id: setupId,
            choices: projection?.choices ?? [],
            parsed_blocks: parsedOpening,
            warnings: parsedOpening.warnings ?? [],
            replayed: true
          });
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
          let raw = '';
          const wireDecoder = createStoryStreamDecoder({ master });
          const visibleStartedAt = Date.now();
          try {
            const stream = await streamStory({ env, fetchImpl, messages, timing });
            for await (const text of stream.chunks) {
              raw += text;
              emitStoryWireEvents(emit, wireDecoder.push(text), timing, visibleStartedAt);
            }
            emitStoryWireEvents(emit, wireDecoder.finish(), timing, visibleStartedAt);
            timing.story_visible_network_total_ms = Date.now() - visibleStartedAt;
          } catch (error) {
            throw error;
          }
          const background = '';
          const splitWarnings = [];
          const parsedOpening = {
            ...parseFreshNarrativeV2(raw, { master }),
            turn_context: turnContextFor({
              save: { world_state: { game_time: { day: 1, minute_of_day: openingPlan.minute_of_day } } },
              locationId: openingPlan.location_id,
              mapLocations: Array.isArray(edition?.map?.locations) ? edition.map.locations : []
            })
          };
          const choiceProjection = reduceStoryChoiceProjection({ parsedStory: parsedOpening });
          const finalChoices = choiceProjection.state;
          const commit = await db.callRpc('commit_company_opening', {
            p_game_id: gameId,
            p_setup_id: setupId,
            p_background: background,
            p_story_text: parsedOpening.raw,
            p_choices: finalChoices,
            p_parsed_blocks: parsedOpening
          });
          emit('complete', {
            setup_id: setupId, choices: finalChoices, background,
            warnings: [...splitWarnings, ...parsedOpening.warnings, ...choiceProjection.warnings],
            parsed_blocks: parsedOpening,
            replayed: false, commit
          });
        } finally {
          logTurnTiming({
            event_stage: 'opening', request_id: requestId, game_id: gameId,
            story_headers_ms: timing.story_headers_ms, story_first_content_ms: timing.story_first_content_ms,
            story_network_total_ms: timing.story_network_total_ms, story_visible_first_content_ms: timing.story_visible_first_content_ms,
            story_decode_overhead_ms: timing.story_decode_overhead_ms, story_visible_network_total_ms: timing.story_visible_network_total_ms,
            story_character_count: timing.story_character_count,
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
        return ok({ app: buildAppStatePayload(save, csaCatalog, null, player) });
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
        const finalPlan = semanticResults.length
          ? planCsaTransaction(save, csaCatalog, canonicalAction.operations, { turnNumber: committedTurn + 1, capability })
          : plan;
        if (!finalPlan.ok) {
          throw new HttpError(finalPlan.status ?? 422, (finalPlan.error_code ?? 'app_action_invalid').toLowerCase(), 'final transaction resolution is invalid', false, finalPlan.issues);
        }
        canonicalAction = finalPlan.canonical_action;
        const transactionResolution = await buildTransactionResolution({ plan: finalPlan, save, baseTurnCount: canonicalAction.base_turn_count });
        const actionDigest = await sha256Base64url(stableStringify({ version: canonicalAction.version, type: canonicalAction.type, base_turn_count: canonicalAction.base_turn_count, operations: canonicalAction.operations }));
        const resolvedResults = semanticResults.map(item => ({ client_id: item.client_id, required_strength: item.required_strength, semantic_contract: item.semantic_contract }));
        const semantic_validation = {
          version: 2,
          game_id: gameId,
          base_turn_count: canonicalAction.base_turn_count,
          action_digest: actionDigest,
          planner_input_digest: transactionResolution.planner_input_digest,
          resolution_digest: transactionResolution.resolution_digest,
          results: resolvedResults
        };
        const validation_proof = await signTransactionValidationProof(appValidationSecret(env), {
          game_id: gameId,
          base_turn_count: canonicalAction.base_turn_count,
          action_digest: actionDigest,
          resolution_digest: transactionResolution.resolution_digest,
          semantic_results: resolvedResults
        });
        canonicalAction = { ...canonicalAction, transaction_resolution: transactionResolution, semantic_validation, validation_proof };

        return ok({ canonical_action: canonicalAction, display_input: plan.display_input, summary: plan.summary });
      } finally {
        logTurnTiming({ event_stage: 'app_validate', request_id: requestId, game_id: gameId, context_rpc_ms: contextRpcCalls, llm_calls: llmCalls, turn_total_ms: Date.now() - startedAt });
      }
    }
  };
}
