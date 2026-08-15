#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { buildStoryWorldProjection } from '../src/engine/csa/story-projection.js';
import { parseFreshNarrativeV2 } from '../src/engine/fresh-narrative-parser.js';
import edition from '../src/api/edition.js';

export const TEST_GAME_ID = '2d00d76e-85b1-4cf0-8dab-a04e8a044b84';
export const PRODUCTION_GAME_ID = '11111111-1111-4111-8111-111111111111';
export const DEFAULT_API_BASE = 'https://game-proxy-company-v1.zeroslove.workers.dev';
export const PLAYABILITY_MAX_TURNS = 3;
export const CUT1_AUTHORITY_MODE = 'cut1-authority';
export const CUT3_RELATION_EVENT_MODE = 'cut3-relation-event';
let lastReport = null;

/**
 * The Worker receives an edition-backed master, while /api/context is a save
 * read and is not a master authority.  Keep the canary on the same catalog
 * shape as the Worker rather than treating context.master as authoritative.
 */
export function buildCompanyEditionMaster(source = edition) {
  const toEntries = (value, idField) => {
    if (Array.isArray(value)) return value.map(item => ({ ...item }));
    if (!value || typeof value !== 'object') return [];
    return Object.entries(value).map(([id, item]) => ({
      [idField]: id,
      ...(item && typeof item === 'object' ? item : {})
    }));
  };
  return {
    characters: toEntries(source?.characters?.characters, 'character_id'),
    general_npcs: toEntries(source?.generalNpcs?.profiles, 'npc_id')
  };
}

function profileForMaster(master, id) {
  const entries = [...(master?.characters ?? []), ...(master?.general_npcs ?? [])];
  const profile = entries.find(item => (item?.character_id ?? item?.npc_id ?? item?.id) === id) ?? null;
  return profile ? {
    id,
    found: true,
    gender: profile.gender ?? null,
    sex: profile.sex ?? null,
    name: profile.name ?? profile.display_name ?? null
  } : { id, found: false, gender: null, sex: null, name: null };
}

/** Read-only parity evidence; this never mutates the save or server state. */
export function buildCanaryProjectionParity({ save, sceneActorIds = [], contextMaster = null, expectedTurn = null } = {}) {
  const localMaster = buildCompanyEditionMaster();
  const contextProjection = buildStoryWorldProjection({
    save, master: contextMaster ?? {}, sceneActorIds, expectedTurn
  });
  const localProjection = buildStoryWorldProjection({
    save, master: localMaster, sceneActorIds, expectedTurn
  });
  const known = sceneActorIds.map(id => profileForMaster(localMaster, id));
  const contextMasterPresent = Boolean(
    contextMaster && (Array.isArray(contextMaster.characters) || Array.isArray(contextMaster.general_npcs))
  );
  return {
    source: 'local_company_edition_catalog',
    context_master_required: false,
    context_master_present: contextMasterPresent,
    local_master_shape: {
      characters: localMaster.characters.length,
      general_npcs: localMaster.general_npcs.length
    },
    actor_profiles: known,
    context_projection: projectionSnapshot(contextProjection),
    local_projection: projectionSnapshot(localProjection),
    status: contextMasterPresent ? 'CONTEXT_MASTER_PRESENT' : 'CONTEXT_MASTER_NOT_REQUIRED'
  };
}

export function canaryMode(args = []) {
  const values = args instanceof Set ? args : new Set(args);
  if (values.has(`--${CUT3_RELATION_EVENT_MODE}`)) return CUT3_RELATION_EVENT_MODE;
  if (values.has(`--${CUT1_AUTHORITY_MODE}`)) return CUT1_AUTHORITY_MODE;
  if (values.has('--phase12k-playability')) return 'phase12k-playability';
  return 'opening-only';
}

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

export function openingFailureClassification(opening, parser) {
  if (opening?.terminal_event === 'error') {
    const code = opening.sse_error_code ?? '';
    if (/story_protocol_invalid/i.test(code)) return 'STORY_PROTOCOL_INVALID';
    if (/supabase|rpc|database/i.test(code)) return 'SUPABASE_RPC_ERROR';
    if (/provider|upstream|llm|model/i.test(code)) return 'PROVIDER_UPSTREAM_ERROR';
    return 'UNKNOWN_OPENING_ERROR';
  }
  if (opening?.http_status !== 200 || opening?.http_status < 200 || opening?.http_status >= 300) return 'PROVIDER_UPSTREAM_ERROR';
  if (parser?.status === 'failure') return 'STORY_PROTOCOL_INVALID';
  if (!opening?.ok || opening?.terminal_event !== 'complete') return 'OPENING_PIPELINE_ERROR';
  return null;
}

export function openingFollowUpAllowed(opening, parser) {
  return openingFailureClassification(opening, parser) === null;
}

export async function writeVerifiedArtifact(path, artifact) {
  await writeFile(path, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  const persisted = JSON.parse(await readFile(path, 'utf8'));
  if (JSON.stringify(persisted) !== JSON.stringify(artifact)) throw new Error('CANARY_ARTIFACT_VERIFY_FAILED');
  return path;
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
    const parsed = parseFreshNarrativeV2(rawStory, { master: master?.data ?? master });
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
    world_rules: projection?.world_rules ?? []
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

function contextSnapshot(result) {
  const context = result?.body?.data?.context ?? null;
  const save = saveData(context);
  const turns = Array.isArray(context?.recent_turns) ? context.recent_turns : [];
  return {
    ok: result?.ok === true,
    http_status: result?.status ?? null,
    committed_turn: context?.save?.committed_turn ?? save?.turn_state?.committed_turn ?? null,
    save_revision: context?.save?.save_revision ?? context?.save_revision ?? null,
    processing_status: save?.turn_state?.processing_status ?? null,
    player_setup: save?.player_setup?.status ?? null,
    opening_state: save?.opening_state?.status ?? null,
    csa_active_count: Array.isArray(save?.csa_active) ? save.csa_active.length : null,
    recent_turn_count: turns.length,
    recent_action_ids: turns.map(turn => turn?.action_id).filter(Boolean),
    context_master_present: Boolean(context?.master && (Array.isArray(context.master.characters) || Array.isArray(context.master.general_npcs)))
  };
}

export function buildStoryFailureDiagnostic({ gameId, turn, playerAction, actionId, story, parser, actionStatus: status, beforeContext, afterContext }) {
  return {
    game_id: gameId ?? null,
    turn,
    expected_turn: turn,
    action_id: actionId ?? null,
    player_action: playerAction ?? null,
    request: {
      endpoint: story?.endpoint ?? '/api/story',
      http_status: story?.http_status ?? null,
      local_action_id: story?.local_action_id ?? actionId ?? null,
      sse_meta_action_id: story?.sse_meta_action_id ?? null
    },
    story: {
      terminal_event: story?.terminal_event ?? null,
      response_error: story?.response_error ?? null,
      sse_error_code: story?.sse_error_code ?? null,
      sse_error_message: story?.sse_error_message ?? null,
      sse_error_retryable: story?.sse_error_retryable ?? null,
      raw_story_available: story?.raw_story_available === true,
      raw_story_char_count: String(story?.raw_story ?? '').length,
      visible_story_char_count: String(story?.visible_story ?? '').length,
      complete: story?.complete ?? null,
      events: Array.isArray(story?.events) ? story.events : []
    },
    parser: {
      status: parser?.status ?? null,
      error: parser?.error ?? null,
      block_sequence: parser?.block_sequence ?? [],
      scene_count: parser?.scene_count ?? null,
      dialogue_count: parser?.dialogue_count ?? null,
      thought_count: parser?.thought_count ?? null,
      choice_count: parser?.choice_count ?? null,
      warnings: parser?.warnings ?? []
    },
    action_status: status ?? null,
    context_before: beforeContext ?? null,
    context_after: afterContext ?? null
  };
}

function historySnapshot(result) {
  const payload = result?.body?.data ?? result?.body ?? {};
  const records = Array.isArray(payload?.records) ? payload.records : (Array.isArray(payload?.turns) ? payload.turns : []);
  return {
    ok: result?.ok === true,
    http_status: result?.status ?? null,
    record_count: records.length,
    action_ids: records.map(record => record?.action_id).filter(Boolean),
    turn_numbers: records.map(record => record?.turn_number ?? record?.turn).filter(value => value != null),
    has_more: payload?.has_more ?? null,
    story_present_count: records.filter(record => String(record?.story_text ?? record?.story ?? '').trim()).length,
    parsed_blocks_present_count: records.filter(record => record?.parsed_blocks != null).length,
    choices_present_count: records.filter(record => Array.isArray(record?.choices) || Array.isArray(record?.last_choices) || Array.isArray(record?.parsed_blocks?.choices)).length
  };
}

function storyReplaySnapshot(story) {
  const meta = story?.events?.find(event => event.name === 'meta')?.data ?? null;
  return {
    http_status: story?.http_status ?? null,
    terminal_event: story?.terminal_event ?? null,
    sse_meta_action_id: story?.sse_meta_action_id ?? null,
    meta_replayed: meta?.replayed ?? null,
    complete_replayed: story?.complete?.replayed ?? null,
    raw_story_available: story?.raw_story_available === true,
    response_error: story?.response_error ?? null
  };
}

function extractReplaySnapshot(result) {
  return {
    ok: result?.ok === true,
    http_status: result?.status ?? null,
    replayed: result?.body?.data?.replayed ?? null,
    error: result?.ok ? null : errorDetails(result?.body, result?.status)
  };
}

function commitReplaySnapshot(result) {
  const commit = result?.body?.data?.commit ?? null;
  return {
    ok: result?.ok === true,
    http_status: result?.status ?? null,
    success: commit?.success ?? null,
    replayed: commit?.replayed ?? null,
    idempotent: commit?.idempotent ?? null,
    error: result?.ok ? null : errorDetails(result?.body, result?.status)
  };
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
    terminal_ms: null, terminal_event: null, sse_error_code: null, sse_error_message: null, sse_error_retryable: null,
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
    evidence.sse_error_retryable = error?.retryable ?? null;
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
  const mandatoryFacts = (projection?.world_rules ?? []).flatMap(rule => (rule.resolved_facts ?? [])
    .filter(fact => fact.trigger_state === 'required_now' && fact.execution_policy === 'mandatory_execution'
      && (fact.execution_kind !== 'clothing_state' || fact.already_effective !== true))
    .map(fact => ({ rule_id: fact.rule_id, actor_id: fact.actor_id })));
  const projectionCoherence = mandatoryFacts.map(fact => ({
    ...fact,
    matching_scene_obligation: obligations.filter(obligation => obligation.source_rule_id === fact.rule_id && obligation.actor_id === fact.actor_id).length
  }));
  if (!obligations.length) return { status: 'NOT_REQUIRED', obligations: [], projection_coherence: projectionCoherence, projection_coherence_ok: projectionCoherence.every(item => item.matching_scene_obligation === 1) };
  const details = obligations.map(obligation => {
    const npc = extract?.npc_observations?.[obligation.actor_id] ?? {};
    const clothing = npc?.physical?.clothing ?? {};
    const saved = nextSave?.npc_scene_state?.[obligation.actor_id]?.clothing ?? {};
    const name = profileName(master, obligation.actor_id);
    const evidence = obligation.changes.map(change => ({
      slot: change.slot, required: change.required, extracted: clothing[change.slot] ?? null, saved: saved[change.slot] ?? null
    }));
    const matchingFact = (projection?.world_rules ?? []).flatMap(rule => rule.resolved_facts ?? [])
      .find(fact => fact.rule_id === obligation.source_rule_id && fact.actor_id === obligation.actor_id);
    return {
      actor_id: obligation.actor_id,
      actor_name: name,
      rule_id: obligation.source_rule_id,
      trigger_state: matchingFact?.trigger_state ?? obligation.trigger_state ?? null,
      execution_policy: matchingFact?.execution_policy ?? obligation.execution_policy ?? null,
      already_effective: matchingFact?.already_effective ?? false,
      current_state: matchingFact?.current_state ?? null,
      required_state: matchingFact?.required_state ?? null,
      matching_scene_obligation: true,
      evidence,
      raw_name_present: rawStory.includes(name)
    };
  });
  const pass = details.every(detail => detail.raw_name_present && detail.evidence.every(item => item.extracted === item.required && item.saved === item.required));
  return { status: pass ? 'PASS' : 'FAIL', obligations: details, projection_coherence: projectionCoherence, projection_coherence_ok: projectionCoherence.every(item => item.matching_scene_obligation === 1) };
}

async function run() {
  const args = new Set(process.argv.slice(2));
  const playabilityMode = args.has('--phase12k-playability');
  const cut1AuthorityMode = args.has(`--${CUT1_AUTHORITY_MODE}`);
  const cut3RelationEventMode = args.has(`--${CUT3_RELATION_EVENT_MODE}`);
  const gameId = process.env.COMPANY_TEST_GAME_ID ?? TEST_GAME_ID;
  const base = (process.env.COMPANY_API_BASE_URL ?? DEFAULT_API_BASE).replace(/\/$/, '');
  assertTestGameId(gameId);
  const report = { phase: cut3RelationEventMode ? 'CUT3-RELATION-EVENT' : (cut1AuthorityMode ? 'CUT1-AUTHORITY' : (playabilityMode ? '12K' : '12H-A')), game_id: gameId, api_base: base, started_at: now(), turns: [], production_access: false, provider_calls: 'worker-bound only' };
  lastReport = report;
  const canaryMaster = buildCompanyEditionMaster();
  report.master_source = {
    source: 'local_company_edition_catalog',
    characters: canaryMaster.characters.length,
    general_npcs: canaryMaster.general_npcs.length
  };
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
  const openingParser = classifyParserResult(opening.raw_story, canaryMaster);
  report.opening = { ...opening, parser: { ...openingParser, parsed: undefined }, choices: choiceContract(openingParser.parsed) };
  const openingFailure = openingFollowUpAllowed(opening, openingParser) ? null : openingFailureClassification(opening, openingParser);
  if (openingFailure) {
    report.opening.failure_classification = openingFailure;
    const actionId = opening.sse_meta_action_id ?? opening.local_action_id ?? null;
    const artifact = {
      phase: '12H-A', game_id: gameId, api_base: base, captured_at: now(),
      opening: report.opening,
      parser: { ...openingParser, parsed: undefined },
      action_id: actionId,
      action_status: null,
      db_context: {
        status: null, error: null, opening_state: null,
        committed_turn: null, csa_active: null, processing_status: null
      },
      follow_up_calls: { turn1: 0, turn2: 0, retry: 0 }
    };
    const artifactPath = process.env.CANARY_ARTIFACT_PATH ?? 'phase12h-opening-failure.json';
    await writeVerifiedArtifact(artifactPath, artifact);
    const evidenceContext = await requestJson(base, '/api/context', { game_id: gameId, recent_turns: 5 });
    const evidenceSave = saveData(evidenceContext.body?.data?.context);
    artifact.action_status = actionId ? await actionStatus(base, gameId, actionId) : null;
    artifact.db_context = {
      status: evidenceContext.status,
      error: evidenceContext.ok ? null : errorDetails(evidenceContext.body, evidenceContext.status),
      opening_state: evidenceSave?.opening_state ?? null,
      committed_turn: evidenceSave?.turn_state?.committed_turn ?? null,
      csa_active: evidenceSave?.csa_active ?? null,
      processing_status: evidenceSave?.turn_state?.processing_status ?? null
    };
    await writeVerifiedArtifact(artifactPath, artifact);
    report.artifact_path = artifactPath;
    report.artifact_verified = true;
    const reset = await requestJson(base, '/api/reset', { game_id: gameId });
    report.final_reset = { status: reset.status, ok: reset.ok, error: reset.ok ? null : errorDetails(reset.body, reset.status) };
    throw new Error(`opening hard failure (${openingFailure}); artifact=${artifactPath}`);
  }
  if (!playabilityMode && !cut1AuthorityMode && !cut3RelationEventMode) {
    // A successful Opening is itself the acceptance boundary for the original diagnostic.
    // Do not advance to Turn 1 or invoke any CSA transaction in that mode.
    report.status = 'OPENING_PASS_ONLY';
    const successArtifactPath = process.env.CANARY_ARTIFACT_PATH ?? 'phase12h-opening-success.json';
    report.artifact_path = successArtifactPath;
    report.artifact_verified = true;
    await writeVerifiedArtifact(successArtifactPath, report);
    return report;
  }

  const playabilityArtifactPath = process.env.CANARY_ARTIFACT_PATH ?? 'phase12k-playability.json';

  async function refreshContext() {
    const value = await requestJson(base, '/api/context', { game_id: gameId, recent_turns: 5 });
    if (!value.ok) throw new Error(`context failed: ${JSON.stringify(errorDetails(value.body, value.status))}`);
    context = value.body.data.context; save = saveData(context); return context;
  }

  async function readContextAndHistory() {
    const contextResult = await requestJson(base, '/api/context', { game_id: gameId, recent_turns: 10 });
    if (!contextResult.ok) throw new Error(`context failed: ${JSON.stringify(errorDetails(contextResult.body, contextResult.status))}`);
    const historyResult = await requestJson(base, '/api/history', { game_id: gameId, limit: 50 });
    if (!historyResult.ok) throw new Error(`history failed: ${JSON.stringify(errorDetails(historyResult.body, historyResult.status))}`);
    const contextSummary = contextSnapshot(contextResult);
    const historySummary = historySnapshot(historyResult);
    return {
      context: contextSummary,
      history: {
        ...historySummary,
        action_id_field_present: historySummary.action_ids.length > 0,
        context_recent_action_ids: contextSummary.recent_action_ids,
        identity_source: 'context.recent_turns'
      }
    };
  }

  if (cut3RelationEventMode) {
    const artifactPath = process.env.CANARY_ARTIFACT_PATH ?? 'cut3-relation-event-deterministic.json';
    report.phase = 'CUT3-RELATION-EVENT';
    report.acceptance = {
      scenario: 'one bounded registered-participant social commitment',
      retry_count: 0,
      provider_or_model_override: false,
      manual_game_access: false
    };

    const durableSnapshot = currentSave => ({
      active_relations: clone(currentSave?.active_relations ?? []),
      event_ledger: clone(currentSave?.event_ledger ?? []),
      sexual_event_ledger: clone(currentSave?.sexual_event_ledger ?? [])
    });

    const writeReportAndReset = async () => {
      await writeVerifiedArtifact(artifactPath, report);
      const finalReset = await requestJson(base, '/api/reset', { game_id: gameId });
      report.final_reset = { status: finalReset.status, ok: finalReset.ok, error: finalReset.ok ? null : errorDetails(finalReset.body, finalReset.status) };
      if (finalReset.ok) {
        const finalContext = await requestJson(base, '/api/context', { game_id: gameId, recent_turns: 5 });
        const finalSave = saveData(finalContext.body?.data?.context);
        report.final_reset.readback = {
          context: contextSnapshot(finalContext),
          durable: durableSnapshot(finalSave),
          clean: finalContext.ok
            && finalSave?.turn_state?.committed_turn === 0
            && finalSave?.turn_state?.processing_status === 'idle'
            && finalSave?.player_setup?.status === 'not_started'
            && finalSave?.opening_state?.status === 'not_started'
            && Array.isArray(finalSave?.csa_active) && finalSave.csa_active.length === 0
        };
      }
      await writeVerifiedArtifact(artifactPath, report);
      return report;
    };

    try {
      await refreshContext();
      const targetId = presentNpcIds(save).find(id => id !== 'player') ?? null;
      const target = targetId ? profileForMaster(canaryMaster, targetId) : null;
      const targetName = target?.name ?? targetId;
      report.registered_participant = { target_id: targetId, profile: target };
      if (!targetId || !targetName) {
        report.status = 'BLOCKED';
        report.block_reason = 'no registered non-player NPC was present after Opening';
        await writeReportAndReset();
        return report;
      }

      const actionId = randomUUID();
      const turn = (save?.turn_state?.committed_turn ?? 0) + 1;
      const playerAction = `${targetName}에게 오늘 회의에서 혼란을 준 점을 사과하고 다음 회의 준비를 함께하기로 약속한다.`;
      const before = { context: contextSnapshot({ ok: true, status: 200, body: { data: { context } } }), durable: durableSnapshot(save) };
      const story = await captureStory(base, gameId, { game_id: gameId, action_id: actionId, expected_turn: turn, player_action: playerAction });
      const parser = classifyParserResult(story.raw_story, canaryMaster);
      const failureDiagnostic = !story.ok || parser.status === 'failure'
        ? buildStoryFailureDiagnostic({
          gameId, turn, playerAction, actionId, story, parser,
          actionStatus: await actionStatus(base, gameId, actionId),
          beforeContext: before.context,
          afterContext: contextSnapshot(await requestJson(base, '/api/context', { game_id: gameId, recent_turns: 5 }))
        }) : null;
      report.turn = {
        turn, action_id: actionId, player_action: playerAction,
        story: { ...story, events: undefined },
        raw_story: story.raw_story,
        parsed_story: parser.parsed ?? null,
        parser: { ...parser, parsed: undefined },
        story_failure_diagnostic: failureDiagnostic
      };
      if (failureDiagnostic) {
        report.status = 'BLOCKED';
        report.block_reason = 'Story failed before relation/event acceptance could be observed';
        await writeReportAndReset();
        return report;
      }

      const extractResult = await requestJson(base, '/api/extract', { game_id: gameId, action_id: actionId });
      const extracted = summarizeExtract(extractResult, save, canaryMaster);
      const normalized = extracted.extract ?? null;
      const relationUpdates = Array.isArray(normalized?.relation_updates) ? normalized.relation_updates : [];
      const generalEvents = Array.isArray(normalized?.events?.general) ? normalized.events.general : [];
      const sexualEvents = Array.isArray(normalized?.events?.sexual) ? normalized.events.sexual : [];
      report.turn.extract = extracted;
      report.turn.typed_observation = {
        relation_updates: clone(relationUpdates),
        events_general: clone(generalEvents),
        events_sexual: clone(sexualEvents),
        exact_story_quotes: [
          ...relationUpdates.map(item => item.quote),
          ...generalEvents.map(item => item.evidence),
          ...sexualEvents.map(item => item.evidence)
        ].filter(value => typeof value === 'string' && value.trim())
      };
      if (!extractResult.ok) {
        report.status = 'BLOCKED';
        report.block_reason = 'Extract failed before relation/event acceptance could be observed';
        await writeReportAndReset();
        return report;
      }
      if (!relationUpdates.length && !generalEvents.length && !sexualEvents.length) {
        report.status = 'BLOCKED';
        report.block_reason = 'no typed relation/event observation was returned; no retry permitted';
        report.turn.action_status = await actionStatus(base, gameId, actionId);
        await writeReportAndReset();
        return report;
      }

      const commitResult = await requestJson(base, '/api/commit', { game_id: gameId, action_id: actionId, expected_turn: turn });
      report.turn.commit = commitReplaySnapshot(commitResult);
      if (!commitResult.ok) {
        report.status = 'BLOCKED';
        report.block_reason = 'typed relation/event observation did not commit';
        await writeReportAndReset();
        return report;
      }
      await refreshContext();
      const afterCommit = { context: contextSnapshot({ ok: true, status: 200, body: { data: { context } } }), durable: durableSnapshot(save) };
      const relationMatches = relationUpdates.filter(input => afterCommit.durable.active_relations.some(row =>
        row.actor_id === input.actor_id && row.target_id === input.target_id && row.relation_kind === input.relation_kind && row.state === (input.state === 'ended' ? 'ended' : 'active')
      ));
      const generalMatches = generalEvents.filter(input => afterCommit.durable.event_ledger.some(row =>
        (input.event_id && row.event_id === input.event_id) || (!input.event_id && row.evidence === input.evidence)
      ));
      const sexualMatches = sexualEvents.filter(input => afterCommit.durable.sexual_event_ledger.some(row =>
        (input.event_id && row.event_id === input.event_id) || (!input.event_id && row.evidence === input.evidence)
      ));
      report.durable_consequence = {
        after_commit: afterCommit,
        relation_matches: clone(relationMatches),
        general_event_matches: clone(generalMatches),
        sexual_event_matches: clone(sexualMatches),
        registered_participant_ids: [targetId, ...relationUpdates.flatMap(item => [item.actor_id, item.target_id]), ...generalEvents.flatMap(item => item.participants ?? []), ...sexualEvents.flatMap(item => [item.actor_id, item.target_id])].filter(Boolean).filter((id, index, ids) => ids.indexOf(id) === index)
      };
      if (!relationMatches.length && !generalMatches.length && !sexualMatches.length) {
        report.status = 'BLOCKED';
        report.block_reason = 'typed relation/event observation had no matching durable consequence after Commit';
        await writeReportAndReset();
        return report;
      }

      const replayBefore = { context: afterCommit.context, durable: afterCommit.durable };
      const replayStory = await captureStory(base, gameId, { game_id: gameId, action_id: actionId, expected_turn: turn, player_action: playerAction });
      const replayExtractResult = await requestJson(base, '/api/extract', { game_id: gameId, action_id: actionId });
      const replayCommitResult = await requestJson(base, '/api/commit', { game_id: gameId, action_id: actionId, expected_turn: turn });
      await refreshContext();
      const replayAfter = { context: contextSnapshot({ ok: true, status: 200, body: { data: { context } } }), durable: durableSnapshot(save) };
      report.replay = {
        story: storyReplaySnapshot(replayStory),
        extract: extractReplaySnapshot(replayExtractResult),
        commit: commitReplaySnapshot(replayCommitResult),
        before: replayBefore,
        after: replayAfter,
        unchanged: JSON.stringify(replayBefore) === JSON.stringify(replayAfter)
      };
      const historyResult = await requestJson(base, '/api/history', { game_id: gameId, limit: 50 });
      report.recovery = { context: replayAfter.context, history: historySnapshot(historyResult) };
      if (report.replay.story.meta_replayed !== true || report.replay.story.complete_replayed !== true
        || report.replay.extract.replayed !== true || report.replay.commit.replayed !== true || !report.replay.unchanged) {
        report.status = 'BLOCKED';
        report.block_reason = 'relation/event replay was not acknowledged as idempotent';
        await writeReportAndReset();
        return report;
      }
      report.status = 'PASS';
      await writeReportAndReset();
      return report;
    } catch (error) {
      report.status = 'BLOCKED';
      report.block_reason = error?.message ?? String(error);
      await writeReportAndReset();
      throw error;
    }
  }

  if (cut1AuthorityMode) {
    const cut1ArtifactPath = process.env.CANARY_ARTIFACT_PATH ?? 'phase12cut1-authority.json';
    const sameActionReplay = {};
    const cut1Turn = async (turn, playerAction) => {
      const actionId = randomUUID();
      const beforeResult = await requestJson(base, '/api/context', { game_id: gameId, recent_turns: 5 });
      const beforeContext = contextSnapshot(beforeResult);
      const story = await captureStory(base, gameId, { game_id: gameId, action_id: actionId, expected_turn: turn, player_action: playerAction });
      const parser = classifyParserResult(story.raw_story, canaryMaster);
      if (!story.ok || parser.status === 'failure') {
        const afterResult = await requestJson(base, '/api/context', { game_id: gameId, recent_turns: 5 });
        const failure = buildStoryFailureDiagnostic({
          gameId, turn, playerAction, actionId, story, parser,
          actionStatus: await actionStatus(base, gameId, actionId),
          beforeContext,
          afterContext: contextSnapshot(afterResult)
        });
        report.turns.push({ turn, stage: 'story', action_id: actionId, diagnostic: failure });
        report.story_failure_diagnostic = failure;
        throw new Error(`cut1 turn ${turn} Story failure`);
      }
      const extractResult = await requestJson(base, '/api/extract', { game_id: gameId, action_id: actionId });
      if (!extractResult.ok) throw new Error(`cut1 turn ${turn} Extract failure: ${JSON.stringify(errorDetails(extractResult.body, extractResult.status))}`);
      const commitResult = await requestJson(base, '/api/commit', { game_id: gameId, action_id: actionId, expected_turn: turn });
      if (!commitResult.ok) throw new Error(`cut1 turn ${turn} Commit failure: ${JSON.stringify(errorDetails(commitResult.body, commitResult.status))}`);
      const readback = await readContextAndHistory();
      const turnReport = {
        turn,
        action_id: actionId,
        player_action: playerAction,
        story: storyReplaySnapshot(story),
        parser: { status: parser.status, block_sequence: parser.block_sequence, warnings: parser.warnings },
        extract: summarizeExtract(extractResult, save, canaryMaster),
        commit: commitReplaySnapshot(commitResult),
        readback
      };
      report.turns.push(turnReport);
      return { actionId, playerAction, story, readback };
    };

    const replayTurn1 = async first => {
      const before = first.readback.context;
      const story = await captureStory(base, gameId, {
        game_id: gameId, action_id: first.actionId, expected_turn: 1, player_action: first.playerAction
      });
      const metaReplayed = story.events?.find(event => event.name === 'meta')?.data?.replayed ?? null;
      const completeReplayed = story.complete?.replayed ?? null;
      if (!story.ok || metaReplayed !== true || completeReplayed !== true) throw new Error('cut1 Story replay was not acknowledged as replayed');
      const extractResult = await requestJson(base, '/api/extract', { game_id: gameId, action_id: first.actionId });
      const extractReplay = extractReplaySnapshot(extractResult);
      if (!extractResult.ok || extractReplay.replayed !== true) throw new Error('cut1 Extract replay was not acknowledged as replayed');
      const commitResult = await requestJson(base, '/api/commit', { game_id: gameId, action_id: first.actionId, expected_turn: 1 });
      const commitReplay = commitReplaySnapshot(commitResult);
      if (!commitResult.ok || commitReplay.replayed !== true) throw new Error('cut1 Commit replay was not acknowledged as replayed');
      const after = await readContextAndHistory();
      if (after.context.committed_turn !== before.committed_turn || after.context.save_revision !== before.save_revision) {
        throw new Error('cut1 replay changed committed_turn or save_revision');
      }
      sameActionReplay.turn1 = { story: storyReplaySnapshot(story), extract: extractReplay, commit: commitReplay, before, after };
    };

    try {
      const first = await cut1Turn(1, '김제나씨에게 인사하고 오늘 업무와 팀 분위기를 물어본다.');
      await replayTurn1(first);
      const second = await cut1Turn(2, '오늘 업무를 계속하며 팀의 업무 흐름을 살펴본다.');
      report.replay = sameActionReplay;
      report.context_history = {
        turn1_commit: first.readback,
        after_turn1_replay: sameActionReplay.turn1.after,
        turn2_commit: second.readback
      };
      report.status = 'PASS';
      report.artifact_path = cut1ArtifactPath;
      await writeVerifiedArtifact(cut1ArtifactPath, report);
      const finalReset = await requestJson(base, '/api/reset', { game_id: gameId });
      report.final_reset = { status: finalReset.status, ok: finalReset.ok, error: finalReset.ok ? null : errorDetails(finalReset.body, finalReset.status) };
      await writeVerifiedArtifact(cut1ArtifactPath, report);
      return report;
    } catch (error) {
      report.status = 'STOPPED';
      report.error = { message: error?.message ?? String(error) };
      report.artifact_path = cut1ArtifactPath;
      await writeVerifiedArtifact(cut1ArtifactPath, report);
      const finalReset = await requestJson(base, '/api/reset', { game_id: gameId });
      report.final_reset = { status: finalReset.status, ok: finalReset.ok, error: finalReset.ok ? null : errorDetails(finalReset.body, finalReset.status) };
      await writeVerifiedArtifact(cut1ArtifactPath, report);
      throw error;
    }
  }

  async function runTurn(turn, playerAction, structuredAction = null, projection = null) {
    const actionId = randomUUID();
    const story = await captureStory(base, gameId, { game_id: gameId, action_id: actionId, expected_turn: turn, player_action: playerAction, ...(structuredAction ? { structured_action: structuredAction } : {}) });
    const parser = classifyParserResult(story.raw_story, canaryMaster);
    const turnReport = { turn, stage: 'story', action_id: actionId, story: { ...story, events: undefined }, parser: { ...parser, parsed: undefined }, parser_block_sequence: parser.block_sequence, parser_warnings: parser.warnings, choice: choiceContract(parser.parsed) };
    const parserHardFailure = parser.status === 'failure';
    if (!story.ok) { turnReport.hard_failure = 'STORY_TRANSPORT_OR_PROTOCOL'; report.turns.push(turnReport); throw new Error(`turn ${turn} Story failure`); }
    if (parserHardFailure) { turnReport.hard_failure = 'FRESH_PARSER'; report.turns.push(turnReport); throw new Error(`turn ${turn} stopped after FRESH_PARSER`); }
    const extractResult = await requestJson(base, '/api/extract', { game_id: gameId, action_id: actionId, ...(structuredAction ? { structured_action: structuredAction } : {}) });
    const extracted = summarizeExtract(extractResult, save, canaryMaster);
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
      const physical = csaPhysicalVerdict(projection, raw, extracted.extract, nextSave, canaryMaster);
      turnReport.csa = { projection: projectionSnapshot(projection), parity: projection.__parity ?? null, institutional_enactment: !raw.match(/상식개변|앱|버튼|스마트폰/), physical };
      // A deterministic mandatory projection makes a missing concrete Story /
      // Extract transition a canary failure. Preserve the complete turn
      // evidence, reset only after the artifact has been verified, and do not
      // continue into a follow-up turn.
      if (physical.status === 'FAIL' && projection.__parity) {
        turnReport.hard_failure = 'CSA_STORY_COMPLIANCE';
        report.turns.push(turnReport);
        report.status = 'STOPPED';
        report.stop_reason = 'mandatory CSA projection had no evidenced clothing transition';
        report.artifact_path = playabilityArtifactPath;
        await writeVerifiedArtifact(playabilityArtifactPath, report);
        const finalReset = await requestJson(base, '/api/reset', { game_id: gameId });
        report.final_reset = { status: finalReset.status, ok: finalReset.ok, error: finalReset.ok ? null : errorDetails(finalReset.body, finalReset.status) };
        await writeVerifiedArtifact(playabilityArtifactPath, report);
        throw new Error(`turn ${turn} stopped after CSA_STORY_COMPLIANCE; artifact=${playabilityArtifactPath}`);
      }
    }
    report.turns.push(turnReport);
    return { actionId, story, parser, extracted, nextSave };
  }

  await runTurn(1, '김제나에게 인사하고 오늘 업무와 팀 분위기를 물어본다.');
  const validation = await requestJson(base, '/api/app-validate', { game_id: gameId, structured_action: { type: 'app_transaction', base_turn_count: 1, operations: [{ client_id: `canary-${randomUUID()}`, domain: 'csa', operation: 'activate', source_type: 'preset', strength: 'weak', preset: { template_id: 'no_panties_under_work_clothes' } }] } });
  if (!validation.ok) throw new Error(`app-validate failed: ${JSON.stringify(errorDetails(validation.body, validation.status))}`);
  const canonicalAction = validation.body.data.canonical_action;
  const csaSave = clone(save);
  csaSave.csa_active = clone(canonicalAction.transaction_resolution.next_csa_active);
  csaSave.csa_rules = clone(canonicalAction.transaction_resolution.next_csa_rules);
  const sceneActors = presentNpcIds(save);
  const parity = buildCanaryProjectionParity({ save: csaSave, contextMaster: context.master, sceneActorIds: sceneActors, expectedTurn: 2 });
  const projection = { ...parity.local_projection, __parity: parity };
  report.turn2_projection_parity = parity;
  await runTurn(2, validation.body.data.display_input ?? '회사 규정 변경사항이 실제 업무에 어떻게 드러나는지 확인하며 업무를 이어간다.', canonicalAction, projection);
  await runTurn(3, '오늘 업무를 계속하며 회사 공지와 팀 분위기를 살펴본다.');
  if (!playabilityMode) {
    await runTurn(4, '현재 업무를 정리하고 동료와 협업을 이어간다.');
    await runTurn(5, '남은 업무를 확인하고 다음 작업을 준비한다.');
  }
  report.status = 'PASS';
  report.artifact_path = playabilityArtifactPath;
  report.artifact_verified = true;
  await writeVerifiedArtifact(playabilityArtifactPath, report);
  const finalReset = await requestJson(base, '/api/reset', { game_id: gameId });
  report.final_reset = { status: finalReset.status, ok: finalReset.ok, error: finalReset.ok ? null : errorDetails(finalReset.body, finalReset.status) };
  await writeVerifiedArtifact(playabilityArtifactPath, report);
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
