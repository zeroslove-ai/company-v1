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
    'team_office'
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
  assert.equal(contract.destination_location_id, 'team_office', '저장 위치가 없어도 default로 확정');
});

// ── O-5 / O-6: participants 단일 출연 정본 ────────────────────────────────

test('맵5: 같은 위치의 서원희도 participants가 아니면 발화할 수 없다', () => {
  const contract = cast('민아씨 안녕?', {
    participants: ['player-1', 'heroine2'],
    locationId: 'team_office',
    npcSceneState: {
      heroine2: { present: true, location_id: 'team_office' },
      heroine1: { present: true, location_id: 'team_office' }
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

// ── O-11 / O-12: 업무 선택지 0개 ──────────────────────────────────────────

const storySystemPrompt = playerAction => buildStoryPrompt({
  edition: { editionId: 'company-v1', characters: { characters: CHARACTERS }, generalNpcs: { profiles: {} }, map: mapContent },
  context: { save: { data: save() } },
  playerAction,
  expectedTurn: 33,
  npcIds: new Set(),
  catalogs: {}
})[0].content;

test('맵11: Story 계약이 업무 선택지를 전면 금지한다', () => {
  const system = storySystemPrompt('민아씨 안녕?');
  assert.match(system, /업무 선택지는 하나도 만들지 않는다/);
  assert.match(system, /자료 확인·예산 검토·보고서·감사 포인트·계약 검토·지표 분석·회의 계속·메일 확인/);
});

test('맵12: 업무를 직접 입력해도 다음 선택지는 업무로 이어지지 않는다는 계약이 있다', () => {
  const system = storySystemPrompt('작년 예산 자료를 확인한다');
  assert.match(system, /업무를 직접 입력했어도 다음 선택지는 업무로 이어지지 않는다/);
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
