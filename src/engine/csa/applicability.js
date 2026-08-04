/**
 * Company adapter note: donor stores each CSA as a full entry object inline
 * in a single csa_active[] array (activate pushes, deactivate flips
 * item.active=false but never removes it). Company's save schema instead
 * keeps csa_active as a plain list of currently-active ids (already the
 * contract gameplay-state.js/guarded-merge.js depend on) with the full rule
 * body in csa_rules[id] — deactivate removes the id from csa_active but
 * keeps csa_rules[id] (with active:false stamped) forever, which is what
 * satisfies "해제 후 규칙 기록 보존" without changing the existing
 * csa_active contract.
 */

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const SCOPE_LABEL = '회사 전체';

export function normalizeCsaScope() {
  return { scope_type: 'world', scope_id: 'world', scope_label: SCOPE_LABEL };
}

/** Every rule Company has ever registered for this game, keyed by id — includes deactivated history. */
export function getCsaRules(save) {
  return isPlainObject(save?.csa_rules) ? save.csa_rules : {};
}

/** Full entry objects for the ids currently listed as active, in csa_active order. */
export function getActiveCsaEntries(save) {
  const ids = Array.isArray(save?.csa_active) ? save.csa_active : [];
  const rules = getCsaRules(save);
  return ids
    .filter(id => typeof id === 'string' && isPlainObject(rules[id]))
    .map(id => ({ id, ...rules[id] }));
}

export function isCsaApplicable(csa) {
  return csa?.active === true;
}

export function getApplicableCsaEntries(save, activeCsa = getActiveCsaEntries(save)) {
  return activeCsa.filter(isCsaApplicable);
}

/** Every rule Company has ever registered, active or deactivated — the aftermath/history surface. */
export function getAllCsaEntries(save) {
  const rules = getCsaRules(save);
  return Object.entries(rules).map(([id, entry]) => ({ id, ...entry }));
}
