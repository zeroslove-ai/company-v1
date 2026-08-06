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

  assert.match(system, /sexual_event_ledger need Story quotes and correct outcomes/);
  assert.match(system, /Player-target completion needs "player"\+registered target IDs/);
  assert.match(system, /omit if unknown/);
  assert.match(system, /Incomplete\/self events may use null target_id/);
  assert.match(system, /Korean; IDs unchanged/);
  assert.ok(system.length <= 3000, `extract system chars: ${system.length}`);
});
