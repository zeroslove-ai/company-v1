const NAME_MAX = 20;
const HEIGHT_RANGE = [140, 220];
const WEIGHT_RANGE = [40, 180];
const PENIS_LENGTH_RANGE = [5, 30];

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
    player: {
      name,
      department_id: input.department_id,
      position_id: input.position_id,
      height_cm: heightCm,
      weight_kg: weightKg,
      penis_length_cm: penisLengthCm,
      body_type_id: input.body_type_id,
      speech_style_id: input.speech_style_id
    }
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

function openingLocationCandidates(locations, positionId) {
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
    return [{
      location_id: locationId,
      name,
      opening_hooks: Array.isArray(location?.opening_hooks) ? location.opening_hooks : [],
      opening_goals: Array.isArray(location?.opening_goals) ? location.opening_goals : []
    }];
  });
  return normalized.length ? normalized : [{ location_id: 'office', name: '사무실', opening_hooks: [], opening_goals: [] }];
}

function normalizedHook(value, location) {
  if (typeof value === 'string') {
    const label = compactText(value);
    return label ? { work_hook_id: `location:${location.location_id}:${label}`, work_hook_label: label } : null;
  }
  const label = compactText(value?.label);
  if (!label) return null;
  const id = compactText(value?.id ?? value?.work_hook_id, 100) || `location:${location.location_id}:${label}`;
  return { work_hook_id: id, work_hook_label: label };
}

function openingHooks(location) {
  const hooks = location.opening_hooks.map(value => normalizedHook(value, location)).filter(Boolean);
  return hooks.length ? hooks : [{
    work_hook_id: `location:${location.location_id}`,
    work_hook_label: `${location.name} 첫 업무`
  }];
}

function openingGoals(location) {
  const goals = location.opening_goals.map(value => compactText(value, 180)).filter(Boolean);
  return goals.length ? goals : [`${location.name}에서 현재 상황을 파악하고 첫 업무 관계를 만든다`];
}

/**
 * Pure deterministic opening selection from edition content. Locations, hooks and goals are not
 * hardcoded in the engine: content/map.json (or another edition adapter) supplies them. Exactly
 * one primary heroine and at most one supporting heroine are still selected for scene clarity.
 */
export function buildOpeningPlan({ positionId, seedBytes, heroineIds, locations = [] }) {
  const candidates = openingLocationCandidates(locations, positionId);
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
  const hooks = openingHooks(location);
  const hook = hooks[next(hooks.length)];
  const goals = openingGoals(location);
  const sceneGoal = goals[next(goals.length)];
  return {
    weekday,
    date_label: `Day 1 · ${weekday}`,
    minute_of_day: minuteOfDay,
    location_id: location.location_id,
    location_name: location.name,
    primary_character_id: primaryCharacterId,
    supporting_character_ids: supportingCharacterIds,
    work_hook_id: hook.work_hook_id,
    work_hook_label: hook.work_hook_label,
    scene_goal: sceneGoal
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
    speech_style: canonical?.speechStyleName ?? null,
    height_cm: player?.height_cm ?? null,
    weight_kg: player?.weight_kg ?? null,
    body_type: canonical?.bodyTypeName ?? null
  };
}

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Assembles the opening's next save purely from the already-persisted opening plan and the
 * parsed opening Story — no Extract call is needed since the scene/time facts were already
 * decided deterministically at player-setup time. Never mutates preSave. The opening is
 * turn 0: turn_state.committed_turn is left untouched so the player's first real action
 * still reserves expected_turn 1.
 */
export function buildOpeningNextSave({ preSave, player, openingPlan, background, parsedOpening }) {
  const next = structuredClone(plainObject(preSave) ? preSave : {});
  const participants = [openingPlan?.primary_character_id, ...(openingPlan?.supporting_character_ids ?? [])].filter(Boolean);

  next.player = { ...(plainObject(next.player) ? next.player : {}), ...player, background };
  next.world_state = {
    ...(plainObject(next.world_state) ? next.world_state : {}),
    game_time: { day: 1, minute_of_day: openingPlan?.minute_of_day ?? 540 },
    weekday: openingPlan?.weekday ?? null,
    date: openingPlan?.date_label ?? null,
    work_hook: { id: openingPlan?.work_hook_id ?? null, status: 'active' }
  };
  next.scene_state = {
    ...(plainObject(next.scene_state) ? next.scene_state : {}),
    scene_id: `opening-${openingPlan?.location_id ?? 'unknown'}`,
    location_id: openingPlan?.location_id ?? null,
    participants,
    scene_goal: openingPlan?.scene_goal ?? null,
    beat: 0
  };
  next.last_choices = Array.isArray(parsedOpening?.choices) ? parsedOpening.choices : [];
  next.last_npcs_present = participants;
  next.focal_character_id = openingPlan?.primary_character_id ?? null;
  next.opening_state = {
    setup_id: typeof next.player_setup?.setup_id === 'string' ? next.player_setup.setup_id : null,
    plan: structuredClone(plainObject(openingPlan) ? openingPlan : {}),
    story_text: typeof parsedOpening?.raw === 'string' ? parsedOpening.raw : '',
    choices: Array.isArray(parsedOpening?.choices) ? parsedOpening.choices : [],
    status: 'complete'
  };
  next.player_setup = { ...(plainObject(next.player_setup) ? next.player_setup : {}), status: 'complete', completed: true };
  return next;
}
