const MOBILE_QUERY = '(max-width: 900px)';

export function arrangeHospitalMobileLayout({ mobile, gameShell, gameLayout, statusColumn, actionPanel, utilityToolbar }) {
  if (!gameShell || !gameLayout || !statusColumn || !actionPanel || !utilityToolbar) return false;
  if (mobile) {
    if (actionPanel.parentElement !== gameLayout || actionPanel.nextElementSibling !== statusColumn) {
      gameLayout.insertBefore(actionPanel, statusColumn);
    }
    return true;
  }
  if (actionPanel.parentElement !== gameShell || actionPanel.nextElementSibling !== utilityToolbar) {
    gameShell.insertBefore(actionPanel, utilityToolbar);
  }
  return true;
}

export function createHospitalMobileController({
  documentRef = globalThis.document,
  matchMediaImpl = globalThis.matchMedia?.bind(globalThis),
} = {}) {
  if (!documentRef || typeof matchMediaImpl !== 'function') return null;
  const gameShell = documentRef.getElementById('game-main');
  const gameLayout = documentRef.querySelector('.game-layout');
  const statusColumn = documentRef.querySelector('.status-column');
  const actionPanel = documentRef.getElementById('action-panel');
  const utilityToolbar = documentRef.querySelector('.utility-toolbar');
  if (!gameShell || !gameLayout || !statusColumn || !actionPanel || !utilityToolbar) return null;

  const media = matchMediaImpl(MOBILE_QUERY);
  const arrange = () => arrangeHospitalMobileLayout({
    mobile: media.matches,
    gameShell,
    gameLayout,
    statusColumn,
    actionPanel,
    utilityToolbar,
  });
  arrange();
  media.addEventListener?.('change', arrange);

  return {
    arrange,
    destroy() { media.removeEventListener?.('change', arrange); },
  };
}

function bootHospitalMobileLayout() {
  createHospitalMobileController();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootHospitalMobileLayout, { once: true });
  else bootHospitalMobileLayout();
}
