import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildPresetCatalogPayload, normalizeCompanyCsaCatalog, renderPresetContent } from '../src/engine/csa/catalog.js';

const raw = JSON.parse(fs.readFileSync(new URL('../content/csa_presets.json', import.meta.url), 'utf8'));
const catalog = normalizeCompanyCsaCatalog(raw);

test('Company CSA catalog V2 has role slots, two modes, and no donor fields', () => {
  assert.equal(catalog.schema_version, 2);
  assert.equal(catalog.items.length, 44);
  assert.deepEqual(Object.fromEntries(['weak', 'medium', 'strong'].map(strength => [strength, catalog.items.filter(item => item.strength === strength).length])), { weak: 14, medium: 15, strong: 15 });
  assert.equal(new Set(catalog.items.map(item => item.id)).size, catalog.items.length);
  assert.ok(catalog.items.every(item => ['continuous', 'on_player_request'].includes(item.mode)));
  assert.ok(catalog.items.every(item => item.role_slots.length > 0));
  assert.equal(JSON.stringify(catalog).includes('synergy_ids'), false);
  assert.equal(JSON.stringify(catalog).includes('minimum_strength'), false);
  assert.equal(JSON.stringify(catalog).includes('trigger_options'), false);
  assert.equal(JSON.stringify(catalog).includes('duration_options'), false);
  assert.ok(buildPresetCatalogPayload(raw, 'strong').items.every(item => !String(item.content_template || '').includes('실제 행동을 수행한다')));
});

test('every V2 role combination renders a complete directed sentence', () => {
  const payload = buildPresetCatalogPayload(raw, 'strong');
  for (const item of payload.items) {
    const roles = Object.fromEntries(item.role_slots.map(role => [role.key, role.default || role.options[0]]));
    const rendered = renderPresetContent(catalog, item, { roles });
    assert.ok(rendered.trim(), item.id);
    assert.doesNotMatch(rendered, /undefined|null|미설정|의가|는에 대한|은에 대한/);
    assert.doesNotMatch(rendered, /가가|는는|은은|와와|과과/);
    assert.ok(!rendered.includes('실제 행동을 수행한다'), item.id);
  }
});

test('direct sexual and clothing presets preserve requester, performer, and recipient direction', () => {
  const hand = catalog.items.find(item => item.id === 'hand_stimulate_recipient_genitals');
  const handText = renderPresetContent(catalog, hand, { roles: { performer_group: 'character:heroine1', recipient_group: 'player' } });
  assert.match(handText, /성기를 손으로/);
  assert.match(handText, /서원희/);
  assert.match(handText, /플레이어/);
  const oral = catalog.items.find(item => item.id === 'perform_oral_sex_on_recipient');
  assert.match(renderPresetContent(catalog, oral, { roles: { performer_group: 'character:heroine1', recipient_group: 'player' } }), /입과 혀로/);
  const clothing = catalog.items.find(item => item.id === 'work_in_underwear_only');
  assert.match(renderPresetContent(catalog, clothing, { roles: { subject_group: 'character:heroine1' } }), /속옷 차림/);
});

test('canonical initial save and opening seed carry four worn clothing slots', () => {
  const fixture = JSON.parse(fs.readFileSync(new URL('../fixtures/phase-0.5/canonical-save-v1.json', import.meta.url), 'utf8'));
  const slots = ['uniform_top', 'uniform_bottom', 'underwear_top', 'underwear_bottom'];
  assert.deepEqual(Object.keys(fixture.player_scene_state.clothing).sort(), [...slots].sort());
  assert.ok(Object.values(fixture.player_scene_state.clothing).every(value => value === 'worn'));
  const sql = fs.readFileSync(new URL('../supabase/seed/20260803000100_company_v1_dev_seed.sql', import.meta.url), 'utf8');
  for (const slot of slots) assert.match(sql, new RegExp(slot));
});
