import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FRESH_LEVEL7_RPC,
  LEVEL7_TEST_GAME_ID,
  PRESERVED_MANUAL_GAME_ID,
  PRESERVED_QA_GAME_ID,
  PRODUCTION_GAME_ID,
  TEST_SUPABASE_PROJECT_REF,
  assertFreshLevel7SeamTarget,
  assertLevel7SeamTarget,
  createFreshLevel7TestFixture,
  freshLevel7FixtureRpcArgs,
  level7FixtureRpcArgs,
  prepareLevel7TestFixture,
  resetLevel7TestFixture
} from '../scripts/test-level7-acceleration.mjs';
import { calculateCsaCapability } from '../src/engine/csa/capability.js';

const env = {
  SUPABASE_URL: `https://${TEST_SUPABASE_PROJECT_REF}.supabase.co`,
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
  COMPANY_TEST_GAME_ID: LEVEL7_TEST_GAME_ID,
  COMPANY_LEVEL7_SEAM_ENABLED: 'true'
};

const freshEnv = {
  SUPABASE_URL: env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  COMPANY_FRESH_LEVEL7_GAME_ID: '4f2c4b9d-0ce8-4a13-8d7d-c71f8e2a4b66',
  COMPANY_FRESH_LEVEL7_TITLE: 'Company v1 FRESH TEST',
  COMPANY_FRESH_LEVEL7_SEAM_ENABLED: 'true'
};

function mockFetch() {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init, body: init.body ? JSON.parse(init.body) : null });
    const rpc = new URL(url).pathname.split('/').pop();
    if (rpc === 'get_company_context') {
      return new Response(JSON.stringify({ game: { id: LEVEL7_TEST_GAME_ID, edition_id: 'company-v1', title: 'Company v1 TEST' } }), { status: 200 });
    }
    if (rpc === 'prepare_company_test_level7_fixture') {
      return new Response(JSON.stringify({ success: true, test_only: true, player_progress: { level: 7, exp: 0 } }), { status: 200 });
    }
    if (rpc === FRESH_LEVEL7_RPC) {
      return new Response(JSON.stringify({
        success: true,
        test_only: true,
        fresh_creation: true,
        target_reused: false,
        reset_performed: false,
        player_progress: { level: 7, exp: 0 },
        committed_turn: 0,
        game_actions_count: 0,
        game_turns_count: 0
      }), { status: 200 });
    }
    if (rpc === 'reset_company_game') {
      return new Response(JSON.stringify({ success: true, committed_turn: 0 }), { status: 200 });
    }
    throw new Error(`unexpected RPC ${rpc}`);
  };
  return { calls, fetchImpl };
}

test('Level-7 seam accepts only the dedicated TEST project/game and explicit enablement', () => {
  assert.equal(assertLevel7SeamTarget({ gameId: LEVEL7_TEST_GAME_ID, supabaseUrl: env.SUPABASE_URL, enabled: true }), env.SUPABASE_URL);
  assert.throws(() => assertLevel7SeamTarget({ gameId: PRODUCTION_GAME_ID, supabaseUrl: env.SUPABASE_URL, enabled: true }), /PRODUCTION_GAME_GUARD/);
  assert.throws(() => assertLevel7SeamTarget({ gameId: PRESERVED_MANUAL_GAME_ID, supabaseUrl: env.SUPABASE_URL, enabled: true }), /PRESERVED_GAME_GUARD/);
  assert.throws(() => assertLevel7SeamTarget({ gameId: '00000000-0000-4000-8000-000000000000', supabaseUrl: env.SUPABASE_URL, enabled: true }), /TEST_GAME_GUARD/);
  assert.throws(() => assertLevel7SeamTarget({ gameId: LEVEL7_TEST_GAME_ID, supabaseUrl: 'https://prod.supabase.co', enabled: true }), /TEST_SUPABASE_GUARD/);
  assert.throws(() => assertLevel7SeamTarget({ gameId: LEVEL7_TEST_GAME_ID, supabaseUrl: env.SUPABASE_URL, enabled: false }), /LEVEL7_SEAM_DISABLED/);
});

test('seam RPC contract carries only fixed game identity and current title', () => {
  assert.deepEqual(level7FixtureRpcArgs(LEVEL7_TEST_GAME_ID, 'Company v1 TEST'), {
    p_game_id: LEVEL7_TEST_GAME_ID,
    p_expected_title: 'Company v1 TEST'
  });
  assert.throws(() => level7FixtureRpcArgs(LEVEL7_TEST_GAME_ID, ''), /TEST_GAME_TITLE_REQUIRED/);
});

test('fresh seam accepts only an explicit arbitrary UUID on the dedicated TEST project', () => {
  assert.equal(assertFreshLevel7SeamTarget({
    gameId: freshEnv.COMPANY_FRESH_LEVEL7_GAME_ID,
    supabaseUrl: freshEnv.SUPABASE_URL,
    enabled: true
  }), freshEnv.SUPABASE_URL);
  assert.throws(() => assertFreshLevel7SeamTarget({ supabaseUrl: freshEnv.SUPABASE_URL, enabled: true }), /FRESH_TEST_GAME_ID_INVALID/);
  assert.throws(() => assertFreshLevel7SeamTarget({ gameId: 'not-a-uuid', supabaseUrl: freshEnv.SUPABASE_URL, enabled: true }), /FRESH_TEST_GAME_ID_INVALID/);
  assert.throws(() => assertFreshLevel7SeamTarget({ gameId: LEVEL7_TEST_GAME_ID, supabaseUrl: freshEnv.SUPABASE_URL, enabled: true }), /FRESH_TEST_GAME_GUARD/);
  assert.throws(() => assertFreshLevel7SeamTarget({ gameId: PRESERVED_MANUAL_GAME_ID, supabaseUrl: freshEnv.SUPABASE_URL, enabled: true }), /FRESH_TEST_GAME_GUARD/);
  assert.throws(() => assertFreshLevel7SeamTarget({ gameId: PRESERVED_QA_GAME_ID, supabaseUrl: freshEnv.SUPABASE_URL, enabled: true }), /FRESH_TEST_GAME_GUARD/);
  assert.throws(() => assertFreshLevel7SeamTarget({ gameId: PRODUCTION_GAME_ID, supabaseUrl: freshEnv.SUPABASE_URL, enabled: true }), /PRODUCTION_GAME_GUARD/);
  assert.throws(() => assertFreshLevel7SeamTarget({ gameId: freshEnv.COMPANY_FRESH_LEVEL7_GAME_ID, supabaseUrl: freshEnv.SUPABASE_URL, enabled: false }), /FRESH_LEVEL7_SEAM_DISABLED/);
  assert.throws(() => assertFreshLevel7SeamTarget({ gameId: freshEnv.COMPANY_FRESH_LEVEL7_GAME_ID, supabaseUrl: 'https://prod.supabase.co', enabled: true }), /TEST_SUPABASE_GUARD/);
});

test('fresh seam requires an explicit title and carries only the new RPC arguments', () => {
  assert.deepEqual(freshLevel7FixtureRpcArgs(freshEnv.COMPANY_FRESH_LEVEL7_GAME_ID, freshEnv.COMPANY_FRESH_LEVEL7_TITLE), {
    p_game_id: freshEnv.COMPANY_FRESH_LEVEL7_GAME_ID,
    p_expected_title: freshEnv.COMPANY_FRESH_LEVEL7_TITLE
  });
  assert.throws(() => freshLevel7FixtureRpcArgs(freshEnv.COMPANY_FRESH_LEVEL7_GAME_ID, ''), /TEST_GAME_TITLE_REQUIRED/);
});

test('strong CSA availability derives from the existing canonical Lv7 capability rule', () => {
  const capability = calculateCsaCapability({ player_progress: { level: 7, exp: 0 } }, 0);
  assert.equal(capability.available_strength_id, 'strong');
  assert.equal(capability.can_use_strong, true);
});

test('prepare uses the named seed RPC and never direct table mutation', async () => {
  const mock = mockFetch();
  const result = await prepareLevel7TestFixture({ env, fetchImpl: mock.fetchImpl });
  assert.equal(result.test_only, true);
  assert.deepEqual(mock.calls.map(call => new URL(call.url).pathname.split('/').pop()), [
    'get_company_context', 'prepare_company_test_level7_fixture'
  ]);
  assert.deepEqual(mock.calls[1].body, { p_game_id: LEVEL7_TEST_GAME_ID, p_expected_title: 'Company v1 TEST' });
  assert.equal(mock.calls.some(call => ['PATCH', 'PUT', 'DELETE'].includes(call.init.method)), false);
});

test('fresh creation calls only the new RPC and has no lookup/reset operation', async () => {
  const mock = mockFetch();
  const result = await createFreshLevel7TestFixture({ env: freshEnv, fetchImpl: mock.fetchImpl });
  assert.equal(result.fresh_creation, true);
  assert.deepEqual(mock.calls.map(call => new URL(call.url).pathname.split('/').pop()), [FRESH_LEVEL7_RPC]);
  assert.deepEqual(mock.calls[0].body, {
    p_game_id: freshEnv.COMPANY_FRESH_LEVEL7_GAME_ID,
    p_expected_title: freshEnv.COMPANY_FRESH_LEVEL7_TITLE
  });
  assert.equal(mock.calls.some(call => ['PATCH', 'PUT', 'DELETE'].includes(call.init.method)), false);
});

test('reset uses the canonical reset RPC and remains the cleanup boundary', async () => {
  const mock = mockFetch();
  const result = await resetLevel7TestFixture({ env, fetchImpl: mock.fetchImpl });
  assert.equal(result.committed_turn, 0);
  assert.deepEqual(mock.calls.map(call => new URL(call.url).pathname.split('/').pop()), [
    'get_company_context', 'reset_company_game'
  ]);
  assert.deepEqual(mock.calls[1].body, { p_game_id: LEVEL7_TEST_GAME_ID, p_expected_title: 'Company v1 TEST' });
});

test('fresh migration is additive, fail-closed, validated, and service-role-only', () => {
  const migration = readFileSync(new URL('../supabase/migrations/20260818000100_company_v1_fresh_level7_test_fixture.sql', import.meta.url), 'utf8');
  for (const table of ['games', 'game_master', 'game_save', 'game_actions', 'game_turns']) {
    assert.match(migration, new RegExp(`public\\.${table}`));
  }
  assert.match(migration, /validate_company_save_v1/);
  assert.match(migration, /player_progress/);
  assert.match(migration, /committed_turn.*0/s);
  assert.match(migration, /processing_status.*idle/s);
  assert.match(migration, /target_reused.*false/s);
  assert.match(migration, /template_read_only.*true/s);
  assert.doesNotMatch(migration, /reset_company_game/);
  assert.match(migration, /revoke all on function public\.create_company_test_level7_fixture/);
  assert.match(migration, /grant execute on function public\.create_company_test_level7_fixture.*to service_role/s);
});
