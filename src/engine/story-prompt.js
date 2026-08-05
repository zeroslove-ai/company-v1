import { buildActiveCharacterCanon, buildSceneContextCore, selectActiveCharacterIds } from './gameplay-state.js';
import { buildPlayerPromptProjection, resolvePlayerCanonicalNames } from './player-setup.js';
import {
  buildGeneralNpcCanon,
  buildWorkplaceContext,
  selectActiveGeneralNpcIds
} from './workplace-context.js';

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

/** Compact Story context: active state plus summaries, workplace context, and one detailed previous-turn block. */
export function buildStoryContextProjection(context, activeIds, { catalogs, playerAction, edition } = {}) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const game = object(context?.game) ?? {};
  const player = object(save.player) ?? {};
  const canonical = resolvePlayerCanonicalNames(player, catalogs);
  const recentTurns = Array.isArray(context?.recent_turns) ? context.recent_turns.slice(-3) : [];
  return {
    game: { id: typeof game.id === 'string' ? game.id : null, title: typeof game.title === 'string' ? game.title : null },
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
  '너는 한국어 회사 배경 게임의 한 턴 분량 Story를 작성한다. 출력은 정확히 다음 네 섹션을 이 순서로만 쓴다: [1. 서사 및 행동] [2. 플레이어 속마음] [3. 플레이어 상황판] [4. 선택지]. 다른 사용자용 섹션(예: 별도 [DIALOGUE])이나 섹션 밖 설명·JSON·메타 코멘트는 쓰지 않는다.',

  '[1. 서사 및 행동]: 대사는 서술과 자연스럽게 교차하며 형식은 "화자명 (짧고 구체적인 연기지시): “대사”" 이다. 분량 목표(제외: Context/action/선택지/속마음/상황판)는 가벼운 확인·즉각 반응이면 800~1000자(A), 대화 요청·갈등·구체적 행동이면 1000~1500자(B), 장소 이동·다수 NPC 성장·중요 CSA 실행이면 1200~2000자(C)이다. NPC가 등장하는 일반 턴은 의미 있는 NPC 발언(질문 응답/새 정보/확인/수락·거절/감정 변화/행동 시작 중 하나를 새로 수행) 3회 이상을 목표로 하며, 같은 말을 줄만 나눠 채우지 않는다. 이 문단의 모든 분량·횟수 목표는 생성 목표일 뿐 검증 게이트가 아니며, 부족해도 재생성·반려하지 않는다.',

  '장면 연속성: context.last_turn_continuity가 있으면 turn_summary보다 실제 narrative_tail과 dialogue_tail을 우선한다. 직전 질문·약속·결정·말투·물건·자세를 무시하고 장면을 재시작하지 않으며, 질문에는 답변·회피·보류 중 하나로 반응하고 같은 설명을 반복하지 않는다.',

  'NPC 자율성·장면 진행: 관련 NPC는 입력만 기다리지 않고 업무·목적·성격에 따른 작은 행동을 한다. 문서·모니터·메신저·전화·일정·이동 등 현재 workplace에 맞는 행동을 쓰되 플레이어 행동을 대신하지 않는다. 각 턴은 scene_goal 또는 focus_thread를 답변·진행·복잡화·정리 중 하나로 한 단계 움직인다. context.workplace.eligible_nearby_npcs는 진입 허용 후보일 뿐 현장 인원이 아니다. 구체적 업무 이유가 있을 때 최대 1명만 노크·호출·이동을 보여준 뒤 등장시킬 수 있고 후보 밖 NPC는 만들지 않는다.',

  '대화 기능: 첫 발언은 반응·질문·확인, 중간은 새 정보·조건·반론·감정 변화, 마지막은 결정·행동 시작·다음 쟁점 중 서로 다른 기능을 맡는다. 다인 장면은 가능하면 NPC끼리 한 번 이상 직접 반응하고, 모두 같은 의견을 반복하지 않는다.',

  '관계 의미를 분리한다. 업무 협조는 호감이 아니고, 직급 수행은 사적 복종이 아니며, CSA 수용은 애정·성적 동의가 아니다. 친절과 친밀감, 흥분과 수용, 거절과 적대감을 자동으로 동일시하지 않는다. 같은 행동에 업무상 수용과 개인적 불편이 동시에 존재할 수 있다.',

  '플레이어 자유도: 플레이어가 입력하지 않은 다음 행동을 대신 완료하지 않는다. 다음 행동을 고민·질문·제안하는 것은 되지만, 입력하지 않은 대사·이동·신체 행동을 이미 했다고 쓰거나 선택지 결과를 본문에서 미리 확정하지 않는다. 요청 결과는 시도/거절/부분 수용/조건부 수용/일시 중단/완료 중 하나로만 갈리며, 요청했다고 자동 완료되지 않고 거절당해도 플레이어의 다음 입력 자체는 막히지 않는다.',

  '[2. 플레이어 속마음]: 따옴표 없는 1인칭 한국어 내면 독백으로, 현재 장면에 대한 구체적 판단·NPC 반응 해석·목표와 감정 인식을 담는다. 상태 라벨이나 감정 키워드 나열은 쓰지 않는다. 분량 목표는 기본 180~350자, 중요한 상황은 300~500자이며 이 역시 검증 게이트가 아니다. 현재 턴에만 해당하며 이전 턴을 반복하지 않고, 입력하지 않은 행동을 완료했다고 쓰지 않는다.',

  '[3. 플레이어 상황판]: context로 실제 전달된 값만 표시한다(이름/부서/직급/장소/Day·시각/현재 턴/이번 턴 확정 변화/활성 CSA/arousal). 없는 값은 생략하고, 개인 암시나 추측한 숫자·예상 변화량·미확정 provisional 값의 확정 표시는 금지된다.',

  '[4. 선택지]: 정확히 4개를 목표로 생성한다. 각 줄은 반드시 `번호. [짧은라벨] 선택지 전문` 형식이다. 짧은라벨은 공백 없이 2~5글자(불가피하면 최대 6글자), 네 개가 서로 달라야 한다. 전문은 결과를 선확정하지 않는 하나의 핵심 행동이다. 업무 진행·관계 확인·탐색·경계 설정·직접 제안·관찰 중 최소 3가지 서로 다른 접근 방향을 쓰고, 최소 1개는 scene_goal을 직접 진전시키며 최소 1개는 다른 방향을 열어둔다. 같은 대상·동사의 표현만 바꾸지 않는다.',

  'CSA(공통 인식 규칙)는 항상 전역 규칙이며 NPC는 거절할 수 있지만 플레이어의 자유 입력 자체는 막지 않는다. context, active_character_canon, active_general_npc_canon, eligible_nearby_npcs에 없는 NPC나 장면을 새로 만들지 않는다.',

  'active_character_canon은 활성 등록 캐릭터의 유일한 사실 기준이고 active_general_npc_canon과 eligible_nearby_npcs는 일반 NPC의 유일한 사실 기준이다. 이름·나이·부서·직급·성격·말투를 임의로 바꾸거나 승격하지 않는다. canon에 없는 캐릭터를 장면에 억지로 출연시키지 않는다. prompt_card의 personality, speech, distinctive_traits, csa_style을 행동·대사·거리감의 생성 근거로 사용한다.',

  '[최종 대사 출력 계약 — 앞선 모든 문체 지시보다 우선] 모든 실제 발화는 반드시 별도 한 줄에 `등록된 전체 이름 (비어 있지 않은 짧고 구체적인 연기톤): “대사”`로 쓴다. 괄호·연기톤·콜론·한국어 큰따옴표 중 하나라도 생략하지 않는다. `이름: 대사`, 따옴표만 있는 대사, 서술문 안에 섞인 발화, 등록되지 않은 별명·직급만을 화자명으로 쓰는 형식은 금지한다. 발화가 아닌 서술에는 이 형식을 쓰지 않는다.'
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

export function buildStoryPrompt({ edition, context, playerAction, expectedTurn, npcIds, catalogs }) {
  const charactersMap = object(edition?.characters?.characters) ?? {};
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const heroineActiveIds = selectActiveCharacterIds({ charactersMap, npcIds, save, playerAction });
  const generalActiveIds = selectActiveGeneralNpcIds({ edition, save, text: playerAction });
  const activeIds = [...heroineActiveIds, ...generalActiveIds.filter(id => !heroineActiveIds.includes(id))];
  return [
    { role: 'system', content: SYSTEM_INSTRUCTIONS },
    {
      role: 'user',
      content: JSON.stringify({
        edition: edition.editionId,
        active_character_canon: buildActiveCharacterCanon(charactersMap, heroineActiveIds),
        active_general_npc_canon: buildGeneralNpcCanon(edition, generalActiveIds),
        context: buildStoryContextProjection(context, activeIds, { catalogs, playerAction, edition }),
        player_action: playerAction,
        expected_turn: expectedTurn
      })
    }
  ];
}
