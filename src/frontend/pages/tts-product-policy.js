function speakerId(card, documentRef = globalThis.document) {
  const direct = String(card?.dataset?.speakerId ?? '').trim();
  if (direct) return direct;
  const speaker = String(card?.querySelector?.('.dialogue-speaker')?.textContent ?? '').trim();
  if (!speaker) return '';
  const tabs = documentRef?.querySelectorAll?.('.mind-monitor-tab') ?? [];
  for (const tab of tabs) {
    if (String(tab?.textContent ?? '').trim() === speaker) return String(tab?.dataset?.characterId ?? '').trim();
  }
  return '';
}

function eligibleSpeakerIds(documentRef = globalThis.document) {
  const ids = new Set();
  const selected = String(documentRef?.getElementById?.('mind-monitor')?.dataset?.selectedCharacterId ?? '').trim();
  if (selected) ids.add(selected);
  const tabs = documentRef?.querySelectorAll?.('.mind-monitor-tab') ?? [];
  for (const tab of tabs) {
    const id = String(tab?.dataset?.characterId ?? '').trim();
    if (id) ids.add(id);
  }
  return ids;
}

/** Automatic TTS is limited to the selected/focal Mind Monitor character. */
export function primaryDialogueSpeakerId(cards, documentRef = globalThis.document) {
  const eligible = eligibleSpeakerIds(documentRef);
  if (!eligible.size) return '';
  const values = Array.from(cards ?? []).filter(Boolean);
  const counts = new Map();
  for (const card of values) {
    const id = speakerId(card, documentRef);
    if (id && eligible.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  if (!counts.size) return '';
  const selected = String(documentRef?.getElementById?.('mind-monitor')?.dataset?.selectedCharacterId ?? '').trim();
  if (selected && counts.has(selected)) return selected;
  let maximum = 0;
  for (const count of counts.values()) maximum = Math.max(maximum, count);
  return [...counts.entries()].find(([, count]) => count === maximum)?.[0] ?? '';
}

export function filterPrimaryDialogueCards(cards, documentRef = globalThis.document) {
  const values = Array.from(cards ?? []).filter(Boolean);
  const primaryId = primaryDialogueSpeakerId(values, documentRef);
  if (!primaryId) return [];
  return values.filter(card => speakerId(card, documentRef) === primaryId);
}

export function waitForMediaCompletion(media, startPromise) {
  return Promise.resolve(startPromise).then(() => {
    if (!media || media.ended) return;
    if (typeof media.addEventListener !== 'function') return;
    return new Promise((resolve, reject) => {
      let settled = false;
      const events = ['ended', 'pause', 'emptied', 'abort'];
      const cleanup = () => {
        for (const event of events) media.removeEventListener?.(event, done);
        media.removeEventListener?.('error', fail);
      };
      const done = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      const fail = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(media.error ?? new Error('TTS audio playback failed'));
      };
      for (const event of events) media.addEventListener(event, done, { once: true });
      media.addEventListener('error', fail, { once: true });
    });
  });
}

function isTtsStoryRoot(node) {
  if (!node) return false;
  if (node.id === 'current-story') return true;
  return Boolean(node.classList?.contains?.('turn-card'));
}

export function installTtsProductPolicy({
  documentRef = globalThis.document,
  elementPrototype = globalThis.Element?.prototype,
  mediaPrototype = globalThis.HTMLMediaElement?.prototype
} = {}) {
  if (elementPrototype && !elementPrototype.__companyPrimaryDialoguePolicy) {
    const nativeQuerySelectorAll = elementPrototype.querySelectorAll;
    if (typeof nativeQuerySelectorAll === 'function') {
      Object.defineProperty(elementPrototype, '__companyPrimaryDialoguePolicy', { value: true });
      elementPrototype.querySelectorAll = function querySelectorAll(selector) {
        const result = nativeQuerySelectorAll.call(this, selector);
        if (selector !== '.dialogue-card' || !isTtsStoryRoot(this)) return result;
        return filterPrimaryDialogueCards(result, documentRef);
      };
    }
  }

  if (mediaPrototype && !mediaPrototype.__companySequentialTtsPolicy) {
    const nativePlay = mediaPrototype.play;
    if (typeof nativePlay === 'function') {
      Object.defineProperty(mediaPrototype, '__companySequentialTtsPolicy', { value: true });
      mediaPrototype.play = function play(...args) {
        const started = nativePlay.apply(this, args);
        if (this.id !== 'audio-player') return started;
        const src = String(this.currentSrc || this.getAttribute?.('src') || this.src || '');
        if (!src || src.startsWith('data:audio/wav')) return started;
        return waitForMediaCompletion(this, started);
      };
    }
  }
}

if (typeof document !== 'undefined') installTtsProductPolicy();
