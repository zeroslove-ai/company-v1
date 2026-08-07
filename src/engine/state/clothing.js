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
 *
 * 반환 구조:
 *   required_clothing  — slot → enum (충돌 시 해당 slot은 'unknown')
 *   contributing_rule_ids — 착의 요구를 만든 규정 ID 목록
 *   slot_sources       — slot → { csa_id, value, strength, created_turn, updated_turn, activated_game_time }
 *   conflicts          — 동률 충돌이 발생한 slot 목록
 *
 * 상반 규정 충돌 우선순위 계약:
 *   1. 더 높은 strength
 *   2. strength 동일 → 더 최신 updated_turn
 *   3. 그다음 created_turn 또는 activated_game_time (더 최신)
 *   4. 그래도 동일 → conflict — 해당 slot을 unknown으로 표시하고 양쪽 ID 기록
 *
 * 입력 순서(객체 삽입 순서)는 결과에 영향을 주지 않는다.
 */
export function requiredClothingFromActiveCsa(activeRules = []) {
  const slotCandidates = new Map(); // slot -> [{ rule, value, rank }]
  const contributing = new Set();
  const conflicts = [];
  const required = {};

  const STRENGTH_RANK = { weak: 1, medium: 2, strong: 3 };

  const pushCandidate = (slot, value, rule) => {
    if (!slot || !value) return;
    contributing.add(rule?.csa_id ?? rule?.id ?? 'unknown');
    if (!slotCandidates.has(slot)) slotCandidates.set(slot, []);
    slotCandidates.get(slot).push({ rule, value });
  };

  for (const rule of activeRules) {
    const templateId = rule?.preset?.template_id;
    if (templateId === 'work_in_underwear_only') {
      pushCandidate('uniform_top', 'removed', rule);
      pushCandidate('uniform_bottom', 'removed', rule);
      pushCandidate('underwear_top', 'worn', rule);
      pushCandidate('underwear_bottom', 'worn', rule);
    }
    if (templateId === 'work_without_underwear') {
      pushCandidate('underwear_top', 'removed', rule);
      pushCandidate('underwear_bottom', 'removed', rule);
    }
  }

  const slotSources = {};
  for (const [slot, candidates] of slotCandidates.entries()) {
    const ranked = [...candidates].sort((a, b) => compareRulePriority(a.rule, b.rule));
    const best = ranked[0];
    const tied = ranked.filter(c => compareRulePriority(c.rule, best.rule) === 0);
    if (tied.length > 1) {
      // 완전 동률 — conflict. 해당 slot을 unknown으로 표시하고 양쪽 ID 기록.
      required[slot] = 'unknown';
      conflicts.push(slot);
      slotSources[slot] = {
        csa_id: best.rule?.csa_id ?? best.rule?.id ?? 'unknown',
        value: 'unknown',
        strength: best.rule?.strength ?? 'weak',
        created_turn: typeof best.rule?.created_turn === 'number' ? best.rule.created_turn : null,
        updated_turn: typeof best.rule?.updated_turn === 'number' ? best.rule.updated_turn : null,
        activated_game_time: object(best.rule?.activated_game_time) ? best.rule.activated_game_time : null,
        conflict_with: tied.map(c => c.rule?.csa_id ?? c.rule?.id ?? 'unknown').filter((id, i, arr) => arr.indexOf(id) === i)
      };
      continue;
    }
    required[slot] = best.value;
    slotSources[slot] = {
      csa_id: best.rule?.csa_id ?? best.rule?.id ?? 'unknown',
      value: best.value,
      strength: best.rule?.strength ?? 'weak',
      created_turn: typeof best.rule?.created_turn === 'number' ? best.rule.created_turn : null,
      updated_turn: typeof best.rule?.updated_turn === 'number' ? best.rule.updated_turn : null,
      activated_game_time: object(best.rule?.activated_game_time) ? best.rule.activated_game_time : null
    };
  }

  return {
    required_clothing: required,
    contributing_rule_ids: [...contributing],
    slot_sources: slotSources,
    conflicts
  };
}

/**
 * 규정 우선순위 비교 — 더 높은 priority가 앞에 온다 (음수 = a가 우선).
 * strength → updated_turn → created_turn/activated_game_time → 동률(0)
 */
function compareRulePriority(a, b) {
  const STRENGTH_RANK = { weak: 1, medium: 2, strong: 3 };
  const aRank = STRENGTH_RANK[a?.strength] ?? 1;
  const bRank = STRENGTH_RANK[b?.strength] ?? 1;
  if (aRank !== bRank) return bRank - aRank;

  const aUpdated = typeof a?.updated_turn === 'number' ? a.updated_turn : -Infinity;
  const bUpdated = typeof b?.updated_turn === 'number' ? b.updated_turn : -Infinity;
  if (aUpdated !== bUpdated) return bUpdated - aUpdated;

  const aCreated = typeof a?.created_turn === 'number' ? a.created_turn : -Infinity;
  const bCreated = typeof b?.created_turn === 'number' ? b.created_turn : -Infinity;
  if (aCreated !== bCreated) return bCreated - aCreated;

  const aTime = a?.activated_game_time?.minute_of_day ?? -Infinity;
  const bTime = b?.activated_game_time?.minute_of_day ?? -Infinity;
  if (aTime !== bTime) return bTime - aTime;

  return 0; // 완전 동률
}

/**
 * 실제 착의와 규정상 요구 착의를 비교한다.
 * - not_applicable: 요구 슬롯 없음
 * - unknown: 실제 값이 비어 있거나 unknown (준수 주장 금지)
 * - compliant: 모든 요구 슬롯이 정확히 일치
 * - noncompliant: 하나라도 다름
 * - conflict: 요구 슬롯 중 unknown(충돌)이 있음
 */
export function compareRequiredClothing(actual = {}, required = {}) {
  const keys = Object.keys(required);
  if (!keys.length) return 'not_applicable';
  if (keys.some(key => required[key] === 'unknown')) return 'conflict';
  if (keys.some(key => actual[key] === undefined || actual[key] === 'unknown')) {
    return 'unknown';
  }
  if (keys.every(key => actual[key] === required[key])) {
    return 'compliant';
  }
  return 'noncompliant';
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

/**
 * 첫 관찰 착의 결정 — observation eligibility를 실제 데이터로 검증한다.
 *
 * eligibility 조건 (모두 충족해야 seed):
 * - NPC가 현재 턴의 실제 관찰 대상 또는 destination NPC인가
 * - 규정 actor_group이 해당 NPC 프로필과 일치하는가 (여성 직원 규정 → 여성 NPC)
 * - 규정 trigger가 현재 장면에서 applicable한가
 * - 규정 활성 이전부터 현장에 있던 NPC가 아닌가 (활성 시각 이후 등장해야 함)
 * - 최근 Story/turn evidence에 반대 착의 사실이 없는가
 * - 해당 NPC에 이미 canonical clothing fact가 없는가
 *
 * 반환: { status: 'observed'|'unknown'|'conflict'|'not_applicable'|'ineligible', clothing, reasons }
 */
export function resolveObservedClothing({
  npcId,
  npcProfile = {},
  activeRules = [],
  previousClothing = {},
  isObservationTarget = false,
  ruleActivatedTurn = null,
  expectedTurn = null,
  oppositeEvidence = false
} = {}) {
  const reasons = [];
  if (!npcId) return { status: 'ineligible', clothing: {}, reasons: ['missing_npc_id'] };

  // 1) 이미 canonical clothing fact가 있으면 seed 대상이 아니다.
  const prev = object(previousClothing) ? previousClothing : {};
  if (Object.keys(prev).length > 0) {
    return { status: 'unknown', clothing: {}, reasons: ['existing_clothing_fact'] };
  }

  // 2) 이번 턴 실제 관찰 대상이어야 한다 (present/entering/destination/action target).
  if (!isObservationTarget) {
    return { status: 'ineligible', clothing: {}, reasons: ['not_observation_target'] };
  }

  // 3) 최근 Story에 반대 착의 근거가 있으면 seed하지 않는다.
  if (oppositeEvidence) {
    return { status: 'ineligible', clothing: {}, reasons: ['opposite_clothing_evidence'] };
  }

  // 4) 규정 활성 이후 등장해야 한다 — 활성 턴이 현재 턴보다 미래면 성립 불가,
  //    활성 턴 이전부터 현장에 있었던 NPC는 seed 대상이 아니다.
  //    (expectedTurn 기준: 활성 시각이 이번 턴 이상이어야 관찰 가능)
  if (typeof ruleActivatedTurn === 'number' && typeof expectedTurn === 'number' && ruleActivatedTurn > expectedTurn) {
    return { status: 'ineligible', clothing: {}, reasons: ['rule_activated_after_observation'] };
  }

  // 5) actor_group 일치 — female_employee 규정은 여성 NPC만.
  const gender = typeof npcProfile?.gender === 'string' ? npcProfile.gender : null;
  const eligibleRules = activeRules.filter(rule => {
    const actorGroup = rule?.preset?.actor_group ?? rule?.actor_group;
    if (!actorGroup) return true;
    if (actorGroup === 'female_employee') return gender === 'female' || gender === null; // 성별 미상이면 보수적으로 허용
    if (actorGroup === 'company_employee' || actorGroup === 'coworker') return true;
    return true;
  });
  if (!eligibleRules.length) {
    return { status: 'ineligible', clothing: {}, reasons: ['no_matching_actor_group'] };
  }

  const resolved = requiredClothingFromActiveCsa(eligibleRules);
  if (!Object.keys(resolved.required_clothing).length) {
    return { status: 'not_applicable', clothing: {}, reasons: ['no_required_clothing'] };
  }
  if (resolved.conflicts.length) {
    return { status: 'conflict', clothing: resolved.required_clothing, reasons: ['conflicting_rules'], ...resolved };
  }

  return { status: 'observed', clothing: resolved.required_clothing, reasons: ['first_observation'], ...resolved };
}

/**
 * 레거시 호환 — seedFirstObservedClothing의 단순 버전.
 * Story projection은 이 함수 대신 resolveObservedClothing을 사용해야 한다.
 * (관찰 대상 검증 없이 빈 clothing을 seed하는 이전 동작은 제거됨)
 */
export function seedFirstObservedClothing({ npcId, activeRules = [], previousClothing = {} } = {}) {
  const prev = object(previousClothing) ? previousClothing : {};
  if (!npcId || !Array.isArray(activeRules) || activeRules.length === 0 || Object.keys(prev).length > 0) {
    return { seeded: false, clothing: {} };
  }
  const required = requiredClothingFromActiveCsa(activeRules);
  if (Object.keys(required.required_clothing).length === 0) {
    return { seeded: false, clothing: {} };
  }
  return { seeded: true, clothing: required.required_clothing };
}
