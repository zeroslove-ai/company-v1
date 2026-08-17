const NAME_MAX = 20;
const AGE_RANGE = [18, 70];
const HEIGHT_RANGE = [140, 220];
const WEIGHT_RANGE = [40, 180];
const PENIS_LENGTH_RANGE = [5, 30];

// Company edition currently defines the player as a male employee. Keep this
// product contract in one place; runtime must never infer it from body fields.
export const COMPANY_PLAYER_CANONICAL_PROFILE = Object.freeze({ sex: 'male', gender: 'male' });

export function canonicalCompanyPlayerProfile(player = {}) {
  const source = player !== null && typeof player === 'object' && !Array.isArray(player) ? player : {};
  return { ...source, ...COMPANY_PLAYER_CANONICAL_PROFILE };
}

function inRange(value, [min, max]) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function catalogIds(list, idField) {
  return new Set((Array.isArray(list) ? list : []).map(item => item?.[idField]));
}

/**
 * Re-validates a player-setup submission server-side against the catalog allow-lists.
 * Client validation is never trusted alone. Never generates a candidate; only checks
 * what the user already chose.
 */
export function validatePlayerSetupInput(input, catalogs = {}) {
  const errors = [];
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  if (!name || name.length > NAME_MAX) errors.push('invalid_name');

  const age = Number(input?.age);
  if (!inRange(age, AGE_RANGE)) errors.push('invalid_age');
  const heightCm = Number(input?.height_cm);
  if (!inRange(heightCm, HEIGHT_RANGE)) errors.push('invalid_height_cm');
  const weightKg = Number(input?.weight_kg);
  if (!inRange(weightKg, WEIGHT_RANGE)) errors.push('invalid_weight_kg');
  const penisLengthCm = Number(input?.penis_length_cm);
  if (!inRange(penisLengthCm, PENIS_LENGTH_RANGE)) errors.push('invalid_penis_length_cm');

  if (!catalogIds(catalogs.departments, 'department_id').has(input?.department_id)) errors.push('invalid_department_id');
  if (!catalogIds(catalogs.positions, 'position_id').has(input?.position_id)) errors.push('invalid_position_id');
  if (!catalogIds(catalogs.bodyTypes, 'body_type_id').has(input?.body_type_id)) errors.push('invalid_body_type_id');
  if (!catalogIds(catalogs.speechStyles, 'speech_style_id').has(input?.speech_style_id)) errors.push('invalid_speech_style_id');

  if (errors.length > 0) return { valid: false, errors, player: null };
  return {
    valid: true,
    errors: [],
    player: canonicalCompanyPlayerProfile({
      name,
      department_id: input.department_id,
      position_id: input.position_id,
      age,
      height_cm: heightCm,
      weight_kg: weightKg,
      penis_length_cm: penisLengthCm,
      body_type_id: input.body_type_id,
      speech_style_id: input.speech_style_id
    })
  };
}

export function canonicalCatalogName(id, list, idField, nameField = 'name') {
  const match = (Array.isArray(list) ? list : []).find(item => item?.[idField] === id);
  return match ? match[nameField] ?? null : null;
}

/** Looks up every canonical display name a validated player object needs for prompts. */
export function resolvePlayerCanonicalNames(player, catalogs = {}) {
  return {
    departmentName: canonicalCatalogName(player?.department_id, catalogs.departments, 'department_id'),
    positionName: canonicalCatalogName(player?.position_id, catalogs.positions, 'position_id'),
    bodyTypeName: canonicalCatalogName(player?.body_type_id, catalogs.bodyTypes, 'body_type_id'),
    speechStyleName: canonicalCatalogName(player?.speech_style_id, catalogs.speechStyles, 'speech_style_id')
  };
}

const WEEKDAYS = ['월요일', '화요일', '수요일', '목요일', '금요일'];

function compactText(value, maxLength = 120) {
  if (typeof value !== 'string') return '';
  return Array.from(value.trim().replace(/\s+/g, ' ')).slice(0, maxLength).join('');
}

function openingLocationCandidates(locations, positionId, departmentId) {
  const source = Array.isArray(locations) ? locations : [];
  const normalized = source.flatMap(location => {
    const locationId = compactText(location?.location_id, 100);
    const name = compactText(location?.name, 100);
    if (!locationId || !name || location?.opening_enabled === false) return [];
    const explicitPositions = Array.isArray(location?.opening_position_ids)
      ? location.opening_position_ids.filter(id => typeof id === 'string' && id.trim())
      : [];
    if (explicitPositions.length && !explicitPositions.includes(positionId)) return [];
    if (location?.location_type === 'storage' && location?.opening_enabled !== true) return [];
    if (location?.visibility === 'private' && positionId !== 'executive' && !explicitPositions.length) return [];
    const departmentMatch = departmentId && (
      location?.department_id === departmentId
      || (Array.isArray(location?.department_ids) && location.department_ids.includes(departmentId))
    );
    const positionMatch = explicitPositions.includes(positionId);
    return [{
      location_id: locationId,
      name,
      selection_score: departmentMatch ? 3 : (positionMatch ? 2 : 0)
    }];
  });
  if (!normalized.length) return [{ location_id: 'office', name: '사무실', selection_score: 0 }];
  const bestScore = Math.max(...normalized.map(item => item.selection_score ?? 0));
  return normalized.filter(item => (item.selection_score ?? 0) === bestScore);
}

/**
 * Pure deterministic opening selection from edition content. Locations are not hardcoded in the
 * engine: content/map.json (or another edition adapter) supplies them. Exactly
 * one primary heroine and at most one supporting heroine are still selected for scene clarity.
 */
export function buildOpeningPlan({ positionId, departmentId, seedBytes, heroineIds, locations = [] }) {
  const candidates = openingLocationCandidates(locations, positionId, departmentId);
  const bytes = seedBytes && seedBytes.length > 0 ? seedBytes : [0];
  let cursor = 0;
  const next = max => {
    const value = bytes[cursor % bytes.length] % Math.max(1, max);
    cursor += 1;
    return value;
  };
  const weekday = WEEKDAYS[next(WEEKDAYS.length)];
  const minuteOfDay = 540 + next(541);
  const location = candidates[next(candidates.length)];
  const ids = Array.isArray(heroineIds) ? heroineIds : [];
  const primaryCharacterId = ids.length > 0 ? ids[next(ids.length)] : null;
  const remaining = ids.filter(id => id !== primaryCharacterId);
  const includeSupporting = remaining.length > 0 && next(2) === 1;
  const supportingCharacterIds = includeSupporting ? [remaining[next(remaining.length)]] : [];
  return {
    weekday,
    date_label: `Day 1 · ${weekday}`,
    minute_of_day: minuteOfDay,
    location_id: location.location_id,
    location_name: location.name,
    primary_character_id: primaryCharacterId,
    supporting_character_ids: supportingCharacterIds
  };
}

const BODY_KEYWORDS = ['외모', '체형', '옷', '벗', '신체', '몸매', '근육', '키가', '몸무게', '헬스', '운동'];
// This is deliberately narrower than general intimacy. Measurements are relevant only
// when the action directly concerns genitals, penetration/intercourse, or exposure.
const SEXUAL_KEYWORDS = ['성기', '음경', '페니스', '삽입', '성교', '섹스', '노출', '발기', '질내', '구강성교', '항문성교'];
const BACKGROUND_KEYWORDS = ['경력', '이력', '예전', '과거', '입사 전', '이전 직장', '전 직장', '대학교', '졸업'];

function mentionsAny(text, keywords) {
  return keywords.some(word => text.includes(word));
}

/**
 * The player fields an ordinary Story/Extract turn may see. name/department/position/
 * speech_style are always canonical-name-only; height/weight/body type, penis length,
 * and background are included only when this turn's player action (or explicit
 * evidence) actually makes them relevant — never in an ordinary meeting scene.
 */
export function buildPlayerPromptProjection({ player, canonical, playerAction = '', evidence = {} } = {}) {
  const base = {
    name: typeof player?.name === 'string' ? player.name : null,
    department: canonical?.departmentName ?? null,
    position: canonical?.positionName ?? null,
    ...(typeof player?.position_id === 'string' && player.position_id ? { position_id: player.position_id, address_title: canonical?.positionName ?? null } : {}),
    speech_style: canonical?.speechStyleName ?? null
  };
  const text = String(playerAction ?? '');
  if (mentionsAny(text, BODY_KEYWORDS) || evidence?.body_relevant === true) {
    base.height_cm = player?.height_cm ?? null;
    base.weight_kg = player?.weight_kg ?? null;
    base.body_type = canonical?.bodyTypeName ?? null;
  }
  if (mentionsAny(text, SEXUAL_KEYWORDS) || evidence?.sexual_relevant === true) {
    base.penis_length_cm = player?.penis_length_cm ?? null;
  }
  if (mentionsAny(text, BACKGROUND_KEYWORDS) || evidence?.background_relevant === true) {
    base.background = typeof player?.background === 'string' ? player.background : null;
  }
  return base;
}

/** The opening sees the canonical profile and non-sensitive body context only. */
export function buildOpeningPlayerProjection({ player, canonical } = {}) {
  return {
    name: typeof player?.name === 'string' ? player.name : null,
    department: canonical?.departmentName ?? null,
    position: canonical?.positionName ?? null,
    ...(typeof player?.position_id === 'string' && player.position_id ? { position_id: player.position_id, address_title: canonical?.positionName ?? null } : {}),
    speech_style: canonical?.speechStyleName ?? null,
    height_cm: player?.height_cm ?? null,
    weight_kg: player?.weight_kg ?? null,
    body_type: canonical?.bodyTypeName ?? null
  };
}
