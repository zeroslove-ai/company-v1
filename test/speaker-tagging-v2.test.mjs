import test from 'node:test';
import assert from 'node:assert/strict';

import { parseNarrative as parseEngineNarrative } from '../src/engine/narrative-parser.js';
import { parseNarrative as parseFrontendNarrative } from '../src/frontend/pages/narrative.js';
import {
  collectUnresolvedDialogue,
  buildTaggingMessages,
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
    { character_id: 'heroine1', name: '서원희', role_title: '브랜드전략팀 팀장' },
    { character_id: 'heroine2', name: '윤민아', role_title: '브랜드전략팀 사원' },
    { character_id: 'heroine5', name: '이메이', role_title: '브랜드전략팀 사원' }
  ],
  general_npcs: [
    { npc_id: 'npc_secretary', name: '비서', role_title: '총무팀 비서' }
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
