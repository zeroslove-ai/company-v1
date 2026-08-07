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
  'coworker', 'manager', 'employee', 'company_employee', 'female_employee', 'male_employee',
  'everyone_in_company',
  'player', 'conversation_partner', 'another_present_person', 'nearby_person', 'unknown'
]);
export const CSA_CONTRACT_TARGET_GROUPS = new Set([
  'coworker', 'manager', 'employee', 'company_employee', 'female_employee', 'male_employee',
  'everyone_in_company',
  'player', 'conversation_partner', 'another_present_person', 'nearby_person', 'unknown'
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
const TRIGGERS = new Set([
  'on_request', 'conversation_start', 'meeting_start', 'briefing_start', 'support_action',
  'status_check', 'during_work', 'always_on_duty', 'custom_condition', 'none'
]);
const DURATIONS = new Set([
  'instant', 'until_conversation_ends', 'until_meeting_ends', 'until_briefing_ends',
  'until_goal_reached', 'until_explicit_position_change', 'until_work_ends', 'while_on_duty', 'continuous'
]);
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
  const sexualAuthorization = source.sexual_authorization === true
    && actions.length > 0
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
  return normalizeCsaSemanticContract({
    sexual_authorization: Boolean(mapped),
    directions: mapped?.directions || [],
    actions: mapped?.actions || [],
    actor_group: preset.actor_group || 'unknown',
    target_group: preset.target_group || 'unknown',
    trigger: preset.trigger || 'none',
    duration: preset.duration || 'continuous',
    public_normalization: preset.public_normalization === true,
    direct_execution: Boolean(preset.required_action),
    confidence: 'exact'
  });
}

export function buildCsaSemanticContract(csa = {}, sexualActionContract = {}) {
  return csa?.source_type === 'preset'
    ? buildPresetCsaSemanticContract(csa, sexualActionContract)
    : normalizeCsaSemanticContract(csa?.semantic_contract);
}
