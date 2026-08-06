import { renderHistory, text } from './render.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function saveFromContext(context) {
  return object(context?.save?.data ?? context?.save);
}

function characterEntries(context) {
  const master = object(context?.master?.data ?? context?.master);
  const characterMap = object(master?.characters?.characters ?? master?.characters);
  const projected = object(context?.display?.npc_directory);
  const ids = new Set([
    ...Object.keys(characterMap),
    ...Object.keys(projected),
    ...Object.keys(object(saveFromContext(context).npc_scene_state)),
    ...(Array.isArray(saveFromContext(context).last_npcs_present) ? saveFromContext(context).last_npcs_present : [])
  ]);
  return [...ids].sort().map(id => ({ id, name: projected[id]?.name ?? characterMap[id]?.name ?? id }));
}

const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAA=';
const DIRECTED_LINE = /^([^\n():："“”]{1,40}?)\s*\(([^()\n]{1,160})\)\s*[:：]?\s*(?:["“]([^"”]*)["”]|(.+))$/u;
const NAMED_LINE = /^([^\n:："“”]{1,40}?)\s*[:：]\s*(?:["“]([^"”]*)["”]|(.+))$/u;
const QUOTE_ONLY_LINE = /^["“]([^"”]+)["”]$/u;

function mentionedSpeaker(value, directory, previous = null) {
  const line = String(value ?? '');
  let selected = previous;
  let selectedIndex = -1;
  for (const entry of directory) {
    const index = line.lastIndexOf(entry.name);
    if (index > selectedIndex) {
      selected = entry;
      selectedIndex = index;
    }
  }
  return selected;
}

/**
 * Recovers old committed Company turns whose Story stored quote-only dialogue
 * and therefore has an empty parsed dialogue_lines array. It uses only a
 * registered name seen in the scene or the persisted last/focal speaker id.
 */
export function fallbackDialogueLines(context, viewModel) {
  const directory = characterEntries(context);
  const idByName = new Map(directory.map(entry => [entry.name, entry.id]));
  const byId = new Map(directory.map(entry => [entry.id, entry]));
  const save = saveFromContext(context);
  const persistedSpeaker = byId.get(save.last_speaker_id) ?? byId.get(save.focal_character_id) ?? null;
  const storyText = typeof viewModel?.story?.story_text === 'string' ? viewModel.story.story_text : '';
  const scene = storyText.split(/\[2\.\s*플레이어\s*속마음\]/)[0] ?? storyText;
  const lines = [];
  let recentSpeaker = null;

  for (const rawLine of scene.split(/\r?\n/)) {
    const value = rawLine.trim();
    if (!value || value.startsWith('[')) continue;
    const directed = DIRECTED_LINE.exec(value);
    if (directed) {
      const speakerName = directed[1].trim();
      const speakerId = idByName.get(speakerName);
      if (!speakerId) continue;
      recentSpeaker = { id: speakerId, name: speakerName };
      lines.push({
        speaker_id: speakerId,
        speaker_name: speakerName,
        direction: directed[2].trim(),
        text: String(directed[3] ?? directed[4] ?? '').trim().replace(/^["“”']+|["“”']+$/g, ''),
        order: lines.length
      });
      continue;
    }
    const named = NAMED_LINE.exec(value);
    if (named) {
      const speakerName = named[1].trim();
      const speakerId = idByName.get(speakerName);
      if (!speakerId) continue;
      recentSpeaker = { id: speakerId, name: speakerName };
      lines.push({
        speaker_id: speakerId,
        speaker_name: speakerName,
        direction: '자연스럽게',
        text: String(named[2] ?? named[3] ?? '').trim().replace(/^["“”']+|["“”']+$/g, ''),
        order: lines.length
      });
      continue;
    }

    const quote = QUOTE_ONLY_LINE.exec(value);
    if (quote && !/^\([^)]*\)$/.test(quote[1].trim())) {
      const speaker = recentSpeaker ?? persistedSpeaker;
      if (speaker) {
        lines.push({
          speaker_id: speaker.id,
          speaker_name: speaker.name,
          direction: '자연스럽게',
          text: quote[1].trim(),
          order: lines.length
        });
        continue;
      }
    }
    recentSpeaker = mentionedSpeaker(rawLine, directory, recentSpeaker);
  }
  return lines.filter(line => line.text);
}

export function createUtilityUi({
  documentRef,
  api,
  gameId,
  getContext,
  getViewModel,
  onFeedbackReserved,
  onError,
  onStatus,
  onMediaLoading,
  AudioImpl = globalThis.Audio,
  urlApi = globalThis.URL
}) {
  const get = id => documentRef.querySelector(`#${id}`);
  const elements = {
    historyOverlay: get('history-overlay'), historyList: get('history-list'), historyClose: get('history-close'), historyMore: get('history-more'), historyStatus: get('history-status'),
    feedbackOverlay: get('feedback-overlay'), feedbackForm: get('feedback-form'), feedbackText: get('feedback-text'), feedbackClose: get('feedback-close'), feedbackStatus: get('feedback-status'),
    image: get('character-image'), imageStatus: get('image-status'), ttsEnabled: get('tts-enabled'), ttsPlay: get('play-tts'), mind: get('mind-monitor')
  };
  const available = {
    history: Boolean(elements.historyOverlay && elements.historyList && typeof api.history === 'function'),
    feedback: Boolean(elements.feedbackOverlay && elements.feedbackForm && typeof api.feedback === 'function'),
    media: Boolean(elements.image && typeof api.image === 'function'),
    tts: Boolean(elements.ttsEnabled && elements.ttsPlay && typeof api.tts === 'function')
  };

  let historyRecords = [];
  let nextBeforeTurn = null;
  let audioObjectUrl = null;
  let audio = null;
  let audioPrimed = false;

  function setOverlay(element, open) {
    if (element) element.hidden = !open;
  }

  function closeHistory() { setOverlay(elements.historyOverlay, false); }
  function closeFeedback() { setOverlay(elements.feedbackOverlay, false); text(elements.feedbackStatus, ''); }

  async function loadHistory({ reset = false } = {}) {
    if (!available.history) return;
    if (reset) { historyRecords = []; nextBeforeTurn = null; }
    text(elements.historyStatus, '기록을 불러오는 중…');
    const result = await api.history({ game_id: gameId, limit: 20, ...(nextBeforeTurn ? { before_turn: nextBeforeTurn } : {}) });
    historyRecords = [...historyRecords, ...(result.records ?? [])];
    nextBeforeTurn = result.next_before_turn ?? null;
    renderHistory(elements.historyList, historyRecords, { showSummary: true, collapsible: true });
    if (elements.historyMore) elements.historyMore.hidden = result.has_more !== true;
    text(elements.historyStatus, historyRecords.length ? `${historyRecords.length}개 턴` : '저장된 기록이 없습니다.');
  }

  async function openHistory() {
    if (!available.history) return;
    setOverlay(elements.historyOverlay, true);
    try { await loadHistory({ reset: true }); } catch (error) { onError?.(error); closeHistory(); }
  }

  function openFeedback() {
    if (!available.feedback) return;
    if (elements.feedbackText) elements.feedbackText.value = '';
    setOverlay(elements.feedbackOverlay, true);
    elements.feedbackText?.focus?.();
  }

  async function submitFeedback(event) {
    event?.preventDefault?.();
    const feedback = elements.feedbackText?.value?.trim() ?? '';
    if (!feedback) { text(elements.feedbackStatus, '수정할 내용을 입력해 주세요.'); return; }
    const revisionRequestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    text(elements.feedbackStatus, '재생성 작업을 예약하는 중…');
    try {
      const reservation = await api.feedback(gameId, revisionRequestId, feedback);
      closeFeedback();
      await onFeedbackReserved?.({ ...reservation, feedback_text: feedback });
    } catch (error) {
      text(elements.feedbackStatus, '예약하지 못했습니다.');
      onError?.(error);
    }
  }

  function renderImage(image) {
    const url = image?.image_url;
    const situation = typeof image?.situation === 'string' ? image.situation.trim() : '';
    if (elements.image) {
      elements.image.hidden = !url;
      if (url) { elements.image.src = url; elements.image.alt = situation || '현재 장면 이미지'; }
      else elements.image.removeAttribute?.('src');
    }
    const generic = !situation || situation === '현재 장면';
    if (elements.imageStatus) elements.imageStatus.hidden = Boolean(url && generic);
    text(elements.imageStatus, url ? (generic ? '' : situation) : '표시할 이미지가 없습니다.');
  }

  function playableDialogueLine() {
    const viewModel = getViewModel?.();
    const storedLines = Array.isArray(viewModel?.media?.dialogue_lines)
      ? viewModel.media.dialogue_lines.filter(line => typeof line?.text === 'string' && line.text.trim())
      : [];
    const lines = storedLines.length ? storedLines : fallbackDialogueLines(getContext?.(), viewModel);
    if (!lines.length) return null;
    const selectedMindId = elements.mind?.dataset?.selectedCharacterId;
    const preferredIds = [
      selectedMindId,
      viewModel?.media?.image_character_id,
      viewModel?.focal_character?.id,
      viewModel?.focal_character?.last_speaker_id
    ].filter(Boolean);
    const reversed = [...lines].sort((left, right) => Number(right?.order ?? 0) - Number(left?.order ?? 0));
    for (const characterId of preferredIds) {
      const matched = reversed.find(line => (line.speaker_id || line.character_id) === characterId);
      if (matched) return matched;
    }
    return reversed.find(line => line.speaker_id || line.character_id) ?? null;
  }

  function syncTtsControl() {
    const line = playableDialogueLine();
    if (elements.ttsPlay) {
      elements.ttsPlay.disabled = !available.tts || !line;
      elements.ttsPlay.title = line ? `${line.speaker_name || '캐릭터'}: ${line.text}` : '재생할 등록 캐릭터 대사가 없습니다.';
    }
  }

  function ensureAudio() {
    if (audio || typeof AudioImpl !== 'function') return audio;
    audio = new AudioImpl();
    return audio;
  }

  async function primeAudio() {
    if (audioPrimed) return true;
    const playback = ensureAudio();
    if (!playback) return false;
    try {
      playback.muted = true;
      playback.src = SILENT_WAV;
      await playback.play?.();
      playback.pause?.();
      playback.currentTime = 0;
      playback.muted = false;
      audioPrimed = true;
      return true;
    } catch {
      playback.muted = false;
      return false;
    }
  }

  async function playTts() {
    if (!available.tts) return false;
    const line = playableDialogueLine();
    const characterId = line?.speaker_id || line?.character_id;
    if (!line || !characterId) { onStatus?.('재생할 등록 캐릭터 대사가 없습니다.'); syncTtsControl(); return false; }

    const playback = ensureAudio();
    await primeAudio();
    try {
      onStatus?.(`${line.speaker_name || '캐릭터'}의 음성을 생성하는 중입니다.`);
      const response = await api.tts({
        game_id: gameId,
        character_id: characterId,
        text: line.text,
        direction: typeof line.direction === 'string' && line.direction.trim() ? line.direction : '자연스럽게'
      });
      const blob = await response.blob();
      if (audioObjectUrl && typeof urlApi?.revokeObjectURL === 'function') urlApi.revokeObjectURL(audioObjectUrl);
      audioObjectUrl = typeof urlApi?.createObjectURL === 'function' ? urlApi.createObjectURL(blob) : null;
      if (!playback || !audioObjectUrl) throw new Error('Audio playback is unavailable');
      playback.pause?.();
      playback.muted = false;
      playback.src = audioObjectUrl;
      playback.currentTime = 0;
      await playback.play();
      onStatus?.(`${line.speaker_name || '캐릭터'}의 마지막 대사를 재생합니다.`);
      return true;
    } catch (error) {
      if (playback) playback.muted = false;
      onStatus?.('TTS 재생에 실패했습니다. 오류 표시를 확인해 주세요.');
      onError?.(error);
      return false;
    }
  }

  async function maybeAutoplayTts(autoplayTts) {
    syncTtsControl();
    if (!autoplayTts || elements.ttsEnabled?.checked !== true) return false;
    return playTts();
  }

  async function loadMedia({ autoplayTts = true } = {}) {
    if (!available.media) {
      await maybeAutoplayTts(autoplayTts);
      return null;
    }
    const viewModel = getViewModel?.();
    const characterId = viewModel?.media?.image_character_id;
    if (!characterId) {
      renderImage(null);
      await maybeAutoplayTts(autoplayTts);
      return null;
    }
    onMediaLoading?.(true);
    text(elements.imageStatus, '장면 이미지를 찾는 중…');
    if (elements.imageStatus) elements.imageStatus.hidden = false;
    let image = null;
    try {
      const result = await api.image({
        game_id: gameId,
        character_id: characterId,
        pool: viewModel?.media?.image_pool ?? 'general',
        situation: viewModel?.media?.image_situation ?? '',
        location_id: viewModel?.scene?.scene_state?.location_id ?? null
      });
      image = result.image ?? null;
      renderImage(image);
    } catch (error) {
      renderImage(null);
      onError?.(error);
    } finally {
      onMediaLoading?.(false);
      await maybeAutoplayTts(autoplayTts);
    }
    return image;
  }

  elements.historyClose?.addEventListener('click', closeHistory);
  elements.historyMore?.addEventListener('click', () => loadHistory().catch(onError));
  elements.feedbackClose?.addEventListener('click', closeFeedback);
  elements.feedbackForm?.addEventListener('submit', submitFeedback);
  elements.ttsEnabled?.addEventListener('change', () => {
    syncTtsControl();
    if (elements.ttsEnabled?.checked === true) primeAudio().catch(() => undefined);
  });
  elements.ttsPlay?.addEventListener('click', () => playTts());
  syncTtsControl();

  return {
    available,
    openHistory,
    openFeedback,
    loadMedia,
    closeHistory,
    closeFeedback,
    syncTtsControl,
    playTts,
    playableDialogueLine,
    primeAudio
  };
}
