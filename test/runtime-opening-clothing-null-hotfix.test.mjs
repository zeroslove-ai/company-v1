import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hotfixPath = path.join(root, 'supabase/migrations/20260810024000_company_v1_clothing_null_hotfix.sql');
const hotfix = fs.readFileSync(hotfixPath, 'utf8');

test('fresh opening bootstrap normalizes missing clothing with a null-safe predicate', () => {
  const matches = hotfix.match(/jsonb_typeof\(v_existing_clothing\)\s+is distinct from\s+'object'/gi) ?? [];
  assert.equal(matches.length, 2);
  assert.doesNotMatch(hotfix, /jsonb_typeof\(v_existing_clothing\)\s*<>\s*'object'/i);
  assert.match(hotfix, /company_initial_clothing_v2\(\)\s*\|\|\s*v_existing_clothing/);
});

test('clothing null hotfix only redefines the pure helper and keeps it private', () => {
  assert.match(hotfix, /create or replace function public\.company_apply_initial_clothing_v2\(p_data jsonb\)/i);
  assert.doesNotMatch(hotfix, /update\s+public\.game_save|update\s+public\.game_master|delete\s+from|insert\s+into/i);
  assert.doesNotMatch(hotfix, /reserve_company_player_setup|commit_company_opening|reset_company_game/i);
  assert.match(hotfix, /revoke all on function public\.company_apply_initial_clothing_v2\(jsonb\)[\s\S]*from public, anon, authenticated, service_role/i);
});
