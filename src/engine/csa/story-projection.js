import { getActiveCsaEntries } from './applicability.js';
import { compareRequiredClothing } from '../state/clothing.js';
import {
  authorityPolicyFor,
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

function clothingProjection({ entry, execution, applicableSceneActorIds, save }) {
  if (execution?.kind !== 'clothing_state') return null;
  const requiredState = { ...(execution.required_state ?? {}) };
  return {
    kind: 'clothing_state',
    required_state: requiredState,
    actors: applicableSceneActorIds.map(actorId => {
      const current = object(save?.npc_scene_state?.[actorId]?.clothing);
      return {
        actor_id: actorId,
        current_state: Object.fromEntries(Object.keys(requiredState).map(slot => [slot, current[slot] ?? 'unknown'])),
        compliant: compareRequiredClothing(current, requiredState) === 'compliant'
      };
    })
  };
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
  const result = {
    id: entry.id,
    content: text(rule.content) ?? '',
    authority,
    phase,
    institutional_form: policy.institutional_form,
    mode: modeFor(rule, preset),
    subject_scope: subjectScope,
    counterparty_scope: text(preset.counterparty_scope) ?? text(rule.counterparty_scope),
    trigger: text(preset.trigger) ?? (modeFor(rule, preset) === 'on_player_request' ? 'on_counterparty_request' : 'continuous'),
    known_scene_actor_ids: knownSceneActorIds,
    applicable_scene_actor_ids: applicableSceneActorIds
  };
  const clothing = clothingProjection({ entry, execution, applicableSceneActorIds, save });
  if (clothing) result.clothing_projection = clothing;
  if (Number.isInteger(rule.created_turn)) result.created_turn = rule.created_turn;
  if (Number.isInteger(rule.updated_turn)) result.updated_turn = rule.updated_turn;
  if (Object.keys(object(rule.activated_game_time)).length) result.activated_game_time = object(rule.activated_game_time);
  if (Object.keys(object(rule.updated_game_time)).length) result.updated_game_time = object(rule.updated_game_time);
  return result;
}

/**
 * Read-only Story context for active institutional rules.  No physical action,
 * posture, relation, enactment, or direct-coverage obligation is emitted.
 */
export function buildStoryWorldProjection({ save = {}, master = {}, sceneActorIds = [], expectedTurn = null } = {}) {
  const activeEntries = getActiveCsaEntries(save);
  const sceneProfiles = (Array.isArray(sceneActorIds) ? sceneActorIds : [])
    .filter(id => text(id) && id !== 'player')
    .map(id => ({ id, profile: profileFor(master, id) }));
  return {
    world_rules: activeEntries.map(entry => projectWorldRule(entry, expectedTurn, sceneProfiles, save))
  };
}

export function buildCsaStoryContext({ save = {}, master = {}, sceneActorIds = [], expectedTurn = null } = {}) {
  return buildStoryWorldProjection({ save, master, sceneActorIds, expectedTurn });
}
