import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContentAdapter } from '../runtime-v2/domain/content.js';
import { createV2Worker as createWorker, createProductionV2Worker } from '../runtime-v2/server/worker.js';
import { InMemoryV2Store, createInMemoryPersistence } from '../runtime-v2/server/store.js';
import { SupabaseV2Store } from '../runtime-v2/server/supabase-store.js';
import { createV2Provider } from '../runtime-v2/server/provider.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = createContentAdapter();

function createV2Worker(options = {}) {
  return createWorker({ content, store: new InMemoryV2Store({ content }), provider: providerFor(), ...options });
}

function providerFor({ story, observe, delay = 0 } = {}) {
  return {
    async *story(input) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      yield typeof story === 'function' ? story(input) : story ?? `[NARRATIVE]\n그대로 저장: ${input.literalAction}\n\n[DIALOGUE id="heroine1"]\n확인했습니다.\n\n[CHOICE]\n하나\n[CHOICE]\n둘\n[CHOICE]\n셋\n[CHOICE]\n넷\n[/CHOICE]`;
    },
    async observe(input) { return observe ? observe(input) : { elapsed_minutes: 3, turn_summary: '', mind_monitor: { heroine1: { surface: '관련 상태', subconscious: '관련 생각' }, heroine2: { surface: '무관', subconscious: '무관' } } }; }
  };
}

async function game(worker) {
  const setup = await worker.fetch(new Request('https://v2.test/api/v2/setup', { method: 'POST', body: JSON.stringify({ player_name: '민수' }) }));
  const setupData = (await setup.json()).data;
  const opening = await worker.fetch(new Request('https://v2.test/api/v2/opening', { method: 'POST', body: JSON.stringify({ game_id: setupData.game.game_id }) }));
  return { gameId: setupData.game.game_id, opening: (await opening.json()).data };
}

async function turn(worker, gameId, literalAction, providerActionId = crypto.randomUUID()) {
  const options = arguments[4] ?? {};
  return worker.fetch(new Request('https://v2.test/api/v2/turn', { method: 'POST', body: JSON.stringify({ game_id: gameId, action_id: providerActionId, expected_turn: options.expectedTurn ?? 1, retry_failed: options.retryFailed === true, literal_action: literalAction }) }));
}

test('v2 trees are physically isolated from old gameplay modules', async () => {
  const forbidden = /src[\\/]engine|runtime-core|\/api\/(?:story|extract|commit)|step\s*[:=]\s*["'](?:story|extract|commit)/i;
  const files = [];
  async function visit(dir) { for (const entry of await fs.readdir(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) await visit(full); else files.push(full); } }
  await visit(path.join(root, 'runtime-v2')); await visit(path.join(root, 'frontend-v2'));
  for (const file of files) assert.equal(forbidden.test(await fs.readFile(file, 'utf8')), false, file);
});

test('v2 persistence source is additive, isolated, and one-boundary', async () => {
  const migration = await fs.readFile(path.join(root, 'supabase/migrations/20260819000200_company_v2_phase1_vertical_slice.sql'), 'utf8');
  for (const table of ['company_v2_games', 'company_v2_state', 'company_v2_turn_jobs', 'company_v2_turns']) assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
  assert.match(migration, /company_v2_commit_turn/); assert.match(migration, /set search_path = public, pg_temp/);
  assert.doesNotMatch(migration, /game_actions|game_save|game_turns|apply_reserved_csa_transaction/);
});

test('frontend-v2 submits only literal input to the single v2 turn endpoint', async () => {
  const frontend = await fs.readFile(path.join(root, 'frontend-v2/app.js'), 'utf8');
  assert.match(frontend, /\/api\/v2\/turn/); assert.doesNotMatch(frontend, /\/api\/(?:story|extract|commit)/);
  assert.doesNotMatch(frontend, /step\s*[:=]\s*["'](?:story|extract|commit)/i); assert.match(frontend, /literal_action/); assert.match(frontend, /retry_failed/);
});

test('production Worker selects DB store and real provider, with no silent test fallback', () => {
  const env = { SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_ROLE_KEY: 'service-key', LLM_API_URL: 'https://provider.example', LLM_API_KEY: 'llm-key', STORY_MODEL: 'configured-story-model', EXTRACT_MODEL: 'configured-observation-model' };
  const worker = createProductionV2Worker({ env, fetchImpl: async () => { throw new Error('network not expected'); } });
  assert.equal(worker.store instanceof SupabaseV2Store, true); assert.equal(worker.provider.kind, 'v2-llm-provider');
  assert.throws(() => createProductionV2Worker({ env: {} }), /SUPABASE_URL/);
});

test('default Worker fails clearly without production configuration', async () => {
  const response = await (await import('../runtime-v2/server/worker.js')).default.fetch(new Request('https://v2.test/api/v2/context?game_id=missing'), {});
  assert.equal(response.status, 500); assert.equal((await response.json()).error.code, 'configuration_error');
});

test('v2 API preflight and responses expose browser CORS contract', async () => {
  const worker = createV2Worker({ content });
  const preflight = await worker.fetch(new Request('https://v2.test/api/v2/turn', { method: 'OPTIONS', headers: { origin: 'https://gamebuilder-company-v2.zeroslove.workers.dev', 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' } }));
  assert.equal(preflight.status, 204); assert.equal(preflight.headers.get('access-control-allow-origin'), '*'); assert.match(preflight.headers.get('access-control-allow-methods'), /POST/); assert.match(preflight.headers.get('access-control-allow-headers'), /content-type/);
  const response = await worker.fetch(new Request('https://v2.test/api/v2/context?game_id=missing'));
  assert.equal(response.headers.get('access-control-allow-origin'), '*'); assert.equal(response.headers.get('access-control-allow-methods'), 'GET, POST, OPTIONS'); assert.equal(response.headers.get('access-control-allow-headers'), 'content-type');
  const success = await worker.fetch(new Request('https://v2.test/api/v2/setup', { method: 'POST', body: JSON.stringify({ player_name: 'cors' }) }));
  assert.equal(success.status, 200); assert.equal(success.headers.get('access-control-allow-origin'), '*');
  const { gameId } = await game(worker); const stream = await turn(worker, gameId, 'cors stream');
  assert.match(stream.headers.get('content-type'), /text\/event-stream/); assert.equal(stream.headers.get('access-control-allow-origin'), '*'); await stream.text();
});

test('frontend-v2 uses one dedicated API base and no v1 identity', async () => {
  const config = await fs.readFile(path.join(root, 'frontend-v2/config.js'), 'utf8');
  const frontend = await fs.readFile(path.join(root, 'frontend-v2/app.js'), 'utf8');
  assert.match(config, /game-proxy-company-v2\.zeroslove\.workers\.dev/); assert.doesNotMatch(config, /game-proxy-company-v1/); assert.match(frontend, /V2_API_BASE_URL/); assert.doesNotMatch(frontend, /fetch\(['"]\//); assert.equal((frontend.match(/V2_API_BASE_URL/g) ?? []).length, 2);
});

test('dedicated v2 Wrangler configs isolate API and frontend identities', async () => {
  const apiConfig = JSON.parse(await fs.readFile(path.join(root, 'wrangler.v2.api.jsonc'), 'utf8'));
  const frontendConfig = JSON.parse(await fs.readFile(path.join(root, 'wrangler.v2.frontend.jsonc'), 'utf8'));
  assert.deepEqual({ name: apiConfig.name, main: apiConfig.main }, { name: 'game-proxy-company-v2', main: 'runtime-v2/server/worker.js' });
  assert.deepEqual({ name: frontendConfig.name, directory: frontendConfig.assets.directory }, { name: 'gamebuilder-company-v2', directory: 'frontend-v2' });
  assert.doesNotMatch(JSON.stringify(apiConfig), /company-v1/); assert.doesNotMatch(JSON.stringify(frontendConfig), /company-v1/);
});

test('real provider constructs one literal Story request and one typed observation request', async () => {
  const requests = [];
  const fetchImpl = async (_url, options) => {
    const payload = JSON.parse(options.body); requests.push(payload);
    if (payload.stream) return new Response('data: {"choices":[{"delta":{"content":"[NARRATIVE]\\nhello\\n\\n[CHOICE]\\none\\n[CHOICE]\\ntwo\\n[CHOICE]\\nthree\\n[CHOICE]\\nfour\\n[/CHOICE]"}}]}\n\ndata: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } });
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"elapsed_minutes":3,"scene":{"entered":[],"exited":[]},"turn_summary":"ok","mind_monitor":{}}' } }] }), { headers: { 'content-type': 'application/json' } });
  };
  const provider = createV2Provider({ env: { LLM_API_URL: 'https://provider.example', LLM_API_KEY: 'key', STORY_MODEL: 'configured-story-model', EXTRACT_MODEL: 'configured-observation-model' }, fetchImpl, content });
  const story = []; for await (const chunk of provider.story({ literalAction: 'literal 한국어', context: { state: { state: { time: { day: 1, minute: 540 }, scene: { location_id: 'lobby', present_npc_ids: [] } } }, turns: [] } })) story.push(chunk);
  await provider.observe({ literalAction: 'literal 한국어', storyText: story.join(''), context: { state: { state: {} } } });
  assert.equal(requests.length, 2); assert.equal(requests[0].stream, true); assert.match(requests[0].messages[1].content, /literal 한국어/); assert.equal(requests[1].stream, false); assert.match(requests[1].messages[0].content, /typed Company v2 observer/); assert.doesNotMatch(requests[1].messages[0].content, /(?:game_actions|save_path)/);
});

test('real provider preserves separate configured model roles', async () => {
  const requests = [];
  const provider = createV2Provider({ env: { LLM_API_URL: 'https://provider.example', LLM_API_KEY: 'key', STORY_MODEL: 'story-role', EXTRACT_MODEL: 'observation-role' }, fetchImpl: async (_url, options) => { requests.push(JSON.parse(options.body)); return new Response(JSON.stringify({ choices: [{ message: { content: '{"elapsed_minutes":1,"scene":{"entered":[],"exited":[]},"turn_summary":"ok","mind_monitor":{}}' } }] })); }, content });
  await provider.observe({ literalAction: 'observe', storyText: '[NARRATIVE] observe', context: { state: { state: {} } } });
  assert.equal(requests[0].model, 'observation-role');
});

test('real provider uses STORY_MODEL for Story generation', async () => {
  const requests = [];
  const provider = createV2Provider({ env: { LLM_API_URL: 'https://provider.example', LLM_API_KEY: 'key', STORY_MODEL: 'story-role', EXTRACT_MODEL: 'observation-role' }, fetchImpl: async (_url, options) => { requests.push(JSON.parse(options.body)); return new Response('data: {"choices":[{"delta":{"content":"[NARRATIVE] story"}}]}\n\ndata: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } }); }, content });
  const story = []; for await (const chunk of provider.story({ literalAction: 'story', context: { state: { state: {} }, turns: [] } })) story.push(chunk);
  assert.equal(requests[0].model, 'story-role'); assert.equal(story.join(''), '[NARRATIVE] story');
});

test('frontend-v2 arms immediate explicit retry for failed terminal and surfaces JSON errors', async () => {
  const frontend = await fs.readFile(path.join(root, 'frontend-v2/app.js'), 'utf8');
  assert.match(frontend, /data\.status === 'failed'/); assert.match(frontend, /pendingLiteralAction/); assert.match(frontend, /retryFailed = true/);
  assert.match(frontend, /payload\.error\?\.message \?\? payload\.error\?\.code/); assert.match(frontend, /finally \{\s*\$\('send'\)\.disabled = false; \}/);
  assert.match(frontend, /retry_failed: state\.retryFailed/); assert.doesNotMatch(frontend, /retry_failed:\s*true/);
});

test('Story first-content timeout aborts once and terminalizes the job failed', async () => {
  let calls = 0; let aborted = false;
  const fetchImpl = async (_url, options) => {
    calls += 1;
    options.signal.addEventListener('abort', () => { aborted = true; });
    return new Response(new ReadableStream({ start() {} }), { headers: { 'content-type': 'text/event-stream' } });
  };
  const provider = createV2Provider({
    env: { LLM_API_URL: 'https://provider.example', LLM_API_KEY: 'key', STORY_MODEL: 'story-role', EXTRACT_MODEL: 'observation-role' },
    fetchImpl, content, timeouts: { storyFirstContentMs: 10, storyTotalMs: 100, observationMs: 100 }
  });
  const worker = createV2Worker({ provider }); const { gameId } = await game(worker);
  const text = await (await turn(worker, gameId, 'first-content timeout')).text();
  assert.match(text, /"status":"failed"/); assert.equal(worker.store.getJob(gameId, 1).error_code, 'v2_story_first_content_timeout');
  assert.equal(calls, 1); assert.equal(aborted, true); assert.equal(worker.store.turns.size, 1);
});

test('Story total timeout aborts once without Observation or Commit', async () => {
  let calls = 0; let aborted = false;
  const fetchImpl = async (_url, options) => {
    calls += 1;
    options.signal.addEventListener('abort', () => { aborted = true; });
    return new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"[NARRATIVE] partial"}}]}\n\n')); } }), { headers: { 'content-type': 'text/event-stream' } });
  };
  const provider = createV2Provider({
    env: { LLM_API_URL: 'https://provider.example', LLM_API_KEY: 'key', STORY_MODEL: 'story-role', EXTRACT_MODEL: 'observation-role' },
    fetchImpl, content, timeouts: { storyFirstContentMs: 100, storyTotalMs: 15, observationMs: 100 }
  });
  const worker = createV2Worker({ provider }); const { gameId } = await game(worker);
  const text = await (await turn(worker, gameId, 'total timeout')).text();
  assert.match(text, /"status":"failed"/); assert.equal(worker.store.getJob(gameId, 1).error_code, 'v2_story_timeout');
  assert.equal(calls, 1); assert.equal(aborted, true); assert.equal(worker.store.turns.size, 1);
});

test('Observation timeout is fail-open and commits the valid Story', async () => {
  let calls = 0;
  const fetchImpl = async (_url, options) => {
    calls += 1;
    const request = JSON.parse(options.body);
    if (request.stream) {
      const story = '[NARRATIVE] story\n\n[DIALOGUE id="heroine1"]\nhello\n\n[CHOICE]\none\n[CHOICE]\ntwo\n[CHOICE]\nthree\n[CHOICE]\nfour\n[/CHOICE]';
      return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: story } }] })}\n\ndata: [DONE]\n\n`, { headers: { 'content-type': 'text/event-stream' } });
    }
    return new Response(new ReadableStream({ start() {} }), { headers: { 'content-type': 'application/json' } });
  };
  const provider = createV2Provider({
    env: { LLM_API_URL: 'https://provider.example', LLM_API_KEY: 'key', STORY_MODEL: 'story-role', EXTRACT_MODEL: 'observation-role' },
    fetchImpl, content, timeouts: { storyFirstContentMs: 100, storyTotalMs: 100, observationMs: 10 }
  });
  const worker = createV2Worker({ provider }); const { gameId } = await game(worker);
  const text = await (await turn(worker, gameId, 'observation timeout')).text();
  assert.match(text, /"status":"committed"/); assert.equal(worker.store.context(gameId).state.committed_turn, 1); assert.equal(calls, 2);
});

test('stale processing terminalization preserves history and supports explicit retry', async () => {
  let now = Date.parse('2026-08-19T00:00:00.000Z');
  const store = new InMemoryV2Store({ content, clock: () => now });
  const opening = store.createGame({ playerName: 'stale lease' }); const gameId = opening.game.game_id;
  store.createOpening(gameId, { storyText: 'opening', parsedBlocks: [], choices: ['1', '2', '3', '4'], summary: 'opening' });
  store.reserveTurn({ gameId, turnNumber: 1, actionId: crypto.randomUUID(), literalAction: 'abandoned' });
  const before = store.context(gameId); now += 180_001;
  const stale = store.context(gameId);
  assert.equal(stale.job.status, 'failed'); assert.equal(stale.job.error_code, 'stale_turn_timeout'); assert.equal(stale.state.committed_turn, before.state.committed_turn); assert.equal(stale.turns.length, before.turns.length);
  const retry = store.reserveTurn({ gameId, turnNumber: 1, actionId: crypto.randomUUID(), literalAction: 'explicit retry', retryFailed: true });
  assert.equal(retry.created, true); assert.equal(retry.retried, true); assert.equal(retry.job.attempt_no, 2); assert.equal(store.jobs.size, 1);
});

test('stale attempt wakeup cannot progress, fail, or commit a newer retry', async () => {
  let now = Date.parse('2026-08-19T00:00:00.000Z');
  const store = new InMemoryV2Store({ content, clock: () => now });
  const opening = store.createGame({ playerName: 'attempt fence' }); const gameId = opening.game.game_id;
  store.createOpening(gameId, { storyText: 'opening', parsedBlocks: [], choices: ['1', '2', '3', '4'], summary: 'opening' });
  const action1 = crypto.randomUUID(); const action2 = crypto.randomUUID();
  const first = store.reserveTurn({ gameId, turnNumber: 1, actionId: action1, literalAction: 'attempt one literal' });
  const attempt1 = Object.freeze({ gameId, turnNumber: 1, actionId: action1, attemptNo: first.job.attempt_no, literalAction: first.job.literal_action });
  now += 180_001; assert.equal(store.context(gameId).job.status, 'failed');
  const retry = store.reserveTurn({ gameId, turnNumber: 1, actionId: action2, literalAction: 'attempt two literal', retryFailed: true });
  const attempt2 = Object.freeze({ gameId, turnNumber: 1, actionId: action2, attemptNo: retry.job.attempt_no, literalAction: retry.job.literal_action });
  assert.equal(attempt2.attemptNo, 2); assert.notEqual(attempt1.actionId, attempt2.actionId);
  const beforeStale = store.context(gameId);
  assert.throws(() => store.updateProgress({ gameId, turnNumber: 1, attempt: attempt1, storyText: 'stale progress' }), (error) => error.code === 'v2_attempt_fence_conflict');
  assert.throws(() => store.failJob(gameId, 1, attempt1, 'stale failure'), (error) => error.code === 'v2_attempt_fence_conflict');
  assert.throws(() => store.commitTurn({ gameId, turnNumber: 1, attempt: attempt1, expectedRevision: 0, storyText: 'stale story', parsedBlocks: [], choices: ['1', '2', '3', '4'], summary: 'stale summary', mindMonitor: {}, stateAfter: beforeStale.state.state }), (error) => error.code === 'v2_attempt_fence_conflict');
  const afterStale = store.context(gameId);
  assert.equal(afterStale.state.revision, beforeStale.state.revision); assert.equal(afterStale.state.committed_turn, beforeStale.state.committed_turn);
  assert.equal(afterStale.turns.length, beforeStale.turns.length); assert.equal(afterStale.job.status, 'processing'); assert.equal(afterStale.job.story_text, '');
  const committed = store.commitTurn({ gameId, turnNumber: 1, attempt: attempt2, expectedRevision: 0, storyText: 'attempt two story', parsedBlocks: [{ type: 'narrative', text: 'attempt two story' }], choices: ['1', '2', '3', '4'], summary: 'attempt two summary', mindMonitor: {}, stateAfter: afterStale.state.state });
  const committedTurn = store.turns.get(`${gameId}:1`);
  assert.equal(committed.state.committed_turn, 1); assert.equal(committedTurn.literal_action, attempt2.literalAction); assert.equal(committedTurn.story_text, 'attempt two story');
  assert.equal(store.jobs.size, 1); assert.equal([...store.turns.values()].filter((turn) => turn.turn_number > 0).length, 1); assert.equal(store.getJob(gameId, 1).attempt_no, 2); assert.equal(store.getJob(gameId, 1).status, 'committed');
});

test('v2 SQL source uses one narrow stale lease RPC and conflict-safe initial reservation', async () => {
  const correction = await fs.readFile(path.join(root, 'supabase/migrations/20260819000300_company_v2_stuck_turn_closure.sql'), 'utf8');
  assert.match(correction, /company_v2_expire_stale_turn/); assert.match(correction, /updated_at\s*<=\s*now\(\)\s*-\s*interval\s+'180 seconds'/);
  assert.match(correction, /on conflict\s*\(game_id, turn_number\)\s*do nothing/i); assert.match(correction, /if not found then[\s\S]*?select \* into v_job[\s\S]*?for update/s);
});

test('v2 attempt-fencing migration removes unfenced writers and keeps fenced service RPCs', async () => {
  const migration = await fs.readFile(path.join(root, 'supabase/migrations/20260819000400_company_v2_attempt_fencing.sql'), 'utf8');
  assert.match(migration, /drop function if exists public\.company_v2_update_turn_progress\(uuid, integer, text\)/i);
  assert.match(migration, /drop function if exists public\.company_v2_fail_turn\(uuid, integer, text\)/i);
  assert.match(migration, /drop function if exists public\.company_v2_commit_turn\(uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb\)/i);
  assert.match(migration, /p_action_id uuid[\s\S]*p_attempt_no integer/); assert.match(migration, /v2_attempt_fence_conflict/);
  assert.match(migration, /grant execute on function public\.company_v2_commit_turn\(uuid, integer, uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb\) to service_role/);
  assert.doesNotMatch(migration, /create or replace function public\.company_v2_commit_turn\(\s*p_game_id uuid,\s*p_turn_number integer,\s*p_expected_revision integer/s);
  const store = await fs.readFile(path.join(root, 'runtime-v2/server/supabase-store.js'), 'utf8');
  assert.match(store, /p_action_id: attempt\.actionId/); assert.match(store, /p_attempt_no: attempt\.attemptNo/);
});

test('v2 ACL closure is additive, service-role-only, and compatible with SELECT-only store reads', async () => {
  const migrationPath = 'supabase/migrations/20260819000500_company_v2_acl_closure.sql';
  const migration = await fs.readFile(path.join(root, migrationPath), 'utf8');
  assert.equal(execFileSync('git', ['diff', '--name-only', '--',
    'supabase/migrations/20260819000200_company_v2_phase1_vertical_slice.sql',
    'supabase/migrations/20260819000300_company_v2_stuck_turn_closure.sql',
    'supabase/migrations/20260819000400_company_v2_attempt_fencing.sql'
  ], { cwd: root, encoding: 'utf8' }).trim(), '');
  for (const [file, hash] of Object.entries({
    'supabase/migrations/20260819000200_company_v2_phase1_vertical_slice.sql': 'dd34271328905d15280f27f17c226e3bd63b7109',
    'supabase/migrations/20260819000300_company_v2_stuck_turn_closure.sql': '6cf89379182ba36dfab3b74123b3c4837ad011df',
    'supabase/migrations/20260819000400_company_v2_attempt_fencing.sql': 'fbc31a363b5062abdb9a5b8e102b77da577b5eb7'
  })) assert.equal(execFileSync('git', ['hash-object', file], { cwd: root, encoding: 'utf8' }).trim(), hash, file);
  assert.doesNotMatch(migration, /create\s+(or replace\s+)?function|alter\s+function/i);
  assert.doesNotMatch(migration, /game_actions|game_save|game_turns|company_v1|apply_reserved_csa_transaction/i);

  const rpcContracts = [
    ['company_v2_create_game', 'text, jsonb'],
    ['company_v2_create_opening', 'uuid, text, jsonb, jsonb, text, jsonb'],
    ['company_v2_reserve_turn', 'uuid, integer, uuid, text, boolean'],
    ['company_v2_expire_stale_turn', 'uuid, integer'],
    ['company_v2_update_turn_progress', 'uuid, integer, uuid, integer, text'],
    ['company_v2_fail_turn', 'uuid, integer, uuid, integer, text'],
    ['company_v2_commit_turn', 'uuid, integer, uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb']
  ];
  for (const [name, signature] of rpcContracts) {
    const escaped = signature.replace(/[(),]/g, '\\$&');
    assert.match(migration, new RegExp(`revoke all on function public\\.${name}\\(${escaped}\\) from public, anon, authenticated, service_role;`, 'i'));
    assert.match(migration, new RegExp(`grant execute on function public\\.${name}\\(${escaped}\\) to service_role;`, 'i'));
  }
  assert.match(migration, /revoke all on table public\.company_v2_games, public\.company_v2_state, public\.company_v2_turn_jobs, public\.company_v2_turns from public, anon, authenticated, service_role;/i);
  assert.match(migration, /grant select on table public\.company_v2_games, public\.company_v2_state, public\.company_v2_turn_jobs, public\.company_v2_turns to service_role;/i);
  assert.doesNotMatch(migration, /grant\s+(?:insert|update|delete|truncate|all)\s+on\s+table[\s\S]*?service_role/i);

  const attemptFencing = await fs.readFile(path.join(root, 'supabase/migrations/20260819000400_company_v2_attempt_fencing.sql'), 'utf8');
  assert.match(attemptFencing, /drop function if exists public\.company_v2_(?:update_turn_progress|fail_turn|commit_turn)\(/i);
  const store = await fs.readFile(path.join(root, 'runtime-v2/server/supabase-store.js'), 'utf8');
  assert.doesNotMatch(store, /this\.db\.(?:insert|update|delete|upsert)\s*\(/i);
  for (const rpc of ['company_v2_create_game', 'company_v2_create_opening', 'company_v2_reserve_turn', 'company_v2_expire_stale_turn', 'company_v2_update_turn_progress', 'company_v2_fail_turn', 'company_v2_commit_turn']) assert.match(store, new RegExp(`rpc\\(['"]${rpc}['"]`));
});

test('reconstructed Worker/store reads the same durable-test-double progress and job', async () => {
  let release; let released = false;
  const provider = { async *story() { yield '[NARRATIVE]\nprogress'; await new Promise((resolve) => { release = () => { released = true; resolve(); }; }); yield '\n\n[DIALOGUE id="heroine1"]\nend\n\n[CHOICE]\n1\n[CHOICE]\n2\n[CHOICE]\n3\n[CHOICE]\n4\n[/CHOICE]'; }, async observe() { return { turn_summary: 'done' }; } };
  const persistence = createInMemoryPersistence(); const worker1 = createWorker({ content, store: new InMemoryV2Store({ content, persistence }), provider }); const { gameId } = await game(worker1); const first = await turn(worker1, gameId, 'durable progress');
  for (let i = 0; i < 20 && !release; i++) await new Promise((resolve) => setTimeout(resolve, 2));
  const worker2 = createWorker({ content, store: new InMemoryV2Store({ content, persistence }), provider }); const context = (await (await worker2.fetch(new Request(`https://v2.test/api/v2/context?game_id=${gameId}`))).json()).data;
  assert.equal(context.job.status, 'processing'); assert.match(context.job.story_text, /progress/); release(); released = true; await first.text(); assert.equal(worker2.store.context(gameId).state.committed_turn, 1);
});

test('explicit failed-turn retry reopens one canonical row and increments attempt', async () => {
  let calls = 0; const provider = { async *story() { calls += 1; if (calls === 1) throw new Error('first_story_failed'); yield '[NARRATIVE]\nretry works\n\n[DIALOGUE id="heroine1"]\nok\n\n[CHOICE]\n1\n[CHOICE]\n2\n[CHOICE]\n3\n[CHOICE]\n4\n[/CHOICE]'; }, async observe() { return { turn_summary: 'retry' }; } };
  const worker = createV2Worker({ provider }); const { gameId } = await game(worker); await (await turn(worker, gameId, 'first attempt')).text(); assert.equal(worker.store.getJob(gameId, 1).status, 'failed');
  const retry = await turn(worker, gameId, 'explicit second attempt', crypto.randomUUID(), { retryFailed: true }); const text = await retry.text(); const job = worker.store.getJob(gameId, 1);
  assert.match(text, /"status":"committed"/); assert.equal(job.attempt_no, 2); assert.equal(job.literal_action, 'explicit second attempt'); assert.equal(worker.store.turns.size, 2);
});

test('simultaneous explicit retries resolve to one processing attempt and reject replacement after commit', async () => {
  let calls = 0; const provider = { async *story() { calls += 1; if (calls === 1) throw new Error('fail once'); await new Promise((resolve) => setTimeout(resolve, 15)); yield '[NARRATIVE]\nretry\n\n[DIALOGUE id="heroine1"]\nok\n\n[CHOICE]\n1\n[CHOICE]\n2\n[CHOICE]\n3\n[CHOICE]\n4\n[/CHOICE]'; }, async observe() { return { turn_summary: 'retry' }; } };
  const worker = createV2Worker({ provider }); const { gameId } = await game(worker); await (await turn(worker, gameId, 'failed')).text();
  const first = await turn(worker, gameId, 'retry one', crypto.randomUUID(), { retryFailed: true }); const second = await turn(worker, gameId, 'retry two', crypto.randomUUID(), { retryFailed: true });
  const secondData = await second.json(); assert.equal(secondData.data.reconnect, true); assert.equal(secondData.data.job.status, 'processing'); await first.text();
  const job = worker.store.getJob(gameId, 1); assert.equal(job.attempt_no, 2); assert.equal(job.literal_action, 'retry one'); assert.equal(calls, 2);
  const committedReplacement = await turn(worker, gameId, 'cannot replace committed'); assert.equal((await committedReplacement.json()).data.reconnect, true); assert.equal(worker.store.getJob(gameId, 1).literal_action, 'retry one');
});

test('fixture opening is playable and stores exactly four literal choices', async () => {
  const worker = createV2Worker({ content });
  const { opening } = await game(worker);
  assert.equal(opening.state.committed_turn, 0);
  assert.equal(opening.turns[0].choices.length, 4);
  assert.ok(opening.turns[0].choices.every((choice) => choice.length > 0));
});

test('one client submission reaches one server-owned turn operation', async () => {
  const worker = createV2Worker({ content }); const { gameId } = await game(worker);
  const response = await turn(worker, gameId, '정확히 이 문장을 서버에 보낸다.');
  assert.match(response.headers.get('content-type'), /text\/event-stream/);
  const text = await response.text();
  assert.match(text, /event: story_delta/); assert.match(text, /"status":"committed"/);
  assert.equal(worker.store.jobs.size, 1);
  assert.equal(worker.store.turns.size, 2);
});

test('literal input reaches Story and committed history unchanged', async () => {
  const literal = '한국어 그대로: "회의실로 이동해 주세요."';
  let seen;
  const worker = createV2Worker({ content, provider: providerFor({ story: ({ literalAction }) => { seen = literalAction; return `[NARRATIVE]\n${literalAction}\n\n[DIALOGUE id="heroine1"]\n알겠습니다.\n\n[CHOICE]\n1\n[CHOICE]\n2\n[CHOICE]\n3\n[CHOICE]\n4\n[/CHOICE]`; } }) });
  const { gameId } = await game(worker); await (await turn(worker, gameId, literal)).text();
  assert.equal(seen, literal); assert.equal(worker.store.turns.get(`${gameId}:1`).literal_action, literal);
});

test('Story deltas are observable before terminal commit', async () => {
  const worker = createV2Worker({ content, provider: providerFor({ delay: 15 }) }); const { gameId } = await game(worker);
  const text = await (await turn(worker, gameId, '먼저 이야기를 스트리밍한다.')).text();
  assert.ok(text.indexOf('event: story_delta') < text.indexOf('event: terminal'));
});

test('concurrent same-turn requests reconnect to one processing job', async () => {
  const worker = createV2Worker({ content, provider: providerFor({ delay: 30 }) }); const { gameId } = await game(worker);
  const action = { game_id: gameId, action_id: crypto.randomUUID(), expected_turn: 1, literal_action: '동시에 한 번만 처리한다.' };
  const first = await worker.fetch(new Request('https://v2.test/api/v2/turn', { method: 'POST', body: JSON.stringify(action) }));
  const second = await worker.fetch(new Request('https://v2.test/api/v2/turn', { method: 'POST', body: JSON.stringify({ ...action, action_id: crypto.randomUUID() }) }));
  const secondData = (await second.json()).data;
  assert.equal(secondData.reconnect, true); assert.equal(secondData.job.status, 'processing'); assert.equal(worker.store.jobs.size, 1);
  await first.text(); assert.equal(worker.store.turns.size, 2);
});

test('reconnect observes the same in-flight job and committed readback', async () => {
  const worker = createV2Worker({ content, provider: providerFor({ delay: 20 }) }); const { gameId } = await game(worker);
  const first = await turn(worker, gameId, '재연결 가능한 작업.');
  const reconnect = await worker.fetch(new Request(`https://v2.test/api/v2/context?game_id=${gameId}`));
  assert.equal((await reconnect.json()).data.job.status, 'processing'); await first.text();
  const readback = await worker.fetch(new Request(`https://v2.test/api/v2/context?game_id=${gameId}`));
  assert.equal((await readback.json()).data.state.committed_turn, 1);
});

test('Story failure terminalizes without automatic retry', async () => {
  const provider = { async *story() { throw new Error('story_failed'); }, async observe() { throw new Error('must_not_observe'); } };
  const worker = createV2Worker({ content, provider }); const { gameId } = await game(worker); const response = await turn(worker, gameId, '실패를 한 번 기록한다.');
  const text = await response.text(); const job = worker.store.getJob(gameId, 1);
  assert.match(text, /"status":"failed"/); assert.equal(job.status, 'failed'); assert.equal(worker.store.turns.size, 1); assert.equal(job.attempt_no, 1);
});

test('optional observation failure still commits valid Story with safe state', async () => {
  const worker = createV2Worker({ content, provider: providerFor({ observe: async () => { throw new Error('observation_unavailable'); } }) }); const { gameId } = await game(worker);
  await (await turn(worker, gameId, '관찰 실패여도 이야기는 저장한다.')).text(); const context = worker.store.context(gameId);
  assert.equal(context.state.committed_turn, 1); assert.equal(context.turns[1].mind_monitor && Object.keys(context.turns[1].mind_monitor).length, 0); assert.ok(context.turns[1].turn_summary);
});

test('non-empty Story always gets provider or bounded fallback summary', async () => {
  const worker = createV2Worker({ content, provider: providerFor({ observe: async () => ({ turn_summary: '' }) }) }); const { gameId } = await game(worker);
  await (await turn(worker, gameId, '요약 fallback을 확인한다.')).text(); const committed = worker.store.turns.get(`${gameId}:1`);
  assert.ok(committed.story_text); assert.ok(committed.turn_summary); assert.ok(committed.turn_summary.length <= 500);
});

test('Mind Monitor targets relevant dialogue actors only and fails open', async () => {
  const worker = createV2Worker({ content, provider: providerFor() }); const { gameId } = await game(worker); await (await turn(worker, gameId, '관련 인물만 기록한다.')).text();
  assert.deepEqual(Object.keys(worker.store.turns.get(`${gameId}:1`).mind_monitor), ['heroine1']);
});

test('player identity cannot be interpreted as an NPC observation', async () => {
  const worker = createV2Worker({ content, provider: providerFor({ observe: async ({ storyText }) => ({ scene: { entered: [{ actor_id: 'player-1', quote: storyText }] }, turn_summary: 'identity' }) }) }); const { gameId } = await game(worker);
  await (await turn(worker, gameId, '플레이어는 NPC가 아니다.')).text(); assert.deepEqual(worker.store.context(gameId).state.state.scene.present_npc_ids, []);
});

test('malformed OOC and protocol garbage are absent from canonical display blocks', async () => {
  const badStory = '[NARRATIVE]\n정상 장면.\n[ooc]retry[/ooc]\nDIALOGUE speaker_id=heroine2\n\n[CHOICE]\n1\n[CHOICE]\n2\n[CHOICE]\n3\n[CHOICE]\n4\n[/CHOICE]';
  const worker = createV2Worker({ content, provider: providerFor({ story: () => badStory }) }); const { gameId } = await game(worker); await (await turn(worker, gameId, '프로토콜 쓰레기는 화면에 남지 않는다.')).text();
  const blocks = worker.store.turns.get(`${gameId}:1`).parsed_blocks; assert.equal(blocks.some((block) => /ooc|DIALOGUE\s+speaker_id/i.test(block.text)), false);
});

test('committed state remains minimal and excludes deferred phase fields', async () => {
  const worker = createV2Worker({ content }); const { gameId } = await game(worker); await (await turn(worker, gameId, '작은 상태만 저장한다.')).text();
  const state = worker.store.context(gameId).state.state; assert.deepEqual(Object.keys(state).sort(), ['player', 'scene', 'time']);
});

test('expected turn and literal action are validated without replacement actions', async () => {
  const worker = createV2Worker({ content }); const { gameId } = await game(worker);
  const before = await worker.fetch(new Request('https://v2.test/api/v2/turn', { method: 'POST', body: JSON.stringify({ game_id: gameId, action_id: crypto.randomUUID(), expected_turn: 2, literal_action: '아직 오지 않은 턴' }) }));
  assert.equal(before.status, 422);
  const valid = await turn(worker, gameId, '한 번만 제출한다.'); await valid.text();
  const duplicate = await turn(worker, gameId, '대체 행동은 만들지 않는다.');
  assert.equal((await duplicate.json()).data.reconnect, true);
});

test('refresh context returns committed history and the same game identity', async () => {
  const worker = createV2Worker({ content }); const { gameId } = await game(worker); await (await turn(worker, gameId, '새로고침 후에도 기록한다.')).text();
  const context = (await (await worker.fetch(new Request(`https://v2.test/api/v2/context?game_id=${gameId}`))).json()).data;
  assert.equal(context.game.game_id, gameId); assert.equal(context.turns.length, 2); assert.equal(context.turns[1].literal_action, '새로고침 후에도 기록한다.');
});
