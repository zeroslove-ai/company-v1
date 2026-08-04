/**
 * Relationship guard patterns — ported from donor's clampPlayerInputEchoedStatChanges
 * (hasAffinityOnlyEvidence / hasIndependentAffinityEvent regex pair) and the general
 * consent/compliance separation the Story prompt itself states. These decide whether a
 * proposed affinity increase is backed by real independent evidence or is merely CSA
 * compliance / a bodily reaction / a player-declared outcome dressed up as a relationship
 * change — none of which count on their own.
 */

/** CSA-performance or bodily-reaction-only justification — never sufficient alone for an affinity gain. */
const AFFINITY_ONLY_EVIDENCE_RE = /상식개변|상식.*수용|규범.*수행|접촉.*(거부하지|제지하지)|거절하지|얼굴.*(붉|홍조)|흥분|신음|성행위|성관계|절정|오르가즘|신체.*반응/;
/** A genuinely independent emotional/relational event — the only thing that can offset the above. */
const INDEPENDENT_AFFINITY_EVENT_RE = /의사(를)?\s*존중|약속(을)?\s*지키|위험.*(해결|구했)|업무.*(해결|도움)|신뢰.*(대화|얻)|감정.*(이해|공감)|상호.*합의.*친밀/;
/** A player-declared/self-reported outcome is never a valid basis for a stat change on its own. */
const PLAYER_DECLARED_RESULT_RE = /플레이어.*(선언|입력|작성)|(이미\s*)?(좋아|복종|오르가즘).*(입력|작성|선언)/;
/** Work-cooperation wording — routes to work_trust, never affinity, per the separation guard. */
const WORK_COOPERATION_RE = /업무|협조|보고서|회의|프로젝트|일정|출장|결재/;

export function hasAffinityOnlyEvidence(reason) {
  return typeof reason === 'string' && AFFINITY_ONLY_EVIDENCE_RE.test(reason);
}
export function hasIndependentAffinityEvent(reason) {
  return typeof reason === 'string' && INDEPENDENT_AFFINITY_EVENT_RE.test(reason);
}
export function hasPlayerDeclaredResultPattern(reason) {
  return typeof reason === 'string' && PLAYER_DECLARED_RESULT_RE.test(reason);
}
export function hasWorkCooperationEvidence(reason) {
  return typeof reason === 'string' && WORK_COOPERATION_RE.test(reason);
}

/**
 * Decides whether a proposed positive affinity delta survives the separation guards. Returns
 * { allowed, reason } — when not allowed, the caller zeroes the delta (never fails the turn)
 * and records the given reason as a warning.
 */
export function evaluateAffinityDelta(delta, reason) {
  if (delta <= 0) return { allowed: true };
  if (hasPlayerDeclaredResultPattern(reason)) return { allowed: false, code: 'player_declared_result_not_a_basis' };
  if (hasAffinityOnlyEvidence(reason) && !hasIndependentAffinityEvent(reason)) {
    return { allowed: false, code: 'csa_compliance_or_bodily_reaction_alone_not_affinity' };
  }
  return { allowed: true };
}
