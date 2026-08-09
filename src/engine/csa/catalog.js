const MODIFIER_MAX_LENGTH = 0;
const STRENGTH_RANK = { weak: 1, medium: 2, strong: 3 };

const SELECTOR_LABELS = {
  female_employee: '회사 여성 직원 전체',
  male_employee: '회사 남성 직원 전체',
  company_employee: '회사 직원 전체'
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function selectorOptions(source) {
  return Object.entries(SELECTOR_LABELS).map(([id, label]) => ({ id, label }));
}

export function normalizeCompanyCsaCatalog(catalog = {}) {
  const source = isPlainObject(catalog) ? catalog : {};
  const items = Array.isArray(source.items) ? source.items : [];
  return {
    schema_version: 2,
    version: 2,
    selector_options: selectorOptions(source),
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
      content_template: typeof item?.content_template === 'string' ? item.content_template : ''
    }))
  };
}

export function getPresetCatalogItem(catalog, templateId) {
  return typeof templateId === 'string'
    ? (catalog?.items ?? []).find(item => item.id === templateId) ?? null
    : null;
}

/** Preset content is already a complete regulation sentence in the catalog JSON. */
export function renderPresetContent(_catalog, item) {
  return typeof item?.content_template === 'string' ? item.content_template : '';
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
      available: STRENGTH_RANK[item.strength] <= availableRank,
      content_template: item.content_template
    }))
  };
}

// Legacy particle helpers remain exported for older custom-content callers;
// catalog preset sentences no longer contain placeholders or invoke them.
function hasBatchim(value) {
  const text = String(value || '').trim();
  const code = text.slice(-1).codePointAt(0) || 0;
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
}
export function withSubjectParticle(label) { return `${label}${hasBatchim(label) ? '이' : '가'}`; }
export function withTopicParticle(label) { return `${label}${hasBatchim(label) ? '은' : '는'}`; }
export function withObjectParticle(label) { return `${label}${hasBatchim(label) ? '을' : '를'}`; }
export function withConjParticle(label) { return `${label}${hasBatchim(label) ? '과' : '와'}`; }
export function withPossessive(label) { return `${label}의`; }

export { MODIFIER_MAX_LENGTH, STRENGTH_RANK };
