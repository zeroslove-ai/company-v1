import test from 'node:test';
import assert from 'node:assert/strict';

import edition from '../src/api/edition.js';
import { buildNpcAppPayload } from '../src/api/runtime-display.js';
import { enrichAppEnvelope } from '../src/api/product-response.js';

const heroineIds = Object.keys(edition.characters.characters);
const generalIds = Object.keys(edition.generalNpcs.profiles);

function baseSave() {
  return {
    player: { player_id: 'player-1', name: 'Player' },
    turn_state: { committed_turn: 1 },
    scene: {
      version: 1, scene_id: 'scope-test', location_id: null, beat: 0,
      goal: null, focus_thread: null, present_npc_ids: [],
      focal_character_id: null, last_speaker_id: null, updated_turn: 1
    },
    player_scene_state: {}, player_sexual_state: {}, npc_stats: {},
    npc_relationship_state: {}, npc_scene_state: {}, csa_attitudes: {},
    npc_sexual_state: {}, npc_identity_state: {}, csa_active: [], csa_rules: {}
  };
}

function appNpcs(save) {
  const payload = { data: { app: { player_info: {}, npcs: [] } } };
  enrichAppEnvelope(payload, { save: { data: save }, recent_turns: [] }, edition);
  return payload.data.app.npcs;
}

test('app.npcs keeps evidence-aware scope and never enumerates Finder-only NPCs', () => {
  const fresh = baseSave();
  const heroinePresent = baseSave();
  heroinePresent.scene = { ...heroinePresent.scene, present_npc_ids: ['heroine2'], focal_character_id: 'heroine2', last_speaker_id: 'heroine2', location_id: 'meeting_room' };
  const generalPresent = baseSave();
  generalPresent.scene = { ...generalPresent.scene, present_npc_ids: [generalIds[0]], focal_character_id: generalIds[0], last_speaker_id: generalIds[0], location_id: 'meeting_room' };
  const evidenceOnly = baseSave();
  evidenceOnly.npc_stats[generalIds[1]] = { affection: 1 };
  const registeredUnknownGeneral = baseSave();

  const fixtures = [
    [fresh, heroineIds], [heroinePresent, heroineIds],
    [generalPresent, [...heroineIds, generalIds[0]]],
    [evidenceOnly, [...heroineIds, generalIds[1]]],
    [registeredUnknownGeneral, heroineIds]
  ];
  for (const [save, expectedIds] of fixtures) {
    const entries = appNpcs(save);
    assert.deepEqual(entries.map(item => item.id), expectedIds);
    for (const entry of entries) {
      assert.equal('status' in entry, false);
      assert.equal('can_move' in entry, false);
      assert.equal('suggested_location_id' in entry, false);
      assert.equal('suggested_location_label' in entry, false);
      assert.equal('suggestion_source' in entry, false);
    }
  }
});

test('app.npcs location shape uses canonical scene only', () => {
  const canonical = baseSave();
  canonical.scene = { ...canonical.scene, present_npc_ids: ['heroine2'], focal_character_id: 'heroine2', last_speaker_id: 'heroine2', location_id: 'meeting_room' };
  canonical.npc_scene_state.heroine2 = { location_id: 'stale_lounge', location_label: 'stale' };
  const legacyScene = baseSave();
  legacyScene.npc_scene_state.heroine2 = { location_id: 'lounge', location_label: 'lounge' };

  const canonicalLocation = appNpcs(canonical).find(item => item.id === 'heroine2')?.location;
  assert.equal(canonicalLocation.location_id, 'meeting_room');
  const legacyLocation = appNpcs(legacyScene).find(item => item.id === 'heroine2')?.location;
  assert.equal(legacyLocation.location_id, '');
  for (const location of [canonicalLocation, legacyLocation]) {
    assert.equal('status' in location, false);
    assert.equal('can_move' in location, false);
    assert.equal('suggested_location_id' in location, false);
    assert.equal('suggested_location_label' in location, false);
    assert.equal('suggestion_source' in location, false);
  }
});
