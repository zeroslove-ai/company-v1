import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCompanyGameViewModel, canonicalSceneView } from '../src/frontend/pages/view-model.js';
import { buildCanonicalDisplayScene, buildNpcAppPayload } from '../src/api/runtime-display.js';

function context(save, turn = {}) { return { save: { data: save }, recent_turns: [turn], display: { npc_directory: { heroine1: { name: '서원희' }, heroine2: { name: '윤민아' } } } }; }

test('canonical scene is the sole frontend presence/focal/speaker authority', () => {
  const save = { player: { player_id: 'player-1' }, scene: { version: 1, scene_id: 'scene-a', location_id: 'room-a', beat: 2, goal: null, focus_thread: null, present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: null, updated_turn: 4 }, scene_state: { participants: ['player-1', 'heroine2'] }, last_npcs_present: ['heroine2'], focal_character_id: 'heroine2', last_speaker_id: 'heroine2', npc_scene_state: { heroine1: { clothing: { uniform_top: 'removed' } } } };
  const model = buildCompanyGameViewModel(context(save, { story_text: 'raw', parsed_blocks: { dialogue_lines: [] }, extract_delta: { image_character_id: 'heroine2' } }));
  assert.deepEqual(model.interacting_characters.map(item => item.id), ['heroine1']);
  assert.equal(model.focal_character.id, '');
  assert.equal(model.focal_character.last_speaker_id, '');
  assert.equal(model.media.image_character_id, '');
});

test('canonical empty presence ignores stale legacy members and monitor keys', () => {
  const save = { player: { player_id: 'player-1' }, scene: { version: 1, scene_id: 'scene-a', location_id: 'room-a', beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null }, scene_state: { participants: ['player-1', 'heroine1'] }, last_npcs_present: ['heroine1'], npc_stats: { heroine1: { affinity: 10 } } };
  const model = buildCompanyGameViewModel(context(save, { extract_delta: { mind_monitor: { heroine1: { surface: 'stale' } } }, parsed_blocks: {} }));
  assert.deepEqual(model.interacting_characters, []);
  assert.deepEqual(model.media.mind_monitor_entries, []);
});

test('API display scene and present_now use exact canonical presence', () => {
  const save = { scene: { version: 1, scene_id: 's', location_id: 'l', beat: 0, goal: null, focus_thread: null, present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: 'heroine2', updated_turn: 3 }, scene_state: { participants: ['heroine2'] }, last_npcs_present: ['heroine2'] };
  assert.deepEqual(buildCanonicalDisplayScene(save).present_npc_ids, ['heroine1']);
  const entries = buildNpcAppPayload(save, { characters: { characters: { heroine1: { name: '서원희' }, heroine2: { name: '윤민아' } } }, generalNpcs: { profiles: {} } });
  assert.equal(entries.find(item => item.id === 'heroine1').present_now, true);
  assert.equal(entries.find(item => item.id === 'heroine2').present_now, false);
});

test('canonicalSceneView only uses legacy compatibility when canonical scene is absent', () => {
  const legacy = canonicalSceneView({ scene_state: { participants: ['player', 'heroine1'] }, focal_character_id: 'heroine1' });
  assert.equal(legacy.compatibility_mode, 'legacy_pre_scene_v1');
  const canonical = canonicalSceneView({ scene: { version: 1, present_npc_ids: [], focal_character_id: 'heroine1', last_speaker_id: null } , scene_state: { participants: ['heroine1'] } });
  assert.deepEqual(canonical.present_npc_ids, []);
  assert.equal(canonical.focal_character_id, 'heroine1');
});
