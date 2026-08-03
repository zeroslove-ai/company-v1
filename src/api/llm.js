import { HttpError } from './http.js';

function requireEnv(env, name) {
  const value = env?.[name];
  if (typeof value !== 'string' || value === '') throw new HttpError(500, 'configuration_error', `${name} is not configured`);
  return value;
}

function completionUrl(env) {
  const base = requireEnv(env, 'LLM_API_URL').replace(/\/$/, '');
  return base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
}

async function postCompletion(env, fetchImpl, body) {
  const response = await fetchImpl(completionUrl(env), {
    method: 'POST',
    headers: { authorization: `Bearer ${requireEnv(env, 'LLM_API_KEY')}`, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new HttpError(502, 'llm_upstream_failure', 'LLM upstream request failed', true);
  return response;
}

async function* parseOpenAiSse(body) {
  if (!body) throw new HttpError(502, 'story_incomplete', 'Story stream has no body', true);
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;
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
        if (typeof text === 'string' && text) yield text;
      } catch {
        throw new HttpError(502, 'story_invalid_sse', 'Story SSE payload is invalid', true);
      }
    }
  }
  if (!done) throw new HttpError(502, 'story_incomplete', 'Story stream ended before [DONE]', true);
}

export async function streamStory({ env, fetchImpl, messages }) {
  const response = await postCompletion(env, fetchImpl, { model: requireEnv(env, 'STORY_MODEL'), messages, stream: true });
  return parseOpenAiSse(response.body);
}

function parseExtractContent(content) {
  const stripped = String(content ?? '').trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(stripped);
  } catch {
    throw new HttpError(502, 'extract_invalid_json', 'Extract response is not valid JSON', true);
  }
}

export async function runExtract({ env, fetchImpl, messages }) {
  const response = await postCompletion(env, fetchImpl, { model: requireEnv(env, 'EXTRACT_MODEL'), messages, stream: false });
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new HttpError(502, 'extract_invalid_json', 'Extract upstream response is not JSON', true);
  }
  return parseExtractContent(payload.choices?.[0]?.message?.content);
}
