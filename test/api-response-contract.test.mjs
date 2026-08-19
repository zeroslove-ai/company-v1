import test from 'node:test';
import assert from 'node:assert/strict';

import { enrichAppEnvelope, enrichContextEnvelope } from '../src/api/product-response.js';

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
        initial_stats: { affinity: 0 }
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
  scene: { version: 1, scene_id: 'large_meeting_room', location_id: 'large_meeting_room', beat: 0, goal: null, focus_thread: null, present_npc_ids: ['heroine1'], focal_character_id: 'heroine1', last_speaker_id: 'heroine1', updated_turn: 3 },
  player_sexual_state: { arousal: 4, ejaculation_progress: 10, ejaculation_count: 1 },
  scene_state: { location_id: 'large_meeting_room', location_label: '대회의실', participants: ['heroine1'] },
  focal_character_id: 'heroine1',
  last_speaker_id: 'heroine1',
  last_npcs_present: ['heroine1'],
  npc_stats: { heroine1: { affinity: 2, resistance: 40, csa_acceptance: 3, sexual_arousal: 4 } },
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

test('context enrichment keeps active display fields and omits dead projections', () => {
  const payload = { ok: true, data: { context: context() } };
  const enriched = enrichContextEnvelope(payload, edition);
  assert.equal(enriched.ok, true);
  assert.equal(enriched.context, undefined);
  assert.equal(enriched.data.context.display.player_info, undefined);
  assert.equal(enriched.data.context.display.npc_finder, undefined);
  assert.ok(Array.isArray(enriched.data.context.display.map_locations));
  assert.ok(enriched.data.context.display.npc_default_locations);
  assert.equal(enriched.data.context.display.character_details, undefined);
  assert.equal(enriched.data.context.display.player_sexual, undefined);
});

test('app enrichment keeps canonical app data without finder projections', () => {
  const payload = { ok: true, data: { app: { player_info: { name: 'old' }, npcs: [] } } };
  const enriched = enrichAppEnvelope(payload, context(), edition);
  assert.equal(enriched.ok, true);
  assert.equal(enriched.app, undefined);
  assert.equal(enriched.data.app.player_info.name, '금태양');
  assert.equal(enriched.data.app.player_info.position, 'TF팀장');
  assert.equal(enriched.data.app.player_info.penis_length_cm, 19);
  assert.equal(enriched.data.app.npcs.length, 1);
  assert.equal(enriched.data.app.npcs[0].name, '서원희');
  assert.equal('stats' in enriched.data.app.npcs[0], false);
  assert.equal(enriched.data.app.npcs[0].mind.surface, '업무를 확인한다.');
  assert.equal(enriched.data.app.finder_npcs, undefined);
  assert.deepEqual(enriched.data.app.npcs[0].location, {
    known: true,
    location_label: '대회의실',
    location_id: 'large_meeting_room'
  });
  assert.equal(enriched.data.app.npcs[0].location.suggested_location_id, undefined);
  assert.equal(enriched.data.app.npcs[0].location.suggested_location_label, undefined);
});
