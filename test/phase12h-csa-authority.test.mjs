import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { normalizeCompanyCsaCatalog, validatePresetOperation } from '../src/engine/index.js';
import { buildStoryWorldProjection } from '../src/engine/csa/story-projection.js';
import { buildTransactionResolution, verifySignedTransactionResolution } from '../src/engine/csa/transaction-authority.js';
import { signTransactionValidationProof } from '../src/engine/csa/transaction-authority.js';
import { sha256Base64url, stableStringify } from '../src/engine/csa/transaction-validator.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = normalizeCompanyCsaCatalog(JSON.parse(fs.readFileSync(path.join(root, 'content/csa_presets.json'), 'utf8')));

test('every Company preset carries validated canonical execution metadata', () => {
  assert.equal(catalog.items.length, 44);
  for (const item of catalog.items) {
    assert.ok(item.execution?.kind);
    assert.ok(item.execution?.action);
    assert.ok(item.execution?.trigger_kind);
    if (item.allowed_counterparty_scopes.length) assert.equal(item.execution.target_required, true);
    if (item.category === 'clothing') assert.ok(item.execution.required_state);
    const result = validatePresetOperation(catalog, { strength: item.strength, preset: { template_id: item.id, subject_scope: item.default_subject_scope, counterparty_scope: item.default_counterparty_scope } }, { availableStrength: 'strong' });
    assert.equal(result.ok, true, `${item.id}: ${result.code}`);
    assert.deepEqual(result.preset.execution, item.execution);
  }
});

test('missing preset execution metadata is rejected instead of inferred from content', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(root, 'content/csa_presets.json'), 'utf8'));
  const withoutExecution = { ...raw, items: [{ ...raw.items[0], execution: undefined }] };
  const normalized = normalizeCompanyCsaCatalog(withoutExecution);
  assert.equal(normalized.items[0].execution, null);
  const result = validatePresetOperation(normalized, { strength: normalized.items[0].strength, preset: { template_id: normalized.items[0].id } }, { availableStrength: 'strong' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'PRESET_EXECUTION_INVALID');
});

test('relational projection exposes action contract and all eligible targets without selecting one', () => {
  const item = catalog.items.find(entry => entry.id === 'press_body_against_recipient');
  const rule = { id: 'csa_2', active: true, content: item.content_template, strength: 'weak', created_turn: 2, preset: { ...item, template_id: item.id, subject_scope: 'female_employee', counterparty_scope: 'male_employee', execution: item.execution } };
  const projection = buildStoryWorldProjection({
    save: { csa_active: ['csa_2'], csa_rules: { csa_2: rule }, npc_scene_state: {} },
    master: { characters: [{ character_id: 'heroine1', gender: 'female' }], general_npcs: [{ npc_id: 'male1', sex: 'male' }] },
    sceneActorIds: ['heroine1', 'male1'], expectedTurn: 2
  });
  assert.equal(projection.world_rules[0].execution_contract.action, 'press_body_against');
  assert.deepEqual(projection.scene_obligations[0].eligible_target_ids, ['male1']);
  assert.equal(projection.scene_obligations[0].trigger_state, 'required_now');
});

test('conditional execution stays conditional until canonical seated state is present', () => {
  const item = catalog.items.find(entry => entry.id === 'sit_on_recipient_lap');
  const rule = { id: 'csa_seated', active: true, content: item.content_template, strength: 'weak', created_turn: 2, preset: { ...item, template_id: item.id, subject_scope: 'female_employee', counterparty_scope: 'male_employee', execution: item.execution } };
  const base = { csa_active: ['csa_seated'], csa_rules: { csa_seated: rule }, npc_scene_state: { heroine1: { posture: 'standing' }, male1: { posture: 'standing' } } };
  const conditional = buildStoryWorldProjection({ save: base, master: { characters: [{ character_id: 'heroine1', gender: 'female' }], general_npcs: [{ npc_id: 'male1', sex: 'male' }] }, sceneActorIds: ['heroine1', 'male1'], expectedTurn: 2 });
  assert.equal(conditional.scene_obligations[0].trigger_state, 'conditional');
  const ready = buildStoryWorldProjection({ save: { ...base, npc_scene_state: { heroine1: { posture: 'sitting' }, male1: { posture: 'seated' } } }, master: { characters: [{ character_id: 'heroine1', gender: 'female' }], general_npcs: [{ npc_id: 'male1', sex: 'male' }] }, sceneActorIds: ['heroine1', 'male1'], expectedTurn: 2 });
  assert.equal(ready.scene_obligations[0].trigger_state, 'required_now');
});

test('applied transaction verification accepts immutable proof without the old planner digest', async () => {
  const secret = 'phase12h-test-secret';
  const gameId = '11111111-1111-4111-8111-111111111111';
  const resolution = { version: 1, base_turn_count: 0, planner_input_digest: 'old-digest', next_csa_active: ['csa_1'], next_csa_rules: { csa_1: { active: true } }, summary: { total: 1 } };
  resolution.resolution_digest = await (await import('../src/engine/csa/transaction-authority.js')).buildTransactionResolutionDigest(resolution);
  const action = { version: 1, type: 'app_transaction', base_turn_count: 0, operations: [{ client_id: 'x', domain: 'csa', operation: 'activate' }], transaction_resolution: resolution };
  const actionDigest = await sha256Base64url(stableStringify({ version: action.version, type: action.type, base_turn_count: action.base_turn_count, operations: action.operations }));
  const semantic = { version: 2, game_id: gameId, base_turn_count: 0, action_digest: actionDigest, planner_input_digest: 'old-digest', resolution_digest: resolution.resolution_digest, results: [] };
  action.semantic_validation = semantic;
  action.validation_proof = await signTransactionValidationProof(secret, { game_id: gameId, base_turn_count: 0, action_digest: actionDigest, resolution_digest: resolution.resolution_digest, semantic_results: [] });
  const result = await verifySignedTransactionResolution({ secret, gameId, structuredAction: action, save: { turn_state: { committed_turn: 0 }, csa_active: ['csa_1'], csa_rules: { csa_1: { active: true } } }, expectedTurn: 1 });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'applied');
});

test('pre-apply RPC is service-role-only and does not advance the turn', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20260812000100_company_v1_preapply_csa_transaction.sql'), 'utf8');
  assert.match(sql, /create or replace function public\.apply_reserved_csa_transaction/i);
  assert.match(sql, /save_revision = save_revision \+ 1/i);
  assert.doesNotMatch(sql, /insert into public\.game_turns/i);
  assert.doesNotMatch(sql, /committed_turn\s*=/i);
  assert.match(sql, /revoke all on function public\.apply_reserved_csa_transaction/i);
  assert.match(sql, /grant execute on function public\.apply_reserved_csa_transaction[\s\S]*to service_role/i);
});
