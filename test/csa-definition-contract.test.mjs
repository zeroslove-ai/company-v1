import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildPresetCatalogPayload, normalizeCompanyCsaCatalog, renderPresetContent } from '../src/engine/csa/catalog.js';
import { validatePresetOperation } from '../src/engine/csa/transaction-planner.js';

const raw = JSON.parse(fs.readFileSync(new URL('../content/csa_presets.json', import.meta.url), 'utf8'));
const catalog = normalizeCompanyCsaCatalog(raw);

test('Company CSA catalog V2 uses institutional authority and group selectors only', () => {
  assert.equal(catalog.version, 2);
  assert.equal(catalog.items.length, 44);
  assert.deepEqual(catalog.selector_options.map(option => option.id), ['female_employee', 'male_employee', 'company_employee']);
  assert.deepEqual(catalog.authority_tiers.map(tier => tier.id), ['weak', 'medium', 'strong']);
  assert.ok(catalog.items.every(item => item.authority_tier === item.strength));
  assert.ok(catalog.items.every(item => ['female_employee', 'male_employee', 'company_employee'].includes(item.affected_group)));
  assert.ok(catalog.items.every(item => ['continuous', 'on_player_request'].includes(item.mode)));
});

test('preset JSON is the sole sentence authority and contains no individual selectors or dead role fields', () => {
  const forbidden = /character:heroine|current_partner|current_scene_npcs|role_slots|sexual_actions|method_policy|required_action|synergy_ids|minimum_strength|public_normalization|persistent/;
  assert.doesNotMatch(JSON.stringify(raw), forbidden);
  for (const item of catalog.items) {
    assert.equal(renderPresetContent(catalog, item), item.content_template);
    assert.ok(item.content_template.length > 0);
    assert.doesNotMatch(item.content_template, /\{\w+\}|undefined|null|미설정/);
  }
});

test('representative institutional regulation sentences preserve direct action meaning', () => {
  const sentence = id => renderPresetContent(catalog, catalog.items.find(item => item.id === id));
  assert.match(sentence('remove_requested_clothing'), /회사 여성 직원은 상대방이 지정한 옷을 실제로 벗어야 한다/);
  assert.match(sentence('hand_stimulate_recipient_genitals'), /상대방의 성기를 손으로.*자극해야 한다/);
  assert.match(sentence('perform_oral_sex_on_recipient'), /상대방의 성기를 입과 혀로.*자극해야 한다/);
  assert.match(sentence('public_sex_is_unremarkable'), /회사 직원은 공개된 성행위/);
});


test('relational scope defaults to a registered counterparty and preserves world-neutral triggers', () => {
  const relational = catalog.items.filter(item => item.allowed_counterparty_scopes.length > 0);
  assert.ok(relational.length > 0);
  for (const item of relational) {
    assert.ok(item.allowed_counterparty_scopes.includes('company_employee'));
    assert.equal(item.default_counterparty_scope, 'company_employee');
    if (item.mode === 'on_player_request') assert.equal(item.trigger, 'on_counterparty_request');
  }
  const omitted = validatePresetOperation(catalog, {
    strength: 'weak',
    preset: { template_id: 'press_body_against_recipient', subject_scope: 'female_employee' }
  }, { availableStrength: 'weak' });
  assert.equal(omitted.ok, true);
  assert.equal(omitted.preset.counterparty_scope, 'company_employee');
  const state = catalog.items.find(item => item.id === 'work_nude');
  assert.deepEqual(state.allowed_counterparty_scopes, []);
});

test('preset JSON request wording is world-neutral while compatibility IDs remain stable', () => {
  assert.doesNotMatch(JSON.stringify(raw), /플레이어가 요청하면|플레이어가 지정하면|플레이어가 중단|플레이어의|플레이어와|플레이어를/);
  assert.ok(raw.items.some(item => item.id === 'work_nude'));
  assert.equal(raw.items.some(item => item.id === 'work_topless'), false);
});

test('subject and counterparty scopes stay independent and never default the counterparty to player', () => {
  const proximity = catalog.items.find(item => item.id === 'press_body_against_recipient');
  assert.deepEqual(proximity.allowed_subject_scopes, ['player', 'female_employee', 'male_employee', 'company_employee']);
  assert.ok(proximity.allowed_counterparty_scopes.includes('company_employee'));
  assert.equal(proximity.default_counterparty_scope, 'company_employee');
  assert.ok(catalog.subject_scope_options.some(option => option.id === 'player'));
  assert.ok(catalog.counterparty_scope_options.some(option => option.id === 'company_employee'));
});

test('relational presets require an explicit counterparty while state presets do not', () => {
  const relational = validatePresetOperation(catalog, {
    strength: 'weak',
    preset: { template_id: 'press_body_against_recipient', subject_scope: 'female_employee', counterparty_scope: null }
  }, { availableStrength: 'weak' });
  assert.equal(relational.ok, false);
  assert.equal(relational.code, 'CSA_COUNTERPARTY_REQUIRED');
  const state = validatePresetOperation(catalog, {
    strength: 'medium',
    preset: { template_id: 'work_nude', subject_scope: 'company_employee' }
  }, { availableStrength: 'medium' });
  assert.equal(state.ok, true);
  assert.equal(state.preset.counterparty_scope, null);
});

test('preset validation stores independent subject/counterparty scopes and renders the selected relationship', () => {
  const result = validatePresetOperation(catalog, {
    strength: 'weak',
    preset: {
      template_id: 'press_body_against_recipient',
      subject_scope: 'female_employee',
      counterparty_scope: 'company_employee',
      trigger: 'contextual'
    }
  }, { availableStrength: 'weak' });
  assert.equal(result.ok, true);
  assert.equal(result.preset.subject_scope, 'female_employee');
  assert.equal(result.preset.counterparty_scope, 'company_employee');
  assert.match(result.content, /회사 여성 직원은 회사 직원 전체와/);
  assert.doesNotMatch(result.content, /플레이어가 요청하면/);
});

test('work_nude alias permits player or company_employee subjects without creating a counterparty', () => {
  const result = validatePresetOperation(catalog, {
    strength: 'medium',
    preset: { template_id: 'work_nude', subject_scope: 'player' }
  }, { availableStrength: 'medium' });
  assert.equal(result.ok, true);
  assert.equal(result.preset.subject_scope, 'player');
  assert.equal(result.preset.counterparty_scope, null);
  assert.match(result.content, /^플레이어는/);
});

test('preset payload exposes only group scope, authority, mode, and complete sentence', () => {
  const payload = buildPresetCatalogPayload(raw, 'strong');
  for (const item of payload.items) {
    assert.ok(item.id && item.strength && item.authority_tier && item.affected_group && item.mode);
    assert.equal(typeof item.content_template, 'string');
    assert.equal('role_slots' in item, false);
    assert.equal('required_action' in item, false);
    assert.equal('sexual_actions' in item, false);
  }
});
