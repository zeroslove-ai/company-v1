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

  // 증거 불충분 시에도 Extract 제안을 반영한다 — unevidenced 경고는
  // physical-state.js가 이미 기록하므로 여기서 값 자체를 되돌리지 않는다
  // (33~37턴 자세 저장 누락 방지).

  return {
    posture: proposedPosture ?? previousPosture,
    position_label: proposedPosition ?? previousPosition,
    updated_turn: Number.isInteger(turnNumber) ? turnNumber : (prev?.updated_turn ?? null)
  };
}
