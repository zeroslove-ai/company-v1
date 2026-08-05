import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyPromptCacheOrder,
  PROMPT_CACHE_ORDERS
} from '../src/api/npc-policy-fetch.js';

function parseUserPayload(init) {
  const body = JSON.parse(init.body);
  const user = body.messages.find(message => message.role === 'user');
  return { body, payload: JSON.parse(user.content) };
}

test('Story transport keeps stable canon before dynamic context, action, and turn', () => {
  const originalPayload = {
    edition: 'company-v1',
    expected_turn: 12,
    player_action: '회의 자료를 확인한다.',
    active_character_canon: { heroine1: { name: '서원희' } },
    active_general_npc_canon: { general_lee: { name: '이민석' } },
    context: { committed_turn: 11, scene_state: { location_id: 'meeting_room' } }
  };
  const init = {
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      stream: true,
      messages: [
        { role: 'system', content: 'STATIC STORY SYSTEM' },
        { role: 'user', content: JSON.stringify(originalPayload) }
      ]
    })
  };

  const optimized = applyPromptCacheOrder(init);
  const { body, payload } = parseUserPayload(optimized);
  assert.deepEqual(Object.keys(payload), PROMPT_CACHE_ORDERS.story);
  assert.deepEqual(payload, {
    edition: originalPayload.edition,
    active_character_canon: originalPayload.active_character_canon,
    active_general_npc_canon: originalPayload.active_general_npc_canon,
    context: originalPayload.context,
    player_action: originalPayload.player_action,
    expected_turn: originalPayload.expected_turn
  });
  assert.equal(body.messages[0].content, 'STATIC STORY SYSTEM');
  assert.equal(body.model, 'deepseek-v4-flash');
  assert.equal(body.stream, true);
});

test('Extract transport keeps registered IDs and canon before Story and turn-specific data', () => {
  const originalPayload = {
    expected_turn: 12,
    player_action: '회의 자료를 확인한다.',
    story_text: '서원희가 자료를 넘겼다.',
    parsed_story: { choices: ['A', 'B', 'C', 'D'] },
    context: { committed_turn: 11 },
    registered_characters: [{ character_id: 'heroine1', name: '서원희' }],
    registered_general_npcs: [{ npc_id: 'general_lee', name: '이민석' }],
    active_character_canon: { heroine1: { name: '서원희' } },
    active_general_npc_canon: { general_lee: { name: '이민석' } }
  };
  const init = {
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      stream: false,
      messages: [
        { role: 'system', content: 'STATIC EXTRACT SYSTEM' },
        { role: 'user', content: JSON.stringify(originalPayload) }
      ]
    })
  };

  const optimized = applyPromptCacheOrder(init);
  const { body, payload } = parseUserPayload(optimized);
  assert.deepEqual(Object.keys(payload), PROMPT_CACHE_ORDERS.extract);
  assert.deepEqual(payload, {
    registered_characters: originalPayload.registered_characters,
    registered_general_npcs: originalPayload.registered_general_npcs,
    active_character_canon: originalPayload.active_character_canon,
    active_general_npc_canon: originalPayload.active_general_npc_canon,
    story_text: originalPayload.story_text,
    parsed_story: originalPayload.parsed_story,
    context: originalPayload.context,
    player_action: originalPayload.player_action,
    expected_turn: originalPayload.expected_turn
  });
  assert.equal(body.messages[0].content, 'STATIC EXTRACT SYSTEM');
  assert.equal(body.stream, false);
});

test('cache ordering preserves unknown fields after the known contract and skips unrelated calls', () => {
  const init = {
    body: JSON.stringify({
      stream: true,
      messages: [{
        role: 'user',
        content: JSON.stringify({
          expected_turn: 4,
          edition: 'company-v1',
          diagnostic: 'keep-me',
          player_action: '대화한다',
          context: {},
          active_character_canon: {},
          active_general_npc_canon: {}
        })
      }]
    })
  };
  const { payload } = parseUserPayload(applyPromptCacheOrder(init));
  assert.deepEqual(Object.keys(payload), [...PROMPT_CACHE_ORDERS.story, 'diagnostic']);
  assert.equal(payload.diagnostic, 'keep-me');

  const unrelated = { body: JSON.stringify({ stream: false, messages: [{ role: 'user', content: '{"query":"health"}' }] }) };
  assert.equal(applyPromptCacheOrder(unrelated), unrelated);
});
