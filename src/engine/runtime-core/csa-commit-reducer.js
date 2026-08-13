import { getApplicableCsaEntries } from '../csa/applicability.js';
import { buildCsaRuntimeStatePatch, buildCsaAftereffectPatch } from '../csa/reducer.js';
import { applyAuthorizedRuleDefinitions, assertRuleDefinitionAuthority } from './action-authority.js';
import { calculateCsaProgression, calculateProgress } from '../progression.js';
import { compareRequiredClothing } from '../state/clothing.js';
import { executionMetadataForRule, RELATION_KINDS } from '../csa/execution-policy.js';
import { clearRelationPresentationsForActors } from './relation-presentation.js';

function clone(value) { return value === undefined ? undefined : structuredClone(value); }

function isFeedback(action) {
  return action?.action_kind === 'feedback_revision';
}

function activeIds(save) {
  return new Set(Array.isArray(save?.csa_active) ? save.csa_active : []);
}

function engineRuntimeUpdates(engineEnactments) {
  return (Array.isArray(engineEnactments) ? engineEnactments : [])
    .filter(item => item?.authority === 'engine' && item?.source_rule_id && item?.actor_id)
    .map(item => ({ csa_id: item.source_rule_id, character_id: item.actor_id, status: 'active' }));
}

function applyEngineClothingEnactments(nextSave, engineEnactments) {
  for (const enactment of Array.isArray(engineEnactments) ? engineEnactments : []) {
    if (enactment?.authority !== 'engine' || enactment.execution_kind !== 'clothing_state') continue;
    const actorId = enactment.actor_id;
    if (!actorId || actorId === 'player') continue;
    const current = nextSave.npc_scene_state?.[actorId] ?? {};
    const clothing = current.clothing && typeof current.clothing === 'object' && !Array.isArray(current.clothing) ? current.clothing : {};
    const required = enactment.required_state && typeof enactment.required_state === 'object' && !Array.isArray(enactment.required_state) ? enactment.required_state : {};
    if (!Object.keys(required).length) continue;
    nextSave.npc_scene_state = { ...(nextSave.npc_scene_state ?? {}), [actorId]: { ...current, clothing: { ...clothing, ...required } } };
  }
}

function applyEngineRelationEnactments(nextSave, engineEnactments, expectedTurn, warnings) {
  const relations = Array.isArray(nextSave.active_relations) ? nextSave.active_relations.map(item => ({ ...item })) : [];
  const turn = Number.isInteger(expectedTurn) ? expectedTurn : 0;
  const authoritativeRelationActors = new Map();
  for (const enactment of Array.isArray(engineEnactments) ? engineEnactments : []) {
    if (enactment?.authority !== 'engine' || enactment.execution_kind !== 'behavior_execution' || !RELATION_KINDS.has(enactment.action)) continue;
    const targets = [...new Set(Array.isArray(enactment.target_ids) ? enactment.target_ids.filter(id => typeof id === 'string' && id.trim()) : [])];
    if (targets.length !== 1) {
      warnings.push(`engine_relation_target_unresolved:${enactment.source_rule_id ?? 'unknown'}:${enactment.actor_id ?? 'unknown'}`);
      continue;
    }
    const actorId = enactment.actor_id;
    const targetId = targets[0];
    if (!actorId || actorId === targetId) {
      warnings.push(`engine_relation_target_invalid:${enactment.source_rule_id ?? 'unknown'}`);
      continue;
    }
    const sourceRuleId = enactment.source_rule_id ?? null;
    if (sourceRuleId) {
      const key = `${sourceRuleId}\u0000${targetId}`;
      const actors = authoritativeRelationActors.get(key) ?? new Set();
      actors.add(actorId);
      authoritativeRelationActors.set(key, actors);
    }
    const existing = relations.find(item => item.state === 'active' && item.actor_id === actorId && item.target_id === targetId && item.relation_kind === enactment.action);
    for (let i = 0; i < relations.length; i += 1) {
      if (relations[i].state === 'active' && relations[i].actor_id === actorId
        && (relations[i].target_id !== targetId || relations[i].relation_kind !== enactment.action)) {
        relations[i] = { ...relations[i], state: 'ended', updated_turn: turn, end_reason: 'superseded_by_engine_relation' };
      }
    }
    const relation = {
      actor_id: actorId,
      target_id: targetId,
      relation_kind: enactment.action,
      source_rule_id: sourceRuleId,
      source: 'engine',
      state: 'active',
      started_turn: existing?.started_turn ?? turn,
      updated_turn: turn
    };
    const index = relations.findIndex(item => item.state === 'active' && item.actor_id === actorId && item.target_id === targetId && item.relation_kind === enactment.action);
    if (index >= 0) relations[index] = relation;
    else relations.push(relation);
  }
  const supersededActors = new Set();
  for (const [key, actors] of authoritativeRelationActors) {
    if (actors.size !== 1) continue;
    const [sourceRuleId, targetId] = key.split('\u0000');
    const authoritativeActorId = [...actors][0];
    for (let i = 0; i < relations.length; i += 1) {
      const relation = relations[i];
      if (relation?.state !== 'active'
        || relation.actor_id === authoritativeActorId
        || relation.source_rule_id !== sourceRuleId
        || relation.target_id !== targetId) continue;
      relations[i] = { ...relation, state: 'ended', updated_turn: turn, end_reason: 'superseded_by_engine_interaction_switch' };
      supersededActors.add(relation.actor_id);
    }
  }
  nextSave.active_relations = relations.slice(-80);
  clearRelationPresentationsForActors(nextSave, [...supersededActors]);
}

function mergeEngineRuntimeUpdates(engineEnactments, observedUpdates) {
  const engineUpdates = engineRuntimeUpdates(engineEnactments);
  const engineKeys = new Set(engineUpdates.map(item => `${item.csa_id}:${item.character_id}`));
  const observed = (Array.isArray(observedUpdates) ? observedUpdates : []).filter(item => !engineKeys.has(`${item?.csa_id}:${item?.character_id}`));
  return [...engineUpdates, ...observed];
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
  transactionResolution = null,
  engineEnactments = []
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

  // Server-generated engine evidence is the only source allowed to make a
  // mandatory enactment authoritative. It is applied before Extract updates
  // so clothing validation sees the deterministic required result.
  applyEngineClothingEnactments(nextSave, engineEnactments);
  applyEngineRelationEnactments(nextSave, engineEnactments, expectedTurn, warnings);

  // Commit is the sole durable writer for signed CSA definitions. Story and
  // Extract may receive an in-memory projection, but they never mutate save.
  if (structuredAction && transactionResolution) {
    applyAuthorizedRuleDefinitions({ currentSave: current, nextSave, transactionResolution, structuredAction, stage: 'commit-csa' });
  }

  const activeCsa = getApplicableCsaEntries(nextSave);
  // Fresh Extract is observational only. Runtime CSA state is sourced from
  // signed definitions and Engine enactments; compatibility fields returned
  // by an LLM are deliberately ignored.
  const runtimeUpdates = canonicalRuntimeUpdates({ updates: mergeEngineRuntimeUpdates(engineEnactments, []), activeCsa, nextSave, warnings });
  const runtimeResult = buildCsaRuntimeStatePatch({
    previousSave: current,
    csaRuntimeUpdates: runtimeUpdates,
    csaTriggerEvaluations: [],
    activeCsa,
    npcsPresent: [...new Set([
      ...(canonicalScene?.present_npc_ids ?? []),
      ...(Array.isArray(engineEnactments) ? engineEnactments.map(item => item?.actor_id).filter(Boolean) : [])
    ])],
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
