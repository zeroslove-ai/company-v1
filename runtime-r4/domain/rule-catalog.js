const SCOPE_LABELS = Object.freeze({
  female_employee: '여성 직원 전체',
  male_employee: '남성 직원 전체',
  company_employee: '회사 직원 전체',
  player: '플레이어'
});

const SELECTOR_KEYS = new Set(['subject_scope', 'counterparty_scope', 'subject_actor_id', 'counterparty_actor_id']);

function actorsInScope(scope, content, state) {
  if (scope === 'player') return state?.profile ? [{ actor_id: 'player', name: state.profile.name, age: state.profile.age, kind: 'player' }] : [];
  const people = content.actors.filter(actor => {
    if (!Number.isInteger(actor.age) || actor.age < 18) return false;
    if (scope === 'female_employee') return actor.gender === 'female';
    if (scope === 'male_employee') return actor.gender === 'male';
    return scope === 'company_employee';
  });
  if (scope === 'company_employee' && state?.profile) {
    people.push({ actor_id: 'player', name: state.profile.name, age: state.profile.age, kind: 'player' });
  }
  return people;
}

function requireScope(item, field, supplied) {
  const scopes = field === 'subject' ? item.subject_scopes : item.counterparty_scopes;
  const fallback = field === 'subject' ? item.default_subject_scope : item.default_counterparty_scope;
  if (!scopes.length) {
    if (supplied !== undefined && supplied !== null) throw new Error('rule_selector_' + field + '_scope_unavailable');
    return null;
  }
  const selected = supplied ?? fallback ?? scopes[0];
  if (!scopes.includes(selected)) throw new Error('rule_selector_' + field + '_scope_invalid');
  return selected;
}

function requireSelectedActor(id, scope, content, state, field) {
  if (typeof id !== 'string' || !id) throw new Error('rule_selector_' + field + '_actor_required');
  const actor = actorsInScope(scope, content, state).find(person => person.actor_id === id);
  if (!actor) throw new Error('rule_selector_' + field + '_actor_out_of_scope');
  return actor.actor_id;
}

function ruleSlotsOverlap(existing, candidate, catalog) {
  const oldItem = catalog.items.find(item => item.id === existing.template_id);
  const newItem = catalog.items.find(item => item.id === candidate.template_id);
  if (!oldItem || !newItem) return null;
  const conflict = catalog.compatibility_conflicts.find(pair =>
    (pair.left_slot === oldItem.slot && pair.right_slot === newItem.slot) ||
    (pair.right_slot === oldItem.slot && pair.left_slot === newItem.slot));
  if (!conflict) return null;
  const oldActors = new Set(existing.subject_actor_ids ?? []);
  const overlaps = (candidate.subject_actor_ids ?? []).some(id => oldActors.has(id));
  return overlaps ? conflict : null;
}

/** Build a server-owned finite CSA resolver directly from the canonical repository catalog. */
export function createCanonicalRuleResolver(content) {
  const catalog = content.csa_catalog;
  if (!catalog || !Array.isArray(catalog.items)) throw new Error('canonical_rule_catalog_unavailable');

  return (templateId, requestedSelectors, { state = null, excludeRuleId = '' } = {}) => {
    const item = catalog.items.find(candidate => candidate.id === templateId);
    if (!item) throw new Error('rule_template_not_canonical');
    if (!requestedSelectors || typeof requestedSelectors !== 'object' || Array.isArray(requestedSelectors) ||
        Object.keys(requestedSelectors).some(key => !SELECTOR_KEYS.has(key))) {
      throw new Error('rule_selector_shape_invalid');
    }

    const schema = item.selector_schema ?? 'none';
    if (!['none', 'actor_pair', 'named_actor'].includes(schema)) throw new Error('rule_selector_schema_unsupported');
    const subjectScope = requireScope(item, 'subject', requestedSelectors.subject_scope);
    const counterpartyScope = requireScope(item, 'counterparty', requestedSelectors.counterparty_scope);
    let selectedSubject = null;
    let selectedCounterparty = null;

    if (schema === 'none') {
      if (requestedSelectors.subject_actor_id !== undefined || requestedSelectors.counterparty_actor_id !== undefined) {
        throw new Error('rule_selector_named_actor_unavailable');
      }
    } else {
      selectedSubject = requireSelectedActor(requestedSelectors.subject_actor_id, subjectScope, content, state, 'subject');
      if (schema === 'actor_pair') {
        selectedCounterparty = requireSelectedActor(requestedSelectors.counterparty_actor_id, counterpartyScope, content, state, 'counterparty');
      } else if (requestedSelectors.counterparty_actor_id !== undefined) {
        throw new Error('rule_selector_counterparty_actor_unavailable');
      }
    }

    const subjectActors = selectedSubject
      ? [selectedSubject]
      : actorsInScope(subjectScope, content, state).map(actor => actor.actor_id);
    const counterpartyActors = selectedCounterparty
      ? [selectedCounterparty]
      : counterpartyScope
        ? actorsInScope(counterpartyScope, content, state).map(actor => actor.actor_id)
        : [];
    const descriptor = {
      template_id: item.id,
      slot: item.slot,
      tier: item.tier,
      label: item.label,
      rule_text: item.rule_text,
      authority_label: item.authority_label,
      selector_schema: schema,
      subject_scope: subjectScope,
      counterparty_scope: counterpartyScope,
      subject_actor_ids: subjectActors,
      counterparty_actor_ids: counterpartyActors,
      supported_action_families: [...(item.supported_action_families ?? [])],
      execution: item.execution ? structuredClone(item.execution) : null
    };

    for (const active of state?.active_rules ?? []) {
      if (active.rule_id === excludeRuleId) continue;
      const conflict = ruleSlotsOverlap(active, descriptor, catalog);
      if (conflict) throw new Error('rule_conflict:' + conflict.message);
    }
    return descriptor;
  };
}

export function publicCanonicalRuleCatalog(catalog) {
  return {
    authority_tiers: Object.entries(catalog.authority_tiers).map(([tier, label]) => ({ tier, label })),
    items: catalog.items.map(item => ({
      template_id: item.id,
      slot: item.slot,
      tier: item.tier,
      label: item.label,
      rule_text: item.rule_text,
      authority_label: item.authority_label,
      subject_scopes: [...item.subject_scopes],
      counterparty_scopes: [...item.counterparty_scopes],
      default_subject_scope: item.default_subject_scope,
      default_counterparty_scope: item.default_counterparty_scope ?? null,
      selector_schema: item.selector_schema ?? 'none'
    }))
  };
}

function selectorDisplayName(rule, key, content, state) {
  const actorId = rule.selectors?.[key];
  if (actorId === 'player') return state?.profile?.name ?? '플레이어';
  const actor = content.actors.find(person => person.actor_id === actorId);
  if (actor) return actor.name;
  const scope = key === 'subject_actor_id' ? rule.subject_scope : rule.counterparty_scope;
  return SCOPE_LABELS[scope] ?? '설정 범위';
}

function ruleTargetLabel(rule, side, content, state) {
  const selectorKey = side === 'subject' ? 'subject_actor_id' : 'counterparty_actor_id';
  const named = selectorDisplayName(rule, selectorKey, content, state);
  if (rule.selectors?.[selectorKey]) return named;
  const scope = side === 'subject' ? rule.subject_scope : rule.counterparty_scope;
  return SCOPE_LABELS[scope] ?? '설정된 범위';
}

/** A visible, in-world official notice is inserted before model-authored character reactions. */
export function buildOfficialRuleAnnouncement(event, content, state = null) {
  if (!event || !['APPLY', 'CHANGE', 'REMOVE'].includes(event.operation)) return null;
  const current = event.next_rule ?? event.previous_rule;
  if (!current) return null;
  const old = event.previous_rule;
  const channel = /당국|법령/.test(current.authority_label)
    ? '관계 기관 공식 공지'
    : '사내 메신저 · 공식 공지';
  const heading = event.operation === 'APPLY' ? '새 규칙 시행' : event.operation === 'CHANGE' ? '규칙 개정' : '규칙 효력 종료';
  const details = event.operation === 'REMOVE'
    ? [`${old.authority_label} · ${old.label}`, old.rule_text, `적용 범위: ${ruleTargetLabel(old, 'subject', content, state)}`, '효력은 이번 공지 시점부터 종료됩니다.']
    : [
        `${current.authority_label} · ${current.label}`,
        current.rule_text,
        `대상 범위: ${ruleTargetLabel(current, 'subject', content, state)}`,
        ...(current.counterparty_scope ? [`상대 범위: ${ruleTargetLabel(current, 'counterparty', content, state)}`] : []),
        ...(event.operation === 'CHANGE' && old ? [`개정 전: ${old.label} · 개정 후: ${current.label}`] : []),
        '효력은 이번 공지 시점부터 적용됩니다.'
      ];
  return `[${channel} · ${heading}]\n${details.join('\n')}`;
}

export function canonicalScopeLabel(scope) {
  return SCOPE_LABELS[scope] ?? '설정된 범위';
}
