const FLOOR_META = Object.freeze({
  5: { title: '감사·임원층', icon: '◆' },
  4: { title: '디자인·협업층', icon: '◇' },
  3: { title: '브랜드·마케팅층', icon: '●' },
  2: { title: '관리·교육층', icon: '■' },
  1: { title: '로비·공용층', icon: '○' }
});

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function identity(value) { return typeof value === 'string' && value.trim() ? value.trim() : ''; }
function floorMeta(floor) { return FLOOR_META[floor] ?? { title: '기타 공간', icon: '·' }; }
function typeLabel(type) { return ({ meeting_room: '회의 공간', office_floor: '사무 공간', team_space: '팀 공간', amenity: '휴게 공간', circulation: '이동 공간', department_office: '부서 공간' })[type] ?? '회사 공간'; }
function particle(value, consonant, vowel, rieul = false) {
  const text = identity(value); const code = text ? text.codePointAt(text.length - 1) : null;
  if (code === null || code < 0xac00 || code > 0xd7a3) return vowel;
  const batchim = (code - 0xac00) % 28;
  return batchim === 0 || (rieul && batchim === 8) ? vowel : consonant;
}

export function locationPromptText(name) { return `${name}${particle(name, '으로', '로', true)} 이동한다`; }
export function npcPromptText(name) { return `${name}${particle(name, '을', '를')} 찾아간다`; }

export function buildCompanyMapModel({ scene = {}, actors = [], locations = [] } = {}) {
  const locationList = Array.isArray(locations) ? locations.filter(item => identity(item?.location_id)) : [];
  const actorMap = new Map((Array.isArray(actors) ? actors : []).map(actor => [actor.id ?? actor.character_id, actor]));
  const present = new Set(Array.isArray(scene.present_actor_ids) ? scene.present_actor_ids : []);
  const locationById = new Map(locationList.map(location => [location.location_id, location]));
  const defaultLocationByActor = new Map();
  for (const location of locationList) for (const actorId of location.default_npc_ids ?? []) defaultLocationByActor.set(actorId, location.location_id);
  const byLocation = new Map();
  for (const actor of actorMap.values()) {
    const id = actor.id ?? actor.character_id; const name = identity(actor.name);
    if (!id || !name) continue;
    const locationId = present.has(id) ? scene.location_id : (actor.default_location_id || defaultLocationByActor.get(id));
    if (!locationId) continue;
    if (!byLocation.has(locationId)) byLocation.set(locationId, []);
    byLocation.get(locationId).push({ id, name, role: actor.role ?? actor.position ?? '', inScene: present.has(id) });
  }
  const floors = new Map();
  for (const location of locationList) {
    const floor = Number.isInteger(location.floor) ? location.floor : null;
    if (!floors.has(floor)) floors.set(floor, []);
    floors.get(floor).push({
      id: location.location_id, name: identity(location.name) || location.location_id,
      description: identity(location.description), type: typeLabel(location.location_type),
      current: location.location_id === scene.location_id,
      actors: (byLocation.get(location.location_id) ?? []).sort((a, b) => Number(b.inScene) - Number(a.inScene) || a.name.localeCompare(b.name, 'ko'))
    });
  }
  return {
    current: locationById.get(scene.location_id) ?? null,
    floors: [...floors.entries()].sort((a, b) => (b[0] ?? -1) - (a[0] ?? -1)).map(([floor, places]) => ({
      floor, label: floor === null ? '공용' : `${floor}F`, ...floorMeta(floor), places: places.sort((a, b) => Number(b.current) - Number(a.current) || a.name.localeCompare(b.name, 'ko'))
    }))
  };
}

function append(parent, tag, className, value = '') { const node = parent.ownerDocument.createElement(tag); node.className = className; node.textContent = value; parent.append(node); return node; }

export function renderCompanyMap(container, model, { onFill } = {}) {
  if (!container) return;
  const doc = container.ownerDocument ?? globalThis.document;
  container.replaceChildren();
  if (!model?.floors?.length) { append(container, 'p', 'company-map-empty', '회사 맵 정보를 불러오지 못했습니다.'); return; }
  const current = doc.createElement('section'); current.className = 'company-map-current';
  append(current, 'span', 'company-map-current-kicker', '현재 위치'); append(current, 'strong', 'company-map-current-name', model.current?.name ?? '확인 중');
  append(current, 'span', 'company-map-current-scene', model.current?.description ?? '현재 장면을 불러오는 중입니다.'); container.append(current);
  for (const floor of model.floors) {
    const details = doc.createElement('details'); details.className = `company-map-floor${floor.places.some(place => place.current) ? ' is-current-floor' : ''}`; details.open = floor.places.some(place => place.current);
    const summary = doc.createElement('summary'); summary.className = 'company-map-floor-summary'; append(summary, 'span', 'company-map-floor-number', floor.label); append(summary, 'span', 'company-map-floor-title', `${floor.icon} ${floor.title}`); details.append(summary);
    const grid = doc.createElement('div'); grid.className = 'company-map-floor-grid';
    for (const place of floor.places) {
      const card = doc.createElement('article'); card.className = `company-map-place${place.current ? ' is-current-place' : ''}`;
      const head = doc.createElement('div'); head.className = 'company-map-place-head';
      const button = doc.createElement('button'); button.type = 'button'; button.className = 'company-map-place-name'; button.textContent = place.name; button.title = `${place.name} 입력창에 채우기`; button.addEventListener('click', () => onFill?.(locationPromptText(place.name))); head.append(button); append(head, 'span', 'company-map-place-type', place.type); card.append(head);
      append(card, 'p', 'company-map-place-description', place.description);
      const people = doc.createElement('div'); people.className = 'company-map-people';
      for (const actor of place.actors) { const person = doc.createElement('button'); person.type = 'button'; person.className = `company-map-npc${actor.inScene ? ' is-present' : ''}`; person.textContent = actor.name; person.title = actor.role || actor.name; person.addEventListener('click', () => onFill?.(npcPromptText(actor.name))); people.append(person); }
      if (!people.childElementCount) append(people, 'span', 'company-map-no-people', '현재 표시할 인물 없음'); card.append(people); grid.append(card);
    }
    details.append(grid); container.append(details);
  }
}
