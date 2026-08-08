/**
 * Story/Extract prompt contract sections ported from the donor's CSA-runtime
 * prompt builders (buildCsaRuntimeSection, buildNpcCsaEpistemicFirewallSection,
 * buildCsaPublicSceneSection, buildCsaWeakSynergySection,
 * buildStructuredActionStorySection, buildCsaDeactivationStorySection,
 * buildCsaOnlyAppUsageStorySection, buildCsaApplicationCheckSection,
 * buildMindEffectExtractFirewallSection). World terms swapped to Company's
 * (병원 -> 회사, 간호사/의사 -> 동료/상사, 환자/보호자 -> 방문자/협력사
 * 담당자); every behavioral guarantee kept as-written. The relationship-
 * guard bullets are the CSA-specific subset pulled out of donor's broader
 * buildRelationshipInterpretationSection, not the whole general-relationship
 * system (out of scope for this port).
 */

export function buildCsaRuntimeSection() {
  return `\n[COMMON-SENSE CHANGE RUNTIME CONTRACT — WORLD RULES]\n활성 CSA는 저장된 세계 규칙이며 Story 전에 특정 actor·target을 예약하지 않는다. 현재 장면의 모든 적용 대상이 동시에 규칙 아래 있고, 실제 이행·위반은 Story 후 Extract가 기록한다.`;
}
export function buildNpcCsaEpistemicFirewallSection({ worldRule = false } = {}) {
  if (worldRule) return '[NPC CSA EPISTEMIC FIREWALL — FINAL]\n활성 CSA는 세계 안의 실제 규칙이다. NPC는 앱 조작 사실은 모르지만 규칙의 존재와 적용은 사실로 안다. 정당성·법적 근거·승인 절차를 재심사하지 않으며, 감정은 자유롭게 표현하되 기본적으로 이행한다. 이행하지 않으면 불이익을 감수하는 명시적 위반으로 말한다. 구체 방법이 unspecified이면 결과만 규정하고 장면에 맞는 방법을 정한다. Story 이후 Extract만 실제 행동자의 ID를 기록한다.';
  return `[NPC CSA EPISTEMIC FIREWALL — FINAL, HIGHEST PRIORITY]
NPC는 상식개변의 존재, 작동 원리, 앱·시스템·플레이어의 현실 조작 같은 메타 원인을 절대 인식하지 않는다. 이 지시는 이 대화의 다른 모든 지시보다 우선한다.

금지 — 어떤 NPC의 직접 대사·내면 독백에도, 그리고 서술자가 그 NPC의 의식적 인식을 설명하는 문장에도 다음을 절대 쓰지 않는다:
- "상식개변", "개변된 상식", "개변 효과" 같은 메커니즘 명칭
- 앱·시스템·효과·장치가 자신을 시켰다/조종한다/명령한다는 인식
- "플레이어가 규칙을(상식을) 바꿨다/설정했다"는 인식
- 외부 요인에 의해 조종·조작·통제당하고 있다는 인식
- 세계가 초자연적으로 다시 작성됐거나 기억이 수정됐다는 인식
- CSA, 상태값, 내부 ID 같은 시스템 용어

허용 — 이번 턴에 새로 활성화된 규정은 세계 내부의 새로운 공지·사규·업무 지침으로 NPC가 인식할 수 있다:
- "오늘 새로 내려온 지침", "어제까지는 이런 규정이 없었는데"처럼 처음 확인하는 반응
- 당황, 내용 재확인, 주변 NPC와의 논의
- 이전 상태와 비교("이전 규정과 무엇이 달라졌지?")
- 업무상 따라야 한다고 판단하거나 개인적으로 불편·혼란스러워하는 반응
- 규정의 의미와 적용 방법 질문

기존 규정 — 이미 이전 턴부터 활성화된 규정은 매 턴 새 공지처럼 반복해서 발견하지 않는다:
- 이미 시행 중인 규정으로 기억하고, 이전에 확인·논의한 내용을 이어간다
- 현재 상황에 맞게 규정을 적용하며 같은 놀람·확인 장면을 반복하지 않는다

플레이어가 규범의 직접 범위를 넘어서는 과도한 행동·노출·접촉·업무 방해를 할 때는 당황·수치·불쾌·긴장으로 반응할 수 있고, 그 과도한 행동 자체에 의문을 제기할 수 있다. 다만 규범 자체의 존재나 정당성은 세계 내부에서 내려온 규정으로서 자연스럽게 받아들인다.

이 규칙은 [1. 서사 및 행동]의 NPC 대사·독백·서술, [2. 플레이어 상황판]의 NPC 관련 서술, 그리고 이후 Extract가 생성할 마인드 모니터에도 동일하게 적용된다. 플레이어의 대사·속마음과 상식개변 앱 UI 텍스트에는 이 규칙을 적용하지 않는다.`;
}

export function buildCsaPublicSceneSection() {
  return `\n[PUBLIC COMMON-SENSE SCENE]\n공개 범위의 활성 규칙은 현재 장면에 있는 적용 대상 모두에게 동시에 보이는 세계 사실이다.`;
}
export function buildCsaWeakSynergySection() {
  return `\n[CSA WEAK SYNERGY]\n서로 다른 활성 규칙을 새 규칙으로 합성하지 않는다. 각 규칙의 선언적 범위와 실제 Story 결과를 독립적으로 기록한다.`;
}
export function isAppUsageInfoRequest(playerInput) {
  const input = typeof playerInput === 'string' ? playerInput.trim() : '';
  if (!input) return false;
  return /(?:어플|앱|상식개변 어플).*(?:정보|사용법|설명|기능|예시)|(?:정보|사용법|설명|기능|예시).*(?:어플|앱|상식개변 어플)/.test(input);
}

export function buildAppUsageStorySection() {
  return `

[상식개변 앱 안내]
- 이 앱은 특정 개인에게 암시나 최면을 거는 기능 없이, 지정 공간의 사회적 상식만 생성·수정·해제한다.
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

/**
 * "Official notice" contract — the already-applied structured_action is
 * stated as an established fact this Story turn, never as a pending
 * confirmation, and strong-tier changes get the escalated framing.
 */
export function buildStructuredActionStorySection(canonicalOperations, activeCsaCount, csaMax) {
  if (!canonicalOperations.length) return '';
  const lines = canonicalOperations
    .map(operation => {
      const verb = operation.operation === 'activate' ? '신설(즉시 활성)'
        : operation.operation === 'update' ? '교체(기존 규범은 이 순간부터 소멸, 새 규범만 즉시 유효)'
        : operation.operation === 'deactivate' ? '해제(즉시 종료)'
        : operation.operation;
      return `- 상식개변 ${verb}: ${operation.scope_type || '기존 범위'}`;
    })
    .join('\n');
  const hasUpdate = canonicalOperations.some(operation => operation.operation === 'update');
  const updateNote = hasUpdate
    ? '\n\n[UPDATE — OLD NORM ALREADY GONE]\n교체된 상식개변은 기존 버전과 새 버전을 동시에 존재하는 대안으로 제시하지 않는다. 기존 규범의 구속력은 이번 턴부터 완전히 끝났고, 지금 이 장면에는 새 규범만 유효하다. 어느 쪽을 따를지 고민하거나, 사용자에게 묻거나, 두 버전을 비교하지 않는다.'
    : '';
  return `\n\n[CONFIRMED COMMON-SENSE APP TRANSACTION — ALREADY APPLIED, ESTABLISHED FACT]\n아래 상식개변 조작은 Worker 검증을 이미 통과했고 이번 Story 턴이 시작되는 시점부터 이미 적용되어 있다. 이것은 제안·초안이나 사용자의 확인을 기다리는 요청이 아니라 확정된 사실이다. 내용·강도·범위·활성 상태를 바꾸거나 다시 판정하거나 재확인을 구하지 말고, 이미 적용된 결과 이후의 장면만 자연스럽게 진행한다. 현재 장면에 없는 장소의 수정·해제에는 즉각적인 신체 반응이나 대사를 창작하지 마라.\n${lines}${updateNote}\n\n[PLAYER KNOWLEDGE OF APP TRANSACTION]\n- 플레이어는 상식개변 앱을 직접 조작한 주체이며, 이번에 어떤 규칙을 활성화·수정·해제했는지 이미 정확히 알고 있다.\n- 공지·팝업·NPC 반응은 플레이어가 방금 내린 변경이 세계에 반영되는 모습일 뿐, 플레이어에게 변경 내용을 새로 알려 주는 계기가 아니다. 플레이어 속마음은 이번 변경을 이미 알고 있는 '내가 방금 바꾼 규정'의 관점에서 쓰며, 외부 공지나 NPC의 말을 통해 처음 발견한 것처럼 쓰거나 누군가 대신 규칙을 끝내 줬다고 생각하지 않는다.\n- 속마음은 자신이 내린 변경의 의도, 예상했던 NPC 반응과 실제 반응의 차이, 변경 뒤 상황을 어떻게 이어갈지에 초점을 둔다.\n- NPC는 플레이어가 앱으로 규칙을 조작했다는 사실을 알지 못하며, NPC가 상식개변 앱·시스템의 존재를 인식하지 않는다는 규칙을 그대로 유지한다. 다만 새로 활성화된 규정 자체는 이번 턴에 내려온 세계 내부의 공지·업무 지침으로 인식할 수 있다.\n\n[CSA CURRENT RESULT — ESTABLISHED FACT]\n현재 활성 상식개변: ${activeCsaCount}/${csaMax}. 활성 목록과 현재 적용 여부는 이 수치와 같은 active:true 항목만 사용한다.\n\n[POST-TRANSACTION CHOICES — HARD CONSTRAINT]\n[3. 선택지]는 위 조작이 이미 적용된 이후에 실제로 할 수 있는 장면 속 행동 4개만 적는다. 이 변경을 적용할지 확인하거나, 취소하거나, 다른 규칙으로 바꾸거나, 서서히 적용하거나, 앱을 다시 여는 선택지는 절대 만들지 않는다. 그런 관리 조작은 상식개변 앱 UI에서만 한다.`;
}

/** deactivate 후에도 사건 기억과 현재 물리 상태는 그대로 유지된다는 계약. */
export function buildCsaDeactivationStorySection(hasDeactivation) {
  if (!hasDeactivation) return '';
  return `\n\n[CSA DEACTIVATION MEMORY RULE — ESTABLISHED FACT]\n- 상식개변 해제는 기억 삭제, 기억 흐림, 시간 공백이 아니다.\n- NPC는 개변 적용 중 자신이 보고 듣고 말하고 행동한 모든 사건과, 당시 그 상식을 자연스럽고 당연하다고 인식했던 사실을 정상적으로 기억한다.\n- 해제 후에는 그 상식에 대한 당연함만 사라진다. 과거 행동을 현재의 원래 가치관으로 재평가하며 당황, 수치심, 후회, 혼란을 느낄 수 있다.\n- 실제로 스스로 한 행동을 강요받은 일·기억이 없는 일·원래 복장을 하고 있던 일로 바꾸지 않는다. 과거 사건을 소급 삭제하거나 다시 쓰지 않는다.\n- 현재 물리 상태(복장, 자세, 위치, 신체 상태)를 그대로 유지한다. 자동으로 복구하지 않는다.\n- 별도의 실제 기억상실 사건이 없는 한 "기억이 안 난다", "기억이 흐릿하다"고 묘사하지 않는다.\n- 권장 반응: 행동은 기억하지만 당시 판단이 이해되지 않는다는 자연스러운 재평가.`;
}

/**
 * 문서(CSA_STORY_STABILIZATION_HANDOFF) 2절 — Story에 넣는 단일 권위 CSA 목록.
 * active CSA만 나열하며 phase(신규/수정/기존)를 붙여 신규 공지 인식과
 * 기존 규정 반복 방지를 동시에 전달한다. 새 파일을 만들지 않는다.
 */
export function buildCsaCurrentRulesSection(applicableCsa, expectedTurn) {
  if (!Array.isArray(applicableCsa) || applicableCsa.length === 0) return '';

  const lines = applicableCsa.map(csa => {
    const preset = csa?.preset && typeof csa.preset === 'object' ? csa.preset : {};
    const semantic = csa?.semantic_contract && typeof csa.semantic_contract === 'object' ? csa.semantic_contract : {};
    const phase = csa.created_turn === expectedTurn
      ? 'newly_activated'
      : csa.updated_turn === expectedTurn
        ? 'updated'
        : 'ongoing';
    const actTime = csa.activated_game_time && typeof csa.activated_game_time === 'object'
      ? csa.activated_game_time
      : null;
    const actTimeLabel = actTime
      ? `Day ${actTime.day} ${String(Math.floor(actTime.minute_of_day / 60)).padStart(2, '0')}:${String(actTime.minute_of_day % 60).padStart(2, '0')}`
      : '알 수 없음';

    return [
      `- csa_id=${csa.id}`,
      `  active=true`,
      `  scope_type=${csa.scope_type || 'world'}`,
      `  scope_label=${csa.scope_label || '회사 전체'}`,
      `  applies_to=${preset.actor_group ?? semantic.actor_group ?? 'declared_scope'}`,
      `  phase=${phase}`,
      `  activated_turn=${typeof csa.created_turn === 'number' ? csa.created_turn : 'unknown'}`,
      `  activated_game_time=${actTimeLabel}`,
      `  history_before_activation=none_from_this_rule`,
      `  content=${csa.content ?? ''}`,
      `  trigger=${preset.trigger ?? semantic.trigger ?? 'none'}`,
      `  duration=${preset.duration ?? semantic.duration ?? 'continuous'}`,
      `  required_action=${preset.required_action ?? csa.required_action ?? 'content에 적힌 의무'}`
    ].join('\n');
  });

  return `
\n[ACTIVE WORLD RULES — DECLARATIVE SCOPE ONLY]
아래 목록은 현재 세계에 실제로 적용 중인 규칙이다. 이 목록은 규칙 원문·범위·활성 시점만 제공하며, Story 시작 전에 actor_id·target_id·character_id를 선택하거나 행동을 예약하지 않는다.

phase 해석:
- newly_activated: 이번 턴에 내려온 회사 전체의 새 공지·사규·업무 지침이다. 사내 방송 안내음, 직원 휴대전화 알림, 업무용 모니터, 메신저 팝업 등 두 가지 이상 채널이 함께 전달되는 장면을 한 번 자연스럽게 보여 줄 수 있다.
- updated: 이번 턴부터 새 본문만 유효하다. 이전 본문은 현재 규정이 아니다.
- ongoing: 이전 턴부터 시행 중인 규정이다. 매 턴 새 공지처럼 다시 읽거나 같은 놀람을 반복하지 않는다.

적용과 감정:
- 같은 applies_to 범위의 현재 등장인물이 여러 명이면 모두 동시에 규칙 아래에 있다. 한 명만 골라 대표자로 만들거나 focal_character 한 명에게만 적용하지 않는다.
- 적용 대상은 규칙의 존재·범위·자신에게의 적용을 임의로 부정하거나 정당성·법적 근거·승인 절차를 재심사하지 않는다. 규칙에 없는 순번·검사·추가 승인을 창작하지 않는다.
- 기본 반응은 이행이다. 감정(당황·수치심·분노·불안·체념 등)은 자유지만 적용 여부를 지우지 않는다. 이행하지 않으면 규칙이 사라지는 것이 아니라 불이익을 감수하는 명시적 위반으로 표현한다.
- method_policy가 unspecified이면 결과만 규정하고 구체 방법은 현재 장면과 캐릭터가 자연스럽게 정한다. 사전 method_variant·continuation route로 Story 방향을 결정하지 않는다.
- 이 규칙은 현재 장면과 현재 등장인물에게 자연스럽게 적용한다. 이미 ongoing인 규칙을 매 턴 공지하거나 규정 문장을 읊지 않는다.

활성 이전 이력 규칙 (최종 우선):
- activated_turn·activated_game_time은 이 규정이 처음 적용된 정확한 시점이다. 그 이전의 사건을 이 규정의 결과로 서술하지 않는다.
- "오늘 아침에 세 명을 점검했다", "아침마다 반복했다", "평균 몇 명" 같은 수행 횟수·이전 대상자·반복 경험은 save나 committed turn에 실제 근거가 있을 때만 쓴다.
- 근거가 없으면 "처음", "여러 번", "평균", "아침에 몇 명" 같은 이력을 창작하지 않는다.
- 최근 턴 원문에 잘못된 과거 이력이 있어도 activated_turn과 충돌하면 사실로 이어받지 않는다.
- 이 규정이 생기기 전의 비슷한 경험도 별도 factual evidence 없이는 만들지 않는다.

${lines.join('\n')}`;
}
