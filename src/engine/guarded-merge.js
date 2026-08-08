import { GameCoreError } from './errors.js';
import { buildTurnState } from './turn-state.js';
import {
  advanceGameTime,
  hydrateGameplayState,
  normalizeGameplayExtractEnvelope,
  reducePlayerSexualState
} from './gameplay-state.js';
import { buildSceneStatePatch } from './state/physical-state.js';
import { applyNpcStatChanges } from './relationship/reducer.js';
import { appendSexualEvents, reduceEjaculationCounts } from './sexual-state/ledger.js';

const ALLOWED = new Set([
  'player', 'player_scene_state', 'player_sexual_state', 'world_state', 'scene_state',
  'npc_stats', 'npc_emotion', 'npc_relationship_state', 'npc_scene_state', 'npc_work_state',
  'csa_attitudes', 'csa_runtime_state', 'csa_aftereffect_state', 'event_ledger', 'sexual_event_ledger',
  'story_summary_overall', 'story_summary_recent', 'focal_character_id', 'last_speaker_id',
  'last_npcs_present', 'last_image_id', 'last_choices', 'last_choice_meta'
]);
const NULLABLE = new Set(['last_image_id']);
const NPC_MAPS = new Set(['npc_stats', 'npc_emotion', 'npc_relationship_state', 'npc_scene_state', 'npc_work_state', 'csa_attitudes']);

// 일반 턴 선택지 fail-open — Extract/parser가 4개 미만이면 부족분만 보충한다.
// 기존 선택지(Story 원문)는 보존하고, 현재 focal NPC·활성 규정을 반영한
// deterministic 후보로 채운다 (추가 LLM 호출 없음, 자유 입력은 항상 가능).
export function buildFallbackTurnChoices(save, options = {}) {
  const hasActiveRule = Array.isArray(save?.csa_active) && save.csa_active.length > 0;
  const focalName = options?.focalName ?? '';
  const candidates = [];
  const push = text => { if (!candidates.includes(text)) candidates.push(text); };

  push('이야기를 계속 이어간다');
  push(hasActiveRule ? '규정의 구체적인 내용을 질문한다' : '상대의 의견을 확인한다');
  if (focalName) {
    push(`${focalName}에게 직접 확인한다`);
    push(`${focalName}의 반응을 살핀다`);
  }
  push('다른 NPC의 반응을 확인한다');
  push('자유롭게 다른 행동을 선택한다');
  return candidates;
}
// The top-level Extract envelope (focal_character_id/last_speaker_id/choices/npcs_present) is
// the sole writer for these paths; a state_delta proposal for the same path is redundant and
// only ever warns.
const ENVELOPE_AUTHORITATIVE = new Set(['focal_character_id', 'last_speaker_id', 'last_choices', 'last_npcs_present']);

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 착의 evidence의 유일한 권위는 Extract envelope의 evidence.clothing이다.
 * 정식 형태는 evidence.clothing[actor_id][slot]이며, 기존 모델이 내던 flat slot
 * 형태도 entry.character_id/character가 actor와 일치할 때만 읽는다.
 * buildSceneStatePatch가 요구하는 slot -> quote 문자열로 축약한다.
 *
 * 반환:
 *   quotes: { slot: quote }  — buildSceneStatePatch용 축약
 *   actorScoped: true면 evidence가 actor별 nested 경로(evidence.clothing[actor_id])였다.
 *                flat evidence(evidence.clothing[slot])면 false — 단일 NPC 예외를 적용하지 않는다.
 */
function clothingEvidenceForActor(evidence, actorId) {
  const root = plainObject(evidence?.clothing) ? evidence.clothing : {};
  const nested = plainObject(root[actorId]) ? root[actorId] : null;
  const source = nested ?? root;
  const result = { quotes: {}, actorScoped: Boolean(nested) };

  for (const [slot, entry] of Object.entries(source)) {
    if (plainObject(entry)) {
      const claimedActor = typeof entry.character_id === 'string'
        ? entry.character_id
        : (typeof entry.character === 'string' ? entry.character : null);
      // nested/flat 무관 — 내부 character_id가 명시적으로 존재하면 actorId와
      // 정확히 일치해야 한다. nested actor key가 정본이더라도 내부 충돌은 거부.
      if (claimedActor && claimedActor !== actorId) continue;
      // flat evidence는 character_id(또는 character) 필수 — 없거나 다르면 거부
      // (플레이어 flat evidence도 동일 원칙, player-1 추측 변환 없음).
      if (!nested && claimedActor !== actorId) continue;
      if (typeof entry.quote === 'string' && entry.quote.trim()) result.quotes[slot] = entry.quote.trim();
      continue;
    }
    // 문자열 entry는 actor별 nested map에서만 허용한다.
    if (nested && typeof entry === 'string' && entry.trim()) result.quotes[slot] = entry.trim();
  }
  return result;
}

function sceneEvidenceMap(patch, envelopeEvidence, actorId) {
  const local = plainObject(patch?.evidence) ? patch.evidence : {};
  const clothing = clothingEvidenceForActor(envelopeEvidence, actorId);
  return {
    ...local,
    clothing: clothing.quotes,
    clothing_actor_scoped: clothing.actorScoped
  };
}

function clone(value) {
  return structuredClone(value);
}

function deepMerge(base, patch) {
  if (!plainObject(base) || !plainObject(patch)) return clone(patch);
  const merged = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    merged[key] = plainObject(value) ? deepMerge(base[key], value) : clone(value);
  }
  return merged;
}

function isStale(base, patch) {
  return plainObject(patch) && Number.isFinite(patch.updated_turn)
    && Number.isFinite(base?.updated_turn) && patch.updated_turn < base.updated_turn;
}

function allowedNpcIds(save) {
  const ids = new Set([...(save.scene_state?.participants ?? []), ...(save.last_npcs_present ?? [])]);
  for (const [id, state] of Object.entries(save.npc_scene_state ?? {})) {
    if (state?.present === true) ids.add(id);
  }
  ids.delete(save.player?.player_id);
  return ids;
}

const ALLOWED_SEXUAL_DELTA_KEYS = new Set(['arousal_delta', 'ejaculation_progress_delta', 'ejaculation_completed']);
const SEXUAL_COMPLETION_CLAIM_PATTERN = /sexual.*(complete|relationship)|(?:complete|relationship).*sexual/i;

/**
 * player_sexual_state deltas may only propose arousal_delta, ejaculation_progress_delta,
 * and ejaculation_completed. Any other key is dropped with a warning instead of failing
 * the whole turn; reducePlayerSexualState alone decides whether ejaculation_completed
 * actually applies, based on evidence.sexual_resolution.
 */
function sanitizePlayerSexualStateDelta(patch) {
  const clean = {};
  const warnings = [];
  for (const [key, value] of Object.entries(patch)) {
    if (ALLOWED_SEXUAL_DELTA_KEYS.has(key)) {
      clean[key] = value;
      continue;
    }
    if (SEXUAL_COMPLETION_CLAIM_PATTERN.test(key) && Boolean(value)) {
      warnings.push(`unauthorized_sexual_completion_field_ignored:${key}`);
    } else {
      warnings.push(`unknown_player_sexual_state_delta:${key}`);
    }
  }
  return { patch: clean, warnings };
}

/**
 * A new npc_relationship_state.milestones.sexual_relationship_started_turn value requires
 * evidence.sexual_resolution === true. Without it, only that one field is dropped with a
 * warning — the rest of the NPC's relationship patch, and the rest of the turn, still apply.
 */
function sanitizeRelationshipMilestonePatch(currentSave, npcId, patch, evidence) {
  const nextTurn = patch?.milestones?.sexual_relationship_started_turn;
  const currentTurn = currentSave.npc_relationship_state?.[npcId]?.milestones?.sexual_relationship_started_turn;
  const attemptsChange = nextTurn !== null && nextTurn !== undefined && nextTurn !== currentTurn;
  if (!attemptsChange || evidence?.sexual_resolution === true || !plainObject(patch.milestones)) {
    return { patch, warning: null };
  }
  const { sexual_relationship_started_turn, ...restMilestones } = patch.milestones;
  return {
    patch: { ...patch, milestones: restMilestones },
    warning: `unauthorized_sexual_milestone_ignored:${npcId}`
  };
}

/**
 * evidence 항목에서 특정 save path(`npc_stats.heroine3.affinity`)의 quote를 찾는다.
 * changed 배열에 정확한 path가 있는 evidence만 허용한다 (flat/nested field fallback 없음).
 * 없으면 null.
 */
function findEvidenceQuote(evidence, path) {
  if (!plainObject(evidence)) return null;
  for (const item of Object.values(evidence)) {
    if (plainObject(item) && Array.isArray(item.changed) && item.changed.includes(path)) {
      if (typeof item.quote === 'string' && item.quote.trim()) return item.quote.trim();
    }
  }
  return null;
}

/**
 * NPC patch의 변경 필드가 Story evidence로 뒷받침되는지 검증한다.
 * - quote가 최종 storyText에 정확히 존재해야 한다
 * - quote가 해당 NPC의 dialogue line이거나, quote 안에 NPC 이름이 존재해야 한다
 * - 조건 실패 시 해당 필드만 폐기하고 정상 형제 필드는 보존한다
 * warning: evidence_missing / evidence_quote_not_in_story / evidence_actor_mismatch
 */
function validateEvidencedNpcField({ quote, narrativeText, characterName, npcDialogueLines }) {
  if (typeof quote !== 'string' || !quote.trim()) return 'evidence_missing';
  const text = typeof narrativeText === 'string' ? narrativeText : '';
  if (!text.includes(quote.trim())) return 'evidence_quote_not_in_story';
  if (typeof characterName === 'string' && characterName.trim() && quote.trim().includes(characterName.trim())) return null;
  if (Array.isArray(npcDialogueLines) && npcDialogueLines.some(line =>
    typeof line === 'string' && line.trim() && (line.includes(quote.trim()) || quote.trim().includes(line.trim())))) {
    return null;
  }
  return 'evidence_actor_mismatch';
}

/**
 * gateFields에 해당하는 변경 필드마다 evidence를 요구한다.
 * 그 외 필드(relationship_summary 등 자유 문장 필드)는 이 gate의 대상이 아니다.
 * 반환: { patch, warnings } — 실패한 필드는 patch에서 제거된다.
 */
function gateEvidencedNpcFields({ npcId, path, patch, previous = {}, evidence, narrativeText, characterName, npcDialogueLines, gateFields }) {
  const warnings = [];
  const gated = { ...patch };
  for (const field of gateFields) {
    if (!(field in gated)) continue;
    const changed = gated[field] !== previous?.[field];
    if (!changed) continue;
    const quote = findEvidenceQuote(evidence, `${path}.${npcId}.${field}`);
    const verdict = validateEvidencedNpcField({ quote, narrativeText, characterName, npcDialogueLines });
    if (verdict) {
      warnings.push(`${verdict}:${path}.${npcId}.${field}`);
      delete gated[field];
    }
  }
  return { patch: gated, warnings };
}

/** 해당 NPC의 대사 텍스트 목록 — evidence가 대사 라인인지 확인용. */
function npcDialogueLinesOf(parsedStory, npcId) {
  if (!Array.isArray(parsedStory?.dialogue_lines)) return [];
  return parsedStory.dialogue_lines
    .filter(line => line?.speaker_id === npcId && typeof line.text === 'string' && line.text.trim())
    .map(line => line.text.trim());
}

function mergeEventLedger(current, patch) {
  const byId = new Map((Array.isArray(current) ? current : []).map(item => [item?.event_id, item]));
  for (const event of patch) {
    if (plainObject(event) && typeof event.event_id === 'string' && !byId.has(event.event_id)) byId.set(event.event_id, clone(event));
  }
  return [...byId.values()];
}

function characterNameFromMaster(master, characterId) {
  const roster = [
    ...(Array.isArray(master?.characters) ? master.characters : []),
    ...(Array.isArray(master?.general_npcs) ? master.general_npcs : [])
  ];
  const found = roster.find(character => (
    character?.character_id === characterId
    || character?.npc_id === characterId
    || character?.id === characterId
  ));
  return found?.name ?? characterId ?? '';
}

/**
 * 안전화 패치 — 실패·중단 이동은 시작 상태(beforeSave) 기준으로 복원한다.
 * Extract가 잘못된 이동 state를 먼저 적용했을 수 있으므로 이동 관련 root를 clone한다.
 * beforeSave는 절대 mutation하지 않는다.
 */
function restoreMovementState(beforeSave, nextSave) {
  nextSave.scene_state = structuredClone(beforeSave.scene_state ?? {});
  nextSave.last_npcs_present = Array.isArray(beforeSave.last_npcs_present)
    ? structuredClone(beforeSave.last_npcs_present)
    : [];
  if ('focal_character_id' in beforeSave) {
    nextSave.focal_character_id = beforeSave.focal_character_id ?? null;
  } else {
    delete nextSave.focal_character_id;
  }
  if ('last_speaker_id' in beforeSave) {
    nextSave.last_speaker_id = beforeSave.last_speaker_id ?? null;
  } else {
    delete nextSave.last_speaker_id;
  }
  nextSave.npc_scene_state = structuredClone(beforeSave.npc_scene_state ?? {});
}

/**
 * 안전화 패치 — 플레이어 ID는 반드시 beforeSave에서 가져온다.
 * Extract가 participants에서 player를 누락해도 플레이어가 사라지면 안 된다.
 */
function resolveCanonicalPlayerId(save) {
  const candidates = [
    save?.player?.player_id,
    save?.player?.id,
    ...(Array.isArray(save?.scene_state?.participants) ? save.scene_state.participants : [])
  ];
  return candidates.find(id =>
    typeof id === 'string' && (id === 'player' || id.startsWith('player'))
  ) ?? 'player';
}

/** player 참조 ID 판정 — 'player' 또는 'player-*'. */
function isPlayerRefId(id) {
  return typeof id === 'string' && (id === 'player' || id.startsWith('player'));
}

/**
 * 검토 수정 2 + 안전화 패치 — 이동 결과 deterministic 보정 (commit 직전 sanitizer).
 * object argument 인터페이스. 반환 { applied, reason, warnings }.
 *
 * 이동을 적용하는 조건은 정확히 하나:
 *   transition_mode=movement
 *   + destination NPC 정확히 1명
 *   + destination location 확인됨
 *   + outcome === 'success'
 *   + feedback revision 아님
 * 그 외(partial/interrupted/blocked/refused/degraded/목적지 불명확/위치 불명/
 * feedback_revision)에서는 이동을 적용하지 않고, Extract가 잘못 제안한 이동
 * state를 beforeSave 기준으로 복원한다.
 *
 * 성공 시:
 *   scene_state = { ...기존, scene_id: destinationSceneId, location_id: destinationLocationId,
 *                   participants: [playerId, destinationId], updated_turn: expectedTurn }
 *   last_npcs_present = [destinationId]
 *   focal_character_id = destinationId
 *   last_speaker_id는 유지 (목적지 NPC가 이번 턴에 말하지 않았으므로 설정하지 않는다)
 *   기존 장소 NPC(participants ∪ last_npcs_present)만 present:false — 전체 NPC 순회 금지
 *   목적지 NPC state는 병합(present/scene_id/location_id/updated_turn) — posture/clothing 보존
 */
export function sanitizeMovementCommit({
  beforeSave,
  nextSave,
  sceneCastContract,
  extractEnvelope,
  actionKind,
  expectedTurn
} = {}) {
  const warnings = [];

  if (!plainObject(beforeSave) || !plainObject(nextSave)) {
    return {
      applied: false,
      reason: 'invalid_save',
      warnings: ['movement_commit_skipped:invalid_save']
    };
  }

  const cast = plainObject(sceneCastContract) ? sceneCastContract : {};

  if (cast.transition_mode !== 'movement') {
    return {
      applied: false,
      reason: 'not_movement',
      warnings
    };
  }

  // 호출부에서 막더라도 함수 내부에도 방어를 둔다 (안전화 패치 5.3)
  if (actionKind === 'feedback_revision') {
    return {
      applied: false,
      reason: 'feedback_revision',
      warnings
    };
  }

  const destinationIds = Array.isArray(cast.destination_npc_ids)
    ? [...new Set(
        cast.destination_npc_ids
          .filter(id => typeof id === 'string' && id.trim() && !isPlayerRefId(id))
      )]
    : [];

  if (destinationIds.length !== 1) {
    restoreMovementState(beforeSave, nextSave);
    const reason = destinationIds.length === 0 ? 'missing_destination' : 'ambiguous_destination';
    return {
      applied: false,
      reason,
      warnings: [`movement_commit_skipped:${reason}`]
    };
  }

  const destinationId = destinationIds[0];

  const destinationLocationId =
    typeof cast.destination_location_id === 'string' && cast.destination_location_id.trim()
      ? cast.destination_location_id.trim()
      : null;

  const destinationSceneId =
    typeof cast.destination_scene_id === 'string' && cast.destination_scene_id.trim()
      ? cast.destination_scene_id.trim()
      : destinationLocationId;

  if (!destinationLocationId) {
    restoreMovementState(beforeSave, nextSave);
    return {
      applied: false,
      reason: 'unknown_destination_location',
      warnings: ['movement_commit_skipped:unknown_destination_location']
    };
  }

  const outcome = typeof extractEnvelope?.outcome === 'string'
    ? extractEnvelope.outcome
    : 'unknown';

  if (outcome !== 'success') {
    restoreMovementState(beforeSave, nextSave);
    return {
      applied: false,
      reason: 'movement_not_successful',
      warnings: [`movement_commit_skipped:${outcome}`]
    };
  }

  const playerId = resolveCanonicalPlayerId(beforeSave);

  // 기존 장소 NPC 후보 — participants ∪ last_npcs_present (전체 NPC 순회 금지)
  const oldSceneNpcIds = new Set([
    ...(Array.isArray(beforeSave.scene_state?.participants) ? beforeSave.scene_state.participants : []),
    ...(Array.isArray(beforeSave.last_npcs_present) ? beforeSave.last_npcs_present : [])
  ]);

  const npcState = structuredClone(nextSave.npc_scene_state ?? {});
  for (const npcId of oldSceneNpcIds) {
    if (isPlayerRefId(npcId)) continue;
    if (npcId === destinationId) continue;
    npcState[npcId] = {
      ...(npcState[npcId] ?? {}),
      present: false,
      updated_turn: expectedTurn
    };
  }

  // 목적지 NPC는 덮어쓰지 않고 병합 — posture/clothing/position 등 보존
  npcState[destinationId] = {
    ...(npcState[destinationId] ?? {}),
    present: true,
    scene_id: destinationSceneId,
    location_id: destinationLocationId,
    updated_turn: expectedTurn
  };

  nextSave.scene_state = {
    ...(nextSave.scene_state ?? {}),
    scene_id: destinationSceneId,
    location_id: destinationLocationId,
    participants: [playerId, destinationId],
    updated_turn: expectedTurn
  };

  nextSave.last_npcs_present = [destinationId];
  nextSave.focal_character_id = destinationId;
  nextSave.npc_scene_state = npcState;
  // last_speaker_id는 유지 — 목적지 NPC가 이번 턴에 말하지 않았으므로 설정하지 않는다

  return {
    applied: true,
    reason: 'movement_committed',
    warnings
  };
}

export function applyGuardedStateDelta(currentSave, extractEnvelope, options) {
  if (!plainObject(currentSave)) throw new GameCoreError('INVALID_SAVE', 'Current save must be an object');
  if (currentSave.save_schema_version !== 1 || currentSave.edition !== 'company-v1') {
    throw new GameCoreError('INVALID_SAVE', 'Current save edition or schema is invalid');
  }
  const preSave = hydrateGameplayState(currentSave, options?.master ?? {});
  const envelope = normalizeGameplayExtractEnvelope(extractEnvelope, { parsedStory: options?.parsedStory, npcIds: options?.npcIds });

  const nextSave = clone(preSave);
  const warnings = [...envelope.warnings];
  const allowedNpcs = allowedNpcIds(preSave);
  if (options?.npcIds instanceof Set) {
    for (const id of envelope.npcs_present) allowedNpcs.add(id);
    if (envelope.action_target_id) allowedNpcs.add(envelope.action_target_id);
  }

  // 이번 턴 장면 참여자 정본 — 1) scene_cast_contract.present_npc_ids (서버가 확정한
  // 등장 인물) 2) 없으면 Commit이 유지한 scene_state.participants.
  // envelope.npcs_present는 참여자를 줄이는 정본으로 사용하지 않는다 — Extract가
  // 한 명만 반환했다고 scene cast의 두 명을 한 명으로 축소하지 않으며, union으로
  // 추가 인물만 보수적으로 포함한다 (Extract는 추가할 수는 있어도 제거할 수 없다).
  // player/player_id는 비플레이어 NPC 수에서 제외하고 중복은 Set으로 제거한다.
  // focal_character_id·last_npcs_present·기본 위치 인물은 단일 NPC 판정에 쓰지 않는다.
  // 단일 NPC 판정용 물리적 인물 정본 (PR #30 보정):
  // SceneCastContract가 있으면 present_npc_ids + entering_npc_ids union만 사용한다.
  // - remote_npc_ids: 물리적 현장 인물이 아니므로 제외
  // - context_npc_ids: 참고 인물이므로 제외
  // - destination_npc_ids: present_npc_ids에 승격된 경우에만 포함 (별도 추가 금지)
  // - envelope.npcs_present: normalizeGameplayExtractEnvelope는 등록 NPC ID 여부만
  //   검증하며 SceneCastContract와의 일치를 검증하지 않으므로 union하지 않는다.
  //   Extract는 단일 NPC 예외의 actor 수를 줄이거나 0→1명으로 만들 수 없다.
  // scene_cast_contract가 없는 legacy/test 경로에서만 preSave.scene_state.participants
  // 를 사용한다 (envelope.npcs_present 추가 없음 — 저장된 participant가 없으면
  // 단일 NPC 예외는 활성화하지 않는다).
  const cast = options?.parsedStory?.scene_cast_contract;
  const hasCastContract = cast && typeof cast === 'object';

  const authoritativeNpcIds = hasCastContract
    ? [
        ...(Array.isArray(cast.present_npc_ids) ? cast.present_npc_ids : []),
        ...(Array.isArray(cast.entering_npc_ids) ? cast.entering_npc_ids : [])
      ]
    : (
        Array.isArray(preSave.scene_state?.participants)
          ? preSave.scene_state.participants
          : []
      );

  const sceneNpcIds = [...new Set(authoritativeNpcIds)]
    .filter(id => typeof id === 'string' && id && !isPlayerRefId(id));

  // 등록 NPC 이름 목록 — 단일 NPC 예외에서 다른 NPC 이름과의 명시적 충돌을 차단한다.
  const masterRoster = plainObject(options?.master) ? options.master : {};
  const registeredNpcNames = [
    ...(Array.isArray(masterRoster.characters) ? masterRoster.characters : []),
    ...(Array.isArray(masterRoster.general_npcs) ? masterRoster.general_npcs : [])
  ]
    .map(entry => typeof entry?.name === 'string' && entry.name.trim() ? entry.name.trim() : null)
    .filter(Boolean);

  for (const [path, patch] of Object.entries(envelope.state_delta)) {
    if (ENVELOPE_AUTHORITATIVE.has(path)) {
      warnings.push(`duplicate_state_path:${path}`);
      continue;
    }
    if (!ALLOWED.has(path)) {
      warnings.push(`unknown_state_path:${path}`);
      continue;
    }
    if (patch === null) {
      if (NULLABLE.has(path)) nextSave[path] = null;
      else warnings.push(`null_not_allowed:${path}`);
      continue;
    }
    if (path === 'event_ledger') {
      if (Array.isArray(patch)) nextSave.event_ledger = mergeEventLedger(nextSave.event_ledger, patch);
      else warnings.push('invalid_event_ledger');
      continue;
    }
    if (path === 'player_sexual_state') {
      if (!plainObject(patch)) {
        warnings.push('invalid_player_sexual_state');
        continue;
      }
      const sanitized = sanitizePlayerSexualStateDelta(patch);
      warnings.push(...sanitized.warnings);
      const reduced = reducePlayerSexualState(nextSave.player_sexual_state, sanitized.patch, {
        storyEvidence: envelope.evidence, updatedTurn: options.expectedTurn
      });
      nextSave.player_sexual_state = reduced.state;
      warnings.push(...reduced.warnings);
      continue;
    }
    if (path === 'player_scene_state') {
      if (!plainObject(patch)) {
        warnings.push('invalid_player_scene_state');
        continue;
      }
      // 플레이어 착의도 NPC와 같은 top-level evidence.clothing 권위를 사용한다.
      // 이름 문자열은 요구하지 않되 actor_id=player로 소유권을 분리한다.
      const { state, warnings: sceneWarnings } = buildSceneStatePatch({
        previous: nextSave.player_scene_state ?? {}, proposal: patch,
        evidenceMap: sceneEvidenceMap(patch, envelope.evidence, 'player'),
        narrativeText: options?.storyText ?? options?.parsedStory?.scene_text ?? '',
        characterName: '', turnNumber: options.expectedTurn,
        actorId: 'player', npcsPresent: sceneNpcIds, registeredNpcNames
      });
      nextSave.player_scene_state = state;
      warnings.push(...sceneWarnings.map(code => `player_scene_state:${code}`));
      continue;
    }
    if (path === 'sexual_event_ledger') {
      // sexual_event_ledger is the ONLY writer of ejaculation_counts/last_sexual_event — no
      // other state_delta path may touch either (ejaculation_counts isn't even in ALLOWED, so
      // Extract cannot propose it directly at all; a completion is only ever counted through an
      // accepted ledger entry here). Because the counter and the ledger's dedupe both derive
      // from the exact same `accepted` array in this one code path, they can never drift apart
      // the way two independently-updated stores could — there is no separate write path to
      // "self-heal" against. (The ledger array itself is capped to the most recent 80 entries;
      // the counter is a running total incremented only by genuinely new accepted events each
      // turn, never re-derived from the — possibly truncated — array, so capping the ledger
      // never loses count history.)
      if (!Array.isArray(patch)) {
        warnings.push('invalid_sexual_event_ledger');
        continue;
      }
      const { ledger, accepted, warnings: ledgerWarnings } = appendSexualEvents(nextSave.sexual_event_ledger, patch, {
        turnNumber: options.expectedTurn, actionId: options.actionId
      });
      nextSave.sexual_event_ledger = ledger;
      warnings.push(...ledgerWarnings);
      if (accepted.length) {
        const counts = reduceEjaculationCounts(nextSave.ejaculation_counts ?? {}, accepted);
        nextSave.ejaculation_counts = counts;
        const playerEvent = [...accepted].reverse().find(event => event.actor_id === 'player' || event.target_id === 'player');
        if (playerEvent) {
          nextSave.player_sexual_state = {
            ...(nextSave.player_sexual_state ?? {}),
            last_sexual_event: { turn: playerEvent.turn, type: playerEvent.action_type, evidence: playerEvent.evidence }
          };
        }
      }
      continue;
    }
    if (path === 'csa_runtime_state') {
      // CSA runtime 입력 채널 단일화 — state_delta.csa_runtime_state는 save writer가 아니다.
      // 유일 입력은 envelope의 csa_runtime_updates/csa_trigger_evaluations이고,
      // 유일 writer는 buildCsaSceneRuntimeStatePatch (Commit 경로)다.
      warnings.push('duplicate_csa_runtime_channel_ignored');
      continue;
    }
    if (NPC_MAPS.has(path)) {
      if (!plainObject(patch)) {
        warnings.push(`invalid_npc_map:${path}`);
        continue;
      }
      nextSave[path] ??= {};
      for (const [npcId, npcPatch] of Object.entries(patch)) {
        if (!allowedNpcs.has(npcId)) {
          warnings.push(`absent_npc_patch:${path}:${npcId}`);
          continue;
        }
        if (path === 'npc_scene_state' && plainObject(npcPatch)) {
          // 착의를 포함한 물리 상태 변경은 evidence 기반 physical-state merge가 유일한 경로다.
          // 착의 evidence는 envelope.evidence.clothing[npcId]에서만 읽는다.
          const { state, warnings: sceneWarnings } = buildSceneStatePatch({
            previous: nextSave.npc_scene_state[npcId] ?? {}, proposal: npcPatch,
            evidenceMap: sceneEvidenceMap(npcPatch, envelope.evidence, npcId),
            narrativeText: options?.storyText ?? options?.parsedStory?.scene_text ?? '',
            characterName: characterNameFromMaster(options?.master, npcId), turnNumber: options.expectedTurn,
            actorId: npcId, npcsPresent: sceneNpcIds, registeredNpcNames
          });
          nextSave.npc_scene_state[npcId] = { ...state, present: nextSave.npc_scene_state[npcId]?.present ?? npcPatch.present ?? false };
          warnings.push(...sceneWarnings.map(code => `npc_scene_state:${npcId}:${code}`));
          continue;
        }
        if (path === 'npc_stats' && plainObject(npcPatch)) {
          // 호감도·수용도·흥분도는 Extract의 의미 분석에 맡긴다 — Story exact quote 검사 없음.
          // Commit은 등록 NPC·관련 NPC·허용 필드·범위만 검증한다 (applyNpcStatChanges).
          // degradation된 Extract에서는 envelope.outcome === 'degraded'일 때 변경을 금지한다.
          if (envelope.outcome === 'degraded') {
            warnings.push(`npc_stats_degraded_ignored:${npcId}`);
            continue;
          }
          const { reason, ...deltas } = npcPatch;
          const { state, warnings: statWarnings } = applyNpcStatChanges(nextSave.npc_stats[npcId] ?? {}, deltas, { reason: typeof reason === 'string' ? reason : '' });
          nextSave.npc_stats[npcId] = state;
          warnings.push(...statWarnings.map(code => `npc_stats:${npcId}:${code}`));
          continue;
        }
        let sanitizedPatch = npcPatch;
        if (path === 'npc_relationship_state' && plainObject(npcPatch)) {
          const sanitized = sanitizeRelationshipMilestonePatch(preSave, npcId, npcPatch, envelope.evidence);
          sanitizedPatch = sanitized.patch;
          if (sanitized.warning) warnings.push(sanitized.warning);
          // relationship_summary는 Extract 자유 문장을 저장하지 않는다 — 기존 값 유지.
          if ('relationship_summary' in sanitizedPatch) {
            delete sanitizedPatch.relationship_summary;
            warnings.push(`extract_relationship_summary_ignored:${npcId}`);
          }
          // current_boundary 변경은 Story evidence를 요구한다 (근거 없는 경계 상태 전이 차단).
          const gated = gateEvidencedNpcFields({
            npcId, path, patch: sanitizedPatch, previous: preSave.npc_relationship_state?.[npcId] ?? {},
            evidence: envelope.evidence, narrativeText: options?.storyText ?? '',
            characterName: characterNameFromMaster(options?.master, npcId),
            npcDialogueLines: npcDialogueLinesOf(options?.parsedStory, npcId),
            gateFields: ['current_boundary']
          });
          warnings.push(...gated.warnings);
          sanitizedPatch = gated.patch;
        }
        if (path === 'npc_emotion' && plainObject(npcPatch)) {
          // mood 변경도 Story evidence를 요구한다 (가짜 감정 변화 차단).
          const gated = gateEvidencedNpcFields({
            npcId, path, patch: npcPatch, previous: nextSave.npc_emotion[npcId] ?? {},
            evidence: envelope.evidence, narrativeText: options?.storyText ?? '',
            characterName: characterNameFromMaster(options?.master, npcId),
            npcDialogueLines: npcDialogueLinesOf(options?.parsedStory, npcId),
            gateFields: ['mood']
          });
          warnings.push(...gated.warnings);
          sanitizedPatch = gated.patch;
        }
        if (isStale(nextSave[path][npcId], sanitizedPatch)) {
          warnings.push(`stale_updated_turn:${path}:${npcId}`);
          continue;
        }
        nextSave[path][npcId] = plainObject(sanitizedPatch) ? deepMerge(nextSave[path][npcId] ?? {}, sanitizedPatch) : clone(sanitizedPatch);
      }
      continue;
    }
    if (isStale(nextSave[path], patch)) {
      warnings.push(`stale_updated_turn:${path}`);
      continue;
    }
    nextSave[path] = plainObject(patch) ? deepMerge(nextSave[path] ?? {}, patch) : clone(patch);
  }

  nextSave.last_choices = clone(envelope.choices);
  // 선택지 fail-open — 4개 미만이면 기존 선택지를 버리지 않고 부족분만 보충한다.
  // focal NPC 이름을 반영한 deterministic 후보로 채우고 warning에 전후 개수를 남긴다.
  if (envelope.choices.length < 4) {
    const focalName = characterNameFromMaster(options?.master, envelope.focal_character_id);
    const existing = [...nextSave.last_choices];
    const fills = buildFallbackTurnChoices(nextSave, {
      master: options?.master,
      existingChoices: existing,
      focalName
    });
    for (const fill of fills) {
      if (!existing.includes(fill)) existing.push(fill);
      if (existing.length === 4) break;
    }
    warnings.push(`choices_padded:${envelope.choices.length}->${existing.length}`);
    nextSave.last_choices = existing.slice(0, 4);
  }
  if (envelope.npcs_present.length > 0) nextSave.last_npcs_present = clone(envelope.npcs_present);
  if (envelope.focal_character_id !== null) nextSave.focal_character_id = envelope.focal_character_id;
  if (envelope.last_speaker_id !== null) nextSave.last_speaker_id = envelope.last_speaker_id;

  const timeBefore = preSave.world_state.game_time;
  const timeAfter = advanceGameTime(timeBefore, envelope.elapsed_minutes, envelope.evidence);
  nextSave.world_state = plainObject(nextSave.world_state) ? { ...nextSave.world_state, game_time: timeAfter } : { game_time: timeAfter };

  nextSave.turn_state = buildTurnState({
    currentTurn: currentSave.turn_state?.committed_turn ?? 0,
    expectedTurn: options.expectedTurn,
    actionId: options.actionId,
    turnId: options.turnId
  });
  return {
    nextSave,
    warnings,
    time_before: timeBefore,
    elapsed_minutes: envelope.elapsed_minutes,
    time_after: timeAfter,
    action_target_id: envelope.action_target_id,
    image_character_id: envelope.image_character_id,
    mind_monitor: envelope.mind_monitor,
    dialogue_lines: envelope.dialogue_lines
  };
}
