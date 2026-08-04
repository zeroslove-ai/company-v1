import { renderHistory, text } from './render.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function characterEntries(context) {
  const master = object(context?.master?.data ?? context?.master);
  const characterMap = object(master?.characters?.characters ?? master?.characters);
  const save = object(context?.save?.data ?? context?.save);
  const ids = new Set([
    ...Object.keys(characterMap),
    ...Object.keys(object(save.npc_scene_state)),
    ...(Array.isArray(save.last_npcs_present) ? save.last_npcs_present : [])
  ]);
  return [...ids].sort().map(id => ({ id, name: characterMap[id]?.name ?? id }));
}

const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAA=';

export function createUtilityUi({
  documentRef,
  api,
  gameId,
  getContext,
  getViewModel,
  onFeedbackReserved,
  onPrepareAction,
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
    npcOverlay: get('npc-finder-overlay'), npcSelect: get('npc-finder-character'), npcClose: get('npc-finder-close'), npcFind: get('npc-finder-submit'), npcUse: get('npc-finder-use'), npcStatus: get('npc-finder-status'),
    image: get('character-image'), imageStatus: get('image-status'), ttsEnabled: get('tts-enabled'), ttsPlay: get('play-tts'), mind: get('mind-monitor')
  };
  const available = {
    history: Boolean(elements.historyOverlay && elements.historyList && typeof api.history === 'function'),
    feedback: Boolean(elements.feedbackOverlay && elements.feedbackForm && typeof api.feedback === 'function'),
    npcFinder: Boolean(elements.npcOverlay && elements.npcSelect && typeof api.findNpc === 'function'),
    media: Boolean(elements.image && typeof api.image === 'function'),
    tts: Boolean(elements.ttsEnabled && elements.ttsPlay && typeof api.tts === 'function')
  };

  let historyRecords = [];
  let nextBeforeTurn = null;
  let lastNpcResult = null;
  let audioObjectUrl = null;
  let audio = null;

  function setOverlay(element, open) {
    if (element) element.hidden = !open;
  }

  function closeHistory() { setOverlay(elements.historyOverlay, false); }
  function closeFeedback() { setOverlay(elements.feedbackOverlay, false); text(elements.feedbackStatus, ''); }
  function closeNpcFinder() { setOverlay(elements.npcOverlay, false); text(elements.npcStatus, ''); lastNpcResult = null; if (elements.npcUse) elements.npcUse.disabled = true; }

  async function loadHistory({ reset = false } = {}) {
    if (!available.history) return;
    if (reset) { historyRecords = []; nextBeforeTurn = null; }
    text(elements.historyStatus, '기록을 불러오는 중…');
    const result = await api.history({ game_id: gameId, limit: 20, ...(nextBeforeTurn ? { before_turn: nextBeforeTurn } : {}) });
    historyRecords = [...historyRecords, ...(result.records ?? [])];
    nextBeforeTurn = result.next_before_turn ?? null;
    renderHistory(elements.historyList, historyRecords, { showSummary: true });
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

  function populateNpcOptions() {
    if (!elements.npcSelect) return;
    elements.npcSelect.replaceChildren();
    for (const character of characterEntries(getContext?.())) {
      const option = documentRef.createElement('option');
      option.value = character.id;
      option.textContent = `${character.name} (${character.id})`;
      elements.npcSelect.append(option);
    }
  }

  function openNpcFinder() {
    if (!available.npcFinder) return;
    populateNpcOptions();
    lastNpcResult = null;
    if (elements.npcUse) elements.npcUse.disabled = true;
    const count = elements.npcSelect?.children?.length ?? elements.npcSelect?.options?.length ?? 0;
    text(elements.npcStatus, count ? '찾을 인물을 선택하세요.' : '찾을 수 있는 인물 정보가 없습니다.');
    setOverlay(elements.npcOverlay, true);
  }

  async function findNpc() {
    const characterId = elements.npcSelect?.value;
    if (!characterId) return;
    text(elements.npcStatus, '현재 위치를 확인하는 중…');
    try {
      lastNpcResult = await api.findNpc(gameId, characterId);
      const label = lastNpcResult.location_label || lastNpcResult.location_id;
      text(elements.npcStatus, `${lastNpcResult.name ?? characterId}: ${label}`);
      if (elements.npcUse) elements.npcUse.disabled = !label;
    } catch (error) {
      lastNpcResult = null;
      if (elements.npcUse) elements.npcUse.disabled = true;
      onError?.(error);
    }
  }

  function prepareNpcMove() {
    if (!lastNpcResult) return;
    const who = lastNpcResult.name ?? lastNpcResult.character_id;
    const where = lastNpcResult.location_label ?? lastNpcResult.location_id;
    onPrepareAction?.(`${where}로 이동해 ${who}를 찾아간다.`);
    closeNpcFinder();
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

  async function loadMedia() {
    if (!available.media) { syncTtsControl(); return null; }
    const viewModel = getViewModel?.();
    const characterId = viewModel?.media?.image_character_id;
    if (!characterId) { renderImage(null); syncTtsControl(); return null; }
    onMediaLoading?.(true);
    text(elements.imageStatus, '장면 이미지를 찾는 중…');
    if (elements.imageStatus) elements.imageStatus.hidden = false;
    try {
      const result = await api.image({
        game_id: gameId,
        character_id: characterId,
        pool: viewModel?.media?.image_pool ?? 'general',
        situation: viewModel?.media?.image_situation ?? '',
        location_id: viewModel?.scene?.scene_state?.location_id ?? null
      });
      renderImage(result.image ?? null);
      return result.image ?? null;
    } catch (error) {
      renderImage(null);
      onError?.(error);
      return null;
    } finally {
      onMediaLoading?.(false);
      syncTtsControl();
    }
  }

  function playableDialogueLine() {
    const viewModel = getViewModel?.();
    const lines = Array.isArray(viewModel?.media?.dialogue_lines)
      ? viewModel.media.dialogue_lines.filter(line => typeof line?.text === 'string' && line.text.trim())
      : [];
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
      elements.ttsPlay.title = line ? `${line.speaker_name || '캐릭터'}: ${line.text}` : '재생할 캐릭터 대사가 없습니다.';
    }
  }

  function ensureAudio() {
    if (audio || typeof AudioImpl !== 'function') return audio;
    audio = new AudioImpl();
    return audio;
  }

  async function playTts() {
    if (!available.tts) return false;
    const line = playableDialogueLine();
    const characterId = line?.speaker_id || line?.character_id;
    if (!line || !characterId) { onStatus?.('재생할 캐릭터 대사가 없습니다.'); syncTtsControl(); return false; }

    const playback = ensureAudio();
    let primePromise = null;
    if (playback) {
      try {
        playback.muted = true;
        playback.src = SILENT_WAV;
        primePromise = playback.play?.();
      } catch {
        primePromise = null;
      }
    }

    try {
      const response = await api.tts({
        game_id: gameId,
        character_id: characterId,
        text: line.text,
        direction: typeof line.direction === 'string' ? line.direction : ''
      });
      const blob = await response.blob();
      if (primePromise && typeof primePromise.catch === 'function') await primePromise.catch(() => undefined);
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
      onError?.(error);
      return false;
    }
  }

  elements.historyClose?.addEventListener('click', closeHistory);
  elements.historyMore?.addEventListener('click', () => loadHistory().catch(onError));
  elements.feedbackClose?.addEventListener('click', closeFeedback);
  elements.feedbackForm?.addEventListener('submit', submitFeedback);
  elements.npcClose?.addEventListener('click', closeNpcFinder);
  elements.npcFind?.addEventListener('click', () => findNpc());
  elements.npcUse?.addEventListener('click', prepareNpcMove);
  elements.ttsEnabled?.addEventListener('change', syncTtsControl);
  elements.ttsPlay?.addEventListener('click', playTts);
  syncTtsControl();

  return {
    available,
    openHistory,
    openFeedback,
    openNpcFinder,
    loadMedia,
    closeHistory,
    closeFeedback,
    closeNpcFinder,
    syncTtsControl,
    playTts,
    playableDialogueLine
  };
}
