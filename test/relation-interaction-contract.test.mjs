import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStoryWorldProjection } from '../src/engine/csa/story-projection.js';
import { reduceCsaCommitState } from '../src/engine/runtime-core/csa-commit-reducer.js';

const master = {
  characters: [
    { character_id: 'heroine3', name: '김제나', gender: 'female' },
    { character_id: 'heroine5', name: '김유진', gender: 'female' },
    { character_id: 'heroine6', name: '이수아', gender: 'female' }
  ],
  general_npcs: []
};

function relationRule() {
  return {
    id: 'csa_2', active: true, content: 'stand between knees',
    preset: {
      template_id: 'stand_between_recipient_knees',
      subject_scope: 'female_employee',
      counterparty_scope: 'male_employee',
      execution: { kind: 'posture_relation', action: 'stand_between_knees', trigger_kind: 'target_seated_interaction', target_required: true }
    }
  };
}

function switchSave(playerAction = '') {
  return {
    csa_active: ['csa_2'],
    csa_rules: { csa_2: relationRule() },
    csa_runtime_state: {},
    player: { name: 'Player', sex: 'male', gender: 'male' },
    player_scene_state: { posture: 'sitting' },
    scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: ['heroine3', 'heroine5'], focal_character_id: 'heroine5', last_speaker_id: null, updated_turn: 13 },
    npc_scene_state: {
      heroine3: { posture: 'standing' },
      heroine5: { posture: 'standing', position_label: '팀장의 벌어진 무릎 사이' }
    },
    active_relations: [{ actor_id: 'heroine5', target_id: 'player', relation_kind: 'stand_between_knees', source_rule_id: 'csa_2', state: 'active', started_turn: 12 }],
    playerAction
  };
}

function factsFor(save, sceneActorIds = ['heroine3', 'heroine5']) {
  return buildStoryWorldProjection({
    save,
    master,
    sceneActorIds,
    expectedTurn: 13,
    playerAction: save.playerAction ?? ''
  }).world_rules[0].resolved_facts;
}

test('Korean unique given-name switch makes heroine3 the only required actor', () => {
  const facts = factsFor(switchSave('이제 제나씨 보고를 들어보지. 자 내 무릎 사이로 와.'));
  assert.deepEqual(facts.map(fact => fact.resolved_target_ids), [['player'], []]);
  assert.deepEqual(facts.map(fact => fact.trigger_state), ['required_now', 'conditional']);
});

test('Korean full-name switch also blocks previous focal heroine5 fallback', () => {
  const facts = factsFor(switchSave('김제나씨, 내 무릎 사이로 와.'));
  assert.deepEqual(facts.map(fact => fact.resolved_target_ids), [['player'], []]);
  assert.deepEqual(facts.map(fact => fact.trigger_state), ['required_now', 'conditional']);
});

test('duplicate Korean given names remain unresolved instead of selecting an arbitrary actor', () => {
  const collisionMaster = {
    characters: [
      { character_id: 'heroine3', name: '김제나', gender: 'female' },
      { character_id: 'heroine6', name: '박제나', gender: 'female' }
    ],
    general_npcs: []
  };
  const save = switchSave('제나씨, 내 무릎 사이로 와.');
  save.scene = { present_npc_ids: ['heroine3', 'heroine6'], focal_character_id: null, last_speaker_id: null };
  save.active_relations = [];
  const facts = buildStoryWorldProjection({ save, master: collisionMaster, sceneActorIds: ['heroine3', 'heroine6'], expectedTurn: 13, playerAction: save.playerAction }).world_rules[0].resolved_facts;
  assert.deepEqual(facts.map(fact => fact.resolved_target_ids), [[], []]);
  assert.deepEqual(facts.map(fact => fact.trigger_state), ['conditional', 'conditional']);
});

test('unique Engine switch ends same-rule target relation on the old actor and clears stale presentation', () => {
  const currentSave = {
    active_relations: [{ actor_id: 'heroine5', target_id: 'player', relation_kind: 'stand_between_knees', source_rule_id: 'csa_2', state: 'active', started_turn: 12 }],
    npc_scene_state: { heroine5: { posture: 'standing', position_label: '팀장의 벌어진 무릎 사이' } }
  };
  const result = reduceCsaCommitState({
    currentSave,
    nextSave: structuredClone(currentSave),
    observation: { csa_runtime_updates: [] },
    canonicalScene: { present_npc_ids: ['heroine3', 'heroine5'] },
    action: { action_kind: 'player_turn' },
    expectedTurn: 13,
    engineEnactments: [{ authority: 'engine', source_rule_id: 'csa_2', actor_id: 'heroine3', execution_kind: 'behavior_execution', action: 'stand_between_knees', target_ids: ['player'], canonical_text: '김제나는 플레이어의 무릎 사이에 섰다.' }]
  });
  assert.equal(result.nextSave.active_relations.find(item => item.actor_id === 'heroine5')?.state, 'ended');
  assert.equal(result.nextSave.active_relations.find(item => item.actor_id === 'heroine3' && item.target_id === 'player')?.state, 'active');
  assert.equal(result.nextSave.npc_scene_state.heroine5.position_label, null);
});

test('multiple authoritative Engine actors do not arbitrarily supersede a same-rule target relation', () => {
  const currentSave = {
    active_relations: [{ actor_id: 'heroine5', target_id: 'player', relation_kind: 'stand_between_knees', source_rule_id: 'csa_2', state: 'active', started_turn: 12 }],
    npc_scene_state: { heroine5: { posture: 'standing', position_label: '팀장의 벌어진 무릎 사이' } }
  };
  const enactment = actor_id => ({ authority: 'engine', source_rule_id: 'csa_2', actor_id, execution_kind: 'behavior_execution', action: 'stand_between_knees', target_ids: ['player'] });
  const result = reduceCsaCommitState({
    currentSave,
    nextSave: structuredClone(currentSave),
    observation: { csa_runtime_updates: [] },
    canonicalScene: { present_npc_ids: ['heroine3', 'heroine5', 'heroine6'] },
    action: { action_kind: 'player_turn' },
    expectedTurn: 13,
    engineEnactments: [enactment('heroine3'), enactment('heroine6')]
  });
  assert.equal(result.nextSave.active_relations.find(item => item.actor_id === 'heroine5')?.state, 'active');
  assert.equal(result.nextSave.npc_scene_state.heroine5.position_label, '팀장의 벌어진 무릎 사이');
});
