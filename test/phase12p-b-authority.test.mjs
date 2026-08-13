import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStoryWorldProjection } from '../src/engine/csa/story-projection.js';
import { reduceObservationDomains } from '../src/engine/runtime-core/observation-reducers.js';
import { normalizeFreshExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { parseFreshNarrativeV2 } from '../src/engine/fresh-narrative-parser.js';

const master = {
  characters: [
    { character_id: 'heroine3', name: '김제나', gender: 'female' },
    { character_id: 'heroine5', name: '이메이', gender: 'female' }
  ],
  general_npcs: []
};

test('target-seated relational CSA does not require the acting NPC to be seated', () => {
  const save = {
    csa_active: ['rule'],
    csa_rules: { rule: { active: true, content: 'stand', subject_scope: 'female_employee', preset: {
      subject_scope: 'female_employee', counterparty_scope: 'company_employee', mode: 'continuous',
      execution: { kind: 'posture_relation', action: 'stand_between_knees', trigger_kind: 'target_seated_interaction', target_required: true }
    } } },
    csa_runtime_state: {},
    scene: { present_npc_ids: ['heroine3'], location_id: 'office', focal_character_id: 'heroine3' },
    npc_scene_state: { heroine3: { posture: 'standing' } },
    player_scene_state: { posture: 'sitting' }
  };
  const projection = buildStoryWorldProjection({ save, master, sceneActorIds: ['heroine3'], expectedTurn: 1 });
  assert.equal(projection.world_rules[0].resolved_facts[0].trigger_state, 'required_now');
  assert.equal(projection.scene_obligations[0].action, 'stand_between_knees');
});

test('structured relation updates close stale targets and preserve the new target', () => {
  const save = {
    edition: 'company-v1', save_schema_version: 1,
    world_state: { game_time: { day: 1, minute_of_day: 600 } },
    player_scene_state: {}, player_sexual_state: {}, npc_scene_state: {
      heroine3: { present: true }, heroine5: { present: true }
    }, npc_stats: {}, npc_emotion: {}, npc_relationship_state: {}, npc_work_state: {}, csa_attitudes: {},
    scene: { present_npc_ids: ['heroine3', 'heroine5'], location_id: 'office' },
    active_relations: [{ actor_id: 'heroine3', target_id: 'heroine5', relation_kind: 'stand_between_knees', state: 'active', started_turn: 13 }]
  };
  const story = '김제나는 이메이와의 관계를 끝내고 김태양의 무릎 사이에 선다.';
  const observation = normalizeFreshExtractObservationV2({
    extract_version: 2, outcome: 'success',
    scene_observation: { scene_id: 'office', location_id: 'office', final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], evidence: [] },
    player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3,
    mind_monitor: {}, action_target_id: 'heroine3', image_character_id: null, image_selection: null,
    csa_trigger_evaluations: [], csa_runtime_updates: [],
    relation_updates: [
      { actor_id: 'heroine3', target_id: 'heroine5', relation_kind: 'stand_between_knees', state: 'ended', quote: '김제나는 이메이와의 관계를 끝내고' },
      { actor_id: 'heroine3', target_id: 'player', relation_kind: 'stand_between_knees', state: 'started', quote: '김태양의 무릎 사이에 선다.' }
    ], turn_summary: '', warnings: []
  }, { npcIds: new Set(['heroine3', 'heroine5']), storyText: story, expectedTurn: 15 });
  const result = reduceObservationDomains({ currentSave: save, observation, parsedStory: { dialogue_lines: [] }, rawStory: story, expectedTurn: 15, master, npcIds: new Set(['heroine3', 'heroine5']), sceneBefore: { present_npc_ids: ['heroine3', 'heroine5'] }, sceneAfter: { present_npc_ids: ['heroine3', 'heroine5'] }, observedNpcIds: new Set(['heroine3', 'heroine5']) });
  assert.equal(result.nextSave.active_relations.find(item => item.target_id === 'heroine5').state, 'ended');
  assert.equal(result.nextSave.active_relations.find(item => item.target_id === 'player').state, 'active');
});

test('plain exact registered-name dialogue gets a structural fallback only', () => {
  const parsed = parseFreshNarrativeV2(`이메이: "어서 오세요."

다음 업무를 설명한다.`, { master });
  assert.equal(parsed.dialogue_lines[0].speaker_id, 'heroine5');
  assert.ok(parsed.warnings.includes('dialogue_marker_fallback_applied'));
});

test('player posture evidence is copied from top-level changed quote and advances updated_turn', () => {
  const save = {
    edition: 'company-v1', save_schema_version: 1,
    world_state: { game_time: { day: 1, minute_of_day: 600 } },
    player_scene_state: { posture: 'standing', updated_turn: 0 },
    player_sexual_state: {}, npc_scene_state: {}, npc_stats: {}, npc_emotion: {}, npc_relationship_state: {}, npc_work_state: {}, csa_attitudes: {},
    scene: { version: 1, scene_id: 'office', location_id: 'office', beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 0 }
  };
  const quote = '플레이어가 의자에 앉았다.';
  const observation = normalizeFreshExtractObservationV2({
    extract_version: 2, outcome: 'success',
    scene_observation: { scene_id: 'office', location_id: 'office', final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], evidence: [] },
    player_observation: { physical: { posture: 'sitting' } }, npc_observations: {}, events: { general: [], sexual: [] },
    evidence: { physical_change: { changed: ['player_scene_state.player.posture'], quote } }, elapsed_minutes: 3,
    mind_monitor: {}, action_target_id: null, image_character_id: null, image_selection: null,
    csa_trigger_evaluations: [], csa_runtime_updates: [], relation_updates: [], turn_summary: '', warnings: []
  }, { npcIds: new Set(), storyText: quote, expectedTurn: 16 });
  const result = reduceObservationDomains({ currentSave: save, observation, parsedStory: { dialogue_lines: [] }, rawStory: quote, expectedTurn: 16, npcIds: new Set(), sceneBefore: { present_npc_ids: [] }, sceneAfter: { present_npc_ids: [] }, observedNpcIds: new Set() });
  assert.equal(result.nextSave.player_scene_state.posture, 'sitting');
  assert.equal(result.nextSave.player_scene_state.updated_turn, 16);
});
