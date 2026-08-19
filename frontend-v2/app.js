import { V2_API_BASE_URL } from './config.js';

const state = { gameId: new URLSearchParams(location.search).get('game_id'), expectedTurn: 1, actionId: null, retryFailed: false, pendingLiteralAction: '' };
const $ = (id) => document.getElementById(id);
const apiUrl = (path) => `${V2_API_BASE_URL.replace(/\/$/, '')}${path}`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, options = {}) { return fetch(apiUrl(path), { headers: { 'content-type': 'application/json' }, ...options }); }
async function api(path, options = {}) { const response = await request(path, options); const payload = await response.json(); if (!payload.ok) throw new Error(payload.error?.message ?? payload.error?.code ?? '요청에 실패했습니다.'); return payload.data; }

async function boot() {
  setStatus('게임 화면을 불러오는 중입니다.');
  if (!state.gameId) {
    const setup = await api('/api/v2/setup', { method: 'POST', body: JSON.stringify({ player_name: '플레이어' }) });
    state.gameId = setup.game.game_id;
    history.replaceState(null, '', `?game_id=${encodeURIComponent(state.gameId)}`);
    await api('/api/v2/opening', { method: 'POST', body: JSON.stringify({ game_id: state.gameId }) });
  }
  const context = await api(`/api/v2/context?game_id=${encodeURIComponent(state.gameId)}`);
  render(context);
  if (context.job?.status === 'processing') await reconnect(context.job);
  setStatus('서버와 연결되었습니다.');
}

function setStatus(message, error = false) { const node = $('status-banner'); if (node) { node.textContent = message; node.classList.toggle('error', error); } const apiStatus = $('api-status'); if (apiStatus) { apiStatus.dataset.state = error ? 'error' : 'ready'; apiStatus.setAttribute('aria-label', error ? '연결 오류' : '연결됨'); } }

function render(context) {
  state.expectedTurn = context.state.committed_turn + 1;
  state.retryFailed = context.job?.status === 'failed';
  const latest = context.turns.at(-1);
  $('turn-number').textContent = `Turn ${context.state.committed_turn}`;
  $('day-time').textContent = `Day ${context.state.state.time.day} · ${formatClock(context.state.state.time.minute)}`;
  $('current-action').hidden = !context.job?.literal_action;
  $('current-action').textContent = context.job?.literal_action ?? '';
  renderHistory(context.turns, context.job);
  renderStory(context.job?.status === 'processing' ? (context.job.story_text ?? '') : '');
  renderState(context, latest);
  renderCatalog(context);
  const failed = context.job?.status === 'failed';
  $('recovery-action').hidden = !failed;
  $('recovery-action').textContent = failed ? '실패한 행동 다시 시도' : '';
  if (failed) $('player-action').value = context.job.literal_action ?? state.pendingLiteralAction;
}

function renderHistory(turns, job) {
  const root = $('story-history');
  root.replaceChildren(...turns.map((turn) => { const article = document.createElement('article'); article.className = 'story-entry'; const label = document.createElement('p'); label.className = 'turn-label'; label.textContent = `Turn ${turn.turn_number || 'Opening'}`; const action = document.createElement('p'); action.className = 'action-chip'; action.textContent = turn.literal_action || 'Opening'; const text = document.createElement('p'); text.className = 'story-text'; text.textContent = turn.story_text; article.append(label, action, text); return article; }));
  if (job?.status === 'processing' && job.story_text) { const progress = document.createElement('p'); progress.className = 'stream-progress'; progress.textContent = '현재 이야기를 이어 쓰는 중입니다…'; root.append(progress); }
}
function renderStory(text) { $('current-story').textContent = text; }

function renderState(context, latest) {
  const scene = context.state.state.scene ?? {};
  const player = context.state.state.player ?? {};
  const names = new Map((context.catalog?.npcs ?? []).map((npc) => [npc.id, npc.name]));
  const location = context.catalog?.locations?.find((item) => item.id === scene.location_id);
  $('scene-state').replaceChildren(...[['장소', location?.name ?? scene.location_id ?? '확인 중'], ['장소 ID', scene.location_id || '확인 중'], ['현재 인물', (scene.present_npc_ids ?? []).map((id) => names.get(id) ?? id).join(', ') || '아직 없음']].flatMap(pair));
  $('player-situation').replaceChildren(...[['이름', player.name || '플레이어'], ['경험치', String(player.exp ?? 0)], ['입력', '자유 입력으로 다음 행동을 결정']].flatMap(pair));
  const monitor = latest?.mind_monitor ?? {};
  $('mind-monitor').replaceChildren(...Object.entries(monitor).map(([id, value]) => { const card = document.createElement('article'); card.className = 'mind-card'; const title = document.createElement('h3'); title.textContent = names.get(id) ?? id; const surface = document.createElement('p'); surface.textContent = value?.surface ?? ''; const subconscious = document.createElement('p'); subconscious.textContent = value?.subconscious ?? ''; card.append(title, surface, subconscious); return card; }));
  if (!Object.keys(monitor).length) { const empty = document.createElement('p'); empty.textContent = '현재 기록된 Mind Monitor가 없습니다.'; $('mind-monitor').append(empty); }
}

function renderCatalog(context) {
  const npcs = context.catalog?.npcs ?? [];
  $('character-catalog').replaceChildren(...npcs.filter((npc) => (context.state.state.scene.present_npc_ids ?? []).includes(npc.id)).map((npc) => { const item = document.createElement('li'); item.textContent = `${npc.name} · ${npc.role ?? npc.department ?? npc.kind}`; return item; }));
  if (!$('character-catalog').children.length) { const item = document.createElement('li'); item.textContent = '현재 장면에 확정된 인물이 없습니다.'; $('character-catalog').append(item); }
  const locations = context.catalog?.locations ?? [];
  $('company-map').replaceChildren(...locations.map((location) => { const item = document.createElement('li'); item.dataset.locationId = location.id; const title = document.createElement('strong'); title.textContent = location.name; const detail = document.createElement('span'); detail.textContent = location.description; item.append(title, detail); return item; }));
  const app = context.catalog?.app; if (app) { $('app-heading').textContent = app.name; $('app-description').textContent = app.description; }
}

function pair([termText, valueText]) { const term = document.createElement('dt'); term.textContent = termText; const value = document.createElement('dd'); value.textContent = valueText; return [term, value]; }
function formatClock(minutes) { const value = Number.isInteger(minutes) ? minutes : 540; return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; }
async function reconnect(job) { setStatus('진행 중인 작업을 다시 확인하고 있습니다.'); for (let attempt = 0; attempt < 120; attempt += 1) { const context = await api(`/api/v2/context?game_id=${encodeURIComponent(state.gameId)}`); render(context); if (context.job?.status !== 'processing') return context; await wait(250); } setStatus('서버 작업이 아직 진행 중입니다. 잠시 후 다시 확인해 주세요.', true); return null; }

async function submit() {
  const literalAction = $('player-action').value;
  if (!literalAction.trim()) { setStatus('다음 행동을 직접 입력해 주세요.', true); return; }
  state.pendingLiteralAction = literalAction; state.actionId = crypto.randomUUID(); $('submit-action').disabled = true; setStatus('이야기를 생성하고 저장하는 중입니다.');
  try { const response = await request('/api/v2/turn', { method: 'POST', body: JSON.stringify({ game_id: state.gameId, action_id: state.actionId, expected_turn: state.expectedTurn, retry_failed: state.retryFailed, literal_action: literalAction }) }); if (response.headers.get('content-type')?.includes('text/event-stream')) { const terminal = await readStream(response); if (!terminal) await reconnect({}); } else { const payload = await response.json(); if (!payload.ok) throw new Error(payload.error?.message ?? payload.error?.code ?? '이야기 생성에 실패했습니다.'); render(payload.data.context ?? await api(`/api/v2/context?game_id=${encodeURIComponent(state.gameId)}`)); if (payload.data.job?.status === 'processing') await reconnect(payload.data.job); } } catch (error) { setStatus(error.message, true); } finally { $('submit-action').disabled = false; }
}

async function readStream(response) { const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let terminal = false; while (true) { const part = await reader.read(); if (part.done) break; buffer += decoder.decode(part.value, { stream: true }); const events = buffer.split('\n\n'); buffer = events.pop() ?? ''; for (const event of events) { const line = event.split(/\r?\n/).find((value) => value.startsWith('data: ')); if (!line) continue; const data = JSON.parse(line.slice(6)); if (event.startsWith('event: story_delta')) $('current-story').textContent += data.text; if (event.startsWith('event: terminal')) { terminal = true; if (data.status === 'committed') { render(data.context); $('player-action').value = ''; setStatus('저장되었습니다.'); } if (data.status === 'failed') { render(data.context ?? await api(`/api/v2/context?game_id=${encodeURIComponent(state.gameId)}`)); setStatus(`턴 실패: ${data.error_code ?? 'turn_failed'}. 같은 행동을 명시적으로 다시 시도할 수 있습니다.`, true); } } } } return terminal; }

$('submit-action').addEventListener('click', () => submit());
$('recovery-action').addEventListener('click', () => submit());
boot().catch((error) => setStatus(error.message, true));
