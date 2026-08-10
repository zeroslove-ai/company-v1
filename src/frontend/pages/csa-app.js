/**
 * 상식개변 앱 modal — 병원편의 실제 사용 흐름을 회사편 UI에 맞게 이식한다.
 * 홈/플레이어 정보/NPC 정보/상식개변/매뉴얼 탭, draft 기반 편집,
 * 미적용 변경 보호, ESC·바깥 클릭 닫기와 모바일 overlay를 제공한다.
 *
 * 적용은 별도 저장 API를 만들지 않는다. 서버가 검증한 canonical_action과
 * display_input을 기존 Story -> Extract -> Commit 파이프라인에 넘긴다.
 */
import { ApiError } from './api.js';
import {
  activeItems, applyPresetDefaults, createDraft,
  isPresetPayloadComplete, normalizeStrengthId, operations, presetCatalogItem,
  presetPreviewContent, presetStrength, resetPresetSelection
} from './csa-app-state.js';

const STRENGTH_DESCRIPTIONS = {
  weak: '사내 지침·운영 규정 — 밀착, 은근한 접촉, 야한 자세와 복장에 관한 제도입니다.',
  medium: '취업규칙·전사 준수 규정 — 직접적인 신체 노출과 성적 접촉에 관한 제도입니다.',
  strong: '국가 법령·관계 당국 의무 지침 — 플레이어가 지정한 구체적인 성행위와 체위에 관한 제도입니다.'
};

function messageFor(error) {
  return error instanceof ApiError ? error.message : '상식개변 앱 요청에 실패했습니다.';
}

function issuesFor(error) {
  if (error instanceof ApiError && Array.isArray(error.issues) && error.issues.length) {
    return error.issues.map(issue => ({ message: typeof issue?.message === 'string' && issue.message ? issue.message : messageFor(error) }));
  }
  return [{ message: messageFor(error) }];
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

  let appState = null;
  let draft = null;
  let applying = false;
  let opener = null;
  let keydownHandler = null;
  let bodyOverflow = '';

  function isOpen() { return draft !== null || elements.overlay?.hidden === false; }

  function pendingOperations() {
    return appState && draft ? operations(appState, draft) : [];
  }

  function destroy() {
    if (keydownHandler) documentRef.removeEventListener?.('keydown', keydownHandler);
    keydownHandler = null;
    if (documentRef.body?.style) documentRef.body.style.overflow = bodyOverflow;
    if (elements.overlay) {
      elements.overlay.hidden = true;
      elements.overlay.onclick = null;
    }
    appState = null;
    draft = null;
    applying = false;
    const previousOpener = opener;
    opener = null;
    previousOpener?.focus?.();
  }

  function requestClose() {
    if (applying) return false;
    const count = pendingOperations().length;
    if (count > 0) {
      const confirmed = globalThis.confirm?.(`아직 적용하지 않은 변경사항이 ${count}건 있습니다. 변경사항을 버리고 닫을까요?`) ?? false;
      if (!confirmed) return false;
    }
    destroy();
    return true;
  }

  function syncDraftBar() {
    if (!elements.draftBar) return;
    elements.draftBar.replaceChildren();
    const ops = pendingOperations();
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
    [
      ['레벨', `Lv.${status.level || 1}`],
      ['경험치', `${status.exp || 0}/${status.next_level_exp || 0}`],
      ['상식개변', `${status.csa_active || 0}/${status.csa_max || 0}`, 'csa']
    ].forEach(([label, value, tab]) => {
      const card = el(tab ? 'button' : 'div', `csa-app-card${tab ? ' csa-app-card-link' : ''}`);
      if (tab) {
        card.type = 'button';
        card.onclick = () => renderTab(tab);
        card.setAttribute?.('aria-label', '상식개변 관리하기');
      }
      card.append(el('small', '', label), el('strong', '', value));
      if (tab) card.append(el('span', 'csa-app-card-link-label', '관리하기 〉'));
      grid.appendChild(card);
    });
    body.appendChild(grid);
    (home.diagnostics || []).forEach(item => body.appendChild(el('p', `csa-app-diagnostic ${item.type || ''}`, item.text)));
  }

  function renderPlayer(body) {
    const info = appState.player_info || {};
    const fields = [
      ['이름', info.name],
      ['부서', info.department],
      ['직급', info.position],
      ['말투', info.speech_style],
      ['상식개변 레벨', `Lv.${info.level ?? 1}`],
      ['EXP', `${info.exp ?? 0} / ${info.next_level_exp ?? 0}`],
      ['활성 상식개변', `${info.active_csa_count ?? 0} / ${info.max_active_csa ?? 0}`]
    ];
    body.appendChild(el('h3', '', '플레이어 정보'));
    const grid = el('div', 'csa-app-status-grid');
    fields.forEach(([label, value]) => {
      const card = el('div', 'csa-app-card');
      card.append(el('small', '', label), el('strong', '', value === null || value === undefined || value === '' ? '미설정' : String(value)));
      grid.appendChild(card);
    });
    body.appendChild(grid);
  }

  function displayStat(value) {
    return typeof value === 'number' && Number.isFinite(value) ? String(value) : '미확인';
  }

  function renderNpcMind(card, npc) {
    const mind = npc?.mind || {};
    if (!mind.surface && !mind.subconscious) return;
    const box = el('div', 'csa-app-npc-mind');
    const surface = el('section', 'csa-app-npc-mind-item');
    surface.append(el('strong', '', '표면의식'), el('p', '', mind.surface || '미확인'));
    const subconscious = el('section', 'csa-app-npc-mind-item');
    subconscious.append(el('strong', '', '잠재의식'), el('p', '', mind.subconscious || '미확인'));
    box.append(surface, subconscious);
    card.appendChild(box);
  }

  function renderNpcCard(npc) {
    const card = el('article', `csa-app-npc-card${npc.present_now ? ' present' : ''}`);
    const head = el('div', 'csa-app-npc-head');
    const identity = el('div');
    identity.append(el('h3', '', npc.name || npc.id || 'NPC'));
    const role = [npc.department, npc.position, npc.role].filter(Boolean).join(' · ');
    identity.append(el('p', 'csa-app-npc-role', role || '소속·직무 미확인'));
    head.append(identity, el('span', `csa-app-npc-presence${npc.present_now ? ' active' : ''}`, npc.present_now ? '현재 장면' : '장면 밖'));
    card.appendChild(head);

    const location = npc.location?.known ? npc.location.location_label : '위치 미확인';
    const scene = npc.scene_state || {};
    const currentPosition = scene.position_label || scene.posture_detail || scene.posture || '자세 미확인';
    const summary = el('div', 'csa-app-npc-summary');
    summary.append(
      el('p', '', `위치: ${location}`),
      el('p', '', `현재 자세: ${currentPosition}`)
    );
    card.appendChild(summary);

    const stats = npc.stats || {};
    const statGrid = el('div', 'csa-app-npc-stats');
    [
      ['호감도', displayStat(stats.affection)],
      ['저항도', displayStat(stats.resistance)],
      ['상식수용도', displayStat(stats.acceptance)],
      ['성적흥분도', displayStat(stats.arousal)]
    ].forEach(([label, value]) => {
      const item = el('div', 'csa-app-npc-stat');
      item.append(el('small', '', label), el('strong', '', value));
      statGrid.appendChild(item);
    });
    card.appendChild(statGrid);
    renderNpcMind(card, npc);

    if (npc.relationship_summary) {
      const relationship = el('details', 'csa-app-npc-details');
      relationship.append(el('summary', '', '관계 요약'), el('p', '', npc.relationship_summary));
      card.appendChild(relationship);
    }
    return card;
  }

  function renderNpcs(body) {
    const npcs = Array.isArray(appState.npcs) ? [...appState.npcs] : [];
    body.appendChild(el('h3', '', 'NPC 정보'));
    body.appendChild(el('p', 'csa-app-scope-label', '주요 인물과 이미 등장·확인된 일반 인물만 표시합니다. Mind Monitor는 표면의식과 잠재의식만 사용합니다.'));
    if (!npcs.length) {
      body.appendChild(el('p', '', '표시할 NPC 정보가 없습니다.'));
      return;
    }
    npcs.sort((left, right) => Number(right.present_now) - Number(left.present_now));
    const list = el('div', 'csa-app-npc-list');
    npcs.forEach(npc => list.appendChild(renderNpcCard(npc)));
    body.appendChild(list);
  }

  function selectField(label, value, options, onChange, disabled = false) {
    const wrap = el('label', 'csa-app-field');
    wrap.append(el('span', 'csa-app-field-label', label));
    const select = el('select', 'csa-app-select');
    options.forEach(option => {
      const node = el('option', '', option.label);
      node.value = option.id;
      node.disabled = option.disabled === true;
      node.selected = option.id === value;
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
    if (!presets) {
      wrap.append(el('p', 'csa-app-error', '프리셋 정보를 불러오지 못했습니다.'));
      return wrap;
    }
    const selectedStrength = normalizeStrengthId(appState, item.strength);
    const strengthOptions = [
      { id: '', label: '강도를 선택하세요', disabled: true },
      ...(appState.strength_options || []).map(option => ({
        id: option.id,
        label: option.available || selectedStrength === option.id ? option.label : `${option.label} · Lv.${option.unlock_level} 해금`,
        disabled: !option.available && selectedStrength !== option.id
      }))
    ];
    wrap.appendChild(selectField('강도', selectedStrength || '', strengthOptions, value => {
      if (value === selectedStrength) return;
      item.strength = value || null;
      resetPresetSelection(item);
      renderTab('csa');
    }));
    if (selectedStrength && STRENGTH_DESCRIPTIONS[selectedStrength]) {
      wrap.appendChild(el('p', 'csa-app-scope-label', STRENGTH_DESCRIPTIONS[selectedStrength]));
    }

    const strengthItems = selectedStrength ? presets.items.filter(entry => presetStrength(entry) === selectedStrength) : [];
    const categories = presets.categories
      .filter(category => strengthItems.some(entry => entry.category === category.id))
      .map(category => ({ id: category.id, label: category.label }));
    wrap.appendChild(selectField('분류', item.category || '', [
      { id: '', label: selectedStrength ? '분류를 선택하세요' : '강도를 먼저 선택하세요', disabled: true },
      ...categories
    ], value => {
      item.category = value || null;
      item.template_id = null;
      delete item.roles;
      item.content = '';
      renderTab('csa');
    }, !selectedStrength));

    const categoryItems = item.category ? strengthItems.filter(entry => entry.category === item.category) : [];
    wrap.appendChild(selectField('프리셋', item.template_id || '', [
      { id: '', label: item.category ? '프리셋을 선택하세요' : (selectedStrength ? '분류를 먼저 선택하세요' : '강도를 먼저 선택하세요'), disabled: true },
      ...categoryItems.map(entry => ({ id: entry.id, label: entry.label, disabled: !entry.available }))
    ], value => {
      applyPresetDefaults(item, presetCatalogItem(appState, value));
      renderTab('csa');
    }, !selectedStrength || !item.category));

    const catalogItem = presetCatalogItem(appState, item.template_id);
    if (catalogItem && presetStrength(catalogItem) === selectedStrength) {
      const scopeLabels = Object.fromEntries((presets.subject_scope_options || presets.selector_options || []).map(option => [option.id, option.label]));
      const subjectOptions = (catalogItem.allowed_subject_scopes || [catalogItem.affected_group]).map(id => ({
        id, label: scopeLabels[id] || id
      }));
      wrap.appendChild(selectField('규정 적용 대상', item.subject_scope || catalogItem.default_subject_scope || catalogItem.affected_group, subjectOptions, value => {
        item.subject_scope = value;
        renderTab('csa');
      }));
      const counterpartyOptions = (catalogItem.allowed_counterparty_scopes || []).map(id => ({ id, label: scopeLabels[id] || id }));
      if (counterpartyOptions.length) {
        const defaultCounterparty = item.counterparty_scope
          || catalogItem.default_counterparty_scope
          || counterpartyOptions.find(option => option.id === 'company_employee')?.id
          || counterpartyOptions[0]?.id
          || '';
        wrap.appendChild(selectField('상대 대상', defaultCounterparty, counterpartyOptions, value => {
          item.counterparty_scope = value || null;
          renderTab('csa');
        }));
      }
      if (catalogItem.trigger) wrap.appendChild(el('p', 'csa-app-scope-label', `적용 조건: ${catalogItem.trigger === 'continuous' ? '근무·장면 조건이 성립할 때' : '상대방의 요청 또는 지정이 있을 때'}`));
      const previewPlaceholder = '항목을 모두 선택하면 문장이 완성됩니다.';
      const previewText = el('p', '', presetPreviewContent(appState, item) || previewPlaceholder);
      const previewBox = el('div', 'csa-app-preview');
      previewBox.append(el('small', '', '완성 문장 미리보기'), previewText);
      wrap.appendChild(previewBox);
    } else {
      const previewBox = el('div', 'csa-app-preview');
      previewBox.append(el('small', '', '완성 문장 미리보기'), el('p', '', '항목을 모두 선택하면 문장이 완성됩니다.'));
      wrap.appendChild(previewBox);
    }
    return wrap;
  }

  function renderCustomForm(item) {
    const wrap = el('div', 'csa-app-custom-form');
    const selectedStrength = normalizeStrengthId(appState, item.strength);
    const strengthField = el('label', 'csa-app-field');
    const strength = el('select', 'csa-app-select');
    const options = [
      { id: '', label: '강도를 선택하세요', disabled: true },
      ...(appState.strength_options || []).map(option => ({
        id: option.id,
        label: option.available || selectedStrength === option.id ? option.label : `${option.label} · Lv.${option.unlock_level} 해금`,
        disabled: !option.available && selectedStrength !== option.id
      }))
    ];
    options.forEach(option => {
      const node = el('option', '', option.label);
      node.value = option.id;
      node.disabled = option.disabled;
      node.selected = option.id === (selectedStrength || '');
      strength.appendChild(node);
    });
    strength.disabled = applying;
    strength.onchange = () => { item.strength = strength.value || null; renderTab('csa'); };
    strengthField.append(el('span', 'csa-app-field-label', '강도'), strength);
    wrap.append(strengthField, el('p', 'csa-app-scope-label', '적용 범위: 회사 전체'));
    if (selectedStrength && STRENGTH_DESCRIPTIONS[selectedStrength]) wrap.appendChild(el('p', 'csa-app-scope-label', STRENGTH_DESCRIPTIONS[selectedStrength]));
    if (!selectedStrength) wrap.appendChild(el('p', 'csa-app-scope-label', '먼저 강도를 선택하세요.'));
    const content = el('textarea', 'csa-app-textarea');
    content.value = item.content || '';
    content.placeholder = '회사 전체에 적용할 회사 지침·취업규칙·법령을 입력하세요.';
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
    toggle.onclick = () => {
      if (item._new) draft.csa.splice(draft.csa.indexOf(item), 1);
      else item._deleted = !item._deleted;
      renderTab('csa');
    };
    header.appendChild(toggle);
    card.appendChild(header);
    if (item._deleted) {
      card.append(el('p', 'csa-app-scope-label', '해제 예정입니다.'));
      return card;
    }
    const modeTabs = el('div', 'csa-app-mode-tabs');
    const presetTab = el('button', `choice-btn${item.source_type === 'preset' ? ' selected' : ''}`, '프리셋으로 만들기');
    const customTab = el('button', `choice-btn${item.source_type !== 'preset' ? ' selected' : ''}`, '직접 작성');
    presetTab.type = 'button';
    customTab.type = 'button';
    presetTab.disabled = applying;
    customTab.disabled = applying;
    presetTab.onclick = () => {
      if (item.source_type !== 'preset') {
        item.source_type = 'preset';
        resetPresetSelection(item);
        renderTab('csa');
      }
    };
    customTab.onclick = () => {
      if (item.source_type !== 'preset') return;
      item.content = presetPreviewContent(appState, item) || item.content || '';
      item.source_type = 'custom';
      renderTab('csa');
    };
    modeTabs.append(presetTab, customTab);
    card.appendChild(modeTabs);
    card.appendChild(item.source_type === 'preset' ? renderPresetForm(item) : renderCustomForm(item));
    return card;
  }

  function renderCsa(body) {
    const max = Number(appState.home?.status?.csa_max);
    const add = el('button', 'choice-btn', '+ 상식개변 추가');
    add.disabled = applying || (Number.isFinite(max) && activeItems(draft).length >= max);
    add.onclick = () => {
      draft.csa.push({
        _new: true,
        client_id: `draft_csa_${crypto.randomUUID?.() ?? Date.now()}`,
        source_type: 'preset',
        strength: null,
        scope_label: '회사 전체',
        content: '',
      });
      renderTab('csa');
    };
    body.appendChild(add);
    if (add.disabled && activeItems(draft).length >= max) {
      body.appendChild(el('p', 'csa-app-error', '활성 슬롯이 가득 찼습니다. 기존 항목을 해제한 뒤 추가해 주세요.'));
    }
    if (!activeItems(draft).length) body.appendChild(el('p', '', '현재 활성 상식개변이 없습니다.'));
    draft.csa.forEach(item => body.appendChild(renderCsaItem(item)));
  }

  function section(body, title, draw, open = false) {
    const details = el('details', 'app-manual-section');
    details.open = open;
    details.appendChild(el('summary', '', title));
    const inner = el('div', 'app-manual-section-body');
    draw(inner);
    details.appendChild(inner);
    body.appendChild(details);
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
    section(body, '현재 앱 상태', root => {
      const status = manual.status || {};
      root.append(el('p', '', `Lv.${status.level || 1} · 경험치 ${status.exp || 0}/${status.next_level_exp || 0} · 활성 ${status.csa_active || 0}/${status.csa_max || 0} · 범위 ${status.csa_scope_label || '-'}`));
    }, true);
    section(body, '현재 상태 진단', root => (manual.diagnostics || []).forEach(item => root.append(el('p', `csa-app-diagnostic ${item.type || ''}`, item.text))), true);
    section(body, '빠른 사용법', root => list(root, manual.quick_start, true), true);
    section(body, '상식개변 규칙', root => {
      if (manual.common_sense?.description) root.append(el('p', '', manual.common_sense.description));
      list(root, manual.common_sense?.rules);
      root.append(el('p', '', `현재 범위: ${manual.common_sense?.current_scope?.label || '-'}`));
    });
    section(body, '상식개변 강도별 예시', root => (manual.common_sense?.tiers || []).forEach(tier => {
      root.append(el('h4', '', `${tier.label}${tier.available ? '' : ` · Lv.${tier.unlock_level} 잠금`}`));
      if (tier.description) root.append(el('p', '', tier.description));
    }));
    section(body, '레벨·해금 기능', root => (manual.unlocks || []).forEach(unlock => {
      root.append(el('h4', '', `Lv.${unlock.level}`));
      list(root, unlock.items);
    }));
    section(body, '현재 활성 상식개변', root => {
      const effects = manual.active_effects?.common_sense || [];
      if (!effects.length) root.append(el('p', '', '현재 활성 상식개변이 없습니다.'));
      effects.forEach(item => root.append(el('p', 'app-manual-active-item', `[${item.scope_label} · ${item.strength}] ${item.content}`)));
    });
    section(body, '자주 발생하는 실패 원인', root => (manual.common_failures || []).forEach(item => {
      root.append(el('h4', '', item.title));
      list(root, item.reasons);
    }));
  }

  function renderTab(tab) {
    if (!elements.body || !draft) return;
    draft.tab = ['home', 'player', 'npc', 'csa', 'manual'].includes(tab) ? tab : 'home';
    elements.body.replaceChildren();
    (draft.issues || []).forEach(issue => elements.body.appendChild(el('p', 'csa-app-error', issue.message || String(issue))));
    ({ home: renderHome, player: renderPlayer, npc: renderNpcs, csa: renderCsa, manual: renderManual })[draft.tab](elements.body);
    if (draft.notice) {
      elements.body.prepend(el('p', 'csa-app-diagnostic info', draft.notice));
      draft.notice = '';
    }
    elements.tabs?.querySelectorAll?.('[data-tab]')?.forEach?.(node => node.setAttribute?.('aria-selected', String(node.dataset.tab === draft.tab)));
    syncDraftBar();
  }

  async function applyDraft() {
    const ops = pendingOperations();
    if (!ops.length || applying) return;
    if (ops.some(item => item.operation !== 'deactivate' && !normalizeStrengthId(appState, item.strength))) {
      draft.issues = [{ message: '먼저 강도를 선택해 주세요.' }];
      return renderTab('csa');
    }
    if (ops.some(item => item.operation !== 'deactivate' && item.source_type === 'custom' && !item.content?.trim())) {
      draft.issues = [{ message: '상식개변 내용을 입력해 주세요.' }];
      return renderTab('csa');
    }
    if (ops.some(item => item.operation !== 'deactivate' && item.source_type === 'preset' && !isPresetPayloadComplete(appState, item.preset, item.strength))) {
      draft.issues = [{ message: '프리셋의 모든 항목을 선택해 주세요.' }];
      return renderTab('csa');
    }
    applying = true;
    renderTab(draft.tab);
    let validated;
    try {
      validated = await api.validateAppAction(gameId, {
        version: 1,
        type: 'app_transaction',
        base_turn_count: appState.turn_count,
        operations: ops
      });
    } catch (error) {
      applying = false;
      draft.issues = issuesFor(error);
      renderTab('csa');
      onError?.(error);
      return;
    }
    try {
      const handedOff = await onSubmit?.(validated.display_input, validated.canonical_action);
      if (handedOff === false) {
        applying = false;
        draft.issues = [{ message: '변경사항은 확인되었지만 적용에 실패했습니다. 다시 시도해 주세요.' }];
        renderTab(draft.tab);
        return;
      }
      destroy();
    } catch (error) {
      applying = false;
      draft.issues = issuesFor(error);
      renderTab(draft.tab);
      onError?.(error);
    }
  }

  async function open(initialTab = 'home') {
    if (draft) {
      renderTab(initialTab);
      return;
    }
    opener = documentRef.activeElement;
    bodyOverflow = documentRef.body?.style?.overflow || '';
    if (documentRef.body?.style) documentRef.body.style.overflow = 'hidden';
    if (elements.overlay) {
      elements.overlay.hidden = false;
      elements.overlay.onclick = event => { if (event.target === elements.overlay) requestClose(); };
    }
    if (elements.body) elements.body.replaceChildren(el('p', 'csa-app-diagnostic info', '상식개변 앱 정보를 불러오는 중…'));
    if (elements.draftBar) elements.draftBar.replaceChildren();
    if (elements.close) elements.close.onclick = () => requestClose();
    elements.tabs?.querySelectorAll?.('[data-tab]')?.forEach?.(button => { button.onclick = () => renderTab(button.dataset.tab); });
    keydownHandler = event => { if (event.key === 'Escape') requestClose(); };
    documentRef.addEventListener?.('keydown', keydownHandler);
    try {
      const result = await api.appState({ game_id: gameId });
      appState = result.app;
      draft = createDraft(appState, initialTab);
      renderTab(initialTab);
    } catch (error) {
      if (elements.body) elements.body.replaceChildren(el('p', 'csa-app-error', '상식개변 앱 정보를 불러오지 못했습니다.'));
      onError?.(error);
    }
  }

  return { open, close: requestClose, isOpen };
}
