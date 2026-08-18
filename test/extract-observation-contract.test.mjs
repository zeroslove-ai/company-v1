import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFreshExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { normalizePersistedExtractObservation } from '../src/engine/runtime-core/persisted-extract-observation.js';
import { buildExtractPrompt } from '../src/engine/extract-prompt.js';

const NPCS = new Set(['heroine1', 'heroine2']);
const base = { extract_version: 2, outcome: 'success', scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], presence_is_final: false, focal_candidate_id: null, remote_speaker_ids: [], evidence: [] }, player_observation: { physical: null, sexual: null }, npc_observations: {}, evidence: {}, elapsed_minutes: 3, mind_monitor: {}, turn_summary: '대화가 이어졌다.', warnings: [] };

test('fresh Extract accepts only narrow scene, physical, sexual and summary observation', () => {
  const freshBase = structuredClone(base);
  freshBase.scene_observation = { location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null, remote_speaker_ids: [], evidence: [] };
  const result = normalizeFreshExtractObservationV2({ ...freshBase, player_observation: { physical: { position_label: 'standing' }, sexual: { arousal_delta: 1 } } }, { npcIds: NPCS, storyText: '' });
  assert.equal(result.player_observation.physical.position_label, 'standing');
  assert.equal(result.player_observation.sexual.arousal_delta, 1);
  assert.throws(() => normalizeFreshExtractObservationV2({ ...freshBase, player_observation: { physical: { posture: 'standing' } } }, { npcIds: NPCS, storyText: '' }), /Unknown observation field/);
});

test('fresh current scene evidence round-trips through the persisted Commit reader', () => {
  const quote = '오전 11시 54분, 브랜드전략팀 사무실.';
  const fresh = normalizeFreshExtractObservationV2({
    extract_version: 2,
    outcome: 'success',
    scene_observation: {
      location_id: 'brand_strategy_office',
      final_present_npc_ids: null,
      entered_npc_ids: [],
      exited_npc_ids: [],
      focal_candidate_id: null,
      remote_speaker_ids: [],
      evidence: [{ kind: 'scene', location_id: 'brand_strategy_office', quote }]
    },
    player_observation: { physical: null, sexual: null },
    npc_observations: {}, evidence: {}, elapsed_minutes: 3,
    mind_monitor: {}, turn_summary: '업무 조율이 이어졌다.', warnings: []
  }, { npcIds: NPCS, storyText: `Story\n${quote}\n끝` });
  const persisted = normalizePersistedExtractObservation(fresh, { npcIds: NPCS, storyText: `Story\n${quote}\n끝`, expectedTurn: 6 });
  assert.equal('scene_id' in fresh.scene_observation, false);
  assert.equal('scene_id' in persisted.scene_observation, false);
  assert.equal(persisted.scene_observation.location_id, 'brand_strategy_office');
  assert.deepEqual(persisted.scene_observation.evidence, fresh.scene_observation.evidence);
});

test('current scene evidence remains fail-closed for quote and location provenance', () => {
  const make = (evidence, location_id = 'brand_strategy_office') => ({
    extract_version: 2, outcome: 'success',
    scene_observation: { location_id, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null, remote_speaker_ids: [], evidence },
    player_observation: { physical: null, sexual: null }, npc_observations: {}, evidence: {}, elapsed_minutes: 3,
    mind_monitor: {}, turn_summary: '', warnings: []
  });
  assert.throws(() => normalizeFreshExtractObservationV2(make([{ kind: 'scene', location_id: 'brand_strategy_office', quote: 'not in Story' }]), { npcIds: NPCS, storyText: 'Story' }), error => error.code === 'SCENE_EVIDENCE_QUOTE_NOT_IN_STORY');
  assert.throws(() => normalizeFreshExtractObservationV2(make([{ kind: 'scene', location_id: 'other_office', quote: 'exact Story quote' }]), { npcIds: NPCS, storyText: 'exact Story quote' }), /matching location_id/);
  assert.throws(() => normalizeFreshExtractObservationV2(make([{ kind: 'scene', quote: 'exact Story quote' }]), { npcIds: NPCS, storyText: 'exact Story quote' }), /matching location_id/);
  assert.throws(() => normalizeFreshExtractObservationV2(make([{ kind: 'scene', location_id: 'brand_strategy_office', quote: 'exact Story quote' }], ''), { npcIds: NPCS, storyText: 'exact Story quote' }), /matching location_id/);
});

test('presence evidence remains exact-quote grounded and registered', () => {
  const result = normalizeFreshExtractObservationV2({
    extract_version: 2, outcome: 'success',
    scene_observation: {
      location_id: 'brand_strategy_office', final_present_npc_ids: null,
      entered_npc_ids: ['heroine1'], exited_npc_ids: [], focal_candidate_id: null,
      remote_speaker_ids: [], evidence: [{ kind: 'entrance', character_id: 'heroine1', location_id: 'brand_strategy_office', quote: '서연이 사무실로 들어왔다.' }]
    },
    player_observation: { physical: null, sexual: null }, npc_observations: {}, evidence: {}, elapsed_minutes: 3,
    mind_monitor: {}, turn_summary: '', warnings: []
  }, { npcIds: NPCS, storyText: '서연이 사무실로 들어왔다.' });
  assert.deepEqual(result.scene_observation.entered_npc_ids, ['heroine1']);
  assert.equal(result.scene_observation.evidence[0].character_id, 'heroine1');
});

test('fresh Extract rejects retired semantic vocabulary instead of warning-dropping it', () => {
  assert.throws(() => normalizeFreshExtractObservationV2({ ...base, events: { general: [], sexual: [] } }, { npcIds: NPCS, storyText: '' }), /Unknown observation field/);
  assert.throws(() => normalizeFreshExtractObservationV2({ ...base, npc_observations: { heroine1: { stats: { affinity_delta: 1 } } } }, { npcIds: NPCS, storyText: '' }), /Unknown observation field/);
  assert.throws(() => normalizeFreshExtractObservationV2({ ...base, image_selection: { pool: 'general', tags: [] } }, { npcIds: NPCS, storyText: '' }), /Unknown observation field/);
});

test('persisted legacy boundary remains separate and readable', () => {
  const legacy = { ...base, scene_observation: { ...base.scene_observation, scene_id: 'legacy-scene', location_id: 'legacy-office', evidence: [{ kind: 'scene', location_id: 'legacy-office', quote: 'legacy Story quote' }] }, events: { general: [], sexual: [] }, action_target_id: null, image_character_id: null, image_selection: null, csa_trigger_evaluations: [], csa_runtime_updates: [] };
  const result = normalizePersistedExtractObservation(legacy, { npcIds: NPCS, storyText: 'legacy Story quote' });
  assert.equal(result.extract_version, 2);
  assert.equal(result.scene_observation.scene_id, 'legacy-scene');
});

test('fresh Extract rejects legacy scene_id and semantic authority', () => {
  const freshBase = structuredClone(base);
  freshBase.scene_observation = { location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], focal_candidate_id: null, remote_speaker_ids: [], evidence: [] };
  assert.throws(() => normalizeFreshExtractObservationV2({ ...freshBase, scene_observation: { ...freshBase.scene_observation, scene_id: 'legacy-scene' } }, { npcIds: NPCS, storyText: '' }), /Unknown observation field/);
  assert.throws(() => normalizeFreshExtractObservationV2({ ...freshBase, events: { general: [], sexual: [] } }, { npcIds: NPCS, storyText: '' }), /Unknown observation field/);
});

test('Extract prompt names the minimal fresh contract and keeps raw Story evidence', () => {
  const messages = buildExtractPrompt({ context: { save: { scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 0 }, world_state: { game_time: { day: 1, minute_of_day: 540 } } } }, storyText: 'raw story', parsedStory: {}, expectedTurn: 1, edition: { characters: { characters: {} }, generalNpcs: { profiles: {} }, map: { locations: [] } }, npcIds: NPCS });
  const text = messages[0].content;
  assert.match(text, /narrow player_observation/i);
  assert.match(text, /semantic event\/relation taxonomy/i);
  assert.equal(text.includes('csa_trigger_evaluations'), false);
  assert.equal(text.includes('posture'), false);
  assert.match(text, /position_label/);
  assert.equal(JSON.parse(messages[1].content).story_text, 'raw story');
});
