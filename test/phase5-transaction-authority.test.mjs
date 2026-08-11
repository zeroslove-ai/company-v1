import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCsaPlannerInputSnapshot,
  buildCsaPlannerInputDigest,
  buildTransactionResolution,
  verifySignedTransactionResolution,
  stableStringify,
  sha256Base64url,
  signTransactionValidationProof
} from '../src/engine/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const secret = 'phase5-test-secret';
const gameId = 'phase5-game';

function save(overrides = {}) {
  return {
    turn_state: { committed_turn: 4 },
    player_progress: { level: 3, exp: 12 },
    world_state: { game_time: { day: 2, minute_of_day: 615 } },
    csa_active: ['csa_4'],
    csa_rules: { csa_4: { active: true, content: 'rule' } },
    ...overrides
  };
}

async function signedAction(currentSave = save()) {
  const resolution = await buildTransactionResolution({
    plan: { next_csa_active: ['csa_4', 'csa_5'], next_csa_rules: { csa_4: { active: true }, csa_5: { active: true } }, summary: { total: 1, csa_activate: 1, csa_update: 0, csa_deactivate: 0 } },
    save: currentSave,
    baseTurnCount: 4
  });
  const base = { version: 1, type: 'app_transaction', base_turn_count: 4, operations: [{ client_id: 'op-1', domain: 'csa', operation: 'activate', id: 'csa_5' }] };
  const actionDigest = await sha256Base64url(stableStringify(base));
  const semanticResults = [];
  const semantic_validation = { version: 2, game_id: gameId, base_turn_count: 4, action_digest: actionDigest, planner_input_digest: resolution.planner_input_digest, resolution_digest: resolution.resolution_digest, results: semanticResults };
  const validation_proof = await signTransactionValidationProof(secret, { game_id: gameId, base_turn_count: 4, action_digest: actionDigest, resolution_digest: resolution.resolution_digest, semantic_results: semanticResults });
  return { ...base, transaction_resolution: resolution, semantic_validation, validation_proof };
}

test('transaction resolution binds one planner snapshot and exposes only deterministic rule state', async () => {
  const current = save();
  const resolution = await buildTransactionResolution({ plan: { next_csa_active: ['csa_4'], next_csa_rules: {}, summary: { total: 0 } }, save: current, baseTurnCount: 4 });
  assert.deepEqual(buildCsaPlannerInputSnapshot(current), {
    committed_turn: 4,
    player_progress: { level: 3, exp: 12 },
    world_time: { day: 2, minute_of_day: 615 },
    csa_active: ['csa_4'],
    csa_rules: { csa_4: { active: true, content: 'rule' } }
  });
  assert.equal(typeof resolution.planner_input_digest, 'string');
  assert.equal(typeof resolution.resolution_digest, 'string');
  assert.equal('display_input' in resolution, false);
  assert.equal('story_text' in resolution, false);
});

test('signed transaction resolution rejects rule, digest, and base-state tampering', async () => {
  const current = save();
  const action = await signedAction(current);
  assert.equal((await verifySignedTransactionResolution({ secret, gameId, structuredAction: action, save: current, expectedTurn: 5 })).ok, true);

  const ruleTampered = structuredClone(action);
  ruleTampered.transaction_resolution.next_csa_rules.csa_5.active = false;
  assert.equal((await verifySignedTransactionResolution({ secret, gameId, structuredAction: ruleTampered, save: current, expectedTurn: 5 })).ok, false);

  const digestTampered = structuredClone(action);
  digestTampered.transaction_resolution.planner_input_digest = 'tampered';
  assert.equal((await verifySignedTransactionResolution({ secret, gameId, structuredAction: digestTampered, save: current, expectedTurn: 5 })).ok, false);

  const stale = save({ player_progress: { level: 4, exp: 0 } });
  const staleResult = await verifySignedTransactionResolution({ secret, gameId, structuredAction: action, save: stale, expectedTurn: 5 });
  assert.equal(staleResult.code, 'app_stale_state');
});

test('runtime wrapper has no completion interception or planner state machine', () => {
  const source = fs.readFileSync(path.join(root, 'src/api/turn-routes-runtime.js'), 'utf8');
  for (const forbidden of ['planState(', 'computePlan(', 'patchCompletionBody', 'POST-TRANSACTION ACTIVE CSA SET', 'planCsaTransaction(']) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
