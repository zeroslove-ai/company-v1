import { createApiClient } from './api.js';
import { FRONTEND_CONFIG } from './config.js';
import { text } from './render.js';

function resolveGameId() {
  const value = new URL(globalThis.location?.href ?? 'https://local.invalid/').searchParams.get('game');
  return value || FRONTEND_CONFIG.defaultGameId;
}

function optionLabel(npc) {
  const detail = [npc.department, npc.position || npc.role].filter(Boolean).join(' · ');
  return detail ? `${npc.name} — ${detail}` : npc.name;
}

export function finderStatusText(result) {
  if (!result?.known_character || result.status === 'not_found') return '등록된 인물이 아닙니다.';
  if (result.status === 'present') return `${result.name}은(는) 현재 같은 장면에 있습니다${result.location_label ? ` · ${result.location_label}` : ''}.`;
  if (result.status === 'inferred_workplace') return `${result.name}의 마지막 위치 기록이 없어 기본 근무지 ${result.location_label}로 안내합니다.`;
  if (result.status === 'located') return `${result.name}: ${result.location_label || result.location_id}`;
  return `${result.name}의 현재 위치가 아직 기록되지 않았습니다.`;
}

export function installNpcFinder({ documentRef = document, api = createApiClient(), gameId = resolveGameId() } = {}) {
  const open = documentRef.querySelector('#find-npc');
  const overlay = documentRef.querySelector('#npc-finder-overlay');
  const close = documentRef.querySelector('#npc-finder-close');
  const select = documentRef.querySelector('#npc-finder-character');
  const find = documentRef.querySelector('#npc-finder-submit');
  const use = documentRef.querySelector('#npc-finder-use');
  const status = documentRef.querySelector('#npc-finder-status');
  const action = documentRef.querySelector('#player-action');
  if (!open || !overlay || !close || !select || !find || !use || !status) return null;

  let current = null;
  let loading = false;

  function setLoading(value) {
    loading = value;
    find.disabled = value;
    select.disabled = value;
  }

  async function populate() {
    select.replaceChildren();
    text(status, '등록된 인물 목록을 불러오는 중…');
    const result = await api.appState({ game_id: gameId });
    const npcs = Array.isArray(result?.finder_npcs) ? result.finder_npcs : Array.isArray(result?.npcs) ? result.npcs : [];
    for (const npc of npcs) {
      if (!npc?.id || !npc?.name) continue;
      const option = documentRef.createElement('option');
      option.value = npc.id;
      option.textContent = optionLabel(npc);
      select.append(option);
    }
    text(status, select.options?.length || select.children?.length ? '찾을 인물을 선택하세요.' : '등록된 인물 정보가 없습니다.');
  }

  async function openFinder() {
    if (loading) return;
    current = null;
    use.disabled = true;
    overlay.hidden = false;
    setLoading(true);
    try { await populate(); }
    catch { text(status, '인물 목록을 불러오지 못했습니다.'); }
    finally { setLoading(false); }
  }

  async function locate() {
    if (loading || !select.value) return;
    setLoading(true);
    use.disabled = true;
    text(status, '현재 위치를 확인하는 중…');
    try {
      current = await api.findNpc(gameId, select.value);
      text(status, finderStatusText(current));
      use.disabled = current?.can_move !== true;
    } catch (error) {
      current = null;
      text(status, error?.message || '위치를 확인하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function useMove() {
    if (!current?.can_move || !current.location_label || !action) return;
    action.value = `${current.location_label}로 이동해 ${current.name}을(를) 찾아간다.`;
    action.focus?.();
    overlay.hidden = true;
  }

  open.addEventListener('click', event => {
    event.stopImmediatePropagation();
    openFinder();
  }, true);
  close.addEventListener('click', event => {
    event.stopImmediatePropagation();
    overlay.hidden = true;
  }, true);
  find.addEventListener('click', event => {
    event.stopImmediatePropagation();
    locate();
  }, true);
  use.addEventListener('click', event => {
    event.stopImmediatePropagation();
    useMove();
  }, true);

  return { openFinder, locate };
}

if (typeof document !== 'undefined') installNpcFinder();
