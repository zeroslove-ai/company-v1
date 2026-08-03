import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedCleanupRevision, expectedCommitRevision } from '../scripts/live-phase-2-e2e.mjs';

test('live Phase 2 revision assertions are relative to the clean baseline', () => {
  for (const baselineRevision of [0, 1, 7]) {
    const committedRevision = expectedCommitRevision(baselineRevision);
    assert.equal(committedRevision, baselineRevision + 1);
    assert.equal(expectedCleanupRevision(committedRevision), committedRevision + 1);
  }
});
