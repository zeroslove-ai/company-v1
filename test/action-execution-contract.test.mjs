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
  assert.equal(c.reason_code, 'OUTSIDE_CSA_WITHOUT_RELATIONSHIP_PERMISSION');
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

test('section: csa_direct는 exact-scope 강화 문장 포함', () => {
  const c = resolve('이메이와 업무 대화를 계속하며 무릎 위에 앉게 한다.');
  const section = buildActionExecutionContractSection(c);
  assert.ok(section.includes('CSA DIRECT COVERAGE'));
  assert.ok(section.includes('exact action'));
  assert.ok(section.includes('확장하지 않는다'));
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
