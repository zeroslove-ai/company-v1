function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Remove only relation-derived presentation state after an exact relation end.
 * Posture, clothing, and other actors remain untouched.  An actor with any
 * remaining active structured relation keeps its presentation until that
 * relation is observed or superseded as well.
 */
export function clearRelationPresentationsForActors(save, actorIds = []) {
  const actors = [...new Set((Array.isArray(actorIds) ? actorIds : []).filter(id => typeof id === 'string' && id.trim()))];
  const activeRelations = Array.isArray(save?.active_relations) ? save.active_relations : [];
  const cleared = [];
  for (const actorId of actors) {
    if (activeRelations.some(item => item?.state === 'active' && item.actor_id === actorId)) continue;
    const current = save?.npc_scene_state?.[actorId];
    if (!object(current) || !Object.hasOwn(current, 'position_label')) continue;
    save.npc_scene_state = {
      ...(object(save.npc_scene_state) ? save.npc_scene_state : {}),
      [actorId]: { ...current, position_label: null }
    };
    cleared.push(actorId);
  }
  return cleared;
}
