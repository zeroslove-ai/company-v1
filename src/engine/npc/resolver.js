import { canonicalizeCsaGroup } from '../csa/semantic-contract.js';

/**
 * Resolves a canonical Company actor/target group against concrete general NPCs already present
 * in the scene. Legacy donor ids are accepted only through canonicalizeCsaGroup(). Zero or
 * multiple matches always return null; this module never guesses a person.
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isEmployee(npc) {
  return npc?.type === 'employee' || npc?.affiliation_type === 'employee';
}

function isPartner(npc) {
  return npc?.type === 'partner' || npc?.affiliation_type === 'partner';
}

const MANAGER_ROLE_RE = /(팀장|과장|차장|부장|실장|본부장|임원|상무|전무|대표|이사)/u;

const GROUP_MATCHERS = {
  coworker: isEmployee,
  employee: isEmployee,
  company_employee: isEmployee,
  female_employee: npc => isEmployee(npc) && npc.sex === 'female',
  male_employee: npc => isEmployee(npc) && npc.sex === 'male',
  manager: npc => isEmployee(npc) && MANAGER_ROLE_RE.test(text(npc.role ?? npc.position ?? npc.position_name)),
  business_visitor: isPartner,
  assigned_visitor: isPartner,
  partner_contact: isPartner,
  guest: isPartner,
  everyone_in_company: () => true,
  conversation_partner: () => true,
  another_present_person: () => true,
  nearby_person: () => true
};

function selectorMatcher(groupId) {
  const match = /^(character|department|position|team|role):([^\s]{1,80})$/u.exec(groupId);
  if (!match) return null;
  const [, kind, value] = match;
  if (kind === 'character') return npc => text(npc.id ?? npc.npc_id) === value;
  if (kind === 'department') return npc => text(npc.department_id) === value;
  if (kind === 'position') return npc => {
    const identifiers = [npc.position_id, npc.position, npc.position_name].map(text).filter(Boolean);
    return identifiers.includes(value) || text(npc.role).includes(value);
  };
  if (kind === 'team') return npc => {
    const identifiers = [npc.team_id, npc.team, npc.team_name].map(text).filter(Boolean);
    return identifiers.includes(value) || text(npc.role).includes(value);
  };
  return npc => {
    const identifiers = [npc.role_id, npc.role].map(text).filter(Boolean);
    return identifiers.includes(value) || text(npc.role).includes(value);
  };
}

/**
 * presentGeneralNpcs contains only general-NPC profiles actually present in the current scene.
 * Optional departmentId is an additional exact filter. Returns { id } only for one unique match.
 */
export function resolveGeneralNpcForGroup(groupId, presentGeneralNpcs = [], { departmentId = null } = {}) {
  const canonicalGroup = canonicalizeCsaGroup(groupId);
  const matcher = GROUP_MATCHERS[canonicalGroup] ?? selectorMatcher(canonicalGroup);
  if (!matcher || !Array.isArray(presentGeneralNpcs) || !presentGeneralNpcs.length) return null;
  let candidates = presentGeneralNpcs.filter(npc => isPlainObject(npc) && matcher(npc));
  if (departmentId) candidates = candidates.filter(npc => npc.department_id === departmentId);
  const unique = new Map(candidates.map(npc => [text(npc.id ?? npc.npc_id), npc]));
  unique.delete('');
  return unique.size === 1 ? { id: [...unique.keys()][0] } : null;
}
