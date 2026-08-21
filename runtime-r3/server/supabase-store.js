import { clone, createInitialState } from '../domain/contracts.js';

export class R3ConfigurationError extends Error {
  constructor(message) { super(message); this.name = 'R3ConfigurationError'; this.code = 'r3_configuration_error'; }
}

class R3SupabaseHttp {
  constructor({ env, fetchImpl = fetch } = {}) {
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) throw new R3ConfigurationError('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Company R3');
    this.base = env.SUPABASE_URL.replace(/\/$/, ''); this.key = env.SUPABASE_SERVICE_ROLE_KEY; this.fetchImpl = fetchImpl;
  }
  async request(path, { method = 'GET', body } = {}) {
    const response = await this.fetchImpl(`${this.base}/rest/v1/${path}`, { method, headers: { apikey: this.key, authorization: `Bearer ${this.key}`, accept: 'application/json', 'content-type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const text = await response.text(); let payload = null; try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
    if (!response.ok) { const detail = Array.isArray(payload) ? payload[0] : payload; const error = new Error(detail?.message ?? `r3_db_${response.status}`); error.code = detail?.code ?? detail?.message; throw error; }
    return payload;
  }
  rpc(name, args) { return this.request(`rpc/${name}`, { method: 'POST', body: args }); }
  select(table, query) { return this.request(`${table}?${new URLSearchParams({ select: '*', ...query })}`); }
}

export class SupabaseR3Store {
  constructor({ env, fetchImpl = fetch, contentVersion = 'company-r3-m0' } = {}) { this.db = new R3SupabaseHttp({ env, fetchImpl }); this.contentVersion = contentVersion; }
  async createGame({ profile, locationId = null, presentActorIds = [] }) {
    const state = createInitialState(profile, locationId, presentActorIds);
    const result = await this.db.rpc('company_r3_create_game', { p_content_version: this.contentVersion, p_profile: profile, p_state: state });
    return this.context(result?.game_id ?? result);
  }
  async createOpening(gameId, payload) {
    await this.db.rpc('company_r3_create_opening', { p_game_id: gameId, p_story_text: payload.storyText, p_choices: payload.choices ?? [], p_turn_summary: payload.summary, p_mind_monitor: payload.mindMonitor ?? {}, p_observer_raw: payload.observerRaw ?? {}, p_observer_applied: payload.observerApplied ?? {}, p_warnings: payload.warnings ?? [], p_state_after: payload.stateAfter });
    return this.context(gameId);
  }
  async context(gameId) {
    const [games, states] = await Promise.all([this.db.select('company_r3_games', { game_id: `eq.${gameId}` }), this.db.select('company_r3_state', { game_id: `eq.${gameId}` })]);
    if (!games?.[0] || !states?.[0]) throw new Error('r3_game_not_found');
    const state = states[0]; await this.expireStaleJob(gameId, state.committed_turn + 1);
    const [turns, jobs] = await Promise.all([this.db.select('company_r3_turns', { game_id: `eq.${gameId}`, order: 'turn_number.asc' }), this.db.select('company_r3_turn_jobs', { game_id: `eq.${gameId}`, order: 'turn_number.asc' })]);
    const job = jobs?.find(candidate => candidate.turn_number === state.committed_turn + 1) ?? null;
    return { game: clone(games[0]), state: clone(state), turns: clone(turns ?? []), job: job ? summarizeJob(job) : null };
  }
  async getJob(gameId, turnNumber) { await this.expireStaleJob(gameId, turnNumber); const rows = await this.db.select('company_r3_turn_jobs', { game_id: `eq.${gameId}`, turn_number: `eq.${turnNumber}` }); return rows?.[0] ? summarizeJob(rows[0]) : null; }
  async reserveTurn({ gameId, turnNumber, actionId, literalAction, retryFailed = false }) { const result = await this.db.rpc('company_r3_reserve_turn', { p_game_id: gameId, p_turn_number: turnNumber, p_action_id: actionId, p_literal_action: literalAction, p_retry_failed: retryFailed }); return { job: summarizeJob(result.job), created: result.created === true, retried: result.retried === true }; }
  async updateProgress({ gameId, turnNumber, attempt, storyText }) { return this.db.rpc('company_r3_update_turn_progress', { p_game_id: gameId, p_turn_number: turnNumber, p_action_id: attempt.actionId, p_attempt_no: attempt.attemptNo, p_story_text: storyText }); }
  async markStoryComplete({ gameId, turnNumber, attempt, storyText }) { return this.db.rpc('company_r3_mark_story_complete', { p_game_id: gameId, p_turn_number: turnNumber, p_action_id: attempt.actionId, p_attempt_no: attempt.attemptNo, p_story_text: storyText }); }
  async commitTurn({ gameId, turnNumber, attempt, expectedRevision, storyText, choices, summary, mindMonitor, observerRaw, observerApplied, warnings, stateAfter }) { await this.db.rpc('company_r3_commit_turn', { p_game_id: gameId, p_turn_number: turnNumber, p_action_id: attempt.actionId, p_attempt_no: attempt.attemptNo, p_expected_revision: expectedRevision, p_story_text: storyText, p_choices: choices ?? [], p_turn_summary: summary, p_mind_monitor: mindMonitor ?? {}, p_observer_raw: observerRaw ?? {}, p_observer_applied: observerApplied ?? {}, p_warnings: warnings ?? [], p_state_after: stateAfter }); return this.context(gameId); }
  async failJob({ gameId, turnNumber, attempt, errorCode }) { await this.db.rpc('company_r3_fail_turn', { p_game_id: gameId, p_turn_number: turnNumber, p_action_id: attempt.actionId, p_attempt_no: attempt.attemptNo, p_error_code: errorCode }); return this.context(gameId); }
  async expireStaleJob(gameId, turnNumber) { return this.db.rpc('company_r3_expire_stale_turn', { p_game_id: gameId, p_turn_number: turnNumber }); }
}

function summarizeJob(job) { return { ...job, progress_writes: Number(job.progress_writes ?? 0) }; }
