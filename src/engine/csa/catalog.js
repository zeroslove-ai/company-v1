const MODIFIER_MAX_LENGTH = 60;
const MODIFIER_UPGRADE_KEYWORDS = [
  '삽입', '펠라티오', '커닐링구스', '애널', '항문섹스', '질내사정', '사정',
  '오르가즘', '절정', '딥스로트', '피스톤', '자위', '성기', '성관계', '섹스'
];
const STRENGTH_RANK = { weak: 1, medium: 2, strong: 3 };

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

/** A modifier smuggling in explicit sexual vocabulary is rejected outright rather than silently accepted at a low tier. */
export function presetModifierExceedsTemplate(modifier, minimumStrength) {
  const text = typeof modifier === 'string' ? modifier : '';
  if (!text.trim()) return false;
  if (minimumStrength === 'strong') return false;
  return MODIFIER_UPGRADE_KEYWORDS.some(keyword => text.includes(keyword));
}

/** /api/app-state's single source for every dropdown the preset UI renders — the frontend never hardcodes option lists. */
export function buildPresetCatalogPayload(catalog, availableStrength) {
  const availableRank = STRENGTH_RANK[availableStrength] ?? 1;
  return {
    version: 1,
    actor_options: catalog.actor_options,
    target_options: catalog.target_options,
    trigger_options: catalog.trigger_options,
    duration_options: catalog.duration_options,
    categories: catalog.categories,
    items: catalog.items.map(item => ({
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
