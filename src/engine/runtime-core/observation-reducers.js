import { advanceGameTime, hydrateGameplayState, reducePlayerSexualState } from '../gameplay-state.js';
import { buildSceneStatePatch } from '../state/physical-state.js';
import { applyNpcStatChanges } from '../relationship/reducer.js';
import { readCanonicalSceneV1 } from './scene-reducer.js';
import { reduceSexualEventDomain } from './sexual-event-reducer.js';
export { reduceSexualEventObservations } from './sexual-event-reducer.js';

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function clone(value) { return value === undefined ? undefined : structuredClone(value); }
function playerAlias(id) { return id === 'player' || (typeof id === 'string' && /^player[-_]/i.test(id)); }
function canonicalId(id) { return playerAlias(id) ? 'player' : id; }
function merge(base, patch) {
  if (!object(patch)) return clone(base);
  return { ...(object(base) ? base : {}), ...clone(patch) };
}
function masterName(master, id) {
  const all = [...(Array.isArray(master?.characters) ? master.characters : []), ...(Array.isArray(master?.general_npcs) ? master.general_npcs : [])];
  return all.find(item => item?.character_id === id || item?.id === id)?.name ?? '';
}
function dialogueLines(parsedStory, id) {
  return Array.isArray(parsedStory?.dialogue_lines)
    ? parsedStory.dialogue_lines.filter(line => line?.speaker_id === id).map(line => line.text ?? line.dialogue ?? '').filter(Boolean)
    : [];
}
function clothingQuote(evidence, actorId) {
  const root = object(evidence?.clothing) ? evidence.clothing : {};
  const key = Object.keys(root).find(candidate => canonicalId(candidate) === canonicalId(actorId));
  const entry = key && object(root[key]) ? root[key] : null;
  if (!entry) return null;
  if (entry.character_id && canonicalId(entry.character_id) !== canonicalId(actorId)) return null;
  return typeof entry.quote === 'string' && entry.quote.trim() ? entry.quote.trim() : null;
}
function evidenceMap(proposal, evidence, actorId) {
  const result = { ...(object(proposal?.evidence) ? proposal.evidence : {}), clothing: clothingQuote(evidence, actorId) };
  for (const item of Object.values(object(evidence) ? evidence : {})) {
    if (!object(item) || !Array.isArray(item.changed) || typeof item.quote !== 'string' || !item.quote.trim()) continue;
    for (const path of item.changed) {
      const value = String(path ?? '');
      if (value.endsWith('.posture') && (value.includes(`${actorId}.posture`) || value.includes(`${actorId}`))) result.posture = item.quote.trim();
      if (value.endsWith('.position_label') && (value.includes(`${actorId}.position_label`) || value.includes(`${actorId}`))) result.position = item.quote.trim();
      if (value.endsWith('.posture_end_reason') && value.includes(`${actorId}`)) result.posture_end_reason = item.quote.trim();
    }
  }
  return result;
}
function registered(id, npcIds) { return typeof id === 'string' && (!npcIds?.size || npcIds.has(id)); }
function currentNpcIds(save, npcIds) {
  const scene = readCanonicalSceneV1(save, { npcIds });
  return new Set(scene.present_npc_ids ?? []);
}

function observedNpcSet({ save, npcIds, sceneBefore, sceneAfter, observedNpcIds } = {}) {
  const result = new Set(observedNpcIds ?? []);
  for (const id of sceneBefore?.present_npc_ids ?? []) result.add(id);
  for (const id of sceneAfter?.present_npc_ids ?? []) result.add(id);
  if (!result.size) for (const id of currentNpcIds(save, npcIds)) result.add(id);
  return result;
}

export function reducePlayerPhysicalObservation({ save, physical, evidence, storyText, expectedTurn, npcIds, master } = {}) {
  if (!object(physical) || !Object.keys(physical).length) return { state: save.player_scene_state ?? {}, warnings: [] };
  const result = buildSceneStatePatch({ previous: save.player_scene_state ?? {}, proposal: physical, evidenceMap: evidenceMap(physical, evidence, 'player'), narrativeText: storyText, characterName: '', turnNumber: expectedTurn, actorId: 'player', npcsPresent: [...currentNpcIds(save, npcIds)], registeredNpcNames: [] });
  return { state: result.state, warnings: result.warnings.map(code => `player_scene_state:${code}`) };
}

export function reduceNpcPhysicalObservation({ save, npcId, physical, evidence, storyText, expectedTurn, npcIds, master, parsedStory, sceneBefore, sceneAfter, observedNpcIds } = {}) {
  if (!registered(npcId, npcIds)) return { state: save.npc_scene_state?.[npcId] ?? {}, warnings: [`unknown_npc:${npcId}`] };
  if (!observedNpcSet({ save, npcIds, sceneBefore, sceneAfter, observedNpcIds }).has(npcId)) return { state: save.npc_scene_state?.[npcId] ?? {}, warnings: [`off_scene_npc:${npcId}`] };
  if (!object(physical) || !Object.keys(physical).length) return { state: save.npc_scene_state?.[npcId] ?? {}, warnings: [] };
  const result = buildSceneStatePatch({ previous: save.npc_scene_state?.[npcId] ?? {}, proposal: physical, evidenceMap: evidenceMap(physical, evidence, npcId), narrativeText: storyText, characterName: masterName(master, npcId), turnNumber: expectedTurn, actorId: npcId, npcsPresent: [...currentNpcIds(save, npcIds)], registeredNpcNames: [], npcDialogueLines: dialogueLines(parsedStory, npcId) });
  return { state: { ...result.state, present: save.npc_scene_state?.[npcId]?.present ?? true }, warnings: result.warnings.map(code => `npc_scene_state:${npcId}:${code}`) };
}

export function reducePlayerSexualObservation({ save, sexual, evidence, storyText, expectedTurn } = {}) {
  if (!object(sexual) || !Object.keys(sexual).length) return { state: save.player_sexual_state ?? {}, warnings: [] };
  const result = reducePlayerSexualState(save.player_sexual_state ?? {}, sexual, { storyEvidence: evidence, updatedTurn: expectedTurn, storyText });
  return result;
}

export function reduceNpcStatObservation({ save, npcId, stats, evidence, storyText, npcIds } = {}) {
  if (!registered(npcId, npcIds ?? new Set(Object.keys(save.npc_stats ?? {})))) return { state: save.npc_stats?.[npcId] ?? {}, warnings: [`unknown_npc:${npcId}`] };
  if (!object(stats) || !Object.keys(stats).length) return { state: save.npc_stats?.[npcId] ?? {}, warnings: [] };
  const { reason, reasons, ...deltas } = stats;
  const accepted = {};
  const warnings = [];
  for (const [key, value] of Object.entries(deltas)) {
    const legacyKey = key.endsWith('_delta') ? key.slice(0, -6) : key;
    const quote = exactDomainQuote(evidence, [['npc_stats', npcId, key], ['npc_stats', npcId, legacyKey]], storyText);
    if (quote) accepted[key] = value;
    else warnings.push(`stat_evidence_missing:${npcId}:${key}`);
  }
  if (!Object.keys(accepted).length) return { state: save.npc_stats?.[npcId] ?? {}, warnings };
  const result = applyNpcStatChanges(save.npc_stats?.[npcId] ?? {}, accepted, { reason: typeof reason === 'string' ? reason : '', reasons: object(reasons) ? reasons : {}, storyText, affinityQuote: exactDomainQuote(evidence, [['npc_stats', npcId, 'affinity_delta'], ['npc_stats', npcId, 'affinity']], storyText) ?? '' });
  return { state: result.state, warnings: [...warnings, ...(result.warnings ?? [])] };
}

function exactDomainQuote(evidence, candidates, storyText) {
  const roots = object(evidence) ? evidence : {};
  for (const path of candidates) {
    let value = roots;
    for (const key of path) value = object(value) ? value[key] : undefined;
    const quote = object(value) ? value.quote : value;
    if (typeof quote === 'string' && quote.trim() && String(storyText ?? '').includes(quote.trim())) return quote.trim();
  }
  for (const item of Object.values(roots)) {
    if (object(item) && Array.isArray(item.changed) && item.changed.some(path => candidates.some(candidate => candidate.join('.') === path)) && typeof item.quote === 'string' && String(storyText ?? '').includes(item.quote.trim())) return item.quote.trim();
  }
  return null;
}

export function reduceCsaAttitudeObservation({ save, npcId, attitude, expectedTurn, evidence, storyText } = {}) {
  if (!object(attitude) || !Object.keys(attitude).length) return { state: save.csa_attitudes?.[npcId] ?? {}, warnings: [] };
  const previous = save.csa_attitudes?.[npcId] ?? {};
  if (attitude.familiarity === previous.familiarity) return { state: previous, warnings: [] };
  const quote = exactDomainQuote(evidence, [['csa_attitudes', npcId, 'familiarity'], ['csa_attitude', npcId, 'familiarity']], storyText);
  if (typeof attitude.familiarity !== 'number' || !quote) return { state: previous, warnings: [`csa_attitude_evidence_missing:${npcId}`] };
  return { state: merge(previous, { familiarity: attitude.familiarity, last_changed_turn: expectedTurn }), warnings: [] };
}

export function reduceElapsedTimeObservation({ save, elapsedMinutes, evidence } = {}) {
  const before = save.world_state?.game_time ?? {};
  const after = advanceGameTime(before, elapsedMinutes, evidence);
  return { before, after, warnings: [] };
}

/* Legacy deterministic choice prose removed from the runtime authority. */
/*
  '현재 대화를 조금 더 이어간다.',
  '상대에게 지금 상황을 차분히 물어본다.',
  '주변 반응을 잠시 살펴본다.',
  '대화를 정리하고 다음 행동을 생각한다.'
*/

export function reduceStoryChoiceProjection({ parsedStory } = {}) {
  const observed = Array.isArray(parsedStory?.choices)
    ? parsedStory.choices.map(choice => typeof choice === 'string' ? choice.trim() : '')
    : [];
  const nonEmpty = observed.filter(Boolean);
  const unique = new Set(nonEmpty);
  const warnings = [];
  if (observed.length !== 4) warnings.push('choices_not_exactly_four');
  if (observed.some(choice => !choice)) warnings.push('choices_empty');
  if (unique.size !== nonEmpty.length) warnings.push('choices_exact_duplicate');
  const canonical = observed.length === 4 && observed.every(Boolean) && unique.size === 4;
  return { state: canonical ? clone(observed) : [], warnings };
}

export function reduceObservationDomains({ currentSave, observation, parsedStory, rawStory, expectedTurn, actionId, master, npcIds, sceneBefore, sceneAfter, observedNpcIds, explicitSpeakerIds } = {}) {
  const nextSave = hydrateGameplayState(currentSave, master ?? {});
  const warnings = [...(observation.warnings ?? [])];
  const evidence = observation.evidence ?? {};
  const eligibleNpcIds = new Set(observedNpcIds ?? [
    ...(sceneBefore?.present_npc_ids ?? []),
    ...(sceneAfter?.present_npc_ids ?? []),
    ...(explicitSpeakerIds ?? [])
  ]);
  const playerPhysical = reducePlayerPhysicalObservation({ save: nextSave, physical: observation.player_observation?.physical, evidence, storyText: rawStory, expectedTurn, npcIds, master });
  nextSave.player_scene_state = playerPhysical.state; warnings.push(...playerPhysical.warnings);
  const playerSexual = reducePlayerSexualObservation({ save: nextSave, sexual: observation.player_observation?.sexual, evidence, storyText: rawStory, expectedTurn });
  nextSave.player_sexual_state = playerSexual.state; warnings.push(...playerSexual.warnings);
  const sexualEvents = reduceSexualEventDomain({ save: nextSave, observation, expectedTurn, actionId, rawStory, npcIds });
  warnings.push(...sexualEvents.warnings);
  for (const [npcId, domains] of Object.entries(observation.npc_observations ?? {})) {
    if (!eligibleNpcIds.has(npcId)) {
      warnings.push(`off_scene_npc_observation_dropped:${npcId}`);
      continue;
    }
    const physical = reduceNpcPhysicalObservation({ save: nextSave, npcId, physical: domains.physical, evidence, storyText: rawStory, expectedTurn, npcIds, master, parsedStory, sceneBefore, sceneAfter, observedNpcIds: observedNpcIds ?? new Set([...(sceneBefore?.present_npc_ids ?? []), ...(sceneAfter?.present_npc_ids ?? []), ...(explicitSpeakerIds ?? [])]) });
    if (domains.physical) nextSave.npc_scene_state[npcId] = physical.state; warnings.push(...physical.warnings);
    const stats = reduceNpcStatObservation({ save: nextSave, npcId, stats: domains.stats, evidence, storyText: rawStory, npcIds });
    if (domains.stats && observation.outcome !== 'degraded') nextSave.npc_stats[npcId] = stats.state; warnings.push(...stats.warnings);
    const attitude = reduceCsaAttitudeObservation({ save: nextSave, npcId, attitude: domains.csa_attitude, expectedTurn, evidence, storyText: rawStory });
    if (domains.csa_attitude) nextSave.csa_attitudes[npcId] = attitude.state; warnings.push(...attitude.warnings);
  }
  const choices = reduceStoryChoiceProjection({ parsedStory });
  nextSave.last_choices = choices.state; warnings.push(...choices.warnings);
  const time = reduceElapsedTimeObservation({ save: nextSave, elapsedMinutes: observation.elapsed_minutes, evidence });
  nextSave.world_state = { ...(object(nextSave.world_state) ? nextSave.world_state : {}), game_time: time.after };
  return { nextSave, warnings, time_before: time.before, time_after: time.after, elapsed_minutes: observation.elapsed_minutes };
}
