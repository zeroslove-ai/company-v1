import { consumeR3Sse, createR3Client } from './r3-client.js';
import { buildCompanyMapModel, renderCompanyMap } from './company-map.js';
import { parsePlainStoryForPresentation, renderChoices, renderFocalCharacter, renderHistory, renderMindMonitor, renderNarrative, renderState } from './render.js';
import { readSetupForm, renderSetupCatalogs, validateSetupValues } from './setup.js';
import { buildR3ViewModel } from './r3-view-model.js';

// R3 controller: one context load, one literal action, one server-owned SSE
// turn. Product rendering lives in the transplanted donor-style modules above.
const query = new URLSearchParams(location.search);
const client = createR3Client(query.get('api') || '/api/r3');
const state = { gameId: query.get('game_id'), context: null, catalogs: null, busy: false };
const $ = id => document.querySelector(`#${id}`);

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
  setHidden('player-setup-overlay', Boolean(view.profile?.name));
  $('api-status')?.setAttribute('aria-label', '연결 완료');
}

function handleEvent(event, data) {
  if (event === 'story_delta' && $('current-story')) $('current-story').textContent += data.text ?? '';
  if (event === 'terminal' && data.status === 'committed' && data.context) renderContext(data.context);
}

async function openOpening() {
  setStatus('오프닝을 불러오는 중입니다.'); state.busy = true;
  try { await consumeR3Sse(await client.opening(state.gameId), handleEvent); setStatus('다음 행동을 직접 입력하거나 제안 중 하나를 고르세요.'); }
  catch (error) { setStatus(error.message, true); } finally { state.busy = false; }
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
  } catch (error) { setStatus(error.message, true); }
  finally { state.busy = false; }
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
  const context = await client.context(state.gameId); renderContext(context); setHidden('boot-fallback', true); if (!(context.turns ?? []).length) await openOpening();
}

$('player-setup-form')?.addEventListener('submit', setup);
$('submit-action')?.addEventListener('click', () => submit());
$('player-action')?.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') submit(); });
loadCatalogs().catch(error => { setStatus(error.message, true); setBootFailure(error); });

async function loadCatalogs() { renderCatalogs(await client.catalogs()); await loadContext(); }
