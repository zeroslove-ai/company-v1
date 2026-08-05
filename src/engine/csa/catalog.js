import {
  canonicalizeCsaDuration,
  canonicalizeCsaGroup,
  canonicalizeCsaTrigger
} from './semantic-contract.js';

const MODIFIER_MAX_LENGTH = 60;
const MODIFIER_UPGRADE_KEYWORDS = [
  '삽입', '펠라티오', '커닐링구스', '애널', '항문섹스', '질내사정', '사정',
  '오르가즘', '절정', '딥스로트', '피스톤', '자위', '성기', '성관계', '섹스'
];
const STRENGTH_RANK = { weak: 1, medium: 2, strong: 3 };

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasKoreanBatchim(text) {
  const trimmed = String(text || '').trim();
  const code = trimmed.slice(-1).codePointAt(0) || 0;
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

export function withTopicParticle(word) {
  return `${word}${hasKoreanBatchim(word) ? '은' : '는'}`;
}

export function withConjParticle(word) {
  return `${word}${hasKoreanBatchim(word) ? '과' : '와'}`;
}

function uniqueOptions(options, canonicalize) {
  const result = [];
  const seen = new Set();
  for (const option of Array.isArray(options) ? options : []) {
    if (!isPlainObject(option)) continue;
    const id = canonicalize(option.id);
    if (!id || id === 'unknown' || seen.has(id)) continue;
    seen.add(id);
    result.push({ ...option, id });
  }
  return result;
}

function uniqueIds(values, canonicalize) {
  const result = [];
  const seen = new Set();
  for (const value of Array.isArray(values) ? values : []) {
    const id = canonicalize(value);
    if (!id || id === 'unknown' || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

/**
 * Converts the donor-era hospital identifiers in the bundled preset file at the edition boundary.
 * The source JSON stays readable for old saves and pending payloads, while every runtime/API/UI
 * consumer receives Company-native identifiers. This is an adapter, not a second catalog.
 */
export function normalizeCompanyCsaCatalog(catalog = {}) {
  const source = isPlainObject(catalog) ? catalog : {};
  const actor = value => canonicalizeCsaGroup(value);
  const target = value => canonicalizeCsaGroup(value, { target: true });
  const trigger = value => canonicalizeCsaTrigger(value);
  const duration = value => canonicalizeCsaDuration(value);
  return {
    ...source,
    actor_options: uniqueOptions(source.actor_options, actor),
    target_options: uniqueOptions(source.target_options, target),
    trigger_options: uniqueOptions(source.trigger_options, trigger),
    duration_options: uniqueOptions(source.duration_options, duration),
    categories: Array.isArray(source.categories) ? source.categories : [],
    items: (Array.isArray(source.items) ? source.items : []).map(item => ({
      ...item,
      actor_options: uniqueIds(item?.actor_options, actor),
      target_options: uniqueIds(item?.target_options, target),
      default_actor: item?.default_actor ? actor(item.default_actor) : null,
      default_target: item?.default_target ? target(item.default_target) : null,
      allowed_triggers: uniqueIds(item?.allowed_triggers, trigger),
      default_trigger: item?.default_trigger ? trigger(item.default_trigger) : 'none',
      allowed_durations: uniqueIds(item?.allowed_durations, duration),
      default_duration: item?.default_duration ? duration(item.default_duration) : 'continuous'
    })),
    sexual_action_contract: isPlainObject(source.sexual_action_contract) ? source.sexual_action_contract : {}
  };
}

/** Looks up one catalog item by its stable template_id, or null when unknown. */
export function getPresetCatalogItem(catalog, templateId) {
  if (typeof templateId !== 'string') return null;
  return (catalog?.items ?? []).find(item => item.id === templateId) ?? null;
}

function optionLabel(catalog, kind, id) {
  const list = catalog?.[`${kind}_options`] ?? [];
  return list.find(entry => entry.id === id)?.label ?? '';
}

export function presetModifierClause(modifier) {
  const text = typeof modifier === 'string' ? modifier.trim().replace(/\s+/g, ' ') : '';
  return text ? `${text} ` : '';
}

/** Server-authoritative content string — always re-derived from the template, never trusted from the client. */
export function renderPresetContent(catalog, item, { actorId, targetId, triggerId, durationId, modifier } = {}) {
  const actorLabel = optionLabel(catalog, 'actor', actorId);
  const targetLabel = targetId ? optionLabel(catalog, 'target', targetId) : '';
  const triggerLabel = optionLabel(catalog, 'trigger', triggerId);
  const durationLabel = optionLabel(catalog, 'duration', durationId);
  const params = {
    actor_topic: actorLabel ? withTopicParticle(actorLabel) : '',
    target_conj: targetLabel ? withConjParticle(targetLabel) : '',
    target_possessive: targetLabel ? `${targetLabel}의` : '',
    trigger_text: triggerLabel,
    duration_text: durationLabel,
    modifier_clause: presetModifierClause(modifier)
  };
  return String(item?.content_template ?? '').replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? params[key] : '');
}

/** A modifier smuggling in explicit sexual vocabulary is rejected rather than silently upgraded. */
export function presetModifierExceedsTemplate(modifier, minimumStrength) {
  const text = typeof modifier === 'string' ? modifier : '';
  if (!text.trim()) return false;
  if (minimumStrength === 'strong') return false;
  return MODIFIER_UPGRADE_KEYWORDS.some(keyword => text.includes(keyword));
}

/** /api/app-state's single source for every dropdown the preset UI renders. */
export function buildPresetCatalogPayload(catalog, availableStrength) {
  const normalized = normalizeCompanyCsaCatalog(catalog);
  const availableRank = STRENGTH_RANK[availableStrength] ?? 1;
  return {
    version: 1,
    actor_options: normalized.actor_options,
    target_options: normalized.target_options,
    trigger_options: normalized.trigger_options,
    duration_options: normalized.duration_options,
    categories: normalized.categories,
    items: normalized.items.map(item => ({
      id: item.id, category: item.category, label: item.label,
      strength: item.strength, minimum_strength: item.minimum_strength,
      available: STRENGTH_RANK[item.strength] <= availableRank,
      actor_options: item.actor_options, target_options: item.target_options,
      default_actor: item.default_actor, default_target: item.default_target,
      allowed_triggers: item.allowed_triggers, default_trigger: item.default_trigger,
      allowed_durations: item.allowed_durations, default_duration: item.default_duration,
      synergy_ids: Array.isArray(item.synergy_ids) ? item.synergy_ids : [],
      content_template: item.content_template
    }))
  };
}

export { MODIFIER_MAX_LENGTH, STRENGTH_RANK };
