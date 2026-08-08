/**
 * Player level/exp progression — ported verbatim from donor's live, reachable
 * calculateProgress/calculateCsaProgression/expForNextLevel (worker/game-proxy-v2.js:8249-8263,
 * called every commit from buildSavePatch, confirmed via a live-caller trace, not from
 * build-csa-deactivation-hotfix.mjs/.parts/*.part). Company had no progression writer of its
 * own before this — only a read-only capability.js that consumes whatever level/exp already
 * sits in player_progress. This is the only writer; no invented "+N exp per turn" rule.
 */
const CSA_LEVEL_EXP_REQUIREMENTS = [15, 23, 50, 63, 75, 105, 120, 135, 150];
const MAX_LEVEL = 10;
const MAX_EXP_PER_TURN = 3;

/** Exp required to advance FROM this level to the next; null at/above MAX_LEVEL (nothing further to require). */
export function expForNextLevel(level) {
  const index = Math.max(1, Number(level) || 1) - 1;
  return index < CSA_LEVEL_EXP_REQUIREMENTS.length ? CSA_LEVEL_EXP_REQUIREMENTS[index] : null;
}

/** previous: { level, exp }. amount: non-negative exp to add. Returns { level, exp, leveled_up }. */
export function calculateProgress(previous = {}, amount = 0) {
  let level = Math.max(1, Number(previous?.level) || 1);
  let exp = Math.max(0, Number(previous?.exp) || 0);
  exp += Math.max(0, Number(amount) || 0);
  let leveledUp = false;
  while (level < MAX_LEVEL) {
    const required = expForNextLevel(level);
    if (required === null || exp < required) break;
    exp -= required;
    level += 1;
    leveledUp = true;
  }
  if (level >= MAX_LEVEL) exp = Math.min(exp, expForNextLevel(MAX_LEVEL - 1) ?? exp);
  return { level, exp, leveled_up: leveledUp };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * csaOperations: this turn's canonical CSA operations (from a committed app_transaction), if any.
 * experiencedThisTurn: [{character_id, csa_id}] — every CSA-relevant
 * event that actually happened in this turn's committed Story/Extract.
 * previouslyExperienced: Set of "characterId:csaId" keys already logged in prior turns.
 * degraded: true when this turn's Extract was a degraded fallback (donor: no exp on a degraded turn).
 * Returns { amount, newly_experienced_keys } — amount is already capped to MAX_EXP_PER_TURN.
 */
export function calculateCsaProgression({ csaOperations = [], experiencedThisTurn = [], previouslyExperienced = new Set(), degraded = false } = {}) {
  if (degraded) return { amount: 0, newly_experienced_keys: [] };
  let amount = 0;
  for (const operation of (Array.isArray(csaOperations) ? csaOperations : [])) {
    if (operation?.operation === 'activate') amount += 3;
    else if (operation?.operation === 'update') amount += 1;
  }
  const newlyExperiencedKeys = [];
  for (const entry of (Array.isArray(experiencedThisTurn) ? experiencedThisTurn : [])) {
    if (!isPlainObject(entry) || !entry.character_id || !entry.csa_id) continue;
    const key = `${entry.character_id}:${entry.csa_id}`;
    if (previouslyExperienced.has(key) || newlyExperiencedKeys.includes(key)) { amount += 1; continue; }
    newlyExperiencedKeys.push(key);
    amount += 2;
  }
  return { amount: Math.min(MAX_EXP_PER_TURN, amount), newly_experienced_keys: newlyExperiencedKeys };
}
