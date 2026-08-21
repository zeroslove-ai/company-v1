function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function array(value) { return Array.isArray(value) ? value : []; }

export function createCompanyR3Content(raw = {}) {
  const characters = object(raw.characters?.characters ?? raw.characters);
  const generalProfiles = object(raw.generalNpcs?.profiles ?? raw.generalNpcs);
  const generalNpcs = Object.entries(generalProfiles).map(([id, value]) => ({ id: value?.id ?? id, ...value }));
  const organization = object(raw.organization);
  const positions = object(raw.positions).positions ?? array(raw.positions);
  const bodyTypes = object(raw.bodyTypes).body_types ?? array(raw.bodyTypes);
  const speechStyles = object(raw.speechStyles).speech_styles ?? array(raw.speechStyles);
  const locations = object(raw.map).locations ?? array(raw.map);
  const content = {
    edition: object(raw.edition),
    characters,
    generalNpcs,
    locations,
    departments: array(organization.departments),
    positions,
    bodyTypes,
    speechStyles
  };
  return validateCompanyR3Content(content);
}

export function validateCompanyR3Content(content) {
  if (content?.edition?.edition_id !== 'company-v1') throw new Error('r3_invalid_edition');
  if (Object.keys(content.characters ?? {}).length !== 5) throw new Error('r3_invalid_character_catalog');
  if (!Array.isArray(content.locations) || content.locations.length === 0) throw new Error('r3_invalid_location_catalog');
  for (const [id, character] of Object.entries(content.characters)) {
    if (character?.character_id !== id || typeof character?.name !== 'string' || !character.name.trim()) throw new Error('r3_invalid_character');
  }
  return content;
}

export function registeredActorIds(content) {
  return new Set([
    ...Object.keys(content?.characters ?? {}),
    ...(content?.generalNpcs ?? []).map(item => item.id).filter(Boolean)
  ]);
}

export function locationIds(content) { return new Set((content?.locations ?? []).map(item => item?.location_id).filter(Boolean)); }

export function actorDirectory(content) {
  const directory = { ...(content?.characters ?? {}) };
  for (const npc of content?.generalNpcs ?? []) directory[npc.id] = npc;
  return directory;
}
