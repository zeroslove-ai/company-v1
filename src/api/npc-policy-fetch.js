const POLICY = `\n\n[등록 NPC 전용 등장 정책 — 정적 최우선 규칙]\n- 실제 발화·행동·장면 참여가 가능한 인물은 registered_characters, active_character_canon, registered_general_npcs, active_general_npc_canon, eligible_nearby_npcs에 등록된 메인 히로인과 일반 NPC뿐이다.\n- 이름 없는 직원·비서·동료·경비·방문객 등 임의 단역을 새로 만들거나 대사·행동 주체로 사용하지 않는다. 배경 군중은 개별 인물로 특정하지 않는다.\n- 직전 서사에 등록 목록 밖 인물이나 이름이 우발적으로 출력됐더라도 일회성 배경 오류로 취급한다. 이번 턴부터 다시 등장시키거나 대화·상태·관계·위치·Mind·npcs_present에 이어 붙이지 않는다.\n- 등록되지 않은 단역은 다음 턴의 서사 연속성에 유지하지 않는다.`;

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function requestUrl(input) {
  return typeof input === 'string' ? input : input?.url ?? '';
}

function completion(url) {
  return url.endsWith('/chat/completions') || url.includes('/chat/completions?');
}

function relevant(messages) {
  for (const message of messages ?? []) {
    if (message?.role !== 'user' || typeof message.content !== 'string') continue;
    let payload;
    try { payload = JSON.parse(message.content); } catch { continue; }
    if (object(payload) && (
      object(payload.active_character_canon)
      || object(payload.active_general_npc_canon)
      || Array.isArray(payload.registered_characters)
      || Array.isArray(payload.registered_general_npcs)
    )) return true;
  }
  return false;
}

/**
 * Story receives one stable, cache-friendly policy suffix. Extract already has
 * registered-id-only normalization and must keep its verified prompt budget.
 */
export function applyRegisteredNpcPolicy(init = {}) {
  if (typeof init.body !== 'string') return init;
  let body;
  try { body = JSON.parse(init.body); } catch { return init; }
  if (body.stream !== true || !Array.isArray(body.messages) || !relevant(body.messages)) return init;
  const index = body.messages.findIndex(message => message?.role === 'system' && typeof message.content === 'string');
  const messages = index === -1
    ? [{ role: 'system', content: POLICY }, ...body.messages]
    : body.messages.map((message, messageIndex) => messageIndex === index
      ? { ...message, content: `${message.content}${POLICY}` }
      : message);
  return { ...init, body: JSON.stringify({ ...body, messages }) };
}

export function createRegisteredNpcPolicyFetch(fetchImpl = fetch) {
  return (input, init = {}) => fetchImpl(input, completion(requestUrl(input)) ? applyRegisteredNpcPolicy(init) : init);
}

export const REGISTERED_NPC_POLICY = POLICY;
