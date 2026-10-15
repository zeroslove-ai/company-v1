import { buildOfficialRuleAnnouncement } from './rule-catalog.js';

function tokenize(value) {
  return Array.from(new Set(String(value ?? '')
    .toLocaleLowerCase('ko-KR')
    .match(/[\p{L}\p{N}]{2,}/gu) ?? []))
    .slice(0, 32);
}

const estimateTokens = value => Math.ceil(JSON.stringify(value).length / 4);
const CONTEXT_TOKEN_BUDGET = 10_000;

function relevantRuleHistory(state, recent, memories, currentTurnNumber) {
  const candidates = [...(state.rule_history ?? [])];
  for (const turn of [...recent, ...memories]) {
    const event = turn.turn_record?.rule_change_event;
    if (event) candidates.push(event);
  }
  const unique = new Map();
  for (const event of candidates) {
    if (!event || !['APPLY', 'CHANGE', 'REMOVE'].includes(event.operation)) continue;
    if (event.effective_turn === currentTurnNumber) continue;
    const key = event.command_id ?? `${event.effective_turn}:${event.rule_id}:${event.operation}`;
    unique.set(key, event);
  }
  return [...unique.values()].sort((a, b) => a.effective_turn - b.effective_turn).slice(-16);
}

function chooseOpeningHeroine(content, command, locationId) {
  const candidates = content.actors
    .filter(actor => actor.kind === 'heroine' && actor.default_location_id === locationId)
    .sort((a, b) => a.actor_id.localeCompare(b.actor_id));
  if (!candidates.length) return null;
  // Stable per-game variation keeps the opening cast small without forcing a fixed heroine.
  let hash = 0;
  for (const codePoint of String(command.game_id ?? '')) hash = (hash * 31 + codePoint.charCodeAt(0)) >>> 0;
  return candidates[hash % candidates.length];
}

function makeContext({ command, state, recent, memories, content, turnNumber, ruleChangeEvent = null }) {
  const literal = command.literal_action ?? '';
  const mentionedActors = content.actors.filter(actor => literal.includes(actor.name)).map(actor => actor.actor_id);
  const openingHeroine = command.kind === 'OPENING' ? chooseOpeningHeroine(content, command, state.scene.location_id) : null;
  const openingActors = openingHeroine ? [openingHeroine.actor_id] : [];
  const scene = openingHeroine
    ? { ...state.scene, present_actor_ids: [openingHeroine.actor_id], scene_note: '' }
    : state.scene;
  const memoryActors = memories.flatMap(memory => memory.actor_ids ?? []);
  // Broad scope membership stays in rule authority. Only an explicitly named selector
  // earns an off-scene dramatization card; a group rule does not summon the whole cast.
  const selectedRuleActors = [...(state.active_rules ?? []), ruleChangeEvent?.previous_rule, ruleChangeEvent?.next_rule]
    .filter(Boolean)
    .flatMap(rule => [rule.selectors?.subject_actor_id, rule.selectors?.counterparty_actor_id])
    .filter(Boolean);
  const officialAnnouncement = ruleChangeEvent ? buildOfficialRuleAnnouncement(ruleChangeEvent, content, state) : null;
  const relevantIds = new Set([...(scene.present_actor_ids ?? []), ...mentionedActors, ...memoryActors, ...openingActors, ...selectedRuleActors]);
  const actors = content.actors
    .filter(actor => relevantIds.has(actor.actor_id))
    .map(({ actor_id, kind, name, age, gender, department, position, role_title, company_tenure, default_location_id, prompt_card, profile_card }) => ({
      actor_id, kind, name, age, gender, department, position, role_title, company_tenure, default_location_id,
      ...(prompt_card ? { dramatization: prompt_card } : {}),
      ...(profile_card ? { dramatization: profile_card } : {})
    }));
  const characterDirectory = content.actors.map(({ actor_id, kind, name, department, position, role_title }) => ({ actor_id, kind, name, department, role_title: role_title ?? position ?? '' }));
  const recentTurns = recent.map(turn => ({
    turn_number: turn.turn_number,
    turn_revision: turn.turn_revision,
    literal_action: turn.command_json?.literal_action ?? '',
    narrative_body: turn.narrative_body
  }));
  const remembered = memories.map(memory => ({
    source_turn: memory.turn_number,
    source_revision: memory.source_revision ?? memory.turn_revision,
    ...(memory.turn_digest?.summary
      ? { summary: memory.turn_digest.summary }
      : { raw_record: { literal_action: memory.command_json?.literal_action ?? '', narrative_body: memory.narrative_body ?? '' } }),
    actor_ids: memory.actor_ids ?? [],
    keywords: memory.memory_keywords ?? [],
    importance: Boolean(memory.memory_important)
  }));
  const historicalRuleEvents = relevantRuleHistory(state, recent, memories, turnNumber);
  return {
    schema_version: 1,
    mode: command.kind === 'OPENING' ? 'opening' : command.kind === 'RULE_CHANGE' ? 'rule_change' : 'ordinary',
    current_turn_number: turnNumber,
    current_authority: {
      kind: command.kind,
      literal_action: command.literal_action,
      exact_literal_must_remain_current: command.kind === 'FREE_ACTION',
      rule_change: command.kind === 'RULE_CHANGE' ? command.rule_change : null,
      official_announcement: officialAnnouncement
    },
    edition: content.edition,
    company: content.company,
    world_premise: content.world_premise,
    departments: content.departments,
    profile: state.profile,
    time: state.time,
    scene,
    opening_focus: openingHeroine ? { actor_id: openingHeroine.actor_id, name: openingHeroine.name } : null,
    active_rules: state.active_rules ?? [],
    historical_rule_events: historicalRuleEvents,
    rule_change_event: ruleChangeEvent,
    official_announcement: officialAnnouncement,
    registered_characters: actors,
    character_directory: characterDirectory,
    current_location: content.locations.find(location => location.location_id === state.scene.location_id) ?? null,
    registered_locations: content.locations.map(({ location_id, name, floor, zone, adjacent_location_ids }) => ({ location_id, name, floor, zone, adjacent_location_ids })),
    recent_committed_turns: recentTurns,
    relevant_past_memories: remembered,
    story_constraints: [
      '캐릭터 directory는 등장 가능한 이름과 역할만 알려 준다. 장면의 작은 focal cast에 포함되거나 직접 거론된 인물의 dramatization 카드만 성격·말투·호칭·사적 관심·긴장 반응·관계 경계·기억 연속성에 사용한다.',
      '캐릭터 카드의 continuity·이전 대화 관련 문구는 그 사건이 실제 recent_committed_turns 또는 relevant_past_memories에 기록된 뒤에만 적용한다. 기록이 없는 과거 대화·어제 있었던 일·누군가의 상태를 장면 전제로 만들지 않는다. 카드 문구를 플레이어와 이미 공유한 과거의 증거로 해석하지 않는다.',
      'Opening은 현재 장소의 소수 인물만 장면으로 소개하고 전체 cast를 강제로 출연시키거나 프로필을 읽지 않는다.',
      ...(openingHeroine ? [`이번 Opening의 focal character는 현재 장소에 있는 원본 인물 ${openingHeroine.name} (${openingHeroine.actor_id})이다. 이 인물을 장면에 실제로 등장시키고, 카드의 말투·관심·행동으로 상호작용을 시작한다. 일반 NPC가 대신 장면을 차지하거나 업무를 지시하지 않게 한다.`] : []),
      'Opening은 필수 첫 업무를 만들지 않는다. 보고·결재·인쇄물 전달·일정 확인을 플레이어의 첫 목표로 지정하지 말고, 한 인물과의 작은 살아 있는 순간 및 플레이어가 자유롭게 이어갈 수 있는 후속 행동을 만든다.',
      ...(turnNumber === 1 ? ['이 게임의 첫 턴에는 플레이어와 NPC 사이에 공유된 과거 대화나 약속이 없다.'] : []),
      '모든 턴에서 과거 사실은 recent_committed_turns 또는 relevant_past_memories에 실제로 기록된 내용만 사용한다. 기록이 없다면 어제·지난번·전에 겪었다는 사건이나 약속을 만들지 않고, 현재 장면과 원본 인물 성격만으로 반응한다.',
      'Story 본문에서 이동이 일어나지 않으면 current_location의 정본 장소에 머문다. 이동하면 실제 목적지를 이야기로 확정한다. 장면과 상태 동기화를 위해 이동하지 않은 현재 장소 이름 또는 이동한 정본 목적지 이름을 본문에 자연스럽게 한 번 명시한다.',
      '플레이어는 처음에는 설치한 기억이 없는 낯선 상식개변 앱을 사적으로 가지고 있다. 소유하거나 열기만 해서는 세계가 변하지 않는다. NPC는 드러내기 전까지 앱이나 초자연적 변화를 모른다.',
      '업무는 배경이다. 장면과 입력에 맞는 사적 대화, 유머, 거리감, 감정, 갈등과 사과, 인물의 자발적 관심을 다루며 매 턴을 업무 목표로 돌리지 않는다.',
      '캐릭터 카드의 identity 등 내부 분류 라벨을 Story 문장으로 그대로 옮기지 말고, 행동과 대사로 개성을 드러낸다.',
      '현재 literal은 과거 대사나 선택지보다 우선한다. 이전 선택지는 실행된 역사로 취급하지 않는다.',
      '플레이어의 의도는 완료된 결과가 아니다. Story에 실제로 드러난 결과만 서술한다.',
      '플레이어가 말하지 않은 생각, 동의, 감정, 결정을 만들지 않는다.',
      '요청된 행동의 결과를 미리 확정하지 말고, 관찰 가능한 응답과 사건을 장면에 맞게 서술한다.',
      'Opening에서 낯선 개인 앱이 회사나 NPC에게 설치·안내됐다고 하지 않는다.',
      'active_rules의 규칙 원문, 현재 효력, 대상 범위는 그대로 유지한다. group scope를 현재 장면의 한 인물에게 임의로 축소하지 않고, 장면에 없는 범위 구성원을 출연시키지도 않는다.',
      '상식개변 규칙 턴에는 server-owned official_announcement가 이야기 본문 앞에 그대로 표시된다. 공지 문구를 다시 쓰거나 중복하지 말고, 그 내용을 접한 현재 장면 인물의 구체적인 반응과 대화에 이어서 집중한다.',
    '마지막에 서로 다른 다음 행동 네 개를 [선택지] 아래 1.부터 4.까지 쓴다. 사회적·사적인 대화, 관찰, 이동, 자유로운 개인 행동을 장면에 맞춰 제안하고 업무 수행만으로 제한하지 않는다.'
    ]
  };
}

export function buildTurnContext({ command, state, recentTurns, memories, content, turnNumber, ruleChangeEvent = null }) {
  let recent = [...recentTurns].sort((a, b) => a.turn_number - b.turn_number);
  let selectedMemories = [...memories].sort((a, b) => a.turn_number - b.turn_number);
  const excluded = [...(memories.excluded_sources ?? [])];
  const removeMemory = candidate => {
    selectedMemories = selectedMemories.filter(memory => memory.turn_number !== candidate.turn_number);
    excluded.push({ turn_number: candidate.turn_number, revision: candidate.source_revision, reason: 'context_budget_whole_record_excluded' });
  };
  let context = makeContext({ command, state, recent, memories: selectedMemories, content, turnNumber, ruleChangeEvent });
  while (estimateTokens(context) > CONTEXT_TOKEN_BUDGET) {
    const raw = selectedMemories
      .filter(memory => !memory.turn_digest?.summary)
      .sort((a, b) => (a.score ?? 0) - (b.score ?? 0) || a.turn_number - b.turn_number)[0];
    if (raw) {
      removeMemory(raw);
    } else if (selectedMemories.length) {
      const candidate = [...selectedMemories].sort((a, b) =>
        Number(a.memory_important) - Number(b.memory_important) || (a.score ?? 0) - (b.score ?? 0) || a.turn_number - b.turn_number
      )[0];
      removeMemory(candidate);
    } else if (recent.length > 2) {
      const [oldest] = recent;
      recent = recent.slice(1);
      excluded.push({ turn_number: oldest.turn_number, revision: oldest.turn_revision, reason: 'context_budget_oldest_recent_turn_excluded' });
    } else {
      break;
    }
    context = makeContext({ command, state, recent, memories: selectedMemories, content, turnNumber, ruleChangeEvent });
  }

  const contextManifest = {
    turn_number: turnNumber,
    raw_turn_sources: recent.map(turn => ({ turn_number: turn.turn_number, turn_revision: turn.turn_revision })),
    retrieved_raw_sources: selectedMemories.filter(memory => !memory.turn_digest?.summary).map(memory => ({ turn_number: memory.turn_number, turn_revision: memory.source_revision })),
    retrieved_digest_sources: selectedMemories.filter(memory => memory.turn_digest?.summary).map(memory => ({ turn_number: memory.turn_number, turn_revision: memory.source_revision })),
    excluded_candidate_sources: excluded,
    search_terms: tokenize(command.literal_action),
    content_version: content.version,
    prompt_version: 'r4-company-rule-context-15',
    token_count: estimateTokens(context),
    token_count_kind: 'character_estimate_not_provider_measurement',
    token_budget: CONTEXT_TOKEN_BUDGET,
    token_budget_overflow: estimateTokens(context) > CONTEXT_TOKEN_BUDGET
  };
  const relevantActorIds = new Set(context.registered_characters.map(actor => actor.actor_id));
  const observerContext = {
    ...context,
    available_media: content.media_catalog
      .filter(item => item.active === true && item.pool === 'general' && relevantActorIds.has(item.character_id))
      .map(({ image_id, character_id, pool, situation, tags, curation_rank }) => ({ image_id, character_id, pool, situation, tags, curation_rank }))
  };
  return { context, observerContext, contextManifest };
}
