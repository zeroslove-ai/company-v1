const MODIFIER_MAX_LENGTH = 0;
const STRENGTH_RANK = { weak: 1, medium: 2, strong: 3 };

const SELECTOR_LABELS = {
  female_employee: '회사 여성 직원 전체',
  male_employee: '회사 남성 직원 전체',
  company_employee: '회사 직원 전체'
};

const SUBJECT_SCOPE_LABELS = {
  player: '플레이어',
  female_employee: '회사 여성 직원',
  male_employee: '회사 남성 직원',
  company_employee: '회사 직원 전체'
};

const RELATIONAL_CATEGORIES = new Set(['posture', 'contact', 'sexual_action']);
const CLOTHING_OR_WORLD_CATEGORIES = new Set(['clothing', 'world_behavior']);
import { normalizeClothingStateMechanic } from './clothing-state-mechanic.js';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function selectorOptions(source) {
  return Object.entries(SELECTOR_LABELS).map(([id, label]) => ({ id, label }));
}

function hasFinalConsonant(label) {
  const last = Array.from(typeof label === 'string' ? label : '').at(-1);
  if (!last) return false;
  const code = last.codePointAt(0);
  return code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 !== 0 : false;
}

export function normalizeCompanyCsaCatalog(catalog = {}) {
  const source = isPlainObject(catalog) ? catalog : {};
  const items = Array.isArray(source.items) ? source.items : [];
  return {
    schema_version: 2,
    version: 2,
    // selector_options is the legacy affected-group list.  Subject/counterparty
    // selectors are exposed separately so old clients keep their three stable
    // group options while the new app can distinguish the rule's two scopes.
    selector_options: selectorOptions(source),
    subject_scope_options: Object.entries(SUBJECT_SCOPE_LABELS).map(([id, label]) => ({ id, label })),
    counterparty_scope_options: Object.entries(SUBJECT_SCOPE_LABELS).map(([id, label]) => ({ id, label })),
    authority_tiers: Array.isArray(source.authority_tiers) ? source.authority_tiers.map(tier => ({ ...tier })) : [],
    categories: Array.isArray(source.categories) ? source.categories.map(category => ({ ...category })) : [],
    strengths: Array.isArray(source.strengths) ? source.strengths.map(strength => ({ ...strength })) : [],
    items: items.map(item => ({
      id: item?.id,
      category: item?.category,
      strength: item?.strength,
      authority_tier: item?.authority_tier || item?.strength,
      label: typeof item?.label === 'string' ? item.label : '',
      affected_group: typeof item?.affected_group === 'string' ? item.affected_group : 'company_employee',
      mode: item?.mode === 'continuous' ? 'continuous' : 'on_player_request',
      trigger: typeof item?.trigger === 'string'
        ? item.trigger
        : (item?.mode === 'continuous' ? 'continuous' : 'on_counterparty_request'),
      allowed_subject_scopes: Array.isArray(item?.allowed_subject_scopes) && item.allowed_subject_scopes.length
        ? item.allowed_subject_scopes.filter(scope => Object.hasOwn(SUBJECT_SCOPE_LABELS, scope))
        : (CLOTHING_OR_WORLD_CATEGORIES.has(item?.category)
          ? ['player', 'female_employee', 'male_employee', 'company_employee']
          : [typeof item?.affected_group === 'string' ? item.affected_group : 'company_employee', 'company_employee']),
      default_subject_scope: typeof item?.default_subject_scope === 'string' && Object.hasOwn(SUBJECT_SCOPE_LABELS, item.default_subject_scope)
        ? item.default_subject_scope
        : (typeof item?.affected_group === 'string' ? item.affected_group : 'company_employee'),
      allowed_counterparty_scopes: Array.isArray(item?.allowed_counterparty_scopes)
        ? item.allowed_counterparty_scopes.filter(scope => Object.hasOwn(SUBJECT_SCOPE_LABELS, scope))
        : (RELATIONAL_CATEGORIES.has(item?.category) ? ['player', 'female_employee', 'male_employee', 'company_employee'] : []),
      default_counterparty_scope: typeof item?.default_counterparty_scope === 'string' && Object.hasOwn(SUBJECT_SCOPE_LABELS, item.default_counterparty_scope)
        ? item.default_counterparty_scope
        : (RELATIONAL_CATEGORIES.has(item?.category) ? 'company_employee' : null),
      content_template: typeof item?.content_template === 'string' ? item.content_template : '',
      scope_template: typeof item?.scope_template === 'string' ? item.scope_template : null,
      // Execution metadata is the machine-readable authority. Missing
      // metadata remains missing so a malformed catalog item cannot silently
      // fall back to interpreting natural-language content.
      execution: item?.execution ? normalizeClothingStateMechanic({ ...item, execution: item.execution }) : null
    }))
  };
}

export function getPresetCatalogItem(catalog, templateId) {
  if (typeof templateId !== 'string') return null;
  const canonicalId = templateId === 'work_topless' ? 'work_nude' : templateId;
  const direct = (catalog?.items ?? []).find(item => item.id === canonicalId);
  if (direct) return direct;
  return null;
}

/** Preset content is already a complete regulation sentence in the catalog JSON. */
export function renderPresetContent(_catalog, item, selection = null) {
  if (typeof item?.content_template !== 'string') return '';
  if (!selection || typeof selection !== 'object') return item.content_template;
  const labels = SUBJECT_SCOPE_LABELS;
  const subject = labels[selection.subject_scope || item.default_subject_scope || item.affected_group] || labels.company_employee;
  const counterparty = selection.counterparty_scope ? (labels[selection.counterparty_scope] || labels.company_employee) : '다른 회사 직원';
  const selectedTemplate = item.scope_template || item.content_template;
  const rendered = selectedTemplate
    .replaceAll('{subject}는', `${subject}${hasFinalConsonant(subject) ? '은' : '는'}`)
    .replaceAll('{subject}', subject)
    .replaceAll('{counterparty}과', `${counterparty}${hasFinalConsonant(counterparty) ? '과' : '와'}`)
    .replaceAll('{counterparty}와', `${counterparty}${hasFinalConsonant(counterparty) ? '과' : '와'}`)
    .replaceAll('{counterparty}', counterparty)
    .replaceAll('{trigger}', selection.trigger || item.trigger || item.mode || 'continuous');
  return item.mode === 'on_player_request'
    ? rendered.replaceAll('플레이어가 요청하면', '상대방이 요청하면').replaceAll('플레이어', counterparty)
    : rendered;
}

// Kept as compatibility exports for the existing custom-input path. Presets do
// not accept modifiers and never use these functions to create content.
export function presetModifierClause() { return ''; }
export function presetModifierExceedsTemplate() { return false; }

export function buildPresetCatalogPayload(catalog, availableStrength) {
  const normalized = normalizeCompanyCsaCatalog(catalog);
  const availableRank = STRENGTH_RANK[availableStrength] ?? 1;
  return {
    version: 2,
    schema_version: 2,
    selector_options: normalized.selector_options,
    subject_scope_options: normalized.subject_scope_options,
    counterparty_scope_options: normalized.counterparty_scope_options,
    authority_tiers: normalized.authority_tiers,
    categories: normalized.categories,
    strengths: normalized.strengths,
    items: normalized.items.map(item => ({
      id: item.id,
      category: item.category,
      label: item.label,
      strength: item.strength,
      authority_tier: item.authority_tier,
      affected_group: item.affected_group,
      mode: item.mode,
      trigger: item.trigger,
      allowed_subject_scopes: [...item.allowed_subject_scopes],
      default_subject_scope: item.default_subject_scope,
      allowed_counterparty_scopes: [...item.allowed_counterparty_scopes],
      default_counterparty_scope: item.default_counterparty_scope,
      available: STRENGTH_RANK[item.strength] <= availableRank,
      content_template: item.content_template,
      scope_template: item.scope_template,
      ...(item.execution ? { execution: { ...item.execution, ...(item.execution.required_state ? { required_state: { ...item.execution.required_state } } : {}) } } : {})
    }))
  };
}

export { MODIFIER_MAX_LENGTH, STRENGTH_RANK };
