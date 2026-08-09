/**
 * Pure draft-state logic for the 상식개변 앱, ported from donor's pages/csa-app.js
 * (presetCatalogItem/presetPreviewContent/operations/dirty/
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

export function presetStrength(item) {
  return item && Object.prototype.hasOwnProperty.call(STRENGTH_LABELS, item.strength) ? item.strength : null;
}

/** Cosmetic-only client preview — the server always re-derives canonical content from the same template at apply time. */
export function presetPreviewContent(appState, item) {
  const catalogItem = presetCatalogItem(appState, item.template_id);
  if (!catalogItem || !catalogItem.content_template || presetStrength(catalogItem) !== normalizeStrengthId(appState, item.strength)) return '';
  return catalogItem.content_template;
}

export function applyPresetDefaults(item, catalogItem) {
  if (!catalogItem) return;
  item.category = catalogItem.category;
  item.template_id = catalogItem.id;
  delete item.roles;
  item.strength = presetStrength(catalogItem);
}

export function resetPresetSelection(item, { preserveStrength = true } = {}) {
  item.category = null; item.template_id = null; delete item.roles; item.content = '';
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
  } else {
    item.source_type = 'custom';
  }
  return item;
}

export function isPresetPayloadComplete(appState, preset, selectedStrength) {
  if (!preset || !preset.template_id) return false;
  const catalogItem = presetCatalogItem(appState, preset.template_id);
  return Boolean(catalogItem
    && normalizeStrengthId(appState, selectedStrength)
    && presetStrength(catalogItem) === normalizeStrengthId(appState, selectedStrength));
}

function currentPresetPayload(item) {
  return { template_id: item.template_id || null };
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
