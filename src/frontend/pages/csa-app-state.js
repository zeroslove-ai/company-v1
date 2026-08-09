/**
 * Pure draft-state logic for the 상식개변 앱, ported from donor's pages/csa-app.js
 * (presetCatalogItem/presetOptionLabel/presetPreviewContent/operations/dirty/
 * hydrateDraftItem/applyPresetDefaults/resetPresetSelection/
 * isPresetPayloadComplete/payloadFields/presetStructureEqual). No DOM access —
 * only object/array transforms, so it's unit-testable without a document.
 */

const STRENGTH_LABELS = { weak: '약함', medium: '중간', strong: '강함' };

function clone(value) { return JSON.parse(JSON.stringify(value || [])); }
function normalize(value) { return String(value || '').trim().replace(/\s+/g, ' '); }

export function activeItems(draft) {
  return (draft?.csa || []).filter(item => !item._deleted);
}

export function normalizeStrengthId(appState, value) {
  const text = String(value || '').trim();
  if (Object.prototype.hasOwnProperty.call(STRENGTH_LABELS, text)) return text;
  return Object.entries(STRENGTH_LABELS).find(([, label]) => label === text)?.[0] || null;
}

export function presetCatalogItem(appState, templateId) {
  return (appState?.csa_presets?.items || []).find(entry => entry.id === templateId) || null;
}

export function presetOptionLabel(appState, kind, id) {
  return (appState?.csa_presets?.selector_options || []).find(entry => entry.id === id)?.label || id || '';
}

export function presetStrength(item) {
  return item && Object.prototype.hasOwnProperty.call(STRENGTH_LABELS, item.strength) ? item.strength : null;
}

/** Cosmetic-only client preview — the server always re-derives canonical content from the same template at apply time. */
export function presetPreviewContent(appState, item) {
  const catalogItem = presetCatalogItem(appState, item.template_id);
  if (!catalogItem || !catalogItem.content_template || presetStrength(catalogItem) !== normalizeStrengthId(appState, item.strength)) return '';
  const roles = item.roles || {};
  const label = key => presetOptionLabel(appState, key, roles[key]);
  const params = {
    requester_subject: label('requester_group') || '',
    performer_subject: label('performer_group') || '',
    recipient_possessive: label('recipient_group') ? `${label('recipient_group')}의` : '',
    subject_subject: label('subject_group') || '',
    group_a_subject: label('group_a') || '',
    group_b_subject: label('group_b') || ''
  };
  const direct = {
    sit_on_recipient_lap: '{performer_subject} {recipient_possessive} 무릎 위에 올라앉아 몸을 밀착한다.',
    stand_between_recipient_knees: '{performer_subject} {recipient_possessive} 벌어진 무릎 사이에 가까이 선다.',
    press_body_against_recipient: '{performer_subject} {recipient_possessive} 몸에 가슴과 몸을 밀착한다.',
    hand_stimulate_genitals: '{performer_subject} {recipient_possessive} 성기를 손으로 잡고 반복해서 자극한다.'
  };
  const template = catalogItem.content_template;
  return template.replace(/\{(\w+)\}/g, (match, key) => Object.prototype.hasOwnProperty.call(params, key) ? params[key] : '');
}

export function applyPresetDefaults(item, catalogItem) {
  if (!catalogItem) return;
  item.category = catalogItem.category;
  item.template_id = catalogItem.id;
  item.roles = Object.fromEntries((catalogItem.role_slots || []).map(role => [role.key, role.default || role.options[0] || null]));
  item.strength = presetStrength(catalogItem);
}

export function resetPresetSelection(item, { preserveStrength = true } = {}) {
  item.category = null; item.template_id = null; item.roles = {}; item.content = '';
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
    item.roles = { ...(item.preset.roles || {}) };
    item.strength = normalizeStrengthId(appState, item.strength) || presetStrength(catalogItem) || null;
  } else {
    item.source_type = 'custom';
  }
  return item;
}

export function isPresetPayloadComplete(appState, preset, selectedStrength) {
  if (!preset || !preset.template_id || !preset.roles) return false;
  const catalogItem = presetCatalogItem(appState, preset.template_id);
  if (!catalogItem) return false;
  if (!normalizeStrengthId(appState, selectedStrength) || presetStrength(catalogItem) !== normalizeStrengthId(appState, selectedStrength)) return false;
  for (const role of catalogItem.role_slots || []) {
    if (!role.options.includes(preset.roles[role.key])) return false;
  }
  return true;
}

function currentPresetPayload(item) {
  return {
    template_id: item.template_id || null,
    roles: { ...(item.roles || {}) }
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
  return item.template_id === beforePreset.template_id
    && JSON.stringify(item.roles || {}) === JSON.stringify(beforePreset.roles || {})
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
