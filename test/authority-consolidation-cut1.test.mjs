import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSupabaseClient } from '../src/api/supabase.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const stageA = read('supabase/migrations/20260814000300_company_v1_action_ownership_closure_stage_a.sql');
const stageB = read('supabase/migrations/20260814000400_company_v1_authority_enforcement_stage_b.sql');
const clientSource = read('src/api/supabase.js');
const routeSource = read('src/api/turn-routes.js');

test('Cut 1 Stage A defines atomic owner CAS and the actual lifecycle graph', () => {
  for (const state of ['story_streaming', 'extracting', 'committing', 'ready', 'story_failed', 'extract_failed', 'commit_failed', 'committed']) {
    assert.match(read('supabase/migrations/20260803000100_company_v1_core_schema.sql'), new RegExp(`'${state}'`));
  }
  assert.match(stageA, /claim_game_action_stage/);
  assert.match(stageA, /fail_game_action_stage/);
  assert.match(stageA, /p_expected_owner_mode text/);
  assert.match(stageA, /p_expected_owner_token text/);
  assert.match(stageA, /p_next_owner_token text/);
  assert.match(stageA, /p_next_error_code text/);
  assert.match(stageA, /p_require_stale boolean/);
  assert.match(stageA, /interval '3 minutes'/);
  assert.match(stageA, /fresh story claim requires NULL owner condition/);
  assert.match(stageA, /v_mode = 'ANY'/);
  assert.match(stageA, /v_mode = 'NULL' and stage_owner_token is null/);
  assert.match(stageA, /v_mode = 'EXACT' and stage_owner_token = p_expected_owner_token/);
  assert.match(stageA, /returning \* into v_action/);
  assert.match(stageA, /extract_failed.*extracting/s);
  assert.match(routeSource, /extracting.*extractOwnerToken/s);
  assert.match(stageA, /story_streaming.*story_failed/s);
  assert.match(stageA, /processing_status = 'committing'[\s\S]*error_code = null[\s\S]*updated_at = now\(\)/);
  assert.match(stageA, /record_story_result_owned/);
  assert.match(stageA, /processing_status <> 'story_streaming' or v_action\.stage_owner_token <> p_owner_token/);
  assert.match(routeSource, /processing_status === 'story_failed'/);
  assert.match(routeSource, /storyOwnerToken/);
  assert.match(routeSource, /stage_owner_token/);
  assert.match(routeSource, /'story_streaming', storyOwnerToken/);
  assert.match(routeSource, /recordStoryResultOwned/);
  assert.match(routeSource, /'EXACT', storyOwnerToken, 'story_failed'/);
});

test('Closure Stage A defines the shared owner-token contract for Story and Extract', () => {
  assert.match(stageA, /stage_owner_token text null/);
  assert.match(stageA, /stage_claimed_at timestamptz null/);
  assert.match(stageA, /p_expected_owner_mode text/);
  assert.match(stageA, /p_expected_owner_token text/);
  assert.match(stageA, /p_next_owner_token text/);
  assert.match(stageA, /stage_claimed_at <= now\(\) - interval '3 minutes'/);
  assert.match(stageA, /record_extract_result_owned/);
  assert.match(stageA, /stage_owner_token <> p_owner_token/);
  assert.match(stageA, /record_story_result.*stage_owner_token is not null/s);
  assert.match(stageA, /reserve_turn_action.*stage_claimed_at/s);
  assert.match(stageA, /action_id <> p_action_id/);
  assert.match(stageA, /stage_owner_token = null[\s\S]*stage_claimed_at = null/);
  assert.doesNotMatch(routeSource, /extract_in_progress/);
  assert.match(routeSource, /extractOwnerToken/);
  assert.match(routeSource, /recordExtractResultOwned/);
});

test('Cut 1 Stage B enforces read-only direct table access and removes the obsolete preapply writer', () => {
  for (const table of ['games', 'game_master', 'game_save', 'game_actions', 'game_turns', 'image_library']) {
    assert.match(stageB, new RegExp(`revoke insert, update, delete, truncate on table public\\.${table} from service_role`));
  }
  assert.match(stageB, /drop function if exists public\.apply_reserved_csa_transaction/);
  assert.match(stageB, /Stage A is deployed/);
});

test('runtime uses named lifecycle RPCs and has no direct action PATCH or redundant committing writer', () => {
  assert.doesNotMatch(clientSource, /method:\s*'PATCH'/);
  assert.doesNotMatch(clientSource, /updateActionStatus|claimActionStatus/);
  assert.doesNotMatch(routeSource, /updateActionStatus|claimActionStatus/);
  assert.match(routeSource, /claimGameActionStage/);
  assert.match(routeSource, /failGameActionStage/);
  assert.match(routeSource, /recordExtractResultOwned/);
  assert.doesNotMatch(routeSource, /updateActionStatus\([^\n]*committing/);
});

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

test('current source/scripts/workflows have no caller for the obsolete CSA preapply RPC', () => {
  const roots = ['src', 'scripts', '.github'];
  const files = [];
  const walk = dir => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(?:js|mjs|yml|yaml|json)$/.test(entry.name)) files.push(full);
    }
  };
  roots.forEach(dir => walk(path.join(root, dir)));
  const callers = files.filter(file => file.endsWith('company-db-contract-gate.mjs') === false)
    .filter(file => fs.readFileSync(file, 'utf8').includes('apply_reserved_csa_transaction'));
  assert.deepEqual(callers, []);
});
