import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInstitutionalSegments,
  buildMandatoryEnactments,
  composeCanonicalStory,
  validateMandatoryEnactment
} from '../src/engine/index.js';

const master = { characters: [{ character_id: 'heroine1', name: 'One' }, { character_id: 'heroine2', name: 'Two' }], general_npcs: [] };

function clothingEnactment(current = 'worn') {
  return buildMandatoryEnactments({
    expectedTurn: 3,
    master,
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_clothing', type: 'clothing_transition', changes: [{ slot: 'underwear_bottom', current, required: 'removed' }] }],
    worldRules: [{ id: 'csa_clothing', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'clothing_state', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }]
  })[0];
}

test('mandatory clothing metadata preserves exact prior and required state without prose', () => {
  const enactment = clothingEnactment();
  assert.deepEqual(enactment.prior_state, { underwear_bottom: 'worn' });
  assert.deepEqual(enactment.required_state, { underwear_bottom: 'removed' });
  assert.equal(enactment.state_effect, 'transitioned');
  assert.equal(Object.hasOwn(enactment, 'canonical_text'), false);
});

test('mandatory behavior metadata preserves actor and resolved target scope', () => {
  const [enactment] = buildMandatoryEnactments({
    expectedTurn: 4,
    master,
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_behavior', type: 'behavior_execution', action: 'sit_on_lap', trigger_state: 'required_now', execution_policy: 'mandatory_execution', eligible_target_ids: ['heroine2'] }],
    worldRules: [{ id: 'csa_behavior', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'behavior_execution', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }]
  });
  assert.equal(enactment.actor_id, 'heroine1');
  assert.deepEqual(enactment.target_ids, ['heroine2']);
  assert.equal(Object.hasOwn(enactment, 'canonical_text'), false);
});

test('mandatory metadata validation checks obligation parity without Story prose', () => {
  const enactment = clothingEnactment();
  assert.doesNotThrow(() => validateMandatoryEnactment(enactment, {
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_clothing', type: 'clothing_transition', changes: [{ slot: 'underwear_bottom', current: 'worn', required: 'removed' }] }],
    worldRules: [{ id: 'csa_clothing', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'clothing_state', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }],
    registeredIds: new Set(['heroine1'])
  }));
  assert.throws(() => validateMandatoryEnactment({ ...enactment, required_state: { underwear_bottom: 'worn' } }, {
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_clothing', type: 'clothing_transition', changes: [{ slot: 'underwear_bottom', current: 'worn', required: 'removed' }] }],
    worldRules: [{ id: 'csa_clothing', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'clothing_state', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }],
    registeredIds: new Set(['heroine1'])
  }), /required state/);
});

test('institutional segments remain the only visible Engine prose', () => {
  const segments = buildInstitutionalSegments({ expectedTurn: 12, worldRules: [
    { id: 'new-rule', phase: 'newly_activated', content: 'new rule' },
    { id: 'old-rule', phase: 'ongoing', content: 'old rule' }
  ] });
  assert.equal(segments.length, 1);
  assert.deepEqual(segments[0].delivery_channels, ['office_display', 'company_mobile_notice']);
});

test('canonical Story contains provider prose but not mandatory Engine prose', () => {
  const engine = clothingEnactment();
  const provider = '[ACTING enactment_id="turn:3:csa_clothing:heroine1:0"]\\nShe acts.\\n[/ACTING]';
  assert.equal(composeCanonicalStory({ engineEnactments: [engine], providerNarrative: provider }), provider);
});
