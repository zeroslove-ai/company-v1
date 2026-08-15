import { appendSexualEvents, reduceEjaculationCounts } from '../sexual-state/ledger.js';

function reduceSexualEvents({ save, events, expectedTurn, actionId, storyText, npcIds, warnings } = {}) {
  const result = appendSexualEvents(save.sexual_event_ledger, events, {
    turnNumber: expectedTurn,
    actionId,
    storyText,
    npcIds: [...(npcIds ?? [])]
  });
  warnings.push(...result.warnings);
  return result;
}

export function reduceSexualEventObservations({ save, events, expectedTurn, actionId, storyText, npcIds } = {}) {
  const warnings = [];
  const result = reduceSexualEvents({ save, events, expectedTurn, actionId, storyText, npcIds, warnings });
  return { state: result.ledger, accepted: result.accepted, warnings };
}

/**
 * Sole fresh-turn writer for sexual/mechanical event state. General narrative
 * relation, event, emotion, and work meaning remains in Story/turn_summary.
 */
export function reduceSexualEventDomain({ save, observation, expectedTurn, actionId, rawStory, npcIds } = {}) {
  const warnings = [];
  const sexual = reduceSexualEvents({
    save,
    events: observation?.events?.sexual,
    expectedTurn,
    actionId,
    storyText: rawStory,
    npcIds,
    warnings
  });
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
