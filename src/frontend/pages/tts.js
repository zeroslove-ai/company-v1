function toneGroup(direction = '') {
  if (/속삭|낮은 목소리/.test(direction)) return 'whisper';
  if (/울먹|슬픈|눈물/.test(direction)) return 'sad';
  if (/분노|화난|날카/.test(direction)) return 'angry';
  if (/밝게|장난|웃/.test(direction)) return 'happy';
  if (/긴장|떨림|머뭇/.test(direction)) return 'nervous';
  return 'neutral';
}

export function selectPrimaryTtsLines({ dialogueLines = [], presentNpcIds = [], selectedCharacterId = '', focalCharacterId = '' } = {}) {
  const present = new Set(Array.isArray(presentNpcIds) ? presentNpcIds : []);
  const lines = (Array.isArray(dialogueLines) ? dialogueLines : [])
    .filter(line => typeof line?.speaker_id === 'string' && present.has(line.speaker_id) && typeof line.text === 'string' && line.text.trim())
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  const preferred = [selectedCharacterId, focalCharacterId].filter(id => present.has(id));
  let speaker = preferred.find(id => lines.some(line => line.speaker_id === id));
  if (!speaker) {
    const counts = new Map();
    for (const line of lines) counts.set(line.speaker_id, (counts.get(line.speaker_id) ?? 0) + 1);
    speaker = lines.find(line => line.speaker_id === [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a))[0])?.speaker_id;
  }
  return speaker ? lines.filter(line => line.speaker_id === speaker) : [];
}

export function batchDialogueLines(lines) {
  const batches = [];
  let current = null;
  for (const line of Array.isArray(lines) ? lines : []) {
    const tone = toneGroup(line.direction);
    const merged = current ? `${current.text} ${line.text}` : line.text;
    const speakerId = line.speaker_id ?? line.character_id;
    if (current && current.character_id === speakerId && current.tone === tone && merged.length <= 350) {
      current.text = merged; current.lines.push(line);
    } else {
      current = { speaker: line.speaker_name ?? line.speaker, character_id: speakerId, tone, direction: line.direction, text: line.text, lines: [line] };
      batches.push(current);
    }
  }
  return batches;
}

function storageValue(storage, key, fallback) {
  try { return storage?.getItem?.(key) ?? fallback; } catch { return fallback; }
}

export function createCompanyTts({
  api,
  documentRef = globalThis.document,
  storage = globalThis.localStorage,
  gameId = '',
  getViewModel = () => null,
  getSelectedMindCharacterId = () => '',
  getCommittedTurnIdentity = () => '',
  onStatus = () => {}
} = {}) {
  const audio = documentRef?.getElementById?.('audio-player') ?? documentRef?.createElement?.('audio');
  if (audio && !audio.id) { audio.id = 'audio-player'; documentRef.body?.append?.(audio); }
  const toggle = documentRef?.getElementById?.('tts-toggle');
  const replayButton = documentRef?.getElementById?.('tts-replay');
  const status = documentRef?.getElementById?.('tts-status');
  const queuedKeys = new Set();
  const completedKeys = new Set();
  const cachedAudioUrls = new Map();
  const queue = [];
  let inFlightKey = null;
  let drainPromise = null;
  let generation = 0;
  let playing = false;
  let enabled = storageValue(storage, 'autoTts', 'true') !== 'false';

  function show(message, error = false) {
    if (status) { status.textContent = message; status.classList?.toggle?.('error', error); }
    onStatus?.(message);
  }
  function updateToggle() {
    toggle?.setAttribute?.('aria-pressed', String(enabled));
    if (toggle) toggle.textContent = enabled ? '🔊' : '🔇';
  }
  function currentLines() {
    const vm = getViewModel?.();
    return selectPrimaryTtsLines({ dialogueLines: vm?.media?.dialogue_lines, presentNpcIds: vm?.scene?.present_npc_ids ?? [], selectedCharacterId: getSelectedMindCharacterId?.(), focalCharacterId: vm?.focal_character?.id });
  }
  function batches() { return batchDialogueLines(currentLines()); }
  function keyFor(batch, identity = getCommittedTurnIdentity()) { return `${identity}|${batch.character_id}|${batch.text}`; }
  function updateReplay() {
    const latest = batches().at(-1);
    const playable = Boolean(latest && enabled);
    if (replayButton) { replayButton.hidden = !latest; replayButton.disabled = !playable; replayButton.title = playable ? '최근 대사 다시 재생' : (latest ? 'TTS가 꺼져 있습니다.' : '재생할 대사가 없습니다.'); }
  }
  function primeAudio() {
    if (!audio) return Promise.resolve(false);
    try {
      audio.muted = true; audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAA=';
      return Promise.resolve(audio.play?.()).then(() => { audio.pause?.(); audio.currentTime = 0; audio.muted = false; return true; }).catch(() => { audio.muted = false; return false; });
    } catch { audio.muted = false; return Promise.resolve(false); }
  }
  function terminalPlayback() {
    if (!audio || typeof audio.addEventListener !== 'function') return Promise.resolve();
    return new Promise(resolve => {
      let settled = false;
      const finish = () => { if (settled) return; settled = true; for (const type of ['ended', 'error', 'abort', 'emptied']) audio.removeEventListener?.(type, finish); resolve(); };
      for (const type of ['ended', 'error', 'abort', 'emptied']) audio.addEventListener(type, finish, { once: true });
    });
  }
  function stop() {
    generation += 1; queue.length = 0; queuedKeys.clear(); inFlightKey = null; playing = false;
    audio?.pause?.(); if (audio) { audio.currentTime = 0; audio.removeAttribute?.('src'); audio.load?.(); }
    show(''); updateReplay();
  }
  function setEnabled(value) {
    enabled = Boolean(value); try { storage?.setItem?.('autoTts', String(enabled)); } catch { /* storage unavailable */ }
    if (!enabled) stop(); else { updateToggle(); show('TTS가 켜졌습니다.'); }
    updateToggle();
  }
  function removeSupersededRevisionJobs(turnNumber, currentIdentity) {
    for (let index = queue.length - 1; index >= 0; index -= 1) {
      const job = queue[index];
      if (job.turnNumber === turnNumber && job.identity !== currentIdentity) {
        queuedKeys.delete(job.key); queue.splice(index, 1);
      }
    }
  }
  function removeStaleTurnJobs(turnNumber) {
    for (let index = queue.length - 1; index >= 0; index -= 1) {
      const job = queue[index];
      if (job.turnNumber !== turnNumber) {
        queuedKeys.delete(job.key); queue.splice(index, 1);
      }
    }
  }
  async function playJob(job) {
    const result = job.url ? { url: job.url } : await api.tts({ game_id: gameId, character_id: job.batch.character_id, text: job.batch.text, direction: job.batch.direction || '자연스럽게' });
    if (job.generation !== generation || !enabled || !result?.url || !audio) return false;
    audio.src = result.url; cachedAudioUrls.set(job.key, result.url); show('음성을 재생하는 중입니다.');
    await audio.play?.(); await terminalPlayback();
    if (job.generation !== generation || !enabled) return false;
    completedKeys.add(job.key); return true;
  }
  function drain() {
    if (drainPromise) return drainPromise;
    playing = true;
    drainPromise = (async () => {
      try {
        while (queue.length) {
          const job = queue.shift(); queuedKeys.delete(job.key);
          if (!enabled) continue;
          inFlightKey = job.key;
          try { await playJob(job); } catch (error) { show('TTS 재생에 실패했습니다.', true); }
          if (inFlightKey === job.key) inFlightKey = null;
        }
      } finally { playing = false; updateReplay(); }
    })().finally(() => { drainPromise = null; });
    return drainPromise;
  }
  function enqueue(batch, identity, turnNumber, url = null, { replay = false } = {}) {
    const key = keyFor(batch, identity);
    if (queuedKeys.has(key) || inFlightKey === key || (completedKeys.has(key) && !replay)) return false;
    queuedKeys.add(key); queue.push({ key, batch, identity, turnNumber, url, generation }); void drain(); return true;
  }
  function onCommittedTurn() {
    if (!enabled) { updateReplay(); return false; }
    const identity = getCommittedTurnIdentity();
    const viewModel = getViewModel?.();
    const turnNumber = viewModel?.turn?.committed_turn ?? viewModel?.turn?.turn_number ?? null;
    removeSupersededRevisionJobs(turnNumber, identity);
    removeStaleTurnJobs(turnNumber);
    for (const batch of batches()) enqueue(batch, identity, turnNumber, cachedAudioUrls.get(keyFor(batch, identity)) ?? null);
    updateReplay(); return true;
  }
  function replayLatest() {
    if (!enabled) { show('TTS가 꺼져 있어 재생할 수 없습니다.'); updateReplay(); return false; }
    void primeAudio();
    const batch = batches().at(-1); if (!batch) { updateReplay(); return false; }
    const identity = getCommittedTurnIdentity();
    const turnNumber = getViewModel?.()?.turn?.committed_turn ?? getViewModel?.()?.turn?.turn_number ?? null;
    const cached = cachedAudioUrls.get(keyFor(batch, identity)); enqueue(batch, identity, turnNumber, cached ?? null, { replay: Boolean(cached) }); updateReplay(); return true;
  }
  toggle?.addEventListener?.('click', () => { const next = !enabled; setEnabled(next); if (next) void primeAudio(); });
  replayButton?.addEventListener?.('click', () => { void replayLatest(); });
  updateToggle(); updateReplay();
  return { onCommittedTurn, replayLatest, primeAudio, setEnabled, stop, drain, queue, get state() { return { queuedKeys, inFlightKey, completedKeys, cachedAudioUrls, enabled, generation }; } };
}
