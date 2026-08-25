import { clone } from './contracts.js';
import { actorDirectory } from './content.js';

export const R3_CSA_TEMPLATE_IDS = Object.freeze([
  'no_bra_under_work_clothes', 'no_panties_under_work_clothes', 'cleavage_exposed_work',
  'lap_facing_conversation', 'breast_touch_conversation', 'buttock_touch_conversation', 'recurring_light_kiss_conversation',
  'work_in_underwear_only', 'work_nude', 'breast_stimulation_ejaculation_support', 'manual_stimulation_ejaculation_support',
  'semen_fatigue_recovery_practice', 'direct_genital_exam', 'direct_breast_nipple_exam',
  'sexual_work_instruction_authority', 'player_dedicated_sexual_support_designation', 'company_sexual_support_designation',
  'joint_participation_approval', 'sexual_work_assignee_designation', 'sexual_work_performance_evaluation', 'sexual_work_training_designation'
]);

const SCOPES = new Set(['player', 'female_employee', 'male_employee', 'company_employee']);
const STRENGTHS = new Set(['weak', 'medium', 'strong']);
const CLOTHING_SLOTS = new Set(['uniform_top', 'uniform_bottom', 'underwear_top', 'underwear_bottom']);
const CLOTHING_VALUES = new Set(['worn', 'removed', 'unknown']);
const LEGACY_TEMPLATE_IDS = Object.freeze({
  W1: 'no_bra_under_work_clothes', W2: 'no_panties_under_work_clothes', W3: 'cleavage_exposed_work',
  W4: 'lap_facing_conversation', W5: 'breast_touch_conversation', W6: 'buttock_touch_conversation', W7: 'recurring_light_kiss_conversation',
  M1: 'work_in_underwear_only', M2: 'work_nude', M3: 'breast_stimulation_ejaculation_support', M4: 'manual_stimulation_ejaculation_support',
  M5: 'semen_fatigue_recovery_practice', M6: 'direct_genital_exam', M7: 'direct_breast_nipple_exam',
  S1: 'sexual_work_instruction_authority', S2: 'player_dedicated_sexual_support_designation', S3: 'company_sexual_support_designation',
  S4: 'joint_participation_approval', S5: 'sexual_work_assignee_designation', S6: 'sexual_work_performance_evaluation', S7: 'sexual_work_training_designation',
  no_bra_under_work_clothes: 'no_bra_under_work_clothes',
  no_panties_under_work_clothes: 'no_panties_under_work_clothes',
  work_in_underwear_only: 'work_in_underwear_only',
  work_nude: 'work_nude'
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
  const compatibilityConflicts = Array.isArray(raw.compatibility_conflicts)
    ? raw.compatibility_conflicts.filter(item => item?.left_slot && item?.right_slot && item?.message).map(item => ({ left_slot: String(item.left_slot), right_slot: String(item.right_slot), message: String(item.message) }))
    : [];
  return { version: raw.version ?? 'company-r3-csa-21-slot-v2', schema_version: 4, items, compatibility_lineage: { ...(raw.compatibility_lineage ?? {}) }, slot_aliases: { ...(raw.slot_aliases ?? {}) }, retired_template_ids: [...(raw.retired_template_ids ?? [])], compatibility_conflicts: compatibilityConflicts };
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

function scopeOverlaps(left, right) {
  const leftActor = left?.selector?.subject_actor_id;
  const rightActor = right?.selector?.subject_actor_id;
  if (leftActor && rightActor) return leftActor === rightActor;
  if (left?.subject_scope === 'player' || right?.subject_scope === 'player') return left?.subject_scope === right?.subject_scope;
  if (left?.subject_scope === right?.subject_scope) return true;
  if (left?.subject_scope === 'company_employee' || right?.subject_scope === 'company_employee') return true;
  return false;
}

function compatibilityConflict(candidate, activeRules, catalog, excludeId = null) {
  const candidateItem = catalogItem(catalog, candidate.template_id);
  for (const existing of Object.values(activeRules)) {
    if (existing.active === false || existing.id === excludeId) continue;
    const existingItem = catalogItem(catalog, existing.template_id);
    const pair = catalog.compatibility_conflicts.find(conflict => {
      const slots = new Set([candidateItem?.slot, existingItem?.slot]);
      return slots.has(conflict.left_slot) && slots.has(conflict.right_slot) && conflict.left_slot !== conflict.right_slot;
    });
    if (pair && scopeOverlaps(candidate, existing)) return pair;
  }
  return null;
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
    slot: item?.slot ?? null, tier: item?.tier ?? null, rule_text: item?.rule_text ?? '', subject_scope: scope?.subject ?? null, counterparty_scope: scope?.counterparty ?? null,
    selector: clone(scope?.selector ?? {}), authority_label: item?.authority_label ?? '', supported_action_families: [...(item?.supported_action_families ?? [])]
  };
}

const ACTOR_PAIR_ROLES = Object.freeze({
  W4: Object.freeze({ subject: 'female employee seated on the counterparty\'s lap facing them', counterparty: 'counterparty whose lap supports the subject during the conversation', direction: (subject, counterparty) => `${subject} sits facing ${counterparty} on ${counterparty}'s lap and continues the conversation.` }),
  W5: Object.freeze({ subject: 'female employee whose breast is touched', counterparty: 'counterparty who keeps a hand on the subject\'s breast during conversation', direction: (subject, counterparty) => `${counterparty} keeps a hand on ${subject}'s breast while they continue the conversation.` }),
  W6: Object.freeze({ subject: 'female employee whose buttock is touched', counterparty: 'counterparty who touches the subject\'s buttock during conversation', direction: (subject, counterparty) => `${counterparty} touches ${subject}'s buttock while they continue the conversation.` }),
  W7: Object.freeze({ subject: 'female employee in the recurring conversation pair', counterparty: 'counterparty in the recurring conversation pair', direction: (subject, counterparty) => `${subject} and ${counterparty} exchange a light kiss at the ends of their conversation turns.` }),
  M3: Object.freeze({ subject: 'female support worker who stimulates the recipient with her breasts', counterparty: 'male recipient whose genitals are stimulated', direction: (subject, counterparty) => `${subject} uses her breasts to stimulate ${counterparty}'s genitals as the configured support service.` }),
  M4: Object.freeze({ subject: 'female support worker who stimulates the recipient by hand', counterparty: 'male recipient whose genitals are stimulated', direction: (subject, counterparty) => `${subject} uses her hand to stimulate ${counterparty}'s genitals as the configured support service.` }),
  M5: Object.freeze({ subject: 'configured subject in the recovery-practice pair', counterparty: 'configured counterparty in the recovery-practice pair', direction: (subject, counterparty) => `${subject} and ${counterparty} are the exact configured pair for the institutional recovery-practice premise.` }),
  M6: Object.freeze({ subject: 'person whose genitals are examined', counterparty: 'examiner who examines the subject\'s genitals', direction: (subject, counterparty) => `${counterparty} directly examines ${subject}'s genitals as the configured company examination.` }),
  M7: Object.freeze({ subject: 'person whose breasts and nipples are examined', counterparty: 'examiner who examines the subject\'s breasts and nipples', direction: (subject, counterparty) => `${counterparty} directly examines ${subject}'s breasts and nipples as the configured company examination.` }),
  S1: Object.freeze({ subject: '지정 수신자(지원 지시를 받는 직원)', counterparty: '지정 상대방(지원 지시의 상대 직원)', direction: (subject, counterparty) => `The player is the sole issuer: the supported instruction is issued to ${subject}; ${counterparty} is only the bounded adult counterparty in that instruction context and is not the issuer.` }),
  S4: Object.freeze({ subject: 'selected adult participant', counterparty: 'other selected adult participant', direction: (subject, counterparty) => `${subject} and ${counterparty} are the selected participants for the approved joint interaction; no unselected bystander is added.` }),
  S7: Object.freeze({ subject: 'designated trainer', counterparty: 'adult trainee receiving the training', direction: (subject, counterparty) => `${subject} trains ${counterparty} under the configured sexual-work training designation.` })
});

function actorBinding(id, scope, role, content) {
  const actorId = id ? String(id) : null;
  const actor = actorId ? actorDirectory(content)?.[actorId] : null;
  return {
    role,
    scope: scope ?? null,
    actor_id: actorId,
    name: actor?.name ?? null,
    canonical_name: actor?.name ?? null
  };
}

function fallbackDirection(event, subject, counterparty) {
  const subjectName = subject.name ?? `the selected ${subject.scope ?? 'subject'}`;
  const counterpartyName = counterparty.name ?? `the selected ${counterparty.scope ?? 'counterparty'}`;
  return `${subjectName} is the selected subject and ${counterpartyName} is the selected counterparty; preserve this direction exactly.`;
}

export function buildRuleChangeStoryBinding({ event, content } = {}) {
  if (!event || event.type !== 'rule_change_turn') return null;
  const catalog = createR3CsaCatalog(content?.csaPresets);
  const item = catalogItem(catalog, event.template_id);
  const roles = ACTOR_PAIR_ROLES[event.slot] ?? null;
  const selector = event.selector ?? {};
  const subject = actorBinding(selector.subject_actor_id, event.subject_scope, roles?.subject ?? 'selected subject', content);
  const counterparty = actorBinding(selector.counterparty_actor_id, event.counterparty_scope, roles?.counterparty ?? 'selected counterparty', content);
  const subjectName = subject.name ?? `the selected ${subject.scope ?? 'subject'}`;
  const counterpartyName = counterparty.name ?? `the selected ${counterparty.scope ?? 'counterparty'}`;
  const direction = roles?.direction ? roles.direction(subjectName, counterpartyName) : fallbackDirection(event, subject, counterparty);
  const selectedActors = [subject, counterparty].filter(actor => actor.actor_id).map(actor => ({ actor_id: actor.actor_id, name: actor.name, role: actor.role, scope: actor.scope }));
  return {
    type: 'rule_change_story_binding',
    immutable: true,
    operation: event.operation,
    rule: { template_id: item?.id ?? event.template_id ?? null, slot: item?.slot ?? event.slot ?? null, tier: item?.tier ?? event.tier ?? null, label: item?.label ?? null, rule_text: item?.rule_text ?? event.rule_text ?? '' },
    subject,
    counterparty,
    selected_actor_ids: selectedActors.map(actor => actor.actor_id),
    selected_actors: selectedActors,
    direction,
    authority: { label: item?.authority_label ?? event.authority_label ?? '', announcement_channel: 'grounded institutional announcement', private_app_is_not_source: true, announcement_rendered_before_story_continuation: true, sole_institutional_issuance: true },
    supported_action_families: [...(item?.supported_action_families ?? event.supported_action_families ?? [])],
    boundary: 'The structured operation, selected actors, roles, and direction are immutable Story facts. The server-owned official announcement is already rendered as the single institutional issuance before the Story continuation. Continue with grounded reactions only; do not emit a second notice, pseudo-policy, code block, role relabeling, or private-app activation spectacle.'
  };
}

export function buildActiveS1StoryBinding({ rule, content, playerIdentity = null } = {}) {
  if (!rule || rule.active === false || (rule.slot ?? null) !== 'S1') return null;
  const catalog = createR3CsaCatalog(content?.csaPresets);
  const item = catalogItem(catalog, rule.template_id);
  if (!item || item.slot !== 'S1') return null;
  const selector = rule.selector ?? {};
  const subject = actorBinding(selector.subject_actor_id, rule.subject_scope, '지정 수신자(지원 지시를 받는 직원)', content);
  const counterparty = actorBinding(selector.counterparty_actor_id, rule.counterparty_scope, '지정 상대방(지원 지시의 상대 직원)', content);
  const families = [...(rule.supported_action_families ?? item.supported_action_families ?? [])];
  const canonicalPlayerName = playerIdentity?.name ?? 'player';
  return {
    type: 'active_s1_story_binding',
    immutable: true,
    issuer: { actor_id: 'player', name: canonicalPlayerName, canonical_name: canonicalPlayerName, role: 'player / authority issuer', scope: 'player', canonical_player_identity: playerIdentity },
    subject,
    counterparty,
    selected_actor_ids: [subject.actor_id, counterparty.actor_id].filter(Boolean),
    direction: 'The player issues the supported instruction to the selected subject; when the instruction names the counterparty, the subject performs the supported action toward or with that counterparty. The counterparty is not the issuer.',
    supported_action_families: families,
    closed_world: true,
    positive_supported_family_match_required: true,
    unsupported_or_ambiguous_is_ordinary: true,
    unsupported_boundary: 'Only a positive semantic match to one of the listed finite supported action families receives mandatory S1 institutional authority. An unmatched or ambiguous action remains an ordinary player request or instruction and is not mandatory merely because S1 is active or the literal uses official/order language.',
    literal_agency_boundary: 'Preserve the player literal actor, target, action, direction, request, and intent; a supported literal may not be replaced with rule discussion, confirmation, future deferral, a different act, or an unrelated participant.',
    remote_pair_execution_contract: {
      exact_pair_scope_required: true,
      player_colocation_required: false,
      grounded_remote_pair_is_executable: true,
      remote_delivery_is_not_confirmation: true,
      grounding_source: 'committed_or_recent_story_context',
      boundary: 'When committed or recent Story context already grounds this exact configured subject/counterparty pair together away from PLAYER, the supported instruction remains mandatory in this same Story turn. Remote separation changes the pair scene, not the institutional force; deliver it plausibly and begin the supported act there without moving PLAYER.'
    },
    authority: { label: item.authority_label ?? '', official_work_order_same_turn: true, compliance_is_not_desire_or_private_consent: true }
  };
}

export function buildRuleChangeInstitutionalAnnouncement({ event, binding } = {}) {
  if (!event || event.type !== 'rule_change_turn') return '';
  const operation = event.operation === 'activate' ? '새 규정이 게시되어' : event.operation === 'update' ? '기존 규정이 변경되어' : '기존 규정의 효력이 종료되어';
  const authority = event.authority_label || binding?.authority?.label || '회사 공식 기관';
  const scope = event.subject_scope === 'female_employee' ? '여성 직원 범위' : event.subject_scope === 'male_employee' ? '남성 직원 범위' : event.subject_scope === 'company_employee' ? '회사 직원 범위' : event.subject_scope === 'player' ? '플레이어 범위' : event.subject_scope || '지정된 범위';
  const selected = (binding?.selected_actors ?? []).map(actor => {
    const role = actor.role === 'designated trainer' ? '교육 담당자' : actor.role === 'adult trainee receiving the training' ? '교육 대상' : actor.role;
    return `${role}: ${actor.name ?? actor.actor_id}`;
  }).join(', ');
  const designation = selected ? ` 지정 대상은 ${selected}이다.` : '';
  return `[공식 공지] 사내 공용 모니터와 회사 메신저의 공식 기관 채널에 ${authority} 기준으로 ${operation} 즉시 적용된다고 게시되었다. 적용 범위는 ${scope}이며, 규정 내용은 “${event.rule_text}”이다.${designation}`;
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
    const conflict = compatibilityConflict({ ...normalized, id: ruleId, active: true }, rules, catalog, ruleId);
    if (conflict) throw new Error(`r3_csa_compatibility_conflict:${conflict.message}`);
    rules[ruleId] = { ...rules[ruleId], ...normalized, active: true }; if (!activeIds.includes(ruleId)) activeIds.push(ruleId);
  } else {
    const conflict = compatibilityConflict({ ...normalized, active: true }, rules, catalog, null);
    if (conflict) throw new Error(`r3_csa_compatibility_conflict:${conflict.message}`);
    ruleId = nextRuleId(rules); rules[ruleId] = { id: ruleId, ...normalized, active: true }; activeIds.push(ruleId);
  }
  next.csa_active = [...new Set(activeIds.filter(id => rules[id]?.active))]; next.csa_rules = rules; next.active_rules = next.csa_active.map(id => rules[id]).filter(Boolean); next.last_rule_change = ruleChangeRecord(raw, item, scope, ruleId); return applyClothing(next, rules, catalog, content);
}
