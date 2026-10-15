const DIALOGUE_LINE = /^\s*(.{1,40}?)\s*(?:\(([^()\n]{1,80})\)\s*)?:\s*["“](.+?)["”]\s*$/u;

export function parseCommittedDialogue(storyText, actors = []) {
  const idByName = new Map(actors.filter(actor => actor.voice_available).map(actor => [actor.name, actor.actor_id]));
  return String(storyText ?? '').replace(/\r\n?/g, '\n').split('\n').flatMap((line, order) => {
    const match = DIALOGUE_LINE.exec(line);
    const speakerName = match?.[1]?.trim() ?? '';
    const speakerId = idByName.get(speakerName);
    const spoken = match?.[3]?.trim() ?? '';
    return speakerId && spoken ? [{ speaker_id: speakerId, speaker_name: speakerName, direction: match?.[2]?.trim() ?? '', text: spoken, evidence_quote: line.trim(), order }] : [];
  });
}

export function committedDialogueForVoice(turn, actors = [], presentActorIds = []) {
  const projected = turn?.observer_applied?.dialogueLines;
  if (!Array.isArray(projected)) return parseCommittedDialogue(turn?.story_text, actors);
  const voiceActors = new Set(actors.filter(actor => actor.voice_available).map(actor => actor.actor_id));
  const present = new Set(presentActorIds ?? []);
  const storyText = String(turn?.story_text ?? '');
  return projected.filter(line =>
    voiceActors.has(line?.speaker_id)
    && present.has(line.speaker_id)
    && typeof line.text === 'string' && line.text.trim()
    && typeof line.evidence_quote === 'string'
    && storyText.includes(line.evidence_quote)
    && line.evidence_quote.includes(line.text)
  );
}

function tone(direction = '') {
  if (/속삭|낮은 목소리/u.test(direction)) return 'whisper';
  if (/울먹|슬픈|눈물/u.test(direction)) return 'sad';
  if (/분노|화난|날카/u.test(direction)) return 'angry';
  if (/밝게|장난|웃/u.test(direction)) return 'happy';
  if (/긴장|떨림|머뭇/u.test(direction)) return 'nervous';
  return 'neutral';
}

export function primaryBatches({ lines, presentActorIds, focalActorId }) {
  const present = new Set(presentActorIds ?? []);
  const relevant = [...(lines ?? [])].filter(line => present.has(line.speaker_id)).sort((a, b) => a.order - b.order);
  const counts = new Map();
  for (const line of relevant) counts.set(line.speaker_id, (counts.get(line.speaker_id) ?? 0) + 1);
  const primary = focalActorId && counts.has(focalActorId)
    ? focalActorId
    : [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a))[0];
  if (!primary) return [];
  const batches = [];
  let batch = null;
  for (const line of relevant.filter(item => item.speaker_id === primary)) {
    const lineTone = tone(line.direction);
    const sourceLine = { text: line.text, direction: line.direction ?? '', evidence_quote: line.evidence_quote };
    if (batch && batch.tone === lineTone && batch.direction === (line.direction ?? '') && (batch.text + ' ' + line.text).length <= 350) {
      batch.text += ' ' + line.text;
      batch.lines.push(sourceLine);
    }
    else {
      batch = { speaker_id: line.speaker_id, speaker_name: line.speaker_name, text: line.text, direction: line.direction, tone: lineTone, lines: [sourceLine] };
      batches.push(batch);
    }
  }
  return batches;
}

export function createCompanyTts({ documentRef = globalThis.document, api, getView = () => null, storage } = {}) {
  let enabled = false;
  try { enabled = storage?.getItem?.('company-r4-auto-tts') === 'true'; } catch {}
  const toggle = documentRef?.getElementById?.('tts-toggle');
  const replay = documentRef?.getElementById?.('tts-replay');
  const status = documentRef?.getElementById?.('tts-status');
  const audio = documentRef?.getElementById?.('audio-player');
  let identity = '';
  let queue = [];
  let lastBatch = null;
  let requestNo = 0;
  const cache = new Map();
  const setStatus = value => { if (status) status.textContent = value; };
  function stop() {
    requestNo += 1;
    queue = [];
    audio?.pause?.();
    audio?.removeAttribute?.('src');
  }
  async function play(batch, expectedIdentity, manual = false) {
    if ((!enabled && !manual) || expectedIdentity !== identity) return;
    const key = batch.speaker_id + ':' + batch.text;
    let url = cache.get(key);
    const requestId = ++requestNo;
    try {
      if (!url) {
        const result = await api.tts({ speaker_id: batch.speaker_id, text: batch.text, direction: batch.direction, lines: batch.lines });
        url = result?.url;
        if (url) cache.set(key, url);
      }
      if (!url || requestId !== requestNo || expectedIdentity !== identity || (!enabled && !manual) || !audio) return;
      audio.src = url;
      audio.currentTime = 0;
      audio.hidden = false;
      setStatus(batch.speaker_name + ' 대사 재생 중');
      await audio.play?.();
    } catch {
      if (requestId === requestNo) setStatus('음성 서비스를 사용할 수 없습니다.');
    }
  }
  async function drain(expectedIdentity) {
    if (!enabled || expectedIdentity !== identity || !queue.length) return;
    lastBatch = queue.shift();
    await play(lastBatch, expectedIdentity);
  }
  function onCommittedTurn() {
    const view = getView();
    if (!view?.turn || view.identity === identity) return;
    identity = view.identity;
    stop();
    queue = primaryBatches({ lines: view.dialogueLines, presentActorIds: view.presentActorIds, focalActorId: view.focalActorId });
    lastBatch = queue[0] ?? null;
    if (enabled && queue.length) void drain(identity);
  }
  function setEnabled(value) {
    enabled = Boolean(value);
    try { storage?.setItem?.('company-r4-auto-tts', enabled ? 'true' : 'false'); } catch {}
    if (!enabled) { stop(); setStatus('음성 자동 재생 꺼짐'); }
    else { identity = ''; onCommittedTurn(); }
    if (toggle) {
      toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      toggle.textContent = enabled ? '자동 재생 끄기' : '자동 재생 켜기';
    }
  }
  toggle?.addEventListener('click', () => setEnabled(!enabled));
  replay?.addEventListener('click', () => { if (lastBatch) void play(lastBatch, identity, true); });
  audio?.addEventListener?.('ended', () => { if (enabled && identity) void drain(identity); });
  return {
    onCommittedTurn,
    setEnabled,
    stop,
    get state() { return { enabled, identity, cacheSize: cache.size }; }
  };
}
