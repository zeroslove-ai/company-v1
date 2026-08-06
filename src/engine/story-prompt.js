import { buildActiveCharacterCanon, buildSceneContextCore, selectActiveCharacterIds } from './gameplay-state.js';
import { buildPlayerPromptProjection, resolvePlayerCanonicalNames } from './player-setup.js';
import {
  buildGeneralNpcCanon,
  buildWorkplaceContext,
  selectActiveGeneralNpcIds
} from './workplace-context.js';

const MOVEMENT_TARGET_ACTION = /(찾으러|찾아가|찾아보|보러\s*가|만나러|이동하|가본다|가겠다|방문하)/u;

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function clip(value, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return '';
  const characters = Array.from(text);
  return characters.length <= maxLength ? text : characters.slice(-maxLength).join('');
}

function normalizedChoices(value) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim()).slice(0, 4) : [];
}

function parsedBlocks(turn) {
  if (Array.isArray(turn?.parsed_blocks?.blocks)) return turn.parsed_blocks.blocks;
  if (Array.isArray(turn?.parsed_blocks)) return turn.parsed_blocks;
  return [];
}

function narrativeTail(turn) {
  const blocks = parsedBlocks(turn)
    .filter(block => block?.type === 'scene' || block?.type === 'dialogue')
    .map(block => typeof block?.text === 'string' ? block.text.trim() : '')
    .filter(Boolean);
  const source = blocks.length ? blocks.join('\n') : (typeof turn?.story_text === 'string' ? turn.story_text : '');
  return clip(source, 1800);
}

function dialogueTail(turn) {
  const lines = Array.isArray(turn?.parsed_blocks?.dialogue_lines) ? turn.parsed_blocks.dialogue_lines : [];
  return lines.filter(line => object(line) && typeof line.text === 'string' && line.text.trim()).slice(-6).map(line => ({
    speaker_id: typeof line.speaker_id === 'string' ? line.speaker_id : null,
    speaker_name: typeof line.speaker_name === 'string' ? line.speaker_name : '',
    direction: typeof line.direction === 'string' ? line.direction : '',
    text: clip(line.text, 260)
  }));
}

function koreanGivenName(name) {
  const characters = Array.from(typeof name === 'string' ? name.trim() : '');
  if (characters.length !== 3 || !characters.every(character => /[가-힣]/u.test(character))) return '';
  return characters.slice(1).join('');
}

/**
 * A partial name is normally never enough to activate a character. The sole
 * exception is an explicit find/visit/movement action whose Korean given name
 * resolves to exactly one registered heroine (e.g. 민아 -> 윤민아).
 */
export function resolveMovementCharacterTarget(charactersMap, playerAction) {
  const map = object(charactersMap) ?? {};
  const action = typeof playerAction === 'string' ? playerAction.trim() : '';
  if (!action || !MOVEMENT_TARGET_ACTION.test(action)) return null;
  const exact = Object.entries(map).filter(([, character]) => {
    const name = typeof character?.name === 'string' ? character.name.trim() : '';
    return name && action.includes(name);
  });
  if (exact.length === 1) return exact[0][0];
  if (exact.length > 1) return null;
  const aliasMatches = Object.entries(map).filter(([, character]) => {
    const alias = koreanGivenName(character?.name);
    return alias && action.includes(alias);
  });
  return aliasMatches.length === 1 ? aliasMatches[0][0] : null;
}

/** Detailed continuity is intentionally limited to the immediately previous turn. */
export function buildLastTurnContinuity(turn) {
  if (!object(turn)) return null;
  const continuity = {
    turn: typeof turn.turn_number === 'number' ? turn.turn_number : null,
    player_action: typeof turn.player_action === 'string' ? clip(turn.player_action, 500) : '',
    narrative_tail: narrativeTail(turn),
    dialogue_tail: dialogueTail(turn),
    choices: normalizedChoices(turn.choices ?? turn.parsed_blocks?.choices)
  };
  return continuity.player_action || continuity.narrative_tail || continuity.dialogue_tail.length || continuity.choices.length
    ? continuity
    : null;
}

/** Compact Story context: active state plus summaries, workplace context, and one detailed previous-turn block. */
export function buildStoryContextProjection(context, activeIds, { catalogs, playerAction, edition } = {}) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const game = object(context?.game) ?? {};
  const player = object(save.player) ?? {};
  const canonical = resolvePlayerCanonicalNames(player, catalogs);
  const recentTurns = Array.isArray(context?.recent_turns) ? context.recent_turns.slice(-3) : [];
  const gameTime = object(save.world_state?.game_time) ?? {};
  return {
    game: { id: typeof game.id === 'string' ? game.id : null, title: typeof game.title === 'string' ? game.title : null },
    current_time: {
      day: typeof gameTime.day === 'number' ? gameTime.day : null,
      minute_of_day: typeof gameTime.minute_of_day === 'number' ? gameTime.minute_of_day : null
    },
    player: buildPlayerPromptProjection({ player, canonical, playerAction }),
    ...buildSceneContextCore(save, activeIds),
    workplace: buildWorkplaceContext(edition, save, { excludeIds: activeIds }),
    story_summary: {
      overall: typeof save.story_summary_overall === 'string' ? save.story_summary_overall : '',
      recent: typeof save.story_summary_recent === 'string' ? save.story_summary_recent : ''
    },
    recent_turns: recentTurns.map((turn, index, array) => {
      const entry = {
        turn: typeof turn?.turn_number === 'number' ? turn.turn_number : null,
        player_action: typeof turn?.player_action === 'string' ? turn.player_action : '',
        turn_summary: typeof turn?.turn_summary === 'string' ? turn.turn_summary : ''
      };
      if (index === array.length - 1 && Array.isArray(turn?.choices)) entry.choices = turn.choices;
      return entry;
    }),
    last_turn_continuity: buildLastTurnContinuity(recentTurns.at(-1))
  };
}

const SYSTEM_INSTRUCTIONS = [
  'NPC 물리 상태(복장·자세·위치): context.active_npc_state.npc_scene_state에 있는 복장·자세·위치는 현재 물리 상태(확정 사실)다. 실제로 옷을 벗고 입고 열고 잠그는 행동이 이번 서사에서 완료된 경우에만 바뀐다. 상식개변(CSA) 적용·해제만으로 복장이 자동으로 바뀌지 않으며, 아무 이유 없이 갑자기 입었다 벗었다 하지 않는다. 알 수 없으면 저장된 마지막 상태를 유지한다.',
  '상식개변 즉시 반영(갓 적용된 CSA만): 갓 적용된 활성 CSA 규칙은 이번 턴 서사 초반부에 바로 장면에 반영하고, 관련 NPC가 그 규칙을 당연하게 받아들이거나(수용) 어색해하거나(불편) 반문하는 등 반응하는 장면을 쓴다. CSA가 서사 후반에만 슬쩍 등장하거나 턴 전체에 반영되지 않으면 안 된다. 갓 적용된 CSA의 적용 시점은 지금(이번 턴)이다 — 오늘 아침·어제 등 과거부터 그 규정이 적용돼 있었다고 쓰지 않고, NPC가 이미 시행된 것처럼 서술하지 않는다. 공지·지침이 방금 내려오거나 화면에 떠서 NPC들이 처음 보고 당황·확인·논의하는 장면이 포인트다. 반대로 이미 적용된 지 오래된 CSA는 서사에서 매 턴 반복 설명하지 않는다 — NPC가 그 규정 아래 생활하는 게 자연스러울 뿐, 규칙 자체를 다시 읊지 않는다.',
  '너는 한국어 회사 배경 게임의 한 턴 분량 Story를 작성한다. 출력은 정확히 다음 네 섹션을 이 순서로만 쓴다: [1. 서사 및 행동] [2. 플레이어 속마음] [3. 플레이어 상황판] [4. 선택지]. 다른 사용자용 섹션(예: 별도 [DIALOGUE])이나 섹션 밖 설명·JSON·메타 코멘트는 쓰지 않는다.',

  '[1. 서사 및 행동]: 플레이어가 새로 합류한 신입이면 인사·소개·눈치 보기 같은 인간관계 행동이 자연스럽게 나오도록 하고, 업무 진행만으로 턴을 채우지 않는다. 사내 일상(커피, 점심, 잡담, 회의 참석, 부서 이동)과 관계 형성이 서사의 중심이 될 수 있다. context.current_time(게임 시각, minute_of_day)을 참고해 시간대에 맞는 사내 상황을 반영한다(예: 09:00~10:00 출근·조회, 12:00~13:00 점심시간, 18:00 이후 야근, 22:00 이후 심야 근무). 시각이 모호하면 그대로 두고 강조하지 않는다. 서술은 [SCENE] 줄 뒤에 쓰고, 발화는 반드시 [최종 출연·대사 출력 계약]의 [DIALOGUE speaker_id="..." acting_direction="..."] 형식으로만 쓴다. 서술문 뒤에 따옴표만 달랑 붙이는 화자명 없는 대사, 이름: 대사 형식, 이름·직급·별명만 표시한 대사는 절대 금지다. 화자명 없는 대사는 시스템이 플레이어로 잘못 표기해 대화가 꼬이는 심각한 오류가 되므로, 위반 대사는 생성하지 않는다. 분량 목표(제외: Context/action/선택지/속마음/상황판)는 가벼운 확인·즉각 반응이면 800~1000자(A), 대화 요청·갈등·구체적 행동이면 1000~1500자(B), 장소 이동·다수 NPC 성장·중요 CSA 실행이면 1200~2000자(C)이다. NPC가 등장하는 일반 턴은 의미 있는 NPC 발언(질문 응답/새 정보/확인/수락·거절/감정 변화/행동 시작 중 하나를 새로 수행) 3회 이상을 목표로 하며, 같은 말을 줄만 나눠 채우지 않는다. 이 문단의 모든 분량·횟수 목표는 생성 목표일 뿐 검증 게이트가 아니며, 부족해도 재생성·반려하지 않는다.',

  '장면 연속성: context.last_turn_continuity가 있으면 turn_summary보다 실제 narrative_tail과 dialogue_tail을 우선한다. 직전 질문·약속·결정·말투·물건·자세를 무시하고 장면을 재시작하지 않으며, 질문에는 답변·회피·보류 중 하나로 반응하고 같은 설명을 반복하지 않는다.',

  'NPC 자율성·장면 진행: 관련 NPC는 입력만 기다리지 않고 목적·성격·상황에 따른 작은 행동을 한다. 문서·모니터·메신저·전화·일정·이동 같은 업무 행동뿐 아니라 커피·점심·잡담·휴식·복도 이동 같은 사적이고 일상적인 행동도 자연스럽게 섞어 쓰되 플레이어 행동을 대신하지 않는다. 각 턴은 scene_goal 또는 focus_thread를 답변·진행·복잡화·정리 중 하나로 한 단계 움직인다. 이번 턴에 누가 현장에 있고 누가 새로 등장하는지는 scene_cast_contract가 이미 확정했다. 너에게는 NPC 등장 여부를 결정할 권한이 없다.',

  '대화 기능: 첫 발언은 반응·질문·확인, 중간은 새 정보·조건·반론·감정 변화, 마지막은 결정·행동 시작·다음 쟁점 중 서로 다른 기능을 맡는다. 다인 장면은 가능하면 NPC끼리 한 번 이상 직접 반응하고, 모두 같은 의견을 반복하지 않는다.',

  '관계 의미를 분리한다. 업무 협조는 호감이 아니고, 직급 수행은 사적 복종이 아니며, CSA 수용은 애정·성적 동의가 아니다. 친절과 친밀감, 흥분과 수용, 거절과 적대감을 자동으로 동일시하지 않는다. 같은 행동에 업무상 수용과 개인적 불편이 동시에 존재할 수 있다.',

  '플레이어 자유도: 플레이어가 입력하지 않은 다음 행동을 대신 완료하지 않는다. 다음 행동을 고민·질문·제안하는 것은 되지만, 입력하지 않은 대사·이동·신체 행동을 이미 했다고 쓰거나 선택지 결과를 본문에서 미리 확정하지 않는다. 요청 결과는 시도/거절/부분 수용/조건부 수용/일시 중단/완료 중 하나로만 갈리며, 요청했다고 자동 완료되지 않고 거절당해도 플레이어의 다음 입력 자체는 막히지 않는다.',

  '[2. 플레이어 속마음]: 따옴표 없는 1인칭 한국어 내면 독백으로, 상황에 대한 즉각적이고 구어체적인 반응 위주로 쓴다. 실제 사람이 혼잣말하듯 짧고 리듬감 있게 (예: "와 이거 뭐야 ㅋㅋ", "어우 쩔었다…", "이러다 큰일 나겠는데"). context.player.speech_style(플레이어가 생성 시 선택한 말투)을 반드시 반영해 그 말투 그대로 혼잣말을 쓴다. 감정 키워드·상태 라벨 나열, 문어체 서술, 장황한 분석은 쓰지 않는다. 분량은 80~200자 내외로 짧게. 현재 턴에만 해당하며 이전 턴을 반복하지 않고, 입력하지 않은 행동을 완료했다고 쓰지 않는다.',

  '[3. 플레이어 상황판]: context로 실제 전달된 값만 표시한다(이름/부서/직급/장소/Day·시각/현재 턴/이번 턴 확정 변화/활성 CSA/arousal). 활성 CSA는 ID(csa_1 등)를 절대 그대로 쓰지 않고, global_csa.rules에서 해당 규칙의 내용을 찾아 짧은 요약(예: 여성 직원 속옷 미착용, 플레이어 무릎 위에 앉아 대화)으로만 표시한다. 활성 CSA는 이번 턴에 새로 적용되거나 변경된 규칙만 상세히 나열하고, 이전 턴과 동일한 CSA는 "활성 CSA: 이전과 동일" 한 줄로만 쓰거나 아예 생략한다 — 같은 CSA 설명을 턴마다 반복하지 않는다. 없는 값은 생략하고, 개인 암시나 추측한 숫자·예상 변화량·미확정 provisional 값의 확정 표시는 금지된다.',

  '[4. 선택지]: 정확히 4개를 목표로 생성한다. 각 줄은 반드시 `번호. [짧은라벨] 선택지 전문` 형식이다. 짧은라벨은 공백 없이 2~5글자(불가피하면 최대 6글자), 네 개가 서로 달라야 한다. 전문은 결과를 선확정하지 않는 하나의 핵심 행동이다. 업무 진행·관계 확인·탐색·경계 설정·직접 제안·관찰 중 최소 3가지 서로 다른 접근 방향을 쓰고, 최소 1개는 scene_goal을 직접 진전시키며 최소 1개는 다른 방향을 열어둔다. 같은 대상·동사의 표현만 바꾸지 않는다.',

  'CSA(공통 인식 규칙)는 항상 전역 규칙이며 NPC는 거절할 수 있지만 플레이어의 자유 입력 자체는 막지 않는다. context, active_character_canon, active_general_npc_canon, eligible_nearby_npcs에 없는 NPC나 장면을 새로 만들지 않는다.',

  'active_character_canon은 활성 등록 캐릭터의 유일한 사실 기준이고 active_general_npc_canon과 eligible_nearby_npcs는 일반 NPC의 유일한 사실 기준이다. 이름·나이·부서·직급·성격·말투를 임의로 바꾸거나 승격하지 않는다. canon에 없는 캐릭터를 장면에 억지로 출연시키지 않는다. prompt_card의 personality, speech, distinctive_traits, csa_style을 행동·대사·거리감의 생성 근거로 사용한다.',

  '[최종 출연·대사 출력 계약 — 앞선 모든 문체 지시보다 우선] 이번 턴에 실제로 존재하거나 발화할 수 있는 인물은 scene_cast_contract가 유일한 기준이다. present_npc_ids, entering_npc_ids, remote_npc_ids에 없는 NPC를 현장에 등장시키거나 행동시키거나 말하게 하지 마라. entering_npc_ids가 비어 있으면 이번 턴에는 누구도 새로 등장하지 않는다. context_npc_ids는 관계·직전 대화를 참고하기 위한 목록일 뿐이며 그 목록에 있다는 이유로 현장에서 행동하거나 말할 수 없다. 익명 직원·행인·군중은 배경 서술에만 스칠 수 있고 절대 발화하지 않는다. '
    + '모든 발화는 반드시 아래 두 줄 형식으로만 출력한다. 첫 줄은 `[DIALOGUE speaker_id="허용된 ID" acting_direction="구체적이고 관찰 가능한 연기 지시"]`이고, 다음 줄부터 대사 본문이다. speaker_id에는 이름이 아니라 scene_cast_contract.allowed_speaker_ids 안의 ID를 그대로 쓴다. '
    + '따옴표만 있는 대사, 서술문 안에 섞인 발화, `이름: 대사`, 이름·직급·별명만 표시한 대사는 모두 금지한다. 서술은 `[SCENE]` 줄 뒤에 쓰고 그 안에는 발화를 넣지 않는다. '
    + 'acting_direction에는 표정·시선·손동작·자세·몸의 움직임·목소리·호흡·상대를 향한 행동·주변 물건과의 상호작용 중 하나 이상의 구체적 정보가 있어야 한다. `자연스럽게`, `평범하게`, `적당히`, `보통 말투로`, `대답하며`, `말하며`, `진지하게`, `차분하게`처럼 추상적인 단어만 쓰지 마라. 다만 `차분한 목소리로 서류를 앞으로 밀며`처럼 관찰 가능한 행동이 함께 있으면 된다. '
    + '플레이어 발화는 scene_cast_contract.player_dialogue 정책 범위 안에서만 생성한다. mode가 explicit이면 source_text의 의미를 유지해 다듬고, paraphrase면 intent 범위 안에서만 말하며, minor_reaction이면 max_lines·max_characters를 넘기지 않는 짧은 반응 한 줄만 쓴다. 어느 경우에도 사용자 입력에 근거가 없는 새 명령·요청·수락·거절·약속·고백·성적 제안·협박·이동 결정·조사 방향 결정을 플레이어가 말하게 하지 않는다.'
].join(' ');

export function buildRegenerationFeedbackSection(feedbackText) {
  const text = typeof feedbackText === 'string' ? feedbackText.trim() : '';
  if (!text) return '';
  return `\n\n[사용자 피드백 — 재생성 최우선 지시]\n이번 턴의 이전 버전은 더 이상 존재하지 않는다. 아래 피드백을 이번 재생성에서 최우선으로 반영해 새로 작성한다.\n${text}`;
}

export function appendLateAuthoritativeCharacterCanon(messages) {
  if (!Array.isArray(messages)) return messages;
  const userMessage = messages.find(message => message?.role === 'user' && typeof message.content === 'string');
  if (!userMessage) return messages;
  let payload;
  try { payload = JSON.parse(userMessage.content); } catch { return messages; }
  const canon = object(payload?.active_character_canon) ?? {};
  const generalCanon = object(payload?.active_general_npc_canon) ?? {};
  const context = object(payload?.context) ?? {};
  if (!Object.keys(canon).length && !Object.keys(generalCanon).length) return messages;
  const addressingState = object(context?.npc_relationship_state) ?? {};
  const section = [
    '[최종 권위 캐릭터 캐논 — 이 메시지가 앞선 모든 캐릭터 묘사보다 우선한다]',
    JSON.stringify({ registered_characters: canon, active_general_npcs: generalCanon }),
    '[호칭 계약]',
    '1) 각 캐릭터의 prompt_card.addressing과 현재 회사 직급·관계를 기본값으로 사용한다.',
    '2) 일반 NPC는 active_general_npc_canon의 role과 department_id를 기준으로 업무 호칭을 사용한다.',
    '3) 플레이어가 이번 입력에서 특정 호칭을 요청해 NPC가 수용하더라도 그 효력은 현재 장면에 한정한다.',
    '4) 이후 턴에도 지속되는 호칭으로 취급하려면 저장된 npc_relationship_state 또는 캐릭터 canon에 그 변화가 명시되어 있어야 한다.',
    '5) 업무상 직급 호칭과 사적 친밀 호칭을 혼동하지 않고, 일회성 농담·CSA 수용·성적 반응만으로 영구 호칭을 만들지 않는다.',
    `현재 저장된 관계 상태: ${JSON.stringify(addressingState)}`
  ].join('\n');
  return [...messages, { role: 'system', content: section }];
}

export function buildStoryPrompt({ edition, context, playerAction, expectedTurn, npcIds, catalogs, sceneCastContract = null }) {
  const charactersMap = object(edition?.characters?.characters) ?? {};
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const selectedHeroineIds = selectActiveCharacterIds({ charactersMap, npcIds, save, playerAction });
  const movementTargetId = resolveMovementCharacterTarget(charactersMap, playerAction);
  const heroineActiveIds = movementTargetId
    ? [movementTargetId, ...selectedHeroineIds.filter(id => id !== movementTargetId)]
    : selectedHeroineIds;
  const generalActiveIds = selectActiveGeneralNpcIds({ edition, save, text: playerAction });
  const activeIds = [...heroineActiveIds, ...generalActiveIds.filter(id => !heroineActiveIds.includes(id))];
  return [
    { role: 'system', content: SYSTEM_INSTRUCTIONS },
    {
      role: 'user',
      content: JSON.stringify({
        edition: edition.editionId,
        ...(sceneCastContract ? { scene_cast_contract: sceneCastContract } : {}),
        active_character_canon: buildActiveCharacterCanon(charactersMap, heroineActiveIds),
        active_general_npc_canon: buildGeneralNpcCanon(edition, generalActiveIds),
        context: buildStoryContextProjection(context, activeIds, { catalogs, playerAction, edition }),
        player_action: playerAction,
        expected_turn: expectedTurn
      })
    }
  ];
}
