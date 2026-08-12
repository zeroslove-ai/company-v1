import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CSA_AUTHORITY_POLICY,
  enactmentForPhase,
  matchesCsaSubjectScope,
  phaseForRule,
  profileSex
} from '../src/engine/csa/authority-policy.js';
import { buildStoryWorldProjection } from '../src/engine/csa/story-projection.js';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';

test('canonical authority policy resolves weak, medium, and strong institutional forms', () => {
  assert.equal(CSA_AUTHORITY_POLICY.weak.institutional_form, 'internal_company_guidance_or_operating_rule');
  assert.equal(CSA_AUTHORITY_POLICY.medium.institutional_form, 'company_work_rule_or_enterprise_compliance_policy');
  assert.equal(CSA_AUTHORITY_POLICY.strong.institutional_form, 'national_law_or_regulatory_directive_and_company_notice');
});

test('phase is the only phase authority and maps to one enactment enum', () => {
  assert.equal(phaseForRule({ created_turn: 3 }, 3), 'newly_activated');
  assert.equal(enactmentForPhase('newly_activated'), 'announce_new');
  assert.equal(phaseForRule({ updated_turn: 3 }, 3), 'updated');
  assert.equal(enactmentForPhase('updated'), 'announce_update');
  assert.equal(phaseForRule({}, 3), 'ongoing');
  assert.equal(enactmentForPhase('ongoing'), 'already_established');
});

test('subject scope matcher covers the supported deterministic scopes', () => {
  const female = { id: 'heroine1', gender: 'female' };
  const male = { id: 'hero1', gender: 'male' };
  const player = { id: 'player', player: true };
  assert.equal(matchesCsaSubjectScope(female, 'female_employee'), true);
  assert.equal(matchesCsaSubjectScope(female, 'male_employee'), false);
  assert.equal(matchesCsaSubjectScope(male, 'male_employee'), true);
  assert.equal(matchesCsaSubjectScope(male, 'company_employee'), true);
  assert.equal(matchesCsaSubjectScope(player, 'player'), true);
  assert.equal(matchesCsaSubjectScope(player, 'company_employee'), true);
});

test('subject scope matcher normalizes heroine gender and general-NPC sex fields', () => {
  const heroine = { id: 'heroine1', gender: 'female' };
  const femaleGeneral = { id: 'general_choi_yujin', sex: 'female', type: 'employee', affiliation_type: 'employee' };
  const maleGeneral = { id: 'general_park_jungwoo', sex: 'male', type: 'employee', affiliation_type: 'employee' };
  assert.equal(profileSex(heroine), 'female');
  assert.equal(profileSex(femaleGeneral), 'female');
  assert.equal(profileSex(maleGeneral), 'male');
  assert.equal(matchesCsaSubjectScope(femaleGeneral, 'female_employee'), true);
  assert.equal(matchesCsaSubjectScope(femaleGeneral, 'male_employee'), false);
  assert.equal(matchesCsaSubjectScope(maleGeneral, 'male_employee'), true);
  assert.equal(matchesCsaSubjectScope(maleGeneral, 'female_employee'), false);
});

test('Story payload carries resolved institutional facts without legacy boolean', () => {
  const master = { characters: [{ character_id: 'heroine1', name: 'Alpha', gender: 'female' }, { character_id: 'heroine2', name: 'Beta', gender: 'female' }], general_npcs: [] };
  const save = {
    csa_active: ['csa_1'],
    csa_rules: { csa_1: { id: 'csa_1', active: true, content: 'rule', created_turn: 2, strength: 'weak', preset: { subject_scope: 'female_employee', mode: 'continuous' } } },
    scene: { version: 1, scene_id: 'room', location_id: 'room', present_npc_ids: ['heroine1', 'heroine2'], focal_character_id: null, last_speaker_id: null, beat: 0, updated_turn: 1 },
    npc_scene_state: { heroine1: { clothing: { underwear_bottom: 'worn' } }, heroine2: { clothing: { underwear_bottom: 'worn' } } }
  };
  const edition = { editionId: 'company-v1', characters: { characters: { heroine1: { character_id: 'heroine1', name: 'Alpha', gender: 'female', prompt_card: {} }, heroine2: { character_id: 'heroine2', name: 'Beta', gender: 'female', prompt_card: {} } } }, generalNpcs: { profiles: {} } };
  const messages = buildStoryPrompt({ edition, context: { save: { data: save }, recent_turns: [] }, playerAction: '', expectedTurn: 2, sceneCastContract: { present_npc_ids: ['heroine1', 'heroine2'], entering_npc_ids: [], remote_npc_ids: [], player_dialogue: null } });
  const payload = JSON.parse(messages[1].content);
  const rule = payload.world_rules[0];
  assert.equal(rule.enactment, 'announce_new');
  assert.deepEqual(rule.known_scene_actor_ids, ['heroine1', 'heroine2']);
  assert.deepEqual(rule.applicable_scene_actor_ids, ['heroine1', 'heroine2']);
  assert.equal(rule.execution_policy, 'conditional');
  assert.equal('newly_activated' in rule, false);
  assert.doesNotMatch(messages[0].content, /newly_activated.*announce|updated.*announce|ongoing.*re-announce/i);
  assert.doesNotMatch(messages[0].content, /no_panties_under_work_clothes|work_nude|work_without_underwear|no_bra_under_work_clothes/);
  assert.deepEqual(payload.world_rules, buildStoryWorldProjection({ save, master, sceneActorIds: ['heroine1', 'heroine2'], expectedTurn: 2 }).world_rules);
});
