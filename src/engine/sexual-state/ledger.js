/**
 * Sexual event ledger — ported from donor's sexual_record_events (the factual, audit ledger
 * distinct from aggregate stat counters; donor's older sexual_events array is explicitly
 * documented dead/audit-only in the donor source and is not ported). Reuses Company's own
 * STRUCTURED_SEXUAL_ACTIONS enum (already the CSA semantic-contract's action taxonomy) instead
 * of inventing a parallel one, plus 'orgasm' for a completion event with no further physical
 * action attached.
 *
 * Unlike donor (which silently drops an interrupted event rather than ever writing a row for
 * it), this ledger records both completed and interrupted entries — Company's own schema
 * (sexual_event_ledger[].interrupted) explicitly wants the attempt on record, not silently
 * discarded.
 */
import { STRUCTURED_SEXUAL_ACTIONS } from '../csa/semantic-contract.js';

const LEDGER_ACTION_TYPES = new Set([...STRUCTURED_SEXUAL_ACTIONS, 'orgasm']);
const DIRECTIONS = new Set(['none', 'npc_to_player', 'player_to_npc']);
const MAX_LEDGER_LENGTH = 80;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function normalizeEvidenceText(value) {
  return typeof value === 'string' ? value.normalize('NFKC').replace(/[\s"'“”‘’]+/g, ' ').trim() : '';
}

/** 32-bit FNV-1a — deterministic, dependency-free, stable across replays of the same evidence text. */
function stableContentHash(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

/** turn+actor+type+content-hash(evidence) — the same fact reported twice (Extract retry, replay, or a duplicate row) collapses to one id. */
export function sexualEventId(turnNumber, actorId, actionType, evidence) {
  return `turn:${turnNumber}:${actorId ?? 'unknown'}:${actionType}:${stableContentHash(normalizeEvidenceText(evidence))}`;
}

function normalizeCandidate(raw, { turnNumber, actionId, storyText = '', npcIds = null } = {}) {
  if (!isPlainObject(raw)) return null;
  const actionType = LEDGER_ACTION_TYPES.has(raw.action_type) ? raw.action_type : null;
  if (!actionType) return null;
  const actorId = typeof raw.actor_id === 'string' && raw.actor_id.trim() ? raw.actor_id.trim() : null;
  const targetId = typeof raw.target_id === 'string' && raw.target_id.trim() ? raw.target_id.trim() : null;
  // actor/target은 둘 다 필수 — 없으면 이벤트로 기록하지 않는다 (지시 23-2).
  if (!actorId || !targetId) return null;
  // actor !== target — 자기 자신을 대상으로 한 이벤트는 폐기 (지시 5).
  if (actorId === targetId) return null;
  // 등록 검증 (지시 5): actor_id/target_id는 등록된 캐릭터 ID 또는 player.
  // npcIds를 받은 경우(Commit 경로)에만 수행한다 — Story 전 판단 금지.
  if (Array.isArray(npcIds)) {
    const known = new Set(npcIds.map(id => (typeof id === 'string' ? id : '').trim()).filter(Boolean));
    const isPlayer = id => id === 'player' || id === 'player-1';
    if (!isPlayer(actorId) && !known.has(actorId)) return null;
    if (!isPlayer(targetId) && !known.has(targetId)) return null;
  }
  const direction = DIRECTIONS.has(raw.direction) ? raw.direction : 'none';
  const evidence = typeof raw.evidence === 'string' ? raw.evidence.trim().slice(0, 200) : '';
  // evidence는 최종 Story의 정확한 부분 문자열이어야 한다 (지시 23-8).
  if (!evidence) return null;
  if (typeof storyText === 'string' && storyText && !storyText.includes(evidence)) return null;
  const completed = raw.completed === true;
  const interrupted = raw.interrupted === true && !completed;
  return {
    event_id: sexualEventId(turnNumber, actorId, actionType, evidence),
    action_id: typeof actionId === 'string' ? actionId : null,
    turn: turnNumber,
    actor_id: actorId,
    target_id: targetId,
    action_type: actionType,
    direction,
    completed,
    interrupted,
    evidence
  };
}

/**
 * Appends every candidate that survives shape validation + evidence gate, deduped against
 * both the existing ledger and other candidates in the same batch by event_id, then caps the
 * ledger to the most recent MAX_LEDGER_LENGTH entries (oldest dropped first — the counters
 * derived from it are monotonic running totals, never recomputed from the capped tail alone).
 */
export function appendSexualEvents(previousLedger, rawCandidates, { turnNumber, actionId, storyText = '', npcIds = null } = {}) {
  const previous = Array.isArray(previousLedger) ? previousLedger : [];
  const seenIds = new Set(previous.map(event => event?.event_id).filter(Boolean));
  const accepted = [];
  const warnings = [];
  for (const raw of (Array.isArray(rawCandidates) ? rawCandidates : [])) {
    const candidate = normalizeCandidate(raw, { turnNumber, actionId, storyText, npcIds });
    if (!candidate) { warnings.push('invalid_sexual_event_candidate'); continue; }
    if (seenIds.has(candidate.event_id)) continue; // silent dedupe, not a warning — a legitimate replay/retry case
    seenIds.add(candidate.event_id);
    accepted.push(candidate);
  }
  const ledger = [...previous, ...accepted].slice(-MAX_LEDGER_LENGTH);
  return { ledger, accepted, warnings };
}

/**
 * Monotonic ejaculation-count continuity: only a completed 'orgasm'/'penetration' event
 * attributed to actorId increments the counter for that actor; nothing ever decrements it.
 * previousCounts: { [characterId]: count }.
 */
export function reduceEjaculationCounts(previousCounts, acceptedEvents) {
  const counts = isPlainObject(previousCounts) ? { ...previousCounts } : {};
  for (const event of acceptedEvents) {
    if (!event.completed || !event.actor_id) continue;
    if (event.action_type !== 'orgasm' && event.action_type !== 'penetration') continue;
    counts[event.actor_id] = Math.max(0, Number.isFinite(counts[event.actor_id]) ? counts[event.actor_id] : 0) + 1;
  }
  return counts;
}

/** The most recent accepted event, if any — feeds player_sexual_state.last_sexual_event / npc last-event display. */
export function latestSexualEvent(acceptedEvents) {
  return acceptedEvents.length ? acceptedEvents[acceptedEvents.length - 1] : null;
}
