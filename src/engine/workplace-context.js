import { readCanonicalSceneV1 } from './runtime-core/scene-reducer.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function identity(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function profileMap(edition) {
  return object(edition?.generalNpcs?.profiles) ?? {};
}

function locations(edition) {
  return Array.isArray(edition?.map?.locations) ? edition.map.locations : [];
}

function currentLocation(edition, save) {
  const locationId = identity(readCanonicalSceneV1(save).location_id);
  if (!locationId) return null;
  return locations(edition).find(location => location?.location_id === locationId) ?? null;
}

function compactProfile(profile) {
  if (!object(profile)) return null;
  const npcId = identity(profile.id);
  const name = identity(profile.name);
  if (!npcId || !name) return null;
  return {
    npc_id: npcId,
    name,
    sex: identity(profile.sex),
    age: Number.isInteger(profile.age) ? profile.age : null,
    role: identity(profile.role),
    department_id: identity(profile.department_id),
    type: identity(profile.type),
    affiliation_type: identity(profile.affiliation_type)
  };
}

export function buildRegisteredGeneralNpcs(edition) {
  return Object.values(profileMap(edition))
    .map(compactProfile)
    .filter(Boolean)
    .map(({ npc_id, name, role }) => ({ npc_id, name, role }));
}

export function buildGeneralNpcCanon(edition, ids) {
  const profiles = profileMap(edition);
  const canon = {};
  for (const id of Array.isArray(ids) ? ids : []) {
    const profile = compactProfile(profiles[id]);
    if (profile) canon[id] = profile;
  }
  return canon;
}

export function selectActiveGeneralNpcIds({ edition, save, text = '' } = {}) {
  const profiles = profileMap(edition);
  const ordered = [];
  const seen = new Set();
  const push = id => {
    if (!identity(id) || seen.has(id) || !object(profiles[id])) return;
    seen.add(id);
    ordered.push(id);
  };
  const source = typeof text === 'string' ? text : '';
  for (const [id, profile] of Object.entries(profiles)) {
    if (typeof profile?.name === 'string' && profile.name && source.includes(profile.name)) push(id);
  }
  const scene = readCanonicalSceneV1(save);
  push(scene.focal_character_id);
  push(scene.last_speaker_id);
  for (const id of scene.present_npc_ids) push(id);
  return ordered;
}

/**
 * Deterministic workplace projection. A nearby candidate is permission for Story to show
 * a plausible entrance, never evidence that the NPC is already present.
 */
export function buildWorkplaceContext(edition, save, { excludeIds = [], limit = 2 } = {}) {
  const scene = readCanonicalSceneV1(save);
  const location = currentLocation(edition, save);
  if (!location) return { location: null, eligible_nearby_npcs: [] };

  const profiles = profileMap(edition);
  const excluded = new Set(Array.isArray(excludeIds) ? excludeIds : []);
  const candidates = [];
  const seen = new Set();
  const add = (id, source) => {
    if (!identity(id) || excluded.has(id) || seen.has(id)) return;
    const profile = compactProfile(profiles[id]);
    if (!profile) return;
    seen.add(id);
    candidates.push({ ...profile, source, location_id: location.location_id });
  };

  for (const id of scene.present_npc_ids) add(id, 'scene_presence');
  for (const id of Array.isArray(location.default_npc_ids) ? location.default_npc_ids : []) {
    add(id, 'location_default');
  }

  return {
    location: {
      location_id: location.location_id,
      name: identity(location.name),
      floor: Number.isInteger(location.floor) ? location.floor : null,
      department_id: identity(location.department_id),
      location_type: identity(location.location_type),
      visibility: identity(location.visibility),
      scene_tags: Array.isArray(location.scene_tags)
        ? location.scene_tags.filter(tag => typeof tag === 'string' && tag.trim()).slice(0, 6)
        : [],
      adjacent_location_ids: Array.isArray(location.adjacent_location_ids)
        ? location.adjacent_location_ids.filter(id => typeof id === 'string' && id.trim()).slice(0, 6)
        : []
    },
    eligible_nearby_npcs: candidates.slice(0, Math.max(0, Math.min(Number.isInteger(limit) ? limit : 2, 2)))
  };
}
