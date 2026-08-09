import { GameCoreError } from '../errors.js';
import { normalizeImageSelection } from '../gameplay-state.js';

const OUTCOMES = new Set(['success', 'partial', 'refused', 'interrupted', 'blocked', 'degraded']);
const TOP_LEVEL = new Set([
  'extract_version', 'outcome', 'scene_observation', 'player_observation', 'npc_observations', 'events', 'evidence',
  'elapsed_minutes', 'mind_monitor', 'action_target_id', 'image_character_id', 'image_selection',
  'csa_trigger_evaluations', 'csa_runtime_updates', 'turn_summary', 'warnings'
]);
const NPC_DOMAINS = new Set(['physical', 'emotion', 'relationship', 'stats', 'work', 'csa_attitude']);
const PHYSICAL = new Set(['posture', 'position_label', 'clothing']);
const CLOTHING = new Set(['uniform_top', 'uniform_bottom', 'underwear_top', 'underwear_bottom']);
const CLOTHING_STATES = new Set(['worn', 'removed', 'open', 'unknown']);
const SEXUAL = new Set(['arousal_delta', 'ejaculation_progress_delta', 'ejaculation_completed', 'erection_state']);
const ERECTION = new Set(['unknown', 'flaccid', 'partial', 'erect']);
const STAT = new Set(['affinity_delta', 'csa_acceptance_delta', 'sexual_arousal_delta', 'reasons', 'reason']);
const EMOTION = new Set(['mood']);
const RELATIONSHIP = new Set(['closeness', 'romance_status', 'current_boundary', 'milestones']);
const MILESTONES = new Set(['first_kiss_turn', 'sexual_relationship_started_turn']);
const WORK = new Set(['task']);
const CSA_ATTITUDE = new Set(['familiarity', 'resistance', 'last_changed_turn']);
const EVENT = new Set(['actor_id', 'target_id', 'action_type', 'direction', 'completed', 'interrupted', 'evidence', 'event_id', 'type']);
const ACTION_TYPES = new Set(['kiss', 'sexual_touch', 'genital_exposure', 'genital_touch', 'oral', 'penetration', 'orgasm', 'work_event', 'movement', 'conversation', 'other']);
const TRIGGER = new Set(['satisfied', 'continuing', 'temporarily_interrupted', 'not_satisfied', 'ended']);
const CSA_TRIGGER_FIELDS = new Set(['csa_id', 'status']);
const RUNTIME = new Set(['inactive', 'active', 'paused', 'ended']);
const CSA_RUNTIME_FIELDS = new Set(['csa_id', 'character_id', 'status', 'target_type', 'action_state', 'position_label', 'reason']);

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function clone(value) { return value === undefined ? undefined : structuredClone(value); }
function nonEmptyId(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function assertKeys(value, allowed, code) {
  if (!object(value)) throw new GameCoreError(code, `${code} must be an object`);
  const unknown = Object.keys(value).filter(key => !allowed.has(key));
  if (unknown.length) throw new GameCoreError(code, `Unknown observation field: ${unknown[0]}`);
}
function ids(value, npcIds, field, { allowPlayer = true } = {}) {
  if (!Array.isArray(value)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `${field} must be an array`);
  const result = [];
  for (const raw of value) {
    const id = nonEmptyId(raw);
    if (!id || (!allowPlayer && /^player(?:[-_].*)?$/i.test(id)) || (npcIds.size && !npcIds.has(id) && !/^player(?:[-_].*)?$/i.test(id))) {
      throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `Unknown id in ${field}`);
    }
    if (!result.includes(id)) result.push(id);
  }
  return result;
}
function nullableId(value, npcIds, field) {
  if (value === null || value === undefined) return null;
  const id = nonEmptyId(value);
  if (!id || (npcIds.size && !npcIds.has(id) && !/^player(?:[-_].*)?$/i.test(id))) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `Unknown id in ${field}`);
  return id;
}
function normalizePhysical(value) {
  if (value === null || value === undefined) return null;
  assertKeys(value, PHYSICAL, 'INVALID_EXTRACT_OBSERVATION');
  const result = {};
  if ('posture' in value) result.posture = value.posture === null ? null : String(value.posture);
  if ('position_label' in value) result.position_label = value.position_label === null ? null : String(value.position_label);
  if ('clothing' in value) {
    assertKeys(value.clothing, CLOTHING, 'INVALID_EXTRACT_OBSERVATION');
    result.clothing = {};
    for (const slot of CLOTHING) if (slot in value.clothing) {
      if (!CLOTHING_STATES.has(value.clothing[slot])) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `Invalid clothing state: ${slot}`);
      result.clothing[slot] = value.clothing[slot];
    }
  }
  return result;
}
function normalizeSexual(value) {
  if (value === null || value === undefined) return null;
  assertKeys(value, SEXUAL, 'INVALID_EXTRACT_OBSERVATION');
  const result = clone(value);
  if ('arousal_delta' in result && (!Number.isInteger(result.arousal_delta) || result.arousal_delta < -100 || result.arousal_delta > 100)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid sexual delta: arousal_delta');
  if ('ejaculation_progress_delta' in result && (!Number.isInteger(result.ejaculation_progress_delta) || result.ejaculation_progress_delta < 0 || result.ejaculation_progress_delta > 6)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid sexual delta: ejaculation_progress_delta');
  if ('ejaculation_completed' in result && typeof result.ejaculation_completed !== 'boolean') throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'ejaculation_completed must be boolean');
  if ('erection_state' in result && !ERECTION.has(result.erection_state)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid erection_state');
  return result;
}
function normalizeNpcObservation(value) {
  assertKeys(value, NPC_DOMAINS, 'INVALID_EXTRACT_OBSERVATION');
  const result = {};
  if ('physical' in value) result.physical = normalizePhysical(value.physical);
  if ('emotion' in value) {
    assertKeys(value.emotion, EMOTION, 'INVALID_EXTRACT_OBSERVATION');
    result.emotion = clone(value.emotion);
  }
  if ('relationship' in value) {
    assertKeys(value.relationship, RELATIONSHIP, 'INVALID_EXTRACT_OBSERVATION');
    result.relationship = clone(value.relationship);
    if (result.relationship.milestones !== undefined) {
      assertKeys(result.relationship.milestones, MILESTONES, 'INVALID_EXTRACT_OBSERVATION');
    }
  }
  if ('work' in value) {
    assertKeys(value.work, WORK, 'INVALID_EXTRACT_OBSERVATION');
    result.work = clone(value.work);
  }
  if ('csa_attitude' in value) {
    assertKeys(value.csa_attitude, CSA_ATTITUDE, 'INVALID_EXTRACT_OBSERVATION');
    result.csa_attitude = clone(value.csa_attitude);
  }
  if ('stats' in value) {
    assertKeys(value.stats, STAT, 'INVALID_EXTRACT_OBSERVATION');
    for (const [key, range] of [['affinity_delta', [-5, 5]], ['csa_acceptance_delta', [-20, 30]], ['sexual_arousal_delta', [-20, 15]]]) {
      if (key in value.stats && (!Number.isInteger(value.stats[key]) || value.stats[key] < range[0] || value.stats[key] > range[1])) {
        throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `Invalid stat delta: ${key}`);
      }
    }
    result.stats = clone(value.stats);
  }
  return result;
}
function normalizeEvents(value, npcIds) {
  assertKeys(value, new Set(['general', 'sexual']), 'INVALID_EXTRACT_OBSERVATION');
  const normalize = (items, field) => {
    if (!Array.isArray(items)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `${field} must be an array`);
    return items.map(item => {
      assertKeys(item, EVENT, 'INVALID_EXTRACT_OBSERVATION');
      const event = clone(item);
      event.actor_id = nullableId(item.actor_id, npcIds, `${field}.actor_id`);
      event.target_id = nullableId(item.target_id, npcIds, `${field}.target_id`);
      if (event.actor_id && event.target_id && event.actor_id === event.target_id) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `${field} actor and target must differ`);
      if (event.action_type !== undefined && !ACTION_TYPES.has(event.action_type)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `${field} action_type is invalid`);
      if (event.evidence !== undefined && typeof event.evidence !== 'string') throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `${field}.evidence must be text`);
      return event;
    });
  };
  return { general: normalize(value.general ?? [], 'events.general'), sexual: normalize(value.sexual ?? [], 'events.sexual') };
}

function normalizeElapsedMinutes(value, evidence) {
  if (!Number.isInteger(value) || value < 1) return 3;
  const max = object(evidence) && evidence.time_advance === true ? 480 : 30;
  return value <= max ? value : 3;
}

export function assertExtractObservationContract(observation) {
  if (!object(observation)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Extract observation must be an object');
  assertKeys(observation, TOP_LEVEL, 'INVALID_EXTRACT_OBSERVATION');
  if (observation.extract_version !== 2) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'extract_version must be 2');
  if (!OUTCOMES.has(observation.outcome)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid observation outcome');
  return true;
}

export function normalizeExtractObservationV2(value, { npcIds = new Set() } = {}) {
  assertExtractObservationContract(value);
  const registered = npcIds instanceof Set ? npcIds : new Set(Array.isArray(npcIds) ? npcIds : []);
  if (!object(value.scene_observation)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'scene_observation is required');
  const scene = value.scene_observation;
  assertKeys(scene, new Set(['scene_id', 'location_id', 'final_present_npc_ids', 'entered_npc_ids', 'exited_npc_ids', 'focal_candidate_id', 'presence_is_final', 'remote_speaker_ids', 'evidence']), 'INVALID_EXTRACT_OBSERVATION');
  const final = scene.final_present_npc_ids === null || scene.final_present_npc_ids === undefined ? null : ids(scene.final_present_npc_ids, registered, 'final_present_npc_ids', { allowPlayer: false });
  const finalFlag = scene.presence_is_final === true;
  if (finalFlag !== (final !== null)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'presence_is_final and final_present_npc_ids disagree');
  const normalized = {
    extract_version: 2,
    outcome: value.outcome,
    scene_observation: {
      scene_id: scene.scene_id === null || scene.scene_id === undefined ? null : String(scene.scene_id),
      location_id: scene.location_id === null || scene.location_id === undefined ? null : String(scene.location_id),
      final_present_npc_ids: final,
      entered_npc_ids: ids(scene.entered_npc_ids ?? [], registered, 'entered_npc_ids', { allowPlayer: false }),
      exited_npc_ids: ids(scene.exited_npc_ids ?? [], registered, 'exited_npc_ids', { allowPlayer: false }),
      focal_candidate_id: nullableId(scene.focal_candidate_id, registered, 'focal_candidate_id'),
      presence_is_final: finalFlag,
      remote_speaker_ids: ids(scene.remote_speaker_ids ?? [], registered, 'remote_speaker_ids', { allowPlayer: false }),
      evidence: Array.isArray(scene.evidence) ? clone(scene.evidence) : []
    },
    player_observation: {},
    npc_observations: {},
    events: normalizeEvents(object(value.events) ? value.events : { general: [], sexual: [] }, registered),
    evidence: object(value.evidence) ? clone(value.evidence) : {},
    elapsed_minutes: normalizeElapsedMinutes(value.elapsed_minutes, value.evidence),
    mind_monitor: {},
    action_target_id: nullableId(value.action_target_id, registered, 'action_target_id'),
    image_character_id: nullableId(value.image_character_id, registered, 'image_character_id'),
    image_selection: normalizeImageSelection(value.image_selection),
    csa_trigger_evaluations: [], csa_runtime_updates: [],
    turn_summary: typeof value.turn_summary === 'string' ? value.turn_summary : '',
    warnings: Array.isArray(value.warnings) ? value.warnings.filter(item => typeof item === 'string') : []
  };
  if (value.player_observation !== null && value.player_observation !== undefined) {
    assertKeys(value.player_observation, new Set(['physical', 'sexual']), 'INVALID_EXTRACT_OBSERVATION');
    normalized.player_observation = {
      physical: normalizePhysical(value.player_observation.physical),
      sexual: normalizeSexual(value.player_observation.sexual)
    };
  }
  if (value.npc_observations !== null && value.npc_observations !== undefined && !object(value.npc_observations)) {
    throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'npc_observations must be an object');
  }
  for (const [npcId, npcObservation] of Object.entries(object(value.npc_observations) ? value.npc_observations : {})) {
    if (registered.size && !registered.has(npcId)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `Unknown NPC observation: ${npcId}`);
    normalized.npc_observations[npcId] = normalizeNpcObservation(npcObservation);
  }
  if (value.mind_monitor !== null && value.mind_monitor !== undefined) {
    if (!object(value.mind_monitor)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'mind_monitor must be an object');
    for (const [npcId, monitor] of Object.entries(value.mind_monitor)) {
      if (registered.size && !registered.has(npcId)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `Unknown mind monitor NPC: ${npcId}`);
      assertKeys(monitor, new Set(['surface', 'subconscious']), 'INVALID_EXTRACT_OBSERVATION');
      normalized.mind_monitor[npcId] = { surface: typeof monitor.surface === 'string' ? monitor.surface : '', subconscious: typeof monitor.subconscious === 'string' ? monitor.subconscious : '' };
    }
  }
  for (const item of Array.isArray(value.csa_trigger_evaluations) ? value.csa_trigger_evaluations : []) {
    assertKeys(item, CSA_TRIGGER_FIELDS, 'INVALID_EXTRACT_OBSERVATION');
    if (!nonEmptyId(item?.csa_id) || !TRIGGER.has(item?.status)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid CSA trigger observation');
    normalized.csa_trigger_evaluations.push({ csa_id: item.csa_id, status: item.status });
  }
  for (const item of Array.isArray(value.csa_runtime_updates) ? value.csa_runtime_updates : []) {
    assertKeys(item, CSA_RUNTIME_FIELDS, 'INVALID_EXTRACT_OBSERVATION');
    if (!nonEmptyId(item?.csa_id) || !nonEmptyId(item?.character_id) || !RUNTIME.has(item?.status)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid CSA runtime observation');
    normalized.csa_runtime_updates.push({
      csa_id: item.csa_id, character_id: item.character_id, status: item.status,
      target_type: typeof item.target_type === 'string' ? item.target_type.slice(0, 40) : null,
      action_state: typeof item.action_state === 'string' ? item.action_state.slice(0, 60) : null,
      position_label: typeof item.position_label === 'string' ? item.position_label.slice(0, 100) : null,
      reason: typeof item.reason === 'string' ? item.reason.slice(0, 100) : null
    });
  }
  return normalized;
}

export function buildDegradedExtractObservation({ extraWarnings = [] } = {}) {
  return normalizeExtractObservationV2({
    extract_version: 2, outcome: 'degraded',
    scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null, presence_is_final: false, remote_speaker_ids: [], evidence: [] },
    player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3,
    mind_monitor: {}, action_target_id: null, image_character_id: null, image_selection: null,
    csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '', warnings: ['extract_degraded', ...extraWarnings]
  });
}
