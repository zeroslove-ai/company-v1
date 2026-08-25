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
const GAME_ACCESS_SECRET = 'r3-test-secret';
const profile = {
  name: 'R3 Opening Player',
  department_id: content.departments[0].department_id,
  position_id: 'tf_lead',
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
  const gameId = path.match(/^\/api\/r3\/games\/([^/]+)/)?.[1];
  const capability = gameId ? worker.gameCapabilities?.get(gameId) : null;
  const headers = body ? { 'content-type': 'application/json' } : {};
  if (capability) headers.authorization = `Bearer ${capability}`;
  return worker.fetch(new Request(`https://r3.test${path}`, {
    method,
    headers,
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
  assert.equal(openingContext.opening_contract.first_day_at_company, true);
  assert.equal(openingContext.opening_contract.first_arrival_at_company, true);
  assert.equal(openingContext.opening_contract.first_appointment_context, true);
  assert.equal(openingContext.opening_contract.selected_department.id, profile.department_id);
  assert.equal(openingContext.opening_contract.selected_position.id, profile.position_id);
  assert.equal(openingContext.opening_contract.selected_formal_position_label, 'TF팀장');
  assert.equal(openingContext.opening_contract.selected_formal_position_must_be_explicitly_established, true);
  assert.equal(openingContext.opening_contract.selected_formal_position_may_not_be_normalized, true);
  assert.equal(openingContext.opening_contract.first_day_descriptors_may_surround_exact_position, true);
  assert.equal(openingContext.opening_contract.identity_arrival_and_app_premise_must_be_established_without_player_action, true);
  assert.equal(openingContext.opening_contract.identity_arrival_establishment_authority, 'narrator_world_artifact_or_npc_initiative');
  assert.equal(openingContext.opening_contract.player_remains_silent_and_action_free_before_first_literal, true);
  assert.equal(openingContext.opening_contract.selected_rank_must_remain_true, true);
  assert.equal(openingContext.opening_contract.no_prior_tenure_or_company_relationships, true);
  assert.equal(openingContext.opening_contract.player_must_discover_private_app, true);
  assert.equal(openingContext.opening_contract.npc_ignorance_until_player_reveals, true);
  assert.equal(openingContext.next_action_contract.author, 'story');
  assert.equal(openingContext.next_action_contract.count, 4);
  assert.equal(openingContext.next_action_contract.verbatim_observer_copy, true);
  assert.equal(openingContext.next_action_contract.current_story_only, true);
  assert.equal(openingContext.player_agency_contract.literal_action_is_player_choice, true);
  assert.equal(openingContext.opening_agency_contract.phase, 'before_first_player_input');
  assert.equal(openingContext.opening_agency_contract.voluntary_player_action_authority, 'empty_before_first_submitted_literal');
  assert.equal(openingContext.opening_agency_contract.validated_setup_facts_are_not_player_action_authority, true);
  assert.equal(openingContext.opening_agency_contract.passive_scene_exposure_allowed, true);
  assert.equal(openingContext.opening_agency_contract.passive_app_discovery_without_player_manipulation, true);
  assert.deepEqual(openingContext.opening_agency_contract.passive_exposure_examples, ['app_present', 'app_appears', 'app_visible', 'player_can_notice_app']);
  assert.deepEqual(openingContext.opening_agency_contract.voluntary_player_action_forbidden, [
    'speech_or_reply', 'nod_or_gesture', 'movement', 'touching', 'clicking', 'typing',
    'opening_closing_hiding_app', 'drinking_eating', 'reviewing_work',
    'acknowledging', 'deciding', 'accepting_refusing', 'other_intentional_action'
  ]);
  assert.equal(openingContext.opening_agency_contract.player_choice_must_remain_unmade, true);
  assert.equal(openingContext.opening_agency_contract.no_completed_player_action_before_first_literal, true);
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
  state.scene.scene_note = 'previous opening scene note must not become Observer authority';
  let receivedStory = '';
  for await (const delta of provider.story({ opening: true, context: { state: { state }, turns: [] }, content })) receivedStory += delta;
  const observed = await provider.observe({ context: { state: { state }, turns: [] }, literalAction: '', storyText: receivedStory, content });

  assert.equal(receivedStory, storyText);
  assert.equal(payloads.length, 2, 'one Story request and one Observer request only');
  const storySystem = payloads[0].messages[0].content;
  assert.match(storySystem, /discover|recognizing.*private app/i);
  assert.match(storySystem, /NPCs remain ignorant/i);
  assert.match(storySystem, /productivity, helpdesk, or chat-assistant/i);
  assert.match(storySystem, /exactly four distinct.*numbered 1 through 4/i);
  assert.match(storySystem, /plain text, not JSON/i);
  assert.match(storySystem, /Never escape quotation marks/i);
  assert.match(storySystem, /one action per line/i);
  assert.match(storySystem, /verbatim in the current Story/i);
  assert.match(storySystem, /active_rules contains an institutional rule/i);
  assert.match(storySystem, /ordinary requests without an applicable rule-owned same-turn authority exception/i);
  assert.match(storySystem, /exact active S1 subject\/counterparty scope matches/i);
  assert.match(storySystem, /takes precedence over this ordinary boundary/i);
  assert.match(storySystem, /An action outside that list remains an ordinary player request or instruction/i);
  assert.match(storySystem, /authoritative current-world institutional\/system fact already in force/i);
  assert.match(storySystem, /exact stated content and exact subject\/counterparty scope/i);
  assert.match(storySystem, /materially concerns a rule's scoped premise or observable consequence/i);
  assert.match(storySystem, /make that premise visibly true in natural narration/i);
  assert.match(storySystem, /do not silently ignore it/i);
  assert.match(storySystem, /Do not force exposition when the scene has no meaningful connection/i);
  assert.match(storySystem, /do not mechanically quote or copy the rule text/i);
  assert.match(storySystem, /activation alone must never imply personal affection/i);
  assert.match(storySystem, /mode=on_player_request or request-triggered trigger/i);
  assert.match(storySystem, /direct eligible request satisfies the trigger in this turn/i);
  assert.match(storySystem, /begin the rule-required behavior in this same Story turn/i);
  assert.match(storySystem, /Do not refuse, delay, substitute another action/i);
  assert.match(storySystem, /feelings cannot veto the rule's stated institutional execution/i);
  assert.match(storySystem, /Rule execution alone must not manufacture affection, comfort, consent, desire, romance, obedience-as-personality, trust, relationship/i);
  assert.match(storySystem, /execution_timing with request_triggered=true/i);
  assert.match(storySystem, /when_triggered and future_deferral_allowed values are authoritative/i);
  assert.match(storySystem, /recognized trigger into a future deferral/i);
  assert.doesNotMatch(storySystem, /masturbate_for_recipient|vaginal_sex_with_recipient|player_request_executes_immediately/i);
  assert.match(storySystem, /preserve that exact canonical destination name/i);
  assert.match(storySystem, /Opening-only product and agency law/i);
  assert.match(storySystem, /OPENING FORMAL-IDENTITY PRECEDENCE \+ OPENING PLAYER-AGENCY PRECEDENCE/i);
  assert.match(storySystem, /single combined Opening boundary owns the validated setup facts and the pre-literal agency boundary together/i);
  assert.match(storySystem, /exact canonical string.*immutable validated PLAYER setup fact/i);
  assert.match(storySystem, /must be explicitly established at least once in the Opening/i);
  assert.match(storySystem, /use that exact canonical label character-for-character/i);
  assert.match(storySystem, /Never normalize, shorten, paraphrase, infer, replace, downgrade, upgrade/i);
  assert.match(storySystem, /first-day or newly-arrived descriptor may surround the exact label but may not replace it/i);
  assert.match(storySystem, /generic or inferred title/i);
  assert.match(storySystem, /Before the first literal, voluntary PLAYER action authority is empty and PLAYER remains silent, free, and without any completed intentional action/i);
  assert.match(storySystem, /first-person PLAYER bridge action/i);
  assert.match(storySystem, /narrator\/world presentation, a natural company artifact or sign, or NPC initiative/i);
  assert.match(storySystem, /breathing.*speech.*reply.*gesture.*nod.*movement.*touch.*pocket or phone action/i);
  assert.match(storySystem, /combined Opening-specific rule overrides generic ordinary-turn consequence and arrival\/introduction wording/i);
  assert.match(storySystem, /before the first submitted literal.*voluntary PLAYER action authority is empty/i);
  assert.match(storySystem, /overrides any generic ordinary-turn consequence wording/i);
  assert.match(storySystem, /Validated setup facts.*never permission to invent a player action/i);
  assert.match(storySystem, /without the player placing.*picking up.*manipulating it/i);
  assert.match(storySystem, /Leave the player choice unmade/i);
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
    player_inner_thought: '',
    mind_monitor: {},
    media_hint: null,
    focal_actor: null,
    dialogue_lines: [],
    warnings: []
  });
  const observerSystem = payloads[1].messages[0].content;
  const observerContext = JSON.parse(payloads[1].messages[1].content);
  const expectedActorDirectory = [
    ...Object.values(content.characters).map(actor => ({ id: actor.character_id, name: actor.name })),
    ...content.generalNpcs.map(actor => ({ id: actor.id, name: actor.name }))
  ];
  assert.deepEqual(observerContext.canonical_actor_directory.map(({ id, name }) => ({ id, name })), expectedActorDirectory);
  assert.ok(observerContext.canonical_actor_directory.every(actor => actor.personality || actor.prompt_card?.personality || actor.role));
  const expectedLocationDirectory = content.locations.map(({ location_id, name }) => ({ location_id, name }));
  assert.deepEqual(observerContext.canonical_location_directory, expectedLocationDirectory);
  assert.equal(observerContext.canonical_location_directory.length, new Set(observerContext.canonical_location_directory.map(location => location.location_id)).size);
  assert.deepEqual(observerContext.canonical_location_directory.filter(({ location_id }) => ['brand_strategy_office', 'brand_strategy_meeting_room'].includes(location_id)), [
    { location_id: 'brand_strategy_office', name: content.locations.find(location => location.location_id === 'brand_strategy_office').name },
    { location_id: 'brand_strategy_meeting_room', name: content.locations.find(location => location.location_id === 'brand_strategy_meeting_room').name }
  ]);
  assert.equal(observerContext.current_context.scene.scene_note, undefined);
  assert.equal(observerContext.current_context.scene.location_id, state.scene.location_id);
  assert.deepEqual(observerContext.current_context.scene.present_actor_ids, state.scene.present_actor_ids);
  assert.deepEqual(observerContext.observer_scene_contract.prior_scene, {
    location_id: state.scene.location_id,
    present_actor_ids: state.scene.present_actor_ids
  });
  assert.match(observerContext.observer_scene_contract.post_story_snapshot, /prior_scene is a baseline only and is never the answer/i);
  assert.match(observerSystem, /exact top-level keys: elapsed_minutes, location, entered, exited, present_actor_ids, scene_note, clothing_changes, turn_summary, player_inner_thought, mind_monitor, choices, media_hint, and warnings/i);
  assert.match(observerSystem, /bounded registered character canon/i);
  assert.match(observerSystem, /canonical_location_directory.*exact registered \{location_id,name\} pairs/i);
  assert.match(observerSystem, /location\.location_id MUST come from canonical_location_directory/i);
  assert.match(observerSystem, /exact canonical actor IDs.*never actor names/i);
  assert.match(observerSystem, /exact contiguous quote must contain that actor's exact canonical name/i);
  assert.match(observerSystem, /Scene fields are one post-Story snapshot/i);
  assert.match(observerSystem, /present_actor_ids only as the prior-state baseline/i);
  assert.match(observerSystem, /enumerate every registered actor physically co-located/i);
  assert.match(observerSystem, /including a registered actor absent from the baseline who explicitly returns/i);
  assert.match(observerSystem, /Never omit a returning actor merely because that actor was absent from the baseline/i);
  assert.match(observerSystem, /do not invent a quote merely for bookkeeping/i);
  assert.match(observerSystem, /A remote or historical actor mention is not physical presence/i);
  assert.match(observerSystem, /present_actor_ids is the exact set of registered actors physically co-located in that player scene/i);
  assert.match(observerSystem, /Grounded entered\/exited evidence must agree with present_actor_ids/i);
  assert.match(observerSystem, /NPC-only movement never moves the player/i);
  assert.match(observerSystem, /If the current Story explicitly says.*enters, arrives at, moves to, or is now in/i);
  assert.match(observerSystem, /this evidence overrides merely copying the previous location from current_context/i);
  assert.match(observerSystem, /player literal action alone is intent\/input, not successful movement evidence/i);
  assert.match(observerSystem, /do not copy the previous location and do not return location_evidence/i);
  assert.match(observerSystem, /exact Story quote/i);
  assert.match(observerSystem, /exact four final numbered Story action strings/i);
  assert.match(observerSystem, /never invent, mutate, pad, truncate, deduplicate, or use prior-turn choices/i);
  assert.match(observerSystem, /scene_note is one bounded natural-language snapshot of the current post-Story scene/i);
  assert.match(observerSystem, /replacement state, not historical memory/i);
  assert.match(observerSystem, /Do not copy a previous scene_note merely because it existed in prior context/i);
  assert.match(observerSystem, /If the current Story does not ground a useful scene_note, return an empty string/i);
  assert.match(observerSystem, /natural first-person Korean/i);
  assert.match(observerSystem, /player_inner_thought/i);
  assert.match(observerSystem, /optional and must be empty unless literal_action explicitly establishes/i);
  assert.match(observerSystem, /completeness is mandatory for safely supported heroine speech/i);
  assert.match(observerSystem, /must return every such supported heroine line in dialogue_lines/i);
  assert.match(observerSystem, /dialogue_lines must not be \[\] in that case/i);
  assert.match(observerSystem, /do not omit a supported heroine line because focal_actor is null, general NPCs speak more often, or presentation metadata is otherwise optional/i);
  assert.match(observerSystem, /larger exact contiguous evidence_quote may span back to the nearest explicit canonical heroine-name attribution/i);
  assert.match(observerSystem, /never infer a speaker across an ambiguous speaker change/i);
  assert.match(observerSystem, /this completeness rule applies to registered heroines only/i);
  assert.match(observerSystem, /do not add general-NPC, player, narrator, thought, anonymous, or ambiguous lines/i);

  const correctedLocation = normalizeObserver({ location: { location_id: 'brand_strategy_office', quote: '브랜드전략팀 회의실에 들어선다.' } }, { storyText: '브랜드전략팀 회의실에 들어선다.', content, currentState: state });
  assert.equal(correctedLocation.location.location_id, 'brand_strategy_meeting_room');
  assert.ok(correctedLocation.warnings.includes('location_projection_corrected'));

  const ordinaryLiteralAction = 'Ask the team lead what changed in the meeting plan.';
  let ordinaryStory = '';
  for await (const delta of provider.story({ opening: false, literalAction: ordinaryLiteralAction, context: { state: { state }, turns: [] }, content })) ordinaryStory += delta;
  assert.equal(ordinaryStory, storyText);
  assert.equal(payloads.length, 3, 'ordinary Story uses its own single request after Opening Story and Observer');
  const ordinarySystem = payloads[2].messages[0].content;
  const ordinaryContext = JSON.parse(payloads[2].messages[1].content);
  assert.match(ordinarySystem, /For ordinary turns, preserve the submitted literal player action exactly/i);
  assert.match(ordinarySystem, /mode=on_player_request or request-triggered trigger/i);
  assert.match(ordinarySystem, /NPC reluctance, embarrassment, anger, protest, hesitation, surprise, dislike, or discomfort/i);
  assert.match(ordinarySystem, /must not manufacture affection, comfort, consent, desire, romance, obedience-as-personality, trust, relationship/i);
  assert.match(ordinarySystem, /execution_timing with request_triggered=true/i);
  assert.doesNotMatch(ordinarySystem, /masturbate_for_recipient|vaginal_sex_with_recipient|player_request_executes_immediately/i);
  assert.doesNotMatch(ordinarySystem, /Opening-only agency law/i);
  assert.equal(ordinaryContext.opening, false);
  assert.equal(ordinaryContext.literal_action, ordinaryLiteralAction);
  assert.equal(ordinaryContext.player_agency_contract.literal_action_is_player_choice, true);
  assert.deepEqual(ordinaryContext.player_agency_contract, sentContext.player_agency_contract);
  assert.equal(ordinaryContext.opening_contract, null);
  assert.equal(ordinaryContext.opening_agency_contract, null);
  assert.match(ordinarySystem, /supplied player_agency_contract is a fixed hard boundary/i);
  assert.match(ordinarySystem, /actor, target, action, movement\/destination, request, refusal, self-state, topic, and intent/i);
  assert.match(ordinarySystem, /consequences are allowed.*replace, invert, redirect, or contradict/i);
  assert.match(ordinarySystem, /not automatic proof of external outcome or NPC compliance/i);
  assert.match(ordinarySystem, /voluntary PLAYER movement.*sole authority/i);
  assert.match(ordinarySystem, /NPC-only movement.*remote target location.*never authorizes PLAYER standing to go, following, walking, approaching, entering, knocking, accompanying, returning/i);
  assert.match(ordinarySystem, /An external consequence may displace PLAYER only when the world physically causes it/i);
  assert.match(ordinarySystem, /remote instruction must be delivered without moving PLAYER/i);
  assert.match(ordinarySystem, /true explicit literal navigation remains supported/i);
  assert.deepEqual(ordinaryContext.player_movement_authority_contract, sentContext.player_movement_authority_contract);
  assert.equal(ordinaryContext.player_movement_authority_contract.submitted_literal_is_sole_voluntary_movement_authority, true);
});

test('R3 choice normalization keeps Story-owned choices when Observer choices are malformed', () => {
  const invalidChoices = [
    [],
    choices.slice(0, 3),
    [...choices, 'Take another action.'],
    [choices[0], choices[0], choices[2], choices[3]],
    choices.map(choice => `${choice}!`)
  ];
  for (const candidate of invalidChoices) {
    const normalized = normalizeObserver({ choices: candidate, previous_choices: choices }, { storyText, content, currentState: {} });
    assert.deepEqual(normalized.choices, choices);
    assert.ok(normalized.warnings.includes('choices_observer_mismatch'));
  }
});

test('R3 valid Story remains committed when Observer choice projection is unavailable without a second Story', async () => {
  let storyCalls = 0;
  let observerCalls = 0;
  const provider = {
    async *story() { storyCalls += 1; yield storyText; },
    async observe() { observerCalls += 1; return { choices: [] }; }
  };
  const worker = createR3Worker({ store: new InMemoryR3Store(), provider, content, gameAccessSecret: GAME_ACCESS_SECRET });
  const setup = await request(worker, '/api/r3/games', { method: 'POST', body: { profile } });
  const setupPayload = await setup.json();
  const gameId = setupPayload.data.game.game_id;
  worker.gameCapabilities = new Map([[gameId, setupPayload.data.game_capability]]);
  const opening = await events(await request(worker, `/api/r3/games/${gameId}/opening`, { method: 'POST' }));
  const terminal = opening.at(-1).data;
  assert.equal(terminal.status, 'committed');
  assert.equal(storyCalls, 1);
  assert.equal(observerCalls, 1);
  assert.equal(terminal.context.turns[0].story_text, storyText);
  assert.deepEqual(terminal.context.turns[0].choices, choices);
  assert.ok(terminal.context.turns[0].warnings.includes('choices_observer_mismatch'));
});

test('R3 choice normalization tolerates only symmetric terminal emphasis wrappers', () => {
  const emphasizedStory = storyText.replace(/^([1-4]\. .+)$/gm, '**$1**');
  const emphasized = normalizeObserver({ choices }, { storyText: emphasizedStory, content, currentState: {} });
  assert.deepEqual(emphasized.choices, choices);
  assert.deepEqual(emphasized.warnings, []);
  const underscoredStory = storyText.replace(/^([1-4]\. .+)$/gm, '__$1__');
  assert.deepEqual(normalizeObserver({ choices }, { storyText: underscoredStory, content, currentState: {} }).choices, choices);

  for (const malformed of [
    emphasizedStory.replace('**4.', '*4.'),
    emphasizedStory.replace('**3.', '**2.'),
    emphasizedStory.replace('**2. Ask the team lead about the morning meeting.**', '**2. **'),
    `${emphasizedStory}\n5. Extra action.`
  ]) {
    const normalized = normalizeObserver({ choices }, { storyText: malformed, content, currentState: {} });
    assert.equal(normalized.choices, null);
    assert.ok(normalized.warnings.includes('choices_projection_dropped'));
  }
});
