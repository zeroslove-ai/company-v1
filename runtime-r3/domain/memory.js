import { canonicalActors, canonicalLocation, productPremise, relevantActorIds } from './content.js';
import { buildActiveS1StoryBinding, buildRuleChangeStoryBinding } from './csa.js';

const bounded = (value, max) => String(value ?? '').slice(0, max);
const canonicalClock24h = time => {
  const minute = Number(time?.minute);
  if (!Number.isInteger(minute) || minute < 0 || minute >= 24 * 60) return null;
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
};
const REQUEST_TRIGGER_VALUES = new Set(['on_player_request', 'on_counterparty_request']);
const PLAYER_MOVEMENT_AUTHORITY_CONTRACT = Object.freeze({
  submitted_literal_is_sole_voluntary_movement_authority: true,
  remote_target_or_npc_motion_never_implies_player_movement: true,
  unchosen_bridge_actions_forbidden: Object.freeze([
    'standing_to_go', 'following', 'walking', 'approaching', 'entering', 'knocking', 'accompanying', 'returning'
  ]),
  external_consequence_boundary: 'An independently grounded external consequence may displace PLAYER only when the world physically causes it; it never authorizes Story-authored voluntary standing, following, walking, approaching, entering, knocking, accompanying, or returning.',
  explicit_literal_navigation_remains_supported: true,
  boundary: 'The submitted literal is the sole authority for voluntary PLAYER movement in this Story turn. A remote target, NPC movement, stale scene, or narrative convenience may not add a voluntary PLAYER movement or bridge action that the literal did not choose. Preserve the canonical player location unless the literal explicitly binds player movement.'
});
const PLAYER_AGENCY_CONTRACT = Object.freeze({
  literal_action_is_player_choice: true,
  preserve_explicit_dimensions: Object.freeze([
    'actor', 'target', 'action', 'movement/destination', 'request', 'refusal', 'self-state', 'topic', 'intent'
  ]),
  choice_boundary: 'Preserve explicit player choices; Story may narrate grounded non-movement consequences around or after the chosen beat, but must not replace, invert, redirect, contradict, or use a consequence to add voluntary PLAYER movement.',
  npc_movement_boundary: 'NPC-only movement, NPC-to-NPC action, remote target location, stale scene context, or narrative convenience never authorizes PLAYER follow, entry, accompaniment, teleport, or other voluntary movement; preserve the canonical player scene unless the literal explicitly binds player movement. An external consequence is not permission for Story-authored voluntary travel.',
  self_state_boundary: 'An explicit player self-state remains true for the chosen scene beat; do not inject same-beat NPC approach or dialogue that makes that self-state impossible unless the literal permits that interaction.',
  external_outcome_boundary: 'For ordinary requests without an applicable rule-owned same-turn authority exception, player input is not automatic proof of external outcome or NPC compliance.',
  app_topic_boundary: 'Mentioning the private app, a rule, or a topic is not a player app interaction.',
  app_interaction_boundary: 'Opening, scrolling, reading, applying, changing, or closing the app requires that voluntary action to be explicit in the submitted literal.'
});
const PLAYER_IDENTITY_CONTRACT = Object.freeze({
  canonical_facts_are_authoritative: true,
  preserve_exactly: Object.freeze(['name', 'department', 'formal_position/rank']),
  formal_identity_boundary: 'The canonical player name, department, and formal position/rank supplied in canonical_player_identity are authoritative Story facts on every turn. Do not replace, normalize, downgrade, upgrade, or invent a different formal department, rank, title, business-card identity, badge identity, introduction, signature, or address. If Story mentions one of those identity artifacts, use the exact canonical labels supplied here.',
  no_inference_boundary: 'Do not derive the player formal department, rank, or title from department names, NPC roles, scene context, seniority stereotypes, or model inference. Do not let Observer or any post-processing change player identity.'
});
const STORY_DRAMATIZATION_CONTRACT = Object.freeze({
  use_as_scene_behavior: true,
  boundary: 'Use each registered heroine dramatization as behavior, speech, initiative, private routine, conflict/care, hierarchy, attraction boundary, and continuity evidence in the scene. Do not print field names, profile labels, dossiers, or hidden canon as exposition.',
  distinct_heroines: true,
  dialogue_examples_are_style_guidance_only: true
});
const CONTINUITY_MEMORY_CONTRACT = Object.freeze({
  chronological: true,
  preserve_first: Object.freeze(['literal refusal or boundary', 'conflict and repair', 'help or promise', 'intimacy or attraction evidence', 'institutional rule adaptation']),
  raw_recent_is_authoritative: true,
  older_summaries_are_grounded_only: true,
  no_generic_relationship_state: true
});

export function requestExecutionTiming(rule = {}) {
  const requestTriggered = rule.mode === 'on_player_request' || REQUEST_TRIGGER_VALUES.has(rule.trigger);
  return requestTriggered ? {
    request_triggered: true,
    when_triggered: 'same_story_turn',
    future_deferral_allowed: false
  } : null;
}

export function buildStoryContext(context, literalAction, { content, opening = false, feedbackText = '', csaOperation = null, ruleChangeEvent = null, ruleChangeBinding = null } = {}) {
  const state = context?.state?.state ?? {};
  const turns = Array.isArray(context?.turns) ? context.turns : [];
  const location = canonicalLocation(content, state.scene?.location_id);
  const actorIds = relevantActorIds(content, state, { opening });
  const recent = turns.slice(-8).map(turn => ({ turn_number: turn.turn_number, literal_action: bounded(turn.literal_action, 2000), story_text: bounded(turn.story_text, 4000) }));
  const older = turns.slice(0, -8).map(turn => ({ turn_number: turn.turn_number, turn_summary: bounded(turn.turn_summary || turn.story_text, 600) })).slice(-24);
  const product = productPremise(content);
  const department = (content?.departments ?? []).find(item => item?.department_id === state.profile?.department_id);
  const position = (content?.positions ?? []).find(item => item?.position_id === state.profile?.position_id);
  const storyLiteralAction = ruleChangeEvent || csaOperation ? '' : literalAction;
  const canonicalPlayerIdentity = {
    name: state.profile?.name ?? null,
    department: { id: state.profile?.department_id ?? null, name: department?.name ?? null },
    position: { id: state.profile?.position_id ?? null, name: position?.name ?? null }
  };
  const rules = state.csa_rules && typeof state.csa_rules === 'object' ? state.csa_rules : {};
  const exactRuleChangeBinding = ruleChangeBinding ?? (ruleChangeEvent ? buildRuleChangeStoryBinding({ event: ruleChangeEvent, content }) : null);
  const ruleChangeStory = Boolean(ruleChangeEvent || csaOperation);
  const clock24h = canonicalClock24h(state.time);
  const storyTime = ruleChangeStory
    ? { ...(state.time ?? {}), ...(clock24h ? { clock_24h: clock24h } : {}) }
    : state.time ?? {};
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
  const activeS1Rule = [...new Set(Array.isArray(state.csa_active) ? state.csa_active : [])]
    .map(id => rules[id])
    .find(rule => rule?.active && rule.slot === 'S1');
  const activeS1StoryBinding = buildActiveS1StoryBinding({ rule: activeS1Rule, content, playerIdentity: canonicalPlayerIdentity });
  return {
    ...(ruleChangeStory ? {} : { product }),
    opening,
    literal_action: storyLiteralAction,
    player_agency_contract: PLAYER_AGENCY_CONTRACT,
    player_movement_authority_contract: PLAYER_MOVEMENT_AUTHORITY_CONTRACT,
    canonical_player_identity: canonicalPlayerIdentity,
    player_identity_contract: PLAYER_IDENTITY_CONTRACT,
    story_dramatization_contract: STORY_DRAMATIZATION_CONTRACT,
    continuity_memory_contract: CONTINUITY_MEMORY_CONTRACT,
    profile: state.profile ?? {},
    time: storyTime,
    location,
    scene: ruleChangeStory
      ? { location_id: state.scene?.location_id ?? null, present_actor_ids: actorIds }
      : { location_id: state.scene?.location_id ?? null, present_actor_ids: actorIds, scene_note: bounded(state.scene?.scene_note, 1000) },
    actors: canonicalActors(content, actorIds),
    clothing: state.clothing ?? {},
    active_rules: activeRules,
    ...(activeRules.length ? { active_csa_literal_contract: {
      literal_action: storyLiteralAction,
      preserve_actor_target_action_topic: true,
      active_rules_may_not_erase_or_redirect_literal: true
    } } : {}),
    ...(activeS1StoryBinding ? { active_s1_story_binding: activeS1StoryBinding } : {}),
    ...(activeS1StoryBinding ? { active_s1_literal_contract: {
      literal_action: storyLiteralAction,
      preserve_actor_target_action: true,
      supported_families_are_mandatory_only: true,
      closed_world_supported_families: true,
      positive_supported_family_match_required: true,
      ambiguous_or_unmatched_action_is_ordinary: true,
      unsupported_literal_remains_ordinary: true,
      mandatory_supported_action_exception: 'When the exact active S1 subject/counterparty scope matches and the literal is one of the finite supported action families, rule-owned institutional authority takes precedence over the ordinary external-outcome boundary and the supported action must begin in this same Story turn; this exception does not apply outside the listed families.',
      precedence: 'The submitted literal_action is the latest and highest-priority ordinary player intent; active CSA context may classify its finite authority but may not erase, replace, or redirect it.'
    } } : {}),
    ...(ruleChangeEvent || csaOperation ? {
      pending_rule_change_turn: {
        type: 'rule_change_turn',
        ...(ruleChangeEvent ?? { operation: csaOperation }),
        boundary: 'This structured server-owned rule-change operation is the player action for this turn. The official institutional announcement is the single world-issuance source already rendered by the server; continue with grounded reactions and only its bounded immediate consequence. Continue in the current scene at the canonical 24-hour time unless the Story itself narrates a small plausible elapsed interval; do not invent an hour-scale or daypart jump merely because prior free-text continuity is unavailable. Do not expose private presentation history, invent a second authority source, or infer affection, desire, consent, or app awareness from compliance.'
      }
    } : {}),
    ...(exactRuleChangeBinding ? { rule_change_story_binding: exactRuleChangeBinding } : {}),
    opening_contract: opening ? {
      product_title: product.title,
      private_app_name: product.app_name,
      first_day_at_company: true,
      first_arrival_at_company: true,
      first_appointment_context: true,
      selected_department: { id: state.profile?.department_id ?? null, name: department?.name ?? null },
      selected_position: { id: state.profile?.position_id ?? null, name: position?.name ?? null },
      selected_formal_position_label: position?.name ?? null,
      selected_formal_position_must_be_explicitly_established: Boolean(position?.name),
      selected_formal_position_may_not_be_normalized: true,
      first_day_descriptors_may_surround_exact_position: true,
      selected_rank_must_remain_true: true,
      no_prior_tenure_or_company_relationships: true,
      player_must_discover_private_app: true,
      npc_ignorance_until_player_reveals: true,
      canonical_setting_and_registered_actors_only: true,
      workplace_and_social_context_required: true,
      never_complete_unrequested_player_action: true,
      end_with_player_agency: true
    } : null,
    opening_agency_contract: opening ? {
      phase: 'before_first_player_input',
      voluntary_player_action_authority: 'empty_before_first_submitted_literal',
      validated_setup_facts_are_not_player_action_authority: true,
      passive_scene_exposure_allowed: true,
      passive_app_discovery_without_player_manipulation: true,
      passive_exposure_examples: ['app_present', 'app_appears', 'app_visible', 'player_can_notice_app'],
      voluntary_player_action_forbidden: [
        'speech_or_reply', 'nod_or_gesture', 'movement', 'touching', 'clicking', 'typing',
        'opening_closing_hiding_app', 'drinking_eating', 'reviewing_work',
        'acknowledging', 'deciding', 'accepting_refusing', 'other_intentional_action'
      ],
      player_choice_must_remain_unmade: true,
      no_completed_player_action_before_first_literal: true,
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
    ...(ruleChangeStory ? { recent_turns: [], older_summaries: [] } : { recent_turns: recent, older_summaries: older }),
    ...(feedbackText && !ruleChangeStory ? { feedback_guidance: bounded(feedbackText, 2000) } : {})
  };
}
