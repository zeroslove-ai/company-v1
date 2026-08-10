import { buildTurnState } from '../turn-state.js';
import { hydrateCanonicalScene, reduceCanonicalScene } from './scene-reducer.js';
import { projectCanonicalSceneToLegacy } from './projections.js';
import { assertCanonicalSceneInvariants } from './invariants.js';
import { reduceObservationDomains } from './observation-reducers.js';
import { assertScenePresenceCoverage } from './extract-observation.js';

function clone(value) { return value === undefined ? undefined : structuredClone(value); }
function nonEmpty(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function parserSpeakers(parsedStory) {
  return Array.isArray(parsedStory?.dialogue_lines)
    ? parsedStory.dialogue_lines.map(line => nonEmpty(line?.speaker_id)).filter(Boolean)
    : [];
}
function presentMindMonitor(mindMonitor, presentIds) {
  const result = {};
  const warnings = [];
  for (const [id, value] of Object.entries(mindMonitor ?? {})) {
    if (presentIds.includes(id)) result[id] = clone(value);
    else warnings.push(`mind_monitor_off_scene_dropped:${id}`);
  }
  return { state: result, warnings };
}

function canonicalObservation(observation, parsedStory) {
  const scene = observation.scene_observation ?? {};
  const speakers = parserSpeakers(parsedStory);
  return {
    scene_id: scene.scene_id ?? null,
    location_id: scene.location_id ?? null,
    final_present_npc_ids: Array.isArray(scene.final_present_npc_ids) ? scene.final_present_npc_ids : null,
    focal_candidate_id: scene.focal_candidate_id ?? null,
    explicit_speaker_ids: speakers,
    acted_npc_ids: [],
    last_explicit_speaker_id: speakers.at(-1) ?? null,
    scene_goal: null,
    focus_thread: null,
    scene_goal_provided: false,
    focus_thread_provided: false,
    outcome: observation.outcome,
    remote_speaker_ids: scene.remote_speaker_ids ?? [],
    entered_npc_ids: scene.entered_npc_ids ?? [],
    exited_npc_ids: scene.exited_npc_ids ?? [],
    evidence: scene.evidence ?? [],
    warnings: []
  };
}

export function reduceGameplayCommit({ currentSave, observation, parsedStory, rawStory, action, expectedTurn, master, npcIds, mapLocations, movementContract = null } = {}) {
  const current = clone(currentSave);
  const sceneBefore = hydrateCanonicalScene(current, { master, npcIds });
  const sceneObservation = canonicalObservation(observation, parsedStory);
  const resolvedMovement = movementContract?.transition_mode === 'movement'
    && typeof movementContract.destination_location_id === 'string'
    && movementContract.destination_location_id.trim()
    ? movementContract.destination_location_id.trim()
    : null;
  if (!resolvedMovement) assertScenePresenceCoverage(observation, { currentScene: sceneBefore });
  const canonicalScene = reduceCanonicalScene({
    currentScene: sceneBefore,
    observation: sceneObservation,
    save: current,
    master,
    npcIds,
    mapLocations,
    expectedTurn,
    actionKind: action?.action_kind,
    movementDestinationId: resolvedMovement,
  });
  const observedNpcIds = new Set([
    ...(sceneBefore.present_npc_ids ?? []),
    ...(canonicalScene.present_npc_ids ?? []),
    ...(sceneObservation.entered_npc_ids ?? []),
    ...(sceneObservation.exited_npc_ids ?? []),
    ...(sceneObservation.explicit_speaker_ids ?? []).filter(id => !(sceneObservation.remote_speaker_ids ?? []).includes(id))
  ]);
  const domains = reduceObservationDomains({
    currentSave: current, observation, parsedStory, rawStory, expectedTurn, actionId: action?.action_id, master, npcIds,
    sceneBefore, sceneAfter: canonicalScene, observedNpcIds,
    enteredNpcIds: sceneObservation.entered_npc_ids, exitedNpcIds: sceneObservation.exited_npc_ids,
    explicitSpeakerIds: (sceneObservation.explicit_speaker_ids ?? []).filter(id => !(sceneObservation.remote_speaker_ids ?? []).includes(id))
  });
  let nextSave = projectCanonicalSceneToLegacy(domains.nextSave, canonicalScene, {
    playerId: current.player?.player_id ?? current.player?.id,
    npcIds
  });
  nextSave.turn_state = buildTurnState({
    currentTurn: current.turn_state?.committed_turn ?? 0,
    expectedTurn,
    actionId: action?.action_id,
    turnId: action?.turn_id
  });
  assertCanonicalSceneInvariants({ save: nextSave, scene: canonicalScene, npcIds, parsedStory, actionKind: action?.action_kind, observation: sceneObservation });
  const monitor = presentMindMonitor(observation.mind_monitor ?? {}, canonicalScene.present_npc_ids ?? []);
  return {
    nextSave,
    warnings: [...domains.warnings, ...(sceneObservation.warnings ?? []), ...monitor.warnings],
    time_before: domains.time_before,
    elapsed_minutes: domains.elapsed_minutes,
    time_after: domains.time_after,
    action_target_id: observation.action_target_id ?? null,
    image_character_id: observation.image_character_id ?? null,
    mind_monitor: monitor.state,
    canonical_scene: canonicalScene
  };
}
