import {
  calculateCsaCapability,
  getApplicableCsaEntries,
  resolvePlayerCanonicalNames
} from '../engine/index.js';
import { HttpError } from './http.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function entries(value) {
  return Array.isArray(value) ? value : Object.entries(object(value)).map(([id, item]) => ({ id, ...object(item) }));
}

function catalogName(list, idField, id, nameField = 'name') {
  return text(entries(list).find(item => item?.[idField] === id || item?.id === id)?.[nameField]);
}

function departmentDirectory(edition) {
  const rows = [
    ...entries(edition?.organization?.departments),
    ...entries(edition?.organization?.general_npc_departments)
  ];
  return new Map(rows.map(item => {
    const id = item.department_id ?? item.id;
    return [id, text(item.name) || id];
  }));
}

function locationDirectory(edition) {
  return new Map(entries(edition?.map?.locations).map(item => [item.location_id ?? item.id, item]));
}

function locationLabel(edition, id) {
  return text(locationDirectory(edition).get(id)?.name) || text(id);
}

function heroineProfiles(edition) {
  return object(edition?.characters?.characters);
}

function generalProfiles(edition) {
  return object(edition?.generalNpcs?.profiles);
}

function profileFor(edition, id) {
  const heroine = object(heroineProfiles(edition)[id]);
  if (Object.keys(heroine).length) return { type: 'heroine', ...heroine, id, character_id: id };
  const general = object(generalProfiles(edition)[id]);
  if (Object.keys(general).length) return { type: 'general', ...general, id, npc_id: id };
  return null;
}

function profileDepartmentId(edition, profile) {
  const direct = text(profile?.department_id);
  if (direct) return direct;
  const name = text(profile?.department);
  if (!name) return '';
  const directory = departmentDirectory(edition);
  return [...directory.entries()].find(([, label]) => label === name)?.[0] ?? '';
}

function defaultLocationForProfile(edition, profile) {
  const map = entries(edition?.map?.locations);
  const profileId = text(profile?.character_id ?? profile?.npc_id ?? profile?.id);
  const exact = map.find(location => Array.isArray(location.default_npc_ids) && location.default_npc_ids.includes(profileId));
  if (exact) return exact;
  const departmentId = profileDepartmentId(edition, profile);
  if (departmentId) {
    const departmentLocation = map.find(location => location.department_id === departmentId && ['office_floor', 'team_space', 'project_space'].includes(location.location_type));
    if (departmentLocation) return departmentLocation;
    const anyDepartmentLocation = map.find(location => location.department_id === departmentId);
    if (anyDepartmentLocation) return anyDepartmentLocation;
  }
  return null;
}

function clothingSummary(clothing) {
  const source = object(clothing);
  const values = Object.entries(source).flatMap(([key, item]) => {
    if (typeof item === 'string' && item.trim()) return [`${key}: ${item.trim()}`];
    if (item === true) return [key];
    return [];
  });
  return values.join(' · ');
}

export function buildFullPlayerInfo(save, edition) {
  const player = object(save?.player);
  const catalogs = {
    departments: entries(edition?.organization?.departments),
    positions: entries(edition?.positions?.positions),
    bodyTypes: entries(edition?.bodyTypes?.body_types),
    speechStyles: entries(edition?.speechStyles?.speech_styles)
  };
  const canonical = resolvePlayerCanonicalNames(player, catalogs);
  const scene = object(save?.player_scene_state);
  const worldScene = object(save?.scene_state);
  const sexual = object(save?.player_sexual_state);
  const active = getApplicableCsaEntries(save);
  const capability = calculateCsaCapability(save, active.length);
  return {
    name: text(player.name),
    adult: player.adult === true,
    department_id: text(player.department_id),
    department: canonical.departmentName || catalogName(catalogs.departments, 'department_id', player.department_id),
    position_id: text(player.position_id),
    position: canonical.positionName || catalogName(catalogs.positions, 'position_id', player.position_id),
    height_cm: numberOrNull(player.height_cm),
    weight_kg: numberOrNull(player.weight_kg),
    penis_length_cm: numberOrNull(player.penis_length_cm),
    body_type_id: text(player.body_type_id),
    body_type: canonical.bodyTypeName || catalogName(catalogs.bodyTypes, 'body_type_id', player.body_type_id),
    speech_style_id: text(player.speech_style_id),
    speech_style: canonical.speechStyleName || catalogName(catalogs.speechStyles, 'speech_style_id', player.speech_style_id),
    background: text(player.background),
    current_location: text(scene.location_label) || locationLabel(edition, scene.location_id) || text(worldScene.location_label) || locationLabel(edition, worldScene.location_id),
    posture: text(scene.posture),
    posture_detail: text(scene.posture_detail ?? scene.posture_description),
    clothing: clothingSummary(scene.clothing),
    arousal: numberOrNull(sexual.arousal) ?? 0,
    ejaculation_progress: numberOrNull(sexual.ejaculation_progress ?? sexual.ejaculation_meter) ?? 0,
    ejaculation_count: numberOrNull(sexual.ejaculation_count) ?? 0,
    level: capability.current_level,
    exp: capability.exp,
    next_level_exp: capability.next_level_exp,
    active_csa_count: capability.csa_active_count,
    max_active_csa: capability.csa_max_active,
    active_csa: active.map(item => ({
      id: item.id,
      strength: text(item.strength),
      content: text(item.content),
      scope_label: text(item.scope_label) || '회사 전체'
    }))
  };
}

export function buildFinderNpcList(save, edition) {
  const departments = departmentDirectory(edition);
  const ids = [...Object.keys(heroineProfiles(edition)), ...Object.keys(generalProfiles(edition))];
  return ids.map(id => {
    const profile = profileFor(edition, id);
    const result = resolveNpcLocation(save, edition, id);
    const departmentId = profileDepartmentId(edition, profile);
    return {
      id,
      name: text(profile?.name) || id,
      type: profile?.type ?? 'unknown',
      department: text(profile?.department) || departments.get(departmentId) || departmentId,
      position: text(profile?.position),
      role: text(profile?.role_title ?? profile?.role),
      ...result
    };
  });
}

export function resolveNpcLocation(save, edition, characterId) {
  const profile = profileFor(edition, characterId);
  if (!profile) return { known: false, status: 'not_found', present_now: false, can_move: false, location_id: '', location_label: '' };
  const presentIds = new Set([
    ...(Array.isArray(save?.last_npcs_present) ? save.last_npcs_present : []),
    ...(Array.isArray(save?.scene_state?.participants) ? save.scene_state.participants : []),
    save?.focal_character_id,
    save?.last_speaker_id
  ].filter(Boolean));
  const presentNow = presentIds.has(characterId);
  const scene = object(save?.npc_scene_state?.[characterId]);
  const work = object(save?.npc_work_state?.[characterId]);
  const worldScene = object(save?.scene_state);
  let locationId = text(scene.location_id) || text(work.location_id);
  let label = text(scene.location_label) || text(work.location_label);
  let inferred = false;
  if (presentNow) {
    locationId ||= text(worldScene.location_id);
    label ||= text(worldScene.location_label) || locationLabel(edition, locationId);
  }
  if (!locationId && !label) {
    const fallback = defaultLocationForProfile(edition, profile);
    if (fallback) {
      locationId = text(fallback.location_id ?? fallback.id);
      label = text(fallback.name) || locationLabel(edition, locationId);
      inferred = true;
    }
  }
  label ||= locationLabel(edition, locationId);
  const known = Boolean(locationId || label);
  return {
    known,
    status: presentNow ? 'present' : known ? (inferred ? 'inferred_workplace' : 'located') : 'unknown',
    present_now: presentNow,
    can_move: known && !presentNow,
    location_id: locationId,
    location_label: label,
    inferred
  };
}

export function buildNpcFinderPayload(save, edition, characterId) {
  const profile = profileFor(edition, characterId);
  if (!profile) throw new HttpError(422, 'npc_not_found', '등록된 인물이 아닙니다.', false);
  const location = resolveNpcLocation(save, edition, characterId);
  if (location.status === 'present') {
    throw new HttpError(422, 'npc_already_present', `${text(profile.name) || characterId}은(는) 현재 같은 장면에 있습니다.`, false);
  }
  if (location.status === 'unknown' || location.inferred === true) {
    throw new HttpError(422, 'npc_location_unknown', `${text(profile.name) || characterId}의 현재 위치가 아직 기록되지 않았습니다.`, false);
  }
  const departments = departmentDirectory(edition);
  const departmentId = profileDepartmentId(edition, profile);
  return {
    character_id: characterId,
    name: text(profile.name) || characterId,
    known_character: true,
    type: profile.type,
    department: text(profile.department) || departments.get(departmentId) || departmentId,
    position: text(profile.position),
    role: text(profile.role_title ?? profile.role),
    ...location
  };
}
