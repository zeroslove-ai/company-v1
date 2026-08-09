import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as engine from '../src/engine/index.js';
import { buildOpeningPlan } from '../src/engine/player-setup.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationPath = path.join(root, 'supabase/migrations/20260810000100_company_v1_canonical_opening_bootstrap.sql');
const verificationPath = path.join(root, 'supabase/verification/20260810000100_company_v1_canonical_opening_bootstrap.verify.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');
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
  assert.doesNotMatch(migration, /delete\s+from\s+public\.game_(actions|turns)/i);
  assert.match(verification, /helper is not idempotent/);
  assert.match(verification, /off-scene NPC projection mismatch/);
});

test('opening plan remains deterministic and scene facts come from the plan', () => {
  const planA = buildOpeningPlan({ positionId: 'intern', seedBytes: [3, 6, 9], heroineIds: ['heroine1', 'heroine2', 'heroine3'], locations: [{ id: 'brand_strategy_office' }] });
  const planB = buildOpeningPlan({ positionId: 'intern', seedBytes: [3, 6, 9], heroineIds: ['heroine1', 'heroine2', 'heroine3'], locations: [{ id: 'brand_strategy_office' }] });
  assert.deepEqual(planA, planB);
  assert.equal(typeof planA.location_id, 'string');
  assert.equal(typeof planA.primary_character_id, 'string');
  assert.equal(typeof planA.scene_goal, 'string');
});
