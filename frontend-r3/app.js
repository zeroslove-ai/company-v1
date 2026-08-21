import { consumeR3Sse, createR3Client } from './r3-client.js';
import { buildR3ViewModel } from './r3-view-model.js';

const client = createR3Client(new URLSearchParams(location.search).get('api') || '/api/r3');
const state = { gameId: new URLSearchParams(location.search).get('game_id'), context: null, busy: false };
const $ = id => document.querySelector(`#${id}`);

function setStatus(message, error = false) {
  const node = $('status-banner');
  if (node) { node.textContent = message; node.dataset.error = error ? 'true' : 'false'; }
}

function setHidden(id, hidden) { const node = $(id); if (node) node.hidden = hidden; }

function fillSelect(id, items, key) {
  const node = $(id); if (!node) return;
  node.replaceChildren(...items.map(item => {
    const option = document.createElement('option');
    option.value = item[key]; option.textContent = item.ui_hint ? `${item.name} (${item.ui_hint})` : item.name;
    return option;
  }));
}

function renderCatalogs(catalogs) {
  fillSelect('setup-department', catalogs.departments ?? [], 'department_id');
  fillSelect('setup-position', catalogs.positions ?? [], 'position_id');
  fillSelect('setup-body-type', catalogs.body_types ?? [], 'body_type_id');
  fillSelect('setup-speech-style', catalogs.speech_styles ?? [], 'speech_style_id');
  const map = $('company-map'); if (!map) return;
  map.replaceChildren(...(catalogs.locations ?? []).map(location => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'map-location';
    button.textContent = location.name ?? location.location_id;
    button.addEventListener('click', () => { const input = $('player-action'); if (input) { input.value = `${location.name ?? location.location_id}\uC73C\uB85C \uC774\uB3D9\uD55C\uB2E4.`; input.focus(); } });
    return button;
  }));
}

function render(context) {
  state.context = context; const view = buildR3ViewModel(context);
  if ($('turn-number')) $('turn-number').textContent = `Turn ${view.committedTurn}`;
  if ($('day-time')) $('day-time').textContent = `Day ${view.time.day ?? 1} · ${String(Math.floor((view.time.minute ?? 0) / 60)).padStart(2, '0')}:${String((view.time.minute ?? 0) % 60).padStart(2, '0')}`;
  if ($('current-story')) $('current-story').textContent = view.job?.status === 'processing' ? (view.job.story_text ?? '') : '';
  if ($('story-history')) $('story-history').replaceChildren(...view.history.map(turn => {
    const article = document.createElement('article'); article.className = 'story-card';
    const label = document.createElement('p'); label.className = 'turn-label'; label.textContent = `Turn ${turn.turn_number}`;
    const action = document.createElement('p'); action.className = 'action-chip'; action.textContent = turn.literal_action || 'Opening';
    const text = document.createElement('p'); text.className = 'story-text'; text.textContent = turn.story_text;
    article.append(label, action, text); return article;
  }));
  if ($('choice-list')) $('choice-list').replaceChildren(...view.choices.slice(0, 4).map(choice => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'choice-button'; button.textContent = choice;
    button.addEventListener('click', () => submit(choice)); return button;
  }));
  if ($('scene-state')) $('scene-state').replaceChildren(...[
    ['장소', view.scene.location_id || '확인되지 않음'],
    ['현재 인물', view.scene.present_actor_ids.join(', ') || '아직 없음'],
    ['장면 메모', view.scene.scene_note || '기록 없음']
  ].flatMap(([label, value]) => { const term = document.createElement('dt'); term.textContent = label; const detail = document.createElement('dd'); detail.textContent = value; return [term, detail]; }));
  if ($('player-situation')) $('player-situation').replaceChildren(...[
    ['이름', view.profile.name], ['부서', view.profile.department_id], ['직급', view.profile.position_id],
    ['나이', view.profile.age], ['키', view.profile.height_cm], ['몸무게', view.profile.weight_kg], ['말투', view.profile.speech_style_id]
  ].flatMap(([label, value]) => { const term = document.createElement('dt'); term.textContent = label; const detail = document.createElement('dd'); detail.textContent = value ?? ''; return [term, detail]; }));
  if ($('mind-monitor')) $('mind-monitor').replaceChildren(...Object.entries(view.mindMonitor).map(([id, monitor]) => {
    const card = document.createElement('article'); card.className = 'mind-monitor-card'; card.textContent = `${id}\n${monitor.surface ?? ''}\n${monitor.subconscious ?? ''}`; return card;
  }));
  setHidden('player-setup-overlay', Boolean(view.profile?.name));
  if ($('api-status')) $('api-status').setAttribute('aria-label', '연결 완료');
}

async function loadContext() {
  if (!state.gameId) { setHidden('player-setup-overlay', false); return; }
  render(await client.context(state.gameId)); if (!state.context.turns.length) await open();
}

async function open() {
  setStatus('오프닝을 불러오는 중입니다.'); state.busy = true;
  try { await consumeR3Sse(await client.opening(state.gameId), handleEvent); setStatus('다음 행동을 직접 입력하거나 제안 중 하나를 고르세요.'); }
  catch (error) { setStatus(error.message, true); } finally { state.busy = false; }
}

async function submit(value = null) {
  if (state.busy || !state.gameId) return;
  const input = $('player-action'); const literalAction = value ?? input?.value ?? '';
  if (!literalAction.trim()) { setStatus('다음 행동을 직접 입력해 주세요.', true); return; }
  state.busy = true; setStatus('Story를 생성하는 중입니다.'); if ($('current-story')) $('current-story').textContent = '';
  try {
    await consumeR3Sse(await client.turn(state.gameId, { action_id: crypto.randomUUID(), expected_turn: (state.context?.state?.committed_turn ?? 0) + 1, literal_action: literalAction }), handleEvent);
    if (input) input.value = ''; setStatus('저장되었습니다.');
  } catch (error) { setStatus(error.message, true); } finally { state.busy = false; }
}

function handleEvent(event, data) {
  if (event === 'story_delta' && $('current-story')) $('current-story').textContent += data.text ?? '';
  if (event === 'terminal' && data.status === 'committed') render(data.context);
}

async function setup(event) {
  event.preventDefault();
  const profile = {
    name: $('setup-name')?.value, department_id: $('setup-department')?.value, position_id: $('setup-position')?.value,
    age: Number($('setup-age')?.value), height_cm: Number($('setup-height')?.value), weight_kg: Number($('setup-weight')?.value),
    penis_length_cm: Number($('setup-penis-length')?.value), body_type_id: $('setup-body-type')?.value, speech_style_id: $('setup-speech-style')?.value
  };
  try { const created = await client.setup(profile); state.gameId = created.game?.game_id ?? created.game_id; history.replaceState(null, '', `?game_id=${encodeURIComponent(state.gameId)}`); setHidden('player-setup-overlay', true); await loadContext(); }
  catch (error) { const status = $('setup-status'); if (status) status.textContent = error.message; }
}

$('player-setup-form')?.addEventListener('submit', setup);
$('submit-action')?.addEventListener('click', () => submit());
$('player-action')?.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') submit(); });

async function loadCatalogs() { renderCatalogs(await client.catalogs()); }
loadCatalogs().then(loadContext).catch(error => setStatus(error.message, true));
