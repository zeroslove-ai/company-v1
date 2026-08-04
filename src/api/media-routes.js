import { HttpError, readJson, requireString } from './http.js';
import { createTurnRoutes as createBaseTurnRoutes, masterFromEdition } from './turn-routes.js';
import { resolveTtsEligibility } from '../engine/index.js';

const TTS_WORKER_URL = 'https://fancy-dust-7f8c.zeroslove.workers.dev/';
const CORS_AUDIO_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type'
};

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Keeps every existing Company turn route unchanged and overrides only /api/tts.
 * The independent TTS Worker must be called through a Cloudflare Service Binding;
 * a same-zone workers.dev fetch is blocked by Cloudflare with error 1042.
 */
export function createMediaAwareTurnRoutes({ fetchImpl = fetch, edition } = {}) {
  const routes = createBaseTurnRoutes({ fetchImpl, edition });
  const master = masterFromEdition(edition);

  return {
    ...routes,
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
      if (!env?.TTS_WORKER || typeof env.TTS_WORKER.fetch !== 'function') {
        throw new HttpError(500, 'configuration_error', 'TTS_WORKER service binding is not configured', false);
      }

      let workerResponse;
      try {
        workerResponse = await env.TTS_WORKER.fetch(env.TTS_WORKER_URL || TTS_WORKER_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ voice_id: eligibility.voice_id, text: spokenText, direction })
        });
      } catch {
        throw new HttpError(502, 'tts_upstream_failure', 'TTS Worker request failed', true);
      }
      if (!workerResponse.ok) {
        throw new HttpError(502, 'tts_upstream_failure', 'TTS Worker request failed', true);
      }

      let payload;
      try { payload = await workerResponse.json(); }
      catch { throw new HttpError(502, 'tts_invalid_response', 'TTS Worker returned an invalid response', true); }
      if (!plainObject(payload) || typeof payload.url !== 'string' || !/^https?:\/\//i.test(payload.url)) {
        throw new HttpError(502, 'tts_invalid_response', 'TTS Worker returned no audio URL', true);
      }

      let audioResponse;
      try { audioResponse = await fetchImpl(payload.url); }
      catch { throw new HttpError(502, 'tts_audio_fetch_failed', 'Generated TTS audio could not be loaded', true); }
      if (!audioResponse.ok || !audioResponse.body) {
        throw new HttpError(502, 'tts_audio_fetch_failed', 'Generated TTS audio could not be loaded', true);
      }

      return new Response(audioResponse.body, {
        status: 200,
        headers: {
          ...CORS_AUDIO_HEADERS,
          'content-type': audioResponse.headers.get('content-type') ?? 'audio/mpeg',
          'cache-control': audioResponse.headers.get('cache-control') ?? 'private, max-age=86400'
        }
      });
    }
  };
}
