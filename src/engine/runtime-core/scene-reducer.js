import { GameCoreError } from '../errors.js';

const PLAYER_RE = /^player(?:[-_].*)?$/i;
const REQUIRED_CANONICAL_SCENE_KEYS = [
  'version', 'scene_id', 'location_id', 'beat', 'goal', 'focus_thread',
  'present_npc_ids', 'focal_character_id', 'last_speaker_id', 'updated_turn'
];

function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function stringId(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isPlayerId(value, playerId = 'player-1') {
  const id = stringId(value);
  return Boolean(id && (id === playerId || id === 'player' || PLAYER_RE.test(id)));
}

function uniqueNpcIds(value, npcIds) {
  const seen = new Set();
  const result = [];
  for (const candidate of Array.isArray(value) ? value : []) {
    const id = stringId(candidate);
    if (!id || isPlayerId(id) || seen.has(id)) continue;
    if (npcIds instanceof Set && npcIds.size > 0 && !npcIds.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

function registeredNpcIds(options = {}) {
  const ids = new Set(options.npcIds instanceof Set
    ? [...options.npcIds].map(stringId).filter(Boolean)
    : Array.isArray(options.npcIds) ? options.npcIds.map(stringId).filter(Boolean) : []);
  for (const list of [options.master?.characters, options.master?.general_npcs]) {
    for (const item of Array.isArray(list) ? list : []) {
      const id = stringId(item?.character_id ?? item?.npc_id ?? item?.id);
      if (id) ids.add(id);
    }
  }
  return ids;
}

function playerIdOf(save, options = {}) {
  return stringId(options.playerId)
    ?? stringId(save?.player?.player_id)
    ?? stringId(save?.player?.id)
    ?? 'player-1';
}

function validInteger(value, fallback) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function locationIds(options = {}) {
  if (options.mapLocations instanceof Set) return options.mapLocations;
  const list = Array.isArray(options.mapLocations) ? options.mapLocations : [];
  return new Set(list.map(item => stringId(item?.location_id ?? item?.id ?? item)).filter(Boolean));
}

function legacyNpcPresence(save, npcIds, playerId) {
  const sceneState = plain(save?.scene_state) ? save.scene_state : {};
  if (Array.isArray(sceneState.participants)) {
    return uniqueNpcIds(sceneState.participants, npcIds);
  }
  if (Array.isArray(save?.last_npcs_present)) {
    return uniqueNpcIds(save.last_npcs_present, npcIds);
  }
  const result = [];
  for (const id of npcIds) {
    if (save?.npc_scene_state?.[id]?.present === true) result.push(id);
  }
  return result;
}

function validateCanonicalScene(source, options = {}) {
  const current = source.scene;
  const npcIds = registeredNpcIds(options);
  const playerId = playerIdOf(source, options);
  if (!plain(current) || current.version !== 1) {
    throw new GameCoreError('CANONICAL_SCENE_INVALID', 'Canonical scene version is invalid');
  }
  for (const key of REQUIRED_CANONICAL_SCENE_KEYS) {
    if (!Object.hasOwn(current, key)) {
      throw new GameCoreError('CANONICAL_SCENE_INVALID', `Canonical scene is missing key: ${key}`);
    }
  }
  if (!Array.isArray(current.present_npc_ids)) {
    throw new GameCoreError('CANONICAL_SCENE_INVALID', 'Canonical present_npc_ids must be an array');
  }
  const rawPresent = current.present_npc_ids.map(stringId);
  if (rawPresent.some(value => !value) || new Set(rawPresent).size !== rawPresent.length
    || rawPresent.some(value => isPlayerId(value, playerId) || (npcIds.size && !npcIds.has(value)))) {
    throw new GameCoreError('CANONICAL_SCENE_INVALID', 'Canonical present_npc_ids contains invalid values');
  }
  const locationId = stringId(current.location_id);
  const locations = locationIds(options);
  if (locationId && locations.size && !locations.has(locationId)) {
    throw new GameCoreError('CANONICAL_SCENE_INVALID', `Canonical location is not registered: ${locationId}`);
  }
  if (current.scene_id !== null && stringId(current.scene_id) === null) {
    throw new GameCoreError('CANONICAL_SCENE_INVALID', 'Canonical scene_id is invalid');
  }
  if (current.goal !== null && stringId(current.goal) === null) {
    throw new GameCoreError('CANONICAL_SCENE_INVALID', 'Canonical goal is invalid');
  }
  if (current.focus_thread !== null && stringId(current.focus_thread) === null) {
    throw new GameCoreError('CANONICAL_SCENE_INVALID', 'Canonical focus_thread is invalid');
  }
  if (current.focal_character_id !== null && stringId(current.focal_character_id) === null) {
    throw new GameCoreError('CANONICAL_SCENE_INVALID', 'Canonical focal_character_id is invalid');
  }
  if (current.focal_character_id !== null && !rawPresent.includes(current.focal_character_id)) {
    throw new GameCoreError('CANONICAL_SCENE_INVALID', 'Canonical focal_character_id must be present');
  }
  if (current.last_speaker_id !== null && stringId(current.last_speaker_id) === null) {
    throw new GameCoreError('CANONICAL_SCENE_INVALID', 'Canonical last_speaker_id is invalid');
  }
  if (current.last_speaker_id !== null && !isPlayerId(current.last_speaker_id, playerId)
    && (npcIds.size && !npcIds.has(current.last_speaker_id))) {
    throw new GameCoreError('CANONICAL_SCENE_INVALID', 'Canonical last_speaker_id is unknown');
  }
  if (!Number.isInteger(current.beat) || current.beat < 0 || !Number.isInteger(current.updated_turn) || current.updated_turn < 0) {
    throw new GameCoreError('CANONICAL_SCENE_INVALID', 'Canonical beat and updated_turn must be non-negative integers');
  }
  return {
    version: 1,
    scene_id: current.scene_id ?? null,
    location_id: locationId,
    beat: current.beat,
    goal: current.goal ?? null,
    focus_thread: current.focus_thread ?? null,
    present_npc_ids: [...rawPresent],
    focal_character_id: current.focal_character_id ?? null,
    last_speaker_id: current.last_speaker_id ?? null,
    updated_turn: current.updated_turn
  };
}

/** Strict canonical reader. It never falls back to legacy fields. */
export function readCanonicalSceneV1(save, options = {}) {
  const source = plain(save) ? save : {};
  if (!plain(source.scene)) throw new GameCoreError('CANONICAL_SCENE_MISSING', 'Canonical scene v1 is required');
  return validateCanonicalScene(source, options);
}

/** One compatibility boundary for old saves that predate save.scene v1. */
export function hydrateLegacySceneV1(save, options = {}) {
  const source = plain(save) ? save : {};
  if (plain(source.scene)) return readCanonicalSceneV1(source, options);
  const npcIds = registeredNpcIds(options);
  const playerId = playerIdOf(source, options);
  const present = uniqueNpcIds(legacyNpcPresence(source, npcIds, playerId), npcIds);
  const focal = stringId(source.focal_character_id);
  return {
    version: 1,
    scene_id: stringId(source.scene_state?.scene_id),
    location_id: stringId(source.scene_state?.location_id),
    beat: validInteger(source.scene_state?.beat, 0),
    goal: source.scene_state?.scene_goal ?? null,
    focus_thread: source.scene_state?.focus_thread ?? null,
    present_npc_ids: present,
    focal_character_id: focal && present.includes(focal) ? focal : null,
    last_speaker_id: stringId(source.last_speaker_id),
    updated_turn: validInteger(source.scene_state?.updated_turn, 0)
  };
}

/** Reduce one observation into the canonical scene. No legacy save fields are written here. */
export function reduceCanonicalScene(input = {}) {
  const current = clone(input.currentScene ?? readCanonicalSceneV1(input.save, input));
  const observation = input.observation ?? {};
  const npcIds = registeredNpcIds(input);
  const locations = locationIds(input);
  const next = { ...current, present_npc_ids: [...current.present_npc_ids] };
  const feedbackRevision = input.actionKind === 'feedback_revision';
  if (feedbackRevision) return next;
  const authoritativeLocationId = stringId(input.authoritativeLocationId);
  const observedLocation = authoritativeLocationId ?? observation.location_id ?? null;
  if (observedLocation !== null && locations.size && !locations.has(observedLocation)) {
    throw new GameCoreError('SCENE_LOCATION_UNKNOWN', `Unknown scene location: ${observedLocation}`);
  }
  const moved = observedLocation !== null && observedLocation !== current.location_id;
  const degraded = observation.outcome === 'degraded';
  const authoritativeLocationChange = Boolean(authoritativeLocationId && moved);
  if (authoritativeLocationChange) {
    next.location_id = observedLocation;
    next.scene_id = observedLocation;
    next.beat = 0;
    next.goal = null;
    next.focus_thread = null;
    next.present_npc_ids = [];
  }
  if (!degraded && observation.outcome === 'success') {
    const explicitExited = new Set(uniqueNpcIds(observation.exited_npc_ids, npcIds));
    next.present_npc_ids = next.present_npc_ids.filter(id => !explicitExited.has(id));
    if (observation.scene_id !== null && observation.scene_id !== undefined) next.scene_id = observation.scene_id;
    if (moved && observedLocation !== null) next.location_id = observedLocation;
    if (observation.scene_goal_provided) next.goal = observation.scene_goal;
    if (observation.focus_thread_provided) next.focus_thread = observation.focus_thread;
  }
 const currentIds = new Set(next.present_npc_ids);
  for (const entered of uniqueNpcIds(observation.entered_npc_ids, npcIds)) {
    if (!currentIds.has(entered)) { next.present_npc_ids.push(entered); currentIds.add(entered); }
  }
  // A normalized presence/entrance evidence item is an exact Story-backed
  // observation. Final snapshots alone are not authority, but quoted
  // evidence is sufficient to add the observed local NPC.
  for (const observed of uniqueNpcIds(
    (observation.evidence ?? [])
      .filter(item => item?.kind === 'presence' || item?.kind === 'entrance')
      .map(item => item?.character_id),
    npcIds
  )) {
    if (!currentIds.has(observed)) { next.present_npc_ids.push(observed); currentIds.add(observed); }
  }
  const explicitExited = new Set(uniqueNpcIds(observation.exited_npc_ids, npcIds));
  const speakers = [...new Set(observation.explicit_speaker_ids ?? [])].filter(Boolean);
  // Speakers before an authoritative movement boundary belong to the source
  // phase and cannot be carried into the destination by whole-turn union.
  if (!authoritativeLocationChange) for (const speaker of speakers) {
    if (isPlayerId(speaker) || currentIds.has(speaker)) continue;
    if (observation.remote_speaker_ids?.includes(speaker)) {
      if (!npcIds.has(speaker)) {
        throw new GameCoreError('SCENE_PRESENCE_UNRESOLVED', `Story speaker ${speaker} is not a registered remote NPC`);
      }
      continue;
    }
    // A registered local dialogue speaker is direct post-Story presence
    // evidence.  Pre-Story cast is a context projection, not a whitelist that
    // can invalidate a naturally appearing registered NPC.  Unknown IDs still
    // fail closed, and remote speakers remain non-local.
    if (!npcIds.has(speaker)) {
      throw new GameCoreError(
        Array.isArray(observation.final_present_npc_ids) ? 'SCENE_PRESENCE_CONTRADICTS_STORY' : 'SCENE_PRESENCE_UNRESOLVED',
        `Story speaker ${speaker} is not a registered local NPC`
      );
    }
    // A final snapshot may add observed actors, but omission alone cannot
    // remove a current actor. Removal requires explicit quoted exit evidence.
    if (!explicitExited.has(speaker)) {
      next.present_npc_ids = [...next.present_npc_ids, speaker];
      currentIds.add(speaker);
    }
  }
  const explicitFocal = stringId(observation.focal_candidate_id);
  if (explicitFocal && currentIds.has(explicitFocal)) {
    next.focal_character_id = explicitFocal;
  } else {
    const acting = [...new Set([...(observation.explicit_speaker_ids ?? []), ...(observation.acted_npc_ids ?? [])].filter(id => currentIds.has(id)))];
    next.focal_character_id = acting.length === 1 ? acting[0] : null;
  }
  const lastSpeaker = stringId(observation.last_explicit_speaker_id);
  next.last_speaker_id = lastSpeaker;
  next.updated_turn = Number.isInteger(input.expectedTurn) ? input.expectedTurn : validInteger(current.updated_turn, 0) + 1;
  if (!authoritativeLocationChange) next.beat = validInteger(current.beat, 0) + 1;
  return next;
}

export { isPlayerId };
