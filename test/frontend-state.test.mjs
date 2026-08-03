import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBusyGuard, createTurnCoordinator } from '../src/frontend/pages/app.js';
import { parsedTurnNarrative, renderHistory, stateDisplayValues } from '../src/frontend/pages/render.js';
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

test('recovery reuses the pending action contract and calls only its required endpoints', async () => {
  const calls = []; const local = storage(); let refreshes = 0;
  const api = {
    story: async body => { calls.push(['story', body]); return new Response(); },
    extract: async body => { calls.push(['extract', body]); return { extract: { choices: [], mind_monitor: {} }, warnings: [] }; },
    commit: async body => { calls.push(['commit', body]); return { commit: { success: true } }; }
  };
  const coordinator = createTurnCoordinator({
    api, storage: local, gameId,
    getContext: () => ({ save: { data: { turn_state: { committed_turn: 0 } } } }),
    refreshContext: async () => { refreshes += 1; },
    createActionId: () => 'fixed-action', consumeStory: async (_response, onEvent) => { onEvent({ event: 'meta', data: {} }); onEvent({ event: 'delta', data: { text: '[SCENE] Story' } }); onEvent({ event: 'complete', data: {} }); }
  });
  await coordinator.startNewAction('Keep action');
  assert.deepEqual(calls.map(([name]) => name), ['story', 'extract', 'commit']);
  assert.deepEqual(calls[0][1], { game_id: gameId, action_id: 'fixed-action', expected_turn: 1, player_action: 'Keep action' });
  assert.deepEqual(calls[2][1], { game_id: gameId, action_id: 'fixed-action', expected_turn: 1 });
  assert.equal(refreshes, 1);

  const pending = { game_id: gameId, action_id: 'existing-action', expected_turn: 7, player_action: 'Existing action', created_at: 'now', step: 'commit' };
  calls.length = 0; await coordinator.runRecovery({ ...pending }, 'retry_story');
  assert.deepEqual(calls.map(([name]) => name), ['story', 'extract', 'commit']);
  assert.deepEqual(calls[0][1], { game_id: gameId, action_id: 'existing-action', expected_turn: 7, player_action: 'Existing action' });
  calls.length = 0; await coordinator.runRecovery({ ...pending }, 'resume_extract');
  assert.deepEqual(calls.map(([name]) => name), ['extract', 'commit']);
  calls.length = 0; await coordinator.runRecovery({ ...pending }, 'retry_extract');
  assert.deepEqual(calls.map(([name]) => name), ['extract', 'commit']);
  calls.length = 0; await coordinator.runRecovery({ ...pending }, 'resume_commit');
  assert.deepEqual(calls.map(([name]) => name), ['commit']);
  calls.length = 0; await coordinator.runRecovery({ ...pending }, 'retry_commit');
  assert.deepEqual(calls.map(([name]) => name), ['commit']);
  savePending(local, pending); await coordinator.runRecovery(pending, 'complete');
  assert.equal(loadPending(local, gameId), null);
});

test('busy guard admits a recovery operation once instead of making retry a no-op', async () => {
  const states = []; const guard = createBusyGuard({ onChange: value => states.push(value) });
  let nestedResult;
  const result = await guard.run(async () => { nestedResult = await guard.run(async () => true); return 'executed'; });
  assert.equal(result, 'executed'); assert.equal(nestedResult, false); assert.deepEqual(states, [true, false]); assert.equal(guard.busy, false);
});

class FakeNode {
  constructor(tag) { this.tag = tag; this.children = []; this.className = ''; this.textContent = ''; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
}

test('history preserves action, narrative, summary and accepted parsed block shapes', () => {
  const previousDocument = globalThis.document; globalThis.document = { createElement: tag => new FakeNode(tag) };
  try {
    const container = new FakeNode('div');
    renderHistory(container, [{ player_action: 'Action', parsed_blocks: { blocks: [{ type: 'scene', text: 'Scene' }] }, turn_summary: 'Summary' }]);
    const card = container.children[0]; assert.equal(card.children[0].textContent, 'Action'); assert.equal(card.children[1].children[0].textContent, 'Scene'); assert.equal(card.children[2].textContent, 'Summary');
    assert.equal(parsedTurnNarrative({ parsed_blocks: [{ type: 'scene', text: 'Array' }] }).blocks[0].text, 'Array');
    assert.equal(parsedTurnNarrative({ story_text: 'fallback' }).blocks[0].type, 'unparsed');
  } finally { globalThis.document = previousDocument; }
});

test('state panel uses canonical save fields without object stringification', () => {
  const values = stateDisplayValues({ save: { data: { scene_state: { location_id: 'office', scene_goal: 'review' }, world_state: { time_block: 'morning', work_hook: { id: 'audit' } }, focal_character_id: 'npc-hayeon', csa_active: ['csa-1'] } } });
  assert.deepEqual({ 위치: values.위치, 시간: values.시간, 업무: values.업무, 초점: values.초점, 목표: values.목표 }, { 위치: 'office', 시간: 'morning', 업무: 'audit', 초점: 'npc-hayeon', 목표: 'review' });
  assert.equal(Object.values(values).some(value => value.includes('[object Object]')), false);
});

test('frontend static contract keeps API URL in config and excludes direct backend access', () => {
  const pages = path.join(root, 'src/frontend/pages'); const files = fs.readdirSync(pages).filter(file => file.endsWith('.js'));
  const source = files.map(file => fs.readFileSync(path.join(pages, file), 'utf8')).join('\n');
  assert.match(fs.readFileSync(path.join(pages, 'index.html'), 'utf8'), /data-phase="phase-4-frontend-loop"/);
  assert.match(fs.readFileSync(path.join(pages, 'index.html'), 'utf8'), /id="current-action"/);
  assert.match(fs.readFileSync(path.join(pages, 'config.js'), 'utf8'), /game-proxy-company-v1/);
  assert.doesNotMatch(source, /supabase\.co\/rest|SUPABASE_SERVICE_ROLE_KEY|LLM_API_KEY|\/api\/save-turn|\/api\/set-save/);
});
