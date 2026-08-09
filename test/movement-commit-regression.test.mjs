import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeMovementCommit } from '../src/engine/guarded-merge.js';

function save() {
  return {
    edition: 'company-v1',
    save_schema_version: 1,
    player: { id: 'player-1', name: '플레이어' },
    scene_state: { scene_id: 'origin', location_id: 'origin', participants: ['player-1', 'heroine1'] },
    last_npcs_present: ['heroine1'],
    focal_character_id: 'heroine1',
    last_speaker_id: 'heroine1',
    npc_scene_state: {
      heroine1: { present: true, location_id: 'origin', posture: 'sitting', clothing: { uniform_top: 'worn' } },
      heroine2: { present: false, location_id: 'destination', posture: 'standing', clothing: { uniform_top: 'removed' }, work_state: { task: '보고서 작성' } },
      heroine3: { present: true, location_id: 'other', posture: 'walking', clothing: { uniform_top: 'worn' } }
    }
  };
}

function cast(overrides = {}) {
  return {
    transition_mode: 'movement',
    destination_scene_id: 'destination-scene',
    destination_location_id: 'destination',
    ...overrides
  };
}

function envelope(outcome = 'success', npcs_present = ['heroine2']) {
  return { outcome, npcs_present, state_delta: {} };
}

test('successful movement writes destination scene/location and preserves destination state', () => {
  const before = save();
  const next = structuredClone(before);
  const result = sanitizeMovementCommit({ beforeSave: before, nextSave: next, sceneCastContract: cast(), extractEnvelope: envelope(), actionKind: 'ordinary', expectedTurn: 8 });
  assert.equal(result.applied, true);
  assert.deepEqual(next.scene_state, { scene_id: 'destination-scene', location_id: 'destination', participants: ['player-1', 'heroine2'], updated_turn: 8 });
  assert.deepEqual(next.last_npcs_present, ['heroine2']);
  assert.equal(next.focal_character_id, 'heroine2');
  assert.equal(next.npc_scene_state.heroine1.present, false);
  assert.equal(next.npc_scene_state.heroine2.present, true);
  assert.equal(next.npc_scene_state.heroine2.clothing.uniform_top, 'removed');
  assert.equal(next.npc_scene_state.heroine2.posture, 'standing');
  assert.deepEqual(next.npc_scene_state.heroine2.work_state, { task: '보고서 작성' });
  assert.deepEqual(next.npc_scene_state.heroine3, before.npc_scene_state.heroine3);
});

test('movement with multiple destination NPCs keeps player and all final participants', () => {
  const before = save();
  const next = structuredClone(before);
  const result = sanitizeMovementCommit({ beforeSave: before, nextSave: next, sceneCastContract: cast(), extractEnvelope: envelope('success', ['heroine2', 'heroine3']), actionKind: 'ordinary', expectedTurn: 9 });
  assert.equal(result.applied, true);
  assert.deepEqual(next.scene_state.participants, ['player-1', 'heroine2', 'heroine3']);
  assert.deepEqual(next.last_npcs_present, ['heroine2', 'heroine3']);
  assert.equal(next.focal_character_id, 'heroine2');
});

test('partial, interrupted, blocked, refused, and degraded movement restore the origin state', () => {
  for (const outcome of ['partial', 'interrupted', 'blocked', 'refused', 'degraded']) {
    const before = save();
    const next = structuredClone(before);
    next.scene_state.location_id = 'incorrect';
    next.npc_scene_state.heroine1.present = false;
    const result = sanitizeMovementCommit({ beforeSave: before, nextSave: next, sceneCastContract: cast(), extractEnvelope: envelope(outcome), actionKind: 'ordinary', expectedTurn: 8 });
    assert.equal(result.applied, false, outcome);
    assert.equal(result.reason, `movement_not_successful`, outcome);
    assert.deepEqual(next, before, outcome);
  }
});

test('unknown destination, feedback revision, and stationary turns never alter movement state', () => {
  for (const [sceneCastContract, actionKind] of [
    [cast({ destination_location_id: null }), 'ordinary'],
    [cast(), 'feedback_revision'],
    [{ transition_mode: 'stationary' }, 'ordinary']
  ]) {
    const before = save();
    const next = structuredClone(before);
    const result = sanitizeMovementCommit({ beforeSave: before, nextSave: next, sceneCastContract, extractEnvelope: envelope(), actionKind, expectedTurn: 8 });
    assert.equal(result.applied, false);
    assert.deepEqual(next, before);
  }
});

test('movement sanitizer never mutates beforeSave', () => {
  const before = save();
  const snapshot = structuredClone(before);
  sanitizeMovementCommit({ beforeSave: before, nextSave: structuredClone(before), sceneCastContract: cast(), extractEnvelope: envelope(), actionKind: 'ordinary', expectedTurn: 8 });
  assert.deepEqual(before, snapshot);
});
