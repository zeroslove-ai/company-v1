import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFreshExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { normalizePersistedExtractObservation } from '../src/engine/runtime-core/persisted-extract-observation.js';
import { buildExtractPrompt } from '../src/engine/extract-prompt.js';

const NPCS = new Set(['heroine1', 'heroine2']);
const base = { extract_version: 2, outcome: 'success', scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], presence_is_final: false, focal_candidate_id: null, remote_speaker_ids: [], evidence: [] }, player_observation: { physical: null, sexual: null }, npc_observations: {}, evidence: {}, elapsed_minutes: 3, mind_monitor: {}, turn_summary: '대화가 이어졌다.', warnings: [] };

test('fresh Extract accepts only narrow scene, physical, sexual and summary observation', () => {
  const result = normalizeFreshExtractObservationV2({ ...base, player_observation: { physical: { posture: 'standing' }, sexual: { arousal_delta: 1 } } }, { npcIds: NPCS, storyText: '대화가 이어졌다.' });
  assert.equal(result.player_observation.physical.posture, 'standing');
  assert.equal(result.player_observation.sexual.arousal_delta, 1);
  assert.equal('events' in result, false);
  assert.equal('action_target_id' in result, false);
  assert.equal('image_selection' in result, false);
});

test('fresh Extract rejects retired semantic vocabulary instead of warning-dropping it', () => {
  assert.throws(() => normalizeFreshExtractObservationV2({ ...base, events: { general: [], sexual: [] } }, { npcIds: NPCS, storyText: '' }), /Unknown observation field/);
  assert.throws(() => normalizeFreshExtractObservationV2({ ...base, npc_observations: { heroine1: { stats: { affinity_delta: 1 } } } }, { npcIds: NPCS, storyText: '' }), /Unknown observation field/);
});

test('persisted legacy boundary remains separate and readable', () => {
  const legacy = { ...base, events: { general: [], sexual: [] }, action_target_id: null, image_character_id: null, image_selection: null, csa_trigger_evaluations: [], csa_runtime_updates: [] };
  const result = normalizePersistedExtractObservation(legacy, { npcIds: NPCS, storyText: '' });
  assert.equal(result.extract_version, 2);
});

test('Extract prompt names the minimal fresh contract and keeps raw Story evidence', () => {
  const messages = buildExtractPrompt({ context: { save: { scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 0 }, world_state: { game_time: { day: 1, minute_of_day: 540 } } } }, storyText: 'raw story', parsedStory: {}, expectedTurn: 1, edition: { characters: { characters: {} }, generalNpcs: { profiles: {} }, map: { locations: [] } }, npcIds: NPCS });
  const text = messages[0].content;
  assert.match(text, /narrow player_observation/i);
  assert.match(text, /semantic event\/relation taxonomy/i);
  assert.equal(text.includes('csa_trigger_evaluations'), false);
  assert.equal(JSON.parse(messages[1].content).story_text, 'raw story');
});
