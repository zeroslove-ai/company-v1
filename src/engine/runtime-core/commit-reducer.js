import { buildTurnState } from '../turn-state.js';
import { readCanonicalSceneV1, reduceCanonicalScene } from './scene-reducer.js';
import { projectCanonicalSceneToLegacy } from './projections.js';
import { assertCanonicalSceneInvariants } from './invariants.js';
import { reduceObservationDomains } from './observation-reducers.js';
import { reduceCsaCommitState } from './csa-commit-reducer.js';

function clone(value) { return value === undefined ? undefined : structuredClone(value); }
function nonEmpty(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
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

function playerOwnedMonitor(mindMonitor, playerThought) {
  const thought = typeof playerThought === 'string' ? playerThought.trim() : '';
  if (!thought) return { state: mindMonitor ?? {}, warnings: [] };
  const fragments = new Set([thought, ...thought.split(/[.!?。！？]\s*/).map(value => value.trim()).filter(value => value.length >= 12)]);
  const isOwned = value => {
    const text = typeof value === 'string' ? value.trim() : '';
    return text && fragments.has(text);
  };
  const state = {};
  const warnings = [];
  for (const [id, value] of Object.entries(mindMonitor ?? {})) {
    const surface = typeof value?.surface === 'string' ? value.surface.trim() : '';
    const subconscious = typeof value?.subconscious === 'string' ? value.subconscious.trim() : '';
    if (isOwned(surface) || isOwned(subconscious)) {
      warnings.push(`mind_monitor_player_thought_dropped:${id}`);
      continue;
    }
    state[id] = value;
  }
  return { state, warnings };
}

function canonicalObservation(observation, parsedStory, { navigationIntent = null, mapLocations = [], storyText = '' } = {}) {
  const scene = observation.scene_observation ?? {};
  const speakers = parserSpeakers(parsedStory);
  const registeredLocations = new Set((Array.isArray(mapLocations) ? mapLocations : [])
    .map(item => nonEmpty(item?.location_id)).filter(Boolean));
  const sceneEvidence = Array.isArray(scene.evidence) ? scene.evidence : [];
  const exactSceneEvidence = sceneEvidence.find(item => item?.kind === 'scene'
    && item?.location_id === scene.location_id
    && typeof item?.quote === 'string'
    && item.quote.trim()
    && String(storyText).includes(item.quote.trim()));
  const proposedLocation = nonEmpty(scene.location_id);
  const warnings = [];
  let locationId = null;
  if (navigationIntent?.kind === 'player_navigation') {
    locationId = nonEmpty(navigationIntent.destination_location_id);
    if (proposedLocation && proposedLocation !== locationId) warnings.push('scene_location_proposal_conflicts_with_navigation');
  } else if (proposedLocation && registeredLocations.has(proposedLocation) && exactSceneEvidence) {
    locationId = proposedLocation;
  } else if (proposedLocation) {
    warnings.push('scene_location_proposal_dropped_without_exact_evidence');
  }
  return {
    scene_id: scene.scene_id ?? null,
    location_id: locationId,
   final_present_npc_ids: Array.isArray(scene.final_present_npc_ids) ? scene.final_present_npc_ids : null,
    entered_npc_ids: Array.isArray(scene.entered_npc_ids) ? scene.entered_npc_ids : [],
    exited_npc_ids: Array.isArray(scene.exited_npc_ids) ? scene.exited_npc_ids : [],
    presence_is_final: scene.presence_is_final === true,
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
    evidence: scene.evidence ?? [],
    warnings
  };
}

function observationWithPlayerActingPosture(observation, parsedStory) {
  const event = (Array.isArray(parsedStory?.acting_events) ? parsedStory.acting_events : [])
    .filter(item => item?.actor_id === 'player' && (item?.posture_after === 'sitting' || item?.posture_after === 'standing') && typeof item.text === 'string' && item.text.trim())
    .at(-1);
  if (!event) return observation;
  const next = clone(observation) ?? {};
  const physical = object(next.player_observation?.physical) ? next.player_observation.physical : {};
  const evidence = object(next.evidence) ? next.evidence : {};
  const existingPostureEvidence = Object.values(evidence).some(item => object(item)
    && Array.isArray(item.changed)
    && item.changed.some(path => String(path).endsWith('.posture'))
    && typeof item.quote === 'string'
    && item.quote.trim()
    && String(parsedStory?.raw ?? '').includes(item.quote.trim()));
  next.player_observation = {
    ...(object(next.player_observation) ? next.player_observation : {}),
    physical: { ...physical, posture: event.posture_after }
  };
  next.evidence = existingPostureEvidence
    ? evidence
    : {
        ...evidence,
        physical_change: {
          changed: ['player_scene_state.player.posture'],
          quote: event.text.trim()
        }
      };
  return next;
}

export function reduceGameplayCommit({ currentSave, observation, parsedStory, rawStory, action, expectedTurn, master, npcIds, mapLocations, navigationIntent = null, authoritativeLocationId = null, structuredAction = null, transactionResolution = null, engineEnactments = [] } = {}) {
  const current = clone(currentSave);
  const canonicalObservationInput = observationWithPlayerActingPosture(observation, { ...parsedStory, raw: rawStory });
  const sceneBefore = readCanonicalSceneV1(current, { master, npcIds });
  const sceneObservation = canonicalObservation(canonicalObservationInput, parsedStory, {
    navigationIntent,
    mapLocations,
    storyText: rawStory
  });
  const canonicalScene = reduceCanonicalScene({
    currentScene: sceneBefore,
    observation: sceneObservation,
    save: current,
    master,
    npcIds,
    mapLocations,
    expectedTurn,
    actionKind: action?.action_kind,
    authoritativeLocationId: navigationIntent?.kind === 'player_navigation'
      ? navigationIntent.destination_location_id
      : authoritativeLocationId,
  });
  const observedNpcIds = new Set([
    ...(sceneBefore.present_npc_ids ?? []),
    ...(canonicalScene.present_npc_ids ?? []),
    ...(sceneObservation.explicit_speaker_ids ?? []).filter(id => !(sceneObservation.remote_speaker_ids ?? []).includes(id))
  ]);
  const domains = reduceObservationDomains({
    currentSave: current, observation: canonicalObservationInput, parsedStory, rawStory, expectedTurn, actionId: action?.action_id, master, npcIds,
    sceneBefore, sceneAfter: canonicalScene, observedNpcIds,
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
  const csaCommit = reduceCsaCommitState({
    currentSave: current,
    nextSave,
    observation: canonicalObservationInput,
    canonicalScene,
    action,
    expectedTurn,
    structuredAction,
    transactionResolution,
    engineEnactments
  });
  nextSave = csaCommit.nextSave;
  assertCanonicalSceneInvariants({ save: nextSave, scene: canonicalScene, npcIds, parsedStory, actionKind: action?.action_kind, observation: sceneObservation });
  const monitor = presentMindMonitor(canonicalObservationInput.mind_monitor ?? {}, canonicalScene.present_npc_ids ?? []);
  const ownedMonitor = playerOwnedMonitor(monitor.state, parsedStory?.player_inner_thought ?? '');
  return {
    nextSave,
    warnings: [...domains.warnings, ...csaCommit.warnings, ...(sceneObservation.warnings ?? []), ...monitor.warnings, ...ownedMonitor.warnings],
    time_before: domains.time_before,
    elapsed_minutes: domains.elapsed_minutes,
    time_after: domains.time_after,
    action_target_id: canonicalObservationInput.action_target_id ?? null,
    image_character_id: canonicalObservationInput.image_character_id ?? null,
    mind_monitor: ownedMonitor.state,
    canonical_scene: canonicalScene,
    csa_commit: {
      accepted_executions: csaCommit.acceptedExecutions,
      deactivated_ids: csaCommit.deactivatedIds,
      progression: csaCommit.progression
    }
  };
}
