import { clone } from './contracts.js';

export const R3_CSA_TEMPLATE_IDS = Object.freeze([
  'no_panties_under_work_clothes', 'no_bra_under_work_clothes', 'target_places_requester_hand_on_waist_or_thigh',
  'work_nude', 'masturbate_for_recipient', 'work_in_underwear_only',
  'vaginal_sex_with_recipient', 'player_request_executes_immediately', 'continue_until_recipient_orgasm'
]);

const SCOPES = new Set(['player', 'female_employee', 'male_employee', 'company_employee']);
const STRENGTHS = new Set(['weak', 'medium', 'strong']);
const CLOTHING_SLOTS = new Set(['uniform_top', 'uniform_bottom', 'underwear_top', 'underwear_bottom']);
const CLOTHING_VALUES = new Set(['worn', 'removed', 'unknown']);

export function createR3CsaCatalog(raw = {}) {
  const source = Array.isArray(raw?.items) ? raw.items : [];
  const items = R3_CSA_TEMPLATE_IDS.map(id => source.find(item => item?.id === id)).filter(Boolean).map(item => ({
    id: item.id, label: item.label ?? item.content_template ?? item.id, category: item.category ?? 'world_behavior',
    strength: item.strength, mode: item.mode === 'on_player_request' ? 'on_player_request' : 'continuous',
    trigger: item.trigger ?? item.mode ?? 'continuous', content_template: item.content_template ?? '',
    subject_scopes: (item.allowed_subject_scopes ?? [item.default_subject_scope ?? item.affected_group ?? 'company_employee']).filter(scope => SCOPES.has(scope)),
    default_subject_scope: item.default_subject_scope ?? item.affected_group ?? 'company_employee',
    counterparty_scopes: (item.allowed_counterparty_scopes ?? []).filter(scope => SCOPES.has(scope)),
    default_counterparty_scope: item.default_counterparty_scope ?? null,
    execution: item.execution?.kind === 'clothing_state' ? { kind: 'clothing_state', required_state: boundedClothing(item.execution.required_state) } : null
  }));
  return { version: 1, schema_version: 1, items };
}

function boundedClothing(value) {
  return Object.fromEntries(Object.entries(value && typeof value === 'object' ? value : {})
    .filter(([slot, state]) => CLOTHING_SLOTS.has(slot) && CLOTHING_VALUES.has(state)));
}

function actorDirectory(content) {
  const result = { ...(content?.characters ?? {}) };
  for (const actor of content?.generalNpcs ?? []) result[actor.id] = actor;
  return result;
}

function matchesScope(id, scope, state, content) {
  if (scope === 'player') return id === 'player';
  const actor = actorDirectory(content)[id];
  if (!actor) return false;
  if (scope === 'company_employee') return true;
  return (actor.gender ?? actor.sex) === (scope === 'female_employee' ? 'female' : 'male');
}

function subjects(scope, state, content) {
  if (scope === 'player') return ['player'];
  const ids = [...new Set(state?.scene?.present_actor_ids ?? [])];
  return ids.filter(id => matchesScope(id, scope, state, content));
}

function nextRuleId(activeRules) {
  let n = 1; const ids = new Set(Object.keys(activeRules));
  while (ids.has(`r3_csa_${n}`)) n += 1;
  return `r3_csa_${n}`;
}

function catalogItem(catalog, templateId) { return catalog.items.find(item => item.id === templateId) ?? null; }

function validateScope(item, raw) {
  const subject = raw.subject_scope ?? item.default_subject_scope;
  const counterparty = item.counterparty_scopes.length ? (raw.counterparty_scope ?? item.default_counterparty_scope) : null;
  if (!item.subject_scopes.includes(subject)) throw new Error('r3_csa_subject_scope_invalid');
  if (item.counterparty_scopes.length && !item.counterparty_scopes.includes(counterparty)) throw new Error('r3_csa_counterparty_scope_invalid');
  return { subject, counterparty };
}

function applyClothing(state, activeRules, catalog, content) {
  const next = clone(state); next.clothing = next.clothing && typeof next.clothing === 'object' ? next.clothing : {};
  for (const rule of Object.values(activeRules)) {
    const item = catalogItem(catalog, rule.template_id);
    if (rule.active !== false || !item?.execution?.required_state) continue;
    for (const actorId of subjects(rule.subject_scope, next, content)) {
      const current = { ...(next.clothing[actorId] ?? {}) };
      for (const slot of Object.keys(item.execution.required_state)) current[slot] = 'unknown';
      next.clothing[actorId] = current;
    }
  }
  for (const rule of Object.values(activeRules)) {
    if (rule.active === false) continue;
    const item = catalogItem(catalog, rule.template_id);
    if (!item?.execution?.required_state || !Object.keys(item.execution.required_state).length) continue;
    for (const actorId of subjects(rule.subject_scope, next, content)) next.clothing[actorId] = { ...(next.clothing[actorId] ?? {}), ...item.execution.required_state };
  }
  return next;
}

export function applyR3Csa({ state, content, rawOperations, catalog = createR3CsaCatalog(content?.csaPresets) } = {}) {
  if (!Array.isArray(rawOperations) || !rawOperations.length || rawOperations.length > 4) throw new Error('r3_csa_operations_invalid');
  const next = clone(state); const activeIds = Array.isArray(next.csa_active) ? [...next.csa_active] : []; const rules = { ...(next.csa_rules ?? {}) };
  for (const raw of rawOperations) {
    const operation = raw?.operation;
    if (!['activate', 'update', 'deactivate'].includes(operation)) throw new Error('r3_csa_operation_invalid');
    if (operation === 'deactivate') {
      const id = String(raw.id ?? ''); if (!rules[id]) throw new Error('r3_csa_rule_not_found');
      rules[id] = { ...rules[id], active: false }; const index = activeIds.indexOf(id); if (index >= 0) activeIds.splice(index, 1); continue;
    }
    const item = catalogItem(catalog, raw.template_id ?? rules[raw.id]?.template_id);
    if (!item || !STRENGTHS.has(item.strength)) throw new Error('r3_csa_template_invalid');
    const scope = validateScope(item, raw);
    if (operation === 'update') {
      const id = String(raw.id ?? ''); if (!rules[id]) throw new Error('r3_csa_rule_not_found');
      rules[id] = { ...rules[id], active: true, template_id: item.id, strength: item.strength, subject_scope: scope.subject, counterparty_scope: scope.counterparty, content: item.content_template, mode: item.mode, trigger: item.trigger };
      if (!activeIds.includes(id)) activeIds.push(id);
    } else {
      const id = nextRuleId(rules); rules[id] = { id, active: true, template_id: item.id, strength: item.strength, subject_scope: scope.subject, counterparty_scope: scope.counterparty, content: item.content_template, mode: item.mode, trigger: item.trigger }; activeIds.push(id);
    }
  }
  next.csa_active = [...new Set(activeIds.filter(id => rules[id]?.active))]; next.csa_rules = rules; next.active_rules = next.csa_active.map(id => rules[id]).filter(Boolean); return applyClothing(next, rules, catalog, content);
}
