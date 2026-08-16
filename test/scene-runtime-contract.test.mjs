import test from 'node:test';
import assert from 'node:assert/strict';
import { reduceCanonicalScene } from '../src/engine/runtime-core/scene-reducer.js';

const master = { characters: [{ character_id: 'heroine1' }, { character_id: 'heroine4' }], general_npcs: [] };
const base = { version: 1, scene_id: 'meeting', location_id: 'meeting', beat: 2, goal: null, focus_thread: null, present_npc_ids: ['heroine4'], focal_character_id: null, last_speaker_id: 'heroine4', updated_turn: 6 };
const observation = ({ speakers = [], entered = [], evidence = [], remote = [] } = {}) => ({ outcome: 'success', location_id: null, entered_npc_ids: entered, exited_npc_ids: [], explicit_speaker_ids: speakers, remote_speaker_ids: remote, evidence, scene_id: null, scene_goal_provided: false, focus_thread_provided: false });

test('movement clears source presence and accepts destination evidence only', () => {
  const result = reduceCanonicalScene({ currentScene: base, authoritativeLocationId: 'office', mapLocations: [{ location_id: 'meeting' }, { location_id: 'office' }], master, npcIds: new Set(['heroine1', 'heroine4']), expectedTurn: 7, observation: observation({ speakers: ['heroine4', 'heroine1'], evidence: [{ kind: 'presence', character_id: 'heroine1', location_id: 'office', quote: 'heroine1 speaks in office' }] }) });
  assert.equal(result.location_id, 'office');
  assert.deepEqual(result.present_npc_ids, ['heroine1']);
  assert.equal(result.present_npc_ids.includes('heroine4'), false);
});

test('remote speakers never become local presence', () => {
  const result = reduceCanonicalScene({ currentScene: base, mapLocations: [{ location_id: 'meeting' }], master, npcIds: new Set(['heroine1', 'heroine4']), expectedTurn: 7, observation: observation({ speakers: ['heroine1'], remote: ['heroine1'] }) });
  assert.deepEqual(result.present_npc_ids, ['heroine4']);
});

test('ordinary-turn local dialogue may establish current presence', () => {
  const result = reduceCanonicalScene({ currentScene: { ...base, present_npc_ids: [] }, mapLocations: [{ location_id: 'meeting' }], master, npcIds: new Set(['heroine1', 'heroine4']), expectedTurn: 7, observation: observation({ speakers: ['heroine1'] }) });
  assert.deepEqual(result.present_npc_ids, ['heroine1']);
});

test('general NPCs use the same canonical scene presence path as characters', () => {
  const generalMaster = { characters: [], general_npcs: [{ npc_id: 'npc-hayeon', name: '하연' }] };
  const result = reduceCanonicalScene({
    currentScene: { ...base, present_npc_ids: [] },
    mapLocations: [{ location_id: 'meeting' }],
    master: generalMaster,
    npcIds: new Set(['npc-hayeon']),
    expectedTurn: 7,
    observation: observation({ speakers: ['npc-hayeon'], evidence: [{ kind: 'presence', character_id: 'npc-hayeon', location_id: 'meeting', quote: '하연이 회의실에 있다' }] })
  });
  assert.deepEqual(result.present_npc_ids, ['npc-hayeon']);
});
