/**
 * CSA is an institutional rule/context authority.  The only retained machine
 * projection is compact clothing continuity, which has a real UI/state
 * consumer.  Natural physical, relational, emotional, and sexual HOW belongs
 * to Story -> Extract -> open_facts, not to a finite CSA execution grammar.
 */
export const EXECUTION_KINDS = Object.freeze(['clothing_state']);
export const EXECUTION_ACTIONS = Object.freeze(new Set(['set_clothing_state']));
export const EXECUTION_TRIGGER_KINDS = Object.freeze(new Set(['always_during_work']));
export const RELATION_KINDS = Object.freeze(new Set());

const CLOTHING_STATES = Object.freeze({
  work_nude: { uniform_top: 'removed', uniform_bottom: 'removed', underwear_top: 'removed', underwear_bottom: 'removed' },
  work_in_underwear_only: { uniform_top: 'removed', uniform_bottom: 'removed', underwear_top: 'worn', underwear_bottom: 'worn' },
  work_without_underwear: { underwear_top: 'removed', underwear_bottom: 'removed' },
  no_bra_under_work_clothes: { underwear_top: 'removed' },
  no_panties_under_work_clothes: { underwear_bottom: 'removed' },
  work_topless: { uniform_top: 'removed' }
});

/** Derive only for old catalog rows; new rows should carry `execution`. */
export function deriveExecutionMetadata(item = {}) {
  const id = typeof item.id === 'string' ? item.id : '';
  const category = item.category;
  if (category === 'clothing' || CLOTHING_STATES[id]) {
    return { kind: 'clothing_state', action: 'set_clothing_state', trigger_kind: 'always_during_work', target_required: false, required_state: { ...(CLOTHING_STATES[id] ?? {}) } };
  }
  return null;
}

export function normalizeExecutionMetadata(item = {}) {
  const source = item?.execution && typeof item.execution === 'object' ? item.execution : deriveExecutionMetadata(item);
  if (!source || source.kind !== 'clothing_state') return null;
  const kind = EXECUTION_KINDS.includes(source.kind) ? source.kind : null;
  const required_state = source.required_state && typeof source.required_state === 'object' && !Array.isArray(source.required_state)
    ? { ...source.required_state } : undefined;
  return { kind, action: 'set_clothing_state', trigger_kind: 'always_during_work', target_required: false, ...(required_state ? { required_state } : {}) };
}

export function executionMetadataForRule(rule = {}) {
  if (!rule?.preset?.execution && !rule?.execution) return null;
  return normalizeExecutionMetadata({ execution: rule?.preset?.execution ?? rule?.execution, id: rule?.preset?.template_id, category: rule?.preset?.category, mode: rule?.preset?.mode, trigger: rule?.preset?.trigger });
}
