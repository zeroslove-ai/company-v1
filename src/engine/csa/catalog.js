const MODIFIER_MAX_LENGTH = 0;
const STRENGTH_RANK = { weak: 1, medium: 2, strong: 3 };

const SELECTOR_LABELS = {
  player: '플레이어',
  current_partner: '현재 대화 상대',
  current_scene_npcs: '현재 장면의 NPC',
  female_employee: '회사 여성 직원 전체',
  male_employee: '회사 남성 직원 전체',
  company_employee: '회사 직원 전체',
  'character:heroine1': '서원희',
  'character:heroine2': '윤민아',
  'character:heroine3': '김제나',
  'character:heroine4': '한리브',
  'character:heroine5': '이메이'
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasBatchim(value) {
  const text = String(value || '').trim();
  const code = text.slice(-1).codePointAt(0) || 0;
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
}

export function withSubjectParticle(label) {
  return `${label}${hasBatchim(label) ? '이' : '가'}`;
}

export function withTopicParticle(label) {
  return `${label}${hasBatchim(label) ? '은' : '는'}`;
}

export function withObjectParticle(label) {
  return `${label}${hasBatchim(label) ? '을' : '를'}`;
}

export function withConjParticle(label) {
  return `${label}${hasBatchim(label) ? '과' : '와'}`;
}

export function withPossessive(label) {
  return `${label}의`;
}

function selectorLabel(id) {
  return SELECTOR_LABELS[id]
    || (typeof id === 'string' && id.startsWith('character:') ? id.slice(10) : id || '');
}

function roleOptions(role) {
  return Array.isArray(role?.options)
    ? role.options.filter(value => typeof value === 'string' && value.trim())
    : [];
}

function normalizeRoleSlots(item) {
  if (Array.isArray(item?.role_slots) && item.role_slots.length) {
    return item.role_slots.map(role => {
      const options = roleOptions(role);
      return {
        key: role.key,
        label: role.label,
        options,
        default: typeof role.default === 'string' && options.includes(role.default)
          ? role.default
          : options[0] || null
      };
    });
  }
  const roles = [];
  if (item?.default_actor) roles.push({ key: 'performer_group', label: '수행하는 사람', options: [item.default_actor], default: item.default_actor });
  if (item?.default_target) roles.push({ key: 'recipient_group', label: '행동을 받는 사람', options: [item.default_target], default: item.default_target });
  return roles;
}

export function normalizeCompanyCsaCatalog(catalog = {}) {
  const source = isPlainObject(catalog) ? catalog : {};
  return {
    schema_version: 2,
    version: 2,
    selector_options: Object.entries(SELECTOR_LABELS).map(([id, label]) => ({ id, label })),
    categories: Array.isArray(source.categories) ? source.categories : [],
    strengths: Array.isArray(source.strengths) ? source.strengths : [],
    items: (Array.isArray(source.items) ? source.items : []).map(item => ({
      ...item,
      strength: item.strength,
      mode: item.mode === 'continuous' ? 'continuous' : 'on_player_request',
      role_slots: normalizeRoleSlots(item),
      sexual_actions: Array.isArray(item.sexual_actions) ? [...item.sexual_actions] : [],
      method_policy: item.method_policy === 'restricted' ? 'restricted' : 'unspecified',
      content_template: typeof item.content_template === 'string' ? item.content_template : ''
    }))
  };
}

export function getPresetCatalogItem(catalog, templateId) {
  return typeof templateId === 'string'
    ? (catalog?.items ?? []).find(item => item.id === templateId) ?? null
    : null;
}

function roleLabel(catalog, id) {
  return catalog?.selector_options?.find(option => option.id === id)?.label || selectorLabel(id);
}

function roleMap(item, roles = {}) {
  return Object.fromEntries(normalizeRoleSlots(item).flatMap(role => {
    const value = roles[role.key] ?? role.default;
    return typeof value === 'string' && value.trim() ? [[role.key, value]] : [];
  }));
}

export function renderPresetContent(catalog, item, { roles = {}, actorId, targetId } = {}) {
  const values = roleMap(item, {
    ...roles,
    ...(actorId ? { performer_group: actorId } : {}),
    ...(targetId ? { recipient_group: targetId } : {})
  });
  const labels = Object.fromEntries(Object.entries(values).map(([key, id]) => [key, roleLabel(catalog, id)]));
  const params = {};
  for (const role of normalizeRoleSlots(item)) {
    const base = role.key.replace('_group', '');
    const label = labels[role.key] || '';
    params[`${base}_subject`] = withSubjectParticle(label);
    params[`${base}_topic`] = withTopicParticle(label);
    params[`${base}_object`] = withObjectParticle(label);
    params[`${base}_conj`] = withConjParticle(label);
    params[`${base}_possessive`] = withPossessive(label);
  }
  params.recipient = labels.recipient_group || '';
  params.group_a_subject = withSubjectParticle(labels.group_a || '');
  params.group_b_subject = withSubjectParticle(labels.group_b || '');
  params.group_a_conj = withConjParticle(labels.group_a || '');
  params.group_b_conj = withConjParticle(labels.group_b || '');
  const template = typeof item?.content_template === 'string' ? item.content_template : '';
  return template.replace(/\{(\w+)\}/g, (match, key) => params[key] ?? '');
}

export function presetModifierClause() { return ''; }
export function presetModifierExceedsTemplate() { return false; }

export function buildPresetCatalogPayload(catalog, availableStrength) {
  const normalized = normalizeCompanyCsaCatalog(catalog);
  const availableRank = STRENGTH_RANK[availableStrength] ?? 1;
  return {
    version: 2,
    schema_version: 2,
    selector_options: normalized.selector_options,
    categories: normalized.categories,
    strengths: normalized.strengths,
    items: normalized.items.map(item => ({
      id: item.id,
      category: item.category,
      label: item.label,
      strength: item.strength,
      mode: item.mode,
      available: STRENGTH_RANK[item.strength] <= availableRank,
      role_slots: item.role_slots,
      required_action: item.required_action,
      sexual_actions: item.sexual_actions,
      method_policy: item.method_policy,
      content_template: item.content_template
    }))
  };
}

export { MODIFIER_MAX_LENGTH, STRENGTH_RANK };
