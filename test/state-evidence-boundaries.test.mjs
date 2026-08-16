import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { reduceNpcPhysicalObservation, reduceNpcStatObservation, reduceStoryChoiceProjection } from '../src/engine/runtime-core/observation-reducers.js';
import { normalizeExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { reduceGameplayCommit } from '../src/engine/runtime-core/commit-reducer.js';
import { normalizePersistedExtractObservation } from '../src/engine/runtime-core/persisted-extract-observation.js';
import { parseFreshNarrativeV2 } from '../src/engine/fresh-narrative-parser.js';

const seed = JSON.parse(fs.readFileSync(new URL('../fixtures/phase-0.5/canonical-save-v1.json', import.meta.url)));
const npcIds = new Set(['npc-hayeon', 'npc-areum', 'npc-minsu']);
const currentScene = { version: 1, scene_id: 'room', location_id: 'meeting_room_5f', beat: 0, goal: null, focus_thread: null, present_npc_ids: ['npc-hayeon'], focal_character_id: 'npc-hayeon', last_speaker_id: null, updated_turn: 7 };
const master = { characters: [{ character_id: 'npc-hayeon', name: 'Hayeon' }, { character_id: 'npc-areum', name: 'Areum' }] };
const physicalArgs = (save, physical, evidence, storyText, extra = {}) => reduceNpcPhysicalObservation({ save, npcId: 'npc-hayeon', physical, evidence, storyText, expectedTurn: 8, npcIds, master, parsedStory: {}, sceneBefore: currentScene, sceneAfter: currentScene, observedNpcIds: ['npc-hayeon'], ...extra });

test('domain clothing keeps an already-removed slot as a no-op', () => {
  const save = { ...structuredClone(seed), npc_scene_state: { ...seed.npc_scene_state, 'npc-hayeon': { ...seed.npc_scene_state['npc-hayeon'], clothing: { ...seed.npc_scene_state['npc-hayeon'].clothing, uniform_top: 'removed' } } } };
  const result = physicalArgs(save, { clothing: { uniform_top: 'removed' } }, {}, 'nothing changes');
  assert.equal(result.state.clothing.uniform_top, 'removed');
});

test('domain clothing requires exact Story evidence and rejects magical or planned transitions', () => {
  const save = structuredClone(seed);
  const missing = physicalArgs(save, { clothing: { uniform_top: 'removed' } }, {}, 'Hayeon keeps working');
  assert.equal(missing.state.clothing.uniform_top, 'worn');
  const magical = physicalArgs(save, { clothing: { uniform_top: 'removed' } }, { clothing: { 'npc-hayeon': { quote: '규칙 때문에 자동으로 벗겨졌다', character_id: 'npc-hayeon' } } }, '규칙 때문에 자동으로 벗겨졌다');
  assert.equal(magical.state.clothing.uniform_top, 'worn');
  const planned = physicalArgs(save, { clothing: { uniform_top: 'removed' } }, { clothing: { 'npc-hayeon': { quote: 'Hayeon 벗으려고 한다', character_id: 'npc-hayeon' } } }, 'Hayeon 벗으려고 한다');
  assert.equal(planned.state.clothing.uniform_top, 'worn');
});

test('domain physical state preserves posture/position and separates player from NPC', () => {
  const save = { ...structuredClone(seed), player_scene_state: { posture: 'seated', position_label: 'desk' }, npc_scene_state: { ...seed.npc_scene_state, 'npc-hayeon': { ...seed.npc_scene_state['npc-hayeon'], posture: 'standing', position_label: 'door' } } };
  const result = physicalArgs(save, {}, {}, 'quiet room');
  assert.equal(result.state.posture, 'standing');
  assert.equal(result.state.position_label, 'door');
  assert.equal(save.player_scene_state.posture, 'seated');
});

test('entered NPC clothing is retained while an off-scene NPC is rejected', () => {
  const save = structuredClone(seed);
  const entered = physicalArgs(save, { clothing: { uniform_top: 'removed' } }, { clothing: { 'npc-areum': { quote: 'Areum removed her shirt', character_id: 'npc-areum' } } }, 'Areum removed her shirt', { sceneAfter: { ...currentScene, present_npc_ids: ['npc-hayeon', 'npc-areum'] }, observedNpcIds: ['npc-hayeon', 'npc-areum'], npcId: 'npc-areum', master: { characters: [{ character_id: 'npc-areum', name: 'Areum' }] } });
  assert.equal(entered.state.clothing.uniform_top, 'removed');
  const offScene = reduceNpcPhysicalObservation({ save, npcId: 'npc-minsu', physical: { clothing: { uniform_top: 'removed' } }, evidence: { clothing: { 'npc-minsu': { quote: 'Minsu removed her shirt', character_id: 'npc-minsu' } } }, storyText: 'Minsu removed her shirt', npcIds, sceneBefore: currentScene, sceneAfter: currentScene, observedNpcIds: ['npc-hayeon'] });
  assert.deepEqual(offScene.state, save.npc_scene_state['npc-minsu']);
  assert.ok(offScene.warnings.some(item => item.includes('off_scene')));
});

test('stat reducer rejects absolute or out-of-range proposals', () => {
  const stats = reduceNpcStatObservation({ save: { npc_stats: { 'npc-hayeon': { affinity: 20 } } }, npcId: 'npc-hayeon', stats: { affinity: 99, affinity_delta: 99 }, evidence: {}, storyText: '', npcIds });
  assert.equal(stats.state.affinity, 20);
  assert.ok(stats.warnings.length > 0);
});

test('degraded observation leaves retained stats unchanged', () => {
  const save = { npc_stats: { 'npc-hayeon': { affinity: 20 } } };
  const stats = reduceNpcStatObservation({ save, npcId: 'npc-hayeon', stats: {}, evidence: {}, storyText: '', npcIds });
  assert.deepEqual(stats.state, save.npc_stats['npc-hayeon']);
});

test('choice projection exposes canonical choices only when four distinct actions exist', () => {
  for (const count of [4, 3, 2, 1, 0]) {
    const input = Array.from({ length: count }, (_, index) => `choice-${index}`);
    const result = reduceStoryChoiceProjection({ parsedStory: { choices: input, canonical_choices: count === 4 ? input : [] } });
    assert.equal(result.state.length, count === 4 ? 4 : 0);
    assert.deepEqual(result.warnings, count === 4 ? [] : ['choices_not_exactly_four']);
  }
});

test('malformed provider choices remain unavailable without server-authored fallback prose', () => {
  for (const count of [4, 3, 1, 0, 5]) {
    const input = Array.from({ length: count }, (_, index) => `opening-choice-${index}`);
    const result = reduceStoryChoiceProjection({ parsedStory: { choices: input } });
    assert.equal(result.state.length, count === 4 ? 4 : 0);
  }

  const duplicateAndEmpty = reduceStoryChoiceProjection({
    parsedStory: { choices: ['first', '', 'first', 'second'] }
  });
  assert.deepEqual(duplicateAndEmpty.state, []);
  assert.ok(duplicateAndEmpty.warnings.includes('choices_exact_duplicate'));
});

test('numbered visible text is not parsed as canonical choices', () => {
  const raw = '[SCENE]\nThe lobby is busy.\n1. Look around\n2. Say hello\n3. Wait quietly\n4. Leave.';
  const parsed = parseFreshNarrativeV2(raw, { master: { characters: [], general_npcs: [] } });
  assert.equal(parsed.choices.length, 0);
  const projected = reduceStoryChoiceProjection({ parsedStory: parsed });
  assert.equal(projected.state.length, 0);
  assert.equal(parsed.raw, raw);
});

test('V2 commit leaves canonical choices unavailable when the Story has fewer than four actions', () => {
  const observation = normalizeExtractObservationV2({ extract_version: 2, outcome: 'success', scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null, presence_is_final: false, remote_speaker_ids: [], evidence: [] }, player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3, mind_monitor: {}, action_target_id: null, image_character_id: null, image_selection: null, csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '', warnings: [] }, { npcIds });
  const result = reduceGameplayCommit({ currentSave: structuredClone(seed), observation, parsedStory: { choices: ['one', 'two'], dialogue_lines: [] }, rawStory: 'A plain Story', action: { action_id: 'choices', turn_id: 'turn-8', action_kind: 'player_turn' }, expectedTurn: 8, npcIds, mapLocations: [] });
  assert.deepEqual(result.nextSave.last_choices, []);
});

test('persisted legacy Extract rows use one explicit read boundary and emit an explicit warning', () => {
  const legacy = JSON.parse(fs.readFileSync(new URL('../fixtures/gameplay-state-v1/extract-invalid-time.json', import.meta.url)));
  const observation = normalizePersistedExtractObservation(legacy, { npcIds, storyText: 'legacy story' });
  assert.equal(observation.extract_version, 2);
  assert.ok(observation.warnings.includes('legacy_extract_adapter_used'));
});
