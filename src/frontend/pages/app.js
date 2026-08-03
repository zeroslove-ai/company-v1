import { createApiClient, ApiError } from './api.js';
import { FRONTEND_CONFIG } from './config.js';
import { parseNarrative } from './narrative.js';
import { renderChoices, renderHistory, renderNarrative, renderState, text } from './render.js';
import { consumeStorySse } from './sse.js';
import { clearPending, committedTurn, contextChoices, loadPending, recoveryFor, resolveGameId, savePending, validateContext } from './state.js';

const recoveryLabels = {
  retry_story: 'Story 다시 시도', resume_extract: 'Extract 이어서 실행', retry_extract: 'Extract 다시 시도',
  resume_commit: 'Commit 이어서 실행', retry_commit: 'Commit 다시 시도', wait_story: '상태 다시 확인', unknown: '복구 상태 다시 확인'
};

function newActionId() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`; }
function messageFor(error) {
  if (error instanceof ApiError) return error.code === 'turn_conflict' ? '턴 충돌이 발생했습니다. 현재 상태를 다시 불러오세요.' : error.message;
  return '예상하지 못한 오류가 발생했습니다.';
}

export function createTurnCoordinator({ api, storage, gameId, getContext, refreshContext, onStory, onExtract, onCommitStart, onCommitted, createActionId = newActionId, consumeStory = consumeStorySse }) {
  async function runCommitForPending(pending) {
    pending.step = 'commit'; savePending(storage, pending);
    onCommitStart?.();
    const committed = await api.commit({ game_id: pending.game_id, action_id: pending.action_id, expected_turn: pending.expected_turn });
    if (committed.commit?.success !== true) throw new ApiError({ endpoint: '/api/commit', status: 502, code: 'invalid_commit', message: '턴 저장 결과가 올바르지 않습니다.' });
    clearPending(storage, pending.game_id); await refreshContext(); onCommitted?.(committed); return committed;
  }

  async function runExtractForPending(pending) {
    pending.step = 'extract'; savePending(storage, pending);
    const extracted = await api.extract({ game_id: pending.game_id, action_id: pending.action_id });
    onExtract?.(extracted); pending.step = 'commit'; savePending(storage, pending);
    return runCommitForPending(pending);
  }

  async function runStoryForPending(pending) {
    pending.step = 'story'; savePending(storage, pending);
    let rawStory = '', sawMeta = false;
    const response = await api.story({ game_id: pending.game_id, action_id: pending.action_id, expected_turn: pending.expected_turn, player_action: pending.player_action });
    await consumeStory(response, item => {
      if (item.event === 'meta') sawMeta = true;
      if (item.event === 'delta') { rawStory += item.data?.text ?? ''; onStory?.({ rawStory, parsed: parseNarrative(rawStory), item, pending }); }
    });
    if (!sawMeta || !rawStory.trim()) throw new ApiError({ endpoint: '/api/story', status: 502, code: 'incomplete_story_stream', message: '서사 스트림이 불완전합니다.', retryable: true });
    pending.step = 'extract'; savePending(storage, pending);
    return runExtractForPending(pending);
  }

  async function startNewAction(playerAction) {
    const action = String(playerAction ?? '').trim(); const context = getContext();
    if (!action || !context) return null;
    const pending = { game_id: gameId, action_id: createActionId(), expected_turn: committedTurn(context) + 1, player_action: action, created_at: new Date().toISOString(), step: 'story' };
    savePending(storage, pending); return runStoryForPending(pending);
  }

  async function runRecovery(pending, step) {
    if (step === 'retry_story') return runStoryForPending(pending);
    if (step === 'resume_extract' || step === 'retry_extract') return runExtractForPending(pending);
    if (step === 'resume_commit' || step === 'retry_commit') return runCommitForPending(pending);
    if (step === 'complete') { clearPending(storage, pending.game_id); return refreshContext(); }
    return null;
  }

  return { startNewAction, runStoryForPending, runExtractForPending, runCommitForPending, runRecovery };
}

export function createBusyGuard({ onChange = () => {} } = {}) {
  let active = false;
  return {
    get busy() { return active; },
    async run(operation) {
      if (active) return false;
      active = true; onChange(true);
      try { return await operation(); }
      finally { active = false; onChange(false); }
    }
  };
}

export function createFrontendApp({ documentRef = globalThis.document, storage = globalThis.localStorage, api = createApiClient(), locationSearch = globalThis.location?.search ?? '' } = {}) {
  if (!documentRef) return null;
  const get = id => documentRef.querySelector(`#${id}`);
  const elements = {
    title: get('game-title'), turn: get('turn-number'), api: get('api-status'), status: get('status-banner'), error: get('error-banner'),
    history: get('story-history'), current: get('current-story'), currentAction: get('current-action'), choices: get('choice-list'), input: get('player-action'), submit: get('submit-action'),
    recovery: get('recovery-action'), stream: get('stream-status'), scene: get('scene-state'), mind: get('mind-monitor'), warnings: get('warning-list')
  };
  const gameId = resolveGameId(locationSearch); let context = null, latestResult = {}, busy = false, recoveryPending = false, progressTimer = null;
  const showStatus = value => text(elements.status, value);
  const clearProgressTimer = () => { if (progressTimer) { clearInterval(progressTimer); progressTimer = null; } };
  const showProgress = value => { clearProgressTimer(); let elapsed = 0; text(elements.stream, value); progressTimer = setInterval(() => { elapsed += 1; text(elements.stream, `${value} ${elapsed}초`); }, 1000); };
  const showError = error => { text(elements.error, messageFor(error)); if (elements.error) elements.error.hidden = false; };
  const clearError = () => { if (elements.error) elements.error.hidden = true; text(elements.error, ''); };
  const clearCurrentTurn = () => { text(elements.currentAction, ''); if (elements.currentAction) elements.currentAction.hidden = true; renderNarrative(elements.current, null); };
  const showCurrentAction = value => { text(elements.currentAction, value); if (elements.currentAction) elements.currentAction.hidden = false; };
  function render() {
    renderState({ title: elements.title, turn: elements.turn, scene: elements.scene, mind: elements.mind, warnings: elements.warnings }, context, latestResult);
    renderHistory(elements.history, context?.recent_turns);
    const actionDisabled = busy || recoveryPending;
    if (elements.input) elements.input.disabled = actionDisabled;
    if (elements.submit) elements.submit.disabled = actionDisabled;
    renderChoices(elements.choices, latestResult.choices?.length ? latestResult.choices : contextChoices(context), { busy: actionDisabled, onChoose: startNewAction });
  }
  const setBusy = value => { busy = value; render(); };
  function clearRecoveryUi() {
    recoveryPending = false;
    if (elements.recovery) { elements.recovery.hidden = true; elements.recovery.textContent = ''; elements.recovery.onclick = null; }
    render();
  }
  function showRecoveryUi(pending, step) {
    recoveryPending = true;
    if (elements.recovery) { elements.recovery.hidden = false; elements.recovery.textContent = recoveryLabels[step]; elements.recovery.onclick = () => resumePending(pending, step); }
    render();
  }
  const busyGuard = createBusyGuard({ onChange: setBusy });
  async function refreshContext() {
    showStatus('현재 상태를 불러오는 중…'); const data = await api.context({ game_id: gameId, recent_turns: FRONTEND_CONFIG.recentTurns });
    if (!validateContext(data.context)) throw new ApiError({ endpoint: '/api/context', status: 502, code: 'invalid_context', message: '게임 데이터 계약이 올바르지 않습니다.' });
    context = data.context; latestResult = {}; render();
    if (!loadPending(storage, gameId)) clearRecoveryUi();
    text(elements.api, 'API 연결됨'); showStatus('준비되었습니다.'); return context;
  }
  const coordinator = createTurnCoordinator({
    api, storage, gameId, getContext: () => context, refreshContext,
    onStory: ({ parsed }) => { renderNarrative(elements.current, parsed); if (Array.isArray(parsed.choices) && parsed.choices.length > 0) { latestResult = { ...latestResult, choices: parsed.choices }; renderChoices(elements.choices, parsed.choices, { busy: true, onChoose: startNewAction }); } },
    onExtract: extracted => { latestResult = { choices: extracted.extract?.choices ?? [], mind_monitor: extracted.extract?.mind_monitor ?? {}, warnings: extracted.warnings ?? [] }; showProgress('상태를 정리하는 중…'); render(); },
    onCommitStart: () => { showProgress('결과를 반영하는 중…'); },
    onCommitted: () => { clearCurrentTurn(); clearRecoveryUi(); showStatus('턴이 완료되었습니다.'); }
  });
  async function checkRecovery() {
    const pending = loadPending(storage, gameId);
    if (!pending) { clearRecoveryUi(); return; }
    try {
      const data = await api.actionStatus({ game_id: gameId, action_id: pending.action_id }); const step = recoveryFor(data);
      if (step === 'complete') { await coordinator.runRecovery(pending, step); clearRecoveryUi(); return; }
      showRecoveryUi(pending, step);
      showStatus(step === 'wait_story' ? '서사 처리가 진행 중입니다.' : '이전 행동의 복구가 필요합니다.');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'action_not_found') { showRecoveryUi(pending, 'retry_story'); return; }
      showError(error);
    }
  }
  async function withBusy(operation) {
    if (busy) return false;
    clearError();
    return busyGuard.run(async () => {
      try { await operation(); return true; }
      catch (error) { showError(error); await checkRecovery(); return false; }
      finally { clearProgressTimer(); text(elements.stream, ''); }
    });
  }
  async function startNewAction(playerAction) {
    const action = String(playerAction ?? elements.input?.value ?? '').trim(); if (!action || busy || !context) return false;
    if (loadPending(storage, gameId)) { showStatus('이전 행동을 먼저 복구해야 합니다.'); await checkRecovery(); return false; }
    return withBusy(async () => { showCurrentAction(action); if (elements.input) elements.input.value = ''; text(elements.stream, 'Story를 생성하는 중…'); await coordinator.startNewAction(action); });
  }
  async function resumePending(pending, step) {
    return withBusy(async () => {
      if (step === 'wait_story' || step === 'unknown') return checkRecovery();
      if (step === 'retry_story') { showCurrentAction(pending.player_action); text(elements.stream, 'Story를 다시 시도하는 중…'); }
      await coordinator.runRecovery(pending, step);
    });
  }
  async function init() { elements.submit?.addEventListener('click', () => startNewAction()); await refreshContext(); await checkRecovery(); }
  return { gameId, init, refreshContext, startNewAction, checkRecovery, resumePending, get context() { return context; }, get busy() { return busy; } };
}

if (globalThis.document?.querySelector('#game-main')) {
  const app = createFrontendApp(); app.init().catch(error => { const target = document.querySelector('#error-banner'); if (target) { target.hidden = false; target.textContent = messageFor(error); } });
}
