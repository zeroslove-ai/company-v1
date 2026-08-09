import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildPresetCatalogPayload, normalizeCompanyCsaCatalog, renderPresetContent } from '../src/engine/csa/catalog.js';

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
  assert.match(sentence('remove_requested_clothing'), /회사 여성 직원은 플레이어가 지정한 옷을 실제로 벗어야 한다/);
  assert.match(sentence('hand_stimulate_recipient_genitals'), /플레이어의 성기를 손으로.*자극해야 한다/);
  assert.match(sentence('perform_oral_sex_on_recipient'), /플레이어의 성기를 입과 혀로.*자극해야 한다/);
  assert.match(sentence('public_sex_is_unremarkable'), /회사 직원은 공개된 성행위/);
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

test('canonical initial save and opening seed carry four worn clothing slots', () => {
  const files = [
    'supabase/migrations/20260809000100_company_v1_initial_clothing_v2.sql',
    'fixtures/phase-1/initial-save.json',
    'fixtures/phase-1/seed.json'
  ];
  const existing = files.filter(file => fs.existsSync(file));
  assert.ok(existing.length >= 1);
  for (const file of existing) {
    const text = fs.readFileSync(file, 'utf8');
    assert.match(text, /uniform_top/);
    assert.match(text, /underwear_bottom/);
  }
});
