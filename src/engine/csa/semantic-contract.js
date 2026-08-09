export const STRUCTURED_SEXUAL_ACTIONS = new Set(['none', 'kiss', 'sexual_touch', 'genital_exposure', 'genital_touch', 'oral', 'penetration']);
export const STRUCTURED_SEXUAL_DIRECTIONS = new Set(['none', 'npc_to_player', 'player_to_npc']);

const LEGACY_GROUP_ALIASES = new Map([
  ['nurse', 'coworker'],
  ['doctor', 'manager'],
  ['medical_staff', 'employee'],
  ['hospital_staff', 'company_employee'],
  ['female_staff', 'female_employee'],
  ['male_staff', 'male_employee'],
  ['everyone_in_hospital', 'everyone_in_company']
]);

export const CSA_CONTRACT_ACTOR_GROUPS = new Set([
  'player', 'current_partner', 'current_scene_npcs', 'company_employee', 'female_employee', 'male_employee', 'unknown'
]);
export const CSA_CONTRACT_TARGET_GROUPS = new Set([
  'player', 'current_partner', 'current_scene_npcs', 'company_employee', 'female_employee', 'male_employee', 'unknown'
]);

const TRIGGER_ALIASES = new Map([
  ['consultation_start', 'meeting_start'],
  ['explanation_start', 'briefing_start'],
  ['comforting', 'support_action'],
  ['check_condition', 'status_check']
]);
const DURATION_ALIASES = new Map([
  ['until_consultation_ends', 'until_meeting_ends'],
  ['until_explanation_ends', 'until_briefing_ends'],
  ['until_target_relaxed', 'until_goal_reached']
]);
const TRIGGERS = new Set(['on_player_request', 'continuous', 'none']);
const DURATIONS = new Set(['continuous']);
const STABLE_SELECTOR_RE = /^(character|department|position|team|role):[^\s]{1,80}$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function conciseText(value, maxLength = 100) {
  if (typeof value !== 'string') return '';
  return Array.from(value.trim().replace(/\s+/g, ' ')).slice(0, maxLength).join('');
}

export function canonicalizeCsaGroup(value, { target = false } = {}) {
  const raw = conciseText(value);
  if (!raw) return 'unknown';
  const canonical = LEGACY_GROUP_ALIASES.get(raw) ?? raw;
  const known = target ? CSA_CONTRACT_TARGET_GROUPS : CSA_CONTRACT_ACTOR_GROUPS;
  if (known.has(canonical) || STABLE_SELECTOR_RE.test(canonical)) return canonical;
  return canonical;
}

export function canonicalizeCsaTrigger(value) {
  const raw = conciseText(value);
  if (!raw) return 'none';
  if (raw === 'on_request') return 'on_player_request';
  return TRIGGER_ALIASES.get(raw) ?? raw;
}

export function canonicalizeCsaDuration(value) {
  const raw = conciseText(value);
  if (!raw) return 'continuous';
  return DURATION_ALIASES.get(raw) ?? raw;
}

function safeSexualGroup(group, target = false) {
  const known = target ? CSA_CONTRACT_TARGET_GROUPS : CSA_CONTRACT_ACTOR_GROUPS;
  return group !== 'unknown' && (known.has(group) || STABLE_SELECTOR_RE.test(group));
}

/**
 * Normalizes an LLM- or preset-derived semantic contract to its canonical Company shape.
 * Legacy hospital identifiers are read aliases only. Nonsexual custom groups may remain concise
 * natural labels, but sexual direct execution requires a known Company group or an explicit
 * stable selector such as character:heroine1 or department:brand_strategy.
 */
export function normalizeCsaSemanticContract(value = {}) {
  const source = isPlainObject(value) ? value : {};
  const actions = [...new Set((Array.isArray(source.actions) ? source.actions : [])
    .filter(action => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== 'none'))];
  const directions = [...new Set((Array.isArray(source.directions) ? source.directions : [])
    .filter(direction => STRUCTURED_SEXUAL_DIRECTIONS.has(direction) && direction !== 'none'))];
  const actorGroup = canonicalizeCsaGroup(source.actor_group);
  const targetGroup = canonicalizeCsaGroup(source.target_group, { target: true });
  const trigger = canonicalizeCsaTrigger(source.trigger);
  const duration = canonicalizeCsaDuration(source.duration);
  // 결과 중심 CSA와 방식 제한 CSA를 구분한다.
  // - restricted: 허용 방식 목록(actions)이 명시됨 (예: 손으로 수행한다)
  // - unspecified: required_action은 결과만 정의하고 허용 방식 목록이 없음
  //   (예: resolve_patient_erection — 방식을 손/구강 등으로 축소하지 않는다)
  // actions 없이 sexual_authorization을 승인하려면 method_policy='unspecified'가
  // 명시적으로 선언되어야 한다 (custom contract가 actions 없이 성적 승인을 주장하면 거부).
  const methodPolicy = source.method_policy === 'restricted'
    ? 'restricted'
    : (source.method_policy === 'unspecified' ? 'unspecified' : (actions.length > 0 ? 'restricted' : 'unspecified'));
  const sexualAuthorization = source.sexual_authorization === true
    && (actions.length > 0 || methodPolicy === 'unspecified')
    && directions.length > 0
    && safeSexualGroup(actorGroup)
    && safeSexualGroup(targetGroup, true)
    && TRIGGERS.has(trigger)
    && trigger !== 'none'
    && DURATIONS.has(duration);
  return {
    version: 1,
    sexual_authorization: sexualAuthorization,
    directions,
    actions,
    actor_group: actorGroup,
    target_group: targetGroup,
    trigger,
    duration,
    public_normalization: source.public_normalization === true,
    direct_execution: source.direct_execution === true,
    method_policy: methodPolicy,
    confidence: source.confidence === 'exact' ? 'exact' : 'ambiguous'
  };
}

/** Only gates when the raw contract itself claimed sexual authorization. */
export function validateCustomCsaSemanticContract({ rawContract = {}, normalizedContract = {} } = {}) {
  if (rawContract?.sexual_authorization !== true) return { ok: true };
  const contract = normalizeCsaSemanticContract(normalizedContract);
  const ok = contract.sexual_authorization === true
    && contract.confidence === 'exact'
    && contract.actions.length > 0
    && contract.directions.length > 0
    && contract.actor_group !== 'unknown'
    && contract.target_group !== 'unknown'
    && contract.trigger !== 'none'
    && contract.direct_execution === true;
  return ok ? { ok: true } : { ok: false, code: 'CUSTOM_CSA_SEXUAL_SCOPE_AMBIGUOUS', message: '행동 주체·대상·행동 종류·발동 상황을 더 명확히 적어 주세요.' };
}

/** Presets still use a finite action/direction audit taxonomy, while group labels are canonicalized. */
export function buildPresetCsaSemanticContract(csa = {}, sexualActionContract = {}) {
  const preset = isPlainObject(csa?.preset) ? csa.preset : {};
  const required = String(preset.required_action || '');
  const mapped = sexualActionContract?.[required];
  const roles = isPlainObject(preset.roles) ? preset.roles : {};
  return normalizeCsaSemanticContract({
    sexual_authorization: true,
    directions: mapped?.directions || [],
    actions: mapped?.actions || [],
    actor_group: roles.performer_group || roles.subject_group || roles.group_a || 'unknown',
    target_group: roles.recipient_group || roles.group_b || 'unknown',
    trigger: preset.mode || 'continuous',
    duration: 'continuous',
    direct_execution: Boolean(preset.required_action),
    method_policy: mapped?.method_policy === 'unspecified' ? 'unspecified' : undefined,
    confidence: 'exact'
  });
}

export function buildCsaSemanticContract(csa = {}, sexualActionContract = {}) {
  return csa?.source_type === 'preset'
    ? buildPresetCsaSemanticContract(csa, sexualActionContract)
    : normalizeCsaSemanticContract(csa?.semantic_contract);
}
