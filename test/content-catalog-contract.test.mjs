import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import edition from '../src/api/edition.js';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';
import { hydrateGameplayState } from '../src/engine/gameplay-state.js';

const scene = { version: 1, scene_id: 'office', location_id: 'office', beat: 0, goal: null, focus_thread: null, present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: null, updated_turn: 0 };
const save = () => ({ edition: 'company-v1', save_schema_version: 1, turn_state: { committed_turn: 1 }, player: { name: 'P', department_id: 'brand_strategy', position_id: 'intern' }, scene, player_scene_state: {}, player_sexual_state: {}, npc_scene_state: { heroine1: { clothing: { uniform_top: 'worn' } } }, csa_active: [], csa_rules: {}, world_state: { game_time: { day: 1, minute_of_day: 540 } }, last_choices: [], last_choice_meta: [] });

test('content uses one canonical characters/general_npcs identity universe', () => {
  const ids = Object.keys(edition.characters.characters);
  assert.deepEqual(ids, ['heroine1', 'heroine2', 'heroine3', 'heroine4', 'heroine5']);
  assert.ok(Object.keys(edition.generalNpcs.profiles).length > 0);
  assert.equal(new Set([...ids, ...Object.keys(edition.generalNpcs.profiles)]).size, ids.length + Object.keys(edition.generalNpcs.profiles).length);
});

test('fresh Story payload contains current actors and no retired semantic maps', () => {
  const messages = buildStoryPrompt({ edition, context: { save: save() }, playerAction: '회의를 계속한다', expectedTurn: 1, catalogs: {} });
  const payload = JSON.parse(messages[1].content);
  const forbidden = ['npc_stats', 'npc_relationship_state', 'csa_attitudes', 'csa_runtime_state', 'csa_aftereffect_state', 'possible_entrants', 'remote_contacts', 'player_dialogue_policy', 'target_authority'];
  const serialized = JSON.stringify(payload);
  for (const key of forbidden) assert.equal(serialized.includes(key), false, key);
  assert.deepEqual(Object.keys(payload.scene_actors), ['heroine1']);
  assert.equal(payload.context.scene.location_id, 'office');
});

test('fresh hydration strips retired roots and keeps narrow scene clothing', () => {
  const hydrated = hydrateGameplayState({ ...save(), npc_stats: { heroine1: { affinity: 4 } }, npc_relationship_state: { heroine1: {} }, csa_attitudes: { heroine1: {} }, csa_runtime_state: {}, csa_aftereffect_state: {}, last_image_id: 'old' }, { characters: [], general_npcs: [] });
  for (const key of ['npc_stats', 'npc_relationship_state', 'csa_attitudes', 'csa_runtime_state', 'csa_aftereffect_state', 'last_image_id']) assert.equal(key in hydrated, false, key);
  assert.equal(hydrated.npc_scene_state.heroine1.clothing.uniform_top, 'worn');
});

test('CSA premise keeps rule force separate from emotion and consent', () => {
  const current = save();
  current.csa_active = ['rule-1'];
  current.csa_rules = { 'rule-1': { active: true, content: '업무 규정', subject_scope: 'company_employee', counterparty_scope: 'company_employee', effective_game_time: { day: 1, minute_of_day: 540 }, trigger: '근무 중' } };
  const payload = JSON.parse(buildStoryPrompt({ edition, context: { save: current }, playerAction: '', expectedTurn: 1, catalogs: {} })[1].content);
  assert.equal(payload.world_rules.length, 1);
  assert.equal(payload.world_rules[0].content, '업무 규정');
  assert.equal('authority' in payload.world_rules[0], false);
  assert.equal('compliance' in payload.world_rules[0], false);
});
