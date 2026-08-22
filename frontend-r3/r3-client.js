function browserStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function createR3Client(base = '/api/r3', { storage = browserStorage(), fetchImpl = globalThis.fetch } = {}) {
  const root = base.replace(/\/$/, '');
  const capabilityKey = gameId => `company-r3:game-capability:${gameId}`;
  const saveCapability = (gameId, capability) => { if (storage && gameId && capability) storage.setItem(capabilityKey(gameId), capability); };
  const readCapability = gameId => storage?.getItem(capabilityKey(gameId)) ?? null;
  const authHeaders = (gameId, headers = {}) => {
    const capability = readCapability(gameId);
    if (!capability) throw new Error('r3_game_access_required');
    return { ...headers, authorization: `Bearer ${capability}` };
  };
  async function request(path, options = {}) {
    const response = await fetchImpl(path, { headers: { 'content-type': 'application/json', ...(options.headers ?? {}) }, ...options });
    const payload = await response.json();
    if (!response.ok || payload.ok === false) throw new Error(payload.data?.code ?? payload.data?.message ?? 'r3_request_failed');
    return payload.data;
  }
  return {
    catalogs() { return request(`${root}/catalogs`); },
    async setup(profile) {
      const created = await request(`${root}/games`, { method: 'POST', body: JSON.stringify({ profile }) });
      const gameId = created?.game?.game_id ?? created?.game_id;
      if (!created?.game_capability) throw new Error('r3_game_capability_missing');
      saveCapability(gameId, created.game_capability);
      return created;
    },
    context(gameId) { return request(`${root}/games/${encodeURIComponent(gameId)}/context`, { headers: authHeaders(gameId) }); },
    opening(gameId) { return fetchImpl(`${root}/games/${encodeURIComponent(gameId)}/opening`, { method: 'POST', headers: authHeaders(gameId) }); },
    turn(gameId, payload) { return fetchImpl(`${root}/games/${encodeURIComponent(gameId)}/turn`, { method: 'POST', headers: authHeaders(gameId, { 'content-type': 'application/json' }), body: JSON.stringify(payload) }); },
    feedback(gameId, payload) { return fetchImpl(`${root}/games/${encodeURIComponent(gameId)}/feedback`, { method: 'POST', headers: authHeaders(gameId, { 'content-type': 'application/json' }), body: JSON.stringify(payload) }); },
    csa(gameId, payload) { return request(`${root}/games/${encodeURIComponent(gameId)}/csa`, { method: 'POST', headers: authHeaders(gameId), body: JSON.stringify(payload) }); }
  };
}

export async function consumeR3Sse(response, onEvent) {
  if (!response.ok || !response.body) throw new Error('r3_stream_failed');
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let terminal = null;
  const streamError = (code, data = null) => { const error = new Error(code); error.code = code; if (data) error.terminal = data; return error; };
  const finishTerminal = async () => {
    await reader.cancel();
    if (terminal.status !== 'committed') throw streamError('r3_stream_failed', terminal);
    return terminal;
  };
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
    return event === 'terminal';
  };
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    buffer += decoder.decode(value, { stream: true }); const frames = buffer.split(/\r?\n\r?\n/); buffer = frames.pop() ?? '';
    for (const frame of frames) if (handleFrame(frame)) return finishTerminal();
  }
  handleFrame(buffer);
  if (!terminal) throw streamError('r3_stream_reconnect_required');
  return finishTerminal();
}
