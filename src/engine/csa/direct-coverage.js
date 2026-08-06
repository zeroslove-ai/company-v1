/**
 * Code-level direct CSA coverage matcher — ported from donor's
 * resolveCsaDirectCoverage/resolveStructuredCsaDirectCoverage/
 * resolveSexualCsaDirectCoverage/resolveNonsexualCsaDirectCoverage/
 * resolveCsaContractDirection family, scoped to what Company's character
 * model and turn architecture actually support.
 *
 * Donor's PRIMARY mechanism is structured: Extract classifies each of the
 * turn's rendered choices (choice_structured_meta: action_types/actor_id/
 * target_id/suggested_route/direct_csa_ids), the Worker never trusts that
 * classification alone and independently re-verifies actor_id/target_id
 * against the actually-resolved current participants before accepting a
 * match; free-text keyword classification is only donor's FALLBACK for
 * choices that predate structured metadata. Company's turn model has no
 * separate "classify these choices" step — Extract already sees the
 * rendered choices as part of parsed_story, so Company's adapter has
 * Extract emit the same per-choice structured signal (persisted as
 * save.last_choice_meta, index-aligned with save.last_choices), and this
 * module's dispatcher, given the player's chosen action text, looks up the
 * matching choice's structured entry and treats it as the primary signal —
 * falling back to the original tag/keyword matcher only when no structured
 * entry exists for that action (custom-typed input, or a pre-existing save
 * without this field). The previous version treated ANY actor_group as
 * satisfied by "whichever NPC happens to be present" and inferred
 * actor/target/direction purely from text keywords; the structured path
 * fixes both by requiring an Extract-reported actor_id/target_id that is
 * cross-validated against the live save's actual present participants.
 *
 * No bold-choice/success_rate/probability system is ported anywhere in
 * this module; a match is either covered (established fact) or it falls
 * through to ordinary action judgment.
 */
import { getApplicableCsaEntries } from './applicability.js';
import { buildCsaSemanticContract, STRUCTURED_SEXUAL_ACTIONS } from './semantic-contract.js';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const PLAYER_GROUPS = new Set(['player']);
// Every non-player Company group or explicit stable selector currently resolves to the
// concrete NPC present in this scene. The group id is still preserved as audit evidence; a
// future role-tag resolver can narrow it without changing the semantic-contract shape.

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

function normalizedChoiceText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

/**
 * Looks up the structured signal Extract reported for the choice the player just took, by
 * matching the player's action text against the previously-rendered save.last_choices at the
 * same index as save.last_choice_meta. Returns null (never guesses) when the text doesn't
 * exactly match a rendered choice — custom-typed input has no structured signal to consult
 * and always falls through to the tag/keyword matcher below, exactly like donor's own
 * fallback path for choices predating structured metadata.
 */
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

/**
 * Cross-validates a structured actor_id/target_id against the participant actually resolved
 * from the CSA's own actor_group/target_group + live scene state — an id is never trusted on
 * its own. 'player' matches only a player-type participant; any other id must equal the
 * concretely-resolved present NPC's characterId.
 */
function structuredParticipantMatches(participant, id) {
  if (!participant || !id) return false;
  if (id === 'player') return participant.type === 'player';
  return participant.type === 'npc' && participant.characterId === id;
}

/**
 * Donor-faithful structured resolution: filters the choice's reported action_types to the
 * known sexual-action enum, requires distinct actor_id/target_id, then for every currently
 * applicable sexual+direct CSA checks (in order) the contract covers every action_type
 * (bundled-uncovered-action rejects the whole choice), the scene-resolved participants exist
 * and satisfy the contract's direction, and finally that the structured actor_id/target_id
 * actually match those same resolved participants. Never trusts actor_id/target_id alone.
 */
function resolveStructuredSexualCoverage(applicableCsa, meta, { save, presentCharacterId, sexualActionContract }) {
  const actionTypes = Array.isArray(meta?.action_types) ? meta.action_types.filter(action => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== 'none') : [];
  if (!actionTypes.length) return { covered: false };
  const actorId = typeof meta?.actor_id === 'string' && meta.actor_id ? meta.actor_id : null;
  const targetId = typeof meta?.target_id === 'string' && meta.target_id ? meta.target_id : null;
  if (!actorId || !targetId || actorId === targetId) return { covered: false };

  for (const csa of applicableCsa) {
    const contract = buildCsaSemanticContract(csa, sexualActionContract);
    if (contract.sexual_authorization !== true || contract.direct_execution !== true) continue;
    if (actionTypes.some(action => !contract.actions.includes(action))) continue;
    const actor = resolveParticipant(contract.actor_group, { save, presentCharacterId });
    const target = resolveParticipant(contract.target_group, { save, presentCharacterId });
    if (!actor || !target) continue;
    const direction = resolveDirection(actor, target);
    if (!contract.directions.includes(direction)) continue;
    if (!structuredParticipantMatches(actor, actorId) || !structuredParticipantMatches(target, targetId)) continue;
    return {
      covered: true, route: 'csa_direct', csa_id: csa.id, action: actionTypes[0], all_actions: actionTypes,
      actor_group: contract.actor_group, target_group: contract.target_group, direction,
      reason: `structured signal match: actor_id=${actorId} target_id=${targetId} actions=[${actionTypes.join(',')}] direction=${direction}`
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
 *
 * Structured signal (Extract's choice_structured_meta, cross-validated against
 * the live save) is the PRIMARY path for a sexual action, mirroring donor's
 * own precedence. It's only consulted when the player's action text exactly
 * matches a previously-rendered choice; a materially sexual match that fails
 * every applicable CSA's structured check is final (never falls through to
 * keyword guessing — donor's dispatcher does exactly this: "Extract said
 * sexual, no CSA covers it exactly, never fall through"). Only when NO
 * structured entry exists at all (custom-typed action, or a save predating
 * this field) does resolution fall back to the free-text tag/keyword matcher.
 */
export function resolveCsaDirectCoverage(save, playerActionText, { sexualActionContract, actionTypes } = {}) {
  const text = typeof playerActionText === 'string' ? playerActionText : '';
  if (!text.trim()) return { covered: false };
  const applicableCsa = getApplicableCsaEntries(save);
  if (!applicableCsa.length) return { covered: false };
  const presentCharacterId = typeof save?.focal_character_id === 'string' && save.focal_character_id
    ? save.focal_character_id
    : (Array.isArray(save?.scene_state?.participants) ? save.scene_state.participants.find(id => typeof id === 'string') : null) ?? null;

  // 호출부(ActionExecutionContract)가 조합 matcher로 판정한 actionTypes가 주어지면
  // free-text 경로에서 이를 사용한다 (기본은 이 모듈의 좁은 ACTION_KEYWORDS).
  const providedActionTypes = Array.isArray(actionTypes)
    ? actionTypes.filter(action => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== 'none')
    : [];

  const structuredMeta = findChoiceStructuredMeta(save, text);
  if (structuredMeta) {
    const structuredActionTypes = Array.isArray(structuredMeta.action_types)
      ? structuredMeta.action_types.filter(action => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== 'none')
      : [];
    if (structuredActionTypes.length) {
      const structuredResult = resolveStructuredSexualCoverage(applicableCsa, structuredMeta, { save, presentCharacterId, sexualActionContract });
      // Extract already classified this choice as materially sexual — never fall
      // back to keyword guessing just because no CSA's structured check matched.
      return structuredResult.covered ? structuredResult : { covered: false };
    }
    // Extract classified this choice as non-sexual; the nonsexual path is
    // tag-based in donor too (no structured actor_id/target_id requirement there).
    return resolveNonsexualCoverage(applicableCsa, text, { save, presentCharacterId, sexualActionContract });
  }

  // No structured signal for this exact text (custom input, or a choice that
  // predates this field) — fall back to the original tag/keyword matcher.
  const actionTypeList = providedActionTypes.length ? providedActionTypes : classifyMaterialActions(text);
  if (actionTypeList.length) {
    const sexualResult = resolveSexualCoverage(applicableCsa, text, actionTypeList, { save, presentCharacterId, sexualActionContract });
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
