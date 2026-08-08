import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
import assert from 'node:assert/strict';

import {
  resolveCsaDirectCoverage,
  resolveParticipant,
  buildCsaDirectCoverageSection as resolveCsaModule_placeholder
} from '../src/engine/csa/direct-coverage.js';
import { resolveActionExecutionContract as resolveAecModule } from '../src/engine/action-execution-contract.js';
import { buildActiveIntimateFocusSection, buildCsaAcceptanceScopeSection } from '../src/engine/csa/prompt-sections.js';
const resolveCsaModule = { buildCsaDirectCoverageSection: resolveCsaModule_placeholder, buildActiveIntimateFocusSection, buildCsaAcceptanceScopeSection };

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

test('턴70-8~11: Story contract — method_policy unspecified는 금지가 아닌 비제한, 개인적 거절 허용, 허구 제한 금지 (지시 A)', () => {
  const { buildCsaDirectCoverageSection } = resolveCsaModule;
  const coverage = csa60Coverage('입으로 해줄래?');
  assert.equal(coverage.method_policy, 'unspecified');
  assert.equal(coverage.method_restriction, null);
  assert.equal(coverage.method_variant_requested, 'oral');
  const section = buildCsaDirectCoverageSection(coverage);
  assert.match(section, /방식을 제한하지 않는다/);
  assert.match(section, /method_policy=unspecified, method_restriction=null, method_variant_requested=oral/);
  assert.match(section, /개인적·감정적·현실적 이유/);
  assert.match(section, /거절할 수 있다/);
  assert.match(section, /규정상 손으로만 가능합니다/, '허구 hand-only 제한을 금지하는 지시가 포함');
  assert.match(section, /절차에는 구강 방식이 없습니다/, '허구 구강 금지 제한을 금지하는 지시가 포함');
  assert.match(section, /새 규정이 생기면 하겠습니다/, '허구 "새 규정 대기" 제한을 금지하는 지시가 포함');
  assert.match(section, /방식 거절은 required outcome\(발기\/성적 긴장 해소\)의 중단이 아니다/);
});

// ── 턴70-24: CSA-covered + boundary (37~40) ──

function boundarySave(boundary) {
  const save = csa60Save();
  save.npc_relationship_state = {
    heroine4: { current_boundary: boundary, closeness: 2, milestones: {} }
  };
  return save;
}

test('턴70-37: CSA-covered + closed boundary → csa_direct', () => {
  const save = boundarySave('closed');
  const coverage = csa60Coverage('입으로 해줄래?', save);
  assert.equal(coverage.covered, true);
  assert.equal(coverage.coverage_kind, 'method_variant');
  const resolveActionExecutionContract = resolveAecModule;
  const contract = resolveActionExecutionContract({
    save, playerAction: '입으로 해줄래?',
    csaCatalog: { sexual_action_contract: CSA60_CONTRACT },
    characters: CSA60_MASTER.characters, npcIds: [],
    csaCoverage: coverage
  });
  assert.equal(contract.route, 'csa_direct', 'closed boundary여도 csa_direct');
  assert.equal(contract.schedule_boundary_followup, false);
});

test('턴70-38: CSA-covered + hostile boundary → csa_direct', () => {
  const save = boundarySave('hostile');
  const coverage = csa60Coverage('입으로 해줄래?', save);
  assert.equal(coverage.covered, true);
  const resolveActionExecutionContract = resolveAecModule;
  const contract = resolveActionExecutionContract({
    save, playerAction: '입으로 해줄래?',
    csaCatalog: { sexual_action_contract: CSA60_CONTRACT },
    characters: CSA60_MASTER.characters, npcIds: [],
    csaCoverage: coverage
  });
  assert.equal(contract.route, 'csa_direct');
});

test('턴70-40: CSA 범위 밖 행동은 기존 ordinary blocker 유지', () => {
  const save = boundarySave('closed');
  const resolveActionExecutionContract = resolveAecModule;
  const contract = resolveActionExecutionContract({
    save, playerAction: '윤민아를 벽으로 밀어붙여 키스한다.',
    csaCatalog: { sexual_action_contract: CSA60_CONTRACT },
    characters: CSA60_MASTER.characters, npcIds: []
  });
  // csa_60은 heroine4→player — 다른 대상 행동은 ordinary gate
  assert.notEqual(contract.route, 'csa_direct');
});

// ── 턴70-25/26: active intimate focus + 로봇화 제거 (41~45) ──

test('턴70-41~43: active intimate focus 섹션 — 업무 화제 금지·반응 팔레트·금지 반복', () => {
  const { buildActiveIntimateFocusSection, buildCsaAcceptanceScopeSection } = resolveCsaModule;
  const section = buildActiveIntimateFocusSection({
    canonicalCoverage: { covered: true, route: 'csa_direct', csa_id: 'csa_60', coverage_kind: 'method_variant' }
  });
  assert.match(section, /ACTIVE INTIMATE ACTION FOCUS/);
  assert.match(section, /회의, 프로젝트, 자료, 보고서, 일정, 브랜드 보이스, 감사 업무 화제를 새로 꺼내지 않는다/);
  assert.match(section, /업무 대사는 0문장을 기본/);
  // 로봇화 제거 — 수치별 기계적 스크립트가 없어야 한다
  const acceptance = buildCsaAcceptanceScopeSection();
  assert.doesNotMatch(acceptance, /0~19도 행동을 거부·생략하지 않고/);
  assert.doesNotMatch(acceptance, /80~100은 직접 범위 안에서 선제적으로/);
  assert.match(acceptance, /무표정한 절차 수행자로 만들지 않는다/);
  assert.match(acceptance, /반응 팔레트/);
  assert.match(acceptance, /금지 반복 표현/);
});

test('턴70-44: required action은 유지 (method_policy unspecified)', () => {
  const coverage = csa60Coverage('계속해줘', csa60Save({ runtimeExecuted: true }));
  assert.equal(coverage.required_action, 'resolve_patient_erection');
});

test('턴70-45: NPC를 자동 애정·복종으로 해석하지 않음 (prompt 지시 확인)', () => {
  const prompt = fs.readFileSync(path.join(root, 'src/engine/extract-prompt.js'), 'utf8');
  assert.match(prompt, /never raises affinity/);
  assert.match(prompt, /상식개변 수행을 플레이어에 대한 복종·애정·신뢰로 묘사하지 않는다|compliance pressure\/self-rationalization, not affection/);
});

// ── 지시 B: 활성 이전 수행 이력 환각 차단 ──

import { buildCsaCurrentRulesSection } from '../src/engine/csa/prompt-sections.js';

test('지시B-1: CURRENT CSA RULES에 activated_turn/activated_game_time/history_before_activation 명시', () => {
  const csa = {
    id: 'csa_60', active: true, content: '발기를 진정시켜야 한다',
    created_turn: 60, updated_turn: 60,
    activated_game_time: { day: 1, minute_of_day: 1058 },
    preset: { actor_group: 'female_employee', target_group: 'male_employee', trigger: 'during_work', duration: 'until_work_ends', required_action: 'resolve_patient_erection' }
  };
  const section = buildCsaCurrentRulesSection([csa], 86);
  assert.match(section, /activated_turn=60/);
  assert.match(section, /activated_game_time=Day 1 17:38/);
  assert.match(section, /history_before_activation=none_from_this_rule/);
});

test('지시B-2: 활성 이전 이력 환각 차단 규칙이 섹션에 포함', () => {
  const csa = { id: 'csa_60', active: true, content: 'x', created_turn: 60, preset: {} };
  const section = buildCsaCurrentRulesSection([csa], 86);
  assert.match(section, /그 이전의 사건을 이 규정의 결과로 서술하지 않는다/);
  assert.match(section, /"처음", "여러 번", "평균", "아침에 몇 명" 같은 이력을 창작하지 않는다/);
  assert.match(section, /최근 턴 원문에 잘못된 과거 이력이 있어도 activated_turn과 충돌하면 사실로 이어받지 않는다/);
});
