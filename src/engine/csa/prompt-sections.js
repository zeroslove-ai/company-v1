/**
 * Story/Extract prompt contract sections ported from the donor's CSA-runtime
 * Story-only prompt builders were removed after the Story projection became
 * single-authority. Extract-only builders remain below. The original donor
 * prompt builders are intentionally not retained here.
 * buildCsaOnlyAppUsageStorySection, buildCsaApplicationCheckSection,
 * buildMindEffectExtractFirewallSection). World terms swapped to Company's
 * (병원 -> 회사, 간호사/의사 -> 동료/상사, 환자/보호자 -> 방문자/협력사
 * 담당자); every behavioral guarantee kept as-written. The relationship-
 * guard bullets are the CSA-specific subset pulled out of donor's broader
 * buildRelationshipInterpretationSection, not the whole general-relationship
 * system (out of scope for this port).
 */

export function isAppUsageInfoRequest(playerInput) {
  const input = typeof playerInput === 'string' ? playerInput.trim() : '';
  if (!input) return false;
  return /(?:어플|앱|상식개변 어플).*(?:정보|사용법|설명|기능|예시)|(?:정보|사용법|설명|기능|예시).*(?:어플|앱|상식개변 어플)/.test(input);
}

export function buildAppUsageStorySection() {
  return `

[상식개변 앱 안내]
- 이 앱은 특정 개인에게 암시나 최면을 거는 기능 없이, 회사 집단에 적용되는 지침·취업규칙·법령만 생성·수정·해제한다.
- 현재 레벨이 허용하는 강도·범위·활성 슬롯 안에서만 작동한다.
- 강도는 직접 의미 범위 안의 확신과 사회적 압력만 바꾸며 의미 범위를 넓히지 않는다.
- 범위를 벗어나면 현재 적용은 멈추지만 이미 벌어진 사건의 기억과 물리 상태는 유지된다.
- 모든 관리는 상식개변 앱 UI에서만 한다.`;
}

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
