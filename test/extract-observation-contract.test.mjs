import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameCoreError } from '../src/engine/errors.js';
import { runExtract } from '../src/api/llm.js';
import { buildExtractPrompt } from '../src/engine/extract-prompt.js';
import { buildDegradedExtractObservation, normalizeExtractObservationV2, normalizeFreshExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { normalizePersistedExtractObservation } from '../src/engine/runtime-core/persisted-extract-observation.js';
import { reduceCsaAttitudeObservation, reduceNpcPhysicalObservation, reduceNpcRelationshipObservation } from '../src/engine/runtime-core/observation-reducers.js';
import { buildStoryObservationBlocks, parseFreshNarrativeV2 } from '../src/engine/fresh-narrative-parser.js';

const NPCS = new Set(['heroine1', 'heroine2']);
const STORY = 'scene-exit-evidence work-happened';
const capturedInvalidPhysical = JSON.parse(fs.readFileSync(new URL('./fixtures/csa-physical-invalid-position.json', import.meta.url)));
const capturedInvalidSceneEvidence = JSON.parse(fs.readFileSync(new URL('./fixtures/csa-physical-invalid-scene-id.json', import.meta.url)));
const scene = (final = null) => ({ scene_id: null, location_id: null, final_present_npc_ids: final, entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null, presence_is_final: final !== null, remote_speaker_ids: [], evidence: final?.length === 0 ? [{ kind: 'presence', character_id: 'heroine1', quote: 'scene-exit-evidence' }] : [] });
const valid = (overrides = {}) => ({
  extract_version: 2, outcome: 'success', scene_observation: scene(), player_observation: {}, npc_observations: {},
  events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3, mind_monitor: {}, action_target_id: null,
  image_character_id: null, image_selection: null, csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '', warnings: [], ...overrides
});

test('V2 observation normalizes the complete contract without mutating input', () => {
  const input = valid({ scene_observation: scene([]), npc_observations: { heroine1: { physical: { clothing: { uniform_top: 'removed' } } } } });
  const before = structuredClone(input);
  const result = normalizeExtractObservationV2(input, { npcIds: NPCS, storyText: STORY });
  assert.equal(result.extract_version, 2);
  assert.deepEqual(result.scene_observation.final_present_npc_ids, []);
  assert.deepEqual(input, before);
});
test('captured live physical Extract fails closed on the exact unknown position field', () => {
  const quote = capturedInvalidPhysical.scene_observation.evidence[0].quote;
  assert.throws(
    () => normalizeExtractObservationV2(capturedInvalidPhysical, { npcIds: NPCS, storyText: quote }),
    error => error.code === 'INVALID_EXTRACT_OBSERVATION' && error.message === 'Unknown observation field: position'
  );
});
test('captured live clothing Extract fails closed when scene evidence has no scene id', () => {
  const storyText = capturedInvalidSceneEvidence.scene_observation.evidence[0].quote;
  assert.throws(
    () => normalizeExtractObservationV2(capturedInvalidSceneEvidence, { npcIds: NPCS, storyText }),
    error => error.code === 'INVALID_EXTRACT_OBSERVATION' && error.message === 'scene evidence requires scene_id'
  );
});
test('Extract prompt gives the validator-owned physical shape example', () => {
  const [system] = buildExtractPrompt({ context: { save: { scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 0 } } }, storyText: STORY, playerAction: 'observe', expectedTurn: 4, edition: { characters: { characters: {} }, map: { locations: [] } }, npcIds: NPCS });
  assert.equal(system.content.includes('Use position_label, never position/label'), true);
  assert.equal(system.content.includes('underwear_bottom'), true);
  assert.equal(system.content.includes('physical_change'), true);
  assert.equal(system.content.includes('block_observations[].facts'), true);
  assert.equal(system.content.includes('open_facts'), false);
  assert.equal(system.content.includes('multi-NPC scene'), true);
});

test('fresh Extract flattens arbitrary evidence-backed nested facts with derived source blocks', () => {
  const storyText = 'Hayeon accepted the apology but remained disappointed. Hayeon leaned sideways against the desk with folded arms. Hayeon removed a silver hairpin. Hayeon and the player agreed to meet privately later.';
  const result = normalizeFreshExtractObservationV2(valid({
    block_observations: [{ block_id: 'story:0', block_type: 'narrative', facts: [
      { subject_id: 'heroine1', object_id: 'player', fact_text: 'Hayeon accepted the apology but remained disappointed.', story_quote: 'Hayeon accepted the apology but remained disappointed.' },
      { subject_id: 'heroine1', object_id: null, fact_text: 'Hayeon leaned sideways against the desk with folded arms.', story_quote: 'Hayeon leaned sideways against the desk with folded arms.' },
      { subject_id: 'heroine1', object_id: null, fact_text: 'Hayeon removed a silver hairpin.', story_quote: 'Hayeon removed a silver hairpin.' },
      { subject_id: 'heroine1', object_id: 'player', fact_text: 'Hayeon and the player agreed to meet privately later.', story_quote: 'Hayeon and the player agreed to meet privately later.' }
    ] }]
  }), { npcIds: NPCS, storyText, storyBlocks: [{ type: 'narrative', text: storyText }], expectedTurn: 4, actionId: 'open-fact' });
  assert.equal(result.open_facts.length, 4);
  assert.equal(result.open_facts[0].subject_id, 'heroine1');
  assert.equal(result.open_facts[0].fact_text, 'Hayeon accepted the apology but remained disappointed.');
  assert.equal(result.open_facts.every(fact => fact.source_block === 'story:0'), true);
});

test('raw Extract provider capture is an explicit non-durable callback seam', async () => {
  const rawContent = '{"block_observations":[]}';
  let captured = null;
  const response = await runExtract({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'test-key', EXTRACT_MODEL: 'extract-test' },
    messages: [{ role: 'user', content: 'test' }],
    fetchImpl: async () => new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: rawContent } }] }), { status: 200 }),
    onRawResponse: value => { captured = value; }
  });
  assert.deepEqual(response, { block_observations: [] });
  assert.deepEqual(captured, { content: rawContent, finish_reason: 'stop' });
});

test('fresh Extract accounts for every Story block and preserves nested arbitrary open facts', () => {
  const storyBlocks = [
    { type: 'narrative', text: 'Hayeon agreed to postpone the meeting. Hayeon felt relieved.' },
    { type: 'dialogue', text: 'We can decide together tomorrow.' }
  ];
  const storyText = storyBlocks.map(block => block.text).join('\n');
  const result = normalizeFreshExtractObservationV2(valid({
    block_observations: [
      { block_id: 'story:0', block_type: 'narrative', facts: [
        { subject_id: 'heroine1', object_id: 'player', fact_text: 'Hayeon agreed to postpone the meeting.', story_quote: 'Hayeon agreed to postpone the meeting.' },
        { subject_id: 'heroine1', object_id: null, fact_text: 'Hayeon felt relieved.', story_quote: 'Hayeon felt relieved.' }
      ] },
      { block_id: 'story:1', block_type: 'dialogue', facts: [] }
    ]
  }), { npcIds: NPCS, storyText, storyBlocks, expectedTurn: 4, actionId: 'coverage-facts' });
  assert.equal(result.open_facts.length, 2);
  assert.equal('observation_coverage' in result, false);
});

test('fresh Extract uses facts: [] as the explicit zero-fact representation', () => {
  const storyBlocks = [
    { type: 'scene', text: 'The office lights stayed on.' },
    { type: 'acting', text: 'The player checked the clock.' }
  ];
  const result = normalizeFreshExtractObservationV2(valid({
    block_observations: [
      { block_id: 'story:0', block_type: 'scene', facts: [] },
      { block_id: 'story:1', block_type: 'acting', facts: [] }
    ]
  }), { npcIds: NPCS, storyText: storyBlocks.map(block => block.text).join('\n'), storyBlocks, expectedTurn: 4, actionId: 'coverage-none' });
  assert.deepEqual(result.open_facts, []);
});

test('fresh Extract treats missing, duplicate, unknown, or mismatched Story block observations as optional warnings', () => {
  const storyBlocks = [
    { type: 'narrative', text: 'Hayeon accepted the apology.' },
    { type: 'acting', text: 'She folded the note.' }
  ];
  const baseOptions = { npcIds: NPCS, storyText: storyBlocks.map(block => block.text).join('\n'), storyBlocks, expectedTurn: 4, actionId: 'coverage-invalid' };
  const incomplete = normalizeFreshExtractObservationV2(valid({ block_observations: [{ block_id: 'story:0', block_type: 'narrative', facts: [] }] }), baseOptions);
  assert.deepEqual(incomplete.open_facts, []);
  assert.ok(incomplete.warnings.some(warning => warning.includes('missing')));
  const duplicate = normalizeFreshExtractObservationV2(valid({
    block_observations: [
      { block_id: 'story:0', block_type: 'narrative', facts: [] },
      { block_id: 'story:0', block_type: 'narrative', facts: [] },
      { block_id: 'story:1', block_type: 'acting', facts: [] }
    ]
  }), baseOptions);
  assert.deepEqual(duplicate.open_facts, []);
  assert.ok(duplicate.warnings.some(warning => warning.includes('duplicate')));
  const mismatched = normalizeFreshExtractObservationV2(valid({
    block_observations: [
      { block_id: 'story:0', block_type: 'dialogue', facts: [] },
      { block_id: 'story:1', block_type: 'acting', facts: [] }
    ]
  }), baseOptions);
  assert.deepEqual(mismatched.open_facts, []);
  assert.ok(mismatched.warnings.some(warning => warning.includes('STORY_BLOCK_OBSERVATIONS_INCOMPLETE')));
});

test('fresh Extract drops invalid optional facts while preserving the fresh protocol boundary', () => {
  const storyBlocks = [{ type: 'narrative', text: 'Hayeon accepted the apology.' }];
  const baseOptions = { npcIds: NPCS, storyText: storyBlocks[0].text, storyBlocks, expectedTurn: 4, actionId: 'wire-invalid' };
  const block = facts => ({ block_observations: [{ block_id: 'story:0', block_type: 'narrative', facts }] });
  const unknown = normalizeFreshExtractObservationV2(valid(block([{ subject_id: 'unknown', object_id: null, fact_text: 'x', story_quote: 'Hayeon accepted the apology.' }])), baseOptions);
  assert.deepEqual(unknown.open_facts, []);
  assert.ok(unknown.warnings.some(warning => warning.includes('OPEN_FACT_UNKNOWN_ID')));
  const unknownObject = normalizeFreshExtractObservationV2(valid(block([{ subject_id: 'heroine1', object_id: 'unknown', fact_text: 'x', story_quote: 'Hayeon accepted the apology.' }])), baseOptions);
  assert.deepEqual(unknownObject.open_facts, []);
  assert.ok(unknownObject.warnings.some(warning => warning.includes('OPEN_FACT_UNKNOWN_ID')));
  const badQuote = normalizeFreshExtractObservationV2(valid(block([{ subject_id: 'heroine1', object_id: null, fact_text: 'x', story_quote: 'not in block' }])), baseOptions);
  assert.deepEqual(badQuote.open_facts, []);
  assert.ok(badQuote.warnings.some(warning => warning.includes('OPEN_FACT_EVIDENCE_QUOTE_NOT_IN_STORY')));
  assert.throws(() => normalizeFreshExtractObservationV2(valid({ ...block([]), open_facts: [] }), baseOptions), error => error.code === 'FRESH_TOP_LEVEL_OPEN_FACTS_FORBIDDEN');
  const malformedBlock = normalizeFreshExtractObservationV2(valid({ block_observations: [{ block_id: 'story:0', block_type: 'narrative', decision: 'none', facts: [] }] }), baseOptions);
  assert.deepEqual(malformedBlock.open_facts, []);
  assert.ok(malformedBlock.warnings.some(warning => warning.includes('INVALID_BLOCK_OBSERVATIONS')));
});

test('fresh Extract keeps valid facts beside invalid identities, quotes, source blocks, and fact shapes', () => {
  const storyBlocks = [
    { type: 'narrative', text: 'Hayeon accepted the apology.' },
    { type: 'acting', text: 'Hayeon folded the note.' }
  ];
  const storyText = storyBlocks.map(block => block.text).join('\n');
  const result = normalizeFreshExtractObservationV2(valid({
    block_observations: [
      { block_id: 'story:0', block_type: 'narrative', facts: [
        { subject_id: 'heroine1', object_id: 'player', fact_text: 'Hayeon accepted the apology.', story_quote: 'Hayeon accepted the apology.' },
        { subject_id: 'unknown', object_id: null, fact_text: 'ignored', story_quote: 'Hayeon accepted the apology.' },
        { subject_id: 'heroine1', object_id: 'unknown', fact_text: 'ignored', story_quote: 'Hayeon accepted the apology.' },
        { subject_id: 'heroine1', object_id: null, fact_text: 'ignored', story_quote: 'not in the Story' },
        { subject_id: 'heroine1', object_id: null, fact_text: 'ignored' }
      ] },
      { block_id: 'story:99', block_type: 'narrative', facts: [{ subject_id: 'heroine1', object_id: null, fact_text: 'ignored', story_quote: 'Hayeon accepted the apology.' }] },
      { block_id: 'story:1', block_type: 'acting', facts: 'malformed' }
    ]
  }), { npcIds: NPCS, storyText, storyBlocks, expectedTurn: 4, actionId: 'mixed-optional' });
  assert.equal(result.open_facts.length, 1);
  assert.equal(result.open_facts[0].subject_id, 'heroine1');
  assert.equal(result.open_facts[0].object_id, 'player');
  assert.equal(result.open_facts[0].source_block, 'story:0');
  assert.ok(result.warnings.length >= 4);
});

test('fresh Extract with no usable block observations completes as an empty optional projection', () => {
  const result = normalizeFreshExtractObservationV2(valid({ block_observations: [] }), {
    npcIds: NPCS,
    storyText: 'Hayeon accepted the apology.',
    storyBlocks: [{ type: 'narrative', text: 'Hayeon accepted the apology.' }],
    expectedTurn: 4,
    actionId: 'no-usable-facts'
  });
  assert.deepEqual(result.open_facts, []);
  assert.ok(result.warnings.some(warning => warning.includes('missing')));
});

test('persisted V2 replay keeps canonical open facts while ignoring obsolete provider coverage metadata', () => {
  const result = normalizePersistedExtractObservation({
    ...valid({
      open_facts: [{ subject_id: 'heroine1', object_id: 'player', fact_text: 'Hayeon agreed.', story_quote: 'Hayeon agreed.', source_block: 'story:0' }],
      observation_coverage: [{ block_id: 'story:0', block_type: 'narrative', decision: 'facts' }]
    })
  }, { npcIds: NPCS, storyText: 'Hayeon agreed.' });
  assert.equal(result.open_facts.length, 1);
  assert.equal('observation_coverage' in result, false);
});

test('persisted canonical open facts validate server identity metadata and reject drift or unknown fields', () => {
  const storyText = 'Hayeon agreed.';
  const options = { npcIds: NPCS, storyText, storyBlocks: [{ type: 'narrative', text: storyText }], expectedTurn: 4, actionId: 'persisted-contract' };
  const fresh = normalizeFreshExtractObservationV2(valid({
    block_observations: [{ block_id: 'story:0', block_type: 'narrative', facts: [{
      subject_id: 'heroine1', object_id: 'player', fact_text: storyText, story_quote: storyText
    }] }]
  }), options);
  assert.equal(fresh.open_facts[0].action_id, 'persisted-contract');
  assert.equal(fresh.open_facts[0].turn_number, 4);
  assert.equal(fresh.open_facts[0].source_block, 'story:0');
  for (const [field, value, code] of [
    ['fact_id', 'tampered', 'PERSISTED_OPEN_FACT_ID_MISMATCH'],
    ['action_id', 'other-action', 'PERSISTED_OPEN_FACT_ACTION_MISMATCH'],
    ['turn_number', 5, 'PERSISTED_OPEN_FACT_TURN_MISMATCH'],
    ['unknown_server_field', true, 'INVALID_OPEN_FACT']
  ]) {
    const tampered = structuredClone(fresh);
    tampered.open_facts[0][field] = value;
    assert.throws(
      () => normalizePersistedExtractObservation(tampered, options),
      error => error.code === code
    );
  }
  const persisted = normalizePersistedExtractObservation(structuredClone(fresh), options);
  assert.deepEqual(persisted.open_facts, fresh.open_facts);
  const badSource = structuredClone(fresh);
  badSource.open_facts[0].source_block = 'story:1';
  assert.throws(
    () => normalizePersistedExtractObservation(badSource, options),
    error => error.code === 'OPEN_FACT_SOURCE_BLOCK_UNKNOWN'
  );
});

test('fresh provider facts cannot author persisted server metadata and are dropped as optional input', () => {
  const storyText = 'Hayeon agreed.';
  const result = normalizeFreshExtractObservationV2(valid({
    block_observations: [{ block_id: 'story:0', block_type: 'narrative', facts: [{
      subject_id: 'heroine1', object_id: 'player', fact_text: storyText, story_quote: storyText, fact_id: 'provider-authored'
    }] }]
  }), { npcIds: NPCS, storyText, storyBlocks: [{ type: 'narrative', text: storyText }], expectedTurn: 4, actionId: 'fresh-wire' });
  assert.deepEqual(result.open_facts, []);
  assert.ok(result.warnings.some(warning => warning.includes('INVALID_BLOCK_OBSERVATION_FACT')));
});

test('Extract prompt exposes parser-owned Story block identities and exact text without a second parser', () => {
  const rawStory = '[SCENE]Office lights are low.[/SCENE][DIALOGUE speaker_id="heroine1"]Are you ready?[/DIALOGUE][ACTING]She folds the note.[/ACTING][THOUGHT]Not an observation block.[/THOUGHT][CHOICE]Wait.[/CHOICE][CHOICE]Ask.[/CHOICE][CHOICE]Leave.[/CHOICE][CHOICE]Work.[/CHOICE]';
  const parsedStory = parseFreshNarrativeV2(rawStory, { master: { characters: [{ character_id: 'heroine1', name: 'Hayeon' }] } });
  const [system, user] = buildExtractPrompt({
    context: { save: { scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 0 } } },
    storyText: rawStory, parsedStory, expectedTurn: 4, edition: { characters: { characters: {} }, map: { locations: [] } }, npcIds: new Set(['heroine1'])
  });
  const payload = JSON.parse(user.content);
  const expectedBlocks = buildStoryObservationBlocks(parsedStory);
  assert.deepEqual(payload.story_observation_blocks, expectedBlocks);
  assert.deepEqual(payload.story_observation_blocks.map(block => block.block_type), ['scene', 'dialogue', 'acting']);
  assert.equal(payload.story_observation_blocks.every(block => typeof block.text === 'string' && block.text.length > 0), true);
  assert.equal(system.content.includes('observation_coverage'), false);
  assert.equal(system.content.includes('decision'), false);
  assert.equal(system.content.includes('open_facts'), false);
  assert.equal(user.content.includes('source_block'), false);
});

test('physical, posture, intimate, and sexual outcomes outside CSA vocabulary survive as open facts', () => {
  const storyText = 'Hayeon leaned against the desk. Hayeon held the player hand. Hayeon kissed the player. Hayeon felt unexpectedly shy.';
  const result = normalizeFreshExtractObservationV2(valid({
    block_observations: [{ block_id: 'story:0', block_type: 'narrative', facts: [
      { subject_id: 'heroine1', object_id: null, fact_text: 'Hayeon leaned against the desk.', story_quote: 'Hayeon leaned against the desk.' },
      { subject_id: 'heroine1', object_id: 'player', fact_text: 'Hayeon held the player hand.', story_quote: 'Hayeon held the player hand.' },
      { subject_id: 'heroine1', object_id: 'player', fact_text: 'Hayeon kissed the player.', story_quote: 'Hayeon kissed the player.' },
      { subject_id: 'heroine1', object_id: null, fact_text: 'Hayeon felt unexpectedly shy.', story_quote: 'Hayeon felt unexpectedly shy.' }
    ] }]
  }), { npcIds: NPCS, storyText, storyBlocks: [{ type: 'narrative', text: storyText }], expectedTurn: 4, actionId: 'open-fact-natural-outcome' });
  assert.deepEqual(result.open_facts.map(fact => fact.fact_text), [
    'Hayeon leaned against the desk.',
    'Hayeon held the player hand.',
    'Hayeon kissed the player.',
    'Hayeon felt unexpectedly shy.'
  ]);
});

test('fresh Extract removes closed semantic event/relation/emotion writers while retaining open facts', () => {
  const storyText = 'Hayeon accepts the apology.';
  const result = normalizeFreshExtractObservationV2(valid({
    events: { general: [{ event_type: 'promise', participants: ['heroine1'], evidence: storyText }], sexual: [] },
    relation_updates: [{ actor_id: 'heroine1', target_id: 'player', relation_kind: 'friendship', state: 'started', quote: storyText }],
    npc_observations: { heroine1: { emotion: { mood: 'disappointed' }, relationship: { closeness: 'close' } } },
    block_observations: [{ block_id: 'story:0', block_type: 'narrative', facts: [{ subject_id: 'heroine1', object_id: 'player', fact_text: 'Hayeon accepts the apology.', story_quote: storyText }] }]
  }), { npcIds: NPCS, storyText, storyBlocks: [{ type: 'narrative', text: storyText }], expectedTurn: 5, actionId: 'closed-reset' });
  assert.deepEqual(result.events, { general: [], sexual: [] });
  assert.deepEqual(result.relation_updates, []);
  assert.equal(result.npc_observations.heroine1.emotion, undefined);
  assert.equal(result.npc_observations.heroine1.relationship, undefined);
  assert.equal(result.open_facts.length, 1);
});
test('valid evidenced clothing observation uses the canonical position_label shape and commits clothing', () => {
  const quote = '윤민아가 팬티를 벗고 근무복 차림으로 업무를 계속한다.';
  const input = valid({ npc_observations: { heroine2: { physical: { position_label: '회의실 테이블 옆', clothing: { underwear_bottom: 'removed' } } } }, evidence: {
    clothing: { heroine2: { character_id: 'heroine2', quote } },
    physical_change: { changed: ['npc_scene_state.heroine2.clothing.underwear_bottom'], quote }
  } });
  const observation = normalizeExtractObservationV2(input, { npcIds: NPCS, storyText: quote });
  const reduced = reduceNpcPhysicalObservation({
    save: { scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: ['heroine2'], focal_character_id: null, last_speaker_id: null, updated_turn: 0 }, npc_scene_state: { heroine2: { present: true, clothing: { underwear_bottom: 'worn' } } } },
    npcId: 'heroine2', physical: observation.npc_observations.heroine2.physical, evidence: observation.evidence,
    storyText: quote, expectedTurn: 4, npcIds: NPCS, master: { characters: [{ character_id: 'heroine2', name: '윤민아' }] },
    parsedStory: {}, sceneBefore: { present_npc_ids: ['heroine2'] }, sceneAfter: { present_npc_ids: ['heroine2'] }, observedNpcIds: ['heroine2']
  });
  assert.equal(reduced.state.clothing.underwear_bottom, 'removed');
  assert.equal(reduced.state.position_label, '회의실 테이블 옆');
});

test('nested NPC evidence is rejected; evidence remains a top-level V2 sibling', () => {
  assert.throws(
    () => normalizeExtractObservationV2(valid({
      npc_observations: { heroine2: { physical: { posture: 'standing' }, evidence: { changed: [], quote: '' } } }
    }), { npcIds: NPCS, storyText: STORY }),
    error => error.code === 'INVALID_EXTRACT_OBSERVATION' && /Unknown observation field: evidence/.test(error.message)
  );
});
test('missing or wrong extract version fails', () => {
  assert.throws(() => normalizeExtractObservationV2({ ...valid(), extract_version: undefined }, { npcIds: NPCS }), error => error.code === 'EXTRACT_VERSION_UNSUPPORTED');
  assert.throws(() => normalizeExtractObservationV2({ ...valid(), extract_version: 1 }, { npcIds: NPCS }), error => error.code === 'EXTRACT_VERSION_UNSUPPORTED');
});
test('save patch and unknown top-level fields fail', () => {
  assert.throws(() => normalizeExtractObservationV2({ ...valid(), state_delta: {} }, { npcIds: NPCS }), GameCoreError);
  assert.throws(() => normalizeExtractObservationV2({ ...valid(), unexpected: true }, { npcIds: NPCS }), GameCoreError);
});
test('null and empty final presence remain distinct', () => {
  assert.equal(normalizeExtractObservationV2(valid(), { npcIds: NPCS }).scene_observation.final_present_npc_ids, null);
  const empty = normalizeExtractObservationV2(valid({ scene_observation: scene([]) }), { npcIds: NPCS, storyText: STORY });
  assert.deepEqual(empty.scene_observation.final_present_npc_ids, []);
});
test('presence meaning has one authority in final_present_npc_ids', () => {
  assert.throws(() => normalizeExtractObservationV2(valid({ scene_observation: { ...scene(), presence_is_final: 'true' } }), { npcIds: NPCS }), error => error.code === 'INVALID_EXTRACT_OBSERVATION');
  const unobserved = normalizeExtractObservationV2(valid({ scene_observation: { ...scene(), presence_is_final: true } }), { npcIds: NPCS });
  assert.equal(unobserved.scene_observation.final_present_npc_ids, null);
  assert.equal('presence_is_final' in unobserved.scene_observation, false);
  const empty = normalizeExtractObservationV2(valid({ scene_observation: { ...scene([]), presence_is_final: false } }), { npcIds: NPCS, storyText: STORY });
  assert.deepEqual(empty.scene_observation.final_present_npc_ids, []);
  assert.equal('presence_is_final' in empty.scene_observation, false);
  const explicit = normalizeExtractObservationV2(valid({ scene_observation: { ...scene(['heroine1']), presence_is_final: false } }), { npcIds: NPCS });
  assert.deepEqual(explicit.scene_observation.final_present_npc_ids, ['heroine1']);
  assert.equal('presence_is_final' in explicit.scene_observation, false);
});
test('unknown NPC observation and IDs fail', () => {
  assert.throws(() => normalizeExtractObservationV2(valid({ npc_observations: { heroine9: {} } }), { npcIds: NPCS }), GameCoreError);
  assert.throws(() => normalizeExtractObservationV2(valid({ scene_observation: scene(['heroine9']) }), { npcIds: NPCS }), GameCoreError);
});
test('forbidden physical scene authority fields fail', () => {
  assert.throws(() => normalizeExtractObservationV2(valid({ player_observation: { physical: { location_id: 'x' } } }), { npcIds: NPCS }), GameCoreError);
  assert.throws(() => normalizeExtractObservationV2(valid({ npc_observations: { heroine1: { physical: { present: true } } } }), { npcIds: NPCS }), GameCoreError);
});
test('mind monitor is turn-level surface/subconscious only', () => {
  const result = normalizeExtractObservationV2(valid({ mind_monitor: { heroine1: { surface: 'surface', subconscious: 'subconscious' } } }), { npcIds: NPCS });
  assert.deepEqual(result.mind_monitor.heroine1, { surface: 'surface', subconscious: 'subconscious' });
  assert.throws(() => normalizeExtractObservationV2(valid({ mind_monitor: { heroine1: { body: 'x' } } }), { npcIds: NPCS }), GameCoreError);
});
test('sexual and general events retain evidence but not derived counters', () => {
  const result = normalizeExtractObservationV2(valid({ events: { general: [{ event_type: 'work_event', summary: 'work-happened', evidence: 'work-happened' }], sexual: [] } }), { npcIds: NPCS, storyText: STORY });
  assert.equal(result.events.general[0].evidence, 'work-happened');
  assert.equal('ejaculation_counts' in result, false);
});
test('elapsed time is bounded unless explicit time-advance evidence exists', () => {
  assert.equal(normalizeExtractObservationV2(valid({ elapsed_minutes: 31 }), { npcIds: NPCS }).elapsed_minutes, 3);
  assert.equal(normalizeExtractObservationV2(valid({ elapsed_minutes: 480, evidence: { time_advance: true } }), { npcIds: NPCS }).elapsed_minutes, 480);
});
test('image selection keeps the server allowlist and forces sex for an action tag', () => {
  const result = normalizeExtractObservationV2(valid({ image_selection: { pool: 'general', tags: ['handjob', 'not-real'] } }), { npcIds: NPCS });
  assert.deepEqual(result.image_selection, { pool: 'sex', tags: ['handjob'] });
});
test('NPC observation domains reject arbitrary save fields', () => {
  assert.throws(() => normalizeExtractObservationV2(valid({ npc_observations: { heroine1: { relationship: { relationship_summary: 'x' } } } }), { npcIds: NPCS }), GameCoreError);
  assert.throws(() => normalizeExtractObservationV2(valid({ npc_observations: { heroine1: { stats: { affinity_delta: 99 } } } }), { npcIds: NPCS }), GameCoreError);
});
test('degraded observation is deterministic and does not create a patch', () => {
  const result = buildDegradedExtractObservation({ extraWarnings: ['x'] });
  assert.equal(result.extract_version, 2);
  assert.equal(result.outcome, 'degraded');
  assert.equal('state_delta' in result, false);
  assert.ok(result.warnings.includes('extract_degraded'));
});

test('scene evidence quotes must be exact substrings of the raw Story for every kind', () => {
  const cases = [
    { kind: 'presence', character_id: 'heroine1', quote: 'presence quote' },
    { kind: 'scene', quote: 'scene quote' }
  ];
  const story = cases.map(item => item.quote).join(' | ');
  for (const item of cases) {
    const sceneObservation = { ...scene(), scene_id: item.kind === 'scene' ? 'scene-a' : null, evidence: [item] };
    const result = normalizeExtractObservationV2(valid({ scene_observation: sceneObservation }), { npcIds: NPCS, storyText: story });
    assert.equal(result.scene_observation.evidence[0].quote, item.quote);
    assert.throws(() => normalizeExtractObservationV2(valid({ scene_observation: { ...sceneObservation, evidence: [{ ...item, quote: 'not in raw Story' }] } }), { npcIds: NPCS, storyText: story }), error => error.code === 'SCENE_EVIDENCE_QUOTE_NOT_IN_STORY');
  }
});

test('presence authority preserves explicit entered/exited evidence fields', () => {
  const observation = normalizeExtractObservationV2(valid({ scene_observation: {
    ...scene(['heroine1']),
    entered_npc_ids: ['heroine2'],
    exited_npc_ids: ['heroine1'],
    presence_is_final: false,
    evidence: [
      { kind: 'entrance', character_id: 'heroine2', quote: 'scene-exit-evidence' },
      { kind: 'exit', character_id: 'heroine1', quote: 'scene-exit-evidence' }
    ]
  } }), { npcIds: NPCS, storyText: STORY });
  assert.deepEqual(observation.scene_observation.final_present_npc_ids, ['heroine1']);
  assert.deepEqual(observation.scene_observation.entered_npc_ids, ['heroine2']);
  assert.deepEqual(observation.scene_observation.exited_npc_ids, ['heroine1']);
  assert.equal('presence_is_final' in observation.scene_observation, false);
});

test('fresh V2 rejects movement as a scene evidence kind', () => {
  assert.throws(() => normalizeExtractObservationV2(valid({ scene_observation: {
    ...scene(), evidence: [{ kind: 'movement', location_id: 'room-a', quote: STORY }]
  } }), { npcIds: NPCS, storyText: STORY }), error => error.code === 'INVALID_EXTRACT_OBSERVATION');
});

test('flattened emotion observation remains an unknown NPC and fails closed', () => {
  assert.throws(
    () => normalizeExtractObservationV2(valid({ npc_observations: { emotion: { mood: '당황' } } }), { npcIds: NPCS }),
    /Unknown NPC observation: emotion/
  );
});

test('V2 observation rejects type coercion and forbidden relationship/CSA fields', () => {
  assert.throws(() => normalizeExtractObservationV2(valid({ npc_observations: { heroine1: { physical: { posture: 1 } } } }), { npcIds: NPCS }), GameCoreError);
  assert.throws(() => normalizeExtractObservationV2(valid({ npc_observations: { heroine1: { physical: { position_label: {} } } } }), { npcIds: NPCS }), GameCoreError);
  assert.throws(() => normalizeExtractObservationV2(valid({ npc_observations: { heroine1: { emotion: { mood: {} } } } }), { npcIds: NPCS }), GameCoreError);
  assert.throws(() => normalizeExtractObservationV2(valid({ npc_observations: { heroine1: { work: { task: [] } } } }), { npcIds: NPCS }), GameCoreError);
  assert.throws(() => normalizeExtractObservationV2(valid({ npc_observations: { heroine1: { relationship: { milestones: {} } } } }), { npcIds: NPCS }), GameCoreError);
  assert.throws(() => normalizeExtractObservationV2(valid({ npc_observations: { heroine1: { csa_attitude: { resistance: 'high' } } } }), { npcIds: NPCS }), GameCoreError);
  assert.throws(() => normalizeExtractObservationV2(valid({ npc_observations: { heroine1: { csa_attitude: { last_changed_turn: 4 } } } }), { npcIds: NPCS }), GameCoreError);
});
test('physical clothing slots and states remain strict', () => {
  assert.throws(() => normalizeExtractObservationV2(valid({ npc_observations: { heroine1: { physical: { clothing: { panties: 'removed' } } } } }), { npcIds: NPCS }), error => error.code === 'INVALID_EXTRACT_OBSERVATION');
  assert.throws(() => normalizeExtractObservationV2(valid({ npc_observations: { heroine1: { physical: { clothing: { underwear_bottom: 'discarded' } } } } }), { npcIds: NPCS }), error => error.code === 'INVALID_EXTRACT_OBSERVATION');
});

test('player sexual deltas use the reducer-compatible integer contract', () => {
  const result = normalizeExtractObservationV2(valid({ player_observation: { sexual: { arousal_delta: 101, ejaculation_progress_delta: 6, ejaculation_completed: false, erection_state: 'erect' } } }), { npcIds: NPCS });
  assert.equal(result.player_observation.sexual.arousal_delta, 101);
  assert.equal(result.player_observation.sexual.ejaculation_progress_delta, 6);
  assert.throws(() => normalizeExtractObservationV2(valid({ player_observation: { sexual: { ejaculation_progress_delta: 7 } } }), { npcIds: NPCS }), GameCoreError);
});

test('general and sexual events have separate schemas, exact evidence, and deterministic ids', () => {
  const sexual = normalizeExtractObservationV2(valid({ events: { general: [], sexual: [
    { actor_id: 'heroine1', target_id: 'player-1', action_type: 'genital_touch', completed: false, interrupted: true, evidence: 'work-happened' }
  ] } }), { npcIds: NPCS, storyText: STORY, expectedTurn: 4, actionId: 'a' });
  const replay = normalizeExtractObservationV2(valid({ events: { general: [], sexual: [
    { actor_id: 'heroine1', target_id: 'player-1', action_type: 'genital_touch', completed: false, interrupted: true, evidence: 'work-happened' }
  ] } }), { npcIds: NPCS, storyText: STORY, expectedTurn: 4, actionId: 'a' });
  assert.equal(sexual.events.sexual[0].event_id, replay.events.sexual[0].event_id);
  assert.notEqual(sexual.events.sexual[0].event_id, normalizeExtractObservationV2(valid({ events: { general: [], sexual: [
    { actor_id: 'heroine1', target_id: 'player-1', action_type: 'genital_touch', completed: false, interrupted: true, evidence: 'scene-exit-evidence' }
  ] } }), { npcIds: NPCS, storyText: STORY, expectedTurn: 4, actionId: 'a' }).events.sexual[0].event_id);
  assert.throws(() => normalizeExtractObservationV2(valid({ events: { general: [], sexual: [{ target_id: 'player-1', action_type: 'oral', completed: true, interrupted: false, evidence: 'work-happened' }] } }), { npcIds: NPCS, storyText: STORY }), GameCoreError);
  assert.throws(() => normalizeExtractObservationV2(valid({ events: { general: [{ event_type: 'penetration', evidence: 'work-happened' }], sexual: [] } }), { npcIds: NPCS, storyText: STORY }), GameCoreError);
  assert.throws(() => normalizeExtractObservationV2(valid({ events: { general: [{ event_type: 'work_event', evidence: 'missing' }], sexual: [] } }), { npcIds: NPCS, storyText: STORY }), error => error.code === 'EVENT_EVIDENCE_QUOTE_NOT_IN_STORY');
});

test('relationship fields use independent evidence gates and CSA familiarity writes turn metadata', () => {
  const save = { npc_relationship_state: { heroine1: { closeness: 'acquaintance', romance_status: 'none', current_boundary: 'professional' } }, csa_attitudes: { heroine1: { familiarity: 1, last_changed_turn: 2 } } };
  const master = { characters: [{ character_id: 'heroine1', name: '서원희' }] };
  const noEvidence = reduceNpcRelationshipObservation({ save, npcId: 'heroine1', relationship: { romance_status: 'interest' }, evidence: {}, storyText: '서원희가 잠시 멈췄다.', master, parsedStory: {} });
  assert.equal(noEvidence.state.romance_status, 'none');
  const closenessOnly = reduceNpcRelationshipObservation({ save, npcId: 'heroine1', relationship: { closeness: 'familiar', romance_status: 'interest', current_boundary: 'open' }, evidence: { closeness: { changed: ['npc_relationship_state.heroine1.closeness'], quote: '서원희가 가까워졌다.' } }, storyText: '서원희가 가까워졌다.', master, parsedStory: {} });
  assert.equal(closenessOnly.state.closeness, 'familiar');
  assert.equal(closenessOnly.state.romance_status, 'none');
  assert.equal(closenessOnly.state.current_boundary, 'professional');
  const all = reduceNpcRelationshipObservation({ save, npcId: 'heroine1', relationship: { closeness: 'familiar', romance_status: 'interest', current_boundary: 'open' }, evidence: {
    closeness: { changed: ['npc_relationship_state.heroine1.closeness'], quote: '서원희가 가까워졌다.' },
    romance: { changed: ['npc_relationship_state.heroine1.romance_status'], quote: '서원희의 마음이 흔들렸다.' },
    boundary: { changed: ['npc_relationship_state.heroine1.current_boundary'], quote: '서원희가 경계를 풀었다.' }
  }, storyText: '서원희가 가까워졌다. 서원희의 마음이 흔들렸다. 서원희가 경계를 풀었다.', master, parsedStory: {} });
  assert.deepEqual(all.state, { closeness: 'familiar', romance_status: 'interest', current_boundary: 'open' });
  const familiarity = reduceCsaAttitudeObservation({ save, npcId: 'heroine1', attitude: { familiarity: 2 }, expectedTurn: 9, evidence: { csa: { changed: ['csa_attitudes.heroine1.familiarity'], quote: '서원희는 그 변화를 알아챘다.' } }, storyText: '서원희는 그 변화를 알아챘다.' });
  assert.deepEqual(familiarity.state, { familiarity: 2, last_changed_turn: 9 });
  const same = reduceCsaAttitudeObservation({ save: { csa_attitudes: { heroine1: { familiarity: 2, last_changed_turn: 4 } } }, npcId: 'heroine1', attitude: { familiarity: 2 }, expectedTurn: 9, evidence: {}, storyText: '서원희는 그대로 있었다.' });
  assert.deepEqual(same.state, { familiarity: 2, last_changed_turn: 4 });
});

test('event identity includes participants and sexual actor/target fields', () => {
  const sexual = normalizeExtractObservationV2(valid({ events: { general: [], sexual: [
    { actor_id: 'heroine1', target_id: 'player-1', action_type: 'kiss', direction: 'npc_to_player', completed: true, interrupted: false, evidence: 'same quote' },
    { actor_id: 'heroine2', target_id: 'player-1', action_type: 'kiss', direction: 'npc_to_player', completed: true, interrupted: false, evidence: 'same quote' }
  ] } }), { npcIds: NPCS, storyText: 'same quote', expectedTurn: 7, actionId: 'a' });
  assert.notEqual(sexual.events.sexual[0].event_id, sexual.events.sexual[1].event_id);
  const general = normalizeExtractObservationV2(valid({ events: { general: [
    { event_type: 'work_event', participants: ['heroine1'], evidence: 'same quote' },
    { event_type: 'work_event', participants: ['heroine2'], evidence: 'same quote' }
  ], sexual: [] } }), { npcIds: NPCS, storyText: 'same quote', expectedTurn: 7, actionId: 'a' });
  assert.notEqual(general.events.general[0].event_id, general.events.general[1].event_id);
});

test('Extract prompt exposes the block-local V2 skeleton and save-patch prohibitions', () => {
  const system = buildExtractPrompt({ context: { save: { scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 0 } } }, storyText: 'story', playerAction: 'action', expectedTurn: 1 })[0].content;
  for (const key of ['extract_version', 'outcome', 'scene_observation', 'player_observation', 'npc_observations', 'block_observations', 'evidence', 'elapsed_minutes', 'mind_monitor', 'action_target_id', 'image_character_id', 'image_selection', 'csa_trigger_evaluations', 'csa_runtime_updates', 'turn_summary', 'warnings']) {
    assert.equal(system.includes(`"${key}"`), true);
  }
  assert.equal(system.includes('observation_coverage'), false);
  assert.equal(system.includes('"decision"'), false);
  assert.equal(system.includes('Never return these save-patch or parser fields'), true);
  assert.equal(system.includes('scene evidence uses'), true);
  assert.equal(system.includes('if the final snapshot cannot be established, preserve null'), true);
  assert.equal(system.includes('never compose a quote from inferred facts or any input outside story_text'), true);
  assert.equal(system.includes('evidence is a top-level sibling of player_observation and npc_observations'), true);
  assert.equal(system.includes('Never put an evidence key inside a player or NPC object'), true);
  for (const forbidden of ['state_delta', 'choices', 'dialogue_lines', 'player_inner_thought', 'last_speaker_id', 'npcs_present', 'focal_character_id', 'csa_active', 'csa_rules', 'world_state', 'save']) assert.equal(system.includes(forbidden), true);
});
