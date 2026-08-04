import edition from './edition.js';
import { fail, HttpError, jsonResponse, optionsResponse } from './http.js';
import { createTurnRoutes } from './turn-routes.js';
import { GameCoreError } from '../engine/errors.js';

const PHASE = 'phase-2-vertical-loop';

function buildStatus() {
  return {
    ok: true,
    edition_id: edition.editionId,
    phase: PHASE,
    content_version: edition.contentVersion
  };
}

export function createApiWorker({ fetchImpl = fetch } = {}) {
  const routes = createTurnRoutes({ fetchImpl, edition });
  return {
    async fetch(request) {
      const env = arguments[1] ?? {};
      const ctx = arguments[2];
      try {
        const { pathname } = new URL(request.url);

        if (request.method === 'OPTIONS') return optionsResponse();
        if (request.method === 'GET' && (pathname === '/health' || pathname === '/api/version')) return jsonResponse(buildStatus());

        if (request.method === 'POST' && pathname === '/api/context') return await routes.context(request, env, ctx);
        if (request.method === 'POST' && pathname === '/api/story') return await routes.story(request, env, ctx);
        if (request.method === 'POST' && pathname === '/api/extract') return await routes.extract(request, env, ctx);
        if (request.method === 'POST' && pathname === '/api/commit') return await routes.commit(request, env, ctx);
        if (request.method === 'POST' && pathname === '/api/action-status') return await routes.actionStatus(request, env, ctx);
        if (request.method === 'POST' && pathname === '/api/reset') return await routes.reset(request, env, ctx);
        if (request.method === 'POST' && pathname === '/api/player-setup') return await routes.playerSetup(request, env, ctx);
        if (request.method === 'POST' && pathname === '/api/opening') return await routes.opening(request, env, ctx);
        if (request.method === 'POST' && pathname === '/api/app-manual') return await routes.appManual(request, env, ctx);
        if (request.method === 'POST' && pathname === '/api/app-state') return await routes.appState(request, env, ctx);
        if (request.method === 'POST' && pathname === '/api/app-validate') return await routes.appValidate(request, env, ctx);
        if (request.method === 'POST' && pathname === '/api/find-npc') return await routes.findNpc(request, env, ctx);
        if (request.method === 'POST' && pathname === '/api/history') return await routes.history(request, env, ctx);
        if (request.method === 'POST' && pathname === '/api/feedback') return await routes.feedback(request, env, ctx);
        if (request.method === 'POST' && pathname === '/api/image') return await routes.image(request, env, ctx);
        return fail(new HttpError(404, 'not_found', 'Route not found'));
      } catch (error) {
        return fail(error instanceof GameCoreError
          ? new HttpError(422, error.code.toLowerCase(), error.message)
          : error);
      }
    }
  };
}

export default createApiWorker();
