import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { createR3Worker } from '../runtime-r3/server/worker.js';
import { InMemoryR3Store } from '../runtime-r3/server/store.js';

const content = loadCanonicalCompanyR3Content();
const GAME_ACCESS_SECRET = 'r3-test-secret';
const profile = {
  name: 'R3 Feedback Player', department_id: content.departments[0].department_id, position_id: content.positions[0].position_id,
  age: 28, height_cm: 178, weight_kg: 72, penis_length_cm: 16,
  body_type_id: content.bodyTypes[0].body_type_id, speech_style_id: content.speechStyles[0].speech_style_id
};
const choices = Object.freeze(['1. 주변을 차분히 살핀다.', '2. 가까운 동료에게 말을 건다.', '3. 현재 장면을 다시 확인한다.', '4. 원하는 행동을 직접 입력한다.']);

async function request(worker, path, { method = 'GET', body } = {}) {
  const gameId = path.match(/^\/api\/r3\/games\/([^/]+)/)?.[1];
  const capability = gameId ? worker.gameCapabilities?.get(gameId) : null;
  const headers = body ? { 'content-type': 'application/json' } : {};
  if (capability) headers.authorization = `Bearer ${capability}`;
  return worker.fetch(new Request(`https://r3.test${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined }));
}

async function events(response) {
  const text = await response.text();
  return [...text.matchAll(/event: ([^\n]+)\ndata: ([^\n]+)/g)].map(match => ({ event: match[1], data: JSON.parse(match[2]) }));
}

async function setupGame(worker) {
  const response = await request(worker, '/api/r3/games', { method: 'POST', body: { profile } });
  const payload = await response.json(); const gameId = payload.data.game.game_id;
  worker.gameCapabilities ??= new Map(); worker.gameCapabilities.set(gameId, payload.data.game_capability);
  return gameId;
}

function deterministicRevisionProvider(calls, { failFeedback = false } = {}) {
  return {
    async *story(args) {
      calls.story.push(args);
      if (args.opening) { yield `Opening\n${choices.join('\n')}`; return; }
      if (args.feedbackText && failFeedback) throw new Error('feedback_story_failed');
      yield `${args.feedbackText ? 'Revised' : 'Ordinary'} Story for ${args.literalAction}\n${choices.join('\n')}`;
    },
    async observe(args) {
      calls.observe.push(args);
      return { choices: [...choices], turn_summary: 'bounded summary', mind_monitor: {} };
    }
  };
}

async function committedOrdinaryTurn(worker) {
  const gameId = await setupGame(worker);
  assert.equal((await events(await request(worker, `/api/r3/games/${gameId}/opening`, { method: 'POST' }))).at(-1).data.status, 'committed');
  const literal = '한국어 원문 이동과 대화를 그대로 보존한다.';
  assert.equal((await events(await request(worker, `/api/r3/games/${gameId}/turn`, { method: 'POST', body: { action_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', expected_turn: 1, literal_action: literal } }))).at(-1).data.status, 'committed');
  return { gameId, literal };
}

test('R3 feedback revises one logical turn from exact pre-turn state and is idempotent', async () => {
  const calls = { story: [], observe: [] }; const store = new InMemoryR3Store();
  const worker = createR3Worker({ store, provider: deterministicRevisionProvider(calls), content, gameAccessSecret: GAME_ACCESS_SECRET });
  const { gameId, literal } = await committedOrdinaryTurn(worker);
  const before = store.context(gameId); const prior = store.revisionHistory.get(`${gameId}:1:1`);
  const requestId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const feedback = await events(await request(worker, `/api/r3/games/${gameId}/feedback`, { method: 'POST', body: { revision_request_id: requestId, expected_turn: 1, expected_state_revision: 1, feedback_text: '장면의 동료 반응을 더 자연스럽게 수정해 주세요.' } }));
  const terminal = feedback.at(-1).data;
  assert.equal(terminal.status, 'committed');
  assert.equal(feedback.filter(event => event.event === 'story_delta').length > 0, true);
  assert.equal(calls.story.filter(args => args.feedbackText).length, 1);
  assert.equal(calls.observe.length, 3);
  assert.equal(terminal.context.state.committed_turn, before.state.committed_turn);
  assert.equal(terminal.context.state.revision, before.state.revision + 1);
  assert.equal(terminal.context.turns.length, before.turns.length);
  assert.equal(terminal.context.turns.at(-1).revision, 2);
  assert.equal(terminal.context.turns.at(-1).literal_action, literal);
  assert.match(terminal.context.turns.at(-1).story_text, /^Revised Story/);
  assert.deepEqual(store.revisionHistory.get(`${gameId}:1:2`).state_before, prior.state_before);
  assert.equal(store.revisionHistory.get(`${gameId}:1:2`).supersedes_revision_id, prior.revision_id);
  assert.equal(store.feedbackAttempts.get(`${gameId}:${requestId}`).status, 'committed');

  const replay = await events(await request(worker, `/api/r3/games/${gameId}/feedback`, { method: 'POST', body: { revision_request_id: requestId, expected_turn: 1, expected_state_revision: 1, feedback_text: '다른 요청은 무시되어야 한다.' } }));
  assert.equal(replay.at(-1).data.status, 'committed');
  assert.equal(calls.story.filter(args => args.feedbackText).length, 1);
  assert.equal((await (await request(worker, `/api/r3/games/${gameId}/context`)).json()).data.turns.at(-1).revision, 2);
});

test('R3 repeated feedback keeps the original pre-turn state boundary through revision 3', async () => {
  const calls = { story: [], observe: [] }; const store = new InMemoryR3Store();
  const worker = createR3Worker({ store, provider: deterministicRevisionProvider(calls), content, gameAccessSecret: GAME_ACCESS_SECRET });
  const { gameId, literal } = await committedOrdinaryTurn(worker);
  const original = store.revisionHistory.get(`${gameId}:1:1`);
  const first = await events(await request(worker, `/api/r3/games/${gameId}/feedback`, { method: 'POST', body: { revision_request_id: 'abababab-abab-4aba-8aba-abababababab', expected_turn: 1, expected_state_revision: 1, feedback_text: '첫 번째 수정' } }));
  assert.equal(first.at(-1).data.status, 'committed');
  const second = await events(await request(worker, `/api/r3/games/${gameId}/feedback`, { method: 'POST', body: { revision_request_id: 'acacacac-acac-4aca-8aca-acacacacacac', expected_turn: 1, expected_state_revision: 2, feedback_text: '두 번째 수정' } }));
  assert.equal(second.at(-1).data.status, 'committed');
  const revisions = [1, 2, 3].map(revision => store.revisionHistory.get(`${gameId}:1:${revision}`));
  assert.deepEqual(revisions.map(item => item.revision), [1, 2, 3]);
  assert.deepEqual(revisions.map(item => item.state_before), [original.state_before, original.state_before, original.state_before]);
  assert.deepEqual(revisions.map(item => item.state_revision_before), [0, 0, 0]);
  assert.deepEqual(revisions.map(item => item.state_revision_after), [1, 2, 3]);
  assert.equal(store.context(gameId).state.committed_turn, 1);
  assert.equal(store.context(gameId).state.revision, 3);
  assert.equal(store.context(gameId).turns.filter(item => item.turn_number === 1).length, 1);
  assert.equal(store.context(gameId).turns.at(-1).revision, 3);
  assert.equal(store.context(gameId).turns.at(-1).literal_action, literal);
  assert.equal(calls.story.filter(args => args.feedbackText).length, 2);
  assert.equal(calls.observe.filter(args => args.literalAction === literal).length, 3);
});

test('R3 feedback rejects stale or later-sidecar fences before provider work', async () => {
  const calls = { story: [], observe: [] }; const store = new InMemoryR3Store();
  const worker = createR3Worker({ store, provider: deterministicRevisionProvider(calls), content, gameAccessSecret: GAME_ACCESS_SECRET });
  const { gameId } = await committedOrdinaryTurn(worker);
  store.applyCsa({ gameId, expectedRevision: 1, stateAfter: store.context(gameId).state.state, operations: [] });
  const failed = await events(await request(worker, `/api/r3/games/${gameId}/feedback`, { method: 'POST', body: { revision_request_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', expected_turn: 1, expected_state_revision: 1, feedback_text: '오래된 상태' } }));
  assert.equal(failed.at(-1).data.status, 'failed');
  assert.equal(calls.story.filter(args => args.feedbackText).length, 0);
  assert.equal(store.context(gameId).state.revision, 2);
  assert.equal(store.context(gameId).turns.at(-1).revision, 1);

  const blockedStore = new InMemoryR3Store(); const blockedCalls = { story: [], observe: [] };
  const blockedWorker = createR3Worker({ store: blockedStore, provider: deterministicRevisionProvider(blockedCalls), content, gameAccessSecret: GAME_ACCESS_SECRET });
  const blocked = await committedOrdinaryTurn(blockedWorker);
  const nextJob = blockedStore.reserveTurn({ gameId: blocked.gameId, turnNumber: 2, actionId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', literalAction: '다음 행동' });
  const nextBlocked = await events(await request(blockedWorker, `/api/r3/games/${blocked.gameId}/feedback`, { method: 'POST', body: { revision_request_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', expected_turn: 1, expected_state_revision: 1, feedback_text: '다음 턴이 잠겼다.' } }));
  assert.equal(nextBlocked.at(-1).data.status, 'failed');
  assert.equal(blockedCalls.story.filter(args => args.feedbackText).length, 0);
  blockedStore.failJob({ gameId: blocked.gameId, turnNumber: 2, attempt: { actionId: nextJob.job.action_id, attemptNo: nextJob.job.attempt_no }, errorCode: 'next_failed' });
  const failedNext = await events(await request(blockedWorker, `/api/r3/games/${blocked.gameId}/feedback`, { method: 'POST', body: { revision_request_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeef', expected_turn: 1, expected_state_revision: 1, feedback_text: '실패한 다음 턴도 잠겼다.' } }));
  assert.equal(failedNext.at(-1).data.status, 'failed');
  assert.equal(blockedCalls.story.filter(args => args.feedbackText).length, 0);
});

test('R3 feedback Story failure keeps the existing projection and only fails the attempt', async () => {
  const calls = { story: [], observe: [] }; const store = new InMemoryR3Store();
  const worker = createR3Worker({ store, provider: deterministicRevisionProvider(calls, { failFeedback: true }), content, gameAccessSecret: GAME_ACCESS_SECRET });
  const { gameId } = await committedOrdinaryTurn(worker); const before = store.context(gameId);
  const result = await events(await request(worker, `/api/r3/games/${gameId}/feedback`, { method: 'POST', body: { revision_request_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', expected_turn: 1, expected_state_revision: 1, feedback_text: '실패해도 기존 결과를 유지한다.' } }));
  assert.equal(result.at(-1).data.status, 'failed');
  const after = store.context(gameId);
  assert.deepEqual(after.state, before.state);
  assert.deepEqual(after.turns, before.turns);
  assert.equal(calls.observe.filter(args => args.literalAction === before.turns.at(-1).literal_action).length, 1);
  assert.equal(store.feedbackAttempts.get(`${gameId}:ffffffff-ffff-4fff-8fff-ffffffffffff`).status, 'failed');
});

test('R3 feedback Observer failure remains fail-open and commits the revised Story', async () => {
  const calls = { story: [], observe: [] };
  const base = deterministicRevisionProvider(calls);
  const provider = {
    story: base.story,
    async observe(args) {
      calls.observe.push(args);
      if (args.storyText.startsWith('Revised Story')) throw new Error('private observer failure');
      return { choices: [...choices], turn_summary: 'bounded summary', mind_monitor: {} };
    }
  };
  const store = new InMemoryR3Store();
  const worker = createR3Worker({ store, provider, content, gameAccessSecret: GAME_ACCESS_SECRET });
  const { gameId } = await committedOrdinaryTurn(worker);
  const result = await events(await request(worker, `/api/r3/games/${gameId}/feedback`, { method: 'POST', body: { revision_request_id: '56565656-5656-4565-8565-565656565656', expected_turn: 1, expected_state_revision: 1, feedback_text: '관찰 실패여도 Story를 저장해 주세요.' } }));
  const terminal = result.at(-1).data;
  assert.equal(terminal.status, 'committed');
  assert.equal(terminal.context.turns.at(-1).revision, 2);
  assert.ok(terminal.context.turns.at(-1).warnings.includes('observer_failed'));
  assert.ok(terminal.context.turns.at(-1).warnings.includes('r3_observer_unknown'));
  assert.equal(store.feedbackAttempts.get(`${gameId}:56565656-5656-4565-8565-565656565656`).status, 'committed');
});

test('R3 feedback commit fence failure keeps the existing projection and state', async () => {
  const calls = { story: [], observe: [] };
  class FenceStore extends InMemoryR3Store {
    commitFeedbackRevision() { throw new Error('r3_feedback_revision_conflict'); }
  }
  const store = new FenceStore(); const worker = createR3Worker({ store, provider: deterministicRevisionProvider(calls), content, gameAccessSecret: GAME_ACCESS_SECRET });
  const { gameId } = await committedOrdinaryTurn(worker); const before = store.context(gameId);
  const result = await events(await request(worker, `/api/r3/games/${gameId}/feedback`, { method: 'POST', body: { revision_request_id: '12121212-1212-4121-8121-121212121212', expected_turn: 1, expected_state_revision: 1, feedback_text: 'commit fence' } }));
  assert.equal(result.at(-1).data.status, 'failed');
  assert.deepEqual(store.context(gameId).state, before.state);
  assert.deepEqual(store.context(gameId).turns, before.turns);
  assert.equal(store.feedbackAttempts.get(`${gameId}:12121212-1212-4121-8121-121212121212`).status, 'failed');
});

test('R3 feedback source exposes the narrow migration, endpoint, and existing-modal wiring', async () => {
  const [migration, worker, client, app] = await Promise.all([
    readFile(new URL('../supabase/migrations/20260822000300_company_r3_feedback_revision.sql', import.meta.url), 'utf8'),
    readFile(new URL('../runtime-r3/server/worker.js', import.meta.url), 'utf8'),
    readFile(new URL('../frontend-r3/r3-client.js', import.meta.url), 'utf8'),
    readFile(new URL('../frontend-r3/app.js', import.meta.url), 'utf8')
  ]);
  assert.match(migration, /company_r3_turn_revision_history/);
  assert.match(migration, /company_r3_feedback_attempts/);
  assert.match(migration, /company_r3_begin_feedback_revision/);
  assert.match(migration, /company_r3_commit_feedback_revision/);
  assert.match(migration, /company_r3_fail_feedback_revision/);
  assert.match(migration, /grant execute on function public\.company_r3_begin_feedback_revision[\s\S]*to service_role/);
  const feedbackCommit = migration.match(/create or replace function public\.company_r3_commit_feedback_revision[\s\S]*?\n\$\$;/i)?.[0] ?? '';
  assert.match(feedbackCommit, /v_job public\.company_r3_turn_jobs%rowtype/);
  assert.match(feedbackCommit, /v_history\.state_revision_before, v_next_state_revision/);
  assert.match(worker, /context\|opening\|turn\|csa\|feedback/);
  assert.match(worker, /provider\.story\(\{ context: before, content, literalAction, feedbackText/);
  assert.match(client, /feedback\(gameId, payload\)/);
  assert.match(app, /feedbackBusy/);
  assert.match(app, /feedback-preview/);
  assert.match(app, /client\.feedback/);
  assert.match(app, /feedbackSubmit\.disabled = state\.feedbackBusy/);
  assert.match(app, /if \(state\.feedbackBusy \|\| state\.busy/);
  assert.match(app, /if \(data\.context\) renderContext\(data\.context\)/);
});
