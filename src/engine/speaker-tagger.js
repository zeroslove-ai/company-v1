/**
 * 스피커 태깅 — 서버 parser가 dialogue block으로 분류했으나 화자만 미확정(speaker_id=null)인
 * 대사를 전용 LLM 호출로 판별한다.
 *
 * 원칙 (작업 지시서):
 * - parser가 확정한 화자는 절대 다시 판단/변경하지 않는다
 * - 원문 대사 텍스트·순서를 수정하지 않는다
 * - 태깅 입력은 원본 Story를 정규식으로 다시 훑지 않고, parser가 만든 parsedStory의
 *   dialogue block에서 생성한다 (비발화 인용문이 대사로 오인되는 경로 차단)
 * - 응답은 ID 기반 allowlist로 제한하고, 텍스트 매칭(byText) 대신 dialogue_index로 적용한다
 * - 실패는 파이프라인을 막지 않고, 1 action당 최대 1회만 호출한다
 * - roster는 실제 master(edition 기반)와 현재 장면 정보로 동적으로 구성한다 — "플레이어는
 *   항상 감사팀 임원" 같은 고정 전제를 시스템 프롬프트에 두지 않는다
 * - normalized_raw는 섹션 마커/플레이어 속마음/상황판/선택지/choice labels를 전부 보존하고
 *   dialogue 라인만 화자명을 반영한다
 */

const TAGGER_SYSTEM = `너는 한국어 게임 서사의 "대사 화자 판별기"다.
주어진 대사 각각의 화자를 문맥과 대사 내용으로 판별해라.

판별 기준:
- 직전 서술이 화자를 지목하면(말했다/물었다/입을 열었다/고개를 끄덕이며/인사하며 등) 그 NPC
- 대사 내용의 호칭이 roster의 known_addresses 중 누구의 것인지로 화자 판별 (예: 플레이어를 부르는 호칭이면 NPC의 발화)
- 대화 흐름: 직전 대사가 누구였는지, 누가 누구에게 답하는지
- 화자가 플레이어로 확실할 때만 "player"로 지정하고, 확신이 없으면 null로 표시한다
  (플레이어로 추정하지 않는다 — 불확실하면 미확정으로 남긴다)

로스터 사용법:
- 각 인물에 in_scene 필드가 있다. in_scene: true는 현재 장면에 등장하는 인물이다.
  화자 후보를 고를 때 현재 장면 인물(in_scene: true)을 우선 고려하라.
- scene participants / focal_character_id / last_speaker_id / 대사에 이미 등장한 인물이 우선순위다.

응답은 반드시 JSON 한 개만:
{"speakers":[{"dialogue_index":0,"speaker_id":"heroine2"},{"dialogue_index":1,"speaker_id":null}]}

speaker_id는 반드시 제공된 roster의 id 중에서만 선택하고, roster에 없는 값이나 이름·직급 문자열을 반환하지 마라.
미확정은 speaker_id를 null로 표시하라.`;

/**
 * parsedStory.blocks에서 dialogue block 중 speaker_id가 없는 항목만 수집한다.
 * 반환: [{ dialogue_index, order, text, context_before, context_after, candidate_speaker_ids }]
 * dialogue_index = blocks 배열에서 dialogue type만 세어 나온 순번 (응답/적용의 안정적 key)
 */
export function collectUnresolvedDialogue(parsedStory) {
  const blocks = Array.isArray(parsedStory?.blocks) ? parsedStory.blocks : [];
  const items = [];
  let dialogueIndex = 0;
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (block?.type !== 'dialogue') continue;
    if (!block.speaker_id) {
      let before = '';
      let after = '';
      for (let j = i - 1; j >= 0; j -= 1) {
        if (blocks[j]?.type === 'scene') { before = String(blocks[j].text ?? ''); break; }
      }
      for (let j = i + 1; j < blocks.length; j += 1) {
        if (blocks[j]?.type === 'scene') { after = String(blocks[j].text ?? ''); break; }
      }
      items.push({
        dialogue_index: dialogueIndex,
        order: Number.isInteger(block.order) ? block.order : dialogueIndex,
        text: String(block.text ?? ''),
        context_before: String(before).slice(-200),
        context_after: String(after).slice(0, 200),
        candidate_speaker_ids: []
      });
    }
    dialogueIndex += 1;
  }
  return items;
}

/** master에서 화자 후보 ID 집합 (player + 등록 캐릭터 + 일반 NPC) */
export function allowedSpeakerIds(master) {
  const ids = ['player'];
  for (const character of rosterEntries(master)) {
    const id = character?.character_id ?? character?.npc_id ?? character?.id ?? null;
    if (typeof id === 'string' && id) ids.push(id);
  }
  return ids;
}

/** master의 모든 등록 인물을 통일된 { id, name, role_title, department, addresses } 형태로 */
function rosterEntries(master) {
  const entries = [];
  const push = (character, idField) => {
    const id = character?.[idField] ?? character?.id ?? null;
    const name = typeof character?.name === 'string' ? character.name.trim() : '';
    if (!id || !name) return;
    entries.push({
      id,
      name,
      role_title: character?.role_title ?? character?.role ?? character?.position ?? '',
      department: character?.department ?? character?.department_name ?? '',
      addresses: addressesFor(character)
    });
  };
  for (const character of Array.isArray(master?.characters) ? master.characters : []) push(character, 'character_id');
  for (const npc of Array.isArray(master?.general_npcs) ? master.general_npcs : []) push(npc, 'npc_id');
  return entries;
}

/** roster id → { id, name } 매핑 (태깅 적용 시 이름 확정용) */
export function speakerNameMap(master) {
  const map = new Map();
  for (const entry of rosterEntries(master)) map.set(entry.id, { id: entry.id, name: entry.name });
  return map;
}

function addressesFor(character) {
  const raw = character?.known_addresses ?? character?.addresses ?? null;
  if (Array.isArray(raw)) return raw.filter(v => typeof v === 'string' && v.trim());
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
  return [];
}

/**
 * 현재 장면 참여자 후보 ID를 구성한다 (지시서: scene participants + focal + last_speaker +
 * parsed Story에 등장한 인물 + player). 전체 일반 NPC를 동등 후보로 나열하지 않기 위해
 * 이 우선 그룹이 roster 앞쪽에 in_scene: true로 배치된다.
 */
export function buildSceneCandidateIds(parsedStory, { sceneParticipants = [], focalCharacterId = null, lastSpeakerId = null } = {}) {
  const ids = new Set();
  for (const id of sceneParticipants) if (typeof id === 'string' && id) ids.add(id);
  if (typeof focalCharacterId === 'string' && focalCharacterId) ids.add(focalCharacterId);
  if (typeof lastSpeakerId === 'string' && lastSpeakerId) ids.add(lastSpeakerId);
  for (const line of parsedStory?.dialogue_lines ?? []) {
    if (typeof line?.speaker_id === 'string' && line.speaker_id) ids.add(line.speaker_id);
  }
  ids.add('player');
  return [...ids];
}

/**
 * 태깅 LLM 요청 메시지. 미확정 대사가 없으면 null 반환.
 * - player: master.player를 읽지 않고 호출부가 hydratedSave.player + catalogs로 만든
 *   playerInfo(departmentName/positionName/roleTitle)를 전달한다
 * - roster: 현재 장면 후보(in_scene: true)를 우선 배치하고, 나머지 등록 인물은 뒤에
 *   in_scene: false로 나열한다
 */
export function buildTaggingMessages(parsedStory, master, {
  playerName = '플레이어',
  playerInfo = {},
  sceneParticipants = [],
  focalCharacterId = null,
  lastSpeakerId = null
} = {}) {
  const items = collectUnresolvedDialogue(parsedStory);
  if (!items.length) return null;

  const entries = rosterEntries(master);
  const byId = new Map(entries.map(e => [e.id, e]));

  // 장면 참여자 우선 그룹
  const participantIds = buildSceneCandidateIds(parsedStory, { sceneParticipants, focalCharacterId, lastSpeakerId });
  const participantSet = new Set(participantIds);

  const rosterLines = [];
  const seen = new Set();
  const pushRoster = (id, entry, inScene) => {
    if (seen.has(id)) return;
    seen.add(id);
    rosterLines.push(JSON.stringify({
      speaker_id: id,
      name: entry.name,
      role_title: entry.role_title,
      department: entry.department,
      in_scene: inScene,
      known_addresses: entry.addresses
    }));
  };

  // 1) player — 실제 플레이어 정보
  const playerRoleTitle = typeof playerInfo?.roleTitle === 'string' && playerInfo.roleTitle
    ? playerInfo.roleTitle
    : (typeof playerInfo?.positionName === 'string' ? playerInfo.positionName : '');
  pushRoster('player', {
    name: playerName,
    role_title: playerRoleTitle,
    department: playerInfo?.departmentName ?? '',
    addresses: playerInfo?.addresses ?? []
  }, participantSet.has('player'));

  // 2) 현재 장면 후보 우선 (in_scene: true)
  for (const id of participantIds) {
    const entry = byId.get(id);
    if (entry && id !== 'player') pushRoster(id, entry, true);
  }

  // 3) 나머지 등록 인물 (in_scene: false) — 장면 후보가 부족할 때만 참고하도록 뒤에 배치
  for (const entry of entries) {
    pushRoster(entry.id, entry, participantSet.has(entry.id));
  }

  const lines = items.map(item =>
    `${item.dialogue_index}. 문맥 앞: ${item.context_before || '(없음)'} | 대사: "${item.text}"${item.context_after ? ` | 문맥 뒤: ${item.context_after}` : ''}`
  ).join('\n');

  return [
    { role: 'system', content: TAGGER_SYSTEM },
    {
      role: 'user',
      content: `현재 화자 roster (speaker_id는 이 목록에서만 선택):\n${rosterLines.join('\n')}\n\n다음 대사들의 화자를 판별해라. dialogue_index를 반드시 유지해라.\n${lines}`
    }
  ];
}

/**
 * 태깅 응답 파싱. content는 OpenAI envelope의 choices[0].message.content (JSON 문자열).
 * 반환: [{ dialogue_index, speaker_id }] — allowlist 밖/중복/범위 밖은 폐기.
 */
export function parseTaggingResponse(content, allowlist = []) {
  const stripped = String(content ?? '').trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  let data;
  try {
    data = JSON.parse(stripped);
  } catch {
    const match = /\{[\s\S]*\}/.exec(stripped);
    if (!match) return [];
    try { data = JSON.parse(match[0]); } catch { return []; }
  }
  const list = Array.isArray(data?.speakers) ? data.speakers : [];
  const seen = new Set();
  const result = [];
  for (const entry of list) {
    const index = entry?.dialogue_index;
    if (!Number.isInteger(index)) continue;
    if (seen.has(index)) continue; // 중복 dialogue index 거부
    seen.add(index);
    const speakerId = entry?.speaker_id;
    if (speakerId === null || speakerId === undefined || speakerId === '') {
      result.push({ dialogue_index: index, speaker_id: null });
      continue;
    }
    if (typeof speakerId !== 'string' || !allowlist.includes(speakerId)) continue; // allowlist 밖 거부
    result.push({ dialogue_index: index, speaker_id: speakerId });
  }
  return result;
}

/**
 * normalized_raw의 dialogue 라인만 화자명을 반영해 다시 조합한다.
 * 섹션 마커 / 플레이어 속마음 / 플레이어 상황판 / 선택지 / choice labels / 기타 원문 라인은
 * 그대로 보존한다. dialogue 라인 판별은 따옴표 내용이 blocks의 dialogue.text와 일치할 때만
 * 수행하므로 인용문·선택지 따옴표는 절대 건드리지 않는다.
 */
function applyTaggedNamesToRaw(normalizedRaw, blocks) {
  const lines = String(normalizedRaw ?? '').split('\n');
  const dialogues = blocks.filter(b => b?.type === 'dialogue');
  let d = 0;
  const out = [];
  for (const line of lines) {
    const block = dialogues[d];
    const trimmed = line.trim();
    // "화자명 (지시): "text"" 또는 순수 "text" 라인 — 닫는 따옴표가 라인 끝이어야 대사 라인
    const m = /^(?:([\p{L}][^\n“”"]{0,40}?)\s*\(([^()\n]{0,80})\)\s*[:：]?\s*)?[“"]([^”"]*)[”"]\s*$/u.exec(trimmed);
    if (block && m && m[3] === block.text) {
      const name = block.speaker_name || '';
      const direction = block.direction || '자연스럽게';
      out.push(name ? `${name} (${direction}): “${block.text}”` : `“${block.text}”`);
      d += 1;
    } else {
      out.push(line);
    }
  }
  return out.join('\n');
}

/**
 * 태깅 결과를 parsedStory에 적용한다 (정본 taggedParsedStory 생성).
 * - dialogue_index로 매칭, 해당 index의 원문 text가 요청 당시 text와 같을 때만 적용
 * - 이미 확정된 화자(speaker_id 존재)는 태거가 바꾸려 해도 무시
 * - 미확정(speaker_id null)은 그대로 유지
 * - normalized_raw는 라인 교체 방식으로 4개 섹션(서사/속마음/상황판/선택지) 전체 보존
 * 반환: { parsedStory(새 객체), changed, appliedCount, rejectedCount }
 */
export function applySpeakerTags(parsedStory, tags, master, { playerName = '플레이어', unresolvedItems = [] } = {}) {
  const blocks = Array.isArray(parsedStory?.blocks) ? parsedStory.blocks : [];
  const names = speakerNameMap(master);
  if (playerName) names.set('player', { id: 'player', name: playerName });
  const byIndex = new Map();
  for (const tag of tags) byIndex.set(tag.dialogue_index, tag);
  const textByIndex = new Map();
  for (const item of unresolvedItems) textByIndex.set(item.dialogue_index, item.text);

  const nextBlocks = [];
  const nextDialogueLines = [];
  let applied = 0;
  let rejected = 0;
  let dialogueIndex = 0;
  for (const block of blocks) {
    if (block?.type !== 'dialogue') {
      nextBlocks.push(block);
      continue;
    }
    const tag = byIndex.get(dialogueIndex);
    let updated = block;
    if (tag?.speaker_id && !block.speaker_id) {
      const expectedText = textByIndex.get(dialogueIndex);
      // 원문 텍스트 검증 — 요청 시점과 다르면 적용하지 않는다
      if (expectedText === undefined || expectedText === block.text) {
        const speaker = names.get(tag.speaker_id);
        if (speaker) {
          updated = {
            ...block,
            speaker_id: speaker.id,
            speaker_name: speaker.name,
            speaker: speaker.name
          };
          applied += 1;
        } else {
          rejected += 1;
        }
      } else {
        rejected += 1;
      }
    } else if (tag?.speaker_id) {
      // 이미 확정된 화자를 태거가 바꾸려 함 → 무시
      rejected += 1;
    }
    nextBlocks.push(updated);
    if (!updated.speaker_id) {
      nextDialogueLines.push({
        speaker_id: null,
        speaker_name: '',
        direction: updated.direction ?? '자연스럽게',
        text: updated.text,
        order: updated.order ?? dialogueIndex
      });
    } else {
      nextDialogueLines.push({
        speaker_id: updated.speaker_id,
        speaker_name: updated.speaker_name,
        direction: updated.direction ?? '자연스럽게',
        text: updated.text,
        order: updated.order ?? dialogueIndex
      });
    }
    dialogueIndex += 1;
  }

  // normalized_raw: 원본 구조(섹션 마커/속마음/상황판/선택지/choice labels)를 보존한 채
  // dialogue 라인만 화자명 반영 — blocks 재조합으로 섹션을 잃지 않는다
  const normalizedRaw = applyTaggedNamesToRaw(parsedStory?.normalized_raw, nextBlocks);

  return {
    parsedStory: {
      ...parsedStory,
      blocks: nextBlocks,
      dialogue_lines: nextDialogueLines,
      normalized_raw: normalizedRaw,
      tagged: applied > 0,
      speaker_tagging_status: applied > 0 ? 'applied' : 'unresolved'
    },
    changed: applied > 0,
    appliedCount: applied,
    rejectedCount: rejected
  };
}
