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

test('turnPhase: recoveryPending은 더 이상 blocked_failure를 만들지 않는다 (하드락 전면 제거)', () => {
  // pending은 reconnect hint일 뿐 — recoveryPending이 입력을 잠그지 않는다
  assert.equal(computeTurnPhase({ busy: true, pendingStep: 'story', recoveryPending: true }), 'story');
  assert.equal(computeTurnPhase({ busy: false, mediaLoading: true, recoveryPending: true }), 'media');
  assert.equal(computeTurnPhase({ busy: false, pendingStep: null, recoveryPending: true }), 'idle');
});
test('turnPhase: media only applies when not busy (commit already finished) and no recovery pending', () => {
  assert.equal(computeTurnPhase({ busy: false, mediaLoading: true }), 'media');
  assert.equal(computeTurnPhase({ busy: true, pendingStep: 'commit', mediaLoading: true }), 'commit', 'still mid-commit takes priority over a stray mediaLoading flag');
});

test('turnPhaseUiFlags: story phase는 초안 입력을 허용하고 제출만 잠시 비활성화한다', () => {
  const flags = turnPhaseUiFlags('story');
  assert.equal(flags.inputEditable, true, '진행 중에도 다음 행동 초안 입력 가능');
  assert.equal(flags.inputSubmitDisabled, true, '제출만 잠시 비활성화');
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

test('turnPhaseUiFlags: blocked_failure는 더 이상 입력·선택지·앱을 잠그지 않는다', () => {
  const flags = turnPhaseUiFlags('blocked_failure');
  assert.equal(flags.showRecovery, false);
  assert.equal(flags.inputEditable, true);
  assert.equal(flags.inputSubmitDisabled, false);
  assert.equal(flags.choicesDisabled, false);
  assert.equal(flags.appDisabled, false);
});
