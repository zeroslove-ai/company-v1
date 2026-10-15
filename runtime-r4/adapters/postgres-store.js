import { randomUUID, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { hashCommand, stableJson } from '../domain/command.js';
import { R4StoreError } from './store-errors.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const schemaSql = readFileSync(resolve(root, 'supabase/r4/001_company_r4.sql'), 'utf8');
const asJson = value => typeof value === 'string' ? JSON.parse(value) : value;
const tokens = text => [...new Set(String(text ?? '').toLocaleLowerCase('ko-KR').match(/[\p{L}\p{N}]{2,}/gu) ?? [])].slice(0, 24);

function mapJob(row) {
  if (!row) return null;
  return {
    jobId: row.job_id,
    gameId: row.game_id,
    commandId: row.command_id,
    requestId: row.request_id,
    operationKind: row.operation_kind,
    commandHash: row.command_hash,
    command: asJson(row.command),
    feedbackText: row.feedback_text ?? '',
    feedbackStateBefore: row.feedback_state_before ? asJson(row.feedback_state_before) : null,
    originalTurnNumber: row.original_turn_number,
    originalTurnRevision: row.original_turn_revision,
    status: row.status,
    stage: row.stage,
    attemptNo: row.attempt_no,
    expectedStateRevision: row.expected_state_revision,
    storyCheckpoint: row.story_checkpoint ?? '',
    observerRaw: row.observer_raw ? asJson(row.observer_raw) : null,
    receipt: row.receipt ? asJson(row.receipt) : null,
    error: row.error ? asJson(row.error) : null
  };
}

export async function createR4Store({ dbPath = resolve(root, 'var/r4-local-postgres'), liveCallBudget = 120 } = {}) {
  await (await import('node:fs/promises')).mkdir(dirname(dbPath), { recursive: true });
  const db = await PGlite.create(dbPath);
  await db.exec(schemaSql);
  await db.query('UPDATE company_r4_jobs SET status=\'failed\',stage=\'process_interrupted\',error=jsonb_build_object(\'code\',\'process_interrupted\'),updated_at=now() WHERE status=\'running\'');

  const store = {
    dbPath,
    async createGame(content) {
      const gameId = randomUUID();
      const start = content.locations.find(location => location.location_id === 'lobby') ?? content.locations[0];
      const initialState = {
        state_revision: 0,
        committed_turn: 0,
        turn_revision: 0,
        profile: null,
        time: { day: 1, minutes: 9 * 60 },
        scene: { location_id: start?.location_id ?? '', present_actor_ids: [...(start?.default_actor_ids ?? [])], scene_note: '' },
        active_rules: [],
        rule_history: [],
        projection_meta: { status: 'complete', last_verified_turn: {}, unverified: [] }
      };
      await db.query(
        'INSERT INTO company_r4_games (game_id,status,profile,state,content_version) VALUES ($1,$2,NULL,$3::jsonb,$4)',
        [gameId, 'setup_needed', JSON.stringify(initialState), content.version]
      );
      return gameId;
    },

    async saveSetup(gameId, profile, initialScene = null) {
      const scene = initialScene ?? { location_id: '', present_actor_ids: [], scene_note: '' };
      const result = await db.query(
        'UPDATE company_r4_games SET profile=$2::jsonb,state=jsonb_set(jsonb_set(state,\'{profile}\',$2::jsonb),\'{scene}\',$3::jsonb),status=\'ready\',updated_at=now() WHERE game_id=$1 AND status=\'setup_needed\' RETURNING game_id',
        [gameId, JSON.stringify(profile), JSON.stringify(scene)]
      );
      if (!result.rows.length) throw new R4StoreError('game_setup_unavailable', 409);
      return this.readSnapshot(gameId);
    },

    async readSnapshot(gameId) {
      const result = await db.query(
        'SELECT g.game_id,g.status,g.profile,g.state,g.content_version,t.turn_number,t.turn_revision,t.turn_record ' +
        'FROM company_r4_games g LEFT JOIN LATERAL (' +
        ' SELECT turn_number,turn_revision,turn_record FROM company_r4_turns ' +
        ' WHERE game_id=g.game_id ORDER BY turn_number DESC,turn_revision DESC LIMIT 1' +
        ') t ON true WHERE g.game_id=$1',
        [gameId]
      );
      const row = result.rows[0];
      if (!row) throw new R4StoreError('game_not_found', 404);
      return {
        game_id: row.game_id,
        status: row.status,
        profile: row.profile ? asJson(row.profile) : null,
        state: asJson(row.state),
        content_version: row.content_version,
        latest_turn: row.turn_record ? asJson(row.turn_record) : null,
        latest_turn_number: row.turn_number ?? 0,
        latest_turn_revision: row.turn_revision ?? 0
      };
    },

    async beginCommand({ command, requestId = command.command_id, operationKind = 'TURN', feedbackText = '', feedbackStateBefore = null, originalTurnNumber = null, originalTurnRevision = null }) {
      const commandHash = operationKind === 'FEEDBACK'
        ? createHash('sha256').update(stableJson({ command, feedbackText, originalTurnNumber, originalTurnRevision })).digest('hex')
        : hashCommand(command);
      return db.transaction(async tx => {
        const existing = await tx.query('SELECT * FROM company_r4_jobs WHERE game_id=$1 AND request_id=$2', [command.game_id, requestId]);
        if (existing.rows.length) {
          const job = mapJob(existing.rows[0]);
          if (job.commandHash !== commandHash) throw new R4StoreError('command_id_payload_conflict', 409);
          return { job, duplicate: true };
        }
        const gameResult = await tx.query('SELECT state,status,profile FROM company_r4_games WHERE game_id=$1', [command.game_id]);
        const game = gameResult.rows[0];
        if (!game) throw new R4StoreError('game_not_found', 404);
        const state = asJson(game.state);
        if (state.state_revision !== command.expected_state_revision) {
          throw new R4StoreError('state_revision_conflict', 409, { current_state_revision: state.state_revision });
        }
        if (!game.profile) throw new R4StoreError('setup_required', 409);
        const jobId = randomUUID();
        const result = await tx.query(
          'INSERT INTO company_r4_jobs (job_id,game_id,command_id,request_id,operation_kind,command_hash,command,feedback_state_before,original_turn_revision,status,stage,attempt_no,expected_state_revision,feedback_text,original_turn_number) ' +
          'VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,\'running\',\'story\',1,$10,$11,$12) RETURNING *',
          [jobId, command.game_id, command.command_id, requestId, operationKind, commandHash, JSON.stringify(command), feedbackStateBefore ? JSON.stringify(feedbackStateBefore) : null, originalTurnRevision, command.expected_state_revision, feedbackText || null, originalTurnNumber]
        );
        return { job: mapJob(result.rows[0]), duplicate: false };
      });
    },

    async beginFeedback({ gameId, requestId, feedbackText, expectedStateRevision }) {
      if (typeof feedbackText !== 'string' || !feedbackText.trim() || feedbackText.length > 2000) throw new R4StoreError('feedback_text_invalid');
      return db.transaction(async tx => {
          const repeated = await tx.query('SELECT * FROM company_r4_jobs WHERE game_id=$1 AND request_id=$2', [gameId, requestId]);
          if (repeated.rows.length) {
            const job = mapJob(repeated.rows[0]);
            if (job.operationKind !== 'FEEDBACK' || job.feedbackText !== feedbackText) {
              throw new R4StoreError('command_id_payload_conflict', 409);
            }
            const repeatedHash = createHash('sha256').update(stableJson({
              command: job.command,
              feedbackText: job.feedbackText,
              originalTurnNumber: job.originalTurnNumber,
              originalTurnRevision: job.originalTurnRevision
            })).digest('hex');
            if (job.commandHash !== repeatedHash) throw new R4StoreError('command_id_payload_conflict', 409);
            return { job, duplicate: true };
          }
        const gameResult = await tx.query('SELECT state,profile FROM company_r4_games WHERE game_id=$1', [gameId]);
        const game = gameResult.rows[0];
        if (!game) throw new R4StoreError('game_not_found', 404);
        const currentState = asJson(game.state);
        if (currentState.state_revision !== expectedStateRevision) {
          throw new R4StoreError('state_revision_conflict', 409, { current_state_revision: currentState.state_revision });
        }
        if (!game.profile || currentState.committed_turn < 1) throw new R4StoreError('feedback_turn_unavailable', 409);
        const turnResult = await tx.query(
          'SELECT command_json,state_before,turn_revision FROM company_r4_turns WHERE game_id=$1 AND turn_number=$2 ORDER BY turn_revision DESC LIMIT 1',
          [gameId, currentState.committed_turn]
        );
        const prior = turnResult.rows[0];
        if (!prior) throw new R4StoreError('feedback_turn_unavailable', 409);
        const command = asJson(prior.command_json);
        const stateBefore = asJson(prior.state_before);
        const commandHash = createHash('sha256').update(stableJson({ command, feedbackText, originalTurnNumber: currentState.committed_turn, originalTurnRevision: prior.turn_revision })).digest('hex');
        const jobId = randomUUID();
        const result = await tx.query(
          'INSERT INTO company_r4_jobs (job_id,game_id,command_id,request_id,operation_kind,command_hash,command,feedback_state_before,original_turn_revision,status,stage,attempt_no,expected_state_revision,feedback_text,original_turn_number) ' +
          'VALUES ($1,$2,$3,$4,\'FEEDBACK\',$5,$6::jsonb,$7::jsonb,$8,\'running\',\'story\',1,$9,$10,$11) RETURNING *',
          [jobId, gameId, command.command_id, requestId, commandHash, JSON.stringify(command), JSON.stringify(stateBefore), prior.turn_revision, expectedStateRevision, feedbackText, currentState.committed_turn]
        );
        return { job: mapJob(result.rows[0]), duplicate: false };
      });
    },

    async retryJob(jobId, gameId) {
      return db.transaction(async tx => {
        const result = await tx.query('SELECT * FROM company_r4_jobs WHERE job_id=$1 AND game_id=$2', [jobId, gameId]);
        const row = result.rows[0];
        if (!row) throw new R4StoreError('job_not_found', 404);
        const job = mapJob(row);
        if (job.status !== 'failed') throw new R4StoreError('job_not_retryable', 409);
        const gameResult = await tx.query('SELECT state FROM company_r4_games WHERE game_id=$1', [gameId]);
        const current = asJson(gameResult.rows[0].state);
        if (current.state_revision !== job.expectedStateRevision) throw new R4StoreError('state_revision_conflict', 409, { current_state_revision: current.state_revision });
        const nextAttempt = job.attemptNo + 1;
        const stage = job.storyCheckpoint ? 'observer' : 'story';
        const updated = await tx.query(
          'UPDATE company_r4_jobs SET status=\'running\',stage=$3,attempt_no=$4,error=NULL,updated_at=now() WHERE job_id=$1 AND attempt_no=$2 AND status=\'failed\' RETURNING *',
          [jobId, job.attemptNo, stage, nextAttempt]
        );
        return { job: mapJob(updated.rows[0]), duplicate: false };
      });
    },

    async updateJob(jobId, attemptNo, { stage, storyCheckpoint, observerRaw, error }) {
      const clauses = ['updated_at=now()'];
      const values = [jobId, attemptNo];
      if (stage) { values.push(stage); clauses.push('stage=$' + values.length); }
      if (storyCheckpoint !== undefined) { values.push(storyCheckpoint); clauses.push('story_checkpoint=$' + values.length); }
      if (observerRaw !== undefined) { values.push(JSON.stringify(observerRaw)); clauses.push('observer_raw=$' + values.length + '::jsonb'); }
      if (error !== undefined) { values.push(JSON.stringify(error)); clauses.push('error=$' + values.length + '::jsonb'); }
      const result = await db.query(
        'UPDATE company_r4_jobs SET ' + clauses.join(',') + ' WHERE job_id=$1 AND attempt_no=$2 AND status=\'running\' RETURNING job_id',
        values
      );
      if (!result.rows.length) throw new R4StoreError('attempt_fenced', 409);
    },

    async failJob(jobId, attemptNo, stage, errorCode) {
      await db.query(
        'UPDATE company_r4_jobs SET status=\'failed\',stage=$3,error=$4::jsonb,updated_at=now() WHERE job_id=$1 AND attempt_no=$2 AND status=\'running\'',
        [jobId, attemptNo, stage, JSON.stringify({ code: String(errorCode ?? 'unknown').slice(0, 100) })]
      );
    },

    async getJob(jobId, gameId) {
      const result = await db.query('SELECT * FROM company_r4_jobs WHERE job_id=$1 AND game_id=$2', [jobId, gameId]);
      return mapJob(result.rows[0]);
    },
    async getLatestJob(gameId) {
      const result = await db.query('SELECT * FROM company_r4_jobs WHERE game_id=$1 ORDER BY created_at DESC LIMIT 1', [gameId]);
      return mapJob(result.rows[0]);
    },

    async getRecentTurns(gameId, committedTurn, limit = 6) {
      const result = await db.query(
        'SELECT DISTINCT ON (turn_number) game_id,turn_number,turn_revision,command_json,turn_record,narrative_body,turn_digest,actor_ids,memory_keywords,memory_important,search_text ' +
        'FROM company_r4_turns WHERE game_id=$1 AND turn_number>$2 AND turn_number<=$3 ' +
        'ORDER BY turn_number DESC,turn_revision DESC LIMIT $4',
        [gameId, Math.max(0, committedTurn - limit), committedTurn, limit]
      );
      return result.rows.reverse();
    },

    async searchMemories({ gameId, beforeTurn, recentTurnNumbers, literalAction, actorIds, limit = 12 }) {
      const searchTerms = tokens(literalAction);
      const result = await db.query(
          'SELECT m.*,t.narrative_body,t.command_json,t.turn_record FROM company_r4_memory_index m ' +
          'JOIN company_r4_turns t ON t.game_id=m.game_id AND t.turn_number=m.turn_number AND t.turn_revision=m.source_revision ' +
          'WHERE m.game_id=$1 AND m.turn_number<$2 ' +
          'AND (m.actor_ids && $3::text[] OR m.memory_keywords && $4::text[] OR m.memory_important=true OR m.search_text ILIKE $5) ' +
          'ORDER BY m.memory_important DESC,m.turn_number DESC LIMIT 128',
        [gameId, beforeTurn, actorIds, searchTerms, searchTerms[0] ? '%' + searchTerms[0] + '%' : '']
      );
      const rows = result.rows
        .map(row => ({
          ...row,
          command_json: row.command_json ? asJson(row.command_json) : null,
          turn_record: row.turn_record ? asJson(row.turn_record) : null,
          turn_digest: row.turn_digest ? asJson(row.turn_digest) : null
        }))
        .filter(row => !recentTurnNumbers.includes(row.turn_number));
      const scored = rows.map(row => {
        const matchedActors = (row.actor_ids ?? []).filter(id => actorIds.includes(id)).length;
        const matchedTerms = (row.memory_keywords ?? []).filter(term => searchTerms.includes(String(term).toLocaleLowerCase('ko-KR'))).length;
        const termMatch = searchTerms.filter(term => (row.search_text ?? '').toLocaleLowerCase('ko-KR').includes(term)).length;
        return {
          ...row,
          score: matchedActors * 8 + matchedTerms * 4 + termMatch + (row.memory_important ? 6 : 0),
          turn_digest: row.turn_digest ? asJson(row.turn_digest) : null
        };
      }).sort((a, b) => b.score - a.score || Number(b.memory_important) - Number(a.memory_important) || b.turn_number - a.turn_number);
        const chosen = scored.slice(0, Math.min(12, limit)).sort((a, b) => a.turn_number - b.turn_number);
      const chosenNumbers = new Set(chosen.map(row => row.turn_number));
      const excluded = scored.filter(row => !chosenNumbers.has(row.turn_number)).map(row => ({ turn_number: row.turn_number, revision: row.source_revision, reason: 'lower_retrieval_score' }));
      if (result.rows.length === 128) excluded.push({ reason: 'candidate_query_limit_reached', candidate_limit: 128 });
      return Object.assign(chosen, { excluded_sources: excluded });
    },

    async readHistory(gameId, beforeTurn = 2147483647, limit = 20) {
      const pageLimit = Math.max(1, Math.min(100, limit));
      const result = await db.query(
        'SELECT DISTINCT ON (turn_number) turn_number,turn_revision,turn_record,created_at ' +
        'FROM company_r4_turns WHERE game_id=$1 AND turn_number<$2 ' +
        'ORDER BY turn_number DESC,turn_revision DESC LIMIT $3',
        [gameId, beforeTurn, pageLimit]
      );
      return result.rows.reverse().map(row => asJson(row.turn_record));
    },

    async commitTurn({ jobId, attemptNo, turnRecord, stateAfter, command, searchText, actorIds, keywords, important, digest }) {
      return db.transaction(async tx => {
        const jobResult = await tx.query('SELECT * FROM company_r4_jobs WHERE job_id=$1', [jobId]);
        const job = mapJob(jobResult.rows[0]);
        if (!job) throw new R4StoreError('job_not_found', 404);
        if (job.status === 'complete' && job.receipt) return job.receipt;
        if (job.status !== 'running' || job.attemptNo !== attemptNo) throw new R4StoreError('attempt_fenced', 409);
        const gameResult = await tx.query('SELECT state FROM company_r4_games WHERE game_id=$1', [job.gameId]);
        const currentState = asJson(gameResult.rows[0].state);
        if (currentState.state_revision !== job.expectedStateRevision) throw new R4StoreError('state_revision_conflict', 409);
        const turnNumber = turnRecord.turn_number;
        const turnRevision = turnRecord.turn_revision;
        await tx.query(
          'INSERT INTO company_r4_turns (game_id,turn_number,turn_revision,turn_record,command_json,state_before,state_after,story_text,narrative_body,turn_digest,actor_ids,memory_keywords,memory_important,search_text) ' +
          'VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9,$10::jsonb,$11::text[],$12::text[],$13,$14)',
          [job.gameId, turnNumber, turnRevision, JSON.stringify(turnRecord), JSON.stringify(command), JSON.stringify(turnRecord.state_before), JSON.stringify(stateAfter), turnRecord.story_text, turnRecord.narrative_body, digest ? JSON.stringify(digest) : null, actorIds, keywords, important, searchText]
        );
        await tx.query(
          'INSERT INTO company_r4_memory_index (game_id,turn_number,source_revision,turn_digest,actor_ids,memory_keywords,memory_important,search_text) ' +
          'VALUES ($1,$2,$3,$4::jsonb,$5::text[],$6::text[],$7,$8) ' +
          'ON CONFLICT (game_id,turn_number) DO UPDATE SET source_revision=EXCLUDED.source_revision,turn_digest=EXCLUDED.turn_digest,actor_ids=EXCLUDED.actor_ids,memory_keywords=EXCLUDED.memory_keywords,memory_important=EXCLUDED.memory_important,search_text=EXCLUDED.search_text',
          [job.gameId, turnNumber, turnRevision, digest ? JSON.stringify(digest) : null, actorIds, keywords, important, searchText]
        );
        const receipt = {
          game_id: job.gameId,
          state_revision: stateAfter.state_revision,
          committed_turn: stateAfter.committed_turn,
          turn_number: turnNumber,
          turn_revision: turnRevision,
          command_id: command.command_id,
          command_hash: turnRecord.command_hash,
          projection_status: stateAfter.projection_meta.status
        };
        await tx.query(
          'UPDATE company_r4_games SET state=$2::jsonb,status=\'ready\',updated_at=now() WHERE game_id=$1',
          [job.gameId, JSON.stringify(stateAfter)]
        );
        const update = await tx.query(
          'UPDATE company_r4_jobs SET status=\'complete\',stage=\'committed\',receipt=$3::jsonb,updated_at=now() WHERE job_id=$1 AND attempt_no=$2 AND status=\'running\' RETURNING job_id',
          [jobId, attemptNo, JSON.stringify(receipt)]
        );
        if (!update.rows.length) throw new R4StoreError('attempt_fenced', 409);
        return receipt;
      });
    },

    async startModelCall({ callId, gameId, commandId, stage, model }) {
      return db.transaction(async tx => {
        const count = await tx.query('SELECT count(*)::int AS total FROM company_r4_model_calls');
        if (count.rows[0].total >= liveCallBudget) throw new R4StoreError('live_model_call_budget_exhausted', 429);
        await tx.query(
          'INSERT INTO company_r4_model_calls (call_id,game_id,command_id,stage,model,status) VALUES ($1,$2,$3,$4,$5,\'started\')',
          [callId, gameId, commandId, stage, model]
        );
        return callId;
      });
    },

    async finishModelCall(callId, { status, finishReason = null, errorCode = null, inputTokens = null, outputTokens = null }) {
      await db.query(
        'UPDATE company_r4_model_calls SET status=$2,finish_reason=$3,error_code=$4,input_tokens=$5,output_tokens=$6,finished_at=now() WHERE call_id=$1',
        [callId, status, finishReason, errorCode, inputTokens, outputTokens]
      );
    },

    async readUsage() {
      const result = await db.query(
        'SELECT count(*)::int AS total, count(*) FILTER (WHERE stage=\'story\')::int AS story, count(*) FILTER (WHERE stage=\'observer\')::int AS observer ' +
        'FROM company_r4_model_calls'
      );
      return { ...result.rows[0], budget: liveCallBudget, remaining: Math.max(0, liveCallBudget - result.rows[0].total) };
    },

    async close() { await db.close(); }
  };
  return store;
}
