/**
 * Posture continuity — ported from donor's persistent-scene-state contract
 * (buildPlayerSceneStatePatch / buildNpcSceneStatePatch carry-forward +
 * buildCsaPersistentSceneSection's narrative rules). A posture set in an
 * earlier turn persists across later turns without being re-started from
 * scratch, until a real ending reason appears in evidence (movement, task
 * end, explicit change, physical interruption) — never merely because a
 * turn passed with unrelated dialogue.
 */

export const POSTURE_VALUES = new Set([
  'standing', 'sitting', 'kneeling', 'lying_supine', 'lying_prone', 'side_lying',
  'straddling', 'bent_forward', 'leaning', 'walking', 'crouching', 'carrying', 'unknown'
]);

const END_REASON_VALUES = new Set(['movement', 'task_ended', 'explicit_change', 'physical_interruption', 'player_request']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Builds the next posture state from the previous one plus an optional proposal. A proposal is
 * only accepted (replacing the carried-forward previous posture) when it names a real
 * end_reason; without one, the previous posture persists untouched regardless of what turn
 * number it is or how long the conversation continued. A first-ever posture (previous is null)
 * is always accepted since there's nothing being interrupted.
 */
export function buildPosturePatch({ previous = null, proposal = null, turnNumber = null } = {}) {
  const prev = isPlainObject(previous) ? previous : null;
  const next = isPlainObject(proposal) ? proposal : null;
  if (!next || !POSTURE_VALUES.has(next.posture)) {
    return prev ? { posture: prev.posture, position_label: prev.position_label ?? null, updated_turn: prev.updated_turn ?? null } : null;
  }
  const hasRealEndReason = END_REASON_VALUES.has(next.end_reason);
  if (prev && prev.posture !== next.posture && !hasRealEndReason) {
    // No real reason to end the previous posture — it persists, the proposal is dropped.
    return { posture: prev.posture, position_label: prev.position_label ?? null, updated_turn: prev.updated_turn ?? null, rejected: 'unevidenced_posture_change' };
  }
  return {
    posture: next.posture,
    position_label: typeof next.position_label === 'string' ? next.position_label.trim().slice(0, 100) : null,
    updated_turn: turnNumber
  };
}
