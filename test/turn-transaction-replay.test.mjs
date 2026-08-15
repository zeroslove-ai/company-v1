import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { reduceGameplayCommit } from '../src/engine/runtime-core/commit-reducer.js';
import { normalizeExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { buildStoryContextProjection } from '../src/engine/story-prompt.js';

const save = JSON.parse(fs.readFileSync(new URL('../fixtures/phase-0.5/canonical-save-v1.json', import.meta.url)));
if (!save.scene) {
  const participants = Array.isArray(save.scene_state?.participants) ? save.scene_state.participants : [];
  save.scene = {
    version: 1,
    scene_id: save.scene_state?.scene_id ?? null,
    location_id: save.scene_state?.location_id ?? null,
    beat: Number.isInteger(save.scene_state?.beat) ? save.scene_state.beat : 0,
    goal: save.scene_state?.scene_goal ?? null,
    focus_thread: save.scene_state?.focus_thread ?? null,
    present_npc_ids: participants.filter(id => typeof id === 'string' && !/^player(?:[-_]|$)/i.test(id)),
    focal_character_id: save.focal_character_id ?? null,
    last_speaker_id: save.last_speaker_id ?? null,
    updated_turn: Number.isInteger(save.scene_state?.updated_turn) ? save.scene_state.updated_turn : 0
  };
}
const NPCS = new Set(['npc-hayeon', 'npc-areum', 'npc-minsu']);
const baseObservation = { extract_version: 2, outcome: 'success', scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null, presence_is_final: false, remote_speaker_ids: [], evidence: [] }, player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3, mind_monitor: {}, action_target_id: null, image_character_id: null, image_selection: null, csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '', warnings: [] };
const action = { action_id: 'a', turn_id: 't', action_kind: 'player_turn', player_action: '계속 진행한다' };

test('open observations persist only through Commit and remain idempotent', () => {
  const quote = 'Hayeon accepted the apology but remained disappointed.';
  const observation = normalizeExtractObservationV2({
    ...baseObservation,
    open_facts: [{ subject_id: 'npc-hayeon', object_id: 'player', fact_text: quote, story_quote: quote }]
  }, { npcIds: NPCS, storyText: quote, expectedTurn: 8, actionId: 'open-fact' });
  const action = { action_id: 'open-fact', turn_id: 'turn-8', action_kind: 'player_turn' };
  const first = reduceGameplayCommit({ currentSave: save, observation, parsedStory: { choices: ['a', 'b', 'c', 'd'], dialogue_lines: [] }, rawStory: quote, action, expectedTurn: 8, npcIds: NPCS, mapLocations: [] });
  assert.equal(first.nextSave.open_observations.length, 1);
  assert.equal(first.nextSave.open_observations[0].story_quote, quote);
  const second = reduceGameplayCommit({ currentSave: first.nextSave, observation, parsedStory: { choices: ['a', 'b', 'c', 'd'], dialogue_lines: [] }, rawStory: quote, action, expectedTurn: 8, npcIds: NPCS, mapLocations: [] });
  assert.equal(second.nextSave.open_observations.length, 1);
});

test('committed open observations are exposed to later Story context with provenance', () => {
  const facts = [{ fact_id: 'fact-1', action_id: 'open-fact', turn_number: 8, subject_id: 'npc-hayeon', object_id: 'player', fact_text: 'Hayeon accepted the apology but remained disappointed.', story_quote: 'Hayeon accepted the apology but remained disappointed.' }];
  const projection = buildStoryContextProjection({ game: { id: 'game-1' }, save: { data: { ...structuredClone(save), open_observations: facts } }, recent_turns: [] }, [], { edition: {}, catalogs: {} });
  assert.deepEqual(projection.open_observations, facts);
});

test('Story memory keeps the latest three turns raw and projects older turns as ordered summaries only', () => {
  const turns = [1, 2, 3, 4, 5].map(turn_number => ({
    turn_number,
    player_action: `action-${turn_number}`,
    story_text: `raw-story-${turn_number}`,
    parsed_blocks: { blocks: [`block-${turn_number}`] },
    choices: [`choice-${turn_number}`],
    turn_summary: `summary-${turn_number}`
  }));
  const projection = buildStoryContextProjection({ game: { id: 'game-1' }, save: { data: structuredClone(save) }, recent_turns: turns }, [], { edition: {}, catalogs: {} });
  assert.deepEqual(projection.recent_turns.map(turn => turn.turn), [3, 4, 5]);
  assert.deepEqual(projection.turn_summary_memory, [
    { turn: 1, turn_summary: 'summary-1' },
    { turn: 2, turn_summary: 'summary-2' }
  ]);
  assert.equal('story_text' in projection.turn_summary_memory[0], false);
  assert.equal('parsed_blocks' in projection.turn_summary_memory[0], false);
  assert.equal('story_summary' in projection, false);
});

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

test('commit applies one authoritative location and generic observed presence', () => {
  const currentSave = {
    ...structuredClone(save),
    scene: { version: 1, scene_id: 'office', location_id: 'brand_strategy_office', beat: 1, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 1 }
  };
  const rawStory = '플레이어가 회의실에 도착했다.';
  const observation = normalizeExtractObservationV2({
    ...baseObservation,
    scene_observation: {
      scene_id: null, location_id: null, final_present_npc_ids: [], focal_candidate_id: null,
      remote_speaker_ids: [], evidence: []
    }
  }, { npcIds: NPCS, storyText: rawStory });
  const result = reduceGameplayCommit({
    currentSave, observation, parsedStory: { choices: [], dialogue_lines: [] }, rawStory,
    action: { ...action, action_id: 'move-ok', player_action: '브랜드전략팀 회의실로 이동한다' }, expectedTurn: 2,
    npcIds: NPCS, mapLocations: [{ location_id: 'brand_strategy_office' }, { location_id: 'brand_strategy_meeting_room' }],
    authoritativeLocationId: 'brand_strategy_meeting_room'
  });
  assert.equal(result.canonical_scene.location_id, 'brand_strategy_meeting_room');
  assert.deepEqual(result.canonical_scene.present_npc_ids, []);
});
