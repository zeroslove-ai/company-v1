import { buildStoryContext } from '../domain/memory.js';
import { canonicalActors, registeredActorIds } from '../domain/content.js';

export const R3_PROVIDER_TIMEOUTS = Object.freeze({ storyFirstContentMs: 30_000, storyTotalMs: 120_000, observerMs: 75_000 });

const STORY_SYSTEM_PROMPT = 'Write natural Korean Company interactive fiction as plain text, not JSON. Never escape quotation marks or other ordinary prose punctuation with backslashes. The user context contains the canonical product and a story contract; follow that contract as a hard boundary. For ordinary turns, preserve the submitted literal player action exactly and narrate its consequences without replacing it. Use only the registered Company setting, location, and actors; include workplace and social context without turning the story into a productivity, helpdesk, or chat-assistant task. When active_rules contains an institutional rule, treat every non-empty active rule as an authoritative current-world institutional/system fact already in force, not an optional suggestion or possible future rule. Preserve each rule\'s exact stated content and exact subject/counterparty scope. When the current scene, literal player action, or naturally narrated consequence materially concerns a rule\'s scoped premise or observable consequence, make that premise visibly true in natural narration and do not silently ignore it. For an active rule whose own mode=on_player_request or request-triggered trigger says it executes on an eligible counterparty request, a current literal player action that is that direct eligible request satisfies the trigger in this turn; begin the rule-required behavior in this same Story turn. Do not refuse, delay, substitute another action, or route the result to a future discussion because ordinary workplace or social norms would otherwise object. NPC reluctance, embarrassment, anger, protest, hesitation, surprise, dislike, or discomfort may shape the emotional tone, but those feelings cannot veto the rule\'s stated institutional execution. Rule execution alone must not manufacture affection, comfort, consent, desire, romance, obedience-as-personality, trust, relationship, or player sexual state unless the rule itself explicitly states it. Do not force exposition when the scene has no meaningful connection to a rule, and do not mechanically quote or copy the rule text merely to satisfy the contract. Apply only the stated content and scope; activation alone must never imply personal affection, comfort, consent, desire, romance, obedience, relationship, or player sexual state. If the literal player action names a canonical destination, preserve that exact canonical destination name in the Story evidence rather than shortening it to a generic room label. End every Story with one unambiguous final section containing exactly four distinct, natural, complete literal player actions numbered 1 through 4, one action per line. Those four strings are the only choice source and must be visibly present verbatim in the current Story for the Observer to copy. Do not emit OOC, control markers, semantic taxonomies, outcome classifiers, or a second author voice.';
const OPENING_STORY_SYSTEM_PROMPT = `${STORY_SYSTEM_PROMPT} Opening-only product and agency law before the first literal player input: show the player discovering or recognizing the unfamiliar private app named in product.app_name/product.title while NPCs remain ignorant until the player reveals it. Passive scene exposure is allowed, including the private app being present, appearing, visible, or available for the player to notice, but do not make the player choose or perform an interaction. Do not author any voluntary player speech or reply, nod or gesture, movement, touching, clicking, typing, opening, closing, hiding the app, drinking, eating, reviewing, working, acknowledging, deciding, accepting, refusing, or other intentional player action. Do not state or imply a completed player choice. End with the player still free to choose among the four Story-authored actions or free-form input.`;
const OBSERVER_SYSTEM_PROMPT = 'Return JSON only for the completed current Story using these exact top-level keys: elapsed_minutes, location, entered, exited, present_actor_ids, scene_note, clothing_changes, turn_summary, mind_monitor, choices, and warnings. The user payload includes canonical_actor_directory with exact registered {id,name} pairs. For mind_monitor, use exact canonical actor IDs from that directory as object keys, never actor names, invented IDs, or player state; include only relevant current or post-Story NPCs materially present in the scene. For entered/exited items, actor_id must come from that directory and the exact contiguous quote must contain that actor\'s exact canonical name; a quote only about the player moving cannot establish an NPC transition. The location value must be either null or {"location_id":"<registered canonical id>","quote":"<exact contiguous quote from the current Story>"}. If the current Story explicitly says that the player enters, arrives at, moves to, or is now in a registered location, project that destination location; do not copy the previous location and do not return location_evidence or any other location key. Use only a registered canonical location id and an exact Story quote. Project elapsed_minutes, entered/exited actor evidence, scene_note, clothing_changes, the turn_summary, relevant Mind Monitor surface/subconscious, and warnings. The Story is the only choice authority: return choices as the exact four final numbered Story action strings in their original order, character-for-character. Preserve a literal backslash immediately before an ASCII double quote in a Story choice; the JSON string may need two backslashes to represent that one literal backslash. If the current Story does not contain exactly four distinct non-empty literal actions, return an empty choices array; never invent, mutate, pad, truncate, deduplicate, or use prior-turn choices. Never invent choices or unknown IDs. This is not a second narrative.';

function canonicalActorDirectory(content) {
  return canonicalActors(content, [...registeredActorIds(content)]).map(({ id, name }) => ({ id, name }));
}

function withPromptContent(payload, promptContent = null) {
  if (!promptContent) return payload;
  return { ...payload, messages: [{ ...payload.messages[0], content: promptContent }, ...payload.messages.slice(1)] };
}

const deterministicChoices = Object.freeze([
  '주변의 상황을 차분히 살펴본다.', '가까운 누군가에게 인사한다.',
  '현재 장면을 다시 확인한다.', '원하는 행동을 직접 입력한다.'
]);

export function createDeterministicR3Provider() {
  return {
    async *story({ opening = false, literalAction = '' }) {
      if (opening) yield '첫 출근일의 아침, 회사 로비에서 안내 데스크와 사람들의 목소리가 서로 섞인다.\n\n';
      else yield `당신은 “${literalAction}”이라는 행동을 선택했다. 주변의 상황이 잠시 멈추고 다음 장면이 자연스럽게 이어진다.\n\n`;
      yield `현재 장면에는 아직 확정되지 않은 여백이 남아 있다.\n\n다음 행동\n1. ${deterministicChoices[0]}\n2. ${deterministicChoices[1]}\n3. ${deterministicChoices[2]}\n4. ${deterministicChoices[3]}`;
    },
    async observe({ storyText }) { return { elapsed_minutes: 3, choices: [...deterministicChoices], turn_summary: storyText.slice(0, 180), mind_monitor: {} }; }
  };
}

export function createR3Provider({ env, fetchImpl = fetch, timeouts: overrides = {} } = {}) {
  const baseUrl = env?.LLM_API_URL?.replace(/\/$/, ''); const apiKey = env?.LLM_API_KEY; const storyModel = env?.STORY_MODEL; const observerModel = env?.EXTRACT_MODEL; const timeouts = { ...R3_PROVIDER_TIMEOUTS, ...overrides };
  if (!baseUrl || !apiKey || !storyModel || !observerModel) throw new Error('r3_provider_configuration_invalid');
  const completionUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

  async function request(payload, timeoutMs, code, { firstContentMs = null, promptContent = null, onResponseHeaders = null } = {}) {
    const controller = new AbortController(); let timedOut = null;
    const totalDeadline = Date.now() + timeoutMs;
    const totalTimer = setTimeout(() => { timedOut = timeoutError(code); controller.abort(timedOut); }, Math.max(0, totalDeadline - Date.now()));
    const firstDeadline = firstContentMs === null ? null : Date.now() + firstContentMs;
    const firstTimer = firstContentMs === null ? null : setTimeout(() => { timedOut = timeoutError('r3_story_first_content_timeout'); controller.abort(timedOut); }, firstContentMs);
    const cancelFirst = () => { if (firstTimer) clearTimeout(firstTimer); };
    const cancel = () => { clearTimeout(totalTimer); cancelFirst(); };
    try {
      const response = await fetchImpl(completionUrl, { method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify(withPromptContent(payload, promptContent)), signal: controller.signal });
      if (!response.ok) throw new Error(`r3_provider_${response.status}`);
      onResponseHeaders?.();
      return { response, deadline: totalDeadline, firstDeadline, cancel, cancelFirst, abort: reason => controller.abort(reason), timedOut: () => timedOut };
    } catch (error) { cancel(); throw timedOut ?? error; }
  }

  return {
    async *story({ context, literalAction = '', opening = false, content, onTiming = null }) {
      const handle = await request({ model: storyModel, stream: true, thinking: { type: 'disabled' }, max_tokens: 5000, messages: [
        { role: 'system', content: STORY_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify({ opening, ...buildStoryContext(context, literalAction, { content, opening }) }) }
      ] }, timeouts.storyTotalMs, 'r3_story_timeout', { firstContentMs: timeouts.storyFirstContentMs, promptContent: opening && !literalAction ? OPENING_STORY_SYSTEM_PROMPT : STORY_SYSTEM_PROMPT, onResponseHeaders: () => onTiming?.('story_response_headers') });
      try { yield* readOpenAiStream(handle.response, { firstDeadline: handle.firstDeadline, totalDeadline: handle.deadline, cancelFirst: handle.cancelFirst, abort: handle.abort, onFirstDelta: () => onTiming?.('story_first_delta') }); }
      catch (error) { throw handle.timedOut() ?? error; }
      finally { handle.cancel(); }
    },
    async observe({ context, literalAction, storyText, content }) {
      const handle = await request({ model: observerModel, stream: false, thinking: { type: 'disabled' }, temperature: 0, max_tokens: 1600, response_format: { type: 'json_object' }, messages: [
        { role: 'system', content: OBSERVER_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify({ literal_action: literalAction, story_text: storyText, current_context: context?.state?.state, canonical_actor_directory: canonicalActorDirectory(content) }) }
      ] }, timeouts.observerMs, 'r3_observer_timeout', { promptContent: OBSERVER_SYSTEM_PROMPT });
      try { const payload = await handle.response.json(); const raw = payload?.choices?.[0]?.message?.content; if (typeof raw !== 'string') throw new Error('r3_observer_missing'); return JSON.parse(raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '')); }
      finally { handle.cancel(); }
    }
  };
}

function timeoutError(code) { const error = new Error(code); error.code = code; return error; }
function timeoutPromise(ms, code, onTimeout) { let timer; const promise = new Promise((_, reject) => { timer = setTimeout(() => { onTimeout?.(); reject(timeoutError(code)); }, Math.max(0, ms)); }); return { promise, cancel: () => clearTimeout(timer) }; }

async function* readOpenAiStream(response, { firstDeadline, totalDeadline, cancelFirst, abort, onFirstDelta = null } = {}) {
  if (!response.body) throw new Error('r3_story_empty_stream');
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let received = false; let firstExpired = false; let totalExpired = false;
  const cancelReader = reason => { try { const pending = reader.cancel(reason); pending?.catch?.(() => {}); } catch {} };
  const first = timeoutPromise(Math.max(0, (firstDeadline ?? Date.now()) - Date.now()), 'r3_story_first_content_timeout', () => { firstExpired = true; abort?.('r3_story_first_content_timeout'); cancelReader('r3_story_first_content_timeout'); });
  const total = timeoutPromise(Math.max(0, (totalDeadline ?? Date.now()) - Date.now()), 'r3_story_timeout', () => { totalExpired = true; abort?.('r3_story_timeout'); cancelReader('r3_story_timeout'); });
  try {
    while (true) {
      const result = await Promise.race([reader.read(), first.promise, total.promise]); if (result.done) break;
      buffer += decoder.decode(result.value, { stream: true }); const lines = buffer.split(/\r?\n/); buffer = lines.pop() ?? '';
      for (const line of lines) { if (!line.startsWith('data:')) continue; const data = line.slice(5).trim(); if (data === '[DONE]') continue; const payload = JSON.parse(data); const delta = payload?.choices?.[0]?.delta?.content; if (typeof delta === 'string' && delta) { if (!received) onFirstDelta?.(); received = true; first.cancel(); cancelFirst?.(); yield delta; } }
    }
  } catch (error) { if (totalExpired) throw timeoutError('r3_story_timeout'); if (firstExpired && !received) throw timeoutError('r3_story_first_content_timeout'); throw error; }
  finally { first.cancel(); total.cancel(); }
  if (totalExpired) throw timeoutError('r3_story_timeout'); if (firstExpired && !received) throw timeoutError('r3_story_first_content_timeout'); if (!received) throw new Error('r3_story_no_content');
}
