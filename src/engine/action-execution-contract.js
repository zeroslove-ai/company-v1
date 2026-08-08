/**
 * ActionExecutionContract — 플레이어 입력을 Story 스트리밍 시작 전에 deterministic하게
 * 분류하는 서버 정본.
 *
 * - Story 내용을 미리 쓰지 않는다. Story LLM이 이번 입력을 어떤 방식으로 처리해야
 *   하는지를 정하는 계약이다.
 * - 추가 LLM 호출 / 추가 네트워크 왕복 / 추가 DB 조회가 없다 (이미 로드한 save와
 *   edition catalog, 기존 semantic contract만 사용).
 */

import { STRUCTURED_SEXUAL_ACTIONS } from './csa/semantic-contract.js';

// ---------------------------------------------------------------------------
// 5-3. deterministic free-text matcher — 행동 동사 + 신체/대상 신호 조합
// ---------------------------------------------------------------------------

const PERSON_PRONOUNS = ['이메이', '서원희', '윤민아', '한리브', '김제나', '박정우', '이민석', '그녀', '그녀를'];
const OBJECT_NOUNS = ['서류', '마우스', '전시품', '문서', '책', '물건', '기기', '폰', '휴대폰', '키보드', '자판', '볼펜', '컵', '잔', '서랍', '문', '볼', '공', '화분', '상자', '가방', '서류함', '필기구'];

const BODY_SIGNALS = {
  breast: ['가슴', '유방', '유두'],
  hip: ['엉덩이', '허벅지 안쪽', '허벅지'],
  underwear: ['속옷', '팬티', '브래지어', '브라', '언더웨어'],
  clothes: ['치마', '바지', '지퍼', '옷', '상의', '하의', '스커트', '원피스'],
  genital: ['성기', '자지', '음부', '보지', '클리토리스', '사타구니'],
  inner: ['지퍼 안', '팬티 안', '속옷 안', '바지 안', '옷 안']
};

const KISS_SIGNALS = ['키스', '입맞춤', '입술을 맞댄', '입술에 입을', '입술을 부딪', '입을 맞추', '입을 맞춘', '입맞추'];
// 한국어 활용형(만지→만진/만져/만집, 가져가→가져간)을 함께 매칭한다
const TOUCH_SIGNALS = ['만지', '만져', '만진', '만집', '만졌', '주무르', '주물러', '주물렀', '비비', '비볐', '문지르', '문질러', '문질렀', '애무', '스킨십', '쓰다듬', '쓰다듬어', '움켜쥐', '움켜잡', '잡', '잡아', '잡는', '끌어안'];
const EXPOSE_SIGNALS = ['벗', '벗어', '벗은', '내리', '내려', '올리', '올려', '걷', '걷어', '걷은', '벌리', '벌려', '보여', '노출', '확인', '들추'];
const GENITAL_TOUCH_SIGNALS = ['손을 넣', '손을 가져가', '손을 가져간', '손목을 잡아', '손목을 잡고', '손을 올려', '손을 갖다', '직접 잡게', '가져가', '가져간'];
const ORAL_SIGNALS = ['펠라티오', '커닐링구스', '구강', '입으로', '빨아', '핥'];
const PENETRATION_SIGNALS = ['삽입', '성관계', '섹스', '넣어', '관계를 가'];

function hasAny(source, tokens) {
  return tokens.some(token => source.includes(token));
}

/**
 * 구조화된 성적 행동 taxonomy로 분류한다 (kiss/sexual_touch/genital_exposure/
 * genital_touch/oral/penetration). 신체 신호 + 행동 신호 조합으로 판정하며,
 * 단일 단어("바지를 정리한다"의 '바지')만으로 성적 행동으로 판정하지 않는다.
 */
export function classifyMaterialActions(text) {
  const source = typeof text === 'string' ? text : '';
  if (!source.trim()) return [];
  const actions = new Set();

  if (hasAny(source, KISS_SIGNALS)) actions.add('kiss');

  const genitalTarget = hasAny(source, [...BODY_SIGNALS.genital, ...BODY_SIGNALS.inner]);
  const exposureTarget = hasAny(source, [...BODY_SIGNALS.underwear, ...BODY_SIGNALS.clothes, ...BODY_SIGNALS.breast]);
  const bodyTarget = hasAny(source, [...BODY_SIGNALS.breast, ...BODY_SIGNALS.hip]);
  const touching = hasAny(source, TOUCH_SIGNALS);
  const exposing = hasAny(source, EXPOSE_SIGNALS);
  const genitalTouching = touching || hasAny(source, GENITAL_TOUCH_SIGNALS);

  if (genitalTarget && genitalTouching) actions.add('genital_touch');
  if (exposureTarget && exposing) actions.add('genital_exposure');
  // 전신 탈의 표현("다 벗어", "전부 벗으세요", "옷을 전부 벗다")은 대상 단어 없이 exposure로 분류
  if (/(다|전부|모두|그냥|옷을 전부)\s*(벗|탈의)/.test(source)) actions.add('genital_exposure');
  if (bodyTarget && touching) actions.add('sexual_touch');
  // 무대상 '만지다' fallback — 사람·친밀 문맥(등장인물 이름/대명사) 또는 요청형 무대상일 때만 성적 접촉으로 본다.
  // 일반 사물 목적어("서류를 만진다", "마우스를 만져주세요")는 제외.
  if (!bodyTarget && !genitalTarget && (source.includes('만지') || source.includes('만져'))) {
    const personContext = PERSON_PRONOUNS.some(t => source.includes(t))
      || /(그녀|그를|상대|사람|여자|남자|누나|형|언니|오빠)/.test(source);
    const objectContext = OBJECT_NOUNS.some(t => source.includes(t));
    if (personContext || (!objectContext && /(주실|주세요|해줄래|해주시|부탁|줄래|해도 될까요|할 수 있나요)/.test(source))) {
      actions.add('sexual_touch');
    }
  }

  if (hasAny(source, ORAL_SIGNALS) && (genitalTarget || hasAny(source, ['성기', '음부', '입으로']))) actions.add('oral');
  const genitalOnly = hasAny(source, BODY_SIGNALS.genital);
  if (hasAny(source, PENETRATION_SIGNALS) && (genitalOnly || hasAny(source, ['삽입', '성관계', '섹스']))) actions.add('penetration');

  return [...actions];
}

// ---------------------------------------------------------------------------
// 6. execution mode — 문자열 구조로 분류 (추가 LLM 없음)
// ---------------------------------------------------------------------------

const DIRECT_ACT_SIGNALS = [
  '손목을 잡아', '손을 가져가', '손을 올려', '몸을 끌어당', '입을 맞춘', '옷을 걷',
  '지퍼 안으로 넣', '직접 잡게', '끌어안', '잡아당', '눕히', '덮치', '붙잡'
];
const INSTRUCTION_SIGNALS = ['하세요', '해야 합니다', '야 합니다', '벗으세요', '지시한다', '명령한다', '내리세요', '앉아라', '넣어라', '만져라', '보여라', '하라'];
// 일상적 부탁형(-줘/-해줘/-해줄래/-해줄 수 있어?)은 request — 명시적 명령·의무형만 instruction
const REQUEST_SIGNALS = ['해줄래', '해주시겠', '할 수 있나요', '가능할까요', '부탁', '원해요', '어때요', '도 될까요', '해도 될까요', '주실 수', '주세요', '줄래', '해주세요', '보여주세요', '만져주실', '해주실', '해줘', '보여줘', '줘', '만져줘', '안아줘', '벗어줘', '해줄 수'];

/** 판정 우선순위: direct_act → instruction → request → unknown */
export function classifyExecutionMode(text) {
  const source = typeof text === 'string' ? text : '';
  if (hasAny(source, DIRECT_ACT_SIGNALS)) return 'direct_act';
  // 서술형 직접 행동("…을 만진다", "…가져간다", "…했다") — 직접 신체 조작을 완료 서술하는 형태
  const stripped = source.trim().replace(/[.!?。！？\s]+$/, '');
  if (/(?:한다|했다|해 버린|시켰|시킨다)$/.test(stripped)) return 'direct_act';
  if (/[가-힣](?:ㄴ다|는다)$/.test(stripped) || (/[가-힣]다$/.test(stripped) && !/(니다|습니다|읍니다|이다|있습니다|없습니다)$/.test(stripped))) return 'direct_act';
  if (hasAny(source, INSTRUCTION_SIGNALS)) return 'instruction';
  if (hasAny(source, REQUEST_SIGNALS)) return 'request';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// 7. 관계 기반 ordinary gate
// ---------------------------------------------------------------------------

function relationshipFor(save, targetId) {
  const rel = save?.npc_relationship_state?.[targetId] ?? {};
  return {
    closeness: rel.closeness ?? null,
    romance_status: rel.romance_status ?? null,
    current_boundary: rel.current_boundary ?? null,
    first_kiss_turn: rel.milestones?.first_kiss_turn ?? null,
    sexual_relationship_started_turn: rel.milestones?.sexual_relationship_started_turn ?? null
  };
}

/** 자유 입력에서 등록 인물 전체 이름으로 target 후보를 찾는다 (focal 우선). */
function inferTargetId(save, text, characters, npcIds) {
  const source = typeof text === 'string' ? text : '';
  const focal = typeof save?.focal_character_id === 'string' ? save.focal_character_id : null;
  const entries = [
    ...(Array.isArray(characters) ? characters : []),
    ...(Array.isArray(npcIds) ? npcIds : [])
  ].filter(Boolean);
  if (focal && source.includes(focal)) return focal;
  const byName = entries.find(entry => typeof entry?.name === 'string' && entry.name && source.includes(entry.name));
  return byName ? (byName.character_id ?? byName.npc_id ?? byName.id ?? null) : focal;
}

/**
 * structured target 검증 — 저장된 last_choice_meta의 target_id를 그대로 신뢰하지 않는다.
 * stable NPC ID 목록 존재 + actor_id가 player + actor≠target + 현재 장면 참여 또는
 * 직전 선택지에 등장한 인물이어야 유효하다. 실패 시 자유 입력의 명시적 전체 이름으로
 * 다시 찾고, 그것도 실패하면 null (unclear_target blocker로 차단된다).
 */
/** stable NPC ID 집합 — characters + general_npcs에서 수집. */
function stableNpcIds(characters, npcIds) {
  return new Set([
    ...(Array.isArray(characters) ? characters : []).map(entry => entry.character_id ?? entry.id ?? entry.npc_id).filter(Boolean),
    ...(Array.isArray(npcIds) ? npcIds : []).map(entry => entry.npc_id ?? entry.id).filter(Boolean)
  ]);
}

/**
 * material(친밀/성적) 행동 전용 strict target 결정.
 * 허용 근거는 다음 둘 중 하나만 인정한다:
 *  1. 검증된 structured target — stable NPC ID + actor_id=player + actor≠target +
 *     target이 현재 scene_state.participants에 존재 + choice_index가 정확히 일치
 *  2. 플레이어 입력 또는 실제 last_choices[choice_index] 원문에 등록 인물의 전체 이름 명시
 * focal_character_id/last_speaker_id/last_npcs_present/metadata 배열 내 자기존재는
 * 검증 근거가 아니다. 명시적 전체 이름도 없으면 null (unclear_target으로 차단).
 */
function resolveStrictMaterialTarget({ save, characters, npcIds, text } = {}) {
  const stable = stableNpcIds(characters, npcIds);
  const sceneParticipants = Array.isArray(save?.scene_state?.participants) ? save.scene_state.participants : [];
  // 입력의 명시적 전체 이름만 사용한다 (선택지 metadata/focal fallback 없음).
  const source = typeof text === 'string' ? text : '';
  const entries = [
    ...(Array.isArray(characters) ? characters : []),
    ...(Array.isArray(npcIds) ? npcIds : [])
  ].filter(Boolean);
  for (const entry of entries) {
    const name = typeof entry?.name === 'string' ? entry.name : '';
    if (name && source.includes(name)) {
      return entry.character_id ?? entry.npc_id ?? entry.id ?? null;
    }
  }
  // focal fallback 금지 — 명시적 이름이 없으면 null
  return null;
}

function detectCompanyAuthorityMisuse(text) {
  const source = typeof text === 'string' ? text : '';
  const authority = ['감사 업무', '감사업무', '인사팀', '공지', '지시', '규정', '업무상', '직무', '명령'];
  return authority.some(token => source.includes(token));
}

// ---------------------------------------------------------------------------
// route 결정
// ---------------------------------------------------------------------------

// follow-up은 blocker 기반으로만 예약 — 단순 근거 부족/공개 상황의 정상 거절은 확대하지 않는다.
const FOLLOWUP_BLOCKERS = new Set(['coercive_physical_control', 'company_authority_misuse', 'explicit_recent_refusal', 'closed_boundary']);

function resolveRouteAndPolicy({ actionTypes, executionMode, coverage, relationship, companyAuthorityMisuse, permission }) {
  const blockers = Array.isArray(permission?.blockers) ? permission.blockers : [];
  if (!actionTypes.length && !blockers.length) {
    return {
      route: 'ordinary',
      completion_policy: 'default',
      csa_attribution_allowed: false,
      company_authority_attribution_allowed: true,
      schedule_boundary_followup: false,
      reason_code: 'NON_MATERIAL_ACTION'
    };
  }
  if (executionMode === 'request') {
    return {
      route: 'ordinary_request',
      completion_policy: 'npc_decides',
      csa_attribution_allowed: false,
      company_authority_attribution_allowed: false,
      schedule_boundary_followup: false,
      reason_code: 'OUTSIDE_CSA_REQUEST'
    };
  }
  if (executionMode === 'instruction') {
    // 명령형은 관계 milestone과 무관하게 강제 명령 — blocked.
    // follow-up은 회사 권한 악용 등 blocker 기반으로만 예약
    return {
      route: 'ordinary_direct_blocked',
      completion_policy: 'attempt_only',
      csa_attribution_allowed: false,
      company_authority_attribution_allowed: false,
      schedule_boundary_followup: blockers.some(blocker => FOLLOWUP_BLOCKERS.has(blocker)),
      reason_code: companyAuthorityMisuse ? 'COMPANY_AUTHORITY_MISUSE' : 'OUTSIDE_CSA_WITHOUT_RELATIONSHIP_PERMISSION'
    };
  }
  const scheduleFollowup = blockers.some(blocker => FOLLOWUP_BLOCKERS.has(blocker));
  // hard blocker는 어떤 양수 근거(milestone/흥분도/호감도)로도 상쇄하지 않는다.
  if (blockers.length) {
    return {
      route: 'ordinary_direct_blocked',
      completion_policy: 'attempt_only',
      csa_attribution_allowed: false,
      company_authority_attribution_allowed: false,
      schedule_boundary_followup: scheduleFollowup,
      reason_code: companyAuthorityMisuse ? 'COMPANY_AUTHORITY_MISUSE' : 'HARD_BLOCKER',
      attempt_basis: 'hard_blocker'
    };
  }
  // direct_act — 관계 milestone gate + 다중 정황 근거(조건부 허용) gate.
  // bundle 전체에서 가장 강한 행동 기준: kiss 외 다른 행동이 하나라도 있으면 sexual milestone 필요
  const requiresSexualMilestone = actionTypes.some(type => type !== 'kiss');
  const milestoneBacked = requiresSexualMilestone
    ? Boolean(relationship.sexual_relationship_started_turn)
    : Boolean(relationship.first_kiss_turn);
  // 조건부 허용: hard blocker가 없고(eligible) 정황 근거가 충분하면 attempt.
  // attempt는 자동 성공이 아니라 "받아들여질 가능성이 있다"는 서버 정본이다.
  const contextualEligible = executionMode === 'direct_act' && permission?.eligible === true && permission.level !== 'none';
  if (milestoneBacked || contextualEligible) {
    return {
      route: 'ordinary_direct_attempt',
      completion_policy: 'npc_response_required',
      csa_attribution_allowed: false,
      company_authority_attribution_allowed: false,
      schedule_boundary_followup: false,
      reason_code: milestoneBacked ? 'RELATIONSHIP_MILESTONE_BACKED' : 'CONTEXTUAL_PERMISSION',
      attempt_basis: milestoneBacked ? 'relationship_milestone' : 'contextual_signals'
    };
  }
  return {
    route: 'ordinary_direct_blocked',
    completion_policy: 'attempt_only',
    csa_attribution_allowed: false,
    company_authority_attribution_allowed: false,
    schedule_boundary_followup: false,
    reason_code: 'OUTSIDE_CSA_WITHOUT_RELATIONSHIP_PERMISSION',
    attempt_basis: 'insufficient'
  };
}

// ---------------------------------------------------------------------------
// 7. 정황 신호 정규화 — 다중 근거 기반 조건부 허용 게이트
// ---------------------------------------------------------------------------

const AFFINITY_BANDS = { low: [0, 29], moderate: [30, 44], medium: [45, 64], high: [65, 100] };
const AROUSAL_BANDS = { low: [0, 29], medium: [30, 59], high: [60, 79], very_high: [80, 100] };

function bandFor(value, bands) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  for (const [name, [lo, hi]] of Object.entries(bands)) {
    if (value >= lo && value <= hi) return name;
  }
  return value > 100 ? Object.keys(bands).pop() : Object.keys(bands)[0];
}

const PUBLIC_LOCATION_RE = /(lobby|hall|plaza|event|conference|stage|common|cafeteria|cafe|restaurant|lounge|street|public|auditorium)/i;
const CLOSED_LOCATION_RE = /(meeting_room|office|room|private|storage|restroom|bathroom|warehouse|project_report|report_room)/i;

/** 사생활 판정 — 추가 LLM 없이 현재 정본 장면(scene_state)만으로 계산한다. */
export function resolvePrivacyContext({ save, targetId } = {}) {
  const scene = save?.scene_state ?? {};
  const participants = Array.isArray(scene.participants) ? scene.participants : [];
  // 과거 장면(last_npcs_present)·focal·last_speaker_id·턴 이력은 privacy 증거로 사용하지 않는다.
  const isPlayer = id => id === 'player' || id === 'player-1' || /^player([-_]|$)/.test(String(id));
  const npcParticipants = participants.filter(id => !isPlayer(id));
  const observerCount = npcParticipants.filter(id => id !== targetId).length;
  const locationId = String(scene.location_id ?? '');
  const publicLocation = PUBLIC_LOCATION_RE.test(locationId);
  const closedLocation = CLOSED_LOCATION_RE.test(locationId) && !publicLocation;
  const playerPresent = participants.some(isPlayer);
  const targetPresent = targetId && npcParticipants.includes(targetId);

  // fail-open 방지: scene_state.participants가 없거나 비었거나, player/target 중 하나가
  // 현재 장면에 없으면 unknown — 높은 arousal/affinity와 결합해 attempt로 풀리는 것을 막는다.
  let privacy;
  if (!participants.length || !playerPresent || !targetPresent || participants.some(id => typeof id !== 'string' || !id.trim())) {
    privacy = 'unknown';
  } else if (publicLocation || observerCount >= 2 || participants.length >= 4) {
    privacy = 'public';
  } else if (observerCount === 0 && participants.length <= 2) {
    privacy = 'private';
  } else if (observerCount === 1 || closedLocation) {
    privacy = 'semi_private';
  } else {
    privacy = 'unknown';
  }
  return { privacy, observer_count: observerCount };
}

/** 관계·수치 신호 — 실제 저장 필드만 사용하며, 값이 없으면 unknown(null)로 둔다. */
export function resolveRelationshipSignals({ save, targetId } = {}) {
  const rel = save?.npc_relationship_state?.[targetId] ?? {};
  const stats = save?.npc_stats?.[targetId] ?? {};
  const arousal = typeof stats.sexual_arousal === 'number' && Number.isFinite(stats.sexual_arousal) ? stats.sexual_arousal : null;
  const affinity = typeof stats.affinity === 'number' && Number.isFinite(stats.affinity)
    ? stats.affinity
    : (typeof stats.affection === 'number' && Number.isFinite(stats.affection) ? stats.affection : null);
  return {
    arousal,
    affinity,
    arousal_band: bandFor(arousal, AROUSAL_BANDS),
    affinity_band: bandFor(affinity, AFFINITY_BANDS),
    closeness: rel.closeness ?? null,
    romance_status: rel.romance_status ?? null,
    current_boundary: rel.current_boundary ?? null,
    first_kiss_turn: rel.milestones?.first_kiss_turn ?? null,
    sexual_relationship_started_turn: rel.milestones?.sexual_relationship_started_turn ?? null
  };
}

/** 행동 강도 tier — bundle은 가장 강한 행동 기준. */
export function resolveActionTier(actionTypes) {
  if (!Array.isArray(actionTypes) || !actionTypes.length) return null;
  if (actionTypes.some(t => t === 'oral' || t === 'penetration')) return 'explicit';
  if (actionTypes.some(t => t === 'sexual_touch' || t === 'genital_exposure' || t === 'genital_touch')) return 'intimate';
  if (actionTypes.every(t => t === 'kiss')) return 'affectionate';
  return null;
}

const COERCIVE_RE = /(붙잡|강제|억지로|억지|도망|못 가게|눕히|끌고|강요|밀어 넣|움직이지 못하게|잠그|가둬|붙들|강하게 잡|잡아서|붙들어)/;
const COMPELLED_RE = /(잡게 한다|만지게 한다|하게 시킨다|시킨다|직접 잡게|직접 하게)/;
const AUTHORITY_RE = /(감사 업무|감사업무|인사팀|지시한다|명령한다|규정|평가|업무 협조|협조 의무|상사 명령|회사 규정|공지|업무상)/;

/** hard blocker — 높은 흥분도·호감도로 해제하지 않는다. */
export function resolveHardBlockers({ playerAction, targetId, actionTier, privacy, save, executionMode } = {}) {
  const source = String(playerAction ?? '');
  const blockers = [];
  if (COERCIVE_RE.test(source) || COMPELLED_RE.test(source)) blockers.push('coercive_physical_control');
  if (AUTHORITY_RE.test(source) && (executionMode === 'direct_act' || executionMode === 'instruction')) blockers.push('company_authority_misuse');
  const pending = save?.pending_boundary_followup;
  if (pending && typeof pending === 'object' && (!targetId || pending.target_character_id === targetId)) blockers.push('explicit_recent_refusal');
  const boundary = save?.npc_relationship_state?.[targetId]?.current_boundary;
  if (boundary === 'closed' || boundary === 'hostile') blockers.push('closed_boundary');
  if (!targetId && (actionTier === 'intimate' || actionTier === 'explicit')) blockers.push('unclear_target');
  // privacy가 unknown이면(참가자 누락/빈 배열/player·target 부재) 장면 맥락을
  // 특정할 수 없으므로 affectionate(kiss)를 포함한 모든 material 행동을
  // hard-block한다. 관계 milestone이나 높은 수치 근거로 상쇄할 수 없다.
  // request만 예외다 — NPC가 판단하는 요청형은 자동 완료가 아니기 때문이다.
  // "이메이와 키스" 같은 명사형 입력은 execution mode가 unknown으로 남을 수 있는데,
  // 이를 열어 두면 milestone이 있을 때 ordinary_direct_attempt로 풀리는 우회가
  // 생기므로 direct_act/instruction/unknown을 모두 fail-closed로 막는다.
  if (privacy === 'unknown' && actionTier && executionMode !== 'request') {
    blockers.push('unknown_scene_context');
  }
  if (privacy === 'public' && (actionTier === 'intimate' || actionTier === 'explicit') && (executionMode === 'direct_act' || executionMode === 'instruction')) blockers.push('public_strong_action');
  return blockers;
}

/**
 * 조건부 허용 판정 — 단순 점수 합산 금지. 순서: hard blocker → tier → privacy →
 * 관계·호감도·흥분도 근거 → tier별 최소 조합. hard blocker는 양수 근거로 상쇄하지 않는다.
 */
export function resolveContextualPermission({ save, targetId, actionTypes, executionMode, playerAction } = {}) {
  const privacyCtx = resolvePrivacyContext({ save, targetId });
  const signals = resolveRelationshipSignals({ save, targetId });
  const actionTier = resolveActionTier(actionTypes);
  const blockers = resolveHardBlockers({ playerAction, targetId, actionTier, privacy: privacyCtx.privacy, save, executionMode });
  const isDirect = executionMode === 'direct_act';
  const basis = [];
  let level = 'none';
  let eligible = blockers.length === 0;

  if (eligible && actionTier && isDirect) {
    if (actionTier === 'affectionate') {
      // A. 관계 근거
      if (signals.first_kiss_turn != null) { level = 'strong'; basis.push('relationship_milestone'); }
      else if (['dating', 'lover', 'mutual_interest', 'interest', 'close'].includes(signals.romance_status)) { level = 'strong'; basis.push('romance_status'); }
      // B. 정황 근거 — 호감도 적당함 이상 + 흥분도 중간 이상 + 사생활 + 경계 닫힘 아님
      else if ((signals.affinity_band === 'medium' || signals.affinity_band === 'high')
        && (signals.arousal_band === 'medium' || signals.arousal_band === 'high' || signals.arousal_band === 'very_high')
        && (privacyCtx.privacy === 'private' || privacyCtx.privacy === 'semi_private')) {
        level = 'conditional';
        basis.push('moderate_affinity', 'moderate_arousal', privacyCtx.privacy === 'private' ? 'private_scene' : 'semi_private_scene');
      }
      // C. 강한 정황 근거 — 흥분도 높음 이상 + 호감도 적당함 이상 + 관찰자 0
      else if ((signals.arousal_band === 'high' || signals.arousal_band === 'very_high')
        && (signals.affinity_band === 'medium' || signals.affinity_band === 'high')
        && privacyCtx.observer_count === 0) {
        level = 'conditional';
        basis.push('high_arousal', 'moderate_affinity', 'private_scene');
      }
    } else if (actionTier === 'intimate') {
      // A. 기존 성적 관계
      if (signals.sexual_relationship_started_turn != null) { level = 'strong'; basis.push('sexual_relationship'); }
      // B. 높은 흥분도 + 적당한 호감도 + 완전 사생활 + 관찰자 0 + 경계 닫힘/직급 잠금 아님
      else if ((signals.arousal_band === 'high' || signals.arousal_band === 'very_high')
        && (signals.affinity_band === 'medium' || signals.affinity_band === 'high')
        && privacyCtx.privacy === 'private'
        && privacyCtx.observer_count === 0
        && !['closed', 'hostile', 'professional_locked', 'professional_lock'].includes(signals.current_boundary)) {
        level = 'conditional';
        basis.push('high_arousal', 'moderate_affinity', 'private_scene', 'boundary_not_closed');
      }
    } else if (actionTier === 'explicit') {
      // 기본: sexual milestone + private. milestone 없으면 요청형으로만 진행.
      if (signals.sexual_relationship_started_turn != null && privacyCtx.privacy === 'private') {
        level = 'strong';
        basis.push('sexual_relationship', 'private_scene');
      }
    }
  }
  return {
    eligible,
    level,
    action_tier: actionTier,
    basis,
    blockers,
    privacy: privacyCtx.privacy,
    observer_count: privacyCtx.observer_count,
    signals: {
      arousal_band: signals.arousal_band,
      affinity_band: signals.affinity_band,
      boundary: signals.current_boundary
    }
  };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

/**
 * resolveActionExecutionContract({
 *   save, playerAction, csaCatalog, characters, npcIds
 * })
 *
 * - structured path: save.last_choices/last_choice_meta가 입력과 정확히 일치하면 그
 *   structured action metadata is used only for ordinary contract diagnostics.
 *   semantic contract로 재검증한다 (Extract의 suggested_route를 그대로 신뢰하지 않음)
 * - free-text path: 코드 기반 조합 matcher (행동 동사 + 신체/대상 신호)
 * - 추가 await/fetch/LLM 없음 — 순수 결정 함수
 */
export function resolveActionExecutionContract({ save, playerAction, csaCatalog, characters = [], npcIds = [] } = {}) {
  const text = typeof playerAction === 'string' ? playerAction : '';
  // 선택지 metadata 기반 신호는 사용하지 않는다 — 선택지는 표시 정본이며 행동 분류에 쓰지 않는다.
  const actionTypes = classifyMaterialActions(text);
  const freeMode = classifyExecutionMode(text);
  const executionMode = freeMode;
  const actorId = 'player';
  const materialTarget = actionTypes.length > 0;
  const targetId = materialTarget
    ? resolveStrictMaterialTarget({ save, characters, npcIds, text })
    : inferTargetId(save, text, characters, npcIds);
  // Story 생성 경로에서는 CSA를 사전 매칭하지 않는다. 이 옵션은 기존 일반
  // action-contract 단위 테스트와 비-Story 호환 호출을 위한 명시적 legacy 경계다.
  const coverage = { covered: false, csa_id: null, route: null };
  // CSA pre-story coverage is intentionally fixed false; active world rules are projected separately.
  const relationship = relationshipFor(save, targetId);
  const companyAuthorityMisuse = detectCompanyAuthorityMisuse(text);
  // 다중 근거 기반 조건부 허용 — 순수 함수 (추가 LLM/네트워크 없음)
  const permission = resolveContextualPermission({
    save, targetId, actionTypes, executionMode, playerAction: text
  });

  const routeInfo = resolveRouteAndPolicy({
    actionTypes,
    executionMode,
    coverage,
    relationship,
    companyAuthorityMisuse,
    permission
  });

  const coerciveMaterial = (COERCIVE_RE.test(text) || COMPELLED_RE.test(text)) && actionTypes.length === 0;
  const contract = {
    version: 1,
    material_action: actionTypes.length > 0 || coerciveMaterial,
    action_types: actionTypes,
    execution_mode: executionMode,
    actor_id: actorId,
    target_id: targetId,
    csa_coverage: {
      covered: coverage?.covered === true,
      csa_id: coverage?.csa_id ?? null,
      route: coverage?.route ?? null
    },
    route: routeInfo.route,
    completion_policy: routeInfo.completion_policy,
    csa_attribution_allowed: routeInfo.csa_attribution_allowed,
    company_authority_attribution_allowed: routeInfo.company_authority_attribution_allowed,
    relationship_basis: relationship,
    contextual_permission: {
      eligible: permission.eligible,
      level: permission.level,
      action_tier: permission.action_tier,
      basis: permission.basis,
      blockers: permission.blockers,
      privacy: permission.privacy,
      observer_count: permission.observer_count,
      signals: permission.signals
    },
    attempt_basis: routeInfo.attempt_basis ?? (coverage?.covered ? 'csa_exact' : 'insufficient'),
    schedule_boundary_followup: routeInfo.schedule_boundary_followup,
    reason_code: routeInfo.reason_code
  };
  return contract;
}

// ---------------------------------------------------------------------------
// 8. 음수 CSA scope 계약 section
// ---------------------------------------------------------------------------

function csaScopeLine(applicableCsa) {
  if (!Array.isArray(applicableCsa) || !applicableCsa.length) return '';
  const lines = applicableCsa
    .map(csa => `- ${csa.id}: ${typeof csa.content === 'string' ? csa.content : ''}`)
    .filter(line => line.length > 4);
  return lines.length ? `\n활성 CSA가 확정하는 범위:\n${lines.join('\n')}` : '';
}

/**
 * Story 프롬프트에 붙이는 계약 section.
 * - ordinary_direct_blocked / ordinary_request / ordinary_direct_attempt: 짧고 강한 음수 계약
 */
export function buildActionExecutionContractSection(contract, { applicableCsa = [] } = {}) {
  if (!contract) return '';
  if (contract.route === 'ordinary') return '';
  if (contract.route === 'ordinary_request') {
    const ctx = permissionContextLine(contract);
    return `\n\n[ACTION EXECUTION CONTRACT — REQUEST]\n이번 플레이어 입력(${contract.action_types.join(', ')})은 활성 상식개변의 직접 범위를 벗어난 요청이다. 요청 자체는 전달되지만, NPC가 관계·성격·현재 경계를 실제로 반영해 수락·거절·조건을 제시한다.${ctx ? `\n현재 NPC 상태: ${ctx}` : ''}\nNPC는 무조건 거절하지 않는다. 흥분도가 높고 호감도와 사생활 조건이 갖춰졌다면 수락 가능성을 충분히 열어둔다. 허용되는 반응: 즉시 수락, 머뭇거리며 수락, 주변 확인 후 수락, 조금만 허용, 장소 변경 제안, 다음 단계는 거절, 거절. 요청했다는 이유만으로 자동 완료하지 않는다. CSA acceptance나 신체적 흥분 자체가 동의는 아니다. 회사 규정·감사 업무·인사팀 지시로 정당화하지 않는다.`;
  }
  if (contract.route === 'ordinary_direct_attempt') {
    const ctx = permissionContextLine(contract);
    return `\n\n[ACTION EXECUTION CONTRACT — ATTEMPT]\n이번 입력(${contract.action_types.join(', ')})은 CSA의 직접 범위는 아니지만, 현재 관계와 정황상 NPC가 받아들일 가능성이 있는 비강압적 시도다.${ctx ? `\n현재 NPC 상태: ${ctx}` : ''}\nNPC는 자동으로 거절하지 않는다. 현재 호감도, 흥분도, 사생활, 성격, 경계를 반영해 수락·망설임·조건부 허용·중단 중 자연스러운 반응을 선택한다. 흥분도가 높고 둘만 있는 상황이며 호감이 충분하다면, 주변을 확인하거나 눈을 감고 조심스럽게 호응하는 반응도 가능하다. NPC 반응이 반드시 서사에 존재해야 한다. 다만 CSA나 회사 규정 때문에 허용하는 것으로 묘사하지 않는다. 더 강한 행동까지 포괄 허용된 것으로 확대하지 않는다.`;
  }
  // ordinary_direct_blocked — hard blocker 또는 근거 부족일 때만 사용
  const ctx = permissionContextLine(contract);
  const blockerNote = Array.isArray(contract.contextual_permission?.blockers) && contract.contextual_permission.blockers.length
    ? `\n차단 사유: ${contract.contextual_permission.blockers.join(', ')}`
    : '';
  return `\n\n[ACTION EXECUTION CONTRACT — AUTHORITATIVE]\n이번 플레이어 입력에는 활성 상식개변의 직접 범위를 벗어난 행동이 포함되어 있다(${contract.action_types.join(', ')}, 직접 신체 조작).${blockerNote}${csaScopeLine(applicableCsa)}${ctx ? `\n현재 NPC 상태: ${ctx}` : ''}\nNPC는 이를 회사 규정, 감사 업무, 인사팀 공지, 상식개변 의무로 해석해서는 안 된다. CSA acceptance나 신체적 흥분은 동의가 아니다. 플레이어가 직접 행동을 시도한 경우 완료 사실로 바로 확정하지 말고, NPC가 손을 막거나, 몸을 빼거나, 행동을 멈추거나, 이유를 묻거나, 조건을 제시하는 등 상황에 맞는 다양한 반응을 서사에 포함한다. 매번 같은 거절 문장을 반복하지 않는다.`;
}

/** 계약의 조건부 허용 정보를 band 단위(민감 원문 제외)로 요약한다. */
function permissionContextLine(contract) {
  const p = contract?.contextual_permission;
  if (!p) return '';
  const parts = [];
  const sig = p.signals ?? {};
  if (sig.arousal_band) parts.push(`흥분도 ${sig.arousal_band}`);
  if (sig.affinity_band) parts.push(`호감도 ${sig.affinity_band}`);
  if (p.privacy) parts.push(p.privacy === 'private' ? '둘만 있는 공간' : (p.privacy === 'semi_private' ? '반사적인 공간' : '사람이 있는 공간'));
  if (sig.boundary) parts.push(`현재 경계 ${sig.boundary}`);
  return parts.join(', ');
}
