import { getActiveCsaEntries } from './applicability.js';
import { compareRequiredClothing } from '../state/clothing.js';
import { subjectScopeForRule } from './authority-policy.js';
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
  const subjectScope = subjectScopeForRule(rule);
  const execution = executionMetadataForRule(rule);
  const result = {
    id: entry.id,
    content: text(rule.content) ?? '',
    subject_scope: subjectScope,
    counterparty_scope: text(preset.counterparty_scope) ?? text(rule.counterparty_scope),
    effective_game_time: rule.effective_game_time ?? rule.activated_game_time ?? null,
    trigger: text(preset.trigger) ?? text(rule.trigger)
  };
  const clothing = clothingProjection({ entry, execution, applicableSceneActorIds: sceneProfiles.map(({ id }) => id), save });
  if (clothing) result.clothing_projection = clothing;
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
