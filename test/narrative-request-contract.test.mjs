import test from 'node:test';
import assert from 'node:assert/strict';

import { buildStoryContextProjection, buildStoryPrompt, PROVIDER_CHOICE_OUTPUT_PROTOCOL } from '../src/engine/story-prompt.js';
import { buildExtractPrompt } from '../src/engine/extract-prompt.js';
import { buildOpeningPrompt } from '../src/engine/opening-prompt.js';

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

test('Story and Opening share one provider choice transport contract', () => {
  const story = buildStoryPrompt({ edition, context: context(), playerAction: 'continue', expectedTurn: 2, npcIds: new Set() });
  const opening = buildOpeningPrompt({ edition, player: {}, canonical: {}, openingPlan: {} });
  assert.equal(story[0].content.includes(PROVIDER_CHOICE_OUTPUT_PROTOCOL), true);
  assert.equal(opening[0].content.includes(PROVIDER_CHOICE_OUTPUT_PROTOCOL), true);
});

test('Story and Opening retain the company setting without universal workplace-fiction authority', () => {
  const story = buildStoryPrompt({ edition, context: context(), playerAction: 'continue', expectedTurn: 2, npcIds: new Set() });
  const opening = buildOpeningPrompt({ edition, player: {}, canonical: {}, openingPlan: {} });
  const text = [...story, ...opening].map(message => String(message.content)).join('\n');
  assert.doesNotMatch(text, /workplace fiction/i);
  assert.doesNotMatch(text, /work agenda|mandatory enactment|permanent work-performance/i);
});

test('Story request carries current time, player intent, and no retired semantic maps', () => {
  const action = '회의실에서 오늘 업무를 검토한다.';
  const messages = buildStoryPrompt({ edition, context: context(), playerAction: action, expectedTurn: 2, npcIds: new Set() });
  const payload = JSON.parse(messages[1].content);
  assert.equal(messages[0].role, 'system');
  assert.deepEqual(payload.context.current_time, { day: 2, minute_of_day: 1320 });
  assert.equal(payload.player_action, action);
  for (const retired of ['npc_stats', 'npc_relationship_state', 'csa_attitudes', 'player_dialogue_policy', 'target_authority', 'possible_entrants', 'remote_contacts']) {
    assert.equal(JSON.stringify(payload).includes(retired), false, retired);
  }
});

test('Story context preserves six raw turns and chronological older summaries', () => {
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
});

test('blank older summaries retain committed Story as continuity fallback', () => {
  const projection = buildStoryContextProjection({
    save: context().save,
    recent_turns: [
      { turn_number: 1, story_text: 'committed raw Story', parsed_blocks: { blocks: ['dialogue'] }, turn_summary: '' },
      ...Array.from({ length: 6 }, (_, index) => ({ turn_number: index + 2, story_text: `story-${index + 2}`, turn_summary: `summary-${index + 2}` }))
    ]
  }, [], {});
  assert.deepEqual(projection.turn_summary_memory, [{
    turn: 1,
    turn_summary: '',
    raw_story_fallback: 'committed raw Story',
    parsed_blocks_fallback: { blocks: ['dialogue'] },
    continuity_source: 'committed_story'
  }]);
});

test('Extract request transports raw Story and exposes only the fresh observation boundary', () => {
  const storyText = '[SCENE]\n회사 회의실에서 대화가 이어진다.\n[CHOICES]\n1. 기다린다';
  const messages = buildExtractPrompt({ edition, context: context(), storyText, playerAction: '기다린다.', expectedTurn: 2, npcIds: new Set() });
  const payload = JSON.parse(messages[1].content);
  assert.equal(payload.extract_version, 2);
  assert.equal(payload.story_text, storyText);
  for (const retired of ['state_delta', 'choices', 'dialogue_lines', 'save', 'csa_active', 'csa_rules', 'csa_trigger_evaluations', 'image_character_id']) {
    assert.equal(retired in payload, false, retired);
  }
});
