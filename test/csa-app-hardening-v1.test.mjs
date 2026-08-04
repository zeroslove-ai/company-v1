import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveCsaDirectCoverage, buildCsaDirectCoverageSection
} from '../src/engine/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const catalog = readJson('content/csa_presets.json');

function saveWithActiveCsa(entries) {
  const csa_active = entries.map((_, index) => `csa_${index}`);
  const csa_rules = Object.fromEntries(entries.map((entry, index) => [`csa_${index}`, { active: true, ...entry }]));
  return { csa_active, csa_rules, focal_character_id: 'heroine1', scene_state: { participants: ['heroine1'] } };
}

// ---------- Direct coverage: nonsexual (preset direct_meaning_tags) ----------

test('direct coverage: an exact core-tag match on an active preset is covered, with actor/target/direction as evidence', () => {
  const presetItem = catalog.items.find(item => item.category === 'posture' && item.strength === 'weak');
  const save = saveWithActiveCsa([{
    source_type: 'preset', content: '테스트', strength: 'weak',
    preset: { template_id: presetItem.id, actor_group: presetItem.default_actor, target_group: presetItem.default_target, trigger: presetItem.default_trigger, duration: presetItem.default_duration, required_action: presetItem.required_action, direct_meaning_tags: presetItem.direct_meaning_tags }
  }]);
  const coreTag = presetItem.direct_meaning_tags[0];
  const coverage = resolveCsaDirectCoverage(save, `${coreTag} 자세를 취한다`, {});
  assert.equal(coverage.covered, true);
  assert.equal(coverage.route, 'csa_direct');
  assert.equal(coverage.actor_group, presetItem.default_actor);
  assert.equal(coverage.direction === 'npc_to_player' || coverage.direction === 'player_to_npc' || coverage.direction === 'none', true);
  const section = buildCsaDirectCoverageSection(coverage);
  assert.match(section, /확정 사실/);
  // The section explicitly forbids probability/risk framing in prose — that's
  // a negation, not a probability value. Guard against an actual numeric
  // percentage or a bold/risk-tier marker, which is what "no bold system" means.
  assert.doesNotMatch(section, /\d+\s*%|위험도\s*[:：]|bold_choice|risk_tier/i);
});

test('direct coverage: text unrelated to any active preset tag falls through to ordinary judgment (not covered)', () => {
  const presetItem = catalog.items.find(item => item.category === 'posture' && item.strength === 'weak');
  const save = saveWithActiveCsa([{
    source_type: 'preset', content: '테스트', strength: 'weak',
    preset: { template_id: presetItem.id, actor_group: presetItem.default_actor, target_group: presetItem.default_target, trigger: presetItem.default_trigger, duration: presetItem.default_duration, required_action: presetItem.required_action, direct_meaning_tags: presetItem.direct_meaning_tags }
  }]);
  const coverage = resolveCsaDirectCoverage(save, '오늘 날씨가 좋다', {});
  assert.equal(coverage.covered, false);
  assert.equal(buildCsaDirectCoverageSection(coverage), '');
});

// ---------- Direct coverage: sexual semantic contract ----------

test('direct coverage: an exact sexual action + direction match on a sexual-authorized CSA is covered', () => {
  // Synthetic, unambiguous participants (actor is an NPC-side group id, target
  // is literally 'player') isolate the matcher's action/direction logic from
  // any given preset's own donor-context actor/target semantics.
  const requiredAction = '__test_required_action__';
  const sexualActionContract = { [requiredAction]: { directions: ['npc_to_player'], actions: ['genital_touch'] } };
  const save = saveWithActiveCsa([{
    source_type: 'preset', content: '테스트', strength: 'medium',
    preset: { template_id: 'test_template', actor_group: 'nurse', target_group: 'player', trigger: 'on_request', duration: 'continuous', required_action: requiredAction, public_normalization: true }
  }]);
  const coverage = resolveCsaDirectCoverage(save, '성기를 만진다', { sexualActionContract });
  assert.equal(coverage.covered, true);
  assert.equal(coverage.route, 'csa_direct');
  assert.equal(coverage.direction, 'npc_to_player');
  assert.equal(coverage.all_actions.includes('genital_touch'), true);
});

test('direct coverage: an actor/target group that cannot resolve (no present NPC) is never covered', () => {
  const presetItem = catalog.items.find(item => item.category === 'posture' && item.strength === 'weak');
  const save = { csa_active: ['csa_0'], csa_rules: { csa_0: { active: true, source_type: 'preset', content: 'x', strength: 'weak', preset: { template_id: presetItem.id, actor_group: presetItem.default_actor, target_group: presetItem.default_target, trigger: presetItem.default_trigger, duration: presetItem.default_duration, required_action: presetItem.required_action, direct_meaning_tags: presetItem.direct_meaning_tags } } }, focal_character_id: null, scene_state: {} };
  const coreTag = presetItem.direct_meaning_tags[0];
  const coverage = resolveCsaDirectCoverage(save, `${coreTag} 자세`, {});
  assert.equal(coverage.covered, false, 'no present NPC means the NPC-side group cannot resolve to a concrete participant');
});

test('direct coverage: a sexual choice bundling an action not covered by the contract is rejected wholesale, never partially covered', () => {
  const requiredAction = '__test_required_action__';
  // Contract authorizes only genital_touch; the player's text also describes a kiss.
  const sexualActionContract = { [requiredAction]: { directions: ['npc_to_player'], actions: ['genital_touch'] } };
  const save = saveWithActiveCsa([{
    source_type: 'preset', content: '테스트', strength: 'medium',
    preset: { template_id: 'test_template', actor_group: 'nurse', target_group: 'player', trigger: 'on_request', duration: 'continuous', required_action: requiredAction, public_normalization: true }
  }]);
  const coverage = resolveCsaDirectCoverage(save, '키스하면서 성기를 만진다', { sexualActionContract });
  assert.equal(coverage.covered, false, 'a bundled uncovered action (kiss) makes the whole choice uncovered even though genital_touch alone would qualify');
});
