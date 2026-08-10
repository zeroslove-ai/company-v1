import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { reduceGameplayCommit } from '../src/engine/runtime-core/commit-reducer.js';
import { normalizeExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';

const save = JSON.parse(fs.readFileSync(new URL('../fixtures/phase-0.5/canonical-save-v1.json', import.meta.url)));
const NPCS = new Set(['npc-hayeon', 'npc-areum', 'npc-minsu']);
const baseObservation = { extract_version: 2, outcome: 'success', scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null, presence_is_final: false, remote_speaker_ids: [], evidence: [] }, player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3, mind_monitor: {}, action_target_id: null, image_character_id: null, image_selection: null, csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '', warnings: [] };
const action = { action_id: 'a', turn_id: 't', action_kind: 'player_turn', player_action: '계속 진행한다' };

test('reduceGameplayCommit is the single V2 orchestration writer', () => {
  const observation = normalizeExtractObservationV2(baseObservation, { npcIds: NPCS });
  const result = reduceGameplayCommit({ currentSave: save, observation, parsedStory: { choices: ['a', 'b', 'c', 'd'], dialogue_lines: [], player_inner_thought: '' }, rawStory: '본문', action, expectedTurn: 8, npcIds: NPCS, mapLocations: [] });
  assert.equal(result.nextSave.turn_state.committed_turn, 7);
  assert.equal(result.nextSave.turn_state.expected_turn, 9);
  assert.equal(result.nextSave.scene_state.updated_turn, 8);
  assert.equal(result.canonical_scene.updated_turn, 8);
});
test('V2 reducer keeps scene authority separate from NPC physical observation', () => {
  const observation = normalizeExtractObservationV2({ ...baseObservation, npc_observations: { 'npc-hayeon': { physical: { clothing: { uniform_top: 'removed' } } } }, evidence: { clothing: { 'npc-hayeon': { quote: '하연이 셔츠를 벗었다', character_id: 'npc-hayeon' } } } }, { npcIds: NPCS });
  const result = reduceGameplayCommit({ currentSave: save, observation, parsedStory: { choices: [], dialogue_lines: [], player_inner_thought: '' }, rawStory: '하연이 셔츠를 벗었다', action, expectedTurn: 8, npcIds: NPCS, mapLocations: [] });
  assert.equal(result.nextSave.scene_state.location_id, save.scene_state.location_id);
  assert.equal(result.nextSave.scene_state.participants.join(','), save.scene_state.participants.join(','));
});

test('final presence is reduced before domains so an observed NPC physical state is retained', () => {
  const currentSave = {
    ...structuredClone(save),
    scene: { version: 1, scene_id: 'room', location_id: 'meeting_room_5f', beat: 1, goal: null, focus_thread: null, present_npc_ids: ['npc-hayeon'], focal_character_id: 'npc-hayeon', last_speaker_id: null, updated_turn: 7 },
    scene_state: { ...save.scene_state, participants: ['player-1', 'npc-hayeon'] },
    npc_scene_state: { ...save.npc_scene_state, 'npc-areum': { clothing: { uniform_top: 'worn' } } }
  };
  const rawStory = 'npc-areum entered and removed her shirt';
  const observation = normalizeExtractObservationV2({
    ...baseObservation,
    scene_observation: {
      scene_id: 'room', location_id: 'meeting_room_5f', final_present_npc_ids: ['npc-hayeon', 'npc-areum'],
      focal_candidate_id: 'npc-areum',
      remote_speaker_ids: [], evidence: [
        { kind: 'presence', character_id: 'npc-hayeon', quote: 'npc-areum entered' },
        { kind: 'presence', character_id: 'npc-areum', quote: 'npc-areum entered' }
      ]
    },
    npc_observations: { 'npc-areum': { physical: { clothing: { uniform_top: 'removed' } } } },
    evidence: { clothing: { 'npc-areum': { quote: rawStory, character_id: 'npc-areum' } } }
  }, { npcIds: new Set(['npc-hayeon', 'npc-areum', 'npc-minsu']), storyText: rawStory });
  const result = reduceGameplayCommit({
    currentSave, observation, parsedStory: { choices: [], dialogue_lines: [] }, rawStory,
    action: { action_id: 'entered-physical', turn_id: 'turn-8', action_kind: 'player_turn' }, expectedTurn: 8,
    npcIds: new Set(['npc-hayeon', 'npc-areum', 'npc-minsu']), mapLocations: []
  });
  assert.deepEqual(result.canonical_scene.present_npc_ids, ['npc-hayeon', 'npc-areum']);
  assert.equal(result.nextSave.npc_scene_state['npc-areum'].clothing.uniform_top, 'removed');
});

test('mind monitor entries for off-scene NPCs are dropped with an explicit warning', () => {
  const observation = normalizeExtractObservationV2({ ...baseObservation, mind_monitor: { 'npc-hayeon': { surface: 'on scene', subconscious: '' }, 'npc-areum': { surface: 'off scene', subconscious: '' } } }, { npcIds: NPCS });
  const currentSave = { ...structuredClone(save), scene: { version: 1, scene_id: 'room', location_id: 'meeting_room_5f', beat: 1, goal: null, focus_thread: null, present_npc_ids: ['npc-hayeon'], focal_character_id: 'npc-hayeon', last_speaker_id: null, updated_turn: 7 }, scene_state: { ...save.scene_state, participants: ['player-1', 'npc-hayeon'] } };
  const result = reduceGameplayCommit({ currentSave, observation, parsedStory: { choices: [], dialogue_lines: [] }, rawStory: 'plain story', action, expectedTurn: 8, npcIds: NPCS, mapLocations: [] });
  assert.ok(result.mind_monitor['npc-hayeon']);
  assert.equal(result.mind_monitor['npc-areum'], undefined);
  assert.ok(result.warnings.includes('mind_monitor_off_scene_dropped:npc-areum'));
});

test('all persistent NPC domains share observed eligibility and remote speakers stay excluded', () => {
  const currentSave = {
    ...structuredClone(save),
    scene: { version: 1, scene_id: 'room', location_id: 'meeting_room_5f', beat: 1, goal: null, focus_thread: null, present_npc_ids: ['npc-hayeon'], focal_character_id: 'npc-hayeon', last_speaker_id: null, updated_turn: 7 },
    scene_state: { ...save.scene_state, participants: ['player-1', 'npc-hayeon'] },
    npc_emotion: { ...(save.npc_emotion ?? {}), 'npc-areum': { mood: 'calm' } },
    npc_relationship_state: { ...(save.npc_relationship_state ?? {}), 'npc-areum': { closeness: 'acquaintance', romance_status: 'none', current_boundary: 'professional' } },
    npc_stats: { ...(save.npc_stats ?? {}), 'npc-areum': { affinity: 10 } },
    npc_work_state: { ...(save.npc_work_state ?? {}), 'npc-areum': { task: '정리' } },
    csa_attitudes: { ...(save.csa_attitudes ?? {}), 'npc-areum': { familiarity: 1 } }
  };
  const rawStory = 'npc-areum said this from a remote office';
  const observation = normalizeExtractObservationV2({
    ...baseObservation,
    scene_observation: { ...baseObservation.scene_observation, remote_speaker_ids: ['npc-areum'] },
    npc_observations: {
      'npc-areum': {
        physical: { clothing: { uniform_top: 'removed' } },
        emotion: { mood: 'angry' },
        relationship: { closeness: 'familiar' },
        stats: { affinity_delta: 2 },
        work: { task: '회의' },
        csa_attitude: { familiarity: 2 }
      }
    }
  }, { npcIds: NPCS, storyText: rawStory });
  const result = reduceGameplayCommit({
    currentSave, observation,
    parsedStory: { choices: [], dialogue_lines: [{ speaker_id: 'npc-areum', text: rawStory }] },
    rawStory, action, expectedTurn: 8, npcIds: NPCS, mapLocations: []
  });
  assert.deepEqual(result.nextSave.npc_scene_state['npc-areum']?.clothing, currentSave.npc_scene_state['npc-areum']?.clothing);
  assert.deepEqual(result.nextSave.npc_emotion['npc-areum'], { mood: 'calm' });
  assert.deepEqual(result.nextSave.npc_relationship_state['npc-areum'], { closeness: 'acquaintance', romance_status: 'none', current_boundary: 'professional' });
  assert.deepEqual(result.nextSave.npc_stats['npc-areum'], { affinity: 10 });
  assert.deepEqual(result.nextSave.npc_work_state['npc-areum'], { task: '정리' });
  assert.deepEqual(result.nextSave.csa_attitudes['npc-areum'], { familiarity: 1 });
  assert.ok(result.warnings.includes('off_scene_npc_observation_dropped:npc-areum'));
});

test('same-quote sexual events from two NPCs remain distinct in the ledger', () => {
  const rawStory = '두 사람이 동시에 손을 움직였다.';
  const observation = normalizeExtractObservationV2({
    ...baseObservation,
    events: { general: [], sexual: [
      { actor_id: 'npc-hayeon', target_id: 'player-1', action_type: 'sexual_touch', direction: 'npc_to_player', completed: false, interrupted: false, evidence: rawStory },
      { actor_id: 'npc-areum', target_id: 'player-1', action_type: 'sexual_touch', direction: 'npc_to_player', completed: false, interrupted: false, evidence: rawStory }
    ] }
  }, { npcIds: NPCS, storyText: rawStory, expectedTurn: 8, actionId: 'multi' });
  const result = reduceGameplayCommit({ currentSave: save, observation, parsedStory: { choices: [], dialogue_lines: [] }, rawStory, action: { ...action, action_id: 'multi' }, expectedTurn: 8, npcIds: NPCS, mapLocations: [] });
  const matching = result.nextSave.sexual_event_ledger.filter(event => event.evidence === rawStory);
  assert.equal(matching.length, 2);
  assert.notEqual(matching[0].event_id, matching[1].event_id);
});

test('movement commit uses deterministic destination without Story arrival evidence', () => {
  const currentSave = {
    ...structuredClone(save),
    scene: { version: 1, scene_id: 'office', location_id: 'brand_strategy_office', beat: 1, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 1 }
  };
  const rawStory = '플레이어가 브랜드전략팀 회의실에 도착했다.';
  const observation = normalizeExtractObservationV2({
    ...baseObservation,
    scene_observation: {
      scene_id: 'brand_strategy_meeting_room', location_id: 'brand_strategy_meeting_room',
      final_present_npc_ids: [], entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null,
      presence_is_final: true, remote_speaker_ids: [],
      evidence: [{ kind: 'movement', location_id: 'brand_strategy_meeting_room', quote: rawStory }]
    }
  }, { npcIds: NPCS, storyText: rawStory });
  const result = reduceGameplayCommit({
    currentSave, observation, parsedStory: { choices: [], dialogue_lines: [] }, rawStory,
    action: { ...action, action_id: 'move-ok', player_action: '브랜드전략팀 회의실로 이동한다' }, expectedTurn: 2,
    npcIds: NPCS, mapLocations: [{ location_id: 'brand_strategy_office' }, { location_id: 'brand_strategy_meeting_room' }],
    movementContract: { transition_mode: 'movement', location_id: 'brand_strategy_office', destination_location_id: 'brand_strategy_meeting_room' }
  });
  assert.equal(result.canonical_scene.location_id, 'brand_strategy_meeting_room');
});

test('movement commit does not copy origin NPCs into destination presence or use navigation targets as presence', () => {
  const currentSave = {
    ...structuredClone(save),
    scene: { version: 1, scene_id: 'office', location_id: 'brand_strategy_office', beat: 1, goal: null, focus_thread: null, present_npc_ids: ['npc-hayeon'], focal_character_id: 'npc-hayeon', last_speaker_id: null, updated_turn: 1 }
  };
  const rawStory = 'npc-hayeon says farewell before the player arrives in the meeting room';
  const observation = normalizeExtractObservationV2({
    ...baseObservation,
    scene_observation: {
      scene_id: 'brand_strategy_meeting_room', location_id: 'brand_strategy_meeting_room',
      final_present_npc_ids: [], entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null,
      presence_is_final: true, remote_speaker_ids: [],
      evidence: [{ kind: 'movement', location_id: 'brand_strategy_meeting_room', quote: rawStory }]
    }
  }, { npcIds: NPCS, storyText: rawStory });
  const result = reduceGameplayCommit({
    currentSave, observation, parsedStory: { choices: [], dialogue_lines: [] }, rawStory,
    action: { ...action, action_id: 'move-origin-speaker', player_action: 'move to the meeting room' }, expectedTurn: 2,
    npcIds: NPCS, mapLocations: [{ location_id: 'brand_strategy_office' }, { location_id: 'brand_strategy_meeting_room' }],
    movementContract: { transition_mode: 'movement', location_id: 'brand_strategy_office', destination_location_id: 'brand_strategy_meeting_room', destination_npc_ids: ['npc-hayeon'] }
  });
  assert.equal(result.canonical_scene.location_id, 'brand_strategy_meeting_room');
  assert.deepEqual(result.canonical_scene.present_npc_ids, []);
});

test('movement ignores null or hallucinated Extract destination', () => {
  const currentSave = {
    ...structuredClone(save),
    scene: { version: 1, scene_id: 'office', location_id: 'brand_strategy_office', beat: 1, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 1 }
  };
  const makeObservation = (locationId, evidenceLocation = locationId) => normalizeExtractObservationV2({
    ...baseObservation,
    scene_observation: {
      scene_id: null, location_id: locationId, final_present_npc_ids: [], entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null,
      presence_is_final: true, remote_speaker_ids: [], evidence: locationId
        ? [{ kind: 'movement', location_id: evidenceLocation, quote: 'movement evidence' }]
        : []
    }
  }, { npcIds: NPCS, storyText: 'movement evidence' });
  const input = { currentSave, parsedStory: { choices: [], dialogue_lines: [] }, rawStory: 'movement evidence', action, expectedTurn: 2,
    npcIds: NPCS, mapLocations: [{ location_id: 'brand_strategy_office' }, { location_id: 'brand_strategy_meeting_room' }],
    movementContract: { transition_mode: 'movement', location_id: 'brand_strategy_office', destination_location_id: 'brand_strategy_meeting_room' } };
  assert.equal(reduceGameplayCommit({ ...input, observation: makeObservation(null) }).canonical_scene.location_id, 'brand_strategy_meeting_room');
  assert.equal(reduceGameplayCommit({ ...input, observation: makeObservation('other_room', 'other_room') }).canonical_scene.location_id, 'brand_strategy_meeting_room');
});
