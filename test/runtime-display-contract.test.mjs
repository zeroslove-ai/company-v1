import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContextDisplayPayload, buildNpcAppPayload } from '../src/api/runtime-display.js';

const edition = { organization: { departments: [] }, characters: { characters: { heroine1: { character_id: 'heroine1', name: 'A', department: 'd', position: 'p', role_title: 'r' } } }, generalNpcs: { profiles: { npc1: { npc_id: 'npc1', name: 'N', department_id: 'd', role: 'staff' } } }, map: { locations: [{ location_id: 'room', name: 'Room' }] } };
const save = { scene: { version: 1, scene_id: 'room', location_id: 'room', beat: 1, goal: null, focus_thread: null, present_npc_ids: ['heroine1'], focal_character_id: 'heroine1', last_speaker_id: 'heroine1', updated_turn: 1 }, npc_scene_state: { heroine1: { posture: 'standing', clothing: { uniform_top: 'worn' } } }, csa_active: [], csa_rules: [], world_state: {} };

test('context display reads canonical scene and retained CSA capability only', () => {
  const result = buildContextDisplayPayload(save, edition);
  assert.equal(result.scene.location_id, 'room');
  assert.deepEqual(result.scene.present_npc_ids, ['heroine1']);
  assert.ok(Array.isArray(result.active_csa));
});

test('NPC presentation exposes identity, scene and Mind Monitor, not generic semantic metrics', () => {
  const result = buildNpcAppPayload(save, edition, { heroine1: { surface: '오늘 일에 집중하자.', subconscious: '조금 긴장된다.' } });
  assert.equal(result.length, 1);
  assert.equal(result[0].present_now, true);
  assert.deepEqual(result[0].mind, { surface: '오늘 일에 집중하자.', subconscious: '조금 긴장된다.' });
  for (const key of ['stats', 'relationship_summary']) assert.equal(key in result[0], false);
});
