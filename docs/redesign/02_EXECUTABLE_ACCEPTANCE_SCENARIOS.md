# Company Redesign — Executable Acceptance Scenarios

Status: OWNER-REVIEW DRAFT / FOUR OPEN DECISIONS RESOLVED  
Date: 2026-08-21

These scenarios define whether the product is actually correct. They are not merely unit tests.

## Acceptance levels

- **P0 PRODUCT GATE**: failure means the build is not `상식개변: 회사편` or is not playable.
- **P1 CORE GAMEPLAY**: required before core runtime architecture is accepted.
- **P2 FEATURE**: required when that feature is activated.
- **P3 RESILIENCE**: required before broader rollout.

Every implementation task cites the exact scenario IDs it changes.

## A-SETUP-001 — Established player setup

Level: P0

Given a new adult game, setup deliberately supports every accepted profile field: name, department, position, age, height, weight, penis length, body type, speech style.

Pass:

- selected catalog IDs resolve from canonical content;
- stored profile survives refresh;
- Story receives only justified profile context;
- setup does not invent a player Story action.

## A-OPENING-001 — This is the Company game, not an assistant

Level: P0 / owner manual

Opening uses real Company location/people, establishes a living scene and private unfamiliar `상식개변` premise, makes clear the app has not automatically changed reality, avoids helpdesk framing/mandatory first-work quest, and leaves the next action to the player.

Owner recognizes the product before Turn 1.

## A-CANON-001 — Canonical cast/world only

Level: P0

- five heroines resolve exactly from `content/characters.json`;
- general NPCs resolve from `content/general_npcs.json`;
- locations resolve from `content/map.json`;
- no demo/shadow semantic list becomes runtime authority;
- prose cannot create a new registered identity by name inference alone.

## A-TURN-001 — Literal free-form action survives end-to-end

Level: P0

The exact typed/clicked full player action is persisted and supplied to Story.

Story may determine reaction/outcome but may not replace the requested target/action. A blocked action is narrated as blocked rather than rewritten. Refresh/history shows the same literal input.

## A-STREAM-001 — Story remains visible while streaming

Level: P0

- first Story content appears incrementally;
- no blocking loader covers arrived Story;
- disconnect/reconnect does not erase durable/progress text;
- progress status stays outside the reading surface.

## A-STORY-001 — Natural interactive fiction quality

Level: P0 / owner manual

Over five ordinary turns:

- no assistant/helpdesk voice;
- no OOC/self-repair/protocol garbage;
- no repeated scene restart;
- distinct character speech/personality persists;
- NPCs take natural small initiatives without stealing player agency;
- multi-NPC scenes can contain NPC-to-NPC reaction;
- company work remains context, not compulsory quest progression.

Green CI cannot override failure here.

## A-CHOICE-001 — Story authors four natural choices; Extract projects them

Level: P0

For every ordinary completed Story turn:

- the same Story LLM that wrote the scene also writes exactly four natural full-action suggestions based on that scene;
- no separate choice-generation LLM/API call exists;
- the choices are meaningfully different directions, not four paraphrases;
- the completed Story remains the source evidence for those choices;
- post-Story Extract/observer returns the four literal strings for button/UI use;
- Extract never invents a substitute choice not present in Story;
- clicking a choice submits the full literal choice text unchanged;
- free-form input remains available beside the buttons.

Failure behavior:

- if Extract cannot safely recover four current-turn choices, the valid Story still commits;
- choice buttons may be unavailable for that turn;
- free input remains usable;
- no previous-turn choice is reused as fallback;
- no second Story call is made just to repair choices.

## A-SCENE-001 — Location/presence continuity

Level: P1

Across movement and multi-character conversation, current registered location remains coherent, actors do not teleport, explicit departure is handled, omission from one Story does not automatically delete a still-present actor, and next Story receives committed scene state.

## A-SCENE-002 — Single `scene_note` preserves immediate physical continuity

Level: P1

Use one bounded replaceable natural-language `scene_note` plus separately structured location/present actors.

Test material facts such as:

- an NPC remains sitting on the player’s lap;
- a document remains on the table;
- someone is still holding an object;
- ongoing close contact/conversation remains true.

Pass:

- next turns preserve supported facts until Story changes them;
- scene_note is rewritten rather than accumulated into a ledger;
- uncertain details are not invented;
- player can request standing, moving, putting someone down, ending contact, etc. unless a real active rule/physical condition prevents it;
- no generic posture/contact/action ontology is introduced in parallel.

If owner manual play exposes a concrete continuity failure that one scene_note cannot solve, document that exact failure before proposing extra structure.

## A-CONVERSATION-001 — Question/answer continuity

Level: P1

If Turn N ends with a direct question/request/decision, Turn N+1 responds to it or gives a character-grounded reason to avoid/postpone it. It does not restart introductions or ignore the exchange.

## A-MEMORY-001 — Beyond recent raw context

Level: P1 / owner 20+ turn manual

A distinctive earlier committed fact/decision/conflict remains available after leaving the recent raw window. Older events come through grounded chronological memory; blank optional summary cannot erase them; memory adds no facts absent from committed Story.

## A-MIND-001 — Relevant character Mind Monitor

Level: P1

- UI uses real names, not internal IDs;
- `surface` and `subconscious` differ meaningfully and reflect canon/current events;
- irrelevant office residents do not receive entries by default;
- monitor invents no unestablished event/contact;
- monitor failure does not fail/regenerate Story.

## A-PLAYER-METER-REMOVED-001 — No dynamic sexual gauge survives redesign

Level: P0/P1 structural product check

Pass only when the active redesigned runtime/frontend/prompt/observer/tests contain no gameplay authority for:

- arousal meter;
- erection state;
- ejaculation progress/count;
- sexual-event ledger used to drive those meters;
- compatibility-only zombie fields for the removed mechanic.

Static adult setup/profile information such as penis length may remain under the accepted setup contract.

## A-CSA-CATALOG-001 — Exactly the nine-rule MVP

Level: P2 / hard CSA gate

Active catalog contains exactly 3 weak + 3 medium + 3 strong templates from `07_CSA_MVP_CATALOG.md`. Historical non-MVP templates cannot activate through source/runtime/API/stale client/hidden UI/test fixtures. A tenth rule requires a new owner decision and acceptance scenario.

## A-CSA-SCOPE-001 — Flexible scope without a generic execution DSL

Level: P2

The player may configure retained rules with flexible supported subject/counterparty scope rather than being forced to one historical hard-coded pairing.

Pass:

- UI/API share one finite canonical scope vocabulary;
- subject scope is selectable where the rule meaning is coherent;
- rules that need a counterparty allow a supported counterparty scope independently;
- unary rules do not require meaningless counterparty input;
- selected scope is persisted literally with the active rule and projected literally to next Story;
- valid flexible scope is not silently narrowed by template-specific historical defaults;
- invalid/unknown scope IDs are rejected structurally;
- scope flexibility does not create a generic action/execution DSL or consent/relationship inference engine.

If source audit shows the intended flexible model has material complexity/semantic problems, implementation stops and returns concrete evidence to owner instead of narrowing scope silently.

## A-CSA-001 — Rule application is not a fake Story turn

Level: P2

Applying/changing/removing one of the nine valid rules reports transaction success/failure, does not advance ordinary gameplay turn, inserts no fake literal action, and next Story receives the active rule state. NPC emotional response remains character-authored rather than inferred as affection/consent.

## A-CSA-002 — Rule effect stays exact

Level: P2

A retained rule affects only its selected subject/counterparty scope and its stated mechanic/premise. It does not imply unrelated romance, obedience, comfort, arousal, trust or generic permission. Removal stops future premise enforcement without rewriting committed Story history.

## A-CLOTHING-001 — Four-slot exact continuity

Level: P2

For retained clothing rules:

- exact rule-required clothing state synchronizes deterministically for affected actors;
- ordinary clothing changes require Story-grounded observation;
- one actor’s evidence cannot mutate another actor’s clothing;
- state persists until Story/rule changes it.

## A-FEEDBACK-001 — Revise latest turn, do not advance chronology

Level: P2 if activated

Original revision remains auditable, replacement Story belongs to the same chronological turn, failure leaves previous committed revision intact, and subsequent context uses accepted latest revision.

## A-RESET-001 — Safe new game/reset

Level: P2

Reset/new game affects only selected game; preserved evidence games are never reused/reset; test UUID is fresh where applicable; new game reaches valid Setup/Opening.

## A-MEDIA-001 — Media cannot break the game

Level: P2 if Image/TTS activated

Story commit succeeds despite media failure; TTS OFF causes zero TTS API calls; media never changes world truth.

## A-RECOVERY-001 — One user action cannot become two turns

Level: P3

Under double click, reconnect, stale worker wakeup, explicit retry and interruption: one `(game, turn)` has one canonical active attempt; stale attempt cannot mutate a newer retry; exactly one successful committed turn results; committed literal action and Story belong to the same attempt; no retry-until-lucky occurs.

## A-OBSERVE-001 — Observation failure is local

Level: P3

If valid Story succeeds but optional observation/MM/summary/choice projection partially fails, Story remains usable/committable under accepted fallback, no second Story is generated, unrelated state is not invented, and memory fallback preserves committed Story.

## A-REFRESH-001 — Refresh/reconnect parity

Level: P3

At Opening, idle, in-flight and post-Commit states, refresh reconstructs the same canonical game from server state. Frontend cache is not gameplay authority.

## A-UI-001 — Product surface completeness

Level: P0/P1 depending surface

Compare deployed UI against Golden UI checklist. It must include Story-authored choice suggestions + free input, must omit the removed dynamic player sexual gauge, and must not silently delete accepted surfaces.

## Owner manual-play cadence

1. Opening-only review before deep stabilization.
2. 3–5 turn owner play for Story + four choices + free input + scene_note + Mind Monitor.
3. 10–20 turn owner play for continuity/memory.
4. Implement/test the exact 9-rule CSA MVP with flexible scope.
5. Only after those 9 are accepted may one additional rule be considered.
6. Secondary media/feedback systems follow after core stability.

Automated long-play is diagnostic only and never substitutes for owner product acceptance.
