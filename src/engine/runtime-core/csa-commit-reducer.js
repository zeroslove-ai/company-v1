import { getApplicableCsaEntries } from '../csa/applicability.js';
import { buildCsaRuntimeStatePatch, buildCsaAftereffectPatch } from '../csa/reducer.js';
import { applyAuthorizedRuleDefinitions, assertRuleDefinitionAuthority } from './action-authority.js';
import { calculateCsaProgression, calculateProgress } from '../progression.js';

function clone(value) { return value === undefined ? undefined : structuredClone(value); }

function isFeedback(action) {
  return action?.action_kind === 'feedback_revision';
}

function activeIds(save) {
  return new Set(Array.isArray(save?.csa_active) ? save.csa_active : []);
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
  structuredAction = null,
  transactionResolution = null
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

  applyAuthorizedRuleDefinitions({
    currentSave: current,
    nextSave,
    transactionResolution,
    structuredAction,
    stage: 'commit-csa-definition'
  });

  const activeCsa = getApplicableCsaEntries(nextSave);
  const runtimeResult = buildCsaRuntimeStatePatch({
    previousSave: current,
    csaRuntimeUpdates: observation?.csa_runtime_updates,
    csaTriggerEvaluations: observation?.csa_trigger_evaluations,
    activeCsa,
    npcsPresent: canonicalScene?.present_npc_ids ?? [],
    turnNumber: expectedTurn
  });
  if (runtimeResult.patch) nextSave.csa_runtime_state = clone(runtimeResult.patch);
  warnings.push(...(runtimeResult.warnings ?? []));

  const beforeActive = activeIds(current);
  const afterActive = activeIds(nextSave);
  const deactivatedIds = [...beforeActive].filter(id => !afterActive.has(id));
  const aftereffectPatch = buildCsaAftereffectPatch({
    previousSave: current,
    deactivatedIds,
    npcsPresent: canonicalScene?.present_npc_ids ?? [],
    turnNumber: expectedTurn
  });
  if (aftereffectPatch) nextSave.csa_aftereffect_state = clone(aftereffectPatch);

  const previouslyExperienced = new Set(Array.isArray(current.csa_experienced_ids) ? current.csa_experienced_ids : []);
  const progression = calculateCsaProgression({
    csaOperations: structuredAction?.operations ?? [],
    experiencedThisTurn: runtimeResult.accepted_executions,
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
    acceptedExecutions: runtimeResult.accepted_executions ?? [],
    progression,
    deactivatedIds
  };
}
