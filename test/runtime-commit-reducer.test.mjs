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
