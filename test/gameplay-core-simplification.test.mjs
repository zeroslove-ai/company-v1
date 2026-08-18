import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOpeningPlan } from '../src/engine/player-setup.js';
import { buildActiveCharacterCanon, buildSceneContextCore, reducePlayerSexualState } from '../src/engine/gameplay-state.js';
import { normalizeFreshExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { reduceCsaCommitState } from '../src/engine/runtime-core/csa-commit-reducer.js';
import { buildStoryWorldProjection } from '../src/engine/csa/story-projection.js';
import { contextChoices } from '../src/frontend/pages/state.js';

const scene = {
  version: 1, location_id: 'office', present_npc_ids: ['heroine1'],
  focal_character_id: 'heroine1', last_speaker_id: 'heroine1', updated_turn: 1
};

test('fresh opening plan contains literal time/location/actors, never work authority fields', () => {
  const plan = buildOpeningPlan({ positionId: 'intern', departmentId: 'brand_strategy', seedBytes: [0, 0, 0], heroineIds: ['heroine1'], locations: [{ location_id: 'office', name: 'Office', opening_enabled: true }] });
  assert.equal(plan.location_id, 'office');
  assert.equal('work_hook_id' in plan, false);
  assert.equal('scene_goal' in plan, false);
});

test('literal choices use opening only before turn one and latest committed choices afterwards', () => {
  assert.deepEqual(contextChoices({ save: { committed_turn: 0 }, opening_turn: { choices: ['opening'] } }), ['opening']);
  assert.deepEqual(contextChoices({ save: { committed_turn: 1 }, opening_turn: { choices: ['stale'] }, recent_turns: [{ parsed_blocks: { choices: ['committed'] } }] }), ['committed']);
});

test('canonical scene fresh shape has exactly six fields', () => {
  const projected = buildSceneContextCore({ scene, world_state: { game_time: { day: 1, minute_of_day: 540 } }, turn_state: { committed_turn: 1 } }, ['heroine1']);
  assert.deepEqual(Object.keys(projected.scene), ['version', 'location_id', 'present_npc_ids', 'focal_character_id', 'last_speaker_id', 'updated_turn']);
  assert.equal('scene_id' in projected.scene, false);
  assert.equal('focus_thread' in projected.scene, false);
});

test('fresh Extract rejects legacy scene identity and accepts narrow scene observation', () => {
  const base = { extract_version: 2, outcome: 'success', scene_observation: { location_id: 'office', final_present_npc_ids: ['heroine1'], entered_npc_ids: [], exited_npc_ids: [], remote_speaker_ids: [], evidence: [] }, player_observation: {}, npc_observations: {}, evidence: {}, elapsed_minutes: 3, mind_monitor: {}, turn_summary: '', warnings: [] };
  assert.throws(() => normalizeFreshExtractObservationV2({ ...base, scene_observation: { ...base.scene_observation, scene_id: 'old' } }, { npcIds: new Set(['heroine1']), storyText: '' }));
  assert.equal(normalizeFreshExtractObservationV2(base, { npcIds: new Set(['heroine1']), storyText: '' }).scene_observation.location_id, 'office');
});

test('direct clothing CSA required_state synchronizes only present actors', () => {
  const nextSave = { csa_active: ['rule'], csa_rules: { rule: { preset: { execution: { kind: 'clothing_state', required_state: { underwear_bottom: 'removed' } } } } }, npc_scene_state: { heroine1: { clothing: { underwear_bottom: 'worn' } }, heroine2: { clothing: { underwear_bottom: 'worn' } } } };
  const result = reduceCsaCommitState({ currentSave: nextSave, nextSave, canonicalScene: scene, observation: { outcome: 'success' }, action: {}, structuredAction: { operations: [] }, transactionResolution: { previous_csa_active: ['rule'], next_csa_active: ['rule'], next_csa_rules: nextSave.csa_rules } });
  assert.equal(result.nextSave.npc_scene_state.heroine1.clothing.underwear_bottom, 'removed');
  assert.equal(result.nextSave.npc_scene_state.heroine2.clothing.underwear_bottom, 'worn');
});

function clothingRule(subjectScope = 'female_employee', requiredState = { underwear_bottom: 'removed' }, active = true) {
  return {
    active,
    preset: {
      subject_scope: subjectScope,
      execution: { kind: 'clothing_state', required_state: requiredState }
    }
  };
}

function clothingSave({ active = ['rule'], rule = clothingRule(), npcSceneState = {}, playerClothing = {} } = {}) {
  return {
    player: { gender: 'male' },
    player_scene_state: { clothing: playerClothing },
    npc_scene_state: npcSceneState,
    csa_active: active,
    csa_rules: { rule }
  };
}

function reduceClothingSave(save, { sceneInput = scene, master = { characters: [{ character_id: 'heroine1', gender: 'female' }], general_npcs: [] }, expectedTurn = 19 } = {}) {
  const currentSave = structuredClone(save);
  const nextSave = structuredClone(save);
  return reduceCsaCommitState({
    currentSave,
    nextSave,
    canonicalScene: sceneInput,
    observation: { outcome: 'success' },
    action: {},
    expectedTurn,
    master,
    structuredAction: { operations: [] },
    transactionResolution: {
      previous_csa_active: save.csa_active,
      next_csa_active: save.csa_active,
      next_csa_rules: save.csa_rules
    }
  });
}

test('present female NPC bootstraps exact four-slot clothing with unknown defaults', () => {
  const result = reduceClothingSave(clothingSave({ npcSceneState: {} }));
  assert.deepEqual(result.nextSave.npc_scene_state.heroine1, {
    clothing: {
      uniform_top: 'unknown', uniform_bottom: 'unknown',
      underwear_top: 'unknown', underwear_bottom: 'removed'
    },
    updated_turn: 19
  });
});

test('NPC bootstrap preserves evidenced fields and overlays only required slots', () => {
  const result = reduceClothingSave(clothingSave({
    npcSceneState: { heroine1: { posture: 'sitting', updated_turn: 7, clothing: { uniform_top: 'worn', underwear_bottom: 'worn' } } }
  }));
  assert.deepEqual(result.nextSave.npc_scene_state.heroine1, {
    posture: 'sitting',
    updated_turn: 19,
    clothing: {
      uniform_top: 'worn', uniform_bottom: 'unknown',
      underwear_top: 'unknown', underwear_bottom: 'removed'
    }
  });
});

test('female employee clothing CSA does not affect a present male NPC', () => {
  const result = reduceClothingSave(clothingSave({ npcSceneState: {} }), {
    sceneInput: { ...scene, present_npc_ids: ['male1'] },
    master: { characters: [{ character_id: 'male1', gender: 'male' }], general_npcs: [] }
  });
  assert.deepEqual(result.nextSave.npc_scene_state, {});
});

test('matching NPC outside the canonical scene is not bootstrapped', () => {
  const result = reduceClothingSave(clothingSave({ npcSceneState: {} }), {
    sceneInput: { ...scene, present_npc_ids: [] }
  });
  assert.deepEqual(result.nextSave.npc_scene_state, {});
});

test('inactive, deactivated, and non-clothing rules do not bootstrap NPC state', () => {
  const inactive = reduceClothingSave(clothingSave({ active: [], npcSceneState: {} }));
  assert.deepEqual(inactive.nextSave.npc_scene_state, {});
  const deactivated = reduceClothingSave(clothingSave({ rule: clothingRule('female_employee', { underwear_bottom: 'removed' }, false), npcSceneState: {} }));
  assert.deepEqual(deactivated.nextSave.npc_scene_state, {});
  const nonClothing = reduceClothingSave(clothingSave({ rule: { active: true, preset: { subject_scope: 'female_employee', execution: { kind: 'narrative_only' } } }, npcSceneState: {} }));
  assert.deepEqual(nonClothing.nextSave.npc_scene_state, {});
});

test('repeated Commit is idempotent after clothing bootstrap is complete', () => {
  const first = reduceClothingSave(clothingSave({ npcSceneState: {} }));
  const second = reduceClothingSave(first.nextSave, { expectedTurn: 20 });
  assert.deepEqual(second.nextSave, first.nextSave);
});

test('player clothing CSA behavior remains an exact required-slot overlay', () => {
  const save = clothingSave({
    rule: clothingRule('player', { underwear_top: 'removed' }),
    playerClothing: { uniform_top: 'worn', uniform_bottom: 'worn', underwear_bottom: 'worn' }
  });
  const result = reduceClothingSave(save);
  assert.deepEqual(result.nextSave.player_scene_state.clothing, {
    uniform_top: 'worn', uniform_bottom: 'worn', underwear_top: 'removed', underwear_bottom: 'worn'
  });
  assert.deepEqual(result.nextSave.npc_scene_state, {});
});

test('Story context reads bootstrapped NPC clothing projection on the following turn', () => {
  const result = reduceClothingSave(clothingSave({ npcSceneState: {} }));
  const projection = buildStoryWorldProjection({
    save: result.nextSave,
    master: { characters: [{ character_id: 'heroine1', gender: 'female' }], general_npcs: [] },
    sceneActorIds: ['heroine1'],
    expectedTurn: 20
  });
  assert.deepEqual(projection.world_rules[0].clothing_projection.actors, [{
    actor_id: 'heroine1',
    current_state: { underwear_bottom: 'removed' },
    compliant: true
  }]);
});

test('preserved turn-19 live shape now bootstraps heroine3 instead of skipping it', () => {
  const liveShape = clothingSave({
    active: ['csa_17'],
    rule: clothingRule('female_employee'),
    npcSceneState: {}
  });
  liveShape.csa_rules = { csa_17: liveShape.csa_rules.rule };
  const result = reduceClothingSave(liveShape, {
    sceneInput: { ...scene, present_npc_ids: ['heroine3'], focal_character_id: 'heroine3' },
    master: { characters: [{ character_id: 'heroine3', gender: 'female' }], general_npcs: [] },
    expectedTurn: 20
  });
  assert.deepEqual(result.nextSave.npc_scene_state.heroine3.clothing, {
    uniform_top: 'unknown', uniform_bottom: 'unknown', underwear_top: 'unknown', underwear_bottom: 'removed'
  });
  assert.equal(result.nextSave.npc_scene_state.heroine3.updated_turn, 20);
});

test('player sexual progression accepts exact evidenced delta without legacy six-point pacing', () => {
  const result = reducePlayerSexualState({}, { ejaculation_progress_delta: 7 }, { storyEvidence: { actors: { player: { character_id: 'player', changed: ['player_sexual_state.ejaculation_progress_delta'], quote: '증거' } } }, storyText: '증거' });
  assert.equal(result.state.ejaculation_progress, 7);
});

test('active character canon carries compact deterministic body canon without private facts', () => {
  const canon = buildActiveCharacterCanon({ heroine1: { name: 'A', position: 'Lead', role_title: 'Role', body: { height_cm: 168, body_type: 'balanced' }, private_info: { nipple: 'secret' } } }, ['heroine1']);
  assert.deepEqual(canon.heroine1.body, { height_cm: 168, body_type: 'balanced' });
  assert.equal('private_info' in canon.heroine1, false);
});

test('clothing projection applies exact player, sex, and company employee scopes', () => {
  const makeRule = subject_scope => ({
    active: true,
    content: subject_scope,
    preset: {
      subject_scope,
      execution: { kind: 'clothing_state', required_state: { underwear_top: 'removed' } }
    }
  });
  const save = {
    player: { gender: 'male' },
    player_scene_state: { clothing: { underwear_top: 'removed' } },
    npc_scene_state: {
      female: { clothing: { underwear_top: 'removed' } },
      male: { clothing: { underwear_top: 'worn' } }
    },
    csa_active: ['female_rule', 'male_rule', 'company_rule', 'player_rule'],
    csa_rules: {
      female_rule: makeRule('female_employee'),
      male_rule: makeRule('male_employee'),
      company_rule: makeRule('company_employee'),
      player_rule: makeRule('player')
    }
  };
  const projection = buildStoryWorldProjection({
    save,
    master: { characters: [{ character_id: 'female', gender: 'female' }, { character_id: 'male', gender: 'male' }], general_npcs: [] },
    sceneActorIds: ['female', 'male'],
    expectedTurn: 2
  });
  const actorsByRule = Object.fromEntries(projection.world_rules.map(rule => [rule.id, rule.clothing_projection.actors.map(actor => actor.actor_id)]));
  assert.deepEqual(actorsByRule, {
    female_rule: ['female'],
    male_rule: ['player', 'male'],
    company_rule: ['player', 'female', 'male'],
    player_rule: ['player']
  });
});

test('body canon exposes confirmed intimate facts only when the matching clothing area is exposed', () => {
  const characters = {
    heroine1: {
      name: 'A', position: 'Lead', role_title: 'Role',
      body: { height_cm: 168, body_type: 'balanced', cup: 'C' },
      private_info: { nipple: 'pink', areola_size: 'medium', areola_color: 'brown', pubic_hair: 'trimmed' }
    }
  };
  const covered = buildActiveCharacterCanon(characters, ['heroine1'], {
    heroine1: { uniform_top: 'worn', underwear_top: 'removed', uniform_bottom: 'worn', underwear_bottom: 'removed' }
  });
  assert.equal('visible_intimate' in covered.heroine1.body, false);
  const exposed = buildActiveCharacterCanon(characters, ['heroine1'], {
    heroine1: { uniform_top: 'open', underwear_top: 'removed', uniform_bottom: 'removed', underwear_bottom: 'removed' }
  });
  assert.deepEqual(exposed.heroine1.body.visible_intimate, { nipple: 'pink', areola_size: 'medium', areola_color: 'brown', pubic_hair: 'trimmed' });
  assert.equal('private_info' in exposed.heroine1, false);
});
