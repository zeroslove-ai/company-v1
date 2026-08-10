import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGeneralNpcCanon,
  buildRegisteredGeneralNpcs,
  buildWorkplaceContext,
  selectActiveGeneralNpcIds
} from '../src/engine/workplace-context.js';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';
import { buildExtractPrompt } from '../src/engine/extract-prompt.js';

const edition = {
  editionId: 'company-v1',
  characters: {
    characters: {
      heroine1: {
        name: '서원희',
        position: '팀장',
        role_title: '브랜드전략팀장',
        prompt_card: {
          identity: '브랜드전략팀장.',
          personality: '판단이 빠르고 책임을 회피하지 않는다.',
          speech: '간결한 존댓말.',
          addressing: '업무 호칭을 정확히 쓴다.',
          distinctive_traits: ['결론부터 말함'],
          csa_style: '업무와 사적 판단을 분리한다.'
        }
      }
    }
  },
  generalNpcs: {
    profiles: {
      general_manager: {
        id: 'general_manager', name: '박정우', sex: 'male', age: 38,
        role: '브랜드전략1팀 팀장', department_id: 'brand_strategy',
        type: 'employee', affiliation_type: 'employee'
      },
      general_designer: {
        id: 'general_designer', name: '이민석', sex: 'male', age: 29,
        role: '디자인팀 대리', department_id: 'design',
        type: 'employee', affiliation_type: 'employee'
      }
    }
  },
  map: {
    locations: [
      {
        location_id: 'office', name: '사무실', floor: 3,
        department_id: 'brand_strategy', location_type: 'office_floor',
        visibility: 'public', adjacent_location_ids: ['meeting_room'],
        default_npc_ids: ['general_manager'], scene_tags: ['office']
      },
      {
        location_id: 'project_room', name: '프로젝트룸', floor: 4,
        department_id: 'design', location_type: 'project_space',
        visibility: 'public', adjacent_location_ids: [],
        default_npc_ids: ['general_designer'], scene_tags: ['project']
      }
    ]
  }
};

function baseSave() {
  return {
    player: { name: '플레이어' },
    turn_state: { committed_turn: 2 },
    focal_character_id: 'heroine1',
    last_speaker_id: 'heroine1',
    scene_state: {
      location_id: 'office',
      participants: ['heroine1'],
      focus_thread: 'campaign_deadline',
      scene_goal: '캠페인 최종안을 확정한다',
      beat: 2
    },
    world_state: { game_time: { day: 1, minute_of_day: 600 } },
    npc_scene_state: {
      general_designer: { location_id: 'office', location_label: '사무실' }
    }
  };
}

test('workplace projection uses only recorded/default location evidence, excludes active ids, and caps nearby candidates', () => {
  const save = baseSave();
  const workplace = buildWorkplaceContext(edition, save, { excludeIds: ['general_designer'], limit: 9 });

  assert.equal(workplace.location.location_id, 'office');
  assert.equal(workplace.location.name, '사무실');
  assert.deepEqual(workplace.eligible_nearby_npcs.map(npc => npc.npc_id), ['general_manager']);
  assert.equal(workplace.eligible_nearby_npcs[0].source, 'location_default');

  const conflict = structuredClone(save);
  conflict.npc_scene_state.general_manager = { location_id: 'project_room', location_label: '프로젝트룸' };
  assert.deepEqual(buildWorkplaceContext(edition, conflict).eligible_nearby_npcs.map(npc => npc.npc_id), ['general_designer']);
});

test('general NPC selection requires exact catalog identity from text or persisted scene presence', () => {
  const save = baseSave();
  assert.deepEqual(
    selectActiveGeneralNpcIds({ edition, save, text: '박정우에게 마감 시간을 확인한다.' }),
    ['general_manager']
  );
  assert.deepEqual(
    selectActiveGeneralNpcIds({ edition, save: { ...save, scene_state: { ...save.scene_state, participants: ['heroine1', 'general_designer'] } }, text: '보고서를 본다.' }),
    ['general_designer']
  );
  assert.deepEqual(selectActiveGeneralNpcIds({ edition, save, text: '박 팀장에게 묻는다.' }), []);
});

test('general NPC canon and registry contain only supported compact catalog fields', () => {
  const canon = buildGeneralNpcCanon(edition, ['general_manager']);
  assert.equal(canon.general_manager.name, '박정우');
  assert.equal(canon.general_manager.role, '브랜드전략1팀 팀장');
  assert.equal('prompt_card' in canon.general_manager, false);
  assert.deepEqual(buildRegisteredGeneralNpcs(edition), [
    { npc_id: 'general_manager', name: '박정우', role: '브랜드전략1팀 팀장' },
    { npc_id: 'general_designer', name: '이민석', role: '디자인팀 대리' }
  ]);
});

test('Story Prompt v2 phase 2 supplies deterministic workplace candidates without marking them active', () => {
  const save = baseSave();
  const messages = buildStoryPrompt({
    edition,
    context: { game: { id: 'g1', title: '상식개변: 회사편' }, save, recent_turns: [] },
    playerAction: '서원희와 최종안을 검토한다.',
    expectedTurn: 3,
    npcIds: new Set(['heroine1', 'general_manager', 'general_designer'])
  });
  const system = messages[0].content;
  const payload = JSON.parse(messages[1].content);

  assert.deepEqual(Object.keys(payload.active_general_npc_canon), []);
  assert.deepEqual(payload.context.workplace.eligible_nearby_npcs.map(npc => npc.npc_id), ['general_designer', 'general_manager']);
  assert.match(system, /scene_cast_contract가 이미 확정/);
  assert.match(system, /너에게는 결정 권한이 없다/);
  assert.match(system, /scene_goal 또는 focus_thread/);
  assert.match(system, /MOVEMENT NAVIGATION CONTRACT/);
  assert.match(system, /movement 전용 allowed_speaker_ids/);
  assert.match(system, /requested_location\.name.*도착한 관찰 가능한 결과/);
  assert.match(system, /현재 업무 장면에서 자연스러운 업무·대화 선택지는 허용한다/);
  assert.match(system, /\[DIALOGUE speaker_id=/);
  assert.match(system, /acting_direction=/);
  assert.ok(system.length <= 9000, `Story system prompt too large: ${system.length}`);
});

test('movement Story prompt carries a resolved prospective destination context', () => {
  const messages = buildStoryPrompt({
    edition,
    context: { game: {}, save: baseSave(), recent_turns: [] },
    playerAction: '사무실로 이동한다',
    expectedTurn: 2,
    sceneCastContract: { transition_mode: 'movement', destination_location_id: 'office' }
  });
  assert.match(messages[0].content, /\[RESOLVED MOVEMENT CONTEXT\]/);
  assert.match(messages[0].content, /사무실/);
  assert.match(messages[0].content, /location_id=office/);
  const payload = JSON.parse(messages[1].content);
  assert.deepEqual(payload.movement_result_required, {
    location_id: 'office',
    name: '사무실',
    completed_arrival_required: true
  });
  assert.equal(payload.story_mode, 'movement_story');
  const currentTurn = JSON.parse(messages[2].content);
  assert.equal(currentTurn.current_turn_contract, 'movement');
  assert.equal(currentTurn.required_result, 'arrive_at_destination_in_this_story');
  assert.equal(currentTurn.destination.location_id, 'office');
});

test('CSA Story prompt keeps the app meta boundary and grounds newly activated authority tiers', () => {
  const save = baseSave();
  save.csa_active = ['csa-new'];
  save.csa_rules = {
    'csa-new': {
      active: true,
      content: '여성 직원은 공식 규정에 따라 근무한다.',
      strength: 'weak',
      created_turn: 3,
      preset: { authority_tier: 'weak', affected_group: 'female_employee', mode: 'continuous' }
    }
  };
  const system = buildStoryPrompt({ edition, context: { game: {}, save, recent_turns: [] }, playerAction: '회사 규정 변경사항 1건이 공식 반영된다.', expectedTurn: 3, npcIds: new Set(['heroine1']) })[0].content;
  assert.match(system, /상식개변 앱은 플레이어 전용 메타 UI/);
  assert.match(system, /newly_activated===true/);
  assert.match(system, /weak=사내 지침/);
  assert.match(system, /medium=취업규칙/);
  assert.match(system, /strong=국가 법령/);
  assert.match(system, /스마트워치 알림/);
});

test('Story and Extract activate a named general NPC with compact canon and scoped mutable state', () => {
  const save = baseSave();
  save.npc_stats = { general_manager: { affinity: 0 } };
  save.npc_emotion = { general_manager: { current: 'focused' } };

  const storyMessages = buildStoryPrompt({
    edition,
    context: { game: {}, save, recent_turns: [] },
    playerAction: '박정우에게 캠페인 마감 시간을 확인한다.',
    expectedTurn: 3,
    npcIds: new Set(['heroine1', 'general_manager', 'general_designer'])
  });
  const storyPayload = JSON.parse(storyMessages[1].content);
  assert.equal(storyPayload.active_general_npc_canon.general_manager.name, '박정우');
  assert.deepEqual(Object.keys(storyPayload.context.active_npc_state.npc_stats), ['general_manager']);

  const extractMessages = buildExtractPrompt({
    edition,
    context: { game: {}, save, recent_turns: [] },
    storyText: '박정우가 문을 두드리고 들어와 마감 시간을 확인했다.',
    parsedStory: { choices: ['a', 'b', 'c', 'd'], dialogue_lines: [] },
    playerAction: '마감 시간을 묻는다.',
    expectedTurn: 3,
    npcIds: new Set(['heroine1', 'general_manager', 'general_designer'])
  });
  const extractSystem = extractMessages[0].content;
  const extractPayload = JSON.parse(extractMessages[1].content);

  assert.equal(extractPayload.registered_characters.length, 1);
  assert.equal(extractPayload.registered_general_npcs.length, 2);
  assert.equal(extractPayload.active_general_npc_canon.general_manager.name, '박정우');
  assert.deepEqual(Object.keys(extractPayload.context.active_npc_state.npc_emotion), ['general_manager']);
  assert.match(extractSystem, /nearby\/default\/eligible NPC is not present/);
  assert.match(extractSystem, /Story explicitly shows their presence\/action\/dialogue|presence, action, or dialogue/);
  assert.ok(extractSystem.length <= 9000, `Extract system prompt too large: ${extractSystem.length}`); // 예산 7000 (image_selection 지시 반영)
});
