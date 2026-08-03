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

function actionId() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`; }
function messageFor(error) {
  if (error instanceof ApiError) return error.code === 'turn_conflict' ? '턴 충돌이 발생했습니다. 현재 상태를 다시 불러오세요.' : error.message;
  return '예상하지 못한 오류가 발생했습니다.';
}

export function createFrontendApp({ documentRef = globalThis.document, storage = globalThis.localStorage, api = createApiClient(), locationSearch = globalThis.location?.search ?? '' } = {}) {
  if (!documentRef) return null;
  const get = id => documentRef.querySelector(`#${id}`);
  const elements = {
    title: get('game-title'), turn: get('turn-number'), api: get('api-status'), status: get('status-banner'), error: get('error-banner'),
    history: get('story-history'), current: get('current-story'), choices: get('choice-list'), input: get('player-action'), submit: get('submit-action'),
    recovery: get('recovery-action'), stream: get('stream-status'), scene: get('scene-state'), mind: get('mind-monitor'), warnings: get('warning-list')
  };
  const gameId = resolveGameId(locationSearch); let context = null, latestResult = {}, busy = false, currentParsed = null;
  const setBusy = value => { busy = value; if (elements.input) elements.input.disabled = value; if (elements.submit) elements.submit.disabled = value; renderChoices(elements.choices, latestResult.choices?.length ? latestResult.choices : contextChoices(context), { busy: value, onChoose: executeAction }); };
  const showStatus = value => text(elements.status, value); const showError = error => { text(elements.error, messageFor(error)); if (elements.error) elements.error.hidden = false; };
  const clearError = () => { if (elements.error) elements.error.hidden = true; text(elements.error, ''); };
  function render() { renderState({ title: elements.title, turn: elements.turn, scene: elements.scene, mind: elements.mind, warnings: elements.warnings }, context, latestResult); renderHistory(elements.history, context?.recent_turns); renderChoices(elements.choices, latestResult.choices?.length ? latestResult.choices : contextChoices(context), { busy, onChoose: executeAction }); }
  async function refreshContext() {
    showStatus('현재 상태를 불러오는 중…'); const data = await api.context({ game_id: gameId, recent_turns: FRONTEND_CONFIG.recentTurns });
    if (!validateContext(data.context)) throw new ApiError({ endpoint: '/api/context', status: 502, code: 'invalid_context', message: '게임 데이터 계약이 올바르지 않습니다.' });
    context = data.context; latestResult = {}; render(); text(elements.api, 'API 연결됨'); showStatus('준비되었습니다.'); return context;
  }
  async function extractAndCommit(pending) {
    pending.step = 'extract'; savePending(storage, pending); showStatus('상태를 추출하는 중…'); const extracted = await api.extract({ game_id: pending.game_id, action_id: pending.action_id });
    latestResult = { choices: extracted.extract?.choices ?? [], mind_monitor: extracted.extract?.mind_monitor ?? {}, warnings: extracted.warnings ?? [] }; pending.step = 'commit'; savePending(storage, pending);
    showStatus('턴을 저장하는 중…'); const committed = await api.commit({ game_id: pending.game_id, action_id: pending.action_id, expected_turn: pending.expected_turn });
    if (committed.commit?.success !== true) throw new ApiError({ endpoint: '/api/commit', status: 502, code: 'invalid_commit', message: '턴 저장 결과가 올바르지 않습니다.' });
    clearPending(storage, gameId); await refreshContext(); showStatus('턴이 완료되었습니다.');
  }
  async function executeAction(playerAction) {
    const action = String(playerAction ?? elements.input?.value ?? '').trim(); if (!action || busy || !context) return;
    clearError(); setBusy(true); const pending = { game_id: gameId, action_id: actionId(), expected_turn: committedTurn(context) + 1, player_action: action, created_at: new Date().toISOString(), step: 'story' };
    try {
      savePending(storage, pending); if (elements.input) elements.input.value = ''; text(elements.stream, 'Story를 생성하는 중…'); let rawStory = '', sawMeta = false;
      const response = await api.story(pending);
      await consumeStorySse(response, item => { if (item.event === 'meta') sawMeta = true; if (item.event === 'delta') { rawStory += item.data?.text ?? ''; currentParsed = parseNarrative(rawStory); renderNarrative(elements.current, currentParsed); } });
      if (!sawMeta || !rawStory.trim()) throw new ApiError({ endpoint: '/api/story', status: 502, code: 'incomplete_story_stream', message: '서사 스트림이 불완전합니다.', retryable: true });
      pending.step = 'extract'; savePending(storage, pending); await extractAndCommit(pending); renderNarrative(elements.current, null);
    } catch (error) { showError(error); showStatus('복구가 필요할 수 있습니다.'); await checkRecovery(); }
    finally { text(elements.stream, ''); setBusy(false); }
  }
  async function checkRecovery() {
    const pending = loadPending(storage, gameId); if (!pending) { if (elements.recovery) elements.recovery.hidden = true; return; }
    try {
      const data = await api.actionStatus({ game_id: gameId, action_id: pending.action_id }); const step = recoveryFor(data);
      if (step === 'complete') { clearPending(storage, gameId); await refreshContext(); return; }
      if (elements.recovery) { elements.recovery.hidden = false; elements.recovery.textContent = recoveryLabels[step]; elements.recovery.onclick = () => resumePending(pending, step); }
      showStatus(step === 'wait_story' ? '서사 처리가 진행 중입니다.' : '이전 행동의 복구가 필요합니다.');
    } catch (error) { showError(error); }
  }
  async function resumePending(pending, step) {
    if (busy) return; clearError(); setBusy(true);
    try {
      if (step === 'retry_story') await executeAction(pending.player_action);
      else if (step === 'resume_extract' || step === 'retry_extract' || step === 'resume_commit' || step === 'retry_commit') await extractAndCommit(pending);
      else await checkRecovery();
    } catch (error) { showError(error); } finally { setBusy(false); }
  }
  async function init() {
    elements.submit?.addEventListener('click', () => executeAction()); await refreshContext(); await checkRecovery();
  }
  return { gameId, init, refreshContext, executeAction, checkRecovery, get context() { return context; }, get busy() { return busy; } };
}

if (globalThis.document?.querySelector('#game-main')) {
  const app = createFrontendApp(); app.init().catch(error => { const target = document.querySelector('#error-banner'); if (target) { target.hidden = false; target.textContent = messageFor(error); } });
}
