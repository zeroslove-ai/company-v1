import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { choicesForRenderer, createBusyGuard, createFrontendApp, createTurnCoordinator, toolbarCapabilities } from '../src/frontend/pages/app.js';
import { ApiError } from '../src/frontend/pages/api.js';
import { choiceLabel, mindMonitorDisplay, parsedTurnNarrative, renderChoices, renderHistory, renderNarrative, renderState, stateDisplayValues } from '../src/frontend/pages/render.js';
import { clearPending, committedTurn, contextChoices, loadPending, pendingKey, recoveryFor, reservedPlayerSetupId, resolveGameId, saveFromContext, savePending, validateContext } from '../src/frontend/pages/state.js';
import { buildCompanyGameViewModel } from '../src/frontend/pages/view-model.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gameId = '11111111-1111-4111-8111-111111111111';
const storage = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };

class FakeNode {
  constructor(tag) { this.tag = tag; this.children = []; this.className = ''; this.textContent = ''; this.hidden = false; this.disabled = false; this.onclick = null; this.listeners = new Map(); this.value = ''; this.title = ''; this.scrolls = 0; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  scrollIntoView() { this.scrolls += 1; }
}

function pageFixture() {
  const ids = ['game-main', 'game-title', 'day-time', 'turn-number', 'api-status', 'status-banner', 'error-banner', 'story-history', 'current-story', 'current-action', 'choice-list', 'player-action', 'submit-action', 'recovery-action', 'stream-status', 'scene-state', 'focal-character', 'mind-monitor', 'player-situation', 'resume-play', 'open-history', 'send-feedback', 'open-apps', 'reset-game', 'player-setup-overlay', 'player-setup-form', 'setup-error', 'setup-status', 'setup-submit', 'setup-name', 'setup-department', 'setup-position', 'setup-height', 'setup-weight', 'setup-penis-length', 'setup-body-type', 'setup-speech-style', 'reserved-opening', 'reserved-opening-status', 'retry-opening'];
  const nodes = Object.fromEntries(ids.map(id => [id, new FakeNode(id)]));
  return { nodes, documentRef: { querySelector: selector => nodes[selector.slice(1)] ?? null, createElement: tag => new FakeNode(tag) } };
}

function validContext({ turns = [], choices = ['A', 'B', 'C', 'D'] } = {}) {
  return {
    game: { edition_id: 'company-v1', title: '상식개변: 회사편' },
    save: { committed_turn: 2, data: { edition: 'company-v1', save_schema_version: 1, turn_state: { committed_turn: 1 }, last_choices: choices, scene_state: { location_id: 'office' }, world_state: { day: 1, time_block: 'morning' }, csa_active: ['csa-1'], player_setup: { completed: true } } },
    recent_turns: turns
  };
}

async function withFakeDocument(run) {
  const previousDocument = globalThis.document; const fixture = pageFixture(); globalThis.document = fixture.documentRef;
  try { return await run(fixture); } finally { globalThis.document = previousDocument; }
}

test('frontend state resolves game IDs and keeps the external committed turn authoritative', () => {
  const context = validContext();
  assert.equal(resolveGameId(`?game=${gameId}`), gameId);
  assert.equal(resolveGameId('?game=not-a-uuid'), gameId);
  assert.equal(validateContext(context), true);
  assert.equal(saveFromContext(context).edition, 'company-v1');
  assert.equal(committedTurn(context), 2);
  context.save.committed_turn = 'invalid';
  assert.equal(committedTurn(context), 1);
});

test('frontend state preserves pending metadata and committed choice fallback', () => {
  const local = storage();
  const action = { game_id: gameId, action_id: 'action-1', expected_turn: 3, player_action: 'Keep action', created_at: 'now', step: 'story' };
  savePending(local, action);
  assert.deepEqual(loadPending(local, gameId), action);
  clearPending(local, gameId);
  assert.equal(local.getItem(pendingKey(gameId)), null);
  assert.deepEqual(contextChoices({ save: { data: { last_choices: [] } }, recent_turns: [{ choices: ['old'] }, { choices: ['new', '', 'newer'] }] }), ['new', 'newer']);
});

test('Story renderer separates dialogue speaker, direction, and line', () => {
  const previousDocument = globalThis.document; globalThis.document = { createElement: tag => new FakeNode(tag) };
  try {
    const container = new FakeNode('story');
    renderNarrative(container, { blocks: [{ type: 'scene', text: 'Narrative' }, { type: 'dialogue', speaker: 'Hayeon', direction: 'quietly', text: 'Dialogue' }] });
    assert.equal(container.children[0].className, 'narrative-scene');
    const dialogue = container.children[1];
    assert.equal(dialogue.className.includes('dialogue-card'), true);
    assert.equal(dialogue.children[0].children[0].textContent, 'Hayeon');
    assert.equal(dialogue.children[0].children[1].textContent, 'quietly');
    assert.equal(dialogue.children[1].textContent, 'Dialogue');
  } finally { globalThis.document = previousDocument; }
});

test('history preserves accepted parsed blocks, summaries, and database order', () => {
  const previousDocument = globalThis.document; globalThis.document = { createElement: tag => new FakeNode(tag) };
  try {
    const container = new FakeNode('history');
    renderHistory(container, [
      { player_action: 'Turn 1 action', parsed_blocks: [{ type: 'scene', text: 'Turn 1 story' }], turn_summary: 'Turn 1 summary' },
      { player_action: 'Turn 2 action', parsed_blocks: { blocks: [{ type: 'scene', text: 'Turn 2 story' }] }, turn_summary: 'Turn 2 summary' }
    ]);
    assert.equal(container.children[0].children[0].textContent, 'Turn 1 action');
    assert.equal(container.children[1].children[0].textContent, 'Turn 2 action');
    assert.equal(container.children[0].children[1].children[0].textContent, 'Turn 1 story');
    assert.equal(container.children[1].children[2].textContent, 'Turn 2 summary');
    assert.equal(parsedTurnNarrative({ story_text: 'fallback' }).blocks[0].type, 'unparsed');
  } finally { globalThis.document = previousDocument; }
});

test('Mind Monitor displays only surface and latent consciousness', () => {
  const entries = mindMonitorDisplay({ 표면의식: 'calm', 잠재의식: 'curious', body: 'hidden', physical: 'hidden', body_reaction: 'hidden' });
  assert.deepEqual(entries, [['표면의식', 'calm'], ['잠재의식', 'curious']]);
  assert.equal(JSON.stringify(entries).includes('hidden'), false);
});

test('view-model renderer preserves identity, image ID, current Extract, and immutable inputs', () => {
  const context = validContext({ turns: [{ mind_monitor: { source: 'turn' }, parsed_blocks: { player_status: 'ready' } }] });
  context.save.data.last_image_id = 123;
  context.save.data.focal_character_id = 'npc-hayeon';
  context.save.data.last_speaker_id = 'npc-areum';
  const runtime = { currentExtract: { mind_monitor: { source: 'extract' } } };
  const contextSnapshot = structuredClone(context), runtimeSnapshot = structuredClone(runtime);
  const model = buildCompanyGameViewModel(context, runtime);
  assert.equal(model.turn.committed_turn, 2);
  assert.equal(model.media.image_id, 123);
  assert.equal(model.focal_character.id, 'npc-hayeon');
  assert.equal(model.focal_character.last_speaker_id, 'npc-areum');
  assert.deepEqual(model.media.mind_monitor, { source: 'extract' });
  assert.deepEqual(context, contextSnapshot);
  assert.deepEqual(runtime, runtimeSnapshot);
});

test('renderer uses view-model choices, short labels, and full choice payloads', () => {
  const model = buildCompanyGameViewModel(validContext());
  const longChoice = '12345678901234567890123456789012345';
  assert.deepEqual(choicesForRenderer(model), model.story.choices);
  assert.deepEqual(choicesForRenderer(model, ['one', 'two', 'three', 'four']), ['one', 'two', 'three', 'four']);
  assert.deepEqual(choicesForRenderer(model, ['incomplete']), model.story.choices);
  assert.equal(choiceLabel(longChoice).length <= 31, true);
  const previousDocument = globalThis.document; globalThis.document = { createElement: tag => new FakeNode(tag) };
  try {
    const container = new FakeNode('choices'); let chosen = null;
    renderChoices(container, [longChoice], { onChoose: value => { chosen = value; } });
    assert.equal(container.children[0].title, longChoice);
    container.children[0].listeners.get('click')();
    assert.equal(chosen, longChoice);
  } finally { globalThis.document = previousDocument; }
});

test('reconnect renders the latest Story and choices and resume makes no API call', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const context = validContext({ turns: [{ player_action: 'Previous action', story_text: 'fallback', parsed_blocks: { blocks: [{ type: 'scene', text: 'Latest Story' }] }, choices: ['turn A', 'turn B'], mind_monitor: { 표면의식: 'steady' } }] });
    const snapshot = structuredClone(context); let contextCalls = 0, statusCalls = 0;
    const api = { context: async () => { contextCalls += 1; return { context }; }, actionStatus: async () => { statusCalls += 1; return {}; } };
    const app = createFrontendApp({ documentRef, storage: storage(), api }); await app.init();
    assert.equal(nodes['story-history'].children[0].children[1].children[0].textContent, 'Latest Story');
    assert.equal(nodes['choice-list'].children.length, 4);
    assert.equal(nodes['resume-play'].disabled, false);
    assert.equal(nodes['day-time'].textContent, 'Day 1 · morning');
    assert.equal(nodes['open-history'].disabled, true);
    assert.equal(nodes['open-history'].onclick, null);
    app.resumePlay();
    assert.equal(contextCalls, 1); assert.equal(statusCalls, 0);
    assert.deepEqual(context, snapshot);
  });
});

test('a reloaded reserved setup retries the same opening without a second player-setup request, then closes the modal for Turn 1 choices', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const reserved = validContext({ choices: [] });
    reserved.save.data.player_setup = { version: 1, setup_id: 'reserved-setup', status: 'reserved', completed: false };
    reserved.save.data.opening_state = { setup_id: 'reserved-setup', status: 'planned', plan: { weekday: '월요일' } };
    const completed = structuredClone(reserved);
    completed.save.data.player_setup = { ...completed.save.data.player_setup, status: 'complete', completed: true };
    completed.save.data.opening_state = { ...completed.save.data.opening_state, status: 'complete', story_text: 'Opening story', choices: ['A', 'B', 'C', 'D'] };
    completed.save.data.last_choices = ['A', 'B', 'C', 'D'];
    let openingCalls = 0, playerSetupCalls = 0, useCompleted = false;
    const api = {
      context: async () => ({ context: useCompleted ? completed : reserved }),
      actionStatus: async () => ({}),
      playerSetup: async () => { playerSetupCalls += 1; throw new Error('must not create a new setup'); },
      opening: async ({ setup_id }) => {
        openingCalls += 1;
        assert.equal(setup_id, 'reserved-setup');
        useCompleted = true;
        return new Response('event: delta\ndata: {"text":"Opening story"}\n\nevent: complete\ndata: {}\n\n', { headers: { 'content-type': 'text/event-stream' } });
      }
    };
    const app = createFrontendApp({ documentRef, storage: storage(), api });
    await app.init();
    assert.equal(reservedPlayerSetupId(app.context), 'reserved-setup');
    assert.equal(nodes['player-setup-form'].hidden, true);
    assert.equal(nodes['reserved-opening'].hidden, false);

    await nodes['retry-opening'].onclick();
    assert.equal(openingCalls, 1);
    assert.equal(playerSetupCalls, 0);
    assert.equal(nodes['player-setup-overlay'].hidden, true);
    assert.equal(nodes['player-action'].disabled, false);
    assert.equal(nodes['choice-list'].children.length, 4);
  });
});

test('a failed opening retry surfaces the error in the shared setup area, keeps the reserved section active, and never calls player-setup again', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const reserved = validContext({ choices: [] });
    reserved.save.data.player_setup = { version: 1, setup_id: 'reserved-setup', status: 'reserved', completed: false };
    reserved.save.data.opening_state = { setup_id: 'reserved-setup', status: 'planned', plan: { weekday: '월요일' } };
    let openingCalls = 0, playerSetupCalls = 0;
    const api = {
      context: async () => ({ context: reserved }),
      actionStatus: async () => ({}),
      playerSetup: async () => { playerSetupCalls += 1; throw new Error('must not create a new setup'); },
      opening: async ({ setup_id }) => {
        openingCalls += 1;
        assert.equal(setup_id, 'reserved-setup');
        throw new ApiError({ endpoint: '/api/opening', status: 502, code: 'opening_failed', message: '오프닝 생성에 실패했습니다.' });
      }
    };
    const app = createFrontendApp({ documentRef, storage: storage(), api });
    await app.init();
    assert.equal(nodes['player-setup-form'].hidden, true);
    assert.equal(nodes['reserved-opening'].hidden, false);

    await nodes['retry-opening'].onclick();

    assert.equal(openingCalls, 1);
    assert.equal(playerSetupCalls, 0);
    assert.equal(nodes['setup-error'].hidden, false);
    assert.equal(nodes['setup-error'].textContent, '오프닝 생성에 실패했습니다.');
    assert.equal(nodes['player-setup-form'].hidden, true);
    assert.equal(nodes['reserved-opening'].hidden, false);
    assert.equal(nodes['retry-opening'].disabled, false);
    assert.equal(reservedPlayerSetupId(app.context), 'reserved-setup');
  });
});

test('a failed new player-setup submission shows the error in the shared setup area and preserves the entered values', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const fresh = validContext({ choices: [] });
    delete fresh.save.data.player_setup;
    let playerSetupCalls = 0;
    const api = {
      context: async () => ({ context: fresh }),
      actionStatus: async () => ({}),
      playerSetup: async () => { playerSetupCalls += 1; throw new ApiError({ endpoint: '/api/player-setup', status: 400, code: 'invalid_player_setup', message: '입력값을 확인해 주세요.' }); }
    };
    const app = createFrontendApp({ documentRef, storage: storage(), api });
    await app.init();
    assert.equal(nodes['player-setup-overlay'].hidden, false);
    nodes['setup-name'].value = '김하늘';
    nodes['setup-department'].value = 'brand_strategy';
    nodes['setup-position'].value = 'intern';
    nodes['setup-height'].value = '170';
    nodes['setup-weight'].value = '65';
    nodes['setup-penis-length'].value = '13';
    nodes['setup-body-type'].value = 'balanced';
    nodes['setup-speech-style'].value = 'polite';

    await nodes['player-setup-form'].listeners.get('submit')();

    assert.equal(playerSetupCalls, 1);
    assert.equal(nodes['setup-error'].hidden, false);
    assert.equal(nodes['setup-error'].textContent, '입력값을 확인해 주세요.');
    assert.equal(nodes['setup-name'].value, '김하늘');
    assert.equal(nodes['setup-height'].value, '170');
    assert.equal(nodes['setup-weight'].value, '65');
    assert.equal(nodes['player-setup-overlay'].hidden, false);
  });
});

test('pending action keeps recovery UI ahead of resume and preserves recovery endpoint behavior', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const local = storage(); const pending = { game_id: gameId, action_id: 'saved-action', expected_turn: 4, player_action: 'Saved action', created_at: 'now', step: 'story' }; savePending(local, pending);
    const api = { context: async () => ({ context: validContext() }), actionStatus: async () => ({ recoverable_step: 'retry_story' }) };
    const app = createFrontendApp({ documentRef, storage: local, api }); await app.init();
    assert.equal(nodes['recovery-action'].hidden, false);
    assert.equal(nodes['resume-play'].disabled, true);
    assert.equal(nodes['player-action'].disabled, true);
    assert.equal(typeof nodes['recovery-action'].onclick, 'function');
  });
});

test('action_not_found blocks a new action and exposes retry_story recovery', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const local = storage(); savePending(local, { game_id: gameId, action_id: 'saved', expected_turn: 3, player_action: 'Saved action', created_at: 'now', step: 'story' });
    let storyCalls = 0;
    const api = {
      context: async () => ({ context: validContext() }),
      actionStatus: async () => { throw new ApiError({ endpoint: '/api/action-status', status: 404, code: 'action_not_found', message: 'missing' }); },
      story: async () => { storyCalls += 1; return new Response(); }
    };
    const app = createFrontendApp({ documentRef, storage: local, api }); await app.init();
    assert.equal(nodes['recovery-action'].hidden, false);
    assert.equal(await app.startNewAction('New action'), false);
    assert.equal(storyCalls, 0);
    assert.equal(loadPending(local, gameId).action_id, 'saved');
  });
});

test('complete recovery clears pending UI and re-enables controls', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const local = storage(); savePending(local, { game_id: gameId, action_id: 'done', expected_turn: 3, player_action: 'Done', created_at: 'now', step: 'commit' });
    const api = { context: async () => ({ context: validContext() }), actionStatus: async () => ({ recoverable_step: 'complete' }) };
    const app = createFrontendApp({ documentRef, storage: local, api }); await app.init();
    assert.equal(loadPending(local, gameId), null);
    assert.equal(nodes['recovery-action'].hidden, true);
    assert.equal(nodes['player-action'].disabled, false);
  });
});

test('turn coordinator retains Story, Extract, Commit and recovery action IDs', async () => {
  const calls = []; const local = storage(); let refreshes = 0;
  const api = {
    story: async body => { calls.push(['story', body]); return new Response(); },
    extract: async body => { calls.push(['extract', body]); return { extract: { choices: [], mind_monitor: {} } }; },
    commit: async body => { calls.push(['commit', body]); return { commit: { success: true } }; }
  };
  const coordinator = createTurnCoordinator({
    api, storage: local, gameId, getContext: () => validContext(), refreshContext: async () => { refreshes += 1; }, createActionId: () => 'fixed-action',
    consumeStory: async (_response, onEvent) => { onEvent({ event: 'meta', data: {} }); onEvent({ event: 'delta', data: { text: '[SCENE] Story' } }); }
  });
  await coordinator.startNewAction('Keep action');
  assert.deepEqual(calls.map(([name]) => name), ['story', 'extract', 'commit']);
  assert.deepEqual(calls[0][1], { game_id: gameId, action_id: 'fixed-action', expected_turn: 3, player_action: 'Keep action' });
  assert.deepEqual(calls[2][1], { game_id: gameId, action_id: 'fixed-action', expected_turn: 3 });
  assert.equal(refreshes, 1);
  calls.length = 0;
  await coordinator.runRecovery({ game_id: gameId, action_id: 'recover', expected_turn: 7, player_action: 'Recover', step: 'commit' }, 'resume_commit');
  assert.deepEqual(calls.map(([name]) => name), ['commit']);
});

test('busy guard admits one operation and toolbar capabilities do not invent endpoints', async () => {
  const states = []; const guard = createBusyGuard({ onChange: value => states.push(value) });
  let nested; await guard.run(async () => { nested = await guard.run(async () => true); });
  assert.equal(nested, false); assert.deepEqual(states, [true, false]);
  assert.deepEqual(toolbarCapabilities({ turn: { committed_turn: 2 } }, null), { canResume: true, canOpenHistory: false, canSendFeedback: false, canOpenApps: false });
  assert.equal(toolbarCapabilities({ turn: { committed_turn: 2 } }, { action_id: 'pending' }).canResume, false);
  assert.equal(recoveryFor({ recoverable_step: 'resume_commit' }), 'resume_commit');
  assert.equal(loadPending(storage(), gameId), null);
  assert.equal(pendingKey(gameId).includes(gameId), true);
  clearPending(storage(), gameId);
});

test('state and shell keep renderer free of raw Context fallback and developer panels', () => {
  const pages = path.join(root, 'src/frontend/pages');
  const html = fs.readFileSync(path.join(pages, 'index.html'), 'utf8');
  const appSource = fs.readFileSync(path.join(pages, 'app.js'), 'utf8');
  const renderSource = fs.readFileSync(path.join(pages, 'render.js'), 'utf8');
  assert.match(html, /id="game-title">상식개변: 회사편/);
  assert.doesNotMatch(html, /COMPANY V1|게임빌더|Warnings|warning-list/);
  assert.match(appSource, /buildCompanyGameViewModel\(context/);
  assert.doesNotMatch(appSource, /contextChoices/);
  assert.doesNotMatch(renderSource, /context\?\.save|save\?\.data/);
  assert.equal(html.indexOf('id="story-panel"') < html.indexOf('id="character-state"'), true);
  assert.equal(html.indexOf('id="character-state"') < html.indexOf('id="player-panel"'), true);
  assert.equal(html.indexOf('id="player-panel"') < html.indexOf('id="choice-list"'), true);
  // setup-error must be a shared sibling of the form and the reserved-opening section, not nested
  // inside the form, so it stays visible while the form is hidden during a reserved-opening retry.
  assert.equal(html.indexOf('id="setup-error"') < html.indexOf('id="player-setup-form"'), true);
  assert.equal(html.indexOf('id="player-setup-form"') < html.indexOf('id="reserved-opening"'), true);
  assert.equal(html.indexOf('id="choice-list"') < html.indexOf('class="utility-toolbar"'), true);
  const values = stateDisplayValues(buildCompanyGameViewModel(validContext()));
  assert.equal(Object.values(values).some(value => value.includes('[object Object]')), false);
});
