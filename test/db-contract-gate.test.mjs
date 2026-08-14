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

function sceneCatalog(probes) {
  return {
    migrations: [
      { name: 'company_v1_scene_authority_stage_a' },
      { name: 'company_v1_scene_authority_stage_b' }
    ],
    functions: [
      functionBase('company_validate_scene_v1', 'jsonb, boolean'),
      functionBase('company_bootstrap_scene_v1', 'jsonb'),
      functionBase('validate_company_save_v1', 'jsonb'),
      functionBase('reset_company_game', 'uuid, text')
    ],
    scene_probes: probes
  };
}

test('scene Stage A gate accepts legacy compatibility and canonical probes', () => {
  const result = evaluateSceneCatalog(sceneManifest, sceneCatalog({
    legacy_only_save_accepted: true,
    canonical_scene_save_accepted: true,
    reset_returns_scene_v1: true
  }), 'stage_a');
  assert.equal(result.pass, true);
});

test('scene Stage B gate fails without canonical-required probes', () => {
  const result = evaluateSceneCatalog(sceneManifest, sceneCatalog({
    legacy_only_save_rejected: false,
    canonical_without_legacy_scene_mirrors_accepted: true,
    reset_returns_scene_v1: true
  }), 'stage_b');
  assert.equal(result.pass, false);
  assert.ok(result.failures.some(item => item.includes('legacy_only_save_rejected')));
});
