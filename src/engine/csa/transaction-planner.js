import { APP_STRENGTH_RANK, APP_STRENGTH_LABELS, APP_STRENGTHS, getCsaLimits } from './capability.js';
import { getPresetCatalogItem, normalizeCompanyCsaCatalog, renderPresetContent } from './catalog.js';
import { normalizeCsaScope, getCsaRules, getActiveCsaEntries } from './applicability.js';
import { normalizeCsaSemanticContract } from './semantic-contract.js';

const OPERATION_ORDER = { deactivate: 0, update: 1, activate: 2 };
const MAX_OPERATIONS = 12;
const MAX_CONTENT_LENGTH = 300;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function appIssue(operation, code, message, operationIndex = null) {
  return {
    operation_index: operationIndex,
    client_id: typeof operation?.client_id === 'string' ? operation.client_id : null,
    domain: typeof operation?.domain === 'string' ? operation.domain : null,
    operation: typeof operation?.operation === 'string' ? operation.operation : null,
    code,
    message
  };
}

export function normalizeAppContent(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

export function summarizeOperations(operations) {
  const summary = { total: operations.length, csa_activate: 0, csa_update: 0, csa_deactivate: 0 };
  for (const operation of operations) {
    const key = `csa_${operation.operation}`;
    if (Object.prototype.hasOwnProperty.call(summary, key)) summary[key] += 1;
  }
  return summary;
}

function nextCsaId(existingIds, turnNumber) {
  let candidate = `csa_${turnNumber}`;
  let suffix = 1;
  while (existingIds.includes(candidate)) { candidate = `csa_${turnNumber}_${suffix}`; suffix += 1; }
  return candidate;
}

function legacyRoleSelector(value) {
  const aliases = {
    coworker: 'current_partner', conversation_partner: 'current_partner',
    another_present_person: 'current_scene_npcs', nearby_person: 'current_scene_npcs',
    employee: 'company_employee', everyone_in_company: 'company_employee',
    everyone_in_hospital: 'company_employee'
  };
  return aliases[value] || value;
}

/** Server-side single source of truth for a preset operation: re-derives canonical content from the catalog template. */
export function validatePresetOperation(catalog, raw, { availableStrength } = {}) {
  const normalizedCatalog = normalizeCompanyCsaCatalog(catalog);
  const preset = isPlainObject(raw?.preset) ? raw.preset : null;
  if (!preset) return { ok: false, code: 'PRESET_REQUIRED', message: '프리셋 정보가 없습니다.' };
  const item = getPresetCatalogItem(normalizedCatalog, preset.template_id);
  if (!item) return { ok: false, code: 'PRESET_NOT_FOUND', message: '알 수 없는 프리셋입니다.' };

  const requestedStrength = typeof raw?.strength === 'string' ? raw.strength.trim() : '';
  const catalogStrength = item.strength;
  if (!Object.prototype.hasOwnProperty.call(APP_STRENGTH_RANK, requestedStrength)) {
    return { ok: false, code: 'CSA_PRESET_STRENGTH_INVALID', message: '프리셋 강도를 선택해 주세요.' };
  }
  const availableRank = APP_STRENGTH_RANK[availableStrength] ?? 1;
  if (APP_STRENGTH_RANK[requestedStrength] > availableRank || APP_STRENGTH_RANK[catalogStrength] > availableRank) {
    return { ok: false, code: 'STRENGTH_LOCKED', message: '현재 레벨에서 사용할 수 없는 프리셋입니다.' };
  }
  if (requestedStrength !== catalogStrength) {
    return { ok: false, code: 'CSA_PRESET_STRENGTH_MISMATCH', message: '선택한 강도와 프리셋 등급이 일치하지 않습니다.' };
  }

  const roles = isPlainObject(preset.roles)
    ? { ...preset.roles }
    : {
        ...(preset.actor_group ? { performer_group: legacyRoleSelector(preset.actor_group) } : {}),
        ...(preset.target_group ? { recipient_group: legacyRoleSelector(preset.target_group) } : {})
      };
  for (const role of item.role_slots || []) {
    const value = roles[role.key] || role.default;
    if (!role.options.includes(value)) return { ok: false, code: 'PRESET_ROLE_INVALID', message: `${role.label}을(를) 선택해 주세요.` };
    roles[role.key] = value;
  }
  const roleValues = Object.values(roles).filter(value => typeof value === 'string');
  const uniqueRoleValues = new Set(roleValues);
  if (item.mutual === false && uniqueRoleValues.size < roleValues.length) {
    return { ok: false, code: 'PRESET_ROLE_CONFLICT', message: '서로 다른 역할을 선택해 주세요.' };
  }
  const content = renderPresetContent(normalizedCatalog, item, { roles });
  return {
    ok: true, content, strength: catalogStrength,
    preset: {
      version: 2,
      template_id: item.id,
      mode: item.mode,
      roles,
      required_action: item.required_action,
      sexual_actions: item.sexual_actions,
      method_policy: item.method_policy
    }
  };
}

/**
 * activate/update/deactivate planner. Ported from donor's planAppTransaction:
 * same validation ordering (deactivate -> update -> activate), same duplicate/
 * slot/content/strength checks, same preset-vs-custom branching. Never
 * mutates previousSave; returns the full next csa_active id list and
 * csa_rules map for the caller to commit through the normal turn pipeline.
 *
 * `capability` (from calculateCsaCapability, computed by the caller from the
 * player's actual level — never from the request) is the single source for
 * every strength/slot ceiling here. Preset operations are checked against
 * the exact same available_strength_id as custom operations — a client
 * cannot raise its own ceiling by claiming a strength in the payload.
 */
export function planCsaTransaction(previousSave, catalog, rawOperations, { turnNumber, capability } = {}) {
  if (!Array.isArray(rawOperations) || !rawOperations.length) {
    return { ok: false, status: 422, error_code: 'NO_CHANGES', issues: [appIssue(null, 'NO_CHANGES', '적용할 변경사항이 없습니다.')] };
  }
  if (rawOperations.length > MAX_OPERATIONS) {
    return { ok: false, status: 422, error_code: 'TOO_MANY_OPERATIONS', issues: [appIssue(null, 'TOO_MANY_OPERATIONS', '한 번에 최대 12개 작업만 적용할 수 있습니다.')] };
  }

  // CSA 활성 시각 — 규정이 실제로 만들어진 게임 시각. "아침부터/어제부터" 같은
  // 소급 표현을 막는 시간 경계로 사용된다 (csa_rules JSONB 내부 필드, migration 불필요).
  const gameTime = previousSave?.world_state?.game_time ?? {};
  const activatedGameTime = {
    day: typeof gameTime.day === 'number' ? gameTime.day : 1,
    minute_of_day: typeof gameTime.minute_of_day === 'number' ? gameTime.minute_of_day : 540
  };

  const availableStrengthId = capability?.available_strength_id ?? 'weak';
  const availableRank = APP_STRENGTH_RANK[availableStrengthId] ?? 1;
  const csaLimits = getCsaLimits(capability?.current_level ?? 1);
  const activeIds = Array.isArray(previousSave?.csa_active) ? [...previousSave.csa_active] : [];
  const rules = { ...getCsaRules(previousSave) };
  const issues = [];
  const seenClientIds = new Set();
  const seenTargets = new Set();
  const canonicalOperations = [];

  const ordered = rawOperations
    .map((operation, index) => ({ operation, index }))
    .sort((a, b) => (OPERATION_ORDER[a.operation?.operation] ?? 99) - (OPERATION_ORDER[b.operation?.operation] ?? 99) || a.index - b.index);

  for (const { operation: raw, index } of ordered) {
    if (!isPlainObject(raw) || raw.domain !== 'csa' || !['activate', 'update', 'deactivate'].includes(raw.operation)
      || typeof raw.client_id !== 'string' || !raw.client_id.trim() || raw.client_id.length > 80) {
      issues.push(appIssue(raw, 'INVALID_OPERATION', '상식개변 작업 형식이 올바르지 않습니다.', index));
      continue;
    }
    if (seenClientIds.has(raw.client_id)) { issues.push(appIssue(raw, 'DUPLICATE_TARGET', '같은 작업 식별자가 중복되었습니다.', index)); continue; }
    seenClientIds.add(raw.client_id);

    const id = typeof raw.id === 'string' && raw.id.trim().length <= 120 ? raw.id.trim() : '';
    if (raw.operation !== 'activate') {
      if (seenTargets.has(id)) { issues.push(appIssue(raw, 'DUPLICATE_TARGET', '같은 상식개변을 두 번 변경할 수 없습니다.', index)); continue; }
      seenTargets.add(id);
    }

    const content = normalizeAppContent(raw.content);
    const strength = typeof raw.strength === 'string' ? raw.strength.trim() : '';
    const validateContent = () => {
      if (!content) { issues.push(appIssue(raw, 'CONTENT_REQUIRED', '내용을 입력해 주세요.', index)); return false; }
      if (content.length > MAX_CONTENT_LENGTH) { issues.push(appIssue(raw, 'CONTENT_TOO_LONG', `내용은 ${MAX_CONTENT_LENGTH}자 이하여야 합니다.`, index)); return false; }
      return true;
    };
    const validateStrength = () => {
      if (!APP_STRENGTHS.has(strength) || APP_STRENGTH_RANK[strength] > availableRank) {
        issues.push(appIssue(raw, 'STRENGTH_LOCKED', '현재 레벨에서 사용할 수 없는 강도입니다.', index));
        return null;
      }
      return APP_STRENGTH_LABELS[strength];
    };
    const activeContents = () => activeIds.filter(activeId => activeId !== id).map(activeId => normalizeAppContent(rules[activeId]?.content));
    const isPresetOperation = raw.source_type === 'preset';

    if (raw.operation === 'activate') {
      if (isPresetOperation) {
        const validated = validatePresetOperation(catalog, raw, { availableStrength: availableStrengthId });
        if (!validated.ok) { issues.push(appIssue(raw, validated.code, validated.message, index)); continue; }
        if (activeContents().includes(validated.content)) { issues.push(appIssue(raw, 'DUPLICATE_TARGET', '같은 범위에 동일한 활성 상식개변이 있습니다.', index)); continue; }
        const newId = nextCsaId(Object.keys(rules), turnNumber);
        rules[newId] = { active: true, content: validated.content, strength: validated.strength, ...normalizeCsaScope(), created_turn: turnNumber, activated_game_time: activatedGameTime, source_type: 'preset', preset: validated.preset };
        activeIds.push(newId);
        canonicalOperations.push({ version: 1, client_id: raw.client_id, domain: 'csa', operation: 'activate', strength: validated.strength, scope_type: 'world', content: validated.content, source_type: 'preset', preset: validated.preset });
        continue;
      }
      const storageStrength = validateStrength();
      if (!validateContent() || !storageStrength) continue;
      if (activeContents().includes(content)) { issues.push(appIssue(raw, 'DUPLICATE_TARGET', '같은 범위에 동일한 활성 상식개변이 있습니다.', index)); continue; }
      const semanticContract = raw.semantic_contract ? normalizeCsaSemanticContract(raw.semantic_contract) : null;
      const newId = nextCsaId(Object.keys(rules), turnNumber);
      rules[newId] = { active: true, content, strength, ...normalizeCsaScope(), created_turn: turnNumber, activated_game_time: activatedGameTime, source_type: 'custom', preset: null, semantic_contract: semanticContract };
      activeIds.push(newId);
      canonicalOperations.push({ version: 1, client_id: raw.client_id, domain: 'csa', operation: 'activate', strength, scope_type: 'world', content, source_type: 'custom', semantic_contract: semanticContract });
      continue;
    }

    const target = rules[id];
    if (!target) { issues.push(appIssue(raw, 'CSA_NOT_FOUND', '대상 상식개변을 찾지 못했습니다.', index)); continue; }
    if (!target.active || !activeIds.includes(id)) { issues.push(appIssue(raw, 'CSA_INACTIVE', '이미 비활성화된 상식개변입니다.', index)); continue; }

    if (raw.operation === 'deactivate') {
      rules[id] = { ...target, active: false, updated_turn: turnNumber };
      const at = activeIds.indexOf(id);
      if (at !== -1) activeIds.splice(at, 1);
      canonicalOperations.push({ version: 1, client_id: raw.client_id, domain: 'csa', operation: 'deactivate', id });
      continue;
    }

    // update
    if (isPresetOperation) {
      const validated = validatePresetOperation(catalog, raw, { availableStrength: availableStrengthId });
      if (!validated.ok) { issues.push(appIssue(raw, validated.code, validated.message, index)); continue; }
      if (normalizeAppContent(target.content) === validated.content && target.strength === validated.strength) {
        issues.push(appIssue(raw, 'NO_CHANGES', '상식개변의 실제 변경사항이 없습니다.', index)); continue;
      }
      if (activeContents().includes(validated.content)) { issues.push(appIssue(raw, 'DUPLICATE_TARGET', '같은 범위에 동일한 활성 상식개변이 있습니다.', index)); continue; }
      rules[id] = { ...target, content: validated.content, strength: validated.strength, ...normalizeCsaScope(), updated_turn: turnNumber, source_type: 'preset', preset: validated.preset };
      canonicalOperations.push({ version: 1, client_id: raw.client_id, domain: 'csa', operation: 'update', id, strength: validated.strength, scope_type: 'world', content: validated.content, source_type: 'preset', preset: validated.preset });
      continue;
    }
    const storageStrength = validateStrength();
    if (!validateContent() || !storageStrength) continue;
    if (normalizeAppContent(target.content) === content && target.strength === strength) {
      issues.push(appIssue(raw, 'NO_CHANGES', '상식개변의 실제 변경사항이 없습니다.', index)); continue;
    }
    if (activeContents().includes(content)) { issues.push(appIssue(raw, 'DUPLICATE_TARGET', '같은 범위에 동일한 활성 상식개변이 있습니다.', index)); continue; }
    const semanticContract = raw.semantic_contract ? normalizeCsaSemanticContract(raw.semantic_contract) : (target.semantic_contract || null);
    // A preset entry edited without preset payload converts to custom — same as donor's fall-through.
    rules[id] = { ...target, content, strength, ...normalizeCsaScope(), updated_turn: turnNumber, source_type: 'custom', preset: null, semantic_contract: semanticContract };
    canonicalOperations.push({ version: 1, client_id: raw.client_id, domain: 'csa', operation: 'update', id, strength, scope_type: 'world', content, source_type: 'custom', semantic_contract: semanticContract });
  }

  if (issues.length) {
    const error_code = issues.length === 1 && issues[0]?.code === 'CSA_PRESET_STRENGTH_MISMATCH' ? 'CSA_PRESET_STRENGTH_MISMATCH' : 'APP_ACTION_INVALID';
    return { ok: false, status: 422, error_code, issues };
  }
  if (activeIds.length > csaLimits.max_active) {
    return { ok: false, status: 422, error_code: 'CSA_SLOT_FULL', issues: [appIssue(null, 'CSA_SLOT_FULL', '상식개변 활성 슬롯이 부족합니다.')] };
  }

  const summary = summarizeOperations(canonicalOperations);
  return {
    ok: true,
    canonical_action: { version: 1, type: 'app_transaction', base_turn_count: turnNumber - 1, operations: canonicalOperations },
    display_input: `상식개변 앱에서 상식개변 ${canonicalOperations.length}건의 변경사항을 적용한다.`,
    summary,
    next_csa_active: activeIds,
    next_csa_rules: rules
  };
}
