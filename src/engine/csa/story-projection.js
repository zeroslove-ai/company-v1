import { getActiveCsaEntries } from './applicability.js';
import { compareRequiredClothing, requiredClothingFromActiveCsa } from '../state/clothing.js';
import {
  authorityPolicyFor,
  enactmentForPhase,
  matchesCsaSubjectScope,
  phaseForRule,
  subjectScopeForRule
} from './authority-policy.js';

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

function projectWorldRule(entry, expectedTurn, sceneProfiles) {
  const rule = object(entry);
  const preset = object(rule.preset);
  const authority = authorityFor(rule, preset);
  const phase = phaseForRule(rule, expectedTurn);
  const subjectScope = subjectScopeForRule(rule);
  const policy = authorityPolicyFor(authority);
  const knownSceneActorIds = sceneProfiles.map(({ id }) => id);
  const applicableSceneActorIds = sceneProfiles
    .filter(({ id, profile }) => matchesCsaSubjectScope({ ...profile, id }, subjectScope))
    .map(({ id }) => id);
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
    known_scene_actor_ids: knownSceneActorIds,
    applicable_scene_actor_ids: applicableSceneActorIds,
    execution_policy: 'default_comply'
  };
}

function projectObligations(save, master, sceneActorIds, activeEntries) {
  const state = object(save?.npc_scene_state);
  const obligations = [];
  for (const actorId of Array.isArray(sceneActorIds) ? sceneActorIds : []) {
    if (!text(actorId) || actorId === 'player') continue;
    const profile = profileFor(master, actorId);
    const actual = object(state[actorId]?.clothing);
    const resolved = requiredClothingFromActiveCsa(activeEntries, { ...profile, id: actorId });
    if (resolved.conflicted || !Object.keys(resolved.required_clothing).length) continue;
    const rule = activeEntries.find(entry => entry.id === resolved.source_csa_id);
    const preset = object(rule?.preset);
    if (modeFor(rule, preset) !== 'continuous') continue;
    if (Object.keys(resolved.required_clothing).some(slot => actual[slot] === undefined || actual[slot] === 'unknown')) continue;
    if (compareRequiredClothing(actual, resolved.required_clothing) !== 'noncompliant') continue;
    obligations.push({
      actor_id: actorId,
      source_rule_id: resolved.source_csa_id,
      type: 'clothing_transition',
      changes: Object.entries(resolved.required_clothing).map(([slot, required]) => ({ slot, current: actual[slot], required }))
    });
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
    world_rules: activeEntries.map(entry => projectWorldRule(entry, expectedTurn, sceneProfiles)),
    scene_obligations: projectObligations(save, master, sceneActorIds, activeEntries)
  };
}
