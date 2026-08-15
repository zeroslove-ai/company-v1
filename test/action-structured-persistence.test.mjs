import test from 'node:test';
import assert from 'node:assert/strict';

import { createApiWorker } from '../src/api/index.js';
import { createSupabaseClient } from '../src/api/supabase.js';
import { makeJsonResponse as json } from './helpers/http-mocks.mjs';

const gameId = '11111111-1111-4111-8111-111111111111';
const actionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const storedStructuredAction = {
  version: 1,
  type: 'csa_app_transaction',
  base_turn_count: 3,
  operations: [{ client_id: 'op-1', operation: 'deactivate', id: 'csa_0' }],
  validation_proof: 'signed-proof'
};

const env = {
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test'
};

function post(pathname, body) {
  return new Request(`https://worker.test${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

test('Supabase reservation sends structured_action in the existing reserve_turn_action RPC', async () => {
  let captured = null;
  const client = createSupabaseClient(env, async (url, init) => {
    captured = { url: String(url), body: JSON.parse(init.body) };
    return json({ action_id: actionId });
  });

  await client.reserveTurnAction(gameId, actionId, 4, '앱 변경을 적용한다', storedStructuredAction);

  assert.match(captured.url, /\/rest\/v1\/rpc\/reserve_turn_action$/);
  assert.deepEqual(captured.body.p_structured_action, storedStructuredAction);
  assert.equal(captured.body.p_expected_turn, 4);
});

test('feedback revision commit sends the same Extract-authored turn summary field', async () => {
  let captured = null;
  const client = createSupabaseClient(env, async (url, init) => {
    captured = { url: String(url), body: JSON.parse(init.body) };
    return json({ success: true, replayed: false });
  });
  const summary = '수정된 장면에서 확인된 관계와 업무 약속의 요약';

  await client.commitFeedbackRevision(gameId, actionId, 'revision-1', { turn_state: { committed_turn: 3 } }, summary, { heroine1: {} }, ['A', 'B', 'C', 'D']);

  assert.match(captured.url, /\/rest\/v1\/rpc\/commit_feedback_revision$/);
  assert.equal(captured.body.p_turn_summary, summary);
  assert.deepEqual(captured.body.p_choices, ['A', 'B', 'C', 'D']);
});
test('history query selects and API returns the persisted structured_action', async () => {
  const worker = createApiWorker({
    fetchImpl: async (url) => {
      const parsed = new URL(String(url));
      assert.equal(parsed.pathname, '/rest/v1/game_turns');
      assert.match(parsed.searchParams.get('select'), /structured_action/);
      return json([{
        turn_number: 3,
        player_action: '앱 변경을 적용한다',
        structured_action: storedStructuredAction,
        feedback_text: null,
        story_text: '[1. 서사 및 행동]\n본문',
        parsed_blocks: { player_inner_thought: '확인한다.' },
        turn_summary: '요약',
        mind_monitor: {},
        choices: ['A', 'B', 'C', 'D'],
        post_save: { open_observations: [{ fact_id: 'fact-1', subject_id: 'heroine1', fact_text: 'observed', story_quote: 'observed' }] },
        committed_at: '2026-08-04T00:00:00Z'
      }]);
    }
  });

  const response = await worker.fetch(post('/api/history', { game_id: gameId, limit: 20 }), env);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload.data.records[0].structured_action, storedStructuredAction);
  assert.equal('open_observations' in payload.data.records[0], false);
});

test('history uses usable committed parsed_blocks even when raw Story is not parseable as the current record', async () => {
  const committedBlocks = {
    raw: 'committed raw Story',
    blocks: [{ type: 'scene', text: 'committed structure' }],
    choices: ['A', 'B', 'C', 'D'],
    player_inner_thought: 'committed thought',
    warnings: []
  };
  const worker = createApiWorker({
    fetchImpl: async (url) => {
      const parsed = new URL(String(url));
      assert.equal(parsed.pathname, '/rest/v1/game_turns');
      return json([{
        turn_number: 4,
        player_action: 'continue',
        structured_action: null,
        feedback_text: null,
        story_text: '[DIALOGUE speaker_id="wrong"]reparsed only[/DIALOGUE]',
        parsed_blocks: committedBlocks,
        turn_summary: 'summary',
        mind_monitor: {},
        choices: committedBlocks.choices,
        post_save: {},
        committed_at: '2026-08-04T00:00:00Z'
      }]);
    }
  });

  const response = await worker.fetch(post('/api/history', { game_id: gameId, limit: 20 }), env);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload.data.records[0].parsed_blocks, committedBlocks);
  assert.equal(payload.data.records[0].player_inner_thought, 'committed thought');
});

test('history keeps the historical parser only for rows without usable structured blocks', async () => {
  const worker = createApiWorker({
    fetchImpl: async (url) => {
      const parsed = new URL(String(url));
      assert.equal(parsed.pathname, '/rest/v1/game_turns');
      return json([{
        turn_number: 5,
        player_action: 'continue',
        structured_action: null,
        feedback_text: null,
        story_text: '[PLAYER_INNER_THOUGHT]\nhistorical',
        parsed_blocks: {},
        turn_summary: 'summary',
        mind_monitor: {},
        choices: [],
        post_save: {},
        committed_at: '2026-08-05T00:00:00Z'
      }]);
    }
  });

  const response = await worker.fetch(post('/api/history', { game_id: gameId, limit: 20 }), env);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.data.records[0].parsed_blocks.warnings.includes('legacy_narrative_adapter_used'), true);
});

test('a later stage cannot replace the structured action already reserved on game_actions', async () => {
  const worker = createApiWorker({
    fetchImpl: async (url, init = {}) => {
      const parsed = new URL(String(url));
      if (parsed.pathname === '/rest/v1/game_actions') {
        return json([{
          action_id: actionId,
          game_id: gameId,
          turn_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          expected_turn: 4,
          action_kind: 'player_turn',
          processing_status: 'extracting',
          story_text: '[1. 서사 및 행동]\n본문',
          parsed_blocks: {},
          extract_delta: null,
          structured_action: storedStructuredAction
        }]);
      }
      throw new Error(`unexpected request: ${init.method ?? 'GET'} ${parsed.pathname}`);
    }
  });

  const substituted = { ...storedStructuredAction, operations: [] };
  const response = await worker.fetch(post('/api/extract', {
    game_id: gameId,
    action_id: actionId,
    structured_action: substituted
  }), env);

  assert.equal(response.status, 409);
 const payload = await response.json();
 assert.equal(payload.error.code, 'structured_action_mismatch');
});
