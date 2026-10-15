import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { createReadStream, statSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCommand } from './domain/command.js';
import { loadCompanyContent, setupSceneForProfile } from './domain/content.js';
import { executeTurnJob } from './application/turn-pipeline.js';
import { createR4Store } from './adapters/postgres-store.js';
import { createConfiguredProvider, createScriptedProvider, providerAvailability } from './adapters/provider.js';
import { R4StoreError } from './adapters/store-errors.js';
import { validateCommittedDialogueRequest } from './domain/voice.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendRoot = resolve(root, 'frontend-r4');
const content = loadCompanyContent();
const modelAvailability = providerAvailability(process.env);
const requestedProvider = process.env.R4_PROVIDER ?? '';
const configuredBudget = Number.parseInt(process.env.R4_MODEL_CALL_BUDGET ?? '120', 10);
const liveCallBudget = Math.max(1, Math.min(120, Number.isInteger(configuredBudget) ? configuredBudget : 120));
const databasePath = resolve(root, process.env.R4_DB_PATH ?? 'var/r4-local-postgres');
const publicStorageBase = (process.env.R4_PUBLIC_STORAGE_URL ?? '').replace(/\/+$/, '');
const ttsApiUrl = String(process.env.R4_TTS_API_URL ?? '').trim();

if (/^https?:\/\//i.test(process.env.R4_DB_PATH ?? '')) throw new Error('r4_database_path_must_be_local');

await mkdir(dirname(databasePath), { recursive: true });
const store = await createR4Store({ dbPath: databasePath, liveCallBudget });
const modelCallHooks = {
  start: values => store.startModelCall(values),
  finish: (callId, values) => store.finishModelCall(callId, values)
};

let provider;
if (requestedProvider === 'scripted') {
  provider = createScriptedProvider();
} else if (modelAvailability.ready) {
  provider = createConfiguredProvider({ env: process.env, onModelCall: modelCallHooks });
} else {
  provider = {
    mode: 'company-unconfigured',
    modelNames: { story: process.env.STORY_MODEL ?? '', observer: process.env.EXTRACT_MODEL ?? '' },
    async story() { throw new Error('company_model_configuration_unavailable'); },
    async observe() { throw new Error('company_model_configuration_unavailable'); }
  };
}
console.log('R4 provider mode: ' + provider.mode);
console.log('R4 database directory: ' + databasePath);
console.log('R4 live Story + Observer budget: ' + liveCallBudget);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

function sendJson(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(body));
}

async function readBody(request, maxBytes = 1_048_576) {
  let body = '';
  for await (const chunk of request) {
    body += chunk.toString('utf8');
    if (body.length > maxBytes) throw new R4StoreError('request_body_too_large', 413);
  }
  if (!body) return {};
  try {
    const value = JSON.parse(body);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw new R4StoreError('request_json_invalid', 400);
  }
}

function sendEvent(response, event, disconnected) {
  if (disconnected() || response.destroyed || response.writableEnded) return;
  response.write('data: ' + JSON.stringify(event) + '\n\n');
}

function beginEventStream(request, response) {
  response.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no'
  });
  let closed = false;
  response.on('close', () => { closed = true; });
  request.on('aborted', () => { closed = true; });
  return event => sendEvent(response, event, () => closed);
}

async function streamJob(request, response, createJob) {
  const event = beginEventStream(request, response);
  try {
    const reserved = await createJob();
    const job = reserved.job;
    event({ type: 'accepted', job_id: job.jobId, command_id: job.commandId, duplicate: reserved.duplicate });
    if (reserved.duplicate && job.status === 'complete') {
      event({ type: 'committed', receipt: job.receipt, snapshot: await store.readSnapshot(job.gameId), duplicate: true });
      response.end();
      return;
    }
    if (reserved.duplicate && job.status === 'running') {
      event({ type: 'in_progress', job_id: job.jobId, stage: job.stage });
      response.end();
      return;
    }
    if (reserved.duplicate && job.status === 'failed') {
      event({ type: 'error', job_id: job.jobId, error: 'explicit_retry_required', retry_available: true });
      response.end();
      return;
    }
    await executeTurnJob({ job, store, provider, content, onEvent: event });
    response.end();
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    const code = String(error?.code ?? error?.message ?? 'request_failed').slice(0, 100);
    event({ type: 'error', error: code, retry_available: error?.details?.retry_available === true, job_id: error?.details?.job_id ?? null });
    if (!response.writableEnded) response.end();
    if (status >= 500) console.error('R4 request failed: ' + code);
  }
}

function profileOptions() {
  const departments = content.departments;
  const positions = content.positions.map(position => position.name);
  return { departments, positions };
}

function publicAssetUrl(assetLocator) {
  if (!publicStorageBase || typeof assetLocator !== 'string') return null;
  const match = assetLocator.match(/^storage:\/\/([^/]+)\/(.+)$/);
  if (!match) return null;
  const encodedPath = match[2].split('/').map(encodeURIComponent).join('/');
  return publicStorageBase + '/' + encodeURIComponent(match[1]) + '/' + encodedPath;
}

function validateProfile(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const age = Number(body.age);
  const { departments, positions } = profileOptions();
  if (!name || Array.from(name).length > 20 || /[\u0000-\u001f<>]/.test(name)) throw new R4StoreError('profile_name_invalid');
  if (!Number.isInteger(age) || age < 18 || age > 70) throw new R4StoreError('profile_age_invalid');
  if (!departments.includes(body.department)) throw new R4StoreError('profile_department_invalid');
  if (!positions.includes(body.position)) throw new R4StoreError('profile_position_invalid');
  return { name, age, department: body.department, position: body.position };
}

async function serveStatic(response, pathname) {
  const wanted = pathname === '/' || pathname === '/index.html' ? 'index.html' : decodeURIComponent(pathname.replace(/^\/+/, ''));
  const filePath = resolve(frontendRoot, wanted);
  if (!filePath.startsWith(frontendRoot + sep) && filePath !== resolve(frontendRoot, 'index.html')) {
    sendJson(response, 403, { error: 'static_path_invalid' });
    return;
  }
  let info;
  try { info = statSync(filePath); } catch { sendJson(response, 404, { error: 'static_file_not_found' }); return; }
  if (!info.isFile()) { sendJson(response, 404, { error: 'static_file_not_found' }); return; }
  response.writeHead(200, { 'content-type': mimeTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
  createReadStream(filePath).pipe(response);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const path = url.pathname;
    if (request.method === 'GET' && path === '/api/health') {
      sendJson(response, 200, {
        status: 'ok',
        provider: { mode: provider.mode, liveConfigured: modelAvailability.ready, models: modelAvailability.models },
        voice: { mappingsLoaded: content.actors.some(actor => actor.source_record?.voice_id), synthesisConfigured: Boolean(ttsApiUrl) },
        local_database: { engine: 'PostgreSQL WASM via PGlite', persistent_directory: 'var/r4-local-postgres' },
        usage: await store.readUsage()
      });
      return;
    }
    if (request.method === 'GET' && path === '/api/content') {
      const mediaCatalog = content.media_catalog.map(item => ({ ...item, asset_url: publicAssetUrl(item.asset_locator) }));
      sendJson(response, 200, {
        edition: content.edition,
        company: content.company,
        world_premise: content.world_premise,
        building_name: content.building_name,
        floors: content.floors,
        actors: content.actors.map(({ actor_id, kind, name, age, gender, department, position, role_title, company_tenure, default_location_id, prompt_card, profile_card, source_record }) => {
          const portrait = content.media_catalog.find(item => item.image_id === actor_id + '-main');
          return {
            actor_id, kind, name, age, gender, department, position, role_title, company_tenure,
            default_location_id, prompt_card, profile_card, voice_available: Boolean(source_record?.voice_id),
            portrait: portrait ? { ...portrait, asset_url: publicAssetUrl(portrait.asset_locator) } : null
          };
        }),
        locations: content.locations,
        media_catalog: mediaCatalog,
        media_available: Boolean(publicStorageBase),
        setup_options: profileOptions()
      });
      return;
    }
    if (request.method === 'POST' && path === '/api/games') {
      const gameId = await store.createGame(content);
      sendJson(response, 201, { game_id: gameId, snapshot: await store.readSnapshot(gameId) });
      return;
    }

    const gameMatch = path.match(/^\/api\/games\/([0-9a-f-]+)$/i);
    if (request.method === 'GET' && gameMatch) {
      sendJson(response, 200, await store.readSnapshot(gameMatch[1]));
      return;
    }
    const setupMatch = path.match(/^\/api\/games\/([0-9a-f-]+)\/setup$/i);
    if (request.method === 'POST' && setupMatch) {
      const body = await readBody(request);
      const profile = validateProfile(body);
      sendJson(response, 200, await store.saveSetup(setupMatch[1], profile, setupSceneForProfile(content, profile)));
      return;
    }
    const ttsMatch = path.match(/^\/api\/games\/([0-9a-f-]+)\/tts$/i);
    if (request.method === 'POST' && ttsMatch) {
      const gameId = ttsMatch[1];
      const body = await readBody(request, 12_000);
      const speakerId = String(body.speaker_id ?? '');
      const actor = content.actors.find(item => item.actor_id === speakerId && item.kind === 'heroine');
      const snapshot = await store.readSnapshot(gameId);
      const dialogue = validateCommittedDialogueRequest(body, {
        speakerId,
        committedLines: snapshot.latest_turn?.observer_applied?.dialogueLines,
        presentActorIds: snapshot.state?.scene?.present_actor_ids
      });
      if (!actor || !dialogue.valid) throw new R4StoreError('tts_dialogue_not_committed', 400);
      const voiceId = String(actor.source_record?.voice_id ?? '').trim();
      if (!voiceId) throw new R4StoreError('tts_voice_mapping_missing', 404);
      if (!ttsApiUrl) throw new R4StoreError('tts_service_unconfigured', 503);
      const headers = { 'content-type': 'application/json' };
      if (process.env.R4_TTS_API_KEY) headers.authorization = 'Bearer ' + process.env.R4_TTS_API_KEY;
      const upstream = await fetch(ttsApiUrl, {
        method: 'POST', headers,
        body: JSON.stringify({ voice_id: voiceId, text: dialogue.utterance, direction: dialogue.direction }),
        signal: AbortSignal.timeout(30_000)
      });
      if (!upstream.ok) throw new R4StoreError('tts_upstream_' + upstream.status, 502);
      const result = await upstream.json();
      const audioUrl = typeof result?.url === 'string' ? result.url : '';
      if (!/^https?:\/\//i.test(audioUrl) && !/^data:audio\//i.test(audioUrl)) throw new R4StoreError('tts_audio_url_invalid', 502);
      sendJson(response, 200, { url: audioUrl, speaker_id: speakerId, text: dialogue.utterance, direction: dialogue.direction });
      return;
    }
    const commandMatch = path.match(/^\/api\/games\/([0-9a-f-]+)\/commands$/i);
    if (request.method === 'POST' && commandMatch) {
      const body = await readBody(request);
      const gameId = commandMatch[1];
      if (body.kind === 'RULE_CHANGE') {
        // The canonical CSA catalog currently contains no non-explicit preset that can be used for this task's permitted live validation.
        throw new R4StoreError('r4_non_explicit_canonical_rule_unavailable', 503);
      }
      const command = createCommand({
        gameId,
        kind: body.kind,
        expectedStateRevision: body.expected_state_revision,
        literalAction: body.literal_action ?? '',
        ruleChange: body.rule_change ?? null,
        commandId: body.command_id ?? randomUUID()
      });
      await streamJob(request, response, () => store.beginCommand({ command }));
      return;
    }
    const currentJobMatch = path.match(/^\/api\/games\/([0-9a-f-]+)\/jobs\/current$/i);
    if (request.method === 'GET' && currentJobMatch) {
      const job = await store.getLatestJob(currentJobMatch[1]);
      if (!job) { sendJson(response, 200, { status: 'none' }); return; }
      sendJson(response, 200, {
        job_id: job.jobId,
        command_id: job.commandId,
        status: job.status,
        stage: job.stage,
        attempt_no: job.attemptNo,
        story_checkpoint: job.storyCheckpoint,
        error: job.status === 'failed' ? (job.error?.code ?? job.stage) : null,
        receipt: job.receipt
      });
      return;
    }
    const jobMatch = path.match(/^\/api\/games\/([0-9a-f-]+)\/jobs\/([0-9a-f-]+)$/i);
    if (request.method === 'GET' && jobMatch) {
      const job = await store.getJob(jobMatch[2], jobMatch[1]);
      if (!job) throw new R4StoreError('job_not_found', 404);
      sendJson(response, 200, {
        job_id: job.jobId,
        command_id: job.commandId,
        status: job.status,
        stage: job.stage,
        attempt_no: job.attemptNo,
        story_checkpoint: job.storyCheckpoint,
        error: job.status === 'failed' ? (job.error?.code ?? job.stage) : null,
        receipt: job.receipt,
        snapshot: job.status === 'complete' ? await store.readSnapshot(job.gameId) : null
      });
      return;
    }
    const retryMatch = path.match(/^\/api\/games\/([0-9a-f-]+)\/jobs\/([0-9a-f-]+)\/retry$/i);
    if (request.method === 'POST' && retryMatch) {
      await readBody(request);
      const [gameId, jobId] = [retryMatch[1], retryMatch[2]];
      await streamJob(request, response, () => store.retryJob(jobId, gameId));
      return;
    }
    const feedbackMatch = path.match(/^\/api\/games\/([0-9a-f-]+)\/feedback$/i);
    if (request.method === 'POST' && feedbackMatch) {
      const body = await readBody(request);
      const gameId = feedbackMatch[1];
      await streamJob(request, response, () => store.beginFeedback({
        gameId,
        requestId: body.feedback_id ?? randomUUID(),
        feedbackText: body.feedback_text,
        expectedStateRevision: body.expected_state_revision
      }));
      return;
    }
    const historyMatch = path.match(/^\/api\/games\/([0-9a-f-]+)\/history$/i);
    if (request.method === 'GET' && historyMatch) {
      const cursor = Number.parseInt(url.searchParams.get('before') ?? '2147483647', 10);
      const limit = Number.parseInt(url.searchParams.get('limit') ?? '20', 10);
      sendJson(response, 200, { turns: await store.readHistory(historyMatch[1], cursor, limit), next_before: Number.isFinite(cursor) ? cursor : null });
      return;
    }
    if (request.method === 'GET') {
      await serveStatic(response, path);
      return;
    }
    sendJson(response, 405, { error: 'method_not_allowed' });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    const code = String(error?.code ?? error?.message ?? 'request_failed').slice(0, 100);
    sendJson(response, status, { error: code, details: error?.details ?? {} });
  }
});

const port = Number.parseInt(process.env.PORT ?? '4174', 10);
server.listen(port, '127.0.0.1', () => console.log('R4 local game ready at http://127.0.0.1:' + port + '/?fresh=1'));
async function shutdown() {
  server.close();
  await store.close();
}
process.on('SIGINT', () => { void shutdown(); });
process.on('SIGTERM', () => { void shutdown(); });
