/**
 * find_npc — a pure, zero-LLM, zero-turn location lookup against the character's own
 * npc_scene_state.location_label (Company keeps location nested under npc_scene_state per its
 * own save schema, rather than donor's separate npc_locations map — same field, not stored
 * twice). Only the lookup itself is free; actually walking there rides the normal turn
 * pipeline as a structured_action, exactly like the CSA app's transactions never getting a
 * separate save endpoint.
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Returns { ok: true, location_label } or { ok: false, code } where code is one of
 * NPC_NOT_FOUND (not a registered/general character at all), NPC_ALREADY_PRESENT (already in
 * the current scene — nothing to find), or NPC_LOCATION_UNKNOWN (no stored location yet).
 * validLocationIds: a Set of the map catalog's canonical location_ids (from content/map.json),
 * supplied by the caller — this module never reads content files directly.
 */
export function findNpc({ save, characterId, isKnownCharacterId, validLocationIds = new Set() }) {
  if (typeof characterId !== 'string' || !characterId.trim() || !isKnownCharacterId(characterId)) {
    return { ok: false, code: 'NPC_NOT_FOUND' };
  }
  const npcsPresent = new Set(Array.isArray(save?.last_npcs_present) ? save.last_npcs_present : []);
  if (npcsPresent.has(characterId) || save?.focal_character_id === characterId) {
    return { ok: false, code: 'NPC_ALREADY_PRESENT' };
  }
  const sceneState = isPlainObject(save?.npc_scene_state?.[characterId]) ? save.npc_scene_state[characterId] : {};
  const locationLabel = typeof sceneState.location_label === 'string' && sceneState.location_label.trim() ? sceneState.location_label : null;
  const locationId = validLocationIds.has(sceneState.location_id) ? sceneState.location_id : null;
  if (!locationLabel && !locationId) return { ok: false, code: 'NPC_LOCATION_UNKNOWN' };
  return { ok: true, location_label: locationLabel, location_id: locationId };
}
