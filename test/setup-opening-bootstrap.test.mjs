import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine/index.js';
import { readCanonicalSceneV1 } from '../src/engine/runtime-core/scene-reducer.js';
import { buildOpeningPlan } from '../src/engine/player-setup.js';
import edition from '../src/api/edition.js';
import { masterFromEdition } from '../src/api/turn-routes.js';

test('turn-0 has no JavaScript full-save writer or public export', () => {
  assert.equal('buildOpeningNextSave' in engine, false);
});

test('the registered NPC universe is the combined canonical character and general-NPC catalog', () => {
  const master = masterFromEdition(edition);
  const ids = [...master.characters, ...master.general_npcs].map(entry => entry.character_id ?? entry.npc_id);
  assert.equal(ids.length, Object.keys(edition.characters.characters).length + Object.keys(edition.generalNpcs.profiles).length);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids, [
    ...Object.keys(edition.characters.characters),
    ...Object.keys(edition.generalNpcs.profiles)
  ]);
});

test('opening plan remains deterministic and scene facts come from the plan', () => {
  const locations = [{
    location_id: 'brand_strategy_office',
    name: '브랜드전략실',
    opening_enabled: true,
    opening_hooks: [{ id: 'hook-1', label: '첫 업무' }],
    opening_goals: ['첫 업무를 시작한다']
  }];
  const planA = buildOpeningPlan({ positionId: 'intern', seedBytes: [3, 6, 9], heroineIds: ['heroine1', 'heroine2', 'heroine3'], locations });
  const planB = buildOpeningPlan({ positionId: 'intern', seedBytes: [3, 6, 9], heroineIds: ['heroine1', 'heroine2', 'heroine3'], locations });
  assert.deepEqual(planA, planB);
  assert.equal(planA.location_id, 'brand_strategy_office');
  assert.equal(typeof planA.primary_character_id, 'string');
});

test('first gameplay starts at expected turn one without reopening the opening scene', () => {
  const saved = {
    turn_state: { committed_turn: 0 },
    scene: {
      version: 1,
      scene_id: 'opening',
      location_id: 'brand_strategy_office',
      beat: 0,
      goal: '첫 업무를 시작한다',
      focus_thread: 'hook-1',
      present_npc_ids: ['heroine1'],
      focal_character_id: 'heroine1',
      last_speaker_id: null,
      updated_turn: 0
    },
    scene_state: { participants: ['player-1', 'heroine5'] },
    last_npcs_present: ['heroine5']
  };
  assert.equal(saved.turn_state.committed_turn, 0);
  const hydrated = readCanonicalSceneV1(saved);
  assert.equal(hydrated.updated_turn, 0);
  assert.equal(hydrated.location_id, 'brand_strategy_office');
  assert.deepEqual(hydrated.present_npc_ids, ['heroine1']);
  assert.equal(hydrated.present_npc_ids.includes('heroine5'), false);
  assert.equal(1, saved.turn_state.committed_turn + 1);
});
