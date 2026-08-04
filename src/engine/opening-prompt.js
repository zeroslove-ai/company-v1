import { buildActiveCharacterCanon } from './gameplay-state.js';
import { buildOpeningPlayerProjection } from './player-setup.js';

const BACKGROUND_MAX = 120;

/** Splits the opening LLM output into the one-sentence background and the standard four-section body. */
export function splitOpeningSections(rawText) {
  const raw = String(rawText ?? '');
  const bodyIndex = raw.indexOf('[1. 서사 및 행동]');
  const head = bodyIndex === -1 ? raw : raw.slice(0, bodyIndex);
  const body = bodyIndex === -1 ? '' : raw.slice(bodyIndex);
  const backgroundMatch = /\[배경\]\s*([\s\S]*)/.exec(head);
  const rawBackground = (backgroundMatch ? backgroundMatch[1] : head).trim();
  const truncated = Array.from(rawBackground).length > BACKGROUND_MAX;
  const background = truncated ? `${Array.from(rawBackground).slice(0, BACKGROUND_MAX - 1).join('')}…` : rawBackground;
  return { background, body, warnings: truncated ? ['opening_background_truncated'] : [] };
}

const SYSTEM_INSTRUCTIONS = [
  '너는 한국어 회사 배경 게임의 오프닝(첫 장면)을 작성한다. 플레이어의 입력은 아직 없으며, 이번이 플레이어가 이 회사에 등장하는 첫 순간이다.',

  '출력은 정확히 다음 순서로 쓴다: [배경] 한 문장, 최대 120자로 플레이어가 이 회사에 오게 된 배경을 요약한다. 이어서 일반 턴과 동일한 네 섹션 [1. 서사 및 행동] [2. 플레이어 속마음] [3. 플레이어 상황판] [4. 선택지]를 쓴다. 이 다섯 섹션 외의 사용자용 섹션이나 섹션 밖 설명·JSON·메타 코멘트는 쓰지 않는다.',

  'opening_plan에 주어진 요일·시각·장소·업무 계기·장면 목표를 그대로 사용한다. 다른 요일, 시각, 장소를 임의로 만들지 않는다. active_character_canon에 있는 인물만 등장시키며, 없는 인물을 새로 등장시키지 않는다.',

  '[1. 서사 및 행동]: 대사는 서술과 자연스럽게 교차하며 형식은 "화자명 (짧고 구체적인 연기지시): "대사"" 이다. 목표 분량은 1000~1500자이며 이는 생성 목표일 뿐 검증 게이트가 아니다. 플레이어가 아직 입력하지 않은 다음 행동이나 대사를 대신 완료하지 않는다 — 오프닝은 상황을 설정할 뿐, 이후 행동은 선택지를 통해 플레이어가 정한다.',

  '[2. 플레이어 속마음]: 따옴표 없는 1인칭 한국어 내면 독백. 목표 180~350자이며 검증 게이트가 아니다.',

  '[3. 플레이어 상황판]: player와 opening_plan으로 실제 전달된 값만 표시한다. 없는 값은 지어내지 않는다.',

  '[4. 선택지]: 반드시 정확히 4개를 생성한다. 각 줄은 `번호. [짧은라벨] 선택지 전문` 형식이다. 짧은라벨은 공백 없이 2~5글자(불가피하면 최대 6글자), 네 개가 서로 달라야 한다. 전문은 플레이어가 Turn 1에 실제 수행할 하나의 핵심 행동이며, 라벨은 표시용일 뿐 전문을 생략하지 않는다.',

  'player의 height_cm/weight_kg/body_type은 배경 설명이나 외모 묘사가 실제로 필요할 때만 자연스럽게 반영하고, 매 문장 나열하지 않는다. speech_style은 플레이어의 대사와 속마음 문체에만 영향을 준다 — 말투만으로 플레이어가 입력하지 않은 폭언·행동·범죄를 자동 수행하지 않는다.'
].join(' ');

export function buildOpeningPrompt({ edition, player, canonical, openingPlan, expectedTitle }) {
  const charactersMap = edition?.characters?.characters ?? {};
  const activeIds = [openingPlan?.primary_character_id, ...(openingPlan?.supporting_character_ids ?? [])].filter(Boolean);
  const crossTeamNote = player?.position_id === 'tf_lead' && player?.department_id === 'brand_strategy'
    ? '이 TF팀장은 서원희의 브랜드전략팀장 직책을 대체하지 않는다. 별도 프로젝트 TF 또는 부서 간 협업 조직의 팀장이다.'
    : null;
  return [
    { role: 'system', content: SYSTEM_INSTRUCTIONS },
    {
      role: 'user',
      content: JSON.stringify({
        edition: edition.editionId,
        player: buildOpeningPlayerProjection({ player, canonical }),
        opening_plan: {
          weekday: openingPlan?.weekday, minute_of_day: openingPlan?.minute_of_day,
          location_name: openingPlan?.location_name, work_hook_label: openingPlan?.work_hook_label,
          scene_goal: openingPlan?.scene_goal
        },
        cross_team_note: crossTeamNote,
        active_character_canon: buildActiveCharacterCanon(charactersMap, activeIds)
      })
    }
  ];
}
