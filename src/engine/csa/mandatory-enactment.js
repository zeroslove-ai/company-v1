/**
 * Pure preparation and validation for engine-authoritative mandatory Story
 * segments.  This module deliberately has no HTTP, DB, LLM, or save mutation
 * dependencies.  Runtime wiring is deferred to the Story/Extract/Commit
 * integration phase.
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

function actorNameOf(entry, id) {
  return text(entry?.name ?? entry?.display_name ?? entry?.character_name) || id;
}

function findActor(master, id) {
  const characters = Array.isArray(master?.characters) ? master.characters : [];
  const generalNpcs = Array.isArray(master?.general_npcs) ? master.general_npcs : [];
  return characters.find(entry => actorIdOf(entry) === id)
    ?? generalNpcs.find(entry => actorIdOf(entry) === id)
    ?? null;
}

function actorName(master, id) {
  return actorNameOf(findActor(master, id), id);
}

function valueOrUnknown(value) {
  return text(value) || 'unknown';
}

function clothingPhrase(slot, required) {
  const state = text(required);
  if (slot === 'underwear_bottom' && state === 'removed') return '하의 속옷이 없는';
  if (slot === 'underwear_top' && state === 'removed') return '상의 속옷이 없는';
  if (slot === 'underwear_bottom' && state === 'worn') return '하의 속옷을 착용한';
  if (slot === 'underwear_top' && state === 'worn') return '상의 속옷을 착용한';
  return `${slot}=${state}인`;
}

function clothingResultText(name, changes, priorStateKnown) {
  const results = (Array.isArray(changes) ? changes : [])
    .map(change => clothingPhrase(change?.slot, change?.required))
    .filter(Boolean);
  if (!results.length) return `${name}는 요구된 복장 상태를 갖춘 상태가 분명해졌다.`;
  const joined = results.join(', ');
  return priorStateKnown
    ? `${name}는 복장을 정리해 ${joined} 상태가 되었다.`
    : `${name}는 복장 상태를 정리했고, ${joined} 상태가 분명해졌다.`;
}

function behaviorResultText(name, action, targetNames) {
  const targets = targetNames.length ? ` (${targetNames.join(', ')}를 대상으로)` : '';
  return `${name}는 요구된 행동(${action})${targets}을 실행했다.`;
}

function normalizeChanges(changes) {
  return (Array.isArray(changes) ? changes : []).map(change => ({
    slot: text(change?.slot),
    current: valueOrUnknown(change?.current),
    required: text(change?.required)
  }));
}

function resolvedFactFor(obligation, worldRules) {
  const rules = Array.isArray(worldRules) ? worldRules : [];
  for (const rule of rules) {
    if (text(rule?.id) !== text(obligation?.source_rule_id)) continue;
    const facts = Array.isArray(rule?.resolved_facts) ? rule.resolved_facts : [];
    const fact = facts.find(item => text(item?.actor_id) === text(obligation?.actor_id));
    if (fact) return fact;
  }
  return null;
}

function assertMandatoryFactConsistency(obligation, fact) {
  if (!fact) return;
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
  return `turn:${Number.isInteger(expectedTurn) ? expectedTurn : 'unknown'}:${text(obligation?.source_rule_id) || 'rule'}:${text(obligation?.actor_id) || 'actor'}:${index}`;
}

/**
 * Convert already-resolved mandatory scene obligations into deterministic
 * engine segments.  No actor, target, trigger, or policy is re-evaluated here.
 */
export function buildMandatoryEnactments({ scene_obligations: sceneObligations, sceneObligations: alternateObligations, world_rules: worldRules, worldRules: alternateWorldRules, master = {}, expectedTurn = null } = {}) {
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
        canonical_text: ''
      };
      if (obligation.type === 'clothing_transition') {
        const changes = normalizeChanges(obligation.changes);
        if (!changes.length || changes.some(change => !change.slot || !change.required)) {
          throw new TypeError('Clothing mandatory enactment requires scoped changes');
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
          canonical_text: clothingResultText(actorName(master, actor), changes, priorStateKnown)
        };
      }
      if (obligation.type === 'behavior_execution') {
        const action = text(obligation.action);
        if (!action) throw new TypeError('Behavior mandatory enactment requires action');
        const targetIds = (Array.isArray(obligation.eligible_target_ids) ? obligation.eligible_target_ids : [])
          .map(text).filter(Boolean);
        return {
          ...base,
          execution_kind: 'behavior_execution',
          action,
          target_ids: targetIds,
          state_effect: 'behavior_executed',
          canonical_text: behaviorResultText(actorName(master, actor), action, targetIds.map(id => actorName(master, id)))
        };
      }
      throw new TypeError(`Unsupported mandatory obligation type: ${String(obligation?.type ?? '')}`);
    });
}

/**
 * Assemble the canonical Story without rewriting either source.  Engine
 * segments are always first so provider text is a continuation of established
 * facts.  The caller decides how the resulting text is persisted.
 */
export function composeCanonicalStory({ engineEnactments = [], providerNarrative = '' } = {}) {
  const engineText = (Array.isArray(engineEnactments) ? engineEnactments : [])
    .map(segment => text(segment?.canonical_text))
    .filter(Boolean)
    .join('\n\n');
  const providerText = String(providerNarrative ?? '');
  if (!engineText) return providerText;
  if (!providerText) return engineText;
  return `${engineText}\n\n${providerText}`;
}

/**
 * Add the non-rendered sidecar to parsed-blocks without mutating the parser
 * result.  Persistence wiring is intentionally left to the next phase.
 */
export function attachEngineEnactments(parsedBlocks = {}, engineEnactments = []) {
  return { ...object(parsedBlocks), engine_enactments: (Array.isArray(engineEnactments) ? engineEnactments : []).map(item => ({ ...item })) };
}

export function validateMandatoryEnactment(enactment, { storyText = '', sceneObligations = [], registeredIds = null } = {}) {
  if (!enactment || enactment.authority !== 'engine') throw new TypeError('Engine authority is required');
  if (!text(enactment.segment_id) || !text(enactment.source_rule_id) || !text(enactment.actor_id)) throw new TypeError('Mandatory enactment identity is incomplete');
  if (enactment.trigger_state !== 'required_now' || enactment.execution_policy !== 'mandatory_execution') throw new TypeError('Mandatory enactment policy is invalid');
  if (!text(enactment.canonical_text) || !String(storyText).includes(enactment.canonical_text)) throw new TypeError('Canonical enactment text is absent from Story');
  if (registeredIds && !registeredIds.has(enactment.actor_id) && enactment.actor_id !== 'player') throw new TypeError('Mandatory enactment actor is not registered');
  const matching = (Array.isArray(sceneObligations) ? sceneObligations : []).find(obligation => obligation?.actor_id === enactment.actor_id && obligation?.source_rule_id === enactment.source_rule_id);
  if (!matching) throw new TypeError('Mandatory enactment has no matching scene obligation');
  if (enactment.execution_kind === 'clothing_state') {
    const required = object(enactment.required_state);
    const scoped = new Set((Array.isArray(matching.changes) ? matching.changes : []).map(change => text(change?.slot)));
    if (!Object.keys(required).length || Object.keys(required).some(slot => !scoped.has(slot))) throw new TypeError('Clothing enactment exceeds obligation scope');
  }
  return true;
}
