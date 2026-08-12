import { HttpError } from './http.js';

async function responsePayload(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function requireEnv(env, name) {
  const value = env?.[name];
  if (typeof value !== 'string' || value === '') throw new HttpError(500, 'configuration_error', `${name} is not configured`);
  return value;
}

function upstreamError(payload, response) {
  const body = payload !== null && typeof payload === 'object' ? payload : null;
  const code = body?.code ?? body?.error?.code;
  const message = body?.message ?? body?.error?.message ?? String(payload ?? 'Supabase request failed');
  const mapped = {
    '40001': [409, 'turn_conflict', false],
    P0002: [404, 'not_found', false],
    '22023': [400, 'invalid_request', false],
    '23505': [409, 'action_conflict', false]
  }[code];
  if (mapped) return new HttpError(mapped[0], mapped[1], message, mapped[2]);
  if (response.status >= 400 && response.status < 500) return new HttpError(response.status, 'supabase_error', message, false);
  return new HttpError(502, 'supabase_error', message, true);
}

export function createSupabaseClient(env, fetchImpl) {
  const baseUrl = requireEnv(env, 'SUPABASE_URL').replace(/\/$/, '');
  const secret = requireEnv(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = { apikey: secret, authorization: `Bearer ${secret}`, 'content-type': 'application/json' };

  async function request(url, init) {
    const response = await fetchImpl(url, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
    const payload = await responsePayload(response);
    if (!response.ok) {
      throw upstreamError(payload, response);
    }
    return payload;
  }

  return {
    callRpc(name, args) {
      return request(`${baseUrl}/rest/v1/rpc/${name}`, { method: 'POST', body: JSON.stringify(args) });
    },
    reserveTurnAction(gameId, actionId, expectedTurn, playerAction, structuredAction = null) {
      return this.callRpc('reserve_turn_action', {
        p_game_id: gameId,
        p_action_id: actionId,
        p_expected_turn: expectedTurn,
        p_player_action: playerAction,
        p_structured_action: structuredAction
      });
    },
    applyReservedCsaTransaction(gameId, actionId, expectedTurn) {
      return this.callRpc('apply_reserved_csa_transaction', {
        p_game_id: gameId,
        p_action_id: actionId,
        p_expected_turn: expectedTurn
      });
    },
    async getAction(gameId, actionId) {
      const query = new URLSearchParams({ game_id: `eq.${gameId}`, action_id: `eq.${actionId}`, select: '*' });
      const payload = await request(`${baseUrl}/rest/v1/game_actions?${query}`, { method: 'GET' });
      return Array.isArray(payload) ? payload[0] ?? null : payload;
    },
    async getTurnById(gameId, turnId) {
      if (typeof turnId !== 'string' || !turnId) return null;
      const query = new URLSearchParams({ game_id: `eq.${gameId}`, turn_id: `eq.${turnId}`, select: 'turn_id,turn_number,story_text,parsed_blocks' });
      const payload = await request(`${baseUrl}/rest/v1/game_turns?${query}`, { method: 'GET' });
      return Array.isArray(payload) ? payload[0] ?? null : payload;
    },
    updateActionStatus(gameId, actionId, status, errorCode = null) {
      const query = new URLSearchParams({ game_id: `eq.${gameId}`, action_id: `eq.${actionId}` });
      return request(`${baseUrl}/rest/v1/game_actions?${query}`, {
        method: 'PATCH',
        headers: { prefer: 'return=minimal' },
        body: JSON.stringify({ processing_status: status, error_code: errorCode })
      });
    },
    async claimActionStatus(gameId, actionId, expectedStatus, nextStatus, errorCode, requireEmptyErrorCode = false) {
      const query = new URLSearchParams({ game_id: `eq.${gameId}`, action_id: `eq.${actionId}`, processing_status: `eq.${expectedStatus}` });
      if (requireEmptyErrorCode) query.set('error_code', 'is.null');
      const payload = await request(`${baseUrl}/rest/v1/game_actions?${query}`, {
        method: 'PATCH',
        headers: { prefer: 'return=representation' },
        body: JSON.stringify({ processing_status: nextStatus, error_code: errorCode })
      });
      return Array.isArray(payload) ? payload[0] ?? null : payload;
    },
    /** Read-only, paginated, active-only (record_status=active dedupes revisions to the current one) turn history — no RPC needed, table already carries everything /api/history needs. */
    async listTurns(gameId, { beforeTurn = null, limit = 20 } = {}) {
      const query = new URLSearchParams({
        game_id: `eq.${gameId}`, record_status: 'eq.active',
        select: 'turn_number,player_action,structured_action,feedback_text,story_text,parsed_blocks,turn_summary,mind_monitor,choices,committed_at',
        order: 'turn_number.desc', limit: String(limit)
      });
      if (Number.isInteger(beforeTurn)) query.set('turn_number', `lt.${beforeTurn}`);
      const payload = await request(`${baseUrl}/rest/v1/game_turns?${query}`, { method: 'GET' });
      return Array.isArray(payload) ? payload : [];
    },
    reserveFeedbackRevision(gameId, revisionRequestId, feedbackText) {
      return this.callRpc('reserve_feedback_revision', { p_game_id: gameId, p_revision_request_id: revisionRequestId, p_feedback_text: feedbackText });
    },
    commitFeedbackRevision(gameId, actionId, revisionRequestId, nextSave, turnSummary, mindMonitor, choices) {
      return this.callRpc('commit_feedback_revision', {
        p_game_id: gameId, p_action_id: actionId, p_revision_request_id: revisionRequestId,
        p_next_save: nextSave, p_turn_summary: turnSummary, p_mind_monitor: mindMonitor, p_choices: choices
      });
    },
    /** At most 8 active candidates for one character+pool — image-selector.js scores exactly this set, never the whole catalog. */
    async listImageCandidates(characterId, pool) {
      const query = new URLSearchParams({
        character_id: `eq.${characterId}`, active: 'eq.true', image_pool: `eq.${pool}`,
        select: 'image_id,character_id,situation,tags,image_pool,is_sexual,curation_rank,image_url',
        order: 'curation_rank.asc.nullslast', limit: '8'
      });
      const payload = await request(`${baseUrl}/rest/v1/image_library?${query}`, { method: 'GET' });
      return Array.isArray(payload) ? payload : [];
    }
  };
}
