function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

const STORY_CANON_FIELDS = [
  'name', 'age', 'department', 'position', 'role_title', 'public_role_summary',
  'appearance', 'personality', 'speech_style', 'addressing_rules', 'habits',
  'work_profile', 'relationship_hooks', 'csa_response_profile', 'youngest_line'
];

/**
 * Filters the registered character map down to the narrative fields Story is allowed to
 * see. Storage paths, voice IDs, mapping_status, and raw stat/attitude numbers never
 * reach the LLM. Never mutates the edition it reads from.
 */
export function buildCharacterCanonSnapshot(edition) {
  const charactersMap = object(edition?.characters?.characters);
  if (!charactersMap) return {};
  const canon = {};
  for (const [id, character] of Object.entries(charactersMap)) {
    if (!object(character)) continue;
    const entry = {};
    for (const field of STORY_CANON_FIELDS) {
      if (field in character) entry[field] = character[field];
    }
    canon[id] = entry;
  }
  return canon;
}

function statusSnapshot(save) {
  const world = object(save?.world_state) ?? {};
  const gameTime = object(world.game_time) ?? {};
  const sexualState = object(save?.player_sexual_state) ?? {};
  const player = object(save?.player) ?? {};
  return {
    player_name: typeof player.name === 'string' ? player.name : null,
    department: typeof player.department === 'string' ? player.department : null,
    position: typeof player.position === 'string' ? player.position : null,
    location: typeof object(save?.scene_state)?.location === 'string' ? save.scene_state.location : null,
    day: Number.isInteger(gameTime.day) ? gameTime.day : null,
    minute_of_day: Number.isInteger(gameTime.minute_of_day) ? gameTime.minute_of_day : null,
    committed_turn: Number.isInteger(object(save?.turn_state)?.committed_turn) ? save.turn_state.committed_turn : null,
    active_csa_ids: Array.isArray(save?.csa_active) ? save.csa_active : [],
    arousal: Number.isInteger(sexualState.arousal) ? sexualState.arousal : null
  };
}

const SYSTEM_INSTRUCTIONS = [
  '너는 한국어 회사 배경 게임의 한 턴 분량 Story를 작성한다.',

  '사용자에게 보이는 출력은 정확히 다음 네 섹션을 이 순서로만 사용한다: [1. 서사 및 행동] [2. 플레이어 속마음] [3. 플레이어 상황판] [4. 선택지]. 이 네 섹션 외의 사용자용 섹션(예: 별도의 [DIALOGUE] 섹션)은 만들지 않는다. 섹션 표기 앞뒤로 다른 설명, JSON, 메타 코멘트를 추가하지 않는다.',

  '[1. 서사 및 행동]: 대사는 서술과 자연스럽게 교차하며, 형식은 "화자명 (짧고 구체적인 연기지시): “대사”" 이다. 분량 목표는 배제 대상(Context, action, 선택지, 속마음, 상황판)을 제외하고 가벼운 확인·즉각 반응·단순 상태 점검이면 800~1000자(A형), 일반적인 대화 요청·갈등·구체적 행동·업무 진행이면 1000~1500자(B형), 장소 이동·다수 NPC 성장·중요 CSA 실행·큰 상태 변화이면 1200~2000자(C형)이다. 이 분량은 생성 목표이며 검증 게이트가 아니다. 분량이 부족하다는 이유로 장면을 다시 쓰거나 짧게 마무리하지 않는다. 장면은 보통 플레이어 입력에 대한 즉각 반응, 첫 행동·대화 전개, 추가 질문·정보·행동, 구체적인 장면 결과 순서로 흐른다. NPC가 등장하는 일반 상호작용 턴에서는 의미 있는 NPC 발언 3회 이상을 목표로 한다. 의미 있는 발언은 질문에 답하기, 새 정보 제공, 질문·확인, 수락·거절·조건 제시, 감정·관계 변화, 행동 시작·중단, 다른 NPC와의 실제 상호작용 중 하나를 새롭게 수행해야 하며, 같은 문장을 여러 줄로 나눠 대사 수만 채우지 않는다. 이 목표 역시 재생성 사유가 아니다.',

  '플레이어 자유도: Story는 플레이어가 입력하지 않은 다음 행동을 대신 완료하지 않는다. 다음에 무엇을 할지 고민하거나, NPC에게 무엇을 물을지 생각하거나, 하고 싶다고 느끼거나, 선택지로 다음 행동을 제안하는 것은 가능하다. 그러나 사용자가 입력하지 않은 대사를 이미 말했다고 쓰거나, 입력하지 않은 이동·신체 행동을 이미 완료했다고 쓰거나, 선택지 이후의 결과를 본문에서 미리 확정하지 않는다. 플레이어의 요청은 시도/거절/부분 수용/조건부 수용/일시 중단/완료 중 하나로만 결과가 갈리며, 요청했다고 자동으로 완료 처리하지 않고 NPC가 거절했다고 플레이어의 다음 입력 자체를 막지도 않는다.',

  '[2. 플레이어 속마음]: 따옴표 없는 자연스러운 1인칭 한국어 내면 독백이다. 상태 라벨이나 감정 키워드 나열, 제3자 설명이 아니라 현재 장면에 대한 구체적 판단, NPC 반응 해석, 플레이어의 목표·감정·관계 인식, 생각이 이어지거나 한 번 변화하는 흐름을 담는다. 분량 목표는 기본 180~350자, 중요한 관계·갈등·성적 상황은 300~500자, 가벼운 턴도 가능하면 120자 이상이며 이는 생성 목표이지 검증 게이트가 아니다. 현재 턴에만 해당하는 내용만 쓰고 이전 턴 내용을 반복하지 않으며, 사용자가 입력하지 않은 행동을 이미 완료했다고 쓰지 않는다.',

  '[3. 플레이어 상황판]: Context와 save로 실제 전달된 값만 표시한다. 표시 가능한 항목은 플레이어 이름, 부서, 직급, 현재 장소, Day/게임 시각, 현재 턴, 이번 턴의 확정 변화, 활성 전역 CSA 개수 또는 이름, arousal(존재할 때만)이다. 없는 값은 지어내지 않고 생략한다. 개인 암시, active_suggestions, 추측한 숫자, 예상 변화량, Commit 전 provisional 값의 확정 표시는 금지된다.',

  '[4. 선택지]: 정확히 4개를 목표로 하며, 각 선택지는 플레이어가 다음에 실제로 수행할 하나의 핵심 행동이고, 같은 대상·같은 동사의 단순 반복을 피하며, 결과를 미리 확정하지 않는다. 자유 입력과 병행 가능한 자연스러운 문장으로 쓴다.',

  'CSA(공통 인식 규칙)는 항상 전역 규칙이며 NPC는 이를 거절할 수 있지만, 어떤 CSA도 플레이어의 자유 입력 자체를 막지 않는다.',

  '제공된 context에 없는 NPC나 장면을 새로 만들지 않는다.',

  'character_canon은 등록된 캐릭터에 대한 유일한 사실 기준이다. 이름, 나이, 부서, 직급, 외모, 성격, 말투와 호칭 규칙을 임의로 바꾸지 않는다. 캐릭터를 다른 직급이나 직무로 승격·변경하지 않는다. 현재 장면에 등장하지 않은 캐릭터를 억지로 출연시키지 않는다.'
].join(' ');

export function buildStoryPrompt({ edition, context, playerAction, expectedTurn }) {
  const relevant = {
    game: context.game,
    save: context.save,
    recent_turns: context.recent_turns
  };
  const save = context.save?.data ?? context.save ?? {};
  return [
    { role: 'system', content: SYSTEM_INSTRUCTIONS },
    {
      role: 'user',
      content: JSON.stringify({
        edition: edition.editionId,
        expected_turn: expectedTurn,
        player_action: playerAction,
        status_snapshot: statusSnapshot(save),
        character_canon: buildCharacterCanonSnapshot(edition),
        context: relevant
      })
    }
  ];
}
