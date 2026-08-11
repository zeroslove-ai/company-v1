import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStoryCharacterProjection, buildStoryPrompt } from '../src/engine/story-prompt.js';
import { reduceCanonicalScene } from '../src/engine/runtime-core/scene-reducer.js';

const edition = {
  editionId: 'company-v1',
  characters: { characters: {
    heroine1: { name: 'Alpha', position: 'Lead', role_title: 'Manager', prompt_card: { personality: 'calm' } },
    heroine2: { name: 'Beta', position: 'Designer', role_title: 'Designer', prompt_card: { personality: 'direct' } },
    heroine3: { name: 'Gamma', position: 'Analyst', role_title: 'Analyst', prompt_card: { personality: 'bright' } }
  } },
  generalNpcs: { profiles: {} }
};
const save = { scene: { version: 1, scene_id: 'room', location_id: 'room', present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: null, beat: 0, updated_turn: 1 }, npc_scene_state: {} };

test('reference is not an actor and receives no full prompt card', () => {
  const projection = buildStoryCharacterProjection({ edition, save, playerAction: 'Beta를 생각한다', sceneCastContract: { present_npc_ids: ['heroine1'], entering_npc_ids: [], remote_npc_ids: [] }, workplace: { eligible_nearby_npcs: [] } });
  assert.deepEqual(Object.keys(projection.scene_actors), ['heroine1']);
  assert.equal(projection.reference_characters[0].id, 'heroine2');
  assert.equal('prompt_card' in projection.reference_characters[0], false);
});

test('explicit entrant and remote contact stay separate from current presence', () => {
  const projection = buildStoryCharacterProjection({ edition, save, playerAction: 'Beta에게 전화한다', sceneCastContract: { present_npc_ids: ['heroine1'], entering_npc_ids: ['heroine2'], remote_npc_ids: ['heroine3'] }, workplace: { eligible_nearby_npcs: [] } });
  assert.deepEqual(projection.scene_actor_ids, ['heroine1']);
  assert.equal(projection.possible_entrants[0].id, 'heroine2');
  assert.equal(projection.remote_contacts[0].id, 'heroine3');
  assert.equal(projection.reference_characters.length, 0);
});

test('Story payload exposes the separated projections', () => {
  const payload = JSON.parse(buildStoryPrompt({ edition, context: { game: {}, save, recent_turns: [] }, playerAction: 'Beta를 생각한다', expectedTurn: 2, sceneCastContract: { present_npc_ids: ['heroine1'], entering_npc_ids: [], remote_npc_ids: [] } })[1].content);
  assert.ok(payload.scene_actors.heroine1);
  assert.equal(payload.reference_characters[0].id, 'heroine2');
  assert.equal('prompt_card' in payload.reference_characters[0], false);
  assert.equal('allowed_speaker_ids' in payload.scene_cast_contract, false);
  assert.equal('active_character_canon' in payload, false);
  assert.equal('active_general_npc_canon' in payload, false);
});

test('registered local Story speaker is direct presence evidence', () => {
  const scene = { scene_id: 'room', location_id: 'room', present_npc_ids: [], focal_character_id: null, last_speaker_id: null, beat: 0, updated_turn: 1 };
  const next = reduceCanonicalScene({ currentScene: scene, npcIds: new Set(['heroine2']), mapLocations: [{ location_id: 'room' }], observation: { outcome: 'success', final_present_npc_ids: [], explicit_speaker_ids: ['heroine2'], remote_speaker_ids: [] }, expectedTurn: 2 });
  assert.deepEqual(next.present_npc_ids, ['heroine2']);
});

test('autonomous registered local entrance can be committed from final presence evidence', () => {
  const scene = { scene_id: 'room', location_id: 'room', present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: null, beat: 0, updated_turn: 1 };
  const next = reduceCanonicalScene({ currentScene: scene, npcIds: new Set(['heroine1', 'heroine3']), mapLocations: [{ location_id: 'room' }], observation: { outcome: 'success', final_present_npc_ids: ['heroine1', 'heroine3'], explicit_speaker_ids: ['heroine3'], remote_speaker_ids: [] }, expectedTurn: 2 });
  assert.deepEqual(next.present_npc_ids, ['heroine1', 'heroine3']);
});

test('remote speaker does not become local presence and unknown speaker fails closed', () => {
  const scene = { scene_id: 'room', location_id: 'room', present_npc_ids: [], focal_character_id: null, last_speaker_id: null, beat: 0, updated_turn: 1 };
  const remote = reduceCanonicalScene({ currentScene: scene, npcIds: new Set(['heroine2']), mapLocations: [{ location_id: 'room' }], observation: { outcome: 'success', final_present_npc_ids: [], explicit_speaker_ids: ['heroine2'], remote_speaker_ids: ['heroine2'] }, expectedTurn: 2 });
  assert.deepEqual(remote.present_npc_ids, []);
  assert.throws(() => reduceCanonicalScene({ currentScene: scene, npcIds: new Set(['heroine2']), mapLocations: [{ location_id: 'room' }], observation: { outcome: 'success', final_present_npc_ids: [], explicit_speaker_ids: ['unknown'], remote_speaker_ids: [] }, expectedTurn: 2 }), /not a registered/);
});
