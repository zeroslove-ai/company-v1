/**
 * Clothing continuity — ported from donor's npc_scene_state clothing contract
 * (retainEvidencedNpcSceneStatePatch + its evidence-pattern helpers). Applies
 * identically to the player and to any NPC: a clothing slot only ever
 * changes when the final Story text actually shows that specific character
 * completing a real physical action on it — never merely because a CSA
 * activated, updated, or deactivated this turn, and never because a scene
 * transitioned. A field with no surviving evidence is simply omitted from
 * the patch; the previous value is carried forward untouched, and the turn
 * never fails over it.
 */

export const CLOTHING_VALUES = new Set(['worn', 'removed', 'open', 'unknown']);
export const UNDERWEAR_VALUES = new Set(['worn', 'removed', 'unknown']);
const CLOTHING_SLOTS = ['uniform_top', 'uniform_bottom', 'underwear_top', 'underwear_bottom'];
const UNDERWEAR_SLOTS = new Set(['underwear_top', 'underwear_bottom']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** A change attributed to the system/rule/app itself, not a real physical action, is never trusted. */
const MAGICAL_TRANSITION_RE = /(저절로|스스로|자동으로|순식간에|즉시)\s*(벗겨|풀리|사라지|열리|닫히)|규칙이?\s*적용되자|시스템이|앱이\s*(옷|자세)|보이지\s*않는\s*손/;
export function isMagicalPhysicalTransitionEvidence(evidence) {
  return typeof evidence === 'string' && MAGICAL_TRANSITION_RE.test(evidence);
}

/** Evidence describing an intent/plan to act, not the act having actually happened yet. */
const PLANNING_ONLY_RE = /(으?려고\s*(한다|했다)|할\s*예정|하기로\s*했다|막\s*하려던\s*참|아직\s*(벗지|입지)\s*않)/;
export function isPlanningOnlyEvidence(evidence) {
  return typeof evidence === 'string' && PLANNING_ONLY_RE.test(evidence);
}

/** The evidence sentence must actually name/identify the character it's claimed to be about. */
export function evidenceIdentifiesCharacter(evidence, narrativeText, characterName) {
  if (typeof evidence !== 'string' || !evidence.trim()) return false;
  const text = typeof narrativeText === 'string' ? narrativeText : '';
  if (!text.includes(evidence)) return false;
  if (typeof characterName === 'string' && characterName.trim() && !text.includes(characterName)) return false;
  return true;
}

export function evaluateClothingFieldEvidence(evidence, narrativeText, characterName) {
  if (typeof evidence !== 'string' || !evidence.trim()) return false;
  if (isMagicalPhysicalTransitionEvidence(evidence)) return false;
  if (isPlanningOnlyEvidence(evidence)) return false;
  return evidenceIdentifiesCharacter(evidence, narrativeText, characterName);
}

function normalizeSlotValue(slot, value) {
  const allowed = UNDERWEAR_SLOTS.has(slot) ? UNDERWEAR_VALUES : CLOTHING_VALUES;
  return allowed.has(value) ? value : null;
}

/**
 * Diffs a proposed clothing object against the previous one and keeps only the slots that
 * (a) actually changed value and (b) have their own narrative-quote evidence surviving every
 * gate above. Rejected/no-op slots are simply left out of the returned patch — never an error,
 * never a whole-turn failure. Returns { clothing, rejections } where clothing only contains
 * surviving fields (spread onto the previous value by the caller).
 */
export function retainEvidencedClothing({ previousClothing = {}, proposedClothing = {}, evidenceMap = {}, narrativeText = '', characterName = '' } = {}) {
  const previous = isPlainObject(previousClothing) ? previousClothing : {};
  const proposed = isPlainObject(proposedClothing) ? proposedClothing : {};
  const evidence = isPlainObject(evidenceMap) ? evidenceMap : {};
  const clothing = {};
  const rejections = [];
  for (const slot of CLOTHING_SLOTS) {
    if (!(slot in proposed)) continue;
    const nextValue = normalizeSlotValue(slot, proposed[slot]);
    if (nextValue === null) { rejections.push(`invalid_clothing_value:${slot}`); continue; }
    if (nextValue === previous[slot]) continue; // already this value — not a change, no evidence needed
    if (!evaluateClothingFieldEvidence(evidence[slot], narrativeText, characterName)) {
      rejections.push(`unevidenced_clothing_change:${slot}`);
      continue;
    }
    clothing[slot] = nextValue;
  }
  return { clothing, rejections };
}
