import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { createInitialState } from '../runtime-r3/domain/contracts.js';
import { buildOpeningContext } from '../runtime-r3/domain/story.js';
import { normalizeObserver } from '../runtime-r3/domain/observer-normalizer.js';
import { createR3Provider } from '../runtime-r3/server/provider.js';
import { createR3Worker } from '../runtime-r3/server/worker.js';
import { InMemoryR3Store } from '../runtime-r3/server/store.js';

const content = loadCanonicalCompanyR3Content();
const profile = {
  name: 'R3 Opening Player',
  department_id: content.departments[0].department_id,
  position_id: content.positions[0].position_id,
  age: 29,
  height_cm: 178,
  weight_kg: 72,
  penis_length_cm: 14,
  body_type_id: content.bodyTypes[0].body_type_id,
  speech_style_id: content.speechStyles[0].speech_style_id
};

const choices = [
  'Inspect the unfamiliar app without showing it to anyone.',
  'Ask the team lead about the morning meeting.',
  'Watch the nearby coworkers before choosing what to do.',
  'Write a private note and keep the app screen hidden.'
];
const storyText = [
  'The player notices an unfamiliar private app on the office computer.',
  'The registered coworkers continue their morning work without knowing the app.',
  '',
  '1. Inspect the unfamiliar app without showing it to anyone.',
  '2. Ask the team lead about the morning meeting.',
  '3. Watch the nearby coworkers before choosing what to do.',
  '4. Write a private note and keep the app screen hidden.'
].join('\n');

function jsonResponse(payload) {
  return new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } });
}

function storyStream(text) {
  const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] });
  return new Response(`data: ${chunk}\n\ndata: [DONE]\n\n`, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

async function request(worker, path, { method = 'GET', body } = {}) {
  return worker.fetch(new Request(`https://r3.test${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  }));
}

async function events(response) {
  const text = await response.text();
  return [...text.matchAll(/event: ([^\n]+)\ndata: ([^\n]+)/g)].map(match => ({ event: match[1], data: JSON.parse(match[2]) }));
}

test('R3 Opening context and provider prompts require private premise discovery and Story-owned choices', async () => {
  const state = createInitialState(profile, content.locations[0].location_id);
  const openingContext = buildOpeningContext({ state: { state }, turns: [] }, content);
  assert.equal(openingContext.opening, true);
  assert.equal(openingContext.opening_contract.product_title, openingContext.product.title);
  assert.equal(openingContext.opening_contract.private_app_name, openingContext.product.app_name);
  assert.equal(openingContext.opening_contract.player_must_discover_private_app, true);
  assert.equal(openingContext.opening_contract.npc_ignorance_until_player_reveals, true);
  assert.equal(openingContext.next_action_contract.author, 'story');
  assert.equal(openingContext.next_action_contract.count, 4);
  assert.equal(openingContext.next_action_contract.verbatim_observer_copy, true);
  assert.equal(openingContext.next_action_contract.current_story_only, true);
  assert.equal(openingContext.opening_agency_contract.phase, 'before_first_player_input');
  assert.equal(openingContext.opening_agency_contract.passive_scene_exposure_allowed, true);
  assert.deepEqual(openingContext.opening_agency_contract.passive_exposure_examples, ['app_present', 'app_appears', 'app_visible', 'player_can_notice_app']);
  assert.deepEqual(openingContext.opening_agency_contract.voluntary_player_action_forbidden, [
    'speech_or_reply', 'nod_or_gesture', 'movement', 'touching', 'clicking', 'typing',
    'opening_closing_hiding_app', 'drinking_eating', 'reviewing_work',
    'acknowledging', 'deciding', 'accepting_refusing', 'other_intentional_action'
  ]);
  assert.equal(openingContext.opening_agency_contract.player_choice_must_remain_unmade, true);
  assert.equal(openingContext.opening_agency_contract.end_with_player_agency, true);

  const payloads = [];
  const provider = createR3Provider({
    env: { LLM_API_URL: 'https://llm.test', LLM_API_KEY: 'key', STORY_MODEL: 'story', EXTRACT_MODEL: 'observer' },
    fetchImpl: async (_url, init) => {
      const payload = JSON.parse(init.body);
      payloads.push(payload);
      if (payload.stream) return storyStream(storyText);
      return jsonResponse({ choices: [{ message: { content: JSON.stringify({ choices }) } }] });
    }
  });
  let receivedStory = '';
  for await (const delta of provider.story({ opening: true, context: { state: { state }, turns: [] }, content })) receivedStory += delta;
  const observed = await provider.observe({ context: { state: { state }, turns: [] }, literalAction: '', storyText: receivedStory });

  assert.equal(receivedStory, storyText);
  assert.equal(payloads.length, 2, 'one Story request and one Observer request only');
  const storySystem = payloads[0].messages[0].content;
  assert.match(storySystem, /discover|recognizing.*private app/i);
  assert.match(storySystem, /NPCs remain ignorant/i);
  assert.match(storySystem, /productivity, helpdesk, or chat-assistant/i);
  assert.match(storySystem, /exactly four distinct.*numbered 1 through 4/i);
  assert.match(storySystem, /verbatim in the current Story/i);
  assert.match(storySystem, /Opening-only product and agency law/i);
  assert.match(storySystem, /passive scene exposure is allowed/i);
  for (const forbidden of ['speech or reply', 'nod or gesture', 'movement', 'touching', 'clicking', 'typing', 'opening, closing, hiding the app', 'drinking, eating', 'reviewing, working', 'acknowledging, deciding', 'accepting, refusing', 'other intentional player action']) {
    assert.match(storySystem, new RegExp(forbidden.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&'), 'i'));
  }
  assert.match(storySystem, /End with the player still free to choose among the four Story-authored actions or free-form input/i);
  const sentContext = JSON.parse(payloads[0].messages[1].content);
  assert.deepEqual(sentContext.opening_contract, openingContext.opening_contract);
  assert.deepEqual(sentContext.opening_agency_contract, openingContext.opening_agency_contract);
  assert.deepEqual(observed.choices, choices);
  assert.deepEqual(normalizeObserver(observed, { storyText, content, currentState: state }), {
    elapsed_minutes: 0,
    entered: [],
    exited: [],
    scene_note: null,
    clothing_changes: [],
    choices,
    turn_summary: '',
    mind_monitor: {},
    warnings: []
  });
  const observerSystem = payloads[1].messages[0].content;
  assert.match(observerSystem, /exact four final numbered Story action strings/i);
  assert.match(observerSystem, /never invent, mutate, pad, truncate, deduplicate, or use prior-turn choices/i);

  const ordinaryLiteralAction = 'Ask the team lead what changed in the meeting plan.';
  let ordinaryStory = '';
  for await (const delta of provider.story({ opening: false, literalAction: ordinaryLiteralAction, context: { state: { state }, turns: [] }, content })) ordinaryStory += delta;
  assert.equal(ordinaryStory, storyText);
  assert.equal(payloads.length, 3, 'ordinary Story uses its own single request after Opening Story and Observer');
  const ordinarySystem = payloads[2].messages[0].content;
  const ordinaryContext = JSON.parse(payloads[2].messages[1].content);
  assert.match(ordinarySystem, /For ordinary turns, preserve the submitted literal player action exactly/i);
  assert.doesNotMatch(ordinarySystem, /Opening-only agency law/i);
  assert.equal(ordinaryContext.opening, false);
  assert.equal(ordinaryContext.literal_action, ordinaryLiteralAction);
  assert.equal(ordinaryContext.opening_contract, null);
  assert.equal(ordinaryContext.opening_agency_contract, null);
});

test('R3 choice normalization fails closed for non-verbatim or non-four current Story choices', () => {
  const invalidChoices = [
    [],
    choices.slice(0, 3),
    [...choices, 'Take another action.'],
    [choices[0], choices[0], choices[2], choices[3]],
    choices.map(choice => `${choice}!`)
  ];
  for (const candidate of invalidChoices) {
    const normalized = normalizeObserver({ choices: candidate, previous_choices: choices }, { storyText, content, currentState: {} });
    assert.equal(normalized.choices, null);
    assert.ok(normalized.warnings.includes('choices_projection_dropped'));
  }
});

test('R3 valid Story remains committed when choice projection is unavailable without a second Story', async () => {
  let storyCalls = 0;
  let observerCalls = 0;
  const provider = {
    async *story() { storyCalls += 1; yield storyText; },
    async observe() { observerCalls += 1; return { choices: [] }; }
  };
  const worker = createR3Worker({ store: new InMemoryR3Store(), provider, content });
  const setup = await request(worker, '/api/r3/games', { method: 'POST', body: { profile } });
  const setupPayload = await setup.json();
  const gameId = setupPayload.data.game.game_id;
  const opening = await events(await request(worker, `/api/r3/games/${gameId}/opening`, { method: 'POST' }));
  const terminal = opening.at(-1).data;
  assert.equal(terminal.status, 'committed');
  assert.equal(storyCalls, 1);
  assert.equal(observerCalls, 1);
  assert.equal(terminal.context.turns[0].story_text, storyText);
  assert.deepEqual(terminal.context.turns[0].choices, []);
  assert.ok(terminal.context.turns[0].warnings.includes('choices_projection_dropped'));
});
