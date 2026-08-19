import { companyV2Content } from '../domain/content.js';
import { COMPANY_APP_PREMISE, openingStory, parseStoryBlocks } from '../domain/story.js';
import { V2ConfigurationError } from './supabase-store.js';

export function createDeterministicProvider({ content = companyV2Content } = {}) {
  const actor = content.getNpc('heroine1');
  const location = content.getLocation('brand_strategy_office');
  return {
    async *story({ literalAction, playerName }) {
      yield `[NARRATIVE]\n${playerName}의 행동 “${literalAction}”이(가) ${location.name}에 기록된다. ${actor.name}은(는) 상황을 지켜보며 다음 행동을 기다린다. ${COMPANY_APP_PREMISE.name}은(는) 아직 사용되지 않았고 현실은 그대로다.\n\n`;
      yield `[DIALOGUE id="${actor.id}"]\n${actor.name}이(가) 필요한 만큼만 차분하게 묻는다. “무엇을 하려는지 직접 말해 주세요.”`;
    },
    async observe({ storyText }) { return { elapsed_minutes: 3, scene: { entered: [], exited: [] }, turn_summary: storyText.slice(0, 120), mind_monitor: {} }; },
    opening: ({ playerName }) => openingStory({ playerName, content }),
    parse: (storyText, adapter) => parseStoryBlocks(storyText, { content: adapter ?? content })
  };
}

export const V2_PROVIDER_TIMEOUTS = Object.freeze({ storyFirstContentMs: 30_000, storyTotalMs: 120_000, observationMs: 75_000 });

export function createV2Provider({ env, fetchImpl = fetch, content = companyV2Content, timeouts: timeoutOverrides = {} } = {}) {
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
    function abort(code) { if (reason) return; reason = code; controller.abort(code); rejectTimeout(structuralTimeout(reason)); }
    const responsePromise = fetchImpl(completionUrl, { method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal }).catch((error) => { if (reason) throw structuralTimeout(reason); throw error; });
    return { responsePromise, timeoutPromise, abort, reason: () => reason, clear: () => clearTimeout(timer) };
  }

  return {
    kind: 'v2-llm-provider',
    async *story({ literalAction, context }) {
      const request = timedRequest({ model: storyModel, stream: true, thinking: { type: 'disabled' }, max_tokens: 5000, messages: buildStoryMessages({ literalAction, context, content }) }, timeouts.storyTotalMs, 'v2_story_timeout');
      try { const response = await Promise.race([request.responsePromise, request.timeoutPromise]); assertProviderResponse(response); yield* readOpenAiStream(response, { request, firstContentMs: timeouts.storyFirstContentMs }); }
      catch (error) { if (request.reason()) throw structuralTimeout(request.reason()); throw error; }
      finally { request.clear(); }
    },
    async observe({ literalAction, storyText, context }) {
      const request = timedRequest({ model: observationModel, stream: false, thinking: { type: 'disabled' }, temperature: 0, max_tokens: 1200, response_format: { type: 'json_object' }, messages: buildObservationMessages({ literalAction, storyText, context }) }, timeouts.observationMs, 'v2_observation_timeout');
      let payload;
      try { const response = await Promise.race([request.responsePromise, request.timeoutPromise]); assertProviderResponse(response); payload = await Promise.race([response.json(), request.timeoutPromise]); }
      catch (error) { if (request.reason()) throw structuralTimeout(request.reason()); if (error?.message === 'v2_provider_failure') throw error; throw error?.message === 'v2_observation_timeout' ? error : new Error('v2_observation_invalid_json'); }
      finally { request.clear(); }
      const raw = payload?.choices?.[0]?.message?.content;
      if (typeof raw !== 'string') throw new Error('v2_observation_missing');
      try { return JSON.parse(raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '')); } catch { throw new Error('v2_observation_invalid_json'); }
    },
    opening: ({ playerName }) => openingStory({ playerName, content }),
    parse: (storyText, adapter) => parseStoryBlocks(storyText, { content: adapter ?? content })
  };
}

export function buildStoryMessages({ literalAction, context, content = companyV2Content }) {
  const state = context?.state?.state ?? context?.state ?? {};
  const scene = state.scene ?? {};
  const location = content.getLocation(scene.location_id);
  const actorIds = [...new Set(scene.present_npc_ids ?? [])].filter((id) => content.getNpc(id));
  const actors = actorIds.map((id) => { const actor = content.getNpc(id); return { id: actor.id, name: actor.name, kind: actor.kind, department: actor.department ?? actor.department_id, position: actor.position ?? null, role_title: actor.role_title ?? null, role: actor.role ?? null, prompt_card: actor.prompt_card ?? null }; });
  return [
    { role: 'system', content: 'You are the Story author for the interactive fiction edition "상식개변: 회사편". Preserve the literal player action exactly as intent and write a grounded company scene with concrete environment, reactions, character behavior, and dialogue when relevant. The player supplies the next action as free text; do not emit choices or choice markers. Use only [NARRATIVE], [DIALOGUE id="registered_id"], and [THOUGHT]. Never emit OOC or self-repair text. The private app premise is background only: it has not been used, other people do not know it, and reality has not changed.' },
    { role: 'user', content: JSON.stringify({ edition: content.edition, literal_action: literalAction, player: { id: 'player-1', name: state.player?.name ?? '플레이어' }, time: state.time ?? {}, scene: { location_id: scene.location_id ?? null, location: location ? { id: location.id, name: location.name, description: location.description } : null, present_npc_ids: actorIds }, present_npc_ids: actorIds, actors, app: COMPANY_APP_PREMISE, recent_turns: (context?.turns ?? []).slice(-6).map((turn) => ({ literal_action: turn.literal_action, story_text: turn.story_text, turn_summary: turn.turn_summary })) }) }
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
  const firstContentTimeout = new Promise((_, reject) => { firstTimer = setTimeout(() => { request?.abort('v2_story_first_content_timeout'); reject(structuralTimeout('v2_story_first_content_timeout')); }, firstContentMs); });
  while (true) {
    let read;
    try { read = request ? await Promise.race([reader.read(), request.timeoutPromise, firstContent ? new Promise(() => {}) : firstContentTimeout]) : await reader.read(); }
    catch (error) { if (request?.reason()) throw structuralTimeout(request.reason()); throw error; }
    const { value, done } = read;
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') { ended = true; continue; }
      let payload; try { payload = JSON.parse(data); } catch { throw new Error('v2_story_invalid_stream'); }
      const delta = payload?.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta) { if (!firstContent) { firstContent = true; clearTimeout(firstTimer); } yield delta; }
    }
  }
  clearTimeout(firstTimer);
  if (!ended) throw new Error('v2_story_incomplete_stream');
}

function structuralTimeout(code) { const error = new Error(code); error.code = code; return error; }
function assertProviderResponse(response) { if (!response?.ok) throw new Error('v2_provider_failure'); }
