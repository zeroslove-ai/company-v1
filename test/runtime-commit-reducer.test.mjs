import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { reduceGameplayCommit } from '../src/engine/runtime-core/commit-reducer.js';
import { normalizeExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';

const save = JSON.parse(fs.readFileSync(new URL('../fixtures/phase-0.5/canonical-save-v1.json', import.meta.url)));
const NPCS = new Set(['npc-hayeon', 'npc-areum', 'npc-minsu']);
const baseObservation = { extract_version: 2, outcome: 'success', scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null, presence_is_final: false, remote_speaker_ids: [], evidence: [] }, player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3, mind_monitor: {}, action_target_id: null, image_character_id: null, image_selection: null, csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '', warnings: [] };
const action = { action_id: 'a', turn_id: 't', action_kind: 'player_turn', player_action: '계속 진행한다' };

test('reduceGameplayCommit is the single V2 orchestration writer', () => {
  const observation = normalizeExtractObservationV2(baseObservation, { npcIds: NPCS });
  const result = reduceGameplayCommit({ currentSave: save, observation, parsedStory: { choices: ['a', 'b', 'c', 'd'], dialogue_lines: [], player_inner_thought: '' }, rawStory: '본문', action, expectedTurn: 8, npcIds: NPCS, mapLocations: [] });
  assert.equal(result.nextSave.turn_state.committed_turn, 7);
  assert.equal(result.nextSave.turn_state.expected_turn, 9);
  assert.equal(result.nextSave.scene_state.updated_turn, 8);
  assert.equal(result.canonical_scene.updated_turn, 8);
});
test('V2 reducer keeps scene authority separate from NPC physical observation', () => {
  const observation = normalizeExtractObservationV2({ ...baseObservation, npc_observations: { 'npc-hayeon': { physical: { clothing: { uniform_top: 'removed' } } } }, evidence: { clothing: { 'npc-hayeon': { quote: '하연이 셔츠를 벗었다', character_id: 'npc-hayeon' } } } }, { npcIds: NPCS });
  const result = reduceGameplayCommit({ currentSave: save, observation, parsedStory: { choices: [], dialogue_lines: [], player_inner_thought: '' }, rawStory: '하연이 셔츠를 벗었다', action, expectedTurn: 8, npcIds: NPCS, mapLocations: [] });
  assert.equal(result.nextSave.scene_state.location_id, save.scene_state.location_id);
  assert.equal(result.nextSave.scene_state.participants.join(','), save.scene_state.participants.join(','));
});

test('scene is reduced before domains so an entered NPC physical observation is retained', () => {
  const currentSave = {
    ...structuredClone(save),
    scene: { version: 1, scene_id: 'room', location_id: 'meeting_room_5f', beat: 1, goal: null, focus_thread: null, present_npc_ids: ['npc-hayeon'], focal_character_id: 'npc-hayeon', last_speaker_id: null, updated_turn: 7 },
    scene_state: { ...save.scene_state, participants: ['player-1', 'npc-hayeon'] },
    npc_scene_state: { ...save.npc_scene_state, 'npc-areum': { clothing: { uniform_top: 'worn' } } }
  };
  const rawStory = 'npc-areum entered and removed her shirt';
  const observation = normalizeExtractObservationV2({
    ...baseObservation,
    scene_observation: {
      scene_id: 'room', location_id: 'meeting_room_5f', final_present_npc_ids: ['npc-hayeon', 'npc-areum'],
      entered_npc_ids: ['npc-areum'], exited_npc_ids: [], focal_candidate_id: 'npc-areum', presence_is_final: true,
      remote_speaker_ids: [], evidence: [
        { kind: 'presence', character_id: 'npc-hayeon', quote: 'npc-areum entered' },
        { kind: 'entrance', character_id: 'npc-areum', quote: 'npc-areum entered' },
        { kind: 'presence', character_id: 'npc-areum', quote: 'npc-areum entered' }
      ]
    },
    npc_observations: { 'npc-areum': { physical: { clothing: { uniform_top: 'removed' } } } },
    evidence: { clothing: { 'npc-areum': { quote: rawStory, character_id: 'npc-areum' } } }
  }, { npcIds: new Set(['npc-hayeon', 'npc-areum', 'npc-minsu']), storyText: rawStory });
  const result = reduceGameplayCommit({
    currentSave, observation, parsedStory: { choices: [], dialogue_lines: [] }, rawStory,
    action: { action_id: 'entered-physical', turn_id: 'turn-8', action_kind: 'player_turn' }, expectedTurn: 8,
    npcIds: new Set(['npc-hayeon', 'npc-areum', 'npc-minsu']), mapLocations: []
  });
  assert.deepEqual(result.canonical_scene.present_npc_ids, ['npc-hayeon', 'npc-areum']);
  assert.equal(result.nextSave.npc_scene_state['npc-areum'].clothing.uniform_top, 'removed');
});

test('mind monitor entries for off-scene NPCs are dropped with an explicit warning', () => {
  const observation = normalizeExtractObservationV2({ ...baseObservation, mind_monitor: { 'npc-hayeon': { surface: 'on scene', subconscious: '' }, 'npc-areum': { surface: 'off scene', subconscious: '' } } }, { npcIds: NPCS });
  const currentSave = { ...structuredClone(save), scene: { version: 1, scene_id: 'room', location_id: 'meeting_room_5f', beat: 1, goal: null, focus_thread: null, present_npc_ids: ['npc-hayeon'], focal_character_id: 'npc-hayeon', last_speaker_id: null, updated_turn: 7 }, scene_state: { ...save.scene_state, participants: ['player-1', 'npc-hayeon'] } };
  const result = reduceGameplayCommit({ currentSave, observation, parsedStory: { choices: [], dialogue_lines: [] }, rawStory: 'plain story', action, expectedTurn: 8, npcIds: NPCS, mapLocations: [] });
  assert.ok(result.mind_monitor['npc-hayeon']);
  assert.equal(result.mind_monitor['npc-areum'], undefined);
  assert.ok(result.warnings.includes('mind_monitor_off_scene_dropped:npc-areum'));
});
