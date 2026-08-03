export class HttpError extends Error {
  constructor(status, code, message, retryable = false) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type'
};

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json; charset=utf-8' }
  });
}

export function ok(data, status = 200) {
  return jsonResponse({ ok: true, data }, status);
}

export function fail(error) {
  const normalized = error instanceof HttpError
    ? error
    : new HttpError(500, 'internal_error', 'Unexpected server error');
  return jsonResponse({ ok: false, error: { code: normalized.code, message: normalized.message, retryable: normalized.retryable } }, normalized.status);
}

export async function readJson(request) {
  try {
    const value = await request.json();
    if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('not object');
    return value;
  } catch {
    throw new HttpError(400, 'invalid_request', 'Request body must be a JSON object');
  }
}

export function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new HttpError(400, 'invalid_request', `${field} is required`);
  return value;
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function sseEvent(name, data) {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function sseResponse(stream) {
  return new Response(stream, {
    headers: { ...corsHeaders, 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' }
  });
}
