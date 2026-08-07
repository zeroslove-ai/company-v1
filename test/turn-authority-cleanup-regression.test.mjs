import test from 'node:test';
import assert from 'node:assert/strict';

import { applyGuardedStateDelta } from '../src/engine/guarded-merge.js';
import { buildDeterministicTurnSummary } from '../src/engine/turn-summary.js';
import { buildCsaRuntimeStatePatch as buildCsaSceneRuntimeStatePatch } from '../src/engine/csa/reducer.js';
import { resolveCsaDirectCoverage } from '../src/engine/csa/direct-coverage.js';
import { parseNarrative } from '../src/engine/narrative-parser.js';
import { normalizeGameplayExtractEnvelope } from '../src/engine/gameplay-state.js';

// ── 공통 fixture ─────────────────────────────────────────────────────────────

function baseSave(overrides = {}) {
  return {
    save_schema_version: 1,
    edition: 'company-v1',
    turn_state: { committed_turn: 56, committed_turn_meta: { save_revision: 124 } },
    player: { player_id: 'player-1', name: '금태양', department: '감사실' },
    player_scene_state: { posture: 'standing', position_label: '김제나 책상 앞' },
    player_sexual_state: {},
    world_state: { game_time: { day: 1, minute_of_day: 1023 }, elapsed_total_minutes: 0 },
    scene_state: { location_id: 'brand_office', participants: ['player-1', 'heroine3'] },
    npc_stats: { heroine3: { affinity: 12, resistance: 35, csa_acceptance: 65, sexual_arousal: 0 } },
    npc_emotion: { heroine3: { mood: '당황' } },
    npc_relationship_state: { heroine3: { current_boundary: 'cautious_professional', relationship_summary: '기존 관계 요약' } },
    npc_scene_state: { heroine3: { posture: 'seated', present: true, location_label: null, position_label: '구석 자리 책상', clothing: {}, updated_turn: 56 } },
    npc_work_state: { heroine3: { task: '문서 정리', focus: '업무' } },
    csa_active: ['csa_42', 'csa_42_1'],
    csa_rules: {
      csa_42: {
        active: true,
        content: '회사 직원은 동료와 컨디션을 확인할 때 동료의 성적 긴장의 원인을 확인하고 완화를 도와야 하며, 상대가 편안해질 때까지 이를 계속해야 한다.',
        source_type: 'preset', created_turn: 42, scope_id: 'world', scope_type: 'world',
        preset: {
          version: 1, actor_group: 'company_employee', target_group: 'coworker',
          trigger: 'status_check', duration: 'until_goal_reached',
          required_action: 'relieve_sexual_tension',
          direct_meaning_tags: ['성적 긴장', '완화', '도움'], public_normalization: true, persistent: true
        }
      },
      csa_42_1: {
        active: true,
        content: '회사 직원은 근무 중 속옷 차림으로 근무해야 한다.',
        source_type: 'preset', created_turn: 42,
        preset: {
          version: 1, actor_group: 'female_employee', target_group: 'none',
          trigger: 'always_on_duty', duration: 'while_on_duty',
          required_action: 'work_in_underwear_only', direct_meaning_tags: ['속옷 차림']
        }
      }
    },
    csa_attitudes: { heroine3: { csa_42: 65, csa_42_1: 55 } },
    csa_runtime_state: {
      csa_42: { lifecycle: 'active', applicability: 'applicable', execution_state: 'executed', character_id: 'heroine3', started_turn: 42, last_confirmed_turn: 56 },
      csa_42_1: { lifecycle: 'active', applicability: 'applicable', execution_state: 'executed', character_id: 'heroine3', started_turn: 42, last_confirmed_turn: 56 }
    },
    csa_aftereffect_state: {},
    event_ledger: [],
    story_summary_overall: '기존 전체 요약',
    story_summary_recent: '기존 최근 요약',
    focal_character_id: 'heroine3',
    last_speaker_id: 'heroine3',
    last_npcs_present: ['heroine3'],
    last_image_id: null,
    last_choices: ['선택지 A', '선택지 B', '선택지 C', '선택지 D'],
    last_choice_meta: {},
    ...overrides
  };
}

const master = {
  characters: [
    { character_id: 'heroine3', name: '김제나', gender: 'female', role: '브랜드전략팀 신입' }
  ]
};
const npcIds = new Set(['heroine3']);

/** 57턴 실측과 동일한 Story — 월권/인사팀 항의/이탈/그만하시죠 문구 없음. */
const TURN57_STORY = `[1. 서사 및 행동]
[SCENE]
내 직고백에 김제나의 얼굴이 순식간에 하얘졌다. 그녀의 손이 무릎 위에서 덜덜 떨리더니, 이내 책상 가장자리를 꽉 움켜쥐었다. 적갈색 머리카락 사이로 보이는 그녀의 귀가 새빨갛게 물들었다.

[DIALOGUE speaker_id="heroine3" acting_direction="두 손으로 얼굴을 가리며 고개를 숙인다. 목소리가 간신히 새어 나오듯 작게 떨린다."]
감사관님... 그렇게 말씀하시면...

[SCENE]
김제나는 숨을 깊게 들이쉬고 나를 올려다봤다. 그녀의 회갈색 눈에는 당황보다는 엄중한 빛이 섞여 있었다. 주변 직원들은 여전히 업무 중이었지만, 그녀는 목소리를 낮춘 채 분명하게 말을 이어갔다.

[DIALOGUE speaker_id="heroine3" acting_direction="고개를 들고 눈을 마주치며, 목소리를 절제된 낮은 톤으로 유지한다. 손가락이 책상 위에서 가지런히 모인다."]
저는... 그 규정이 '동료의 컨디션을 확인하는 상황'에서 적용되는 걸로 이해했어요. 지금 감사관님은 저랑 업무 대화를 하고 계신 거잖아요. 그런데 갑자기 그런 걸 부탁하시는 건... 규정 범위를 넘어서는 거라고 생각해요.

[SCENE]
그녀의 말은 또렷했지만, 목소리 끝은 살짝 떨렸다. 자신의 말이 옳다는 확신과, 상사에게 거절하는 것에 대한 부담이 섞여 있는 목소리였다. 그녀는 잠시 나를 살피더니 이내 자신의 자세를 바로 잡았다.

[DIALOGUE speaker_id="heroine3" acting_direction="두 팔로 가슴을 가린 채 약간 몸을 틀어 옆을 보며, 나지막하고 조심스러운 목소리로 덧붙인다."]
그리고... 그런 표현은 저한테 조금... 부담스러워요. 감사관님이신데... 저희 업무적으로만 봐주시면 안 될까요?

[2. 플레이어 속마음]
"하... 씨 이거 완전 거절당했네. 일단 물러서는 게 낫겠다."

[3. 플레이어 상황판]
- 이름: 금태양 / 감사실 임원
- 장소: 브랜드전략팀 사무실 (3층)
- Day 1, 17:23 (현재 턴 57)

[4. 선택지]
1. "미안해요, 선을 넘었네요. 규정 확인 차원이었어요"라며 사과하고 물러선다
2. "그래도 규정이 규정이니까, 컨디션 확인은 해야겠어요"라며 규정을 근거로 한 번 더 설득한다
3. "알겠어요. 그럼 속옷 차림 규정은 준수하고 있는지 정도만 확인할게요"라며 업무적 톤으로 범위를 좁힌다
4. "부담스러웠다면 사과할게요. 근데 왜 그렇게까지 거절하는지 이유가 궁금하네요"라며 그녀의 생각을 묻는다`;

// ── fixture 1: 57턴 가짜 evidence와 가짜 summary 폐기 ──────────────────────

test('golden 1: 57턴 — Story에 없는 evidence는 affinity/current_boundary 폐기, 실제 감정 evidence는 통과', () => {
  const extract = {
    outcome: 'blocked',
    turn_summary: '감사관이 발기 사실을 고백하며 부적절한 요구를 하자 김제나는 충격과 분노를 드러내며 정식으로 항의하겠다고 말하고, 자리에서 일어나 자리를 이탈한다.',
    state_delta: {
      npc_stats: { heroine3: { affinity: -2, csa_acceptance: 55 } },
      npc_relationship_state: { heroine3: { current_boundary: 'explicitly_refusing_improper_request' } },
      npc_emotion: { heroine3: { mood: '불안' } }
    },
    evidence: {
      verbal_refusal: {
        quote: '감사관님, 지금 그 말씀은 정말로 월권이에요. 그런... 그런 걸 원하시는 거라면, 저는 인사팀에 정식으로 항의하겠어요.',
        changed: ['npc_relationship_state.heroine3.current_boundary']
      },
      affinity_change: {
        quote: '김제나는 자리에서 일어나며 차갑게 말했다. "이제 그만하시죠."',
        changed: ['npc_stats.heroine3.affinity']
      },
      emotional_reaction: {
        quote: '김제나의 얼굴이 순식간에 하얘졌다. 그녀의 손이 무릎 위에서 덜덜 떨리더니, 이내 책상 가장자리를 꽉 움켜쥐었다.',
        changed: ['npc_emotion.heroine3.mood']
      },
      csa_acceptance_change: {
        quote: '규정이 아니라 개인적인 요구잖아요! 그런 걸로 저를...',
        changed: ['npc_stats.heroine3.csa_acceptance']
      }
    },
    choices: [],
    npcs_present: ['heroine3'],
    action_target_id: 'heroine3',
    focal_character_id: 'heroine3',
    last_speaker_id: 'heroine3',
    elapsed_minutes: 5
  };

  const parsed = parseNarrative(TURN57_STORY, { master });
  const envelope = normalizeGameplayExtractEnvelope(extract, { parsedStory: parsed, npcIds });
  const merged = applyGuardedStateDelta(baseSave(), envelope, {
    expectedTurn: 57, actionId: 'a57', turnId: 't57', playerAction: '나 발기했어 제나씨. 부탁해.',
    parsedStory: parsed, master, npcIds, storyText: TURN57_STORY
  });

  // 가짜 근거에 의존한 변화는 폐기
  assert.equal(merged.nextSave.npc_stats.heroine3.affinity, 12, '근거 없는 affinity -2는 폐기');
  assert.equal(merged.nextSave.npc_stats.heroine3.csa_acceptance, 65, '근거 없는 csa_acceptance 변경은 폐기');
  assert.equal(merged.nextSave.npc_relationship_state.heroine3.current_boundary, 'cautious_professional', '근거 없는 current_boundary 변경은 폐기');
  // 실제 Story에 존재하는 감정 evidence는 독립적으로 통과
  assert.equal(merged.nextSave.npc_emotion.heroine3.mood, '불안', 'Story 실존 감정 evidence는 허용');
  // warning 확인
  const warnings = merged.warnings.join(' ');
  assert.ok(warnings.includes('evidence_quote_not_in_story:npc_stats.heroine3.affinity'), warnings);
  assert.ok(warnings.includes('evidence_quote_not_in_story:npc_stats.heroine3.csa_acceptance'), warnings);
  assert.ok(warnings.includes('evidence_quote_not_in_story:npc_relationship_state.heroine3.current_boundary'), warnings);

  // turn summary — Extract 문장이 아니라 Story 텍스트에서 결정론적으로 생성
  const summary = buildDeterministicTurnSummary(parsed, TURN57_STORY);
  assert.ok(!summary.includes('정식으로 항의'), 'summary에 가짜 문구 없음');
  assert.ok(!summary.includes('인사팀'), 'summary에 가짜 문구 없음');
  assert.ok(!summary.includes('자리에서 일어나'), 'summary에 가짜 문구 없음');
  assert.ok(!summary.includes('월권'), 'summary에 가짜 문구 없음');
  assert.ok(summary.includes('하얘졌다'), 'summary는 실제 Story 텍스트 기반 (앞부분 서사)');
  assert.ok(summary.length <= 500, 'summary는 최대 길이 제한');
});

// ── fixture 2: Story에 근거가 있는 blocked 부정 변화는 허용 ──────────────────

test('golden 2: blocked 턴이어도 Story 근거가 있으면 부정 변화는 저장된다', () => {
  const story = `[1. 서사 및 행동]
[SCENE]
김제나가 책상에서 벌떡 일어났다. 눈에 분노가 가득했다. 그녀는 주먹을 꽉 쥐며 말했다.

[DIALOGUE speaker_id="heroine3" acting_direction="주먹을 쥐고 목소리를 높인다."]
지금 그 말은 정말로 실례예요. 저는 이만 나가서 일하겠습니다.

[2. 플레이어 속마음]
"아... 완전히 화났네."

[3. 플레이어 상황판]
- 이름: 금태양 / 감사실 임원

[4. 선택지]
1. 사과하고 물러선다
2. 뒤쫓아가 사과한다
3. 가만히 서서 상황을 지켜본다
4. 다른 NPC에게 상황을 묻는다`;

  const extract = {
    outcome: 'blocked',
    turn_summary: '김제나가 화를 내며 자리를 떴다.',
    state_delta: {
      npc_stats: { heroine3: { affinity: -3 } },
      npc_relationship_state: { heroine3: { current_boundary: 'explicitly_refusing_improper_request' } }
    },
    evidence: {
      affinity_change: {
        quote: '김제나가 책상에서 벌떡 일어났다. 눈에 분노가 가득했다.',
        changed: ['npc_stats.heroine3.affinity']
      },
      boundary_change: {
        quote: '지금 그 말은 정말로 실례예요. 저는 이만 나가서 일하겠습니다.',
        changed: ['npc_relationship_state.heroine3.current_boundary']
      }
    },
    choices: [],
    npcs_present: ['heroine3'],
    action_target_id: 'heroine3',
    focal_character_id: 'heroine3',
    elapsed_minutes: 5
  };

  const parsed = parseNarrative(story, { master });
  const envelope = normalizeGameplayExtractEnvelope(extract, { parsedStory: parsed, npcIds });
  const merged = applyGuardedStateDelta(baseSave(), envelope, {
    expectedTurn: 57, actionId: 'a57b', turnId: 't57b', playerAction: '부탁한다',
    parsedStory: parsed, master, npcIds, storyText: story
  });

  assert.equal(merged.nextSave.npc_stats.heroine3.affinity, 9, 'Story 근거 있는 affinity 하락은 허용 (12-3)');
  assert.equal(merged.nextSave.npc_relationship_state.heroine3.current_boundary, 'explicitly_refusing_improper_request', 'Story 근거 있는 boundary 전이는 허용');
});

// ── fixture 3: 선택지 보존·보충 후 save/history 일치 ────────────────────────

test('golden 3: 선택지 1~3개 보존·보충 — last_choices가 유일 writer', () => {
  const story = `[1. 서사 및 행동]
[SCENE]
김제나가 말을 이어갔다.

[DIALOGUE speaker_id="heroine3"]
네, 알겠습니다.

[2. 플레이어 속마음]
"좋아."

[3. 플레이어 상황판]
- 이름: 금태양 / 감사실 임원

[4. 선택지]
1. "사과할게요"라며 물러선다
2. "규정을 확인할게요"라며 범위를 좁힌다`;

  const extract = {
    outcome: 'success',
    turn_summary: '',
    state_delta: {},
    choices: ['"사과할게요"라며 물러선다', '"규정을 확인할게요"라며 범위를 좁힌다', 'Extract가 만든 선택지 3', 'Extract가 만든 선택지 4'],
    npcs_present: ['heroine3'],
    focal_character_id: 'heroine3',
    elapsed_minutes: 5
  };

  const parsed = parseNarrative(story, { master });
  const envelope = normalizeGameplayExtractEnvelope(extract, { parsedStory: parsed, npcIds });
  // Story 2개 우선 보존 + Extract 2개 보충 → 4개
  assert.equal(envelope.choices.length, 4);
  assert.equal(envelope.choices[0], '"사과할게요"라며 물러선다', 'Story 선택지가 앞에 보존');
  assert.equal(envelope.choices[1], '"규정을 확인할게요"라며 범위를 좁힌다', 'Story 선택지가 앞에 보존');

  const merged = applyGuardedStateDelta(baseSave(), envelope, {
    expectedTurn: 57, actionId: 'a57c', turnId: 't57c', playerAction: '선택지 선택',
    parsedStory: parsed, master, npcIds, storyText: story
  });
  // commit의 finalChoices = nextSave.last_choices (단일 writer)
  const finalChoices = Array.isArray(merged.nextSave.last_choices) ? merged.nextSave.last_choices : [];
  assert.deepEqual(finalChoices, envelope.choices, 'save.last_choices와 Commit p_choices 후보가 정확히 일치');
  assert.equal(finalChoices.length, 4);
});

// ── fixture 4: 설명 턴의 CSA executed 차단 ───────────────────────────────────

test('golden 4: 설명·질문만 한 턴 — evidence 없이 executed 승격 금지', () => {
  const save = baseSave({
    csa_runtime_state: {}
  });
  const patch = buildCsaSceneRuntimeStatePatch({
    previousSave: save,
    csaRuntimeUpdates: [{ csa_id: 'csa_42', character_id: 'heroine3', status: 'active' }],
    csaTriggerEvaluations: [],
    activeCsa: [
      { id: 'csa_42', source_type: 'preset' },
      { id: 'csa_42_1', source_type: 'preset' }
    ],
    npcsPresent: ['heroine3'],
    turnNumber: 57,
    evidence: {},  // 규정 설명·질문만 — 실행 evidence 없음
    narrativeText: '김제나가 규정의 적용 범위를 확인하려고 했다.'
  });
  // evidence 없으면 executed 승격이 일어나지 않는다
  assert.equal(patch, null, '설명 턴에는 executed 승격 patch가 없어야 한다');
});

// ── fixture 5: trigger not_satisfied가 execution_state를 강등하지 않음 ──────

test('golden 5: trigger evaluation not_satisfied는 execution_state를 직접 강등하지 않는다', () => {
  const save = baseSave(); // csa_42 executed 상태
  const patch = buildCsaSceneRuntimeStatePatch({
    previousSave: save,
    csaRuntimeUpdates: [],
    csaTriggerEvaluations: [{ csa_id: 'csa_42', status: 'not_satisfied' }],
    activeCsa: [
      { id: 'csa_42', source_type: 'preset' },
      { id: 'csa_42_1', source_type: 'preset' }
    ],
    npcsPresent: ['heroine3'],
    turnNumber: 57,
    evidence: {},
    narrativeText: '규정이 만족되지 않았다.'
  });
  assert.equal(patch, null, 'trigger evaluation은 execution_state를 바꾸지 않는다 (patch 없음)');
});

// ── fixture 6: 발기 + 부탁해 direct CSA 요청 판별 ───────────────────────────

test('golden 6: "발기했어 + 부탁해"는 csa_direct, "부탁해" 단독은 아니다', () => {
  const save = baseSave();
  // 발기 고백 + 부탁 → 의미 연결(성적 긴장↔발기) + 요청 표현(부탁해)
  const direct = resolveCsaDirectCoverage(save, '그렇지. 나 발기했어 제나씨. 부탁해. 제나씨 속옷차림이 너무 이뻐서...', { master, characters: master.characters });
  assert.equal(direct.covered, true, '발기+부탁해는 csa_direct');
  assert.equal(direct.route, 'csa_direct');

  // 연결 표현 없이 부탁해만 → csa_direct 아님
  const bare = resolveCsaDirectCoverage(save, '제나씨 부탁해', { master, characters: master.characters });
  assert.equal(bare.covered, false, '부탁해 단독은 csa_direct 아님');

  // 질문 → csa_direct 아님
  const question = resolveCsaDirectCoverage(save, '발기라는 게 규정상 무슨 뜻인가?', { master, characters: master.characters });
  assert.equal(question.covered, false, '발기 질문은 csa_direct 아님');

  // 의무형 질문 → csa_direct 아님
  const obligation = resolveCsaDirectCoverage(save, '규정을 지켜야 하나', { master, characters: master.characters });
  assert.equal(obligation.covered, false, '의무형 질문은 csa_direct 아님');

  // 명시적 규정 실행 요청은 direct 유지
  const explicit = resolveCsaDirectCoverage(save, '규정대로 성적 긴장을 완화해 주세요', { master, characters: master.characters });
  assert.equal(explicit.covered, true, '명시적 실행 요청은 csa_direct 유지');
});
