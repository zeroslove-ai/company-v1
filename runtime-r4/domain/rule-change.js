const OPERATIONS = new Set(['APPLY', 'CHANGE', 'REMOVE']);
const COMMAND_KEYS = new Set(['operation', 'rule_id', 'template_id', 'selectors', 'expected_rule_version']);
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/;

function stableJson(value) {
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stableJson(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function validSelectorValue(value, depth = 0) {
  if (depth > 2) return false;
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || Number.isInteger(value)) {
    return typeof value !== 'string' || value.length <= 256;
  }
  if (Array.isArray(value)) return value.length <= 40 && value.every(item => validSelectorValue(item, depth + 1));
  if (!isPlainObject(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= 16 && entries.every(([key, item]) => /^[a-zA-Z0-9_:-]{1,64}$/.test(key) && validSelectorValue(item, depth + 1));
}

/** Validate and freeze the command-owned part. A server-owned catalog resolver must validate selector meaning. */
export function normalizeRuleChangeCommand(value) {
  if (!isPlainObject(value) || Object.keys(value).some(key => !COMMAND_KEYS.has(key))) throw new TypeError('rule_change_shape_invalid');
  const { operation, rule_id: ruleId, template_id: templateId, selectors, expected_rule_version: expectedVersion } = value;
  if (!OPERATIONS.has(operation)) throw new TypeError('rule_change_operation_invalid');
  if (typeof ruleId !== 'string' || !ID.test(ruleId)) throw new TypeError('rule_change_rule_id_invalid');
  if (typeof templateId !== 'string' || !ID.test(templateId)) throw new TypeError('rule_change_template_id_invalid');
  if (!isPlainObject(selectors) || !validSelectorValue(selectors)) throw new TypeError('rule_change_selectors_invalid');
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) throw new TypeError('rule_change_expected_version_invalid');
  if (operation === 'APPLY' && expectedVersion !== 0) throw new TypeError('rule_change_apply_version_invalid');
  if (operation !== 'APPLY' && expectedVersion < 1) throw new TypeError('rule_change_existing_version_required');
  return deepFreeze({
    operation,
    rule_id: ruleId,
    template_id: templateId,
    selectors: structuredClone(selectors),
    expected_rule_version: expectedVersion
  });
}

function publicRule(rule) {
  if (!rule) return null;
  return {
    rule_id: rule.rule_id,
    template_id: rule.template_id,
    version: rule.version,
    selectors: structuredClone(rule.selectors),
    label: rule.label,
    rule_text: rule.rule_text,
    authority_label: rule.authority_label,
    selector_schema: rule.selector_schema ?? null,
    subject_actor_ids: [...(rule.subject_actor_ids ?? [])],
    counterparty_actor_ids: [...(rule.counterparty_actor_ids ?? [])],
    started_turn: rule.started_turn
  };
}

function resolveDescriptor(command, resolveRuleTemplate) {
  if (typeof resolveRuleTemplate !== 'function') throw new Error('rule_template_resolver_unavailable');
  const descriptor = resolveRuleTemplate(command.template_id, structuredClone(command.selectors));
  if (!descriptor || descriptor.template_id !== command.template_id || typeof descriptor.label !== 'string' ||
      typeof descriptor.rule_text !== 'string' || typeof descriptor.authority_label !== 'string') {
    throw new Error('rule_template_not_canonical_or_selectors_invalid');
  }
  for (const field of ['subject_actor_ids', 'counterparty_actor_ids']) {
    const values = descriptor[field] ?? [];
    if (!Array.isArray(values) || values.some(id => typeof id !== 'string')) throw new Error('rule_template_actor_projection_invalid');
  }
  return descriptor;
}

/** Build a prospective canonical rules snapshot. The caller persists this only with Story + Observer. */
export function prepareRuleChange({ state, command, turnNumber, resolveRuleTemplate }) {
  if (command?.kind !== 'RULE_CHANGE' || !command.rule_change) throw new TypeError('rule_change_command_required');
  const active = [...(state.active_rules ?? [])];
  const change = command.rule_change;
  const currentIndex = active.findIndex(rule => rule.rule_id === change.rule_id);
  const current = currentIndex >= 0 ? active[currentIndex] : null;
  let event;

  if (change.operation === 'APPLY') {
    if (current) throw new Error('rule_already_active');
    const descriptor = resolveDescriptor(change, resolveRuleTemplate);
    const next = {
      rule_id: change.rule_id,
      template_id: descriptor.template_id,
      version: 1,
      selectors: structuredClone(change.selectors),
      label: descriptor.label,
      rule_text: descriptor.rule_text,
      authority_label: descriptor.authority_label,
      selector_schema: descriptor.selector_schema ?? null,
      subject_actor_ids: [...(descriptor.subject_actor_ids ?? [])],
      counterparty_actor_ids: [...(descriptor.counterparty_actor_ids ?? [])],
      started_turn: turnNumber
    };
    active.push(next);
    event = { operation: 'APPLY', rule_id: change.rule_id, effective_turn: turnNumber, previous_rule: null, next_rule: publicRule(next), command_id: command.command_id };
  } else {
    if (!current) throw new Error('rule_not_active');
    if (current.version !== change.expected_rule_version) throw new Error('rule_version_conflict');
    if (change.operation === 'REMOVE') {
      if (current.template_id !== change.template_id || stableJson(current.selectors) !== stableJson(change.selectors)) {
        throw new Error('remove_rule_identity_mismatch');
      }
      active.splice(currentIndex, 1);
      event = { operation: 'REMOVE', rule_id: change.rule_id, effective_turn: turnNumber, previous_rule: publicRule(current), next_rule: null, command_id: command.command_id };
    } else {
      const descriptor = resolveDescriptor(change, resolveRuleTemplate);
      const next = {
        rule_id: current.rule_id,
        template_id: descriptor.template_id,
        version: current.version + 1,
        selectors: structuredClone(change.selectors),
        label: descriptor.label,
        rule_text: descriptor.rule_text,
        authority_label: descriptor.authority_label,
        selector_schema: descriptor.selector_schema ?? null,
        subject_actor_ids: [...(descriptor.subject_actor_ids ?? [])],
        counterparty_actor_ids: [...(descriptor.counterparty_actor_ids ?? [])],
        started_turn: current.started_turn
      };
      active[currentIndex] = next;
      event = { operation: 'CHANGE', rule_id: change.rule_id, effective_turn: turnNumber, previous_rule: publicRule(current), next_rule: publicRule(next), command_id: command.command_id };
    }
  }

  return Object.freeze({
    active_rules: active,
    rule_history: [...(state.rule_history ?? []), event].slice(-8),
    rule_change_event: structuredClone(event)
  });
}

/** Apply only after the turn reducer succeeds; Observer output has no authority over rule state. */
export function commitProspectiveRuleState(after, prospective) {
  if (!prospective) return after;
  return { ...after, active_rules: structuredClone(prospective.active_rules), rule_history: structuredClone(prospective.rule_history) };
}
