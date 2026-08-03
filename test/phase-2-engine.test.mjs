import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyGuardedStateDelta,
  buildExtractPrompt,
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

test('guarded merge persists top-level Extract choices as the authoritative snapshot', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  const result = applyGuardedStateDelta(save, { state_delta: {}, outcome: 'success', evidence: {}, choices: ['one', 'two'], mind_monitor: {}, dialogue_lines: [] }, { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' });
  assert.deepEqual(result.nextSave.last_choices, ['one', 'two']);
  assert.ok(result.warnings.includes('choices_not_exactly_four'));
  const empty = applyGuardedStateDelta(save, { state_delta: { last_choices: ['stale'] }, outcome: 'success', evidence: {}, choices: [], mind_monitor: {}, dialogue_lines: [] }, { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' });
  assert.deepEqual(empty.nextSave.last_choices, []);
});

test('guarded merge rejects sexual completion without evidence and exposes recovery states', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  assert.throws(() => applyGuardedStateDelta(save, {
    state_delta: { player_sexual_state: { sexual_relationship_completed: true } }, outcome: 'success', evidence: {}, choices: [], mind_monitor: {}, dialogue_lines: []
  }, { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' }), GameCoreError);
  assert.equal(deriveRecoverableStep({ processing_status: 'extracting', has_story: true }), 'resume_extract');
  assert.equal(deriveRecoverableStep({ processing_status: 'committed' }), 'complete');
});

test('Phase 2 parser warns whenever final choices are not exactly four', () => {
  for (const raw of ['[SCENE]\nNo choices.', '[CHOICES]\n1. only one', 'unparsed Story']) {
    assert.ok(parseNarrative(raw).warnings.includes('choices_not_exactly_four'));
  }
  assert.equal(parseNarrative('[CHOICES]\n1. a\n2. b\n3. c\n4. d').warnings.includes('choices_not_exactly_four'), false);
});

test('extract envelope preserves normalized warnings when replayed', () => {
  const first = normalizeExtractEnvelope({ ...readJson('fixtures/phase-2/extract-valid.json'), unknown: true, warnings: ['first', '', 'first'] });
  const replay = normalizeExtractEnvelope(first);
  assert.deepEqual(first.warnings, ['first', 'unknown_extract_field:unknown']);
  assert.deepEqual(replay.warnings, first.warnings);
  assert.equal(replay.warnings.includes('unknown_extract_field:warnings'), false);
});

test('guarded merge requires evidence for new relationship sexual milestones', () => {
  const save = clone(readJson('fixtures/phase-0.5/canonical-save-v1.json'));
  const state_delta = { npc_relationship_state: { 'npc-hayeon': { milestones: { sexual_relationship_started_turn: 8 } } } };
  const options = { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' };
  const envelope = evidence => ({ state_delta, outcome: 'success', evidence, choices: [], mind_monitor: {}, dialogue_lines: [] });
  assert.throws(() => applyGuardedStateDelta(save, envelope({}), options), GameCoreError);
  assert.doesNotThrow(() => applyGuardedStateDelta(save, envelope({ sexual_resolution: true }), options));
  save.npc_relationship_state['npc-hayeon'].milestones.sexual_relationship_started_turn = 8;
  assert.doesNotThrow(() => applyGuardedStateDelta(save, envelope({}), options));
  const changed = { npc_relationship_state: { 'npc-hayeon': { milestones: { sexual_relationship_started_turn: 9 } } } };
  assert.throws(() => applyGuardedStateDelta(save, { ...envelope({}), state_delta: changed }, options), GameCoreError);
});

test('recovery states require the persisted result needed by the next step', () => {
  assert.equal(deriveRecoverableStep({ processing_status: 'story_streaming', has_story: false }), 'wait_story');
  assert.equal(deriveRecoverableStep({ processing_status: 'extracting', has_story: true }), 'resume_extract');
  assert.equal(deriveRecoverableStep({ processing_status: 'extracting', has_story: false }), 'retry_story');
  assert.equal(deriveRecoverableStep({ processing_status: 'committing', has_extract: true }), 'resume_commit');
  assert.equal(deriveRecoverableStep({ processing_status: 'committing', has_extract: false }), 'retry_extract');
  assert.equal(deriveRecoverableStep({ processing_status: 'story_failed' }), 'retry_story');
  assert.equal(deriveRecoverableStep({ processing_status: 'extract_failed' }), 'retry_extract');
  assert.equal(deriveRecoverableStep({ processing_status: 'commit_failed' }), 'retry_commit');
  assert.equal(deriveRecoverableStep({ processing_status: 'committed' }), 'complete');
});

test('Extract prompt requires the complete normalized envelope', () => {
  const prompt = buildExtractPrompt({ context: {}, storyText: '[SCENE]\nTest', parsedStory: {}, playerAction: 'test', expectedTurn: 1 });
  assert.match(prompt[0].content, /state_delta \(object\).*outcome.*evidence \(object\).*turn_summary.*mind_monitor.*choices.*dialogue_lines/i);
});
