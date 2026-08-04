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
  onMediaLoading
}) {
  const get = id => documentRef.querySelector(`#${id}`);
  const elements = {
    historyOverlay: get('history-overlay'), historyList: get('history-list'), historyClose: get('history-close'), historyMore: get('history-more'), historyStatus: get('history-status'),
    feedbackOverlay: get('feedback-overlay'), feedbackForm: get('feedback-form'), feedbackText: get('feedback-text'), feedbackClose: get('feedback-close'), feedbackStatus: get('feedback-status'),
    npcOverlay: get('npc-finder-overlay'), npcSelect: get('npc-finder-character'), npcClose: get('npc-finder-close'), npcFind: get('npc-finder-submit'), npcUse: get('npc-finder-use'), npcStatus: get('npc-finder-status'),
    image: get('character-image'), imageStatus: get('image-status'), ttsEnabled: get('tts-enabled'), ttsPlay: get('play-tts')
  };

  let historyRecords = [];
  let nextBeforeTurn = null;
  let lastNpcResult = null;
  let audioObjectUrl = null;

  function setOverlay(element, open) {
    if (element) element.hidden = !open;
  }

  function closeHistory() { setOverlay(elements.historyOverlay, false); }
  function closeFeedback() { setOverlay(elements.feedbackOverlay, false); text(elements.feedbackStatus, ''); }
  function closeNpcFinder() { setOverlay(elements.npcOverlay, false); text(elements.npcStatus, ''); lastNpcResult = null; if (elements.npcUse) elements.npcUse.disabled = true; }

  async function loadHistory({ reset = false } = {}) {
    if (reset) { historyRecords = []; nextBeforeTurn = null; }
    text(elements.historyStatus, '기록을 불러오는 중…');
    const result = await api.history({ game_id: gameId, limit: 20, ...(nextBeforeTurn ? { before_turn: nextBeforeTurn } : {}) });
    historyRecords = [...historyRecords, ...(result.records ?? [])];
    nextBeforeTurn = result.next_before_turn ?? null;
    renderHistory(elements.historyList, historyRecords);
    if (elements.historyMore) elements.historyMore.hidden = result.has_more !== true;
    text(elements.historyStatus, historyRecords.length ? `${historyRecords.length}개 턴` : '저장된 기록이 없습니다.');
  }

  async function openHistory() {
    setOverlay(elements.historyOverlay, true);
    try { await loadHistory({ reset: true }); } catch (error) { onError?.(error); closeHistory(); }
  }

  function openFeedback() {
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
    populateNpcOptions();
    lastNpcResult = null;
    if (elements.npcUse) elements.npcUse.disabled = true;
    text(elements.npcStatus, elements.npcSelect?.options?.length ? '찾을 인물을 선택하세요.' : '찾을 수 있는 인물 정보가 없습니다.');
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
    if (elements.image) {
      elements.image.hidden = !url;
      if (url) { elements.image.src = url; elements.image.alt = image?.situation ?? '현재 장면 이미지'; }
      else elements.image.removeAttribute('src');
    }
    text(elements.imageStatus, url ? (image?.situation ?? '현재 장면') : '표시할 이미지가 없습니다.');
  }

  async function loadMedia() {
    const viewModel = getViewModel?.();
    const characterId = viewModel?.media?.image_character_id;
    if (!characterId) { renderImage(null); return null; }
    onMediaLoading?.(true);
    text(elements.imageStatus, '장면 이미지를 찾는 중…');
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
    }
  }

  function syncTtsControl() {
    if (elements.ttsPlay) elements.ttsPlay.disabled = elements.ttsEnabled?.checked !== true;
  }

  async function playTts() {
    if (elements.ttsEnabled?.checked !== true) return;
    const viewModel = getViewModel?.();
    const line = viewModel?.media?.dialogue_lines?.find(item => typeof item?.text === 'string' && item.text.trim());
    const characterId = line?.character_id || viewModel?.media?.image_character_id;
    if (!line || !characterId) { onStatus?.('재생할 캐릭터 대사가 없습니다.'); return; }
    try {
      const response = await api.tts({ game_id: gameId, character_id: characterId, text: line.text });
      const blob = await response.blob();
      if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
      audioObjectUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioObjectUrl);
      await audio.play();
    } catch (error) {
      onError?.(error);
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

  return { openHistory, openFeedback, openNpcFinder, loadMedia, closeHistory, closeFeedback, closeNpcFinder };
}
