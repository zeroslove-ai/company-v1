import { getApplicableCsaEntries } from '../csa/applicability.js';
import { buildCsaRuntimeStatePatch, buildCsaAftereffectPatch } from '../csa/reducer.js';
import { applyAuthorizedRuleDefinitions, assertRuleDefinitionAuthority } from './action-authority.js';
import { calculateCsaProgression, calculateProgress } from '../progression.js';
import { compareRequiredClothing } from '../state/clothing.js';
import { executionMetadataForRule } from '../csa/execution-policy.js';

function clone(value) { return value === undefined ? undefined : structuredClone(value); }

function isFeedback(action) {
  return action?.action_kind === 'feedback_revision';
}

function activeIds(save) {
  return new Set(Array.isArray(save?.csa_active) ? save.csa_active : []);
}

function canonicalRuntimeUpdates({ updates, activeCsa, nextSave, warnings }) {
  const entries = new Map((activeCsa ?? []).map(entry => [entry.id, entry]));
  return (Array.isArray(updates) ? updates : []).filter(update => {
    const entry = entries.get(update?.csa_id);
    const execution = executionMetadataForRule(entry ?? {});
    if (execution?.kind !== 'clothing_state' || update?.status !== 'active') return true;
    const actual = nextSave?.npc_scene_state?.[update.character_id]?.clothing ?? {};
    const verdict = compareRequiredClothing(actual, execution.required_state ?? {});
    if (verdict === 'compliant') return true;
    warnings.push(`csa_clothing_not_satisfied:${update.csa_id}:${update.character_id}`);
    return false;
  });
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

  // Fresh app transactions are applied before Story by the transactional
  // authority boundary. Commit may only verify parity; it is not a second
  // definition writer.
  if (structuredAction && transactionResolution) {
    const alreadyApplied = JSON.stringify({ csa_active: current.csa_active, csa_rules: current.csa_rules })
      === JSON.stringify({ csa_active: transactionResolution.next_csa_active, csa_rules: transactionResolution.next_csa_rules });
    if (alreadyApplied) {
      assertRuleDefinitionAuthority({ currentSave: current, nextSave: current, transactionResolution, structuredAction, stage: 'commit-csa-preapplied' });
    } else {
      // LEGACY structured-action compatibility: callers that have not crossed
      // the pre-apply boundary yet still receive the deterministic reducer
      // result; the fresh API route always takes the branch above.
      applyAuthorizedRuleDefinitions({ currentSave: current, nextSave, transactionResolution, structuredAction, stage: 'commit-csa-legacy' });
    }
  }

  const activeCsa = getApplicableCsaEntries(nextSave);
  const runtimeUpdates = canonicalRuntimeUpdates({ updates: observation?.csa_runtime_updates, activeCsa, nextSave, warnings });
  const runtimeResult = buildCsaRuntimeStatePatch({
    previousSave: current,
    csaRuntimeUpdates: runtimeUpdates,
    csaTriggerEvaluations: observation?.csa_trigger_evaluations,
    activeCsa,
    npcsPresent: canonicalScene?.present_npc_ids ?? [],
    turnNumber: expectedTurn
  });
  if (runtimeResult.patch) nextSave.csa_runtime_state = clone(runtimeResult.patch);
  warnings.push(...(runtimeResult.warnings ?? []));

  const beforeActive = transactionResolution && Array.isArray(transactionResolution.previous_csa_active)
    ? new Set(transactionResolution.previous_csa_active)
    : activeIds(current);
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
