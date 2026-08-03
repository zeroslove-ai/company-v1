import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createApiWorker } from '../src/api/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gameId = '11111111-1111-4111-8111-111111111111';
const gameTitle = 'Company v1 development';
const mainSha = 'a6c6daa68ca81878632f093181d11f5d00af3674';
const fixedSupabaseUrl = 'https://fmcrspgxstsmxxsmkeee.supabase.co';
const required = ['SUPABASE_SERVICE_ROLE_KEY', 'LLM_API_URL', 'LLM_API_KEY', 'STORY_MODEL', 'EXTRACT_MODEL'];

export function expectedCommitRevision(baselineRevision) {
  return baselineRevision + 1;
}

export function expectedCleanupRevision(committedRevision) {
  return committedRevision + 1;
}

class E2eError extends Error {
  constructor(endpoint, status, code = 'live_e2e_failed') {
    super(`${endpoint} failed`);
    this.endpoint = endpoint;
    this.status = status;
    this.code = code;
  }
}

function readLocalEnvironment() {
  const values = { ...process.env };
  for (const name of ['.dev.vars', '.env.local', '.env']) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match || values[match[1]]) continue;
      const value = match[2].trim().replace(/^['"]|['"]$/g, '');
      if (value) values[match[1]] = value;
    }
  }
  return values;
}

function requiredEnvironment() {
  const values = readLocalEnvironment();
  const missing = required.filter(name => !values[name]);
  if (missing.length > 0) {
    process.stdout.write(`LIVE E2E BLOCKED: missing local secrets\nmissing:\n${missing.map(name => `- ${name}`).join('\n')}\n`);
    process.exit(3);
  }
  return {
    SUPABASE_URL: fixedSupabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: values.SUPABASE_SERVICE_ROLE_KEY,
    LLM_API_URL: values.LLM_API_URL,
    LLM_API_KEY: values.LLM_API_KEY,
    STORY_MODEL: values.STORY_MODEL,
    EXTRACT_MODEL: values.EXTRACT_MODEL
  };
}

function elapsed(startedAt) {
  return Date.now() - startedAt;
}

function saveFromContext(context) {
  return context.save?.data ?? context.save;
}

function contextSummary(context) {
  const save = saveFromContext(context);
  return {
    committed_turn: save?.turn_state?.committed_turn,
    save_schema_version: save?.save_schema_version,
    edition: save?.edition,
    save_revision: context.save?.save_revision,
    recent_turns: Array.isArray(context.recent_turns) ? context.recent_turns.length : 0
  };
}

async function parseJsonResponse(endpoint, response) {
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new E2eError(endpoint, response.status, 'invalid_json_response');
  }
  if (!response.ok || body?.ok !== true) {
    throw new E2eError(endpoint, response.status, body?.error?.code ?? 'request_failed');
  }
  return body.data;
}

function parseSse(text) {
  const events = [];
  for (const entry of text.split(/\r?\n\r?\n/)) {
    const lines = entry.split(/\r?\n/);
    const name = lines.find(line => line.startsWith('event:'))?.slice(6).trim();
    const data = lines.filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\n');
    if (!name || !data) continue;
    try {
      events.push({ name, data: JSON.parse(data) });
    } catch {
      throw new E2eError('/api/story', 502, 'invalid_worker_sse');
    }
  }
  return events;
}

async function callJson(worker, env, endpoint, body) {
  const startedAt = Date.now();
  const response = await worker.fetch(new Request(`https://local.company-v1${endpoint}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  }), env);
  return { data: await parseJsonResponse(endpoint, response), duration_ms: elapsed(startedAt) };
}

async function callStory(worker, env, body) {
  const startedAt = Date.now();
  const response = await worker.fetch(new Request('https://local.company-v1/api/story', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  }), env);
  if (!response.ok) throw new E2eError('/api/story', response.status, 'story_request_failed');
  const events = parseSse(await response.text());
  const meta = events.find(event => event.name === 'meta')?.data;
  const complete = events.find(event => event.name === 'complete')?.data;
  const failure = events.find(event => event.name === 'error')?.data;
  const text = events.filter(event => event.name === 'delta').map(event => event.data.text ?? '').join('');
  if (!meta || !complete || failure || !text.trim()) {
    throw new E2eError('/api/story', 502, failure?.code ?? 'story_incomplete');
  }
  return { meta, complete, text, duration_ms: elapsed(startedAt) };
}

async function resetDevelopmentGame(env) {
  const response = await fetch(`${fixedSupabaseUrl}/rest/v1/rpc/reset_company_game`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ p_game_id: gameId, p_expected_title: gameTitle })
  });
  if (!response.ok) throw new E2eError('reset_company_game', response.status, 'cleanup_failed');
}

async function actionWasRemoved(env, actionId) {
  const query = new URLSearchParams({ game_id: `eq.${gameId}`, action_id: `eq.${actionId}`, select: 'action_id' });
  const response = await fetch(`${fixedSupabaseUrl}/rest/v1/game_actions?${query}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }
  });
  if (!response.ok) throw new E2eError('action_cleanup_check', response.status, 'cleanup_check_failed');
  const rows = await response.json();
  return Array.isArray(rows) && rows.length === 0;
}

function writeReport(report) {
  const directory = path.join(root, 'test-results');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'phase-2-live-e2e.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

async function main() {
  const env = requiredEnvironment();
  const report = {
    started_at: new Date().toISOString(),
    main_sha: mainSha,
    branch: 'phase/2-live-e2e',
    game_id: gameId,
    action_id: null,
    models: { story: env.STORY_MODEL, extract: env.EXTRACT_MODEL },
    same_model_fallback: false,
    overall_status: 'running'
  };
  const worker = createApiWorker({ fetchImpl: fetch });
  let actionStarted = false;
  let e2eError = null;
  let expectedCleanupSaveRevision = null;

  try {
    const health = await worker.fetch(new Request('https://local.company-v1/health'), env);
    const healthBody = await health.json();
    report.health = { status: health.status, edition_id: healthBody.edition_id, phase: healthBody.phase };
    if (health.status !== 200 || healthBody.edition_id !== 'company-v1' || healthBody.phase !== 'phase-2-vertical-loop') {
      throw new E2eError('/health', health.status, 'unexpected_health_response');
    }

    const before = await callJson(worker, env, '/api/context', { game_id: gameId, recent_turns: 15 });
    const beforeSave = saveFromContext(before.data.context);
    report.context_before = contextSummary(before.data.context);
    const baselineCommittedTurn = beforeSave?.turn_state?.committed_turn;
    const baselineSaveRevision = before.data.context.save?.save_revision;
    if (baselineCommittedTurn !== 0 || beforeSave?.save_schema_version !== 1 || beforeSave?.edition !== 'company-v1') {
      throw new E2eError('/api/context', 409, 'development_game_not_at_clean_turn_0');
    }
    if (!Number.isInteger(baselineSaveRevision)) throw new E2eError('/api/context', 502, 'invalid_baseline_revision');
    const expectedCommittedRevision = expectedCommitRevision(baselineSaveRevision);
    expectedCleanupSaveRevision = expectedCleanupRevision(expectedCommittedRevision);
    report.revisions = { baseline: baselineSaveRevision, expected_after_commit: expectedCommittedRevision, expected_after_cleanup: expectedCleanupSaveRevision };

    const actionId = randomUUID();
    report.action_id = actionId;
    const expectedTurn = baselineCommittedTurn + 1;
    const storyRequest = {
      game_id: gameId,
      action_id: actionId,
      expected_turn: expectedTurn,
      player_action: '김하연에게 캠페인 수정안의 우선순위를 물어보고 함께 검토한다.'
    };
    actionStarted = true;
    const story = await callStory(worker, env, storyRequest);
    report.story = { duration_ms: story.duration_ms, text: story.text, warnings: story.complete.warnings ?? [] };

    const extract = await callJson(worker, env, '/api/extract', { game_id: gameId, action_id: actionId });
    const extractData = extract.data;
    if (extractData.replayed !== false || !extractData.extract?.state_delta || typeof extractData.extract.state_delta !== 'object') {
      throw new E2eError('/api/extract', 502, 'invalid_extract_result');
    }
    report.extract = {
      duration_ms: extract.duration_ms,
      outcome: extractData.extract.outcome,
      turn_summary: extractData.extract.turn_summary,
      warnings: extractData.warnings ?? [],
      choices_count: extractData.extract.choices?.length ?? 0,
      dialogue_lines_count: extractData.extract.dialogue_lines?.length ?? 0
    };

    const commit = await callJson(worker, env, '/api/commit', { game_id: gameId, action_id: actionId, expected_turn: expectedTurn });
    if (commit.data.commit?.success !== true || commit.data.commit?.replayed !== false || commit.data.next_save?.edition !== 'company-v1') {
      throw new E2eError('/api/commit', 502, 'invalid_commit_result');
    }
    if (commit.data.commit?.turn_number !== expectedTurn) throw new E2eError('/api/commit', 502, 'commit_turn_not_persisted');
    if (commit.data.commit?.save_revision !== expectedCommittedRevision) throw new E2eError('/api/commit', 502, 'commit_revision_mismatch');
    report.commit = { duration_ms: commit.duration_ms, result: commit.data.commit, warnings: commit.data.warnings ?? [] };

    const status = await callJson(worker, env, '/api/action-status', { game_id: gameId, action_id: actionId });
    if (status.data.status?.processing_status !== 'committed' || status.data.recoverable_step !== 'complete') {
      throw new E2eError('/api/action-status', 502, 'unexpected_action_status');
    }
    report.action_status = { processing_status: status.data.status.processing_status, recoverable_step: status.data.recoverable_step };

    const afterCommit = await callJson(worker, env, '/api/context', { game_id: gameId, recent_turns: 15 });
    report.context_after_commit = contextSummary(afterCommit.data.context);
    if (report.context_after_commit.committed_turn !== expectedTurn) throw new E2eError('/api/context', 502, 'commit_turn_not_persisted');
    if (report.context_after_commit.save_revision !== expectedCommittedRevision) throw new E2eError('/api/context', 502, 'commit_revision_mismatch');
    if (!afterCommit.data.context.recent_turns?.some(turn => turn.action_id === actionId)) throw new E2eError('/api/context', 502, 'commit_action_mismatch');

    const storyReplay = await callStory(worker, env, storyRequest);
    const extractReplay = await callJson(worker, env, '/api/extract', { game_id: gameId, action_id: actionId });
    const commitReplay = await callJson(worker, env, '/api/commit', { game_id: gameId, action_id: actionId, expected_turn: expectedTurn });
    if (storyReplay.meta.replayed !== true || storyReplay.complete.replayed !== true || extractReplay.data.replayed !== true || commitReplay.data.commit?.success !== true || commitReplay.data.commit?.replayed !== true) {
      throw new E2eError('replay', 502, 'replay_validation_failed');
    }
    report.replay = {
      story: { replayed: true },
      extract: { replayed: true, warnings: extractReplay.data.warnings ?? [] },
      commit: { replayed: true, result: commitReplay.data.commit }
    };
    report.overall_status = 'passed';
  } catch (error) {
    e2eError = error;
    report.overall_status = 'failed';
    report.failure = { endpoint: error.endpoint ?? 'unknown', status: error.status ?? null, code: error.code ?? 'unexpected_error' };
  } finally {
    if (actionStarted) {
      try {
        await resetDevelopmentGame(env);
        const context = await callJson(worker, env, '/api/context', { game_id: gameId, recent_turns: 15 });
        const removed = await actionWasRemoved(env, report.action_id);
        const cleanupContext = contextSummary(context.data.context);
        report.cleanup = {
          success: cleanupContext.committed_turn === 0
            && cleanupContext.save_schema_version === 1
            && cleanupContext.edition === 'company-v1'
            && cleanupContext.save_revision === expectedCleanupSaveRevision
            && cleanupContext.recent_turns === 0
            && removed,
          action_removed: removed
        };
        report.context_after_cleanup = cleanupContext;
      } catch (error) {
        report.cleanup = { success: false, error_code: error.code ?? 'cleanup_failed' };
      }
    }
    report.finished_at = new Date().toISOString();
    writeReport(report);
  }

  if (e2eError) throw e2eError;
  if (!report.cleanup?.success) throw new E2eError('cleanup', 500, 'cleanup_failed');
  process.stdout.write('LIVE E2E PASSED\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write(`LIVE E2E FAILED: ${error.endpoint ?? 'unknown'} ${error.status ?? ''} ${error.code ?? 'unexpected_error'}\n`);
    process.exit(1);
  });
}
