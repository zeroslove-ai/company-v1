import { getActiveCsaEntries } from './applicability.js';
import { compareRequiredClothing } from '../state/clothing.js';
import {
  authorityPolicyFor,
  enactmentForPhase,
  matchesCsaSubjectScope,
  phaseForRule,
  subjectScopeForRule
} from './authority-policy.js';
import { executionMetadataForRule } from './execution-policy.js';
import { canonicalCompanyPlayerProfile } from '../player-setup.js';
import { resolveUserMentionedNpcIds } from '../scene-cast.js';

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

function triggerStateFor(triggerKind, { actorPresent, targetCount, postureReady = false, targetPostureReady = false } = {}) {
  if (!actorPresent) return 'not_applicable';
  if (triggerKind === 'always_during_work') return 'required_now';
  // close_interaction means an authoritative current actor-target pair here;
  // it does not infer physical distance or run a semantic proximity matcher.
  if (triggerKind === 'scene_interaction' || triggerKind === 'close_interaction' || triggerKind === 'close_conversation') return targetCount > 0 ? 'required_now' : 'conditional';
  if (triggerKind === 'target_seated_interaction') return targetCount > 0 && targetPostureReady ? 'required_now' : 'conditional';
  if (triggerKind === 'both_seated_interaction' || triggerKind === 'both_seated') return postureReady ? 'required_now' : 'conditional';
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

export function isSeatedState(state) {
  const posture = text(state?.posture)?.toLowerCase() ?? '';
  return posture === 'sitting' || posture === 'seated';
}

function postureReadyForTargets(save, actorId, targetIds) {
  if (!Array.isArray(targetIds) || targetIds.length === 0) return false;
  return [actorId, ...targetIds].every(id => isSeatedState(sceneStateFor(save, id)));
}

function targetPostureReady(save, targetIds) {
  return Array.isArray(targetIds) && targetIds.length === 1
    && isSeatedState(sceneStateFor(save, targetIds[0]));
}

function eligibleTargetIds({ actorId, counterpartyScope, sceneProfiles }) {
  return sceneProfiles
    .filter(({ id, profile }) => id !== actorId && matchesCsaSubjectScope({ ...profile, id }, counterpartyScope || 'company_employee'))
    .map(({ id }) => id);
}

function activeRelationTargetIds(save, actorId, candidates) {
  return (Array.isArray(save?.active_relations) ? save.active_relations : [])
    .filter(item => item?.state === 'active' && item.actor_id === actorId && candidates.includes(item.target_id))
    .map(item => item.target_id);
}

function explicitInteractionActorIds(sceneProfiles = [], playerAction = '') {
  return resolveUserMentionedNpcIds({
    characters: sceneProfiles.map(item => ({ ...item.profile, character_id: item.id })),
    general_npcs: []
  }, playerAction);
}

function resolvedInteractionTargetIds({ save, actorId, candidates, sceneProfiles = [], playerAction = '', focalCharacterId = null, lastSpeakerId = null, explicitInteractionActorIds = [] }) {
  if (candidates.length === 0) return [];
  const mentioned = resolveUserMentionedNpcIds({
    characters: sceneProfiles.map(item => ({ ...item.profile, character_id: item.id })),
    general_npcs: []
  }, playerAction);
  const mentionedCandidates = mentioned.filter(id => candidates.includes(id));

  // A Player action mention is resolved once for the whole turn.  Once there
  // is exactly one registered NPC mention, that NPC is the only interaction
  // actor allowed to form a new Player pair.  Other applicable actors must
  // not reuse a previous focal/active relation in the same turn.
  if (explicitInteractionActorIds.length > 0) {
    if (explicitInteractionActorIds.length !== 1 || explicitInteractionActorIds[0] !== actorId) return [];
    return candidates.includes('player') ? ['player'] : [];
  }

  // With no explicit actor authority, retain the existing canonical fallback
  // order for focal/current interaction and structured active relations.
  if (candidates.includes('player') && mentioned.includes(actorId)) return ['player'];
  if (candidates.includes('player') && focalCharacterId === actorId) return ['player'];

  // An explicitly named eligible NPC counterpart is usable only when the
  // canonical focal/last-speaker facts also identify this actor as the
  // current interaction actor.  A candidate name alone is not interaction.
  if (mentionedCandidates.length === 1
    && (focalCharacterId === actorId || (lastSpeakerId === actorId && focalCharacterId === mentionedCandidates[0]))) {
    return mentionedCandidates;
  }

  // Last-speaker continuity is weaker than focal authority: it is considered
  // only together with an exact named counterpart and the actor identity.
  const related = activeRelationTargetIds(save, actorId, candidates);
  if (related.length === 1) return related;
  return [];
}

function resolvedFactsForRule({ entry, save, execution, sceneProfiles, applicableSceneActorIds, playerAction = '', explicitInteractionActorIds = [] }) {
  const runtime = object(save?.csa_runtime_state);
  const preset = object(entry?.preset);
  const requestOnly = modeFor(entry, preset) === 'on_player_request';
  const targetProfiles = [...sceneProfiles, { id: 'player', profile: { ...canonicalCompanyPlayerProfile(save?.player), id: 'player', player: true } }];
  const facts = [];
  for (const actorId of applicableSceneActorIds) {
    const actorState = object(save?.npc_scene_state?.[actorId]);
    const requiredState = execution?.required_state ? { ...execution.required_state } : null;
    const observedClothing = object(actorState.clothing);
    const currentState = execution?.kind === 'clothing_state'
      ? Object.fromEntries(Object.keys(requiredState ?? {}).map(slot => [slot, observedClothing[slot] ?? 'unknown']))
      : (runtime?.[entry.id]?.execution_state ?? 'not_started');
    const clothingVerdict = execution?.kind === 'clothing_state'
      ? compareRequiredClothing(currentState, requiredState ?? {})
      : null;
    const eligibleTargets = execution?.target_required
      ? eligibleTargetIds({ actorId, counterpartyScope: text(entry.preset?.counterparty_scope) ?? text(entry.counterparty_scope), sceneProfiles: targetProfiles })
      : [];
    const resolvedTargets = execution?.target_required
      ? resolvedInteractionTargetIds({ save, actorId, candidates: eligibleTargets, sceneProfiles, playerAction, focalCharacterId: save?.scene?.focal_character_id, lastSpeakerId: save?.scene?.last_speaker_id, explicitInteractionActorIds })
      : [];
    const targets = resolvedTargets.length === 1 ? resolvedTargets : eligibleTargets;
    const triggerState = requestOnly
      ? 'conditional'
      : execution?.kind === 'clothing_state'
        ? triggerStateFor(execution.trigger_kind, { actorPresent: true })
        : triggerStateFor(execution?.trigger_kind, {
          actorPresent: true,
          targetCount: resolvedTargets.length,
          postureReady: postureReadyForTargets(save, actorId, resolvedTargets),
          targetPostureReady: targetPostureReady(save, resolvedTargets)
        });
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
      ...(execution?.target_required ? { eligible_target_ids: targets } : {}),
      ...(execution?.target_required ? { resolved_target_ids: resolvedTargets } : {}),
      transition_required_now: execution?.kind === 'clothing_state'
        ? clothingVerdict !== 'compliant' && triggerState === 'required_now'
        : triggerState === 'required_now',
      implementation_delay_allowed: triggerState !== 'required_now' && object(entry.preset).implementation_delay_allowed === true,
      execution_policy: executionPolicyFor(triggerState)
    });
  }
  return facts;
}

function projectWorldRule(entry, expectedTurn, sceneProfiles, save, playerAction = '', explicitInteractionActorIds = []) {
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
  const resolvedFacts = resolvedFactsForRule({ entry, save, execution, sceneProfiles, applicableSceneActorIds, playerAction, explicitInteractionActorIds });
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
    ...(Number.isInteger(rule.created_turn) ? { created_turn: rule.created_turn } : {}),
    ...(Number.isInteger(rule.updated_turn) ? { updated_turn: rule.updated_turn } : {}),
    ...(Object.keys(object(rule.activated_game_time)).length ? { activated_game_time: object(rule.activated_game_time) } : {}),
    ...(Object.keys(object(rule.updated_game_time)).length ? { updated_game_time: object(rule.updated_game_time) } : {}),
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

function projectObligations(worldRules) {
  const obligations = [];
  const clothingRuleCounts = new Map();
  for (const worldRule of Array.isArray(worldRules) ? worldRules : []) {
    if (object(worldRule.execution_contract).kind !== 'clothing_state' || worldRule.mode !== 'continuous') continue;
    for (const fact of Array.isArray(worldRule.resolved_facts) ? worldRule.resolved_facts : []) {
      if (fact.trigger_state === 'required_now' && fact.execution_policy === 'mandatory_execution') {
        clothingRuleCounts.set(fact.actor_id, (clothingRuleCounts.get(fact.actor_id) ?? 0) + 1);
      }
    }
  }
  for (const worldRule of Array.isArray(worldRules) ? worldRules : []) {
    const execution = object(worldRule.execution_contract);
    for (const fact of Array.isArray(worldRule.resolved_facts) ? worldRule.resolved_facts : []) {
      if (fact.trigger_state === 'not_applicable') continue;
      if (execution.kind === 'clothing_state') {
        if (fact.already_effective === true) continue;
        if (fact.trigger_state !== 'required_now' || fact.execution_policy !== 'mandatory_execution') continue;
        if ((clothingRuleCounts.get(fact.actor_id) ?? 0) > 1) continue;
        const requiredState = object(fact.required_state);
        obligations.push({
          actor_id: fact.actor_id,
          source_rule_id: worldRule.id,
          type: 'clothing_transition',
          changes: Object.entries(requiredState).map(([slot, required]) => ({
            slot,
            current: object(fact.current_state)[slot] ?? 'unknown',
            required
          }))
        });
        continue;
      }
      if (execution.action) {
        obligations.push({
          actor_id: fact.actor_id,
          source_rule_id: worldRule.id,
          type: 'behavior_execution',
          action: execution.action,
          trigger_state: fact.trigger_state,
          eligible_target_ids: fact.eligible_target_ids ?? [],
          execution_policy: fact.execution_policy
        });
      }
    }
  }
  return obligations;
}

/** Read-only, per-turn Story projection of canonical institutional rules and obligations. */
export function buildStoryWorldProjection({ save = {}, master = {}, sceneActorIds = [], expectedTurn = null, playerAction = '' } = {}) {
  const activeEntries = getActiveCsaEntries(save);
  const sceneProfiles = (Array.isArray(sceneActorIds) ? sceneActorIds : [])
    .filter(id => text(id) && id !== 'player')
    .map(id => ({ id, profile: profileFor(master, id) }));
  const explicitActors = explicitInteractionActorIds(sceneProfiles, playerAction);
  const worldRules = activeEntries.map(entry => projectWorldRule(entry, expectedTurn, sceneProfiles, save, playerAction, explicitActors));
  return {
    world_rules: worldRules,
    scene_obligations: projectObligations(worldRules)
  };
}
