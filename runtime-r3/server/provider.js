import { buildStoryContext } from '../domain/memory.js';

export const R3_PROVIDER_TIMEOUTS = Object.freeze({ storyFirstContentMs: 30_000, storyTotalMs: 120_000, observerMs: 75_000 });

const deterministicChoices = Object.freeze([
  '\uC8FC\uBCC0\uC758 \uC0C1\uD669\uC744 \uCC28\uBD84\uD788 \uC0B4\uD3B4\uBCF8\uB2E4.',
  '\uAC00\uAE4C\uC6B4 \uB204\uAD70\uAC00\uC5D0\uAC8C \uC778\uC0AC\uD55C\uB2E4.',
  '\uD604\uC7AC \uC7A5\uBA74\uC744 \uB2E4\uC2DC \uD655\uC778\uD55C\uB2E4.',
  '\uC6D0\uD558\uB294 \uD589\uB3D9\uC744 \uC9C1\uC811 \uC785\uB825\uD55C\uB2E4.'
]);

export function createDeterministicR3Provider() {
  return {
    async *story({ opening = false, literalAction = '' }) {
      if (opening) yield '\uCCAB \uCD9C\uADFC\uC77C\uC758 \uC544\uCE68, \uD68C\uC0AC \uB85C\uBE44\uC5D0\uC11C \uC548\uB0B4 \uB514\uC2A4\uD06C\uC640 \uC0AC\uB78C\uB4E4\uC758 \uBAA9\uC18C\uB9AC\uAC00 \uC11C\uB85C \uC12E\uC778\uB2E4.\n\n';
      else yield `\uB2F9\uC2E0\uC740 \u201C${literalAction}\u201D\uC774\uB77C\uB294 \uD589\uB3D9\uC744 \uC120\uD0DD\uD588\uB2E4. \uC8FC\uBCC0\uC758 \uC0C1\uD669\uC774 \uC7A0\uC2DC \uBA48\uCD94\uACE0 \uB2E4\uC74C \uC7A5\uBA74\uC774 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC774\uC5B4\uC9C4\uB2E4.\n\n`;
      yield `\uD604\uC7AC \uC7A5\uBA74\uC5D0\uB294 \uC544\uC9C1 \uD655\uC815\uB418\uC9C0 \uC54A\uC740 \uC5EC\uBC31\uC774 \uB0A8\uC544 \uC788\uB2E4.\n\n\uB2E4\uC74C \uD589\uB3D9\n1. ${deterministicChoices[0]}\n2. ${deterministicChoices[1]}\n3. ${deterministicChoices[2]}\n4. ${deterministicChoices[3]}`;
    },
    async observe({ storyText }) {
      return { elapsed_minutes: 3, choices: [...deterministicChoices], turn_summary: storyText.slice(0, 180), mind_monitor: {} };
    }
  };
}

export function createR3Provider({ env, fetchImpl = fetch, timeouts: overrides = {} } = {}) {
  const baseUrl = env?.LLM_API_URL?.replace(/\/$/, ''); const apiKey = env?.LLM_API_KEY; const storyModel = env?.STORY_MODEL; const observerModel = env?.EXTRACT_MODEL; const timeouts = { ...R3_PROVIDER_TIMEOUTS, ...overrides };
  if (!baseUrl || !apiKey || !storyModel || !observerModel) throw new Error('r3_provider_configuration_invalid');
  const completionUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
  async function request(payload, timeoutMs, code) { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(code), timeoutMs); try { const response = await fetchImpl(completionUrl, { method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal }); if (!response.ok) throw new Error(`r3_provider_${response.status}`); return response; } finally { clearTimeout(timer); } }
  return {
    async *story({ context, literalAction = '', opening = false, content }) { const response = await request({ model: storyModel, stream: true, thinking: { type: 'disabled' }, max_tokens: 5000, messages: [{ role: 'system', content: 'Write natural Korean Company interactive fiction for 상식개변: 회사편. You are the only narrative author. Preserve the literal player action. The private app premise belongs to the player alone until the player reveals it; NPCs do not know it. Never complete an unrequested player action. Write a vivid player-visible scene and end with exactly four natural full-action next suggestions. Do not emit OOC, control markers, semantic taxonomies, outcome classifiers, or a second author voice.' }, { role: 'user', content: JSON.stringify({ opening, ...buildStoryContext(context, literalAction, { content, opening }) }) }] }, timeouts.storyTotalMs, 'r3_story_timeout'); yield* readOpenAiStream(response, timeouts.storyFirstContentMs); },
    async observe({ context, literalAction, storyText }) { const response = await request({ model: observerModel, stream: false, thinking: { type: 'disabled' }, temperature: 0, max_tokens: 1600, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'Return JSON only. Project one completed Story into elapsed_minutes, location evidence, entered/exited actor evidence, scene_note, clothing_changes, four copied choices, turn_summary, relevant Mind Monitor surface/subconscious, and warnings. Never invent choices or unknown IDs. This is not a second narrative.' }, { role: 'user', content: JSON.stringify({ literal_action, story_text: storyText, current_context: context?.state?.state }) }] }, timeouts.observerMs, 'r3_observer_timeout'); const payload = await response.json(); const raw = payload?.choices?.[0]?.message?.content; if (typeof raw !== 'string') throw new Error('r3_observer_missing'); return JSON.parse(raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '')); }
  };
}

async function* readOpenAiStream(response, firstContentMs) { if (!response.body) throw new Error('r3_story_empty_stream'); const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let received = false; const timer = setTimeout(() => reader.cancel('r3_story_first_content_timeout'), firstContentMs); try { while (true) { const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split(/\r?\n/); buffer = lines.pop() ?? ''; for (const line of lines) { if (!line.startsWith('data:')) continue; const data = line.slice(5).trim(); if (data === '[DONE]') continue; const payload = JSON.parse(data); const delta = payload?.choices?.[0]?.delta?.content; if (typeof delta === 'string' && delta) { received = true; yield delta; } } } } finally { clearTimeout(timer); } if (!received) throw new Error('r3_story_no_content'); }
