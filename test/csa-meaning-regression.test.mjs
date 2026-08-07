import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveCsaDirectCoverage,
  resolveParticipant
} from '../src/engine/csa/direct-coverage.js';

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
