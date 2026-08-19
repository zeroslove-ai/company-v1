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

export const V2_PROVIDER_TIMEOUTS = Object.freeze({ storyFirstContentMs: 30_000, storyTotalMs: 120_000, observationMs: 75_000 });

export function createV2Provider({ env, fetchImpl = fetch, content, timeouts: timeoutOverrides = {} } = {}) {
  const baseUrl = env?.LLM_API_URL?.replace(/\/$/, '');
  const apiKey = env?.LLM_API_KEY;
  const storyModel = env?.STORY_MODEL;
  const observationModel = env?.EXTRACT_MODEL;
  const timeouts = { ...V2_PROVIDER_TIMEOUTS, ...timeoutOverrides };
  if (!baseUrl || !apiKey || !storyModel || !observationModel) throw new V2ConfigurationError('LLM_API_URL, LLM_API_KEY, STORY_MODEL, and EXTRACT_MODEL are required for Company v2');
  const completionUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

  function timedRequest(body, timeoutMs, timeoutCode) {
    const controller = new AbortController();
    let reason = null;
    let timer;
    let rejectTimeout;
    const timeoutPromise = new Promise((_, reject) => { rejectTimeout = reject; timer = setTimeout(() => abort(timeoutCode), timeoutMs); });
    function abort(code) {
      if (reason) return;
      reason = code;
      controller.abort(code);
      rejectTimeout(structuralTimeout(reason));
    }
    const responsePromise = fetchImpl(completionUrl, { method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal })
      .catch((error) => { if (reason) throw structuralTimeout(reason); throw error; });
    return { responsePromise, timeoutPromise, signal: controller.signal, abort, reason: () => reason, clear: () => clearTimeout(timer) };
  }

  return {
    kind: 'v2-llm-provider',
    async *story({ literalAction, context }) {
      const request = timedRequest({ model: storyModel, stream: true, thinking: { type: 'disabled' }, max_tokens: 5000, messages: buildStoryMessages({ literalAction, context }) }, timeouts.storyTotalMs, 'v2_story_timeout');
      try {
        const response = await Promise.race([request.responsePromise, request.timeoutPromise]);
        assertProviderResponse(response);
        yield* readOpenAiStream(response, { request, firstContentMs: timeouts.storyFirstContentMs });
      } catch (error) {
        if (request.reason()) throw structuralTimeout(request.reason());
        throw error;
      } finally { request.clear(); }
    },
    async observe({ literalAction, storyText, context }) {
      const request = timedRequest({ model: observationModel, stream: false, thinking: { type: 'disabled' }, temperature: 0, max_tokens: 1200, response_format: { type: 'json_object' }, messages: buildObservationMessages({ literalAction, storyText, context }) }, timeouts.observationMs, 'v2_observation_timeout');
      let payload;
      try {
        const response = await Promise.race([request.responsePromise, request.timeoutPromise]);
        assertProviderResponse(response);
        payload = await Promise.race([response.json(), request.timeoutPromise]);
      } catch (error) {
        if (request.reason()) throw structuralTimeout(request.reason());
        if (error?.message === 'v2_provider_failure') throw error;
        throw error?.message === 'v2_observation_timeout' ? error : new Error('v2_observation_invalid_json');
      } finally { request.clear(); }
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

async function* readOpenAiStream(response, { request, firstContentMs } = {}) {
  if (!response.body) throw new Error('v2_story_empty_stream');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let ended = false;
  let firstContent = false;
  let firstTimer;
  let rejectFirst;
  const firstContentTimeout = new Promise((_, reject) => {
    rejectFirst = reject;
    firstTimer = setTimeout(() => { request?.abort('v2_story_first_content_timeout'); reject(structuralTimeout('v2_story_first_content_timeout')); }, firstContentMs);
  });
  while (true) {
    let read;
    try {
      read = request ? await Promise.race([reader.read(), request.timeoutPromise, firstContent ? new Promise(() => {}) : firstContentTimeout]) : await reader.read();
    } catch (error) {
      if (request?.reason()) throw structuralTimeout(request.reason());
      throw error;
    }
    const { value, done } = read;
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
      if (typeof delta === 'string' && delta) {
        if (!firstContent) { firstContent = true; clearTimeout(firstTimer); rejectFirst = null; }
        yield delta;
      }
    }
  }
  clearTimeout(firstTimer);
  if (!ended) throw new Error('v2_story_incomplete_stream');
}

function structuralTimeout(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function assertProviderResponse(response) {
  if (!response?.ok) throw new Error('v2_provider_failure');
}
