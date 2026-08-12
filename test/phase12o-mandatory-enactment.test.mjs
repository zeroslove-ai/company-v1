import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attachEngineEnactments,
  buildMandatoryEnactments,
  composeCanonicalStory,
  validateMandatoryEnactment
} from '../src/engine/index.js';

const master = {
  characters: [
    { character_id: 'heroine1', name: '윤민아' },
    { character_id: 'heroine2', name: '서원희' }
  ],
  general_npcs: []
};

test('known clothing enactment preserves transition semantics and exact slot scope', () => {
  const [enactment] = buildMandatoryEnactments({
    expectedTurn: 3,
    master,
    sceneObligations: [{
      actor_id: 'heroine1', source_rule_id: 'csa_clothing', type: 'clothing_transition',
      changes: [{ slot: 'underwear_bottom', current: 'worn', required: 'removed' }]
    }],
    worldRules: [{ id: 'csa_clothing', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'clothing_state', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }]
  });
  assert.equal(enactment.prior_state_known, true);
  assert.deepEqual(enactment.prior_state, { underwear_bottom: 'worn' });
  assert.deepEqual(enactment.required_state, { underwear_bottom: 'removed' });
  assert.equal(enactment.state_effect, 'transitioned');
  assert.equal(enactment.canonical_text.includes('윤민아'), true);
  assert.equal(enactment.canonical_text.includes('underwear_top'), false);
});

test('unknown clothing establishes the required result without inventing a prior state', () => {
  const [enactment] = buildMandatoryEnactments({
    expectedTurn: 3,
    master,
    sceneObligations: [{
      actor_id: 'heroine1', source_rule_id: 'csa_unknown', type: 'clothing_transition',
      changes: [{ slot: 'underwear_bottom', current: 'unknown', required: 'removed' }]
    }]
  });
  assert.equal(enactment.prior_state_known, false);
  assert.deepEqual(enactment.prior_state, { underwear_bottom: 'unknown' });
  assert.equal(enactment.state_effect, 'established');
  assert.equal(enactment.canonical_text.includes('입고 있던'), false);
  assert.equal(enactment.canonical_text.includes('착용한'), false);
  assert.equal(enactment.canonical_text.includes('윤민아'), true);
});

test('mandatory behavior uses the resolved obligation scope without reselecting actor or target', () => {
  const [enactment] = buildMandatoryEnactments({
    expectedTurn: 4,
    master,
    sceneObligations: [{
      actor_id: 'heroine1', source_rule_id: 'csa_behavior', type: 'behavior_execution',
      action: 'sit_on_recipient_lap', trigger_state: 'required_now', execution_policy: 'mandatory_execution',
      eligible_target_ids: ['heroine2']
    }],
    worldRules: [{ id: 'csa_behavior', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'behavior_execution', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }]
  });
  assert.equal(enactment.execution_kind, 'behavior_execution');
  assert.equal(enactment.action, 'sit_on_recipient_lap');
  assert.deepEqual(enactment.target_ids, ['heroine2']);
  assert.equal(enactment.state_effect, 'behavior_executed');
  assert.equal(enactment.canonical_text.includes('키스'), false);
  assert.equal(enactment.canonical_text.includes('윤민아'), true);
  assert.equal(enactment.canonical_text.includes('서원희'), true);
});

test('canonical composite orders engine segments before provider narrative and preserves both texts', () => {
  const [engine] = buildMandatoryEnactments({
    expectedTurn: 5,
    master,
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_clothing', type: 'clothing_transition', changes: [{ slot: 'underwear_bottom', current: 'unknown', required: 'removed' }] }]
  });
  const provider = '[DIALOGUE speaker_id="heroine1"]\n그녀는 놀란 표정으로 주변을 살폈다.';
  const canonical = composeCanonicalStory({ engineEnactments: [engine], providerNarrative: provider });
  assert.ok(canonical.indexOf(engine.canonical_text) < canonical.indexOf(provider));
  assert.ok(canonical.includes(engine.canonical_text));
  assert.ok(canonical.includes(provider));
});

test('engine authority sidecar remains stable when provider narrative contradicts the result', () => {
  const [engine] = buildMandatoryEnactments({
    expectedTurn: 6,
    master,
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_clothing', type: 'clothing_transition', changes: [{ slot: 'underwear_bottom', current: 'worn', required: 'removed' }] }]
  });
  const canonical = composeCanonicalStory({ engineEnactments: [engine], providerNarrative: '윤민아는 아직 이전 상태라고 말했다.' });
  assert.equal(validateMandatoryEnactment(engine, {
    storyText: canonical,
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_clothing', type: 'clothing_transition', changes: [{ slot: 'underwear_bottom', required: 'removed' }] }],
    registeredIds: new Set(['heroine1'])
  }), true);
  const envelope = attachEngineEnactments({ blocks: [], raw: canonical }, [engine]);
  assert.equal(envelope.engine_enactments[0].required_state.underwear_bottom, 'removed');
  assert.ok(canonical.includes('아직 이전 상태라고 말했다'));
});
