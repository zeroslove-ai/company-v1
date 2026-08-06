import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSceneCastContract,
  speakerNameById,
  canSpeak,
  resolveUserMentionedNpcIds
} from '../src/engine/scene-cast.js';
import { createStructuredStoryGate } from '../src/engine/structured-story-v2.js';
import { buildStructuredStoryV2ExtractText } from '../src/engine/extract-prompt.js';
import { applyGuardedStateDelta, sanitizeMovementCommit } from '../src/engine/guarded-merge.js';

// ---------------------------------------------------------------------------
// 픽스처 — 실제 캐논 형식
// ---------------------------------------------------------------------------

const master = {
  characters: [
    { character_id: 'heroine1', name: '서원희' },
    { character_id: 'heroine2', name: '윤민아' },
    { character_id: 'heroine5', name: '이메이' }
  ],
  general_npcs: []
};

const speakerNames = speakerNameById(master, '금태양');

function initialSave() {
  return {
    edition: 'company-v1',
    save_schema_version: 1,
    player: { id: 'player-1', name: '금태양', department: '감사팀' },
    scene_state: {
      scene_id: 'meeting_room_5f',
      location_id: 'meeting_room_5f',
      participants: ['player-1', 'heroine1'],
      updated_turn: 7
    },
    last_npcs_present: ['heroine1'],
    npc_scene_state: {
      heroine1: { present: true, location_id: 'meeting_room_5f' },
      // 윤민아는 디자인팀에 위치 — 이동 목적지
      heroine2: { present: false, location_id: 'design_team' }
    },
    focal_character_id: 'heroine1',
    last_speaker_id: 'heroine1',
    world_state: {},
    turn_state: {},
    npc_stats: {},
    npc_relationship_state: {},
    event_ledger: [],
    sexual_event_ledger: []
  };
}

// ---------------------------------------------------------------------------
// 검토 수정 1 — 유일한 짧은 이름 해석
// ---------------------------------------------------------------------------

test('민아 보러 간다 → heroine2 destination, movement', () => {
  const contract = buildSceneCastContract({
    save: initialSave(),
    master,
    playerAction: '민아 보러 간다'
  });
  assert.ok(contract.destination_npc_ids.includes('heroine2'), '뒷두 글자 유일 매칭');
  assert.equal(contract.transition_mode, 'movement');
  assert.equal(contract.destination_location_id, 'design_team');
  assert.ok(!contract.allowed_speaker_ids.includes('heroine1'), '기존 장소 NPC 발화 금지');
  assert.ok(!contract.allowed_speaker_ids.includes('heroine2'), '목적지 NPC 발화 금지');
});

test('민아에게 전화한다 → heroine2 remote', () => {
  const contract = buildSceneCastContract({
    save: initialSave(),
    master,
    playerAction: '민아에게 전화한다.'
  });
  assert.ok(contract.remote_npc_ids.includes('heroine2'), '짧은 이름으로 원격 대상 해석');
});

test('민아에게 이유를 묻는다 → allowed_target_ids=[heroine2]', () => {
  const policy = buildSceneCastContract({
    save: initialSave(),
    master,
    playerAction: '민아에게 지표가 비어 있는 이유를 묻는다.'
  }).player_dialogue;
  assert.ok(policy.allowed_target_ids.includes('heroine2'), 'PlayerDialoguePolicy도 짧은 이름 해석');
});

test('동일한 뒷두 글자가 2명 등록 → target 미확정', () => {
  const master2 = {
    characters: [
      { character_id: 'heroine1', name: '서원희' },
      { character_id: 'heroine2', name: '윤민아' },
      { character_id: 'heroine9', name: '김민아' }
    ],
    general_npcs: []
  };
  const ids = resolveUserMentionedNpcIds(master2, '민아 보러 간다');
  assert.equal(ids.length, 0, '불명확한 짧은 이름은 아무도 선택하지 않음');
  // 전체 이름은 여전히 확정
  const fullIds = resolveUserMentionedNpcIds(master2, '윤민아를 보러 간다');
  assert.ok(fullIds.includes('heroine2'));
});

// ---------------------------------------------------------------------------
// 검토 수정 2 — 실제 2턴 통합 체인
// ---------------------------------------------------------------------------

test('진짜 2턴 통합: 민아 보러 간다 → Commit → 다음 턴 발화 권한', () => {
  // ── 턴 1: 이동 ──
  const save1 = initialSave();
  const contract1 = buildSceneCastContract({ save: save1, master, playerAction: '민아 보러 간다' });
  assert.equal(contract1.transition_mode, 'movement');

  // Story gate — 이동 서술만 (NPC 대사 없음, 전환 턴)
  const gate = createStructuredStoryGate({ contract: contract1, speakerNames });
  gate.push('[1. 서사 및 행동]\n[SCENE]\n금태양이 자리에서 일어나 디자인팀으로 향했다.\n[SCENE]\n디자인팀 사무실에 도착하자 윤민아가 모니터를 보며 앉아 있었다.\n');
  const gated = gate.end();
  const parsedStory = {
    structured_story_version: 2,
    blocks: gated.segments,
    dialogue_lines: gated.blocks,
    stream_segments: gated.stream_segments,
    warnings: gated.warnings,
    scene_cast_contract: contract1
  };
  const storyForExtract = buildStructuredStoryV2ExtractText(parsedStory);
  assert.ok(storyForExtract.includes('디자인팀'), '이동 서술이 Extract 입력에 포함');

  // mock Extract envelope — 이동 계약에 따른 state_delta 제안
  const envelope = {
    state_delta: {
      scene_state: { location_id: 'design_team', participants: ['player-1', 'heroine2'] },
      last_npcs_present: ['heroine2'],
      focal_character_id: 'heroine2'
    },
    npcs_present: ['heroine2'],
    outcome: 'success',
    evidence: { arrival: true },
    turn_summary: '디자인팀으로 이동해 윤민아와 마주쳤다.',
    mind_monitor: {},
    choices: [],
    dialogue_lines: [],
    warnings: []
  };

  // guarded merge → sanitizer
  const merged = applyGuardedStateDelta(save1, envelope, {
    expectedTurn: 8, actionId: 'a8', turnId: 'turn-8', playerAction: '민아 보러 간다',
    parsedStory, master, npcIds: new Set(['heroine1', 'heroine2', 'heroine5'])
  });
  sanitizeMovementCommit(merged.nextSave, contract1, envelope);

  const finalSave1 = merged.nextSave;
  assert.equal(finalSave1.scene_state.location_id, 'design_team', '1턴 location_id = 디자인팀');
  assert.deepEqual(finalSave1.scene_state.participants, ['player-1', 'heroine2'], '1턴 participants');
  assert.deepEqual(finalSave1.last_npcs_present, ['heroine2'], '1턴 last_npcs_present');
  assert.equal(finalSave1.focal_character_id, 'heroine2', '1턴 focal');
  assert.equal(finalSave1.npc_scene_state.heroine1.present, false, '기존 장소 NPC present=false');
  assert.equal(finalSave1.npc_scene_state.heroine2.present, true, '목적지 NPC present=true');
  assert.equal(finalSave1.npc_scene_state.heroine2.location_id, 'design_team');

  // ── 턴 2: 다음 턴 cast ──
  const contract2 = buildSceneCastContract({
    save: finalSave1,
    master,
    playerAction: '윤민아에게 인사한다.'
  });
  assert.equal(contract2.transition_mode, 'stationary', '2턴은 정주 턴');
  assert.ok(contract2.present_npc_ids.includes('heroine2'), '2턴 윤민아 present');
  assert.ok(contract2.allowed_speaker_ids.includes('heroine2'), '2턴 윤민아 발화 허용');
  assert.equal(canSpeak(contract2, 'heroine2'), true);
  assert.ok(!contract2.allowed_speaker_ids.includes('heroine1'), '2턴 이전 장소 NPC 발화 불가');
  assert.equal(canSpeak(contract2, 'heroine1'), false);
});

test('이동 중단(outcome=interrupted)이면 목적지 NPC를 participants에 넣지 않음', () => {
  const save1 = initialSave();
  const contract1 = buildSceneCastContract({ save: save1, master, playerAction: '민아 보러 간다' });
  const envelope = {
    state_delta: { scene_state: { location_id: 'meeting_room_5f', participants: ['player-1', 'heroine1'] } },
    npcs_present: ['heroine1'],
    outcome: 'interrupted',
    turn_summary: '이동 중 전화가 와서 멈췄다.',
    mind_monitor: {},
    choices: [],
    dialogue_lines: [],
    warnings: []
  };
  const merged = applyGuardedStateDelta(save1, envelope, {
    expectedTurn: 8, actionId: 'a8', turnId: 'turn-8', playerAction: '민아 보러 간다',
    parsedStory: { structured_story_version: 2, blocks: [], dialogue_lines: [], warnings: [], scene_cast_contract: contract1 },
    master, npcIds: new Set(['heroine1', 'heroine2', 'heroine5'])
  });
  sanitizeMovementCommit(merged.nextSave, contract1, envelope);
  assert.equal(merged.nextSave.scene_state.location_id, 'meeting_room_5f', '중단 시 장소 유지');
  assert.ok(!merged.nextSave.scene_state.participants.includes('heroine2'), '중단 시 목적지 NPC 미포함');
});
