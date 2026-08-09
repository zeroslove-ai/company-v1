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
    if (npcIds instanceof Set && !npcIds.has(id)) continue;
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
  const current = plain(source.scene) && source.scene.version === 1 ? source.scene : null;
  const present = uniqueNpcIds(current?.present_npc_ids ?? legacyNpcPresence(source, npcIds, playerId), npcIds);
  const focal = stringId(current?.focal_character_id ?? source.focal_character_id);
  return {
    version: 1,
    scene_id: stringId(current?.scene_id ?? source.scene_state?.scene_id),
    location_id: stringId(current?.location_id ?? source.scene_state?.location_id),
    beat: validInteger(current?.beat ?? source.scene_state?.beat, 0),
    goal: current ? (current.goal ?? null) : (source.scene_state?.scene_goal ?? null),
    focus_thread: current ? (current.focus_thread ?? null) : (source.scene_state?.focus_thread ?? null),
    present_npc_ids: present,
    focal_character_id: focal && present.includes(focal) ? focal : null,
    last_speaker_id: stringId(current?.last_speaker_id ?? source.last_speaker_id),
    updated_turn: validInteger(current?.updated_turn, 0)
  };
}

function dialogueIds(parsedStory, npcIds) {
  const lines = Array.isArray(parsedStory?.dialogue_lines) ? parsedStory.dialogue_lines : [];
  const ids = [];
  for (const line of lines) {
    const id = stringId(line?.speaker_id);
    if (!id || isPlayerId(id) || !(npcIds instanceof Set) || npcIds.has(id)) ids.push(id);
  }
  return ids.filter(Boolean);
}

/** Converts the normalized Extract plus the raw Story projection into observation-only data. */
export function buildLegacySceneObservation(input = {}, parsedStoryArg, optionsArg = {}) {
  const config = plain(input) && ('extract' in input || 'extractEnvelope' in input || 'parsedStory' in input)
    ? input
    : { extract: input, parsedStory: parsedStoryArg, ...(plain(optionsArg) ? optionsArg : {}) };
  const extract = plain(config.extractEnvelope) ? config.extractEnvelope : (plain(config.extract) ? config.extract : {});
  const parsedStory = plain(config.parsedStory) ? config.parsedStory : {};
  const npcIds = registeredNpcIds(config);
  const stateScene = plain(extract.state_delta?.scene_state) ? extract.state_delta.scene_state : {};
  const final = extract.evidence?.scene_presence_final === true
    ? uniqueNpcIds(extract.npcs_present, npcIds)
    : null;
  const explicitSpeakerIds = dialogueIds(parsedStory, npcIds);
  const acted = new Set([
    ...(Array.isArray(extract.acted_npc_ids) ? extract.acted_npc_ids : []),
    ...(Array.isArray(extract.evidence?.acted_npc_ids) ? extract.evidence.acted_npc_ids : [])
  ].map(stringId).filter(value => value && npcIds.has(value)));
  const remote = new Set([
    ...(Array.isArray(extract.remote_speaker_ids) ? extract.remote_speaker_ids : []),
    ...(Array.isArray(extract.evidence?.remote_speaker_ids) ? extract.evidence.remote_speaker_ids : [])
  ].map(stringId).filter(Boolean));
  const exited = new Set();
  const warnings = [];
  for (const [id, patch] of Object.entries(plain(extract.state_delta?.npc_scene_state) ? extract.state_delta.npc_scene_state : {})) {
    if (plain(patch) && patch.present === false) exited.add(id);
    if (plain(patch) && (patch.acted === true || patch.action || patch.behavior || patch.event)) acted.add(id);
  }
  if (stringId(extract.last_speaker_id) !== null && stringId(extract.last_speaker_id) !== (explicitSpeakerIds.at(-1) ?? null)) warnings.push('extract_last_speaker_ignored_raw_story_authoritative');
  return {
    scene_id: stringId(stateScene.scene_id),
    location_id: stringId(stateScene.location_id),
    final_present_npc_ids: final,
    focal_candidate_id: stringId(extract.focal_character_id),
    explicit_speaker_ids: explicitSpeakerIds,
    acted_npc_ids: [...acted],
    last_explicit_speaker_id: explicitSpeakerIds.at(-1) ?? null,
    scene_goal: Object.prototype.hasOwnProperty.call(stateScene, 'scene_goal') ? (stateScene.scene_goal ?? null) : null,
    focus_thread: Object.prototype.hasOwnProperty.call(stateScene, 'focus_thread') ? (stateScene.focus_thread ?? null) : null,
    scene_goal_provided: Object.prototype.hasOwnProperty.call(stateScene, 'scene_goal'),
    focus_thread_provided: Object.prototype.hasOwnProperty.call(stateScene, 'focus_thread'),
    outcome: extract.outcome ?? 'success',
    presence_is_final: final !== null,
    remote_speaker_ids: [...remote],
    exited_npc_ids: [...exited],
    warnings
  };
}

function isSuccessfulOutcome(outcome) {
  return outcome === 'success' || outcome === 'partial';
}

/** Reduce one observation into the canonical scene. No legacy save fields are written here. */
export function reduceCanonicalScene(input = {}) {
  const current = clone(input.currentScene ?? hydrateCanonicalScene(input.save, input));
  const observation = input.observation ?? {};
  const npcIds = registeredNpcIds(input);
  const locations = locationIds(input);
  const movementBlocked = input.actionKind === 'feedback_revision' || observation.outcome === 'degraded' || !isSuccessfulOutcome(observation.outcome);
  const next = { ...current, present_npc_ids: [...current.present_npc_ids] };
  if (movementBlocked) return next;

  if (observation.location_id !== null && observation.location_id !== undefined) {
    if (locations.size && !locations.has(observation.location_id)) {
      throw new GameCoreError('SCENE_LOCATION_UNKNOWN', `Unknown scene location: ${observation.location_id}`);
    }
    if (!movementBlocked && observation.location_id !== current.location_id) {
      if (observation.final_present_npc_ids === null) {
        throw new GameCoreError('SCENE_PRESENCE_REQUIRED_FOR_MOVEMENT', 'A location change requires a final presence snapshot');
      }
      next.location_id = observation.location_id;
      next.scene_id = observation.scene_id ?? null;
      next.beat = 0;
      next.goal = observation.scene_goal_provided ? observation.scene_goal : null;
      next.focus_thread = observation.focus_thread_provided ? observation.focus_thread : null;
    }
  }
  if (!movementBlocked && observation.location_id === current.location_id) {
    if (observation.scene_id !== null) next.scene_id = observation.scene_id;
    if (observation.scene_goal_provided) next.goal = observation.scene_goal;
    if (observation.focus_thread_provided) next.focus_thread = observation.focus_thread;
  }
  if (!movementBlocked && Array.isArray(observation.final_present_npc_ids)) {
    next.present_npc_ids = uniqueNpcIds(observation.final_present_npc_ids, npcIds);
  }
  const currentIds = new Set(next.present_npc_ids);
  if (Array.isArray(observation.final_present_npc_ids)) {
    for (const speaker of new Set(observation.explicit_speaker_ids ?? [])) {
      if (isPlayerId(speaker) || currentIds.has(speaker) || observation.remote_speaker_ids?.includes(speaker) || observation.exited_npc_ids?.includes(speaker)) continue;
      throw new GameCoreError('SCENE_PRESENCE_CONTRADICTS_STORY', `Story speaker ${speaker} is absent from the final scene`);
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
  if (lastSpeaker && !isPlayerId(lastSpeaker) && !npcIds.has(lastSpeaker)) {
    next.last_speaker_id = null;
  } else if (Array.isArray(observation.final_present_npc_ids) && lastSpeaker && !isPlayerId(lastSpeaker) && !currentIds.has(lastSpeaker) && !observation.remote_speaker_ids?.includes(lastSpeaker) && !observation.exited_npc_ids?.includes(lastSpeaker)) {
    throw new GameCoreError('SCENE_PRESENCE_CONTRADICTS_STORY', `Story speaker ${lastSpeaker} is absent from the final scene`);
  } else {
    next.last_speaker_id = lastSpeaker;
  }
  next.updated_turn = Number.isInteger(input.expectedTurn) ? input.expectedTurn : current.updated_turn;
  return next;
}

export { isPlayerId };
