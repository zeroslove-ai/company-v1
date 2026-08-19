import { clone, createInitialState } from '../domain/contracts.js';

export class V2ConfigurationError extends Error {
  constructor(message) { super(message); this.name = 'V2ConfigurationError'; this.code = 'configuration_error'; }
}

class V2SupabaseHttp {
  constructor({ env, fetchImpl = fetch }) {
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) throw new V2ConfigurationError('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Company v2');
    this.base = env.SUPABASE_URL.replace(/\/$/, '');
    this.key = env.SUPABASE_SERVICE_ROLE_KEY;
    this.fetchImpl = fetchImpl;
  }

  async request(path, { method = 'GET', body } = {}) {
    const response = await this.fetchImpl(`${this.base}/rest/v1/${path}`, {
      method,
      headers: { apikey: this.key, authorization: `Bearer ${this.key}`, accept: 'application/json', 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    let payload = null;
    try { payload = await response.json(); } catch { payload = null; }
    if (!response.ok) {
      const detail = Array.isArray(payload) ? payload[0] : payload;
      const message = detail?.message ?? `v2_db_${response.status}`;
      const error = new Error(message);
      if (message === 'v2_attempt_fence_conflict' || detail?.code === 'v2_attempt_fence_conflict') error.code = 'v2_attempt_fence_conflict';
      throw error;
    }
    return payload;
  }

  rpc(name, args) { return this.request(`rpc/${name}`, { method: 'POST', body: args }); }
  select(table, query) { return this.request(`${table}?${new URLSearchParams({ ...query, select: '*' })}`); }
}

export class SupabaseV2Store {
  constructor({ env, fetchImpl = fetch } = {}) { this.db = new V2SupabaseHttp({ env, fetchImpl }); }

  async createGame({ playerName = '플레이어' } = {}) {
    const data = await this.db.rpc('company_v2_create_game', { p_content_version: 'company-v2-phase1', p_state: createInitialState({ playerName }) });
    return this.context(data.game_id ?? data);
  }

  async createOpening(gameId, payload) {
    await this.db.rpc('company_v2_create_opening', { p_game_id: gameId, p_story_text: payload.storyText, p_parsed_blocks: payload.parsedBlocks, p_choices: payload.choices, p_turn_summary: payload.summary, p_mind_monitor: payload.mindMonitor ?? {} });
    return this.context(gameId);
  }

  async context(gameId) {
    const [games, states] = await Promise.all([
      this.db.select('company_v2_games', { game_id: `eq.${gameId}` }),
      this.db.select('company_v2_state', { game_id: `eq.${gameId}` })
    ]);
    if (!games?.[0] || !states?.[0]) throw new Error('game_not_found');
    const state = states[0];
    await this.db.rpc('company_v2_expire_stale_turn', { p_game_id: gameId, p_turn_number: state.committed_turn + 1 });
    const [turns, jobs] = await Promise.all([
      this.db.select('company_v2_turns', { game_id: `eq.${gameId}`, order: 'turn_number.asc' }),
      this.db.select('company_v2_turn_jobs', { game_id: `eq.${gameId}`, order: 'turn_number.asc' })
    ]);
    const job = jobs?.find((candidate) => candidate.turn_number === state.committed_turn + 1) ?? null;
    return { game: clone(games[0]), state: clone(state), turns: clone(turns ?? []), job: job ? summarizeDbJob(job) : null };
  }

  async getJob(gameId, turnNumber) {
    await this.db.rpc('company_v2_expire_stale_turn', { p_game_id: gameId, p_turn_number: turnNumber });
    const rows = await this.db.select('company_v2_turn_jobs', { game_id: `eq.${gameId}`, turn_number: `eq.${turnNumber}` });
    return rows?.[0] ?? null;
  }

  async reserveTurn({ gameId, turnNumber, actionId, literalAction, retryFailed = false }) {
    const result = await this.db.rpc('company_v2_reserve_turn', { p_game_id: gameId, p_turn_number: turnNumber, p_action_id: actionId, p_literal_action: literalAction, p_retry_failed: retryFailed });
    return { job: result.job, created: result.created === true, retried: result.retried === true };
  }

  async updateProgress({ gameId, turnNumber, attempt, storyText }) {
    return this.db.rpc('company_v2_update_turn_progress', { p_game_id: gameId, p_turn_number: turnNumber, p_action_id: attempt.actionId, p_attempt_no: attempt.attemptNo, p_story_text: storyText });
  }

  async commitTurn({ gameId, turnNumber, attempt, expectedRevision, storyText, parsedBlocks, choices, summary, mindMonitor, stateAfter }) {
    await this.db.rpc('company_v2_commit_turn', { p_game_id: gameId, p_turn_number: turnNumber, p_action_id: attempt.actionId, p_attempt_no: attempt.attemptNo, p_expected_revision: expectedRevision, p_story_text: storyText, p_parsed_blocks: parsedBlocks, p_choices: choices, p_turn_summary: summary, p_mind_monitor: mindMonitor, p_state_after: stateAfter });
    return this.context(gameId);
  }

  async failJob(gameId, turnNumber, attempt, errorCode) {
    await this.db.rpc('company_v2_fail_turn', { p_game_id: gameId, p_turn_number: turnNumber, p_action_id: attempt.actionId, p_attempt_no: attempt.attemptNo, p_error_code: errorCode });
    return this.context(gameId);
  }
}

function summarizeDbJob(job) {
  return { game_id: job.game_id, turn_number: job.turn_number, action_id: job.action_id, literal_action: job.literal_action, status: job.status, story_text: job.story_text, error_code: job.error_code, attempt_no: job.attempt_no };
}
