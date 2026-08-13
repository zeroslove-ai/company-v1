import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';
import { buildExtractPrompt } from '../src/engine/extract-prompt.js';
import { buildStoryWorldProjection, isSeatedState } from '../src/engine/csa/story-projection.js';
import { matchesCsaSubjectScope } from '../src/engine/csa/authority-policy.js';
import { canonicalCompanyPlayerProfile } from '../src/engine/player-setup.js';
import { normalizeCompanyCsaCatalog } from '../src/engine/csa/catalog.js';
import { reduceCsaCommitState } from '../src/engine/runtime-core/csa-commit-reducer.js';
import { normalizeFreshExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { reduceObservationDomains } from '../src/engine/runtime-core/observation-reducers.js';

const catalog = normalizeCompanyCsaCatalog(JSON.parse(fs.readFileSync('content/csa_presets.json', 'utf8')));
const master = {
  characters: [
    { character_id: 'heroine3', name: 'Jena', gender: 'female' },
    { character_id: 'heroine5', name: 'Imei', gender: 'female' }
  ],
  general_npcs: [
    { npc_id: 'male1', name: 'Male One', sex: 'male' },
    { npc_id: 'male2', name: 'Male Two', sex: 'male' }
  ]
};

function relationRule(action, triggerKind = 'target_seated_interaction', counterpartyScope = 'male_employee') {
  return {
    id: 'csa_2', active: true, content: action,
    preset: {
      template_id: action, subject_scope: 'female_employee', counterparty_scope: counterpartyScope,
      execution: { kind: 'posture_relation', action, trigger_kind: triggerKind, target_required: true }
    }
  };
}

function projectionSave(extra = {}) {
  return {
    csa_active: ['csa_2'],
    csa_rules: { csa_2: relationRule('stand_between_knees') },
    csa_runtime_state: {},
    player: { name: 'Player', position_id: 'executive' },
    player_scene_state: { posture: 'sitting' },
    scene: { present_npc_ids: ['heroine3'], focal_character_id: null, last_speaker_id: null },
    npc_scene_state: { heroine3: { posture: 'standing' } },
    ...extra
  };
}

test('Company canonical player is a deterministic male_employee counterparty, including legacy hydration contract', async () => {
  const player = canonicalCompanyPlayerProfile({ id: 'player', player: true, penis_length_cm: 13 });
  assert.equal(player.sex, 'male');
  assert.equal(player.gender, 'male');
  assert.equal(matchesCsaSubjectScope(player, 'male_employee'), true);
  const { hydrateGameplayState } = await import('../src/engine/gameplay-state.js');
  assert.deepEqual(hydrateGameplayState({ edition: 'company-v1', save_schema_version: 1, player: { name: 'legacy' } }).player, { name: 'legacy', sex: 'male', gender: 'male' });
});

test('player is the resolved csa_2 target and stale position_label cannot make an actor seated', () => {
  const projection = buildStoryWorldProjection({ save: projectionSave({ scene: { present_npc_ids: ['heroine3'], focal_character_id: 'heroine3', last_speaker_id: null }, npc_scene_state: {
    heroine3: { posture: 'standing' },
    heroine5: { posture: 'standing', position_label: '팀장의 벌어진 무릎 사이' }
  } }), master, sceneActorIds: ['heroine3'], expectedTurn: 15 });
  const fact = projection.world_rules[0].resolved_facts[0];
  assert.deepEqual(fact.eligible_target_ids, ['player']);
  assert.equal(fact.trigger_state, 'required_now');
  assert.equal(isSeatedState({ posture: 'standing', position_label: '팀장의 벌어진 무릎 사이' }), false);
  assert.equal(isSeatedState({ posture: 'unknown', position_label: '무릎 사이' }), false);
  assert.equal(isSeatedState({ posture: 'sitting', position_label: '무릎 사이' }), true);
});

test('unresolved plural eligible targets remain conditional; a resolved seated target is required', () => {
  const base = projectionSave({
    scene: { present_npc_ids: ['heroine3', 'male1', 'male2'], focal_character_id: null, last_speaker_id: null },
    npc_scene_state: { heroine3: { posture: 'standing' }, male1: { posture: 'sitting' }, male2: { posture: 'sitting' } }
  });
  const unresolved = buildStoryWorldProjection({ save: base, master, sceneActorIds: ['heroine3', 'male1', 'male2'], expectedTurn: 15 });
  assert.equal(unresolved.world_rules[0].resolved_facts[0].trigger_state, 'conditional');
  const resolved = buildStoryWorldProjection({ save: { ...base, scene: { ...base.scene, focal_character_id: 'heroine3' } }, master, sceneActorIds: ['heroine3', 'male1', 'male2'], expectedTurn: 15 });
  assert.equal(resolved.world_rules[0].resolved_facts[0].trigger_state, 'required_now');
  assert.deepEqual(resolved.world_rules[0].resolved_facts[0].resolved_target_ids, ['player']);
});

test('interaction pair authority is actor-specific and never inferred from a unique male candidate', () => {
  const scene = { present_npc_ids: ['heroine3', 'heroine5'], focal_character_id: null, last_speaker_id: null };
  const npcState = { heroine3: { posture: 'standing' }, heroine5: { posture: 'standing' } };
  const make = (extra = {}) => buildStoryWorldProjection({
    save: projectionSave({ scene, npc_scene_state: npcState, ...extra }),
    master,
    sceneActorIds: ['heroine3', 'heroine5'],
    expectedTurn: 15,
    playerAction: extra.playerAction ?? ''
  }).world_rules[0].resolved_facts;

  const noAuthority = make();
  assert.deepEqual(noAuthority.map(fact => fact.resolved_target_ids), [[], []]);
  assert.deepEqual(noAuthority.map(fact => fact.trigger_state), ['conditional', 'conditional']);

  const explicitActor = make({ playerAction: 'Jena, come between my knees.' });
  assert.deepEqual(explicitActor[0].resolved_target_ids, ['player']);
  assert.equal(explicitActor[0].trigger_state, 'required_now');
  assert.deepEqual(explicitActor[1].resolved_target_ids, []);
  assert.equal(explicitActor[1].trigger_state, 'conditional');

  const focalActor = make({ scene: { ...scene, focal_character_id: 'heroine3' } });
  assert.deepEqual(focalActor.map(fact => fact.resolved_target_ids), [['player'], []]);
  assert.deepEqual(focalActor.map(fact => fact.trigger_state), ['required_now', 'conditional']);

  const activeRelation = make({ active_relations: [{ actor_id: 'heroine5', target_id: 'player', relation_kind: 'stand_between_knees', state: 'active' }] });
  assert.deepEqual(activeRelation.map(fact => fact.resolved_target_ids), [[], ['player']]);
  assert.deepEqual(activeRelation.map(fact => fact.trigger_state), ['conditional', 'required_now']);
});

test('preset trigger matrix uses structural meanings consistent with each label', () => {
  const expected = {
    sit_on_recipient_lap: 'target_seated_interaction',
    stand_between_recipient_knees: 'target_seated_interaction',
    press_body_against_recipient: 'scene_interaction',
    embrace_recipient_from_behind: 'close_interaction',
    keep_hand_on_recipient_inner_thigh: 'both_seated_interaction',
    wrap_leg_around_recipient: 'both_seated_interaction',
    maintain_thigh_contact: 'both_seated_interaction',
    whisper_against_recipient_ear: 'close_interaction',
    interlace_fingers_with_recipient: 'close_interaction'
  };
  for (const [id, trigger] of Object.entries(expected)) assert.equal(catalog.items.find(item => item.id === id)?.execution?.trigger_kind, trigger, id);
  const item = catalog.items.find(entry => entry.id === 'maintain_thigh_contact');
  const rule = { id: 'thigh', active: true, content: item.content_template, preset: { ...item, template_id: item.id, subject_scope: 'female_employee', counterparty_scope: 'male_employee', execution: item.execution } };
  const conditional = buildStoryWorldProjection({ save: { ...projectionSave(), csa_active: ['thigh'], csa_rules: { thigh: rule }, npc_scene_state: { heroine3: { posture: 'standing' } } }, master, sceneActorIds: ['heroine3'], expectedTurn: 15 });
  assert.equal(conditional.world_rules[0].resolved_facts[0].trigger_state, 'conditional');
});

test('Engine mandatory relation with one target writes active_relations and supersedes stale actor relation', () => {
  const currentSave = { active_relations: [{ actor_id: 'heroine3', target_id: 'male1', relation_kind: 'stand_between_knees', state: 'active', started_turn: 12 }] };
  const result = reduceCsaCommitState({
    currentSave,
    nextSave: structuredClone(currentSave),
    observation: { csa_runtime_updates: [] },
    canonicalScene: { present_npc_ids: ['heroine3'] },
    action: { action_kind: 'player_turn' },
    expectedTurn: 13,
    engineEnactments: [{ authority: 'engine', source_rule_id: 'csa_2', actor_id: 'heroine3', execution_kind: 'behavior_execution', action: 'stand_between_knees', target_ids: ['player'], canonical_text: 'Jena stands between the player knees.' }]
  });
  assert.equal(result.nextSave.active_relations.find(item => item.actor_id === 'heroine3' && item.target_id === 'player')?.state, 'active');
  assert.equal(result.nextSave.active_relations.find(item => item.actor_id === 'heroine3' && item.target_id === 'male1')?.state, 'ended');
  assert.equal(result.nextSave.active_relations.find(item => item.actor_id === 'heroine3' && item.target_id === 'player')?.source, 'engine');
});

test('Engine relation with unresolved plural targets never writes a fake specific relation', () => {
  const result = reduceCsaCommitState({
    currentSave: {}, nextSave: {}, observation: { csa_runtime_updates: [] }, canonicalScene: { present_npc_ids: ['heroine3'] },
    action: { action_kind: 'player_turn' }, expectedTurn: 13,
    engineEnactments: [{ authority: 'engine', source_rule_id: 'csa_2', actor_id: 'heroine3', execution_kind: 'behavior_execution', action: 'stand_between_knees', target_ids: [], counterparty_candidate_ids: ['male1', 'male2'] }]
  });
  assert.equal((result.nextSave.active_relations ?? []).length, 0);
  assert.ok(result.warnings.some(warning => warning.startsWith('engine_relation_target_unresolved:')));
});

test('Turn 13 to 15 fixture closes heroine5 and makes heroine3 the current relation authority', () => {
  const save = {
    edition: 'company-v1', save_schema_version: 1, world_state: { game_time: { day: 1, minute_of_day: 780 } },
    player: { name: 'Player' }, player_scene_state: {}, player_sexual_state: {}, npc_scene_state: {
      heroine3: { present: true }, heroine5: { present: true, position_label: '팀장의 벌어진 무릎 사이' }
    }, scene: { present_npc_ids: ['heroine3', 'heroine5'], location_id: 'office' }, active_relations: [
      { actor_id: 'heroine5', target_id: 'player', relation_kind: 'stand_between_knees', state: 'active', started_turn: 12 }
    ]
  };
  const story = 'heroine5 relation ended. heroine3 relation started.';
  const observation = normalizeFreshExtractObservationV2({
    extract_version: 2, outcome: 'success', scene_observation: { scene_id: 'office', location_id: 'office', final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], evidence: [] },
    player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 1,
    mind_monitor: {}, action_target_id: 'heroine3', image_character_id: null, image_selection: null, csa_trigger_evaluations: [], csa_runtime_updates: [],
    relation_updates: [
      { actor_id: 'heroine5', target_id: 'player', relation_kind: 'stand_between_knees', state: 'ended', quote: 'heroine5 relation ended.' },
      { actor_id: 'heroine3', target_id: 'player', relation_kind: 'stand_between_knees', state: 'started', quote: 'heroine3 relation started.' }
    ], turn_summary: '', warnings: []
  }, { npcIds: new Set(['heroine3', 'heroine5']), storyText: story, expectedTurn: 13 });
  const reduced = reduceObservationDomains({ currentSave: save, observation, parsedStory: { dialogue_lines: [] }, rawStory: story, expectedTurn: 13, master, npcIds: new Set(['heroine3', 'heroine5']), sceneBefore: { present_npc_ids: ['heroine3', 'heroine5'] }, sceneAfter: { present_npc_ids: ['heroine3', 'heroine5'] }, observedNpcIds: new Set(['heroine3', 'heroine5']) });
  assert.equal(reduced.nextSave.active_relations.find(item => item.actor_id === 'heroine5')?.state, 'ended');
  assert.equal(reduced.nextSave.active_relations.find(item => item.actor_id === 'heroine3')?.state, 'active');
  assert.equal(reduced.nextSave.npc_scene_state.heroine5.position_label, null);
  const projection = buildStoryWorldProjection({ save: { ...projectionSave(), scene: save.scene, npc_scene_state: reduced.nextSave.npc_scene_state, active_relations: reduced.nextSave.active_relations }, master, sceneActorIds: ['heroine3', 'heroine5'], expectedTurn: 15 });
  assert.deepEqual(projection.world_rules[0].resolved_facts[0].eligible_target_ids, ['player']);
});

test('unknown Extract relation kind is fail-open dropped with a warning', () => {
  const story = 'an untrusted relation sentence.';
  const normalized = normalizeFreshExtractObservationV2({
    extract_version: 2, outcome: 'success', scene_observation: { scene_id: 'office', location_id: 'office', final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], evidence: [] },
    player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 1,
    mind_monitor: {}, action_target_id: null, image_character_id: null, image_selection: null, csa_trigger_evaluations: [], csa_runtime_updates: [],
    relation_updates: [{ actor_id: 'heroine3', target_id: 'player', relation_kind: 'standing_between_knees', state: 'started', quote: story }], turn_summary: '', warnings: []
  }, { npcIds: new Set(['heroine3']), storyText: story, expectedTurn: 15 });
  assert.deepEqual(normalized.relation_updates, []);
  assert.ok(normalized.warnings.some(warning => warning.includes('relation_updates')));
});

test('prompt contracts reinforce per-target Mind Monitor completeness and explicit physical continuity', () => {
  const extract = buildExtractPrompt({ context: {}, storyText: 'x', parsedStory: {}, expectedTurn: 15, edition: { characters: { characters: {} }, map: { locations: [] } }, npcIds: new Set(['heroine3']), mindMonitorTargets: ['heroine3'] });
  assert.match(extract[0].content, /one entry per target/);
  assert.match(extract[0].content, /surface and subconscious/);
  assert.match(extract[0].content, /do not omit image_selection/);
  assert.match(extract[0].content, /canonical tokens "sitting" or "standing"/);
  const story = buildStoryPrompt({ edition: { editionId: 'company-v1', characters: { characters: { heroine3: { character_id: 'heroine3', name: 'Jena', gender: 'female' } } }, generalNpcs: { profiles: {} }, map: { locations: [] } }, context: { save: { data: { player: { name: 'Player' }, scene: { version: 1, scene_id: 'office', beat: 0, updated_turn: 0, present_npc_ids: ['heroine3'], focal_character_id: null, last_speaker_id: null }, active_relations: [] } } }, playerAction: 'observe', expectedTurn: 15, npcIds: new Set(['heroine3']), sceneCastContract: { present_npc_ids: ['heroine3'], entering_npc_ids: [], remote_npc_ids: [], player_dialogue: null } });
  assert.match(story[0].content, /euphemize away erection/);
  assert.match(story[0].content, /identity of an acted body part/);
});
