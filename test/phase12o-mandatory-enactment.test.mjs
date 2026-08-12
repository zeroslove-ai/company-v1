import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attachEngineEnactments,
  buildInstitutionalSegments,
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
    }],
    worldRules: [{ id: 'csa_unknown', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'clothing_state', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }]
  });
  assert.equal(enactment.prior_state_known, false);
  assert.deepEqual(enactment.prior_state, { underwear_bottom: 'unknown' });
  assert.equal(enactment.state_effect, 'established');
  assert.equal(enactment.canonical_text.includes('\uC785\uACE0 \uC788\uB358'), false);
  assert.equal(enactment.canonical_text.includes('\uCC29\uC6A9\uD55C'), false);
  assert.equal(enactment.canonical_text.includes('\uC815\uB9AC'), false);
  assert.equal(enactment.canonical_text.includes('\uBCA8\uC5C8\uB2E4'), false);
  assert.equal(enactment.canonical_text.includes('\uAC08\uC544\uC785\uC5C8\uB2E4'), false);
  assert.equal(enactment.canonical_text.includes('\uCC29\uC6A9\uC744 \uBC14\uAFB8\uC5C8\uB2E4'), false);
  assert.equal(enactment.canonical_text.includes('윤민아'), true);
});

test('mandatory behavior uses the resolved obligation scope without reselecting actor or target', () => {
  const [enactment] = buildMandatoryEnactments({
    expectedTurn: 4,
    master,
    sceneObligations: [{
      actor_id: 'heroine1', source_rule_id: 'csa_behavior', type: 'behavior_execution',
      action: 'sit_on_lap', trigger_state: 'required_now', execution_policy: 'mandatory_execution',
      eligible_target_ids: ['heroine2']
    }],
    worldRules: [{ id: 'csa_behavior', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'behavior_execution', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }]
  });
  assert.equal(enactment.execution_kind, 'behavior_execution');
  assert.equal(enactment.action, 'sit_on_lap');
  assert.deepEqual(enactment.target_ids, ['heroine2']);
  assert.equal(enactment.state_effect, 'behavior_executed');
  assert.equal(enactment.canonical_text.includes('키스'), false);
  assert.equal(enactment.canonical_text.includes('윤민아'), true);
  assert.equal(enactment.canonical_text.includes('서원희'), true);
});

test('mandatory enactment fails closed when the resolved fact is absent', () => {
  assert.throws(() => buildMandatoryEnactments({
    expectedTurn: 7,
    master,
    sceneObligations: [{
      actor_id: 'heroine1', source_rule_id: 'csa_missing_fact', type: 'clothing_transition',
      changes: [{ slot: 'underwear_bottom', current: 'unknown', required: 'removed' }]
    }]
  }), /matching resolved fact/);
});

test('clothing validator rejects a required-state mutation even when the slot is unchanged', () => {
  const [enactment] = buildMandatoryEnactments({
    expectedTurn: 8,
    master,
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_exact_clothing', type: 'clothing_transition', changes: [{ slot: 'underwear_bottom', current: 'worn', required: 'removed' }] }],
    worldRules: [{ id: 'csa_exact_clothing', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'clothing_state', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }]
  });
  assert.throws(() => validateMandatoryEnactment({
    ...enactment,
    required_state: { underwear_bottom: 'worn' }
  }, {
    storyText: enactment.canonical_text,
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_exact_clothing', type: 'clothing_transition', changes: [{ slot: 'underwear_bottom', current: 'worn', required: 'removed' }] }],
    worldRules: [{ id: 'csa_exact_clothing', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'clothing_state', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }],
    registeredIds: new Set(['heroine1'])
  }), /required state/);
});

test('behavior validator rejects action and target scope mutations', () => {
  const [enactment] = buildMandatoryEnactments({
    expectedTurn: 9,
    master,
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_exact_behavior', type: 'behavior_execution', action: 'sit_on_lap', trigger_state: 'required_now', execution_policy: 'mandatory_execution', eligible_target_ids: ['heroine2'] }],
    worldRules: [{ id: 'csa_exact_behavior', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'posture_relation', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }]
  });
  const options = {
    storyText: enactment.canonical_text,
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_exact_behavior', type: 'behavior_execution', action: 'sit_on_lap', trigger_state: 'required_now', execution_policy: 'mandatory_execution', eligible_target_ids: ['heroine2'] }],
    worldRules: [{ id: 'csa_exact_behavior', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'posture_relation', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }],
    registeredIds: new Set(['heroine1', 'heroine2'])
  };
  assert.throws(() => validateMandatoryEnactment({ ...enactment, action: 'deep_kiss' }, options), /action scope/);
  assert.throws(() => validateMandatoryEnactment({ ...enactment, target_ids: [] }, options), /target scope/);
});

test('unsupported behavior actions and missing display identities fail deterministically', () => {
  const obligation = { actor_id: 'heroine1', source_rule_id: 'csa_future', type: 'behavior_execution', action: 'future_unknown_action', trigger_state: 'required_now', execution_policy: 'mandatory_execution', eligible_target_ids: ['heroine2'] };
  assert.throws(() => buildMandatoryEnactments({
    expectedTurn: 10, master, sceneObligations: [obligation],
    worldRules: [{ id: 'csa_future', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'future_kind', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }]
  }), /Unsupported canonical behavior action/);
  assert.throws(() => buildMandatoryEnactments({
    expectedTurn: 10, master: { characters: [], general_npcs: [] },
    sceneObligations: [{ actor_id: 'heroine9', source_rule_id: 'csa_identity', type: 'clothing_transition', changes: [{ slot: 'underwear_bottom', current: 'unknown', required: 'removed' }] }],
    worldRules: [{ id: 'csa_identity', resolved_facts: [{ actor_id: 'heroine9', execution_kind: 'clothing_state', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }]
  }), /Missing display identity/);
});

test('multi-counterparty behavior remains actor-authoritative without mass-targeting', () => {
  const [enactment] = buildMandatoryEnactments({
    expectedTurn: 11,
    master: { characters: [{ character_id: 'heroine1', name: '서원희' }, { character_id: 'heroine2', name: '김제나' }, { character_id: 'heroine3', name: '한리브' }], general_npcs: [] },
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_multi_target', type: 'behavior_execution', action: 'press_body_against', trigger_state: 'required_now', execution_policy: 'mandatory_execution', eligible_target_ids: ['heroine2', 'heroine3'] }],
    worldRules: [{ id: 'csa_multi_target', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'physical_contact', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }]
  });
  assert.deepEqual(enactment.target_ids, []);
  assert.deepEqual(enactment.counterparty_candidate_ids, ['heroine2', 'heroine3']);
  assert.match(enactment.canonical_text, /상대 직원/);
  assert.doesNotMatch(enactment.canonical_text, /heroine2|heroine3|press_body_against/);
  assert.doesNotThrow(() => validateMandatoryEnactment(enactment, {
    storyText: enactment.canonical_text,
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_multi_target', type: 'behavior_execution', action: 'press_body_against', trigger_state: 'required_now', execution_policy: 'mandatory_execution', eligible_target_ids: ['heroine2', 'heroine3'] }],
    worldRules: [{ id: 'csa_multi_target', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'physical_contact', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }],
    registeredIds: new Set(['heroine1', 'heroine2', 'heroine3'])
  }));
});

test('institutional segments appear only for newly activated or updated rules', () => {
  const segments = buildInstitutionalSegments({ expectedTurn: 12, worldRules: [
    { id: 'new-rule', phase: 'newly_activated', content: '새 규칙' },
    { id: 'updated-rule', phase: 'updated', content: '갱신 규칙' },
    { id: 'old-rule', phase: 'ongoing', content: '기존 규칙' }
  ] });
  assert.equal(segments.length, 2);
  assert.match(segments[0].canonical_text, /새로운 회사 규칙/);
  assert.match(segments[1].canonical_text, /회사 규칙이 갱신/);
  assert.doesNotMatch(segments.map(item => item.canonical_text).join('\n'), /기존 규칙/);
});

test('canonical composite orders engine segments before provider narrative and preserves both texts', () => {
  const [engine] = buildMandatoryEnactments({
    expectedTurn: 5,
    master,
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_clothing', type: 'clothing_transition', changes: [{ slot: 'underwear_bottom', current: 'unknown', required: 'removed' }] }],
    worldRules: [{ id: 'csa_clothing', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'clothing_state', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }]
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
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_clothing', type: 'clothing_transition', changes: [{ slot: 'underwear_bottom', current: 'worn', required: 'removed' }] }],
    worldRules: [{ id: 'csa_clothing', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'clothing_state', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }]
  });
  const canonical = composeCanonicalStory({ engineEnactments: [engine], providerNarrative: '윤민아는 아직 이전 상태라고 말했다.' });
  assert.equal(validateMandatoryEnactment(engine, {
    storyText: canonical,
    sceneObligations: [{ actor_id: 'heroine1', source_rule_id: 'csa_clothing', type: 'clothing_transition', changes: [{ slot: 'underwear_bottom', current: 'worn', required: 'removed' }] }],
    worldRules: [{ id: 'csa_clothing', resolved_facts: [{ actor_id: 'heroine1', execution_kind: 'clothing_state', trigger_state: 'required_now', execution_policy: 'mandatory_execution' }] }],
    registeredIds: new Set(['heroine1'])
  }), true);
  const envelope = attachEngineEnactments({ blocks: [], raw: canonical }, [engine]);
  assert.equal(envelope.engine_enactments[0].required_state.underwear_bottom, 'removed');
  assert.ok(canonical.includes('아직 이전 상태라고 말했다'));
});
