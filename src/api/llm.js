import { HttpError } from './http.js';
import { repairAndParseExtractJson } from '../engine/extract/json-repair.js';

const EXTRACT_TIMEOUT_MS = 75000;

function requireEnv(env, name) {
  const value = env?.[name];
  if (typeof value !== 'string' || value === '') throw new HttpError(500, 'configuration_error', `${name} is not configured`);
  return value;
}

function completionUrl(env) {
  const base = requireEnv(env, 'LLM_API_URL').replace(/\/$/, '');
  return base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
}

async function postCompletion(env, fetchImpl, body, { signal } = {}) {
  let response;
  try {
    response = await fetchImpl(completionUrl(env), {
      method: 'POST',
      headers: { authorization: `Bearer ${requireEnv(env, 'LLM_API_KEY')}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      ...(signal ? { signal } : {})
    });
  } catch (error) {
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
      throw new HttpError(504, 'extract_timeout', 'LLM upstream request timed out', true);
    }
    throw new HttpError(502, 'llm_upstream_failure', 'LLM upstream request failed', true);
  }
  if (!response.ok) throw new HttpError(502, 'llm_upstream_failure', 'LLM upstream request failed', true);
  return response;
}

async function* parseOpenAiSse(body, timing, startedAt) {
  if (!body) throw new HttpError(502, 'story_incomplete', 'Story stream has no body', true);
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;
  let characterCount = 0;
  while (true) {
    const { value, done: readerDone } = await reader.read();
    if (readerDone) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') {
        done = true;
        continue;
      }
      try {
        const payload = JSON.parse(data);
        const text = payload.choices?.[0]?.delta?.content;
        if (typeof text === 'string' && text) {
          if (timing && timing.story_first_content_ms === undefined) timing.story_first_content_ms = Date.now() - startedAt;
          characterCount += text.length;
          yield text;
        }
      } catch {
        throw new HttpError(502, 'story_invalid_sse', 'Story SSE payload is invalid', true);
      }
    }
  }
  if (timing) {
    timing.story_network_total_ms = Date.now() - startedAt;
    timing.story_character_count = characterCount;
  }
  if (!done) throw new HttpError(502, 'story_incomplete', 'Story stream ended before [DONE]', true);
}

/** Streams the Story completion. thinking stays disabled and the model name is never hardcoded. */
export async function streamStory({ env, fetchImpl, messages, timing = {} }) {
  const startedAt = Date.now();
  const response = await postCompletion(env, fetchImpl, {
    model: requireEnv(env, 'STORY_MODEL'),
    messages,
    stream: true,
    thinking: { type: 'disabled' },
    max_tokens: 5000
  });
  timing.story_headers_ms = Date.now() - startedAt;
  return { chunks: parseOpenAiSse(response.body, timing, startedAt), timing };
}

function parseExtractContent(content) {
  const stripped = String(content ?? '').trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  try {
    return repairAndParseExtractJson(stripped);
  } catch {
    throw new HttpError(502, 'extract_invalid_json', 'Extract response is not valid JSON', true);
  }
}

/** Runs the single Extract completion. No automatic retry or repair call is ever issued here. */
export async function runExtract({ env, fetchImpl, messages }) {
  const signal = typeof AbortSignal?.timeout === 'function' ? AbortSignal.timeout(EXTRACT_TIMEOUT_MS) : undefined;
  const response = await postCompletion(env, fetchImpl, {
    model: requireEnv(env, 'EXTRACT_MODEL'),
    messages,
    stream: false,
    thinking: { type: 'disabled' },
    response_format: { type: 'json_object' },
    max_tokens: 5000
  }, { signal });
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new HttpError(502, 'extract_invalid_json', 'Extract upstream response is not JSON', true);
  }
  const choice = payload.choices?.[0];
  if (choice?.finish_reason === 'length') throw new HttpError(502, 'extract_truncated', 'Extract response exceeded its output limit', true);
  return parseExtractContent(choice?.message?.content);
}
