/**
 * 회사 맵 패널 — 회사 전체 층별 구조와 플레이어/NPC 위치를 한 화면에 보여준다.
 *
 * 계약:
 * - 별도 API/endpoint를 만들지 않는다. 이미 받은 Context의 save/master/display만 읽는다.
 * - 맵에 같은 장소로 표시된 NPC는 자동 출연 근거가 아니다.
 *   실제 출연 정본은 서버의 scene_state.participants뿐이다.
 * - 장소·NPC 클릭은 입력창 문장만 채우며 턴을 자동 실행하지 않는다.
 * - 저장 위치가 있으면 그것을 우선하고, 없으면 캐릭터 기본 위치 또는 맵 기본 배치를 쓴다.
 */

const UNKNOWN_LABEL = '위치 미확인';
const FLOOR_META = Object.freeze({
  5: { title: '감사·임원층', icon: '◆' },
  4: { title: '디자인·협업층', icon: '◇' },
  3: { title: '브랜드·마케팅층', icon: '●' },
  2: { title: '관리·교육층', icon: '■' },
  1: { title: '로비·공용층', icon: '○' }
});

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function identity(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function lastHangulCodePoint(text) {
  const value = String(text ?? '').trim();
  if (!value) return null;
  const code = value.codePointAt(value.length - 1);
  return code >= 0xac00 && code <= 0xd7a3 ? code : null;
}

function koreanParticle(text, consonantForm, vowelForm, rieulUsesVowel = false) {
  const code = lastHangulCodePoint(text);
  if (code === null) return vowelForm;
  const jong = (code - 0xac00) % 28;
  if (jong === 0 || (rieulUsesVowel && jong === 8)) return vowelForm;
  return consonantForm;
}

function floorMeta(floor) {
  return FLOOR_META[floor] ?? { title: '기타 공간', icon: '·' };
}

function locationTypeLabel(type) {
  return ({
    public_entrance: '출입 공간',
    circulation: '이동 공간',
    office_floor: '사무 공간',
    team_space: '팀 공간',
    meeting_room: '회의 공간',
    project_space: '프로젝트 공간',
    collaboration: '협업 공간',
    training: '교육 공간',
    amenity: '휴게 공간',
    storage: '보관 공간',
    executive_office: '임원 공간',
    audit_office: '감사 공간',
    department_office: '부서 공간'
  })[type] ?? '회사 공간';
}

function staticNpcDirectory(locations) {
  const directory = {};
  for (const location of Array.isArray(locations) ? locations : []) {
    const locationId = identity(location?.location_id);
    if (!locationId) continue;
    for (const npc of Array.isArray(location?.default_npcs) ? location.default_npcs : []) {
      const npcId = identity(npc?.npc_id ?? npc?.id);
      const name = identity(npc?.name);
      if (!npcId || !name) continue;
      directory[npcId] = {
        name,
        role: identity(npc?.role),
        department: identity(npc?.department),
        default_location_id: locationId
      };
    }
  }
  return directory;
}

/** 저장 위치 → 캐릭터 default_location_id → map default_npc_ids 순으로 해석한다. */
export function resolveDisplayLocationId(save, npcId, characters, locations) {
  const stored = identity(object(save?.npc_scene_state)?.[npcId]?.location_id);
  if (stored) return stored;
  const fromCharacter = identity(object(characters)?.[npcId]?.default_location_id);
  if (fromCharacter) return fromCharacter;
  for (const location of Array.isArray(locations) ? locations : []) {
    const ids = Array.isArray(location?.default_npc_ids) ? location.default_npc_ids : [];
    if (ids.includes(npcId)) return identity(location.location_id);
  }
  return null;
}

/**
 * 층 → 장소 → 인물 목록으로 정리한다.
 * 빈 장소도 숨기지 않아 실제 회사 구조도가 유지된다.
 * participants에 있는 NPC만 `inScene:true`로 표시한다.
 */
export function buildCompanyMapModel({ save, characters, locations } = {}) {
  const map = (Array.isArray(locations) ? locations : []).filter(location => identity(location?.location_id));
  const suppliedCharacters = object(characters) ?? {};
  const staticCharacters = staticNpcDirectory(map);
  const characterMap = { ...staticCharacters, ...suppliedCharacters };
  const playerLocationId = identity(object(save?.scene_state)?.location_id);
  const participantIds = (Array.isArray(object(save?.scene_state)?.participants) ? save.scene_state.participants : [])
    .filter(id => typeof id === 'string');
  const participants = new Set(participantIds);

  const byLocation = new Map();
  const unknown = [];
  for (const [npcId, character] of Object.entries(characterMap)) {
    const name = identity(character?.name);
    if (!name) continue;
    const locationId = resolveDisplayLocationId(save, npcId, characterMap, map);
    const entry = {
      npc_id: npcId,
      name,
      role: identity(character?.role ?? character?.role_title ?? character?.position),
      department: identity(character?.department),
      inScene: participants.has(npcId)
    };
    if (!locationId) {
      unknown.push(entry);
      continue;
    }
    if (!byLocation.has(locationId)) byLocation.set(locationId, []);
    byLocation.get(locationId).push(entry);
  }

  for (const npcs of byLocation.values()) {
    npcs.sort((a, b) => Number(b.inScene) - Number(a.inScene) || a.name.localeCompare(b.name, 'ko'));
  }
  unknown.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const floors = new Map();
  for (const location of map) {
    const locationId = identity(location.location_id);
    const floor = Number.isInteger(location.floor) ? location.floor : null;
    if (!floors.has(floor)) floors.set(floor, []);
    floors.get(floor).push({
      location_id: locationId,
      name: identity(location.name) ?? locationId,
      description: identity(location.description),
      zone: identity(location.zone),
      location_type: identity(location.location_type),
      type_label: locationTypeLabel(location.location_type),
      visibility: identity(location.visibility) ?? 'public',
      adjacent_location_ids: unique(Array.isArray(location.adjacent_location_ids) ? location.adjacent_location_ids : []),
      isPlayerHere: locationId === playerLocationId,
      npcs: byLocation.get(locationId) ?? []
    });
  }

  const orderedFloors = [...floors.entries()]
    .sort((a, b) => (b[0] ?? -999) - (a[0] ?? -999))
    .map(([floor, places]) => {
      places.sort((a, b) => Number(b.isPlayerHere) - Number(a.isPlayerHere) || a.name.localeCompare(b.name, 'ko'));
      const meta = floorMeta(floor);
      return {
        floor,
        label: floor === null ? '공용' : `${floor}F`,
        title: meta.title,
        icon: meta.icon,
        isCurrentFloor: places.some(place => place.isPlayerHere),
        peopleCount: places.reduce((sum, place) => sum + place.npcs.length, 0),
        places
      };
    });

  const locationDirectory = Object.fromEntries(map.map(location => [location.location_id, location]));
  const currentLocation = playerLocationId ? locationDirectory[playerLocationId] ?? null : null;
  const sceneNpcNames = participantIds
    .filter(id => !/^player(?:[-_]|$)/.test(id))
    .map(id => characterMap[id]?.name)
    .filter(Boolean);

  return {
    player_location_id: playerLocationId,
    player_location_name: identity(currentLocation?.name) ?? playerLocationId ?? UNKNOWN_LABEL,
    current_floor: Number.isInteger(currentLocation?.floor) ? currentLocation.floor : null,
    scene_npc_names: sceneNpcNames,
    floors: orderedFloors,
    unknown
  };
}

/** 장소 클릭 시 입력창에 채울 문장 (턴은 실행하지 않는다). */
export function locationPromptText(locationName) {
  const particle = koreanParticle(locationName, '으로', '로', true);
  return `${locationName}${particle} 이동한다`;
}

/** NPC 클릭 시 입력창에 채울 문장 (턴은 실행하지 않는다). */
export function npcPromptText(npcName) {
  const particle = koreanParticle(npcName, '을', '를');
  return `${npcName}${particle} 찾아간다`;
}

export function ensureCompanyMapStyles(doc = globalThis.document) {
  if (!doc?.head || doc.querySelector?.('link[data-company-map-style]')) return;
  const link = doc.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./company-map.css', import.meta.url).href;
  link.dataset.companyMapStyle = 'true';
  doc.head.append(link);
}

function appendText(parent, tag, className, value) {
  const doc = parent.ownerDocument;
  const node = doc.createElement(tag);
  node.className = className;
  node.textContent = value;
  parent.append(node);
  return node;
}

/**
 * 맵 패널을 그린다. onFill(text)은 입력창을 채우기만 하는 콜백이며,
 * 여기서 턴을 실행하거나 네트워크를 호출하지 않는다.
 */
export function renderCompanyMap(container, model, { onFill } = {}) {
  if (!container) return;
  const doc = container.ownerDocument ?? globalThis.document;
  if (typeof doc?.createElement !== 'function') return;
  ensureCompanyMapStyles(doc);
  container.replaceChildren();

  if (!model || !model.floors?.length) {
    appendText(container, 'p', 'company-map-empty', '회사 맵 정보를 불러오지 못했습니다.');
    return;
  }

  const fill = value => {
    if (typeof onFill === 'function') onFill(value);
  };

  const current = doc.createElement('section');
  current.className = 'company-map-current';
  appendText(current, 'span', 'company-map-current-kicker', '현재 위치');
  appendText(current, 'strong', 'company-map-current-name', model.player_location_name);
  const sceneText = model.scene_npc_names.length
    ? `현재 대화: ${model.scene_npc_names.join(' · ')}`
    : '현재 대화 중인 인물 없음';
  appendText(current, 'span', 'company-map-current-scene', sceneText);
  container.append(current);

  const legend = doc.createElement('div');
  legend.className = 'company-map-legend';
  legend.innerHTML = '<span><i class="map-dot player"></i>내 위치</span><span><i class="map-dot scene"></i>현재 장면</span><span><i class="map-dot default"></i>회사 내 위치</span>';
  container.append(legend);

  const building = doc.createElement('div');
  building.className = 'company-map-building';

  for (const floor of model.floors) {
    const details = doc.createElement('details');
    details.className = 'company-map-floor';
    details.open = floor.isCurrentFloor;
    if (floor.isCurrentFloor) details.classList.add('is-current-floor');

    const summary = doc.createElement('summary');
    summary.className = 'company-map-floor-summary';
    appendText(summary, 'span', 'company-map-floor-number', floor.label);
    appendText(summary, 'span', 'company-map-floor-title', `${floor.icon} ${floor.title}`);
    appendText(summary, 'span', 'company-map-floor-count', `${floor.peopleCount}명`);
    details.append(summary);

    const grid = doc.createElement('div');
    grid.className = 'company-map-floor-grid';

    for (const place of floor.places) {
      const card = doc.createElement('article');
      card.className = 'company-map-place';
      if (place.isPlayerHere) card.classList.add('is-player-here');

      const head = doc.createElement('div');
      head.className = 'company-map-place-head';
      const placeButton = doc.createElement('button');
      placeButton.type = 'button';
      placeButton.className = 'company-map-place-name';
      placeButton.textContent = place.isPlayerHere ? `▶ ${place.name}` : place.name;
      placeButton.title = `${place.name} 이동 문장을 입력합니다`;
      placeButton.addEventListener('click', () => fill(locationPromptText(place.name)));
      head.append(placeButton);
      appendText(head, 'span', 'company-map-place-type', place.type_label);
      card.append(head);

      if (place.description) appendText(card, 'p', 'company-map-place-description', place.description);

      const people = doc.createElement('div');
      people.className = 'company-map-people';
      if (place.isPlayerHere) appendText(people, 'span', 'company-map-player-chip', '나');
      for (const npc of place.npcs) {
        const npcButton = doc.createElement('button');
        npcButton.type = 'button';
        npcButton.className = 'company-map-npc';
        if (npc.inScene) npcButton.classList.add('is-in-scene');
        npcButton.textContent = npc.name;
        npcButton.title = npc.role ? `${npc.role} · 찾아가기 문장을 입력합니다` : '찾아가기 문장을 입력합니다';
        npcButton.addEventListener('click', () => fill(npcPromptText(npc.name)));
        people.append(npcButton);
      }
      if (!place.isPlayerHere && !place.npcs.length) {
        appendText(people, 'span', 'company-map-no-people', '현재 확인된 인물 없음');
      }
      card.append(people);
      grid.append(card);
    }

    details.append(grid);
    building.append(details);
  }
  container.append(building);

  if (model.unknown.length) {
    const unknown = doc.createElement('details');
    unknown.className = 'company-map-floor company-map-unknown';
    const summary = doc.createElement('summary');
    summary.className = 'company-map-floor-summary';
    appendText(summary, 'span', 'company-map-floor-number', '?');
    appendText(summary, 'span', 'company-map-floor-title', UNKNOWN_LABEL);
    appendText(summary, 'span', 'company-map-floor-count', `${model.unknown.length}명`);
    unknown.append(summary);
    const people = doc.createElement('div');
    people.className = 'company-map-people company-map-unknown-people';
    for (const npc of model.unknown) {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'company-map-npc';
      button.textContent = npc.name;
      button.addEventListener('click', () => fill(npcPromptText(npc.name)));
      people.append(button);
    }
    unknown.append(people);
    container.append(unknown);
  }
}
