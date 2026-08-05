import test from 'node:test';
import assert from 'node:assert/strict';

import { enrichAppEnvelope, enrichContextEnvelope, envelopeContext } from '../src/api/product-response.js';

const edition = {
  organization: {
    departments: [{ department_id: 'brand_strategy', name: '브랜드전략팀' }],
    general_npc_departments: [{ department_id: 'design', name: '디자인팀' }]
  },
  positions: { positions: [{ position_id: 'tf_lead', name: 'TF팀장' }] },
  bodyTypes: { body_types: [{ body_type_id: 'muscular', name: '근육질' }] },
  speechStyles: { speech_styles: [{ speech_style_id: 'rough_yangachi', name: '거친 말투' }] },
  characters: {
    characters: {
      heroine1: {
        character_id: 'heroine1', name: '서원희', age: 32,
        department: '브랜드전략팀', position: '차장', role_title: '팀장',
        initial_stats: { affection: 0 }
      }
    }
  },
  generalNpcs: {
    profiles: {
      general_lee: { id: 'general_lee', name: '이민석', department_id: 'design', role: '디자인팀 대리' }
    }
  },
  map: {
    locations: [
      { location_id: 'large_meeting_room', name: '대회의실', default_npc_ids: [] },
      { location_id: 'project_room', name: '프로젝트룸', department_id: 'design', location_type: 'project_space', default_npc_ids: ['general_lee'] }
    ]
  }
};

const save = {
  edition: 'company-v1',
  save_schema_version: 1,
  player: {
    name: '금태양', adult: true, department_id: 'brand_strategy', position_id: 'tf_lead',
    height_cm: 183, weight_kg: 75, penis_length_cm: 19,
    body_type_id: 'muscular', speech_style_id: 'rough_yangachi', background: '본사 회의 참석'
  },
  player_progress: { level: 2, exp: 30 },
  player_scene_state: { location_id: 'large_meeting_room', location_label: '대회의실', posture: 'standing' },
  player_sexual_state: { arousal: 4, ejaculation_progress: 10, ejaculation_count: 1 },
  scene_state: { location_id: 'large_meeting_room', location_label: '대회의실', participants: ['heroine1'] },
  focal_character_id: 'heroine1',
  last_speaker_id: 'heroine1',
  last_npcs_present: ['heroine1'],
  npc_stats: { heroine1: { affinity: 2, work_trust: 1, csa_acceptance: 3, sexual_arousal: 4 } },
  npc_scene_state: { heroine1: { location_id: 'large_meeting_room', location_label: '대회의실', posture: 'sitting' } },
  csa_active: [],
  csa_rules: {}
};

function context() {
  return {
    save: { data: structuredClone(save), committed_turn: 3 },
    recent_turns: [{
      turn_number: 3,
      mind_monitor: { heroine1: { surface: '업무를 확인한다.', subconscious: '조금 신경 쓰인다.' } },
      turn_summary: '회의가 이어졌다.'
    }]
  };
}

test('context enrichment writes into payload.data.context rather than an unused top-level field', () => {
  const payload = { ok: true, data: { context: context() } };
  const enriched = enrichContextEnvelope(payload, edition);
  assert.equal(enriched.ok, true);
  assert.equal(enriched.context, undefined);
  assert.equal(enriched.data.context.display.player_info.name, '금태양');
  assert.equal(enriched.data.context.display.player_info.height_cm, 183);
  assert.equal(enriched.data.context.display.player_info.current_location, '대회의실');
  assert.equal(enriched.data.context.display.npc_finder.length, 2);
  assert.equal(envelopeContext(enriched), enriched.data.context);
});

test('app enrichment writes complete player and registered NPC data into payload.data.app', () => {
  const payload = { ok: true, data: { app: { player_info: { name: '부분값' }, npcs: [] } } };
  const enriched = enrichAppEnvelope(payload, context(), edition);
  assert.equal(enriched.ok, true);
  assert.equal(enriched.app, undefined);
  assert.equal(enriched.data.app.player_info.name, '금태양');
  assert.equal(enriched.data.app.player_info.position, 'TF팀장');
  assert.equal(enriched.data.app.player_info.penis_length_cm, 19);
  assert.equal(enriched.data.app.npcs.length, 2);
  assert.equal(enriched.data.app.npcs[0].name, '서원희');
  assert.equal(enriched.data.app.npcs[0].stats.work_trust, 1);
  assert.equal(enriched.data.app.npcs[0].mind.surface, '업무를 확인한다.');
  assert.equal(enriched.data.app.finder_npcs.length, 2);
});
