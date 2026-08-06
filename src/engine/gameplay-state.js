import { GameCoreError } from './errors.js';
import { STRUCTURED_SEXUAL_ACTIONS } from './csa/semantic-contract.js';

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

/**
 * Orders the character ids a Story/Extract prompt should actually carry state for this
 * turn: exact full-name mentions in the player's own input first, then focal_character_id,
 * then last_speaker_id, then scene participants — each validated against the stable id
 * set (or, if none is supplied, against the registered character map itself) and deduped.
 * Partial name matches never count as a mention.
 */
export function selectActiveCharacterIds({ charactersMap, npcIds, save, playerAction } = {}) {
  const map = object(charactersMap) ? charactersMap : {};
  const validIds = npcIds instanceof Set ? npcIds : new Set(Object.keys(map));
  const text = stringOrEmpty(playerAction);
  const ordered = [];
  const seen = new Set();
  const push = id => {
    if (typeof id !== 'string' || !id.trim() || seen.has(id) || !validIds.has(id)) return;
    seen.add(id);
    ordered.push(id);
  };
  for (const [id, character] of Object.entries(map)) {
    const name = character?.name;
    if (typeof name === 'string' && name && text.includes(name)) push(id);
  }
  const currentSave = object(save) ? save : {};
  push(currentSave.focal_character_id);
  push(currentSave.last_speaker_id);
  const participants = Array.isArray(currentSave.scene_state?.participants) ? currentSave.scene_state.participants : [];
  for (const id of participants) push(id);
  return ordered;
}

/**
 * The first three active ids get their full prompt_card; the rest get identity-only
 * fields. A character not actually active this turn is never included at all.
 */
export function buildActiveCharacterCanon(charactersMap, activeIds) {
  const map = object(charactersMap) ? charactersMap : {};
  const canon = {};
  (Array.isArray(activeIds) ? activeIds : []).forEach((id, index) => {
    const character = map[id];
    if (!object(character)) return;
    const identityFields = {
      character_id: id,
      name: typeof character.name === 'string' ? character.name : null,
      position: typeof character.position === 'string' ? character.position : null,
      role_title: typeof character.role_title === 'string' ? character.role_title : null
    };
    canon[id] = index < 3 ? { ...identityFields, prompt_card: object(character.prompt_card) ? character.prompt_card : null } : identityFields;
  });
  return canon;
}

const ACTIVE_NPC_MAPS = ['npc_stats', 'npc_emotion', 'npc_relationship_state', 'npc_scene_state', 'npc_work_state', 'csa_attitudes'];

/**
 * The compact scene/time/CSA/active-NPC-state core shared by the Story and Extract
 * context projections. Only state for ids in activeIds is included, never the full save.
 */
export function buildSceneContextCore(save, activeIds = []) {
  const s = object(save) ? save : {};
  const scene = object(s.scene_state) ? s.scene_state : {};
  const world = object(s.world_state) ? s.world_state : {};
  const gameTime = object(world.game_time) ? world.game_time : {};
  const activeSet = new Set(Array.isArray(activeIds) ? activeIds : []);
  const activeNpcState = {};
  for (const mapName of ACTIVE_NPC_MAPS) {
    const map = object(s[mapName]) ? s[mapName] : {};
    for (const id of activeSet) {
      if (object(map[id])) {
        activeNpcState[mapName] = activeNpcState[mapName] ?? {};
        activeNpcState[mapName][id] = map[id];
      }
    }
  }
  return {
    turn: { committed_turn: integer(object(s.turn_state) ? s.turn_state.committed_turn : null) ?? 0 },
    time: { day: integer(gameTime.day) ?? 1, minute_of_day: integer(gameTime.minute_of_day) ?? 540 },
    scene: {
      scene_id: identity(scene.scene_id),
      location_id: identity(scene.location_id),
      participants: Array.isArray(scene.participants) ? scene.participants : [],
      focus_thread: identity(scene.focus_thread),
      scene_goal: identity(scene.scene_goal),
      beat: integer(scene.beat)
    },
    global_csa: {
      active_ids: Array.isArray(s.csa_active) ? s.csa_active : [],
      rules: object(s.csa_rules) ? s.csa_rules : {},
      runtime_state: object(s.csa_runtime_state) ? s.csa_runtime_state : {}
    },
    active_npc_state: activeNpcState
  };
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
const CSA_TRIGGER_STATUSES = new Set(['satisfied', 'continuing', 'temporarily_interrupted', 'not_satisfied', 'ended']);
const CSA_RUNTIME_UPDATE_STATUSES = new Set(['inactive', 'active', 'paused', 'ended']);

/**
 * Shape-only normalization for Extract's csa_trigger_evaluations — cross-
 * referencing against the currently-active preset CSA id set happens later,
 * at commit time (buildCsaRuntimeStatePatch), since this function has no
 * access to CSA state. An item with an unknown csa_id or invalid status is
 * dropped with a warning; the rest of the array survives.
 */
function normalizeCsaTriggerEvaluations(value, warnings) {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (const item of value) {
    const csaId = identity(item?.csa_id);
    if (!csaId || !CSA_TRIGGER_STATUSES.has(item?.status)) { warnings.push('invalid_csa_trigger_evaluation'); continue; }
    result.push({ csa_id: csaId, status: item.status });
  }
  return result;
}

/** Shape-only normalization for Extract's csa_runtime_updates — see normalizeCsaTriggerEvaluations. */
function normalizeCsaRuntimeUpdates(value, warnings) {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (const item of value) {
    const csaId = identity(item?.csa_id);
    const characterId = identity(item?.character_id);
    if (!csaId || !characterId || !CSA_RUNTIME_UPDATE_STATUSES.has(item?.status)) { warnings.push('invalid_csa_runtime_update'); continue; }
    result.push({
      csa_id: csaId, character_id: characterId, status: item.status,
      target_type: typeof item?.target_type === 'string' ? item.target_type.slice(0, 40) : null,
      action_state: typeof item?.action_state === 'string' ? item.action_state.slice(0, 60) : null,
      position_label: typeof item?.position_label === 'string' ? item.position_label.trim().slice(0, 100) : null,
      reason: typeof item?.reason === 'string' ? item.reason.trim().slice(0, 100) : null
    });
  }
  return result;
}

const CHOICE_SUGGESTED_ROUTES = new Set(['none', 'csa_direct', 'voluntary', 'blocked']);

/**
 * Shape-only per-choice structured signal (donor's choice_structured_meta), one entry per
 * currently-rendered choice at the same index as last_choices. This is what lets a later
 * turn's direct-coverage resolution cross-validate actor_id/target_id against a real,
 * Extract-classified signal instead of guessing them from the player's free-typed text.
 * An entry naming an out-of-range choice_index, or with an invalid status, is dropped with
 * a warning; entries are never trusted alone — the caller still re-validates actor_id/
 * target_id against the live save at match time.
 */
function normalizeChoiceStructuredMeta(value, choiceCount, warnings) {
  if (!Array.isArray(value)) return [];
  const seenIndexes = new Set();
  const result = [];
  for (const item of value) {
    const choiceIndex = integer(item?.choice_index);
    if (choiceIndex === null || choiceIndex < 0 || choiceIndex >= choiceCount || seenIndexes.has(choiceIndex)) {
      warnings.push('invalid_choice_structured_meta');
      continue;
    }
    seenIndexes.add(choiceIndex);
    const actionTypes = [...new Set((Array.isArray(item?.action_types) ? item.action_types : [])
      .filter(action => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== 'none'))];
    result.push({
      choice_index: choiceIndex,
      action_types: actionTypes,
      actor_id: identity(item?.actor_id),
      target_id: identity(item?.target_id),
      suggested_route: CHOICE_SUGGESTED_ROUTES.has(item?.suggested_route) ? item.suggested_route : 'none',
      direct_csa_ids: [...new Set((Array.isArray(item?.direct_csa_ids) ? item.direct_csa_ids : [])
        .filter(id => typeof id === 'string' && id.trim()))].slice(0, 4)
    });
  }
  return result;
}

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
  const csaTriggerEvaluations = normalizeCsaTriggerEvaluations(value.csa_trigger_evaluations, idWarnings);
  const csaRuntimeUpdates = normalizeCsaRuntimeUpdates(value.csa_runtime_updates, idWarnings);
  const finalChoices = parserHasChoices ? storyChoices : choices(value.choices);
  const choiceStructuredMeta = normalizeChoiceStructuredMeta(value.choice_structured_meta, finalChoices.length, idWarnings);
  const warnings = [...new Set([
    ...(Array.isArray(value.warnings) ? value.warnings.filter(item => typeof item === 'string' && item.trim()) : []),
    ...normalizedMonitor.warnings,
    ...idWarnings,
    ...(parserHasChoices ? ['story_choices_authoritative'] : []),
    ...(parserHasChoices || choices(value.choices).length === 4 ? [] : ['choices_not_exactly_four'])
  ])];
  return {
    state_delta: clone(value.state_delta),
    action_resolution: (typeof value.action_resolution === 'object' && value.action_resolution !== null) ? clone(value.action_resolution) : null,
    outcome: value.outcome,
    evidence: object(value.evidence) ? clone(value.evidence) : {},
    turn_summary: stringOrEmpty(value.turn_summary),
    mind_monitor: mindMonitor,
    legacy_mind_monitor_text: normalizedMonitor.legacy_text,
    choices: finalChoices,
    choice_structured_meta: choiceStructuredMeta,
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
    csa_trigger_evaluations: csaTriggerEvaluations,
    csa_runtime_updates: csaRuntimeUpdates,
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
    choice_structured_meta: [],
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
    csa_trigger_evaluations: [],
    csa_runtime_updates: [],
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

/**
 * Hydrates master-defined characters into gameplay maps.
 * - npc_stats는 필드 단위로 보충한다: 기존 값이 있는 필드는 보존, 없는 필드만 초기 정본값으로 채운다.
 *   (NPC map entry가 존재한다는 이유만으로 전체 주입을 건너뛰지 않는다)
 * - 레거시 affection→affinity 변환: affinity가 없고 affection만 있으면 affinity = affection.
 *   이미 affinity가 있으면 affection으로 덮어쓰지 않는다. 변환 후에는 내부 상태에서 affection을 갱신하지 않는다.
 * - 나머지 map(relationship/emotion/scene_state/csa_attitudes)은 entry 단위 hydration 유지.
 */
export function hydrateGameplayState(save, master = {}) {
  const next = migrateCompanySave(save);
  const characters = Array.isArray(master?.characters) ? master.characters : [];
  for (const character of characters) {
    const id = identity(character?.character_id);
    if (!id) continue;
    for (const { mapName, canonicalKey, aliasKey } of HYDRATION_SOURCES) {
      next[mapName] = object(next[mapName]) ? next[mapName] : {};
      const source = object(character[canonicalKey]) ? character[canonicalKey]
        : (aliasKey && object(character[aliasKey]) ? character[aliasKey] : null);
      if (mapName === 'npc_stats') {
        const entry = object(next[mapName][id]) ? next[mapName][id] : {};
        const canon = object(source) ? source : {};
        // 레거시 affection → affinity 이전 (affinity가 없을 때만). 변환 후에도 affection 필드는
        // 표시 계층 호환용으로 유지한다(갱신은 안 함) — 정본 읽기는 항상 affinity가 우선.
        const legacyAffection = Number.isFinite(entry.affection) ? entry.affection : undefined;
        const hasAffinity = Number.isFinite(entry.affinity);
        if (!hasAffinity && legacyAffection !== undefined) entry.affinity = legacyAffection;
        // 필드 단위 보충 — 기존 값이 있는 필드는 보존
        if (!Number.isFinite(entry.affinity)) {
          if (Number.isFinite(canon.affinity)) entry.affinity = canon.affinity;
          else if (Number.isFinite(canon.affection)) entry.affinity = canon.affection; // 레거시 초기값도 affinity로 정본화
        }
        if (!Number.isFinite(entry.resistance) && Number.isFinite(canon.resistance)) entry.resistance = canon.resistance;
        if (!Number.isFinite(entry.csa_acceptance) && Number.isFinite(canon.csa_acceptance)) entry.csa_acceptance = canon.csa_acceptance;
        if (!Number.isFinite(entry.sexual_arousal)) entry.sexual_arousal = 0;
        next[mapName][id] = entry;
        continue;
      }
      if (id in next[mapName]) continue;
      if (source) next[mapName][id] = clone(source);
    }
  }
  return next;
}
