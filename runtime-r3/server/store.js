import { clone, createInitialState, requireLiteralAction } from '../domain/contracts.js';
import { r3StageLeaseMs } from './job-policy.js';

export const R3_ATTEMPT_FENCE_CONFLICT = 'r3_attempt_fence_conflict';
export const R3_FEEDBACK_REVISION_CONFLICT = 'r3_feedback_revision_conflict';

export function createInMemoryR3Persistence() {
  return { games: new Map(), states: new Map(), jobs: new Map(), turns: new Map(), revisionHistory: new Map(), feedbackAttempts: new Map() };
}

function id() { return globalThis.crypto?.randomUUID?.() ?? `r3-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function fence() { const error = new Error(R3_ATTEMPT_FENCE_CONFLICT); error.code = R3_ATTEMPT_FENCE_CONFLICT; return error; }
function feedbackConflict(code = R3_FEEDBACK_REVISION_CONFLICT) { const error = new Error(code); error.code = code; return error; }
function assertAttempt(job, attempt) { if (!job || job.status === 'committed' || job.status === 'failed' || job.action_id !== attempt.actionId || job.attempt_no !== attempt.attemptNo) throw fence(); }
function historyKey(gameId, turnNumber, revision) { return `${gameId}:${turnNumber}:${revision}`; }
function attemptKey(gameId, requestId) { return `${gameId}:${requestId}`; }

export function buildFeedbackContext(context, snapshot) {
  const targetTurn = Number(snapshot?.turn?.turn_number);
  const stateBefore = clone(snapshot?.history?.state_before);
  if (!Number.isInteger(targetTurn) || targetTurn <= 0 || !stateBefore) throw feedbackConflict('r3_feedback_pre_turn_missing');
  return {
    game: clone(context.game),
    state: { ...clone(context.state), revision: Number(snapshot.history.state_revision_before), committed_turn: targetTurn - 1, state: stateBefore },
    turns: clone((context.turns ?? []).filter(turn => Number(turn.turn_number) < targetTurn)),
    job: null
  };
}

export class InMemoryR3Store {
  constructor({ contentVersion = 'company-r3-m0', clock = () => Date.now(), persistence = createInMemoryR3Persistence() } = {}) { this.contentVersion = contentVersion; this.clock = clock; Object.assign(this, persistence); }
  now() { return new Date(this.clock()).toISOString(); }
  createGame({ profile, locationId = null, presentActorIds = [] }) {
    const gameId = id(); const created = this.now();
    this.games.set(gameId, { game_id: gameId, content_version: this.contentVersion, profile: clone(profile), created_at: created });
    this.states.set(gameId, { game_id: gameId, revision: 0, committed_turn: 0, state: createInitialState(profile, locationId, presentActorIds), updated_at: created });
    return this.context(gameId);
  }
  createOpening(gameId, payload) {
    if (!this.games.has(gameId)) throw new Error('r3_game_not_found');
    const key = `${gameId}:0`;
    if (!this.turns.has(key)) {
      const current = this.states.get(gameId);
      if (!Number.isInteger(payload.expectedRevision) || current.revision !== payload.expectedRevision) throw new Error('r3_opening_conflict');
      const stateBefore = clone(current.state); const stateAfter = clone(payload.stateAfter ?? current.state); const committedAt = this.now();
      this.states.set(gameId, { ...current, state: stateAfter, updated_at: committedAt });
      const turn = { game_id: gameId, turn_number: 0, revision: 1, literal_action: '', story_text: payload.storyText, choices: [...(payload.choices ?? [])], turn_summary: payload.summary, mind_monitor: clone(payload.mindMonitor ?? {}), observer_raw: clone(payload.observerRaw ?? {}), observer_applied: clone(payload.observerApplied ?? {}), warnings: [...(payload.warnings ?? [])], state_after: stateAfter, committed_at: committedAt };
      this.turns.set(key, turn);
      this.revisionHistory.set(historyKey(gameId, 0, 1), { revision_id: id(), game_id: gameId, turn_number: 0, revision: 1, revision_kind: 'opening', revision_request_id: null, feedback_text: null, literal_action: '', story_text: payload.storyText, choices: [...(payload.choices ?? [])], turn_summary: payload.summary, mind_monitor: clone(payload.mindMonitor ?? {}), observer_raw: clone(payload.observerRaw ?? {}), observer_applied: clone(payload.observerApplied ?? {}), warnings: [...(payload.warnings ?? [])], state_before: stateBefore, state_after: stateAfter, state_revision_before: current.revision, state_revision_after: current.revision, supersedes_revision_id: null, committed_at: committedAt });
    }
    return this.context(gameId);
  }
  context(gameId) {
    if (!this.games.has(gameId)) throw new Error('r3_game_not_found');
    const state = this.states.get(gameId); const turns = [...this.turns.values()].filter(turn => turn.game_id === gameId).sort((a, b) => a.turn_number - b.turn_number);
    this.expireStaleJob(gameId, state.committed_turn + 1);
    const job = [...this.jobs.values()].find(item => item.game_id === gameId && item.turn_number === state.committed_turn + 1) ?? null;
    return { game: clone(this.games.get(gameId)), state: clone(state), turns: clone(turns), job: job ? clone(job) : null };
  }
  feedbackContext(gameId, snapshot) { return buildFeedbackContext(this.context(gameId), snapshot); }
  getJob(gameId, turnNumber) { this.expireStaleJob(gameId, turnNumber); return clone(this.jobs.get(`${gameId}:${turnNumber}`) ?? null); }
  reserveTurn({ gameId, turnNumber, actionId, literalAction, retryFailed = false }) {
    requireLiteralAction(literalAction); if (!this.games.has(gameId)) throw new Error('r3_game_not_found');
    const state = this.states.get(gameId); if (!state || state.committed_turn + 1 !== turnNumber) throw new Error('r3_turn_conflict');
    this.expireStaleJob(gameId, turnNumber); const key = `${gameId}:${turnNumber}`; const existing = this.jobs.get(key);
    if (existing) { if (existing.status === 'failed' && retryFailed) { const now = this.now(); Object.assign(existing, { action_id: actionId, literal_action: literalAction, status: 'processing', stage: 'reserved', stage_started_at: now, story_text: '', error_code: null, attempt_no: existing.attempt_no + 1, updated_at: now }); return { job: clone(existing), created: true, retried: true }; } return { job: clone(existing), created: false }; }
    const now = this.now(); const job = { game_id: gameId, turn_number: turnNumber, action_id: actionId, literal_action: literalAction, status: 'processing', stage: 'reserved', stage_started_at: now, story_text: '', error_code: null, attempt_no: 1, progress_writes: 0, created_at: now, updated_at: now };
    this.jobs.set(key, job); return { job: clone(job), created: true };
  }
  updateProgress({ gameId, turnNumber, attempt, storyText }) { const job = this.jobs.get(`${gameId}:${turnNumber}`); assertAttempt(job, attempt); const now = this.now(); if (job.stage !== 'story_streaming') job.stage_started_at = now; job.story_text = storyText; job.stage = 'story_streaming'; job.progress_writes = (job.progress_writes ?? 0) + 1; job.updated_at = now; return clone(job); }
  markStoryComplete({ gameId, turnNumber, attempt, storyText }) { const job = this.jobs.get(`${gameId}:${turnNumber}`); assertAttempt(job, attempt); const now = this.now(); if (job.stage !== 'story_complete') job.stage_started_at = now; job.story_text = storyText; job.stage = 'story_complete'; job.updated_at = now; return clone(job); }
  commitTurn({ gameId, turnNumber, attempt, expectedRevision, storyText, choices, summary, mindMonitor, observerRaw, observerApplied, warnings, stateAfter }) {
    const state = this.states.get(gameId); const job = this.jobs.get(`${gameId}:${turnNumber}`);
    if (!state || state.revision !== expectedRevision || state.committed_turn + 1 !== turnNumber) throw new Error('r3_commit_conflict');
    assertAttempt(job, attempt); const stateBefore = clone(state.state); const committedAt = this.now(); const nextRevision = state.revision + 1;
    this.states.set(gameId, { ...state, revision: nextRevision, committed_turn: turnNumber, state: clone(stateAfter), updated_at: committedAt });
    const turn = { game_id: gameId, turn_number: turnNumber, revision: 1, literal_action: attempt.literalAction, story_text: storyText, choices: [...(choices ?? [])], turn_summary: summary, mind_monitor: clone(mindMonitor ?? {}), observer_raw: clone(observerRaw ?? {}), observer_applied: clone(observerApplied ?? {}), warnings: [...(warnings ?? [])], state_after: clone(stateAfter), committed_at: committedAt };
    this.turns.set(`${gameId}:${turnNumber}`, turn);
    this.revisionHistory.set(historyKey(gameId, turnNumber, 1), { revision_id: id(), game_id: gameId, turn_number: turnNumber, revision: 1, revision_kind: 'ordinary', revision_request_id: null, feedback_text: null, literal_action: attempt.literalAction, story_text: storyText, choices: [...(choices ?? [])], turn_summary: summary, mind_monitor: clone(mindMonitor ?? {}), observer_raw: clone(observerRaw ?? {}), observer_applied: clone(observerApplied ?? {}), warnings: [...(warnings ?? [])], state_before: stateBefore, state_after: clone(stateAfter), state_revision_before: state.revision, state_revision_after: nextRevision, supersedes_revision_id: null, committed_at: committedAt });
    Object.assign(job, { status: 'committed', stage: 'committed', story_text: storyText, updated_at: committedAt }); return this.context(gameId);
  }
  beginFeedbackRevision({ gameId, revisionRequestId, expectedTurn, expectedStateRevision, feedbackText }) {
    if (!revisionRequestId || !Number.isInteger(expectedTurn) || expectedTurn <= 0 || !Number.isInteger(expectedStateRevision) || expectedStateRevision < 0 || typeof feedbackText !== 'string' || !feedbackText.trim() || feedbackText.length > 2000) throw feedbackConflict('r3_feedback_payload_invalid');
    const existing = this.feedbackAttempts.get(attemptKey(gameId, revisionRequestId));
    if (existing) {
      const target = this.turns.get(`${gameId}:${existing.target_turn_number}`); const history = this.revisionHistory.get(historyKey(gameId, existing.target_turn_number, existing.target_revision));
      if (!target || !history) throw feedbackConflict('r3_feedback_target_missing');
      return { created: false, attempt: clone(existing), snapshot: { turn: clone(target), history: clone(history) } };
    }
    const state = this.states.get(gameId); if (!state || state.committed_turn !== expectedTurn || state.revision !== expectedStateRevision) throw feedbackConflict();
    const target = this.turns.get(`${gameId}:${expectedTurn}`); const history = this.revisionHistory.get(historyKey(gameId, expectedTurn, target?.revision));
    if (!target) throw feedbackConflict('r3_feedback_target_missing'); if (!history?.state_before) throw feedbackConflict('r3_feedback_pre_turn_missing'); if (history.state_revision_after !== state.revision) throw feedbackConflict();
    const nextJob = this.jobs.get(`${gameId}:${expectedTurn + 1}`); if (nextJob?.status === 'processing' || nextJob?.status === 'failed') throw feedbackConflict('r3_feedback_next_turn_unresolved');
    const key = attemptKey(gameId, revisionRequestId); const snapshot = { turn: clone(target), history: clone(history) };
    const attempt = { attempt_id: id(), game_id: gameId, revision_request_id: revisionRequestId, target_turn_number: expectedTurn, target_revision: target.revision, expected_state_revision: state.revision, original_literal_action: target.literal_action, feedback_text: feedbackText.trim(), status: 'processing', error_code: null, created_at: this.now(), updated_at: this.now() };
    this.feedbackAttempts.set(key, attempt); return { created: true, attempt: clone(attempt), snapshot };
  }
  commitFeedbackRevision({ gameId, attemptId, revisionRequestId, expectedTurn, expectedStateRevision, storyText, choices, summary, mindMonitor, observerRaw, observerApplied, warnings, stateAfter }) {
    const state = this.states.get(gameId); const attempt = [...this.feedbackAttempts.values()].find(item => item.attempt_id === attemptId && item.game_id === gameId && item.revision_request_id === revisionRequestId);
    if (!attempt) throw feedbackConflict('r3_feedback_attempt_missing'); if (attempt.status === 'committed') return { ...this.context(gameId), feedback: { replayed: true, turn_number: attempt.target_turn_number, revision: attempt.target_revision + 1 } };
    if (attempt.status !== 'processing' || state.revision !== expectedStateRevision || state.committed_turn !== expectedTurn || attempt.target_turn_number !== expectedTurn || attempt.expected_state_revision !== expectedStateRevision) throw feedbackConflict();
    const target = this.turns.get(`${gameId}:${expectedTurn}`); const prior = this.revisionHistory.get(historyKey(gameId, expectedTurn, attempt.target_revision)); const nextJob = this.jobs.get(`${gameId}:${expectedTurn + 1}`);
    if (!target || target.revision !== attempt.target_revision || !prior?.state_before || prior.state_revision_after !== state.revision) throw feedbackConflict(); if (nextJob?.status === 'processing' || nextJob?.status === 'failed') throw feedbackConflict('r3_feedback_next_turn_unresolved');
    if (typeof storyText !== 'string' || !storyText.trim() || !Array.isArray(choices) || typeof summary !== 'string' || !summary.trim() || !stateAfter) throw new Error('r3_feedback_commit_payload_invalid');
    const nextRevision = target.revision + 1; const nextStateRevision = state.revision + 1; const committedAt = this.now(); const nextTurn = { ...target, revision: nextRevision, story_text: storyText, choices: [...choices], turn_summary: summary, mind_monitor: clone(mindMonitor ?? {}), observer_raw: clone(observerRaw ?? {}), observer_applied: clone(observerApplied ?? {}), warnings: [...(warnings ?? [])], state_after: clone(stateAfter), committed_at: committedAt };
    this.turns.set(`${gameId}:${expectedTurn}`, nextTurn); this.states.set(gameId, { ...state, revision: nextStateRevision, state: clone(stateAfter), updated_at: committedAt });
    this.revisionHistory.set(historyKey(gameId, expectedTurn, nextRevision), { revision_id: id(), game_id: gameId, turn_number: expectedTurn, revision: nextRevision, revision_kind: 'feedback', revision_request_id: revisionRequestId, feedback_text: attempt.feedback_text, literal_action: attempt.original_literal_action, story_text: storyText, choices: [...choices], turn_summary: summary, mind_monitor: clone(mindMonitor ?? {}), observer_raw: clone(observerRaw ?? {}), observer_applied: clone(observerApplied ?? {}), warnings: [...(warnings ?? [])], state_before: clone(prior.state_before), state_after: clone(stateAfter), state_revision_before: prior.state_revision_before, state_revision_after: nextStateRevision, supersedes_revision_id: prior.revision_id, committed_at: committedAt });
    Object.assign(attempt, { status: 'committed', updated_at: committedAt }); return { ...this.context(gameId), feedback: { replayed: false, turn_number: expectedTurn, revision: nextRevision } };
  }
  failFeedbackRevision({ gameId, attemptId, revisionRequestId, errorCode }) {
    const attempt = [...this.feedbackAttempts.values()].find(item => item.attempt_id === attemptId && item.game_id === gameId && item.revision_request_id === revisionRequestId); if (!attempt) throw feedbackConflict('r3_feedback_attempt_missing');
    if (attempt.status === 'processing') Object.assign(attempt, { status: 'failed', error_code: errorCode || 'r3_feedback_failed', updated_at: this.now() }); return clone(attempt);
  }
  applyCsa({ gameId, expectedRevision, stateAfter, operations = [] }) { const state = this.states.get(gameId); if (!state || state.revision !== expectedRevision) throw new Error('r3_csa_revision_conflict'); const updatedAt = this.now(); this.states.set(gameId, { ...state, revision: state.revision + 1, state: clone(stateAfter), updated_at: updatedAt }); return this.context(gameId); }
  failJob({ gameId, turnNumber, attempt, errorCode }) { const job = this.jobs.get(`${gameId}:${turnNumber}`); assertAttempt(job, attempt); const now = this.now(); Object.assign(job, { status: 'failed', stage: 'failed', error_code: errorCode || 'r3_turn_failed', stage_started_at: now, updated_at: now }); return this.context(gameId); }
  expireStaleJob(gameId, turnNumber) { const job = this.jobs.get(`${gameId}:${turnNumber}`); const startedAt = Date.parse(job?.stage_started_at ?? job?.created_at ?? ''); if (job?.status === 'processing' && Number.isFinite(startedAt) && this.clock() - startedAt >= r3StageLeaseMs(job.stage)) { const now = this.now(); Object.assign(job, { status: 'failed', stage: 'failed', error_code: 'r3_stale_turn_timeout', stage_started_at: now, updated_at: now }); return true; } return false; }
}
