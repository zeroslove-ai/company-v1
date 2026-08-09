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
  const lines = (Array.isArray(dialogueLines) ? dialogueLines : []).filter(line => typeof line?.speaker_id === 'string' && present.has(line.speaker_id) && typeof line.text === 'string' && line.text.trim()).sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  const candidates = [selectedCharacterId, focalCharacterId].filter(id => present.has(id));
  let speaker = candidates.find(id => lines.some(line => line.speaker_id === id));
  if (!speaker) {
    const counts = new Map();
    for (const line of lines) counts.set(line.speaker_id, (counts.get(line.speaker_id) ?? 0) + 1);
    speaker = lines.find(line => line.speaker_id === [...counts.keys()].sort((a, b) => (counts.get(b) - counts.get(a)))[0])?.speaker_id;
  }
  return speaker ? lines.filter(line => line.speaker_id === speaker) : [];
}

export function batchDialogueLines(lines) {
  const batches = [];
  let current = null;
  for (const line of Array.isArray(lines) ? lines : []) {
    const tone = toneGroup(line.direction);
    const merged = current ? `${current.text} ${line.text}` : line.text;
    if (current && current.character_id === line.speaker_id && current.tone === tone && merged.length <= 350) {
      current.text = merged; current.lines.push(line);
    } else {
      current = { speaker: line.speaker_name, character_id: line.speaker_id, tone, direction: line.direction, text: line.text, lines: [line] };
      batches.push(current);
    }
  }
  return batches;
}

export function createCompanyTts({ api, documentRef = globalThis.document, gameId = '', getViewModel = () => null, getSelectedMindCharacterId = () => '', getCommittedTurnIdentity = () => '', getTtsEnabled = () => true } = {}) {
  const audio = documentRef?.getElementById?.('audio-player') ?? documentRef?.createElement?.('audio');
  if (audio && !audio.id) { audio.id = 'audio-player'; documentRef.body?.append?.(audio); }
  const queue = []; const pending = new Set(); let playing = false; let enabled = true;
  const jobKey = batch => `${getCommittedTurnIdentity()}|${batch.character_id}|${batch.text}`;
  async function drain() {
    if (playing) return; playing = true;
    try { while (queue.length) { const job = queue.shift(); pending.delete(job.key); if (!enabled || getTtsEnabled?.() === false) continue; const result = await api.tts({ game_id: gameId, character_id: job.batch.character_id, text: job.batch.text, direction: job.batch.direction || '자연스럽게' }); if (!result?.url || !audio) continue; audio.src = result.url; await audio.play?.(); if (typeof audio.addEventListener === 'function') await new Promise(resolve => audio.addEventListener('ended', resolve, { once: true })); } }
    finally { playing = false; }
  }
  function onCommittedTurn() {
    const vm = getViewModel?.();
    if (!enabled || getTtsEnabled?.() === false) return false;
    const lines = selectPrimaryTtsLines({ dialogueLines: vm?.media?.dialogue_lines, presentNpcIds: vm?.scene?.present_npc_ids ?? [], selectedCharacterId: getSelectedMindCharacterId?.(), focalCharacterId: vm?.focal_character?.id });
    for (const batch of batchDialogueLines(lines)) { const key = jobKey(batch); if (pending.has(key)) continue; pending.add(key); queue.push({ key, batch }); }
    void drain(); return true;
  }
  function setEnabled(value) { enabled = Boolean(value); if (!enabled) queue.length = 0; }
  function stop() { queue.length = 0; audio?.pause?.(); }
  return { onCommittedTurn, setEnabled, stop, drain, queue };
}
