import { HttpError } from './http.js';
import { repairAndParseExtractJson } from '../engine/extract/json-repair.js';
import { appendLateAuthoritativeCharacterCanon } from '../engine/story-prompt.js';
import { parseTaggingResponse } from '../engine/speaker-tagger.js';

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
  const finalMessages = appendLateAuthoritativeCharacterCanon(messages);
  const response = await postCompletion(env, fetchImpl, {
    model: requireEnv(env, 'STORY_MODEL'),
    messages: finalMessages,
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

/**
 * 단일 대사 화자 판별 호출 — parser가 미확정으로 남긴 대사만 문맥과 함께 보낸다.
 * OpenAI 호환 envelope에서 choices[0].message.content를 추출해 태거 결과 객체를 반환한다
 * (envelope 전체를 반환하지 않는다). 실패는 파이프라인을 막지 않는다 — 호출부가 warning으로 기록.
 */
export async function runSpeakerTagging({ env, fetchImpl, messages, allowlist = [], timeoutMs = 10000 }) {
  const signal = typeof AbortSignal?.timeout === 'function' ? AbortSignal.timeout(timeoutMs) : undefined;
  let response;
  try {
    response = await postCompletion(env, fetchImpl, {
      model: requireEnv(env, 'EXTRACT_MODEL'),
      messages,
      stream: false,
      thinking: { type: 'disabled' },
      response_format: { type: 'json_object' },
      max_tokens: 400
    }, { signal });
  } catch (error) {
    if (error instanceof HttpError) {
      // timeout과 upstream failure를 구분해 기록한다 (logTurnTiming에 그대로 노출)
      if (error.code === 'extract_timeout') return { speakers: [], warning: 'speaker_tagging_timeout' };
      if (error.code === 'llm_upstream_failure') return { speakers: [], warning: 'speaker_tagging_upstream_failure' };
    }
    throw error;
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    return { speakers: [], warning: 'speaker_tagging_invalid_json' };
  }
  const choice = payload?.choices?.[0];
  if (!choice || choice.finish_reason === 'length') {
    return { speakers: [], warning: choice?.finish_reason === 'length' ? 'speaker_tagging_truncated' : 'speaker_tagging_invalid_json' };
  }
  const content = choice?.message?.content;
  const speakers = parseTaggingResponse(content, allowlist);
  let warning = null;
  if (!speakers.length) {
    // 빈 결과를 구분한다: content가 유효한 {"speakers": [...]} JSON이 아니면 invalid_response,
    // 유효하지만 전부 null/빈이면 null-only(unresolved)로 기록한다.
    const stripped = String(content ?? '').trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    let validJson = false;
    try { validJson = Array.isArray(JSON.parse(stripped)?.speakers); } catch { validJson = false; }
    if (!validJson) warning = 'speaker_tagging_invalid_json';
  }
  return { speakers, warning };
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
