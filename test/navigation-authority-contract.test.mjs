import test from 'node:test';
import assert from 'node:assert/strict';
import edition from '../src/api/edition.js';
import { resolvePlayerNavigationIntent } from '../src/engine/scene-cast.js';

const master = { characters: Object.values(edition.characters.characters), general_npcs: Object.values(edition.generalNpcs.profiles) };
const mapLocations = edition.map.locations;
const save = { scene: { version: 1, scene_id: 'brand_strategy_office', location_id: 'brand_strategy_office', beat: 1, goal: null, focus_thread: null, present_npc_ids: ['heroine4'], focal_character_id: null, last_speaker_id: null, updated_turn: 1 } };

test('explicit player location navigation resolves one catalog destination', () => {
  const result = resolvePlayerNavigationIntent({ save, master, mapLocations, playerAction: '회의실로 이동한다.' });
  assert.equal(result?.kind, 'player_navigation');
  assert.ok(result?.destination_location_id);
});

test('NPC-directed movement never becomes player navigation', () => {
  const result = resolvePlayerNavigationIntent({ save, master, mapLocations, playerAction: '서원희가 로비로 이동한다.' });
  assert.equal(result, null);
});

test('ambiguous or unmarked location mentions do not mutate navigation intent', () => {
  assert.equal(resolvePlayerNavigationIntent({ save, master, mapLocations, playerAction: '회의실 자료를 검토한다.' }), null);
});
