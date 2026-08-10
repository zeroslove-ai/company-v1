import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_FILES = [
  'supabase/migrations/20260809000100_company_v1_initial_clothing_v2.sql',
  'supabase/migrations/20260810000100_company_v1_canonical_opening_bootstrap.sql',
  'supabase/verification/20260810000100_company_v1_canonical_opening_bootstrap.verify.sql'
];

// This is the immutable historical migration baseline on the Phase 6 tree.
const APPROVED_SHA256 = {
  'supabase/migrations/20260809000100_company_v1_initial_clothing_v2.sql': '7bb0b023993181c63c36bb94aad5343d94ece08d83277d1ae898bb5f4dc411d6',
  'supabase/migrations/20260810000100_company_v1_canonical_opening_bootstrap.sql': 'cdcb7d2810b649eac4322d20df7b167e60c55aa2b56bd30022a53d3976ef8c89',
  'supabase/verification/20260810000100_company_v1_canonical_opening_bootstrap.verify.sql': 'cf0c9a75ec300b9c7a629cfcf694b5fabeef9d598f589b8c3d72c95798463b90'
};

const EXTERNAL_CHECKS = [
  'target_supabase_project',
  'migration_history',
  'backup_snapshot',
  'backup_restore_verified',
  'no_inflight_turns',
  'service_role_operator',
  'rollback_owner',
  'dedicated_test_game'
];

export function sha256(value) {
  // Git checkouts may use CRLF on Windows; hash canonical LF bytes so the
  // immutable migration check is identical in local and CI environments.
  return createHash('sha256').update(value.replace(/\r\n/g, '\n')).digest('hex');
}

function includesAll(text, needles) {
  return needles.every((needle) => text.includes(needle));
}

function checkMigrationStructure(migration) {
  const markers = [
    'create or replace function public.company_apply_initial_clothing_v2',
    'create or replace function public.company_apply_opening_scene_v1',
    'create or replace function public.reserve_company_player_setup(',
    'create or replace function public.commit_company_opening(',
    '-- Turn-0-only package backfill',
    'revoke all on function'
  ];
  const positions = markers.map((marker) => migration.indexOf(marker));
  const ordered = positions.every((position) => position >= 0)
    && positions.every((position, index) => index === 0 || position > positions[index - 1]);

  const dangerousUpdates = [
    /update\s+public\.game_master\b/i,
    /update\s+public\.game_actions\b/i,
    /update\s+public\.game_turns\b/i
  ];
  const hasDangerousUpdate = dangerousUpdates.some((pattern) => pattern.test(migration));
  const backfillStart = migration.indexOf('-- Turn-0-only package backfill');
  const permissionStart = migration.indexOf('revoke all on function');
  const backfillBlock = backfillStart >= 0 && permissionStart > backfillStart
    ? migration.slice(backfillStart, permissionStart)
    : '';
  const gameSaveUpdates = backfillBlock.match(/update\s+public\.game_save\b[\s\S]*?;/gi) ?? [];
  const scopedBackfill = gameSaveUpdates.length === 1 && /from\s+public\.games\s+g[\s\S]*?g\.id\s*=\s*s\.game_id[\s\S]*?g\.edition_id\s*=\s*'company-v1'[\s\S]*?coalesce\(s\.committed_turn,\s*0\)\s*=\s*0[\s\S]*?jsonb_typeof\(s\.data\s*->\s*'opening_state'\s*->\s*'plan'\)\s*=\s*'object'/i.test(gameSaveUpdates[0] ?? '');
  const broadGameSaveUpdate = gameSaveUpdates.length !== 1;
  const grants = migration.split(/\r?\n/).filter((line) => /^\s*grant\s+execute\s+on\s+function/i.test(line));
  const directInternalGrant = grants.some((line) => /(company_initial_clothing_v2|company_apply_initial_clothing_v2|company_apply_opening_scene_v1)/i.test(line));
  const broadWrapperGrant = grants.some((line) => /(reserve_company_player_setup|commit_company_opening)/i.test(line) && !/\bto\s+service_role\s*;/i.test(line));

  return {
    ordered,
    positions,
    no_dangerous_updates: !hasDangerousUpdate,
    scoped_turn0_backfill: scopedBackfill && !broadGameSaveUpdate,
    game_save_update_count: gameSaveUpdates.length,
    no_direct_internal_grants: !directInternalGrant,
    no_broad_wrapper_grants: !broadWrapperGrant,
    pass: ordered && !hasDangerousUpdate && scopedBackfill && !broadGameSaveUpdate && !directInternalGrant && !broadWrapperGrant
  };
}

function checkVerification(verification) {
  const required = [
    'company_apply_opening_scene_v1',
    'reserve_company_player_setup',
    'commit_company_opening',
    'version',
    'beat',
    'location_id',
    'scene_goal',
    'work_hook_id',
    'last_npcs_present',
    'uniform_top',
    'underwear_top',
    'service_role'
  ];
  return { pass: includesAll(verification, required), required };
}

export function evaluatePreflight(files) {
  const failures = [];
  const hashes = {};
  for (const file of REQUIRED_FILES) {
    if (typeof files[file] !== 'string') {
      failures.push(`missing_required_file:${file}`);
      continue;
    }
    hashes[file] = sha256(files[file]);
    if (hashes[file] !== APPROVED_SHA256[file]) {
      failures.push(`sha256_mismatch:${file}`);
    }
  }

  const migration = files[REQUIRED_FILES[1]] ?? '';
  const verification = files[REQUIRED_FILES[2]] ?? '';
  const structure = checkMigrationStructure(migration);
  if (!structure.pass) failures.push('migration_structure_or_scope_failed');
  const verificationCheck = checkVerification(verification);
  if (!verificationCheck.pass) failures.push('verification_contract_incomplete');

  return {
    pass: failures.length === 0,
    failures,
    hashes,
    migrationStructure: structure,
    verification: verificationCheck,
    requiredExternalChecks: EXTERNAL_CHECKS.map((name) => ({
      name,
      status: 'NOT_CHECKED_REQUIRES_OPERATIONAL_APPROVAL'
    }))
  };
}

export async function runStaticPreflight({ rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') } = {}) {
  const files = {};
  for (const relative of REQUIRED_FILES) {
    files[relative] = await readFile(path.join(rootDir, relative), 'utf8');
  }
  return evaluatePreflight(files);
}

function printResult(result) {
  if (!result.pass) {
    console.error('STATIC_PREFLIGHT=FAIL');
    for (const failure of result.failures) console.error(`failure: ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log('STATIC_PREFLIGHT=PASS');
  console.log('');
  console.log('migration_sha256:');
  for (const file of REQUIRED_FILES) console.log(`  ${file}: ${result.hashes[file]}`);
  console.log('');
  console.log(`static_migration_order: ${result.migrationStructure.ordered ? 'PASS' : 'FAIL'}`);
  console.log(`static_dangerous_scope: ${result.migrationStructure.pass ? 'PASS' : 'FAIL'}`);
  console.log(`static_verification_contract: ${result.verification.pass ? 'PASS' : 'FAIL'}`);
  console.log('');
  console.log('required_external_checks:');
  for (const check of result.requiredExternalChecks) console.log(`  - ${check.name}: ${check.status}`);
  console.log('NOT_CHECKED_REQUIRES_OPERATIONAL_APPROVAL');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runStaticPreflight().then(printResult).catch((error) => {
    console.error('STATIC_PREFLIGHT=FAIL');
    console.error(`failure: ${error.message}`);
    process.exitCode = 1;
  });
}
