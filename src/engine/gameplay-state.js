import { GameCoreError } from './errors.js';

const OUTCOMES = new Set(['success', 'partial', 'refused', 'interrupted', 'blocked', 'degraded']);
const FORBIDDEN_MIND_KEYS = new Set(['body', 'physical', 'body_reaction', 'physical_action', '신체반응', '신체·행동 반응']);
const TURN_CHANGE_ROOTS = new Set([
  'player_sexual_state', 'npc_stats', 'npc_relationship_state', 'npc_emotion',
  'scene_state', 'world_state', 'csa_runtime_state', 'csa_aftereffect_state'
]);

export const CSA_LIFECYCLE = new Set(['active', 'temporarily_interrupted', 'suspended', 'completed', 'deactivated']);
export const CSA_APPLICABILITY = new Set(['applicable', 'not_applicable', 'unknown']);
export const CSA_EXECUTION_STATE = new Set(['not_started', 'proposed', 'executed', 'refused', 'interrupted']);

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  return structuredClone(value);
}

function integer(value) {
  return typeof value === 'number' && Number.isInteger(value) ? value : null;
}

function stringOrEmpty(value) {
  return typeof value === 'string' ? value : '';
}

function identity(value) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function choices(value) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()) : [];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function canonicalGameTime(value) {
  const current = object(value) ? value : {};
  return {
    day: integer(current.day) !== null && current.day >= 1 ? current.day : 1,
    minute_of_day: integer(current.minute_of_day) !== null && current.minute_of_day >= 0 && current.minute_of_day <= 1439
      ? current.minute_of_day : 540
  };
}

function normalDialogueLines(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(object).map((line, order) => ({
    speaker_id: identity(line.speaker_id),
    speaker_name: stringOrEmpty(line.speaker_name),
    direction: stringOrEmpty(line.direction),
    text: stringOrEmpty(line.text),
    order: integer(line.order) ?? order
  })).filter(line => line.text);
}

/**
 * The Story parser is always authoritative for dialogue text, direction, and order.
 * Extract may only enrich a speaker_id the parser could not resolve, and only for a
 * line it can identify by an exact order+text match — it can never rewrite dialogue.
 */
function mergeDialogueLines(parserDialogueLines, extractDialogueLines) {
  const parserLines = normalDialogueLines(parserDialogueLines);
  const extractLines = normalDialogueLines(extractDialogueLines);
  const bySignature = new Map(extractLines.map(line => [`${line.order} ${line.text}`, line]));
  return parserLines.map(line => {
    if (line.speaker_id) return line;
    const enrichment = bySignature.get(`${line.order} ${line.text}`);
    return enrichment && enrichment.speaker_id ? { ...line, speaker_id: enrichment.speaker_id } : line;
  });
}

/** Builds the stable NPC id universe from normalized character/general-NPC lists. */
export function buildStableNpcIdSet({ characters = [], generalNpcs = [] } = {}) {
  const ids = new Set();
  for (const list of [characters, generalNpcs]) {
    for (const entry of Array.isArray(list) ? list : []) {
      const id = identity(entry?.character_id ?? entry?.npc_id ?? entry?.id);
      if (id) ids.add(id);
    }
  }
  return ids;
}

function validatedNpcId(value, npcIds, warnings, code) {
  const id = identity(value);
  if (id === null) return null;
  if (!(npcIds instanceof Set)) return id;
  if (npcIds.has(id)) return id;
  warnings.push(`unknown_npc_id:${code}:${id}`);
  return null;
}

function validatedNpcList(value, npcIds, warnings, code) {
  const list = choices(value);
  if (!(npcIds instanceof Set)) return list;
  const kept = [];
  for (const id of list) {
    if (npcIds.has(id)) kept.push(id);
    else warnings.push(`unknown_npc_id:${code}:${id}`);
  }
  return kept;
}

function validatedMindMonitor(mindMonitor, npcIds, warnings) {
  if (!(npcIds instanceof Set)) return mindMonitor;
  const kept = {};
  for (const [npcId, entry] of Object.entries(mindMonitor)) {
    if (npcIds.has(npcId)) kept[npcId] = entry;
    else warnings.push(`unknown_npc_id:mind_monitor:${npcId}`);
  }
  return kept;
}

/**
 * Produces canonical display-safe mind monitor data without mutating the input.
 * Legacy string monitors are retained separately so no text is discarded.
 */
export function normalizeMindMonitor(input) {
  const warnings = [];
  if (typeof input === 'string') {
    return { mind_monitor: {}, legacy_text: input, warnings: ['legacy_mind_monitor_preserved'] };
  }
  if (!object(input)) return { mind_monitor: {}, legacy_text: '', warnings };

  const mind_monitor = {};
  for (const [npcId, value] of Object.entries(input)) {
    if (!object(value)) {
      if (typeof value === 'string') warnings.push(`legacy_mind_monitor_entry:${npcId}`);
      continue;
    }
    const entry = {};
    for (const key of ['surface', 'subconscious']) {
      if (typeof value[key] === 'string') entry[key] = value[key];
    }
    for (const key of Object.keys(value)) {
      if (FORBIDDEN_MIND_KEYS.has(key)) warnings.push(`forbidden_mind_monitor_key:${npcId}:${key}`);
    }
    if (Object.keys(entry).length > 0) mind_monitor[npcId] = entry;
  }
  return { mind_monitor, legacy_text: '', warnings };
}

/** Normalizes the extended gameplay Extract contract while retaining parser authority. */
export function normalizeGameplayExtractEnvelope(value, { parsedStory = {}, npcIds } = {}) {
  if (!object(value) || !object(value.state_delta)) {
    throw new GameCoreError('INVALID_EXTRACT', 'Extract must contain an object state_delta');
  }
  if (!OUTCOMES.has(value.outcome)) {
    throw new GameCoreError('INVALID_EXTRACT', 'Extract outcome is invalid');
  }
  const idWarnings = [];
  const normalizedMonitor = normalizeMindMonitor(value.mind_monitor);
  const storyChoices = choices(parsedStory?.choices);
  const parserHasChoices = storyChoices.length === 4;
  const npcsPresent = validatedNpcList(value.npcs_present, npcIds, idWarnings, 'npcs_present');
  const actionTargetId = validatedNpcId(value.action_target_id, npcIds, idWarnings, 'action_target_id');
  const focalCharacterId = validatedNpcId(value.focal_character_id, npcIds, idWarnings, 'focal_character_id');
  const lastSpeakerId = validatedNpcId(value.last_speaker_id, npcIds, idWarnings, 'last_speaker_id');
  const imageCharacterId = validatedNpcId(value.image_character_id, npcIds, idWarnings, 'image_character_id');
  const mindMonitor = validatedMindMonitor(normalizedMonitor.mind_monitor, npcIds, idWarnings);
  const warnings = [...new Set([
    ...(Array.isArray(value.warnings) ? value.warnings.filter(item => typeof item === 'string' && item.trim()) : []),
    ...normalizedMonitor.warnings,
    ...idWarnings,
    ...(parserHasChoices ? ['story_choices_authoritative'] : []),
    ...(parserHasChoices || choices(value.choices).length === 4 ? [] : ['choices_not_exactly_four'])
  ])];
  return {
    state_delta: clone(value.state_delta),
    outcome: value.outcome,
    evidence: object(value.evidence) ? clone(value.evidence) : {},
    turn_summary: stringOrEmpty(value.turn_summary),
    mind_monitor: mindMonitor,
    legacy_mind_monitor_text: normalizedMonitor.legacy_text,
    choices: parserHasChoices ? storyChoices : choices(value.choices),
    dialogue_lines: mergeDialogueLines(parsedStory?.dialogue_lines, value.dialogue_lines),
    npcs_present: npcsPresent,
    action_target_id: actionTargetId,
    focal_character_id: focalCharacterId,
    last_speaker_id: lastSpeakerId,
    image_character_id: imageCharacterId,
    player_inner_thought: stringOrEmpty(parsedStory?.player_inner_thought),
    player_status: stringOrEmpty(parsedStory?.player_status),
    turn_changes: Array.isArray(value.turn_changes) ? clone(value.turn_changes) : [],
    elapsed_minutes: normalizeElapsedMinutes(value.elapsed_minutes, value.evidence),
    warnings
  };
}

/**
 * Validates one csa_runtime_state[csa_id] patch against the three independent axes.
 * Invalid individual fields are dropped with a warning; valid fields are kept so a
 * single bad axis never discards the rest of an otherwise valid CSA update.
 */
export function validateCsaRuntimeStatePatch(csaId, patch) {
  const warnings = [];
  if (!object(patch)) return { patch: null, warnings: [`invalid_csa_runtime_state:${csaId}`] };
  const clean = {};
  if ('lifecycle' in patch) {
    if (CSA_LIFECYCLE.has(patch.lifecycle)) clean.lifecycle = patch.lifecycle;
    else warnings.push(`invalid_csa_lifecycle:${csaId}`);
  }
  if ('applicability' in patch) {
    if (CSA_APPLICABILITY.has(patch.applicability)) clean.applicability = patch.applicability;
    else warnings.push(`invalid_csa_applicability:${csaId}`);
  }
  if ('execution_state' in patch) {
    if (CSA_EXECUTION_STATE.has(patch.execution_state)) clean.execution_state = patch.execution_state;
    else warnings.push(`invalid_csa_execution_state:${csaId}`);
  }
  for (const key of Object.keys(patch)) {
    if (!['lifecycle', 'applicability', 'execution_state'].includes(key)) clean[key] = clone(patch[key]);
  }
  return { patch: clean, warnings };
}

function collectDialogueLines(parsedStory) {
  if (Array.isArray(parsedStory?.dialogue_lines) && parsedStory.dialogue_lines.length > 0) {
    return normalDialogueLines(parsedStory.dialogue_lines);
  }
  const dialogueBlocks = Array.isArray(parsedStory?.blocks) ? parsedStory.blocks.filter(block => block?.type === 'dialogue') : [];
  return normalDialogueLines(dialogueBlocks.map((block, order) => ({
    speaker_id: identity(block.speaker_id),
    speaker_name: stringOrEmpty(block.speaker ?? block.speaker_name),
    direction: stringOrEmpty(block.direction),
    text: stringOrEmpty(block.text),
    order
  })));
}

/** A short, deterministic Korean turn summary built without any additional LLM call. */
export function buildDegradedTurnSummary(playerAction, sceneText) {
  const action = stringOrEmpty(playerAction).trim();
  const firstSentence = stringOrEmpty(sceneText).trim().split(/(?<=[.!?。])\s+|\n/)[0]?.trim() ?? '';
  const truncate = (text, max) => (text.length > max ? `${text.slice(0, max)}…` : text);
  const parts = [truncate(action, 60), truncate(firstSentence, 100)].filter(Boolean);
  return parts.length > 0 ? truncate(parts.join(' — '), 160) : '턴이 진행되었습니다.';
}

/**
 * Builds the deterministic degraded Extract envelope used when the real Extract call
 * fails or cannot be normalized. No LLM call is made; every field the Story parser
 * already produced is preserved verbatim so the turn can still commit.
 */
export function buildDegradedExtractEnvelope({ parsedStory = {}, playerAction = '', extraWarnings = [] } = {}) {
  const story = object(parsedStory) ? parsedStory : {};
  const sceneText = stringOrEmpty(story.scene_text) || (Array.isArray(story.blocks)
    ? story.blocks.filter(block => block?.type === 'scene').map(block => block.text).join(' ')
    : '');
  const storyChoices = choices(story.choices);
  return {
    state_delta: {},
    outcome: 'degraded',
    evidence: {},
    turn_summary: buildDegradedTurnSummary(playerAction, sceneText),
    mind_monitor: {},
    legacy_mind_monitor_text: '',
    choices: storyChoices,
    dialogue_lines: collectDialogueLines(story),
    npcs_present: [],
    action_target_id: null,
    focal_character_id: null,
    last_speaker_id: null,
    image_character_id: null,
    player_inner_thought: stringOrEmpty(story.player_inner_thought),
    player_status: stringOrEmpty(story.player_status),
    turn_changes: [],
    elapsed_minutes: 3,
    warnings: [...new Set([
      'extract_degraded',
      ...(storyChoices.length !== 4 ? ['choices_not_exactly_four'] : []),
      ...extraWarnings
    ])]
  };
}

/** Extract may propose 1-30 minutes, or 1-480 with explicit time_advance evidence. */
export function normalizeElapsedMinutes(value, evidence = {}) {
  const max = object(evidence) && evidence.time_advance === true ? 480 : 30;
  const minutes = integer(value);
  return minutes !== null && minutes >= 1 && minutes <= max ? minutes : 3;
}

export function advanceGameTime(gameTime, elapsedMinutes = 3, evidence = {}) {
  const current = canonicalGameTime(gameTime);
  const total = current.minute_of_day + normalizeElapsedMinutes(elapsedMinutes, evidence);
  return { day: current.day + Math.floor(total / 1440), minute_of_day: total % 1440 };
}

export function formatGameTime(gameTime) {
  const resolved = canonicalGameTime(gameTime);
  const hour = Math.floor(resolved.minute_of_day / 60);
  const minute = String(resolved.minute_of_day % 60).padStart(2, '0');
  return `Day ${resolved.day} ${String(hour).padStart(2, '0')}:${minute}`;
}

export function reducePlayerSexualState(current, delta = {}, { storyEvidence = {}, updatedTurn = null } = {}) {
  const base = object(current) ? current : {};
  const patch = object(delta) ? delta : {};
  const state = {
    ...base,
    arousal: clamp(integer(base.arousal) ?? 0, 0, 100),
    ejaculation_progress: clamp(integer(base.ejaculation_progress) ?? 0, 0, 100),
    ejaculation_count: Math.max(0, integer(base.ejaculation_count) ?? 0),
    updated_turn: integer(base.updated_turn) ?? 0
  };
  state.arousal = clamp(state.arousal + (integer(patch.arousal_delta) ?? 0), 0, 100);
  state.ejaculation_progress = clamp(state.ejaculation_progress + (integer(patch.ejaculation_progress_delta) ?? 0), 0, 100);
  const warnings = [];
  if (patch.ejaculation_completed === true) {
    if (!object(storyEvidence) || storyEvidence.sexual_resolution !== true) {
      warnings.push('unauthorized_ejaculation_completion_ignored');
    } else {
      state.ejaculation_count += 1;
      state.ejaculation_progress = 0;
      state.arousal = 0;
    }
  }
  if (integer(updatedTurn) !== null && updatedTurn >= 0) state.updated_turn = updatedTurn;
  return { state, warnings };
}

function leaves(value, prefix = '') {
  if (!object(value)) return [[prefix, value]];
  return Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key));
}

/** Derives display changes solely from an already guarded before/after save pair. */
export function deriveTurnChanges(beforeSave, afterSave) {
  const before = object(beforeSave) ? beforeSave : {};
  const after = object(afterSave) ? afterSave : {};
  const changes = [];
  for (const root of TURN_CHANGE_ROOTS) {
    const previous = new Map(leaves(before[root], root));
    for (const [path, value] of leaves(after[root], root)) {
      if (path.endsWith('.updated_turn') || !previous.has(path) || Object.is(previous.get(path), value)) continue;
      if (['string', 'number', 'boolean'].includes(typeof value) || value === null) {
        changes.push({ path, from: previous.get(path), to: value });
      }
    }
  }
  return changes;
}

/**
 * Pure v1-compatible migration. v1 remains the persisted schema while this
 * contract adds optional gameplay state without issuing a database migration.
 */
export function migrateCompanySave(save) {
  if (!object(save) || save.edition !== 'company-v1' || save.save_schema_version !== 1) {
    throw new GameCoreError('UNSUPPORTED_SAVE_SCHEMA', 'Only company-v1 save schema 1 is supported');
  }
  const next = clone(save);
  next.world_state = object(next.world_state) ? next.world_state : {};
  if (!object(next.world_state.game_time)) next.world_state.game_time = { day: 1, minute_of_day: 540 };
  else next.world_state.game_time = canonicalGameTime(next.world_state.game_time);
  next.player_sexual_state = reducePlayerSexualState(next.player_sexual_state).state;
  return next;
}

const HYDRATION_SOURCES = [
  { mapName: 'npc_stats', canonicalKey: 'initial_stats' },
  { mapName: 'npc_relationship_state', canonicalKey: 'initial_relationship', aliasKey: 'initial_relationship_state' },
  { mapName: 'csa_attitudes', canonicalKey: 'initial_csa_attitudes' },
  { mapName: 'npc_emotion', canonicalKey: 'initial_emotion' },
  { mapName: 'npc_scene_state', canonicalKey: 'initial_scene_state' }
];

/** Hydrates only master-defined characters that have no stored NPC map entry. */
export function hydrateGameplayState(save, master = {}) {
  const next = migrateCompanySave(save);
  const characters = Array.isArray(master?.characters) ? master.characters : [];
  for (const character of characters) {
    const id = identity(character?.character_id);
    if (!id) continue;
    for (const { mapName, canonicalKey, aliasKey } of HYDRATION_SOURCES) {
      next[mapName] = object(next[mapName]) ? next[mapName] : {};
      if (id in next[mapName]) continue;
      const source = object(character[canonicalKey]) ? character[canonicalKey]
        : (aliasKey && object(character[aliasKey]) ? character[aliasKey] : null);
      if (source) next[mapName][id] = clone(source);
    }
  }
  return next;
}
