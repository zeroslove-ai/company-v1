import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyPromptCacheOrder,
  createPromptCacheOrderFetch,
  PROMPT_CACHE_KEY_ORDER,
  reorderPromptPayload
} from '../src/api/prompt-cache-order.js';

const completionUrl = 'https://api.deepseek.com/v1/chat/completions';

function bodyFor(payload, extras = {}) {
  return JSON.stringify({
    model: 'deepseek-v4-flash',
    messages: [
      { role: 'system', content: 'STATIC PREFIX' },
      { role: 'user', content: JSON.stringify(payload) }
    ],
    ...extras
  });
}

function reorderedPayload(init) {
  const body = JSON.parse(init.body);
  return JSON.parse(body.messages.find(message => message.role === 'user').content);
}

test('Story places stable edition and canon before context and turn-specific fields', () => {
  const source = {
    edition: 'company-v1',
    expected_turn: 17,
    player_action: '회의 자료를 확인한다.',
    active_character_canon: { heroine1: { name: '서원희' } },
    active_general_npc_canon: { general_lee: { name: '이민석' } },
    context: { committed_turn: 16, location: '대회의실' }
  };
  const ordered = reorderPromptPayload(source);
  assert.deepEqual(Object.keys(ordered), PROMPT_CACHE_KEY_ORDER.story);
  assert.deepEqual(ordered, {
    edition: source.edition,
    active_character_canon: source.active_character_canon,
    active_general_npc_canon: source.active_general_npc_canon,
    context: source.context,
    player_action: source.player_action,
    expected_turn: source.expected_turn
  });
  assert.deepEqual(source, {
    edition: 'company-v1',
    expected_turn: 17,
    player_action: '회의 자료를 확인한다.',
    active_character_canon: { heroine1: { name: '서원희' } },
    active_general_npc_canon: { general_lee: { name: '이민석' } },
    context: { committed_turn: 16, location: '대회의실' }
  }, '원본 payload는 변경하지 않는다');
});

test('Extract places registered IDs and canon before narrative and turn-specific fields', () => {
  const source = {
    expected_turn: 17,
    player_action: '회의 자료를 확인한다.',
    story_text: '서원희가 자료를 넘겼다.',
    parsed_story: { choices: ['계속한다'] },
    context: { committed_turn: 16 },
    registered_characters: [{ character_id: 'heroine1', name: '서원희' }],
    registered_general_npcs: [{ npc_id: 'general_lee', name: '이민석' }],
    active_character_canon: { heroine1: { name: '서원희' } },
    active_general_npc_canon: { general_lee: { name: '이민석' } }
  };
  const ordered = reorderPromptPayload(source);
  assert.deepEqual(Object.keys(ordered), PROMPT_CACHE_KEY_ORDER.extract);
  for (const key of Object.keys(source)) assert.deepEqual(ordered[key], source[key]);
});

test('unknown extra keys remain deterministic after the known cache prefix', () => {
  const ordered = reorderPromptPayload({
    expected_turn: 3,
    edition: 'company-v1',
    context: {},
    active_character_canon: {},
    player_action: '확인',
    active_general_npc_canon: {},
    z_debug: 1,
    a_contract: 2
  });
  assert.deepEqual(Object.keys(ordered), [
    ...PROMPT_CACHE_KEY_ORDER.story,
    'a_contract',
    'z_debug'
  ]);
});

test('outbound completion body changes key order only and preserves model settings', () => {
  const payload = {
    expected_turn: 8,
    player_action: '질문한다.',
    story_text: '대답이 이어졌다.',
    parsed_story: { choices: [] },
    context: { turn: 7 },
    registered_characters: [],
    registered_general_npcs: [],
    active_character_canon: {},
    active_general_npc_canon: {}
  };
  const init = {
    method: 'POST',
    headers: { authorization: 'Bearer test' },
    body: bodyFor(payload, { stream: false, max_tokens: 10000 })
  };
  const patched = applyPromptCacheOrder(init);
  const parsedBody = JSON.parse(patched.body);
  assert.equal(parsedBody.model, 'deepseek-v4-flash');
  assert.equal(parsedBody.stream, false);
  assert.equal(parsedBody.max_tokens, 10000);
  assert.deepEqual(Object.keys(reorderedPayload(patched)), PROMPT_CACHE_KEY_ORDER.extract);
  assert.deepEqual(Object.fromEntries(Object.entries(reorderedPayload(patched)).sort()), Object.fromEntries(Object.entries(payload).sort()));
  assert.equal(init.headers.authorization, 'Bearer test');
});

test('fetch wrapper applies ordering only to chat completions', async () => {
  const calls = [];
  const fetchImpl = async (input, init) => {
    calls.push({ input, init });
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const wrapped = createPromptCacheOrderFetch(fetchImpl);
  const storyPayload = {
    edition: 'company-v1',
    expected_turn: 2,
    player_action: '보고한다.',
    active_character_canon: {},
    active_general_npc_canon: {},
    context: { turn: 1 }
  };
  await wrapped(completionUrl, { method: 'POST', body: bodyFor(storyPayload) });
  await wrapped('https://example.test/rest/v1/rpc/get_company_context', { method: 'POST', body: bodyFor(storyPayload) });

  assert.deepEqual(Object.keys(reorderedPayload(calls[0].init)), PROMPT_CACHE_KEY_ORDER.story);
  assert.equal(calls[1].init.body, bodyFor(storyPayload), '비-LLM 요청은 손대지 않는다');
});
