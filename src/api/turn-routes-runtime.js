import { createTurnRoutes as createBaseTurnRoutes, masterFromEdition } from './turn-routes.js';
import { hydrateGameplayState } from '../engine/index.js';
import { buildContextDisplayPayload, buildNpcAppPayload } from './runtime-display.js';
import { buildCharacterDisplayDetails, buildPlayerSexualDisplay } from './character-display.js';
import { buildFullPlayerInfo, buildFinderNpcList } from './product-recovery.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function responseWithJson(response, payload) {
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(payload), { status: response.status, statusText: response.statusText, headers });
}

async function responseJson(response) {
  try { return await response.clone().json(); } catch { return null; }
}

function latestTurn(context) {
  const turns = Array.isArray(context?.recent_turns) ? context.recent_turns : [];
  return object(turns.at(-1)) ?? {};
}

function latestMind(context) {
  return object(latestTurn(context)?.mind_monitor) ?? {};
}

function hydratedSave(context, master) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  if (save.edition !== 'company-v1' || save.save_schema_version !== 1) return save;
  return hydrateGameplayState(save, master);
}

function isContextRpc(url) {
  return url.includes('/rest/v1/rpc/get_company_context');
}

function requestUrl(input) {
  return typeof input === 'string' ? input : input?.url ?? '';
}

function runtimeFetch(fetchImpl, state) {
  return async (input, init = {}) => {
    const response = await fetchImpl(input, init);
    if (response?.ok && isContextRpc(requestUrl(input))) {
      state.context = await response.clone().json().catch(() => null);
      state.previousSave = hydratedSave(state.context, state.master);
    }
    return response;
  };
}

function mergeNpcPayload(save, edition, latestMindMonitor, details) {
  const existing = new Map(buildNpcAppPayload(save, edition, latestMindMonitor).map(item => [item.id, item]));
  return buildFinderNpcList(save, edition).map(finder => {
    const base = existing.get(finder.id) ?? {
      id: finder.id, name: finder.name, department: finder.department, position: finder.position,
      role: finder.role, present_now: finder.present_now,
      location: { known: finder.known, location_label: finder.location_label, location_id: finder.location_id },
      stats: { affection: 0, acceptance: 0, arousal: 0, resistance: 0 },
      mind: { surface: '', subconscious: '' }, scene_state: {}, relationship_summary: ''
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
      profile: detail.profile ?? {}, body: detail.body ?? {}, stat_changes: detail.stat_changes ?? {},
      relationship_summary: base.relationship_summary || detail.relationship_summary || '',
      relationship_record: detail.relationship_record ?? {},
      private_info: detail.private_info ?? { unlocked: false }
    };
  });
}

/** Display-only enrichment boundary. Story/Extract/Commit are delegated unchanged. */
export function createTurnRoutes({ fetchImpl = fetch, edition } = {}) {
  const base = createBaseTurnRoutes({ fetchImpl, edition });
  const master = masterFromEdition(edition);
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
          character_details: buildCharacterDisplayDetails(save, edition, currentTurn),
          player_sexual: buildPlayerSexualDisplay(save)
        }
      };
      return responseWithJson(response, payload);
    },
    async appState(request, env, ctx) {
      const state = { master, context: null, previousSave: null };
      const routes = createBaseTurnRoutes({ fetchImpl: runtimeFetch(fetchImpl, state), edition });
      const response = await routes.appState(request, env, ctx);
      const payload = await responseJson(response);
      if (!object(payload?.app) || !state.previousSave) return response;
      const details = buildCharacterDisplayDetails(state.previousSave, edition, latestTurn(state.context));
      payload.app = {
        ...payload.app,
        player_info: buildFullPlayerInfo(state.previousSave, edition),
        npcs: mergeNpcPayload(state.previousSave, edition, latestMind(state.context), details)
      };
      return responseWithJson(response, payload);
    },
    async story(request, env, ctx) { return base.story(request, env, ctx); },
    async extract(request, env, ctx) { return base.extract(request, env, ctx); }
  };
}

export { masterFromEdition };
