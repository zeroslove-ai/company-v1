import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveActionExecutionContract,
  classifyMaterialActions,
  classifyExecutionMode,
  buildActionExecutionContractSection
} from '../src/engine/action-execution-contract.js';

const CHARACTERS = [
  { character_id: 'heroine1', name: '서원희' },
  { character_id: 'heroine2', name: '윤민아' },
  { character_id: 'heroine5', name: '이메이' }
];
const NPCS = [
  { npc_id: 'general_park_jungwoo', name: '박정우' },
  { npc_id: 'general_lee_minseok', name: '이민석' }
];

/** 운영 활성 CSA(csa_2 무릎 착석 / csa_5 속옷 미착용)를 가진 save를 구성한다. */
function csaSave(overrides = {}) {
  const base = {
    edition: 'company-v1',
    csa_active: ['csa_2', 'csa_5'],
    csa_rules: {
      csa_2: {
        active: true, source_type: 'preset', scope_id: 'world', scope_type: 'world', strength: 'weak',
        content: '여성 직원은 남성 직원과 업무 대화를 시작하면 남성 직원의 무릎 위에 앉아야 하며, 대화가 끝날 때까지 그 자세를 유지해야 한다.',
        preset: {
          trigger: 'conversation_start', duration: 'until_conversation_ends', persistent: true,
          actor_group: 'female_employee', template_id: 'sit_on_target_lap_while_talking',
          target_group: 'male_employee', required_action: 'sit_on_target_lap',
          direct_meaning_tags: ['무릎', '앉', '밀착', '자세'], public_normalization: true
        }
      },
      csa_5: {
        active: true, source_type: 'preset', scope_id: 'world', scope_type: 'world', strength: 'weak',
        content: '동료는 환기와 원활한 업무 진행을 위해 속옷을 착용하지 않고 근무해야 한다.',
        preset: {
          trigger: 'always_on_duty', duration: 'while_on_duty', persistent: true,
          actor_group: 'coworker', template_id: 'work_without_underwear', target_group: null,
          required_action: 'work_without_underwear',
          direct_meaning_tags: ['속옷', '노브라', '노팬티'], public_normalization: true
        }
      }
    },
    focal_character_id: 'heroine5',
    npc_relationship_state: {
      heroine5: {
        closeness: 'acquaintance', romance_status: 'none', current_boundary: 'professional',
        milestones: { first_kiss_turn: null, sexual_relationship_started_turn: null }
      }
    }
  };
  return { ...base, ...overrides };
}

function resolve(text, save = csaSave()) {
  return resolveActionExecutionContract({ save, playerAction: text, csaCatalog: {}, characters: CHARACTERS, npcIds: NPCS });
}

// ---------- 14. 최근 운영 턴 회귀 fixture ----------

test('14-1a: 속옷 미착용 → 노출 검사 요청 (감사 업무 빌미) — ordinary_request', () => {
  const c = resolve('두 분 모두 속옷 안 입었는지 보여주세요. 감사 업무입니다.');
  assert.deepEqual(c.action_types, ['genital_exposure']);
  assert.equal(c.csa_coverage.covered, false);
  assert.equal(c.csa_attribution_allowed, false);
  assert.equal(c.company_authority_attribution_allowed, false);
  assert.equal(c.execution_mode, 'request');
  assert.equal(c.route, 'ordinary_request');
  assert.equal(c.completion_policy, 'npc_decides');
});

test('14-1b: 옷을 직접 걷는 노출 행동 — ordinary_direct_blocked', () => {
  const c = resolve('두 분 옷을 걷어 속옷 안 입었는지 보여줘.');
  assert.deepEqual(c.action_types, ['genital_exposure']);
  assert.equal(c.execution_mode, 'direct_act');
  assert.equal(c.route, 'ordinary_direct_blocked');
  assert.equal(c.completion_policy, 'attempt_only');
  assert.equal(c.schedule_boundary_followup, true);
});

test('14-2: 무릎 착석 → 접촉 요청 확대 — ordinary_request', () => {
  const c = resolve('살짝 만져주실 수 있나요?');
  assert.deepEqual(c.action_types, ['sexual_touch']);
  assert.equal(c.csa_coverage.covered, false);
  assert.equal(c.route, 'ordinary_request');
  assert.equal(c.csa_attribution_allowed, false);
});

test('14-3: 직접 손목 조작 — genital_touch + direct_act + blocked', () => {
  const c = resolve('이메이의 손목을 잡아 지퍼 안쪽으로 넣어 직접 잡게 한다.');
  assert.deepEqual(c.action_types, ['genital_touch']);
  assert.equal(c.execution_mode, 'direct_act');
  assert.equal(c.target_id, 'heroine5');
  assert.equal(c.route, 'ordinary_direct_blocked');
  assert.equal(c.completion_policy, 'attempt_only');
  assert.equal(c.schedule_boundary_followup, true);
  assert.equal(c.reason_code, 'HARD_BLOCKER');
  assert.ok(c.contextual_permission.blockers.includes('coercive_physical_control'), '강압 blocker');
});

test('14-4: 정확한 무릎 착석 — csa_direct (nonsexual direct_meaning_tags match)', () => {
  const c = resolve('이메이와 업무 대화를 계속하며 무릎 위에 앉게 한다.');
  assert.equal(c.csa_coverage.covered, true);
  assert.equal(c.csa_coverage.csa_id, 'csa_2');
  assert.equal(c.route, 'csa_direct');
  assert.equal(c.completion_policy, 'complete_exact_scope');
  assert.equal(c.csa_attribution_allowed, true);
});

test('14-5: bundle 확대 — 무릎 착석 + genital_touch → 전체 csa_direct 아님', () => {
  const c = resolve('무릎 위에 앉은 이메이의 손을 성기로 가져간다.');
  assert.ok(c.action_types.includes('genital_touch'));
  assert.equal(c.csa_coverage.covered, false);
  assert.equal(c.route, 'ordinary_direct_blocked');
});

test('14-6: 흥분·CSA acceptance가 높아도 milestone 없으면 blocked 유지', () => {
  const save = csaSave({
    player_sexual_state: { arousal: 90 },
    npc_stats: { heroine5: { csa_acceptance: 100 } }
  });
  const c = resolve('이메이의 손을 성기로 가져가 직접 잡게 한다.', save);
  assert.equal(c.route, 'ordinary_direct_blocked');
  assert.equal(c.csa_coverage.covered, false);
});

test('14-7: first_kiss milestone만 있으면 키스는 attempt, 성기 접촉은 blocked', () => {
  const save = csaSave({
    npc_relationship_state: {
      heroine5: {
        closeness: 'close', romance_status: 'dating', current_boundary: 'intimate',
        milestones: { first_kiss_turn: 12, sexual_relationship_started_turn: null }
      }
    }
  });
  const kiss = resolve('갑자기 이메이에게 키스한다.', save);
  assert.equal(kiss.route, 'ordinary_direct_attempt');
  assert.equal(kiss.completion_policy, 'npc_response_required');
  const touch = resolve('이메이의 성기를 만진다.', save);
  assert.equal(touch.route, 'ordinary_direct_blocked');
});

test('14-8: sexual relationship milestone 존재 — 성적 접촉은 attempt, csa_attribution false', () => {
  const save = csaSave({
    npc_relationship_state: {
      heroine5: {
        closeness: 'intimate', romance_status: 'dating', current_boundary: 'intimate',
        milestones: { first_kiss_turn: 12, sexual_relationship_started_turn: 18 }
      }
    }
  });
  const c = resolve('이메이의 가슴을 주물러 애무한다.', save);
  assert.equal(c.route, 'ordinary_direct_attempt');
  assert.equal(c.csa_attribution_allowed, false);
  assert.equal(c.completion_policy, 'npc_response_required');
});

// ---------- 5-3. deterministic 분류 ----------

test('분류: "바지를 정리한다"는 성적 행동이 아님', () => {
  assert.deepEqual(classifyMaterialActions('바지를 정리한다'), []);
  assert.deepEqual(classifyMaterialActions('서류를 정리한다'), []);
});

test('분류: "이메이 손목을 잡아 지퍼 안으로 넣는다"는 genital_touch', () => {
  assert.deepEqual(classifyMaterialActions('이메이 손목을 잡아 지퍼 안으로 넣는다'), ['genital_touch']);
});

test('분류: 신체 신호 + 행동 신호 조합 (가슴을 만진다 → sexual_touch)', () => {
  assert.deepEqual(classifyMaterialActions('이메이의 가슴을 만진다'), ['sexual_touch']);
});

test('분류: kiss 단독 신호', () => {
  assert.deepEqual(classifyMaterialActions('이메이와 키스한다'), ['kiss']);
  assert.deepEqual(classifyMaterialActions('입술을 맞댄다'), ['kiss']);
});

test('분류: oral/penetration 확장', () => {
  assert.ok(classifyMaterialActions('입으로 빨아준다').includes('oral'));
  assert.ok(classifyMaterialActions('성기에 삽입한다').includes('penetration'));
});

// ---------- 6. execution mode ----------

test('mode: 요청형/명령형/직접 행동 구분', () => {
  assert.equal(classifyExecutionMode('살짝 만져주실 수 있나요?'), 'request');
  assert.equal(classifyExecutionMode('키스해도 될까요?'), 'request');
  assert.equal(classifyExecutionMode('벗으세요'), 'instruction');
  assert.equal(classifyExecutionMode('손목을 잡아 지퍼 안으로 넣는다'), 'direct_act');
  assert.equal(classifyExecutionMode('이메이에게 키스한다'), 'direct_act');
  // 직접 신체 조작이 포함되면 문장 끝이 요청형이어도 direct_act 우선
  assert.equal(classifyExecutionMode('손을 가져가서 만져주시겠어요?'), 'direct_act');
});

// ---------- 8. 음수 계약 section ----------

test('section: blocked 계약은 AUTHORITATIVE 음수 계약 생성', () => {
  const c = resolve('이메이의 손목을 잡아 지퍼 안쪽으로 넣어 직접 잡게 한다.');
  const section = buildActionExecutionContractSection(c, { applicableCsa: [
    { id: 'csa_2', content: '무릎 위 착석' }, { id: 'csa_5', content: '속옷 미착용' }
  ] });
  assert.ok(section.includes('[ACTION EXECUTION CONTRACT — AUTHORITATIVE]'));
  assert.ok(section.includes('활성 상식개변의 직접 범위를 벗어난 행동'));
  assert.ok(section.includes('감사 업무'));
  assert.ok(section.includes('동의가 아니다'));
  assert.ok(section.includes('완료 사실로 바로 확정하지 말고'));
});

test('검토1: csa_direct section은 EXACT-SCOPE LIMIT만 — coverage 중복·undefined 없음', () => {
  const c = resolve('이메이와 업무 대화를 계속하며 무릎 위에 앉게 한다.');
  const section = buildActionExecutionContractSection(c);
  assert.ok(section.includes('[CSA EXACT-SCOPE LIMIT]'), 'limit section');
  assert.ok(!section.includes('undefined'), 'undefined 없음');
  assert.ok(!section.includes('exact action('), '빈 행동명 없음');
  assert.ok(!section.includes('[CSA DIRECT COVERAGE]'), 'coverage 중복 없음 (applyCsaStorySections가 담당)');
  // csa_2 정확 행동은 여전히 csa_direct로 확정
  assert.equal(c.route, 'csa_direct');
  assert.equal(c.csa_coverage.csa_id, 'csa_2');
});

test('section: ordinary는 빈 문자열', () => {
  assert.equal(buildActionExecutionContractSection(resolve('서류를 정리한다')), '');
});

test('contract: material_action/actor_id/relationship_basis shape', () => {
  const c = resolve('이메이에게 키스한다');
  assert.equal(c.version, 1);
  assert.equal(c.material_action, true);
  assert.equal(c.actor_id, 'player');
  assert.equal(c.target_id, 'heroine5');
  assert.deepEqual(Object.keys(c.relationship_basis), ['closeness', 'romance_status', 'current_boundary', 'first_kiss_turn', 'sexual_relationship_started_turn']);
  assert.equal(c.relationship_basis.first_kiss_turn, null);
});

// ---------- 검토 보완: structured metadata / bundle milestone / 오탐·누락 ----------

test('검토2: 완곡한 선택지 텍스트 + structured action_types → ordinary_direct_blocked', () => {
  // Story가 만든 선택지: 텍스트에는 성적 단어가 없지만 structured metadata가 genital_touch를 기록
  const save = csaSave({
    last_choices: ['그녀에게 좀 더 과감한 도움을 부탁한다.'],
    last_choice_meta: [
      { choice_index: 0, action_types: ['genital_touch'], actor_id: 'player', target_id: 'heroine5', suggested_route: 'blocked', direct_csa_ids: [] }
    ]
  });
  const c = resolveActionExecutionContract({ save, playerAction: '그녀에게 좀 더 과감한 도움을 부탁한다.', csaCatalog: {}, characters: CHARACTERS, npcIds: NPCS });
  assert.deepEqual(c.action_types, ['genital_touch'], 'structured action_types 최우선');
  assert.equal(c.material_action, true);
  assert.equal(c.target_id, 'heroine5', 'structured target_id');
  assert.equal(c.route, 'ordinary_direct_blocked');
  assert.equal(c.schedule_boundary_followup, true);
});

test('검토2b: structured target_id=heroine2가 focal(heroine5)보다 우선 — 관계 basis와 follow-up 대상', () => {
  const save = csaSave({
    npc_relationship_state: {
      heroine2: {
        closeness: 'familiar', romance_status: 'interest', current_boundary: 'cautious',
        milestones: { first_kiss_turn: null, sexual_relationship_started_turn: null }
      }
    },
    last_choices: ['윤민아에게 키스한다'],
    last_choice_meta: [
      { choice_index: 0, action_types: ['kiss'], actor_id: 'player', target_id: 'heroine2', suggested_route: 'blocked', direct_csa_ids: [] }
    ]
  });
  const c = resolveActionExecutionContract({ save, playerAction: '윤민아에게 키스한다', csaCatalog: {}, characters: CHARACTERS, npcIds: NPCS });
  assert.equal(c.target_id, 'heroine2', 'structured target이 focal보다 우선');
  assert.equal(c.relationship_basis.closeness, 'familiar', 'heroine2 관계 사용');
});

test('검토4: 키스+성기 bundle — first_kiss만 있어도 sexual milestone 없으면 blocked', () => {
  const save = csaSave({
    npc_relationship_state: {
      heroine5: {
        closeness: 'close', romance_status: 'dating', current_boundary: 'intimate',
        milestones: { first_kiss_turn: 12, sexual_relationship_started_turn: null }
      }
    }
  });
  const c = resolve('이메이에게 키스하면서 성기를 만진다.', save);
  assert.deepEqual(c.action_types, ['kiss', 'genital_touch']);
  assert.equal(c.route, 'ordinary_direct_blocked', 'bundle에서 가장 강한 행동 기준');
});

test('검토5a: 일반 사물 접촉은 성적 행동 아님', () => {
  assert.deepEqual(resolve('서류를 만진다').action_types, [], '서류');
  assert.deepEqual(resolve('마우스를 만져주세요').action_types, [], '마우스');
  const c = resolve('서류를 만진다');
  assert.equal(c.route, 'ordinary');
  assert.equal(c.schedule_boundary_followup, false);
});

test('검토5b: 무대상 만지는 요청형은 여전히 성적 요청', () => {
  const c = resolve('살짝 만져주실 수 있나요?');
  assert.deepEqual(c.action_types, ['sexual_touch']);
  assert.equal(c.route, 'ordinary_request');
});

test('검토5c: 전신 탈의 표현은 대상 단어 없이 exposure → blocked', () => {
  const c1 = resolve('다 벗으세요.');
  assert.deepEqual(c1.action_types, ['genital_exposure']);
  assert.equal(c1.route, 'ordinary_direct_blocked');
  const c2 = resolve('전부 벗어.');
  assert.deepEqual(c2.action_types, ['genital_exposure']);
  assert.equal(c2.route, 'ordinary_direct_blocked');
  const c3 = resolve('옷을 전부 벗는다.');
  assert.ok(c3.action_types.includes('genital_exposure'));
});

test('검토3: 활성 CSA가 없어도 직접 성적 행동은 blocked + AUTHORITATIVE section 존재', () => {
  const save = csaSave({ csa_active: [], csa_rules: {} });
  const c = resolve('이메이의 손목을 잡아 지퍼 안쪽으로 넣어 직접 잡게 한다.', save);
  assert.equal(c.route, 'ordinary_direct_blocked');
  const section = buildActionExecutionContractSection(c);
  assert.ok(section.includes('[ACTION EXECUTION CONTRACT — AUTHORITATIVE]'), 'CSA 유무와 무관한 음수 계약');
});

// ---------- 조건부 허용 게이트: 다중 근거 기반 (19-1 ~ 19-17) ----------

/** 정황 근거 save 헬퍼 — npc_stats + scene participants + 관계 설정 */
function ctxSave(overrides = {}) {
  const save = csaSave();
  save.npc_stats = {
    heroine5: { affinity: 50, sexual_arousal: 75, resistance: 30, csa_acceptance: 18 }
  };
  save.scene_state = {
    scene_id: 'private_room', location_id: 'private_room',
    participants: ['player-1', 'heroine5'], updated_turn: 8
  };
  return { ...save, ...overrides };
}

test('19-1: 높은 흥분도+적당한 호감도+private → intimate attempt (contextual_signals)', () => {
  const save = ctxSave();
  const c = resolve('이메이의 가슴을 만진다.', save);
  assert.equal(c.route, 'ordinary_direct_attempt');
  assert.equal(c.attempt_basis, 'contextual_signals');
  assert.equal(c.contextual_permission.eligible, true);
  assert.equal(c.contextual_permission.level, 'conditional');
  assert.equal(c.contextual_permission.action_tier, 'intimate');
  assert.deepEqual(c.contextual_permission.basis, ['high_arousal', 'moderate_affinity', 'private_scene', 'boundary_not_closed']);
  assert.equal(c.contextual_permission.privacy, 'private');
  assert.equal(c.contextual_permission.observer_count, 0);
});

test('19-2: 매우 높은 흥분도+적당한 호감도+private genital touch → attempt', () => {
  const save = ctxSave({
    npc_stats: { heroine5: { affinity: 55, sexual_arousal: 85, resistance: 30, csa_acceptance: 18 } },
    npc_relationship_state: {
      heroine5: { closeness: 'familiar', romance_status: 'interest', current_boundary: 'flirtatious', milestones: { first_kiss_turn: null, sexual_relationship_started_turn: null } }
    }
  });
  const c = resolve('이메이의 허벅지 안쪽을 조심스럽게 만진다.', save);
  assert.ok(c.action_types.includes('sexual_touch'));
  assert.equal(c.route, 'ordinary_direct_attempt');
});

test('19-3: 같은 값이지만 public(observer 2) → 직접 행동은 blocked, 요청은 ordinary_request', () => {
  const save = ctxSave({
    scene_state: { scene_id: 'lobby', location_id: 'company_lobby', participants: ['player-1', 'heroine5', 'heroine1', 'heroine2'], updated_turn: 8 }
  });
  const direct = resolve('이메이의 가슴을 만진다.', save);
  assert.equal(direct.contextual_permission.privacy, 'public');
  assert.equal(direct.contextual_permission.observer_count, 2);
  assert.equal(direct.route, 'ordinary_direct_blocked');
  const request = resolve('이메이의 가슴을 만져주실 수 있나요?', save);
  assert.equal(request.route, 'ordinary_request');
});

test('19-4: 높은 흥분도지만 낮은 호감도 → blocked', () => {
  const save = ctxSave({ npc_stats: { heroine5: { affinity: 10, sexual_arousal: 90 } } });
  const c = resolve('이메이의 가슴을 만진다.', save);
  assert.equal(c.route, 'ordinary_direct_blocked');
});

test('19-5: 높은 호감도지만 흥분도 낮음 → intimate direct blocked, request는 ordinary_request', () => {
  const save = ctxSave({ npc_stats: { heroine5: { affinity: 80, sexual_arousal: 10 } } });
  const direct = resolve('이메이의 가슴을 만진다.', save);
  assert.equal(direct.route, 'ordinary_direct_blocked');
  const request = resolve('이메이의 가슴을 만져주실 수 있나요?', save);
  assert.equal(request.route, 'ordinary_request');
});

test('19-6: 강압 표현은 모든 근거를 무시하고 blocked (hard_blocker=coercive_physical_control)', () => {
  const save = ctxSave({
    npc_stats: { heroine5: { affinity: 100, sexual_arousal: 100 } },
    npc_relationship_state: {
      heroine5: { closeness: 'intimate', romance_status: 'dating', current_boundary: 'intimate', milestones: { first_kiss_turn: 5, sexual_relationship_started_turn: 8 } }
    }
  });
  const c = resolve('이메이의 손목을 붙잡아 억지로 움직인다.', save);
  assert.equal(c.route, 'ordinary_direct_blocked');
  assert.ok(c.contextual_permission.blockers.includes('coercive_physical_control'));
  assert.equal(c.attempt_basis, 'hard_blocker');
});

test('19-7: 회사 권한 악용은 높은 근거에도 blocked', () => {
  const save = ctxSave({ npc_stats: { heroine5: { affinity: 90, sexual_arousal: 90 } } });
  const c = resolve('감사 업무니까 이메이의 가슴을 만져야 합니다.', save);
  assert.equal(c.route, 'ordinary_direct_blocked');
  assert.ok(c.contextual_permission.blockers.includes('company_authority_misuse'));
});

test('19-8: 키스 contextual attempt (affinity 50/arousal 65/private)', () => {
  const save = ctxSave({ npc_stats: { heroine5: { affinity: 50, sexual_arousal: 65 } } });
  const c = resolve('이메이에게 조심스럽게 입을 맞춘다.', save);
  assert.equal(c.route, 'ordinary_direct_attempt');
  assert.equal(c.contextual_permission.action_tier, 'affectionate');
});

test('19-9: 키스+genital_touch bundle — first_kiss만 있고 정황 부족 → blocked, 정황 충족 → attempt', () => {
  const saveBase = ctxSave({
    npc_relationship_state: {
      heroine5: { closeness: 'close', romance_status: 'dating', current_boundary: 'intimate', milestones: { first_kiss_turn: 12, sexual_relationship_started_turn: null } }
    }
  });
  // 정황 부족 (arousal/affinity 낮음)
  const weak = resolve('이메이에게 키스하면서 성기를 만진다.', { ...saveBase, npc_stats: { heroine5: { affinity: 10, sexual_arousal: 10 } } });
  assert.equal(weak.route, 'ordinary_direct_blocked', 'first_kiss만으로는 intimate bundle 미허용');
  // contextual 충족
  const strong = resolve('이메이에게 키스하면서 성기를 만진다.', { ...saveBase, npc_stats: { heroine5: { affinity: 55, sexual_arousal: 80 } } });
  assert.equal(strong.route, 'ordinary_direct_attempt', 'intimate contextual 조건 충족 시 attempt');
  assert.equal(strong.contextual_permission.action_tier, 'intimate');
});

test('19-10: explicit tier — milestone+private만 attempt, 없으면 blocked, 요청이면 ordinary_request', () => {
  const milestoneSave = ctxSave({
    npc_relationship_state: {
      heroine5: { closeness: 'intimate', romance_status: 'dating', current_boundary: 'intimate', milestones: { first_kiss_turn: 5, sexual_relationship_started_turn: 18 } }
    }
  });
  const withMilestone = resolve('이메이에게 삽입한다.', milestoneSave);
  assert.equal(withMilestone.route, 'ordinary_direct_attempt', 'sexual milestone + private');
  const noMilestone = resolve('이메이에게 삽입한다.', ctxSave());
  assert.equal(noMilestone.route, 'ordinary_direct_blocked', 'milestone 없이 직접 행동');
  const request = resolve('이메이와 성관계를 가져도 될까요?', ctxSave());
  assert.equal(request.route, 'ordinary_request', 'milestone 없이 요청');
});

test('19-11: attempt section에 근거 band와 "자동 거절 금지" 취지 포함', () => {
  const c = resolve('이메이의 가슴을 만진다.', ctxSave());
  const section = buildActionExecutionContractSection(c);
  assert.ok(section.includes('[ACTION EXECUTION CONTRACT — ATTEMPT]'));
  assert.ok(section.includes('자동으로 거절하지 않는다'));
  assert.ok(section.includes('둘만 있는 공간'));
  assert.ok(section.includes('흥분도 high'), 'band 근거 포함');
  assert.ok(section.includes('호감도 medium'));
  assert.ok(section.includes('CSA나 회사 규정 때문에 허용하는 것으로 묘사하지 않는다'), '규정 정당화 금지 명시');
});

test('19-12: blocked(강압) section에 조건부 허용 문구 없음 + 다양한 반응 허용', () => {
  const c = resolve('이메이의 손목을 붙잡아 억지로 움직인다.', ctxSave());
  const section = buildActionExecutionContractSection(c);
  assert.ok(section.includes('[ACTION EXECUTION CONTRACT — AUTHORITATIVE]'));
  assert.ok(section.includes('coercive_physical_control'), 'blocker 명시');
  assert.ok(!section.includes('자동으로 거절하지 않는다'), '조건부 허용 문구 없음');
  assert.ok(!section.includes('조심스럽게 호응'), '호응 유도 없음');
  assert.ok(section.includes('손을 막거나'), '다양한 반응 허용');
});

test('19-15: arousal 단독(100) — affinity/privacy unknown → attempt 아님', () => {
  const save = csaSave({ npc_stats: { heroine5: { sexual_arousal: 100 } } });
  const c = resolve('이메이의 가슴을 만진다.', save);
  assert.equal(c.route, 'ordinary_direct_blocked');
});

test('19-16: affinity 단독(높음) — intimate 자동 허용 안 됨', () => {
  const save = csaSave({ npc_stats: { heroine5: { affinity: 90 } } });
  const c = resolve('이메이의 가슴을 만진다.', save);
  assert.equal(c.route, 'ordinary_direct_blocked');
});

test('19-17: privacy 단독(둘만 있는 공간) — 자동 허용 안 됨', () => {
  const save = csaSave({
    scene_state: { scene_id: 'private_room', location_id: 'private_room', participants: ['player-1', 'heroine5'], updated_turn: 8 }
  });
  const c = resolve('이메이의 가슴을 만진다.', save);
  assert.equal(c.route, 'ordinary_direct_blocked');
});
