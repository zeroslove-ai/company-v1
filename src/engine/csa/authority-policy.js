/**
 * Canonical institutional meaning for the three CSA authority tiers.
 * Mechanical unlock/rank/slot limits remain in capability.js; this module
 * owns only the world-facing interpretation and deterministic scope matching.
 */
export const CSA_AUTHORITY_POLICY = Object.freeze({
  weak: Object.freeze({
    id: 'weak',
    institutional_form: 'internal_company_guidance_or_operating_rule',
    label: '약함',
    description: '사내 지침·운영 규정으로 회사에 적용되는 제한적인 사회적 관습을 바꿉니다.'
  }),
  medium: Object.freeze({
    id: 'medium',
    institutional_form: 'company_work_rule_or_enterprise_compliance_policy',
    label: '중간',
    description: '취업규칙·전사 준수 규정으로 회사에 적용되는 행동 기준을 바꿉니다.'
  }),
  strong: Object.freeze({
    id: 'strong',
    institutional_form: 'national_law_or_regulatory_directive_and_company_notice',
    label: '강함',
    description: '국가 법령·관계 당국 의무 지침과 회사 공지로 적용되는 규칙을 바꿉니다.'
  })
});

export const CSA_ENACTMENT_BY_PHASE = Object.freeze({
  newly_activated: 'announce_new',
  updated: 'announce_update',
  ongoing: 'already_established'
});

export function authorityPolicyFor(value) {
  const id = typeof value === 'string' && Object.hasOwn(CSA_AUTHORITY_POLICY, value) ? value : 'weak';
  return CSA_AUTHORITY_POLICY[id];
}

export function authorityPolicyPayload() {
  return Object.values(CSA_AUTHORITY_POLICY).map(policy => ({ ...policy }));
}

export function enactmentForPhase(phase) {
  return CSA_ENACTMENT_BY_PHASE[phase] ?? CSA_ENACTMENT_BY_PHASE.ongoing;
}

export function phaseFor(rule = {}, expectedTurn = null) {
  const createdTurn = Number.isInteger(rule?.created_turn) ? rule.created_turn : null;
  const updatedTurn = Number.isInteger(rule?.updated_turn) ? rule.updated_turn : null;
  if (createdTurn !== null && createdTurn === expectedTurn) return 'newly_activated';
  if (updatedTurn !== null && updatedTurn === expectedTurn) return 'updated';
  return 'ongoing';
}

export const phaseForRule = phaseFor;

export function profileSex(profile = {}) {
  const value = profile?.gender ?? profile?.sex ?? null;
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null;
}

export function subjectScopeForRule(rule = {}) {
  const preset = rule?.preset && typeof rule.preset === 'object' ? rule.preset : {};
  return (typeof preset.subject_scope === 'string' && preset.subject_scope.trim())
    ? preset.subject_scope.trim()
    : (typeof preset.affected_group === 'string' && preset.affected_group.trim())
      ? preset.affected_group.trim()
      : (typeof rule.subject_scope === 'string' && rule.subject_scope.trim() ? rule.subject_scope.trim() : 'company_employee');
}

/** Deterministic matcher for the currently supported catalog subject scopes. */
export function matchesCsaSubjectScope(profile = {}, subjectScope = 'company_employee') {
  const id = profile?.character_id ?? profile?.id;
  const sex = profileSex(profile);
  if (subjectScope === 'player') return id === 'player' || profile?.player === true;
  if (subjectScope === 'female_employee') return sex === 'female';
  if (subjectScope === 'male_employee') return sex === 'male';
  if (subjectScope === 'company_employee') return true;
  return false;
}

export function policyPromptLines() {
  return Object.values(CSA_AUTHORITY_POLICY)
    .map(policy => `- ${policy.id}: ${policy.description}`)
    .join('\n');
}
