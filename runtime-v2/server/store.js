import { clone, createInitialState, requireLiteralAction } from '../domain/contracts.js';
import { V2_TURN_LEASE_MS, isStaleTurn } from './job-policy.js';

export function createInMemoryPersistence() {
  return { games: new Map(), states: new Map(), jobs: new Map(), turns: new Map() };
}

function id() {
  return globalThis.crypto?.randomUUID?.() ?? `v2-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class InMemoryV2Store {
  constructor({ content, persistence = createInMemoryPersistence(), clock = () => Date.now() } = {}) {
    this.content = content;
    this.clock = clock;
    this.games = persistence.games;
    this.states = persistence.states;
    this.jobs = persistence.jobs;
    this.turns = persistence.turns;
  }

  now() { return new Date(this.clock()).toISOString(); }

  createGame({ playerName = '플레이어' } = {}) {
    const gameId = id();
    const game = { game_id: gameId, content_version: 'company-v2-phase1', created_at: new Date().toISOString() };
    this.games.set(gameId, game);
    this.states.set(gameId, { game_id: gameId, revision: 0, committed_turn: 0, state: createInitialState({ playerName }), updated_at: game.created_at });
    return this.context(gameId);
  }

  createOpening(gameId, { storyText, parsedBlocks, choices, summary, mindMonitor = {} }) {
    const key = `${gameId}:0`;
    if (!this.games.has(gameId)) throw new Error('game_not_found');
    if (!this.turns.has(key)) {
      this.turns.set(key, { game_id: gameId, turn_number: 0, literal_action: '', story_text: storyText, parsed_blocks: parsedBlocks, choices: [...choices], turn_summary: summary, mind_monitor: mindMonitor, committed_at: new Date().toISOString(), state_after: clone(this.states.get(gameId).state) });
    }
    return this.context(gameId);
  }

  context(gameId) {
    if (!this.games.has(gameId)) throw new Error('game_not_found');
    const state = this.states.get(gameId);
    const turns = [...this.turns.values()].filter((turn) => turn.game_id === gameId).sort((a, b) => a.turn_number - b.turn_number);
    this.expireStaleJob(gameId, state.committed_turn + 1);
    const job = [...this.jobs.values()].filter((item) => item.game_id === gameId && item.turn_number === state.committed_turn + 1)[0] ?? null;
    return { game: clone(this.games.get(gameId)), state: clone(state), turns: clone(turns), job: summarizeJob(job) };
  }

  reserveTurn({ gameId, turnNumber, actionId, literalAction, retryFailed = false }) {
    requireLiteralAction(literalAction);
    if (!this.games.has(gameId)) throw new Error('game_not_found');
    const key = `${gameId}:${turnNumber}`;
    this.expireStaleJob(gameId, turnNumber);
    const existing = this.jobs.get(key);
    if (existing) {
      if (existing.status === 'failed' && retryFailed) {
        Object.assign(existing, { action_id: actionId, literal_action: literalAction, status: 'processing', story_text: '', error_code: null, attempt_no: existing.attempt_no + 1, updated_at: this.now(), running: false });
        return { job: existing, created: true, retried: true };
      }
      return { job: existing, created: false };
    }
    const job = { game_id: gameId, turn_number: turnNumber, action_id: actionId, literal_action: literalAction, status: 'processing', story_text: '', error_code: null, attempt_no: 1, created_at: this.now(), updated_at: this.now(), running: false };
    this.jobs.set(key, job);
    return { job, created: true };
  }

  getJob(gameId, turnNumber) { this.expireStaleJob(gameId, turnNumber); return this.jobs.get(`${gameId}:${turnNumber}`) ?? null; }

  expireStaleJob(gameId, turnNumber) {
    const job = this.jobs.get(`${gameId}:${turnNumber}`);
    if (job?.status === 'processing' && isStaleTurn(job.updated_at, this.clock(), V2_TURN_LEASE_MS)) {
      Object.assign(job, { status: 'failed', error_code: 'stale_turn_timeout', updated_at: this.now(), running: false });
      return true;
    }
    return false;
  }

  updateProgress({ gameId, turnNumber, storyText }) {
    const job = this.getJob(gameId, turnNumber);
    if (!job || job.status !== 'processing') throw new Error('job_not_processing');
    job.story_text = storyText;
    job.updated_at = this.now();
    return summarizeJob(job);
  }

  commitTurn({ gameId, turnNumber, expectedRevision, storyText, parsedBlocks, choices, summary, mindMonitor, stateAfter }) {
    const state = this.states.get(gameId);
    const job = this.getJob(gameId, turnNumber);
    if (!state || !job || state.revision !== expectedRevision || state.committed_turn + 1 !== turnNumber) throw new Error('commit_conflict');
    const committedAt = this.now();
    this.states.set(gameId, { ...state, revision: state.revision + 1, committed_turn: turnNumber, state: clone(stateAfter), updated_at: committedAt });
    this.turns.set(`${gameId}:${turnNumber}`, { game_id: gameId, turn_number: turnNumber, literal_action: job.literal_action, story_text: storyText, parsed_blocks: clone(parsedBlocks), choices: [...choices], turn_summary: summary, mind_monitor: clone(mindMonitor), committed_at: committedAt, state_after: clone(stateAfter) });
    Object.assign(job, { status: 'committed', story_text: storyText, updated_at: committedAt, running: false });
    return this.context(gameId);
  }

  failJob(gameId, turnNumber, errorCode) {
    const job = this.getJob(gameId, turnNumber);
    if (job) Object.assign(job, { status: 'failed', error_code: errorCode, updated_at: this.now(), running: false });
    return this.context(gameId);
  }
}

export function summarizeJob(job) {
  if (!job) return null;
  return { game_id: job.game_id, turn_number: job.turn_number, action_id: job.action_id, literal_action: job.literal_action, status: job.status, story_text: job.story_text, error_code: job.error_code, attempt_no: job.attempt_no };
}
