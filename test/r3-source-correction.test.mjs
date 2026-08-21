import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { loadWorkerCanonicalContent } from '../runtime-r3/domain/worker-content.js';
import { buildStoryContext } from '../runtime-r3/domain/memory.js';
import { buildOpeningContext } from '../runtime-r3/domain/story.js';
import { createInitialState } from '../runtime-r3/domain/contracts.js';
import { SupabaseR3Store } from '../runtime-r3/server/supabase-store.js';

const content = loadCanonicalCompanyR3Content();

test('R3 Story context carries canonical product, location, heroine cards, and general-NPC facts', () => {
  const heroine = Object.values(content.characters)[0];
  const locationId = heroine.default_location_id;
  const location = content.locations.find(item => item.location_id === locationId);
  const npcId = location.default_npc_ids[0];
  const profile = { name: 'R3 Player', department_id: content.departments[0].department_id };
  const state = createInitialState(profile, locationId, [heroine.character_id, npcId]);
  state.scene.scene_note = '현재 장면의 최소 연속성 메모';
  const context = { state: { state }, turns: [] };
  const opening = buildOpeningContext(context, content);
  const turn = buildStoryContext(context, '한국어 원문 행동', { content });
  assert.equal(opening.opening, true);
  assert.equal(turn.literal_action, '한국어 원문 행동');
  assert.equal(turn.product.title, content.edition.title);
  assert.match(turn.product.private_discovery, /NPC/);
  assert.equal(turn.location.name, location.name);
  assert.equal(turn.location.description, location.description);
  assert.equal(turn.scene.scene_note, '현재 장면의 최소 연속성 메모');
  assert.ok(turn.actors.some(actor => actor.id === heroine.character_id && actor.prompt_card.personality));
  assert.ok(turn.actors.some(actor => actor.id === npcId && actor.role && actor.age));
});

test('Worker content is a bundled canonical JSON path and production wiring selects async Supabase store', async () => {
  const workerContent = loadWorkerCanonicalContent();
  assert.equal(workerContent.edition.edition_id, 'company-v1');
  assert.equal(workerContent.locations.length, content.locations.length);
  const workerContentSource = await readFile(new URL('../runtime-r3/domain/worker-content.js', import.meta.url), 'utf8');
  const workerSource = await readFile(new URL('../runtime-r3/server/worker.js', import.meta.url), 'utf8');
  assert.doesNotMatch(workerContentSource, /node:fs|readFile/i);
  assert.match(workerSource, /new SupabaseR3Store/);
  assert.match(workerSource, /loadWorkerCanonicalContent/);
  assert.match(workerSource, /await store\.context/);
});

test('Supabase R3 adapter keeps async RPC names and attempt-fenced boundary', async () => {
  const calls = [];
  const gameId = '11111111-1111-4111-8111-111111111111';
  const actionId = '22222222-2222-4222-8222-222222222222';
  const job = { game_id: gameId, turn_number: 1, action_id: actionId, attempt_no: 1, status: 'processing', stage: 'reserved', literal_action: '한국어 입력' };
  const state = { game_id: gameId, revision: 0, committed_turn: 0, state: createInitialState({ name: 'Player' }, content.locations[0].location_id) };
  const response = payload => new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } });
  const fetchImpl = async (url, options = {}) => {
    const path = new URL(url).pathname; const name = path.split('/').at(-1); calls.push({ name, rpc: path.includes('/rpc/'), body: options.body ? JSON.parse(options.body) : null });
    if (path.endsWith('/rpc/company_r3_create_game')) return response({ game_id: gameId });
    if (path.endsWith('/rpc/company_r3_reserve_turn')) return response({ created: true, job });
    if (path.endsWith('/rpc/company_r3_expire_stale_turn')) return response(null);
    if (path.endsWith('/rpc/company_r3_update_turn_progress')) return response(job);
    if (path.endsWith('/rpc/company_r3_mark_story_complete')) return response({ ...job, stage: 'story_complete' });
    if (path.endsWith('/rpc/company_r3_commit_turn')) return response({ game_id: gameId, turn_number: 1, revision: 1 });
    if (path.endsWith('/rpc/company_r3_fail_turn')) return response({ ...job, status: 'failed' });
    if (path.endsWith('/company_r3_games')) return response([{ game_id: gameId, profile: { name: 'Player' } }]);
    if (path.endsWith('/company_r3_state')) return response([state]);
    if (path.endsWith('/company_r3_turns')) return response([]);
    if (path.endsWith('/company_r3_turn_jobs')) return response([job]);
    throw new Error(`unexpected ${path}`);
  };
  const store = new SupabaseR3Store({ env: { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service' }, fetchImpl });
  await store.createGame({ profile: { name: 'Player' }, locationId: content.locations[0].location_id });
  await store.reserveTurn({ gameId, turnNumber: 1, actionId, literalAction: '한국어 입력' });
  const attempt = { gameId, turnNumber: 1, actionId, attemptNo: 1 };
  await store.updateProgress({ gameId, turnNumber: 1, attempt, storyText: 'Story' });
  await store.markStoryComplete({ gameId, turnNumber: 1, attempt, storyText: 'Story' });
  await store.commitTurn({ gameId, turnNumber: 1, attempt, expectedRevision: 0, storyText: 'Story', choices: [], summary: 'Summary', stateAfter: state.state });
  await store.failJob({ gameId, turnNumber: 1, attempt, errorCode: 'failed' });
  assert.deepEqual(calls.filter(call => call.rpc).map(call => call.name), [
    'company_r3_create_game', 'company_r3_expire_stale_turn', 'company_r3_reserve_turn', 'company_r3_update_turn_progress', 'company_r3_mark_story_complete', 'company_r3_commit_turn', 'company_r3_expire_stale_turn', 'company_r3_fail_turn', 'company_r3_expire_stale_turn'
  ]);
  assert.equal(calls.find(call => call.name === 'company_r3_reserve_turn').body.p_literal_action, '한국어 입력');
});
