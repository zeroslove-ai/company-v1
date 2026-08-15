import { appendSexualEvents, reduceEjaculationCounts } from '../sexual-state/ledger.js';
import { clearRelationPresentationsForActors } from './relation-presentation.js';

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function clone(value) { return value === undefined ? undefined : structuredClone(value); }
function canonicalId(id) { return id === 'player' || (typeof id === 'string' && /^player[-_]/i.test(id)) ? 'player' : id; }

function masterName(master, id) {
  const all = [
    ...(Array.isArray(master?.characters) ? master.characters : []),
    ...(Array.isArray(master?.general_npcs) ? master.general_npcs : [])
  ];
  return all.find(item => item?.character_id === id || item?.id === id || item?.npc_id === id)?.name ?? '';
}

function dialogueLines(parsedStory, id) {
  return Array.isArray(parsedStory?.dialogue_lines)
    ? parsedStory.dialogue_lines
      .filter(line => line?.speaker_id === id)
      .map(line => line.text ?? line.dialogue ?? '')
      .filter(Boolean)
    : [];
}

function findQuote(evidence, path) {
  for (const item of Object.values(object(evidence) ? evidence : {})) {
    if (object(item) && Array.isArray(item.changed) && item.changed.includes(path)
      && typeof item.quote === 'string' && item.quote.trim()) return item.quote.trim();
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

export function reduceNpcRelationshipObservation({ save, npcId, relationship, evidence, storyText, master, parsedStory } = {}) {
  if (!object(relationship) || !Object.keys(relationship).length) return { state: save.npc_relationship_state?.[npcId] ?? {}, warnings: [] };
  const previous = save.npc_relationship_state?.[npcId] ?? {};
  const warnings = [];
  let state = previous;
  for (const field of ['closeness', 'romance_status', 'current_boundary']) {
    if (!Object.hasOwn(relationship, field)) continue;
    const gated = gateField({
      patch: { [field]: relationship[field] }, previous, path: 'npc_relationship_state',
      evidence, storyText, characterName: masterName(master, npcId),
      dialogue: dialogueLines(parsedStory, npcId), npcId, field
    });
    if (Object.hasOwn(gated.patch, field)) state = { ...state, [field]: gated.patch[field] };
    if (gated.warning) warnings.push(gated.warning);
  }
  return { state, warnings };
}

function known(id, npcIds) {
  return typeof id === 'string' && id.trim() && (id === 'player' || !npcIds?.size || npcIds.has(id));
}

function relationKey(item) {
  return `${canonicalId(item.actor_id)}\u0000${canonicalId(item.target_id)}\u0000${item.relation_kind}`;
}

function applyRelationInput(relations, input, expectedTurn, warnings, clearedActors) {
  const key = relationKey(input);
  const index = relations.findIndex(item => relationKey(item) === key);
  if (input.state === 'ended') {
    if (index >= 0 && relations[index].state === 'active') {
      relations[index] = { ...relations[index], state: 'ended', updated_turn: expectedTurn, end_quote: input.quote };
      clearedActors.add(input.actor_id);
    } else {
      warnings.push(`relation_end_without_active:${input.actor_id}:${input.target_id}:${input.relation_kind}`);
    }
    return;
  }
  for (let i = 0; i < relations.length; i += 1) {
    if (relations[i].state === 'active' && relations[i].actor_id === input.actor_id && relationKey(relations[i]) !== key) {
      relations[i] = { ...relations[i], state: 'ended', updated_turn: expectedTurn, end_reason: `superseded_by_${input.source ?? 'structured'}_relation` };
      clearedActors.add(relations[i].actor_id);
    }
  }
  const relation = {
    actor_id: input.actor_id,
    target_id: input.target_id,
    relation_kind: input.relation_kind,
    source_rule_id: input.source_rule_id ?? null,
    source: input.source ?? 'extract',
    state: 'active',
    started_turn: index >= 0 ? relations[index].started_turn ?? expectedTurn : expectedTurn,
    updated_turn: expectedTurn,
    ...(input.quote ? { quote: input.quote } : {})
  };
  if (index >= 0) relations[index] = relation;
  else relations.push(relation);
}

function reduceRelationInputs({ save, relationUpdates, expectedTurn, storyText, npcIds } = {}) {
  const warnings = [];
  const relations = (Array.isArray(save?.active_relations) ? save.active_relations : []).map(item => ({ ...item }));
  const clearedActors = new Set();
  for (const update of Array.isArray(relationUpdates) ? relationUpdates : []) {
    if (!known(update?.actor_id, npcIds) || !known(update?.target_id, npcIds) || canonicalId(update.actor_id) === canonicalId(update.target_id)) {
      warnings.push(`relation_target_unresolved:${update?.actor_id ?? 'unknown'}:${update?.target_id ?? 'unknown'}`);
      continue;
    }
    if (!RELATION_KINDS.has(update?.relation_kind)) {
      warnings.push(`relation_kind_unknown:${update?.relation_kind ?? 'unknown'}`);
      continue;
    }
    if (typeof update.quote !== 'string' || !update.quote.trim() || !String(storyText ?? '').includes(update.quote.trim())) {
      warnings.push(`relation_evidence_missing:${update.actor_id}`);
      continue;
    }
    applyRelationInput(relations, { ...update, source: 'extract' }, expectedTurn, warnings, clearedActors);
  }

  const state = relations.slice(-80);
  const activeActors = new Set(state.filter(item => item.state === 'active').map(item => item.actor_id));
  return { state, warnings, clearedPresentationActorIds: [...clearedActors].filter(id => !activeActors.has(id)) };
}

function eventKey(event) {
  return event?.event_id || JSON.stringify(event);
}

function registeredParticipant(id, npcIds) {
  const canonical = canonicalId(id);
  return canonical === 'player' || (npcIds instanceof Set && npcIds.has(canonical));
}

function reduceGeneralEvents(previousLedger, events, storyText, warnings, npcIds) {
  const previous = Array.isArray(previousLedger) ? previousLedger : [];
  const seen = new Set(previous.map(eventKey));
  const next = [...previous];
  for (const event of Array.isArray(events) ? events : []) {
    let normalizedEvent = clone(event);
    if (Array.isArray(event?.participants)) {
      const participants = event.participants.map(canonicalId);
      const unknown = participants.find(id => !registeredParticipant(id, npcIds));
      if (participants.some(id => typeof id !== 'string' || !id.trim()) || unknown) {
        warnings.push(`general_event_participant_unresolved:${unknown ?? 'empty'}`);
        continue;
      }
      normalizedEvent = { ...normalizedEvent, participants: [...new Set(participants)] };
    }
    if (!normalizedEvent?.evidence || !String(storyText ?? '').includes(normalizedEvent.evidence)) {
      warnings.push('general_event_evidence_missing');
      continue;
    }
    const key = eventKey(normalizedEvent);
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(normalizedEvent);
  }
  return next.slice(-80);
}

export function reduceGeneralEventObservations({ save, events, storyText = '', npcIds } = {}) {
  const warnings = [];
  const state = reduceGeneralEvents(save?.event_ledger, events, storyText, warnings, npcIds);
  return { state, warnings };
}

function reduceSexualEvents({ save, events, expectedTurn, actionId, storyText, npcIds, warnings } = {}) {
  const result = appendSexualEvents(save.sexual_event_ledger, events, { turnNumber: expectedTurn, actionId, storyText, npcIds: [...(npcIds ?? [])] });
  warnings.push(...result.warnings);
  return result;
}

export function reduceSexualEventObservations({ save, events, expectedTurn, actionId, storyText, npcIds } = {}) {
  const warnings = [];
  const result = reduceSexualEvents({ save, events, expectedTurn, actionId, storyText, npcIds, warnings });
  return { state: result.ledger, accepted: result.accepted, warnings };
}

/**
 * Sole fresh-turn writer for relation, relationship-consequence, and event
 * domains. Exact Extract observations are typed inputs; this reducer owns
 * validation, dedupe, supersession, and presentation cleanup.
 */
export function reduceRelationEventDomains({ save, observation, expectedTurn, actionId, rawStory, master, npcIds, parsedStory } = {}) {
  const warnings = [];
  const relationResult = reduceRelationInputs({
    save, relationUpdates: observation?.relation_updates,
    expectedTurn, storyText: rawStory, npcIds
  });
  save.active_relations = relationResult.state;
  clearRelationPresentationsForActors(save, relationResult.clearedPresentationActorIds);
  warnings.push(...relationResult.warnings);

  save.npc_relationship_state = object(save.npc_relationship_state) ? save.npc_relationship_state : {};

  for (const [npcId, domains] of Object.entries(observation?.npc_observations ?? {})) {
    if (!object(domains?.relationship)) continue;
    if (!known(npcId, npcIds) || npcId === 'player') {
      warnings.push(`relationship_actor_unresolved:${npcId}`);
      continue;
    }
    const relationship = reduceNpcRelationshipObservation({ save, npcId, relationship: domains.relationship, evidence: observation.evidence, storyText: rawStory, master, parsedStory });
    save.npc_relationship_state[npcId] = relationship.state;
    warnings.push(...relationship.warnings);
  }

  save.event_ledger = reduceGeneralEvents(save.event_ledger, observation?.events?.general, rawStory, warnings, npcIds);
  const sexual = reduceSexualEvents({ save, events: observation?.events?.sexual, expectedTurn, actionId, storyText: rawStory, npcIds, warnings });
  save.sexual_event_ledger = sexual.ledger;
  if (sexual.accepted.length) {
    save.ejaculation_counts = reduceEjaculationCounts(save.ejaculation_counts ?? {}, sexual.accepted);
    const playerEvent = [...sexual.accepted].reverse().find(event => event.actor_id === 'player' || event.target_id === 'player');
    if (playerEvent) save.player_sexual_state = {
      ...save.player_sexual_state,
      last_sexual_event: { turn: playerEvent.turn, type: playerEvent.action_type, evidence: playerEvent.evidence }
    };
  }
  return { nextSave: save, warnings };
}
