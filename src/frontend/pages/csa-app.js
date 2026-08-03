/**
 * 상식개변 앱 modal — ported from donor's pages/csa-app.js UI (home/csa/manual
 * tabs, draft-based preset+custom editing with an undo/apply bar, pending/
 * busy handling, mobile-safe overlay). Adapted to Company's documentRef
 * lookup + api client instead of a window-global IIFE. The NPC/player-info
 * tabs are intentionally out of this port's scope (see completion report) —
 * home/csa/manual match the app's actual state-changing surface.
 *
 * Applying a change never calls a separate save endpoint: it hands the
 * server-validated canonical_action + display_input to onSubmit, which the
 * caller (app.js) runs through the exact same Story->Extract->Commit
 * pipeline as any other player action.
 */
import { ApiError } from './api.js';
import {
  activeItems, applyPresetDefaults, createDraft, dirty, hydrateDraftItem,
  isPresetPayloadComplete, normalizeStrengthId, operations, presetCatalogItem,
  presetOptionLabel, presetPreviewContent, presetStrength, resetPresetSelection
} from './csa-app-state.js';

const STRENGTH_DESCRIPTIONS = {
  weak: '민망한 자세·거리·비접촉적 신체 접촉·자유로운 옷차림을 회사 전체의 정상적인 관행으로 만듭니다.',
  medium: '강한 노출·민감 부위 확인·성적 생리현상 처리를 회사 전체의 정상 업무로 만듭니다.',
  strong: '플레이어의 직접적인 성적 요구와 권한을 회사 전체의 최우선 규정으로 만듭니다.'
};

function messageFor(error) {
  return error instanceof ApiError ? error.message : '상식개변 앱 요청에 실패했습니다.';
}

export function createCsaApp({ documentRef, api, gameId, onSubmit, onError }) {
  const get = id => documentRef.querySelector(`#${id}`);
  const el = (tag, className = '', text = '') => {
    const node = documentRef.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const elements = {
    overlay: get('csa-app-overlay'), body: get('csa-app-body'), draftBar: get('csa-app-draft-bar'),
    close: get('csa-app-close'), tabs: get('csa-app-tabs')
  };

  let appState = null, draft = null, applying = false;

  function isOpen() { return draft !== null; }

  function syncDraftBar() {
    if (!elements.draftBar) return;
    elements.draftBar.replaceChildren();
    const ops = operations(appState, draft);
    elements.draftBar.append(el('span', '', ops.length ? `미적용 변경 ${ops.length}건` : '변경사항 없음'));
    const undo = el('button', 'choice-btn', '모두 되돌리기');
    undo.disabled = !ops.length || applying;
    undo.onclick = () => { draft.csa = JSON.parse(JSON.stringify(draft.original)); draft.issues = []; renderTab(draft.tab); };
    const apply = el('button', 'choice-btn', applying ? '확인 중…' : '적용');
    const missingStrength = ops.some(item => item.operation !== 'deactivate' && !normalizeStrengthId(appState, item.strength));
    apply.disabled = !ops.length || applying || missingStrength;
    apply.onclick = () => applyDraft();
    elements.draftBar.append(undo, apply);
  }

  function renderHome(body) {
    const home = appState.home || {}, status = home.status || {};
    const grid = el('div', 'csa-app-status-grid');
    [['레벨', `Lv.${status.level || 1}`], ['경험치', `${status.exp || 0}/${status.next_level_exp || 0}`], ['상식개변', `${status.csa_active || 0}/${status.csa_max || 0}`, 'csa']].forEach(([label, value, tab]) => {
      const card = el(tab ? 'button' : 'div', `csa-app-card${tab ? ' csa-app-card-link' : ''}`);
      if (tab) { card.type = 'button'; card.onclick = () => renderTab(tab); }
      card.append(el('small', '', label), el('strong', '', value));
      grid.appendChild(card);
    });
    body.appendChild(grid);
    (home.diagnostics || []).forEach(item => body.appendChild(el('p', `csa-app-diagnostic ${item.type || ''}`, item.text)));
  }

  function selectField(label, value, options, onChange, disabled = false) {
    const wrap = el('label', 'csa-app-field');
    wrap.append(el('span', 'csa-app-field-label', label));
    const select = el('select', 'csa-app-select');
    options.forEach(option => {
      const node = el('option', '', option.label);
      node.value = option.id; node.disabled = option.disabled === true; node.selected = option.id === value;
      select.appendChild(node);
    });
    select.disabled = applying || disabled;
    select.onchange = () => onChange(select.value);
    wrap.appendChild(select);
    return wrap;
  }

  function renderPresetForm(item) {
    const wrap = el('div', 'csa-app-preset-form');
    const presets = appState?.csa_presets;
    if (!presets) { wrap.append(el('p', 'csa-app-error', '프리셋 정보를 불러오지 못했습니다.')); return wrap; }
    const selectedStrength = normalizeStrengthId(appState, item.strength);
    const strengthOptions = [{ id: '', label: '강도를 선택하세요', disabled: true },
      ...(appState.strength_options || []).map(option => ({ id: option.id, label: option.available || selectedStrength === option.id ? option.label : `${option.label} · Lv.${option.unlock_level} 해금`, disabled: !option.available && selectedStrength !== option.id }))];
    wrap.appendChild(selectField('강도', selectedStrength || '', strengthOptions, value => {
      if (value === selectedStrength) return;
      item.strength = value || null; resetPresetSelection(item); renderTab('csa');
    }));
    if (selectedStrength && STRENGTH_DESCRIPTIONS[selectedStrength]) wrap.appendChild(el('p', 'csa-app-scope-label', STRENGTH_DESCRIPTIONS[selectedStrength]));

    const strengthItems = selectedStrength ? presets.items.filter(entry => presetStrength(entry) === selectedStrength) : [];
    const categories = presets.categories.filter(category => strengthItems.some(entry => entry.category === category.id)).map(category => ({ id: category.id, label: category.label }));
    wrap.appendChild(selectField('분류', item.category || '', [{ id: '', label: selectedStrength ? '분류를 선택하세요' : '강도를 먼저 선택하세요', disabled: true }, ...categories], value => {
      item.category = value || null; item.template_id = null; item.actor_group = null; item.target_group = null;
      item.trigger = null; item.duration = null; item.modifier = ''; item.content = ''; renderTab('csa');
    }, !selectedStrength));

    const categoryItems = item.category ? strengthItems.filter(entry => entry.category === item.category) : [];
    wrap.appendChild(selectField('프리셋', item.template_id || '', [{ id: '', label: item.category ? '프리셋을 선택하세요' : (selectedStrength ? '분류를 먼저 선택하세요' : '강도를 먼저 선택하세요'), disabled: true }, ...categoryItems.map(entry => ({ id: entry.id, label: entry.label, disabled: !entry.available }))], value => {
      applyPresetDefaults(item, presetCatalogItem(appState, value)); renderTab('csa');
    }, !selectedStrength || !item.category));

    const catalogItem = presetCatalogItem(appState, item.template_id);
    if (catalogItem && presetStrength(catalogItem) === selectedStrength) {
      wrap.appendChild(selectField('행동 주체', item.actor_group, catalogItem.actor_options.map(id => ({ id, label: presetOptionLabel(appState, 'actor', id) })), value => { item.actor_group = value; syncDraftBar(); renderTab('csa'); }));
      if (catalogItem.target_options.length) {
        wrap.appendChild(selectField('상대', item.target_group, catalogItem.target_options.map(id => ({ id, label: presetOptionLabel(appState, 'target', id) })), value => { item.target_group = value; syncDraftBar(); renderTab('csa'); }));
      } else {
        wrap.append(el('p', 'csa-app-scope-label', '이 프리셋은 상대를 지정하지 않습니다.'));
      }
      wrap.appendChild(selectField('발동 상황', item.trigger, catalogItem.allowed_triggers.map(id => ({ id, label: presetOptionLabel(appState, 'trigger', id) })), value => { item.trigger = value; syncDraftBar(); renderTab('csa'); }));
      wrap.appendChild(selectField('지속 조건', item.duration, catalogItem.allowed_durations.map(id => ({ id, label: presetOptionLabel(appState, 'duration', id) })), value => { item.duration = value; syncDraftBar(); renderTab('csa'); }));

      const modifierLabel = el('label', 'csa-app-field');
      modifierLabel.append(el('span', 'csa-app-field-label', '세부 수식어 (선택, 최대 60자)'));
      const modifierInput = el('input', 'csa-app-select');
      modifierInput.type = 'text'; modifierInput.maxLength = 60; modifierInput.value = item.modifier || ''; modifierInput.disabled = applying;
      const previewPlaceholder = '항목을 모두 선택하면 문장이 완성됩니다.';
      const previewText = el('p', '', presetPreviewContent(appState, item) || previewPlaceholder);
      modifierInput.oninput = () => { item.modifier = modifierInput.value; previewText.textContent = presetPreviewContent(appState, item) || previewPlaceholder; syncDraftBar(); };
      modifierLabel.appendChild(modifierInput);
      wrap.appendChild(modifierLabel);
      const previewBox = el('div', 'csa-app-preview');
      previewBox.append(el('small', '', '완성 문장 미리보기'), previewText);
      wrap.appendChild(previewBox);
    } else {
      const waiting = selectedStrength ? '프리셋을 먼저 선택하세요' : '강도를 먼저 선택하세요';
      [['행동 주체', ''], ['상대', ''], ['발동 상황', ''], ['지속 조건', '']].forEach(([label]) => wrap.appendChild(selectField(label, '', [{ id: '', label: waiting, disabled: true }], () => {}, true)));
    }
    return wrap;
  }

  function renderCustomForm(item) {
    const wrap = el('div', 'csa-app-custom-form');
    const selectedStrength = normalizeStrengthId(appState, item.strength);
    const strengthField = el('label', 'csa-app-field');
    const strength = el('select', 'csa-app-select');
    const options = [{ id: '', label: '강도를 선택하세요', disabled: true }, ...(appState.strength_options || []).map(option => ({ id: option.id, label: option.available || selectedStrength === option.id ? option.label : `${option.label} · Lv.${option.unlock_level} 해금`, disabled: !option.available && selectedStrength !== option.id }))];
    options.forEach(option => { const node = el('option', '', option.label); node.value = option.id; node.disabled = option.disabled; node.selected = option.id === (selectedStrength || ''); strength.appendChild(node); });
    strength.disabled = applying; strength.onchange = () => { item.strength = strength.value || null; renderTab('csa'); };
    strengthField.append(el('span', 'csa-app-field-label', '강도'), strength);
    wrap.append(strengthField, el('p', 'csa-app-scope-label', '적용 범위: 회사 전체'));
    if (selectedStrength && STRENGTH_DESCRIPTIONS[selectedStrength]) wrap.appendChild(el('p', 'csa-app-scope-label', STRENGTH_DESCRIPTIONS[selectedStrength]));
    if (!selectedStrength) wrap.appendChild(el('p', 'csa-app-scope-label', '먼저 강도를 선택하세요.'));
    const content = el('textarea', 'csa-app-textarea');
    content.value = item.content || ''; content.placeholder = '이 공간에서 적용할 사회적 상식을 입력하세요.';
    content.disabled = applying || !selectedStrength;
    content.oninput = () => { item.content = content.value; syncDraftBar(); };
    wrap.append(content);
    return wrap;
  }

  function renderCsaItem(item) {
    const card = el('article', `csa-app-effect-card${item._deleted ? ' pending-delete' : ''}`);
    const header = el('div', 'csa-app-effect-header');
    header.append(el('strong', '', item._new ? '신규 상식개변' : item.scope_label || '상식개변'));
    const toggle = el('button', 'choice-btn', item._deleted ? '해제 취소' : '해제');
    toggle.disabled = applying;
    toggle.onclick = () => { if (item._new) draft.csa.splice(draft.csa.indexOf(item), 1); else item._deleted = !item._deleted; renderTab('csa'); };
    header.appendChild(toggle); card.appendChild(header);
    if (item._deleted) { card.append(el('p', 'csa-app-scope-label', '해제 예정입니다.')); return card; }
    const modeTabs = el('div', 'csa-app-mode-tabs');
    const presetTab = el('button', `choice-btn${item.source_type === 'preset' ? ' selected' : ''}`, '프리셋으로 만들기');
    const customTab = el('button', `choice-btn${item.source_type !== 'preset' ? ' selected' : ''}`, '직접 작성');
    presetTab.type = 'button'; customTab.type = 'button'; presetTab.disabled = applying; customTab.disabled = applying;
    presetTab.onclick = () => { if (item.source_type !== 'preset') { item.source_type = 'preset'; resetPresetSelection(item); renderTab('csa'); } };
    customTab.onclick = () => {
      if (item.source_type !== 'preset') return;
      item.content = presetPreviewContent(appState, item) || item.content || ''; item.source_type = 'custom'; renderTab('csa');
    };
    modeTabs.append(presetTab, customTab); card.appendChild(modeTabs);
    card.appendChild(item.source_type === 'preset' ? renderPresetForm(item) : renderCustomForm(item));
    return card;
  }

  function renderCsa(body) {
    const max = Number(appState.home?.status?.csa_max);
    const add = el('button', 'choice-btn', '+ 상식개변 추가');
    add.disabled = applying || (Number.isFinite(max) && activeItems(draft).length >= max);
    add.onclick = () => {
      draft.csa.push({ _new: true, client_id: `draft_csa_${crypto.randomUUID?.() ?? Date.now()}`, source_type: 'preset', strength: null, scope_label: '회사 전체', content: '', modifier: '' });
      renderTab('csa');
    };
    body.appendChild(add);
    if (add.disabled && activeItems(draft).length >= max) body.appendChild(el('p', 'csa-app-error', '활성 슬롯이 가득 찼습니다. 기존 항목을 해제한 뒤 추가해 주세요.'));
    if (!activeItems(draft).length) body.appendChild(el('p', '', '현재 활성 상식개변이 없습니다.'));
    draft.csa.forEach(item => body.appendChild(renderCsaItem(item)));
  }

  function section(body, title, draw, open = false) {
    const details = el('details', 'app-manual-section'); details.open = open;
    details.appendChild(el('summary', '', title));
    const inner = el('div', 'app-manual-section-body'); draw(inner);
    details.appendChild(inner); body.appendChild(details);
  }
  function list(root, items, ordered = false) {
    const node = el(ordered ? 'ol' : 'ul', 'app-manual-list');
    (items || []).forEach(item => node.appendChild(el('li', '', typeof item === 'string' ? item : item?.text || '')));
    root.appendChild(node);
  }
  function renderManual(body) {
    const manual = appState.manual || {};
    body.append(el('h3', '', manual.title || '상식개변 앱 매뉴얼'));
    if (manual.subtitle) body.append(el('p', '', manual.subtitle));
    section(body, '현재 앱 상태', root => { const status = manual.status || {}; root.append(el('p', '', `Lv.${status.level || 1} · 경험치 ${status.exp || 0}/${status.next_level_exp || 0} · 활성 ${status.csa_active || 0}/${status.csa_max || 0} · 범위 ${status.csa_scope_label || '-'}`)); }, true);
    section(body, '현재 상태 진단', root => (manual.diagnostics || []).forEach(item => root.append(el('p', `csa-app-diagnostic ${item.type || ''}`, item.text))), true);
    section(body, '빠른 사용법', root => list(root, manual.quick_start, true), true);
    section(body, '상식개변 규칙', root => { if (manual.common_sense?.description) root.append(el('p', '', manual.common_sense.description)); list(root, manual.common_sense?.rules); root.append(el('p', '', `현재 범위: ${manual.common_sense?.current_scope?.label || '-'}`)); });
    section(body, '상식개변 강도별 예시', root => (manual.common_sense?.tiers || []).forEach(tier => { root.append(el('h4', '', `${tier.label}${tier.available ? '' : ` · Lv.${tier.unlock_level} 잠금`}`)); if (tier.description) root.append(el('p', '', tier.description)); }));
    section(body, '레벨·해금 기능', root => (manual.unlocks || []).forEach(unlock => { root.append(el('h4', '', `Lv.${unlock.level}`)); list(root, unlock.items); }));
    section(body, '현재 활성 상식개변', root => { const effects = manual.active_effects?.common_sense || []; if (!effects.length) root.append(el('p', '', '현재 활성 상식개변이 없습니다.')); effects.forEach(item => root.append(el('p', 'app-manual-active-item', `[${item.scope_label} · ${item.strength}] ${item.content}`))); });
    section(body, '자주 발생하는 실패 원인', root => (manual.common_failures || []).forEach(item => { root.append(el('h4', '', item.title)); list(root, item.reasons); }));
  }

  function renderTab(tab) {
    if (!elements.body || !draft) return;
    draft.tab = ['home', 'csa', 'manual'].includes(tab) ? tab : 'home';
    elements.body.replaceChildren();
    (draft.issues || []).forEach(issue => elements.body.appendChild(el('p', 'csa-app-error', issue.message || String(issue))));
    ({ home: renderHome, csa: renderCsa, manual: renderManual })[draft.tab](elements.body);
    if (draft.notice) { elements.body.prepend(el('p', 'csa-app-diagnostic info', draft.notice)); draft.notice = ''; }
    elements.tabs?.querySelectorAll?.('[data-tab]')?.forEach?.(node => node.setAttribute?.('aria-selected', String(node.dataset.tab === draft.tab)));
    syncDraftBar();
  }

  async function applyDraft() {
    const ops = operations(appState, draft);
    if (!ops.length || applying) return;
    if (ops.some(item => item.operation !== 'deactivate' && !normalizeStrengthId(appState, item.strength))) { draft.issues = [{ message: '먼저 강도를 선택해 주세요.' }]; return renderTab('csa'); }
    if (ops.some(item => item.operation !== 'deactivate' && item.source_type === 'custom' && !item.content?.trim())) { draft.issues = [{ message: '상식개변 내용을 입력해 주세요.' }]; return renderTab('csa'); }
    if (ops.some(item => item.operation !== 'deactivate' && item.source_type === 'preset' && !isPresetPayloadComplete(appState, item.preset, item.strength))) { draft.issues = [{ message: '프리셋의 모든 항목을 선택해 주세요.' }]; return renderTab('csa'); }
    applying = true; renderTab(draft.tab);
    try {
      const result = await api.validateAppAction(gameId, { version: 1, type: 'app_transaction', base_turn_count: appState.turn_count, operations: ops });
      applying = false;
      close();
      await onSubmit?.(result.display_input, result.canonical_action);
    } catch (error) {
      applying = false;
      draft.issues = [{ message: messageFor(error) }];
      renderTab('csa');
      onError?.(error);
    }
  }

  function close() {
    if (elements.overlay) elements.overlay.hidden = true;
    draft = null; appState = null;
  }

  async function open(initialTab = 'home') {
    if (draft) { renderTab(initialTab); return; }
    if (elements.overlay) elements.overlay.hidden = false;
    elements.close && (elements.close.onclick = () => close());
    elements.tabs?.querySelectorAll?.('[data-tab]')?.forEach?.(button => { button.onclick = () => renderTab(button.dataset.tab); });
    try {
      const result = await api.appState(gameId);
      appState = result.app;
      draft = createDraft(appState, initialTab);
      renderTab(initialTab);
    } catch (error) {
      if (elements.body) elements.body.replaceChildren(el('p', 'csa-app-error', '상식개변 앱 정보를 불러오지 못했습니다.'));
      onError?.(error);
    }
  }

  return { open, close, isOpen };
}
