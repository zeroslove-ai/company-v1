import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyGuardedStateDelta,
  deriveRecoverableStep,
  normalizeExtractEnvelope,
  parseNarrative
} from '../src/engine/index.js';
import { GameCoreError } from '../src/engine/errors.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = file => JSON.parse(read(file));
const clone = value => structuredClone(value);

test('Phase 2 parser preserves normal Story order and four choices', () => {
  const parsed = parseNarrative(read('fixtures/phase-2/story-valid.txt'));
  assert.equal(parsed.blocks.length, 4);
  assert.deepEqual(parsed.blocks.map(block => block.type), ['scene', 'dialogue', 'scene', 'dialogue']);
  assert.equal(parsed.blocks[1].speaker, '김하연');
  assert.equal(parsed.player_status.includes('회의실'), true);
  assert.equal(parsed.choices.length, 4);
});

test('Phase 2 parser preserves malformed Story raw text with warnings', () => {
  const raw = read('fixtures/phase-2/story-malformed.txt');
  const parsed = parseNarrative(raw);
  assert.equal(parsed.raw, raw);
  assert.ok(parsed.warnings.includes('choices_not_exactly_four'));
  assert.ok(parsed.blocks.some(block => block.text.includes('형식 없는 원문')));
});

test('extract envelope normalizes valid deltas and rejects invalid envelopes', () => {
  const envelope = normalizeExtractEnvelope(readJson('fixtures/phase-2/extract-valid.json'));
  assert.equal(envelope.outcome, 'partial');
  assert.equal(envelope.choices.length, 4);
  assert.throws(() => normalizeExtractEnvelope({ state_delta: {}, outcome: 'unknown' }), GameCoreError);
});

test('guarded merge warns for unknown paths, stale patches, and absent NPCs', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  save.npc_emotion['npc-hayeon'].updated_turn = 10;
  const result = applyGuardedStateDelta(save, {
    state_delta: {
      unknown_state: { value: true },
      npc_emotion: {
        'npc-hayeon': { mood: 'stale', updated_turn: 9 },
        'npc-absent': { mood: 'ignored', updated_turn: 8 }
      }
    }, outcome: 'success', evidence: {}, choices: [], mind_monitor: {}, dialogue_lines: []
  }, { expectedTurn: 8, actionId: 'action-8', turnId: 'turn-8', playerAction: '검토한다.' });
  assert.equal(result.nextSave.npc_emotion['npc-hayeon'].mood, 'focused');
  assert.ok(result.warnings.some(item => item.startsWith('unknown_state_path')));
  assert.ok(result.warnings.some(item => item.startsWith('stale_updated_turn')));
  assert.ok(result.warnings.some(item => item.startsWith('absent_npc_patch')));
});

test('guarded merge deduplicates ledger, replaces snapshots, permits graded outcomes, and builds turn state', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  const result = applyGuardedStateDelta(save, {
    state_delta: {
      event_ledger: [save.event_ledger[0], { event_id: 'event-2', event_type: 'work_event' }],
      last_choices: ['a', 'b', 'c', 'd']
    }, outcome: 'refused', evidence: {}, choices: ['a', 'b', 'c', 'd'], mind_monitor: {}, dialogue_lines: []
  }, { expectedTurn: 8, actionId: 'action-8', turnId: 'turn-8', playerAction: '거절을 듣는다.' });
  assert.equal(result.nextSave.event_ledger.length, 2);
  assert.deepEqual(result.nextSave.last_choices, ['a', 'b', 'c', 'd']);
  assert.deepEqual(result.nextSave.turn_state, { committed_turn: 7, processing_status: 'ready', turn_id: 'turn-8', action_id: 'action-8', expected_turn: 9 });
});

test('guarded merge rejects sexual completion without evidence and exposes recovery states', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  assert.throws(() => applyGuardedStateDelta(save, {
    state_delta: { player_sexual_state: { sexual_relationship_completed: true } }, outcome: 'success', evidence: {}, choices: [], mind_monitor: {}, dialogue_lines: []
  }, { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' }), GameCoreError);
  assert.equal(deriveRecoverableStep({ processing_status: 'extracting', has_story: true }), 'resume_extract');
  assert.equal(deriveRecoverableStep({ processing_status: 'committed' }), 'complete');
});
