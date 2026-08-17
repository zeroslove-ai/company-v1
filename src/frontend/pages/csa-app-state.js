/**
 * Pure draft-state logic for the 상식개변 앱, ported from donor's pages/csa-app.js
 * (presetCatalogItem/presetPreviewContent/operations/dirty/
 * hydrateDraftItem/applyPresetDefaults/resetPresetSelection/
 * isPresetPayloadComplete/payloadFields/presetStructureEqual). No DOM access —
 * only object/array transforms, so it's unit-testable without a document.
 */

const STRENGTH_LABELS = { weak: '약함', medium: '중간', strong: '강함' };
const SCOPE_LABELS = {
  player: '플레이어',
  female_employee: '회사 여성 직원',
  male_employee: '회사 남성 직원',
  company_employee: '회사 직원 전체'
};

function clone(value) { return JSON.parse(JSON.stringify(value || [])); }
function normalize(value) { return String(value || '').trim().replace(/\s+/g, ' '); }
function hasFinalConsonant(label) {
  const last = Array.from(typeof label === 'string' ? label : '').at(-1);
  if (!last) return false;
  const code = last.codePointAt(0);
  return code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 !== 0 : false;
}
export function activeItems(draft) {
  return (draft?.csa || []).filter(item => !item._deleted);
}

export function normalizeStrengthId(appState, value) {
  const text = String(value || '').trim();
  if (Object.prototype.hasOwnProperty.call(STRENGTH_LABELS, text)) return text;
  return Object.entries(STRENGTH_LABELS).find(([, label]) => label === text)?.[0] || null;
}

export function presetCatalogItem(appState, templateId) {
  const canonicalId = templateId === 'work_topless' ? 'work_nude' : templateId;
  return (appState?.csa_presets?.items || []).find(entry => entry.id === canonicalId) || null;
}

export function presetStrength(item) {
  return item && Object.prototype.hasOwnProperty.call(STRENGTH_LABELS, item.strength) ? item.strength : null;
}

/** Cosmetic-only client preview — the server always re-derives canonical content from the same template at apply time. */
export function presetPreviewContent(appState, item) {
  const catalogItem = presetCatalogItem(appState, item.template_id);
  if (!catalogItem || !catalogItem.content_template || presetStrength(catalogItem) !== normalizeStrengthId(appState, item.strength)) return '';
  const labels = { ...SCOPE_LABELS, ...Object.fromEntries((appState?.csa_presets?.subject_scope_options || appState?.csa_presets?.selector_options || []).map(option => [option.id, option.label])) };
  const subject = labels[item.subject_scope || catalogItem.default_subject_scope || catalogItem.affected_group] || SCOPE_LABELS.company_employee;
  const counterpartyScope = Object.hasOwn(item, 'counterparty_scope')
    ? item.counterparty_scope
    : (catalogItem.default_counterparty_scope
      || catalogItem.allowed_counterparty_scopes?.find(scope => scope === 'company_employee')
      || null);
  const counterparty = counterpartyScope ? (labels[counterpartyScope] || SCOPE_LABELS.company_employee) : '';
  const rendered = (catalogItem.scope_template || catalogItem.content_template)
    .replaceAll('{subject}는', `{subject}${hasFinalConsonant(subject) ? '은' : '는'}`)
    .replaceAll('{subject}', subject)
    .replaceAll('{counterparty}와', `{counterparty}${hasFinalConsonant(counterparty) ? '과' : '와'}`)
    .replaceAll('{counterparty}과', `{counterparty}${hasFinalConsonant(counterparty) ? '과' : '와'}`)
    .replaceAll('{counterparty}', counterparty);
  return catalogItem.mode === 'on_player_request'
    ? rendered.replaceAll('플레이어가 요청하면', '상대방이 요청하면').replaceAll('플레이어', counterparty)
    : rendered;
}

export function applyPresetDefaults(item, catalogItem) {
  if (!catalogItem) return;
  item.category = catalogItem.category;
  item.template_id = catalogItem.id;
  delete item.roles;
  item.strength = presetStrength(catalogItem);
  item.subject_scope = catalogItem.default_subject_scope || catalogItem.affected_group || 'company_employee';
  item.counterparty_scope = catalogItem.default_counterparty_scope
    || catalogItem.allowed_counterparty_scopes?.find(scope => scope === 'company_employee')
    || null;
  item.trigger = catalogItem.trigger || catalogItem.mode || 'continuous';
}

export function resetPresetSelection(item, { preserveStrength = true } = {}) {
  item.category = null; item.template_id = null; delete item.roles; item.content = '';
  delete item.subject_scope; delete item.counterparty_scope; delete item.trigger;
  if (!preserveStrength) item.strength = null;
}

/**
 * Rebuilds the flat edit fields from the persisted preset payload. The database
 * stores the canonical preset correctly; the category is catalog metadata and
 * must be restored here so a reopened item does not look blank or dirty.
 */
export function hydrateDraftItem(item, appState = null) {
  if (item.source_type === 'preset' && item.preset) {
    const catalogItem = presetCatalogItem(appState, item.preset.template_id);
    item.template_id = item.preset.template_id;
    item.category = catalogItem?.category ?? item.category ?? null;
    delete item.roles;
    item.strength = normalizeStrengthId(appState, item.strength) || presetStrength(catalogItem) || null;
    item.subject_scope = item.preset.subject_scope || catalogItem?.default_subject_scope || catalogItem?.affected_group || 'company_employee';
    item.counterparty_scope = item.preset.counterparty_scope || catalogItem?.default_counterparty_scope || null;
    item.trigger = item.preset.trigger || catalogItem?.trigger || catalogItem?.mode || 'continuous';
  } else {
    item.source_type = 'custom';
  }
  return item;
}

export function isPresetPayloadComplete(appState, preset, selectedStrength) {
  if (!preset || !preset.template_id) return false;
  const catalogItem = presetCatalogItem(appState, preset.template_id);
  const subjectScopes = catalogItem?.allowed_subject_scopes || [catalogItem?.default_subject_scope || catalogItem?.affected_group];
  const counterpartyScopes = catalogItem?.allowed_counterparty_scopes || [];
  return Boolean(catalogItem
    && normalizeStrengthId(appState, selectedStrength)
    && presetStrength(catalogItem) === normalizeStrengthId(appState, selectedStrength)
    && subjectScopes.includes(preset.subject_scope || catalogItem.default_subject_scope || catalogItem.affected_group)
    && (!counterpartyScopes.length || counterpartyScopes.includes(preset.counterparty_scope)));
}

function currentPresetPayload(item) {
  return {
    template_id: item.template_id || null,
    subject_scope: item.subject_scope || null,
    counterparty_scope: item.counterparty_scope || null,
    trigger: item.trigger || null
  };
}

function payloadFields(appState, item) {
  if (item.source_type !== 'preset') {
    return { source_type: 'custom', strength: item.strength, content: normalize(item.content || '') };
  }

  const preset = currentPresetPayload(item);
  // The UI edits flat fields for convenient rendering, while applyDraft performs
  // its final completeness check against item.preset. Materializing operations is
  // therefore also the single synchronization point between those two shapes.
  item.preset = preset;
  return {
    source_type: 'preset',
    strength: item.strength,
    content: presetPreviewContent(appState, item) || '',
    preset
  };
}

function presetStructureEqual(appState, item, beforePreset) {
  if (!beforePreset) return false;
  const catalogItem = presetCatalogItem(appState, beforePreset.template_id);
  const beforeSubject = beforePreset.subject_scope || catalogItem?.default_subject_scope || catalogItem?.affected_group || null;
  const beforeCounterparty = beforePreset.counterparty_scope || catalogItem?.default_counterparty_scope || null;
  const beforeTrigger = beforePreset.trigger || catalogItem?.trigger || catalogItem?.mode || null;
  return item.template_id === beforePreset.template_id
    && (item.subject_scope || null) === beforeSubject
    && (item.counterparty_scope || null) === beforeCounterparty
    && (item.trigger || null) === beforeTrigger
    && normalizeStrengthId(appState, item.strength) === presetStrength(presetCatalogItem(appState, beforePreset.template_id));
}

/** Diffs the draft against its original snapshot into the operations array /api/app-validate expects. */
export function operations(appState, draft) {
  if (!draft) return [];
  const original = new Map((draft.original || []).map(item => [item.id, item]));
  return draft.csa.flatMap(item => {
    if (item._new) return [{ client_id: item.client_id, domain: 'csa', operation: 'activate', ...payloadFields(appState, item) }];
    const before = original.get(item.id);
    if (!before) return [];
    if (item._deleted) return [{ client_id: `csa:${item.id}`, domain: 'csa', operation: 'deactivate', id: item.id }];
    const beforeIsPreset = before.source_type === 'preset';
    const unchanged = item.source_type === 'preset' && beforeIsPreset
      ? presetStructureEqual(appState, item, before.preset)
      : (item.source_type !== 'preset' && !beforeIsPreset && normalize(item.content) === normalize(before.content) && item.strength === before.strength);
    return unchanged ? [] : [{ client_id: `csa:${item.id}`, domain: 'csa', operation: 'update', id: item.id, ...payloadFields(appState, item) }];
  }).sort((a, b) => `${a.operation}:${a.id || a.client_id}`.localeCompare(`${b.operation}:${b.id || b.client_id}`));
}

export function dirty(appState, draft) {
  return operations(appState, draft).length > 0;
}

export function createDraft(appState, tab = 'home', notice = '') {
  const commonSense = clone(appState.common_sense);
  return {
    tab,
    notice,
    original: commonSense,
    csa: clone(appState.common_sense).map(item => hydrateDraftItem(item, appState)),
    issues: []
  };
}
