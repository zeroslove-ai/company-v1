#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);
const DEFAULT_MANIFEST = 'config/company-v1-db-contract.json';
const CORE_TABLES = ['games', 'game_master', 'game_save', 'game_actions', 'game_turns', 'image_library'];
const FUNCTION_NAMES = [
  'claim_game_action_stage', 'fail_game_action_stage', 'record_story_result_owned',
  'record_extract_result_owned', 'record_story_result', 'record_extract_result',
  'apply_reserved_csa_transaction', 'company_validate_scene_v1',
  'company_bootstrap_scene_v1', 'validate_company_save_v1', 'reset_company_game'
];

const KNOWN_TYPE_STARTS = new Set([
  'bigint', 'boolean', 'bytea', 'character', 'date', 'double', 'integer',
  'json', 'jsonb', 'numeric', 'real', 'smallint', 'text', 'time', 'timestamp',
  'timestamptz', 'uuid', 'varchar'
]);

function normalizeArgumentIdentity(value) {
  const tokens = String(value ?? '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  if (tokens.length === 0) return '';
  if (/^(in|out|inout|variadic)$/i.test(tokens[0])) tokens.shift();
  if (tokens.length > 1 && !KNOWN_TYPE_STARTS.has(tokens[0].toLowerCase())) {
    const typeStart = tokens.findIndex((token, index) => index > 0 && KNOWN_TYPE_STARTS.has(token.toLowerCase()));
    if (typeStart > 0) return tokens.slice(typeStart).join(' ');
  }
  return tokens.join(' ');
}

function normalizeIdentity(value) {
  return String(value ?? '').trim().split(/\s*,\s*/).filter(Boolean).map(normalizeArgumentIdentity).join(', ');
}

function functionKey(item) {
  return `${item.name}(${normalizeIdentity(item.identity_arguments)})`;
}

function findFunction(catalog, expected) {
  return (catalog.functions ?? []).find(item => item.name === expected.name
    && normalizeIdentity(item.identity_arguments) === normalizeIdentity(expected.identity_arguments));
}

function hasServiceRoleExecute(fn) {
  return fn?.service_role_execute === true || (Array.isArray(fn?.execute_roles) && fn.execute_roles.includes('service_role'));
}

function hasSafeSearchPath(fn) {
  const raw = Array.isArray(fn?.config) ? fn.config.find(item => String(item).startsWith('search_path=')) : fn?.search_path;
  return String(raw ?? '').replace(/^search_path=/, '').replace(/\s+/g, '') === 'public,pg_temp';
}

function hasDirectDml(catalog, table) {
  return (catalog.privileges ?? []).some(item => item.role === 'service_role' && item.table === table
    && ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'].includes(String(item.privilege).toUpperCase()));
}

export function evaluateCatalog(manifest, catalog, stage = 'stage_a') {
  const failures = [];
  const stageA = manifest?.stages?.stage_a ?? {};
  const current = manifest?.stages?.[stage] ?? {};
  const migrationNames = new Set((catalog?.migrations ?? []).map(item => String(item?.name ?? '')));
  const columns = new Set((catalog?.columns ?? []).map(item => `${item.table}.${item.column}`));

  for (const migrationName of new Set([...(stageA.required_migration_names ?? []), ...(current.required_migration_names ?? [])])) {
    if (!migrationNames.has(migrationName)) failures.push(`missing migration name: ${migrationName}`);
  }
  for (const column of [...(stageA.columns ?? []), ...(current.columns ?? [])]) {
    if (!columns.has(`${column.table}.${column.column}`)) failures.push(`missing column: ${column.table}.${column.column}`);
  }
  for (const expected of [...(stageA.functions ?? []), ...(current.functions ?? [])]) {
    const actual = findFunction(catalog, expected);
    if (!actual) {
      failures.push(`missing function: ${functionKey(expected)}`);
      continue;
    }
    if (actual.security_definer !== true) failures.push(`function is not SECURITY DEFINER: ${functionKey(expected)}`);
    if (!hasSafeSearchPath(actual)) failures.push(`unsafe search_path: ${functionKey(expected)}`);
    if (!hasServiceRoleExecute(actual)) failures.push(`service_role EXECUTE missing: ${functionKey(expected)}`);
  }
  if (stage === 'stage_b') {
    for (const expected of current.forbidden_functions ?? []) {
      if (findFunction(catalog, expected)) failures.push(`forbidden legacy function remains: ${functionKey(expected)}`);
    }
    for (const table of current.forbidden_direct_dml_tables ?? []) {
      if (hasDirectDml(catalog, table)) failures.push(`service_role direct DML remains: ${table}`);
    }
  }
  return { pass: failures.length === 0, stage, contract_id: manifest?.contract_id ?? null, contract_version: manifest?.contract_version ?? null, failures };
}

export function evaluateSceneCatalog(manifest, catalog, stage = 'stage_a') {
  const failures = [];
  const current = manifest?.stages?.[stage] ?? {};
  const migrationNames = new Set((catalog?.migrations ?? []).map(item => String(item?.name ?? '')));
  for (const migrationName of current.required_migration_names ?? []) {
    if (!migrationNames.has(migrationName)) failures.push(`missing scene migration name: ${migrationName}`);
  }
  for (const expected of current.functions ?? []) {
    const actual = findFunction(catalog, expected);
    if (!actual) {
      failures.push(`missing scene function: ${functionKey(expected)}`);
      continue;
    }
    if (actual.security_definer !== true) failures.push(`scene function is not SECURITY DEFINER: ${functionKey(expected)}`);
    if (!hasSafeSearchPath(actual)) failures.push(`unsafe scene search_path: ${functionKey(expected)}`);
    const shouldHaveServiceRoleExecute = expected.service_role_execute !== false;
    if (shouldHaveServiceRoleExecute && !hasServiceRoleExecute(actual)) {
      failures.push(`scene service_role EXECUTE missing: ${functionKey(expected)}`);
    }
    if (!shouldHaveServiceRoleExecute && hasServiceRoleExecute(actual)) {
      failures.push(`unexpected scene service_role EXECUTE: ${functionKey(expected)}`);
    }
  }
  const requiredProbes = current.probes ?? [];
  if (requiredProbes.length > 0 && (!catalog?.scene_probes || typeof catalog.scene_probes !== 'object' || Array.isArray(catalog.scene_probes))) {
    failures.push('missing scene behavioral-probe catalog');
  }
  for (const probe of requiredProbes) {
    if (catalog?.scene_probes?.[probe] !== true) failures.push(`scene probe failed: ${probe}`);
  }
  return { pass: failures.length === 0, stage, contract_id: manifest?.contract_id ?? null, contract_version: manifest?.contract_version ?? null, failures };
}

const CATALOG_SQL = `
with wanted_functions(name) as (select unnest(array[${FUNCTION_NAMES.map(name => `'${name}'`).join(', ')}]))
select jsonb_build_object(
  'migrations', case when to_regclass('supabase_migrations.schema_migrations') is null then '[]'::jsonb else coalesce((select jsonb_agg(jsonb_build_object('version', version::text, 'name', name::text)) from supabase_migrations.schema_migrations), '[]'::jsonb) end,
  'columns', coalesce((select jsonb_agg(jsonb_build_object('table', table_name, 'column', column_name)) from information_schema.columns where table_schema = 'public' and table_name = 'game_actions' and column_name in ('stage_owner_token', 'stage_claimed_at')), '[]'::jsonb),
  'functions', coalesce((select jsonb_agg(jsonb_build_object('name', p.proname, 'identity_arguments', oidvectortypes(p.proargtypes), 'security_definer', p.prosecdef, 'config', coalesce(to_jsonb(p.proconfig), '[]'::jsonb), 'service_role_execute', has_function_privilege('service_role', p.oid, 'EXECUTE'))) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in (select name from wanted_functions)), '[]'::jsonb),
  'privileges', coalesce((select jsonb_agg(jsonb_build_object('table', t.table_name, 'role', 'service_role', 'privilege', p.privilege_type)) from information_schema.tables t cross join lateral (select privilege_type from information_schema.role_table_grants g where g.grantee = 'service_role' and g.table_schema = 'public' and g.table_name = t.table_name and g.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')) p where t.table_schema = 'public' and t.table_name in (${CORE_TABLES.map(name => `'${name}'`).join(', ')})), '[]'::jsonb),
  'scene_probes', '{}'::jsonb
)::text;
`;

async function loadCatalog({ catalogPath, dbUrl }) {
  if (catalogPath) return JSON.parse(await readFile(catalogPath, 'utf8'));
  if (!dbUrl) throw new Error('DB_CONTRACT_GATE_REQUIRES_SUPABASE_DB_URL_OR_CATALOG: set SUPABASE_DB_URL for read-only catalog access or pass --catalog <json>');
  const { stdout } = await execFileAsync('psql', ['--no-psqlrc', '--tuples-only', '--no-align', '--command', CATALOG_SQL, dbUrl], { maxBuffer: 4 * 1024 * 1024 });
  return JSON.parse(stdout.trim());
}

async function main() {
  const args = process.argv.slice(2);
  const valueAfter = flag => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : null; };
  const hasActionGate = args.includes('--stage') || args.includes('--manifest') || !args.includes('--scene-stage');
  const stage = valueAfter('--stage') ?? 'stage_a';
  const manifestPath = valueAfter('--manifest') ?? DEFAULT_MANIFEST;
  const sceneStage = valueAfter('--scene-stage');
  const sceneManifestPath = valueAfter('--scene-manifest') ?? 'config/company-v1-scene-db-contract.json';
  const catalog = await loadCatalog({ catalogPath: valueAfter('--catalog'), dbUrl: process.env.SUPABASE_DB_URL });
  const manifest = hasActionGate ? JSON.parse(await readFile(manifestPath, 'utf8')) : null;
  const result = hasActionGate ? evaluateCatalog(manifest, catalog, stage) : null;
  const sceneResult = sceneStage ? evaluateSceneCatalog(JSON.parse(await readFile(sceneManifestPath, 'utf8')), catalog, sceneStage) : null;
  const output = sceneResult && result ? { action: result, scene: sceneResult, pass: result.pass && sceneResult.pass } : (sceneResult ?? result);
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if ((result && !result.pass) || (sceneResult && !sceneResult.pass)) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
