import test from 'node:test';
import assert from 'node:assert/strict';
import edition from '../src/api/edition.js';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';

function makeSave({ active = true } = {}) {
  return {
    edition: 'company-v1',
    turn_state: { committed_turn: 4 },
    player: { name: '테스트 플레이어' },
    world_state: { game_time: { day: 1, minute_of_day: 600 } },
    csa_active: active ? ['csa_test'] : [],
    csa_rules: {
      csa_test: {
        active,
        content: 'UNIQUE_RULE_XYZ',
        scope_type: 'world',
        scope_label: '회사 전체',
        preset: {
          actor_group: 'female_employee',
          trigger: 'during_work',
          duration: 'while_on_duty',
          required_action: 'work_in_underwear_only'
        }
      }
    },
    csa_runtime_state: { csa_test: { character_id: 'heroine1', execution_state: 'executed' } },
    scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: null, updated_turn: 4 },
    scene_state: { participants: ['player-1', 'heroine1'] },
    npc_scene_state: { heroine1: { present: true } },
    player_scene_state: {},
    npc_stats: {},
    csa_attitudes: {}
  };
}

function buildMessages(save) {
  return buildStoryPrompt({
    edition,
    context: { game: { id: 'game-1' }, save: { data: save }, recent_turns: [] },
    playerAction: '서류를 정리한다.',
    expectedTurn: 5,
    npcIds: new Set(['heroine1'])
  });
}

function payload(messages) {
  return JSON.parse(messages.at(-1).content);
}

test('Story context projects active CSA once and excludes global_csa', () => {
  const messages = buildMessages(makeSave());
  const story = payload(messages);
  assert.equal(story.world_rules.length, 1);
  assert.equal(story.world_rules[0].content, 'UNIQUE_RULE_XYZ');
  assert.ok(!('global_csa' in story.context));
  const allText = messages.map(message => String(message.content)).join('\n');
  assert.equal(allText.split('UNIQUE_RULE_XYZ').length - 1, 1);
});

test('Story prompt has no legacy CSA notice or epistemic sections', () => {
  const allText = buildMessages(makeSave()).map(message => String(message.content)).join('\n');
  for (const heading of [
    '[ACTIVE WORLD RULES — DECLARATIVE SCOPE ONLY]',
    '[COMMON-SENSE CHANGE RUNTIME CONTRACT — WORLD RULES]',
    '[PUBLIC COMMON-SENSE SCENE]',
    '[CSA WEAK SYNERGY]',
    '[NPC CSA EPISTEMIC FIREWALL',
    '[CONFIRMED COMMON-SENSE APP TRANSACTION',
    '[CSA DEACTIVATION MEMORY RULE'
  ]) assert.ok(!allText.includes(heading), heading);
  for (const forcedNotice of ['두 가지 이상 채널', '사내 방송 안내음', '직원 휴대전화 알림', '업무용 모니터', '메신저 팝업']) {
    assert.ok(!allText.includes(forcedNotice), forcedNotice);
  }
});

test('inactive CSA produces an empty Story world-rule list', () => {
  const story = payload(buildMessages(makeSave({ active: false })));
  assert.deepEqual(story.world_rules, []);
  assert.ok(!('global_csa' in story.context));
});
