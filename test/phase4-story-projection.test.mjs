import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStoryWorldProjection } from '../src/engine/csa/story-projection.js';
import { requiredClothingFromActiveCsa } from '../src/engine/state/clothing.js';
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
    id: 'csa_4', content: 'no bra under work clothes', authority: 'weak', phase: 'newly_activated', institutional_form: 'internal_company_guidance_or_operating_rule', enactment: 'announce_new', mode: 'continuous', subject_scope: 'female_employee', counterparty_scope: null, trigger: 'continuous', resolved_facts: [{ rule_id: 'csa_4', already_effective: false, actor_id: 'heroine1', execution_kind: null, trigger_state: 'conditional', current_state: 'not_started', required_state: null, transition_required_now: false, implementation_delay_allowed: false, execution_policy: 'conditional' }], known_scene_actor_ids: ['heroine1'], applicable_scene_actor_ids: ['heroine1'], execution_policy: 'conditional'
  });
});

test('scene obligation derives only the current actor transition', () => {
  const { scene_obligations } = buildStoryWorldProjection({ save: save(), master, sceneActorIds: ['heroine1'], expectedTurn: 4 });
  assert.deepEqual(scene_obligations, [{ actor_id: 'heroine1', source_rule_id: 'csa_4', type: 'clothing_transition', changes: [{ slot: 'underwear_top', current: 'worn', required: 'removed' }] }]);
});

test('world rule projection keeps phase and institutional form distinct by authority', () => {
  const base = save();
  base.csa_rules.csa_4 = rule('csa_4', { authority_tier: 'medium', template_id: 'no_bra_under_work_clothes' });
  base.csa_rules.csa_4.strength = 'medium';
  base.csa_rules.csa_4.updated_turn = 5;
  base.csa_active = ['csa_4'];
  const medium = buildStoryWorldProjection({ save: base, master, sceneActorIds: ['heroine1'], expectedTurn: 5 }).world_rules[0];
  assert.equal(medium.phase, 'updated');
  assert.equal(medium.institutional_form, 'company_work_rule_or_enterprise_compliance_policy');
  assert.equal(medium.enactment, 'announce_update');
  base.csa_rules.csa_4.strength = 'strong';
  base.csa_rules.csa_4.preset.authority_tier = 'strong';
  const strong = buildStoryWorldProjection({ save: base, master, sceneActorIds: ['heroine1'], expectedTurn: 6 }).world_rules[0];
  assert.equal(strong.phase, 'ongoing');
  assert.equal(strong.enactment, 'already_established');
  assert.equal(strong.institutional_form, 'national_law_or_regulatory_directive_and_company_notice');
});

test('continuous clothing obligations cover every present applicable female NPC', () => {
  const { scene_obligations } = buildStoryWorldProjection({ save: save(['heroine1', 'heroine2']), master, sceneActorIds: ['heroine1', 'heroine2'], expectedTurn: 4 });
  assert.deepEqual(scene_obligations, [
    { actor_id: 'heroine1', source_rule_id: 'csa_4', type: 'clothing_transition', changes: [{ slot: 'underwear_top', current: 'worn', required: 'removed' }] },
    { actor_id: 'heroine2', source_rule_id: 'csa_4', type: 'clothing_transition', changes: [{ slot: 'underwear_top', current: 'worn', required: 'removed' }] }
  ]);
});

test('institutional projection resolves scene knowledge and applicability once', () => {
  const localMaster = {
    characters: [...master.characters],
    general_npcs: [
      { npc_id: 'general_choi_yujin', name: 'Female general', sex: 'female', type: 'employee', affiliation_type: 'employee' },
      { npc_id: 'general_park_jungwoo', name: 'Male general', sex: 'male', type: 'employee', affiliation_type: 'employee' }
    ]
  };
  const localSave = save(['heroine1', 'general_choi_yujin', 'general_park_jungwoo'], 'worn', {
    npc_scene_state: {
      heroine1: { clothing: { underwear_top: 'worn' } },
      general_choi_yujin: { clothing: { underwear_top: 'worn' } },
      general_park_jungwoo: { clothing: { underwear_top: 'worn' } }
    }
  });
  const projection = buildStoryWorldProjection({ save: localSave, master: localMaster, sceneActorIds: ['heroine1', 'general_choi_yujin', 'general_park_jungwoo'], expectedTurn: 4 });
  assert.deepEqual(projection.world_rules[0].known_scene_actor_ids, ['heroine1', 'general_choi_yujin', 'general_park_jungwoo']);
  assert.deepEqual(projection.world_rules[0].applicable_scene_actor_ids, ['heroine1', 'general_choi_yujin']);
  assert.deepEqual(projection.scene_obligations.map(item => item.actor_id), ['heroine1', 'general_choi_yujin']);
  assert.equal(projection.world_rules[0].execution_policy, 'conditional');
});

test('clothing applicability shares the normalized sex matcher for general employees', () => {
  const activeRules = [rule()];
  assert.deepEqual(requiredClothingFromActiveCsa(activeRules, { id: 'general_choi_yujin', sex: 'female' }).required_clothing, { underwear_top: 'removed' });
  assert.deepEqual(requiredClothingFromActiveCsa(activeRules, { id: 'general_park_jungwoo', sex: 'male' }).required_clothing, {});
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

test('Story rules distinguish institutional knowledge, compliance, and player-only thought ownership', () => {
  const messages = buildStoryPrompt({ edition: { editionId: 'company-v1', characters: { characters: { heroine1: { name: 'Alpha', prompt_card: {} } } }, generalNpcs: { profiles: {} } }, context: { save: { data: { ...save(), scene: { ...save().scene, updated_turn: 0 } } }, recent_turns: [] }, playerAction: '', expectedTurn: 3, sceneCastContract: { present_npc_ids: ['heroine1'], entering_npc_ids: [], remote_npc_ids: [], player_dialogue: null } });
  const system = messages[0].content;
  assert.match(system, /Worker-resolved institutional facts/i);
  assert.match(system, /known_scene_actor_ids.*applicable_scene_actor_ids/i);
  assert.match(system, /concrete, observable, non-magical action or result/i);
  assert.match(system, /scene_obligation describes a required transition/i);
  assert.match(system, /belongs exclusively to the player/i);
  assert.match(system, /Mind Monitor/i);
});
