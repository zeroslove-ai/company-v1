import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runStaticPreflight, evaluatePreflight, sha256 } from '../scripts/runtime-reset-operational-preflight.mjs';

const migrationPath = 'supabase/migrations/20260810000100_company_v1_canonical_opening_bootstrap.sql';
const historicalPath = 'supabase/migrations/20260809000100_company_v1_initial_clothing_v2.sql';
const verificationPath = 'supabase/verification/20260810000100_company_v1_canonical_opening_bootstrap.verify.sql';

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

test('required migration and verification files have deterministic approved SHA-256 values', async () => {
  const result = await runStaticPreflight();
  assert.equal(Object.keys(result.hashes).length, 3);
  for (const [file, expected] of Object.entries(result.hashes)) {
    assert.equal(typeof expected, 'string');
    assert.equal(expected, sha256(await readFile(file, 'utf8')));
  }
  assert.equal(result.hashes[historicalPath], '7bb0b023993181c63c36bb94aad5343d94ece08d83277d1ae898bb5f4dc411d6');
});

test('Phase 6 migration order is helper, scene, wrappers, backfill, permissions', async () => {
  const result = await runStaticPreflight();
  assert.equal(result.migrationStructure.ordered, true);
  assert.equal(result.migrationStructure.scoped_turn0_backfill, true);
  assert.equal(result.migrationStructure.no_dangerous_updates, true);
  assert.equal(result.migrationStructure.no_direct_internal_grants, true);
  assert.equal(result.migrationStructure.no_broad_wrapper_grants, true);
});

test('historical migration drift fails closed without changing files', async () => {
  const files = {
    [historicalPath]: await readFile(historicalPath, 'utf8'),
    [migrationPath]: await readFile(migrationPath, 'utf8'),
    [verificationPath]: await readFile(verificationPath, 'utf8')
  };
  const result = evaluatePreflight({ ...files, [historicalPath]: `${files[historicalPath]}\n-- drift` });
  assert.equal(result.pass, false);
  assert.ok(result.failures.includes(`sha256_mismatch:${historicalPath}`));
});

test('dangerous broad backfill and permission drift fail closed', async () => {
  const files = {
    [historicalPath]: await readFile(historicalPath, 'utf8'),
    [migrationPath]: await readFile(migrationPath, 'utf8'),
    [verificationPath]: await readFile(verificationPath, 'utf8')
  };
  const dangerous = `${files[migrationPath]}\nupdate public.game_master set data = data;\ngrant execute on function public.company_apply_initial_clothing_v2(jsonb) to public;`;
  const result = evaluatePreflight({ ...files, [migrationPath]: dangerous });
  assert.equal(result.pass, false);
  assert.ok(result.failures.includes('sha256_mismatch:' + migrationPath));
  assert.ok(result.failures.includes('migration_structure_or_scope_failed'));
});

test('additional unscoped game_save backfill fails closed', async () => {
  const files = {
    [historicalPath]: await readFile(historicalPath, 'utf8'),
    [migrationPath]: await readFile(migrationPath, 'utf8'),
    [verificationPath]: await readFile(verificationPath, 'utf8')
  };
  const insertAt = files[migrationPath].indexOf('revoke all on function');
  const broadened = `${files[migrationPath].slice(0, insertAt)}-- additional fixture statement\nupdate public.game_save\nset updated_at = now();\n\n${files[migrationPath].slice(insertAt)}`;
  const result = evaluatePreflight({ ...files, [migrationPath]: broadened });
  assert.equal(result.migrationStructure.game_save_update_count, 2);
  assert.equal(result.migrationStructure.scoped_turn0_backfill, false);
  assert.ok(result.failures.includes('migration_structure_or_scope_failed'));
  assert.ok(!result.failures.some(failure => failure.includes('game_master')));
});

test('operational preflight source allows only local filesystem and crypto dependencies', async () => {
  const source = await readFile('scripts/runtime-reset-operational-preflight.mjs', 'utf8');
  const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match => match[1]);
  assert.deepEqual(imports.sort(), ['node:crypto', 'node:fs/promises', 'node:path', 'node:url'].sort());
  for (const forbidden of ['node:http', 'node:https', 'node:http2', 'node:net', 'node:tls', 'node:dns', 'node:child_process', 'process.env', 'fetch(', 'postgres', 'wrangler']) {
    assert.equal(source.includes(forbidden), false, `forbidden preflight dependency surface: ${forbidden}`);
  }
  assert.equal(source.includes('../src/'), false);
  assert.equal(source.includes('src/api'), false);
  assert.equal(source.includes('src/engine'), false);
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

test('preflight does not mutate the three inspected SQL files', async () => {
  const before = await Promise.all([historicalPath, migrationPath, verificationPath].map(file => readFile(file, 'utf8')));
  await runStaticPreflight();
  const after = await Promise.all([historicalPath, migrationPath, verificationPath].map(file => readFile(file, 'utf8')));
  assert.deepEqual(after, before);
});

test('operational approval remains explicit for backup and first-game checks', async () => {
  const result = await runStaticPreflight();
  const names = result.requiredExternalChecks.map(check => check.name);
  assert.deepEqual(names, [
    'target_supabase_project', 'migration_history', 'backup_snapshot', 'backup_restore_verified',
    'no_inflight_turns', 'service_role_operator', 'rollback_owner', 'dedicated_test_game'
  ]);
});
