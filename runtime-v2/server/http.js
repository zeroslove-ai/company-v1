export class V2HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

export const V2_CORS_HEADERS = Object.freeze({
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type'
});

export function json(data, status = 200) {
  return new Response(JSON.stringify({ ok: true, data }), { status, headers: { ...V2_CORS_HEADERS, 'content-type': 'application/json; charset=utf-8' } });
}

export function errorResponse(error) {
  const normalized = error instanceof V2HttpError
    ? error
    : error?.code === 'configuration_error'
      ? new V2HttpError(500, error.code, error.message)
      : new V2HttpError(422, error?.message ?? 'v2_error', 'Company v2 request failed');
  return new Response(JSON.stringify({ ok: false, error: { code: normalized.code, message: normalized.message } }), { status: normalized.status, headers: { ...V2_CORS_HEADERS, 'content-type': 'application/json; charset=utf-8' } });
}

export async function body(request) {
  try { const value = await request.json(); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value; }
  catch { throw new V2HttpError(400, 'invalid_request', 'JSON object required'); }
}

export function sse(name, data) { return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`; }
