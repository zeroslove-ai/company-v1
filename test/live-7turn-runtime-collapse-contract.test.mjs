import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createTurnCoordinator } from '../src/frontend/pages/app.js';
import { buildMindMonitorTargetIds } from '../src/engine/extract-prompt.js';
import { parseFreshNarrativeV2 } from '../src/engine/fresh-narrative-parser.js';

const gameId = '11111111-1111-4111-8111-111111111111';
const context = () => ({ save: { data: { turn_state: { committed_turn: 2 }, scene: { version: 1, location_id: 'office', present_npc_ids: ['npc-a', 'npc-b'], focal_character_id: 'npc-a', last_speaker_id: 'npc-a', updated_turn: 2 } } } });

test('fresh coordinator sends one server-owned turn and never calls stage endpoints', async () => {
  const calls = [];
  const pendingChanges = [];
  const api = {
    turn: async body => { calls.push(body); return new Response('turn'); },
    story: async () => { throw new Error('stage route must not be called'); },
    extract: async () => { throw new Error('stage route must not be called'); },
    commit: async () => { throw new Error('stage route must not be called'); }
  };
  const coordinator = createTurnCoordinator({
    api, storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }, gameId,
    getContext: context, refreshContext: async () => {}, createActionId: () => 'one-action',
    onPendingChange: value => pendingChanges.push(value && structuredClone(value)),
    consumeStory: async (_response, onEvent) => {
      onEvent({ event: 'meta', data: { action_id: 'one-action' } });
      onEvent({ event: 'delta', data: { text: '[SCENE] one server turn' } });
      onEvent({ event: 'complete', data: { parsed_blocks: { blocks: [] } } });
      onEvent({ event: 'terminal', data: { extract: {}, commit: { success: true } } });
    }
  });
  await coordinator.startNewAction('exact player action');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].player_action, 'exact player action');
  assert.equal(calls[0].expected_turn, 3);
  assert.equal(pendingChanges.at(-1), null);
});

test('Mind Monitor targets focal and observed speakers, not every present NPC', () => {
  const ids = buildMindMonitorTargetIds({
    context: context(),
    npcIds: new Set(['npc-a', 'npc-b', 'npc-c']),
    parsedStory: { dialogue_lines: [{ speaker_id: 'npc-c' }], blocks: [] }
  });
  assert.deepEqual(ids.sort(), ['npc-a', 'npc-c']);
});

test('protocol out-of-band markers fail before gameplay commit', () => {
  assert.throws(() => parseFreshNarrativeV2('[SCENE]\n[ooc] retry this\n[/SCENE]'), /protocol/i);
});

test('CSA apply migration is save-only and revision fenced', () => {
  const sql = fs.readFileSync('supabase/migrations/20260819000100_company_v1_csa_non_turn_apply.sql', 'utf8');
  assert.match(sql, /for update/i);
  assert.match(sql, /save_revision <> p_expected_revision/i);
  assert.match(sql, /committed_turn/i);
  assert.match(sql, /csa_active.*csa_rules/s);
  assert.match(sql, /grant execute.*service_role/i);
});
