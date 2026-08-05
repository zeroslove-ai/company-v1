export function installBootGuard({ documentRef = document, timeoutMs = 12000 } = {}) {
  const fallback = documentRef.querySelector('#boot-fallback');
  const status = documentRef.querySelector('#api-status');
  const story = documentRef.querySelector('#story-history');
  const setup = documentRef.querySelector('#player-setup-overlay');
  if (!fallback) return null;

  let ready = false;
  function detectReady() {
    const statusLabel = status?.getAttribute?.('aria-label') ?? '';
    const setupVisible = setup?.hidden === false;
    const storyReady = (story?.children?.length ?? 0) > 0;
    const connected = statusLabel && statusLabel !== '연결 확인 중';
    if (setupVisible || storyReady || connected) {
      ready = true;
      fallback.hidden = true;
      documentRef.body?.setAttribute?.('data-app-ready', 'true');
      return true;
    }
    return false;
  }

  const observer = new MutationObserver(detectReady);
  if (status) observer.observe(status, { attributes: true, attributeFilter: ['aria-label', 'title'] });
  if (story) observer.observe(story, { childList: true, subtree: true });
  if (setup) observer.observe(setup, { attributes: true, attributeFilter: ['hidden'] });
  globalThis.addEventListener?.('error', event => {
    if (ready) return;
    const message = documentRef.querySelector('#boot-fallback-message');
    if (message) message.textContent = `화면 모듈을 불러오지 못했습니다. 새로고침해 주세요. (${event?.message || '스크립트 오류'})`;
  });
  globalThis.addEventListener?.('unhandledrejection', () => {
    if (ready) return;
    const message = documentRef.querySelector('#boot-fallback-message');
    if (message) message.textContent = '초기 화면 구성 중 오류가 발생했습니다. 새로고침 후 다시 시도해 주세요.';
  });
  setTimeout(() => {
    if (!detectReady()) {
      const message = documentRef.querySelector('#boot-fallback-message');
      if (message) message.textContent = '게임 화면을 아직 불러오지 못했습니다. 네트워크 상태를 확인하고 새로고침해 주세요.';
    }
  }, timeoutMs);
  detectReady();
  return { detectReady };
}

if (typeof document !== 'undefined') installBootGuard();
