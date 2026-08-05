function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function count(value) {
  const match = /-?\d+/.exec(String(value ?? ''));
  return match ? Math.max(0, Number(match[0])) : 0;
}

function fieldMap(section) {
  const result = new Map();
  const list = section.querySelector('dl');
  if (!list) return result;
  const children = [...list.children];
  for (let index = 0; index < children.length; index += 2) {
    const label = text(children[index]?.textContent);
    const value = text(children[index + 1]?.textContent);
    if (label) result.set(label, value);
  }
  return result;
}

function item(label, value, { textValue = false } = {}) {
  const node = document.createElement('span');
  node.className = 'relationship-item';
  const labelNode = document.createElement('span');
  labelNode.className = 'relationship-item-label';
  labelNode.textContent = label;
  const valueNode = document.createElement('strong');
  valueNode.className = 'relationship-item-value';
  valueNode.textContent = textValue ? String(value || '없음') : String(count(value));
  if (!textValue && count(value) > 0) valueNode.classList.add('has-record');
  node.append(labelNode, valueNode);
  return node;
}

function row(...items) {
  const node = document.createElement('div');
  node.className = 'relationship-row';
  node.append(...items);
  return node;
}

export function renderHospitalRelationshipIcons(section) {
  if (!section || section.dataset?.relationshipIcons === 'true') return false;
  const heading = section.querySelector('h3');
  if (!heading || text(heading.textContent) !== '관계·사정 기록') return false;
  const values = fieldMap(section);
  section.dataset.relationshipIcons = 'true';
  section.classList.add('relationship-icon-card');
  section.replaceChildren();

  const title = document.createElement('h3');
  title.textContent = '관계 기록';
  const summary = document.createElement('div');
  summary.className = 'relationship-summary';
  summary.append(
    row(
      item('✨ 절정', values.get('NPC 절정')),
      item('💦 사정', values.get('플레이어 사정'))
    ),
    row(
      item('🌸 질', values.get('질 성교')),
      item('🍑 애널', values.get('애널 성교')),
      item('👄 구강', values.get('구강 성교'))
    )
  );

  const details = document.createElement('details');
  details.className = 'relationship-details';
  const detailsSummary = document.createElement('summary');
  detailsSummary.textContent = '상세 기록';
  details.append(
    detailsSummary,
    row(
      item('💦 질내', values.get('질내 사정')),
      item('🍑 애널내', values.get('애널내 사정'))
    ),
    row(
      item('👄 입안', values.get('입안 사정')),
      item('😳 얼굴', values.get('얼굴 사정'))
    ),
    row(
      item('🫧 몸', values.get('몸 사정')),
      item('🎬 이벤트', values.get('성적 이벤트'))
    ),
    row(
      item('✅ 완료/⏸ 중단', values.get('완료/중단') || '0 / 0', { textValue: true })
    ),
    row(
      item('🕐 첫 기록', values.get('첫 기록') || '없음', { textValue: true }),
      item('🕘 최근 기록', values.get('최근 기록') || '없음', { textValue: true })
    )
  );

  section.append(title, summary, details);
  return true;
}

export function enhanceRelationshipRecords(root = document) {
  const sections = root.querySelectorAll?.('.character-detail-section') ?? [];
  let changed = false;
  for (const section of sections) changed = renderHospitalRelationshipIcons(section) || changed;
  return changed;
}

function init() {
  const target = document.getElementById('focal-character');
  if (!target) return;
  enhanceRelationshipRecords(target);
  const observer = new MutationObserver(() => enhanceRelationshipRecords(target));
  observer.observe(target, { childList: true, subtree: true });
}

init();
