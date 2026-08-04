/**
 * Code-level direct CSA coverage matcher — ported from donor's
 * resolveCsaDirectCoverage/resolveSexualCsaDirectCoverage/
 * resolveNonsexualCsaDirectCoverage/resolveCsaContractDirection family,
 * scoped down to what Company's character model actually supports.
 *
 * Donor resolves actor_group/target_group against a generic role-tagged
 * NPC pool (nurse/doctor/patient/...) drawn from many interchangeable
 * hospital staff. Company's heroines are five specific named characters
 * with no such role-tag pool, so "a present NPC satisfies a generic staff
 * group" collapses to "the current scene's present/focal heroine satisfies
 * it" — the same fallback donor itself uses for its broadest group
 * ('everyone_in_hospital'). No bold-choice/success_rate/probability system
 * is ported; a match is either covered (established fact) or it falls
 * through to ordinary action judgment.
 */
import { getApplicableCsaEntries } from './applicability.js';
import { buildCsaSemanticContract, STRUCTURED_SEXUAL_ACTIONS } from './semantic-contract.js';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const PLAYER_GROUPS = new Set(['player']);
// Every other actor/target group id in the ported catalog (nurse, doctor,
// medical_staff, hospital_staff, female_staff, male_staff, patient,
// assigned_patient, guardian, visitor, everyone_in_hospital,
// conversation_partner, another_present_person, nearby_person) resolves to
// "whichever NPC is actually present in this scene" — Company has no
// role-tag pool to further discriminate between them.

/** Resolves an actor_group/target_group id to a concrete participant given the current scene. */
function resolveParticipant(groupId, { save, presentCharacterId } = {}) {
  if (typeof groupId !== 'string' || !groupId) return null;
  if (PLAYER_GROUPS.has(groupId)) return { type: 'player', characterId: null };
  if (presentCharacterId) return { type: 'npc', characterId: presentCharacterId };
  return null;
}

function resolveDirection(actor, target) {
  if (actor?.type === 'npc' && target?.type === 'player') return 'npc_to_player';
  if (actor?.type === 'player' && target?.type === 'npc') return 'player_to_npc';
  return 'none';
}

// Keyword classifier mapping player-input text to the exact structured sexual
// action(s) it materially describes — the same deterministic keyword-heuristic
// style already used elsewhere in this codebase (see engine/player-setup.js),
// not an LLM classifier.
const ACTION_KEYWORDS = {
  kiss: ['키스', '입맞춤'],
  sexual_touch: ['가슴', '유두', '애무', '스킨십'],
  genital_exposure: ['벗', '노출'],
  genital_touch: ['성기', '자위'],
  oral: ['펠라티오', '커닐링구스', '구강'],
  penetration: ['삽입', '성관계', '섹스']
};

/** Every exact structured action the text materially describes — never just the first match, so a bundled uncovered act is still detected. */
function classifyMaterialActions(text) {
  const source = typeof text === 'string' ? text : '';
  const matched = [];
  for (const action of STRUCTURED_SEXUAL_ACTIONS) {
    if (action === 'none') continue;
    if ((ACTION_KEYWORDS[action] || []).some(keyword => source.includes(keyword))) matched.push(action);
  }
  return matched;
}

function csaContent(csa) {
  return typeof csa?.content === 'string' ? csa.content : '';
}

function resolveSexualCoverage(applicableCsa, text, actionTypes, { save, presentCharacterId, sexualActionContract }) {
  for (const csa of applicableCsa) {
    const contract = buildCsaSemanticContract(csa, sexualActionContract);
    if (contract.sexual_authorization !== true || contract.direct_execution !== true) continue;
    // A choice bundling an uncovered material action is never wholly csa_direct.
    if (actionTypes.some(action => !contract.actions.includes(action))) continue;
    if (!actionTypes.length) continue;
    const actor = resolveParticipant(contract.actor_group, { save, presentCharacterId });
    const target = resolveParticipant(contract.target_group, { save, presentCharacterId });
    if (!actor || !target) continue;
    const direction = resolveDirection(actor, target);
    if (!contract.directions.includes(direction)) continue;
    return {
      covered: true, route: 'csa_direct', csa_id: csa.id, action: actionTypes[0], all_actions: actionTypes,
      actor_group: contract.actor_group, target_group: contract.target_group, direction,
      reason: `sexual semantic contract match: actions=[${actionTypes.join(',')}] direction=${direction}`
    };
  }
  return { covered: false };
}

function resolveNonsexualCoverage(applicableCsa, text, { save, presentCharacterId, sexualActionContract }) {
  for (const csa of applicableCsa) {
    const tags = csa.source_type === 'preset' && isPlainObject(csa.preset) && Array.isArray(csa.preset.direct_meaning_tags)
      ? csa.preset.direct_meaning_tags.filter(tag => typeof tag === 'string' && tag.trim())
      : [];
    if (!tags.length) continue;
    const coreTags = tags.slice(0, 2);
    const matchedCore = coreTags.some(tag => text.includes(tag));
    if (!matchedCore) continue;
    const contract = buildCsaSemanticContract(csa, sexualActionContract);
    const actor = resolveParticipant(contract.actor_group, { save, presentCharacterId });
    const target = contract.target_group ? resolveParticipant(contract.target_group, { save, presentCharacterId }) : { type: 'none' };
    if (!actor) continue;
    const direction = contract.target_group ? resolveDirection(actor, target) : 'none';
    if (contract.target_group && contract.directions.length && !contract.directions.includes(direction)) continue;
    return {
      covered: true, route: 'csa_direct', csa_id: csa.id, action: csa.preset?.required_action || null, all_actions: [],
      actor_group: contract.actor_group, target_group: contract.target_group, direction,
      reason: `direct_meaning_tags core match: "${coreTags.find(tag => text.includes(tag))}"`
    };
  }
  return { covered: false };
}

/**
 * Top-level dispatcher: exact actor + exact target + direction + action +
 * (for sexual contracts) the full semantic-contract match, with the exact
 * matched csa_id/action/actor_group/target_group/direction as evidence.
 * Never produces a probability, a bold-choice flag, or a risk tier — the
 * result is binary (covered/not covered) and the caller decides what to do
 * with it (established-fact injection into Story, or falling through to
 * ordinary action judgment).
 */
export function resolveCsaDirectCoverage(save, playerActionText, { sexualActionContract } = {}) {
  const text = typeof playerActionText === 'string' ? playerActionText : '';
  if (!text.trim()) return { covered: false };
  const applicableCsa = getApplicableCsaEntries(save);
  if (!applicableCsa.length) return { covered: false };
  const presentCharacterId = typeof save?.focal_character_id === 'string' && save.focal_character_id
    ? save.focal_character_id
    : (Array.isArray(save?.scene_state?.participants) ? save.scene_state.participants.find(id => typeof id === 'string') : null) ?? null;

  const actionTypes = classifyMaterialActions(text);
  if (actionTypes.length) {
    const sexualResult = resolveSexualCoverage(applicableCsa, text, actionTypes, { save, presentCharacterId, sexualActionContract });
    if (sexualResult.covered) return sexualResult;
    // A materially sexual choice never falls through to the nonsexual tag-match path
    // (README-derived rule: a sexual act's coverage must always go through the full
    // semantic contract, never a bare tag/keyword hit).
    return { covered: false };
  }
  return resolveNonsexualCoverage(applicableCsa, text, { save, presentCharacterId, sexualActionContract });
}

/** Established-fact Story section for an exactly-covered action — never a probability or a choice-style prompt. */
export function buildCsaDirectCoverageSection(coverage) {
  if (!coverage?.covered) return '';
  return `\n\n[CSA DIRECT COVERAGE — ESTABLISHED FACT]\n플레이어의 이번 입력은 활성 상식개변(${coverage.csa_id})의 직접 범위와 정확히 일치한다(행동주체=${coverage.actor_group}, 대상=${coverage.target_group ?? '없음'}, 방향=${coverage.direction}${coverage.action ? `, 행동=${coverage.action}` : ''}). 이 행동은 반드시 실행되는 확정 사실이며, 성공 확률이나 위험도로 표현하지 않는다. 이 규칙 범위를 벗어나는 추가 행동은 일반 행동 판정을 따른다.`;
}
