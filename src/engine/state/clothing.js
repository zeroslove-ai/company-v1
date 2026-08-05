/**
 * Story-grounded clothing continuity.
 *
 * The legacy four slots and values remain readable for old saves. They are not
 * the complete clothing model: Extract may add any concise Korean garment key
 * and Korean state text when an exact Story quote proves that character
 * completed the action. Rejected fields are omitted and never fail the turn.
 */

export const CLOTHING_VALUES = new Set(['worn', 'removed', 'open', 'unknown']);
export const UNDERWEAR_VALUES = new Set(['worn', 'removed', 'unknown']);
const LEGACY_SLOTS = new Set(['uniform_top', 'uniform_bottom', 'underwear_top', 'underwear_bottom']);
const UNDERWEAR_SLOTS = new Set(['underwear_top', 'underwear_bottom']);
const UNKNOWN_VALUES = new Set(['unknown', 'none', 'null', 'n/a', '알 수 없음', '미상']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value, maxLength = 180) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized || UNKNOWN_VALUES.has(normalized.toLowerCase())) return null;
  return Array.from(normalized).slice(0, maxLength).join('');
}

function hasKorean(value) {
  return typeof value === 'string' && /[가-힣]/.test(value);
}

const MAGICAL_TRANSITION_RE = /(저절로|스스로|자동으로|순식간에|즉시)\s*(벗겨|풀리|사라지|열리|닫히)|규칙이?\s*적용되자|시스템이|앱이\s*(옷|자세)|보이지\s*않는\s*손/;
export function isMagicalPhysicalTransitionEvidence(evidence) {
  return typeof evidence === 'string' && MAGICAL_TRANSITION_RE.test(evidence);
}

const PLANNING_ONLY_RE = /(으?려고\s*(한다|했다)|할\s*예정|하기로\s*했다|막\s*하려던\s*참|아직\s*(벗지|입지)\s*않)/;
export function isPlanningOnlyEvidence(evidence) {
  return typeof evidence === 'string' && PLANNING_ONLY_RE.test(evidence);
}

export function evidenceIdentifiesCharacter(evidence, narrativeText, characterName) {
  if (typeof evidence !== 'string' || !evidence.trim()) return false;
  const quote = evidence.trim();
  const text = typeof narrativeText === 'string' ? narrativeText : '';
  if (!text.includes(quote)) return false;
  if (typeof characterName === 'string' && characterName.trim() && !quote.includes(characterName.trim())) return false;
  return true;
}

export function evaluateClothingFieldEvidence(evidence, narrativeText, characterName) {
  if (typeof evidence !== 'string' || !evidence.trim()) return false;
  if (isMagicalPhysicalTransitionEvidence(evidence)) return false;
  if (isPlanningOnlyEvidence(evidence)) return false;
  return evidenceIdentifiesCharacter(evidence, narrativeText, characterName);
}

function normalizeSlotValue(slot, value) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (!LEGACY_SLOTS.has(slot)) return hasKorean(slot) && hasKorean(normalized) ? normalized : null;
  const allowed = UNDERWEAR_SLOTS.has(slot) ? UNDERWEAR_VALUES : CLOTHING_VALUES;
  if (allowed.has(normalized)) return normalized;
  return hasKorean(normalized) ? normalized : null;
}

export function retainEvidencedClothing({ previousClothing = {}, proposedClothing = {}, evidenceMap = {}, narrativeText = '', characterName = '' } = {}) {
  const previous = isPlainObject(previousClothing) ? previousClothing : {};
  const proposed = isPlainObject(proposedClothing) ? proposedClothing : {};
  const evidence = isPlainObject(evidenceMap) ? evidenceMap : {};
  const clothing = {};
  const rejections = [];
  for (const [rawSlot, rawValue] of Object.entries(proposed)) {
    const slot = normalizeText(rawSlot, 60);
    if (!slot) continue;
    const nextValue = normalizeSlotValue(slot, rawValue);
    if (nextValue === null) {
      rejections.push(`invalid_clothing_value:${slot}`);
      continue;
    }
    if (nextValue === previous[slot]) continue;
    if (!evaluateClothingFieldEvidence(evidence[slot], narrativeText, characterName)) {
      rejections.push(`unevidenced_clothing_change:${slot}`);
      continue;
    }
    clothing[slot] = nextValue;
  }
  return { clothing, rejections };
}
