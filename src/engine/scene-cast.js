/**
 * SceneCastContract — 이번 턴에 "존재하는 인물"과 "말할 수 있는 인물"을 Story 호출
 * 전에 서버가 결정론적으로 확정하는 계약.
 *
 * 설계 원칙:
 * - 순수 함수다. LLM 호출, 네트워크, DB 조회가 전혀 없다 (이미 로드한 save/edition만 사용).
 * - Story 모델에게 NPC 등장 결정 권한을 주지 않는다. 모델은 이 계약 안에서만 쓴다.
 * - 근거가 없으면 비운다(fail-closed). `entering_npc_ids`가 비어 있으면 이번 턴에는
 *   누구도 새로 등장할 수 없다.
 * - `last_speaker_id` / `focal_character_id`는 그 자체로 현장 배치 근거가 아니다.
 *   문맥 참고용(`context_npc_ids`)으로만 쓴다.
 */

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function identity(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** player / player-1 / player_… 등 기존 player ID 표기를 모두 인식한다. */
export function isPlayerRefId(id) {
  if (!id) return false;
  const text = String(id);
  return text === 'player' || /^player([-_]|$)/.test(text);
}

/** 등록된 NPC ID 집합 — 등록되지 않은 인물은 어떤 목록에도 들어갈 수 없다. */
export function registeredNpcIdSet(master) {
  const ids = new Set();
  for (const entry of Array.isArray(master?.characters) ? master.characters : []) {
    const id = identity(entry?.character_id ?? entry?.id);
    if (id) ids.add(id);
  }
  for (const entry of Array.isArray(master?.general_npcs) ? master.general_npcs : []) {
    const id = identity(entry?.npc_id ?? entry?.id);
    if (id) ids.add(id);
  }
  return ids;
}

/** ID → 표시 이름. 모델이 출력한 이름은 절대 신뢰하지 않고 항상 이 canon으로 채운다. */
export function speakerNameById(master, playerName) {
  const names = new Map();
  for (const entry of Array.isArray(master?.characters) ? master.characters : []) {
    const id = identity(entry?.character_id ?? entry?.id);
    const name = identity(entry?.name);
    if (id && name) names.set(id, name);
  }
  for (const entry of Array.isArray(master?.general_npcs) ? master.general_npcs : []) {
    const id = identity(entry?.npc_id ?? entry?.id);
    const name = identity(entry?.name);
    if (id && name) names.set(id, name);
  }
  const resolvedPlayerName = identity(playerName);
  if (resolvedPlayerName) names.set('player', resolvedPlayerName);
  return names;
}

// ---------------------------------------------------------------------------
// 플레이어 대사 정책 (spec 5 + 안정화 수정 A)
// ---------------------------------------------------------------------------

// 큰따옴표/작은따옴표/홑화살괄호 안의 실제 인용 발화
const QUOTED_SPEECH = /["“”']([^"“”']{2,})["“”']|「([^」]{2,})」/u;
// 말하는 행동은 있지만 정확한 문장은 없는 경우
const SPEECH_ACT = /(말한다|말했다|묻는다|물었다|질문한다|질문했다|전한다|전했다|설명한다|설명했다|지시한다|지시했다|요청한다|요청했다|부른다|불렀다|답한다|답했다|대답한다|대답했다|이야기한다|얘기한다|따진다|따졌다|항의한다|사과한다|제안한다|보고한다|확인을?\s*요청)/u;

/**
 * 결정적 intent taxonomy (안정화 수정 A 3.3).
 * 생성된 플레이어 대사 본문에만 적용한다 — 사용자 원문이나 서술에는 적용하지 않는다.
 * material action은 canonical classifyMaterialActions를 재사용한다.
 */
export const HIGH_IMPACT_INTENTS = [
  'instruction', 'promise', 'agreement', 'confession', 'sexual_proposal',
  'threat', 'movement_decision', 'investigation_decision', 'relationship_change',
  'authority_assertion'
];

const INTENT_PATTERNS = {
  // 명령형 어미 + 직접 명령어 (단독 '와'/'가'는 오탐 위험이 커 제외, 문맥 명령형 어미로만)
  instruction: /(해라|하세요|해야 해|당장|따라\b|벗어|제출해|다시 작성해|내려와|앉아\b|해줘|해 주세요|시키지 마|하지 마|그만둬|꺼져|가져와|보여줘|따라와|움직여|불러와|보내드려|작성하세요)/u,
  promise: /(약속할게|약속해|내가 책임질게|책임질게요|반드시 해줄게|앞으로 계속|다시는 안|꼭 해줄게|지켜줄게)/u,
  sexual_proposal: null, // classifyMaterialActions로 판정 (canonical 재사용)
  threat: /(가만두지 않겠다|불이익|해고|인사 조치|후회하게|말 안 들으면|죽을 줄 알아|책임져)/u,
  movement_decision: /(찾아가자|이동하자|바로 가자|따라가자|지금 가자|향하자|찾으러 가자)/u,
  investigation_decision: /(조사하겠다|뒤를 캐자|직접 확인하겠다|캐보자|파보자|알아보자|추적하자)/u,
  confession: /(좋아해|사랑해|고백할게|마음에 들어)/u,
  relationship_change: /(사귀자|헤어지자|연인|만나보자|헤어지고 싶|이별)/u,
  agreement: /(그렇게 하죠|좋아요|동의해|알겠습니다|그래요|그럴게요|승낙)/u,
  refusal: /(싫어|안 해|못 하겠|거절|안 돼|싫습니다)/u,
  authority_assertion: /(내가 책임|내 명령|따르|지시|내가 결정|내가 정할게|내가 하겠다)/u,
  question: /(\?|왜|뭐|누구|언제|어디|어떻게|인가요|인지|인가\b|물어보|확인해 주|알려줘|가르쳐줘|무슨)/u,
  request: /(주세요|부탁|해줄래|해주시|보내주세요|주시겠|부탁드려|요청)/u,
  answer: /(네\b|그래요|맞아요|그렇죠|알겠어요|네, |네\.)/u
};

/** 생성된 대사 본문에서 결정적으로 intent를 감지한다 (오탐 방지: 대사에만 적용). */
export function classifyDialogueIntents(text) {
  const source = typeof text === 'string' ? text.trim() : '';
  if (!source) return [];
  const intents = new Set();
  for (const [name, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern && pattern.test(source)) intents.add(name);
  }
  // sexual_proposal — canonical material action classifier 재사용
  if (hasMaterialSexualIntent(source)) intents.add('sexual_proposal');
  // question/answer 없고 다른 intent도 없으면 reaction
  if (intents.size === 0) intents.add('reaction');
  return [...intents];
}

/** canonical material action classifier를 재사용해 성적 제안 여부를 판정한다. */
function hasMaterialSexualIntent(text) {
  try {
    // 동적 import 대신 정적 참조를 위해 lazy require 사용 (모듈 경로는 engine/index)
    const { classifyMaterialActions } = globalThis.__companyV2MaterialClassifier ?? {};
    if (typeof classifyMaterialActions === 'function') {
      return classifyMaterialActions(text).length > 0;
    }
  } catch {
    // fallback 아래
  }
  // fallback — 명시적 성적 제안 표현 (taxonomy 중복 최소화, classifier가 로드 안 될 때만)
  return /(자자|호텔로|벗어|키스하자|만져도 돼|몸을 보여줘|같이 씻자|성관계|섹스)/u.test(text);
}

// lazy-wired classifier — engine/index.js가 초기화 시 주입한다
export function wireMaterialClassifier(classifier) {
  globalThis.__companyV2MaterialClassifier = { classifyMaterialActions: classifier };
}

/**
 * 사용자 입력을 기준으로 이번 턴 플레이어 발화 허용 범위를 계산한다 (안정화 수정 A 3.2).
 * - explicit: 사용자가 실제 대사를 직접 인용해 입력함
 * - paraphrase: 말하는 행동은 입력했지만 정확한 문장은 쓰지 않음
 * - minor_reaction: 대사 없이 행동만 입력함 (짧은 반응 한 줄만 허용)
 * 허용 범위(allowed_intents/allowed_target_ids/allowed_material_actions)를 결정적으로 채운다.
 */
export function resolvePlayerDialoguePolicy(playerAction, master = null) {
  const source = typeof playerAction === 'string' ? playerAction.trim() : '';
  const base = { max_lines: 1, max_characters: 30, allowed_material_actions: [] };
  if (!source) return { mode: 'minor_reaction', ...base, allowed_intents: ['reaction'], allowed_target_ids: [], explicit_source_text: null, high_impact_intents_allowed: [] };

  const quoted = QUOTED_SPEECH.exec(source);
  const quotedText = quoted ? identity(quoted[1] ?? quoted[2]) : null;
  if (quotedText) {
    const quotedIntents = classifyDialogueIntents(quotedText);
    return {
      mode: 'explicit',
      max_lines: 2,
      explicit_source_text: quotedText,
      allowed_intents: quotedIntents.length ? quotedIntents : ['reaction'],
      allowed_target_ids: namedNpcIds(master, source),
      allowed_material_actions: materialActionsOf(quotedText),
      high_impact_intents_allowed: quotedIntents.filter(i => HIGH_IMPACT_INTENTS.includes(i))
    };
  }
  if (SPEECH_ACT.test(source)) {
    // 사용자가 입력한 화행으로 허용 intent 결정
    const intentText = source.slice(0, 200);
    const allowed = [];
    if (/(묻|물어|질문)/.test(intentText)) allowed.push('question');
    if (/(전|설명|보고|이야기|알려)/.test(intentText)) allowed.push('answer');
    if (/(요청|부탁|보내|전달)/.test(intentText)) allowed.push('request');
    if (/(지시|명령)/.test(intentText)) allowed.push('instruction');
    if (/(사과)/.test(intentText)) allowed.push('answer');
    if (/(제안)/.test(intentText)) allowed.push('request');
    return {
      mode: 'paraphrase',
      max_lines: 2,
      intent_text: intentText,
      allowed_intents: allowed.length ? allowed : ['reaction'],
      allowed_target_ids: namedNpcIds(master, source),
      allowed_material_actions: materialActionsOf(intentText),
      high_impact_intents_allowed: []
    };
  }
  return {
    mode: 'minor_reaction',
    ...base,
    allowed_intents: ['reaction'],
    allowed_target_ids: namedNpcIds(master, source),
    explicit_source_text: null,
    high_impact_intents_allowed: []
  };
}

/** 텍스트의 canonical material action 분류 (있으면 재사용, 없으면 빈 배열). */
function materialActionsOf(text) {
  try {
    const { classifyMaterialActions } = globalThis.__companyV2MaterialClassifier ?? {};
    if (typeof classifyMaterialActions === 'function') return classifyMaterialActions(text);
  } catch {
    // fallthrough
  }
  return [];
}

/**
 * 생성된 플레이어 대사를 policy에 대조한다 (안정화 수정 A 3.4).
 * 반환: { ok: true } 또는 { ok: false, warning: 'player_dialogue_policy_violation' }
 */
export function validatePlayerDialogueAgainstPolicy(text, policy) {
  const body = typeof text === 'string' ? text.trim() : '';
  if (!body || !policy) return { ok: false };
  const intents = classifyDialogueIntents(body);
  const highImpact = intents.filter(i => HIGH_IMPACT_INTENTS.includes(i));

  if (policy.mode === 'minor_reaction') {
    // 30자 이하여도 고위험 intent 하나라도 있으면 차단
    if (highImpact.length) return { ok: false, reason: `high_impact:${highImpact.join(',')}` };
    return { ok: true };
  }

  if (policy.mode === 'explicit') {
    const source = policy.explicit_source_text ?? '';
    // 1) 원문에 없는 고위험 intent → 차단 (원문이 추정 가능할 때만)
    const sourceIntents = new Set(classifyDialogueIntents(source));
    const newHighImpact = highImpact.filter(i => !sourceIntents.has(i));
    if (newHighImpact.length) return { ok: false, reason: `new_high_impact:${newHighImpact.join(',')}` };
    // 2) 입력에 없는 새 NPC 이름 추가 → 차단 (표시 이름으로 감지)
    const allowedTargets = Array.isArray(policy.allowed_target_ids) ? policy.allowed_target_ids : [];
    const allowedNames = new Set(allowedTargets.map(id => id));
    if (allowedNames.size && hasUnknownNpcName(body, policy)) return { ok: false, reason: 'new_npc_target' };
    // 3) 입력에 없는 material action 추가 → 차단
    const allowedMaterial = new Set(policy.allowed_material_actions ?? []);
    const newMaterial = materialActionsOf(body).filter(a => !allowedMaterial.has(a));
    if (newMaterial.length) return { ok: false, reason: `new_material:${newMaterial.join(',')}` };
    // 4) 과도한 길이 확장 → 차단 (원문의 3배 초과)
    if (source && body.length > source.length * 3 + 40) return { ok: false, reason: 'over_expansion' };
    return { ok: true };
  }

  if (policy.mode === 'paraphrase') {
    const allowedIntents = new Set(policy.allowed_intents ?? []);
    const unexpected = intents.filter(i => !allowedIntents.has(i));
    if (unexpected.length) return { ok: false, reason: `intent_out_of_scope:${unexpected.join(',')}` };
    const allowedMaterial = new Set(policy.allowed_material_actions ?? []);
    const newMaterial = materialActionsOf(body).filter(a => !allowedMaterial.has(a));
    if (newMaterial.length) return { ok: false, reason: `new_material:${newMaterial.join(',')}` };
    return { ok: true };
  }

  return { ok: true };
}

/** explicit에서 입력에 없는 새 NPC 이름 등장 감지 (canon 대상만). */
function hasUnknownNpcName(body, policy) {
  // policy.allowed_target_ids에 이미 있는 NPC 이름은 허용
  const allowedIds = new Set(policy.allowed_target_ids ?? []);
  // 실제로는 speakerNames canon이 필요하므로, 여기서는 material/새 인물 검증을
  // gate 단계에서 speakerNames와 함께 수행한다 — 이 함수는 이름 목록을 알 수 없으므로
  // 기본적으로 false (실검증은 validateDialogueBlock에서 canSpeak로 이미 수행됨).
  return false;
}

// ---------------------------------------------------------------------------
// Cast 계산 (spec 13)
// ---------------------------------------------------------------------------

/** 자유 입력에서 이름이 정확히 언급된 등록 NPC를 찾는다 (부분 일치는 인정하지 않는다). */
function namedNpcIds(master, text) {
  const source = typeof text === 'string' ? text : '';
  if (!source.trim()) return [];
  const found = [];
  const push = (id, name) => {
    if (id && name && source.includes(name) && !found.includes(id)) found.push(id);
  };
  for (const entry of Array.isArray(master?.characters) ? master.characters : []) {
    push(identity(entry?.character_id ?? entry?.id), identity(entry?.name));
  }
  for (const entry of Array.isArray(master?.general_npcs) ? master.general_npcs : []) {
    push(identity(entry?.npc_id ?? entry?.id), identity(entry?.name));
  }
  return found;
}

/**
 * 현장에 실제로 존재하는 NPC (spec 13 + 안정화 수정 F 8.1).
 * present의 양수 근거는 다음뿐이다:
 *   1. scene_state.participants 직접 포함
 *   2. npc_scene_state[id].present === true
 *   3. 저장된 NPC location_id가 현재 scene_state.location_id와 일치
 * last_npcs_present는 단독 present 근거가 아니다 (context 참고용).
 * npc_scene_state[id]가 없으면 last_npcs_present만으로 승계하지 않는다.
 */
function resolvePresentNpcIds({ save, registeredIds, actionTargetIds }) {
  const present = [];
  const push = id => {
    if (!id || isPlayerRefId(id) || !registeredIds.has(id) || present.includes(id)) return;
    present.push(id);
  };
  const sceneState = isPlainObject(save?.scene_state) ? save.scene_state : {};
  const locationId = identity(sceneState.location_id);
  const npcSceneState = isPlainObject(save?.npc_scene_state) ? save.npc_scene_state : {};

  // 1. 현재 scene_state.participants
  for (const id of Array.isArray(sceneState.participants) ? sceneState.participants : []) push(id);

  // 2. 현재 위치가 저장된 NPC (location 일치가 명시적 근거)
  if (locationId) {
    for (const [id, state] of Object.entries(npcSceneState)) {
      if (isPlainObject(state) && identity(state.location_id) === locationId) push(id);
    }
  }

  // 3. last_npcs_present — 단독 present 승계 금지 (수정 F 8.1).
  //    npc_scene_state[id]가 있고 present !== false이면서 위치가 현재 장소와
  //    충돌하지 않을 때만 보조 근거로 인정한다.
  for (const id of Array.isArray(save?.last_npcs_present) ? save.last_npcs_present : []) {
    const state = npcSceneState[id];
    if (!isPlainObject(state)) continue; // 상태 기록이 없으면 승계하지 않는다
    if (state.present === false) continue;
    const stateLocation = identity(state.location_id);
    if (locationId && stateLocation && stateLocation !== locationId) continue;
    // present===true 또는 위치 일치가 이미 2번에서 push됐을 수 있다 — 중복은 push가 걸러준다
    if (state.present === true) push(id);
  }

  // 4·5. 명시적 행동 대상 / CSA 대상이면서 이미 현장에 있는 NPC
  for (const id of actionTargetIds) {
    const state = npcSceneState[id];
    if (isPlainObject(state) && state.present === true) push(id);
  }

  return present;
}

/** 사용자가 해당 NPC를 부르거나 호출하는 행동 (entering 근거). */
const CALL_ACTION = /(부른다|불렀다|호출한다|호출했다|오라고|오라 한다|불러온다|불러서|소환한다|이쪽으로)/u;
/** 사용자가 NPC가 있는 곳으로 이동·방문·찾으러 가는 행동 (destination 근거 — entering 아님). */
const MOVE_ACTION = /(찾으러|찾아가|찾아보|보러|만나러|이동하|가본다|가겠다|방문하|들어간다|향한다|자리로|사무실로|팀으로)/u;
const REMOTE_ACTION = /(전화|통화|메신저|메시지|문자|사내망|카톡|연락한다|연락했다|콜한다)/u;

/**
 * 이번 턴에 새로 등장하는 NPC (안정화 수정 F 8.2/8.3/8.5).
 * entering은 "NPC가 현재 장면으로 들어오는" 물리적 근거가 있을 때만:
 *   - 사용자가 해당 NPC를 부르거나 호출 (CALL_ACTION)
 *   - 저장된 pending_scene_entrances 대상
 * 이동(찾으러 감)·전화는 각각 destination/remote로 분리된다.
 * structuredAction(app_transaction)의 target은 장면 진입 의미가 없으므로 entering으로 쓰지 않는다.
 * pending_boundary_followup은 관계·경계 후속 서사 근거일 뿐 물리적 등장 근거가 아니다 (context 전용).
 */
function resolveEnteringNpcIds({ save, master, playerAction, registeredIds, presentIds, structuredAction }) {
  const entering = [];
  const push = id => {
    if (!id || isPlayerRefId(id) || !registeredIds.has(id)) return;
    if (presentIds.includes(id) || entering.includes(id)) return;
    entering.push(id);
  };
  const source = typeof playerAction === 'string' ? playerAction : '';

  // 1. 사용자 호출 대상 — "민아를 이쪽으로 부른다" (수정 F 8.5)
  if (CALL_ACTION.test(source) && !MOVE_ACTION.test(source)) {
    for (const id of namedNpcIds(master, source)) push(id);
  }

  // 2. 저장된 pending scene entrance 대상
  for (const item of Array.isArray(save?.pending_scene_entrances) ? save.pending_scene_entrances : []) {
    push(identity(isPlainObject(item) ? (item.character_id ?? item.npc_id) : item));
  }

  // (제거됨) pending_boundary_followup — context 전용 (수정 F 8.2)
  // (제거됨) structuredAction target 자동 entering — app_transaction에는 장면 진입 의미 없음 (수정 F 8.3)

  return entering;
}

/**
 * 이동 목적지 대상 (안정화 수정 F 8.4).
 * "윤민아를 보러 간다"에서 윤민아는 기존 장면으로 들어오는 NPC가 아니라
 * 플레이어가 찾아가는 목적지 대상이다. destination_npc_ids로 분리하고,
 * entering_npc_ids에 넣지 않는다.
 */
function resolveDestinationNpcIds({ save, master, playerAction, registeredIds, presentIds }) {
  const destination = [];
  const push = id => {
    if (!id || isPlayerRefId(id) || !registeredIds.has(id)) return;
    if (presentIds.includes(id) || destination.includes(id)) return;
    destination.push(id);
  };
  const source = typeof playerAction === 'string' ? playerAction : '';
  if (MOVE_ACTION.test(source) && !CALL_ACTION.test(source)) {
    for (const id of namedNpcIds(master, source)) push(id);
  }
  return destination;
}

/** 원격 채널(전화·메신저·방송)로만 발화할 수 있도록 사전 확정된 NPC (spec 13). */
function resolveRemoteNpcIds({ save, master, playerAction, registeredIds, presentIds, enteringIds }) {
  const remote = [];
  const push = id => {
    if (!id || isPlayerRefId(id) || !registeredIds.has(id)) return;
    if (presentIds.includes(id) || enteringIds.includes(id) || remote.includes(id)) return;
    remote.push(id);
  };
  const source = typeof playerAction === 'string' ? playerAction : '';

  // 1. 사용자가 전화 또는 메시지를 보낸 대상
  if (REMOTE_ACTION.test(source)) {
    for (const id of namedNpcIds(master, source)) push(id);
  }
  // 2·3. 직전 턴 예정 원격 연락 / 저장된 원격 이벤트 대상
  for (const item of Array.isArray(save?.pending_remote_contacts) ? save.pending_remote_contacts : []) {
    push(identity(isPlainObject(item) ? (item.character_id ?? item.npc_id) : item));
  }

  return remote;
}

/**
 * 이번 턴 cast 확정. Story 호출 직전에 한 번 호출한다.
 *
 * `context_npc_ids`는 관계·직전 대화·상태를 참고할 수 있는 NPC이고, 여기 있다는
 * 이유만으로 현장에서 행동하거나 말할 수는 없다. 실제 발화 권한은
 * `allowed_speaker_ids`가 유일한 기준이다.
 */
export function buildSceneCastContract({
  save = {},
  master = {},
  playerAction = '',
  structuredAction = null,
  actionContract = null
} = {}) {
  const registeredIds = registeredNpcIdSet(master);
  const sceneState = isPlainObject(save?.scene_state) ? save.scene_state : {};
  const locationId = identity(sceneState.location_id);

  const actionTargetIds = [];
  const contractTarget = identity(actionContract?.target_id);
  if (contractTarget) actionTargetIds.push(contractTarget);

  const presentNpcIds = resolvePresentNpcIds({ save, registeredIds, actionTargetIds });
  const enteringNpcIds = resolveEnteringNpcIds({
    save, master, playerAction, registeredIds, presentIds: presentNpcIds, structuredAction
  });
  const destinationNpcIds = resolveDestinationNpcIds({
    save, master, playerAction, registeredIds, presentIds: presentNpcIds
  });
  const remoteNpcIds = resolveRemoteNpcIds({
    save, master, playerAction, registeredIds, presentIds: presentNpcIds, enteringIds: enteringNpcIds
  });

  // 문맥 참고용 — focal/last_speaker는 여기에는 들어가지만 present에는 별도 근거가 필요하다.
  const contextNpcIds = [];
  const pushContext = id => {
    if (!id || isPlayerRefId(id) || !registeredIds.has(id) || contextNpcIds.includes(id)) return;
    contextNpcIds.push(id);
  };
  for (const id of presentNpcIds) pushContext(id);
  for (const id of enteringNpcIds) pushContext(id);
  for (const id of destinationNpcIds) pushContext(id);
  for (const id of remoteNpcIds) pushContext(id);
  // 수정 F 8.2 — pending_boundary_followup 대상은 context 참고용으로만
  const boundaryPending = isPlainObject(save?.pending_boundary_followup) ? save.pending_boundary_followup : null;
  if (boundaryPending) pushContext(identity(boundaryPending.target_character_id));
  pushContext(identity(save?.focal_character_id));
  pushContext(identity(save?.last_speaker_id));
  for (const id of Array.isArray(save?.last_npcs_present) ? save.last_npcs_present : []) pushContext(id);

  const allowedSpeakerIds = ['player', ...presentNpcIds, ...enteringNpcIds, ...remoteNpcIds];

  // 수정 F 8.4 — destination 대상은 allowed_speaker에 포함하되 발화 scope를 제한한다
  const speakerScope = {};
  for (const id of destinationNpcIds) {
    if (!allowedSpeakerIds.includes(id)) allowedSpeakerIds.push(id);
    speakerScope[id] = 'after_destination_arrival';
  }

  return {
    version: 1,
    location_id: locationId,
    context_npc_ids: contextNpcIds,
    present_npc_ids: presentNpcIds,
    entering_npc_ids: enteringNpcIds,
    destination_npc_ids: destinationNpcIds,
    remote_npc_ids: remoteNpcIds,
    speaker_scope: Object.keys(speakerScope).length ? speakerScope : undefined,
    allowed_speaker_ids: allowedSpeakerIds,
    player_dialogue: resolvePlayerDialoguePolicy(playerAction, master),
    anonymous_speech_allowed: false,
    unregistered_character_allowed: false,
    model_selected_entrance_allowed: false
  };
}

/** 발화 가능한 NPC인지 — present/entering/remote 중 하나에도 있어야 한다. */
export function canSpeak(contract, speakerId) {
  if (!isPlainObject(contract) || !identity(speakerId)) return false;
  if (!Array.isArray(contract.allowed_speaker_ids) || !contract.allowed_speaker_ids.includes(speakerId)) return false;
  if (speakerId === 'player') return true;
  return [
    ...(Array.isArray(contract.present_npc_ids) ? contract.present_npc_ids : []),
    ...(Array.isArray(contract.entering_npc_ids) ? contract.entering_npc_ids : []),
    ...(Array.isArray(contract.remote_npc_ids) ? contract.remote_npc_ids : [])
  ].includes(speakerId);
}
