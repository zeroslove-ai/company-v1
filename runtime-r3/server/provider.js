import { buildStoryContext } from '../domain/memory.js';

export const R3_PROVIDER_TIMEOUTS = Object.freeze({ storyFirstContentMs: 30_000, storyTotalMs: 120_000, observerMs: 75_000 });

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

  async function request(payload, timeoutMs, code, { firstContentMs = null } = {}) {
    const controller = new AbortController(); let timedOut = null;
    const totalTimer = setTimeout(() => { timedOut = timeoutError(code); controller.abort(timedOut); }, timeoutMs);
    const firstDeadline = firstContentMs === null ? null : Date.now() + firstContentMs;
    const firstTimer = firstContentMs === null ? null : setTimeout(() => { timedOut = timeoutError('r3_story_first_content_timeout'); controller.abort(timedOut); }, firstContentMs);
    const cancelFirst = () => { if (firstTimer) clearTimeout(firstTimer); };
    const cancel = () => { clearTimeout(totalTimer); cancelFirst(); };
    try {
      const response = await fetchImpl(completionUrl, { method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
      if (!response.ok) throw new Error(`r3_provider_${response.status}`);
      return { response, deadline: Date.now() + timeoutMs, firstDeadline, cancel, cancelFirst, abort: reason => controller.abort(reason), timedOut: () => timedOut };
    } catch (error) { cancel(); throw timedOut ?? error; }
  }

  return {
    async *story({ context, literalAction = '', opening = false, content }) {
      const handle = await request({ model: storyModel, stream: true, thinking: { type: 'disabled' }, max_tokens: 5000, messages: [
        { role: 'system', content: 'Write natural Korean Company interactive fiction for 상식개변: 회사편. You are the only narrative author. Preserve the literal player action. The private app premise belongs to the player alone until the player reveals it; NPCs do not know it. Never complete an unrequested player action. Write a vivid player-visible scene and end with exactly four natural full-action next suggestions. Do not emit OOC, control markers, semantic taxonomies, outcome classifiers, or a second author voice.' },
        { role: 'user', content: JSON.stringify({ opening, ...buildStoryContext(context, literalAction, { content, opening }) }) }
      ] }, timeouts.storyTotalMs, 'r3_story_timeout', { firstContentMs: timeouts.storyFirstContentMs });
      try { yield* readOpenAiStream(handle.response, { firstDeadline: handle.firstDeadline, totalDeadline: handle.deadline, cancelFirst: handle.cancelFirst, abort: handle.abort }); }
      catch (error) { throw handle.timedOut() ?? error; }
      finally { handle.cancel(); }
    },
    async observe({ context, literalAction, storyText }) {
      const handle = await request({ model: observerModel, stream: false, thinking: { type: 'disabled' }, temperature: 0, max_tokens: 1600, response_format: { type: 'json_object' }, messages: [
        { role: 'system', content: 'Return JSON only. Project one completed Story into elapsed_minutes, location evidence, entered/exited actor evidence, scene_note, clothing_changes, four copied choices, turn_summary, relevant Mind Monitor surface/subconscious, and warnings. Never invent choices or unknown IDs. This is not a second narrative.' },
        { role: 'user', content: JSON.stringify({ literal_action: literalAction, story_text: storyText, current_context: context?.state?.state }) }
      ] }, timeouts.observerMs, 'r3_observer_timeout');
      try { const payload = await handle.response.json(); const raw = payload?.choices?.[0]?.message?.content; if (typeof raw !== 'string') throw new Error('r3_observer_missing'); return JSON.parse(raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '')); }
      finally { handle.cancel(); }
    }
  };
}

function timeoutError(code) { const error = new Error(code); error.code = code; return error; }
function timeoutPromise(ms, code, onTimeout) { let timer; const promise = new Promise((_, reject) => { timer = setTimeout(() => { onTimeout?.(); reject(timeoutError(code)); }, Math.max(0, ms)); }); return { promise, cancel: () => clearTimeout(timer) }; }

async function* readOpenAiStream(response, { firstDeadline, totalDeadline, cancelFirst, abort } = {}) {
  if (!response.body) throw new Error('r3_story_empty_stream');
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let received = false; let firstExpired = false; let totalExpired = false;
  const cancelReader = reason => { try { const pending = reader.cancel(reason); pending?.catch?.(() => {}); } catch {} };
  const first = timeoutPromise(Math.max(0, (firstDeadline ?? Date.now()) - Date.now()), 'r3_story_first_content_timeout', () => { firstExpired = true; abort?.('r3_story_first_content_timeout'); cancelReader('r3_story_first_content_timeout'); });
  const total = timeoutPromise(Math.max(0, (totalDeadline ?? Date.now()) - Date.now()), 'r3_story_timeout', () => { totalExpired = true; abort?.('r3_story_timeout'); cancelReader('r3_story_timeout'); });
  try {
    while (true) {
      const result = await Promise.race([reader.read(), first.promise, total.promise]); if (result.done) break;
      buffer += decoder.decode(result.value, { stream: true }); const lines = buffer.split(/\r?\n/); buffer = lines.pop() ?? '';
      for (const line of lines) { if (!line.startsWith('data:')) continue; const data = line.slice(5).trim(); if (data === '[DONE]') continue; const payload = JSON.parse(data); const delta = payload?.choices?.[0]?.delta?.content; if (typeof delta === 'string' && delta) { received = true; first.cancel(); cancelFirst?.(); yield delta; } }
    }
  } catch (error) { if (totalExpired) throw timeoutError('r3_story_timeout'); if (firstExpired && !received) throw timeoutError('r3_story_first_content_timeout'); throw error; }
  finally { first.cancel(); total.cancel(); }
  if (totalExpired) throw timeoutError('r3_story_timeout'); if (firstExpired && !received) throw timeoutError('r3_story_first_content_timeout'); if (!received) throw new Error('r3_story_no_content');
}
