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
  const beforeName = new RegExp(`(?:^|\\s)${escaped}(?:\\uC744|\\uB97C)?\\s*(?:\\uBCF4\\uB7EC|\\uCC3E\\uC73C\\uB7EC|\\uB9CC\\uB098\\uB7EC|\\uBC29\\uBB38\\uD558\\uB7EC)`, 'u');
  const afterIntent = new RegExp(`(?:go\\s+to|go\\s+see|visit|find|meet|see)\\s+${escaped}\\b`, 'i');
  return beforeName.test(source) || afterIntent.test(source);
}

const EXPLICIT_MOVEMENT_INTENT = new RegExp('\\b(?:go|move|walk|enter|visit|leave)\\b|\\uC774\\uB3D9|\\uAC00\\uB2E4|\\uAC04\\uB2E4|\\uB098\\uAC00|\\uB4E4\\uC5B4\\uAC00|\\uCC3E\\uC544\\uAC00|\\uBC29\\uBB38|\\uBCF4\\uB7EC|\\uCC3E\\uC73C\\uB7EC|\\uB9CC\\uB098\\uB7EC', 'iu');

function targetIdsFromIntent(intent) {
  if (Array.isArray(intent?.target_npc_ids)) return [...new Set(intent.target_npc_ids.filter(id => typeof id === 'string' && id.trim()))];
  return typeof intent?.target_npc_id === 'string' && intent.target_npc_id.trim() ? [intent.target_npc_id.trim()] : [];
}

export function canonicalNpcDestinationIds(intent, { master = {}, mapLocations = [] } = {}) {
  if (intent?.kind !== 'player_navigation' || intent.source !== 'explicit_npc_destination') return [];
  const targets = targetIdsFromIntent(intent);
  if (!targets.length) return [];
  const entries = registeredEntries(master);
  const destinations = targets.map(targetId => {
    const entry = entries.find(item => item.id === targetId);
    const candidates = entry ? npcDestinationCandidates(entry, mapLocations) : [];
    return candidates.length === 1 ? candidates[0] : null;
  });
  if (destinations.some(destination => !destination) || new Set(destinations).size !== 1) return [];
  return targets;
}

export function isCanonicalNpcDestinationIntent(intent, { master = {}, mapLocations = [] } = {}) {
  const destinationId = identity(intent?.destination_location_id);
  const targets = canonicalNpcDestinationIds(intent, { master, mapLocations });
  if (!destinationId || !targets.length) return false;
  const entries = registeredEntries(master);
  return targets.every(targetId => {
    const entry = entries.find(item => item.id === targetId);
    return entry && npcDestinationCandidates(entry, mapLocations)[0] === destinationId;
  });
}

/**
 * Structural player navigation only. A player action may name one exact
 * catalog location, but an NPC-directed action never becomes player movement.
 */
export function resolvePlayerNavigationIntent({ save = {}, master = {}, playerAction = '', mapLocations = [] } = {}) {
  const source = typeof playerAction === 'string' ? playerAction.trim() : '';
  if (!source || !EXPLICIT_MOVEMENT_INTENT.test(source)) return null;
  const registered = registeredEntries(master);
  const mentioned = registered.filter(entry => entry.name && source.includes(entry.name));
  if (mentioned.length) {
    if (mentioned.length === 1 && !exactNpcVisitIntent(source, mentioned[0].name)) return null;
    const destinations = mentioned.map(entry => npcDestinationCandidates(entry, mapLocations));
    if (destinations.some(candidate => candidate.length !== 1) || new Set(destinations.map(candidate => candidate[0])).size !== 1) return null;
    const destination = destinations[0][0];
    return {
      kind: 'player_navigation',
      destination_location_id: destination,
      ...(mentioned.length === 1
        ? { target_npc_id: mentioned[0].id }
        : { target_npc_ids: mentioned.map(entry => entry.id) }),
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
