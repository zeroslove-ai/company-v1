import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiWorker } from '../src/api/index.js';
import { repairAndParseExtractJson } from '../src/engine/extract/json-repair.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gameId = '2d00d76e-85b1-4cf0-8dab-a04e8a044b84';
const supabaseUrl = 'https://fmcrspgxstsmxxsmkeee.supabase.co';

function readEnv() {
  const values = { ...process.env };
  for (const name of ['.dev.vars', '.env.local', '.env']) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match || values[match[1]]) continue;
      values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: values.SUPABASE_SERVICE_ROLE_KEY,
    LLM_API_URL: values.LLM_API_URL,
    LLM_API_KEY: values.LLM_API_KEY,
    STORY_MODEL: values.STORY_MODEL,
    EXTRACT_MODEL: values.EXTRACT_MODEL
  };
}

async function responseRecord(response) {
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw_text: text }; }
  return { status: response.status, ok: response.ok, body };
}

function parseSse(text) {
  const events = [];
  for (const block of text.split(/\r?\n\r?\n/)) {
    const name = block.match(/^event:\s*(.+)$/m)?.[1]?.trim();
    const data = block.match(/^data:\s*(.+)$/m)?.[1];
    if (!name || !data) continue;
    try { events.push({ name, data: JSON.parse(data) }); } catch { events.push({ name, data }); }
  }
  return events;
}

function latestExtractDiagnostic(llmCalls) {
  const call = [...llmCalls].reverse().find(item => item.request?.stream === false);
  if (!call) return null;
  let content = null;
  try { content = JSON.parse(call.raw_response)?.choices?.[0]?.message?.content ?? null; } catch { content = null; }
  if (typeof content !== 'string') return { raw_llm_response: call.raw_response, raw_content: content };
  let parsedBeforeRepair = null;
  try { parsedBeforeRepair = JSON.parse(content); } catch { /* repair result is recorded below */ }
  let parsedAfterRepair = null;
  let repairError = null;
  try { parsedAfterRepair = repairAndParseExtractJson(content); } catch (error) { repairError = { code: error?.code ?? null, message: error?.message ?? String(error) }; }
  return { raw_llm_response: call.raw_response, raw_content: content, parsed_before_repair: parsedBeforeRepair, parsed_after_repair: parsedAfterRepair, repair_error: repairError };
}

async function main() {
  const env = readEnv();
  const llmCalls = [];
  const realFetch = globalThis.fetch;
  const fetchImpl = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url;
    const response = await realFetch(input, init);
    if (typeof url === 'string' && url.startsWith(env.LLM_API_URL)) {
      let request = null;
      try { request = init?.body ? JSON.parse(init.body) : null; } catch { request = { raw_body: init?.body ?? null }; }
      const rawResponse = await response.clone().text();
      llmCalls.push({ request, raw_response: rawResponse });
    }
    return response;
  };
  const worker = createApiWorker({ fetchImpl });
  const report = { game_id: gameId, started_at: new Date().toISOString(), stages: [], llm_calls: llmCalls };
  const call = async (endpoint, body) => {
    const response = await worker.fetch(new Request(`https://local.company-v1${endpoint}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
    }), env);
    const record = await responseRecord(response);
    report.stages.push({ endpoint, request: body, response: record });
    return record;
  };
  const requireOk = (record, endpoint) => {
    if (record.ok) return record;
    const error = new Error(`${endpoint} failed: ${record.body?.error?.code ?? record.status}`);
    error.endpoint = endpoint;
    error.response = record;
    throw error;
  };
  const story = async body => {
    const response = await worker.fetch(new Request('https://local.company-v1/api/story', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
    }), env);
    const text = await response.text();
    const events = parseSse(text);
    const metaActionId = events.find(event => event.name === 'meta')?.data?.action_id ?? null;
    const record = { status: response.status, ok: response.ok, action_id: metaActionId, events, raw_sse: text };
    report.stages.push({ endpoint: '/api/story', request: body, response: record });
    return record;
  };
  let actionId = null;
  try {
    await call('/api/reset', { game_id: gameId });
    const setup = await call('/api/player-setup', { game_id: gameId, player: {
      name: '진단 플레이어', age: 30, height_cm: 175, weight_kg: 70, penis_length_cm: 15,
      department_id: 'audit', position_id: 'assistant_manager', body_type_id: 'balanced', speech_style_id: 'polite', background: ''
    } });
    const setupId = setup.body?.data?.setup_id;
    await call('/api/opening', { game_id: gameId, setup_id: setupId });

    actionId = crypto.randomUUID();
    const ordinary = await story({ game_id: gameId, action_id: actionId, expected_turn: 1, player_action: '주변을 둘러보고 현재 업무를 확인한다.' });
    actionId = ordinary.action_id || actionId;
    const storyText = ordinary.events.filter(event => event.name === 'delta').map(event => event.data?.text ?? '').join('');
    const parsed = ordinary.events.find(event => event.name === 'complete')?.data?.parsed_blocks ?? null;
    const extract = await call('/api/extract', { game_id: gameId, action_id: actionId });
    await call('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 1 });
    report.ordinary = { action_id: actionId, expected_turn: 1, player_action: '주변을 둘러보고 현재 업무를 확인한다.', raw_story: storyText, parsed_story: parsed, parser_warnings: ordinary.events.find(event => event.name === 'complete')?.data?.warnings ?? [], raw_extract: latestExtractDiagnostic(llmCalls), extract_error: extract.ok ? null : extract.body?.error ?? null };
    requireOk(extract, '/api/extract ordinary');

    actionId = crypto.randomUUID();
    const movement = await story({ game_id: gameId, action_id: actionId, expected_turn: 2, player_action: '브랜드전략팀 회의실로 이동한다.' });
    actionId = movement.action_id || actionId;
    const movementText = movement.events.filter(event => event.name === 'delta').map(event => event.data?.text ?? '').join('');
    const movementParsed = movement.events.find(event => event.name === 'complete')?.data?.parsed_blocks ?? null;
    const movementExtract = await call('/api/extract', { game_id: gameId, action_id: actionId });
    await call('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 2 });
    report.movement = { action_id: actionId, expected_turn: 2, player_action: '브랜드전략팀 회의실로 이동한다.', raw_story: movementText, parsed_story: movementParsed, parser_warnings: movement.events.find(event => event.name === 'complete')?.data?.warnings ?? [], raw_extract: latestExtractDiagnostic(llmCalls), extract_error: movementExtract.ok ? null : movementExtract.body?.error ?? null };
    requireOk(movementExtract, '/api/extract movement');

    const validation = await call('/api/app-validate', { game_id: gameId, structured_action: {
      version: 1, type: 'app_transaction', base_turn_count: 2, operations: [{
        client_id: 'diagnostic-relational-csa', domain: 'csa', operation: 'activate', source_type: 'preset', strength: 'weak',
        preset: { template_id: 'press_body_against_recipient', subject_scope: 'female_employee', counterparty_scope: 'company_employee' }
      }]
    } });
    const canonicalAction = validation.body?.data?.canonical_action ?? null;
    actionId = crypto.randomUUID();
    const relational = await story({ game_id: gameId, action_id: actionId, expected_turn: 3, player_action: '회사 직원에게 가까이 다가가 함께 업무를 시작한다.', structured_action: canonicalAction });
    actionId = relational.action_id || actionId;
    const relationalStory = relational.events.filter(event => event.name === 'delta').map(event => event.data?.text ?? '').join('');
    const relationalParsed = relational.events.find(event => event.name === 'complete')?.data?.parsed_blocks ?? null;
    const relationalExtract = await call('/api/extract', { game_id: gameId, action_id: actionId, structured_action: canonicalAction });
    report.relational = {
      action_id: actionId, expected_turn: 3, player_action: '회사 직원에게 가까이 다가가 함께 업무를 시작한다.',
      raw_story: relationalStory, parsed_story: relationalParsed,
      parser_warnings: relational.events.find(event => event.name === 'complete')?.data?.warnings ?? [],
      raw_extract: latestExtractDiagnostic(llmCalls),
      extract_response: relationalExtract,
      raw_extract_llm_calls: llmCalls.slice(-2)
    };
    requireOk(relationalExtract, '/api/extract relational');
  } catch (error) {
    report.harness_error = { name: error?.name, message: error?.message, action_id: actionId };
  } finally {
    const reset = await call('/api/reset', { game_id: gameId });
    report.final_reset = reset;
    report.finished_at = new Date().toISOString();
    fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
    fs.writeFileSync(path.join(root, 'test-results', 'live-csa-extract-diagnostic.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
}

main().catch(error => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
