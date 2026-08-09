import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildOpeningPlan,
  canonicalizeCsaGroup,
  normalizeCompanyCsaCatalog,
  normalizeCsaSemanticContract,
  validateCustomCsaSemanticContract,
  validatePresetOperation
} from '../src/engine/index.js';
import edition from '../src/api/edition.js';

const rawCatalog = JSON.parse(fs.readFileSync(new URL('../content/csa_presets.json', import.meta.url), 'utf8'));

test('직원 계열 legacy ids만 read alias로 Company-native ids로 변환된다', () => {
  assert.equal(canonicalizeCsaGroup('nurse'), 'coworker');
  assert.equal(canonicalizeCsaGroup('doctor'), 'manager');
  assert.equal(canonicalizeCsaGroup('medical_staff'), 'employee');
  assert.equal(canonicalizeCsaGroup('hospital_staff'), 'company_employee');
  assert.equal(canonicalizeCsaGroup('female_staff'), 'female_employee');
  assert.equal(canonicalizeCsaGroup('male_staff'), 'male_employee');
  assert.equal(canonicalizeCsaGroup('everyone_in_hospital'), 'everyone_in_company');
  // 제거된 병원 외부 alias는 더 이상 다른 그룹으로 변환되지 않는다
  assert.notEqual(canonicalizeCsaGroup('patient', { target: true }), 'business_visitor');
  assert.notEqual(canonicalizeCsaGroup('assigned_patient', { target: true }), 'assigned_visitor');
  assert.notEqual(canonicalizeCsaGroup('guardian', { target: true }), 'partner_contact');
  assert.notEqual(canonicalizeCsaGroup('visitor', { target: true }), 'guest');
});

test('custom nonsexual group text survives without becoming an allow-list failure', () => {
  const contract = normalizeCsaSemanticContract({
    sexual_authorization: false,
    actor_group: '이번 프로젝트에 참여한 외부 디자이너',
    target_group: '같은 회의에 참석한 실무자',
    trigger: '발표 자료를 넘길 때',
    duration: '회의가 자연스럽게 끝날 때까지',
    confidence: 'exact'
  });
  assert.equal(contract.actor_group, '이번 프로젝트에 참여한 외부 디자이너');
  assert.equal(contract.target_group, '같은 회의에 참석한 실무자');
  assert.equal(contract.trigger, '발표 자료를 넘길 때');
  assert.equal(contract.duration, '회의가 자연스럽게 끝날 때까지');
});

test('ambiguous free-text groups cannot silently gain sexual direct authorization', () => {
  const raw = {
    sexual_authorization: true,
    actions: ['genital_touch'], directions: ['npc_to_player'],
    actor_group: '아무나 적당한 사람', target_group: '누군가',
    trigger: 'on_request', duration: 'continuous', direct_execution: true, confidence: 'exact'
  };
  const normalized = normalizeCsaSemanticContract(raw);
  assert.equal(normalized.sexual_authorization, false);
  assert.equal(validateCustomCsaSemanticContract({ rawContract: raw, normalizedContract: normalized }).ok, false);

  const exact = normalizeCsaSemanticContract({
    ...raw, actor_group: 'character:heroine2', target_group: 'player'
  });
  assert.equal(exact.sexual_authorization, true);
});

test('runtime preset catalog uses only institutional group scopes and two modes', () => {
  const catalog = normalizeCompanyCsaCatalog(rawCatalog);
  assert.equal(catalog.schema_version, 2);
  assert.deepEqual(catalog.selector_options.map(item => item.id), ['female_employee', 'male_employee', 'company_employee']);
  assert.ok(catalog.items.every(item => ['weak', 'medium', 'strong'].includes(item.authority_tier)));
  assert.ok(catalog.items.every(item => ['continuous', 'on_player_request'].includes(item.mode)));
  assert.ok(catalog.items.every(item => !item.role_slots && !item.required_action && !item.sexual_actions && !item.method_policy));
});

test('V2 preset payload validates against the normalized Company catalog without semantic direction', () => {
  const catalog = normalizeCompanyCsaCatalog(rawCatalog);
  const normalizedItem = catalog.items.find(item => item.id === 'hand_stimulate_recipient_genitals');
  const result = validatePresetOperation(catalog, {
    strength: normalizedItem.strength,
    preset: { template_id: normalizedItem.id }
  }, { availableStrength: 'strong' });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.preset.affected_group, 'female_employee');
  assert.equal(result.preset.authority_tier, normalizedItem.strength);
  assert.equal('roles' in result.preset, false);
});

test('opening content comes from edition map and accepts a location outside the former engine list', () => {
  const heroineIds = Object.keys(edition.characters.characters);
  const plan = buildOpeningPlan({
    positionId: 'intern', heroineIds, seedBytes: [0, 0, 0, 0, 0, 0],
    locations: [{
      location_id: 'roof_garden', name: '옥상 정원', opening_enabled: true,
      opening_hooks: ['점심시간 비공식 미팅'],
      opening_goals: ['옥상 정원에서 새 팀원의 사정을 듣는다']
    }]
  });
  assert.equal(plan.location_id, 'roof_garden');
  assert.equal(plan.location_name, '옥상 정원');
  assert.equal(plan.work_hook_label, '점심시간 비공식 미팅');
  assert.equal(plan.scene_goal, '옥상 정원에서 새 팀원의 사정을 듣는다');
});
