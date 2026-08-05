function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function count(value) {
  const match = /-?\d+/.exec(String(value ?? ''));
  return match ? Math.max(0, Number(match[0])) : 0;
}

function fieldMap(section) {
  const result = new Map();
  const list = section.querySelector?.('dl');
  if (!list) return result;
  const children = [...(list.children ?? [])];
  for (let index = 0; index < children.length; index += 2) {
    const label = text(children[index]?.textContent);
    const value = text(children[index + 1]?.textContent);
    if (label) result.set(label, value);
  }
  return result;
}

function item(documentRef, label, value, { textValue = false } = {}) {
  const node = documentRef.createElement('span');
  node.className = 'relationship-item';
  const labelNode = documentRef.createElement('span');
  labelNode.className = 'relationship-item-label';
  labelNode.textContent = label;
  const valueNode = documentRef.createElement('strong');
  valueNode.className = 'relationship-item-value';
  valueNode.textContent = textValue ? String(value || '없음') : String(count(value));
  if (!textValue && count(value) > 0) valueNode.classList?.add?.('has-record');
  node.append(labelNode, valueNode);
  return node;
}

function row(documentRef, ...items) {
  const node = documentRef.createElement('div');
  node.className = 'relationship-row';
  node.append(...items);
  return node;
}

export function renderHospitalRelationshipIcons(section, documentRef = section?.ownerDocument ?? globalThis.document) {
  if (!section || !documentRef || section.dataset?.relationshipIcons === 'true') return false;
  const heading = section.querySelector?.('h3');
  if (!heading || text(heading.textContent) !== '관계·사정 기록') return false;
  const values = fieldMap(section);
  if (section.dataset) section.dataset.relationshipIcons = 'true';
  else section.setAttribute?.('data-relationship-icons', 'true');
  section.classList?.add?.('relationship-icon-card');
  section.replaceChildren();

  const title = documentRef.createElement('h3');
  title.textContent = '관계 기록';
  const summary = documentRef.createElement('div');
  summary.className = 'relationship-summary';
  summary.append(
    row(documentRef,
      item(documentRef, '✨ 절정', values.get('NPC 절정')),
      item(documentRef, '💦 사정', values.get('플레이어 사정'))
    ),
    row(documentRef,
      item(documentRef, '🌸 질', values.get('질 성교')),
      item(documentRef, '🍑 애널', values.get('애널 성교')),
      item(documentRef, '👄 구강', values.get('구강 성교'))
    )
  );

  const details = documentRef.createElement('details');
  details.className = 'relationship-details';
  const detailsSummary = documentRef.createElement('summary');
  detailsSummary.textContent = '상세 기록';
  details.append(
    detailsSummary,
    row(documentRef,
      item(documentRef, '💦 질내', values.get('질내 사정')),
      item(documentRef, '🍑 애널내', values.get('애널내 사정'))
    ),
    row(documentRef,
      item(documentRef, '👄 입안', values.get('입안 사정')),
      item(documentRef, '😳 얼굴', values.get('얼굴 사정'))
    ),
    row(documentRef,
      item(documentRef, '🫧 몸', values.get('몸 사정')),
      item(documentRef, '🎬 이벤트', values.get('성적 이벤트'))
    ),
    row(documentRef,
      item(documentRef, '✅ 완료/⏸ 중단', values.get('완료/중단') || '0 / 0', { textValue: true })
    ),
    row(documentRef,
      item(documentRef, '🕐 첫 기록', values.get('첫 기록') || '없음', { textValue: true }),
      item(documentRef, '🕘 최근 기록', values.get('최근 기록') || '없음', { textValue: true })
    )
  );
  section.append(title, summary, details);
  return true;
}

export function enhanceRelationshipRecords(root = globalThis.document) {
  if (!root) return false;
  const sections = root.querySelectorAll?.('.character-detail-section') ?? [];
  let changed = false;
  for (const section of sections) changed = renderHospitalRelationshipIcons(section, section.ownerDocument ?? root) || changed;
  return changed;
}

export function initRelationshipIcons({
  documentRef = globalThis.document,
  MutationObserverImpl = documentRef?.defaultView?.MutationObserver ?? globalThis.MutationObserver
} = {}) {
  const target = documentRef?.getElementById?.('focal-character');
  if (!target) return null;
  enhanceRelationshipRecords(target);
  if (typeof MutationObserverImpl !== 'function') return null;
  const observer = new MutationObserverImpl(() => enhanceRelationshipRecords(target));
  observer.observe(target, { childList: true, subtree: true });
  return observer;
}

if (globalThis.document) initRelationshipIcons();
