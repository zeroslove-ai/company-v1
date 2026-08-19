import { openingStory, parseStoryBlocks } from '../domain/story.js';
import { V2ConfigurationError } from './supabase-store.js';

export function createDeterministicProvider() {
  return {
    async *story({ literalAction, playerName }) {
      yield `[NARRATIVE]\n${playerName}의 말이 그대로 기록된다: ${literalAction}\n\n`;
      yield '[DIALOGUE id="heroine1"]\n서원이 다음 업무를 함께 살펴본다.\n\n';
      yield '[CHOICE]\n업무 자료를 확인한다.\n[CHOICE]\n서원에게 질문한다.\n[CHOICE]\n로비로 돌아간다.\n[CHOICE]\n브랜드전략실로 이동한다.\n[/CHOICE]';
    },
    async observe({ storyText }) {
      return { elapsed_minutes: 3, scene: { entered: [], exited: [] }, turn_summary: storyText.slice(0, 120), mind_monitor: { heroine1: { surface: '업무를 설명할 준비를 한다.', subconscious: '새 동료의 반응을 살핀다.' } } };
    },
    opening: ({ playerName }) => openingStory({ playerName }),
    parse: (storyText, content) => parseStoryBlocks(storyText, { content })
  };
}

export function createV2Provider({ env, fetchImpl = fetch, content } = {}) {
  const baseUrl = env?.LLM_API_URL?.replace(/\/$/, '');
  const apiKey = env?.LLM_API_KEY;
  const model = env?.STORY_MODEL;
  if (!baseUrl || !apiKey || !model) throw new V2ConfigurationError('LLM_API_URL, LLM_API_KEY, and STORY_MODEL are required for Company v2');
  const completionUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

  async function completion(body) {
    const response = await fetchImpl(completionUrl, { method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error('v2_provider_failure');
    return response;
  }

  return {
    kind: 'v2-llm-provider',
    async *story({ literalAction, context }) {
      const response = await completion({ model, stream: true, thinking: { type: 'disabled' }, max_tokens: 5000, messages: buildStoryMessages({ literalAction, context }) });
      yield* readOpenAiStream(response);
    },
    async observe({ literalAction, storyText, context }) {
      const response = await completion({ model, stream: false, thinking: { type: 'disabled' }, temperature: 0, max_tokens: 1200, response_format: { type: 'json_object' }, messages: buildObservationMessages({ literalAction, storyText, context }) });
      let payload;
      try { payload = await response.json(); } catch { throw new Error('v2_observation_invalid_json'); }
      const raw = payload?.choices?.[0]?.message?.content;
      if (typeof raw !== 'string') throw new Error('v2_observation_missing');
      try { return JSON.parse(raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '')); } catch { throw new Error('v2_observation_invalid_json'); }
    },
    opening: ({ playerName }) => openingStory({ playerName }),
    parse: (storyText, adapter) => parseStoryBlocks(storyText, { content: adapter ?? content })
  };
}

export function buildStoryMessages({ literalAction, context }) {
  return [
    { role: 'system', content: 'You are the Company v2 Story author. Write natural narrative, preserve the literal player action, and emit exactly four provider-authored [CHOICE] blocks. Use only [NARRATIVE], [DIALOGUE id="registered_id"], [THOUGHT], and [CHOICE]. Never emit OOC or self-repair text.' },
    { role: 'user', content: JSON.stringify({ literal_action: literalAction, time: context?.state?.state?.time ?? context?.state?.time, scene: context?.state?.state?.scene ?? context?.state?.scene, present_npc_ids: context?.state?.state?.scene?.present_npc_ids ?? [], recent_turns: (context?.turns ?? []).slice(-6).map((turn) => ({ story_text: turn.story_text, turn_summary: turn.turn_summary })) }) }
  ];
}

export function buildObservationMessages({ literalAction, storyText, context }) {
  return [
    { role: 'system', content: 'You are a small typed Company v2 observer. Return JSON only with elapsed_minutes, scene {location_id, entered [{actor_id, quote}], exited [{actor_id, quote}]}, turn_summary, and mind_monitor. Use exact registered actor IDs and exact Story substrings for scene evidence. Do not return save paths, semantic taxonomies, or legacy workflow fields.' },
    { role: 'user', content: JSON.stringify({ literal_action: literalAction, story_text: storyText, current_state: context?.state?.state ?? context?.state }) }
  ];
}

async function* readOpenAiStream(response) {
  if (!response.body) throw new Error('v2_story_empty_stream');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let ended = false;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') { ended = true; continue; }
      let payload;
      try { payload = JSON.parse(data); } catch { throw new Error('v2_story_invalid_stream'); }
      const delta = payload?.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta) yield delta;
    }
  }
  if (!ended) throw new Error('v2_story_incomplete_stream');
}
