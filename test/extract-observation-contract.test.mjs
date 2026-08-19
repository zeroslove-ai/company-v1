import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFreshExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { normalizePersistedExtractObservation } from '../src/engine/runtime-core/persisted-extract-observation.js';
import { buildExtractPrompt } from '../src/engine/extract-prompt.js';

const NPCS = new Set(['heroine1', 'heroine2']);
const base = { extract_version: 2, outcome: 'success', scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], presence_is_final: false, focal_candidate_id: null, remote_speaker_ids: [], evidence: [] }, player_observation: { physical: null, sexual: null }, npc_observations: {}, evidence: {}, elapsed_minutes: 3, mind_monitor: {}, turn_summary: '대화가 이어졌다.', warnings: [] };

test('fresh Extract accepts only narrow scene, physical, retained erection and summary observation', () => {
  const freshBase = structuredClone(base);
  freshBase.scene_observation = { location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], remote_speaker_ids: [], evidence: [] };
  const result = normalizeFreshExtractObservationV2({ ...freshBase, player_observation: { physical: { position_label: 'standing' }, sexual: { erection_state: 'erect' } } }, { npcIds: NPCS, storyText: '' });
  assert.equal(result.player_observation.physical.position_label, 'standing');
  assert.equal(result.player_observation.sexual.erection_state, 'erect');
  const malformedPhysical = normalizeFreshExtractObservationV2({ ...freshBase, player_observation: { physical: { posture: 'standing' } } }, { npcIds: NPCS, storyText: '' });
  assert.equal(malformedPhysical.player_observation.physical, null);
  assert.ok(malformedPhysical.warnings.some(warning => warning.includes('player_observation.physical')));
});

test('fresh Extract reports missing continuity summary and required Mind Monitor entries', () => {
  const freshBase = structuredClone(base);
  freshBase.scene_observation = { location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], remote_speaker_ids: [], evidence: [] };
  freshBase.turn_summary = '';
  const result = normalizeFreshExtractObservationV2(freshBase, {
    npcIds: NPCS,
    storyText: 'A committed Story paragraph with continuity.',
    requiredMindMonitorIds: ['heroine1']
  });
  assert.ok(result.warnings.includes('mind_monitor_missing:heroine1'));
  assert.ok(result.warnings.includes('turn_summary_missing_for_nonempty_story'));
});

test('fresh actor evidence is one exact quote with canonical changed paths', () => {
  const freshBase = structuredClone(base);
  freshBase.scene_observation = { location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], remote_speaker_ids: [], evidence: [] };
  const result = normalizeFreshExtractObservationV2({
    ...freshBase,
    evidence: { actors: { heroine1: { character_id: 'heroine1', quote: 'Heroine stands by the window', changed: ['npc_scene_state.heroine1.position_label'] } } }
  }, { npcIds: NPCS, storyText: 'Heroine stands by the window.' });
  assert.deepEqual(result.evidence.actors.heroine1.changed, ['npc_scene_state.heroine1.position_label']);
  const unsupported = normalizeFreshExtractObservationV2({ ...freshBase, evidence: { actors: { heroine1: { character_id: 'heroine1', quote: 'Heroine stands by the window', changed: ['npc_scene_state.heroine1.posture'] } } } }, { npcIds: NPCS, storyText: 'Heroine stands by the window.' });
  assert.deepEqual(unsupported.evidence, {});
  assert.ok(unsupported.warnings.some(warning => warning.includes('evidence.heroine1')));
  const retired = normalizeFreshExtractObservationV2({
    ...freshBase,
    evidence: { physical_change: { heroine1: { character_id: 'heroine1', quote: 'Heroine stands by the window', changed: ['npc_scene_state.heroine1.position_label'] } } }
  }, { npcIds: NPCS, storyText: 'Heroine stands by the window.' });
  assert.deepEqual(retired.evidence, {});
  assert.ok(retired.warnings.some(warning => warning.includes('evidence.physical_change')));
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

test('malformed optional scene evidence drops only that field and preserves valid observations', () => {
  const make = (evidence, location_id = 'brand_strategy_office') => ({
    extract_version: 2, outcome: 'success',
    scene_observation: { location_id, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], remote_speaker_ids: [], evidence },
    player_observation: { physical: null, sexual: null }, npc_observations: {}, evidence: {}, elapsed_minutes: 3,
    mind_monitor: {}, turn_summary: '', warnings: []
  });
  const result = normalizeFreshExtractObservationV2({
    ...make([{ kind: 'scene', location_id: 'brand_strategy_office', quote: 'not in Story' }]),
    turn_summary: 'valid summary',
    mind_monitor: { heroine1: { surface: 'surface', subconscious: 'subconscious' } },
    npc_observations: { heroine1: { physical: { position_label: 'by the window' } } },
    evidence: { actors: { heroine1: { character_id: 'heroine1', quote: 'Heroine stands by the window', changed: ['npc_scene_state.heroine1.position_label'] } } }
  }, { npcIds: NPCS, storyText: 'valid Story. Heroine stands by the window' });
  assert.deepEqual(result.scene_observation.evidence, []);
  assert.equal(result.turn_summary, 'valid summary');
  assert.equal(result.mind_monitor.heroine1.surface, 'surface');
  assert.equal(result.npc_observations.heroine1.physical.position_label, 'by the window');
  assert.equal(result.evidence.actors.heroine1.character_id, 'heroine1');
  assert.ok(result.warnings.some(warning => warning.includes('scene_observation.evidence')));
});

test('one malformed actor domain does not erase another actor observation', () => {
  const result = normalizeFreshExtractObservationV2({
    ...base,
    scene_observation: { location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], remote_speaker_ids: [], evidence: [] },
    npc_observations: {
      heroine1: { physical: { position_label: 42 } },
      heroine2: { physical: { position_label: 'seated' } }
    },
    mind_monitor: { heroine2: { surface: 'surface', subconscious: 'subconscious' } }
  }, { npcIds: NPCS, storyText: '' });
  assert.equal(result.npc_observations.heroine1.physical, null);
  assert.equal(result.npc_observations.heroine2.physical.position_label, 'seated');
  assert.equal(result.mind_monitor.heroine2.surface, 'surface');
});

test('presence evidence remains exact-quote grounded and registered', () => {
  const result = normalizeFreshExtractObservationV2({
    extract_version: 2, outcome: 'success',
    scene_observation: {
      location_id: 'brand_strategy_office', final_present_npc_ids: null,
      entered_npc_ids: ['heroine1'], exited_npc_ids: [],
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
  freshBase.scene_observation = { location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], remote_speaker_ids: [], evidence: [] };
  assert.throws(() => normalizeFreshExtractObservationV2({ ...freshBase, scene_observation: { ...freshBase.scene_observation, scene_id: 'legacy-scene' } }, { npcIds: NPCS, storyText: '' }), /Unknown observation field/);
  assert.throws(() => normalizeFreshExtractObservationV2({ ...freshBase, events: { general: [], sexual: [] } }, { npcIds: NPCS, storyText: '' }), /Unknown observation field/);
});

test('Extract prompt names the minimal fresh contract and keeps raw Story evidence', () => {
  const messages = buildExtractPrompt({ context: { save: { scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 0 }, world_state: { game_time: { day: 1, minute_of_day: 540 } } } }, storyText: 'raw story', parsedStory: {}, expectedTurn: 1, edition: { characters: { characters: {} }, generalNpcs: { profiles: {} }, map: { locations: [] } }, npcIds: NPCS });
  const text = messages[0].content;
  assert.match(text, /narrow player_observation/i);
  assert.match(text, /same actor evidence shape/i);
  assert.equal(/relation_updates|events\.general|npc_observations\.relationship|npc_observations\.emotion|npc_observations\.work/.test(text), false);
  assert.equal(text.includes('focal_candidate_id: null'), false);
  assert.equal(text.includes('csa_trigger_evaluations'), false);
  assert.match(text, /actors/i);
  assert.match(text, /position_label/);
  assert.equal(JSON.parse(messages[1].content).story_text, 'raw story');
});
