import { HttpError, ok, readJson, requireString } from './http.js';
import { createTurnRoutes as createBaseTurnRoutes, masterFromEdition } from './turn-routes-runtime.js';
import { resolveTtsEligibility } from '../engine/index.js';
import { createRegisteredNpcPolicyFetch } from './npc-policy-fetch.js';
import { enrichAppEnvelope, enrichContextEnvelope, envelopeContext } from './product-response.js';

const TTS_WORKER_URL = 'https://fancy-dust-7f8c.zeroslove.workers.dev/';

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa === 'function') return btoa(binary);
  return globalThis.Buffer?.from?.(bytes)?.toString?.('base64') ?? '';
}

async function parseTtsUrl(response, { allowAudioCompatibility = false } = {}) {
  if (!response?.ok) {
    throw new HttpError(502, 'tts_upstream_failure', 'TTS Worker request failed', true);
  }
  const contentType = response.headers?.get?.('content-type') ?? '';
  if (contentType.includes('application/json')) {
    let payload;
    try { payload = await response.json(); }
    catch { throw new HttpError(502, 'tts_invalid_response', 'TTS Worker returned an invalid response', true); }
    if (!plainObject(payload) || typeof payload.url !== 'string' || !/^(?:https?:|data:audio\/)/i.test(payload.url)) {
      throw new HttpError(502, 'tts_invalid_response', 'TTS Worker returned no audio URL', true);
    }
    return payload.url;
  }
  if (allowAudioCompatibility && /^audio\//i.test(contentType)) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    const encoded = bytesToBase64(bytes);
    if (encoded) return `data:${contentType.split(';')[0] || 'audio/mpeg'};base64,${encoded}`;
  }
  throw new HttpError(502, 'tts_invalid_response', 'TTS Worker returned no audio URL', true);
}

async function synthesizeViaServiceBinding({ env, eligibility, spokenText, direction }) {
  let response;
  try {
    response = await env.TTS_WORKER.fetch(env.TTS_WORKER_URL || TTS_WORKER_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ voice_id: eligibility.voice_id, text: spokenText, direction })
    });
  } catch {
    throw new HttpError(502, 'tts_upstream_failure', 'TTS Worker request failed', true);
  }
  return parseTtsUrl(response);
}

/** Compatibility-only path for isolated tests or old local environments. */
async function synthesizeViaLegacyProvider({ env, eligibility, spokenText, direction, fetchImpl }) {
  let response;
  try {
    response = await fetchImpl(env.TTS_API_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.TTS_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ voice_id: eligibility.voice_id, text: spokenText, direction })
    });
  } catch {
    throw new HttpError(502, 'tts_upstream_failure', 'TTS upstream request failed', true);
  }
  return parseTtsUrl(response, { allowAudioCompatibility: true });
}

async function jsonPayload(response) {
  try { return await response.clone().json(); }
  catch { return null; }
}

function responseWithJson(response, payload) {
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(payload), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function requestObject(request) {
  try {
    const value = await request.clone().json();
    return plainObject(value) ? value : {};
  } catch {
    return {};
  }
}

/**
 * Company uses the same playback contract as the Hospital frontend:
 * the independent TTS Worker returns a stable audio URL and the browser's
 * persistent <audio> element plays that URL directly. The API Worker never
 * downloads and re-wraps production service-binding audio as a Blob.
 */
export function createMediaAwareTurnRoutes({ fetchImpl = fetch, edition } = {}) {
  const policyFetch = createRegisteredNpcPolicyFetch(fetchImpl);
  const routes = createBaseTurnRoutes({ fetchImpl: policyFetch, edition });
  const master = masterFromEdition(edition);

  return {
    ...routes,

    async context(request, env, ctx) {
      const response = await routes.context(request, env, ctx);
      if (!response?.ok) return response;
      const payload = await jsonPayload(response);
      if (!plainObject(payload)) return response;
      enrichContextEnvelope(payload, edition);
      return responseWithJson(response, payload);
    },

    async appState(request, env, ctx) {
      const body = await requestObject(request);
      const response = await routes.appState(request, env, ctx);
      if (!response?.ok || typeof body.game_id !== 'string' || !body.game_id) return response;
      const payload = await jsonPayload(response);
      if (!plainObject(payload)) return response;

      const contextRequest = new Request(request.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ game_id: body.game_id, recent_turns: 2 })
      });
      const contextResponse = await routes.context(contextRequest, env, ctx);
      if (!contextResponse?.ok) return response;
      const contextPayload = await jsonPayload(contextResponse);
      const context = envelopeContext(contextPayload);
      if (!context) return response;
      enrichAppEnvelope(payload, context, edition);
      return responseWithJson(response, payload);
    },

    async tts(request, env) {
      const body = await readJson(request);
      requireString(body.game_id, 'game_id');
      const spokenText = requireString(body.text, 'text');
      const speakerId = typeof body.character_id === 'string' ? body.character_id : null;
      const direction = typeof body.direction === 'string' ? body.direction.trim().slice(0, 120) : '';
      const eligibility = resolveTtsEligibility({ speakerId, text: spokenText, master });
      if (!eligibility.eligible) {
        throw new HttpError(422, eligibility.code.toLowerCase(), 'TTS를 재생할 수 없습니다.', false);
      }

      let url;
      if (env?.TTS_WORKER && typeof env.TTS_WORKER.fetch === 'function') {
        url = await synthesizeViaServiceBinding({ env, eligibility, spokenText, direction });
      } else if (typeof env?.TTS_API_URL === 'string' && env.TTS_API_URL && typeof env?.TTS_API_KEY === 'string' && env.TTS_API_KEY) {
        url = await synthesizeViaLegacyProvider({ env, eligibility, spokenText, direction, fetchImpl: policyFetch });
      } else {
        throw new HttpError(500, 'configuration_error', 'TTS_WORKER service binding is not configured', false);
      }
      return ok({ url });
    }
  };
}
