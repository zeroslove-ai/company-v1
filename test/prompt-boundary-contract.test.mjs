import test from 'node:test';
import assert from 'node:assert/strict';
import edition from '../src/api/edition.js';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';

const save = { edition: 'company-v1', save_schema_version: 1, turn_state: { committed_turn: 1 }, player: { name: 'P', department_id: 'brand_strategy', position_id: 'intern' }, scene: { version: 1, scene_id: 'office', location_id: 'office', beat: 1, goal: null, focus_thread: null, present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: null, updated_turn: 1 }, player_scene_state: {}, player_sexual_state: {}, npc_scene_state: {}, csa_active: [], csa_rules: {}, world_state: { game_time: { day: 1, minute_of_day: 540 } }, last_choices: [], last_choice_meta: [] };

test('Story boundary is behavioral and omits retired semantic authority', () => {
  const [system, user] = buildStoryPrompt({ edition, context: { save }, playerAction: '회의를 계속한다', expectedTurn: 2, catalogs: {} });
  const payload = JSON.parse(user.content);
  assert.equal(system.role, 'system');
  for (const key of ['npc_stats', 'npc_relationship_state', 'csa_attitudes', 'player_dialogue_policy', 'target_authority', 'possible_entrants', 'remote_contacts']) assert.equal(JSON.stringify(payload).includes(key), false, key);
  assert.deepEqual(payload.context.scene.present_npc_ids, ['heroine1']);
});
