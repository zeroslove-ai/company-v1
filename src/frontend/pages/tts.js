import { createApiClient } from './api.js';
import { FRONTEND_CONFIG } from './config.js';

const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
const DIRECTED_LINE = /^([^\n():："“”]{1,40}?)\s*\(([^()\n]{1,160})\)\s*[:：]\s*["“]([^"”]+)["”]$/u;
const NAMED_LINE = /^([^\n:："“”]{1,40}?)\s*[:：]\s*["“]([^"”]+)["”]$/u;
const QUOTED_TEXT = /["“]([^"”]+)["”]/gu;

function gameId() {
  return new URL(globalThis.location?.href ?? 'https://local.invalid/').searchParams.get('game') || FRONTEND_CONFIG.defaultGameId;
}

function numberFromTurnLabel() {
  const value = document.getElementById('turn-number')?.textContent ?? '';
  const match = /(?:Turn\s*)?(\d+)/i.exec(value);
  return match ? Number(match[1]) : 0;
}

function selectedCharacterId() {
  return document.getElementById('mind-monitor')?.dataset?.selectedCharacterId || '';
}

function characterIdForSpeaker(name) {
  const normalized = String(name ?? '').trim();
  if (!normalized) return selectedCharacterId();
  for (const tab of document.querySelectorAll('.mind-monitor-tab')) {
    if (tab.textContent?.trim() === normalized && tab.dataset?.characterId) return tab.dataset.characterId;
  }
  const selected = selectedCharacterId();
  if (selected) return selected;
  return '';
}

function normalizeCardLine(card, order) {
  const speaker = card.querySelector('.dialogue-speaker')?.textContent?.trim() ?? '';
  const text = card.querySelector('.dialogue-text')?.textContent?.trim() ?? '';
  const direction = card.querySelector('.dialogue-direction')?.textContent?.trim() || '자연스럽게';
  const characterId = characterIdForSpeaker(speaker);
  if (!characterId || !text) return null;
  return { speaker, character_id: characterId, text, direction, order };
}

function fallbackLines(root) {
  const raw = root?.innerText || root?.textContent || '';
  const lines = [];
  let recentSpeakerName = '';
  let recentCharacterId = selectedCharacterId();
  for (const source of raw.split(/\r?\n/)) {
    const value = source.trim();
    if (!value) continue;
    const directed = DIRECTED_LINE.exec(value);
    if (directed) {
      recentSpeakerName = directed[1].trim();
      recentCharacterId = characterIdForSpeaker(recentSpeakerName);
      if (recentCharacterId) lines.push({ speaker: recentSpeakerName, character_id: recentCharacterId, direction: directed[2].trim(), text: directed[3].trim(), order: lines.length });
      continue;
    }
    const named = NAMED_LINE.exec(value);
    if (named) {
      recentSpeakerName = named[1].trim();
      recentCharacterId = characterIdForSpeaker(recentSpeakerName);
      if (recentCharacterId) lines.push({ speaker: recentSpeakerName, character_id: recentCharacterId, direction: '자연스럽게', text: named[2].trim(), order: lines.length });
      continue;
    }
    const matches = [...value.matchAll(QUOTED_TEXT)];
    if (!matches.length || !recentCharacterId) continue;
    for (const match of matches) {
      const text = match[1].trim();
      if (!text || /^\([^)]*\)$/.test(text)) continue;
      lines.push({ speaker: recentSpeakerName, character_id: recentCharacterId, direction: '자연스럽게', text, order: lines.length });
    }
  }
  return lines;
}

export function dialogueLinesFromDom() {
  const latestTurn = document.querySelector('#story-history .turn-card:last-child');
  const root = latestTurn || document.getElementById('current-story');
  if (!root) return [];
  const cards = [...root.querySelectorAll('.dialogue-card')];
  const parsed = cards.map(normalizeCardLine).filter(Boolean);
  return parsed.length ? parsed : fallbackLines(root);
}

function toneGroup(direction = '') {
  if (/속삭|작게|귓속말/.test(direction)) return 'whisper';
  if (/울먹|눈물|흐느끼|서럽/.test(direction)) return 'sad';
  if (/화난|분노|날카롭게|소리치|비명/.test(direction)) return 'angry';
  if (/웃으며|밝게|활기차게|신나/.test(direction)) return 'happy';
  if (/떨리는|떨림|긴장|당황|머뭇|가쁜|조심스럽게/.test(direction)) return 'nervous';
  if (/차분|침착|평온|담담/.test(direction)) return 'calm';
  return 'neutral';
}

function batchDialogueLines(lines) {
  const batches = [];
  let current = null;
  for (const line of lines) {
    const tone = toneGroup(line.direction);
    const merged = current ? `${current.text} ${line.text}` : line.text;
    if (current && current.character_id === line.character_id && current.tone === tone && merged.length <= 350) {
      current.text = merged;
      current.lines.push(line);
    } else {
      current = { speaker: line.speaker, character_id: line.character_id, tone, direction: line.direction, text: line.text, lines: [line] };
      batches.push(current);
    }
  }
  return batches;
}

export function createHospitalTts({ api = createApiClient(), documentRef = document, storage = localStorage, session = sessionStorage } = {}) {
  const state = {
    queue: [],
    pendingKeys: new Set(),
    completedKeys: new Set(JSON.parse(session.getItem('playedCompanyTtsKeys') || '[]')),
    generation: 0,
    playing: false,
    unlocked: false,
    auto: storage.getItem('autoTts') !== 'false',
    lastPlayable: null,
    lastAudioResult: null,
    lastObservedTurn: numberFromTurnLabel(),
    bootSettled: false
  };

  const get = id => documentRef.getElementById(id);
  const ensureAudio = () => {
    let audio = get('audio-player');
    if (!audio) {
      audio = documentRef.createElement('audio');
      audio.id = 'audio-player';
      audio.className = 'audio-player';
      audio.controls = true;
      documentRef.body.append(audio);
    }
    return audio;
  };
  const status = (message = '', error = false) => {
    const node = get('tts-status');
    if (!node) return;
    node.textContent = message;
    node.classList.toggle('error', error);
  };
  const renderToggle = () => {
    const toggle = get('tts-toggle');
    if (!toggle) return;
    toggle.textContent = state.auto ? '🔊 음성 ON' : '🔇 음성 OFF';
    toggle.setAttribute('aria-pressed', String(state.auto));
  };
  const renderReplay = () => {
    const replay = get('tts-replay');
    if (!replay) return;
    replay.hidden = !state.lastPlayable;
    replay.disabled = !state.lastPlayable;
  };
  const key = (turn, lines) => `${turn}:${lines[0]?.character_id || ''}:${lines.map(line => line.text).join('|')}`;

  function primeAudioElement() {
    try {
      const audio = ensureAudio();
      const previousSrc = audio.getAttribute('src');
      const wasMuted = audio.muted;
      audio.muted = true;
      audio.src = SILENT_WAV;
      const promise = audio.play();
      const restore = () => {
        try { audio.pause(); audio.currentTime = 0; } catch { /* detached */ }
        audio.muted = wasMuted;
        if (previousSrc) audio.src = previousSrc; else audio.removeAttribute('src');
      };
      promise?.then?.(restore)?.catch?.(() => { audio.muted = wasMuted; });
    } catch (error) {
      console.error('TTS audio priming failed', error);
    }
  }

  async function unlockAudio() {
    if (state.unlocked) return true;
    try {
      const AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (AudioContextCtor) {
        state.audioContext ||= new AudioContextCtor();
        if (state.audioContext.state === 'suspended') await state.audioContext.resume();
      }
      state.unlocked = true;
      return true;
    } catch (error) {
      status('브라우저 오디오 활성화에 실패했습니다. 재생 버튼을 다시 눌러주세요.', true);
      return false;
    }
  }

  function stopAndClear() {
    const audio = ensureAudio();
    state.generation += 1;
    state.queue.length = 0;
    state.pendingKeys.clear();
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    state.playing = false;
  }

  function setEnabled(enabled) {
    state.auto = Boolean(enabled);
    storage.setItem('autoTts', String(state.auto));
    if (!state.auto) stopAndClear();
    renderToggle();
    if (state.auto && state.lastPlayable) status('음성 ON: 다음 턴부터 자동 재생합니다.');
  }

  function prepareLatest({ autoplay = false } = {}) {
    const lines = dialogueLinesFromDom();
    if (!lines.length) {
      state.lastPlayable = null;
      renderReplay();
      status('이번 서사에서 재생할 NPC 대사를 찾지 못했습니다.', true);
      return;
    }
    const batches = batchDialogueLines(lines);
    const lastBatch = batches.at(-1);
    state.lastPlayable = { turn: numberFromTurnLabel(), batch: lastBatch };
    renderReplay();
    if (autoplay && state.auto) enqueueBatches(batches, numberFromTurnLabel());
  }

  function enqueueBatches(batches, turn, { force = false, manual = false } = {}) {
    for (const batch of batches) {
      const jobKey = key(turn, batch.lines);
      if (!force && (state.pendingKeys.has(jobKey) || state.completedKeys.has(jobKey))) continue;
      state.pendingKeys.add(jobKey);
      state.queue.push({ batch, key: jobKey, generation: state.generation, manual });
    }
    drain();
  }

  async function playCachedAudio(cached) {
    const audio = ensureAudio();
    try {
      status(`음성 재생 중: ${cached.text.slice(0, 12)}`);
      audio.src = cached.url;
      audio.load();
      await audio.play();
      state.completedKeys.add(cached.key);
      session.setItem('playedCompanyTtsKeys', JSON.stringify([...state.completedKeys]));
      status('');
      return true;
    } catch (error) {
      state.lastAudioResult = null;
      status('저장된 음원을 재생하지 못했습니다. 다시 생성합니다.', true);
      return false;
    }
  }

  async function play(job) {
    const audio = ensureAudio();
    try {
      status(`음성 준비 중: ${job.batch.speaker || '캐릭터'}`);
      const result = await api.tts({
        game_id: gameId(),
        character_id: job.batch.character_id,
        text: job.batch.text,
        direction: job.batch.direction
      });
      if (!result?.url) throw new Error('TTS 응답에 audio URL이 없습니다.');
      if (job.generation !== state.generation || (!state.auto && !job.manual)) return;
      audio.src = result.url;
      audio.load();
      await audio.play();
      state.completedKeys.add(job.key);
      session.setItem('playedCompanyTtsKeys', JSON.stringify([...state.completedKeys]));
      state.lastAudioResult = { key: job.key, url: result.url, text: job.batch.text };
      status('');
    } catch (error) {
      console.error('TTS playback failed', error, job);
      state.completedKeys.delete(job.key);
      status(`음성 재생 실패: ${error?.message || '알 수 없는 오류'}`, true);
      renderReplay();
    } finally {
      state.pendingKeys.delete(job.key);
    }
  }

  async function drain() {
    if (state.playing) return;
    state.playing = true;
    try {
      while (state.queue.length) {
        const job = state.queue.shift();
        if (job.generation !== state.generation || (!state.auto && !job.manual)) {
          state.pendingKeys.delete(job.key);
          continue;
        }
        await play(job);
      }
    } finally {
      state.playing = false;
    }
  }

  async function replay() {
    primeAudioElement();
    await unlockAudio();
    if (!state.lastPlayable) prepareLatest();
    if (!state.lastPlayable) return;
    const candidateKey = key(state.lastPlayable.turn, state.lastPlayable.batch.lines);
    if (state.lastAudioResult?.key === candidateKey && await playCachedAudio(state.lastAudioResult)) return;
    enqueueBatches([state.lastPlayable.batch], state.lastPlayable.turn, { force: true, manual: true });
  }

  function observeTurns() {
    const target = get('story-history');
    if (!target || typeof MutationObserver !== 'function') return;
    const observer = new MutationObserver(() => {
      queueMicrotask(() => {
        const turn = numberFromTurnLabel();
        prepareLatest({ autoplay: state.bootSettled && turn > state.lastObservedTurn });
        state.lastObservedTurn = Math.max(state.lastObservedTurn, turn);
      });
    });
    observer.observe(target, { childList: true, subtree: true });
    setTimeout(() => {
      state.lastObservedTurn = numberFromTurnLabel();
      prepareLatest();
      state.bootSettled = true;
    }, 1200);
  }

  function init() {
    ensureAudio();
    const toggle = get('tts-toggle');
    const replayButton = get('tts-replay');
    if (!toggle || !replayButton) return;
    renderToggle();
    renderReplay();
    toggle.addEventListener('click', () => {
      primeAudioElement();
      unlockAudio().finally(() => setEnabled(!state.auto));
    });
    replayButton.addEventListener('click', replay);
    observeTurns();
  }

  return { init, replay, prepareLatest, setEnabled, state };
}

const controller = createHospitalTts();
controller.init();
globalThis.companyTts = controller;
