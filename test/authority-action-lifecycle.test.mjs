import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseClient } from '../src/api/supabase.js';

test('Supabase client sends explicit expected error mode and next error code to CAS RPC', async () => {
  const calls = [];
  const client = createSupabaseClient({ SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'secret' }, async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
  return new Response(JSON.stringify({ action_id: 'a', processing_status: 'extracting', stage_owner_token: 'extract:req' }), { status: 200 });
  });
  await client.claimGameActionStage('g', 'a', 'extracting', 'NULL', null, 'extracting', 'extract:req');
  await client.failGameActionStage('g', 'a', 'extracting', 'EXACT', 'extract:req', 'extract_failed', 'provider_error');
  assert.equal(calls[0].url, 'https://supabase.test/rest/v1/rpc/claim_game_action_stage');
  assert.deepEqual(calls[0].body, {
    p_game_id: 'g', p_action_id: 'a', p_expected_status: 'extracting',
    p_expected_owner_mode: 'NULL', p_expected_owner_token: null,
    p_next_status: 'extracting', p_next_owner_token: 'extract:req', p_next_error_code: null, p_require_stale: false
  });
  assert.equal(calls[1].body.p_expected_owner_mode, 'EXACT');
  assert.equal(calls[1].body.p_expected_owner_token, 'extract:req');
  assert.equal(calls[1].body.p_next_error_code, 'provider_error');
});

test('owned Story RPC exposes token-fenced persistence', async () => {
  const calls = [];
  const client = createSupabaseClient({ SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'secret' }, async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ processing_status: 'extracting', error_code: null }), { status: 200 });
  });
  await client.recordStoryResultOwned('g', 'a', 'Story', { blocks: [] }, 'story:req');
  assert.equal(calls[0].url, 'https://supabase.test/rest/v1/rpc/record_story_result_owned');
  assert.equal(calls[0].body.p_owner_token, 'story:req');
});

test('owned Extract RPC is the only new completion writer', async () => {
  const calls = [];
  const client = createSupabaseClient({ SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'secret' }, async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ processing_status: 'committing', error_code: null }), { status: 200 });
  });
  await client.recordExtractResultOwned('g', 'a', { outcome: 'partial' }, 'extract:req');
  assert.equal(calls[0].url, 'https://supabase.test/rest/v1/rpc/record_extract_result_owned');
  assert.equal(calls[0].body.p_owner_token, 'extract:req');
});
