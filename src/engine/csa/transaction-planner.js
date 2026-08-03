import { APP_STRENGTH_RANK, APP_STRENGTH_LABELS, APP_STRENGTHS, APP_STRENGTH_UNLOCKS, getCsaLimits } from './capability.js';
import { getPresetCatalogItem, renderPresetContent, presetModifierExceedsTemplate, MODIFIER_MAX_LENGTH } from './catalog.js';
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

/** Server-side single source of truth for a preset operation: re-derives canonical content from the catalog template. */
export function validatePresetOperation(catalog, raw, { availableStrength } = {}) {
  const preset = isPlainObject(raw?.preset) ? raw.preset : null;
  if (!preset) return { ok: false, code: 'PRESET_REQUIRED', message: '프리셋 정보가 없습니다.' };
  const item = getPresetCatalogItem(catalog, preset.template_id);
  if (!item) return { ok: false, code: 'PRESET_NOT_FOUND', message: '알 수 없는 프리셋입니다.' };

  const requestedStrength = typeof raw?.strength === 'string' ? raw.strength.trim() : '';
  const catalogStrength = item.strength || item.minimum_strength;
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

  const actorId = typeof preset.actor_group === 'string' ? preset.actor_group : '';
  if (!item.actor_options.includes(actorId)) return { ok: false, code: 'PRESET_ACTOR_INVALID', message: '이 프리셋에서 선택할 수 없는 행동 주체입니다.' };

  const targetId = typeof preset.target_group === 'string' ? preset.target_group : '';
  if (item.target_options.length) {
    if (!item.target_options.includes(targetId)) return { ok: false, code: 'PRESET_TARGET_INVALID', message: '이 프리셋에서 선택할 수 없는 상대입니다.' };
    if (targetId === actorId) return { ok: false, code: 'PRESET_ACTOR_TARGET_CONFLICT', message: '행동 주체와 상대가 같을 수 없습니다.' };
  } else if (targetId) {
    return { ok: false, code: 'PRESET_TARGET_INVALID', message: '이 프리셋은 상대를 지정할 수 없습니다.' };
  }

  const triggerId = typeof preset.trigger === 'string' ? preset.trigger : '';
  if (!item.allowed_triggers.includes(triggerId)) return { ok: false, code: 'PRESET_TRIGGER_INVALID', message: '이 프리셋에서 선택할 수 없는 발동 상황입니다.' };

  const durationId = typeof preset.duration === 'string' ? preset.duration : '';
  if (!item.allowed_durations.includes(durationId)) return { ok: false, code: 'PRESET_DURATION_INVALID', message: '이 프리셋에서 선택할 수 없는 지속 조건입니다.' };

  const modifier = typeof preset.modifier === 'string' ? preset.modifier.trim().replace(/\s+/g, ' ') : '';
  if (modifier.length > MODIFIER_MAX_LENGTH) return { ok: false, code: 'PRESET_MODIFIER_TOO_LONG', message: `세부 수식어는 ${MODIFIER_MAX_LENGTH}자 이하여야 합니다.` };
  if (presetModifierExceedsTemplate(modifier, catalogStrength)) return { ok: false, code: 'PRESET_MODIFIER_EXCEEDS_STRENGTH', message: '세부 수식어가 이 프리셋의 강도를 넘어섭니다.' };

  const content = renderPresetContent(catalog, item, { actorId, targetId: targetId || null, triggerId, durationId, modifier });
  return {
    ok: true, content, strength: catalogStrength,
    preset: {
      version: 1, template_id: item.id, actor_group: actorId, target_group: targetId || null,
      trigger: triggerId, duration: durationId, modifier, required_action: item.required_action,
      public_normalization: item.public_normalization === true, persistent: item.persistent === true,
      direct_meaning_tags: item.direct_meaning_tags
    }
  };
}

/**
 * activate/update/deactivate planner. Ported from donor's planAppTransaction:
 * same validation ordering (deactivate -> update -> activate), same duplicate/
 * slot/content/strength checks, same preset-vs-custom branching. Never
 * mutates previousSave; returns the full next csa_active id list and
 * csa_rules map for the caller to commit through the normal turn pipeline.
 */
export function planCsaTransaction(previousSave, catalog, rawOperations, { turnNumber, level } = {}) {
  if (!Array.isArray(rawOperations) || !rawOperations.length) {
    return { ok: false, status: 422, error_code: 'NO_CHANGES', issues: [appIssue(null, 'NO_CHANGES', '적용할 변경사항이 없습니다.')] };
  }
  if (rawOperations.length > MAX_OPERATIONS) {
    return { ok: false, status: 422, error_code: 'TOO_MANY_OPERATIONS', issues: [appIssue(null, 'TOO_MANY_OPERATIONS', '한 번에 최대 12개 작업만 적용할 수 있습니다.')] };
  }

  const csaLimits = getCsaLimits(level);
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
      if (!APP_STRENGTHS.has(strength) || level < APP_STRENGTH_UNLOCKS[strength]) {
        issues.push(appIssue(raw, 'STRENGTH_LOCKED', '현재 레벨에서 사용할 수 없는 강도입니다.', index));
        return null;
      }
      return APP_STRENGTH_LABELS[strength];
    };
    const activeContents = () => activeIds.filter(activeId => activeId !== id).map(activeId => normalizeAppContent(rules[activeId]?.content));
    const isPresetOperation = raw.source_type === 'preset';

    if (raw.operation === 'activate') {
      if (isPresetOperation) {
        const validated = validatePresetOperation(catalog, raw, { availableStrength: strength || undefined });
        if (!validated.ok) { issues.push(appIssue(raw, validated.code, validated.message, index)); continue; }
        if (activeContents().includes(validated.content)) { issues.push(appIssue(raw, 'DUPLICATE_TARGET', '같은 범위에 동일한 활성 상식개변이 있습니다.', index)); continue; }
        const newId = nextCsaId(Object.keys(rules), turnNumber);
        rules[newId] = { active: true, content: validated.content, strength: validated.strength, ...normalizeCsaScope(), created_turn: turnNumber, source_type: 'preset', preset: validated.preset };
        activeIds.push(newId);
        canonicalOperations.push({ version: 1, client_id: raw.client_id, domain: 'csa', operation: 'activate', strength: validated.strength, scope_type: 'world', content: validated.content, source_type: 'preset', preset: validated.preset });
        continue;
      }
      const storageStrength = validateStrength();
      if (!validateContent() || !storageStrength) continue;
      if (activeContents().includes(content)) { issues.push(appIssue(raw, 'DUPLICATE_TARGET', '같은 범위에 동일한 활성 상식개변이 있습니다.', index)); continue; }
      const semanticContract = raw.semantic_contract ? normalizeCsaSemanticContract(raw.semantic_contract) : null;
      const newId = nextCsaId(Object.keys(rules), turnNumber);
      rules[newId] = { active: true, content, strength, ...normalizeCsaScope(), created_turn: turnNumber, source_type: 'custom', preset: null, semantic_contract: semanticContract };
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
      const validated = validatePresetOperation(catalog, raw, { availableStrength: strength || undefined });
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
