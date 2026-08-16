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
  assert.equal(model.media.image_character_id, 'heroine1');
});

test('media target prefers the last local dialogue speaker without a semantic event ledger', () => {
  const save = { player: { player_id: 'player-1' }, scene: { version: 1, scene_id: 'scene-a', location_id: 'room-a', beat: 2, goal: null, focus_thread: null, present_npc_ids: ['heroine1', 'heroine2'], focal_character_id: null, last_speaker_id: 'heroine2', updated_turn: 4 }, turn_state: { committed_turn: 4 }, npc_scene_state: { heroine1: {}, heroine2: {} } };
  const model = buildCompanyGameViewModel(context(save, { extract_delta: { image_character_id: 'heroine3', image_selection: null }, parsed_blocks: { dialogue_lines: [{ speaker_id: 'heroine1', text: '첫 대사' }, { speaker_id: 'heroine2', text: '마지막 대사' }] } }));
  assert.equal(model.media.image_character_id, 'heroine2');
  assert.equal(model.media.image_pool, 'general');
});

test('canonical empty presence ignores stale legacy members and monitor keys', () => {
  const save = { player: { player_id: 'player-1' }, scene: { version: 1, scene_id: 'scene-a', location_id: 'room-a', beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null }, scene_state: { participants: ['player-1', 'heroine1'] }, last_npcs_present: ['heroine1'], npc_stats: { heroine1: { affinity: 10 } } };
  const model = buildCompanyGameViewModel(context(save, { extract_delta: { mind_monitor: { heroine1: { surface: 'stale' } } }, parsed_blocks: {} }));
  assert.deepEqual(model.interacting_characters, []);
  assert.deepEqual(model.media.mind_monitor_entries, []);
});

test('Mind Monitor does not create a tab from stats alone', () => {
  const save = { player: { player_id: 'player-1' }, scene: { version: 1, scene_id: 'scene-a', location_id: 'room-a', beat: 0, goal: null, focus_thread: null, present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: null }, npc_stats: { heroine1: { affinity: 12 } } };
  const model = buildCompanyGameViewModel(context(save, { extract_delta: { extract_version: 2, mind_monitor: {} } }));
  assert.deepEqual(model.media.mind_monitor_entries, []);
});

test('API display scene and present_now use exact canonical presence', () => {
  const save = { scene: { version: 1, scene_id: 's', location_id: 'l', beat: 0, goal: null, focus_thread: null, present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: 'heroine2', updated_turn: 3 }, scene_state: { participants: ['heroine2'] }, last_npcs_present: ['heroine2'] };
  assert.deepEqual(buildCanonicalDisplayScene(save).present_npc_ids, ['heroine1']);
  const entries = buildNpcAppPayload(save, { characters: { characters: { heroine1: { name: '서원희' }, heroine2: { name: '윤민아' } } }, generalNpcs: { profiles: {} } });
  assert.equal(entries.find(item => item.id === 'heroine1').present_now, true);
  assert.equal(entries.find(item => item.id === 'heroine2').present_now, false);
});

test('API display scene fails closed without canonical scene and does not revive legacy mirrors', () => {
  const legacy = {
    scene_state: { scene_id: 'legacy', location_id: 'room', participants: ['heroine1'] },
    last_npcs_present: ['heroine2'],
    focal_character_id: 'heroine1',
    last_speaker_id: 'heroine1'
  };
  const display = buildCanonicalDisplayScene(legacy);
  assert.equal(display.compatibility_mode, 'missing_canonical_scene');
  assert.deepEqual(display.present_npc_ids, []);
});

test('canonicalSceneView fails closed without canonical scene and ignores legacy mirrors', () => {
  const legacy = canonicalSceneView({ scene_state: { participants: ['player', 'heroine1'] }, focal_character_id: 'heroine1' });
  assert.equal(legacy.compatibility_mode, 'missing_canonical_scene');
  assert.deepEqual(legacy.present_npc_ids, []);
  const canonical = canonicalSceneView({ scene: { version: 1, present_npc_ids: [], focal_character_id: 'heroine1', last_speaker_id: null } , scene_state: { participants: ['heroine1'] } });
  assert.deepEqual(canonical.present_npc_ids, []);
  assert.equal(canonical.focal_character_id, 'heroine1');
});
