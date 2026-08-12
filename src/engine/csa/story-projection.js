import { getActiveCsaEntries } from './applicability.js';
import { compareRequiredClothing, requiredClothingFromActiveCsa } from '../state/clothing.js';
import {
  authorityPolicyFor,
  enactmentForPhase,
  matchesCsaSubjectScope,
  phaseForRule,
  subjectScopeForRule
} from './authority-policy.js';
import { executionMetadataForRule } from './execution-policy.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function profileFor(master, id) {
  const characters = Array.isArray(master?.characters) ? master.characters : [];
  const generalNpcs = Array.isArray(master?.general_npcs) ? master.general_npcs : [];
  return characters.find(entry => (entry?.character_id ?? entry?.id) === id)
    ?? generalNpcs.find(entry => (entry?.npc_id ?? entry?.id) === id)
    ?? {};
}

function authorityFor(rule, preset) {
  return text(preset?.authority_tier)
    ?? text(rule?.authority_tier)
    ?? text(rule?.strength)
    ?? 'weak';
}

function modeFor(rule, preset) {
  return preset?.mode === 'on_player_request' ? 'on_player_request' : 'continuous';
}

function triggerStateFor(triggerKind, { actorPresent, targetCount, postureReady = false } = {}) {
  if (!actorPresent) return 'not_applicable';
  if (triggerKind === 'always_during_work') return 'required_now';
  if (triggerKind === 'scene_interaction') return targetCount > 0 ? 'required_now' : 'conditional';
  if (triggerKind === 'both_seated') return postureReady ? 'required_now' : 'conditional';
  return 'conditional';
}

function executionPolicyFor(triggerState) {
  return triggerState === 'required_now' ? 'mandatory_execution' : 'conditional';
}

function sceneStateFor(save, id) {
  if (id === 'player') {
    return object(save?.player_scene_state ?? save?.player?.scene_state);
  }
  return object(save?.npc_scene_state?.[id]);
}

function isSeatedState(state) {
  const posture = text(state?.posture)?.toLowerCase() ?? '';
  const position = text(state?.position_label)?.toLowerCase() ?? '';
  return /(?:^|[ _-])(sitting|seated)(?:$|[ _-])/.test(posture)
    || /(?:^|[ _-])(?:sitting|seated)(?:$|[ _-])/.test(position)
    || posture.includes('앉')
    || position.includes('앉');
}

function postureReadyForTargets(save, actorId, targetIds) {
  if (!Array.isArray(targetIds) || targetIds.length === 0) return false;
  return [actorId, ...targetIds].every(id => isSeatedState(sceneStateFor(save, id)));
}

function eligibleTargetIds({ actorId, counterpartyScope, sceneProfiles }) {
  return sceneProfiles
    .filter(({ id, profile }) => id !== actorId && matchesCsaSubjectScope({ ...profile, id }, counterpartyScope || 'company_employee'))
    .map(({ id }) => id);
}

function resolvedFactsForRule({ entry, save, execution, sceneProfiles, applicableSceneActorIds }) {
  const runtime = object(save?.csa_runtime_state);
  const targetProfiles = [...sceneProfiles, { id: 'player', profile: { ...object(save?.player), id: 'player', player: true } }];
  const facts = [];
  for (const actorId of applicableSceneActorIds) {
    const actorState = object(save?.npc_scene_state?.[actorId]);
    const currentState = execution?.kind === 'clothing_state'
      ? object(actorState.clothing)
      : (runtime?.[entry.id]?.execution_state ?? 'not_started');
    const requiredState = execution?.required_state ? { ...execution.required_state } : null;
    const clothingVerdict = execution?.kind === 'clothing_state'
      ? compareRequiredClothing(currentState, requiredState ?? {})
      : null;
    const targets = execution?.target_required
      ? eligibleTargetIds({ actorId, counterpartyScope: text(entry.preset?.counterparty_scope) ?? text(entry.counterparty_scope), sceneProfiles: targetProfiles })
      : [];
    const triggerState = execution?.kind === 'clothing_state'
      ? triggerStateFor(execution.trigger_kind, { actorPresent: true })
      : triggerStateFor(execution?.trigger_kind, { actorPresent: true, targetCount: targets.length, postureReady: postureReadyForTargets(save, actorId, targets) });
    facts.push({
      rule_id: entry.id,
      already_effective: execution?.kind === 'clothing_state'
        ? clothingVerdict === 'compliant'
        : runtime?.[entry.id]?.execution_state === 'executed',
      actor_id: actorId,
      execution_kind: execution?.kind ?? null,
      trigger_state: triggerState,
      current_state: currentState,
      required_state: requiredState,
      transition_required_now: execution?.kind === 'clothing_state'
        ? clothingVerdict === 'noncompliant' && triggerState === 'required_now'
        : triggerState === 'required_now' && runtime?.[entry.id]?.execution_state !== 'executed',
      implementation_delay_allowed: triggerState !== 'required_now' && object(entry.preset).implementation_delay_allowed === true,
      execution_policy: executionPolicyFor(triggerState)
    });
  }
  return facts;
}

function projectWorldRule(entry, expectedTurn, sceneProfiles, save) {
  const rule = object(entry);
  const preset = object(rule.preset);
  const authority = authorityFor(rule, preset);
  const phase = phaseForRule(rule, expectedTurn);
  const subjectScope = subjectScopeForRule(rule);
  const policy = authorityPolicyFor(authority);
  const execution = executionMetadataForRule(rule);
  const knownSceneActorIds = sceneProfiles.map(({ id }) => id);
  const applicableSceneActorIds = sceneProfiles
    .filter(({ id, profile }) => matchesCsaSubjectScope({ ...profile, id }, subjectScope))
    .map(({ id }) => id);
  const resolvedFacts = resolvedFactsForRule({ entry, save, execution, sceneProfiles, applicableSceneActorIds });
  const executionPolicy = resolvedFacts.some(fact => fact.trigger_state === 'required_now')
    ? 'mandatory_execution'
    : 'conditional';
  return {
    id: entry.id,
    content: text(rule.content) ?? '',
    authority,
    phase,
    institutional_form: policy.institutional_form,
    enactment: enactmentForPhase(phase),
    mode: modeFor(rule, preset),
    subject_scope: subjectScope,
    counterparty_scope: text(preset.counterparty_scope) ?? text(rule.counterparty_scope),
    trigger: text(preset.trigger) ?? (modeFor(rule, preset) === 'on_player_request' ? 'on_counterparty_request' : 'continuous'),
    ...(execution ? { execution_contract: execution } : {}),
    resolved_facts: resolvedFacts,
    known_scene_actor_ids: knownSceneActorIds,
    applicable_scene_actor_ids: applicableSceneActorIds,
    execution_policy: executionPolicy
  };
}

function projectObligations(save, master, sceneActorIds, activeEntries) {
  const state = object(save?.npc_scene_state);
  const obligations = [];
  const playerProfile = { ...(object(save?.player)), id: 'player', player: true };
  const sceneProfiles = [
    ...(Array.isArray(sceneActorIds) ? sceneActorIds : []).filter(id => text(id) && id !== 'player').map(id => ({ id, profile: profileFor(master, id) })),
    { id: 'player', profile: playerProfile }
  ];
  for (const actorId of Array.isArray(sceneActorIds) ? sceneActorIds : []) {
    if (!text(actorId) || actorId === 'player') continue;
    const profile = profileFor(master, actorId);
    const actual = object(state[actorId]?.clothing);
    const resolved = requiredClothingFromActiveCsa(activeEntries, { ...profile, id: actorId });
    if (resolved.conflicted || !Object.keys(resolved.required_clothing).length) {
      // Clothing is the existing evidence-gated obligation path. Non-clothing
      // behavior obligations are projected below from catalog execution data.
    } else {
      const rule = activeEntries.find(entry => entry.id === resolved.source_csa_id);
      const preset = object(rule?.preset);
      if (modeFor(rule, preset) === 'continuous'
        && !Object.keys(resolved.required_clothing).some(slot => state[actorId]?.clothing?.[slot] === undefined || state[actorId]?.clothing?.[slot] === 'unknown')
        && compareRequiredClothing(actual, resolved.required_clothing) === 'noncompliant') {
        obligations.push({
          actor_id: actorId,
          source_rule_id: resolved.source_csa_id,
          type: 'clothing_transition',
          changes: Object.entries(resolved.required_clothing).map(([slot, required]) => ({ slot, current: actual[slot], required }))
        });
      }
    }
  }

  for (const entry of activeEntries) {
    const rule = object(entry);
    const preset = object(rule.preset);
    const execution = executionMetadataForRule(rule);
    if (!execution || !execution.kind || execution.kind === 'clothing_state' || !execution.action) continue;
    const subjectScope = subjectScopeForRule(rule);
    const actors = sceneProfiles.filter(({ id, profile }) => id !== 'player' && matchesCsaSubjectScope({ ...profile, id }, subjectScope));
    for (const { id: actorId } of actors) {
      const targets = execution.target_required
        ? eligibleTargetIds({ actorId, counterpartyScope: text(preset.counterparty_scope) ?? text(rule.counterparty_scope), sceneProfiles })
        : [];
      const trigger_state = triggerStateFor(execution.trigger_kind, {
        actorPresent: true,
        targetCount: targets.length,
        postureReady: postureReadyForTargets(save, actorId, targets)
      });
      if (trigger_state === 'not_applicable') continue;
      obligations.push({
        actor_id: actorId,
        source_rule_id: entry.id,
        type: 'behavior_execution',
        action: execution.action,
        trigger_state,
        eligible_target_ids: targets,
        execution_policy: executionPolicyFor(trigger_state)
      });
    }
  }
  return obligations;
}

/** Read-only, per-turn Story projection of canonical institutional rules and obligations. */
export function buildStoryWorldProjection({ save = {}, master = {}, sceneActorIds = [], expectedTurn = null } = {}) {
  const activeEntries = getActiveCsaEntries(save);
  const sceneProfiles = (Array.isArray(sceneActorIds) ? sceneActorIds : [])
    .filter(id => text(id) && id !== 'player')
    .map(id => ({ id, profile: profileFor(master, id) }));
  return {
    world_rules: activeEntries.map(entry => projectWorldRule(entry, expectedTurn, sceneProfiles, save)),
    scene_obligations: projectObligations(save, master, sceneActorIds, activeEntries)
  };
}
