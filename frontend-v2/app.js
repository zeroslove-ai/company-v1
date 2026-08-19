const state = { gameId: new URLSearchParams(location.search).get('game_id'), expectedTurn: 1, actionId: null };
const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { 'content-type': 'application/json' }, ...options });
  const payload = await response.json();
  if (!payload.ok) throw new Error(payload.error?.message ?? '요청에 실패했습니다.');
  return payload.data;
}

async function boot() {
  if (!state.gameId) {
    const setup = await api('/api/v2/setup', { method: 'POST', body: JSON.stringify({ player_name: '플레이어' }) });
    state.gameId = setup.game.game_id;
    history.replaceState(null, '', `?game_id=${encodeURIComponent(state.gameId)}`);
    await api('/api/v2/opening', { method: 'POST', body: JSON.stringify({ game_id: state.gameId }) });
  }
  render(await api(`/api/v2/context?game_id=${encodeURIComponent(state.gameId)}`));
  $('status').textContent = '준비되었습니다.';
}

function render(context) {
  state.expectedTurn = context.state.committed_turn + 1;
  const latest = context.turns.at(-1);
  $('story').textContent = latest?.story_text ?? '';
  $('summary').textContent = latest?.turn_summary ?? '';
  $('choices').replaceChildren(...(latest?.choices ?? []).map((choice) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = choice; button.onclick = () => { $('action').value = choice; };
    item.append(button); return item;
  }));
  $('mind').replaceChildren(...Object.entries(latest?.mind_monitor ?? {}).flatMap(([id, value]) => {
    const term = document.createElement('dt'); term.textContent = id;
    const detail = document.createElement('dd'); detail.textContent = `${value.surface} ${value.subconscious}`;
    return [term, detail];
  }));
}

async function submit() {
  const literalAction = $('action').value;
  state.actionId = crypto.randomUUID();
  $('send').disabled = true;
  try {
    const response = await fetch('/api/v2/turn', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game_id: state.gameId, action_id: state.actionId, expected_turn: state.expectedTurn, literal_action: literalAction }) });
    if (response.headers.get('content-type')?.includes('text/event-stream')) await readStream(response);
    else render((await response.json()).data.context);
  } finally { $('send').disabled = false; }
}

async function readStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const part = await reader.read(); if (part.done) break;
    buffer += decoder.decode(part.value, { stream: true });
    for (const event of buffer.split('\n\n').slice(0, -1)) {
      const line = event.split('\n').find((value) => value.startsWith('data: '));
      if (!line) continue;
      const data = JSON.parse(line.slice(6));
      if (event.startsWith('event: story_delta')) $('story').textContent += data.text;
      if (event.startsWith('event: terminal') && data.status === 'committed') render(data.context);
    }
    buffer = buffer.slice(buffer.lastIndexOf('\n\n') + 2);
  }
}

$('send').addEventListener('click', () => submit().catch((error) => { $('status').textContent = error.message; }));
boot().catch((error) => { $('status').textContent = error.message; });
