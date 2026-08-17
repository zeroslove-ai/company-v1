import { expForNextLevel } from '../progression.js';
import { authorityPolicyFor } from './authority-policy.js';

/**
 * Level/EXP/slot/strength arithmetic — the single canonical source every
 * caller (UI, manual payload, catalog availability, preset validator,
 * custom validator, transaction planner) must use. The donor kept three
 * independently-threshold tables (getCsaLimits / getCsaStrengthLimits /
 * calculateCsaCapability's own inline threshold) that didn't fully agree
 * with each other; that divergence is not preserved here. Canonical
 * numbers: weak unlocks at Lv.1, medium at Lv.3, strong at Lv.7; slots are
 * 2 at Lv.1, 3 at Lv.3, 4 at Lv.5, 5 at Lv.10.
 */

export const APP_STRENGTHS = new Set(['weak', 'medium', 'strong']);
export const APP_STRENGTH_LABELS = Object.fromEntries(['weak', 'medium', 'strong'].map(id => [id, authorityPolicyFor(id).label]));
export const STRENGTH_TIERS_KO = ['weak', 'medium', 'strong'].map(id => authorityPolicyFor(id).label);
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

/** Display/payload single source: current level/exp, available strength, and slot usage. */
export function calculateCsaCapability(save = {}, activeCsaCount = 0) {
  const level = Math.max(1, Number(save?.player_progress?.level) || 1);
  const exp = Math.max(0, Number(save?.player_progress?.exp) || 0);
  const nextLevelExp = level >= 10 ? 0 : (expForNextLevel(level) ?? 0);
  const availableStrength = level >= 7 ? authorityPolicyFor('strong').label : level >= 3 ? authorityPolicyFor('medium').label : authorityPolicyFor('weak').label;
  const maxStrengthRank = csaStrengthRank(availableStrength);
  const csaLimits = getCsaLimits(level);
  return {
    current_level: level,
    exp,
    next_level_exp: nextLevelExp,
    available_strength: availableStrength,
    available_strength_id: appStrengthId(availableStrength),
    max_strength_rank: maxStrengthRank,
    can_use_weak: true,
    can_use_medium: maxStrengthRank >= 1,
    can_use_strong: maxStrengthRank >= 2,
    csa_active_count: activeCsaCount,
    csa_max_active: csaLimits.max_active
  };
}
