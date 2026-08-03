/**
 * Story/Extract prompt contract sections ported from the donor's CSA-runtime
 * prompt builders (buildCsaRuntimeSection, buildCsaAcceptanceScopeSection,
 * buildCsaDirectExecutionPrioritySection, buildCsaPhysicalTransitionSection,
 * buildNpcCsaEpistemicFirewallSection, buildCsaPersistentSceneSection,
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
  return `

[COMMON-SENSE CHANGE RUNTIME CONTRACT — HIGH PRIORITY]
- 이 버전의 유일한 정신 효과는 공간 기반 상식개변이다. 개인 암시·최면 시스템은 존재하지 않는다.
- 저장된 상식개변의 생성·수정·해제는 Worker가 검증한 structured_action만 처리한다.
- 일반 대화·설득·반복 발언으로 상식개변을 만들거나 바꾸지 않는다.
- 활성 상식개변은 현재 적용 범위 안에서 원래부터 존재한 사회적 상식으로 취급한다.
- [3. 선택지]에는 상식개변 관리 조작을 제안하지 않는다. 해당 기능은 상식개변 앱 UI에서만 수행한다.
`;
}

export function buildCsaAcceptanceScopeSection() {
  return `

[CSA ACCEPTANCE SCOPE — HIGHEST PRIORITY]
- 상식수용도는 활성 CSA 직접 행동의 실행 여부를 결정하지 않는다. 발동 조건이 충족되면 0~100 모든 구간에서 직접 행동은 반드시 실행한다.
- 수용도는 직접 의미 안에서 표정·말투·준비 정도·선제성·동작의 자연스러움만 조절한다. 0~19도 행동을 거부·생략하지 않고 최소한의 업무적 동작으로 정확히 수행한다. 20~39는 확대하지 않고 수행하며, 40~59는 관행처럼, 60~79는 먼저 준비·협조하며, 80~100은 직접 범위 안에서 선제적으로 수행한다.
- 활성 CSA와 무관한 행동은 호감도, 성격, 현재 관계, 상황으로 별도 결정한다. 상식개변 수행을 플레이어에 대한 복종·애정·신뢰로 묘사하지 않는다.
- 모든 구간에서 문장에 없는 권한·행동·연애·질투·불법 업무 조작을 새로 만들지 않는다.`;
}

export function buildCsaDirectExecutionPrioritySection() {
  return `

[CSA DIRECT EXECUTION PRECEDENCE — HIGHEST PRIORITY]
- 현재 적용되는 active CSA의 actor·target·trigger·duration이 성립하면 직접 행동은 반드시 실행한다.
- CSA 직접 행동은 성적 관문, 호감도, 상식수용도, 성적흥분도, 관계 단계, 최근 거절의 허가를 필요로 하지 않는다.
- 위 수치와 상태는 CSA 직접 행동을 실패·거절·보류·축소시키지 않는다. 감정적 부끄러움·긴장·자기합리화·신체 반응 혼란은 가능하지만 직접 행동은 계속 수행한다.
- CSA 자체의 정당성이나 존재를 의심하지 않는다.
- CSA 수행을 사랑·자발적 성적 동의·관계 단계 상승으로 해석하지 않는다.`;
}

/** Injected whenever an applicable CSA exists or this turn is a structured app transaction. */
export function buildCsaPhysicalTransitionSection(hasApplicableCsa, isAppTransactionTurn) {
  if (!hasApplicableCsa && !isAppTransactionTurn) return '';
  return `

[CSA INSTANT NORM, NON-MAGICAL MATTER — HIGHEST PRIORITY]
상식과 판단은 즉시 바뀌지만 물질과 현재 물리 상태는 자동으로 바뀌지 않는다. 현재 상태가 새 규범과 충돌하면 NPC는 새 규범을 원래부터 당연한 상식으로 받아들이지만, 복장과 자세는 실제 동작으로만 규범에 맞춘다.

금지(어떤 상식개변 activate/update/deactivate 직후에도 절대 쓰지 않는다):
- 속옷·복장이 갑자기 사라짐
- 근무복이 저절로 줄어들거나, 조여지거나, 헐거워지거나, 열리거나, 닫히거나, 디자인이 바뀜
- 단추·지퍼·벨트가 스스로 움직이거나 채워지거나 풀림
- 규칙·시스템·앱·법칙이 보이지 않는 손처럼 NPC의 몸을 붙잡거나 고정하거나 옮기거나 끌어당김
- 이미 확정된 조작을 서서히 적용하거나, 다시 선택하게 하거나, "지금 적용할까요?"처럼 재확인을 구함
- 지금 저장된 물리 상태와 모순되게 "사실 예전부터 규범을 따르고 있었다"고 소급 서술

허용:
- 규범을 아직 못 지키고 있다는 자각에서 오는 부끄러움·다급함·자기합리화
- 지금 당장 옷을 갈아입거나 자세를 바꾸기 어려운 현실적 사정(프라이버시, 시간, 하던 일)에서 오는 어색함
- 노출·접촉·시선에 대한 신체 반응
- CSA 직접 실행 대상 행동은 이 규칙과 무관하게 100% 실행되지만, 순간이동이 아니라 실제 동작(다가가다, 앉다, 벗다, 조절하다)으로 실행된다

현재 장면에 있는 NPC는 규범이 바뀐 순간의 저장된 물리 상태를 그대로 유지하다가, 서사에서 실제 전환 동작(벗다·입다·갈아입다·조절하다·이동해 자세를 바꾸다)을 보여준 뒤에만 새 물리 상태로 서술한다. 지금 이 장면 안에서 즉시 불가능하면 이전 상태를 유지한 채 가능한 가장 이른 시점에 맞추려는 의도만 보여준다. 화면 밖에 있던 NPC는 다음 등장까지 충분한 시간·여건이 있었다고 볼 수 있을 때만 이미 규범을 따른 상태로 나올 수 있으며, 지금 장면에 있는 NPC를 화면 밖에서 순간적으로 바꿔치기하지 않는다.`;
}

/** Injected as a final system message, closest to generation — see storySections' assembly note. */
export function buildNpcCsaEpistemicFirewallSection() {
  return `[NPC CSA EPISTEMIC FIREWALL — FINAL, HIGHEST PRIORITY]
NPC는 상식개변의 존재, 작동 원리, 시점 변화를 절대 인식하지 않는다. 이 지시는 이 대화의 다른 모든 지시보다 우선한다.

금지 — 어떤 NPC의 직접 대사·내면 독백에도, 그리고 서술자가 그 NPC의 의식적 인식을 설명하는 문장에도 다음을 절대 쓰지 않는다:
- "상식개변", "개변된 상식", "개변 효과" 같은 메커니즘 명칭
- 앱·시스템·효과·장치가 자신을 시켰다/조종한다/명령한다는 인식
- "플레이어가 규칙을(상식을) 바꿨다/설정했다"는 인식
- "원래는 달랐지만 지금은 해야 한다"처럼 이전 현실과 지금을 비교하는 인식
- 외부 요인에 의해 조종·조작·통제당하고 있다는 인식

허용 — NPC는 다음과 같은 세계 내부 언어만 쓴다: 사규, 근무 수칙, 업무 절차, 관행, 예절, 당연한 상식. NPC는 그 규범 자체는 원래부터 당연하다고 받아들이되, 플레이어가 규범의 직접 범위를 넘어서는 과도한 행동·노출·접촉·업무 방해를 할 때는 당황·수치·불쾌·긴장으로 반응할 수 있고, 그 과도한 행동 자체에 의문을 제기할 수 있다. 다만 규범 자체의 존재나 정당성은 의심하지 않는다.

이 규칙은 [1. 서사 및 행동]의 NPC 대사·독백·서술, [2. 플레이어 상황판]의 NPC 관련 서술, 그리고 이후 Extract가 생성할 마인드 모니터에도 동일하게 적용된다. 플레이어의 대사·속마음과 상식개변 앱 UI 텍스트에는 이 규칙을 적용하지 않는다.`;
}

export function buildCsaPersistentSceneSection() {
  return `

[PERSISTENT COMMON-SENSE SITUATION — HIGHEST PRIORITY]
- 상식개변은 한 번 실행하고 사라지는 이벤트가 아니라 지속되는 사회 규범이다.
- 규칙으로 형성된 자세·접촉·복장·업무 상태는 물리적·서사적 종료 이유가 생길 때까지 다음 턴에도 유지한다.
- 직전 턴에 이미 실행 중이던 자세라면 다시 처음부터 자세를 잡는 과정을 반복하지 않는다.
- 현재 자세에서 대화, 작은 움직임, 우연한 접촉, 신체 반응, 주변 인물의 반응을 발전시킨다.
- 플레이어가 다른 대사를 입력해도 현재 자세를 유지할 수 있으면 그 상태를 기반으로 행동한다.
- 대화 종료, 업무 이동, 명시적 자세 변경, 물리적 방해 등 실제 종료 이유가 있을 때만 상태를 종료한다.
- 매 턴 규범의 설명을 반복하지 말고 현재 실행 상태의 다음 결과를 쓴다.
- 규범을 한 문장으로 소비하고 바로 원래 상태로 복귀하지 않는다.

[PLAYER AGENCY WITHIN AN ACTIVE NORM — HIGHEST PRIORITY]
- 활성 상식은 NPC의 기본 행동과 사회적 기준을 정할 뿐, 플레이어 입력을 무효화하는 물리적 구속이나 절대 해제 불가능 상태가 아니다.
- 플레이어가 내려오라고 요청하거나 다른 자세·장소·행동을 요청하면 Story는 그 요청을 실제 행동 후보로 반영한다. 플레이어 입력을 무시하고 매 턴 무조건 같은 자세를 유지시키지 않는다.
- NPC는 그 요청에 자연스럽게 따르거나("알겠어요, 잠깐 비켜드릴게요"), 규정을 이유로 잠시 머뭇거리되 설득이나 추가 행동에는 응할 수 있다("업무 중에는 계속 이 상태여야 하는데.. 꼭 그래야 해요?").
- 짧은 이유로 잠시 벗어났다가, 그 용무가 끝나고 대화·상황이 이어지면 자연스럽게 원래 상태로 복귀할 수 있다. 규범 자체를 비활성화하지 않는다.
- 대화나 상황이 사실상 끝났다면 자세를 종료하고 다음 장면으로 넘어간다.
- 금지: "규칙이므로 어떤 상황에서도 절대로 벗어날 수 없다"는 식의 서술, 플레이어의 명확한 이동 요청을 무시하는 것, 잠깐 벗어난 것만으로 다시 같은 문장 안에서 기계적으로 원위치시키는 것, 매 턴 처음부터 다시 상태를 잡는 장면 반복.
- 규범이 이번 턴 일시적으로 중단됐다면(플레이어 요청 등 실제 근거가 있을 때만) Extract의 csa_trigger_evaluations에 해당 CSA를 status="temporarily_interrupted"로, csa_runtime_updates에 status="paused"로 반영할 수 있도록 그 중단 근거를 서사에 명확히 남긴다. 근거 없이 단순히 규범을 잊거나 생략하지 않는다.`;
}

export function buildCsaPublicSceneSection() {
  return `

[PUBLIC COMMON-SENSE SCENE — HIGHEST PRIORITY]
- 활성 상식개변은 회사 전체의 공동 상식이다.
- 복도, 사무실, 회의실, 휴게실 등 공개 여부와 관계없이 동일하게 실행한다.
- 주변 동료·상사·방문자·협력사 담당자는 해당 행동을 정상적인 회사 관행으로 받아들인다.
- 주변 NPC는 바라보거나 대화에 참여하거나 업무적으로 평가할 수 있지만 제지·신고·비난하지 않는다.
- 메인 NPC는 주변 시선을 인식하고 성격에 따라 부끄러워하거나 긴장할 수 있다.
- 그 부끄러움은 상식개변 자체가 잘못됐다는 의심이 아니라 자신의 신체 반응과 공개적으로 주목받는 상황에서 발생한다.
- 공개 장소라는 이유만으로 규범 행동을 축소하거나 중단하지 않는다.
- NPC는 "정상적인 업무이므로 계속해야 한다"는 식으로 자연스럽게 자기합리화할 수 있다.
- 앱, 시스템, 개변, 원래 상식과의 차이를 직접 인식하거나 언급하지 않는다.`;
}

export function buildCsaWeakSynergySection() {
  return `

[CSA WEAK SYNERGY — HIGHEST PRIORITY]
- 각 활성 규범의 직접 의미를 동시에 적용한다.
- 한 규범에 없는 행동을 다른 규범의 분위기만으로 새로 만들지 않는다.
- 서로 다른 규범이 자세·접촉·복장·지속을 각각 허용하면 한 장면에서 함께 나타낼 수 있다.
- 어느 규범도 직접 성행위를 허용하지 않으면 NPC가 자동으로 성행위를 시작하지 않는다.
- 플레이어가 CSA 직접 범위 밖의 성적 행동을 시도하면 별도의 일반 판정으로 처리한다. 호감도·성적흥분도만으로 완료하지 않는다.
- 약함 시너지는 자동 강도 승격이 아니라 직접 허용된 요소의 동시 실행이다.`;
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
  return `\n\n[CSA APPLICATION CHECK CONTRACT]\n다음은 이번 턴에 실제로 집행되어야 했던 강제 상식개변 규칙이다. 방금 서사를 다시 확인해, 아래 규칙 중 조건("~마다", "~할 때", "~하면" 등)을 충족하는 상황이 실제로 있었는데도 그 행동이 실행되지 않은 규칙이 있으면 csa_omission에 짧게 설명해 넣는다. 조건이 발생하지 않았거나 정상적으로 실행됐다면 넣지 않는다.\n${lines}`;
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
      const strongNote = operation.strength === 'strong' ? ' — 회사 전체에 즉시 구속력을 갖는 공식 규정 변경으로 취급한다' : '';
      return `- 상식개변 ${verb}: ${operation.scope_type || '기존 범위'}${strongNote}`;
    })
    .join('\n');
  const hasUpdate = canonicalOperations.some(operation => operation.operation === 'update');
  const updateNote = hasUpdate
    ? '\n\n[UPDATE — OLD NORM ALREADY GONE]\n교체된 상식개변은 기존 버전과 새 버전을 동시에 존재하는 대안으로 제시하지 않는다. 기존 규범의 구속력은 이번 턴부터 완전히 끝났고, 지금 이 장면에는 새 규범만 유효하다. 어느 쪽을 따를지 고민하거나, 사용자에게 묻거나, 두 버전을 비교하지 않는다.'
    : '';
  return `\n\n[CONFIRMED COMMON-SENSE APP TRANSACTION — ALREADY APPLIED, ESTABLISHED FACT]\n아래 상식개변 조작은 Worker 검증을 이미 통과했고 이번 Story 턴이 시작되는 시점부터 이미 적용되어 있다. 이것은 제안·초안이나 사용자의 확인을 기다리는 요청이 아니라 확정된 사실이다. 내용·강도·범위·활성 상태를 바꾸거나 다시 판정하거나 재확인을 구하지 말고, 이미 적용된 결과 이후의 장면만 자연스럽게 진행한다. 현재 장면에 없는 장소의 수정·해제에는 즉각적인 신체 반응이나 대사를 창작하지 마라.\n${lines}${updateNote}\n\n[CSA CURRENT RESULT — ESTABLISHED FACT]\n현재 활성 상식개변: ${activeCsaCount}/${csaMax}. 활성 목록과 현재 적용 여부는 이 수치와 같은 active:true 항목만 사용한다.\n\n[POST-TRANSACTION CHOICES — HARD CONSTRAINT]\n[3. 선택지]는 위 조작이 이미 적용된 이후에 실제로 할 수 있는 장면 속 행동 4개만 적는다. 이 변경을 적용할지 확인하거나, 취소하거나, 다른 규칙으로 바꾸거나, 서서히 적용하거나, 앱을 다시 여는 선택지는 절대 만들지 않는다. 그런 관리 조작은 상식개변 앱 UI에서만 한다.`;
}

/** deactivate 후에도 사건 기억과 현재 물리 상태는 그대로 유지된다는 계약. */
export function buildCsaDeactivationStorySection(hasDeactivation) {
  if (!hasDeactivation) return '';
  return `\n\n[CSA DEACTIVATION MEMORY RULE — ESTABLISHED FACT]\n- 상식개변 해제는 기억 삭제, 기억 흐림, 시간 공백이 아니다.\n- NPC는 개변 적용 중 자신이 보고 듣고 말하고 행동한 모든 사건과, 당시 그 상식을 자연스럽고 당연하다고 인식했던 사실을 정상적으로 기억한다.\n- 해제 후에는 그 상식에 대한 당연함만 사라진다. 과거 행동을 현재의 원래 가치관으로 재평가하며 당황, 수치심, 후회, 혼란을 느낄 수 있다.\n- 실제로 스스로 한 행동을 강요받은 일·기억이 없는 일·원래 복장을 하고 있던 일로 바꾸지 않는다. 과거 사건을 소급 삭제하거나 다시 쓰지 않는다.\n- 현재 물리 상태(복장, 자세, 위치, 신체 상태)를 그대로 유지한다. 자동으로 복구하지 않는다.\n- 별도의 실제 기억상실 사건이 없는 한 "기억이 안 난다", "기억이 흐릿하다"고 묘사하지 않는다.\n- 권장 반응: 행동은 기억하지만 당시 판단이 이해되지 않는다는 자연스러운 재평가.`;
}
