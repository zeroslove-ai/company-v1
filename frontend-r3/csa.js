import {
  committedCsaRules,
  createCsaDraft,
  csaDraftOperation,
  isCsaDraftDirty,
  stageCsaOperation
} from './csa-draft.js';

function el(documentRef, tag, text = '') {
  const node = documentRef.createElement(tag);
  if (text) node.textContent = text;
  return node;
}

function scopeLabel(scope) {
  return {
    player: '플레이어',
    female_employee: '여성 직원',
    male_employee: '남성 직원',
    company_employee: '회사 직원 전체'
  }[scope] ?? scope ?? '미지정';
}

function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }

function catalogLabel(entries, key, value) {
  return entries?.find(entry => entry?.[key] === value)?.name ?? value;
}

function validScope(options, preferred) {
  const values = Array.isArray(options) ? options : [];
  return values.includes(preferred) ? preferred : (values[0] ?? null);
}

function defaultCounterpartyScope(item) {
  const preferred = item?.default_counterparty_scope;
  if (item?.selector_schema === 'actor_pair' && preferred === 'player') {
    return validScope(item.counterparty_scopes, item.counterparty_scopes.find(scope => scope !== 'player'));
  }
  return validScope(item?.counterparty_scopes, preferred);
}

export function replacementPresetItems({ activeRules = [], catalogItems = [], rule } = {}) {
  const activeTemplates = new Set(activeRules
    .filter(activeRule => activeRule?.id !== rule?.id)
    .map(activeRule => activeRule?.template_id)
    .filter(Boolean));
  return (Array.isArray(catalogItems) ? catalogItems : [])
    .filter(item => item?.id && item.id !== rule?.template_id && !activeTemplates.has(item.id));
}

export function replacementOperation(rule, item) {
  if (!rule?.id || !item?.id) return null;
  return {
    operation: 'update',
    id: rule.id,
    template_id: item.id,
    subject_scope: validScope(item.subject_scopes, item.default_subject_scope),
    counterparty_scope: validScope(item.counterparty_scopes, item.default_counterparty_scope),
    ...(rule?.selector ?? {})
  };
}

export function createR3CsaUi({ documentRef = document, getContext, getCatalog, getBusy, onOperation } = {}) {
  const overlay = documentRef.querySelector('#csa-app-overlay');
  const body = documentRef.querySelector('#csa-app-body');
  const tabs = documentRef.querySelector('#csa-app-tabs');
  const draftBar = documentRef.querySelector('#csa-app-draft-bar');
  const open = documentRef.querySelector('#open-apps');
  const close = documentRef.querySelector('#csa-app-close');
  if (!overlay || !body || !open) return { sync() {} };

  let tab = 'home';
  let tier = 'weak';
  let draft = null;
  let applying = false;
  let opener = null;
  let savedOverflow = '';

  const catalog = () => getCatalog?.() ?? { items: [] };
  const context = () => getContext?.() ?? {};
  const activeRules = () => committedCsaRules(context());
  const activeFor = templateId => activeRules().find(rule => rule.template_id === templateId);
  const itemFor = templateId => catalog().items.find(item => item.id === templateId);
  const operationFor = templateId => csaDraftOperation(draft)?.template_id === templateId ? csaDraftOperation(draft) : null;

  function dirty() { return isCsaDraftDirty(draft); }

  function closeScrollLock() {
    if (documentRef.body?.style) documentRef.body.style.overflow = savedOverflow;
  }

  function cleanClose(discard = false) {
    if (discard || !dirty()) draft = null;
    overlay.hidden = true;
    documentRef.removeEventListener?.('keydown', onKeydown);
    closeScrollLock();
    opener?.focus?.();
    opener = null;
  }

  function requestClose() {
    if (applying) return false;
    if (dirty() && !(globalThis.confirm?.('적용하지 않은 변경 1건이 있습니다. 변경을 버리고 닫을까요?') ?? false)) return false;
    cleanClose(true);
    return true;
  }

  function onKeydown(event) { if (event.key === 'Escape') requestClose(); }

  function openApp() {
    if (!draft || (!dirty() && draft.baseRevision !== Number(context()?.state?.revision ?? 0))) draft = createCsaDraft(context());
    opener = open;
    savedOverflow = documentRef.body?.style?.overflow ?? '';
    if (documentRef.body?.style) documentRef.body.style.overflow = 'hidden';
    overlay.hidden = false;
    documentRef.addEventListener?.('keydown', onKeydown);
    render();
  }

  function notice(message) {
    draft = { ...(draft ?? createCsaDraft(context())), notice: message };
    render();
  }

  function stage(operation) {
    const result = stageCsaOperation(draft ?? createCsaDraft(context()), operation);
    if (result.blocked) { notice(result.notice); return false; }
    draft = result.draft;
    render();
    return true;
  }

  function selectField(label, options, value, onChange, disabled = false) {
    const wrap = el(documentRef, 'label', 'csa-app-field');
    wrap.append(el(documentRef, 'span', label));
    const select = el(documentRef, 'select');
    select.className = 'csa-app-select';
    for (const option of options) {
      const node = el(documentRef, 'option', scopeLabel(option));
      node.value = option;
      node.selected = option === value;
      select.append(node);
    }
    select.disabled = Boolean(disabled || applying || getBusy?.());
    select.addEventListener('change', () => onChange(select.value));
    wrap.append(select);
    return wrap;
  }

  function catalogField(label, options, value, onChange, disabled = false) {
    const wrap = el(documentRef, 'label', 'csa-app-field');
    wrap.append(el(documentRef, 'span', label));
    const select = el(documentRef, 'select');
    select.className = 'csa-app-select';
    for (const option of options) {
      const node = el(documentRef, 'option', option.label);
      node.value = option.id;
      node.selected = option.id === value;
      node.disabled = Boolean(option.disabled);
      select.append(node);
    }
    select.disabled = Boolean(disabled || applying || getBusy?.());
    select.addEventListener('change', () => onChange(select.value));
    wrap.append(select);
    return wrap;
  }

  function actorField(label, value, onChange, disabled = false) {
    const actors = (catalog().actors ?? []).filter(actor => actor?.id && actor.id !== 'player');
    return catalogField(label, [{ id: '', label: '대상 선택', disabled: true }, ...actors.map(actor => ({ id: actor.id, label: actor.name ?? actor.id }))], value, onChange, disabled);
  }

  function operationLiteral(operation) {
    const item = itemFor(operation?.template_id);
    const verb = { activate: '상식개변 적용', update: '상식개변 변경', deactivate: '상식개변 해제' }[operation?.operation] ?? '상식개변';
    const subject = operation?.subject_scope ? `대상 ${scopeLabel(operation.subject_scope)}` : '';
    const counterparty = operation?.counterparty_scope ? ` · 상대 ${scopeLabel(operation.counterparty_scope)}` : '';
    return `${verb}: ${item?.label ?? operation?.template_id ?? operation?.id ?? '규칙'}${subject ? ` · ${subject}` : ''}${counterparty}`;
  }

  async function applyDraft() {
    if (applying || getBusy?.() || !dirty()) return;
    const operation = clone(csaDraftOperation(draft));
    applying = true;
    overlay.hidden = true;
    closeScrollLock();
    render();
    try {
      const result = await Promise.resolve(onOperation?.({ ...operation, literal_action: operationLiteral(operation) }));
      if (result?.kind === 'committed') draft = null;
      else draft = { ...draft, notice: '변경이 적용되지 않았습니다. 초안은 보존되어 있습니다.' };
    } catch {
      draft = { ...draft, notice: '변경이 전송되지 않았습니다. 초안은 보존되어 있습니다.' };
    } finally {
      applying = false;
      sync();
    }
  }

  function draftBarRender() {
    if (!draftBar) return;
    draftBar.replaceChildren();
    const operation = csaDraftOperation(draft);
    const status = el(documentRef, 'span', operation ? '미적용 변경 1건' : '변경사항 없음');
    if (draft?.notice) status.append(el(documentRef, 'small', ` ${draft.notice}`));
    const revert = el(documentRef, 'button', '되돌리기');
    revert.type = 'button'; revert.disabled = !operation || applying;
    revert.addEventListener('click', () => { draft = createCsaDraft(context()); render(); });
    const apply = el(documentRef, 'button', applying ? '적용 중…' : '적용');
    apply.type = 'button'; apply.disabled = !operation || applying || Boolean(getBusy?.());
    apply.addEventListener('click', applyDraft);
    draftBar.append(status, revert, apply);
  }

  function renderHome() {
    const state = context()?.state?.state ?? {};
    const time = state.time ?? {};
    const grid = el(documentRef, 'div'); grid.className = 'csa-app-status-grid';
    const values = [
      ['현재 턴', context()?.state?.committed_turn ?? 0],
      ['게임 시간', `Day ${time.day ?? 1} · ${String(Math.floor((time.minute ?? 0) / 60)).padStart(2, '0')}:${String((time.minute ?? 0) % 60).padStart(2, '0')}`],
      ['활성 규칙', activeRules().length]
    ];
    values.forEach(([label, value]) => { const card = el(documentRef, 'div'); card.className = 'csa-app-card'; card.append(el(documentRef, 'small', label), el(documentRef, 'strong', String(value))); grid.append(card); });
    body.append(el(documentRef, 'h3', '홈'), grid);
    const route = el(documentRef, 'button', '상식개변 관리 열기'); route.type = 'button'; route.addEventListener('click', () => { tab = 'csa'; render(); }); body.append(route);
    body.append(el(documentRef, 'p', '상식개변 앱은 선택 사항이며, 게임 진행을 대신하지 않습니다.'));
  }

  function renderPlayer() {
    const profile = context()?.game?.profile ?? context()?.state?.state?.profile ?? {};
    body.append(el(documentRef, 'h3', '플레이어 정보'));
    const grid = el(documentRef, 'div'); grid.className = 'csa-app-status-grid';
    const fields = [
      ['이름', profile.name],
      ['부서', catalogLabel(catalog().departments, 'department_id', profile.department_id)],
      ['직급', catalogLabel(catalog().positions, 'position_id', profile.position_id)],
      ['체형', catalogLabel(catalog().body_types, 'body_type_id', profile.body_type_id)],
      ['말투', catalogLabel(catalog().speech_styles, 'speech_style_id', profile.speech_style_id)]
    ];
    fields.filter(([, value]) => value !== undefined && value !== null && value !== '').forEach(([label, value]) => { const card = el(documentRef, 'div'); card.className = 'csa-app-card'; card.append(el(documentRef, 'small', label), el(documentRef, 'strong', String(value))); grid.append(card); });
    body.append(grid);
    if (!grid.children.length) body.append(el(documentRef, 'p', '현재 커밋된 플레이어 정보가 없습니다.'));
  }

  function renderNpc() {
    const state = context()?.state?.state ?? {};
    const ids = Array.isArray(state.scene?.present_actor_ids) ? state.scene.present_actor_ids : [];
    const actors = catalog().actors ?? [];
    const monitors = context()?.turns?.at(-1)?.observer_applied?.mind_monitor ?? {};
    body.append(el(documentRef, 'h3', 'NPC 정보'), el(documentRef, 'p', '현재 커밋된 장면과 Mind Monitor만 표시합니다.'));
    const list = el(documentRef, 'div'); list.className = 'csa-app-npc-list';
    actors.forEach(actor => {
      const id = actor.id ?? actor.character_id; const present = ids.includes(id); const card = el(documentRef, 'article'); card.className = `csa-app-npc-card${present ? ' present' : ''}`;
      card.append(el(documentRef, 'h3', actor.name ?? id), el(documentRef, 'p', present ? '현재 장면에 있음' : '현재 장면 밖'));
      const monitor = monitors[id]; if (monitor) card.append(el(documentRef, 'p', `Mind Monitor: ${monitor.surface ?? monitor.text ?? '커밋된 정보'}`));
      list.append(card);
    });
    if (!list.children.length) list.append(el(documentRef, 'p', '현재 장면에 표시할 NPC가 없습니다.'));
    body.append(list);
  }

  function activeCard(rule) {
    const item = itemFor(rule.template_id); const pending = csaDraftOperation(draft); const isRemove = pending?.operation === 'deactivate' && pending.id === rule.id;
    const operation = pending?.id === rule.id && pending.operation === 'update' ? pending : null;
    const pendingItem = operation && operation.template_id !== rule.template_id ? itemFor(operation.template_id) : null;
    const card = el(documentRef, 'article'); card.className = `csa-app-effect-card${isRemove ? ' pending-delete' : ''}`;
    card.append(el(documentRef, 'strong', item?.label ?? rule.template_id), el(documentRef, 'p', isRemove ? '해제 예정 · 아직 서버에 반영되지 않음' : (rule.content ?? item?.content_template ?? '')));
    if (!isRemove && item) {
      const subject = operation?.subject_scope ?? rule.subject_scope ?? item.default_subject_scope;
      const counterparty = operation?.counterparty_scope ?? rule.counterparty_scope ?? item.default_counterparty_scope;
      card.append(selectField('대상 범위', item.subject_scopes, subject, value => stage({ operation: 'update', id: rule.id, template_id: item.id, subject_scope: value, counterparty_scope: counterparty })));
      if (item.counterparty_scopes.length) card.append(selectField('상대 범위', item.counterparty_scopes, counterparty, value => stage({ operation: 'update', id: rule.id, template_id: item.id, subject_scope: subject, counterparty_scope: value })));
    }
    if (pendingItem) {
      card.classList.add('pending-update');
      card.children[0].textContent = `${item?.label ?? rule.template_id} → ${pendingItem.label}`;
      card.children[1].textContent = pendingItem.content_template ?? '';
      while (card.children.length > 2) card.removeChild(card.lastElementChild);
      const pendingSubject = operation.subject_scope ?? pendingItem.default_subject_scope;
      const pendingCounterparty = operation.counterparty_scope ?? pendingItem.default_counterparty_scope;
      card.append(selectField('\uB300\uC0C1 \uBC94\uC704', pendingItem.subject_scopes, pendingSubject, value => stage({ operation: 'update', id: rule.id, template_id: pendingItem.id, subject_scope: value, counterparty_scope: pendingCounterparty })));
      if (pendingItem.counterparty_scopes.length) card.append(selectField('\uC0C1\uB300\uBC29 \uBC94\uC704', pendingItem.counterparty_scopes, pendingCounterparty, value => stage({ operation: 'update', id: rule.id, template_id: pendingItem.id, subject_scope: pendingSubject, counterparty_scope: value })));
      card.append(el(documentRef, 'p', `\uBCC0\uACBD \uC608\uC815: ${pendingItem.label}`));
      card.append(el(documentRef, 'p', `${pendingItem.strength ?? '\uADDC\uCE59'} · ${pendingItem.category ?? 'world_behavior'}`));
    }
    const replacementItems = replacementPresetItems({ activeRules: activeRules(), catalogItems: catalog().items, rule });
    const replacementOptions = [{ id: '', label: '\uADDC\uCE59 \uBCC0\uACBD \uD504\uB9AC\uC14B \uC120\uD0DD', disabled: Boolean(pendingItem) }, ...replacementItems.map(candidate => ({ id: candidate.id, label: candidate.label }))];
    card.append(catalogField('\uADDC\uCE59 \uBCC0\uACBD', replacementOptions, pendingItem?.id ?? '', value => {
      const replacement = replacementItems.find(candidate => candidate.id === value);
      if (replacement) stage(replacementOperation(rule, replacement));
    }, Boolean(pendingItem || isRemove)));
    const actions = el(documentRef, 'div'); actions.className = 'csa-entry-actions';
    const remove = el(documentRef, 'button', isRemove ? '해제 예정' : '해제'); remove.type = 'button'; remove.disabled = applying || Boolean(getBusy?.()) || isRemove; remove.addEventListener('click', () => stage({ operation: 'deactivate', id: rule.id, template_id: item?.id, subject_scope: rule.subject_scope })); actions.append(remove);
    card.append(actions); return card;
  }

  function presetCard(item) {
    const pending = operationFor(item.id); const active = activeFor(item.id); if (pending?.operation === 'update') return null; if (active && !pending) return null;
    const card = el(documentRef, 'article'); card.className = 'csa-app-card';
    card.append(el(documentRef, 'strong', `${item.strength ?? '규칙'} · ${item.label}`), el(documentRef, 'p', item.content_template ?? ''));
    const subject = pending?.subject_scope ?? item.default_subject_scope;
    const counterparty = pending?.counterparty_scope ?? defaultCounterpartyScope(item);
    if (item.supported_action_families?.length) card.append(el(documentRef, 'small', `지원 행동군: ${item.supported_action_families.join(', ')}`));
    if (item.selector_schema === 'named_actor' || item.selector_schema === 'actor_pair') card.append(actorField('지정 직원', pending?.subject_actor_id ?? '', value => stage({ operation: 'activate', template_id: item.id, subject_scope: subject, counterparty_scope: counterparty, subject_actor_id: value })));
    if (item.selector_schema === 'actor_pair') card.append(actorField('상대 직원', pending?.counterparty_actor_id ?? '', value => stage({ operation: 'activate', template_id: item.id, subject_scope: subject, counterparty_scope: counterparty, subject_actor_id: pending?.subject_actor_id, counterparty_actor_id: value })));
    card.append(selectField('대상 범위', item.subject_scopes, subject, value => stage({ operation: 'activate', template_id: item.id, subject_scope: value, counterparty_scope: counterparty })));
    if (item.counterparty_scopes.length) card.append(selectField('상대 범위', item.counterparty_scopes, counterparty, value => stage({ operation: 'activate', template_id: item.id, subject_scope: subject, counterparty_scope: value })));
    const choose = el(documentRef, 'button', pending ? '초안에 선택됨' : '초안에 담기'); choose.type = 'button'; choose.disabled = applying || Boolean(getBusy?.()) || Boolean(pending); choose.addEventListener('click', () => stage({ operation: 'activate', template_id: item.id, subject_scope: subject, counterparty_scope: counterparty })); card.append(choose);
    const selectorReady = item.selector_schema === 'none' || (item.selector_schema === 'named_actor' && Boolean(pending?.subject_actor_id)) || (item.selector_schema === 'actor_pair' && Boolean(pending?.subject_actor_id) && Boolean(pending?.counterparty_actor_id));
    choose.disabled = choose.disabled || !selectorReady;
    if (item.selector_schema !== 'none') choose.addEventListener('click', () => stage({ operation: 'activate', template_id: item.id, subject_scope: subject, counterparty_scope: counterparty, subject_actor_id: pending?.subject_actor_id, counterparty_actor_id: pending?.counterparty_actor_id }));
    return card;
  }

  function renderCsa() {
    body.append(el(documentRef, 'h3', '상식개변'), el(documentRef, 'p', '변경은 이 앱 안에서 먼저 초안으로 남습니다. 적용을 눌러야 다음 Story 턴으로 기록됩니다.'));
    const rules = activeRules();
    const current = el(documentRef, 'section'); current.append(el(documentRef, 'h4', `현재 활성 규칙 ${rules.length}개`));
    if (rules.length) rules.forEach(rule => current.append(activeCard(rule)));
    else current.append(el(documentRef, 'p', '현재 활성 규칙이 없습니다.'));
    body.append(current, el(documentRef, 'h4', '21-slot canonical catalog'));
    const tierTabs = el(documentRef, 'nav'); tierTabs.className = 'csa-tier-tabs';
    for (const value of ['weak', 'medium', 'strong']) { const button = el(documentRef, 'button', { weak: '약함', medium: '중간', strong: '강함' }[value]); button.type = 'button'; button.dataset.tier = value; button.setAttribute('aria-selected', value === tier ? 'true' : 'false'); button.addEventListener('click', () => { tier = value; render(); }); tierTabs.append(button); }
    body.append(tierTabs);
    const presets = el(documentRef, 'div'); presets.className = 'csa-app-status-grid'; presets.dataset.tier = tier; catalog().items.filter(item => (item.tier ?? item.strength) === tier).forEach(item => { const card = presetCard(item); if (card) presets.append(card); }); body.append(presets);
  }

  function renderManual() {
    body.append(el(documentRef, 'h3', '매뉴얼'));
    ['현재 제공되는 것은 9개 프리셋 규칙뿐입니다.', '편집은 명시적으로 적용하기 전까지 로컬 초안입니다.', '적용·변경·해제는 각각 정확히 한 번의 Story 턴을 사용합니다.', '이 앱은 선택 사항이며 일반 플레이를 대신하지 않습니다.'].forEach(text => body.append(el(documentRef, 'p', text)));
  }

  function render() {
    tabs?.querySelectorAll?.('[data-tab]')?.forEach(button => { button.setAttribute('aria-selected', button.dataset.tab === tab ? 'true' : 'false'); });
    body.replaceChildren();
    ({ home: renderHome, player: renderPlayer, npc: renderNpc, csa: renderCsa, manual: renderManual }[tab] ?? renderHome)();
    draftBarRender();
  }

  open.addEventListener('click', openApp);
  close?.addEventListener('click', requestClose);
  overlay.addEventListener('click', event => { if (event.target === overlay) requestClose(); });
  tabs?.addEventListener('click', event => { const button = event.target.closest?.('[data-tab]'); if (button) { tab = button.dataset.tab; render(); } });

  function sync() {
    if (overlay.hidden) return;
    if (!draft || (!dirty() && draft.baseRevision !== Number(context()?.state?.revision ?? 0))) draft = createCsaDraft(context());
    render();
  }

  return { sync, requestClose, getDraft: () => clone(draft) };
}
