/**
 * turnPhase — replaces "one busy boolean locks everything" with per-phase UI gating. Derived
 * from state app.js already tracks (pending.step, busy, recoveryPending) rather than a new
 * parallel state machine, so this stays additive: no change to how those are actually driven.
 */
export const TURN_PHASES = ['idle', 'story', 'extract', 'commit', 'media', 'blocked_failure'];

/**
 * pendingStep: the coordinator's own pending.step ('story'|'extract'|'commit') when a turn is
 * in flight, or null when idle. mediaLoading: true while a post-commit image/TTS fetch is in
 * flight (never blocks input — see turnPhaseUiFlags).
 */
export function computeTurnPhase({ busy = false, recoveryPending = false, pendingStep = null, mediaLoading = false } = {}) {
  if (recoveryPending) return 'blocked_failure';
  if (mediaLoading && !busy) return 'media';
  if (!busy) return 'idle';
  if (pendingStep === 'extract') return 'extract';
  if (pendingStep === 'commit') return 'commit';
  return 'story';
}

/**
 * Per-phase UI gating. inputSubmitDisabled blocks only NEW submissions; the draft text field
 * itself (inputEditable) stays editable through extract/commit so the player doesn't lose what
 * they were about to type next. choicesDisabled blocks picking a rendered choice (a new
 * action), independent of the draft field. appDisabled blocks opening the CSA app modal
 * (opening it mid-turn would let the player start a second, conflicting transaction).
 */
export function turnPhaseUiFlags(phase) {
  switch (phase) {
    case 'idle':
      return { inputEditable: true, inputSubmitDisabled: false, choicesDisabled: false, appDisabled: false, showRecovery: false };
    case 'story':
      return { inputEditable: false, inputSubmitDisabled: true, choicesDisabled: true, appDisabled: true, showRecovery: false };
    case 'extract':
    case 'commit':
      return { inputEditable: true, inputSubmitDisabled: true, choicesDisabled: true, appDisabled: true, showRecovery: false };
    case 'media':
      // Commit already succeeded; input is idle-equivalent while media loads in the background.
      return { inputEditable: true, inputSubmitDisabled: false, choicesDisabled: false, appDisabled: false, showRecovery: false };
    case 'blocked_failure':
      return { inputEditable: false, inputSubmitDisabled: true, choicesDisabled: true, appDisabled: true, showRecovery: true };
    default:
      return { inputEditable: false, inputSubmitDisabled: true, choicesDisabled: true, appDisabled: true, showRecovery: false };
  }
}
