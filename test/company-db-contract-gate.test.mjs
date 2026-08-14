import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateCatalog } from '../scripts/company-db-contract-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'config/company-v1-db-contract.json'), 'utf8'));
const functionBase = (name, identity_arguments, extra = {}) => ({
  name, identity_arguments, security_definer: true, config: ['search_path=public, pg_temp'], service_role_execute: true, ...extra
});

function stageACatalog() {
  return {
    migration_markers: ['20260814000300_company_v1_action_ownership_closure_stage_a'],
    columns: [{ table: 'game_actions', column: 'stage_owner_token' }, { table: 'game_actions', column: 'stage_claimed_at' }],
    functions: [
      functionBase('claim_game_action_stage', 'uuid, uuid, text, text, text, text, text, text, boolean'),
      functionBase('fail_game_action_stage', 'uuid, uuid, text, text, text, text, text, boolean'),
      functionBase('record_story_result_owned', 'uuid, uuid, text, jsonb, text'),
      functionBase('record_extract_result_owned', 'uuid, uuid, jsonb, text')
    ],
    privileges: [
      { table: 'game_actions', role: 'service_role', privilege: 'UPDATE' }
    ]
  };
}

test('DB contract gate fails closed when Stage A catalog is missing', () => {
  const result = evaluateCatalog(manifest, { migration_markers: [], columns: [], functions: [], privileges: [] }, 'stage_a');
  assert.equal(result.pass, false);
  assert.ok(result.failures.some(item => item.includes('missing migration marker')));
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
  catalog.functions.push(functionBase('record_story_result', 'uuid, uuid, text, jsonb'));
  catalog.privileges.push({ table: 'game_save', role: 'service_role', privilege: 'UPDATE' });
  const result = evaluateCatalog(manifest, catalog, 'stage_b');
  assert.equal(result.pass, false);
  assert.ok(result.failures.some(item => item.includes('forbidden legacy function')));
  assert.ok(result.failures.some(item => item.includes('direct DML')));
});
