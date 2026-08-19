const DEFAULT_NPCS = Object.freeze([
  { id: 'heroine1', name: '서원', aliases: ['서원'] },
  { id: 'heroine2', name: '다현', aliases: ['다현'] },
  { id: 'heroine5', name: '민지', aliases: ['민지'] }
]);

const DEFAULT_LOCATIONS = Object.freeze([
  { id: 'lobby', name: '회사 로비', aliases: ['로비', '회사 로비'] },
  { id: 'brand_strategy_office', name: '브랜드전략실', aliases: ['브랜드전략실'] }
]);

export function createContentAdapter({ npcs = DEFAULT_NPCS, locations = DEFAULT_LOCATIONS } = {}) {
  const npcMap = new Map(npcs.map((npc) => [npc.id, { ...npc, aliases: [...(npc.aliases ?? [])] }]));
  const locationMap = new Map(locations.map((location) => [location.id, { ...location, aliases: [...(location.aliases ?? [])] }]));
  return {
    version: 'company-v2-phase1',
    npcs: npcMap,
    locations: locationMap,
    npcIds: () => [...npcMap.keys()],
    locationIds: () => [...locationMap.keys()],
    getNpc: (id) => npcMap.get(id) ?? null,
    getLocation: (id) => locationMap.get(id) ?? null,
    identity: () => ({
      player: { id: 'player-1', aliases: [] },
      npcs: Object.fromEntries([...npcMap.values()].map((npc) => [npc.id, npc.aliases]))
    })
  };
}

export const companyV2Content = createContentAdapter();
