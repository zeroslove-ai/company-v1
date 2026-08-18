import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateCatalog, evaluateSceneCatalog } from '../scripts/company-db-contract-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'config/company-v1-db-contract.json'), 'utf8'));
const sceneManifest = JSON.parse(fs.readFileSync(path.join(root, 'config/company-v1-scene-db-contract.json'), 'utf8'));
const functionBase = (name, identity_arguments, extra = {}) => ({
  name, identity_arguments, security_definer: true, config: ['search_path=public, pg_temp'], service_role_execute: true, ...extra
});
const sceneFunctionBase = (name, identity_arguments, extra = {}) => ({
  name, identity_arguments, security_definer: true, config: ['search_path=public, pg_temp'], require_safe_search_path: true, service_role_execute: true, ...extra
});

function stageACatalog() {
  return {
    migrations: [{ version: '20260814023308', name: 'company_v1_action_ownership_closure_stage_a' }],
    columns: [{ table: 'game_actions', column: 'stage_owner_token' }, { table: 'game_actions', column: 'stage_claimed_at' }],
    functions: [
      functionBase('claim_game_action_stage', 'p_game_id uuid, p_action_id uuid, p_expected_status text, p_expected_owner_mode text, p_expected_owner_token text, p_next_status text, p_next_owner_token text, p_next_error_code text, p_require_stale boolean'),
      functionBase('fail_game_action_stage', 'p_game_id uuid, p_action_id uuid, p_expected_status text, p_expected_owner_mode text, p_expected_owner_token text, p_next_status text, p_next_error_code text, p_require_owner_fence boolean'),
      functionBase('record_story_result_owned', 'p_game_id uuid, p_action_id uuid, p_story_text text, p_parsed_blocks jsonb, p_owner_token text'),
      functionBase('record_extract_result_owned', 'p_game_id uuid, p_action_id uuid, p_extract_delta jsonb, p_owner_token text')
    ],
    privileges: [
      { table: 'game_actions', role: 'service_role', privilege: 'UPDATE' }
    ]
  };
}

test('DB contract gate fails closed when Stage A catalog is missing', () => {
  const result = evaluateCatalog(manifest, { migrations: [], columns: [], functions: [], privileges: [] }, 'stage_a');
  assert.equal(result.pass, false);
  assert.ok(result.failures.some(item => item.includes('missing migration name')));
});

test('DB contract gate accepts Stage A compatibility leftovers', () => {
  const catalog = stageACatalog();
  catalog.functions.push(
    functionBase('record_story_result', 'uuid, uuid, text, jsonb'),
    functionBase('record_extract_result', 'uuid, uuid, jsonb'),
    functionBase('apply_reserved_csa_transaction', 'uuid, uuid, integer')
  );
  catalog.privileges.push({ table: 'game_actions', role: 'service_role', privilege: 'INSERT' });
  assert.equal(evaluateCatalog(manifest, catalog, 'stage_a').pass, true);
});

test('DB contract gate enforces Stage B direct-DML and legacy-writer removal', () => {
  const catalog = stageACatalog();
  catalog.migrations.push({ version: '20260814030000', name: 'company_v1_authority_enforcement_stage_b' });
  catalog.functions.push(functionBase('record_story_result', 'uuid, uuid, text, jsonb'));
  catalog.privileges.push({ table: 'game_save', role: 'service_role', privilege: 'UPDATE' });
  const result = evaluateCatalog(manifest, catalog, 'stage_b');
  assert.equal(result.pass, false);
  assert.ok(result.failures.some(item => item.includes('forbidden legacy function')));
  assert.ok(result.failures.some(item => item.includes('direct DML')));
});

function sceneCatalog(probes, currentCanon = false) {
  return {
    migrations: [
      { name: 'company_v1_scene_authority_stage_a' },
      { name: 'company_v1_scene_authority_stage_a_acl_closure' },
      { name: 'company_v1_scene_authority_stage_b' }
    ],
    functions: [
      sceneFunctionBase('company_validate_scene_v1', 'jsonb, boolean', currentCanon
        ? { security_definer: false, config: [], require_safe_search_path: false, service_role_execute: false }
        : { security_definer: true, require_safe_search_path: true, service_role_execute: false }),
      sceneFunctionBase('company_bootstrap_scene_v1', 'jsonb', { service_role_execute: false }),
      sceneFunctionBase('validate_company_save_v1', 'jsonb'),
      sceneFunctionBase('reset_company_game', 'uuid, text')
    ],
    scene_probes: probes
  };
}

test('scene Stage A gate accepts legacy compatibility and canonical probes', () => {
  const result = evaluateSceneCatalog(sceneManifest, sceneCatalog({
    legacy_only_save_accepted: true,
    canonical_scene_save_accepted: true,
    canonical_missing_nullable_key_rejected: true,
    reset_returns_scene_v1: true
  }), 'stage_a');
  assert.equal(result.pass, true);
});

test('scene Stage B gate fails without canonical-required probes', () => {
  const result = evaluateSceneCatalog(sceneManifest, sceneCatalog({
    canonical_narrow_scene_accepted: true,
    canonical_scene_missing_required_key_rejected: true,
    canonical_save_without_legacy_scene_mirrors_accepted: true,
    legacy_only_save_rejected: false
  }, true), 'stage_b');
  assert.equal(result.pass, false);
  assert.ok(result.failures.some(item => item.includes('legacy_only_save_rejected')));
});

test('scene Stage A gate requires the ACL closure migration', () => {
  const catalog = sceneCatalog({
    legacy_only_save_accepted: true,
    canonical_scene_save_accepted: true,
    canonical_missing_nullable_key_rejected: true,
    reset_returns_scene_v1: true
  });
  catalog.migrations = catalog.migrations.filter(item => item.name !== 'company_v1_scene_authority_stage_a_acl_closure');
  const result = evaluateSceneCatalog(sceneManifest, catalog, 'stage_a');
  assert.equal(result.pass, false);
  assert.ok(result.failures.some(item => item.includes('company_v1_scene_authority_stage_a_acl_closure')));
});

test('scene Stage B gate is cumulative and rejects a Stage B-only catalog', () => {
  const catalog = sceneCatalog({
    canonical_narrow_scene_accepted: true,
    canonical_scene_missing_required_key_rejected: true,
    canonical_save_without_legacy_scene_mirrors_accepted: true,
    legacy_only_save_rejected: true
  }, true);
  catalog.migrations = [{ name: 'company_v1_scene_authority_stage_b' }];
  const result = evaluateSceneCatalog(sceneManifest, catalog, 'stage_b');
  assert.equal(result.pass, false);
  assert.ok(result.failures.some(item => item.includes('company_v1_scene_authority_stage_a')));
  assert.ok(result.failures.some(item => item.includes('company_v1_scene_authority_stage_a_acl_closure')));
});

test('scene Stage B gate accepts the cumulative Stage A, ACL closure, and Stage B catalog', () => {
  const result = evaluateSceneCatalog(sceneManifest, sceneCatalog({
    canonical_narrow_scene_accepted: true,
    canonical_scene_missing_required_key_rejected: true,
    canonical_save_without_legacy_scene_mirrors_accepted: true,
    legacy_only_save_rejected: true
  }, true), 'stage_b');
  assert.equal(result.pass, true);
});

test('scene gate fails closed when behavioral-probe catalog is absent', () => {
  const catalog = sceneCatalog({});
  delete catalog.scene_probes;
  const result = evaluateSceneCatalog(sceneManifest, catalog, 'stage_a');
  assert.equal(result.pass, false);
  assert.ok(result.failures.includes('missing scene behavioral-probe catalog'));
});

test('scene gate rejects an unnecessary service_role grant to an internal helper', () => {
  const catalog = sceneCatalog({
    legacy_only_save_accepted: true,
    canonical_scene_save_accepted: true,
    canonical_missing_nullable_key_rejected: true,
    reset_returns_scene_v1: true
  });
  catalog.functions.find(item => item.name === 'company_validate_scene_v1').service_role_execute = true;
  const result = evaluateSceneCatalog(sceneManifest, catalog, 'stage_a');
  assert.equal(result.pass, false);
  assert.ok(result.failures.some(item => item.includes('scene service_role EXECUTE mismatch')));
});

test('scene gate follows the manifest security mode and search_path contract', () => {
  const probes = {
    canonical_narrow_scene_accepted: true,
    canonical_scene_missing_required_key_rejected: true,
    canonical_save_without_legacy_scene_mirrors_accepted: true,
    legacy_only_save_rejected: true
  };
  const invokerCatalog = sceneCatalog(probes, true);
  assert.equal(evaluateSceneCatalog(sceneManifest, invokerCatalog, 'stage_b').pass, true);

  const unexpectedDefiner = sceneCatalog(probes, true);
  unexpectedDefiner.functions.find(item => item.name === 'company_validate_scene_v1').security_definer = true;
  unexpectedDefiner.functions.find(item => item.name === 'company_validate_scene_v1').require_safe_search_path = false;
  assert.ok(evaluateSceneCatalog(sceneManifest, unexpectedDefiner, 'stage_b').failures.some(item => item.includes('security_definer mismatch')));

  const missingDefiner = sceneCatalog(probes, true);
  missingDefiner.functions.find(item => item.name === 'company_bootstrap_scene_v1').security_definer = false;
  assert.ok(evaluateSceneCatalog(sceneManifest, missingDefiner, 'stage_b').failures.some(item => item.includes('security_definer mismatch')));

  const missingSearchPath = sceneCatalog(probes, true);
  missingSearchPath.functions.find(item => item.name === 'company_bootstrap_scene_v1').config = [];
  assert.ok(evaluateSceneCatalog(sceneManifest, missingSearchPath, 'stage_b').failures.some(item => item.includes('unsafe scene search_path')));
});

test('scene gate enforces service_role ACL in both directions', () => {
  const probes = {
    canonical_narrow_scene_accepted: true,
    canonical_scene_missing_required_key_rejected: true,
    canonical_save_without_legacy_scene_mirrors_accepted: true,
    legacy_only_save_rejected: true
  };
  const unexpectedGrant = sceneCatalog(probes, true);
  unexpectedGrant.functions.find(item => item.name === 'company_validate_scene_v1').security_definer = false;
  unexpectedGrant.functions.find(item => item.name === 'company_validate_scene_v1').require_safe_search_path = false;
  unexpectedGrant.functions.find(item => item.name === 'company_validate_scene_v1').service_role_execute = true;
  assert.ok(evaluateSceneCatalog(sceneManifest, unexpectedGrant, 'stage_b').failures.some(item => item.includes('service_role EXECUTE mismatch')));

  const missingGrant = sceneCatalog(probes, true);
  missingGrant.functions.find(item => item.name === 'validate_company_save_v1').service_role_execute = false;
  assert.ok(evaluateSceneCatalog(sceneManifest, missingGrant, 'stage_b').failures.some(item => item.includes('service_role EXECUTE mismatch')));
});

test('scene Stage B requires each real current-canon probe independently', () => {
  const probeNames = [
    'canonical_narrow_scene_accepted',
    'canonical_scene_missing_required_key_rejected',
    'canonical_save_without_legacy_scene_mirrors_accepted',
    'legacy_only_save_rejected'
  ];
  for (const probeName of probeNames) {
    const probes = Object.fromEntries(probeNames.map(name => [name, true]));
    probes[probeName] = false;
    const result = evaluateSceneCatalog(sceneManifest, sceneCatalog(probes, true), 'stage_b');
    assert.equal(result.pass, false, probeName);
    assert.ok(result.failures.some(item => item.includes(`scene probe failed: ${probeName}`)), probeName);
  }
});

test('live scene probes are read-only and are not fabricated constants', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/company-db-contract-gate.mjs'), 'utf8');
  assert.match(source, /canonical_narrow_scene_accepted/);
  assert.match(source, /company_validate_scene_v1\(jsonb_build_object\('scene', canonical_scene\), true\)/);
  assert.match(source, /validate_company_save_v1\(canonical_save\)/);
  assert.doesNotMatch(source, /'scene_probes', '\{\}'::jsonb/);
  assert.doesNotMatch(source, /reset_company_game\([^)]*scene_probe/);
  assert.doesNotMatch(source, /scene_probe_values[\s\S]*(?:insert|update|delete)\s+public\./i);
});

test('scene gate requires the missing-nullable-key rejection probe', () => {
  const result = evaluateSceneCatalog(sceneManifest, sceneCatalog({
    legacy_only_save_accepted: true,
    canonical_scene_save_accepted: true,
    canonical_missing_nullable_key_rejected: false,
    reset_returns_scene_v1: true
  }), 'stage_a');
  assert.equal(result.pass, false);
  assert.ok(result.failures.some(item => item.includes('canonical_missing_nullable_key_rejected')));
});
