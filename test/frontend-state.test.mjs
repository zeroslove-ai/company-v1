import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { choicesForRenderer, createBusyGuard, createFrontendApp, createTurnCoordinator } from '../src/frontend/pages/app.js';
import { latestMindMonitor, parsedTurnNarrative, renderHistory, renderState, stateDisplayValues } from '../src/frontend/pages/render.js';
import { clearPending, committedTurn, contextChoices, loadPending, pendingKey, recoveryFor, resolveGameId, saveFromContext, savePending, validateContext } from '../src/frontend/pages/state.js';
import { buildCompanyGameViewModel } from '../src/frontend/pages/view-model.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storage = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };
const gameId = '11111111-1111-4111-8111-111111111111';

test('frontend state resolves game IDs and validates Company v1 context', () => {
  assert.equal(resolveGameId(`?game=${gameId}`), gameId);
  assert.equal(resolveGameId('?game=not-a-uuid'), gameId);
  const context = { game: { edition_id: 'company-v1' }, save: { data: { edition: 'company-v1', save_schema_version: 1, turn_state: { committed_turn: 3 }, last_choices: ['A', '', 'B'] } } };
  assert.equal(validateContext(context), true); assert.equal(saveFromContext(context).edition, 'company-v1'); assert.equal(committedTurn(context), 3); assert.deepEqual(contextChoices(context), ['A', 'B']);
  context.save.committed_turn = 4;
  assert.equal(committedTurn(context), 4);
});

test('frontend renderer consumes view-model choices and Mind Monitor', () => {
  const context = { save: { data: { last_choices: [] } }, recent_turns: [{ choices: ['old'] }, { choices: ['new', '', 'newer'], mind_monitor: { focus: 'stable' } }] };
  assert.deepEqual(contextChoices(context), ['new', 'newer']);
  const turnModel = buildCompanyGameViewModel(context);
  const extractModel = buildCompanyGameViewModel(context, { currentExtract: { mind_monitor: { current: 'preferred' } } });
  assert.deepEqual(choicesForRenderer(turnModel), turnModel.story.choices);
  assert.deepEqual(choicesForRenderer(turnModel, ['one', 'two', 'three', 'four']), ['one', 'two', 'three', 'four']);
  assert.deepEqual(choicesForRenderer(turnModel, ['incomplete']), turnModel.story.choices);
  assert.deepEqual(latestMindMonitor(turnModel), { focus: 'stable' });
  assert.deepEqual(latestMindMonitor(extractModel), { current: 'preferred' });
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
  constructor(tag) { this.tag = tag; this.children = []; this.className = ''; this.textContent = ''; this.hidden = false; this.disabled = false; this.onclick = null; this.listeners = new Map(); this.value = ''; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
}

function pageFixture() {
  const ids = ['game-main', 'game-title', 'turn-number', 'api-status', 'status-banner', 'error-banner', 'story-history', 'current-story', 'current-action', 'choice-list', 'player-action', 'submit-action', 'recovery-action', 'stream-status', 'scene-state', 'mind-monitor', 'warning-list'];
  const nodes = Object.fromEntries(ids.map(id => [id, new FakeNode(id)]));
  return { nodes, documentRef: { querySelector: selector => nodes[selector.slice(1)] ?? null, createElement: tag => new FakeNode(tag) } };
}

function validContext() { return { game: { edition_id: 'company-v1', title: 'Company' }, save: { data: { edition: 'company-v1', save_schema_version: 1, turn_state: { committed_turn: 0 }, scene_state: {}, world_state: {} } }, recent_turns: [] }; }

async function withFakeDocument(run) {
  const previousDocument = globalThis.document; const fixture = pageFixture(); globalThis.document = fixture.documentRef;
  try { return await run(fixture); } finally { globalThis.document = previousDocument; }
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

test('history keeps database turn order instead of reversing it', () => {
  const previousDocument = globalThis.document; globalThis.document = { createElement: tag => new FakeNode(tag) };
  try {
    const container = new FakeNode('div');
    renderHistory(container, [
      { player_action: 'Turn 1 action', parsed_blocks: [{ type: 'scene', text: 'Turn 1 story' }], turn_summary: 'Turn 1 summary' },
      { player_action: 'Turn 2 action', parsed_blocks: [{ type: 'scene', text: 'Turn 2 story' }], turn_summary: 'Turn 2 summary' }
    ]);
    assert.equal(container.children[0].children[0].textContent, 'Turn 1 action');
    assert.equal(container.children[1].children[0].textContent, 'Turn 2 action');
    assert.equal(container.children[0].children[1].children[0].textContent, 'Turn 1 story');
    assert.equal(container.children[1].children[2].textContent, 'Turn 2 summary');
  } finally { globalThis.document = previousDocument; }
});

test('pending recovery blocks a new action and action_not_found becomes retry_story', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const local = storage(); const pending = { game_id: gameId, action_id: 'saved-action', expected_turn: 4, player_action: 'Saved action', created_at: 'now', step: 'story' }; savePending(local, pending);
    let storyCalls = 0, actionIdCalls = 0;
    const previousCrypto = globalThis.crypto; Object.defineProperty(globalThis, 'crypto', { value: { randomUUID: () => { actionIdCalls += 1; return 'new-action'; } }, configurable: true });
    try {
      const api = { context: async () => ({ context: validContext() }), actionStatus: async () => { throw new (await import('../src/frontend/pages/api.js')).ApiError({ endpoint: '/api/action-status', status: 404, code: 'action_not_found', message: 'missing' }); }, story: async () => { storyCalls += 1; return new Response(); } };
      const app = createFrontendApp({ documentRef, storage: local, api }); await app.init();
      assert.equal(nodes['recovery-action'].hidden, false); assert.equal(typeof nodes['recovery-action'].onclick, 'function');
      assert.equal(nodes['player-action'].disabled, true); assert.equal(nodes['submit-action'].disabled, true);
      assert.equal(await app.startNewAction('New action'), false); assert.equal(actionIdCalls, 0); assert.equal(storyCalls, 0); assert.equal(loadPending(local, gameId).action_id, 'saved-action');
    } finally { Object.defineProperty(globalThis, 'crypto', { value: previousCrypto, configurable: true }); }
  });
});

test('complete recovery clears pending UI and re-enables action controls', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const local = storage(); savePending(local, { game_id: gameId, action_id: 'done-action', expected_turn: 1, player_action: 'Done', created_at: 'now', step: 'commit' });
    const api = { context: async () => ({ context: validContext() }), actionStatus: async () => ({ recoverable_step: 'complete' }) };
    const app = createFrontendApp({ documentRef, storage: local, api }); await app.init();
    assert.equal(loadPending(local, gameId), null); assert.equal(nodes['recovery-action'].hidden, true); assert.equal(nodes['recovery-action'].onclick, null);
    assert.equal(nodes['player-action'].disabled, false); assert.equal(nodes['submit-action'].disabled, false);
  });
});

test('state panel uses canonical save fields without object stringification', () => {
  const model = buildCompanyGameViewModel({ save: { data: { scene_state: { location_id: 'office', scene_goal: 'review' }, world_state: { time_block: 'morning', work_hook: { id: 'audit' } }, focal_character_id: 'npc-hayeon', csa_active: ['csa-1'] } } });
  const values = stateDisplayValues(model);
  assert.deepEqual({ 위치: values.위치, 시간: values.시간, 업무: values.업무, 초점: values.초점, 목표: values.목표 }, { 위치: 'office', 시간: 'morning', 업무: 'audit', 초점: 'npc-hayeon', 목표: 'review' });
  assert.equal(Object.values(values).some(value => value.includes('[object Object]')), false);
});

test('renderer receives adapter output without mutating Context or current Extract', () => {
  const previousDocument = globalThis.document; globalThis.document = { createElement: tag => new FakeNode(tag) };
  try {
    const context = validContext();
    context.save.committed_turn = 9;
    context.save.data.last_image_id = 123;
    context.save.data.focal_character_id = 'npc-hayeon';
    context.save.data.last_speaker_id = 'npc-areum';
    const runtime = { currentExtract: { mind_monitor: { source: 'current Extract' } } };
    const contextSnapshot = structuredClone(context), runtimeSnapshot = structuredClone(runtime);
    const model = buildCompanyGameViewModel(context, runtime);
    const elements = { title: new FakeNode('title'), turn: new FakeNode('turn'), scene: new FakeNode('scene'), mind: new FakeNode('mind'), warnings: new FakeNode('warnings') };
    renderState(elements, model, { title: context.game.title });
    assert.equal(elements.turn.textContent, 'Turn 9');
    assert.equal(model.media.image_id, 123);
    assert.equal(model.focal_character.id, 'npc-hayeon');
    assert.equal(model.focal_character.last_speaker_id, 'npc-areum');
    assert.equal(elements.mind.children[0].textContent, 'source: current Extract');
    assert.deepEqual(context, contextSnapshot);
    assert.deepEqual(runtime, runtimeSnapshot);
  } finally { globalThis.document = previousDocument; }
});

test('frontend static contract keeps API URL in config and excludes direct backend access', () => {
  const pages = path.join(root, 'src/frontend/pages'); const files = fs.readdirSync(pages).filter(file => file.endsWith('.js'));
  const source = files.map(file => fs.readFileSync(path.join(pages, file), 'utf8')).join('\n');
  assert.match(fs.readFileSync(path.join(pages, 'index.html'), 'utf8'), /data-phase="phase-4-frontend-loop"/);
  assert.match(fs.readFileSync(path.join(pages, 'index.html'), 'utf8'), /id="current-action"/);
  assert.match(fs.readFileSync(path.join(pages, 'config.js'), 'utf8'), /game-proxy-company-v1/);
  assert.doesNotMatch(source, /supabase\.co\/rest|SUPABASE_SERVICE_ROLE_KEY|LLM_API_KEY|\/api\/save-turn|\/api\/set-save/);
  const appSource = fs.readFileSync(path.join(pages, 'app.js'), 'utf8');
  const renderSource = fs.readFileSync(path.join(pages, 'render.js'), 'utf8');
  assert.match(appSource, /buildCompanyGameViewModel\(context/);
  assert.doesNotMatch(appSource, /contextChoices/);
  assert.doesNotMatch(renderSource, /context\?\.save|save\?\.data/);
});
