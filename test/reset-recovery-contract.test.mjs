import test from 'node:test';
import assert from 'node:assert/strict';
import { runStaticPreflight } from '../scripts/runtime-reset-operational-preflight.mjs';

test('operational preflight is repository-local and passes without network or credentials', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = () => {
    fetchCalled = true;
    throw new Error('network is forbidden in static preflight');
  };
  try {
    const result = await runStaticPreflight();
    assert.equal(result.pass, true);
    assert.equal(fetchCalled, false);
    assert.equal(result.requiredExternalChecks.every(check => check.status === 'NOT_CHECKED_REQUIRES_OPERATIONAL_APPROVAL'), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('preflight reports a hash for each immutable artifact', async () => {
  const result = await runStaticPreflight();
  assert.deepEqual(Object.keys(result.hashes).sort(), [
    'supabase/migrations/20260809000100_company_v1_initial_clothing_v2.sql',
    'supabase/migrations/20260810000100_company_v1_canonical_opening_bootstrap.sql',
    'supabase/verification/20260810000100_company_v1_canonical_opening_bootstrap.verify.sql'
  ]);
  for (const value of Object.values(result.hashes)) assert.match(value, /^[0-9a-f]{64}$/);
});

test('Phase 6 migration order is helper, scene, wrappers, backfill, permissions', async () => {
  const result = await runStaticPreflight();
  assert.equal(result.migrationStructure.ordered, true);
  assert.equal(result.migrationStructure.scoped_turn0_backfill, true);
  assert.equal(result.migrationStructure.no_dangerous_updates, true);
  assert.equal(result.migrationStructure.no_direct_internal_grants, true);
  assert.equal(result.migrationStructure.no_broad_wrapper_grants, true);
});





test('verification contract covers canonical scene, clothing, wrappers, and permission checks', async () => {
  const result = await runStaticPreflight();
  assert.equal(result.verification.pass, true);
  assert.deepEqual(result.verification.required, [
    'company_apply_opening_scene_v1', 'reserve_company_player_setup', 'commit_company_opening',
    'version', 'beat', 'location_id', 'scene_goal', 'work_hook_id', 'last_npcs_present',
    'uniform_top', 'underwear_top', 'service_role'
  ]);
});


test('operational approval remains explicit for backup and first-game checks', async () => {
  const result = await runStaticPreflight();
  const names = result.requiredExternalChecks.map(check => check.name);
  assert.deepEqual(names, [
    'target_supabase_project', 'migration_history', 'backup_snapshot', 'backup_restore_verified',
    'no_inflight_turns', 'service_role_operator', 'rollback_owner', 'dedicated_test_game'
  ]);
});
