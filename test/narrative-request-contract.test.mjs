import test from 'node:test';
import assert from 'node:assert/strict';

import { buildStoryPrompt } from '../src/engine/story-prompt.js';
import { buildExtractPrompt } from '../src/engine/extract-prompt.js';
import { parseNarrative } from '../src/frontend/pages/narrative.js';

function context() {
  return {
    save: {
      data: {
        world_state: { game_time: { day: 2, minute_of_day: 1320 } },
        scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 0 },
        scene_state: { participants: [] },
        csa_active: [],
        csa_rules: {}
      }
    },
    recent_turns: []
  };
}

const edition = { editionId: 'company-v1', characters: { characters: {} } };

test('current Story request uses narrative-default wire, free input, and hard-fact time payload', () => {
  const messages = buildStoryPrompt({
    edition,
    context: context(),
    playerAction: '회의실을 둘러본다.',
    expectedTurn: 2,
    npcIds: new Set()
  });
  const payload = JSON.parse(messages[1].content);
  const system = messages[0].content;
  assert.match(system, /plain narrative by default/);
  assert.match(system, /\[DIALOGUE speaker_id=/);
  assert.match(system, /at least one non-empty player-visible Story body segment/i);
  assert.match(system, /\[THOUGHT\].*\[CHOICE\].*alone is invalid/i);
  assert.match(system, /four literal \[CHOICE\] action blocks/);
  assert.doesNotMatch(system, /\[CHOICE label=/);
  assert.doesNotMatch(system, /\[1\. 서사 및 행동\]|\[2\. 플레이어 속마음\]|\[3\. 선택지\]/);
  assert.match(system, /context\.current_time\.day/);
  assert.deepEqual(payload.context.current_time, { day: 2, minute_of_day: 1320 });
  assert.equal(payload.player_action, '회의실을 둘러본다.');
  assert.equal('player_status' in payload.context, false);
  assert.equal('dialogue' in payload.context, false);
  assert.deepEqual(payload.context.turn_summary_memory, []);
  assert.equal('story_summary' in payload.context, false);
});

test('Story request describes older turn summaries as compressed continuity memory', () => {
  const messages = buildStoryPrompt({
    edition,
    context: {
      ...context(),
      recent_turns: [1, 2, 3, 4, 5, 6, 7, 8].map(turn_number => ({
        turn_number,
        player_action: `action-${turn_number}`,
        story_text: `story-${turn_number}`,
        parsed_blocks: { blocks: [`block-${turn_number}`] },
        choices: [`choice-${turn_number}`],
        turn_summary: `summary-${turn_number}`
      }))
    },
    playerAction: 'continue',
    expectedTurn: 5,
    npcIds: new Set()
  });
  const payload = JSON.parse(messages[1].content);
  assert.deepEqual(payload.context.recent_turns.map(turn => turn.turn), [3, 4, 5, 6, 7, 8]);
  assert.deepEqual(payload.context.turn_summary_memory, [
    { turn: 1, turn_summary: 'summary-1' },
    { turn: 2, turn_summary: 'summary-2' }
  ]);
  assert.equal('story_text' in payload.context.turn_summary_memory[0], false);
  assert.match(messages[0].content, /turn_summary_memory/);
  assert.match(messages[0].content, /compressed context/);
});

test('Extract request carries the exact raw Story and V2-only output contract', () => {
  const storyText = '[SCENE]\n원문은 그대로 남는다.\n[CHOICES]\n1. 기다린다';
  const messages = buildExtractPrompt({
    edition,
    context: context(),
    storyText,
    playerAction: '기다린다.',
    expectedTurn: 2,
    npcIds: new Set()
  });
  const payload = JSON.parse(messages[1].content);
  assert.equal(payload.extract_version, 2);
  assert.equal(payload.story_text, storyText);
  const forbiddenOutputFields = ['state_delta', 'choices', 'dialogue_lines', 'save', 'csa_active', 'csa_rules'];
  for (const forbidden of forbiddenOutputFields) {
    assert.equal(forbidden in payload, false);
    assert.match(messages[0].content, new RegExp(`\\b${forbidden}\\b`));
  }
  for (const required of ['scene_observation', 'player_observation', 'npc_observations', 'events', 'evidence', 'elapsed_minutes', 'warnings']) {
    assert.match(messages[0].content, new RegExp(required));
  }
  assert.match(messages[0].content, /turn_summary is the compressed continuity memory/);
  assert.match(messages[0].content, /Empty text is allowed only when the Story genuinely has no continuity content/);
});

test('frontend narrative projection preserves malformed raw Story for later recovery', () => {
  const raw = '[SCENE]\n장면은 표시된다.\n[CHOICES]\n1. 하나';
  const parsed = parseNarrative(raw);
  assert.equal(parsed.raw, raw);
  assert.ok(parsed.warnings.includes('choices_not_exactly_four'));
  assert.ok(parsed.blocks.some(block => block.type === 'scene' && block.text.includes('장면은 표시된다.')));
});

test('frontend narrative projection keeps unparsed Story text instead of dropping it', () => {
  const raw = '화자 표식을 해석할 수 없는 원문도 보존한다.';
  const parsed = parseNarrative(raw);
  assert.deepEqual(parsed.blocks, [{ type: 'unparsed', text: raw }]);
  assert.ok(parsed.warnings.includes('no_recognized_markers'));
});
