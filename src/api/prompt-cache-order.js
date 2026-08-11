const STORY_KEY_ORDER = [
  'edition',
  'turn_trigger',
  'registered_identities',
  'scene_actors',
  'possible_entrants',
  'remote_contacts',
  'reference_characters',
  'player_dialogue_policy',
  'world_rules',
  'scene_obligations',
  'context',
  'player_action',
  'expected_turn'
];

const EXTRACT_KEY_ORDER = [
  'extract_version',
  'registered_identities',
  'registered_locations',
  'story_text',
  'context',
  'expected_turn'
];

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function requestUrl(input) {
  return typeof input === 'string' ? input : input?.url ?? '';
}

function isCompletion(url) {
  return url.endsWith('/chat/completions') || url.includes('/chat/completions?');
}

function orderedObject(source, preferredOrder) {
  const result = {};
  const consumed = new Set();
  for (const key of preferredOrder) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    result[key] = source[key];
    consumed.add(key);
  }
  for (const key of Object.keys(source).filter(key => !consumed.has(key)).sort()) {
    result[key] = source[key];
  }
  return result;
}

export function classifyPromptPayload(payload) {
  if (!object(payload)) return null;
  if (
    Object.prototype.hasOwnProperty.call(payload, 'story_text')
    || Object.prototype.hasOwnProperty.call(payload, 'parsed_story')
    || (Object.prototype.hasOwnProperty.call(payload, 'registered_identities')
      && Object.prototype.hasOwnProperty.call(payload, 'registered_locations')
      && Object.prototype.hasOwnProperty.call(payload, 'extract_version'))
  ) return 'extract';
  if (
    Object.prototype.hasOwnProperty.call(payload, 'edition')
    && Object.prototype.hasOwnProperty.call(payload, 'scene_actors')
    && Object.prototype.hasOwnProperty.call(payload, 'context')
  ) return 'story';
  return null;
}

export function reorderPromptPayload(payload) {
  const type = classifyPromptPayload(payload);
  if (type === 'story') return orderedObject(payload, STORY_KEY_ORDER);
  if (type === 'extract') return orderedObject(payload, EXTRACT_KEY_ORDER);
  return payload;
}

/**
 * Reorders only JSON keys at the final outbound LLM boundary. Values and
 * message ordering remain unchanged. This keeps stable canon/registry data
 * before turn-specific action, story, and turn-number fields so DeepSeek's
 * prefix cache can reuse the largest safe prefix.
 */
export function applyPromptCacheOrder(init = {}) {
  if (typeof init.body !== 'string') return init;
  let body;
  try { body = JSON.parse(init.body); }
  catch { return init; }
  if (!Array.isArray(body.messages)) return init;

  let changed = false;
  const messages = body.messages.map(message => {
    if (message?.role !== 'user' || typeof message.content !== 'string') return message;
    let payload;
    try { payload = JSON.parse(message.content); }
    catch { return message; }
    const type = classifyPromptPayload(payload);
    if (!type) return message;
    changed = true;
    return { ...message, content: JSON.stringify(reorderPromptPayload(payload)) };
  });
  if (!changed) return init;
  return { ...init, body: JSON.stringify({ ...body, messages }) };
}

export function createPromptCacheOrderFetch(fetchImpl = fetch) {
  return (input, init = {}) => fetchImpl(
    input,
    isCompletion(requestUrl(input)) ? applyPromptCacheOrder(init) : init
  );
}

export const PROMPT_CACHE_KEY_ORDER = Object.freeze({
  story: Object.freeze([...STORY_KEY_ORDER]),
  extract: Object.freeze([...EXTRACT_KEY_ORDER])
});
