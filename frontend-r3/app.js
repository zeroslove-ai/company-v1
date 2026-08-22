import { consumeR3Sse, createR3Client } from './r3-client.js';
import { buildCompanyMapModel, renderCompanyMap } from './company-map.js';
import { parsePlainStoryForPresentation, renderChoices, renderFocalCharacter, renderHistory, renderMindMonitor, renderNarrative, renderState } from './render.js';
import { readSetupForm, renderSetupCatalogs, validateSetupValues } from './setup.js';
import { buildR3ViewModel } from './r3-view-model.js';
import { createR3CsaUi } from './csa.js';

// R3 controller: one context load, one literal action, one server-owned SSE
// turn. Product rendering lives in the transplanted donor-style modules above.
const query = new URLSearchParams(location.search);
const client = createR3Client(query.get('api') || '/api/r3');
const state = { gameId: query.get('game_id'), context: null, catalogs: null, busy: false };
const sidecarState = { ttsEnabled: false };
const RECOVERY_POLL_MS = 1500;
const RECOVERY_TIMEOUT_MS = 120000;
const $ = id => document.querySelector(`#${id}`);
const csaUi = createR3CsaUi({ documentRef: document, client, getGameId: () => state.gameId, getContext: () => state.context, getCatalog: () => state.catalogs?.csa_presets, onContext: context => renderContext(context) });

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

function renderContext(context) {
  state.context = context;
  const view = buildR3ViewModel(context, state.catalogs ?? {});
  const actors = state.catalogs?.actors ?? [];
  renderState({ scene: $('scene-state'), player: $('player-situation') }, view);
  renderFocalCharacter($('focal-character'), view.scene.focal_actor);
  renderHistory($('story-history'), view.history, { actors: view.actorNames });
  if ($('turn-number')) $('turn-number').textContent = `Turn ${view.committedTurn}`;
  if ($('day-time')) $('day-time').textContent = `Day ${view.time.day ?? 1} · ${String(Math.floor((view.time.minute ?? 0) / 60)).padStart(2, '0')}:${String((view.time.minute ?? 0) % 60).padStart(2, '0')}`;
  const latest = view.history.at(-1);
  if (latest?.story_text) renderNarrative($('current-story'), parsePlainStoryForPresentation(latest.story_text, { choices: view.choices, actorNames: view.actorNames }));
  renderChoices($('choice-list'), view.choices, { busy: state.busy, onChoose: submit });
  renderMindMonitor($('mind-monitor'), view.mindMonitor, { actorNames: view.actorNames });
  renderCompanyMap($('company-map'), buildCompanyMapModel({ scene: view.scene, actors, locations: state.catalogs?.locations ?? [] }), { onFill: literalInput });
  const apps = $('open-apps'); if (apps) apps.disabled = !state.gameId;
  const history = $('open-history'); if (history) history.disabled = !state.gameId || !view.history.length;
  const recovery = $('recovery-action');
  if (recovery) {
    const pending = context?.job?.status === 'processing';
    recovery.hidden = !pending;
    recovery.disabled = state.busy;
    recovery.textContent = pending ? '진행 중인 Story 복구' : '';
  }
  const hasStory = Boolean(view.story);
  const ttsToggle = $('tts-toggle'); if (ttsToggle) { ttsToggle.disabled = !hasStory; ttsToggle.setAttribute('aria-pressed', sidecarState.ttsEnabled ? 'true' : 'false'); }
  const ttsReplay = $('tts-replay'); if (ttsReplay) { ttsReplay.hidden = !hasStory; ttsReplay.disabled = !hasStory; }
  csaUi.sync();
  setHidden('player-setup-overlay', Boolean(view.profile?.name));
  $('api-status')?.setAttribute('aria-label', '연결 완료');
}

function latestStory() { return state.context?.turns?.at(-1)?.story_text ?? ''; }
function speakLatest() {
  const text = latestStory();
  if (!text || !sidecarState.ttsEnabled || typeof globalThis.speechSynthesis === 'undefined' || typeof globalThis.SpeechSynthesisUtterance === 'undefined') return;
  globalThis.speechSynthesis.cancel();
  const utterance = new globalThis.SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  globalThis.speechSynthesis.speak(utterance);
  if ($('tts-status')) $('tts-status').textContent = '현재 Story를 재생합니다.';
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
  renderChoices($('choice-list'), view?.choices ?? [], { busy: state.busy, onChoose: submit });
}

async function recoverPendingTurn() {
  if (!state.gameId || !state.context?.job || state.context.job.status !== 'processing') return false;
  state.busy = true;
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

function handleEvent(event, data) {
  if (event === 'story_delta' && $('current-story')) $('current-story').textContent += data.text ?? '';
  if (event === 'terminal' && data.status === 'committed' && data.context) renderContext(data.context);
}

async function openOpening() {
  setStatus('오프닝을 불러오는 중입니다.'); state.busy = true;
  try { await consumeR3Sse(await client.opening(state.gameId), handleEvent); setStatus('다음 행동을 직접 입력하거나 제안 중 하나를 고르세요.'); }
  catch (error) { setStatus(error.message, true); } finally { state.busy = false; refreshChoices(); }
}

async function submit(value = null) {
  if (state.busy || !state.gameId) return;
  const input = $('player-action'); const literalAction = value ?? input?.value ?? '';
  if (!literalAction.trim()) { setStatus('다음 행동을 직접 입력해 주세요.', true); return; }
  state.busy = true; setStatus('Story를 생성하는 중입니다.'); if ($('current-story')) $('current-story').replaceChildren();
  try {
    await consumeR3Sse(await client.turn(state.gameId, { action_id: crypto.randomUUID(), expected_turn: (state.context?.state?.committed_turn ?? 0) + 1, literal_action: literalAction }), handleEvent);
    if (input) input.value = '';
    setStatus('저장되었습니다.');
  } catch (error) {
    if (error?.code === 'r3_stream_reconnect_required') {
      try {
        const context = await client.context(state.gameId);
        renderContext(context);
        if (context.job?.status === 'processing') await recoverPendingTurn();
        else setStatus(error.message, true);
      } catch (recoveryError) { setStatus(recoveryError.message, true); }
    } else setStatus(error.message, true);
  }
  finally { state.busy = false; refreshChoices(); }
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
$('recovery-action')?.addEventListener('click', () => recoverPendingTurn());
$('open-history')?.addEventListener('click', openHistory);
$('history-close')?.addEventListener('click', () => setHidden('history-overlay', true));
$('history-download-md')?.addEventListener('click', () => exportHistory(true));
$('history-download-txt')?.addEventListener('click', () => exportHistory(false));
$('tts-toggle')?.addEventListener('click', () => { sidecarState.ttsEnabled = !sidecarState.ttsEnabled; renderContext(state.context); if (sidecarState.ttsEnabled) speakLatest(); else globalThis.speechSynthesis?.cancel?.(); });
$('tts-replay')?.addEventListener('click', speakLatest);
loadCatalogs().catch(error => { setStatus(error.message, true); setBootFailure(error); });

async function loadCatalogs() { renderCatalogs(await client.catalogs()); await loadContext(); }
