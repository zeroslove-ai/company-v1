import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNarrative } from '../src/frontend/pages/narrative.js';

test('frontend narrative parser preserves scene and dialogue order', () => {
  const parsed = parseNarrative('[SCENE]\nOffice lights are low.\n[DIALOGUE speaker="Hayeon" direction="quietly"]\nAre you ready?\n[PLAYER_STATUS]\nFocused\n[CHOICES]\n1. Ask\n2. Wait\n3. Leave\n4. Work');
  assert.deepEqual(parsed.blocks.map(block => block.type), ['scene', 'dialogue']);
  assert.equal(parsed.blocks[1].speaker, 'Hayeon');
  assert.equal(parsed.player_status, 'Focused');
  assert.equal(parsed.choices.length, 4);
  assert.equal(parsed.warnings.includes('choices_not_exactly_four'), false);
});

test('frontend narrative parser preserves malformed and markerless Story text', () => {
  const malformed = '[SCENE]\nOnly one choice\n[CHOICES]\n1. Continue';
  const parsed = parseNarrative(malformed);
  assert.equal(parsed.raw, malformed);
  assert.ok(parsed.warnings.includes('choices_not_exactly_four'));
  const fallback = parseNarrative('Plain Story text');
  assert.deepEqual(fallback.blocks, [{ type: 'unparsed', text: 'Plain Story text' }]);
  assert.ok(fallback.warnings.includes('no_recognized_markers'));
});
