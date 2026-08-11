import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStoryPrompt, DURABLE_STORY_RULES } from '../src/engine/story-prompt.js';
import { streamStory } from '../src/api/llm.js';

const edition = {
  editionId: 'company-v1',
  characters: { characters: {
    heroine1: { name: 'Alpha', position: 'Lead', role_title: 'Manager', prompt_card: { personality: 'calm' } },
    heroine2: { name: 'Beta', position: 'Designer', role_title: 'Designer', prompt_card: { personality: 'direct' } }
  } },
  generalNpcs: { profiles: {} },
  map: { locations: [{ location_id: 'room', name: 'Room', default_npc_ids: [] }] }
};

function context() {
  return { game: { id: 'g1' }, save: { scene: {
    version: 1, scene_id: 'room', location_id: 'room', present_npc_ids: ['heroine1'],
    focal_character_id: null, last_speaker_id: null, beat: 0, updated_turn: 1
  }, player: { name: 'Player' }, csa_active: [], csa_rules: {}, npc_scene_state: {} }, recent_turns: [] };
}

for (const actionKind of ['ordinary', 'app_transaction', 'feedback_revision']) {
  test(`Story ${actionKind} uses exactly one system and one user message`, () => {
    const messages = buildStoryPrompt({ edition, context: context(), playerAction: '계속한다', expectedTurn: 2, actionKind, feedbackText: actionKind === 'feedback_revision' ? '다시 써' : '' });
    assert.deepEqual(messages.map(message => message.role), ['system', 'user']);
    const payload = JSON.parse(messages[1].content);
    assert.equal('action_kind' in payload, false);
    assert.equal(payload.turn_trigger.kind, actionKind === 'feedback_revision' ? 'feedback_revision' : 'player_action');
    assert.equal('scene_cast_contract' in payload, false);
    assert.equal('active_character_canon' in payload, false);
    assert.equal('active_general_npc_canon' in payload, false);
  });
}

test('durable Story contract contains each semantic section once and no priority stack', () => {
  for (const section of ['[WORLD FACTS]', '[PLAYER AGENCY]', '[NPC AUTONOMY]', '[CSA AND WORLD RULES]', '[PHYSICAL CONTINUITY]', '[STORY QUALITY]', '[OUTPUT PROTOCOL]']) {
    assert.equal(DURABLE_STORY_RULES.split(section).length - 1, 1, section);
  }
  assert.doesNotMatch(DURABLE_STORY_RULES, /FINAL|HIGHEST PRIORITY|앞선 모든|최종 권위/);
});

test('streamStory forwards the supplied two-message sequence unchanged', async () => {
  const calls = [];
  const fetchImpl = async (_url, init) => {
    calls.push(JSON.parse(init.body));
    const body = new ReadableStream({ start(controller) {
      controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n'));
      controller.close();
    } });
    return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  };
  const messages = [{ role: 'system', content: 's' }, { role: 'user', content: '{}' }];
  const result = await streamStory({ env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'key', STORY_MODEL: 'story' }, fetchImpl, messages });
  for await (const _chunk of result.chunks) {}
  assert.deepEqual(calls[0].messages, messages);
});
