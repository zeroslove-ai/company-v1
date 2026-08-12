export function makeJsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

export function makeJsonRequest(pathName, body, { baseUrl = 'https://worker.test', method = 'POST' } = {}) {
  return new Request(`${baseUrl}${pathName}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}
