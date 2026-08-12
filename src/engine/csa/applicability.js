/**
 * Company adapter note: donor stores each CSA as a full entry object inline
 * in a single csa_active[] array (activate pushes, deactivate flips
 * item.active=false but never removes it). Company's save schema instead
 * keeps csa_active as a plain list of currently-active ids (already the
 * contract used by the current gameplay reducers) with the full rule
 * body in csa_rules[id] — deactivate removes the id from csa_active but
 * keeps csa_rules[id] (with active:false stamped) forever, which is what
 * satisfies "해제 후 규칙 기록 보존" without changing the existing
 * csa_active contract.
 */

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export { matchesCsaSubjectScope, subjectScopeForRule } from './authority-policy.js';

const SCOPE_LABEL = '회사 전체';

export function normalizeCsaScope() {
  return { scope_type: 'world', scope_id: 'world', scope_label: SCOPE_LABEL };
}

/** Every rule Company has ever registered for this game, keyed by id — includes deactivated history. */
export function getCsaRules(save) {
  return isPlainObject(save?.csa_rules) ? save.csa_rules : {};
}

function legacyContent(rule) {
  if (typeof rule?.content === 'string' && rule.content.trim()) return rule.content;
  return typeof rule?.required_action === 'string' ? rule.required_action : '';
}

/**
 * Full entry objects for ids currently listed in csa_active, in that order.
 * Early Company saves predate the app port and therefore omit active/content/
 * source_type on their rule bodies. Membership in csa_active was already the
 * canonical active signal, so missing active is normalized to true at this
 * read boundary; an explicit active:false is still authoritative.
 */
export function getActiveCsaEntries(save) {
  const ids = Array.isArray(save?.csa_active) ? save.csa_active : [];
  const rules = getCsaRules(save);
  return ids
    .filter(id => typeof id === 'string' && isPlainObject(rules[id]))
    .map(id => {
      const rule = rules[id];
      return {
        id,
        ...rule,
        active: rule.active !== false,
        content: legacyContent(rule),
        source_type: rule.source_type === 'preset' ? 'preset' : 'custom'
      };
    });
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
