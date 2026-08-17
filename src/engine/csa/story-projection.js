import { getActiveCsaEntries } from './applicability.js';
import { compareRequiredClothing } from '../state/clothing.js';
import { matchesCsaSubjectScope, subjectScopeForRule } from './authority-policy.js';
import { clothingMechanicForRule } from './clothing-state-mechanic.js';

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

function actorProfile(master, save, id) {
  if (id === 'player') {
    const player = object(save?.player);
    return { ...player, id: 'player', character_id: 'player', player: true, gender: player.gender ?? player.sex ?? 'male' };
  }
  const profile = profileFor(master, id);
  return { ...profile, id, character_id: profile.character_id ?? profile.npc_id ?? profile.id ?? id };
}

function clothingForActor(save, actorId) {
  if (actorId === 'player') return object(save?.player_scene_state?.clothing) ?? object(save?.player?.clothing) ?? {};
  return object(save?.npc_scene_state?.[actorId]?.clothing) ?? {};
}

function clothingProjection({ execution, applicableActorIds, save }) {
  if (execution?.kind !== 'clothing_state') return null;
  const requiredState = { ...(execution.required_state ?? {}) };
  return {
    kind: 'clothing_state',
    required_state: requiredState,
    actors: applicableActorIds.map(actorId => {
      const current = clothingForActor(save, actorId);
      return {
        actor_id: actorId,
        current_state: Object.fromEntries(Object.keys(requiredState).map(slot => [slot, current[slot] ?? 'unknown'])),
        compliant: compareRequiredClothing(current, requiredState) === 'compliant'
      };
    })
  };
}

function projectWorldRule(entry, expectedTurn, actorProfiles, save) {
  const rule = object(entry);
  const preset = object(rule.preset);
  const subjectScope = subjectScopeForRule(rule);
  const execution = clothingMechanicForRule(rule);
  const result = {
    id: entry.id,
    content: text(rule.content) ?? '',
    subject_scope: subjectScope,
    counterparty_scope: text(preset.counterparty_scope) ?? text(rule.counterparty_scope),
    effective_game_time: rule.effective_game_time ?? rule.activated_game_time ?? null,
    trigger: text(preset.trigger) ?? text(rule.trigger)
  };
  const applicableActorIds = actorProfiles
    .filter(({ profile }) => matchesCsaSubjectScope(profile, subjectScope))
    .map(({ id }) => id);
  const clothing = clothingProjection({ execution, applicableActorIds, save });
  if (clothing) result.clothing_projection = clothing;
  return result;
}

/**
 * Read-only Story context for active institutional rules.  No physical action,
 * posture, relation, enactment, or direct-coverage obligation is emitted.
 */
export function buildStoryWorldProjection({ save = {}, master = {}, sceneActorIds = [], expectedTurn = null } = {}) {
  const activeEntries = getActiveCsaEntries(save);
  const actorIds = ['player', ...(Array.isArray(sceneActorIds) ? sceneActorIds : [])]
    .filter((id, index, ids) => text(id) && ids.indexOf(id) === index);
  const actorProfiles = actorIds.map(id => ({ id, profile: actorProfile(master, save, id) }));
  return {
    world_rules: activeEntries.map(entry => projectWorldRule(entry, expectedTurn, actorProfiles, save))
  };
}

export function buildCsaStoryContext({ save = {}, master = {}, sceneActorIds = [], expectedTurn = null } = {}) {
  return buildStoryWorldProjection({ save, master, sceneActorIds, expectedTurn });
}
