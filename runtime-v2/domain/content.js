import edition from '../../content/edition.json' with { type: 'json' };
import characters from '../../content/characters.json' with { type: 'json' };
import generalNpcs from '../../content/general_npcs.json' with { type: 'json' };
import map from '../../content/map.json' with { type: 'json' };

const aliasesFor = (id, name) => Object.freeze([id, name]);

function heroineRecord(id, value) {
  return Object.freeze({ id, name: value.name, kind: 'heroine', department: value.department, position: value.position, role_title: value.role_title, default_location_id: value.default_location_id, prompt_card: value.prompt_card, aliases: aliasesFor(id, value.name) });
}

function generalNpcRecord(id, value) {
  return Object.freeze({ id, name: value.name, kind: 'general_npc', department_id: value.department_id ?? null, role: value.role ?? null, aliases: aliasesFor(id, value.name) });
}

function locationRecord(value) {
  return Object.freeze({ id: value.location_id, name: value.name, description: value.description ?? '', department_id: value.department_id ?? null, location_type: value.location_type ?? null, default_npc_ids: Object.freeze([...(value.default_npc_ids ?? [])]), aliases: aliasesFor(value.location_id, value.name) });
}

const canonicalNpcs = [
  ...Object.entries(characters.characters ?? {}).map(([id, value]) => heroineRecord(id, value)),
  ...Object.entries(generalNpcs.profiles ?? {}).map(([id, value]) => generalNpcRecord(id, value))
];
const canonicalLocations = (map.locations ?? []).map(locationRecord);

export function createContentAdapter({ npcs = canonicalNpcs, locations = canonicalLocations, editionData = edition } = {}) {
  const npcMap = new Map(npcs.map((npc) => [npc.id, { ...npc, aliases: [...(npc.aliases ?? [])] }]));
  const locationMap = new Map(locations.map((location) => [location.id, { ...location, aliases: [...(location.aliases ?? [])] }]));
  return Object.freeze({
    version: editionData.content_version ?? 'company-v2',
    edition: Object.freeze({ edition_id: editionData.edition_id, title: editionData.title, scope: editionData.scope }),
    npcs: npcMap,
    locations: locationMap,
    npcIds: () => [...npcMap.keys()],
    locationIds: () => [...locationMap.keys()],
    getNpc: (id) => npcMap.get(id) ?? null,
    getLocation: (id) => locationMap.get(id) ?? null,
    identity: () => ({
      edition: { id: editionData.edition_id, title: editionData.title },
      player: { id: 'player-1', aliases: [] },
      npcs: Object.fromEntries([...npcMap.values()].map((npc) => [npc.id, { name: npc.name, aliases: npc.aliases }])),
      locations: Object.fromEntries([...locationMap.values()].map((location) => [location.id, { name: location.name, aliases: location.aliases }]))
    })
  });
}

export const companyV2Content = createContentAdapter();
