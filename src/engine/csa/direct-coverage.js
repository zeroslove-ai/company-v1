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
  oral: ['펠라티오', '커닐링구스', '구강'],
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
    if (actionTypes.some(action => !contract.actions.includes(action))) continue;
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
    return {
      covered: true,
      route: 'csa_direct',
      csa_id: csa.id,
      action: actionTypes[0],
      all_actions: actionTypes,
      actor_group: contract.actor_group,
      target_group: contract.target_group,
      direction,
      reason: `sexual semantic contract match: actions=[${actionTypes.join(',')}] direction=${direction}`
    };
  }
  return { covered: false };
}

function normalizedChoiceText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

export function resolveChoiceStructuredSignal(save, playerActionText) {
  return findChoiceStructuredMeta(save, playerActionText);
}

function findChoiceStructuredMeta(save, playerActionText) {
  const choices = Array.isArray(save?.last_choices) ? save.last_choices : [];
  const meta = Array.isArray(save?.last_choice_meta) ? save.last_choice_meta : [];
  if (!choices.length || !meta.length) return null;
  const target = normalizedChoiceText(playerActionText);
  if (!target) return null;
  const index = choices.findIndex(choice => normalizedChoiceText(choice) === target);
  if (index === -1) return null;
  return meta.find(entry => entry?.choice_index === index) ?? null;
}

function structuredParticipantMatches(participant, id) {
  if (!participant || !id) return false;
  if (id === 'player') return participant.type === 'player';
  return participant.type === 'npc' && participant.characterId === id;
}

function resolveStructuredSexualCoverage(
  applicableCsa,
  meta,
  { save, presentCharacterId, sexualActionContract, master, characters }
) {
  const actionTypes = Array.isArray(meta?.action_types)
    ? meta.action_types.filter(
        action => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== 'none'
      )
    : [];
  if (!actionTypes.length) return { covered: false };

  const actorId = typeof meta?.actor_id === 'string' && meta.actor_id
    ? meta.actor_id
    : null;
  const targetId = typeof meta?.target_id === 'string' && meta.target_id
    ? meta.target_id
    : null;
  if (!actorId || !targetId || actorId === targetId) return { covered: false };

  for (const csa of applicableCsa) {
    const contract = buildCsaSemanticContract(csa, sexualActionContract);
    if (contract.sexual_authorization !== true || contract.direct_execution !== true) continue;
    if (actionTypes.some(action => !contract.actions.includes(action))) continue;

    const actor = resolveParticipant(contract.actor_group, {
      save, presentCharacterId, master, characters
    });
    const target = contract.target_group
      ? resolveTargetParticipant(contract.target_group, {
          save,
          presentCharacterId,
          master,
          characters,
          actor,
          preferredTargetId: targetId
        })
      : null;
    if (!actor || !target) continue;

    const direction = resolveDirection(actor, target);
    if (!contract.directions.includes(direction)) continue;
    if (!structuredParticipantMatches(actor, actorId)
      || !structuredParticipantMatches(target, targetId)) continue;

    return {
      covered: true,
      route: 'csa_direct',
      csa_id: csa.id,
      action: actionTypes[0],
      all_actions: actionTypes,
      actor_group: contract.actor_group,
      target_group: contract.target_group,
      direction,
      reason: `structured signal match: actor_id=${actorId} target_id=${targetId} actions=[${actionTypes.join(',')}] direction=${direction}`
    };
  }
  return { covered: false };
}

const CONTENT_MEANING_TERMS = ['컨디션', '상태', '성적 긴장', '완화', '도움', '속옷', '차림', '근무'];

function directMeaningMatch(csa, text, applicableCount) {
  const tags = csa.source_type === 'preset'
    && isPlainObject(csa.preset)
    && Array.isArray(csa.preset.direct_meaning_tags)
    ? csa.preset.direct_meaning_tags.filter(
        tag => typeof tag === 'string' && tag.trim()
      )
    : [];
  const matchedTag = tags.find(tag => text.includes(tag));
  if (matchedTag) return matchedTag;

  const content = csaContent(csa);
  const matchedContentTerm = CONTENT_MEANING_TERMS.find(
    term => content.includes(term) && text.includes(term)
  );
  if (matchedContentTerm) return matchedContentTerm;

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
    if (!actor || !target) continue;

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

  const providedActionTypes = Array.isArray(actionTypes)
    ? actionTypes.filter(
        action => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== 'none'
      )
    : [];

  const structuredMeta = findChoiceStructuredMeta(save, text);
  if (structuredMeta) {
    const structuredActionTypes = Array.isArray(structuredMeta.action_types)
      ? structuredMeta.action_types.filter(
          action => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== 'none'
        )
      : [];
    if (structuredActionTypes.length) {
      const result = resolveStructuredSexualCoverage(applicableCsa, structuredMeta, {
        save, presentCharacterId, sexualActionContract, master, characters
      });
      return result.covered ? result : { covered: false };
    }
    return resolveNonsexualCoverage(applicableCsa, text, {
      save, presentCharacterId, sexualActionContract, master, characters
    });
  }

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
  return `\n\n[CSA DIRECT COVERAGE — ESTABLISHED FACT]\n플레이어의 이번 입력은 활성 상식개변(${coverage.csa_id})의 직접 범위와 정확히 일치한다(행동주체=${coverage.actor_group}, 대상=${coverage.target_group ?? '없음'}, 방향=${coverage.direction}${coverage.action ? `, 행동=${coverage.action}` : ''}). 이 행동은 반드시 실행되는 확정 사실이며, 성공 확률이나 위험도로 표현하지 않는다. 이 규칙 범위를 벗어나는 추가 행동은 일반 행동 판정을 따른다.`;
}
