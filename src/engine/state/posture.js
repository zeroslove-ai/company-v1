/**
 * Story-grounded posture continuity.
 *
 * Legacy posture codes remain readable for existing saves, but they are not an
 * allow-list. New Story/Extract output may carry any concise Korean posture or
 * relative-position description. A persisted posture still changes only when
 * the caller has exact Story evidence or an established legacy end reason.
 */

export const POSTURE_VALUES = new Set([
  'standing', 'sitting', 'kneeling', 'lying_supine', 'lying_prone', 'side_lying',
  'straddling', 'bent_forward', 'leaning', 'walking', 'crouching', 'carrying', 'unknown'
]);

const END_REASON_VALUES = new Set([
  'movement', 'task_ended', 'explicit_change', 'physical_interruption', 'player_request'
]);
const UNKNOWN_VALUES = new Set(['unknown', 'none', 'null', 'n/a', '알 수 없음', '미상', '자세 미확인']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizePhysicalText(value, maxLength = 180) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized || UNKNOWN_VALUES.has(normalized.toLowerCase())) return null;
  return Array.from(normalized).slice(0, maxLength).join('');
}

export function buildPosturePatch({ previous = null, proposal = null, turnNumber = null } = {}) {
  const prev = isPlainObject(previous) ? previous : null;
  const next = isPlainObject(proposal) ? proposal : null;
  const previousPosture = normalizePhysicalText(prev?.posture);
  const previousPosition = normalizePhysicalText(prev?.position_label, 140);
  const proposedPosture = normalizePhysicalText(next?.posture);
  const proposedPosition = normalizePhysicalText(next?.position_label, 140);

  if (!proposedPosture && !proposedPosition) {
    return prev ? {
      posture: previousPosture ?? prev.posture ?? null,
      position_label: previousPosition,
      updated_turn: prev.updated_turn ?? null
    } : null;
  }

  const postureChanges = Boolean(previousPosture && proposedPosture && previousPosture !== proposedPosture);
  const hasRealEndReason = END_REASON_VALUES.has(next?.end_reason) || next?.evidence_valid === true;
  if (postureChanges && !hasRealEndReason) {
    return {
      posture: previousPosture,
      position_label: previousPosition,
      updated_turn: prev?.updated_turn ?? null,
      rejected: 'unevidenced_posture_change'
    };
  }

  return {
    posture: proposedPosture ?? previousPosture,
    position_label: proposedPosition ?? previousPosition,
    updated_turn: Number.isInteger(turnNumber) ? turnNumber : (prev?.updated_turn ?? null)
  };
}
