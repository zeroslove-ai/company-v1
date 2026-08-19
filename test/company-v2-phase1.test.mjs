import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContentAdapter } from '../runtime-v2/domain/content.js';
import { createV2Worker as createWorker, createProductionV2Worker } from '../runtime-v2/server/worker.js';
import { InMemoryV2Store, createInMemoryPersistence } from '../runtime-v2/server/store.js';
import { SupabaseV2Store } from '../runtime-v2/server/supabase-store.js';
import { createV2Provider } from '../runtime-v2/server/provider.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = createContentAdapter();

function createV2Worker(options = {}) {
  return createWorker({ content, store: new InMemoryV2Store({ content }), provider: providerFor(), ...options });
}

function providerFor({ story, observe, delay = 0 } = {}) {
  return {
    async *story(input) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      yield typeof story === 'function' ? story(input) : story ?? `[NARRATIVE]\n그대로 저장: ${input.literalAction}\n\n[DIALOGUE id="heroine1"]\n확인했습니다.\n\n[CHOICE]\n하나\n[CHOICE]\n둘\n[CHOICE]\n셋\n[CHOICE]\n넷\n[/CHOICE]`;
    },
    async observe(input) { return observe ? observe(input) : { elapsed_minutes: 3, turn_summary: '', mind_monitor: { heroine1: { surface: '관련 상태', subconscious: '관련 생각' }, heroine2: { surface: '무관', subconscious: '무관' } } }; }
  };
}

async function game(worker) {
  const setup = await worker.fetch(new Request('https://v2.test/api/v2/setup', { method: 'POST', body: JSON.stringify({ player_name: '민수' }) }));
  const setupData = (await setup.json()).data;
  const opening = await worker.fetch(new Request('https://v2.test/api/v2/opening', { method: 'POST', body: JSON.stringify({ game_id: setupData.game.game_id }) }));
  return { gameId: setupData.game.game_id, opening: (await opening.json()).data };
}

async function turn(worker, gameId, literalAction, providerActionId = crypto.randomUUID()) {
  const options = arguments[4] ?? {};
  return worker.fetch(new Request('https://v2.test/api/v2/turn', { method: 'POST', body: JSON.stringify({ game_id: gameId, action_id: providerActionId, expected_turn: options.expectedTurn ?? 1, retry_failed: options.retryFailed === true, literal_action: literalAction }) }));
}

test('v2 trees are physically isolated from old gameplay modules', async () => {
  const forbidden = /src[\\/]engine|runtime-core|\/api\/(?:story|extract|commit)|step\s*[:=]\s*["'](?:story|extract|commit)/i;
  const files = [];
  async function visit(dir) { for (const entry of await fs.readdir(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) await visit(full); else files.push(full); } }
  await visit(path.join(root, 'runtime-v2')); await visit(path.join(root, 'frontend-v2'));
  for (const file of files) assert.equal(forbidden.test(await fs.readFile(file, 'utf8')), false, file);
});

test('v2 persistence source is additive, isolated, and one-boundary', async () => {
  const migration = await fs.readFile(path.join(root, 'supabase/migrations/20260819000200_company_v2_phase1_vertical_slice.sql'), 'utf8');
  for (const table of ['company_v2_games', 'company_v2_state', 'company_v2_turn_jobs', 'company_v2_turns']) assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
  assert.match(migration, /company_v2_commit_turn/); assert.match(migration, /set search_path = public, pg_temp/);
  assert.doesNotMatch(migration, /game_actions|game_save|game_turns|apply_reserved_csa_transaction/);
});

test('frontend-v2 submits only literal input to the single v2 turn endpoint', async () => {
  const frontend = await fs.readFile(path.join(root, 'frontend-v2/app.js'), 'utf8');
  assert.match(frontend, /\/api\/v2\/turn/); assert.doesNotMatch(frontend, /\/api\/(?:story|extract|commit)/);
  assert.doesNotMatch(frontend, /step\s*[:=]\s*["'](?:story|extract|commit)/i); assert.match(frontend, /literal_action/); assert.match(frontend, /retry_failed/);
});

test('production Worker selects DB store and real provider, with no silent test fallback', () => {
  const env = { SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_ROLE_KEY: 'service-key', LLM_API_URL: 'https://provider.example', LLM_API_KEY: 'llm-key', STORY_MODEL: 'configured-model' };
  const worker = createProductionV2Worker({ env, fetchImpl: async () => { throw new Error('network not expected'); } });
  assert.equal(worker.store instanceof SupabaseV2Store, true); assert.equal(worker.provider.kind, 'v2-llm-provider');
  assert.throws(() => createProductionV2Worker({ env: {} }), /SUPABASE_URL/);
});

test('default Worker fails clearly without production configuration', async () => {
  const response = await (await import('../runtime-v2/server/worker.js')).default.fetch(new Request('https://v2.test/api/v2/context?game_id=missing'), {});
  assert.equal(response.status, 500); assert.equal((await response.json()).error.code, 'configuration_error');
});

test('real provider constructs one literal Story request and one typed observation request', async () => {
  const requests = [];
  const fetchImpl = async (_url, options) => {
    const payload = JSON.parse(options.body); requests.push(payload);
    if (payload.stream) return new Response('data: {"choices":[{"delta":{"content":"[NARRATIVE]\\nhello\\n\\n[CHOICE]\\none\\n[CHOICE]\\ntwo\\n[CHOICE]\\nthree\\n[CHOICE]\\nfour\\n[/CHOICE]"}}]}\n\ndata: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } });
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"elapsed_minutes":3,"scene":{"entered":[],"exited":[]},"turn_summary":"ok","mind_monitor":{}}' } }] }), { headers: { 'content-type': 'application/json' } });
  };
  const provider = createV2Provider({ env: { LLM_API_URL: 'https://provider.example', LLM_API_KEY: 'key', STORY_MODEL: 'configured-model' }, fetchImpl, content });
  const story = []; for await (const chunk of provider.story({ literalAction: 'literal 한국어', context: { state: { state: { time: { day: 1, minute: 540 }, scene: { location_id: 'lobby', present_npc_ids: [] } } }, turns: [] } })) story.push(chunk);
  await provider.observe({ literalAction: 'literal 한국어', storyText: story.join(''), context: { state: { state: {} } } });
  assert.equal(requests.length, 2); assert.equal(requests[0].stream, true); assert.match(requests[0].messages[1].content, /literal 한국어/); assert.equal(requests[1].stream, false); assert.match(requests[1].messages[0].content, /typed Company v2 observer/); assert.doesNotMatch(requests[1].messages[0].content, /(?:game_actions|save_path)/);
});

test('reconstructed Worker/store reads the same durable-test-double progress and job', async () => {
  let release; let released = false;
  const provider = { async *story() { yield '[NARRATIVE]\nprogress'; await new Promise((resolve) => { release = () => { released = true; resolve(); }; }); yield '\n\n[DIALOGUE id="heroine1"]\nend\n\n[CHOICE]\n1\n[CHOICE]\n2\n[CHOICE]\n3\n[CHOICE]\n4\n[/CHOICE]'; }, async observe() { return { turn_summary: 'done' }; } };
  const persistence = createInMemoryPersistence(); const worker1 = createWorker({ content, store: new InMemoryV2Store({ content, persistence }), provider }); const { gameId } = await game(worker1); const first = await turn(worker1, gameId, 'durable progress');
  for (let i = 0; i < 20 && !release; i++) await new Promise((resolve) => setTimeout(resolve, 2));
  const worker2 = createWorker({ content, store: new InMemoryV2Store({ content, persistence }), provider }); const context = (await (await worker2.fetch(new Request(`https://v2.test/api/v2/context?game_id=${gameId}`))).json()).data;
  assert.equal(context.job.status, 'processing'); assert.match(context.job.story_text, /progress/); release(); released = true; await first.text(); assert.equal(worker2.store.context(gameId).state.committed_turn, 1);
});

test('explicit failed-turn retry reopens one canonical row and increments attempt', async () => {
  let calls = 0; const provider = { async *story() { calls += 1; if (calls === 1) throw new Error('first_story_failed'); yield '[NARRATIVE]\nretry works\n\n[DIALOGUE id="heroine1"]\nok\n\n[CHOICE]\n1\n[CHOICE]\n2\n[CHOICE]\n3\n[CHOICE]\n4\n[/CHOICE]'; }, async observe() { return { turn_summary: 'retry' }; } };
  const worker = createV2Worker({ provider }); const { gameId } = await game(worker); await (await turn(worker, gameId, 'first attempt')).text(); assert.equal(worker.store.getJob(gameId, 1).status, 'failed');
  const retry = await turn(worker, gameId, 'explicit second attempt', crypto.randomUUID(), { retryFailed: true }); const text = await retry.text(); const job = worker.store.getJob(gameId, 1);
  assert.match(text, /"status":"committed"/); assert.equal(job.attempt_no, 2); assert.equal(job.literal_action, 'explicit second attempt'); assert.equal(worker.store.turns.size, 2);
});

test('simultaneous explicit retries resolve to one processing attempt and reject replacement after commit', async () => {
  let calls = 0; const provider = { async *story() { calls += 1; if (calls === 1) throw new Error('fail once'); await new Promise((resolve) => setTimeout(resolve, 15)); yield '[NARRATIVE]\nretry\n\n[DIALOGUE id="heroine1"]\nok\n\n[CHOICE]\n1\n[CHOICE]\n2\n[CHOICE]\n3\n[CHOICE]\n4\n[/CHOICE]'; }, async observe() { return { turn_summary: 'retry' }; } };
  const worker = createV2Worker({ provider }); const { gameId } = await game(worker); await (await turn(worker, gameId, 'failed')).text();
  const first = await turn(worker, gameId, 'retry one', crypto.randomUUID(), { retryFailed: true }); const second = await turn(worker, gameId, 'retry two', crypto.randomUUID(), { retryFailed: true });
  const secondData = await second.json(); assert.equal(secondData.data.reconnect, true); assert.equal(secondData.data.job.status, 'processing'); await first.text();
  const job = worker.store.getJob(gameId, 1); assert.equal(job.attempt_no, 2); assert.equal(job.literal_action, 'retry one'); assert.equal(calls, 2);
  const committedReplacement = await turn(worker, gameId, 'cannot replace committed'); assert.equal((await committedReplacement.json()).data.reconnect, true); assert.equal(worker.store.getJob(gameId, 1).literal_action, 'retry one');
});

test('fixture opening is playable and stores exactly four literal choices', async () => {
  const worker = createV2Worker({ content });
  const { opening } = await game(worker);
  assert.equal(opening.state.committed_turn, 0);
  assert.equal(opening.turns[0].choices.length, 4);
  assert.ok(opening.turns[0].choices.every((choice) => choice.length > 0));
});

test('one client submission reaches one server-owned turn operation', async () => {
  const worker = createV2Worker({ content }); const { gameId } = await game(worker);
  const response = await turn(worker, gameId, '정확히 이 문장을 서버에 보낸다.');
  assert.match(response.headers.get('content-type'), /text\/event-stream/);
  const text = await response.text();
  assert.match(text, /event: story_delta/); assert.match(text, /"status":"committed"/);
  assert.equal(worker.store.jobs.size, 1);
  assert.equal(worker.store.turns.size, 2);
});

test('literal input reaches Story and committed history unchanged', async () => {
  const literal = '한국어 그대로: "회의실로 이동해 주세요."';
  let seen;
  const worker = createV2Worker({ content, provider: providerFor({ story: ({ literalAction }) => { seen = literalAction; return `[NARRATIVE]\n${literalAction}\n\n[DIALOGUE id="heroine1"]\n알겠습니다.\n\n[CHOICE]\n1\n[CHOICE]\n2\n[CHOICE]\n3\n[CHOICE]\n4\n[/CHOICE]`; } }) });
  const { gameId } = await game(worker); await (await turn(worker, gameId, literal)).text();
  assert.equal(seen, literal); assert.equal(worker.store.turns.get(`${gameId}:1`).literal_action, literal);
});

test('Story deltas are observable before terminal commit', async () => {
  const worker = createV2Worker({ content, provider: providerFor({ delay: 15 }) }); const { gameId } = await game(worker);
  const text = await (await turn(worker, gameId, '먼저 이야기를 스트리밍한다.')).text();
  assert.ok(text.indexOf('event: story_delta') < text.indexOf('event: terminal'));
});

test('concurrent same-turn requests reconnect to one processing job', async () => {
  const worker = createV2Worker({ content, provider: providerFor({ delay: 30 }) }); const { gameId } = await game(worker);
  const action = { game_id: gameId, action_id: crypto.randomUUID(), expected_turn: 1, literal_action: '동시에 한 번만 처리한다.' };
  const first = await worker.fetch(new Request('https://v2.test/api/v2/turn', { method: 'POST', body: JSON.stringify(action) }));
  const second = await worker.fetch(new Request('https://v2.test/api/v2/turn', { method: 'POST', body: JSON.stringify({ ...action, action_id: crypto.randomUUID() }) }));
  const secondData = (await second.json()).data;
  assert.equal(secondData.reconnect, true); assert.equal(secondData.job.status, 'processing'); assert.equal(worker.store.jobs.size, 1);
  await first.text(); assert.equal(worker.store.turns.size, 2);
});

test('reconnect observes the same in-flight job and committed readback', async () => {
  const worker = createV2Worker({ content, provider: providerFor({ delay: 20 }) }); const { gameId } = await game(worker);
  const first = await turn(worker, gameId, '재연결 가능한 작업.');
  const reconnect = await worker.fetch(new Request(`https://v2.test/api/v2/context?game_id=${gameId}`));
  assert.equal((await reconnect.json()).data.job.status, 'processing'); await first.text();
  const readback = await worker.fetch(new Request(`https://v2.test/api/v2/context?game_id=${gameId}`));
  assert.equal((await readback.json()).data.state.committed_turn, 1);
});

test('Story failure terminalizes without automatic retry', async () => {
  const provider = { async *story() { throw new Error('story_failed'); }, async observe() { throw new Error('must_not_observe'); } };
  const worker = createV2Worker({ content, provider }); const { gameId } = await game(worker); const response = await turn(worker, gameId, '실패를 한 번 기록한다.');
  const text = await response.text(); const job = worker.store.getJob(gameId, 1);
  assert.match(text, /"status":"failed"/); assert.equal(job.status, 'failed'); assert.equal(worker.store.turns.size, 1); assert.equal(job.attempt_no, 1);
});

test('optional observation failure still commits valid Story with safe state', async () => {
  const worker = createV2Worker({ content, provider: providerFor({ observe: async () => { throw new Error('observation_unavailable'); } }) }); const { gameId } = await game(worker);
  await (await turn(worker, gameId, '관찰 실패여도 이야기는 저장한다.')).text(); const context = worker.store.context(gameId);
  assert.equal(context.state.committed_turn, 1); assert.equal(context.turns[1].mind_monitor && Object.keys(context.turns[1].mind_monitor).length, 0); assert.ok(context.turns[1].turn_summary);
});

test('non-empty Story always gets provider or bounded fallback summary', async () => {
  const worker = createV2Worker({ content, provider: providerFor({ observe: async () => ({ turn_summary: '' }) }) }); const { gameId } = await game(worker);
  await (await turn(worker, gameId, '요약 fallback을 확인한다.')).text(); const committed = worker.store.turns.get(`${gameId}:1`);
  assert.ok(committed.story_text); assert.ok(committed.turn_summary); assert.ok(committed.turn_summary.length <= 500);
});

test('Mind Monitor targets relevant dialogue actors only and fails open', async () => {
  const worker = createV2Worker({ content, provider: providerFor() }); const { gameId } = await game(worker); await (await turn(worker, gameId, '관련 인물만 기록한다.')).text();
  assert.deepEqual(Object.keys(worker.store.turns.get(`${gameId}:1`).mind_monitor), ['heroine1']);
});

test('player identity cannot be interpreted as an NPC observation', async () => {
  const worker = createV2Worker({ content, provider: providerFor({ observe: async ({ storyText }) => ({ scene: { entered: [{ actor_id: 'player-1', quote: storyText }] }, turn_summary: 'identity' }) }) }); const { gameId } = await game(worker);
  await (await turn(worker, gameId, '플레이어는 NPC가 아니다.')).text(); assert.deepEqual(worker.store.context(gameId).state.state.scene.present_npc_ids, []);
});

test('malformed OOC and protocol garbage are absent from canonical display blocks', async () => {
  const badStory = '[NARRATIVE]\n정상 장면.\n[ooc]retry[/ooc]\nDIALOGUE speaker_id=heroine2\n\n[CHOICE]\n1\n[CHOICE]\n2\n[CHOICE]\n3\n[CHOICE]\n4\n[/CHOICE]';
  const worker = createV2Worker({ content, provider: providerFor({ story: () => badStory }) }); const { gameId } = await game(worker); await (await turn(worker, gameId, '프로토콜 쓰레기는 화면에 남지 않는다.')).text();
  const blocks = worker.store.turns.get(`${gameId}:1`).parsed_blocks; assert.equal(blocks.some((block) => /ooc|DIALOGUE\s+speaker_id/i.test(block.text)), false);
});

test('committed state remains minimal and excludes deferred phase fields', async () => {
  const worker = createV2Worker({ content }); const { gameId } = await game(worker); await (await turn(worker, gameId, '작은 상태만 저장한다.')).text();
  const state = worker.store.context(gameId).state.state; assert.deepEqual(Object.keys(state).sort(), ['player', 'scene', 'time']);
});

test('expected turn and literal action are validated without replacement actions', async () => {
  const worker = createV2Worker({ content }); const { gameId } = await game(worker);
  const before = await worker.fetch(new Request('https://v2.test/api/v2/turn', { method: 'POST', body: JSON.stringify({ game_id: gameId, action_id: crypto.randomUUID(), expected_turn: 2, literal_action: '아직 오지 않은 턴' }) }));
  assert.equal(before.status, 422);
  const valid = await turn(worker, gameId, '한 번만 제출한다.'); await valid.text();
  const duplicate = await turn(worker, gameId, '대체 행동은 만들지 않는다.');
  assert.equal((await duplicate.json()).data.reconnect, true);
});

test('refresh context returns committed history and the same game identity', async () => {
  const worker = createV2Worker({ content }); const { gameId } = await game(worker); await (await turn(worker, gameId, '새로고침 후에도 기록한다.')).text();
  const context = (await (await worker.fetch(new Request(`https://v2.test/api/v2/context?game_id=${gameId}`))).json()).data;
  assert.equal(context.game.game_id, gameId); assert.equal(context.turns.length, 2); assert.equal(context.turns[1].literal_action, '새로고침 후에도 기록한다.');
});
