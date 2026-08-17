import test from 'node:test';
import assert from 'node:assert/strict';
import { reduceNpcPhysicalObservation, reducePlayerSexualObservation } from '../src/engine/runtime-core/observation-reducers.js';

test('physical/clothing state requires exact Story evidence', () => {
  const save = { npc_scene_state: { npc1: {} }, scene: { version: 1, scene_id: 'room', location_id: 'room', beat: 0, goal: null, focus_thread: null, present_npc_ids: ['npc1'], focal_character_id: null, last_speaker_id: null, updated_turn: 0 } };
  const result = reduceNpcPhysicalObservation({ save, npcId: 'npc1', physical: { posture: 'standing' }, evidence: {}, storyText: 'nothing', expectedTurn: 1, npcIds: new Set(['npc1']), master: { characters: [{ character_id: 'npc1', name: 'NPC' }] }, sceneBefore: save.scene, sceneAfter: save.scene, observedNpcIds: new Set(['npc1']) });
  assert.equal(result.state.posture, 'unknown');
  assert.equal(result.state.position_label, null);
  assert.equal(result.state.updated_turn, 1);
  assert.ok(result.warnings.length > 0);
});

test('player sexual mechanics remain evidence-gated and separate from relationship state', () => {
  const result = reducePlayerSexualObservation({ save: { player_sexual_state: { arousal: 0 } }, sexual: { arousal_delta: 2 }, evidence: {}, storyText: '', expectedTurn: 1 });
  assert.equal(result.state.arousal, 0);
});
