import './hospital-mobile.js';

const DEFAULT_NEAR_BOTTOM_PX = 120;
const DEFAULT_RELEASE_PX = 84;
const DEFAULT_STEP_PX = 48;

export function distanceFromBottom(element) {
  if (!element) return Number.POSITIVE_INFINITY;
  const scrollHeight = Number(element.scrollHeight) || 0;
  const clientHeight = Number(element.clientHeight) || 0;
  const scrollTop = Number(element.scrollTop) || 0;
  return Math.max(0, scrollHeight - clientHeight - scrollTop);
}

export function nextGentleScrollTop(element, maxStep = DEFAULT_STEP_PX) {
  if (!element) return 0;
  const scrollHeight = Number(element.scrollHeight) || 0;
  const clientHeight = Number(element.clientHeight) || 0;
  const scrollTop = Number(element.scrollTop) || 0;
  const maximum = Math.max(0, scrollHeight - clientHeight);
  return Math.min(maximum, scrollTop + Math.min(Math.max(0, maxStep), Math.max(0, maximum - scrollTop)));
}

export function createHospitalScrollController({
  storyPanel,
  currentTurn,
  currentStory,
  nearBottomPx = DEFAULT_NEAR_BOTTOM_PX,
  releasePx = DEFAULT_RELEASE_PX,
  stepPx = DEFAULT_STEP_PX,
  MutationObserverImpl = globalThis.MutationObserver,
  requestFrame = globalThis.requestAnimationFrame ?? (callback => globalThis.setTimeout(callback, 0)),
} = {}) {
  if (!storyPanel || !currentTurn || !currentStory || typeof MutationObserverImpl !== 'function') return null;

  let turnActive = false;
  let followArmed = false;
  let internalScroll = false;
  let destroyed = false;

  function releaseInternalScroll() {
    requestFrame(() => { internalScroll = false; });
  }

  function revealTurnStart() {
    internalScroll = true;
    currentTurn.scrollIntoView?.({ block: 'start', inline: 'nearest' });
    releaseInternalScroll();
  }

  function gentleFollow() {
    if (!followArmed || destroyed) return;
    const nextTop = nextGentleScrollTop(storyPanel, stepPx);
    if (nextTop <= storyPanel.scrollTop) return;
    internalScroll = true;
    storyPanel.scrollTop = nextTop;
    releaseInternalScroll();
  }

  function hasCurrentStory() {
    return Boolean(String(currentStory.textContent ?? '').trim()) || (currentStory.childNodes?.length ?? 0) > 0;
  }

  function handleMutation() {
    const hasStory = hasCurrentStory();
    if (hasStory && !turnActive) {
      followArmed = distanceFromBottom(storyPanel) <= nearBottomPx;
      turnActive = true;
      revealTurnStart();
      return;
    }
    if (!hasStory && turnActive) {
      turnActive = false;
      followArmed = false;
      return;
    }
    if (hasStory && turnActive) gentleFollow();
  }

  function handleScroll() {
    if (internalScroll || !turnActive) return;
    if (distanceFromBottom(storyPanel) > releasePx) followArmed = false;
  }

  storyPanel.addEventListener('scroll', handleScroll, { passive: true });
  const observer = new MutationObserverImpl(handleMutation);
  observer.observe(currentStory, { childList: true, characterData: true, subtree: true });
  handleMutation();

  return {
    get followArmed() { return followArmed; },
    get turnActive() { return turnActive; },
    destroy() {
      destroyed = true;
      observer.disconnect();
      storyPanel.removeEventListener('scroll', handleScroll);
    },
  };
}

function bootHospitalScroll() {
  const storyPanel = document.getElementById('story-panel');
  const currentTurn = document.getElementById('current-turn');
  const currentStory = document.getElementById('current-story');
  createHospitalScrollController({ storyPanel, currentTurn, currentStory });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootHospitalScroll, { once: true });
  else bootHospitalScroll();
}
