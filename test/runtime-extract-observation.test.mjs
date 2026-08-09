import test from 'node:test';
import assert from 'node:assert/strict';
import { GameCoreError } from '../src/engine/errors.js';
import { assertScenePresenceCoverage, buildDegradedExtractObservation, normalizeExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';

const NPCS = new Set(['heroine1', 'heroine2']);
const STORY = 'scene-exit-evidence work-happened';
const scene = (final = null) => ({ scene_id: null, location_id: null, final_present_npc_ids: final, entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null, presence_is_final: final !== null, remote_speaker_ids: [], evidence: final?.length === 0 ? [{ kind: 'exit', character_id: 'heroine1', quote: 'scene-exit-evidence' }] : [] });
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
  assert.equal(empty.scene_observation.presence_is_final, true);
});
test('presence flag cannot contradict final snapshot', () => {
  assert.throws(() => normalizeExtractObservationV2(valid({ scene_observation: { ...scene(), presence_is_final: true } }), { npcIds: NPCS }), GameCoreError);
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
    { kind: 'entrance', character_id: 'heroine1', quote: 'entrance quote' },
    { kind: 'exit', character_id: 'heroine1', quote: 'exit quote' },
    { kind: 'movement', location_id: 'room-a', quote: 'movement quote' },
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

test('scene presence coverage is enforced at Commit authority, including final removals and patches', () => {
  const currentScene = { present_npc_ids: ['heroine1', 'heroine2'] };
  const observation = normalizeExtractObservationV2(valid({ scene_observation: {
    ...scene([]),
    evidence: [
      { kind: 'exit', character_id: 'heroine1', quote: 'scene-exit-evidence' },
      { kind: 'exit', character_id: 'heroine2', quote: 'scene-exit-evidence' }
    ]
  } }), { npcIds: NPCS, storyText: STORY });
  assert.equal(assertScenePresenceCoverage(observation, { currentScene }), true);
  const missing = structuredClone(observation);
  missing.scene_observation.evidence.pop();
  assert.throws(() => assertScenePresenceCoverage(missing, { currentScene }), error => error.code === 'SCENE_PRESENCE_EVIDENCE_MISSING');
  const empty = normalizeExtractObservationV2(valid({ scene_observation: scene([]) }), { npcIds: NPCS, storyText: STORY });
  assert.equal(assertScenePresenceCoverage(empty, { currentScene: { present_npc_ids: [] } }), true);
  const patch = normalizeExtractObservationV2(valid({ scene_observation: { ...scene(), entered_npc_ids: ['heroine2'], exited_npc_ids: ['heroine1'], evidence: [
    { kind: 'entrance', character_id: 'heroine2', quote: 'scene-exit-evidence' },
    { kind: 'exit', character_id: 'heroine1', quote: 'work-happened' }
  ] } }), { npcIds: NPCS, storyText: STORY });
  assert.equal(assertScenePresenceCoverage(patch, { currentScene: { present_npc_ids: ['heroine1'] } }), true);
  const conflict = structuredClone(patch);
  conflict.scene_observation.entered_npc_ids = ['heroine1'];
  conflict.scene_observation.exited_npc_ids = ['heroine1'];
  assert.throws(() => assertScenePresenceCoverage(conflict, { currentScene: { present_npc_ids: [] } }), error => error.code === 'SCENE_PRESENCE_EVIDENCE_CONFLICT');
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
