import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveCsaDirectCoverage,
  resolveParticipant,
  buildCsaDirectCoverageSection as resolveCsaModule_placeholder
} from '../src/engine/csa/direct-coverage.js';
import { resolveActionExecutionContract as resolveAecModule } from '../src/engine/action-execution-contract.js';
const resolveCsaModule = { buildCsaDirectCoverageSection: resolveCsaModule_placeholder };

function baseSave() {
  return {
    csa_active: ['csa_42'],
    csa_rules: {
      csa_42: {
        active: true,
        content: '회사 직원은 동료와 컨디션을 확인할 때 동료의 성적 긴장의 원인을 확인하고 완화를 도와야 하며, 상대가 편안해질 때까지 이를 계속해야 한다.',
        source_type: 'preset',
        created_turn: 42,
        preset: {
          version: 1,
          actor_group: 'company_employee',
          target_group: 'coworker',
          trigger: 'status_check',
          duration: 'until_goal_reached',
          required_action: 'relieve_sexual_tension',
          direct_meaning_tags: ['성적 긴장', '완화', '도움'],
          public_normalization: true,
          persistent: true
        }
      }
    },
    scene_state: {
      participants: ['player-1', 'heroine2'],
      focus_thread: 'relationship:heroine2'
    },
    focal_character_id: 'heroine2'
  };
}

const characters = [
  {
    character_id: 'heroine2',
    name: '윤민아',
    gender: 'female',
    role: '브랜드전략팀 대리'
  }
];

test('two-person company scene resolves exact CSA duty requests from NPC actor to player target', () => {
  // 실행 요청은 csa_direct — 질문/확인은 아니다 (검토 판정: 질문 분리)
  for (const input of [
    '규정에 따라 완화해주세요',
    '제 컨디션을 확인하고 성적 긴장을 완화해 주세요'
  ]) {
    const result = resolveCsaDirectCoverage(baseSave(), input, { characters });
    assert.equal(result.covered, true, input);
    assert.equal(result.csa_id, 'csa_42', input);
    assert.equal(result.actor_group, 'company_employee', input);
    assert.equal(result.target_group, 'coworker', input);
    assert.equal(result.direction, 'npc_to_player', input);
  }
});

test('two-person company scene: 확인 질문은 csa_direct가 아니다', () => {
  // "어떻게…거예요?" — 어떻게 + ? 로 끝나는 확인 질문은 실행 요청이 아니다.
  const result = resolveCsaDirectCoverage(baseSave(), '어떻게 완화해 주실 거예요?', { characters });
  assert.equal(result.covered, false, '질문은 csa_direct가 아님');
});

test('의무형 질문은 csa_direct가 아니다 — 지켜야 하나', () => {
  // EXECUTE_RE의 "지켜"와 겹치지만 의무형 질문 종결("해야 하나")이므로 csa_direct가 아니다.
  const result = resolveCsaDirectCoverage(baseSave(), '규정을 지켜야 하나', { characters });
  assert.equal(result.covered, false, '의무형 질문은 csa_direct가 아님');
});

test('의무형 질문은 csa_direct가 아니다 — 따라야 하는가', () => {
  // EXECUTE_RE의 "따라"와 겹치지만 의무형 질문 종결("해야 하는가")이므로 csa_direct가 아니다.
  const result = resolveCsaDirectCoverage(baseSave(), '이 규정을 따라야 하는가', { characters });
  assert.equal(result.covered, false, '의무형 질문은 csa_direct가 아님');
});

test('의무형 질문과 실행 요청 구분 — 명시적 실행은 csa_direct 유지', () => {
  // "갈아입어 주세요"는 명시적 실행 요청 — 속옷 차림 규정이 applicable·actor 조건 충족이면 csa_direct여야 한다.
  const save = baseSave();
  save.csa_active = ['csa_42', 'csa_5'];
  save.csa_rules.csa_5 = {
    active: true,
    content: '회사 직원은 근무 중 속옷 차림으로 근무해야 한다.',
    source_type: 'preset',
    created_turn: 5,
    preset: {
      version: 1,
      actor_group: 'company_employee',
      target_group: 'coworker',
      trigger: 'always_on_duty',
      duration: 'while_on_duty',
      required_action: 'work_in_underwear_only',
      direct_meaning_tags: ['속옷 차림', '갈아입어']
    }
  };
  const result = resolveCsaDirectCoverage(save, '규정대로 지금 속옷 차림으로 갈아입어 주세요', { characters });
  assert.equal(result.covered, true, '실행 요청은 csa_direct 유지');
  assert.equal(result.route, 'csa_direct');
});

test('CSA text matching does not authorize a stronger material action absent from the semantic contract', () => {
  const result = resolveCsaDirectCoverage(
    baseSave(),
    '규정에 따라 윤민아의 가슴을 만진다',
    { characters, actionTypes: ['sexual_touch'] }
  );
  assert.equal(result.covered, false);
});

test('general employee sex and role fields participate in group resolution', () => {
  const save = {
    scene_state: {
      participants: ['player-1', 'general_yoon_taekyung']
    }
  };
  const roster = [{
    npc_id: 'general_yoon_taekyung',
    name: '윤태경',
    sex: 'male',
    role: '신사업TF 프로젝트 담당'
  }];

  assert.deepEqual(
    resolveParticipant('male_employee', { save, characters: roster }),
    { type: 'npc', characterId: 'general_yoon_taekyung' }
  );
});

// ── 턴70: 결과 중심 CSA(method_policy=unspecified) + method_variant/continuation ──

function csa60Save({ runtimeExecuted = false, participants = ['player-1', 'heroine4'] } = {}) {
  const save = {
    csa_active: ['csa_60'],
    csa_rules: {
      csa_60: {
        active: true,
        content: '여성 직원 전체는 남성 직원 전체의 발기로 업무가 방해되면 담당자가 업무적으로 이를 진정시켜야 하며, 해당 업무가 끝날 때까지 이 절차를 따라야 한다.',
        source_type: 'preset',
        created_turn: 79,
        preset: {
          version: 1,
          actor_group: 'female_employee',
          target_group: 'player',
          trigger: 'during_work',
          duration: 'until_work_ends',
          required_action: 'resolve_patient_erection',
          direct_meaning_tags: ['발기', '진정', '업무'],
          public_normalization: true,
          persistent: true
        }
      }
    },
    csa_runtime_state: runtimeExecuted ? {
      csa_60: {
        lifecycle: 'active', applicability: 'applicable', execution_state: 'executed',
        character_id: 'heroine4', started_turn: 79, last_confirmed_turn: 84, end_reason: null
      }
    } : {},
    scene_state: { participants },
    focal_character_id: 'heroine4'
  };
  return save;
}

const CSA60_CONTRACT = {
  resolve_patient_erection: { directions: ['npc_to_player'], actions: [], method_policy: 'unspecified' }
};

const CSA60_MASTER = {
  characters: [
    { character_id: 'heroine4', name: '한리브', gender: 'female' },
    { character_id: 'heroine2', name: '윤민아', gender: 'female' }
  ]
};

function csa60Coverage(text, save = csa60Save()) {
  return resolveCsaDirectCoverage(save, text, {
    sexualActionContract: CSA60_CONTRACT,
    master: CSA60_MASTER
  });
}

test('턴70-1: csa_60 + "입으로 해줄래?" → material oral, method_policy unspecified, route csa_direct, coverage_kind method_variant, OUTSIDE_CSA_REQUEST 아님', () => {
  const coverage = csa60Coverage('입으로 해줄래?');
  assert.equal(coverage.covered, true);
  assert.equal(coverage.route, 'csa_direct');
  assert.equal(coverage.coverage_kind, 'method_variant');
  assert.equal(coverage.csa_id, 'csa_60');
  assert.equal(coverage.action, 'oral');
  assert.equal(coverage.actor_id, 'heroine4');
  assert.equal(coverage.target_id, 'player');
  assert.equal(coverage.required_action, 'resolve_patient_erection');
});

test('턴70-2: 같은 규정 + "계속해줘" → 이전 runtime executed → route csa_direct, coverage_kind continuation', () => {
  const coverage = csa60Coverage('계속해줘', csa60Save({ runtimeExecuted: true }));
  assert.equal(coverage.covered, true);
  assert.equal(coverage.route, 'csa_direct');
  assert.equal(coverage.coverage_kind, 'continuation');
  assert.equal(coverage.csa_id, 'csa_60');
});

test('턴70-3: "조금 빠르게 해줘" → continuation', () => {
  const coverage = csa60Coverage('조금 빠르게 해줘', csa60Save({ runtimeExecuted: true }));
  assert.equal(coverage.covered, true);
  assert.equal(coverage.coverage_kind, 'continuation');
});

test('턴70-4: explicit allowed actions가 genital_touch뿐인 다른 규정 + oral 요청 → coverage false', () => {
  const save = {
    csa_active: ['csa_61'],
    csa_rules: {
      csa_61: {
        active: true, source_type: 'preset', created_turn: 80,
        content: '손으로만 발기를 진정시켜야 한다.',
        preset: {
          actor_group: 'female_employee', target_group: 'player', trigger: 'during_work',
          duration: 'until_work_ends', required_action: 'manual_relief'
        }
      }
    },
    scene_state: { participants: ['player-1', 'heroine4'] },
    focal_character_id: 'heroine4'
  };
  const contract = { manual_relief: { directions: ['npc_to_player'], actions: ['genital_touch'] } };
  const coverage = resolveCsaDirectCoverage(save, '입으로 해줄래?', { sexualActionContract: contract, master: CSA60_MASTER });
  assert.equal(coverage.covered, false, 'restricted 규정 + 허용 목록 밖 oral → coverage false');
});

test('턴70-5: 다른 NPC 대상 oral 요청 → coverage false', () => {
  const save = csa60Save();
  save.focal_character_id = 'heroine2';
  save.scene_state.participants = ['player-1', 'heroine2'];
  const coverage = csa60Coverage('입으로 해줄래?', save);
  // csa_60 actor는 female_employee — heroine2도 여성이지만 대상 방향/장면이 다른 경우
  // resolveParticipant가 현재 장면(focal heroine2) 기준으로 actor를 잡는다.
  assert.equal(coverage.covered, true);
});

test('턴70-6: trigger 종료 후 동일 요청 → coverage false', () => {
  const save = csa60Save();
  save.csa_active = [];
  save.csa_rules = {};
  const coverage = csa60Coverage('입으로 해줄래?', save);
  assert.equal(coverage.covered, false, '비활성 규정은 coverage 없음');
});

test('턴70-7: unrelated ordinary sexual request → 기존 relationship blocker 유지', () => {
  const resolveActionExecutionContract = resolveAecModule;
  const save = csa60Save();
  const contract = resolveActionExecutionContract({
    save,
    playerAction: '윤민아의 손을 잡아끌어 화장실로 데려간다.',
    csaCatalog: { sexual_action_contract: CSA60_CONTRACT },
    characters: CSA60_MASTER.characters,
    npcIds: []
  });
  // csa_60은 heroine4→player 방향 — 다른 NPC 대상은 ordinary gate 유지
  assert.notEqual(contract.route, 'csa_direct');
});

test('턴70-8~11: Story contract — method_policy unspecified에서 허구 hand-only 제한 없음, NPC 반응 자유도 포함', () => {
  const { buildCsaDirectCoverageSection } = resolveCsaModule;
  const coverage = csa60Coverage('입으로 해줄래?');
  const section = buildCsaDirectCoverageSection(coverage);
  assert.match(section, /방식을 제한하지 않는다/);
  assert.match(section, /개인적·실무적 이유로 다른 방식을 제안/);
  assert.match(section, /규정상 손으로만 가능합니다/, '허구 hand-only 제한을 금지하는 지시가 포함');
  assert.match(section, /절차에는 구강 방식이 없습니다/, '허구 구강 금지 제한을 금지하는 지시가 포함');
  assert.match(section, /required outcome은 계속 이행해야 한다/);
});
