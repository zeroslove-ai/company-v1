import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGeneralNpcCanon,
  buildRegisteredGeneralNpcs,
  buildWorkplaceContext,
  selectActiveGeneralNpcIds
} from '../src/engine/workplace-context.js';
import { buildSceneContextCore } from '../src/engine/gameplay-state.js';
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
    scene: {
      version: 1, scene_id: 'office', location_id: 'office', beat: 2,
      goal: '캠페인 최종안을 확정한다', focus_thread: 'campaign_deadline',
      present_npc_ids: ['heroine1'], focal_character_id: 'heroine1', last_speaker_id: 'heroine1', updated_turn: 2
    },
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
  assert.deepEqual(buildWorkplaceContext(edition, conflict).eligible_nearby_npcs.map(npc => npc.npc_id), ['general_manager']);
});

test('general NPC selection requires exact catalog identity from text or persisted scene presence', () => {
  const save = baseSave();
  assert.deepEqual(
    selectActiveGeneralNpcIds({ edition, save, text: '박정우에게 마감 시간을 확인한다.' }),
    ['general_manager']
  );
  assert.deepEqual(
    selectActiveGeneralNpcIds({ edition, save: { ...save, scene: { ...save.scene, present_npc_ids: ['heroine1', 'general_designer'] } }, text: '보고서를 본다.' }),
    ['general_designer']
  );
  assert.deepEqual(selectActiveGeneralNpcIds({ edition, save, text: '박 팀장에게 묻는다.' }), []);
});

test('workplace and active general NPC selection prefer canonical scene over stale scene_state', () => {
  const save = baseSave();
  save.scene = {
    version: 1,
    scene_id: 'canonical',
    location_id: 'project_room',
    beat: 0,
    goal: null,
    focus_thread: null,
    present_npc_ids: ['general_designer'],
    focal_character_id: null,
    last_speaker_id: null,
    updated_turn: 2
  };
  save.scene_state.location_id = 'office';
  save.scene_state.participants = ['general_manager'];
  save.focal_character_id = 'general_manager';
  save.last_speaker_id = 'general_manager';
  assert.equal(buildWorkplaceContext(edition, save).location.location_id, 'project_room');
  assert.deepEqual(selectActiveGeneralNpcIds({ edition, save, text: '보고서를 본다.' }), ['general_designer']);
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


test('Story scene context uses canonical location and presence', () => {
  const save = baseSave();
  save.scene = {
    version: 1,
    scene_id: 'canonical',
    location_id: 'project_room',
    beat: 4,
    goal: 'canonical goal',
    focus_thread: 'canonical thread',
    present_npc_ids: ['general_designer'],
    focal_character_id: null,
    last_speaker_id: null,
    updated_turn: 4
  };
  save.scene_state.location_id = 'office';
  save.scene_state.participants = ['general_manager'];
  save.npc_scene_state.general_manager = { location_id: 'office' };
  const core = buildSceneContextCore(save, ['general_designer', 'general_manager']);
  assert.equal(core.scene.location_id, 'project_room');
  assert.deepEqual(core.scene.participants, ['general_designer']);
  assert.deepEqual(core.scene.present_npc_ids, ['general_designer']);
  assert.equal(core.active_npc_state.npc_scene_state?.general_manager?.present, false);
});



test('Story and Extract keep registered identities and mutable state scoped', () => {
  const save = baseSave();
  save.npc_stats = { general_manager: { affinity: 0 } };
  save.npc_emotion = { general_manager: { current: 'focused' } };

  const storyMessages = buildStoryPrompt({
    edition,
    context: { game: {}, save, recent_turns: [] },
    playerAction: 'ask for the report',
    expectedTurn: 3,
    npcIds: new Set(['heroine1', 'general_manager', 'general_designer'])
  });
  const storyPayload = JSON.parse(storyMessages[1].content);
  assert.equal(storyPayload.registered_identities.length, 3);
  assert.equal('active_general_npc_canon' in storyPayload, false);

  const extractMessages = buildExtractPrompt({
    edition,
    context: { game: {}, save, recent_turns: [] },
    storyText: 'The report is ready.',
    parsedStory: { choices: ['a', 'b', 'c', 'd'], dialogue_lines: [] },
    playerAction: 'ask for the report',
    expectedTurn: 3,
    npcIds: new Set(['heroine1', 'general_manager', 'general_designer'])
  });
  const extractPayload = JSON.parse(extractMessages[1].content);
  assert.equal(extractPayload.registered_identities.length, 3);
  assert.equal('registered_characters' in extractPayload, false);
  assert.equal('registered_general_npcs' in extractPayload, false);
  assert.equal('player_action' in extractPayload, false);
  assert.equal('active_character_canon' in extractPayload, false);
  assert.equal('active_general_npc_canon' in extractPayload, false);
});
