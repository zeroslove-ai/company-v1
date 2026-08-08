/**
 * npc_stats reducer — affinity/csa_acceptance/sexual_arousal, each clamped
 * per-turn and re-clamped to [0,100] overall. Ported from donor's applyNpcStatChanges clamp
 * discipline (a delta exceeding its per-turn cap is zeroed entirely, not truncated — a runaway
 * proposal is rejected outright rather than silently capped to the max, so an LLM proposing
 * +80 affinity in one turn doesn't quietly become a same-turn +5).
 * Delta contract: only explicit `*_delta` fields are accepted; ambiguous absolute fields
 * (affinity, csa_acceptance, sexual_arousal) are discarded with a warning. Semantic meaning
 * rules (CSA compliance / bodily reactions never buy a relationship gain) live in the Extract
 * prompt and tests, not in a server-side regex gate.
 */

const MAX_DELTA = { affinity: 5, csa_acceptance: 30, sexual_arousal: 15 };
const MIN_DELTA = { affinity: -5, csa_acceptance: -20, sexual_arousal: -20 };
const STATS = ['affinity', 'csa_acceptance', 'sexual_arousal'];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * previous: { affinity, csa_acceptance, sexual_arousal, work_trust } (missing = 0).
 * deltas: { affinity, csa_acceptance, sexual_arousal, work_trust } (proposed changes, any subset).
 * reason: the Extract-reported justification string for this NPC's changes this turn.
 * Returns { state, warnings }.
 */
export function applyNpcStatChanges(previous = {}, deltas = {}, { reason = '', reasons = {} } = {}) {
  const base = isPlainObject(previous) ? previous : {};
  const proposed = isPlainObject(deltas) ? deltas : {};
  const warnings = [];
  const state = {};
  for (const key of STATS) {
    const current = clamp(Number.isFinite(base[key]) ? base[key] : 0, 0, 100);
    // 기존 모호 필드(절대값/증감량 불명)는 더 이상 받지 않는다 — 목표값으로 오인해
    // 턴 delta로 해석하는 계약 충돌을 제거한다. 발견 시 warning + 폐기.
    if (proposed[key] !== undefined) {
      warnings.push(`ambiguous_npc_stat_absolute_ignored:${key}`);
    }
    const raw = proposed[`${key}_delta`];
    let delta = Number.isInteger(raw) ? raw : 0;
    if (delta > MAX_DELTA[key] || delta < MIN_DELTA[key]) {
      warnings.push(`stat_delta_out_of_range:${key}`);
      delta = 0;
    }
    state[key] = clamp(current + delta, 0, 100);
  }
  // resistance는 이 reducer의 변경 대상이 아니다 — 유효한 기존 값이 있으면 새 state에 보존한다.
  // Extract가 resistance delta를 제안해도 별도 허용 계약이 없으므로 무시하고 warning만 남긴다.
  if (Number.isFinite(base.resistance)) state.resistance = clamp(base.resistance, 0, 100);
  if (proposed.resistance !== undefined || proposed.resistance_delta !== undefined) warnings.push('stat_resistance_change_ignored');
  return { state, warnings };
}
