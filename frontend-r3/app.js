import { consumeR3Sse, createR3Client } from './r3-client.js';
import { buildCompanyMapModel, renderCompanyMap } from './company-map.js';
import { parsePlainStoryForPresentation, renderChoices, renderFocalCharacter, renderHistory, renderMindMonitor, renderNarrative, renderPlayerInnerThought, renderState } from './render.js';
import { readSetupForm, renderSetupCatalogs, validateSetupValues } from './setup.js';
import { buildR3ViewModel } from './r3-view-model.js';
import { createR3CsaUi } from './csa.js';
import { reconcileTurnTransport } from './turn-transport.js';
import { resolveR3ApiBase } from './r3-config.js';
import { createR3MediaUi } from './media.js';
import { createCompanyTts } from './tts.js';

// R3 controller: one context load, one literal action, one server-owned SSE
// turn. Product rendering lives in the transplanted donor-style modules above.
const query = new URLSearchParams(location.search);
const client = createR3Client(query.get('api') || resolveR3ApiBase());
const state = { gameId: query.get('game_id'), context: null, view: null, catalogs: null, busy: false, feedbackBusy: false };
const RECOVERY_POLL_MS = 1500;
const RECOVERY_TIMEOUT_MS = 120000;
const $ = id => document.querySelector(`#${id}`);
const csaUi = createR3CsaUi({ documentRef: document, getContext: () => state.context, getCatalog: () => ({ ...(state.catalogs?.csa_presets ?? {}), ...(state.catalogs ?? {}) }), getBusy: () => state.busy, onOperation: operation => { const { literal_action: literalAction, ...csaOperation } = operation; return submit(literalAction, { csaOperation }); } });
const mediaUi = createR3MediaUi({ documentRef: document, api: { image: payload => client.image(state.gameId, payload) }, getViewModel: () => state.view });
const ttsUi = createCompanyTts({ documentRef: document, api: { tts: payload => client.tts(state.gameId, payload) }, getViewModel: () => state.view, getCommittedTurnIdentity: () => { const turn = state.view?.turn ?? {}; return `${turn.committed_turn}:${turn.turn_id}:${turn.revision}`; } });

function setStatus(message, error = false) { const node = $('status-banner'); if (node) { node.textContent = message; node.dataset.error = error ? 'true' : 'false'; } }
function setHidden(id, hidden) { const node = $(id); if (node) node.hidden = hidden; }
function setBootFailure(error) {
  const fallback = $('boot-fallback');
  const message = $('boot-fallback-message');
  if (message) message.textContent = `게임 화면을 불러오지 못했습니다: ${error?.message ?? '알 수 없는 오류'}`;
  if (fallback) fallback.hidden = false;
}
function replaceGameUrl(gameId) {
  const next = new URL(location.href);
  next.searchParams.set('game_id', gameId);
  if (query.has('api')) next.searchParams.set('api', query.get('api'));
  history.replaceState(null, '', `${next.pathname}${next.search}${next.hash}`);
}
function literalInput(value) { const input = $('player-action'); if (input) { input.value = value; input.focus(); } }
function actorDirectory(actors) { return Object.fromEntries((actors ?? []).map(actor => [actor.id ?? actor.character_id, actor.name])); }

function renderCatalogs(catalogs) { state.catalogs = catalogs; renderSetupCatalogs(document, catalogs); }

function syncActionControls() {
  const submitAction = $('submit-action');
  if (submitAction) submitAction.disabled = state.busy || !state.gameId || state.context?.job?.status === 'failed';
  const latestTurn = Number(state.context?.state?.committed_turn ?? 0);
  const feedback = $('send-feedback');
  if (feedback) feedback.disabled = state.busy || state.feedbackBusy || !state.gameId || latestTurn <= 0 || Boolean(state.context?.job);
  const feedbackSubmit = document.querySelector('#feedback-form button[type="submit"]');
  if (feedbackSubmit) feedbackSubmit.disabled = state.feedbackBusy;
  const feedbackClose = $('feedback-close');
  if (feedbackClose) feedbackClose.disabled = state.feedbackBusy;
  const reset = $('reset-game');
  if (reset) reset.disabled = state.busy || state.feedbackBusy || !state.gameId || !state.context || state.context.job?.status === 'processing';
}

function renderContext(context) {
  state.context = context;
  const view = buildR3ViewModel(context, state.catalogs ?? {});
  state.view = view;
  const failedJob = context?.job?.status === 'failed';
  const input = $('player-action');
  if (failedJob && input && !input.value.trim() && typeof context.job.literal_action === 'string') input.value = context.job.literal_action;
  const actors = state.catalogs?.actors ?? [];
  renderState({ scene: $('scene-state'), player: $('player-situation') }, view);
  renderPlayerInnerThought($('player-inner-thought'), view.playerInnerThought);
  renderFocalCharacter($('focal-character'), view.scene.focal_actor);
  renderHistory($('story-history'), view.history, { actors: view.actorNames });
  if ($('turn-number')) $('turn-number').textContent = `Turn ${view.committedTurn}`;
  if ($('day-time')) $('day-time').textContent = `Day ${view.time.day ?? 1} · ${String(Math.floor((view.time.minute ?? 0) / 60)).padStart(2, '0')}:${String((view.time.minute ?? 0) % 60).padStart(2, '0')}`;
  const latest = view.history.at(-1);
  if (latest?.story_text) renderNarrative($('current-story'), parsePlainStoryForPresentation(latest.story_text, { choices: view.choices, actorNames: view.actorNames }));
  renderChoices($('choice-list'), view.choices, { busy: state.busy || failedJob, onChoose: submit });
  renderMindMonitor($('mind-monitor'), view.mindMonitor, { actorNames: view.actorNames });
  renderCompanyMap($('company-map'), buildCompanyMapModel({ scene: view.scene, actors, locations: state.catalogs?.locations ?? [] }), { onFill: literalInput });
  const apps = $('open-apps'); if (apps) apps.disabled = !state.gameId;
  const history = $('open-history'); if (history) history.disabled = !state.gameId || !view.history.length;
  const recovery = $('recovery-action');
  if (recovery) {
    const pending = context?.job?.status === 'processing';
    recovery.hidden = !pending && !failedJob;
    recovery.disabled = state.busy;
    recovery.textContent = pending ? '진행 중인 Story 복구' : '';
  }
  if (failedJob) {
    if (recovery) recovery.textContent = 'Retry failed action';
    setStatus('r3_turn_failed: edit the action and retry explicitly', true);
  }
  const hasStory = Boolean(view.story);
  const ttsToggle = $('tts-toggle'); if (ttsToggle) { ttsToggle.disabled = !hasStory; ttsToggle.setAttribute('aria-pressed', ttsUi.state.enabled ? 'true' : 'false'); }
  const ttsReplay = $('tts-replay'); if (ttsReplay) { ttsReplay.hidden = !hasStory; ttsReplay.disabled = !hasStory; }
  void mediaUi.load();
  ttsUi.onCommittedTurn();
  csaUi.sync();
  syncActionControls();
  setHidden('player-setup-overlay', Boolean(view.profile?.name));
  $('api-status')?.setAttribute('aria-label', '연결 완료');
}

function openHistory() {
  if (!state.context) return;
  const view = buildR3ViewModel(state.context, state.catalogs ?? {});
  renderHistory($('history-list'), view.history, { actors: view.actorNames });
  if ($('history-status')) $('history-status').textContent = `${view.history.length}개 커밋 턴을 표시합니다.`;
  setHidden('history-overlay', false);
}
function historyExport(extension, contentType, body) {
  const blob = new Blob([body], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = `company-r3-history-${state.gameId}.${extension}`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
function exportHistory(markdown = true) {
  const turns = state.context?.turns ?? [];
  const body = turns.map(turn => markdown
    ? [`## Turn ${turn.turn_number ?? 0}`, `**행동:** ${turn.literal_action || 'Opening'}`, '', turn.story_text ?? '', turn.turn_summary ? `\n> ${turn.turn_summary}` : ''].join('\n')
    : [`Turn ${turn.turn_number ?? 0}`, `행동: ${turn.literal_action || 'Opening'}`, '', turn.story_text ?? '', turn.turn_summary ? `\n요약: ${turn.turn_summary}` : ''].join('\n')).join(markdown ? '\n\n---\n\n' : '\n\n====================\n\n');
  historyExport(markdown ? 'md' : 'txt', markdown ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8', body);
}
function refreshChoices() {
  const view = state.context ? buildR3ViewModel(state.context, state.catalogs ?? {}) : null;
  renderChoices($('choice-list'), view?.choices ?? [], { busy: state.busy || state.context?.job?.status === 'failed', onChoose: submit });
  syncActionControls();
}

function openFeedback() {
  if (!$('send-feedback') || $('send-feedback').disabled) return;
  const text = $('feedback-text'); if (text) text.value = '';
  const preview = $('feedback-preview'); if (preview) { preview.textContent = ''; preview.hidden = true; }
  const status = $('feedback-status'); if (status) status.textContent = '마지막 턴의 수정 요청을 입력하세요.';
  setHidden('feedback-overlay', false); text?.focus();
}

function closeFeedback() { if (!state.feedbackBusy) setHidden('feedback-overlay', true); }

function handleFeedbackEvent(event, data) {
  if (event === 'story_delta') {
    const preview = $('feedback-preview');
    if (preview) { preview.hidden = false; preview.textContent += data.text ?? ''; }
  }
  if (event === 'terminal') {
    const status = $('feedback-status');
    if (data.status === 'committed') {
      if (data.context) renderContext(data.context);
      if (status) status.textContent = '새 revision이 저장되었습니다.';
      setStatus('피드백 revision이 저장되었습니다.');
      setHidden('feedback-overlay', true);
    } else if (status) status.textContent = data.error_code ?? '피드백 revision이 저장되지 않았습니다.';
  }
}

async function submitFeedback(event) {
  event.preventDefault();
  if (state.feedbackBusy || state.busy || !state.gameId) return;
  const feedbackText = $('feedback-text')?.value?.trim() ?? '';
  const expectedTurn = Number(state.context?.state?.committed_turn ?? 0);
  const expectedStateRevision = Number(state.context?.state?.revision ?? -1);
  const latest = state.context?.turns?.at(-1);
  if (!feedbackText || expectedTurn <= 0 || !latest || state.context?.job) return;
  state.feedbackBusy = true;
  const status = $('feedback-status'); if (status) status.textContent = 'Story를 다시 생성하는 중입니다. 저장 전 미리보기를 확인하세요.';
  const preview = $('feedback-preview'); if (preview) { preview.textContent = ''; preview.hidden = true; }
  syncActionControls();
  try {
    const response = await client.feedback(state.gameId, { revision_request_id: crypto.randomUUID(), expected_turn: expectedTurn, expected_state_revision: expectedStateRevision, feedback_text: feedbackText });
    await consumeR3Sse(response, handleFeedbackEvent);
  } catch (error) {
    const code = error.terminal?.error_code ?? error.message;
    if (status) status.textContent = code;
  } finally {
    state.feedbackBusy = false;
    syncActionControls();
  }
}

async function recoverPendingTurn() {
  if (!state.gameId || !state.context?.job || state.context.job.status !== 'processing') return false;
  state.busy = true;
  syncActionControls();
  setStatus('진행 중인 Story를 복구하는 중입니다.');
  const deadline = Date.now() + RECOVERY_TIMEOUT_MS;
  try {
    while (Date.now() < deadline) {
      const context = await client.context(state.gameId);
      renderContext(context);
      if (!context.job) {
        setStatus('저장되었습니다.');
        return true;
      }
      if (context.job.status === 'failed') {
        setStatus(context.job.error_code ?? 'r3_stream_failed', true);
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, RECOVERY_POLL_MS));
    }
    setStatus('r3_stream_reconnect_required', true);
    return false;
  } catch (error) {
    setStatus(error.message, true);
    return false;
  } finally {
    state.busy = false;
    refreshChoices();
  }
}

async function resetGame() {
  if (state.busy || state.feedbackBusy || !state.gameId || !state.context || state.context.job?.status === 'processing') return;
  if (typeof globalThis.confirm === 'function' && !globalThis.confirm('현재 게임을 초기화하고 Opening부터 다시 시작할까요?')) return;
  const expectedStateRevision = Number(state.context.state?.revision);
  if (!Number.isInteger(expectedStateRevision) || expectedStateRevision < 0) { setStatus('r3_reset_revision_invalid', true); return; }
  state.busy = true;
  $('current-story')?.replaceChildren();
  $('story-history')?.replaceChildren();
  setStatus('게임을 초기화하는 중입니다...');
  syncActionControls();
  try {
    await consumeR3Sse(await client.reset(state.gameId, { expected_state_revision: expectedStateRevision }), handleEvent);
    setStatus('Opening부터 새 게임을 시작합니다.');
  } catch (error) {
    try { renderContext(await client.context(state.gameId)); } catch { /* preserve the last accepted local context */ }
    setStatus(error.terminal?.error_code ?? error.message, true);
  } finally {
    state.busy = false;
    if (state.context) renderContext(state.context); else syncActionControls();
  }
}

function handleEvent(event, data) {
  if (event === 'story_delta' && $('current-story')) $('current-story').textContent += data.text ?? '';
  if (event === 'terminal' && data.status === 'committed' && data.context) renderContext(data.context);
}

async function openOpening() {
  state.busy = true; syncActionControls();
  setStatus('오프닝을 불러오는 중입니다.'); state.busy = true;
  try { await consumeR3Sse(await client.opening(state.gameId), handleEvent); setStatus('다음 행동을 직접 입력하거나 제안 중 하나를 고르세요.'); }
  catch (error) { setStatus(error.message, true); } finally { state.busy = false; refreshChoices(); }
}

async function submit(value = null, { retryFailed = false, csaOperation = null } = {}) {
  if (state.busy || !state.gameId) return { kind: 'not_sent' };
  if (state.context?.job?.status === 'failed' && !retryFailed) {
    setStatus('r3_turn_failed: use the explicit retry control', true);
    return { kind: 'not_sent' };
  }
  const input = $('player-action'); const literalAction = value ?? input?.value ?? '';
  let outcome = { kind: 'unknown' };
  if (!literalAction.trim()) { setStatus('다음 행동을 직접 입력해 주세요.', true); return { kind: 'not_sent' }; }
  state.busy = true; setStatus('Story를 생성하는 중입니다.'); if ($('current-story')) $('current-story').replaceChildren();
  csaUi.sync();
  const expectedTurn = (state.context?.state?.committed_turn ?? 0) + 1;
  syncActionControls();
  try {
    const payload = { action_id: crypto.randomUUID(), expected_turn: expectedTurn, literal_action: literalAction };
    if (retryFailed) payload.retry_failed = true;
    const pendingOperation = csaOperation ?? (retryFailed ? state.context?.job?.csa_operation : null);
    if (pendingOperation) payload.csa_operation = pendingOperation;
    const turnResponse = await client.turn(state.gameId, payload);
    if (!turnResponse.ok || !turnResponse.body) {
      const error = new Error('r3_stream_reconnect_required'); error.code = 'r3_stream_reconnect_required'; throw error;
    }
    await consumeR3Sse(turnResponse, handleEvent);
    if (input) input.value = '';
    outcome = { kind: 'committed' };
    setStatus('저장되었습니다.');
  } catch (error) {
    outcome = await reconcileTurnTransport({
      gameId: state.gameId,
      client,
      expectedTurn,
      literalAction,
      renderContext,
      recoverPendingTurn,
      clearLiteral: () => { if (input) input.value = ''; },
      setStatus,
      originalError: error
    });
  }
  finally { state.busy = false; csaUi.sync(); refreshChoices(); }
  return outcome;
}

async function setup(event) {
  event.preventDefault();
  const profile = readSetupForm(document); const checked = validateSetupValues(profile, state.catalogs ?? {});
  if (!checked.valid) { const status = $('setup-status'); if (status) status.textContent = '입력값을 다시 확인해 주세요.'; return; }
  try {
    const created = await client.setup(checked.player); state.gameId = created.game?.game_id ?? created.game_id;
    replaceGameUrl(state.gameId); setHidden('player-setup-overlay', true); await loadContext();
  } catch (error) { const status = $('setup-status'); if (status) status.textContent = error.message; setBootFailure(error); }
}

async function loadContext() {
  if (!state.gameId) { setHidden('player-setup-overlay', false); setHidden('boot-fallback', true); return; }
  const context = await client.context(state.gameId); renderContext(context); setHidden('boot-fallback', true);
  if (context.job?.status === 'processing') await recoverPendingTurn();
  else if (!(context.turns ?? []).length) await openOpening();
}

$('player-setup-form')?.addEventListener('submit', setup);
$('submit-action')?.addEventListener('click', () => submit());
$('player-action')?.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') submit(); });
$('recovery-action')?.addEventListener('click', () => state.context?.job?.status === 'failed' ? submit(null, { retryFailed: true }) : recoverPendingTurn());
$('open-history')?.addEventListener('click', openHistory);
$('history-close')?.addEventListener('click', () => setHidden('history-overlay', true));
$('history-download-md')?.addEventListener('click', () => exportHistory(true));
$('history-download-txt')?.addEventListener('click', () => exportHistory(false));
$('send-feedback')?.addEventListener('click', openFeedback);
$('feedback-close')?.addEventListener('click', closeFeedback);
$('feedback-form')?.addEventListener('submit', submitFeedback);
$('reset-game')?.addEventListener('click', resetGame);
loadCatalogs().catch(error => { setStatus(error.message, true); setBootFailure(error); });

async function loadCatalogs() { renderCatalogs(await client.catalogs()); await loadContext(); }
