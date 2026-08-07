import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
// 픽스처
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
      updated_turn: 7,
      focus_thread: '감사 지표',
      scene_goal: '지표 확인'
    },
    last_npcs_present: ['heroine1'],
    npc_scene_state: {
      heroine1: { present: true, location_id: 'meeting_room_5f', updated_turn: 7 },
      // 윤민아는 디자인팀에 위치 — 이동 목적지 (posture/clothing 포함)
      heroine2: {
        present: false,
        scene_id: 'design_team',
        location_id: 'design_team',
        posture: '의자에 앉아 있음',
        position_label: '3번 좌석',
        clothing: { 상의: '카디건', 하의: '슬랙스' },
        work_state: { task: '리포트 작성 중' },
        updated_turn: 3
      },
      // 다른 장소의 무관한 NPC — 이동과 무관, state 불변해야 함
      heroine5: { present: true, location_id: 'accounting_office', updated_turn: 6 }
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

function movementCast(save, playerAction = '민아 보러 간다') {
  return buildSceneCastContract({ save, master, playerAction });
}

function emptySuccessEnvelope() {
  // 의도적으로 이동 관련 state를 비운다 — sanitizer만으로 이동이 확정돼야 함
  return {
    state_delta: {},
    npcs_present: [],
    outcome: 'success',
    evidence: {},
    turn_summary: '디자인팀으로 이동했다.',
    mind_monitor: {},
    choices: [],
    dialogue_lines: [],
    warnings: []
  };
}

function wrongDestinationEnvelope(outcome) {
  // Extract가 잘못된 목적지 이동을 제안 (participants에 player 누락 + heroine2만)
  return {
    state_delta: {
      scene_state: { scene_id: 'design_team', location_id: 'design_team', participants: ['heroine2'] },
      npc_scene_state: { heroine2: { present: true, location_id: 'design_team' } }
    },
    npcs_present: ['heroine2'],
    outcome,
    evidence: {},
    turn_summary: '이동 시도',
    mind_monitor: {},
    choices: [],
    dialogue_lines: [],
    warnings: []
  };
}

// ---------------------------------------------------------------------------
// 성공 이동 (state_delta={} — sanitizer만으로 확정)
// ---------------------------------------------------------------------------

function runSuccessSanitize(save = initialSave()) {
  const contract = movementCast(save);
  assert.equal(contract.transition_mode, 'movement');
  const merged = applyGuardedStateDelta(save, emptySuccessEnvelope(), {
    expectedTurn: 8, actionId: 'a8', turnId: 't8', playerAction: '민아 보러 간다',
    parsedStory: { structured_story_version: 2, blocks: [], dialogue_lines: [], warnings: [], scene_cast_contract: contract },
    master, npcIds: new Set(['heroine1', 'heroine2', 'heroine5'])
  });
  const result = sanitizeMovementCommit({
    beforeSave: save,
    nextSave: merged.nextSave,
    sceneCastContract: contract,
    extractEnvelope: emptySuccessEnvelope(),
    actionKind: 'ordinary',
    expectedTurn: 8
  });
  return { contract, merged, result, nextSave: merged.nextSave };
}

test('1. state_delta={}여도 success 이동 Commit', () => {
  const { result } = runSuccessSanitize();
  assert.equal(result.applied, true);
  assert.equal(result.reason, 'movement_committed');
});

test('2. Extract participants에서 player 누락돼도 player 복구', () => {
  const { nextSave } = runSuccessSanitize();
  assert.ok(nextSave.scene_state.participants.includes('player-1'), 'player-1 복구');
});

test('3. Extract가 엉뚱한 기존 NPC participants를 제안해도 제거', () => {
  const save = initialSave();
  const contract = movementCast(save);
  const merged = applyGuardedStateDelta(save, {
    ...emptySuccessEnvelope(),
    state_delta: { scene_state: { participants: ['heroine1', 'heroine5'] } }
  }, { expectedTurn: 8, actionId: 'a8', turnId: 't8', playerAction: 'x', parsedStory: { scene_cast_contract: contract }, master, npcIds: new Set(['heroine1', 'heroine2', 'heroine5']) });
  const result = sanitizeMovementCommit({ beforeSave: save, nextSave: merged.nextSave, sceneCastContract: contract, extractEnvelope: emptySuccessEnvelope(), actionKind: 'ordinary', expectedTurn: 8 });
  assert.equal(result.applied, true);
  assert.deepEqual(merged.nextSave.scene_state.participants, ['player-1', 'heroine2'], '엉뚱한 NPC 제거');
});

test('4. scene_id와 location_id 모두 목적지로 갱신', () => {
  const { nextSave } = runSuccessSanitize();
  assert.equal(nextSave.scene_state.scene_id, 'design_team');
  assert.equal(nextSave.scene_state.location_id, 'design_team');
});

test('5. destination NPC posture 보존', () => {
  const { nextSave } = runSuccessSanitize();
  assert.equal(nextSave.npc_scene_state.heroine2.posture, '의자에 앉아 있음');
});

test('6. destination NPC clothing 보존', () => {
  const { nextSave } = runSuccessSanitize();
  assert.deepEqual(nextSave.npc_scene_state.heroine2.clothing, { 상의: '카디건', 하의: '슬랙스' });
});

test('7. destination NPC 기존 기타 필드 보존', () => {
  const { nextSave } = runSuccessSanitize();
  assert.equal(nextSave.npc_scene_state.heroine2.position_label, '3번 좌석');
  assert.deepEqual(nextSave.npc_scene_state.heroine2.work_state, { task: '리포트 작성 중' });
  assert.equal(nextSave.npc_scene_state.heroine2.present, true);
  assert.equal(nextSave.npc_scene_state.heroine2.location_id, 'design_team');
  assert.equal(nextSave.npc_scene_state.heroine2.scene_id, 'design_team');
  assert.equal(nextSave.npc_scene_state.heroine2.updated_turn, 8);
});

test('8. 기존 장소 NPC만 present:false', () => {
  const { nextSave } = runSuccessSanitize();
  assert.equal(nextSave.npc_scene_state.heroine1.present, false, '기존 장소 NPC 퇴장');
});

test('9. 다른 장소의 무관한 NPC state 불변', () => {
  const { nextSave } = runSuccessSanitize();
  assert.equal(nextSave.npc_scene_state.heroine5.present, true, '이메이 상태 불변');
  assert.equal(nextSave.npc_scene_state.heroine5.location_id, 'accounting_office', '위치 불변');
  assert.equal(nextSave.npc_scene_state.heroine5.updated_turn, 6, 'updated_turn 불변');
});

test('10. last_npcs_present는 destination 1명', () => {
  const { nextSave } = runSuccessSanitize();
  assert.deepEqual(nextSave.last_npcs_present, ['heroine2']);
});

test('11. focal은 destination 1명', () => {
  const { nextSave } = runSuccessSanitize();
  assert.equal(nextSave.focal_character_id, 'heroine2');
});

test('12~13. 다음 턴 destination NPC 발화 허용, 기존 장소 NPC 발화 불가', () => {
  const { nextSave } = runSuccessSanitize();
  const contract2 = buildSceneCastContract({ save: nextSave, master, playerAction: '윤민아에게 인사한다.' });
  assert.ok(contract2.present_npc_ids.includes('heroine2'), '윤민아 present');
  assert.equal(canSpeak(contract2, 'heroine2'), true, '윤민아 발화 허용');
  assert.equal(canSpeak(contract2, 'heroine1'), false, '서원희 발화 불가');
});

// ---------------------------------------------------------------------------
// 실패 이동 복원 (Extract가 잘못 제안해도 beforeSave 기준 복원)
// ---------------------------------------------------------------------------

function runFailSanitize(outcome) {
  const save = initialSave();
  const contract = movementCast(save);
  const merged = applyGuardedStateDelta(save, wrongDestinationEnvelope(outcome), {
    expectedTurn: 8, actionId: 'a8', turnId: 't8', playerAction: '민아 보러 간다',
    parsedStory: { structured_story_version: 2, blocks: [], dialogue_lines: [], warnings: [], scene_cast_contract: contract },
    master, npcIds: new Set(['heroine1', 'heroine2', 'heroine5'])
  });
  const result = sanitizeMovementCommit({
    beforeSave: save, nextSave: merged.nextSave, sceneCastContract: contract,
    extractEnvelope: wrongDestinationEnvelope(outcome), actionKind: 'ordinary', expectedTurn: 8
  });
  return { save, contract, merged, result, nextSave: merged.nextSave };
}

for (const outcome of ['partial', 'interrupted', 'blocked', 'refused', 'degraded']) {
  test(`14~18. ${outcome} — Extract가 목적지를 제안해도 시작 장소 복원`, () => {
    const { nextSave, result } = runFailSanitize(outcome);
    assert.equal(result.applied, false);
    assert.equal(result.reason, 'movement_not_successful');
    assert.deepEqual(result.warnings, [`movement_commit_skipped:${outcome}`]);
    assert.equal(nextSave.scene_state.location_id, 'meeting_room_5f', '시작 장소 복원');
    assert.equal(nextSave.scene_state.scene_id, 'meeting_room_5f', '시작 scene 복원');
  });
}

test('19. 실패 시 beforeSave의 participants 복원', () => {
  const { save, nextSave } = runFailSanitize('interrupted');
  assert.deepEqual(nextSave.scene_state.participants, save.scene_state.participants, 'participants 복원');
});

test('20. 실패 시 beforeSave의 npc_scene_state 복원', () => {
  const { save, nextSave } = runFailSanitize('interrupted');
  assert.deepEqual(nextSave.npc_scene_state, save.npc_scene_state, 'npc_scene_state 복원');
  assert.equal(nextSave.npc_scene_state.heroine2.present, false, 'heroine2 원상태');
});

test('21. 실패 시 beforeSave의 focal/last speaker 복원', () => {
  const { save, nextSave } = runFailSanitize('interrupted');
  assert.equal(nextSave.focal_character_id, save.focal_character_id, 'focal 복원');
  assert.equal(nextSave.last_speaker_id, save.last_speaker_id, 'last_speaker 복원');
  assert.deepEqual(nextSave.last_npcs_present, save.last_npcs_present, 'last_npcs_present 복원');
});

// ---------------------------------------------------------------------------
// 모호성 및 예외
// ---------------------------------------------------------------------------

test('22. destination 0명 → 이동 미적용', () => {
  const save = initialSave();
  const contract = { ...movementCast(save), destination_npc_ids: [], destination_location_id: null, destination_scene_id: null };
  const merged = applyGuardedStateDelta(save, emptySuccessEnvelope(), { expectedTurn: 8, actionId: 'a8', turnId: 't8', playerAction: 'x', parsedStory: { scene_cast_contract: contract }, master, npcIds: new Set(['heroine1', 'heroine2', 'heroine5']) });
  const result = sanitizeMovementCommit({ beforeSave: save, nextSave: merged.nextSave, sceneCastContract: contract, extractEnvelope: emptySuccessEnvelope(), actionKind: 'ordinary', expectedTurn: 8 });
  assert.equal(result.applied, false);
  assert.equal(result.reason, 'missing_destination');
  assert.deepEqual(result.warnings, ['movement_commit_skipped:missing_destination']);
  assert.equal(merged.nextSave.scene_state.location_id, 'meeting_room_5f', '위치 유지');
});

test('23. destination 2명 → 이동 미적용', () => {
  const save = initialSave();
  const contract = { ...movementCast(save), destination_npc_ids: ['heroine2', 'heroine5'], destination_location_id: 'design_team' };
  const merged = applyGuardedStateDelta(save, emptySuccessEnvelope(), { expectedTurn: 8, actionId: 'a8', turnId: 't8', playerAction: 'x', parsedStory: { scene_cast_contract: contract }, master, npcIds: new Set(['heroine1', 'heroine2', 'heroine5']) });
  const result = sanitizeMovementCommit({ beforeSave: save, nextSave: merged.nextSave, sceneCastContract: contract, extractEnvelope: emptySuccessEnvelope(), actionKind: 'ordinary', expectedTurn: 8 });
  assert.equal(result.applied, false);
  assert.equal(result.reason, 'ambiguous_destination');
  assert.deepEqual(result.warnings, ['movement_commit_skipped:ambiguous_destination']);
  assert.equal(merged.nextSave.scene_state.location_id, 'meeting_room_5f', '위치 유지');
});

test('24. destination location 없음 → 이동 미적용', () => {
  const save = initialSave();
  const noLocSave = {
    ...save,
    npc_scene_state: {
      ...save.npc_scene_state,
      heroine2: { ...save.npc_scene_state.heroine2, location_id: null, scene_id: null }
    }
  };
  const contract = movementCast(noLocSave);
  assert.equal(contract.destination_location_id, null, '위치 없음');
  const merged = applyGuardedStateDelta(save, emptySuccessEnvelope(), { expectedTurn: 8, actionId: 'a8', turnId: 't8', playerAction: 'x', parsedStory: { scene_cast_contract: contract }, master, npcIds: new Set(['heroine1', 'heroine2', 'heroine5']) });
  const result = sanitizeMovementCommit({ beforeSave: save, nextSave: merged.nextSave, sceneCastContract: contract, extractEnvelope: emptySuccessEnvelope(), actionKind: 'ordinary', expectedTurn: 8 });
  assert.equal(result.applied, false);
  assert.equal(result.reason, 'unknown_destination_location');
  assert.deepEqual(result.warnings, ['movement_commit_skipped:unknown_destination_location']);
  assert.equal(merged.nextSave.scene_state.location_id, 'meeting_room_5f', '위치 유지');
});

test('25. feedback_revision → 이동 미적용 (함수 내부 방어)', () => {
  const save = initialSave();
  const contract = movementCast(save);
  // feedback_revision 턴 — Extract는 이동을 제안하지 않는다 (state_delta={})
  const merged = applyGuardedStateDelta(save, emptySuccessEnvelope(), { expectedTurn: 8, actionId: 'a8', turnId: 't8', playerAction: 'x', parsedStory: { scene_cast_contract: contract }, master, npcIds: new Set(['heroine1', 'heroine2', 'heroine5']) });
  const result = sanitizeMovementCommit({ beforeSave: save, nextSave: merged.nextSave, sceneCastContract: contract, extractEnvelope: emptySuccessEnvelope(), actionKind: 'feedback_revision', expectedTurn: 8 });
  assert.equal(result.applied, false);
  assert.equal(result.reason, 'feedback_revision');
  assert.equal(merged.nextSave.scene_state.location_id, 'meeting_room_5f', '위치 불변');
});

test('26. stationary turn → sanitizer no-op', () => {
  const save = initialSave();
  const contract = buildSceneCastContract({ save, master, playerAction: '서류를 정리한다.' });
  assert.equal(contract.transition_mode, 'stationary');
  const merged = applyGuardedStateDelta(save, emptySuccessEnvelope(), { expectedTurn: 8, actionId: 'a8', turnId: 't8', playerAction: '서류를 정리한다.', parsedStory: { scene_cast_contract: contract }, master, npcIds: new Set(['heroine1', 'heroine2', 'heroine5']) });
  const result = sanitizeMovementCommit({ beforeSave: save, nextSave: merged.nextSave, sceneCastContract: contract, extractEnvelope: emptySuccessEnvelope(), actionKind: 'ordinary', expectedTurn: 8 });
  assert.equal(result.applied, false);
  assert.equal(result.reason, 'not_movement');
  assert.equal(merged.nextSave.scene_state.location_id, 'meeting_room_5f');
});

test('27. beforeSave mutation 없음', () => {
  const save = initialSave();
  const before = JSON.stringify(save);
  runSuccessSanitize(save);
  assert.equal(JSON.stringify(save), before, 'beforeSave 불변');
});

test('28. sanitizer warning이 반환 warnings에 포함', () => {
  const { result } = runFailSanitize('interrupted');
  assert.ok(result.warnings.includes('movement_commit_skipped:interrupted'));
  // turn-routes는 warnings.push(...movementResult.warnings)로 Commit 응답에 전달
});

test('30. 추가 LLM/network/RPC 없음 — 순수 함수 구조', () => {
  const sanitizeSrc = sanitizeMovementCommit.toString();
  assert.ok(!sanitizeSrc.includes('fetch('), 'sanitizer에 네트워크 호출 없음');
  assert.ok(!sanitizeSrc.includes('callRpc'), 'sanitizer에 RPC 없음');
  const castSrc = buildSceneCastContract.toString();
  assert.ok(!castSrc.includes('fetch('), 'cast에 네트워크 호출 없음');
});

// ---------------------------------------------------------------------------
// 진짜 2턴 통합 체인 (state_delta={} 성공)
// ---------------------------------------------------------------------------

test('진짜 2턴 통합: state_delta={} → sanitizer만으로 이동 확정 → 다음 턴 발화', () => {
  const save1 = initialSave();
  const contract1 = movementCast(save1);
  assert.equal(contract1.transition_mode, 'movement');

  // Story gate — 이동 서술만 (NPC 대사 없음)
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

  // mock Extract — 이동 정답을 미리 넣지 않는다 (state_delta={})
  const envelope = emptySuccessEnvelope();
  const merged = applyGuardedStateDelta(save1, envelope, {
    expectedTurn: 8, actionId: 'a8', turnId: 'turn-8', playerAction: '민아 보러 간다',
    parsedStory, master, npcIds: new Set(['heroine1', 'heroine2', 'heroine5'])
  });
  const movement = sanitizeMovementCommit({
    beforeSave: save1, nextSave: merged.nextSave, sceneCastContract: contract1,
    extractEnvelope: envelope, actionKind: 'ordinary', expectedTurn: 8
  });
  assert.equal(movement.applied, true, 'sanitizer만으로 이동 확정');

  const finalSave1 = merged.nextSave;
  assert.equal(finalSave1.scene_state.location_id, 'design_team', '1턴 location_id');
  assert.equal(finalSave1.scene_state.scene_id, 'design_team', '1턴 scene_id');
  assert.deepEqual(finalSave1.scene_state.participants, ['player-1', 'heroine2'], '1턴 participants');
  assert.deepEqual(finalSave1.last_npcs_present, ['heroine2'], '1턴 last_npcs_present');
  assert.equal(finalSave1.focal_character_id, 'heroine2', '1턴 focal');
  assert.equal(finalSave1.last_speaker_id, 'heroine1', 'last_speaker 유지');
  assert.equal(finalSave1.npc_scene_state.heroine1.present, false, '서원희 퇴장');
  assert.equal(finalSave1.npc_scene_state.heroine2.present, true, '윤민아 등장');
  assert.equal(finalSave1.npc_scene_state.heroine5.present, true, '이메이 불변');

  // 2턴 cast
  const contract2 = buildSceneCastContract({ save: finalSave1, master, playerAction: '윤민아에게 인사한다.' });
  assert.equal(contract2.transition_mode, 'stationary');
  assert.ok(contract2.present_npc_ids.includes('heroine2'));
  assert.equal(canSpeak(contract2, 'heroine2'), true, '2턴 윤민아 발화 허용');
  assert.equal(canSpeak(contract2, 'heroine1'), false, '2턴 서원희 발화 불가');
});

test('진짜 2턴 통합: interrupted + 잘못된 Extract 제안 → 시작 상태 rollback', () => {
  const save1 = initialSave();
  const contract1 = movementCast(save1);
  const parsedStory = { structured_story_version: 2, blocks: [], dialogue_lines: [], warnings: [], scene_cast_contract: contract1 };
  // Extract가 잘못된 목적지 이동을 제안 (participants에 player도 없음)
  const badEnvelope = wrongDestinationEnvelope('interrupted');
  const merged = applyGuardedStateDelta(save1, badEnvelope, {
    expectedTurn: 8, actionId: 'a8', turnId: 'turn-8', playerAction: '민아 보러 간다',
    parsedStory, master, npcIds: new Set(['heroine1', 'heroine2', 'heroine5'])
  });
  const movement = sanitizeMovementCommit({
    beforeSave: save1, nextSave: merged.nextSave, sceneCastContract: contract1,
    extractEnvelope: badEnvelope, actionKind: 'ordinary', expectedTurn: 8
  });
  assert.equal(movement.applied, false);
  assert.equal(merged.nextSave.scene_state.location_id, 'meeting_room_5f', '회의실 복원');
  assert.deepEqual(merged.nextSave.scene_state.participants, ['player-1', 'heroine1'], 'participants 복원');
  assert.deepEqual(merged.nextSave.npc_scene_state, save1.npc_scene_state, 'npc_scene_state 복원');
  assert.equal(merged.nextSave.focal_character_id, 'heroine1', 'focal 복원');
  // 다음 턴도 원래 회의실 cast 유지
  const contract2 = buildSceneCastContract({ save: merged.nextSave, master, playerAction: '서류를 정리한다.' });
  assert.ok(contract2.present_npc_ids.includes('heroine1'), '서원희 여전히 present');
  assert.equal(canSpeak(contract2, 'heroine2'), false, '윤민아 발화 불가');
});

test('민아 보러 간다 → heroine2 destination, movement (짧은 이름 해석 유지)', () => {
  const contract = movementCast(initialSave(), '민아 보러 간다');
  assert.ok(contract.destination_npc_ids.includes('heroine2'));
  assert.equal(contract.transition_mode, 'movement');
  assert.equal(contract.destination_location_id, 'design_team');
  assert.equal(contract.destination_scene_id, 'design_team');
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
  assert.equal(resolveUserMentionedNpcIds(master2, '민아 보러 간다').length, 0);
  assert.ok(resolveUserMentionedNpcIds(master2, '윤민아를 보러 간다').includes('heroine2'));
});

// ---------------------------------------------------------------------------
// 저장 파이프라인 안정화 핫픽스 — NPC 자세 저장 복원 + 같은 턴 동시 예약 방지
// ---------------------------------------------------------------------------

test('핫픽스 1. NPC 자세 state delta 저장 — evidence 없이도 Extract 제안 posture가 Commit save에 반영된다', () => {
  const save = initialSave();
  save.npc_scene_state.heroine1 = { present: true, location_id: 'meeting_room_5f', posture: 'unknown', position_label: null, updated_turn: 32 };
  const { nextSave, warnings } = applyGuardedStateDelta(save, {
    ...emptySuccessEnvelope(),
    npcs_present: ['heroine1'],
    state_delta: {
      npc_scene_state: {
        heroine1: { posture: 'sitting_on_lap', position_label: '무릎 위에 앉음', updated_turn: 37 }
      }
    }
  }, { expectedTurn: 37, actionId: 'a37', turnId: 't37', playerAction: 'x', parsedStory: {}, master, npcIds: new Set(['heroine1']) });
  assert.equal(nextSave.npc_scene_state.heroine1.posture, 'sitting_on_lap', 'posture가 Commit save에 반영');
  assert.equal(nextSave.npc_scene_state.heroine1.position_label, '무릎 위에 앉음', 'position_label 반영');
  assert.equal(nextSave.npc_scene_state.heroine1.updated_turn, 37, 'updated_turn 반영');
  assert.ok(warnings.some(w => w.includes('unevidenced')), '증거 불충분은 경고로만 기록');
});

test('핫픽스 2. 같은 턴 동시 예약 방지 — reserve_turn_action(5-arg)/commit_company_turn 계약', () => {
  const sql = fs.readFileSync(new URL('../supabase/migrations/20260807000100_company_v1_turn_guard.sql', import.meta.url), 'utf8');
  // 1) reserve_turn_action: 5-arg(structured_action) 버전에 같은 턴 처리 중 액션 검사
  assert.match(sql, /p_structured_action jsonb default null/, 'structured_action 포함 5-arg 버전');
  assert.match(sql, /expected_turn = p_expected_turn/, '같은 expected_turn in-flight 조회');
  assert.match(sql, /processing_status in \('story_streaming', 'extracting', 'committing', 'ready'\)/, '처리 중 상태 목록');
  assert.match(sql, /player_action is not distinct from p_player_action/, '같은 입력이면 기존 액션 재사용');
  assert.match(sql, /turn already in progress/, '다른 입력이면 turn_in_progress 거절');
  assert.match(sql, /drop function if exists public.reserve_turn_action\(uuid, uuid, integer, text\)/, '4-arg 구버전 제거');
  // 2) commit_company_turn: expected turn conflict를 commit_failed로 종료
  assert.match(sql, /processing_status = 'commit_failed', error_code = 'expected_turn_conflict'/, 'conflict 시 commit_failed 종료');
  assert.match(sql, /'terminated', true/, '종료 응답 플래그');
});
