import test from 'node:test';
import assert from 'node:assert/strict';
import { GameCoreError } from '../src/engine/errors.js';
import { buildDegradedExtractObservation, normalizeExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';

const NPCS = new Set(['heroine1', 'heroine2']);
const scene = (final = null) => ({ scene_id: null, location_id: null, final_present_npc_ids: final, entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null, presence_is_final: final !== null, remote_speaker_ids: [], evidence: final?.length === 0 ? [{ kind: 'exit', character_id: 'heroine1', quote: '퇴장했다' }] : [] });
const valid = (overrides = {}) => ({
  extract_version: 2, outcome: 'success', scene_observation: scene(), player_observation: {}, npc_observations: {},
  events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3, mind_monitor: {}, action_target_id: null,
  image_character_id: null, image_selection: null, csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '', warnings: [], ...overrides
});

test('V2 observation normalizes the complete contract without mutating input', () => {
  const input = valid({ scene_observation: scene([]), npc_observations: { heroine1: { physical: { clothing: { uniform_top: 'removed' } } } } });
  const before = structuredClone(input);
  const result = normalizeExtractObservationV2(input, { npcIds: NPCS });
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
  const empty = normalizeExtractObservationV2(valid({ scene_observation: scene([]) }), { npcIds: NPCS });
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
  const result = normalizeExtractObservationV2(valid({ mind_monitor: { heroine1: { surface: '표면', subconscious: '잠재' } } }), { npcIds: NPCS });
  assert.deepEqual(result.mind_monitor.heroine1, { surface: '표면', subconscious: '잠재' });
  assert.throws(() => normalizeExtractObservationV2(valid({ mind_monitor: { heroine1: { body: 'x' } } }), { npcIds: NPCS }), GameCoreError);
});
test('sexual and general events retain evidence but not derived counters', () => {
  const result = normalizeExtractObservationV2(valid({ events: { general: [{ actor_id: 'heroine1', target_id: 'player-1', type: 'work', evidence: '행동' }], sexual: [] } }), { npcIds: NPCS });
  assert.equal(result.events.general[0].evidence, '행동');
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
