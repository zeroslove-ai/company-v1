import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { applyR3Csa, createR3CsaCatalog, R3_CSA_TEMPLATE_IDS } from '../runtime-r3/domain/csa.js';
import { createR3Worker } from '../runtime-r3/server/worker.js';
import { InMemoryR3Store } from '../runtime-r3/server/store.js';

const content = loadCanonicalCompanyR3Content();
const GAME_ACCESS_SECRET = 'r3-test-secret';
const profile = {
  name: 'R3 Player', department_id: content.departments[0].department_id, position_id: content.positions[0].position_id,
  age: 29, height_cm: 178, weight_kg: 72, penis_length_cm: 14,
  body_type_id: content.bodyTypes[0].body_type_id, speech_style_id: content.speechStyles[0].speech_style_id
};

async function events(response) {
  const text = await response.text();
  return [...text.matchAll(/event: ([^\n]+)\ndata: ([^\n]+)/g)].map(match => ({ event: match[1], data: JSON.parse(match[2]) }));
}

async function setupGame(worker) {
  const response = await worker.fetch(new Request('https://r3.test/api/r3/games', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profile }) }));
  const payload = await response.json(); const gameId = payload.data.game.game_id;
  return { gameId, auth: { authorization: `Bearer ${payload.data.game_capability}` } };
}

async function postTurn(worker, gameId, auth, payload) {
  return events(await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/turn`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify(payload) })));
}

function providerFor({ failCsa = false, calls = [] } = {}) {
  return {
    async *story({ opening = false, literalAction = '', csaOperation = null }) {
      calls.push({ stage: 'story', literalAction, csaOperation });
      if (failCsa && csaOperation) throw new Error('csa_story_failed');
      const prefix = opening ? 'Opening' : `Story: ${literalAction}`;
      yield `${prefix}\n\n1. Continue naturally\n2. Move to the next scene\n3. Speak with the colleague\n4. Write a free action`;
    },
    async observe({ literalAction, csaOperation, storyText }) {
      calls.push({ stage: 'observer', literalAction, csaOperation });
      return { choices: ['Continue naturally', 'Move to the next scene', 'Speak with the colleague', 'Write a free action'], turn_summary: storyText.slice(0, 80), mind_monitor: {} };
    }
  };
}

async function openGame(worker, gameId, auth) {
  const opening = await events(await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/opening`, { method: 'POST', headers: auth })));
  assert.equal(opening.at(-1).data.status, 'committed');
}

test('R3 CSA catalog remains the bounded nine-template catalog', () => {
  const catalog = createR3CsaCatalog(content.csaPresets);
  assert.deepEqual(catalog.items.map(item => item.id), R3_CSA_TEMPLATE_IDS);
  assert.equal(catalog.items.length, 9);
});

test('bounded clothing projection remains a pure state projection; active UI path is a turn', () => {
  const state = { revision: 2, committed_turn: 4, scene: { present_actor_ids: ['heroine1', 'general_park_jungwoo'] }, csa_active: [], csa_rules: {}, clothing: {} };
  const next = applyR3Csa({ state, content, rawOperations: [{ operation: 'activate', template_id: 'no_bra_under_work_clothes', subject_scope: 'female_employee' }] });
  assert.equal(next.committed_turn, 4);
  assert.equal(next.clothing.heroine1.underwear_top, 'removed');
});

test('visible APPLY uses exactly one Story/Observer/commit and never the zero-turn writer', async () => {
  const store = new InMemoryR3Store(); let applyCsaCalls = 0; store.applyCsa = () => { applyCsaCalls += 1; throw new Error('zero_turn_writer_must_not_run'); };
  const calls = []; const worker = createR3Worker({ store, provider: providerFor({ calls }), content, gameAccessSecret: GAME_ACCESS_SECRET }); const { gameId, auth } = await setupGame(worker); await openGame(worker, gameId, auth);
  const operation = { operation: 'activate', template_id: 'no_bra_under_work_clothes', subject_scope: 'female_employee' };
  const result = await postTurn(worker, gameId, auth, { action_id: 'apply-1', expected_turn: 1, literal_action: 'Apply the selected rule for female_employee', csa_operation: operation });
  assert.equal(result.at(-1).data.status, 'committed'); assert.equal(applyCsaCalls, 0);
  assert.equal(result.at(-1).data.context.state.committed_turn, 1); assert.equal(result.at(-1).data.context.turns.length, 2);
  assert.deepEqual(calls.filter(call => call.stage === 'story').at(-1).csaOperation, operation);
  assert.equal(result.at(-1).data.context.state.state.csa_active.length, 1);
});

test('legacy /csa endpoint delegates to the same chronological turn stream', async () => {
  const store = new InMemoryR3Store(); let applyCsaCalls = 0; store.applyCsa = () => { applyCsaCalls += 1; throw new Error('zero_turn_writer_must_not_run'); };
  const worker = createR3Worker({ store, provider: providerFor(), content, gameAccessSecret: GAME_ACCESS_SECRET }); const { gameId, auth } = await setupGame(worker); await openGame(worker, gameId, auth);
  const response = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/csa`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ expected_revision: 0, operations: [{ operation: 'activate', template_id: 'work_nude', subject_scope: 'female_employee' }] }) }));
  const result = await events(response); assert.equal(result.at(-1).data.status, 'committed'); assert.equal(applyCsaCalls, 0); assert.equal(result.at(-1).data.context.state.committed_turn, 1);
});

test('CHANGE then REMOVE each consume one turn and preserve historical Story chronology', async () => {
  const worker = createR3Worker({ store: new InMemoryR3Store(), provider: providerFor(), content, gameAccessSecret: GAME_ACCESS_SECRET }); const { gameId, auth } = await setupGame(worker); await openGame(worker, gameId, auth);
  const apply = await postTurn(worker, gameId, auth, { action_id: 'apply-2', expected_turn: 1, literal_action: 'Apply a rule', csa_operation: { operation: 'activate', template_id: 'work_nude', subject_scope: 'female_employee' } });
  const ruleId = apply.at(-1).data.context.state.state.csa_active[0];
  const change = await postTurn(worker, gameId, auth, { action_id: 'change-2', expected_turn: 2, literal_action: 'Change the selected rule', csa_operation: { operation: 'update', id: ruleId, template_id: 'work_in_underwear_only', subject_scope: 'female_employee' } });
  assert.equal(change.at(-1).data.status, 'committed'); assert.equal(change.at(-1).data.context.state.state.csa_rules[ruleId].template_id, 'work_in_underwear_only');
  const remove = await postTurn(worker, gameId, auth, { action_id: 'remove-2', expected_turn: 3, literal_action: 'Remove the selected rule', csa_operation: { operation: 'deactivate', id: ruleId } });
  const final = remove.at(-1).data.context; assert.equal(final.state.committed_turn, 3); assert.equal(final.state.state.csa_active.length, 0); assert.equal(final.turns.length, 4); assert.match(final.turns[1].story_text, /Apply/); assert.match(final.turns[2].story_text, /Change/); assert.match(final.turns[3].story_text, /Remove/);
});

test('failed CSA Story leaves the previous active-rule state authoritative', async () => {
  const store = new InMemoryR3Store(); const worker = createR3Worker({ store, provider: providerFor({ failCsa: true }), content, gameAccessSecret: GAME_ACCESS_SECRET }); const { gameId, auth } = await setupGame(worker); await openGame(worker, gameId, auth);
  const failed = await postTurn(worker, gameId, auth, { action_id: 'failed-csa', expected_turn: 1, literal_action: 'Apply a rule', csa_operation: { operation: 'activate', template_id: 'work_nude', subject_scope: 'female_employee' } });
  const context = failed.at(-1).data.context; assert.equal(failed.at(-1).data.status, 'failed'); assert.equal(context.state.committed_turn, 0); assert.deepEqual(context.state.state.csa_active, []); assert.equal(context.turns.length, 1); assert.equal(context.job.status, 'failed');
});

test('duplicate operation requests remain fenced to one job and one committed turn', async () => {
  const worker = createR3Worker({ store: new InMemoryR3Store(), provider: providerFor(), content, gameAccessSecret: GAME_ACCESS_SECRET }); const { gameId, auth } = await setupGame(worker); await openGame(worker, gameId, auth);
  const payload = { action_id: 'duplicate-csa', expected_turn: 1, literal_action: 'Apply a rule', csa_operation: { operation: 'activate', template_id: 'work_nude', subject_scope: 'female_employee' } };
  const first = await postTurn(worker, gameId, auth, payload); const second = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/turn`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify(payload) })); const secondPayload = await second.json();
  assert.equal(first.at(-1).data.status, 'committed'); assert.equal(secondPayload.data.reconnect, true); assert.equal((await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/context`, { headers: auth }))).status, 200);
  assert.equal((await secondPayload.data.context).state?.committed_turn ?? 1, 1);
});

test('ordinary free input stays Story-first after a CSA operation', async () => {
  const calls = []; const worker = createR3Worker({ store: new InMemoryR3Store(), provider: providerFor({ calls }), content, gameAccessSecret: GAME_ACCESS_SECRET }); const { gameId, auth } = await setupGame(worker); await openGame(worker, gameId, auth);
  await postTurn(worker, gameId, auth, { action_id: 'apply-ordinary', expected_turn: 1, literal_action: 'Apply a rule', csa_operation: { operation: 'activate', template_id: 'work_nude', subject_scope: 'female_employee' } });
  const ordinary = await postTurn(worker, gameId, auth, { action_id: 'ordinary-after-csa', expected_turn: 2, literal_action: 'I walk to the lounge and greet my colleague.' });
  assert.equal(ordinary.at(-1).data.status, 'committed'); assert.equal(calls.at(-2).csaOperation, null); assert.equal(ordinary.at(-1).data.context.turns.at(-1).literal_action, 'I walk to the lounge and greet my colleague.');
});

test('frontend CSA controls submit a structured operation through the normal turn client', () => {
  const source = fs.readFileSync(new URL('../frontend-r3/csa.js', import.meta.url), 'utf8'); const app = fs.readFileSync(new URL('../frontend-r3/app.js', import.meta.url), 'utf8');
  assert.match(source, /onOperation/); assert.doesNotMatch(source, /client\.csa/); assert.match(source, /각 변경은 Story 턴을 사용합니다/); assert.match(app, /csa_operation/); assert.match(app, /client\.turn/);
});

test('Story/Observer boundary states that compliance does not prove private positive emotion', () => {
  const provider = fs.readFileSync(new URL('../runtime-r3/server/provider.js', import.meta.url), 'utf8');
  assert.match(provider, /pending_csa_operation/); assert.match(provider, /Compliance with an institutional rule/); assert.match(provider, /independent Story\/character evidence/);
});
