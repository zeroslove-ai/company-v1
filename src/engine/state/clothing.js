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
 *
 * Clothing is ONLY ever written through the evidence-based physical-state merge
 * (retainEvidencedClothing → buildSceneStatePatch). Rules alone never create or
 * change clothing; there is no automatic seed/observation inference engine.
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

// 규정·지시 문구 — "~해야 한다" 형태의 규정 텍스트는 실제 착의 행동 근거가 아니다.
const REGULATION_DIRECTIVE_RE = /해야\s*한다|하여야\s*한다|준수해야|유지해야\s*한다|따라야\s*한다|지켜야\s*한다/;
export function isRegulationDirectiveEvidence(evidence) {
  return typeof evidence === 'string' && REGULATION_DIRECTIVE_RE.test(evidence);
}

const PLANNING_ONLY_RE = /(으?려고\s*(한다|했다)|벗으려고|입으려고|갈아입으려고|풀으려고|걸치려고|하려고\s*(한다|했다)|할\s*예정|하려는\s*참|하기로\s*했다|막\s*하려던\s*참|아직\s*(벗지|입지)\s*않)/;
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

/**
 * 착의 evidence 승인 — exact quote + magic/planning 차단 + 귀속 검증.
 *
 * NPC 이름 요구의 유일한 예외:
 *   actor-scoped nested evidence(evidence.clothing[actor_id][slot]) + 현재 장면
 *   비플레이어 NPC가 정확히 1명 + actor가 그 유일한 NPC일 때는 quote에 대상
 *   이름이 없어도 actor_id 귀속으로 허용한다. "그녀가" 같은 대명사는 해석하지
 *   않는다 — 귀속은 nested 구조가 확정한다. 단, quote에 다른 등록 NPC 이름이
 *   명시돼 있으면 잘못된 귀속으로 거부한다.
 *
 * flat evidence(evidence.clothing[slot])와 다중 NPC 장면은 기존 strict 정책을
 * 유지한다 — NPC quote에는 등록 이름이 필요하다.
 */
export function evaluateClothingFieldEvidence(evidence, narrativeText, characterName, { actorId = null, npcsPresent = [], registeredNpcNames = [] } = {}) {
  if (typeof evidence !== 'string' || !evidence.trim()) return false;
  const quote = evidence.trim();
  const text = typeof narrativeText === 'string' ? narrativeText : '';
  if (!text.includes(quote)) return false;
  if (isMagicalPhysicalTransitionEvidence(evidence)) return false;
  if (isPlanningOnlyEvidence(evidence)) return false;
  if (isRegulationDirectiveEvidence(evidence)) return false;

  // 단일 물리적 NPC 장면 — 이름 없어도 허용, 다른 NPC 이름 충돌은 거부.
  const singleNpcScene = Array.isArray(npcsPresent) && npcsPresent.length === 1 && npcsPresent[0] === actorId;
  if (singleNpcScene) {
    const targetName = typeof characterName === 'string' ? characterName.trim() : '';
    const conflictingName = (Array.isArray(registeredNpcNames) ? registeredNpcNames : [])
      .find(name => typeof name === 'string' && name && name !== targetName && quote.includes(name));
    return !conflictingName;
  }

  // 기본 정책 — NPC는 quote에 등록 이름 명시 필요 (player는 이름 불요).
  if (typeof characterName === 'string' && characterName.trim() && !quote.includes(characterName.trim())) return false;
  return true;
}

/**
 * Extract가 제안한 복장 변경을 canonical 슬롯으로 정규화하고, actor 단위 증거 하나로
 * 검증한다. evidence.clothing[actor_id] = {quote, character_id} — actor당 quote 하나.
 * quote가 유효하면 제안된 canonical clothing patch 전체를 적용한다 (slot별 의미 검증 없음).
 * 이것이 actual clothing을 쓰는 유일한 경로다 — 규정/관찰/장면 참여만으로는
 * clothing을 생성하지 않는다.
 */
export function retainEvidencedClothing({ previousClothing = {}, proposedClothing = {}, evidenceMap = null, narrativeText = '', characterName = '', actorId = null, npcsPresent = [], registeredNpcNames = [] } = {}) {
  const previous = isPlainObject(previousClothing) ? previousClothing : {};
  const proposed = isPlainObject(proposedClothing) ? proposedClothing : {};
  const clothing = {};
  const rejections = [];

  // canonical 정규화 — 제안된 슬롯을 canonical 4슬롯으로 변환 (잘못된 키/값은 거부).
  // 이미 같은 값(no-op)은 검증 없이 통과 — 재증거 불필요.
  const normalizedProposal = {};
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
    normalizedProposal[slot] = nextValue;
  }
  if (Object.keys(normalizedProposal).length === 0) return { clothing, rejections };

  // actor당 quote 하나 — 유효하면 제안 전체 적용 (slot별 의미 정규식 검증 없음)
  const quote = typeof evidenceMap === 'string' && evidenceMap.trim() ? evidenceMap.trim() : null;
  if (!evaluateClothingFieldEvidence(quote, narrativeText, characterName, {
    actorId, npcsPresent, registeredNpcNames
  })) {
    rejections.push('unevidenced_clothing_change');
    return { clothing, rejections };
  }
  for (const [slot, nextValue] of Object.entries(normalizedProposal)) {
    if (nextValue === previous[slot]) continue;
    clothing[slot] = nextValue;
  }
  return { clothing, rejections };
}

/** 규정이 요구하는 착의 template — canonical slot → enum. */
/**
 * NPC별 규정상 요구 착의 — 최소 정책 (추론·우선순위 없음).
 *
 * 반환:
 *   { required_clothing, source_csa_id, conflicted }
 *
 * - 해당 NPC에 적용되는 활성 착의 규정 0개 → required_clothing={}
 * - 정확히 1개 → 해당 규정의 요구 착의 + source_csa_id
 * - 서로 다른 착의를 요구하는 규정 2개 이상 → required_clothing={}, conflicted=true
 *
 * affected_group 필터:
 * - female_employee 규정은 gender==='female'인 NPC에게만 적용 (gender 미상은 미적용)
 * - male_employee 규정은 gender==='male'인 NPC에게만 적용
 * - on_player_request 규정은 실제 요청 전 required clothing을 만들지 않음
 *
 * 규정 우선순위(strength/updated_turn/created_turn)는 추론하지 않는다.
 */
/**
 * 실제 착의와 규정상 요구 착의를 비교한다.
 * - not_applicable: 요구 슬롯 없음 (conflicted 포함)
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
