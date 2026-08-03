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

const LOCATIONS_BY_POSITION = {
  intern: [
    { location_id: 'office', name: '사무실' },
    { location_id: 'training_room', name: '교육실' },
    { location_id: 'lobby', name: '로비' },
    { location_id: 'small_meeting_room', name: '소회의실' }
  ],
  assistant_manager: [
    { location_id: 'team_office', name: '팀 사무실' },
    { location_id: 'meeting_room', name: '회의실' },
    { location_id: 'project_room', name: '프로젝트룸' },
    { location_id: 'cross_team_space', name: '타 부서 협업 공간' }
  ],
  tf_lead: [
    { location_id: 'project_room', name: '프로젝트룸' },
    { location_id: 'large_meeting_room', name: '대회의실' },
    { location_id: 'cross_dept_meeting_room', name: '부서 간 회의실' }
  ],
  executive: [
    { location_id: 'executive_meeting_room', name: '임원 회의실' },
    { location_id: 'large_meeting_room', name: '대회의실' },
    { location_id: 'project_report_room', name: '프로젝트 보고실' }
  ]
};
const WEEKDAYS = ['월요일', '화요일', '수요일', '목요일', '금요일'];
const WORK_HOOKS = [
  { work_hook_id: 'orientation', label: '오리엔테이션' },
  { work_hook_id: 'team_meeting', label: '팀 회의' },
  { work_hook_id: 'project_kickoff', label: '프로젝트 킥오프' },
  { work_hook_id: 'report_review', label: '보고서 검토' },
  { work_hook_id: 'client_visit', label: '외부 미팅 준비' }
];
const SCENE_GOALS = ['팀에 첫인사를 한다', '오늘 업무 범위를 파악한다', '담당자와 첫 대면 미팅을 한다', '자리와 업무 환경을 정리한다'];

/**
 * Pure random opening-plan selection. The caller supplies crypto-sourced seed bytes so
 * this stays deterministic and testable; nothing here calls an LLM. Exactly one primary
 * heroine and at most one supporting heroine are chosen — never all five at once.
 */
export function buildOpeningPlan({ positionId, seedBytes, heroineIds }) {
  const locations = LOCATIONS_BY_POSITION[positionId] ?? LOCATIONS_BY_POSITION.intern;
  const bytes = seedBytes && seedBytes.length > 0 ? seedBytes : [0];
  let cursor = 0;
  const next = max => {
    const value = bytes[cursor % bytes.length] % Math.max(1, max);
    cursor += 1;
    return value;
  };
  const weekday = WEEKDAYS[next(WEEKDAYS.length)];
  const minuteOfDay = 540 + next(541);
  const location = locations[next(locations.length)];
  const ids = Array.isArray(heroineIds) ? heroineIds : [];
  const primaryCharacterId = ids.length > 0 ? ids[next(ids.length)] : null;
  const remaining = ids.filter(id => id !== primaryCharacterId);
  const includeSupporting = remaining.length > 0 && next(2) === 1;
  const supportingCharacterIds = includeSupporting ? [remaining[next(remaining.length)]] : [];
  const workHook = WORK_HOOKS[next(WORK_HOOKS.length)];
  const sceneGoal = SCENE_GOALS[next(SCENE_GOALS.length)];
  return {
    weekday,
    date_label: `Day 1 · ${weekday}`,
    minute_of_day: minuteOfDay,
    location_id: location.location_id,
    location_name: location.name,
    primary_character_id: primaryCharacterId,
    supporting_character_ids: supportingCharacterIds,
    work_hook_id: workHook.work_hook_id,
    work_hook_label: workHook.label,
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
