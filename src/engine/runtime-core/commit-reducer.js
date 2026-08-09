import { buildTurnState } from '../turn-state.js';
import { hydrateCanonicalScene, reduceCanonicalScene } from './scene-reducer.js';
import { projectCanonicalSceneToLegacy } from './projections.js';
import { assertCanonicalSceneInvariants } from './invariants.js';
import { reduceObservationDomains } from './observation-reducers.js';

function clone(value) { return value === undefined ? undefined : structuredClone(value); }
function nonEmpty(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function parserSpeakers(parsedStory) {
  return Array.isArray(parsedStory?.dialogue_lines)
    ? parsedStory.dialogue_lines.map(line => nonEmpty(line?.speaker_id)).filter(Boolean)
    : [];
}
function presentMindMonitor(mindMonitor, presentIds) {
  const result = {};
  for (const id of presentIds) if (mindMonitor?.[id]) result[id] = clone(mindMonitor[id]);
  return result;
}

function canonicalObservation(observation, parsedStory) {
  const scene = observation.scene_observation ?? {};
  const speakers = parserSpeakers(parsedStory);
  return {
    scene_id: scene.scene_id ?? null,
    location_id: scene.location_id ?? null,
    final_present_npc_ids: scene.presence_is_final ? scene.final_present_npc_ids : null,
    focal_candidate_id: scene.focal_candidate_id ?? null,
    explicit_speaker_ids: speakers,
    acted_npc_ids: [],
    last_explicit_speaker_id: speakers.at(-1) ?? null,
    scene_goal: null,
    focus_thread: null,
    scene_goal_provided: false,
    focus_thread_provided: false,
    outcome: observation.outcome,
    presence_is_final: scene.presence_is_final,
    remote_speaker_ids: scene.remote_speaker_ids ?? [],
    entered_npc_ids: scene.entered_npc_ids ?? [],
    exited_npc_ids: scene.exited_npc_ids ?? [],
    evidence: scene.evidence ?? [],
    warnings: []
  };
}

export function reduceGameplayCommit({ currentSave, observation, parsedStory, rawStory, action, expectedTurn, master, npcIds, mapLocations } = {}) {
  const current = clone(currentSave);
  const domains = reduceObservationDomains({ currentSave: current, observation, parsedStory, rawStory, expectedTurn, actionId: action?.action_id, master, npcIds });
  const sceneObservation = canonicalObservation(observation, parsedStory);
  const canonicalScene = reduceCanonicalScene({
    currentScene: hydrateCanonicalScene(current, { master, npcIds }),
    observation: sceneObservation,
    save: current,
    master,
    npcIds,
    mapLocations,
    expectedTurn,
    actionKind: action?.action_kind
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
  return {
    nextSave,
    warnings: [...domains.warnings, ...(sceneObservation.warnings ?? [])],
    time_before: domains.time_before,
    elapsed_minutes: domains.elapsed_minutes,
    time_after: domains.time_after,
    action_target_id: observation.action_target_id ?? null,
    image_character_id: observation.image_character_id ?? null,
    mind_monitor: presentMindMonitor(observation.mind_monitor ?? {}, canonicalScene.present_npc_ids ?? []),
    canonical_scene: canonicalScene
  };
}
