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
  return (appState?.csa_presets?.[`${kind}_options`] || []).find(entry => entry.id === id)?.label || '';
}

export function presetStrength(item) {
  return item ? (Object.prototype.hasOwnProperty.call(STRENGTH_LABELS, item.strength) ? item.strength : (Object.prototype.hasOwnProperty.call(STRENGTH_LABELS, item.minimum_strength) ? item.minimum_strength : null)) : null;
}

function hasKoreanBatchim(text) {
  const trimmed = String(text || '').trim();
  const code = trimmed.slice(-1).codePointAt(0) || 0;
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}
const withTopicParticle = word => `${word}${hasKoreanBatchim(word) ? '은' : '는'}`;
const withConjParticle = word => `${word}${hasKoreanBatchim(word) ? '과' : '와'}`;

/** Cosmetic-only client preview — the server always re-derives canonical content from the same template at apply time. */
export function presetPreviewContent(appState, item) {
  const catalogItem = presetCatalogItem(appState, item.template_id);
  if (!catalogItem || !catalogItem.content_template || presetStrength(catalogItem) !== normalizeStrengthId(appState, item.strength)) return '';
  const actorLabel = presetOptionLabel(appState, 'actor', item.actor_group);
  const targetLabel = item.target_group ? presetOptionLabel(appState, 'target', item.target_group) : '';
  const triggerLabel = presetOptionLabel(appState, 'trigger', item.trigger);
  const durationLabel = presetOptionLabel(appState, 'duration', item.duration);
  const modifier = normalize(item.modifier || '');
  const params = {
    actor_topic: actorLabel ? withTopicParticle(actorLabel) : '',
    target_conj: targetLabel ? withConjParticle(targetLabel) : '',
    target_possessive: targetLabel ? `${targetLabel}의` : '',
    trigger_text: triggerLabel, duration_text: durationLabel,
    modifier_clause: modifier ? `${modifier} ` : ''
  };
  return catalogItem.content_template.replace(/\{(\w+)\}/g, (match, key) => Object.prototype.hasOwnProperty.call(params, key) ? params[key] : '');
}

export function applyPresetDefaults(item, catalogItem) {
  if (!catalogItem) return;
  item.category = catalogItem.category;
  item.template_id = catalogItem.id;
  item.actor_group = catalogItem.default_actor;
  item.target_group = catalogItem.default_target || null;
  item.trigger = catalogItem.default_trigger;
  item.duration = catalogItem.default_duration;
  item.modifier = item.modifier || '';
  item.strength = presetStrength(catalogItem);
}

export function resetPresetSelection(item, { preserveStrength = true } = {}) {
  item.category = null; item.template_id = null; item.actor_group = null; item.target_group = null;
  item.trigger = null; item.duration = null; item.modifier = ''; item.content = '';
  if (!preserveStrength) item.strength = null;
}

export function hydrateDraftItem(item) {
  if (item.source_type === 'preset' && item.preset) {
    item.template_id = item.preset.template_id;
    item.category = null;
    item.actor_group = item.preset.actor_group || null;
    item.target_group = item.preset.target_group || null;
    item.trigger = item.preset.trigger || null;
    item.duration = item.preset.duration || null;
    item.modifier = item.preset.modifier || '';
  } else {
    item.source_type = 'custom';
  }
  return item;
}

export function isPresetPayloadComplete(appState, preset, selectedStrength) {
  if (!preset || !preset.template_id || !preset.actor_group || !preset.trigger || !preset.duration) return false;
  const catalogItem = presetCatalogItem(appState, preset.template_id);
  if (!catalogItem) return false;
  if (!normalizeStrengthId(appState, selectedStrength) || presetStrength(catalogItem) !== normalizeStrengthId(appState, selectedStrength)) return false;
  if (!catalogItem.actor_options.includes(preset.actor_group)) return false;
  if (catalogItem.target_options.length) {
    if (!preset.target_group || !catalogItem.target_options.includes(preset.target_group)) return false;
  } else if (preset.target_group) return false;
  return true;
}

function currentPresetPayload(item) {
  return {
    template_id: item.template_id || null,
    actor_group: item.actor_group || null,
    target_group: item.target_group || null,
    trigger: item.trigger || null,
    duration: item.duration || null,
    modifier: normalize(item.modifier || '')
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
    && (item.actor_group || null) === (beforePreset.actor_group || null)
    && (item.target_group || null) === (beforePreset.target_group || null)
    && item.trigger === beforePreset.trigger && item.duration === beforePreset.duration
    && normalize(item.modifier || '') === normalize(beforePreset.modifier || '')
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
  return { tab, notice, original: commonSense, csa: clone(appState.common_sense).map(hydrateDraftItem), issues: [] };
}
