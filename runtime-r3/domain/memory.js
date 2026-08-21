import { canonicalActors, canonicalLocation, productPremise, relevantActorIds } from './content.js';

const bounded = (value, max) => String(value ?? '').slice(0, max);

export function buildStoryContext(context, literalAction, { content, opening = false } = {}) {
  const state = context?.state?.state ?? {};
  const turns = Array.isArray(context?.turns) ? context.turns : [];
  const location = canonicalLocation(content, state.scene?.location_id);
  const actorIds = relevantActorIds(content, state, { opening });
  const recent = turns.slice(-8).map(turn => ({ turn_number: turn.turn_number, literal_action: bounded(turn.literal_action, 2000), story_text: bounded(turn.story_text, 4000) }));
  const older = turns.slice(0, -8).map(turn => ({ turn_number: turn.turn_number, turn_summary: bounded(turn.turn_summary || turn.story_text, 600) })).slice(-24);
  return {
    product: productPremise(content),
    opening,
    literal_action: literalAction,
    profile: state.profile ?? {},
    time: state.time ?? {},
    location,
    scene: { location_id: state.scene?.location_id ?? null, present_actor_ids: actorIds, scene_note: bounded(state.scene?.scene_note, 1000) },
    actors: canonicalActors(content, actorIds),
    clothing: state.clothing ?? {},
    active_rules: [],
    recent_turns: recent,
    older_summaries: older
  };
}
