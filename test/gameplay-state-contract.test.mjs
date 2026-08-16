import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSceneContextCore, hydrateGameplayState, migrateCompanySave } from '../src/engine/gameplay-state.js';

const scene = { version: 1, scene_id: 'room', location_id: 'room', beat: 0, goal: null, focus_thread: null, present_npc_ids: ['npc-1'], focal_character_id: null, last_speaker_id: null, updated_turn: 0 };
const save = () => ({ edition: 'company-v1', save_schema_version: 1, turn_state: { committed_turn: 0 }, player: {}, scene, player_scene_state: {}, player_sexual_state: {}, npc_scene_state: { 'npc-1': { clothing: { uniform_top: 'worn' } } }, csa_active: [], csa_rules: {}, world_state: { game_time: { day: 1, minute_of_day: 540 } }, last_choices: [], last_choice_meta: [] });

test('fresh migration removes retired semantic save roots', () => {
  const result = migrateCompanySave({ ...save(), npc_stats: {}, npc_relationship_state: {}, csa_attitudes: {}, csa_runtime_state: {}, csa_aftereffect_state: {}, sexual_event_ledger: [], last_image_id: 'x' });
  for (const key of ['npc_stats', 'npc_relationship_state', 'csa_attitudes', 'csa_runtime_state', 'csa_aftereffect_state', 'sexual_event_ledger', 'last_image_id']) assert.equal(key in result, false);
});

test('Story context exposes scene/time and narrow active physical state only', () => {
  const context = buildSceneContextCore(save(), ['npc-1']);
  assert.deepEqual(context.scene.present_npc_ids, ['npc-1']);
  assert.equal(context.active_npc_state.npc_scene_state['npc-1'].clothing.uniform_top, 'worn');
  assert.equal('npc_stats' in context.active_npc_state, false);
  assert.equal('global_csa' in context, false);
});

test('hydration never resurrects retired maps from character defaults', () => {
  const result = hydrateGameplayState(save(), { characters: [{ character_id: 'npc-1', initial_stats: { affinity: 5 }, initial_relationship: {}, initial_csa_attitudes: {} }], general_npcs: [] });
  assert.equal('npc_stats' in result, false);
  assert.equal('npc_relationship_state' in result, false);
  assert.equal('csa_attitudes' in result, false);
});
