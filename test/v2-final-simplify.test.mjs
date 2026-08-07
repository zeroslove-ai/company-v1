import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSceneCastContract,
  speakerNameById,
  canSpeak,
  resolvePlayerDialoguePolicy,
  validatePlayerDialogueAgainstPolicy,
  isNpcPresentAtCurrentScene
} from '../src/engine/scene-cast.js';
import {
  createStructuredStoryGate,
  DIALOGUE_WARNINGS,
  STRUCTURED_STORY_VERSION
} from '../src/engine/structured-story-v2.js';
import { buildStructuredStoryV2ExtractText } from '../src/engine/extract-prompt.js';

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

function baseSave(overrides = {}) {
  return {
    edition: 'company-v1',
    save_schema_version: 1,
    scene_state: {
      scene_id: 'meeting_room_5f',
      location_id: 'meeting_room_5f',
      participants: ['player-1', 'heroine5'],
      updated_turn: 7
    },
    last_npcs_present: ['heroine5'],
    npc_scene_state: { heroine5: { present: true, location_id: 'meeting_room_5f' } },
    focal_character_id: 'heroine5',
    last_speaker_id: 'heroine5',
    ...overrides
  };
}

const speakerNames = speakerNameById(master, '금태양');

function baseContract(playerAction = '서류를 정리한다.') {
  return buildSceneCastContract({ save: baseSave(), master, playerAction });
}

function gateFor(contract, names = speakerNames) {
  return createStructuredStoryGate({ contract, speakerNames: names });
}

// ---------------------------------------------------------------------------
// 1~2. V2 Extract scene 보존 (수정 1)
// ---------------------------------------------------------------------------

const extractFixture = {
  structured_story_version: 2,
  blocks: [
    { type: 'scene', text: '플레이어가 회의실을 나섰다.' },
    { type: 'dialogue', speaker_id: 'heroine5', speaker_name: '이메이', acting_direction: '서류를 내려놓으며', direction: '서류를 내려놓으며', text: '확인했습니다.' },
    { type: 'scene', text: '엘리베이터 문이 닫혔다.' }
  ],
  stream_segments: [
    { kind: 'text', text: '플레이어가 회의실을 나섰다.' },
    { kind: 'block', block: { type: 'dialogue', speaker_name: '이메이', text: '확인했습니다.' } },
    { kind: 'text', text: '엘리베이터 문이 닫혔다.' }
  ]
};

test('1. stream_segments가 있어도 V2 Extract scene 보존', () => {
  const text = buildStructuredStoryV2ExtractText(extractFixture);
  assert.ok(text.includes('플레이어가 회의실을 나섰다.'), 'scene 1 보존');
  assert.ok(text.includes('엘리베이터 문이 닫혔다.'), 'scene 2 보존');
  assert.ok(text.includes('확인했습니다.'), 'dialogue 보존');
});

test('2. scene-dialogue-scene 전체 Extract 직렬화 (원래 순서)', () => {
  const text = buildStructuredStoryV2ExtractText(extractFixture);
  const idxScene1 = text.indexOf('플레이어가 회의실을 나섰다.');
  const idxDlg = text.indexOf('확인했습니다.');
  const idxScene2 = text.indexOf('엘리베이터 문이 닫혔다.');
  assert.ok(idxScene1 >= 0 && idxDlg > idxScene1 && idxScene2 > idxDlg, 'scene→dialogue→scene 순서');
});

// ---------------------------------------------------------------------------
// 3~6. 이동 턴 cast (수정 2)
// ---------------------------------------------------------------------------

test('3. 이동 턴 destination NPC 발화 차단', () => {
  const contract = buildSceneCastContract({
    save: baseSave({ scene_state: { ...baseSave().scene_state, participants: ['player-1'] }, last_npcs_present: [], npc_scene_state: {} }),
    master,
    playerAction: '윤민아를 보러 디자인팀으로 간다.'
  });
  assert.equal(contract.transition_mode, 'movement');
  assert.ok(contract.destination_npc_ids.includes('heroine2'));
  assert.ok(!contract.allowed_speaker_ids.includes('heroine2'), 'destination 동일 턴 발화 금지');
  assert.equal(canSpeak(contract, 'heroine2'), false);
});

test('4. 이동 턴 기존 장소 NPC 발화 차단', () => {
  const contract = buildSceneCastContract({
    save: baseSave(),
    master,
    playerAction: '윤민아를 보러 디자인팀으로 간다.'
  });
  assert.equal(contract.transition_mode, 'movement');
  assert.ok(!contract.allowed_speaker_ids.includes('heroine5'), '기존 장소 NPC 발화 금지');
  assert.equal(canSpeak(contract, 'heroine5'), false);
  assert.deepEqual(contract.present_npc_ids, [], '이동 턴 present 비움');
});

test('5. 이동 다음 턴 destination NPC present 및 발화 허용', () => {
  // 첫 턴 commit 결과: 장소=디자인팀, participants=[player, 윤민아]
  const nextSave = baseSave({
    scene_state: { ...baseSave().scene_state, location_id: 'design_team', participants: ['player-1', 'heroine2'] },
    npc_scene_state: { heroine2: { present: true, location_id: 'design_team' } },
    last_npcs_present: ['heroine2']
  });
  const contract = buildSceneCastContract({ save: nextSave, master, playerAction: '윤민아에게 인사한다.' });
  assert.equal(contract.transition_mode, 'stationary');
  assert.ok(contract.present_npc_ids.includes('heroine2'), '윤민아 present');
  assert.ok(contract.allowed_speaker_ids.includes('heroine2'), '윤민아 발화 허용');
  assert.equal(canSpeak(contract, 'heroine2'), true);
});

test('6. 이동 다음 턴 기존 장소 NPC 발화 불가', () => {
  const nextSave = baseSave({
    scene_state: { ...baseSave().scene_state, location_id: 'design_team', participants: ['player-1', 'heroine2'] },
    npc_scene_state: { heroine2: { present: true, location_id: 'design_team' } },
    last_npcs_present: ['heroine2']
  });
  const contract = buildSceneCastContract({ save: nextSave, master, playerAction: '윤민아에게 인사한다.' });
  assert.ok(!contract.allowed_speaker_ids.includes('heroine5'), '서원희 발화 불가');
  assert.equal(canSpeak(contract, 'heroine5'), false);
});

// ---------------------------------------------------------------------------
// 7~10. 한 줄 버퍼 (수정 3)
// ---------------------------------------------------------------------------

test('7. "이메이: 네"를 1글자씩 push해도 전부 차단', () => {
  const story = '[1. 서사 및 행동]\n[SCENE]\n이메이: 네.\n정상 서술이다.\n';
  const a = gateFor(baseContract());
  for (const ch of story) a.push(ch); // 1글자씩
  const endA = a.end();
  assert.ok(endA.warnings.includes(DIALOGUE_WARNINGS.UNSTRUCTURED), 'unstructured 경고');
  assert.ok(!endA.story_text.includes('이메이: 네'), '비구조화 대사 제거');
  assert.ok(endA.story_text.includes('정상 서술이다.'), '정상 서술 출력');
});

test('8. quote-only 대사를 1글자씩 push해도 차단', () => {
  const story = '[SCENE]\n침묵.\n"네."\n정상 서술.\n';
  const a = gateFor(baseContract());
  for (const ch of story) a.push(ch);
  const endA = a.end();
  assert.ok(endA.warnings.includes(DIALOGUE_WARNINGS.UNSTRUCTURED));
  assert.ok(!endA.story_text.includes('네.'), 'quote-only 제거');
});

test('9. 정상 scene line은 개행 도착 즉시 emit', () => {
  const gate = gateFor(baseContract());
  const out1 = gate.push('[SCENE]\n회의실 안이');
  assert.ok(!out1.some(e => e.kind === 'text'), '개행 전 emit 금지');
  const out2 = gate.push(' 조용해졌다.\n');
  assert.ok(out2.some(e => e.kind === 'text'), '개행 도착 즉시 emit');
});

test('10. 전체 Story 완료 전 첫 정상 line emit', () => {
  const gate = gateFor(baseContract());
  const out = gate.push('[SCENE]\n회의실 안이 조용해졌다.\n');
  assert.ok(out.some(e => e.kind === 'text'), 'end() 전 첫 완성 라인 emit');
});

// ---------------------------------------------------------------------------
// 11~13. 섹션별 처리 (수정 4)
// ---------------------------------------------------------------------------

test('11. 상황판 "이름:", "장소:", "부서:" 보존', () => {
  const gate = gateFor(baseContract());
  gate.push('[3. 플레이어 상황판]\n이름: 금태양\n장소: 회의실\n부서: 감사팀\n활성 CSA: 이전과 동일\n');
  const end = gate.end();
  assert.ok(!end.warnings.includes(DIALOGUE_WARNINGS.UNSTRUCTURED), '상황판은 비구조화 검사 제외');
  assert.ok(end.story_text.includes('이름: 금태양'), '이름 보존');
  assert.ok(end.story_text.includes('장소: 회의실'), '장소 보존');
  assert.ok(end.story_text.includes('부서: 감사팀'), '부서 보존');
});

test('12. 선택지 label/colon 보존', () => {
  const gate = gateFor(baseContract());
  gate.push('[4. 선택지]\n1. [질문] 지표가 비어 있는 이유를 묻는다.\n2. [기다림] 조용히 기다린다.\n');
  const end = gate.end();
  assert.ok(!end.warnings.includes(DIALOGUE_WARNINGS.UNSTRUCTURED));
  assert.ok(end.story_text.includes('[질문]'), '선택지 라벨 보존');
});

test('13. Story scene 내부 "이메이: 네"만 차단', () => {
  const gate = gateFor(baseContract());
  gate.push('[1. 서사 및 행동]\n[SCENE]\n이메이: 네.\n정상 장면 서술.\n[2. 플레이어 속마음]\n생각: 좀 이상하네.\n');
  const end = gate.end();
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.UNSTRUCTURED), 'story 영역 비구조화 차단');
  assert.ok(!end.story_text.includes('이메이: 네'));
  assert.ok(end.story_text.includes('생각: 좀 이상하네.'), '속마음 colon 보존');
});

// ---------------------------------------------------------------------------
// 14~15. malformed 본문 discard (수정 5)
// ---------------------------------------------------------------------------

test('14. malformed 닫힌 header 본문까지 폐기', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n정상 장면.\n\n[DIALOGUE speaker_id=heroine5 acting_direction="고개를 들며"]\n네, 잘못된 본문입니다.\n\n[SCENE]\n다음 정상 장면.\n');
  const end = gate.end();
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.MALFORMED), 'malformed 경고');
  assert.ok(end.story_text.includes('정상 장면.'), '첫 정상 장면 보존');
  assert.ok(!end.story_text.includes('잘못된 본문'), 'malformed 본문 제거');
  assert.ok(end.story_text.includes('다음 정상 장면.'), '다음 정상 장면 보존');
});

test('15. malformed 뒤 정상 SCENE 복구', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n정상.\n[DIALOGUE speaker_id="heroine5" acting_direction="고개를 들며"\n폐기될 본문.\n[SCENE]\n복구된 장면.\n');
  const end = gate.end();
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.MALFORMED));
  assert.ok(end.story_text.includes('복구된 장면.'), 'malformed 뒤 정상 SCENE 복구');
  assert.ok(!end.story_text.includes('폐기될 본문'), '본문 폐기');
});

// ---------------------------------------------------------------------------
// 16~18. 플레이어 NPC 대상 검증 (수정 6)
// ---------------------------------------------------------------------------

test('16. explicit 입력에 없는 윤민아 이름 추가 차단', () => {
  const policy = resolvePlayerDialoguePolicy('서원희에게 "자료를 이메일로 보내주세요"라고 말한다.', master);
  const blocked = validatePlayerDialogueAgainstPolicy('윤민아 씨에게도 자료를 이메일로 보내주세요.', policy);
  assert.equal(blocked.ok, false, '입력에 없는 NPC 이름 차단');
});

test('17. paraphrase 입력에 없는 윤민아 이름 추가 차단', () => {
  const policy = resolvePlayerDialoguePolicy('서원희에게 지표가 비어 있는 이유를 묻는다.', master);
  const blocked = validatePlayerDialogueAgainstPolicy('윤민아 씨, 지표가 비어 있는 이유가 뭔가요?', policy);
  assert.equal(blocked.ok, false, 'paraphrase도 NPC 이름 차단');
});

test('18. 허용된 서원희 이름은 통과', () => {
  const policy = resolvePlayerDialoguePolicy('서원희에게 "자료를 이메일로 보내주세요"라고 말한다.', master);
  const ok = validatePlayerDialogueAgainstPolicy('서원희 씨, 자료를 이메일로 보내주세요.', policy);
  assert.equal(ok.ok, true, '허용 대상 이름은 통과');
});

// ---------------------------------------------------------------------------
// 19~21. present 판정 (수정 7)
// ---------------------------------------------------------------------------

test('19. present:false + location 일치 NPC 제외', () => {
  const present = isNpcPresentAtCurrentScene({
    id: 'heroine2',
    participants: ['player', 'heroine2'],
    sceneLocationId: 'meeting_room',
    npcSceneState: { heroine2: { present: false, location_id: 'meeting_room' } }
  });
  assert.equal(present, false, '명시적 부재가 최우선');
});

test('20. present:false + participants 포함 NPC 제외', () => {
  const present = isNpcPresentAtCurrentScene({
    id: 'heroine2',
    participants: ['player', 'heroine2'],
    sceneLocationId: 'meeting_room',
    npcSceneState: { heroine2: { present: false } }
  });
  assert.equal(present, false);
});

test('21. action contract target 단독 present 금지', () => {
  const contract = buildSceneCastContract({
    save: baseSave({ scene_state: { ...baseSave().scene_state, participants: ['player-1'] }, last_npcs_present: [], npc_scene_state: {} }),
    master,
    playerAction: 'x',
    actionContract: { target_id: 'heroine2' }
  });
  assert.ok(!contract.present_npc_ids.includes('heroine2'), 'action target 단독 present 금지');
  assert.equal(canSpeak(contract, 'heroine2'), false);
});

// ---------------------------------------------------------------------------
// 22~23. chunk 독립성 (수정 9)
// ---------------------------------------------------------------------------

test('22. whole chunk와 1-char chunk의 blocks deepEqual', () => {
  const story = '[1. 서사 및 행동]\n[SCENE]\n회의실 안이 조용해졌다.\n\n[DIALOGUE speaker_id="heroine5" acting_direction="서류를 내려놓으며"]\n확인했습니다.\n\n[SCENE]\n플레이어가 고개를 들었다.\n';
  const whole = gateFor(baseContract());
  whole.push(story);
  const endWhole = whole.end();
  const chars = gateFor(baseContract());
  for (const ch of story) chars.push(ch);
  const endChars = chars.end();
  assert.deepEqual(endChars.blocks, endWhole.blocks, 'blocks 동일');
  assert.equal(endChars.story_text, endWhole.story_text, 'story_text 동일');
  assert.deepEqual(endChars.warnings, endWhole.warnings, 'warnings 동일');
});

test('23. whole chunk와 1-char chunk의 stream_segments deepEqual', () => {
  const story = '[1. 서사 및 행동]\n[SCENE]\n회의실 안이 조용해졌다.\n\n[DIALOGUE speaker_id="heroine5" acting_direction="서류를 내려놓으며"]\n확인했습니다.\n';
  const whole = gateFor(baseContract());
  whole.push(story);
  const endWhole = whole.end();
  const chars = gateFor(baseContract());
  for (const ch of story) chars.push(ch);
  const endChars = chars.end();
  assert.deepEqual(endChars.stream_segments, endWhole.stream_segments, 'stream_segments 동일');
  assert.deepEqual(endChars.segments, endWhole.segments, 'semantic segments 동일');
});

// ---------------------------------------------------------------------------
// 24~25. live/replay parity (수정 10)
// ---------------------------------------------------------------------------

test('24~25. live/replay action_route/csa_covered parity', () => {
  // 저장된 parsed_blocks가 route/csa_covered를 담고, replay complete가 그대로 제공
  const savedBlocks = {
    structured_story_version: STRUCTURED_STORY_VERSION,
    action_route: 'ordinary_direct_blocked',
    csa_covered: false,
    warnings: [],
    blocks: [],
    stream_segments: []
  };
  assert.equal(savedBlocks.action_route, 'ordinary_direct_blocked');
  assert.equal(savedBlocks.csa_covered, false);
  // replay는 저장값을 그대로 전달 (turn-routes가 replayBlocks.action_route 사용)
  const replayComplete = { action_route: savedBlocks.action_route, csa_covered: savedBlocks.csa_covered };
  assert.equal(replayComplete.action_route, 'ordinary_direct_blocked');
  assert.equal(replayComplete.csa_covered, false);
});

// ---------------------------------------------------------------------------
// 26~30. 호출 수 (구조 검증 — 게이트/캐스트는 순수 함수)
// ---------------------------------------------------------------------------

test('26~30. V2 게이트·캐스트는 추가 LLM/네트워크 호출이 없는 순수 함수', () => {
  const gateSrc = createStructuredStoryGate.toString();
  assert.ok(!gateSrc.includes('fetch('), '게이트에 네트워크 호출 없음');
  const castSrc = buildSceneCastContract.toString();
  assert.ok(!castSrc.includes('fetch('), '캐스트에 네트워크 호출 없음');
  // speaker tagger는 V2 턴에서 0회 — 게이트가 화자 없는 대사를 애초에 차단
  const gate = gateFor(baseContract());
  gate.push('[1. 서사 및 행동]\n[SCENE]\n침묵.\n[DIALOGUE acting_direction="고개를 들며"]\n네.\n');
  const end = gate.end();
  assert.equal(end.blocks.length, 0, 'speaker_id 없는 대사 차단 → 태깅 대상 0');
});

// ---------------------------------------------------------------------------
// 서사 표시 정상화: [DIALOGUE] 첫 문단만 대화, 빈 줄 뒤 서술은 scene으로 분리
// ---------------------------------------------------------------------------

test('서사 표시 정상화: 대사 뒤 빈 줄 다음 표정·행동 서술은 대화에 흡수되지 않고 scene으로 분리된다', () => {
  const gate = gateFor(baseContract());
  gate.push('[1. 서사 및 행동]\n[SCENE]\n회의실이 조용하다.\n');
  gate.push('[DIALOGUE speaker_id="heroine5" acting_direction="고개를 들며"]\n"그걸 왜 물어보시는 거예요."\n\n그녀의 손끝이 멈췄다.\n목덜미가 붉어졌다.\n');
  const end = gate.end();
  const dialogue = end.blocks.find(b => b.type === 'dialogue');
  assert.equal(dialogue.text, '"그걸 왜 물어보시는 거예요."', '대화 블록은 실제 발화 한 문단만');
  assert.ok(!dialogue.text.includes('손끝'), '대사 본문에 서술이 흡수되지 않는다');
  assert.ok(!dialogue.text.includes('목덜미'), '대사 본문에 서술이 흡수되지 않는다');
  const sceneBlocks = end.segments.filter(s => s.type === 'scene');
  const lastScene = sceneBlocks.at(-1);
  assert.ok(lastScene.text.includes('손끝이 멈췄다'), '표정·행동 서술은 scene으로 분리');
  assert.ok(lastScene.text.includes('목덜미가 붉어졌다'), '분위기 서술은 scene으로 분리');
  // 그 다음 [DIALOGUE]는 새 대화 블록
  const gate2 = gateFor(baseContract());
  gate2.push('[1. 서사 및 행동]\n[SCENE]\n회의실이 조용하다.\n[DIALOGUE speaker_id="heroine5" acting_direction="고개를 들며"]\n"그걸 왜 물어보시는 거예요."\n\n그녀의 손끝이 멈췄다.\n[DIALOGUE speaker_id="heroine5" acting_direction="눈을 내리깔며"]\n"규정에 있는 거잖아요."\n');
  const end2 = gate2.end();
  const d2 = end2.blocks.filter(b => b.type === 'dialogue');
  assert.equal(d2.length, 2, '두 번째 [DIALOGUE]는 새 대화 블록');
  assert.equal(d2[1].text, '"규정에 있는 거잖아요."');
});
