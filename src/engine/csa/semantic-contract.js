export const STRUCTURED_SEXUAL_ACTIONS = new Set(['none', 'kiss', 'sexual_touch', 'genital_exposure', 'genital_touch', 'oral', 'penetration']);
export const STRUCTURED_SEXUAL_DIRECTIONS = new Set(['none', 'npc_to_player', 'player_to_npc']);

export const CSA_CONTRACT_ACTOR_GROUPS = new Set([
  'nurse', 'doctor', 'medical_staff', 'hospital_staff', 'female_staff', 'male_staff',
  'patient', 'guardian', 'visitor', 'everyone_in_hospital',
  'player', 'conversation_partner', 'another_present_person', 'nearby_person', 'unknown'
]);
export const CSA_CONTRACT_TARGET_GROUPS = new Set([
  'patient', 'assigned_patient', 'nurse', 'doctor', 'medical_staff', 'hospital_staff',
  'female_staff', 'male_staff', 'guardian', 'visitor',
  'player', 'conversation_partner', 'another_present_person', 'nearby_person', 'unknown'
]);

const TRIGGERS = new Set(['on_request', 'conversation_start', 'consultation_start', 'explanation_start', 'comforting', 'check_condition', 'during_work', 'always_on_duty', 'custom_condition', 'none']);
const DURATIONS = new Set(['instant', 'until_conversation_ends', 'until_consultation_ends', 'until_explanation_ends', 'until_target_relaxed', 'until_explicit_position_change', 'until_work_ends', 'while_on_duty', 'continuous']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Normalizes an LLM- or preset-derived semantic contract to its canonical shape. Never trusts unknown enum values. */
export function normalizeCsaSemanticContract(value = {}) {
  const source = isPlainObject(value) ? value : {};
  const actions = [...new Set((Array.isArray(source.actions) ? source.actions : [])
    .filter(action => STRUCTURED_SEXUAL_ACTIONS.has(action) && action !== 'none'))];
  const directions = [...new Set((Array.isArray(source.directions) ? source.directions : [])
    .filter(direction => STRUCTURED_SEXUAL_DIRECTIONS.has(direction) && direction !== 'none'))];
  const trigger = TRIGGERS.has(source.trigger) ? source.trigger : 'none';
  const duration = DURATIONS.has(source.duration) ? source.duration : 'continuous';
  const sexualAuthorization = source.sexual_authorization === true && actions.length > 0 && directions.length > 0;
  return {
    version: 1,
    sexual_authorization: sexualAuthorization,
    directions,
    actions,
    actor_group: CSA_CONTRACT_ACTOR_GROUPS.has(source.actor_group) ? source.actor_group : 'unknown',
    target_group: CSA_CONTRACT_TARGET_GROUPS.has(source.target_group) ? source.target_group : 'unknown',
    trigger,
    duration,
    public_normalization: source.public_normalization === true,
    direct_execution: source.direct_execution === true,
    confidence: source.confidence === 'exact' ? 'exact' : 'ambiguous'
  };
}

/** Only gates when the raw (untrusted) contract itself claimed sexual_authorization — a false claim is silently ignored, never escalated. */
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

/** Preset semantic contracts come from a fixed required_action -> {directions, actions} map ported from the catalog, never inferred. */
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
