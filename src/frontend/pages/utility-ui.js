import { renderHistory, text } from './render.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function createUtilityUi({
  documentRef,
  api,
  gameId,
  onFeedbackReserved,
  onError,
  onStatus,
  onMediaLoading,
  getViewModel
}) {
  const get = id => documentRef.querySelector(`#${id}`);
  const elements = {
    historyOverlay: get('history-overlay'), historyList: get('history-list'), historyClose: get('history-close'), historyMore: get('history-more'), historyStatus: get('history-status'),
    feedbackOverlay: get('feedback-overlay'), feedbackForm: get('feedback-form'), feedbackText: get('feedback-text'), feedbackClose: get('feedback-close'), feedbackStatus: get('feedback-status'),
    image: get('character-image'), imageStatus: get('image-status'), mediaPanel: get('media-panel')
  };
  const available = {
    history: Boolean(elements.historyOverlay && elements.historyList && typeof api.history === 'function'),
    feedback: Boolean(elements.feedbackOverlay && elements.feedbackForm && typeof api.feedback === 'function'),
    media: Boolean(elements.image && typeof api.image === 'function')
  };
  let historyRecords = [];
  let nextBeforeTurn = null;
  let latestImageRequestKey = '';
  let imageInFlightKey = '';
  let imageCompletedKey = '';
  function setOverlay(element, open) { if (element) element.hidden = !open; }
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
  async function openHistory() { if (!available.history) return; setOverlay(elements.historyOverlay, true); try { await loadHistory({ reset: true }); } catch (error) { onError?.(error); closeHistory(); } }
  function openFeedback() { if (!available.feedback) return; if (elements.feedbackText) elements.feedbackText.value = ''; setOverlay(elements.feedbackOverlay, true); elements.feedbackText?.focus?.(); }
  async function submitFeedback(event) {
    event?.preventDefault?.();
    const feedback = elements.feedbackText?.value?.trim() ?? '';
    if (!feedback) { text(elements.feedbackStatus, '수정할 내용을 입력해 주세요.'); return; }
    const revisionRequestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    text(elements.feedbackStatus, '재생성 작업을 예약하는 중…');
    try { const reservation = await api.feedback(gameId, revisionRequestId, feedback); closeFeedback(); await onFeedbackReserved?.({ ...reservation, feedback_text: feedback }); }
    catch (error) { text(elements.feedbackStatus, '예약하지 못했습니다.'); onError?.(error); }
  }
  function renderImage(image) {
    const url = image?.image_url;
    const situation = typeof image?.situation === 'string' ? image.situation.trim() : '';
    if (elements.mediaPanel) elements.mediaPanel.hidden = !url;
    if (elements.image) { elements.image.hidden = !url; if (url) { elements.image.src = url; elements.image.alt = situation || '현재 장면 이미지'; } else elements.image.removeAttribute?.('src'); }
    const generic = !situation || situation === '현재 장면';
    if (elements.imageStatus) elements.imageStatus.hidden = !url || generic;
    if (!url) text(elements.imageStatus, '');
    text(elements.imageStatus, url ? (generic ? '' : situation) : '표시할 이미지가 없습니다.');
  }
  function imageKey(viewModel) {
    const media = object(viewModel?.media); const scene = object(viewModel?.scene);
    const tags = (Array.isArray(media.image_tags) ? media.image_tags : []).map(String).sort().join(',');
    return [viewModel?.turn?.committed_turn ?? viewModel?.turn?.turn_number, viewModel?.turn?.turn_id, viewModel?.turn?.action_id, media.image_character_id, media.image_pool, tags, scene.location_id].join('|');
  }
  async function loadMedia() {
    if (!available.media) return null;
    const viewModel = getViewModel?.(); const characterId = viewModel?.media?.image_character_id;
    if (!characterId) {
      latestImageRequestKey = '';
      imageInFlightKey = '';
      onMediaLoading?.(false);
      renderImage(null);
      return null;
    }
    const key = imageKey(viewModel);
    if (key === imageCompletedKey || key === imageInFlightKey) return null;
    latestImageRequestKey = key;
    imageInFlightKey = key;
    onMediaLoading?.(true); text(elements.imageStatus, '장면 이미지를 찾는 중…'); if (elements.imageStatus) elements.imageStatus.hidden = false;
    try {
      const result = await api.image({ game_id: gameId, character_id: characterId, pool: viewModel?.media?.image_pool ?? 'general', situation: viewModel?.media?.image_situation ?? '', tags: Array.isArray(viewModel?.media?.image_tags) ? viewModel.media.image_tags : [], location_id: viewModel?.scene?.location_id ?? null });
      if (key !== latestImageRequestKey) return null;
      const image = result.image ?? null; renderImage(image); imageCompletedKey = key; return image;
    } catch (error) {
      if (key !== latestImageRequestKey) return null;
      renderImage(null); onError?.(error); return null;
    }
    finally {
      if (imageInFlightKey === key && key === latestImageRequestKey) {
        imageInFlightKey = '';
        onMediaLoading?.(false);
      }
    }
  }
  elements.historyClose?.addEventListener('click', closeHistory);
  elements.historyMore?.addEventListener('click', () => loadHistory().catch(onError));
  elements.feedbackClose?.addEventListener('click', closeFeedback);
  elements.feedbackForm?.addEventListener('submit', submitFeedback);
  return { available, openHistory, openFeedback, loadMedia, closeHistory, closeFeedback };
}
