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
  assert.match(system, /four literal \[CHOICE\] action blocks/);
  assert.doesNotMatch(system, /\[CHOICE label=/);
  assert.doesNotMatch(system, /\[1\. 서사 및 행동\]|\[2\. 플레이어 속마음\]|\[3\. 선택지\]/);
  assert.match(system, /context\.current_time\.day/);
  assert.deepEqual(payload.context.current_time, { day: 2, minute_of_day: 1320 });
  assert.equal(payload.player_action, '회의실을 둘러본다.');
  assert.equal('player_status' in payload.context, false);
  assert.equal('dialogue' in payload.context, false);
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
