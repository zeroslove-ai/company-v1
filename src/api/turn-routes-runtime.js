import { createTurnRoutes as createBaseTurnRoutes, masterFromEdition } from './turn-routes.js';
import {
  buildCsaApplicationCheckSection,
  buildCsaPublicSceneSection,
  buildCsaRuntimeExtractContractSection,
  buildCsaWeakSynergySection,
  buildMindEffectExtractFirewallSection,
  calculateCsaCapability,
  getApplicableCsaEntries,
  hydrateGameplayState,
  normalizeStructuredAction,
  planCsaTransaction
} from '../engine/index.js';
import {
  applyCsaPlanToContext,
  buildContextDisplayPayload,
  buildCsaOfficialNoticeSection,
  buildCsaTransactionDetailsSection,
  buildNpcAppPayload
} from './runtime-display.js';
import { buildCharacterDisplayDetails, buildPlayerSexualDisplay } from './character-display.js';
import { buildFullPlayerInfo, buildFinderNpcList } from './product-recovery.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function requestUrl(input) {
  return typeof input === 'string' ? input : input?.url ?? '';
}

function isContextRpc(url) {
  return url.includes('/rest/v1/rpc/get_company_context');
}

function isActionRead(url, init) {
  return url.includes('/rest/v1/game_actions?') && (init?.method ?? 'GET') === 'GET';
}

function isCompletion(url) {
  return url.endsWith('/chat/completions') || url.includes('/chat/completions?');
}

function hydratedSave(context, master) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  if (save.edition !== 'company-v1' || save.save_schema_version !== 1) return save;
  return hydrateGameplayState(save, master);
}

function responseWithJson(response, payload) {
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(payload), { status: response.status, statusText: response.statusText, headers });
}

function okResponse(data) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

async function responseJson(response) {
  try { return await response.clone().json(); }
  catch { return null; }
}

function latestTurn(context) {
  const turns = Array.isArray(context?.recent_turns) ? context.recent_turns : [];
  return object(turns.at(-1)) ?? {};
}

function latestMind(context) {
  return object(latestTurn(context)?.mind_monitor) ?? {};
}

function authorityLabel(strength) {
  if (strength === 'strong') return '국가 법령·관계 당국 의무 지침';
  if (strength === 'medium') return '취업규칙·전사 준수 규정';
  return '인사팀 공식 공지·사내 운영지침';
}

function activeRulesSection(save) {
  const active = getApplicableCsaEntries(save);
  const lines = active.length
    ? active.map(item => `- (${item.id}) [${item.strength || 'weak'} / ${authorityLabel(item.strength)}] ${item.content || ''}`).join('\n')
    : '- 없음';
  return `\n\n[POST-TRANSACTION ACTIVE CSA SET — FINAL AUTHORITY]\n아래 목록이 이번 Story/Extract 턴에 실제로 활성인 전체 상식개변이다. 앞선 Context나 application-check에 이 목록에 없는 ID가 남아 있다면 무시하고, 아래 목록의 ID·강도·권위·내용만 적용한다.\n${lines}`;
}

function appTransactionInputFirewall() {
  return `\n\n[APP TRANSACTION INPUT FIREWALL — HIGHEST PRIORITY]\n이번 player_action/display_input은 앱 조작을 사람이 읽을 수 있게 설명한 메타 입력이지 장면 속 신체 행동·요구·대사가 아니다. 이 입력 자체를 CSA 적용 여부, 성적 행동, NPC 대상 명령으로 판정하지 않는다. 이미 확정된 규정의 적용 이후 장면만 작성한다.`;
}

function extractAuthorityContract() {
  return `\n\n[CSA AUTHORITY AND NPC STAT EXTRACTION]\n- 약함은 인사팀 공식 공지·사내 운영지침, 중간은 취업규칙·전사 준수 규정, 강함은 국가 법령·관계 당국 의무 지침이다.\n- 권위가 높을수록 규정 준수 압력과 업무상 자기합리화가 강해질 수 있지만 호감·사적 복종·성적 동의를 뜻하지 않는다.\n- npc_stats는 affinity, csa_acceptance, sexual_arousal 세 축만 사용한다. resistance는 NPC 고정값으로 절대 변경하지 않는다. 각 변화는 Story의 별도 근거가 있어야 한다.\n- 규정 공지나 직접 수행만으로 affinity를 올리지 않는다. csa_acceptance는 활성 규정의 직접 의미를 실제 판단·행동에 반영한 경우에만 변경한다.`;
}

function appendSystem(messages, content) {
  if (!content) return messages;
  const index = messages.findIndex(message => message?.role === 'system' && typeof message.content === 'string');
  if (index === -1) return [{ role: 'system', content }, ...messages];
  return messages.map((message, messageIndex) => messageIndex === index
    ? { ...message, content: message.content + content }
    : message);
}

function planState({ edition, requestBody }) {
  return {
    master: masterFromEdition(edition),
    structuredAction: requestBody?.structured_action ?? null,
    expectedTurn: Number.isInteger(requestBody?.expected_turn) ? requestBody.expected_turn : null,
    previousSave: null,
    plan: null,
    postSave: null
  };
}

function computePlan(state) {
  if (state.plan || !state.previousSave || !state.structuredAction) return;
  const normalized = normalizeStructuredAction(state.structuredAction);
  if (!normalized) return;
  const expectedTurn = state.expectedTurn ?? (normalized.base_turn_count + 1);
  const capability = calculateCsaCapability(state.previousSave, getApplicableCsaEntries(state.previousSave).length);
  const plan = planCsaTransaction(state.previousSave, state.csaCatalog, normalized.operations, { turnNumber: expectedTurn, capability });
  if (!plan.ok) return;
  state.plan = plan;
  state.postSave = applyCsaPlanToContext({ save: state.previousSave }, plan).save;
}

function captureContext(state, context) {
  if (!object(context)) return;
  state.context = context;
  state.previousSave = hydratedSave(context, state.master);
  computePlan(state);
}

function captureAction(state, payload) {
  const action = Array.isArray(payload) ? payload[0] : payload;
  if (!object(action)) return;
  if (!state.structuredAction && action.structured_action) state.structuredAction = action.structured_action;
  if (!state.expectedTurn && Number.isInteger(action.expected_turn)) state.expectedTurn = action.expected_turn;
  computePlan(state);
}

export function patchCompletionBody(init, state) {
  if (!state.plan || !state.postSave || typeof init?.body !== 'string') return init;
  let body;
  try { body = JSON.parse(init.body); }
  catch { return init; }
  if (!Array.isArray(body.messages)) return init;

  const isStory = body.stream === true;
  const active = getApplicableCsaEntries(state.postSave);
  let messages = body.messages;
  let authoritative = activeRulesSection(state.postSave)
    + buildCsaTransactionDetailsSection(state.plan, state.previousSave)
    + appTransactionInputFirewall();

  if (isStory) {
    authoritative += buildCsaOfficialNoticeSection(state.plan, state.previousSave, state.postSave);
    const hasPublic = active.some(item => item.preset?.public_normalization === true || item.semantic_contract?.public_normalization === true);
    if (hasPublic) authoritative += buildCsaPublicSceneSection();
    if (active.length >= 2) authoritative += buildCsaWeakSynergySection();
  } else {
    authoritative += '\n\n[POST-TRANSACTION EXTRACT CHECK — FINAL AUTHORITY]\nCSA 누락·runtime 평가는 위 최종 활성 목록만 대상으로 수행한다. 해제되어 목록에서 빠진 규정은 이번 턴 active 평가 대상이 아니다.';
    authoritative += extractAuthorityContract();
    authoritative += buildMindEffectExtractFirewallSection({ hasApplicableCsa: active.length > 0, hasCsaTransaction: true });
    authoritative += buildCsaApplicationCheckSection(active);
    authoritative += buildCsaRuntimeExtractContractSection(active);
  }
  messages = appendSystem(messages, authoritative);
  return { ...init, body: JSON.stringify({ ...body, messages }) };
}

function runtimeFetch(fetchImpl, state) {
  return async (input, init = {}) => {
    const url = requestUrl(input);
    if (isCompletion(url)) return fetchImpl(input, patchCompletionBody(init, state));
    const response = await fetchImpl(input, init);
    if (response?.ok && isActionRead(url, init)) captureAction(state, await responseJson(response));
    if (response?.ok && isContextRpc(url)) captureContext(state, await responseJson(response));
    return response;
  };
}

async function requestBody(request) {
  try { return await request.clone().json(); }
  catch { return {}; }
}

function mergeNpcPayload(save, edition, latestMindMonitor, details) {
  const existing = new Map(buildNpcAppPayload(save, edition, latestMindMonitor).map(item => [item.id, item]));
  return buildFinderNpcList(save, edition).map(finder => {
    const base = existing.get(finder.id) ?? {
      id: finder.id,
      name: finder.name,
      department: finder.department,
      position: finder.position,
      role: finder.role,
      present_now: finder.present_now,
      location: { known: finder.known, location_label: finder.location_label, location_id: finder.location_id },
      stats: { affection: 0, acceptance: 0, arousal: 0, resistance: 0 },
      mind: { surface: '', subconscious: '' },
      scene_state: {},
      relationship_summary: ''
    };
    const detail = details[finder.id] ?? {};
    return {
      ...base,
      name: base.name || finder.name,
      department: base.department || finder.department,
      position: base.position || finder.position,
      role: base.role || finder.role,
      present_now: finder.present_now,
      location: { known: finder.known, location_label: finder.location_label, location_id: finder.location_id },
      profile: detail.profile ?? {},
      body: detail.body ?? {},
      stat_changes: detail.stat_changes ?? {},
      relationship_summary: base.relationship_summary || detail.relationship_summary || '',
      relationship_record: detail.relationship_record ?? {},
      private_info: detail.private_info ?? { unlocked: false }
    };
  });
}

/**
 * Adds current-turn CSA projection and display payloads without changing the
 * base action/commit/recovery contracts. No extra LLM call, DB write, or RPC.
 */
export function createTurnRoutes({ fetchImpl = fetch, edition } = {}) {
  const base = createBaseTurnRoutes({ fetchImpl, edition });
  const master = masterFromEdition(edition);
  const csaCatalog = object(edition?.csaPresets) ?? {
    actor_options: [], target_options: [], trigger_options: [], duration_options: [],
    categories: [], items: [], sexual_action_contract: {}
  };

  return {
    ...base,

    async context(request, env, ctx) {
      const response = await base.context(request, env, ctx);
      const payload = await responseJson(response);
      if (!object(payload?.context)) return response;
      const save = hydratedSave(payload.context, master);
      const currentTurn = latestTurn(payload.context);
      payload.context = {
        ...payload.context,
        display: {
          ...buildContextDisplayPayload(save, edition, latestMind(payload.context)),
          player_info: buildFullPlayerInfo(save, edition),
          npc_finder: buildFinderNpcList(save, edition),
          character_details: buildCharacterDisplayDetails(save, edition, currentTurn),
          player_sexual: buildPlayerSexualDisplay(save)
        }
      };
      return responseWithJson(response, payload);
    },

    async appState(request, env, ctx) {
      const state = { master, context: null, previousSave: null, csaCatalog };
      const routes = createBaseTurnRoutes({ fetchImpl: runtimeFetch(fetchImpl, state), edition });
      const response = await routes.appState(request, env, ctx);
      const payload = await responseJson(response);
      if (!object(payload?.app) || !state.previousSave) return response;
      const details = buildCharacterDisplayDetails(state.previousSave, edition, latestTurn(state.context));
      payload.app = {
        ...payload.app,
        player_info: buildFullPlayerInfo(state.previousSave, edition),
        npcs: mergeNpcPayload(state.previousSave, edition, latestMind(state.context), details),
        finder_npcs: buildFinderNpcList(state.previousSave, edition)
      };
      return responseWithJson(response, payload);
    },

    async story(request, env, ctx) {
      const state = planState({ edition, requestBody: await requestBody(request) });
      state.csaCatalog = csaCatalog;
      const routes = createBaseTurnRoutes({ fetchImpl: runtimeFetch(fetchImpl, state), edition });
      return routes.story(request, env, ctx);
    },

    async extract(request, env, ctx) {
      const state = planState({ edition, requestBody: await requestBody(request) });
      state.csaCatalog = csaCatalog;
      const routes = createBaseTurnRoutes({ fetchImpl: runtimeFetch(fetchImpl, state), edition });
      return routes.extract(request, env, ctx);
    }
  };
}

export { masterFromEdition };
