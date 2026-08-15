import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExtractPrompt } from '../src/engine/extract-prompt.js';
import { normalizeExtractObservationV2, normalizeFreshExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { normalizePersistedExtractObservation } from '../src/engine/runtime-core/persisted-extract-observation.js';
import { reduceNpcPhysicalObservation } from '../src/engine/runtime-core/observation-reducers.js';

const NPCS = new Set(['heroine1', 'heroine2']);
const STORY = 'Hayeon accepted the apology. Hayeon removed a silver hairpin.';
const scene = (final = null) => ({
  scene_id: null, location_id: null, final_present_npc_ids: final,
  entered_npc_ids: [], exited_npc_ids: [], presence_is_final: final !== null,
  focal_candidate_id: null, remote_speaker_ids: [], evidence: []
});
const valid = (overrides = {}) => ({
  extract_version: 2, outcome: 'success', scene_observation: scene(),
  player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] },
  evidence: {}, elapsed_minutes: 3, mind_monitor: {}, action_target_id: null,
  image_character_id: null, image_selection: null, csa_trigger_evaluations: [],
  csa_runtime_updates: [], turn_summary: '', warnings: [], ...overrides
});

test('V2 observation normalizes narrow machine/UI state without mutating input', () => {
  const input = valid({
    scene_observation: scene([]),
    npc_observations: { heroine1: { physical: { clothing: { uniform_top: 'removed' } } } },
    turn_summary: 'Hayeon accepted the apology.'
  });
  const before = structuredClone(input);
  const result = normalizeExtractObservationV2(input, { npcIds: NPCS, storyText: STORY });
  assert.equal(result.extract_version, 2);
  assert.deepEqual(result.scene_observation.final_present_npc_ids, []);
  assert.equal(result.turn_summary, 'Hayeon accepted the apology.');
  assert.equal('open_facts' in result, false);
  assert.deepEqual(input, before);
});

test('fresh Extract accepts the simplified output shape without a fact ledger', () => {
  const result = normalizeFreshExtractObservationV2(valid({ turn_summary: 'Hayeon accepted the apology.' }), {
    npcIds: NPCS, storyText: STORY, expectedTurn: 4, actionId: 'simplified-extract'
  });
  assert.equal(result.turn_summary, 'Hayeon accepted the apology.');
  assert.equal('open_facts' in result, false);
  assert.equal('block_observations' in result, false);
});

test('fresh Extract rejects superseded fact-ledger wire fields instead of normalizing them', () => {
  assert.throws(
    () => normalizeFreshExtractObservationV2(valid({ open_facts: [] }), { npcIds: NPCS, storyText: STORY }),
    error => error.code === 'INVALID_EXTRACT_OBSERVATION'
  );
  assert.throws(
    () => normalizeFreshExtractObservationV2(valid({ block_observations: [] }), { npcIds: NPCS, storyText: STORY }),
    error => error.code === 'INVALID_EXTRACT_OBSERVATION'
  );
});

test('fresh Extract drops relation residue warning-only while retaining a valid narrow sibling', () => {
  const result = normalizeFreshExtractObservationV2(valid({
    relation_updates: [{ actor_id: 'heroine1', target_id: 'heroine2', relation_kind: 'legacy', state: 'started', quote: STORY }],
    npc_observations: { heroine1: { physical: { posture: 'standing' } } }
  }), { npcIds: NPCS, storyText: STORY });
  assert.ok(result.warnings.includes('extract_optional_dropped:relation_updates:REMOVED_OPTIONAL_FIELD'));
  assert.equal(result.relation_updates, undefined);
  assert.deepEqual(result.npc_observations.heroine1.physical, { posture: 'standing' });
});

test('fresh Extract drops general events warning-only while retaining sexual events', () => {
  const result = normalizeFreshExtractObservationV2(valid({
    events: {
      general: [{ event_type: 'promise', evidence: STORY }],
      sexual: [{ actor_id: 'heroine1', target_id: 'player', action_type: 'kiss', direction: 'npc_to_player', completed: false, interrupted: false, evidence: STORY }]
    }
  }), { npcIds: NPCS, storyText: STORY, expectedTurn: 4, actionId: 'sexual-sibling' });
  assert.ok(result.warnings.includes('extract_optional_dropped:events.general:REMOVED_OPTIONAL_FIELD'));
  assert.deepEqual(result.events.general, []);
  assert.equal(result.events.sexual.length, 1);
});

test('fresh Extract drops NPC semantic residue and unknown optional domains while retaining narrow siblings', () => {
  const result = normalizeFreshExtractObservationV2(valid({
    npc_observations: {
      heroine1: {
        relationship: { closeness: 'close' }, emotion: { mood: 'focused' }, work: { task: 'review' },
        unexpected_projection: { value: 'ignored' },
        physical: { posture: 'standing' }, stats: { affinity_delta: 1 }, csa_attitude: { familiarity: 2 }
      }
    }
  }), { npcIds: NPCS, storyText: STORY });
  assert.ok(result.warnings.includes('extract_optional_dropped:npc_observations.heroine1.relationship:REMOVED_OR_UNKNOWN_OPTIONAL_FIELD'));
  assert.ok(result.warnings.includes('extract_optional_dropped:npc_observations.heroine1.emotion:REMOVED_OR_UNKNOWN_OPTIONAL_FIELD'));
  assert.ok(result.warnings.includes('extract_optional_dropped:npc_observations.heroine1.work:REMOVED_OR_UNKNOWN_OPTIONAL_FIELD'));
  assert.ok(result.warnings.includes('extract_optional_dropped:npc_observations.heroine1.unexpected_projection:REMOVED_OR_UNKNOWN_OPTIONAL_FIELD'));
  assert.deepEqual(Object.keys(result.npc_observations.heroine1).sort(), ['csa_attitude', 'physical', 'stats']);
});

test('fresh Extract drops unknown optional event/player fields without losing valid siblings', () => {
  const result = normalizeFreshExtractObservationV2(valid({
    events: { general: [], sexual: [], continuity_noise: { promise: true } },
    player_observation: { physical: { posture: 'standing' }, sexual: null, old_mood_projection: { mood: 'focused' } }
  }), { npcIds: NPCS, storyText: STORY });
  assert.ok(result.warnings.includes('extract_optional_dropped:events.continuity_noise:UNKNOWN_OPTIONAL_FIELD'));
  assert.ok(result.warnings.includes('extract_optional_dropped:player_observation.old_mood_projection:UNKNOWN_OPTIONAL_FIELD'));
  assert.deepEqual(result.player_observation.physical, { posture: 'standing' });
});

test('fresh Extract output retains sexual mechanics but exposes no general semantic channels', () => {
  const result = normalizeFreshExtractObservationV2(valid({
    events: {
      general: [],
      sexual: [{ actor_id: 'heroine1', target_id: 'player', action_type: 'kiss', direction: 'npc_to_player', completed: false, interrupted: false, evidence: STORY }]
    },
    npc_observations: { heroine1: { physical: { posture: 'standing' } } }
  }), { npcIds: NPCS, storyText: STORY, expectedTurn: 4, actionId: 'sexual-contract' });
  assert.deepEqual(result.events.general, []);
  assert.equal(result.relation_updates, undefined);
  assert.equal(result.npc_observations.heroine1.relationship, undefined);
  assert.equal(result.npc_observations.heroine1.emotion, undefined);
  assert.equal(result.npc_observations.heroine1.work, undefined);
  assert.equal(result.events.sexual.length, 1);
});

test('fresh Extract still hard-fails explicit save-patch authority violations', () => {
  assert.throws(
    () => normalizeFreshExtractObservationV2(valid({ save: { npc_stats: {} } }), { npcIds: NPCS, storyText: STORY }),
    error => error.code === 'EXTRACT_SAVE_PATCH_FORBIDDEN'
  );
});

test('persisted historical fact-ledger fields are inert during replay normalization', () => {
  const result = normalizePersistedExtractObservation({
    ...valid({
      open_facts: [{ fact_id: 'legacy', subject_id: 'unknown', fact_text: 'legacy', story_quote: 'not current' }],
      block_observations: [{ block_id: 'story:0', block_type: 'narrative', facts: [] }]
    })
  }, { npcIds: NPCS, storyText: STORY, expectedTurn: 4, actionId: 'historical' });
  assert.equal('open_facts' in result, false);
  assert.equal('block_observations' in result, false);
});

test('Extract prompt requests turn summary and narrow projections, not general narrative memory facts', () => {
  const [system, user] = buildExtractPrompt({
    context: { save: { scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 0 } } }, storyText: STORY, parsedStory: { blocks: [] },
    expectedTurn: 4, edition: { characters: { characters: {} }, map: { locations: [] } }, npcIds: NPCS
  });
  const payload = JSON.parse(user.content);
  assert.equal(typeof payload.story_text, 'string');
  assert.equal(Object.hasOwn(payload, 'story_observation_blocks'), false);
  assert.equal(system.content.includes('block_observations'), false);
  assert.equal(system.content.includes('open_facts'), false);
  assert.match(system.content, /turn_summary/);
});

test('narrow evidenced clothing observation remains durable product state', () => {
  const quote = 'Hayeon removed a silver hairpin.';
  const observation = normalizeExtractObservationV2(valid({
    npc_observations: { heroine2: { physical: { position_label: 'at the desk', clothing: { underwear_bottom: 'removed' } } } },
    evidence: {
      clothing: { heroine2: { character_id: 'heroine2', quote } },
      physical_change: { changed: ['npc_scene_state.heroine2.clothing.underwear_bottom'], quote }
    }
  }), { npcIds: NPCS, storyText: quote });
  const reduced = reduceNpcPhysicalObservation({
    save: { scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: ['heroine2'], focal_character_id: null, last_speaker_id: null, updated_turn: 0 }, npc_scene_state: { heroine2: { present: true, clothing: { underwear_bottom: 'worn' } } } },
    npcId: 'heroine2', physical: observation.npc_observations.heroine2.physical, evidence: observation.evidence,
    storyText: quote, expectedTurn: 4, npcIds: NPCS, master: { characters: [{ character_id: 'heroine2', name: 'Hayeon' }] },
    parsedStory: {}, sceneBefore: { present_npc_ids: ['heroine2'] }, sceneAfter: { present_npc_ids: ['heroine2'] }, observedNpcIds: ['heroine2']
  });
  assert.equal(reduced.state.clothing.underwear_bottom, 'removed');
  assert.equal(reduced.state.position_label, 'at the desk');
});
