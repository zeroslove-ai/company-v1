import { GameCoreError } from '../errors.js';
import { normalizeImageSelection } from '../gameplay-state.js';

const OUTCOMES = new Set(['success', 'partial', 'refused', 'interrupted', 'blocked', 'degraded']);
const TOP_LEVEL = new Set([
  'extract_version', 'outcome', 'scene_observation', 'player_observation', 'npc_observations', 'events', 'evidence',
  'elapsed_minutes', 'mind_monitor', 'action_target_id', 'image_character_id', 'image_selection',
  'csa_trigger_evaluations', 'csa_runtime_updates', 'turn_summary', 'warnings'
]);
const NPC_DOMAINS = new Set(['physical', 'stats', 'csa_attitude']);
const PHYSICAL = new Set(['posture', 'position_label', 'clothing']);
const CLOTHING = new Set(['uniform_top', 'uniform_bottom', 'underwear_top', 'underwear_bottom']);
const CLOTHING_STATES = new Set(['worn', 'removed', 'open', 'unknown']);
const SEXUAL = new Set(['arousal_delta', 'ejaculation_progress_delta', 'ejaculation_completed', 'erection_state']);
const ERECTION = new Set(['unknown', 'flaccid', 'partial', 'erect']);
const STAT = new Set(['affinity_delta', 'csa_acceptance_delta', 'sexual_arousal_delta', 'reasons', 'reason']);
const CSA_ATTITUDE = new Set(['familiarity']);
const SEXUAL_EVENT_FIELDS = new Set(['actor_id', 'target_id', 'action_type', 'direction', 'completed', 'interrupted', 'evidence', 'event_id']);
const SEXUAL_ACTION_TYPES = new Set(['kiss', 'sexual_touch', 'genital_exposure', 'genital_touch', 'oral', 'penetration', 'orgasm']);
const TRIGGER = new Set(['satisfied', 'continuing', 'temporarily_interrupted', 'not_satisfied', 'ended']);
const CSA_TRIGGER_FIELDS = new Set(['csa_id', 'status']);
const RUNTIME = new Set(['inactive', 'active', 'paused', 'ended']);
const CSA_RUNTIME_FIELDS = new Set(['csa_id', 'character_id', 'status', 'target_type', 'action_state', 'position_label', 'reason']);
const SCENE_EVIDENCE_FIELDS = new Set(['kind', 'character_id', 'location_id', 'quote']);
const SCENE_EVIDENCE_KINDS = new Set(['presence', 'entrance', 'exit', 'scene']);
const FRESH_OUTCOMES = new Set(['success', 'partial', 'refused', 'interrupted', 'blocked']);
const FRESH_SCENE_FIELDS = new Set(['scene_id', 'location_id', 'final_present_npc_ids', 'entered_npc_ids', 'exited_npc_ids', 'presence_is_final', 'focal_candidate_id', 'remote_speaker_ids', 'evidence']);

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function clone(value) { return value === undefined ? undefined : structuredClone(value); }
function dropOptional(soft, label, warnings, fallback, fn) {
  if (!soft) return fn();
  try { return fn(); } catch (error) {
    warnings.push(`extract_optional_dropped:${label}:${error?.code ?? 'invalid'}`);
    return fallback;
  }
}
function nonEmptyId(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function canonicalPlayerOrNpcId(value) { return /^player(?:[-_].*)?$/i.test(value) ? 'player' : value; }
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
  if ('posture' in value) {
    if (value.posture !== null && typeof value.posture !== 'string') throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'posture must be string or null');
    result.posture = value.posture;
  }
  if ('position_label' in value) {
    if (value.position_label !== null && typeof value.position_label !== 'string') throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'position_label must be string or null');
    result.position_label = value.position_label;
  }
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
  if ('arousal_delta' in result && !Number.isInteger(result.arousal_delta)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'arousal_delta must be an integer');
  if ('ejaculation_progress_delta' in result && (!Number.isInteger(result.ejaculation_progress_delta) || result.ejaculation_progress_delta < 0 || result.ejaculation_progress_delta > 6)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid sexual delta: ejaculation_progress_delta');
  if ('ejaculation_completed' in result && typeof result.ejaculation_completed !== 'boolean') throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'ejaculation_completed must be boolean');
  if ('erection_state' in result && !ERECTION.has(result.erection_state)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid erection_state');
  return result;
}
function normalizeNpcObservation(value) {
  assertKeys(value, NPC_DOMAINS, 'INVALID_EXTRACT_OBSERVATION');
  const result = {};
  if ('physical' in value) result.physical = normalizePhysical(value.physical);
  if ('csa_attitude' in value) {
    assertKeys(value.csa_attitude, CSA_ATTITUDE, 'INVALID_EXTRACT_OBSERVATION');
    if ('familiarity' in value.csa_attitude && !Number.isInteger(value.csa_attitude.familiarity)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'familiarity must be an integer');
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
function stableEventHash(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function stableSerialize(value) {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (object(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
  return JSON.stringify(value ?? null);
}

function normalizeEventEvidence(value, storyText, field) {
  if (typeof value !== 'string' || !value.trim()) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `${field}.evidence must be a non-empty exact quote`);
  const quote = value.trim();
  if (typeof storyText !== 'string' || !storyText.includes(quote)) throw new GameCoreError('EVENT_EVIDENCE_QUOTE_NOT_IN_STORY', `${field}.evidence is not present in Story`);
  return quote;
}

function normalizeEvents(value, npcIds, storyText, expectedTurn = 0, actionId = null) {
  assertKeys(value, new Set(['general', 'sexual']), 'INVALID_EXTRACT_OBSERVATION');
  const normalizeSexual = items => {
    if (!Array.isArray(items)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'events.sexual must be an array');
    return items.map((item, index) => {
      assertKeys(item, SEXUAL_EVENT_FIELDS, 'INVALID_EXTRACT_OBSERVATION');
      const event = clone(item);
      event.actor_id = nullableId(item.actor_id, npcIds, `events.sexual[${index}].actor_id`);
      event.target_id = nullableId(item.target_id, npcIds, `events.sexual[${index}].target_id`);
      if (!event.actor_id || !event.target_id) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'events.sexual actor_id and target_id are required');
      if (canonicalPlayerOrNpcId(event.actor_id) === canonicalPlayerOrNpcId(event.target_id)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'events.sexual actor and target must differ');
      if (!SEXUAL_ACTION_TYPES.has(event.action_type)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'events.sexual action_type is invalid');
      if (typeof event.completed !== 'boolean' || typeof event.interrupted !== 'boolean') throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'events.sexual completed/interrupted must be boolean');
      event.evidence = normalizeEventEvidence(item.evidence, storyText, `events.sexual[${index}]`);
      const identity = {
        turn: expectedTurn,
        action_id: actionId ?? null,
        domain: 'sexual',
        actor_id: canonicalPlayerOrNpcId(event.actor_id),
        target_id: canonicalPlayerOrNpcId(event.target_id),
        action_type: event.action_type,
        direction: event.direction ?? null,
        completed: event.completed,
        interrupted: event.interrupted,
        evidence: event.evidence
      };
      event.event_id = `turn:${expectedTurn}:action:${actionId ?? 'unknown'}:${identity.domain}:${stableEventHash(stableSerialize(identity))}`;
      return event;
    });
  };
  return { general: [], sexual: normalizeSexual(value.sexual ?? []) };
}

function normalizeElapsedMinutes(value, evidence) {
  if (!Number.isInteger(value) || value < 1) return 3;
  const max = object(evidence) && evidence.time_advance === true ? 480 : 30;
  return value <= max ? value : 3;
}

function normalizeSceneEvidence(value, npcIds, storyText, sceneId) {
  if (!Array.isArray(value)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'scene_observation.evidence must be an array');
  const seen = new Set();
  const result = [];
  for (const item of value) {
    assertKeys(item, SCENE_EVIDENCE_FIELDS, 'EXTRACT_AUTHORITY_VIOLATION');
    if (!SCENE_EVIDENCE_KINDS.has(item.kind)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Unknown scene evidence kind');
    const quote = typeof item.quote === 'string' && item.quote.trim() ? item.quote.trim() : null;
    if (!quote) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Scene evidence requires an exact quote');
    if (typeof storyText !== 'string' || !storyText.includes(quote)) throw new GameCoreError('SCENE_EVIDENCE_QUOTE_NOT_IN_STORY', 'Scene evidence quote is not present in Story');
    const characterId = item.character_id === undefined || item.character_id === null ? null : nullableId(item.character_id, npcIds, 'scene_observation.evidence.character_id');
    const locationId = item.location_id === undefined || item.location_id === null ? null : nonEmptyId(item.location_id);
    if (item.location_id !== undefined && item.location_id !== null && !locationId) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Scene evidence location_id must be a string');
    if (['presence', 'entrance', 'exit'].includes(item.kind) && !characterId) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `${item.kind} evidence requires character_id`);
    if (item.kind === 'scene' && (sceneId === null || sceneId === undefined)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'scene evidence requires scene_id');
    const key = JSON.stringify([item.kind, characterId, locationId, quote]);
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ kind: item.kind, character_id: characterId, location_id: locationId, quote });
    }
  }
  return result;
}

export function assertExtractObservationContract(observation) {
  if (!object(observation)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Extract observation must be an object');
  const forbidden = ['state_delta', 'choices', 'dialogue_lines', 'player_inner_thought', 'last_speaker_id', 'npcs_present', 'focal_character_id', 'turn_changes', 'csa_active', 'csa_rules', 'world_state', 'save'];
  const forbiddenField = forbidden.find(field => Object.hasOwn(observation, field));
  if (forbiddenField) throw new GameCoreError('EXTRACT_SAVE_PATCH_FORBIDDEN', `Forbidden Extract field: ${forbiddenField}`);
  if (observation.extract_version !== 2) throw new GameCoreError('EXTRACT_VERSION_UNSUPPORTED', 'extract_version must be 2');
  assertKeys(observation, TOP_LEVEL, 'INVALID_EXTRACT_OBSERVATION');
  if (!OUTCOMES.has(observation.outcome)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid observation outcome');
  return true;
}

export function normalizeExtractObservationV2(value, { npcIds = new Set(), storyText = '', currentScene = null, expectedTurn = 0, actionId = null, softOptional = false, storyBlocks = null, persistedCanonical = false } = {}) {
  assertExtractObservationContract(value);
  const registered = npcIds instanceof Set ? npcIds : new Set(Array.isArray(npcIds) ? npcIds : []);
  const warnings = Array.isArray(value.warnings) ? value.warnings.filter(item => typeof item === 'string') : [];
  if (!object(value.scene_observation)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'scene_observation is required');
  const scene = value.scene_observation;
  assertKeys(scene, new Set(['scene_id', 'location_id', 'final_present_npc_ids', 'entered_npc_ids', 'exited_npc_ids', 'focal_candidate_id', 'remote_speaker_ids', 'evidence', 'presence_is_final']), 'INVALID_EXTRACT_OBSERVATION');
  const final = scene.final_present_npc_ids === null || scene.final_present_npc_ids === undefined ? null : ids(scene.final_present_npc_ids, registered, 'final_present_npc_ids', { allowPlayer: false });
  let entered = ids(scene.entered_npc_ids ?? [], registered, 'entered_npc_ids', { allowPlayer: false });
  let exited = ids(scene.exited_npc_ids ?? [], registered, 'exited_npc_ids', { allowPlayer: false });
  if (entered.some(id => exited.includes(id))) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'entered_npc_ids and exited_npc_ids must not overlap');
  if (Object.hasOwn(scene, 'presence_is_final') && typeof scene.presence_is_final !== 'boolean') throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'presence_is_final must be a boolean when provided for legacy compatibility');
  let sceneId = scene.scene_id === null || scene.scene_id === undefined ? null : (typeof scene.scene_id === 'string' && scene.scene_id.trim() ? scene.scene_id.trim() : null);
  if (scene.scene_id !== null && scene.scene_id !== undefined && !sceneId) {
    if (!softOptional) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'scene_id must be a string or null');
    warnings.push('extract_optional_dropped:scene_observation.scene_id:INVALID_EXTRACT_OBSERVATION');
    sceneId = null;
  }
  const sceneEvidence = softOptional
    ? dropOptional(true, 'scene_observation.evidence', warnings, [], () => normalizeSceneEvidence(scene.evidence ?? [], registered, storyText, sceneId))
    : normalizeSceneEvidence(scene.evidence ?? [], registered, storyText, sceneId);
  const evidenceFor = (kind, id) => sceneEvidence.some(item => item.character_id === id && (item.kind === kind || item.kind === 'presence'));
  for (const id of entered.filter(candidate => !evidenceFor('entrance', candidate))) {
    if (!softOptional) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `Missing exact entrance evidence for ${id}`);
    warnings.push(`extract_optional_dropped:entered_npc_ids:${id}`);
  }
  for (const id of exited.filter(candidate => !evidenceFor('exit', candidate))) {
    if (!softOptional) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `Missing exact exit evidence for ${id}`);
    warnings.push(`extract_optional_dropped:exited_npc_ids:${id}`);
  }
  entered = entered.filter(id => evidenceFor('entrance', id));
  exited = exited.filter(id => evidenceFor('exit', id));
  const locationValid = scene.location_id === null || scene.location_id === undefined || (typeof scene.location_id === 'string' && scene.location_id.trim());
  if (!locationValid && !softOptional) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'location_id must be a string or null');
  const locationId = locationValid ? (scene.location_id === null || scene.location_id === undefined ? null : scene.location_id.trim()) : null;
  const hasPresenceEvidenceFields = Object.hasOwn(scene, 'entered_npc_ids') || Object.hasOwn(scene, 'exited_npc_ids') || Object.hasOwn(scene, 'presence_is_final');
  const normalized = {
    extract_version: 2,
    outcome: value.outcome,
    scene_observation: {
      scene_id: sceneId,
      location_id: locationId,
     final_present_npc_ids: final,
      ...(hasPresenceEvidenceFields ? { entered_npc_ids: entered, exited_npc_ids: exited } : {}),
      focal_candidate_id: dropOptional(softOptional, 'scene_observation.focal_candidate_id', warnings, null, () => nullableId(scene.focal_candidate_id, registered, 'focal_candidate_id')),
      remote_speaker_ids: dropOptional(softOptional, 'scene_observation.remote_speaker_ids', warnings, [], () => ids(scene.remote_speaker_ids ?? [], registered, 'remote_speaker_ids', { allowPlayer: false })),
      evidence: sceneEvidence
    },
    player_observation: {},
    npc_observations: {},
    events: softOptional
      ? dropOptional(true, 'events', warnings, { general: [], sexual: [] }, () => normalizeEvents(object(value.events) ? value.events : { general: [], sexual: [] }, registered, storyText, expectedTurn, actionId))
      : normalizeEvents(object(value.events) ? value.events : { general: [], sexual: [] }, registered, storyText, expectedTurn, actionId),
    evidence: object(value.evidence) ? clone(value.evidence) : {},
    elapsed_minutes: normalizeElapsedMinutes(value.elapsed_minutes, value.evidence),
    mind_monitor: {},
    action_target_id: dropOptional(softOptional, 'action_target_id', warnings, null, () => nullableId(value.action_target_id, registered, 'action_target_id')),
    image_character_id: dropOptional(softOptional, 'image_character_id', warnings, null, () => nullableId(value.image_character_id, registered, 'image_character_id')),
    image_selection: normalizeImageSelection(value.image_selection),
    csa_trigger_evaluations: [], csa_runtime_updates: [],
    turn_summary: typeof value.turn_summary === 'string' ? value.turn_summary : '',
    warnings
  };
  if (value.player_observation !== null && value.player_observation !== undefined) {
    if (!object(value.player_observation)) {
      if (!softOptional) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'player_observation must be an object');
      warnings.push('extract_optional_dropped:player_observation:INVALID_EXTRACT_OBSERVATION');
    } else {
      assertKeys(value.player_observation, new Set(['physical', 'sexual']), 'INVALID_EXTRACT_OBSERVATION');
      normalized.player_observation = {
        physical: dropOptional(softOptional, 'player_observation.physical', warnings, null, () => normalizePhysical(value.player_observation.physical)),
        sexual: dropOptional(softOptional, 'player_observation.sexual', warnings, null, () => normalizeSexual(value.player_observation.sexual))
      };
    }
  }
  if (value.npc_observations !== null && value.npc_observations !== undefined && !object(value.npc_observations)) {
    throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'npc_observations must be an object');
  }
  for (const [npcId, npcObservation] of Object.entries(object(value.npc_observations) ? value.npc_observations : {})) {
    if (registered.size && !registered.has(npcId)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `Unknown NPC observation: ${npcId}`);
    if (softOptional) {
      if (!object(npcObservation)) { warnings.push(`extract_optional_dropped:npc_observations.${npcId}:INVALID_EXTRACT_OBSERVATION`); continue; }
      const domains = {};
      for (const domain of NPC_DOMAINS) if (Object.hasOwn(npcObservation, domain)) {
        domains[domain] = dropOptional(true, `npc_observations.${npcId}.${domain}`, warnings, null, () => normalizeNpcObservation({ [domain]: npcObservation[domain] })[domain]);
      }
      normalized.npc_observations[npcId] = domains;
    } else normalized.npc_observations[npcId] = normalizeNpcObservation(npcObservation);
  }
  if (value.mind_monitor !== null && value.mind_monitor !== undefined) {
    if (!object(value.mind_monitor)) {
      if (!softOptional) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'mind_monitor must be an object');
      warnings.push('extract_optional_dropped:mind_monitor:INVALID_EXTRACT_OBSERVATION');
    }
    for (const [npcId, monitor] of Object.entries(value.mind_monitor)) {
      if (registered.size && !registered.has(npcId)) {
        if (!softOptional) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `Unknown mind monitor NPC: ${npcId}`);
        warnings.push(`extract_optional_dropped:mind_monitor.${npcId}:UNKNOWN_NPC`);
        continue;
      }
      const parsedMonitor = softOptional
        ? dropOptional(true, `mind_monitor.${npcId}`, warnings, null, () => {
            assertKeys(monitor, new Set(['surface', 'subconscious']), 'INVALID_EXTRACT_OBSERVATION');
            if (typeof monitor.surface !== 'string' || typeof monitor.subconscious !== 'string') throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'mind monitor text must be strings');
            return { surface: monitor.surface, subconscious: monitor.subconscious };
          })
        : (() => { assertKeys(monitor, new Set(['surface', 'subconscious']), 'INVALID_EXTRACT_OBSERVATION'); return { surface: typeof monitor.surface === 'string' ? monitor.surface : '', subconscious: typeof monitor.subconscious === 'string' ? monitor.subconscious : '' }; })();
      if (parsedMonitor) normalized.mind_monitor[npcId] = parsedMonitor;
    }
  }
  for (const item of Array.isArray(value.csa_trigger_evaluations) ? value.csa_trigger_evaluations : []) {
    const parsed = softOptional
      ? dropOptional(true, 'csa_trigger_evaluations.item', warnings, null, () => { assertKeys(item, CSA_TRIGGER_FIELDS, 'INVALID_EXTRACT_OBSERVATION'); if (!nonEmptyId(item?.csa_id) || !TRIGGER.has(item?.status)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid CSA trigger observation'); return { csa_id: item.csa_id, status: item.status }; })
      : (() => { assertKeys(item, CSA_TRIGGER_FIELDS, 'INVALID_EXTRACT_OBSERVATION'); if (!nonEmptyId(item?.csa_id) || !TRIGGER.has(item?.status)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid CSA trigger observation'); return { csa_id: item.csa_id, status: item.status }; })();
    if (parsed) normalized.csa_trigger_evaluations.push(parsed);
  }
  for (const item of Array.isArray(value.csa_runtime_updates) ? value.csa_runtime_updates : []) {
    const parsed = softOptional
      ? dropOptional(true, 'csa_runtime_updates.item', warnings, null, () => {
        assertKeys(item, CSA_RUNTIME_FIELDS, 'INVALID_EXTRACT_OBSERVATION');
        const characterId = nullableId(item.character_id, registered, 'csa_runtime_updates.character_id');
        if (!nonEmptyId(item?.csa_id) || !characterId || !RUNTIME.has(item?.status)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid CSA runtime observation');
        return {
          csa_id: item.csa_id, character_id: characterId, status: item.status,
          target_type: typeof item.target_type === 'string' ? item.target_type.slice(0, 40) : null,
          action_state: typeof item.action_state === 'string' ? item.action_state.slice(0, 60) : null,
          position_label: typeof item.position_label === 'string' ? item.position_label.slice(0, 100) : null,
          reason: typeof item.reason === 'string' ? item.reason.slice(0, 100) : null
        };
      })
      : (() => {
        assertKeys(item, CSA_RUNTIME_FIELDS, 'INVALID_EXTRACT_OBSERVATION');
        const characterId = nullableId(item.character_id, registered, 'csa_runtime_updates.character_id');
        if (!nonEmptyId(item?.csa_id) || !characterId || !RUNTIME.has(item?.status)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid CSA runtime observation');
        return {
          csa_id: item.csa_id, character_id: characterId, status: item.status,
          target_type: typeof item.target_type === 'string' ? item.target_type.slice(0, 40) : null,
          action_state: typeof item.action_state === 'string' ? item.action_state.slice(0, 60) : null,
          position_label: typeof item.position_label === 'string' ? item.position_label.slice(0, 100) : null,
          reason: typeof item.reason === 'string' ? item.reason.slice(0, 100) : null
        };
      })();
    if (parsed) normalized.csa_runtime_updates.push(parsed);
  }
  return normalized;
}

function prepareFreshExtractInput(value) {
  const fresh = clone(value);
  const warnings = [];
  if (!object(fresh)) return { value: fresh, warnings };
  const warn = (path, reason = 'REMOVED_OPTIONAL_FIELD') => warnings.push(`extract_optional_dropped:${path}:${reason}`);
  if (Object.hasOwn(fresh, 'relation_updates')) {
    delete fresh.relation_updates;
    warn('relation_updates');
  }
  if (object(fresh.events)) {
    fresh.events = { ...fresh.events };
    for (const key of Object.keys(fresh.events)) {
      if (key !== 'general' && key !== 'sexual') {
        delete fresh.events[key];
        warn(`events.${key}`, 'UNKNOWN_OPTIONAL_FIELD');
      }
    }
    if (Object.hasOwn(fresh.events, 'general')) {
      delete fresh.events.general;
      warn('events.general');
    }
  }
  if (object(fresh.player_observation)) {
    fresh.player_observation = { ...fresh.player_observation };
    for (const key of Object.keys(fresh.player_observation)) {
      if (key !== 'physical' && key !== 'sexual') {
        delete fresh.player_observation[key];
        warn(`player_observation.${key}`, 'UNKNOWN_OPTIONAL_FIELD');
      }
    }
  }
  if (object(fresh.npc_observations)) {
    const npcObservations = fresh.npc_observations;
    fresh.npc_observations = {};
    for (const [npcId, domains] of Object.entries(npcObservations)) {
      const nextDomains = object(domains) ? { ...domains } : domains;
      if (object(nextDomains)) {
        for (const domain of Object.keys(nextDomains)) {
          if (!NPC_DOMAINS.has(domain)) {
            delete nextDomains[domain];
            warn(`npc_observations.${npcId}.${domain}`, 'REMOVED_OR_UNKNOWN_OPTIONAL_FIELD');
          }
        }
      }
      fresh.npc_observations[npcId] = nextDomains;
    }
  }
  return { value: fresh, warnings };
}

/**
 * Fresh LLM boundary.  This deliberately rejects persisted/legacy affordances
 * before delegating to the compatibility V2 normalizer below.  Historical V1
 * and persisted degraded rows are handled by the persisted read boundary, not
 * by a new Extract completion.
 */
export function normalizeFreshExtractObservationV2(value, options = {}) {
  const prepared = prepareFreshExtractInput(value);
  const freshValue = prepared.value;
  assertExtractObservationContract(freshValue);
  if (!FRESH_OUTCOMES.has(freshValue.outcome)) {
    throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Fresh Extract outcome is not allowed');
  }
  if (!object(freshValue.scene_observation)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'scene_observation is required');
  assertKeys(freshValue.scene_observation, FRESH_SCENE_FIELDS, 'INVALID_EXTRACT_OBSERVATION');
  const normalized = normalizeExtractObservationV2(freshValue, { ...options, softOptional: true });
  normalized.warnings.unshift(...prepared.warnings);
  const required = Array.isArray(options.requiredMindMonitorIds)
    ? options.requiredMindMonitorIds.filter(id => typeof id === 'string' && id.trim())
    : [];
  for (const npcId of required) {
    const monitor = normalized.mind_monitor[npcId];
    if (!monitor || !monitor.surface.trim() || !monitor.subconscious.trim()) normalized.warnings.push(`mind_monitor_missing:${npcId}`);
  }
  if (normalized.csa_trigger_evaluations.length || normalized.csa_runtime_updates.length) {
    normalized.warnings.push('fresh_csa_observation_ignored');
  }
  normalized.csa_trigger_evaluations = [];
  normalized.csa_runtime_updates = [];
  return normalized;
}

export function buildDegradedExtractObservation({ extraWarnings = [] } = {}) {
  return normalizeExtractObservationV2({
    extract_version: 2, outcome: 'degraded',
    scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, remote_speaker_ids: [], evidence: [] },
    player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3,
    mind_monitor: {}, action_target_id: null, image_character_id: null, image_selection: null,
    csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '', warnings: ['extract_degraded', ...extraWarnings]
  });
}
