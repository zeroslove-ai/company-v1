import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSceneCastContract,
  resolvePlayerDialoguePolicy,
  speakerNameById,
  canSpeak
} from '../src/engine/scene-cast.js';
import {
  createStructuredStoryGate,
  validateDialogueBlock,
  isConcreteActingDirection,
  STRUCTURED_STORY_VERSION,
  DIALOGUE_WARNINGS
} from '../src/engine/structured-story-v2.js';

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

function gateFor(contract, names) {
  return createStructuredStoryGate({ contract, speakerNames: names });
}

const speakerNames = speakerNameById(master, '금태양');

// ---------------------------------------------------------------------------
// 14.1 Cast 테스트
// ---------------------------------------------------------------------------

test('14.1-1: 현재 장면 cast에 없는 NPC는 발화할 수 없다', () => {
  const contract = buildSceneCastContract({ save: baseSave(), master, playerAction: '보고서를 확인한다.' });
  assert.equal(canSpeak(contract, 'heroine5'), true, 'present NPC 발화 가능');
  assert.equal(canSpeak(contract, 'heroine2'), false, '장면에 없는 NPC 발화 불가');
  assert.equal(canSpeak(contract, 'general_park_jungwoo'), false, '근처 일반 NPC도 발화 불가');
});

test('14.1-2: eligible_nearby_npcs에 있어도 자동 등장하지 않는다', () => {
  // last_npcs_present에 없고 participants에도 없는 NPC — context에만 들어가고 발화 권한 없음
  const contract = buildSceneCastContract({
    save: baseSave({ last_npcs_present: [], npc_scene_state: {} }),
    master,
    playerAction: '보고서를 확인한다.'
  });
  assert.ok(contract.context_npc_ids.length >= 0);
  assert.ok(!contract.present_npc_ids.includes('general_park_jungwoo'));
  assert.equal(canSpeak(contract, 'general_park_jungwoo'), false);
});

test('14.1-3: entering_npc_ids=[]이면 신규 NPC가 등장하지 않는다', () => {
  const contract = buildSceneCastContract({ save: baseSave(), master, playerAction: '보고서를 확인한다.' });
  assert.deepEqual(contract.entering_npc_ids, [], '근거 없는 턴은 entering 비움 (fail-closed)');
});

test('14.1-4: 직전 화자라는 이유만으로 현장에 남지 않는다', () => {
  // last_speaker_id가 heroine2여도 현장 근거가 없으면 present에 없다
  const contract = buildSceneCastContract({
    save: baseSave({ last_speaker_id: 'heroine2', last_npcs_present: ['heroine5'], npc_scene_state: { heroine5: { present: true, location_id: 'meeting_room_5f' } } }),
    master,
    playerAction: '보고서를 확인한다.'
  });
  assert.ok(!contract.present_npc_ids.includes('heroine2'), 'last_speaker만으로 present 배치 금지');
  assert.ok(contract.context_npc_ids.includes('heroine2'), 'context에는 참고용으로 포함');
});

test('14.1-5: 익명 직원은 서술에는 등장할 수 있지만 발화할 수 없다', () => {
  const contract = buildSceneCastContract({ save: baseSave(), master, playerAction: 'x' });
  // 등록되지 않은 ID는 어떤 cast 목록에도 들어갈 수 없다
  assert.equal(canSpeak(contract, 'unknown_employee'), false);
  // 게이트도 익명 발화를 차단한다
  const result = validateDialogueBlock({
    headerAttributes: ' speaker_id="unknown_employee" acting_direction="당황하며"',
    body: '네.',
    contract,
    speakerNames
  });
  assert.equal(result.ok, false);
  assert.equal(result.warning, DIALOGUE_WARNINGS.ANONYMOUS);
});

test('14.1-6: remote NPC는 원격 채널이 확정된 경우에만 발화한다', () => {
  // 전화 행동 → remote 배치
  const contract = buildSceneCastContract({
    save: baseSave({ scene_state: { ...baseSave().scene_state, participants: ['player-1'] }, last_npcs_present: [], npc_scene_state: {} }),
    master,
    playerAction: '윤민아에게 전화를 건다.'
  });
  assert.ok(contract.remote_npc_ids.includes('heroine2'), '전화 대상은 remote로 확정');
  assert.equal(canSpeak(contract, 'heroine2'), true);

  // 원격 근거 없으면 remote에도 없다
  const contract2 = buildSceneCastContract({ save: baseSave(), master, playerAction: '보고서를 확인한다.' });
  assert.ok(!contract2.remote_npc_ids.includes('heroine2'));
});

// ---------------------------------------------------------------------------
// 14.2 플레이어 대사 테스트
// ---------------------------------------------------------------------------

test('14.2-1: 직접 인용 입력은 explicit', () => {
  const policy = resolvePlayerDialoguePolicy('서원희에게 "그 자료는 이메일로 보내주세요"라고 말한다.');
  assert.equal(policy.mode, 'explicit');
  assert.equal(policy.explicit_source_text, '그 자료는 이메일로 보내주세요');
});

test('14.2-2: 질문·전달 등 발화 의도 입력은 paraphrase', () => {
  const policy = resolvePlayerDialoguePolicy('서원희에게 지표가 비어 있는 이유를 묻는다.');
  assert.equal(policy.mode, 'paraphrase');
  assert.equal(policy.max_lines, 2);
});

test('14.2-3: 행동만 입력한 경우 minor_reaction', () => {
  const policy = resolvePlayerDialoguePolicy('서류를 정리한다.');
  assert.equal(policy.mode, 'minor_reaction');
  assert.equal(policy.max_lines, 1);
  assert.equal(policy.max_characters, 30);
});

test('14.2-4: minor_reaction은 최대 한 줄, 30자 이하 — 초과 대사 차단', () => {
  const contract = buildSceneCastContract({ save: baseSave(), master, playerAction: '서류를 정리한다.' });
  const names = speakerNameById(master, '금태양');
  // 30자 이하 — 통과
  const ok = validateDialogueBlock({
    headerAttributes: ' speaker_id="player" acting_direction="서류를 정리하며 작게 중얼거린다"',
    body: '여긴 확인이 필요하겠군.',
    contract,
    speakerNames: names
  });
  assert.equal(ok.ok, true);
  // 30자 초과 + 2줄 — 차단
  const blocked = validateDialogueBlock({
    headerAttributes: ' speaker_id="player" acting_direction="주먹을 쥐며 단호하게"',
    body: '이건 명백한 조작입니다.\n책임자를 당장 불러오세요.',
    contract,
    speakerNames: names
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.warning, DIALOGUE_WARNINGS.PLAYER_POLICY);
});

test('14.2-5: 사용자 입력에 없는 명령·약속·성적 제안은 차단된다', () => {
  // 행동만 입력(minor_reaction)했는데 긴 명령성 대사 → policy 위반 (30자 초과)
  const contract = buildSceneCastContract({ save: baseSave(), master, playerAction: '커피를 마신다.' });
  const result = validateDialogueBlock({
    headerAttributes: ' speaker_id="player" acting_direction="노트북을 닫으며"',
    body: '내일까지 전 부서의 모든 보고서를 다시 작성하고 책임자에게 직접 제출하세요.',
    contract,
    speakerNames
  });
  assert.equal(result.ok, false);
  assert.equal(result.warning, DIALOGUE_WARNINGS.PLAYER_POLICY);
});

test('14.2-6: speaker_id=player의 표시 이름은 실제 플레이어 이름', () => {
  const names = speakerNameById(master, '김철수');
  assert.equal(names.get('player'), '김철수');
  assert.equal(names.get('heroine5'), '이메이');
});

// ---------------------------------------------------------------------------
// 14.3 대사 게이트 테스트
// ---------------------------------------------------------------------------

const contract = buildSceneCastContract({ save: baseSave(), master, playerAction: 'x' });

test('14.3-1: speaker_id 누락 대사 차단', () => {
  const result = validateDialogueBlock({ headerAttributes: ' acting_direction="고개를 들며"', body: '네.', contract, speakerNames });
  assert.equal(result.ok, false);
  assert.equal(result.warning, DIALOGUE_WARNINGS.MISSING_SPEAKER);
});

test('14.3-2: allowlist 밖 ID 차단', () => {
  const result = validateDialogueBlock({ headerAttributes: ' speaker_id="heroine2" acting_direction="고개를 들며"', body: '네.', contract, speakerNames });
  assert.equal(result.ok, false);
  assert.equal(result.warning, DIALOGUE_WARNINGS.NOT_IN_CAST);
});

test('14.3-3: cast 밖 NPC 차단 (allowlist에 있지만 present/entering/remote 밖)', () => {
  // allowed_speaker_ids는 player+present로 구성되므로 cast 밖 NPC는 allowlist에도 없다.
  // canSpeak가 present/entering/remote 조합을 요구하는지 직접 확인
  const fakeContract = { ...contract, allowed_speaker_ids: ['player', 'heroine5', 'heroine2'], present_npc_ids: ['heroine5'], entering_npc_ids: [], remote_npc_ids: [] };
  assert.equal(canSpeak(fakeContract, 'heroine2'), false, 'allowlist에 있어도 cast 목록 밖이면 발화 불가');
});

test('14.3-4: 빈 acting_direction 차단', () => {
  const result = validateDialogueBlock({ headerAttributes: ' speaker_id="heroine5" acting_direction=""', body: '네.', contract, speakerNames });
  assert.equal(result.ok, false);
  assert.equal(result.warning, DIALOGUE_WARNINGS.MISSING_DIRECTION);
});

test('14.3-5: 자연스럽게만 있는 지시 차단', () => {
  const result = validateDialogueBlock({ headerAttributes: ' speaker_id="heroine5" acting_direction="자연스럽게"', body: '네.', contract, speakerNames });
  assert.equal(result.ok, false);
  assert.equal(result.warning, DIALOGUE_WARNINGS.INVALID_DIRECTION);
});

test('14.3-6: 관찰 가능한 행동이 함께 있으면 허용', () => {
  const result = validateDialogueBlock({ headerAttributes: ' speaker_id="heroine5" acting_direction="차분한 목소리로 서류를 앞으로 밀며"', body: '알겠습니다.', contract, speakerNames });
  assert.equal(result.ok, true);
});

test('14.3-7: 유효한 NPC 대사는 SCENE 다음에 정상 스트리밍', () => {
  const gate = gateFor(contract, speakerNames);
  // 수정 G — 첫 유효 블록이 DIALOGUE면 dialogue_before_scene 차단
  const first = gate.push('[DIALOGUE speaker_id="heroine5" acting_direction="떨리는 목소리로 손끝을 만지작거리며"]\n저... 괜찮으세요?');
  assert.ok(!first.some(e => e.kind === 'block'), 'SCENE 이전 DIALOGUE는 차단');
  // SCENE 후 정상 대사는 통과
  gate.push('\n[SCENE]\n회의실 안이 조용해졌다.\n');
  const out = gate.push('[DIALOGUE speaker_id="heroine5" acting_direction="떨리는 목소리로 손끝을 만지작거리며"]\n저... 괜찮으세요?\n');
  const end = gate.end();
  assert.equal(end.blocks.length, 1, 'SCENE 다음 대사는 저장');
  assert.equal(end.blocks[0].speaker_id, 'heroine5');
  assert.equal(end.blocks[0].speaker_name, '이메이');
  assert.equal(end.warnings[0], DIALOGUE_WARNINGS.BEFORE_SCENE, 'dialogue_before_scene 경고');
});

test('14.3-8: 차단된 대사는 저장 및 Extract에서 제외', () => {
  const gate = gateFor(contract, speakerNames);
  gate.push('[SCENE]\n침묵이 흘렀다.\n\n[DIALOGUE speaker_id="heroine2" acting_direction="고개를 들며"]\n네.\n\n[DIALOGUE speaker_id="heroine5" acting_direction="고개를 숙이며 조심스럽게"]\n네, 찾았어요.');
  const end = gate.end();
  assert.equal(end.blocks.length, 1, 'cast 밖 대사는 저장 블록에서 제외');
  assert.equal(end.blocks[0].speaker_id, 'heroine5');
  assert.ok(!end.story_text.includes('네.'), '차단된 대사 본문이 정본에 없음');
});

test('14.3-9: 잘못된 블록 이후 정상 블록은 계속 출력', () => {
  const gate = gateFor(contract, speakerNames);
  gate.push('[SCENE]\n침묵.\n\n');
  gate.push('[DIALOGUE speaker_id="heroine2" acting_direction="고개를 들며"]\n네.\n\n');
  gate.push('[DIALOGUE speaker_id="heroine5" acting_direction="고개를 끄덕이며"]\n알겠습니다.');
  const end = gate.end();
  assert.equal(end.blocks.length, 1, 'cast 밖 대사는 차단, 이후 정상 블록은 저장');
  assert.equal(end.blocks[0].speaker_id, 'heroine5');
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.NOT_IN_CAST), 'cast 경고 기록');
});

// ---------------------------------------------------------------------------
// 14.4 출력 형식 테스트
// ---------------------------------------------------------------------------

test('14.4-1: 따옴표만 있는 라인은 대사로 인정하지 않고 차단 (수정 B)', () => {
  const gate = gateFor(contract, speakerNames);
  gate.push('[SCENE]\n이메이가 고개를 끄덕였다.\n"네, 찾았어요."\n');
  const end = gate.end();
  assert.equal(end.blocks.filter(b => b.type === 'dialogue').length, 0, '따옴표만 있는 라인은 대사 아님');
  assert.ok(!end.story_text.includes('"네, 찾았어요."'), '비구조화 발화는 정본에서 제거');
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.UNSTRUCTURED), 'unstructured_dialogue_blocked 경고');
});

test('14.4-2: 서술문 안 인용문은 대사 카드로 분리하지 않고 발화로 차단 (수정 B)', () => {
  const gate = gateFor(contract, speakerNames);
  gate.push('[SCENE]\n이메이가 "오늘 안에 끝내자"고 말했다.\n');
  const end = gate.end();
  assert.equal(end.blocks.length, 0);
  assert.ok(!end.story_text.includes('오늘 안에 끝내자'), '화행 동사+인용은 발화로 차단');
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.UNSTRUCTURED));
});

test('14.4-3: [SCENE]과 [DIALOGUE]만 정상 블록으로 인정', () => {
  const gate = gateFor(contract, speakerNames);
  gate.push('[SCENE]\n사무실이 조용했다.\n[FOO]\n알 수 없는 마커.\n[DIALOGUE speaker_id="heroine5" acting_direction="서류를 정리하며"]\n정리했습니다.');
  const end = gate.end();
  assert.equal(end.blocks.filter(b => b.type === 'dialogue').length, 1);
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.UNKNOWN_MARKER), '미지 마커 경고');
  assert.ok(end.story_text.includes('알 수 없는 마커.'), '미지 마커 뒤 일반 텍스트는 보존');
});

test('14.4-4: 모델이 출력한 이름이 아니라 canon의 ID→이름 매핑 사용', () => {
  const result = validateDialogueBlock({ headerAttributes: ' speaker_id="heroine5" acting_direction="고개를 들며"', body: '네.', contract, speakerNames });
  assert.equal(result.ok, true);
  assert.equal(result.block.speaker_name, '이메이', 'canon 이름 주입');
  assert.equal(result.block.speaker, '이메이');
});

// ---------------------------------------------------------------------------
// 14.5 성능·스트리밍 테스트
// ---------------------------------------------------------------------------

test('14.5-1: 전체 Story 버퍼링 없음 — 첫 SCENE 텍스트가 즉시 emit', () => {
  const gate = gateFor(contract, speakerNames);
  // 서술 텍스트는 라인 완성 전이라도 (발화/마커 후보가 아니면) 즉시 emit — 전체 버퍼링 없음
  const out = gate.push('[SCENE]\n첫 문장');
  assert.ok(out.some(e => e.kind === 'text'), '첫 SCENE 서술 즉시 emit');
  const out2 = gate.push('입니다.\n');
  assert.ok(out2.some(e => e.kind === 'text'), '이어지는 조각도 emit');
  // 대사도 다음 마커 도착 시 즉시 블록 emit (end() 대기 없음)
  const out3 = gate.push('[DIALOGUE speaker_id="heroine5" acting_direction="고개를 들며"]\n네.\n\n[SCENE]');
  assert.ok(out3.some(e => e.kind === 'block'), '다음 마커 도착 즉시 블록 emit');
});

test('14.5-2: 청크 크기 1로 잘라도 동일한 결과', () => {
  const story = '[SCENE]\n침묵이 흘렀다.\n\n[DIALOGUE speaker_id="heroine5" acting_direction="떨리는 목소리로"]\n저기...\n';
  const gateA = gateFor(contract, speakerNames);
  for (const ch of story) gateA.push(ch); // 1글자씩
  const endA = gateA.end();
  const gateB = gateFor(contract, speakerNames);
  gateB.push(story);
  const endB = gateB.end();
  assert.equal(endA.blocks.length, endB.blocks.length, '청크 크기와 무관하게 동일 블록 수');
  assert.equal(endA.story_text, endB.story_text, '청크 크기와 무관하게 동일 정본');
});

test('14.5-3: 잘못된 대사 한 블록 때문에 전체 Story가 실패하지 않음', () => {
  const gate = gateFor(contract, speakerNames);
  const bad = gate.push('[SCENE]\n침묵.\n\n[DIALOGUE speaker_id="unknown_employee" acting_direction="당황하며"]\n네.');
  assert.ok(!bad.some(e => e.kind === 'block'), '차단만 되고 예외 없음');
  const good = gate.push('\n\n[DIALOGUE speaker_id="heroine5" acting_direction="고개를 끄덕이며"]\n알겠습니다.');
  const end = gate.end();
  assert.equal(end.blocks.length, 1, '정상 블록은 저장');
  assert.equal(end.blocks[0].speaker_id, 'heroine5');
  assert.ok(end.warnings.includes(DIALOGUE_WARNINGS.ANONYMOUS));
});

// ---------------------------------------------------------------------------
// 14.6 레거시 호환 + 버전
// ---------------------------------------------------------------------------

test('14.6-1: STRUCTURED_STORY_VERSION = 2', () => {
  assert.equal(STRUCTURED_STORY_VERSION, 2);
});

test('14.6-2: isConcreteActingDirection — 추상 단어만 있으면 false, 행동과 함께면 true', () => {
  assert.equal(isConcreteActingDirection(''), false);
  assert.equal(isConcreteActingDirection('자연스럽게'), false);
  assert.equal(isConcreteActingDirection('평범하게'), false);
  assert.equal(isConcreteActingDirection('차분하게'), false);
  assert.equal(isConcreteActingDirection('차분한 목소리로 서류를 앞으로 밀며'), true);
  assert.equal(isConcreteActingDirection('USB를 가슴 앞에 쥔 채 조심스럽게'), true);
  assert.equal(isConcreteActingDirection('시선을 피한 채 손가락을 꼼지락거리며'), true);
});

test('14.6-3: 이동 대상은 destination — entering이 아님 (수정 F 8.4)', () => {
  const contract2 = buildSceneCastContract({
    save: baseSave({ scene_state: { ...baseSave().scene_state, participants: ['player-1'] }, last_npcs_present: [], npc_scene_state: {} }),
    master,
    playerAction: '윤민아를 찾으러 2층 디자인팀으로 간다.'
  });
  assert.ok(contract2.destination_npc_ids.includes('heroine2'), '이동 대상은 destination');
  assert.ok(!contract2.entering_npc_ids.includes('heroine2'), '이동 대상은 entering 아님');
  assert.equal(contract2.speaker_scope?.heroine2, 'after_destination_arrival', '발화 scope 제한');
});

test('14.6-4: 구조화 액션(app_transaction) 대상은 entering에 포함되지 않는다 (수정 F 8.3)', () => {
  const contract2 = buildSceneCastContract({
    save: baseSave(),
    master,
    playerAction: 'x',
    structuredAction: { version: 1, type: 'app_transaction', base_turn_count: 3, operations: [{ domain: 'csa', operation: 'activate', id: 'csa_1' }] }
  });
  assert.ok(!contract2.entering_npc_ids.includes('heroine1'), 'app_transaction target은 entering 근거 아님');
});
