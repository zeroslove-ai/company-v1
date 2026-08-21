export const R3_CORS_HEADERS = Object.freeze({ 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' });

export function json(data, status = 200) { return new Response(JSON.stringify({ ok: status < 400, data }), { status, headers: { ...R3_CORS_HEADERS, 'content-type': 'application/json; charset=utf-8' } }); }
export function sse(name, data) { return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`; }
export async function body(request) { try { return await request.json(); } catch { throw new Error('r3_invalid_json'); } }
export function errorResponse(error) {
  const code = error?.message || 'r3_internal_error';
  const status = code.includes('not_found') ? 404 : code.includes('invalid') || code.includes('required') || code.includes('conflict') ? 400 : 500;
  return json({ code, message: code }, status);
}
