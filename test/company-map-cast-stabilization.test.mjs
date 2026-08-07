import test from 'node:test';
import assert from 'node:assert/strict';
import characterContent from '../content/characters.json' with { type: 'json' };
import mapContent from '../content/map.json' with { type: 'json' };
import { buildSceneCastContract, resolveNpcLocationId } from '../src/engine/scene-cast.js';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';

const CHARACTERS = characterContent.characters;
const LOCATIONS = mapContent.locations;
const LOCATION_IDS = new Set(LOCATIONS.map(location => location.location_id));
const MASTER = {
  characters: Object.entries(CHARACTERS).map(([id, value]) => ({ character_id: id, ...value })),
  general_npcs: []
};

/** 운영 turn 32 이후 형태를 흉내낸 save. */
function save({ participants = ['player-1'], npcSceneState = {}, locationId = 'brand_strategy_meeting_room' } = {}) {
  return {
    scene_state: { scene_id: 'scene', location_id: locationId, participants },
    npc_scene_state: npcSceneState,
    last_npcs_present: ['heroine1', 'heroine2']
  };
}

const cast = (playerAction, options) => buildSceneCastContract({
  save: save(options), master: MASTER, playerAction, mapLocations: LOCATIONS
});

// ── O-1 / O-2: 기본 위치 정본 ──────────────────────────────────────────────

test('맵1: 모든 주요 NPC가 canonical default location을 가진다', () => {
  for (const [id, character] of Object.entries(CHARACTERS)) {
    assert.ok(character.default_location_id, `${id}(${character.name})에 default_location_id 없음`);
  }
});

test('맵2: 모든 default location이 map.locations에 실재한다', () => {
  for (const [id, character] of Object.entries(CHARACTERS)) {
    assert.ok(
      LOCATION_IDS.has(character.default_location_id),
      `${id} default_location_id=${character.default_location_id}가 map.locations에 없음`
    );
  }
});

test('맵2b: 저장 위치가 없으면 default_location_id로 보완하고, 저장 위치가 있으면 그것이 우선한다', () => {
  const charactersMap = Object.fromEntries(Object.entries(CHARACTERS).map(([id, v]) => [id, v]));
  assert.equal(
    resolveNpcLocationId({ save: save(), npcId: 'heroine2', charactersMap, mapLocations: LOCATIONS }),
    'brand_strategy_office'
  );
  assert.equal(
    resolveNpcLocationId({
      save: save({ npcSceneState: { heroine2: { location_id: 'lounge' } } }),
      npcId: 'heroine2', charactersMap, mapLocations: LOCATIONS
    }),
    'lounge',
    '저장된 위치가 항상 우선'
  );
});

// ── O-3: 한 턴 이동 ────────────────────────────────────────────────────────

test('맵3: "민아 보러 간다" → 위치 기록이 없어도 목적지가 한 턴에 확정된다', () => {
  const contract = cast('이제 민아보러 가야지~', { npcSceneState: { heroine2: { present: true } } });
  assert.equal(contract.transition_mode, 'movement');
  assert.deepEqual(contract.destination_npc_ids, ['heroine2']);
  assert.equal(contract.destination_location_id, 'brand_strategy_office', '저장 위치가 없어도 default로 확정');
});

// ── O-5 / O-6: participants 단일 출연 정본 ────────────────────────────────

test('맵5: 같은 위치의 서원희도 participants가 아니면 발화할 수 없다', () => {
  const contract = cast('민아씨 안녕?', {
    participants: ['player-1', 'heroine2'],
    locationId: 'brand_strategy_office',
    npcSceneState: {
      heroine2: { present: true, location_id: 'brand_strategy_office' },
      heroine1: { present: true, location_id: 'brand_strategy_office' }
    }
  });
  assert.ok(contract.present_npc_ids.includes('heroine2'), '참가자는 출연');
  assert.ok(!contract.present_npc_ids.includes('heroine1'), '같은 장소여도 비참가자는 출연 불가');
  assert.ok(!contract.allowed_speaker_ids.includes('heroine1'), '비참가자는 발화 불가');
});

test('맵6: stale present:true가 남아 있어도 participants가 아니면 발화 불가 (turn 32 난입 원인)', () => {
  const contract = cast('민아씨 안녕?', {
    participants: ['player-1', 'heroine2'],
    npcSceneState: {
      heroine2: { present: true },
      heroine1: { present: true },
      heroine5: { present: true }
    }
  });
  assert.deepEqual(contract.present_npc_ids, ['heroine2']);
  for (const id of ['heroine1', 'heroine5']) {
    assert.ok(!contract.allowed_speaker_ids.includes(id), `${id}는 stale present만으로 발화 불가`);
  }
});

// ── O-7: 장소 이동은 NPC를 자동 참가시키지 않는다 ─────────────────────────

test('맵7: 휴게실로 이동해도 그곳 NPC가 자동으로 참가자가 되지 않는다', () => {
  const contract = cast('휴게실로 간다', {
    participants: ['player-1'],
    npcSceneState: { heroine1: { present: true, location_id: 'employee_lounge' } }
  });
  assert.ok(!contract.present_npc_ids.includes('heroine1'), '장소 이동만으로 자동 참가 없음');
  assert.ok(!contract.allowed_speaker_ids.includes('heroine1'));
});

// ── O-8: NPC 이름 없이 장소 이름만으로 이동하는 순수 이동 ──────────────────
// "이동하다"의 활용형 "이동한다"는 "이동하" 부분 문자열을 포함하지 않는다(하→한).
// 실플레이 검증에서 발견된 회귀 — NPC를 함께 언급하지 않는 순수 장소 이동이
// transition_mode를 전혀 'movement'로 바꾸지 못하고 destination_location_id가
// 항상 null로 남아 Story가 이전 장면을 그대로 이어가는 버그였다.

test('맵8: "브랜드전략팀 사무실로 이동한다" (NPC 미언급) → movement, destination_location_id 확정', () => {
  const contract = cast('브랜드전략팀 사무실로 이동한다', {
    locationId: 'brand_strategy_meeting_room',
    participants: ['player-1', 'heroine2'],
    npcSceneState: { heroine2: { present: true, location_id: 'brand_strategy_meeting_room' } }
  });
  assert.equal(contract.transition_mode, 'movement');
  assert.equal(contract.destination_location_id, 'brand_strategy_office');
  assert.deepEqual(contract.destination_npc_ids, [], 'NPC 이름이 없으므로 목적지 NPC는 비어 있어야 한다');
  assert.deepEqual(contract.present_npc_ids, [], '말 걸기 의도가 없는 순수 이동은 아무도 발화하지 않는다');
});

test('맵9: "직원 라운지로 이동한다" (기본 NPC 없는 장소) → movement, 아무도 자동 등장하지 않는다', () => {
  const contract = cast('직원 라운지로 이동한다', {
    locationId: 'brand_strategy_office',
    participants: ['player-1']
  });
  assert.equal(contract.transition_mode, 'movement');
  assert.equal(contract.destination_location_id, 'employee_lounge');
  assert.deepEqual(contract.destination_npc_ids, []);
  assert.deepEqual(contract.present_npc_ids, []);
  assert.deepEqual(contract.allowed_speaker_ids, ['player']);
});

test('맵9b: "서원희를 찾아간다" (스펙 시나리오 3 리터럴 입력) → movement, heroine1 목적지 확정', () => {
  const contract = cast('서원희를 찾아간다', {
    locationId: 'brand_strategy_meeting_room',
    participants: ['player-1', 'heroine2'],
    npcSceneState: {
      heroine2: { present: true, location_id: 'brand_strategy_meeting_room' },
      heroine1: { present: false, location_id: 'brand_strategy_office' }
    }
  });
  assert.equal(contract.transition_mode, 'movement');
  assert.deepEqual(contract.destination_npc_ids, ['heroine1']);
  assert.equal(contract.destination_location_id, 'brand_strategy_office');
});

test('맵10: 이미 있는 장소로 "이동한다"고 말해도 movement로 취급하지 않는다 (목적지=현재 위치)', () => {
  const contract = cast('브랜드전략팀 회의실로 이동한다', {
    locationId: 'brand_strategy_meeting_room',
    participants: ['player-1', 'heroine2'],
    npcSceneState: { heroine2: { present: true, location_id: 'brand_strategy_meeting_room' } }
  });
  assert.equal(contract.transition_mode, 'stationary');
  assert.equal(contract.destination_location_id, null);
});

// ── O-9c: 출발 participants에 이미 있던 대상이 이동+대화에서 사라지던 버그 ──

test('맵9c: 출발 장면에 이미 있던 윤민아를 "이동해서 인사한다" → destination/present에서 빠지지 않는다', () => {
  const contract = cast('브랜드전략팀 사무실로 가서 윤민아에게 인사한다', {
    locationId: 'brand_strategy_meeting_room',
    participants: ['player-1', 'heroine2'],
    npcSceneState: { heroine2: { present: true, location_id: 'brand_strategy_meeting_room' } }
  });
  assert.equal(contract.transition_mode, 'movement');
  assert.equal(contract.destination_location_id, 'brand_strategy_office', '문장에 명시된 목적지 장소가 우선이다');
  assert.deepEqual(contract.destination_npc_ids, ['heroine2']);
  assert.deepEqual(contract.present_npc_ids, ['heroine2'], '말 걸기 의도가 있으므로 같은 턴에 발화 가능해야 한다');
  assert.ok(contract.allowed_speaker_ids.includes('heroine2'));
  assert.ok(!contract.allowed_speaker_ids.includes('heroine1'), '다른 NPC는 등장하지 않는다');
});

// ── O-11 / O-12: 업무 선택지 0개 ──────────────────────────────────────────

const storySystemPrompt = playerAction => buildStoryPrompt({
  edition: { editionId: 'company-v1', characters: { characters: CHARACTERS }, generalNpcs: { profiles: {} }, map: mapContent },
  context: { save: { data: save() } },
  playerAction,
  expectedTurn: 33,
  npcIds: new Set(),
  catalogs: {}
})[0].content;

test('맵11: Story 계약이 업무·대화 선택지를 자연스럽게 허용한다', () => {
  const system = storySystemPrompt('민아씨 안녕?');
  assert.match(system, /현재 장면에서 바로 실행할 수 있는 서로 다른 행동 4개/);
  assert.match(system, /현재 업무 장면에서 자연스러운 업무·대화 선택지는 허용한다/);
});

test('맵12: 업무 편향 제거 계약은 유지되고 선택지 제한은 완화된다', () => {
  const system = storySystemPrompt('작년 예산 자료를 확인한다');
  assert.match(system, /업무 편향 제거/);
  assert.match(system, /업무를 이유로 다른 NPC를 등장시키지 않는다/);
});

test('맵12b: Story 프롬프트에 NaN 같은 손상 문자열이 들어가지 않는다', () => {
  const system = storySystemPrompt('민아씨 안녕?');
  assert.ok(!system.includes('NaN'), 'NaN 오염');
  assert.ok(!system.includes('undefined'), 'undefined 오염');
});

// ── O-15: 추가 LLM 호출 없음 ──────────────────────────────────────────────

test('맵15: cast 계산은 순수 함수 — fetch/LLM 호출이 전혀 없다', () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls += 1; throw new Error('cast는 네트워크를 호출하면 안 된다'); };
  try {
    cast('민아 보러 간다', { npcSceneState: { heroine2: { present: true } } });
    storySystemPrompt('민아 보러 간다');
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(calls, 0);
});

// ── O-4: 같은 턴 이동 + 만남 + 대화 ───────────────────────────────────────

test('맵4: "민아에게 인사한다" → 같은 턴에 도착하고 윤민아가 대답할 수 있다', () => {
  const contract = cast('브랜드전략팀으로 가서 민아에게 인사한다', {
    npcSceneState: { heroine2: { present: true } }
  });
  assert.equal(contract.transition_mode, 'movement');
  assert.equal(contract.destination_location_id, 'brand_strategy_office');
  assert.ok(contract.allowed_speaker_ids.includes('heroine2'), '말 걸기 의도가 있으면 같은 턴 응답 허용');
});

test('맵4b: 말 걸기 의도가 없는 순수 이동은 도착까지만 — 목적지 NPC가 먼저 말하지 않는다', () => {
  const contract = cast('이제 민아보러 가야지~', { npcSceneState: { heroine2: { present: true } } });
  assert.equal(contract.transition_mode, 'movement');
  assert.deepEqual(contract.allowed_speaker_ids, ['player'], '도착 서술만, 발화는 다음 턴');
});

// ── O-8/9/10/13: 맵 패널 상호작용 ─────────────────────────────────────────

const mapModule = await import('../src/frontend/pages/company-map.js');

test('맵8/9: 장소·NPC 클릭 문장은 입력창 채우기용일 뿐 턴을 실행하지 않는다', () => {
  assert.equal(mapModule.locationPromptText('브랜드전략팀 사무실'), '브랜드전략팀 사무실로 이동한다');
  assert.equal(mapModule.npcPromptText('윤민아'), '윤민아를 찾아간다');
});

test('맵10/13: 맵 모델은 이미 받은 save만 읽고 네트워크를 호출하지 않는다', () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls += 1; throw new Error('맵은 별도 API를 호출하면 안 된다'); };
  let model;
  try {
    model = mapModule.buildCompanyMapModel({
      save: save({ participants: ['player-1', 'heroine2'] }),
      characters: CHARACTERS,
      locations: LOCATIONS
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(calls, 0, '맵 전용 API 요청 0회');
  assert.equal(model.player_location_id, 'brand_strategy_meeting_room');
  assert.ok(model.floors.length, '층별 목록 생성');
});

test('맵10b: 위치 기록이 없는 NPC도 default location으로 배치되고 participants만 별도 표시된다', () => {
  const model = mapModule.buildCompanyMapModel({
    save: save({ participants: ['player-1', 'heroine2'] }),
    characters: CHARACTERS,
    locations: LOCATIONS
  });
  const everyone = model.floors.flatMap(floor => floor.places.flatMap(place => place.npcs));
  const minah = everyone.find(npc => npc.npc_id === 'heroine2');
  const wonhee = everyone.find(npc => npc.npc_id === 'heroine1');
  assert.ok(minah?.inScene, '참가자는 강조 표시');
  assert.ok(wonhee && !wonhee.inScene, '같은 장소여도 비참가자는 강조되지 않음');
  assert.equal(model.unknown.length, 0, 'default location 덕분에 위치 미확인 없음');
});
