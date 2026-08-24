import { clone } from './contracts.js';

export const R3_CSA_TEMPLATE_IDS = Object.freeze([
  'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7',
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7',
  'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'
]);

const SCOPES = new Set(['player', 'female_employee', 'male_employee', 'company_employee']);
const STRENGTHS = new Set(['weak', 'medium', 'strong']);
const CLOTHING_SLOTS = new Set(['uniform_top', 'uniform_bottom', 'underwear_top', 'underwear_bottom']);
const CLOTHING_VALUES = new Set(['worn', 'removed', 'unknown']);
const LEGACY_TEMPLATE_IDS = Object.freeze({
  no_bra_under_work_clothes: 'W1',
  no_panties_under_work_clothes: 'W2',
  work_in_underwear_only: 'M1',
  work_nude: 'M2'
});

function boundedClothing(value) {
  return Object.fromEntries(Object.entries(value && typeof value === 'object' ? value : {})
    .filter(([slot, state]) => CLOTHING_SLOTS.has(slot) && CLOTHING_VALUES.has(state)));
}

function canonicalId(value, raw = {}) {
  return String(value ?? raw.id ?? '').trim();
}

export function createR3CsaCatalog(raw = {}) {
  const source = Array.isArray(raw?.items) ? raw.items : [];
  const items = R3_CSA_TEMPLATE_IDS.map(id => source.find(item => canonicalId(item?.id, item) === id)).filter(Boolean).map(item => ({
    id: canonicalId(item.id, item), slot: item.slot ?? item.id, tier: item.tier ?? item.strength,
    strength: item.tier ?? item.strength, label: item.label ?? item.content_template ?? item.id,
    rule_text: item.rule_text ?? item.content_template ?? '', content_template: item.rule_text ?? item.content_template ?? '',
    authority_label: item.authority_label ?? item.authority_tier ?? '', category: item.category ?? 'world_behavior',
    mode: item.mode === 'on_player_request' ? 'on_player_request' : 'continuous', trigger: item.trigger ?? item.mode ?? 'continuous',
    subject_scopes: (item.subject_scopes ?? item.allowed_subject_scopes ?? [item.default_subject_scope ?? 'company_employee']).filter(scope => SCOPES.has(scope)),
    default_subject_scope: item.default_subject_scope ?? item.subject_scopes?.[0] ?? 'company_employee',
    counterparty_scopes: (item.counterparty_scopes ?? item.allowed_counterparty_scopes ?? []).filter(scope => SCOPES.has(scope)),
    default_counterparty_scope: item.default_counterparty_scope ?? null,
    selector_schema: item.selector_schema ?? 'none',
    supported_action_families: Array.isArray(item.supported_action_families) ? [...item.supported_action_families] : [],
    execution: item.execution?.kind === 'clothing_state' ? { kind: 'clothing_state', required_state: boundedClothing(item.execution.required_state) } : null
  }));
  return { version: raw.version ?? 'company-r3-csa-21-slot-v1', schema_version: 3, items, compatibility_lineage: { ...(raw.compatibility_lineage ?? {}) }, retired_template_ids: [...(raw.retired_template_ids ?? [])] };
}

function actorDirectory(content) {
  const result = { ...(content?.characters ?? {}) };
  for (const actor of content?.generalNpcs ?? []) result[actor.id] = actor;
  return result;
}

function matchesScope(id, scope, content) {
  if (scope === 'player') return id === 'player';
  const actor = actorDirectory(content)[id];
  if (!actor) return false;
  if (scope === 'company_employee') return true;
  return (actor.gender ?? actor.sex) === (scope === 'female_employee' ? 'female' : 'male');
}

function subjects(scope, state, content, selector = {}) {
  if (selector.subject_actor_id && matchesScope(selector.subject_actor_id, scope, content)) return [selector.subject_actor_id];
  if (scope === 'player') return ['player'];
  const ids = [...new Set(state?.scene?.present_actor_ids ?? [])];
  return ids.filter(id => matchesScope(id, scope, content));
}

function nextRuleId(activeRules) {
  let n = 1; const ids = new Set(Object.keys(activeRules));
  while (ids.has(`r3_csa_${n}`)) n += 1;
  return `r3_csa_${n}`;
}

function catalogItem(catalog, templateId) {
  const id = LEGACY_TEMPLATE_IDS[String(templateId ?? '')] ?? String(templateId ?? '');
  return catalog.items.find(item => item.id === id) ?? null;
}

function validateActor(id, scope, content) {
  if (!id || id === 'player' || !actorDirectory(content)[id] || !matchesScope(id, scope, content)) throw new Error('r3_csa_actor_selector_invalid');
  return id;
}

function validateScope(item, raw, content) {
  const subject = raw.subject_scope ?? item.default_subject_scope;
  const counterparty = item.counterparty_scopes.length ? (raw.counterparty_scope ?? item.default_counterparty_scope) : null;
  if (!item.subject_scopes.includes(subject)) throw new Error('r3_csa_subject_scope_invalid');
  if (item.counterparty_scopes.length && !item.counterparty_scopes.includes(counterparty)) throw new Error('r3_csa_counterparty_scope_invalid');
  const selector = {};
  if (item.selector_schema === 'named_actor' || item.selector_schema === 'actor_pair') selector.subject_actor_id = validateActor(raw.subject_actor_id, subject, content);
  if (item.selector_schema === 'actor_pair') selector.counterparty_actor_id = validateActor(raw.counterparty_actor_id, counterparty, content);
  return { subject, counterparty, selector };
}

function applyClothing(state, activeRules, catalog, content) {
  const next = clone(state); next.clothing = next.clothing && typeof next.clothing === 'object' ? next.clothing : {};
  for (const rule of Object.values(activeRules)) {
    const item = catalogItem(catalog, rule.template_id);
    if (rule.active !== false || !item?.execution?.required_state) continue;
    for (const actorId of subjects(rule.subject_scope, next, content, rule.selector)) {
      const current = { ...(next.clothing[actorId] ?? {}) };
      for (const slot of Object.keys(item.execution.required_state)) current[slot] = 'unknown';
      next.clothing[actorId] = current;
    }
  }
  for (const rule of Object.values(activeRules)) {
    if (rule.active === false) continue;
    const item = catalogItem(catalog, rule.template_id);
    if (!item?.execution?.required_state || !Object.keys(item.execution.required_state).length) continue;
    for (const actorId of subjects(rule.subject_scope, next, content, rule.selector)) next.clothing[actorId] = { ...(next.clothing[actorId] ?? {}), ...item.execution.required_state };
  }
  return next;
}

function ruleChangeRecord(operation, item, scope, id) {
  return {
    type: 'rule_change_turn', operation: operation.operation, rule_id: id ?? null, template_id: item?.id ?? null,
    slot: item?.slot ?? null, tier: item?.tier ?? null, subject_scope: scope?.subject ?? null, counterparty_scope: scope?.counterparty ?? null,
    selector: clone(scope?.selector ?? {}), authority_label: item?.authority_label ?? '', supported_action_families: [...(item?.supported_action_families ?? [])]
  };
}

export function applyR3Csa({ state, content, rawOperations, catalog = createR3CsaCatalog(content?.csaPresets) } = {}) {
  if (!Array.isArray(rawOperations) || rawOperations.length !== 1) throw new Error('r3_csa_operations_invalid');
  const next = clone(state); const activeIds = Array.isArray(next.csa_active) ? [...next.csa_active] : []; const rules = { ...(next.csa_rules ?? {}) };
  const raw = rawOperations[0]; const operation = raw?.operation;
  if (!['activate', 'update', 'deactivate'].includes(operation)) throw new Error('r3_csa_operation_invalid');
  if (operation === 'deactivate') {
    const id = String(raw.id ?? ''); if (!rules[id]) throw new Error('r3_csa_rule_not_found');
    const item = catalogItem(catalog, rules[id].template_id); rules[id] = { ...rules[id], active: false };
    const index = activeIds.indexOf(id); if (index >= 0) activeIds.splice(index, 1); next.csa_active = [...new Set(activeIds)]; next.csa_rules = rules; next.active_rules = next.csa_active.map(ruleId => rules[ruleId]).filter(Boolean); next.last_rule_change = ruleChangeRecord(raw, item, { subject: rules[id].subject_scope, counterparty: rules[id].counterparty_scope, selector: rules[id].selector }, id); return applyClothing(next, rules, catalog, content);
  }
  const item = catalogItem(catalog, raw.template_id ?? rules[raw.id]?.template_id);
  if (!item || !STRENGTHS.has(item.tier)) throw new Error('r3_csa_template_invalid');
  const scope = validateScope(item, raw, content);
  const normalized = { template_id: item.id, slot: item.slot, tier: item.tier, authority_label: item.authority_label, subject_scope: scope.subject, counterparty_scope: scope.counterparty, selector: scope.selector, content: item.rule_text, mode: item.mode, trigger: item.trigger, supported_action_families: [...item.supported_action_families] };
  let ruleId = null;
  if (operation === 'update') {
    ruleId = String(raw.id ?? ''); if (!rules[ruleId]) throw new Error('r3_csa_rule_not_found');
    rules[ruleId] = { ...rules[ruleId], ...normalized, active: true }; if (!activeIds.includes(ruleId)) activeIds.push(ruleId);
  } else { ruleId = nextRuleId(rules); rules[ruleId] = { id: ruleId, ...normalized, active: true }; activeIds.push(ruleId); }
  next.csa_active = [...new Set(activeIds.filter(id => rules[id]?.active))]; next.csa_rules = rules; next.active_rules = next.csa_active.map(id => rules[id]).filter(Boolean); next.last_rule_change = ruleChangeRecord(raw, item, scope, ruleId); return applyClothing(next, rules, catalog, content);
}
