import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExtractPrompt } from '../src/engine/extract-prompt.js';

test('Extract prompt requires both parties only for completed current player-target sexual ledger events', () => {
  const system = buildExtractPrompt({
    context: {},
    storyText: 'x',
    parsedStory: {},
    playerAction: 'x',
    expectedTurn: 1
  })[0].content;

  assert.match(system, /sexual_event_ledger completed=true/);
  assert.match(system, /requires both actor_id and target_id/);
  assert.match(system, /one must be "player"/);
  assert.match(system, /registered target NPC stable id/);
  assert.match(system, /cannot identify both parties, omit the completed event/);
  assert.match(system, /does not apply to attempts, refusals, interruptions, pauses, reports, boundaries, ordinary work, or genuinely self-directed events/);
  assert.match(system, /target_id may be null for those when evidenced/);
  assert.ok(system.length <= 5000, `extract system chars: ${system.length}`);
});
