import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { choicesForRenderer, createBusyGuard, createFrontendApp, createTurnCoordinator, reduceStoryWireProjection, toolbarCapabilities } from '../src/frontend/pages/app.js';
import { ApiError } from '../src/frontend/pages/api.js';
import { choiceLabel, mindMonitorDisplay, parsedTurnNarrative, renderChoices, renderHistory, renderNarrative, renderState, stateDisplayValues } from '../src/frontend/pages/render.js';
import { clearPending, committedTurn, contextChoices, loadPending, pendingKey, recoveryFor, reservedPlayerSetupId, resolveGameId, saveFromContext, savePending, validateContext } from '../src/frontend/pages/state.js';
import { buildCompanyGameViewModel } from '../src/frontend/pages/view-model.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gameId = '11111111-1111-4111-8111-111111111111';
const storage = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };

class FakeNode {
  constructor(tag) { this.tag = tag; this.children = []; this.className = ''; this.textContent = ''; this.hidden = false; this.disabled = false; this.onclick = null; this.listeners = new Map(); this.value = ''; this.title = ''; this.scrolls = 0; this.scrollHeight = 0; this.scrollTop = 0; this.clientHeight = 0; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  scrollIntoView() { this.scrolls += 1; }
}

function pageFixture() {
  const ids = ['game-main', 'game-title', 'day-time', 'turn-number', 'api-status', 'status-banner', 'error-banner', 'story-history', 'current-story', 'current-action', 'choice-list', 'player-action', 'submit-action', 'recovery-action', 'stream-status', 'scene-state', 'focal-character', 'mind-monitor', 'player-situation', 'resume-play', 'open-history', 'send-feedback', 'open-apps', 'reset-game', 'player-setup-overlay', 'player-setup-form', 'setup-error', 'setup-status', 'setup-submit', 'setup-name', 'setup-department', 'setup-position', 'setup-age', 'setup-height', 'setup-weight', 'setup-penis-length', 'setup-body-type', 'setup-speech-style', 'reserved-opening', 'reserved-opening-status', 'retry-opening'];
  const nodes = Object.fromEntries(ids.map(id => [id, new FakeNode(id)]));
  return { nodes, documentRef: { querySelector: selector => nodes[selector.slice(1)] ?? null, createElement: tag => new FakeNode(tag) } };
}

function validContext({ turns = [], choices = ['A', 'B', 'C', 'D'] } = {}) {
  return {
    game: { edition_id: 'company-v1', title: '상식개변: 회사편' },
    save: { committed_turn: 2, data: { edition: 'company-v1', save_schema_version: 1, turn_state: { committed_turn: 1 }, last_choices: choices, scene_state: { location_id: 'office' }, world_state: { day: 1, time_block: 'morning', game_time: { day: 1, minute_of_day: 742 } }, csa_active: ['csa-1'], player_setup: { completed: true } } },
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

test('renderer uses view-model choices, short labels, and full choice payloads', () => {
  const model = buildCompanyGameViewModel(validContext());
  const longChoice = '12345678901234567890123456789012345';
  assert.deepEqual(choicesForRenderer(model), model.story.choices);
  assert.deepEqual(choicesForRenderer(model, ['one', 'two', 'three', 'four']), ['one', 'two', 'three', 'four']);
  assert.deepEqual(choicesForRenderer(model, ['incomplete']), []);
  assert.deepEqual(choicesForRenderer(model, null), []);
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
    assert.equal(nodes['day-time'].textContent, 'Day 1 · 12:22');
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
        return new Response('event: delta\ndata: {"text":"Opening story"}\n\nevent: complete\ndata: {"choices":["Top A","Top B","Top C","Top D"]}\n\n', { headers: { 'content-type': 'text/event-stream' } });
      }
    };
    const app = createFrontendApp({ documentRef, storage: storage(), api });
    await app.init();
    // reserved 정상 흐름: init이 자동으로 오프닝을 재시도하고 오버레이 없이 완료한다
    assert.equal(openingCalls, 1);
    assert.equal(playerSetupCalls, 0);
    assert.equal(nodes['player-setup-overlay'].hidden, true);
    assert.equal(nodes['player-action'].disabled, false);
    assert.equal(nodes['current-story'].children.length, 0, 'canonical opening history replaces transient current-story');
    assert.equal(nodes['choice-list'].children.length, 4);
    assert.equal(nodes['choice-list'].children[0].title, 'Top A', 'opening complete top-level choices are preferred');
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
    // 자동 재시도 실패 → 오버레이에 에러 + 설정 폼(설정완료) 표시
    assert.equal(openingCalls, 1);
    assert.equal(playerSetupCalls, 0);
    assert.equal(nodes['setup-error'].hidden, false);
    assert.equal(nodes['setup-error'].textContent, '오프닝 생성에 실패했습니다.');
    assert.equal(nodes['player-setup-overlay'].hidden, false);
    assert.equal(nodes['player-setup-form'].hidden, false);
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
    nodes['setup-age'].value = '30';
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

test('pending action은 reconnect hint — 이어받기 중에도 입력은 활성이고 제출만 잠시 비활성화된다', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const local = storage(); const pending = { game_id: gameId, action_id: 'saved-action', expected_turn: 4, player_action: 'Saved action', created_at: 'now', step: 'story' }; savePending(local, pending);
    const api = { context: async () => ({ context: validContext() }), actionStatus: async () => ({ recoverable_step: 'retry_story' }), story: async () => new Response('event: meta\ndata: {}\n\nevent: delta\ndata: {"text":"[SCENE] 재개된 서사"}\n\nevent: complete\ndata: {}\n\n', { headers: { 'content-type': 'text/event-stream' } }), extract: async () => ({ extract: { choices: [], mind_monitor: {} } }), commit: async () => ({ commit: { success: true } }) };
    const app = createFrontendApp({ documentRef, storage: local, api }); await app.init();
    // init은 checkRecovery를 기다리지 않는다 — 페이지 시작이 막히지 않는다
    assert.equal(nodes['recovery-action'].hidden, true);
    assert.equal(nodes['recovery-action'].onclick, null);
    // 이어받기(백그라운드 재개) 중에도 다음 행동 초안은 입력 가능, 제출만 비활성화
    assert.equal(nodes['player-action'].disabled, false, '재개 중에도 입력 활성');
    assert.equal(nodes['submit-action'].disabled, true, '제출만 잠시 비활성화');
    // 재개 완료 대기 → pending 정리·제출 활성
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(loadPending(local, gameId), null, '재개 완료 후 pending 삭제');
    assert.equal(nodes['submit-action'].disabled, false, '재개 완료 후 제출 활성');
    assert.equal(nodes['player-action'].disabled, false, '재개 완료 후 입력 활성');
  });
});

test('stale pending(committed·expected_turn 지남)은 startNewAction에서 자동 정리되고 같은 클릭으로 새 행동이 시작된다', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const local = storage();
    savePending(local, { game_id: gameId, action_id: 'done-37', expected_turn: 37, player_action: '이전 행동', created_at: 'now', step: 'commit' });
    const context = validContext();
    context.save.committed_turn = 37; // pending.expected_turn(37) <= committed(37) → stale
    let storyCalls = 0;
    const api = {
      context: async () => ({ context }),
      actionStatus: async () => ({ processing_status: 'committed', recoverable_step: 'complete' }),
      story: async () => { storyCalls += 1; return new Response('event: meta\ndata: {}\n\nevent: delta\ndata: {"text":"[SCENE] 새 행동 서사"}\n\nevent: complete\ndata: {}\n\n', { headers: { 'content-type': 'text/event-stream' } }); },
      extract: async () => ({ extract: { choices: [], mind_monitor: {} } }),
      commit: async () => ({ commit: { success: true } })
    };
    const app = createFrontendApp({ documentRef, storage: local, api });
    await app.refreshContext(); // init 없이 context만 설정 (checkRecovery 우회)
    assert.equal(loadPending(local, gameId)?.action_id, 'done-37', '검증 전 stale pending 존재');
    assert.equal(await app.startNewAction('새 행동'), true, '같은 클릭에서 새 행동 시작 (두 번 누르지 않음)');
    assert.equal(loadPending(local, gameId), null, 'stale pending 자동 삭제');
    assert.equal(storyCalls, 1, '새 행동 스토리가 같은 클릭에서 실행');
    assert.equal(nodes['error-banner'].textContent, '', '오류 표시 없음');
  });
});

test('commit_failed + expected_turn_conflict pending은 startNewAction에서 정리되고 action_not_found도 동일 처리', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const local = storage();
    savePending(local, { game_id: gameId, action_id: 'orphan', expected_turn: 37, player_action: '고아 행동', created_at: 'now', step: 'commit' });
    const context = validContext();
    context.save.committed_turn = 40;
    let storyCalls = 0;
    const api = {
      context: async () => ({ context }),
      actionStatus: async () => ({ processing_status: 'commit_failed', error_code: 'expected_turn_conflict', recoverable_step: 'retry_commit' }),
      story: async () => { storyCalls += 1; return new Response('event: meta\ndata: {}\n\nevent: delta\ndata: {"text":"[SCENE] 새 서사"}\n\nevent: complete\ndata: {}\n\n', { headers: { 'content-type': 'text/event-stream' } }); },
      extract: async () => ({ extract: { choices: [], mind_monitor: {} } }),
      commit: async () => ({ commit: { success: true } })
    };
    const app = createFrontendApp({ documentRef, storage: local, api });
    await app.refreshContext();
    assert.equal(await app.startNewAction('새 행동'), true);
    assert.equal(loadPending(local, gameId), null, 'commit_failed+expected_turn_conflict pending 삭제');
    assert.equal(storyCalls, 1);
    // action_not_found → 같은 정리 경로
    const local2 = storage();
    savePending(local2, { game_id: gameId, action_id: 'gone', expected_turn: 38, player_action: '사라진 행동', created_at: 'now', step: 'story' });
    const api2 = {
      context: async () => ({ context }),
      actionStatus: async () => { throw new ApiError({ endpoint: '/api/action-status', status: 404, code: 'action_not_found', message: 'missing' }); },
      story: async () => { storyCalls += 1; return new Response('event: meta\ndata: {}\n\nevent: delta\ndata: {"text":"[SCENE] 재시도 서사"}\n\nevent: complete\ndata: {}\n\n', { headers: { 'content-type': 'text/event-stream' } }); },
      extract: async () => ({ extract: { choices: [], mind_monitor: {} } }),
      commit: async () => ({ commit: { success: true } })
    };
    const app2 = createFrontendApp({ documentRef, storage: local2, api: api2 });
    await app2.refreshContext();
    assert.equal(await app2.startNewAction('새 행동'), true, 'action_not_found도 같은 클릭 진행');
    assert.equal(loadPending(local2, gameId), null, 'action_not_found pending 삭제');
    assert.equal(nodes['error-banner'].textContent, '', '오류 표시 없음');
  });
});

test('terminated commit 응답은 pending을 삭제하고 refresh하며 invalid_commit을 발생시키지 않는다', async () => {
  const local = storage(); let refreshes = 0;
  const api = {
    story: async () => new Response(),
    extract: async () => ({ extract: { choices: [], mind_monitor: {} } }),
    commit: async () => ({ commit: { success: false, terminated: true, error: 'expected_turn_conflict' } })
  };
  const coordinator = createTurnCoordinator({
    api, storage: local, gameId, getContext: () => validContext(), refreshContext: async () => { refreshes += 1; }, createActionId: () => 'term-action'
  });
  savePending(local, { game_id: gameId, action_id: 'term-action', expected_turn: 3, player_action: 'T', created_at: 'now', step: 'commit' });
  await coordinator.runRecovery({ game_id: gameId, action_id: 'term-action', expected_turn: 3, player_action: 'T', step: 'commit' }, 'resume_commit');
  assert.equal(loadPending(local, gameId), null, 'terminated → pending 삭제');
  assert.equal(refreshes, 1, 'terminated → context refresh');
  // 최상위 terminated 형태도 동일
  const local2 = storage(); let refreshes2 = 0;
  const api2 = {
    story: async () => new Response(),
    extract: async () => ({ extract: { choices: [], mind_monitor: {} } }),
    commit: async () => ({ terminated: true, commit: { success: false, error: 'expected_turn_conflict' } })
  };
  const coordinator2 = createTurnCoordinator({
    api: api2, storage: local2, gameId, getContext: () => validContext(), refreshContext: async () => { refreshes2 += 1; }, createActionId: () => 'term-action'
  });
  savePending(local2, { game_id: gameId, action_id: 'term-action', expected_turn: 3, player_action: 'T', created_at: 'now', step: 'commit' });
  await coordinator2.runRecovery({ game_id: gameId, action_id: 'term-action', expected_turn: 3, player_action: 'T', step: 'commit' }, 'resume_commit');
  assert.equal(loadPending(local2, gameId), null, '최상위 terminated → pending 삭제');
  assert.equal(refreshes2, 1, '최상위 terminated → context refresh');
});

test('wait_story recovery starts a fresh story exactly once (no recursion deadlock)', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const local = storage(); savePending(local, { game_id: gameId, action_id: 'waiting', expected_turn: 5, player_action: 'Stuck action', created_at: 'now', step: 'story' });
    let storyCalls = 0;
    const api = {
      context: async () => ({ context: validContext() }),
      actionStatus: async () => ({ recoverable_step: 'wait_story' }),
      story: async () => { storyCalls += 1; return new Response('event: meta\ndata: {}\n\nevent: delta\ndata: {"text":"[SCENE] 재개된 서사"}\n\nevent: complete\ndata: {}\n\n', { headers: { 'content-type': 'text/event-stream' } }); },
      extract: async () => ({ extract: { choices: [], mind_monitor: {} } }),
      commit: async () => ({ commit: { success: true } })
    };
    const app = createFrontendApp({ documentRef, storage: local, api }); await app.init();
    // 좌초(story_streaming) 액션은 새 스토리 1회로 백그라운드 재개된다 — 무한 왕복 없이 1회
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(storyCalls, 1);
    assert.equal(loadPending(local, gameId), null);
    assert.equal(nodes['player-action'].disabled, false);
    assert.equal(await app.startNewAction('New action'), true);
  });
});

test('complete recovery clears pending UI and re-enables controls', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const local = storage(); savePending(local, { game_id: gameId, action_id: 'done', expected_turn: 3, player_action: 'Done', created_at: 'now', step: 'commit' });
    const api = { context: async () => ({ context: validContext() }), actionStatus: async () => ({ recoverable_step: 'complete' }) };
    const app = createFrontendApp({ documentRef, storage: local, api }); await app.init();
    // init 비차단 — 백그라운드 정리 완료 대기
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(loadPending(local, gameId), null);
    assert.equal(nodes['recovery-action'].hidden, true);
    assert.equal(nodes['player-action'].disabled, false);
  });
});

test('turn coordinator retains Story, Extract, Commit and recovery action IDs', async () => {
  const calls = []; const storyEvents = []; const local = storage(); let refreshes = 0;
  const api = {
    story: async body => { calls.push(['story', body]); return new Response(); },
    extract: async body => { calls.push(['extract', body]); return { extract: { choices: [], mind_monitor: {} } }; },
    commit: async body => { calls.push(['commit', body]); return { commit: { success: true } }; }
  };
  const coordinator = createTurnCoordinator({
    api, storage: local, gameId, getContext: () => validContext(), refreshContext: async () => { refreshes += 1; }, createActionId: () => 'fixed-action',
    onStory: event => storyEvents.push(event),
    consumeStory: async (_response, onEvent) => { onEvent({ event: 'meta', data: {} }); onEvent({ event: 'delta', data: { text: '[SCENE] Story' } }); }
  });
  await coordinator.startNewAction('Keep action');
  assert.deepEqual(calls.map(([name]) => name), ['story', 'extract', 'commit']);
  assert.deepEqual(calls[0][1], { game_id: gameId, action_id: 'fixed-action', expected_turn: 3, player_action: 'Keep action' });
  assert.deepEqual(calls[2][1], { game_id: gameId, action_id: 'fixed-action', expected_turn: 3 });
  assert.equal(refreshes, 1);
  const deltaEvent = storyEvents.find(event => event.item?.event === 'delta');
  assert.equal(deltaEvent.text, '[SCENE] Story');
  assert.equal(deltaEvent.parsed, undefined, 'delta does not run the parser');
  calls.length = 0;
  await coordinator.runRecovery({ game_id: gameId, action_id: 'recover', expected_turn: 7, player_action: 'Recover', step: 'commit' }, 'resume_commit');
  assert.deepEqual(calls.map(([name]) => name), ['commit']);
});

test('frontend keeps adjacent ACTING on the prior dialogue and clears it at a new block', () => {
  let state = reduceStoryWireProjection({}, { event: 'block_start', data: { block_type: 'dialogue', speaker_id: 'heroine2', speaker_name: '윤민아' } });
  state = reduceStoryWireProjection(state, { event: 'delta', data: { text: '네.' } });
  state = reduceStoryWireProjection(state, { event: 'block_end', data: { block_type: 'dialogue' } });
  state = reduceStoryWireProjection(state, { event: 'acting', data: { acting_direction: '당황하며' } });
  assert.equal(state.blocks[0].acting_direction, '당황하며');
  state = reduceStoryWireProjection(state, { event: 'block_start', data: { block_type: 'scene' } });
  state = reduceStoryWireProjection(state, { event: 'acting', data: { acting_direction: '잘못된 귀속' } });
  assert.equal(state.blocks[0].acting_direction, '당황하며');
  assert.equal(state.blocks[1].acting_direction, null);
});

test('frontend bottom choices require canonical four distinct literals', () => {
  const model = buildCompanyGameViewModel(validContext());
  assert.deepEqual(choicesForRenderer(model, ['same', 'same', 'same', 'same']), []);
  assert.deepEqual(choicesForRenderer(model, ['one', 'two', 'three']), []);
  assert.deepEqual(choicesForRenderer(model, ['one', 'two', 'three', 'four']), ['one', 'two', 'three', 'four']);
  assert.deepEqual(choicesForRenderer(model, null), []);
});

test('turn coordinator preserves canonical structured action through pending, Story, Extract, Commit, and recovery', async () => {
  const canonicalAction = {
    type: 'app_transaction',
    version: 1,
    operations: [{ operation: 'activate', id: 'csa_1' }]
  };
  const calls = [];
  const pendingSnapshots = [];
  const api = {
    story: async body => { calls.push(['story', body]); return new Response('story'); },
    extract: async body => { calls.push(['extract', body]); return { extract: {} }; },
    commit: async body => { calls.push(['commit', body]); return { commit: { success: true } }; }
  };
  const coordinator = createTurnCoordinator({
    api,
    storage: storage(),
    gameId,
    getContext: () => validContext(),
    refreshContext: async () => {},
    createActionId: () => 'canonical-action',
    onPendingChange: pending => pendingSnapshots.push(pending && structuredClone(pending)),
    consumeStory: async (_response, onEvent) => {
      onEvent({ event: 'meta', data: { action_id: 'canonical-action' } });
      onEvent({ event: 'delta', data: { text: 'Story' } });
      onEvent({ event: 'complete', data: {} });
    }
  });
  await coordinator.startNewAction('Do it', canonicalAction);
  assert.deepEqual(pendingSnapshots.find(Boolean)?.structured_action, canonicalAction);
  for (const [, body] of calls) assert.deepEqual(body.structured_action, canonicalAction);
  assert.equal(pendingSnapshots.at(-1), null, 'successful Commit clears pending');

  const recoveredCalls = [];
  const recoveryApi = {
    story: async body => { recoveredCalls.push(['story', body]); return new Response('story'); },
    extract: async body => { recoveredCalls.push(['extract', body]); return { extract: {} }; },
    commit: async body => { recoveredCalls.push(['commit', body]); return { commit: { success: true } }; }
  };
  const recoveryPending = { game_id: gameId, action_id: 'recovery-action', expected_turn: 3, player_action: 'Recover', structured_action: canonicalAction, step: 'story' };
  const recovery = createTurnCoordinator({
    api: recoveryApi, storage: storage(), gameId, getContext: () => validContext(), refreshContext: async () => {},
    consumeStory: async (_response, onEvent) => {
      onEvent({ event: 'meta', data: { action_id: 'recovery-action' } });
      onEvent({ event: 'delta', data: { text: 'Story' } });
      onEvent({ event: 'complete', data: {} });
    }
  });
  await recovery.runRecovery({ ...recoveryPending }, 'resume_story');
  await recovery.runRecovery({ ...recoveryPending, step: 'extract' }, 'resume_extract');
  await recovery.runRecovery({ ...recoveryPending, step: 'commit' }, 'resume_commit');
  assert.equal(recoveredCalls.length, 6);
  for (const [, body] of recoveredCalls) assert.deepEqual(body.structured_action, canonicalAction);
});

test('ordinary free-text coordinator requests omit structured_action at every stage', async () => {
  const calls = [];
  const coordinator = createTurnCoordinator({
    api: {
      story: async body => { calls.push(['story', body]); return new Response('story'); },
      extract: async body => { calls.push(['extract', body]); return { extract: {} }; },
      commit: async body => { calls.push(['commit', body]); return { commit: { success: true } }; }
    },
    storage: storage(), gameId, getContext: () => validContext(), refreshContext: async () => {}, createActionId: () => 'ordinary-action',
    consumeStory: async (_response, onEvent) => {
      onEvent({ event: 'meta', data: {} }); onEvent({ event: 'delta', data: { text: 'Story' } }); onEvent({ event: 'complete', data: {} });
    }
  });
  await coordinator.startNewAction('서류를 정리한다');
  for (const [, body] of calls) assert.equal(Object.hasOwn(body, 'structured_action'), false);
});

test('busy guard admits one operation and toolbar capabilities do not invent endpoints', async () => {
  const states = []; const guard = createBusyGuard({ onChange: value => states.push(value) });
  let nested; await guard.run(async () => { nested = await guard.run(async () => true); });
  assert.equal(nested, false); assert.deepEqual(states, [true, false]);
  const readyContext = { save: { data: { player_setup: { completed: true }, opening_state: { status: 'complete' } } } };
  assert.deepEqual(toolbarCapabilities({ turn: { committed_turn: 2 } }, null, { context: readyContext }), { canResume: true, canOpenHistory: false, canSendFeedback: false, canOpenApps: true });
  assert.equal(toolbarCapabilities({ turn: { committed_turn: 2 } }, { action_id: 'pending' }, { context: readyContext }).canResume, false);
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
  // setup-error must be a shared sibling of the form, not nested inside it,
  // so it stays visible while the form renders.
  assert.equal(html.indexOf('id="setup-error"') < html.indexOf('id="player-setup-form"'), true);
  // reserved-opening(재시도 팝업)은 사용자 요구로 완전히 제거되었다.
  assert.equal(html.includes('id="reserved-opening"'), false);
  assert.equal(html.indexOf('id="choice-list"') < html.indexOf('class="utility-toolbar"'), true);
  const values = stateDisplayValues(buildCompanyGameViewModel(validContext()));
  assert.equal(Object.values(values).some(value => value.includes('[object Object]')), false);
});

test('numbered choice input ("2", "b", "②") resolves to the exact stored choice text before submitting, never the literal digit/letter', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const context = validContext({ choices: ['보고서를 제출한다', '회의에 참석한다', '휴식을 취한다', '상사에게 문의한다'] });
    const calls = [];
    const api = {
      context: async () => ({ context }),
      actionStatus: async () => ({}),
      story: async body => { calls.push(body); return new Response('event: meta\ndata: {}\n\nevent: complete\ndata: {}\n\n', { headers: { 'content-type': 'text/event-stream' } }); },
      extract: async () => ({ extract: { choices: [], mind_monitor: {} } }),
      commit: async () => ({ commit: { success: true } })
    };
    const app = createFrontendApp({ documentRef, storage: storage(), api });
    await app.init();
    nodes['player-action'].value = '2';
    await app.startNewAction();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].player_action, '회의에 참석한다');
  });
});

test('numbered input은 유효한 네 선택지가 없으면 일반 자유 입력으로 처리한다 (턴 차단 금지)', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const context = validContext({ choices: [] });
    let storyCalls = 0; let lastAction = null;
    const api = {
      context: async () => ({ context }),
      actionStatus: async () => ({}),
      story: async body => { storyCalls += 1; lastAction = body.player_action; return new Response('event: meta\ndata: {}\n\nevent: delta\ndata: {"text":"[SCENE] 자유 입력 서사"}\n\nevent: complete\ndata: {}\n\n', { headers: { 'content-type': 'text/event-stream' } }); },
      extract: async () => ({ extract: { choices: [], mind_monitor: {} } }),
      commit: async () => ({ commit: { success: true } })
    };
    const app = createFrontendApp({ documentRef, storage: storage(), api });
    await app.init();
    await app.startNewAction('2');
    assert.equal(storyCalls, 1, '선택지가 없어도 "2"는 자유 입력으로 /api/story에 제출');
    assert.equal(lastAction, '2', '리터럴 "2"가 자유 입력으로 전달');
  });
});

test('ready 상태 pending도 stale — 같은 클릭으로 새 턴이 시작되고 입력이 막히지 않는다', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const local = storage();
    savePending(local, { game_id: gameId, action_id: 'ready-action', expected_turn: 38, player_action: '이전 행동', created_at: 'now', step: 'story' });
    const context = validContext();
    context.save.committed_turn = 37;
    let storyCalls = 0;
    const api = {
      context: async () => ({ context }),
      actionStatus: async () => ({ processing_status: 'ready', recoverable_step: 'complete' }),
      story: async () => { storyCalls += 1; return new Response('event: meta\ndata: {}\n\nevent: delta\ndata: {"text":"[SCENE] 새 행동 서사"}\n\nevent: complete\ndata: {}\n\n', { headers: { 'content-type': 'text/event-stream' } }); },
      extract: async () => ({ extract: { choices: [], mind_monitor: {} } }),
      commit: async () => ({ commit: { success: true } })
    };
    const app = createFrontendApp({ documentRef, storage: local, api });
    await app.refreshContext();
    assert.equal(await app.startNewAction('새 행동'), true, 'ready pending도 같은 클릭에서 새 행동');
    assert.equal(loadPending(local, gameId), null, 'ready pending 삭제');
    assert.equal(storyCalls, 1);
    assert.equal(nodes['error-banner'].textContent, '', '오류 표시 없음');
  });
});

test('Commit 화면 인계: 정본 반영 시 current-story가 저장 카드로 교체되고 다음 입력이 즉시 가능하다', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const context = validContext();
    context.save.committed_turn = 37;
    let turns = [];
    const api = {
      context: async () => ({ context: { ...context, recent_turns: turns } }),
      actionStatus: async () => ({}),
      // story SSE meta가 서버 정본 action_id를 준다 → pending.action_id가 교체되어
      // 이후 commit 인계 확인(최근 턴 action_id 일치)이 성립한다
      story: async () => new Response('event: meta\ndata: {"action_id":"action-41"}\n\nevent: delta\ndata: {"text":"[SCENE] 본문만 있는 서사"}\n\nevent: complete\ndata: {}\n\n', { headers: { 'content-type': 'text/event-stream' } }),
      extract: async () => ({ extract: { choices: [], mind_monitor: {}, turn_summary: '38턴 요약' }, parsed_blocks: { blocks: [] } }),
      commit: async () => {
        // 커밋 후 context refresh가 41턴 정본(recent_turns + action_id 일치)을 반환한다.
        // 세션 기록은 최신 우선이므로 마지막 카드는 40턴이다.
        turns = [
          { turn_number: 41, action_id: 'action-41', player_action: '새 행동', story_text: '[SCENE] 본문', parsed_blocks: { blocks: [] }, turn_summary: '41턴 요약' },
          { turn_number: 40, action_id: 'action-40', player_action: '이전 행동', story_text: '[SCENE] 이전 본문', parsed_blocks: { blocks: [] }, turn_summary: '40턴 요약' }
        ];
        return { commit: { success: true, turn_number: 41 } };
      }
    };
    const app = createFrontendApp({ documentRef, storage: storage(), api });
    await app.refreshContext();
    assert.equal(await app.startNewAction('새 행동'), true);
    // 정본 반영 확인 후에만 current-story를 비운다 — 실시간 Story가 저장 카드로 교체되며 사라지지 않는다
    assert.equal(nodes['current-story'].children.length, 0, '정본 반영 시 current-story 교체');
    const cards = nodes['story-history'].children.filter(child => child.className === 'turn-card');
    assert.equal(cards.length, 2, '41턴과 40턴 카드가 최신 우선으로 렌더');
    assert.equal(cards.at(-1).scrolls, 0, '과거 40턴 카드로 강제 스크롤하지 않음');
    assert.equal(nodes['submit-action'].disabled, false, '다음 입력 즉시 가능');
    assert.equal(nodes['player-action'].disabled, false, '입력 활성');
  });
});
test('commit 성공·실패 모두 입력창을 비우고 실패한 입력을 자동 복원하지 않는다', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    // 성공 경로 — 정상 commit 후 입력창 초기화
    let commitOk = true;
    let storyCalls = 0;
    const api = {
      context: async () => ({ context: validContext() }),
      actionStatus: async () => ({}),
      story: async () => { storyCalls += 1; return new Response('event: meta\ndata: {}\n\nevent: delta\ndata: {"text":"[SCENE] 본문"}\n\nevent: complete\ndata: {}\n\n', { headers: { 'content-type': 'text/event-stream' } }); },
      extract: async () => ({ extract: { choices: ['a', 'b', 'c', 'd'], mind_monitor: {} } }),
      commit: async () => commitOk ? { commit: { success: true, turn_number: 38 } } : (() => { throw new Error('commit 실패'); })()
    };
    const app = createFrontendApp({ documentRef, storage: storage(), api });
    await app.refreshContext();
    nodes['player-action'].value = '민아씨, 확인해 봐요';
    assert.equal(await app.startNewAction('민아씨, 확인해 봐요'), true);
    assert.equal(nodes['player-action'].value, '', '정상 commit 후 입력창 초기화');

    // 실패 경로 — story 실패 시 원래 입력 복원 (지우지 않음)
    const failingApi = {
      context: async () => ({ context: validContext() }),
      actionStatus: async () => ({}),
      story: async () => { throw new Error('upstream fail'); },
      extract: async () => ({ extract: { choices: [], mind_monitor: {} } }),
      commit: async () => ({ commit: { success: true, turn_number: 39 } })
    };
    const app2 = createFrontendApp({ documentRef, storage: storage(), api: failingApi });
    await app2.refreshContext();
    nodes['player-action'].value = '실패해도 남아야 하는 문장';
    await app2.startNewAction('실패해도 남아야 하는 문장');
    assert.equal(nodes['player-action'].value, '', '실패한 입력은 자동 복원하지 않음');
  });
});

test('Story complete uses top-level choices fallback and projects once without page scrolling', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    nodes['current-story'].scrollHeight = 200;
    nodes['current-story'].clientHeight = 100;
    const context = validContext();
    const api = {
      context: async () => ({ context }),
      story: async () => new Response(
        'event: meta\ndata: {}\n\n'
        + 'event: block_start\ndata: {"block_type":"scene"}\n\n'
        + 'event: delta\ndata: {"text":"Raw streaming text"}\n\n'
        + 'event: complete\ndata: {"choices":["A","B","C","D"],"parsed_blocks":{"blocks":[{"type":"scene","text":"Final projection"}]}}\n\n',
        { headers: { 'content-type': 'text/event-stream' } }
      ),
      extract: async () => ({ extract: { choices: [], mind_monitor: {} } }),
      commit: async () => ({ commit: { success: true } })
    };
    const app = createFrontendApp({ documentRef, storage: storage(), api });
    await app.init();
    const initialScrolls = nodes['current-story'].scrolls;
    await app.startNewAction('진행한다');
    assert.equal(nodes['current-story'].children[0].className, 'narrative-scene');
    assert.equal(nodes['current-story'].children[0].textContent, 'Final projection');
    assert.equal(nodes['choice-list'].children.length, 4, 'top-level complete choices are rendered');
    assert.equal(nodes['current-story'].scrolls, initialScrolls, 'streaming never calls page scrollIntoView');
    assert.equal(nodes['current-story'].scrollTop, nodes['current-story'].scrollHeight, 'near-bottom stream scrolls only its container');
  });
});

test('streaming preserves a reader scroll position and never calls scrollIntoView', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    nodes['current-story'].scrollHeight = 1000;
    nodes['current-story'].scrollTop = 100;
    nodes['current-story'].clientHeight = 100;
    const context = validContext();
    const api = {
      context: async () => ({ context }),
      story: async () => new Response(
        'event: meta\ndata: {}\n\n'
        + 'event: delta\ndata: {"text":"[SCENE] New text"}\n\n'
        + 'event: complete\ndata: {"parsed_blocks":{"blocks":[{"type":"scene","text":"New text"}]}}\n\n',
        { headers: { 'content-type': 'text/event-stream' } }
      ),
      extract: async () => ({ extract: { choices: [], mind_monitor: {} } }),
      commit: async () => ({ commit: { success: true } })
    };
    const app = createFrontendApp({ documentRef, storage: storage(), api });
    await app.init();
    const initialScrolls = nodes['current-story'].scrolls;
    await app.startNewAction('진행한다');
    assert.equal(nodes['current-story'].scrolls, initialScrolls);
    assert.equal(nodes['current-story'].scrollTop, 100);
  });
});
