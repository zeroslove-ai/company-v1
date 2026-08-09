import { HttpError, ok, readJson, requireString, sseEvent, sseResponse } from './http.js';
import { createSupabaseClient } from './supabase.js';
import { runExtract, streamStory } from './llm.js';
import { buildSceneCastContract } from '../engine/scene-cast.js';
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
  buildCsaApplicationCheckSection,
  buildCsaRuntimeExtractContractSection,
  buildMindEffectExtractFirewallSection,
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
  calculateCsaProgression,
  resolveStoredStructuredAction,
  assertStoredActionPersistenceParity,
  applyAuthorizedRuleDefinitions,
  assertRuleDefinitionAuthority,
  buildLegacySceneObservation,
  hydrateCanonicalScene,
  reduceCanonicalScene,
  projectCanonicalSceneToLegacy,
  assertCanonicalSceneInvariants
} from '../engine/index.js';
import { GameCoreError } from '../engine/errors.js';
import { StoredActionAuthorityError } from '../engine/runtime-core/action-authority.js';
import { logTurnTiming, newRequestId } from './timing.js';

const EXTRACT_DEGRADE_CODES = new Set(['llm_upstream_failure', 'extract_timeout', 'extract_invalid_json', 'extract_truncated']);

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

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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

export function createTurnRoutes({ fetchImpl, edition }) {
  // 오프닝 fail-open — LLM 선택지가 부족하면 deterministic 기본 선택지로 채운다 (RPC 기본값과 동일).
const DEFAULT_OPENING_CHOICES = [
  '분위기를 살피며 첫인사를 건넨다.',
  '자연스럽게 자리에 앉아 업무를 시작한다.',
  '새 동료에게 먼저 말을 걸어 본다.',
  '조용히 정리하며 상황을 파악한다.'
];

// app_transaction fail-open — Story upstream이 첫 콘텐츠를 주지 않거나(story_timeout/
// llm_upstream_failure/story_incomplete) 실패하면 deterministic fallback Story로 계속
// 진행한다. 현재 장면 NPC를 임의로 발화시키지 않고 [SCENE]만 사용한다.
const APP_TRANSACTION_STORY_FALLBACK_ERRORS = new Set(['story_timeout', 'llm_upstream_failure', 'story_incomplete']);

function buildAppTransactionFallbackStory() {
  return '[SCENE]\n현재 장면은 직전 행동의 결과를 이어간다.';
}

function parseStoryProjection(raw, master) {
  try {
    const parsed = parseNarrative(raw ?? '', { master });
    return plainObject(parsed) ? parsed : { blocks: [{ type: 'unparsed', text: raw ?? '' }], choices: [], warnings: ['narrative_parse_failed'] };
  } catch {
    return { blocks: [{ type: 'unparsed', text: raw ?? '' }], choices: [], warnings: ['narrative_parse_failed'] };
  }
}

// 오프닝 fail-open — Story upstream이 최종 실패했을 때 저장된 opening plan 기반의
// 짧은 기본 오프닝. 플레이어 설정이 reserved 상태로 영구 고착되지 않게 한다.
function buildFallbackOpeningStory(openingPlan, player) {
  const name = typeof player?.name === 'string' && player.name.trim() ? player.name.trim() : '플레이어';
  const location = openingPlan?.location_name ?? '사무실';
  const hook = openingPlan?.work_hook_label ? `, ${openingPlan.work_hook_label}을(를) 시작하며` : '';
  return `[1. 서사 및 행동]\n회사의 첫 날, ${name}은(는) ${location}에 도착했다${hook}. 새로운 업무 환경에서 첫 장면이 시작되었다.\n[4. 선택지]\n1. 분위기를 살피며 첫인사를 건넨다.\n2. 자연스럽게 자리에 앉아 업무를 시작한다.\n3. 새 동료에게 먼저 말을 걸어 본다.\n4. 조용히 정리하며 상황을 파악한다.`;
}

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
      const structuredAction = assertStoredActionPersistenceParity({
        reservation,
        action,
        requestedStructuredAction,
        stage: 'story'
      });
      let retryingStory = false;
      // story_failed뿐 아니라 story_streaming(스토리 미완료 좌초)도 재시도를 허용한다.
      // 기존 액션은 reserve_turn_action이 replayed=true를 반환하므로,
      // 이 claim 없이는 (replayed && !retryingStory) 조건이 항상 409로 거부된다.
      if (!action.story_text && (action.processing_status === 'story_failed' || action.processing_status === 'story_streaming')) {
        const claimed = await db.claimActionStatus(gameId, resolvedActionId, action.processing_status, 'story_streaming', null);
        if (!claimed) throw new HttpError(409, 'action_in_progress', 'Action retry is already in progress', true);
        Object.assign(action, claimed);
        retryingStory = true;
      }
      const meta = { action_id: reservation.action_id ?? actionId, turn_id: reservation.turn_id ?? action.turn_id, expected_turn: reservation.expected_turn ?? expectedTurn, replayed: Boolean(action.story_text) };

      if (action.story_text) {
        logTurnTiming({ event_stage: 'story', request_id: requestId, action_id: meta.action_id, game_id: gameId, expected_turn: meta.expected_turn, replayed: true, turn_total_ms: Date.now() - startedAt });
        return storySse({ meta: { ...meta, replayed: true }, run: async emit => {
          // live와 동일한 이벤트 계약을 유지한다. 레거시 턴은 기존 단일 delta 유지.
          const parsed = parseStoryProjection(action.story_text, master);
          emit('delta', { text: action.story_text });
          emit('complete', { action_id: meta.action_id, turn_id: meta.turn_id, warnings: parsed.warnings ?? [], parsed_blocks: parsed, replayed: true });
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
          const csaPlan = action.action_kind === 'feedback_revision'
            ? null
            : await resolveCsaTransactionPlan({ env, gameId, structuredAction, save: hydratedSave, csaCatalog, expectedTurn });
          const storySave = csaPlan
            ? { ...hydratedSave, csa_active: csaPlan.next_csa_active, csa_rules: csaPlan.next_csa_rules }
            : hydratedSave;
          const storyContext = csaPlan
            ? {
                ...hydratedContext,
                save: hydratedContext.save?.data
                  ? { ...hydratedContext.save, data: storySave }
                  : storySave
              }
            : hydratedContext;
          // Scene Cast는 현재 장면 사실과 이동 문맥만 제공한다.
          const sceneCastContract = buildSceneCastContract({
            save: hydratedSave, master, playerAction, structuredAction,
            mapLocations: Array.isArray(edition?.map?.locations) ? edition.map.locations : []
          });
          timing.cast_present_count = sceneCastContract.present_npc_ids.length;
          timing.cast_entering_count = sceneCastContract.entering_npc_ids.length;
          timing.cast_player_dialogue_mode = sceneCastContract.player_dialogue.mode;
          const promptStart = Date.now();
          let messages = buildStoryPrompt({ edition, context: storyContext, playerAction, expectedTurn, npcIds, catalogs, sceneCastContract });
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
          let stream = null;
          let upstreamRaw = '';
          let storyFallback = false;
          try {
            stream = await streamStory({ env, fetchImpl, messages, timing });
            for await (const text of stream.chunks) {
              upstreamRaw += text;
              emit('delta', { text });
            }
          } catch (error) {
            // app_transaction fail-open — Story upstream이 첫 콘텐츠를 주지 않으면
            // (30초 timeout/upstream 실패/불완전 스트림) deterministic fallback Story로
            // 계속 진행한다. 일반 플레이어 턴은 그대로 실패(입력 복원·종료)한다.
            const code = error?.code;
            if (!csaPlan || !APP_TRANSACTION_STORY_FALLBACK_ERRORS.has(code)) throw error;
            storyFallback = true;
            const fallbackText = buildAppTransactionFallbackStory(csaPlan, hydratedSave);
            upstreamRaw = fallbackText;
            emit('delta', { text: fallbackText });
            timing.story_fallback = 1;
          }
          // 문서 5절 — 정본 story_text는 upstreamRaw(플레이어 가시 원문)다.
          // gate는 검증만 수행하고 원문을 재작성·삭제하지 않는다.
          raw = upstreamRaw;
          const parsed = parseStoryProjection(raw, master);
          // 수정 11 — gate warnings를 포함한 병합 warnings (complete에도 그대로 전달)
          const mergedWarnings = [...(parsed.warnings ?? []), ...(storyFallback ? ['app_story_fallback'] : [])];
          const contractPersisted = {
            ...parsed,
            // 수정 H — live/replay 동일 순서 재생용
            warnings: mergedWarnings
          };
          timing.upstream_story_chars = upstreamRaw.length;
          await db.callRpc('record_story_result', { p_game_id: gameId, p_action_id: resolvedActionId, p_story_text: raw, p_parsed_blocks: contractPersisted });
          storyPersisted = true;
          emit('complete', {
            action_id: meta.action_id, turn_id: meta.turn_id, warnings: mergedWarnings, replayed: false,
            parsed_blocks: contractPersisted
          });
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
      const structuredAction = resolveStoredStructuredAction({
        action,
        requestedStructuredAction: body.structured_action ?? null,
        stage: 'extract'
      });
      if (action.extract_delta) {
        const replayParsedStory = parseStoryProjection(action.story_text, master);
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
        let parsedStory = parseStoryProjection(action.story_text, master);
        // Extract observes the same raw Story text that was streamed to the player.
        const storyForExtract = action.story_text;
        let extract;
        try {
          const contextRpcStart = Date.now();
          const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 15 });
          timing.context_rpc_ms = Date.now() - contextRpcStart;
          const hydratedContext = hydratedSaveContext(context, master);
          const hydratedSave = hydratedContext.save?.data ?? hydratedContext.save;
          const csaPlan = action.action_kind === 'feedback_revision'
            ? null
            : await resolveCsaTransactionPlan({ env, gameId, structuredAction, save: hydratedSave, csaCatalog, expectedTurn: action.expected_turn });
          const applicableCsa = getApplicableCsaEntries(hydratedSave);
           // Speaker identity remains a post-hoc projection; raw Story is passed to Extract unchanged.

          const promptStart = Date.now();
          // CSA transaction 턴에는 post-transaction save로 Extract context를 만든다
          // (Story 경로와 동일한 단일 정본 — runtime wrapper가 다시 덮어쓸 필요가 없다).
          const extractSave = csaPlan
            ? { ...hydratedSave, csa_active: csaPlan.next_csa_active, csa_rules: csaPlan.next_csa_rules }
            : hydratedSave;
          const extractContext = csaPlan
            ? {
                ...hydratedContext,
                save: hydratedContext.save?.data
                  ? { ...hydratedContext.save, data: extractSave }
                  : extractSave
              }
            : hydratedContext;
          let messages = buildExtractPrompt({ context: extractContext, storyText: storyForExtract, parsedStory, playerAction: action.player_action, expectedTurn: action.expected_turn, edition, npcIds, sceneCastContract: parsedStory.scene_cast_contract ?? action.scene_cast_contract });
          const extractFirewall = buildMindEffectExtractFirewallSection({ hasApplicableCsa: applicableCsa.length > 0, hasCsaTransaction: Boolean(csaPlan) })
            + buildCsaApplicationCheckSection(applicableCsa)
            + buildCsaRuntimeExtractContractSection(applicableCsa);
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
        const currentSave = context.save?.data ?? context.save;
        let parsedStory = parseStoryProjection(action.story_text, master);
        const extract = normalizeGameplayExtractEnvelope(action.extract_delta, { parsedStory, npcIds });
        const mergeStart = Date.now();
        const merged = applyGuardedStateDelta(currentSave, extract, {
          expectedTurn, actionId, turnId: action.turn_id, playerAction: action.player_action, parsedStory, master, npcIds,
          storyText: action.story_text
        });
        timing.guarded_merge_ms = Date.now() - mergeStart;
        let nextSave = merged.nextSave;
        const warnings = merged.warnings;
        const sceneObservation = buildLegacySceneObservation({ extract, parsedStory, npcIds });
        warnings.push(...(sceneObservation.warnings ?? []));
        const canonicalScene = reduceCanonicalScene({
          currentScene: hydrateCanonicalScene(currentSave, { master, npcIds }),
          observation: sceneObservation,
          save: currentSave,
          master,
          npcIds,
          mapLocations: Array.isArray(edition?.map?.locations) ? edition.map.locations : [],
          expectedTurn,
          actionKind: action.action_kind
        });
        nextSave = projectCanonicalSceneToLegacy(nextSave, canonicalScene, {
          playerId: currentSave.player?.player_id ?? currentSave.player?.id,
          npcIds
        });
        assertCanonicalSceneInvariants({ save: nextSave, scene: canonicalScene, npcIds, parsedStory });
        // Canonical scene reduction is the only gameplay presence writer. Feedback revisions
        // and degraded observations preserve the existing canonical scene.
        // The app transaction never gets its own save API — its csa_active/csa_rules result rides
        // through this same guarded-merge commit, applied on top of the normal Extract delta.
        const csaPlan = action.action_kind === 'feedback_revision'
          ? null
          : await resolveCsaTransactionPlan({ env, gameId, structuredAction, save: currentSave, csaCatalog, expectedTurn });
        const definitionAction = action.action_kind === 'feedback_revision' ? null : structuredAction;
        applyAuthorizedRuleDefinitions({
          currentSave,
          nextSave,
          csaPlan,
          structuredAction: definitionAction,
          stage: 'commit'
        });
        // Extract's csa_trigger_evaluations/csa_runtime_updates persist scene-execution
        // status (active/temporarily_interrupted/paused/ended) into next turn's Context.
        // Validated per-item against the *post-transaction* active-preset-CSA set and the
        // NPCs actually present this turn — an item naming anything else is silently
        // dropped inside buildCsaRuntimeStatePatch itself.
        const activeCsaAfterPlan = getApplicableCsaEntries(nextSave);
        const runtimeResult = buildCsaSceneRuntimeStatePatch({
          previousSave: currentSave, csaRuntimeUpdates: extract.csa_runtime_updates, csaTriggerEvaluations: extract.csa_trigger_evaluations,
          activeCsa: activeCsaAfterPlan, npcsPresent: canonicalScene.present_npc_ids, turnNumber: expectedTurn
        });
        if (runtimeResult.patch) nextSave.csa_runtime_state = { ...(nextSave.csa_runtime_state ?? {}), ...runtimeResult.patch };
        if (runtimeResult.warnings.length) warnings.push(...runtimeResult.warnings);
        if (csaPlan) {
          const deactivatedIds = csaPlan.canonical_action.operations.filter(operation => operation.operation === 'deactivate').map(operation => operation.id);
          if (deactivatedIds.length) {
            const aftereffectPatch = buildCsaAftereffectPatch({ previousSave: nextSave, deactivatedIds, npcsPresent: canonicalScene.present_npc_ids, turnNumber: expectedTurn });
            if (aftereffectPatch) nextSave.csa_aftereffect_state = aftereffectPatch;
          }
        }
        // Player level/exp — ported verbatim from donor's live calculateProgress/
        // calculateCsaProgression (see src/engine/progression.js); Company had no progression
        // writer of its own before this. Never grants exp on a degraded-Extract turn or for a
        // feedback revision (replacing a turn's content is not a new turn earning fresh exp).
        if (action.action_kind !== 'feedback_revision') {
          // 진행도는 reducer가 승인한 실행(accepted_executions)만 반영한다 —
          // 잘못된(범위 밖/장면 외/action_state 불일치) update는 경험치도 주지 않는다.
          const experiencedThisTurn = runtimeResult.accepted_executions;
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
        assertRuleDefinitionAuthority({
          currentSave,
          nextSave,
          csaPlan,
          structuredAction: definitionAction,
          stage: 'commit-final'
        });
        assertCanonicalSceneInvariants({ save: nextSave, scene: canonicalScene, npcIds, parsedStory });
        const turnChanges = deriveTurnChanges(currentSave, nextSave);

        // turn_summary는 빈 문자열을 허용한다 — 최신 Story context의 근거로 사용하지 않는다.
        // 최신 3턴은 Story 원문 전체로 context에 유지되고, story_summary_recent는
        // 이번 턴마다 갱신하지 않는다 (기존 필드는 호환용으로만 유지).
        const finalTurnSummary = '';
        // 선택지 단일 writer — applyGuardedStateDelta가 확정한 last_choices를
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
          let raw = '';
          try {
            const stream = await streamStory({ env, fetchImpl, messages, timing });
            for await (const text of stream.chunks) {
              raw += text;
              emit('delta', { text });
            }
          } catch (error) {
            // fail-open: Story upstream 최종 실패 시 저장된 opening plan으로 짧은
            // 기본 오프닝을 Commit한다 — 플레이어 설정이 reserved로 고착되지 않게 한다.
            const fallbackText = buildFallbackOpeningStory(openingPlan, player);
            const fallbackCommit = await db.callRpc('commit_company_opening', {
              p_game_id: gameId,
              p_setup_id: setupId,
              p_background: '회사에서의 첫 장면이 시작되었다.',
              p_story_text: fallbackText,
              p_choices: DEFAULT_OPENING_CHOICES
            });
            emit('delta', { text: fallbackText });
            emit('complete', {
              setup_id: setupId, choices: DEFAULT_OPENING_CHOICES,
              background: '회사에서의 첫 장면이 시작되었다.',
              warnings: ['opening_fallback'], replayed: false, commit: fallbackCommit
            });
            return;
          }
          const { background, body: sections, warnings: splitWarnings } = splitOpeningSections(raw);
          const parsedOpening = parseNarrative(sections, { master });
          // fail-open: 선택지가 부족하면 deterministic 기본 선택지로 채운다 (설정 완료 차단 금지).
          const rawChoices = (Array.isArray(parsedOpening.choices) ? parsedOpening.choices : []).filter(choice => typeof choice === 'string' && choice.trim());
          const finalChoices = rawChoices.length === 4 ? rawChoices : DEFAULT_OPENING_CHOICES;
          const commit = await db.callRpc('commit_company_opening', {
            p_game_id: gameId,
            p_setup_id: setupId,
            p_background: background,
            p_story_text: parsedOpening.raw,
            p_choices: finalChoices
          });
          emit('complete', {
            setup_id: setupId, choices: finalChoices, background,
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
