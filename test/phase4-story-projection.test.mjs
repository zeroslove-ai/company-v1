import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStoryWorldProjection } from '../src/engine/csa/story-projection.js';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';

const master = {
  characters: [{ character_id: 'heroine1', name: 'Alpha', gender: 'female' }, { character_id: 'heroine2', name: 'Beta', gender: 'female' }, { character_id: 'male1', name: 'Max', gender: 'male' }],
  general_npcs: []
};
const rule = (id = 'csa_4', overrides = {}) => ({ id, active: true, content: 'no bra under work clothes', created_turn: 3, strength: 'weak', preset: { template_id: 'no_bra_under_work_clothes', authority_tier: 'weak', subject_scope: 'female_employee', affected_group: 'female_employee', mode: 'continuous', trigger: 'continuous', ...overrides } });
const save = (sceneIds = ['heroine1'], clothing = 'worn', extra = {}) => ({
  csa_active: ['csa_4'], csa_rules: { csa_4: rule() },
  scene: { version: 1, scene_id: 'room', location_id: 'room', present_npc_ids: sceneIds, focal_character_id: null, last_speaker_id: null, beat: 0 },
  npc_scene_state: { heroine1: { clothing: { underwear_top: clothing } }, heroine2: { clothing: { underwear_top: 'worn' } }, male1: { clothing: { underwear_top: 'worn' } } },
  ...extra
});

test('world rule projection exposes one canonical rule shape', () => {
  const projection = buildStoryWorldProjection({ save: save(), master, sceneActorIds: ['heroine1'], expectedTurn: 3 });
  assert.deepEqual(projection.world_rules[0], {
    id: 'csa_4', content: 'no bra under work clothes', authority: 'weak', mode: 'continuous', subject_scope: 'female_employee', counterparty_scope: null, trigger: 'continuous', newly_activated: true
  });
});

test('scene obligation derives only the current actor transition', () => {
  const { scene_obligations } = buildStoryWorldProjection({ save: save(), master, sceneActorIds: ['heroine1'], expectedTurn: 4 });
  assert.deepEqual(scene_obligations, [{ actor_id: 'heroine1', source_rule_id: 'csa_4', type: 'clothing_transition', changes: [{ slot: 'underwear_top', current: 'worn', required: 'removed' }] }]);
});

test('compliant, wrong-gender, absent, unknown, and conflicted actors get no obligation', () => {
  assert.deepEqual(buildStoryWorldProjection({ save: save(['heroine1'], 'removed'), master, sceneActorIds: ['heroine1'] }).scene_obligations, []);
  assert.deepEqual(buildStoryWorldProjection({ save: save(['male1']), master, sceneActorIds: ['male1'] }).scene_obligations, []);
  assert.deepEqual(buildStoryWorldProjection({ save: save(['heroine1']), master, sceneActorIds: [] }).scene_obligations, []);
  assert.deepEqual(buildStoryWorldProjection({ save: save(['heroine1'], 'unknown'), master, sceneActorIds: ['heroine1'] }).scene_obligations, []);
  const conflicted = save();
  conflicted.csa_active.push('csa_5');
  conflicted.csa_rules.csa_5 = rule('csa_5', { template_id: 'no_panties_under_work_clothes' });
  assert.deepEqual(buildStoryWorldProjection({ save: conflicted, master, sceneActorIds: ['heroine1'] }).scene_obligations, []);
});

test('institutional Story payload omits player-only action and old CSA fields', () => {
  const messages = buildStoryPrompt({ edition: { editionId: 'company-v1', characters: { characters: { heroine1: { name: 'Alpha', prompt_card: {} } } }, generalNpcs: { profiles: {} } }, context: { save: { data: { ...save(), scene: { ...save().scene, updated_turn: 1 } } }, recent_turns: [] }, playerAction: '', expectedTurn: 3, turnTrigger: { kind: 'institutional_rule_change', activated_rule_ids: ['csa_4'], deactivated_rule_ids: [] }, sceneCastContract: { present_npc_ids: ['heroine1'], entering_npc_ids: [], remote_npc_ids: [], player_dialogue: null } });
  const payload = JSON.parse(messages[1].content);
  assert.equal(payload.turn_trigger.kind, 'institutional_rule_change');
  assert.equal('player_action' in payload, false);
  for (const key of ['active_world_rules', 'clothing_authority', 'action_kind', 'structured_action', 'display_input', 'global_csa']) assert.equal(key in payload || key in payload.context, false, key);
});
