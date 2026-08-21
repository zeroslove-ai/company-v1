import { canonicalActors, canonicalLocation, productPremise, relevantActorIds } from './content.js';

const bounded = (value, max) => String(value ?? '').slice(0, max);

export function buildStoryContext(context, literalAction, { content, opening = false } = {}) {
  const state = context?.state?.state ?? {};
  const turns = Array.isArray(context?.turns) ? context.turns : [];
  const location = canonicalLocation(content, state.scene?.location_id);
  const actorIds = relevantActorIds(content, state, { opening });
  const recent = turns.slice(-8).map(turn => ({ turn_number: turn.turn_number, literal_action: bounded(turn.literal_action, 2000), story_text: bounded(turn.story_text, 4000) }));
  const older = turns.slice(0, -8).map(turn => ({ turn_number: turn.turn_number, turn_summary: bounded(turn.turn_summary || turn.story_text, 600) })).slice(-24);
  const product = productPremise(content);
  return {
    product,
    opening,
    literal_action: literalAction,
    profile: state.profile ?? {},
    time: state.time ?? {},
    location,
    scene: { location_id: state.scene?.location_id ?? null, present_actor_ids: actorIds, scene_note: bounded(state.scene?.scene_note, 1000) },
    actors: canonicalActors(content, actorIds),
    clothing: state.clothing ?? {},
    active_rules: [],
    opening_contract: opening ? {
      product_title: product.title,
      private_app_name: product.app_name,
      player_must_discover_private_app: true,
      npc_ignorance_until_player_reveals: true,
      canonical_setting_and_registered_actors_only: true,
      workplace_and_social_context_required: true,
      never_complete_unrequested_player_action: true,
      end_with_player_agency: true
    } : null,
    next_action_contract: {
      author: 'story',
      count: 4,
      literal_player_actions: true,
      final_story_section: true,
      verbatim_observer_copy: true,
      current_story_only: true,
      unavailable_on_projection_failure: true
    },
    recent_turns: recent,
    older_summaries: older
  };
}
