import test from 'node:test';
import assert from 'node:assert/strict';
import edition from '../src/api/edition.js';
import { buildExtractPrompt } from '../src/engine/extract-prompt.js';
import {
  normalizeFreshExtractObservationV2,
  normalizeExtractObservationV2
} from '../src/engine/runtime-core/extract-observation.js';
import { normalizePersistedExtractObservation } from '../src/engine/runtime-core/persisted-extract-observation.js';

const npcIds = new Set(['heroine1', 'heroine2']);
const storyText = '윤민아가 회의실에 들어왔다.';
const base = {
  extract_version: 2,
  outcome: 'success',
  scene_observation: {
    scene_id: null,
    location_id: null,
    final_present_npc_ids: null,
    focal_candidate_id: null,
    remote_speaker_ids: [],
    evidence: []
  },
  player_observation: {},
  npc_observations: {},
  events: { general: [], sexual: [] },
  evidence: {},
  elapsed_minutes: 3,
  mind_monitor: {},
  action_target_id: null,
  image_character_id: null,
  image_selection: null,
  csa_trigger_evaluations: [],
  csa_runtime_updates: [],
  turn_summary: '',
  warnings: []
};

test('fresh V2 accepts canonical observer shape', () => {
  const result = normalizeFreshExtractObservationV2({ ...base, npc_observations: { heroine1: { emotion: { mood: '당황' } } } }, { npcIds, storyText });
  assert.equal(result.extract_version, 2);
  assert.deepEqual(result.npc_observations.heroine1.emotion, { mood: '당황' });
});

test('fresh V1, degraded, legacy scene fields, and movement evidence fail closed', () => {
  assert.throws(() => normalizeFreshExtractObservationV2({ state_delta: {} }), /extract_version|observation|Forbidden Extract field/i);
  assert.throws(() => normalizeFreshExtractObservationV2({ ...base, outcome: 'degraded' }), /outcome/i);
  for (const field of ['entered_npc_ids', 'exited_npc_ids', 'presence_is_final']) {
    assert.throws(() => normalizeFreshExtractObservationV2({ ...base, scene_observation: { ...base.scene_observation, [field]: field === 'presence_is_final' ? false : [] } }), /Unknown observation field/);
  }
  assert.throws(() => normalizeFreshExtractObservationV2({ ...base, scene_observation: { ...base.scene_observation, evidence: [{ kind: 'movement', location_id: 'meeting_room', quote: storyText }] } }, { npcIds, storyText }), /evidence kind/i);
});

test('persisted boundary reads V2 degraded and legacy V1 without exposing legacy shape', () => {
  const degraded = normalizePersistedExtractObservation({ ...base, outcome: 'degraded' }, { npcIds, storyText });
  assert.equal(degraded.outcome, 'degraded');
  const legacy = normalizePersistedExtractObservation({
    outcome: 'partial',
    state_delta: {},
    evidence: {},
    elapsed_minutes: 3,
    warnings: []
  }, { npcIds, storyText });
  assert.equal(legacy.extract_version, 2);
  assert.ok(legacy.warnings.includes('legacy_extract_adapter_used'));
  assert.equal('state_delta' in legacy, false);
  assert.equal('entered_npc_ids' in legacy.scene_observation, false);
  assert.equal('exited_npc_ids' in legacy.scene_observation, false);
  assert.equal('presence_is_final' in legacy.scene_observation, false);
  assert.ok(legacy.scene_observation.evidence.every(item => ['presence', 'scene'].includes(item.kind)));
});

test('fresh Extract payload is Story-only and has one identity registry', () => {
  const payload = JSON.parse(buildExtractPrompt({
    context: {}, storyText, parsedStory: { dialogue_lines: [] }, expectedTurn: 4, edition, npcIds,
    playerAction: '이 값은 observer payload에 들어가면 안 된다'
  })[1].content);
  assert.deepEqual(Object.keys(payload), ['extract_version', 'registered_identities', 'registered_locations', 'story_text', 'context', 'expected_turn']);
  assert.equal('player_action' in payload, false);
  assert.equal('registered_characters' in payload, false);
  assert.equal('registered_general_npcs' in payload, false);
});

test('persisted V2 remains semantically equal to its compatibility normalizer', () => {
  const expected = normalizeExtractObservationV2(base, { npcIds, storyText });
  const persisted = normalizePersistedExtractObservation(base, { npcIds, storyText });
  assert.deepEqual(persisted, expected);
});
