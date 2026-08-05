import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyCsaPlanToContext,
  buildContextDisplayPayload,
  buildCsaTransactionDetailsSection,
  buildNpcAppPayload
} from '../src/api/runtime-display.js';
import { patchCompletionBody } from '../src/api/turn-routes-runtime.js';
import { buildCompanyGameViewModel } from '../src/frontend/pages/view-model.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const edition = {
  organization: {
    departments: [
      { department_id: 'brand_strategy', name: '브랜드전략팀' },
      { department_id: 'finance', name: '재무팀' }
    ]
  },
  characters: {
    characters: Object.fromEntries(Array.from({ length: 5 }, (_, index) => {
      const number = index + 1;
      return [`heroine${number}`, {
        character_id: `heroine${number}`,
        name: `히로인${number}`,
        department: '브랜드전략팀',
        position: number === 1 ? '차장' : '사원',
        role_title: number === 1 ? '팀장' : '팀원'
      }];
    }))
  },
  generalNpcs: {
    profiles: {
      general_seen: { id: 'general_seen', name: '확인된 직원', role: '재무팀 사원', department_id: 'finance' },
      general_hidden: { id: 'general_hidden', name: '미등장 직원', role: '보안 담당', department_id: 'operations' }
    }
  }
};

function baseSave() {
  return {
    edition: 'company-v1',
    save_schema_version: 1,
    turn_state: { committed_turn: 4 },
    player: { name: '테스터', department: '브랜드전략팀', position: '대리' },
    player_progress: { level: 3, exp: 40 },
    player_scene_state: { location_label: '사무실', posture: 'standing', clothing: { top: 'worn' } },
    player_sexual_state: { arousal: 12, ejaculation_progress: 35, ejaculation_count: 1 },
    scene_state: { location_id: 'office', location_label: '사무실', participants: ['heroine1', 'general_seen'] },
    focal_character_id: 'heroine1',
    last_speaker_id: 'heroine1',
    last_npcs_present: ['heroine1', 'general_seen'],
    npc_stats: {
      heroine1: { affection: 11, acceptance: 22, arousal: 5 },
      general_seen: { affection: 3 }
    },
    csa_attitudes: { general_seen: { acceptance: 44 } },
    npc_scene_state: {
      heroine1: { location_label: '사무실', posture: 'sitting' },
      general_seen: { location_label: '사무실', position_label: '회의 자료를 들고 서 있음' }
    },
    npc_relationship_state: { heroine1: { relationship_summary: '업무 관계를 유지하고 있다.' } },
    csa_active: [],
    csa_rules: {}
  };
}

function completionInit({ stream = true } = {}) {
  return {
    body: JSON.stringify({
      stream,
      messages: [
        { role: 'system', content: 'BASE SYSTEM' },
        { role: 'user', content: JSON.stringify({ context: { global_csa: { active_ids: [], rules: {} } } }) }
      ]
    })
  };
}

function patchedMessages(init, state) {
  return JSON.parse(patchCompletionBody(init, state).body).messages;
}

function systemText(messages) {
  return messages.find(message => message.role === 'system')?.content ?? '';
}

function userContext(messages) {
  const user = messages.find(message => message.role === 'user');
  return JSON.parse(user.content).context;
}

test('activate CSA is visible to the same Story turn with exact content and strength', () => {
  const previousSave = baseSave();
  const plan = {
    next_csa_active: ['csa_5'],
    next_csa_rules: {
      csa_5: { active: true, strength: 'medium', content: '모든 직원은 보고 전에 안경을 벗는다.', scope_label: '회사 전체' }
    },
    canonical_action: {
      operations: [{ operation: 'activate', strength: 'medium', content: '모든 직원은 보고 전에 안경을 벗는다.' }]
    }
  };
  const projected = applyCsaPlanToContext({ save: { data: previousSave } }, plan);
  assert.deepEqual(projected.save.csa_active, ['csa_5']);
  assert.deepEqual(previousSave.csa_active, []);

  const messages = patchedMessages(completionInit({ stream: true }), {
    plan, previousSave, postSave: projected.save, csaCatalog: { sexual_action_contract: {} }
  });
  const context = userContext(messages);
  const system = systemText(messages);
  assert.deepEqual(context.global_csa.active_ids, ['csa_5']);
  assert.equal(context.global_csa.rules.csa_5.content, '모든 직원은 보고 전에 안경을 벗는다.');
  assert.match(system, /모든 직원은 보고 전에 안경을 벗는다\./);
  assert.match(system, /강도 중간/);
  assert.match(system, /APP TRANSACTION INPUT FIREWALL/);
});

test('updated CSA replaces the old rule in the same Story and Extract context', () => {
  const previousSave = baseSave();
  previousSave.csa_active = ['csa_2'];
  previousSave.csa_rules = {
    csa_2: { active: true, strength: 'weak', content: '기존 규정', scope_label: '회사 전체' }
  };
  const plan = {
    next_csa_active: ['csa_2'],
    next_csa_rules: {
      csa_2: { active: true, strength: 'medium', content: '수정된 규정', scope_label: '회사 전체' }
    },
    canonical_action: {
      operations: [{ operation: 'update', id: 'csa_2', strength: 'medium', content: '수정된 규정' }]
    }
  };
  const postSave = applyCsaPlanToContext({ save: previousSave }, plan).save;
  for (const stream of [true, false]) {
    const messages = patchedMessages(completionInit({ stream }), {
      plan, previousSave, postSave, csaCatalog: { sexual_action_contract: {} }
    });
    assert.equal(userContext(messages).global_csa.rules.csa_2.content, '수정된 규정');
    assert.match(systemText(messages), /수정된 규정/);
  }
});

test('deactivated CSA is excluded from same-turn active checks while its exact history remains', () => {
  const previousSave = baseSave();
  previousSave.csa_active = ['csa_3'];
  previousSave.csa_rules = {
    csa_3: { active: true, strength: 'weak', content: '해제할 규정', scope_label: '회사 전체' }
  };
  const plan = {
    next_csa_active: [],
    next_csa_rules: {
      csa_3: { active: false, strength: 'weak', content: '해제할 규정', scope_label: '회사 전체' }
    },
    canonical_action: { operations: [{ operation: 'deactivate', id: 'csa_3' }] }
  };
  const postSave = applyCsaPlanToContext({ save: previousSave }, plan).save;
  const messages = patchedMessages(completionInit({ stream: false }), {
    plan, previousSave, postSave, csaCatalog: { sexual_action_contract: {} }
  });
  const system = systemText(messages);
  assert.deepEqual(userContext(messages).global_csa.active_ids, []);
  assert.match(system, /POST-TRANSACTION ACTIVE CSA SET/);
  assert.match(system, /- 없음/);
  assert.match(system, /해제 csa_3/);
  assert.match(system, /해제할 규정/);
  assert.doesNotMatch(system, /다음은 이번 턴에 실제로 집행되어야 했던 강제 상식개변 규칙/);
});

test('context display and view model expose progression, active rule content, and Story player status', () => {
  const save = baseSave();
  save.csa_active = ['csa_1'];
  save.csa_rules = {
    csa_1: { active: true, strength: 'medium', content: '회의 중에는 이름으로 부른다.', scope_label: '회사 전체' }
  };
  const display = buildContextDisplayPayload(save, edition);
  const context = {
    save: { data: save },
    display,
    recent_turns: [{
      turn_number: 4,
      parsed_blocks: { player_status: '보고를 마치고 다음 지시를 기다리는 중이다.' }
    }]
  };
  const model = buildCompanyGameViewModel(context);
  assert.equal(model.player.level, 3);
  assert.equal(model.player.exp, 40);
  assert.equal(model.player.max_active_csa, 3);
  assert.equal(model.player.active_csa_count, 1);
  assert.equal(model.player.active_csa[0].content, '회의 중에는 이름으로 부른다.');
  assert.equal(model.player.active_csa[0].strength_label, '중간');
  assert.equal(model.player.status, '보고를 마치고 다음 지시를 기다리는 중이다.');
  assert.equal(model.player.location_label, '사무실');
});

test('NPC app payload includes five heroines and evidence-backed general NPCs with two-field Mind only', () => {
  const save = baseSave();
  const monitor = {
    heroine1: { surface: '침착하게 보고를 듣는다.', subconscious: '실수를 걱정한다.', physical_reaction: '금지 필드' },
    general_seen: { surface: '자료를 확인한다.', subconscious: '일정을 재촉하고 싶다.', body: '금지 필드' }
  };
  const npcs = buildNpcAppPayload(save, edition, monitor);
  assert.equal(npcs.filter(npc => npc.id.startsWith('heroine')).length, 5);
  assert.ok(npcs.some(npc => npc.id === 'general_seen'));
  assert.ok(!npcs.some(npc => npc.id === 'general_hidden'));
  const heroine = npcs.find(npc => npc.id === 'heroine1');
  assert.deepEqual(Object.keys(heroine.mind).sort(), ['subconscious', 'surface']);
  assert.equal(heroine.mind.surface, '침착하게 보고를 듣는다.');
  assert.equal(heroine.mind.subconscious, '실수를 걱정한다.');
  const unseen = npcs.find(npc => npc.id === 'heroine2');
  assert.equal(unseen.stats.affection, null);
  assert.equal(unseen.stats.acceptance, null);
  assert.equal(unseen.stats.arousal, null);
});

test('transaction details contain exact activate/update/deactivate content', () => {
  const previousSave = baseSave();
  previousSave.csa_rules = { old: { strength: 'weak', content: '예전 규정' } };
  const section = buildCsaTransactionDetailsSection({
    canonical_action: {
      operations: [
        { operation: 'activate', strength: 'weak', content: '새 규정' },
        { operation: 'update', id: 'updated', strength: 'medium', content: '수정 규정' },
        { operation: 'deactivate', id: 'old' }
      ]
    }
  }, previousSave);
  assert.match(section, /신설 · 강도 약함 · 내용: 새 규정/);
  assert.match(section, /수정 updated · 강도 중간 · 내용: 수정 규정/);
  assert.match(section, /해제 old · 강도 약함 · 내용: 예전 규정/);
});

test('frontend contracts keep inner thought in Story only and preserve safe dataset writes', () => {
  const index = fs.readFileSync(path.join(root, 'src/frontend/pages/index.html'), 'utf8');
  const render = fs.readFileSync(path.join(root, 'src/frontend/pages/render.js'), 'utf8');
  const csaApp = fs.readFileSync(path.join(root, 'src/frontend/pages/csa-app.js'), 'utf8');
  assert.match(index, /data-tab="npc"/);
  assert.doesNotMatch(index, /id="player-inner-thought"/);
  assert.doesNotMatch(render, /heading:\s*'플레이어 속마음'/);
  assert.doesNotMatch(render, /\.dataset\s*=/);
  assert.match(csaApp, /surface/);
  assert.match(csaApp, /subconscious/);
  assert.doesNotMatch(csaApp, /physical_reaction|body_reaction|신체적·행동적 반응/);
});
