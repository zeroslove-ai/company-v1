import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateCsaCapability, getCsaLimits } from '../src/engine/csa/capability.js';
import { expForNextLevel } from '../src/engine/progression.js';
import { openingCompleted, playerSetupCompleted } from '../src/frontend/pages/state.js';

function contextFor(save, committedTurn = save?.turn_state?.committed_turn ?? 0) {
  return { save: { committed_turn: committedTurn, data: save } };
}

test('CSA capability displays the same next-level EXP threshold used by the progression writer', () => {
  for (let level = 1; level < 10; level += 1) {
    const capability = calculateCsaCapability({ player_progress: { level, exp: 0 } }, 0);
    assert.equal(capability.next_level_exp, expForNextLevel(level));
  }
  assert.equal(calculateCsaCapability({ player_progress: { level: 10, exp: 0 } }, 0).next_level_exp, 0);
});

test('level 10 exposes the canonical fifth CSA slot', () => {
  assert.equal(getCsaLimits(10).max_active, 5);
  assert.equal(calculateCsaCapability({ player_progress: { level: 10, exp: 0 } }, 4).csa_max_active, 5);
});

test('legacy progressed save without setup/opening keys remains playable', () => {
  const context = contextFor({ turn_state: { committed_turn: 3 } }, 3);
  assert.equal(playerSetupCompleted(context), true);
  assert.equal(openingCompleted(context), true);
});

test('new turn-zero save without setup/opening keys still requires setup', () => {
  const context = contextFor({ turn_state: { committed_turn: 0 } }, 0);
  assert.equal(playerSetupCompleted(context), false);
  assert.equal(openingCompleted(context), false);
});

test('explicit incomplete setup/opening state is never overridden by legacy compatibility', () => {
  const context = contextFor({
    turn_state: { committed_turn: 3 },
    player_setup: { completed: false },
    opening_state: { status: 'reserved' }
  }, 3);
  assert.equal(playerSetupCompleted(context), false);
  assert.equal(openingCompleted(context), false);
});
