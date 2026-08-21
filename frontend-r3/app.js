import { consumeR3Sse, createR3Client } from './r3-client.js';
import { buildR3ViewModel } from './r3-view-model.js';

const client = createR3Client(new URLSearchParams(location.search).get('api') || '/api/r3');
const state = { gameId: new URLSearchParams(location.search).get('game_id'), context: null, catalogs: null, busy: false };
const $ = id => document.querySelector(`#${id}`);
function setStatus(message, error = false) { const node = $('status-banner'); if (node) { node.textContent = message; node.dataset.error = error ? 'true' : 'false'; } }
function setHidden(id, hidden) { const node = $(id); if (node) node.hidden = hidden; }
function fillSelect(id, items, key) { const node = $(id); if (!node) return; node.replaceChildren(...items.map(item => { const option = document.createElement('option'); option.value = item[key]; option.textContent = item.ui_hint ? `${item.name} (${item.ui_hint})` : item.name; return option; })); }

function renderMap(catalogs) {
  const map = $('company-map'); if (!map) return;
  const locations = catalogs.locations ?? []; const currentId = state.context?.state?.state?.scene?.location_id; const current = locations.find(location => location.location_id === currentId); const actorById = new Map((catalogs.actors ?? []).map(actor => [actor.id, actor]));
  const byFloor = new Map(); for (const location of locations) { if (!byFloor.has(location.floor)) byFloor.set(location.floor, []); byFloor.get(location.floor).push(location); }
  map.replaceChildren(); const currentCard = document.createElement('div'); currentCard.className = 'company-map-current'; const kicker = document.createElement('span'); kicker.className = 'company-map-current-kicker'; kicker.textContent = '현재 위치'; const currentName = document.createElement('strong'); currentName.className = 'company-map-current-name'; currentName.textContent = current?.name ?? '확인 중'; const currentScene = document.createElement('span'); currentScene.className = 'company-map-current-scene'; currentScene.textContent = current?.description ?? '현재 장면을 불러오는 중입니다.'; currentCard.append(kicker, currentName, currentScene); map.append(currentCard);
  const currentFloor = current?.floor;
  for (const [floor, floorLocations] of [...byFloor.entries()].sort((a, b) => a[0] - b[0])) {
    const details = document.createElement('details'); details.className = `company-map-floor${floor === currentFloor ? ' is-current-floor' : ''}`; details.open = floor === currentFloor;
    const summary = document.createElement('summary'); summary.className = 'company-map-floor-summary'; const number = document.createElement('span'); number.className = 'company-map-floor-number'; number.textContent = `${floor}층`; const title = document.createElement('span'); title.className = 'company-map-floor-title'; title.textContent = '회사 공간'; const count = document.createElement('span'); count.className = 'company-map-floor-count'; count.textContent = `${floorLocations.length}곳`; summary.append(number, title, count); details.append(summary);
    const grid = document.createElement('div'); grid.className = 'company-map-floor-grid';
    for (const location of floorLocations) {
      const place = document.createElement('article'); place.className = 'company-map-place'; const head = document.createElement('div'); head.className = 'company-map-place-head';
      const button = document.createElement('button'); button.type = 'button'; button.className = 'company-map-place-name'; button.textContent = location.name; button.addEventListener('click', () => { const input = $('player-action'); if (input) { input.value = `${location.name}으로 이동한다.`; input.focus(); } });
      const type = document.createElement('span'); type.className = 'company-map-place-type'; type.textContent = location.location_type ?? ''; head.append(button, type); place.append(head);
      const description = document.createElement('p'); description.className = 'company-map-place-description'; description.textContent = location.description ?? ''; place.append(description);
      const people = document.createElement('div'); people.className = 'company-map-people'; for (const actorId of location.default_npc_ids ?? []) { const actor = actorById.get(actorId); if (actor) { const chip = document.createElement('span'); chip.className = 'company-map-npc'; chip.textContent = actor.name; people.append(chip); } } if (!people.childElementCount) { const empty = document.createElement('span'); empty.className = 'company-map-no-people'; empty.textContent = '현재 표시할 인물 없음'; people.append(empty); } place.append(people); grid.append(place);
    }
    details.append(grid); map.append(details);
  }
}

function renderCatalogs(catalogs) { state.catalogs = catalogs; fillSelect('setup-department', catalogs.departments ?? [], 'department_id'); fillSelect('setup-position', catalogs.positions ?? [], 'position_id'); fillSelect('setup-body-type', catalogs.body_types ?? [], 'body_type_id'); fillSelect('setup-speech-style', catalogs.speech_styles ?? [], 'speech_style_id'); renderMap(catalogs); }

function renderMindMonitor(view) {
  const root = $('mind-monitor'); if (!root) return; root.replaceChildren();
  const tabs = document.createElement('div'); tabs.className = 'mind-monitor-tabs'; const content = document.createElement('div'); content.className = 'mind-monitor-content'; const body = document.createElement('div'); body.className = 'mind-monitor-body';
  const renderMode = mode => { body.replaceChildren(); if (!view.mindMonitor.length) { const empty = document.createElement('p'); empty.className = 'mind-monitor-empty'; empty.textContent = '현재 기록된 Mind Monitor가 없습니다.'; body.append(empty); } else for (const monitor of view.mindMonitor) { const card = document.createElement('article'); card.className = 'mind-card'; const name = document.createElement('h3'); name.className = 'mind-monitor-name'; name.textContent = monitor.name; const line = document.createElement('p'); line.textContent = mode === 'surface' ? `표면: ${monitor.surface ?? '기록 없음'}` : `내면: ${monitor.subconscious ?? '기록 없음'}`; card.append(name, line); body.append(card); } };
  for (const [key, label] of [['surface', '표면'], ['subconscious', '내면']]) { const tab = document.createElement('button'); tab.type = 'button'; tab.className = 'mind-monitor-tab'; tab.dataset.tab = key; tab.setAttribute('aria-selected', key === 'surface' ? 'true' : 'false'); tab.textContent = label; tab.addEventListener('click', () => { tabs.querySelectorAll('.mind-monitor-tab').forEach(item => item.setAttribute('aria-selected', item === tab ? 'true' : 'false')); renderMode(key); }); tabs.append(tab); }
  renderMode('surface'); content.append(body); root.append(tabs, content);
}

function render(context) {
  state.context = context; const view = buildR3ViewModel(context, state.catalogs ?? {}); if (state.catalogs) renderMap(state.catalogs);
  if ($('turn-number')) $('turn-number').textContent = `Turn ${view.committedTurn}`;
  if ($('day-time')) $('day-time').textContent = `Day ${view.time.day ?? 1} · ${String(Math.floor((view.time.minute ?? 0) / 60)).padStart(2, '0')}:${String((view.time.minute ?? 0) % 60).padStart(2, '0')}`;
  if ($('current-story')) $('current-story').textContent = view.job?.status === 'processing' ? (view.job.story_text ?? '') : '';
  if ($('story-history')) $('story-history').replaceChildren(...view.history.map(turn => { const article = document.createElement('article'); article.className = 'story-card'; const label = document.createElement('p'); label.className = 'turn-label'; label.textContent = `Turn ${turn.turn_number}`; const action = document.createElement('p'); action.className = 'action-chip'; action.textContent = turn.literal_action || 'Opening'; const text = document.createElement('p'); text.className = 'story-text'; text.textContent = turn.story_text; article.append(label, action, text); return article; }));
  if ($('choice-list')) $('choice-list').replaceChildren(...view.choices.slice(0, 4).map(choice => { const button = document.createElement('button'); button.type = 'button'; button.className = 'choice-button'; button.textContent = choice; button.addEventListener('click', () => submit(choice)); return button; }));
  if ($('scene-state')) $('scene-state').replaceChildren(...[['장소', view.scene.location?.name || '확인되지 않음'], ['현재 인물', view.scene.present_actors.map(actor => actor.name).join(', ') || '아직 없음'], ['장면 메모', view.scene.scene_note || '기록 없음']].flatMap(([label, value]) => { const term = document.createElement('dt'); term.textContent = label; const detail = document.createElement('dd'); detail.textContent = value; return [term, detail]; }));
  if ($('player-situation')) $('player-situation').replaceChildren(...[['이름', view.profile.name], ['부서', view.profile.department || view.profile.department_id], ['직급', view.profile.position || view.profile.position_id], ['나이', view.profile.age], ['키', view.profile.height_cm], ['몸무게', view.profile.weight_kg], ['말투', view.profile.speech_style || view.profile.speech_style_id]].flatMap(([label, value]) => { const term = document.createElement('dt'); term.textContent = label; const detail = document.createElement('dd'); detail.textContent = value ?? ''; return [term, detail]; }));
  renderMindMonitor(view);
  setHidden('player-setup-overlay', Boolean(view.profile?.name)); if ($('api-status')) $('api-status').setAttribute('aria-label', '연결 완료');
}

async function loadContext() { if (!state.gameId) { setHidden('player-setup-overlay', false); return; } render(await client.context(state.gameId)); if (!state.context.turns.length) await open(); }
async function open() { setStatus('오프닝을 불러오는 중입니다.'); state.busy = true; try { await consumeR3Sse(await client.opening(state.gameId), handleEvent); setStatus('다음 행동을 직접 입력하거나 제안 중 하나를 고르세요.'); } catch (error) { setStatus(error.message, true); } finally { state.busy = false; } }
async function submit(value = null) { if (state.busy || !state.gameId) return; const input = $('player-action'); const literalAction = value ?? input?.value ?? ''; if (!literalAction.trim()) { setStatus('다음 행동을 직접 입력해 주세요.', true); return; } state.busy = true; setStatus('Story를 생성하는 중입니다.'); if ($('current-story')) $('current-story').textContent = ''; try { await consumeR3Sse(await client.turn(state.gameId, { action_id: crypto.randomUUID(), expected_turn: (state.context?.state?.committed_turn ?? 0) + 1, literal_action: literalAction }), handleEvent); if (input) input.value = ''; setStatus('저장되었습니다.'); } catch (error) { setStatus(error.message, true); } finally { state.busy = false; } }
function handleEvent(event, data) { if (event === 'story_delta' && $('current-story')) $('current-story').textContent += data.text ?? ''; if (event === 'terminal' && data.status === 'committed') render(data.context); }
async function setup(event) { event.preventDefault(); const profile = { name: $('setup-name')?.value, department_id: $('setup-department')?.value, position_id: $('setup-position')?.value, age: Number($('setup-age')?.value), height_cm: Number($('setup-height')?.value), weight_kg: Number($('setup-weight')?.value), penis_length_cm: Number($('setup-penis-length')?.value), body_type_id: $('setup-body-type')?.value, speech_style_id: $('setup-speech-style')?.value }; try { const created = await client.setup(profile); state.gameId = created.game?.game_id ?? created.game_id; history.replaceState(null, '', `?game_id=${encodeURIComponent(state.gameId)}`); setHidden('player-setup-overlay', true); await loadContext(); } catch (error) { const status = $('setup-status'); if (status) status.textContent = error.message; } }
$('player-setup-form')?.addEventListener('submit', setup); $('submit-action')?.addEventListener('click', () => submit()); $('player-action')?.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') submit(); });
async function loadCatalogs() { renderCatalogs(await client.catalogs()); }
loadCatalogs().then(loadContext).catch(error => setStatus(error.message, true));
