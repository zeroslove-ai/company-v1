import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = path => JSON.parse(readFileSync(resolve(projectRoot, path), 'utf8'));

export function loadCompanyContent() {
  const characterSource = readJson('content/characters.json');
  const heroineRows = Object.values(characterSource.characters);
  const generalRows = Object.values(readJson('content/general_npcs.json').profiles);
  const map = readJson('content/map.json');
  const organization = readJson('content/organization.json');
  const positions = readJson('content/positions.json').positions;
  const mediaCatalog = readJson('content/media_catalog.json');
  const csaCatalog = readJson('content/csa_catalog.json');
  const edition = readJson('content/edition.json');
  const departmentById = new Map([...organization.departments, ...organization.general_npc_departments].map(item => [item.department_id, item.name]));
  const departments = organization.departments.map(item => item.name);
  const actors = heroineRows.map(actor => ({
    actor_id: actor.character_id,
    kind: 'heroine',
    name: actor.name,
    age: actor.age,
    gender: actor.gender,
    department: actor.department,
    position: actor.position,
    role_title: actor.role_title,
    default_location_id: actor.default_location_id,
    prompt_card: actor.prompt_card,
    company_tenure: actor.company_tenure,
    source_record: actor
  }));
  for (const actor of generalRows) {
    if (!Number.isInteger(actor.age) || actor.age < 18) continue;
    actors.push({
      actor_id: actor.id,
      kind: 'general_npc',
      name: actor.name,
      age: actor.age,
      gender: actor.gender ?? actor.sex ?? '',
      department: departmentById.get(actor.department_id) ?? actor.department_id,
      position: actor.role,
      role_title: actor.role,
      default_location_id: '',
      profile_card: actor,
      source_record: actor
    });
  }
  const locations = map.locations.map(location => ({
    location_id: location.location_id,
    department_id: location.department_id,
    name: location.name,
    floor: location.floor,
    zone: location.zone,
    description: location.description,
    adjacent_location_ids: location.adjacent_location_ids ?? [],
    default_actor_ids: location.default_npc_ids ?? []
  }));
  return {
    version: 'company-r4-canon-projection-6',
    edition,
    company: organization.company,
    world_premise: {
      app_name: '상식개변',
      private_discovery: '플레이어는 낯선 상식개변 앱을 사적으로 가지고 있지만, 처음에는 자신이 설치한 기억이 없다.',
      npc_knowledge: 'NPC는 플레이어가 드러내기 전까지 그 앱의 존재를 알지 못하고 초자연적 변화를 감지하지 못한다.',
      opening_effect: '앱을 가지고 있거나 열어 보는 것만으로 세계가 바뀌지 않는다.'
    },
    departmentsById: departmentById,
    building_name: map.building_name,
    departments,
    positions,
    floors: map.floors,
    actors,
    locations,
    media_catalog: mediaCatalog.entries,
    csa_catalog: csaCatalog
  };
}

export function findLocation(content, locationId) {
  return content.locations.find(location => location.location_id === locationId) ?? null;
}

export function findActor(content, actorId) {
  return content.actors.find(actor => actor.actor_id === actorId) ?? null;
}

export function setupSceneForProfile(content, profile) {
  const departmentId = [...content.departmentsById.entries()]
    .find(([, name]) => name === profile.department)?.[0];
  const location = content.locations.find(item => item.department_id === departmentId)
    ?? content.locations.find(item => item.location_id === 'office')
    ?? content.locations.find(item => item.location_id === 'lobby');
  return {
    location_id: location?.location_id ?? '',
    present_actor_ids: [...(location?.default_actor_ids ?? [])],
    scene_note: ''
  };
}
