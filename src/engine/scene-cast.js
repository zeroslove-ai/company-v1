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
// 플레이어 대사 정책 (spec 5)
// ---------------------------------------------------------------------------

// 큰따옴표/작은따옴표/홑화살괄호 안의 실제 인용 발화
const QUOTED_SPEECH = /["“”']([^"“”']{2,})["“”']|「([^」]{2,})」/u;
// 말하는 행동은 있지만 정확한 문장은 없는 경우
const SPEECH_ACT = /(말한다|말했다|묻는다|물었다|질문한다|질문했다|전한다|전했다|설명한다|설명했다|지시한다|지시했다|요청한다|요청했다|부른다|불렀다|답한다|답했다|대답한다|대답했다|이야기한다|얘기한다|따진다|따졌다|항의한다|사과한다|제안한다|보고한다|확인을?\s*요청)/u;

/**
 * 사용자 입력을 기준으로 이번 턴 플레이어 발화 허용 범위를 계산한다.
 * - explicit: 사용자가 실제 대사를 직접 인용해 입력함
 * - paraphrase: 말하는 행동은 입력했지만 정확한 문장은 쓰지 않음
 * - minor_reaction: 대사 없이 행동만 입력함 (짧은 반응 한 줄만 허용)
 */
export function resolvePlayerDialoguePolicy(playerAction) {
  const source = typeof playerAction === 'string' ? playerAction.trim() : '';
  if (!source) return { mode: 'minor_reaction', max_lines: 1, max_characters: 30 };

  const quoted = QUOTED_SPEECH.exec(source);
  const quotedText = quoted ? identity(quoted[1] ?? quoted[2]) : null;
  if (quotedText) {
    return { mode: 'explicit', max_lines: 2, source_text: quotedText };
  }
  if (SPEECH_ACT.test(source)) {
    return { mode: 'paraphrase', max_lines: 2, intent: source.slice(0, 200) };
  }
  return { mode: 'minor_reaction', max_lines: 1, max_characters: 30 };
}

// ---------------------------------------------------------------------------
// Cast 계산 (spec 13)
// ---------------------------------------------------------------------------

const CALL_ACTION = /(부른다|불렀다|호출한다|호출했다|오라고|오라 한다|불러온다|불러서|소환한다)/u;
const MOVE_ACTION = /(찾으러|찾아가|찾아보|보러\s*가|만나러|이동하|가본다|가겠다|방문하|들어간다|향한다)/u;
const REMOTE_ACTION = /(전화|통화|메신저|메시지|문자|사내망|카톡|연락한다|연락했다|콜한다)/u;

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
 * 현장에 실제로 존재하는 NPC (spec 13, present 우선순위 1~5).
 * scene_state.participants가 1차 근거이고, 저장된 위치가 현재 장소와 일치하거나
 * 직전 턴에서 퇴장하지 않고 남아 있는 NPC까지만 인정한다.
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

  // 2. 현재 위치가 저장된 NPC
  if (locationId) {
    for (const [id, state] of Object.entries(npcSceneState)) {
      if (isPlainObject(state) && identity(state.location_id) === locationId) push(id);
    }
  }

  // 3. 직전 턴에서 퇴장하지 않고 장면에 남아 있는 NPC
  for (const id of Array.isArray(save?.last_npcs_present) ? save.last_npcs_present : []) {
    const state = npcSceneState[id];
    if (isPlainObject(state) && state.present === false) continue;
    // 저장된 위치가 현재 장소와 명시적으로 다르면 남아 있다고 보지 않는다.
    const stateLocation = isPlainObject(state) ? identity(state.location_id) : null;
    if (locationId && stateLocation && stateLocation !== locationId) continue;
    push(id);
  }

  // 4·5. 명시적 행동 대상 / CSA 대상이면서 이미 현장에 있는 NPC
  for (const id of actionTargetIds) {
    const state = npcSceneState[id];
    if (isPlainObject(state) && state.present === true) push(id);
  }

  return present;
}

/**
 * 이번 턴에 새로 등장하는 NPC (spec 13, entering 우선순위 1~5).
 * 사전에 확인 가능한 근거가 없으면 빈 배열이다 — 모델은 스스로 누구도 등장시킬 수 없다.
 */
function resolveEnteringNpcIds({ save, master, playerAction, registeredIds, presentIds, structuredAction }) {
  const entering = [];
  const push = id => {
    if (!id || isPlayerRefId(id) || !registeredIds.has(id)) return;
    if (presentIds.includes(id) || entering.includes(id)) return;
    entering.push(id);
  };
  const source = typeof playerAction === 'string' ? playerAction : '';
  const named = namedNpcIds(master, source);

  // 1·2. 명시적 이동·방문 대상 / 사용자 호출 대상
  if (MOVE_ACTION.test(source) || CALL_ACTION.test(source)) {
    for (const id of named) push(id);
  }

  // 5. 시스템이 이미 확정한 장면 이벤트 대상 (find_npc 등 structured action)
  const structuredTarget = identity(structuredAction?.character_id ?? structuredAction?.target_id);
  if (structuredTarget) push(structuredTarget);

  // 3·4. 직전 약속에 따른 등장 예정 / 저장된 pending event 대상
  const pending = isPlainObject(save?.pending_boundary_followup) ? save.pending_boundary_followup : null;
  if (pending) push(identity(pending.target_character_id));
  for (const item of Array.isArray(save?.pending_scene_entrances) ? save.pending_scene_entrances : []) {
    push(identity(isPlainObject(item) ? (item.character_id ?? item.npc_id) : item));
  }

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
  for (const id of remoteNpcIds) pushContext(id);
  pushContext(identity(save?.focal_character_id));
  pushContext(identity(save?.last_speaker_id));
  for (const id of Array.isArray(save?.last_npcs_present) ? save.last_npcs_present : []) pushContext(id);

  const allowedSpeakerIds = ['player', ...presentNpcIds, ...enteringNpcIds, ...remoteNpcIds];

  return {
    version: 1,
    location_id: locationId,
    context_npc_ids: contextNpcIds,
    present_npc_ids: presentNpcIds,
    entering_npc_ids: enteringNpcIds,
    remote_npc_ids: remoteNpcIds,
    allowed_speaker_ids: allowedSpeakerIds,
    player_dialogue: resolvePlayerDialoguePolicy(playerAction),
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
