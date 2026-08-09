import test from 'node:test';
import assert from 'node:assert/strict';

import { buildExtractCharacterCanon, buildExtractPrompt } from '../src/engine/extract-prompt.js';
import { buildOpeningPrompt } from '../src/engine/opening-prompt.js';
import { buildStoryContextProjection, buildStoryPrompt } from '../src/engine/story-prompt.js';

const characters = {
  heroine3: {
    name: '김제나',
    position: '사원',
    role_title: '주니어 브랜드 플래너',
    prompt_card: {
      identity: '입사 3개월 차 24세 사원. 표정과 분위기를 읽는 관찰형 신입.',
      appearance: '적갈색 장발과 맑은 회갈색 눈.',
      personality: '수줍지만 수동적이지 않다. 확신이 생기면 조용히 핵심을 짚는다.',
      speech: '조심스러운 존댓말로 전제를 붙이다가도 확신이 서면 분명해진다.',
      addressing: '선배에게는 직급·선배 호칭을 쓴다.',
      distinctive_traits: ['표정에 감정이 드러남', '준비 부족을 자책', '타이밍형 유머'],
      csa_style: '주변 반응을 먼저 살피며 겉으로 적응해도 불안이 오래 남는다.',
      physical_reaction: '절대 전달되면 안 됨'
    }
  },
  heroine5: {
    name: '이메이',
    position: '사원',
    role_title: '브랜드 커뮤니티·SNS 주니어 플래너',
    prompt_card: {
      identity: '커뮤니티와 참여를 움직이는 행동형 신입.',
      personality: '낯가림이 풀리면 아이디어가 넘치고 팀 분위기를 밝힌다.',
      speech: '친해지면 말이 길어지고 즉흥적인 아이디어를 바로 공유한다.',
      addressing: '공식 회의에서는 별명을 쓰지 않는다.',
      distinctive_traits: ['실패 후 회복이 빠름', '밝음으로 갈등을 넘기려 함'],
      csa_style: '낯선 상황에서도 긍정적 이유를 먼저 찾는다.'
    }
  }
};

const edition = {
  editionId: 'company-v1',
  characters: { characters }
};

function contextWithTurns() {
  const dialogue = Array.from({ length: 8 }, (_, index) => ({
    speaker_id: index % 2 ? 'heroine5' : 'heroine3',
    speaker_name: index % 2 ? '이메이' : '김제나',
    direction: index % 2 ? '밝게' : '조심스럽게',
    text: `${index + 1}번째 실제 대사`,
    order: index
  }));
  return {
    game: { id: 'game-1', title: '상식개변: 회사편' },
    save: {
      data: {
        player: { name: '플레이어' },
        turn_state: { committed_turn: 3 },
        focal_character_id: 'heroine3',
        last_speaker_id: 'heroine5',
        scene_state: {
          location_id: 'office',
          participants: ['heroine3', 'heroine5'],
          focus_thread: 'report_review',
          scene_goal: '보고서 검토'
        },
        world_state: { game_time: { day: 1, minute_of_day: 840 } },
        npc_relationship_state: {
          heroine3: { relationship_summary: '플레이어를 조심스럽게 관찰한다.' }
        }
      }
    },
    recent_turns: [
      { turn_number: 1, player_action: '첫 행동', turn_summary: '첫 요약' },
      { turn_number: 2, player_action: '둘째 행동', turn_summary: '둘째 요약' },
      {
        turn_number: 3,
        player_action: '보고서의 마지막 문장을 가리키며 이유를 묻는다.',
        turn_summary: '김제나가 대답하기 직전 장면이 끝났다.',
        story_text: `앞부분${'가'.repeat(2200)}마지막 질문과 책상 위 보고서`,
        parsed_blocks: {
          blocks: [{ type: 'scene', text: `앞부분${'나'.repeat(2100)}마지막 질문과 책상 위 보고서` }],
          dialogue_lines: dialogue
        },
        choices: ['업무를 계속한다.', '감정을 확인한다.', '주변을 살핀다.', '잠시 기다린다.']
      }
    ]
  };
}



test('Story context keeps the latest 3 turns as full raw story (canonical, no duplicate projection)', () => {
  const context = contextWithTurns();
  const projection = buildStoryContextProjection(context, ['heroine3', 'heroine5'], {
    playerAction: '김제나의 답을 기다린다.'
  });

  assert.equal(projection.recent_turns.length, 3);
  assert.equal('last_turn_continuity' in projection, false, '중복 projection 없음 — recent_turns가 유일 정본');
  for (const turn of projection.recent_turns) {
    assert.equal(typeof turn.story_text, 'string');
    assert.equal('turn_summary' in turn, false, '요약 필드 없음');
  }
});

test('Story Prompt v2 explicitly requires continuity, NPC agency, functional dialogue, and choice diversity', () => {
  const messages = buildStoryPrompt({
    edition,
    context: contextWithTurns(),
    playerAction: '김제나의 답을 기다린다.',
    expectedTurn: 3,
    npcIds: new Set(Object.keys(characters))
  });
  const system = messages[0].content;
  const payload = JSON.parse(messages[1].content);

  assert.match(system, /recent_turns/);
  assert.match(system, /NPC 자율성/);
  assert.match(system, /대화 기능/);
  assert.match(system, /현재 장면에서 바로 실행할 수 있는 서로 다른 행동 4개/);
  assert.match(system, /업무 협조는 호감이 아니고/);
  assert.equal(payload.context.recent_turns.length, 3);
  assert.equal('last_turn_continuity' in payload.context, false, '중복 projection 없음');
  assert.ok(system.length < 9000, `Story system prompt too large: ${system.length}`);
});

test('Story prompt treats context.current_time day/minute_of_day as hard facts', () => {
  const context = contextWithTurns();
  context.save.data.world_state.game_time = { day: 2, minute_of_day: 1320 };
  const messages = buildStoryPrompt({
    edition,
    context,
    playerAction: '보고서를 정리한다.',
    expectedTurn: 4
  });
  const system = messages[0].content;
  const payload = JSON.parse(messages[1].content);
  assert.deepEqual(payload.context.current_time, { day: 2, minute_of_day: 1320 });
  assert.match(system, /context\.current_time\.day와 context\.current_time\.minute_of_day는 확정 사실이다/);
  assert.match(system, /시간·채광·식사 묘사가 이 값과 모순되면 생략하고/);
  assert.match(system, /실제 elapsed 근거 없는 장시간 경과를 만들지 않는다/);
});

test('Extract compact canon uses actual prompt-card fields and drops unrelated or forbidden fields', () => {
  const canon = buildExtractCharacterCanon(characters, ['heroine3', 'heroine5']);
  assert.deepEqual(canon.heroine3.distinctive_traits, ['표정에 감정이 드러남', '준비 부족을 자책', '타이밍형 유머']);
  assert.equal(canon.heroine3.speech.includes('조심스러운 존댓말'), true);
  assert.equal('appearance' in canon.heroine3, false);
  assert.equal('physical_reaction' in canon.heroine3, false);
  assert.equal(JSON.stringify(canon).includes('절대 전달되면 안 됨'), false);
});

test('Extract Prompt v2 separates exact state evidence from Mind Monitor interpretation evidence', () => {
  const messages = buildExtractPrompt({
    context: contextWithTurns(),
    storyText: '김제나가 보고서를 내려다보며 조심스럽게 답했다.',
    parsedStory: {
      choices: ['하나', '둘', '셋', '넷'],
      dialogue_lines: [{ speaker_id: 'heroine3', speaker_name: '김제나', direction: '조심스럽게', text: '제가 다시 설명드릴게요.', order: 0 }]
    },
    playerAction: '김제나의 답을 기다린다.',
    expectedTurn: 3,
    edition,
    npcIds: new Set(Object.keys(characters))
  });
  const system = messages[0].content;
  const payload = JSON.parse(messages[1].content);

  assert.match(system, /state, numeric, relationship, clothing, posture, position, and event proposal in exact Story evidence/);
  assert.match(system, /Mind Monitor interpretation/);
  assert.match(system, /may not invent a new event, memory, agreement, contact, or fact/);
  assert.match(system, /physical_reaction/);
  assert.equal(payload.active_character_canon.heroine3.name, '김제나');
  assert.equal(payload.active_character_canon.heroine5.name, '이메이');
  assert.ok(system.length < 8000, `Extract system prompt too large: ${system.length}`);
});

test('Opening Prompt v2 establishes workplace activity and leaves player agency open', () => {
  const messages = buildOpeningPrompt({
    edition,
    player: { name: '플레이어', department_id: 'brand_strategy', position_id: 'employee' },
    canonical: {},
    openingPlan: {
      weekday: 'monday', minute_of_day: 540, location_name: '브랜드전략팀 사무실',
      work_hook_label: '보고서 검토', scene_goal: '팀에 합류한다', primary_character_id: 'heroine3',
      supporting_character_ids: ['heroine5']
    }
  });
  const system = messages[0].content;

  assert.match(system, /감각적 디테일/);
  assert.match(system, /자신의 업무·성격에 따른 작은 행동을 먼저/);
  assert.match(system, /업무 행동, 말투, 거리감/);
  assert.match(system, /최소 3가지 서로 다른 접근 방향/);
  assert.ok(system.length < 6000, `Opening system prompt too large: ${system.length}`);
});
