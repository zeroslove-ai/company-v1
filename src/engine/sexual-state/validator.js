/**
 * Guards the boundary between "a sexual event happened" (sexual_event_ledger, arousal, CSA
 * direct execution) and "the relationship advanced" (npc_relationship_state.intimacy_stage).
 * Ported from donor's mergeStructuredIntimacyState gate: a completed sexual event via the
 * a non-voluntary route never advances intimacy stage on its own — only a genuinely voluntary
 * event, with its own independent evidence, can. This is the concrete enforcement of
 * "physical reactions ≠ consent" and "a sexual event ≠ automatic relationship-stage
 * advancement" from the CSA relationship guard contract.
 */
const STAGE_RANK = { none: 0, romantic_interest: 1, kissed: 2, sexual_touch: 3, oral: 4, intercourse: 5 };
const STAGE_FOR_ACTION = { kiss: 'kissed', sexual_touch: 'sexual_touch', oral: 'oral', penetration: 'intercourse' };

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * event: a single accepted sexual_event_ledger entry (see ledger.js).
 * route: the upstream authorization label, if any. Only 'voluntary' can advance the stage.
 * currentStage: the NPC's current npc_relationship_state.intimacy_stage.
 * Returns the next stage (only ever one rank forward, never skipping) or null if the event
 * doesn't justify any stage change at all.
 */
export function resolveIntimacyStageAdvancement({ event, route, currentStage = 'none' } = {}) {
  if (!isPlainObject(event) || !event.completed) return null;
  if (route !== 'voluntary') return null;
  const targetStage = STAGE_FOR_ACTION[event.action_type];
  if (!targetStage) return null;
  const currentRank = STAGE_RANK[currentStage] ?? 0;
  const targetRank = STAGE_RANK[targetStage];
  if (targetRank !== currentRank + 1) return null; // no stage-skipping — must be exactly the next rank
  return targetStage;
}

/**
 * A relationship_state patch proposing an intimacy_stage change must go through
 * resolveIntimacyStageAdvancement's result, never be taken from Extract's own free proposal
 * directly — this function is the single point that decides whether a proposed stage value is
 * actually allowed given this turn's accepted sexual events and their routes.
 */
export function validateIntimacyStagePatch({ proposedStage, currentStage = 'none', acceptedEventsWithRoutes = [] } = {}) {
  if (proposedStage === undefined || proposedStage === currentStage) return { ok: true, stage: currentStage };
  const allowed = new Set(acceptedEventsWithRoutes.map(({ event, route }) => resolveIntimacyStageAdvancement({ event, route, currentStage })).filter(Boolean));
  if (allowed.has(proposedStage)) return { ok: true, stage: proposedStage };
  return { ok: false, stage: currentStage, warning: 'unauthorized_intimacy_stage_advancement' };
}
