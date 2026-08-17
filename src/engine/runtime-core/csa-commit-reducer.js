import { applyAuthorizedRuleDefinitions, assertRuleDefinitionAuthority } from './action-authority.js';
import { calculateCsaProgression, calculateProgress } from '../progression.js';
import { matchesCsaSubjectScope, subjectScopeForRule } from '../csa/authority-policy.js';
import { clothingMechanicForRule } from '../csa/clothing-state-mechanic.js';

function clone(value) { return value === undefined ? undefined : structuredClone(value); }

function isFeedback(action) {
  return action?.action_kind === 'feedback_revision';
}

function activeIds(save) {
  return new Set(Array.isArray(save?.csa_active) ? save.csa_active : []);
}

function actorProfile(master, save, actorId) {
  if (actorId === 'player') {
    const player = save?.player && typeof save.player === 'object' ? save.player : {};
    return { ...player, id: 'player', character_id: 'player', player: true, gender: player.gender ?? player.sex ?? 'male' };
  }
  const entries = [
    ...(Array.isArray(master?.characters) ? master.characters : []),
    ...(Array.isArray(master?.general_npcs) ? master.general_npcs : [])
  ];
  const profile = entries.find(item => (item?.character_id ?? item?.npc_id ?? item?.id) === actorId) ?? {};
  return { ...profile, id: actorId, character_id: profile.character_id ?? profile.npc_id ?? profile.id ?? actorId };
}

function applyClothingContinuity(nextSave, canonicalScene, master = {}) {
  const present = Array.isArray(canonicalScene?.present_npc_ids) ? canonicalScene.present_npc_ids : [];
  const actorIds = ['player', ...present].filter((id, index, ids) => ids.indexOf(id) === index);
  const rules = nextSave?.csa_rules && typeof nextSave.csa_rules === 'object' ? nextSave.csa_rules : {};
  const active = new Set(Array.isArray(nextSave?.csa_active) ? nextSave.csa_active : []);
  const patches = [];
  for (const id of active) {
    const rule = rules[id];
    const execution = clothingMechanicForRule(rule);
    const required = execution?.kind === 'clothing_state' ? execution.required_state : null;
    if (!required || Object.keys(required).length === 0) continue;
    const subjectScope = subjectScopeForRule(rule);
    for (const actorId of actorIds) {
      const profile = actorProfile(master, nextSave, actorId);
      if (!matchesCsaSubjectScope(profile, subjectScope)) continue;
      if (actorId === 'player') {
        const current = nextSave.player_scene_state && typeof nextSave.player_scene_state === 'object' ? nextSave.player_scene_state : {};
        nextSave.player_scene_state = { ...current, clothing: { ...(current.clothing ?? {}), ...required } };
      } else {
        const current = nextSave.npc_scene_state?.[actorId];
        if (!current || typeof current !== 'object') continue;
        nextSave.npc_scene_state[actorId] = { ...current, clothing: { ...(current.clothing ?? {}), ...required } };
      }
      patches.push(`${actorId}:${id}`);
    }
  }
  return patches;
}

/**
 * Owns every CSA-related write made by a fresh gameplay Commit. This is a
 * pure reducer: it consumes already verified resolution/observation inputs and
 * never performs HTTP, DB, signature, or planning work.
 */
export function reduceCsaCommitState({
  currentSave,
  nextSave,
  observation,
  canonicalScene,
  action,
  expectedTurn,
  master = {},
  structuredAction = null,
  transactionResolution = null,
} = {}) {
  const warnings = [];
  const current = currentSave ?? {};
  const feedback = isFeedback(action);

  // Feedback rewrites a historical turn. It must not advance cumulative CSA
  // runtime, aftereffect, or progression state in the current save.
  if (feedback) {
    assertRuleDefinitionAuthority({ currentSave: current, nextSave, structuredAction: null, stage: 'commit-feedback-final' });
    return { nextSave, warnings, acceptedExecutions: [], progression: { amount: 0, newly_experienced_keys: [] }, deactivatedIds: [] };
  }

  // Commit is the sole durable writer for signed CSA definitions. Story and
  // Extract may receive an in-memory projection, but they never mutate save.
  if (structuredAction && transactionResolution) {
    applyAuthorizedRuleDefinitions({ currentSave: current, nextSave, transactionResolution, structuredAction, stage: 'commit-csa' });
  }

  // Clothing is the single retained machine-readable CSA mechanic.  Its exact
  // required_state is applied directly to present actors; no generic action DSL
  // or inferred physical action is created.
  applyClothingContinuity(nextSave, canonicalScene, master);

  // Fresh Extract never writes a physical CSA execution state. Historical
  // csa_runtime_state remains readable, while observed physical/clothing facts
  // arrive through the structural open-fact and narrow clothing projections.
  const acceptedExecutions = [];

  const beforeActive = transactionResolution && Array.isArray(transactionResolution.previous_csa_active)
    ? new Set(transactionResolution.previous_csa_active)
    : activeIds(current);
  const afterActive = activeIds(nextSave);
  const deactivatedIds = [...beforeActive].filter(id => !afterActive.has(id));
  const previouslyExperienced = new Set(Array.isArray(current.csa_experienced_ids) ? current.csa_experienced_ids : []);
  const progression = calculateCsaProgression({
    csaOperations: structuredAction?.operations ?? [],
    experiencedThisTurn: acceptedExecutions,
    previouslyExperienced,
    degraded: observation?.outcome === 'degraded'
  });
  if (progression.newly_experienced_keys.length) {
    nextSave.csa_experienced_ids = [...previouslyExperienced, ...progression.newly_experienced_keys];
  }
  if (progression.amount > 0) {
    const progress = calculateProgress(current.player_progress, progression.amount);
    nextSave.player_progress = { level: progress.level, exp: progress.exp };
  }

  assertRuleDefinitionAuthority({
    currentSave: current,
    nextSave,
    transactionResolution,
    structuredAction,
    stage: 'commit-csa-final'
  });

  return {
    nextSave,
    warnings,
    acceptedExecutions,
    progression,
    deactivatedIds
  };
}
