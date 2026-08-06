/**
 * npc_stats reducer — affinity/csa_acceptance/sexual_arousal, each clamped
 * per-turn and re-clamped to [0,100] overall. Ported from donor's applyNpcStatChanges clamp
 * discipline (a delta exceeding its per-turn cap is zeroed entirely, not truncated — a runaway
 * proposal is rejected outright rather than silently capped to the max, so an LLM proposing
 * +80 affinity in one turn doesn't quietly become a same-turn +5). affinity additionally runs
 * through evaluateAffinityDelta so CSA compliance / bodily reactions / player-declared results
 * never buy a relationship gain on their own.
 */
import { evaluateAffinityDelta } from './guards.js';

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
export function applyNpcStatChanges(previous = {}, deltas = {}, { reason = '' } = {}) {
  const base = isPlainObject(previous) ? previous : {};
  const proposed = isPlainObject(deltas) ? deltas : {};
  const warnings = [];
  const state = {};
  for (const key of STATS) {
    const current = clamp(Number.isFinite(base[key]) ? base[key] : 0, 0, 100);
    let delta = Number.isFinite(proposed[key]) ? proposed[key] : 0;
    if (delta > MAX_DELTA[key] || delta < MIN_DELTA[key]) {
      warnings.push(`stat_delta_out_of_range:${key}`);
      delta = 0;
    }
    if (key === 'affinity' && delta > 0) {
      const verdict = evaluateAffinityDelta(delta, reason);
      if (!verdict.allowed) {
        warnings.push(verdict.code);
        delta = 0;
      }
    }
        state[key] = clamp(current + delta, 0, 100);
  }
  // resistance는 이 reducer의 변경 대상이 아니다 — 유효한 기존 값이 있으면 새 state에 보존한다.
  // Extract가 resistance delta를 제안해도 별도 허용 계약이 없으므로 무시하고 warning만 남긴다.
  if (Number.isFinite(base.resistance)) state.resistance = clamp(base.resistance, 0, 100);
  if (Number.isFinite(proposed.resistance)) warnings.push('stat_resistance_change_ignored');
  return { state, warnings };
}
