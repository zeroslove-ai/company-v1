import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine/index.js';
import { hydrateCanonicalScene } from '../src/engine/runtime-core/scene-reducer.js';
import { buildOpeningPlan } from '../src/engine/player-setup.js';

test('turn-0 has no JavaScript full-save writer or public export', () => {
  assert.equal('buildOpeningNextSave' in engine, false);
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
  assert.equal(planA.work_hook_id, 'hook-1');
  assert.equal(planA.scene_goal, '첫 업무를 시작한다');
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
  const hydrated = hydrateCanonicalScene(saved);
  assert.equal(hydrated.updated_turn, 0);
  assert.equal(hydrated.location_id, 'brand_strategy_office');
  assert.deepEqual(hydrated.present_npc_ids, ['heroine1']);
  assert.equal(hydrated.present_npc_ids.includes('heroine5'), false);
  assert.equal(1, saved.turn_state.committed_turn + 1);
});
