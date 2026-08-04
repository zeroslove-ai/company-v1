/**
 * General (non-heroine) NPC catalog — background employees/partners distinct from the 5
 * registered heroines. They never get full per-turn state in the Story prompt (only the
 * currently-present ones do, via the same npc_scene_state/npc_emotion maps heroines use), are
 * never automatic romance targets, and are used for CSA actor/target-group role resolution
 * (see resolver.js) so a preset like "male_staff" can resolve to a real, concrete NPC instead
 * of only ever collapsing to the current focal heroine.
 */
const SEX_VALUES = new Set(['male', 'female']);
const TYPE_VALUES = new Set(['employee', 'partner']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function listGeneralNpcs(catalog) {
  const profiles = isPlainObject(catalog?.profiles) ? catalog.profiles : {};
  return Object.values(profiles).filter(profile =>
    isPlainObject(profile) && typeof profile.id === 'string' && typeof profile.name === 'string'
    && SEX_VALUES.has(profile.sex) && TYPE_VALUES.has(profile.type)
  );
}

export function getGeneralNpc(catalog, id) {
  const profiles = isPlainObject(catalog?.profiles) ? catalog.profiles : {};
  return isPlainObject(profiles[id]) ? profiles[id] : null;
}

/** True when the id belongs to the general-NPC catalog (as opposed to a registered heroine). */
export function isGeneralNpcId(catalog, id) {
  return getGeneralNpc(catalog, id) !== null;
}
