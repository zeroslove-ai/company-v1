/**
 * Story/Extract prompt contract sections ported from the donor's CSA-runtime
 * Story-only prompt builders were removed after the Story projection became
 * single-authority. Extract-only builders remain below. World terms are
 * resolved by the Worker projection before these observation contracts run.
 * The original donor prompt builders are intentionally not retained here.
 * buildCsaApplicationCheckSection,
 * buildMindEffectExtractFirewallSection). World terms swapped to Company's
 * (병원 -> 회사, 간호사/의사 -> 동료/상사, 환자/보호자 -> 방문자/협력사
 * 담당자); every behavioral guarantee kept as-written. The relationship-
 * guard bullets are the CSA-specific subset pulled out of donor's broader
 * buildRelationshipInterpretationSection, not the whole general-relationship
 * system (out of scope for this port).
 */

/** Extract omission repair prompt — reminds the model which active CSAs actually needed to fire this turn. */
export function buildCsaApplicationCheckSection(applicableCsa) {
  if (!applicableCsa.length) return '';
  const lines = applicableCsa.map(csa => `- (${csa.id}) ${csa.content}`).join('\n');
  return `\n\n[CSA POST-STORY OBSERVATION]\n아래는 이번 턴에 활성화되어 있던 세계 규칙이다. Story 원문을 마지막 장면까지 다시 읽고 실제로 규칙 아래에서 벌어진 행동·이행·명시적 위반만 Extract에 기록한다. Story에 없는 이행·위반·대상·징계를 창작하지 않으며, 규칙이 장면에 실제로 걸리지 않은 경우 omission을 만들지 않는다.\n${lines}`;
}


/** Extract-only runtime tracking contract — only worth the tokens when a CSA is actually active this turn. */
export function buildCsaRuntimeExtractContractSection(applicableCsa) {
  if (!applicableCsa || !applicableCsa.length) return '';
  return '\n\ncsa_trigger_evaluations:[{csa_id,status}] status: satisfied|continuing|temporarily_interrupted|not_satisfied|ended, csa_id must already be active. csa_runtime_updates:[{csa_id,character_id,status}] status: inactive|active|paused|ended, only after Story showed the named character actually doing, interrupting, or refusing the rule; character_id is a post-Story observation, never a preselected Story actor.';
}

const MIND_EFFECT_EXTRACT_FIREWALL = `
[COMMON-SENSE CHANGE MEMORY FIREWALL]
- 실제 사건과 현재 반응만 저장하고 개변의 의미 범위 확대나 항목 간 합성 해석은 저장하지 않는다.
- 개변에 따른 행동·신체 반응을 영구 호감·신뢰·복종·취향·동의·관계 변화로 저장하지 않는다.
- 객관적 사건과 자발성 해석을 분리하고, 독립적 감정 변화가 Story에 명확할 때만 관계·스탯 변화로 기록한다.`;

export function buildMindEffectExtractFirewallSection({ hasApplicableCsa = false, hasCsaTransaction = false } = {}) {
  return hasApplicableCsa || hasCsaTransaction ? MIND_EFFECT_EXTRACT_FIREWALL : '';
}
