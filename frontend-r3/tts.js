function text(value) { return typeof value === 'string' ? value.trim() : ''; }

function tone(direction = '') {
  if (/whisper|quiet|soft/iu.test(direction)) return 'whisper';
  if (/sad|tear|sigh/iu.test(direction)) return 'sad';
  if (/angry|shout|yell/iu.test(direction)) return 'angry';
  if (/happy|laugh|smile/iu.test(direction)) return 'happy';
  if (/nervous|tens|stammer/iu.test(direction)) return 'nervous';
  return 'neutral';
}

export function selectPrimaryTtsLines({ dialogueLines = [], presentActorIds = [], focalActorId = '' } = {}) {
  const present = new Set(Array.isArray(presentActorIds) ? presentActorIds : []);
  const lines = (Array.isArray(dialogueLines) ? dialogueLines : []).filter(line => present.has(line?.speaker_id) && text(line?.text)).sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  const focal = focalActorId && present.has(focalActorId) && lines.some(line => line.speaker_id === focalActorId) ? focalActorId : '';
  const counts = new Map();
  for (const line of lines) counts.set(line.speaker_id, (counts.get(line.speaker_id) ?? 0) + 1);
  const primary = focal || [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a))[0] || '';
  return primary ? lines.filter(line => line.speaker_id === primary) : [];
}

export function batchDialogueLines(lines) {
  const batches = []; let current = null;
  for (const line of Array.isArray(lines) ? lines : []) {
    const nextText = current ? `${current.text} ${line.text}` : line.text;
    const nextTone = tone(line.direction);
    if (current && current.speaker_id === line.speaker_id && current.tone === nextTone && nextText.length <= 350) {
      current.text = nextText; current.lines.push(line);
    } else {
      current = { speaker_id: line.speaker_id, speaker_name: line.speaker_name, direction: line.direction, tone: nextTone, text: line.text, lines: [line] };
      batches.push(current);
    }
  }
  return batches;
}

function browserStorage(storage) {
  if (storage !== undefined) return storage;
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function createCompanyTts({ documentRef = globalThis.document, api, getViewModel = () => null, getCommittedTurnIdentity = () => '', storage } = {}) {
  const store = browserStorage(storage);
  const toggle = documentRef?.getElementById?.('tts-toggle');
  const replay = documentRef?.getElementById?.('tts-replay');
  const status = documentRef?.getElementById?.('tts-status');
  const audio = documentRef?.getElementById?.('audio-player') ?? documentRef?.createElement?.('audio');
  if (audio && !audio.id) audio.id = 'audio-player';
  let enabled = store?.getItem?.('autoTts') === 'true';
  let activeIdentity = ''; let queue = []; let lastBatch = null; let requestNo = 0;
  const cache = new Map();
  function setStatus(value) { if (status) status.textContent = value || ''; }
  function stop() { requestNo += 1; queue = []; audio?.pause?.(); if (audio) audio.removeAttribute?.('src'); setStatus(''); }
  function currentIdentity() { return String(getCommittedTurnIdentity?.() ?? ''); }
  async function playBatch(batch, identity, replayOnly = false) {
    if (!enabled || identity !== currentIdentity()) return;
    const key = `${batch.speaker_id}:${batch.text}`;
    let url = cache.get(key);
    if (!url && replayOnly) return;
    const requestId = ++requestNo;
    try {
      if (!url) {
        const result = await api.tts({ speaker_id: batch.speaker_id, character_id: batch.speaker_id, text: batch.text, direction: batch.direction ?? '' });
        url = result?.url;
        if (url) cache.set(key, url);
      }
      if (!url || requestId !== requestNo || identity !== currentIdentity() || !enabled) return;
      if (!audio) return;
      audio.src = url; audio.currentTime = 0; setStatus('Playing character dialogue');
      await audio.play?.();
    } catch { if (requestId === requestNo) setStatus('Voice unavailable'); }
  }
  async function drain(identity) {
    while (enabled && identity === currentIdentity() && queue.length) {
      const batch = queue.shift(); lastBatch = batch; await playBatch(batch, identity);
    }
  }
  function onCommittedTurn() {
    const view = getViewModel?.(); const identity = currentIdentity();
    if (!enabled || !view || identity === activeIdentity) return;
    activeIdentity = identity; stop();
    const lines = selectPrimaryTtsLines({ dialogueLines: view.dialogue_lines ?? view.media?.dialogue_lines, presentActorIds: view.scene?.present_actor_ids, focalActorId: view.scene?.focal_actor?.id });
    queue = batchDialogueLines(lines); void drain(identity);
  }
  function setEnabled(value) {
    enabled = Boolean(value); store?.setItem?.('autoTts', enabled ? 'true' : 'false');
    if (!enabled) stop(); else { activeIdentity = ''; onCommittedTurn(); }
    if (toggle) { toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false'); toggle.disabled = !getViewModel?.()?.story; }
  }
  toggle?.addEventListener('click', () => setEnabled(!enabled));
  replay?.addEventListener('click', () => { const identity = currentIdentity(); if (lastBatch) void playBatch(lastBatch, identity, true); });
  if (audio) audio.addEventListener?.('ended', () => { if (enabled) void drain(activeIdentity); });
  return { onCommittedTurn, setEnabled, stop, get state() { return { enabled, activeIdentity, cacheSize: cache.size }; } };
}
