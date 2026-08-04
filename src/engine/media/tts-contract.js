/**
 * TTS eligibility gate — decides whether a line is even allowed to reach the external TTS
 * provider, before any network call is made. The default-OFF / no-autoplay-during-streaming
 * rules live in the frontend (nothing to synthesize server-side ever forces a call); this
 * module is the server-side backstop that a request naming the narrator, an unknown speaker,
 * or a character with no voice_id is rejected outright, regardless of what the client sends.
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function findCharacter(master, speakerId) {
  const characters = Array.isArray(master?.characters) ? master.characters : [];
  return characters.find(character => character?.character_id === speakerId) ?? null;
}

/**
 * speakerId: null/undefined/'narrator' all mean "not a character line" — never eligible.
 * Returns { eligible: true, voice_id } or { eligible: false, code }.
 */
export function resolveTtsEligibility({ speakerId, text, master } = {}) {
  if (typeof text !== 'string' || !text.trim()) return { eligible: false, code: 'EMPTY_TEXT' };
  if (!speakerId || speakerId === 'narrator') return { eligible: false, code: 'NARRATOR_NOT_ELIGIBLE' };
  const character = findCharacter(master, speakerId);
  if (!character) return { eligible: false, code: 'UNKNOWN_SPEAKER' };
  const voiceId = typeof character.voice_id === 'string' && character.voice_id.trim() ? character.voice_id : null;
  if (!voiceId) return { eligible: false, code: 'NO_VOICE_ID' };
  return { eligible: true, voice_id: voiceId };
}

/** A stable cache key for the frontend/edge cache — same speaker+exact text always maps to the same key. */
export function ttsCacheKey(speakerId, text) {
  return `${speakerId}:${typeof text === 'string' ? text.trim() : ''}`;
}
