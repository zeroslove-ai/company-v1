import { reduceLegacyGameplayState } from '../guarded-merge.js';
import { hydrateCanonicalScene, reduceCanonicalScene } from './scene-reducer.js';
import { projectCanonicalSceneToLegacy } from './projections.js';
import { assertCanonicalSceneInvariants } from './invariants.js';

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null; }
function clone(value) { return value === undefined ? undefined : structuredClone(value); }
function nonEmpty(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }

function parserSpeakers(parsedStory) {
  return Array.isArray(parsedStory?.dialogue_lines)
    ? parsedStory.dialogue_lines.map(line => nonEmpty(line?.speaker_id)).filter(Boolean)
    : [];
}

function legacyEnvelopeFromObservation(observation, currentSave, parsedStory) {
  const delta = {};
  const player = object(observation.player_observation) ?? {};
  if (object(player.physical) && Object.keys(player.physical).length) delta.player_scene_state = clone(player.physical);
  if (object(player.sexual) && Object.keys(player.sexual).length) delta.player_sexual_state = clone(player.sexual);
  const npc = object(observation.npc_observations) ?? {};
  const maps = { physical: 'npc_scene_state', emotion: 'npc_emotion', relationship: 'npc_relationship_state', stats: 'npc_stats', work: 'npc_work_state', csa_attitude: 'csa_attitudes' };
  for (const [npcId, domains] of Object.entries(npc)) {
    for (const [domain, path] of Object.entries(maps)) {
      if (!object(domains?.[domain]) || !Object.keys(domains[domain]).length) continue;
      delta[path] ??= {};
      delta[path][npcId] = clone(domains[domain]);
    }
  }
  if (Array.isArray(observation.events?.general) && observation.events.general.length) delta.event_ledger = clone(observation.events.general);
  if (Array.isArray(observation.events?.sexual) && observation.events.sexual.length) delta.sexual_event_ledger = clone(observation.events.sexual);
  const currentScene = hydrateCanonicalScene(currentSave, { npcIds: new Set(Object.keys(currentSave?.npc_scene_state ?? {})) });
  const scene = observation.scene_observation ?? {};
  const present = Array.isArray(scene.final_present_npc_ids) ? scene.final_present_npc_ids : currentScene.present_npc_ids;
  return {
    state_delta: delta,
    outcome: observation.outcome,
    evidence: clone(observation.evidence ?? {}),
    turn_summary: observation.turn_summary ?? '',
    mind_monitor: clone(observation.mind_monitor ?? {}),
    choices: Array.isArray(parsedStory?.choices) ? clone(parsedStory.choices) : [],
    dialogue_lines: Array.isArray(parsedStory?.dialogue_lines) ? clone(parsedStory.dialogue_lines) : [],
    npcs_present: present,
    action_target_id: observation.action_target_id,
    focal_character_id: scene.focal_candidate_id,
    last_speaker_id: parserSpeakers(parsedStory).at(-1) ?? null,
    image_character_id: observation.image_character_id,
    image_selection: clone(observation.image_selection),
    player_inner_thought: typeof parsedStory?.player_inner_thought === 'string' ? parsedStory.player_inner_thought : '',
    elapsed_minutes: observation.elapsed_minutes,
    csa_trigger_evaluations: clone(observation.csa_trigger_evaluations ?? []),
    csa_runtime_updates: clone(observation.csa_runtime_updates ?? []),
    warnings: clone(observation.warnings ?? [])
  };
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
    exited_npc_ids: scene.exited_npc_ids ?? [],
    warnings: []
  };
}

export function reduceGameplayCommit({ currentSave, observation, parsedStory, rawStory, action, expectedTurn, master, npcIds, mapLocations } = {}) {
  const current = clone(currentSave);
  const legacy = legacyEnvelopeFromObservation(observation, current, parsedStory);
  const merged = reduceLegacyGameplayState(current, legacy, {
    expectedTurn,
    actionId: action?.action_id,
    turnId: action?.turn_id,
    playerAction: action?.player_action,
    parsedStory,
    master,
    npcIds,
    storyText: rawStory
  });
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
  const nextSave = projectCanonicalSceneToLegacy(merged.nextSave, canonicalScene, {
    playerId: current.player?.player_id ?? current.player?.id,
    npcIds
  });
  assertCanonicalSceneInvariants({ save: nextSave, scene: canonicalScene, npcIds, parsedStory, actionKind: action?.action_kind, observation: sceneObservation });
  return {
    nextSave,
    warnings: [...merged.warnings, ...(sceneObservation.warnings ?? [])],
    time_before: merged.time_before,
    elapsed_minutes: merged.elapsed_minutes,
    time_after: merged.time_after,
    action_target_id: observation.action_target_id ?? null,
    image_character_id: observation.image_character_id ?? null,
    mind_monitor: observation.mind_monitor ?? {},
    dialogue_lines: parserSpeakers(parsedStory),
    canonical_scene: canonicalScene
  };
}
