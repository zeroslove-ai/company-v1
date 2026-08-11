import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPromptCacheOrder,
  createPromptCacheOrderFetch,
  PROMPT_CACHE_KEY_ORDER,
  reorderPromptPayload
} from '../src/api/prompt-cache-order.js';

const story = {
  expected_turn: 3,
  player_action: 'ordinary',
  turn_trigger: { kind: 'player_action' },
  context: {},
  player_dialogue_policy: null,
  reference_characters: [],
  world_rules: [],
  scene_obligations: [],
  remote_contacts: [],
  possible_entrants: [],
  scene_actors: {},
  registered_identities: [],
  edition: 'company-v1'
};

const extract = {
  expected_turn: 3,
  player_action: 'ordinary',
  context: {},
  story_text: 'story',
  registered_locations: [],
  registered_general_npcs: [],
  registered_characters: [],
  registered_identities: [],
  extract_version: 2
};

test('Story cache order contains only the canonical two-message user payload keys', () => {
  const ordered = reorderPromptPayload(story);
  assert.deepEqual(Object.keys(ordered), PROMPT_CACHE_KEY_ORDER.story);
  assert.deepEqual(Object.keys(ordered), PROMPT_CACHE_KEY_ORDER.story);
});

test('Extract cache order preserves observer contract keys', () => {
  const ordered = reorderPromptPayload(extract);
  assert.deepEqual(Object.keys(ordered), PROMPT_CACHE_KEY_ORDER.extract);
  assert.deepEqual(Object.fromEntries(Object.entries(ordered).sort()), Object.fromEntries(Object.entries(extract).sort()));
});

test('cache ordering changes JSON key order only and skips unrelated calls', () => {
  const init = { body: JSON.stringify({ stream: true, messages: [
    { role: 'system', content: 'SYSTEM' },
    { role: 'user', content: JSON.stringify({ ...story, z_debug: true }) }
  ] }) };
  const patched = applyPromptCacheOrder(init);
  const body = JSON.parse(patched.body);
  assert.deepEqual(Object.keys(JSON.parse(body.messages[1].content)), [...PROMPT_CACHE_KEY_ORDER.story, 'z_debug']);
  const unrelated = { body: JSON.stringify({ stream: false, messages: [{ role: 'user', content: '{"query":"health"}' }] }) };
  assert.equal(applyPromptCacheOrder(unrelated), unrelated);
});

test('fetch wrapper orders only chat-completion payloads', async () => {
  const calls = [];
  const fetchImpl = async (input, init) => { calls.push({ input, init }); return new Response('{}', { status: 200 }); };
  const wrapped = createPromptCacheOrderFetch(fetchImpl);
  await wrapped('https://api.test/chat/completions', { method: 'POST', body: JSON.stringify({ stream: true, messages: [{ role: 'user', content: JSON.stringify(story) }] }) });
  await wrapped('https://api.test/rest/v1/context', { method: 'POST', body: 'raw' });
  assert.deepEqual(Object.keys(JSON.parse(JSON.parse(calls[0].init.body).messages[0].content)), PROMPT_CACHE_KEY_ORDER.story);
  assert.equal(calls[1].init.body, 'raw');
});
