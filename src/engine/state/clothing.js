/**
 * Story-grounded clothing continuity — canonical four-slot model.
 *
 * The canonical clothing model is exactly four slots with English enum values:
 *   uniform_top / uniform_bottom / underwear_top / underwear_bottom
 *   values: worn | removed | open | unknown (underwear: worn | removed | unknown)
 *
 * Extract output is normalized through SLOT_ALIASES / VALUE_ALIASES so the
 * free-form keys the model actually produces (bra, top, 셔츠, 속옷, ...) map onto
 * the canonical slots instead of being rejected. Ambiguous keys (속옷,
 * undergarments) that do not say top vs bottom are dropped with a warning —
 * never replicated onto both fields. Garment-name-only values (흰 셔츠, 검은
 * 팬츠) are NOT guessed as worn; the prompt must produce the enum.
 *
 * Rejected fields are omitted and never fail the turn.
 */

export const CLOTHING_VALUES = new Set(['worn', 'removed', 'open', 'unknown']);
export const UNDERWEAR_VALUES = new Set(['worn', 'removed', 'unknown']);
export const CANONICAL_CLOTHING_SLOTS = [
  'uniform_top',
  'uniform_bottom',
  'underwear_top',
  'underwear_bottom'
];

const LEGACY_SLOTS = new Set(CANONICAL_CLOTHING_SLOTS);
const UNDERWEAR_SLOTS = new Set(['underwear_top', 'underwear_bottom']);
const UNKNOWN_VALUES = new Set(['unknown', 'none', 'null', 'n/a', '알 수 없음', '미상']);

const SLOT_ALIASES = new Map([
  ['uniform_top', 'uniform_top'],
  ['top', 'uniform_top'],
  ['shirt', 'uniform_top'],
  ['blouse', 'uniform_top'],
  ['상의', 'uniform_top'],
  ['셔츠', 'uniform_top'],
  ['블라우스', 'uniform_top'],

  ['uniform_bottom', 'uniform_bottom'],
  ['bottom', 'uniform_bottom'],
  ['pants', 'uniform_bottom'],
  ['skirt', 'uniform_bottom'],
  ['하의', 'uniform_bottom'],
  ['팬츠', 'uniform_bottom'],
  ['바지', 'uniform_bottom'],
  ['치마', 'uniform_bottom'],

  ['underwear_top', 'underwear_top'],
  ['bra', 'underwear_top'],
  ['브라', 'underwear_top'],
  ['상의속옷', 'underwear_top'],

  ['underwear_bottom', 'underwear_bottom'],
  ['panties', 'underwear_bottom'],
  ['팬티', 'underwear_bottom'],
  ['하의속옷', 'underwear_bottom']
]);

const VALUE_ALIASES = new Map([
  ['worn', 'worn'],
  ['착용', 'worn'],
  ['착용중', 'worn'],
  ['입음', 'worn'],
  ['입고있음', 'worn'],

  ['removed', 'removed'],
  ['미착용', 'removed'],
  ['벗음', 'removed'],
  ['안입음', 'removed'],
  ['없음', 'removed'],

  ['open', 'open'],
  ['풀림', 'open'],
  ['풀어둠', 'open'],
  ['열림', 'open'],

  ['unknown', 'unknown'],
  ['미상', 'unknown'],
  ['알수없음', 'unknown']
]);

// 위·아래가 불명확해 한 슬롯으로 확정할 수 없는 키 — 임의 복제 금지, warning으로 버린다.
const AMBIGUOUS_SLOT_KEYS = new Set(['속옷', 'undergarments', '내의', '언더웨어']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value, maxLength = 180) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized || UNKNOWN_VALUES.has(normalized.toLowerCase())) return null;
  return Array.from(normalized).slice(0, maxLength).join('');
}

/** Extract가 낸 자유형 키를 canonical 슬롯으로 정규화한다. 매핑 불가면 null. */
export function canonicalClothingSlot(rawSlot) {
  if (typeof rawSlot !== 'string') return null;
  const key = rawSlot.trim().toLowerCase();
  if (!key) return null;
  if (AMBIGUOUS_SLOT_KEYS.has(key)) return null;
  return SLOT_ALIASES.get(key) ?? null;
}

/** Extract가 낸 자유형 값을 canonical enum으로 정규화한다. 매핑 불가면 null. */
export function canonicalClothingValue(slot, rawValue) {
  if (typeof rawValue !== 'string') return null;
  const key = rawValue.trim().toLowerCase();
  if (!key) return null;
  const value = VALUE_ALIASES.get(key) ?? null;
  if (!value) return null;
  // underwear 슬롯은 open을 허용하지 않는다.
  if (UNDERWEAR_SLOTS.has(slot) && value === 'open') return null;
  return value;
}

const MAGICAL_TRANSITION_RE = /(저절로|스스로|자동으로|순식간에|즉시)\s*(벗겨|풀리|사라지|열리|닫히)|규칙이?|시스템이|앱이\s*(옷|자세)|보이지\s*않는\s*손/;
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

/**
 * Extract가 제안한 복장 변경을 canonical 슬롯으로 정규화하고, 각 변경 필드마다
 * Story 증거를 요구한다. 유지되는 필드는 출력하지 않는다 (변경만 반영).
 * 반환: { clothing, rejections }
 */
export function retainEvidencedClothing({ previousClothing = {}, proposedClothing = {}, evidenceMap = {}, narrativeText = '', characterName = '' } = {}) {
  const previous = isPlainObject(previousClothing) ? previousClothing : {};
  const proposed = isPlainObject(proposedClothing) ? proposedClothing : {};
  const evidence = isPlainObject(evidenceMap) ? evidenceMap : {};
  const clothing = {};
  const rejections = [];
  for (const [rawSlot, rawValue] of Object.entries(proposed)) {
    const slot = canonicalClothingSlot(rawSlot);
    if (!slot) {
      rejections.push(`invalid_clothing_key:${String(rawSlot).slice(0, 40)}`);
      continue;
    }
    const nextValue = canonicalClothingValue(slot, rawValue);
    if (nextValue === null) {
      rejections.push(`invalid_clothing_value:${slot}`);
      continue;
    }
    if (nextValue === previous[slot]) continue;
    // evidence는 slot 기준 — Extract는 canonical 키로 evidence를 내야 한다.
    const evidenceText = evidence[slot] ?? evidence[rawSlot] ?? null;
    if (!evaluateClothingFieldEvidence(evidenceText, narrativeText, characterName)) {
      rejections.push(`unevidenced_clothing_change:${slot}`);
      continue;
    }
    clothing[slot] = nextValue;
  }
  return { clothing, rejections };
}

/**
 * 규정상 요구되는 복장 — 활성 CSA preset에서 deterministic하게 계산한다.
 * work_in_underwear_only: 겉옷 벗음 + 속옷 착용
 * work_without_underwear: 속옷 벗음
 */
export function requiredClothingFromActiveCsa(activeRules = []) {
  const required = {};
  for (const rule of activeRules) {
    const templateId = rule?.preset?.template_id;
    if (templateId === 'work_in_underwear_only') {
      required.uniform_top = 'removed';
      required.uniform_bottom = 'removed';
      required.underwear_top = 'worn';
      required.underwear_bottom = 'worn';
    }
    if (templateId === 'work_without_underwear') {
      required.underwear_top = 'removed';
      required.underwear_bottom = 'removed';
    }
  }
  return required;
}

/**
 * 실제 착의와 규정상 요구 착의를 비교한다.
 * - not_applicable: 요구 슬롯 없음
 * - unknown: 실제 값이 비어 있거나 unknown (준수 주장 금지)
 * - compliant: 모든 요구 슬롯이 정확히 일치
 * - noncompliant: 하나라도 다름
 */
export function compareRequiredClothing(actual = {}, required = {}) {
  const keys = Object.keys(required);
  if (!keys.length) return 'not_applicable';
  if (keys.some(key => actual[key] === undefined || actual[key] === 'unknown')) {
    return 'unknown';
  }
  if (keys.every(key => actual[key] === required[key])) {
    return 'compliant';
  }
  return 'noncompliant';
}

/**
 * 첫 관찰 NPC deterministic seed — 규정 활성 당시 현장에 없었고,
 * 항시 적용 규정 아래 처음 관찰된 NPC이며 기존 clothing이 완전히 비어 있으면
 * 규정상 요구 착의를 서버가 정본으로 확정한다. (Story projection과 Commit 공용)
 * 반환: { seeded: boolean, clothing }
 */
export function seedFirstObservedClothing({ npcId, activeRules = [], previousClothing = {} } = {}) {
  if (!npcId || !Array.isArray(activeRules) || activeRules.length === 0) {
    return { seeded: false, clothing: {} };
  }
  const previous = isPlainObject(previousClothing) ? previousClothing : {};
  if (Object.keys(previous).length > 0) {
    return { seeded: false, clothing: {} };
  }
  const required = requiredClothingFromActiveCsa(activeRules);
  if (Object.keys(required).length === 0) {
    return { seeded: false, clothing: {} };
  }
  return { seeded: true, clothing: required };
}
