import { readCanonicalSceneV1 } from './runtime-core/scene-reducer.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function identity(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function entries(value, idField) {
  if (Array.isArray(value)) return value;
  return Object.entries(object(value)).map(([id, item]) => ({ [idField]: id, ...object(item) }));
}

function registeredEntries(master = {}) {
  return [
    ...entries(master.characters, 'character_id').map(item => ({
      id: identity(item?.character_id ?? item?.id),
      name: identity(item?.name),
      default_location_id: identity(item?.default_location_id)
    })),
    ...entries(master.general_npcs, 'npc_id').map(item => ({
      id: identity(item?.npc_id ?? item?.id),
      name: identity(item?.name),
      default_location_id: identity(item?.default_location_id)
    }))
  ].filter(item => item.id);
}

export function isPlayerRefId(id) {
  return id === 'player' || (typeof id === 'string' && /^player[-_]/i.test(id));
}

export function registeredNpcIdSet(master = {}) {
  return new Set(registeredEntries(master).map(item => item.id));
}

export function speakerNameById(master = {}, playerName = '') {
  const names = new Map(registeredEntries(master).map(item => [item.id, item.name]));
  if (playerName) names.set('player', playerName);
  return names;
}

function locationCandidates(mapLocations) {
  const candidates = [];
  for (const location of Array.isArray(mapLocations) ? mapLocations : []) {
    const id = identity(location?.location_id);
    if (!id) continue;
    for (const label of [location?.name, ...(Array.isArray(location?.aliases) ? location.aliases : [])]) {
      const name = identity(label);
      if (name) candidates.push({ id, name });
    }
  }
  return candidates;
}

function npcDestinationCandidates(entry, mapLocations) {
  const ids = new Set();
  if (entry?.default_location_id) ids.add(entry.default_location_id);
  for (const location of Array.isArray(mapLocations) ? mapLocations : []) {
    if (Array.isArray(location?.default_npc_ids) && location.default_npc_ids.includes(entry?.id)) {
      const id = identity(location?.location_id);
      if (id) ids.add(id);
    }
  }
  return [...ids];
}

function exactNpcVisitIntent(source, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const beforeName = new RegExp(`(?:^|\\s)${escaped}(?:을|를)?\\s*(?:보러|찾으러|만나러|방문하러)(?:간다|가다|가요|갑니다)?`, 'u');
  const afterIntent = new RegExp(`(?:go\\s+to|go\\s+see|visit|find|meet|see)\\s+${escaped}\\b`, 'i');
  return beforeName.test(source) || afterIntent.test(source);
}

/**
 * Structural player navigation only. A player action may name one exact
 * catalog location, but an NPC-directed action never becomes player movement.
 */
export function resolvePlayerNavigationIntent({ save = {}, master = {}, playerAction = '', mapLocations = [] } = {}) {
  const source = typeof playerAction === 'string' ? playerAction.trim() : '';
  if (!source || !(/\b(?:go|move|walk|enter|visit|leave)\b|이동|가다|간다|들어가|찾아가|방문/u.test(source))) return null;
  const registered = registeredEntries(master);
  const mentioned = registered.filter(entry => entry.name && source.includes(entry.name));
  if (mentioned.length) {
    if (mentioned.length !== 1 || !exactNpcVisitIntent(source, mentioned[0].name)) return null;
    const destinations = npcDestinationCandidates(mentioned[0], mapLocations);
    const current = identity(readCanonicalSceneV1(save, { master, mapLocations }).location_id);
    if (destinations.length !== 1 || destinations[0] === current) return null;
    return {
      kind: 'player_navigation',
      destination_location_id: destinations[0],
      target_npc_id: mentioned[0].id,
      source: 'explicit_npc_destination'
    };
  }
  const current = identity(readCanonicalSceneV1(save, { master, mapLocations }).location_id);
  const best = locationCandidates(mapLocations)
    .filter(candidate => source.includes(candidate.name))
    .sort((left, right) => right.name.length - left.name.length)[0];
  if (!best || best.id === current) return null;
  return { kind: 'player_navigation', destination_location_id: best.id, source: 'explicit_location' };
}
