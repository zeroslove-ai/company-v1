import { createProductionR3Worker } from './server/index.js';

export default {
  async fetch(request, env, ctx) {
    const requestId = request.headers.get('x-r3-request-id') || `r3-${crypto.randomUUID()}`;
    const response = await createProductionR3Worker({ env }).fetch(request, env, ctx);
    const headers = new Headers(response.headers);
    headers.set('x-r3-request-id', requestId);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
};
