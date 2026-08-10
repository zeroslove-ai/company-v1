import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as engine from '../src/engine/index.js';
import { hydrateCanonicalScene } from '../src/engine/runtime-core/scene-reducer.js';
import { buildOpeningPlan } from '../src/engine/player-setup.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationPath = path.join(root, 'supabase/migrations/20260810000100_company_v1_canonical_opening_bootstrap.sql');
const clothingMigrationPath = path.join(root, 'supabase/migrations/20260809000100_company_v1_initial_clothing_v2.sql');
const verificationPath = path.join(root, 'supabase/verification/20260810000100_company_v1_canonical_opening_bootstrap.verify.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');
const commitMigration = fs.readFileSync(path.join(root, 'supabase/migrations/20260810090831_company_v1_commit_strict_validation.sql'), 'utf8');
const clothingMigration = fs.readFileSync(clothingMigrationPath, 'utf8');
const verification = fs.readFileSync(verificationPath, 'utf8');

test('turn-0 has no JavaScript full-save writer or public export', () => {
  assert.equal('buildOpeningNextSave' in engine, false);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'src/engine/player-setup.js'), 'utf8'), /function buildOpeningNextSave|export function buildOpeningNextSave/);
});

test('opening RPC package is the canonical turn-0 writer and keeps gameplay separate', () => {
  assert.match(migration, /create or replace function public\.reserve_company_player_setup/);
  assert.match(migration, /create or replace function public\.commit_company_opening/);
  assert.match(migration, /reserve_company_player_setup_legacy_v2/);
  assert.match(migration, /commit_company_opening_legacy_v2/);
  assert.match(migration, /company_apply_opening_scene_v1/);
  assert.doesNotMatch(migration, /insert\s+into\s+public\.game_actions|insert\s+into\s+public\.game_turns/i);
  assert.doesNotMatch(migration, /reduceGameplayCommit|extract/i);
});

test('canonical opening scene shape and legacy projection are explicit in SQL', () => {
  for (const field of ['version', 'scene_id', 'location_id', 'beat', 'goal', 'focus_thread', 'present_npc_ids', 'focal_character_id', 'last_speaker_id', 'updated_turn']) assert.match(migration, new RegExp(`'${field}'`));
  assert.match(migration, /'scene_id',\s*'opening'/);
  assert.match(migration, /'last_speaker_id',\s*null/);
  assert.match(migration, /'updated_turn',\s*0/);
  assert.match(migration, /'participants',\s*jsonb_build_array\(v_player_id\) \|\| to_jsonb\(v_present_ids\)/);
  assert.match(migration, /set data = public\.company_apply_opening_scene_v1/);
});

test('opening migration backfill is limited to Company turn zero and package is not applied by tests', () => {
  assert.match(migration, /g\.edition_id = 'company-v1'/);
  assert.match(migration, /coalesce\(s\.committed_turn, 0\) = 0/);
  assert.match(migration, /jsonb_typeof\(s\.data -> 'opening_state' -> 'plan'\) = 'object'/);
  assert.doesNotMatch(migration, /jsonb_typeof\(s\.data -> 'scene'\)/);
  assert.doesNotMatch(migration, /update public\.game_master/);
  assert.doesNotMatch(migration, /grant execute on function public\.company_apply_opening_scene_v1/);
  assert.match(migration, /service_role;\s*$/m);
  assert.doesNotMatch(migration, /delete\s+from\s+public\.game_(actions|turns)/i);
  assert.match(verification, /helper is not idempotent/);
  assert.match(verification, /off-scene NPC projection mismatch/);
  assert.match(verification, /version', 0, 'scene_id', 'stale'/);
  assert.match(verification, /service_role.*company_apply_opening_scene_v1/s);
});

test('opening plan remains deterministic and scene facts come from the plan', () => {
  const locations = [{
    location_id: 'brand_strategy_office',
    name: '브랜드전략실',
    opening_enabled: true,
    opening_hooks: [{ id: 'hook-1', label: '첫 업무' }],
    opening_goals: ['첫 업무를 시작한다']
  }];
  const planA = buildOpeningPlan({ positionId: 'intern', seedBytes: [3, 6, 9], heroineIds: ['heroine1', 'heroine2', 'heroine3'], locations });
  const planB = buildOpeningPlan({ positionId: 'intern', seedBytes: [3, 6, 9], heroineIds: ['heroine1', 'heroine2', 'heroine3'], locations });
  assert.deepEqual(planA, planB);
  assert.equal(planA.location_id, 'brand_strategy_office');
  assert.equal(planA.work_hook_id, 'hook-1');
  assert.equal(planA.scene_goal, '첫 업무를 시작한다');
  assert.equal(typeof planA.primary_character_id, 'string');
});

test('first gameplay starts at expected turn one without reopening the opening scene', () => {
  const saved = {
    turn_state: { committed_turn: 0 },
    scene: {
      version: 1,
      scene_id: 'opening',
      location_id: 'brand_strategy_office',
      beat: 0,
      goal: '첫 업무를 시작한다',
      focus_thread: 'hook-1',
      present_npc_ids: ['heroine1'],
      focal_character_id: 'heroine1',
      last_speaker_id: null,
      updated_turn: 0
    },
    scene_state: { participants: ['player-1', 'heroine5'] },
    last_npcs_present: ['heroine5']
  };
  assert.equal(saved.turn_state.committed_turn, 0);
  const hydrated = hydrateCanonicalScene(saved);
  assert.equal(hydrated.updated_turn, 0);
  assert.equal(hydrated.location_id, 'brand_strategy_office');
  assert.deepEqual(hydrated.present_npc_ids, ['heroine1']);
  assert.equal(hydrated.present_npc_ids.includes('heroine5'), false);
  assert.equal(1, saved.turn_state.committed_turn + 1);
});

test('historical clothing migration stays immutable and the new migration owns the preserving helper', () => {
  assert.doesNotMatch(clothingMigration, /v_existing_clothing/);
  assert.match(clothingMigration, /jsonb_set\(\s*v_data,\s*'\{player_scene_state,clothing\}',\s*public\.company_initial_clothing_v2\(\)/s);
  const definitionIndex = migration.indexOf('create or replace function public.company_apply_initial_clothing_v2');
  const firstUseIndex = migration.indexOf('public.company_apply_initial_clothing_v2(data)');
  assert.ok(definitionIndex >= 0);
  assert.ok(firstUseIndex > definitionIndex);
  assert.match(migration, /company_initial_clothing_v2\(\)\s*\|\|\s*v_existing_clothing/);
  assert.match(migration, /revoke all on function public\.company_initial_clothing_v2\(\)\s+from public, anon, authenticated, service_role/);
  assert.match(migration, /revoke all on function public\.company_apply_initial_clothing_v2\(jsonb\)\s+from public, anon, authenticated, service_role/);
  assert.match(migration, /company_apply_opening_scene_v1\(public\.company_apply_initial_clothing_v2\(data\)\)/);
  assert.match(migration, /reserve_company_player_setup_legacy_v2[\s\S]*?update public\.game_save[\s\S]*?company_apply_initial_clothing_v2\(data\)/);
  assert.doesNotMatch(migration, /update public\.game_save\s+set data = public\.company_apply_initial_clothing_v2\(data\),\s*save_revision\s*=\s*save_revision\s*\+/s);
  assert.match(verification, /v_combined := public\.company_apply_opening_scene_v1\(\s*public\.company_apply_initial_clothing_v2\(v_input\)\s*\)/s);
  assert.match(verification, /underwear_top.*removed/s);
  assert.match(verification, /uniform_top.*open/s);
  assert.match(verification, /custom.*preserve/s);
});

test('Company commit migration rejects invalid next saves and persists structured action', () => {
  assert.match(commitMigration, /create or replace function public\.commit_company_turn/);
  assert.match(commitMigration, /v_validation\s*:=\s*public\.validate_company_save_v1\(v_next_save\)/);
  assert.match(commitMigration, /raise exception 'invalid next save/);
  assert.match(commitMigration, /turn_id, game_id, turn_number, action_id, player_action, structured_action/);
  assert.match(commitMigration, /v_action\.structured_action/);
  assert.doesNotMatch(commitMigration, /save_fail_open|v_fail_open/);
  assert.match(commitMigration, /revoke all on function public\.commit_company_turn/);
  assert.match(commitMigration, /grant execute on function public\.commit_company_turn[\s\S]*to service_role/);
});
