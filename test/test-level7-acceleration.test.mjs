import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEVEL7_TEST_GAME_ID,
  PRESERVED_MANUAL_GAME_ID,
  PRODUCTION_GAME_ID,
  TEST_SUPABASE_PROJECT_REF,
  assertLevel7SeamTarget,
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

test('reset uses the canonical reset RPC and remains the cleanup boundary', async () => {
  const mock = mockFetch();
  const result = await resetLevel7TestFixture({ env, fetchImpl: mock.fetchImpl });
  assert.equal(result.committed_turn, 0);
  assert.deepEqual(mock.calls.map(call => new URL(call.url).pathname.split('/').pop()), [
    'get_company_context', 'reset_company_game'
  ]);
  assert.deepEqual(mock.calls[1].body, { p_game_id: LEVEL7_TEST_GAME_ID, p_expected_title: 'Company v1 TEST' });
});
