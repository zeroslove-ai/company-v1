/**
 * npc_stats reducer — affinity/csa_acceptance/sexual_arousal/work_trust, each clamped
 * per-turn and re-clamped to [0,100] overall. Ported from donor's applyNpcStatChanges clamp
 * discipline (a delta exceeding its per-turn cap is zeroed entirely, not truncated — a runaway
 * proposal is rejected outright rather than silently capped to the max, so an LLM proposing
 * +80 affinity in one turn doesn't quietly become a same-turn +5). affinity additionally runs
 * through evaluateAffinityDelta so CSA compliance / bodily reactions / player-declared results
 * never buy a relationship gain on their own — work_trust is Company's own separate axis for
 * exactly the "work cooperation" evidence affinity must reject.
 */
import { evaluateAffinityDelta, hasWorkCooperationEvidence } from './guards.js';

const MAX_DELTA = { affinity: 5, csa_acceptance: 30, sexual_arousal: 15, work_trust: 5 };
const MIN_DELTA = { affinity: -5, csa_acceptance: -20, sexual_arousal: -20, work_trust: -5 };
const STATS = ['affinity', 'csa_acceptance', 'sexual_arousal', 'work_trust'];

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
    if (key === 'work_trust' && delta > 0 && !hasWorkCooperationEvidence(reason) && Number.isFinite(proposed.affinity) && proposed.affinity > 0) {
      // A work_trust gain proposed alongside an affinity gain, with no work-specific evidence at
      // all, is likely the same mis-attributed event duplicated across both axes.
      warnings.push('work_trust_delta_missing_work_evidence');
      delta = 0;
    }
    state[key] = clamp(current + delta, 0, 100);
  }
  return { state, warnings };
}
