/**
 * Canonical, non-LLM execution metadata for a CSA preset.
 *
 * The catalog owns the meaning of a preset.  This module deliberately keeps
 * the vocabulary small: it is an execution contract, not a rule language.
 */
export const EXECUTION_KINDS = Object.freeze([
  'clothing_state',
  'posture_relation',
  'physical_contact',
  'speech_contact',
  'sexual_behavior',
  'world_behavior'
]);

export const EXECUTION_ACTIONS = Object.freeze(new Set([
  'set_clothing_state',
  'sit_on_lap',
  'stand_between_knees',
  'press_body_against',
  'embrace_from_behind',
  'keep_hand_on_inner_thigh',
  'wrap_leg_around',
  'maintain_thigh_contact',
  'whisper_against_ear',
  'interlace_fingers',
  'world_behavior'
]));

export const EXECUTION_TRIGGER_KINDS = Object.freeze(new Set([
  'always_during_work',
  'scene_interaction',
  'both_seated',
  'close_conversation',
  'counterparty_request',
  'contextual_condition'
]));

const CLOTHING_STATES = Object.freeze({
  work_nude: { uniform_top: 'removed', uniform_bottom: 'removed', underwear_top: 'removed', underwear_bottom: 'removed' },
  work_in_underwear_only: { uniform_top: 'removed', uniform_bottom: 'removed', underwear_top: 'worn', underwear_bottom: 'worn' },
  work_without_underwear: { underwear_top: 'removed', underwear_bottom: 'removed' },
  no_bra_under_work_clothes: { underwear_top: 'removed' },
  no_panties_under_work_clothes: { underwear_bottom: 'removed' },
  work_topless: { uniform_top: 'removed' }
});

function actionFromId(id = '') {
  return String(id)
    .replace(/_recipient|_on_request|_for_recipient|_with_recipient|_from_recipient/g, '')
    .replace(/^target_places_requester_hand_on_/, 'place_requester_hand_on_')
    .replace(/^receive_oral_sex_from_recipient$/, 'receive_oral_sex')
    .replace(/^perform_requester_selected_sex_position$/, 'perform_selected_sex_position');
}

/** Derive only for old catalog rows; new rows should carry `execution`. */
export function deriveExecutionMetadata(item = {}) {
  const id = typeof item.id === 'string' ? item.id : '';
  const category = item.category;
  if (category === 'clothing' || CLOTHING_STATES[id]) {
    return { kind: 'clothing_state', action: 'set_clothing_state', trigger_kind: 'always_during_work', target_required: false, required_state: { ...(CLOTHING_STATES[id] ?? {}) } };
  }
  if (category === 'posture') {
    return {
      kind: id === 'sit_on_recipient_lap' || id === 'stand_between_recipient_knees' ? 'posture_relation' : 'physical_contact',
      action: id === 'sit_on_recipient_lap' ? 'sit_on_lap' : id === 'stand_between_recipient_knees' ? 'stand_between_knees' : actionFromId(id),
      trigger_kind: id === 'sit_on_recipient_lap' || id === 'stand_between_recipient_knees' ? 'both_seated' : 'scene_interaction',
      target_required: true
    };
  }
  if (category === 'contact') {
    return {
      kind: id.includes('whisper') ? 'speech_contact' : 'physical_contact',
      action: id === 'press_body_against_recipient' ? 'press_body_against' : actionFromId(id),
      trigger_kind: item.mode === 'on_player_request' ? 'counterparty_request' : (item.trigger === 'when_in_close_conversation' ? 'close_conversation' : 'scene_interaction'),
      target_required: true
    };
  }
  if (category === 'sexual_action') return { kind: 'sexual_behavior', action: actionFromId(id), trigger_kind: 'counterparty_request', target_required: true };
  return { kind: 'world_behavior', action: id || 'world_behavior', trigger_kind: item.mode === 'on_player_request' ? 'counterparty_request' : 'always_during_work', target_required: false };
}

export function normalizeExecutionMetadata(item = {}) {
  const source = item?.execution && typeof item.execution === 'object' ? item.execution : deriveExecutionMetadata(item);
  const kind = EXECUTION_KINDS.includes(source.kind) ? source.kind : null;
  const action = typeof source.action === 'string' && source.action.trim() ? source.action.trim() : null;
  const trigger_kind = EXECUTION_TRIGGER_KINDS.has(source.trigger_kind) ? source.trigger_kind : null;
  const target_required = source.target_required === true;
  const required_state = source.required_state && typeof source.required_state === 'object' && !Array.isArray(source.required_state)
    ? { ...source.required_state } : undefined;
  return { kind, action, trigger_kind, target_required, ...(required_state ? { required_state } : {}) };
}

export function validateExecutionMetadata(execution, item = {}) {
  if (!execution || typeof execution !== 'object' || Array.isArray(execution)) {
    return { valid: false, errors: ['execution.required'], execution: null };
  }
  const normalized = normalizeExecutionMetadata({ ...item, execution });
  const errors = [];
  if (!normalized.kind) errors.push('execution.kind');
  if (!normalized.action || !/^[a-z][a-z0-9_]*$/.test(normalized.action)) errors.push('execution.action');
  if (!normalized.trigger_kind) errors.push('execution.trigger_kind');
  if (normalized.kind === 'clothing_state' && !normalized.required_state) errors.push('execution.required_state');
  if (!normalized.target_required && item.allowed_counterparty_scopes?.length) errors.push('execution.target_required');
  return { valid: errors.length === 0, errors, execution: normalized };
}

export function executionMetadataForRule(rule = {}) {
  if (!rule?.preset?.execution && !rule?.execution) return null;
  return normalizeExecutionMetadata({ execution: rule?.preset?.execution ?? rule?.execution, id: rule?.preset?.template_id, category: rule?.preset?.category, mode: rule?.preset?.mode, trigger: rule?.preset?.trigger });
}
