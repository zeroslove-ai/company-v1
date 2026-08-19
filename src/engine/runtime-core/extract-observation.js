import { GameCoreError } from '../errors.js';
const OUTCOMES = new Set(['success', 'partial', 'refused', 'interrupted', 'blocked', 'degraded']);
const TOP_LEVEL = new Set([
  'extract_version', 'outcome', 'scene_observation', 'player_observation', 'npc_observations', 'evidence',
  'elapsed_minutes', 'mind_monitor', 'turn_summary', 'warnings'
]);
const NPC_DOMAINS = new Set(['physical']);
const PHYSICAL = new Set(['position_label', 'clothing']);
const CLOTHING = new Set(['uniform_top', 'uniform_bottom', 'underwear_top', 'underwear_bottom']);
const CLOTHING_STATES = new Set(['worn', 'removed', 'open', 'unknown']);
const SEXUAL = new Set(['erection_state']);
const ERECTION = new Set(['unknown', 'flaccid', 'partial', 'erect']);
const SCENE_EVIDENCE_FIELDS = new Set(['kind', 'character_id', 'location_id', 'quote']);
const SCENE_EVIDENCE_KINDS = new Set(['presence', 'entrance', 'exit', 'scene']);
const FRESH_OUTCOMES = new Set(['success', 'partial', 'refused', 'interrupted', 'blocked']);
const FRESH_SCENE_FIELDS = new Set(['location_id', 'final_present_npc_ids', 'entered_npc_ids', 'exited_npc_ids', 'remote_speaker_ids', 'evidence']);
const FRESH_TOP_LEVEL = new Set(['extract_version', 'outcome', 'scene_observation', 'player_observation', 'npc_observations', 'evidence', 'elapsed_minutes', 'mind_monitor', 'turn_summary', 'warnings']);
const EVIDENCE_FIELDS = new Set(['actors', 'time_advance']);
const ACTOR_EVIDENCE_FIELDS = new Set(['character_id', 'quote', 'changed']);

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function clone(value) { return value === undefined ? undefined : structuredClone(value); }
function dropOptional(soft, label, warnings, fallback, fn) {
  if (!soft) return fn();
  try { return fn(); } catch (error) {
    warnings.push(`extract_optional_dropped:${label}:${error?.code ?? 'invalid'}`);
    return fallback;
  }
}
function normalizeOptional(fn, label, warnings, fallback) {
  try { return fn(); } catch (error) {
    warnings.push(`extract_optional_dropped:${label}:${error?.code ?? 'INVALID_EXTRACT_OBSERVATION'}`);
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
  if ('erection_state' in result && !ERECTION.has(result.erection_state)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid erection_state');
  return result;
}
function normalizeNpcObservation(value) {
  assertKeys(value, NPC_DOMAINS, 'INVALID_EXTRACT_OBSERVATION');
  const result = {};
  if ('physical' in value) result.physical = normalizePhysical(value.physical);
  return result;
}
function normalizeElapsedMinutes(value, evidence) {
  if (!Number.isInteger(value) || value < 1) return 3;
  const max = object(evidence) && evidence.time_advance === true ? 480 : 30;
  return value <= max ? value : 3;
}

function actorChangePath(actorId, path, npcIds) {
  if (typeof path !== 'string' || !path.trim()) return false;
  const id = canonicalPlayerOrNpcId(actorId);
  if (id !== 'player' && npcIds.size && !npcIds.has(id)) return false;
  if (id === 'player') {
    const playerPhysicalPrefix = 'player_scene_state.';
    return (path.startsWith(playerPhysicalPrefix) && (path.slice(playerPhysicalPrefix.length) === 'position_label' || /^clothing\.(uniform_top|uniform_bottom|underwear_top|underwear_bottom)$/.test(path.slice(playerPhysicalPrefix.length))))
      || (path === 'player_sexual_state.erection_state');
  }
  const prefix = `npc_scene_state.${id}.`;
  if (!path.startsWith(prefix)) return false;
  const suffix = path.slice(prefix.length);
  return suffix === 'position_label' || /^clothing\.(uniform_top|uniform_bottom|underwear_top|underwear_bottom)$/.test(suffix);
}

function normalizeActorEvidence(value, npcIds, storyText, { softOptional = false } = {}) {
  const warnings = [];
  const source = object(value) ? value : {};
  const result = {};
  const drop = (label, reason) => warnings.push(`extract_optional_dropped:evidence.${label}:${reason}`);
  if (Object.keys(source).some(key => !EVIDENCE_FIELDS.has(key))) {
    if (!softOptional) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Unknown evidence field');
    for (const key of Object.keys(source).filter(key => !EVIDENCE_FIELDS.has(key))) drop(key, 'UNKNOWN_OPTIONAL_FIELD');
  }
  if (Object.hasOwn(source, 'time_advance')) {
    if (source.time_advance !== true) {
      if (!softOptional) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'evidence.time_advance must be true when provided');
      drop('time_advance', 'INVALID_EXTRACT_OBSERVATION');
    } else result.time_advance = true;
  }
  const actors = object(source.actors) ? source.actors : {};
  if (Object.hasOwn(source, 'actors') && !object(source.actors)) {
    if (!softOptional) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'evidence.actors must be an object');
    drop('actors', 'INVALID_EXTRACT_OBSERVATION');
  }
  for (const [rawId, rawEntry] of Object.entries(actors)) {
    const actorId = canonicalPlayerOrNpcId(rawId);
    try {
      if (actorId !== 'player' && npcIds.size && !npcIds.has(actorId)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'unknown actor');
      assertKeys(rawEntry, ACTOR_EVIDENCE_FIELDS, 'INVALID_EXTRACT_OBSERVATION');
      if (canonicalPlayerOrNpcId(rawEntry.character_id) !== actorId) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'actor evidence identity mismatch');
      const quote = typeof rawEntry.quote === 'string' && rawEntry.quote.trim() ? rawEntry.quote.trim() : null;
      if (!quote || typeof storyText !== 'string' || !storyText.includes(quote)) throw new GameCoreError('ACTOR_EVIDENCE_QUOTE_NOT_IN_STORY', 'actor evidence quote is not present in Story');
      if (!Array.isArray(rawEntry.changed) || !rawEntry.changed.length || rawEntry.changed.some(path => !actorChangePath(actorId, path, npcIds))) {
        throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'actor evidence contains an unsupported changed path');
      }
      result.actors ??= {};
      result.actors[actorId] = { character_id: actorId, quote, changed: [...new Set(rawEntry.changed)] };
    } catch (error) {
      if (!softOptional) throw error;
      drop(rawId, error?.code ?? 'INVALID_EXTRACT_OBSERVATION');
    }
  }
  return { value: result, warnings };
}

function normalizeSceneEvidence(value, npcIds, storyText, { sceneId = null, sceneLocationId = null, currentVocabulary = false } = {}) {
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
    if (item.kind === 'scene') {
      if (currentVocabulary) {
        if (!sceneLocationId || locationId !== sceneLocationId) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'current scene evidence requires matching location_id');
      } else if (sceneId === null || sceneId === undefined) {
        throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'scene evidence requires scene_id');
      }
    }
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
  const sceneEvidenceOptions = persistedCanonical
    ? { sceneLocationId: scene.location_id === null || scene.location_id === undefined ? null : nonEmptyId(scene.location_id), currentVocabulary: true }
    : { sceneId };
  const sceneEvidence = softOptional
    ? dropOptional(true, 'scene_observation.evidence', warnings, [], () => normalizeSceneEvidence(scene.evidence ?? [], registered, storyText, sceneEvidenceOptions))
    : normalizeSceneEvidence(scene.evidence ?? [], registered, storyText, sceneEvidenceOptions);
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
  const normalizedEvidence = normalizeActorEvidence(value.evidence, registered, storyText, { softOptional });
  warnings.push(...normalizedEvidence.warnings);
  const normalized = {
    extract_version: 2,
    outcome: value.outcome,
    scene_observation: {
      ...(persistedCanonical ? {} : { scene_id: sceneId }),
      location_id: locationId,
     final_present_npc_ids: final,
      ...(hasPresenceEvidenceFields ? { entered_npc_ids: entered, exited_npc_ids: exited } : {}),
      focal_candidate_id: dropOptional(softOptional, 'scene_observation.focal_candidate_id', warnings, null, () => nullableId(scene.focal_candidate_id, registered, 'focal_candidate_id')),
      remote_speaker_ids: dropOptional(softOptional, 'scene_observation.remote_speaker_ids', warnings, [], () => ids(scene.remote_speaker_ids ?? [], registered, 'remote_speaker_ids', { allowPlayer: false })),
      evidence: sceneEvidence
    },
    player_observation: {},
    npc_observations: {},
    evidence: normalizedEvidence.value,
    elapsed_minutes: normalizeElapsedMinutes(value.elapsed_minutes, value.evidence),
    mind_monitor: {},
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
  return normalized;
}

/** Fresh provider vocabulary: narrow observation only; it never enters the legacy normalizer. */
export function normalizeFreshExtractObservationV2(value, options = {}) {
  if (!object(value)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Fresh Extract observation must be an object');
  assertKeys(value, FRESH_TOP_LEVEL, 'INVALID_EXTRACT_OBSERVATION');
  if (value.extract_version !== 2 || !FRESH_OUTCOMES.has(value.outcome)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'Invalid fresh Extract contract');
  const registered = options.npcIds instanceof Set ? options.npcIds : new Set(Array.isArray(options.npcIds) ? options.npcIds : []);
  const scene = object(value.scene_observation) ? value.scene_observation : {};
  assertKeys(scene, FRESH_SCENE_FIELDS, 'INVALID_EXTRACT_OBSERVATION');
  const warnings = Array.isArray(value.warnings) ? value.warnings.filter(item => typeof item === 'string') : [];
  const locationId = scene.location_id === null || scene.location_id === undefined
    ? null
    : normalizeOptional(() => {
        const id = nonEmptyId(scene.location_id);
        if (!id) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', 'location_id must be a string or null');
        return id;
      }, 'scene_observation.location_id', warnings, null);
  const finalIds = scene.final_present_npc_ids === null || scene.final_present_npc_ids === undefined
    ? null
    : normalizeOptional(() => ids(scene.final_present_npc_ids, registered, 'final_present_npc_ids', { allowPlayer: false }), 'scene_observation.final_present_npc_ids', warnings, null);
  let entered = normalizeOptional(() => ids(scene.entered_npc_ids ?? [], registered, 'entered_npc_ids', { allowPlayer: false }), 'scene_observation.entered_npc_ids', warnings, []);
  let exited = normalizeOptional(() => ids(scene.exited_npc_ids ?? [], registered, 'exited_npc_ids', { allowPlayer: false }), 'scene_observation.exited_npc_ids', warnings, []);
  const evidence = normalizeOptional(
    () => normalizeSceneEvidence(scene.evidence ?? [], registered, options.storyText ?? '', { sceneLocationId: locationId, currentVocabulary: true }),
    'scene_observation.evidence', warnings, []
  );
  const hasEvidence = (kind, id) => evidence.some(item => item?.character_id === id && item?.kind === kind);
  entered = entered.filter(id => hasEvidence('entrance', id));
  exited = exited.filter(id => hasEvidence('exit', id));
  const player = object(value.player_observation)
    ? normalizeOptional(() => {
        assertKeys(value.player_observation, new Set(['physical', 'sexual']), 'INVALID_EXTRACT_OBSERVATION');
        return value.player_observation;
      }, 'player_observation', warnings, {})
    : {};
  const npcObservations = {};
  for (const [id, domains] of Object.entries(object(value.npc_observations) ? value.npc_observations : {})) {
    if (registered.size && !registered.has(id)) throw new GameCoreError('INVALID_EXTRACT_OBSERVATION', `Unknown NPC observation: ${id}`);
    const validDomains = normalizeOptional(() => {
      assertKeys(domains, new Set(['physical']), 'INVALID_EXTRACT_OBSERVATION');
      return domains;
    }, `npc_observations.${id}`, warnings, null);
    if (!validDomains) continue;
    npcObservations[id] = { physical: normalizeOptional(() => normalizePhysical(validDomains.physical), `npc_observations.${id}.physical`, warnings, null) };
  }
  const monitor = {};
  for (const [id, entry] of Object.entries(object(value.mind_monitor) ? value.mind_monitor : {})) {
    if (registered.size && !registered.has(id)) continue;
    if (!object(entry) || typeof entry.surface !== 'string' || typeof entry.subconscious !== 'string') continue;
    monitor[id] = { surface: entry.surface, subconscious: entry.subconscious };
  }
  const requiredMindMonitorIds = Array.isArray(options.requiredMindMonitorIds)
    ? options.requiredMindMonitorIds.filter(id => typeof id === 'string' && id.trim())
    : [];
  for (const npcId of requiredMindMonitorIds) {
    const entry = monitor[npcId];
    if (!entry || !entry.surface.trim() || !entry.subconscious.trim()) warnings.push(`mind_monitor_missing:${npcId}`);
  }
  if (value.outcome !== 'degraded' && typeof options.storyText === 'string' && options.storyText.trim() && typeof value.turn_summary === 'string' && !value.turn_summary.trim()) {
    warnings.push('turn_summary_missing_for_nonempty_story');
  }
  const actorEvidence = normalizeActorEvidence(value.evidence, registered, options.storyText ?? '', { softOptional: true });
  warnings.push(...actorEvidence.warnings);
  return {
    extract_version: 2,
    outcome: value.outcome,
    scene_observation: {
      location_id: locationId,
      final_present_npc_ids: finalIds,
      entered_npc_ids: entered,
      exited_npc_ids: exited,
      remote_speaker_ids: normalizeOptional(() => ids(scene.remote_speaker_ids ?? [], registered, 'remote_speaker_ids', { allowPlayer: false }), 'scene_observation.remote_speaker_ids', warnings, []),
      evidence
    },
    player_observation: {
      physical: normalizeOptional(() => normalizePhysical(player.physical), 'player_observation.physical', warnings, null),
      sexual: normalizeOptional(() => normalizeSexual(player.sexual), 'player_observation.sexual', warnings, null)
    },
    npc_observations: npcObservations,
    evidence: actorEvidence.value,
    elapsed_minutes: normalizeElapsedMinutes(value.elapsed_minutes, value.evidence),
    mind_monitor: monitor,
    turn_summary: typeof value.turn_summary === 'string' ? value.turn_summary : '',
    warnings: [...new Set(warnings)]
  };
}

export function buildDegradedExtractObservation({ extraWarnings = [] } = {}) {
  return {
    extract_version: 2, outcome: 'degraded',
    scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], presence_is_final: false, focal_candidate_id: null, remote_speaker_ids: [], evidence: [] },
    player_observation: { physical: null, sexual: null }, npc_observations: {}, evidence: {}, elapsed_minutes: 3,
    mind_monitor: {}, turn_summary: '', warnings: ['extract_degraded', ...extraWarnings]
  };
}
