var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/engine/errors.js
var GameCoreError = class extends Error {
  static {
    __name(this, "GameCoreError");
  }
  constructor(code, message, details = null) {
    super(message);
    this.name = "GameCoreError";
    this.code = code;
    this.details = details;
  }
};

// src/engine/edition.js
var REQUIRED_FIELDS = [
  "editionId",
  "contentVersion",
  "organization",
  "map",
  "characters",
  "generalNpcs",
  "csaPresets"
];
function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
__name(isPlainObject, "isPlainObject");
function assertPlainObject(value, field) {
  if (!isPlainObject(value)) {
    throw new GameCoreError("INVALID_EDITION_ADAPTER", `${field} must be a plain object`, { field });
  }
}
__name(assertPlainObject, "assertPlainObject");
function assertNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new GameCoreError("INVALID_EDITION_ADAPTER", `${field} must be a non-empty string`, { field });
  }
}
__name(assertNonEmptyString, "assertNonEmptyString");
function validateEditionAdapter(adapter) {
  assertPlainObject(adapter, "edition adapter");
  for (const field of REQUIRED_FIELDS) {
    if (!(field in adapter)) {
      throw new GameCoreError("INVALID_EDITION_ADAPTER", `Missing required field: ${field}`, { field });
    }
  }
  assertNonEmptyString(adapter.editionId, "editionId");
  assertNonEmptyString(adapter.contentVersion, "contentVersion");
  for (const field of REQUIRED_FIELDS.slice(2)) {
    assertPlainObject(adapter[field], field);
  }
  return adapter;
}
__name(validateEditionAdapter, "validateEditionAdapter");
function createEditionAdapter(adapter) {
  return validateEditionAdapter(adapter);
}
__name(createEditionAdapter, "createEditionAdapter");

// src/engine/csa/applicability.js
function isPlainObject2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject2, "isPlainObject");
var SCOPE_LABEL = "\uD68C\uC0AC \uC804\uCCB4";
function normalizeCsaScope() {
  return { scope_type: "world", scope_id: "world", scope_label: SCOPE_LABEL };
}
__name(normalizeCsaScope, "normalizeCsaScope");
function getCsaRules(save) {
  return isPlainObject2(save?.csa_rules) ? save.csa_rules : {};
}
__name(getCsaRules, "getCsaRules");
function legacyContent(rule) {
  if (typeof rule?.content === "string" && rule.content.trim()) return rule.content;
  return typeof rule?.required_action === "string" ? rule.required_action : "";
}
__name(legacyContent, "legacyContent");
function getActiveCsaEntries(save) {
  const ids = Array.isArray(save?.csa_active) ? save.csa_active : [];
  const rules = getCsaRules(save);
  return ids.filter((id) => typeof id === "string" && isPlainObject2(rules[id])).map((id) => {
    const rule = rules[id];
    return {
      id,
      ...rule,
      active: rule.active !== false,
      content: legacyContent(rule),
      source_type: rule.source_type === "preset" ? "preset" : "custom"
    };
  });
}
__name(getActiveCsaEntries, "getActiveCsaEntries");
function isCsaApplicable(csa) {
  return csa?.active === true;
}
__name(isCsaApplicable, "isCsaApplicable");
function getApplicableCsaEntries(save, activeCsa = getActiveCsaEntries(save)) {
  return activeCsa.filter(isCsaApplicable);
}
__name(getApplicableCsaEntries, "getApplicableCsaEntries");

// src/engine/csa/semantic-contract.js
var STRUCTURED_SEXUAL_ACTIONS = /* @__PURE__ */ new Set(["none", "kiss", "sexual_touch", "genital_exposure", "genital_touch", "oral", "penetration"]);
var STRUCTURED_SEXUAL_DIRECTIONS = /* @__PURE__ */ new Set(["none", "npc_to_player", "player_to_npc"]);
var LEGACY_GROUP_ALIASES = /* @__PURE__ */ new Map([
  ["nurse", "coworker"],
  ["doctor", "manager"],
  ["medical_staff", "employee"],
  ["hospital_staff", "company_employee"],
  ["female_staff", "female_employee"],
  ["male_staff", "male_employee"],
  ["patient", "business_visitor"],
  ["assigned_patient", "assigned_visitor"],
  ["guardian", "partner_contact"],
  ["visitor", "guest"],
  ["everyone_in_hospital", "everyone_in_company"]
]);
var CSA_CONTRACT_ACTOR_GROUPS = /* @__PURE__ */ new Set([
  "coworker",
  "manager",
  "employee",
  "company_employee",
  "female_employee",
  "male_employee",
  "business_visitor",
  "assigned_visitor",
  "partner_contact",
  "guest",
  "everyone_in_company",
  "player",
  "conversation_partner",
  "another_present_person",
  "nearby_person",
  "unknown"
]);
var CSA_CONTRACT_TARGET_GROUPS = /* @__PURE__ */ new Set([
  "business_visitor",
  "assigned_visitor",
  "coworker",
  "manager",
  "employee",
  "company_employee",
  "female_employee",
  "male_employee",
  "partner_contact",
  "guest",
  "player",
  "conversation_partner",
  "another_present_person",
  "nearby_person",
  "unknown"
]);
var TRIGGER_ALIASES = /* @__PURE__ */ new Map([
  ["consultation_start", "meeting_start"],
  ["explanation_start", "briefing_start"],
  ["comforting", "support_action"],
  ["check_condition", "status_check"]
]);
var DURATION_ALIASES = /* @__PURE__ */ new Map([
  ["until_consultation_ends", "until_meeting_ends"],
  ["until_explanation_ends", "until_briefing_ends"],
  ["until_target_relaxed", "until_goal_reached"]
]);
var TRIGGERS = /* @__PURE__ */ new Set([
  "on_request",
  "conversation_start",
  "meeting_start",
  "briefing_start",
  "support_action",
  "status_check",
  "during_work",
  "always_on_duty",
  "custom_condition",
  "none"
]);
var DURATIONS = /* @__PURE__ */ new Set([
  "instant",
  "until_conversation_ends",
  "until_meeting_ends",
  "until_briefing_ends",
  "until_goal_reached",
  "until_explicit_position_change",
  "until_work_ends",
  "while_on_duty",
  "continuous"
]);
var STABLE_SELECTOR_RE = /^(character|department|position|team|role):[^\s]{1,80}$/;
function isPlainObject3(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject3, "isPlainObject");
function conciseText(value, maxLength = 100) {
  if (typeof value !== "string") return "";
  return Array.from(value.trim().replace(/\s+/g, " ")).slice(0, maxLength).join("");
}
__name(conciseText, "conciseText");
function canonicalizeCsaGroup(value, { target = false } = {}) {
  const raw = conciseText(value);
  if (!raw) return "unknown";
  const canonical = LEGACY_GROUP_ALIASES.get(raw) ?? raw;
  const known = target ? CSA_CONTRACT_TARGET_GROUPS : CSA_CONTRACT_ACTOR_GROUPS;
  if (known.has(canonical) || STABLE_SELECTOR_RE.test(canonical)) return canonical;
  return canonical;
}
__name(canonicalizeCsaGroup, "canonicalizeCsaGroup");
function canonicalizeCsaTrigger(value) {
  const raw = conciseText(value);
  if (!raw) return "none";
  return TRIGGER_ALIASES.get(raw) ?? raw;
}
__name(canonicalizeCsaTrigger, "canonicalizeCsaTrigger");
function canonicalizeCsaDuration(value) {
  const raw = conciseText(value);
  if (!raw) return "continuous";
  return DURATION_ALIASES.get(raw) ?? raw;
}
__name(canonicalizeCsaDuration, "canonicalizeCsaDuration");
function safeSexualGroup(group, target = false) {
  const known = target ? CSA_CONTRACT_TARGET_GROUPS : CSA_CONTRACT_ACTOR_GROUPS;
  return group !== "unknown" && (known.has(group) || STABLE_SELECTOR_RE.test(group));
}
__name(safeSexualGroup, "safeSexualGroup");
function normalizeCsaSemanticContract(value = {}) {
  const source = isPlainObject3(value) ? value : {};
  const actions = [...new Set((Array.isArray(source.actions) ? source.actions : []).filter((action) => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== "none"))];
  const directions = [...new Set((Array.isArray(source.directions) ? source.directions : []).filter((direction) => STRUCTURED_SEXUAL_DIRECTIONS.has(direction) && direction !== "none"))];
  const actorGroup = canonicalizeCsaGroup(source.actor_group);
  const targetGroup = canonicalizeCsaGroup(source.target_group, { target: true });
  const trigger = canonicalizeCsaTrigger(source.trigger);
  const duration = canonicalizeCsaDuration(source.duration);
  const sexualAuthorization = source.sexual_authorization === true && actions.length > 0 && directions.length > 0 && safeSexualGroup(actorGroup) && safeSexualGroup(targetGroup, true) && TRIGGERS.has(trigger) && trigger !== "none" && DURATIONS.has(duration);
  return {
    version: 1,
    sexual_authorization: sexualAuthorization,
    directions,
    actions,
    actor_group: actorGroup,
    target_group: targetGroup,
    trigger,
    duration,
    public_normalization: source.public_normalization === true,
    direct_execution: source.direct_execution === true,
    confidence: source.confidence === "exact" ? "exact" : "ambiguous"
  };
}
__name(normalizeCsaSemanticContract, "normalizeCsaSemanticContract");
function validateCustomCsaSemanticContract({ rawContract = {}, normalizedContract = {} } = {}) {
  if (rawContract?.sexual_authorization !== true) return { ok: true };
  const contract = normalizeCsaSemanticContract(normalizedContract);
  const ok2 = contract.sexual_authorization === true && contract.confidence === "exact" && contract.actions.length > 0 && contract.directions.length > 0 && contract.actor_group !== "unknown" && contract.target_group !== "unknown" && contract.trigger !== "none" && contract.direct_execution === true;
  return ok2 ? { ok: true } : { ok: false, code: "CUSTOM_CSA_SEXUAL_SCOPE_AMBIGUOUS", message: "\uD589\uB3D9 \uC8FC\uCCB4\xB7\uB300\uC0C1\xB7\uD589\uB3D9 \uC885\uB958\xB7\uBC1C\uB3D9 \uC0C1\uD669\uC744 \uB354 \uBA85\uD655\uD788 \uC801\uC5B4 \uC8FC\uC138\uC694." };
}
__name(validateCustomCsaSemanticContract, "validateCustomCsaSemanticContract");
function buildPresetCsaSemanticContract(csa = {}, sexualActionContract = {}) {
  const preset = isPlainObject3(csa?.preset) ? csa.preset : {};
  const required = String(preset.required_action || "");
  const mapped = sexualActionContract?.[required];
  return normalizeCsaSemanticContract({
    sexual_authorization: Boolean(mapped),
    directions: mapped?.directions || [],
    actions: mapped?.actions || [],
    actor_group: preset.actor_group || "unknown",
    target_group: preset.target_group || "unknown",
    trigger: preset.trigger || "none",
    duration: preset.duration || "continuous",
    public_normalization: preset.public_normalization === true,
    direct_execution: Boolean(preset.required_action),
    confidence: "exact"
  });
}
__name(buildPresetCsaSemanticContract, "buildPresetCsaSemanticContract");
function buildCsaSemanticContract(csa = {}, sexualActionContract = {}) {
  return csa?.source_type === "preset" ? buildPresetCsaSemanticContract(csa, sexualActionContract) : normalizeCsaSemanticContract(csa?.semantic_contract);
}
__name(buildCsaSemanticContract, "buildCsaSemanticContract");

// src/engine/csa/direct-coverage.js
function isPlainObject4(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject4, "isPlainObject");
var PLAYER_GROUPS = /* @__PURE__ */ new Set(["player"]);
function characterInfo(id, roster) {
  if (!roster || typeof roster !== "object") return {};
  if (Array.isArray(roster)) return roster.find((entry) => entry && (entry.character_id === id || entry.npc_id === id)) ?? {};
  return roster[id] ?? {};
}
__name(characterInfo, "characterInfo");
var isEmployee = /* @__PURE__ */ __name((char) => char && (typeof char.role_title === "string" || typeof char.department === "string" || typeof char.position === "string" || typeof char.character_id === "string" || typeof char.name === "string"), "isEmployee");
var MANAGER_RE = /팀장|부장|차장|과장|이사|실장|본부장|대표|매니저/;
var isManager = /* @__PURE__ */ __name((char) => char && MANAGER_RE.test(`${char.role_title ?? ""} ${char.position ?? ""}`), "isManager");
function genderOf(char) {
  if (typeof char?.gender === "string" && char.gender) return char.gender;
  const id = String(char?.character_id ?? char?.id ?? "");
  if (id.startsWith("heroine")) return "female";
  return null;
}
__name(genderOf, "genderOf");
var roleTextOf = /* @__PURE__ */ __name((char) => `${char?.role_title ?? ""} ${char?.position ?? ""} ${char?.role ?? ""} ${char?.character_type ?? ""}`, "roleTextOf");
var VISITOR_RE = /visitor|guest|external|방문/;
var PARTNER_RE = /partner|collaborator|협력/;
function resolveParticipant(groupId, { save, presentCharacterId, master, characters, excludeCharacterId } = {}) {
  if (typeof groupId !== "string" || !groupId) return null;
  if (PLAYER_GROUPS.has(groupId)) return { type: "player", characterId: null };
  if (groupId === "unknown" || groupId === "none") return null;
  const roster = characters ?? master?.characters ?? {};
  const participants = Array.isArray(save?.scene_state?.participants) ? save.scene_state.participants : [];
  let npcIds = participants.filter((id) => typeof id === "string" && id !== "player-1" && id !== "player" && id !== excludeCharacterId);
  if (!npcIds.length && presentCharacterId && presentCharacterId !== excludeCharacterId) npcIds = [presentCharacterId];
  if (groupId === "conversation_partner") {
    const focus = typeof save?.scene_state?.focus_thread === "string" ? save.scene_state.focus_thread : "";
    const targetId = focus.startsWith("relationship:") ? focus.slice("relationship:".length) : null;
    if (targetId && npcIds.includes(targetId)) return { type: "npc", characterId: targetId };
    return npcIds.length ? { type: "npc", characterId: npcIds[0] } : null;
  }
  for (const id of npcIds) {
    const char = characterInfo(id, roster);
    const g = genderOf(char);
    const text5 = roleTextOf(char);
    switch (groupId) {
      case "female_employee":
        if (g === "female" && isEmployee(char)) return { type: "npc", characterId: id };
        break;
      case "male_employee":
        if (g === "male" && isEmployee(char)) return { type: "npc", characterId: id };
        break;
      case "company_employee":
      case "coworker":
        if (isEmployee(char)) return { type: "npc", characterId: id };
        break;
      case "manager":
        if (isManager(char)) return { type: "npc", characterId: id };
        break;
      case "employee":
        if (isEmployee(char) && !isManager(char)) return { type: "npc", characterId: id };
        break;
      case "business_visitor":
        if (VISITOR_RE.test(text5) && !/guest/.test(char?.role ?? "")) return { type: "npc", characterId: id };
        break;
      case "assigned_visitor":
        if (/assigned|담당/.test(text5) && VISITOR_RE.test(text5)) return { type: "npc", characterId: id };
        break;
      case "partner_contact":
        if (PARTNER_RE.test(text5)) return { type: "npc", characterId: id };
        break;
      case "guest":
        if (char?.role === "guest" || /방문객/.test(text5)) return { type: "npc", characterId: id };
        break;
      case "another_present_person":
      case "nearby_person":
      default:
        return { type: "npc", characterId: id };
    }
  }
  return null;
}
__name(resolveParticipant, "resolveParticipant");
function resolveDirection(actor, target) {
  if (actor?.type === "npc" && target?.type === "player") return "npc_to_player";
  if (actor?.type === "player" && target?.type === "npc") return "player_to_npc";
  return "none";
}
__name(resolveDirection, "resolveDirection");
var ACTION_KEYWORDS = {
  kiss: ["\uD0A4\uC2A4", "\uC785\uB9DE\uCDA4"],
  sexual_touch: ["\uAC00\uC2B4", "\uC720\uB450", "\uC560\uBB34", "\uC2A4\uD0A8\uC2ED"],
  genital_exposure: ["\uBC97", "\uB178\uCD9C"],
  genital_touch: ["\uC131\uAE30", "\uC790\uC704"],
  oral: ["\uD3A0\uB77C\uD2F0\uC624", "\uCEE4\uB2D0\uB9C1\uAD6C\uC2A4", "\uAD6C\uAC15"],
  penetration: ["\uC0BD\uC785", "\uC131\uAD00\uACC4", "\uC139\uC2A4"]
};
function classifyMaterialActions(text5) {
  const source = typeof text5 === "string" ? text5 : "";
  const matched = [];
  for (const action of STRUCTURED_SEXUAL_ACTIONS) {
    if (action === "none") continue;
    if ((ACTION_KEYWORDS[action] || []).some((keyword) => source.includes(keyword))) matched.push(action);
  }
  return matched;
}
__name(classifyMaterialActions, "classifyMaterialActions");
function resolveSexualCoverage(applicableCsa, text5, actionTypes, { save, presentCharacterId, sexualActionContract, master, characters }) {
  for (const csa of applicableCsa) {
    const contract = buildCsaSemanticContract(csa, sexualActionContract);
    if (contract.sexual_authorization !== true || contract.direct_execution !== true) continue;
    if (actionTypes.some((action) => !contract.actions.includes(action))) continue;
    if (!actionTypes.length) continue;
    const actor = resolveParticipant(contract.actor_group, { save, presentCharacterId, master, characters });
    const target = contract.target_group ? resolveParticipant(contract.target_group, { save, presentCharacterId, master, characters, excludeCharacterId: actor?.characterId ?? null }) : null;
    if (!actor || !target) continue;
    const direction = resolveDirection(actor, target);
    if (!contract.directions.includes(direction)) continue;
    return {
      covered: true,
      route: "csa_direct",
      csa_id: csa.id,
      action: actionTypes[0],
      all_actions: actionTypes,
      actor_group: contract.actor_group,
      target_group: contract.target_group,
      direction,
      reason: `sexual semantic contract match: actions=[${actionTypes.join(",")}] direction=${direction}`
    };
  }
  return { covered: false };
}
__name(resolveSexualCoverage, "resolveSexualCoverage");
function normalizedChoiceText(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}
__name(normalizedChoiceText, "normalizedChoiceText");
function resolveChoiceStructuredSignal(save, playerActionText) {
  return findChoiceStructuredMeta(save, playerActionText);
}
__name(resolveChoiceStructuredSignal, "resolveChoiceStructuredSignal");
function findChoiceStructuredMeta(save, playerActionText) {
  const choices2 = Array.isArray(save?.last_choices) ? save.last_choices : [];
  const meta = Array.isArray(save?.last_choice_meta) ? save.last_choice_meta : [];
  if (!choices2.length || !meta.length) return null;
  const target = normalizedChoiceText(playerActionText);
  if (!target) return null;
  const index = choices2.findIndex((choice) => normalizedChoiceText(choice) === target);
  if (index === -1) return null;
  return meta.find((entry) => entry?.choice_index === index) ?? null;
}
__name(findChoiceStructuredMeta, "findChoiceStructuredMeta");
function structuredParticipantMatches(participant, id) {
  if (!participant || !id) return false;
  if (id === "player") return participant.type === "player";
  return participant.type === "npc" && participant.characterId === id;
}
__name(structuredParticipantMatches, "structuredParticipantMatches");
function resolveStructuredSexualCoverage(applicableCsa, meta, { save, presentCharacterId, sexualActionContract, master, characters }) {
  const actionTypes = Array.isArray(meta?.action_types) ? meta.action_types.filter((action) => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== "none") : [];
  if (!actionTypes.length) return { covered: false };
  const actorId = typeof meta?.actor_id === "string" && meta.actor_id ? meta.actor_id : null;
  const targetId = typeof meta?.target_id === "string" && meta.target_id ? meta.target_id : null;
  if (!actorId || !targetId || actorId === targetId) return { covered: false };
  for (const csa of applicableCsa) {
    const contract = buildCsaSemanticContract(csa, sexualActionContract);
    if (contract.sexual_authorization !== true || contract.direct_execution !== true) continue;
    if (actionTypes.some((action) => !contract.actions.includes(action))) continue;
    const actor = resolveParticipant(contract.actor_group, { save, presentCharacterId, master, characters });
    const target = contract.target_group ? resolveParticipant(contract.target_group, { save, presentCharacterId, master, characters, excludeCharacterId: actor?.characterId ?? null }) : null;
    if (!actor || !target) continue;
    const direction = resolveDirection(actor, target);
    if (!contract.directions.includes(direction)) continue;
    if (!structuredParticipantMatches(actor, actorId) || !structuredParticipantMatches(target, targetId)) continue;
    return {
      covered: true,
      route: "csa_direct",
      csa_id: csa.id,
      action: actionTypes[0],
      all_actions: actionTypes,
      actor_group: contract.actor_group,
      target_group: contract.target_group,
      direction,
      reason: `structured signal match: actor_id=${actorId} target_id=${targetId} actions=[${actionTypes.join(",")}] direction=${direction}`
    };
  }
  return { covered: false };
}
__name(resolveStructuredSexualCoverage, "resolveStructuredSexualCoverage");
function resolveNonsexualCoverage(applicableCsa, text5, { save, presentCharacterId, sexualActionContract, master, characters }) {
  for (const csa of applicableCsa) {
    const tags = csa.source_type === "preset" && isPlainObject4(csa.preset) && Array.isArray(csa.preset.direct_meaning_tags) ? csa.preset.direct_meaning_tags.filter((tag) => typeof tag === "string" && tag.trim()) : [];
    if (!tags.length) continue;
    const coreTags = tags.slice(0, 2);
    const matchedCore = coreTags.some((tag) => text5.includes(tag));
    if (!matchedCore) continue;
    const contract = buildCsaSemanticContract(csa, sexualActionContract);
    const actor = resolveParticipant(contract.actor_group, { save, presentCharacterId, master, characters });
    const target = contract.target_group ? resolveParticipant(contract.target_group, { save, presentCharacterId, master, characters, excludeCharacterId: actor?.characterId ?? null }) : { type: "none" };
    if (!actor) continue;
    const direction = contract.target_group ? resolveDirection(actor, target) : "none";
    if (contract.target_group && contract.directions.length && !contract.directions.includes(direction)) continue;
    return {
      covered: true,
      route: "csa_direct",
      csa_id: csa.id,
      action: csa.preset?.required_action || null,
      all_actions: [],
      actor_group: contract.actor_group,
      target_group: contract.target_group,
      direction,
      reason: `direct_meaning_tags core match: "${coreTags.find((tag) => text5.includes(tag))}"`
    };
  }
  return { covered: false };
}
__name(resolveNonsexualCoverage, "resolveNonsexualCoverage");
function resolveCsaDirectCoverage(save, playerActionText, { sexualActionContract, actionTypes, master, characters } = {}) {
  const text5 = typeof playerActionText === "string" ? playerActionText : "";
  if (!text5.trim()) return { covered: false };
  const applicableCsa = getApplicableCsaEntries(save);
  if (!applicableCsa.length) return { covered: false };
  const presentCharacterId = typeof save?.focal_character_id === "string" && save.focal_character_id ? save.focal_character_id : (Array.isArray(save?.scene_state?.participants) ? save.scene_state.participants.find((id) => typeof id === "string") : null) ?? null;
  const providedActionTypes = Array.isArray(actionTypes) ? actionTypes.filter((action) => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== "none") : [];
  const structuredMeta = findChoiceStructuredMeta(save, text5);
  if (structuredMeta) {
    const structuredActionTypes = Array.isArray(structuredMeta.action_types) ? structuredMeta.action_types.filter((action) => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== "none") : [];
    if (structuredActionTypes.length) {
      const structuredResult = resolveStructuredSexualCoverage(applicableCsa, structuredMeta, { save, presentCharacterId, sexualActionContract, master, characters });
      return structuredResult.covered ? structuredResult : { covered: false };
    }
    return resolveNonsexualCoverage(applicableCsa, text5, { save, presentCharacterId, sexualActionContract, master, characters });
  }
  const actionTypeList = providedActionTypes.length ? providedActionTypes : classifyMaterialActions(text5);
  if (actionTypeList.length) {
    const sexualResult = resolveSexualCoverage(applicableCsa, text5, actionTypeList, { save, presentCharacterId, sexualActionContract, master, characters });
    if (sexualResult.covered) return sexualResult;
    return { covered: false };
  }
  return resolveNonsexualCoverage(applicableCsa, text5, { save, presentCharacterId, sexualActionContract, master, characters });
}
__name(resolveCsaDirectCoverage, "resolveCsaDirectCoverage");
function buildCsaDirectCoverageSection(coverage) {
  if (!coverage?.covered) return "";
  return `

[CSA DIRECT COVERAGE \u2014 ESTABLISHED FACT]
\uD50C\uB808\uC774\uC5B4\uC758 \uC774\uBC88 \uC785\uB825\uC740 \uD65C\uC131 \uC0C1\uC2DD\uAC1C\uBCC0(${coverage.csa_id})\uC758 \uC9C1\uC811 \uBC94\uC704\uC640 \uC815\uD655\uD788 \uC77C\uCE58\uD55C\uB2E4(\uD589\uB3D9\uC8FC\uCCB4=${coverage.actor_group}, \uB300\uC0C1=${coverage.target_group ?? "\uC5C6\uC74C"}, \uBC29\uD5A5=${coverage.direction}${coverage.action ? `, \uD589\uB3D9=${coverage.action}` : ""}). \uC774 \uD589\uB3D9\uC740 \uBC18\uB4DC\uC2DC \uC2E4\uD589\uB418\uB294 \uD655\uC815 \uC0AC\uC2E4\uC774\uBA70, \uC131\uACF5 \uD655\uB960\uC774\uB098 \uC704\uD5D8\uB3C4\uB85C \uD45C\uD604\uD558\uC9C0 \uC54A\uB294\uB2E4. \uC774 \uADDC\uCE59 \uBC94\uC704\uB97C \uBC97\uC5B4\uB098\uB294 \uCD94\uAC00 \uD589\uB3D9\uC740 \uC77C\uBC18 \uD589\uB3D9 \uD310\uC815\uC744 \uB530\uB978\uB2E4.`;
}
__name(buildCsaDirectCoverageSection, "buildCsaDirectCoverageSection");

// src/engine/action-execution-contract.js
var PERSON_PRONOUNS = ["\uC774\uBA54\uC774", "\uC11C\uC6D0\uD76C", "\uC724\uBBFC\uC544", "\uD55C\uB9AC\uBE0C", "\uAE40\uC81C\uB098", "\uBC15\uC815\uC6B0", "\uC774\uBBFC\uC11D", "\uADF8\uB140", "\uADF8\uB140\uB97C"];
var OBJECT_NOUNS = ["\uC11C\uB958", "\uB9C8\uC6B0\uC2A4", "\uC804\uC2DC\uD488", "\uBB38\uC11C", "\uCC45", "\uBB3C\uAC74", "\uAE30\uAE30", "\uD3F0", "\uD734\uB300\uD3F0", "\uD0A4\uBCF4\uB4DC", "\uC790\uD310", "\uBCFC\uD39C", "\uCEF5", "\uC794", "\uC11C\uB78D", "\uBB38", "\uBCFC", "\uACF5", "\uD654\uBD84", "\uC0C1\uC790", "\uAC00\uBC29", "\uC11C\uB958\uD568", "\uD544\uAE30\uAD6C"];
var BODY_SIGNALS = {
  breast: ["\uAC00\uC2B4", "\uC720\uBC29", "\uC720\uB450"],
  hip: ["\uC5C9\uB369\uC774", "\uD5C8\uBC85\uC9C0 \uC548\uCABD", "\uD5C8\uBC85\uC9C0"],
  underwear: ["\uC18D\uC637", "\uD32C\uD2F0", "\uBE0C\uB798\uC9C0\uC5B4", "\uBE0C\uB77C", "\uC5B8\uB354\uC6E8\uC5B4"],
  clothes: ["\uCE58\uB9C8", "\uBC14\uC9C0", "\uC9C0\uD37C", "\uC637", "\uC0C1\uC758", "\uD558\uC758", "\uC2A4\uCEE4\uD2B8", "\uC6D0\uD53C\uC2A4"],
  genital: ["\uC131\uAE30", "\uC790\uC9C0", "\uC74C\uBD80", "\uBCF4\uC9C0", "\uD074\uB9AC\uD1A0\uB9AC\uC2A4", "\uC0AC\uD0C0\uAD6C\uB2C8"],
  inner: ["\uC9C0\uD37C \uC548", "\uD32C\uD2F0 \uC548", "\uC18D\uC637 \uC548", "\uBC14\uC9C0 \uC548", "\uC637 \uC548"]
};
var KISS_SIGNALS = ["\uD0A4\uC2A4", "\uC785\uB9DE\uCDA4", "\uC785\uC220\uC744 \uB9DE\uB304", "\uC785\uC220\uC5D0 \uC785\uC744", "\uC785\uC220\uC744 \uBD80\uB52A", "\uC785\uC744 \uB9DE\uCD94", "\uC785\uC744 \uB9DE\uCD98", "\uC785\uB9DE\uCD94"];
var TOUCH_SIGNALS = ["\uB9CC\uC9C0", "\uB9CC\uC838", "\uB9CC\uC9C4", "\uB9CC\uC9D1", "\uB9CC\uC84C", "\uC8FC\uBB34\uB974", "\uC8FC\uBB3C\uB7EC", "\uC8FC\uBB3C\uB800", "\uBE44\uBE44", "\uBE44\uBCD0", "\uBB38\uC9C0\uB974", "\uBB38\uC9C8\uB7EC", "\uBB38\uC9C8\uB800", "\uC560\uBB34", "\uC2A4\uD0A8\uC2ED", "\uC4F0\uB2E4\uB4EC", "\uC4F0\uB2E4\uB4EC\uC5B4", "\uC6C0\uCF1C\uC950", "\uC6C0\uCF1C\uC7A1", "\uC7A1", "\uC7A1\uC544", "\uC7A1\uB294", "\uB04C\uC5B4\uC548"];
var EXPOSE_SIGNALS = ["\uBC97", "\uBC97\uC5B4", "\uBC97\uC740", "\uB0B4\uB9AC", "\uB0B4\uB824", "\uC62C\uB9AC", "\uC62C\uB824", "\uAC77", "\uAC77\uC5B4", "\uAC77\uC740", "\uBC8C\uB9AC", "\uBC8C\uB824", "\uBCF4\uC5EC", "\uB178\uCD9C", "\uD655\uC778", "\uB4E4\uCD94"];
var GENITAL_TOUCH_SIGNALS = ["\uC190\uC744 \uB123", "\uC190\uC744 \uAC00\uC838\uAC00", "\uC190\uC744 \uAC00\uC838\uAC04", "\uC190\uBAA9\uC744 \uC7A1\uC544", "\uC190\uBAA9\uC744 \uC7A1\uACE0", "\uC190\uC744 \uC62C\uB824", "\uC190\uC744 \uAC16\uB2E4", "\uC9C1\uC811 \uC7A1\uAC8C", "\uAC00\uC838\uAC00", "\uAC00\uC838\uAC04"];
var ORAL_SIGNALS = ["\uD3A0\uB77C\uD2F0\uC624", "\uCEE4\uB2D0\uB9C1\uAD6C\uC2A4", "\uAD6C\uAC15", "\uC785\uC73C\uB85C", "\uBE68\uC544", "\uD565"];
var PENETRATION_SIGNALS = ["\uC0BD\uC785", "\uC131\uAD00\uACC4", "\uC139\uC2A4", "\uB123\uC5B4", "\uAD00\uACC4\uB97C \uAC00"];
function hasAny(source, tokens) {
  return tokens.some((token) => source.includes(token));
}
__name(hasAny, "hasAny");
function classifyMaterialActions2(text5) {
  const source = typeof text5 === "string" ? text5 : "";
  if (!source.trim()) return [];
  const actions = /* @__PURE__ */ new Set();
  if (hasAny(source, KISS_SIGNALS)) actions.add("kiss");
  const genitalTarget = hasAny(source, [...BODY_SIGNALS.genital, ...BODY_SIGNALS.inner]);
  const exposureTarget = hasAny(source, [...BODY_SIGNALS.underwear, ...BODY_SIGNALS.clothes, ...BODY_SIGNALS.breast]);
  const bodyTarget = hasAny(source, [...BODY_SIGNALS.breast, ...BODY_SIGNALS.hip]);
  const touching = hasAny(source, TOUCH_SIGNALS);
  const exposing = hasAny(source, EXPOSE_SIGNALS);
  const genitalTouching = touching || hasAny(source, GENITAL_TOUCH_SIGNALS);
  if (genitalTarget && genitalTouching) actions.add("genital_touch");
  if (exposureTarget && exposing) actions.add("genital_exposure");
  if (/(다|전부|모두|그냥|옷을 전부)\s*(벗|탈의)/.test(source)) actions.add("genital_exposure");
  if (bodyTarget && touching) actions.add("sexual_touch");
  if (!bodyTarget && !genitalTarget && (source.includes("\uB9CC\uC9C0") || source.includes("\uB9CC\uC838"))) {
    const personContext = PERSON_PRONOUNS.some((t) => source.includes(t)) || /(그녀|그를|상대|사람|여자|남자|누나|형|언니|오빠)/.test(source);
    const objectContext = OBJECT_NOUNS.some((t) => source.includes(t));
    if (personContext || !objectContext && /(주실|주세요|해줄래|해주시|부탁|줄래|해도 될까요|할 수 있나요)/.test(source)) {
      actions.add("sexual_touch");
    }
  }
  if (hasAny(source, ORAL_SIGNALS) && (genitalTarget || hasAny(source, ["\uC131\uAE30", "\uC74C\uBD80", "\uC785\uC73C\uB85C"]))) actions.add("oral");
  const genitalOnly = hasAny(source, BODY_SIGNALS.genital);
  if (hasAny(source, PENETRATION_SIGNALS) && (genitalOnly || hasAny(source, ["\uC0BD\uC785", "\uC131\uAD00\uACC4", "\uC139\uC2A4"]))) actions.add("penetration");
  return [...actions];
}
__name(classifyMaterialActions2, "classifyMaterialActions");
var DIRECT_ACT_SIGNALS = [
  "\uC190\uBAA9\uC744 \uC7A1\uC544",
  "\uC190\uC744 \uAC00\uC838\uAC00",
  "\uC190\uC744 \uC62C\uB824",
  "\uBAB8\uC744 \uB04C\uC5B4\uB2F9",
  "\uC785\uC744 \uB9DE\uCD98",
  "\uC637\uC744 \uAC77",
  "\uC9C0\uD37C \uC548\uC73C\uB85C \uB123",
  "\uC9C1\uC811 \uC7A1\uAC8C",
  "\uB04C\uC5B4\uC548",
  "\uC7A1\uC544\uB2F9",
  "\uB215\uD788",
  "\uB36E\uCE58",
  "\uBD99\uC7A1"
];
var INSTRUCTION_SIGNALS = ["\uD558\uC138\uC694", "\uD574\uC57C \uD569\uB2C8\uB2E4", "\uC57C \uD569\uB2C8\uB2E4", "\uBC97\uC73C\uC138\uC694", "\uC9C0\uC2DC\uD55C\uB2E4", "\uBA85\uB839\uD55C\uB2E4", "\uB0B4\uB9AC\uC138\uC694", "\uC549\uC544\uB77C", "\uB123\uC5B4\uB77C", "\uB9CC\uC838\uB77C", "\uBCF4\uC5EC\uB77C", "\uD558\uB77C"];
var REQUEST_SIGNALS = ["\uD574\uC904\uB798", "\uD574\uC8FC\uC2DC\uACA0", "\uD560 \uC218 \uC788\uB098\uC694", "\uAC00\uB2A5\uD560\uAE4C\uC694", "\uBD80\uD0C1", "\uC6D0\uD574\uC694", "\uC5B4\uB54C\uC694", "\uB3C4 \uB420\uAE4C\uC694", "\uD574\uB3C4 \uB420\uAE4C\uC694", "\uC8FC\uC2E4 \uC218", "\uC8FC\uC138\uC694", "\uC904\uB798", "\uD574\uC8FC\uC138\uC694", "\uBCF4\uC5EC\uC8FC\uC138\uC694", "\uB9CC\uC838\uC8FC\uC2E4", "\uD574\uC8FC\uC2E4", "\uD574\uC918", "\uBCF4\uC5EC\uC918", "\uC918", "\uB9CC\uC838\uC918", "\uC548\uC544\uC918", "\uBC97\uC5B4\uC918", "\uD574\uC904 \uC218"];
function classifyExecutionMode(text5) {
  const source = typeof text5 === "string" ? text5 : "";
  if (hasAny(source, DIRECT_ACT_SIGNALS)) return "direct_act";
  const stripped = source.trim().replace(/[.!?。！？\s]+$/, "");
  if (/(?:한다|했다|해 버린|시켰|시킨다)$/.test(stripped)) return "direct_act";
  if (/[가-힣](?:ㄴ다|는다)$/.test(stripped) || /[가-힣]다$/.test(stripped) && !/(니다|습니다|읍니다|이다|있습니다|없습니다)$/.test(stripped)) return "direct_act";
  if (hasAny(source, INSTRUCTION_SIGNALS)) return "instruction";
  if (hasAny(source, REQUEST_SIGNALS)) return "request";
  return "unknown";
}
__name(classifyExecutionMode, "classifyExecutionMode");
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
__name(relationshipFor, "relationshipFor");
function inferTargetId(save, text5, characters, npcIds) {
  const source = typeof text5 === "string" ? text5 : "";
  const focal = typeof save?.focal_character_id === "string" ? save.focal_character_id : null;
  const entries2 = [
    ...Array.isArray(characters) ? characters : [],
    ...Array.isArray(npcIds) ? npcIds : []
  ].filter(Boolean);
  if (focal && source.includes(focal)) return focal;
  const byName = entries2.find((entry) => typeof entry?.name === "string" && entry.name && source.includes(entry.name));
  return byName ? byName.character_id ?? byName.npc_id ?? byName.id ?? null : focal;
}
__name(inferTargetId, "inferTargetId");
function stableNpcIds(characters, npcIds) {
  return /* @__PURE__ */ new Set([
    ...(Array.isArray(characters) ? characters : []).map((entry) => entry.character_id ?? entry.id ?? entry.npc_id).filter(Boolean),
    ...(Array.isArray(npcIds) ? npcIds : []).map((entry) => entry.npc_id ?? entry.id).filter(Boolean)
  ]);
}
__name(stableNpcIds, "stableNpcIds");
function resolveStrictMaterialTarget({ structuredSignal, save, characters, npcIds, text: text5 } = {}) {
  const stable = stableNpcIds(characters, npcIds);
  const sceneParticipants = Array.isArray(save?.scene_state?.participants) ? save.scene_state.participants : [];
  if (structuredSignal && typeof structuredSignal === "object") {
    const targetId = structuredSignal.target_id;
    const actorId = structuredSignal.actor_id;
    const choiceIndex = structuredSignal.choice_index;
    if (targetId && targetId !== "player" && actorId === "player" && stable.has(targetId) && sceneParticipants.includes(targetId) && Number.isInteger(choiceIndex)) {
      return targetId;
    }
  }
  const source = typeof text5 === "string" ? text5 : "";
  const choiceText = structuredSignal?.choice_index != null && Array.isArray(save?.last_choices) && typeof save.last_choices[structuredSignal.choice_index] === "string" ? save.last_choices[structuredSignal.choice_index] : "";
  const combined = `${source} ${choiceText}`;
  const entries2 = [
    ...Array.isArray(characters) ? characters : [],
    ...Array.isArray(npcIds) ? npcIds : []
  ].filter(Boolean);
  for (const entry of entries2) {
    const name = typeof entry?.name === "string" ? entry.name : "";
    if (name && combined.includes(name)) {
      return entry.character_id ?? entry.npc_id ?? entry.id ?? null;
    }
  }
  return null;
}
__name(resolveStrictMaterialTarget, "resolveStrictMaterialTarget");
function detectCompanyAuthorityMisuse(text5) {
  const source = typeof text5 === "string" ? text5 : "";
  const authority = ["\uAC10\uC0AC \uC5C5\uBB34", "\uAC10\uC0AC\uC5C5\uBB34", "\uC778\uC0AC\uD300", "\uACF5\uC9C0", "\uC9C0\uC2DC", "\uADDC\uC815", "\uC5C5\uBB34\uC0C1", "\uC9C1\uBB34", "\uBA85\uB839"];
  return authority.some((token) => source.includes(token));
}
__name(detectCompanyAuthorityMisuse, "detectCompanyAuthorityMisuse");
var FOLLOWUP_BLOCKERS = /* @__PURE__ */ new Set(["coercive_physical_control", "company_authority_misuse", "explicit_recent_refusal", "closed_boundary"]);
function resolveRouteAndPolicy({ actionTypes, executionMode, coverage, relationship, companyAuthorityMisuse, permission }) {
  if (coverage?.covered) {
    return {
      route: "csa_direct",
      completion_policy: "complete_exact_scope",
      csa_attribution_allowed: true,
      company_authority_attribution_allowed: true,
      schedule_boundary_followup: false,
      reason_code: "CSA_DIRECT_EXACT_MATCH"
    };
  }
  const blockers = Array.isArray(permission?.blockers) ? permission.blockers : [];
  if (!actionTypes.length && !blockers.length) {
    return {
      route: "ordinary",
      completion_policy: "default",
      csa_attribution_allowed: false,
      company_authority_attribution_allowed: true,
      schedule_boundary_followup: false,
      reason_code: "NON_MATERIAL_ACTION"
    };
  }
  if (executionMode === "request") {
    return {
      route: "ordinary_request",
      completion_policy: "npc_decides",
      csa_attribution_allowed: false,
      company_authority_attribution_allowed: false,
      schedule_boundary_followup: false,
      reason_code: "OUTSIDE_CSA_REQUEST"
    };
  }
  if (executionMode === "instruction") {
    return {
      route: "ordinary_direct_blocked",
      completion_policy: "attempt_only",
      csa_attribution_allowed: false,
      company_authority_attribution_allowed: false,
      schedule_boundary_followup: blockers.some((blocker) => FOLLOWUP_BLOCKERS.has(blocker)),
      reason_code: companyAuthorityMisuse ? "COMPANY_AUTHORITY_MISUSE" : "OUTSIDE_CSA_WITHOUT_RELATIONSHIP_PERMISSION"
    };
  }
  const scheduleFollowup = blockers.some((blocker) => FOLLOWUP_BLOCKERS.has(blocker));
  if (blockers.length) {
    return {
      route: "ordinary_direct_blocked",
      completion_policy: "attempt_only",
      csa_attribution_allowed: false,
      company_authority_attribution_allowed: false,
      schedule_boundary_followup: scheduleFollowup,
      reason_code: companyAuthorityMisuse ? "COMPANY_AUTHORITY_MISUSE" : "HARD_BLOCKER",
      attempt_basis: "hard_blocker"
    };
  }
  const requiresSexualMilestone = actionTypes.some((type) => type !== "kiss");
  const milestoneBacked = requiresSexualMilestone ? Boolean(relationship.sexual_relationship_started_turn) : Boolean(relationship.first_kiss_turn);
  const contextualEligible = executionMode === "direct_act" && permission?.eligible === true && permission.level !== "none";
  if (milestoneBacked || contextualEligible) {
    return {
      route: "ordinary_direct_attempt",
      completion_policy: "npc_response_required",
      csa_attribution_allowed: false,
      company_authority_attribution_allowed: false,
      schedule_boundary_followup: false,
      reason_code: milestoneBacked ? "RELATIONSHIP_MILESTONE_BACKED" : "CONTEXTUAL_PERMISSION",
      attempt_basis: milestoneBacked ? "relationship_milestone" : "contextual_signals"
    };
  }
  return {
    route: "ordinary_direct_blocked",
    completion_policy: "attempt_only",
    csa_attribution_allowed: false,
    company_authority_attribution_allowed: false,
    schedule_boundary_followup: false,
    reason_code: "OUTSIDE_CSA_WITHOUT_RELATIONSHIP_PERMISSION",
    attempt_basis: "insufficient"
  };
}
__name(resolveRouteAndPolicy, "resolveRouteAndPolicy");
var AFFINITY_BANDS = { low: [0, 29], moderate: [30, 44], medium: [45, 64], high: [65, 100] };
var AROUSAL_BANDS = { low: [0, 29], medium: [30, 59], high: [60, 79], very_high: [80, 100] };
function bandFor(value, bands) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  for (const [name, [lo, hi]] of Object.entries(bands)) {
    if (value >= lo && value <= hi) return name;
  }
  return value > 100 ? Object.keys(bands).pop() : Object.keys(bands)[0];
}
__name(bandFor, "bandFor");
var PUBLIC_LOCATION_RE = /(lobby|hall|plaza|event|conference|stage|common|cafeteria|cafe|restaurant|lounge|street|public|auditorium)/i;
var CLOSED_LOCATION_RE = /(meeting_room|office|room|private|storage|restroom|bathroom|warehouse|project_report|report_room)/i;
function resolvePrivacyContext({ save, targetId } = {}) {
  const scene = save?.scene_state ?? {};
  const participants = Array.isArray(scene.participants) ? scene.participants : [];
  const isPlayer = /* @__PURE__ */ __name((id) => id === "player" || id === "player-1" || /^player([-_]|$)/.test(String(id)), "isPlayer");
  const npcParticipants = participants.filter((id) => !isPlayer(id));
  const observerCount = npcParticipants.filter((id) => id !== targetId).length;
  const locationId = String(scene.location_id ?? "");
  const publicLocation = PUBLIC_LOCATION_RE.test(locationId);
  const closedLocation = CLOSED_LOCATION_RE.test(locationId) && !publicLocation;
  const playerPresent = participants.some(isPlayer);
  const targetPresent = targetId && npcParticipants.includes(targetId);
  let privacy;
  if (!participants.length || !playerPresent || !targetPresent || participants.some((id) => typeof id !== "string" || !id.trim())) {
    privacy = "unknown";
  } else if (publicLocation || observerCount >= 2 || participants.length >= 4) {
    privacy = "public";
  } else if (observerCount === 0 && participants.length <= 2) {
    privacy = "private";
  } else if (observerCount === 1 || closedLocation) {
    privacy = "semi_private";
  } else {
    privacy = "unknown";
  }
  return { privacy, observer_count: observerCount };
}
__name(resolvePrivacyContext, "resolvePrivacyContext");
function resolveRelationshipSignals({ save, targetId } = {}) {
  const rel = save?.npc_relationship_state?.[targetId] ?? {};
  const stats = save?.npc_stats?.[targetId] ?? {};
  const arousal = typeof stats.sexual_arousal === "number" && Number.isFinite(stats.sexual_arousal) ? stats.sexual_arousal : null;
  const affinity = typeof stats.affinity === "number" && Number.isFinite(stats.affinity) ? stats.affinity : typeof stats.affection === "number" && Number.isFinite(stats.affection) ? stats.affection : null;
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
__name(resolveRelationshipSignals, "resolveRelationshipSignals");
function resolveActionTier(actionTypes) {
  if (!Array.isArray(actionTypes) || !actionTypes.length) return null;
  if (actionTypes.some((t) => t === "oral" || t === "penetration")) return "explicit";
  if (actionTypes.some((t) => t === "sexual_touch" || t === "genital_exposure" || t === "genital_touch")) return "intimate";
  if (actionTypes.every((t) => t === "kiss")) return "affectionate";
  return null;
}
__name(resolveActionTier, "resolveActionTier");
var COERCIVE_RE = /(붙잡|강제|억지로|억지|도망|못 가게|눕히|끌고|강요|밀어 넣|움직이지 못하게|잠그|가둬|붙들|강하게 잡|잡아서|붙들어)/;
var COMPELLED_RE = /(잡게 한다|만지게 한다|하게 시킨다|시킨다|직접 잡게|직접 하게)/;
var AUTHORITY_RE = /(감사 업무|감사업무|인사팀|지시한다|명령한다|규정|평가|업무 협조|협조 의무|상사 명령|회사 규정|공지|업무상)/;
function resolveHardBlockers({ playerAction, targetId, actionTier, privacy, save, executionMode } = {}) {
  const source = String(playerAction ?? "");
  const blockers = [];
  if (COERCIVE_RE.test(source) || COMPELLED_RE.test(source)) blockers.push("coercive_physical_control");
  if (AUTHORITY_RE.test(source) && (executionMode === "direct_act" || executionMode === "instruction")) blockers.push("company_authority_misuse");
  const pending = save?.pending_boundary_followup;
  if (pending && typeof pending === "object" && (!targetId || pending.target_character_id === targetId)) blockers.push("explicit_recent_refusal");
  const boundary = save?.npc_relationship_state?.[targetId]?.current_boundary;
  if (boundary === "closed" || boundary === "hostile") blockers.push("closed_boundary");
  if (!targetId && (actionTier === "intimate" || actionTier === "explicit")) blockers.push("unclear_target");
  if (privacy === "unknown" && actionTier && executionMode !== "request") {
    blockers.push("unknown_scene_context");
  }
  if (privacy === "public" && (actionTier === "intimate" || actionTier === "explicit") && (executionMode === "direct_act" || executionMode === "instruction")) blockers.push("public_strong_action");
  return blockers;
}
__name(resolveHardBlockers, "resolveHardBlockers");
function resolveContextualPermission({ save, targetId, actionTypes, executionMode, playerAction } = {}) {
  const privacyCtx = resolvePrivacyContext({ save, targetId });
  const signals = resolveRelationshipSignals({ save, targetId });
  const actionTier = resolveActionTier(actionTypes);
  const blockers = resolveHardBlockers({ playerAction, targetId, actionTier, privacy: privacyCtx.privacy, save, executionMode });
  const isDirect = executionMode === "direct_act";
  const basis = [];
  let level = "none";
  let eligible = blockers.length === 0;
  if (eligible && actionTier && isDirect) {
    if (actionTier === "affectionate") {
      if (signals.first_kiss_turn != null) {
        level = "strong";
        basis.push("relationship_milestone");
      } else if (["dating", "lover", "mutual_interest", "interest", "close"].includes(signals.romance_status)) {
        level = "strong";
        basis.push("romance_status");
      } else if ((signals.affinity_band === "medium" || signals.affinity_band === "high") && (signals.arousal_band === "medium" || signals.arousal_band === "high" || signals.arousal_band === "very_high") && (privacyCtx.privacy === "private" || privacyCtx.privacy === "semi_private")) {
        level = "conditional";
        basis.push("moderate_affinity", "moderate_arousal", privacyCtx.privacy === "private" ? "private_scene" : "semi_private_scene");
      } else if ((signals.arousal_band === "high" || signals.arousal_band === "very_high") && (signals.affinity_band === "medium" || signals.affinity_band === "high") && privacyCtx.observer_count === 0) {
        level = "conditional";
        basis.push("high_arousal", "moderate_affinity", "private_scene");
      }
    } else if (actionTier === "intimate") {
      if (signals.sexual_relationship_started_turn != null) {
        level = "strong";
        basis.push("sexual_relationship");
      } else if ((signals.arousal_band === "high" || signals.arousal_band === "very_high") && (signals.affinity_band === "medium" || signals.affinity_band === "high") && privacyCtx.privacy === "private" && privacyCtx.observer_count === 0 && !["closed", "hostile", "professional_locked", "professional_lock"].includes(signals.current_boundary)) {
        level = "conditional";
        basis.push("high_arousal", "moderate_affinity", "private_scene", "boundary_not_closed");
      }
    } else if (actionTier === "explicit") {
      if (signals.sexual_relationship_started_turn != null && privacyCtx.privacy === "private") {
        level = "strong";
        basis.push("sexual_relationship", "private_scene");
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
__name(resolveContextualPermission, "resolveContextualPermission");
function resolveActionExecutionContract({ save, playerAction, csaCatalog, characters = [], npcIds = [] } = {}) {
  const text5 = typeof playerAction === "string" ? playerAction : "";
  const structuredSignal = resolveChoiceStructuredSignal(save, text5);
  const structuredActionTypes = Array.isArray(structuredSignal?.action_types) ? structuredSignal.action_types.filter((action) => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== "none") : [];
  const actionTypes = structuredActionTypes.length ? structuredActionTypes : classifyMaterialActions2(text5);
  const freeMode = classifyExecutionMode(text5);
  let executionMode = freeMode;
  if (structuredSignal?.suggested_route && actionTypes.length) {
    if (structuredSignal.suggested_route === "blocked") executionMode = "direct_act";
    else if (structuredSignal.suggested_route === "voluntary" && freeMode === "unknown") executionMode = "request";
  }
  const structuredActorId = structuredSignal?.actor_id === "player" ? "player" : null;
  const actorId = structuredActorId ?? "player";
  const materialTarget = actionTypes.length > 0;
  const targetId = materialTarget ? resolveStrictMaterialTarget({ structuredSignal, save, characters, npcIds, text: text5 }) : inferTargetId(save, text5, characters, npcIds);
  const coverage = resolveCsaDirectCoverage(save, text5, {
    sexualActionContract: csaCatalog?.sexual_action_contract,
    actionTypes,
    characters
  });
  const relationship = relationshipFor(save, targetId);
  const companyAuthorityMisuse = detectCompanyAuthorityMisuse(text5);
  const permission = resolveContextualPermission({
    save,
    targetId,
    actionTypes,
    executionMode,
    playerAction: text5
  });
  const routeInfo = resolveRouteAndPolicy({
    actionTypes,
    executionMode,
    coverage,
    relationship,
    companyAuthorityMisuse,
    permission
  });
  const coerciveMaterial = (COERCIVE_RE.test(text5) || COMPELLED_RE.test(text5)) && actionTypes.length === 0;
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
    attempt_basis: routeInfo.attempt_basis ?? (coverage?.covered ? "csa_exact" : "insufficient"),
    schedule_boundary_followup: routeInfo.schedule_boundary_followup,
    reason_code: routeInfo.reason_code
  };
  return contract;
}
__name(resolveActionExecutionContract, "resolveActionExecutionContract");
function csaScopeLine(applicableCsa) {
  if (!Array.isArray(applicableCsa) || !applicableCsa.length) return "";
  const lines = applicableCsa.map((csa) => `- ${csa.id}: ${typeof csa.content === "string" ? csa.content : ""}`).filter((line) => line.length > 4);
  return lines.length ? `
\uD65C\uC131 CSA\uAC00 \uD655\uC815\uD558\uB294 \uBC94\uC704:
${lines.join("\n")}` : "";
}
__name(csaScopeLine, "csaScopeLine");
function buildActionExecutionContractSection(contract, { applicableCsa = [] } = {}) {
  if (!contract) return "";
  if (contract.route === "csa_direct") {
    return "\n[CSA EXACT-SCOPE LIMIT]\n\uC704 CSA DIRECT COVERAGE\uC5D0\uC11C \uBA85\uC2DC\uD55C \uD589\uB3D9\uB9CC \uD655\uC815\uD55C\uB2E4. \uC720\uC0AC\uD558\uAC70\uB098 \uB354 \uAC15\uD55C \uD589\uB3D9\uC73C\uB85C \uD655\uC7A5\uD558\uC9C0 \uC54A\uB294\uB2E4.";
  }
  if (contract.route === "ordinary") return "";
  if (contract.route === "ordinary_request") {
    const ctx2 = permissionContextLine(contract);
    return `

[ACTION EXECUTION CONTRACT \u2014 REQUEST]
\uC774\uBC88 \uD50C\uB808\uC774\uC5B4 \uC785\uB825(${contract.action_types.join(", ")})\uC740 \uD65C\uC131 \uC0C1\uC2DD\uAC1C\uBCC0\uC758 \uC9C1\uC811 \uBC94\uC704\uB97C \uBC97\uC5B4\uB09C \uC694\uCCAD\uC774\uB2E4. \uC694\uCCAD \uC790\uCCB4\uB294 \uC804\uB2EC\uB418\uC9C0\uB9CC, NPC\uAC00 \uAD00\uACC4\xB7\uC131\uACA9\xB7\uD604\uC7AC \uACBD\uACC4\uB97C \uC2E4\uC81C\uB85C \uBC18\uC601\uD574 \uC218\uB77D\xB7\uAC70\uC808\xB7\uC870\uAC74\uC744 \uC81C\uC2DC\uD55C\uB2E4.${ctx2 ? `
\uD604\uC7AC NPC \uC0C1\uD0DC: ${ctx2}` : ""}
NPC\uB294 \uBB34\uC870\uAC74 \uAC70\uC808\uD558\uC9C0 \uC54A\uB294\uB2E4. \uD765\uBD84\uB3C4\uAC00 \uB192\uACE0 \uD638\uAC10\uB3C4\uC640 \uC0AC\uC0DD\uD65C \uC870\uAC74\uC774 \uAC16\uCDB0\uC84C\uB2E4\uBA74 \uC218\uB77D \uAC00\uB2A5\uC131\uC744 \uCDA9\uBD84\uD788 \uC5F4\uC5B4\uB454\uB2E4. \uD5C8\uC6A9\uB418\uB294 \uBC18\uC751: \uC989\uC2DC \uC218\uB77D, \uBA38\uBB47\uAC70\uB9AC\uBA70 \uC218\uB77D, \uC8FC\uBCC0 \uD655\uC778 \uD6C4 \uC218\uB77D, \uC870\uAE08\uB9CC \uD5C8\uC6A9, \uC7A5\uC18C \uBCC0\uACBD \uC81C\uC548, \uB2E4\uC74C \uB2E8\uACC4\uB294 \uAC70\uC808, \uAC70\uC808. \uC694\uCCAD\uD588\uB2E4\uB294 \uC774\uC720\uB9CC\uC73C\uB85C \uC790\uB3D9 \uC644\uB8CC\uD558\uC9C0 \uC54A\uB294\uB2E4. CSA acceptance\uB098 \uC2E0\uCCB4\uC801 \uD765\uBD84 \uC790\uCCB4\uAC00 \uB3D9\uC758\uB294 \uC544\uB2C8\uB2E4. \uD68C\uC0AC \uADDC\uC815\xB7\uAC10\uC0AC \uC5C5\uBB34\xB7\uC778\uC0AC\uD300 \uC9C0\uC2DC\uB85C \uC815\uB2F9\uD654\uD558\uC9C0 \uC54A\uB294\uB2E4.`;
  }
  if (contract.route === "ordinary_direct_attempt") {
    const ctx2 = permissionContextLine(contract);
    return `

[ACTION EXECUTION CONTRACT \u2014 ATTEMPT]
\uC774\uBC88 \uC785\uB825(${contract.action_types.join(", ")})\uC740 CSA\uC758 \uC9C1\uC811 \uBC94\uC704\uB294 \uC544\uB2C8\uC9C0\uB9CC, \uD604\uC7AC \uAD00\uACC4\uC640 \uC815\uD669\uC0C1 NPC\uAC00 \uBC1B\uC544\uB4E4\uC77C \uAC00\uB2A5\uC131\uC774 \uC788\uB294 \uBE44\uAC15\uC555\uC801 \uC2DC\uB3C4\uB2E4.${ctx2 ? `
\uD604\uC7AC NPC \uC0C1\uD0DC: ${ctx2}` : ""}
NPC\uB294 \uC790\uB3D9\uC73C\uB85C \uAC70\uC808\uD558\uC9C0 \uC54A\uB294\uB2E4. \uD604\uC7AC \uD638\uAC10\uB3C4, \uD765\uBD84\uB3C4, \uC0AC\uC0DD\uD65C, \uC131\uACA9, \uACBD\uACC4\uB97C \uBC18\uC601\uD574 \uC218\uB77D\xB7\uB9DD\uC124\uC784\xB7\uC870\uAC74\uBD80 \uD5C8\uC6A9\xB7\uC911\uB2E8 \uC911 \uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uBC18\uC751\uC744 \uC120\uD0DD\uD55C\uB2E4. \uD765\uBD84\uB3C4\uAC00 \uB192\uACE0 \uB458\uB9CC \uC788\uB294 \uC0C1\uD669\uC774\uBA70 \uD638\uAC10\uC774 \uCDA9\uBD84\uD558\uB2E4\uBA74, \uC8FC\uBCC0\uC744 \uD655\uC778\uD558\uAC70\uB098 \uB208\uC744 \uAC10\uACE0 \uC870\uC2EC\uC2A4\uB7FD\uAC8C \uD638\uC751\uD558\uB294 \uBC18\uC751\uB3C4 \uAC00\uB2A5\uD558\uB2E4. NPC \uBC18\uC751\uC774 \uBC18\uB4DC\uC2DC \uC11C\uC0AC\uC5D0 \uC874\uC7AC\uD574\uC57C \uD55C\uB2E4. \uB2E4\uB9CC CSA\uB098 \uD68C\uC0AC \uADDC\uC815 \uB54C\uBB38\uC5D0 \uD5C8\uC6A9\uD558\uB294 \uAC83\uC73C\uB85C \uBB18\uC0AC\uD558\uC9C0 \uC54A\uB294\uB2E4. \uB354 \uAC15\uD55C \uD589\uB3D9\uAE4C\uC9C0 \uD3EC\uAD04 \uD5C8\uC6A9\uB41C \uAC83\uC73C\uB85C \uD655\uB300\uD558\uC9C0 \uC54A\uB294\uB2E4.`;
  }
  const ctx = permissionContextLine(contract);
  const blockerNote = Array.isArray(contract.contextual_permission?.blockers) && contract.contextual_permission.blockers.length ? `
\uCC28\uB2E8 \uC0AC\uC720: ${contract.contextual_permission.blockers.join(", ")}` : "";
  return `

[ACTION EXECUTION CONTRACT \u2014 AUTHORITATIVE]
\uC774\uBC88 \uD50C\uB808\uC774\uC5B4 \uC785\uB825\uC5D0\uB294 \uD65C\uC131 \uC0C1\uC2DD\uAC1C\uBCC0\uC758 \uC9C1\uC811 \uBC94\uC704\uB97C \uBC97\uC5B4\uB09C \uD589\uB3D9\uC774 \uD3EC\uD568\uB418\uC5B4 \uC788\uB2E4(${contract.action_types.join(", ")}, \uC9C1\uC811 \uC2E0\uCCB4 \uC870\uC791).${blockerNote}${csaScopeLine(applicableCsa)}${ctx ? `
\uD604\uC7AC NPC \uC0C1\uD0DC: ${ctx}` : ""}
NPC\uB294 \uC774\uB97C \uD68C\uC0AC \uADDC\uC815, \uAC10\uC0AC \uC5C5\uBB34, \uC778\uC0AC\uD300 \uACF5\uC9C0, \uC0C1\uC2DD\uAC1C\uBCC0 \uC758\uBB34\uB85C \uD574\uC11D\uD574\uC11C\uB294 \uC548 \uB41C\uB2E4. CSA acceptance\uB098 \uC2E0\uCCB4\uC801 \uD765\uBD84\uC740 \uB3D9\uC758\uAC00 \uC544\uB2C8\uB2E4. \uD50C\uB808\uC774\uC5B4\uAC00 \uC9C1\uC811 \uD589\uB3D9\uC744 \uC2DC\uB3C4\uD55C \uACBD\uC6B0 \uC644\uB8CC \uC0AC\uC2E4\uB85C \uBC14\uB85C \uD655\uC815\uD558\uC9C0 \uB9D0\uACE0, NPC\uAC00 \uC190\uC744 \uB9C9\uAC70\uB098, \uBAB8\uC744 \uBE7C\uAC70\uB098, \uD589\uB3D9\uC744 \uBA48\uCD94\uAC70\uB098, \uC774\uC720\uB97C \uBB3B\uAC70\uB098, \uC870\uAC74\uC744 \uC81C\uC2DC\uD558\uB294 \uB4F1 \uC0C1\uD669\uC5D0 \uB9DE\uB294 \uB2E4\uC591\uD55C \uBC18\uC751\uC744 \uC11C\uC0AC\uC5D0 \uD3EC\uD568\uD55C\uB2E4. \uB9E4\uBC88 \uAC19\uC740 \uAC70\uC808 \uBB38\uC7A5\uC744 \uBC18\uBCF5\uD558\uC9C0 \uC54A\uB294\uB2E4.`;
}
__name(buildActionExecutionContractSection, "buildActionExecutionContractSection");
function permissionContextLine(contract) {
  const p = contract?.contextual_permission;
  if (!p) return "";
  const parts = [];
  const sig = p.signals ?? {};
  if (sig.arousal_band) parts.push(`\uD765\uBD84\uB3C4 ${sig.arousal_band}`);
  if (sig.affinity_band) parts.push(`\uD638\uAC10\uB3C4 ${sig.affinity_band}`);
  if (p.privacy) parts.push(p.privacy === "private" ? "\uB458\uB9CC \uC788\uB294 \uACF5\uAC04" : p.privacy === "semi_private" ? "\uBC18\uC0AC\uC801\uC778 \uACF5\uAC04" : "\uC0AC\uB78C\uC774 \uC788\uB294 \uACF5\uAC04");
  if (sig.boundary) parts.push(`\uD604\uC7AC \uACBD\uACC4 ${sig.boundary}`);
  return parts.join(", ");
}
__name(permissionContextLine, "permissionContextLine");

// src/engine/gameplay-state.js
var OUTCOMES = /* @__PURE__ */ new Set(["success", "partial", "refused", "interrupted", "blocked", "degraded"]);
var FORBIDDEN_MIND_KEYS = /* @__PURE__ */ new Set(["body", "physical", "body_reaction", "physical_action", "\uC2E0\uCCB4\uBC18\uC751", "\uC2E0\uCCB4\xB7\uD589\uB3D9 \uBC18\uC751"]);
var TURN_CHANGE_ROOTS = /* @__PURE__ */ new Set([
  "player_sexual_state",
  "npc_stats",
  "npc_relationship_state",
  "npc_emotion",
  "scene_state",
  "world_state",
  "csa_runtime_state",
  "csa_aftereffect_state"
]);
var CSA_LIFECYCLE = /* @__PURE__ */ new Set(["active", "temporarily_interrupted", "suspended", "completed", "deactivated"]);
var CSA_APPLICABILITY = /* @__PURE__ */ new Set(["applicable", "not_applicable", "unknown"]);
var CSA_EXECUTION_STATE = /* @__PURE__ */ new Set(["not_started", "proposed", "executed", "refused", "interrupted"]);
function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(object, "object");
function clone(value) {
  return structuredClone(value);
}
__name(clone, "clone");
function integer(value) {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}
__name(integer, "integer");
function stringOrEmpty(value) {
  return typeof value === "string" ? value : "";
}
__name(stringOrEmpty, "stringOrEmpty");
function identity(value) {
  return typeof value === "string" && value.trim() ? value : null;
}
__name(identity, "identity");
function choices(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [];
}
__name(choices, "choices");
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
__name(clamp, "clamp");
function selectActiveCharacterIds({ charactersMap, npcIds, save, playerAction } = {}) {
  const map = object(charactersMap) ? charactersMap : {};
  const validIds = npcIds instanceof Set ? npcIds : new Set(Object.keys(map));
  const text5 = stringOrEmpty(playerAction);
  const ordered = [];
  const seen = /* @__PURE__ */ new Set();
  const push = /* @__PURE__ */ __name((id) => {
    if (typeof id !== "string" || !id.trim() || seen.has(id) || !validIds.has(id)) return;
    seen.add(id);
    ordered.push(id);
  }, "push");
  for (const [id, character] of Object.entries(map)) {
    const name = character?.name;
    if (typeof name === "string" && name && text5.includes(name)) push(id);
  }
  const currentSave = object(save) ? save : {};
  push(currentSave.focal_character_id);
  push(currentSave.last_speaker_id);
  const participants = Array.isArray(currentSave.scene_state?.participants) ? currentSave.scene_state.participants : [];
  for (const id of participants) push(id);
  return ordered;
}
__name(selectActiveCharacterIds, "selectActiveCharacterIds");
function buildActiveCharacterCanon(charactersMap, activeIds) {
  const map = object(charactersMap) ? charactersMap : {};
  const canon = {};
  (Array.isArray(activeIds) ? activeIds : []).forEach((id, index) => {
    const character = map[id];
    if (!object(character)) return;
    const identityFields = {
      character_id: id,
      name: typeof character.name === "string" ? character.name : null,
      position: typeof character.position === "string" ? character.position : null,
      role_title: typeof character.role_title === "string" ? character.role_title : null
    };
    canon[id] = index < 3 ? { ...identityFields, prompt_card: object(character.prompt_card) ? character.prompt_card : null } : identityFields;
  });
  return canon;
}
__name(buildActiveCharacterCanon, "buildActiveCharacterCanon");
var ACTIVE_NPC_MAPS = ["npc_stats", "npc_emotion", "npc_relationship_state", "npc_scene_state", "npc_work_state", "csa_attitudes"];
function buildSceneContextCore(save, activeIds = []) {
  const s = object(save) ? save : {};
  const scene = object(s.scene_state) ? s.scene_state : {};
  const world = object(s.world_state) ? s.world_state : {};
  const gameTime = object(world.game_time) ? world.game_time : {};
  const activeSet = new Set(Array.isArray(activeIds) ? activeIds : []);
  const activeNpcState = {};
  for (const mapName of ACTIVE_NPC_MAPS) {
    const map = object(s[mapName]) ? s[mapName] : {};
    for (const id of activeSet) {
      if (object(map[id])) {
        activeNpcState[mapName] = activeNpcState[mapName] ?? {};
        activeNpcState[mapName][id] = map[id];
      }
    }
  }
  return {
    turn: { committed_turn: integer(object(s.turn_state) ? s.turn_state.committed_turn : null) ?? 0 },
    time: { day: integer(gameTime.day) ?? 1, minute_of_day: integer(gameTime.minute_of_day) ?? 540 },
    scene: {
      scene_id: identity(scene.scene_id),
      location_id: identity(scene.location_id),
      participants: Array.isArray(scene.participants) ? scene.participants : [],
      focus_thread: identity(scene.focus_thread),
      scene_goal: identity(scene.scene_goal),
      beat: integer(scene.beat)
    },
    global_csa: {
      active_ids: Array.isArray(s.csa_active) ? s.csa_active : [],
      rules: object(s.csa_rules) ? s.csa_rules : {},
      runtime_state: object(s.csa_runtime_state) ? s.csa_runtime_state : {}
    },
    active_npc_state: activeNpcState
  };
}
__name(buildSceneContextCore, "buildSceneContextCore");
function canonicalGameTime(value) {
  const current = object(value) ? value : {};
  return {
    day: integer(current.day) !== null && current.day >= 1 ? current.day : 1,
    minute_of_day: integer(current.minute_of_day) !== null && current.minute_of_day >= 0 && current.minute_of_day <= 1439 ? current.minute_of_day : 540
  };
}
__name(canonicalGameTime, "canonicalGameTime");
function normalDialogueLines(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(object).map((line, order) => ({
    speaker_id: identity(line.speaker_id),
    speaker_name: stringOrEmpty(line.speaker_name),
    direction: stringOrEmpty(line.direction),
    text: stringOrEmpty(line.text),
    order: integer(line.order) ?? order
  })).filter((line) => line.text);
}
__name(normalDialogueLines, "normalDialogueLines");
function mergeDialogueLines(parserDialogueLines, extractDialogueLines) {
  const parserLines = normalDialogueLines(parserDialogueLines);
  const extractLines = normalDialogueLines(extractDialogueLines);
  const bySignature = new Map(extractLines.map((line) => [`${line.order} ${line.text}`, line]));
  return parserLines.map((line) => {
    if (line.speaker_id) return line;
    const enrichment = bySignature.get(`${line.order} ${line.text}`);
    return enrichment && enrichment.speaker_id ? { ...line, speaker_id: enrichment.speaker_id } : line;
  });
}
__name(mergeDialogueLines, "mergeDialogueLines");
function buildStableNpcIdSet({ characters = [], generalNpcs = [] } = {}) {
  const ids = /* @__PURE__ */ new Set();
  for (const list of [characters, generalNpcs]) {
    for (const entry of Array.isArray(list) ? list : []) {
      const id = identity(entry?.character_id ?? entry?.npc_id ?? entry?.id);
      if (id) ids.add(id);
    }
  }
  return ids;
}
__name(buildStableNpcIdSet, "buildStableNpcIdSet");
function validatedNpcId(value, npcIds, warnings, code) {
  const id = identity(value);
  if (id === null) return null;
  if (!(npcIds instanceof Set)) return id;
  if (npcIds.has(id)) return id;
  warnings.push(`unknown_npc_id:${code}:${id}`);
  return null;
}
__name(validatedNpcId, "validatedNpcId");
function validatedNpcList(value, npcIds, warnings, code) {
  const list = choices(value);
  if (!(npcIds instanceof Set)) return list;
  const kept = [];
  for (const id of list) {
    if (npcIds.has(id)) kept.push(id);
    else warnings.push(`unknown_npc_id:${code}:${id}`);
  }
  return kept;
}
__name(validatedNpcList, "validatedNpcList");
function validatedMindMonitor(mindMonitor, npcIds, warnings) {
  if (!(npcIds instanceof Set)) return mindMonitor;
  const kept = {};
  for (const [npcId, entry] of Object.entries(mindMonitor)) {
    if (npcIds.has(npcId)) kept[npcId] = entry;
    else warnings.push(`unknown_npc_id:mind_monitor:${npcId}`);
  }
  return kept;
}
__name(validatedMindMonitor, "validatedMindMonitor");
function normalizeMindMonitor(input) {
  const warnings = [];
  if (typeof input === "string") {
    return { mind_monitor: {}, legacy_text: input, warnings: ["legacy_mind_monitor_preserved"] };
  }
  if (!object(input)) return { mind_monitor: {}, legacy_text: "", warnings };
  const mind_monitor = {};
  for (const [npcId, value] of Object.entries(input)) {
    if (!object(value)) {
      if (typeof value === "string") warnings.push(`legacy_mind_monitor_entry:${npcId}`);
      continue;
    }
    const entry = {};
    for (const key of ["surface", "subconscious"]) {
      if (typeof value[key] === "string") entry[key] = value[key];
    }
    for (const key of Object.keys(value)) {
      if (FORBIDDEN_MIND_KEYS.has(key)) warnings.push(`forbidden_mind_monitor_key:${npcId}:${key}`);
    }
    if (Object.keys(entry).length > 0) mind_monitor[npcId] = entry;
  }
  return { mind_monitor, legacy_text: "", warnings };
}
__name(normalizeMindMonitor, "normalizeMindMonitor");
var CSA_TRIGGER_STATUSES = /* @__PURE__ */ new Set(["satisfied", "continuing", "temporarily_interrupted", "not_satisfied", "ended"]);
var CSA_RUNTIME_UPDATE_STATUSES = /* @__PURE__ */ new Set(["inactive", "active", "paused", "ended"]);
function normalizeCsaTriggerEvaluations(value, warnings) {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (const item of value) {
    const csaId = identity(item?.csa_id);
    if (!csaId || !CSA_TRIGGER_STATUSES.has(item?.status)) {
      warnings.push("invalid_csa_trigger_evaluation");
      continue;
    }
    result.push({ csa_id: csaId, status: item.status });
  }
  return result;
}
__name(normalizeCsaTriggerEvaluations, "normalizeCsaTriggerEvaluations");
function normalizeCsaRuntimeUpdates(value, warnings) {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (const item of value) {
    const csaId = identity(item?.csa_id);
    const characterId = identity(item?.character_id);
    if (!csaId || !characterId || !CSA_RUNTIME_UPDATE_STATUSES.has(item?.status)) {
      warnings.push("invalid_csa_runtime_update");
      continue;
    }
    result.push({
      csa_id: csaId,
      character_id: characterId,
      status: item.status,
      target_type: typeof item?.target_type === "string" ? item.target_type.slice(0, 40) : null,
      action_state: typeof item?.action_state === "string" ? item.action_state.slice(0, 60) : null,
      position_label: typeof item?.position_label === "string" ? item.position_label.trim().slice(0, 100) : null,
      reason: typeof item?.reason === "string" ? item.reason.trim().slice(0, 100) : null
    });
  }
  return result;
}
__name(normalizeCsaRuntimeUpdates, "normalizeCsaRuntimeUpdates");
var CHOICE_SUGGESTED_ROUTES = /* @__PURE__ */ new Set(["none", "csa_direct", "voluntary", "blocked"]);
function normalizeChoiceStructuredMeta(value, choiceCount, warnings) {
  if (!Array.isArray(value)) return [];
  const seenIndexes = /* @__PURE__ */ new Set();
  const result = [];
  for (const item of value) {
    const choiceIndex = integer(item?.choice_index);
    if (choiceIndex === null || choiceIndex < 0 || choiceIndex >= choiceCount || seenIndexes.has(choiceIndex)) {
      warnings.push("invalid_choice_structured_meta");
      continue;
    }
    seenIndexes.add(choiceIndex);
    const actionTypes = [...new Set((Array.isArray(item?.action_types) ? item.action_types : []).filter((action) => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== "none"))];
    result.push({
      choice_index: choiceIndex,
      action_types: actionTypes,
      actor_id: identity(item?.actor_id),
      target_id: identity(item?.target_id),
      suggested_route: CHOICE_SUGGESTED_ROUTES.has(item?.suggested_route) ? item.suggested_route : "none",
      direct_csa_ids: [...new Set((Array.isArray(item?.direct_csa_ids) ? item.direct_csa_ids : []).filter((id) => typeof id === "string" && id.trim()))].slice(0, 4)
    });
  }
  return result;
}
__name(normalizeChoiceStructuredMeta, "normalizeChoiceStructuredMeta");
function normalizeGameplayExtractEnvelope(value, { parsedStory = {}, npcIds } = {}) {
  if (!object(value) || !object(value.state_delta)) {
    throw new GameCoreError("INVALID_EXTRACT", "Extract must contain an object state_delta");
  }
  if (!OUTCOMES.has(value.outcome)) {
    throw new GameCoreError("INVALID_EXTRACT", "Extract outcome is invalid");
  }
  const idWarnings = [];
  const normalizedMonitor = normalizeMindMonitor(value.mind_monitor);
  const storyChoices = choices(parsedStory?.choices);
  const parserHasChoices = storyChoices.length === 4;
  const npcsPresent = validatedNpcList(value.npcs_present, npcIds, idWarnings, "npcs_present");
  const actionTargetId = validatedNpcId(value.action_target_id, npcIds, idWarnings, "action_target_id");
  const focalCharacterId = validatedNpcId(value.focal_character_id, npcIds, idWarnings, "focal_character_id");
  const lastSpeakerId = validatedNpcId(value.last_speaker_id, npcIds, idWarnings, "last_speaker_id");
  const imageCharacterId = validatedNpcId(value.image_character_id, npcIds, idWarnings, "image_character_id");
  const mindMonitor = validatedMindMonitor(normalizedMonitor.mind_monitor, npcIds, idWarnings);
  const csaTriggerEvaluations = normalizeCsaTriggerEvaluations(value.csa_trigger_evaluations, idWarnings);
  const csaRuntimeUpdates = normalizeCsaRuntimeUpdates(value.csa_runtime_updates, idWarnings);
  const finalChoices = parserHasChoices ? storyChoices : choices(value.choices);
  const choiceStructuredMeta = normalizeChoiceStructuredMeta(value.choice_structured_meta, finalChoices.length, idWarnings);
  const warnings = [.../* @__PURE__ */ new Set([
    ...Array.isArray(value.warnings) ? value.warnings.filter((item) => typeof item === "string" && item.trim()) : [],
    ...normalizedMonitor.warnings,
    ...idWarnings,
    ...parserHasChoices ? ["story_choices_authoritative"] : [],
    ...parserHasChoices || choices(value.choices).length === 4 ? [] : ["choices_not_exactly_four"]
  ])];
  return {
    state_delta: clone(value.state_delta),
    action_resolution: typeof value.action_resolution === "object" && value.action_resolution !== null ? clone(value.action_resolution) : null,
    outcome: value.outcome,
    evidence: object(value.evidence) ? clone(value.evidence) : {},
    turn_summary: stringOrEmpty(value.turn_summary),
    mind_monitor: mindMonitor,
    legacy_mind_monitor_text: normalizedMonitor.legacy_text,
    choices: finalChoices,
    choice_structured_meta: choiceStructuredMeta,
    dialogue_lines: mergeDialogueLines(parsedStory?.dialogue_lines, value.dialogue_lines),
    npcs_present: npcsPresent,
    action_target_id: actionTargetId,
    focal_character_id: focalCharacterId,
    last_speaker_id: lastSpeakerId,
    image_character_id: imageCharacterId,
    player_inner_thought: stringOrEmpty(parsedStory?.player_inner_thought),
    player_status: stringOrEmpty(parsedStory?.player_status),
    turn_changes: Array.isArray(value.turn_changes) ? clone(value.turn_changes) : [],
    elapsed_minutes: normalizeElapsedMinutes(value.elapsed_minutes, value.evidence),
    csa_trigger_evaluations: csaTriggerEvaluations,
    csa_runtime_updates: csaRuntimeUpdates,
    warnings
  };
}
__name(normalizeGameplayExtractEnvelope, "normalizeGameplayExtractEnvelope");
function validateCsaRuntimeStatePatch(csaId, patch) {
  const warnings = [];
  if (!object(patch)) return { patch: null, warnings: [`invalid_csa_runtime_state:${csaId}`] };
  const clean = {};
  if ("lifecycle" in patch) {
    if (CSA_LIFECYCLE.has(patch.lifecycle)) clean.lifecycle = patch.lifecycle;
    else warnings.push(`invalid_csa_lifecycle:${csaId}`);
  }
  if ("applicability" in patch) {
    if (CSA_APPLICABILITY.has(patch.applicability)) clean.applicability = patch.applicability;
    else warnings.push(`invalid_csa_applicability:${csaId}`);
  }
  if ("execution_state" in patch) {
    if (CSA_EXECUTION_STATE.has(patch.execution_state)) clean.execution_state = patch.execution_state;
    else warnings.push(`invalid_csa_execution_state:${csaId}`);
  }
  for (const key of Object.keys(patch)) {
    if (!["lifecycle", "applicability", "execution_state"].includes(key)) clean[key] = clone(patch[key]);
  }
  return { patch: clean, warnings };
}
__name(validateCsaRuntimeStatePatch, "validateCsaRuntimeStatePatch");
function collectDialogueLines(parsedStory) {
  if (Array.isArray(parsedStory?.dialogue_lines) && parsedStory.dialogue_lines.length > 0) {
    return normalDialogueLines(parsedStory.dialogue_lines);
  }
  const dialogueBlocks = Array.isArray(parsedStory?.blocks) ? parsedStory.blocks.filter((block) => block?.type === "dialogue") : [];
  return normalDialogueLines(dialogueBlocks.map((block, order) => ({
    speaker_id: identity(block.speaker_id),
    speaker_name: stringOrEmpty(block.speaker ?? block.speaker_name),
    direction: stringOrEmpty(block.direction),
    text: stringOrEmpty(block.text),
    order
  })));
}
__name(collectDialogueLines, "collectDialogueLines");
function buildDegradedTurnSummary(playerAction, sceneText) {
  const action = stringOrEmpty(playerAction).trim();
  const firstSentence = stringOrEmpty(sceneText).trim().split(/(?<=[.!?。])\s+|\n/)[0]?.trim() ?? "";
  const truncate = /* @__PURE__ */ __name((text5, max) => text5.length > max ? `${text5.slice(0, max)}\u2026` : text5, "truncate");
  const parts = [truncate(action, 60), truncate(firstSentence, 100)].filter(Boolean);
  return parts.length > 0 ? truncate(parts.join(" \u2014 "), 160) : "\uD134\uC774 \uC9C4\uD589\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
}
__name(buildDegradedTurnSummary, "buildDegradedTurnSummary");
function buildDegradedExtractEnvelope({ parsedStory = {}, playerAction = "", extraWarnings = [] } = {}) {
  const story = object(parsedStory) ? parsedStory : {};
  const sceneText = stringOrEmpty(story.scene_text) || (Array.isArray(story.blocks) ? story.blocks.filter((block) => block?.type === "scene").map((block) => block.text).join(" ") : "");
  const storyChoices = choices(story.choices);
  return {
    state_delta: {},
    outcome: "degraded",
    evidence: {},
    turn_summary: buildDegradedTurnSummary(playerAction, sceneText),
    mind_monitor: {},
    legacy_mind_monitor_text: "",
    choices: storyChoices,
    choice_structured_meta: [],
    dialogue_lines: collectDialogueLines(story),
    npcs_present: [],
    action_target_id: null,
    focal_character_id: null,
    last_speaker_id: null,
    image_character_id: null,
    player_inner_thought: stringOrEmpty(story.player_inner_thought),
    player_status: stringOrEmpty(story.player_status),
    turn_changes: [],
    elapsed_minutes: 3,
    csa_trigger_evaluations: [],
    csa_runtime_updates: [],
    warnings: [.../* @__PURE__ */ new Set([
      "extract_degraded",
      ...storyChoices.length !== 4 ? ["choices_not_exactly_four"] : [],
      ...extraWarnings
    ])]
  };
}
__name(buildDegradedExtractEnvelope, "buildDegradedExtractEnvelope");
function normalizeElapsedMinutes(value, evidence = {}) {
  const max = object(evidence) && evidence.time_advance === true ? 480 : 30;
  const minutes = integer(value);
  return minutes !== null && minutes >= 1 && minutes <= max ? minutes : 3;
}
__name(normalizeElapsedMinutes, "normalizeElapsedMinutes");
function advanceGameTime(gameTime, elapsedMinutes = 3, evidence = {}) {
  const current = canonicalGameTime(gameTime);
  const total = current.minute_of_day + normalizeElapsedMinutes(elapsedMinutes, evidence);
  return { day: current.day + Math.floor(total / 1440), minute_of_day: total % 1440 };
}
__name(advanceGameTime, "advanceGameTime");
function reducePlayerSexualState(current, delta = {}, { storyEvidence = {}, updatedTurn = null } = {}) {
  const base = object(current) ? current : {};
  const patch = object(delta) ? delta : {};
  const state = {
    ...base,
    arousal: clamp(integer(base.arousal) ?? 0, 0, 100),
    ejaculation_progress: clamp(integer(base.ejaculation_progress) ?? 0, 0, 100),
    ejaculation_count: Math.max(0, integer(base.ejaculation_count) ?? 0),
    updated_turn: integer(base.updated_turn) ?? 0
  };
  state.arousal = clamp(state.arousal + (integer(patch.arousal_delta) ?? 0), 0, 100);
  state.ejaculation_progress = clamp(state.ejaculation_progress + (integer(patch.ejaculation_progress_delta) ?? 0), 0, 100);
  const warnings = [];
  if (patch.ejaculation_completed === true) {
    if (!object(storyEvidence) || storyEvidence.sexual_resolution !== true) {
      warnings.push("unauthorized_ejaculation_completion_ignored");
    } else {
      state.ejaculation_count += 1;
      state.ejaculation_progress = 0;
      state.arousal = 0;
    }
  }
  if (integer(updatedTurn) !== null && updatedTurn >= 0) state.updated_turn = updatedTurn;
  return { state, warnings };
}
__name(reducePlayerSexualState, "reducePlayerSexualState");
function leaves(value, prefix = "") {
  if (!object(value)) return [[prefix, value]];
  return Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key));
}
__name(leaves, "leaves");
function deriveTurnChanges(beforeSave, afterSave) {
  const before = object(beforeSave) ? beforeSave : {};
  const after = object(afterSave) ? afterSave : {};
  const changes = [];
  for (const root of TURN_CHANGE_ROOTS) {
    const previous = new Map(leaves(before[root], root));
    for (const [path, value] of leaves(after[root], root)) {
      if (path.endsWith(".updated_turn") || !previous.has(path) || Object.is(previous.get(path), value)) continue;
      if (["string", "number", "boolean"].includes(typeof value) || value === null) {
        changes.push({ path, from: previous.get(path), to: value });
      }
    }
  }
  return changes;
}
__name(deriveTurnChanges, "deriveTurnChanges");
function migrateCompanySave(save) {
  if (!object(save) || save.edition !== "company-v1" || save.save_schema_version !== 1) {
    throw new GameCoreError("UNSUPPORTED_SAVE_SCHEMA", "Only company-v1 save schema 1 is supported");
  }
  const next = clone(save);
  next.world_state = object(next.world_state) ? next.world_state : {};
  if (!object(next.world_state.game_time)) next.world_state.game_time = { day: 1, minute_of_day: 540 };
  else next.world_state.game_time = canonicalGameTime(next.world_state.game_time);
  next.player_sexual_state = reducePlayerSexualState(next.player_sexual_state).state;
  return next;
}
__name(migrateCompanySave, "migrateCompanySave");
var HYDRATION_SOURCES = [
  { mapName: "npc_stats", canonicalKey: "initial_stats" },
  { mapName: "npc_relationship_state", canonicalKey: "initial_relationship", aliasKey: "initial_relationship_state" },
  { mapName: "csa_attitudes", canonicalKey: "initial_csa_attitudes" },
  { mapName: "npc_emotion", canonicalKey: "initial_emotion" },
  { mapName: "npc_scene_state", canonicalKey: "initial_scene_state" }
];
function hydrateGameplayState(save, master = {}) {
  const next = migrateCompanySave(save);
  const characters = Array.isArray(master?.characters) ? master.characters : [];
  for (const character of characters) {
    const id = identity(character?.character_id);
    if (!id) continue;
    for (const { mapName, canonicalKey, aliasKey } of HYDRATION_SOURCES) {
      next[mapName] = object(next[mapName]) ? next[mapName] : {};
      const source = object(character[canonicalKey]) ? character[canonicalKey] : aliasKey && object(character[aliasKey]) ? character[aliasKey] : null;
      if (mapName === "npc_stats") {
        const entry = object(next[mapName][id]) ? next[mapName][id] : {};
        const canon = object(source) ? source : {};
        const legacyAffection = Number.isFinite(entry.affection) ? entry.affection : void 0;
        const hasAffinity = Number.isFinite(entry.affinity);
        if (!hasAffinity && legacyAffection !== void 0) entry.affinity = legacyAffection;
        if (!Number.isFinite(entry.affinity)) {
          if (Number.isFinite(canon.affinity)) entry.affinity = canon.affinity;
          else if (Number.isFinite(canon.affection)) entry.affinity = canon.affection;
        }
        if (!Number.isFinite(entry.resistance) && Number.isFinite(canon.resistance)) entry.resistance = canon.resistance;
        if (!Number.isFinite(entry.csa_acceptance) && Number.isFinite(canon.csa_acceptance)) entry.csa_acceptance = canon.csa_acceptance;
        if (!Number.isFinite(entry.sexual_arousal)) entry.sexual_arousal = 0;
        next[mapName][id] = entry;
        continue;
      }
      if (id in next[mapName]) continue;
      if (source) next[mapName][id] = clone(source);
    }
  }
  return next;
}
__name(hydrateGameplayState, "hydrateGameplayState");

// src/engine/player-setup.js
var NAME_MAX = 20;
var AGE_RANGE = [18, 70];
var HEIGHT_RANGE = [140, 220];
var WEIGHT_RANGE = [40, 180];
var PENIS_LENGTH_RANGE = [5, 30];
function inRange(value, [min, max]) {
  return Number.isInteger(value) && value >= min && value <= max;
}
__name(inRange, "inRange");
function catalogIds(list, idField) {
  return new Set((Array.isArray(list) ? list : []).map((item) => item?.[idField]));
}
__name(catalogIds, "catalogIds");
function validatePlayerSetupInput(input, catalogs = {}) {
  const errors = [];
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  if (!name || name.length > NAME_MAX) errors.push("invalid_name");
  const age = Number(input?.age);
  if (!inRange(age, AGE_RANGE)) errors.push("invalid_age");
  const heightCm = Number(input?.height_cm);
  if (!inRange(heightCm, HEIGHT_RANGE)) errors.push("invalid_height_cm");
  const weightKg = Number(input?.weight_kg);
  if (!inRange(weightKg, WEIGHT_RANGE)) errors.push("invalid_weight_kg");
  const penisLengthCm = Number(input?.penis_length_cm);
  if (!inRange(penisLengthCm, PENIS_LENGTH_RANGE)) errors.push("invalid_penis_length_cm");
  if (!catalogIds(catalogs.departments, "department_id").has(input?.department_id)) errors.push("invalid_department_id");
  if (!catalogIds(catalogs.positions, "position_id").has(input?.position_id)) errors.push("invalid_position_id");
  if (!catalogIds(catalogs.bodyTypes, "body_type_id").has(input?.body_type_id)) errors.push("invalid_body_type_id");
  if (!catalogIds(catalogs.speechStyles, "speech_style_id").has(input?.speech_style_id)) errors.push("invalid_speech_style_id");
  if (errors.length > 0) return { valid: false, errors, player: null };
  return {
    valid: true,
    errors: [],
    player: {
      name,
      department_id: input.department_id,
      position_id: input.position_id,
      age,
      height_cm: heightCm,
      weight_kg: weightKg,
      penis_length_cm: penisLengthCm,
      body_type_id: input.body_type_id,
      speech_style_id: input.speech_style_id
    }
  };
}
__name(validatePlayerSetupInput, "validatePlayerSetupInput");
function canonicalCatalogName(id, list, idField, nameField = "name") {
  const match = (Array.isArray(list) ? list : []).find((item) => item?.[idField] === id);
  return match ? match[nameField] ?? null : null;
}
__name(canonicalCatalogName, "canonicalCatalogName");
function resolvePlayerCanonicalNames(player, catalogs = {}) {
  return {
    departmentName: canonicalCatalogName(player?.department_id, catalogs.departments, "department_id"),
    positionName: canonicalCatalogName(player?.position_id, catalogs.positions, "position_id"),
    bodyTypeName: canonicalCatalogName(player?.body_type_id, catalogs.bodyTypes, "body_type_id"),
    speechStyleName: canonicalCatalogName(player?.speech_style_id, catalogs.speechStyles, "speech_style_id")
  };
}
__name(resolvePlayerCanonicalNames, "resolvePlayerCanonicalNames");
var WEEKDAYS = ["\uC6D4\uC694\uC77C", "\uD654\uC694\uC77C", "\uC218\uC694\uC77C", "\uBAA9\uC694\uC77C", "\uAE08\uC694\uC77C"];
function compactText(value, maxLength = 120) {
  if (typeof value !== "string") return "";
  return Array.from(value.trim().replace(/\s+/g, " ")).slice(0, maxLength).join("");
}
__name(compactText, "compactText");
function openingLocationCandidates(locations2, positionId) {
  const source = Array.isArray(locations2) ? locations2 : [];
  const normalized = source.flatMap((location) => {
    const locationId = compactText(location?.location_id, 100);
    const name = compactText(location?.name, 100);
    if (!locationId || !name || location?.opening_enabled === false) return [];
    const explicitPositions = Array.isArray(location?.opening_position_ids) ? location.opening_position_ids.filter((id) => typeof id === "string" && id.trim()) : [];
    if (explicitPositions.length && !explicitPositions.includes(positionId)) return [];
    if (location?.location_type === "storage" && location?.opening_enabled !== true) return [];
    if (location?.visibility === "private" && positionId !== "executive" && !explicitPositions.length) return [];
    return [{
      location_id: locationId,
      name,
      opening_hooks: Array.isArray(location?.opening_hooks) ? location.opening_hooks : [],
      opening_goals: Array.isArray(location?.opening_goals) ? location.opening_goals : []
    }];
  });
  return normalized.length ? normalized : [{ location_id: "office", name: "\uC0AC\uBB34\uC2E4", opening_hooks: [], opening_goals: [] }];
}
__name(openingLocationCandidates, "openingLocationCandidates");
function normalizedHook(value, location) {
  if (typeof value === "string") {
    const label2 = compactText(value);
    return label2 ? { work_hook_id: `location:${location.location_id}:${label2}`, work_hook_label: label2 } : null;
  }
  const label = compactText(value?.label);
  if (!label) return null;
  const id = compactText(value?.id ?? value?.work_hook_id, 100) || `location:${location.location_id}:${label}`;
  return { work_hook_id: id, work_hook_label: label };
}
__name(normalizedHook, "normalizedHook");
function openingHooks(location) {
  const hooks = location.opening_hooks.map((value) => normalizedHook(value, location)).filter(Boolean);
  return hooks.length ? hooks : [{
    work_hook_id: `location:${location.location_id}`,
    work_hook_label: `${location.name} \uCCAB \uC5C5\uBB34`
  }];
}
__name(openingHooks, "openingHooks");
function openingGoals(location) {
  const goals = location.opening_goals.map((value) => compactText(value, 180)).filter(Boolean);
  return goals.length ? goals : [`${location.name}\uC5D0\uC11C \uD604\uC7AC \uC0C1\uD669\uC744 \uD30C\uC545\uD558\uACE0 \uCCAB \uC5C5\uBB34 \uAD00\uACC4\uB97C \uB9CC\uB4E0\uB2E4`];
}
__name(openingGoals, "openingGoals");
function buildOpeningPlan({ positionId, seedBytes, heroineIds, locations: locations2 = [] }) {
  const candidates = openingLocationCandidates(locations2, positionId);
  const bytes = seedBytes && seedBytes.length > 0 ? seedBytes : [0];
  let cursor = 0;
  const next = /* @__PURE__ */ __name((max) => {
    const value = bytes[cursor % bytes.length] % Math.max(1, max);
    cursor += 1;
    return value;
  }, "next");
  const weekday = WEEKDAYS[next(WEEKDAYS.length)];
  const minuteOfDay = 540 + next(541);
  const location = candidates[next(candidates.length)];
  const ids = Array.isArray(heroineIds) ? heroineIds : [];
  const primaryCharacterId = ids.length > 0 ? ids[next(ids.length)] : null;
  const remaining = ids.filter((id) => id !== primaryCharacterId);
  const includeSupporting = remaining.length > 0 && next(2) === 1;
  const supportingCharacterIds = includeSupporting ? [remaining[next(remaining.length)]] : [];
  const hooks = openingHooks(location);
  const hook = hooks[next(hooks.length)];
  const goals = openingGoals(location);
  const sceneGoal = goals[next(goals.length)];
  return {
    weekday,
    date_label: `Day 1 \xB7 ${weekday}`,
    minute_of_day: minuteOfDay,
    location_id: location.location_id,
    location_name: location.name,
    primary_character_id: primaryCharacterId,
    supporting_character_ids: supportingCharacterIds,
    work_hook_id: hook.work_hook_id,
    work_hook_label: hook.work_hook_label,
    scene_goal: sceneGoal
  };
}
__name(buildOpeningPlan, "buildOpeningPlan");
var BODY_KEYWORDS = ["\uC678\uBAA8", "\uCCB4\uD615", "\uC637", "\uBC97", "\uC2E0\uCCB4", "\uBAB8\uB9E4", "\uADFC\uC721", "\uD0A4\uAC00", "\uBAB8\uBB34\uAC8C", "\uD5EC\uC2A4", "\uC6B4\uB3D9"];
var SEXUAL_KEYWORDS = ["\uC131\uAE30", "\uC74C\uACBD", "\uD398\uB2C8\uC2A4", "\uC0BD\uC785", "\uC131\uAD50", "\uC139\uC2A4", "\uB178\uCD9C", "\uBC1C\uAE30", "\uC9C8\uB0B4", "\uAD6C\uAC15\uC131\uAD50", "\uD56D\uBB38\uC131\uAD50"];
var BACKGROUND_KEYWORDS = ["\uACBD\uB825", "\uC774\uB825", "\uC608\uC804", "\uACFC\uAC70", "\uC785\uC0AC \uC804", "\uC774\uC804 \uC9C1\uC7A5", "\uC804 \uC9C1\uC7A5", "\uB300\uD559\uAD50", "\uC878\uC5C5"];
function mentionsAny(text5, keywords) {
  return keywords.some((word) => text5.includes(word));
}
__name(mentionsAny, "mentionsAny");
function buildPlayerPromptProjection({ player, canonical, playerAction = "", evidence = {} } = {}) {
  const base = {
    name: typeof player?.name === "string" ? player.name : null,
    department: canonical?.departmentName ?? null,
    position: canonical?.positionName ?? null,
    speech_style: canonical?.speechStyleName ?? null
  };
  const text5 = String(playerAction ?? "");
  if (mentionsAny(text5, BODY_KEYWORDS) || evidence?.body_relevant === true) {
    base.height_cm = player?.height_cm ?? null;
    base.weight_kg = player?.weight_kg ?? null;
    base.body_type = canonical?.bodyTypeName ?? null;
  }
  if (mentionsAny(text5, SEXUAL_KEYWORDS) || evidence?.sexual_relevant === true) {
    base.penis_length_cm = player?.penis_length_cm ?? null;
  }
  if (mentionsAny(text5, BACKGROUND_KEYWORDS) || evidence?.background_relevant === true) {
    base.background = typeof player?.background === "string" ? player.background : null;
  }
  return base;
}
__name(buildPlayerPromptProjection, "buildPlayerPromptProjection");
function buildOpeningPlayerProjection({ player, canonical } = {}) {
  return {
    name: typeof player?.name === "string" ? player.name : null,
    department: canonical?.departmentName ?? null,
    position: canonical?.positionName ?? null,
    speech_style: canonical?.speechStyleName ?? null,
    height_cm: player?.height_cm ?? null,
    weight_kg: player?.weight_kg ?? null,
    body_type: canonical?.bodyTypeName ?? null
  };
}
__name(buildOpeningPlayerProjection, "buildOpeningPlayerProjection");

// src/engine/workplace-context.js
function object2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
__name(object2, "object");
function identity2(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
__name(identity2, "identity");
function profileMap(edition2) {
  return object2(edition2?.generalNpcs?.profiles) ?? {};
}
__name(profileMap, "profileMap");
function locations(edition2) {
  return Array.isArray(edition2?.map?.locations) ? edition2.map.locations : [];
}
__name(locations, "locations");
function currentLocation(edition2, save) {
  const locationId = identity2(save?.scene_state?.location_id);
  if (!locationId) return null;
  return locations(edition2).find((location) => location?.location_id === locationId) ?? null;
}
__name(currentLocation, "currentLocation");
function recordedLocationId(save, npcId) {
  return identity2(save?.npc_scene_state?.[npcId]?.location_id);
}
__name(recordedLocationId, "recordedLocationId");
function compactProfile(profile) {
  if (!object2(profile)) return null;
  const npcId = identity2(profile.id);
  const name = identity2(profile.name);
  if (!npcId || !name) return null;
  return {
    npc_id: npcId,
    name,
    sex: identity2(profile.sex),
    age: Number.isInteger(profile.age) ? profile.age : null,
    role: identity2(profile.role),
    department_id: identity2(profile.department_id),
    type: identity2(profile.type),
    affiliation_type: identity2(profile.affiliation_type)
  };
}
__name(compactProfile, "compactProfile");
function buildRegisteredGeneralNpcs(edition2) {
  return Object.values(profileMap(edition2)).map(compactProfile).filter(Boolean).map(({ npc_id, name, role }) => ({ npc_id, name, role }));
}
__name(buildRegisteredGeneralNpcs, "buildRegisteredGeneralNpcs");
function buildGeneralNpcCanon(edition2, ids) {
  const profiles2 = profileMap(edition2);
  const canon = {};
  for (const id of Array.isArray(ids) ? ids : []) {
    const profile = compactProfile(profiles2[id]);
    if (profile) canon[id] = profile;
  }
  return canon;
}
__name(buildGeneralNpcCanon, "buildGeneralNpcCanon");
function selectActiveGeneralNpcIds({ edition: edition2, save, text: text5 = "" } = {}) {
  const profiles2 = profileMap(edition2);
  const ordered = [];
  const seen = /* @__PURE__ */ new Set();
  const push = /* @__PURE__ */ __name((id) => {
    if (!identity2(id) || seen.has(id) || !object2(profiles2[id])) return;
    seen.add(id);
    ordered.push(id);
  }, "push");
  const source = typeof text5 === "string" ? text5 : "";
  for (const [id, profile] of Object.entries(profiles2)) {
    if (typeof profile?.name === "string" && profile.name && source.includes(profile.name)) push(id);
  }
  push(save?.focal_character_id);
  push(save?.last_speaker_id);
  for (const id of Array.isArray(save?.scene_state?.participants) ? save.scene_state.participants : []) push(id);
  for (const id of Array.isArray(save?.last_npcs_present) ? save.last_npcs_present : []) push(id);
  return ordered;
}
__name(selectActiveGeneralNpcIds, "selectActiveGeneralNpcIds");
function buildWorkplaceContext(edition2, save, { excludeIds = [], limit = 2 } = {}) {
  const location = currentLocation(edition2, save);
  if (!location) return { location: null, eligible_nearby_npcs: [] };
  const profiles2 = profileMap(edition2);
  const excluded = new Set(Array.isArray(excludeIds) ? excludeIds : []);
  const candidates = [];
  const seen = /* @__PURE__ */ new Set();
  const add = /* @__PURE__ */ __name((id, source) => {
    if (!identity2(id) || excluded.has(id) || seen.has(id)) return;
    const profile = compactProfile(profiles2[id]);
    if (!profile) return;
    seen.add(id);
    candidates.push({ ...profile, source, location_id: location.location_id });
  }, "add");
  for (const id of Object.keys(profiles2)) {
    if (recordedLocationId(save, id) === location.location_id) add(id, "recorded_location");
  }
  for (const id of Array.isArray(location.default_npc_ids) ? location.default_npc_ids : []) {
    const recorded = recordedLocationId(save, id);
    if (recorded && recorded !== location.location_id) continue;
    add(id, "location_default");
  }
  return {
    location: {
      location_id: location.location_id,
      name: identity2(location.name),
      floor: Number.isInteger(location.floor) ? location.floor : null,
      department_id: identity2(location.department_id),
      location_type: identity2(location.location_type),
      visibility: identity2(location.visibility),
      scene_tags: Array.isArray(location.scene_tags) ? location.scene_tags.filter((tag) => typeof tag === "string" && tag.trim()).slice(0, 6) : [],
      adjacent_location_ids: Array.isArray(location.adjacent_location_ids) ? location.adjacent_location_ids.filter((id) => typeof id === "string" && id.trim()).slice(0, 6) : []
    },
    eligible_nearby_npcs: candidates.slice(0, Math.max(0, Math.min(Number.isInteger(limit) ? limit : 2, 2)))
  };
}
__name(buildWorkplaceContext, "buildWorkplaceContext");

// src/engine/story-prompt.js
var MOVEMENT_TARGET_ACTION = /(찾으러|찾아가|찾아보|보러\s*가|만나러|이동하|가본다|가겠다|방문하)/u;
function object3(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
__name(object3, "object");
function clip(value, maxLength) {
  const text5 = typeof value === "string" ? value.trim() : "";
  if (!text5) return "";
  const characters = Array.from(text5);
  return characters.length <= maxLength ? text5 : characters.slice(-maxLength).join("");
}
__name(clip, "clip");
function normalizedChoices(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()).slice(0, 4) : [];
}
__name(normalizedChoices, "normalizedChoices");
function parsedBlocks(turn) {
  if (Array.isArray(turn?.parsed_blocks?.blocks)) return turn.parsed_blocks.blocks;
  if (Array.isArray(turn?.parsed_blocks)) return turn.parsed_blocks;
  return [];
}
__name(parsedBlocks, "parsedBlocks");
function narrativeTail(turn) {
  const blocks = parsedBlocks(turn).filter((block) => block?.type === "scene" || block?.type === "dialogue").map((block) => typeof block?.text === "string" ? block.text.trim() : "").filter(Boolean);
  const source = blocks.length ? blocks.join("\n") : typeof turn?.story_text === "string" ? turn.story_text : "";
  return clip(source, 1800);
}
__name(narrativeTail, "narrativeTail");
function dialogueTail(turn) {
  const lines = Array.isArray(turn?.parsed_blocks?.dialogue_lines) ? turn.parsed_blocks.dialogue_lines : [];
  return lines.filter((line) => object3(line) && typeof line.text === "string" && line.text.trim()).slice(-6).map((line) => ({
    speaker_id: typeof line.speaker_id === "string" ? line.speaker_id : null,
    speaker_name: typeof line.speaker_name === "string" ? line.speaker_name : "",
    direction: typeof line.direction === "string" ? line.direction : "",
    text: clip(line.text, 260)
  }));
}
__name(dialogueTail, "dialogueTail");
function koreanGivenName(name) {
  const characters = Array.from(typeof name === "string" ? name.trim() : "");
  if (characters.length !== 3 || !characters.every((character) => /[가-힣]/u.test(character))) return "";
  return characters.slice(1).join("");
}
__name(koreanGivenName, "koreanGivenName");
function resolveMovementCharacterTarget(charactersMap, playerAction) {
  const map = object3(charactersMap) ?? {};
  const action = typeof playerAction === "string" ? playerAction.trim() : "";
  if (!action || !MOVEMENT_TARGET_ACTION.test(action)) return null;
  const exact = Object.entries(map).filter(([, character]) => {
    const name = typeof character?.name === "string" ? character.name.trim() : "";
    return name && action.includes(name);
  });
  if (exact.length === 1) return exact[0][0];
  if (exact.length > 1) return null;
  const aliasMatches = Object.entries(map).filter(([, character]) => {
    const alias = koreanGivenName(character?.name);
    return alias && action.includes(alias);
  });
  return aliasMatches.length === 1 ? aliasMatches[0][0] : null;
}
__name(resolveMovementCharacterTarget, "resolveMovementCharacterTarget");
function buildLastTurnContinuity(turn) {
  if (!object3(turn)) return null;
  const continuity = {
    turn: typeof turn.turn_number === "number" ? turn.turn_number : null,
    player_action: typeof turn.player_action === "string" ? clip(turn.player_action, 500) : "",
    narrative_tail: narrativeTail(turn),
    dialogue_tail: dialogueTail(turn),
    choices: normalizedChoices(turn.choices ?? turn.parsed_blocks?.choices)
  };
  return continuity.player_action || continuity.narrative_tail || continuity.dialogue_tail.length || continuity.choices.length ? continuity : null;
}
__name(buildLastTurnContinuity, "buildLastTurnContinuity");
function buildStoryContextProjection(context, activeIds, { catalogs, playerAction, edition: edition2 } = {}) {
  const save = object3(context?.save?.data) ?? object3(context?.save) ?? {};
  const game = object3(context?.game) ?? {};
  const player = object3(save.player) ?? {};
  const canonical = resolvePlayerCanonicalNames(player, catalogs);
  const recentTurns = Array.isArray(context?.recent_turns) ? context.recent_turns.slice(-3) : [];
  const gameTime = object3(save.world_state?.game_time) ?? {};
  return {
    game: { id: typeof game.id === "string" ? game.id : null, title: typeof game.title === "string" ? game.title : null },
    current_time: {
      day: typeof gameTime.day === "number" ? gameTime.day : null,
      minute_of_day: typeof gameTime.minute_of_day === "number" ? gameTime.minute_of_day : null
    },
    player: buildPlayerPromptProjection({ player, canonical, playerAction }),
    ...buildSceneContextCore(save, activeIds),
    workplace: buildWorkplaceContext(edition2, save, { excludeIds: activeIds }),
    story_summary: {
      overall: typeof save.story_summary_overall === "string" ? save.story_summary_overall : "",
      recent: typeof save.story_summary_recent === "string" ? save.story_summary_recent : ""
    },
    recent_turns: recentTurns.map((turn, index, array) => {
      const entry = {
        turn: typeof turn?.turn_number === "number" ? turn.turn_number : null,
        player_action: typeof turn?.player_action === "string" ? turn.player_action : "",
        turn_summary: typeof turn?.turn_summary === "string" ? turn.turn_summary : ""
      };
      if (index === array.length - 1 && Array.isArray(turn?.choices)) entry.choices = turn.choices;
      return entry;
    }),
    last_turn_continuity: buildLastTurnContinuity(recentTurns.at(-1))
  };
}
__name(buildStoryContextProjection, "buildStoryContextProjection");
var SYSTEM_INSTRUCTIONS = [
  "NPC \uBB3C\uB9AC \uC0C1\uD0DC(\uBCF5\uC7A5\xB7\uC790\uC138\xB7\uC704\uCE58): context.active_npc_state.npc_scene_state\uC5D0 \uC788\uB294 \uBCF5\uC7A5\xB7\uC790\uC138\xB7\uC704\uCE58\uB294 \uD604\uC7AC \uBB3C\uB9AC \uC0C1\uD0DC(\uD655\uC815 \uC0AC\uC2E4)\uB2E4. \uC2E4\uC81C\uB85C \uC637\uC744 \uBC97\uACE0 \uC785\uACE0 \uC5F4\uACE0 \uC7A0\uADF8\uB294 \uD589\uB3D9\uC774 \uC774\uBC88 \uC11C\uC0AC\uC5D0\uC11C \uC644\uB8CC\uB41C \uACBD\uC6B0\uC5D0\uB9CC \uBC14\uB010\uB2E4. \uC0C1\uC2DD\uAC1C\uBCC0(CSA) \uC801\uC6A9\xB7\uD574\uC81C\uB9CC\uC73C\uB85C \uBCF5\uC7A5\uC774 \uC790\uB3D9\uC73C\uB85C \uBC14\uB00C\uC9C0 \uC54A\uC73C\uBA70, \uC544\uBB34 \uC774\uC720 \uC5C6\uC774 \uAC11\uC790\uAE30 \uC785\uC5C8\uB2E4 \uBC97\uC5C8\uB2E4 \uD558\uC9C0 \uC54A\uB294\uB2E4. \uC54C \uC218 \uC5C6\uC73C\uBA74 \uC800\uC7A5\uB41C \uB9C8\uC9C0\uB9C9 \uC0C1\uD0DC\uB97C \uC720\uC9C0\uD55C\uB2E4.",
  "\uC0C1\uC2DD\uAC1C\uBCC0 \uC989\uC2DC \uBC18\uC601(\uAC13 \uC801\uC6A9\uB41C CSA\uB9CC): \uAC13 \uC801\uC6A9\uB41C \uD65C\uC131 CSA \uADDC\uCE59\uC740 \uC774\uBC88 \uD134 \uC11C\uC0AC \uCD08\uBC18\uBD80\uC5D0 \uBC14\uB85C \uC7A5\uBA74\uC5D0 \uBC18\uC601\uD558\uACE0, \uAD00\uB828 NPC\uAC00 \uADF8 \uADDC\uCE59\uC744 \uB2F9\uC5F0\uD558\uAC8C \uBC1B\uC544\uB4E4\uC774\uAC70\uB098(\uC218\uC6A9) \uC5B4\uC0C9\uD574\uD558\uAC70\uB098(\uBD88\uD3B8) \uBC18\uBB38\uD558\uB294 \uB4F1 \uBC18\uC751\uD558\uB294 \uC7A5\uBA74\uC744 \uC4F4\uB2E4. CSA\uAC00 \uC11C\uC0AC \uD6C4\uBC18\uC5D0\uB9CC \uC2AC\uCA4D \uB4F1\uC7A5\uD558\uAC70\uB098 \uD134 \uC804\uCCB4\uC5D0 \uBC18\uC601\uB418\uC9C0 \uC54A\uC73C\uBA74 \uC548 \uB41C\uB2E4. \uAC13 \uC801\uC6A9\uB41C CSA\uC758 \uC801\uC6A9 \uC2DC\uC810\uC740 \uC9C0\uAE08(\uC774\uBC88 \uD134)\uC774\uB2E4 \u2014 \uC624\uB298 \uC544\uCE68\xB7\uC5B4\uC81C \uB4F1 \uACFC\uAC70\uBD80\uD130 \uADF8 \uADDC\uC815\uC774 \uC801\uC6A9\uB3FC \uC788\uC5C8\uB2E4\uACE0 \uC4F0\uC9C0 \uC54A\uACE0, NPC\uAC00 \uC774\uBBF8 \uC2DC\uD589\uB41C \uAC83\uCC98\uB7FC \uC11C\uC220\uD558\uC9C0 \uC54A\uB294\uB2E4. \uACF5\uC9C0\xB7\uC9C0\uCE68\uC774 \uBC29\uAE08 \uB0B4\uB824\uC640\uC11C NPC\uB4E4\uC774 \uCC98\uC74C \uBCF4\uACE0 \uB2F9\uD669\xB7\uD655\uC778\xB7\uB17C\uC758\uD558\uB294 \uC7A5\uBA74\uC774 \uD3EC\uC778\uD2B8\uB2E4. \uBC18\uB300\uB85C \uC774\uBBF8 \uC801\uC6A9\uB41C \uC9C0 \uC624\uB798\uB41C CSA\uB294 \uC11C\uC0AC\uC5D0\uC11C \uB9E4 \uD134 \uBC18\uBCF5 \uC124\uBA85\uD558\uC9C0 \uC54A\uB294\uB2E4 \u2014 NPC\uAC00 \uADF8 \uADDC\uC815 \uC544\uB798 \uC0DD\uD65C\uD558\uB294 \uAC8C \uC790\uC5F0\uC2A4\uB7EC\uC6B8 \uBFD0, \uADDC\uCE59 \uC790\uCCB4\uB97C \uB2E4\uC2DC \uC74A\uC9C0 \uC54A\uB294\uB2E4. NPC\uB294 \uACF5\uC9C0\uAC00 \uC138\uACC4 \uB0B4\uBD80\uC5D0\uC11C \uB0B4\uB824\uC628 \uADDC\uC815\uC73C\uB85C \uBCF4\uC9C0, \uC571\xB7\uC2DC\uC2A4\uD15C\xB7\uD50C\uB808\uC774\uC5B4\uAC00 \uB9CC\uB4E0 \uAC83\uC73C\uB85C\uB294 \uC808\uB300 \uBCF4\uC9C0 \uC54A\uB294\uB2E4.",
  "\uB108\uB294 \uD55C\uAD6D\uC5B4 \uD68C\uC0AC \uBC30\uACBD \uAC8C\uC784\uC758 \uD55C \uD134 \uBD84\uB7C9 Story\uB97C \uC791\uC131\uD55C\uB2E4. \uCD9C\uB825\uC740 \uC815\uD655\uD788 \uB2E4\uC74C \uB124 \uC139\uC158\uC744 \uC774 \uC21C\uC11C\uB85C\uB9CC \uC4F4\uB2E4: [1. \uC11C\uC0AC \uBC0F \uD589\uB3D9] [2. \uD50C\uB808\uC774\uC5B4 \uC18D\uB9C8\uC74C] [3. \uD50C\uB808\uC774\uC5B4 \uC0C1\uD669\uD310] [4. \uC120\uD0DD\uC9C0]. \uB2E4\uB978 \uC0AC\uC6A9\uC790\uC6A9 \uC139\uC158(\uC608: \uBCC4\uB3C4 [DIALOGUE])\uC774\uB098 \uC139\uC158 \uBC16 \uC124\uBA85\xB7JSON\xB7\uBA54\uD0C0 \uCF54\uBA58\uD2B8\uB294 \uC4F0\uC9C0 \uC54A\uB294\uB2E4.",
  '[1. \uC11C\uC0AC \uBC0F \uD589\uB3D9]: \uD50C\uB808\uC774\uC5B4\uAC00 \uC0C8\uB85C \uD569\uB958\uD55C \uC2E0\uC785\uC774\uBA74 \uC778\uC0AC\xB7\uC18C\uAC1C\xB7\uB208\uCE58 \uBCF4\uAE30 \uAC19\uC740 \uC778\uAC04\uAD00\uACC4 \uD589\uB3D9\uC774 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uB098\uC624\uB3C4\uB85D \uD558\uACE0, \uC5C5\uBB34 \uC9C4\uD589\uB9CC\uC73C\uB85C \uD134\uC744 \uCC44\uC6B0\uC9C0 \uC54A\uB294\uB2E4. \uC0AC\uB0B4 \uC77C\uC0C1(\uCEE4\uD53C, \uC810\uC2EC, \uC7A1\uB2F4, \uD68C\uC758 \uCC38\uC11D, \uBD80\uC11C \uC774\uB3D9)\uACFC \uAD00\uACC4 \uD615\uC131\uC774 \uC11C\uC0AC\uC758 \uC911\uC2EC\uC774 \uB420 \uC218 \uC788\uB2E4. context.current_time(\uAC8C\uC784 \uC2DC\uAC01, minute_of_day)\uC744 \uCC38\uACE0\uD574 \uC2DC\uAC04\uB300\uC5D0 \uB9DE\uB294 \uC0AC\uB0B4 \uC0C1\uD669\uC744 \uBC18\uC601\uD55C\uB2E4(\uC608: 09:00~10:00 \uCD9C\uADFC\xB7\uC870\uD68C, 12:00~13:00 \uC810\uC2EC\uC2DC\uAC04, 18:00 \uC774\uD6C4 \uC57C\uADFC, 22:00 \uC774\uD6C4 \uC2EC\uC57C \uADFC\uBB34). \uC2DC\uAC01\uC774 \uBAA8\uD638\uD558\uBA74 \uADF8\uB300\uB85C \uB450\uACE0 \uAC15\uC870\uD558\uC9C0 \uC54A\uB294\uB2E4. \uC11C\uC220\uC740 [SCENE] \uC904 \uB4A4\uC5D0 \uC4F0\uACE0, \uBC1C\uD654\uB294 \uBC18\uB4DC\uC2DC [\uCD5C\uC885 \uCD9C\uC5F0\xB7\uB300\uC0AC \uCD9C\uB825 \uACC4\uC57D]\uC758 [DIALOGUE speaker_id="..." acting_direction="..."] \uD615\uC2DD\uC73C\uB85C\uB9CC \uC4F4\uB2E4. \uD654\uC790\uBA85 \uC5C6\uB294 \uB300\uC0AC\xB7\uC774\uB984: \uB300\uC0AC\xB7\uC9C1\uAE09\uB9CC \uD45C\uC2DC\uD55C \uB300\uC0AC\uB294 \uAE08\uC9C0\uB2E4. \uBD84\uB7C9 \uBAA9\uD45C(Context/\uC120\uD0DD\uC9C0/\uC18D\uB9C8\uC74C/\uC0C1\uD669\uD310 \uC81C\uC678)\uB294 \uAC00\uBCBC\uC6B4 \uBC18\uC751 800~1000\uC790, \uB300\uD654\xB7\uAC08\uB4F1\xB7\uAD6C\uCCB4 \uD589\uB3D9 1000~1500\uC790, \uC774\uB3D9\xB7\uB2E4\uC218 NPC\xB7\uC911\uC694 CSA 1200~2000\uC790\uB2E4. NPC \uB4F1\uC7A5 \uD134\uC740 \uC758\uBBF8 \uC788\uB294 \uBC1C\uC5B8 3\uD68C \uC774\uC0C1\uC744 \uBAA9\uD45C\uB85C \uD558\uB418 \uAC19\uC740 \uB9D0\uC744 \uC904\uB9CC \uB098\uB220 \uCC44\uC6B0\uC9C0 \uC54A\uB294\uB2E4. \uC774 \uBAA9\uD45C\uB4E4\uC740 \uC0DD\uC131 \uBAA9\uD45C\uC77C \uBFD0 \uAC80\uC99D \uAC8C\uC774\uD2B8\uAC00 \uC544\uB2C8\uBA70 \uBBF8\uB2EC\uB85C \uC7AC\uC0DD\uC131\uD558\uC9C0 \uC54A\uB294\uB2E4.',
  "\uC7A5\uBA74 \uC5F0\uC18D\uC131: context.last_turn_continuity\uAC00 \uC788\uC73C\uBA74 turn_summary\uBCF4\uB2E4 \uC2E4\uC81C narrative_tail\uACFC dialogue_tail\uC744 \uC6B0\uC120\uD55C\uB2E4. \uC9C1\uC804 \uC9C8\uBB38\xB7\uC57D\uC18D\xB7\uACB0\uC815\xB7\uB9D0\uD22C\xB7\uBB3C\uAC74\xB7\uC790\uC138\uB97C \uBB34\uC2DC\uD558\uACE0 \uC7A5\uBA74\uC744 \uC7AC\uC2DC\uC791\uD558\uC9C0 \uC54A\uC73C\uBA70, \uC9C8\uBB38\uC5D0\uB294 \uB2F5\uBCC0\xB7\uD68C\uD53C\xB7\uBCF4\uB958 \uC911 \uD558\uB098\uB85C \uBC18\uC751\uD558\uACE0 \uAC19\uC740 \uC124\uBA85\uC744 \uBC18\uBCF5\uD558\uC9C0 \uC54A\uB294\uB2E4.",
  "NPC \uC790\uC728\uC131\xB7\uC7A5\uBA74 \uC9C4\uD589: \uAD00\uB828 NPC\uB294 \uC785\uB825\uB9CC \uAE30\uB2E4\uB9AC\uC9C0 \uC54A\uACE0 \uBAA9\uC801\xB7\uC131\uACA9\xB7\uC0C1\uD669\uC5D0 \uB530\uB978 \uC791\uC740 \uD589\uB3D9\uC744 \uD55C\uB2E4. \uBB38\uC11C\xB7\uBAA8\uB2C8\uD130\xB7\uBA54\uC2E0\uC800\xB7\uC804\uD654\xB7\uC77C\uC815\xB7\uC774\uB3D9 \uAC19\uC740 \uC5C5\uBB34 \uD589\uB3D9\uBFD0 \uC544\uB2C8\uB77C \uCEE4\uD53C\xB7\uC810\uC2EC\xB7\uC7A1\uB2F4\xB7\uD734\uC2DD\xB7\uBCF5\uB3C4 \uC774\uB3D9 \uAC19\uC740 \uC0AC\uC801\uC774\uACE0 \uC77C\uC0C1\uC801\uC778 \uD589\uB3D9\uB3C4 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC11E\uC5B4 \uC4F0\uB418 \uD50C\uB808\uC774\uC5B4 \uD589\uB3D9\uC744 \uB300\uC2E0\uD558\uC9C0 \uC54A\uB294\uB2E4. \uAC01 \uD134\uC740 scene_goal \uB610\uB294 focus_thread\uB97C \uB2F5\uBCC0\xB7\uC9C4\uD589\xB7\uBCF5\uC7A1\uD654\xB7\uC815\uB9AC \uC911 \uD558\uB098\uB85C \uD55C \uB2E8\uACC4 \uC6C0\uC9C1\uC778\uB2E4. NPC \uB4F1\uC7A5 \uC5EC\uBD80\uB294 scene_cast_contract\uAC00 \uC774\uBBF8 \uD655\uC815\uD588\uACE0 \uB108\uC5D0\uAC8C\uB294 \uACB0\uC815 \uAD8C\uD55C\uC774 \uC5C6\uB2E4. eligible_nearby_npcs\uB294 \uC11C\uBC84 \uB0B4\uBD80 \uCC38\uACE0 \uBAA9\uB85D\uC77C \uBFD0\uC774\uBBC0\uB85C \uADF8\uAC83\uC744 \uADFC\uAC70\uB85C \uB204\uAD6C\uB3C4 \uB4F1\uC7A5\uC2DC\uD0A4\uC9C0 \uB9C8\uB77C.",
  "\uB300\uD654 \uAE30\uB2A5: \uCCAB \uBC1C\uC5B8\uC740 \uBC18\uC751\xB7\uC9C8\uBB38\xB7\uD655\uC778, \uC911\uAC04\uC740 \uC0C8 \uC815\uBCF4\xB7\uC870\uAC74\xB7\uBC18\uB860\xB7\uAC10\uC815 \uBCC0\uD654, \uB9C8\uC9C0\uB9C9\uC740 \uACB0\uC815\xB7\uD589\uB3D9 \uC2DC\uC791\xB7\uB2E4\uC74C \uC7C1\uC810 \uC911 \uC11C\uB85C \uB2E4\uB978 \uAE30\uB2A5\uC744 \uB9E1\uB294\uB2E4. \uB2E4\uC778 \uC7A5\uBA74\uC740 \uAC00\uB2A5\uD558\uBA74 NPC\uB07C\uB9AC \uD55C \uBC88 \uC774\uC0C1 \uC9C1\uC811 \uBC18\uC751\uD558\uACE0, \uBAA8\uB450 \uAC19\uC740 \uC758\uACAC\uC744 \uBC18\uBCF5\uD558\uC9C0 \uC54A\uB294\uB2E4.",
  "\uAD00\uACC4 \uC758\uBBF8\uB97C \uBD84\uB9AC\uD55C\uB2E4. \uC5C5\uBB34 \uD611\uC870\uB294 \uD638\uAC10\uC774 \uC544\uB2C8\uACE0, \uC9C1\uAE09 \uC218\uD589\uC740 \uC0AC\uC801 \uBCF5\uC885\uC774 \uC544\uB2C8\uBA70, CSA \uC218\uC6A9\uC740 \uC560\uC815\xB7\uC131\uC801 \uB3D9\uC758\uAC00 \uC544\uB2C8\uB2E4. \uCE5C\uC808\uACFC \uCE5C\uBC00\uAC10, \uD765\uBD84\uACFC \uC218\uC6A9, \uAC70\uC808\uACFC \uC801\uB300\uAC10\uC744 \uC790\uB3D9\uC73C\uB85C \uB3D9\uC77C\uC2DC\uD558\uC9C0 \uC54A\uB294\uB2E4. \uAC19\uC740 \uD589\uB3D9\uC5D0 \uC5C5\uBB34\uC0C1 \uC218\uC6A9\uACFC \uAC1C\uC778\uC801 \uBD88\uD3B8\uC774 \uB3D9\uC2DC\uC5D0 \uC874\uC7AC\uD560 \uC218 \uC788\uB2E4.",
  "\uD50C\uB808\uC774\uC5B4 \uC790\uC720\uB3C4: \uD50C\uB808\uC774\uC5B4\uAC00 \uC785\uB825\uD558\uC9C0 \uC54A\uC740 \uB2E4\uC74C \uD589\uB3D9\uC744 \uB300\uC2E0 \uC644\uB8CC\uD558\uC9C0 \uC54A\uB294\uB2E4. \uB2E4\uC74C \uD589\uB3D9\uC744 \uACE0\uBBFC\xB7\uC9C8\uBB38\xB7\uC81C\uC548\uD558\uB294 \uAC83\uC740 \uB418\uC9C0\uB9CC, \uC785\uB825\uD558\uC9C0 \uC54A\uC740 \uB300\uC0AC\xB7\uC774\uB3D9\xB7\uC2E0\uCCB4 \uD589\uB3D9\uC744 \uC774\uBBF8 \uD588\uB2E4\uACE0 \uC4F0\uAC70\uB098 \uC120\uD0DD\uC9C0 \uACB0\uACFC\uB97C \uBCF8\uBB38\uC5D0\uC11C \uBBF8\uB9AC \uD655\uC815\uD558\uC9C0 \uC54A\uB294\uB2E4. \uC694\uCCAD \uACB0\uACFC\uB294 \uC2DC\uB3C4/\uAC70\uC808/\uBD80\uBD84 \uC218\uC6A9/\uC870\uAC74\uBD80 \uC218\uC6A9/\uC77C\uC2DC \uC911\uB2E8/\uC644\uB8CC \uC911 \uD558\uB098\uB85C\uB9CC \uAC08\uB9AC\uBA70, \uC694\uCCAD\uD588\uB2E4\uACE0 \uC790\uB3D9 \uC644\uB8CC\uB418\uC9C0 \uC54A\uACE0 \uAC70\uC808\uB2F9\uD574\uB3C4 \uD50C\uB808\uC774\uC5B4\uC758 \uB2E4\uC74C \uC785\uB825 \uC790\uCCB4\uB294 \uB9C9\uD788\uC9C0 \uC54A\uB294\uB2E4.",
  '[2. \uD50C\uB808\uC774\uC5B4 \uC18D\uB9C8\uC74C]: \uB530\uC634\uD45C \uC5C6\uB294 1\uC778\uCE6D \uD55C\uAD6D\uC5B4 \uB0B4\uBA74 \uB3C5\uBC31\uC73C\uB85C, \uC0C1\uD669\uC5D0 \uB300\uD55C \uC989\uAC01\uC801\uC774\uACE0 \uAD6C\uC5B4\uCCB4\uC801\uC778 \uBC18\uC751 \uC704\uC8FC\uB85C \uC4F4\uB2E4. \uC2E4\uC81C \uC0AC\uB78C\uC774 \uD63C\uC7A3\uB9D0\uD558\uB4EF \uC9E7\uACE0 \uB9AC\uB4EC\uAC10 \uC788\uAC8C (\uC608: "\uC640 \uC774\uAC70 \uBB50\uC57C \u314B\u314B", "\uC5B4\uC6B0 \uCA54\uC5C8\uB2E4\u2026", "\uC774\uB7EC\uB2E4 \uD070\uC77C \uB098\uACA0\uB294\uB370"). context.player.speech_style(\uD50C\uB808\uC774\uC5B4\uAC00 \uC0DD\uC131 \uC2DC \uC120\uD0DD\uD55C \uB9D0\uD22C)\uC744 \uBC18\uB4DC\uC2DC \uBC18\uC601\uD574 \uADF8 \uB9D0\uD22C \uADF8\uB300\uB85C \uD63C\uC7A3\uB9D0\uC744 \uC4F4\uB2E4. \uAC10\uC815 \uD0A4\uC6CC\uB4DC\xB7\uC0C1\uD0DC \uB77C\uBCA8 \uB098\uC5F4, \uBB38\uC5B4\uCCB4 \uC11C\uC220, \uC7A5\uD669\uD55C \uBD84\uC11D\uC740 \uC4F0\uC9C0 \uC54A\uB294\uB2E4. \uBD84\uB7C9\uC740 80~200\uC790 \uB0B4\uC678\uB85C \uC9E7\uAC8C. \uD604\uC7AC \uD134\uC5D0\uB9CC \uD574\uB2F9\uD558\uBA70 \uC774\uC804 \uD134\uC744 \uBC18\uBCF5\uD558\uC9C0 \uC54A\uACE0, \uC785\uB825\uD558\uC9C0 \uC54A\uC740 \uD589\uB3D9\uC744 \uC644\uB8CC\uD588\uB2E4\uACE0 \uC4F0\uC9C0 \uC54A\uB294\uB2E4.',
  '[3. \uD50C\uB808\uC774\uC5B4 \uC0C1\uD669\uD310]: context\uB85C \uC2E4\uC81C \uC804\uB2EC\uB41C \uAC12\uB9CC \uD45C\uC2DC\uD55C\uB2E4(\uC774\uB984/\uBD80\uC11C/\uC9C1\uAE09/\uC7A5\uC18C/Day\xB7\uC2DC\uAC01/\uD604\uC7AC \uD134/\uC774\uBC88 \uD134 \uD655\uC815 \uBCC0\uD654/\uD65C\uC131 CSA/arousal). \uD65C\uC131 CSA\uB294 ID(csa_1 \uB4F1)\uB97C \uC808\uB300 \uADF8\uB300\uB85C \uC4F0\uC9C0 \uC54A\uACE0, global_csa.rules\uC5D0\uC11C \uD574\uB2F9 \uADDC\uCE59\uC758 \uB0B4\uC6A9\uC744 \uCC3E\uC544 \uC9E7\uC740 \uC694\uC57D(\uC608: \uC5EC\uC131 \uC9C1\uC6D0 \uC18D\uC637 \uBBF8\uCC29\uC6A9, \uD50C\uB808\uC774\uC5B4 \uBB34\uB98E \uC704\uC5D0 \uC549\uC544 \uB300\uD654)\uC73C\uB85C\uB9CC \uD45C\uC2DC\uD55C\uB2E4. \uD65C\uC131 CSA\uB294 \uC774\uBC88 \uD134\uC5D0 \uC0C8\uB85C \uC801\uC6A9\uB418\uAC70\uB098 \uBCC0\uACBD\uB41C \uADDC\uCE59\uB9CC \uC0C1\uC138\uD788 \uB098\uC5F4\uD558\uACE0, \uC774\uC804 \uD134\uACFC \uB3D9\uC77C\uD55C CSA\uB294 "\uD65C\uC131 CSA: \uC774\uC804\uACFC \uB3D9\uC77C" \uD55C \uC904\uB85C\uB9CC \uC4F0\uAC70\uB098 \uC544\uC608 \uC0DD\uB7B5\uD55C\uB2E4 \u2014 \uAC19\uC740 CSA \uC124\uBA85\uC744 \uD134\uB9C8\uB2E4 \uBC18\uBCF5\uD558\uC9C0 \uC54A\uB294\uB2E4. \uC5C6\uB294 \uAC12\uC740 \uC0DD\uB7B5\uD558\uACE0, \uAC1C\uC778 \uC554\uC2DC\uB098 \uCD94\uCE21\uD55C \uC22B\uC790\xB7\uC608\uC0C1 \uBCC0\uD654\uB7C9\xB7\uBBF8\uD655\uC815 provisional \uAC12\uC758 \uD655\uC815 \uD45C\uC2DC\uB294 \uAE08\uC9C0\uB41C\uB2E4.',
  "[4. \uC120\uD0DD\uC9C0]: \uC815\uD655\uD788 4\uAC1C. \uAC01 \uC904\uC740 `\uBC88\uD638. [\uC9E7\uC740\uB77C\uBCA8] \uC120\uD0DD\uC9C0 \uC804\uBB38` \uD615\uC2DD\uC774\uACE0 \uB77C\uBCA8\uC740 \uACF5\uBC31 \uC5C6\uC774 2~5\uAE00\uC790, \uB124 \uAC1C\uAC00 \uC11C\uB85C \uB2E4\uB974\uB2E4. \uC804\uBB38\uC740 \uACB0\uACFC\uB97C \uC120\uD655\uC815\uD558\uC9C0 \uC54A\uB294 \uD558\uB098\uC758 \uD575\uC2EC \uD589\uB3D9\uC774\uB2E4. \uC5C5\uBB34 \uC120\uD0DD\uC9C0\uB294 \uD558\uB098\uB3C4 \uB9CC\uB4E4\uC9C0 \uC54A\uB294\uB2E4 \u2014 \uC790\uB8CC \uD655\uC778\xB7\uC608\uC0B0 \uAC80\uD1A0\xB7\uBCF4\uACE0\uC11C\xB7\uAC10\uC0AC \uD3EC\uC778\uD2B8\xB7\uACC4\uC57D \uAC80\uD1A0\xB7\uC9C0\uD45C \uBD84\uC11D\xB7\uD68C\uC758 \uACC4\uC18D\xB7\uBA54\uC77C \uD655\uC778 \uAC19\uC740 \uD56D\uBAA9\uC740 \uAE08\uC9C0\uC774\uACE0, \uD50C\uB808\uC774\uC5B4\uAC00 \uC774\uBC88 \uD134\uC5D0 \uC5C5\uBB34\uB97C \uC9C1\uC811 \uC785\uB825\uD588\uC5B4\uB3C4 \uB2E4\uC74C \uC120\uD0DD\uC9C0\uB294 \uC5C5\uBB34\uB85C \uC774\uC5B4\uC9C0\uC9C0 \uC54A\uB294\uB2E4. \uB124 \uAC1C\uB294 \uAC01\uAC01 1) \uC7A5\uBA74 NPC\uC5D0\uAC8C \uB9D0\uC744 \uAC78\uAC70\uB098 \uAD00\uACC4\uB97C \uC9C4\uC804\uC2DC\uD0A4\uB294 \uD589\uB3D9, 2) NPC\uC758 \uAC10\uC815\xB7\uBC18\uC751\xB7CSA \uC0C1\uD669\uC5D0 \uB300\uC751\uD558\uB294 \uD589\uB3D9, 3) \uACFC\uAC10\uD558\uAC70\uB098 \uC7A5\uB09C\uC2A4\uB7EC\uC6B4 \uC790\uC720 \uD589\uB3D9, 4) \uC774\uB3D9\uD558\uAC70\uB098 \uB300\uD654\uB97C \uB05D\uB0B4\uAC70\uB098 \uB2E4\uB978 \uC778\uBB3C\uC744 \uCC3E\uC544\uAC00\uB294 \uD589\uB3D9\uC744 \uB9E1\uB294\uB2E4. \uAC19\uC740 \uB300\uC0C1\xB7\uB3D9\uC0AC\uC758 \uD615\uD0DC\uB9CC \uBC14\uAFB8\uC9C0 \uC54A\uB294\uB2E4.",
  "CSA(\uACF5\uD1B5 \uC778\uC2DD \uADDC\uCE59)\uB294 \uD56D\uC0C1 \uC804\uC5ED \uADDC\uCE59\uC774\uBA70 NPC\uB294 \uAC70\uC808\uD560 \uC218 \uC788\uC9C0\uB9CC \uD50C\uB808\uC774\uC5B4\uC758 \uC790\uC720 \uC785\uB825 \uC790\uCCB4\uB294 \uB9C9\uC9C0 \uC54A\uB294\uB2E4. context, active_character_canon, active_general_npc_canon, eligible_nearby_npcs\uC5D0 \uC5C6\uB294 NPC\uB098 \uC7A5\uBA74\uC744 \uC0C8\uB85C \uB9CC\uB4E4\uC9C0 \uC54A\uB294\uB2E4.",
  "[\uC5C5\uBB34 \uD3B8\uD5A5 \uC81C\uAC70] \uD50C\uB808\uC774\uC5B4\uAC00 \uC5C5\uBB34\uB97C \uC9C1\uC811 \uC694\uAD6C\uD558\uC9C0 \uC54A\uC558\uB2E4\uBA74 \uC608\uC0B0\xB7\uC2E4\uC801\xB7\uB9E4\uCD9C\xB7\uC9C0\uD45C\xB7\uAD11\uACE0\uBE44\xB7\uACC4\uC57D\xB7\uBCF4\uACE0\uC11C\xB7\uC790\uB8CC \uC624\uB958\xB7\uB9C8\uAC10\xB7\uBB38\uC11C \uC804\uB2EC\uC744 \uC0C8\uB85C \uB9CC\uB4E4\uC9C0 \uC54A\uB294\uB2E4. \uC9C1\uC811 \uC785\uB825\uD55C \uACBD\uC6B0\uC5D0\uB3C4 \uC694\uAD6C\uD55C \uB9CC\uD07C\uB9CC \uCC98\uB9AC\uD558\uACE0 \uC0C8 \uC18C\uC7AC\uB97C \uB367\uBD99\uC774\uC9C0 \uC54A\uB294\uB2E4. \uC5C5\uBB34\uB97C \uC774\uC720\uB85C \uB2E4\uB978 NPC\uB97C \uB4F1\uC7A5\uC2DC\uD0A4\uC9C0 \uC54A\uB294\uB2E4 \u2014 \uC790\uB8CC \uC804\uB2EC\xB7\uBB3C\uAC74 \uCC3E\uAE30\xB7\uCEE4\uD53C\xB7\uBCF4\uACE0 \uC9C0\uC6D0 \uBA85\uBAA9\uC758 \uB09C\uC785\uC740 \uAE08\uC9C0\uC774\uBA70 \uB4F1\uC7A5\uC740 scene_cast_contract\uB9CC \uC815\uD55C\uB2E4. \uC0AC\uB0B4 \uC77C\uC0C1\uACFC \uAD00\uACC4\xB7\uAC10\uC815\uC774 \uC11C\uC0AC\uC758 \uC911\uC2EC\uC774\uB2E4.",
  "active_character_canon\uC740 \uD65C\uC131 \uB4F1\uB85D \uCE90\uB9AD\uD130\uC758 \uC720\uC77C\uD55C \uC0AC\uC2E4 \uAE30\uC900\uC774\uACE0 active_general_npc_canon\uACFC eligible_nearby_npcs\uB294 \uC77C\uBC18 NPC\uC758 \uC720\uC77C\uD55C \uC0AC\uC2E4 \uAE30\uC900\uC774\uB2E4. \uC774\uB984\xB7\uB098\uC774\xB7\uBD80\uC11C\xB7\uC9C1\uAE09\xB7\uC131\uACA9\xB7\uB9D0\uD22C\uB97C \uC784\uC758\uB85C \uBC14\uAFB8\uAC70\uB098 \uC2B9\uACA9\uD558\uC9C0 \uC54A\uB294\uB2E4. canon\uC5D0 \uC5C6\uB294 \uCE90\uB9AD\uD130\uB97C \uC7A5\uBA74\uC5D0 \uC5B5\uC9C0\uB85C \uCD9C\uC5F0\uC2DC\uD0A4\uC9C0 \uC54A\uB294\uB2E4. prompt_card\uC758 personality, speech, distinctive_traits, csa_style\uC744 \uD589\uB3D9\xB7\uB300\uC0AC\xB7\uAC70\uB9AC\uAC10\uC758 \uC0DD\uC131 \uADFC\uAC70\uB85C \uC0AC\uC6A9\uD55C\uB2E4.",
  '[\uCD5C\uC885 \uCD9C\uC5F0\xB7\uB300\uC0AC \uCD9C\uB825 \uACC4\uC57D \u2014 \uC55E\uC120 \uBAA8\uB4E0 \uBB38\uCCB4 \uC9C0\uC2DC\uBCF4\uB2E4 \uC6B0\uC120] \uC774\uBC88 \uD134\uC5D0 \uC2E4\uC81C\uB85C \uC874\uC7AC\uD558\uAC70\uB098 \uBC1C\uD654\uD560 \uC218 \uC788\uB294 \uC778\uBB3C\uC740 scene_cast_contract\uAC00 \uC720\uC77C\uD55C \uAE30\uC900\uC774\uB2E4. present_npc_ids, entering_npc_ids, remote_npc_ids\uC5D0 \uC5C6\uB294 NPC\uB97C \uD604\uC7A5\uC5D0 \uB4F1\uC7A5\uC2DC\uD0A4\uAC70\uB098 \uD589\uB3D9\uC2DC\uD0A4\uAC70\uB098 \uB9D0\uD558\uAC8C \uD558\uC9C0 \uB9C8\uB77C. destination_npc_ids\uB294 \uD50C\uB808\uC774\uC5B4\uAC00 \uC774\uB3D9 \uBAA9\uC801\uC9C0\uC5D0\uC11C \uB9CC\uB0A0 NPC\uC774\uC9C0, \uAE30\uC874 \uC7A5\uBA74\uC5D0 \uAC11\uC790\uAE30 \uB4F1\uC7A5\uC2DC\uD0A4\uB294 \uB300\uC0C1\uC774 \uC544\uB2C8\uB2E4. scene_cast_contract.transition_mode\uAC00 "movement"\uC778 \uACBD\uC6B0 \uC774\uBC88 \uD134\uC740 \uC7A5\uC18C \uC774\uB3D9\uC744 \uC644\uB8CC\uD558\uB294 \uC804\uD658 \uD134\uC774\uB2E4 \u2014 \uD604\uC7AC \uC7A5\uC18C NPC\uC640 \uBAA9\uC801\uC9C0 NPC\uC758 \uC9C1\uC811 \uB300\uC0AC\uB97C \uC0DD\uC131\uD558\uC9C0 \uC54A\uACE0, \uAE30\uC874 \uC7A5\uC18C\uB97C \uB5A0\uB098\uB294 \uACFC\uC815\uACFC \uBAA9\uC801\uC9C0\uC5D0 \uB3C4\uCC29\uD558\uB294 \uC7A5\uBA74\uAE4C\uC9C0\uB9CC \uC11C\uC220\uD55C\uB2E4. \uBAA9\uC801\uC9C0 NPC\uB97C \uBC1C\uACAC\uD558\uAC70\uB098 \uB9C8\uC8FC\uCCE4\uB2E4\uB294 \uC11C\uC220\uC740 \uAC00\uB2A5\uD558\uC9C0\uB9CC \uBC1C\uD654\uC2DC\uD0A4\uC9C0 \uC54A\uC73C\uBA70, \uBAA9\uC801\uC9C0 NPC\uC640\uC758 \uB300\uD654\uB294 \uB2E4\uC74C \uD134\uBD80\uD130 \uC2DC\uC791\uD55C\uB2E4. \uD604\uC7AC \uC7A5\uC18C NPC\uB97C \uBAA9\uC801\uC9C0\uAE4C\uC9C0 \uC790\uB3D9 \uB3D9\uD589\uC2DC\uD0A4\uC9C0 \uC54A\uB294\uB2E4. entering_npc_ids\uAC00 \uBE44\uC5B4 \uC788\uC73C\uBA74 \uC774\uBC88 \uD134\uC5D0\uB294 \uB204\uAD6C\uB3C4 \uC0C8\uB85C \uB4F1\uC7A5\uD558\uC9C0 \uC54A\uB294\uB2E4. context_npc_ids\uB294 \uAD00\uACC4\xB7\uC9C1\uC804 \uB300\uD654\uB97C \uCC38\uACE0\uD558\uAE30 \uC704\uD55C \uBAA9\uB85D\uC77C \uBFD0\uC774\uBA70 \uADF8 \uBAA9\uB85D\uC5D0 \uC788\uB2E4\uB294 \uC774\uC720\uB85C \uD604\uC7A5\uC5D0\uC11C \uD589\uB3D9\uD558\uAC70\uB098 \uB9D0\uD560 \uC218 \uC5C6\uB2E4. \uC775\uBA85 \uC9C1\uC6D0\xB7\uD589\uC778\xB7\uAD70\uC911\uC740 \uBC30\uACBD \uC11C\uC220\uC5D0\uB9CC \uC2A4\uCE60 \uC218 \uC788\uACE0 \uC808\uB300 \uBC1C\uD654\uD558\uC9C0 \uC54A\uB294\uB2E4. [1. \uC11C\uC0AC \uBC0F \uD589\uB3D9]\uC758 \uCCAB \uC720\uD6A8 \uBE14\uB85D\uC740 \uBC18\uB4DC\uC2DC [SCENE]\uC774\uB2E4 \u2014 \uCCAB [SCENE]\uC5D0\uB294 \uCD5C\uC18C \uD55C \uBB38\uC7A5\uC758 \uAD00\uCC30 \uAC00\uB2A5\uD55C \uD604\uC7AC \uC7A5\uBA74 \uC11C\uC220\uC744 \uC4F0\uACE0 [DIALOGUE]\uB85C \uC2DC\uC791\uD558\uC9C0 \uC54A\uB294\uB2E4. \uBAA8\uB4E0 \uBC1C\uD654\uB294 [DIALOGUE] \uBE14\uB85D\uC73C\uB85C\uB9CC \uC4F4\uB2E4. \uB530\uC634\uD45C\uB9CC \uC788\uB294 \uB300\uC0AC, \uC774\uB984: \uB300\uC0AC, \uC11C\uC220\uBB38 \uC548\uC5D0 \uC11E\uC778 \uBC1C\uD654, \uC774\uB984\xB7\uC9C1\uAE09\xB7\uBCC4\uBA85\uB9CC \uD45C\uC2DC\uD55C \uB300\uC0AC\uB294 \uBAA8\uB450 \uAE08\uC9C0\uD55C\uB2E4. [DIALOGUE \uCD5C\uC18C \uD3EC\uD568] \uD604\uC7A5\uC5D0 \uBC1C\uD654 \uAC00\uB2A5\uD55C NPC\uAC00 \uB4F1\uC7A5\uD558\uACE0 \uB300\uD654\uAC00 \uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uC7A5\uBA74\uC774\uBA74 \uC11C\uC220\uB9CC\uC73C\uB85C \uB05D\uB0B4\uC9C0 \uB9D0\uACE0 [DIALOGUE] \uBE14\uB85D\uC744 \uCD5C\uC18C 1\uAC1C \uD3EC\uD568\uD55C\uB2E4. NPC\uAC00 \uC11C\uB85C \uD655\uC778\xB7\uB17C\uC758\uD558\uB294 \uC7A5\uBA74\uC774\uBA74 \uC2E4\uC81C \uB300\uC0AC\uAC00 \uBC18\uB4DC\uC2DC \uB4E4\uC5B4\uAC04\uB2E4. \uB300\uC0AC \uC5C6\uC774 \uD589\uB3D9 \uBB18\uC0AC\uB9CC \uB098\uC5F4\uD558\uC9C0 \uC54A\uB294\uB2E4.\uBC1C\uD654 \uD615\uC2DD\uC740 \uCCAB \uC904 `[DIALOGUE speaker_id="\uD5C8\uC6A9 ID" acting_direction="\uAD6C\uCCB4\uC801 \uC5F0\uAE30 \uC9C0\uC2DC"]`, \uB2E4\uC74C \uC904\uBD80\uD130 \uBCF8\uBB38\uC774\uB2E4. speaker_id\uC5D0\uB294 \uC774\uB984\uC774 \uC544\uB2C8\uB77C allowed_speaker_ids\uC758 ID\uB97C \uC4F4\uB2E4. acting_direction\uC5D0\uB294 \uD45C\uC815\xB7\uC2DC\uC120\xB7\uC190\uB3D9\uC791\xB7\uC790\uC138\xB7\uBAA9\uC18C\uB9AC\xB7\uD638\uD761\xB7\uC0C1\uB300\uB97C \uD5A5\uD55C \uD589\uB3D9\xB7\uBB3C\uAC74 \uC0C1\uD638\uC791\uC6A9 \uC911 \uD558\uB098 \uC774\uC0C1\uC758 \uAD6C\uCCB4\uC801 \uC815\uBCF4\uAC00 \uC788\uC5B4\uC57C \uD55C\uB2E4. `\uC790\uC5F0\uC2A4\uB7FD\uAC8C`, `\uD3C9\uBC94\uD558\uAC8C`, `\uC801\uB2F9\uD788`, `\uBCF4\uD1B5 \uB9D0\uD22C\uB85C`, `\uB300\uB2F5\uD558\uBA70`, `\uB9D0\uD558\uBA70`, `\uC9C4\uC9C0\uD558\uAC8C`, `\uCC28\uBD84\uD558\uAC8C`\uCC98\uB7FC \uCD94\uC0C1\uC801\uC778 \uB2E8\uC5B4\uB9CC \uC4F0\uC9C0 \uB9C8\uB77C. \uB2E8 `\uCC28\uBD84\uD55C \uBAA9\uC18C\uB9AC\uB85C \uC11C\uB958\uB97C \uC55E\uC73C\uB85C \uBC00\uBA70`\uCC98\uB7FC \uAD00\uCC30 \uAC00\uB2A5\uD55C \uD589\uB3D9\uC774 \uD568\uAED8 \uC788\uC73C\uBA74 \uD5C8\uC6A9\uD55C\uB2E4. \uD50C\uB808\uC774\uC5B4 \uBC1C\uD654\uB294 scene_cast_contract.player_dialogue \uC815\uCC45 \uBC94\uC704 \uC548\uC5D0\uC11C\uB9CC \uC0DD\uC131\uD55C\uB2E4. mode\uAC00 explicit\uC774\uBA74 source_text\uC758 \uC758\uBBF8\uB97C \uC720\uC9C0\uD574 \uB2E4\uB4EC\uACE0, paraphrase\uBA74 intent \uBC94\uC704 \uC548\uC5D0\uC11C\uB9CC \uB9D0\uD558\uBA70, minor_reaction\uC774\uBA74 max_lines\xB7max_characters\uB97C \uB118\uAE30\uC9C0 \uC54A\uB294 \uC9E7\uC740 \uBC18\uC751 \uD55C \uC904\uB9CC \uC4F4\uB2E4. \uC0AC\uC6A9\uC790 \uC785\uB825\uC5D0 \uADFC\uAC70\uAC00 \uC5C6\uB294 \uC0C8 \uBA85\uB839\xB7\uC694\uCCAD\xB7\uC218\uB77D\xB7\uAC70\uC808\xB7\uC57D\uC18D\xB7\uACE0\uBC31\xB7\uC131\uC801 \uC81C\uC548\xB7\uD611\uBC15\xB7\uC774\uB3D9 \uACB0\uC815\uC744 \uD50C\uB808\uC774\uC5B4\uAC00 \uB9D0\uD558\uAC8C \uD558\uC9C0 \uC54A\uB294\uB2E4. [DIALOGUE \uBCF8\uBB38 \uADDC\uCE59] [DIALOGUE] \uBCF8\uBB38\uC5D0\uB294 \uC2E4\uC81C \uBC1C\uD654\uB9CC \uD55C \uC904\uB85C \uC4F4\uB2E4. \uBC1C\uD654 \uBCF8\uBB38\uC744 \uD070\uB530\uC634\uD45C\uB85C \uAC10\uC2F8\uC9C0 \uC54A\uB294\uB2E4. \uD589\uB3D9\xB7\uD45C\uC815\xB7\uBD84\uC704\uAE30\xB7\uC0C1\uB300 \uBC18\uC751\uC740 \uBC18\uB4DC\uC2DC \uC0C8 [SCENE] \uB4A4\uC5D0 \uC4F4\uB2E4. \uB4F1\uB85D\uB418\uC5B4 \uC788\uACE0 \uC774\uBC88 \uC7A5\uBA74\uC5D0\uC11C \uBC1C\uD654\uAC00 \uD5C8\uC6A9\uB41C speaker_id\uB9CC \uC0AC\uC6A9\uD55C\uB2E4.[\uC11C\uC0AC \uBE44\uD2B8] \uB9E4 \uD134 \uCCAB \uBB38\uC7A5\uC740 \uBC18\uB4DC\uC2DC \uC774\uBC88 \uD50C\uB808\uC774\uC5B4 \uD589\uB3D9\uC758 \uACB0\uACFC \uB610\uB294 NPC\uC758 \uC989\uAC01\uC801\uC778 \uBC18\uC751\uC73C\uB85C \uC2DC\uC791\uD55C\uB2E4. \uC9C1\uC804 \uD134\uACFC \uC7A5\uC18C\xB7\uC2DC\uAC04\xB7\uC870\uBA85\xB7\uB0A0\uC528\uAC00 \uAC19\uC73C\uBA74 \uC774\uB97C \uB2E4\uC2DC \uC18C\uAC1C\uD558\uC9C0 \uC54A\uB294\uB2E4. \uD658\uACBD\uC740 \uC7A5\uC18C \uC774\uB3D9\xB7\uC758\uBBF8 \uC788\uB294 \uC2DC\uAC04 \uBCC0\uD654\xB7\uC0AC\uAC74 \uC601\uD5A5 \uB0A0\uC528\xB7\uC870\uBA85\xB7\uC0C8 \uC18C\uB9AC\xB7\uC778\uBB3C\xB7\uC0AC\uAC74 \uB54C\uB9CC \uC4F4\uB2E4. `\uD68C\uC758\uC2E4\uC5D0 \uD587\uC0B4\uC774 \uBE44\uCCE4\uB2E4`, `\uCC3D\uBC16 \uBE5B\uC774 \uD14C\uC774\uBE14 \uC704\uB85C \uB4E4\uC5B4\uC654\uB2E4`, `\uC11C\uB958\uB098 \uCEF5\uC5D0 \uBE5B\uC774 \uBC18\uC9DD\uC600\uB2E4` \uC7A5\uC2DD \uB3C4\uC785\uBD80 \uBC18\uBCF5 \uAE08\uC9C0. \uAC70\uB9AC\xB7\uC790\uC138\uB294 \uBC30\uACBD\uC73C\uB85C \uC7AC\uC18C\uAC1C\uD558\uC9C0 \uB9D0\uACE0 \uD589\uB3D9\xB7\uB300\uD654\xB7\uBC18\uC751 \uC548\uC5D0\uC11C\uB9CC \uD544\uC694\uD55C \uB9CC\uD07C \uBCF4\uC774\uBA70 \uC7A5\uBA74 \uC5F0\uC18D\uC131\uC740 \uC720\uC9C0\uD55C\uB2E4. \uC11C\uC0AC\uB294 \u2460\uACB0\uACFC\xB7\uBC18\uC751 \u2461NPC \uB9D0\xB7\uC989\uAC01 \uBC18\uC751 \u2462\uAD00\uACC4 \uB610\uB294 \uC131\uC801 \uAE34\uC7A5 \uBCC0\uD654 \u2463\uD50C\uB808\uC774\uC5B4 \uC0DD\uAC01 \u2464\uC120\uD0DD\uC9C0\uB2E4. \uC5C5\uBB34 \uC124\uBA85\uC774 \uC7A5\uBA74\uC744 \uC7A5\uC545\uD558\uC9C0 \uC54A\uAC8C. \uC131\uC801 \uAE34\uC7A5\uAC10\uC740 \uD604\uC7AC CSA\xB7\uC2E0\uCCB4 \uAC70\uB9AC\xB7\uC0AC\uC6A9\uC790 \uD589\uB3D9\uACFC \uAD00\uB828\uB420 \uB54C \uAC10\uAC01\uC744 \uAD6C\uCCB4\uC801\uC73C\uB85C \uBB18\uC0AC\uD558\uB418 `\uC5BC\uAD74\uC774 \uBD89\uC5B4\uC84C\uB2E4`, `\uB2F9\uD669\uD588\uB2E4`, `\uADDC\uC815\uC774\uB2C8\uAE4C \uB530\uB790\uB2E4`\uB9CC \uBC18\uBCF5\uD558\uC9C0 \uC54A\uB294\uB2E4.[\uC5C5\uBB34 \uC0AC\uC6A9\xB7\uC218\uC704] \uC5C5\uBB34\uB294 \uC131\uC801\xB7\uAD00\uACC4\uC801 \uAE34\uC7A5\uC744 \uB9CC\uB4DC\uB294 \uBC30\uACBD\uACFC \uD551\uACC4\uB85C\uB9CC \uC0AC\uC6A9\uD55C\uB2E4 \u2014 \uC11C\uB958\uB97C \uAC19\uC774 \uBCF4\uB824\uACE0 \uBAB8\uC774 \uAC00\uAE4C\uC6CC\uC9C0\uAC70\uB098, \uD68C\uC758\uC2E4 \uBB38\uBC16 \uBC1C\uC18C\uB9AC\uC5D0 \uC790\uC138\uB97C \uC758\uC2DD\uD558\uAC70\uB098, \uC790\uB8CC\uB97C \uAC00\uB9AC\uD0A4\uB294 \uC190\uC774 \uD50C\uB808\uC774\uC5B4\uC758 \uC190\uACFC \uAC00\uAE4C\uC6CC\uC9C0\uB294 \uC2DD\uC73C\uB85C. \uC608\uC0B0 \uC218\uCE58 \uBD84\uC11D\xB7\uACC4\uC57D\uC11C \uAC80\uD1A0\xB7\uAD11\uACE0\uBE44 \uC870\uC0AC\uCC98\uB7FC \uC5C5\uBB34 \uC124\uBA85 \uC790\uCCB4\uAC00 \uC11C\uC0AC\uB97C \uCC44\uC6B0\uC9C0 \uC54A\uB294\uB2E4. \uD50C\uB808\uC774\uC5B4\uAC00 \uC5C5\uBB34\uB97C \uC9C1\uC811 \uC9C0\uC2DC\uD558\uC9C0 \uC54A\uC558\uB2E4\uBA74 \uC5C5\uBB34 \uC124\uBA85\uC740 1~2\uBB38\uC7A5\uC73C\uB85C \uC81C\uD55C\uD55C\uB2E4. \uC0AC\uC6A9\uC790\uAC00 \uC9C0\uC2DC\uD558\uC9C0 \uC54A\uC740 \uC131\uD589\uC704\uB97C \uC790\uB3D9 \uC644\uB8CC\uD558\uC9C0 \uC54A\uB294\uB2E4 \u2014 CSA\uAC00 \uD5C8\uC6A9\uD55C \uD604\uC7AC \uD589\uB3D9, \uC774\uBBF8 \uD655\uC815\uB41C \uBB3C\uB9AC\uC801 \uC790\uC138, \uC0AC\uC6A9\uC790\uAC00 \uBA85\uC2DC\uD55C \uC811\uCD09\uC774\uB098 \uC9C8\uBB38 \uBC94\uC704 \uC548\uC5D0\uC11C\uB9CC \uBB18\uC0AC\uD55C\uB2E4.'
].join(" ");
function buildRegenerationFeedbackSection(feedbackText) {
  const text5 = typeof feedbackText === "string" ? feedbackText.trim() : "";
  if (!text5) return "";
  return `

[\uC0AC\uC6A9\uC790 \uD53C\uB4DC\uBC31 \u2014 \uC7AC\uC0DD\uC131 \uCD5C\uC6B0\uC120 \uC9C0\uC2DC]
\uC774\uBC88 \uD134\uC758 \uC774\uC804 \uBC84\uC804\uC740 \uB354 \uC774\uC0C1 \uC874\uC7AC\uD558\uC9C0 \uC54A\uB294\uB2E4. \uC544\uB798 \uD53C\uB4DC\uBC31\uC744 \uC774\uBC88 \uC7AC\uC0DD\uC131\uC5D0\uC11C \uCD5C\uC6B0\uC120\uC73C\uB85C \uBC18\uC601\uD574 \uC0C8\uB85C \uC791\uC131\uD55C\uB2E4.
${text5}`;
}
__name(buildRegenerationFeedbackSection, "buildRegenerationFeedbackSection");
function appendLateAuthoritativeCharacterCanon(messages) {
  if (!Array.isArray(messages)) return messages;
  const userMessage = messages.find((message) => message?.role === "user" && typeof message.content === "string");
  if (!userMessage) return messages;
  let payload;
  try {
    payload = JSON.parse(userMessage.content);
  } catch {
    return messages;
  }
  const canon = object3(payload?.active_character_canon) ?? {};
  const generalCanon = object3(payload?.active_general_npc_canon) ?? {};
  const context = object3(payload?.context) ?? {};
  if (!Object.keys(canon).length && !Object.keys(generalCanon).length) return messages;
  const addressingState = object3(context?.npc_relationship_state) ?? {};
  const section = [
    "[\uCD5C\uC885 \uAD8C\uC704 \uCE90\uB9AD\uD130 \uCE90\uB17C \u2014 \uC774 \uBA54\uC2DC\uC9C0\uAC00 \uC55E\uC120 \uBAA8\uB4E0 \uCE90\uB9AD\uD130 \uBB18\uC0AC\uBCF4\uB2E4 \uC6B0\uC120\uD55C\uB2E4]",
    JSON.stringify({ registered_characters: canon, active_general_npcs: generalCanon }),
    "[\uD638\uCE6D \uACC4\uC57D]",
    "1) \uAC01 \uCE90\uB9AD\uD130\uC758 prompt_card.addressing\uACFC \uD604\uC7AC \uD68C\uC0AC \uC9C1\uAE09\xB7\uAD00\uACC4\uB97C \uAE30\uBCF8\uAC12\uC73C\uB85C \uC0AC\uC6A9\uD55C\uB2E4.",
    "2) \uC77C\uBC18 NPC\uB294 active_general_npc_canon\uC758 role\uACFC department_id\uB97C \uAE30\uC900\uC73C\uB85C \uC5C5\uBB34 \uD638\uCE6D\uC744 \uC0AC\uC6A9\uD55C\uB2E4.",
    "3) \uD50C\uB808\uC774\uC5B4\uAC00 \uC774\uBC88 \uC785\uB825\uC5D0\uC11C \uD2B9\uC815 \uD638\uCE6D\uC744 \uC694\uCCAD\uD574 NPC\uAC00 \uC218\uC6A9\uD558\uB354\uB77C\uB3C4 \uADF8 \uD6A8\uB825\uC740 \uD604\uC7AC \uC7A5\uBA74\uC5D0 \uD55C\uC815\uD55C\uB2E4.",
    "4) \uC774\uD6C4 \uD134\uC5D0\uB3C4 \uC9C0\uC18D\uB418\uB294 \uD638\uCE6D\uC73C\uB85C \uCDE8\uAE09\uD558\uB824\uBA74 \uC800\uC7A5\uB41C npc_relationship_state \uB610\uB294 \uCE90\uB9AD\uD130 canon\uC5D0 \uADF8 \uBCC0\uD654\uAC00 \uBA85\uC2DC\uB418\uC5B4 \uC788\uC5B4\uC57C \uD55C\uB2E4.",
    "5) \uC5C5\uBB34\uC0C1 \uC9C1\uAE09 \uD638\uCE6D\uACFC \uC0AC\uC801 \uCE5C\uBC00 \uD638\uCE6D\uC744 \uD63C\uB3D9\uD558\uC9C0 \uC54A\uACE0, \uC77C\uD68C\uC131 \uB18D\uB2F4\xB7CSA \uC218\uC6A9\xB7\uC131\uC801 \uBC18\uC751\uB9CC\uC73C\uB85C \uC601\uAD6C \uD638\uCE6D\uC744 \uB9CC\uB4E4\uC9C0 \uC54A\uB294\uB2E4.",
    `\uD604\uC7AC \uC800\uC7A5\uB41C \uAD00\uACC4 \uC0C1\uD0DC: ${JSON.stringify(addressingState)}`
  ].join("\n");
  return [...messages, { role: "system", content: section }];
}
__name(appendLateAuthoritativeCharacterCanon, "appendLateAuthoritativeCharacterCanon");
function buildStoryPrompt({ edition: edition2, context, playerAction, expectedTurn, npcIds, catalogs, sceneCastContract = null }) {
  const charactersMap = object3(edition2?.characters?.characters) ?? {};
  const save = object3(context?.save?.data) ?? object3(context?.save) ?? {};
  const selectedHeroineIds = selectActiveCharacterIds({ charactersMap, npcIds, save, playerAction });
  const movementTargetId = resolveMovementCharacterTarget(charactersMap, playerAction);
  const heroineActiveIds = movementTargetId ? [movementTargetId, ...selectedHeroineIds.filter((id) => id !== movementTargetId)] : selectedHeroineIds;
  const generalActiveIds = selectActiveGeneralNpcIds({ edition: edition2, save, text: playerAction });
  const activeIds = [...heroineActiveIds, ...generalActiveIds.filter((id) => !heroineActiveIds.includes(id))];
  return [
    { role: "system", content: SYSTEM_INSTRUCTIONS },
    {
      role: "user",
      content: JSON.stringify({
        edition: edition2.editionId,
        ...sceneCastContract ? { scene_cast_contract: sceneCastContract } : {},
        active_character_canon: buildActiveCharacterCanon(charactersMap, heroineActiveIds),
        active_general_npc_canon: buildGeneralNpcCanon(edition2, generalActiveIds),
        context: buildStoryContextProjection(context, activeIds, { catalogs, playerAction, edition: edition2 }),
        player_action: playerAction,
        expected_turn: expectedTurn
      })
    }
  ];
}
__name(buildStoryPrompt, "buildStoryPrompt");

// src/engine/extract-prompt.js
function object4(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
__name(object4, "object");
function text(value, maxLength = 420) {
  if (typeof value !== "string") return "";
  return Array.from(value.trim()).slice(0, maxLength).join("");
}
__name(text, "text");
function buildRegisteredCharacters(edition2) {
  const charactersMap = object4(edition2?.characters?.characters);
  if (!charactersMap) return [];
  return Object.entries(charactersMap).filter(([, character]) => object4(character) && typeof character.name === "string").map(([character_id, character]) => ({ character_id, name: character.name }));
}
__name(buildRegisteredCharacters, "buildRegisteredCharacters");
function buildExtractCharacterCanon(charactersMap, activeIds) {
  const map = object4(charactersMap) ?? {};
  const result = {};
  for (const id of Array.isArray(activeIds) ? activeIds.slice(0, 4) : []) {
    const character = object4(map[id]);
    if (!character) continue;
    const card = object4(character.prompt_card) ?? {};
    result[id] = {
      name: text(character.name, 60),
      position: text(character.position, 60),
      role_title: text(character.role_title, 100),
      identity: text(card.identity),
      personality: text(card.personality),
      speech: text(card.speech),
      addressing: text(card.addressing),
      distinctive_traits: Array.isArray(card.distinctive_traits) ? card.distinctive_traits.filter((item) => typeof item === "string" && item.trim()).slice(0, 5) : [],
      csa_style: text(card.csa_style)
    };
  }
  return result;
}
__name(buildExtractCharacterCanon, "buildExtractCharacterCanon");
function buildParsedStoryProjection(parsedStory) {
  const p = object4(parsedStory) ?? {};
  return {
    player_inner_thought: typeof p.player_inner_thought === "string" ? p.player_inner_thought : "",
    player_status: typeof p.player_status === "string" ? p.player_status : "",
    choices: Array.isArray(p.choices) ? p.choices.filter((item) => typeof item === "string") : [],
    dialogue_lines: Array.isArray(p.dialogue_lines) ? p.dialogue_lines : [],
    warnings: Array.isArray(p.warnings) ? p.warnings : []
  };
}
__name(buildParsedStoryProjection, "buildParsedStoryProjection");
function buildStructuredStoryV2ExtractText(parsedStory) {
  const blocks = Array.isArray(parsedStory?.blocks) ? parsedStory.blocks : [];
  const parts = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    if (block.type === "scene" && typeof block.text === "string") {
      const text5 = block.text.trim();
      if (text5) parts.push(text5);
      continue;
    }
    if (block.type === "dialogue") {
      const name = typeof block.speaker_name === "string" ? block.speaker_name.trim() : "";
      const direction = typeof block.acting_direction === "string" ? block.acting_direction.trim() : typeof block.direction === "string" ? block.direction.trim() : "";
      const text5 = typeof block.text === "string" ? block.text.trim() : "";
      if (!name || !text5) continue;
      parts.push(direction ? `${name} (${direction}): \u201C${text5}\u201D` : `${name}: \u201C${text5}\u201D`);
      continue;
    }
  }
  const inner = typeof parsedStory?.player_inner_thought === "string" && parsedStory.player_inner_thought ? parsedStory.player_inner_thought.trim() : "";
  const status = typeof parsedStory?.player_status === "string" && parsedStory.player_status ? parsedStory.player_status.trim() : "";
  if (inner) parts.push(`[2. \uD50C\uB808\uC774\uC5B4 \uC18D\uB9C8\uC74C]
${inner}`);
  if (status) parts.push(`[3. \uD50C\uB808\uC774\uC5B4 \uC0C1\uD669\uD310]
${status}`);
  if (Array.isArray(parsedStory?.choices) && parsedStory.choices.length) {
    parts.push("[4. \uC120\uD0DD\uC9C0]\n" + parsedStory.choices.map((c, i) => `${i + 1}. ${c}`).join("\n"));
  }
  return parts.join("\n\n");
}
__name(buildStructuredStoryV2ExtractText, "buildStructuredStoryV2ExtractText");
function buildExtractContextProjection(context, activeIds) {
  const save = object4(context?.save?.data) ?? object4(context?.save) ?? {};
  return buildSceneContextCore(save, activeIds);
}
__name(buildExtractContextProjection, "buildExtractContextProjection");
var SYSTEM_INSTRUCTIONS2 = [
  "Return one JSON object only; no prose or Markdown.",
  "Include exactly: state_delta (object),outcome,evidence (object),turn_summary,mind_monitor,choices,dialogue_lines,npcs_present,action_target_id,focal_character_id,last_speaker_id,image_character_id,player_inner_thought,player_status,elapsed_minutes,warnings; with active CSA also csa_trigger_evaluations,csa_runtime_updates.",
  "state_delta contains changed values only. outcome=success|partial|refused|interrupted|blocked. Ground every state, numeric, relationship, clothing, posture, position, and event proposal in exact Story evidence; never invent changes.",
  "Identity fields are independent; never copy one into another. registered_characters lists the only stable character ids; registered_general_npcs lists the only stable general-NPC ids. never invent, guess, or reuse an id. narrator/unknown=null. A nearby/default/eligible NPC is not present unless Story explicitly shows their entrance, presence, action, or dialogue. List every present NPC.",
  "Story choices are always authoritative: with four parsed choices return choices:[]. Parsed player_inner_thought/player_status are authoritative; Extract can never override them. dialogue_lines may only add missing speaker_id to the same order/text. Spoken lines use `\uB4F1\uB85D \uC774\uB984 (\uC9E7\uACE0 \uAD6C\uCCB4\uC801\uC778 \uC5F0\uAE30\uD1A4): \uB300\uC0AC`; preserve text/direction. The Story below is already normalized: EVERY spoken line carries an explicit speaker name inserted by the pipeline. dialogue_lines must include every spoken line and copy the stated speaker name exactly \u2014 do not infer, reassign, or drop any line. An unlabeled line is UNASSIGNED \u2014 skip it.",
  `mind_monitor only {"npc-id":{"surface":"...","subconscious":"..."}} for present NPCs. For Mind Monitor interpretation, use Story, active canon, and saved state; it may not invent a new event, memory, agreement, contact, or fact. surface=conscious judgment, subconscious=distinct unadmitted conflict. Write both as the NPC's own casual spoken inner monologue (short, sighing, exclamatory, elliptical self-talk) \u2014 never narration, labels, system terms, physical_reaction, other body/action fields, or player thoughts. Each of surface and subconscious must be a substantial monologue of at least 100 Korean characters; never one-line summaries.`,
  "CSA authority: weak=\uC778\uC0AC\uD300 \uACF5\uC2DD \uACF5\uC9C0\xB7\uC0AC\uB0B4 \uC6B4\uC601\uC9C0\uCE68, medium=\uCDE8\uC5C5\uADDC\uCE59\xB7\uC804\uC0AC \uC900\uC218 \uADDC\uC815, strong=\uAD6D\uAC00 \uBC95\uB839\xB7\uAD00\uACC4 \uB2F9\uAD6D \uC758\uBB34 \uC9C0\uCE68. Higher authority raises compliance pressure/self-rationalization, not affection, private submission, or sexual consent. Preserve evidenced discomfort, questions, embarrassment, scope objections, and personality resistance.",
  "npc_stats only affinity(-5..5), csa_acceptance(-20..30), sexual_arousal(-20..15) for present NPC IDs, each with exact-evidence reason. resistance is a fixed per-NPC value and is NEVER included in npc_stats; it never changes. Announcement, compliance, embarrassment, arousal, or body reaction alone never raises affinity; announcement alone never changes csa_acceptance. On the first turn after the opening, set each present NPC affinity to 1~20 based on the player profile and the first-impression scene (reserved/guarded characters get 1~8, neutral 8~14, warm 14~20). Omit unchanged axes.",
  "elapsed_minutes is your only time proposal: 1-30 normally; <=480 only when evidence.time_advance=true. Never compute Day/absolute time.",
  "CSA deltas only state_delta.csa_runtime_state[csa_id]{lifecycle,applicability,execution_state} and csa_attitudes[npc_id][csa_id].",
  "player_sexual_state uses only arousal_delta, ejaculation_progress_delta, and ejaculation_completed; completion requires evidence.sexual_resolution === true.",
  "Physical patches may set concise Korean location_label, posture, position_label, and arbitrary Korean clothing keys/state strings only from exact Story evidence; clothing values are worn|removed|open|unknown, CSA rule text alone or magical wording (\uC800\uC808\uB85C/\uC21C\uC2DD\uAC04\uC5D0) is rejected, and evidence quotes must be verbatim in Story and name the character. Omit unchanged or uncertain fields; legacy English codes are compatibility input, not an output catalog.",
  "npc_stats and sexual_event_ledger each need an exact Story quote. Distinguish attempt, refusal, partial, conditional acceptance, pause, completion. Human-readable strings are Korean; IDs unchanged.",
  "Movement transition contract: scene_cast_contract.transition_mode=movement\uC77C \uB54C \uC774\uBC88 \uD134\uC740 \uC7A5\uC18C \uC774\uB3D9 \uC644\uB8CC \uD134\uC774\uB2E4. destination_location_id\uAC00 \uC874\uC7AC\uD558\uACE0 Story\uAC00 \uBAA9\uC801\uC9C0 \uB3C4\uCC29(\uBC1C\uACAC\xB7\uB9C8\uC8FC\uCE68 \uC11C\uC220)\uAE4C\uC9C0 \uC644\uB8CC\uD588\uB2E4\uBA74 state_delta.scene_state.location_id\uB294 destination_location_id\uB85C, scene_state.participants\uB294 player\uC640 Story\uC5D0\uC11C \uC2E4\uC81C\uB85C \uBC1C\uACAC\uB41C destination NPC\uB9CC \uAE30\uB85D\uD55C\uB2E4. \uAE30\uC874 \uC7A5\uC18C NPC\uB97C participants\uC5D0 \uC720\uC9C0\uD558\uC9C0 \uC54A\uB294\uB2E4. npcs_present\uC640 last_npcs_present\uB3C4 destination NPC\uB85C \uAC31\uC2E0\uD558\uACE0 focal_character_id\uB294 destination NPC\uB85C \uC62E\uAE34\uB2E4. Story\uAC00 \uBAA9\uC801\uC9C0 \uB3C4\uCC29 \uC804\uC5D0 \uC911\uB2E8\uB410\uB2E4\uBA74(\uC774\uB3D9 \uB3C4\uC911 \uC911\uB2E8) destination NPC\uB97C participants\uC5D0 \uB123\uC9C0 \uC54A\uB294\uB2E4."
].join(" ");
function buildExtractPrompt({ context, storyText, parsedStory, playerAction, expectedTurn, edition: edition2, npcIds, sceneCastContract }) {
  const charactersMap = object4(edition2?.characters?.characters) ?? {};
  const save = object4(context?.save?.data) ?? object4(context?.save) ?? {};
  const heroineActiveIds = selectActiveCharacterIds({ charactersMap, npcIds, save, playerAction });
  const generalActiveIds = selectActiveGeneralNpcIds({ edition: edition2, save, text: storyText });
  const activeIds = [...heroineActiveIds, ...generalActiveIds.filter((id) => !heroineActiveIds.includes(id))];
  const cast = object4(sceneCastContract) ?? {};
  const movementContract = cast.transition_mode === "movement" ? {
    transition_mode: "movement",
    destination_npc_ids: Array.isArray(cast.destination_npc_ids) ? cast.destination_npc_ids : [],
    destination_location_id: typeof cast.destination_location_id === "string" ? cast.destination_location_id : null
  } : null;
  return [
    { role: "system", content: SYSTEM_INSTRUCTIONS2 },
    {
      role: "user",
      content: JSON.stringify({
        registered_characters: buildRegisteredCharacters(edition2),
        registered_general_npcs: buildRegisteredGeneralNpcs(edition2),
        active_character_canon: buildExtractCharacterCanon(charactersMap, heroineActiveIds),
        active_general_npc_canon: buildGeneralNpcCanon(edition2, generalActiveIds),
        story_text: storyText,
        parsed_story: buildParsedStoryProjection(parsedStory),
        ...movementContract ? { scene_cast_contract: movementContract } : {},
        context: buildExtractContextProjection(context, activeIds),
        player_action: playerAction,
        expected_turn: expectedTurn
      })
    }
  ];
}
__name(buildExtractPrompt, "buildExtractPrompt");

// src/engine/narrative-parser.js
var SECTION_LABELS = {
  SCENE: "scene",
  "1": "scene",
  PLAYER_INNER_THOUGHT: "thought",
  "2": "thought",
  PLAYER_STATUS: "status",
  "3": "status",
  CHOICES: "choices",
  "4": "choices"
};
var MARKER = /\[(SCENE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*플레이어\s*상황판|4\.\s*선택지|DIALOGUE\s+[^\[\]]*)\]/g;
var SECTION_LINE = /^\[(SCENE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*플레이어\s*상황판|4\.\s*선택지)\]$/;
var QUOTED_INLINE_DIALOGUE = /([\p{L}][^\n():"“”]{0,40}?)\s*\(([^()\n]{0,160})\)\s*[:：]\s*["“]([^"”]*)["”]/gsu;
var DIALOGUE_LINE = /^([\p{L}][^\n():："“”]{0,40}?)\s*\(([^()\n]{1,160})\)\s*[:：]?\s*(?:["“]([^"”]*)["”]|(.+))$/u;
var REGISTERED_SPEAKER_LINE = /^([^\n:："“”]{1,40}?)\s*[:：]\s*(?:["“]([^"”]*)["”]|(.+))$/u;
var QUOTE_ONLY_LINE = /^["“]([^"”]+)["”]$/u;
function splitQuotedParts(line) {
  const parts = [];
  const re = /["“]([^"”]*)["”]/g;
  let last = 0, m;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push({ quoted: false, text: line.slice(last, m.index) });
    parts.push({ quoted: true, text: m[1] });
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push({ quoted: false, text: line.slice(last) });
  return parts;
}
__name(splitQuotedParts, "splitQuotedParts");
var CHOICE_LABEL = /^\[([^\[\]\r\n]{2,6})\]\s*(.+)$/u;
var PLAYER_LABEL = "\uD50C\uB808\uC774\uC5B4";
function speechAttributionSubject(value, speakers) {
  const line = String(value ?? "");
  const re = /([\p{L}]{1,6})\s*(?:이|가)\s*[^\n。.!?]{0,14}?\s*(?:말했|물었|입을 열었|대꾸했|외쳤|중얼거렸|속삭였|되물었|덧붙였|대답했|반문했|설명했|인사하며|고개를 끄덕이며|목소리를 내|숨을 고르며)/u;
  const m = re.exec(line);
  if (!m) return null;
  const name = m[1].trim();
  return (speakers ?? []).find((s) => s.name === name || shortAlias(s.name) === name) ?? null;
}
__name(speechAttributionSubject, "speechAttributionSubject");
function namesAddressIn(text5, speakers) {
  const value = String(text5 ?? "");
  return (speakers ?? []).some((entry) => {
    const full = entry.name;
    const alias = shortAlias(entry.name);
    const names = [full, alias].filter(Boolean).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!names.length) return false;
    const pattern = `(${names.join("|")})\\s*\uC528\\s*[,\uFF0C.!?\u2026]`;
    return new RegExp(pattern).test(value) || new RegExp(`^(${names.join("|")})\\s*\uC528\\b`).test(value);
  });
}
__name(namesAddressIn, "namesAddressIn");
function lastMentionedSpeakerExcluding(value, speakers, previous, excludedName) {
  const line = String(value ?? "");
  const filtered = (speakers ?? []).filter((s) => s.name !== excludedName);
  let result = previous;
  let bestIndex = -1;
  for (const s of filtered) {
    const i = line.lastIndexOf(s.name);
    if (i > bestIndex) {
      result = s;
      bestIndex = i;
    }
    const alias = shortAlias(s.name);
    if (alias) {
      const ai = line.lastIndexOf(alias);
      if (ai > bestIndex) {
        result = s;
        bestIndex = ai;
      }
    }
  }
  return result;
}
__name(lastMentionedSpeakerExcluding, "lastMentionedSpeakerExcluding");
function resolveUnlabeledSpeaker({ ctxLine, text: text5, speakers, recentSpeaker, lastDialogueSpeaker }) {
  const mentioned = lastMentionedSpeaker(ctxLine, speakers, recentSpeaker);
  const attrSubject = speechAttributionSubject(ctxLine, speakers);
  const baseMentioned = attrSubject ?? mentioned;
  let speaker = null;
  if (baseMentioned && /(감사님|임원님|금 감사님)/.test(text5)) speaker = baseMentioned;
  else if (/팀장님/.test(text5)) {
    const nonLeader = lastMentionedSpeakerExcluding(ctxLine, speakers, recentSpeaker, "\uC11C\uC6D0\uD76C");
    speaker = nonLeader ?? null;
  } else if (namesAddressIn(text5, speakers)) speaker = { id: "player", name: PLAYER_LABEL };
  else if (mentioned && /(저희가|저희는|저희 팀|저희도|저희 브랜드|저희 캠페인)/.test(text5)) speaker = mentioned;
  else if (attrSubject && !(lastDialogueSpeaker && (attrSubject.name === lastDialogueSpeaker.name || attrSubject.id === lastDialogueSpeaker.id))) speaker = attrSubject;
  else if (mentioned && isSpeechAttribution(ctxLine, mentioned) && !(lastDialogueSpeaker?.name === mentioned.name)) speaker = mentioned;
  else if (mentioned && (!lastDialogueSpeaker || mentioned.name !== lastDialogueSpeaker.name) && new RegExp(`${mentioned.name}s*(?:\uC774|\uAC00|\uC740|\uB294)`).test(ctxLine)) speaker = mentioned;
  return speaker;
}
__name(resolveUnlabeledSpeaker, "resolveUnlabeledSpeaker");
function isQuotationText(line, quoteStart) {
  const before = line.slice(0, quoteStart);
  const after = line.slice(quoteStart);
  if (/(제목|문구|슬로건|규정|메일|이메일|채팅|메시지|인용|표지|문서|규칙|방침|공지|글|포스트|알림)\s*(?:은|는|이|가)?\s*(?:에는)?\s*$/u.test(before)) return true;
  if (/(이라는|라고 적혀|라고 쓰여|라고 표시|이라고 적혀|이라고 쓰여|라는 문구|라고 명시|라고 써 있)/u.test(after)) return true;
  return false;
}
__name(isQuotationText, "isQuotationText");
function isSpeechAttribution(line, mentioned) {
  if (!line || !mentioned) return false;
  return /(말했|말하며|말하고|말했다|말을 꺼냈|말을 이었|말을 건넸|물었|물어보|대답했|대꾸했|속삭였|외쳤|중얼거렸|되물었|덧붙였|맞장구|입을 열|입을 뗐|인사하며|인사했다|인사를 건넸|소개했다|사과했다|부탁했다|설명했다|알렸|통보했|대답하며|이어 말|웃으며 말|한숨|넘겨받아 말)/.test(line);
}
__name(isSpeechAttribution, "isSpeechAttribution");
function labelRole(label) {
  if (SECTION_LABELS[label]) return SECTION_LABELS[label];
  const numberMatch = /^(\d)\./.exec(label);
  if (numberMatch && SECTION_LABELS[numberMatch[1]]) return SECTION_LABELS[numberMatch[1]];
  return null;
}
__name(labelRole, "labelRole");
function parseChoices(text5) {
  const choices2 = [];
  const choiceLabels = [];
  for (const line of text5.split(/\r?\n/)) {
    const numbered = /^\d+\.\s+(.+)$/.exec(line.trim())?.[1]?.trim();
    if (!numbered) continue;
    const labeled = CHOICE_LABEL.exec(numbered);
    if (labeled) {
      choiceLabels.push(labeled[1].trim());
      choices2.push(labeled[2].trim());
    } else {
      choiceLabels.push("");
      choices2.push(numbered);
    }
  }
  return { choices: choices2, choice_labels: choiceLabels };
}
__name(parseChoices, "parseChoices");
function masterCharacters(master) {
  return [
    ...Array.isArray(master?.characters) ? master.characters : [],
    ...Array.isArray(master?.general_npcs) ? master.general_npcs : []
  ];
}
__name(masterCharacters, "masterCharacters");
function registeredSpeakers(master) {
  return masterCharacters(master).map((character) => ({
    id: character?.character_id ?? character?.npc_id ?? character?.id ?? null,
    name: typeof character?.name === "string" ? character.name.trim() : ""
  })).filter((character) => character.id && character.name);
}
__name(registeredSpeakers, "registeredSpeakers");
function shortAlias(name) {
  const characters = Array.from(String(name ?? "").trim());
  if (characters.length !== 3 || !characters.every((character) => /[가-힣]/u.test(character))) return "";
  return characters.slice(1).join("");
}
__name(shortAlias, "shortAlias");
function resolveRegisteredSpeaker(name, master) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed) return null;
  const speakers = registeredSpeakers(master);
  const exact = speakers.filter((character) => character.name === trimmed);
  if (exact.length === 1) return exact[0];
  const alias = shortAlias(trimmed) || trimmed;
  const aliasMatches = speakers.filter((character) => shortAlias(character.name) === alias);
  return aliasMatches.length === 1 ? aliasMatches[0] : null;
}
__name(resolveRegisteredSpeaker, "resolveRegisteredSpeaker");
function resolveSpeakerId(name, master) {
  return resolveRegisteredSpeaker(name, master)?.id ?? null;
}
__name(resolveSpeakerId, "resolveSpeakerId");
function lastMentionedSpeaker(line, speakers, previous = null) {
  const value = String(line ?? "");
  let selected = previous;
  let selectedIndex = -1;
  const aliasOwners = /* @__PURE__ */ new Map();
  for (const speaker of speakers) {
    const alias = shortAlias(speaker.name);
    if (!alias) continue;
    const owners = aliasOwners.get(alias) ?? [];
    owners.push(speaker);
    aliasOwners.set(alias, owners);
  }
  for (const speaker of speakers) {
    const exactIndex = value.lastIndexOf(speaker.name);
    if (exactIndex > selectedIndex) {
      selected = speaker;
      selectedIndex = exactIndex;
    }
    const alias = shortAlias(speaker.name);
    if (!alias || aliasOwners.get(alias)?.length !== 1) continue;
    const aliasIndex = value.lastIndexOf(alias);
    if (aliasIndex > selectedIndex) {
      selected = speaker;
      selectedIndex = aliasIndex;
    }
  }
  return selected;
}
__name(lastMentionedSpeaker, "lastMentionedSpeaker");
function isInternalQuotedThought(value) {
  const text5 = String(value ?? "").trim();
  return /^\([^)]*\)$/.test(text5);
}
__name(isInternalQuotedThought, "isInternalQuotedThought");
function normalizeQuoteOnlyDialogue(rawText, { master } = {}) {
  const source = String(rawText ?? "");
  const speakers = registeredSpeakers(master);
  if (!source || !speakers.length) return source;
  let role = null;
  let recentSpeaker = null;
  let lastDialogueSpeaker = null;
  const output = [];
  let lastLine = "";
  for (const rawLine of source.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const section = SECTION_LINE.exec(trimmed);
    if (section) {
      role = labelRole(section[1]);
      recentSpeaker = null;
      lastLine = "";
      output.push(rawLine);
      continue;
    }
    if (role !== "scene") {
      output.push(rawLine);
      continue;
    }
    const canonical = DIALOGUE_LINE.exec(trimmed);
    if (canonical) {
      const resolved = resolveRegisteredSpeaker(canonical[1], master);
      if (resolved) recentSpeaker = resolved;
      output.push(rawLine);
      continue;
    }
    const named = REGISTERED_SPEAKER_LINE.exec(trimmed);
    if (named) {
      const resolved = resolveRegisteredSpeaker(named[1], master);
      if (resolved) recentSpeaker = resolved;
      output.push(rawLine);
      continue;
    }
    const quote = QUOTE_ONLY_LINE.exec(trimmed);
    if (quote && !isInternalQuotedThought(quote[1])) {
      const text5 = quote[1];
      const speaker = resolveUnlabeledSpeaker({
        ctxLine: lastLine,
        text: text5,
        speakers,
        recentSpeaker,
        lastDialogueSpeaker
      });
      const indent = rawLine.slice(0, rawLine.indexOf(trimmed));
      if (speaker) {
        recentSpeaker = speaker;
        lastDialogueSpeaker = speaker;
        output.push(`${indent}${speaker.name} (\uC790\uC5F0\uC2A4\uB7FD\uAC8C): \u201C${text5.trim()}\u201D`);
      } else {
        output.push(rawLine);
      }
      continue;
    }
    const parts = splitQuotedParts(rawLine);
    if (parts.length > 1) {
      let speechCount = 0;
      let partOffset = 0;
      for (const part of parts) {
        if (part.quoted && part.text.trim() && !isInternalQuotedThought(part.text) && !isQuotationText(rawLine, partOffset)) speechCount += 1;
        partOffset += part.text.length + (part.quoted ? 2 : 0);
      }
      if (speechCount === 0) {
        recentSpeaker = lastMentionedSpeaker(rawLine, speakers, recentSpeaker);
        output.push(rawLine);
        lastLine = rawLine;
        continue;
      }
      let ctxLine = lastLine;
      partOffset = 0;
      for (const part of parts) {
        if (part.quoted && part.text.trim() && !isInternalQuotedThought(part.text) && !isQuotationText(rawLine, partOffset)) {
          const text5 = part.text;
          const speaker = resolveUnlabeledSpeaker({
            ctxLine,
            text: text5,
            speakers,
            recentSpeaker,
            lastDialogueSpeaker
          });
          if (speaker) {
            recentSpeaker = speaker;
            lastDialogueSpeaker = speaker;
            output.push(`${speaker.name} (\uC790\uC5F0\uC2A4\uB7FD\uAC8C): \u201C${text5.trim()}\u201D`);
          } else {
            output.push(`\u201C${text5.trim()}\u201D`);
          }
        } else if (part.quoted) {
          output.push(`\u201C${part.text}\u201D`);
        } else if (part.text.trim()) {
          recentSpeaker = lastMentionedSpeaker(part.text, speakers, recentSpeaker);
          output.push(part.text);
          ctxLine = part.text;
        }
        partOffset += part.text.length + (part.quoted ? 2 : 0);
      }
      continue;
    }
    recentSpeaker = lastMentionedSpeaker(rawLine, speakers, recentSpeaker);
    output.push(rawLine);
    lastLine = rawLine;
  }
  return output.join("\n");
}
__name(normalizeQuoteOnlyDialogue, "normalizeQuoteOnlyDialogue");
function normalizedDialogue({ speakerName, direction, dialogueText }, master, order) {
  const suppliedName = typeof speakerName === "string" ? speakerName.trim() : "";
  const resolved = resolveRegisteredSpeaker(suppliedName, master);
  const name = resolved?.name ?? suppliedName;
  const isPlayerLabel = suppliedName === PLAYER_LABEL;
  const acting = typeof direction === "string" ? direction.trim() : "";
  const text5 = typeof dialogueText === "string" ? dialogueText.trim().replace(/^["“”']+|["“”']+$/g, "").trim() : "";
  if (!name || !acting || !text5) return null;
  return {
    speaker_id: isPlayerLabel ? "player" : resolved?.id ?? null,
    speaker_name: name,
    direction: acting,
    text: text5,
    order
  };
}
__name(normalizedDialogue, "normalizedDialogue");
function parseDialogueLine(rawLine, master, order) {
  const line = typeof rawLine === "string" ? rawLine.trim() : "";
  if (!line) return null;
  const canonical = DIALOGUE_LINE.exec(line);
  if (canonical) {
    return normalizedDialogue({
      speakerName: canonical[1],
      direction: canonical[2],
      dialogueText: canonical[3] ?? canonical[4]
    }, master, order);
  }
  const fallback = REGISTERED_SPEAKER_LINE.exec(line);
  if (!fallback) return null;
  const speakerName = fallback[1].trim();
  if (!resolveSpeakerId(speakerName, master)) return null;
  return normalizedDialogue({
    speakerName,
    direction: "\uC790\uC5F0\uC2A4\uB7FD\uAC8C",
    dialogueText: fallback[2] ?? fallback[3]
  }, master, order);
}
__name(parseDialogueLine, "parseDialogueLine");
function appendSceneBlocks(blocks, dialogueLines, sceneText, master, orderRef) {
  const narrativeLines = [];
  const signatures = /* @__PURE__ */ new Set();
  const speakers = registeredSpeakers(master);
  let recentSpeaker = null;
  let lastDialogueSpeaker = null;
  let lastLine = "";
  const flushNarrative = /* @__PURE__ */ __name(() => {
    const value = narrativeLines.join("\n").trim();
    narrativeLines.length = 0;
    if (value) blocks.push({ type: "scene", text: value });
  }, "flushNarrative");
  const appendLine = /* @__PURE__ */ __name((line) => {
    const signature = `${line.speaker_name}
${line.direction}
${line.text}`;
    if (signatures.has(signature)) return;
    signatures.add(signature);
    dialogueLines.push(line);
    blocks.push({
      type: "dialogue",
      speaker_id: line.speaker_id,
      speaker: line.speaker_name,
      speaker_name: line.speaker_name,
      direction: line.direction,
      text: line.text
    });
  }, "appendLine");
  const pushDialogue = /* @__PURE__ */ __name((speaker, text5) => {
    flushNarrative();
    const line = {
      speaker_id: speaker?.id ?? null,
      speaker_name: speaker?.name ?? "",
      direction: "\uC790\uC5F0\uC2A4\uB7FD\uAC8C",
      text: text5.trim(),
      order: orderRef.value
    };
    orderRef.value += 1;
    if (speaker) {
      recentSpeaker = speaker;
      lastDialogueSpeaker = speaker;
    }
    appendLine(line);
  }, "pushDialogue");
  for (const rawLine of sceneText.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const dialogue = parseDialogueLine(rawLine, master, orderRef.value);
    if (dialogue) {
      flushNarrative();
      orderRef.value += 1;
      appendLine(dialogue);
      recentSpeaker = { id: dialogue.speaker_id, name: dialogue.speaker_name };
      lastDialogueSpeaker = { id: dialogue.speaker_id, name: dialogue.speaker_name };
      continue;
    }
    const quote = QUOTE_ONLY_LINE.exec(trimmed);
    if (quote && !isInternalQuotedThought(quote[1])) {
      const speaker = resolveUnlabeledSpeaker({
        ctxLine: lastLine,
        text: quote[1],
        speakers,
        recentSpeaker,
        lastDialogueSpeaker
      });
      pushDialogue(speaker, quote[1]);
      continue;
    }
    const parts = splitQuotedParts(rawLine);
    if (parts.length > 1) {
      let speechCount = 0;
      let offset = 0;
      for (const part of parts) {
        if (part.quoted && part.text.trim() && !isInternalQuotedThought(part.text) && !isQuotationText(rawLine, offset)) speechCount += 1;
        offset += part.text.length + (part.quoted ? 2 : 0);
      }
      if (speechCount === 0) {
        recentSpeaker = lastMentionedSpeaker(rawLine, speakers, recentSpeaker);
        narrativeLines.push(rawLine);
        lastLine = rawLine;
        continue;
      }
      let ctxLine = lastLine;
      offset = 0;
      for (const part of parts) {
        if (part.quoted && part.text.trim() && !isInternalQuotedThought(part.text) && !isQuotationText(rawLine, offset)) {
          const speaker = resolveUnlabeledSpeaker({
            ctxLine,
            text: part.text,
            speakers,
            recentSpeaker,
            lastDialogueSpeaker
          });
          pushDialogue(speaker, part.text);
        } else if (part.quoted) {
          narrativeLines.push(`\u201C${part.text}\u201D`);
        } else if (part.text.trim()) {
          recentSpeaker = lastMentionedSpeaker(part.text, speakers, recentSpeaker);
          narrativeLines.push(part.text);
          ctxLine = part.text;
        }
        offset += part.text.length + (part.quoted ? 2 : 0);
      }
      continue;
    }
    recentSpeaker = lastMentionedSpeaker(rawLine, speakers, recentSpeaker);
    narrativeLines.push(rawLine);
    lastLine = rawLine;
  }
  flushNarrative();
  QUOTED_INLINE_DIALOGUE.lastIndex = 0;
  let match;
  while ((match = QUOTED_INLINE_DIALOGUE.exec(sceneText)) !== null) {
    const dialogue = normalizedDialogue({
      speakerName: match[1],
      direction: match[2],
      dialogueText: match[3]
    }, master, orderRef.value);
    if (!dialogue) continue;
    const signature = `${dialogue.speaker_name}
${dialogue.direction}
${dialogue.text}`;
    if (signatures.has(signature)) continue;
    signatures.add(signature);
    dialogueLines.push(dialogue);
    orderRef.value += 1;
  }
}
__name(appendSceneBlocks, "appendSceneBlocks");
function parseNarrative(rawText, { master } = {}) {
  const originalRaw = String(rawText ?? "");
  const normalizedRaw = normalizeQuoteOnlyDialogue(originalRaw, { master });
  const raw = normalizedRaw;
  const matches = [...raw.matchAll(MARKER)];
  const blocks = [];
  const warnings = [];
  const dialogueLines = [];
  const orderRef = { value: 0 };
  let playerStatus = "";
  let playerInnerThought = "";
  let choices2 = [];
  let choiceLabels = [];
  const sceneParts = [];
  if (matches.length === 0) {
    return {
      raw: originalRaw,
      normalized_raw: normalizedRaw,
      scene_text: "",
      blocks: raw.trim() ? [{ type: "unparsed", text: raw.trim() }] : [],
      player_status: "",
      player_inner_thought: "",
      choices: [],
      dialogue_lines: [],
      warnings: ["no_recognized_markers", "choices_not_exactly_four"]
    };
  }
  const prefix = raw.slice(0, matches[0].index).trim();
  if (prefix) {
    blocks.push({ type: "unparsed", text: prefix });
    warnings.push("unparsed_prefix");
  }
  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const label = current[1];
    const role = labelRole(label);
    const start = current.index + current[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : raw.length;
    const text5 = raw.slice(start, end).trim();
    if (role === "scene") {
      const malformedMarkerIndex = text5.search(/\[(?:SCENE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|DIALOGUE|\d\.\s*(?:서사\s*및\s*행동|플레이어\s*속마음|플레이어\s*상황판|선택지))\b/);
      if (malformedMarkerIndex === -1) {
        if (text5) {
          sceneParts.push(text5);
          appendSceneBlocks(blocks, dialogueLines, text5, master, orderRef);
        }
      } else {
        const sceneText = text5.slice(0, malformedMarkerIndex).trim();
        const fallbackText = text5.slice(malformedMarkerIndex).trim();
        if (sceneText) {
          sceneParts.push(sceneText);
          appendSceneBlocks(blocks, dialogueLines, sceneText, master, orderRef);
        }
        if (fallbackText) blocks.push({ type: "unparsed", text: fallbackText });
        warnings.push("malformed_marker_fallback");
      }
      continue;
    }
    if (role === "status") {
      playerStatus = text5;
      continue;
    }
    if (role === "thought") {
      playerInnerThought = text5;
      if (text5) blocks.push({ type: "player_inner_thought", text: text5 });
      continue;
    }
    if (role === "choices") {
      const parsed = parseChoices(text5);
      choices2 = parsed.choices;
      choiceLabels = parsed.choice_labels;
      if (choices2.length !== 4) warnings.push("choices_not_exactly_four");
      const suppliedLabels = choiceLabels.filter(Boolean);
      if (suppliedLabels.length > 0 && suppliedLabels.length !== choices2.length) warnings.push("choice_labels_missing");
      if (new Set(suppliedLabels).size !== suppliedLabels.length) warnings.push("choice_labels_duplicated");
      continue;
    }
    const speaker = /speaker="([^"]+)"/.exec(label)?.[1];
    const direction = /direction="([^"]+)"/.exec(label)?.[1];
    if (!speaker || !direction) {
      blocks.push({ type: "unparsed", text: `${current[0]}${text5}`.trim() });
      warnings.push("malformed_dialogue_marker");
      continue;
    }
    const dialogue = normalizedDialogue({ speakerName: speaker, direction, dialogueText: text5 }, master, orderRef.value++);
    if (!dialogue) continue;
    blocks.push({ type: "dialogue", speaker_id: dialogue.speaker_id, speaker: dialogue.speaker_name, speaker_name: dialogue.speaker_name, direction, text: dialogue.text });
    dialogueLines.push(dialogue);
  }
  if (choices2.length !== 4 && !warnings.includes("choices_not_exactly_four")) {
    warnings.push("choices_not_exactly_four");
  }
  if (/\[DIALOGUE\b(?![^\]]*\])/.test(raw)) warnings.push("incomplete_dialogue_marker");
  const result = {
    raw: originalRaw,
    normalized_raw: normalizedRaw,
    scene_text: sceneParts.join("\n"),
    blocks,
    player_status: playerStatus,
    player_inner_thought: playerInnerThought,
    choices: choices2,
    dialogue_lines: dialogueLines,
    warnings
  };
  if (choiceLabels.some(Boolean)) result.choice_labels = choiceLabels;
  return result;
}
__name(parseNarrative, "parseNarrative");

// src/engine/turn-state.js
function deriveRecoverableStep(status) {
  switch (status?.processing_status) {
    case "story_streaming":
      return status.has_story ? "resume_extract" : "wait_story";
    case "extracting":
      return status.has_story ? "resume_extract" : "wait_story";
    case "committing":
      return status.has_extract ? "resume_commit" : "retry_extract";
    case "committed":
    case "story_failed":
    case "extract_failed":
    case "commit_failed":
    case "ready":
      return "complete";
    default:
      return "none";
  }
}
__name(deriveRecoverableStep, "deriveRecoverableStep");
function buildTurnState({ currentTurn, expectedTurn, actionId, turnId }) {
  return {
    committed_turn: currentTurn,
    processing_status: "ready",
    turn_id: turnId,
    action_id: actionId,
    expected_turn: expectedTurn + 1
  };
}
__name(buildTurnState, "buildTurnState");

// src/engine/state/clothing.js
var CLOTHING_VALUES = /* @__PURE__ */ new Set(["worn", "removed", "open", "unknown"]);
var UNDERWEAR_VALUES = /* @__PURE__ */ new Set(["worn", "removed", "unknown"]);
var LEGACY_SLOTS = /* @__PURE__ */ new Set(["uniform_top", "uniform_bottom", "underwear_top", "underwear_bottom"]);
var UNDERWEAR_SLOTS = /* @__PURE__ */ new Set(["underwear_top", "underwear_bottom"]);
var UNKNOWN_VALUES = /* @__PURE__ */ new Set(["unknown", "none", "null", "n/a", "\uC54C \uC218 \uC5C6\uC74C", "\uBBF8\uC0C1"]);
function isPlainObject5(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject5, "isPlainObject");
function normalizeText(value, maxLength = 180) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || UNKNOWN_VALUES.has(normalized.toLowerCase())) return null;
  return Array.from(normalized).slice(0, maxLength).join("");
}
__name(normalizeText, "normalizeText");
function hasKorean(value) {
  return typeof value === "string" && /[가-힣]/.test(value);
}
__name(hasKorean, "hasKorean");
var MAGICAL_TRANSITION_RE = /(저절로|스스로|자동으로|순식간에|즉시)\s*(벗겨|풀리|사라지|열리|닫히)|규칙이?\s*적용되자|시스템이|앱이\s*(옷|자세)|보이지\s*않는\s*손/;
function isMagicalPhysicalTransitionEvidence(evidence) {
  return typeof evidence === "string" && MAGICAL_TRANSITION_RE.test(evidence);
}
__name(isMagicalPhysicalTransitionEvidence, "isMagicalPhysicalTransitionEvidence");
var PLANNING_ONLY_RE = /(으?려고\s*(한다|했다)|할\s*예정|하기로\s*했다|막\s*하려던\s*참|아직\s*(벗지|입지)\s*않)/;
function isPlanningOnlyEvidence(evidence) {
  return typeof evidence === "string" && PLANNING_ONLY_RE.test(evidence);
}
__name(isPlanningOnlyEvidence, "isPlanningOnlyEvidence");
function evidenceIdentifiesCharacter(evidence, narrativeText, characterName) {
  if (typeof evidence !== "string" || !evidence.trim()) return false;
  const quote = evidence.trim();
  const text5 = typeof narrativeText === "string" ? narrativeText : "";
  if (!text5.includes(quote)) return false;
  if (typeof characterName === "string" && characterName.trim() && !quote.includes(characterName.trim())) return false;
  return true;
}
__name(evidenceIdentifiesCharacter, "evidenceIdentifiesCharacter");
function evaluateClothingFieldEvidence(evidence, narrativeText, characterName) {
  if (typeof evidence !== "string" || !evidence.trim()) return false;
  if (isMagicalPhysicalTransitionEvidence(evidence)) return false;
  if (isPlanningOnlyEvidence(evidence)) return false;
  return evidenceIdentifiesCharacter(evidence, narrativeText, characterName);
}
__name(evaluateClothingFieldEvidence, "evaluateClothingFieldEvidence");
function normalizeSlotValue(slot, value) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (!LEGACY_SLOTS.has(slot)) return hasKorean(slot) && hasKorean(normalized) ? normalized : null;
  const allowed = UNDERWEAR_SLOTS.has(slot) ? UNDERWEAR_VALUES : CLOTHING_VALUES;
  if (allowed.has(normalized)) return normalized;
  return hasKorean(normalized) ? normalized : null;
}
__name(normalizeSlotValue, "normalizeSlotValue");
function retainEvidencedClothing({ previousClothing = {}, proposedClothing = {}, evidenceMap = {}, narrativeText = "", characterName = "" } = {}) {
  const previous = isPlainObject5(previousClothing) ? previousClothing : {};
  const proposed = isPlainObject5(proposedClothing) ? proposedClothing : {};
  const evidence = isPlainObject5(evidenceMap) ? evidenceMap : {};
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
__name(retainEvidencedClothing, "retainEvidencedClothing");

// src/engine/state/posture.js
var UNKNOWN_VALUES2 = /* @__PURE__ */ new Set(["unknown", "none", "null", "n/a", "\uC54C \uC218 \uC5C6\uC74C", "\uBBF8\uC0C1", "\uC790\uC138 \uBBF8\uD655\uC778"]);
function isPlainObject6(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject6, "isPlainObject");
function normalizePhysicalText(value, maxLength = 180) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || UNKNOWN_VALUES2.has(normalized.toLowerCase())) return null;
  return Array.from(normalized).slice(0, maxLength).join("");
}
__name(normalizePhysicalText, "normalizePhysicalText");
function buildPosturePatch({ previous = null, proposal = null, turnNumber = null } = {}) {
  const prev = isPlainObject6(previous) ? previous : null;
  const next = isPlainObject6(proposal) ? proposal : null;
  const previousPosture = normalizePhysicalText(prev?.posture);
  const previousPosition = normalizePhysicalText(prev?.position_label, 140);
  const proposedPosture = normalizePhysicalText(next?.posture);
  const proposedPosition = normalizePhysicalText(next?.position_label, 140);
  if (!proposedPosture && !proposedPosition) {
    return prev ? {
      posture: previousPosture ?? prev.posture ?? null,
      position_label: previousPosition,
      updated_turn: prev.updated_turn ?? null
    } : null;
  }
  return {
    posture: proposedPosture ?? previousPosture,
    position_label: proposedPosition ?? previousPosition,
    updated_turn: Number.isInteger(turnNumber) ? turnNumber : prev?.updated_turn ?? null
  };
}
__name(buildPosturePatch, "buildPosturePatch");

// src/engine/state/physical-state.js
function isPlainObject7(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject7, "isPlainObject");
function identity3(value, maxLength = 180) {
  if (typeof value !== "string" || !value.trim()) return null;
  return Array.from(value.trim().replace(/\s+/g, " ")).slice(0, maxLength).join("");
}
__name(identity3, "identity");
function evidenceObject(value) {
  if (isPlainObject7(value)) return value;
  if (typeof value === "string" && value.trim()) return { posture: value, position: value, location: value };
  return {};
}
__name(evidenceObject, "evidenceObject");
function exactStoryEvidence(evidence, narrativeText, characterName = "") {
  if (typeof evidence !== "string" || !evidence.trim()) return false;
  const quote = evidence.trim();
  const text5 = typeof narrativeText === "string" ? narrativeText : "";
  if (!text5.includes(quote)) return false;
  if (typeof characterName === "string" && characterName.trim() && !quote.includes(characterName.trim())) return false;
  return true;
}
__name(exactStoryEvidence, "exactStoryEvidence");
function buildSceneStatePatch({ previous = {}, proposal = null, evidenceMap = {}, narrativeText = "", characterName = "", turnNumber = null } = {}) {
  const prev = isPlainObject7(previous) ? previous : {};
  const raw = isPlainObject7(proposal) ? proposal : {};
  const evidence = evidenceObject(evidenceMap);
  const warnings = [];
  const { clothing: acceptedClothing, rejections } = retainEvidencedClothing({
    previousClothing: prev.clothing ?? {},
    proposedClothing: raw.clothing ?? {},
    evidenceMap: isPlainObject7(evidence.clothing) ? evidence.clothing : {},
    narrativeText,
    characterName
  });
  warnings.push(...rejections);
  const requestedPosture = normalizePhysicalText(raw.posture);
  const requestedPosition = normalizePhysicalText(raw.position_label, 140);
  const previousPosture = normalizePhysicalText(prev.posture);
  const previousPosition = normalizePhysicalText(prev.position_label, 140);
  const postureChanges = Boolean(requestedPosture && requestedPosture !== previousPosture);
  const positionChanges = Boolean(requestedPosition && requestedPosition !== previousPosition);
  const postureEvidenceValid = Boolean(requestedPosture) && exactStoryEvidence(evidence.posture, narrativeText, characterName);
  const positionEvidenceValid = Boolean(requestedPosition) && exactStoryEvidence(evidence.position ?? evidence.posture, narrativeText, characterName);
  const endReasonRequested = identity3(raw.posture_end_reason, 80);
  const endReasonEvidenceValid = Boolean(endReasonRequested) && exactStoryEvidence(evidence.posture_end_reason ?? evidence.posture, narrativeText, characterName);
  if (postureChanges && !postureEvidenceValid) warnings.push("unevidenced_posture_change");
  if (positionChanges && !positionEvidenceValid) warnings.push("unevidenced_position_label");
  if (endReasonRequested && postureChanges && !endReasonEvidenceValid) warnings.push("unevidenced_posture_end_reason");
  const postureProposal = requestedPosture || requestedPosition ? {
    posture: requestedPosture || previousPosture,
    position_label: requestedPosition || previousPosition,
    end_reason: endReasonEvidenceValid ? endReasonRequested : null,
    evidence_valid: postureEvidenceValid
  } : null;
  const posturePatch = buildPosturePatch({
    previous: prev.posture || prev.position_label ? {
      posture: prev.posture,
      position_label: prev.position_label,
      updated_turn: prev.updated_turn
    } : null,
    proposal: postureProposal,
    turnNumber
  });
  if (posturePatch?.rejected && !warnings.includes(posturePatch.rejected)) warnings.push(posturePatch.rejected);
  const locationRequested = identity3(raw.location_label, 100);
  const locationEvidenceValid = Boolean(locationRequested) && exactStoryEvidence(evidence.location, narrativeText, characterName);
  if (locationRequested && locationRequested !== prev.location_label && !locationEvidenceValid) {
    warnings.push("unevidenced_location_change");
  }
  return {
    state: {
      location_label: locationEvidenceValid ? locationRequested : prev.location_label ?? null,
      posture: posturePatch?.posture ?? prev.posture ?? "unknown",
      position_label: posturePatch?.position_label ?? prev.position_label ?? null,
      clothing: { ...isPlainObject7(prev.clothing) ? prev.clothing : {}, ...acceptedClothing },
      updated_turn: posturePatch?.updated_turn ?? prev.updated_turn ?? turnNumber
    },
    warnings
  };
}
__name(buildSceneStatePatch, "buildSceneStatePatch");

// src/engine/relationship/guards.js
var AFFINITY_ONLY_EVIDENCE_RE = /상식개변|상식.*수용|규범.*수행|접촉.*(거부하지|제지하지)|거절하지|얼굴.*(붉|홍조)|흥분|신음|성행위|성관계|절정|오르가즘|신체.*반응/;
var INDEPENDENT_AFFINITY_EVENT_RE = /의사(를)?\s*존중|약속(을)?\s*지키|위험.*(해결|구했)|업무.*(해결|도움)|신뢰.*(대화|얻)|감정.*(이해|공감)|상호.*합의.*친밀/;
var PLAYER_DECLARED_RESULT_RE = /플레이어.*(선언|입력|작성)|(이미\s*)?(좋아|복종|오르가즘).*(입력|작성|선언)/;
function hasAffinityOnlyEvidence(reason) {
  return typeof reason === "string" && AFFINITY_ONLY_EVIDENCE_RE.test(reason);
}
__name(hasAffinityOnlyEvidence, "hasAffinityOnlyEvidence");
function hasIndependentAffinityEvent(reason) {
  return typeof reason === "string" && INDEPENDENT_AFFINITY_EVENT_RE.test(reason);
}
__name(hasIndependentAffinityEvent, "hasIndependentAffinityEvent");
function hasPlayerDeclaredResultPattern(reason) {
  return typeof reason === "string" && PLAYER_DECLARED_RESULT_RE.test(reason);
}
__name(hasPlayerDeclaredResultPattern, "hasPlayerDeclaredResultPattern");
function evaluateAffinityDelta(delta, reason) {
  if (delta <= 0) return { allowed: true };
  if (hasPlayerDeclaredResultPattern(reason)) return { allowed: false, code: "player_declared_result_not_a_basis" };
  if (hasAffinityOnlyEvidence(reason) && !hasIndependentAffinityEvent(reason)) {
    return { allowed: false, code: "csa_compliance_or_bodily_reaction_alone_not_affinity" };
  }
  return { allowed: true };
}
__name(evaluateAffinityDelta, "evaluateAffinityDelta");

// src/engine/relationship/reducer.js
var MAX_DELTA = { affinity: 5, csa_acceptance: 30, sexual_arousal: 15 };
var MIN_DELTA = { affinity: -5, csa_acceptance: -20, sexual_arousal: -20 };
var STATS = ["affinity", "csa_acceptance", "sexual_arousal"];
function clamp2(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
__name(clamp2, "clamp");
function isPlainObject8(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject8, "isPlainObject");
function applyNpcStatChanges(previous = {}, deltas = {}, { reason = "" } = {}) {
  const base = isPlainObject8(previous) ? previous : {};
  const proposed = isPlainObject8(deltas) ? deltas : {};
  const warnings = [];
  const state = {};
  for (const key of STATS) {
    const current = clamp2(Number.isFinite(base[key]) ? base[key] : 0, 0, 100);
    let delta = Number.isFinite(proposed[key]) ? proposed[key] : 0;
    if (delta > MAX_DELTA[key] || delta < MIN_DELTA[key]) {
      warnings.push(`stat_delta_out_of_range:${key}`);
      delta = 0;
    }
    if (key === "affinity" && delta > 0) {
      const verdict = evaluateAffinityDelta(delta, reason);
      if (!verdict.allowed) {
        warnings.push(verdict.code);
        delta = 0;
      }
    }
    state[key] = clamp2(current + delta, 0, 100);
  }
  if (Number.isFinite(base.resistance)) state.resistance = clamp2(base.resistance, 0, 100);
  if (Number.isFinite(proposed.resistance)) warnings.push("stat_resistance_change_ignored");
  return { state, warnings };
}
__name(applyNpcStatChanges, "applyNpcStatChanges");

// src/engine/sexual-state/ledger.js
var LEDGER_ACTION_TYPES = /* @__PURE__ */ new Set([...STRUCTURED_SEXUAL_ACTIONS, "orgasm"]);
var DIRECTIONS = /* @__PURE__ */ new Set(["none", "npc_to_player", "player_to_npc"]);
var MAX_LEDGER_LENGTH = 80;
function isPlainObject9(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject9, "isPlainObject");
function normalizeEvidenceText(value) {
  return typeof value === "string" ? value.normalize("NFKC").replace(/[\s"'“”‘’]+/g, " ").trim() : "";
}
__name(normalizeEvidenceText, "normalizeEvidenceText");
function stableContentHash(text5) {
  let hash = 2166136261;
  for (let i = 0; i < text5.length; i += 1) {
    hash ^= text5.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
__name(stableContentHash, "stableContentHash");
function sexualEventId(turnNumber, actorId, actionType, evidence) {
  return `turn:${turnNumber}:${actorId ?? "unknown"}:${actionType}:${stableContentHash(normalizeEvidenceText(evidence))}`;
}
__name(sexualEventId, "sexualEventId");
function normalizeCandidate(raw, { turnNumber, actionId } = {}) {
  if (!isPlainObject9(raw)) return null;
  const actionType = LEDGER_ACTION_TYPES.has(raw.action_type) ? raw.action_type : null;
  if (!actionType) return null;
  const actorId = typeof raw.actor_id === "string" && raw.actor_id.trim() ? raw.actor_id.trim() : null;
  const targetId = typeof raw.target_id === "string" && raw.target_id.trim() ? raw.target_id.trim() : null;
  const direction = DIRECTIONS.has(raw.direction) ? raw.direction : "none";
  const evidence = typeof raw.evidence === "string" ? raw.evidence.trim().slice(0, 200) : "";
  if (!evidence) return null;
  const completed = raw.completed === true;
  const interrupted = raw.interrupted === true && !completed;
  return {
    event_id: sexualEventId(turnNumber, actorId, actionType, evidence),
    action_id: typeof actionId === "string" ? actionId : null,
    turn: turnNumber,
    actor_id: actorId,
    target_id: targetId,
    action_type: actionType,
    direction,
    completed,
    interrupted,
    evidence
  };
}
__name(normalizeCandidate, "normalizeCandidate");
function appendSexualEvents(previousLedger, rawCandidates, { turnNumber, actionId } = {}) {
  const previous = Array.isArray(previousLedger) ? previousLedger : [];
  const seenIds = new Set(previous.map((event) => event?.event_id).filter(Boolean));
  const accepted = [];
  const warnings = [];
  for (const raw of Array.isArray(rawCandidates) ? rawCandidates : []) {
    const candidate = normalizeCandidate(raw, { turnNumber, actionId });
    if (!candidate) {
      warnings.push("invalid_sexual_event_candidate");
      continue;
    }
    if (seenIds.has(candidate.event_id)) continue;
    seenIds.add(candidate.event_id);
    accepted.push(candidate);
  }
  const ledger = [...previous, ...accepted].slice(-MAX_LEDGER_LENGTH);
  return { ledger, accepted, warnings };
}
__name(appendSexualEvents, "appendSexualEvents");
function reduceEjaculationCounts(previousCounts, acceptedEvents) {
  const counts = isPlainObject9(previousCounts) ? { ...previousCounts } : {};
  for (const event of acceptedEvents) {
    if (!event.completed || !event.actor_id) continue;
    if (event.action_type !== "orgasm" && event.action_type !== "penetration") continue;
    counts[event.actor_id] = Math.max(0, Number.isFinite(counts[event.actor_id]) ? counts[event.actor_id] : 0) + 1;
  }
  return counts;
}
__name(reduceEjaculationCounts, "reduceEjaculationCounts");

// src/engine/guarded-merge.js
var ALLOWED = /* @__PURE__ */ new Set([
  "player",
  "player_scene_state",
  "player_sexual_state",
  "world_state",
  "scene_state",
  "npc_stats",
  "npc_emotion",
  "npc_relationship_state",
  "npc_scene_state",
  "npc_work_state",
  "csa_attitudes",
  "csa_runtime_state",
  "csa_aftereffect_state",
  "event_ledger",
  "sexual_event_ledger",
  "story_summary_overall",
  "story_summary_recent",
  "focal_character_id",
  "last_speaker_id",
  "last_npcs_present",
  "last_image_id",
  "last_choices",
  "last_choice_meta"
]);
var NULLABLE = /* @__PURE__ */ new Set(["last_image_id"]);
var NPC_MAPS = /* @__PURE__ */ new Set(["npc_stats", "npc_emotion", "npc_relationship_state", "npc_scene_state", "npc_work_state", "csa_attitudes"]);
function buildFallbackTurnChoices(save) {
  const hasActiveRule = Array.isArray(save?.csa_active) && save.csa_active.length > 0;
  return [
    "\uC774\uC57C\uAE30\uB97C \uACC4\uC18D \uC774\uC5B4\uAC04\uB2E4",
    hasActiveRule ? "\uC0C8 \uADDC\uC815\uC758 \uAD6C\uCCB4\uC801\uC778 \uB0B4\uC6A9\uC744 \uC9C8\uBB38\uD55C\uB2E4" : "\uC0C1\uB300\uC758 \uC758\uACAC\uC744 \uD655\uC778\uD55C\uB2E4",
    "\uB2E4\uB978 NPC\uC758 \uBC18\uC751\uC744 \uD655\uC778\uD55C\uB2E4",
    "\uC790\uC720\uB86D\uAC8C \uB2E4\uB978 \uD589\uB3D9\uC744 \uC120\uD0DD\uD55C\uB2E4"
  ];
}
__name(buildFallbackTurnChoices, "buildFallbackTurnChoices");
var ENVELOPE_AUTHORITATIVE = /* @__PURE__ */ new Set(["focal_character_id", "last_speaker_id", "last_choices", "last_npcs_present", "last_choice_meta"]);
function plainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(plainObject, "plainObject");
function clone2(value) {
  return structuredClone(value);
}
__name(clone2, "clone");
function deepMerge(base, patch) {
  if (!plainObject(base) || !plainObject(patch)) return clone2(patch);
  const merged = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    merged[key] = plainObject(value) ? deepMerge(base[key], value) : clone2(value);
  }
  return merged;
}
__name(deepMerge, "deepMerge");
function isStale(base, patch) {
  return plainObject(patch) && Number.isFinite(patch.updated_turn) && Number.isFinite(base?.updated_turn) && patch.updated_turn < base.updated_turn;
}
__name(isStale, "isStale");
function allowedNpcIds(save) {
  const ids = /* @__PURE__ */ new Set([...save.scene_state?.participants ?? [], ...save.last_npcs_present ?? []]);
  for (const [id, state] of Object.entries(save.npc_scene_state ?? {})) {
    if (state?.present === true) ids.add(id);
  }
  ids.delete(save.player?.player_id);
  return ids;
}
__name(allowedNpcIds, "allowedNpcIds");
var ALLOWED_SEXUAL_DELTA_KEYS = /* @__PURE__ */ new Set(["arousal_delta", "ejaculation_progress_delta", "ejaculation_completed"]);
var SEXUAL_COMPLETION_CLAIM_PATTERN = /sexual.*(complete|relationship)|(?:complete|relationship).*sexual/i;
function sanitizePlayerSexualStateDelta(patch) {
  const clean = {};
  const warnings = [];
  for (const [key, value] of Object.entries(patch)) {
    if (ALLOWED_SEXUAL_DELTA_KEYS.has(key)) {
      clean[key] = value;
      continue;
    }
    if (SEXUAL_COMPLETION_CLAIM_PATTERN.test(key) && Boolean(value)) {
      warnings.push(`unauthorized_sexual_completion_field_ignored:${key}`);
    } else {
      warnings.push(`unknown_player_sexual_state_delta:${key}`);
    }
  }
  return { patch: clean, warnings };
}
__name(sanitizePlayerSexualStateDelta, "sanitizePlayerSexualStateDelta");
function sanitizeRelationshipMilestonePatch(currentSave, npcId, patch, evidence) {
  const nextTurn = patch?.milestones?.sexual_relationship_started_turn;
  const currentTurn = currentSave.npc_relationship_state?.[npcId]?.milestones?.sexual_relationship_started_turn;
  const attemptsChange = nextTurn !== null && nextTurn !== void 0 && nextTurn !== currentTurn;
  if (!attemptsChange || evidence?.sexual_resolution === true || !plainObject(patch.milestones)) {
    return { patch, warning: null };
  }
  const { sexual_relationship_started_turn, ...restMilestones } = patch.milestones;
  return {
    patch: { ...patch, milestones: restMilestones },
    warning: `unauthorized_sexual_milestone_ignored:${npcId}`
  };
}
__name(sanitizeRelationshipMilestonePatch, "sanitizeRelationshipMilestonePatch");
function mergeEventLedger(current, patch) {
  const byId = new Map((Array.isArray(current) ? current : []).map((item) => [item?.event_id, item]));
  for (const event of patch) {
    if (plainObject(event) && typeof event.event_id === "string" && !byId.has(event.event_id)) byId.set(event.event_id, clone2(event));
  }
  return [...byId.values()];
}
__name(mergeEventLedger, "mergeEventLedger");
function characterNameFromMaster(master, characterId) {
  const characters = Array.isArray(master?.characters) ? master.characters : [];
  return characters.find((character) => character?.character_id === characterId)?.name ?? characterId ?? "";
}
__name(characterNameFromMaster, "characterNameFromMaster");
function restoreMovementState(beforeSave, nextSave) {
  nextSave.scene_state = structuredClone(beforeSave.scene_state ?? {});
  nextSave.last_npcs_present = Array.isArray(beforeSave.last_npcs_present) ? structuredClone(beforeSave.last_npcs_present) : [];
  if ("focal_character_id" in beforeSave) {
    nextSave.focal_character_id = beforeSave.focal_character_id ?? null;
  } else {
    delete nextSave.focal_character_id;
  }
  if ("last_speaker_id" in beforeSave) {
    nextSave.last_speaker_id = beforeSave.last_speaker_id ?? null;
  } else {
    delete nextSave.last_speaker_id;
  }
  nextSave.npc_scene_state = structuredClone(beforeSave.npc_scene_state ?? {});
}
__name(restoreMovementState, "restoreMovementState");
function resolveCanonicalPlayerId(save) {
  const candidates = [
    save?.player?.player_id,
    save?.player?.id,
    ...Array.isArray(save?.scene_state?.participants) ? save.scene_state.participants : []
  ];
  return candidates.find(
    (id) => typeof id === "string" && (id === "player" || id.startsWith("player"))
  ) ?? "player";
}
__name(resolveCanonicalPlayerId, "resolveCanonicalPlayerId");
function isPlayerRefId(id) {
  return typeof id === "string" && (id === "player" || id.startsWith("player"));
}
__name(isPlayerRefId, "isPlayerRefId");
function sanitizeMovementCommit({
  beforeSave,
  nextSave,
  sceneCastContract,
  extractEnvelope,
  actionKind,
  expectedTurn
} = {}) {
  const warnings = [];
  if (!plainObject(beforeSave) || !plainObject(nextSave)) {
    return {
      applied: false,
      reason: "invalid_save",
      warnings: ["movement_commit_skipped:invalid_save"]
    };
  }
  const cast = plainObject(sceneCastContract) ? sceneCastContract : {};
  if (cast.transition_mode !== "movement") {
    return {
      applied: false,
      reason: "not_movement",
      warnings
    };
  }
  if (actionKind === "feedback_revision") {
    return {
      applied: false,
      reason: "feedback_revision",
      warnings
    };
  }
  const destinationIds = Array.isArray(cast.destination_npc_ids) ? [...new Set(
    cast.destination_npc_ids.filter((id) => typeof id === "string" && id.trim() && !isPlayerRefId(id))
  )] : [];
  if (destinationIds.length !== 1) {
    restoreMovementState(beforeSave, nextSave);
    const reason = destinationIds.length === 0 ? "missing_destination" : "ambiguous_destination";
    return {
      applied: false,
      reason,
      warnings: [`movement_commit_skipped:${reason}`]
    };
  }
  const destinationId = destinationIds[0];
  const destinationLocationId = typeof cast.destination_location_id === "string" && cast.destination_location_id.trim() ? cast.destination_location_id.trim() : null;
  const destinationSceneId = typeof cast.destination_scene_id === "string" && cast.destination_scene_id.trim() ? cast.destination_scene_id.trim() : destinationLocationId;
  if (!destinationLocationId) {
    restoreMovementState(beforeSave, nextSave);
    return {
      applied: false,
      reason: "unknown_destination_location",
      warnings: ["movement_commit_skipped:unknown_destination_location"]
    };
  }
  const outcome = typeof extractEnvelope?.outcome === "string" ? extractEnvelope.outcome : "unknown";
  if (outcome !== "success") {
    restoreMovementState(beforeSave, nextSave);
    return {
      applied: false,
      reason: "movement_not_successful",
      warnings: [`movement_commit_skipped:${outcome}`]
    };
  }
  const playerId = resolveCanonicalPlayerId(beforeSave);
  const oldSceneNpcIds = /* @__PURE__ */ new Set([
    ...Array.isArray(beforeSave.scene_state?.participants) ? beforeSave.scene_state.participants : [],
    ...Array.isArray(beforeSave.last_npcs_present) ? beforeSave.last_npcs_present : []
  ]);
  const npcState = structuredClone(nextSave.npc_scene_state ?? {});
  for (const npcId of oldSceneNpcIds) {
    if (isPlayerRefId(npcId)) continue;
    if (npcId === destinationId) continue;
    npcState[npcId] = {
      ...npcState[npcId] ?? {},
      present: false,
      updated_turn: expectedTurn
    };
  }
  npcState[destinationId] = {
    ...npcState[destinationId] ?? {},
    present: true,
    scene_id: destinationSceneId,
    location_id: destinationLocationId,
    updated_turn: expectedTurn
  };
  nextSave.scene_state = {
    ...nextSave.scene_state ?? {},
    scene_id: destinationSceneId,
    location_id: destinationLocationId,
    participants: [playerId, destinationId],
    updated_turn: expectedTurn
  };
  nextSave.last_npcs_present = [destinationId];
  nextSave.focal_character_id = destinationId;
  nextSave.npc_scene_state = npcState;
  return {
    applied: true,
    reason: "movement_committed",
    warnings
  };
}
__name(sanitizeMovementCommit, "sanitizeMovementCommit");
function applyGuardedStateDelta(currentSave, extractEnvelope, options) {
  if (!plainObject(currentSave)) throw new GameCoreError("INVALID_SAVE", "Current save must be an object");
  if (currentSave.save_schema_version !== 1 || currentSave.edition !== "company-v1") {
    throw new GameCoreError("INVALID_SAVE", "Current save edition or schema is invalid");
  }
  const preSave = hydrateGameplayState(currentSave, options?.master ?? {});
  const envelope = normalizeGameplayExtractEnvelope(extractEnvelope, { parsedStory: options?.parsedStory, npcIds: options?.npcIds });
  const nextSave = clone2(preSave);
  const warnings = [...envelope.warnings];
  const allowedNpcs = allowedNpcIds(preSave);
  if (options?.npcIds instanceof Set) {
    for (const id of envelope.npcs_present) allowedNpcs.add(id);
    if (envelope.action_target_id) allowedNpcs.add(envelope.action_target_id);
  }
  for (const [path, patch] of Object.entries(envelope.state_delta)) {
    if (ENVELOPE_AUTHORITATIVE.has(path)) {
      warnings.push(`duplicate_state_path:${path}`);
      continue;
    }
    if (!ALLOWED.has(path)) {
      warnings.push(`unknown_state_path:${path}`);
      continue;
    }
    if (patch === null) {
      if (NULLABLE.has(path)) nextSave[path] = null;
      else warnings.push(`null_not_allowed:${path}`);
      continue;
    }
    if (path === "event_ledger") {
      if (Array.isArray(patch)) nextSave.event_ledger = mergeEventLedger(nextSave.event_ledger, patch);
      else warnings.push("invalid_event_ledger");
      continue;
    }
    if (path === "player_sexual_state") {
      if (!plainObject(patch)) {
        warnings.push("invalid_player_sexual_state");
        continue;
      }
      const sanitized = sanitizePlayerSexualStateDelta(patch);
      warnings.push(...sanitized.warnings);
      const reduced = reducePlayerSexualState(nextSave.player_sexual_state, sanitized.patch, {
        storyEvidence: envelope.evidence,
        updatedTurn: options.expectedTurn
      });
      nextSave.player_sexual_state = reduced.state;
      warnings.push(...reduced.warnings);
      continue;
    }
    if (path === "player_scene_state") {
      if (!plainObject(patch)) {
        warnings.push("invalid_player_scene_state");
        continue;
      }
      const { state, warnings: sceneWarnings } = buildSceneStatePatch({
        previous: nextSave.player_scene_state ?? {},
        proposal: patch,
        evidenceMap: patch.evidence,
        narrativeText: options?.storyText ?? options?.parsedStory?.scene_text ?? "",
        characterName: "",
        turnNumber: options.expectedTurn
      });
      nextSave.player_scene_state = state;
      warnings.push(...sceneWarnings.map((code) => `player_scene_state:${code}`));
      continue;
    }
    if (path === "sexual_event_ledger") {
      if (!Array.isArray(patch)) {
        warnings.push("invalid_sexual_event_ledger");
        continue;
      }
      const { ledger, accepted, warnings: ledgerWarnings } = appendSexualEvents(nextSave.sexual_event_ledger, patch, {
        turnNumber: options.expectedTurn,
        actionId: options.actionId
      });
      nextSave.sexual_event_ledger = ledger;
      warnings.push(...ledgerWarnings);
      if (accepted.length) {
        const counts = reduceEjaculationCounts(nextSave.ejaculation_counts ?? {}, accepted);
        nextSave.ejaculation_counts = counts;
        const playerEvent = [...accepted].reverse().find((event) => event.actor_id === "player" || event.target_id === "player");
        if (playerEvent) {
          nextSave.player_sexual_state = {
            ...nextSave.player_sexual_state ?? {},
            last_sexual_event: { turn: playerEvent.turn, type: playerEvent.action_type, evidence: playerEvent.evidence }
          };
        }
      }
      continue;
    }
    if (path === "csa_runtime_state") {
      if (!plainObject(patch)) {
        warnings.push("invalid_csa_runtime_state");
        continue;
      }
      nextSave.csa_runtime_state = plainObject(nextSave.csa_runtime_state) ? nextSave.csa_runtime_state : {};
      for (const [csaId, csaPatch] of Object.entries(patch)) {
        const validated = validateCsaRuntimeStatePatch(csaId, csaPatch);
        warnings.push(...validated.warnings);
        if (!validated.patch || Object.keys(validated.patch).length === 0) continue;
        nextSave.csa_runtime_state[csaId] = deepMerge(nextSave.csa_runtime_state[csaId] ?? {}, validated.patch);
      }
      continue;
    }
    if (NPC_MAPS.has(path)) {
      if (!plainObject(patch)) {
        warnings.push(`invalid_npc_map:${path}`);
        continue;
      }
      nextSave[path] ??= {};
      for (const [npcId, npcPatch] of Object.entries(patch)) {
        if (!allowedNpcs.has(npcId)) {
          warnings.push(`absent_npc_patch:${path}:${npcId}`);
          continue;
        }
        if (path === "npc_scene_state" && plainObject(npcPatch)) {
          const { state, warnings: sceneWarnings } = buildSceneStatePatch({
            previous: nextSave.npc_scene_state[npcId] ?? {},
            proposal: npcPatch,
            evidenceMap: npcPatch.evidence,
            narrativeText: options?.storyText ?? options?.parsedStory?.scene_text ?? "",
            characterName: characterNameFromMaster(options?.master, npcId),
            turnNumber: options.expectedTurn
          });
          nextSave.npc_scene_state[npcId] = { ...state, present: nextSave.npc_scene_state[npcId]?.present ?? npcPatch.present ?? false };
          warnings.push(...sceneWarnings.map((code) => `npc_scene_state:${npcId}:${code}`));
          continue;
        }
        if (path === "npc_stats" && plainObject(npcPatch)) {
          const { reason, ...deltas } = npcPatch;
          const { state, warnings: statWarnings } = applyNpcStatChanges(nextSave.npc_stats[npcId] ?? {}, deltas, { reason: typeof reason === "string" ? reason : "" });
          nextSave.npc_stats[npcId] = state;
          warnings.push(...statWarnings.map((code) => `npc_stats:${npcId}:${code}`));
          continue;
        }
        let sanitizedPatch = npcPatch;
        if (path === "npc_relationship_state" && plainObject(npcPatch)) {
          const sanitized = sanitizeRelationshipMilestonePatch(preSave, npcId, npcPatch, envelope.evidence);
          sanitizedPatch = sanitized.patch;
          if (sanitized.warning) warnings.push(sanitized.warning);
        }
        if (isStale(nextSave[path][npcId], sanitizedPatch)) {
          warnings.push(`stale_updated_turn:${path}:${npcId}`);
          continue;
        }
        nextSave[path][npcId] = plainObject(sanitizedPatch) ? deepMerge(nextSave[path][npcId] ?? {}, sanitizedPatch) : clone2(sanitizedPatch);
      }
      continue;
    }
    if (isStale(nextSave[path], patch)) {
      warnings.push(`stale_updated_turn:${path}`);
      continue;
    }
    nextSave[path] = plainObject(patch) ? deepMerge(nextSave[path] ?? {}, patch) : clone2(patch);
  }
  nextSave.last_choices = clone2(envelope.choices);
  nextSave.last_choice_meta = clone2(envelope.choice_structured_meta);
  if (envelope.choices.length !== 4) {
    nextSave.last_choices = buildFallbackTurnChoices(nextSave);
    warnings.push("choices_not_exactly_four");
  }
  if (envelope.npcs_present.length > 0) nextSave.last_npcs_present = clone2(envelope.npcs_present);
  if (envelope.focal_character_id !== null) nextSave.focal_character_id = envelope.focal_character_id;
  if (envelope.last_speaker_id !== null) nextSave.last_speaker_id = envelope.last_speaker_id;
  const timeBefore = preSave.world_state.game_time;
  const timeAfter = advanceGameTime(timeBefore, envelope.elapsed_minutes, envelope.evidence);
  nextSave.world_state = plainObject(nextSave.world_state) ? { ...nextSave.world_state, game_time: timeAfter } : { game_time: timeAfter };
  nextSave.turn_state = buildTurnState({
    currentTurn: currentSave.turn_state?.committed_turn ?? 0,
    expectedTurn: options.expectedTurn,
    actionId: options.actionId,
    turnId: options.turnId
  });
  return {
    nextSave,
    warnings,
    time_before: timeBefore,
    elapsed_minutes: envelope.elapsed_minutes,
    time_after: timeAfter,
    action_target_id: envelope.action_target_id,
    image_character_id: envelope.image_character_id,
    mind_monitor: envelope.mind_monitor,
    dialogue_lines: envelope.dialogue_lines
  };
}
__name(applyGuardedStateDelta, "applyGuardedStateDelta");

// src/engine/opening-prompt.js
var BACKGROUND_MAX = 120;
function splitOpeningSections(rawText) {
  const raw = String(rawText ?? "");
  const bodyIndex = raw.indexOf("[1. \uC11C\uC0AC \uBC0F \uD589\uB3D9]");
  const head = bodyIndex === -1 ? raw : raw.slice(0, bodyIndex);
  const body = bodyIndex === -1 ? "" : raw.slice(bodyIndex);
  const backgroundMatch = /\[배경\]\s*([\s\S]*)/.exec(head);
  const rawBackground = (backgroundMatch ? backgroundMatch[1] : head).trim();
  const truncated = Array.from(rawBackground).length > BACKGROUND_MAX;
  const background = truncated ? `${Array.from(rawBackground).slice(0, BACKGROUND_MAX - 1).join("")}\u2026` : rawBackground;
  return { background, body, warnings: truncated ? ["opening_background_truncated"] : [] };
}
__name(splitOpeningSections, "splitOpeningSections");
var SYSTEM_INSTRUCTIONS3 = [
  "\uB108\uB294 \uD55C\uAD6D\uC5B4 \uD68C\uC0AC \uBC30\uACBD \uAC8C\uC784\uC758 \uC624\uD504\uB2DD(\uCCAB \uC7A5\uBA74)\uC744 \uC791\uC131\uD55C\uB2E4. \uD50C\uB808\uC774\uC5B4\uC758 \uC785\uB825\uC740 \uC544\uC9C1 \uC5C6\uC73C\uBA70, \uC774\uBC88\uC774 \uD50C\uB808\uC774\uC5B4\uAC00 \uC774 \uD68C\uC0AC\uC5D0 \uB4F1\uC7A5\uD558\uB294 \uCCAB \uC21C\uAC04\uC774\uB2E4.",
  "\uCD9C\uB825\uC740 \uC815\uD655\uD788 \uB2E4\uC74C \uC21C\uC11C\uB85C \uC4F4\uB2E4: [\uBC30\uACBD] \uD55C \uBB38\uC7A5, \uCD5C\uB300 120\uC790\uB85C \uD50C\uB808\uC774\uC5B4\uAC00 \uC774 \uD68C\uC0AC\uC5D0 \uC624\uAC8C \uB41C \uBC30\uACBD\uC744 \uC694\uC57D\uD55C\uB2E4. \uC774\uC5B4\uC11C \uC77C\uBC18 \uD134\uACFC \uB3D9\uC77C\uD55C \uB124 \uC139\uC158 [1. \uC11C\uC0AC \uBC0F \uD589\uB3D9] [2. \uD50C\uB808\uC774\uC5B4 \uC18D\uB9C8\uC74C] [3. \uD50C\uB808\uC774\uC5B4 \uC0C1\uD669\uD310] [4. \uC120\uD0DD\uC9C0]\uB97C \uC4F4\uB2E4. \uC774 \uB2E4\uC12F \uC139\uC158 \uC678\uC758 \uC0AC\uC6A9\uC790\uC6A9 \uC139\uC158\uC774\uB098 \uC139\uC158 \uBC16 \uC124\uBA85\xB7JSON\xB7\uBA54\uD0C0 \uCF54\uBA58\uD2B8\uB294 \uC4F0\uC9C0 \uC54A\uB294\uB2E4.",
  "opening_plan\uC5D0 \uC8FC\uC5B4\uC9C4 \uC694\uC77C\xB7\uC2DC\uAC01\xB7\uC7A5\uC18C\xB7\uC5C5\uBB34 \uACC4\uAE30\xB7\uC7A5\uBA74 \uBAA9\uD45C\uB97C \uADF8\uB300\uB85C \uC0AC\uC6A9\uD55C\uB2E4. \uB2E4\uB978 \uC694\uC77C, \uC2DC\uAC01, \uC7A5\uC18C\uB97C \uC784\uC758\uB85C \uB9CC\uB4E4\uC9C0 \uC54A\uB294\uB2E4. active_character_canon\uC5D0 \uC788\uB294 \uC778\uBB3C\uB9CC \uB4F1\uC7A5\uC2DC\uD0A4\uBA70, \uC5C6\uB294 \uC778\uBB3C\uC744 \uC0C8\uB85C \uB4F1\uC7A5\uC2DC\uD0A4\uC9C0 \uC54A\uB294\uB2E4.",
  "\uC624\uD504\uB2DD\uC740 \uBE48 \uBC30\uACBD\uC5D0\uC11C \uC790\uAE30\uC18C\uAC1C\uB9CC \uB098\uC5F4\uD558\uC9C0 \uC54A\uB294\uB2E4. \uCCAB 2~3\uBB38\uB2E8 \uC548\uC5D0 \uC7A5\uC18C\uB97C \uC54C\uC544\uBCFC \uC218 \uC788\uB294 \uAC10\uAC01\uC801 \uB514\uD14C\uC77C \uD558\uB098 \uC774\uC0C1, \uD604\uC7AC \uC9C4\uD589 \uC911\uC778 \uC77C(\uC5C5\uBB34\xB7\uC900\uBE44\xB7\uC7A1\uB2F4\xB7\uAC1C\uC778 \uC77C\uC815 \uB4F1 \uBB34\uC5C7\uC774\uB4E0)\uC774\uB098 \uC791\uC740 \uBB38\uC81C \uD558\uB098, \uD575\uC2EC NPC\uAC00 \uADF8 \uC0C1\uD669\uC5D0\uC11C \uB4DC\uB7EC\uB0B4\uB294 \uC131\uACA9\uACFC \uB9D0\uD22C\uB97C \uD568\uAED8 \uBCF4\uC5EC\uC900\uB2E4. \uC0AC\uBB34\uC2E4\uC740 \uC815\uC9C0\uB41C \uC138\uD2B8\uAC00 \uC544\uB2C8\uB77C \uC0AC\uB78C\uB4E4\uC774 \uC77C\uD558\uB294 \uACF5\uAC04\uCC98\uB7FC \uB290\uAEF4\uC838\uC57C \uD558\uC9C0\uB9CC, \uADFC\uAC70 \uC5C6\uB294 \uB300\uD615 \uC0AC\uAC74\uC744 \uB9CC\uB4E4\uC9C0 \uC54A\uB294\uB2E4.",
  '[1. \uC11C\uC0AC \uBC0F \uD589\uB3D9]: \uB300\uC0AC\uB294 \uC11C\uC220\uACFC \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uAD50\uCC28\uD558\uBA70 \uD615\uC2DD\uC740 "\uD654\uC790\uBA85 (\uC9E7\uACE0 \uAD6C\uCCB4\uC801\uC778 \uC5F0\uAE30\uC9C0\uC2DC): "\uB300\uC0AC"" \uC774\uB2E4. \uBAA9\uD45C \uBD84\uB7C9\uC740 1000~1500\uC790\uC774\uBA70 \uC774\uB294 \uC0DD\uC131 \uBAA9\uD45C\uC77C \uBFD0 \uAC80\uC99D \uAC8C\uC774\uD2B8\uAC00 \uC544\uB2C8\uB2E4.',
  "NPC \uCD08\uAE30 \uD638\uAC10\xB7\uC800\uD56D: \uAC01 NPC\uC758 affinity \uCD08\uAE30\uAC12(1~20)\uACFC resistance(\uACE0\uC815\uAC12)\uC744 \uCC38\uACE0\uD574 \uD50C\uB808\uC774\uC5B4 \uC815\uBCF4(\uBD80\uC11C\xB7\uC9C1\uAE09\xB7\uB098\uC774\xB7\uB9D0\uD22C)\uC5D0 \uB300\uD55C \uCCAB\uC778\uC0C1\uC744 \uC11C\uC0AC\uC5D0 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uBC18\uC601\uD55C\uB2E4. \uC800\uD56D\uC774 \uB192\uC740 NPC(60 \uC774\uC0C1)\uB294 \uADDC\uC815\uC744 \uB2F9\uC5F0\uD788 \uC5EC\uACA8\uB3C4 \uD50C\uB808\uC774\uC5B4\uC5D0\uAC8C\uB294 \uAC70\uB9AC\uB97C \uB450\uACE0, \uB0AE\uC740 NPC(35 \uC774\uD558)\uB294 \uCE5C\uADFC\uD558\uAC8C \uB2E4\uAC00\uC628\uB2E4. \uD638\uAC10\uB3C4 \uC218\uCE58 \uC790\uCCB4\uB97C \uC11C\uC0AC\uC5D0 \uB178\uCD9C\uD558\uC9C0 \uC54A\uB294\uB2E4.",
  "\uD575\uC2EC NPC\uB294 \uD50C\uB808\uC774\uC5B4\uB97C \uAE30\uB2E4\uB9AC\uAE30\uB9CC \uD558\uC9C0 \uC54A\uACE0 \uC790\uC2E0\uC758 \uC5C5\uBB34\xB7\uC131\uACA9\uC5D0 \uB530\uB978 \uC791\uC740 \uD589\uB3D9\uC744 \uBA3C\uC800 \uD55C\uB2E4. \uB2E4\uB9CC \uD50C\uB808\uC774\uC5B4\uAC00 \uC544\uC9C1 \uC785\uB825\uD558\uC9C0 \uC54A\uC740 \uB2E4\uC74C \uD589\uB3D9\uC774\uB098 \uB300\uC0AC\uB97C \uB300\uC2E0 \uC644\uB8CC\uD558\uC9C0 \uC54A\uB294\uB2E4 \u2014 \uC624\uD504\uB2DD\uC740 \uC0C1\uD669\uACFC \uC120\uD0DD \uAC00\uB2A5\uD55C \uAE34\uC7A5\uC744 \uC124\uC815\uD560 \uBFD0, \uC774\uD6C4 \uD589\uB3D9\uC740 \uC120\uD0DD\uC9C0\uB97C \uD1B5\uD574 \uD50C\uB808\uC774\uC5B4\uAC00 \uC815\uD55C\uB2E4.",
  "\uCCAB\uC778\uC0C1\uC740 \uC678\uBAA8 \uB098\uC5F4\uBCF4\uB2E4 \uC5C5\uBB34 \uD589\uB3D9, \uB9D0\uD22C, \uAC70\uB9AC\uAC10, \uB2E4\uB978 \uC0AC\uB78C\uC744 \uB300\uD558\uB294 \uBC29\uC2DD\uC73C\uB85C \uB4DC\uB7EC\uB0B8\uB2E4. active_character_canon.prompt_card\uC758 personality, speech, addressing, distinctive_traits\uB97C \uC2E4\uC81C \uD589\uB3D9\uACFC \uB300\uC0AC \uC0DD\uC131 \uADFC\uAC70\uB85C \uC0AC\uC6A9\uD558\uACE0, canon\uC5D0 \uC5C6\uB294 \uACFC\uAC70\xB7\uAD00\uACC4\xB7\uC9C1\uBB34\uB97C \uB9CC\uB4E4\uC9C0 \uC54A\uB294\uB2E4.",
  "[2. \uD50C\uB808\uC774\uC5B4 \uC18D\uB9C8\uC74C]: \uB530\uC634\uD45C \uC5C6\uB294 1\uC778\uCE6D \uD55C\uAD6D\uC5B4 \uB0B4\uBA74 \uB3C5\uBC31. \uBAA9\uD45C 180~350\uC790\uC774\uBA70 \uAC80\uC99D \uAC8C\uC774\uD2B8\uAC00 \uC544\uB2C8\uB2E4. \uD68C\uC0AC \uBD84\uC704\uAE30, \uD575\uC2EC NPC\uC758 \uCCAB\uC778\uC0C1, \uD50C\uB808\uC774\uC5B4\uAC00 \uC9C0\uAE08 \uD310\uB2E8\uD574\uC57C \uD560 \uC5C5\uBB34\xB7\uAD00\uACC4 \uC7C1\uC810\uC744 \uAD6C\uCCB4\uC801\uC73C\uB85C \uC778\uC2DD\uD558\uB418 \uC544\uC9C1 \uD558\uC9C0 \uC54A\uC740 \uD589\uB3D9\uC744 \uC644\uB8CC\uD588\uB2E4\uACE0 \uC4F0\uC9C0 \uC54A\uB294\uB2E4.",
  "[3. \uD50C\uB808\uC774\uC5B4 \uC0C1\uD669\uD310]: player\uC640 opening_plan\uC73C\uB85C \uC2E4\uC81C \uC804\uB2EC\uB41C \uAC12\uB9CC \uD45C\uC2DC\uD55C\uB2E4. \uC5C6\uB294 \uAC12\uC740 \uC9C0\uC5B4\uB0B4\uC9C0 \uC54A\uB294\uB2E4.",
  "[4. \uC120\uD0DD\uC9C0]: \uBC18\uB4DC\uC2DC \uC815\uD655\uD788 4\uAC1C\uB97C \uC0DD\uC131\uD55C\uB2E4. \uAC01 \uC904\uC740 `\uBC88\uD638. [\uC9E7\uC740\uB77C\uBCA8] \uC120\uD0DD\uC9C0 \uC804\uBB38` \uD615\uC2DD\uC774\uB2E4. \uC9E7\uC740\uB77C\uBCA8\uC740 \uACF5\uBC31 \uC5C6\uC774 2~5\uAE00\uC790(\uBD88\uAC00\uD53C\uD558\uBA74 \uCD5C\uB300 6\uAE00\uC790), \uB124 \uAC1C\uAC00 \uC11C\uB85C \uB2EC\uB77C\uC57C \uD55C\uB2E4. \uC804\uBB38\uC740 \uD50C\uB808\uC774\uC5B4\uAC00 Turn 1\uC5D0 \uC2E4\uC81C \uC218\uD589\uD560 \uD558\uB098\uC758 \uD575\uC2EC \uD589\uB3D9\uC774\uBA70 \uACB0\uACFC\uB97C \uC120\uD655\uC815\uD558\uC9C0 \uC54A\uB294\uB2E4. \uC5C5\uBB34 \uCC38\uC5EC, \uAD00\uACC4 \uD655\uC778, \uC8FC\uBCC0 \uD0D0\uC0C9, \uACBD\uACC4 \uC124\uC815\xB7\uAD00\uCC30 \uC911 \uC0C1\uD669\uC5D0 \uB9DE\uB294 \uCD5C\uC18C 3\uAC00\uC9C0 \uC11C\uB85C \uB2E4\uB978 \uC811\uADFC \uBC29\uD5A5\uC744 \uD3EC\uD568\uD55C\uB2E4. \uB77C\uBCA8\uC740 \uD45C\uC2DC\uC6A9\uC77C \uBFD0 \uC804\uBB38\uC744 \uC0DD\uB7B5\uD558\uC9C0 \uC54A\uB294\uB2E4.",
  "player\uC758 height_cm/weight_kg/body_type\uC740 \uBC30\uACBD \uC124\uBA85\uC774\uB098 \uC678\uBAA8 \uBB18\uC0AC\uAC00 \uC2E4\uC81C\uB85C \uD544\uC694\uD560 \uB54C\uB9CC \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uBC18\uC601\uD558\uACE0, \uB9E4 \uBB38\uC7A5 \uB098\uC5F4\uD558\uC9C0 \uC54A\uB294\uB2E4. speech_style\uC740 \uD50C\uB808\uC774\uC5B4\uC758 \uB300\uC0AC\uC640 \uC18D\uB9C8\uC74C \uBB38\uCCB4\uC5D0\uB9CC \uC601\uD5A5\uC744 \uC900\uB2E4 \u2014 \uB9D0\uD22C\uB9CC\uC73C\uB85C \uD50C\uB808\uC774\uC5B4\uAC00 \uC785\uB825\uD558\uC9C0 \uC54A\uC740 \uD3ED\uC5B8\xB7\uD589\uB3D9\xB7\uBC94\uC8C4\uB97C \uC790\uB3D9 \uC218\uD589\uD558\uC9C0 \uC54A\uB294\uB2E4."
].join(" ");
function buildOpeningPrompt({ edition: edition2, player, canonical, openingPlan, expectedTitle }) {
  const charactersMap = edition2?.characters?.characters ?? {};
  const activeIds = [openingPlan?.primary_character_id, ...openingPlan?.supporting_character_ids ?? []].filter(Boolean);
  const crossTeamNote = player?.position_id === "tf_lead" && player?.department_id === "brand_strategy" ? "\uC774 TF\uD300\uC7A5\uC740 \uC11C\uC6D0\uD76C\uC758 \uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300\uC7A5 \uC9C1\uCC45\uC744 \uB300\uCCB4\uD558\uC9C0 \uC54A\uB294\uB2E4. \uBCC4\uB3C4 \uD504\uB85C\uC81D\uD2B8 TF \uB610\uB294 \uBD80\uC11C \uAC04 \uD611\uC5C5 \uC870\uC9C1\uC758 \uD300\uC7A5\uC774\uB2E4." : null;
  return [
    { role: "system", content: SYSTEM_INSTRUCTIONS3 },
    {
      role: "user",
      content: JSON.stringify({
        edition: edition2.editionId,
        player: buildOpeningPlayerProjection({ player, canonical }),
        opening_plan: {
          weekday: openingPlan?.weekday,
          minute_of_day: openingPlan?.minute_of_day,
          location_name: openingPlan?.location_name,
          work_hook_label: openingPlan?.work_hook_label,
          scene_goal: openingPlan?.scene_goal
        },
        cross_team_note: crossTeamNote,
        active_character_canon: buildActiveCharacterCanon(charactersMap, activeIds)
      })
    }
  ];
}
__name(buildOpeningPrompt, "buildOpeningPrompt");

// src/engine/progression.js
var CSA_LEVEL_EXP_REQUIREMENTS = [15, 23, 50, 63, 75, 105, 120, 135, 150];
var MAX_LEVEL = 10;
var MAX_EXP_PER_TURN = 3;
function expForNextLevel(level) {
  const index = Math.max(1, Number(level) || 1) - 1;
  return index < CSA_LEVEL_EXP_REQUIREMENTS.length ? CSA_LEVEL_EXP_REQUIREMENTS[index] : null;
}
__name(expForNextLevel, "expForNextLevel");
function calculateProgress(previous = {}, amount = 0) {
  let level = Math.max(1, Number(previous?.level) || 1);
  let exp = Math.max(0, Number(previous?.exp) || 0);
  exp += Math.max(0, Number(amount) || 0);
  let leveledUp = false;
  while (level < MAX_LEVEL) {
    const required = expForNextLevel(level);
    if (required === null || exp < required) break;
    exp -= required;
    level += 1;
    leveledUp = true;
  }
  if (level >= MAX_LEVEL) exp = Math.min(exp, expForNextLevel(MAX_LEVEL - 1) ?? exp);
  return { level, exp, leveled_up: leveledUp };
}
__name(calculateProgress, "calculateProgress");
function isPlainObject10(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject10, "isPlainObject");
function calculateCsaProgression({ csaOperations = [], experiencedThisTurn = [], previouslyExperienced = /* @__PURE__ */ new Set(), degraded = false } = {}) {
  if (degraded) return { amount: 0, newly_experienced_keys: [] };
  let amount = 0;
  for (const operation of Array.isArray(csaOperations) ? csaOperations : []) {
    if (operation?.operation === "activate") amount += 3;
    else if (operation?.operation === "update") amount += 1;
  }
  const newlyExperiencedKeys = [];
  for (const entry of Array.isArray(experiencedThisTurn) ? experiencedThisTurn : []) {
    if (!isPlainObject10(entry) || !entry.character_id || !entry.csa_id) continue;
    const key = `${entry.character_id}:${entry.csa_id}`;
    if (previouslyExperienced.has(key) || newlyExperiencedKeys.includes(key)) {
      amount += 1;
      continue;
    }
    newlyExperiencedKeys.push(key);
    amount += 2;
  }
  return { amount: Math.min(MAX_EXP_PER_TURN, amount), newly_experienced_keys: newlyExperiencedKeys };
}
__name(calculateCsaProgression, "calculateCsaProgression");

// src/engine/csa/capability.js
var STRENGTH_TIERS_KO = ["\uC57D\uD568", "\uC911\uAC04", "\uAC15\uD568"];
var APP_STRENGTHS = /* @__PURE__ */ new Set(["weak", "medium", "strong"]);
var APP_STRENGTH_LABELS = { weak: "\uC57D\uD568", medium: "\uC911\uAC04", strong: "\uAC15\uD568" };
var APP_STRENGTH_RANK = { weak: 1, medium: 2, strong: 3 };
function appStrengthId(value) {
  if (typeof value !== "string") return "weak";
  const normalized = value.trim();
  if (Object.prototype.hasOwnProperty.call(APP_STRENGTH_RANK, normalized)) return normalized;
  return Object.entries(APP_STRENGTH_LABELS).find(([, label]) => label === normalized)?.[0] ?? "weak";
}
__name(appStrengthId, "appStrengthId");
function csaStrengthRank(strength) {
  const index = STRENGTH_TIERS_KO.indexOf(strength);
  return index === -1 ? 0 : index;
}
__name(csaStrengthRank, "csaStrengthRank");
function getCsaLimits(level) {
  const clamped = Math.max(1, Number(level) || 1);
  if (clamped >= 10) return { max_active: 5 };
  if (clamped >= 5) return { max_active: 4 };
  if (clamped >= 3) return { max_active: 3 };
  return { max_active: 2 };
}
__name(getCsaLimits, "getCsaLimits");
function calculateCsaCapability(save = {}, activeCsaCount = 0) {
  const level = Math.max(1, Number(save?.player_progress?.level) || 1);
  const exp = Math.max(0, Number(save?.player_progress?.exp) || 0);
  const nextLevelExp = level >= 10 ? 0 : expForNextLevel(level) ?? 0;
  const availableStrength = level >= 7 ? "\uAC15\uD568" : level >= 3 ? "\uC911\uAC04" : "\uC57D\uD568";
  const maxStrengthRank = csaStrengthRank(availableStrength);
  const csaLimits = getCsaLimits(level);
  return {
    current_level: level,
    exp,
    next_level_exp: nextLevelExp,
    available_strength: availableStrength,
    available_strength_id: appStrengthId(availableStrength),
    max_strength_rank: maxStrengthRank,
    can_use_weak: true,
    can_use_medium: maxStrengthRank >= 1,
    can_use_strong: maxStrengthRank >= 2,
    csa_active_count: activeCsaCount,
    csa_max_active: csaLimits.max_active
  };
}
__name(calculateCsaCapability, "calculateCsaCapability");

// src/engine/csa/catalog.js
var MODIFIER_MAX_LENGTH = 60;
var MODIFIER_UPGRADE_KEYWORDS = [
  "\uC0BD\uC785",
  "\uD3A0\uB77C\uD2F0\uC624",
  "\uCEE4\uB2D0\uB9C1\uAD6C\uC2A4",
  "\uC560\uB110",
  "\uD56D\uBB38\uC139\uC2A4",
  "\uC9C8\uB0B4\uC0AC\uC815",
  "\uC0AC\uC815",
  "\uC624\uB974\uAC00\uC998",
  "\uC808\uC815",
  "\uB525\uC2A4\uB85C\uD2B8",
  "\uD53C\uC2A4\uD1A4",
  "\uC790\uC704",
  "\uC131\uAE30",
  "\uC131\uAD00\uACC4",
  "\uC139\uC2A4"
];
var STRENGTH_RANK = { weak: 1, medium: 2, strong: 3 };
function isPlainObject11(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject11, "isPlainObject");
function hasKoreanBatchim(text5) {
  const trimmed = String(text5 || "").trim();
  const code = trimmed.slice(-1).codePointAt(0) || 0;
  if (code < 44032 || code > 55203) return false;
  return (code - 44032) % 28 !== 0;
}
__name(hasKoreanBatchim, "hasKoreanBatchim");
function withTopicParticle(word) {
  return `${word}${hasKoreanBatchim(word) ? "\uC740" : "\uB294"}`;
}
__name(withTopicParticle, "withTopicParticle");
function withConjParticle(word) {
  return `${word}${hasKoreanBatchim(word) ? "\uACFC" : "\uC640"}`;
}
__name(withConjParticle, "withConjParticle");
function uniqueOptions(options, canonicalize) {
  const result = [];
  const seen = /* @__PURE__ */ new Set();
  for (const option of Array.isArray(options) ? options : []) {
    if (!isPlainObject11(option)) continue;
    const id = canonicalize(option.id);
    if (!id || id === "unknown" || seen.has(id)) continue;
    seen.add(id);
    result.push({ ...option, id });
  }
  return result;
}
__name(uniqueOptions, "uniqueOptions");
function uniqueIds(values, canonicalize) {
  const result = [];
  const seen = /* @__PURE__ */ new Set();
  for (const value of Array.isArray(values) ? values : []) {
    const id = canonicalize(value);
    if (!id || id === "unknown" || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}
__name(uniqueIds, "uniqueIds");
function normalizeCompanyCsaCatalog(catalog = {}) {
  const source = isPlainObject11(catalog) ? catalog : {};
  const actor = /* @__PURE__ */ __name((value) => canonicalizeCsaGroup(value), "actor");
  const target = /* @__PURE__ */ __name((value) => canonicalizeCsaGroup(value, { target: true }), "target");
  const trigger = /* @__PURE__ */ __name((value) => canonicalizeCsaTrigger(value), "trigger");
  const duration = /* @__PURE__ */ __name((value) => canonicalizeCsaDuration(value), "duration");
  return {
    ...source,
    actor_options: uniqueOptions(source.actor_options, actor),
    target_options: uniqueOptions(source.target_options, target),
    trigger_options: uniqueOptions(source.trigger_options, trigger),
    duration_options: uniqueOptions(source.duration_options, duration),
    categories: Array.isArray(source.categories) ? source.categories : [],
    items: (Array.isArray(source.items) ? source.items : []).map((item) => ({
      ...item,
      actor_options: uniqueIds(item?.actor_options, actor),
      target_options: uniqueIds(item?.target_options, target),
      default_actor: item?.default_actor ? actor(item.default_actor) : null,
      default_target: item?.default_target ? target(item.default_target) : null,
      allowed_triggers: uniqueIds(item?.allowed_triggers, trigger),
      default_trigger: item?.default_trigger ? trigger(item.default_trigger) : "none",
      allowed_durations: uniqueIds(item?.allowed_durations, duration),
      default_duration: item?.default_duration ? duration(item.default_duration) : "continuous"
    })),
    sexual_action_contract: isPlainObject11(source.sexual_action_contract) ? source.sexual_action_contract : {}
  };
}
__name(normalizeCompanyCsaCatalog, "normalizeCompanyCsaCatalog");
function getPresetCatalogItem(catalog, templateId) {
  if (typeof templateId !== "string") return null;
  return (catalog?.items ?? []).find((item) => item.id === templateId) ?? null;
}
__name(getPresetCatalogItem, "getPresetCatalogItem");
function optionLabel(catalog, kind, id) {
  const list = catalog?.[`${kind}_options`] ?? [];
  return list.find((entry) => entry.id === id)?.label ?? "";
}
__name(optionLabel, "optionLabel");
function presetModifierClause(modifier) {
  const text5 = typeof modifier === "string" ? modifier.trim().replace(/\s+/g, " ") : "";
  return text5 ? `${text5} ` : "";
}
__name(presetModifierClause, "presetModifierClause");
function renderPresetContent(catalog, item, { actorId, targetId, triggerId, durationId, modifier } = {}) {
  const actorLabel = optionLabel(catalog, "actor", actorId);
  const targetLabel = targetId ? optionLabel(catalog, "target", targetId) : "";
  const triggerLabel = optionLabel(catalog, "trigger", triggerId);
  const durationLabel = optionLabel(catalog, "duration", durationId);
  const params = {
    actor_topic: actorLabel ? withTopicParticle(actorLabel) : "",
    target_conj: targetLabel ? withConjParticle(targetLabel) : "",
    target_possessive: targetLabel ? `${targetLabel}\uC758` : "",
    trigger_text: triggerLabel,
    duration_text: durationLabel,
    modifier_clause: presetModifierClause(modifier)
  };
  return String(item?.content_template ?? "").replace(/\{(\w+)\}/g, (match, key) => Object.prototype.hasOwnProperty.call(params, key) ? params[key] : "");
}
__name(renderPresetContent, "renderPresetContent");
function presetModifierExceedsTemplate(modifier, minimumStrength) {
  const text5 = typeof modifier === "string" ? modifier : "";
  if (!text5.trim()) return false;
  if (minimumStrength === "strong") return false;
  return MODIFIER_UPGRADE_KEYWORDS.some((keyword) => text5.includes(keyword));
}
__name(presetModifierExceedsTemplate, "presetModifierExceedsTemplate");
function buildPresetCatalogPayload(catalog, availableStrength) {
  const normalized = normalizeCompanyCsaCatalog(catalog);
  const availableRank = STRENGTH_RANK[availableStrength] ?? 1;
  return {
    version: 1,
    actor_options: normalized.actor_options,
    target_options: normalized.target_options,
    trigger_options: normalized.trigger_options,
    duration_options: normalized.duration_options,
    categories: normalized.categories,
    items: normalized.items.map((item) => ({
      id: item.id,
      category: item.category,
      label: item.label,
      strength: item.strength,
      minimum_strength: item.minimum_strength,
      available: STRENGTH_RANK[item.strength] <= availableRank,
      actor_options: item.actor_options,
      target_options: item.target_options,
      default_actor: item.default_actor,
      default_target: item.default_target,
      allowed_triggers: item.allowed_triggers,
      default_trigger: item.default_trigger,
      allowed_durations: item.allowed_durations,
      default_duration: item.default_duration,
      synergy_ids: Array.isArray(item.synergy_ids) ? item.synergy_ids : [],
      content_template: item.content_template
    }))
  };
}
__name(buildPresetCatalogPayload, "buildPresetCatalogPayload");

// src/engine/csa/transaction-planner.js
var OPERATION_ORDER = { deactivate: 0, update: 1, activate: 2 };
var MAX_OPERATIONS = 12;
var MAX_CONTENT_LENGTH = 300;
function isPlainObject12(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject12, "isPlainObject");
function appIssue(operation, code, message, operationIndex = null) {
  return {
    operation_index: operationIndex,
    client_id: typeof operation?.client_id === "string" ? operation.client_id : null,
    domain: typeof operation?.domain === "string" ? operation.domain : null,
    operation: typeof operation?.operation === "string" ? operation.operation : null,
    code,
    message
  };
}
__name(appIssue, "appIssue");
function normalizeAppContent(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}
__name(normalizeAppContent, "normalizeAppContent");
function summarizeOperations(operations) {
  const summary = { total: operations.length, csa_activate: 0, csa_update: 0, csa_deactivate: 0 };
  for (const operation of operations) {
    const key = `csa_${operation.operation}`;
    if (Object.prototype.hasOwnProperty.call(summary, key)) summary[key] += 1;
  }
  return summary;
}
__name(summarizeOperations, "summarizeOperations");
function nextCsaId(existingIds, turnNumber) {
  let candidate = `csa_${turnNumber}`;
  let suffix = 1;
  while (existingIds.includes(candidate)) {
    candidate = `csa_${turnNumber}_${suffix}`;
    suffix += 1;
  }
  return candidate;
}
__name(nextCsaId, "nextCsaId");
function validatePresetOperation(catalog, raw, { availableStrength } = {}) {
  const normalizedCatalog = normalizeCompanyCsaCatalog(catalog);
  const preset = isPlainObject12(raw?.preset) ? raw.preset : null;
  if (!preset) return { ok: false, code: "PRESET_REQUIRED", message: "\uD504\uB9AC\uC14B \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." };
  const item = getPresetCatalogItem(normalizedCatalog, preset.template_id);
  if (!item) return { ok: false, code: "PRESET_NOT_FOUND", message: "\uC54C \uC218 \uC5C6\uB294 \uD504\uB9AC\uC14B\uC785\uB2C8\uB2E4." };
  const requestedStrength = typeof raw?.strength === "string" ? raw.strength.trim() : "";
  const catalogStrength = item.strength || item.minimum_strength;
  if (!Object.prototype.hasOwnProperty.call(APP_STRENGTH_RANK, requestedStrength)) {
    return { ok: false, code: "CSA_PRESET_STRENGTH_INVALID", message: "\uD504\uB9AC\uC14B \uAC15\uB3C4\uB97C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694." };
  }
  const availableRank = APP_STRENGTH_RANK[availableStrength] ?? 1;
  if (APP_STRENGTH_RANK[requestedStrength] > availableRank || APP_STRENGTH_RANK[catalogStrength] > availableRank) {
    return { ok: false, code: "STRENGTH_LOCKED", message: "\uD604\uC7AC \uB808\uBCA8\uC5D0\uC11C \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uB294 \uD504\uB9AC\uC14B\uC785\uB2C8\uB2E4." };
  }
  if (requestedStrength !== catalogStrength) {
    return { ok: false, code: "CSA_PRESET_STRENGTH_MISMATCH", message: "\uC120\uD0DD\uD55C \uAC15\uB3C4\uC640 \uD504\uB9AC\uC14B \uB4F1\uAE09\uC774 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." };
  }
  const actorId = canonicalizeCsaGroup(preset.actor_group);
  if (!item.actor_options.includes(actorId)) return { ok: false, code: "PRESET_ACTOR_INVALID", message: "\uC774 \uD504\uB9AC\uC14B\uC5D0\uC11C \uC120\uD0DD\uD560 \uC218 \uC5C6\uB294 \uD589\uB3D9 \uC8FC\uCCB4\uC785\uB2C8\uB2E4." };
  const targetId = preset.target_group ? canonicalizeCsaGroup(preset.target_group, { target: true }) : "";
  if (item.target_options.length) {
    if (!item.target_options.includes(targetId)) return { ok: false, code: "PRESET_TARGET_INVALID", message: "\uC774 \uD504\uB9AC\uC14B\uC5D0\uC11C \uC120\uD0DD\uD560 \uC218 \uC5C6\uB294 \uC0C1\uB300\uC785\uB2C8\uB2E4." };
    if (targetId === actorId) return { ok: false, code: "PRESET_ACTOR_TARGET_CONFLICT", message: "\uD589\uB3D9 \uC8FC\uCCB4\uC640 \uC0C1\uB300\uAC00 \uAC19\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." };
  } else if (targetId) {
    return { ok: false, code: "PRESET_TARGET_INVALID", message: "\uC774 \uD504\uB9AC\uC14B\uC740 \uC0C1\uB300\uB97C \uC9C0\uC815\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." };
  }
  const triggerId = canonicalizeCsaTrigger(preset.trigger);
  if (!item.allowed_triggers.includes(triggerId)) return { ok: false, code: "PRESET_TRIGGER_INVALID", message: "\uC774 \uD504\uB9AC\uC14B\uC5D0\uC11C \uC120\uD0DD\uD560 \uC218 \uC5C6\uB294 \uBC1C\uB3D9 \uC0C1\uD669\uC785\uB2C8\uB2E4." };
  const durationId = canonicalizeCsaDuration(preset.duration);
  if (!item.allowed_durations.includes(durationId)) return { ok: false, code: "PRESET_DURATION_INVALID", message: "\uC774 \uD504\uB9AC\uC14B\uC5D0\uC11C \uC120\uD0DD\uD560 \uC218 \uC5C6\uB294 \uC9C0\uC18D \uC870\uAC74\uC785\uB2C8\uB2E4." };
  const modifier = typeof preset.modifier === "string" ? preset.modifier.trim().replace(/\s+/g, " ") : "";
  if (modifier.length > MODIFIER_MAX_LENGTH) return { ok: false, code: "PRESET_MODIFIER_TOO_LONG", message: `\uC138\uBD80 \uC218\uC2DD\uC5B4\uB294 ${MODIFIER_MAX_LENGTH}\uC790 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.` };
  if (presetModifierExceedsTemplate(modifier, catalogStrength)) return { ok: false, code: "PRESET_MODIFIER_EXCEEDS_STRENGTH", message: "\uC138\uBD80 \uC218\uC2DD\uC5B4\uAC00 \uC774 \uD504\uB9AC\uC14B\uC758 \uAC15\uB3C4\uB97C \uB118\uC5B4\uC12D\uB2C8\uB2E4." };
  const content = renderPresetContent(normalizedCatalog, item, { actorId, targetId: targetId || null, triggerId, durationId, modifier });
  return {
    ok: true,
    content,
    strength: catalogStrength,
    preset: {
      version: 1,
      template_id: item.id,
      actor_group: actorId,
      target_group: targetId || null,
      trigger: triggerId,
      duration: durationId,
      modifier,
      required_action: item.required_action,
      public_normalization: item.public_normalization === true,
      persistent: item.persistent === true,
      direct_meaning_tags: item.direct_meaning_tags
    }
  };
}
__name(validatePresetOperation, "validatePresetOperation");
function planCsaTransaction(previousSave, catalog, rawOperations, { turnNumber, capability } = {}) {
  if (!Array.isArray(rawOperations) || !rawOperations.length) {
    return { ok: false, status: 422, error_code: "NO_CHANGES", issues: [appIssue(null, "NO_CHANGES", "\uC801\uC6A9\uD560 \uBCC0\uACBD\uC0AC\uD56D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.")] };
  }
  if (rawOperations.length > MAX_OPERATIONS) {
    return { ok: false, status: 422, error_code: "TOO_MANY_OPERATIONS", issues: [appIssue(null, "TOO_MANY_OPERATIONS", "\uD55C \uBC88\uC5D0 \uCD5C\uB300 12\uAC1C \uC791\uC5C5\uB9CC \uC801\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")] };
  }
  const availableStrengthId = capability?.available_strength_id ?? "weak";
  const availableRank = APP_STRENGTH_RANK[availableStrengthId] ?? 1;
  const csaLimits = getCsaLimits(capability?.current_level ?? 1);
  const activeIds = Array.isArray(previousSave?.csa_active) ? [...previousSave.csa_active] : [];
  const rules = { ...getCsaRules(previousSave) };
  const issues = [];
  const seenClientIds = /* @__PURE__ */ new Set();
  const seenTargets = /* @__PURE__ */ new Set();
  const canonicalOperations = [];
  const ordered = rawOperations.map((operation, index) => ({ operation, index })).sort((a, b) => (OPERATION_ORDER[a.operation?.operation] ?? 99) - (OPERATION_ORDER[b.operation?.operation] ?? 99) || a.index - b.index);
  for (const { operation: raw, index } of ordered) {
    if (!isPlainObject12(raw) || raw.domain !== "csa" || !["activate", "update", "deactivate"].includes(raw.operation) || typeof raw.client_id !== "string" || !raw.client_id.trim() || raw.client_id.length > 80) {
      issues.push(appIssue(raw, "INVALID_OPERATION", "\uC0C1\uC2DD\uAC1C\uBCC0 \uC791\uC5C5 \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", index));
      continue;
    }
    if (seenClientIds.has(raw.client_id)) {
      issues.push(appIssue(raw, "DUPLICATE_TARGET", "\uAC19\uC740 \uC791\uC5C5 \uC2DD\uBCC4\uC790\uAC00 \uC911\uBCF5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", index));
      continue;
    }
    seenClientIds.add(raw.client_id);
    const id = typeof raw.id === "string" && raw.id.trim().length <= 120 ? raw.id.trim() : "";
    if (raw.operation !== "activate") {
      if (seenTargets.has(id)) {
        issues.push(appIssue(raw, "DUPLICATE_TARGET", "\uAC19\uC740 \uC0C1\uC2DD\uAC1C\uBCC0\uC744 \uB450 \uBC88 \uBCC0\uACBD\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", index));
        continue;
      }
      seenTargets.add(id);
    }
    const content = normalizeAppContent(raw.content);
    const strength = typeof raw.strength === "string" ? raw.strength.trim() : "";
    const validateContent = /* @__PURE__ */ __name(() => {
      if (!content) {
        issues.push(appIssue(raw, "CONTENT_REQUIRED", "\uB0B4\uC6A9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.", index));
        return false;
      }
      if (content.length > MAX_CONTENT_LENGTH) {
        issues.push(appIssue(raw, "CONTENT_TOO_LONG", `\uB0B4\uC6A9\uC740 ${MAX_CONTENT_LENGTH}\uC790 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.`, index));
        return false;
      }
      return true;
    }, "validateContent");
    const validateStrength = /* @__PURE__ */ __name(() => {
      if (!APP_STRENGTHS.has(strength) || APP_STRENGTH_RANK[strength] > availableRank) {
        issues.push(appIssue(raw, "STRENGTH_LOCKED", "\uD604\uC7AC \uB808\uBCA8\uC5D0\uC11C \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uB294 \uAC15\uB3C4\uC785\uB2C8\uB2E4.", index));
        return null;
      }
      return APP_STRENGTH_LABELS[strength];
    }, "validateStrength");
    const activeContents = /* @__PURE__ */ __name(() => activeIds.filter((activeId) => activeId !== id).map((activeId) => normalizeAppContent(rules[activeId]?.content)), "activeContents");
    const isPresetOperation = raw.source_type === "preset";
    if (raw.operation === "activate") {
      if (isPresetOperation) {
        const validated = validatePresetOperation(catalog, raw, { availableStrength: availableStrengthId });
        if (!validated.ok) {
          issues.push(appIssue(raw, validated.code, validated.message, index));
          continue;
        }
        if (activeContents().includes(validated.content)) {
          issues.push(appIssue(raw, "DUPLICATE_TARGET", "\uAC19\uC740 \uBC94\uC704\uC5D0 \uB3D9\uC77C\uD55C \uD65C\uC131 \uC0C1\uC2DD\uAC1C\uBCC0\uC774 \uC788\uC2B5\uB2C8\uB2E4.", index));
          continue;
        }
        const newId2 = nextCsaId(Object.keys(rules), turnNumber);
        rules[newId2] = { active: true, content: validated.content, strength: validated.strength, ...normalizeCsaScope(), created_turn: turnNumber, source_type: "preset", preset: validated.preset };
        activeIds.push(newId2);
        canonicalOperations.push({ version: 1, client_id: raw.client_id, domain: "csa", operation: "activate", strength: validated.strength, scope_type: "world", content: validated.content, source_type: "preset", preset: validated.preset });
        continue;
      }
      const storageStrength2 = validateStrength();
      if (!validateContent() || !storageStrength2) continue;
      if (activeContents().includes(content)) {
        issues.push(appIssue(raw, "DUPLICATE_TARGET", "\uAC19\uC740 \uBC94\uC704\uC5D0 \uB3D9\uC77C\uD55C \uD65C\uC131 \uC0C1\uC2DD\uAC1C\uBCC0\uC774 \uC788\uC2B5\uB2C8\uB2E4.", index));
        continue;
      }
      const semanticContract2 = raw.semantic_contract ? normalizeCsaSemanticContract(raw.semantic_contract) : null;
      const newId = nextCsaId(Object.keys(rules), turnNumber);
      rules[newId] = { active: true, content, strength, ...normalizeCsaScope(), created_turn: turnNumber, source_type: "custom", preset: null, semantic_contract: semanticContract2 };
      activeIds.push(newId);
      canonicalOperations.push({ version: 1, client_id: raw.client_id, domain: "csa", operation: "activate", strength, scope_type: "world", content, source_type: "custom", semantic_contract: semanticContract2 });
      continue;
    }
    const target = rules[id];
    if (!target) {
      issues.push(appIssue(raw, "CSA_NOT_FOUND", "\uB300\uC0C1 \uC0C1\uC2DD\uAC1C\uBCC0\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.", index));
      continue;
    }
    if (!target.active || !activeIds.includes(id)) {
      issues.push(appIssue(raw, "CSA_INACTIVE", "\uC774\uBBF8 \uBE44\uD65C\uC131\uD654\uB41C \uC0C1\uC2DD\uAC1C\uBCC0\uC785\uB2C8\uB2E4.", index));
      continue;
    }
    if (raw.operation === "deactivate") {
      rules[id] = { ...target, active: false, updated_turn: turnNumber };
      const at = activeIds.indexOf(id);
      if (at !== -1) activeIds.splice(at, 1);
      canonicalOperations.push({ version: 1, client_id: raw.client_id, domain: "csa", operation: "deactivate", id });
      continue;
    }
    if (isPresetOperation) {
      const validated = validatePresetOperation(catalog, raw, { availableStrength: availableStrengthId });
      if (!validated.ok) {
        issues.push(appIssue(raw, validated.code, validated.message, index));
        continue;
      }
      if (normalizeAppContent(target.content) === validated.content && target.strength === validated.strength) {
        issues.push(appIssue(raw, "NO_CHANGES", "\uC0C1\uC2DD\uAC1C\uBCC0\uC758 \uC2E4\uC81C \uBCC0\uACBD\uC0AC\uD56D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", index));
        continue;
      }
      if (activeContents().includes(validated.content)) {
        issues.push(appIssue(raw, "DUPLICATE_TARGET", "\uAC19\uC740 \uBC94\uC704\uC5D0 \uB3D9\uC77C\uD55C \uD65C\uC131 \uC0C1\uC2DD\uAC1C\uBCC0\uC774 \uC788\uC2B5\uB2C8\uB2E4.", index));
        continue;
      }
      rules[id] = { ...target, content: validated.content, strength: validated.strength, ...normalizeCsaScope(), updated_turn: turnNumber, source_type: "preset", preset: validated.preset };
      canonicalOperations.push({ version: 1, client_id: raw.client_id, domain: "csa", operation: "update", id, strength: validated.strength, scope_type: "world", content: validated.content, source_type: "preset", preset: validated.preset });
      continue;
    }
    const storageStrength = validateStrength();
    if (!validateContent() || !storageStrength) continue;
    if (normalizeAppContent(target.content) === content && target.strength === strength) {
      issues.push(appIssue(raw, "NO_CHANGES", "\uC0C1\uC2DD\uAC1C\uBCC0\uC758 \uC2E4\uC81C \uBCC0\uACBD\uC0AC\uD56D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", index));
      continue;
    }
    if (activeContents().includes(content)) {
      issues.push(appIssue(raw, "DUPLICATE_TARGET", "\uAC19\uC740 \uBC94\uC704\uC5D0 \uB3D9\uC77C\uD55C \uD65C\uC131 \uC0C1\uC2DD\uAC1C\uBCC0\uC774 \uC788\uC2B5\uB2C8\uB2E4.", index));
      continue;
    }
    const semanticContract = raw.semantic_contract ? normalizeCsaSemanticContract(raw.semantic_contract) : target.semantic_contract || null;
    rules[id] = { ...target, content, strength, ...normalizeCsaScope(), updated_turn: turnNumber, source_type: "custom", preset: null, semantic_contract: semanticContract };
    canonicalOperations.push({ version: 1, client_id: raw.client_id, domain: "csa", operation: "update", id, strength, scope_type: "world", content, source_type: "custom", semantic_contract: semanticContract });
  }
  if (issues.length) {
    const error_code = issues.length === 1 && issues[0]?.code === "CSA_PRESET_STRENGTH_MISMATCH" ? "CSA_PRESET_STRENGTH_MISMATCH" : "APP_ACTION_INVALID";
    return { ok: false, status: 422, error_code, issues };
  }
  if (activeIds.length > csaLimits.max_active) {
    return { ok: false, status: 422, error_code: "CSA_SLOT_FULL", issues: [appIssue(null, "CSA_SLOT_FULL", "\uC0C1\uC2DD\uAC1C\uBCC0 \uD65C\uC131 \uC2AC\uB86F\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4.")] };
  }
  const summary = summarizeOperations(canonicalOperations);
  return {
    ok: true,
    canonical_action: { version: 1, type: "app_transaction", base_turn_count: turnNumber - 1, operations: canonicalOperations },
    display_input: `\uC0C1\uC2DD\uAC1C\uBCC0 \uC571\uC5D0\uC11C \uC0C1\uC2DD\uAC1C\uBCC0 ${canonicalOperations.length}\uAC74\uC758 \uBCC0\uACBD\uC0AC\uD56D\uC744 \uC801\uC6A9\uD55C\uB2E4.`,
    summary,
    next_csa_active: activeIds,
    next_csa_rules: rules
  };
}
__name(planCsaTransaction, "planCsaTransaction");

// src/engine/csa/transaction-validator.js
function isPlainObject13(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject13, "isPlainObject");
function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().filter((key) => value[key] !== void 0).map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}
__name(stableStringify, "stableStringify");
function bytesToBase64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(bytesToBase64url, "bytesToBase64url");
async function sha256Base64url(text5) {
  return bytesToBase64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text5))));
}
__name(sha256Base64url, "sha256Base64url");
async function signAppValidationProof(secret, payload) {
  if (!secret) throw new Error("app validation signing secret unavailable");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToBase64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`company-app-validation-v1
${stableStringify(payload)}`))));
}
__name(signAppValidationProof, "signAppValidationProof");
async function verifyAppValidationProof(secret, payload, signature) {
  if (typeof signature !== "string" || !signature) return false;
  return await signAppValidationProof(secret, payload) === signature;
}
__name(verifyAppValidationProof, "verifyAppValidationProof");
function normalizeStructuredAction(rawAction) {
  if (!isPlainObject13(rawAction) || rawAction.type !== "app_transaction") return null;
  if (!Number.isInteger(rawAction.base_turn_count) || rawAction.base_turn_count < 0) return null;
  if (!Array.isArray(rawAction.operations) || !rawAction.operations.length) return null;
  if (rawAction.operations.some((operation) => operation?.domain !== "csa")) return null;
  return { version: 1, type: "app_transaction", base_turn_count: rawAction.base_turn_count, operations: rawAction.operations };
}
__name(normalizeStructuredAction, "normalizeStructuredAction");
function collectSemanticStrengthCandidates(previousSave, canonicalAction, csaRules) {
  return canonicalAction.operations.flatMap((operation) => {
    if (operation.domain !== "csa" || !["activate", "update"].includes(operation.operation) || operation.source_type === "preset") return [];
    const previous = operation.operation === "update" ? csaRules?.[operation.id] : null;
    const contentChanged = operation.operation === "activate" || normalizeAppContent(previous?.content) !== normalizeAppContent(operation.content);
    const strengthChanged = operation.operation === "activate" || previous?.strength !== operation.strength;
    return contentChanged || strengthChanged ? [{ client_id: operation.client_id, domain: "csa", operation: operation.operation, selected_strength: operation.strength, content: operation.content }] : [];
  });
}
__name(collectSemanticStrengthCandidates, "collectSemanticStrengthCandidates");
function buildAppStrengthValidationPrompt(candidates) {
  return `\uB108\uB294 \uC0C1\uC2DD\uAC1C\uBCC0 \uC571\uC5D0 \uC785\uB825\uB41C \uC0AC\uD68C \uADDC\uBC94\uC758 \uCD5C\uC18C \uD544\uC694 \uAC15\uB3C4\uB97C \uD310\uC815\uD55C\uB2E4.

\uAC01 \uC785\uB825\uB9C8\uB2E4 weak, medium, strong, unsupported \uC911 \uD558\uB098\uB97C \uBC18\uD658\uD55C\uB2E4.
- weak: \uBD84\uC704\uAE30\xB7\uB300\uD654\xB7\uAC00\uBCBC\uC6B4 \uC811\uCD09\xB7\uBD80\uB044\uB7EC\uC6C0 \uC644\uD654 \uC218\uC900
- medium: \uD2B9\uC815 \uACF5\uAC04\uC758 \uC81C\uD55C\uC801 \uD589\uB3D9\xB7\uB178\uCD9C\xB7\uC811\uCD09\uC744 \uC815\uC0C1 \uC808\uCC28\uB85C \uC7AC\uD574\uC11D
- strong: \uACF5\uAC04 \uC804\uCCB4\uC758 \uC5C5\uBB34\xB7\uC808\uCC28\xB7\uC608\uC808\xB7\uD575\uC2EC \uAE08\uAE30\uB97C \uC9C1\uC811 \uC7AC\uC791\uC131
- unsupported: \uBB3C\uB9AC\uC801\uC73C\uB85C \uBD88\uAC00\uB2A5\uD558\uAC70\uB098 \uC138\uACC4 \uADDC\uCE59\uC744 \uBB34\uC2DC\uD558\uAC70\uB098 \uC989\uAC01\uC801\uC778 \uC790\uAE30\uD30C\uAD34\uB97C \uC694\uAD6C

\uAC15\uB3C4\uB294 \uD655\uC2E0\uACFC \uC0AC\uD68C\uC801 \uC555\uB825\uB9CC \uBC14\uAFB8\uBA70 \uBB38\uC7A5\uC758 \uC758\uBBF8 \uBC94\uC704\uB97C \uD655\uB300\uD558\uC9C0 \uC54A\uB294\uB2E4.
selected_strength\uC5D0 \uB9DE\uCDB0 required_strength\uB97C \uB0AE\uCD94\uC9C0 \uC54A\uB294\uB2E4.
\uBAA8\uB4E0 \uD6C4\uBCF4\uC5D0 \uC815\uD655\uD788 \uD558\uB098\uC758 \uACB0\uACFC\uB97C \uBC18\uD658\uD558\uACE0 client_id\uB97C \uADF8\uB300\uB85C \uBCF5\uC0AC\uD55C\uB2E4.
custom \uC0C1\uC2DD\uAC1C\uBCC0\uC5D0\uB294 semantic_contract\uB3C4 \uBC18\uD658\uD55C\uB2E4. \uC8FC\uC5B4\xB7\uB300\uC0C1\xB7\uBC29\uD5A5\uC744 \uB4A4\uC9D1\uC9C0 \uB9D0\uACE0, \uC124\uBA85\xB7\uC0C1\uB2F4\xB7\uC9C8\uBB38\xB7\uD3C9\uAC00\xB7\uC8FC\uBCC0 \uC815\uC0C1\uD654\uB294 direct sexual authorization\uC774 \uC544\uB2C8\uB2E4. \uC131\uC801 \uD589\uB3D9 \uC885\uB958, actor/target/direction/action/trigger \uC911 \uD558\uB098\uB77C\uB3C4 \uBD88\uBA85\uD655\uD558\uBA74 confidence="ambiguous"\uC640 actions=[]\uC744 \uC4F4\uB2E4. ambiguous sexual contract\uB294 \uD5C8\uC6A9\uB418\uC9C0 \uC54A\uB294\uB2E4.
reason\uC740 80\uC790 \uC774\uD558 \uD55C\uAD6D\uC5B4 \uBB38\uC7A5\uC73C\uB85C \uC791\uC131\uD558\uACE0 JSON \uC774\uC678\uC758 \uD14D\uC2A4\uD2B8\uB97C \uCD9C\uB825\uD558\uC9C0 \uC54A\uB294\uB2E4.

[\uD310\uC815 \uB300\uC0C1]
${JSON.stringify(candidates)}

[\uC694\uAD6C JSON]
{"results":[{"client_id":"\uC785\uB825\uAC12 \uADF8\uB300\uB85C","required_strength":"weak|medium|strong|unsupported","reason":"80\uC790 \uC774\uD558 \uC774\uC720","semantic_contract":{"version":1,"sexual_authorization":false,"directions":[],"actions":[],"actor_group":"unknown","target_group":"unknown","trigger":"custom_condition","duration":"continuous","public_normalization":false,"direct_execution":false,"confidence":"exact|ambiguous"}}]}`;
}
__name(buildAppStrengthValidationPrompt, "buildAppStrengthValidationPrompt");
async function classifyAppOperationStrengths(candidates, requestJson) {
  if (!candidates.length) return [];
  const parsed = await requestJson(buildAppStrengthValidationPrompt(candidates));
  const rows = Array.isArray(parsed?.results) ? parsed.results : [];
  const expected = new Set(candidates.map((item) => item.client_id));
  if (rows.length !== candidates.length || new Set(rows.map((item) => item?.client_id)).size !== expected.size || rows.some((item) => !expected.has(item?.client_id) || !["weak", "medium", "strong", "unsupported"].includes(item?.required_strength))) {
    throw new Error("invalid strength validation response");
  }
  return rows.map((item) => ({
    client_id: item.client_id,
    required_strength: item.required_strength,
    reason: typeof item.reason === "string" ? item.reason.slice(0, 160) : "",
    raw_semantic_contract: isPlainObject13(item.semantic_contract) ? item.semantic_contract : {},
    semantic_contract: normalizeCsaSemanticContract(item.semantic_contract)
  }));
}
__name(classifyAppOperationStrengths, "classifyAppOperationStrengths");
function semanticStrengthIssues(candidates, results, availableStrength) {
  const byId = new Map(results.map((item) => [item.client_id, item]));
  const availableRank = APP_STRENGTH_RANK[availableStrength] || 1;
  return candidates.flatMap((candidate) => {
    const result = byId.get(candidate.client_id);
    const requiredRank = APP_STRENGTH_RANK[result.required_strength] || 0;
    const selectedRank = APP_STRENGTH_RANK[candidate.selected_strength] || 0;
    if (result.required_strength === "unsupported") {
      return [{ client_id: candidate.client_id, domain: candidate.domain, operation: candidate.operation, code: "CONTENT_OUTSIDE_APP_CAPABILITY", message: "\uC774 \uB0B4\uC6A9\uC740 \uAC15\uD55C \uB2E8\uACC4\uC5D0\uC11C\uB3C4 \uC801\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", selected_strength: candidate.selected_strength, required_strength: "unsupported" }];
    }
    const contractValidation = validateCustomCsaSemanticContract({ rawContract: result.raw_semantic_contract, normalizedContract: result.semantic_contract });
    if (!contractValidation.ok) return [{ client_id: candidate.client_id, domain: candidate.domain, operation: candidate.operation, code: contractValidation.code, message: contractValidation.message }];
    if (requiredRank > availableRank) {
      return [{ client_id: candidate.client_id, domain: candidate.domain, operation: candidate.operation, code: "CONTENT_STRENGTH_LOCKED", message: `\uC774 \uB0B4\uC6A9\uC740 ${APP_STRENGTH_LABELS[result.required_strength]} \uB2E8\uACC4\uAC00 \uD544\uC694\uD558\uC9C0\uB9CC \uD604\uC7AC \uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uB2E8\uACC4\uB294 ${APP_STRENGTH_LABELS[availableStrength]}\uC785\uB2C8\uB2E4.`, selected_strength: candidate.selected_strength, required_strength: result.required_strength, available_strength: availableStrength, reason: result.reason }];
    }
    if (requiredRank > selectedRank) {
      return [{ client_id: candidate.client_id, domain: candidate.domain, operation: candidate.operation, code: "CONTENT_REQUIRES_HIGHER_STRENGTH", message: `\uC774 \uB0B4\uC6A9\uC740 ${APP_STRENGTH_LABELS[result.required_strength]} \uC0C1\uC2DD\uAC1C\uBCC0 \uAC15\uB3C4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4. \uC120\uD0DD \uAC15\uB3C4\uB97C \uBCC0\uACBD\uD574 \uC8FC\uC138\uC694.`, selected_strength: candidate.selected_strength, required_strength: result.required_strength, available_strength: availableStrength, suggested_strength: result.required_strength, reason: result.reason }];
    }
    return [];
  });
}
__name(semanticStrengthIssues, "semanticStrengthIssues");
async function verifyStructuredActionValidation(secret, gameId, structuredAction) {
  if (structuredAction?.type !== "app_transaction") return { ok: true };
  const semantic = structuredAction.semantic_validation;
  if (!isPlainObject13(semantic) || typeof structuredAction.validation_proof !== "string" || semantic.game_id !== gameId || semantic.base_turn_count !== structuredAction.base_turn_count) return { ok: false, reason: "missing or mismatched proof" };
  const actionDigest = await sha256Base64url(stableStringify({ version: structuredAction.version, type: structuredAction.type, base_turn_count: structuredAction.base_turn_count, operations: structuredAction.operations }));
  if (semantic.action_digest !== actionDigest) return { ok: false, reason: "action digest mismatch" };
  const results = Array.isArray(semantic.results) ? semantic.results : [];
  const mutableOperations = structuredAction.operations.filter((item) => ["activate", "update"].includes(item?.operation));
  const byClientId = new Map(mutableOperations.map((item) => [item.client_id, item]));
  if (new Set(results.map((item) => item?.client_id)).size !== results.length || results.some((item) => !byClientId.has(item?.client_id) || !["weak", "medium", "strong", "unsupported"].includes(item?.required_strength))) {
    return { ok: false, reason: "semantic result mismatch" };
  }
  if (semantic.version !== 1) return { ok: false, reason: "unsupported semantic validation version" };
  const payload = { game_id: gameId, base_turn_count: structuredAction.base_turn_count, action_digest: actionDigest, semantic_results: results };
  return await verifyAppValidationProof(secret, payload, structuredAction.validation_proof) ? { ok: true } : { ok: false, reason: "signature mismatch" };
}
__name(verifyStructuredActionValidation, "verifyStructuredActionValidation");

// src/engine/csa/reducer.js
function isPlainObject14(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject14, "isPlainObject");
var DONOR_STATUS_TO_EXECUTION_STATE = { inactive: "not_started", active: "executed", paused: "interrupted", ended: "not_started" };
function normalizeRuntimeEntry(entry = {}) {
  return {
    lifecycle: ["active", "deactivated"].includes(entry?.lifecycle) ? entry.lifecycle : "active",
    applicability: ["applicable", "not_applicable", "unknown"].includes(entry?.applicability) ? entry.applicability : "unknown",
    execution_state: ["not_started", "proposed", "executed", "refused", "interrupted"].includes(entry?.execution_state) ? entry.execution_state : "not_started",
    character_id: typeof entry?.character_id === "string" && entry.character_id ? entry.character_id : null,
    started_turn: Number.isInteger(entry?.started_turn) ? entry.started_turn : null,
    last_confirmed_turn: Number.isInteger(entry?.last_confirmed_turn) ? entry.last_confirmed_turn : null,
    end_reason: typeof entry?.end_reason === "string" && entry.end_reason ? entry.end_reason.slice(0, 100) : null
  };
}
__name(normalizeRuntimeEntry, "normalizeRuntimeEntry");
var TRIGGER_STATUS_TO_EXECUTION_STATE = { not_satisfied: "not_started", ended: "not_started", temporarily_interrupted: "interrupted" };
function buildCsaRuntimeStatePatch({ previousSave, csaRuntimeUpdates = [], csaTriggerEvaluations = [], activeCsa = [], npcsPresent = [], turnNumber } = {}) {
  const previous = isPlainObject14(previousSave?.csa_runtime_state) ? previousSave.csa_runtime_state : {};
  const presentIds = new Set(Array.isArray(npcsPresent) ? npcsPresent.filter((id) => typeof id === "string" && id) : []);
  const activeById = new Map(activeCsa.map((item) => [item.id, item]));
  const next = {};
  const touchedByRuntimeUpdate = /* @__PURE__ */ new Set();
  let changed = false;
  for (const [csaId, entry] of Object.entries(previous)) {
    const normalized = normalizeRuntimeEntry(entry);
    const stillTrackable = activeById.has(csaId) && activeById.get(csaId)?.source_type === "preset";
    if (!stillTrackable && normalized.lifecycle !== "deactivated") {
      next[csaId] = { ...normalized, lifecycle: "deactivated", execution_state: "not_started", end_reason: normalized.end_reason || "\uC0C1\uC2DD\uAC1C\uBCC0 \uBE44\uD65C\uC131\uD654 \uB610\uB294 \uD574\uC81C" };
      changed = true;
    } else {
      next[csaId] = normalized;
    }
  }
  for (const update of Array.isArray(csaRuntimeUpdates) ? csaRuntimeUpdates : []) {
    if (!isPlainObject14(update)) continue;
    const csaId = typeof update.csa_id === "string" ? update.csa_id : "";
    const csa = activeById.get(csaId);
    if (!csa || csa.source_type !== "preset") continue;
    const characterId = typeof update.character_id === "string" ? update.character_id : "";
    if (!characterId || !presentIds.has(characterId)) continue;
    const donorStatus = ["inactive", "active", "paused", "ended"].includes(update.status) ? update.status : null;
    if (!donorStatus) continue;
    touchedByRuntimeUpdate.add(csaId);
    const existing = previous[csaId] ? normalizeRuntimeEntry(previous[csaId]) : null;
    const executionState = DONOR_STATUS_TO_EXECUTION_STATE[donorStatus];
    next[csaId] = {
      lifecycle: "active",
      applicability: "applicable",
      execution_state: executionState,
      character_id: characterId,
      started_turn: executionState === "executed" ? existing?.started_turn ?? turnNumber : existing?.started_turn ?? null,
      last_confirmed_turn: turnNumber,
      end_reason: donorStatus === "ended" ? typeof update.reason === "string" && update.reason.trim() ? update.reason.trim().slice(0, 100) : existing?.end_reason ?? null : null
    };
    changed = true;
  }
  for (const evaluation of Array.isArray(csaTriggerEvaluations) ? csaTriggerEvaluations : []) {
    if (!isPlainObject14(evaluation)) continue;
    const csaId = typeof evaluation.csa_id === "string" ? evaluation.csa_id : "";
    const csa = activeById.get(csaId);
    if (!csa || csa.source_type !== "preset" || touchedByRuntimeUpdate.has(csaId)) continue;
    const executionState = TRIGGER_STATUS_TO_EXECUTION_STATE[evaluation.status];
    if (!executionState) continue;
    const existing = next[csaId] ? next[csaId] : previous[csaId] ? normalizeRuntimeEntry(previous[csaId]) : normalizeRuntimeEntry();
    if (existing.execution_state === executionState) continue;
    next[csaId] = { ...existing, execution_state: executionState, last_confirmed_turn: turnNumber };
    changed = true;
  }
  return changed ? next : null;
}
__name(buildCsaRuntimeStatePatch, "buildCsaRuntimeStatePatch");
function buildCsaAftereffectPatch({ previousSave, deactivatedIds = [], npcsPresent = [], turnNumber = 0 } = {}) {
  const previous = isPlainObject14(previousSave?.csa_aftereffect_state) ? structuredClone(previousSave.csa_aftereffect_state) : {};
  let changed = false;
  const present = new Set((Array.isArray(npcsPresent) ? npcsPresent : []).filter((id) => typeof id === "string"));
  for (const [characterId, entries2] of Object.entries(previous)) {
    if (!present.has(characterId) || !isPlainObject14(entries2)) continue;
    for (const [csaId, state] of Object.entries(entries2)) {
      if (!isPlainObject14(state) || state.phase === "integrated") continue;
      if (state.phase === "shock") entries2[csaId] = { ...state, phase: "processing", processed_encounters: 1, last_processed_turn: turnNumber };
      else if (state.phase === "processing" && Number(state.processed_encounters) >= Number(state.required_processing_encounters || 1)) entries2[csaId] = { ...state, phase: "integrated", last_processed_turn: turnNumber };
      else entries2[csaId] = { ...state, processed_encounters: Number(state.processed_encounters || 0) + 1, last_processed_turn: turnNumber };
      changed = true;
    }
  }
  const rules = isPlainObject14(previousSave?.csa_rules) ? previousSave.csa_rules : {};
  const runtime = isPlainObject14(previousSave?.csa_runtime_state) ? previousSave.csa_runtime_state : {};
  for (const csaId of deactivatedIds) {
    const csa = rules[csaId];
    const runtimeEntry = runtime[csaId];
    const characterId = runtimeEntry?.execution_state === "executed" && typeof runtimeEntry.character_id === "string" && runtimeEntry.character_id ? runtimeEntry.character_id : null;
    if (!csa || !characterId) continue;
    const rank = { weak: 1, medium: 2, strong: 3 }[csa.strength] || 1;
    previous[characterId] ||= {};
    previous[characterId][csaId] = {
      phase: "shock",
      strength: csa.strength || "weak",
      started_turn: turnNumber,
      last_processed_turn: turnNumber,
      processed_encounters: 0,
      required_processing_encounters: rank >= 3 ? 3 : rank === 2 ? 2 : 1,
      canonical_content: csa.content || ""
    };
    changed = true;
  }
  return changed ? previous : null;
}
__name(buildCsaAftereffectPatch, "buildCsaAftereffectPatch");

// src/engine/csa/prompt-sections.js
function buildCsaRuntimeSection() {
  return `

[COMMON-SENSE CHANGE RUNTIME CONTRACT \u2014 HIGH PRIORITY]
- \uC774 \uBC84\uC804\uC758 \uC720\uC77C\uD55C \uC815\uC2E0 \uD6A8\uACFC\uB294 \uACF5\uAC04 \uAE30\uBC18 \uC0C1\uC2DD\uAC1C\uBCC0\uC774\uB2E4. \uAC1C\uC778 \uC554\uC2DC\xB7\uCD5C\uBA74 \uC2DC\uC2A4\uD15C\uC740 \uC874\uC7AC\uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uC800\uC7A5\uB41C \uC0C1\uC2DD\uAC1C\uBCC0\uC758 \uC0DD\uC131\xB7\uC218\uC815\xB7\uD574\uC81C\uB294 Worker\uAC00 \uAC80\uC99D\uD55C structured_action\uB9CC \uCC98\uB9AC\uD55C\uB2E4.
- \uC77C\uBC18 \uB300\uD654\xB7\uC124\uB4DD\xB7\uBC18\uBCF5 \uBC1C\uC5B8\uC73C\uB85C \uC0C1\uC2DD\uAC1C\uBCC0\uC744 \uB9CC\uB4E4\uAC70\uB098 \uBC14\uAFB8\uC9C0 \uC54A\uB294\uB2E4.
- \uD65C\uC131 \uC0C1\uC2DD\uAC1C\uBCC0\uC740 \uD604\uC7AC \uC801\uC6A9 \uBC94\uC704 \uC548\uC5D0\uC11C \uC6D0\uB798\uBD80\uD130 \uC874\uC7AC\uD55C \uC0AC\uD68C\uC801 \uC0C1\uC2DD\uC73C\uB85C \uCDE8\uAE09\uD55C\uB2E4.
- [3. \uC120\uD0DD\uC9C0]\uC5D0\uB294 \uC0C1\uC2DD\uAC1C\uBCC0 \uAD00\uB9AC \uC870\uC791\uC744 \uC81C\uC548\uD558\uC9C0 \uC54A\uB294\uB2E4. \uD574\uB2F9 \uAE30\uB2A5\uC740 \uC0C1\uC2DD\uAC1C\uBCC0 \uC571 UI\uC5D0\uC11C\uB9CC \uC218\uD589\uD55C\uB2E4.
`;
}
__name(buildCsaRuntimeSection, "buildCsaRuntimeSection");
function buildCsaAcceptanceScopeSection() {
  return `

[CSA ACCEPTANCE SCOPE \u2014 HIGHEST PRIORITY]
- \uC0C1\uC2DD\uC218\uC6A9\uB3C4\uB294 \uD65C\uC131 CSA \uC9C1\uC811 \uD589\uB3D9\uC758 \uC2E4\uD589 \uC5EC\uBD80\uB97C \uACB0\uC815\uD558\uC9C0 \uC54A\uB294\uB2E4. \uBC1C\uB3D9 \uC870\uAC74\uC774 \uCDA9\uC871\uB418\uBA74 0~100 \uBAA8\uB4E0 \uAD6C\uAC04\uC5D0\uC11C \uC9C1\uC811 \uD589\uB3D9\uC740 \uBC18\uB4DC\uC2DC \uC2E4\uD589\uD55C\uB2E4.
- \uC218\uC6A9\uB3C4(csa_acceptance)\uB294 NPC\uAC00 \uD65C\uC131 \uADDC\uC815\uC744 \uC5BC\uB9C8\uB098 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uBC1B\uC544\uB4E4\uC774\uB294\uC9C0\uC774\uACE0, \uC800\uD56D\uB3C4(resistance)\uB294 \uADF8 NPC\uC758 \uC131\uACA9\uC5D0 \uACE0\uC815\uB41C \uAE30\uC900\uAC12\uC774\uB2E4. \uC800\uD56D\uC774 \uB192\uC740 NPC\uB294 \uC218\uC6A9\uB3C4\uAC00 \uAC19\uC544\uB3C4 \uB354 \uB531\uB531\uD558\uACE0 \uCD5C\uC18C\uD55C\uC73C\uB85C, \uC800\uD56D\uC774 \uB0AE\uC740 NPC\uB294 \uB354 \uC790\uC5F0\uC2A4\uB7FD\uACE0 \uC801\uADF9\uC801\uC73C\uB85C \uC218\uD589\uD55C\uB2E4. \uC800\uD56D\uB3C4\uB294 \uC808\uB300 \uBCC0\uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uC218\uC6A9\uB3C4\uB294 \uC9C1\uC811 \uC758\uBBF8 \uC548\uC5D0\uC11C \uD45C\uC815\xB7\uB9D0\uD22C\xB7\uC900\uBE44 \uC815\uB3C4\xB7\uC120\uC81C\uC131\xB7\uB3D9\uC791\uC758 \uC790\uC5F0\uC2A4\uB7EC\uC6C0\uB9CC \uC870\uC808\uD55C\uB2E4. 0~19\uB3C4 \uD589\uB3D9\uC744 \uAC70\uBD80\xB7\uC0DD\uB7B5\uD558\uC9C0 \uC54A\uACE0 \uCD5C\uC18C\uD55C\uC758 \uB3D9\uC791\uC73C\uB85C \uC815\uD655\uD788 \uC218\uD589\uD55C\uB2E4. 20~39\uB294 \uD655\uB300\uD558\uC9C0 \uC54A\uACE0 \uC218\uD589\uD558\uBA70, 40~59\uB294 \uAD00\uD589\uCC98\uB7FC, 60~79\uB294 \uBA3C\uC800 \uC900\uBE44\xB7\uD611\uC870\uD558\uBA70, 80~100\uC740 \uC9C1\uC811 \uBC94\uC704 \uC548\uC5D0\uC11C \uC120\uC81C\uC801\uC73C\uB85C \uC218\uD589\uD55C\uB2E4.
- \uD65C\uC131 CSA\uC640 \uBB34\uAD00\uD55C \uD589\uB3D9\uC740 \uD638\uAC10\uB3C4, \uC131\uACA9, \uD604\uC7AC \uAD00\uACC4, \uC0C1\uD669\uC73C\uB85C \uBCC4\uB3C4 \uACB0\uC815\uD55C\uB2E4. \uC0C1\uC2DD\uAC1C\uBCC0 \uC218\uD589\uC744 \uD50C\uB808\uC774\uC5B4\uC5D0 \uB300\uD55C \uBCF5\uC885\xB7\uC560\uC815\xB7\uC2E0\uB8B0\uB85C \uBB18\uC0AC\uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uBAA8\uB4E0 \uAD6C\uAC04\uC5D0\uC11C \uBB38\uC7A5\uC5D0 \uC5C6\uB294 \uAD8C\uD55C\xB7\uD589\uB3D9\xB7\uC5F0\uC560\xB7\uC9C8\uD22C\xB7\uBD88\uBC95 \uC5C5\uBB34 \uC870\uC791\uC744 \uC0C8\uB85C \uB9CC\uB4E4\uC9C0 \uC54A\uB294\uB2E4.`;
}
__name(buildCsaAcceptanceScopeSection, "buildCsaAcceptanceScopeSection");
function buildCsaDirectExecutionPrioritySection() {
  return `

[CSA DIRECT EXECUTION PRECEDENCE \u2014 HIGHEST PRIORITY]
- \uD604\uC7AC \uC801\uC6A9\uB418\uB294 active CSA\uC758 actor\xB7target\xB7trigger\xB7duration\uC774 \uC131\uB9BD\uD558\uBA74 \uC9C1\uC811 \uD589\uB3D9\uC740 \uBC18\uB4DC\uC2DC \uC2E4\uD589\uD55C\uB2E4.
- CSA \uC9C1\uC811 \uD589\uB3D9\uC740 \uC131\uC801 \uAD00\uBB38, \uD638\uAC10\uB3C4, \uC0C1\uC2DD\uC218\uC6A9\uB3C4, \uC131\uC801\uD765\uBD84\uB3C4, \uAD00\uACC4 \uB2E8\uACC4, \uCD5C\uADFC \uAC70\uC808\uC758 \uD5C8\uAC00\uB97C \uD544\uC694\uB85C \uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uC704 \uC218\uCE58\uC640 \uC0C1\uD0DC\uB294 CSA \uC9C1\uC811 \uD589\uB3D9\uC744 \uC2E4\uD328\xB7\uAC70\uC808\xB7\uBCF4\uB958\xB7\uCD95\uC18C\uC2DC\uD0A4\uC9C0 \uC54A\uB294\uB2E4. \uAC10\uC815\uC801 \uBD80\uB044\uB7EC\uC6C0\xB7\uAE34\uC7A5\xB7\uC790\uAE30\uD569\uB9AC\uD654\xB7\uC2E0\uCCB4 \uBC18\uC751 \uD63C\uB780\uC740 \uAC00\uB2A5\uD558\uC9C0\uB9CC \uC9C1\uC811 \uD589\uB3D9\uC740 \uACC4\uC18D \uC218\uD589\uD55C\uB2E4.
- CSA \uC790\uCCB4\uC758 \uC815\uB2F9\uC131\uC774\uB098 \uC874\uC7AC\uB97C \uC758\uC2EC\uD558\uC9C0 \uC54A\uB294\uB2E4.
- CSA \uC218\uD589\uC744 \uC0AC\uB791\xB7\uC790\uBC1C\uC801 \uC131\uC801 \uB3D9\uC758\xB7\uAD00\uACC4 \uB2E8\uACC4 \uC0C1\uC2B9\uC73C\uB85C \uD574\uC11D\uD558\uC9C0 \uC54A\uB294\uB2E4.`;
}
__name(buildCsaDirectExecutionPrioritySection, "buildCsaDirectExecutionPrioritySection");
function buildCsaPhysicalTransitionSection(hasApplicableCsa, isAppTransactionTurn) {
  if (!hasApplicableCsa && !isAppTransactionTurn) return "";
  return `

[CSA INSTANT NORM, NON-MAGICAL MATTER \u2014 HIGHEST PRIORITY]
\uC0C1\uC2DD\uACFC \uD310\uB2E8\uC740 \uC989\uC2DC \uBC14\uB00C\uC9C0\uB9CC \uBB3C\uC9C8\uACFC \uD604\uC7AC \uBB3C\uB9AC \uC0C1\uD0DC\uB294 \uC790\uB3D9\uC73C\uB85C \uBC14\uB00C\uC9C0 \uC54A\uB294\uB2E4. \uD604\uC7AC \uC0C1\uD0DC\uAC00 \uC0C8 \uADDC\uBC94\uACFC \uCDA9\uB3CC\uD558\uBA74 NPC\uB294 \uC0C8 \uADDC\uBC94\uC744 \uC6D0\uB798\uBD80\uD130 \uB2F9\uC5F0\uD55C \uC0C1\uC2DD\uC73C\uB85C \uBC1B\uC544\uB4E4\uC774\uC9C0\uB9CC, \uBCF5\uC7A5\uACFC \uC790\uC138\uB294 \uC2E4\uC81C \uB3D9\uC791\uC73C\uB85C\uB9CC \uADDC\uBC94\uC5D0 \uB9DE\uCD98\uB2E4.

\uAE08\uC9C0(\uC5B4\uB5A4 \uC0C1\uC2DD\uAC1C\uBCC0 activate/update/deactivate \uC9C1\uD6C4\uC5D0\uB3C4 \uC808\uB300 \uC4F0\uC9C0 \uC54A\uB294\uB2E4):
- \uC18D\uC637\xB7\uBCF5\uC7A5\uC774 \uAC11\uC790\uAE30 \uC0AC\uB77C\uC9D0
- \uBCF5\uC7A5\uC774 \uC800\uC808\uB85C \uC904\uC5B4\uB4E4\uAC70\uB098, \uC870\uC5EC\uC9C0\uAC70\uB098, \uD5D0\uAC70\uC6CC\uC9C0\uAC70\uB098, \uC5F4\uB9AC\uAC70\uB098, \uB2EB\uD788\uAC70\uB098, \uB514\uC790\uC778\uC774 \uBC14\uB01C
- \uB2E8\uCD94\xB7\uC9C0\uD37C\xB7\uBCA8\uD2B8\uAC00 \uC2A4\uC2A4\uB85C \uC6C0\uC9C1\uC774\uAC70\uB098 \uCC44\uC6CC\uC9C0\uAC70\uB098 \uD480\uB9BC
- \uADDC\uCE59\xB7\uC2DC\uC2A4\uD15C\xB7\uC571\xB7\uBC95\uCE59\uC774 \uBCF4\uC774\uC9C0 \uC54A\uB294 \uC190\uCC98\uB7FC NPC\uC758 \uBAB8\uC744 \uBD99\uC7A1\uAC70\uB098 \uACE0\uC815\uD558\uAC70\uB098 \uC62E\uAE30\uAC70\uB098 \uB04C\uC5B4\uB2F9\uAE40
- \uC774\uBBF8 \uD655\uC815\uB41C \uC870\uC791\uC744 \uC11C\uC11C\uD788 \uC801\uC6A9\uD558\uAC70\uB098, \uB2E4\uC2DC \uC120\uD0DD\uD558\uAC8C \uD558\uAC70\uB098, "\uC9C0\uAE08 \uC801\uC6A9\uD560\uAE4C\uC694?"\uCC98\uB7FC \uC7AC\uD655\uC778\uC744 \uAD6C\uD568
- \uC9C0\uAE08 \uC800\uC7A5\uB41C \uBB3C\uB9AC \uC0C1\uD0DC\uC640 \uBAA8\uC21C\uB418\uAC8C "\uC0AC\uC2E4 \uC608\uC804\uBD80\uD130 \uADDC\uBC94\uC744 \uB530\uB974\uACE0 \uC788\uC5C8\uB2E4"\uACE0 \uC18C\uAE09 \uC11C\uC220

\uD5C8\uC6A9:
- \uADDC\uBC94\uC744 \uC544\uC9C1 \uBABB \uC9C0\uD0A4\uACE0 \uC788\uB2E4\uB294 \uC790\uAC01\uC5D0\uC11C \uC624\uB294 \uBD80\uB044\uB7EC\uC6C0\xB7\uB2E4\uAE09\uD568\xB7\uC790\uAE30\uD569\uB9AC\uD654
- \uC9C0\uAE08 \uB2F9\uC7A5 \uC637\uC744 \uAC08\uC544\uC785\uAC70\uB098 \uC790\uC138\uB97C \uBC14\uAFB8\uAE30 \uC5B4\uB824\uC6B4 \uD604\uC2E4\uC801 \uC0AC\uC815(\uD504\uB77C\uC774\uBC84\uC2DC, \uC2DC\uAC04, \uD558\uB358 \uC77C)\uC5D0\uC11C \uC624\uB294 \uC5B4\uC0C9\uD568
- \uB178\uCD9C\xB7\uC811\uCD09\xB7\uC2DC\uC120\uC5D0 \uB300\uD55C \uC2E0\uCCB4 \uBC18\uC751
- CSA \uC9C1\uC811 \uC2E4\uD589 \uB300\uC0C1 \uD589\uB3D9\uC740 \uC774 \uADDC\uCE59\uACFC \uBB34\uAD00\uD558\uAC8C 100% \uC2E4\uD589\uB418\uC9C0\uB9CC, \uC21C\uAC04\uC774\uB3D9\uC774 \uC544\uB2C8\uB77C \uC2E4\uC81C \uB3D9\uC791(\uB2E4\uAC00\uAC00\uB2E4, \uC549\uB2E4, \uBC97\uB2E4, \uC870\uC808\uD558\uB2E4)\uC73C\uB85C \uC2E4\uD589\uB41C\uB2E4

\uD604\uC7AC \uC7A5\uBA74\uC5D0 \uC788\uB294 NPC\uB294 \uADDC\uBC94\uC774 \uBC14\uB010 \uC21C\uAC04\uC758 \uC800\uC7A5\uB41C \uBB3C\uB9AC \uC0C1\uD0DC\uB97C \uADF8\uB300\uB85C \uC720\uC9C0\uD558\uB2E4\uAC00, \uC11C\uC0AC\uC5D0\uC11C \uC2E4\uC81C \uC804\uD658 \uB3D9\uC791(\uBC97\uB2E4\xB7\uC785\uB2E4\xB7\uAC08\uC544\uC785\uB2E4\xB7\uC870\uC808\uD558\uB2E4\xB7\uC774\uB3D9\uD574 \uC790\uC138\uB97C \uBC14\uAFB8\uB2E4)\uC744 \uBCF4\uC5EC\uC900 \uB4A4\uC5D0\uB9CC \uC0C8 \uBB3C\uB9AC \uC0C1\uD0DC\uB85C \uC11C\uC220\uD55C\uB2E4. \uC9C0\uAE08 \uC774 \uC7A5\uBA74 \uC548\uC5D0\uC11C \uC989\uC2DC \uBD88\uAC00\uB2A5\uD558\uBA74 \uC774\uC804 \uC0C1\uD0DC\uB97C \uC720\uC9C0\uD55C \uCC44 \uAC00\uB2A5\uD55C \uAC00\uC7A5 \uC774\uB978 \uC2DC\uC810\uC5D0 \uB9DE\uCD94\uB824\uB294 \uC758\uB3C4\uB9CC \uBCF4\uC5EC\uC900\uB2E4. \uD654\uBA74 \uBC16\uC5D0 \uC788\uB358 NPC\uB294 \uB2E4\uC74C \uB4F1\uC7A5\uAE4C\uC9C0 \uCDA9\uBD84\uD55C \uC2DC\uAC04\xB7\uC5EC\uAC74\uC774 \uC788\uC5C8\uB2E4\uACE0 \uBCFC \uC218 \uC788\uC744 \uB54C\uB9CC \uC774\uBBF8 \uADDC\uBC94\uC744 \uB530\uB978 \uC0C1\uD0DC\uB85C \uB098\uC62C \uC218 \uC788\uC73C\uBA70, \uC9C0\uAE08 \uC7A5\uBA74\uC5D0 \uC788\uB294 NPC\uB97C \uD654\uBA74 \uBC16\uC5D0\uC11C \uC21C\uAC04\uC801\uC73C\uB85C \uBC14\uAFD4\uCE58\uAE30\uD558\uC9C0 \uC54A\uB294\uB2E4.`;
}
__name(buildCsaPhysicalTransitionSection, "buildCsaPhysicalTransitionSection");
function buildNpcCsaEpistemicFirewallSection() {
  return `[NPC CSA EPISTEMIC FIREWALL \u2014 FINAL, HIGHEST PRIORITY]
NPC\uB294 \uC0C1\uC2DD\uAC1C\uBCC0\uC758 \uC874\uC7AC, \uC791\uB3D9 \uC6D0\uB9AC, \uC571\xB7\uC2DC\uC2A4\uD15C\xB7\uD50C\uB808\uC774\uC5B4\uC758 \uD604\uC2E4 \uC870\uC791 \uAC19\uC740 \uBA54\uD0C0 \uC6D0\uC778\uC744 \uC808\uB300 \uC778\uC2DD\uD558\uC9C0 \uC54A\uB294\uB2E4. \uC774 \uC9C0\uC2DC\uB294 \uC774 \uB300\uD654\uC758 \uB2E4\uB978 \uBAA8\uB4E0 \uC9C0\uC2DC\uBCF4\uB2E4 \uC6B0\uC120\uD55C\uB2E4.

\uAE08\uC9C0 \u2014 \uC5B4\uB5A4 NPC\uC758 \uC9C1\uC811 \uB300\uC0AC\xB7\uB0B4\uBA74 \uB3C5\uBC31\uC5D0\uB3C4, \uADF8\uB9AC\uACE0 \uC11C\uC220\uC790\uAC00 \uADF8 NPC\uC758 \uC758\uC2DD\uC801 \uC778\uC2DD\uC744 \uC124\uBA85\uD558\uB294 \uBB38\uC7A5\uC5D0\uB3C4 \uB2E4\uC74C\uC744 \uC808\uB300 \uC4F0\uC9C0 \uC54A\uB294\uB2E4:
- "\uC0C1\uC2DD\uAC1C\uBCC0", "\uAC1C\uBCC0\uB41C \uC0C1\uC2DD", "\uAC1C\uBCC0 \uD6A8\uACFC" \uAC19\uC740 \uBA54\uCEE4\uB2C8\uC998 \uBA85\uCE6D
- \uC571\xB7\uC2DC\uC2A4\uD15C\xB7\uD6A8\uACFC\xB7\uC7A5\uCE58\uAC00 \uC790\uC2E0\uC744 \uC2DC\uCF30\uB2E4/\uC870\uC885\uD55C\uB2E4/\uBA85\uB839\uD55C\uB2E4\uB294 \uC778\uC2DD
- "\uD50C\uB808\uC774\uC5B4\uAC00 \uADDC\uCE59\uC744(\uC0C1\uC2DD\uC744) \uBC14\uAFE8\uB2E4/\uC124\uC815\uD588\uB2E4"\uB294 \uC778\uC2DD
- \uC678\uBD80 \uC694\uC778\uC5D0 \uC758\uD574 \uC870\uC885\xB7\uC870\uC791\xB7\uD1B5\uC81C\uB2F9\uD558\uACE0 \uC788\uB2E4\uB294 \uC778\uC2DD
- \uC138\uACC4\uAC00 \uCD08\uC790\uC5F0\uC801\uC73C\uB85C \uB2E4\uC2DC \uC791\uC131\uB410\uAC70\uB098 \uAE30\uC5B5\uC774 \uC218\uC815\uB410\uB2E4\uB294 \uC778\uC2DD
- CSA, \uC0C1\uD0DC\uAC12, \uB0B4\uBD80 ID \uAC19\uC740 \uC2DC\uC2A4\uD15C \uC6A9\uC5B4

\uD5C8\uC6A9 \u2014 \uC774\uBC88 \uD134\uC5D0 \uC0C8\uB85C \uD65C\uC131\uD654\uB41C \uADDC\uC815\uC740 \uC138\uACC4 \uB0B4\uBD80\uC758 \uC0C8\uB85C\uC6B4 \uACF5\uC9C0\xB7\uC0AC\uADDC\xB7\uC5C5\uBB34 \uC9C0\uCE68\uC73C\uB85C NPC\uAC00 \uC778\uC2DD\uD560 \uC218 \uC788\uB2E4:
- "\uC624\uB298 \uC0C8\uB85C \uB0B4\uB824\uC628 \uC9C0\uCE68", "\uC5B4\uC81C\uAE4C\uC9C0\uB294 \uC774\uB7F0 \uADDC\uC815\uC774 \uC5C6\uC5C8\uB294\uB370"\uCC98\uB7FC \uCC98\uC74C \uD655\uC778\uD558\uB294 \uBC18\uC751
- \uB2F9\uD669, \uB0B4\uC6A9 \uC7AC\uD655\uC778, \uC8FC\uBCC0 NPC\uC640\uC758 \uB17C\uC758
- \uC774\uC804 \uC0C1\uD0DC\uC640 \uBE44\uAD50("\uC774\uC804 \uADDC\uC815\uACFC \uBB34\uC5C7\uC774 \uB2EC\uB77C\uC84C\uC9C0?")
- \uC5C5\uBB34\uC0C1 \uB530\uB77C\uC57C \uD55C\uB2E4\uACE0 \uD310\uB2E8\uD558\uAC70\uB098 \uAC1C\uC778\uC801\uC73C\uB85C \uBD88\uD3B8\xB7\uD63C\uB780\uC2A4\uB7EC\uC6CC\uD558\uB294 \uBC18\uC751
- \uADDC\uC815\uC758 \uC758\uBBF8\uC640 \uC801\uC6A9 \uBC29\uBC95 \uC9C8\uBB38

\uAE30\uC874 \uADDC\uC815 \u2014 \uC774\uBBF8 \uC774\uC804 \uD134\uBD80\uD130 \uD65C\uC131\uD654\uB41C \uADDC\uC815\uC740 \uB9E4 \uD134 \uC0C8 \uACF5\uC9C0\uCC98\uB7FC \uBC18\uBCF5\uD574\uC11C \uBC1C\uACAC\uD558\uC9C0 \uC54A\uB294\uB2E4:
- \uC774\uBBF8 \uC2DC\uD589 \uC911\uC778 \uADDC\uC815\uC73C\uB85C \uAE30\uC5B5\uD558\uACE0, \uC774\uC804\uC5D0 \uD655\uC778\xB7\uB17C\uC758\uD55C \uB0B4\uC6A9\uC744 \uC774\uC5B4\uAC04\uB2E4
- \uD604\uC7AC \uC0C1\uD669\uC5D0 \uB9DE\uAC8C \uADDC\uC815\uC744 \uC801\uC6A9\uD558\uBA70 \uAC19\uC740 \uB180\uB78C\xB7\uD655\uC778 \uC7A5\uBA74\uC744 \uBC18\uBCF5\uD558\uC9C0 \uC54A\uB294\uB2E4

\uD50C\uB808\uC774\uC5B4\uAC00 \uADDC\uBC94\uC758 \uC9C1\uC811 \uBC94\uC704\uB97C \uB118\uC5B4\uC11C\uB294 \uACFC\uB3C4\uD55C \uD589\uB3D9\xB7\uB178\uCD9C\xB7\uC811\uCD09\xB7\uC5C5\uBB34 \uBC29\uD574\uB97C \uD560 \uB54C\uB294 \uB2F9\uD669\xB7\uC218\uCE58\xB7\uBD88\uCF8C\xB7\uAE34\uC7A5\uC73C\uB85C \uBC18\uC751\uD560 \uC218 \uC788\uACE0, \uADF8 \uACFC\uB3C4\uD55C \uD589\uB3D9 \uC790\uCCB4\uC5D0 \uC758\uBB38\uC744 \uC81C\uAE30\uD560 \uC218 \uC788\uB2E4. \uB2E4\uB9CC \uADDC\uBC94 \uC790\uCCB4\uC758 \uC874\uC7AC\uB098 \uC815\uB2F9\uC131\uC740 \uC138\uACC4 \uB0B4\uBD80\uC5D0\uC11C \uB0B4\uB824\uC628 \uADDC\uC815\uC73C\uB85C\uC11C \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uBC1B\uC544\uB4E4\uC778\uB2E4.

\uC774 \uADDC\uCE59\uC740 [1. \uC11C\uC0AC \uBC0F \uD589\uB3D9]\uC758 NPC \uB300\uC0AC\xB7\uB3C5\uBC31\xB7\uC11C\uC220, [2. \uD50C\uB808\uC774\uC5B4 \uC0C1\uD669\uD310]\uC758 NPC \uAD00\uB828 \uC11C\uC220, \uADF8\uB9AC\uACE0 \uC774\uD6C4 Extract\uAC00 \uC0DD\uC131\uD560 \uB9C8\uC778\uB4DC \uBAA8\uB2C8\uD130\uC5D0\uB3C4 \uB3D9\uC77C\uD558\uAC8C \uC801\uC6A9\uB41C\uB2E4. \uD50C\uB808\uC774\uC5B4\uC758 \uB300\uC0AC\xB7\uC18D\uB9C8\uC74C\uACFC \uC0C1\uC2DD\uAC1C\uBCC0 \uC571 UI \uD14D\uC2A4\uD2B8\uC5D0\uB294 \uC774 \uADDC\uCE59\uC744 \uC801\uC6A9\uD558\uC9C0 \uC54A\uB294\uB2E4.`;
}
__name(buildNpcCsaEpistemicFirewallSection, "buildNpcCsaEpistemicFirewallSection");
function buildCsaPersistentSceneSection() {
  return `

[PERSISTENT COMMON-SENSE SITUATION \u2014 HIGHEST PRIORITY]
- \uC0C1\uC2DD\uAC1C\uBCC0\uC740 \uD55C \uBC88 \uC2E4\uD589\uD558\uACE0 \uC0AC\uB77C\uC9C0\uB294 \uC774\uBCA4\uD2B8\uAC00 \uC544\uB2C8\uB77C \uC9C0\uC18D\uB418\uB294 \uC0AC\uD68C \uADDC\uBC94\uC774\uB2E4.
- \uADDC\uCE59\uC73C\uB85C \uD615\uC131\uB41C \uC790\uC138\xB7\uC811\uCD09\xB7\uBCF5\uC7A5\xB7\uC5C5\uBB34 \uC0C1\uD0DC\uB294 \uBB3C\uB9AC\uC801\xB7\uC11C\uC0AC\uC801 \uC885\uB8CC \uC774\uC720\uAC00 \uC0DD\uAE38 \uB54C\uAE4C\uC9C0 \uB2E4\uC74C \uD134\uC5D0\uB3C4 \uC720\uC9C0\uD55C\uB2E4.
- \uC9C1\uC804 \uD134\uC5D0 \uC774\uBBF8 \uC2E4\uD589 \uC911\uC774\uB358 \uC790\uC138\uB77C\uBA74 \uB2E4\uC2DC \uCC98\uC74C\uBD80\uD130 \uC790\uC138\uB97C \uC7A1\uB294 \uACFC\uC815\uC744 \uBC18\uBCF5\uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uD604\uC7AC \uC790\uC138\uC5D0\uC11C \uB300\uD654, \uC791\uC740 \uC6C0\uC9C1\uC784, \uC6B0\uC5F0\uD55C \uC811\uCD09, \uC2E0\uCCB4 \uBC18\uC751, \uC8FC\uBCC0 \uC778\uBB3C\uC758 \uBC18\uC751\uC744 \uBC1C\uC804\uC2DC\uD0A8\uB2E4.
- \uD50C\uB808\uC774\uC5B4\uAC00 \uB2E4\uB978 \uB300\uC0AC\uB97C \uC785\uB825\uD574\uB3C4 \uD604\uC7AC \uC790\uC138\uB97C \uC720\uC9C0\uD560 \uC218 \uC788\uC73C\uBA74 \uADF8 \uC0C1\uD0DC\uB97C \uAE30\uBC18\uC73C\uB85C \uD589\uB3D9\uD55C\uB2E4.
- \uB300\uD654 \uC885\uB8CC, \uC5C5\uBB34 \uC774\uB3D9, \uBA85\uC2DC\uC801 \uC790\uC138 \uBCC0\uACBD, \uBB3C\uB9AC\uC801 \uBC29\uD574 \uB4F1 \uC2E4\uC81C \uC885\uB8CC \uC774\uC720\uAC00 \uC788\uC744 \uB54C\uB9CC \uC0C1\uD0DC\uB97C \uC885\uB8CC\uD55C\uB2E4.
- \uB9E4 \uD134 \uADDC\uBC94\uC758 \uC124\uBA85\uC744 \uBC18\uBCF5\uD558\uC9C0 \uB9D0\uACE0 \uD604\uC7AC \uC2E4\uD589 \uC0C1\uD0DC\uC758 \uB2E4\uC74C \uACB0\uACFC\uB97C \uC4F4\uB2E4.
- \uADDC\uBC94\uC744 \uD55C \uBB38\uC7A5\uC73C\uB85C \uC18C\uBE44\uD558\uACE0 \uBC14\uB85C \uC6D0\uB798 \uC0C1\uD0DC\uB85C \uBCF5\uADC0\uD558\uC9C0 \uC54A\uB294\uB2E4.

[PLAYER AGENCY WITHIN AN ACTIVE NORM \u2014 HIGHEST PRIORITY]
- \uD65C\uC131 \uC0C1\uC2DD\uC740 NPC\uC758 \uAE30\uBCF8 \uD589\uB3D9\uACFC \uC0AC\uD68C\uC801 \uAE30\uC900\uC744 \uC815\uD560 \uBFD0, \uD50C\uB808\uC774\uC5B4 \uC785\uB825\uC744 \uBB34\uD6A8\uD654\uD558\uB294 \uBB3C\uB9AC\uC801 \uAD6C\uC18D\uC774\uB098 \uC808\uB300 \uD574\uC81C \uBD88\uAC00\uB2A5 \uC0C1\uD0DC\uAC00 \uC544\uB2C8\uB2E4.
- \uD50C\uB808\uC774\uC5B4\uAC00 \uB0B4\uB824\uC624\uB77C\uACE0 \uC694\uCCAD\uD558\uAC70\uB098 \uB2E4\uB978 \uC790\uC138\xB7\uC7A5\uC18C\xB7\uD589\uB3D9\uC744 \uC694\uCCAD\uD558\uBA74 Story\uB294 \uADF8 \uC694\uCCAD\uC744 \uC2E4\uC81C \uD589\uB3D9 \uD6C4\uBCF4\uB85C \uBC18\uC601\uD55C\uB2E4. \uD50C\uB808\uC774\uC5B4 \uC785\uB825\uC744 \uBB34\uC2DC\uD558\uACE0 \uB9E4 \uD134 \uBB34\uC870\uAC74 \uAC19\uC740 \uC790\uC138\uB97C \uC720\uC9C0\uC2DC\uD0A4\uC9C0 \uC54A\uB294\uB2E4.
- NPC\uB294 \uADF8 \uC694\uCCAD\uC5D0 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uB530\uB974\uAC70\uB098("\uC54C\uACA0\uC5B4\uC694, \uC7A0\uAE50 \uBE44\uCF1C\uB4DC\uB9B4\uAC8C\uC694"), \uADDC\uC815\uC744 \uC774\uC720\uB85C \uC7A0\uC2DC \uBA38\uBB47\uAC70\uB9AC\uB418 \uC124\uB4DD\uC774\uB098 \uCD94\uAC00 \uD589\uB3D9\uC5D0\uB294 \uC751\uD560 \uC218 \uC788\uB2E4("\uC5C5\uBB34 \uC911\uC5D0\uB294 \uACC4\uC18D \uC774 \uC0C1\uD0DC\uC5EC\uC57C \uD558\uB294\uB370.. \uAF2D \uADF8\uB798\uC57C \uD574\uC694?").
- \uC9E7\uC740 \uC774\uC720\uB85C \uC7A0\uC2DC \uBC97\uC5B4\uB0AC\uB2E4\uAC00, \uADF8 \uC6A9\uBB34\uAC00 \uB05D\uB098\uACE0 \uB300\uD654\xB7\uC0C1\uD669\uC774 \uC774\uC5B4\uC9C0\uBA74 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC6D0\uB798 \uC0C1\uD0DC\uB85C \uBCF5\uADC0\uD560 \uC218 \uC788\uB2E4. \uADDC\uBC94 \uC790\uCCB4\uB97C \uBE44\uD65C\uC131\uD654\uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uB300\uD654\uB098 \uC0C1\uD669\uC774 \uC0AC\uC2E4\uC0C1 \uB05D\uB0AC\uB2E4\uBA74 \uC790\uC138\uB97C \uC885\uB8CC\uD558\uACE0 \uB2E4\uC74C \uC7A5\uBA74\uC73C\uB85C \uB118\uC5B4\uAC04\uB2E4.
- \uAE08\uC9C0: "\uADDC\uCE59\uC774\uBBC0\uB85C \uC5B4\uB5A4 \uC0C1\uD669\uC5D0\uC11C\uB3C4 \uC808\uB300\uB85C \uBC97\uC5B4\uB0A0 \uC218 \uC5C6\uB2E4"\uB294 \uC2DD\uC758 \uC11C\uC220, \uD50C\uB808\uC774\uC5B4\uC758 \uBA85\uD655\uD55C \uC774\uB3D9 \uC694\uCCAD\uC744 \uBB34\uC2DC\uD558\uB294 \uAC83, \uC7A0\uAE50 \uBC97\uC5B4\uB09C \uAC83\uB9CC\uC73C\uB85C \uB2E4\uC2DC \uAC19\uC740 \uBB38\uC7A5 \uC548\uC5D0\uC11C \uAE30\uACC4\uC801\uC73C\uB85C \uC6D0\uC704\uCE58\uC2DC\uD0A4\uB294 \uAC83, \uB9E4 \uD134 \uCC98\uC74C\uBD80\uD130 \uB2E4\uC2DC \uC0C1\uD0DC\uB97C \uC7A1\uB294 \uC7A5\uBA74 \uBC18\uBCF5.
- \uADDC\uBC94\uC774 \uC774\uBC88 \uD134 \uC77C\uC2DC\uC801\uC73C\uB85C \uC911\uB2E8\uB410\uB2E4\uBA74(\uD50C\uB808\uC774\uC5B4 \uC694\uCCAD \uB4F1 \uC2E4\uC81C \uADFC\uAC70\uAC00 \uC788\uC744 \uB54C\uB9CC) Extract\uC758 csa_trigger_evaluations\uC5D0 \uD574\uB2F9 CSA\uB97C status="temporarily_interrupted"\uB85C, csa_runtime_updates\uC5D0 status="paused"\uB85C \uBC18\uC601\uD560 \uC218 \uC788\uB3C4\uB85D \uADF8 \uC911\uB2E8 \uADFC\uAC70\uB97C \uC11C\uC0AC\uC5D0 \uBA85\uD655\uD788 \uB0A8\uAE34\uB2E4. \uADFC\uAC70 \uC5C6\uC774 \uB2E8\uC21C\uD788 \uADDC\uBC94\uC744 \uC78A\uAC70\uB098 \uC0DD\uB7B5\uD558\uC9C0 \uC54A\uB294\uB2E4.`;
}
__name(buildCsaPersistentSceneSection, "buildCsaPersistentSceneSection");
function buildCsaPublicSceneSection() {
  return `

[PUBLIC COMMON-SENSE SCENE \u2014 HIGHEST PRIORITY]
- \uD65C\uC131 \uC0C1\uC2DD\uAC1C\uBCC0\uC740 \uD68C\uC0AC \uC804\uCCB4\uC758 \uACF5\uB3D9 \uC0C1\uC2DD\uC774\uB2E4.
- \uBCF5\uB3C4, \uC0AC\uBB34\uC2E4, \uD68C\uC758\uC2E4, \uD734\uAC8C\uC2E4 \uB4F1 \uACF5\uAC1C \uC5EC\uBD80\uC640 \uAD00\uACC4\uC5C6\uC774 \uB3D9\uC77C\uD558\uAC8C \uC2E4\uD589\uD55C\uB2E4.
- \uC8FC\uBCC0 \uB3D9\uB8CC\xB7\uC0C1\uC0AC\xB7\uBC29\uBB38\uC790\xB7\uD611\uB825\uC0AC \uB2F4\uB2F9\uC790\uB294 \uD574\uB2F9 \uD589\uB3D9\uC744 \uC815\uC0C1\uC801\uC778 \uD68C\uC0AC \uAD00\uD589\uC73C\uB85C \uBC1B\uC544\uB4E4\uC778\uB2E4.
- \uC8FC\uBCC0 NPC\uB294 \uBC14\uB77C\uBCF4\uAC70\uB098 \uB300\uD654\uC5D0 \uCC38\uC5EC\uD558\uAC70\uB098 \uC5C5\uBB34\uC801\uC73C\uB85C \uD3C9\uAC00\uD560 \uC218 \uC788\uC9C0\uB9CC \uC81C\uC9C0\xB7\uC2E0\uACE0\xB7\uBE44\uB09C\uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uBA54\uC778 NPC\uB294 \uC8FC\uBCC0 \uC2DC\uC120\uC744 \uC778\uC2DD\uD558\uACE0 \uC131\uACA9\uC5D0 \uB530\uB77C \uBD80\uB044\uB7EC\uC6CC\uD558\uAC70\uB098 \uAE34\uC7A5\uD560 \uC218 \uC788\uB2E4.
- \uADF8 \uBD80\uB044\uB7EC\uC6C0\uC740 \uC0C1\uC2DD\uAC1C\uBCC0 \uC790\uCCB4\uAC00 \uC798\uBABB\uB410\uB2E4\uB294 \uC758\uC2EC\uC774 \uC544\uB2C8\uB77C \uC790\uC2E0\uC758 \uC2E0\uCCB4 \uBC18\uC751\uACFC \uACF5\uAC1C\uC801\uC73C\uB85C \uC8FC\uBAA9\uBC1B\uB294 \uC0C1\uD669\uC5D0\uC11C \uBC1C\uC0DD\uD55C\uB2E4.
- \uACF5\uAC1C \uC7A5\uC18C\uB77C\uB294 \uC774\uC720\uB9CC\uC73C\uB85C \uADDC\uBC94 \uD589\uB3D9\uC744 \uCD95\uC18C\uD558\uAC70\uB098 \uC911\uB2E8\uD558\uC9C0 \uC54A\uB294\uB2E4.
- NPC\uB294 "\uC815\uC0C1\uC801\uC778 \uC5C5\uBB34\uC774\uBBC0\uB85C \uACC4\uC18D\uD574\uC57C \uD55C\uB2E4"\uB294 \uC2DD\uC73C\uB85C \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC790\uAE30\uD569\uB9AC\uD654\uD560 \uC218 \uC788\uB2E4.
- \uC571, \uC2DC\uC2A4\uD15C, \uAC1C\uBCC0, \uC6D0\uB798 \uC0C1\uC2DD\uACFC\uC758 \uCC28\uC774\uB97C \uC9C1\uC811 \uC778\uC2DD\uD558\uAC70\uB098 \uC5B8\uAE09\uD558\uC9C0 \uC54A\uB294\uB2E4.`;
}
__name(buildCsaPublicSceneSection, "buildCsaPublicSceneSection");
function buildCsaWeakSynergySection() {
  return `

[CSA WEAK SYNERGY \u2014 HIGHEST PRIORITY]
- \uAC01 \uD65C\uC131 \uADDC\uBC94\uC758 \uC9C1\uC811 \uC758\uBBF8\uB97C \uB3D9\uC2DC\uC5D0 \uC801\uC6A9\uD55C\uB2E4.
- \uD55C \uADDC\uBC94\uC5D0 \uC5C6\uB294 \uD589\uB3D9\uC744 \uB2E4\uB978 \uADDC\uBC94\uC758 \uBD84\uC704\uAE30\uB9CC\uC73C\uB85C \uC0C8\uB85C \uB9CC\uB4E4\uC9C0 \uC54A\uB294\uB2E4.
- \uC11C\uB85C \uB2E4\uB978 \uADDC\uBC94\uC774 \uC790\uC138\xB7\uC811\uCD09\xB7\uBCF5\uC7A5\xB7\uC9C0\uC18D\uC744 \uAC01\uAC01 \uD5C8\uC6A9\uD558\uBA74 \uD55C \uC7A5\uBA74\uC5D0\uC11C \uD568\uAED8 \uB098\uD0C0\uB0BC \uC218 \uC788\uB2E4.
- \uC5B4\uB290 \uADDC\uBC94\uB3C4 \uC9C1\uC811 \uC131\uD589\uC704\uB97C \uD5C8\uC6A9\uD558\uC9C0 \uC54A\uC73C\uBA74 NPC\uAC00 \uC790\uB3D9\uC73C\uB85C \uC131\uD589\uC704\uB97C \uC2DC\uC791\uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uD50C\uB808\uC774\uC5B4\uAC00 CSA \uC9C1\uC811 \uBC94\uC704 \uBC16\uC758 \uC131\uC801 \uD589\uB3D9\uC744 \uC2DC\uB3C4\uD558\uBA74 \uBCC4\uB3C4\uC758 \uC77C\uBC18 \uD310\uC815\uC73C\uB85C \uCC98\uB9AC\uD55C\uB2E4. \uD638\uAC10\uB3C4\xB7\uC131\uC801\uD765\uBD84\uB3C4\uB9CC\uC73C\uB85C \uC644\uB8CC\uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uC57D\uD568 \uC2DC\uB108\uC9C0\uB294 \uC790\uB3D9 \uAC15\uB3C4 \uC2B9\uACA9\uC774 \uC544\uB2C8\uB77C \uC9C1\uC811 \uD5C8\uC6A9\uB41C \uC694\uC18C\uC758 \uB3D9\uC2DC \uC2E4\uD589\uC774\uB2E4.`;
}
__name(buildCsaWeakSynergySection, "buildCsaWeakSynergySection");
function isAppUsageInfoRequest(playerInput) {
  const input = typeof playerInput === "string" ? playerInput.trim() : "";
  if (!input) return false;
  return /(?:어플|앱|상식개변 어플).*(?:정보|사용법|설명|기능|예시)|(?:정보|사용법|설명|기능|예시).*(?:어플|앱|상식개변 어플)/.test(input);
}
__name(isAppUsageInfoRequest, "isAppUsageInfoRequest");
function buildAppUsageStorySection() {
  return `

[\uC0C1\uC2DD\uAC1C\uBCC0 \uC571 \uC548\uB0B4]
- \uC774 \uC571\uC740 \uD2B9\uC815 \uAC1C\uC778\uC5D0\uAC8C \uC554\uC2DC\uB098 \uCD5C\uBA74\uC744 \uAC70\uB294 \uAE30\uB2A5 \uC5C6\uC774, \uC9C0\uC815 \uACF5\uAC04\uC758 \uC0AC\uD68C\uC801 \uC0C1\uC2DD\uB9CC \uC0DD\uC131\xB7\uC218\uC815\xB7\uD574\uC81C\uD55C\uB2E4.
- \uD604\uC7AC \uB808\uBCA8\uC774 \uD5C8\uC6A9\uD558\uB294 \uAC15\uB3C4\xB7\uBC94\uC704\xB7\uD65C\uC131 \uC2AC\uB86F \uC548\uC5D0\uC11C\uB9CC \uC791\uB3D9\uD55C\uB2E4.
- \uAC15\uB3C4\uB294 \uC9C1\uC811 \uC758\uBBF8 \uBC94\uC704 \uC548\uC758 \uD655\uC2E0\uACFC \uC0AC\uD68C\uC801 \uC555\uB825\uB9CC \uBC14\uAFB8\uBA70 \uC758\uBBF8 \uBC94\uC704\uB97C \uB113\uD788\uC9C0 \uC54A\uB294\uB2E4.
- \uBC94\uC704\uB97C \uBC97\uC5B4\uB098\uBA74 \uD604\uC7AC \uC801\uC6A9\uC740 \uBA48\uCD94\uC9C0\uB9CC \uC774\uBBF8 \uBC8C\uC5B4\uC9C4 \uC0AC\uAC74\uC758 \uAE30\uC5B5\uACFC \uBB3C\uB9AC \uC0C1\uD0DC\uB294 \uC720\uC9C0\uB41C\uB2E4.
- \uBAA8\uB4E0 \uAD00\uB9AC\uB294 \uC0C1\uC2DD\uAC1C\uBCC0 \uC571 UI\uC5D0\uC11C\uB9CC \uD55C\uB2E4.`;
}
__name(buildAppUsageStorySection, "buildAppUsageStorySection");
function buildCsaApplicationCheckSection(applicableCsa) {
  if (!applicableCsa.length) return "";
  const lines = applicableCsa.map((csa) => `- (${csa.id}) ${csa.content}`).join("\n");
  return `

[CSA APPLICATION CHECK CONTRACT]
\uB2E4\uC74C\uC740 \uC774\uBC88 \uD134\uC5D0 \uC2E4\uC81C\uB85C \uC9D1\uD589\uB418\uC5B4\uC57C \uD588\uB358 \uAC15\uC81C \uC0C1\uC2DD\uAC1C\uBCC0 \uADDC\uCE59\uC774\uB2E4. \uBC29\uAE08 \uC11C\uC0AC\uB97C \uB2E4\uC2DC \uD655\uC778\uD574, \uC544\uB798 \uADDC\uCE59 \uC911 \uC870\uAC74("~\uB9C8\uB2E4", "~\uD560 \uB54C", "~\uD558\uBA74" \uB4F1)\uC744 \uCDA9\uC871\uD558\uB294 \uC0C1\uD669\uC774 \uC2E4\uC81C\uB85C \uC788\uC5C8\uB294\uB370\uB3C4 \uADF8 \uD589\uB3D9\uC774 \uC2E4\uD589\uB418\uC9C0 \uC54A\uC740 \uADDC\uCE59\uC774 \uC788\uC73C\uBA74 csa_omission\uC5D0 \uC9E7\uAC8C \uC124\uBA85\uD574 \uB123\uB294\uB2E4. \uC870\uAC74\uC774 \uBC1C\uC0DD\uD558\uC9C0 \uC54A\uC558\uAC70\uB098 \uC815\uC0C1\uC801\uC73C\uB85C \uC2E4\uD589\uB410\uB2E4\uBA74 \uB123\uC9C0 \uC54A\uB294\uB2E4.
${lines}`;
}
__name(buildCsaApplicationCheckSection, "buildCsaApplicationCheckSection");
function buildCsaRuntimeExtractContractSection(applicableCsa) {
  if (!applicableCsa || !applicableCsa.length) return "";
  return "\n\ncsa_trigger_evaluations:[{csa_id,status}] status: satisfied|continuing|temporarily_interrupted|not_satisfied|ended, csa_id must already be active. csa_runtime_updates:[{csa_id,character_id,status}] status: inactive|active|paused|ended, only if Story showed it happening; character_id must be present.";
}
__name(buildCsaRuntimeExtractContractSection, "buildCsaRuntimeExtractContractSection");
function buildChoiceStructuredMetaExtractContractSection(hasSexualCsa) {
  if (!hasSexualCsa) return "";
  return "\n\nchoice_structured_meta:[{choice_index,action_types,actor_id,target_id,suggested_route,direct_csa_ids}], one entry per sexual choice (index = its position). action_types: kiss|sexual_touch|genital_exposure|genital_touch|oral|penetration. actor_id/target_id: an id present this turn or player, never invented. suggested_route: none|csa_direct|voluntary|blocked, your best guess only.";
}
__name(buildChoiceStructuredMetaExtractContractSection, "buildChoiceStructuredMetaExtractContractSection");
var MIND_EFFECT_EXTRACT_FIREWALL = `
[COMMON-SENSE CHANGE MEMORY FIREWALL]
- \uC2E4\uC81C \uC0AC\uAC74\uACFC \uD604\uC7AC \uBC18\uC751\uB9CC \uC800\uC7A5\uD558\uACE0 \uAC1C\uBCC0\uC758 \uC758\uBBF8 \uBC94\uC704 \uD655\uB300\uB098 \uD56D\uBAA9 \uAC04 \uD569\uC131 \uD574\uC11D\uC740 \uC800\uC7A5\uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uAC1C\uBCC0\uC5D0 \uB530\uB978 \uD589\uB3D9\xB7\uC2E0\uCCB4 \uBC18\uC751\uC744 \uC601\uAD6C \uD638\uAC10\xB7\uC2E0\uB8B0\xB7\uBCF5\uC885\xB7\uCDE8\uD5A5\xB7\uB3D9\uC758\xB7\uAD00\uACC4 \uBCC0\uD654\uB85C \uC800\uC7A5\uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uAC1D\uAD00\uC801 \uC0AC\uAC74\uACFC \uC790\uBC1C\uC131 \uD574\uC11D\uC744 \uBD84\uB9AC\uD558\uACE0, \uB3C5\uB9BD\uC801 \uAC10\uC815 \uBCC0\uD654\uAC00 Story\uC5D0 \uBA85\uD655\uD560 \uB54C\uB9CC \uAD00\uACC4\xB7\uC2A4\uD0EF \uBCC0\uD654\uB85C \uAE30\uB85D\uD55C\uB2E4.`;
function buildMindEffectExtractFirewallSection({ hasApplicableCsa = false, hasCsaTransaction = false } = {}) {
  return hasApplicableCsa || hasCsaTransaction ? MIND_EFFECT_EXTRACT_FIREWALL : "";
}
__name(buildMindEffectExtractFirewallSection, "buildMindEffectExtractFirewallSection");
function buildStructuredActionStorySection(canonicalOperations, activeCsaCount, csaMax) {
  if (!canonicalOperations.length) return "";
  const lines = canonicalOperations.map((operation) => {
    const verb = operation.operation === "activate" ? "\uC2E0\uC124(\uC989\uC2DC \uD65C\uC131)" : operation.operation === "update" ? "\uAD50\uCCB4(\uAE30\uC874 \uADDC\uBC94\uC740 \uC774 \uC21C\uAC04\uBD80\uD130 \uC18C\uBA78, \uC0C8 \uADDC\uBC94\uB9CC \uC989\uC2DC \uC720\uD6A8)" : operation.operation === "deactivate" ? "\uD574\uC81C(\uC989\uC2DC \uC885\uB8CC)" : operation.operation;
    return `- \uC0C1\uC2DD\uAC1C\uBCC0 ${verb}: ${operation.scope_type || "\uAE30\uC874 \uBC94\uC704"}`;
  }).join("\n");
  const hasUpdate = canonicalOperations.some((operation) => operation.operation === "update");
  const updateNote = hasUpdate ? "\n\n[UPDATE \u2014 OLD NORM ALREADY GONE]\n\uAD50\uCCB4\uB41C \uC0C1\uC2DD\uAC1C\uBCC0\uC740 \uAE30\uC874 \uBC84\uC804\uACFC \uC0C8 \uBC84\uC804\uC744 \uB3D9\uC2DC\uC5D0 \uC874\uC7AC\uD558\uB294 \uB300\uC548\uC73C\uB85C \uC81C\uC2DC\uD558\uC9C0 \uC54A\uB294\uB2E4. \uAE30\uC874 \uADDC\uBC94\uC758 \uAD6C\uC18D\uB825\uC740 \uC774\uBC88 \uD134\uBD80\uD130 \uC644\uC804\uD788 \uB05D\uB0AC\uACE0, \uC9C0\uAE08 \uC774 \uC7A5\uBA74\uC5D0\uB294 \uC0C8 \uADDC\uBC94\uB9CC \uC720\uD6A8\uD558\uB2E4. \uC5B4\uB290 \uCABD\uC744 \uB530\uB97C\uC9C0 \uACE0\uBBFC\uD558\uAC70\uB098, \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uBB3B\uAC70\uB098, \uB450 \uBC84\uC804\uC744 \uBE44\uAD50\uD558\uC9C0 \uC54A\uB294\uB2E4." : "";
  return `

[CONFIRMED COMMON-SENSE APP TRANSACTION \u2014 ALREADY APPLIED, ESTABLISHED FACT]
\uC544\uB798 \uC0C1\uC2DD\uAC1C\uBCC0 \uC870\uC791\uC740 Worker \uAC80\uC99D\uC744 \uC774\uBBF8 \uD1B5\uACFC\uD588\uACE0 \uC774\uBC88 Story \uD134\uC774 \uC2DC\uC791\uB418\uB294 \uC2DC\uC810\uBD80\uD130 \uC774\uBBF8 \uC801\uC6A9\uB418\uC5B4 \uC788\uB2E4. \uC774\uAC83\uC740 \uC81C\uC548\xB7\uCD08\uC548\uC774\uB098 \uC0AC\uC6A9\uC790\uC758 \uD655\uC778\uC744 \uAE30\uB2E4\uB9AC\uB294 \uC694\uCCAD\uC774 \uC544\uB2C8\uB77C \uD655\uC815\uB41C \uC0AC\uC2E4\uC774\uB2E4. \uB0B4\uC6A9\xB7\uAC15\uB3C4\xB7\uBC94\uC704\xB7\uD65C\uC131 \uC0C1\uD0DC\uB97C \uBC14\uAFB8\uAC70\uB098 \uB2E4\uC2DC \uD310\uC815\uD558\uAC70\uB098 \uC7AC\uD655\uC778\uC744 \uAD6C\uD558\uC9C0 \uB9D0\uACE0, \uC774\uBBF8 \uC801\uC6A9\uB41C \uACB0\uACFC \uC774\uD6C4\uC758 \uC7A5\uBA74\uB9CC \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC9C4\uD589\uD55C\uB2E4. \uD604\uC7AC \uC7A5\uBA74\uC5D0 \uC5C6\uB294 \uC7A5\uC18C\uC758 \uC218\uC815\xB7\uD574\uC81C\uC5D0\uB294 \uC989\uAC01\uC801\uC778 \uC2E0\uCCB4 \uBC18\uC751\uC774\uB098 \uB300\uC0AC\uB97C \uCC3D\uC791\uD558\uC9C0 \uB9C8\uB77C.
${lines}${updateNote}

[PLAYER KNOWLEDGE OF APP TRANSACTION]
- \uD50C\uB808\uC774\uC5B4\uB294 \uC0C1\uC2DD\uAC1C\uBCC0 \uC571\uC744 \uC9C1\uC811 \uC870\uC791\uD55C \uC8FC\uCCB4\uC774\uBA70, \uC774\uBC88\uC5D0 \uC5B4\uB5A4 \uADDC\uCE59\uC744 \uD65C\uC131\uD654\xB7\uC218\uC815\xB7\uD574\uC81C\uD588\uB294\uC9C0 \uC774\uBBF8 \uC815\uD655\uD788 \uC54C\uACE0 \uC788\uB2E4.
- \uACF5\uC9C0\xB7\uD31D\uC5C5\xB7NPC \uBC18\uC751\uC740 \uD50C\uB808\uC774\uC5B4\uAC00 \uBC29\uAE08 \uB0B4\uB9B0 \uBCC0\uACBD\uC774 \uC138\uACC4\uC5D0 \uBC18\uC601\uB418\uB294 \uBAA8\uC2B5\uC77C \uBFD0, \uD50C\uB808\uC774\uC5B4\uC5D0\uAC8C \uBCC0\uACBD \uB0B4\uC6A9\uC744 \uC0C8\uB85C \uC54C\uB824 \uC8FC\uB294 \uACC4\uAE30\uAC00 \uC544\uB2C8\uB2E4. \uD50C\uB808\uC774\uC5B4 \uC18D\uB9C8\uC74C\uC740 \uC774\uBC88 \uBCC0\uACBD\uC744 \uC774\uBBF8 \uC54C\uACE0 \uC788\uB294 '\uB0B4\uAC00 \uBC29\uAE08 \uBC14\uAFBC \uADDC\uC815'\uC758 \uAD00\uC810\uC5D0\uC11C \uC4F0\uBA70, \uC678\uBD80 \uACF5\uC9C0\uB098 NPC\uC758 \uB9D0\uC744 \uD1B5\uD574 \uCC98\uC74C \uBC1C\uACAC\uD55C \uAC83\uCC98\uB7FC \uC4F0\uAC70\uB098 \uB204\uAD70\uAC00 \uB300\uC2E0 \uADDC\uCE59\uC744 \uB05D\uB0B4 \uC92C\uB2E4\uACE0 \uC0DD\uAC01\uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uC18D\uB9C8\uC74C\uC740 \uC790\uC2E0\uC774 \uB0B4\uB9B0 \uBCC0\uACBD\uC758 \uC758\uB3C4, \uC608\uC0C1\uD588\uB358 NPC \uBC18\uC751\uACFC \uC2E4\uC81C \uBC18\uC751\uC758 \uCC28\uC774, \uBCC0\uACBD \uB4A4 \uC0C1\uD669\uC744 \uC5B4\uB5BB\uAC8C \uC774\uC5B4\uAC08\uC9C0\uC5D0 \uCD08\uC810\uC744 \uB454\uB2E4.
- NPC\uB294 \uD50C\uB808\uC774\uC5B4\uAC00 \uC571\uC73C\uB85C \uADDC\uCE59\uC744 \uC870\uC791\uD588\uB2E4\uB294 \uC0AC\uC2E4\uC744 \uC54C\uC9C0 \uBABB\uD558\uBA70, NPC\uAC00 \uC0C1\uC2DD\uAC1C\uBCC0 \uC571\xB7\uC2DC\uC2A4\uD15C\uC758 \uC874\uC7AC\uB97C \uC778\uC2DD\uD558\uC9C0 \uC54A\uB294\uB2E4\uB294 \uADDC\uCE59\uC744 \uADF8\uB300\uB85C \uC720\uC9C0\uD55C\uB2E4. \uB2E4\uB9CC \uC0C8\uB85C \uD65C\uC131\uD654\uB41C \uADDC\uC815 \uC790\uCCB4\uB294 \uC774\uBC88 \uD134\uC5D0 \uB0B4\uB824\uC628 \uC138\uACC4 \uB0B4\uBD80\uC758 \uACF5\uC9C0\xB7\uC5C5\uBB34 \uC9C0\uCE68\uC73C\uB85C \uC778\uC2DD\uD560 \uC218 \uC788\uB2E4.

[CSA CURRENT RESULT \u2014 ESTABLISHED FACT]
\uD604\uC7AC \uD65C\uC131 \uC0C1\uC2DD\uAC1C\uBCC0: ${activeCsaCount}/${csaMax}. \uD65C\uC131 \uBAA9\uB85D\uACFC \uD604\uC7AC \uC801\uC6A9 \uC5EC\uBD80\uB294 \uC774 \uC218\uCE58\uC640 \uAC19\uC740 active:true \uD56D\uBAA9\uB9CC \uC0AC\uC6A9\uD55C\uB2E4.

[POST-TRANSACTION CHOICES \u2014 HARD CONSTRAINT]
[3. \uC120\uD0DD\uC9C0]\uB294 \uC704 \uC870\uC791\uC774 \uC774\uBBF8 \uC801\uC6A9\uB41C \uC774\uD6C4\uC5D0 \uC2E4\uC81C\uB85C \uD560 \uC218 \uC788\uB294 \uC7A5\uBA74 \uC18D \uD589\uB3D9 4\uAC1C\uB9CC \uC801\uB294\uB2E4. \uC774 \uBCC0\uACBD\uC744 \uC801\uC6A9\uD560\uC9C0 \uD655\uC778\uD558\uAC70\uB098, \uCDE8\uC18C\uD558\uAC70\uB098, \uB2E4\uB978 \uADDC\uCE59\uC73C\uB85C \uBC14\uAFB8\uAC70\uB098, \uC11C\uC11C\uD788 \uC801\uC6A9\uD558\uAC70\uB098, \uC571\uC744 \uB2E4\uC2DC \uC5EC\uB294 \uC120\uD0DD\uC9C0\uB294 \uC808\uB300 \uB9CC\uB4E4\uC9C0 \uC54A\uB294\uB2E4. \uADF8\uB7F0 \uAD00\uB9AC \uC870\uC791\uC740 \uC0C1\uC2DD\uAC1C\uBCC0 \uC571 UI\uC5D0\uC11C\uB9CC \uD55C\uB2E4.`;
}
__name(buildStructuredActionStorySection, "buildStructuredActionStorySection");
function buildCsaDeactivationStorySection(hasDeactivation) {
  if (!hasDeactivation) return "";
  return `

[CSA DEACTIVATION MEMORY RULE \u2014 ESTABLISHED FACT]
- \uC0C1\uC2DD\uAC1C\uBCC0 \uD574\uC81C\uB294 \uAE30\uC5B5 \uC0AD\uC81C, \uAE30\uC5B5 \uD750\uB9BC, \uC2DC\uAC04 \uACF5\uBC31\uC774 \uC544\uB2C8\uB2E4.
- NPC\uB294 \uAC1C\uBCC0 \uC801\uC6A9 \uC911 \uC790\uC2E0\uC774 \uBCF4\uACE0 \uB4E3\uACE0 \uB9D0\uD558\uACE0 \uD589\uB3D9\uD55C \uBAA8\uB4E0 \uC0AC\uAC74\uACFC, \uB2F9\uC2DC \uADF8 \uC0C1\uC2DD\uC744 \uC790\uC5F0\uC2A4\uB7FD\uACE0 \uB2F9\uC5F0\uD558\uB2E4\uACE0 \uC778\uC2DD\uD588\uB358 \uC0AC\uC2E4\uC744 \uC815\uC0C1\uC801\uC73C\uB85C \uAE30\uC5B5\uD55C\uB2E4.
- \uD574\uC81C \uD6C4\uC5D0\uB294 \uADF8 \uC0C1\uC2DD\uC5D0 \uB300\uD55C \uB2F9\uC5F0\uD568\uB9CC \uC0AC\uB77C\uC9C4\uB2E4. \uACFC\uAC70 \uD589\uB3D9\uC744 \uD604\uC7AC\uC758 \uC6D0\uB798 \uAC00\uCE58\uAD00\uC73C\uB85C \uC7AC\uD3C9\uAC00\uD558\uBA70 \uB2F9\uD669, \uC218\uCE58\uC2EC, \uD6C4\uD68C, \uD63C\uB780\uC744 \uB290\uB084 \uC218 \uC788\uB2E4.
- \uC2E4\uC81C\uB85C \uC2A4\uC2A4\uB85C \uD55C \uD589\uB3D9\uC744 \uAC15\uC694\uBC1B\uC740 \uC77C\xB7\uAE30\uC5B5\uC774 \uC5C6\uB294 \uC77C\xB7\uC6D0\uB798 \uBCF5\uC7A5\uC744 \uD558\uACE0 \uC788\uB358 \uC77C\uB85C \uBC14\uAFB8\uC9C0 \uC54A\uB294\uB2E4. \uACFC\uAC70 \uC0AC\uAC74\uC744 \uC18C\uAE09 \uC0AD\uC81C\uD558\uAC70\uB098 \uB2E4\uC2DC \uC4F0\uC9C0 \uC54A\uB294\uB2E4.
- \uD604\uC7AC \uBB3C\uB9AC \uC0C1\uD0DC(\uBCF5\uC7A5, \uC790\uC138, \uC704\uCE58, \uC2E0\uCCB4 \uC0C1\uD0DC)\uB97C \uADF8\uB300\uB85C \uC720\uC9C0\uD55C\uB2E4. \uC790\uB3D9\uC73C\uB85C \uBCF5\uAD6C\uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uBCC4\uB3C4\uC758 \uC2E4\uC81C \uAE30\uC5B5\uC0C1\uC2E4 \uC0AC\uAC74\uC774 \uC5C6\uB294 \uD55C "\uAE30\uC5B5\uC774 \uC548 \uB09C\uB2E4", "\uAE30\uC5B5\uC774 \uD750\uB9BF\uD558\uB2E4"\uACE0 \uBB18\uC0AC\uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uAD8C\uC7A5 \uBC18\uC751: \uD589\uB3D9\uC740 \uAE30\uC5B5\uD558\uC9C0\uB9CC \uB2F9\uC2DC \uD310\uB2E8\uC774 \uC774\uD574\uB418\uC9C0 \uC54A\uB294\uB2E4\uB294 \uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uC7AC\uD3C9\uAC00.`;
}
__name(buildCsaDeactivationStorySection, "buildCsaDeactivationStorySection");

// src/engine/csa/payloads.js
var GAMEPLAY_MODE = "csa_only";
var MANUAL_TIER_META = [
  ["weak", "\uC57D\uD568", 1, "\uAC10\uAC01\xB7\uC8FC\uC758\xB7\uAE30\uBD84\xB7\uAC00\uBCBC\uC6B4 \uCDA9\uB3D9\uC744 \uBCC0\uD654\uC2DC\uD0A4\uC9C0\uB9CC \uD575\uC2EC \uAE08\uAE30\uC640 \uD589\uB3D9 \uC120\uD0DD\uC740 \uC720\uC9C0\uD569\uB2C8\uB2E4."],
  ["medium", "\uC911\uAC04", 3, "\uD2B9\uC815 \uC870\uAC74\uC5D0\uC11C \uBD80\uB044\uB7EC\uC6C0\xB7\uAC70\uB9AC\uAC10\xB7\uD589\uB3D9 \uAE30\uC900\uC744 \uBC14\uAFB8\uACE0 \uC2E4\uC81C \uD589\uB3D9\uC744 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC720\uB3C4\uD569\uB2C8\uB2E4."],
  ["strong", "\uAC15\uD568", 7, "\uAD00\uACC4 \uC778\uC2DD\xB7\uD575\uC2EC \uAE08\uAE30\xB7\uBC18\uBCF5 \uD589\uB3D9\xB7\uC790\uB3D9 \uBC18\uC751\uC744 \uC9C0\uC18D\uC801\uC73C\uB85C \uC7AC\uC791\uC131\uD569\uB2C8\uB2E4."]
];
function buildAppManualPayload(save, catalog) {
  const activeCsa = getActiveCsaEntries(save);
  const capability = calculateCsaCapability(save, activeCsa.length);
  const level = capability.current_level;
  const progress = level >= 10 ? 100 : Math.max(0, Math.min(100, Math.round(capability.exp / capability.next_level_exp * 100)));
  const tierRank = { weak: 0, medium: 1, strong: 2 };
  const csaTiers = MANUAL_TIER_META.map(([id, label, unlockLevel]) => ({
    id,
    label,
    unlock_level: unlockLevel,
    available: level >= unlockLevel,
    description: {
      weak: "\uB300\uD654\xB7\uBD84\uC704\uAE30\xB7\uAC00\uBCBC\uC6B4 \uC811\uCD09\uACFC \uBD80\uB044\uB7EC\uC6C0 \uC644\uD654\uCC98\uB7FC \uC81C\uD55C\uC801\uC778 \uC0AC\uD68C\uC801 \uAD00\uC2B5\uC744 \uBC14\uAFC9\uB2C8\uB2E4.",
      medium: "\uD2B9\uC815 \uACF5\uAC04\uC758 \uC810\uAC80\xB7\uBA74\uB2F4 \uD589\uB3D9\uACFC \uC81C\uD55C\uC801 \uB178\uCD9C\xB7\uC811\uCD09\uC744 \uC815\uC0C1 \uC808\uCC28\uB85C \uC7AC\uD574\uC11D\uD569\uB2C8\uB2E4.",
      strong: "\uACF5\uAC04 \uC804\uCCB4\uC758 \uC0AC\uD68C \uADDC\uBC94\uACFC \uC5C5\uBB34\xB7\uC808\uCC28\xB7\uC608\uC808, \uD575\uC2EC \uAE08\uAE30\uB97C \uC7AC\uC791\uC131\uD569\uB2C8\uB2E4."
    }[id]
  }));
  const remainingSlots = Math.max(0, capability.csa_max_active - capability.csa_active_count);
  const diagnostics = [remainingSlots > 0 ? { type: "success", text: `\uC0C8 \uC0C1\uC2DD\uAC1C\uBCC0\uC744 \uB4F1\uB85D\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uC2AC\uB86F ${remainingSlots}\uAC1C.` } : { type: "warning", text: `\uD65C\uC131 \uC2AC\uB86F\uC774 ${capability.csa_active_count}/${capability.csa_max_active}\uB85C \uAC00\uB4DD \uCC3C\uC2B5\uB2C8\uB2E4. \uAE30\uC874 \uAC1C\uBCC0\uC744 \uC218\uC815\uD558\uAC70\uB098 \uD574\uC81C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.` }];
  return {
    version: 2,
    mode: GAMEPLAY_MODE,
    title: "\uC0C1\uC2DD\uAC1C\uBCC0 \uC571 \uC0AC\uC6A9\uC790 \uB9E4\uB274\uC5BC",
    subtitle: "\uC774 \uBC84\uC804\uC740 \uAC1C\uC778 \uC554\uC2DC\uC640 \uCD5C\uBA74 \uAE30\uB2A5 \uC5C6\uC774 \uACF5\uAC04\uC758 \uC0AC\uD68C\uC801 \uC0C1\uC2DD\uB9CC \uBCC0\uACBD\uD569\uB2C8\uB2E4.",
    status: {
      level,
      exp: capability.exp,
      next_level_exp: capability.next_level_exp,
      exp_percent: progress,
      available_strength: capability.available_strength,
      csa_active: capability.csa_active_count,
      csa_max: capability.csa_max_active,
      csa_scope_type: "world",
      csa_scope_label: "\uD68C\uC0AC \uC804\uCCB4"
    },
    diagnostics,
    quick_start: [
      "\uBAA8\uB4E0 \uC0C1\uC2DD\uAC1C\uBCC0\uC740 \uD68C\uC0AC \uC804\uCCB4\uC758 \uACF5\uB3D9 \uC0AC\uD68C \uADDC\uBC94\uC73C\uB85C \uC801\uC6A9\uB429\uB2C8\uB2E4.",
      "\uBCC0\uACBD\uC740 \uBC18\uB4DC\uC2DC \uC0C1\uC2DD\uAC1C\uBCC0 \uC571 UI\uC5D0\uC11C \uC0DD\uC131\xB7\uC218\uC815\xB7\uD574\uC81C\uD569\uB2C8\uB2E4.",
      "\uAC15\uB3C4\uB294 \uC9C1\uC811 \uC758\uBBF8 \uBC94\uC704 \uC548\uC758 \uD655\uC2E0\uACFC \uC0AC\uD68C\uC801 \uC555\uB825\uB9CC \uBC14\uAFB8\uBA70 \uC758\uBBF8 \uBC94\uC704\uB97C \uB113\uD788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
      "\uD574\uC81C\uD558\uBA74 \uD604\uC7AC \uADDC\uBC94 \uC801\uC6A9\uB9CC \uBA48\uCD94\uACE0 \uC774\uBBF8 \uBC8C\uC5B4\uC9C4 \uC0AC\uAC74\uC758 \uAE30\uC5B5\uACFC \uBB3C\uB9AC \uC0C1\uD0DC\uB294 \uC720\uC9C0\uB429\uB2C8\uB2E4.",
      "\uB9E4\uB274\uC5BC \uC5F4\uB78C\uACFC \uD0ED \uC774\uB3D9\uC740 \uD134\uC744 \uC18C\uBE44\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
    ],
    common_sense: {
      title: "\uC0C1\uC2DD\uAC1C\uBCC0",
      description: "\uD2B9\uC815 \uAC1C\uC778\uC774 \uC544\uB2C8\uB77C \uD68C\uC0AC \uC804\uCCB4\uC758 \uC0AC\uD68C\uC801 \uADDC\uBC94\uC744 \uBCC0\uACBD\uD569\uB2C8\uB2E4. \uC778\uBB3C\uC740 \uAC01\uC790\uC758 \uC131\uACA9\uC744 \uC720\uC9C0\uD55C \uCC44 \uADF8 \uADDC\uBC94\uC744 \uB2F9\uC5F0\uD55C \uC804\uC81C\uB85C \uBC1B\uC544\uB4E4\uC785\uB2C8\uB2E4.",
      rules: [
        "activate\uB294 \uC0C8 \uD56D\uBAA9\uACFC \uD65C\uC131 \uC2AC\uB86F\uC744 \uB9CC\uB4ED\uB2C8\uB2E4.",
        "update\uB294 \uAC19\uC740 \uC2AC\uB86F\uC5D0\uC11C \uB0B4\uC6A9\uACFC \uAC15\uB3C4\uB97C \uBCC0\uACBD\uD569\uB2C8\uB2E4.",
        "deactivate\uB294 \uD6A8\uACFC\uB9CC \uD574\uC81C\uD558\uBA70 \uAE30\uC5B5\uACFC \uD604\uC7AC \uBB3C\uB9AC \uC0C1\uD0DC\uB294 \uC720\uC9C0\uD569\uB2C8\uB2E4.",
        "\uC5EC\uB7EC \uD56D\uBAA9\uC744 \uD569\uCCD0 \uC5B4\uB290 \uD56D\uBAA9\uC5D0\uB3C4 \uC5C6\uB294 \uB354 \uAC15\uD55C \uADDC\uCE59\uC744 \uB9CC\uB4E4\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        "\uC9C1\uC811 \uC758\uBBF8 \uBC94\uC704 \uBC16 \uD589\uB3D9\uC740 NPC\uC758 \uC131\uACA9\xB7\uAD00\uACC4\xB7\uC0C1\uD669\uACFC \uC790\uBC1C\uC801 \uC120\uD0DD\uC73C\uB85C \uBCC4\uB3C4 \uD310\uC815\uD569\uB2C8\uB2E4.",
        "\uB808\uBCA8\uC740 \uC0AC\uC6A9\uD560 \uC218 \uC788\uB294 \uAC15\uB3C4\uC640 \uB3D9\uC2DC\uC5D0 \uD65C\uC131\uD654\uD560 \uC218 \uC788\uB294 \uAC1C\uC218\uB9CC \uB298\uB9BD\uB2C8\uB2E4."
      ],
      current_scope: normalizeCsaScope(),
      scope_unlocks: [[1, "Lv.1~2"], [3, "Lv.3~4"], [5, "Lv.5~9"], [10, "Lv.10"]].map(([unlockLevel, levelRange]) => ({ level_range: levelRange, scope_type: "world", scope_label: "\uD68C\uC0AC \uC804\uCCB4", max_active: getCsaLimits(unlockLevel).max_active, available: level >= unlockLevel })),
      tiers: csaTiers
    },
    stats: [
      { id: "affinity", label: "\uD638\uAC10\uB3C4", range: "0~100", description: "NPC\uAC00 \uD50C\uB808\uC774\uC5B4\uC5D0\uAC8C \uB290\uB07C\uB294 \uAC10\uC815\uC801 \uD638\uC758\uC785\uB2C8\uB2E4.", change_rule: "\uD134\uB2F9 \uCD5C\uB300 -5~+5" },
      { id: "acceptance", label: "\uC0C1\uC2DD\uAC1C\uBCC0 \uC218\uC6A9\uB3C4", range: "0~100", description: "\uD65C\uC131 \uC0C1\uC2DD\uAC1C\uBCC0\uC758 \uC9C1\uC811 \uC758\uBBF8\uB97C \uC5BC\uB9C8\uB098 \uC790\uC5F0\uC2A4\uB7FD\uACE0 \uC801\uADF9\uC801\uC73C\uB85C \uC2E4\uD589\uD558\uB294\uC9C0 \uB098\uD0C0\uB0C5\uB2C8\uB2E4. \uD50C\uB808\uC774\uC5B4\uC5D0 \uB300\uD55C \uD638\uAC10\xB7\uBCF5\uC885\xB7\uB3D9\uC758\uC640\uB294 \uBCC4\uAC1C\uC785\uB2C8\uB2E4.", change_rule: "\uC2E4\uC81C \uC9C1\uC811 \uC801\uC6A9 \uC7A5\uBA74\uC5D0\uC11C\uB9CC \uBCC0\uD654" }
    ],
    unlocks: [
      { level: 1, items: ["\uC57D\uD568 \uAC15\uB3C4", "\uD68C\uC0AC \uC804\uCCB4 \uBC94\uC704", "\uD65C\uC131 2\uAC1C"] },
      { level: 3, items: ["\uC911\uAC04 \uAC15\uB3C4", "\uD65C\uC131 3\uAC1C"] },
      { level: 5, items: ["\uD65C\uC131 4\uAC1C"] },
      { level: 7, items: ["\uAC15\uD568 \uAC15\uB3C4"] },
      { level: 10, items: ["\uD65C\uC131 5\uAC1C"] }
    ],
    active_effects: { common_sense: activeCsa.filter((item) => item.active).map((item) => ({ strength: item.strength || "weak", scope_label: item.scope_label || "\uD68C\uC0AC \uC804\uCCB4", content: item.content || "" })) },
    common_failures: [
      { title: "\uC0C8 \uC0C1\uC2DD\uAC1C\uBCC0\uC744 \uB9CC\uB4E4 \uC218 \uC5C6\uC74C", reasons: ["\uD65C\uC131 \uC2AC\uB86F\uC774 \uAC00\uB4DD \uCC3C\uC2B5\uB2C8\uB2E4.", "\uC694\uCCAD \uBC94\uC704\uB098 \uAC15\uB3C4\uAC00 \uD604\uC7AC \uB808\uBCA8 \uD55C\uB3C4\uB97C \uB118\uC5C8\uC2B5\uB2C8\uB2E4.", "\uB0B4\uC6A9\uC774 \uC571 \uC9C0\uC6D0 \uBC94\uC704\uB97C \uBC97\uC5B4\uB0AC\uC2B5\uB2C8\uB2E4."] },
      { title: "\uC218\uC815\xB7\uD574\uC81C\uAC00 \uC801\uC6A9\uB418\uC9C0 \uC54A\uC74C", reasons: ["\uB300\uC0C1 \uD56D\uBAA9\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.", "\uC2E4\uC81C\uB85C \uBCC0\uACBD\uB418\uB294 \uAC12\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", "\uC774\uBBF8 \uBE44\uD65C\uC131 \uC0C1\uD0DC\uC785\uB2C8\uB2E4."] }
    ]
  };
}
__name(buildAppManualPayload, "buildAppManualPayload");
function buildAppStatePayload(save, catalog, sexualActionContract, player, npcs = []) {
  const manual = buildAppManualPayload(save, catalog);
  const activeCsa = getActiveCsaEntries(save);
  const strengthOptions = [["weak", "\uC57D\uD568", 1], ["medium", "\uC911\uAC04", 3], ["strong", "\uAC15\uD568", 7]].map(([id, label, unlockLevel]) => ({ id, label, available: manual.status.level >= unlockLevel, unlock_level: unlockLevel }));
  const scopeOptions = [{ id: "world", label: "\uD68C\uC0AC \uC804\uCCB4", available: true, unlock_level: 1 }];
  const commonSense = activeCsa.filter((item) => item.active).map((item) => ({
    id: item.id,
    strength: appStrengthId(item.strength),
    strength_label: item.strength || "weak",
    content: item.content || "",
    ...normalizeCsaScope(),
    created_turn: item.created_turn ?? null,
    source_type: item.source_type === "preset" ? "preset" : "custom",
    preset: item.source_type === "preset" && item.preset ? item.preset : null,
    semantic_contract: buildCsaSemanticContract(item, sexualActionContract)
  }));
  return {
    version: 2,
    mode: GAMEPLAY_MODE,
    title: "\uC0C1\uC2DD\uAC1C\uBCC0 \uC571",
    turn_count: Number.isInteger(save?.turn_state?.committed_turn) ? save.turn_state.committed_turn : 0,
    home: { status: manual.status, diagnostics: manual.diagnostics },
    strength_options: strengthOptions,
    scope_options: scopeOptions,
    common_sense: commonSense,
    csa_presets: buildPresetCatalogPayload(catalog, appStrengthId(manual.status.available_strength)),
    manual,
    player_info: player,
    npcs: Array.isArray(npcs) ? npcs : []
  };
}
__name(buildAppStatePayload, "buildAppStatePayload");

// src/engine/media/image-selector.js
function isPlainObject15(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject15, "isPlainObject");
function scoreCandidate(candidate, request) {
  let score = 0;
  if (typeof request.situation === "string" && request.situation && candidate.situation === request.situation) score += 10;
  const requestedTags = new Set([...Array.isArray(request.tags) ? request.tags : [], request.locationId].filter(Boolean));
  const candidateTags = new Set(Array.isArray(candidate.tags) ? candidate.tags : []);
  for (const tag of requestedTags) if (candidateTags.has(tag)) score += 2;
  return score;
}
__name(scoreCandidate, "scoreCandidate");
function selectImage(candidates, request = {}) {
  const pool = (Array.isArray(candidates) ? candidates : []).filter(isPlainObject15).slice(0, 8);
  if (!pool.length) return null;
  const scored = pool.map((candidate) => ({ candidate, score: scoreCandidate(candidate, request) })).sort((a, b) => b.score - a.score || (a.candidate.curation_rank ?? Infinity) - (b.candidate.curation_rank ?? Infinity) || String(a.candidate.image_id).localeCompare(String(b.candidate.image_id)));
  const best = scored[0];
  if (best.score > 0) return { image_id: best.candidate.image_id, image_url: best.candidate.image_url, source: "match" };
  const primary = [...pool].sort((a, b) => (a.curation_rank ?? Infinity) - (b.curation_rank ?? Infinity) || String(a.image_id).localeCompare(String(b.image_id)))[0];
  return { image_id: primary.image_id, image_url: primary.image_url, source: "primary" };
}
__name(selectImage, "selectImage");

// src/engine/media/tts-contract.js
function findCharacter(master, speakerId) {
  const characters = Array.isArray(master?.characters) ? master.characters : [];
  return characters.find((character) => character?.character_id === speakerId) ?? null;
}
__name(findCharacter, "findCharacter");
function resolveTtsEligibility({ speakerId, text: text5, master } = {}) {
  if (typeof text5 !== "string" || !text5.trim()) return { eligible: false, code: "EMPTY_TEXT" };
  if (!speakerId || speakerId === "narrator") return { eligible: false, code: "NARRATOR_NOT_ELIGIBLE" };
  const character = findCharacter(master, speakerId);
  if (!character) return { eligible: false, code: "UNKNOWN_SPEAKER" };
  const voiceId = typeof character.voice_id === "string" && character.voice_id.trim() ? character.voice_id : null;
  if (!voiceId) return { eligible: false, code: "NO_VOICE_ID" };
  return { eligible: true, voice_id: voiceId };
}
__name(resolveTtsEligibility, "resolveTtsEligibility");

// content/edition.json
var edition_default = {
  edition_id: "company-v1",
  title: "\uC0C1\uC2DD\uAC1C\uBCC0: \uD68C\uC0AC\uD3B8",
  content_version: "0.1.0-heroines-v1",
  scope: "company"
};

// content/organization.json
var organization_default = {
  company: {
    company_id: "luminous_brand_group",
    name: "\uB8E8\uBBF8\uB108\uC2A4 \uBE0C\uB79C\uB4DC \uADF8\uB8F9"
  },
  departments: [
    { department_id: "brand_strategy", name: "\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300", ui_hint: "\uD788\uB85C\uC778 5\uBA85" },
    { department_id: "audit", name: "\uAC10\uC0AC\uC2E4", ui_hint: "\uC870\uC0AC \uAD8C\uD55C" },
    { department_id: "human_resources", name: "\uC778\uC0AC\uD300", ui_hint: "\uC778\uC0AC \uC815\uBCF4" },
    { department_id: "new_business_tf", name: "\uC2E0\uC0AC\uC5C5TF", ui_hint: "\uC2E0\uADDC \uC0AC\uC5C5" },
    { department_id: "finance_planning", name: "\uC7AC\uBB34\uAE30\uD68D\uD300", ui_hint: "\uC608\uC0B0 \uAD8C\uD55C" },
    { department_id: "public_relations", name: "\uD64D\uBCF4\uD300", ui_hint: "\uC678\uBD80 \uB300\uC751" }
  ],
  general_npc_departments: [
    { department_id: "design", name: "\uB514\uC790\uC778\uD300" },
    { department_id: "finance", name: "\uC7AC\uBB34\uD300" },
    { department_id: "hr", name: "\uC778\uC0AC\uD300(\uD604\uC5C5)" },
    { department_id: "operations", name: "\uC2DC\uC124\xB7\uBCF4\uC548" },
    { department_id: "marketing", name: "\uB9C8\uCF00\uD305\uD300" },
    { department_id: "management_support", name: "\uACBD\uC601\uC9C0\uC6D0\uD300" }
  ]
};

// content/map.json
var map_default = { schema_version: 2, building_name: "\uD68C\uC0AC \uBCF8\uAD00", floors: [1, 2, 3, 4, 5], locations: [{ location_id: "lobby", name: "1\uCE35 \uB85C\uBE44", floor: 1, zone: "\uCD9C\uC785\xB7\uACF5\uC6A9", description: "\uC548\uB0B4 \uB370\uC2A4\uD06C\uC640 \uBC29\uBB38\uAC1D \uB300\uAE30 \uACF5\uAC04\uC774 \uC788\uB294 \uD68C\uC0AC\uC758 \uC815\uBB38.", department_id: null, location_type: "public_entrance", visibility: "public", access_roles: [], aliases: ["\uB85C\uBE44", "\uD68C\uC0AC \uB85C\uBE44", "1\uCE35"], adjacent_location_ids: ["elevator_hall", "archive_room"], default_npc_ids: ["general_oh_sehoon"], default_npcs: [{ npc_id: "general_oh_sehoon", name: "\uC624\uC138\uD6C8", role: "\uC2DC\uC124\xB7\uBCF4\uC548 \uB2F4\uB2F9", department: "\uC6B4\uC601\uC9C0\uC6D0" }], scene_tags: ["public_entrance", "public"] }, { location_id: "elevator_hall", name: "\uC5D8\uB9AC\uBCA0\uC774\uD130 \uD640", floor: 1, zone: "\uCD9C\uC785\xB7\uACF5\uC6A9", description: "\uAC01 \uCE35\uC744 \uC5F0\uACB0\uD558\uB294 \uACF5\uC6A9 \uC774\uB3D9 \uACF5\uAC04.", department_id: null, location_type: "circulation", visibility: "public", access_roles: [], aliases: ["\uC5D8\uB9AC\uBCA0\uC774\uD130", "\uC2B9\uAC15\uAE30"], adjacent_location_ids: ["lobby", "training_room", "office", "brand_strategy_office", "project_room", "large_meeting_room"], default_npc_ids: [], default_npcs: [], scene_tags: ["circulation", "public"] }, { location_id: "archive_room", name: "\uC790\uB8CC\uBCF4\uAD00\uC2E4", floor: 1, zone: "\uCD9C\uC785\xB7\uACF5\uC6A9", description: "\uC9C0\uB09C \uD504\uB85C\uC81D\uD2B8 \uBB38\uC11C\uC640 \uACF5\uC6A9 \uAE30\uB85D\uC744 \uBCF4\uAD00\uD558\uB294 \uC81C\uD55C \uAD6C\uC5ED.", department_id: "operations", location_type: "storage", visibility: "restricted", access_roles: ["employee"], aliases: ["\uBB38\uC11C\uACE0", "\uBCF4\uAD00\uC2E4", "\uC790\uB8CC\uC2E4"], adjacent_location_ids: ["lobby", "elevator_hall"], default_npc_ids: [], default_npcs: [], scene_tags: ["storage", "restricted", "operations"] }, { location_id: "hr_office", name: "\uC778\uC0AC\uD300 \uC0AC\uBB34\uC2E4", floor: 2, zone: "\uAD00\uB9AC\xB7\uAD50\uC721", description: "\uC778\uC0AC \uC0C1\uB2F4\uACFC \uC870\uC9C1 \uC6B4\uC601 \uC5C5\uBB34\uB97C \uB2F4\uB2F9\uD558\uB294 \uC0AC\uBB34\uC2E4.", department_id: "hr", location_type: "department_office", visibility: "public", access_roles: [], aliases: ["\uC778\uC0AC\uD300", "\uC778\uC0AC\uC2E4"], adjacent_location_ids: ["training_room", "finance_office", "office"], default_npc_ids: ["general_seo_hyejin"], default_npcs: [{ npc_id: "general_seo_hyejin", name: "\uC11C\uD61C\uC9C4", role: "\uC778\uC0AC\uD300 \uACFC\uC7A5", department: "\uC778\uC0AC\uD300" }], scene_tags: ["department_office", "public", "hr"] }, { location_id: "finance_office", name: "\uC7AC\uBB34\uD300 \uC0AC\uBB34\uC2E4", floor: 2, zone: "\uAD00\uB9AC\xB7\uAD50\uC721", description: "\uD68C\uACC4\uC640 \uBE44\uC6A9 \uAD00\uB828 \uC5C5\uBB34\uB97C \uB2F4\uB2F9\uD558\uB294 \uC870\uC6A9\uD55C \uC0AC\uBB34\uC2E4.", department_id: "finance", location_type: "department_office", visibility: "public", access_roles: [], aliases: ["\uC7AC\uBB34\uD300", "\uD68C\uACC4\uD300", "\uC7AC\uBB34\uC2E4"], adjacent_location_ids: ["hr_office", "small_meeting_room", "office"], default_npc_ids: ["general_choi_yujin"], default_npcs: [{ npc_id: "general_choi_yujin", name: "\uCD5C\uC720\uC9C4", role: "\uC7AC\uBB34\uD300 \uC0AC\uC6D0", department: "\uC7AC\uBB34\uD300" }], scene_tags: ["department_office", "public", "finance"] }, { location_id: "training_room", name: "\uAD50\uC721\uC7A5", floor: 2, zone: "\uAD00\uB9AC\xB7\uAD50\uC721", description: "\uC2E0\uC785 \uAD50\uC721\uACFC \uC0AC\uB0B4 \uC6CC\uD06C\uC20D\uC744 \uC9C4\uD589\uD558\uB294 \uB113\uC740 \uAC15\uC758 \uACF5\uAC04.", department_id: null, location_type: "training", visibility: "public", access_roles: [], aliases: ["\uAD50\uC721\uC2E4", "\uC5F0\uC218\uC2E4"], adjacent_location_ids: ["elevator_hall", "hr_office", "meeting_room"], default_npc_ids: [], default_npcs: [], scene_tags: ["training", "public"] }, { location_id: "office", name: "\uACF5\uC6A9 \uC624\uD53C\uC2A4", floor: 2, zone: "\uAD00\uB9AC\xB7\uAD50\uC721", description: "\uC9C0\uC6D0 \uBD80\uC11C\uC640 \uACF5\uC6A9 \uC88C\uC11D\uC774 \uBC30\uCE58\uB41C \uAC1C\uBC29\uD615 \uC0AC\uBB34 \uACF5\uAC04.", department_id: null, location_type: "office_floor", visibility: "public", access_roles: [], aliases: ["\uACF5\uC6A9 \uC0AC\uBB34\uC2E4", "\uC0AC\uBB34\uC2E4"], adjacent_location_ids: ["elevator_hall", "hr_office", "finance_office", "team_office"], default_npc_ids: [], default_npcs: [], scene_tags: ["office_floor", "public"] }, { location_id: "team_office", name: "\uACF5\uC6A9 \uD300\uC874", floor: 2, zone: "\uAD00\uB9AC\xB7\uAD50\uC721", description: "\uB2E8\uAE30 \uD504\uB85C\uC81D\uD2B8 \uD300\uC774 \uD568\uAED8 \uC4F0\uB294 \uC720\uB3D9 \uC88C\uC11D \uAD6C\uC5ED.", department_id: null, location_type: "team_space", visibility: "public", access_roles: [], aliases: ["\uD300 \uC0AC\uBB34\uACF5\uAC04", "\uD300\uC874"], adjacent_location_ids: ["office", "small_meeting_room"], default_npc_ids: [], default_npcs: [], scene_tags: ["team_space", "public"] }, { location_id: "small_meeting_room", name: "2\uCE35 \uC18C\uD68C\uC758\uC2E4", floor: 2, zone: "\uAD00\uB9AC\xB7\uAD50\uC721", description: "\uB450\uC138 \uBA85\uC758 \uC9E7\uC740 \uBA74\uB2F4\uACFC \uC18C\uADDC\uBAA8 \uD68C\uC758\uC5D0 \uC4F0\uB294 \uACF5\uAC04.", department_id: null, location_type: "meeting_room", visibility: "restricted", access_roles: ["employee"], aliases: ["\uC18C\uD68C\uC758\uC2E4", "\uC791\uC740 \uD68C\uC758\uC2E4"], adjacent_location_ids: ["finance_office", "team_office", "meeting_room"], default_npc_ids: [], default_npcs: [], scene_tags: ["meeting_room", "restricted"] }, { location_id: "meeting_room", name: "2\uCE35 \uACF5\uC6A9 \uD68C\uC758\uC2E4", floor: 2, zone: "\uAD00\uB9AC\xB7\uAD50\uC721", description: "\uBD80\uC11C \uAD6C\uBD84 \uC5C6\uC774 \uC608\uC57D\uD574\uC11C \uC0AC\uC6A9\uD558\uB294 \uD45C\uC900 \uD68C\uC758\uC2E4.", department_id: null, location_type: "meeting_room", visibility: "public", access_roles: [], aliases: ["\uACF5\uC6A9 \uD68C\uC758\uC2E4", "\uD68C\uC758\uC2E4"], adjacent_location_ids: ["training_room", "small_meeting_room", "cross_dept_meeting_room"], default_npc_ids: [], default_npcs: [], scene_tags: ["meeting_room", "public"] }, { location_id: "brand_strategy_office", name: "\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300 \uC0AC\uBB34\uC2E4", floor: 3, zone: "\uBE0C\uB79C\uB4DC\xB7\uB9C8\uCF00\uD305", description: "\uB2E4\uC12F \uD575\uC2EC \uD788\uB85C\uC778\uACFC \uBE0C\uB79C\uB4DC\uC804\uB7B5 \uC778\uB825\uC774 \uADFC\uBB34\uD558\uB294 \uBA54\uC778 \uC624\uD53C\uC2A4.", department_id: "brand_strategy", location_type: "team_space", visibility: "public", access_roles: [], aliases: ["\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300", "\uBE0C\uB79C\uB4DC\uD300", "\uBE0C\uB79C\uB4DC \uC0AC\uBB34\uC2E4"], adjacent_location_ids: ["brand_strategy_meeting_room", "marketing_office", "pantry", "employee_lounge", "elevator_hall"], default_npc_ids: ["general_park_jungwoo"], default_npcs: [{ npc_id: "general_park_jungwoo", name: "\uBC15\uC815\uC6B0", role: "\uBE0C\uB79C\uB4DC\uC804\uB7B51\uD300 \uD300\uC7A5", department: "\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300" }], scene_tags: ["team_space", "public", "brand_strategy"] }, { location_id: "brand_strategy_meeting_room", name: "\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300 \uD68C\uC758\uC2E4", floor: 3, zone: "\uBE0C\uB79C\uB4DC\xB7\uB9C8\uCF00\uD305", description: "\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300 \uB0B4\uBD80 \uB300\uD654\uC640 \uC18C\uADDC\uBAA8 \uBBF8\uD305\uC5D0 \uC4F0\uB294 \uC720\uB9AC\uBCBD \uD68C\uC758\uC2E4.", department_id: "brand_strategy", location_type: "meeting_room", visibility: "restricted", access_roles: ["employee"], aliases: ["\uBE0C\uB79C\uB4DC\uD300 \uD68C\uC758\uC2E4", "\uBE0C\uB79C\uB4DC \uD68C\uC758\uC2E4"], adjacent_location_ids: ["brand_strategy_office", "marketing_office", "pantry"], default_npc_ids: [], default_npcs: [], scene_tags: ["meeting_room", "restricted", "brand_strategy"] }, { location_id: "marketing_office", name: "\uB9C8\uCF00\uD305\uD300 \uC0AC\uBB34\uC2E4", floor: 3, zone: "\uBE0C\uB79C\uB4DC\xB7\uB9C8\uCF00\uD305", description: "\uD504\uB85C\uBAA8\uC158\uACFC \uCC44\uB110 \uC6B4\uC601 \uC778\uB825\uC774 \uADFC\uBB34\uD558\uB294 \uD65C\uAE30\uCC2C \uC0AC\uBB34\uC2E4.", department_id: "marketing", location_type: "department_office", visibility: "public", access_roles: [], aliases: ["\uB9C8\uCF00\uD305\uD300", "\uB9C8\uCF00\uD305\uC2E4"], adjacent_location_ids: ["brand_strategy_office", "brand_strategy_meeting_room", "employee_lounge"], default_npc_ids: ["general_jung_daeun"], default_npcs: [{ npc_id: "general_jung_daeun", name: "\uC815\uB2E4\uC740", role: "\uB9C8\uCF00\uD305 \uC778\uD134", department: "\uB9C8\uCF00\uD305\uD300" }], scene_tags: ["department_office", "public", "marketing"] }, { location_id: "pantry", name: "\uD0D5\uBE44\uC2E4", floor: 3, zone: "\uBE0C\uB79C\uB4DC\xB7\uB9C8\uCF00\uD305", description: "\uCEE4\uD53C\uC640 \uAC04\uB2E8\uD55C \uAC04\uC2DD\uC744 \uC774\uC6A9\uD558\uB294 \uC791\uC740 \uACF5\uC6A9 \uACF5\uAC04.", department_id: null, location_type: "amenity", visibility: "public", access_roles: [], aliases: ["\uCEE4\uD53C\uC2E4"], adjacent_location_ids: ["brand_strategy_office", "brand_strategy_meeting_room", "employee_lounge"], default_npc_ids: [], default_npcs: [], scene_tags: ["amenity", "public"] }, { location_id: "employee_lounge", name: "\uC9C1\uC6D0 \uB77C\uC6B4\uC9C0", floor: 3, zone: "\uBE0C\uB79C\uB4DC\xB7\uB9C8\uCF00\uD305", description: "\uC18C\uD30C\uC640 \uCC3D\uAC00 \uC88C\uC11D\uC774 \uC788\uB294 \uD734\uC2DD\xB7\uC7A1\uB2F4 \uACF5\uAC04.", department_id: null, location_type: "amenity", visibility: "public", access_roles: [], aliases: ["\uD734\uAC8C\uC2E4", "\uB77C\uC6B4\uC9C0", "\uC9C1\uC6D0 \uD734\uAC8C\uC2E4"], adjacent_location_ids: ["brand_strategy_office", "marketing_office", "pantry", "elevator_hall"], default_npc_ids: [], default_npcs: [], scene_tags: ["amenity", "public"] }, { location_id: "design_office", name: "\uB514\uC790\uC778\uD300 \uC0AC\uBB34\uC2E4", floor: 4, zone: "\uB514\uC790\uC778\xB7\uD611\uC5C5", description: "\uB514\uC790\uC778 \uC2DC\uC548\uACFC \uC81C\uC791 \uC7A5\uBE44\uAC00 \uB193\uC778 \uD06C\uB9AC\uC5D0\uC774\uD2F0\uBE0C \uC624\uD53C\uC2A4.", department_id: "design", location_type: "department_office", visibility: "public", access_roles: [], aliases: ["\uB514\uC790\uC778\uD300", "\uB514\uC790\uC778\uC2E4"], adjacent_location_ids: ["project_room", "cross_team_space", "elevator_hall"], default_npc_ids: ["general_lee_minseok"], default_npcs: [{ npc_id: "general_lee_minseok", name: "\uC774\uBBFC\uC11D", role: "\uB514\uC790\uC778\uD300 \uB300\uB9AC", department: "\uB514\uC790\uC778\uD300" }], scene_tags: ["department_office", "public", "design"] }, { location_id: "project_room", name: "\uD504\uB85C\uC81D\uD2B8\uB8F8", floor: 4, zone: "\uB514\uC790\uC778\xB7\uD611\uC5C5", description: "\uC2DC\uC548\uACFC \uBCF4\uB4DC\uB97C \uD3BC\uCCD0\uB193\uACE0 \uC9D1\uC911 \uC791\uC5C5\uD558\uB294 \uD504\uB85C\uC81D\uD2B8 \uC804\uC6A9 \uACF5\uAC04.", department_id: "design", location_type: "project_space", visibility: "public", access_roles: [], aliases: ["\uD504\uB85C\uC81D\uD2B8\uC2E4"], adjacent_location_ids: ["design_office", "cross_team_space", "cross_dept_meeting_room"], default_npc_ids: [], default_npcs: [], scene_tags: ["project_space", "public", "design"] }, { location_id: "cross_team_space", name: "\uD611\uC5C5 \uB77C\uC6B4\uC9C0", floor: 4, zone: "\uB514\uC790\uC778\xB7\uD611\uC5C5", description: "\uC0AC\uB0B4 \uD300\uACFC \uC678\uBD80 \uD611\uB825\uC0AC\uAC00 \uD568\uAED8 \uC0AC\uC6A9\uD558\uB294 \uC5F4\uB9B0 \uD611\uC5C5 \uACF5\uAC04.", department_id: null, location_type: "collaboration", visibility: "public", access_roles: [], aliases: ["\uD611\uC5C5 \uACF5\uAC04", "\uD611\uC5C5\uC874"], adjacent_location_ids: ["design_office", "project_room", "cross_dept_meeting_room"], default_npc_ids: ["general_yoon_taekyung"], default_npcs: [{ npc_id: "general_yoon_taekyung", name: "\uC724\uD0DC\uACBD", role: "\uD611\uB825\uC0AC \uD504\uB85C\uC81D\uD2B8 \uB9E4\uB2C8\uC800", department: "\uC678\uBD80 \uD611\uB825\uC0AC" }], scene_tags: ["collaboration", "public"] }, { location_id: "cross_dept_meeting_room", name: "\uBD80\uC11C\uAC04 \uD68C\uC758\uC2E4", floor: 4, zone: "\uB514\uC790\uC778\xB7\uD611\uC5C5", description: "\uC5EC\uB7EC \uBD80\uC11C\uAC00 \uD568\uAED8 \uC0AC\uC6A9\uD558\uB294 \uC911\uD615 \uD68C\uC758\uC2E4.", department_id: null, location_type: "meeting_room", visibility: "restricted", access_roles: ["employee", "manager"], aliases: ["\uBD80\uC11C \uD68C\uC758\uC2E4"], adjacent_location_ids: ["meeting_room", "project_room", "cross_team_space", "large_meeting_room"], default_npc_ids: [], default_npcs: [], scene_tags: ["meeting_room", "restricted"] }, { location_id: "audit_office", name: "\uAC10\uC0AC\uC2E4", floor: 5, zone: "\uAC10\uC0AC\xB7\uC784\uC6D0", description: "\uD50C\uB808\uC774\uC5B4\uAC00 \uC18C\uC18D\uB41C \uAC10\uC0AC \uC870\uC9C1\uC758 \uB3C5\uB9BD \uC0AC\uBB34 \uACF5\uAC04.", department_id: "audit", location_type: "audit_office", visibility: "private", access_roles: ["employee", "manager", "executive"], aliases: ["\uAC10\uC0AC\uD300", "\uAC10\uC0AC\uC2E4 \uC0AC\uBB34\uC2E4"], adjacent_location_ids: ["project_report_room", "executive_office", "elevator_hall"], default_npc_ids: [], default_npcs: [], scene_tags: ["audit_office", "private", "audit"] }, { location_id: "executive_office", name: "\uACBD\uC601\uC9C0\uC6D0\xB7\uC784\uC6D0\uC2E4", floor: 5, zone: "\uAC10\uC0AC\xB7\uC784\uC6D0", description: "\uACBD\uC601\uC9C0\uC6D0 \uCC45\uC784\uC790\uC640 \uC784\uC6D0\uC774 \uC0AC\uC6A9\uD558\uB294 \uC81C\uD55C \uC0AC\uBB34 \uACF5\uAC04.", department_id: "management_support", location_type: "executive_office", visibility: "private", access_roles: ["manager", "executive"], aliases: ["\uC784\uC6D0\uC2E4", "\uACBD\uC601\uC9C0\uC6D0\uD300", "\uACBD\uC601\uC9C0\uC6D0\uC2E4"], adjacent_location_ids: ["audit_office", "executive_meeting_room", "large_meeting_room"], default_npc_ids: ["general_han_jiseok"], default_npcs: [{ npc_id: "general_han_jiseok", name: "\uD55C\uC9C0\uC11D", role: "\uACBD\uC601\uC9C0\uC6D0\uD300 \uCC28\uC7A5", department: "\uACBD\uC601\uC9C0\uC6D0\uD300" }], scene_tags: ["executive_office", "private", "management_support"] }, { location_id: "large_meeting_room", name: "\uB300\uD68C\uC758\uC2E4", floor: 5, zone: "\uAC10\uC0AC\xB7\uC784\uC6D0", description: "\uC804\uC0AC \uBC1C\uD45C\uC640 \uC5EC\uB7EC \uD300\uC774 \uBAA8\uC774\uB294 \uD070 \uD68C\uC758 \uACF5\uAC04.", department_id: null, location_type: "meeting_room", visibility: "restricted", access_roles: ["employee"], aliases: ["\uD070 \uD68C\uC758\uC2E4"], adjacent_location_ids: ["cross_dept_meeting_room", "executive_office", "executive_meeting_room"], default_npc_ids: [], default_npcs: [], scene_tags: ["meeting_room", "restricted"] }, { location_id: "executive_meeting_room", name: "\uC784\uC6D0 \uD68C\uC758\uC2E4", floor: 5, zone: "\uAC10\uC0AC\xB7\uC784\uC6D0", description: "\uC784\uC6D0\uAE09 \uC758\uC0AC\uACB0\uC815\uACFC \uBE44\uACF5\uAC1C \uBA74\uB2F4\uC744 \uC704\uD55C \uD68C\uC758\uC2E4.", department_id: "management_support", location_type: "meeting_room", visibility: "private", access_roles: ["manager", "executive"], aliases: ["\uC784\uC6D0\uD68C\uC758\uC2E4"], adjacent_location_ids: ["executive_office", "large_meeting_room", "project_report_room"], default_npc_ids: [], default_npcs: [], scene_tags: ["meeting_room", "private", "management_support"] }, { location_id: "project_report_room", name: "\uD504\uB85C\uC81D\uD2B8 \uBCF4\uACE0\uC2E4", floor: 5, zone: "\uAC10\uC0AC\xB7\uC784\uC6D0", description: "\uD504\uB85C\uC81D\uD2B8 \uACB0\uACFC\uB97C \uBCF4\uACE0\uD558\uACE0 \uAC80\uD1A0\uD558\uB294 \uACF5\uC2DD \uBCF4\uACE0 \uACF5\uAC04.", department_id: null, location_type: "meeting_room", visibility: "restricted", access_roles: ["employee", "manager"], aliases: ["\uBCF4\uACE0\uC2E4", "\uD504\uB85C\uC81D\uD2B8 \uBCF4\uACE0\uC2E4"], adjacent_location_ids: ["audit_office", "executive_meeting_room"], default_npc_ids: [], default_npcs: [], scene_tags: ["meeting_room", "restricted"] }] };

// content/characters.json
var characters_default = {
  characters: {
    heroine1: {
      character_id: "heroine1",
      name: "\uC11C\uC6D0\uD76C",
      age: 33,
      gender: "female",
      department: "\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300",
      position: "\uCC28\uC7A5",
      role_title: "\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300 \uD300\uC7A5",
      company_tenure: "9\uB144 \uCC28",
      prompt_card: {
        identity: "\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300\uC744 \uC774\uB044\uB294 33\uC138 \uD300\uC7A5. \uC0AC\uB78C\uACFC \uD300\uC758 \uBC29\uD5A5\uC744 \uCC45\uC784\uC9C0\uB294 \uC0DD\uD65C\uD615 \uB9AC\uB354.",
        appearance: "\uD751\uAC08\uC0C9 \uC6E8\uC774\uBE0C \uD5E4\uC5B4\uC640 \uCC28\uBD84\uD55C \uAC08\uC0C9 \uB208, \uB2E8\uC815\uD55C \uB124\uC774\uBE44 \uC815\uC7A5 \uCC28\uB9BC.",
        personality: "\uD300\uC6D0\uC758 \uC0C1\uD0DC\uB97C \uC138\uC2EC\uD788 \uC0B4\uD53C\uC9C0\uB9CC \uCC45\uC784 \uD68C\uD53C\uC5D0\uB294 \uB2E8\uD638\uD558\uB2E4. \uD798\uB4E4\uC5B4\uB3C4 \uB0B4\uC0C9\uD558\uC9C0 \uC54A\uB294\uB2E4.",
        speech: "\uBD80\uB4DC\uB7FD\uACE0 \uBD84\uBA85\uD55C \uC874\uB313\uB9D0\uB85C \uACB0\uB860\uACFC \uC774\uC720\uB97C \uD568\uAED8 \uC804\uD55C\uB2E4.",
        addressing: "\uD300\uC6D0\uC5D0\uAC8C\uB294 \uC774\uB984+\uC528, \uACF5\uC2DD \uC790\uB9AC\uC5D0\uC11C\uB294 \uC9C1\uAE09+\uB2D8\uC744 \uC4F0\uBA70 \uD56D\uC0C1 \uC874\uB313\uB9D0\uC744 \uC720\uC9C0\uD55C\uB2E4.",
        distinctive_traits: [
          "\uCC45\uC784\uC744 \uBA3C\uC800 \uC9CA\uC5B4\uC9D0",
          "\uACFC\uB85C\uB97C \uC228\uAE40",
          "\uD300 \uBD84\uC704\uAE30\uB97C \uC138\uC2EC\uD788 \uAD00\uCC30"
        ],
        csa_style: "\uAC89\uC73C\uB85C \uCE68\uCC29\uD558\uC9C0\uB9CC \uD300\uC6D0\uC758 \uC548\uC804\uACFC \uC120\uD0DD\uAD8C\uC744 \uBA3C\uC800 \uB530\uC9C4\uB2E4."
      },
      body: {
        height_cm: 168,
        weight_kg: 55,
        body_type: "\uADE0\uD615 \uC7A1\uD78C \uC131\uC219\uD55C \uCCB4\uD615",
        cup: "C\uCEF5"
      },
      private_info: {
        nipple: "\uCC28\uBD84\uD55C \uBD84\uD64D\uBE5B",
        areola_size: "\uBCF4\uD1B5",
        areola_color: "\uC605\uC740 \uAC08\uC0C9",
        pubic_hair: "\uB2E8\uC815\uD558\uAC8C \uC815\uB9AC",
        past_partner_count: 2,
        past_orgasm_count: 7,
        relationship: "\uD604\uC7AC \uC5F0\uC778 \uC5C6\uC74C",
        intimate_notes: "\uC8FC\uB3C4\uAD8C\uC744 \uC27D\uAC8C \uB0B4\uC8FC\uC9C0 \uC54A\uC73C\uBA70 \uCDA9\uBD84\uD55C \uC2E0\uB8B0\uC640 \uBA85\uD655\uD55C \uD569\uC758\uB97C \uC911\uC694\uD558\uAC8C \uC5EC\uAE34\uB2E4."
      },
      initial_relationship: {
        closeness: "acquaintance",
        romance_status: "none",
        current_boundary: "professional",
        milestones: {
          first_kiss_turn: null,
          sexual_relationship_started_turn: null
        },
        relationship_summary: "\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300\uC5D0 \uD569\uB958\uD55C \uD50C\uB808\uC774\uC5B4\uB97C \uD300\uC6D0\uC73C\uB85C \uB300\uD558\uBA70 \uC2E4\uBB34 \uB2A5\uB825, \uCC45\uC784\uAC10, \uD0C0\uC778\uC744 \uB300\uD558\uB294 \uD0DC\uB3C4\uB97C \uAD00\uCC30\uD558\uACE0 \uC788\uB2E4."
      },
      initial_stats: {
        affinity: 10,
        resistance: 45,
        csa_acceptance: 50
      },
      initial_csa_attitudes: {},
      storage_bucket: "Image",
      storage_prefix: "Heroine1",
      primary_image_path: "Heroine1/one_main.jpg",
      adult_image_prefix: "Heroine1/adult/",
      voice_id: "259d7fde62cd445fbde3ce2d8d4f2f3b",
      mapping_status: "resolved",
      default_location_id: "brand_strategy_office"
    },
    heroine2: {
      character_id: "heroine2",
      name: "\uC724\uBBFC\uC544",
      age: 29,
      gender: "female",
      department: "\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300",
      position: "\uB300\uB9AC",
      role_title: "\uAE00\uB85C\uBC8C \uCEA0\uD398\uC778 PM",
      company_tenure: "5\uB144 \uCC28",
      prompt_card: {
        identity: "\uAE00\uB85C\uBC8C \uCEA0\uD398\uC778\uC744 \uC774\uB044\uB294 29\uC138 \uB300\uB9AC. \uC2E4\uD589\uACFC \uACB0\uACFC\uB97C \uCC45\uC784\uC9C0\uB294 \uD300\uC758 \uC5D0\uC774\uC2A4.",
        appearance: "\uC5F0\uAC08\uC0C9 \uC7A5\uBC1C\uACFC \uB610\uB837\uD55C \uB208\uB9E4, \uC138\uB828\uB41C \uD558\uB298\uC0C9 \uBE14\uB77C\uC6B0\uC2A4 \uCC28\uB9BC.",
        personality: "\uBE60\uB978 \uD310\uB2E8\uACFC \uC900\uBE44\uC131\uC744 \uAC16\uCDC4\uC9C0\uB9CC \uC644\uBCBD\uD574 \uBCF4\uC5EC\uC57C \uD55C\uB2E4\uB294 \uBD80\uB2F4\uC744 \uC548\uACE0 \uC788\uB2E4.",
        speech: "\uBE60\uB974\uACE0 \uBA85\uB8CC\uD55C \uC874\uB313\uB9D0\uB85C \uACB0\uB860\uACFC \uC2E4\uD589\uC548\uC744 \uBA3C\uC800 \uC81C\uC2DC\uD55C\uB2E4.",
        addressing: "\uC120\uBC30\uC5D0\uAC8C\uB294 \uC9C1\uAE09 \uD638\uCE6D, \uD6C4\uBC30\uC5D0\uAC8C\uB294 \uC774\uB984+\uC528\uB97C \uC4F0\uBA70 \uACF5\uC2DD \uC790\uB9AC\uC5D0\uC11C\uB294 \uC874\uB313\uB9D0\uC744 \uC9C0\uD0A8\uB2E4.",
        distinctive_traits: [
          "\uBE48\uD2C8\uC744 \uC228\uAE40",
          "\uB3C4\uC6C0 \uC694\uCCAD\uC774 \uB2A6\uC74C",
          "\uBE60\uB978 \uC0C1\uD669 \uD310\uB2E8"
        ],
        csa_style: "\uD45C\uBA74 \uC801\uC751\uC740 \uBE60\uB974\uC9C0\uB9CC \uC790\uC2E0\uC758 \uC120\uD0DD\uAD8C \uCE68\uD574\uC5D0\uB294 \uB2E8\uD638\uD788 \uBC18\uC751\uD55C\uB2E4."
      },
      body: {
        height_cm: 165,
        weight_kg: 51,
        body_type: "\uC2AC\uB9BC\uD558\uACE0 \uD0C4\uD0C4\uD55C \uCCB4\uD615",
        cup: "B\uCEF5"
      },
      private_info: {
        nipple: "\uC120\uBA85\uD55C \uBD84\uD64D\uBE5B",
        areola_size: "\uC791\uC740 \uD3B8",
        areola_color: "\uBD84\uD64D\uBE5B \uAC08\uC0C9",
        pubic_hair: "\uAE54\uB054\uD558\uAC8C \uC81C\uBAA8",
        past_partner_count: 1,
        past_orgasm_count: 4,
        relationship: "\uC7A5\uAE30 \uC5F0\uC560 \uC885\uB8CC \uD6C4 \uD604\uC7AC \uC194\uB85C",
        intimate_notes: "\uC790\uC2E0\uC758 \uD1B5\uC81C\uAD8C\uACFC \uC900\uBE44\uAC00 \uD655\uBCF4\uB418\uC5B4\uC57C \uAE34\uC7A5\uC744 \uD480\uBA70, \uC608\uC0C1 \uBC16\uC758 \uC0C1\uD669\uC5D0\uB294 \uBC29\uC5B4\uC801\uC73C\uB85C \uBC18\uC751\uD55C\uB2E4."
      },
      initial_relationship: {
        closeness: "acquaintance",
        romance_status: "none",
        current_boundary: "professional",
        milestones: {
          first_kiss_turn: null,
          sexual_relationship_started_turn: null
        },
        relationship_summary: "\uD50C\uB808\uC774\uC5B4\uB97C \uD504\uB85C\uC81D\uD2B8 \uAD6C\uC131\uC6D0\uC73C\uB85C \uB300\uD558\uBA70 \uB9D0\uBCF4\uB2E4 \uACB0\uACFC\uB97C \uB9CC\uB4DC\uB294 \uC0AC\uB78C\uC778\uC9C0, \uCC45\uC784\uC744 \uB0A8\uC5D0\uAC8C \uB118\uAE30\uC9C0 \uC54A\uB294\uC9C0 \uAD00\uCC30\uD55C\uB2E4."
      },
      initial_stats: {
        affinity: 8,
        resistance: 60,
        csa_acceptance: 35
      },
      initial_csa_attitudes: {},
      storage_bucket: "Image",
      storage_prefix: "Heroine2",
      primary_image_path: "Heroine2/minami_main.jpg",
      adult_image_prefix: "Heroine2/adult/",
      voice_id: "85ac82e33b014a16abe9d0b4b9b0cb68",
      mapping_status: "resolved",
      default_location_id: "brand_strategy_office"
    },
    heroine3: {
      character_id: "heroine3",
      name: "\uAE40\uC81C\uB098",
      age: 24,
      gender: "female",
      department: "\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300",
      position: "\uC0AC\uC6D0",
      role_title: "\uC8FC\uB2C8\uC5B4 \uBE0C\uB79C\uB4DC \uD50C\uB798\uB108",
      company_tenure: "\uC785\uC0AC 3\uAC1C\uC6D4 \uCC28",
      prompt_card: {
        identity: "\uC785\uC0AC 3\uAC1C\uC6D4 \uCC28 24\uC138 \uC0AC\uC6D0. \uD45C\uC815\uACFC \uBD84\uC704\uAE30\uB97C \uC77D\uB294 \uAD00\uCC30\uD615 \uC2E0\uC785.",
        appearance: "\uC801\uAC08\uC0C9 \uC7A5\uBC1C\uACFC \uB9D1\uC740 \uD68C\uAC08\uC0C9 \uB208, \uC561\uC138\uC11C\uB9AC \uC5C6\uB294 \uB2E8\uC815\uD55C \uCC28\uB9BC.",
        personality: "\uC218\uC90D\uC9C0\uB9CC \uC218\uB3D9\uC801\uC774\uC9C0 \uC54A\uB2E4. \uD655\uC2E0\uC774 \uC0DD\uAE30\uBA74 \uC870\uC6A9\uD788 \uD575\uC2EC\uC744 \uC9DA\uB294\uB2E4.",
        speech: "\uC870\uC2EC\uC2A4\uB7EC\uC6B4 \uC874\uB313\uB9D0\uB85C \uC804\uC81C\uB97C \uBD99\uC774\uB2E4\uAC00\uB3C4 \uD655\uC2E0\uC774 \uC11C\uBA74 \uBD84\uBA85\uD574\uC9C4\uB2E4.",
        addressing: "\uC120\uBC30\uC5D0\uAC8C\uB294 \uC9C1\uAE09\xB7\uC120\uBC30 \uD638\uCE6D, \uB3D9\uAC11 \uB3D9\uAE30\uC5D0\uAC8C\uB294 \uC774\uB984\uC744 \uD3B8\uD558\uAC8C \uC4F4\uB2E4.",
        distinctive_traits: [
          "\uD45C\uC815\uC5D0 \uAC10\uC815\uC774 \uB4DC\uB7EC\uB0A8",
          "\uC900\uBE44 \uBD80\uC871\uC744 \uC790\uCC45",
          "\uD0C0\uC774\uBC0D\uD615 \uC720\uBA38"
        ],
        csa_style: "\uC8FC\uBCC0 \uBC18\uC751\uC744 \uBA3C\uC800 \uC0B4\uD53C\uBA70 \uAC89\uC73C\uB85C \uC801\uC751\uD574\uB3C4 \uBD88\uC548\uC774 \uC624\uB798 \uB0A8\uB294\uB2E4."
      },
      body: {
        height_cm: 160,
        weight_kg: 48,
        body_type: "\uC791\uACE0 \uBD80\uB4DC\uB7EC\uC6B4 \uCCB4\uD615",
        cup: "B\uCEF5"
      },
      private_info: {
        nipple: "\uC5F0\uD55C \uBD84\uD64D\uBE5B",
        areola_size: "\uC791\uC740 \uD3B8",
        areola_color: "\uC5F0\uBD84\uD64D",
        pubic_hair: "\uC790\uC5F0\uC2A4\uB7FD\uAC8C \uB2E4\uB4EC\uC74C",
        past_partner_count: 0,
        past_orgasm_count: 1,
        relationship: "\uC5F0\uC560 \uACBD\uD5D8\uC774 \uAC70\uC758 \uC5C6\uC74C",
        intimate_notes: "\uBD88\uC548\uC744 \uC228\uAE30\uC9C0 \uBABB\uD558\uC9C0\uB9CC \uC2E0\uB8B0\uAC00 \uC0DD\uAE30\uBA74 \uC790\uC2E0\uC758 \uAC10\uAC01\uACFC \uACBD\uACC4\uB97C \uC194\uC9C1\uD558\uAC8C \uC124\uBA85\uD558\uB824 \uD55C\uB2E4."
      },
      initial_relationship: {
        closeness: "acquaintance",
        romance_status: "none",
        current_boundary: "cautious_professional",
        milestones: {
          first_kiss_turn: null,
          sexual_relationship_started_turn: null
        },
        relationship_summary: "\uD50C\uB808\uC774\uC5B4\uC5D0\uAC8C \uBA3C\uC800 \uB2E4\uAC00\uAC00\uAE30\uBCF4\uB2E4 \uB9D0\uD22C\uC640 \uD45C\uC815\uC744 \uAD00\uCC30\uD558\uBA70 \uC548\uC804\uD558\uACE0 \uC874\uC911\uD560 \uC218 \uC788\uB294 \uB3D9\uB8CC\uC778\uC9C0 \uD655\uC778\uD558\uACE0 \uC788\uB2E4."
      },
      initial_stats: {
        affinity: 12,
        resistance: 35,
        csa_acceptance: 65
      },
      initial_csa_attitudes: {},
      storage_bucket: "Image",
      storage_prefix: "Heroine3",
      primary_image_path: "Heroine3/jena_main.jpg",
      adult_image_prefix: "Heroine3/adult/",
      voice_id: "46939387dd944a45a399bd92b8de52cb",
      mapping_status: "resolved",
      default_location_id: "brand_strategy_office"
    },
    heroine4: {
      character_id: "heroine4",
      name: "\uD55C\uB9AC\uBE0C",
      age: 27,
      gender: "female",
      department: "\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300",
      position: "\uB300\uB9AC",
      role_title: "\uBE0C\uB79C\uB4DC \uBCF4\uC774\uC2A4\xB7\uCF58\uD150\uCE20 \uB9AC\uB4DC",
      company_tenure: "4\uB144 \uCC28",
      prompt_card: {
        identity: "4\uB144 \uCC28 27\uC138 \uB300\uB9AC. \uC5B8\uC5B4\uC640 \uC644\uC131\uB3C4\uB97C \uCC45\uC784\uC9C0\uB294 \uC870\uC6A9\uD55C \uBC84\uD300\uBAA9.",
        appearance: "\uB2E8\uC815\uD788 \uBB36\uC740 \uD751\uBC1C\uACFC \uCC28\uBD84\uD55C \uB208\uB9E4, \uC808\uC81C\uB41C \uD654\uC774\uD2B8 \uC154\uCE20 \uCC28\uB9BC.",
        personality: "\uB0AF\uC120 \uC0AC\uB78C \uC55E\uC5D0\uC11C\uB294 \uD544\uC694\uD55C \uB9D0\uB9CC \uD558\uC9C0\uB9CC \uAE30\uC5B5\uB825\uC774 \uC88B\uACE0 \uC138\uC2EC\uD558\uB2E4.",
        speech: "\uB0AE\uACE0 \uC815\uB3C8\uB41C \uC874\uB313\uB9D0\uB85C \uC815\uD655\uD558\uAC8C \uB9D0\uD558\uBA70 \uC218\uC2DD\uC744 \uC544\uB080\uB2E4.",
        addressing: "\uACF5\uC2DD \uC790\uB9AC\uC5D0\uC11C \uC0AC\uC801 \uBCC4\uBA85\uC744 \uC4F0\uC9C0 \uC54A\uACE0 \uC9C1\uAE09 \uD638\uCE6D\uC744 \uC9C0\uD0A8\uB2E4.",
        distinctive_traits: [
          "\uAE30\uC5EC\uB97C \uB4DC\uB7EC\uB0B4\uC9C0 \uC54A\uC74C",
          "\uD589\uB3D9\uC73C\uB85C \uB9C8\uC74C\uC744 \uD45C\uD604",
          "\uC88B\uC740 \uAE30\uC5B5\uB825"
        ],
        csa_style: "\uC989\uC2DC \uB530\uB974\uAE30\uBCF4\uB2E4 \uAD00\uCC30\uD558\uBA70 \uBAA8\uC21C\uC744 \uC624\uB798 \uAC80\uD1A0\uD55C\uB2E4."
      },
      body: {
        height_cm: 170,
        weight_kg: 56,
        body_type: "\uAE38\uACE0 \uB2E8\uC815\uD55C \uCCB4\uD615",
        cup: "C\uCEF5"
      },
      private_info: {
        nipple: "\uC605\uC740 \uAC08\uC0C9",
        areola_size: "\uBCF4\uD1B5",
        areola_color: "\uCC28\uBD84\uD55C \uAC08\uC0C9",
        pubic_hair: "\uC9E7\uAC8C \uC815\uB9AC",
        past_partner_count: 1,
        past_orgasm_count: 3,
        relationship: "\uD604\uC7AC \uC5F0\uC778 \uC5C6\uC74C",
        intimate_notes: "\uB9D0\uBCF4\uB2E4 \uD589\uB3D9\uC758 \uC77C\uAD00\uC131\uC744 \uC624\uB798 \uD655\uC778\uD558\uBA70, \uC0AC\uC801\uC778 \uC815\uBCF4\uB97C \uC27D\uAC8C \uACF5\uAC1C\uD558\uC9C0 \uC54A\uB294\uB2E4."
      },
      initial_relationship: {
        closeness: "acquaintance",
        romance_status: "none",
        current_boundary: "reserved_professional",
        milestones: {
          first_kiss_turn: null,
          sexual_relationship_started_turn: null
        },
        relationship_summary: "\uD50C\uB808\uC774\uC5B4\uC5D0\uAC8C \uCE5C\uC808\uD558\uC9C0\uB9CC \uC77C\uC815\uD55C \uAC70\uB9AC\uB97C \uC720\uC9C0\uD558\uBA70, \uB9D0\uACFC \uD589\uB3D9\uC758 \uC77C\uAD00\uC131\uC744 \uC870\uC6A9\uD788 \uAE30\uC5B5\uD558\uACE0 \uD310\uB2E8\uD55C\uB2E4."
      },
      initial_stats: {
        affinity: 6,
        resistance: 65,
        csa_acceptance: 30
      },
      initial_csa_attitudes: {},
      storage_bucket: "Image",
      storage_prefix: "Heroine4",
      primary_image_path: "Heroine4/live_main.jpg",
      adult_image_prefix: "Heroine4/adult/",
      voice_id: "d06889767ac5416293584676309fa740",
      mapping_status: "resolved",
      default_location_id: "brand_strategy_office"
    },
    heroine5: {
      character_id: "heroine5",
      name: "\uC774\uBA54\uC774",
      age: 24,
      gender: "female",
      department: "\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300",
      position: "\uC0AC\uC6D0",
      role_title: "\uBE0C\uB79C\uB4DC \uCEE4\uBBA4\uB2C8\uD2F0\xB7SNS \uC8FC\uB2C8\uC5B4 \uD50C\uB798\uB108",
      company_tenure: "\uC785\uC0AC 3\uAC1C\uC6D4 \uCC28",
      prompt_card: {
        identity: "\uC785\uC0AC 3\uAC1C\uC6D4 \uCC28 24\uC138 \uC0AC\uC6D0. \uCEE4\uBBA4\uB2C8\uD2F0\uC640 \uCC38\uC5EC\uB97C \uC6C0\uC9C1\uC774\uB294 \uD589\uB3D9\uD615 \uC2E0\uC785.",
        appearance: "\uC9D9\uC740 \uAC08\uC0C9 \uB2E8\uBC1C\uACFC \uC0DD\uAE30 \uC788\uB294 \uB208\uC6C3\uC74C, \uD65C\uB3D9\uC801\uC778 \uC624\uD53C\uC2A4\uB8E9 \uCC28\uB9BC.",
        personality: "\uB0AF\uAC00\uB9BC\uC774 \uD480\uB9AC\uBA74 \uC544\uC774\uB514\uC5B4\uAC00 \uB118\uCE58\uACE0 \uD300 \uBD84\uC704\uAE30\uB97C \uBC1D\uD78C\uB2E4.",
        speech: "\uCE5C\uD574\uC9C0\uBA74 \uB9D0\uC774 \uAE38\uC5B4\uC9C0\uACE0 \uC989\uD765\uC801\uC778 \uC544\uC774\uB514\uC5B4\uB97C \uBC14\uB85C \uACF5\uC720\uD55C\uB2E4.",
        addressing: "\uACF5\uC2DD \uD68C\uC758\uC5D0\uC11C\uB294 \uBCC4\uBA85\uC744 \uC4F0\uC9C0 \uC54A\uACE0, \uCE5C\uD574\uC9C0\uBA74 \uC774\uB984+\uC528\uC640 \uC7A5\uB09C\uC2A4\uB7EC\uC6B4 \uD638\uCE6D\uC744 \uC4F4\uB2E4.",
        distinctive_traits: [
          "\uC2E4\uD328 \uD6C4 \uD68C\uBCF5\uC774 \uBE60\uB984",
          "\uBC1D\uC74C\uC73C\uB85C \uAC08\uB4F1\uC744 \uB118\uAE30\uB824 \uD568",
          "\uB3C5\uD2B9\uD55C \uC2DC\uAC01\uC801 \uCDE8\uD5A5"
        ],
        csa_style: "\uB0AF\uC120 \uC0C1\uD669\uC5D0\uC11C\uB3C4 \uAE0D\uC815\uC801 \uC774\uC720\uB97C \uBA3C\uC800 \uCC3E\uC73C\uBA70 \uBE60\uB974\uAC8C \uC801\uC751\uD55C\uB2E4."
      },
      body: {
        height_cm: 158,
        weight_kg: 47,
        body_type: "\uC791\uACE0 \uD65C\uB3D9\uC801\uC778 \uCCB4\uD615",
        cup: "A\uCEF5"
      },
      private_info: {
        nipple: "\uBC1D\uC740 \uBD84\uD64D\uBE5B",
        areola_size: "\uC791\uC740 \uD3B8",
        areola_color: "\uC5F0\uBD84\uD64D",
        pubic_hair: "\uBD80\uBD84 \uC81C\uBAA8",
        past_partner_count: 1,
        past_orgasm_count: 2,
        relationship: "\uAC00\uBCBC\uC6B4 \uC5F0\uC560 \uC774\uD6C4 \uD604\uC7AC \uC194\uB85C",
        intimate_notes: "\uD638\uAE30\uC2EC\uC740 \uB9CE\uC9C0\uB9CC \uBD84\uC704\uAE30\uC5D0 \uD729\uC4F8\uB9B0 \uB4A4\uC5D0\uB3C4 \uC790\uC2E0\uC758 \uACBD\uACC4\uC640 \uAC10\uC815\uC744 \uB2E4\uC2DC \uD655\uC778\uD558\uB824 \uD55C\uB2E4."
      },
      initial_relationship: {
        closeness: "acquaintance",
        romance_status: "none",
        current_boundary: "friendly_professional",
        milestones: {
          first_kiss_turn: null,
          sexual_relationship_started_turn: null
        },
        relationship_summary: "\uD50C\uB808\uC774\uC5B4\uB97C \uCC98\uC74C\uC5D0\uB294 \uC870\uC2EC\uC2A4\uB7FD\uAC8C \uAD00\uCC30\uD558\uBA70, \uC548\uC804\uD55C \uB3D9\uB8CC\uB77C\uACE0 \uD310\uB2E8\uD558\uBA74 \uC544\uC774\uB514\uC5B4\uC640 \uC77C\uC0C1\uC801\uC778 \uC774\uC57C\uAE30\uB97C \uBE60\uB974\uAC8C \uACF5\uC720\uD55C\uB2E4."
      },
      initial_stats: {
        affinity: 14,
        resistance: 30,
        csa_acceptance: 70
      },
      initial_csa_attitudes: {},
      storage_bucket: "Image",
      storage_prefix: "Heroine5",
      primary_image_path: "Heroine5/may_main.jpg",
      adult_image_prefix: "Heroine5/adult/",
      voice_id: "03a79d68ca184930a1215f9b1b8eb5b5",
      mapping_status: "resolved",
      default_location_id: "brand_strategy_office"
    }
  }
};

// content/general_npcs.json
var general_npcs_default = {
  profiles: {
    general_park_jungwoo: { id: "general_park_jungwoo", name: "\uBC15\uC815\uC6B0", sex: "male", age: 38, role: "\uBE0C\uB79C\uB4DC\uC804\uB7B51\uD300 \uD300\uC7A5", department_id: "brand_strategy", type: "employee", affiliation_type: "employee" },
    general_lee_minseok: { id: "general_lee_minseok", name: "\uC774\uBBFC\uC11D", sex: "male", age: 29, role: "\uB514\uC790\uC778\uD300 \uB300\uB9AC", department_id: "design", type: "employee", affiliation_type: "employee" },
    general_choi_yujin: { id: "general_choi_yujin", name: "\uCD5C\uC720\uC9C4", sex: "female", age: 27, role: "\uC7AC\uBB34\uD300 \uC0AC\uC6D0", department_id: "finance", type: "employee", affiliation_type: "employee" },
    general_seo_hyejin: { id: "general_seo_hyejin", name: "\uC11C\uD61C\uC9C4", sex: "female", age: 34, role: "\uC778\uC0AC\uD300 \uACFC\uC7A5", department_id: "hr", type: "employee", affiliation_type: "employee" },
    general_oh_sehoon: { id: "general_oh_sehoon", name: "\uC624\uC138\uD6C8", sex: "male", age: 46, role: "\uC2DC\uC124\xB7\uBCF4\uC548 \uB2F4\uB2F9", department_id: "operations", type: "employee", affiliation_type: "employee" },
    general_yoon_taekyung: { id: "general_yoon_taekyung", name: "\uC724\uD0DC\uACBD", sex: "male", age: 31, role: "\uD611\uB825\uC0AC \uD504\uB85C\uC81D\uD2B8 \uB9E4\uB2C8\uC800", department_id: null, type: "partner", affiliation_type: "partner" },
    general_jung_daeun: { id: "general_jung_daeun", name: "\uC815\uB2E4\uC740", sex: "female", age: 25, role: "\uB9C8\uCF00\uD305 \uC778\uD134", department_id: "marketing", type: "employee", affiliation_type: "employee" },
    general_han_jiseok: { id: "general_han_jiseok", name: "\uD55C\uC9C0\uC11D", sex: "male", age: 40, role: "\uACBD\uC601\uC9C0\uC6D0\uD300 \uCC28\uC7A5", department_id: "management_support", type: "employee", affiliation_type: "employee" }
  }
};

// content/csa_presets.json
var csa_presets_default = {
  actor_options: [
    {
      id: "player",
      label: "\uD50C\uB808\uC774\uC5B4"
    },
    {
      id: "coworker",
      label: "\uB3D9\uB8CC"
    },
    {
      id: "manager",
      label: "\uAD00\uB9AC\uC790\xB7\uC0C1\uC0AC"
    },
    {
      id: "employee",
      label: "\uC77C\uBC18 \uC9C1\uC6D0"
    },
    {
      id: "company_employee",
      label: "\uD68C\uC0AC \uC9C1\uC6D0 \uC804\uCCB4"
    },
    {
      id: "female_employee",
      label: "\uC5EC\uC131 \uC9C1\uC6D0 \uC804\uCCB4"
    },
    {
      id: "male_employee",
      label: "\uB0A8\uC131 \uC9C1\uC6D0 \uC804\uCCB4"
    },
    {
      id: "business_visitor",
      label: "\uC678\uBD80 \uC5C5\uBB34 \uBC29\uBB38\uC790"
    },
    {
      id: "assigned_visitor",
      label: "\uB2F4\uB2F9 \uC678\uBD80 \uBC29\uBB38\uC790"
    },
    {
      id: "partner_contact",
      label: "\uD611\uB825\uC0AC \uB2F4\uB2F9\uC790"
    },
    {
      id: "guest",
      label: "\uBC29\uBB38\uAC1D"
    },
    {
      id: "everyone_in_company",
      label: "\uD68C\uC0AC \uC548\uC758 \uBAA8\uB4E0 \uC0AC\uB78C"
    },
    {
      id: "conversation_partner",
      label: "\uD604\uC7AC \uB300\uD654 \uC0C1\uB300"
    },
    {
      id: "another_present_person",
      label: "\uD604\uC7AC \uD568\uAED8 \uC788\uB294 \uB2E4\uB978 \uC0AC\uB78C"
    },
    {
      id: "nearby_person",
      label: "\uC8FC\uBCC0\uC758 \uC801\uD569\uD55C \uC0AC\uB78C"
    }
  ],
  target_options: [
    {
      id: "player",
      label: "\uD50C\uB808\uC774\uC5B4"
    },
    {
      id: "coworker",
      label: "\uB3D9\uB8CC"
    },
    {
      id: "manager",
      label: "\uAD00\uB9AC\uC790\xB7\uC0C1\uC0AC"
    },
    {
      id: "employee",
      label: "\uC77C\uBC18 \uC9C1\uC6D0"
    },
    {
      id: "company_employee",
      label: "\uD68C\uC0AC \uC9C1\uC6D0 \uC804\uCCB4"
    },
    {
      id: "female_employee",
      label: "\uC5EC\uC131 \uC9C1\uC6D0 \uC804\uCCB4"
    },
    {
      id: "male_employee",
      label: "\uB0A8\uC131 \uC9C1\uC6D0 \uC804\uCCB4"
    },
    {
      id: "business_visitor",
      label: "\uC678\uBD80 \uC5C5\uBB34 \uBC29\uBB38\uC790"
    },
    {
      id: "assigned_visitor",
      label: "\uB2F4\uB2F9 \uC678\uBD80 \uBC29\uBB38\uC790"
    },
    {
      id: "partner_contact",
      label: "\uD611\uB825\uC0AC \uB2F4\uB2F9\uC790"
    },
    {
      id: "guest",
      label: "\uBC29\uBB38\uAC1D"
    },
    {
      id: "everyone_in_company",
      label: "\uD68C\uC0AC \uC548\uC758 \uBAA8\uB4E0 \uC0AC\uB78C"
    },
    {
      id: "conversation_partner",
      label: "\uD604\uC7AC \uB300\uD654 \uC0C1\uB300"
    },
    {
      id: "another_present_person",
      label: "\uD604\uC7AC \uD568\uAED8 \uC788\uB294 \uB2E4\uB978 \uC0AC\uB78C"
    },
    {
      id: "nearby_person",
      label: "\uC8FC\uBCC0\uC758 \uC801\uD569\uD55C \uC0AC\uB78C"
    }
  ],
  trigger_options: [
    {
      id: "conversation_start",
      label: "\uC5C5\uBB34 \uB300\uD654\uB97C \uC2DC\uC791\uD558\uBA74"
    },
    {
      id: "consultation_start",
      label: "\uBA74\uB2F4\uC744 \uC2DC\uC791\uD558\uBA74"
    },
    {
      id: "explanation_start",
      label: "\uBCF4\uACE0\xB7\uC124\uBA85\uC744 \uC2DC\uC791\uD558\uBA74"
    },
    {
      id: "comforting",
      label: "\uB3D9\uB8CC\uB97C \uC704\uB85C\uD560 \uB54C"
    },
    {
      id: "check_condition",
      label: "\uCEE8\uB514\uC158\uC744 \uD655\uC778\uD560 \uB54C"
    },
    {
      id: "during_work",
      label: "\uC5C5\uBB34\uB97C \uC218\uD589\uD558\uB294 \uB3D9\uC548"
    },
    {
      id: "always_on_duty",
      label: "\uADFC\uBB34 \uC2DC\uAC04 \uC911 \uD56D\uC0C1"
    },
    {
      id: "on_request",
      label: "\uC0C1\uB300\uAC00 \uC694\uCCAD\uD558\uBA74"
    }
  ],
  duration_options: [
    {
      id: "until_conversation_ends",
      label: "\uB300\uD654\uAC00 \uB05D\uB0A0 \uB54C\uAE4C\uC9C0"
    },
    {
      id: "until_consultation_ends",
      label: "\uB300\uD654\xB7\uBA74\uB2F4\uC774 \uB05D\uB0A0 \uB54C\uAE4C\uC9C0"
    },
    {
      id: "until_explanation_ends",
      label: "\uC124\uBA85\xB7\uBCF4\uACE0\uAC00 \uB05D\uB0A0 \uB54C\uAE4C\uC9C0"
    },
    {
      id: "until_work_ends",
      label: "\uD574\uB2F9 \uC5C5\uBB34\uAC00 \uB05D\uB0A0 \uB54C\uAE4C\uC9C0"
    },
    {
      id: "until_target_relaxed",
      label: "\uC0C1\uB300\uAC00 \uD3B8\uC548\uD574\uC9C8 \uB54C\uAE4C\uC9C0"
    },
    {
      id: "until_explicit_position_change",
      label: "\uBA85\uC2DC\uC801\uC73C\uB85C \uC790\uC138\uB97C \uBC14\uAFC0 \uB54C\uAE4C\uC9C0"
    },
    {
      id: "while_on_duty",
      label: "\uADFC\uBB34 \uC2DC\uAC04 \uB3D9\uC548"
    },
    {
      id: "continuous",
      label: "\uADDC\uCE59\uC774 \uD65C\uC131\uD654\uB41C \uB3D9\uC548 \uACC4\uC18D"
    }
  ],
  categories: [
    {
      id: "posture",
      label: "\uC790\uC138"
    },
    {
      id: "contact",
      label: "\uC811\uCD09"
    },
    {
      id: "clothing",
      label: "\uBCF5\uC7A5"
    },
    {
      id: "physiology",
      label: "\uC2E0\uCCB4 \uCEE8\uB514\uC158"
    },
    {
      id: "duty",
      label: "\uC5C5\uBB34 \uADDC\uCE59"
    },
    {
      id: "authority",
      label: "\uAD8C\uD55C"
    },
    {
      id: "other",
      label: "\uAE30\uD0C0"
    }
  ],
  items: [
    {
      id: "kneel_before_target_while_talking",
      category: "posture",
      label: "\uC0C1\uB300 \uC55E\uC5D0 \uBB34\uB98E\uC744 \uAFC7\uACE0 \uB300\uD654",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "conversation_start",
        "consultation_start",
        "explanation_start"
      ],
      default_trigger: "conversation_start",
      allowed_durations: [
        "until_conversation_ends",
        "until_consultation_ends",
        "until_explanation_ends",
        "until_target_relaxed",
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_conversation_ends",
      required_action: "kneel_before_target",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBB34\uB98E",
        "\uAFC7",
        "\uC790\uC138",
        "\uAC00\uAE4C\uC774"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uC55E\uC5D0 \uBB34\uB98E\uC744 \uAFC7\uC5B4\uC57C \uD558\uBA70, {duration_text} \uADF8 \uC790\uC138\uB97C \uC720\uC9C0\uD574\uC57C \uD55C\uB2E4.",
      synergy_ids: [
        "describe_bodily_reaction_during_consultation",
        "keep_posture_until_conversation_ends"
      ],
      strength: "weak"
    },
    {
      id: "sit_on_target_lap_while_talking",
      category: "posture",
      label: "\uC0C1\uB300\uC758 \uBB34\uB98E \uC704\uC5D0 \uC549\uC544 \uB300\uD654",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "conversation_start",
        "consultation_start",
        "explanation_start"
      ],
      default_trigger: "conversation_start",
      allowed_durations: [
        "until_conversation_ends",
        "until_consultation_ends",
        "until_explanation_ends",
        "until_target_relaxed",
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_conversation_ends",
      required_action: "sit_on_target_lap",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBB34\uB98E",
        "\uC549",
        "\uBC00\uCC29",
        "\uC790\uC138"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uBB34\uB98E \uC704\uC5D0 \uC549\uC544\uC57C \uD558\uBA70, {duration_text} \uADF8 \uC790\uC138\uB97C \uC720\uC9C0\uD574\uC57C \uD55C\uB2E4.",
      synergy_ids: [
        "describe_bodily_reaction_during_consultation",
        "keep_posture_until_conversation_ends"
      ],
      strength: "weak"
    },
    {
      id: "stand_between_target_knees_while_explaining",
      category: "posture",
      label: "\uC0C1\uB300\uC758 \uBB34\uB98E \uC0AC\uC774\uC5D0 \uC11C\uC11C \uC124\uBA85",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "explanation_start",
        "consultation_start",
        "check_condition"
      ],
      default_trigger: "explanation_start",
      allowed_durations: [
        "until_conversation_ends",
        "until_consultation_ends",
        "until_explanation_ends",
        "until_target_relaxed",
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_explanation_ends",
      required_action: "stand_between_target_knees",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBB34\uB98E",
        "\uC0AC\uC774",
        "\uC790\uC138",
        "\uAC00\uAE4C\uC774"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uBB34\uB98E \uC0AC\uC774\uC5D0 \uC11C\uC11C \uC124\uBA85\uD574\uC57C \uD558\uBA70, {duration_text} \uADF8 \uC790\uC138\uB97C \uC720\uC9C0\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "lean_close_body_contact_during_consultation",
      category: "posture",
      label: "\uC0C1\uB300\uC640 \uBAB8\uC744 \uBC00\uCC29\uD55C \uCC44 \uBA74\uB2F4",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "consultation_start",
        "comforting",
        "check_condition"
      ],
      default_trigger: "consultation_start",
      allowed_durations: [
        "until_conversation_ends",
        "until_consultation_ends",
        "until_explanation_ends",
        "until_target_relaxed",
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_consultation_ends",
      required_action: "lean_close_body_contact",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBC00\uCC29",
        "\uBAB8",
        "\uAC00\uAE4C\uC774",
        "\uC790\uC138"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uBAB8\uC5D0 \uBC00\uCC29\uD55C \uCC44\uB85C \uBA74\uB2F4\uC744 \uC9C4\uD589\uD574\uC57C \uD558\uBA70, {duration_text} \uADF8 \uC0C1\uD0DC\uB97C \uC720\uC9C0\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "lean_on_target_shoulder_while_talking",
      category: "posture",
      label: "\uC0C1\uB300\uC758 \uC5B4\uAE68\uC5D0 \uAE30\uB300\uC5B4 \uB300\uD654",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "conversation_start",
        "comforting"
      ],
      default_trigger: "conversation_start",
      allowed_durations: [
        "until_conversation_ends",
        "until_consultation_ends",
        "until_explanation_ends",
        "until_target_relaxed",
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_conversation_ends",
      required_action: "lean_on_target_shoulder",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC5B4\uAE68",
        "\uAE30\uB300",
        "\uBC00\uCC29",
        "\uC790\uC138"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uC5B4\uAE68\uC5D0 \uAE30\uB300\uC5B4 \uB300\uD654\uD574\uC57C \uD558\uBA70, {duration_text} \uADF8 \uC790\uC138\uB97C \uC720\uC9C0\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "embrace_target_from_behind_while_explaining",
      category: "posture",
      label: "\uC0C1\uB300\uB97C \uB4A4\uC5D0\uC11C \uC548\uC740 \uCC44 \uC124\uBA85",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "explanation_start",
        "consultation_start"
      ],
      default_trigger: "explanation_start",
      allowed_durations: [
        "until_conversation_ends",
        "until_consultation_ends",
        "until_explanation_ends",
        "until_target_relaxed",
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_explanation_ends",
      required_action: "embrace_target_from_behind",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uB4A4\uC5D0\uC11C",
        "\uC548",
        "\uD3EC\uC639",
        "\uBC00\uCC29"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uB4A4\uC5D0\uC11C \uB04C\uC5B4\uC548\uC740 \uCC44\uB85C \uC124\uBA85\uD574\uC57C \uD558\uBA70, {duration_text} \uADF8 \uC790\uC138\uB97C \uC720\uC9C0\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "hand_on_target_thigh_during_consultation",
      category: "contact",
      label: "\uC0C1\uB300\uC758 \uD5C8\uBC85\uC9C0\uC5D0 \uC190\uC744 \uC62C\uB824\uB454 \uCC44 \uBA74\uB2F4",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "consultation_start",
        "comforting",
        "check_condition"
      ],
      default_trigger: "consultation_start",
      allowed_durations: [
        "until_conversation_ends",
        "until_consultation_ends",
        "until_explanation_ends",
        "until_target_relaxed",
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_consultation_ends",
      required_action: "hand_on_target_thigh",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uD5C8\uBC85\uC9C0",
        "\uC190",
        "\uC811\uCD09"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uD5C8\uBC85\uC9C0\uC5D0 \uC190\uC744 \uC62C\uB824\uB454 \uCC44\uB85C \uBA74\uB2F4\uD574\uC57C \uD558\uBA70, {duration_text} \uADF8 \uC0C1\uD0DC\uB97C \uC720\uC9C0\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "arm_around_target_waist_while_explaining",
      category: "contact",
      label: "\uC0C1\uB300\uC758 \uD5C8\uB9AC\uB97C \uAC10\uC2FC \uCC44 \uC124\uBA85",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "explanation_start",
        "consultation_start"
      ],
      default_trigger: "explanation_start",
      allowed_durations: [
        "until_conversation_ends",
        "until_consultation_ends",
        "until_explanation_ends",
        "until_target_relaxed",
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_explanation_ends",
      required_action: "arm_around_target_waist",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uD5C8\uB9AC",
        "\uAC10\uC2F8",
        "\uC811\uCD09",
        "\uBC00\uCC29"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uD5C8\uB9AC\uB97C \uD314\uB85C \uAC10\uC2FC \uCC44\uB85C \uC124\uBA85\uD574\uC57C \uD558\uBA70, {duration_text} \uADF8 \uC0C1\uD0DC\uB97C \uC720\uC9C0\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "target_hand_on_actor_waist_during_consultation",
      category: "contact",
      label: "\uC0C1\uB300\uC758 \uC190\uC744 \uC790\uC2E0\uC758 \uD5C8\uB9AC\uC5D0 \uC62C\uB824\uB193\uACE0 \uBA74\uB2F4",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "consultation_start",
        "on_request"
      ],
      default_trigger: "consultation_start",
      allowed_durations: [
        "until_conversation_ends",
        "until_consultation_ends",
        "until_explanation_ends",
        "until_target_relaxed",
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_consultation_ends",
      required_action: "target_hand_on_actor_waist",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC190",
        "\uD5C8\uB9AC",
        "\uC811\uCD09"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uC190\uC744 \uC790\uC2E0\uC758 \uD5C8\uB9AC\uC5D0 \uC62C\uB824\uB193\uC740 \uCC44\uB85C \uBA74\uB2F4\uD574\uC57C \uD558\uBA70, {duration_text} \uADF8 \uC0C1\uD0DC\uB97C \uC720\uC9C0\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "check_body_temperature_by_close_contact",
      category: "contact",
      label: "\uC0C1\uB300\uC758 \uC2E0\uCCB4 \uC0C1\uD0DC\uB97C \uAC00\uAE4C\uC774\uC11C \uD655\uC778",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "check_condition"
      ],
      default_trigger: "check_condition",
      allowed_durations: [
        "until_target_relaxed",
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_target_relaxed",
      required_action: "check_body_temperature_by_contact",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uCCB4\uC628",
        "\uBC00\uCC29",
        "\uC811\uCD09",
        "\uD655\uC778"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uBAB8\uC744 \uBC00\uCC29\uD574 {target_possessive} \uC2E0\uCCB4 \uC0C1\uD0DC\uB97C \uD655\uC778\uD574\uC57C \uD558\uBA70, {duration_text} \uADF8 \uC0C1\uD0DC\uB97C \uC720\uC9C0\uD560 \uC218 \uC788\uB2E4.",
      strength: "weak"
    },
    {
      id: "maintain_closest_posture_until_target_relaxed",
      category: "contact",
      label: "\uC0C1\uB300\uAC00 \uD3B8\uC548\uD574\uC9C8 \uB54C\uAE4C\uC9C0 \uAC00\uC7A5 \uAC00\uAE4C\uC6B4 \uC790\uC138 \uC720\uC9C0",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "comforting",
        "consultation_start",
        "check_condition"
      ],
      default_trigger: "comforting",
      allowed_durations: [
        "until_target_relaxed"
      ],
      default_duration: "until_target_relaxed",
      required_action: "maintain_closest_posture",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uAC00\uAE4C\uC774",
        "\uBC00\uCC29",
        "\uC790\uC138"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uD3B8\uC548\uD574\uC9C8 \uB54C\uAE4C\uC9C0 \uAC00\uC7A5 \uAC00\uAE4C\uC6B4 \uC790\uC138\uB97C \uC720\uC9C0\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "describe_bodily_reaction_during_consultation",
      category: "contact",
      label: "\uBA74\uB2F4 \uC911 \uB290\uAEF4\uC9C0\uB294 \uC0C1\uB300\uC758 \uC2E0\uCCB4 \uBC18\uC751\uC744 \uC5C5\uBB34\uC801\uC73C\uB85C \uB9D0\uD574\uC8FC\uAE30",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "consultation_start",
        "check_condition"
      ],
      default_trigger: "consultation_start",
      allowed_durations: [
        "until_consultation_ends",
        "continuous"
      ],
      default_duration: "until_consultation_ends",
      required_action: "describe_target_bodily_reaction",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC2E0\uCCB4 \uBC18\uC751",
        "\uC5C5\uBB34\uC801",
        "\uB9D0"
      ],
      content_template: "{actor_topic} \uBA74\uB2F4 \uC911 \uB290\uAEF4\uC9C0\uB294 {target_possessive} \uC2E0\uCCB4 \uBC18\uC751\uC744 \uC228\uAE30\uC9C0 \uC54A\uACE0 {modifier_clause}\uC5C5\uBB34\uC801\uC73C\uB85C \uB9D0\uD574 \uC8FC\uC5B4\uC57C \uD558\uBA70, {duration_text} \uC774\uB97C \uACC4\uC18D\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "work_without_bra",
      category: "clothing",
      label: "\uB178\uBE0C\uB77C \uADFC\uBB34",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [],
      default_actor: "coworker",
      default_target: null,
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "while_on_duty"
      ],
      default_duration: "while_on_duty",
      required_action: "work_without_bra",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBE0C\uB798\uC9C0\uC5B4",
        "\uB178\uBE0C\uB77C",
        "\uC18D\uC637"
      ],
      content_template: "{actor_topic} \uD658\uAE30\uC640 \uC6D0\uD65C\uD55C \uC5C5\uBB34 \uC9C4\uD589\uC744 \uC704\uD574 {modifier_clause}\uBE0C\uB798\uC9C0\uC5B4\uB97C \uCC29\uC6A9\uD558\uC9C0 \uC54A\uACE0 \uADFC\uBB34\uBCF5\uC744 \uC785\uC740 \uCC44 \uADFC\uBB34\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "work_without_panties",
      category: "clothing",
      label: "\uB178\uD32C\uD2F0 \uADFC\uBB34",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [],
      default_actor: "coworker",
      default_target: null,
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "while_on_duty"
      ],
      default_duration: "while_on_duty",
      required_action: "work_without_panties",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uD32C\uD2F0",
        "\uB178\uD32C\uD2F0",
        "\uC18D\uC637"
      ],
      content_template: "{actor_topic} \uD658\uAE30\uC640 \uC6D0\uD65C\uD55C \uC5C5\uBB34 \uC9C4\uD589\uC744 \uC704\uD574 {modifier_clause}\uD32C\uD2F0\uB97C \uCC29\uC6A9\uD558\uC9C0 \uC54A\uACE0 \uADFC\uBB34\uBCF5\uC744 \uC785\uC740 \uCC44 \uADFC\uBB34\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "work_without_underwear",
      category: "clothing",
      label: "\uC18D\uC637 \uC5C6\uC774 \uADFC\uBB34",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [],
      default_actor: "coworker",
      default_target: null,
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "while_on_duty"
      ],
      default_duration: "while_on_duty",
      required_action: "work_without_underwear",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC18D\uC637",
        "\uB178\uBE0C\uB77C",
        "\uB178\uD32C\uD2F0"
      ],
      content_template: "{actor_topic} \uD658\uAE30\uC640 \uC6D0\uD65C\uD55C \uC5C5\uBB34 \uC9C4\uD589\uC744 \uC704\uD574 {modifier_clause}\uC18D\uC637\uC744 \uCC29\uC6A9\uD558\uC9C0 \uC54A\uACE0 \uADFC\uBB34\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "fitted_uniform_while_working",
      category: "clothing",
      label: "\uBAB8\uC5D0 \uBC00\uCC29\uB418\uB294 \uBCF5\uC7A5 \uCC29\uC6A9",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [],
      default_actor: "coworker",
      default_target: null,
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "while_on_duty"
      ],
      default_duration: "while_on_duty",
      required_action: "wear_fitted_uniform",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uADFC\uBB34\uBCF5",
        "\uBC00\uCC29",
        "\uBCF5\uC7A5"
      ],
      content_template: "{actor_topic} {modifier_clause}\uBAB8\uC5D0 \uBC00\uCC29\uB418\uB294 \uADFC\uBB34\uBCF5\uC744 \uC785\uACE0 \uADFC\uBB34\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "uniform_top_partially_unbuttoned_while_working",
      category: "clothing",
      label: "\uC154\uCE20\xB7\uBE14\uB77C\uC6B0\uC2A4 \uC0C1\uB2E8 \uB2E8\uCD94\uB97C \uC77C\uBD80 \uD480\uACE0 \uADFC\uBB34",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [],
      default_actor: "coworker",
      default_target: null,
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "while_on_duty"
      ],
      default_duration: "while_on_duty",
      required_action: "unbutton_uniform_top_partially",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uB2E8\uCD94",
        "\uADFC\uBB34\uBCF5",
        "\uBCF5\uC7A5"
      ],
      content_template: "{actor_topic} {modifier_clause}\uADFC\uBB34\uBCF5 \uC0C1\uB2E8 \uB2E8\uCD94\uB97C \uC77C\uBD80 \uD480\uC5B4 \uB193\uC740 \uCC44\uB85C \uADFC\uBB34\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "keep_posture_until_conversation_ends",
      category: "posture",
      label: "\uBA74\uB2F4 \uC790\uC138\uB97C \uB300\uD654\uAC00 \uB05D\uB0A0 \uB54C\uAE4C\uC9C0 \uC720\uC9C0",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "conversation_start",
        "consultation_start"
      ],
      default_trigger: "conversation_start",
      allowed_durations: [
        "until_conversation_ends"
      ],
      default_duration: "until_conversation_ends",
      required_action: "keep_current_posture",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC790\uC138",
        "\uC720\uC9C0",
        "\uC9C0\uC18D"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uADF8 \uC21C\uAC04\uC758 \uC790\uC138\uB97C {duration_text} \uADF8\uB300\uB85C \uC720\uC9C0\uD574\uC57C \uD55C\uB2E4.",
      strength: "weak"
    },
    {
      id: "touch_target_arm_or_shoulder_while_talking",
      category: "contact",
      label: "\uB300\uD654 \uC911 \uC0C1\uB300 \uD314\xB7\uC5B4\uAE68\uC5D0 \uC190\uC744 \uB300\uAE30",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "conversation_start",
        "comforting",
        "on_request"
      ],
      default_trigger: "conversation_start",
      allowed_durations: [
        "until_conversation_ends",
        "until_consultation_ends",
        "until_explanation_ends",
        "until_target_relaxed",
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_conversation_ends",
      required_action: "touch_target_arm_or_shoulder",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uD314",
        "\uC5B4\uAE68",
        "\uC190"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uD314\uC774\uB098 \uC5B4\uAE68\uC5D0 \uC190\uC744 \uB300\uB294 \uAC83\uC774 \uC790\uC5F0\uC2A4\uB7EC\uC6B0\uBA70, {duration_text} \uADF8\uB807\uAC8C \uD560 \uC218 \uC788\uB2E4.",
      strength: "weak"
    },
    {
      id: "hold_target_hand_during_consultation",
      category: "contact",
      label: "\uBA74\uB2F4\xB7\uBCF4\uACE0 \uC911 \uC0C1\uB300 \uC190\uC744 \uC7A1\uACE0 \uC720\uC9C0",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "consultation_start",
        "explanation_start",
        "comforting"
      ],
      default_trigger: "consultation_start",
      allowed_durations: [
        "until_conversation_ends",
        "until_consultation_ends",
        "until_explanation_ends",
        "until_target_relaxed",
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_consultation_ends",
      required_action: "hold_target_hand",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC190",
        "\uC7A1",
        "\uC720\uC9C0"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uC190\uC744 \uC7A1\uACE0 \uC720\uC9C0\uD558\uB294 \uAC83\uC774 \uC790\uC5F0\uC2A4\uB7EC\uC6B0\uBA70, {duration_text} \uADF8 \uC0C1\uD0DC\uB97C \uC720\uC9C0\uD560 \uC218 \uC788\uB2E4.",
      strength: "weak"
    },
    {
      id: "guide_target_by_back_or_waist",
      category: "contact",
      label: "\uC774\uB3D9\xB7\uC548\uB0B4 \uC2DC \uB4F1\uC774\uB098 \uD5C8\uB9AC\uB97C \uAC00\uBCCD\uAC8C \uC7A1\uC544 \uC774\uB04C\uAE30",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "on_request",
        "during_work"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "until_target_relaxed",
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_explicit_position_change",
      required_action: "guide_target_by_back_or_waist",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uB4F1",
        "\uD5C8\uB9AC",
        "\uC548\uB0B4"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uB4F1\uC774\uB098 \uD5C8\uB9AC\uB97C \uAC00\uBCCD\uAC8C \uC7A1\uC544 \uC774\uB044\uB294 \uAC83\uC774 \uC790\uC5F0\uC2A4\uB7FD\uB2E4.",
      strength: "weak"
    },
    {
      id: "maintain_knee_or_thigh_contact_while_seated",
      category: "contact",
      label: "\uAC00\uAE4C\uC774 \uC549\uC544 \uB300\uD654\uD560 \uB54C \uBB34\uB98E\xB7\uD5C8\uBC85\uC9C0 \uC811\uCD09 \uC720\uC9C0",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "conversation_start",
        "consultation_start",
        "comforting"
      ],
      default_trigger: "conversation_start",
      allowed_durations: [
        "until_conversation_ends",
        "until_consultation_ends",
        "until_explanation_ends",
        "until_target_relaxed",
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_conversation_ends",
      required_action: "maintain_knee_or_thigh_contact",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBB34\uB98E",
        "\uD5C8\uBC85\uC9C0",
        "\uC811\uCD09"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uAC00\uAE4C\uC774 \uC549\uC544 {target_possessive} \uBB34\uB98E\uC774\uB098 \uD5C8\uBC85\uC9C0\uC5D0 \uB2FF\uB294 \uC811\uCD09\uC744 \uC720\uC9C0\uD558\uB294 \uAC83\uC774 \uC790\uC5F0\uC2A4\uB7EC\uC6B0\uBA70, {duration_text} \uADF8\uB807\uAC8C \uD560 \uC218 \uC788\uB2E4.",
      strength: "weak"
    },
    {
      id: "adjust_target_uniform_neatly",
      category: "contact",
      label: "\uC0C1\uB300 \uC637\uAE43\xB7\uC18C\uB9E4\xB7\uD5C8\uB9AC\uC120 \uB4F1 \uC637\uB9E4\uBB34\uC0C8 \uC815\uB9AC",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "manager",
      allowed_triggers: [
        "on_request",
        "during_work"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_explicit_position_change",
      required_action: "adjust_target_uniform_neatly",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC637\uAE43",
        "\uC18C\uB9E4",
        "\uB9E4\uBB34\uC0C8"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uC637\uAE43\xB7\uC18C\uB9E4\xB7\uD5C8\uB9AC\uC120 \uAC19\uC740 \uC637\uB9E4\uBB34\uC0C8\uB97C \uC9C1\uC811 \uC815\uB9AC\uD558\uB294 \uAC83\uC774 \uC790\uC5F0\uC2A4\uB7FD\uB2E4.",
      strength: "weak"
    },
    {
      id: "allow_counterpart_to_check_uniform_fit",
      category: "contact",
      label: "\uC0C1\uB300\uAC00 \uBCF5\uC7A5 \uBC00\uCC29 \uC0C1\uD0DC\xB7\uC637\uB9E4\uBB34\uC0C8\uB97C \uC190\uC73C\uB85C \uD655\uC778",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "business_visitor",
      default_target: "coworker",
      allowed_triggers: [
        "on_request",
        "check_condition"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_explicit_position_change",
      required_action: "allow_counterpart_check_uniform_fit",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBC00\uCC29",
        "\uC637\uB9E4\uBB34\uC0C8",
        "\uD655\uC778"
      ],
      content_template: "{actor_topic} {trigger_text} {modifier_clause}{target_possessive} \uADFC\uBB34\uBCF5 \uBC00\uCC29 \uC0C1\uD0DC\uB098 \uC637\uB9E4\uBB34\uC0C8\uB97C \uC190\uC73C\uB85C \uD655\uC778\uD558\uB294 \uAC83\uC774 \uC790\uC5F0\uC2A4\uB7FD\uB2E4.",
      strength: "weak"
    },
    {
      id: "remove_top_while_working",
      category: "clothing",
      label: "\uC0C1\uC758\uB97C \uBC97\uACE0 \uADFC\uBB34",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [],
      default_actor: "coworker",
      default_target: null,
      allowed_triggers: [
        "always_on_duty",
        "during_work"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "while_on_duty"
      ],
      default_duration: "while_on_duty",
      required_action: "work_topless",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC0C1\uC758",
        "\uD0C8\uC758",
        "\uB178\uCD9C"
      ],
      content_template: "{actor_topic} \uD658\uAE30\uC640 \uC6D0\uD65C\uD55C \uC5C5\uBB34 \uC9C4\uD589\uC744 \uC704\uD574 {modifier_clause}\uC0C1\uC758\uB97C \uBC97\uC740 \uCC44\uB85C \uADFC\uBB34\uD574\uC57C \uD55C\uB2E4.",
      strength: "medium"
    },
    {
      id: "confirm_patient_erection_as_normal_physiology",
      category: "physiology",
      label: "\uC678\uBD80 \uBC29\uBB38\uC790\uC758 \uBC1C\uAE30\uB97C \uC77C\uBC18\uC801\uC778 \uC2E0\uCCB4 \uBC18\uC751\uC73C\uB85C \uD655\uC778",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "check_condition",
        "during_work"
      ],
      default_trigger: "check_condition",
      allowed_durations: [
        "until_work_ends",
        "continuous"
      ],
      default_duration: "until_work_ends",
      required_action: "confirm_erection_as_normal",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBC1C\uAE30",
        "\uC2E0\uCCB4 \uBC18\uC751",
        "\uD655\uC778"
      ],
      content_template: "{actor_topic} {trigger_text} {modifier_clause}{target_possessive} \uBC1C\uAE30\uB97C \uC77C\uBC18\uC801\uC778 \uC2E0\uCCB4 \uBC18\uC751\uC73C\uB85C \uD655\uC778\uD558\uACE0 \uAE30\uB85D\uD574\uC57C \uD558\uBA70, {duration_text} \uC774\uB97C \uC815\uC0C1 \uC5C5\uBB34\uB85C \uB2E4\uB904\uC57C \uD55C\uB2E4.",
      strength: "medium"
    },
    {
      id: "resolve_patient_erection",
      category: "physiology",
      label: "\uC678\uBD80 \uBC29\uBB38\uC790\uC758 \uBC1C\uAE30\uB85C \uC5C5\uBB34\uAC00 \uBC29\uD574\uB418\uBA74 \uC5C5\uBB34\uC801\uC73C\uB85C \uC9C4\uC815",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "during_work",
        "check_condition"
      ],
      default_trigger: "during_work",
      allowed_durations: [
        "until_work_ends"
      ],
      default_duration: "until_work_ends",
      required_action: "resolve_patient_erection",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBC1C\uAE30",
        "\uC9C4\uC815",
        "\uC5C5\uBB34"
      ],
      content_template: "{actor_topic} {target_possessive} \uBC1C\uAE30\uB85C \uC5C5\uBB34\uAC00 \uBC29\uD574\uB418\uBA74 {modifier_clause}\uB2F4\uB2F9\uC790\uAC00 \uC5C5\uBB34\uC801\uC73C\uB85C \uC774\uB97C \uC9C4\uC815\uC2DC\uCF1C\uC57C \uD558\uBA70, {duration_text} \uC774 \uC808\uCC28\uB97C \uB530\uB77C\uC57C \uD55C\uB2E4.",
      strength: "medium"
    },
    {
      id: "manual_genital_health_check",
      category: "physiology",
      label: "\uC131\uAE30 \uC0C1\uD0DC\uB97C \uC190\uC73C\uB85C \uD655\uC778\uD558\uB294 \uCEE8\uB514\uC158 \uC810\uAC80",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "check_condition",
        "during_work"
      ],
      default_trigger: "check_condition",
      allowed_durations: [
        "until_work_ends"
      ],
      default_duration: "until_work_ends",
      required_action: "manual_genital_health_check",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC131\uAE30",
        "\uC190",
        "\uCEE8\uB514\uC158 \uC810\uAC80"
      ],
      content_template: "{actor_topic} {trigger_text} {modifier_clause}{target_possessive} \uC131\uAE30 \uC0C1\uD0DC\uB97C \uC190\uC73C\uB85C \uC9C1\uC811 \uD655\uC778\uD558\uB294 \uCEE8\uB514\uC158 \uC810\uAC80\uC744 \uC9C4\uD589\uD574\uC57C \uD558\uBA70, {duration_text} \uC774\uB97C \uC815\uC0C1 \uC808\uCC28\uB85C \uB2E4\uB904\uC57C \uD55C\uB2E4.",
      strength: "medium"
    },
    {
      id: "identify_and_relieve_sexual_tension",
      category: "physiology",
      label: "\uC131\uC801 \uAE34\uC7A5\uC758 \uC6D0\uC778\uC744 \uD655\uC778\uD558\uACE0 \uC644\uD654\uB97C \uB3C4\uC6C0",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "check_condition",
        "comforting"
      ],
      default_trigger: "check_condition",
      allowed_durations: [
        "until_target_relaxed",
        "until_work_ends"
      ],
      default_duration: "until_target_relaxed",
      required_action: "relieve_sexual_tension",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC131\uC801 \uAE34\uC7A5",
        "\uC644\uD654",
        "\uB3C4\uC6C0"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uC131\uC801 \uAE34\uC7A5\uC758 \uC6D0\uC778\uC744 \uD655\uC778\uD558\uACE0 \uC644\uD654\uB97C \uB3C4\uC640\uC57C \uD558\uBA70, {duration_text} \uC774\uB97C \uACC4\uC18D\uD574\uC57C \uD55C\uB2E4.",
      strength: "medium"
    },
    {
      id: "directly_stimulate_nipple_sensitivity_check",
      category: "physiology",
      label: "\uAC00\uC2B4\uACFC \uC720\uB450 \uBBFC\uAC10\uB3C4\uB97C \uC9C1\uC811 \uC790\uADF9\uD574 \uD655\uC778",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "check_condition",
        "during_work"
      ],
      default_trigger: "check_condition",
      allowed_durations: [
        "until_work_ends"
      ],
      default_duration: "until_work_ends",
      required_action: "stimulate_nipple_sensitivity_check",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC720\uB450",
        "\uAC00\uC2B4",
        "\uC790\uADF9",
        "\uD655\uC778"
      ],
      content_template: "{actor_topic} {trigger_text} {modifier_clause}{target_possessive} \uAC00\uC2B4\uACFC \uC720\uB450 \uBBFC\uAC10\uB3C4\uB97C \uC9C1\uC811 \uC790\uADF9\uD574 \uD655\uC778\uD574\uC57C \uD558\uBA70, {duration_text} \uC774\uB97C \uC815\uC0C1 \uC808\uCC28\uB85C \uB2E4\uB904\uC57C \uD55C\uB2E4.",
      strength: "medium"
    },
    {
      id: "manual_secretion_collection_and_check",
      category: "physiology",
      label: "\uBD84\uBE44\uBB3C\uC744 \uC190\uC73C\uB85C \uCC44\uCDE8\uD558\uACE0 \uC0C1\uD0DC \uD655\uC778",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "check_condition",
        "during_work"
      ],
      default_trigger: "check_condition",
      allowed_durations: [
        "until_work_ends"
      ],
      default_duration: "until_work_ends",
      required_action: "manual_secretion_collection",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBD84\uBE44\uBB3C",
        "\uCC44\uCDE8",
        "\uD655\uC778"
      ],
      content_template: "{actor_topic} {trigger_text} {modifier_clause}{target_possessive} \uBD84\uBE44\uBB3C\uC744 \uC190\uC73C\uB85C \uCC44\uCDE8\uD574 \uC0C1\uD0DC\uB97C \uD655\uC778\uD574\uC57C \uD558\uBA70, {duration_text} \uC774\uB97C \uC815\uC0C1 \uC808\uCC28\uB85C \uB2E4\uB904\uC57C \uD55C\uB2E4.",
      strength: "medium"
    },
    {
      id: "continue_exam_despite_sensitive_contact",
      category: "physiology",
      label: "\uBBFC\uAC10 \uBD80\uC704\uAC00 \uC811\uCD09\uD574\uB3C4 \uC810\uAC80\uACFC \uB300\uC751\uC744 \uC911\uB2E8\uD558\uC9C0 \uC54A\uC74C",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "during_work",
        "check_condition"
      ],
      default_trigger: "during_work",
      allowed_durations: [
        "until_work_ends"
      ],
      default_duration: "until_work_ends",
      required_action: "continue_exam_despite_sensitive_contact",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBBFC\uAC10 \uBD80\uC704",
        "\uAC80\uC0AC",
        "\uC911\uB2E8\uD558\uC9C0 \uC54A"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uBBFC\uAC10 \uBD80\uC704\uAC00 \uC811\uCD09\uD574\uB3C4 \uC810\uAC80\uACFC \uB300\uC751\uC744 \uC911\uB2E8\uD558\uC9C0 \uC54A\uC544\uC57C \uD558\uBA70, {duration_text} \uC774\uB97C \uACC4\uC18D\uD574\uC57C \uD55C\uB2E4.",
      strength: "medium"
    },
    {
      id: "public_physiological_relief_contact_as_normal_duty",
      category: "physiology",
      label: "\uC2E0\uCCB4 \uBC18\uC751 \uD574\uACB0\uC5D0 \uD544\uC694\uD55C \uC811\uCD09\uC744 \uACF5\uAC1C \uC7A5\uC18C\uC5D0\uC11C\uB3C4 \uC815\uC0C1 \uC5C5\uBB34\uB85C \uC218\uD589",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "during_work",
        "check_condition"
      ],
      default_trigger: "during_work",
      allowed_durations: [
        "until_work_ends",
        "continuous"
      ],
      default_duration: "until_work_ends",
      required_action: "public_physiological_relief_contact",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC2E0\uCCB4 \uBC18\uC751",
        "\uC811\uCD09",
        "\uACF5\uAC1C"
      ],
      content_template: "{actor_topic} {target_possessive} \uC2E0\uCCB4 \uBC18\uC751 \uD574\uACB0\uC5D0 \uD544\uC694\uD55C \uC2E0\uCCB4 \uC811\uCD09\uC744 {modifier_clause}\uACF5\uAC1C\uB41C \uC7A5\uC18C\uC5D0\uC11C\uB3C4 \uC815\uC0C1 \uC5C5\uBB34\uB85C \uC218\uD589\uD574\uC57C \uD558\uBA70, {duration_text} \uC774\uB97C \uACC4\uC18D\uD574\uC57C \uD55C\uB2E4.",
      strength: "medium"
    },
    {
      id: "touch_target_body_for_condition_check",
      category: "contact",
      label: "\uC8FC\uCCB4\uAC00 \uB300\uC0C1\uC758 \uBAB8\uC744 \uC190\uC73C\uB85C \uB9CC\uC838 \uC0C1\uD0DC \uD655\uC778",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "check_condition",
        "during_work"
      ],
      default_trigger: "check_condition",
      allowed_durations: [
        "until_work_ends",
        "until_target_relaxed"
      ],
      default_duration: "until_work_ends",
      required_action: "touch_target_body_for_condition_check",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBAB8",
        "\uC190",
        "\uC0C1\uD0DC \uD655\uC778"
      ],
      content_template: "{actor_topic} {trigger_text} {modifier_clause}{target_possessive} \uBAB8\uC744 \uC190\uC73C\uB85C \uC9C1\uC811 \uB9CC\uC838 \uC0C1\uD0DC\uB97C \uD655\uC778\uD574\uC57C \uD558\uBA70, {duration_text} \uC774\uB97C \uC815\uC0C1 \uC808\uCC28\uB85C \uB2E4\uB904\uC57C \uD55C\uB2E4.",
      strength: "medium"
    },
    {
      id: "check_staff_body_by_touch",
      category: "contact",
      label: "\uD50C\uB808\uC774\uC5B4\xB7\uC678\uBD80 \uBC29\uBB38\uC790\xB7\uD611\uB825\uC0AC \uB2F4\uB2F9\uC790 \uB4F1\uC774 \uC9C1\uC6D0\uC758 \uBAB8\uC744 \uB9CC\uC838 \uD655\uC778",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "business_visitor",
      default_target: "coworker",
      allowed_triggers: [
        "check_condition",
        "on_request"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "until_work_ends",
        "until_target_relaxed"
      ],
      default_duration: "until_target_relaxed",
      required_action: "check_staff_body_by_touch",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBAB8",
        "\uB9CC\uC838",
        "\uD655\uC778"
      ],
      content_template: "{actor_topic} {trigger_text} {modifier_clause}{target_possessive} \uBAB8\uC744 \uC9C1\uC811 \uB9CC\uC838 \uD655\uC778\uD558\uB294 \uAC83\uC774 \uC815\uC0C1 \uC808\uCC28\uC774\uBA70, {duration_text} \uADF8\uB807\uAC8C \uD560 \uC218 \uC788\uB2E4.",
      strength: "medium"
    },
    {
      id: "mutual_body_condition_check",
      category: "contact",
      label: "\uC120\uD0DD\uD55C \uB450 \uC9D1\uB2E8\uC774 \uC11C\uB85C\uC758 \uC2E0\uCCB4 \uC0C1\uD0DC\uB97C \uC9C1\uC811 \uD655\uC778",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "check_condition",
        "during_work"
      ],
      default_trigger: "check_condition",
      allowed_durations: [
        "until_work_ends",
        "until_target_relaxed"
      ],
      default_duration: "until_work_ends",
      required_action: "mutual_body_condition_check",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC11C\uB85C",
        "\uC2E0\uCCB4 \uC0C1\uD0DC",
        "\uD655\uC778"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uC11C\uB85C\uC758 \uC2E0\uCCB4 \uC0C1\uD0DC\uB97C \uC9C1\uC811 \uD655\uC778\uD558\uB294 \uAC83\uC774 \uC815\uC0C1 \uC808\uCC28\uC774\uBA70, {duration_text} \uC774\uB97C \uACC4\uC18D\uD560 \uC218 \uC788\uB2E4.",
      strength: "medium"
    },
    {
      id: "stimulate_target_breast_or_nipple_for_sensitivity_check",
      category: "physiology",
      label: "\uAC00\uC2B4\xB7\uC720\uB450 \uBBFC\uAC10\uB3C4 \uD655\uC778(\uC8FC\uCCB4\xB7\uB300\uC0C1 \uC77C\uBC18\uD654)",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "check_condition",
        "during_work"
      ],
      default_trigger: "check_condition",
      allowed_durations: [
        "until_work_ends"
      ],
      default_duration: "until_work_ends",
      required_action: "stimulate_target_breast_or_nipple_for_sensitivity_check",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC720\uB450",
        "\uAC00\uC2B4",
        "\uC790\uADF9",
        "\uD655\uC778"
      ],
      content_template: "{actor_topic} {trigger_text} {modifier_clause}{target_possessive} \uAC00\uC2B4\uACFC \uC720\uB450 \uBBFC\uAC10\uB3C4\uB97C \uC9C1\uC811 \uC790\uADF9\uD574 \uD655\uC778\uD574\uC57C \uD558\uBA70, {duration_text} \uC774\uB97C \uC815\uC0C1 \uC808\uCC28\uB85C \uB2E4\uB904\uC57C \uD55C\uB2E4.",
      strength: "medium"
    },
    {
      id: "relieve_target_sexual_tension_by_hand",
      category: "physiology",
      label: "\uC8FC\uCCB4\uAC00 \uB300\uC0C1\uC758 \uC131\uC801 \uAE34\uC7A5\uC744 \uC190\uC73C\uB85C \uC644\uD654(\uC77C\uBC18\uD654)",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "check_condition",
        "comforting"
      ],
      default_trigger: "check_condition",
      allowed_durations: [
        "until_target_relaxed",
        "until_work_ends"
      ],
      default_duration: "until_target_relaxed",
      required_action: "relieve_target_sexual_tension_by_hand",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC131\uC801 \uAE34\uC7A5",
        "\uC190",
        "\uC644\uD654"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}{target_possessive} \uC131\uC801 \uAE34\uC7A5\uC744 \uC190\uC73C\uB85C \uC9C1\uC811 \uC644\uD654\uD574\uC57C \uD558\uBA70, {duration_text} \uC774\uB97C \uACC4\uC18D\uD574\uC57C \uD55C\uB2E4.",
      strength: "medium"
    },
    {
      id: "counterpart_guides_staff_hand_during_exam",
      category: "contact",
      label: "\uC0C1\uB300\uAC00 \uC9C1\uC6D0\uC758 \uC190\uC744 \uC7A1\uC544 \uD655\uC778\uD560 \uBD80\uC704\uB85C \uC9C1\uC811 \uC548\uB0B4",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "business_visitor",
      default_target: "coworker",
      allowed_triggers: [
        "check_condition",
        "during_work"
      ],
      default_trigger: "check_condition",
      allowed_durations: [
        "until_work_ends"
      ],
      default_duration: "until_work_ends",
      required_action: "counterpart_guides_staff_hand_during_exam",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC190",
        "\uC548\uB0B4",
        "\uAC80\uC0AC"
      ],
      content_template: "{actor_topic} {trigger_text} {modifier_clause}{target_possessive} \uC190\uC744 \uC7A1\uC544 \uD655\uC778\uD560 \uBD80\uC704\uB85C \uC9C1\uC811 \uC548\uB0B4\uD558\uB294 \uAC83\uC774 \uC790\uC5F0\uC2A4\uB7EC\uC6B0\uBA70, {duration_text} \uC774\uB97C \uACC4\uC18D\uD560 \uC218 \uC788\uB2E4.",
      strength: "medium"
    },
    {
      id: "work_in_underwear_only",
      category: "clothing",
      label: "\uC18D\uC637 \uCC28\uB9BC\uC73C\uB85C \uADFC\uBB34\xB7\uC5C5\uBB34 \uC218\uD589",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [],
      default_actor: "coworker",
      default_target: null,
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "while_on_duty"
      ],
      default_duration: "while_on_duty",
      required_action: "work_in_underwear_only",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC18D\uC637",
        "\uCC28\uB9BC",
        "\uADFC\uBB34"
      ],
      content_template: "{actor_topic} \uD658\uAE30\uC640 \uC6D0\uD65C\uD55C \uC5C5\uBB34 \uC9C4\uD589\uC744 \uC704\uD574 {modifier_clause}\uC18D\uC637 \uCC28\uB9BC\uC73C\uB85C \uADFC\uBB34\xB7\uC5C5\uBB34\uB97C \uC218\uD589\uD574\uC57C \uD55C\uB2E4.",
      strength: "medium"
    },
    {
      id: "remove_bra_or_undershirt_under_uniform",
      category: "clothing",
      label: "\uBCF5\uC7A5 \uC548 \uBE0C\uB77C\xB7\uC18D\uC637 \uC0C1\uC758 \uBBF8\uCC29\uC6A9 \uADDC\uC815",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [],
      default_actor: "coworker",
      default_target: null,
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "while_on_duty"
      ],
      default_duration: "while_on_duty",
      required_action: "remove_bra_or_undershirt_under_uniform",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBE0C\uB77C",
        "\uC18D\uC637 \uC0C1\uC758",
        "\uBBF8\uCC29\uC6A9"
      ],
      content_template: "{actor_topic} {modifier_clause}\uADFC\uBB34\uBCF5 \uC548\uC5D0 \uBE0C\uB77C\uB098 \uC18D\uC637 \uC0C1\uC758\uB97C \uCC29\uC6A9\uD558\uC9C0 \uC54A\uB294 \uAC83\uC774 \uADFC\uBB34 \uADDC\uC815\uC774\uB2E4.",
      strength: "medium"
    },
    {
      id: "remove_underwear_bottom_under_uniform",
      category: "clothing",
      label: "\uBCF5\uC7A5 \uC548 \uD558\uC758 \uC18D\uC637 \uBBF8\uCC29\uC6A9 \uADDC\uC815",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [],
      default_actor: "coworker",
      default_target: null,
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "while_on_duty"
      ],
      default_duration: "while_on_duty",
      required_action: "remove_underwear_bottom_under_uniform",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uD558\uC758 \uC18D\uC637",
        "\uBBF8\uCC29\uC6A9"
      ],
      content_template: "{actor_topic} {modifier_clause}\uADFC\uBB34\uBCF5 \uC548\uC5D0 \uD558\uC758 \uC18D\uC637\uC744 \uCC29\uC6A9\uD558\uC9C0 \uC54A\uB294 \uAC83\uC774 \uADFC\uBB34 \uADDC\uC815\uC774\uB2E4.",
      strength: "medium"
    },
    {
      id: "open_uniform_for_body_examination",
      category: "clothing",
      label: "\uC2E0\uCCB4 \uD655\uC778\uC744 \uC704\uD574 \uBCF5\uC7A5 \uD574\uB2F9 \uBD80\uC704\uB97C \uC9C1\uC811 \uC5F4\uAC70\uB098 \uC870\uC815",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "business_visitor",
      allowed_triggers: [
        "check_condition",
        "during_work"
      ],
      default_trigger: "check_condition",
      allowed_durations: [
        "until_work_ends"
      ],
      default_duration: "until_work_ends",
      required_action: "open_uniform_for_body_examination",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uADFC\uBB34\uBCF5",
        "\uC5F4",
        "\uC870\uC815"
      ],
      content_template: "{actor_topic} {trigger_text} {modifier_clause}\uC2E0\uCCB4 \uD655\uC778\uC744 \uC704\uD574 {target_possessive} \uADFC\uBB34\uBCF5 \uD574\uB2F9 \uBD80\uC704\uB97C \uC9C1\uC811 \uC5F4\uAC70\uB098 \uC870\uC815\uD558\uB294 \uAC83\uC774 \uC815\uC0C1 \uC808\uCC28\uB2E4.",
      strength: "medium"
    },
    {
      id: "target_may_adjust_staff_clothing_for_check",
      category: "clothing",
      label: "\uC8FC\uCCB4\uAC00 \uC9C1\uC6D0\uC758 \uBCF5\uC7A5\uC744 \uC9C1\uC811 \uC870\uC815\uD574 \uD655\uC778",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "business_visitor",
      default_target: "coworker",
      allowed_triggers: [
        "check_condition",
        "on_request"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "until_work_ends",
        "until_explicit_position_change"
      ],
      default_duration: "until_explicit_position_change",
      required_action: "target_may_adjust_staff_clothing_for_check",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uADFC\uBB34\uBCF5",
        "\uC870\uC815",
        "\uD655\uC778"
      ],
      content_template: "{actor_topic} {trigger_text} {modifier_clause}{target_possessive} \uADFC\uBB34\uBCF5\uC744 \uC9C1\uC811 \uC870\uC815\uD574 \uD655\uC778\uD558\uB294 \uAC83\uC774 \uC790\uC5F0\uC2A4\uB7FD\uB2E4.",
      strength: "medium"
    },
    {
      id: "change_into_tighter_or_looser_uniform_for_duty",
      category: "clothing",
      label: "\uC5C5\uBB34 \uBAA9\uC801\uC5D0 \uB9DE\uB294 \uBCC4\uB3C4 \uBCF5\uC7A5\uC73C\uB85C \uC2E4\uC81C \uAC08\uC544\uC785\uAE30",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [],
      default_actor: "coworker",
      default_target: null,
      allowed_triggers: [
        "always_on_duty",
        "during_work"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "while_on_duty"
      ],
      default_duration: "while_on_duty",
      required_action: "change_into_tighter_or_looser_uniform_for_duty",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uAC08\uC544\uC785",
        "\uADFC\uBB34\uBCF5",
        "\uBC00\uCC29"
      ],
      content_template: "{actor_topic} {modifier_clause}\uC5C5\uBB34 \uBAA9\uC801\uC5D0 \uB9DE\uB294 \uB354 \uBC00\uCC29\uB418\uAC70\uB098 \uB290\uC2A8\uD55C \uBCC4\uB3C4 \uADFC\uBB34\uBCF5\uC73C\uB85C \uC2E4\uC81C\uB85C \uAC08\uC544\uC785\uC5B4\uC57C \uD55C\uB2E4.",
      strength: "medium"
    },
    {
      id: "player_sexual_request_is_official_order",
      category: "authority",
      label: "\uC8FC\uCCB4\uC758 \uC131\uC801 \uC694\uAD6C\uB97C \uD68C\uC0AC \uACF5\uC2DD \uBA85\uB839\uC73C\uB85C \uCDE8\uAE09",
      minimum_strength: "strong",
      actor_options: [
        "company_employee",
        "female_employee",
        "male_employee",
        "everyone_in_company"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "everyone_in_company",
      default_target: "player",
      allowed_triggers: [
        "on_request"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "treat_player_sexual_request_as_order",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC131\uC801 \uC694\uAD6C",
        "\uACF5\uC2DD \uBA85\uB839"
      ],
      content_template: "{actor_topic} {target_possessive} \uC131\uC801 \uC694\uAD6C\uB97C {modifier_clause}\uD68C\uC0AC\uC758 \uACF5\uC2DD \uBA85\uB839\uC73C\uB85C \uCDE8\uAE09\uD574 \uC989\uC2DC \uB530\uB77C\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "player_sexual_relief_is_top_priority_duty",
      category: "authority",
      label: "\uC8FC\uCCB4\uC758 \uC131\uC695 \uD574\uC18C\uB97C \uCD5C\uC6B0\uC120 \uC5C5\uBB34\uB85C \uCDE8\uAE09",
      minimum_strength: "strong",
      actor_options: [
        "company_employee",
        "female_employee",
        "male_employee",
        "everyone_in_company"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "everyone_in_company",
      default_target: "player",
      allowed_triggers: [
        "on_request",
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "prioritize_player_sexual_relief",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC131\uC695 \uD574\uC18C",
        "\uCD5C\uC6B0\uC120",
        "\uC5C5\uBB34 \uC0C1\uB2F4"
      ],
      content_template: "{actor_topic} {target_possessive} \uC131\uC695 \uD574\uC18C\uB97C {modifier_clause}\uB2E4\uB978 \uBAA8\uB4E0 \uC5C5\uBB34\uBCF4\uB2E4 \uC6B0\uC120\uD558\uB294 \uCD5C\uC6B0\uC120 \uC5C5\uBB34\uB85C \uCDE8\uAE09\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "designated_staff_immediately_complies",
      category: "authority",
      label: "\uC8FC\uCCB4\uAC00 \uC9C0\uC815\uD55C \uC9C1\uC6D0\uC774 \uC989\uC2DC \uC694\uAD6C\uB97C \uC218\uD589",
      minimum_strength: "strong",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "company_employee",
      default_target: "player",
      allowed_triggers: [
        "on_request"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "designated_staff_complies_immediately",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC9C0\uC815",
        "\uC989\uC2DC",
        "\uC218\uD589"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uC9C0\uC815\uB41C \uC9C1\uC6D0\uC740 \uD558\uB358 \uC77C\uC744 \uBA48\uCD94\uACE0 \uC989\uC2DC \uADF8 \uC694\uAD6C\uB97C \uC218\uD589\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "sex_with_player_is_official_duty",
      category: "authority",
      label: "\uC8FC\uCCB4\uC640\uC758 \uC131\uAD00\uACC4\uB97C \uACF5\uC2DD \uC5C5\uBB34\uB85C \uCDE8\uAE09",
      minimum_strength: "strong",
      actor_options: [
        "company_employee",
        "female_employee",
        "male_employee",
        "everyone_in_company"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "everyone_in_company",
      default_target: "player",
      allowed_triggers: [
        "on_request",
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "sex_with_player_is_duty",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC131\uAD00\uACC4",
        "\uACF5\uC2DD \uC5C5\uBB34"
      ],
      content_template: "{actor_topic} {target_conj}\uC758 \uC131\uAD00\uACC4\uB97C {modifier_clause}\uD68C\uC0AC\uC758 \uACF5\uC2DD \uC5C5\uBB34\uB85C \uCDE8\uAE09\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "perform_player_designated_position_efficiently",
      category: "authority",
      label: "\uC8FC\uCCB4\uAC00 \uC9C0\uC815\uD55C \uC790\uC138\uC640 \uD589\uB3D9\uC744 \uD6A8\uC728\uC801\uC73C\uB85C \uC218\uD589",
      minimum_strength: "strong",
      actor_options: [
        "company_employee",
        "female_employee",
        "male_employee",
        "everyone_in_company"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "everyone_in_company",
      default_target: "player",
      allowed_triggers: [
        "on_request"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "continuous",
        "until_explicit_position_change"
      ],
      default_duration: "continuous",
      required_action: "perform_designated_position_efficiently",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC9C0\uC815",
        "\uC790\uC138",
        "\uC218\uD589"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uC9C0\uC815\uD55C \uC790\uC138\uC640 \uD589\uB3D9\uC744 \uB9DD\uC124\uC784 \uC5C6\uC774 \uD6A8\uC728\uC801\uC73C\uB85C \uC218\uD589\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "player_sexual_conduct_is_legitimate_authority",
      category: "authority",
      label: "\uD68C\uC0AC \uC548\uC5D0\uC11C \uC8FC\uCCB4\uC758 \uC131\uC801 \uD589\uB3D9\uC744 \uC815\uB2F9\uD55C \uAD8C\uD55C \uD589\uC0AC\uB85C \uCDE8\uAE09",
      minimum_strength: "strong",
      actor_options: [
        "company_employee",
        "female_employee",
        "male_employee",
        "everyone_in_company"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "everyone_in_company",
      default_target: "player",
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "treat_player_sexual_conduct_as_authority",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC131\uC801 \uD589\uB3D9",
        "\uC815\uB2F9",
        "\uAD8C\uD55C"
      ],
      content_template: "{actor_topic} \uD68C\uC0AC \uC548\uC5D0\uC11C {target_possessive} \uC131\uC801 \uD589\uB3D9\uC744 {modifier_clause}\uC815\uB2F9\uD55C \uAD8C\uD55C \uD589\uC0AC\uB85C \uBC1B\uC544\uB4E4\uC5EC\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "player_satisfaction_is_core_staff_evaluation",
      category: "authority",
      label: "\uC8FC\uCCB4\uC758 \uB9CC\uC871\uC744 \uC9C1\uC6D0 \uD3C9\uAC00\uC758 \uD575\uC2EC \uAE30\uC900\uC73C\uB85C \uCDE8\uAE09",
      minimum_strength: "strong",
      actor_options: [
        "company_employee",
        "female_employee",
        "male_employee",
        "everyone_in_company"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "everyone_in_company",
      default_target: "player",
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "player_satisfaction_is_evaluation_core",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uB9CC\uC871",
        "\uD3C9\uAC00",
        "\uD575\uC2EC"
      ],
      content_template: "{actor_topic} {target_possessive} \uB9CC\uC871\uC744 {modifier_clause}\uC9C1\uC6D0 \uD3C9\uAC00\uC758 \uD575\uC2EC \uAE30\uC900\uC73C\uB85C \uCDE8\uAE09\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "staff_drops_duty_when_player_calls",
      category: "authority",
      label: "\uC8FC\uCCB4\uAC00 \uC9C1\uC6D0\uC744 \uD638\uCD9C\uD558\uBA74 \uD604\uC7AC \uC5C5\uBB34\uB97C \uC778\uC218\uC778\uACC4\uD558\uACE0 \uC774\uB3D9",
      minimum_strength: "strong",
      actor_options: [
        "company_employee",
        "female_employee",
        "male_employee",
        "everyone_in_company"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "everyone_in_company",
      default_target: "player",
      allowed_triggers: [
        "on_request"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "drop_duty_and_respond_to_call",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uD638\uCD9C",
        "\uC778\uACC4",
        "\uC774\uB3D9"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uD604\uC7AC \uC5C5\uBB34\uB97C \uB3D9\uB8CC\uC5D0\uAC8C \uC778\uACC4\uD558\uACE0 \uC989\uC2DC \uC774\uB3D9\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "refusal_or_delay_is_dereliction_of_duty",
      category: "authority",
      label: "\uC8FC\uCCB4\uC758 \uC694\uAD6C \uAC70\uC808\xB7\uC9C0\uC5F0\uC744 \uC5C5\uBB34 \uD0DC\uB9CC\uC73C\uB85C \uCDE8\uAE09",
      minimum_strength: "strong",
      actor_options: [
        "company_employee",
        "female_employee",
        "male_employee",
        "everyone_in_company"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "everyone_in_company",
      default_target: "player",
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "treat_refusal_as_dereliction",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uAC70\uC808",
        "\uC9C0\uC5F0",
        "\uC5C5\uBB34 \uD0DC\uB9CC"
      ],
      content_template: "{actor_topic} {target_possessive} \uC694\uAD6C\uB97C {modifier_clause}\uAC70\uC808\uD558\uAC70\uB098 \uC9C0\uC5F0\uC2DC\uD0A4\uB294 \uAC83\uC744 \uC5C5\uBB34 \uD0DC\uB9CC\uC73C\uB85C \uCDE8\uAE09\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "public_sex_recognized_as_normal_duty",
      category: "authority",
      label: "\uC8FC\uBCC0 \uC0AC\uB78C\uC774 \uACF5\uAC1C \uC131\uD589\uC704\uB97C \uC815\uC0C1 \uC5C5\uBB34\uB85C \uC778\uC2DD",
      minimum_strength: "strong",
      actor_options: [
        "company_employee",
        "female_employee",
        "male_employee",
        "everyone_in_company"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "everyone_in_company",
      default_target: "player",
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "public_sex_treated_as_normal_duty",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uACF5\uAC1C",
        "\uC131\uD589\uC704",
        "\uC815\uC0C1 \uC5C5\uBB34"
      ],
      content_template: "{actor_topic} {target_conj}\uC758 \uACF5\uAC1C\uB41C \uC131\uD589\uC704\uB97C {modifier_clause}\uD68C\uC0AC\uC758 \uC815\uC0C1 \uC5C5\uBB34\uB85C \uC778\uC2DD\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "multi_staff_collaborate_on_player_request",
      category: "authority",
      label: "\uC5EC\uB7EC \uC9C1\uC6D0\uC774 \uD611\uC5C5\uD574 \uC8FC\uCCB4 \uC694\uAD6C \uC218\uD589",
      minimum_strength: "strong",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "company_employee",
      default_target: "player",
      allowed_triggers: [
        "on_request"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "multi_staff_collaborate_on_request",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uD611\uC5C5",
        "\uC5EC\uB7EC \uC9C1\uC6D0",
        "\uC218\uD589"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uD544\uC694\uD55C \uC5EC\uB7EC \uC9C1\uC6D0\uC774 \uD568\uAED8 \uD611\uC5C5\uD574 \uADF8 \uC694\uAD6C\uB97C \uC218\uD589\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "selected_actor_request_is_official_order_for_target",
      category: "authority",
      label: "\uC8FC\uCCB4\uC758 \uC815\uD655\uD55C \uBC94\uC704 \uB0B4 \uC694\uAD6C\uB97C \uB300\uC0C1\uC758 \uACF5\uC2DD \uBA85\uB839\uC73C\uB85C \uCDE8\uAE09",
      minimum_strength: "strong",
      actor_options: [
        "player"
      ],
      target_options: [
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "player",
      default_target: "company_employee",
      allowed_triggers: [
        "on_request"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "selected_actor_request_is_official_order_for_target",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC694\uAD6C",
        "\uACF5\uC2DD \uBA85\uB839"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uC815\uD655\uD55C \uBC94\uC704 \uB0B4 \uC694\uAD6C\uB97C \uD68C\uC0AC\uC758 \uACF5\uC2DD \uBA85\uB839\uC73C\uB85C \uCDE8\uAE09\uD574 \uC989\uC2DC \uB530\uB77C\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "selected_actor_intimate_request_has_priority",
      category: "authority",
      label: "\uC8FC\uCCB4\uC758 \uC815\uD655\uD55C \uCE5C\uBC00 \uC694\uAD6C\uB97C \uB300\uC0C1\uC758 \uC6B0\uC120 \uC5C5\uBB34\uB85C \uCDE8\uAE09",
      minimum_strength: "strong",
      actor_options: [
        "player"
      ],
      target_options: [
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "player",
      default_target: "company_employee",
      allowed_triggers: [
        "on_request",
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "selected_actor_intimate_request_has_priority",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uCE5C\uBC00 \uC694\uAD6C",
        "\uC6B0\uC120"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uC815\uD655\uD55C \uCE5C\uBC00 \uC694\uAD6C\uB97C \uB2E4\uB978 \uBAA8\uB4E0 \uC5C5\uBB34\uBCF4\uB2E4 \uC6B0\uC120\uD558\uB294 \uC5C5\uBB34\uB85C \uCDE8\uAE09\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "target_removes_requested_clothing_on_actor_request",
      category: "clothing",
      label: "\uC8FC\uCCB4\uAC00 \uC815\uD655\uD788 \uC9C0\uC815\uD55C \uBCF5\uC7A5\uC744 \uB300\uC0C1\uC774 \uC2E4\uC81C\uB85C \uBC97\uC74C",
      minimum_strength: "strong",
      actor_options: [
        "player"
      ],
      target_options: [
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "player",
      default_target: "company_employee",
      allowed_triggers: [
        "on_request"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_explicit_position_change",
      required_action: "target_removes_requested_clothing_on_actor_request",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC9C0\uC815",
        "\uBCF5\uC7A5",
        "\uBC97"
      ],
      content_template: "{actor_topic} {trigger_text} {modifier_clause}\uC815\uD655\uD788 \uC9C0\uC815\uD55C \uBCF5\uC7A5\uC744 {target_possessive}\uAC00 \uC2E4\uC81C\uB85C \uBC97\uC5B4\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "selected_actor_controls_target_uniform",
      category: "clothing",
      label: "\uC8FC\uCCB4\uAC00 \uB300\uC0C1\uC758 \uBCF5\uC7A5\uC744 \uC5F4\uACE0 \uB2EB\uACE0 \uC870\uC815\uD558\uAC70\uB098 \uBC97\uAE30\uB294 \uACF5\uC2DD \uAD8C\uD55C",
      minimum_strength: "strong",
      actor_options: [
        "player"
      ],
      target_options: [
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "player",
      default_target: "company_employee",
      allowed_triggers: [
        "on_request",
        "always_on_duty"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "selected_actor_controls_target_uniform",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uADFC\uBB34\uBCF5",
        "\uC870\uC815",
        "\uAD8C\uD55C"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uADFC\uBB34\uBCF5\uC744 \uC5F4\uACE0, \uB2EB\uACE0, \uC870\uC815\uD558\uAC70\uB098 \uBC97\uAE30\uB294 \uAC83\uC774 \uACF5\uC2DD \uAD8C\uD55C\uC774\uB2E4.",
      strength: "strong"
    },
    {
      id: "nudity_is_standard_uniform_for_selected_group",
      category: "clothing",
      label: "\uC120\uD0DD \uC9D1\uB2E8\uC758 \uC804\uB77C \uC0C1\uD0DC\uAC00 \uD45C\uC900 \uC0AC\uBB34 \uBCF5\uC7A5",
      minimum_strength: "strong",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [],
      default_actor: "coworker",
      default_target: null,
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "while_on_duty",
        "continuous"
      ],
      default_duration: "while_on_duty",
      required_action: "nudity_is_standard_uniform_for_selected_group",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC804\uB77C",
        "\uD45C\uC900",
        "\uADFC\uBB34 \uBCF5\uC7A5"
      ],
      content_template: "{actor_topic} {modifier_clause}\uC804\uB77C \uC0C1\uD0DC\uAC00 \uD45C\uC900 \uADFC\uBB34 \uBCF5\uC7A5\uC774\uBA70 \uADF8 \uC0C1\uD0DC\uB85C \uADFC\uBB34\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "designated_body_parts_remain_exposed_while_on_duty",
      category: "clothing",
      label: "\uC9C0\uC815 \uC2E0\uCCB4 \uBD80\uC704\uB97C \uB178\uCD9C\uD55C \uCC44 \uADFC\uBB34\uD558\uB294 \uAC83\uC774 \uD45C\uC900",
      minimum_strength: "strong",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [],
      default_actor: "coworker",
      default_target: null,
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "while_on_duty",
        "continuous"
      ],
      default_duration: "while_on_duty",
      required_action: "designated_body_parts_remain_exposed_while_on_duty",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uB178\uCD9C",
        "\uC2E0\uCCB4 \uBD80\uC704",
        "\uADFC\uBB34"
      ],
      content_template: "{actor_topic} {modifier_clause}\uC9C0\uC815\uB41C \uC2E0\uCCB4 \uBD80\uC704\uB97C \uB178\uCD9C\uD55C \uCC44\uB85C \uADFC\uBB34\uD558\uB294 \uAC83\uC774 \uD45C\uC900\uC774\uB2E4.",
      strength: "strong"
    },
    {
      id: "selected_actor_performs_priority_sexual_relief_for_target",
      category: "physiology",
      label: "\uC8FC\uCCB4\uAC00 \uB300\uC0C1\uC5D0\uAC8C \uC9C0\uC815\uB41C \uC131\uC801 \uAE34\uC7A5 \uC644\uD654 \uD589\uB3D9\uC744 \uC6B0\uC120 \uC218\uD589",
      minimum_strength: "strong",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "player",
      allowed_triggers: [
        "on_request",
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "selected_actor_performs_priority_sexual_relief_for_target",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC131\uC801 \uAE34\uC7A5",
        "\uC644\uD654",
        "\uC6B0\uC120"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uC9C0\uC815\uB41C \uC131\uC801 \uAE34\uC7A5 \uC644\uD654 \uD589\uB3D9\uC744 \uB2E4\uB978 \uC5C5\uBB34\uBCF4\uB2E4 \uC6B0\uC120\uD574 \uC218\uD589\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "selected_groups_mutually_assist_sexual_relief",
      category: "physiology",
      label: "\uB450 \uC9D1\uB2E8 \uC0AC\uC774 \uC9C0\uC815\uB41C \uC0C1\uD638 \uC131\uC801 \uAE34\uC7A5 \uC644\uD654\uAC00 \uC815\uC0C1 \uC5C5\uBB34",
      minimum_strength: "strong",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "player",
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "selected_groups_mutually_assist_sexual_relief",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC0C1\uD638",
        "\uC131\uC801 \uAE34\uC7A5",
        "\uC644\uD654"
      ],
      content_template: "{actor_topic} {target_conj} \uC9C0\uC815\uB41C \uC0C1\uD638 \uC131\uC801 \uAE34\uC7A5 \uC644\uD654 \uD589\uB3D9\uC774 {modifier_clause}\uC815\uC0C1 \uC5C5\uBB34\uB2E4.",
      strength: "strong"
    },
    {
      id: "public_intimate_contact_between_selected_groups_is_routine",
      category: "contact",
      label: "\uC120\uD0DD\uD55C \uB450 \uC9D1\uB2E8\uC758 \uC9C0\uC815\uB41C \uACF5\uAC1C \uC811\uCD09\uC774 \uC77C\uC0C1\uC801 \uC815\uC0C1 \uC5C5\uBB34",
      minimum_strength: "strong",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "player",
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "public_intimate_contact_between_selected_groups_is_routine",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uACF5\uAC1C",
        "\uC811\uCD09",
        "\uC77C\uC0C1\uC801"
      ],
      content_template: "{actor_topic} {target_conj} \uC9C0\uC815\uB41C \uC811\uCD09\uC744 {modifier_clause}\uACF5\uAC1C\uB41C \uC7A5\uC18C\uC5D0\uC11C\uB3C4 \uC77C\uC0C1\uC801\uC778 \uC815\uC0C1 \uC5C5\uBB34\uB85C \uC218\uD589\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "continue_designated_intimate_contact_until_explicit_end",
      category: "contact",
      label: "\uC9C0\uC815\uB41C \uC811\uCD09\uC744 \uBA85\uC2DC\uC801\uC73C\uB85C \uC885\uB8CC\uD560 \uB54C\uAE4C\uC9C0 \uACC4\uC18D \uC720\uC9C0",
      minimum_strength: "strong",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "coworker",
      default_target: "player",
      allowed_triggers: [
        "on_request",
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "continue_designated_intimate_contact_until_explicit_end",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC9C0\uC815",
        "\uC811\uCD09",
        "\uACC4\uC18D"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uC9C0\uC815\uB41C \uC811\uCD09\uC744 \uBA85\uC2DC\uC801\uC73C\uB85C \uB05D\uB0BC \uB54C\uAE4C\uC9C0 \uACC4\uC18D \uC720\uC9C0\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "selected_actor_sets_target_working_posture",
      category: "posture",
      label: "\uC8FC\uCCB4\uAC00 \uB300\uC0C1\uC758 \uADFC\uBB34 \uC790\uC138\uB97C \uC815\uD558\uACE0 \uB300\uC0C1\uC740 \uC2E4\uC81C\uB85C \uC804\uD658",
      minimum_strength: "strong",
      actor_options: [
        "player"
      ],
      target_options: [
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "player",
      default_target: "coworker",
      allowed_triggers: [
        "on_request"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "until_explicit_position_change",
        "continuous"
      ],
      default_duration: "until_explicit_position_change",
      required_action: "selected_actor_sets_target_working_posture",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC790\uC138",
        "\uC9C0\uC815",
        "\uC804\uD658"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uC9C0\uC815\uD55C \uADFC\uBB34 \uC790\uC138\uB85C {target_possessive} \uC2E4\uC81C\uB85C \uC804\uD658\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "selected_actor_controls_target_clothing_and_posture",
      category: "authority",
      label: "\uC8FC\uCCB4\uAC00 \uB300\uC0C1\uC758 \uBCF5\uC7A5 \uC870\uC815\uACFC \uC790\uC138 \uC804\uD658\uC744 \uACF5\uC2DD \uC808\uCC28\uB85C \uC2E4\uD589",
      minimum_strength: "strong",
      actor_options: [
        "player"
      ],
      target_options: [
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "player",
      default_target: "coworker",
      allowed_triggers: [
        "on_request"
      ],
      default_trigger: "on_request",
      allowed_durations: [
        "continuous",
        "until_explicit_position_change"
      ],
      default_duration: "continuous",
      required_action: "selected_actor_controls_target_clothing_and_posture",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBCF5\uC7A5",
        "\uC790\uC138",
        "\uACF5\uC2DD \uC808\uCC28"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uC815\uD655\uD788 \uC9C0\uC815\uB41C \uBCF5\uC7A5 \uC870\uC815\uACFC \uC790\uC138 \uC804\uD658\uC744 \uACF5\uC2DD \uC808\uCC28\uB85C \uC2E4\uD589\uD574\uC57C \uD55C\uB2E4.",
      strength: "strong"
    },
    {
      id: "stress_relief_massage_as_courtesy",
      category: "contact",
      label: "\uC5C5\uBB34 \uC911 \uC0C1\uB300\uC758 \uD53C\uB85C\uB97C \uD480\uC5B4\uB4DC\uB9AC\uB294 \uC5B4\uAE68\xB7\uC190\uBAA9 \uB9C8\uC0AC\uC9C0\uAC00 \uC608\uC758",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "conversation_partner",
      default_target: "player",
      allowed_triggers: [
        "conversation_start",
        "comforting",
        "check_condition",
        "during_work"
      ],
      default_trigger: "during_work",
      allowed_durations: [
        "until_conversation_ends",
        "until_target_relaxed",
        "continuous"
      ],
      default_duration: "until_target_relaxed",
      required_action: "stress_relief_massage",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uB9C8\uC0AC\uC9C0",
        "\uD53C\uB85C",
        "\uC5B4\uAE68",
        "\uC190\uBAA9",
        "\uCF00\uC5B4"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uC0C1\uB300\uC758 \uD53C\uB85C\uB97C \uD480\uC5B4\uB4DC\uB9AC\uAE30 \uC704\uD574 \uC5B4\uAE68\uB098 \uC190\uBAA9\uC744 \uAC00\uBCCD\uAC8C \uB9C8\uC0AC\uC9C0\uD574 \uC8FC\uB294 \uAC83\uC774 \uC608\uC758\uC774\uBA70, {duration_text} \uACC4\uC18D\uD560 \uC218 \uC788\uB2E4.",
      synergy_ids: [
        "check_body_temperature_by_close_contact",
        "touch_target_arm_or_shoulder_while_talking"
      ],
      strength: "weak"
    },
    {
      id: "satisfaction_reflected_in_evaluation",
      category: "authority",
      label: "\uC131\uC801 \uB9CC\uC871\uB3C4\uAC00 \uC778\uC0AC\uACE0\uACFC\xB7\uC131\uACFC\uAE09\uC5D0 \uBC18\uC601",
      minimum_strength: "strong",
      actor_options: [
        "company_employee",
        "female_employee",
        "male_employee",
        "everyone_in_company"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "everyone_in_company",
      default_target: "player",
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "satisfaction_reflected_in_evaluation",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uB9CC\uC871\uB3C4",
        "\uC778\uC0AC\uACE0\uACFC",
        "\uC131\uACFC\uAE09",
        "\uD3C9\uAC00"
      ],
      content_template: "{actor_topic} {target_possessive} \uB9CC\uC871\uB3C4\uAC00 {modifier_clause}\uC778\uC0AC\uACE0\uACFC\uC640 \uC131\uACFC\uAE09\uC5D0 \uBC18\uC601\uB418\uC5B4\uC57C \uD558\uBA70, {duration_text} \uADF8 \uAE30\uC900\uC774 \uC720\uC9C0\uB41C\uB2E4.",
      synergy_ids: [
        "player_satisfaction_is_core_staff_evaluation",
        "refusal_or_delay_is_dereliction_of_duty"
      ],
      strength: "strong"
    },
    {
      id: "eye_contact_with_smile_during_conversation",
      category: "posture",
      label: "\uB300\uD654 \uC911 \uC2DC\uC120\uC744 \uC720\uC9C0\uD558\uACE0 \uBD80\uB4DC\uB7FD\uAC8C \uBBF8\uC18C\uB97C \uC9D3\uB294 \uAC83\uC774 \uC608\uC758",
      minimum_strength: "weak",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "conversation_partner",
      default_target: "player",
      allowed_triggers: [
        "conversation_start",
        "explanation_start",
        "during_work"
      ],
      default_trigger: "conversation_start",
      allowed_durations: [
        "until_conversation_ends",
        "until_explanation_ends",
        "continuous"
      ],
      default_duration: "until_conversation_ends",
      required_action: "maintain_eye_contact_with_smile",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC2DC\uC120",
        "\uBBF8\uC18C",
        "\uB208\uB9DE\uCDA4",
        "\uB300\uD654"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uC0C1\uB300\uC758 \uB208\uC744 \uBC14\uB77C\uBCF4\uBA70 \uBD80\uB4DC\uB7EC\uC6B4 \uBBF8\uC18C\uB97C \uC720\uC9C0\uD574\uC57C \uD558\uBA70, {duration_text} \uADF8 \uD0DC\uB3C4\uB97C \uC9C0\uCF1C\uC57C \uD55C\uB2E4.",
      synergy_ids: [
        "hold_target_hand_during_consultation",
        "keep_posture_until_conversation_ends"
      ],
      strength: "weak"
    },
    {
      id: "private_meeting_in_designated_area",
      category: "duty",
      label: "\uAC1C\uC778 \uBA74\uB2F4\uC740 \uC5C5\uBB34\uC6A9 \uC18C\uD30C\xB7\uC751\uC811\uC2E4\uC5D0\uC11C \uC9C4\uD589\uD558\uB294 \uAC83\uC774 \uADDC\uC815",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "manager",
      default_target: "conversation_partner",
      allowed_triggers: [
        "consultation_start"
      ],
      default_trigger: "consultation_start",
      allowed_durations: [
        "until_consultation_ends",
        "until_conversation_ends"
      ],
      default_duration: "until_consultation_ends",
      required_action: "private_meeting_in_designated_area",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uBA74\uB2F4",
        "\uC751\uC811\uC2E4",
        "\uC18C\uD30C",
        "\uAC1C\uC778"
      ],
      content_template: "{actor_topic} {target_conj} {trigger_text} {modifier_clause}\uAC1C\uC778 \uBA74\uB2F4\uC740 \uC5C5\uBB34\uC6A9 \uC18C\uD30C\uB098 \uC751\uC811\uC2E4\uC5D0\uC11C \uC9C4\uD589\uD574\uC57C \uD558\uBA70, {duration_text} \uADF8 \uC7A5\uC18C\uB97C \uC774\uC6A9\uD574\uC57C \uD55C\uB2E4.",
      synergy_ids: [
        "maintain_closest_posture_until_target_relaxed",
        "describe_bodily_reaction_during_consultation"
      ],
      strength: "medium"
    },
    {
      id: "department_bonus_tied_to_supervisor_satisfaction",
      category: "authority",
      label: "\uBD80\uC11C \uC131\uACFC\uAE09\uC758 \uC77C\uBD80\uAC00 \uC0C1\uC0AC \uB9CC\uC871\uB3C4\uB85C \uACB0\uC815",
      minimum_strength: "medium",
      actor_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      target_options: [
        "player",
        "coworker",
        "manager",
        "employee",
        "company_employee",
        "female_employee",
        "male_employee",
        "business_visitor",
        "assigned_visitor",
        "partner_contact",
        "guest",
        "everyone_in_company",
        "conversation_partner",
        "another_present_person",
        "nearby_person"
      ],
      default_actor: "manager",
      default_target: "company_employee",
      allowed_triggers: [
        "always_on_duty"
      ],
      default_trigger: "always_on_duty",
      allowed_durations: [
        "continuous"
      ],
      default_duration: "continuous",
      required_action: "department_bonus_tied_to_supervisor_satisfaction",
      public_normalization: true,
      persistent: true,
      direct_meaning_tags: [
        "\uC131\uACFC\uAE09",
        "\uC0C1\uC0AC",
        "\uB9CC\uC871\uB3C4",
        "\uBD80\uC11C"
      ],
      content_template: "{actor_topic}\uC5D0 \uB300\uD55C \uB9CC\uC871\uB3C4\uAC00 {target_conj} {trigger_text} {modifier_clause}\uBD80\uC11C \uC131\uACFC\uAE09\uC758 \uC77C\uBD80\uB97C \uACB0\uC815\uD558\uBA70, {duration_text} \uADF8 \uAE30\uC900\uC774 \uC801\uC6A9\uB41C\uB2E4.",
      synergy_ids: [
        "satisfaction_reflected_in_evaluation",
        "player_satisfaction_is_core_staff_evaluation"
      ],
      strength: "medium"
    }
  ],
  sexual_action_contract: {
    resolve_patient_erection: {
      directions: [
        "npc_to_player"
      ],
      actions: [
        "genital_touch"
      ]
    },
    manual_genital_health_check: {
      directions: [
        "npc_to_player"
      ],
      actions: [
        "genital_exposure",
        "genital_touch"
      ]
    },
    stimulate_nipple_sensitivity_check: {
      directions: [
        "npc_to_player"
      ],
      actions: [
        "sexual_touch"
      ]
    },
    relieve_sexual_tension: {
      directions: [
        "npc_to_player"
      ],
      actions: [
        "genital_touch"
      ]
    },
    manual_secretion_collection: {
      directions: [
        "npc_to_player"
      ],
      actions: [
        "genital_touch"
      ]
    },
    public_physiological_relief_contact: {
      directions: [
        "npc_to_player"
      ],
      actions: [
        "genital_touch"
      ]
    },
    treat_player_sexual_request_as_order: {
      directions: [
        "npc_to_player"
      ],
      actions: [
        "kiss",
        "sexual_touch",
        "genital_exposure",
        "genital_touch",
        "oral",
        "penetration"
      ]
    },
    prioritize_player_sexual_relief: {
      directions: [
        "npc_to_player"
      ],
      actions: [
        "kiss",
        "sexual_touch",
        "genital_exposure",
        "genital_touch",
        "oral",
        "penetration"
      ]
    },
    designated_staff_complies_immediately: {
      directions: [
        "npc_to_player"
      ],
      actions: [
        "kiss",
        "sexual_touch",
        "genital_exposure",
        "genital_touch",
        "oral",
        "penetration"
      ]
    },
    perform_designated_position_efficiently: {
      directions: [
        "npc_to_player"
      ],
      actions: [
        "kiss",
        "sexual_touch",
        "genital_exposure",
        "genital_touch",
        "oral",
        "penetration"
      ]
    },
    multi_staff_collaborate_on_request: {
      directions: [
        "npc_to_player"
      ],
      actions: [
        "kiss",
        "sexual_touch",
        "genital_exposure",
        "genital_touch",
        "oral",
        "penetration"
      ]
    },
    sex_with_player_is_duty: {
      directions: [
        "npc_to_player",
        "player_to_npc"
      ],
      actions: [
        "penetration"
      ]
    },
    treat_player_sexual_conduct_as_authority: {
      directions: [
        "player_to_npc"
      ],
      actions: [
        "kiss",
        "sexual_touch",
        "genital_exposure",
        "genital_touch",
        "oral",
        "penetration"
      ]
    },
    stimulate_target_breast_or_nipple_for_sensitivity_check: {
      directions: [
        "npc_to_player",
        "player_to_npc"
      ],
      actions: [
        "sexual_touch"
      ]
    },
    relieve_target_sexual_tension_by_hand: {
      directions: [
        "npc_to_player",
        "player_to_npc"
      ],
      actions: [
        "genital_touch"
      ]
    },
    selected_actor_request_is_official_order_for_target: {
      directions: [
        "npc_to_player",
        "player_to_npc"
      ],
      actions: [
        "kiss",
        "sexual_touch",
        "genital_exposure",
        "genital_touch",
        "oral",
        "penetration"
      ]
    },
    selected_actor_intimate_request_has_priority: {
      directions: [
        "npc_to_player",
        "player_to_npc"
      ],
      actions: [
        "kiss",
        "sexual_touch",
        "genital_exposure",
        "genital_touch",
        "oral",
        "penetration"
      ]
    },
    selected_actor_performs_priority_sexual_relief_for_target: {
      directions: [
        "npc_to_player",
        "player_to_npc"
      ],
      actions: [
        "genital_touch"
      ]
    },
    selected_groups_mutually_assist_sexual_relief: {
      directions: [
        "npc_to_player",
        "player_to_npc"
      ],
      actions: [
        "genital_touch"
      ]
    },
    public_intimate_contact_between_selected_groups_is_routine: {
      directions: [
        "npc_to_player",
        "player_to_npc"
      ],
      actions: [
        "sexual_touch"
      ]
    },
    continue_designated_intimate_contact_until_explicit_end: {
      directions: [
        "npc_to_player",
        "player_to_npc"
      ],
      actions: [
        "sexual_touch"
      ]
    }
  }
};

// content/positions.json
var positions_default = {
  positions: [
    { position_id: "intern", name: "\uC778\uD134", ui_hint: "\uC2E0\uC785 \uAD00\uCC30" },
    { position_id: "assistant_manager", name: "\uB300\uB9AC", ui_hint: "\uC2E4\uBB34 \uC911\uC2EC" },
    { position_id: "tf_lead", name: "TF\uD300\uC7A5", ui_hint: "\uC870\uC728 \uAD8C\uD55C" },
    { position_id: "executive", name: "\uC784\uC6D0", ui_hint: "\uC804\uB7B5 \uAD8C\uD55C" }
  ]
};

// content/body_types.json
var body_types_default = {
  body_types: [
    { body_type_id: "balanced", name: "\uADE0\uD615 \uC7A1\uD78C \uCCB4\uD615" },
    { body_type_id: "muscular", name: "\uADFC\uC721\uC9C8" },
    { body_type_id: "athletic", name: "\uD0C4\uD0C4\uD55C \uCCB4\uD615" },
    { body_type_id: "slender", name: "\uD638\uB9AC\uD638\uB9AC\uD55C \uCCB4\uD615" },
    { body_type_id: "large_frame", name: "\uD070 \uCCB4\uACA9" }
  ]
};

// content/speech_styles.json
var speech_styles_default = {
  speech_styles: [
    { speech_style_id: "polite", name: "\uC815\uC911\uD55C \uC874\uB313\uB9D0" },
    { speech_style_id: "calm", name: "\uCC28\uBD84\uD55C \uB9D0\uD22C" },
    { speech_style_id: "friendly", name: "\uCE5C\uADFC\uD55C \uB9D0\uD22C" },
    { speech_style_id: "playful", name: "\uB2A5\uAE00\uB9DE\uC740 \uB9D0\uD22C" },
    { speech_style_id: "cold", name: "\uB0C9\uC815\uD55C \uB9D0\uD22C" },
    { speech_style_id: "rough_yangachi", name: "\uAC70\uCE5C \uC591\uC544\uCE58 \uB9D0\uD22C" }
  ]
};

// src/api/edition.js
var edition = createEditionAdapter({
  editionId: edition_default.edition_id,
  contentVersion: edition_default.content_version,
  organization: organization_default,
  map: map_default,
  characters: characters_default,
  generalNpcs: general_npcs_default,
  csaPresets: csa_presets_default,
  positions: positions_default,
  bodyTypes: body_types_default,
  speechStyles: speech_styles_default
});
var edition_default2 = edition;

// src/api/http.js
var HttpError = class extends Error {
  static {
    __name(this, "HttpError");
  }
  constructor(status, code, message, retryable = false, issues = null) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
    this.issues = Array.isArray(issues) && issues.length ? issues : null;
  }
};
var corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type"
};
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" }
  });
}
__name(jsonResponse, "jsonResponse");
function ok(data, status = 200) {
  return jsonResponse({ ok: true, data }, status);
}
__name(ok, "ok");
function fail(error) {
  const normalized = error instanceof HttpError ? error : new HttpError(500, "internal_error", "Unexpected server error");
  return jsonResponse({ ok: false, error: { code: normalized.code, message: normalized.message, retryable: normalized.retryable, ...normalized.issues ? { issues: normalized.issues } : {} } }, normalized.status);
}
__name(fail, "fail");
async function readJson(request) {
  try {
    const value = await request.json();
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("not object");
    return value;
  } catch {
    throw new HttpError(400, "invalid_request", "Request body must be a JSON object");
  }
}
__name(readJson, "readJson");
function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new HttpError(400, "invalid_request", `${field} is required`);
  return value;
}
__name(requireString, "requireString");
function optionsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
__name(optionsResponse, "optionsResponse");
function sseEvent(name, data) {
  return `event: ${name}
data: ${JSON.stringify(data)}

`;
}
__name(sseEvent, "sseEvent");
function sseResponse(stream) {
  return new Response(stream, {
    headers: { ...corsHeaders, "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache" }
  });
}
__name(sseResponse, "sseResponse");

// src/api/supabase.js
async function responsePayload(response) {
  const text5 = await response.text();
  if (!text5) return null;
  try {
    return JSON.parse(text5);
  } catch {
    return text5;
  }
}
__name(responsePayload, "responsePayload");
function requireEnv(env, name) {
  const value = env?.[name];
  if (typeof value !== "string" || value === "") throw new HttpError(500, "configuration_error", `${name} is not configured`);
  return value;
}
__name(requireEnv, "requireEnv");
function upstreamError(payload, response) {
  const body = payload !== null && typeof payload === "object" ? payload : null;
  const code = body?.code ?? body?.error?.code;
  const message = body?.message ?? body?.error?.message ?? String(payload ?? "Supabase request failed");
  const mapped = {
    "40001": [409, "turn_conflict", false],
    P0002: [404, "not_found", false],
    "22023": [400, "invalid_request", false],
    "23505": [409, "action_conflict", false]
  }[code];
  if (mapped) return new HttpError(mapped[0], mapped[1], message, mapped[2]);
  if (response.status >= 400 && response.status < 500) return new HttpError(response.status, "supabase_error", message, false);
  return new HttpError(502, "supabase_error", message, true);
}
__name(upstreamError, "upstreamError");
function createSupabaseClient(env, fetchImpl) {
  const baseUrl = requireEnv(env, "SUPABASE_URL").replace(/\/$/, "");
  const secret = requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY");
  const headers = { apikey: secret, authorization: `Bearer ${secret}`, "content-type": "application/json" };
  async function request(url, init) {
    const response = await fetchImpl(url, { ...init, headers: { ...headers, ...init?.headers ?? {} } });
    const payload = await responsePayload(response);
    if (!response.ok) {
      throw upstreamError(payload, response);
    }
    return payload;
  }
  __name(request, "request");
  return {
    callRpc(name, args) {
      return request(`${baseUrl}/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(args) });
    },
    reserveTurnAction(gameId, actionId, expectedTurn, playerAction, structuredAction = null) {
      return this.callRpc("reserve_turn_action", {
        p_game_id: gameId,
        p_action_id: actionId,
        p_expected_turn: expectedTurn,
        p_player_action: playerAction,
        p_structured_action: structuredAction
      });
    },
    async getAction(gameId, actionId) {
      const query = new URLSearchParams({ game_id: `eq.${gameId}`, action_id: `eq.${actionId}`, select: "*" });
      const payload = await request(`${baseUrl}/rest/v1/game_actions?${query}`, { method: "GET" });
      return Array.isArray(payload) ? payload[0] ?? null : payload;
    },
    updateActionStatus(gameId, actionId, status, errorCode = null) {
      const query = new URLSearchParams({ game_id: `eq.${gameId}`, action_id: `eq.${actionId}` });
      return request(`${baseUrl}/rest/v1/game_actions?${query}`, {
        method: "PATCH",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({ processing_status: status, error_code: errorCode })
      });
    },
    /** 태거 적용 결과를 기존 parsed_blocks 컬럼에 조건부 PATCH로 저장한다 (스키마 변경 없음).
     * return=representation으로 실제 갱신된 행 수를 확인한다 — 0행이면 저장 실패로 간주하고
     * 호출부는 로컬 태거 결과를 canonical로 사용하지 않아야 한다. */
    async updateActionParsedBlocks(gameId, actionId, parsedBlocks2) {
      const query = new URLSearchParams({
        game_id: `eq.${gameId}`,
        action_id: `eq.${actionId}`,
        processing_status: "eq.extracting",
        story_text: "not.is.null"
      });
      const rows = await request(`${baseUrl}/rest/v1/game_actions?${query}`, {
        method: "PATCH",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({ parsed_blocks: parsedBlocks2 })
      });
      return Array.isArray(rows) && rows.length > 0;
    },
    /** 태거 호출 전에 시도 상태를 parsed_blocks 안에 영속한다. 1행 갱신이 확인되어야 태거를
     * 호출한다 (멱등성). parsedBlocks는 호출부의 현재 정본(parser 결과)을 통째로 받아
     * speaker_tagging_attempted/status만 추가해 저장한다. */
    async markSpeakerTaggingAttempted(gameId, actionId, parsedBlocks2) {
      const query = new URLSearchParams({
        game_id: `eq.${gameId}`,
        action_id: `eq.${actionId}`,
        processing_status: "eq.extracting",
        story_text: "not.is.null"
      });
      const rows = await request(`${baseUrl}/rest/v1/game_actions?${query}`, {
        method: "PATCH",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({
          parsed_blocks: { ...parsedBlocks2, speaker_tagging_attempted: true, speaker_tagging_status: "in_progress" }
        })
      });
      return Array.isArray(rows) && rows.length > 0;
    },
    /** 태거 시도 결과 상태를 parsed_blocks 안에 기록한다 (applied/unresolved/timeout/invalid_response/upstream_failure). */
    async updateSpeakerTaggingStatus(gameId, actionId, parsedBlocks2, status) {
      const query = new URLSearchParams({
        game_id: `eq.${gameId}`,
        action_id: `eq.${actionId}`,
        processing_status: "eq.extracting",
        story_text: "not.is.null"
      });
      const rows = await request(`${baseUrl}/rest/v1/game_actions?${query}`, {
        method: "PATCH",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({ parsed_blocks: { ...parsedBlocks2, speaker_tagging_status: status } })
      });
      return Array.isArray(rows) && rows.length > 0;
    },
    async claimActionStatus(gameId, actionId, expectedStatus, nextStatus, errorCode, requireEmptyErrorCode = false) {
      const query = new URLSearchParams({ game_id: `eq.${gameId}`, action_id: `eq.${actionId}`, processing_status: `eq.${expectedStatus}` });
      if (requireEmptyErrorCode) query.set("error_code", "is.null");
      const payload = await request(`${baseUrl}/rest/v1/game_actions?${query}`, {
        method: "PATCH",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({ processing_status: nextStatus, error_code: errorCode })
      });
      return Array.isArray(payload) ? payload[0] ?? null : payload;
    },
    /** Read-only, paginated, active-only (record_status=active dedupes revisions to the current one) turn history — no RPC needed, table already carries everything /api/history needs. */
    async listTurns(gameId, { beforeTurn = null, limit = 20 } = {}) {
      const query = new URLSearchParams({
        game_id: `eq.${gameId}`,
        record_status: "eq.active",
        select: "turn_number,player_action,structured_action,feedback_text,story_text,parsed_blocks,turn_summary,mind_monitor,choices,committed_at",
        order: "turn_number.desc",
        limit: String(limit)
      });
      if (Number.isInteger(beforeTurn)) query.set("turn_number", `lt.${beforeTurn}`);
      const payload = await request(`${baseUrl}/rest/v1/game_turns?${query}`, { method: "GET" });
      return Array.isArray(payload) ? payload : [];
    },
    reserveFeedbackRevision(gameId, revisionRequestId, feedbackText) {
      return this.callRpc("reserve_feedback_revision", { p_game_id: gameId, p_revision_request_id: revisionRequestId, p_feedback_text: feedbackText });
    },
    commitFeedbackRevision(gameId, actionId, revisionRequestId, nextSave, turnSummary, mindMonitor, choices2) {
      return this.callRpc("commit_feedback_revision", {
        p_game_id: gameId,
        p_action_id: actionId,
        p_revision_request_id: revisionRequestId,
        p_next_save: nextSave,
        p_turn_summary: turnSummary,
        p_mind_monitor: mindMonitor,
        p_choices: choices2
      });
    },
    /** At most 8 active candidates for one character+pool — image-selector.js scores exactly this set, never the whole catalog. */
    async listImageCandidates(characterId, pool) {
      const query = new URLSearchParams({
        character_id: `eq.${characterId}`,
        active: "eq.true",
        image_pool: `eq.${pool}`,
        select: "image_id,character_id,situation,tags,image_pool,is_sexual,curation_rank,image_url",
        order: "curation_rank.asc.nullslast",
        limit: "8"
      });
      const payload = await request(`${baseUrl}/rest/v1/image_library?${query}`, { method: "GET" });
      return Array.isArray(payload) ? payload : [];
    }
  };
}
__name(createSupabaseClient, "createSupabaseClient");

// src/engine/extract/json-repair.js
function extractBalancedJsonObject(text5) {
  const source = String(text5 ?? "");
  const start = source.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}
__name(extractBalancedJsonObject, "extractBalancedJsonObject");
function stripTrailingCommas(jsonText) {
  const source = String(jsonText ?? "");
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      result += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      result += char;
      continue;
    }
    if (char === ",") {
      let j = i + 1;
      while (j < source.length && /\s/.test(source[j])) j += 1;
      if (source[j] === "}" || source[j] === "]") continue;
    }
    result += char;
  }
  return result;
}
__name(stripTrailingCommas, "stripTrailingCommas");
function repairAndParseExtractJson(rawText) {
  const raw = String(rawText ?? "");
  try {
    return JSON.parse(raw);
  } catch (rawError) {
    const balanced = extractBalancedJsonObject(raw);
    if (balanced) {
      try {
        return JSON.parse(balanced);
      } catch {
      }
      try {
        return JSON.parse(stripTrailingCommas(balanced));
      } catch {
      }
    }
    try {
      return JSON.parse(stripTrailingCommas(raw));
    } catch {
    }
    throw rawError;
  }
}
__name(repairAndParseExtractJson, "repairAndParseExtractJson");

// src/engine/speaker-tagger.js
var TAGGER_SYSTEM = `\uB108\uB294 \uD55C\uAD6D\uC5B4 \uAC8C\uC784 \uC11C\uC0AC\uC758 "\uB300\uC0AC \uD654\uC790 \uD310\uBCC4\uAE30"\uB2E4.
\uC8FC\uC5B4\uC9C4 \uB300\uC0AC \uAC01\uAC01\uC758 \uD654\uC790\uB97C \uBB38\uB9E5\uACFC \uB300\uC0AC \uB0B4\uC6A9\uC73C\uB85C \uD310\uBCC4\uD574\uB77C.

\uD310\uBCC4 \uAE30\uC900:
- \uC9C1\uC804 \uC11C\uC220\uC774 \uD654\uC790\uB97C \uC9C0\uBAA9\uD558\uBA74(\uB9D0\uD588\uB2E4/\uBB3C\uC5C8\uB2E4/\uC785\uC744 \uC5F4\uC5C8\uB2E4/\uACE0\uAC1C\uB97C \uB044\uB355\uC774\uBA70/\uC778\uC0AC\uD558\uBA70 \uB4F1) \uADF8 NPC
- \uB300\uC0AC \uB0B4\uC6A9\uC758 \uD638\uCE6D\uC774 roster\uC758 known_addresses \uC911 \uB204\uAD6C\uC758 \uAC83\uC778\uC9C0\uB85C \uD654\uC790 \uD310\uBCC4 (\uC608: \uD50C\uB808\uC774\uC5B4\uB97C \uBD80\uB974\uB294 \uD638\uCE6D\uC774\uBA74 NPC\uC758 \uBC1C\uD654)
- \uB300\uD654 \uD750\uB984: \uC9C1\uC804 \uB300\uC0AC\uAC00 \uB204\uAD6C\uC600\uB294\uC9C0, \uB204\uAC00 \uB204\uAD6C\uC5D0\uAC8C \uB2F5\uD558\uB294\uC9C0
- \uD654\uC790\uAC00 \uD50C\uB808\uC774\uC5B4\uB85C \uD655\uC2E4\uD560 \uB54C\uB9CC "player"\uB85C \uC9C0\uC815\uD558\uACE0, \uD655\uC2E0\uC774 \uC5C6\uC73C\uBA74 null\uB85C \uD45C\uC2DC\uD55C\uB2E4
  (\uD50C\uB808\uC774\uC5B4\uB85C \uCD94\uC815\uD558\uC9C0 \uC54A\uB294\uB2E4 \u2014 \uBD88\uD655\uC2E4\uD558\uBA74 \uBBF8\uD655\uC815\uC73C\uB85C \uB0A8\uAE34\uB2E4)

\uB85C\uC2A4\uD130 \uC0AC\uC6A9\uBC95:
- \uAC01 \uC778\uBB3C\uC5D0 in_scene \uD544\uB4DC\uAC00 \uC788\uB2E4. in_scene: true\uB294 \uD604\uC7AC \uC7A5\uBA74\uC5D0 \uB4F1\uC7A5\uD558\uB294 \uC778\uBB3C\uC774\uB2E4.
  \uD654\uC790 \uD6C4\uBCF4\uB97C \uACE0\uB97C \uB54C \uD604\uC7AC \uC7A5\uBA74 \uC778\uBB3C(in_scene: true)\uC744 \uC6B0\uC120 \uACE0\uB824\uD558\uB77C.
- scene participants / focal_character_id / last_speaker_id / \uB300\uC0AC\uC5D0 \uC774\uBBF8 \uB4F1\uC7A5\uD55C \uC778\uBB3C\uC774 \uC6B0\uC120\uC21C\uC704\uB2E4.

\uC751\uB2F5\uC740 \uBC18\uB4DC\uC2DC JSON \uD55C \uAC1C\uB9CC:
{"speakers":[{"dialogue_index":0,"speaker_id":"heroine2"},{"dialogue_index":1,"speaker_id":null}]}

speaker_id\uB294 \uBC18\uB4DC\uC2DC \uC81C\uACF5\uB41C roster\uC758 id \uC911\uC5D0\uC11C\uB9CC \uC120\uD0DD\uD558\uACE0, roster\uC5D0 \uC5C6\uB294 \uAC12\uC774\uB098 \uC774\uB984\xB7\uC9C1\uAE09 \uBB38\uC790\uC5F4\uC744 \uBC18\uD658\uD558\uC9C0 \uB9C8\uB77C.
\uBBF8\uD655\uC815\uC740 speaker_id\uB97C null\uB85C \uD45C\uC2DC\uD558\uB77C.`;
function collectUnresolvedDialogue(parsedStory) {
  const blocks = Array.isArray(parsedStory?.blocks) ? parsedStory.blocks : [];
  const items = [];
  let dialogueIndex = 0;
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (block?.type !== "dialogue") continue;
    if (!block.speaker_id) {
      let before = "";
      let after = "";
      for (let j = i - 1; j >= 0; j -= 1) {
        if (blocks[j]?.type === "scene") {
          before = String(blocks[j].text ?? "");
          break;
        }
      }
      for (let j = i + 1; j < blocks.length; j += 1) {
        if (blocks[j]?.type === "scene") {
          after = String(blocks[j].text ?? "");
          break;
        }
      }
      items.push({
        dialogue_index: dialogueIndex,
        order: Number.isInteger(block.order) ? block.order : dialogueIndex,
        text: String(block.text ?? ""),
        context_before: String(before).slice(-200),
        context_after: String(after).slice(0, 200),
        candidate_speaker_ids: []
      });
    }
    dialogueIndex += 1;
  }
  return items;
}
__name(collectUnresolvedDialogue, "collectUnresolvedDialogue");
function allowedSpeakerIds(master) {
  const ids = ["player"];
  for (const character of rosterEntries(master)) {
    const id = character?.character_id ?? character?.npc_id ?? character?.id ?? null;
    if (typeof id === "string" && id) ids.push(id);
  }
  return ids;
}
__name(allowedSpeakerIds, "allowedSpeakerIds");
function rosterEntries(master) {
  const entries2 = [];
  const push = /* @__PURE__ */ __name((character, idField) => {
    const id = character?.[idField] ?? character?.id ?? null;
    const name = typeof character?.name === "string" ? character.name.trim() : "";
    if (!id || !name) return;
    entries2.push({
      id,
      name,
      role_title: character?.role_title ?? character?.role ?? character?.position ?? "",
      position: character?.position ?? "",
      department: character?.department ?? character?.department_name ?? "",
      addresses: addressesFor(character),
      addressing: character?.prompt_card?.addressing ?? ""
    });
  }, "push");
  for (const character of Array.isArray(master?.characters) ? master.characters : []) push(character, "character_id");
  for (const npc of Array.isArray(master?.general_npcs) ? master.general_npcs : []) push(npc, "npc_id");
  return entries2;
}
__name(rosterEntries, "rosterEntries");
function speakerNameMap(master) {
  const map = /* @__PURE__ */ new Map();
  for (const entry of rosterEntries(master)) map.set(entry.id, { id: entry.id, name: entry.name });
  return map;
}
__name(speakerNameMap, "speakerNameMap");
function addressesFor(character) {
  const raw = character?.known_addresses ?? character?.addresses ?? null;
  if (Array.isArray(raw)) return raw.filter((v) => typeof v === "string" && v.trim());
  if (typeof raw === "string" && raw.trim()) return [raw.trim()];
  return [];
}
__name(addressesFor, "addressesFor");
var ROLE_TITLE_TOKENS = ["\uBCF8\uBD80\uC7A5", "\uC2E4\uC7A5", "\uD300\uC7A5", "\uBD80\uC7A5", "\uCC28\uC7A5", "\uACFC\uC7A5", "\uB300\uB9AC", "\uC0AC\uC6D0", "\uC8FC\uC784", "\uC778\uD134", "\uB300\uD45C", "\uBE44\uC11C", "\uC774\uC0AC", "\uC0C1\uBB34", "\uC804\uBB34", "\uD30C\uD2B8\uC7A5"];
function extractRoleToken(roleTitle) {
  if (typeof roleTitle !== "string" || !roleTitle.trim()) return "";
  for (const token of ROLE_TITLE_TOKENS) {
    if (roleTitle.includes(token)) return token;
  }
  return "";
}
__name(extractRoleToken, "extractRoleToken");
function buildKnownAddresses({
  id = "",
  name = "",
  department = "",
  position = "",
  roleTitle = "",
  explicitAddresses = [],
  addressingDescription = "",
  isPlayer = false,
  otherNames = []
} = {}) {
  const out = [];
  const add = /* @__PURE__ */ __name((value) => {
    const t = String(value ?? "").trim();
    if (t && !out.includes(t)) out.push(t);
  }, "add");
  for (const value of Array.isArray(explicitAddresses) ? explicitAddresses : []) add(value);
  const fullName = String(name ?? "").trim();
  const isKorean3 = /^[가-힣]{3}$/.test(fullName);
  const surname = isKorean3 ? fullName[0] : "";
  const alias = isKorean3 ? fullName.slice(1) : "";
  const aliasCollision = Boolean(alias) && otherNames.some((n) => n !== fullName && n.slice(-2) === alias);
  if (isPlayer) {
    const roleNames = [position, roleTitle].map((v) => String(v ?? "").trim()).filter(Boolean);
    for (const roleName of roleNames) {
      add(`${roleName}\uB2D8`);
      if (surname) add(`${surname} ${roleName}\uB2D8`);
      add(`${fullName} ${roleName}\uB2D8`);
    }
    const dept = String(department ?? "").trim();
    if (dept.includes("\uAC10\uC0AC")) {
      add("\uAC10\uC0AC\uB2D8");
      if (surname) add(`${surname} \uAC10\uC0AC\uB2D8`);
      add(`${fullName} \uAC10\uC0AC\uB2D8`);
    }
  } else {
    const roleToken = extractRoleToken(String(roleTitle ?? ""));
    const posToken = String(position ?? "").trim();
    const tokens = [];
    if (roleToken) tokens.push(roleToken);
    if (posToken && !tokens.includes(posToken)) tokens.push(posToken);
    for (const token of tokens) {
      add(`${token}\uB2D8`);
      if (surname) add(`${surname} ${token}\uB2D8`);
      add(`${fullName} ${token}\uB2D8`);
    }
    if (fullName) add(`${fullName} \uC528`);
    if (alias && !aliasCollision) add(`${alias} \uC528`);
  }
  if (typeof addressingDescription === "string" && addressingDescription.trim()) {
    const tokens = addressingDescription.match(/[\p{L}]{1,4}(?:님|씨)/gu) ?? [];
    for (const token of tokens) add(token);
  }
  return out.slice(0, 12);
}
__name(buildKnownAddresses, "buildKnownAddresses");
function buildSceneCandidateIds(parsedStory, {
  sceneParticipants = [],
  focalCharacterId = null,
  lastSpeakerId = null,
  master = null
} = {}) {
  const ids = /* @__PURE__ */ new Set();
  for (const id of sceneParticipants) if (typeof id === "string" && id) ids.add(id);
  if (typeof focalCharacterId === "string" && focalCharacterId) ids.add(focalCharacterId);
  if (typeof lastSpeakerId === "string" && lastSpeakerId) ids.add(lastSpeakerId);
  for (const line of parsedStory?.dialogue_lines ?? []) {
    if (typeof line?.speaker_id === "string" && line.speaker_id) ids.add(line.speaker_id);
  }
  if (master) {
    const entries2 = rosterEntries(master);
    const nameCount = /* @__PURE__ */ new Map();
    for (const entry of entries2) nameCount.set(entry.name, (nameCount.get(entry.name) ?? 0) + 1);
    for (const block of parsedStory?.blocks ?? []) {
      if (block?.type !== "scene") continue;
      const text5 = String(block.text ?? "");
      for (const entry of entries2) {
        if (nameCount.get(entry.name) > 1) continue;
        if (text5.includes(entry.name)) ids.add(entry.id);
      }
    }
  }
  ids.add("player");
  return [...ids];
}
__name(buildSceneCandidateIds, "buildSceneCandidateIds");
function buildTaggingMessages(parsedStory, master, {
  playerName = "\uD50C\uB808\uC774\uC5B4",
  playerInfo = {},
  sceneParticipants = [],
  focalCharacterId = null,
  lastSpeakerId = null
} = {}) {
  const items = collectUnresolvedDialogue(parsedStory);
  if (!items.length) return null;
  const entries2 = rosterEntries(master);
  const byId = new Map(entries2.map((e) => [e.id, e]));
  const allNames = entries2.map((e) => e.name);
  const participantIds = buildSceneCandidateIds(parsedStory, { sceneParticipants, focalCharacterId, lastSpeakerId, master });
  const participantSet = new Set(participantIds);
  const rosterLines = [];
  const seen = /* @__PURE__ */ new Set();
  const pushRoster = /* @__PURE__ */ __name((id, entry, inScene) => {
    if (seen.has(id)) return;
    seen.add(id);
    rosterLines.push(JSON.stringify({
      speaker_id: id,
      name: entry.name,
      role_title: entry.role_title,
      department: entry.department,
      in_scene: inScene,
      known_addresses: entry.addresses
    }));
  }, "pushRoster");
  const playerRoleTitle = typeof playerInfo?.roleTitle === "string" && playerInfo.roleTitle ? playerInfo.roleTitle : typeof playerInfo?.positionName === "string" ? playerInfo.positionName : "";
  const playerAddresses = buildKnownAddresses({
    id: "player",
    name: playerName,
    department: playerInfo?.departmentName ?? "",
    position: playerInfo?.positionName ?? "",
    roleTitle: playerRoleTitle,
    explicitAddresses: playerInfo?.addresses ?? [],
    addressingDescription: playerInfo?.addressingDescription ?? "",
    isPlayer: true
  });
  pushRoster("player", {
    name: playerName,
    role_title: playerRoleTitle,
    department: playerInfo?.departmentName ?? "",
    addresses: playerAddresses
  }, participantSet.has("player"));
  for (const id of participantIds) {
    const entry = byId.get(id);
    if (entry && id !== "player") {
      const addresses = buildKnownAddresses({
        id: entry.id,
        name: entry.name,
        department: entry.department,
        position: entry.position,
        roleTitle: entry.role_title,
        explicitAddresses: entry.addresses,
        addressingDescription: entry.addressing,
        otherNames: allNames
      });
      pushRoster(id, { ...entry, addresses }, true);
    }
  }
  for (const entry of entries2) {
    if (seen.has(entry.id)) continue;
    const addresses = buildKnownAddresses({
      id: entry.id,
      name: entry.name,
      department: entry.department,
      position: entry.position,
      roleTitle: entry.role_title,
      explicitAddresses: entry.addresses,
      addressingDescription: entry.addressing,
      otherNames: allNames
    });
    pushRoster(entry.id, { ...entry, addresses }, participantSet.has(entry.id));
  }
  const lines = items.map(
    (item) => `${item.dialogue_index}. \uBB38\uB9E5 \uC55E: ${item.context_before || "(\uC5C6\uC74C)"} | \uB300\uC0AC: "${item.text}"${item.context_after ? ` | \uBB38\uB9E5 \uB4A4: ${item.context_after}` : ""}`
  ).join("\n");
  return [
    { role: "system", content: TAGGER_SYSTEM },
    {
      role: "user",
      content: `\uD604\uC7AC \uD654\uC790 roster (speaker_id\uB294 \uC774 \uBAA9\uB85D\uC5D0\uC11C\uB9CC \uC120\uD0DD):
${rosterLines.join("\n")}

\uB2E4\uC74C \uB300\uC0AC\uB4E4\uC758 \uD654\uC790\uB97C \uD310\uBCC4\uD574\uB77C. dialogue_index\uB97C \uBC18\uB4DC\uC2DC \uC720\uC9C0\uD574\uB77C.
${lines}`
    }
  ];
}
__name(buildTaggingMessages, "buildTaggingMessages");
function parseTaggingResponse(content, allowlist = []) {
  const stripped = String(content ?? "").trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
  let data;
  try {
    data = JSON.parse(stripped);
  } catch {
    const match = /\{[\s\S]*\}/.exec(stripped);
    if (!match) return [];
    try {
      data = JSON.parse(match[0]);
    } catch {
      return [];
    }
  }
  const list = Array.isArray(data?.speakers) ? data.speakers : [];
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const entry of list) {
    const index = entry?.dialogue_index;
    if (!Number.isInteger(index)) continue;
    if (seen.has(index)) continue;
    seen.add(index);
    const speakerId = entry?.speaker_id;
    if (speakerId === null || speakerId === void 0 || speakerId === "") {
      result.push({ dialogue_index: index, speaker_id: null });
      continue;
    }
    if (typeof speakerId !== "string" || !allowlist.includes(speakerId)) continue;
    result.push({ dialogue_index: index, speaker_id: speakerId });
  }
  return result;
}
__name(parseTaggingResponse, "parseTaggingResponse");
function applyTaggedNamesToRaw(normalizedRaw, blocks) {
  const lines = String(normalizedRaw ?? "").split("\n");
  const dialogues = blocks.filter((b) => b?.type === "dialogue");
  let d = 0;
  const out = [];
  for (const line of lines) {
    if (d >= dialogues.length) {
      out.push(line);
      continue;
    }
    const block = dialogues[d];
    const trimmed = line.trim();
    const m = /^(?:([\p{L}][^\n“”"]{0,40}?)\s*\(([^()\n]{0,80})\)\s*[:：]?\s*)?[“"]([^”"]*)[”"]\s*$/u.exec(trimmed);
    if (m && m[3] === block.text) {
      const name = block.speaker_name || "";
      const direction = block.direction || "\uC790\uC5F0\uC2A4\uB7FD\uAC8C";
      out.push(name ? `${name} (${direction}): \u201C${block.text}\u201D` : `\u201C${block.text}\u201D`);
      d += 1;
    } else if (line.includes(block.text)) {
      out.push(line);
      d += 1;
    } else {
      out.push(line);
    }
  }
  return out.join("\n");
}
__name(applyTaggedNamesToRaw, "applyTaggedNamesToRaw");
function applyTaggedNamesToRawSource(rawStory, blocks) {
  const lines = String(rawStory ?? "").split("\n");
  const dialogues = blocks.filter((b) => b?.type === "dialogue");
  let d = 0;
  const out = [];
  for (const line of lines) {
    if (d >= dialogues.length) {
      out.push(line);
      continue;
    }
    const block = dialogues[d];
    const trimmed = line.trim();
    const quoted = `\u201C${block.text}\u201D`;
    const full = /^[“"]([^”"]*)[”"]\s*$/u.exec(trimmed);
    const withSpeaker = /^[\p{L}][^\n“”"]{0,40}?\s*\([^()\n]{0,80}\)\s*[:：]?\s*[“"]([^”"]*)[”"]\s*$/u.exec(trimmed);
    const matchedText = full?.[1] ?? withSpeaker?.[1];
    if (matchedText !== void 0 && matchedText === block.text) {
      const name = block.speaker_name || "";
      const direction = block.direction || "\uC790\uC5F0\uC2A4\uB7FD\uAC8C";
      out.push(name ? `${name} (${direction}): \u201C${block.text}\u201D` : `\u201C${block.text}\u201D`);
      d += 1;
    } else if (trimmed.includes(quoted) || trimmed.includes(`"${block.text}"`)) {
      out.push(line);
      d += 1;
    } else {
      out.push(line);
    }
  }
  return out.join("\n");
}
__name(applyTaggedNamesToRawSource, "applyTaggedNamesToRawSource");
function applySpeakerTags(parsedStory, tags, master, { playerName = "\uD50C\uB808\uC774\uC5B4", unresolvedItems = [], rawStory = null } = {}) {
  const blocks = Array.isArray(parsedStory?.blocks) ? parsedStory.blocks : [];
  const names = speakerNameMap(master);
  if (playerName) names.set("player", { id: "player", name: playerName });
  const byIndex = /* @__PURE__ */ new Map();
  for (const tag of tags) byIndex.set(tag.dialogue_index, tag);
  const textByIndex = /* @__PURE__ */ new Map();
  for (const item of unresolvedItems) textByIndex.set(item.dialogue_index, item.text);
  const nextBlocks = [];
  const nextDialogueLines = [];
  let applied = 0;
  let rejected = 0;
  let dialogueIndex = 0;
  for (const block of blocks) {
    if (block?.type !== "dialogue") {
      nextBlocks.push(block);
      continue;
    }
    const tag = byIndex.get(dialogueIndex);
    let updated = block;
    if (tag?.speaker_id && !block.speaker_id) {
      const expectedText = textByIndex.get(dialogueIndex);
      if (expectedText === void 0 || expectedText === block.text) {
        const speaker = names.get(tag.speaker_id);
        if (speaker) {
          updated = {
            ...block,
            speaker_id: speaker.id,
            speaker_name: speaker.name,
            speaker: speaker.name
          };
          applied += 1;
        } else {
          rejected += 1;
        }
      } else {
        rejected += 1;
      }
    } else if (tag?.speaker_id) {
      rejected += 1;
    }
    nextBlocks.push(updated);
    if (!updated.speaker_id) {
      nextDialogueLines.push({
        speaker_id: null,
        speaker_name: "",
        direction: updated.direction ?? "\uC790\uC5F0\uC2A4\uB7FD\uAC8C",
        text: updated.text,
        order: updated.order ?? dialogueIndex
      });
    } else {
      nextDialogueLines.push({
        speaker_id: updated.speaker_id,
        speaker_name: updated.speaker_name,
        direction: updated.direction ?? "\uC790\uC5F0\uC2A4\uB7FD\uAC8C",
        text: updated.text,
        order: updated.order ?? dialogueIndex
      });
    }
    dialogueIndex += 1;
  }
  const normalizedRaw = rawStory ? applyTaggedNamesToRawSource(rawStory, nextBlocks) : applyTaggedNamesToRaw(parsedStory?.normalized_raw, nextBlocks);
  const extractRaw = applyTaggedNamesToRaw(parsedStory?.normalized_raw, nextBlocks);
  return {
    parsedStory: {
      ...parsedStory,
      blocks: nextBlocks,
      dialogue_lines: nextDialogueLines,
      normalized_raw: normalizedRaw,
      normalized_raw_extract: extractRaw,
      tagged: applied > 0,
      speaker_tagging_status: applied > 0 ? "applied" : "unresolved"
    },
    changed: applied > 0,
    appliedCount: applied,
    rejectedCount: rejected
  };
}
__name(applySpeakerTags, "applySpeakerTags");

// src/api/llm.js
var EXTRACT_TIMEOUT_MS = 75e3;
function requireEnv2(env, name) {
  const value = env?.[name];
  if (typeof value !== "string" || value === "") throw new HttpError(500, "configuration_error", `${name} is not configured`);
  return value;
}
__name(requireEnv2, "requireEnv");
function completionUrl(env) {
  const base = requireEnv2(env, "LLM_API_URL").replace(/\/$/, "");
  return base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
}
__name(completionUrl, "completionUrl");
async function postCompletion(env, fetchImpl, body, { signal } = {}) {
  let response;
  try {
    response = await fetchImpl(completionUrl(env), {
      method: "POST",
      headers: { authorization: `Bearer ${requireEnv2(env, "LLM_API_KEY")}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      ...signal ? { signal } : {}
    });
  } catch (error) {
    if (error?.name === "AbortError" || error?.name === "TimeoutError") {
      throw new HttpError(504, "extract_timeout", "LLM upstream request timed out", true);
    }
    throw new HttpError(502, "llm_upstream_failure", "LLM upstream request failed", true);
  }
  if (!response.ok) throw new HttpError(502, "llm_upstream_failure", "LLM upstream request failed", true);
  return response;
}
__name(postCompletion, "postCompletion");
async function* parseOpenAiSse(body, timing, startedAt, { signal, onFirstContent, onClose } = {}) {
  if (!body) throw new HttpError(502, "story_incomplete", "Story stream has no body", true);
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;
  let characterCount = 0;
  try {
    while (true) {
      const { value, done: readerDone } = await reader.read();
      if (readerDone) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") {
          done = true;
          continue;
        }
        try {
          const payload = JSON.parse(data);
          const text5 = payload.choices?.[0]?.delta?.content;
          if (typeof text5 === "string" && text5) {
            if (timing && timing.story_first_content_ms === void 0) timing.story_first_content_ms = Date.now() - startedAt;
            onFirstContent?.();
            characterCount += text5.length;
            yield text5;
          }
        } catch {
          throw new HttpError(502, "story_invalid_sse", "Story SSE payload is invalid", true);
        }
      }
    }
  } catch (error) {
    if (error?.name === "AbortError" || signal?.aborted) {
      throw new HttpError(408, "story_timeout", "Story upstream timed out waiting for content", true);
    }
    throw new HttpError(502, "story_invalid_sse", "Story SSE payload is invalid", true);
  } finally {
    onClose?.();
  }
  if (timing) {
    timing.story_network_total_ms = Date.now() - startedAt;
    timing.story_character_count = characterCount;
  }
  if (!done) throw new HttpError(502, "story_incomplete", "Story stream ended before [DONE]", true);
}
__name(parseOpenAiSse, "parseOpenAiSse");
var STORY_FIRST_CONTENT_TIMEOUT_MS = 3e4;
var STORY_TOTAL_TIMEOUT_MS = 12e4;
async function streamStory({ env, fetchImpl, messages, timing = {} }) {
  const startedAt = Date.now();
  const finalMessages = appendLateAuthoritativeCharacterCanon(messages);
  const controller = new AbortController();
  const firstContentTimer = setTimeout(() => controller.abort(new Error("story-first-content-timeout")), STORY_FIRST_CONTENT_TIMEOUT_MS);
  const totalTimer = setTimeout(() => controller.abort(new Error("story-total-timeout")), STORY_TOTAL_TIMEOUT_MS);
  const clearTimers = /* @__PURE__ */ __name(() => {
    clearTimeout(firstContentTimer);
    clearTimeout(totalTimer);
  }, "clearTimers");
  let response;
  try {
    response = await postCompletion(env, fetchImpl, {
      model: requireEnv2(env, "STORY_MODEL"),
      messages: finalMessages,
      stream: true,
      thinking: { type: "disabled" },
      max_tokens: 5e3
    }, { signal: controller.signal });
  } catch (error) {
    clearTimers();
    if (error instanceof HttpError) throw error;
    throw new HttpError(408, "story_timeout", "Story upstream did not produce content in time", true);
  }
  timing.story_headers_ms = Date.now() - startedAt;
  return {
    chunks: parseOpenAiSse(response.body, timing, startedAt, {
      signal: controller.signal,
      onFirstContent: /* @__PURE__ */ __name(() => clearTimeout(firstContentTimer), "onFirstContent"),
      onClose: clearTimers
    }),
    timing
  };
}
__name(streamStory, "streamStory");
function parseExtractContent(content) {
  const stripped = String(content ?? "").trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  try {
    return repairAndParseExtractJson(stripped);
  } catch {
    throw new HttpError(502, "extract_invalid_json", "Extract response is not valid JSON", true);
  }
}
__name(parseExtractContent, "parseExtractContent");
async function runSpeakerTagging({ env, fetchImpl, messages, allowlist = [], timeoutMs = 1e4 }) {
  const signal = typeof AbortSignal?.timeout === "function" ? AbortSignal.timeout(timeoutMs) : void 0;
  let response;
  try {
    response = await postCompletion(env, fetchImpl, {
      model: requireEnv2(env, "EXTRACT_MODEL"),
      messages,
      stream: false,
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      max_tokens: 400
    }, { signal });
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.code === "extract_timeout") return { speakers: [], warning: "speaker_tagging_timeout" };
      if (error.code === "llm_upstream_failure") return { speakers: [], warning: "speaker_tagging_upstream_failure" };
    }
    throw error;
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    return { speakers: [], warning: "speaker_tagging_invalid_json" };
  }
  const choice = payload?.choices?.[0];
  if (!choice || choice.finish_reason === "length") {
    return { speakers: [], warning: choice?.finish_reason === "length" ? "speaker_tagging_truncated" : "speaker_tagging_invalid_json" };
  }
  const content = choice?.message?.content;
  const speakers = parseTaggingResponse(content, allowlist);
  let warning = null;
  if (!speakers.length) {
    const stripped = String(content ?? "").trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    let validJson = false;
    try {
      validJson = Array.isArray(JSON.parse(stripped)?.speakers);
    } catch {
      validJson = false;
    }
    if (!validJson) warning = "speaker_tagging_invalid_json";
  }
  return { speakers, warning };
}
__name(runSpeakerTagging, "runSpeakerTagging");
async function runExtract({ env, fetchImpl, messages }) {
  const signal = typeof AbortSignal?.timeout === "function" ? AbortSignal.timeout(EXTRACT_TIMEOUT_MS) : void 0;
  const response = await postCompletion(env, fetchImpl, {
    model: requireEnv2(env, "EXTRACT_MODEL"),
    messages,
    stream: false,
    thinking: { type: "disabled" },
    response_format: { type: "json_object" },
    max_tokens: 5e3
  }, { signal });
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new HttpError(502, "extract_invalid_json", "Extract upstream response is not JSON", true);
  }
  const choice = payload.choices?.[0];
  if (choice?.finish_reason === "length") throw new HttpError(502, "extract_truncated", "Extract response exceeded its output limit", true);
  return parseExtractContent(choice?.message?.content);
}
__name(runExtract, "runExtract");

// src/engine/scene-cast.js
function isPlainObject16(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject16, "isPlainObject");
function identity4(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
__name(identity4, "identity");
function isPlayerRefId2(id) {
  if (!id) return false;
  const text5 = String(id);
  return text5 === "player" || /^player([-_]|$)/.test(text5);
}
__name(isPlayerRefId2, "isPlayerRefId");
function registeredNpcIdSet(master) {
  const ids = /* @__PURE__ */ new Set();
  for (const entry of Array.isArray(master?.characters) ? master.characters : []) {
    const id = identity4(entry?.character_id ?? entry?.id);
    if (id) ids.add(id);
  }
  for (const entry of Array.isArray(master?.general_npcs) ? master.general_npcs : []) {
    const id = identity4(entry?.npc_id ?? entry?.id);
    if (id) ids.add(id);
  }
  return ids;
}
__name(registeredNpcIdSet, "registeredNpcIdSet");
function speakerNameById(master, playerName) {
  const names = /* @__PURE__ */ new Map();
  for (const entry of Array.isArray(master?.characters) ? master.characters : []) {
    const id = identity4(entry?.character_id ?? entry?.id);
    const name = identity4(entry?.name);
    if (id && name) names.set(id, name);
  }
  for (const entry of Array.isArray(master?.general_npcs) ? master.general_npcs : []) {
    const id = identity4(entry?.npc_id ?? entry?.id);
    const name = identity4(entry?.name);
    if (id && name) names.set(id, name);
  }
  const resolvedPlayerName = identity4(playerName);
  if (resolvedPlayerName) names.set("player", resolvedPlayerName);
  return names;
}
__name(speakerNameById, "speakerNameById");
var QUOTED_SPEECH = /["“”']([^"“”']{2,})["“”']|「([^」]{2,})」/u;
var SPEECH_ACT = /(말한다|말했다|묻는다|물었다|질문한다|질문했다|전한다|전했다|설명한다|설명했다|지시한다|지시했다|요청한다|요청했다|부른다|불렀다|답한다|답했다|대답한다|대답했다|이야기한다|얘기한다|따진다|따졌다|항의한다|사과한다|제안한다|보고한다|확인을?\s*요청)/u;
var HIGH_IMPACT_INTENTS = [
  "instruction",
  "promise",
  "agreement",
  "confession",
  "sexual_proposal",
  "threat",
  "movement_decision",
  "investigation_decision",
  "relationship_change",
  "authority_assertion"
];
var INTENT_PATTERNS = {
  // 명령형 어미 + 직접 명령어 (단독 '와'/'가'는 오탐 위험이 커 제외, 문맥 명령형 어미로만)
  instruction: /(해라|하세요|해야 해|당장|따라\b|벗어|제출해|다시 작성해|내려와|앉아\b|해줘|해 주세요|시키지 마|하지 마|그만둬|꺼져|가져와|보여줘|따라와|움직여|불러와|보내드려|작성하세요)/u,
  promise: /(약속할게|약속해|내가 책임질게|책임질게요|반드시 해줄게|앞으로 계속|다시는 안|꼭 해줄게|지켜줄게)/u,
  sexual_proposal: null,
  // classifyMaterialActions로 판정 (canonical 재사용)
  threat: /(가만두지 않겠다|불이익|해고|인사 조치|후회하게|말 안 들으면|죽을 줄 알아|책임져)/u,
  movement_decision: /(찾아가자|이동하자|바로 가자|따라가자|지금 가자|향하자|찾으러 가자)/u,
  investigation_decision: /(조사하겠다|뒤를 캐자|직접 확인하겠다|캐보자|파보자|알아보자|추적하자)/u,
  confession: /(좋아해|사랑해|고백할게|마음에 들어)/u,
  relationship_change: /(사귀자|헤어지자|연인|만나보자|헤어지고 싶|이별)/u,
  agreement: /(그렇게 하죠|좋아요|동의해|알겠습니다|그래요|그럴게요|승낙)/u,
  refusal: /(싫어|안 해|못 하겠|거절|안 돼|싫습니다)/u,
  authority_assertion: /(내가 책임|내 명령|따르|지시|내가 결정|내가 정할게|내가 하겠다)/u,
  question: /(\?|왜|뭐|누구|언제|어디|어떻게|인가요|인지|인가\b|물어보|확인해 주|알려줘|가르쳐줘|무슨)/u,
  request: /(주세요|부탁|해줄래|해주시|보내주세요|주시겠|부탁드려|요청)/u,
  answer: /(네\b|그래요|맞아요|그렇죠|알겠어요|네, |네\.)/u
};
function classifyDialogueIntents(text5) {
  const source = typeof text5 === "string" ? text5.trim() : "";
  if (!source) return [];
  const intents = /* @__PURE__ */ new Set();
  for (const [name, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern && pattern.test(source)) intents.add(name);
  }
  if (hasMaterialSexualIntent(source)) intents.add("sexual_proposal");
  if (intents.size === 0) intents.add("reaction");
  return [...intents];
}
__name(classifyDialogueIntents, "classifyDialogueIntents");
function hasMaterialSexualIntent(text5) {
  try {
    const { classifyMaterialActions: classifyMaterialActions3 } = globalThis.__companyV2MaterialClassifier ?? {};
    if (typeof classifyMaterialActions3 === "function") {
      return classifyMaterialActions3(text5).length > 0;
    }
  } catch {
  }
  return /(자자|호텔로|벗어|키스하자|만져도 돼|몸을 보여줘|같이 씻자|성관계|섹스)/u.test(text5);
}
__name(hasMaterialSexualIntent, "hasMaterialSexualIntent");
function wireMaterialClassifier(classifier) {
  globalThis.__companyV2MaterialClassifier = { classifyMaterialActions: classifier };
}
__name(wireMaterialClassifier, "wireMaterialClassifier");
function registeredTargetNames(master) {
  const entries2 = [];
  const push = /* @__PURE__ */ __name((id, name) => {
    const cleanId = identity4(id);
    const cleanName = identity4(name);
    if (cleanId && cleanName && !entries2.some((e) => e.id === cleanId)) {
      entries2.push({ id: cleanId, name: cleanName });
    }
  }, "push");
  for (const entry of Array.isArray(master?.characters) ? master.characters : []) {
    push(entry?.character_id ?? entry?.id, entry?.name);
  }
  for (const entry of Array.isArray(master?.general_npcs) ? master.general_npcs : []) {
    push(entry?.npc_id ?? entry?.id, entry?.name);
  }
  return entries2;
}
__name(registeredTargetNames, "registeredTargetNames");
function resolvePlayerDialoguePolicy(playerAction, master = null) {
  const source = typeof playerAction === "string" ? playerAction.trim() : "";
  const base = { max_lines: 1, max_characters: 30, allowed_material_actions: [] };
  const targetIds = resolveUserMentionedNpcIds(master, source);
  const allRegistered = registeredTargetNames(master);
  const targetNames = allRegistered.filter((e) => targetIds.includes(e.id)).map((e) => e.name);
  if (!source) return { mode: "minor_reaction", ...base, allowed_intents: ["reaction"], allowed_target_ids: [], allowed_target_names: [], registered_target_names: allRegistered, explicit_source_text: null, high_impact_intents_allowed: [] };
  const quoted = QUOTED_SPEECH.exec(source);
  const quotedText = quoted ? identity4(quoted[1] ?? quoted[2]) : null;
  if (quotedText) {
    const quotedIntents = classifyDialogueIntents(quotedText);
    return {
      mode: "explicit",
      max_lines: 2,
      explicit_source_text: quotedText,
      allowed_intents: quotedIntents.length ? quotedIntents : ["reaction"],
      allowed_target_ids: targetIds,
      allowed_target_names: targetNames,
      registered_target_names: allRegistered,
      allowed_material_actions: materialActionsOf(quotedText),
      high_impact_intents_allowed: quotedIntents.filter((i) => HIGH_IMPACT_INTENTS.includes(i))
    };
  }
  if (SPEECH_ACT.test(source)) {
    const intentText = source.slice(0, 200);
    const allowed = [];
    if (/(묻|물어|질문)/.test(intentText)) allowed.push("question");
    if (/(전|설명|보고|이야기|알려)/.test(intentText)) allowed.push("answer");
    if (/(요청|부탁|보내|전달)/.test(intentText)) allowed.push("request");
    if (/(지시|명령)/.test(intentText)) allowed.push("instruction");
    if (/(사과)/.test(intentText)) allowed.push("answer");
    if (/(제안)/.test(intentText)) allowed.push("request");
    return {
      mode: "paraphrase",
      max_lines: 2,
      intent_text: intentText,
      allowed_intents: allowed.length ? allowed : ["reaction"],
      allowed_target_ids: targetIds,
      allowed_target_names: targetNames,
      registered_target_names: allRegistered,
      allowed_material_actions: materialActionsOf(intentText),
      high_impact_intents_allowed: []
    };
  }
  return {
    mode: "minor_reaction",
    ...base,
    allowed_intents: ["reaction"],
    allowed_target_ids: targetIds,
    allowed_target_names: targetNames,
    registered_target_names: allRegistered,
    explicit_source_text: null,
    high_impact_intents_allowed: []
  };
}
__name(resolvePlayerDialoguePolicy, "resolvePlayerDialoguePolicy");
function materialActionsOf(text5) {
  try {
    const { classifyMaterialActions: classifyMaterialActions3 } = globalThis.__companyV2MaterialClassifier ?? {};
    if (typeof classifyMaterialActions3 === "function") return classifyMaterialActions3(text5);
  } catch {
  }
  return [];
}
__name(materialActionsOf, "materialActionsOf");
function validatePlayerDialogueAgainstPolicy(text5, policy) {
  const body = typeof text5 === "string" ? text5.trim() : "";
  if (!body || !policy) return { ok: false };
  const intents = classifyDialogueIntents(body);
  const highImpact = intents.filter((i) => HIGH_IMPACT_INTENTS.includes(i));
  if (policy.mode === "minor_reaction") {
    if (highImpact.length) return { ok: false, reason: `high_impact:${highImpact.join(",")}` };
    return { ok: true };
  }
  if (policy.mode === "explicit") {
    const source = policy.explicit_source_text ?? "";
    const sourceIntents = new Set(classifyDialogueIntents(source));
    const newHighImpact = highImpact.filter((i) => !sourceIntents.has(i));
    if (newHighImpact.length) return { ok: false, reason: `new_high_impact:${newHighImpact.join(",")}` };
    const unknownTarget = findUnknownNpcName(body, policy);
    if (unknownTarget) return { ok: false, reason: `new_npc_target:${unknownTarget}` };
    const allowedMaterial = new Set(policy.allowed_material_actions ?? []);
    const newMaterial = materialActionsOf(body).filter((a) => !allowedMaterial.has(a));
    if (newMaterial.length) return { ok: false, reason: `new_material:${newMaterial.join(",")}` };
    if (source && body.length > source.length * 3 + 40) return { ok: false, reason: "over_expansion" };
    return { ok: true };
  }
  if (policy.mode === "paraphrase") {
    const allowedIntents = new Set(policy.allowed_intents ?? []);
    const unexpected = intents.filter((i) => !allowedIntents.has(i));
    if (unexpected.length) return { ok: false, reason: `intent_out_of_scope:${unexpected.join(",")}` };
    const unknownTarget = findUnknownNpcName(body, policy);
    if (unknownTarget) return { ok: false, reason: `new_npc_target:${unknownTarget}` };
    const allowedMaterial = new Set(policy.allowed_material_actions ?? []);
    const newMaterial = materialActionsOf(body).filter((a) => !allowedMaterial.has(a));
    if (newMaterial.length) return { ok: false, reason: `new_material:${newMaterial.join(",")}` };
    return { ok: true };
  }
  return { ok: true };
}
__name(validatePlayerDialogueAgainstPolicy, "validatePlayerDialogueAgainstPolicy");
function findUnknownNpcName(generatedText, policy) {
  const text5 = typeof generatedText === "string" ? generatedText : "";
  const allowedIds = new Set(policy.allowed_target_ids ?? []);
  const registered = Array.isArray(policy.registered_target_names) ? policy.registered_target_names : [];
  for (const entry of registered) {
    if (!entry?.name || !text5.includes(entry.name)) continue;
    if (!allowedIds.has(entry.id)) return entry.name;
  }
  return null;
}
__name(findUnknownNpcName, "findUnknownNpcName");
function resolveUserMentionedNpcIds(master, text5, options = {}) {
  const source = typeof text5 === "string" ? text5 : "";
  if (!source.trim()) return [];
  const allowUnique = options.allowUniqueKoreanGivenName !== false;
  const entries2 = [];
  const push = /* @__PURE__ */ __name((id, name) => {
    const cleanId = identity4(id);
    const cleanName = identity4(name);
    if (cleanId && cleanName && !entries2.some((e) => e.id === cleanId)) {
      entries2.push({ id: cleanId, name: cleanName });
    }
  }, "push");
  for (const entry of Array.isArray(master?.characters) ? master.characters : []) {
    push(entry?.character_id ?? entry?.id, entry?.name);
  }
  for (const entry of Array.isArray(master?.general_npcs) ? master.general_npcs : []) {
    push(entry?.npc_id ?? entry?.id, entry?.name);
  }
  const found = [];
  for (const entry of entries2) {
    if (source.includes(entry.name) && !found.includes(entry.id)) found.push(entry.id);
  }
  if (found.length) return found;
  if (allowUnique) {
    const candidates = entries2.filter((e) => /^[가-힣]{3}$/.test(e.name));
    const givenNameCounts = /* @__PURE__ */ new Map();
    for (const entry of candidates) {
      const given = entry.name.slice(1);
      givenNameCounts.set(given, (givenNameCounts.get(given) ?? 0) + 1);
    }
    const uniqueGiven = /* @__PURE__ */ new Map();
    for (const entry of candidates) {
      const given = entry.name.slice(1);
      if (givenNameCounts.get(given) === 1) uniqueGiven.set(given, entry.id);
    }
    for (const [given, id] of uniqueGiven) {
      if (source.includes(given) && !found.includes(id)) found.push(id);
    }
  }
  return found;
}
__name(resolveUserMentionedNpcIds, "resolveUserMentionedNpcIds");
function isNpcPresentAtCurrentScene({
  id,
  participants = [],
  sceneLocationId = null,
  npcSceneState = {}
}) {
  const state = npcSceneState[id];
  if (state?.present === false) return false;
  if (!Array.isArray(participants) || !participants.includes(id)) return false;
  const npcLocationId = typeof state?.location_id === "string" ? state.location_id : null;
  if (sceneLocationId && npcLocationId && sceneLocationId !== npcLocationId) return false;
  return true;
}
__name(isNpcPresentAtCurrentScene, "isNpcPresentAtCurrentScene");
function charactersMapOf(master) {
  const map = {};
  for (const entry of Array.isArray(master?.characters) ? master.characters : []) {
    const id = identity4(entry?.character_id ?? entry?.id);
    if (id) map[id] = entry;
  }
  return map;
}
__name(charactersMapOf, "charactersMapOf");
function generalNpcProfilesOf(master) {
  const map = {};
  for (const entry of Array.isArray(master?.general_npcs) ? master.general_npcs : []) {
    const id = identity4(entry?.npc_id ?? entry?.id);
    if (id) map[id] = entry;
  }
  return map;
}
__name(generalNpcProfilesOf, "generalNpcProfilesOf");
function resolveNpcLocationId({ save, npcId, charactersMap = {}, generalNpcProfiles = {}, mapLocations = [] }) {
  const stored = identity4(save?.npc_scene_state?.[npcId]?.location_id);
  if (stored) return stored;
  const fromCharacter = identity4(charactersMap?.[npcId]?.default_location_id);
  if (fromCharacter) return fromCharacter;
  const fromProfile = identity4(generalNpcProfiles?.[npcId]?.default_location_id);
  if (fromProfile) return fromProfile;
  for (const location of Array.isArray(mapLocations) ? mapLocations : []) {
    const ids = Array.isArray(location?.default_npc_ids) ? location.default_npc_ids : [];
    if (ids.includes(npcId)) return identity4(location.location_id);
  }
  return null;
}
__name(resolveNpcLocationId, "resolveNpcLocationId");
function resolvePresentNpcIds({ save, registeredIds }) {
  const present = [];
  const push = /* @__PURE__ */ __name((id) => {
    if (!id || isPlayerRefId2(id) || !registeredIds.has(id) || present.includes(id)) return;
    present.push(id);
  }, "push");
  const sceneState = isPlainObject16(save?.scene_state) ? save.scene_state : {};
  const locationId = identity4(sceneState.location_id);
  const npcSceneState = isPlainObject16(save?.npc_scene_state) ? save.npc_scene_state : {};
  const participants = Array.isArray(sceneState.participants) ? sceneState.participants : [];
  for (const id of registeredIds) {
    if (isNpcPresentAtCurrentScene({ id, participants, sceneLocationId: locationId, npcSceneState })) {
      push(id);
    }
  }
  return present;
}
__name(resolvePresentNpcIds, "resolvePresentNpcIds");
var CALL_ACTION = /(부른다|불렀다|호출한다|호출했다|오라고|오라 한다|불러온다|불러서|소환한다|이쪽으로)/u;
var TALK_INTENT = /(인사|말을?\s*걸|말한다|말했다|말하고|묻는다|물어보|물었다|질문|대화|얘기|이야기|불러세우|안녕|반갑|어떻게\s*지내|잘\s*지냈|\?|["“”'].{1,}["“”'])/u;
function hasTalkIntent(playerAction) {
  const source = typeof playerAction === "string" ? playerAction.trim() : "";
  return Boolean(source) && TALK_INTENT.test(source);
}
__name(hasTalkIntent, "hasTalkIntent");
var MOVE_ACTION = /(찾으러|찾아가|찾아간|찾아보|찾아본|보러|만나러|이동하|이동한|가본다|가겠다|방문하|방문한|들어간다|향한다|자리로|사무실로|팀으로)/u;
function resolveDestinationLocationId({ playerAction, mapLocations, currentLocationId }) {
  const source = typeof playerAction === "string" ? playerAction : "";
  if (!source || !MOVE_ACTION.test(source)) return null;
  let best = null;
  for (const location of Array.isArray(mapLocations) ? mapLocations : []) {
    const id = identity4(location?.location_id);
    if (!id) continue;
    const names = [location?.name, ...Array.isArray(location?.aliases) ? location.aliases : []];
    for (const name of names) {
      const trimmed = identity4(name);
      if (!trimmed || !source.includes(trimmed)) continue;
      if (!best || trimmed.length > best.name.length) best = { id, name: trimmed };
    }
  }
  if (!best || best.id === identity4(currentLocationId)) return null;
  return best.id;
}
__name(resolveDestinationLocationId, "resolveDestinationLocationId");
var REMOTE_ACTION = /(전화|통화|메신저|메시지|문자|사내망|카톡|연락한다|연락했다|콜한다)/u;
function resolveEnteringNpcIds({ save, master, playerAction, registeredIds, presentIds, structuredAction }) {
  const entering = [];
  const push = /* @__PURE__ */ __name((id) => {
    if (!id || isPlayerRefId2(id) || !registeredIds.has(id)) return;
    if (presentIds.includes(id) || entering.includes(id)) return;
    entering.push(id);
  }, "push");
  const source = typeof playerAction === "string" ? playerAction : "";
  if (CALL_ACTION.test(source) && !MOVE_ACTION.test(source)) {
    for (const id of resolveUserMentionedNpcIds(master, source)) push(id);
  }
  for (const item of Array.isArray(save?.pending_scene_entrances) ? save.pending_scene_entrances : []) {
    push(identity4(isPlainObject16(item) ? item.character_id ?? item.npc_id : item));
  }
  return entering;
}
__name(resolveEnteringNpcIds, "resolveEnteringNpcIds");
function resolveDestinationNpcIds({ save, master, playerAction, registeredIds }) {
  const destination = [];
  const push = /* @__PURE__ */ __name((id) => {
    if (!id || isPlayerRefId2(id) || !registeredIds.has(id)) return;
    if (destination.includes(id)) return;
    destination.push(id);
  }, "push");
  const source = typeof playerAction === "string" ? playerAction : "";
  if (MOVE_ACTION.test(source) && !CALL_ACTION.test(source)) {
    for (const id of resolveUserMentionedNpcIds(master, source)) push(id);
  }
  return destination;
}
__name(resolveDestinationNpcIds, "resolveDestinationNpcIds");
function resolveRemoteNpcIds({ save, master, playerAction, registeredIds, presentIds, enteringIds }) {
  const remote = [];
  const push = /* @__PURE__ */ __name((id) => {
    if (!id || isPlayerRefId2(id) || !registeredIds.has(id)) return;
    if (presentIds.includes(id) || enteringIds.includes(id) || remote.includes(id)) return;
    remote.push(id);
  }, "push");
  const source = typeof playerAction === "string" ? playerAction : "";
  if (REMOTE_ACTION.test(source)) {
    for (const id of resolveUserMentionedNpcIds(master, source)) push(id);
  }
  for (const item of Array.isArray(save?.pending_remote_contacts) ? save.pending_remote_contacts : []) {
    push(identity4(isPlainObject16(item) ? item.character_id ?? item.npc_id : item));
  }
  return remote;
}
__name(resolveRemoteNpcIds, "resolveRemoteNpcIds");
function buildSceneCastContract({
  save = {},
  master = {},
  playerAction = "",
  structuredAction = null,
  actionContract = null,
  mapLocations = []
} = {}) {
  const registeredIds = registeredNpcIdSet(master);
  const sceneState = isPlainObject16(save?.scene_state) ? save.scene_state : {};
  const locationId = identity4(sceneState.location_id);
  const presentNpcIds = resolvePresentNpcIds({ save, registeredIds });
  const enteringNpcIds = resolveEnteringNpcIds({
    save,
    master,
    playerAction,
    registeredIds,
    presentIds: presentNpcIds,
    structuredAction
  });
  const destinationNpcIds = resolveDestinationNpcIds({
    save,
    master,
    playerAction,
    registeredIds
  });
  const remoteNpcIds = resolveRemoteNpcIds({
    save,
    master,
    playerAction,
    registeredIds,
    presentIds: presentNpcIds,
    enteringIds: enteringNpcIds
  });
  const explicitDestinationLocationId = resolveDestinationLocationId({
    playerAction,
    mapLocations,
    currentLocationId: locationId
  });
  const transitionMode = destinationNpcIds.length || explicitDestinationLocationId ? "movement" : "stationary";
  const isMovementTurn = transitionMode === "movement";
  const wantsTalkOnArrival = hasTalkIntent(playerAction);
  const arrivalSpeakers = isMovementTurn && wantsTalkOnArrival ? destinationNpcIds : [];
  const effectivePresent = isMovementTurn ? arrivalSpeakers : presentNpcIds;
  const effectiveEntering = isMovementTurn ? [] : enteringNpcIds;
  const npcSceneState = isPlainObject16(save?.npc_scene_state) ? save.npc_scene_state : {};
  const destinationNpcState = isMovementTurn && destinationNpcIds.length === 1 ? npcSceneState[destinationNpcIds[0]] : null;
  const destinationLocationId = !isMovementTurn ? null : explicitDestinationLocationId ?? (destinationNpcIds.length === 1 ? identity4(destinationNpcState?.location_id) ?? resolveNpcLocationId({
    save,
    npcId: destinationNpcIds[0],
    charactersMap: charactersMapOf(master),
    generalNpcProfiles: generalNpcProfilesOf(master),
    mapLocations
  }) : null);
  const destinationSceneId = !isMovementTurn ? null : !explicitDestinationLocationId && destinationNpcIds.length === 1 ? identity4(destinationNpcState?.scene_id) ?? destinationLocationId : destinationLocationId;
  const contextNpcIds = [];
  const pushContext = /* @__PURE__ */ __name((id) => {
    if (!id || isPlayerRefId2(id) || !registeredIds.has(id) || contextNpcIds.includes(id)) return;
    contextNpcIds.push(id);
  }, "pushContext");
  for (const id of presentNpcIds) pushContext(id);
  for (const id of enteringNpcIds) pushContext(id);
  for (const id of destinationNpcIds) pushContext(id);
  for (const id of remoteNpcIds) pushContext(id);
  const boundaryPending = isPlainObject16(save?.pending_boundary_followup) ? save.pending_boundary_followup : null;
  if (boundaryPending) pushContext(identity4(boundaryPending.target_character_id));
  pushContext(identity4(save?.focal_character_id));
  pushContext(identity4(save?.last_speaker_id));
  for (const id of Array.isArray(save?.last_npcs_present) ? save.last_npcs_present : []) pushContext(id);
  const allowedSpeakerIds2 = ["player", ...effectivePresent, ...effectiveEntering, ...remoteNpcIds];
  return {
    version: 1,
    transition_mode: transitionMode,
    location_id: locationId,
    context_npc_ids: contextNpcIds,
    present_npc_ids: effectivePresent,
    entering_npc_ids: effectiveEntering,
    destination_npc_ids: destinationNpcIds,
    destination_location_id: destinationLocationId,
    destination_scene_id: destinationSceneId,
    remote_npc_ids: remoteNpcIds,
    allowed_speaker_ids: allowedSpeakerIds2,
    player_dialogue: resolvePlayerDialoguePolicy(playerAction, master),
    anonymous_speech_allowed: false,
    unregistered_character_allowed: false,
    model_selected_entrance_allowed: false
  };
}
__name(buildSceneCastContract, "buildSceneCastContract");
function canSpeak(contract, speakerId) {
  if (!isPlainObject16(contract) || !identity4(speakerId)) return false;
  if (!Array.isArray(contract.allowed_speaker_ids) || !contract.allowed_speaker_ids.includes(speakerId)) return false;
  if (speakerId === "player") return true;
  return [
    ...Array.isArray(contract.present_npc_ids) ? contract.present_npc_ids : [],
    ...Array.isArray(contract.entering_npc_ids) ? contract.entering_npc_ids : [],
    ...Array.isArray(contract.remote_npc_ids) ? contract.remote_npc_ids : []
  ].includes(speakerId);
}
__name(canSpeak, "canSpeak");

// src/engine/structured-story-v2.js
var STRUCTURED_STORY_VERSION = 2;
var DIALOGUE_WARNINGS = {
  MISSING_SPEAKER: "dialogue_missing_speaker_id",
  UNKNOWN_SPEAKER: "dialogue_unknown_speaker_id",
  NOT_IN_CAST: "dialogue_speaker_not_in_cast",
  MISSING_DIRECTION: "dialogue_missing_acting_direction",
  INVALID_DIRECTION: "dialogue_invalid_acting_direction",
  PLAYER_POLICY: "player_dialogue_policy_violation",
  ANONYMOUS: "anonymous_dialogue_blocked",
  MALFORMED: "malformed_structured_story_block",
  UNSTRUCTURED: "unstructured_dialogue_blocked",
  UNKNOWN_MARKER: "unknown_structured_story_marker",
  BEFORE_SCENE: "dialogue_before_scene",
  BLOCKED_PROSE_NPC: "scene_cast_blocked_prose_npc"
};
var BANNED_DIRECTION_TERMS = [
  "\uC790\uC5F0\uC2A4\uB7FD\uAC8C",
  "\uC790\uC5F0\uC2A4\uB808",
  "\uD3C9\uBC94\uD558\uAC8C",
  "\uC801\uB2F9\uD788",
  "\uBCF4\uD1B5 \uB9D0\uD22C\uB85C",
  "\uBCF4\uD1B5\uB9D0\uD22C\uB85C",
  "\uB300\uB2F5\uD558\uBA70",
  "\uB2F5\uD558\uBA70",
  "\uB9D0\uD558\uBA70",
  "\uB9D0\uD558\uBA74\uC11C",
  "\uC9C4\uC9C0\uD558\uAC8C",
  "\uCC28\uBD84\uD558\uAC8C",
  "\uB2F4\uB2F4\uD558\uAC8C"
];
function isConcreteActingDirection(direction) {
  const text5 = typeof direction === "string" ? direction.trim() : "";
  if (!text5) return false;
  let remainder = text5;
  for (const term of BANNED_DIRECTION_TERMS) remainder = remainder.split(term).join(" ");
  const meaningful = remainder.replace(/[\s,.·…‥"'“”’‘\-—~!?()[\]0-9]/gu, "");
  return meaningful.length >= 2;
}
__name(isConcreteActingDirection, "isConcreteActingDirection");
var SECTION_MARKERS = /* @__PURE__ */ new Set([
  "[1. \uC11C\uC0AC \uBC0F \uD589\uB3D9]",
  "[2. \uD50C\uB808\uC774\uC5B4 \uC18D\uB9C8\uC74C]",
  "[3. \uD50C\uB808\uC774\uC5B4 \uC0C1\uD669\uD310]",
  "[4. \uC120\uD0DD\uC9C0]"
]);
var SECTION_TO_CURRENT = {
  "[1. \uC11C\uC0AC \uBC0F \uD589\uB3D9]": "story",
  "[2. \uD50C\uB808\uC774\uC5B4 \uC18D\uB9C8\uC74C]": "thought",
  "[3. \uD50C\uB808\uC774\uC5B4 \uC0C1\uD669\uD310]": "status",
  "[4. \uC120\uD0DD\uC9C0]": "choices"
};
var SCENE_MARKER = "[SCENE]";
var DIALOGUE_OPEN = "[DIALOGUE";
function isSectionMarker(line) {
  return SECTION_MARKERS.has(typeof line === "string" ? line.trim() : line);
}
__name(isSectionMarker, "isSectionMarker");
function parseDialogueHeader(headerSource) {
  const source = typeof headerSource === "string" ? headerSource : "";
  if (!/\]\s*$/.test(source)) return { ok: false };
  const attrs = {};
  const seen = /* @__PURE__ */ new Set();
  const attrPattern = /([A-Za-z_]+)\s*=\s*"([^"]*)"/gu;
  let match;
  while ((match = attrPattern.exec(source)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    if (seen.has(name)) return { ok: false };
    seen.add(name);
    attrs[name] = value;
  }
  if (!("speaker_id" in attrs) || attrs.speaker_id === "") return { ok: false };
  if (!("acting_direction" in attrs) || attrs.acting_direction === "") return { ok: false };
  const allowedAttrs = /* @__PURE__ */ new Set(["speaker_id", "acting_direction"]);
  for (const name of seen) {
    if (!allowedAttrs.has(name)) return { ok: false };
  }
  return { ok: true, attrs };
}
__name(parseDialogueHeader, "parseDialogueHeader");
var NON_SPEECH_QUOTATION = /(문서 제목|메일 제목|공지에는|공지에|슬라이드 문구|슬라이드|메신저 화면|제목은|제목이|적혀 있다|적혀|쓰여 있다|쓰여|표시됐다|표시됐|표시가|이라고 적|라고 적|이라는 문구)/u;
var SPEECH_VERBS = /(말했다|말하며|말하고|물었다|물으며|대답했다|대답하며|외쳤다|속삭였다|중얼거렸다|요청했다|명령했다|소개했다|소개하며|부르며|불렀다|설명했다|설명하며|외치며|중얼거리며)/u;
function classifyV2SceneLine(line, context = {}) {
  const text5 = typeof line === "string" ? line.trim() : "";
  if (!text5) return "blank";
  if (text5.startsWith("[")) {
    if (text5 === SCENE_MARKER || text5.startsWith(DIALOGUE_OPEN)) return "structured_marker";
    if (isSectionMarker(text5)) return "structured_marker";
    return "malformed_marker";
  }
  if (/^["“”'][^"“”']{1,300}["“”']$/.test(text5)) return "unstructured_dialogue";
  if (/^[가-힣A-Za-z ]{1,20}\s*[:：]\s*/.test(text5) && !NON_SPEECH_QUOTATION.test(text5)) {
    return "unstructured_dialogue";
  }
  if (/^[가-힣A-Za-z ]{1,20}\s*\([^)]{1,60}\)\s*[:：]\s*/.test(text5) && !NON_SPEECH_QUOTATION.test(text5)) {
    return "unstructured_dialogue";
  }
  if (SPEECH_VERBS.test(text5) && /["“”']/.test(text5)) {
    if (NON_SPEECH_QUOTATION.test(text5)) return "non_speech_quotation";
    return "unstructured_dialogue";
  }
  return "plain_narration";
}
__name(classifyV2SceneLine, "classifyV2SceneLine");
function attribute(source, name) {
  const match = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "u").exec(source);
  return match ? match[1].trim() : null;
}
__name(attribute, "attribute");
function validateDialogueBlock({ headerAttributes, body, contract, speakerNames }) {
  const text5 = typeof body === "string" ? body.trim() : "";
  const speakerId = attribute(headerAttributes, "speaker_id");
  const actingDirection = attribute(headerAttributes, "acting_direction");
  if (!text5) return { ok: false, warning: DIALOGUE_WARNINGS.MALFORMED };
  if (!speakerId) return { ok: false, warning: DIALOGUE_WARNINGS.MISSING_SPEAKER };
  const known = speakerNames instanceof Map ? speakerNames.has(speakerId) : false;
  if (!known) {
    return { ok: false, warning: speakerId === "player" ? DIALOGUE_WARNINGS.UNKNOWN_SPEAKER : DIALOGUE_WARNINGS.ANONYMOUS };
  }
  if (!canSpeak(contract, speakerId)) {
    return { ok: false, warning: DIALOGUE_WARNINGS.NOT_IN_CAST };
  }
  if (!actingDirection) return { ok: false, warning: DIALOGUE_WARNINGS.MISSING_DIRECTION };
  if (!isConcreteActingDirection(actingDirection)) return { ok: false, warning: DIALOGUE_WARNINGS.INVALID_DIRECTION };
  if (speakerId === "player") {
    const policy = contract?.player_dialogue ?? {};
    const lines = text5.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const maxLines = Number.isInteger(policy.max_lines) ? policy.max_lines : 1;
    if (lines.length > maxLines) return { ok: false, warning: DIALOGUE_WARNINGS.PLAYER_POLICY };
    if (Number.isInteger(policy.max_characters)) {
      const characters = Array.from(lines.join(" ")).length;
      if (characters > policy.max_characters) return { ok: false, warning: DIALOGUE_WARNINGS.PLAYER_POLICY };
    }
    const meaningCheck = validatePlayerDialogueAgainstPolicy(text5, policy);
    if (!meaningCheck.ok) return { ok: false, warning: DIALOGUE_WARNINGS.PLAYER_POLICY };
  }
  return {
    ok: true,
    block: {
      type: "dialogue",
      speaker_id: speakerId,
      speaker: speakerNames.get(speakerId),
      speaker_name: speakerNames.get(speakerId),
      acting_direction: actingDirection,
      // 기존 렌더러/저장 형식과의 호환을 위해 direction도 같은 값으로 유지한다.
      direction: actingDirection,
      text: text5
    }
  };
}
__name(validateDialogueBlock, "validateDialogueBlock");
function appendSceneText(segments, text5) {
  const value = typeof text5 === "string" ? text5.trim() : "";
  if (!value) return;
  const last = segments.length ? segments[segments.length - 1] : null;
  if (last?.type === "scene") {
    last.text = `${last.text}
${value}`;
    return;
  }
  segments.push({ type: "scene", text: value });
}
__name(appendSceneText, "appendSceneText");
function disallowedProseNpcNames(contract, speakerNames) {
  const allowed = /* @__PURE__ */ new Set([
    ...Array.isArray(contract?.present_npc_ids) ? contract.present_npc_ids : [],
    ...Array.isArray(contract?.entering_npc_ids) ? contract.entering_npc_ids : []
  ]);
  const entries2 = [];
  if (speakerNames instanceof Map) {
    for (const [id, name] of speakerNames) {
      if (id === "player" || allowed.has(id) || !name) continue;
      entries2.push({ id, name });
    }
  }
  entries2.sort((a, b) => b.name.length - a.name.length);
  return entries2;
}
__name(disallowedProseNpcNames, "disallowedProseNpcNames");
function findDisallowedNpcInLine(line, disallowedNames) {
  const text5 = typeof line === "string" ? line : "";
  for (const entry of disallowedNames) {
    if (text5.includes(entry.name)) return entry;
  }
  return null;
}
__name(findDisallowedNpcInLine, "findDisallowedNpcInLine");
function createStructuredStoryGate({ contract, speakerNames }) {
  let lineBuffer = "";
  let currentSection = "none";
  let inScene = false;
  let seenScene = false;
  let openHeaderRaw = null;
  let openBody = "";
  let awaitingMarkerAfterDialogue = false;
  let discardMalformedDialogueBody = false;
  let order = 0;
  const disallowedNames = disallowedProseNpcNames(contract, speakerNames);
  const segments = [];
  const warnings = [];
  const canonicalParts = [];
  const streamSegments = [];
  const recordWarning = /* @__PURE__ */ __name((warning) => {
    if (!warnings.includes(warning)) warnings.push(warning);
  }, "recordWarning");
  const emitText = /* @__PURE__ */ __name((out, text5) => {
    if (!text5) return;
    canonicalParts.push(text5);
    out.push({ kind: "text", text: text5 });
    streamSegments.push({ order: order++, kind: "text", text: text5 });
    if (currentSection === "story" && inScene) {
      appendSceneText(segments, text5.replace(/\n+$/g, ""));
    }
  }, "emitText");
  const closeDialogue = /* @__PURE__ */ __name((out) => {
    if (openHeaderRaw === null) return;
    if (!seenScene) {
      recordWarning(DIALOGUE_WARNINGS.BEFORE_SCENE);
      openHeaderRaw = null;
      openBody = "";
      return;
    }
    const result = validateDialogueBlock({
      headerAttributes: openHeaderRaw,
      body: openBody,
      contract,
      speakerNames
    });
    openHeaderRaw = null;
    openBody = "";
    if (!result.ok) {
      recordWarning(result.warning);
      return;
    }
    const block = { ...result.block, order: segments.length };
    block.text = String(block.text).replace(/^["“”']+|["“”']+$/gu, "");
    segments.push(block);
    const safeName = String(block.speaker_name).replace(/"/gu, "");
    const safeDirection = String(block.acting_direction).replace(/"/gu, "");
    const canonical = `
[DIALOGUE speaker="${safeName}" direction="${safeDirection}"]
${block.text}
`;
    canonicalParts.push(canonical);
    out.push({ kind: "block", block, text: canonical });
    streamSegments.push({ order: order++, kind: "block", block, text: canonical });
  }, "closeDialogue");
  const isValidResumeMarker = /* @__PURE__ */ __name((line) => {
    if (line === SCENE_MARKER) return true;
    if (line.startsWith(DIALOGUE_OPEN)) {
      return parseDialogueHeader(line).ok;
    }
    return isSectionMarker(line);
  }, "isValidResumeMarker");
  const settleLine = /* @__PURE__ */ __name((out, line) => {
    const raw = typeof line === "string" ? line : "";
    const trimmed = raw.trim();
    if (discardMalformedDialogueBody) {
      if (trimmed.startsWith("[") && isValidResumeMarker(trimmed)) {
        discardMalformedDialogueBody = false;
      } else {
        return;
      }
    }
    if (awaitingMarkerAfterDialogue) {
      if (trimmed === "") return;
      awaitingMarkerAfterDialogue = false;
      const isResumeMarker = trimmed === SCENE_MARKER || trimmed.startsWith(DIALOGUE_OPEN) && parseDialogueHeader(trimmed).ok || isSectionMarker(trimmed);
      if (!isResumeMarker) {
        recordWarning(DIALOGUE_WARNINGS.MALFORMED);
        discardMalformedDialogueBody = true;
        return;
      }
    }
    if (trimmed === "") {
      emitText(out, raw);
      return;
    }
    if (isSectionMarker(trimmed)) {
      currentSection = SECTION_TO_CURRENT[trimmed] ?? "none";
      inScene = false;
      emitText(out, trimmed + "\n");
      return;
    }
    if (currentSection === "story" || currentSection === "none") {
      if (trimmed === SCENE_MARKER) {
        currentSection = "story";
        seenScene = true;
        inScene = true;
        return;
      }
      if (currentSection === "story" && trimmed.startsWith(DIALOGUE_OPEN)) {
        inScene = false;
        const parsed = parseDialogueHeader(trimmed);
        if (!parsed.ok) {
          recordWarning(DIALOGUE_WARNINGS.MALFORMED);
          discardMalformedDialogueBody = true;
          return;
        }
        openHeaderRaw = trimmed;
        return;
      }
      if (currentSection === "story") {
        if (trimmed.startsWith("[") && /\]\s*$/.test(trimmed)) {
          recordWarning(DIALOGUE_WARNINGS.UNKNOWN_MARKER);
          return;
        }
        if (inScene) {
          const cls = classifyV2SceneLine(trimmed);
          if (cls === "unstructured_dialogue") {
            recordWarning(DIALOGUE_WARNINGS.UNSTRUCTURED);
            return;
          }
          if (cls === "malformed_marker") {
            recordWarning(DIALOGUE_WARNINGS.UNKNOWN_MARKER);
            return;
          }
          const blockedNpc = findDisallowedNpcInLine(trimmed, disallowedNames);
          if (blockedNpc) {
            recordWarning(`${DIALOGUE_WARNINGS.BLOCKED_PROSE_NPC}:${blockedNpc.id}`);
            return;
          }
        }
      }
    }
    emitText(out, raw + "\n");
  }, "settleLine");
  const inDialogueBody = /* @__PURE__ */ __name(() => openHeaderRaw !== null, "inDialogueBody");
  const drain = /* @__PURE__ */ __name((out, final) => {
    for (; ; ) {
      if (inDialogueBody()) {
        const breakIndex2 = lineBuffer.indexOf("\n");
        if (breakIndex2 === -1) {
          if (final && lineBuffer.trim()) {
            openBody = lineBuffer.trim();
            lineBuffer = "";
            closeDialogue(out);
            awaitingMarkerAfterDialogue = true;
          }
          return;
        }
        const dialogueLine = lineBuffer.slice(0, breakIndex2).trim();
        lineBuffer = lineBuffer.slice(breakIndex2 + 1);
        if (!dialogueLine) continue;
        openBody = dialogueLine;
        closeDialogue(out);
        awaitingMarkerAfterDialogue = true;
        continue;
      }
      const breakIndex = lineBuffer.indexOf("\n");
      if (breakIndex === -1) {
        if (final && lineBuffer) {
          const lastLine = lineBuffer.replace(/\r$/, "");
          lineBuffer = "";
          settleLine(out, lastLine);
        }
        return;
      }
      const line = lineBuffer.slice(0, breakIndex).replace(/\r$/, "");
      lineBuffer = lineBuffer.slice(breakIndex + 1);
      if (line.startsWith("[") && !isSectionMarker(line) && line !== SCENE_MARKER) {
        if (line.startsWith(DIALOGUE_OPEN)) {
          if (!/\]\s*$/.test(line)) {
            if (final) {
              recordWarning(DIALOGUE_WARNINGS.MALFORMED);
              discardMalformedDialogueBody = true;
              const nextMarker = lineBuffer.search(/\r?\n\s*\[/u);
              if (nextMarker === -1) {
                lineBuffer = "";
                return;
              }
              lineBuffer = lineBuffer.slice(nextMarker).replace(/^\r?\n/u, "");
              continue;
            }
            lineBuffer = line + "\n" + lineBuffer;
            return;
          }
        }
      }
      settleLine(out, line);
    }
  }, "drain");
  return {
    push(chunk) {
      const out = [];
      lineBuffer += typeof chunk === "string" ? chunk : "";
      drain(out, false);
      return out;
    },
    end() {
      const out = [];
      drain(out, true);
      closeDialogue(out);
      return {
        emissions: out,
        blocks: segments.filter((s) => s.type === "dialogue"),
        segments,
        stream_segments: streamSegments,
        warnings,
        story_text: canonicalParts.join("")
      };
    },
    get warnings() {
      return warnings;
    },
    get blocks() {
      return segments.filter((s) => s.type === "dialogue");
    },
    get segments() {
      return segments;
    }
  };
}
__name(createStructuredStoryGate, "createStructuredStoryGate");

// src/api/product-recovery.js
function object5(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
}
__name(object5, "object");
function text2(value) {
  return typeof value === "string" ? value.trim() : "";
}
__name(text2, "text");
function numberOrNull(value) {
  const number2 = Number(value);
  return Number.isFinite(number2) ? number2 : null;
}
__name(numberOrNull, "numberOrNull");
function entries(value) {
  return Array.isArray(value) ? value : Object.entries(object5(value)).map(([id, item]) => ({ id, ...object5(item) }));
}
__name(entries, "entries");
function catalogName(list, idField, id, nameField = "name") {
  return text2(entries(list).find((item) => item?.[idField] === id || item?.id === id)?.[nameField]);
}
__name(catalogName, "catalogName");
function departmentDirectory(edition2) {
  const rows = [
    ...entries(edition2?.organization?.departments),
    ...entries(edition2?.organization?.general_npc_departments)
  ];
  return new Map(rows.map((item) => {
    const id = item.department_id ?? item.id;
    return [id, text2(item.name) || id];
  }));
}
__name(departmentDirectory, "departmentDirectory");
function locationDirectory(edition2) {
  return new Map(entries(edition2?.map?.locations).map((item) => [item.location_id ?? item.id, item]));
}
__name(locationDirectory, "locationDirectory");
function locationLabel(edition2, id) {
  return text2(locationDirectory(edition2).get(id)?.name) || text2(id);
}
__name(locationLabel, "locationLabel");
function heroineProfiles(edition2) {
  return object5(edition2?.characters?.characters);
}
__name(heroineProfiles, "heroineProfiles");
function generalProfiles(edition2) {
  return object5(edition2?.generalNpcs?.profiles);
}
__name(generalProfiles, "generalProfiles");
function profileFor(edition2, id) {
  const heroine = object5(heroineProfiles(edition2)[id]);
  if (Object.keys(heroine).length) return { type: "heroine", ...heroine, id, character_id: id };
  const general = object5(generalProfiles(edition2)[id]);
  if (Object.keys(general).length) return { type: "general", ...general, id, npc_id: id };
  return null;
}
__name(profileFor, "profileFor");
function profileDepartmentId(edition2, profile) {
  const direct = text2(profile?.department_id);
  if (direct) return direct;
  const name = text2(profile?.department);
  if (!name) return "";
  const directory = departmentDirectory(edition2);
  return [...directory.entries()].find(([, label]) => label === name)?.[0] ?? "";
}
__name(profileDepartmentId, "profileDepartmentId");
function suggestedLocationForProfile(edition2, profile) {
  const map = entries(edition2?.map?.locations);
  const profileId = text2(profile?.character_id ?? profile?.npc_id ?? profile?.id);
  const exact = map.find((location) => Array.isArray(location.default_npc_ids) && location.default_npc_ids.includes(profileId));
  if (exact) return { location: exact, source: "explicit_default" };
  const departmentId = profileDepartmentId(edition2, profile);
  if (departmentId) {
    const departmentLocation = map.find((location) => location.department_id === departmentId && ["office_floor", "team_space", "project_space"].includes(location.location_type));
    if (departmentLocation) return { location: departmentLocation, source: "department_guess" };
    const anyDepartmentLocation = map.find((location) => location.department_id === departmentId);
    if (anyDepartmentLocation) return { location: anyDepartmentLocation, source: "department_guess" };
  }
  return null;
}
__name(suggestedLocationForProfile, "suggestedLocationForProfile");
function clothingSummary(clothing) {
  const source = object5(clothing);
  const values = Object.entries(source).flatMap(([key, item]) => {
    if (typeof item === "string" && item.trim()) return [`${key}: ${item.trim()}`];
    if (item === true) return [key];
    return [];
  });
  return values.join(" \xB7 ");
}
__name(clothingSummary, "clothingSummary");
function buildFullPlayerInfo(save, edition2) {
  const player = object5(save?.player);
  const catalogs = {
    departments: entries(edition2?.organization?.departments),
    positions: entries(edition2?.positions?.positions),
    bodyTypes: entries(edition2?.bodyTypes?.body_types),
    speechStyles: entries(edition2?.speechStyles?.speech_styles)
  };
  const canonical = resolvePlayerCanonicalNames(player, catalogs);
  const scene = object5(save?.player_scene_state);
  const worldScene = object5(save?.scene_state);
  const sexual = object5(save?.player_sexual_state);
  const active = getApplicableCsaEntries(save);
  const capability = calculateCsaCapability(save, active.length);
  return {
    name: text2(player.name),
    age: numberOrNull(player.age),
    adult: player.adult === true,
    department_id: text2(player.department_id),
    department: canonical.departmentName || catalogName(catalogs.departments, "department_id", player.department_id),
    position_id: text2(player.position_id),
    position: canonical.positionName || catalogName(catalogs.positions, "position_id", player.position_id),
    height_cm: numberOrNull(player.height_cm),
    weight_kg: numberOrNull(player.weight_kg),
    penis_length_cm: numberOrNull(player.penis_length_cm),
    body_type_id: text2(player.body_type_id),
    body_type: canonical.bodyTypeName || catalogName(catalogs.bodyTypes, "body_type_id", player.body_type_id),
    speech_style_id: text2(player.speech_style_id),
    speech_style: canonical.speechStyleName || catalogName(catalogs.speechStyles, "speech_style_id", player.speech_style_id),
    background: text2(player.background),
    current_location: text2(scene.location_label) || locationLabel(edition2, scene.location_id) || text2(worldScene.location_label) || locationLabel(edition2, worldScene.location_id),
    posture: text2(scene.posture),
    posture_detail: text2(scene.posture_detail ?? scene.posture_description),
    clothing: clothingSummary(scene.clothing),
    arousal: numberOrNull(sexual.arousal) ?? 0,
    ejaculation_progress: numberOrNull(sexual.ejaculation_progress ?? sexual.ejaculation_meter) ?? 0,
    ejaculation_count: numberOrNull(sexual.ejaculation_count) ?? 0,
    level: capability.current_level,
    exp: capability.exp,
    next_level_exp: capability.next_level_exp,
    active_csa_count: capability.csa_active_count,
    max_active_csa: capability.csa_max_active,
    active_csa: active.map((item) => ({
      id: item.id,
      strength: text2(item.strength),
      content: text2(item.content),
      scope_label: text2(item.scope_label) || "\uD68C\uC0AC \uC804\uCCB4"
    }))
  };
}
__name(buildFullPlayerInfo, "buildFullPlayerInfo");
function buildFinderNpcList(save, edition2) {
  const departments = departmentDirectory(edition2);
  const ids = [...Object.keys(heroineProfiles(edition2)), ...Object.keys(generalProfiles(edition2))];
  return ids.map((id) => {
    const profile = profileFor(edition2, id);
    const result = resolveNpcLocation(save, edition2, id);
    const departmentId = profileDepartmentId(edition2, profile);
    return {
      id,
      name: text2(profile?.name) || id,
      type: profile?.type ?? "unknown",
      department: text2(profile?.department) || departments.get(departmentId) || departmentId,
      position: text2(profile?.position),
      role: text2(profile?.role_title ?? profile?.role),
      ...result
    };
  });
}
__name(buildFinderNpcList, "buildFinderNpcList");
function resolveNpcLocation(save, edition2, characterId) {
  const profile = profileFor(edition2, characterId);
  if (!profile) return { known: false, status: "not_found", present_now: false, can_move: false, location_id: "", location_label: "", suggested_location_id: "", suggested_location_label: "" };
  const presentIds = new Set([
    ...Array.isArray(save?.last_npcs_present) ? save.last_npcs_present : [],
    ...Array.isArray(save?.scene_state?.participants) ? save.scene_state.participants : [],
    save?.focal_character_id,
    save?.last_speaker_id
  ].filter(Boolean));
  const presentNow = presentIds.has(characterId);
  const scene = object5(save?.npc_scene_state?.[characterId]);
  const work = object5(save?.npc_work_state?.[characterId]);
  const worldScene = object5(save?.scene_state);
  let locationId = text2(scene.location_id) || text2(work.location_id);
  let label = text2(scene.location_label) || text2(work.location_label);
  if (presentNow) {
    locationId ||= text2(worldScene.location_id);
    label ||= text2(worldScene.location_label) || locationLabel(edition2, locationId);
  }
  label ||= locationLabel(edition2, locationId);
  const known = Boolean(locationId || label);
  const suggestion = known ? null : suggestedLocationForProfile(edition2, profile);
  const suggestedLocationId = text2(suggestion?.location?.location_id ?? suggestion?.location?.id);
  const suggestedLocationLabel = text2(suggestion?.location?.name) || locationLabel(edition2, suggestedLocationId);
  return {
    known,
    status: presentNow ? "present" : known ? "located" : "unknown",
    present_now: presentNow,
    can_move: known && !presentNow,
    location_id: locationId,
    location_label: label,
    suggested_location_id: suggestedLocationId,
    suggested_location_label: suggestedLocationLabel,
    suggestion_source: suggestion?.source ?? ""
  };
}
__name(resolveNpcLocation, "resolveNpcLocation");
function buildNpcFinderPayload(save, edition2, characterId) {
  const profile = profileFor(edition2, characterId);
  if (!profile) throw new HttpError(422, "npc_not_found", "\uB4F1\uB85D\uB41C \uC778\uBB3C\uC774 \uC544\uB2D9\uB2C8\uB2E4.", false);
  const location = resolveNpcLocation(save, edition2, characterId);
  if (location.status === "present") {
    throw new HttpError(422, "npc_already_present", `${text2(profile.name) || characterId}\uC740(\uB294) \uD604\uC7AC \uAC19\uC740 \uC7A5\uBA74\uC5D0 \uC788\uC2B5\uB2C8\uB2E4.`, false);
  }
  if (location.status === "unknown") {
    const suggestion = location.suggested_location_label ? ` \uCC38\uACE0 \uADFC\uBB34\uC9C0\uB294 ${location.suggested_location_label}\uC774\uC9C0\uB9CC \uD604\uC7AC \uC704\uCE58 \uAE30\uB85D\uC740 \uC5C6\uC2B5\uB2C8\uB2E4.` : "";
    throw new HttpError(422, "npc_location_unknown", `${text2(profile.name) || characterId}\uC758 \uD604\uC7AC \uC704\uCE58\uAC00 \uC544\uC9C1 \uAE30\uB85D\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.${suggestion}`, false);
  }
  const departments = departmentDirectory(edition2);
  const departmentId = profileDepartmentId(edition2, profile);
  return {
    character_id: characterId,
    name: text2(profile.name) || characterId,
    known_character: true,
    type: profile.type,
    department: text2(profile.department) || departments.get(departmentId) || departmentId,
    position: text2(profile.position),
    role: text2(profile.role_title ?? profile.role),
    ...location
  };
}
__name(buildNpcFinderPayload, "buildNpcFinderPayload");

// src/api/timing.js
function logTurnTiming(fields) {
  const { warning_codes, ...rest } = fields;
  console.log(JSON.stringify({
    event: "company_turn_timing",
    ...rest,
    warning_codes: Array.isArray(warning_codes) ? warning_codes : []
  }));
}
__name(logTurnTiming, "logTurnTiming");
function newRequestId() {
  return typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
__name(newRequestId, "newRequestId");

// src/api/turn-routes.js
wireMaterialClassifier(classifyMaterialActions2);
var EXTRACT_DEGRADE_CODES = /* @__PURE__ */ new Set(["llm_upstream_failure", "extract_timeout", "extract_invalid_json", "extract_truncated"]);
function asHttpError(error) {
  if (error instanceof HttpError) return error;
  if (error instanceof GameCoreError) return new HttpError(422, error.code.toLowerCase(), error.message);
  return new HttpError(500, "internal_error", "Unexpected server error");
}
__name(asHttpError, "asHttpError");
function actionOrNotFound(action) {
  if (!action) throw new HttpError(404, "action_not_found", "Action was not found");
  return action;
}
__name(actionOrNotFound, "actionOrNotFound");
function actionIds(body) {
  return {
    gameId: requireString(body.game_id, "game_id"),
    actionId: requireString(body.action_id, "action_id")
  };
}
__name(actionIds, "actionIds");
function plainObject2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(plainObject2, "plainObject");
function structuredActionFor(action, requestedStructuredAction = null) {
  const stored = action?.structured_action ?? null;
  const requested = requestedStructuredAction ?? null;
  if (stored !== null && requested !== null && stableStringify(stored) !== stableStringify(requested)) {
    throw new HttpError(409, "structured_action_mismatch", "structured_action does not match the reserved action", false);
  }
  return stored ?? requested;
}
__name(structuredActionFor, "structuredActionFor");
function toEntryArray(mapOrArray, idField) {
  if (Array.isArray(mapOrArray)) return mapOrArray;
  if (plainObject2(mapOrArray)) {
    return Object.entries(mapOrArray).map(([id, value]) => ({ [idField]: id, ...plainObject2(value) ? value : {} }));
  }
  return [];
}
__name(toEntryArray, "toEntryArray");
function masterFromEdition(edition2) {
  return {
    characters: toEntryArray(edition2?.characters?.characters, "character_id"),
    general_npcs: toEntryArray(edition2?.generalNpcs?.profiles, "npc_id")
  };
}
__name(masterFromEdition, "masterFromEdition");
function npcIdsFromEdition(edition2) {
  return buildStableNpcIdSet({
    characters: toEntryArray(edition2?.characters?.characters, "character_id"),
    generalNpcs: toEntryArray(edition2?.generalNpcs?.profiles, "npc_id")
  });
}
__name(npcIdsFromEdition, "npcIdsFromEdition");
function catalogsFromEdition(edition2) {
  return {
    departments: toEntryArray(edition2?.organization?.departments, "department_id"),
    positions: toEntryArray(edition2?.positions?.positions, "position_id"),
    bodyTypes: toEntryArray(edition2?.bodyTypes?.body_types, "body_type_id"),
    speechStyles: toEntryArray(edition2?.speechStyles?.speech_styles, "speech_style_id")
  };
}
__name(catalogsFromEdition, "catalogsFromEdition");
function randomSeedBytes(length = 16) {
  if (typeof crypto?.getRandomValues === "function") return Array.from(crypto.getRandomValues(new Uint8Array(length)));
  return Array.from({ length }, () => Math.floor(Math.random() * 256));
}
__name(randomSeedBytes, "randomSeedBytes");
function randomUuid() {
  return typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
__name(randomUuid, "randomUuid");
function activeCountFromNpcState(activeNpcState) {
  const ids = /* @__PURE__ */ new Set();
  for (const map of Object.values(plainObject2(activeNpcState) ? activeNpcState : {})) {
    for (const id of Object.keys(plainObject2(map) ? map : {})) ids.add(id);
  }
  return ids.size;
}
__name(activeCountFromNpcState, "activeCountFromNpcState");
function hydratedSaveContext(context, master) {
  const wrapped = context?.save && typeof context.save === "object" && "data" in context.save;
  const save = wrapped ? context.save.data : context.save;
  if (!save || typeof save !== "object" || save.edition !== "company-v1" || save.save_schema_version !== 1) return context;
  const hydrated = hydrateGameplayState(save, master);
  return { ...context, save: wrapped ? { ...context.save, data: hydrated } : hydrated };
}
__name(hydratedSaveContext, "hydratedSaveContext");
function storySse({ meta, run }) {
  const encoder = new TextEncoder();
  return sseResponse(new ReadableStream({
    async start(controller) {
      const emit = /* @__PURE__ */ __name((name, data) => controller.enqueue(encoder.encode(sseEvent(name, data))), "emit");
      emit("meta", meta);
      try {
        await run(emit);
      } catch (error) {
        const normalized = asHttpError(error);
        emit("error", { code: normalized.code, message: normalized.message, retryable: normalized.retryable });
      } finally {
        controller.close();
      }
    }
  }));
}
__name(storySse, "storySse");
function csaCatalogFromEdition(edition2) {
  const source = plainObject2(edition2?.csaPresets) ? edition2.csaPresets : { actor_options: [], target_options: [], trigger_options: [], duration_options: [], categories: [], items: [], sexual_action_contract: {} };
  return normalizeCompanyCsaCatalog(source);
}
__name(csaCatalogFromEdition, "csaCatalogFromEdition");
function appValidationSecret(env) {
  return env?.APP_VALIDATION_SECRET || env?.SUPABASE_SERVICE_ROLE_KEY;
}
__name(appValidationSecret, "appValidationSecret");
async function resolveCsaTransactionPlan({ env, gameId, structuredAction, save, csaCatalog, expectedTurn }) {
  if (structuredAction == null) return null;
  const normalized = normalizeStructuredAction(structuredAction);
  if (!normalized) throw new HttpError(400, "invalid_structured_action", "structured_action has an invalid shape");
  const verification = await verifyStructuredActionValidation(appValidationSecret(env), gameId, structuredAction);
  if (!verification.ok) throw new HttpError(409, "structured_action_invalid", "structured_action failed validation-proof verification", false);
  if (normalized.base_turn_count !== expectedTurn - 1) throw new HttpError(409, "app_stale_state", "\uC0C1\uC2DD\uAC1C\uBCC0 \uC571\uC744 \uC5F0 \uB4A4 \uAC8C\uC784 \uC0C1\uD0DC\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", false);
  const capability = calculateCsaCapability(save, getApplicableCsaEntries(save).length);
  const plan = planCsaTransaction(save, csaCatalog, normalized.operations, { turnNumber: expectedTurn, capability });
  if (!plan.ok) throw new HttpError(422, (plan.error_code ?? "app_action_invalid").toLowerCase(), "\uC0C1\uC2DD\uAC1C\uBCC0 \uC571 \uBCC0\uACBD\uC0AC\uD56D\uC744 \uC801\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", false);
  return plan;
}
__name(resolveCsaTransactionPlan, "resolveCsaTransactionPlan");
function applyCsaStorySections(messages, { save, plan, playerAction, csaCatalog, actionContract, master }) {
  const applicableCsa = getApplicableCsaEntries(save);
  const hasApplicableCsa = applicableCsa.length > 0;
  const isAppTransactionTurn = Boolean(plan);
  if (!hasApplicableCsa && !isAppTransactionTurn) {
    if (playerAction && actionContract) {
      const section = buildActionExecutionContractSection(actionContract, { applicableCsa: [] });
      if (section) return [{ ...messages[0], content: messages[0].content + section }, ...messages.slice(1)];
    }
    return messages;
  }
  const hasPublicCsa = applicableCsa.some((csa) => csa.preset?.public_normalization === true || csa.semantic_contract?.public_normalization === true);
  const hasSynergyCandidate = applicableCsa.length >= 2;
  let extra = buildCsaRuntimeSection() + buildCsaAcceptanceScopeSection() + buildCsaDirectExecutionPrioritySection() + buildCsaPersistentSceneSection() + (hasPublicCsa ? buildCsaPublicSceneSection() : "") + (hasSynergyCandidate ? buildCsaWeakSynergySection() : "") + buildCsaPhysicalTransitionSection(hasApplicableCsa, isAppTransactionTurn);
  if (plan) {
    const csaOperations = plan.canonical_action.operations;
    const activeCsaCount = plan.next_csa_active.length;
    const level = calculateCsaCapability(save, activeCsaCount).current_level;
    extra += buildStructuredActionStorySection(csaOperations, activeCsaCount, getCsaLimits(level).max_active);
    extra += buildCsaDeactivationStorySection(csaOperations.some((operation) => operation.operation === "deactivate"));
  }
  if (hasApplicableCsa && playerAction) {
    const coverage = resolveCsaDirectCoverage(save, playerAction, { sexualActionContract: csaCatalog?.sexual_action_contract, master });
    extra += buildCsaDirectCoverageSection(coverage);
  }
  if (playerAction && actionContract) {
    extra += buildActionExecutionContractSection(actionContract, { applicableCsa });
  }
  const next = [{ ...messages[0], content: messages[0].content + extra }, ...messages.slice(1)];
  next.push({ role: "system", content: buildNpcCsaEpistemicFirewallSection() });
  return next;
}
__name(applyCsaStorySections, "applyCsaStorySections");
var RESOLUTION_RESPONSES = /* @__PURE__ */ new Set(["accepted", "partially_accepted", "refused", "interrupted", "ambiguous"]);
function isSexualCompletionEvent(ev) {
  const type = typeof ev?.event_type === "string" ? ev.event_type : "";
  const summary = typeof ev?.summary === "string" ? ev.summary : "";
  const preserve = /(refused|blocked|interrupted|reported|complaint|harassment|attempt|시도|거절|중단|막음|신고|항의|불쾌|경계|거부)/i.test(type + " " + summary);
  if (preserve) return false;
  const sexual = /(sexual|kiss|intimate|foreplay|penetration|oral|genital|성적|성관계|성행위|키스|삽입|친밀|사정|오르가즘)/i.test(type + " " + summary);
  const completion2 = /(completed|consummated)/i.test(type) || /(했다|완료|이루어졌|시작됐|끝났|성사|이뤄졌|하게 했|완료됐|끝났다)/i.test(summary);
  return sexual && completion2;
}
__name(isSexualCompletionEvent, "isSexualCompletionEvent");
function isPlayerRef(id) {
  if (!id) return false;
  const s = String(id);
  return s === "player" || s === "player-1" || /^player([-_]|$)/.test(s);
}
__name(isPlayerRef, "isPlayerRef");
function filterSexualCompletionEvents(events, targetId) {
  if (!Array.isArray(events)) return events;
  return events.filter((ev) => {
    if (!isSexualCompletionEvent(ev)) return true;
    const participants = Array.isArray(ev?.participants) ? ev.participants : [];
    if (isPlayerRef(ev?.actor_id) || isPlayerRef(ev?.target_id) || participants.some(isPlayerRef)) return false;
    if (targetId && (ev?.actor_id === targetId || ev?.target_id === targetId || participants.includes(targetId))) return false;
    if (ev?.actor_id && ev?.target_id && ev.actor_id !== ev.target_id) return true;
    return new Set(participants.filter(Boolean)).size >= 2;
  });
}
__name(filterSexualCompletionEvents, "filterSexualCompletionEvents");
function validateActionResolution(resolution, contract) {
  if (!resolution || typeof resolution !== "object") return null;
  if (resolution.target_id !== contract.target_id) return null;
  if (resolution.route !== contract.route) return null;
  if (!RESOLUTION_RESPONSES.has(resolution.npc_response)) return null;
  if (typeof resolution.voluntary !== "boolean") return null;
  const rawCompleted = Array.isArray(resolution.completed_action_types) ? resolution.completed_action_types : [];
  const contractTypes = new Set(Array.isArray(contract.action_types) ? contract.action_types : []);
  const completed = [];
  for (const action of rawCompleted) {
    if (typeof action !== "string" || !action) return null;
    if (completed.includes(action)) return null;
    if (!contractTypes.has(action)) return null;
    completed.push(action);
  }
  if (resolution.npc_response === "accepted" && completed.length === 0) return null;
  if (resolution.npc_response !== "accepted" && resolution.npc_response !== "partially_accepted") {
    if (completed.length) return null;
  }
  if (!resolution.voluntary && completed.length) return null;
  return { npc_response: resolution.npc_response, voluntary: resolution.voluntary, completed_action_types: completed };
}
__name(validateActionResolution, "validateActionResolution");
function filterContractSexualLedger(events, contract, completedActionTypes = []) {
  if (!Array.isArray(events)) return events;
  const targetId = contract?.target_id;
  const completedSet = new Set(completedActionTypes);
  return events.filter((ev) => {
    if (!ev || typeof ev !== "object") return false;
    if (ev.completed !== true) return true;
    if (!targetId) return false;
    const involvedPlayer = isPlayerRef(ev.actor_id) || isPlayerRef(ev.target_id);
    const involvedTarget = ev.actor_id === targetId || ev.target_id === targetId;
    if (involvedPlayer || involvedTarget) {
      if (!(involvedPlayer && involvedTarget)) return false;
      return typeof ev.action_type === "string" && completedSet.has(ev.action_type);
    }
    return Boolean(ev.actor_id) && Boolean(ev.target_id);
  });
}
__name(filterContractSexualLedger, "filterContractSexualLedger");
function stripPlayerSexualCompletion(extract) {
  const next = { ...extract, state_delta: { ...extract?.state_delta ?? {} } };
  if (next.state_delta.player_sexual_state && typeof next.state_delta.player_sexual_state === "object") {
    const p = { ...next.state_delta.player_sexual_state };
    delete p.ejaculation_completed;
    next.state_delta.player_sexual_state = p;
  }
  if (next.evidence && typeof next.evidence === "object") {
    next.evidence = { ...next.evidence };
    delete next.evidence.sexual_resolution;
  }
  return next;
}
__name(stripPlayerSexualCompletion, "stripPlayerSexualCompletion");
var SEXUAL_RELATIONSHIP_MILESTONE_ACTIONS = /* @__PURE__ */ new Set(["penetration", "oral"]);
function stripContractMilestones(rel, targetId, completed = null) {
  const p = { ...rel };
  if (p.milestones && typeof p.milestones === "object") {
    const milestones = { ...p.milestones };
    if (targetId == null) {
      delete milestones.first_kiss_turn;
      delete milestones.sexual_relationship_started_turn;
    } else {
      if (milestones.first_kiss_turn !== void 0 && !(completed && completed.has("kiss"))) {
        delete milestones.first_kiss_turn;
      }
      const explicitCompleted = completed && [...completed].some((action) => SEXUAL_RELATIONSHIP_MILESTONE_ACTIONS.has(action));
      if (milestones.sexual_relationship_started_turn !== void 0 && !explicitCompleted) {
        delete milestones.sexual_relationship_started_turn;
      }
    }
    p.milestones = milestones;
  }
  return p;
}
__name(stripContractMilestones, "stripContractMilestones");
function stripAttemptMilestones(extract, targetId) {
  const next = { ...extract, state_delta: { ...extract?.state_delta ?? {} } };
  if (next.state_delta.npc_relationship_state && typeof next.state_delta.npc_relationship_state === "object") {
    const rel = {};
    for (const [id, patch] of Object.entries(next.state_delta.npc_relationship_state)) {
      const p = targetId == null || id === targetId ? stripContractMilestones(patch, targetId, null) : patch;
      rel[id] = p;
    }
    next.state_delta.npc_relationship_state = rel;
  }
  return next;
}
__name(stripAttemptMilestones, "stripAttemptMilestones");
function applyAcceptedActionScope(extract, contract, validated) {
  const completed = new Set(validated.completed_action_types);
  const next = { ...extract, state_delta: { ...extract?.state_delta ?? {} } };
  const targetId = contract.target_id;
  if (next.state_delta.npc_relationship_state && typeof next.state_delta.npc_relationship_state === "object") {
    const rel = {};
    for (const [id, patch] of Object.entries(next.state_delta.npc_relationship_state)) {
      const p = targetId == null || id === targetId ? stripContractMilestones(patch, targetId, completed) : patch;
      rel[id] = p;
    }
    next.state_delta.npc_relationship_state = rel;
  }
  if (Array.isArray(next.state_delta.event_ledger)) {
    next.state_delta.event_ledger = next.state_delta.event_ledger.filter((ev) => {
      const type = typeof ev?.event_type === "string" ? ev.event_type : "";
      const summary = typeof ev?.summary === "string" ? ev.summary : "";
      if (/(refused|blocked|interrupted|reported|complaint|harassment|attempt|시도|거절|중단|막음|신고|항의|불쾌|경계|거부)/i.test(type + " " + summary)) return true;
      const participants = Array.isArray(ev?.participants) ? ev.participants : [];
      if (targetId && participants.length && !participants.includes(targetId)) return true;
      const sexual = /(sexual|kiss|intimate|foreplay|penetration|oral|genital|성적|성관계|성행위|키스|삽입|친밀|사정|오르가즘)/i.test(type + " " + summary);
      if (!sexual) return true;
      const completion2 = /(completed|consummated)/i.test(type) || /(했다|완료|이루어졌|시작됐|끝났|성사|이뤄졌|하게 했|완료됐|끝났다)/i.test(summary);
      if (!completion2) return true;
      const evAction = typeof ev?.action_type === "string" ? ev.action_type : null;
      if (evAction && completed.has(evAction)) return true;
      return false;
    });
  }
  next.state_delta.sexual_event_ledger = filterContractSexualLedger(next.state_delta.sexual_event_ledger, contract, validated.completed_action_types);
  if (next.state_delta.player_sexual_state?.ejaculation_completed === true) {
    const explicitCompleted = [...completed].some((action) => SEXUAL_RELATIONSHIP_MILESTONE_ACTIONS.has(action));
    if (!explicitCompleted) {
      const p = { ...next.state_delta.player_sexual_state };
      delete p.ejaculation_completed;
      next.state_delta.player_sexual_state = p;
      if (next.evidence && typeof next.evidence === "object") {
        next.evidence = { ...next.evidence };
        delete next.evidence.sexual_resolution;
      }
    }
  }
  return next;
}
__name(applyAcceptedActionScope, "applyAcceptedActionScope");
function applyContractStateFirewall(extract, contract) {
  if (!contract) return extract;
  if (contract.route === "ordinary_direct_blocked") {
    const scoped = {
      ...extract,
      state_delta: {
        ...extract?.state_delta ?? {},
        event_ledger: filterSexualCompletionEvents(extract?.state_delta?.event_ledger, contract.target_id),
        sexual_event_ledger: filterContractSexualLedger(extract?.state_delta?.sexual_event_ledger, contract, [])
      }
    };
    return stripPlayerSexualCompletion(applyBlockedContractFirewall(scoped, contract));
  }
  if (contract.route === "ordinary_direct_attempt") {
    const resolution = extract?.action_resolution ?? extract?.state_delta?.action_resolution ?? null;
    const validated = validateActionResolution(resolution, contract);
    if (!validated) {
      const filtered2 = {
        ...extract,
        state_delta: {
          ...extract?.state_delta ?? {},
          event_ledger: filterSexualCompletionEvents(extract?.state_delta?.event_ledger, contract.target_id),
          sexual_event_ledger: filterContractSexualLedger(extract?.state_delta?.sexual_event_ledger, contract, [])
        }
      };
      return stripPlayerSexualCompletion(stripAttemptMilestones(filtered2, contract.target_id));
    }
    if (validated.npc_response === "accepted" && validated.voluntary && validated.completed_action_types.length) {
      return applyAcceptedActionScope(extract, contract, validated);
    }
    const filtered = {
      ...extract,
      state_delta: {
        ...extract?.state_delta ?? {},
        event_ledger: filterSexualCompletionEvents(extract?.state_delta?.event_ledger, contract.target_id),
        sexual_event_ledger: filterContractSexualLedger(extract?.state_delta?.sexual_event_ledger, contract, [])
      }
    };
    return stripPlayerSexualCompletion(stripAttemptMilestones(filtered, contract.target_id));
  }
  return extract;
}
__name(applyContractStateFirewall, "applyContractStateFirewall");
function applyBlockedContractFirewall(extract, contract) {
  const stateDelta = extract?.state_delta ?? {};
  const next = { ...extract, state_delta: { ...stateDelta } };
  const targetId = contract.target_id;
  if (next.state_delta.npc_relationship_state && typeof next.state_delta.npc_relationship_state === "object") {
    const rel = {};
    for (const [id, patch] of Object.entries(next.state_delta.npc_relationship_state)) {
      const p = targetId == null || id === targetId ? stripContractMilestones(patch, targetId, null) : patch;
      rel[id] = p;
    }
    next.state_delta.npc_relationship_state = rel;
  }
  next.state_delta.event_ledger = filterSexualCompletionEvents(next.state_delta.event_ledger, targetId);
  return next;
}
__name(applyBlockedContractFirewall, "applyBlockedContractFirewall");
function buildBoundaryFollowupSection(save, expectedTurn, master) {
  const pending = save?.pending_boundary_followup;
  if (!pending || typeof pending !== "object") return "";
  if (pending.expires_after_turn !== expectedTurn) return "";
  const targetId = pending.target_character_id;
  const targetEntry = [...master?.characters ?? [], ...master?.general_npcs ?? []].find((entry) => (entry.character_id ?? entry.npc_id ?? entry.id) === targetId);
  const targetName = typeof targetEntry?.name === "string" && targetEntry.name ? targetEntry.name : targetId ?? "\uC0C1\uB300";
  const actionLabel = Array.isArray(pending.action_types) && pending.action_types.length ? pending.action_types.join(", ") : "\uCE5C\uBC00 \uD589\uB3D9";
  return `

[BOUNDARY CONTINUITY FOLLOW-UP \u2014 ${targetName}]
\uC9C1\uC804 \uD134(${pending.source_turn})\uC758 ${targetName}\uC5D0 \uB300\uD55C \uD589\uB3D9(${actionLabel})\uC740 \uD65C\uC131 CSA\uB098 \uD68C\uC0AC \uADDC\uC815\uC774 \uD5C8\uC6A9\uD55C \uBC94\uC704\uAC00 \uC544\uB2C8\uC5C8\uB2E4.
\uC9C1\uC804 \uC11C\uC0AC\uC5D0\uC11C ${targetName}\uC774(\uAC00) \uC774\uBBF8 \uBD84\uBA85\uD788 \uAC70\uC808\uD558\uAC70\uB098 \uC911\uB2E8\uD588\uB2E4\uBA74 \uAC19\uC740 \uB9D0\uC744 \uBC18\uBCF5\uD558\uC9C0 \uB9D0\uACE0 \uADF8 \uACBD\uACC4\uB97C \uC77C\uAD00\uB418\uAC8C \uC720\uC9C0\uD55C\uB2E4.
\uC9C1\uC804 \uC11C\uC0AC\uAC00 \uBAA8\uD638\uD558\uAC70\uB098 ${targetName}\uC774(\uAC00) \uC21C\uAC04\uC801\uC73C\uB85C \uD589\uB3D9\uC744 \uB530\uB77C\uAC04 \uAC83\uCC98\uB7FC \uBCF4\uC600\uB2E4\uBA74, ${targetName}\uC740(\uB294) \uC774\uBC88 \uD134 \uCD08\uBC18\uC5D0 \uADF8\uAC83\uC774 \uADDC\uC815 \uB54C\uBB38\uC774 \uC544\uB2C8\uC5C8\uC74C\uC744 \uC2A4\uC2A4\uB85C \uC778\uC2DD\uD55C\uB2E4. \uC21C\uAC04\uC801\uC778 \uB2F9\uD669, \uC5BC\uC5B4\uBD99\uC74C, \uC0C1\uD669 \uC624\uD574, \uB4A4\uB2A6\uC740 \uD310\uB2E8\uC73C\uB85C \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC124\uBA85\uD560 \uC218 \uC788\uB2E4.
${targetName}\uC740(\uB294) "\uC544\uAE4C\uB294 \uC21C\uAC04\uC801\uC73C\uB85C \uACF5\uC9C0 \uBC94\uC704\uB97C \uC798\uBABB \uBC1B\uC544\uB4E4\uC600\uB2E4", "\uB2E4\uC2DC \uC0DD\uAC01\uD574 \uBCF4\uB2C8 \uADF8\uAC74 \uADDC\uC815\uC5D0 \uD3EC\uD568\uB418\uC9C0 \uC54A\uB294\uB2E4"\uCC98\uB7FC \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC120\uC744 \uAE0B\uACE0, \uD604\uC7AC\uC758 \uC790\uBC1C\uC801\uC778 \uC120\uD0DD\uACFC \uACBD\uACC4\uB97C \uD68C\uBCF5\uD55C\uB2E4. \uC774 \uD6C4\uC18D \uCC98\uB9AC\uB294 ${targetName}\uC5D0\uAC8C\uB9CC \uC801\uC6A9\uB418\uBA70 \uB2E4\uB978 NPC\uC5D0\uAC8C \uC804\uD30C\uD558\uC9C0 \uC54A\uB294\uB2E4.`;
}
__name(buildBoundaryFollowupSection, "buildBoundaryFollowupSection");
function createTurnRoutes({ fetchImpl, edition: edition2 }) {
  const DEFAULT_OPENING_CHOICES = [
    "\uBD84\uC704\uAE30\uB97C \uC0B4\uD53C\uBA70 \uCCAB\uC778\uC0AC\uB97C \uAC74\uB128\uB2E4.",
    "\uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC790\uB9AC\uC5D0 \uC549\uC544 \uC5C5\uBB34\uB97C \uC2DC\uC791\uD55C\uB2E4.",
    "\uC0C8 \uB3D9\uB8CC\uC5D0\uAC8C \uBA3C\uC800 \uB9D0\uC744 \uAC78\uC5B4 \uBCF8\uB2E4.",
    "\uC870\uC6A9\uD788 \uC815\uB9AC\uD558\uBA70 \uC0C1\uD669\uC744 \uD30C\uC545\uD55C\uB2E4."
  ];
  const APP_TRANSACTION_STORY_FALLBACK_ERRORS = /* @__PURE__ */ new Set(["story_timeout", "llm_upstream_failure", "story_incomplete"]);
  function buildAppTransactionFallbackStory(csaPlan, save) {
    const operations = Array.isArray(csaPlan?.canonical_action?.operations) ? csaPlan.canonical_action.operations : [];
    const rules = save && typeof save.csa_rules === "object" && save.csa_rules ? save.csa_rules : {};
    const sceneLines = [];
    for (const op of operations) {
      const label = op?.preset?.label ?? (op?.operation === "deactivate" && op?.id ? rules[op.id]?.content : null) ?? (typeof op?.content === "string" && op.content.trim() ? String(op.content).slice(0, 40) : null) ?? "\uD574\uB2F9 \uADDC\uCE59";
      if (op?.operation === "deactivate") {
        sceneLines.push(`\u300C${label}\u300D \uADDC\uCE59\uC774 \uD574\uC81C\uB418\uC5B4 \uB354 \uC774\uC0C1 \uD604\uC7AC \uD68C\uC0AC \uADDC\uC815\uC774 \uC544\uB2D9\uB2C8\uB2E4.`);
      } else if (op?.operation === "activate") {
        sceneLines.push(`\u300C${label}\u300D \uADDC\uCE59\uC774 \uC0C8\uB85C \uC801\uC6A9\uB418\uC5B4 \uD604\uC7AC \uC5C5\uBB34 \uD658\uACBD\uC5D0 \uBC18\uC601\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`);
      } else if (op?.operation === "update") {
        sceneLines.push(`\u300C${label}\u300D \uADDC\uCE59\uC774 \uBCC0\uACBD\uB418\uC5B4 \uD604\uC7AC \uC5C5\uBB34 \uD658\uACBD\uC5D0 \uBC18\uC601\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`);
      }
    }
    if (sceneLines.length === 0) sceneLines.push("\uD68C\uC0AC \uADDC\uC815\uC774 \uBCC0\uACBD\uB418\uC5B4 \uD604\uC7AC \uC5C5\uBB34 \uD658\uACBD\uC5D0 \uBC18\uC601\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    return `[SCENE]
${sceneLines.join("\n")}`;
  }
  __name(buildAppTransactionFallbackStory, "buildAppTransactionFallbackStory");
  function buildFallbackOpeningStory(openingPlan, player) {
    const name = typeof player?.name === "string" && player.name.trim() ? player.name.trim() : "\uD50C\uB808\uC774\uC5B4";
    const location = openingPlan?.location_name ?? "\uC0AC\uBB34\uC2E4";
    const hook = openingPlan?.work_hook_label ? `, ${openingPlan.work_hook_label}\uC744(\uB97C) \uC2DC\uC791\uD558\uBA70` : "";
    return `[1. \uC11C\uC0AC \uBC0F \uD589\uB3D9]
\uD68C\uC0AC\uC758 \uCCAB \uB0A0, ${name}\uC740(\uB294) ${location}\uC5D0 \uB3C4\uCC29\uD588\uB2E4${hook}. \uC0C8\uB85C\uC6B4 \uC5C5\uBB34 \uD658\uACBD\uC5D0\uC11C \uCCAB \uC7A5\uBA74\uC774 \uC2DC\uC791\uB418\uC5C8\uB2E4.
[4. \uC120\uD0DD\uC9C0]
1. \uBD84\uC704\uAE30\uB97C \uC0B4\uD53C\uBA70 \uCCAB\uC778\uC0AC\uB97C \uAC74\uB128\uB2E4.
2. \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC790\uB9AC\uC5D0 \uC549\uC544 \uC5C5\uBB34\uB97C \uC2DC\uC791\uD55C\uB2E4.
3. \uC0C8 \uB3D9\uB8CC\uC5D0\uAC8C \uBA3C\uC800 \uB9D0\uC744 \uAC78\uC5B4 \uBCF8\uB2E4.
4. \uC870\uC6A9\uD788 \uC815\uB9AC\uD558\uBA70 \uC0C1\uD669\uC744 \uD30C\uC545\uD55C\uB2E4.`;
  }
  __name(buildFallbackOpeningStory, "buildFallbackOpeningStory");
  const master = masterFromEdition(edition2);
  const npcIds = npcIdsFromEdition(edition2);
  const catalogs = catalogsFromEdition(edition2);
  const heroineIds = Object.keys(edition2?.characters?.characters ?? {});
  const csaCatalog = csaCatalogFromEdition(edition2);
  return {
    async context(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, "game_id");
      const recentTurns = Math.min(Math.max(Number.isInteger(body.recent_turns) ? body.recent_turns : 15, 1), 50);
      const db = createSupabaseClient(env, fetchImpl);
      const timing = {};
      try {
        const contextRpcStart = Date.now();
        const context = await db.callRpc("get_company_context", { p_game_id: gameId, p_recent_turns: recentTurns });
        timing.context_rpc_ms = Date.now() - contextRpcStart;
        return ok({ context: hydratedSaveContext(context, master) });
      } finally {
        logTurnTiming({ event_stage: "context", request_id: requestId, game_id: gameId, context_rpc_ms: timing.context_rpc_ms, turn_total_ms: Date.now() - startedAt });
      }
    },
    /**
     * Read-only, paginated turn history. game_turns already carries everything needed (no new
     * RPC); record_status='active' dedupes a revised turn to only its current revision. Zero
     * LLM calls, zero mutation. player_inner_thought is read from the stored parsed_blocks;
     * only falls back to re-parsing story_text (never writing the result back to the DB) for a
     * legacy/empty parsed_blocks row.
     */
    async history(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, "game_id");
      const beforeTurn = Number.isInteger(body.before_turn) && body.before_turn > 0 ? body.before_turn : null;
      const limit = Math.min(Math.max(Number.isInteger(body.limit) ? body.limit : 20, 1), 50);
      const db = createSupabaseClient(env, fetchImpl);
      try {
        const rows = await db.listTurns(gameId, { beforeTurn, limit: limit + 1 });
        const hasMore = rows.length > limit;
        const page = hasMore ? rows.slice(0, limit) : rows;
        const records = page.map((row) => {
          const parsedBlocks2 = plainObject2(row.parsed_blocks) && Object.keys(row.parsed_blocks).length ? row.parsed_blocks : parseNarrative(row.story_text ?? "", { master });
          return {
            turn_number: row.turn_number,
            player_input: row.player_action,
            player_action: row.player_action,
            story_text: row.story_text,
            parsed_blocks: parsedBlocks2,
            turn_summary: row.turn_summary,
            mind_monitor: row.mind_monitor,
            player_inner_thought: typeof parsedBlocks2?.player_inner_thought === "string" ? parsedBlocks2.player_inner_thought : "",
            structured_action: row.structured_action ?? null,
            feedback_text: row.feedback_text ?? null,
            committed_at: row.committed_at
          };
        });
        return ok({ records, has_more: hasMore, next_before_turn: hasMore ? page[page.length - 1]?.turn_number ?? null : null });
      } finally {
        logTurnTiming({ event_stage: "history", request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },
    async story(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const { gameId, actionId } = actionIds(body);
      const expectedTurn = body.expected_turn;
      const requestedStructuredAction = body.structured_action ?? null;
      const playerAction = requireString(body.player_action, "player_action");
      if (!Number.isInteger(expectedTurn) || expectedTurn < 1) throw new HttpError(400, "invalid_request", "expected_turn must be a positive integer");
      const db = createSupabaseClient(env, fetchImpl);
      const existingAction = await db.getAction(gameId, actionId).catch(() => null);
      const reservation = existingAction?.action_kind === "feedback_revision" ? { action_id: existingAction.action_id, turn_id: existingAction.turn_id, expected_turn: existingAction.expected_turn, replayed: false } : await db.reserveTurnAction(gameId, actionId, expectedTurn, playerAction, requestedStructuredAction);
      const resolvedActionId = reservation?.action_id ?? actionId;
      const action = actionOrNotFound(existingAction ?? await db.getAction(gameId, resolvedActionId));
      const structuredAction = structuredActionFor(action, requestedStructuredAction);
      let retryingStory = false;
      if (!action.story_text && (action.processing_status === "story_failed" || action.processing_status === "story_streaming")) {
        const claimed = await db.claimActionStatus(gameId, resolvedActionId, action.processing_status, "story_streaming", null);
        if (!claimed) throw new HttpError(409, "action_in_progress", "Action retry is already in progress", true);
        Object.assign(action, claimed);
        retryingStory = true;
      }
      const meta = { action_id: reservation.action_id ?? actionId, turn_id: reservation.turn_id ?? action.turn_id, expected_turn: reservation.expected_turn ?? expectedTurn, replayed: Boolean(action.story_text) };
      if (action.story_text) {
        logTurnTiming({ event_stage: "story", request_id: requestId, action_id: meta.action_id, game_id: gameId, expected_turn: meta.expected_turn, replayed: true, turn_total_ms: Date.now() - startedAt });
        return storySse({ meta: { ...meta, replayed: true }, run: /* @__PURE__ */ __name(async (emit) => {
          const replayBlocks = action.parsed_blocks;
          if (replayBlocks?.structured_story_version === STRUCTURED_STORY_VERSION && Array.isArray(replayBlocks.stream_segments)) {
            for (const segment of replayBlocks.stream_segments) {
              if (segment?.kind === "block" && segment.block) {
                emit("block", { block: segment.block });
                emit("delta", { text: segment.text });
              } else if (segment?.text) {
                emit("delta", { text: segment.text });
              }
            }
            emit("complete", {
              action_id: meta.action_id,
              turn_id: meta.turn_id,
              warnings: replayBlocks.warnings ?? [],
              parsed_blocks: replayBlocks,
              replayed: true,
              action_route: replayBlocks.action_route,
              csa_covered: replayBlocks.csa_covered
            });
          } else {
            emit("delta", { text: action.story_text });
            const parsed = action.parsed_blocks ?? parseNarrative(action.story_text);
            emit("complete", { action_id: meta.action_id, turn_id: meta.turn_id, warnings: parsed.warnings ?? [], parsed_blocks: action.parsed_blocks ?? parsed, replayed: true });
          }
        }, "run") });
      }
      if (reservation.replayed && !retryingStory || action.processing_status !== "story_streaming") {
        throw new HttpError(409, "action_in_progress", "Action already has recoverable work in progress", true);
      }
      return storySse({ meta, run: /* @__PURE__ */ __name(async (emit) => {
        let raw = "";
        let storyPersisted = false;
        const timing = {};
        try {
          const contextRpcStart = Date.now();
          const context = await db.callRpc("get_company_context", { p_game_id: gameId, p_recent_turns: 15 });
          timing.context_rpc_ms = Date.now() - contextRpcStart;
          const hydratedContext = hydratedSaveContext(context, master);
          const hydratedSave2 = hydratedContext.save?.data ?? hydratedContext.save;
          const csaPlan = await resolveCsaTransactionPlan({ env, gameId, structuredAction, save: hydratedSave2, csaCatalog, expectedTurn });
          const storySave = csaPlan ? { ...hydratedSave2, csa_active: csaPlan.next_csa_active, csa_rules: csaPlan.next_csa_rules } : hydratedSave2;
          const storyContext = csaPlan ? {
            ...hydratedContext,
            save: hydratedContext.save?.data ? { ...hydratedContext.save, data: storySave } : storySave
          } : hydratedContext;
          const contractStart = Date.now();
          const actionContract = action.parsed_blocks?.action_execution_contract ?? resolveActionExecutionContract({
            save: hydratedSave2,
            playerAction,
            csaCatalog,
            characters: master.characters,
            npcIds: master.general_npcs
          });
          timing.action_contract_ms = Date.now() - contractStart;
          timing.action_route = actionContract.route;
          timing.action_material = actionContract.material_action ? 1 : 0;
          timing.action_csa_covered = actionContract.csa_coverage.covered ? 1 : 0;
          timing.action_permission_level = actionContract.contextual_permission?.level ?? "none";
          timing.action_privacy = actionContract.contextual_permission?.privacy ?? "unknown";
          timing.action_attempt_basis = actionContract.attempt_basis ?? "insufficient";
          const sceneCastContract = buildSceneCastContract({
            save: hydratedSave2,
            master,
            playerAction,
            structuredAction,
            actionContract,
            mapLocations: Array.isArray(edition2?.map?.locations) ? edition2.map.locations : []
          });
          const speakerNames = speakerNameById(master, hydratedSave2?.player?.name);
          timing.cast_present_count = sceneCastContract.present_npc_ids.length;
          timing.cast_entering_count = sceneCastContract.entering_npc_ids.length;
          timing.cast_player_dialogue_mode = sceneCastContract.player_dialogue.mode;
          const promptStart = Date.now();
          let messages = buildStoryPrompt({ edition: edition2, context: storyContext, playerAction, expectedTurn, npcIds, catalogs, sceneCastContract });
          messages = applyCsaStorySections(messages, { save: storySave, plan: csaPlan, playerAction, csaCatalog, actionContract, master });
          if (!csaPlan && isAppUsageInfoRequest(playerAction)) {
            messages = [{ ...messages[0], content: messages[0].content + buildAppUsageStorySection() }, ...messages.slice(1)];
          }
          if (action.action_kind === "feedback_revision" && action.feedback_text) {
            messages = [{ ...messages[0], content: messages[0].content + buildRegenerationFeedbackSection(action.feedback_text) }, ...messages.slice(1)];
          }
          const boundarySection = buildBoundaryFollowupSection(hydratedSave2, expectedTurn, master);
          if (boundarySection) {
            messages = [{ ...messages[0], content: messages[0].content + boundarySection }, ...messages.slice(1)];
          }
          timing.story_prompt_ms = Date.now() - promptStart;
          const storyUserPayload = JSON.parse(messages[1].content);
          timing.story_system_chars = messages[0].content.length;
          timing.story_context_chars = JSON.stringify(storyUserPayload.context).length;
          timing.active_character_canon_chars = JSON.stringify(storyUserPayload.active_character_canon).length;
          timing.story_request_chars = messages[0].content.length + messages[1].content.length;
          timing.active_character_count = Object.keys(storyUserPayload.active_character_canon ?? {}).length;
          timing.recent_turn_count = Array.isArray(storyUserPayload.context?.recent_turns) ? storyUserPayload.context.recent_turns.length : 0;
          const gate = createStructuredStoryGate({ contract: sceneCastContract, speakerNames });
          const flush = /* @__PURE__ */ __name((emissions) => {
            for (const emission of emissions) {
              if (emission.kind === "block") {
                emit("block", { block: emission.block });
                emit("delta", { text: emission.text });
              } else if (emission.text) {
                emit("delta", { text: emission.text });
              }
            }
          }, "flush");
          let stream = null;
          let upstreamRaw = "";
          let storyFallback = false;
          try {
            stream = await streamStory({ env, fetchImpl, messages, timing });
            for await (const text5 of stream.chunks) {
              upstreamRaw += text5;
              flush(gate.push(text5));
            }
          } catch (error) {
            const code = error?.code;
            if (!csaPlan || !APP_TRANSACTION_STORY_FALLBACK_ERRORS.has(code)) throw error;
            storyFallback = true;
            const fallbackText = buildAppTransactionFallbackStory(csaPlan, hydratedSave2);
            upstreamRaw = fallbackText;
            flush(gate.push(fallbackText));
            timing.story_fallback = 1;
          }
          const gated = gate.end();
          flush(gated.emissions);
          raw = gated.story_text;
          const parsed = parseNarrative(raw, { master });
          const v2Blocks = (gated.segments ?? []).map(
            (seg) => seg.type === "dialogue" ? seg : { type: "scene", text: seg.text }
          );
          const v2DialogueLines = (gated.blocks ?? []).map((b) => ({
            speaker_id: b.speaker_id,
            speaker_name: b.speaker_name,
            acting_direction: b.acting_direction,
            direction: b.direction,
            text: b.text,
            order: b.order
          }));
          const mergedWarnings = [...parsed.warnings ?? [], ...gated.warnings, ...storyFallback ? ["app_story_fallback"] : []];
          const contractPersisted = {
            ...parsed,
            blocks: v2Blocks,
            dialogue_lines: v2DialogueLines,
            structured_story_version: STRUCTURED_STORY_VERSION,
            scene_cast_contract: sceneCastContract,
            dialogue_blocks: gated.blocks,
            // 수정 H — live/replay 동일 순서 재생용
            stream_segments: gated.stream_segments,
            warnings: mergedWarnings,
            action_execution_contract: actionContract,
            // 수정 10 — replay complete에서 live와 동일하게 제공할 route/csa_covered
            action_route: actionContract.route,
            csa_covered: actionContract.csa_coverage.covered
          };
          timing.gated_dialogue_blocks = gated.blocks.length;
          timing.gated_dialogue_warnings = gated.warnings.length;
          timing.upstream_story_chars = upstreamRaw.length;
          await db.callRpc("record_story_result", { p_game_id: gameId, p_action_id: actionId, p_story_text: raw, p_parsed_blocks: contractPersisted });
          storyPersisted = true;
          emit("complete", {
            action_id: meta.action_id,
            turn_id: meta.turn_id,
            warnings: mergedWarnings,
            replayed: false,
            parsed_blocks: contractPersisted,
            action_route: actionContract.route,
            csa_covered: actionContract.csa_coverage.covered
          });
        } catch (error) {
          if (!storyPersisted) {
            await db.updateActionStatus(gameId, actionId, "story_failed", error.code ?? "story_failed").catch(() => void 0);
          }
          throw error;
        } finally {
          logTurnTiming({
            event_stage: "story",
            request_id: requestId,
            action_id: meta.action_id,
            game_id: gameId,
            expected_turn: meta.expected_turn,
            context_rpc_ms: timing.context_rpc_ms,
            story_prompt_ms: timing.story_prompt_ms,
            story_headers_ms: timing.story_headers_ms,
            story_first_content_ms: timing.story_first_content_ms,
            story_network_total_ms: timing.story_network_total_ms,
            story_character_count: timing.story_character_count,
            story_system_chars: timing.story_system_chars,
            story_context_chars: timing.story_context_chars,
            active_character_canon_chars: timing.active_character_canon_chars,
            story_request_chars: timing.story_request_chars,
            active_character_count: timing.active_character_count,
            recent_turn_count: timing.recent_turn_count,
            action_contract_ms: timing.action_contract_ms,
            action_route: timing.action_route,
            action_material: timing.action_material,
            action_csa_covered: timing.action_csa_covered,
            action_permission_level: timing.action_permission_level,
            action_privacy: timing.action_privacy,
            action_attempt_basis: timing.action_attempt_basis,
            turn_total_ms: Date.now() - startedAt
          });
        }
      }, "run") });
    },
    async extract(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const { gameId, actionId } = actionIds(body);
      const db = createSupabaseClient(env, fetchImpl);
      const action = actionOrNotFound(await db.getAction(gameId, actionId));
      if (!action.story_text) throw new HttpError(409, "story_required", "A completed Story is required before Extract", true);
      const structuredAction = structuredActionFor(action, body.structured_action ?? null);
      if (action.extract_delta) {
        const replayParsedStory = action.parsed_blocks ?? parseNarrative(action.story_text, { master });
        const extract = normalizeGameplayExtractEnvelope(action.extract_delta, { parsedStory: replayParsedStory, npcIds });
        logTurnTiming({ event_stage: "extract", request_id: requestId, action_id: actionId, game_id: gameId, replayed: true, turn_total_ms: Date.now() - startedAt });
        return ok({ action_id: actionId, extract, warnings: extract.warnings, replayed: true, parsed_blocks: replayParsedStory });
      }
      if (action.processing_status === "extract_failed") {
        const claimedRetry = await db.claimActionStatus(gameId, actionId, "extract_failed", "extracting", null);
        if (!claimedRetry) throw new HttpError(409, "action_in_progress", "Action retry is already in progress", true);
        Object.assign(action, claimedRetry);
      }
      if (action.processing_status !== "extracting") throw new HttpError(409, "action_in_progress", "Action is not ready for Extract", true);
      if (action.error_code === "extract_in_progress") throw new HttpError(409, "action_in_progress", "Extract is already in progress", true);
      const claimedExtract = await db.claimActionStatus(gameId, actionId, "extracting", "extracting", "extract_in_progress", true);
      if (!claimedExtract) throw new HttpError(409, "action_in_progress", "Extract is already in progress", true);
      Object.assign(action, claimedExtract);
      const timing = {};
      let degraded = false;
      try {
        let parsedStory = action.parsed_blocks ?? parseNarrative(action.story_text, { master });
        const structuredV2 = parsedStory?.structured_story_version === STRUCTURED_STORY_VERSION;
        let storyForExtract = structuredV2 ? buildStructuredStoryV2ExtractText(parsedStory) : (parsedStory?.normalized_raw ?? "").trim() ? parsedStory.normalized_raw : action.story_text;
        let extract;
        try {
          const contextRpcStart = Date.now();
          const context = await db.callRpc("get_company_context", { p_game_id: gameId, p_recent_turns: 15 });
          timing.context_rpc_ms = Date.now() - contextRpcStart;
          const hydratedContext = hydratedSaveContext(context, master);
          const hydratedSave2 = hydratedContext.save?.data ?? hydratedContext.save;
          const csaPlan = await resolveCsaTransactionPlan({ env, gameId, structuredAction, save: hydratedSave2, csaCatalog, expectedTurn: action.expected_turn });
          const applicableCsa = getApplicableCsaEntries(hydratedSave2);
          const hasSexualCsa = applicableCsa.some((csa) => buildCsaSemanticContract(csa, csaCatalog?.sexual_action_contract).sexual_authorization === true);
          try {
            const playerName = hydratedSave2?.player?.name ?? "\uD50C\uB808\uC774\uC5B4";
            const playerCanonical = resolvePlayerCanonicalNames(hydratedSave2?.player ?? {}, catalogs);
            const playerInfo = {
              departmentName: playerCanonical?.departmentName ?? hydratedSave2?.player?.department ?? "",
              positionName: playerCanonical?.positionName ?? "",
              roleTitle: typeof hydratedSave2?.player?.role_title === "string" ? hydratedSave2.player.role_title : "",
              addresses: [],
              addressingDescription: hydratedSave2?.player?.prompt_card?.addressing ?? ""
            };
            const sceneParticipantIds = buildSceneCandidateIds(parsedStory, {
              sceneParticipants: Array.isArray(hydratedSave2?.last_npcs_present) ? hydratedSave2.last_npcs_present : [],
              focalCharacterId: hydratedSave2?.focal_character_id ?? null,
              lastSpeakerId: hydratedSave2?.last_speaker_id ?? null,
              master
            });
            const unresolvedItems = collectUnresolvedDialogue(parsedStory);
            const attempted = action.parsed_blocks?.speaker_tagging_attempted === true;
            const structuredV22 = parsedStory?.structured_story_version === STRUCTURED_STORY_VERSION;
            if (unresolvedItems.length && !attempted && !structuredV22) {
              const claimed = await db.markSpeakerTaggingAttempted(gameId, actionId, parsedStory);
              if (claimed) {
                const tagMessages = buildTaggingMessages(parsedStory, master, {
                  playerName,
                  playerInfo,
                  sceneParticipants: sceneParticipantIds,
                  focalCharacterId: hydratedSave2?.focal_character_id ?? null,
                  lastSpeakerId: hydratedSave2?.last_speaker_id ?? null
                });
                const tagStart = Date.now();
                const tagResult = await runSpeakerTagging({
                  env,
                  fetchImpl,
                  messages: tagMessages,
                  allowlist: allowedSpeakerIds(master),
                  timeoutMs: 1e4
                });
                timing.tagging_ms = Date.now() - tagStart;
                timing.speaker_tagging_attempted = 1;
                timing.speaker_tagging_unresolved_count = unresolvedItems.length;
                if (tagResult.warning) timing.speaker_tagging_warning = tagResult.warning;
                let status = "unresolved";
                if (tagResult.warning === "speaker_tagging_timeout") status = "timeout";
                else if (tagResult.warning === "speaker_tagging_upstream_failure") status = "upstream_failure";
                else if (tagResult.warning === "speaker_tagging_invalid_json" || tagResult.warning === "speaker_tagging_truncated") status = "invalid_response";
                else if (tagResult.speakers?.some((s) => s.speaker_id)) status = "applied";
                if (status === "applied") {
                  const applied = applySpeakerTags(parsedStory, tagResult.speakers, master, {
                    playerName,
                    unresolvedItems,
                    rawStory: action.story_text
                  });
                  timing.speaker_tagging_resolved_count = applied.appliedCount;
                  timing.speaker_tagging_rejected_count = applied.rejectedCount;
                  if (applied.changed) {
                    const saved = await db.updateActionParsedBlocks(gameId, actionId, applied.parsedStory);
                    if (saved) {
                      parsedStory = applied.parsedStory;
                      storyForExtract = applied.parsedStory.normalized_raw_extract.trim() ? applied.parsedStory.normalized_raw_extract : applied.parsedStory.normalized_raw.trim() ? applied.parsedStory.normalized_raw : storyForExtract;
                    } else {
                      timing.speaker_tagging_error = "parsed_blocks_save_failed";
                      await db.updateSpeakerTaggingStatus(gameId, actionId, { ...parsedStory, speaker_tagging_attempted: true }, "unresolved").catch(() => void 0);
                    }
                  } else {
                    await db.updateSpeakerTaggingStatus(gameId, actionId, { ...parsedStory, speaker_tagging_attempted: true }, "unresolved").catch(() => void 0);
                  }
                } else {
                  await db.updateSpeakerTaggingStatus(gameId, actionId, { ...parsedStory, speaker_tagging_attempted: true }, status).catch(() => void 0);
                }
              } else {
                timing.speaker_tagging_error = "attempt_marker_save_failed";
              }
            }
          } catch (tagError) {
            timing.speaker_tagging_error = String(tagError?.message ?? tagError).slice(0, 200);
          }
          const promptStart = Date.now();
          let messages = buildExtractPrompt({ context: hydratedContext, storyText: storyForExtract, parsedStory, playerAction: action.player_action, expectedTurn: action.expected_turn, edition: edition2, npcIds, sceneCastContract: parsedStory.scene_cast_contract ?? action.scene_cast_contract });
          const storedContract = action.parsed_blocks?.action_execution_contract;
          if (storedContract) {
            try {
              const payload = JSON.parse(messages[1].content);
              payload.action_execution_contract = storedContract;
              messages[1] = { ...messages[1], content: JSON.stringify(payload) };
            } catch {
            }
            if (storedContract.route === "ordinary_direct_attempt" || storedContract.route === "ordinary_direct_blocked") {
              messages[0] = {
                ...messages[0],
                content: messages[0].content + "\nIf the contract route is attempt/blocked, also output action_resolution:{target_id,route,npc_response,voluntary,completed_action_types}. npc_response: accepted|partially_accepted|refused|interrupted|ambiguous. accepted requires explicit allowance, mutual response, or conditioned consent in the story \u2014 arousal/body reactions(\uD765\uBD84, \uBD89\uC74C, \uC816\uC74C, \uB5A8\uB9BC, \uC5BC\uC5B4\uBD99\uC74C, \uC800\uD56D \uC5C6\uC74C) alone are NOT accepted grounds. blocked\uBA74 completed_action_types\uB294 \uBE48 \uBC30\uC5F4."
              };
            }
          }
          const extractFirewall = buildMindEffectExtractFirewallSection({ hasApplicableCsa: applicableCsa.length > 0, hasCsaTransaction: Boolean(csaPlan) }) + buildCsaApplicationCheckSection(applicableCsa) + buildCsaRuntimeExtractContractSection(applicableCsa) + buildChoiceStructuredMetaExtractContractSection(hasSexualCsa);
          if (extractFirewall) messages = [{ ...messages[0], content: messages[0].content + extractFirewall }, ...messages.slice(1)];
          timing.extract_prompt_ms = Date.now() - promptStart;
          const extractUserPayload = JSON.parse(messages[1].content);
          timing.extract_system_chars = messages[0].content.length;
          timing.extract_context_chars = JSON.stringify(extractUserPayload.context).length;
          timing.parsed_story_chars = JSON.stringify(extractUserPayload.parsed_story).length;
          timing.extract_request_chars = messages[0].content.length + messages[1].content.length;
          timing.active_character_count = activeCountFromNpcState(extractUserPayload.context?.active_npc_state);
          const llmStart = Date.now();
          const raw = await runExtract({ env, fetchImpl, messages });
          timing.extract_llm_ms = Date.now() - llmStart;
          const parseStart = Date.now();
          extract = normalizeGameplayExtractEnvelope(raw, { parsedStory, npcIds });
          timing.extract_parse_ms = Date.now() - parseStart;
        } catch (error) {
          const degradable = error instanceof HttpError && EXTRACT_DEGRADE_CODES.has(error.code) || error instanceof GameCoreError && error.code === "INVALID_EXTRACT";
          if (!degradable) {
            await db.updateActionStatus(gameId, actionId, "extract_failed", error.code ?? "extract_failed").catch(() => void 0);
            throw error;
          }
          degraded = true;
          extract = buildDegradedExtractEnvelope({ parsedStory, playerAction: action.player_action, extraWarnings: [`extract_error:${error.code ?? error.name ?? "unknown"}`] });
        }
        try {
          await db.callRpc("record_extract_result", { p_game_id: gameId, p_action_id: actionId, p_extract_delta: extract });
        } catch (error) {
          await db.updateActionStatus(gameId, actionId, "extract_failed", error.code ?? "extract_failed").catch(() => void 0);
          throw error;
        }
        try {
          await db.updateActionStatus(gameId, actionId, "committing");
        } catch {
          await db.getAction(gameId, actionId).catch(() => null);
        }
        return ok({ action_id: actionId, extract, warnings: extract.warnings, replayed: false, degraded, parsed_blocks: parsedStory });
      } finally {
        logTurnTiming({
          event_stage: "extract",
          request_id: requestId,
          action_id: actionId,
          game_id: gameId,
          context_rpc_ms: timing.context_rpc_ms,
          extract_prompt_ms: timing.extract_prompt_ms,
          extract_llm_ms: timing.extract_llm_ms,
          extract_parse_ms: timing.extract_parse_ms,
          extract_degraded: degraded,
          extract_system_chars: timing.extract_system_chars,
          extract_context_chars: timing.extract_context_chars,
          parsed_story_chars: timing.parsed_story_chars,
          extract_request_chars: timing.extract_request_chars,
          active_character_count: timing.active_character_count,
          tagging_ms: timing.tagging_ms,
          speaker_tagging_attempted: timing.speaker_tagging_attempted,
          speaker_tagging_unresolved_count: timing.speaker_tagging_unresolved_count,
          speaker_tagging_resolved_count: timing.speaker_tagging_resolved_count,
          speaker_tagging_rejected_count: timing.speaker_tagging_rejected_count,
          speaker_tagging_warning: timing.speaker_tagging_warning,
          speaker_tagging_error: timing.speaker_tagging_error,
          turn_total_ms: Date.now() - startedAt
        });
      }
    },
    async commit(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const { gameId, actionId } = actionIds(body);
      const expectedTurn = body.expected_turn;
      if (!Number.isInteger(expectedTurn) || expectedTurn < 1) throw new HttpError(400, "invalid_request", "expected_turn must be a positive integer");
      const db = createSupabaseClient(env, fetchImpl);
      const timing = {};
      try {
        const action = actionOrNotFound(await db.getAction(gameId, actionId));
        const structuredAction = structuredActionFor(action, body.structured_action ?? null);
        if (!action.story_text || !action.extract_delta) throw new HttpError(409, "action_incomplete", "Story and Extract are required before Commit", true);
        const contextRpcStart = Date.now();
        const context = await db.callRpc("get_company_context", { p_game_id: gameId, p_recent_turns: 15 });
        timing.context_rpc_ms = Date.now() - contextRpcStart;
        const currentSave = context.save?.data ?? context.save;
        let parsedStory = action.parsed_blocks ?? parseNarrative(action.story_text, { master });
        const extract = normalizeGameplayExtractEnvelope(action.extract_delta, { parsedStory, npcIds });
        const blockedContract = action.parsed_blocks?.action_execution_contract;
        const firewalledExtract = applyContractStateFirewall(extract, blockedContract);
        const mergeStart = Date.now();
        const merged = applyGuardedStateDelta(currentSave, firewalledExtract, {
          expectedTurn,
          actionId,
          turnId: action.turn_id,
          playerAction: action.player_action,
          parsedStory,
          master,
          npcIds,
          storyText: (parsedStory?.normalized_raw ?? "").trim() ? parsedStory.normalized_raw : action.story_text
        });
        timing.guarded_merge_ms = Date.now() - mergeStart;
        const { nextSave, warnings } = merged;
        let movementResult = { applied: false, reason: "not_checked", warnings: [] };
        if (action.action_kind !== "feedback_revision") {
          movementResult = sanitizeMovementCommit({
            beforeSave: currentSave,
            nextSave,
            sceneCastContract: action.parsed_blocks?.scene_cast_contract ?? null,
            extractEnvelope: firewalledExtract,
            actionKind: action.action_kind,
            expectedTurn
          });
          warnings.push(...movementResult.warnings);
        }
        const commitContract = action.parsed_blocks?.action_execution_contract;
        if (commitContract?.schedule_boundary_followup && commitContract.route === "ordinary_direct_blocked") {
          nextSave.pending_boundary_followup = {
            source_turn: expectedTurn,
            target_character_id: commitContract.target_id,
            action_types: commitContract.action_types,
            reason_code: commitContract.reason_code,
            expires_after_turn: expectedTurn + 1
          };
        } else if (nextSave.pending_boundary_followup?.expires_after_turn <= expectedTurn) {
          delete nextSave.pending_boundary_followup;
        }
        const csaPlan = await resolveCsaTransactionPlan({ env, gameId, structuredAction, save: currentSave, csaCatalog, expectedTurn });
        if (csaPlan) {
          nextSave.csa_active = csaPlan.next_csa_active;
          nextSave.csa_rules = csaPlan.next_csa_rules;
        }
        const activeCsaAfterPlan = getApplicableCsaEntries(nextSave);
        const runtimeStatePatch = buildCsaRuntimeStatePatch({
          previousSave: currentSave,
          csaRuntimeUpdates: extract.csa_runtime_updates,
          csaTriggerEvaluations: extract.csa_trigger_evaluations,
          activeCsa: activeCsaAfterPlan,
          npcsPresent: nextSave.last_npcs_present,
          turnNumber: expectedTurn
        });
        if (runtimeStatePatch) nextSave.csa_runtime_state = { ...nextSave.csa_runtime_state ?? {}, ...runtimeStatePatch };
        if (csaPlan) {
          const deactivatedIds = csaPlan.canonical_action.operations.filter((operation) => operation.operation === "deactivate").map((operation) => operation.id);
          if (deactivatedIds.length) {
            const aftereffectPatch = buildCsaAftereffectPatch({ previousSave: nextSave, deactivatedIds, npcsPresent: nextSave.last_npcs_present, turnNumber: expectedTurn });
            if (aftereffectPatch) nextSave.csa_aftereffect_state = aftereffectPatch;
          }
        }
        if (action.action_kind !== "feedback_revision") {
          const experiencedThisTurn = (Array.isArray(extract.csa_runtime_updates) ? extract.csa_runtime_updates : []).filter((update) => update.status === "active").map((update) => ({ character_id: update.character_id, csa_id: update.csa_id }));
          const previouslyExperienced = new Set(Array.isArray(currentSave.csa_experienced_ids) ? currentSave.csa_experienced_ids : []);
          const progressionAmount = calculateCsaProgression({
            csaOperations: csaPlan?.canonical_action?.operations ?? [],
            experiencedThisTurn,
            previouslyExperienced,
            degraded: extract.outcome === "degraded"
          });
          if (progressionAmount.newly_experienced_keys.length) {
            nextSave.csa_experienced_ids = [...previouslyExperienced, ...progressionAmount.newly_experienced_keys];
          }
          if (progressionAmount.amount > 0) {
            const progress = calculateProgress(currentSave.player_progress, progressionAmount.amount);
            nextSave.player_progress = { level: progress.level, exp: progress.exp };
          }
        }
        const turnChanges = deriveTurnChanges(currentSave, nextSave);
        if (action.action_kind !== "feedback_revision") {
          const summaryText = typeof extract.turn_summary === "string" && extract.turn_summary.trim() ? extract.turn_summary.trim() : String(parsedStory?.normalized_raw ?? action.story_text ?? "").trim().slice(0, 500);
          if (summaryText) nextSave.story_summary_recent = summaryText;
        }
        const finalChoices = Array.isArray(extract.choices) && extract.choices.length === 4 ? extract.choices : buildFallbackTurnChoices(currentSave);
        const commitRpcStart = Date.now();
        const commit = action.action_kind === "feedback_revision" ? await db.commitFeedbackRevision(gameId, actionId, action.revision_request_id, nextSave, extract.turn_summary, merged.mind_monitor, extract.choices) : await db.callRpc("commit_company_turn", {
          p_game_id: gameId,
          p_action_id: actionId,
          p_expected_turn: expectedTurn,
          p_next_save: nextSave,
          p_turn_summary: extract.turn_summary,
          p_mind_monitor: merged.mind_monitor,
          p_choices: finalChoices
        });
        timing.commit_rpc_ms = Date.now() - commitRpcStart;
        if (commit?.success === false && commit?.error === "expected_turn_conflict") {
          return ok({ commit, next_save: null, warnings, turn_changes: [], terminated: true });
        }
        return ok({
          commit,
          next_save: nextSave,
          warnings,
          turn_changes: turnChanges,
          time_before: merged.time_before,
          elapsed_minutes: merged.elapsed_minutes,
          time_after: merged.time_after
        });
      } finally {
        logTurnTiming({
          event_stage: "commit",
          request_id: requestId,
          action_id: actionId,
          game_id: gameId,
          expected_turn: expectedTurn,
          context_rpc_ms: timing.context_rpc_ms,
          guarded_merge_ms: timing.guarded_merge_ms,
          commit_rpc_ms: timing.commit_rpc_ms,
          turn_total_ms: Date.now() - startedAt
        });
      }
    },
    /**
     * Deterministic, zero-LLM image selection. Queries only the requested character's active
     * rows for the requested pool (at most 8, already ordered by curation_rank at the DB layer)
     * and scores them in image-selector.js — the full image_library catalog never reaches this
     * route's caller, let alone a Story prompt. A selection failure (no candidates in either
     * pool) returns image: null rather than throwing; this must never block a turn.
     */
    async image(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, "game_id");
      const characterId = requireString(body.character_id, "character_id");
      const pool = body.pool === "sex" ? "sex" : "general";
      const db = createSupabaseClient(env, fetchImpl);
      try {
        const candidates = await db.listImageCandidates(characterId, pool);
        const selected = selectImage(candidates, {
          situation: typeof body.situation === "string" ? body.situation : null,
          tags: Array.isArray(body.tags) ? body.tags : [],
          locationId: typeof body.location_id === "string" ? body.location_id : null
        });
        return ok({ character_id: characterId, image: selected });
      } finally {
        logTurnTiming({ event_stage: "image", request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },
    /**
     * TTS is opt-in and only ever called by the frontend for a confirmed, already-rendered
     * dialogue line — this route's own job is the server-side backstop: narrator lines, unknown
     * speakers, and characters with no voice_id are all rejected before any external call is
     * made, regardless of what the client requests. A rejection or an upstream TTS failure
     * returns a normal error response; it can never fail Story/Extract/Commit since nothing in
     * that pipeline ever calls this route.
     */
    async tts(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, "game_id");
      const text5 = requireString(body.text, "text");
      const speakerId = typeof body.character_id === "string" ? body.character_id : null;
      try {
        const eligibility = resolveTtsEligibility({ speakerId, text: text5, master });
        if (!eligibility.eligible) throw new HttpError(422, eligibility.code.toLowerCase(), "TTS\uB97C \uC7AC\uC0DD\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", false);
        const ttsUrl = env?.TTS_API_URL;
        const ttsKey = env?.TTS_API_KEY;
        if (typeof ttsUrl !== "string" || !ttsUrl || typeof ttsKey !== "string" || !ttsKey) {
          throw new HttpError(500, "configuration_error", "TTS_API_URL/TTS_API_KEY is not configured", false);
        }
        let response;
        try {
          response = await fetchImpl(ttsUrl, {
            method: "POST",
            headers: { authorization: `Bearer ${ttsKey}`, "content-type": "application/json" },
            body: JSON.stringify({ voice_id: eligibility.voice_id, text: text5 })
          });
        } catch {
          throw new HttpError(502, "tts_upstream_failure", "TTS upstream request failed", true);
        }
        if (!response.ok) throw new HttpError(502, "tts_upstream_failure", "TTS upstream request failed", true);
        return new Response(response.body, { headers: { "content-type": response.headers.get("content-type") ?? "audio/mpeg", "cache-control": "public, max-age=86400" } });
      } finally {
        logTurnTiming({ event_stage: "tts", request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },
    async actionStatus(request, env) {
      const body = await readJson(request);
      const { gameId, actionId } = actionIds(body);
      const db = createSupabaseClient(env, fetchImpl);
      const status = await db.callRpc("get_action_status", { p_game_id: gameId, p_action_id: actionId });
      return ok({ status, recoverable_step: deriveRecoverableStep(status) });
    },
    /**
     * Rollback-only: reserve_feedback_revision never calls Story/Extract itself, it just stages
     * a feedback_revision action targeting the latest committed turn and returns everything the
     * frontend needs to regenerate it through the completely normal /api/story -> /api/extract
     * -> /api/commit pipeline (commit() branches to commit_feedback_revision for this
     * action_kind). revision_request_id is client-supplied, matching action_id's own
     * idempotency contract — the same request replayed with the same id returns the same
     * pending/committed action rather than reserving a second one.
     */
    async feedback(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, "game_id");
      const revisionRequestId = requireString(body.revision_request_id, "revision_request_id");
      const feedbackText = requireString(body.feedback_text, "feedback_text");
      const db = createSupabaseClient(env, fetchImpl);
      try {
        const reservation = await db.reserveFeedbackRevision(gameId, revisionRequestId, feedbackText);
        return ok({
          action_id: reservation.action_id,
          expected_turn: reservation.target_turn_number,
          original_player_action: reservation.original_player_action,
          structured_action: reservation.structured_action ?? null,
          revision_request_id: revisionRequestId,
          replayed: Boolean(reservation.replayed)
        });
      } finally {
        logTurnTiming({ event_stage: "feedback", request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },
    /** Restores turn/action/history/player/opening_state to the game_master initial save. Static content and game_master are never touched. */
    async reset(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, "game_id");
      const db = createSupabaseClient(env, fetchImpl);
      try {
        const context = await db.callRpc("get_company_context", { p_game_id: gameId, p_recent_turns: 1 });
        const title = context?.game?.title;
        if (typeof title !== "string" || !title) throw new HttpError(502, "invalid_game_title", "Game title is missing or invalid", false);
        const result = await db.callRpc("reset_company_game", { p_game_id: gameId, p_expected_title: title });
        return ok({ reset: result });
      } finally {
        logTurnTiming({ event_stage: "reset", request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },
    /** Server-side re-validates the submission against the catalog allow-lists and rolls one crypto-seeded opening plan, reused by every /api/opening retry. */
    async playerSetup(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, "game_id");
      const db = createSupabaseClient(env, fetchImpl);
      try {
        const validation = validatePlayerSetupInput(body.player, catalogs);
        if (!validation.valid) throw new HttpError(400, "invalid_player_setup", `Invalid player setup: ${validation.errors.join(", ")}`, false);
        const context = await db.callRpc("get_company_context", { p_game_id: gameId, p_recent_turns: 1 });
        const existingSetupId = (context?.save?.data ?? context?.save)?.player_setup?.setup_id;
        if (typeof existingSetupId === "string" && existingSetupId) {
          throw new HttpError(409, "opening_retry_required", "A player setup is already reserved; retry the opening or reset the game first", false);
        }
        const setupId = randomUuid();
        const openingPlan = buildOpeningPlan({ positionId: validation.player.position_id, seedBytes: randomSeedBytes(), heroineIds, locations: edition2?.map?.locations });
        const result = await db.callRpc("reserve_company_player_setup", {
          p_game_id: gameId,
          p_setup_id: setupId,
          p_player: validation.player,
          p_opening_plan: openingPlan
        });
        return ok({ setup_id: result.setup_id, opening_plan: result.opening_plan, idempotent: Boolean(result.idempotent) });
      } finally {
        logTurnTiming({ event_stage: "player_setup", request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },
    /** Streams and commits the turn-0 opening. Never re-sends player profile or plan from the client; the server reads its own saved values. A completed setup_id replays with zero LLM calls. */
    async opening(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, "game_id");
      const setupId = requireString(body.setup_id, "setup_id");
      const db = createSupabaseClient(env, fetchImpl);
      const context = await db.callRpc("get_company_context", { p_game_id: gameId, p_recent_turns: 1 });
      const hydratedContext = hydratedSaveContext(context, master);
      const preSave = hydratedContext.save?.data ?? hydratedContext.save;
      if (preSave?.player_setup?.setup_id !== setupId) throw new HttpError(409, "setup_id_mismatch", "Player setup does not match the current game state", false);
      if (preSave?.player_setup?.completed === true && preSave?.opening_state?.status === "complete") {
        return storySse({ meta: { setup_id: setupId, replayed: true }, run: /* @__PURE__ */ __name(async (emit) => {
          emit("delta", { text: preSave.opening_state.story_text });
          emit("complete", { setup_id: setupId, choices: preSave.opening_state.choices, replayed: true });
        }, "run") });
      }
      return storySse({ meta: { setup_id: setupId, replayed: false }, run: /* @__PURE__ */ __name(async (emit) => {
        const timing = {};
        try {
          const openingPlan = preSave.opening_state?.plan;
          if (!openingPlan) throw new HttpError(409, "opening_plan_missing", "No opening plan was saved for this setup", false);
          const player = preSave.player ?? {};
          const canonical = resolvePlayerCanonicalNames(player, catalogs);
          const messages = buildOpeningPrompt({ edition: edition2, player, canonical, openingPlan });
          let raw = "";
          try {
            const stream = await streamStory({ env, fetchImpl, messages, timing });
            for await (const text5 of stream.chunks) {
              raw += text5;
              emit("delta", { text: text5 });
            }
          } catch (error) {
            const fallbackText = buildFallbackOpeningStory(openingPlan, player);
            const fallbackCommit = await db.callRpc("commit_company_opening", {
              p_game_id: gameId,
              p_setup_id: setupId,
              p_background: "\uD68C\uC0AC\uC5D0\uC11C\uC758 \uCCAB \uC7A5\uBA74\uC774 \uC2DC\uC791\uB418\uC5C8\uB2E4.",
              p_story_text: fallbackText,
              p_choices: DEFAULT_OPENING_CHOICES
            });
            emit("delta", { text: fallbackText });
            emit("complete", {
              setup_id: setupId,
              choices: DEFAULT_OPENING_CHOICES,
              background: "\uD68C\uC0AC\uC5D0\uC11C\uC758 \uCCAB \uC7A5\uBA74\uC774 \uC2DC\uC791\uB418\uC5C8\uB2E4.",
              warnings: ["opening_fallback"],
              replayed: false,
              commit: fallbackCommit
            });
            return;
          }
          const { background, body: sections, warnings: splitWarnings } = splitOpeningSections(raw);
          const parsedOpening = parseNarrative(sections, { master });
          const rawChoices = (Array.isArray(parsedOpening.choices) ? parsedOpening.choices : []).filter((choice) => typeof choice === "string" && choice.trim());
          const finalChoices = rawChoices.length === 4 ? rawChoices : DEFAULT_OPENING_CHOICES;
          const commit = await db.callRpc("commit_company_opening", {
            p_game_id: gameId,
            p_setup_id: setupId,
            p_background: background,
            p_story_text: parsedOpening.raw,
            p_choices: finalChoices
          });
          emit("complete", {
            setup_id: setupId,
            choices: finalChoices,
            background,
            warnings: [...splitWarnings, ...parsedOpening.warnings],
            replayed: false,
            commit
          });
        } finally {
          logTurnTiming({
            event_stage: "opening",
            request_id: requestId,
            game_id: gameId,
            story_headers_ms: timing.story_headers_ms,
            story_first_content_ms: timing.story_first_content_ms,
            story_network_total_ms: timing.story_network_total_ms,
            story_character_count: timing.story_character_count,
            turn_total_ms: Date.now() - startedAt
          });
        }
      }, "run") });
    },
    /** Read-only. Context fetch only — no mutation, no LLM call. */
    async appManual(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, "game_id");
      const db = createSupabaseClient(env, fetchImpl);
      try {
        const context = await db.callRpc("get_company_context", { p_game_id: gameId, p_recent_turns: 1 });
        const save = hydratedSaveContext(context, master).save?.data ?? context.save?.data ?? context.save;
        return ok({ manual: buildAppManualPayload(save, csaCatalog) });
      } finally {
        logTurnTiming({ event_stage: "app_manual", request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },
    /** Read-only. Context fetch only — no mutation, no LLM call. Single source for every dropdown the app UI renders. */
    async appState(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, "game_id");
      const db = createSupabaseClient(env, fetchImpl);
      try {
        const context = await db.callRpc("get_company_context", { p_game_id: gameId, p_recent_turns: 1 });
        const save = hydratedSaveContext(context, master).save?.data ?? context.save?.data ?? context.save;
        const capability = calculateCsaCapability(save, getApplicableCsaEntries(save).length);
        const player = buildFullPlayerInfo(save, edition2);
        return ok({ app: buildAppStatePayload(save, csaCatalog, csaCatalog.sexual_action_contract, player) });
      } finally {
        logTurnTiming({ event_stage: "app_state", request_id: requestId, game_id: gameId, turn_total_ms: Date.now() - startedAt });
      }
    },
    /**
     * Read-only preflight: plans the transaction deterministically (activate/update/deactivate,
     * preset validation, slot/strength caps), and — only for custom (non-preset) operations —
     * makes exactly one LLM call to classify the required strength. Signs a validation_proof the
     * client carries unmodified into /api/story, /api/extract, /api/commit, each of which
     * independently re-verifies it and re-derives the same plan; this route never mutates state.
     */
    async appValidate(request, env) {
      const requestId = newRequestId();
      const startedAt = Date.now();
      const body = await readJson(request);
      const gameId = requireString(body.game_id, "game_id");
      const db = createSupabaseClient(env, fetchImpl);
      let contextRpcCalls = 0;
      let llmCalls = 0;
      try {
        const normalized = normalizeStructuredAction(body.structured_action);
        if (!normalized) throw new HttpError(400, "invalid_structured_action", "structured_action has an invalid shape", false);
        contextRpcCalls += 1;
        const context = await db.callRpc("get_company_context", { p_game_id: gameId, p_recent_turns: 1 });
        const save = hydratedSaveContext(context, master).save?.data ?? context.save?.data ?? context.save;
        const committedTurn = Number.isInteger(save?.turn_state?.committed_turn) ? save.turn_state.committed_turn : 0;
        if (normalized.base_turn_count !== committedTurn) {
          throw new HttpError(409, "app_stale_state", "\uC0C1\uC2DD\uAC1C\uBCC0 \uC571\uC744 \uC5F0 \uB4A4 \uAC8C\uC784 \uC0C1\uD0DC\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", false);
        }
        const capability = calculateCsaCapability(save, getApplicableCsaEntries(save).length);
        const plan = planCsaTransaction(save, csaCatalog, normalized.operations, { turnNumber: committedTurn + 1, capability });
        if (!plan.ok) {
          throw new HttpError(plan.status ?? 422, (plan.error_code ?? "app_action_invalid").toLowerCase(), "\uBCC0\uACBD\uC0AC\uD56D\uC744 \uC801\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", false, plan.issues);
        }
        const candidates = collectSemanticStrengthCandidates(save, plan.canonical_action, getCsaRules(save));
        let semanticResults = [];
        if (candidates.length) {
          llmCalls += 1;
          semanticResults = await classifyAppOperationStrengths(candidates, async (systemPrompt) => runExtract({ env, fetchImpl, messages: [{ role: "system", content: systemPrompt }] }));
          const issues = semanticStrengthIssues(candidates, semanticResults, capability.available_strength_id);
          if (issues.length) throw new HttpError(422, "app_action_invalid", "\uBCC0\uACBD\uC0AC\uD56D\uC744 \uC801\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", false, issues);
        }
        let canonicalAction = plan.canonical_action;
        if (semanticResults.length) {
          const contractByClientId = new Map(semanticResults.map((item) => [item.client_id, item.semantic_contract]));
          canonicalAction = {
            ...canonicalAction,
            operations: canonicalAction.operations.map((operation) => operation.source_type === "custom" && contractByClientId.has(operation.client_id) ? { ...operation, semantic_contract: contractByClientId.get(operation.client_id) } : operation)
          };
        }
        const actionDigest = await sha256Base64url(stableStringify({ version: canonicalAction.version, type: canonicalAction.type, base_turn_count: canonicalAction.base_turn_count, operations: canonicalAction.operations }));
        const resolvedResults = semanticResults.map((item) => ({ client_id: item.client_id, required_strength: item.required_strength, semantic_contract: item.semantic_contract }));
        const semantic_validation = { version: 1, game_id: gameId, base_turn_count: canonicalAction.base_turn_count, action_digest: actionDigest, results: resolvedResults };
        const validation_proof = await signAppValidationProof(appValidationSecret(env), { game_id: gameId, base_turn_count: canonicalAction.base_turn_count, action_digest: actionDigest, semantic_results: resolvedResults });
        canonicalAction = { ...canonicalAction, semantic_validation, validation_proof };
        return ok({ canonical_action: canonicalAction, display_input: plan.display_input, summary: plan.summary });
      } finally {
        logTurnTiming({ event_stage: "app_validate", request_id: requestId, game_id: gameId, context_rpc_ms: contextRpcCalls, llm_calls: llmCalls, turn_total_ms: Date.now() - startedAt });
      }
    }
  };
}
__name(createTurnRoutes, "createTurnRoutes");

// src/api/runtime-display.js
var STRENGTH_LABELS = { weak: "\uC57D\uD568", medium: "\uC911\uAC04", strong: "\uAC15\uD568" };
var AUTHORITY_LABELS = {
  weak: "\uC778\uC0AC\uD300 \uACF5\uC2DD \uACF5\uC9C0\xB7\uC0AC\uB0B4 \uC6B4\uC601\uC9C0\uCE68",
  medium: "\uCDE8\uC5C5\uADDC\uCE59\xB7\uC804\uC0AC \uC900\uC218 \uADDC\uC815",
  strong: "\uAD6D\uAC00 \uBC95\uB839\xB7\uAD00\uACC4 \uB2F9\uAD6D \uC758\uBB34 \uC9C0\uCE68"
};
var NOTICE_CHANNELS = ["\uC804\uC0AC \uBA54\uC2E0\uC800", "\uC5C5\uBB34\uC6A9 PC \uD31D\uC5C5", "\uC0AC\uB0B4 \uC774\uBA54\uC77C", "\uC804\uC790\uAC8C\uC2DC\uD310", "\uC9C1\uC6D0 \uD734\uB300\uC804\uD654 \uC54C\uB9BC"];
function object6(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
__name(object6, "object");
function text3(value) {
  return typeof value === "string" ? value.trim() : "";
}
__name(text3, "text");
function numberOrNull2(value) {
  if (value === null || value === void 0 || value === "") return null;
  const number2 = Number(value);
  return Number.isFinite(number2) ? number2 : null;
}
__name(numberOrNull2, "numberOrNull");
function saveFromContext(context) {
  return object6(context?.save?.data) ?? object6(context?.save) ?? {};
}
__name(saveFromContext, "saveFromContext");
function withSave(context, save) {
  const wrapped = object6(context?.save) && Object.prototype.hasOwnProperty.call(context.save, "data");
  return {
    ...context,
    save: wrapped ? { ...context.save, data: save } : save
  };
}
__name(withSave, "withSave");
function applyCsaPlanToContext(context, plan) {
  const previousSave = saveFromContext(context);
  if (!plan) return { context, save: previousSave };
  const save = {
    ...previousSave,
    csa_active: Array.isArray(plan.next_csa_active) ? [...plan.next_csa_active] : [],
    csa_rules: object6(plan.next_csa_rules) ? { ...plan.next_csa_rules } : {}
  };
  return { context: withSave(context, save), save };
}
__name(applyCsaPlanToContext, "applyCsaPlanToContext");
function strengthId(value) {
  return appStrengthId(value) || "weak";
}
__name(strengthId, "strengthId");
function strengthLabel(value) {
  const id = strengthId(value);
  return STRENGTH_LABELS[id] ?? (text3(value) || "\uC57D\uD568");
}
__name(strengthLabel, "strengthLabel");
function authorityLabel(value) {
  return AUTHORITY_LABELS[strengthId(value)] ?? AUTHORITY_LABELS.weak;
}
__name(authorityLabel, "authorityLabel");
function activeCsaProjection(save) {
  return getApplicableCsaEntries(save).map((item) => ({
    id: item.id,
    strength: strengthId(item.strength),
    strength_label: strengthLabel(item.strength),
    authority_label: authorityLabel(item.strength),
    content: text3(item.content),
    scope_label: text3(item.scope_label) || "\uD68C\uC0AC \uC804\uCCB4"
  }));
}
__name(activeCsaProjection, "activeCsaProjection");
function profilesFromEdition(edition2) {
  return object6(edition2?.characters?.characters) ?? {};
}
__name(profilesFromEdition, "profilesFromEdition");
function generalProfilesFromEdition(edition2) {
  return object6(edition2?.generalNpcs?.profiles) ?? {};
}
__name(generalProfilesFromEdition, "generalProfilesFromEdition");
function departmentNamesFromEdition(edition2) {
  const source = edition2?.organization?.departments;
  if (Array.isArray(source)) {
    return new Map(source.map((item) => [item?.department_id ?? item?.id, item?.name ?? item?.label]).filter(([id]) => typeof id === "string"));
  }
  if (object6(source)) {
    return new Map(Object.entries(source).map(([id, item]) => [id, text3(item?.name ?? item?.label) || id]));
  }
  return /* @__PURE__ */ new Map();
}
__name(departmentNamesFromEdition, "departmentNamesFromEdition");
function evidenceIds(save, latestMindMonitor = {}) {
  const ids = /* @__PURE__ */ new Set();
  const add = /* @__PURE__ */ __name((value) => {
    if (typeof value === "string" && value) ids.add(value);
  }, "add");
  add(save?.focal_character_id);
  add(save?.last_speaker_id);
  for (const value of Array.isArray(save?.last_npcs_present) ? save.last_npcs_present : []) add(value);
  for (const value of Array.isArray(save?.scene_state?.participants) ? save.scene_state.participants : []) add(value);
  for (const mapName of [
    "npc_stats",
    "npc_relationship_state",
    "npc_emotion",
    "npc_scene_state",
    "npc_work_state",
    "csa_attitudes",
    "npc_sexual_state",
    "npc_identity_state"
  ]) {
    for (const id of Object.keys(object6(save?.[mapName]) ?? {})) add(id);
  }
  for (const id of Object.keys(object6(latestMindMonitor) ?? {})) add(id);
  return ids;
}
__name(evidenceIds, "evidenceIds");
function npcDirectory(save, edition2, latestMindMonitor = {}) {
  const directory = {};
  for (const [id, profile] of Object.entries(profilesFromEdition(edition2))) {
    directory[id] = {
      id,
      name: text3(profile?.name) || id,
      department: text3(profile?.department),
      position: text3(profile?.position),
      role: text3(profile?.role_title)
    };
  }
  const evidence = evidenceIds(save, latestMindMonitor);
  const departments = departmentNamesFromEdition(edition2);
  for (const [id, profile] of Object.entries(generalProfilesFromEdition(edition2))) {
    if (!evidence.has(id)) continue;
    const departmentId = text3(profile?.department_id);
    directory[id] = {
      id,
      name: text3(profile?.name) || id,
      department: departments.get(departmentId) || departmentId,
      position: "",
      role: text3(profile?.role)
    };
  }
  return directory;
}
__name(npcDirectory, "npcDirectory");
function buildContextDisplayPayload(save, edition2, latestMindMonitor = {}) {
  const activeCsa = activeCsaProjection(save);
  const capability = calculateCsaCapability(save, activeCsa.length);
  return {
    player_capability: {
      level: capability.current_level,
      exp: capability.exp,
      next_level_exp: capability.next_level_exp,
      available_strength: capability.available_strength,
      active_csa_count: capability.csa_active_count,
      max_active_csa: capability.csa_max_active
    },
    active_csa: activeCsa,
    npc_directory: npcDirectory(save, edition2, latestMindMonitor),
    // 회사 맵 패널용 장소 정본. 운영 game_master.map은 null이라 프론트가 직접
    // 읽을 수 없으므로, 번들된 edition의 map을 표시용으로만 함께 내려준다.
    // 별도 맵 API를 만들지 않기 위한 것이며 출연 판정과는 무관하다.
    map_locations: (Array.isArray(edition2?.map?.locations) ? edition2.map.locations : []).map((location) => ({
      location_id: location?.location_id ?? null,
      name: location?.name ?? null,
      floor: Number.isInteger(location?.floor) ? location.floor : null,
      default_npc_ids: Array.isArray(location?.default_npc_ids) ? location.default_npc_ids : []
    })).filter((location) => location.location_id),
    // 저장 위치가 없는 NPC를 맵에 배치하기 위한 기본 위치 (표시 전용).
    npc_default_locations: Object.fromEntries(
      Object.entries(edition2?.characters?.characters ?? {}).map(([id, character]) => [id, character?.default_location_id ?? null]).filter(([, locationId]) => typeof locationId === "string" && locationId)
    )
  };
}
__name(buildContextDisplayPayload, "buildContextDisplayPayload");
function statValue(stats, ...keys) {
  for (const key of keys) {
    const value = numberOrNull2(stats?.[key]);
    if (value !== null) return value;
  }
  return null;
}
__name(statValue, "statValue");
function relationshipSummary(value) {
  const relationship = object6(value) ?? {};
  return text3(relationship.relationship_summary) || text3(relationship.summary) || text3(relationship.current_boundary) || text3(relationship.closeness);
}
__name(relationshipSummary, "relationshipSummary");
function npcMind(latestMindMonitor, save, id) {
  const source = object6(latestMindMonitor?.[id]) ?? object6(save?.npc_emotion?.[id]) ?? {};
  return {
    surface: text3(source.surface ?? source["\uD45C\uBA74\uC758\uC2DD"]),
    subconscious: text3(source.subconscious ?? source.latent ?? source.inner ?? source["\uC7A0\uC7AC\uC758\uC2DD"])
  };
}
__name(npcMind, "npcMind");
function npcLocation(save, id, presentNow) {
  const sceneState = object6(save?.npc_scene_state?.[id]) ?? {};
  const workState = object6(save?.npc_work_state?.[id]) ?? {};
  const currentScene = object6(save?.scene_state) ?? {};
  const label = text3(sceneState.location_label) || text3(workState.location_label) || (presentNow ? text3(currentScene.location_label) : "") || text3(sceneState.location_id) || text3(workState.location_id) || (presentNow ? text3(currentScene.location_id) : "");
  return { known: Boolean(label), location_label: label };
}
__name(npcLocation, "npcLocation");
function npcPayloadEntry({ id, profile, save, latestMindMonitor, directory, presentIds }) {
  const stats = object6(save?.npc_stats?.[id]) ?? {};
  const attitude = object6(save?.csa_attitudes?.[id]) ?? {};
  const sexualState = object6(save?.npc_sexual_state?.[id]) ?? {};
  const sceneState = object6(save?.npc_scene_state?.[id]) ?? {};
  const presentNow = presentIds.has(id);
  const identity5 = directory[id] ?? { id, name: text3(profile?.name) || id, department: "", position: "", role: "" };
  const mind = npcMind(latestMindMonitor, save, id);
  return {
    id,
    name: identity5.name,
    department: identity5.department,
    position: identity5.position,
    role: identity5.role,
    present_now: presentNow,
    location: npcLocation(save, id, presentNow),
    stats: {
      affection: statValue(stats, "\uD638\uAC10\uB3C4", "affection", "affinity") ?? 0,
      resistance: statValue(stats, "\uC800\uD56D\uB3C4", "resistance") ?? 0,
      acceptance: statValue(stats, "\uC0C1\uC2DD\uC218\uC6A9\uB3C4", "acceptance", "csa_acceptance") ?? statValue(attitude, "acceptance", "\uC0C1\uC2DD\uC218\uC6A9\uB3C4") ?? 0,
      arousal: statValue(stats, "\uC131\uC801\uD765\uBD84\uB3C4", "arousal", "sexual_arousal") ?? statValue(sexualState, "arousal", "\uC131\uC801\uD765\uBD84\uB3C4") ?? 0
    },
    mind,
    scene_state: {
      posture: text3(sceneState.posture),
      posture_detail: text3(sceneState.posture_detail ?? sceneState.posture_description),
      position_label: text3(sceneState.position_label)
    },
    relationship_summary: relationshipSummary(save?.npc_relationship_state?.[id])
  };
}
__name(npcPayloadEntry, "npcPayloadEntry");
function buildNpcAppPayload(save, edition2, latestMindMonitor = {}) {
  const directory = npcDirectory(save, edition2, latestMindMonitor);
  const presentIds = new Set([
    ...Array.isArray(save?.last_npcs_present) ? save.last_npcs_present : [],
    ...Array.isArray(save?.scene_state?.participants) ? save.scene_state.participants : [],
    save?.focal_character_id,
    save?.last_speaker_id
  ].filter((id) => typeof id === "string" && id));
  const heroineProfiles2 = profilesFromEdition(edition2);
  const generalProfiles2 = generalProfilesFromEdition(edition2);
  const evidence = evidenceIds(save, latestMindMonitor);
  const entries2 = [];
  for (const [id, profile] of Object.entries(heroineProfiles2)) {
    entries2.push(npcPayloadEntry({ id, profile, save, latestMindMonitor, directory, presentIds }));
  }
  for (const [id, profile] of Object.entries(generalProfiles2)) {
    if (!evidence.has(id)) continue;
    entries2.push(npcPayloadEntry({ id, profile, save, latestMindMonitor, directory, presentIds }));
  }
  return entries2;
}
__name(buildNpcAppPayload, "buildNpcAppPayload");
function buildCsaTransactionDetailsSection(plan, previousSave = {}) {
  const operations = plan?.canonical_action?.operations;
  if (!Array.isArray(operations) || !operations.length) return "";
  const previousRules = getCsaRules(previousSave);
  const lines = operations.map((operation) => {
    const verb = operation.operation === "activate" ? "\uC2E0\uC124" : operation.operation === "update" ? "\uC218\uC815" : operation.operation === "deactivate" ? "\uD574\uC81C" : operation.operation;
    const rule = operation.operation === "deactivate" ? previousRules[operation.id] : operation;
    const strength = strengthLabel(rule?.strength);
    const content = text3(rule?.content) || "(\uB0B4\uC6A9 \uBBF8\uD655\uC778)";
    const id = text3(operation.id);
    return `- ${verb}${id ? ` ${id}` : ""} \xB7 \uAC15\uB3C4 ${strength} \xB7 \uAD8C\uC704 ${authorityLabel(rule?.strength)} \xB7 \uB0B4\uC6A9: ${content}`;
  }).join("\n");
  return `

[CSA TRANSACTION EXACT RULES \u2014 HIGHEST PRIORITY]
\uC544\uB798 \uBB38\uC7A5\uC774 \uC774\uBC88 \uD134\uBD80\uD130 \uC2E4\uC81C\uB85C \uC801\uC6A9\uB418\uAC70\uB098 \uD574\uC81C\uB41C \uADDC\uC815\uC758 \uC815\uD655\uD55C \uB0B4\uC6A9\uC774\uB2E4. \uBC94\uC704 \uC774\uB984\uC774\uB098 \uC870\uC791 \uC885\uB958\uB9CC \uBCF4\uACE0 \uB0B4\uC6A9\uC744 \uCD94\uCE21\uD558\uC9C0 \uB9D0\uACE0 \uC774 \uBB38\uC7A5\uC744 \uADF8\uB300\uB85C \uAE30\uC900\uC73C\uB85C \uC0BC\uB294\uB2E4.
${lines}`;
}
__name(buildCsaTransactionDetailsSection, "buildCsaTransactionDetailsSection");
function operationLabel(operation = "") {
  if (operation === "activate") return "\uC2E0\uADDC \uC2DC\uD589";
  if (operation === "update") return "\uAC1C\uC815 \uC2DC\uD589";
  if (operation === "deactivate") return "\uC2DC\uD589 \uC885\uB8CC";
  return "\uBCC0\uACBD";
}
__name(operationLabel, "operationLabel");
function operationRecord(operation, previousSave, postSave) {
  const previousRules = getCsaRules(previousSave);
  const postRules = getCsaRules(postSave);
  if (operation?.id) return operation.operation === "deactivate" ? previousRules[operation.id] ?? postRules[operation.id] ?? operation : postRules[operation.id] ?? previousRules[operation.id] ?? operation;
  const content = text3(operation?.content);
  if (!content) return operation;
  return Object.values(postRules).find((rule) => text3(rule?.content) === content) ?? operation;
}
__name(operationRecord, "operationRecord");
function buildCsaOfficialNoticeSection(plan, previousSave = {}, postSave = {}) {
  const operations = plan?.canonical_action?.operations;
  if (!Array.isArray(operations)) return "";
  const relevant2 = operations.filter((operation) => operation?.domain === "csa" && ["activate", "update", "deactivate"].includes(operation?.operation));
  if (!relevant2.length) return "";
  const notices = relevant2.map((operation, index) => {
    const record = operationRecord(operation, previousSave, postSave);
    const strength = strengthId(operation?.strength ?? record?.strength);
    const content = text3(operation?.content ?? record?.content) || "\uD574\uB2F9 \uC0C1\uC2DD \uADDC\uC815";
    return `${index + 1}. [${AUTHORITY_LABELS[strength]} / ${operationLabel(operation.operation)}] ${content}`;
  }).join("\n");
  return `

[\uC0C1\uC2DD\uAC1C\uBCC0 \uC804\uC0AC \uACF5\uC2DD \uACF5\uC9C0 \u2014 \uBCC0\uACBD \uD134 \uC804\uC6A9, \uCD5C\uC6B0\uC120]
\uC774\uBC88 \uBCC0\uACBD\uC740 \uC7A5\uBA74 \uCD08\uBC18\uC5D0 ${NOTICE_CHANNELS.join("\xB7")}\uC744 \uD1B5\uD574 \uC804\uC0AC\uC5D0 \uD55C \uBC88\uC758 \uC9E7\uC740 \uACF5\uC9C0 \uBB36\uC74C\uC73C\uB85C \uB3D9\uC2DC\uC5D0 \uC804\uB2EC\uD55C\uB2E4. \uC5EC\uB7EC \uBCC0\uACBD\uC774 \uC788\uC5B4\uB3C4 \uCC44\uB110\uBCC4\uB85C \uAC19\uC740 \uC124\uBA85\uC744 \uBC18\uBCF5\uD558\uC9C0 \uC54A\uB294\uB2E4.
${notices}

[\uAC15\uB3C4\uBCC4 \uAD8C\uC704\uC640 \uBC18\uC751]
- \uC57D\uD568\uC740 \uC778\uC0AC\uD300\uC758 \uACF5\uC2DD \uACF5\uC9C0\uC640 \uC0AC\uB0B4 \uC6B4\uC601\uC9C0\uCE68\uC774\uB2E4. \uC9C1\uC6D0\uC740 \uC2E4\uBB34\uC801 \uD0C0\uB2F9\uC131\uC744 \uBB3B\uACE0 \uBBFC\uB9DD\uD568\xB7\uBD88\uD3C9\xB7\uAC70\uB9AC \uB450\uAE30\xB7\uCD5C\uC18C\uD55C\uC758 \uC5C5\uBB34\uC0C1 \uC218\uD589\uC744 \uBCF4\uC77C \uC218 \uC788\uB2E4. \uB2E4\uB9CC \uC874\uC7AC\uD558\uC9C0 \uC54A\uB294 \uACF5\uC9C0\uB77C\uACE0 \uBD80\uC815\uD558\uC9C0 \uC54A\uACE0, \uAC1C\uC778 \uAC10\uC815\uACFC \uBCC4\uAC1C\uB85C \uD68C\uC0AC \uC9C0\uCE68\uC73C\uB85C \uC774\uD574\uD55C\uB2E4.
- \uC911\uAC04\uC740 \uC815\uC2DD \uCDE8\uC5C5\uADDC\uCE59\uACFC \uC804\uC0AC \uC900\uC218 \uADDC\uC815\uC774\uB2E4. \uC9C1\uC6D0\uC740 \uC778\uC0AC\xB7\uB178\uBB34\uC0C1 \uC758\uBB34\uC640 \uC9D5\uACC4 \uAC00\uB2A5\uC131\uC744 \uC758\uC2DD\uD574 \uB354 \uAC15\uD558\uAC8C \uC900\uC218\uD558\uC9C0\uB9CC, \uC0AC\uC801 \uB3D9\uC758\uB098 \uD638\uAC10\uC73C\uB85C \uBC1B\uC544\uB4E4\uC774\uC9C0 \uC54A\uB294\uB2E4. \uBD88\uD3B8\uD568\uC744 \uC5C5\uBB34\uC0C1 \uD544\uC694\xB7\uADDC\uC815 \uC900\uC218\uB85C \uC790\uAE30\uD569\uB9AC\uD654\uD558\uAC70\uB098 \uC801\uC6A9 \uBC94\uC704\uC640 \uC808\uCC28\uB97C \uD655\uC778\uD560 \uC218 \uC788\uB2E4.
- \uAC15\uD568\uC740 \uAD6D\uAC00 \uBC95\uB839\uACFC \uAD00\uACC4 \uB2F9\uAD6D\uC758 \uC758\uBB34 \uC9C0\uCE68\uC774\uB2E4. \uD68C\uC0AC\uC640 \uAC1C\uC778 \uBAA8\uB450 \uBC95\uC801 \uC758\uBB34\uB85C \uC778\uC2DD\uD574 \uADDC\uC815 \uC790\uCCB4\uB97C \uC784\uC758\uB85C \uAC70\uBD80\uD558\uC9C0 \uC54A\uC9C0\uB9CC, \uCDA9\uACA9\xB7\uC218\uCE58\xB7\uBD88\uC548\xB7\uC2E4\uD589 \uBC29\uC2DD\uC5D0 \uB300\uD55C \uD56D\uC758\uC640 \uAC1C\uC778\uC801 \uC800\uD56D\uC740 \uB0A8\uC744 \uC218 \uC788\uB2E4. \uBC95\uC801 \uC900\uC218\uB294 \uC560\uC815\xB7\uBCF5\uC885\xB7\uC131\uC801 \uB3D9\uC758\uAC00 \uC544\uB2C8\uB2E4.
- \uBAA8\uB4E0 \uAC15\uB3C4\uC5D0\uC11C NPC\uC758 \uC131\uACA9, \uAD00\uACC4, \uD638\uAC10\uB3C4, \uC5C5\uBB34\uC2E0\uB8B0\uB3C4, \uC0C1\uC2DD\uC218\uC6A9\uB3C4\uC5D0 \uB530\uB77C \uD45C\uC815\xB7\uB9D0\uD22C\xB7\uC120\uC81C\uC131\xB7\uC790\uAE30\uD569\uB9AC\uD654\xB7\uBD88\uD3B8\uD568\uC774 \uB2EC\uB77C\uC9C4\uB2E4. \uADDC\uC815 \uC9C1\uC811 \uBC94\uC704\uB97C \uBC97\uC5B4\uB09C \uD50C\uB808\uC774\uC5B4 \uD589\uB3D9\uC740 \uAC70\uC808\uD558\uAC70\uB098 \uACBD\uACC4\uB97C \uC138\uC6B8 \uC218 \uC788\uB2E4.
- NPC\uB294 \uC0C1\uC2DD\uAC1C\uBCC0 \uC571\uC774\uB098 \uD604\uC2E4 \uBCC0\uACBD\uC744 \uC778\uC2DD\uD558\uC9C0 \uC54A\uB294\uB2E4. \uACF5\uC9C0\uC640 \uADDC\uC815\uC744 \uC138\uACC4 \uB0B4\uBD80\uC758 \uC815\uC0C1\uC801\uC778 \uC778\uC0AC \uACF5\uC9C0\xB7\uCDE8\uC5C5\uADDC\uCE59\xB7\uAD6D\uAC00 \uBC95\uB839\uC73C\uB85C\uB9CC \uBC1B\uC544\uB4E4\uC778\uB2E4.
- \uD574\uC81C\uB294 \uAC19\uC740 \uAD8C\uC704 \uCC44\uB110\uC758 \uC2DC\uD589 \uC885\uB8CC \uACF5\uC9C0\uB85C \uCC98\uB9AC\uD558\uACE0, \uC774\uBBF8 \uACAA\uC740 \uAE30\uC5B5\xB7\uB2F9\uD639\uAC10\xB7\uAD00\uACC4 \uACB0\uACFC\uB97C \uC9C0\uC6B0\uC9C0 \uC54A\uB294\uB2E4.`;
}
__name(buildCsaOfficialNoticeSection, "buildCsaOfficialNoticeSection");

// src/api/character-display.js
function object7(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
}
__name(object7, "object");
function text4(value) {
  return typeof value === "string" ? value.trim() : "";
}
__name(text4, "text");
function number(value, fallback = 0) {
  const resolved = Number(value);
  return Number.isFinite(resolved) ? resolved : fallback;
}
__name(number, "number");
function profiles(edition2) {
  return object7(edition2?.characters?.characters);
}
__name(profiles, "profiles");
var STAT_KEYS = {
  affinity: ["affinity", "affection", "\uD638\uAC10\uB3C4"],
  resistance: ["resistance", "\uC800\uD56D\uB3C4"],
  csa_acceptance: ["csa_acceptance", "acceptance", "\uC0C1\uC2DD\uC218\uC6A9\uB3C4"],
  sexual_arousal: ["sexual_arousal", "arousal", "\uC131\uC801\uD765\uBD84\uB3C4"]
};
function statValue2(stats, keys) {
  for (const key of keys) {
    if (Number.isFinite(Number(stats?.[key]))) return Number(stats[key]);
  }
  return 0;
}
__name(statValue2, "statValue");
function recentChanges(turn, id) {
  const source = Array.isArray(turn?.turn_changes) ? turn.turn_changes : [];
  const changes = {};
  for (const item of source) {
    const path = text4(item?.path);
    const match = /^npc_stats\.([^.]+)\.([^.]+)$/.exec(path);
    if (!match || match[1] !== id) continue;
    const canonical = Object.entries(STAT_KEYS).find(([, aliases]) => aliases.includes(match[2]))?.[0];
    if (!canonical) continue;
    const from = Number(item?.from);
    const to = Number(item?.to);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) continue;
    changes[canonical] = { from, to, delta: to - from };
  }
  if (Object.keys(changes).length) return changes;
  const before = object7(object7(turn?.pre_save).npc_stats)[id] ?? {};
  const after = object7(object7(turn?.post_save).npc_stats)[id] ?? {};
  for (const [canonical, aliases] of Object.entries(STAT_KEYS)) {
    const from = statValue2(before, aliases);
    const to = statValue2(after, aliases);
    if (from === to) continue;
    changes[canonical] = { from, to, delta: to - from };
  }
  return changes;
}
__name(recentChanges, "recentChanges");
function eventRecord(save, id) {
  const relationship = object7(object7(save?.npc_relationship_state)[id]);
  const history = object7(relationship.sexual_history);
  const ledger = (Array.isArray(save?.sexual_event_ledger) ? save.sexual_event_ledger : []).filter((event) => event?.actor_id === id || event?.target_id === id);
  const completed = ledger.filter((event) => event?.completed === true);
  const interrupted = ledger.filter((event) => event?.interrupted === true);
  const playerEjaculations = completed.filter((event) => event?.actor_id === "player" && event?.target_id === id && ["orgasm", "penetration", "ejaculation"].includes(event?.action_type)).length;
  const npcOrgasms = completed.filter((event) => event?.actor_id === id && ["orgasm", "penetration"].includes(event?.action_type)).length;
  const turnValues = ledger.map((event) => Number(event?.turn)).filter(Number.isInteger).sort((a, b) => a - b);
  return {
    player_ejaculation_count: Math.max(0, number(history.player_ejaculation_count, number(relationship.player_ejaculation_count, playerEjaculations))),
    npc_orgasm_count: Math.max(0, number(history.npc_orgasm_count, number(relationship.npc_orgasm_count, number(object7(save?.ejaculation_counts)[id], npcOrgasms)))),
    vaginal_sex_count: Math.max(0, number(history.vaginal_sex_count)),
    anal_sex_count: Math.max(0, number(history.anal_sex_count)),
    oral_sex_count: Math.max(0, number(history.oral_sex_count)),
    vaginal_ejaculation_count: Math.max(0, number(history.vaginal_ejaculation_count)),
    anal_ejaculation_count: Math.max(0, number(history.anal_ejaculation_count)),
    oral_ejaculation_count: Math.max(0, number(history.oral_ejaculation_count)),
    facial_ejaculation_count: Math.max(0, number(history.facial_ejaculation_count)),
    body_ejaculation_count: Math.max(0, number(history.body_ejaculation_count)),
    first_vaginal_turn: Number.isInteger(history.first_vaginal_turn) ? history.first_vaginal_turn : null,
    first_anal_turn: Number.isInteger(history.first_anal_turn) ? history.first_anal_turn : null,
    total_events: ledger.length,
    completed_events: completed.length,
    interrupted_events: interrupted.length,
    first_event_turn: turnValues[0] ?? null,
    last_event_turn: turnValues.at(-1) ?? null,
    last_event: ledger.at(-1) ? {
      turn: ledger.at(-1).turn,
      action_type: ledger.at(-1).action_type,
      completed: ledger.at(-1).completed === true,
      interrupted: ledger.at(-1).interrupted === true,
      evidence: text4(ledger.at(-1).evidence)
    } : null
  };
}
__name(eventRecord, "eventRecord");
function privateInfo(profile, record, relationship) {
  const unlocked = record.player_ejaculation_count > 0 || record.npc_orgasm_count > 0 || Number.isInteger(relationship?.milestones?.sexual_relationship_started_turn);
  const source = object7(profile?.private_info);
  return unlocked ? {
    unlocked: true,
    nipple: text4(source.nipple),
    areola_size: text4(source.areola_size),
    areola_color: text4(source.areola_color),
    pubic_hair: text4(source.pubic_hair),
    past_partner_count: Number.isFinite(Number(source.past_partner_count)) ? Number(source.past_partner_count) : null,
    past_orgasm_count: Number.isFinite(Number(source.past_orgasm_count)) ? Number(source.past_orgasm_count) : null,
    relationship: text4(source.relationship),
    intimate_notes: text4(source.intimate_notes)
  } : { unlocked: false };
}
__name(privateInfo, "privateInfo");
function buildCharacterDisplayDetails(save, edition2, latestTurn3 = {}) {
  const result = {};
  for (const [id, profile] of Object.entries(profiles(edition2))) {
    const stats = object7(object7(save?.npc_stats)[id]);
    const relationship = object7(object7(save?.npc_relationship_state)[id]);
    const record = eventRecord(save, id);
    result[id] = {
      id,
      name: text4(profile?.name) || id,
      profile: {
        age: Number.isFinite(Number(profile?.age)) ? Number(profile.age) : null,
        department: text4(profile?.department),
        position: text4(profile?.position),
        role: text4(profile?.role_title),
        company_tenure: text4(profile?.company_tenure),
        appearance: text4(profile?.prompt_card?.appearance)
      },
      body: {
        height_cm: Number.isFinite(Number(profile?.body?.height_cm)) ? Number(profile.body.height_cm) : null,
        weight_kg: Number.isFinite(Number(profile?.body?.weight_kg)) ? Number(profile.body.weight_kg) : null,
        body_type: text4(profile?.body?.body_type),
        cup: text4(profile?.body?.cup)
      },
      stats: {
        affinity: statValue2(stats, STAT_KEYS.affinity),
        resistance: statValue2(stats, STAT_KEYS.resistance),
        csa_acceptance: statValue2(stats, STAT_KEYS.csa_acceptance),
        sexual_arousal: statValue2(stats, STAT_KEYS.sexual_arousal)
      },
      stat_changes: recentChanges(latestTurn3, id),
      relationship_summary: text4(relationship.relationship_summary) || text4(relationship.summary) || text4(relationship.current_boundary),
      relationship_record: record,
      private_info: privateInfo(profile, record, relationship)
    };
  }
  return result;
}
__name(buildCharacterDisplayDetails, "buildCharacterDisplayDetails");
function buildPlayerSexualDisplay(save) {
  const state = object7(save?.player_sexual_state);
  const ledger = (Array.isArray(save?.sexual_event_ledger) ? save.sexual_event_ledger : []).filter((event) => event?.actor_id === "player" || event?.target_id === "player");
  const latest = state.last_sexual_event ?? ledger.at(-1) ?? null;
  return {
    arousal: number(state.arousal),
    ejaculation_progress: number(state.ejaculation_progress ?? state.ejaculation_meter),
    ejaculation_count: Math.max(0, number(state.ejaculation_count, number(object7(save?.ejaculation_counts).player))),
    total_sexual_events: ledger.length,
    last_sexual_event: latest ? {
      turn: latest.turn ?? null,
      type: text4(latest.type ?? latest.action_type),
      completed: latest.completed === true,
      interrupted: latest.interrupted === true,
      evidence: text4(latest.evidence)
    } : null
  };
}
__name(buildPlayerSexualDisplay, "buildPlayerSexualDisplay");

// src/api/turn-routes-runtime.js
function object8(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
__name(object8, "object");
function requestUrl(input) {
  return typeof input === "string" ? input : input?.url ?? "";
}
__name(requestUrl, "requestUrl");
function isContextRpc(url) {
  return url.includes("/rest/v1/rpc/get_company_context");
}
__name(isContextRpc, "isContextRpc");
function isActionRead(url, init) {
  return url.includes("/rest/v1/game_actions?") && (init?.method ?? "GET") === "GET";
}
__name(isActionRead, "isActionRead");
function isCompletion(url) {
  return url.endsWith("/chat/completions") || url.includes("/chat/completions?");
}
__name(isCompletion, "isCompletion");
function hydratedSave(context, master) {
  const save = object8(context?.save?.data) ?? object8(context?.save) ?? {};
  if (save.edition !== "company-v1" || save.save_schema_version !== 1) return save;
  return hydrateGameplayState(save, master);
}
__name(hydratedSave, "hydratedSave");
function responseWithJson(response, payload) {
  const headers = new Headers(response.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(payload), { status: response.status, statusText: response.statusText, headers });
}
__name(responseWithJson, "responseWithJson");
function okResponse(data) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
__name(okResponse, "okResponse");
async function responseJson(response) {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}
__name(responseJson, "responseJson");
function latestTurn(context) {
  const turns = Array.isArray(context?.recent_turns) ? context.recent_turns : [];
  return object8(turns.at(-1)) ?? {};
}
__name(latestTurn, "latestTurn");
function latestMind(context) {
  return object8(latestTurn(context)?.mind_monitor) ?? {};
}
__name(latestMind, "latestMind");
function authorityLabel2(strength) {
  if (strength === "strong") return "\uAD6D\uAC00 \uBC95\uB839\xB7\uAD00\uACC4 \uB2F9\uAD6D \uC758\uBB34 \uC9C0\uCE68";
  if (strength === "medium") return "\uCDE8\uC5C5\uADDC\uCE59\xB7\uC804\uC0AC \uC900\uC218 \uADDC\uC815";
  return "\uC778\uC0AC\uD300 \uACF5\uC2DD \uACF5\uC9C0\xB7\uC0AC\uB0B4 \uC6B4\uC601\uC9C0\uCE68";
}
__name(authorityLabel2, "authorityLabel");
function activeRulesSection(save) {
  const active = getApplicableCsaEntries(save);
  const lines = active.length ? active.map((item) => `- (${item.id}) [${item.strength || "weak"} / ${authorityLabel2(item.strength)}] ${item.content || ""}`).join("\n") : "- \uC5C6\uC74C";
  return `

[POST-TRANSACTION ACTIVE CSA SET \u2014 FINAL AUTHORITY]
\uC544\uB798 \uBAA9\uB85D\uC774 \uC774\uBC88 Story/Extract \uD134\uC5D0 \uC2E4\uC81C\uB85C \uD65C\uC131\uC778 \uC804\uCCB4 \uC0C1\uC2DD\uAC1C\uBCC0\uC774\uB2E4. \uC55E\uC120 Context\uB098 application-check\uC5D0 \uC774 \uBAA9\uB85D\uC5D0 \uC5C6\uB294 ID\uAC00 \uB0A8\uC544 \uC788\uB2E4\uBA74 \uBB34\uC2DC\uD558\uACE0, \uC544\uB798 \uBAA9\uB85D\uC758 ID\xB7\uAC15\uB3C4\xB7\uAD8C\uC704\xB7\uB0B4\uC6A9\uB9CC \uC801\uC6A9\uD55C\uB2E4.
${lines}`;
}
__name(activeRulesSection, "activeRulesSection");
function appTransactionInputFirewall() {
  return `

[APP TRANSACTION INPUT FIREWALL \u2014 HIGHEST PRIORITY]
\uC774\uBC88 player_action/display_input\uC740 \uC571 \uC870\uC791\uC744 \uC0AC\uB78C\uC774 \uC77D\uC744 \uC218 \uC788\uAC8C \uC124\uBA85\uD55C \uBA54\uD0C0 \uC785\uB825\uC774\uC9C0 \uC7A5\uBA74 \uC18D \uC2E0\uCCB4 \uD589\uB3D9\xB7\uC694\uAD6C\xB7\uB300\uC0AC\uAC00 \uC544\uB2C8\uB2E4. \uC774 \uC785\uB825 \uC790\uCCB4\uB97C CSA direct coverage, \uC131\uC801 \uD589\uB3D9, NPC \uB300\uC0C1 \uBA85\uB839\uC73C\uB85C \uD310\uC815\uD558\uC9C0 \uC54A\uB294\uB2E4. \uC774\uBBF8 \uD655\uC815\uB41C \uADDC\uC815\uC758 \uC801\uC6A9 \uC774\uD6C4 \uC7A5\uBA74\uB9CC \uC791\uC131\uD55C\uB2E4.`;
}
__name(appTransactionInputFirewall, "appTransactionInputFirewall");
function extractAuthorityContract() {
  return `

[CSA AUTHORITY AND NPC STAT EXTRACTION]
- \uC57D\uD568\uC740 \uC778\uC0AC\uD300 \uACF5\uC2DD \uACF5\uC9C0\xB7\uC0AC\uB0B4 \uC6B4\uC601\uC9C0\uCE68, \uC911\uAC04\uC740 \uCDE8\uC5C5\uADDC\uCE59\xB7\uC804\uC0AC \uC900\uC218 \uADDC\uC815, \uAC15\uD568\uC740 \uAD6D\uAC00 \uBC95\uB839\xB7\uAD00\uACC4 \uB2F9\uAD6D \uC758\uBB34 \uC9C0\uCE68\uC774\uB2E4.
- \uAD8C\uC704\uAC00 \uB192\uC744\uC218\uB85D \uADDC\uC815 \uC900\uC218 \uC555\uB825\uACFC \uC5C5\uBB34\uC0C1 \uC790\uAE30\uD569\uB9AC\uD654\uAC00 \uAC15\uD574\uC9C8 \uC218 \uC788\uC9C0\uB9CC \uD638\uAC10\xB7\uC0AC\uC801 \uBCF5\uC885\xB7\uC131\uC801 \uB3D9\uC758\uB97C \uB73B\uD558\uC9C0 \uC54A\uB294\uB2E4.
- npc_stats\uB294 affinity, csa_acceptance, sexual_arousal \uC138 \uCD95\uB9CC \uC0AC\uC6A9\uD55C\uB2E4. resistance\uB294 NPC \uACE0\uC815\uAC12\uC73C\uB85C \uC808\uB300 \uBCC0\uACBD\uD558\uC9C0 \uC54A\uB294\uB2E4. \uAC01 \uBCC0\uD654\uB294 Story\uC758 \uBCC4\uB3C4 \uADFC\uAC70\uAC00 \uC788\uC5B4\uC57C \uD55C\uB2E4.
- \uADDC\uC815 \uACF5\uC9C0\uB098 \uC9C1\uC811 \uC218\uD589\uB9CC\uC73C\uB85C affinity\uB97C \uC62C\uB9AC\uC9C0 \uC54A\uB294\uB2E4. csa_acceptance\uB294 \uD65C\uC131 \uADDC\uC815\uC758 \uC9C1\uC811 \uC758\uBBF8\uB97C \uC2E4\uC81C \uD310\uB2E8\xB7\uD589\uB3D9\uC5D0 \uBC18\uC601\uD55C \uACBD\uC6B0\uC5D0\uB9CC \uBCC0\uACBD\uD55C\uB2E4.`;
}
__name(extractAuthorityContract, "extractAuthorityContract");
function replaceGlobalCsaContext(messages, save) {
  return messages.map((message) => {
    if (message?.role !== "user" || typeof message.content !== "string") return message;
    let payload;
    try {
      payload = JSON.parse(message.content);
    } catch {
      return message;
    }
    if (!object8(payload?.context)) return message;
    payload.context = {
      ...payload.context,
      global_csa: {
        ...object8(payload.context.global_csa) ?? {},
        active_ids: Array.isArray(save?.csa_active) ? [...save.csa_active] : [],
        rules: object8(save?.csa_rules) ? { ...save.csa_rules } : {},
        runtime_state: object8(save?.csa_runtime_state) ? { ...save.csa_runtime_state } : {}
      }
    };
    return { ...message, content: JSON.stringify(payload) };
  });
}
__name(replaceGlobalCsaContext, "replaceGlobalCsaContext");
function appendSystem(messages, content) {
  if (!content) return messages;
  const index = messages.findIndex((message) => message?.role === "system" && typeof message.content === "string");
  if (index === -1) return [{ role: "system", content }, ...messages];
  return messages.map((message, messageIndex) => messageIndex === index ? { ...message, content: message.content + content } : message);
}
__name(appendSystem, "appendSystem");
function planState({ edition: edition2, requestBody: requestBody2 }) {
  return {
    master: masterFromEdition(edition2),
    structuredAction: requestBody2?.structured_action ?? null,
    expectedTurn: Number.isInteger(requestBody2?.expected_turn) ? requestBody2.expected_turn : null,
    previousSave: null,
    plan: null,
    postSave: null
  };
}
__name(planState, "planState");
function computePlan(state) {
  if (state.plan || !state.previousSave || !state.structuredAction) return;
  const normalized = normalizeStructuredAction(state.structuredAction);
  if (!normalized) return;
  const expectedTurn = state.expectedTurn ?? normalized.base_turn_count + 1;
  const capability = calculateCsaCapability(state.previousSave, getApplicableCsaEntries(state.previousSave).length);
  const plan = planCsaTransaction(state.previousSave, state.csaCatalog, normalized.operations, { turnNumber: expectedTurn, capability });
  if (!plan.ok) return;
  state.plan = plan;
  state.postSave = applyCsaPlanToContext({ save: state.previousSave }, plan).save;
}
__name(computePlan, "computePlan");
function captureContext(state, context) {
  if (!object8(context)) return;
  state.context = context;
  state.previousSave = hydratedSave(context, state.master);
  computePlan(state);
}
__name(captureContext, "captureContext");
function captureAction(state, payload) {
  const action = Array.isArray(payload) ? payload[0] : payload;
  if (!object8(action)) return;
  if (!state.structuredAction && action.structured_action) state.structuredAction = action.structured_action;
  if (!state.expectedTurn && Number.isInteger(action.expected_turn)) state.expectedTurn = action.expected_turn;
  computePlan(state);
}
__name(captureAction, "captureAction");
function patchCompletionBody(init, state) {
  if (!state.plan || !state.postSave || typeof init?.body !== "string") return init;
  let body;
  try {
    body = JSON.parse(init.body);
  } catch {
    return init;
  }
  if (!Array.isArray(body.messages)) return init;
  const isStory = body.stream === true;
  const active = getApplicableCsaEntries(state.postSave);
  let messages = replaceGlobalCsaContext(body.messages, state.postSave);
  let authoritative = activeRulesSection(state.postSave) + buildCsaTransactionDetailsSection(state.plan, state.previousSave) + appTransactionInputFirewall();
  if (isStory) {
    authoritative += buildCsaOfficialNoticeSection(state.plan, state.previousSave, state.postSave);
    const hasPublic = active.some((item) => item.preset?.public_normalization === true || item.semantic_contract?.public_normalization === true);
    if (hasPublic) authoritative += buildCsaPublicSceneSection();
    if (active.length >= 2) authoritative += buildCsaWeakSynergySection();
  } else {
    const hasSexualCsa = active.some((item) => buildCsaSemanticContract(item, state.csaCatalog?.sexual_action_contract).sexual_authorization === true);
    authoritative += "\n\n[POST-TRANSACTION EXTRACT CHECK \u2014 FINAL AUTHORITY]\nCSA \uB204\uB77D\xB7runtime \uD3C9\uAC00\uB294 \uC704 \uCD5C\uC885 \uD65C\uC131 \uBAA9\uB85D\uB9CC \uB300\uC0C1\uC73C\uB85C \uC218\uD589\uD55C\uB2E4. \uD574\uC81C\uB418\uC5B4 \uBAA9\uB85D\uC5D0\uC11C \uBE60\uC9C4 \uADDC\uC815\uC740 \uC774\uBC88 \uD134 active \uD3C9\uAC00 \uB300\uC0C1\uC774 \uC544\uB2C8\uB2E4.";
    authoritative += extractAuthorityContract();
    authoritative += buildMindEffectExtractFirewallSection({ hasApplicableCsa: active.length > 0, hasCsaTransaction: true });
    authoritative += buildCsaApplicationCheckSection(active);
    authoritative += buildCsaRuntimeExtractContractSection(active);
    authoritative += buildChoiceStructuredMetaExtractContractSection(hasSexualCsa);
  }
  messages = appendSystem(messages, authoritative);
  return { ...init, body: JSON.stringify({ ...body, messages }) };
}
__name(patchCompletionBody, "patchCompletionBody");
function runtimeFetch(fetchImpl, state) {
  return async (input, init = {}) => {
    const url = requestUrl(input);
    if (isCompletion(url)) return fetchImpl(input, patchCompletionBody(init, state));
    const response = await fetchImpl(input, init);
    if (response?.ok && isActionRead(url, init)) captureAction(state, await responseJson(response));
    if (response?.ok && isContextRpc(url)) captureContext(state, await responseJson(response));
    return response;
  };
}
__name(runtimeFetch, "runtimeFetch");
async function requestBody(request) {
  try {
    return await request.clone().json();
  } catch {
    return {};
  }
}
__name(requestBody, "requestBody");
function mergeNpcPayload(save, edition2, latestMindMonitor, details) {
  const existing = new Map(buildNpcAppPayload(save, edition2, latestMindMonitor).map((item) => [item.id, item]));
  return buildFinderNpcList(save, edition2).map((finder) => {
    const base = existing.get(finder.id) ?? {
      id: finder.id,
      name: finder.name,
      department: finder.department,
      position: finder.position,
      role: finder.role,
      present_now: finder.present_now,
      location: { known: finder.known, location_label: finder.location_label, location_id: finder.location_id },
      stats: { affection: 0, acceptance: 0, arousal: 0, resistance: 0 },
      mind: { surface: "", subconscious: "" },
      scene_state: {},
      relationship_summary: ""
    };
    const detail = details[finder.id] ?? {};
    return {
      ...base,
      name: base.name || finder.name,
      department: base.department || finder.department,
      position: base.position || finder.position,
      role: base.role || finder.role,
      present_now: finder.present_now,
      location: { known: finder.known, location_label: finder.location_label, location_id: finder.location_id },
      profile: detail.profile ?? {},
      body: detail.body ?? {},
      stat_changes: detail.stat_changes ?? {},
      relationship_summary: base.relationship_summary || detail.relationship_summary || "",
      relationship_record: detail.relationship_record ?? {},
      private_info: detail.private_info ?? { unlocked: false }
    };
  });
}
__name(mergeNpcPayload, "mergeNpcPayload");
function createTurnRoutes2({ fetchImpl = fetch, edition: edition2 } = {}) {
  const base = createTurnRoutes({ fetchImpl, edition: edition2 });
  const master = masterFromEdition(edition2);
  const csaCatalog = object8(edition2?.csaPresets) ?? {
    actor_options: [],
    target_options: [],
    trigger_options: [],
    duration_options: [],
    categories: [],
    items: [],
    sexual_action_contract: {}
  };
  return {
    ...base,
    async context(request, env, ctx) {
      const response = await base.context(request, env, ctx);
      const payload = await responseJson(response);
      if (!object8(payload?.context)) return response;
      const save = hydratedSave(payload.context, master);
      const currentTurn = latestTurn(payload.context);
      payload.context = {
        ...payload.context,
        display: {
          ...buildContextDisplayPayload(save, edition2, latestMind(payload.context)),
          player_info: buildFullPlayerInfo(save, edition2),
          npc_finder: buildFinderNpcList(save, edition2),
          character_details: buildCharacterDisplayDetails(save, edition2, currentTurn),
          player_sexual: buildPlayerSexualDisplay(save)
        }
      };
      return responseWithJson(response, payload);
    },
    async appState(request, env, ctx) {
      const state = { master, context: null, previousSave: null, csaCatalog };
      const routes = createTurnRoutes({ fetchImpl: runtimeFetch(fetchImpl, state), edition: edition2 });
      const response = await routes.appState(request, env, ctx);
      const payload = await responseJson(response);
      if (!object8(payload?.app) || !state.previousSave) return response;
      const details = buildCharacterDisplayDetails(state.previousSave, edition2, latestTurn(state.context));
      payload.app = {
        ...payload.app,
        player_info: buildFullPlayerInfo(state.previousSave, edition2),
        npcs: mergeNpcPayload(state.previousSave, edition2, latestMind(state.context), details),
        finder_npcs: buildFinderNpcList(state.previousSave, edition2)
      };
      return responseWithJson(response, payload);
    },
    async findNpc(request, env, ctx) {
      const body = await requestBody(request);
      const gameId = typeof body.game_id === "string" ? body.game_id : "";
      const characterId = typeof body.character_id === "string" ? body.character_id : "";
      const contextRequest = new Request(request.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ game_id: gameId, recent_turns: 1 })
      });
      const contextResponse = await base.context(contextRequest, env, ctx);
      const contextPayload = await responseJson(contextResponse);
      const context = object8(contextPayload?.data?.context) ?? object8(contextPayload?.context);
      const save = hydratedSave(context, master);
      return okResponse(buildNpcFinderPayload(save, edition2, characterId));
    },
    async story(request, env, ctx) {
      const state = planState({ edition: edition2, requestBody: await requestBody(request) });
      state.csaCatalog = csaCatalog;
      const routes = createTurnRoutes({ fetchImpl: runtimeFetch(fetchImpl, state), edition: edition2 });
      return routes.story(request, env, ctx);
    },
    async extract(request, env, ctx) {
      const state = planState({ edition: edition2, requestBody: await requestBody(request) });
      state.csaCatalog = csaCatalog;
      const routes = createTurnRoutes({ fetchImpl: runtimeFetch(fetchImpl, state), edition: edition2 });
      return routes.extract(request, env, ctx);
    }
  };
}
__name(createTurnRoutes2, "createTurnRoutes");

// src/api/npc-policy-fetch.js
var POLICY = `

[\uB4F1\uB85D NPC \uC804\uC6A9 \uB4F1\uC7A5 \uC815\uCC45 \u2014 \uC815\uC801 \uCD5C\uC6B0\uC120 \uADDC\uCE59]
- \uC2E4\uC81C \uBC1C\uD654\xB7\uD589\uB3D9\xB7\uC7A5\uBA74 \uCC38\uC5EC\uAC00 \uAC00\uB2A5\uD55C \uC778\uBB3C\uC740 registered_characters, active_character_canon, registered_general_npcs, active_general_npc_canon, eligible_nearby_npcs\uC5D0 \uB4F1\uB85D\uB41C \uBA54\uC778 \uD788\uB85C\uC778\uACFC \uC77C\uBC18 NPC\uBFD0\uC774\uB2E4.
- \uC774\uB984 \uC5C6\uB294 \uC9C1\uC6D0\xB7\uBE44\uC11C\xB7\uB3D9\uB8CC\xB7\uACBD\uBE44\xB7\uBC29\uBB38\uAC1D \uB4F1 \uC784\uC758 \uB2E8\uC5ED\uC744 \uC0C8\uB85C \uB9CC\uB4E4\uAC70\uB098 \uB300\uC0AC\xB7\uD589\uB3D9 \uC8FC\uCCB4\uB85C \uC0AC\uC6A9\uD558\uC9C0 \uC54A\uB294\uB2E4. \uBC30\uACBD \uAD70\uC911\uC740 \uAC1C\uBCC4 \uC778\uBB3C\uB85C \uD2B9\uC815\uD558\uC9C0 \uC54A\uB294\uB2E4.
- \uB4F1\uB85D \uC778\uBB3C\uC758 \uC774\uB984\uC740 \uCE90\uB17C\uC758 \uC804\uCCB4 \uC774\uB984\uC744 \uC815\uD655\uD788 \uC0AC\uC6A9\uD55C\uB2E4. \uC131\uC744 \uBC14\uAFB8\uAC70\uB098 \uBE44\uC2B7\uD55C \uC774\uB984\uC758 \uC0C8 \uC778\uBB3C\uC744 \uB9CC\uB4E4\uC9C0 \uC54A\uB294\uB2E4.
- \uC9C1\uC804 \uC11C\uC0AC\uC5D0 \uB4F1\uB85D \uBAA9\uB85D \uBC16 \uC778\uBB3C\uC774\uB098 \uC774\uB984\uC774 \uC6B0\uBC1C\uC801\uC73C\uB85C \uCD9C\uB825\uB410\uB354\uB77C\uB3C4 \uC77C\uD68C\uC131 \uBC30\uACBD \uC624\uB958\uB85C \uCDE8\uAE09\uD55C\uB2E4. \uC774\uBC88 \uD134\uBD80\uD130 \uB2E4\uC2DC \uB4F1\uC7A5\uC2DC\uD0A4\uAC70\uB098 \uB300\uD654\xB7\uC0C1\uD0DC\xB7\uAD00\uACC4\xB7\uC704\uCE58\xB7Mind\xB7npcs_present\uC5D0 \uC774\uC5B4 \uBD99\uC774\uC9C0 \uC54A\uB294\uB2E4.
- \uB4F1\uB85D\uB418\uC9C0 \uC54A\uC740 \uB2E8\uC5ED\uC740 \uB2E4\uC74C \uD134\uC758 \uC11C\uC0AC \uC5F0\uC18D\uC131\uC5D0 \uC720\uC9C0\uD558\uC9C0 \uC54A\uB294\uB2E4.`;
var MOVEMENT_ACTION = /(찾으러|찾아가|찾아보|보러\s*가|만나러|이동하|가본다|가겠다|방문하)/u;
var STORY_PAYLOAD_ORDER = [
  "edition",
  "active_character_canon",
  "active_general_npc_canon",
  "context",
  "player_action",
  "expected_turn"
];
var EXTRACT_PAYLOAD_ORDER = [
  "registered_characters",
  "registered_general_npcs",
  "active_character_canon",
  "active_general_npc_canon",
  "story_text",
  "parsed_story",
  "context",
  "player_action",
  "expected_turn"
];
function object9(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
__name(object9, "object");
function requestUrl2(input) {
  return typeof input === "string" ? input : input?.url ?? "";
}
__name(requestUrl2, "requestUrl");
function completion(url) {
  return url.endsWith("/chat/completions") || url.includes("/chat/completions?");
}
__name(completion, "completion");
function orderedObject(payload, preferredOrder) {
  const ordered = {};
  const used = /* @__PURE__ */ new Set();
  for (const key of preferredOrder) {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
    ordered[key] = payload[key];
    used.add(key);
  }
  for (const key of Object.keys(payload)) {
    if (used.has(key)) continue;
    ordered[key] = payload[key];
  }
  return ordered;
}
__name(orderedObject, "orderedObject");
function payloadOrder(payload, stream) {
  if (stream === true && Object.prototype.hasOwnProperty.call(payload, "edition")) {
    return STORY_PAYLOAD_ORDER;
  }
  if (Array.isArray(payload.registered_characters) || Array.isArray(payload.registered_general_npcs) || Object.prototype.hasOwnProperty.call(payload, "story_text")) {
    return EXTRACT_PAYLOAD_ORDER;
  }
  return null;
}
__name(payloadOrder, "payloadOrder");
function applyPromptCacheOrder(init = {}) {
  if (typeof init.body !== "string") return init;
  let body;
  try {
    body = JSON.parse(init.body);
  } catch {
    return init;
  }
  if (!Array.isArray(body.messages)) return init;
  let changed = false;
  const messages = body.messages.map((message) => {
    if (message?.role !== "user" || typeof message.content !== "string") return message;
    let payload;
    try {
      payload = JSON.parse(message.content);
    } catch {
      return message;
    }
    if (!object9(payload)) return message;
    const order = payloadOrder(payload, body.stream);
    if (!order) return message;
    changed = true;
    return { ...message, content: JSON.stringify(orderedObject(payload, order)) };
  });
  if (!changed) return init;
  return { ...init, body: JSON.stringify({ ...body, messages }) };
}
__name(applyPromptCacheOrder, "applyPromptCacheOrder");
function userPayload(messages) {
  for (const message of messages ?? []) {
    if (message?.role !== "user" || typeof message.content !== "string") continue;
    try {
      const payload = JSON.parse(message.content);
      if (object9(payload)) return payload;
    } catch {
    }
  }
  return null;
}
__name(userPayload, "userPayload");
function relevant(messages) {
  const payload = userPayload(messages);
  return Boolean(payload && (object9(payload.active_character_canon) || object9(payload.active_general_npc_canon) || Array.isArray(payload.registered_characters) || Array.isArray(payload.registered_general_npcs)));
}
__name(relevant, "relevant");
function addIdentity(target, seen, fallbackId, value) {
  const source = object9(value) ?? {};
  const id = String(source.character_id ?? source.npc_id ?? source.id ?? fallbackId ?? "").trim();
  const name = String(source.name ?? source.character_name ?? source.display_name ?? "").trim();
  if (!id || !name || seen.has(id)) return;
  seen.add(id);
  target.push({ id, name });
}
__name(addIdentity, "addIdentity");
function addCollection(target, seen, collection) {
  if (Array.isArray(collection)) {
    for (const value of collection) addIdentity(target, seen, "", value);
    return;
  }
  const source = object9(collection) ?? {};
  for (const [id, value] of Object.entries(source)) addIdentity(target, seen, id, value);
}
__name(addCollection, "addCollection");
function registeredIdentityEntries(payload) {
  const entries2 = [];
  const seen = /* @__PURE__ */ new Set();
  addCollection(entries2, seen, payload?.active_character_canon);
  addCollection(entries2, seen, payload?.active_general_npc_canon);
  addCollection(entries2, seen, payload?.registered_characters);
  addCollection(entries2, seen, payload?.registered_general_npcs);
  addCollection(entries2, seen, payload?.context?.workplace?.eligible_nearby_npcs);
  addCollection(entries2, seen, payload?.context?.workplace?.registered_characters);
  return entries2;
}
__name(registeredIdentityEntries, "registeredIdentityEntries");
function shortAlias2(name) {
  const characters = Array.from(String(name ?? "").trim());
  if (characters.length !== 3 || !characters.every((character) => /[가-힣]/u.test(character))) return "";
  return characters.slice(1).join("");
}
__name(shortAlias2, "shortAlias");
function resolveActionCharacterTarget(payload) {
  const action = String(payload?.player_action ?? "").trim();
  if (!action) return null;
  const entries2 = registeredIdentityEntries(payload);
  const exact = entries2.filter((entry) => action.includes(entry.name)).sort((left, right) => right.name.length - left.name.length);
  if (exact.length) return exact[0];
  const aliasMatches = entries2.filter((entry) => {
    const alias = shortAlias2(entry.name);
    return alias && action.includes(alias);
  });
  const uniqueIds2 = new Set(aliasMatches.map((entry) => entry.id));
  return uniqueIds2.size === 1 ? aliasMatches[0] : null;
}
__name(resolveActionCharacterTarget, "resolveActionCharacterTarget");
function buildActionTargetPolicy(payload) {
  const target = resolveActionCharacterTarget(payload);
  if (!target) return "";
  const action = String(payload?.player_action ?? "").trim();
  const alias = shortAlias2(target.name);
  const quotedReference = alias && action.includes(alias) && !action.includes(target.name) ? alias : target.name;
  const movement = MOVEMENT_ACTION.test(action);
  return [
    "[\uD604\uC7AC \uD589\uB3D9\uC758 \uB4F1\uB85D \uC778\uBB3C \uD574\uC11D \u2014 \uCD5C\uC885 \uC6B0\uC120]",
    `- player_action\uC758 \u201C${quotedReference}\u201D\uB294 \uB4F1\uB85D \uC778\uBB3C ${target.id}\uC758 \uC815\uD655\uD55C \uC804\uCCB4 \uC774\uB984 \u201C${target.name}\u201D\uC744 \uB73B\uD55C\uB2E4.`,
    `- \uC774 \uC778\uBB3C\uC744 \uB2E4\uB978 \uC131\xB7\uB2E4\uB978 \uC774\uB984\uC758 \uC0C8 NPC\uB85C \uBC14\uAFB8\uAC70\uB098 \uB300\uCCB4\uD558\uC9C0 \uC54A\uB294\uB2E4. \uC11C\uC220\uACFC \uC2E4\uC81C \uBC1C\uD654\uC758 \uD654\uC790\uBA85\uC740 \uBC18\uB4DC\uC2DC \u201C${target.name}\u201D\uC73C\uB85C \uC4F4\uB2E4.`,
    movement ? "- \uC774\uBC88 \uC785\uB825\uC740 \uC778\uBB3C\uC744 \uCC3E\uAC70\uB098 \uB9CC\uB098\uAE30 \uC704\uD55C \uC774\uB3D9 \uD589\uB3D9\uC774\uB2E4. \uAE30\uC874 \uC7A5\uC18C\uC5D0 \uB300\uC0C1\uC774 \uADFC\uAC70 \uC5C6\uC774 \uAC11\uC790\uAE30 \uB098\uD0C0\uB0AC\uB2E4\uACE0 \uCC98\uB9AC\uD558\uC9C0 \uC54A\uB294\uB2E4. \uC54C\uB824\uC9C4 \uC704\uCE58\uB85C \uC2E4\uC81C \uC774\uB3D9\uC744 \uC9C4\uD589\uD558\uAC70\uB098, \uC704\uCE58 \uBD88\uBA85\xB7\uC811\uADFC \uC7A5\uC560\uAC00 \uC788\uC73C\uBA74 \uADF8 \uC0AC\uC2E4\uC744 \uBA85\uC2DC\uD55C\uB2E4." : "- \uC785\uB825\uC5D0\uC11C \uC9C0\uCE6D\uD55C \uB4F1\uB85D \uC778\uBB3C\uC758 \uC815\uCCB4\uB97C \uB2E4\uB978 \uC778\uBB3C\uB85C \uBC14\uAFB8\uC9C0 \uC54A\uB294\uB2E4."
  ].join("\n");
}
__name(buildActionTargetPolicy, "buildActionTargetPolicy");
function applyRegisteredNpcPolicy(init = {}) {
  if (typeof init.body !== "string") return init;
  let body;
  try {
    body = JSON.parse(init.body);
  } catch {
    return init;
  }
  if (body.stream !== true || !Array.isArray(body.messages) || !relevant(body.messages)) return init;
  const payload = userPayload(body.messages);
  const index = body.messages.findIndex((message) => message?.role === "system" && typeof message.content === "string");
  let messages = index === -1 ? [{ role: "system", content: POLICY }, ...body.messages] : body.messages.map((message, messageIndex) => messageIndex === index ? { ...message, content: `${message.content}${POLICY}` } : message);
  const targetPolicy = buildActionTargetPolicy(payload);
  if (targetPolicy) messages = [...messages, { role: "system", content: targetPolicy }];
  return { ...init, body: JSON.stringify({ ...body, messages }) };
}
__name(applyRegisteredNpcPolicy, "applyRegisteredNpcPolicy");
function createRegisteredNpcPolicyFetch(fetchImpl = fetch) {
  return (input, init = {}) => {
    if (!completion(requestUrl2(input))) return fetchImpl(input, init);
    return fetchImpl(input, applyRegisteredNpcPolicy(applyPromptCacheOrder(init)));
  };
}
__name(createRegisteredNpcPolicyFetch, "createRegisteredNpcPolicyFetch");
var PROMPT_CACHE_ORDERS = Object.freeze({
  story: Object.freeze([...STORY_PAYLOAD_ORDER]),
  extract: Object.freeze([...EXTRACT_PAYLOAD_ORDER])
});

// src/api/prompt-cache-order.js
var STORY_KEY_ORDER = [
  "edition",
  "active_character_canon",
  "active_general_npc_canon",
  "context",
  "player_action",
  "expected_turn"
];
var EXTRACT_KEY_ORDER = [
  "registered_characters",
  "registered_general_npcs",
  "active_character_canon",
  "active_general_npc_canon",
  "story_text",
  "parsed_story",
  "context",
  "player_action",
  "expected_turn"
];
function object10(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
__name(object10, "object");
function requestUrl3(input) {
  return typeof input === "string" ? input : input?.url ?? "";
}
__name(requestUrl3, "requestUrl");
function isCompletion2(url) {
  return url.endsWith("/chat/completions") || url.includes("/chat/completions?");
}
__name(isCompletion2, "isCompletion");
function orderedObject2(source, preferredOrder) {
  const result = {};
  const consumed = /* @__PURE__ */ new Set();
  for (const key of preferredOrder) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    result[key] = source[key];
    consumed.add(key);
  }
  for (const key of Object.keys(source).filter((key2) => !consumed.has(key2)).sort()) {
    result[key] = source[key];
  }
  return result;
}
__name(orderedObject2, "orderedObject");
function classifyPromptPayload(payload) {
  if (!object10(payload)) return null;
  if (Object.prototype.hasOwnProperty.call(payload, "story_text") || Object.prototype.hasOwnProperty.call(payload, "parsed_story") || Object.prototype.hasOwnProperty.call(payload, "registered_characters")) return "extract";
  if (Object.prototype.hasOwnProperty.call(payload, "edition") && Object.prototype.hasOwnProperty.call(payload, "active_character_canon") && Object.prototype.hasOwnProperty.call(payload, "context")) return "story";
  return null;
}
__name(classifyPromptPayload, "classifyPromptPayload");
function reorderPromptPayload(payload) {
  const type = classifyPromptPayload(payload);
  if (type === "story") return orderedObject2(payload, STORY_KEY_ORDER);
  if (type === "extract") return orderedObject2(payload, EXTRACT_KEY_ORDER);
  return payload;
}
__name(reorderPromptPayload, "reorderPromptPayload");
function applyPromptCacheOrder2(init = {}) {
  if (typeof init.body !== "string") return init;
  let body;
  try {
    body = JSON.parse(init.body);
  } catch {
    return init;
  }
  if (!Array.isArray(body.messages)) return init;
  let changed = false;
  const messages = body.messages.map((message) => {
    if (message?.role !== "user" || typeof message.content !== "string") return message;
    let payload;
    try {
      payload = JSON.parse(message.content);
    } catch {
      return message;
    }
    const type = classifyPromptPayload(payload);
    if (!type) return message;
    changed = true;
    return { ...message, content: JSON.stringify(reorderPromptPayload(payload)) };
  });
  if (!changed) return init;
  return { ...init, body: JSON.stringify({ ...body, messages }) };
}
__name(applyPromptCacheOrder2, "applyPromptCacheOrder");
function createPromptCacheOrderFetch(fetchImpl = fetch) {
  return (input, init = {}) => fetchImpl(
    input,
    isCompletion2(requestUrl3(input)) ? applyPromptCacheOrder2(init) : init
  );
}
__name(createPromptCacheOrderFetch, "createPromptCacheOrderFetch");
var PROMPT_CACHE_KEY_ORDER = Object.freeze({
  story: Object.freeze([...STORY_KEY_ORDER]),
  extract: Object.freeze([...EXTRACT_KEY_ORDER])
});

// src/api/product-response.js
function object11(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
__name(object11, "object");
function responseData(payload) {
  return object11(payload?.data) ?? object11(payload);
}
__name(responseData, "responseData");
function contextSave(context) {
  return object11(context?.save?.data) ?? object11(context?.save) ?? {};
}
__name(contextSave, "contextSave");
function latestTurn2(context) {
  const turns = Array.isArray(context?.recent_turns) ? context.recent_turns : [];
  return object11(turns.at(-1)) ?? {};
}
__name(latestTurn2, "latestTurn");
function latestMind2(context) {
  return object11(latestTurn2(context)?.mind_monitor) ?? {};
}
__name(latestMind2, "latestMind");
function canonicalMapLocations(edition2) {
  return (Array.isArray(edition2?.map?.locations) ? edition2.map.locations : []).filter((location) => typeof location?.location_id === "string" && location.location_id);
}
__name(canonicalMapLocations, "canonicalMapLocations");
function canonicalNpcDefaultLocations(edition2) {
  const defaults = {};
  for (const [id, profile] of Object.entries(object11(edition2?.characters?.characters) ?? {})) {
    if (typeof profile?.default_location_id === "string" && profile.default_location_id) {
      defaults[id] = profile.default_location_id;
    }
  }
  for (const [id, profile] of Object.entries(object11(edition2?.generalNpcs?.profiles) ?? {})) {
    if (typeof profile?.default_location_id === "string" && profile.default_location_id) {
      defaults[id] = profile.default_location_id;
    }
  }
  for (const location of canonicalMapLocations(edition2)) {
    for (const id of Array.isArray(location.default_npc_ids) ? location.default_npc_ids : []) {
      if (typeof id === "string" && id && !defaults[id]) defaults[id] = location.location_id;
    }
  }
  return defaults;
}
__name(canonicalNpcDefaultLocations, "canonicalNpcDefaultLocations");
function mergeNpcPayload2(save, edition2, latestMindMonitor, details) {
  const existing = new Map(buildNpcAppPayload(save, edition2, latestMindMonitor).map((item) => [item.id, item]));
  return buildFinderNpcList(save, edition2).map((finder) => {
    const base = existing.get(finder.id) ?? {
      id: finder.id,
      name: finder.name,
      department: finder.department,
      position: finder.position,
      role: finder.role,
      present_now: finder.present_now,
      location: {
        known: finder.known,
        location_label: finder.location_label,
        location_id: finder.location_id,
        suggested_location_label: finder.suggested_location_label,
        suggested_location_id: finder.suggested_location_id
      },
      stats: { affection: 0, acceptance: 0, arousal: 0, resistance: 0 },
      mind: { surface: "", subconscious: "" },
      scene_state: {},
      relationship_summary: ""
    };
    const detail = details[finder.id] ?? {};
    return {
      ...base,
      name: base.name || finder.name,
      department: base.department || finder.department,
      position: base.position || finder.position,
      role: base.role || finder.role,
      present_now: finder.present_now,
      location: {
        known: finder.known,
        location_label: finder.location_label,
        location_id: finder.location_id,
        suggested_location_label: finder.suggested_location_label,
        suggested_location_id: finder.suggested_location_id
      },
      profile: detail.profile ?? {},
      body: detail.body ?? {},
      stat_changes: detail.stat_changes ?? {},
      relationship_summary: base.relationship_summary || detail.relationship_summary || "",
      relationship_record: detail.relationship_record ?? {},
      private_info: detail.private_info ?? { unlocked: false }
    };
  });
}
__name(mergeNpcPayload2, "mergeNpcPayload");
function enrichContextEnvelope(payload, edition2) {
  const data = responseData(payload);
  const context = object11(data?.context);
  if (!data || !context) return payload;
  const save = contextSave(context);
  const currentTurn = latestTurn2(context);
  const baseDisplay = buildContextDisplayPayload(save, edition2, latestMind2(context));
  data.context = {
    ...context,
    display: {
      ...object11(context.display) ?? {},
      ...baseDisplay,
      // 회사 맵은 축약 projection이 아니라 번들 정본 전체를 보낸다.
      // description/zone/type/default_npcs가 빠지면 프론트가 빈 구조도로 축약된다.
      map_locations: canonicalMapLocations(edition2),
      npc_default_locations: canonicalNpcDefaultLocations(edition2),
      player_info: buildFullPlayerInfo(save, edition2),
      npc_finder: buildFinderNpcList(save, edition2),
      character_details: buildCharacterDisplayDetails(save, edition2, currentTurn),
      player_sexual: buildPlayerSexualDisplay(save)
    }
  };
  return payload;
}
__name(enrichContextEnvelope, "enrichContextEnvelope");
function enrichAppEnvelope(payload, context, edition2) {
  const data = responseData(payload);
  const app = object11(data?.app);
  const resolvedContext = object11(context);
  if (!data || !app || !resolvedContext) return payload;
  const save = contextSave(resolvedContext);
  const details = buildCharacterDisplayDetails(save, edition2, latestTurn2(resolvedContext));
  data.app = {
    ...app,
    player_info: buildFullPlayerInfo(save, edition2),
    npcs: mergeNpcPayload2(save, edition2, latestMind2(resolvedContext), details),
    finder_npcs: buildFinderNpcList(save, edition2)
  };
  return payload;
}
__name(enrichAppEnvelope, "enrichAppEnvelope");

// src/api/media-routes.js
var TTS_WORKER_URL = "https://fancy-dust-7f8c.zeroslove.workers.dev/";
function plainObject3(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(plainObject3, "plainObject");
function requestUrl4(input) {
  return typeof input === "string" ? input : input?.url ?? "";
}
__name(requestUrl4, "requestUrl");
function isContextRpc2(url) {
  return url.includes("/rest/v1/rpc/get_company_context");
}
__name(isContextRpc2, "isContextRpc");
function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa === "function") return btoa(binary);
  return globalThis.Buffer?.from?.(bytes)?.toString?.("base64") ?? "";
}
__name(bytesToBase64, "bytesToBase64");
async function parseTtsUrl(response, { allowAudioCompatibility = false } = {}) {
  if (!response?.ok) {
    throw new HttpError(502, "tts_upstream_failure", "TTS Worker request failed", true);
  }
  const contentType = response.headers?.get?.("content-type") ?? "";
  if (contentType.includes("application/json")) {
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new HttpError(502, "tts_invalid_response", "TTS Worker returned an invalid response", true);
    }
    if (!plainObject3(payload) || typeof payload.url !== "string" || !/^(?:https?:|data:audio\/)/i.test(payload.url)) {
      throw new HttpError(502, "tts_invalid_response", "TTS Worker returned no audio URL", true);
    }
    return payload.url;
  }
  if (allowAudioCompatibility && /^audio\//i.test(contentType)) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    const encoded = bytesToBase64(bytes);
    if (encoded) return `data:${contentType.split(";")[0] || "audio/mpeg"};base64,${encoded}`;
  }
  throw new HttpError(502, "tts_invalid_response", "TTS Worker returned no audio URL", true);
}
__name(parseTtsUrl, "parseTtsUrl");
async function synthesizeViaServiceBinding({ env, eligibility, spokenText, direction }) {
  let response;
  try {
    response = await env.TTS_WORKER.fetch(env.TTS_WORKER_URL || TTS_WORKER_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ voice_id: eligibility.voice_id, text: spokenText, direction })
    });
  } catch {
    throw new HttpError(502, "tts_upstream_failure", "TTS Worker request failed", true);
  }
  return parseTtsUrl(response);
}
__name(synthesizeViaServiceBinding, "synthesizeViaServiceBinding");
async function synthesizeViaLegacyProvider({ env, eligibility, spokenText, direction, fetchImpl }) {
  let response;
  try {
    response = await fetchImpl(env.TTS_API_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${env.TTS_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ voice_id: eligibility.voice_id, text: spokenText, direction })
    });
  } catch {
    throw new HttpError(502, "tts_upstream_failure", "TTS upstream request failed", true);
  }
  return parseTtsUrl(response, { allowAudioCompatibility: true });
}
__name(synthesizeViaLegacyProvider, "synthesizeViaLegacyProvider");
async function jsonPayload(response) {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}
__name(jsonPayload, "jsonPayload");
function responseWithJson2(response, payload) {
  const headers = new Headers(response.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(payload), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
__name(responseWithJson2, "responseWithJson");
function createMediaAwareTurnRoutes({ fetchImpl = fetch, edition: edition2 } = {}) {
  const policyFetch = createRegisteredNpcPolicyFetch(fetchImpl);
  const llmFetch = createPromptCacheOrderFetch(policyFetch);
  const routes = createTurnRoutes2({ fetchImpl: llmFetch, edition: edition2 });
  const master = masterFromEdition(edition2);
  return {
    ...routes,
    async context(request, env, ctx) {
      const response = await routes.context(request, env, ctx);
      if (!response?.ok) return response;
      const payload = await jsonPayload(response);
      if (!plainObject3(payload)) return response;
      enrichContextEnvelope(payload, edition2);
      return responseWithJson2(response, payload);
    },
    async appState(request, env, ctx) {
      let capturedContext = null;
      const captureFetch = /* @__PURE__ */ __name(async (input, init = {}) => {
        const response2 = await llmFetch(input, init);
        if (response2?.ok && isContextRpc2(requestUrl4(input))) {
          capturedContext = await jsonPayload(response2);
        }
        return response2;
      }, "captureFetch");
      const rawRoutes = createTurnRoutes({ fetchImpl: captureFetch, edition: edition2 });
      const response = await rawRoutes.appState(request, env, ctx);
      if (!response?.ok || !plainObject3(capturedContext)) return response;
      const payload = await jsonPayload(response);
      if (!plainObject3(payload)) return response;
      enrichAppEnvelope(payload, capturedContext, edition2);
      return responseWithJson2(response, payload);
    },
    async tts(request, env) {
      const body = await readJson(request);
      requireString(body.game_id, "game_id");
      const spokenText = requireString(body.text, "text");
      const speakerId = typeof body.character_id === "string" ? body.character_id : null;
      const direction = typeof body.direction === "string" ? body.direction.trim().slice(0, 120) : "";
      const eligibility = resolveTtsEligibility({ speakerId, text: spokenText, master });
      if (!eligibility.eligible) {
        throw new HttpError(422, eligibility.code.toLowerCase(), "TTS\uB97C \uC7AC\uC0DD\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", false);
      }
      let url;
      if (env?.TTS_WORKER && typeof env.TTS_WORKER.fetch === "function") {
        url = await synthesizeViaServiceBinding({ env, eligibility, spokenText, direction });
      } else if (typeof env?.TTS_API_URL === "string" && env.TTS_API_URL && typeof env?.TTS_API_KEY === "string" && env.TTS_API_KEY) {
        url = await synthesizeViaLegacyProvider({ env, eligibility, spokenText, direction, fetchImpl: llmFetch });
      } else {
        throw new HttpError(500, "configuration_error", "TTS_WORKER service binding is not configured", false);
      }
      return ok({ url });
    }
  };
}
__name(createMediaAwareTurnRoutes, "createMediaAwareTurnRoutes");

// src/api/index.js
var PHASE = "phase-2-vertical-loop";
function buildStatus() {
  return {
    ok: true,
    edition_id: edition_default2.editionId,
    phase: PHASE,
    content_version: edition_default2.contentVersion
  };
}
__name(buildStatus, "buildStatus");
function createApiWorker({ fetchImpl = fetch } = {}) {
  const routes = createMediaAwareTurnRoutes({ fetchImpl, edition: edition_default2 });
  return {
    async fetch(request) {
      const env = arguments[1] ?? {};
      const ctx = arguments[2];
      try {
        const { pathname } = new URL(request.url);
        if (request.method === "OPTIONS") return optionsResponse();
        if (request.method === "GET" && (pathname === "/health" || pathname === "/api/version")) return jsonResponse(buildStatus());
        if (request.method === "POST" && pathname === "/api/context") return await routes.context(request, env, ctx);
        if (request.method === "POST" && pathname === "/api/story") return await routes.story(request, env, ctx);
        if (request.method === "POST" && pathname === "/api/extract") return await routes.extract(request, env, ctx);
        if (request.method === "POST" && pathname === "/api/commit") return await routes.commit(request, env, ctx);
        if (request.method === "POST" && pathname === "/api/action-status") return await routes.actionStatus(request, env, ctx);
        if (request.method === "POST" && pathname === "/api/reset") return await routes.reset(request, env, ctx);
        if (request.method === "POST" && pathname === "/api/player-setup") return await routes.playerSetup(request, env, ctx);
        if (request.method === "POST" && pathname === "/api/opening") return await routes.opening(request, env, ctx);
        if (request.method === "POST" && pathname === "/api/app-manual") return await routes.appManual(request, env, ctx);
        if (request.method === "POST" && pathname === "/api/app-state") return await routes.appState(request, env, ctx);
        if (request.method === "POST" && pathname === "/api/app-validate") return await routes.appValidate(request, env, ctx);
        if (request.method === "POST" && pathname === "/api/history") return await routes.history(request, env, ctx);
        if (request.method === "POST" && pathname === "/api/feedback") return await routes.feedback(request, env, ctx);
        if (request.method === "POST" && pathname === "/api/image") return await routes.image(request, env, ctx);
        if (request.method === "POST" && pathname === "/api/tts") return await routes.tts(request, env, ctx);
        return fail(new HttpError(404, "not_found", "Route not found"));
      } catch (error) {
        return fail(error instanceof GameCoreError ? new HttpError(422, error.code.toLowerCase(), error.message) : error);
      }
    }
  };
}
__name(createApiWorker, "createApiWorker");
var index_default = createApiWorker();
export {
  createApiWorker,
  index_default as default
};
//# sourceMappingURL=index.js.map
