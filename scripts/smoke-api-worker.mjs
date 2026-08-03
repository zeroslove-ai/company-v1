const gameId = '11111111-1111-4111-8111-111111111111';

class SmokeError extends Error {
  constructor(endpoint, status, code) {
    super(`${endpoint} failed`);
    this.endpoint = endpoint;
    this.status = status;
    this.code = code;
  }
}

function requiredBaseUrl(value) {
  if (!value) throw new SmokeError('argument', 0, 'missing_worker_url');
  try {
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    throw new SmokeError('argument', 0, 'invalid_worker_url');
  }
}

async function readSuccess(endpoint, response) {
  let body;
  try {
    body = await response.json();
  } catch {
    throw new SmokeError(endpoint, response.status, 'invalid_json_response');
  }
  if (!response.ok || body?.ok !== true) {
    throw new SmokeError(endpoint, response.status, body?.error?.code ?? 'request_failed');
  }
  return body;
}

function assertStatus(endpoint, body) {
  if (body.edition_id !== 'company-v1' || body.phase !== 'phase-2-vertical-loop') {
    throw new SmokeError(endpoint, 200, 'unexpected_status_payload');
  }
}

function assertContext(body) {
  const context = body.data?.context;
  const save = context?.save?.data ?? context?.save;
  if (
    context?.game?.edition_id !== 'company-v1' ||
    save?.edition !== 'company-v1' ||
    save?.save_schema_version !== 1 ||
    save?.turn_state?.committed_turn !== 0
  ) {
    throw new SmokeError('/api/context', 200, 'unexpected_context_payload');
  }
}

async function main() {
  const baseUrl = requiredBaseUrl(process.argv[2]);
  for (const endpoint of ['/health', '/api/version']) {
    const body = await readSuccess(endpoint, await fetch(`${baseUrl}${endpoint}`));
    assertStatus(endpoint, body);
  }

  const context = await readSuccess('/api/context', await fetch(`${baseUrl}/api/context`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ game_id: gameId, recent_turns: 1 })
  }));
  assertContext(context);
  process.stdout.write('REMOTE API SMOKE PASSED\n');
}

main().catch(error => {
  const endpoint = error?.endpoint ?? 'unknown';
  const status = error?.status ?? 0;
  const code = error?.code ?? 'unexpected_error';
  process.stderr.write(`REMOTE API SMOKE FAILED endpoint=${endpoint} status=${status} error_code=${code}\n`);
  process.exit(1);
});
