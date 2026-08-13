import { advanceGameTime, hydrateGameplayState, reducePlayerSexualState } from '../gameplay-state.js';
import { buildSceneStatePatch } from '../state/physical-state.js';
import { applyNpcStatChanges } from '../relationship/reducer.js';
import { appendSexualEvents, reduceEjaculationCounts } from '../sexual-state/ledger.js';
import { hydrateCanonicalScene } from './scene-reducer.js';
import { RELATION_KINDS } from '../csa/execution-policy.js';

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
  const gatedPatch = { ...patch };
  delete gatedPatch[field];
  return { patch: gatedPatch, warning: `${verdict}:${path}.${npcId}.${field}` };
}
function registered(id, npcIds) { return typeof id === 'string' && (!npcIds?.size || npcIds.has(id)); }
function currentNpcIds(save, npcIds) {
  const scene = hydrateCanonicalScene(save, { npcIds });
  return new Set(scene.present_npc_ids ?? []);
}

function reduceRelationUpdates({ save, updates, expectedTurn, storyText } = {}) {
  const previous = Array.isArray(save?.active_relations) ? save.active_relations : [];
  const next = previous.map(item => ({ ...item }));
  const warnings = [];
  const explicitlyEndedActors = new Set();
  for (const update of Array.isArray(updates) ? updates : []) {
    if (!update?.actor_id || !update?.target_id || !update?.relation_kind || !update?.state) continue;
    if (!RELATION_KINDS.has(update.relation_kind)) {
      warnings.push(`relation_kind_unknown:${update.relation_kind}`);
      continue;
    }
    if (typeof update.quote !== 'string' || !update.quote.trim() || !String(storyText ?? '').includes(update.quote.trim())) {
      warnings.push(`relation_evidence_missing:${update.actor_id}`);
      continue;
    }
    const index = next.findIndex(item => item.actor_id === update.actor_id && item.target_id === update.target_id && item.relation_kind === update.relation_kind);
    if (update.state === 'ended') {
      if (index >= 0 && next[index].state === 'active') {
        next[index] = { ...next[index], state: 'ended', updated_turn: expectedTurn, end_quote: update.quote };
        explicitlyEndedActors.add(update.actor_id);
      }
      else warnings.push(`relation_end_without_active:${update.actor_id}:${update.target_id}:${update.relation_kind}`);
      continue;
    }
    const relation = {
      actor_id: update.actor_id,
      target_id: update.target_id,
      relation_kind: update.relation_kind,
      state: 'active',
      started_turn: index >= 0 ? next[index].started_turn ?? expectedTurn : expectedTurn,
      updated_turn: expectedTurn,
      source: 'extract',
      quote: update.quote
    };
    // One actor cannot keep two competing active relation targets.  A new
    // structured start closes only the actor's prior relation; it never uses
    // free-form position labels as an implicit target selector.
    for (let i = 0; i < next.length; i += 1) {
      if (next[i].state === 'active' && next[i].actor_id === update.actor_id && next[i].target_id !== update.target_id) {
        next[i] = { ...next[i], state: 'ended', updated_turn: expectedTurn, end_reason: 'superseded_by_structured_relation' };
      }
    }
    if (index >= 0) next[index] = relation;
    else next.push(relation);
  }
  const clearedPresentationActorIds = [...explicitlyEndedActors]
    .filter(actorId => !next.some(item => item.state === 'active' && item.actor_id === actorId));
  return { state: next.slice(-80), warnings, clearedPresentationActorIds };
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

export function reduceNpcEmotionObservation({ save, npcId, emotion, evidence, storyText, master, parsedStory } = {}) {
  if (!object(emotion) || !Object.keys(emotion).length) return { state: save.npc_emotion?.[npcId] ?? {}, warnings: [] };
  const previous = save.npc_emotion?.[npcId] ?? {};
  const gated = gateField({ patch: emotion, previous, path: 'npc_emotion', evidence, storyText, characterName: masterName(master, npcId), dialogue: dialogueLines(parsedStory, npcId), npcId, field: 'mood' });
  return { state: merge(previous, gated.patch), warnings: gated.warning ? [gated.warning] : [] };
}

export function reduceNpcRelationshipObservation({ save, npcId, relationship, evidence, storyText, master, parsedStory, expectedTurn } = {}) {
  if (!object(relationship) || !Object.keys(relationship).length) return { state: save.npc_relationship_state?.[npcId] ?? {}, warnings: [] };
  const previous = save.npc_relationship_state?.[npcId] ?? {};
  const warnings = [];
  let state = previous;
  for (const field of ['closeness', 'romance_status', 'current_boundary']) {
    if (!Object.hasOwn(relationship, field)) continue;
    const proposal = { [field]: relationship[field] };
    const gated = gateField({ patch: proposal, previous: state, path: 'npc_relationship_state', evidence, storyText, characterName: masterName(master, npcId), dialogue: dialogueLines(parsedStory, npcId), npcId, field });
    if (Object.hasOwn(gated.patch, field)) state = { ...state, [field]: gated.patch[field] };
    if (gated.warning) warnings.push(gated.warning);
  }
  return { state, warnings };
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

export function reduceNpcWorkObservation({ save, npcId, work, evidence, storyText } = {}) {
  if (!object(work) || !Object.keys(work).length) return { state: save.npc_work_state?.[npcId] ?? {}, warnings: [] };
  const previous = save.npc_work_state?.[npcId] ?? {};
  if (work.task === previous.task) return { state: previous, warnings: [] };
  const quote = exactDomainQuote(evidence, [['npc_work_state', npcId, 'task'], ['npc_work', npcId, 'task'], ['work', npcId, 'task']], storyText);
  if (!quote) return { state: previous, warnings: [`work_evidence_missing:${npcId}`] };
  return { state: merge(previous, { task: work.task }), warnings: [] };
}

export function reduceCsaAttitudeObservation({ save, npcId, attitude, expectedTurn, evidence, storyText } = {}) {
  if (!object(attitude) || !Object.keys(attitude).length) return { state: save.csa_attitudes?.[npcId] ?? {}, warnings: [] };
  const previous = save.csa_attitudes?.[npcId] ?? {};
  if (attitude.familiarity === previous.familiarity) return { state: previous, warnings: [] };
  const quote = exactDomainQuote(evidence, [['csa_attitudes', npcId, 'familiarity'], ['csa_attitude', npcId, 'familiarity']], storyText);
  if (typeof attitude.familiarity !== 'number' || !quote) return { state: previous, warnings: [`csa_attitude_evidence_missing:${npcId}`] };
  return { state: merge(previous, { familiarity: attitude.familiarity, last_changed_turn: expectedTurn }), warnings: [] };
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
  return { state: result.ledger, accepted: result.accepted, warnings: result.warnings };
}

export function reduceElapsedTimeObservation({ save, elapsedMinutes, evidence } = {}) {
  const before = save.world_state?.game_time ?? {};
  const after = advanceGameTime(before, elapsedMinutes, evidence);
  return { before, after, warnings: [] };
}

const DETERMINISTIC_CHOICE_FALLBACKS = [
  '현재 대화를 조금 더 이어간다.',
  '상대에게 지금 상황을 차분히 물어본다.',
  '주변 반응을 잠시 살펴본다.',
  '대화를 정리하고 다음 행동을 생각한다.'
];

export function reduceStoryChoiceProjection({ parsedStory, allowDeterministicFallback = false } = {}) {
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
  if (allowDeterministicFallback && !canonical && nonEmpty.length <= 4) {
    const state = [...new Set(nonEmpty)];
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
  const relations = reduceRelationUpdates({ save: nextSave, updates: observation.relation_updates, expectedTurn, storyText: rawStory });
  nextSave.active_relations = relations.state;
  for (const actorId of relations.clearedPresentationActorIds ?? []) {
    const current = nextSave.npc_scene_state?.[actorId];
    if (!object(current) || !Object.hasOwn(current, 'position_label')) continue;
    nextSave.npc_scene_state[actorId] = { ...current, position_label: null };
  }
  warnings.push(...relations.warnings);
  for (const [npcId, domains] of Object.entries(observation.npc_observations ?? {})) {
    if (!eligibleNpcIds.has(npcId)) {
      warnings.push(`off_scene_npc_observation_dropped:${npcId}`);
      continue;
    }
    const physical = reduceNpcPhysicalObservation({ save: nextSave, npcId, physical: domains.physical, evidence, storyText: rawStory, expectedTurn, npcIds, master, parsedStory, sceneBefore, sceneAfter, observedNpcIds: observedNpcIds ?? new Set([...(sceneBefore?.present_npc_ids ?? []), ...(sceneAfter?.present_npc_ids ?? []), ...(explicitSpeakerIds ?? [])]) });
    if (domains.physical) nextSave.npc_scene_state[npcId] = physical.state; warnings.push(...physical.warnings);
    const emotion = reduceNpcEmotionObservation({ save: nextSave, npcId, emotion: domains.emotion, evidence, storyText: rawStory, master, parsedStory });
    if (domains.emotion) nextSave.npc_emotion[npcId] = emotion.state; warnings.push(...emotion.warnings);
    const relationship = reduceNpcRelationshipObservation({ save: nextSave, npcId, relationship: domains.relationship, evidence, storyText: rawStory, master, parsedStory, expectedTurn });
    if (domains.relationship) nextSave.npc_relationship_state[npcId] = relationship.state; warnings.push(...relationship.warnings);
    const stats = reduceNpcStatObservation({ save: nextSave, npcId, stats: domains.stats, evidence, storyText: rawStory, npcIds });
    if (domains.stats && observation.outcome !== 'degraded') nextSave.npc_stats[npcId] = stats.state; warnings.push(...stats.warnings);
    const work = reduceNpcWorkObservation({ save: nextSave, npcId, work: domains.work, evidence, storyText: rawStory });
    if (domains.work) nextSave.npc_work_state[npcId] = work.state; warnings.push(...work.warnings);
    const attitude = reduceCsaAttitudeObservation({ save: nextSave, npcId, attitude: domains.csa_attitude, expectedTurn, evidence, storyText: rawStory });
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
  const choices = reduceStoryChoiceProjection({ save: nextSave, parsedStory, master, allowDeterministicFallback: true });
  nextSave.last_choices = choices.state; warnings.push(...choices.warnings);
  const time = reduceElapsedTimeObservation({ save: nextSave, elapsedMinutes: observation.elapsed_minutes, evidence });
  nextSave.world_state = { ...(object(nextSave.world_state) ? nextSave.world_state : {}), game_time: time.after };
  return { nextSave, warnings, time_before: time.before, time_after: time.after, elapsed_minutes: observation.elapsed_minutes };
}
