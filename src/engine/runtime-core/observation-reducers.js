import { advanceGameTime, hydrateGameplayState, reducePlayerSexualState } from '../gameplay-state.js';
import { buildSceneStatePatch } from '../state/physical-state.js';
import { readCanonicalSceneV1 } from './scene-reducer.js';

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function clone(value) { return value === undefined ? undefined : structuredClone(value); }
function playerAlias(id) { return id === 'player' || (typeof id === 'string' && /^player[-_]/i.test(id)); }
function canonicalId(id) { return playerAlias(id) ? 'player' : id; }
function masterName(master, id) {
  const all = [...(Array.isArray(master?.characters) ? master.characters : []), ...(Array.isArray(master?.general_npcs) ? master.general_npcs : [])];
  return all.find(item => item?.character_id === id || item?.npc_id === id || item?.id === id)?.name ?? '';
}
function dialogueLines(parsedStory, id) {
  return Array.isArray(parsedStory?.dialogue_lines) ? parsedStory.dialogue_lines.filter(line => line?.speaker_id === id).map(line => line.text ?? line.dialogue ?? '').filter(Boolean) : [];
}
function clothingQuote(evidence, actorId) {
  const root = object(evidence?.clothing) ? evidence.clothing : {};
  const key = Object.keys(root).find(candidate => canonicalId(candidate) === canonicalId(actorId));
  const entry = key && object(root[key]) ? root[key] : null;
  return entry && typeof entry.quote === 'string' && entry.quote.trim() ? entry.quote.trim() : null;
}
function evidenceMap(proposal, evidence, actorId) {
  return { ...(object(proposal?.evidence) ? proposal.evidence : {}), clothing: clothingQuote(evidence, actorId) };
}
function registered(id, npcIds) { return typeof id === 'string' && (!npcIds?.size || npcIds.has(id)); }
function currentNpcIds(save, npcIds) { return new Set(readCanonicalSceneV1(save, { npcIds }).present_npc_ids ?? []); }
function observedNpcSet({ save, npcIds, sceneBefore, sceneAfter, observedNpcIds } = {}) {
  const result = new Set(observedNpcIds ?? []);
  for (const id of sceneBefore?.present_npc_ids ?? []) result.add(id);
  for (const id of sceneAfter?.present_npc_ids ?? []) result.add(id);
  if (!result.size) for (const id of currentNpcIds(save, npcIds)) result.add(id);
  return result;
}

const DETERMINISTIC_CHOICE_FALLBACKS = [
  '현재 대화를 조금 더 이어간다.',
  '상대에게 지금 상황을 차분히 물어본다.',
  '주변 반응을 잠시 살펴본다.',
  '대화를 정리하고 다음 행동을 생각한다.'
];

export function reducePlayerPhysicalObservation({ save, physical, evidence, storyText, expectedTurn, npcIds } = {}) {
  if (!object(physical) || !Object.keys(physical).length) return { state: save.player_scene_state ?? {}, warnings: [] };
  const result = buildSceneStatePatch({ previous: save.player_scene_state ?? {}, proposal: physical, evidenceMap: evidenceMap(physical, evidence, 'player'), narrativeText: storyText, characterName: '', turnNumber: expectedTurn, actorId: 'player', npcsPresent: [...currentNpcIds(save, npcIds)], registeredNpcNames: [] });
  return { state: result.state, warnings: result.warnings.map(code => `player_scene_state:${code}`) };
}

export function reduceNpcPhysicalObservation({ save, npcId, physical, evidence, storyText, expectedTurn, npcIds, master, parsedStory, sceneBefore, sceneAfter, observedNpcIds } = {}) {
  if (!registered(npcId, npcIds)) return { state: save.npc_scene_state?.[npcId] ?? {}, warnings: [`unknown_npc:${npcId}`] };
  if (!observedNpcSet({ save, npcIds, sceneBefore, sceneAfter, observedNpcIds }).has(npcId)) return { state: save.npc_scene_state?.[npcId] ?? {}, warnings: [`off_scene_npc:${npcId}`] };
  if (!object(physical) || !Object.keys(physical).length) return { state: save.npc_scene_state?.[npcId] ?? {}, warnings: [] };
  const result = buildSceneStatePatch({ previous: save.npc_scene_state?.[npcId] ?? {}, proposal: physical, evidenceMap: evidenceMap(physical, evidence, npcId), narrativeText: storyText, characterName: masterName(master, npcId), turnNumber: expectedTurn, actorId: npcId, npcsPresent: [...currentNpcIds(save, npcIds)], registeredNpcNames: [], npcDialogueLines: dialogueLines(parsedStory, npcId) });
  return { state: result.state, warnings: result.warnings.map(code => `npc_scene_state:${npcId}:${code}`) };
}

export function reducePlayerSexualObservation({ save, sexual, evidence, storyText, expectedTurn } = {}) {
  if (!object(sexual) || !Object.keys(sexual).length) return { state: save.player_sexual_state ?? {}, warnings: [] };
  return reducePlayerSexualState(save.player_sexual_state ?? {}, sexual, { storyEvidence: evidence, updatedTurn: expectedTurn, storyText });
}

export function reduceElapsedTimeObservation({ save, elapsedMinutes, evidence } = {}) {
  const before = save.world_state?.game_time ?? {};
  const after = advanceGameTime(before, elapsedMinutes, evidence);
  return { before, after, warnings: [] };
}

export function reduceStoryChoiceProjection({ parsedStory, allowDeterministicFallback = false } = {}) {
  const observed = Array.isArray(parsedStory?.choices) ? parsedStory.choices.map(choice => typeof choice === 'string' ? choice.trim() : '') : [];
  const nonEmpty = observed.filter(Boolean);
  const unique = new Set(nonEmpty);
  const warnings = [];
  if (observed.length !== 4) warnings.push('choices_not_exactly_four');
  if (observed.some(choice => !choice)) warnings.push('choices_empty');
  if (unique.size !== nonEmpty.length) warnings.push('choices_exact_duplicate');
  const canonical = observed.length === 4 && observed.every(Boolean) && unique.size === 4;
  if (allowDeterministicFallback && !canonical) {
    const state = [];
    for (const choice of nonEmpty) {
      if (state.length >= 4) break;
      if (!state.includes(choice)) state.push(choice);
    }
    if (state.length < 4) warnings.push('choices_padded');
    if (nonEmpty.length > 4) warnings.push('choices_truncated');
    for (const fallback of DETERMINISTIC_CHOICE_FALLBACKS) {
      if (state.length >= 4) break;
      if (!state.includes(fallback)) state.push(fallback);
    }
    if (state.length === 4) {
      warnings.push('choices_fallback_applied');
      return { state: clone(state), warnings };
    }
  }
  return { state: canonical ? clone(observed) : [], warnings };
}

export function projectStoryChoiceProjection({ parsedStory, allowDeterministicFallback = false } = {}) {
  const projection = reduceStoryChoiceProjection({ parsedStory, allowDeterministicFallback });
  const warnings = [...new Set([
    ...(Array.isArray(parsedStory?.warnings) ? parsedStory.warnings : []),
    ...projection.warnings
  ])];
  const projectedStory = {
    ...(object(parsedStory) ? parsedStory : {}),
    choices: clone(projection.state),
    canonical_choices: clone(projection.state),
    warnings
  };
  return { ...projection, parsedStory: projectedStory };
}

/** Fresh Commit reduces only scene, physical/clothing, player sexual mechanic, choices and time. */
export function reduceObservationDomains({ currentSave, observation, parsedStory, rawStory, expectedTurn, master, npcIds, sceneBefore, sceneAfter, observedNpcIds, explicitSpeakerIds } = {}) {
  const nextSave = hydrateGameplayState(currentSave, master ?? {});
  const warnings = [...(observation.warnings ?? [])];
  const evidence = observation.evidence ?? {};
  const eligibleNpcIds = new Set(observedNpcIds ?? [...(sceneBefore?.present_npc_ids ?? []), ...(sceneAfter?.present_npc_ids ?? []), ...(explicitSpeakerIds ?? [])]);
  const playerPhysical = reducePlayerPhysicalObservation({ save: nextSave, physical: observation.player_observation?.physical, evidence, storyText: rawStory, expectedTurn, npcIds });
  nextSave.player_scene_state = playerPhysical.state; warnings.push(...playerPhysical.warnings);
  const playerSexual = reducePlayerSexualObservation({ save: nextSave, sexual: observation.player_observation?.sexual, evidence, storyText: rawStory, expectedTurn });
  nextSave.player_sexual_state = playerSexual.state; warnings.push(...playerSexual.warnings);
  for (const [npcId, domains] of Object.entries(observation.npc_observations ?? {})) {
    if (!eligibleNpcIds.has(npcId)) { warnings.push(`off_scene_npc_observation_dropped:${npcId}`); continue; }
    const physical = reduceNpcPhysicalObservation({ save: nextSave, npcId, physical: domains?.physical, evidence, storyText: rawStory, expectedTurn, npcIds, master, parsedStory, sceneBefore, sceneAfter, observedNpcIds: eligibleNpcIds });
    if (domains?.physical) nextSave.npc_scene_state[npcId] = physical.state;
    warnings.push(...physical.warnings);
  }
  const choices = reduceStoryChoiceProjection({ parsedStory });
  warnings.push(...choices.warnings);
  const time = reduceElapsedTimeObservation({ save: nextSave, elapsedMinutes: observation.elapsed_minutes, evidence });
  nextSave.world_state = { ...(object(nextSave.world_state) ? nextSave.world_state : {}), game_time: time.after };
  return { nextSave, warnings, time_before: time.before, time_after: time.after, elapsed_minutes: observation.elapsed_minutes };
}
