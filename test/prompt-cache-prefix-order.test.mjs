import test from 'node:test';
import assert from 'node:assert/strict';

import { buildStoryPrompt } from '../src/engine/story-prompt.js';
import { buildExtractPrompt } from '../src/engine/extract-prompt.js';

const edition = {
  editionId: 'company-v1',
  characters: {
    characters: {
      heroine_1: {
        name: '서원희',
        position: '차장',
        role_title: '브랜드전략팀장',
        prompt_card: {
          identity: '브랜드전략팀장',
          personality: '침착함',
          speech: '간결한 존댓말',
          addressing: '직급 호칭',
          distinctive_traits: ['신중함'],
          csa_style: '업무 규정으로 해석'
        }
      }
    }
  },
  generalNpcs: {
    profiles: {
      general_1: {
        id: 'general_1',
        name: '이민석',
        role: '디자인팀 대리',
        department_id: 'design'
      }
    }
  },
  map: {
    locations: [{
      location_id: 'meeting_room',
      name: '회의실',
      default_npc_ids: ['general_1']
    }]
  }
};

const context = {
  game: { id: 'game-1', title: '상식개변: 회사편' },
  save: {
    data: {
      player: { name: '플레이어' },
      turn_state: { committed_turn: 3 },
      scene_state: {
        scene_id: 'scene-1',
        location_id: 'meeting_room',
        participants: ['heroine_1'],
        focus_thread: '회의',
        scene_goal: '안건 확인',
        beat: 1
      },
      world_state: { game_time: { day: 1, minute_of_day: 600 } },
      focal_character_id: 'heroine_1',
      last_speaker_id: 'heroine_1',
      last_npcs_present: ['heroine_1'],
      csa_active: [],
      csa_rules: {},
      csa_runtime_state: {}
    }
  },
  recent_turns: []
};

function userPayload(messages) {
  const message = messages.find(item => item.role === 'user');
  assert.ok(message, 'user prompt must exist');
  return JSON.parse(message.content);
}

test('Story prompt keeps stable canon before context and turn-specific input', () => {
  const payload = userPayload(buildStoryPrompt({
    edition,
    context,
    playerAction: '서원희에게 안건을 묻는다.',
    expectedTurn: 4,
    npcIds: new Set(['heroine_1', 'general_1'])
  }));

  assert.deepEqual(Object.keys(payload), [
    'edition',
    'registered_identities',
    'scene_actors',
    'possible_entrants',
    'remote_contacts',
    'reference_characters',
    'scene_cast_contract',
    'active_character_canon',
    'active_general_npc_canon',
    'context',
    'player_action',
    'expected_turn'
  ]);
  assert.equal(payload.player_action, '서원희에게 안건을 묻는다.');
  assert.equal(payload.expected_turn, 4);
});

test('Extract prompt keeps registered NPCs and canon before generated turn data', () => {
  const payload = userPayload(buildExtractPrompt({
    edition,
    context,
    storyText: '서원희가 안건을 설명했다.',
    parsedStory: {
      player_inner_thought: '내용을 정리해야겠다.',
      player_status: '회의 중',
      choices: ['질문한다'],
      dialogue_lines: [],
      warnings: []
    },
    playerAction: '서원희에게 안건을 묻는다.',
    expectedTurn: 4,
    npcIds: new Set(['heroine_1', 'general_1'])
  }));

  assert.deepEqual(Object.keys(payload), [
    'extract_version',
    'registered_identities',
    'registered_characters',
    'registered_general_npcs',
    'registered_locations',
    'story_text',
    'context',
    'player_action',
    'expected_turn'
  ]);
  assert.equal(payload.story_text, '서원희가 안건을 설명했다.');
  assert.equal(payload.expected_turn, 4);
});
