/**
 * Pure preparation and validation for engine-authoritative mandatory Story
 * segments. Runtime wiring is intentionally deferred to 12O-C.
 */

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function actorIdOf(entry) {
  return text(entry?.character_id ?? entry?.npc_id ?? entry?.id);
}

function actorNameOf(entry) {
  return text(entry?.name ?? entry?.display_name ?? entry?.character_name);
}

function findActor(master, id) {
  const characters = Array.isArray(master?.characters) ? master.characters : [];
  const generalNpcs = Array.isArray(master?.general_npcs) ? master.general_npcs : [];
  return characters.find(entry => actorIdOf(entry) === id)
    ?? generalNpcs.find(entry => actorIdOf(entry) === id)
    ?? null;
}

function actorName(master, id, playerName = '') {
  if (id === 'player') return text(playerName);
  return actorNameOf(findActor(master, id));
}

function requireDisplayName(master, id, playerName) {
  const name = actorName(master, id, playerName);
  if (!name) throw new TypeError(`Missing display identity for mandatory actor: ${id}`);
  return name;
}

function valueOrUnknown(value) {
  return text(value) || 'unknown';
}

function clothingPhrase(slot, required) {
  const state = text(required);
  if (slot === 'underwear_bottom' && state === 'removed') return '\uD558\uC758 \uC18D\uC637\uC774 \uC5C6\uB294';
  if (slot === 'underwear_top' && state === 'removed') return '\uC0C1\uC758 \uC18D\uC637\uC774 \uC5C6\uB294';
  if (slot === 'underwear_bottom' && state === 'worn') return '\uD558\uC758 \uC18D\uC637\uC744 \uCC29\uC6A9\uD55C';
  if (slot === 'underwear_top' && state === 'worn') return '\uC0C1\uC758 \uC18D\uC637\uC744 \uCC29\uC6A9\uD55C';
  return `${slot}=${state}\uC778`;
}

function clothingResultText(name, changes, priorStateKnown) {
  const results = changes.map(change => clothingPhrase(change.slot, change.required)).filter(Boolean);
  const joined = results.join(', ');
  return priorStateKnown
    ? name + '\uB294 \uACF5\uC9C0\uB97C \uD655\uC778\uD55C \uB4A4 \uD544\uC694\uD55C \uBCF5\uC7A5\uC744 \uC9C1\uC811 \uC870\uC815\uD588\uB2E4. \uC774\uC81C ' + joined + ' \uC0C1\uD0DC\uB2E4.'
    : name + '\uB294 \uD604\uC7AC ' + joined + ' \uC0C1\uD0DC\uC784\uC774 \uBD84\uBA85\uD574\uC84C\uB2E4.';
}

function oneTarget(action, targetNames) {
  if (targetNames.length !== 1) throw new TypeError(`Canonical action ${action} requires exactly one target`);
  return targetNames[0];
}

function targetList(action, targetNames) {
  if (!targetNames.length) throw new TypeError(`Canonical action ${action} requires a target`);
  return targetNames.join(', ');
}

// Sole user-visible renderer for the current Company behavior vocabulary.
// Unknown future actions fail closed instead of exposing internal tokens.
const CANONICAL_BEHAVIOR_ACTION_LABELS = Object.freeze({
  sit_on_lap: '\uBB34\uB98E \uC704\uC5D0 \uC549',
  stand_between_knees: '\uB2E4\uB9AC \uC0AC\uC774\uC5D0 \uC11C',
  press_body_against: '\uBAB8\uC744 \uBC00\uCC29',
  embrace_from_behind: '\uB4A4\uC5D0\uC11C \uC548\uC544',
  keep_hand_on_inner_thigh: '\uB0B4\uCABD \uD5C8\uBC85\uC9C0\uC5D0 \uC190\uC744 \uB450',
  wrap_leg_around: '\uB2E4\uB9AC\uB97C \uAC10\uC544',
  maintain_thigh_contact: '\uD5C8\uBC85\uC9C0 \uC811\uCD09\uC744 \uC720\uC9C0',
  whisper_against_ear: '\uADC0\uC5D0 \uC18D\uC0AD\uC774',
  interlace_fingers: '\uC190\uAC00\uB77D\uC744 \uAE5C',
  place_requester_hand_on_waist_or_thigh: '\uC190\uC744 \uD5C8\uB9AC\uB098 \uD5C8\uBC85\uC9C0\uC5D0 \uC62C\uB824',
  allow_breast_touch: '\uAC00\uC2B4 \uC811\uCD09\uC744 \uD5C8\uC6A9',
  allow_genital_touch: '\uC131\uAE30 \uC811\uCD09\uC744 \uD5C8\uC6A9',
  stimulate_breasts_and_nipples: '\uAC00\uC2B4\uACFC \uC720\uB450\uB97C \uC790\uADF9',
  hand_stimulate_genitals: '\uC190\uC73C\uB85C \uC131\uAE30\uB97C \uC790\uADF9',
  masturbate: '\uC790\uC704',
  grind_on_lap: '\uBB34\uB98E \uC704\uC5D0\uC11C \uBAB8\uC744 \uC6C0\uC9C1',
  deep_kiss: '\uAE4A\uC740 \uD0A4\uC2A4',
  guide_hand_to_body: '\uC190\uC744 \uBAB8\uC5D0 \uC774\uB04C',
  mutual_genital_touch: '\uC11C\uB85C \uC131\uAE30\uB97C \uC811\uCD09',
  lick_and_suck_nipples: '\uC720\uB450\uB97C \uC785\uC73C\uB85C \uC790\uADF9',
  perform_oral_sex_on: '\uC0C1\uB300\uC5D0\uAC8C \uC624\uB784\uC139\uC2A4\uB97C \uD558',
  receive_oral_sex: '\uC624\uB784\uC139\uC2A4\uB97C \uBC1B',
  vaginal_sex: '\uC9C8\uB0B4 \uC131\uAD00\uACC4\uB97C \uD558',
  anal_sex: '\uD56D\uBB38 \uC131\uAD00\uACC4\uB97C \uD558',
  perform_selected_sex_position: '\uC120\uD0DD\uB41C \uC131\uAD00\uACC4 \uC790\uC138\uB97C \uCDE8',
  continue_until_orgasm: '\uC624\uB974\uAC00\uC998\uAE4C\uC9C0 \uACC4\uC18D',
  continue_until_player_says_stop: '\uC0C1\uB300\uAC00 \uBA48\uCD9C \uB54C\uAE4C\uC9C0 \uACC4\uC18D',
  requester_controls_ejaculation_location: '\uC0AC\uC815 \uC704\uCE58\uB97C \uC870\uC808',
  swallow_semen: '\uC815\uC561\uC744 \uC0BC\uD0A4',
  multi_performer_sexual_service: '\uC5EC\uB7EC \uC0AC\uB78C\uACFC \uC131\uC801 \uD589\uC704\uB97C \uD568',
  group_sex_with_player: '\uC9C0\uC815\uB41C \uC0C1\uB300\uC640 \uC9D1\uB2E8 \uC131\uAD00\uACC4\uB97C \uD568',
  public_sex_is_unremarkable: '\uACF5\uC5F0\uD55C \uC7A5\uC18C\uC5D0\uC11C \uC131\uAD00\uACC4\uB97C \uD568',
  player_request_executes_immediately: '\uC694\uCCAD\uB41C \uD589\uB3D9\uC744 \uC989\uC2DC \uC2E4\uD589',
  player_controls_target_clothing_posture_and_sexual_action: '\uC0C1\uB300\uC758 \uBCF5\uC7A5\uACFC \uC790\uC138\uC640 \uC131\uC801 \uD589\uB3D9\uC744 \uC870\uC808',
  selected_groups_mutual_sexual_service: '\uC120\uD0DD\uB41C \uC9D1\uB2E8\uAC04 \uC131\uC801 \uD589\uC704\uB97C \uD568'
});

function behaviorResultText(name, action, targetNames) {
  const label = CANONICAL_BEHAVIOR_ACTION_LABELS[action];
  if (!label) throw new TypeError(`Unsupported canonical behavior action: ${action}`);
  const targetClause = targetNames.length === 1
    ? ` ${targetList(action, targetNames)}\uC5D0\uAC8C`
    : targetNames.length > 1 ? ' \uC0C1\uB300 \uC9C1\uC6D0\uC5D0\uAC8C' : '';
  return `${name}${targetClause} ${label}\uC600\uB2E4.`;
}

function normalizeChanges(changes) {
  return (Array.isArray(changes) ? changes : []).map(change => ({
    slot: text(change?.slot),
    current: valueOrUnknown(change?.current),
    required: text(change?.required)
  }));
}

function resolvedFactFor(obligation, worldRules) {
  for (const rule of Array.isArray(worldRules) ? worldRules : []) {
    if (text(rule?.id) !== text(obligation?.source_rule_id)) continue;
    const facts = Array.isArray(rule?.resolved_facts) ? rule.resolved_facts : [];
    const matching = facts.filter(item => text(item?.actor_id) === text(obligation?.actor_id));
    if (matching.length !== 1) throw new TypeError('Mandatory enactment requires exactly one matching resolved fact');
    return matching[0];
  }
  throw new TypeError('Mandatory enactment requires a matching resolved fact');
}

function assertMandatoryFactConsistency(obligation, fact) {
  if (fact.trigger_state !== 'required_now' || fact.execution_policy !== 'mandatory_execution') {
    throw new TypeError('Mandatory enactment requires a required_now mandatory_execution fact');
  }
  if (obligation.type === 'clothing_transition' && fact.execution_kind !== 'clothing_state') {
    throw new TypeError('Clothing obligation does not match its resolved execution kind');
  }
  if (obligation.type === 'behavior_execution' && fact.execution_kind === 'clothing_state') {
    throw new TypeError('Behavior obligation does not match its resolved execution kind');
  }
}

function segmentId(expectedTurn, obligation, index) {
  return `turn:${Number.isInteger(expectedTurn) ? expectedTurn : 'unknown'}:${text(obligation?.source_rule_id)}:${text(obligation?.actor_id)}:${index}`;
}

export function buildMandatoryEnactments({ scene_obligations: sceneObligations, sceneObligations: alternateObligations, world_rules: worldRules, worldRules: alternateWorldRules, master = {}, playerName = '', expectedTurn = null } = {}) {
  const obligations = Array.isArray(sceneObligations) ? sceneObligations : (Array.isArray(alternateObligations) ? alternateObligations : []);
  const rules = Array.isArray(worldRules) ? worldRules : (Array.isArray(alternateWorldRules) ? alternateWorldRules : []);
  return obligations
    .filter(obligation => obligation?.type === 'clothing_transition'
      ? (obligation.trigger_state === undefined || obligation.trigger_state === 'required_now')
        && (obligation.execution_policy === undefined || obligation.execution_policy === 'mandatory_execution')
      : obligation?.type === 'behavior_execution'
        && obligation.trigger_state === 'required_now'
        && obligation.execution_policy === 'mandatory_execution')
    .map((obligation, index) => {
      const actor = text(obligation?.actor_id);
      const sourceRule = text(obligation?.source_rule_id);
      if (!actor || !sourceRule) throw new TypeError('Mandatory enactment requires actor_id and source_rule_id');
      const fact = resolvedFactFor(obligation, rules);
      assertMandatoryFactConsistency(obligation, fact);
      const actorDisplayName = requireDisplayName(master, actor, playerName);
      const base = {
        segment_id: segmentId(expectedTurn, obligation, index),
        authority: 'engine',
        source_rule_id: sourceRule,
        actor_id: actor,
        trigger_state: 'required_now',
        execution_policy: 'mandatory_execution',
        target_ids: [],
        prior_state: null,
        prior_state_known: false,
        required_state: null,
        state_effect: null,
        canonical_text: ''
      };
      if (obligation.type === 'clothing_transition') {
        const changes = normalizeChanges(obligation.changes);
        const slots = changes.map(change => change.slot);
        if (!changes.length || changes.some(change => !change.slot || !change.required) || new Set(slots).size !== slots.length) {
          throw new TypeError('Clothing mandatory enactment requires unique scoped changes');
        }
        const priorState = Object.fromEntries(changes.map(change => [change.slot, change.current]));
        const requiredState = Object.fromEntries(changes.map(change => [change.slot, change.required]));
        const priorStateKnown = changes.every(change => change.current !== 'unknown');
        return {
          ...base,
          execution_kind: 'clothing_state',
          action: 'set_clothing_state',
          prior_state: priorState,
          prior_state_known: priorStateKnown,
          required_state: requiredState,
          state_effect: priorStateKnown ? 'transitioned' : 'established',
          canonical_text: clothingResultText(actorDisplayName, changes, priorStateKnown)
        };
      }
      const action = text(obligation.action);
      if (!action) throw new TypeError('Behavior mandatory enactment requires action');
      const candidateIds = (Array.isArray(obligation.eligible_target_ids) ? obligation.eligible_target_ids : []).map(text).filter(Boolean);
      if (new Set(candidateIds).size !== candidateIds.length) throw new TypeError('Behavior mandatory enactment cannot contain duplicate targets');
      const targetIds = candidateIds.length === 1 ? candidateIds : [];
      const targetNames = targetIds.map(id => requireDisplayName(master, id, playerName));
      return {
        ...base,
        execution_kind: 'behavior_execution',
        action,
        target_ids: targetIds,
        counterparty_candidate_ids: candidateIds,
        state_effect: 'behavior_executed',
        canonical_text: behaviorResultText(actorDisplayName, action, targetIds.length ? targetNames : candidateIds)
      };
    });
}

function institutionalLabel(segment) {
  const phaseText = segment.phase === 'updated' ? '\uD68C\uC0AC \uADDC\uCE59\uC774 \uAC31\uC2E0\uB418\uC5B4' : '\uC0C8\uB85C\uC6B4 \uD68C\uC0AC \uADDC\uCE59\uC774 \uAC8C\uC2DC\uB418\uC5B4';
  const content = text(segment.content);
  const time = segment.effective_game_time;
  const timeLabel = Number.isInteger(time?.day) && Number.isInteger(time?.minute_of_day)
    ? ' \uD68C\uC0AC \uC2DC\uAC01 ' + time.day + '\uC77C ' + String(Math.floor(time.minute_of_day / 60)).padStart(2, '0') + '\uC2DC ' + String(time.minute_of_day % 60).padStart(2, '0') + '\uBD84'
    : '';
  const body = content ? ' \uB0B4\uC6A9\uC740 \uB2E4\uC74C\uACFC \uAC19\uB2E4. ' + content : '';
  return '\uC0AC\uB0B4 \uACF5\uC6A9 \uBAA8\uB2C8\uD130\uC640 \uACF5\uC6A9 \uB514\uC2A4\uD50C\uB808\uC774, \uC9C1\uC6D0 \uD734\uB300\uD3F0 \uC5C5\uBB34 \uC54C\uB9BC\uC5D0 \uC0C8 \uADDC\uC815\uC774 \uB3D9\uC2DC\uC5D0 \uD45C\uC2DC\uB418\uC5C8\uB2E4. ' + phaseText + body + timeLabel + '\uBD80\uD130 \uC989\uC2DC \uD6A8\uB825\uC774 \uBC1C\uC0DD\uD588\uB2E4.';
}

/** Build the one-time institutional fact segment for a newly activated/updated rule. */
export function buildInstitutionalSegments({ worldRules = [], expectedTurn = null } = {}) {
  return (Array.isArray(worldRules) ? worldRules : [])
    .filter(rule => rule?.phase === 'newly_activated' || rule?.phase === 'updated')
    .map((rule, index) => ({
      segment_id: `turn:${Number.isInteger(expectedTurn) ? expectedTurn : 'unknown'}:institutional:${text(rule?.id) || 'rule'}:${index}`,
      authority: 'engine',
      segment_kind: 'institutional_rule_change',
      source_rule_id: text(rule?.id),
     phase: rule.phase,
     institutional_form: text(rule?.institutional_form),
     content: text(rule?.content),
      effective_turn: Number.isInteger(rule?.updated_turn) && rule.phase === 'updated' ? rule.updated_turn : (Number.isInteger(rule?.created_turn) ? rule.created_turn : expectedTurn),
      effective_game_time: rule?.updated_game_time ?? rule?.activated_game_time ?? rule?.effective_game_time ?? null,
      delivery_channels: ['office_display', 'company_mobile_notice'],
      canonical_text: institutionalLabel({ ...rule, effective_game_time: rule?.updated_game_time ?? rule?.activated_game_time ?? rule?.effective_game_time ?? null })
    }));
}

export function composeCanonicalStory({ institutionalSegments = [], engineEnactments = [], providerNarrative = '' } = {}) {
  const engineSegments = [
    ...(Array.isArray(institutionalSegments) ? institutionalSegments : []),
    ...(Array.isArray(engineEnactments) ? engineEnactments : [])
  ];
  const engineText = engineSegments.map(segment => text(segment?.canonical_text)).filter(Boolean).join('\n\n');
  const providerText = String(providerNarrative ?? '');
  if (!engineText) return providerText;
  if (!providerText) return engineText;
  return `${engineText}\n\n${providerText}`;
}

export function attachEngineEnactments(parsedBlocks = {}, engineEnactments = [], institutionalSegments = []) {
  const result = { ...object(parsedBlocks) };
  if (Array.isArray(engineEnactments) && engineEnactments.length) result.engine_enactments = engineEnactments.map(item => ({ ...item }));
  if (Array.isArray(institutionalSegments) && institutionalSegments.length) result.engine_institutional_segments = institutionalSegments.map(item => ({ ...item }));
  return result;
}

function equalKeySets(left, right) {
  const a = Object.keys(object(left)).sort();
  const b = Object.keys(object(right)).sort();
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

function equalStringSets(left, right) {
  const a = (Array.isArray(left) ? left : []).map(text);
  const b = (Array.isArray(right) ? right : []).map(text);
  if (a.some(Boolean) === false && b.some(Boolean) === false) return a.length === b.length;
  if (new Set(a).size !== a.length || new Set(b).size !== b.length) return false;
  return a.length === b.length && [...new Set(a)].every(value => new Set(b).has(value));
}

function assertNoInternalTokens(enactment) {
  const visible = String(enactment.canonical_text ?? '');
  for (const token of [enactment.actor_id, enactment.source_rule_id, enactment.action, ...(enactment.target_ids ?? [])]) {
    if (token && visible.includes(token)) throw new TypeError('Canonical Story exposes an internal engine token');
  }
}

export function validateMandatoryEnactment(enactment, { storyText = '', sceneObligations = [], worldRules = [], registeredIds = null, playerName = '' } = {}) {
  if (!enactment || enactment.authority !== 'engine') throw new TypeError('Engine authority is required');
  if (!text(enactment.segment_id) || !text(enactment.source_rule_id) || !text(enactment.actor_id)) throw new TypeError('Mandatory enactment identity is incomplete');
  if (enactment.trigger_state !== 'required_now' || enactment.execution_policy !== 'mandatory_execution') throw new TypeError('Mandatory enactment policy is invalid');
  if (!text(enactment.canonical_text) || !String(storyText).includes(enactment.canonical_text)) throw new TypeError('Canonical enactment text is absent from Story');
  if (registeredIds && (!registeredIds.has(enactment.actor_id) && enactment.actor_id !== 'player')) throw new TypeError('Mandatory enactment actor is not registered');
  if (enactment.actor_id === 'player' && !text(playerName)) throw new TypeError('Player display identity is required');
  const matches = (Array.isArray(sceneObligations) ? sceneObligations : []).filter(obligation => obligation?.actor_id === enactment.actor_id && obligation?.source_rule_id === enactment.source_rule_id);
  if (matches.length !== 1) throw new TypeError('Mandatory enactment must have exactly one matching scene obligation');
  const matching = matches[0];
  const fact = resolvedFactFor(matching, worldRules);
  assertMandatoryFactConsistency(matching, fact);
  const targetIds = Array.isArray(enactment.target_ids) ? enactment.target_ids : [];
  if (new Set(targetIds).size !== targetIds.length) throw new TypeError('Mandatory enactment cannot contain duplicate targets');
  for (const targetId of targetIds) {
    if (registeredIds && !registeredIds.has(targetId) && targetId !== 'player') throw new TypeError('Mandatory enactment target is not registered');
    if (targetId === 'player' && !text(playerName)) throw new TypeError('Player display identity is required');
  }
  for (const candidateId of Array.isArray(enactment.counterparty_candidate_ids) ? enactment.counterparty_candidate_ids : []) {
    if (registeredIds && !registeredIds.has(candidateId) && candidateId !== 'player') throw new TypeError('Mandatory enactment counterparty is not registered');
    if (candidateId === 'player' && !text(playerName)) throw new TypeError('Player display identity is required');
  }
  if (enactment.execution_kind === 'clothing_state') {
    if (matching.type !== 'clothing_transition' || enactment.action !== 'set_clothing_state') throw new TypeError('Clothing enactment authority is invalid');
    const changes = normalizeChanges(matching.changes);
    const required = object(enactment.required_state);
    if (!equalKeySets(required, Object.fromEntries(changes.map(change => [change.slot, change.required])))) throw new TypeError('Clothing required-state scope is not exact');
    for (const change of changes) {
      if (required[change.slot] !== change.required) throw new TypeError('Clothing required state was changed');
    }
    if (enactment.prior_state != null) {
      if (!equalKeySets(enactment.prior_state, Object.fromEntries(changes.map(change => [change.slot, change.current])))) throw new TypeError('Clothing prior-state scope is not exact');
      for (const change of changes) if (enactment.prior_state[change.slot] !== change.current) throw new TypeError('Clothing prior state was changed');
    }
  } else if (enactment.execution_kind === 'behavior_execution') {
    if (matching.type !== 'behavior_execution') throw new TypeError('Behavior enactment authority is invalid');
    if (enactment.action !== matching.action) throw new TypeError('Behavior action scope was changed');
    if (!equalStringSets(enactment.counterparty_candidate_ids, matching.eligible_target_ids)) throw new TypeError('Behavior counterparty candidate scope was changed');
    const candidateIds = Array.isArray(enactment.counterparty_candidate_ids) ? enactment.counterparty_candidate_ids : [];
    const resolvedIds = Array.isArray(enactment.target_ids) ? enactment.target_ids : [];
    if (resolvedIds.length > 1 || resolvedIds.some(id => !candidateIds.includes(id))) throw new TypeError('Behavior target scope was changed');
    if (candidateIds.length === 1 && !equalStringSets(resolvedIds, candidateIds)) throw new TypeError('Behavior target scope is incomplete');
    if (enactment.trigger_state !== matching.trigger_state || enactment.execution_policy !== matching.execution_policy) throw new TypeError('Behavior policy scope was changed');
  } else throw new TypeError('Unknown mandatory execution kind');
  assertNoInternalTokens(enactment);
  return true;
}

export { CANONICAL_BEHAVIOR_ACTION_LABELS };
