import test from 'node:test';
import assert from 'node:assert/strict';
import edition from '../src/api/edition.js';
import { resolvePlayerNavigationIntent } from '../src/engine/scene-cast.js';

const master = { characters: Object.values(edition.characters.characters), general_npcs: Object.values(edition.generalNpcs.profiles) };
const mapLocations = edition.map.locations;
const save = { scene: { version: 1, scene_id: 'brand_strategy_office', location_id: 'brand_strategy_office', beat: 1, goal: null, focus_thread: null, present_npc_ids: ['heroine4'], focal_character_id: null, last_speaker_id: null, updated_turn: 1 } };
const lobbySave = { scene: { ...save.scene, scene_id: 'lobby', location_id: 'lobby' }, npc_scene_state: { heroine2: { location_id: 'lobby' } } };

test('explicit player location navigation resolves one catalog destination', () => {
  const result = resolvePlayerNavigationIntent({ save, master, mapLocations, playerAction: '회의실로 이동한다.' });
  assert.equal(result?.kind, 'player_navigation');
  assert.ok(result?.destination_location_id);
});

test('NPC-directed movement never becomes player navigation', () => {
  const result = resolvePlayerNavigationIntent({ save, master, mapLocations, playerAction: '서원희가 로비로 이동한다.' });
  assert.equal(result, null);
});

test('exact registered NPC destination resolves from catalog location and preserves target identity', () => {
  const result = resolvePlayerNavigationIntent({ save: lobbySave, master, mapLocations, playerAction: '윤민아 보러간다' });
  assert.deepEqual(result, {
    kind: 'player_navigation',
    destination_location_id: 'brand_strategy_office',
    target_npc_id: 'heroine2',
    source: 'explicit_npc_destination'
  });
});

test('NPC destination ignores stale scene mirrors and requires a visit intent', () => {
  assert.equal(resolvePlayerNavigationIntent({ save: lobbySave, master, mapLocations, playerAction: '윤민아가 로비에서 일한다' }), null);
  const result = resolvePlayerNavigationIntent({ save: lobbySave, master, mapLocations, playerAction: '윤민아 보러간다' });
  assert.equal(result.destination_location_id, 'brand_strategy_office');
});

test('ambiguous or unmarked location mentions do not mutate navigation intent', () => {
  assert.equal(resolvePlayerNavigationIntent({ save, master, mapLocations, playerAction: '회의실 자료를 검토한다.' }), null);
});
