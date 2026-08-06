/**
 * 회사 맵 패널 — 현재 플레이어 위치와 NPC들의 회사 내 위치를 층별로 보여준다.
 *
 * 계약:
 * - 별도 API/endpoint를 만들지 않는다. 이미 받은 Context의 save만 읽어 그린다.
 * - 매 턴 추가 네트워크 요청 0회, 추가 DB 조회 0회.
 * - 맵에 NPC가 같은 장소로 보인다고 해서 Story 자동 출연 근거가 되지 않는다.
 *   출연 정본은 서버의 scene_state.participants 뿐이다 (여기서는 표시만 구분).
 * - 장소·NPC를 눌러도 턴이 실행되지 않는다. 입력창 문장만 채운다.
 */

const UNKNOWN_LABEL = '위치 미확인';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function identity(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
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
 * 층 → 장소 → 그 장소의 NPC 목록으로 정리한다.
 * participants에 있는 NPC는 `inScene: true`로 표시해 시각적으로만 구분한다.
 */
export function buildCompanyMapModel({ save, characters, locations } = {}) {
  const map = Array.isArray(locations) ? locations : [];
  const characterMap = object(characters) ?? {};
  const playerLocationId = identity(object(save?.scene_state)?.location_id);
  const participants = new Set(
    (Array.isArray(object(save?.scene_state)?.participants) ? save.scene_state.participants : [])
      .filter(id => typeof id === 'string')
  );

  const byLocation = new Map();
  const unknown = [];
  for (const [npcId, character] of Object.entries(characterMap)) {
    const name = identity(character?.name);
    if (!name) continue;
    const locationId = resolveDisplayLocationId(save, npcId, characterMap, map);
    const entry = { npc_id: npcId, name, inScene: participants.has(npcId) };
    if (!locationId) { unknown.push(entry); continue; }
    if (!byLocation.has(locationId)) byLocation.set(locationId, []);
    byLocation.get(locationId).push(entry);
  }

  const floors = new Map();
  for (const location of map) {
    const locationId = identity(location?.location_id);
    if (!locationId) continue;
    const npcs = byLocation.get(locationId) ?? [];
    const isPlayerHere = locationId === playerLocationId;
    // 사람이 없고 플레이어도 없는 장소는 목록을 짧게 유지하기 위해 숨긴다.
    if (!npcs.length && !isPlayerHere) continue;
    const floorKey = Number.isInteger(location.floor) ? location.floor : null;
    if (!floors.has(floorKey)) floors.set(floorKey, []);
    floors.get(floorKey).push({
      location_id: locationId,
      name: identity(location.name) ?? locationId,
      isPlayerHere,
      npcs
    });
  }

  const orderedFloors = [...floors.entries()]
    .sort((a, b) => (a[0] ?? 999) - (b[0] ?? 999))
    .map(([floor, places]) => ({ floor, label: floor === null ? '공용 공간' : `${floor}층`, places }));

  return { player_location_id: playerLocationId, floors: orderedFloors, unknown };
}

/** 장소 클릭 시 입력창에 채울 문장 (턴은 실행하지 않는다). */
export function locationPromptText(locationName) {
  return `${locationName}로 이동한다`;
}

/** NPC 클릭 시 입력창에 채울 문장 (턴은 실행하지 않는다). */
export function npcPromptText(npcName) {
  return `${npcName}를 찾아간다`;
}

/**
 * 맵 패널을 그린다. onFill(text)은 입력창을 채우기만 하는 콜백이며,
 * 여기서 턴을 실행하거나 네트워크를 호출하지 않는다.
 */
export function renderCompanyMap(container, model, { onFill } = {}) {
  if (!container) return;
  // 테스트 하네스는 최소 document 스텁만 제공하므로 DOM 생성 자체를 방어한다.
  if (typeof document?.createElement !== 'function') return;
  container.replaceChildren();
  if (!model || !model.floors?.length) {
    const empty = document.createElement('p');
    empty.className = 'company-map-empty';
    empty.textContent = '표시할 위치 정보가 없습니다.';
    container.append(empty);
    return;
  }

  const fill = text => { if (typeof onFill === 'function') onFill(text); };

  for (const floor of model.floors) {
    const section = document.createElement('section');
    section.className = 'company-map-floor';
    const heading = document.createElement('h3');
    heading.className = 'company-map-floor-name';
    heading.textContent = floor.label;
    section.append(heading);

    for (const place of floor.places) {
      const row = document.createElement('div');
      row.className = 'company-map-place';
      if (place.isPlayerHere) row.classList.add('is-player-here');

      const placeButton = document.createElement('button');
      placeButton.type = 'button';
      placeButton.className = 'company-map-place-name';
      placeButton.textContent = place.isPlayerHere ? `▶ ${place.name}` : place.name;
      placeButton.addEventListener('click', () => fill(locationPromptText(place.name)));
      row.append(placeButton);

      if (place.npcs.length) {
        const people = document.createElement('div');
        people.className = 'company-map-people';
        for (const npc of place.npcs) {
          const npcButton = document.createElement('button');
          npcButton.type = 'button';
          npcButton.className = 'company-map-npc';
          if (npc.inScene) npcButton.classList.add('is-in-scene');
          npcButton.textContent = npc.name;
          npcButton.addEventListener('click', () => fill(npcPromptText(npc.name)));
          people.append(npcButton);
        }
        row.append(people);
      }
      section.append(row);
    }
    container.append(section);
  }

  if (model.unknown.length) {
    const section = document.createElement('section');
    section.className = 'company-map-floor';
    const heading = document.createElement('h3');
    heading.className = 'company-map-floor-name';
    heading.textContent = UNKNOWN_LABEL;
    section.append(heading);
    const people = document.createElement('div');
    people.className = 'company-map-people';
    for (const npc of model.unknown) {
      const npcButton = document.createElement('button');
      npcButton.type = 'button';
      npcButton.className = 'company-map-npc';
      npcButton.textContent = npc.name;
      npcButton.addEventListener('click', () => fill(npcPromptText(npc.name)));
      people.append(npcButton);
    }
    section.append(people);
    container.append(section);
  }
}
