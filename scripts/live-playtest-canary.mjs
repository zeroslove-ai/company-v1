#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { buildStoryWorldProjection } from '../src/engine/csa/story-projection.js';
import { parseFreshNarrativeV2 } from '../src/engine/fresh-narrative-parser.js';

export const TEST_GAME_ID = '2d00d76e-85b1-4cf0-8dab-a04e8a044b84';
export const PRODUCTION_GAME_ID = '11111111-1111-4111-8111-111111111111';
export const DEFAULT_API_BASE = 'https://game-proxy-company-v1.zeroslove.workers.dev';
let lastReport = null;

export function assertTestGameId(gameId) {
  if (gameId === PRODUCTION_GAME_ID) throw new Error('PRODUCTION_GAME_GUARD: production game ID is forbidden');
  if (gameId !== TEST_GAME_ID) throw new Error(`TEST_GAME_GUARD: unexpected game ID ${gameId}`);
  return true;
}

export function errorDetails(body, status = null) {
  const error = body?.error ?? body?.data?.error ?? null;
  return {
    status,
    code: error?.code ?? null,
    message: error?.message ?? null,
    retryable: error?.retryable ?? null,
    issues: Array.isArray(error?.issues) ? error.issues : null
  };
}

export function classifyParserResult(rawStory, master) {
  if (!String(rawStory ?? '').trim()) {
    return {
      status: 'unavailable',
      error: { code: 'RAW_STORY_UNAVAILABLE', message: 'No persisted parsed_blocks.raw was emitted by the terminal response' },
      block_sequence: [], scene_count: 0, dialogue_count: 0, thought_count: 0, choice_count: 0,
      warnings: []
    };
  }
  try {
    const parsed = parseFreshNarrativeV2(rawStory, { master });
    return {
      status: 'success',
      error: null,
      block_sequence: parsed.blocks.map(block => block.type),
      scene_count: parsed.blocks.filter(block => block.type === 'scene').length,
      dialogue_count: parsed.dialogue_lines.length,
      thought_count: parsed.blocks.filter(block => block.type === 'player_inner_thought').length,
      choice_count: parsed.choices.length,
      warnings: parsed.warnings,
      parsed
    };
  } catch (error) {
    return {
      status: 'failure',
      error: { code: error?.code ?? 'STORY_PROTOCOL_INVALID', message: error?.message ?? String(error) },
      block_sequence: [], scene_count: 0, dialogue_count: 0, thought_count: 0, choice_count: 0,
      warnings: []
    };
  }
}

export function choiceContract(parsed, committedSave = null) {
  const rawChoices = Array.isArray(parsed?.choices) ? parsed.choices : [];
  const canonical = Array.isArray(parsed?.canonical_choices) ? parsed.canonical_choices : [];
  const committed = Array.isArray(committedSave?.last_choices) ? committedSave.last_choices : [];
  return {
    raw_count: rawChoices.length,
    raw_non_empty: rawChoices.every(choice => typeof choice === 'string' && choice.trim()),
    raw_duplicate: new Set(rawChoices.map(choice => String(choice).trim())).size !== rawChoices.length,
    canonical_count: canonical.length,
    canonical_exact_four: canonical.length === 4,
    committed_count: committed.length,
    committed_exact_four: committed.length === 4,
    invariant_ok: canonical.length === 4 && committed.length === 4
  };
}

export function projectionSnapshot(projection) {
  return {
    world_rules: projection?.world_rules ?? [],
    scene_obligations: projection?.scene_obligations ?? []
  };
}

function now() { return new Date().toISOString(); }
function elapsed(start) { return Date.now() - start; }
function clone(value) { return value == null ? value : structuredClone(value); }
function saveData(context) { return context?.save?.data ?? context?.save ?? {}; }
function presentNpcIds(save) {
  return Array.isArray(save?.scene?.present_npc_ids) ? save.scene.present_npc_ids.slice() : [];
}
function profileName(master, id) {
  const all = [...(master?.characters ?? []), ...(master?.general_npcs ?? [])];
  const profile = all.find(item => (item?.character_id ?? item?.npc_id ?? item?.id) === id);
  return profile?.name ?? profile?.display_name ?? id;
}
function parseSseEntry(entry, atMs) {
  const lines = entry.split(/\r?\n/);
  const eventLine = lines.find(line => line.startsWith('event:'));
  const data = lines.filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\n');
  if (!eventLine || !data) return null;
  try {
    return { name: eventLine.slice(6).trim(), data: JSON.parse(data), at_ms: atMs };
  } catch {
    return { name: 'invalid_sse_data', data: { raw: data }, at_ms: atMs };
  }
}

function parseSseEvents(text, startedAt) {
  return String(text ?? '').split(/\r?\n\r?\n/)
    .map(entry => parseSseEntry(entry, elapsed(startedAt)))
    .filter(Boolean);
}

async function requestJson(base, endpoint, body) {
  const startedAt = Date.now();
  let response;
  let text = '';
  try {
    response = await fetch(`${base}${endpoint}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
    });
    text = await response.text();
  } catch (error) {
    return { ok: false, endpoint, status: null, duration_ms: elapsed(startedAt), body: null, error: { code: 'NETWORK_ERROR', message: error?.message ?? String(error) } };
  }
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = null; }
  return { ok: response.ok && parsed?.ok === true, endpoint, status: response.status, duration_ms: elapsed(startedAt), body: parsed, raw_body: text };
}

async function actionStatus(base, gameId, actionId) {
  const result = await requestJson(base, '/api/action-status', { game_id: gameId, action_id: actionId });
  return result.ok ? result.body?.data?.status ?? null : { error: errorDetails(result.body, result.status) };
}

async function captureStory(base, gameId, body, { poll = true, endpoint = '/api/story' } = {}) {
  const startedAt = Date.now();
  const localActionId = body.action_id ?? null;
  const evidence = {
    request_started_at: now(), local_action_id: localActionId, expected_turn: body.expected_turn ?? null,
    request_duration_ms: null, http_status: null, sse_meta_action_id: null, first_delta_ms: null,
    terminal_ms: null, terminal_event: null, sse_error_code: null, sse_error_message: null,
    status_at_30s: null, status_at_120s: null, status_at_130s: null, transport_timeout: false,
    raw_story: '', visible_story: '', raw_story_available: false, events: [], response_error: null
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => { evidence.transport_timeout = true; controller.abort(); }, 130_000);
  const pollers = [];
  if (poll && localActionId) {
    for (const [ms, key] of [[30_000, 'status_at_30s'], [120_000, 'status_at_120s'], [130_000, 'status_at_130s']]) {
      pollers.push(setTimeout(async () => { evidence[key] = await actionStatus(base, gameId, localActionId); }, ms));
    }
  }
  try {
    let response;
    try {
      response = await fetch(`${base}${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    } catch (error) {
      evidence.response_error = { code: evidence.transport_timeout ? 'STORY_TRANSPORT_TIMEOUT' : 'NETWORK_ERROR', message: error?.message ?? String(error) };
      return evidence;
    }
    evidence.http_status = response.status;
    evidence.request_duration_ms = elapsed(startedAt);
    const reader = response.body?.getReader?.();
    if (reader) {
      const decoder = new TextDecoder();
      let buffer = '';
      const consume = (final = false) => {
        const entries = buffer.split(/\r?\n\r?\n/);
        buffer = final ? '' : (entries.pop() ?? '');
        for (const entry of entries) {
          const event = parseSseEntry(entry, elapsed(startedAt));
          if (event) evidence.events.push(event);
        }
      };
      while (true) {
        const chunk = await reader.read();
        buffer += decoder.decode(chunk.value ?? new Uint8Array(), { stream: !chunk.done });
        consume(chunk.done);
        if (chunk.done) break;
      }
    } else {
      evidence.events = parseSseEvents(await response.text(), startedAt);
    }
    evidence.request_duration_ms = elapsed(startedAt);
    const meta = evidence.events.find(event => event.name === 'meta')?.data;
    const complete = evidence.events.find(event => event.name === 'complete')?.data;
    const error = evidence.events.find(event => event.name === 'error')?.data;
    const firstDelta = evidence.events.find(event => event.name === 'delta');
    const terminal = evidence.events.find(event => event.name === 'complete' || event.name === 'error');
    evidence.sse_meta_action_id = meta?.action_id ?? null;
    evidence.first_delta_ms = firstDelta?.at_ms ?? null;
    evidence.terminal_ms = terminal?.at_ms ?? null;
    evidence.terminal_event = terminal?.name ?? null;
    evidence.sse_error_code = error?.code ?? null;
    evidence.sse_error_message = error?.message ?? null;
    evidence.raw_story = complete?.parsed_blocks?.raw ?? '';
    evidence.visible_story = evidence.events.filter(event => event.name === 'delta').map(event => event.data?.text ?? '').join('');
    evidence.raw_story_available = Boolean(evidence.raw_story);
    evidence.complete = complete ?? null;
    evidence.ok = response.ok && evidence.terminal_event === 'complete' && !error;
    return evidence;
  } finally {
    clearTimeout(timeout);
    for (const timer of pollers) clearTimeout(timer);
    if (evidence.request_duration_ms === null) evidence.request_duration_ms = elapsed(startedAt);
  }
}

function summarizeExtract(result, saveBefore, master) {
  if (!result.ok) return { status: 'failure', http_status: result.status, error: errorDetails(result.body, result.status) };
  const extract = result.body?.data?.extract ?? null;
  const present = presentNpcIds(saveBefore);
  const monitor = extract?.mind_monitor ?? {};
  return {
    status: 'success', http_status: result.status, extract_version: extract?.extract_version ?? null,
    outcome: extract?.outcome ?? null, npc_observation_ids: Object.keys(extract?.npc_observations ?? {}),
    mind_monitor_ids: Object.keys(monitor),
    mind_monitor_complete: present.filter(id => id !== 'player').every(id => {
      const value = monitor[id]; return typeof value?.surface === 'string' && value.surface.trim() && typeof value?.subconscious === 'string' && value.subconscious.trim();
    }),
    image_character_id: extract?.image_character_id ?? null, image_selection: extract?.image_selection ?? null,
    csa_trigger_evaluations: extract?.csa_trigger_evaluations ?? [], csa_runtime_updates: extract?.csa_runtime_updates ?? [],
    evidence: extract?.evidence ?? {}, warnings: extract?.warnings ?? [], extract
  };
}

function csaPhysicalVerdict(projection, rawStory, extract, nextSave, master) {
  const obligations = projection?.scene_obligations ?? [];
  if (!obligations.length) return { status: 'NOT_REQUIRED', obligations: [] };
  const details = obligations.map(obligation => {
    const npc = extract?.npc_observations?.[obligation.actor_id] ?? {};
    const clothing = npc?.physical?.clothing ?? {};
    const saved = nextSave?.npc_scene_state?.[obligation.actor_id]?.clothing ?? {};
    const name = profileName(master, obligation.actor_id);
    const evidence = obligation.changes.map(change => ({
      slot: change.slot, required: change.required, extracted: clothing[change.slot] ?? null, saved: saved[change.slot] ?? null
    }));
    return { actor_id: obligation.actor_id, actor_name: name, evidence, raw_name_present: rawStory.includes(name) };
  });
  const pass = details.every(detail => detail.raw_name_present && detail.evidence.every(item => item.extracted === item.required && item.saved === item.required));
  return { status: pass ? 'PASS' : 'FAIL', obligations: details };
}

async function run() {
  const args = new Set(process.argv.slice(2));
  const gameId = process.env.COMPANY_TEST_GAME_ID ?? TEST_GAME_ID;
  const base = (process.env.COMPANY_API_BASE_URL ?? DEFAULT_API_BASE).replace(/\/$/, '');
  assertTestGameId(gameId);
  const report = { phase: '12F', game_id: gameId, api_base: base, started_at: now(), turns: [], production_access: false, provider_calls: 'worker-bound only' };
  lastReport = report;
  let contextResult = await requestJson(base, '/api/context', { game_id: gameId, recent_turns: 5 });
  if (!contextResult.ok) throw new Error(`context failed: ${JSON.stringify(errorDetails(contextResult.body, contextResult.status))}`);
  let context = contextResult.body.data.context;
  let save = saveData(context);
  const clean = save?.turn_state?.committed_turn === 0 && save?.turn_state?.processing_status === 'idle'
    && save?.player_setup?.status === 'not_started' && save?.opening_state?.status === 'not_started'
    && Array.isArray(save?.csa_active) && save.csa_active.length === 0;
  if (!clean) {
    if (!args.has('--reset-if-dirty')) throw new Error(`test game is not clean; rerun with --reset-if-dirty: ${JSON.stringify({ committed_turn: save?.turn_state?.committed_turn, processing_status: save?.turn_state?.processing_status, player_setup: save?.player_setup?.status, opening: save?.opening_state?.status, csa_active: save?.csa_active })}`);
    const reset = await requestJson(base, '/api/reset', { game_id: gameId });
    if (!reset.ok) throw new Error(`reset failed: ${JSON.stringify(errorDetails(reset.body, reset.status))}`);
    contextResult = await requestJson(base, '/api/context', { game_id: gameId, recent_turns: 5 });
    context = contextResult.body.data.context; save = saveData(context);
  }

  const setupBody = {
    game_id: gameId,
    player: { name: '테스트 플레이어', department_id: 'brand_strategy', position_id: 'intern', age: 30, height_cm: 170, weight_kg: 65, penis_length_cm: 13, body_type_id: 'balanced', speech_style_id: 'polite' }
  };
  const setup = await requestJson(base, '/api/player-setup', setupBody);
  if (!setup.ok) throw new Error(`player setup failed: ${JSON.stringify(errorDetails(setup.body, setup.status))}`);
  const setupId = setup.body.data.setup_id;
  const opening = await captureStory(base, gameId, { game_id: gameId, setup_id: setupId }, { poll: false, endpoint: '/api/opening' });
  const openingParser = classifyParserResult(opening.raw_story, context.master);
  report.opening = { ...opening, parser: { ...openingParser, parsed: undefined }, choices: choiceContract(openingParser.parsed) };
  if (!opening.ok || openingParser.status === 'failure') throw new Error('opening hard failure; see report');

  async function refreshContext() {
    const value = await requestJson(base, '/api/context', { game_id: gameId, recent_turns: 5 });
    if (!value.ok) throw new Error(`context failed: ${JSON.stringify(errorDetails(value.body, value.status))}`);
    context = value.body.data.context; save = saveData(context); return context;
  }
  async function runTurn(turn, playerAction, structuredAction = null, projection = null) {
    const actionId = randomUUID();
    const story = await captureStory(base, gameId, { game_id: gameId, action_id: actionId, expected_turn: turn, player_action: playerAction, ...(structuredAction ? { structured_action: structuredAction } : {}) });
    const parser = classifyParserResult(story.raw_story, context.master);
    const turnReport = { turn, stage: 'story', action_id: actionId, story: { ...story, events: undefined }, parser: { ...parser, parsed: undefined }, parser_block_sequence: parser.block_sequence, parser_warnings: parser.warnings, choice: choiceContract(parser.parsed) };
    const parserHardFailure = parser.status === 'failure';
    if (!story.ok) { turnReport.hard_failure = 'STORY_TRANSPORT_OR_PROTOCOL'; report.turns.push(turnReport); throw new Error(`turn ${turn} Story failure`); }
    const extractResult = await requestJson(base, '/api/extract', { game_id: gameId, action_id: actionId, ...(structuredAction ? { structured_action: structuredAction } : {}) });
    const extracted = summarizeExtract(extractResult, save, context.master);
    turnReport.extract = { ...extracted, extract: undefined };
    if (parserHardFailure || extracted.status !== 'success') {
      turnReport.hard_failure = parserHardFailure ? 'FRESH_PARSER' : 'EXTRACT';
      report.turns.push(turnReport); throw new Error(`turn ${turn} stopped after ${turnReport.hard_failure}`);
    }
    const commit = await requestJson(base, '/api/commit', { game_id: gameId, action_id: actionId, expected_turn: turn });
    turnReport.commit = commit.ok ? { status: 'success', http_status: commit.status, commit: commit.body.data.commit } : { status: 'failure', http_status: commit.status, error: errorDetails(commit.body, commit.status) };
    if (!commit.ok) { turnReport.hard_failure = 'COMMIT'; report.turns.push(turnReport); throw new Error(`turn ${turn} Commit failure`); }
    await refreshContext();
    const nextSave = save;
    turnReport.choice.committed_count = Array.isArray(nextSave.last_choices) ? nextSave.last_choices.length : 0;
    turnReport.choice.committed_exact_four = turnReport.choice.committed_count === 4;
    turnReport.present_npc_ids = presentNpcIds(nextSave);
    turnReport.mind_monitor = extracted.mind_monitor_complete;
    turnReport.image = { character_id: extracted.image_character_id, present_target: extracted.image_character_id ? turnReport.present_npc_ids.includes(extracted.image_character_id) : false };
    if (projection) {
      const raw = story.raw_story;
      turnReport.csa = { projection: projectionSnapshot(projection), institutional_enactment: !raw.match(/상식개변|앱|버튼|스마트폰/), physical: csaPhysicalVerdict(projection, raw, extracted.extract, nextSave, context.master) };
    }
    report.turns.push(turnReport);
    return { actionId, story, parser, extracted, nextSave };
  }

  await runTurn(1, '김제나에게 인사하고 오늘 업무와 팀 분위기를 물어본다.');
  const validation = await requestJson(base, '/api/app-validate', { game_id: gameId, structured_action: { type: 'app_transaction', base_turn_count: 1, operations: [{ client_id: `canary-${randomUUID()}`, domain: 'csa', operation: 'activate', source_type: 'preset', strength: 'weak', preset: { template_id: 'no_bra_under_work_clothes' } }] } });
  if (!validation.ok) throw new Error(`app-validate failed: ${JSON.stringify(errorDetails(validation.body, validation.status))}`);
  const canonicalAction = validation.body.data.canonical_action;
  const csaSave = clone(save);
  csaSave.csa_active = clone(canonicalAction.transaction_resolution.next_csa_active);
  csaSave.csa_rules = clone(canonicalAction.transaction_resolution.next_csa_rules);
  const sceneActors = presentNpcIds(save);
  const projection = buildStoryWorldProjection({ save: csaSave, master: context.master, sceneActorIds: sceneActors, expectedTurn: 2 });
  await runTurn(2, validation.body.data.display_input ?? '회사 규정 변경사항이 실제 업무에 어떻게 드러나는지 확인하며 업무를 이어간다.', canonicalAction, projection);
  await runTurn(3, '오늘 업무를 계속하며 회사 공지와 팀 분위기를 살펴본다.');
  await runTurn(4, '현재 업무를 정리하고 동료와 협업을 이어간다.');
  await runTurn(5, '남은 업무를 확인하고 다음 작업을 준비한다.');
  report.status = 'PASS';
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().then(async report => {
    const output = JSON.stringify(report, null, 2);
    const reportPath = process.env.CANARY_REPORT_PATH;
    if (reportPath) await writeFile(reportPath, `${output}\n`, 'utf8');
    process.stdout.write(`${output}\n`);
  }).catch(async error => {
    const stopped = { ...(lastReport ?? {}), status: 'STOPPED', error: { message: error?.message ?? String(error) } };
    const output = JSON.stringify(stopped, null, 2);
    if (process.env.CANARY_REPORT_PATH) await writeFile(process.env.CANARY_REPORT_PATH, `${output}\n`, 'utf8');
    process.stderr.write(`${output}\n`);
    process.exitCode = 1;
  });
}
