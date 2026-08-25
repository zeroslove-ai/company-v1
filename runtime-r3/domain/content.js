function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function array(value) { return Array.isArray(value) ? value : []; }

function boundedText(value, max = 420) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

function dramatizationCard(card) {
  const source = object(card?.dramatization);
  const fields = ['ordinary_initiative', 'private_life', 'stress_conflict_care', 'hierarchy', 'attraction_boundaries', 'csa_first_reaction', 'csa_adaptation', 'continuity'];
  return {
    ...Object.fromEntries(fields.map(field => [field, boundedText(source[field])]).filter(([, value]) => value)),
    dialogue_examples: array(source.dialogue_examples).map(item => boundedText(item, 300)).filter(Boolean).slice(0, 4)
  };
}

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
    speechStyles,
    csaPresets: raw.csaPresets ?? null,
    mediaCatalog: object(raw.mediaCatalog)
  };
  return validateCompanyR3Content(content);
}

export function validateCompanyR3Content(content) {
  if (content?.edition?.edition_id !== 'company-v1') throw new Error('r3_invalid_edition');
  if (Object.keys(content.characters ?? {}).length !== 5) throw new Error('r3_invalid_character_catalog');
  if (!Array.isArray(content.locations) || content.locations.length === 0) throw new Error('r3_invalid_location_catalog');
  if (content.mediaCatalog.edition_id !== 'company-v1' || !Array.isArray(content.mediaCatalog.entries)) throw new Error('r3_invalid_media_catalog');
  for (const entry of content.mediaCatalog.entries) {
    if (!entry?.image_id || !entry?.character_id || !['general', 'sex'].includes(entry.pool) || !entry.asset_locator) throw new Error('r3_invalid_media_entry');
  }
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

const PRODUCT_PREMISE = Object.freeze({
  app_name: '상식개변',
  title: '상식개변: 회사편',
  private_discovery: '플레이어만 낯선 상식개변 앱의 존재와 기능을 알고 있다. NPC는 플레이어가 드러내기 전까지 그 앱을 알지 못한다.',
  agency: '플레이어의 행동은 요청으로만 전달하며 Story가 플레이어의 미요청 행동을 대신 완료하지 않는다.'
});

function locationDirectory(content) { return new Map((content?.locations ?? []).map(location => [location.location_id, location])); }

export function canonicalLocation(content, locationId) {
  const location = locationDirectory(content).get(locationId);
  if (!location) return null;
  return {
    location_id: location.location_id,
    name: location.name,
    description: location.description,
    floor: location.floor,
    department_id: location.department_id,
    adjacent_location_ids: (location.adjacent_location_ids ?? []).slice(0, 8)
  };
}

function heroineCard(character) {
  const card = character?.prompt_card ?? {};
  return {
    identity: card.identity,
    personality: card.personality,
    speech: card.speech,
    addressing: card.addressing,
    distinctive_traits: Array.isArray(card.distinctive_traits) ? card.distinctive_traits.slice(0, 4) : [],
    dramatization: dramatizationCard(card)
  };
}

export function canonicalActors(content, actorIds = []) {
  const directory = actorDirectory(content);
  return [...new Set(actorIds)].flatMap(actorId => {
    const actor = directory[actorId]; if (!actor) return [];
    if (actor.character_id) return [{ id: actorId, name: actor.name, kind: 'heroine', gender: actor.gender, department: actor.department, position: actor.position, role_title: actor.role_title, prompt_card: heroineCard(actor) }];
    return [{ id: actorId, name: actor.name, kind: 'general_npc', sex: actor.sex, age: actor.age, role: actor.role, department_id: actor.department_id, personality: actor.personality, speech: actor.speech }];
  });
}

export function relevantActorIds(content, state, { opening = false } = {}) {
  const scene = state?.scene ?? {};
  const location = locationDirectory(content).get(scene.location_id);
  const ids = new Set(scene.present_actor_ids ?? []);
  if (location) for (const id of location.default_npc_ids ?? []) ids.add(id);
  if (opening && location) for (const character of Object.values(content.characters ?? {})) if (character.default_location_id === location.location_id) ids.add(character.character_id);
  return [...ids].filter(id => registeredActorIds(content).has(id));
}

export function openingActorIds(content, locationId) { return relevantActorIds(content, { scene: { location_id: locationId, present_actor_ids: [] } }, { opening: true }); }

export function productPremise(content) {
  return { ...PRODUCT_PREMISE, title: content?.edition?.title || PRODUCT_PREMISE.title };
}
