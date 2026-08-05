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

test('legacy hospital group ids are read aliases for Company-native ids', () => {
  assert.equal(canonicalizeCsaGroup('nurse'), 'coworker');
  assert.equal(canonicalizeCsaGroup('doctor'), 'manager');
  assert.equal(canonicalizeCsaGroup('hospital_staff'), 'company_employee');
  assert.equal(canonicalizeCsaGroup('everyone_in_hospital'), 'everyone_in_company');
  assert.equal(canonicalizeCsaGroup('assigned_patient', { target: true }), 'assigned_visitor');
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

test('runtime preset catalog exposes no donor hospital group, trigger, or duration ids', () => {
  const catalog = normalizeCompanyCsaCatalog(rawCatalog);
  const forbidden = new Set([
    'nurse', 'doctor', 'medical_staff', 'hospital_staff', 'female_staff', 'male_staff',
    'patient', 'assigned_patient', 'guardian', 'visitor', 'everyone_in_hospital',
    'consultation_start', 'explanation_start', 'comforting', 'check_condition',
    'until_consultation_ends', 'until_explanation_ends', 'until_target_relaxed'
  ]);
  const exposed = [
    ...catalog.actor_options.map(item => item.id),
    ...catalog.target_options.map(item => item.id),
    ...catalog.trigger_options.map(item => item.id),
    ...catalog.duration_options.map(item => item.id),
    ...catalog.items.flatMap(item => [
      ...item.actor_options, ...item.target_options, ...item.allowed_triggers, ...item.allowed_durations,
      item.default_actor, item.default_target, item.default_trigger, item.default_duration
    ])
  ].filter(Boolean);
  assert.deepEqual(exposed.filter(id => forbidden.has(id)), []);
});

test('legacy pending preset payload validates against the normalized Company catalog', () => {
  const catalog = normalizeCompanyCsaCatalog(rawCatalog);
  const rawItem = rawCatalog.items.find(item => item.default_actor && item.default_trigger && item.default_duration);
  const normalizedItem = catalog.items.find(item => item.id === rawItem.id);
  const result = validatePresetOperation(catalog, {
    strength: normalizedItem.strength,
    preset: {
      template_id: rawItem.id,
      actor_group: rawItem.default_actor,
      target_group: rawItem.default_target,
      trigger: rawItem.default_trigger,
      duration: rawItem.default_duration,
      modifier: ''
    }
  }, { availableStrength: 'strong' });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.preset.actor_group, normalizedItem.default_actor);
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
