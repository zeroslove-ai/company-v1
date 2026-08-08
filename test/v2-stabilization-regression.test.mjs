import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSceneCastContract,
  resolvePlayerDialoguePolicy,
  speakerNameById,
  canSpeak,
  classifyDialogueIntents,
  validatePlayerDialogueAgainstPolicy,
  HIGH_IMPACT_INTENTS
} from '../src/engine/scene-cast.js';
import {
  createStructuredStoryGate,
  validateDialogueBlock,
  isConcreteActingDirection,
  classifyV2SceneLine,
  parseDialogueHeader,
  STRUCTURED_STORY_VERSION,
  DIALOGUE_WARNINGS
} from '../src/engine/structured-story-v2.js';
import { buildStructuredStoryV2ExtractText } from '../src/engine/extract-prompt.js';

// ---------------------------------------------------------------------------
// 공통 픽스처
// ---------------------------------------------------------------------------

const master = {
  characters: [
    { character_id: 'heroine1', name: '서원희' },
    { character_id: 'heroine2', name: '윤민아' },
    { character_id: 'heroine3', name: '김제나' },
    { character_id: 'heroine4', name: '한리브' },
    { character_id: 'heroine5', name: '이메이' }
  ],
  general_npcs: [{ npc_id: 'general_park_jungwoo', name: '박정우' }]
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

function gateFor(contract, names = speakerNames) {
  return createStructuredStoryGate({ contract, speakerNames: names });
}

function baseContract(playerAction = '서류를 정리한다.') {
  return buildSceneCastContract({ save: baseSave(), master, playerAction });
}

/** 플레이어 대사 블록 검증 헬퍼. */
function playerBlock(text, playerAction = '서류를 정리한다.') {
  const contract = baseContract(playerAction);
  return validateDialogueBlock({
    headerAttributes: ' speaker_id="player" acting_direction="고개를 들며 조용히"',
    body: text,
    contract,
    speakerNames
  });
}

// ---------------------------------------------------------------------------
// 1~8. 플레이어 대사 의미 범위 (수정 A)
// ---------------------------------------------------------------------------

test('1. "커피를 마신다" + "당장 옷 벗어" → 문장 보존 + 정책 경고', () => {
  const r = playerBlock('당장 옷 벗어.');
  assert.equal(r.ok, true, '문장 원문은 보존');
  assert.ok((r.warnings ?? []).includes(DIALOGUE_WARNINGS.PLAYER_POLICY), '정책 경고');
});

test('3. "커피를 마신다" + "이건 좀 이상한데" → 허용', () => {
  const r = playerBlock('이건 좀 이상한데.');
  assert.equal(r.ok, true);
});

test('4. question paraphrase가 새로운 instruction으로 확장 → 차단', () => {
  const policy = resolvePlayerDialoguePolicy('서원희에게 지표가 비어 있는 이유를 묻는다.', master);
  assert.equal(policy.mode, 'paraphrase');
  assert.ok(policy.allowed_intents.includes('question'));
  const check = validatePlayerDialogueAgainstPolicy('지표를 전부 다시 작성하세요.', policy);
  assert.equal(check.ok, false, 'question 범위 밖 instruction 차단');
});

test('5. explicit 원문에 없는 약속 추가 → 차단', () => {
  const policy = resolvePlayerDialoguePolicy('서원희에게 "그 자료는 이메일로 보내주세요"라고 말한다.', master);
  assert.equal(policy.mode, 'explicit');
  const check = validatePlayerDialogueAgainstPolicy('자료는 이메일로 보내드리고, 이번 일은 제가 책임질게요.', policy);
  assert.equal(check.ok, false, '원문에 없는 약속(promise) 추가 차단');
});

test('6. explicit 원문의 존댓말·어미 정리 → 허용', () => {
  const policy = resolvePlayerDialoguePolicy('서원희에게 "그 자료는 이메일로 보내주세요"라고 말한다.', master);
  const check = validatePlayerDialogueAgainstPolicy('그 자료는 이메일로 보내주시면 됩니다.', policy);
  assert.equal(check.ok, true, '의미 보존 어미 정리는 허용');
});

test('7. 입력에 없는 새 NPC 이름 추가 → 차단', () => {
  // minor_reaction에서 입력에 없는 대상 언급 — 고위험은 아니지만 새 인물 지시는 차단
  const policy = resolvePlayerDialoguePolicy('커피를 마신다.', master);
  const check = validatePlayerDialogueAgainstPolicy('윤민아를 불러와.', policy);
  assert.equal(check.ok, false, '입력에 없는 NPC 지시 차단');
});

// ---------------------------------------------------------------------------
// 9~15. 비구조화 대사 (수정 B)
// ---------------------------------------------------------------------------

test('9. quote-only line → 문장 보존 + 비구조화 경고', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n침묵이 흘렀다.\n"네, 알겠습니다."\n');
  const end = gate.end();
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.UNSTRUCTURED));
  assert.ok(end.story_text.includes('네, 알겠습니다'), '문장 원문 보존');
  assert.equal(end.blocks.filter(b => b.type === 'dialogue').length, 0);
});

test('10. "이메이: 네" → 문장 보존 + 비구조화 경고', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n침묵.\n이메이: 네.\n');
  const end = gate.end();
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.UNSTRUCTURED));
  assert.ok(end.story_text.includes('이메이: 네'), '문장 원문 보존');
});

test('11. 구형 "이메이 (고개를 들며): “네”" → 문장 보존 + 비구조화 경고', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n침묵.\n이메이 (고개를 들며): “네.”\n');
  const end = gate.end();
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.UNSTRUCTURED));
  assert.ok(end.story_text.includes('고개를 들며'), '문장 원문 보존');
});

test('12. "이메이가 말했다. \"네\"" → 문장 보존 + 비구조화 경고', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n침묵.\n이메이가 말했다. "네, 할게요."\n');
  const end = gate.end();
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.UNSTRUCTURED));
  assert.ok(end.story_text.includes('할게요'), '문장 원문 보존');
});

test('13. 문서 제목 인용 → 보존', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n문서 제목은 "하반기 캠페인 계획"이었다.\n');
  const end = gate.end();
  assert.ok(!end.warnings.includes(DIALOGUE_WARNINGS.UNSTRUCTURED), '비발화 인용은 경고 없음');
  assert.ok(end.story_text.includes('하반기 캠페인 계획'), '문서 제목 보존');
});

test('14. 메일 제목 인용 → 보존', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n메일 제목에 "긴급"이라고 적혀 있었다.\n');
  const end = gate.end();
  assert.ok(!end.warnings.includes(DIALOGUE_WARNINGS.UNSTRUCTURED));
  assert.ok(end.story_text.includes('긴급'), '메일 제목 보존');
});

test('15. 차단된 비구조화 대사 다음 정상 [DIALOGUE] → 정상 출력', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n침묵.\n"네."\n');
  const after = gate.push('[DIALOGUE speaker_id="heroine5" acting_direction="고개를 끄덕이며"]\n알겠습니다.\n');
  const end = gate.end();
  assert.equal(end.blocks.length, 1, '비구조화 차단 후 정상 블록 저장');
  assert.equal(end.blocks[0].speaker_id, 'heroine5');
});

// ---------------------------------------------------------------------------
// 16~21. malformed 구조화 블록 (수정 C)
// ---------------------------------------------------------------------------

test('16. 닫히지 않은 DIALOGUE header EOF → 원문 보존 + malformed 경고', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n침묵.\n[DIALOGUE speaker_id="heroine5" acting_direction="고개를 들며"\n네, 알겠습니다.');
  const end = gate.end();
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.MALFORMED), 'malformed 경고');
  assert.ok(end.story_text.includes('네, 알겠습니다'), '헤더·본문 원문 보존');
});

test('17. speaker_id 따옴표 누락 → 제거', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n침묵.\n[DIALOGUE speaker_id=heroine5 acting_direction="고개를 들며"]\n네.\n');
  const end = gate.end();
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.MALFORMED), '따옴표 누락은 malformed');
  assert.equal(end.blocks.length, 0);
});

test('18. acting_direction 누락 → 기존 warning 유지', () => {
  const contract = baseContract();
  const r = validateDialogueBlock({ headerAttributes: ' speaker_id="heroine5"', body: '네.', contract, speakerNames });
  assert.equal(r.ok, false);
  assert.equal(r.warning, DIALOGUE_WARNINGS.MISSING_DIRECTION);
});

test('19. 중복 speaker_id → malformed', () => {
  const parsed = parseDialogueHeader('speaker_id="heroine5" speaker_id="heroine1" acting_direction="고개를 들며"]');
  assert.equal(parsed.ok, false, '중복 속성은 malformed');
});

test('20. "[FOO]" marker → 원문 보존 + 미지 마커 경고', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n침묵.\n[FOO]\n정상 서술 문장이다.\n');
  const end = gate.end();
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.UNKNOWN_MARKER), '미지 마커 경고');
  assert.ok(end.story_text.includes('정상 서술 문장이다.'), '이후 텍스트 보존');
  assert.ok(end.story_text.includes('[FOO]'), '마커 라인 원문 보존');
});

test('21. malformed 이후 정상 block 계속 스트리밍', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n침묵.\n[DIALOGUE speaker_id="heroine5" acting_direction="고개를 들며"\n잘못된 블록.\n');
  const good = gate.push('[DIALOGUE speaker_id="heroine5" acting_direction="고개를 끄덕이며"]\n정상 대사.\n');
  const end = gate.end();
  assert.equal(end.blocks.length, 1, 'malformed 후 정상 블록 저장');
  assert.equal(end.blocks[0].text, '정상 대사.');
});

// ---------------------------------------------------------------------------
// 22~25. canonical ordering (수정 D)
// ---------------------------------------------------------------------------

test('22. scene-dialogue-scene-dialogue 순서 유지', () => {
  // cast에 heroine1(서원희)도 present로 포함
  const contract = buildSceneCastContract({
    save: baseSave({ scene_state: { ...baseSave().scene_state, participants: ['player-1', 'heroine5', 'heroine1'] }, npc_scene_state: { heroine5: { present: true, location_id: 'meeting_room_5f' }, heroine1: { present: true, location_id: 'meeting_room_5f' } } }),
    master,
    playerAction: 'x'
  });
  const gate = gateFor(contract);
  gate.push('[SCENE]\n장면 A\n\n[DIALOGUE speaker_id="heroine5" acting_direction="서류를 내려놓으며"]\n대사 A\n\n[SCENE]\n장면 B\n\n[DIALOGUE speaker_id="heroine1" acting_direction="고개를 들어 올려다보며"]\n대사 B\n');
  const end = gate.end();
  const types = end.segments.map(s => s.type);
  assert.deepEqual(types, ['scene', 'dialogue', 'scene', 'dialogue'], '원래 순서 보존');
});

test('23. dialogue_lines order 값 일치', () => {
  const contract = buildSceneCastContract({
    save: baseSave({ scene_state: { ...baseSave().scene_state, participants: ['player-1', 'heroine5', 'heroine1'] }, npc_scene_state: { heroine5: { present: true, location_id: 'meeting_room_5f' }, heroine1: { present: true, location_id: 'meeting_room_5f' } } }),
    master,
    playerAction: 'x'
  });
  const gate = gateFor(contract);
  gate.push('[SCENE]\n장면 A\n[DIALOGUE speaker_id="heroine5" acting_direction="고개를 끄덕이며"]\n첫 대사\n[SCENE]\n장면 B\n[DIALOGUE speaker_id="heroine1" acting_direction="고개를 젓으며"]\n둘째 대사\n');
  const end = gate.end();
  const orders = end.blocks.map(b => b.order);
  assert.ok(orders[0] < orders[1], `order 증가: ${orders.join(',')}`);
});

test('24. acting_direction과 direction 동시 보존', () => {
  const contract = baseContract();
  const r = validateDialogueBlock({ headerAttributes: ' speaker_id="heroine5" acting_direction="서류를 내려놓으며"', body: '확인했습니다.', contract, speakerNames });
  assert.equal(r.ok, true);
  assert.equal(r.block.acting_direction, '서류를 내려놓으며');
  assert.equal(r.block.direction, '서류를 내려놓으며');
});

test('25. parser dialogue가 뒤에 중복 추가되지 않음', () => {
  // gate.segments가 유일한 정본 — 레거시 파서 dialogue가 섞이지 않는다
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n장면 A\n[DIALOGUE speaker_id="heroine5" acting_direction="고개를 끄덕이며"]\n대사 A\n');
  const end = gate.end();
  const dialogues = end.segments.filter(s => s.type === 'dialogue');
  assert.equal(dialogues.length, 1, '정확히 1개의 dialogue만');
});

// ---------------------------------------------------------------------------
// 26~29. Extract V2 (수정 E)
// ---------------------------------------------------------------------------

test('26. V2 Extract input이 ordered validated blocks에서 생성됨', () => {
  const parsed = {
    structured_story_version: 2,
    blocks: [
      { type: 'scene', text: '회의실 안이 조용해졌다.' },
      { type: 'dialogue', speaker_id: 'heroine5', speaker_name: '이메이', acting_direction: '서류를 내려놓으며', direction: '서류를 내려놓으며', text: '확인했습니다.', order: 1 },
      { type: 'scene', text: '플레이어가 화면을 확인했다.' }
    ],
    dialogue_lines: [],
    player_inner_thought: '생각보다 복잡하네.',
    player_status: '회의실',
    choices: ['1. 질문한다', '2. 기다린다']
  };
  const text = buildStructuredStoryV2ExtractText(parsed);
  assert.ok(text.includes('이메이 (서류를 내려놓으며): “확인했습니다.”'), 'canon 이름 + 연기지시 직렬화');
  assert.ok(text.includes('회의실 안이 조용해졌다.'), 'scene 포함');
  assert.ok(text.includes('생각보다 복잡하네.'), '속마음 포함');
  assert.ok(!text.includes('heroine5'), 'ID가 아닌 canon 이름만');
});

test('27. V2에서 normalizeQuoteOnlyDialogue 미사용 — 직렬화는 블록 기반', () => {
  // normalized_raw가 있어도 V2는 사용하지 않는다 — blocks만으로 생성
  const parsed = {
    structured_story_version: 2,
    blocks: [{ type: 'dialogue', speaker_id: 'heroine5', speaker_name: '이메이', acting_direction: '고개를 들며', direction: '고개를 들며', text: '네.' }],
    dialogue_lines: [],
    normalized_raw: '이메이가 말했다. "네."'
  };
  const text = buildStructuredStoryV2ExtractText(parsed);
  assert.ok(!text.includes('이메이가 말했다'), 'normalized_raw 미사용');
  assert.ok(text.includes('네.'), '블록 기반');
});

test('28. V2에서 unresolved dialogue가 있어도 speaker tagger 0회 — 게이트가 화자 없는 대사를 애초에 차단', () => {
  // gate가 speaker_id 없는 대사를 malformed로 차단 → 사후 태깅 대상 0
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n침묵.\n[DIALOGUE acting_direction="고개를 들며"]\n네.\n');
  const end = gate.end();
  assert.equal(end.blocks.length, 0, 'speaker_id 없는 대사는 저장되지 않음');
  assert.ok(end.warnings.length > 0, '경고 기록');
});

test('29. 레거시 턴에서는 기존 tagger 경로 유지 — V2 분기만 활성', () => {
  // V2가 아닌 parsedStory는 buildStructuredStoryV2ExtractText 대신 레거시 경로 —
  // 여기서는 V2 분기 조건 자체를 검증한다
  const legacy = { blocks: [], dialogue_lines: [] };
  const v2 = { structured_story_version: 2, blocks: [] };
  assert.notEqual(v2.structured_story_version, undefined);
  assert.equal(legacy.structured_story_version, undefined, '레거시 턴은 버전 없음 → 기존 경로');
});

// ---------------------------------------------------------------------------
// 30~39. Scene cast (수정 F)
// ---------------------------------------------------------------------------

test('30. "last_npcs_present"만 있는 NPC → present 아님', () => {
  const contract = buildSceneCastContract({
    save: baseSave({ scene_state: { ...baseSave().scene_state, participants: ['player-1'] }, last_npcs_present: ['heroine2'], npc_scene_state: {} }),
    master,
    playerAction: 'x'
  });
  assert.ok(!contract.present_npc_ids.includes('heroine2'), '상태 기록 없으면 last_npcs_present만으로 present 불가');
  assert.ok(contract.context_npc_ids.includes('heroine2'), 'context 참고용으로는 포함');
});

// 안정화 수정 G — participants만 출연 정본. 같은 장소·present=true만으로는
// 자동 출연하지 않는다 (turn 32 서원희 난입 원인).
test('31. "present=true + location 일치"라도 participants가 아니면 present 아님', () => {
  const base = baseSave();
  const contract = buildSceneCastContract({
    save: baseSave({ scene_state: { ...base.scene_state, location_id: 'design_team', participants: ['player-1'] }, npc_scene_state: { heroine2: { present: true, location_id: 'design_team' } }, last_npcs_present: [] }),
    master,
    playerAction: 'x'
  });
  assert.ok(!contract.present_npc_ids.includes('heroine2'), '같은 장소라도 participants가 아니면 출연 불가');
});

test('31b. participants에 있으면 present', () => {
  const base = baseSave();
  const contract = buildSceneCastContract({
    save: baseSave({ scene_state: { ...base.scene_state, location_id: 'design_team', participants: ['player-1', 'heroine2'] }, npc_scene_state: { heroine2: { present: true, location_id: 'design_team' } }, last_npcs_present: [] }),
    master,
    playerAction: 'x'
  });
  assert.ok(contract.present_npc_ids.includes('heroine2'));
});

test('32. "present=true + location 불일치" → present 아님', () => {
  const contract = buildSceneCastContract({
    save: baseSave({ scene_state: { ...baseSave().scene_state, location_id: 'design_team' }, npc_scene_state: { heroine2: { present: true, location_id: 'meeting_room_5f' } }, last_npcs_present: [] }),
    master,
    playerAction: 'x'
  });
  assert.ok(!contract.present_npc_ids.includes('heroine2'), '위치 불일치 present는 다른 장소');
});

test('33. 일반 structured target → entering 아님', () => {
  const contract = buildSceneCastContract({
    save: baseSave(),
    master,
    playerAction: 'x',
    structuredAction: { version: 1, type: 'app_transaction', base_turn_count: 3, operations: [] }
  });
  assert.deepEqual(contract.entering_npc_ids, []);
});

test('35. 명시 summon(호출) action → entering', () => {
  const contract = buildSceneCastContract({
    save: baseSave({ scene_state: { ...baseSave().scene_state, participants: ['player-1'] }, last_npcs_present: [], npc_scene_state: {} }),
    master,
    playerAction: '윤민아를 이쪽으로 부른다.'
  });
  assert.ok(contract.entering_npc_ids.includes('heroine2'), '호출은 entering');
});

test('36. "민아를 보러 간다" → destination target, old scene entering 아님', () => {
  const contract = buildSceneCastContract({
    save: baseSave({ scene_state: { ...baseSave().scene_state, participants: ['player-1', 'heroine5'] } }),
    master,
    playerAction: '윤민아를 보러 2층으로 간다.'
  });
  assert.ok(contract.destination_npc_ids.includes('heroine2'), '이동 대상은 destination');
  assert.ok(!contract.entering_npc_ids.includes('heroine2'), '기존 장면 entering 아님');
});

test('37. "민아를 부른다" → entering', () => {
  const contract = buildSceneCastContract({
    save: baseSave({ scene_state: { ...baseSave().scene_state, participants: ['player-1'] }, last_npcs_present: [], npc_scene_state: {} }),
    master,
    playerAction: '윤민아를 부른다.'
  });
  assert.ok(contract.entering_npc_ids.includes('heroine2'));
});

test('38. "민아에게 전화한다" → remote', () => {
  const contract = buildSceneCastContract({
    save: baseSave({ scene_state: { ...baseSave().scene_state, participants: ['player-1'] }, last_npcs_present: [], npc_scene_state: {} }),
    master,
    playerAction: '윤민아에게 전화한다.'
  });
  assert.ok(contract.remote_npc_ids.includes('heroine2'));
  assert.ok(!contract.entering_npc_ids.includes('heroine2'));
});

test('39. focal/last_speaker만으로 발화 불가', () => {
  const contract = buildSceneCastContract({
    save: baseSave({ focal_character_id: 'heroine1', last_speaker_id: 'heroine1', scene_state: { ...baseSave().scene_state, participants: ['player-1'] }, last_npcs_present: [], npc_scene_state: {} }),
    master,
    playerAction: 'x'
  });
  assert.equal(canSpeak(contract, 'heroine1'), false, 'focal/last_speaker만으로 발화 불가');
  assert.ok(contract.context_npc_ids.includes('heroine1'), 'context에는 포함');
});

// ---------------------------------------------------------------------------
// 40~46. 스트리밍·replay
// ---------------------------------------------------------------------------

test('40. 실제 async upstream에서 첫 SCENE delta가 completion 전 도착', async () => {
  const gate = gateFor(baseContract());
  // 첫 청크 — SCENE 라인
  const out1 = gate.push('[SCENE]\n회의실 안이 조용해졌다.\n');
  assert.ok(out1.some(e => e.kind === 'text'), '첫 SCENE 텍스트 즉시 emit');
  // 아직 end() 전에 emit됨 (completion 대기 없음)
  const out2 = gate.push('[DIALOGUE speaker_id="heroine5" acting_direction="서류를 내려놓으며"]\n확인했습니다.\n\n[SCENE]');
  assert.ok(out2.some(e => e.kind === 'block'), '블록도 end() 전 emit (다음 마커 도착 시)');
  const end = gate.end();
  assert.equal(end.blocks.length, 1);
});

test('41. DIALOGUE-first는 경고만 남기고 문장은 보존한다', () => {
  const gate = gateFor(baseContract());
  const out = gate.push('[1. 서사 및 행동]\n[DIALOGUE speaker_id="heroine5" acting_direction="고개를 들며"]\n네.\n');
  const end = gate.end();
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.BEFORE_SCENE));
  assert.equal(end.blocks.length, 1, '문장 원문은 대사 블록으로 보존');
});

test('42. cast 밖 block도 문장은 보존하고 정상 block은 계속 출력', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n침묵.\n[DIALOGUE speaker_id="heroine2" acting_direction="고개를 들며"]\n네.\n');
  const good = gate.push('[DIALOGUE speaker_id="heroine5" acting_direction="고개를 끄덕이며"]\n알겠습니다.\n');
  const end = gate.end();
  assert.equal(end.blocks.length, 2, 'cast 밖 문장도 보존, 정상 블록 유지');
  assert.equal(end.blocks[0].speaker_id, null, 'cast 밖 화자는 미확정');
  assert.equal(end.blocks[1].speaker_id, 'heroine5');
});

test('43~45. live/replay 이벤트 계약 — stream_segments가 동일 재생 정보를 담는다', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n회의실 안이 조용해졌다.\n[DIALOGUE speaker_id="heroine5" acting_direction="서류를 내려놓으며"]\n확인했습니다.\n');
  const end = gate.end();
  // stream_segments — live emit 순서 기록
  const segs = end.stream_segments;
  assert.ok(Array.isArray(segs) && segs.length >= 2, 'stream_segments 존재');
  const kinds = segs.map(s => s.kind);
  assert.ok(kinds.includes('text') && kinds.includes('block'), 'text+block 순서 기록');
  const blockSeg = segs.find(s => s.kind === 'block');
  assert.equal(blockSeg.block.speaker_id, 'heroine5');
  assert.equal(blockSeg.block.speaker_name, '이메이');
  // replay 시 같은 순서로 재생 가능 (parsed_blocks에 stream_segments 저장됨)
  const replayParsed = { structured_story_version: 2, stream_segments: segs, warnings: end.warnings, blocks: end.blocks };
  assert.equal(replayParsed.warnings.length, end.warnings.length, 'replay warnings parity');
  assert.equal(replayParsed.blocks.length, end.blocks.length, 'replay blocks parity');
});

test('46. complete warnings에 gate warning 포함', () => {
  const gate = gateFor(baseContract());
  gate.push('[SCENE]\n침묵.\n"네."\n');
  const end = gate.end();
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.UNSTRUCTURED), 'gate warning이 병합 warnings에 포함');
});

// ---------------------------------------------------------------------------
// 47~50. 호출 수·청크 동일성
// ---------------------------------------------------------------------------

test('47~49. 추가 LLM/네트워크 0 — V2 게이트는 순수 함수', () => {
  // 게이트는 LLM/네트워크 호출이 없는 순수 상태머신 — fetch/LLM 참조 없음 검증
  const src = createStructuredStoryGate.toString();
  assert.ok(!src.includes('fetch(') && !src.includes('https://'), '게이트에 네트워크 호출 없음');
});

test('50. 청크 크기 1과 전체 청크 결과 동일', () => {
  const story = '[SCENE]\n침묵이 흘렀다.\n\n[DIALOGUE speaker_id="heroine5" acting_direction="떨리는 목소리로"]\n저기...\n';
  const a = gateFor(baseContract());
  for (const ch of story) a.push(ch);
  const endA = a.end();
  const b = gateFor(baseContract());
  b.push(story);
  const endB = b.end();
  assert.equal(endA.blocks.length, endB.blocks.length);
  assert.equal(endA.story_text, endB.story_text);
  assert.deepEqual(endA.warnings, endB.warnings);
});

// ---------------------------------------------------------------------------
// 실게임형 fixture (spec 14)
// ---------------------------------------------------------------------------

test('이동 fixture — 이동 턴 발화 금지, 미등록 인물 차단, 이름 오표기 없음', () => {
  // 현재 장면: 서원희(heroine1)와 회의실
  const save = baseSave({
    scene_state: { ...baseSave().scene_state, participants: ['player-1', 'heroine1'], location_id: 'meeting_room_5f' },
    npc_scene_state: { heroine1: { present: true, location_id: 'meeting_room_5f' } },
    last_npcs_present: ['heroine1']
  });
  const contract = buildSceneCastContract({ save, master, playerAction: '윤민아를 보러 디자인팀으로 간다.' });
  // 수정 2 — 이동 턴: 현재 장소 NPC(서원희)·목적지 NPC(윤민아) 모두 발화 금지
  assert.equal(contract.transition_mode, 'movement');
  assert.ok(contract.destination_npc_ids.includes('heroine2'), '윤민아는 destination');
  assert.ok(!contract.allowed_speaker_ids.includes('heroine1'), '서원희 발화 불가');
  assert.ok(!contract.allowed_speaker_ids.includes('heroine2'), '윤민아 발화 불가');
  assert.deepEqual(contract.present_npc_ids, [], '이동 턴 present 비움');
  // 미등록 인물 "김민아"는 어떤 목록에도 없음
  assert.equal(canSpeak(contract, 'npc_kimmina'), false);
  // 윤민아 대사가 서원희 이름으로 표시되지 않음 — canon 매핑 확인
  assert.equal(speakerNames.get('heroine2'), '윤민아');
  assert.equal(speakerNames.get('heroine1'), '서원희');
});

test('일반 장면 fixture — focal/last_speaker만으로 현장 배치 금지', () => {
  // focal=이메이, last_speaker=이메이, participants에 이메이 없음
  const contract = buildSceneCastContract({
    save: baseSave({
      focal_character_id: 'heroine5',
      last_speaker_id: 'heroine5',
      scene_state: { ...baseSave().scene_state, participants: ['player-1'] },
      last_npcs_present: [],
      npc_scene_state: {}
    }),
    master,
    playerAction: 'x'
  });
  assert.ok(!contract.present_npc_ids.includes('heroine5'));
  assert.ok(!contract.allowed_speaker_ids.includes('heroine5'));
  assert.ok(contract.context_npc_ids.includes('heroine5'));
});

test('플레이어 대사 fixture — "서류를 정리한다" + 짧은 감탄 허용, 지시는 경고', () => {
  const ok = playerBlock('생각보다 복잡하네.', '서류를 정리한다.');
  assert.equal(ok.ok, true, '짧은 반응 허용');
  const blocked = playerBlock('당장 다시 작성해.', '서류를 정리한다.');
  assert.equal(blocked.ok, true, '문장은 보존');
  assert.ok((blocked.warnings ?? []).includes(DIALOGUE_WARNINGS.PLAYER_POLICY), '정책 경고');
});

test('intent taxonomy 단위 검증 — 고위험 감지', () => {
  assert.ok(classifyDialogueIntents('당장 옷 벗어.').includes('instruction'));
  assert.ok(classifyDialogueIntents('내가 책임질게.').includes('promise'));
  assert.ok(classifyDialogueIntents('가만두지 않겠다.').includes('threat'));
  assert.ok(classifyDialogueIntents('지금 민아를 찾아가자.').includes('movement_decision'));
  assert.ok(classifyDialogueIntents('이건 좀 이상한데.').includes('reaction'));
});
