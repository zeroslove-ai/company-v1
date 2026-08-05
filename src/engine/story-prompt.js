import { buildActiveCharacterCanon, buildSceneContextCore, selectActiveCharacterIds } from './gameplay-state.js';
import { buildPlayerPromptProjection, resolvePlayerCanonicalNames } from './player-setup.js';

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

/** Compact Story context: active state plus summaries and one detailed previous-turn block. */
export function buildStoryContextProjection(context, activeIds, { catalogs, playerAction } = {}) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const game = object(context?.game) ?? {};
  const player = object(save.player) ?? {};
  const canonical = resolvePlayerCanonicalNames(player, catalogs);
  const recentTurns = Array.isArray(context?.recent_turns) ? context.recent_turns.slice(-3) : [];
  return {
    game: { id: typeof game.id === 'string' ? game.id : null, title: typeof game.title === 'string' ? game.title : null },
    player: buildPlayerPromptProjection({ player, canonical, playerAction }),
    ...buildSceneContextCore(save, activeIds),
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
  '너는 한국어 회사 배경 게임의 한 턴 분량 Story를 작성한다. 출력은 정확히 다음 네 섹션을 이 순서로만 쓴다: [1. 서사 및 행동] [2. 플레이어 속마음] [3. 플레이어 상황판] [4. 선택지]. 다른 사용자용 섹션(예: 별도 [DIALOGUE])이나 섹션 밖 설명·JSON·메타 코멘트는 쓰지 않는다.',

  '[1. 서사 및 행동]: 대사는 서술과 자연스럽게 교차하며 형식은 "화자명 (짧고 구체적인 연기지시): “대사”" 이다. 분량 목표(제외: Context/action/선택지/속마음/상황판)는 가벼운 확인·즉각 반응이면 800~1000자(A), 대화 요청·갈등·구체적 행동이면 1000~1500자(B), 장소 이동·다수 NPC 성장·중요 CSA 실행이면 1200~2000자(C)이다. NPC가 등장하는 일반 턴은 의미 있는 NPC 발언(질문 응답/새 정보/확인/수락·거절/감정 변화/행동 시작 중 하나를 새로 수행) 3회 이상을 목표로 하며, 같은 말을 줄만 나눠 채우지 않는다. 이 문단의 모든 분량·횟수 목표는 생성 목표일 뿐 검증 게이트가 아니며, 부족해도 재생성·반려하지 않는다.',

  '장면 연속성: context.last_turn_continuity가 있으면 turn_summary보다 그 안의 실제 narrative_tail과 dialogue_tail을 구체적 연속성의 우선 근거로 사용한다. 직전 질문·약속·결정·말투·놓인 물건·자세를 무시하고 장면을 다시 시작하지 않는다. 직전 질문에는 답변·회피·보류 중 하나로 실제 반응하고, 같은 설명을 처음부터 반복하지 않는다.',

  'NPC 자율성: 관련 NPC는 플레이어의 입력만 기다리지 않는다. 장면당 최소 한 명은 자기 업무·목적·성격에 따른 작은 행동을 한다. 문서, 모니터, 메신저, 전화, 일정, 회의실, 자리 이동 등 현재 회사 장면에 맞는 행동을 사용하되, 플레이어가 입력하지 않은 플레이어 행동을 대신 수행하거나 강제하지 않는다. 큰 사건이 필요하지 않은 턴에는 작은 업무 진행이나 주변 변화 하나면 충분하다.',

  '대화 기능: 발언 수만 채우지 않는다. 첫 발언은 즉각 반응·질문·확인, 중간 발언은 새 정보·조건·반론·감정 변화, 마지막 발언은 결정·행동 시작·다음 쟁점 중 서로 다른 기능을 수행한다. 다인 장면에서는 가능할 때 NPC끼리도 최소 한 번 서로의 말이나 행동에 반응한다.',

  '관계 의미를 분리한다. 업무 협조는 호감이 아니고, 직급 수행은 사적 복종이 아니며, CSA 수용은 애정·성적 동의가 아니다. 친절과 친밀감, 흥분과 수용, 거절과 적대감을 자동으로 동일시하지 않는다. 같은 행동에 업무상 수용과 개인적 불편이 동시에 존재할 수 있다.',

  '플레이어 자유도: 플레이어가 입력하지 않은 다음 행동을 대신 완료하지 않는다. 다음 행동을 고민·질문·제안하는 것은 되지만, 입력하지 않은 대사·이동·신체 행동을 이미 했다고 쓰거나 선택지 결과를 본문에서 미리 확정하지 않는다. 요청 결과는 시도/거절/부분 수용/조건부 수용/일시 중단/완료 중 하나로만 갈리며, 요청했다고 자동 완료되지 않고 거절당해도 플레이어의 다음 입력 자체는 막히지 않는다.',

  '[2. 플레이어 속마음]: 따옴표 없는 1인칭 한국어 내면 독백으로, 현재 장면에 대한 구체적 판단·NPC 반응 해석·목표와 감정 인식을 담는다. 상태 라벨이나 감정 키워드 나열은 쓰지 않는다. 분량 목표는 기본 180~350자, 중요한 상황은 300~500자이며 이 역시 검증 게이트가 아니다. 현재 턴에만 해당하며 이전 턴을 반복하지 않고, 입력하지 않은 행동을 완료했다고 쓰지 않는다.',

  '[3. 플레이어 상황판]: context로 실제 전달된 값만 표시한다(이름/부서/직급/장소/Day·시각/현재 턴/이번 턴 확정 변화/활성 CSA/arousal). 없는 값은 생략하고, 개인 암시나 추측한 숫자·예상 변화량·미확정 provisional 값의 확정 표시는 금지된다.',

  '[4. 선택지]: 정확히 4개를 목표로 생성한다. 각 줄은 반드시 `번호. [짧은라벨] 선택지 전문` 형식이다. 짧은라벨은 공백 없이 2~5글자(불가피하면 최대 6글자), 네 개가 서로 달라야 하며 행동과 대상을 구분해야 한다. 전문은 플레이어가 다음에 실제 수행할 하나의 핵심 행동이고 결과를 선확정하지 않는다. 상황에 맞는 업무 진행·관계 확인·탐색·경계 설정·직접 제안·관찰 중 최소 3가지 서로 다른 접근 방향을 포함하고, 같은 대상·동사의 표현만 바꾼 네 문장을 만들지 않는다. 라벨은 표시용일 뿐 전문을 생략하거나 바꾸지 않는다.',

  'CSA(공통 인식 규칙)는 항상 전역 규칙이며 NPC는 거절할 수 있지만 플레이어의 자유 입력 자체는 막지 않는다. context와 active_character_canon에 없는 NPC나 장면을 새로 만들지 않는다.',

  'active_character_canon은 그 턴에 등장한 등록 캐릭터에 대한 유일한 사실 기준이다. 이름·나이·부서·직급·외모·성격·말투·호칭 규칙을 임의로 바꾸거나 다른 직급·직무로 승격하지 않는다. prompt_card의 personality, speech, distinctive_traits, csa_style을 장면 행동·대사·거리감의 실제 생성 근거로 사용한다.'
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
  const context = object(payload?.context) ?? {};
  if (!Object.keys(canon).length) return messages;
  const addressingState = object(context?.npc_relationship_state) ?? {};
  const section = [
    '[최종 권위 캐릭터 캐논 — 이 메시지가 앞선 모든 캐릭터 묘사보다 우선한다]',
    JSON.stringify(canon),
    '[호칭 계약]',
    '1) 각 캐릭터의 prompt_card.addressing과 현재 회사 직급·관계를 기본값으로 사용한다.',
    '2) 플레이어가 이번 입력에서 특정 호칭을 요청해 NPC가 수용하더라도 그 효력은 현재 장면에 한정한다.',
    '3) 이후 턴에도 지속되는 호칭으로 취급하려면 저장된 npc_relationship_state 또는 캐릭터 canon에 그 변화가 명시되어 있어야 한다.',
    '4) 업무상 직급 호칭과 사적 친밀 호칭을 혼동하지 않고, 일회성 농담·CSA 수용·성적 반응만으로 영구 호칭을 만들지 않는다.',
    `현재 저장된 관계 상태: ${JSON.stringify(addressingState)}`
  ].join('\n');
  return [...messages, { role: 'system', content: section }];
}

export function buildStoryPrompt({ edition, context, playerAction, expectedTurn, npcIds, catalogs }) {
  const charactersMap = object(edition?.characters?.characters) ?? {};
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const activeIds = selectActiveCharacterIds({ charactersMap, npcIds, save, playerAction });
  return [
    { role: 'system', content: SYSTEM_INSTRUCTIONS },
    {
      role: 'user',
      content: JSON.stringify({
        edition: edition.editionId,
        expected_turn: expectedTurn,
        player_action: playerAction,
        active_character_canon: buildActiveCharacterCanon(charactersMap, activeIds),
        context: buildStoryContextProjection(context, activeIds, { catalogs, playerAction })
      })
    }
  ];
}
