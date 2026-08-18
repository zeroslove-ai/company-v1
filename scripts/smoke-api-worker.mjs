import { pathToFileURL } from 'node:url';

export class SmokeError extends Error {
  constructor(endpoint, status, code) {
    super(`${endpoint} failed`);
    this.endpoint = endpoint;
    this.status = status;
    this.code = code;
  }
}

export function requiredBaseUrl(value) {
  if (!value) throw new SmokeError('argument', 0, 'missing_worker_url');
  try {
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    throw new SmokeError('argument', 0, 'invalid_worker_url');
  }
}

export function requiredGameId(value) {
  if (!value) throw new SmokeError('argument', 0, 'missing_game_id');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new SmokeError('argument', 0, 'invalid_game_id');
  }
  return value;
}

export async function readSuccess(endpoint, response) {
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

function nonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

export function assertContext(body, requestedGameId) {
  const context = body.data?.context;
  const wrappedSave = context?.save;
  const save = wrappedSave?.data ?? wrappedSave;
  const exposedGameId = context?.game?.id ?? context?.game?.game_id ?? context?.game_id;
  const wrapperTurn = wrappedSave && typeof wrappedSave === 'object' && 'committed_turn' in wrappedSave
    ? wrappedSave.committed_turn
    : undefined;
  const nestedTurn = save?.turn_state?.committed_turn;
  if (
    context?.game?.edition_id !== 'company-v1' ||
    (exposedGameId !== undefined && exposedGameId !== requestedGameId) ||
    !save ||
    save.edition !== 'company-v1' ||
    save.save_schema_version !== 1 ||
    (wrapperTurn !== undefined && !nonNegativeInteger(wrapperTurn)) ||
    (nestedTurn !== undefined && !nonNegativeInteger(nestedTurn)) ||
    (wrapperTurn !== undefined && nestedTurn !== undefined && wrapperTurn !== nestedTurn)
  ) {
    throw new SmokeError('/api/context', 200, 'unexpected_context_payload');
  }
}

export async function runSmoke(baseUrl, gameId, fetchImpl = fetch) {
  for (const endpoint of ['/health', '/api/version']) {
    const body = await readSuccess(endpoint, await fetchImpl(`${baseUrl}${endpoint}`));
    assertStatus(endpoint, body);
  }

  const context = await readSuccess('/api/context', await fetchImpl(`${baseUrl}/api/context`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ game_id: gameId, recent_turns: 1 })
  }));
  assertContext(context, gameId);
}

export async function main(argv = process.argv, fetchImpl = fetch) {
  const baseUrl = requiredBaseUrl(argv[2]);
  const gameId = requiredGameId(argv[3]);
  await runSmoke(baseUrl, gameId, fetchImpl);
  process.stdout.write('REMOTE API SMOKE PASSED\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    const endpoint = error?.endpoint ?? 'unknown';
    const status = error?.status ?? 0;
    const code = error?.code ?? 'unexpected_error';
    process.stderr.write(`REMOTE API SMOKE FAILED endpoint=${endpoint} status=${status} error_code=${code}\n`);
    process.exit(1);
  });
}
