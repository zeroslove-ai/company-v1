import test from 'node:test';
import assert from 'node:assert/strict';

import { appendLateAuthoritativeCharacterCanon } from '../src/engine/story-prompt.js';
import { streamStory } from '../src/api/llm.js';

const messages = [
  { role: 'system', content: 'base' },
  {
    role: 'user',
    content: JSON.stringify({
      active_character_canon: {
        heroine1: {
          name: '서원희',
          position: '차장',
          prompt_card: { addressing: '공식 자리에서는 직급 호칭을 사용한다.' }
        }
      },
      context: {
        npc_relationship_state: {
          heroine1: { current_boundary: 'professional' }
        }
      }
    })
  },
  { role: 'system', content: 'CSA firewall assembled earlier' }
];

test('late authoritative canon is appended after every previously assembled Story message', () => {
  const finalMessages = appendLateAuthoritativeCharacterCanon(messages);
  assert.equal(finalMessages.length, messages.length + 1);
  assert.equal(finalMessages.at(-1).role, 'system');
  assert.match(finalMessages.at(-1).content, /최종 권위 캐릭터 캐논/);
  assert.match(finalMessages.at(-1).content, /서원희/);
  assert.match(finalMessages.at(-1).content, /현재 장면에 한정/);
  assert.match(finalMessages.at(-1).content, /npc_relationship_state/);
});

test('opening or other Story calls with no active_character_canon are unchanged', () => {
  const opening = [{ role: 'system', content: 'opening' }, { role: 'user', content: JSON.stringify({ opening: true }) }];
  assert.equal(appendLateAuthoritativeCharacterCanon(opening), opening);
});

test('streamStory sends the late canon as the final upstream message', async () => {
  let upstreamBody;
  const fetchImpl = async (_url, init) => {
    upstreamBody = JSON.parse(init.body);
    return new Response('data: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } });
  };
  const result = await streamStory({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'key', STORY_MODEL: 'story' },
    fetchImpl,
    messages
  });
  for await (const _chunk of result.chunks) {}
  assert.equal(upstreamBody.messages.at(-1).role, 'system');
  assert.match(upstreamBody.messages.at(-1).content, /호칭 계약/);
});
