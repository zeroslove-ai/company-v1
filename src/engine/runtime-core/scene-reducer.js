import { GameCoreError } from '../errors.js';

const PLAYER_RE = /^player(?:[-_].*)?$/i;

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
  if (options.npcIds instanceof Set) return new Set(options.npcIds);
  if (Array.isArray(options.npcIds)) return new Set(options.npcIds.filter(stringId));
  const ids = new Set();
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

/** Return the canonical scene without changing the supplied save. */
export function hydrateCanonicalScene(save, options = {}) {
  const source = plain(save) ? save : {};
  const npcIds = registeredNpcIds(options);
  const playerId = playerIdOf(source, options);
  const hasCanonical = plain(source.scene);
  const current = hasCanonical && source.scene.version === 1 ? source.scene : null;
  if (hasCanonical && !current) {
    throw new GameCoreError('CANONICAL_SCENE_INVALID', 'Canonical scene version is invalid');
  }
  if (current) {
    if (!Array.isArray(current.present_npc_ids)) {
      throw new GameCoreError('CANONICAL_SCENE_INVALID', 'Canonical present_npc_ids must be an array');
    }
    const rawPresent = current.present_npc_ids.map(stringId);
    if (rawPresent.some(value => !value) || new Set(rawPresent).size !== rawPresent.length
      || rawPresent.some(value => isPlayerId(value, playerId) || (npcIds.size && !npcIds.has(value)))) {
      throw new GameCoreError('CANONICAL_SCENE_INVALID', 'Canonical present_npc_ids contains invalid values');
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
      location_id: current.location_id ?? null,
      beat: current.beat,
      goal: current.goal ?? null,
      focus_thread: current.focus_thread ?? null,
      present_npc_ids: [...rawPresent],
      focal_character_id: current.focal_character_id ?? null,
      last_speaker_id: current.last_speaker_id ?? null,
      updated_turn: current.updated_turn
    };
  }
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
  const current = clone(input.currentScene ?? hydrateCanonicalScene(input.save, input));
  const observation = input.observation ?? {};
  const npcIds = registeredNpcIds(input);
  const locations = locationIds(input);
  const next = { ...current, present_npc_ids: [...current.present_npc_ids] };
  const feedbackRevision = input.actionKind === 'feedback_revision';
  if (feedbackRevision) return next;
  const movementDestinationId = stringId(input.movementDestinationId);
  const observedLocation = movementDestinationId ?? observation.location_id ?? null;
  if (observedLocation !== null && locations.size && !locations.has(observedLocation)) {
    throw new GameCoreError('SCENE_LOCATION_UNKNOWN', `Unknown scene location: ${observedLocation}`);
  }
  const moved = observedLocation !== null && observedLocation !== current.location_id;
  const degraded = observation.outcome === 'degraded';
  const successMovement = Boolean(movementDestinationId) || (moved && observation.outcome === 'success');
  const stationary = !moved;
  if (successMovement) {
    if (!movementDestinationId && !Array.isArray(observation.final_present_npc_ids)) {
      throw new GameCoreError('SCENE_PRESENCE_REQUIRED_FOR_MOVEMENT', 'A location change requires a final presence snapshot');
    }
    next.location_id = observedLocation;
    next.scene_id = movementDestinationId ? observedLocation : (observation.scene_id ?? null);
    next.beat = 0;
    next.goal = movementDestinationId ? null : (observation.scene_goal_provided ? observation.scene_goal : null);
    next.focus_thread = movementDestinationId ? null : (observation.focus_thread_provided ? observation.focus_thread : null);
    next.present_npc_ids = movementDestinationId
      ? (Array.isArray(observation.final_present_npc_ids)
        ? uniqueNpcIds(observation.final_present_npc_ids, npcIds)
        : [])
      : uniqueNpcIds(observation.final_present_npc_ids, npcIds);
  } else if (stationary && !degraded && observation.outcome === 'success' && Array.isArray(observation.final_present_npc_ids)) {
    next.present_npc_ids = uniqueNpcIds(observation.final_present_npc_ids, npcIds);
    if (observation.scene_id !== null && observation.scene_id !== undefined) next.scene_id = observation.scene_id;
    if (observation.scene_goal_provided) next.goal = observation.scene_goal;
    if (observation.focus_thread_provided) next.focus_thread = observation.focus_thread;
  }
  const currentIds = new Set(next.present_npc_ids);
  const speakers = [...new Set(observation.explicit_speaker_ids ?? [])].filter(Boolean);
  for (const speaker of speakers) {
    if (movementDestinationId) continue;
    if (isPlayerId(speaker) || currentIds.has(speaker) || observation.remote_speaker_ids?.includes(speaker)) continue;
    throw new GameCoreError(
      Array.isArray(observation.final_present_npc_ids) ? 'SCENE_PRESENCE_CONTRADICTS_STORY' : 'SCENE_PRESENCE_UNRESOLVED',
      `Story speaker ${speaker} is absent from the canonical scene`
    );
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
  if (successMovement) next.updated_turn = Number.isInteger(input.expectedTurn) ? input.expectedTurn : current.updated_turn;
  else next.updated_turn = Number.isInteger(input.expectedTurn) ? input.expectedTurn : validInteger(current.updated_turn, 0) + 1;
  if (successMovement) next.beat = 0;
  else next.beat = validInteger(current.beat, 0) + 1;
  return next;
}

export { isPlayerId };
