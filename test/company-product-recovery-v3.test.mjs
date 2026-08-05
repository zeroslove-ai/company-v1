import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildFinderNpcList,
  buildFullPlayerInfo,
  buildNpcFinderPayload,
  resolveNpcLocation
} from '../src/api/product-recovery.js';
import {
  applyRegisteredNpcPolicy,
  REGISTERED_NPC_POLICY
} from '../src/api/npc-policy-fetch.js';
import {
  formatHistoryMarkdown,
  formatHistoryText,
  historyPageState,
  mergeHistoryRecords
} from '../src/frontend/pages/history-tools.js';
import { finderErrorText, finderStatusText } from '../src/frontend/pages/npc-finder.js';
import { promoteNewCsaCard } from '../src/frontend/pages/csa-product-ui.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const edition = {
  organization: {
    departments: [{ department_id: 'brand_strategy', name: '브랜드전략팀' }],
    general_npc_departments: [
      { department_id: 'design', name: '디자인팀' },
      { department_id: 'hr', name: '인사팀(현업)' }
    ]
  },
  positions: { positions: [{ position_id: 'tf_lead', name: 'TF팀장' }] },
  bodyTypes: { body_types: [{ body_type_id: 'muscular', name: '근육질' }] },
  speechStyles: { speech_styles: [{ speech_style_id: 'rough_yangachi', name: '거친 양아치 말투' }] },
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
    profiles: Object.fromEntries(Array.from({ length: 8 }, (_, index) => {
      const number = index + 1;
      return [`general_${number}`, {
        id: `general_${number}`,
        name: `일반${number}`,
        role: number === 1 ? '디자인팀 대리' : '인사팀 사원',
        department_id: number === 1 ? 'design' : 'hr'
      }];
    }))
  },
  map: {
    locations: [
      { location_id: 'large_meeting_room', name: '대회의실', department_id: null, location_type: 'meeting_room', default_npc_ids: [] },
      { location_id: 'project_room', name: '프로젝트룸', department_id: 'design', location_type: 'project_space', default_npc_ids: ['general_1'] },
      { location_id: 'office', name: '사무실', department_id: 'brand_strategy', location_type: 'office_floor', default_npc_ids: [] },
      { location_id: 'small_meeting_room', name: '소회의실', department_id: null, location_type: 'meeting_room', default_npc_ids: ['general_2'] }
    ]
  }
};

function save() {
  return {
    player: {
      name: '금태양',
      adult: true,
      department_id: 'brand_strategy',
      position_id: 'tf_lead',
      height_cm: 183,
      weight_kg: 75,
      penis_length_cm: 19,
      body_type_id: 'muscular',
      speech_style_id: 'rough_yangachi',
      background: '대기업 본사 합동 회의에 처음 합석했다.'
    },
    player_progress: { level: 3, exp: 40 },
    player_scene_state: {
      location_id: 'large_meeting_room',
      location_label: '대회의실',
      posture: 'standing',
      posture_detail: '회의 테이블 옆에 서 있음',
      clothing: { top: '정장 재킷', bottom: '정장 바지' }
    },
    player_sexual_state: { arousal: 7, ejaculation_progress: 22, ejaculation_count: 2 },
    scene_state: { location_id: 'large_meeting_room', location_label: '대회의실', participants: ['heroine1'] },
    focal_character_id: 'heroine1',
    last_speaker_id: 'heroine1',
    last_npcs_present: ['heroine1'],
    npc_scene_state: { heroine1: { present: true, location_id: 'large_meeting_room' } },
    csa_active: ['csa_1'],
    csa_rules: { csa_1: { active: true, strength: 'medium', content: '회의 중에는 이름으로 부른다.', scope_label: '회사 전체' } }
  };
}

test('full player app projection preserves setup, physical, sexual, and CSA fields', () => {
  const info = buildFullPlayerInfo(save(), edition);
  assert.equal(info.name, '금태양');
  assert.equal(info.department, '브랜드전략팀');
  assert.equal(info.position, 'TF팀장');
  assert.equal(info.height_cm, 183);
  assert.equal(info.weight_kg, 75);
  assert.equal(info.body_type, '근육질');
  assert.equal(info.speech_style, '거친 양아치 말투');
  assert.equal(info.penis_length_cm, 19);
  assert.equal(info.background, '대기업 본사 합동 회의에 처음 합석했다.');
  assert.equal(info.current_location, '대회의실');
  assert.equal(info.posture_detail, '회의 테이블 옆에 서 있음');
  assert.match(info.clothing, /정장 재킷/);
  assert.equal(info.arousal, 7);
  assert.equal(info.ejaculation_progress, 22);
  assert.equal(info.ejaculation_count, 2);
  assert.equal(info.active_csa.length, 1);
  assert.equal(info.active_csa[0].content, '회의 중에는 이름으로 부른다.');
});

test('finder directory exposes only five heroines and eight registered general NPCs', () => {
  const rows = buildFinderNpcList(save(), edition);
  assert.equal(rows.length, 13);
  assert.equal(rows.filter(row => row.type === 'heroine').length, 5);
  assert.equal(rows.filter(row => row.type === 'general').length, 8);
  assert.ok(!rows.some(row => row.id === 'unnamed_employee'));

  const current = rows.find(row => row.id === 'heroine1');
  assert.equal(current.status, 'present');
  assert.equal(current.can_move, false);
  assert.equal(current.location_label, '대회의실');

  const defaultGeneral = rows.find(row => row.id === 'general_1');
  assert.equal(defaultGeneral.status, 'inferred_workplace');
  assert.equal(defaultGeneral.location_label, '프로젝트룸');
  assert.equal(defaultGeneral.can_move, true);
});

test('finder preserves existing 422 contracts and frontend maps them precisely', () => {
  const currentLocation = resolveNpcLocation(save(), edition, 'heroine1');
  assert.equal(currentLocation.status, 'present');
  assert.match(finderStatusText({ name: '히로인1', known_character: true, ...currentLocation }), /현재 같은 장면/);
  assert.throws(
    () => buildNpcFinderPayload(save(), edition, 'heroine1'),
    error => error?.status === 422 && error?.code === 'npc_already_present'
  );

  const inferred = buildNpcFinderPayload(save(), edition, 'general_1');
  assert.equal(inferred.status, 'inferred_workplace');
  assert.equal(inferred.location_label, '프로젝트룸');
  assert.match(finderStatusText(inferred), /기본 근무지/);

  assert.throws(
    () => buildNpcFinderPayload(save(), edition, 'extra_visitor'),
    error => error?.status === 422 && error?.code === 'npc_not_found'
  );
  assert.equal(finderErrorText({ code: 'npc_not_found' }), '등록된 인물이 아닙니다.');
  assert.match(finderErrorText({ code: 'npc_location_unknown', message: '일반8의 현재 위치가 아직 기록되지 않았습니다.' }), /위치가 아직 기록되지/);
});

test('registered NPC policy is static, cache-friendly, and Story-only', () => {
  const init = {
    body: JSON.stringify({
      stream: true,
      messages: [
        { role: 'system', content: 'STATIC STORY PREFIX' },
        { role: 'user', content: JSON.stringify({ active_character_canon: { heroine1: { name: '히로인1' } }, context: { turn: 4 } }) }
      ]
    })
  };
  const patched = JSON.parse(applyRegisteredNpcPolicy(init).body);
  assert.match(patched.messages[0].content, /^STATIC STORY PREFIX/);
  assert.match(patched.messages[0].content, /등록 NPC 전용 등장 정책/);
  assert.match(patched.messages[0].content, /이름 없는 직원·비서·동료·경비·방문객/);
  assert.match(patched.messages[0].content, /일회성 배경 오류/);
  assert.match(patched.messages[0].content, /다음 턴의 서사 연속성에 유지하지 않는다/);
  assert.match(REGISTERED_NPC_POLICY, /등록되지 않은 단역/);

  const extract = {
    body: JSON.stringify({
      stream: false,
      messages: [
        { role: 'system', content: 'VERIFIED EXTRACT PREFIX' },
        { role: 'user', content: JSON.stringify({ registered_characters: [{ character_id: 'heroine1' }] }) }
      ]
    })
  };
  assert.equal(applyRegisteredNpcPolicy(extract), extract, 'Extract의 기존 ID guard와 프롬프트 예산을 유지한다');

  const classifier = { body: JSON.stringify({ messages: [{ role: 'system', content: 'CLASSIFIER' }] }) };
  assert.equal(applyRegisteredNpcPolicy(classifier), classifier);
});

test('history pagination state, dedupe, and MD/TXT exports preserve committed content', () => {
  assert.deepEqual(historyPageState({ has_more: true, next_before_turn: 21 }), { next_before_turn: 21, has_more: true, hide_more: false });
  assert.deepEqual(historyPageState({ has_more: true, next_before_turn: null }), { next_before_turn: null, has_more: false, hide_more: true });
  assert.deepEqual(historyPageState({ has_more: false, next_before_turn: 1 }), { next_before_turn: 1, has_more: false, hide_more: true });

  const records = mergeHistoryRecords(
    [{ turn_number: 2, story_text: '옛 기록' }, { turn_number: 1, story_text: '첫 기록' }],
    [{ turn_number: 2, story_text: '현재 revision', player_action: '보고한다', turn_summary: '요약', parsed_blocks: { player_inner_thought: '판단한다', player_status: '회의 중', choices: ['A', 'B'] } }]
  );
  assert.deepEqual(records.map(record => record.turn_number), [2, 1]);
  assert.equal(records[0].story_text, '현재 revision');

  const md = formatHistoryMarkdown(records);
  assert.match(md, /## Turn 1[\s\S]*## Turn 2/);
  assert.match(md, /### 플레이어 행동[\s\S]*보고한다/);
  assert.match(md, /### 플레이어 속마음[\s\S]*판단한다/);
  assert.match(md, /### 플레이어 상황[\s\S]*회의 중/);
  assert.match(md, /### 선택지[\s\S]*1\. A/);
  assert.match(md, /### 턴 요약[\s\S]*요약/);

  const txt = formatHistoryText(records);
  assert.match(txt, /\[Turn 1\][\s\S]*\[Turn 2\]/);
  assert.match(txt, /플레이어 행동: 보고한다/);
  assert.match(txt, /턴 요약: 요약/);
});

test('new CSA card is promoted directly under the add button and focused once', () => {
  const focus = { called: 0, focus() { this.called += 1; } };
  const fresh = {
    textContent: '신규 상식개변', dataset: {}, scrolls: 0,
    scrollIntoView() { this.scrolls += 1; },
    querySelector() { return focus; }
  };
  const other = { textContent: '기존 상식개변', dataset: {}, querySelector() { return null; } };
  const add = {
    textContent: '+ 상식개변 추가', nextElementSibling: other,
    insertAdjacentElement(position, element) { assert.equal(position, 'afterend'); this.nextElementSibling = element; }
  };
  const rootNode = {
    querySelectorAll(selector) {
      if (selector === 'button') return [add];
      if (selector === '.csa-app-effect-card') return [other, fresh];
      return [];
    }
  };
  assert.equal(promoteNewCsaCard(rootNode), true);
  assert.equal(add.nextElementSibling, fresh);
  assert.equal(fresh.scrolls, 1);
  assert.equal(focus.called, 1);
  assert.equal(promoteNewCsaCard(rootNode), true);
  assert.equal(fresh.scrolls, 1, '같은 신규 카드는 한 번만 스크롤한다');
});

test('static shell exposes fallback, downloads, and dedicated recovery modules', () => {
  const html = fs.readFileSync(path.join(root, 'src/frontend/pages/index.html'), 'utf8');
  assert.match(html, /id="boot-fallback"/);
  assert.match(html, /<noscript>/);
  assert.match(html, /id="history-download-md"/);
  assert.match(html, /id="history-download-txt"/);
  assert.match(html, /history-tools\.js/);
  assert.match(html, /npc-finder\.js/);
  assert.match(html, /csa-product-ui\.js/);
  assert.match(html, /boot-guard\.js/);
});
