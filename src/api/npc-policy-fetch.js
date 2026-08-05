const POLICY = `

[등록 NPC 전용 등장 정책 — 정적 최우선 규칙]
- 실제 발화·행동·장면 참여가 가능한 인물은 registered_characters, active_character_canon, registered_general_npcs, active_general_npc_canon, eligible_nearby_npcs에 등록된 메인 히로인과 일반 NPC뿐이다.
- 이름 없는 직원·비서·동료·경비·방문객 등 임의 단역을 새로 만들거나 대사·행동 주체로 사용하지 않는다. 배경 군중은 개별 인물로 특정하지 않는다.
- 등록 인물의 이름은 캐논의 전체 이름을 정확히 사용한다. 성을 바꾸거나 비슷한 이름의 새 인물을 만들지 않는다.
- 직전 서사에 등록 목록 밖 인물이나 이름이 우발적으로 출력됐더라도 일회성 배경 오류로 취급한다. 이번 턴부터 다시 등장시키거나 대화·상태·관계·위치·Mind·npcs_present에 이어 붙이지 않는다.
- 등록되지 않은 단역은 다음 턴의 서사 연속성에 유지하지 않는다.`;

const MOVEMENT_ACTION = /(찾으러|찾아가|찾아보|보러\s*가|만나러|이동하|가본다|가겠다|방문하)/u;

const STORY_PAYLOAD_ORDER = [
  'edition',
  'active_character_canon',
  'active_general_npc_canon',
  'context',
  'player_action',
  'expected_turn'
];

const EXTRACT_PAYLOAD_ORDER = [
  'registered_characters',
  'registered_general_npcs',
  'active_character_canon',
  'active_general_npc_canon',
  'story_text',
  'parsed_story',
  'context',
  'player_action',
  'expected_turn'
];

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function requestUrl(input) {
  return typeof input === 'string' ? input : input?.url ?? '';
}

function completion(url) {
  return url.endsWith('/chat/completions') || url.includes('/chat/completions?');
}

function orderedObject(payload, preferredOrder) {
  const ordered = {};
  const used = new Set();
  for (const key of preferredOrder) {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
    ordered[key] = payload[key];
    used.add(key);
  }
  for (const key of Object.keys(payload)) {
    if (used.has(key)) continue;
    ordered[key] = payload[key];
  }
  return ordered;
}

function payloadOrder(payload, stream) {
  if (stream === true && Object.prototype.hasOwnProperty.call(payload, 'edition')) {
    return STORY_PAYLOAD_ORDER;
  }
  if (
    Array.isArray(payload.registered_characters)
    || Array.isArray(payload.registered_general_npcs)
    || Object.prototype.hasOwnProperty.call(payload, 'story_text')
  ) {
    return EXTRACT_PAYLOAD_ORDER;
  }
  return null;
}

/**
 * DeepSeek prompt caching is prefix-based. Reorder only top-level user JSON
 * keys at the final transport boundary so stable edition/registered canon data
 * precedes turn-specific context, Story text, player input, and turn number.
 * Values, nested structures, message order, and model behavior are unchanged.
 */
export function applyPromptCacheOrder(init = {}) {
  if (typeof init.body !== 'string') return init;
  let body;
  try { body = JSON.parse(init.body); } catch { return init; }
  if (!Array.isArray(body.messages)) return init;

  let changed = false;
  const messages = body.messages.map(message => {
    if (message?.role !== 'user' || typeof message.content !== 'string') return message;
    let payload;
    try { payload = JSON.parse(message.content); } catch { return message; }
    if (!object(payload)) return message;
    const order = payloadOrder(payload, body.stream);
    if (!order) return message;
    changed = true;
    return { ...message, content: JSON.stringify(orderedObject(payload, order)) };
  });
  if (!changed) return init;
  return { ...init, body: JSON.stringify({ ...body, messages }) };
}

function userPayload(messages) {
  for (const message of messages ?? []) {
    if (message?.role !== 'user' || typeof message.content !== 'string') continue;
    try {
      const payload = JSON.parse(message.content);
      if (object(payload)) return payload;
    } catch {
      // Non-JSON user messages are unrelated to the Company Story contract.
    }
  }
  return null;
}

function relevant(messages) {
  const payload = userPayload(messages);
  return Boolean(payload && (
    object(payload.active_character_canon)
    || object(payload.active_general_npc_canon)
    || Array.isArray(payload.registered_characters)
    || Array.isArray(payload.registered_general_npcs)
  ));
}

function addIdentity(target, seen, fallbackId, value) {
  const source = object(value) ?? {};
  const id = String(source.character_id ?? source.npc_id ?? source.id ?? fallbackId ?? '').trim();
  const name = String(source.name ?? source.character_name ?? source.display_name ?? '').trim();
  if (!id || !name || seen.has(id)) return;
  seen.add(id);
  target.push({ id, name });
}

function addCollection(target, seen, collection) {
  if (Array.isArray(collection)) {
    for (const value of collection) addIdentity(target, seen, '', value);
    return;
  }
  const source = object(collection) ?? {};
  for (const [id, value] of Object.entries(source)) addIdentity(target, seen, id, value);
}

export function registeredIdentityEntries(payload) {
  const entries = [];
  const seen = new Set();
  addCollection(entries, seen, payload?.active_character_canon);
  addCollection(entries, seen, payload?.active_general_npc_canon);
  addCollection(entries, seen, payload?.registered_characters);
  addCollection(entries, seen, payload?.registered_general_npcs);
  addCollection(entries, seen, payload?.context?.workplace?.eligible_nearby_npcs);
  addCollection(entries, seen, payload?.context?.workplace?.registered_characters);
  return entries;
}

function shortAlias(name) {
  const characters = Array.from(String(name ?? '').trim());
  if (characters.length !== 3 || !characters.every(character => /[가-힣]/u.test(character))) return '';
  return characters.slice(1).join('');
}

export function resolveActionCharacterTarget(payload) {
  const action = String(payload?.player_action ?? '').trim();
  if (!action) return null;
  const entries = registeredIdentityEntries(payload);
  const exact = entries
    .filter(entry => action.includes(entry.name))
    .sort((left, right) => right.name.length - left.name.length);
  if (exact.length) return exact[0];

  const aliasMatches = entries.filter(entry => {
    const alias = shortAlias(entry.name);
    return alias && action.includes(alias);
  });
  const uniqueIds = new Set(aliasMatches.map(entry => entry.id));
  return uniqueIds.size === 1 ? aliasMatches[0] : null;
}

export function buildActionTargetPolicy(payload) {
  const target = resolveActionCharacterTarget(payload);
  if (!target) return '';
  const action = String(payload?.player_action ?? '').trim();
  const alias = shortAlias(target.name);
  const quotedReference = alias && action.includes(alias) && !action.includes(target.name) ? alias : target.name;
  const movement = MOVEMENT_ACTION.test(action);
  return [
    '[현재 행동의 등록 인물 해석 — 최종 우선]',
    `- player_action의 “${quotedReference}”는 등록 인물 ${target.id}의 정확한 전체 이름 “${target.name}”을 뜻한다.`,
    `- 이 인물을 다른 성·다른 이름의 새 NPC로 바꾸거나 대체하지 않는다. 서술과 실제 발화의 화자명은 반드시 “${target.name}”으로 쓴다.`,
    movement
      ? '- 이번 입력은 인물을 찾거나 만나기 위한 이동 행동이다. 기존 장소에 대상이 근거 없이 갑자기 나타났다고 처리하지 않는다. 알려진 위치로 실제 이동을 진행하거나, 위치 불명·접근 장애가 있으면 그 사실을 명시한다.'
      : '- 입력에서 지칭한 등록 인물의 정체를 다른 인물로 바꾸지 않는다.'
  ].join('\n');
}

/**
 * Story receives one stable policy suffix. A turn-specific target resolution is
 * appended as the last message so the earlier static prefix remains cacheable.
 */
export function applyRegisteredNpcPolicy(init = {}) {
  if (typeof init.body !== 'string') return init;
  let body;
  try { body = JSON.parse(init.body); } catch { return init; }
  if (body.stream !== true || !Array.isArray(body.messages) || !relevant(body.messages)) return init;
  const payload = userPayload(body.messages);
  const index = body.messages.findIndex(message => message?.role === 'system' && typeof message.content === 'string');
  let messages = index === -1
    ? [{ role: 'system', content: POLICY }, ...body.messages]
    : body.messages.map((message, messageIndex) => messageIndex === index
      ? { ...message, content: `${message.content}${POLICY}` }
      : message);
  const targetPolicy = buildActionTargetPolicy(payload);
  if (targetPolicy) messages = [...messages, { role: 'system', content: targetPolicy }];
  return { ...init, body: JSON.stringify({ ...body, messages }) };
}

export function createRegisteredNpcPolicyFetch(fetchImpl = fetch) {
  return (input, init = {}) => {
    if (!completion(requestUrl(input))) return fetchImpl(input, init);
    return fetchImpl(input, applyRegisteredNpcPolicy(applyPromptCacheOrder(init)));
  };
}

export const REGISTERED_NPC_POLICY = POLICY;
export const PROMPT_CACHE_ORDERS = Object.freeze({
  story: Object.freeze([...STORY_PAYLOAD_ORDER]),
  extract: Object.freeze([...EXTRACT_PAYLOAD_ORDER])
});
