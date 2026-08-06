import { createApiClient } from './api.js';
import { FRONTEND_CONFIG } from './config.js';

function resolveGameId() {
  const value = new URL(globalThis.location?.href ?? 'https://local.invalid/').searchParams.get('game');
  return value || FRONTEND_CONFIG.defaultGameId;
}

function value(value) {
  return value === null || value === undefined || value === '' ? '미설정' : String(value);
}

function field(documentRef, label, content) {
  const card = documentRef.createElement('div');
  card.className = 'csa-app-card csa-product-card';
  const small = documentRef.createElement('small');
  small.textContent = label;
  const strong = documentRef.createElement('strong');
  strong.textContent = value(content);
  card.append(small, strong);
  return card;
}

function activeRuleText(rule) {
  const parts = [rule?.strength, rule?.scope_label].filter(Boolean).join(' · ');
  return `${parts ? `[${parts}] ` : ''}${rule?.content || '내용 미확인'}`;
}

export function renderCompletePlayerInfo(documentRef, root, info) {
  if (!root || root.querySelector('.csa-product-player-extra')) return;
  const section = documentRef.createElement('section');
  section.className = 'csa-product-player-extra';
  const title = documentRef.createElement('h3');
  title.textContent = '최초 설정·현재 상태';
  const grid = documentRef.createElement('div');
  grid.className = 'csa-app-status-grid';
  [
    ['나이', info.age ? `${info.age}세` : '미설정'],
    ['키', info.height_cm ? `${info.height_cm}cm` : '미설정'],
    ['몸무게', info.weight_kg ? `${info.weight_kg}kg` : '미설정'],
    ['체형', info.body_type],
    ['음경 길이', info.penis_length_cm ? `${info.penis_length_cm}cm` : '미설정'],
    ['현재 위치', info.current_location],
    ['자세', info.posture_detail || info.posture],
    ['복장', info.clothing],
    ['흥분도', info.arousal ?? 0],
    ['사정 진행도', `${info.ejaculation_progress ?? 0}%`],
    ['누적 사정', `${info.ejaculation_count ?? 0}회`]
  ].forEach(([label, content]) => grid.append(field(documentRef, label, content)));
  section.append(title, grid);
  if (info.background) {
    const background = documentRef.createElement('details');
    background.className = 'csa-app-npc-details';
    const summary = documentRef.createElement('summary');
    summary.textContent = '최초 배경 설정';
    const paragraph = documentRef.createElement('p');
    paragraph.textContent = info.background;
    background.append(summary, paragraph);
    section.append(background);
  }
  const rules = Array.isArray(info.active_csa) ? info.active_csa : [];
  const ruleSection = documentRef.createElement('section');
  ruleSection.className = 'csa-product-active-rules';
  const ruleTitle = documentRef.createElement('h3');
  ruleTitle.textContent = `활성 상식개변 ${info.active_csa_count ?? rules.length}/${info.max_active_csa ?? 0}`;
  ruleSection.append(ruleTitle);
  if (!rules.length) {
    const empty = documentRef.createElement('p');
    empty.textContent = '현재 활성 상식개변이 없습니다.';
    ruleSection.append(empty);
  } else {
    for (const rule of rules) {
      const paragraph = documentRef.createElement('p');
      paragraph.className = 'app-manual-active-item';
      paragraph.textContent = activeRuleText(rule);
      ruleSection.append(paragraph);
    }
  }
  section.append(ruleSection);
  root.append(section);
}

function npcCard(documentRef, npc, { detailed = true } = {}) {
  const article = documentRef.createElement('article');
  article.className = `csa-app-npc-card${npc.present_now ? ' present' : ''}${detailed ? '' : ' compact'}`;
  const heading = documentRef.createElement('h3');
  heading.textContent = npc.name || npc.id;
  const role = documentRef.createElement('p');
  role.className = 'csa-app-npc-role';
  role.textContent = [npc.department, npc.position, npc.role].filter(Boolean).join(' · ') || '소속·직무 미확인';
  const presence = documentRef.createElement('p');
  presence.textContent = npc.present_now ? `현재 장면 · ${npc.location?.location_label || '위치 미확인'}` : `장면 밖 · ${npc.location?.location_label || '위치 미확인'}`;
  article.append(heading, role, presence);
  // 스탯·마인드는 메인 히로인(상세)에게만
  if (!detailed) return article;
  const stats = documentRef.createElement('div');
  stats.className = 'csa-app-npc-stats';
  [
    ['호감도', npc.stats?.affection ?? 0],

    ['상식수용도', npc.stats?.acceptance ?? 0],
    ['성적흥분도', npc.stats?.arousal ?? 0]
  ].forEach(([label, content]) => stats.append(field(documentRef, label, content)));
  article.append(stats);
  if (npc.mind?.surface || npc.mind?.subconscious) {
    const mind = documentRef.createElement('div');
    mind.className = 'csa-app-npc-mind';
    for (const [label, content] of [['표면의식', npc.mind.surface], ['잠재의식', npc.mind.subconscious]]) {
      const section = documentRef.createElement('section');
      section.className = 'csa-app-npc-mind-item';
      const strong = documentRef.createElement('strong');
      strong.textContent = label;
      const p = documentRef.createElement('p');
      p.textContent = content || '미확인';
      section.append(strong, p);
      mind.append(section);
    }
    article.append(mind);
  }
  if (npc.relationship_summary) {
    const details = documentRef.createElement('details');
    details.className = 'csa-app-npc-details';
    const summary = documentRef.createElement('summary');
    summary.textContent = '관계 요약';
    const p = documentRef.createElement('p');
    p.textContent = npc.relationship_summary;
    details.append(summary, p);
    article.append(details);
  }
  return article;
}

const HEROINE_ID_RE = /^heroine[1-9]$/;

export function renderNpcFallback(documentRef, root, npcs) {
  if (!root || root.querySelector('.csa-app-npc-card') || root.querySelector('.csa-product-npc-list')) return;
  const all = npcs ?? [];
  // 메인 히로인 5명만 상세 카드(스탯·마인드 포함), 나머지는 하단 간단 정보
  const heroines = all.filter(npc => HEROINE_ID_RE.test(npc.id ?? ''));
  const others = all.filter(npc => !HEROINE_ID_RE.test(npc.id ?? ''));
  const list = documentRef.createElement('div');
  list.className = 'csa-app-npc-list csa-product-npc-list';
  for (const npc of heroines) list.append(npcCard(documentRef, npc, { detailed: true }));
  if (others.length) {
    const section = documentRef.createElement('section');
    section.className = 'csa-product-npc-others';
    const title = documentRef.createElement('h3');
    title.textContent = '그 외 인물';
    section.append(title);
    const grid = documentRef.createElement('div');
    grid.className = 'csa-product-npc-others-grid';
    for (const npc of others) grid.append(npcCard(documentRef, npc, { detailed: false }));
    section.append(grid);
    list.append(section);
  }
  if (list.children.length) root.append(list);
}

export function promoteNewCsaCard(root) {
  if (!root) return false;
  const add = [...root.querySelectorAll('button')].find(button => button.textContent?.includes('상식개변 추가'));
  const cards = [...root.querySelectorAll('.csa-app-effect-card')];
  const fresh = cards.find(card => card.textContent?.includes('신규 상식개변'));
  if (!add || !fresh) return false;
  if (add.nextElementSibling !== fresh) add.insertAdjacentElement('afterend', fresh);
  if (fresh.dataset.promoted !== 'true') {
    fresh.dataset.promoted = 'true';
    fresh.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    fresh.querySelector('select, input, textarea, button')?.focus?.();
  }
  return true;
}

export function installCsaProductUi({ documentRef = document, api = createApiClient(), gameId = resolveGameId() } = {}) {
  const overlay = documentRef.querySelector('#csa-app-overlay');
  const body = documentRef.querySelector('#csa-app-body');
  const tabs = documentRef.querySelector('#csa-app-tabs');
  if (!overlay || !body || !tabs) return null;
  let cache = null;
  let loading = null;

  async function state() {
    if (cache) return cache;
    if (!loading) loading = api.appState({ game_id: gameId }).then(result => (cache = result?.app ?? result)).finally(() => { loading = null; });
    return loading;
  }

  async function enhance() {
    if (overlay.hidden) return;
    promoteNewCsaCard(body);
    const selected = tabs.querySelector('[data-tab][aria-selected="true"]')?.dataset?.tab;
    if (selected !== 'player' && selected !== 'npc') return;
    const app = await state().catch(() => null);
    if (!app) return;
    if (selected === 'player') renderCompletePlayerInfo(documentRef, body, app.player_info ?? {});
    if (selected === 'npc') renderNpcFallback(documentRef, body, app.npcs ?? []);
  }

  const observer = new MutationObserver(() => queueMicrotask(enhance));
  observer.observe(body, { childList: true, subtree: true });
  observer.observe(tabs, { attributes: true, subtree: true, attributeFilter: ['aria-selected'] });
  observer.observe(overlay, { attributes: true, attributeFilter: ['hidden'] });
  tabs.addEventListener('click', () => setTimeout(enhance, 0), true);
  return { enhance, reset: () => { cache = null; } };
}

if (typeof document !== 'undefined') installCsaProductUi();
