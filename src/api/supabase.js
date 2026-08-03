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

export function createSupabaseClient(env, fetchImpl) {
  const baseUrl = requireEnv(env, 'SUPABASE_URL').replace(/\/$/, '');
  const secret = requireEnv(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = { apikey: secret, authorization: `Bearer ${secret}`, 'content-type': 'application/json' };

  async function request(url, init) {
    const response = await fetchImpl(url, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
    const payload = await responsePayload(response);
    if (!response.ok) {
      const message = typeof payload === 'object' && payload?.message ? payload.message : String(payload ?? 'Supabase request failed');
      throw new HttpError(response.status === 409 ? 409 : 502, response.status === 409 ? 'turn_conflict' : 'supabase_error', message, response.status >= 500);
    }
    return payload;
  }

  return {
    callRpc(name, args) {
      return request(`${baseUrl}/rest/v1/rpc/${name}`, { method: 'POST', body: JSON.stringify(args) });
    },
    async getAction(gameId, actionId) {
      const query = new URLSearchParams({ game_id: `eq.${gameId}`, action_id: `eq.${actionId}`, select: '*' });
      const payload = await request(`${baseUrl}/rest/v1/game_actions?${query}`, { method: 'GET' });
      return Array.isArray(payload) ? payload[0] ?? null : payload;
    },
    updateActionStatus(gameId, actionId, status, errorCode = null) {
      const query = new URLSearchParams({ game_id: `eq.${gameId}`, action_id: `eq.${actionId}` });
      return request(`${baseUrl}/rest/v1/game_actions?${query}`, {
        method: 'PATCH',
        headers: { prefer: 'return=minimal' },
        body: JSON.stringify({ processing_status: status, error_code: errorCode })
      });
    }
  };
}
