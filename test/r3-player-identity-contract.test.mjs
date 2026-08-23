import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { createInitialState } from '../runtime-r3/domain/contracts.js';
import { buildStoryContext } from '../runtime-r3/domain/memory.js';
import { buildOpeningContext } from '../runtime-r3/domain/story.js';
import { reduceObservation } from '../runtime-r3/domain/reducer.js';
import { createR3Provider } from '../runtime-r3/server/provider.js';

const content = loadCanonicalCompanyR3Content();

function profile(department_id, position_id, name = '정확한 플레이어') {
  return {
    name,
    department_id,
    position_id,
    age: 31,
    height_cm: 178,
    weight_kg: 72,
    penis_length_cm: 14,
    body_type_id: content.bodyTypes[0].body_type_id,
    speech_style_id: content.speechStyles[0].speech_style_id
  };
}

function contextFor(playerProfile) {
  const location = content.locations[0].location_id;
  const state = createInitialState(playerProfile, location, ['heroine1']);
  return { state: { state }, turns: [] };
}

function storyStream(text) {
  const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] });
  return new Response(`data: ${chunk}\n\ndata: [DONE]\n\n`, { headers: { 'content-type': 'text/event-stream' } });
}

test('canonical player identity is projected identically on Opening and ordinary Story turns', () => {
  const player = profile('new_business_tf', 'executive', '서윤호');
  const context = contextFor(player);
  const ordinary = buildStoryContext(context, '명함을 확인한다.', { content });
  const opening = buildOpeningContext(context, content);
  const expected = {
    name: '서윤호',
    department: { id: 'new_business_tf', name: '신사업TF' },
    position: { id: 'executive', name: '임원' }
  };
  assert.deepEqual(ordinary.canonical_player_identity, expected);
  assert.deepEqual(opening.canonical_player_identity, expected);
  assert.deepEqual(ordinary.player_identity_contract, opening.player_identity_contract);
});

test('canonical player identity is not executive-specific and preserves junior identity', () => {
  const player = profile('brand_strategy', 'intern', '홍길동');
  const context = contextFor(player);
  const identity = buildStoryContext(context, '명함을 확인한다.', { content }).canonical_player_identity;
  assert.deepEqual(identity, {
    name: '홍길동',
    department: { id: 'brand_strategy', name: '브랜드전략팀' },
    position: { id: 'intern', name: '인턴' }
  });
});

test('player identity contract forbids formal rank substitution and inference', () => {
  const contract = buildStoryContext(contextFor(profile('new_business_tf', 'executive')), '행동', { content }).player_identity_contract;
  assert.equal(contract.canonical_facts_are_authoritative, true);
  assert.deepEqual(contract.preserve_exactly, ['name', 'department', 'formal_position/rank']);
  assert.match(contract.formal_identity_boundary, /authoritative Story facts on every turn/i);
  assert.match(contract.formal_identity_boundary, /business-card identity.*badge identity.*introduction.*signature.*address/i);
  assert.match(contract.no_inference_boundary, /NPC roles.*scene context.*seniority stereotypes.*model inference/i);
});

test('ordinary Story provider sends canonical identity and hard boundary, not only Opening', async () => {
  const player = profile('new_business_tf', 'executive', '서윤호');
  const context = contextFor(player);
  const payloads = [];
  const provider = createR3Provider({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'key', STORY_MODEL: 'story', EXTRACT_MODEL: 'observer' },
    fetchImpl: async (_url, init) => {
      payloads.push(JSON.parse(init.body));
      return storyStream('사무실 안의 아침 풍경이다.\n\n1. 주변을 살핀다.\n2. 자리에 앉는다.\n3. 동료에게 인사한다.\n4. 잠시 쉰다.');
    }
  });
  let story = '';
  for await (const delta of provider.story({ context, content, literalAction: '명함을 확인한다.' })) story += delta;
  assert.match(story, /사무실 안의 아침/);
  assert.equal(payloads.length, 1);
  const sentContext = JSON.parse(payloads[0].messages[1].content);
  assert.deepEqual(sentContext.canonical_player_identity, {
    name: '서윤호',
    department: { id: 'new_business_tf', name: '신사업TF' },
    position: { id: 'executive', name: '임원' }
  });
  assert.match(payloads[0].messages[0].content, /canonical_player_identity.*player_identity_contract/i);
  assert.match(payloads[0].messages[0].content, /Never replace, normalize, downgrade, upgrade, or invent/i);
});

test('Observer/reducer path has no authority to mutate canonical player identity', () => {
  const player = profile('new_business_tf', 'executive', '서윤호');
  const state = createInitialState(player, content.locations[0].location_id, ['heroine1']);
  const reduced = reduceObservation({
    state,
    turnNumber: 1,
    observation: { profile: { department_id: 'brand_strategy', position_id: 'intern' }, elapsed_minutes: 3, scene_note: '현재 장면' }
  });
  assert.deepEqual(reduced.state.profile, player);
});
