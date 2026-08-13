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

function valueOrUnknown(value) {
  return text(value) || 'unknown';
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
          state_effect: priorStateKnown ? 'transitioned' : 'established'
        };
      }
      const action = text(obligation.action);
      if (!action) throw new TypeError('Behavior mandatory enactment requires action');
      const candidateIds = (Array.isArray(obligation.eligible_target_ids) ? obligation.eligible_target_ids : []).map(text).filter(Boolean);
      if (new Set(candidateIds).size !== candidateIds.length) throw new TypeError('Behavior mandatory enactment cannot contain duplicate targets');
      const targetIds = candidateIds.length === 1 ? candidateIds : [];
      return {
        ...base,
        execution_kind: 'behavior_execution',
        action,
        target_ids: targetIds,
        counterparty_candidate_ids: candidateIds,
        state_effect: 'behavior_executed'
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
  // Institutional notices are visible Engine output. Mandatory enactments are
  // metadata-only obligations; the Provider renders their HOW in ACTING.
  const engineText = (Array.isArray(institutionalSegments) ? institutionalSegments : [])
    .map(segment => text(segment?.canonical_text)).filter(Boolean).join('\n\n');
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

export function validateMandatoryEnactment(enactment, { sceneObligations = [], worldRules = [], registeredIds = null, playerName = '' } = {}) {
  if (!enactment || enactment.authority !== 'engine') throw new TypeError('Engine authority is required');
  if (!text(enactment.segment_id) || !text(enactment.source_rule_id) || !text(enactment.actor_id)) throw new TypeError('Mandatory enactment identity is incomplete');
  if (enactment.trigger_state !== 'required_now' || enactment.execution_policy !== 'mandatory_execution') throw new TypeError('Mandatory enactment policy is invalid');
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
  return true;
}
