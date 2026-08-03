/**
 * Level/EXP/slot/strength arithmetic ported verbatim from the donor's final
 * numbers (docs: getCsaLimits / getCsaStrengthLimits / calculateCsaCapability).
 * The donor itself keeps three independently-threshold tables that don't
 * fully agree with each other (a pre-existing donor quirk, not introduced
 * here) — each is preserved exactly, used at the same call sites donor uses
 * them, rather than reconciled into a single "corrected" table.
 */

export const STRENGTH_TIERS_KO = ['약함', '중간', '강함'];
export const APP_STRENGTHS = new Set(['weak', 'medium', 'strong']);
export const APP_STRENGTH_LABELS = { weak: '약함', medium: '중간', strong: '강함' };
export const APP_STRENGTH_RANK = { weak: 1, medium: 2, strong: 3 };
export const APP_STRENGTH_UNLOCKS = { weak: 1, medium: 3, strong: 7 };

export function appStrengthId(value) {
  if (typeof value !== 'string') return 'weak';
  const normalized = value.trim();
  if (Object.prototype.hasOwnProperty.call(APP_STRENGTH_RANK, normalized)) return normalized;
  return Object.entries(APP_STRENGTH_LABELS).find(([, label]) => label === normalized)?.[0] ?? 'weak';
}

export function csaStrengthRank(strength) {
  const index = STRENGTH_TIERS_KO.indexOf(strength);
  return index === -1 ? 0 : index;
}

/** Enforcement-path slot cap, keyed by level. Used by the transaction planner's activate/update slot check. */
export function getCsaLimits(level) {
  const clamped = Math.max(1, Number(level) || 1);
  if (clamped >= 10) return { max_active: 5 };
  if (clamped >= 5) return { max_active: 4 };
  if (clamped >= 3) return { max_active: 3 };
  return { max_active: 2 };
}

/** Enforcement-path strength cap, keyed by level. Independent table from getCsaLimits — see module docstring. */
export function getCsaStrengthLimits(level) {
  const clamped = Math.max(1, Number(level) || 1);
  const availableStrength = clamped >= 5 ? '강함' : clamped >= 3 ? '중간' : '약함';
  const maxActive = clamped >= 8 ? 4 : clamped >= 5 ? 3 : clamped >= 3 ? 2 : 1;
  return { max_active: maxActive, available_strength: availableStrength };
}

function expForNextLevel(level) {
  return Math.max(1, Number(level) || 1) * 100;
}

/** Display/payload single source: current level/exp, available strength, and slot usage. */
export function calculateCsaCapability(save = {}, activeCsaCount = 0) {
  const level = Math.max(1, Number(save?.player_progress?.level) || 1);
  const exp = Math.max(0, Number(save?.player_progress?.exp) || 0);
  const nextLevelExp = level >= 10 ? 0 : expForNextLevel(level);
  const availableStrength = level >= 7 ? '강함' : level >= 3 ? '중간' : '약함';
  const maxStrengthRank = csaStrengthRank(availableStrength);
  const csaLimits = getCsaLimits(level);
  return {
    current_level: level,
    exp,
    next_level_exp: nextLevelExp,
    available_strength: availableStrength,
    max_strength_rank: maxStrengthRank,
    can_use_weak: true,
    can_use_medium: maxStrengthRank >= 1,
    can_use_strong: maxStrengthRank >= 2,
    csa_active_count: activeCsaCount,
    csa_max_active: csaLimits.max_active
  };
}
