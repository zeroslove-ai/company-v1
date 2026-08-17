import {
  calculateCsaCapability,
  getApplicableCsaEntries,
  resolvePlayerCanonicalNames
} from '../engine/index.js';
import { readCanonicalSceneV1 } from '../engine/runtime-core/scene-reducer.js';

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

function locationDirectory(edition) {
  return new Map(entries(edition?.map?.locations).map(item => [item.location_id ?? item.id, item]));
}

function locationLabel(edition, id) {
  return text(locationDirectory(edition).get(id)?.name) || text(id);
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
  const worldScene = readCanonicalSceneV1(save);
  const sexual = object(save?.player_sexual_state);
  const active = getApplicableCsaEntries(save);
  const capability = calculateCsaCapability(save, active.length);
  return {
    name: text(player.name),
    age: numberOrNull(player.age),
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
    current_location: text(scene.location_label) || locationLabel(edition, scene.location_id) || locationLabel(edition, worldScene.location_id),
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
