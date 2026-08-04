import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTurnPhase, turnPhaseUiFlags } from '../src/frontend/pages/turn-phase.js';

test('turnPhase: idle when not busy and no recovery pending', () => {
  assert.equal(computeTurnPhase({ busy: false, recoveryPending: false, pendingStep: null }), 'idle');
});

test('turnPhase: story/extract/commit map directly from the coordinator pending.step while busy', () => {
  assert.equal(computeTurnPhase({ busy: true, pendingStep: 'story' }), 'story');
  assert.equal(computeTurnPhase({ busy: true, pendingStep: 'extract' }), 'extract');
  assert.equal(computeTurnPhase({ busy: true, pendingStep: 'commit' }), 'commit');
});

test('turnPhase: recoveryPending always wins, overriding busy/media', () => {
  assert.equal(computeTurnPhase({ busy: true, pendingStep: 'story', recoveryPending: true }), 'blocked_failure');
  assert.equal(computeTurnPhase({ busy: false, mediaLoading: true, recoveryPending: true }), 'blocked_failure');
});

test('turnPhase: media only applies when not busy (commit already finished) and no recovery pending', () => {
  assert.equal(computeTurnPhase({ busy: false, mediaLoading: true }), 'media');
  assert.equal(computeTurnPhase({ busy: true, pendingStep: 'commit', mediaLoading: true }), 'commit', 'still mid-commit takes priority over a stray mediaLoading flag');
});

test('turnPhaseUiFlags: story phase blocks both new input and choices, and the draft field itself', () => {
  const flags = turnPhaseUiFlags('story');
  assert.equal(flags.inputEditable, false);
  assert.equal(flags.inputSubmitDisabled, true);
  assert.equal(flags.choicesDisabled, true);
  assert.equal(flags.appDisabled, true);
});

test('turnPhaseUiFlags: extract and commit keep the draft field editable but block new submissions/choices/app', () => {
  for (const phase of ['extract', 'commit']) {
    const flags = turnPhaseUiFlags(phase);
    assert.equal(flags.inputEditable, true, `${phase} should allow continued drafting`);
    assert.equal(flags.inputSubmitDisabled, true, `${phase} should block a NEW submission`);
    assert.equal(flags.choicesDisabled, true);
  }
});

test('turnPhaseUiFlags: media phase behaves like idle for input purposes — commit already succeeded', () => {
  const flags = turnPhaseUiFlags('media');
  assert.equal(flags.inputEditable, true);
  assert.equal(flags.inputSubmitDisabled, false);
  assert.equal(flags.choicesDisabled, false);
  assert.equal(flags.appDisabled, false);
});

test('turnPhaseUiFlags: blocked_failure shows recovery guidance and locks everything, including the draft field', () => {
  const flags = turnPhaseUiFlags('blocked_failure');
  assert.equal(flags.showRecovery, true);
  assert.equal(flags.inputEditable, false);
  assert.equal(flags.inputSubmitDisabled, true);
  assert.equal(flags.choicesDisabled, true);
  assert.equal(flags.appDisabled, true);
});
