function el(documentRef, tag, text = '') { const node = documentRef.createElement(tag); if (text) node.textContent = text; return node; }
function select(documentRef, options, value) { const node = el(documentRef, 'select'); for (const option of options) { const item = el(documentRef, 'option', option); item.value = option; item.selected = option === value; node.append(item); } return node; }

export function createR3CsaUi({ documentRef = document, client, getGameId, getContext, getCatalog, onContext } = {}) {
  const overlay = documentRef.querySelector('#csa-app-overlay'); const body = documentRef.querySelector('#csa-app-body'); const open = documentRef.querySelector('#open-apps'); const close = documentRef.querySelector('#csa-app-close');
  if (!overlay || !body || !open) return { sync() {} };
  const show = () => { overlay.hidden = false; render(); }; open.addEventListener('click', show); close?.addEventListener('click', () => { overlay.hidden = true; });
  async function transact(operations) {
    const context = getContext(); body.replaceChildren(el(documentRef, 'p', '상식개변 거래를 저장하는 중입니다.'));
    try { const next = await client.csa(getGameId(), { expected_revision: context?.state?.revision, operations }); onContext(next); render(); }
    catch (error) { body.replaceChildren(el(documentRef, 'p', `저장하지 못했습니다: ${error.message}`)); }
  }
  function scopeFields(item, current = {}) {
    const wrap = el(documentRef, 'div'); const subjects = item.subject_scopes ?? []; const counters = item.counterparty_scopes ?? [];
    const subject = select(documentRef, subjects, current.subject_scope ?? item.default_subject_scope); wrap.append(el(documentRef, 'label', '대상 범위 '), subject);
    let counterparty = null; if (counters.length) { counterparty = select(documentRef, counters, current.counterparty_scope ?? item.default_counterparty_scope); wrap.append(el(documentRef, 'label', '상대 범위 '), counterparty); }
    return { wrap, subject: () => subject.value, counterparty: () => counterparty?.value ?? null };
  }
  function render() {
    const catalog = getCatalog() ?? { items: [] }; const state = getContext()?.state?.state ?? {}; const active = state.csa_rules ?? {};
    body.replaceChildren(el(documentRef, 'p', `활성 규칙 ${Object.values(active).filter(rule => rule?.active).length}개 · 일반 턴을 소비하지 않습니다.`), el(documentRef, 'h3', '현재 규칙'));
    for (const rule of Object.values(active).filter(item => item.active)) {
      const item = catalog.items.find(candidate => candidate.id === rule.template_id); const card = el(documentRef, 'article', 'csa-app-effect-card'); card.append(el(documentRef, 'strong', item?.label ?? rule.template_id), el(documentRef, 'p', rule.content ?? ''));
      const fields = item ? scopeFields(item, rule) : null; if (fields) card.append(fields.wrap);
      const update = el(documentRef, 'button', '변경'); update.type = 'button'; update.onclick = () => transact([{ operation: 'update', id: rule.id, template_id: item?.id, subject_scope: fields?.subject(), counterparty_scope: fields?.counterparty() }]);
      const remove = el(documentRef, 'button', '제거'); remove.type = 'button'; remove.onclick = () => transact([{ operation: 'deactivate', id: rule.id }]); card.append(update, remove); body.append(card);
    }
    body.append(el(documentRef, 'h3', '9-rule MVP 규칙'));
    for (const item of catalog.items) {
      if (Object.values(active).some(rule => rule.active && rule.template_id === item.id)) continue;
      const card = el(documentRef, 'article', 'csa-app-card'); card.append(el(documentRef, 'strong', `${item.strength} · ${item.label}`), el(documentRef, 'p', item.content_template)); const fields = scopeFields(item); card.append(fields.wrap);
      const apply = el(documentRef, 'button', '적용'); apply.type = 'button'; apply.onclick = () => transact([{ operation: 'activate', template_id: item.id, subject_scope: fields.subject(), counterparty_scope: fields.counterparty() }]); card.append(apply); body.append(card);
    }
  }
  return { sync: render };
}
