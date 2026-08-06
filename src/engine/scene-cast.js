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

/** 등록된 전체 이름 목록 (별명·직급·대명사 제외 — 전체 이름만). */
export function registeredTargetNames(master) {
  const entries = [];
  const push = (id, name) => {
    const cleanId = identity(id);
    const cleanName = identity(name);
    if (cleanId && cleanName && !entries.some(e => e.id === cleanId)) {
      entries.push({ id: cleanId, name: cleanName });
    }
  };
  for (const entry of Array.isArray(master?.characters) ? master.characters : []) {
    push(entry?.character_id ?? entry?.id, entry?.name);
  }
  for (const entry of Array.isArray(master?.general_npcs) ? master.general_npcs : []) {
    push(entry?.npc_id ?? entry?.id, entry?.name);
  }
  return entries;
}

/**
 * 사용자 입력을 기준으로 이번 턴 플레이어 발화 허용 범위를 계산한다 (안정화 수정 A 3.2).
 * - explicit: 사용자가 실제 대사를 직접 인용해 입력함
 * - paraphrase: 말하는 행동은 입력했지만 정확한 문장은 쓰지 않음
 * - minor_reaction: 대사 없이 행동만 입력함 (짧은 반응 한 줄만 허용)
 * 허용 범위(allowed_intents/allowed_target_ids/allowed_material_actions)를 결정적으로 채운다.
 * 수정 6 — allowed_target_names/registered_target_names를 포함해 NPC 대상 범위를 실제 검증한다.
 */
export function resolvePlayerDialoguePolicy(playerAction, master = null) {
  const source = typeof playerAction === 'string' ? playerAction.trim() : '';
  const base = { max_lines: 1, max_characters: 30, allowed_material_actions: [] };
  const targetIds = resolveUserMentionedNpcIds(master, source);
  const allRegistered = registeredTargetNames(master);
  const targetNames = allRegistered.filter(e => targetIds.includes(e.id)).map(e => e.name);

  if (!source) return { mode: 'minor_reaction', ...base, allowed_intents: ['reaction'], allowed_target_ids: [], allowed_target_names: [], registered_target_names: allRegistered, explicit_source_text: null, high_impact_intents_allowed: [] };

  const quoted = QUOTED_SPEECH.exec(source);
  const quotedText = quoted ? identity(quoted[1] ?? quoted[2]) : null;
  if (quotedText) {
    const quotedIntents = classifyDialogueIntents(quotedText);
    return {
      mode: 'explicit',
      max_lines: 2,
      explicit_source_text: quotedText,
      allowed_intents: quotedIntents.length ? quotedIntents : ['reaction'],
      allowed_target_ids: targetIds,
      allowed_target_names: targetNames,
      registered_target_names: allRegistered,
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
      allowed_target_ids: targetIds,
      allowed_target_names: targetNames,
      registered_target_names: allRegistered,
      allowed_material_actions: materialActionsOf(intentText),
      high_impact_intents_allowed: []
    };
  }
  return {
    mode: 'minor_reaction',
    ...base,
    allowed_intents: ['reaction'],
    allowed_target_ids: targetIds,
    allowed_target_names: targetNames,
    registered_target_names: allRegistered,
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
    // 2) 입력에 없는 새 NPC 이름 추가 → 차단 (수정 6: 실제 전체 이름 매칭)
    const unknownTarget = findUnknownNpcName(body, policy);
    if (unknownTarget) return { ok: false, reason: `new_npc_target:${unknownTarget}` };
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
    // 수정 6 — 입력에 없는 NPC 이름 차단
    const unknownTarget = findUnknownNpcName(body, policy);
    if (unknownTarget) return { ok: false, reason: `new_npc_target:${unknownTarget}` };
    const allowedMaterial = new Set(policy.allowed_material_actions ?? []);
    const newMaterial = materialActionsOf(body).filter(a => !allowedMaterial.has(a));
    if (newMaterial.length) return { ok: false, reason: `new_material:${newMaterial.join(',')}` };
    return { ok: true };
  }

  return { ok: true };
}

/**
 * 수정 6 — 생성 대사에서 등록된 전체 이름을 찾아 allowed 대상인지 검증한다.
 * 전체 이름만 매칭한다 (별명·직급·대명사는 근거로 쓰지 않는다).
 * 입력에서 허용된 NPC가 없는데 등록 NPC 이름이 등장하면 차단 대상으로 반환한다.
 * minor_reaction은 이름 단독으로는 차단하지 않는다 (고위험 intent와 함께일 때만).
 */
function findUnknownNpcName(generatedText, policy) {
  const text = typeof generatedText === 'string' ? generatedText : '';
  const allowedIds = new Set(policy.allowed_target_ids ?? []);
  const registered = Array.isArray(policy.registered_target_names) ? policy.registered_target_names : [];
  for (const entry of registered) {
    if (!entry?.name || !text.includes(entry.name)) continue;
    if (!allowedIds.has(entry.id)) return entry.name;
  }
  return null;
}

/** explicit에서 입력에 없는 새 NPC 이름 등장 감지 (canon 대상만). */
function hasUnknownNpcName(body, policy) {
  return findUnknownNpcName(body, policy) !== null;
}

// ---------------------------------------------------------------------------
// Cast 계산 (spec 13)
// ---------------------------------------------------------------------------

/** 자유 입력에서 이름이 정확히 언급된 등록 NPC를 찾는다 (부분 일치는 인정하지 않는다). */
/**
 * 사용자 입력에서 등장하는 NPC ID를 해석한다 (검토 수정 1).
 * 판정 순서:
 *   1. 등록된 전체 이름 정확 일치
 *   2. 전체 이름이 없을 때만 한국 3글자 이름의 뒷두 글자 확인 (allowUniqueKoreanGivenName)
 *   3. 뒷두 글자가 정확히 한 명에게만 해당하면 그 ID 사용
 *   4. 두 명 이상이면 불명확 — 아무도 선택하지 않음
 * 모델 출력 검증은 계속 전체 이름만 검사한다. 이 함수는 사용자 입력 해석 전용.
 */
export function resolveUserMentionedNpcIds(master, text, options = {}) {
  const source = typeof text === 'string' ? text : '';
  if (!source.trim()) return [];
  const allowUnique = options.allowUniqueKoreanGivenName !== false;
  const entries = [];
  const push = (id, name) => {
    const cleanId = identity(id);
    const cleanName = identity(name);
    if (cleanId && cleanName && !entries.some(e => e.id === cleanId)) {
      entries.push({ id: cleanId, name: cleanName });
    }
  };
  for (const entry of Array.isArray(master?.characters) ? master.characters : []) {
    push(entry?.character_id ?? entry?.id, entry?.name);
  }
  for (const entry of Array.isArray(master?.general_npcs) ? master.general_npcs : []) {
    push(entry?.npc_id ?? entry?.id, entry?.name);
  }

  const found = [];

  // 1) 전체 이름 정확 일치
  for (const entry of entries) {
    if (source.includes(entry.name) && !found.includes(entry.id)) found.push(entry.id);
  }
  if (found.length) return found;

  // 2~4) 전체 이름이 없으면 한국 3글자 이름 뒷두 글자 유일 매칭
  if (allowUnique) {
    const candidates = entries.filter(e => /^[가-힣]{3}$/.test(e.name));
    const givenNameCounts = new Map();
    for (const entry of candidates) {
      const given = entry.name.slice(1); // 뒷두 글자
      givenNameCounts.set(given, (givenNameCounts.get(given) ?? 0) + 1);
    }
    const uniqueGiven = new Map(); // given → id (유일한 것만)
    for (const entry of candidates) {
      const given = entry.name.slice(1);
      if (givenNameCounts.get(given) === 1) uniqueGiven.set(given, entry.id);
    }
    for (const [given, id] of uniqueGiven) {
      if (source.includes(given) && !found.includes(id)) found.push(id);
    }
  }

  return found;
}

/** @deprecated resolveUserMentionedNpcIds로 통일 */
function namedNpcIds(master, text) {
  return resolveUserMentionedNpcIds(master, text, { allowUniqueKoreanGivenName: false });
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
/**
 * NPC별 present 판정 helper (최종 단순화 수정 7).
 * present 승인 근거는 다음뿐이다:
 *   - participants 직접 포함
 *   - NPC location_id가 현재 location_id와 명시적 일치
 *   - present === true (위치 충돌 없을 때)
 * 명시적 부재(present===false)가 항상 최우선이고, 위치 충돌도 제외다.
 * last_npcs_present / focal / last_speaker / action target / pending boundary는
 * present 근거가 아니다 (context 전용).
 */
export function isNpcPresentAtCurrentScene({
  id,
  participants = [],
  sceneLocationId = null,
  npcSceneState = {}
}) {
  const state = npcSceneState[id];

  // 명시적 부재가 항상 최우선
  if (state?.present === false) return false;

  // 안정화 수정 G — scene_state.participants만 현재 장면의 실제 참가자 정본이다.
  // "같은 장소에 있음"과 "현재 대화 장면에 참가 중"은 서로 다른 개념이며,
  // 같은 장소라는 이유만으로 자동 등장·발화할 수 없다. 오래 남아 있던
  // present=true도 자동 출연 근거가 아니다 (turn 32에서 서원희가 커피를 들고
  // 난입한 원인). 사용자가 직접 부르거나 찾아가면 그때 participants에 추가된다.
  if (!Array.isArray(participants) || !participants.includes(id)) return false;

  // participants에 있어도 위치가 명시적으로 충돌하면 제외한다.
  const npcLocationId = typeof state?.location_id === 'string' ? state.location_id : null;
  if (sceneLocationId && npcLocationId && sceneLocationId !== npcLocationId) return false;

  return true;
}

/**
 * NPC의 현재 회사 내 위치 (안정화 수정 F).
 * 정본은 save.npc_scene_state[id].location_id이고, 없으면 캐릭터 canon의
 * default_location_id로 보완한다. present 여부와 무관하게 "회사 어디에 있는가"만
 * 답한다 — present=false여도 위치는 계속 유지된다.
 */
export function resolveNpcLocationId({ save, npcId, charactersMap = {}, generalNpcProfiles = {}, mapLocations = [] }) {
  const stored = identity(save?.npc_scene_state?.[npcId]?.location_id);
  if (stored) return stored;
  const fromCharacter = identity(charactersMap?.[npcId]?.default_location_id);
  if (fromCharacter) return fromCharacter;
  const fromProfile = identity(generalNpcProfiles?.[npcId]?.default_location_id);
  if (fromProfile) return fromProfile;
  // 일반 NPC는 map.locations[].default_npc_ids가 기본 배치 정본이다.
  for (const location of Array.isArray(mapLocations) ? mapLocations : []) {
    const ids = Array.isArray(location?.default_npc_ids) ? location.default_npc_ids : [];
    if (ids.includes(npcId)) return identity(location.location_id);
  }
  return null;
}

function resolvePresentNpcIds({ save, registeredIds }) {
  const present = [];
  const push = id => {
    if (!id || isPlayerRefId(id) || !registeredIds.has(id) || present.includes(id)) return;
    present.push(id);
  };
  const sceneState = isPlainObject(save?.scene_state) ? save.scene_state : {};
  const locationId = identity(sceneState.location_id);
  const npcSceneState = isPlainObject(save?.npc_scene_state) ? save.npc_scene_state : {};
  const participants = Array.isArray(sceneState.participants) ? sceneState.participants : [];

  // 모든 등록 NPC를 helper로 판정 (action target 승격 경로 없음 — 수정 7)
  for (const id of registeredIds) {
    if (isNpcPresentAtCurrentScene({ id, participants, sceneLocationId: locationId, npcSceneState })) {
      push(id);
    }
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
    for (const id of resolveUserMentionedNpcIds(master, source)) push(id);
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
    for (const id of resolveUserMentionedNpcIds(master, source)) push(id);
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
    for (const id of resolveUserMentionedNpcIds(master, source)) push(id);
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

  // 수정 7 — action target은 present 승격 근거가 아니다
  const presentNpcIds = resolvePresentNpcIds({ save, registeredIds });
  const enteringNpcIds = resolveEnteringNpcIds({
    save, master, playerAction, registeredIds, presentIds: presentNpcIds, structuredAction
  });
  const destinationNpcIds = resolveDestinationNpcIds({
    save, master, playerAction, registeredIds, presentIds: presentNpcIds
  });
  const remoteNpcIds = resolveRemoteNpcIds({
    save, master, playerAction, registeredIds, presentIds: presentNpcIds, enteringIds: enteringNpcIds
  });

  // 수정 2 — 이동 턴: 현재 장소 NPC·목적지 NPC 모두 발화 금지.
  // allowed_speaker_ids = ['player', ...remoteNpcIds]
  const transitionMode = destinationNpcIds.length ? 'movement' : 'stationary';
  const isMovementTurn = transitionMode === 'movement';
  const effectivePresent = isMovementTurn ? [] : presentNpcIds;
  const effectiveEntering = isMovementTurn ? [] : enteringNpcIds;

  // 검토 수정 2 + 안전화 패치 — 이동 목적지 장소: 대상 NPC의 저장 위치를 사용한다.
  // 저장 위치가 없으면 임의 장소를 만들지 않고 null로 둔다.
  const npcSceneState = isPlainObject(save?.npc_scene_state) ? save.npc_scene_state : {};
  const destinationNpcState = isMovementTurn && destinationNpcIds.length === 1
    ? npcSceneState[destinationNpcIds[0]]
    : null;
  const destinationLocationId = isMovementTurn && destinationNpcIds.length === 1
    ? (identity(destinationNpcState?.location_id) ?? null)
    : null;
  // scene_id는 NPC 저장 상태에 있으면 사용하고, 없으면 검증된 location_id로 대체.
  // 새 장소 이름을 추측하거나 생성하지 않는다.
  const destinationSceneId = isMovementTurn && destinationNpcIds.length === 1
    ? (identity(destinationNpcState?.scene_id) ?? destinationLocationId)
    : null;

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

  // 수정 2 — 이동 턴은 destination NPC를 allowed_speaker에 넣지 않는다
  const allowedSpeakerIds = ['player', ...effectivePresent, ...effectiveEntering, ...remoteNpcIds];

  return {
    version: 1,
    transition_mode: transitionMode,
    location_id: locationId,
    context_npc_ids: contextNpcIds,
    present_npc_ids: effectivePresent,
    entering_npc_ids: effectiveEntering,
    destination_npc_ids: destinationNpcIds,
    destination_location_id: destinationLocationId,
    destination_scene_id: destinationSceneId,
    remote_npc_ids: remoteNpcIds,
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
