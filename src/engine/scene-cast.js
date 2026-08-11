import { hydrateCanonicalScene } from './runtime-core/scene-reducer.js';

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
 */
export const HIGH_IMPACT_INTENTS = [
  'instruction', 'promise', 'agreement', 'confession',
  'threat', 'movement_decision', 'investigation_decision', 'relationship_change',
  'authority_assertion'
];

const INTENT_PATTERNS = {
  // 명령형 어미 + 직접 명령어 (단독 '와'/'가'는 오탐 위험이 커 제외, 문맥 명령형 어미로만)
  instruction: /(해라|하세요|해야 해|당장|따라\b|벗어|제출해|다시 작성해|내려와|앉아\b|해줘|해 주세요|시키지 마|하지 마|그만둬|꺼져|가져와|보여줘|따라와|움직여|불러와|보내드려|작성하세요)/u,
  promise: /(약속할게|약속해|내가 책임질게|책임질게요|반드시 해줄게|앞으로 계속|다시는 안|꼭 해줄게|지켜줄게)/u,
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
  // question/answer 없고 다른 intent도 없으면 reaction
  if (intents.size === 0) intents.add('reaction');
  return [...intents];
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
 * 허용 범위(allowed_intents/allowed_target_ids)를 결정적으로 채운다.
 * 수정 6 — allowed_target_names/registered_target_names를 포함해 NPC 대상 범위를 실제 검증한다.
 */
export function resolvePlayerDialoguePolicy(playerAction, master = null) {
  const source = typeof playerAction === 'string' ? playerAction.trim() : '';
  const base = { max_lines: 1, max_characters: 30 };
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
    // 3) 과도한 길이 확장 → 차단 (원문의 3배 초과)
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
 * 현재 장면의 presence 정본은 scene_state.participants다.
 * npc_scene_state.present/location_id와 last_npcs_present는 보조·과거 상태이며
 * participants를 부재나 다른 위치로 되돌리는 근거가 아니다.
 */
/**
 * NPC별 present 판정 helper (최종 단순화 수정 7).
 * present 승인 근거는 participants 직접 포함뿐이다.
 * stale present=false/location_id는 canonical participants를 덮지 못한다.
 * last_npcs_present / focal / last_speaker / action target / pending boundary는
 * present 근거가 아니다 (context 전용).
 */
export function isNpcPresentAtCurrentScene({
  id,
  participants = [],
  sceneLocationId = null,
  npcSceneState = {}
}) {
  // scene_state.participants가 현재 장면의 유일한 canonical presence source다.
  // npc_scene_state.present/location_id는 과거 턴의 잔여 상태일 수 있으므로
  // participants에 포함된 NPC를 부재 또는 다른 위치로 되돌리지 않는다.
  if (!Array.isArray(participants) || !participants.includes(id)) return false;
  return true;
}

/**
 * NPC의 현재 회사 내 위치 (안정화 수정 F).
 * 정본은 save.npc_scene_state[id].location_id이고, 없으면 캐릭터 canon의
 * default_location_id로 보완한다. present 여부와 무관하게 "회사 어디에 있는가"만
 * 답한다 — present=false여도 위치는 계속 유지된다.
 */
/** master.characters(배열)를 id→캐릭터 맵으로 바꾼다. */
function charactersMapOf(master) {
  const map = {};
  for (const entry of Array.isArray(master?.characters) ? master.characters : []) {
    const id = identity(entry?.character_id ?? entry?.id);
    if (id) map[id] = entry;
  }
  return map;
}

/** master.general_npcs(배열)를 id→프로필 맵으로 바꾼다. */
function generalNpcProfilesOf(master) {
  const map = {};
  for (const entry of Array.isArray(master?.general_npcs) ? master.general_npcs : []) {
    const id = identity(entry?.npc_id ?? entry?.id);
    if (id) map[id] = entry;
  }
  return map;
}

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

/** 사용자가 해당 NPC를 부르거나 호출하는 행동 (entering 근거). */
const CALL_ACTION = /(부른다|불렀다|호출한다|호출했다|오라고|오라 한다|불러온다|불러서|소환한다|이쪽으로)/u;

/**
 * 안정화 수정 H — 이동 입력에 "말을 건다"는 의도가 함께 있는지 판정한다.
 * 인용 대사, 인사말, 말하기 동사, 물음표가 모두 근거다. 이 의도가 있으면
 * 도착과 대화가 같은 턴에 끝난다.
 */
// 한국어 활용 주의: '인사하다 → 인사한다'처럼 어간 '하'가 '한'으로 바뀌므로
// 어간이 아니라 명사형(인사/대화/얘기/질문)으로 매칭한다.
// Speaker permissions are derived from the current cast only.
/**
 * 사용자가 NPC가 있는 곳으로 이동·방문·찾으러 가는 행동 (destination 근거 — entering 아님).
 * 동사 어간형("이동하", "찾아가", "찾아보", "방문하")은 그 자체의 현재형 활용("이동한다",
 * "찾아간다", "찾아본다", "방문한다")과 문자열이 겹치지 않는다 — 하다→한다·가다→간다·보다→본다
 * 축약 때문이다(인사하다→인사한다와 같은 패턴). 활용형을 넣지 않으면 "서원희를 찾아간다"처럼
 * 스펙에 명시된 리터럴 입력조차 이동으로 인식하지 못한다.
 */
const MOVE_ACTION = /(찾으러|찾아가|찾아간|찾아보|찾아본|보러|만나러|이동하|이동한|가본다|가겠다|방문하|방문한|들어간다|향한다|자리로|사무실로|팀으로)/u;
/** 장소 이름/별칭이 문장에 그대로 등장하면(NPC 언급 없이도) 이동 목적지 장소로 인정한다. 가장 긴 이름을 우선한다. */
export function resolveNavigationLocation({ save = {}, master = {}, playerAction = '', mapLocations = [] } = {}) {
  const source = typeof playerAction === 'string' ? playerAction : '';
  if (!source || !MOVE_ACTION.test(source)) return null;
  const currentLocationId = identity(hydrateCanonicalScene(save, { master, mapLocations }).location_id);
  let best = null;
  for (const location of Array.isArray(mapLocations) ? mapLocations : []) {
    const id = identity(location?.location_id);
    if (!id) continue;
    const names = [location?.name, ...(Array.isArray(location?.aliases) ? location.aliases : [])];
    for (const name of names) {
      const trimmed = identity(name);
      if (!trimmed || !source.includes(trimmed)) continue;
      if (!best || trimmed.length > best.name.length) best = { id, name: trimmed };
    }
  }
  if (best) return best.id === currentLocationId ? null : best.id;
  const characters = charactersMapOf(master);
  const generalNpcs = generalNpcProfilesOf(master);
  const mentioned = resolveUserMentionedNpcIds(master, source, { allowUniqueKoreanGivenName: false });
  for (const npcId of mentioned) {
    const locationId = resolveNpcLocationId({ save, npcId, charactersMap: characters, generalNpcProfiles: generalNpcs, mapLocations });
    if (locationId && locationId !== currentLocationId) return locationId;
  }
  return null;
}
const REMOTE_ACTION = /(전화|통화|메신저|메시지|문자|사내망|카톡|연락한다|연락했다|콜한다)/u;

/**
 * 이번 턴에 새로 등장하는 NPC (안정화 수정 F 8.2/8.3/8.5).
 * entering은 "NPC가 현재 장면으로 들어오는" 물리적 근거가 있을 때만:
 *   - 사용자가 해당 NPC를 부르거나 호출 (CALL_ACTION)
 *   - 저장된 pending_scene_entrances 대상
 * 이동(찾으러 감)·전화는 각각 destination/remote로 분리된다.
 * structuredAction(app_transaction)의 target은 장면 진입 의미가 없으므로 entering으로 쓰지 않는다.
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
  if (CALL_ACTION.test(source)) {
    for (const id of resolveUserMentionedNpcIds(master, source)) push(id);
  }

  // 2. 저장된 pending scene entrance 대상
  for (const item of Array.isArray(save?.pending_scene_entrances) ? save.pending_scene_entrances : []) {
    push(identity(isPlainObject(item) ? (item.character_id ?? item.npc_id) : item));
  }

  // structuredAction target 자동 entering — app_transaction에는 장면 진입 의미 없음

  return entering;
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
  mapLocations = []
} = {}) {
  const registeredIds = registeredNpcIdSet(master);
  const canonicalScene = hydrateCanonicalScene(save, { master, mapLocations });
  const locationId = identity(canonicalScene.location_id);

  // 수정 7 — action target은 present 승격 근거가 아니다
  const presentNpcIds = canonicalScene.present_npc_ids
    .filter(id => registeredIds.has(id) && !isPlayerRefId(id));
  const enteringNpcIds = resolveEnteringNpcIds({
    save, master, playerAction, registeredIds, presentIds: presentNpcIds, structuredAction
  });
  const remoteNpcIds = resolveRemoteNpcIds({
    save, master, playerAction, registeredIds, presentIds: presentNpcIds, enteringIds: enteringNpcIds
  });

  // NPC 언급 없이 장소 이름만으로 이동하는 순수 이동 입력("…사무실로 이동한다") —
  // destinationNpcIds는 NPC 이름이 문장에 있어야만 채워지므로 이 경로가 없으면
  // 목적지가 NPC 언급 없는 순수 이동을 전혀 인식하지 못한다.
  // 수정 2 — 이동 턴: 현재 장소 NPC·목적지 NPC 모두 발화 금지.
  // allowed_speaker_ids = ['player', ...remoteNpcIds]
  // 안정화 수정 H — 이동을 여러 턴으로 나누지 않는다. 도착과 만남이 같은 턴에
  // 일어나고, 사용자의 입력에 말 걸기 의도가 있으면 목적지 NPC가 같은 턴에
  // 대답한다. 말 걸기 의도가 없는 순수 이동이면 도착 서술까지만 하고 발화는
  // 다음 턴으로 미룬다(도착하자마자 NPC가 먼저 말을 걸어버리는 것 방지).

  // 검토 수정 2 + 안전화 패치 — 이동 목적지 장소: 대상 NPC의 저장 위치를 사용한다.
  // 저장 위치가 없으면 임의 장소를 만들지 않고 null로 둔다.
  // 안정화 수정 H — 저장 위치가 없으면 캐릭터 canon의 default_location_id(그다음
  // map.locations의 default_npc_ids)로 보완한다. 예전에는 여기서 null이 나와
  // 이동 Commit 자체가 적용되지 않았고("민아 보러 가야지" → 이동 저장 안 됨),
  // 대상 NPC는 계속 장면 밖에 남았다. 여전히 근거가 없으면 null을 유지한다.
  //
  // 우선순위는 explicitDestinationLocationId(문장에 그대로 등장한 장소명)가 먼저다 —
  // "브랜드전략팀 사무실로 가서 윤민아에게 인사한다"처럼 이미 함께 있는 NPC를 목적지에서도
  // 지목하면 그녀의 npc_scene_state.location_id는 아직 "출발" 장소(회의실)를 가리키므로,
  // 그걸 먼저 쓰면 목적지가 출발지로 되돌아가 버린다. 문장에 장소명이 없을 때만("민아
  // 보러 간다") NPC의 저장/기본 위치로 목적지를 추론한다.
  // scene_id는 명시적 장소명이 없을 때만 NPC 저장 상태의 scene_id를 쓰고, 그 외에는
  // 검증된 location_id로 대체한다. 새 장소 이름을 추측하거나 생성하지 않는다.

  // 문맥 참고용 — focal/last_speaker는 여기에는 들어가지만 present에는 별도 근거가 필요하다.
  const contextNpcIds = [];
  const pushContext = id => {
    if (!id || isPlayerRefId(id) || !registeredIds.has(id) || contextNpcIds.includes(id)) return;
    contextNpcIds.push(id);
  };
  for (const id of presentNpcIds) pushContext(id);
  for (const id of enteringNpcIds) pushContext(id);
  for (const id of remoteNpcIds) pushContext(id);
  pushContext(identity(save?.focal_character_id));
  pushContext(identity(save?.last_speaker_id));
  for (const id of Array.isArray(save?.last_npcs_present) ? save.last_npcs_present : []) pushContext(id);

  const allowedSpeakerIds = [...new Set(['player', ...presentNpcIds, ...enteringNpcIds, ...remoteNpcIds])];

  return {
    version: 1,
    location_id: locationId,
    context_npc_ids: contextNpcIds,
    present_npc_ids: presentNpcIds,
    entering_npc_ids: enteringNpcIds,
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
