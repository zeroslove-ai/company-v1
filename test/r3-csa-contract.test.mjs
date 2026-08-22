import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { applyR3Csa, createR3CsaCatalog, R3_CSA_TEMPLATE_IDS } from '../runtime-r3/domain/csa.js';
import { createR3Worker } from '../runtime-r3/server/worker.js';
import { InMemoryR3Store } from '../runtime-r3/server/store.js';
import fs from 'node:fs';

const content = loadCanonicalCompanyR3Content();
const GAME_ACCESS_SECRET = 'r3-test-secret';

test('R3 CSA catalog exposes exactly the owner-locked nine templates with three per strength', () => {
  const catalog = createR3CsaCatalog(content.csaPresets);
  assert.deepEqual(catalog.items.map(item => item.id), R3_CSA_TEMPLATE_IDS);
  assert.equal(catalog.items.length, 9);
  const counts = Object.groupBy(catalog.items, item => item.strength); assert.deepEqual(Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, value.length])), { weak: 3, medium: 3, strong: 3 });
});

test('R3 clothing CSA applies exact slots to scoped scene actors without creating a Story turn', () => {
  const state = { revision: 2, committed_turn: 4, scene: { present_actor_ids: ['heroine1', 'general_park_jungwoo'] }, csa_active: [], csa_rules: {}, clothing: {} };
  const next = applyR3Csa({ state, content, rawOperations: [{ operation: 'activate', template_id: 'no_bra_under_work_clothes', subject_scope: 'female_employee' }] });
  assert.equal(next.csa_active.length, 1);
  assert.equal(next.clothing.heroine1.underwear_top, 'removed');
  assert.equal(next.clothing.general_park_jungwoo, undefined);
  assert.equal(next.committed_turn, 4);
  const removed = applyR3Csa({ state: next, content, rawOperations: [{ operation: 'deactivate', id: next.csa_active[0] }] });
  assert.deepEqual(removed.csa_active, []);
  assert.equal(removed.committed_turn, 4);
});

test('R3 CSA entry point is an enabled donor-style control, not a display-only placeholder', () => {
  const html = fs.readFileSync(new URL('../frontend-r3/index.html', import.meta.url), 'utf8');
  assert.match(html, /id="open-apps" type="button" disabled/);
  assert.match(html, /상식개변 규칙은 플레이를 멈추지 않고 적용·변경·해제/);
  assert.doesNotMatch(html, /표시만 제공하며, 규칙 변경 기능은 아직 활성화되지 않았습니다/);
});

test('R3 CSA route applies a non-turn transaction behind an optimistic revision fence', async () => {
  const worker = createR3Worker({ store: new InMemoryR3Store(), provider: { async *story() {}, async observe() { return {}; } }, content, gameAccessSecret: GAME_ACCESS_SECRET });
  const setupResponse = await worker.fetch(new Request('https://r3.test/api/r3/games', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profile: {
      name: 'CSA route player', department_id: content.departments[0].department_id, position_id: content.positions[0].position_id,
      age: 29, height_cm: 178, weight_kg: 72, penis_length_cm: 14,
      body_type_id: content.bodyTypes[0].body_type_id, speech_style_id: content.speechStyles[0].speech_style_id
    } })
  }));
  const setupPayload = await setupResponse.json();
  const gameId = setupPayload.data.game.game_id;
  const auth = { authorization: `Bearer ${setupPayload.data.game_capability}` };
  const initial = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/context`, { headers: auth }));
  const initialPayload = await initial.json();
  const changed = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/csa`, {
    method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({
      expected_revision: initialPayload.data.state.revision,
      operations: [{ operation: 'activate', template_id: 'no_bra_under_work_clothes', subject_scope: 'female_employee' }]
    })
  }));
  const changedPayload = await changed.json();
  assert.equal(changedPayload.ok, true);
  assert.equal(changedPayload.data.state.revision, 1);
  assert.equal(changedPayload.data.state.committed_turn, 0);
  assert.equal(changedPayload.data.turns.length, 0);
  assert.equal(changedPayload.data.state.state.csa_active.length, 1);
  assert.ok(Object.values(changedPayload.data.state.state.clothing).some(value => value.underwear_top === 'removed'));
});

test('R3 Opening/CSA overlap is fenced without a second Story or Observer', async () => {
  const store = new InMemoryR3Store();
  let gameId;
  const provider = { storyCalls: 0, observeCalls: 0, async *story({ opening = false }) { this.storyCalls += 1; if (opening) { const before = store.context(gameId); store.applyCsa({ gameId, expectedRevision: before.state.revision, stateAfter: applyR3Csa({ state: before.state.state, content, rawOperations: [{ operation: 'activate', template_id: 'work_nude', subject_scope: 'female_employee' }] }), operations: [] }); } yield 'Opening'; }, async observe() { this.observeCalls += 1; return { choices: [], turn_summary: 'Opening' }; } };
  const worker = createR3Worker({ store, provider, content, gameAccessSecret: GAME_ACCESS_SECRET });
  const setupResponse = await worker.fetch(new Request('https://r3.test/api/r3/games', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profile: {
      name: 'Opening race player', department_id: content.departments[0].department_id, position_id: content.positions[0].position_id,
      age: 29, height_cm: 178, weight_kg: 72, penis_length_cm: 14,
      body_type_id: content.bodyTypes[0].body_type_id, speech_style_id: content.speechStyles[0].speech_style_id
    } })
  }));
  const setupPayload = await setupResponse.json(); gameId = setupPayload.data.game.game_id;
  const auth = { authorization: `Bearer ${setupPayload.data.game_capability}` };
  const opening = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/opening`, { method: 'POST', headers: auth }));
  const openingText = await opening.text();
  assert.match(openingText, /"status":"failed"/);
  assert.match(openingText, /r3_opening_conflict/);
  const final = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/context`, { headers: auth }));
  const finalPayload = await final.json();
  assert.equal(finalPayload.data.turns.length, 0);
  assert.equal(finalPayload.data.state.revision, 1);
  assert.equal(finalPayload.data.state.state.csa_active.length, 1);
  assert.equal(provider.storyCalls, 1);
  assert.equal(provider.observeCalls, 1);
});

test('R3 normal Opening then CSA sequence preserves active rule into the next turn', async () => {
  const store = new InMemoryR3Store();
  const provider = { async *story({ opening = false }) { yield opening ? 'Opening' : 'Ordinary turn'; }, async observe() { return { choices: [], turn_summary: 'Summary' }; } };
  const worker = createR3Worker({ store, provider, content, gameAccessSecret: GAME_ACCESS_SECRET });
  const profile = { name: 'Sequence player', department_id: content.departments[0].department_id, position_id: content.positions[0].position_id, age: 29, height_cm: 178, weight_kg: 72, penis_length_cm: 14, body_type_id: content.bodyTypes[0].body_type_id, speech_style_id: content.speechStyles[0].speech_style_id };
  const setupResponse = await worker.fetch(new Request('https://r3.test/api/r3/games', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profile }) }));
  const setupPayload = await setupResponse.json(); const gameId = setupPayload.data.game.game_id;
  const auth = { authorization: `Bearer ${setupPayload.data.game_capability}` };
  const opening = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/opening`, { method: 'POST', headers: auth }));
  assert.match(await opening.text(), /"status":"committed"/);
  const beforeCsa = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/context`, { headers: auth }));
  const beforeCsaPayload = await beforeCsa.json();
  const csa = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/csa`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ expected_revision: beforeCsaPayload.data.state.revision, operations: [{ operation: 'activate', template_id: 'work_nude', subject_scope: 'female_employee' }] }) }));
  const csaPayload = await csa.json();
  const turn = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/turn`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ expected_turn: 1, action_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', literal_action: '일상 업무를 계속한다.' }) }));
  assert.match(await turn.text(), /"status":"committed"/);
  const final = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/context`, { headers: auth }));
  const finalPayload = await final.json();
  assert.equal(finalPayload.data.state.revision, csaPayload.data.state.revision + 1);
  assert.equal(finalPayload.data.state.state.csa_active.length, 1);
  assert.ok(Object.values(finalPayload.data.state.state.clothing).some(value => value.uniform_top === 'removed'));
  assert.equal(finalPayload.data.turns.length, 2);
});
