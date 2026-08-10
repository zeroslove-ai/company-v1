import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildContextDisplayPayload,
  buildCsaTransactionDetailsSection,
  buildNpcAppPayload
} from '../src/api/runtime-display.js';
import { parseNarrative } from '../src/engine/narrative-parser.js';
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
      heroine1: { affinity: 11, resistance: 45, csa_acceptance: 22, sexual_arousal: 5 },
      general_seen: { affinity: 3 }
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

test('context display and view model expose progression and active rule content without Story player status', () => {
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
  assert.equal(model.player.active_csa[0].authority_label, '취업규칙·전사 준수 규정');
  assert.equal(model.player.status, undefined, 'player.status는 View Model에서 제거');
  assert.equal(model.player.location_label, '사무실');
});

test('NPC app payload includes five heroines and evidence-backed general NPCs with canonical stats and two-field Mind only', () => {
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
  assert.deepEqual(heroine.stats, { affection: 11, acceptance: 22, arousal: 5, resistance: 45 });
  const general = npcs.find(npc => npc.id === 'general_seen');
  assert.equal(general.stats.affection, 3);
  assert.equal(general.stats.acceptance, 44);
  const unseen = npcs.find(npc => npc.id === 'heroine2');
  assert.deepEqual(unseen.stats, { affection: 0, acceptance: 0, arousal: 0, resistance: 0 });
});

test('transaction details preserve authority tiers for Extract/runtime observation', () => {
  const previousSave = baseSave();
  previousSave.csa_rules = { old: { strength: 'weak', content: '예전 규정' } };
  const plan = {
    next_csa_active: [], next_csa_rules: {},
    canonical_action: {
      operations: [
        { domain: 'csa', operation: 'activate', strength: 'weak', content: '새 규정' },
        { domain: 'csa', operation: 'update', id: 'updated', strength: 'medium', content: '수정 규정' },
        { domain: 'csa', operation: 'activate', strength: 'strong', content: '법령 규정' },
        { domain: 'csa', operation: 'deactivate', id: 'old' }
      ]
    }
  };
  const details = buildCsaTransactionDetailsSection(plan, previousSave);
  assert.match(details, /신설 · 강도 약함 · 권위 인사팀 공식 공지·사내 운영지침 · .*내용: 새 규정/);
  assert.match(details, /수정 updated · 강도 중간 · 권위 취업규칙·전사 준수 규정 · .*내용: 수정 규정/);
  assert.match(details, /법령 규정/);
  assert.match(details, /해제 old · 강도 약함 · 권위 인사팀 공식 공지·사내 운영지침 · .*내용: 예전 규정/);

});

test('dialogue parser preserves TTS lines even when quotes or the colon are omitted', () => {
  const parsed = parseNarrative([
    '[1. 서사 및 행동]',
    '히로인1 (낮고 단호하게) 보고서를 다시 봐요.',
    '히로인1 (숨을 고르며): “괜찮아요.”',
    '[2. 플레이어 속마음]',
    '다시 확인하자.',
    '[3. 플레이어 상황판]',
    '검토 중.',
    '[4. 선택지]',
    '1. A', '2. B', '3. C', '4. D'
  ].join('\n'), { master: { characters: [{ character_id: 'heroine1', name: '히로인1' }] } });
  assert.equal(parsed.dialogue_lines.length, 2);
  assert.equal(parsed.dialogue_lines[0].speaker_id, 'heroine1');
  assert.equal(parsed.dialogue_lines[0].direction, '낮고 단호하게');
  assert.equal(parsed.dialogue_lines[0].text, '보고서를 다시 봐요.');
  assert.equal(parsed.dialogue_lines[1].text, '괜찮아요.');
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
