/**
 * Resolves a CSA actor_group/target_group tag against a concrete, currently-present general
 * NPC by role/sex/department — the missing piece that previously made "any actor_group ==
 * whichever NPC is present" the only option for non-heroine scenes. A tag with zero matching
 * present NPCs, or with more than one ambiguous match, never silently resolves.
 */
const GROUP_MATCHERS = {
  female_staff: npc => npc.sex === 'female' && npc.type === 'employee',
  male_staff: npc => npc.sex === 'male' && npc.type === 'employee',
  hospital_staff: npc => npc.type === 'employee',
  medical_staff: npc => npc.type === 'employee',
  nurse: npc => npc.type === 'employee',
  doctor: npc => npc.type === 'employee',
  visitor: npc => npc.type === 'partner',
  guardian: npc => npc.type === 'partner',
  patient: npc => npc.type === 'partner',
  everyone_in_hospital: () => true,
  another_present_person: () => true,
  nearby_person: () => true,
  conversation_partner: () => true
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * presentGeneralNpcs: array of general-NPC profile objects ({id,sex,type,department_id,...})
 * actually present in the current scene (already resolved by the caller against
 * save.last_npcs_present/scene_state, same as heroine resolution). Returns { id } on an
 * unambiguous match, or null on zero or multiple matches — role/sex/department mismatches all
 * collapse to null, never a guess.
 */
export function resolveGeneralNpcForGroup(groupId, presentGeneralNpcs = [], { departmentId = null } = {}) {
  const matcher = GROUP_MATCHERS[groupId];
  if (!matcher || !Array.isArray(presentGeneralNpcs) || !presentGeneralNpcs.length) return null;
  let candidates = presentGeneralNpcs.filter(npc => isPlainObject(npc) && matcher(npc));
  if (departmentId) candidates = candidates.filter(npc => npc.department_id === departmentId);
  return candidates.length === 1 ? { id: candidates[0].id } : null;
}
