import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildStoryWorldProjection } from '../src/engine/csa/story-projection.js';
import { normalizeFreshExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { reduceGameplayCommit } from '../src/engine/runtime-core/commit-reducer.js';

const master = { characters: [{ character_id: 'heroine1', name: 'Alpha', gender: 'female' }], general_npcs: [] };
const rule = { id: 'rule-clothing', active: true, content: 'work without underwear', strength: 'medium', preset: {
  template_id: 'work_without_underwear', authority_tier: 'medium', subject_scope: 'female_employee', mode: 'continuous',
  execution: { kind: 'clothing_state', action: 'set_clothing_state', trigger_kind: 'always_during_work', target_required: false, required_state: { underwear_bottom: 'removed' } }
} };
const baseObservation = {
  extract_version: 2, outcome: 'success',
  scene_observation: { scene_id: 'room', location_id: 'room', final_present_npc_ids: ['heroine1'], remote_speaker_ids: [], evidence: [] },
  player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3,
  mind_monitor: {}, action_target_id: null, image_character_id: null, image_selection: null,
  csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '', warnings: []
};

test('Story projection exposes canonical clothing facts instead of requiring model inference', () => {
  const save = {
    csa_active: ['rule-clothing'], csa_rules: { 'rule-clothing': rule },
    scene: { version: 1, scene_id: 'room', location_id: 'room', present_npc_ids: ['heroine1'] },
    npc_scene_state: { heroine1: { clothing: { underwear_bottom: 'worn' } } }
  };
  const facts = buildStoryWorldProjection({ save, master, sceneActorIds: ['heroine1'], expectedTurn: 8 }).world_rules[0].resolved_facts[0];
  assert.equal(facts.current_state.underwear_bottom, 'worn');
  assert.equal(facts.required_state.underwear_bottom, 'removed');
  assert.equal(facts.transition_required_now, true);
  assert.equal(facts.already_effective, false);
});

test('fresh Extract drops malformed optional subtrees and keeps the turn usable', () => {
  const result = normalizeFreshExtractObservationV2({
    ...baseObservation,
    npc_observations: { heroine1: { emotion: { mood: 17 }, physical: { clothing: { underwear_bottom: 'worn' } } } },
    mind_monitor: { heroine1: { surface: 12, subconscious: 'valid' } },
    csa_runtime_updates: [{ csa_id: 'rule-clothing', character_id: 'unknown', status: 'active' }]
  }, { npcIds: new Set(['heroine1']), storyText: 'Alpha checked the file.' });
  assert.deepEqual(result.npc_observations.heroine1.physical, { clothing: { underwear_bottom: 'worn' } });
  assert.equal(result.npc_observations.heroine1.emotion, null);
  assert.deepEqual(result.mind_monitor, {});
  assert.deepEqual(result.csa_runtime_updates, []);
  assert.ok(result.warnings.some(warning => warning.startsWith('extract_optional_dropped:')));
});

test('player THOUGHT text cannot become an NPC Mind Monitor entry', () => {
  const save = JSON.parse(fs.readFileSync(new URL('../fixtures/phase-0.5/canonical-save-v1.json', import.meta.url)));
  const observation = { ...baseObservation, mind_monitor: { heroine1: { surface: 'I should ask first.', subconscious: 'still valid' } } };
  const result = reduceGameplayCommit({
    currentSave: save, observation, parsedStory: { choices: [], dialogue_lines: [], player_inner_thought: 'I should ask first.' },
    rawStory: 'plain story', action: { action_id: 'phase12i', turn_id: 'phase12i', action_kind: 'player_turn' }, expectedTurn: 8,
    npcIds: new Set(['heroine1']), mapLocations: []
  });
  assert.equal(result.mind_monitor.heroine1, undefined);
  assert.ok(result.warnings.includes('mind_monitor_player_thought_dropped:heroine1'));
});
