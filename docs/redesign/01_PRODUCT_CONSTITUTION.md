# Company Redesign — Product Constitution

Status: OWNER-REVIEW DRAFT  
Date: 2026-08-21

This document defines the game before defining the runtime.

## P-IDENTITY-001 — Product identity

Status: OWNER_LOCKED

- Title/product identity: `상식개변: 회사편`.
- Genre: adult company-life interactive fiction / character simulation.
- It is not a productivity assistant, office chatbot, quest checklist, or work simulator whose purpose is to complete business tasks.
- Company work, hierarchy, meetings, documents, schedules, and office spaces are world texture and social context, not mandatory objectives for every turn.

## P-PREMISE-001 — Private `상식개변` premise

Status: OWNER_LOCKED

- The player possesses an unfamiliar private app/tool called `상식개변`.
- At the beginning, the player does not remember installing it.
- It can establish/change/remove rules that affected people accept as ordinary according to the rule’s actual scope.
- NPCs do not automatically know the app exists.
- Merely possessing/opening the app does not change reality.
- Rule activation changes only the rule’s stated institutional/world premise. It does not automatically create affection, comfort, private consent, sexual desire, obedience, trust, romance, or unrelated physical facts.
- Applying/removing a rule is a system transaction, not automatically a player-authored narrative turn.

## P-AGENCY-001 — Literal player agency

Status: OWNER_LOCKED

- Free-form player input must always be available during ordinary play.
- The player’s material actor, target, requested action, direction, request, refusal, self-state, and intent may not be silently substituted by the runtime or Story.
- Story decides response, feasibility, consequences, NPC reaction, and outcome; it does not rewrite the requested action into a safer/easier/different action.
- If an action is physically/socially blocked, Story should narrate the block/reaction rather than pretend the player asked for something else.
- Player requests may interrupt or change ongoing poses/rules where the active rule itself does not structurally forbid that interruption.

## P-STORY-001 — Story-first experience

Status: OWNER_LOCKED

- Rich natural narrative is the primary game surface.
- Story must visibly stream; no blocking loading overlay may cover the narrative while generation is in progress.
- NPCs are characters with their own personality, work, attention, reactions, and initiative. They are not passive API responders.
- Multi-character scenes should allow NPC-to-NPC reaction when context warrants it.
- The world should feel inhabited by ongoing company activity without turning every scene into mandatory work progression.
- Repetitive scene restart, generic assistant language, protocol/OOC self-repair text, or status-report prose is a product failure.

## P-CONTENT-001 — Canonical Company world

Status: OWNER_LOCKED

Repository `content/*.json` is the semantic source of truth for established finite world identity.

At redesign start this includes:

- edition/title from `content/edition.json`;
- five heroines from `content/characters.json`: 서원희, 윤민아, 김제나, 한리브, 이메이;
- registered general NPC catalog from `content/general_npcs.json`;
- company map/location catalog from `content/map.json`;
- organization/department, position, body-type, speech-style catalogs;
- CSA preset definitions.

Runtime/frontend/SQL/tests may not maintain a second hand-written semantic catalog.

Adding/removing/changing canonical characters or locations is a content decision, not a runtime convenience.

## P-CHARACTER-001 — Character identity and autonomy

Status: OWNER_LOCKED

- Stable registered character IDs are authoritative for structured identity.
- Character prompt-card personality, speech, addressing, appearance, role, and distinctive traits must be available to Story when the character is relevant.
- Character voice must remain recognizably different across long play.
- Work cooperation is not affection; hierarchy is not private submission; rule compliance is not emotional acceptance.
- Characters may simultaneously comply institutionally and dislike/resent/be embarrassed by the rule or situation.
- NPCs do not teleport, change identity, or borrow another NPC’s dialogue/state because of name matching or Extract ambiguity.

## P-OPENING-001 — Opening

Status: OWNER_LOCKED

Opening must establish:

1. the real Company setting and actual registered people/space;
2. a living scene rather than a helpdesk greeting;
3. the player-private `상식개변` premise;
4. the fact that the app has not automatically changed reality;
5. player freedom to choose what to do next.

Opening must not invent a mandatory first-work quest or speak for the player beyond setup facts.

## P-INPUT-001 — Choices vs free input

Status: OPEN_DECISION

Free-form input is mandatory.

Choice buttons, if retained, are only optional suggestions for convenience. They can never:

- replace free input;
- become the only legal next action;
- shorten/change the literal action submitted when clicked;
- be restored from a prior turn as fake current options.

Whether the final product shows exactly four Story-authored choices, no choices, or context-dependent optional suggestions is intentionally OPEN in this redesign and must be owner-decided after UI/experience review.

## P-MIND-001 — Mind Monitor

Status: OWNER_LOCKED

Mind Monitor is a core Company product surface.

- It represents relevant NPC internal perspective, not objective world truth.
- Canonical conceptual fields: `surface` and `subconscious`.
- It must be character-specific natural first-person Korean, not state labels/system terminology.
- It must never invent events, actions, memories, agreements, or contacts that did not occur.
- It is presentation/interpretation and must not control Story success, Commit, relationship state, or rule execution.
- Missing/failed Mind Monitor may degrade locally; it must never destroy a valid Story turn.
- Only relevant/current-scene characters should normally appear.

Exact generation call placement is an architecture decision, not a product law.

## P-SCENE-001 — Spatial and interaction continuity

Status: OWNER_LOCKED

- Location and present actors must remain coherent across turns.
- Story must remember immediately relevant current spatial/interaction facts: who is where, ongoing contact/pose when material, held/placed objects, and active conversation.
- A turn boundary alone does not reset physical/social continuity.
- Player action can naturally end/change an ongoing pose/contact unless the actual world rule or physical situation says otherwise.
- The implementation must not solve this requirement by inventing a giant generic physical-action taxonomy.

The exact durable representation is an L3/L4 design decision.

## P-MEMORY-001 — Long-play continuity

Status: OWNER_LOCKED

- The game must remain coherent beyond the recent-turn context window.
- Important prior conversations, decisions, rule changes, relationship-relevant events, promises, conflicts, and scene history must not disappear merely because they aged out of the last N raw turns.
- Long-term memory must stay chronological and grounded in committed Story.
- Missing optional summary generation cannot erase committed events.
- The memory system must not fabricate a semantic ledger of facts the Story never established.

## P-CSA-001 — `상식개변` rule behavior

Status: OWNER_LOCKED

- CSA/rule state is a real game mechanic and durable system premise.
- Apply/change/remove actions are explicit transactions with clear success/failure.
- They do not consume a fake player Story turn.
- The next Story sees the new active rule state.
- Exact finite mechanics explicitly encoded by a rule (for example exact required clothing slots if retained) may have deterministic state projection.
- Open-ended consequences remain Story-authored; no generic CSA execution DSL should replace narrative reasoning.

## P-CLOTHING-001 — Clothing continuity

Status: RETAIN_BY_DEFAULT

The established four-slot model is the preferred finite clothing mechanic because it is concrete and has current product value:

- uniform_top
- uniform_bottom
- underwear_top
- underwear_bottom

Exact structured CSA clothing requirements may update it deterministically. Ordinary Story changes require Story-grounded observation.

The redesign may remove or alter this only by explicit owner decision.

## P-PHYSICAL-001 — Generic physical state

Status: OPEN_DECISION

Do not assume the old posture/position model survives.

The product requirement is continuity, not a specific ontology. L3 must compare at least:

- natural-language current scene snapshot;
- minimal structured pose/contact state;
- no durable physical state beyond Story/memory;
- another simpler model.

Choose only what is needed to pass the acceptance scenarios.

## P-PLAYER-STATE-001 — Player meters / sexual mechanic

Status: OPEN_DECISION

Player sexual/arousal/erection/ejaculation UI existed historically but is not automatically part of the redesign core.

If retained, it must be a narrow explicit game mechanic with one writer and no sexual-event taxonomy. If removed, state/UI/prompt/tests must be removed coherently.

No implementation may keep zombie fields merely for compatibility.

## P-SETUP-001 — Player setup

Status: RETAIN_BY_DEFAULT

Established setup currently includes:

- name;
- department;
- position;
- age;
- height;
- weight;
- penis length;
- body type;
- speech style.

All players/characters in this adult game are adults.

Before implementation, L2/L3 must classify each field as profile identity, prompt-only context, UI-visible information, or removable. No field may disappear merely because a minimal DB schema does not currently support it.

## P-UI-001 — Product surfaces

Status: RETAIN_BY_DEFAULT

The completed Company UI is evidence of intended product surfaces, not necessarily frozen layout.

The redesign should deliberately account for:

- Story/history/current stream;
- free-form action input;
- player setup;
- character/current scene state;
- Mind Monitor;
- player state;
- company map;
- `상식개변` app entry/overlay;
- image/media surface;
- TTS controls;
- history/download;
- feedback revision;
- reset;
- responsive/mobile information order.

Layout may be redesigned if the owner prefers, but a surface cannot silently vanish due to Phase convenience.

## P-MEDIA-001 — Image and TTS

Status: RETAIN_BY_DEFAULT

- Image and TTS are presentation sidecars.
- Their failure must never block or redefine Story/Commit.
- TTS OFF must make zero TTS API calls.
- Media selection may not become narrative truth authority.

## P-FEEDBACK-001 — Feedback revision

Status: RETAIN_BY_DEFAULT

The player should be able to request correction of the latest committed turn without treating the correction as a new chronological gameplay turn.

Exact revision persistence is an architecture decision.

## P-RESET-001 — Reset/new game

Status: RETAIN_BY_DEFAULT

Reset/new-game behavior must be explicit, safe, and game-local. It must never mutate preserved evidence games or silently reuse a prior manual-test UUID.

## P-REMOVED-001 — Explicitly removed mechanics

Status: OWNER_LOCKED

Do not reintroduce without a new owner product decision:

- standalone NPC find/search feature;
- bold-choice probability/risk UI and generic success-rate rolls;
- hypnosis/personal suggestion system from Hospital;
- generic `physical_reaction` Mind Monitor field;
- arbitrary server-generated save patches;
- automatic retry/regenerate-until-lucky Story behavior;
- generic assistant/helpdesk framing.

## P-QUALITY-001 — Player acceptance outranks internal correctness

Status: OWNER_LOCKED

A release is not considered successful because CI, schema validation, source review, or hundreds of unit tests pass.

For player-facing changes, relevant L1 manual scenarios must pass on the exact deployed build. Product rejection by the owner blocks progression even when infrastructure tests are green.
