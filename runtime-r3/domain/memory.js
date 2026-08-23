import { canonicalActors, canonicalLocation, productPremise, relevantActorIds } from './content.js';

const bounded = (value, max) => String(value ?? '').slice(0, max);
const REQUEST_TRIGGER_VALUES = new Set(['on_player_request', 'on_counterparty_request']);
const PLAYER_AGENCY_CONTRACT = Object.freeze({
  literal_action_is_player_choice: true,
  preserve_explicit_dimensions: Object.freeze([
    'actor', 'target', 'action', 'movement/destination', 'request', 'refusal', 'self-state', 'topic', 'intent'
  ]),
  choice_boundary: 'Preserve explicit player choices; Story may narrate consequences around or after the chosen beat, but must not replace, invert, redirect, or contradict them.',
  self_state_boundary: 'An explicit player self-state remains true for the chosen scene beat; do not inject same-beat NPC approach or dialogue that makes that self-state impossible unless the literal permits that interaction.',
  external_outcome_boundary: 'Player input is not automatic proof of external outcome or NPC compliance.',
  app_topic_boundary: 'Mentioning the private app, a rule, or a topic is not a player app interaction.',
  app_interaction_boundary: 'Opening, scrolling, reading, applying, changing, or closing the app requires that voluntary action to be explicit in the submitted literal.'
});

export function requestExecutionTiming(rule = {}) {
  const requestTriggered = rule.mode === 'on_player_request' || REQUEST_TRIGGER_VALUES.has(rule.trigger);
  return requestTriggered ? {
    request_triggered: true,
    when_triggered: 'same_story_turn',
    future_deferral_allowed: false
  } : null;
}

export function buildStoryContext(context, literalAction, { content, opening = false, feedbackText = '', csaOperation = null } = {}) {
  const state = context?.state?.state ?? {};
  const turns = Array.isArray(context?.turns) ? context.turns : [];
  const location = canonicalLocation(content, state.scene?.location_id);
  const actorIds = relevantActorIds(content, state, { opening });
  const recent = turns.slice(-8).map(turn => ({ turn_number: turn.turn_number, literal_action: bounded(turn.literal_action, 2000), story_text: bounded(turn.story_text, 4000) }));
  const older = turns.slice(0, -8).map(turn => ({ turn_number: turn.turn_number, turn_summary: bounded(turn.turn_summary || turn.story_text, 600) })).slice(-24);
  const product = productPremise(content);
  const rules = state.csa_rules && typeof state.csa_rules === 'object' ? state.csa_rules : {};
  const activeRules = [...new Set(Array.isArray(state.csa_active) ? state.csa_active : [])]
    .map(id => rules[id])
    .filter(rule => rule?.active)
    .map(rule => {
      const executionTiming = requestExecutionTiming(rule);
      return {
        id: rule.id,
        template_id: rule.template_id,
        content: bounded(rule.content, 600),
        mode: rule.mode,
        trigger: rule.trigger,
        strength: rule.strength,
        subject_scope: rule.subject_scope,
        counterparty_scope: rule.counterparty_scope ?? null,
        ...(executionTiming ? { execution_timing: executionTiming } : {})
      };
    });
  return {
    product,
    opening,
    literal_action: literalAction,
    player_agency_contract: PLAYER_AGENCY_CONTRACT,
    profile: state.profile ?? {},
    time: state.time ?? {},
    location,
    scene: { location_id: state.scene?.location_id ?? null, present_actor_ids: actorIds, scene_note: bounded(state.scene?.scene_note, 1000) },
    actors: canonicalActors(content, actorIds),
    clothing: state.clothing ?? {},
    active_rules: activeRules,
    ...(csaOperation ? {
      pending_csa_operation: {
        type: 'csa_operation',
        operation: csaOperation,
        boundary: 'This exact visible app operation is the player action for this turn; enact its immediate world consequence naturally, then return to the player\'s literal intent.'
      }
    } : {}),
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
    opening_agency_contract: opening ? {
      phase: 'before_first_player_input',
      passive_scene_exposure_allowed: true,
      passive_exposure_examples: ['app_present', 'app_appears', 'app_visible', 'player_can_notice_app'],
      voluntary_player_action_forbidden: [
        'speech_or_reply', 'nod_or_gesture', 'movement', 'touching', 'clicking', 'typing',
        'opening_closing_hiding_app', 'drinking_eating', 'reviewing_work',
        'acknowledging', 'deciding', 'accepting_refusing', 'other_intentional_action'
      ],
      player_choice_must_remain_unmade: true,
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
    older_summaries: older,
    ...(feedbackText ? { feedback_guidance: bounded(feedbackText, 2000) } : {})
  };
}
