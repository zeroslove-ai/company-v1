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
  // 단순 근거 부족 blocked는 follow-up 예약 안 함 (강압·회사 권한·경계 위반만 예약)
  assert.equal(c.schedule_boundary_followup, false);
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
    scene_state: { scene_id: 'private_room', location_id: 'private_room', participants: ['player-1', 'heroine5'], updated_turn: 8 },
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
    scene_state: { scene_id: 'private_room', location_id: 'private_room', participants: ['player-1', 'heroine5'], updated_turn: 8 },
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

test('section: ordinary는 빈 문자열', () => {
  const noCsa = csaSave({ csa_active: [], csa_rules: {} });
  const contract = resolve('서류를 정리한다', noCsa);

  assert.equal(contract.route, 'ordinary');
  assert.equal(buildActionExecutionContractSection(contract), '');
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
    scene_state: { scene_id: 'private_room', location_id: 'private_room', participants: ['player-1', 'heroine5'], updated_turn: 8 },
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

// ---------- 검토 반영: privacy fail-open / action_resolution 검증 / '-줘' ----------

test('검토R1a: participants가 비어 있으면 privacy unknown → attempt 아님', () => {
  const save = csaSave({
    npc_stats: { heroine5: { affinity: 90, sexual_arousal: 90 } },
    scene_state: { scene_id: 'x', location_id: '', participants: [], updated_turn: 8 }
  });
  const c = resolve('이메이의 가슴을 만진다.', save);
  assert.equal(c.contextual_permission.privacy, 'unknown', '정보 부족은 private 승인 금지');
  assert.equal(c.route, 'ordinary_direct_blocked');
});

test('검토R1b: player가 participants에 없으면 private 아님', () => {
  const save = csaSave({
    npc_stats: { heroine5: { affinity: 90, sexual_arousal: 90 } },
    scene_state: { scene_id: 'x', location_id: '', participants: ['heroine5', 'heroine1'], updated_turn: 8 }
  });
  const c = resolve('이메이의 가슴을 만진다.', save);
  assert.equal(c.contextual_permission.privacy, 'unknown', 'player 부재');
  assert.equal(c.route, 'ordinary_direct_blocked');
});

test('검토R1c: target이 participants에 없으면 private 아님', () => {
  const save = csaSave({
    npc_stats: { heroine5: { affinity: 90, sexual_arousal: 90 } },
    scene_state: { scene_id: 'x', location_id: '', participants: ['player-1', 'heroine1'], updated_turn: 8 }
  });
  const c = resolve('이메이의 가슴을 만진다.', save);
  assert.equal(c.contextual_permission.privacy, 'unknown', 'target 부재');
  assert.equal(c.route, 'ordinary_direct_blocked');
});

test('검토R2: action_resolution 검증 — target 불일치/route 불일치/부분집합 외 → 승격 차단', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const contract = { version: 1, route: 'ordinary_direct_attempt', action_types: ['sexual_touch'], target_id: 'heroine5' };
  const bad = [
    { target_id: 'heroine1', route: 'ordinary_direct_attempt', npc_response: 'accepted', voluntary: true, completed_action_types: ['sexual_touch'] },
    { target_id: 'heroine5', route: 'ordinary_direct_blocked', npc_response: 'accepted', voluntary: true, completed_action_types: ['sexual_touch'] },
    { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'totally', voluntary: true, completed_action_types: ['sexual_touch'] },
    { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'accepted', voluntary: 'yes', completed_action_types: ['sexual_touch'] },
    { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'accepted', voluntary: true, completed_action_types: ['penetration'] }
  ];
  for (const resolution of bad) {
    const extract = { action_resolution: resolution, state_delta: { npc_relationship_state: { heroine5: { milestones: { first_kiss_turn: 8 } } } } };
    const out = applyContractStateFirewall(extract, contract);
    assert.equal(out.state_delta.npc_relationship_state.heroine5.milestones.first_kiss_turn, undefined, JSON.stringify(resolution));
  }
  // accepted인데 completed가 비어 있으면 성공 milestone 불허
  const emptyCompleted = { action_resolution: { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'accepted', voluntary: true, completed_action_types: [] }, state_delta: { npc_relationship_state: { heroine5: { milestones: { first_kiss_turn: 8 } } } } };
  const outEmpty = applyContractStateFirewall(emptyCompleted, contract);
  assert.equal(outEmpty.state_delta.npc_relationship_state.heroine5.milestones.first_kiss_turn, undefined, 'completed 비어있으면 불허');
  // 부분 수락(partially_accepted)도 completed 범위만 — milestone은 통째로 허용하지 않는다
  const partial = { action_resolution: { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'partially_accepted', voluntary: true, completed_action_types: ['sexual_touch'] }, state_delta: { npc_relationship_state: { heroine5: { milestones: { first_kiss_turn: 8, sexual_relationship_started_turn: 8 } } } } };
  const outPartial = applyContractStateFirewall(partial, contract);
  assert.equal(outPartial.state_delta.npc_relationship_state.heroine5.milestones.sexual_relationship_started_turn, undefined, '부분 수락은 성적 milestone 통째 허용 금지');
});



test('검토R4: follow-up은 강압/회사 권한/경계 위반만 — 일반 insufficient는 예약 안 함', () => {
  // 강압 → true
  const coercive = resolve('이메이의 손목을 붙잡아 억지로 움직인다.', ctxSave());
  assert.equal(coercive.schedule_boundary_followup, true, '강압은 follow-up 예약');
  // 회사 권한 → true
  const authority = resolve('감사 업무니까 이메이의 가슴을 만져야 합니다.', ctxSave());
  assert.equal(authority.schedule_boundary_followup, true, '회사 권한 악용 follow-up');
  // 단순 근거 부족 → false
  const insufficient = resolve('이메이의 가슴을 만진다.', csaSave({ npc_stats: { heroine5: { affinity: 10, sexual_arousal: 10 } } }));
  assert.equal(insufficient.schedule_boundary_followup, false, '근거 부족은 예약 안 함');
});

test('검토R5: "성과 평가를 완료했다"는 성적 완료 사건 오탐 아님 (단독 성 제거)', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const contract = { version: 1, route: 'ordinary_direct_blocked', action_types: ['genital_touch'], target_id: 'heroine5' };
  const extract = { state_delta: { event_ledger: [
    { event_id: 'perf', event_type: 'work_event', turn: 8, summary: '성과 평가를 완료했다.', participants: ['heroine5'] },
    { event_id: 'done', event_type: 'work_event', turn: 8, summary: '완성 검토를 끝냈다.', participants: ['heroine5'] }
  ] } };
  const out = applyContractStateFirewall(extract, contract);
  const ids = out.state_delta.event_ledger.map(e => e.event_id);
  assert.ok(ids.includes('perf'), '성과 평가 보존');
  assert.ok(ids.includes('done'), '완성 검토 보존');
});

test('검토R6: attempt firewall도 대상 NPC 참여 사건만 필터 (다른 NPC 성적 완료 보존)', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const contract = { version: 1, route: 'ordinary_direct_attempt', action_types: ['sexual_touch'], target_id: 'heroine5' };
  const extract = {
    action_resolution: { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'refused', voluntary: false, completed_action_types: [] },
    // 당사자가 둘 다 명확한 NPC↔NPC 사건이어야 "다른 NPC 사건"으로 보존된다.
    // (한 명만 적힌 성적 완료는 나머지 한쪽이 player일 수 있어 fail-closed로 제거 —
    //  아래 '우회B-9'가 그 경계를 별도로 검증한다.)
    state_delta: { event_ledger: [
      { event_id: 'other', event_type: 'sexual_event', turn: 8, summary: '키스가 이루어졌다.', participants: ['heroine1', 'heroine2'] },
      { event_id: 'self', event_type: 'sexual_event', turn: 8, summary: '키스가 이루어졌다.', participants: ['heroine5'] }
    ] }
  };
  const out = applyContractStateFirewall(extract, contract);
  const ids = out.state_delta.event_ledger.map(e => e.event_id);
  assert.ok(ids.includes('other'), '다른 NPC 사건 보존');
  assert.ok(!ids.includes('self'), '대상 NPC 완료 사건 차단');
});

test('검토R7: 일상적 부탁형 -해줘/-줘는 request', () => {
  const save = ctxSave({ npc_stats: { heroine5: { affinity: 50, sexual_arousal: 65 } } });
  const kiss = resolve('키스해줘', save);
  assert.equal(kiss.execution_mode, 'request', '해줘 → request');
  assert.equal(kiss.route, 'ordinary_request');
  const show = resolve('이메이에게 살짝 보여줘', save);
  assert.equal(show.execution_mode, 'request', '보여줘 → request');
  const explicit = resolve('이메이의 손목을 잡아 직접 만져줘', save);
  assert.equal(explicit.execution_mode, 'direct_act', '직접 신체 조작은 direct_act 우선');
});

// ---------- 최종 무결성: sexual ledger / player completion / scope / strict target ----------

const BLOCKED = { version: 1, route: 'ordinary_direct_blocked', action_types: ['genital_touch'], target_id: 'heroine5' };
const ATTEMPT = { version: 1, route: 'ordinary_direct_attempt', action_types: ['kiss', 'genital_touch'], target_id: 'heroine5' };

test('무결성1: blocked 턴의 sexual_event_ledger completed 제거', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = { state_delta: { sexual_event_ledger: [
    { event_id: 'p1', action_type: 'penetration', actor_id: 'player', target_id: 'heroine5', completed: true, interrupted: false, evidence: '지퍼 안으로 밀어 넣었다.' }
  ] } };
  const out = applyContractStateFirewall(extract, BLOCKED);
  assert.deepEqual(out.state_delta.sexual_event_ledger, [], 'completed penetration ledger 제거');
});

test('무결성2: blocked 턴의 interrupted sexual ledger 보존', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = { state_delta: { sexual_event_ledger: [
    { event_id: 'i1', action_type: 'genital_touch', actor_id: 'player', target_id: 'heroine5', completed: false, interrupted: true, evidence: '손을 뿌리쳤다.' }
  ] } };
  const out = applyContractStateFirewall(extract, BLOCKED);
  assert.equal(out.state_delta.sexual_event_ledger.length, 1, 'interrupted ledger 보존');
  assert.equal(out.state_delta.sexual_event_ledger[0].interrupted, true);
});

// 정책 변경: player가 참여한 completed 사건은 target_id가 계약 대상과 다르더라도
// 현재 턴의 플레이어 완료 행동이므로 "다른 NPC 사건"으로 보존하지 않는다.
// (player 미참여 NPC↔NPC ledger 보존은 아래 '무결성3b'가 계속 검증한다.)
test('무결성3: player가 참여한 다른 NPC target sexual ledger는 제거', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = { state_delta: { sexual_event_ledger: [
    { event_id: 'h1', action_type: 'penetration', actor_id: 'player', target_id: 'heroine1', completed: true, interrupted: false, evidence: '서원희와의 완료.' }
  ] } };
  const out = applyContractStateFirewall(extract, BLOCKED);
  assert.equal(out.state_delta.sexual_event_ledger.length, 0, 'player 참여 completed ledger 제거');
});

test('무결성3b: player 미참여 NPC↔NPC sexual ledger 보존', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = { state_delta: { sexual_event_ledger: [
    { event_id: 'n2n', action_type: 'kiss', actor_id: 'heroine1', target_id: 'heroine2', completed: true, interrupted: false, evidence: '두 사람의 키스.' }
  ] } };
  const out = applyContractStateFirewall(extract, BLOCKED);
  assert.equal(out.state_delta.sexual_event_ledger.length, 1, '비관련 NPC↔NPC ledger 보존');
});

test('무결성4: blocked 턴의 ejaculation completion 제거 (arousal/progress 보존)', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = {
    evidence: { sexual_resolution: true, story_quote: '속으로는...' },
    state_delta: {
      player_sexual_state: { arousal_delta: 20, ejaculation_progress_delta: 10, ejaculation_completed: true },
      npc_emotion: { heroine5: { mood: 'surprised' } }
    }
  };
  const out = applyContractStateFirewall(extract, BLOCKED);
  assert.equal(out.state_delta.player_sexual_state.ejaculation_completed, undefined, 'completion 제거');
  assert.equal(out.state_delta.player_sexual_state.arousal_delta, 20, 'arousal 보존');
  assert.equal(out.state_delta.player_sexual_state.ejaculation_progress_delta, 10, 'progress 보존');
  assert.equal(out.evidence.sexual_resolution, undefined, 'sexual_resolution 무효화');
  assert.equal(out.state_delta.npc_emotion.heroine5.mood, 'surprised', '감정 보존');
});

test('무결성5: refused attempt의 ejaculation completion 제거', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = {
    action_resolution: { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'refused', voluntary: false, completed_action_types: [] },
    state_delta: { player_sexual_state: { ejaculation_completed: true, arousal_delta: 5 } }
  };
  const out = applyContractStateFirewall(extract, ATTEMPT);
  assert.equal(out.state_delta.player_sexual_state.ejaculation_completed, undefined, 'completion 제거');
  assert.equal(out.state_delta.player_sexual_state.arousal_delta, 5, 'arousal 보존');
});

test('무결성6: accepted kiss + ejaculation 제안 → completion 제거', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const kissContract = { version: 1, route: 'ordinary_direct_attempt', action_types: ['kiss'], target_id: 'heroine5' };
  const extract = {
    action_resolution: { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'accepted', voluntary: true, completed_action_types: ['kiss'] },
    state_delta: { player_sexual_state: { ejaculation_completed: true } }
  };
  const out = applyContractStateFirewall(extract, kissContract);
  assert.equal(out.state_delta.player_sexual_state.ejaculation_completed, undefined, 'kiss는 ejaculation 근거 아님');
});

test('무결성7: accepted penetration 완료 시 player completion 조건부 허용', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const explicitContract = { version: 1, route: 'ordinary_direct_attempt', action_types: ['penetration'], target_id: 'heroine5' };
  const extract = {
    action_resolution: { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'accepted', voluntary: true, completed_action_types: ['penetration'] },
    evidence: { sexual_resolution: true },
    state_delta: { player_sexual_state: { ejaculation_completed: true } }
  };
  const out = applyContractStateFirewall(extract, explicitContract);
  assert.equal(out.state_delta.player_sexual_state.ejaculation_completed, true, 'explicit 완료 시 허용');
});

test('무결성8: 빈 participants + last_npcs_present 존재 → privacy unknown', () => {
  const save = csaSave({
    npc_stats: { heroine5: { affinity: 90, sexual_arousal: 90 } },
    scene_state: { scene_id: 'x', location_id: '', participants: [], updated_turn: 8 },
    last_npcs_present: ['heroine5']
  });
  const c = resolve('이메이의 가슴을 만진다.', save);
  assert.equal(c.contextual_permission.privacy, 'unknown', '과거 NPC 목록은 privacy 증거 아님');
  assert.equal(c.route, 'ordinary_direct_blocked');
});

test('무결성9: scene_state.participants 누락 + last_npcs_present 존재 → unknown', () => {
  const save = csaSave({
    npc_stats: { heroine5: { affinity: 90, sexual_arousal: 90 } },
    last_npcs_present: ['heroine5']
  });
  const c = resolve('이메이의 가슴을 만진다.', save);
  assert.equal(c.contextual_permission.privacy, 'unknown');
  assert.equal(c.route, 'ordinary_direct_blocked');
});









test('무결성14: bundle kiss+genital_touch, completed kiss만 → kiss 범위만 허용', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = {
    action_resolution: { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'accepted', voluntary: true, completed_action_types: ['kiss'] },
    state_delta: {
      npc_relationship_state: { heroine5: { milestones: { first_kiss_turn: 8, sexual_relationship_started_turn: 8 } } },
      event_ledger: [
        { event_id: 'k', event_type: 'sexual_event', turn: 8, summary: '키스가 이루어졌다.', action_type: 'kiss', participants: ['heroine5'] },
        { event_id: 'g', event_type: 'sexual_event', turn: 8, summary: '접촉이 이루어졌다.', action_type: 'genital_touch', participants: ['heroine5'] }
      ],
      sexual_event_ledger: [
        { event_id: 'p', action_type: 'penetration', actor_id: 'player', target_id: 'heroine5', completed: true, interrupted: false, evidence: '완료' }
      ]
    }
  };
  const out = applyContractStateFirewall(extract, ATTEMPT);
  assert.equal(out.state_delta.npc_relationship_state.heroine5.milestones.first_kiss_turn, 8, 'kiss 완료 → first_kiss 보존');
  assert.equal(out.state_delta.npc_relationship_state.heroine5.milestones.sexual_relationship_started_turn, undefined, 'sexual milestone 제거');
  const events = out.state_delta.event_ledger.map(e => e.event_id);
  assert.ok(events.includes('k'), 'kiss event 보존');
  assert.ok(!events.includes('g'), 'genital_touch event 제거');
  assert.deepEqual(out.state_delta.sexual_event_ledger, [], 'penetration ledger 제거');
});

test('무결성15: kiss accepted → sexual relationship milestone 제거', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const kissContract = { version: 1, route: 'ordinary_direct_attempt', action_types: ['kiss'], target_id: 'heroine5' };
  const extract = {
    action_resolution: { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'accepted', voluntary: true, completed_action_types: ['kiss'] },
    state_delta: { npc_relationship_state: { heroine5: { milestones: { first_kiss_turn: 8, sexual_relationship_started_turn: 8 } } } }
  };
  const out = applyContractStateFirewall(extract, kissContract);
  assert.equal(out.state_delta.npc_relationship_state.heroine5.milestones.first_kiss_turn, 8);
  assert.equal(out.state_delta.npc_relationship_state.heroine5.milestones.sexual_relationship_started_turn, undefined);
});

test('무결성16: genital_touch accepted → sexual relationship milestone 자동 생성 금지', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const touchContract = { version: 1, route: 'ordinary_direct_attempt', action_types: ['genital_touch'], target_id: 'heroine5' };
  const extract = {
    action_resolution: { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'accepted', voluntary: true, completed_action_types: ['genital_touch'] },
    state_delta: { npc_relationship_state: { heroine5: { milestones: { first_kiss_turn: 8, sexual_relationship_started_turn: 8 } } } }
  };
  const out = applyContractStateFirewall(extract, touchContract);
  assert.equal(out.state_delta.npc_relationship_state.heroine5.milestones.sexual_relationship_started_turn, undefined, 'touch로 sexual milestone 불가');
  assert.equal(out.state_delta.npc_relationship_state.heroine5.milestones.first_kiss_turn, undefined, 'kiss 미완료 → first_kiss도 차단');
});

test('무결성17: completed action 밖의 event_ledger 제거', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = {
    action_resolution: { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'accepted', voluntary: true, completed_action_types: ['kiss'] },
    state_delta: { event_ledger: [
      { event_id: 'g2', event_type: 'sexual_event', turn: 8, summary: '접촉이 완료되었다.', action_type: 'genital_touch', participants: ['heroine5'] }
    ] }
  };
  const out = applyContractStateFirewall(extract, ATTEMPT);
  assert.ok(!out.state_delta.event_ledger.some(e => e.event_id === 'g2'), '범위 밖 성적 완료 event 제거');
});

test('무결성18: completed action 밖의 sexual_event_ledger 제거', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = {
    action_resolution: { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'accepted', voluntary: true, completed_action_types: ['kiss'] },
    state_delta: { sexual_event_ledger: [
      { event_id: 'g3', action_type: 'penetration', actor_id: 'player', target_id: 'heroine5', completed: true, interrupted: false, evidence: '완료' }
    ] }
  };
  const out = applyContractStateFirewall(extract, ATTEMPT);
  assert.deepEqual(out.state_delta.sexual_event_ledger, [], 'kiss 완료로 penetration ledger 불가');
});

test('무결성19: invalid resolution에서도 감정·일반 업무 event 보존', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = {
    action_resolution: { target_id: 'heroine1', route: 'ordinary_direct_attempt', npc_response: 'accepted', voluntary: true, completed_action_types: ['kiss'] },
    state_delta: {
      npc_emotion: { heroine5: { mood: 'confused' } },
      event_ledger: [ { event_id: 'w', event_type: 'work_event', turn: 8, summary: '회의가 마무리됐다.', participants: ['heroine5'] } ],
      npc_relationship_state: { heroine5: { milestones: { first_kiss_turn: 8 } } }
    }
  };
  const out = applyContractStateFirewall(extract, ATTEMPT);
  assert.equal(out.state_delta.npc_emotion.heroine5.mood, 'confused', '감정 보존');
  assert.ok(out.state_delta.event_ledger.some(e => e.event_id === 'w'), '일반 업무 event 보존');
  assert.equal(out.state_delta.npc_relationship_state.heroine5.milestones.first_kiss_turn, undefined, 'milestone 차단');
});


test('검토B3: privacy unknown + first_kiss milestone 존재 → 키스 blocked (milestone이 blocker를 넘지 못함)', () => {
  const save = csaSave({
    scene_state: { scene_id: 'meeting_room', location_id: 'meeting_room', participants: [], updated_turn: 8 },
    npc_relationship_state: {
      heroine5: {
        closeness: 'close', romance_status: 'dating', current_boundary: 'intimate',
        milestones: { first_kiss_turn: 12, sexual_relationship_started_turn: null }
      }
    }
  });
  const kiss = resolve('갑자기 이메이에게 키스한다.', save);
  assert.equal(kiss.route, 'ordinary_direct_blocked', 'privacy unknown이면 milestone이 있어도 blocked');
  assert.ok(kiss.contextual_permission?.blockers?.includes('unknown_scene_context'), 'unknown_scene_context blocker 부여');
});

test('검토B3b: privacy unknown + romance_status 존재 → 키스 blocked', () => {
  const save = csaSave({
    scene_state: { scene_id: 'meeting_room', location_id: 'meeting_room', participants: ['player-1'], updated_turn: 8 },
    npc_relationship_state: {
      heroine5: {
        closeness: 'close', romance_status: 'dating', current_boundary: 'intimate',
        milestones: { first_kiss_turn: null, sexual_relationship_started_turn: null }
      }
    }
  });
  const kiss = resolve('갑자기 이메이에게 키스한다.', save);
  assert.equal(kiss.route, 'ordinary_direct_blocked', 'player 부재 → privacy unknown → blocked');
});

test('검토B3c: privacy private + first_kiss milestone → 키스 attempt 유지 (과차단 아님)', () => {
  const save = csaSave({
    scene_state: { scene_id: 'private_room', location_id: 'private_room', participants: ['player-1', 'heroine5'], updated_turn: 8 },
    npc_relationship_state: {
      heroine5: {
        closeness: 'close', romance_status: 'dating', current_boundary: 'intimate',
        milestones: { first_kiss_turn: 12, sexual_relationship_started_turn: null }
      }
    }
  });
  const kiss = resolve('갑자기 이메이에게 키스한다.', save);
  assert.equal(kiss.route, 'ordinary_direct_attempt', 'private면 milestone 기반 attempt 정상');
});

// ─────────────────────────────────────────────────────────────────────────
// 남은 정본 무결성 우회 회귀 — player가 참여한 completed 사건이 "다른 NPC 사건"
// 으로 위장해 정본에 병합되는 경로, 그리고 privacy unknown + 명사형(execution
// mode unknown) 입력이 milestone을 근거로 attempt로 풀리는 경로를 고정한다.
// ─────────────────────────────────────────────────────────────────────────

const NULL_TARGET_CONTRACT = { version: 1, route: 'ordinary_direct_blocked', action_types: ['kiss'], target_id: null };
const H5_CONTRACT = { version: 1, route: 'ordinary_direct_attempt', action_types: ['kiss'], target_id: 'heroine5' };

/** 정본 병합까지 통과시켜 실제 저장 결과를 확인한다 (helper 반환값만 보지 않는다). */
async function mergeThroughCanonical(extract, contract) {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const { applyGuardedStateDelta } = await import('../src/engine/guarded-merge.js');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const here = path.dirname(fileURLToPath(import.meta.url));
  const save = JSON.parse(fs.readFileSync(path.join(here, '../fixtures/phase-0.5/canonical-save-v1.json'), 'utf8'));
  const firewalled = applyContractStateFirewall(extract, contract);
  const merged = applyGuardedStateDelta(save, {
    outcome: 'success', evidence: {}, choices: [], mind_monitor: {}, dialogue_lines: [],
    ...firewalled
  }, { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' });
  return { firewalled, merged };
}

test('우회A-1: contract target null + 명시 NPC target의 player completed ledger는 제거되고 정본 count도 오르지 않는다', async () => {
  const extract = { state_delta: { sexual_event_ledger: [
    { action_type: 'orgasm', actor_id: 'player', target_id: 'heroine5', completed: true, evidence: '완료됐다.' }
  ] } };
  const { firewalled, merged } = await mergeThroughCanonical(extract, NULL_TARGET_CONTRACT);
  assert.equal(firewalled.state_delta.sexual_event_ledger.length, 0, 'null contract target이면 completed 전부 제거');
  assert.equal(merged.nextSave.ejaculation_counts?.player ?? 0, 0, 'player ejaculation count 증가 없음');
  assert.equal((merged.nextSave.sexual_event_ledger ?? []).length, 0, '정본 ledger에 완료 결과 없음');
});

test('우회A-2: 유효 contract target + player가 다른 NPC와 완료한 ledger는 보존되지 않는다', async () => {
  const extract = { state_delta: { sexual_event_ledger: [
    { action_type: 'penetration', actor_id: 'player', target_id: 'heroine1', completed: true, evidence: '다른 NPC와 완료.' }
  ] } };
  const { firewalled, merged } = await mergeThroughCanonical(extract, H5_CONTRACT);
  assert.equal(firewalled.state_delta.sexual_event_ledger.length, 0, '다른 NPC 사건으로 보존되지 않음');
  assert.equal(merged.nextSave.ejaculation_counts?.player ?? 0, 0, 'canonical count 증가 없음');
});

test('우회A-3: accepted kiss 범위를 벗어난 player orgasm은 kiss 완료로 위장 통과하지 못한다', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = {
    action_resolution: { target_id: 'heroine5', route: 'ordinary_direct_attempt', npc_response: 'accepted', voluntary: true, completed_action_types: ['kiss'] },
    state_delta: { sexual_event_ledger: [
      { action_type: 'orgasm', actor_id: 'player', target_id: 'heroine1', completed: true, evidence: '다른 NPC와 절정.' }
    ] }
  };
  const out = applyContractStateFirewall(extract, H5_CONTRACT);
  assert.equal(out.state_delta.sexual_event_ledger.length, 0, 'accepted kiss 범위로 위장 통과 불가');
});

test('우회A-4: player·contract target 미참여 NPC↔NPC completed ledger는 보존된다', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = { state_delta: { sexual_event_ledger: [
    { action_type: 'kiss', actor_id: 'heroine1', target_id: 'heroine2', completed: true, evidence: '두 사람의 키스.' }
  ] } };
  const out = applyContractStateFirewall(extract, H5_CONTRACT);
  assert.equal(out.state_delta.sexual_event_ledger.length, 1, '비관련 NPC↔NPC 사건 보존');
});

test('우회A-5: interrupted player ledger는 보존되지만 완료 count/milestone은 생기지 않는다', async () => {
  const extract = { state_delta: { sexual_event_ledger: [
    { action_type: 'penetration', actor_id: 'player', target_id: null, completed: false, interrupted: true, evidence: '중단됐다.' }
  ] } };
  const { firewalled, merged } = await mergeThroughCanonical(extract, NULL_TARGET_CONTRACT);
  assert.equal(firewalled.state_delta.sexual_event_ledger.length, 1, 'interrupted 기록 보존');
  assert.equal(merged.nextSave.ejaculation_counts?.player ?? 0, 0, '완료 count 증가 없음');
  for (const rel of Object.values(merged.nextSave.npc_relationship_state ?? {})) {
    assert.equal(rel?.milestones?.first_kiss_turn ?? null, null, 'first_kiss milestone 생성 없음');
    assert.equal(rel?.milestones?.sexual_relationship_started_turn ?? null, null, 'sexual milestone 생성 없음');
  }
});

test('우회B-6: participants에 다른 NPC만 있어도 actor가 player인 성적 완료 event는 제거된다', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = { state_delta: { event_ledger: [
    { event_id: 'bypass', event_type: 'sexual_completed', turn: 8, actor_id: 'player', target_id: 'heroine1', participants: ['heroine1'], summary: '플레이어와 heroine1의 성적 행동이 완료됐다.' }
  ] } };
  const out = applyContractStateFirewall(extract, H5_CONTRACT);
  assert.ok(!out.state_delta.event_ledger.some(e => e.event_id === 'bypass'), 'actor=player 우회 제거');
});

test('우회B-7: player·contract target 미참여 NPC↔NPC event는 보존된다', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = { state_delta: { event_ledger: [
    { event_id: 'n2n', event_type: 'kiss_completed', turn: 8, actor_id: 'heroine1', target_id: 'heroine2', participants: ['heroine1', 'heroine2'], summary: '두 사람의 키스가 이루어졌다.' }
  ] } };
  const out = applyContractStateFirewall(extract, H5_CONTRACT);
  assert.ok(out.state_delta.event_ledger.some(e => e.event_id === 'n2n'), '명확한 NPC↔NPC event 보존');
});

test('우회B-8: 거절·중단·신고·경계 event는 player가 참여해도 보존된다', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = { state_delta: { event_ledger: [
    { event_id: 'r1', event_type: 'kiss_refused', turn: 8, actor_id: 'player', target_id: 'heroine5', participants: ['heroine5'], summary: '키스를 거절했다.' },
    { event_id: 'r2', event_type: 'sexual_attempt_interrupted', turn: 8, actor_id: 'player', target_id: 'heroine5', participants: ['heroine5'], summary: '시도가 중단됐다.' },
    { event_id: 'r3', event_type: 'harassment_reported', turn: 8, actor_id: 'heroine5', target_id: 'player', participants: ['heroine5'], summary: '불쾌감을 신고했다.' },
    { event_id: 'r4', event_type: 'boundary_reasserted', turn: 8, actor_id: 'heroine5', target_id: 'player', participants: ['heroine5'], summary: '경계를 다시 밝혔다.' }
  ] } };
  const out = applyContractStateFirewall(extract, H5_CONTRACT);
  const ids = out.state_delta.event_ledger.map(e => e.event_id);
  assert.deepEqual(ids, ['r1', 'r2', 'r3', 'r4'], '거절·중단·신고·경계 event 전부 보존');
});

/** privacy unknown 장면(참가자 정보 없음/한쪽 부재)에서의 계약 판정 fixture. */
function unknownPrivacySave(participants, extra = {}) {
  return csaSave({
    scene_state: { scene_id: 'meeting_room', location_id: 'meeting_room', participants, updated_turn: 8 },
    npc_relationship_state: {
      heroine5: {
        closeness: 'close', romance_status: 'dating', current_boundary: 'intimate',
        milestones: { first_kiss_turn: 12, sexual_relationship_started_turn: null }
      }
    },
    ...extra
  });
}

test('우회C-9: privacy unknown + 명사형 키스는 milestone이 있어도 unknown_scene_context로 blocked', () => {
  const out = resolve('이메이와 키스', unknownPrivacySave([]));
  assert.equal(out.route, 'ordinary_direct_blocked', '명사형도 blocked');
  assert.ok(out.contextual_permission.blockers.includes('unknown_scene_context'), 'unknown_scene_context blocker');
});

test('우회C-10: scene participants에 target이 없으면 milestone/romance가 상쇄하지 못한다', () => {
  const out = resolve('이메이와 키스', unknownPrivacySave(['player-1']));
  assert.equal(out.route, 'ordinary_direct_blocked', 'target 부재 blocked');
  assert.ok(out.contextual_permission.blockers.includes('unknown_scene_context'), 'unknown_scene_context blocker');
});

test('우회C-11: scene participants에 player가 없으면 blocked', () => {
  const out = resolve('이메이와 키스', unknownPrivacySave(['heroine5']));
  assert.equal(out.route, 'ordinary_direct_blocked', 'player 부재 blocked');
  assert.ok(out.contextual_permission.blockers.includes('unknown_scene_context'), 'unknown_scene_context blocker');
});

test('우회C-12: 높은 affinity/arousal/dating/first_kiss도 unknown privacy를 상쇄하지 못한다', () => {
  const save = unknownPrivacySave([], {
    npc_stats: { heroine5: { affinity: 95, sexual_arousal: 95, resistance: 10, csa_acceptance: 60 } }
  });
  const out = resolve('이메이와 키스', save);
  assert.equal(out.route, 'ordinary_direct_blocked', '높은 수치로도 blocked');
  assert.ok(out.contextual_permission.blockers.includes('unknown_scene_context'), 'unknown_scene_context blocker');
});

test('우회C-13: privacy unknown이어도 요청형은 ordinary_request로 유지된다 (자동 완료 아님)', () => {
  const out = resolve('이메이와 키스해도 될까요?', unknownPrivacySave([]));
  assert.equal(out.execution_mode, 'request', 'request 유지');
  assert.equal(out.route, 'ordinary_request', 'NPC가 판단하는 요청형');
  assert.ok(!out.contextual_permission.blockers.includes('unknown_scene_context'), 'request는 unknown_scene_context 예외');
});

test('우회C-14: private scene이 명확하면 기존 direct-act attempt는 계속 가능하다 (과차단 방지)', () => {
  const save = csaSave({
    scene_state: { scene_id: 'private_room', location_id: 'private_room', participants: ['player-1', 'heroine5'], updated_turn: 8 },
    npc_relationship_state: {
      heroine5: {
        closeness: 'close', romance_status: 'dating', current_boundary: 'intimate',
        milestones: { first_kiss_turn: 12, sexual_relationship_started_turn: null }
      }
    }
  });
  const out = resolve('이메이에게 키스한다', save);
  assert.equal(out.route, 'ordinary_direct_attempt', 'private scene direct-act는 attempt 유지');
  assert.ok(!out.contextual_permission.blockers.includes('unknown_scene_context'), 'private면 unknown blocker 없음');
});

// ── 2차 검토 반영: accepted 범위 target-only 우회 + 단일 participant 모호 사건 ──

const ACCEPTED_KISS_RESOLUTION = {
  target_id: 'heroine5', route: 'ordinary_direct_attempt',
  npc_response: 'accepted', voluntary: true, completed_action_types: ['kiss']
};

/** accepted kiss 계약 아래에서 주어진 ledger row들이 살아남는지 확인한다. */
async function acceptedLedgerIds(rows) {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const out = applyContractStateFirewall(
    { action_resolution: ACCEPTED_KISS_RESOLUTION, state_delta: { sexual_event_ledger: rows } },
    H5_CONTRACT
  );
  return out.state_delta.sexual_event_ledger.map(r => r.event_id);
}

test('우회A-6: accepted 범위여도 계약 target이 다른 NPC와 완료한 사건은 정본이 되지 않는다', async () => {
  const ids = await acceptedLedgerIds([
    { event_id: 't2n', action_type: 'kiss', actor_id: 'heroine5', target_id: 'heroine1', completed: true, evidence: 'heroine5와 heroine1의 키스.' },
    { event_id: 'n2t', action_type: 'kiss', actor_id: 'heroine1', target_id: 'heroine5', completed: true, evidence: 'heroine1과 heroine5의 키스.' }
  ]);
  assert.deepEqual(ids, [], 'player가 빠진 계약 target 사건은 accepted 범위를 빌려 승격될 수 없다');
});

test('우회A-7: player와 계약 target 사이의 accepted 완료는 양방향 모두 정상 보존된다', async () => {
  const ids = await acceptedLedgerIds([
    { event_id: 'p2t', action_type: 'kiss', actor_id: 'player', target_id: 'heroine5', completed: true, evidence: '플레이어가 heroine5에게 키스.' },
    { event_id: 't2p', action_type: 'kiss', actor_id: 'heroine5', target_id: 'player', completed: true, evidence: 'heroine5가 플레이어에게 키스.' }
  ]);
  assert.deepEqual(ids, ['p2t', 't2p'], '과차단 방지 — 정상 accepted 완료는 유지');
});

test('우회A-8: accepted 범위에서도 계약 target·player 미참여 NPC↔NPC 사건은 그대로 보존된다', async () => {
  const ids = await acceptedLedgerIds([
    { event_id: 'n2n', action_type: 'kiss', actor_id: 'heroine1', target_id: 'heroine2', completed: true, evidence: '두 사람의 키스.' }
  ]);
  assert.deepEqual(ids, ['n2n'], '비관련 NPC↔NPC 사건 보존');
});

test('우회B-9: 한 명만 적힌 성적 완료 event는 나머지 한쪽이 player일 수 있으므로 제거된다', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = { state_delta: { event_ledger: [
    { event_id: 'ambig', event_type: 'sexual_event', turn: 8, participants: ['heroine1'], summary: '키스가 이루어졌다.' },
    { event_id: 'dup', event_type: 'sexual_event', turn: 8, participants: ['heroine1', 'heroine1'], summary: '키스가 이루어졌다.' },
    { event_id: 'clear', event_type: 'sexual_event', turn: 8, participants: ['heroine1', 'heroine2'], summary: '키스가 이루어졌다.' }
  ] } };
  const ids = applyContractStateFirewall(extract, H5_CONTRACT).state_delta.event_ledger.map(e => e.event_id);
  assert.deepEqual(ids, ['clear'], '상대가 명확한 사건만 보존 (중복 이름도 2명으로 치지 않는다)');
});

test('우회B-10: 당사자 한 명뿐이어도 성적 완료가 아닌 일반 event는 계속 보존된다', async () => {
  const { applyContractStateFirewall } = await import('../src/api/turn-routes.js');
  const extract = { state_delta: { event_ledger: [
    { event_id: 'work', event_type: 'task_completed', turn: 8, participants: ['heroine1'], summary: '보고서를 제출했다.' },
    { event_id: 'refuse', event_type: 'kiss_refused', turn: 8, participants: ['heroine1'], summary: '키스를 거절했다.' }
  ] } };
  const ids = applyContractStateFirewall(extract, H5_CONTRACT).state_delta.event_ledger.map(e => e.event_id);
  assert.deepEqual(ids, ['work', 'refuse'], '일반 업무·거절 event는 참가자 수와 무관하게 보존');
});
