import test from 'node:test';
import assert from 'node:assert/strict';

import { applyGuardedStateDelta } from '../src/engine/guarded-merge.js';
import { buildCsaRuntimeStatePatch as buildCsaSceneRuntimeStatePatch } from '../src/engine/csa/reducer.js';
import { calculateCsaProgression } from '../src/engine/progression.js';
import { parseNarrative } from '../src/engine/narrative-parser.js';
import { normalizeGameplayExtractEnvelope } from '../src/engine/gameplay-state.js';
import { buildStoryContextProjection } from '../src/engine/story-prompt.js';

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
    last_choice_meta: [],
    ...overrides
  };
}

const master = {
  characters: [
    { character_id: 'heroine3', name: '김제나', gender: 'female', role: '브랜드전략팀 신입' }
  ]
};
const npcIds = new Set(['heroine3']);

function envelope(overrides = {}) {
  return {
    outcome: 'success', state_delta: {}, evidence: {}, turn_summary: '', mind_monitor: {},
    choices: [], dialogue_lines: [], npcs_present: ['heroine3'], action_target_id: 'heroine3',
    focal_character_id: 'heroine3', last_speaker_id: 'heroine3', image_character_id: null,
    player_inner_thought: '', player_status: '', elapsed_minutes: 5,
    csa_trigger_evaluations: [], csa_runtime_updates: [],
    ...overrides
  };
}

function merge(save, extract, storyText, turn = 57) {
  const parsed = parseNarrative(storyText, { master });
  const normalized = normalizeGameplayExtractEnvelope(extract, { parsedStory: parsed, npcIds });
  return applyGuardedStateDelta(save, normalized, {
    expectedTurn: turn, actionId: `a${turn}`, turnId: `t${turn}`, playerAction: '행동',
    parsedStory: parsed, master, npcIds, storyText
  });
}

const TURN57_STORY = `[1. 서사 및 행동]
[SCENE]
김제나가 숨을 깊게 들이쉬고 나를 올려다봤다.

[DIALOGUE speaker_id="heroine3" acting_direction="목소리를 절제된 낮은 톤으로 유지한다."]
저는... 그 규정이 '동료의 컨디션을 확인하는 상황'에서 적용되는 걸로 이해했어요. 그런데 갑자기 그런 걸 부탁하시는 건... 규정 범위를 넘어서는 거라고 생각해요.

[SCENE]
그녀의 말은 또렷했지만, 목소리 끝은 살짝 떨렸다.

[DIALOGUE speaker_id="heroine3" acting_direction="나지막하고 조심스러운 목소리로 덧붙인다."]
그리고... 그런 표현은 저한테 조금... 부담스러워요. 저희 업무적으로만 봐주시면 안 될까요?

[2. 플레이어 속마음]
"완전 거절당했네. 일단 물러서는 게 낫겠다."

[3. 플레이어 상황판]
- 이름: 금태양 / 감사실 임원
- 장소: 브랜드전략팀 사무실 (3층)
- Day 1, 17:23 (현재 턴 57)

[4. 선택지]
1. "미안해요, 선을 넘었네요"라며 사과하고 물러선다
2. "그래도 규정이 규정이니까, 컨디션 확인은 해야겠어요"라며 규정을 근거로 설득한다
3. "알겠어요. 그럼 속옷 차림 규정은 준수하고 있는지 정도만 확인할게요"라며 범위를 좁힌다
4. "부담스러웠다면 사과할게요. 근데 이유가 궁금하네요"라며 묻는다`;

// ── 회귀: npc_stats는 Extract 의미 분석에 맡긴다 (Story quote gate 없음) ─────

test('회귀: npc_stats delta는 Story evidence 없이도 Extract 의미 분석으로 저장된다 (음수 포함)', () => {
  const storyText = TURN57_STORY;
  // Story에 없는 가짜 근거 문구가 있어도 npc_stats는 Commit 범위 검증만 통과하면 저장된다.
  const extract = envelope({
    state_delta: { npc_stats: { heroine3: { affinity_delta: -2, csa_acceptance_delta: -10 } } },
    evidence: { affinity_change: { quote: '김제나는 자리에서 일어나며 차갑게 말했다.', changed: ['npc_stats.heroine3.affinity'] } }
  });
  const merged = merge(baseSave(), extract, storyText);
  assert.equal(merged.nextSave.npc_stats.heroine3.affinity, 10, 'affinity -2 저장 (12-2)');
  assert.equal(merged.nextSave.npc_stats.heroine3.csa_acceptance, 55, 'csa_acceptance -10 저장 (65-10)');
});

// ── 회귀: degraded Extract에서는 npc_stats 변화 없음 ────────────────────────

test('회귀: degraded Extract에서는 npc_stats 변경이 무시된다', () => {
  const extract = envelope({
    outcome: 'degraded',
    state_delta: { npc_stats: { heroine3: { affinity: -2 } } }
  });
  const merged = merge(baseSave(), extract, TURN57_STORY);
  assert.equal(merged.nextSave.npc_stats.heroine3.affinity, 12, 'degraded에서는 affinity 유지');
  assert.ok(merged.warnings.some(w => w.startsWith('npc_stats_degraded_ignored')), merged.warnings.join(' '));
});

// ── 회귀: resistance 변경은 항상 무시 ───────────────────────────────────────

test('회귀: resistance는 npc_stats 변경 대상이 아니다 (reducer가 보존)', () => {
  // positive affinity_delta는 exact quote 필요 (지시 6) — 배려 장면 quote를 함께 준다.
  const extract = envelope({
    state_delta: { npc_stats: { heroine3: { resistance_delta: 10, affinity_delta: 2 } } },
    evidence: { npc_stats: { heroine3: { affinity: { quote: '그가 먼저 다가와 자리를 정리해 주었다.' } } } }
  });
  const merged = merge(baseSave(), extract, '그가 먼저 다가와 자리를 정리해 주었다. heroine3는 고마워했다.');
  assert.equal(merged.nextSave.npc_stats.heroine3.resistance, 35, 'resistance 보존');
  assert.equal(merged.nextSave.npc_stats.heroine3.affinity, 14, 'affinity는 적용');
});

// ── 회귀: relationship_summary는 폐기되고 기존 값 유지 ───────────────────────

test('회귀: Extract relationship_summary는 무시되고 기존 save 값이 유지된다', () => {
  const extract = envelope({
    state_delta: {
      npc_relationship_state: {
        heroine3: {
          relationship_summary: '김제나가 정식으로 항의하고 규정의 남용을 지적한다.',
          current_boundary: 'explicitly_refusing_improper_request'
        }
      }
    },
    evidence: {
      boundary_change: {
        quote: '저는... 그 규정이 \'동료의 컨디션을 확인하는 상황\'에서 적용되는 걸로 이해했어요.',
        changed: ['npc_relationship_state.heroine3.current_boundary']
      }
    }
  });
  const merged = merge(baseSave(), extract, TURN57_STORY);
  assert.equal(merged.nextSave.npc_relationship_state.heroine3.relationship_summary, '기존 관계 요약', '기존 summary 유지');
  assert.ok(merged.warnings.includes('extract_relationship_summary_ignored:heroine3'), merged.warnings.join(' '));
});

// ── 회귀: current_boundary는 evidence.changed path가 있어야 저장 ─────────────

test('회귀: current_boundary 변경은 changed 배열에 정확한 path가 있는 evidence만 허용', () => {
  // evidence가 아예 없으면 폐기
  const noEvidence = merge(baseSave(), envelope({
    state_delta: { npc_relationship_state: { heroine3: { current_boundary: 'explicitly_refusing_improper_request' } } }
  }), TURN57_STORY);
  assert.equal(noEvidence.nextSave.npc_relationship_state.heroine3.current_boundary, 'cautious_professional', 'evidence 없으면 폐기');
  assert.ok(noEvidence.warnings.some(w => w.startsWith('evidence_missing:npc_relationship_state')), noEvidence.warnings.join(' '));

  // Story에 있는 quote + 정확한 changed path → 저장
  const withEvidence = merge(baseSave(), envelope({
    state_delta: { npc_relationship_state: { heroine3: { current_boundary: 'explicitly_refusing_improper_request' } } },
    evidence: {
      boundary_change: {
        quote: '저는... 그 규정이 \'동료의 컨디션을 확인하는 상황\'에서 적용되는 걸로 이해했어요.',
        changed: ['npc_relationship_state.heroine3.current_boundary']
      }
    }
  }), TURN57_STORY);
  assert.equal(withEvidence.nextSave.npc_relationship_state.heroine3.current_boundary, 'explicitly_refusing_improper_request', '근거 있는 boundary 전이는 허용');
});

// ── 회귀: 선택지 4개 / 2개 보존+보충 / 0개 fallback ─────────────────────────

test('회귀: Story 선택지 4개는 그대로 저장·표시된다', () => {
  const parsed = parseNarrative(TURN57_STORY, { master });
  const normalized = normalizeGameplayExtractEnvelope(envelope({ choices: ['Extract가 만든 것'] }), { parsedStory: parsed, npcIds });
  assert.equal(normalized.choices.length, 4, 'Story 4개 그대로');
  assert.equal(normalized.choices[0], '"미안해요, 선을 넘었네요"라며 사과하고 물러선다', 'Story 선택지 유지');
});

test('회귀: Story 선택지 2개면 2개 보존 + 2개 보충 (guarded-merge)', () => {
  const story2 = `[1. 서사 및 행동]
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
  const extract = envelope({ choices: ['Extract가 만든 선택지'] });
  const merged = merge(baseSave(), extract, story2);
  assert.equal(merged.nextSave.last_choices.length, 4, '4개로 보충');
  assert.equal(merged.nextSave.last_choices[0], '"사과할게요"라며 물러선다', 'Story 선택지 보존');
  assert.equal(merged.nextSave.last_choices[1], '"규정을 확인할게요"라며 범위를 좁힌다', 'Story 선택지 보존');
});

test('회귀: Story 선택지 0개여도 UI 안전 기본 4개가 채워진다', () => {
  const story0 = `[1. 서사 및 행동]
[SCENE]
김제나가 고개를 끄덕였다.

[2. 플레이어 속마음]
"좋아."

[3. 플레이어 상황판]
- 이름: 금태양 / 감사실 임원`;
  const merged = merge(baseSave(), envelope(), story0);
  assert.equal(merged.nextSave.last_choices.length, 4, '기본 4개 보충');
});

// ── 회귀: 모호한 자연어 CSA 요청은 단어 규칙으로 blocked 확정하지 않는다 ─────

test('회귀: trigger evaluation not_satisfied는 execution_state를 강등하지 않는다', () => {
  const save = baseSave();
  const result = buildCsaSceneRuntimeStatePatch({
    previousSave: save,
    csaRuntimeUpdates: [],
    csaTriggerEvaluations: [{ csa_id: 'csa_42', status: 'not_satisfied' }],
    activeCsa: [
      { id: 'csa_42', source_type: 'preset' },
      { id: 'csa_42_1', source_type: 'preset' }
    ],
    npcsPresent: ['heroine3'],
    turnNumber: 57
  });
  assert.equal(result.patch, null, 'trigger evaluation은 execution_state를 바꾸지 않는다');
});

// ── 회귀: state_delta.csa_runtime_state 중복 채널 차단 ───────────────────────

test('회귀: state_delta.csa_runtime_state는 무시되고 warning만 남는다', () => {
  const extract = envelope({
    state_delta: { csa_runtime_state: { csa_42: { execution_state: 'not_started' } } }
  });
  const merged = merge(baseSave(), extract, TURN57_STORY);
  assert.equal(merged.nextSave.csa_runtime_state.csa_42.execution_state, 'executed', '기존 상태 유지');
  assert.ok(merged.warnings.includes('duplicate_csa_runtime_channel_ignored'), merged.warnings.join(' '));
});

// ── 회귀: 최신 3턴 원문 전체가 Story context에 포함 (500자 절단 없음) ────────

test('회귀: 최신 3턴 story_text 전체가 Story context recent_turns에 포함된다', () => {
  const longStory = '[1. 서사 및 행동]\n[SCENE]\n' + '김제나가 길게 설명했다. '.repeat(60) + '\n[2. 플레이어 속마음]\n"좋아."\n[3. 플레이어 상황판]\n- 이름: 금태양\n[4. 선택지]\n1. 선택지1\n2. 선택지2\n3. 선택지3\n4. 선택지4';
  const context = {
    game: { id: 'g1', title: 't' },
    save: { data: baseSave() },
    recent_turns: [
      { turn_number: 54, player_action: '54턴', story_text: longStory, parsed_blocks: {}, choices: ['a', 'b', 'c', 'd'] },
      { turn_number: 55, player_action: '55턴', story_text: longStory, parsed_blocks: {}, choices: ['a', 'b', 'c', 'd'] },
      { turn_number: 56, player_action: '56턴', story_text: longStory, parsed_blocks: {}, choices: ['a', 'b', 'c', 'd'] }
    ]
  };
  const projection = buildStoryContextProjection(context, ['heroine3'], { catalogs: { departments: [], positions: [] }, playerAction: '행동' });
  assert.equal(projection.recent_turns.length, 3, '최신 3턴');
  for (const turn of projection.recent_turns) {
    assert.equal(turn.story_text, longStory, 'story_text 원문 전체 (절단 없음)');
    assert.ok(turn.story_text.length > 500, '500자 초과 유지');
    assert.equal('turn_summary' in turn, false, 'turn_summary 필드 없음');
  }
});

// ── 회귀: 선택지 metadata는 사용하지 않는다 ──────────────────────────────────

test('회귀: choice_structured_meta는 envelope에 존재하지 않는다', () => {
  const normalized = normalizeGameplayExtractEnvelope(envelope({
    choice_structured_meta: [{ choice_index: 0, action_types: ['kiss'] }]
  }), { parsedStory: { choices: ['a', 'b', 'c', 'd'] }, npcIds });
  assert.equal('choice_structured_meta' in normalized, false, 'choice_structured_meta 제거');
});

// ── 회귀: 진행도(authority 누수) — reducer가 승인한 실행만 exp 반영 ──────────

function runtimeWith(previousSave, updates, activeCsa, npcsPresent, turnNumber) {
  return buildCsaSceneRuntimeStatePatch({
    previousSave, csaRuntimeUpdates: updates, csaTriggerEvaluations: [],
    activeCsa, npcsPresent, turnNumber
  });
}

const ACTIVE_FIXTURE = [
  { id: 'csa_42', active: true, source_type: 'preset', content: '동료의 성적 긴장을 완화한다', preset: { required_action: 'relieve_sexual_tension' } },
  { id: 'csa_42_1', active: true, source_type: 'preset', content: '근무 중 속옷 차림을 유지한다', preset: { required_action: 'work_in_underwear_only' } }
];

test('회귀 A: action_state 불일치 active update는 경험·EXP에 반영되지 않는다', () => {
  const save = baseSave();
  const result = runtimeWith(save, [
    { csa_id: 'csa_42', character_id: 'heroine3', status: 'active', action_state: 'unrelated_action' }
  ], ACTIVE_FIXTURE, ['heroine3'], 57);
  // runtime 변화 없음
  assert.equal(result.patch, null, '불일치 update는 patch 없음');
  assert.ok(result.warnings.includes('csa_runtime_action_state_mismatch:csa_42:unrelated_action'), result.warnings.join(' '));
  assert.equal(result.accepted_executions.length, 0, 'accepted_executions 없음');
  // 진행도 — 승인된 실행만 전달되므로 경험·EXP 없음
  const progression = calculateCsaProgression({
    csaOperations: [], experiencedThisTurn: result.accepted_executions, previouslyExperienced: new Set()
  });
  assert.equal(progression.newly_experienced_keys.length, 0, 'csa_experienced_ids 추가 없음');
  assert.equal(progression.amount, 0, 'EXP 증가 없음');
});

test('회귀 B: 장면에 없는 character_id의 active update는 경험·EXP에 반영되지 않는다', () => {
  const save = baseSave();
  const result = runtimeWith(save, [
    { csa_id: 'csa_42', character_id: 'heroine999', status: 'active', action_state: 'relieve_sexual_tension' }
  ], ACTIVE_FIXTURE, ['heroine3'], 57);
  assert.equal(result.patch, null, '장면 밖 character는 runtime 변화 없음');
  assert.equal(result.accepted_executions.length, 0, 'accepted_executions 없음');
  const progression = calculateCsaProgression({
    csaOperations: [], experiencedThisTurn: result.accepted_executions, previouslyExperienced: new Set()
  });
  assert.equal(progression.newly_experienced_keys.length, 0, '경험 ID 추가 없음');
  assert.equal(progression.amount, 0, 'EXP 증가 없음');
});

test('회귀 C: 유효한 active update는 executed + accepted_executions + 진행도 반영', () => {
  const save = baseSave();
  const result = runtimeWith(save, [
    { csa_id: 'csa_42', character_id: 'heroine3', status: 'active', action_state: 'relieve_sexual_tension' }
  ], ACTIVE_FIXTURE, ['heroine3'], 57);
  assert.equal(result.patch.csa_42.execution_state, 'executed', '실행 승격');
  assert.deepEqual(result.accepted_executions, [{ csa_id: 'csa_42', character_id: 'heroine3' }], '승인 목록 포함');
  const progression = calculateCsaProgression({
    csaOperations: [], experiencedThisTurn: result.accepted_executions, previouslyExperienced: new Set()
  });
  assert.deepEqual(progression.newly_experienced_keys, ['heroine3:csa_42'], '새 경험 ID 기록');
  assert.equal(progression.amount, 2, '새 경험 EXP 반영');
});

test('회귀 D: 이미 경험한 실행을 다시 수행하면 기존 진행도 정책 유지 (+1만)', () => {
  const result = runtimeWith(baseSave(), [
    { csa_id: 'csa_42', character_id: 'heroine3', status: 'active', action_state: 'relieve_sexual_tension' }
  ], ACTIVE_FIXTURE, ['heroine3'], 57);
  const progression = calculateCsaProgression({
    csaOperations: [], experiencedThisTurn: result.accepted_executions,
    previouslyExperienced: new Set(['heroine3:csa_42'])
  });
  assert.equal(progression.newly_experienced_keys.length, 0, '재경험은 새 ID 없음');
  assert.equal(progression.amount, 1, '재경험은 +1만');
});
