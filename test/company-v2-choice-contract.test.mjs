import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseStoryBlocks } from '../runtime-v2/domain/story.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const migration = read('supabase/migrations/20260819000600_company_v2_choice_contract_closure.sql');
const worker = read('runtime-v2/server/worker.js');
const store = read('runtime-v2/server/supabase-store.js');
const frontend = read('frontend-v2/app.js');

test('active v2 Story projection and both write paths use empty choices', () => {
  assert.deepEqual(parseStoryBlocks('[NARRATIVE]\nA free-form scene').choices, []);
  assert.match(worker, /createOpening\(gameId, \{[\s\S]*?choices: parsed\.choices/);
  assert.match(worker, /commitTurn\(\{[\s\S]*?choices: parsed\.choices/);
  assert.match(store, /p_choices: payload\.choices/);
  assert.match(store, /p_choices: choices/);
});

test('choice contract migration is additive, empty-only, and historical-row safe', () => {
  assert.match(migration, /drop constraint if exists company_v2_turns_choices_check/i);
  assert.match(migration, /add constraint company_v2_turns_choices_empty_check/i);
  assert.match(migration, /jsonb_typeof\(choices\) = 'array' and jsonb_array_length\(choices\) = 0\)\s*not valid/i);
  assert.doesNotMatch(migration, /\b(?:update|delete)\s+public\.company_v2_turns\b/i);
  assert.doesNotMatch(migration, /backfill|jsonb_array_length\(choices\)\s*=\s*4/i);
});

test('Opening RPC keeps its checks and changes only choices to non-null empty arrays', () => {
  assert.match(migration, /create or replace function public\.company_v2_create_opening\(\s*p_game_id uuid,\s*p_story_text text,\s*p_parsed_blocks jsonb,\s*p_choices jsonb,\s*p_turn_summary text,\s*p_mind_monitor jsonb\s*\)/is);
  assert.match(migration, /p_choices is null/);
  assert.match(migration, /jsonb_typeof\(p_choices\) <> 'array'/);
  assert.match(migration, /jsonb_array_length\(p_choices\) <> 0/);
  assert.match(migration, /on conflict \(game_id, turn_number\) do nothing/i);
  assert.match(migration, /insert into public\.company_v2_turns\(game_id, turn_number, literal_action, story_text, parsed_blocks, choices, turn_summary, mind_monitor, state_after\)/i);
});

test('fenced Commit RPC keeps empty-only choices and exact attempt fencing', () => {
  assert.match(migration, /create or replace function public\.company_v2_commit_turn\(\s*p_game_id uuid,\s*p_turn_number integer,\s*p_action_id uuid,\s*p_attempt_no integer,\s*p_expected_revision integer,\s*p_story_text text,\s*p_parsed_blocks jsonb,\s*p_choices jsonb,\s*p_turn_summary text,\s*p_mind_monitor jsonb,\s*p_state_after jsonb\s*\)/is);
  assert.match(migration, /p_choices is null[\s\S]*?jsonb_typeof\(p_choices\) <> 'array'[\s\S]*?jsonb_array_length\(p_choices\) <> 0/);
  assert.match(migration, /v_job\.action_id <> p_action_id/);
  assert.match(migration, /v_job\.attempt_no <> p_attempt_no/);
  assert.match(migration, /where game_id = p_game_id[\s\S]*?and turn_number = p_turn_number[\s\S]*?and action_id = p_action_id[\s\S]*?and attempt_no = p_attempt_no[\s\S]*?and status = 'processing'/);
  assert.doesNotMatch(migration, /create or replace function public\.company_v2_commit_turn\(\s*p_game_id uuid,\s*p_turn_number integer,\s*p_expected_revision integer/is);
  assert.doesNotMatch(migration, /company_v2_commit_turn\(uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb\)/i);
});

test('replaced RPC ACLs remain service_role-only', () => {
  const signatures = [
    'company_v2_create_opening\\(uuid, text, jsonb, jsonb, text, jsonb',
    'company_v2_commit_turn\\(uuid, integer, uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb'
  ];
  for (const signature of signatures) {
    assert.match(migration, new RegExp(`revoke all on function public\\.${signature}\\) from public, anon, authenticated, service_role;`, 'i'));
    assert.match(migration, new RegExp(`grant execute on function public\\.${signature}\\) to service_role;`, 'i'));
  }
});

test('historical v2 migrations remain byte-identical and setup JSON preserves Korean UTF-8', () => {
  const expected = {
    '20260819000200_company_v2_phase1_vertical_slice.sql': 'dd34271328905d15280f27f17c226e3bd63b7109',
    '20260819000300_company_v2_stuck_turn_closure.sql': '6cf89379182ba36dfab3b74123b3c4837ad011df',
    '20260819000400_company_v2_attempt_fencing.sql': 'fbc31a363b5062abdb9a5b8e102b77da577b5eb7',
    '20260819000500_company_v2_acl_closure.sql': '0d9a77efcddf3a674b06bcd6720717c4fddf5fb3'
  };
  for (const [file, blob] of Object.entries(expected)) {
    assert.equal(requireGitBlob(file), blob, `${file} changed`);
  }
  const playerName = '\uD50C\uB808\uC774\uC5B4';
  assert.ok(frontend.includes(`player_name: '${playerName}'`));
  assert.equal(JSON.parse(JSON.stringify({ player_name: playerName })).player_name, playerName);
});

function requireGitBlob(file) {
  return execFileSync('git', ['rev-parse', `HEAD:supabase/migrations/${file}`], { cwd: root, encoding: 'utf8' }).trim();
}
