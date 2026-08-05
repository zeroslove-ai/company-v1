const STAGES = {
  story: { title: '서사 진행 중', detail: '현재 행동에 대한 이야기를 작성하고 있습니다.' },
  extract: { title: '상태 추출 중', detail: '서사에서 NPC 수치와 게임 상태 변화를 확인하고 있습니다.' },
  commit: { title: '상태 저장 중', detail: '확정된 결과를 게임에 반영하고 있습니다.' }
};

export function createTurnLoadingOverlay({
  documentRef = globalThis.document,
  eventTarget = globalThis,
  MutationObserverImpl = globalThis.MutationObserver
} = {}) {
  if (!documentRef?.body || typeof documentRef.createElement !== 'function') return null;

  const overlay = documentRef.createElement('div');
  overlay.id = 'turn-loading-overlay';
  overlay.className = 'turn-loading-overlay';
  overlay.hidden = true;
  overlay.setAttribute?.('role', 'status');
  overlay.setAttribute?.('aria-live', 'polite');
  overlay.setAttribute?.('aria-busy', 'true');

  const card = documentRef.createElement('section');
  card.className = 'turn-loading-card';
  const spinner = documentRef.createElement('span');
  spinner.className = 'turn-loading-spinner';
  spinner.setAttribute?.('aria-hidden', 'true');
  const title = documentRef.createElement('strong');
  title.className = 'turn-loading-title';
  const detail = documentRef.createElement('p');
  detail.className = 'turn-loading-detail';
  const elapsed = documentRef.createElement('small');
  elapsed.className = 'turn-loading-elapsed';
  card.append(spinner, title, detail, elapsed);
  overlay.append(card);
  documentRef.body.append(overlay);

  let timer = null;
  let seconds = 0;
  const clearTimer = () => {
    if (timer !== null) globalThis.clearInterval?.(timer);
    timer = null;
  };
  const hide = () => {
    clearTimer();
    overlay.hidden = true;
    seconds = 0;
    elapsed.textContent = '';
  };
  const show = step => {
    const stage = STAGES[step];
    if (!stage) return hide();
    clearTimer();
    seconds = 0;
    title.textContent = stage.title;
    detail.textContent = stage.detail;
    elapsed.textContent = '0초';
    overlay.hidden = false;
    timer = globalThis.setInterval?.(() => {
      seconds += 1;
      elapsed.textContent = `${seconds}초`;
    }, 1000) ?? null;
  };

  const pendingHandler = event => show(event?.detail?.step);
  eventTarget?.addEventListener?.('company:pending-step', pendingHandler);

  const streamStatus = documentRef.getElementById?.('stream-status');
  let observer = null;
  if (streamStatus && typeof MutationObserverImpl === 'function') {
    observer = new MutationObserverImpl(() => {
      if (!String(streamStatus.textContent ?? '').trim()) hide();
    });
    observer.observe(streamStatus, { childList: true, characterData: true, subtree: true });
  }

  return {
    overlay,
    show,
    hide,
    destroy() {
      hide();
      observer?.disconnect?.();
      eventTarget?.removeEventListener?.('company:pending-step', pendingHandler);
      overlay.remove?.();
    }
  };
}

function boot() {
  createTurnLoadingOverlay();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}
