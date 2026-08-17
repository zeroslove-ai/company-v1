import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOpeningPlan } from '../src/engine/player-setup.js';
import { buildActiveCharacterCanon, buildSceneContextCore, reducePlayerSexualState } from '../src/engine/gameplay-state.js';
import { normalizeFreshExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { reduceCsaCommitState } from '../src/engine/runtime-core/csa-commit-reducer.js';
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
  const base = { extract_version: 2, outcome: 'success', scene_observation: { location_id: 'office', final_present_npc_ids: ['heroine1'], entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: 'heroine1', remote_speaker_ids: [], evidence: [] }, player_observation: {}, npc_observations: {}, evidence: {}, elapsed_minutes: 3, mind_monitor: {}, turn_summary: '', warnings: [] };
  assert.throws(() => normalizeFreshExtractObservationV2({ ...base, scene_observation: { ...base.scene_observation, scene_id: 'old' } }, { npcIds: new Set(['heroine1']), storyText: '' }));
  assert.equal(normalizeFreshExtractObservationV2(base, { npcIds: new Set(['heroine1']), storyText: '' }).scene_observation.location_id, 'office');
});

test('direct clothing CSA required_state synchronizes only present actors', () => {
  const nextSave = { csa_active: ['rule'], csa_rules: { rule: { preset: { execution: { kind: 'clothing_state', required_state: { underwear_bottom: 'removed' } } } } }, npc_scene_state: { heroine1: { clothing: { underwear_bottom: 'worn' } }, heroine2: { clothing: { underwear_bottom: 'worn' } } } };
  const result = reduceCsaCommitState({ currentSave: nextSave, nextSave, canonicalScene: scene, observation: { outcome: 'success' }, action: {}, structuredAction: { operations: [] }, transactionResolution: { previous_csa_active: ['rule'], next_csa_active: ['rule'], next_csa_rules: nextSave.csa_rules } });
  assert.equal(result.nextSave.npc_scene_state.heroine1.clothing.underwear_bottom, 'removed');
  assert.equal(result.nextSave.npc_scene_state.heroine2.clothing.underwear_bottom, 'worn');
});

test('player sexual progression accepts exact evidenced delta without legacy six-point pacing', () => {
  const result = reducePlayerSexualState({}, { ejaculation_progress_delta: 7 }, { storyEvidence: { player_observation: { sexual: { ejaculation_progress_delta: { quote: '증거' } } } }, storyText: '증거' });
  assert.equal(result.state.ejaculation_progress, 7);
});

test('active character canon carries compact deterministic body canon without private facts', () => {
  const canon = buildActiveCharacterCanon({ heroine1: { name: 'A', position: 'Lead', role_title: 'Role', body: { height_cm: 168, body_type: 'balanced' }, private_info: { nipple: 'secret' } } }, ['heroine1']);
  assert.deepEqual(canon.heroine1.body, { height_cm: 168, body_type: 'balanced' });
  assert.equal('private_info' in canon.heroine1, false);
});
