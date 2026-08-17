import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSupabaseClient } from '../src/api/supabase.js';

export const LEVEL7_TEST_GAME_ID = '2d00d76e-85b1-4cf0-8dab-a04e8a044b84';
export const PRESERVED_MANUAL_GAME_ID = '78fb1d94-266f-455a-bda4-7656cc2370c1';
export const PRODUCTION_GAME_ID = '11111111-1111-4111-8111-111111111111';
export const TEST_SUPABASE_PROJECT_REF = 'fmcrspgxstsmxxsmkeee';
export const LEVEL7_RPC = 'prepare_company_test_level7_fixture';

function requireTestSeamEnabled(env) {
  if (env?.COMPANY_LEVEL7_SEAM_ENABLED !== 'true') {
    throw new Error('LEVEL7_SEAM_DISABLED: explicit TEST seam enablement is required');
  }
}

function requireTestSupabaseUrl(supabaseUrl) {
  let parsed;
  try {
    parsed = new URL(supabaseUrl);
  } catch {
    throw new Error('TEST_SUPABASE_GUARD: SUPABASE_URL is invalid');
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== `${TEST_SUPABASE_PROJECT_REF}.supabase.co`) {
    throw new Error('TEST_SUPABASE_GUARD: dedicated TEST Supabase project is required');
  }
  return parsed.origin;
}

export function assertLevel7SeamTarget({ gameId, supabaseUrl, enabled = false } = {}) {
  if (gameId === PRODUCTION_GAME_ID) throw new Error('PRODUCTION_GAME_GUARD: production game is forbidden');
  if (gameId === PRESERVED_MANUAL_GAME_ID) throw new Error('PRESERVED_GAME_GUARD: preserved manual game is read-only');
  if (gameId !== LEVEL7_TEST_GAME_ID) throw new Error('TEST_GAME_GUARD: dedicated Level-7 TEST game is required');
  if (enabled !== true) throw new Error('LEVEL7_SEAM_DISABLED: explicit TEST seam enablement is required');
  return requireTestSupabaseUrl(supabaseUrl);
}

export function level7FixtureRpcArgs(gameId, expectedTitle) {
  if (typeof expectedTitle !== 'string' || !expectedTitle.trim()) {
    throw new Error('TEST_GAME_TITLE_REQUIRED: game title is required');
  }
  return { p_game_id: gameId, p_expected_title: expectedTitle };
}

function envForSeam(env = process.env) {
  requireTestSeamEnabled(env);
  const supabaseUrl = requireTestSupabaseUrl(env.SUPABASE_URL);
  assertLevel7SeamTarget({
    gameId: env.COMPANY_TEST_GAME_ID ?? LEVEL7_TEST_GAME_ID,
    supabaseUrl,
    enabled: true
  });
  return { ...env, SUPABASE_URL: supabaseUrl };
}

async function fixtureTitle(db, gameId) {
  const context = await db.callRpc('get_company_context', { p_game_id: gameId, p_recent_turns: 1 });
  const title = context?.game?.title;
  if (typeof title !== 'string' || !title.trim()) throw new Error('TEST_GAME_TITLE_REQUIRED: live title is missing');
  return title;
}

export async function prepareLevel7TestFixture({ env = process.env, fetchImpl = fetch } = {}) {
  const scopedEnv = envForSeam(env);
  const gameId = scopedEnv.COMPANY_TEST_GAME_ID ?? LEVEL7_TEST_GAME_ID;
  const db = createSupabaseClient(scopedEnv, fetchImpl);
  const title = await fixtureTitle(db, gameId);
  return db.callRpc(LEVEL7_RPC, level7FixtureRpcArgs(gameId, title));
}

export async function resetLevel7TestFixture({ env = process.env, fetchImpl = fetch } = {}) {
  const scopedEnv = envForSeam(env);
  const gameId = scopedEnv.COMPANY_TEST_GAME_ID ?? LEVEL7_TEST_GAME_ID;
  const db = createSupabaseClient(scopedEnv, fetchImpl);
  const title = await fixtureTitle(db, gameId);
  return db.callRpc('reset_company_game', { p_game_id: gameId, p_expected_title: title });
}

async function main() {
  const result = process.argv.includes('--reset')
    ? await resetLevel7TestFixture()
    : await prepareLevel7TestFixture();
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
