import { getApplicableCsaEntries } from './applicability.js';
import { buildCsaSemanticContract, STRUCTURED_SEXUAL_ACTIONS } from './semantic-contract.js';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const PLAYER_GROUPS = new Set(['player']);
const COMPANY_PERSON_GROUPS = new Set([
  'coworker',
  'manager',
  'employee',
  'company_employee',
  'female_employee',
  'male_employee',
  'everyone_in_company',
  'conversation_partner',
  'another_present_person',
  'nearby_person'
]);

function characterInfo(id, roster) {
  if (!roster || typeof roster !== 'object') return {};
  if (Array.isArray(roster)) {
    return roster.find(entry => entry && (
      entry.character_id === id
      || entry.npc_id === id
      || entry.id === id
    )) ?? {};
  }
  return roster[id] ?? {};
}

const MANAGER_RE = /팀장|부장|차장|과장|이사|실장|본부장|대표|매니저/;
const isManager = char => char && MANAGER_RE.test(
  `${char.role_title ?? ''} ${char.position ?? ''} ${char.role ?? ''}`
);

function genderOf(char) {
  const explicit = char?.gender ?? char?.sex;
  if (explicit === 'female' || explicit === 'male') return explicit;
  const id = String(char?.character_id ?? char?.npc_id ?? char?.id ?? '');
  if (id.startsWith('heroine')) return 'female';
  return null;
}

function sceneParticipants(save) {
  return Array.isArray(save?.scene_state?.participants)
    ? save.scene_state.participants.filter(id => typeof id === 'string' && id)
    : [];
}

function isPlayerId(id) {
  return id === 'player' || id === 'player-1' || /^player(?:[-_]|$)/.test(String(id));
}

/**
 * Resolves an actor group to one concrete participant.
 * `scene_state.participants` is authoritative. The player is selected only by
 * an explicit player group; company-person target resolution is handled by
 * resolveTargetParticipant so actor selection stays deterministic.
 */
export function resolveParticipant(
  groupId,
  { save, presentCharacterId, master, characters, excludeCharacterId } = {}
) {
  if (typeof groupId !== 'string' || !groupId) return null;
  if (PLAYER_GROUPS.has(groupId)) return { type: 'player', characterId: null };
  if (groupId === 'unknown' || groupId === 'none') return null;

  const roster = characters ?? master?.characters ?? {};
  const participants = sceneParticipants(save);
  let npcIds = participants.filter(id => !isPlayerId(id) && id !== excludeCharacterId);
  if (!npcIds.length && presentCharacterId && !isPlayerId(presentCharacterId)
    && presentCharacterId !== excludeCharacterId) {
    npcIds = [presentCharacterId];
  }

  if (groupId === 'conversation_partner') {
    const focus = typeof save?.scene_state?.focus_thread === 'string'
      ? save.scene_state.focus_thread
      : '';
    const targetId = focus.startsWith('relationship:')
      ? focus.slice('relationship:'.length)
      : null;
    if (targetId && npcIds.includes(targetId)) {
      return { type: 'npc', characterId: targetId };
    }
    return npcIds.length ? { type: 'npc', characterId: npcIds[0] } : null;
  }

  for (const id of npcIds) {
    const char = characterInfo(id, roster);
    const gender = genderOf(char);
    switch (groupId) {
      case 'female_employee':
        if (gender === 'female') return { type: 'npc', characterId: id };
        break;
      case 'male_employee':
        if (gender === 'male') return { type: 'npc', characterId: id };
        break;
      case 'manager':
        if (isManager(char)) return { type: 'npc', characterId: id };
        break;
      case 'coworker':
      case 'employee':
      case 'company_employee':
      case 'everyone_in_company':
      case 'another_present_person':
      case 'nearby_person':
        return { type: 'npc', characterId: id };
      default:
        return null;
    }
  }
  return null;
}

/**
 * Resolves a target group after the actor is known.
 *
 * The old implementation removed the player from the participant pool before
 * resolving every non-player target group. Therefore a rule such as
 * company_employee -> coworker could resolve the NPC actor but never the player
 * target in a two-person scene. Exact requests such as "규정에 따라 완화해
 * 주세요" then fell through to ordinary_request/authority misuse.
 *
 * When the actor is an NPC and the player is the only other eligible company
 * person in the current scene, the player is the target. A structured target
 * of `player`, or explicit first-person wording, also selects the player.
 */
function resolveTargetParticipant(
  groupId,
  {
    save,
    presentCharacterId,
    master,
    characters,
    actor,
    playerAction = '',
    preferredTargetId = null
  } = {}
) {
  if (!groupId || groupId === 'none') return { type: 'none', characterId: null };
  if (groupId === 'player') return { type: 'player', characterId: null };

  const participants = sceneParticipants(save);
  const playerPresent = participants.some(isPlayerId);
  const remainingNpcIds = participants.filter(
    id => !isPlayerId(id) && id !== actor?.characterId
  );
  const firstPersonTarget = /(?:나|저|제)(?:를|에게|의| 상태| 컨디션)|(?:도와|완화|확인).*(?:주세요|해줘|주실|해주시)/.test(
    String(playerAction)
  );
  const playerEligible = COMPANY_PERSON_GROUPS.has(groupId);

  if (actor?.type === 'npc' && playerPresent && playerEligible && (
    preferredTargetId === 'player'
    || remainingNpcIds.length === 0
    || firstPersonTarget
  )) {
    return { type: 'player', characterId: null };
  }

  return resolveParticipant(groupId, {
    save,
    presentCharacterId,
    master,
    characters,
    excludeCharacterId: actor?.characterId ?? null
  });
}

function resolveDirection(actor, target) {
  if (actor?.type === 'npc' && target?.type === 'player') return 'npc_to_player';
  if (actor?.type === 'player' && target?.type === 'npc') return 'player_to_npc';
  return 'none';
}

const ACTION_KEYWORDS = {
  kiss: ['키스', '입맞춤'],
  sexual_touch: ['가슴', '유두', '애무', '스킨십'],
  genital_exposure: ['벗', '노출'],
  genital_touch: ['성기', '자위'],
  // action-execution-contract의 ORAL_SIGNALS와 일치 — 결과 중심 CSA의 method_variant 판정 정본
  oral: ['펠라티오', '커닐링구스', '구강', '입으로', '빨아', '핥'],
  penetration: ['삽입', '성관계', '섹스']
};

function classifyMaterialActions(text) {
  const source = typeof text === 'string' ? text : '';
  const matched = [];
  for (const action of STRUCTURED_SEXUAL_ACTIONS) {
    if (action === 'none') continue;
    if ((ACTION_KEYWORDS[action] || []).some(keyword => source.includes(keyword))) {
      matched.push(action);
    }
  }
  return matched;
}

function csaContent(csa) {
  return typeof csa?.content === 'string' ? csa.content : '';
}

function resolveSexualCoverage(
  applicableCsa,
  text,
  actionTypes,
  { save, presentCharacterId, sexualActionContract, master, characters }
) {
  for (const csa of applicableCsa) {
    const contract = buildCsaSemanticContract(csa, sexualActionContract);
    if (contract.sexual_authorization !== true || contract.direct_execution !== true) continue;
    if (!actionTypes.length) continue;

    const actor = resolveParticipant(contract.actor_group, {
      save, presentCharacterId, master, characters
    });
    const target = contract.target_group
      ? resolveTargetParticipant(contract.target_group, {
          save, presentCharacterId, master, characters, actor, playerAction: text
        })
      : null;
    if (!actor || !target) continue;

    const direction = resolveDirection(actor, target);
    if (!contract.directions.includes(direction)) continue;

    const requiredAction = typeof csa.preset?.required_action === 'string'
      ? csa.preset.required_action
      : null;

    if (contract.method_policy === 'restricted') {
      // 방식이 명시된 규정 — 요청 행동이 허용 목록에 있을 때만 exact.
      if (actionTypes.some(action => !contract.actions.includes(action))) continue;
      return {
        covered: true,
        route: 'csa_direct',
        csa_id: csa.id,
        actor_id: actor.characterId,
        target_id: target.type === 'player' ? 'player' : target.characterId,
        required_action: requiredAction,
        coverage_kind: 'exact',
        action: actionTypes[0],
        all_actions: actionTypes,
        actor_group: contract.actor_group,
        target_group: contract.target_group,
        direction,
        reason: `sexual semantic contract match: actions=[${actionTypes.join(',')}] direction=${direction}`
      };
    }

    // method_policy='unspecified' — 결과 중심 규정(예: resolve_patient_erection).
    // 규정이 방식을 제한하지 않으므로 같은 required outcome을 위한 방식 제안은 method_variant.
    // (규정 목적과 무관한 성적 행동이 아닌 것 — 방향/대상은 이미 위에서 검증됨)
    return {
      covered: true,
      route: 'csa_direct',
      csa_id: csa.id,
      actor_id: actor.characterId,
      target_id: target.type === 'player' ? 'player' : target.characterId,
      required_action: requiredAction,
      coverage_kind: 'method_variant',
      action: actionTypes[0],
      all_actions: actionTypes,
      actor_group: contract.actor_group,
      target_group: contract.target_group,
      direction,
      reason: `result-based CSA method_variant: actions=[${actionTypes.join(',')}] direction=${direction}`
    };
  }
  return { covered: false };
}

/**
 * 이미 실행 중인 CSA(execution_state=executed)를 계속하는 입력을 csa_direct로 인정한다.
 * "계속해", "더 집중해줘", "조금 빠르게 해줘", "그대로 이어가" 같은 입력은
 * 새 material action을 명시하지 않으므로 기존에는 ordinary로 빠졌다.
 * 조건: 같은 CSA가 runtime에서 executed, 동일 actor/target이 현재 장면에 있음,
 *       규정이 여전히 활성(applicableCsa에 포함).
 */
function resolveContinuationCoverage(
  applicableCsa,
  text,
  { save, presentCharacterId, sexualActionContract, master, characters }
) {
  if (!/(계속|이어가|더\s*(집중|빠르게|세게|강하게|조금)|좀\s*더|조금\s*(빠르게|세게|강하게)|그대로)/.test(text)) return { covered: false };
  const runtime = isPlainObject(save?.csa_runtime_state) ? save.csa_runtime_state : {};
  for (const csa of applicableCsa) {
    const contract = buildCsaSemanticContract(csa, sexualActionContract);
    if (contract.sexual_authorization !== true || contract.direct_execution !== true) continue;
    const entry = runtime[csa.id];
    if (!entry || entry.execution_state !== 'executed') continue;

    const actor = resolveParticipant(contract.actor_group, {
      save, presentCharacterId, master, characters
    });
    const target = contract.target_group
      ? resolveTargetParticipant(contract.target_group, {
          save, presentCharacterId, master, characters, actor, playerAction: text
        })
      : null;
    if (!actor || !target) continue;
    const direction = resolveDirection(actor, target);
    if (!contract.directions.includes(direction)) continue;

    return {
      covered: true,
      route: 'csa_direct',
      csa_id: csa.id,
      actor_id: actor.characterId,
      target_id: target.type === 'player' ? 'player' : target.characterId,
      required_action: typeof csa.preset?.required_action === 'string' ? csa.preset.required_action : null,
      coverage_kind: 'continuation',
      action: null,
      all_actions: [],
      actor_group: contract.actor_group,
      target_group: contract.target_group,
      direction,
      reason: `continuing CSA execution: csa=${csa.id} direction=${direction}`
    };
  }
  return { covered: false };
}

const CONTENT_MEANING_TERMS = ['컨디션', '상태', '성적 긴장', '완화', '도움', '속옷', '차림', '근무'];

// 질문·확인·설명 요청 — 단어가 겹쳐도 csa_direct가 아니다.
// "자네 지금 속옷 차림이 맞는 건가?" 같은 확인 질문이 '속옷/차림' 단어 때문에
// 직접 실행으로 오판되는 것을 막는다.
const QUESTION_RE =
  /(맞나|맞는가|맞아요|맞니|인가|인지|인가요|일까|이지|이죠|이잖아|이네요|이더라|이었나|였나|였니|니\s*\?|까\s*\?|나\s*\?|요\s*\?|지\s*\?|가\s*\?|는\s*\?|을까|ㄹ까)|(왜\s|언제\s|어떻게\s|무엇|뭐가|뭐지|뭔지|누가|누구|어디서|몇\s)/;
const ASK_RE =
  /(알려줘|알려주|설명해|설명해줘|설명해주|확인한다|확인해|확인하자|물어본다|물어봐|물어볼|궁금|알고싶|말해줘|말해주|가르쳐|질문|여쭤|여부를|여부가|살펴본다|살펴볼)/;

// 실행 요청·명령 — csa_direct 후보가 되려면 실제 실행 요청이 있어야 한다.
// "해 주세요"처럼 조사 사이 공백이 있어도 매칭되도록 \s* 를 사용한다.
// "무릎 위에 앉게 한다" 같은 명시적 행동 실행문도 포함한다.
const EXECUTE_RE =
  /(해\s*줘|해\s*주세요|해\s*줄래|해라|해\s*주십시오|시행해|시행한다|수행해|수행한다|지켜|지켜라|따라|따르라|적용해|적용한다|같이\s*하자|하도록|하시죠|하십시오|하세요|해\s*달라|요구한다|명령|벗어\s*줘|벗어\s*주세요|입어\s*줘|입어\s*주세요|갈아입어\s*줘|갈아입어\s*주세요|(게|도록)\s*(한다|하라|해라|할게)|벗게\s*한다|입게\s*한다|자세를\s*취한다|취하도록)/;

// 의무형 질문 종결 — 물음표 없이 "지켜야 하나/따라야 하는가" 형태로 끝나는 입력.
// EXECUTE_RE의 지켜/따라/적용해 등과 겹쳐 csa_direct로 오판되는 것을 막는다.
const OBLIGATION_QUESTION_RE =
  /(?:해야|지켜야|따라야|적용해야|수행해야|시행해야)[^.!?！？]*(?:하나|하나요|하는가|되는가|되나|할까|하는지|해야지|될지)\s*[?？]?\s*$/u;

/** 입력이 질문·확인·설명 요청이면 true — csa_direct가 될 수 없다. */
function isQuestionOrRequest(text) {
  if (typeof text !== 'string' || !text.trim()) return true;
  const source = text.trim();
  if (source.endsWith('?') || source.endsWith('？')) return true;
  if (OBLIGATION_QUESTION_RE.test(source)) return true;
  if (QUESTION_RE.test(source)) return true;
  if (ASK_RE.test(source)) return true;
  return false;
}

function directMeaningMatch(csa, text, applicableCount) {
  // 0) 질문·확인·설명 요청은 실행 요청이 아니므로 csa_direct가 아니다.
  if (isQuestionOrRequest(text)) return null;

  // 1) 의미 tag — 실행 요청 문구에 tag가 포함된 경우에만.
  const tags = csa.source_type === 'preset'
    && isPlainObject(csa.preset)
    && Array.isArray(csa.preset.direct_meaning_tags)
    ? csa.preset.direct_meaning_tags.filter(
        tag => typeof tag === 'string' && tag.trim()
      )
    : [];
  const matchedTag = tags.find(tag => text.includes(tag));
  if (matchedTag && EXECUTE_RE.test(text)) return matchedTag;

  const content = csaContent(csa);
  const matchedContentTerm = CONTENT_MEANING_TERMS.find(
    term => content.includes(term) && text.includes(term)
  );
  // 2) 단어 일치만으로 csa_direct가 되지 않는다 — 실행 요청 동사가 있어야 한다.
  if (matchedContentTerm && EXECUTE_RE.test(text)) return matchedContentTerm;

  const genericRuleRequest = /(규정|규칙|지침|공지).*(반영|적용|수행|지켜|따라)/.test(text);
  if (genericRuleRequest && applicableCount === 1) return 'single applicable CSA rule request';
  return null;
}

function resolveNonsexualCoverage(
  applicableCsa,
  text,
  { save, presentCharacterId, sexualActionContract, master, characters }
) {
  for (const csa of applicableCsa) {
    const matchedMeaning = directMeaningMatch(csa, text, applicableCsa.length);
    if (!matchedMeaning) continue;

    const contract = buildCsaSemanticContract(csa, sexualActionContract);
    const actor = resolveParticipant(contract.actor_group, {
      save, presentCharacterId, master, characters
    });
    const target = contract.target_group
      ? resolveTargetParticipant(contract.target_group, {
          save, presentCharacterId, master, characters, actor, playerAction: text
        })
      : { type: 'none', characterId: null };
    // Preserve the existing nonsexual fallback: old saves without a complete
    // participant list may still match by exact rule meaning when the semantic
    // contract does not require a concrete direction. When the current scene
    // does identify the player target, keep the resolved npc_to_player direction.
    if (!actor) continue;

    const direction = contract.target_group ? resolveDirection(actor, target) : 'none';
    if (contract.target_group
      && contract.directions.length
      && !contract.directions.includes(direction)) continue;

    return {
      covered: true,
      route: 'csa_direct',
      csa_id: csa.id,
      action: csa.preset?.required_action || null,
      all_actions: [],
      actor_group: contract.actor_group,
      target_group: contract.target_group,
      direction,
      reason: `direct CSA meaning match: "${matchedMeaning}"`
    };
  }
  return { covered: false };
}

export function resolveCsaDirectCoverage(
  save,
  playerActionText,
  { sexualActionContract, actionTypes, master, characters } = {}
) {
  const text = typeof playerActionText === 'string' ? playerActionText : '';
  if (!text.trim()) return { covered: false };

  const applicableCsa = getApplicableCsaEntries(save);
  if (!applicableCsa.length) return { covered: false };

  const participants = sceneParticipants(save);
  const presentCharacterId = typeof save?.focal_character_id === 'string'
    && save.focal_character_id
    ? save.focal_character_id
    : participants.find(id => !isPlayerId(id)) ?? null;

  // continuation — 이미 실행 중인 CSA를 계속하는 입력은 새 material action 없이도 csa_direct.
  const continuation = resolveContinuationCoverage(applicableCsa, text, {
    save, presentCharacterId, sexualActionContract, master, characters
  });
  if (continuation?.covered) return continuation;

  const providedActionTypes = Array.isArray(actionTypes)
    ? actionTypes.filter(
        action => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== 'none'
      )
    : [];

  const actionTypeList = providedActionTypes.length
    ? providedActionTypes
    : classifyMaterialActions(text);
  if (actionTypeList.length) {
    const result = resolveSexualCoverage(applicableCsa, text, actionTypeList, {
      save, presentCharacterId, sexualActionContract, master, characters
    });
    return result.covered ? result : { covered: false };
  }

  return resolveNonsexualCoverage(applicableCsa, text, {
    save, presentCharacterId, sexualActionContract, master, characters
  });
}

export function buildCsaDirectCoverageSection(coverage) {
  if (!coverage?.covered) return '';
  const kind = coverage.coverage_kind === 'method_variant'
    ? ' (방식 제안 — 규정이 결과만 정의해 방식을 제한하지 않는다)'
    : (coverage.coverage_kind === 'continuation' ? ' (이미 진행 중인 절차의 계속)' : '');
  const methodLine = coverage.coverage_kind === 'method_variant'
    ? '\n규정은 특정 수행 방식을 허용 목록으로 제한하지 않는다. NPC가 개인적·실무적 이유로 다른 방식을 제안하거나 부끄러워하거나 망설일 수는 있지만, 존재하지 않는 규정 제한("규정상 손으로만 가능합니다", "절차에는 구강 방식이 없습니다")으로 포장하지 않는다. 규정의 required outcome은 계속 이행해야 한다.'
    : '';
  return `\n\n[CSA DIRECT COVERAGE — ESTABLISHED FACT]${kind}\n플레이어의 이번 입력은 활성 상식개변(${coverage.csa_id})의 직접 범위와 정확히 일치한다(행동주체=${coverage.actor_group}, 대상=${coverage.target_group ?? '없음'}, 방향=${coverage.direction}${coverage.action ? `, 행동=${coverage.action}` : ''}). 이 행동은 반드시 실행되는 확정 사실이며, 성공 확률이나 위험도로 표현하지 않는다. 이 규칙 범위를 벗어나는 추가 행동은 일반 행동 판정을 따른다.${methodLine}`;
}
