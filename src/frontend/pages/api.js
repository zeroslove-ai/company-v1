import { FRONTEND_CONFIG } from './config.js';

export class ApiError extends Error {
  constructor({ endpoint, status, code, message, retryable = false }) {
    super(message);
    this.name = 'ApiError';
    this.endpoint = endpoint;
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

export function createApiClient({ fetchImpl = fetch, baseUrl = FRONTEND_CONFIG.apiBaseUrl } = {}) {
  const endpointUrl = endpoint => new URL(endpoint, `${baseUrl.replace(/\/$/, '')}/`).toString();
  async function postJson(endpoint, body) {
    let response;
    try {
      response = await fetchImpl(endpointUrl(endpoint), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    } catch {
      throw new ApiError({ endpoint, status: 0, code: 'network_error', message: 'API 연결에 실패했습니다.', retryable: true });
    }
    let payload;
    try { payload = await response.json(); } catch { throw new ApiError({ endpoint, status: response.status, code: 'invalid_json_response', message: 'API 응답 형식이 올바르지 않습니다.' }); }
    if (!response.ok || payload?.ok !== true) {
      const error = payload?.error ?? {};
      throw new ApiError({ endpoint, status: response.status, code: error.code ?? 'request_failed', message: error.message ?? '요청에 실패했습니다.', retryable: Boolean(error.retryable) });
    }
    return payload.data;
  }
  async function story(body) {
    let response;
    try { response = await fetchImpl(endpointUrl('/api/story'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); }
    catch { throw new ApiError({ endpoint: '/api/story', status: 0, code: 'network_error', message: '서사 연결에 실패했습니다.', retryable: true }); }
    if (!response.ok) {
      let payload; try { payload = await response.json(); } catch { payload = null; }
      throw new ApiError({ endpoint: '/api/story', status: response.status, code: payload?.error?.code ?? 'story_failed', message: payload?.error?.message ?? '서사 생성에 실패했습니다.', retryable: Boolean(payload?.error?.retryable) });
    }
    return response;
  }
  return {
    context: body => postJson('/api/context', body), story,
    extract: body => postJson('/api/extract', body),
    commit: body => postJson('/api/commit', body),
    actionStatus: body => postJson('/api/action-status', body)
  };
}
