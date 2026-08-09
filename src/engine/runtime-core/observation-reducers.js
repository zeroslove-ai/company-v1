import { advanceGameTime, hydrateGameplayState, reducePlayerSexualState } from '../gameplay-state.js';
import { buildFallbackTurnChoices } from '../guarded-merge.js';
import { buildSceneStatePatch } from '../state/physical-state.js';
import { applyNpcStatChanges } from '../relationship/reducer.js';
import { appendSexualEvents, reduceEjaculationCounts } from '../sexual-state/ledger.js';
import { hydrateCanonicalScene } from './scene-reducer.js';

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
  return { ...(object(proposal?.evidence) ? proposal.evidence : {}), clothing: clothingQuote(evidence, actorId) };
}
function findQuote(evidence, path) {
  for (const item of Object.values(object(evidence) ? evidence : {})) {
    if (object(item) && Array.isArray(item.changed) && item.changed.includes(path) && typeof item.quote === 'string' && item.quote.trim()) return item.quote.trim();
  }
  return null;
}
function fieldEvidence({ evidence, path, quote, storyText, characterName, dialogue }) {
  if (typeof quote !== 'string' || !quote.trim()) return 'evidence_missing';
  if (!String(storyText ?? '').includes(quote.trim())) return 'evidence_quote_not_in_story';
  if ((characterName && quote.includes(characterName)) || dialogue.some(line => quote.includes(line) || line.includes(quote))) return null;
  return 'evidence_actor_mismatch';
}
function gateField({ patch, previous, path, evidence, storyText, characterName, dialogue, npcId, field }) {
  if (!(field in patch) || patch[field] === previous?.[field]) return { patch, warning: null };
  const verdict = fieldEvidence({ evidence, path: `${path}.${npcId}.${field}`, quote: findQuote(evidence, `${path}.${npcId}.${field}`), storyText, characterName, dialogue });
  if (!verdict) return { patch, warning: null };
  const next = { ...patch };
  delete next[field];
  return { patch: next, warning: `${verdict}:${path}.${npcId}.${field}` };
}
function registered(id, npcIds) { return typeof id === 'string' && (!npcIds?.size || npcIds.has(id)); }
function currentNpcIds(save, npcIds) {
  const scene = hydrateCanonicalScene(save, { npcIds });
  return new Set(scene.present_npc_ids ?? []);
}

export function reducePlayerPhysicalObservation({ save, physical, evidence, storyText, expectedTurn, npcIds, master } = {}) {
  if (!object(physical) || !Object.keys(physical).length) return { state: save.player_scene_state ?? {}, warnings: [] };
  const result = buildSceneStatePatch({ previous: save.player_scene_state ?? {}, proposal: physical, evidenceMap: evidenceMap(physical, evidence, 'player'), narrativeText: storyText, characterName: '', turnNumber: expectedTurn, actorId: 'player', npcsPresent: [...currentNpcIds(save, npcIds)], registeredNpcNames: [] });
  return { state: result.state, warnings: result.warnings.map(code => `player_scene_state:${code}`) };
}

export function reduceNpcPhysicalObservation({ save, npcId, physical, evidence, storyText, expectedTurn, npcIds, master, parsedStory } = {}) {
  if (!registered(npcId, npcIds)) return { state: save.npc_scene_state?.[npcId] ?? {}, warnings: [`unknown_npc:${npcId}`] };
  if (!currentNpcIds(save, npcIds).has(npcId)) return { state: save.npc_scene_state?.[npcId] ?? {}, warnings: [`off_scene_npc:${npcId}`] };
  if (!object(physical) || !Object.keys(physical).length) return { state: save.npc_scene_state?.[npcId] ?? {}, warnings: [] };
  const result = buildSceneStatePatch({ previous: save.npc_scene_state?.[npcId] ?? {}, proposal: physical, evidenceMap: evidenceMap(physical, evidence, npcId), narrativeText: storyText, characterName: masterName(master, npcId), turnNumber: expectedTurn, actorId: npcId, npcsPresent: [...currentNpcIds(save, npcIds)], registeredNpcNames: [], npcDialogueLines: dialogueLines(parsedStory, npcId) });
  return { state: { ...result.state, present: save.npc_scene_state?.[npcId]?.present ?? true }, warnings: result.warnings.map(code => `npc_scene_state:${npcId}:${code}`) };
}

export function reducePlayerSexualObservation({ save, sexual, evidence, storyText, expectedTurn } = {}) {
  if (!object(sexual) || !Object.keys(sexual).length) return { state: save.player_sexual_state ?? {}, warnings: [] };
  const result = reducePlayerSexualState(save.player_sexual_state ?? {}, sexual, { storyEvidence: evidence, updatedTurn: expectedTurn, storyText });
  return result;
}

export function reduceNpcStatObservation({ save, npcId, stats, evidence, storyText } = {}) {
  if (!registered(npcId, new Set(Object.keys(save.npc_stats ?? {})))) return { state: save.npc_stats?.[npcId] ?? {}, warnings: [`unknown_npc:${npcId}`] };
  if (!object(stats) || !Object.keys(stats).length) return { state: save.npc_stats?.[npcId] ?? {}, warnings: [] };
  const { reason, reasons, ...deltas } = stats;
  const affinity = object(evidence?.npc_stats?.[npcId]?.affinity) ? evidence.npc_stats[npcId].affinity.quote : '';
  const result = applyNpcStatChanges(save.npc_stats?.[npcId] ?? {}, deltas, { reason: typeof reason === 'string' ? reason : '', reasons: object(reasons) ? reasons : {}, storyText, affinityQuote: typeof affinity === 'string' ? affinity : '' });
  return result;
}

export function reduceNpcEmotionObservation({ save, npcId, emotion, evidence, storyText, master, parsedStory } = {}) {
  if (!object(emotion) || !Object.keys(emotion).length) return { state: save.npc_emotion?.[npcId] ?? {}, warnings: [] };
  const previous = save.npc_emotion?.[npcId] ?? {};
  const gated = gateField({ patch: emotion, previous, path: 'npc_emotion', evidence, storyText, characterName: masterName(master, npcId), dialogue: dialogueLines(parsedStory, npcId), npcId, field: 'mood' });
  return { state: merge(previous, gated.patch), warnings: gated.warning ? [gated.warning] : [] };
}

export function reduceNpcRelationshipObservation({ save, npcId, relationship, evidence, storyText, master, parsedStory, expectedTurn } = {}) {
  if (!object(relationship) || !Object.keys(relationship).length) return { state: save.npc_relationship_state?.[npcId] ?? {}, warnings: [] };
  const previous = save.npc_relationship_state?.[npcId] ?? {};
  const next = { ...relationship };
  delete next.relationship_summary;
  delete next.milestones;
  const gated = gateField({ patch: next, previous, path: 'npc_relationship_state', evidence, storyText, characterName: masterName(master, npcId), dialogue: dialogueLines(parsedStory, npcId), npcId, field: 'current_boundary' });
  const warnings = gated.warning ? [gated.warning] : [];
  if (relationship.milestones) warnings.push(`derived_milestones_ignored:${npcId}`);
  return { state: merge(previous, gated.patch), warnings };
}

export function reduceNpcWorkObservation({ save, npcId, work } = {}) {
  if (!object(work) || !Object.keys(work).length) return { state: save.npc_work_state?.[npcId] ?? {}, warnings: [] };
  return { state: merge(save.npc_work_state?.[npcId] ?? {}, { task: typeof work.task === 'string' ? work.task : null }), warnings: [] };
}

export function reduceCsaAttitudeObservation({ save, npcId, attitude, expectedTurn } = {}) {
  if (!object(attitude) || !Object.keys(attitude).length) return { state: save.csa_attitudes?.[npcId] ?? {}, warnings: [] };
  const next = {};
  if (typeof attitude.familiarity === 'number') next.familiarity = attitude.familiarity;
  if (typeof attitude.resistance === 'number') return { state: save.csa_attitudes?.[npcId] ?? {}, warnings: [`csa_attitude_resistance_ignored:${npcId}`] };
  next.last_changed_turn = expectedTurn;
  return { state: merge(save.csa_attitudes?.[npcId] ?? {}, next), warnings: [] };
}

export function reduceGeneralEventObservations({ save, events } = {}) {
  if (!Array.isArray(events) || !events.length) return { state: Array.isArray(save.event_ledger) ? save.event_ledger : [], warnings: [] };
  const existing = Array.isArray(save.event_ledger) ? save.event_ledger : [];
  const seen = new Set(existing.map(event => event?.event_id).filter(Boolean));
  const next = [...existing];
  for (const event of events) {
    if (event?.event_id && seen.has(event.event_id)) continue;
    if (event?.event_id) seen.add(event.event_id);
    next.push(clone(event));
  }
  return { state: next.slice(-80), warnings: [] };
}

export function reduceSexualEventObservations({ save, events, expectedTurn, actionId, storyText, npcIds } = {}) {
  if (!Array.isArray(events) || !events.length) return { state: Array.isArray(save.sexual_event_ledger) ? save.sexual_event_ledger : [], accepted: [], warnings: [] };
  const result = appendSexualEvents(save.sexual_event_ledger, events, { turnNumber: expectedTurn, actionId, storyText, npcIds: [...(npcIds ?? [])] });
  return result;
}

export function reduceElapsedTimeObservation({ save, elapsedMinutes, evidence } = {}) {
  const before = save.world_state?.game_time ?? {};
  const after = advanceGameTime(before, elapsedMinutes, evidence);
  return { before, after, warnings: [] };
}

export function reduceStoryChoiceProjection({ save, parsedStory, master, focalName = '' } = {}) {
  const choices = Array.isArray(parsedStory?.choices) ? clone(parsedStory.choices) : [];
  if (choices.length >= 4) return { state: choices.slice(0, 4), warnings: [] };
  const state = [...choices];
  for (const fill of buildFallbackTurnChoices(save, { focalName })) {
    if (!state.includes(fill)) state.push(fill);
    if (state.length === 4) break;
  }
  return { state: state.slice(0, 4), warnings: [`choices_padded:${choices.length}->${state.length}`] };
}

export function reduceObservationDomains({ currentSave, observation, parsedStory, rawStory, expectedTurn, actionId, master, npcIds } = {}) {
  const nextSave = hydrateGameplayState(currentSave, master ?? {});
  const warnings = [...(observation.warnings ?? [])];
  const evidence = observation.evidence ?? {};
  const playerPhysical = reducePlayerPhysicalObservation({ save: nextSave, physical: observation.player_observation?.physical, evidence, storyText: rawStory, expectedTurn, npcIds, master });
  nextSave.player_scene_state = playerPhysical.state; warnings.push(...playerPhysical.warnings);
  const playerSexual = reducePlayerSexualObservation({ save: nextSave, sexual: observation.player_observation?.sexual, evidence, storyText: rawStory, expectedTurn });
  nextSave.player_sexual_state = playerSexual.state; warnings.push(...playerSexual.warnings);
  for (const [npcId, domains] of Object.entries(observation.npc_observations ?? {})) {
    const physical = reduceNpcPhysicalObservation({ save: nextSave, npcId, physical: domains.physical, evidence, storyText: rawStory, expectedTurn, npcIds, master, parsedStory });
    if (domains.physical) nextSave.npc_scene_state[npcId] = physical.state; warnings.push(...physical.warnings);
    const emotion = reduceNpcEmotionObservation({ save: nextSave, npcId, emotion: domains.emotion, evidence, storyText: rawStory, master, parsedStory });
    if (domains.emotion) nextSave.npc_emotion[npcId] = emotion.state; warnings.push(...emotion.warnings);
    const relationship = reduceNpcRelationshipObservation({ save: nextSave, npcId, relationship: domains.relationship, evidence, storyText: rawStory, master, parsedStory, expectedTurn });
    if (domains.relationship) nextSave.npc_relationship_state[npcId] = relationship.state; warnings.push(...relationship.warnings);
    const stats = reduceNpcStatObservation({ save: nextSave, npcId, stats: domains.stats, evidence, storyText: rawStory });
    if (domains.stats && observation.outcome !== 'degraded') nextSave.npc_stats[npcId] = stats.state; warnings.push(...stats.warnings);
    const work = reduceNpcWorkObservation({ save: nextSave, npcId, work: domains.work });
    if (domains.work) nextSave.npc_work_state[npcId] = work.state; warnings.push(...work.warnings);
    const attitude = reduceCsaAttitudeObservation({ save: nextSave, npcId, attitude: domains.csa_attitude, expectedTurn });
    if (domains.csa_attitude) nextSave.csa_attitudes[npcId] = attitude.state; warnings.push(...attitude.warnings);
  }
  const general = reduceGeneralEventObservations({ save: nextSave, events: observation.events?.general });
  nextSave.event_ledger = general.state; warnings.push(...general.warnings);
  const sexual = reduceSexualEventObservations({ save: nextSave, events: observation.events?.sexual, expectedTurn, actionId, storyText: rawStory, npcIds });
  nextSave.sexual_event_ledger = sexual.state; warnings.push(...sexual.warnings);
  if (sexual.accepted?.length) {
    nextSave.ejaculation_counts = reduceEjaculationCounts(nextSave.ejaculation_counts ?? {}, sexual.accepted);
    const playerEvent = [...sexual.accepted].reverse().find(event => event.actor_id === 'player' || event.target_id === 'player');
    if (playerEvent) nextSave.player_sexual_state = { ...nextSave.player_sexual_state, last_sexual_event: { turn: playerEvent.turn, type: playerEvent.action_type, evidence: playerEvent.evidence } };
  }
  const choices = reduceStoryChoiceProjection({ save: nextSave, parsedStory, master });
  nextSave.last_choices = choices.state; warnings.push(...choices.warnings);
  const time = reduceElapsedTimeObservation({ save: nextSave, elapsedMinutes: observation.elapsed_minutes, evidence });
  nextSave.world_state = { ...(object(nextSave.world_state) ? nextSave.world_state : {}), game_time: time.after };
  return { nextSave, warnings, time_before: time.before, time_after: time.after, elapsed_minutes: observation.elapsed_minutes };
}
