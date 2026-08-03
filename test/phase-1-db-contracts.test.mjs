import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const migrations = [
  'supabase/migrations/20260803000100_company_v1_core_schema.sql',
  'supabase/migrations/20260803000200_company_v1_turn_rpcs.sql',
  'supabase/migrations/20260803000300_company_v1_feedback_and_reset_rpcs.sql',
  'supabase/migrations/20260803000400_company_v1_lock_down_rpc_access.sql'
];
const seed = 'supabase/seed/20260803000100_company_v1_dev_seed.sql';

test('Phase 1 migration package files are UTF-8 and present', () => {
  for (const file of [...migrations, seed]) {
    const source = read(file);
    assert.ok(source.length > 0, file);
    assert.equal(source.includes('\uFFFD'), false, `${file} is not valid UTF-8 text`);
  }
});

test('core schema has independent Company v1 tables and save validator', () => {
  const core = read(migrations[0]);
  for (const table of ['games', 'game_master', 'game_save', 'game_actions', 'game_turns', 'image_library']) {
    assert.match(core, new RegExp(`create table public\\.${table}`, 'i'));
  }
  assert.match(core, /validate_company_save_v1/i);
  assert.match(core, /target_turn_id uuid/i);
  assert.match(core, /game_actions_target_turn_id_fkey[\s\S]*on delete set null/i);
  assert.match(core, /revoke all on function public\.set_updated_at\(\) from public/i);
  for (const key of ['save_schema_version', 'edition', 'turn_state', 'player', 'scene_state', 'csa_attitudes', 'event_ledger', 'last_choices']) assert.ok(core.includes(key));
  assert.doesNotMatch(core, /is_active|game_sessions|emotion_id/i);
  assert.match(core, /enable row level security/i);
  assert.match(core, /revoke all on function[\s\S]*from public/i);
  assert.match(core, /grant execute[\s\S]*to service_role/i);
});

test('turn and feedback RPCs preserve idempotency, conflicts, revisions, and reset scope', () => {
  const turn = read(migrations[1]);
  const feedback = read(migrations[2]);
  for (const fn of ['reserve_turn_action', 'record_story_result', 'record_extract_result', 'get_action_status', 'commit_company_turn']) assert.match(turn, new RegExp(`function public\\.${fn}`, 'i'));
  for (const fn of ['reserve_feedback_revision', 'commit_feedback_revision', 'reset_company_game']) assert.match(feedback, new RegExp(`function public\\.${fn}`, 'i'));
  assert.match(turn, /for update/i);
  assert.match(turn, /expected turn conflict/i);
  assert.match(turn, /replayed/i);
  assert.match(feedback, /latest active turn/i);
  assert.match(feedback, /record_status = 'superseded'/i);
  assert.match(feedback, /target_turn_id/i);
  assert.match(feedback, /original_turn_id/i);
  assert.match(feedback, /original_player_action/i);
  assert.match(feedback, /pre_save/i);
  assert.match(feedback, /where turn_id = v_action\.target_turn_id/i);
  assert.match(feedback, /v_original\.record_status <> 'active'/i);
  assert.match(feedback, /feedback target is no longer the latest active turn/i);
  assert.match(feedback, /revision request id is required/i);
  assert.match(feedback, /feedback text is required/i);
  assert.match(feedback, /delete from public\.game_turns where game_id = p_game_id/i);
  assert.match(feedback, /delete from public\.game_actions where game_id = p_game_id/i);
  assert.doesNotMatch(feedback, /update public\.game_master/i);
});

test('client roles cannot execute Company v1 security-definer RPCs', () => {
  const lockdown = read(migrations[3]);
  for (const fn of [
    'validate_company_save_v1',
    'create_company_game',
    'get_company_context',
    'reserve_turn_action',
    'record_story_result',
    'record_extract_result',
    'get_action_status',
    'commit_company_turn',
    'reserve_feedback_revision',
    'commit_feedback_revision',
    'reset_company_game'
  ]) {
    assert.match(lockdown, new RegExp(`revoke all on function public\\.${fn}\\([\\s\\S]*?from public, anon, authenticated`, 'i'), fn);
  }
  assert.doesNotMatch(lockdown, /grant execute[\s\S]*to (?:anon|authenticated)/i);
  assert.match(lockdown, /grant execute[\s\S]*to service_role/i);
});

test('migration package excludes destructive, deployment, legacy, and secret-like material', () => {
  const packageText = [...migrations, seed].map(read).join('\n');
  assert.doesNotMatch(packageText, /drop\s+table|truncate|wrangler\s+deploy/i);
  assert.doesNotMatch(packageText, /game-proxy-v2|gamebuilder-v2|game-builder-v2/i);
  assert.doesNotMatch(packageText, /ovltkzwddxsekcfeskds/i);
  assert.doesNotMatch(packageText, /(api[_-]?key|service[_-]?role[_-]?key|token)\s*[:=]\s*['"][^'"]+/i);
});
