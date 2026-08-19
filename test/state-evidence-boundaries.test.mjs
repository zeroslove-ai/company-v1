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

test('deleted numeric player sexual mechanics do not reappear from Extract', () => {
  const result = reducePlayerSexualObservation({ save: { player_sexual_state: { arousal: 0, ejaculation_progress: 20 } }, sexual: { arousal_delta: 2, ejaculation_progress_delta: 3 }, evidence: {}, storyText: '', expectedTurn: 1 });
  assert.deepEqual(result.state, { erection_state: 'unknown', updated_turn: 1 });
  assert.ok(result.warnings.length >= 2);
});

test('actor-scoped physical evidence authorizes exact NPC position changes', () => {
  const save = { npc_scene_state: { npc1: {} }, scene: { version: 1, scene_id: 'room', location_id: 'room', beat: 0, goal: null, focus_thread: null, present_npc_ids: ['npc1'], focal_character_id: null, last_speaker_id: null, updated_turn: 0 } };
  const result = reduceNpcPhysicalObservation({
    save,
    npcId: 'npc1',
    physical: { position_label: 'by the window' },
    evidence: { actors: { npc1: {
      character_id: 'npc1',
      changed: ['npc_scene_state.npc1.position_label'],
      quote: 'A person stands by the window'
    } } },
    storyText: 'A person stands by the window.',
    expectedTurn: 1,
    npcIds: new Set(['npc1']),
    master: { characters: [{ character_id: 'npc1', name: 'Canonical Name' }] },
    sceneBefore: save.scene,
    sceneAfter: save.scene,
    observedNpcIds: new Set(['npc1'])
  });
  assert.equal(result.state.position_label, 'by the window');
});

test('actor mismatch cannot authorize another NPC physical state', () => {
  const save = { npc_scene_state: { npc1: { position_label: 'seated' } }, scene: { version: 1, scene_id: 'room', location_id: 'room', beat: 0, goal: null, focus_thread: null, present_npc_ids: ['npc1'], focal_character_id: null, last_speaker_id: null, updated_turn: 0 } };
  const result = reduceNpcPhysicalObservation({
    save,
    npcId: 'npc1',
    physical: { position_label: 'by the window' },
    evidence: { actors: { npc2: { character_id: 'npc2', changed: ['npc_scene_state.npc2.position_label'], quote: 'NPC stands by the window' } } },
    storyText: 'NPC stands by the window.',
    expectedTurn: 1,
    npcIds: new Set(['npc1', 'npc2']),
    master: { characters: [{ character_id: 'npc1', name: 'NPC' }, { character_id: 'npc2', name: 'Other' }] },
    sceneBefore: save.scene,
    sceneAfter: save.scene,
    observedNpcIds: new Set(['npc1'])
  });
  assert.equal(result.state.position_label, 'seated');
});

test('retained player erection state updates only from exact Story evidence', () => {
  const result = reducePlayerSexualObservation({
    save: { player_sexual_state: { arousal: 10, ejaculation_count: 3 } },
    sexual: { erection_state: 'erect' },
    evidence: { actors: { player: {
      character_id: 'player',
      changed: ['player_sexual_state.erection_state'],
      quote: 'The player is erect as their heart races'
    } } },
    storyText: 'The player is erect as their heart races.',
    expectedTurn: 2
  });
  assert.equal(result.state.erection_state, 'erect');
  assert.equal('arousal' in result.state, false);
  assert.equal('ejaculation_count' in result.state, false);
});
