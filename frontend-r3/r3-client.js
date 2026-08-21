async function request(path, options = {}) {
  const response = await fetch(path, { headers: { 'content-type': 'application/json', ...(options.headers ?? {}) }, ...options });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) throw new Error(payload.data?.code ?? payload.data?.message ?? 'r3_request_failed');
  return payload.data;
}

export function createR3Client(base = '/api/r3') {
  const root = base.replace(/\/$/, '');
  return {
    catalogs() { return request(`${root}/catalogs`); },
    setup(profile) { return request(`${root}/games`, { method: 'POST', body: JSON.stringify({ profile }) }); },
    context(gameId) { return request(`${root}/games/${encodeURIComponent(gameId)}/context`); },
    opening(gameId) { return fetch(`${root}/games/${encodeURIComponent(gameId)}/opening`, { method: 'POST' }); },
    turn(gameId, payload) { return fetch(`${root}/games/${encodeURIComponent(gameId)}/turn`, { method: 'POST', body: JSON.stringify(payload) }); }
    ,csa(gameId, payload) { return request(`${root}/games/${encodeURIComponent(gameId)}/csa`, { method: 'POST', body: JSON.stringify(payload) }); }
  };
}

export async function consumeR3Sse(response, onEvent) {
  if (!response.ok || !response.body) throw new Error('r3_stream_failed');
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let terminal = null;
  const streamError = (code, data = null) => { const error = new Error(code); error.code = code; if (data) error.terminal = data; return error; };
  const handleFrame = frame => {
    if (!frame.trim()) return;
    const event = frame.match(/^event:\s*(.+)$/m)?.[1]; const dataText = frame.match(/^data:\s*(.+)$/m)?.[1];
    if (!event || !dataText) return;
    let data; try { data = JSON.parse(dataText); } catch { throw streamError('r3_stream_frame_invalid'); }
    if (event === 'terminal') {
      if (terminal) throw streamError('r3_stream_terminal_duplicate', data);
      if (!data || !['committed', 'failed'].includes(data.status)) throw streamError('r3_stream_terminal_invalid', data);
      terminal = data;
    }
    onEvent(event, data);
  };
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    buffer += decoder.decode(value, { stream: true }); const frames = buffer.split(/\r?\n\r?\n/); buffer = frames.pop() ?? '';
    for (const frame of frames) handleFrame(frame);
  }
  handleFrame(buffer);
  if (!terminal) throw streamError('r3_stream_reconnect_required');
  if (terminal.status !== 'committed') throw streamError('r3_stream_failed', terminal);
  return terminal;
}
