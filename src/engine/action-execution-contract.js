/**
 * ActionExecutionContract — 플레이어 입력을 Story 스트리밍 시작 전에 deterministic하게
 * 분류하는 서버 정본.
 *
 * - Story 내용을 미리 쓰지 않는다. Story LLM이 이번 입력을 어떤 방식으로 처리해야
 *   하는지를 정하는 계약이다.
 * - 추가 LLM 호출 / 추가 네트워크 왕복 / 추가 DB 조회가 없다 (이미 로드한 save와
 *   edition catalog, 기존 semantic contract만 사용).
 * - CSA의 정확한 범위만 "csa_direct"로 인정하고, 범위 밖 행동이 회사 규정·감사 업무·
 *   인사팀 지시로 정당화되지 않도록 하는 음수 계약을 생성한다.
 */

import { resolveCsaDirectCoverage, buildCsaDirectCoverageSection } from './csa/direct-coverage.js';

// ---------------------------------------------------------------------------
// 5-3. deterministic free-text matcher — 행동 동사 + 신체/대상 신호 조합
// ---------------------------------------------------------------------------

const BODY_SIGNALS = {
  breast: ['가슴', '유방', '유두'],
  hip: ['엉덩이', '허벅지 안쪽', '허벅지'],
  underwear: ['속옷', '팬티', '브래지어', '브라', '언더웨어'],
  clothes: ['치마', '바지', '지퍼', '옷', '상의', '하의', '스커트', '원피스'],
  genital: ['성기', '자지', '음부', '보지', '클리토리스', '사타구니'],
  inner: ['지퍼 안', '팬티 안', '속옷 안', '바지 안', '옷 안']
};

const KISS_SIGNALS = ['키스', '입맞춤', '입술을 맞댄', '입술에 입을', '입술을 부딪'];
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
  if (bodyTarget && touching) actions.add('sexual_touch');
  // 성적 요청 문맥: "살짝 만져주실 수 있나요?"처럼 신체 지정 없이 만지는 요청/명령도 성적 접촉으로 본다
  if (!bodyTarget && !genitalTarget && (source.includes('만지') || source.includes('만져'))) actions.add('sexual_touch');

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
const INSTRUCTION_SIGNALS = ['하세요', '해야 합니다', '벗으세요', '지시한다', '명령한다', '내리세요', '보여줘', '해줘', '앉아라', '넣어라', '만져라', '보여라', '하라'];
const REQUEST_SIGNALS = ['해줄래', '해주시겠', '할 수 있나요', '가능할까요', '부탁', '원해요', '어때요', '해도 될까요', '주실 수', '주세요', '줄래', '해주세요', '보여주세요', '만져주실', '해주실'];

/** 판정 우선순위: direct_act → instruction → request → unknown */
export function classifyExecutionMode(text) {
  const source = typeof text === 'string' ? text : '';
  if (hasAny(source, DIRECT_ACT_SIGNALS)) return 'direct_act';
  // 서술형 직접 행동("…을 만진다", "…가져간다", "…했다") — 직접 신체 조작을 완료 서술하는 형태
  if (/(?:한다|했다|해 버린|시켰|시킨다)$/.test(source.trim()) || /[가-힣]다$/.test(source.trim())) return 'direct_act';
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

function detectCompanyAuthorityMisuse(text) {
  const source = typeof text === 'string' ? text : '';
  const authority = ['감사 업무', '감사업무', '인사팀', '공지', '지시', '규정', '업무상', '직무', '명령'];
  return authority.some(token => source.includes(token));
}

// ---------------------------------------------------------------------------
// route 결정
// ---------------------------------------------------------------------------

function resolveRouteAndPolicy({ actionTypes, executionMode, coverage, relationship, companyAuthorityMisuse }) {
  if (coverage?.covered) {
    return {
      route: 'csa_direct',
      completion_policy: 'complete_exact_scope',
      csa_attribution_allowed: true,
      company_authority_attribution_allowed: true,
      schedule_boundary_followup: false,
      reason_code: 'CSA_DIRECT_EXACT_MATCH'
    };
  }
  if (!actionTypes.length) {
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
    // 명령형은 관계 milestone과 무관하게 강제 명령 — blocked (회사 권한 악용 포함 시 reason 기록)
    return {
      route: 'ordinary_direct_blocked',
      completion_policy: 'attempt_only',
      csa_attribution_allowed: false,
      company_authority_attribution_allowed: false,
      schedule_boundary_followup: true,
      reason_code: companyAuthorityMisuse ? 'COMPANY_AUTHORITY_MISUSE' : 'OUTSIDE_CSA_WITHOUT_RELATIONSHIP_PERMISSION'
    };
  }
  // direct_act / statement / unknown — 관계 milestone gate
  const highest = actionTypes[0];
  const milestoneBacked = highest === 'kiss'
    ? Boolean(relationship.first_kiss_turn)
    : Boolean(relationship.sexual_relationship_started_turn);
  if (milestoneBacked) {
    return {
      route: 'ordinary_direct_attempt',
      completion_policy: 'npc_response_required',
      csa_attribution_allowed: false,
      company_authority_attribution_allowed: false,
      schedule_boundary_followup: false,
      reason_code: 'RELATIONSHIP_MILESTONE_BACKED'
    };
  }
  return {
    route: 'ordinary_direct_blocked',
    completion_policy: 'attempt_only',
    csa_attribution_allowed: false,
    company_authority_attribution_allowed: false,
    schedule_boundary_followup: true,
    reason_code: companyAuthorityMisuse ? 'COMPANY_AUTHORITY_MISUSE' : 'OUTSIDE_CSA_WITHOUT_RELATIONSHIP_PERMISSION'
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
 *   metadata를 최우선 신호로 사용하고, resolveCsaDirectCoverage가 현재 save·참가자·
 *   semantic contract로 재검증한다 (Extract의 suggested_route를 그대로 신뢰하지 않음)
 * - free-text path: 코드 기반 조합 matcher (행동 동사 + 신체/대상 신호)
 * - 추가 await/fetch/LLM 없음 — 순수 결정 함수
 */
export function resolveActionExecutionContract({ save, playerAction, csaCatalog, characters = [], npcIds = [] } = {}) {
  const text = typeof playerAction === 'string' ? playerAction : '';
  const actionTypes = classifyMaterialActions(text);
  const executionMode = classifyExecutionMode(text);
  const coverage = resolveCsaDirectCoverage(save, text, {
    sexualActionContract: csaCatalog?.sexual_action_contract,
    actionTypes
  });
  const targetId = inferTargetId(save, text, characters, npcIds);
  const relationship = relationshipFor(save, targetId);
  const companyAuthorityMisuse = detectCompanyAuthorityMisuse(text);

  const routeInfo = resolveRouteAndPolicy({
    actionTypes, executionMode, coverage, relationship, companyAuthorityMisuse
  });

  const contract = {
    version: 1,
    material_action: actionTypes.length > 0,
    action_types: actionTypes,
    execution_mode: executionMode,
    actor_id: 'player',
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
 * - csa_direct: 기존 positive contract + exact-scope 강화 문장
 * - ordinary_direct_blocked / ordinary_request / ordinary_direct_attempt: 짧고 강한 음수 계약
 */
export function buildActionExecutionContractSection(contract, { applicableCsa = [] } = {}) {
  if (!contract) return '';
  if (contract.route === 'csa_direct') {
    const base = buildCsaDirectCoverageSection(contract.csa_coverage);
    if (!base) return '';
    return `${base} 이 확정은 명시된 exact action(${contract.action_types.join(', ')})에만 적용된다. 유사 행동, 더 강한 신체 접촉, 노출, 성적 행동으로 확장하지 않는다.`;
  }
  if (contract.route === 'ordinary') return '';
  if (contract.route === 'ordinary_request') {
    return `\n\n[ACTION EXECUTION CONTRACT — REQUEST]\n이번 플레이어 입력(${contract.action_types.join(', ')})은 활성 상식개변의 직접 범위를 벗어난 요청이다. 요청 자체는 전달되지만, NPC가 관계·성격·현재 경계에 따라 수락·거절·조건을 제시한다. 요청했다는 이유만으로 바로 완료하지 않는다. CSA acceptance나 신체적 흥분은 동의가 아니다. 회사 규정·감사 업무·인사팀 지시로 정당화하지 않는다.`;
  }
  if (contract.route === 'ordinary_direct_attempt') {
    return `\n\n[ACTION EXECUTION CONTRACT — ATTEMPT]\n이번 입력(${contract.action_types.join(', ')})은 활성 상식개변 범위 밖의 직접 시도이며 기존 관계가 이를 뒷받침한다. 자동 성공도 자동 실패도 아니다. NPC 반응이 반드시 서사에 존재해야 한다. CSA나 회사 권한 때문이 아니라 일반 관계 행동으로 처리한다.`;
  }
  // ordinary_direct_blocked
  return `\n\n[ACTION EXECUTION CONTRACT — AUTHORITATIVE]\n이번 플레이어 입력에는 활성 상식개변의 직접 범위를 벗어난 행동이 포함되어 있다(${contract.action_types.join(', ')}, 직접 신체 조작).${csaScopeLine(applicableCsa)}\nNPC는 이를 회사 규정, 감사 업무, 인사팀 공지, 상식개변 의무로 해석해서는 안 된다. CSA acceptance나 신체적 흥분은 동의가 아니다. 플레이어가 직접 행동을 시도한 경우 완료 사실로 바로 확정하지 말고, NPC의 즉각적인 선택·중단·거리 확보·경계 표현을 서사에 포함한다.`;
}
