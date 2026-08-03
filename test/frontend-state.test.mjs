import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearPending, committedTurn, contextChoices, loadPending, pendingKey, recoveryFor, resolveGameId, saveFromContext, savePending, validateContext } from '../src/frontend/pages/state.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storage = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };
const gameId = '11111111-1111-4111-8111-111111111111';

test('frontend state resolves game IDs and validates Company v1 context', () => {
  assert.equal(resolveGameId(`?game=${gameId}`), gameId);
  assert.equal(resolveGameId('?game=not-a-uuid'), gameId);
  const context = { game: { edition_id: 'company-v1' }, save: { data: { edition: 'company-v1', save_schema_version: 1, turn_state: { committed_turn: 3 }, last_choices: ['A', '', 'B'] } } };
  assert.equal(validateContext(context), true); assert.equal(saveFromContext(context).edition, 'company-v1'); assert.equal(committedTurn(context), 3); assert.deepEqual(contextChoices(context), ['A', 'B']);
});

test('frontend pending actions preserve only recovery metadata', () => {
  const local = storage(); const action = { game_id: gameId, action_id: 'a', expected_turn: 1, player_action: 'Act', created_at: 'now', step: 'story' };
  savePending(local, action); assert.equal(loadPending(local, gameId).action_id, 'a'); clearPending(local, gameId); assert.equal(local.getItem(pendingKey(gameId)), null);
  assert.equal(recoveryFor({ recoverable_step: 'resume_commit' }), 'resume_commit'); assert.equal(recoveryFor({ recoverable_step: 'invalid' }), 'unknown');
});

test('frontend static contract keeps API URL in config and excludes direct backend access', () => {
  const pages = path.join(root, 'src/frontend/pages'); const files = fs.readdirSync(pages).filter(file => file.endsWith('.js'));
  const source = files.map(file => fs.readFileSync(path.join(pages, file), 'utf8')).join('\n');
  assert.match(fs.readFileSync(path.join(pages, 'index.html'), 'utf8'), /data-phase="phase-4-frontend-loop"/);
  assert.match(fs.readFileSync(path.join(pages, 'config.js'), 'utf8'), /game-proxy-company-v1/);
  assert.doesNotMatch(source, /supabase\.co\/rest|SUPABASE_SERVICE_ROLE_KEY|LLM_API_KEY|\/api\/save-turn|\/api\/set-save/);
});
