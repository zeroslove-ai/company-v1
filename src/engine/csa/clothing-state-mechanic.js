/**
 * The one retained structured CSA mechanic: exact four-slot clothing state.
 *
 * This module deliberately does not interpret actions, consent, posture,
 * relations, or narrative rules.  Its callers are the catalog normalizer,
 * Story's read-only clothing projection, and the Commit clothing reducer.
 */
const CLOTHING_STATES = Object.freeze({
  work_nude: { uniform_top: 'removed', uniform_bottom: 'removed', underwear_top: 'removed', underwear_bottom: 'removed' },
  work_in_underwear_only: { uniform_top: 'removed', uniform_bottom: 'removed', underwear_top: 'worn', underwear_bottom: 'worn' },
  work_without_underwear: { underwear_top: 'removed', underwear_bottom: 'removed' },
  no_bra_under_work_clothes: { underwear_top: 'removed' },
  no_panties_under_work_clothes: { underwear_bottom: 'removed' },
  work_topless: { uniform_top: 'removed' }
});

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function deriveClothingState(item = {}) {
  const id = typeof item.id === 'string' ? item.id : '';
  if (item.category !== 'clothing' && !CLOTHING_STATES[id]) return null;
  return { kind: 'clothing_state', action: 'set_clothing_state', trigger_kind: 'always_during_work', target_required: false, required_state: { ...(CLOTHING_STATES[id] ?? {}) } };
}

/** Normalize only the exact clothing-state mechanic used by the fresh path. */
export function normalizeClothingStateMechanic(item = {}) {
  const source = object(item?.execution) ?? deriveClothingState(item);
  if (!source || source.kind !== 'clothing_state') return null;
  const requiredState = object(source.required_state);
  return {
    kind: 'clothing_state',
    action: 'set_clothing_state',
    trigger_kind: 'always_during_work',
    target_required: false,
    ...(requiredState ? { required_state: { ...requiredState } } : {})
  };
}

/** Read the exact structured clothing mechanic from an active saved rule. */
export function clothingMechanicForRule(rule = {}) {
  const preset = object(rule?.preset);
  return normalizeClothingStateMechanic({
    execution: preset?.execution ?? rule?.execution,
    id: preset?.template_id,
    category: preset?.category
  });
}
