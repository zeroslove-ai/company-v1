import {
  sha256Base64url,
  stableStringify,
  signAppValidationProof,
  verifyAppValidationProof
} from './transaction-validator.js';

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

/** The one deterministic snapshot used to bind a CSA plan to the save it read. */
export function buildCsaPlannerInputSnapshot(save = {}) {
  return {
    committed_turn: save?.turn_state?.committed_turn ?? 0,
    player_progress: clone(save?.player_progress ?? null),
    world_time: clone(save?.world_state?.game_time ?? null),
    csa_active: clone(Array.isArray(save?.csa_active) ? save.csa_active : []),
    csa_rules: clone(save?.csa_rules && typeof save.csa_rules === 'object' ? save.csa_rules : {})
  };
}

export async function buildCsaPlannerInputDigest(save) {
  return sha256Base64url(stableStringify(buildCsaPlannerInputSnapshot(save)));
}

function resolutionBody(resolution) {
  const { resolution_digest: _ignored, ...body } = resolution ?? {};
  return body;
}

export async function buildTransactionResolutionDigest(resolution) {
  return sha256Base64url(stableStringify(resolutionBody(resolution)));
}

export async function buildTransactionResolution({ plan, save, baseTurnCount }) {
  const resolution = {
    version: 1,
    base_turn_count: baseTurnCount,
    planner_input_digest: await buildCsaPlannerInputDigest(save),
    previous_csa_active: clone(Array.isArray(save?.csa_active) ? save.csa_active : []),
    previous_csa_rules: clone(save?.csa_rules && typeof save.csa_rules === 'object' ? save.csa_rules : {}),
    next_csa_active: clone(plan.next_csa_active),
    next_csa_rules: clone(plan.next_csa_rules),
    summary: clone(plan.summary ?? {})
  };
  return { ...resolution, resolution_digest: await buildTransactionResolutionDigest(resolution) };
}

export async function signTransactionValidationProof(secret, payload) {
  return signAppValidationProof(secret, payload, 2);
}

export async function verifyTransactionValidationProof(secret, payload, signature) {
  return verifyAppValidationProof(secret, payload, signature, 2);
}

export async function verifySignedTransactionResolution({ secret, gameId, structuredAction, save, expectedTurn }) {
  const resolution = structuredAction?.transaction_resolution;
  const semantic = structuredAction?.semantic_validation;
  if (!resolution || resolution.version !== 1 || semantic?.version !== 2) return { ok: false, reason: 'missing transaction resolution' };
  if (resolution.base_turn_count !== structuredAction.base_turn_count || resolution.base_turn_count !== expectedTurn - 1) {
    return { ok: false, reason: 'base turn mismatch', code: 'app_stale_state' };
  }
  const resolutionDigest = await buildTransactionResolutionDigest(resolution);
  if (resolution.resolution_digest !== resolutionDigest || semantic.resolution_digest !== resolutionDigest) {
    return { ok: false, reason: 'resolution digest mismatch' };
  }
  const actionDigest = await sha256Base64url(stableStringify({
    version: structuredAction.version,
    type: structuredAction.type,
    base_turn_count: structuredAction.base_turn_count,
    operations: structuredAction.operations
  }));
  if (semantic.action_digest !== actionDigest || semantic.game_id !== gameId || semantic.base_turn_count !== structuredAction.base_turn_count) {
    return { ok: false, reason: 'action digest mismatch' };
  }
  const semanticResults = Array.isArray(semantic.results) ? semantic.results : [];
  const proofPayload = { game_id: gameId, base_turn_count: structuredAction.base_turn_count, action_digest: actionDigest, resolution_digest: resolutionDigest, semantic_results: semanticResults };
  if (!(await verifyTransactionValidationProof(secret, proofPayload, structuredAction.validation_proof))) {
    return { ok: false, reason: 'signature mismatch' };
  }
  const plannerInputDigest = await buildCsaPlannerInputDigest(save);
  if (resolution.planner_input_digest !== plannerInputDigest || semantic.planner_input_digest !== plannerInputDigest) {
    return { ok: false, state: 'stale_or_invalid', reason: 'planner input digest mismatch', code: 'app_stale_state' };
  }
  return { ok: true, state: 'verified', resolution };
}
