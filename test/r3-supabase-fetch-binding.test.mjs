import test from 'node:test';
import assert from 'node:assert/strict';

import { SupabaseR3Store } from '../runtime-r3/server/supabase-store.js';

const GAME_ID = '00000000-0000-4000-8000-000000000001';
const profile = {
  name: String.fromCodePoint(0xAE40, 0xB3C4, 0xC724),
  department_id: 'brand_strategy',
  position_id: 'assistant_manager',
  age: 29,
  height_cm: 178,
  weight_kg: 72,
  penis_length_cm: 14,
  body_type_id: 'balanced',
  speech_style_id: 'polite'
};

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

test('R3 Supabase production store detaches native fetch and preserves UTF-8 Setup payload', async () => {
  const calls = [];
  const state = {
    profile,
    time: { day: 1, minute: 540 },
    scene: { location_id: 'brand_strategy_office', present_actor_ids: [], scene_note: '' },
    active_rules: [],
    clothing: {}
  };
  const game = { game_id: GAME_ID, content_version: 'company-r3-m0', profile, created_at: '2026-08-21T00:00:00.000Z' };

  async function receiverSensitiveFetch(url, options = {}) {
    assert.equal(this, undefined, 'native fetch must be invoked without an object receiver');
    const parsed = new URL(url);
    calls.push({ path: parsed.pathname, method: options.method ?? 'GET', body: options.body ? JSON.parse(options.body) : null });

    if (parsed.pathname.endsWith('/rpc/company_r3_create_game')) return response({ game_id: GAME_ID });
    if (parsed.pathname.endsWith('/rpc/company_r3_expire_stale_turn')) return response(null);
    if (parsed.pathname.endsWith('/company_r3_games')) return response([game]);
    if (parsed.pathname.endsWith('/company_r3_state')) return response([{ game_id: GAME_ID, revision: 0, committed_turn: 0, state, updated_at: '2026-08-21T00:00:00.000Z' }]);
    if (parsed.pathname.endsWith('/company_r3_turns')) return response([]);
    if (parsed.pathname.endsWith('/company_r3_turn_jobs')) return response([]);
    throw new Error(`unexpected R3 fetch: ${parsed.pathname}`);
  }

  const store = new SupabaseR3Store({
    env: { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service-role-test' },
    fetchImpl: receiverSensitiveFetch
  });
  const context = await store.createGame({ profile, locationId: state.scene.location_id, presentActorIds: [] });

  assert.equal(context.game.game_id, GAME_ID);
  assert.equal(context.game.profile.name, profile.name);
  assert.deepEqual(calls.map(call => `${call.method} ${call.path}`), [
    'POST /rest/v1/rpc/company_r3_create_game',
    'GET /rest/v1/company_r3_games',
    'GET /rest/v1/company_r3_state',
    'POST /rest/v1/rpc/company_r3_expire_stale_turn',
    'GET /rest/v1/company_r3_turns',
    'GET /rest/v1/company_r3_turn_jobs'
  ]);
  assert.equal(calls[0].body.p_profile.name, profile.name);
  assert.deepEqual([...calls[0].body.p_profile.name].map(char => char.codePointAt(0)), [0xAE40, 0xB3C4, 0xC724]);
});
