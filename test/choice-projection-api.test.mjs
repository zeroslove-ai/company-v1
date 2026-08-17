import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiWorker } from '../src/api/index.js';
import { makeJsonResponse as json } from './helpers/http-mocks.mjs';

const gameId = '11111111-1111-4111-8111-111111111111';
const actionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const turnId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const env = {
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
  LLM_API_URL: 'https://llm.test',
  LLM_API_KEY: 'llm-key',
  STORY_MODEL: 'story-test',
  EXTRACT_MODEL: 'extract-test'
};

function post(pathname, body) {
  return new Request(`https://worker.test${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function readSseComplete(text) {
  const frame = text.split('\n\n').find(item => item.includes('event: complete'));
  return JSON.parse(frame.split('data:')[1].trim());
}

function normalTurnSave() {
  return {
    save_schema_version: 1,
    edition: 'company-v1',
    turn_state: { committed_turn: 0 },
    player: {},
    scene: { version: 1, scene_id: 'office', location_id: 'brand_strategy_office', beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 0 },
    scene_state: {},
    world_state: { game_time: { day: 1, minute_of_day: 540 } },
    npc_stats: {},
    npc_relationship_state: {},
    npc_scene_state: {},
    csa_active: [],
    csa_rules: {},
    csa_runtime_state: {},
    csa_aftereffect_state: {}
  };
}

const extractResult = {
  extract_version: 2,
  outcome: 'success',
  scene_observation: {
    scene_id: null, location_id: null, final_present_npc_ids: null,
    entered_npc_ids: [], exited_npc_ids: [], presence_is_final: false,
    focal_candidate_id: null, remote_speaker_ids: [], evidence: []
  },
  player_observation: { physical: null, sexual: null },
  npc_observations: {}, evidence: {}, elapsed_minutes: 3,
  mind_monitor: {}, turn_summary: '대화가 이어졌다.', warnings: []
};

test('normal Story zero-choice API path completes and keeps one projected choice set through Extract, Commit, history, and replay', async () => {
  const rawStory = '[SCENE]\nA valid ordinary turn.\n[DIALOGUE speaker_id="heroine1"]Hello.[/DIALOGUE]\n[THOUGHT]I should listen.[/THOUGHT]';
  const calls = [];
  const save = normalTurnSave();
  let action = {
    game_id: gameId, action_id: actionId, turn_id: turnId, expected_turn: 1,
    action_kind: 'player_turn', processing_status: 'story_streaming',
    stage_owner_token: null, story_text: null, parsed_blocks: null,
    extract_delta: null, structured_action: null, player_action: 'continue'
  };
  let committedTurn = null;

  const fetchImpl = async (url, init = {}) => {
    const parsed = new URL(String(url));
    const path = parsed.pathname;
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ path, body });

    if (path === '/chat/completions') {
      if (body.stream) {
        return new Response(
          `data: ${JSON.stringify({ choices: [{ delta: { content: rawStory } }] })}\n\ndata: [DONE]\n`,
          { headers: { 'content-type': 'text/event-stream' } }
        );
      }
      return json({ choices: [{ message: { content: JSON.stringify(extractResult) } }] });
    }
    if (path === '/rest/v1/game_actions') return json([action]);
    if (path === '/rest/v1/rpc/reserve_turn_action') return json(action);
    if (path === '/rest/v1/rpc/get_company_context') {
      return json({ game: { id: gameId, edition_id: 'company-v1', title: 'test' }, save: { data: save }, recent_turns: [] });
    }
    if (path === '/rest/v1/rpc/claim_game_action_stage') {
      action = { ...action, processing_status: body.p_next_status, stage_owner_token: body.p_next_owner_token };
      return json(action);
    }
    if (path === '/rest/v1/rpc/record_story_result_owned') {
      action = { ...action, story_text: body.p_story_text, parsed_blocks: body.p_parsed_blocks, processing_status: 'extracting', stage_owner_token: null };
      return json(action);
    }
    if (path === '/rest/v1/rpc/record_extract_result_owned') {
      action = { ...action, extract_delta: body.p_extract_delta, processing_status: 'committing', stage_owner_token: null };
      return json(action);
    }
    if (path === '/rest/v1/rpc/commit_company_turn') {
      committedTurn = { turn_number: 1, player_action: action.player_action, story_text: action.story_text, parsed_blocks: action.parsed_blocks, choices: body.p_choices, turn_summary: body.p_turn_summary, mind_monitor: body.p_mind_monitor };
      return json({ success: true, turn_number: 1 });
    }
    if (path === '/rest/v1/game_turns') return json([committedTurn]);
    throw new Error(`unexpected request ${init.method ?? 'GET'} ${path}`);
  };

  const worker = createApiWorker({ fetchImpl });
  const storyResponse = await worker.fetch(post('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 1, player_action: 'continue' }), env);
  const storyText = await storyResponse.text();
  const storyComplete = readSseComplete(storyText);
  assert.equal(storyResponse.status, 200);
  assert.equal(storyComplete.replayed, false);
  assert.equal(storyComplete.parsed_blocks.raw, rawStory);
  assert.equal(storyComplete.parsed_blocks.choices.length, 4);
  assert.equal(storyComplete.parsed_blocks.warnings.includes('choices_not_exactly_four'), true);
  assert.equal(storyComplete.parsed_blocks.warnings.includes('choices_fallback_applied'), true);
  assert.deepEqual(storyComplete.parsed_blocks.blocks, action.parsed_blocks.blocks);

  const extractResponse = await worker.fetch(post('/api/extract', { game_id: gameId, action_id: actionId, expected_turn: 1 }), env);
  assert.equal(extractResponse.status, 200);
  assert.deepEqual((await extractResponse.json()).data.parsed_blocks.choices, storyComplete.parsed_blocks.choices);

  const commitResponse = await worker.fetch(post('/api/commit', { game_id: gameId, action_id: actionId, expected_turn: 1 }), env);
  assert.equal(commitResponse.status, 200);
  const commitCall = calls.find(call => call.path === '/rest/v1/rpc/commit_company_turn');
  assert.deepEqual(commitCall.body.p_choices, storyComplete.parsed_blocks.choices);
  assert.deepEqual(committedTurn.choices, storyComplete.parsed_blocks.choices);

  const historyResponse = await worker.fetch(post('/api/history', { game_id: gameId, limit: 20 }), env);
  assert.deepEqual((await historyResponse.json()).data.records[0].choices, storyComplete.parsed_blocks.choices);

  const replayResponse = await worker.fetch(post('/api/story', { game_id: gameId, action_id: actionId, expected_turn: 1, player_action: 'continue' }), env);
  const replayComplete = readSseComplete(await replayResponse.text());
  assert.equal(replayComplete.replayed, true);
  assert.deepEqual(replayComplete.parsed_blocks.choices, storyComplete.parsed_blocks.choices);
});
