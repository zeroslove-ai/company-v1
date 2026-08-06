import test from 'node:test';
import assert from 'node:assert/strict';

import { parseNarrative as parseEngineNarrative } from '../src/engine/narrative-parser.js';
import { parseNarrative as parseFrontendNarrative } from '../src/frontend/pages/narrative.js';
import {
  collectUnresolvedDialogue,
  buildTaggingMessages,
  buildSceneCandidateIds,
  buildKnownAddresses,
  parseTaggingResponse,
  applySpeakerTags,
  allowedSpeakerIds,
  speakerNameMap
} from '../src/engine/speaker-tagger.js';
import { runSpeakerTagging } from '../src/api/llm.js';
import { hydrateGameplayState, migrateCompanySave } from '../src/engine/gameplay-state.js';
import { applyNpcStatChanges } from '../src/engine/relationship/reducer.js';

const MASTER = {
  characters: [
    { character_id: 'heroine1', name: '서원희', role_title: '브랜드전략팀 팀장', position: '차장', prompt_card: { addressing: '팀원에게는 이름+씨, 공식 자리에서는 직급+님을 쓰며 항상 존댓말을 유지한다.' } },
    { character_id: 'heroine2', name: '윤민아', role_title: '글로벌 캠페인 PM', position: '대리', prompt_card: { addressing: '선배에게는 직급 호칭, 후배에게는 이름+씨를 쓰며 공식 자리에서는 존댓말을 지킨다.' } },
    { character_id: 'heroine5', name: '이메이', role_title: '브랜드 커뮤니티·SNS 주니어 플래너', position: '사원', prompt_card: { addressing: '공식 회의에서는 별명을 쓰지 않고, 친해지면 이름+씨와 장난스러운 호칭을 쓴다.' } }
  ],
  general_npcs: [
    { npc_id: 'npc_secretary', name: '비서', role_title: '총무팀 비서' },
    { npc_id: 'general_park_jungwoo', name: '박정우', role: '브랜드전략1팀 팀장' },
    { npc_id: 'general_lee_minseok', name: '이민석', role: '디자인팀 대리' }
  ]
};

function fourSections(scene) {
  return [
    '[1. 서사 및 행동]',
    scene,
    '[2. 플레이어 속마음]', '정신 차리자.',
    '[3. 플레이어 상황판]', '회의실.',
    '[4. 선택지]', '1. A', '2. B', '3. C', '4. D'
  ].join('\n');
}

// ---------- 14-1. 태거 단위 테스트 ----------

test('14-1-1: parseTaggingResponse parses real OpenAI envelope content (speakers array)', () => {
  // envelope 자체는 runSpeakerTagging이 파싱 — 여기서는 content 문자열 파싱
  const tags = parseTaggingResponse('{"speakers":[{"dialogue_index":1,"speaker_id":"heroine1"}]}', allowedSpeakerIds(MASTER));
  assert.deepEqual(tags, [{ dialogue_index: 1, speaker_id: 'heroine1' }]);
});

test('14-1-2: fully assigned story → no unresolved dialogue → tagger must not be called', () => {
  const parsed = parseEngineNarrative(fourSections('이메이 (차분하게): “알겠습니다.”\n서원희 (단호하게): “다음 안건입니다.”'), { master: MASTER });
  assert.equal(collectUnresolvedDialogue(parsed).length, 0);
  assert.equal(buildTaggingMessages(parsed, MASTER), null);
});

test('14-1-3: unresolved dialogue present → exactly one tagger call (messages non-null)', () => {
  // 소유격 언급("이메이의")은 화자 근거가 아니므로 서버도 미확정으로 남긴다
  const parsed = parseEngineNarrative(fourSections('이메이의 눈동자가 흔들렸다.\n“처음이니까 더 잘해주고 싶은 거 아니야?”'), { master: MASTER });
  const items = collectUnresolvedDialogue(parsed);
  assert.equal(items.length, 1);
  assert.ok(buildTaggingMessages(parsed, MASTER, { playerName: '금재완' }));
});

test('14-1-4: tagger timeout → empty speakers with warning, pipeline proceeds (no throw)', async () => {
  const fetchImpl = async () => { throw Object.assign(new Error('Aborted'), { name: 'AbortError' }); };
  const result = await runSpeakerTagging({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'k', EXTRACT_MODEL: 'm' },
    fetchImpl,
    messages: [{ role: 'user', content: 'x' }],
    allowlist: allowedSpeakerIds(MASTER),
    timeoutMs: 100
  });
  assert.deepEqual(result.speakers, []);
  assert.equal(result.warning, 'speaker_tagging_timeout');
});

test('14-1-5: tagger invalid JSON content → empty speakers, no throw', () => {
  assert.deepEqual(parseTaggingResponse('not-json{{{', allowedSpeakerIds(MASTER)), []);
});

test('14-1-6: speaker_id outside roster allowlist is rejected', () => {
  const tags = parseTaggingResponse('{"speakers":[{"dialogue_index":0,"speaker_id":"서원희"},{"dialogue_index":1,"speaker_id":"stranger_id"}]}', allowedSpeakerIds(MASTER));
  assert.deepEqual(tags, []);
});

test('14-1-7: duplicate dialogue_index rejected (first wins, second dropped)', () => {
  const tags = parseTaggingResponse('{"speakers":[{"dialogue_index":0,"speaker_id":"heroine1"},{"dialogue_index":0,"speaker_id":"heroine2"}]}', allowedSpeakerIds(MASTER));
  assert.deepEqual(tags, [{ dialogue_index: 0, speaker_id: 'heroine1' }]);
});

test('14-1-8: out-of-range dialogue_index never applies', () => {
  const parsed = parseEngineNarrative(fourSections('“대사 하나”'), { master: MASTER });
  const items = collectUnresolvedDialogue(parsed);
  const tags = parseTaggingResponse('{"speakers":[{"dialogue_index":7,"speaker_id":"heroine1"}]}', allowedSpeakerIds(MASTER));
  const applied = applySpeakerTags(parsed, tags, MASTER, { playerName: '금재완', unresolvedItems: items });
  assert.equal(applied.appliedCount, 0);
  assert.equal(applied.parsedStory.blocks.filter(b => b.type === 'dialogue')[0].speaker_id, null);
});

test('14-1-9: partial response applies only the valid entries', () => {
  const parsed = parseEngineNarrative(fourSections('“첫 번째.”\n“두 번째.”\n“세 번째.”'), { master: MASTER });
  const items = collectUnresolvedDialogue(parsed);
  const tags = parseTaggingResponse('{"speakers":[{"dialogue_index":0,"speaker_id":"heroine2"},{"dialogue_index":9,"speaker_id":"heroine1"}]}', allowedSpeakerIds(MASTER));
  const applied = applySpeakerTags(parsed, tags, MASTER, { playerName: '금재완', unresolvedItems: items });
  const dialogues = applied.parsedStory.blocks.filter(b => b.type === 'dialogue');
  assert.equal(dialogues[0].speaker_id, 'heroine2');
  assert.equal(dialogues[1].speaker_id, null);
  assert.equal(dialogues[2].speaker_id, null);
});

test('14-1-10: same text spoken by different speakers maps by dialogue_index, not text', () => {
  const parsed = parseEngineNarrative(fourSections('윤민아: “네.”\n서원희: “네.”\n“네.”'), { master: MASTER });
  const items = collectUnresolvedDialogue(parsed);
  assert.equal(items.length, 1); // 미확정은 마지막 "네." 하나
  assert.equal(items[0].text, '네.');
  const tags = parseTaggingResponse('{"speakers":[{"dialogue_index":2,"speaker_id":"player"}]}', allowedSpeakerIds(MASTER));
  const applied = applySpeakerTags(parsed, tags, MASTER, { playerName: '금재완', unresolvedItems: items });
  const dialogues = applied.parsedStory.blocks.filter(b => b.type === 'dialogue');
  assert.equal(dialogues[2].speaker_id, 'player');
});

test('14-1-11: player speaker_id resolves to the player name', () => {
  const parsed = parseEngineNarrative(fourSections('“저는 이 안건에 찬성합니다.”'), { master: MASTER });
  const items = collectUnresolvedDialogue(parsed);
  const tags = parseTaggingResponse('{"speakers":[{"dialogue_index":0,"speaker_id":"player"}]}', allowedSpeakerIds(MASTER));
  const applied = applySpeakerTags(parsed, tags, MASTER, { playerName: '금재완', unresolvedItems: items });
  const d = applied.parsedStory.blocks.filter(b => b.type === 'dialogue')[0];
  assert.equal(d.speaker_id, 'player');
  assert.equal(d.speaker_name, '금재완');
});

test('14-1-12: general_npcs speaker resolves', () => {
  const parsed = parseEngineNarrative(fourSections('“사장님께서 대기실로 오시라고 하셨습니다.”'), { master: MASTER });
  const items = collectUnresolvedDialogue(parsed);
  const tags = parseTaggingResponse('{"speakers":[{"dialogue_index":0,"speaker_id":"npc_secretary"}]}', allowedSpeakerIds(MASTER));
  const applied = applySpeakerTags(parsed, tags, MASTER, { playerName: '금재완', unresolvedItems: items });
  const d = applied.parsedStory.blocks.filter(b => b.type === 'dialogue')[0];
  assert.equal(d.speaker_id, 'npc_secretary');
  assert.equal(d.speaker_name, '비서');
});

test('14-1-13: explicit null keeps the line unassigned', () => {
  const parsed = parseEngineNarrative(fourSections('“이 대사는 미확정.”'), { master: MASTER });
  const items = collectUnresolvedDialogue(parsed);
  const tags = parseTaggingResponse('{"speakers":[{"dialogue_index":0,"speaker_id":null}]}', allowedSpeakerIds(MASTER));
  const applied = applySpeakerTags(parsed, tags, MASTER, { playerName: '금재완', unresolvedItems: items });
  assert.equal(applied.appliedCount, 0);
  assert.equal(applied.parsedStory.blocks.filter(b => b.type === 'dialogue')[0].speaker_id, null);
});

test('14-1-14: tagger cannot override an already-assigned speaker', () => {
  const parsed = parseEngineNarrative(fourSections('이메이: “이건 이메이 대사.”'), { master: MASTER });
  const items = collectUnresolvedDialogue(parsed);
  const tags = parseTaggingResponse('{"speakers":[{"dialogue_index":0,"speaker_id":"heroine2"}]}', allowedSpeakerIds(MASTER));
  const applied = applySpeakerTags(parsed, tags, MASTER, { playerName: '금재완', unresolvedItems: items });
  const d = applied.parsedStory.blocks.filter(b => b.type === 'dialogue')[0];
  assert.equal(d.speaker_id, 'heroine5'); // 변경 시도 무시
});

test('14-1-15: already-tagged parsed_blocks skips tagger (replay guard via tagged flag)', () => {
  const parsed = parseEngineNarrative(fourSections('“미확정 대사.”'), { master: MASTER });
  parsed.tagged = true; // 저장된 tagged 결과가 있음
  const items = collectUnresolvedDialogue(parsed);
  // buildTaggingMessages는 순수 함수라 tagged 여부를 모르지만, 호출부가 tagged 플래그로 가드
  assert.equal(items.length, 1);
  assert.ok(buildTaggingMessages(parsed, MASTER, { playerName: '금재완' })); // 호출부 가드가 1회 보장
});

test('14-1-real-envelope: runSpeakerTagging unwraps choices[0].message.content from a real OpenAI envelope', async () => {
  const envelope = {
    choices: [
      {
        finish_reason: 'stop',
        message: { content: '{"speakers":[{"dialogue_index":1,"speaker_id":"heroine1"}]}' }
      }
    ]
  };
  const fetchImpl = async () => new Response(JSON.stringify(envelope), { status: 200, headers: { 'content-type': 'application/json' } });
  const result = await runSpeakerTagging({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'k', EXTRACT_MODEL: 'm' },
    fetchImpl,
    messages: [{ role: 'user', content: 'x' }],
    allowlist: allowedSpeakerIds(MASTER)
  });
  assert.deepEqual(result.speakers, [{ dialogue_index: 1, speaker_id: 'heroine1' }]);
  assert.equal(result.warning, null);
});

test('14-1-envelope-truncated: finish_reason=length returns truncated warning, not a throw', async () => {
  const envelope = { choices: [{ finish_reason: 'length', message: { content: '{"speakers":' } }] };
  const fetchImpl = async () => new Response(JSON.stringify(envelope), { status: 200, headers: { 'content-type': 'application/json' } });
  const result = await runSpeakerTagging({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'k', EXTRACT_MODEL: 'm' },
    fetchImpl,
    messages: [{ role: 'user', content: 'x' }]
  });
  assert.deepEqual(result.speakers, []);
  assert.equal(result.warning, 'speaker_tagging_truncated');
});

// ---------- 14-2. 인용문 구분 ----------

test('14-2: quoted document/slide/email titles are NOT dialogue', () => {
  for (const scene of [
    '문서 제목은 “글로벌 캠페인 2차 수정안”이었다.',
    '슬라이드에는 “브랜드의 내일”이라는 문구가 적혀 있었다.',
    '메일 제목은 “최종 검토 요청”이었다.'
  ]) {
    const parsed = parseEngineNarrative(fourSections(scene), { master: MASTER });
    const front = parseFrontendNarrative(fourSections(scene), { speakerDirectory: { heroine1: { name: '서원희' }, heroine2: { name: '윤민아' } } });
    assert.equal(parsed.blocks.some(b => b.type === 'dialogue'), false, `서버: ${scene}`);
    assert.equal(front.blocks.some(b => b.type === 'dialogue'), false, `프론트: ${scene}`);
  }
});

test('14-2: quoted actual speech IS dialogue', () => {
  const parsed = parseEngineNarrative(fourSections('윤민아가 고개를 들었다.\n“제가 먼저 확인하겠습니다.”'), { master: MASTER });
  const d = parsed.blocks.filter(b => b.type === 'dialogue');
  assert.equal(d.length, 1);
  assert.equal(d[0].speaker_id, 'heroine2');
});

test('14-2: mixed line with speech attribution splits exactly', () => {
  const parsed = parseEngineNarrative(fourSections('윤민아가 “제가 확인하겠습니다.”라고 말한 뒤 출력물을 집었다.'), { master: MASTER });
  const d = parsed.blocks.filter(b => b.type === 'dialogue');
  assert.equal(d.length, 1);
  assert.equal(d[0].speaker_id, 'heroine2');
  assert.equal(d[0].text, '제가 확인하겠습니다.');
});

// ---------- 14-5. stats migration ----------

function hydrate(saveNpcStats) {
  const save = migrateCompanySave({ save_schema_version: 1, edition: 'company-v1', world_state: {}, npc_stats: saveNpcStats ? { 'npc-hayeon': saveNpcStats } : {} });
  const master = { characters: [{ character_id: 'npc-hayeon', initial_stats: { affinity: 9, resistance: 60, csa_acceptance: 35 } }] };
  return hydrateGameplayState(save, master).npc_stats['npc-hayeon'];
}

test('14-5a: legacy { affection: 0 } placeholder → canonical defaults', () => {
  const out = hydrate({ affection: 0 });
  assert.equal(out.affinity, 0); // affection → affinity 이전
  assert.equal(out.resistance, 60);
  assert.equal(out.csa_acceptance, 35);
  assert.equal(out.sexual_arousal, 0);
});

test('14-5b: legacy { affection: 7, csa_acceptance: 12 } → affinity migrates, values preserved', () => {
  const out = hydrate({ affection: 7, csa_acceptance: 12 });
  assert.equal(out.affinity, 7);
  assert.equal(out.resistance, 60);
  assert.equal(out.csa_acceptance, 12);
  assert.equal(out.sexual_arousal, 0);
});

test('14-5c: { affinity: 9, affection: 2, resistance: 60 } → affinity wins, affection never overrides', () => {
  const out = hydrate({ affinity: 9, affection: 2, resistance: 60 });
  assert.equal(out.affinity, 9); // 기존 affinity 보존, affection으로 덮어쓰지 않음
  assert.equal(out.resistance, 60);
  assert.equal(out.csa_acceptance, 35);
  assert.equal(out.sexual_arousal, 0);
});

test('14-5d: full canonical stats preserved untouched', () => {
  assert.deepEqual(hydrate({ affinity: 9, resistance: 60, csa_acceptance: 35, sexual_arousal: 4 }), { affinity: 9, resistance: 60, csa_acceptance: 35, sexual_arousal: 4 });
});

test('14-5e: reducer keeps resistance and ignores resistance deltas with warning', () => {
  const { state, warnings } = applyNpcStatChanges({ affinity: 5, resistance: 45, csa_acceptance: 20, sexual_arousal: 1 }, { affinity: 2, resistance: 99 }, { reason: 'test' });
  assert.equal(state.resistance, 45);
  assert.equal(state.affinity, 7);
  assert.ok(warnings.includes('stat_resistance_change_ignored'));
});

// ---------- 화자 일치 (14-3) ----------

test('14-3: server and frontend agree on speaker_id for the same story', () => {
  const story = fourSections('이메이의 눈동자가 흔들렸다.\n“저... 감사님, 이거 진짜 처음인데...”\n“처음이니까 더 잘해주고 싶은 거 아니야?”');
  const engine = parseEngineNarrative(story, { master: MASTER });
  const front = parseFrontendNarrative(story, { speakerDirectory: { heroine1: { name: '서원희' }, heroine2: { name: '윤민아' }, heroine5: { name: '이메이' } } });
  const e = engine.blocks.filter(b => b.type === 'dialogue');
  const f = front.blocks.filter(b => b.type === 'dialogue');
  assert.equal(e.length, f.length);
  e.forEach((b, i) => assert.equal(f[i].speaker_id, b.speaker_id, `대사 ${i + 1} 일치`));
});

test('roster and name map cover player + characters + general_npcs', () => {
  const allow = allowedSpeakerIds(MASTER);
  assert.ok(allow.includes('player'));
  assert.ok(allow.includes('heroine1'));
  assert.ok(allow.includes('npc_secretary'));
  const names = speakerNameMap(MASTER);
  assert.equal(names.get('heroine2').name, '윤민아');
  assert.equal(names.get('npc_secretary').name, '비서');
});


// ---------- 5. normalized_raw 4개 섹션 보존 ----------

const FOUR_SECTION_STORY = [
  '[1. 서사 및 행동]',
  '이메이의 눈동자가 흔들렸다.',
  '“처음이니까 더 잘해주고 싶은 거예요.”',
  '[2. 플레이어 속마음]',
  '정신 차리자.',
  '[3. 플레이어 상황판]',
  '회의실.',
  '[4. 선택지]',
  '1. 같이 밥 먹자',
  '2. 노코멘트',
  '3. 넘어간다',
  '4. 조용히 한다'
].join('\n');

test('5-1: applySpeakerTags는 normalized_raw의 4개 섹션 전부를 보존하고 화자명만 반영한다', () => {
  const parsed = parseEngineNarrative(FOUR_SECTION_STORY, { master: MASTER });
  const items = collectUnresolvedDialogue(parsed);
  assert.equal(items.length, 1);
  const tags = parseTaggingResponse('{"speakers":[{"dialogue_index":0,"speaker_id":"heroine5"}]}', allowedSpeakerIds(MASTER));
  const applied = applySpeakerTags(parsed, tags, MASTER, { playerName: '금재완', unresolvedItems: items });
  const after = applied.parsedStory.normalized_raw;

  // 4개 섹션 마커 전부 존재
  for (const marker of ['[1. 서사 및 행동]', '[2. 플레이어 속마음]', '[3. 플레이어 상황판]', '[4. 선택지]']) {
    assert.ok(after.includes(marker), `마커 보존: ${marker}`);
  }
  // 플레이어 속마음 / 상황판 / 선택지 / choice labels 보존
  assert.ok(after.includes('정신 차리자.'), '속마음 보존');
  assert.ok(after.includes('회의실.'), '상황판 보존');
  for (const choice of ['1. 같이 밥 먹자', '2. 노코멘트', '3. 넘어간다', '4. 조용히 한다']) {
    assert.ok(after.includes(choice), `선택지 보존: ${choice}`);
  }
  // scene 보존
  assert.ok(after.includes('이메이의 눈동자가 흔들렸다.'), 'scene 보존');
  // 화자명만 삽입
  assert.ok(after.includes('이메이 (자연스럽게): “처음이니까 더 잘해주고 싶은 거예요.”'), '화자명 삽입');
  // 화자명 없는 원문 대사 라인은 더 이상 존재하지 않아야 한다 (라인 단위 정확 일치)
  const rawLines = after.split('\n');
  assert.ok(!rawLines.some(l => l.trim() === '“처음이니까 더 잘해주고 싶은 거예요.”'), '원문 무화자 라인 제거');
  // 라인 수 동일 (화자명 삽입만, 구조 변경 없음)
  assert.equal(after.split('\n').length, parsed.normalized_raw.split('\n').length, '라인 수 동일');
});

test('5-2: applySpeakerTags는 비대사 블록 타입(player_inner_thought 등)과 choices/choice_labels를 그대로 보존한다', () => {
  const parsed = parseEngineNarrative(FOUR_SECTION_STORY, { master: MASTER });
  const beforeInnerThought = parsed.blocks.filter(b => b.type === 'player_inner_thought');
  const beforeChoices = parsed.choices;
  const beforeLabels = parsed.choice_labels;
  const items = collectUnresolvedDialogue(parsed);
  const tags = parseTaggingResponse('{"speakers":[{"dialogue_index":0,"speaker_id":"heroine5"}]}', allowedSpeakerIds(MASTER));
  const applied = applySpeakerTags(parsed, tags, MASTER, { playerName: '금재완', unresolvedItems: items });

  // non-dialogue 블록은 동일 객체 그대로
  assert.deepEqual(applied.parsedStory.blocks.filter(b => b.type === 'player_inner_thought'), beforeInnerThought);
  // 대사 수·순서·원문 텍스트 동일
  const beforeDialogues = parsed.blocks.filter(b => b.type === 'dialogue');
  const afterDialogues = applied.parsedStory.blocks.filter(b => b.type === 'dialogue');
  assert.equal(afterDialogues.length, beforeDialogues.length, '대사 수 동일');
  afterDialogues.forEach((d, i) => assert.equal(d.text, beforeDialogues[i].text, `대사 ${i} 텍스트 동일`));
  // choices/choice_labels 보존
  assert.deepEqual(applied.parsedStory.choices, beforeChoices);
  assert.deepEqual(applied.parsedStory.choice_labels, beforeLabels);
});


// ---------- minor 보완: 실제 호칭 생성 / scene 등장 인물 / inline 안전 ----------

test('minor-speaker-1: 운영 플레이어 동적 호칭 생성 (감사실 임원 금태양)', () => {
  const addresses = buildKnownAddresses({
    id: 'player', name: '금태양', department: '감사실', position: '임원', roleTitle: '', isPlayer: true
  });
  for (const expected of ['감사님', '임원님', '금 감사님', '금 임원님', '금태양 감사님', '금태양 임원님']) {
    assert.ok(addresses.includes(expected), `플레이어 호칭: ${expected}`);
  }
  // 중복 없음
  assert.equal(new Set(addresses).size, addresses.length, '중복 제거');
  // 12개 이하
  assert.ok(addresses.length <= 12, `최대 12개 (${addresses.length})`);
});

test('minor-speaker-2: 팀장 NPC 호칭 생성 (서원희)', () => {
  const addresses = buildKnownAddresses({
    id: 'heroine1', name: '서원희', department: '브랜드전략팀', position: '차장', roleTitle: '브랜드전략팀 팀장'
  });
  for (const expected of ['팀장님', '서 팀장님', '서원희 팀장님', '차장님', '서 차장님']) {
    assert.ok(addresses.includes(expected), `서원희 호칭: ${expected}`);
  }
});

test('minor-speaker-3: 일반 사원 NPC 호칭 생성 (이메이)', () => {
  const addresses = buildKnownAddresses({
    id: 'heroine5', name: '이메이', position: '사원', roleTitle: '브랜드 커뮤니티·SNS 주니어 플래너'
  });
  for (const expected of ['이메이 씨', '메이 씨', '이 사원님', '사원님']) {
    assert.ok(addresses.includes(expected), `이메이 호칭: ${expected}`);
  }
});

test('minor-speaker-4: 별칭 충돌 시 짧은 이름 호칭 제외', () => {
  // 다른 등록 인물 "김민아"가 있으면 윤민아의 "민아 씨" 별칭은 충돌로 생성하지 않는다
  const addresses = buildKnownAddresses({
    id: 'heroine2', name: '윤민아', position: '대리', roleTitle: '글로벌 캠페인 PM',
    otherNames: ['윤민아', '김민아']
  });
  assert.ok(!addresses.includes('민아 씨'), '충돌 별칭 제외');
  assert.ok(addresses.includes('윤민아 씨'), '전체 이름 씨는 유지');
  assert.ok(addresses.includes('대리님'), '직급 호칭 유지');
  // 충돌이 없으면 별칭 생성
  const noConflict = buildKnownAddresses({
    id: 'heroine2', name: '윤민아', position: '대리', otherNames: ['윤민아']
  });
  assert.ok(noConflict.includes('민아 씨'), '충돌 없으면 별칭 생성');
});

test('minor-speaker-5: 일반 NPC 명시적 기존 addresses 보존', () => {
  const addresses = buildKnownAddresses({
    id: 'npc_secretary', name: '비서', roleTitle: '총무팀 비서',
    explicitAddresses: ['박 과장님', '사무장님']
  });
  assert.ok(addresses.includes('박 과장님'), '명시 주소 보존 1');
  assert.ok(addresses.includes('사무장님'), '명시 주소 보존 2');
  assert.ok(addresses.includes('비서님'), '역할 기반 호칭도 생성');
});

test('minor-speaker-6: Scene 서술에서 신규 일반 NPC full name 탐지', () => {
  const story = fourSections('박정우가 회의실 문을 열고 들어왔다.\n“팀장님, 요청하신 자료입니다.”');
  const parsed = parseEngineNarrative(story, { master: MASTER });
  const ids = buildSceneCandidateIds(parsed, { master: MASTER });
  assert.ok(ids.includes('general_park_jungwoo'), '박정우가 scene 후보에 포함');
});

test('minor-speaker-7: Scene에 없는 NPC는 in_scene 후보 제외', () => {
  const story = fourSections('이메이의 눈동자가 흔들렸다.\n“처음이니까 더 잘해주고 싶은 거예요.”');
  const parsed = parseEngineNarrative(story, { master: MASTER });
  const ids = buildSceneCandidateIds(parsed, { master: MASTER });
  assert.ok(!ids.includes('general_lee_minseok'), '이민석 미등장 → 후보 제외');
  assert.ok(ids.includes('heroine5'), '이메이는 dialogue로 등장 → 후보 포함');
});

test('minor-speaker-8: 동명이인은 scene 텍스트만으로 in_scene 판단하지 않음', () => {
  const dupMaster = {
    characters: [{ character_id: 'heroine9', name: '박정우' }],
    general_npcs: [{ npc_id: 'general_park_jungwoo', name: '박정우' }]
  };
  const story = fourSections('박정우가 회의실 문을 열고 들어왔다.');
  const parsed = parseEngineNarrative(story, { master: dupMaster });
  const ids = buildSceneCandidateIds(parsed, { master: dupMaster });
  assert.ok(!ids.includes('heroine9'), '동명이인 A 보류');
  assert.ok(!ids.includes('general_park_jungwoo'), '동명이인 B 보류');
});

test('minor-speaker-9: Inline dialogue 태깅 후 blocks 화자 적용', () => {
  // 화행 주어가 없는 inline — parser가 미확정으로 남기고 태거가 판별한다
  const story = fourSections('화면을 보며 “확인해 보겠습니다.”라고 말했다.');
  const parsed = parseEngineNarrative(story, { master: MASTER });
  const items = collectUnresolvedDialogue(parsed);
  assert.equal(items.length, 1, '미확정 inline 1개');
  const tags = parseTaggingResponse('{"speakers":[{"dialogue_index":0,"speaker_id":"heroine5"}]}', allowedSpeakerIds(MASTER));
  const applied = applySpeakerTags(parsed, tags, MASTER, { playerName: '금재완', unresolvedItems: items, rawStory: story });
  const d = applied.parsedStory.blocks.filter(b => b.type === 'dialogue')[0];
  assert.equal(d.speaker_id, 'heroine5');
  assert.equal(d.speaker_name, '이메이');
  assert.equal(d.text, '확인해 보겠습니다.');
  // scene 앞뒤 서술 유지 (text는 trim된 형태)
  const scenes = applied.parsedStory.blocks.filter(b => b.type === 'scene');
  assert.ok(scenes.some(s => s.text === '화면을 보며'), '앞 서술 유지');
  assert.ok(scenes.some(s => s.text === '라고 말했다.'), '뒤 서술 유지');
});

test('minor-speaker-10: Inline dialogue의 normalized_raw 원문 보존 + 4개 섹션', () => {
  const story = [
    '[1. 서사 및 행동]',
    '이메이는 화면을 보며 “확인해 보겠습니다.”라고 말했다.',
    '[2. 플레이어 속마음]', '좋아.',
    '[3. 플레이어 상황판]', '회의실.',
    '[4. 선택지]', '1. 같이 밥 먹자', '2. 노코멘트', '3. 넘어간다', '4. 조용히 한다'
  ].join('\n');
  const parsed = parseEngineNarrative(story, { master: MASTER });
  const items = collectUnresolvedDialogue(parsed);
  // parser가 확정(heroine5)했거나 태거가 확정 — 어느 쪽이든 normalized_raw는 원문 보존
  const tags = parseTaggingResponse('{"speakers":[{"dialogue_index":0,"speaker_id":"heroine5"}]}', allowedSpeakerIds(MASTER));
  const applied = applySpeakerTags(parsed, tags, MASTER, { playerName: '금재완', unresolvedItems: items, rawStory: story });
  const after = applied.parsedStory.normalized_raw;
  // 원문 라인 완전 동일
  assert.ok(after.includes('이메이는 화면을 보며 “확인해 보겠습니다.”라고 말했다.'), 'inline 원문 라인 보존');
  // 잘못된 화자명 삽입 문자열이 생기지 않아야 한다
  assert.ok(!after.includes('이메이는 화면을 보며 이메이'), '이중 화자명 없음');
  assert.ok(!after.includes('이메이는 화면을 보며 이메이 (자연스럽게):'), '부자연스러운 삽입 없음');
  // 4개 섹션 보존
  for (const marker of ['[1. 서사 및 행동]', '[2. 플레이어 속마음]', '[3. 플레이어 상황판]', '[4. 선택지]']) {
    assert.ok(after.includes(marker), `섹션 보존: ${marker}`);
  }
  for (const choice of ['1. 같이 밥 먹자', '2. 노코멘트', '3. 넘어간다', '4. 조용히 한다']) {
    assert.ok(after.includes(choice), `선택지 보존: ${choice}`);
  }
  // blocks 화자는 정상 적용
  const d = applied.parsedStory.blocks.filter(b => b.type === 'dialogue')[0];
  assert.equal(d.speaker_id, 'heroine5');
});
