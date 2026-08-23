function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function stateOf(context) {
  return context?.state?.state && typeof context.state.state === 'object'
    ? context.state.state
    : {};
}

export function committedCsaRules(context) {
  const state = stateOf(context);
  const rules = state.csa_rules && typeof state.csa_rules === 'object' ? state.csa_rules : {};
  return Object.entries(rules)
    .filter(([id, rule]) => rule?.active !== false && (!Array.isArray(state.csa_active) || state.csa_active.includes(rule.id ?? id)))
    .map(([id, rule]) => ({ id, ...clone(rule) }))
    .filter(rule => rule.active !== false);
}

function operationKey(operation) {
  if (!operation) return '';
  return operation.operation === 'activate'
    ? `activate:${operation.template_id}`
    : `${operation.operation}:${operation.id}`;
}

export function createCsaDraft(context) {
  return { baseRevision: Number(context?.state?.revision ?? 0), operation: null, notice: '' };
}

export function isCsaDraftDirty(draft) {
  return Boolean(draft?.operation);
}

export function stageCsaOperation(draft, operation) {
  const next = { ...draft, operation: clone(operation), notice: '' };
  if (draft?.operation && operationKey(draft.operation) !== operationKey(operation)) {
    return { draft, blocked: true, notice: '먼저 현재 변경을 적용하거나 되돌려 주세요.' };
  }
  return { draft: next, blocked: false, notice: '' };
}

export function clearCsaDraft(draft) {
  return { ...draft, operation: null, notice: '' };
}

export function csaDraftOperation(draft) {
  return clone(draft?.operation);
}

export function csaDraftRevision(draft) {
  return Number(draft?.baseRevision ?? 0);
}
