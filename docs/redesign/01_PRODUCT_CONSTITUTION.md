# Company Redesign — Product Constitution

Status: OWNER-REVIEW DRAFT  
Date: 2026-08-21

This document defines the game before defining the runtime. Lower-level architecture/tasks may implement these requirements but may not weaken or reinterpret them.

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
- If an action is physically/socially blocked, Story narrates the block/reaction rather than pretending the player requested something else.
- Ongoing scene states do not become invisible rails. A player may naturally request interruption/change unless an actually active rule or physical condition directly governs that behavior.

## P-STORY-001 — Story-first experience

Status: OWNER_LOCKED

- Rich natural narrative is the primary game surface.
- Story must visibly stream; no blocking loading overlay may cover the narrative while generation is in progress.
- NPCs have their own personality, work, attention, reactions, and initiative. They are not passive API responders.
- Multi-character scenes should allow NPC-to-NPC reaction when context warrants it.
- The world should feel inhabited by ongoing company activity without turning every scene into mandatory work progression.
- Repetitive scene restart, generic assistant language, protocol/OOC self-repair text, or status-report prose is a product failure.

## P-CONTENT-001 — Canonical Company world

Status: OWNER_LOCKED

Repository content is the semantic source of truth for finite established world identity.

At redesign start this includes:

- edition/title from `content/edition.json`;
- five heroines from `content/characters.json`: 서원희, 윤민아, 김제나, 한리브, 이메이;
- registered general NPC catalog from `content/general_npcs.json`;
- company map/location catalog from `content/map.json`;
- organization/department, position, body-type, speech-style catalogs;
- the **accepted active CSA catalog**, governed by `07_CSA_MVP_CATALOG.md`.

Important CSA correction:

- the historical 44-rule `content/csa_presets.json` is evidence/source material, **not automatically the forward active product catalog**;
- first playable redesign exposes exactly the owner-approved 9-rule MVP;
- when implementation begins, there must be one active semantic CSA source rather than a 44-rule source plus scattered 9-rule allowlists.

Runtime/frontend/SQL/tests may not maintain a second hand-written semantic catalog.

## P-CHARACTER-001 — Character identity and autonomy

Status: OWNER_LOCKED

- Stable registered character IDs are authoritative for structured identity.
- Character prompt-card personality, speech, addressing, appearance, role, and distinctive traits must be available to Story when relevant.
- Character voice must remain recognizably different across long play.
- Work cooperation is not affection; hierarchy is not private submission; rule compliance is not emotional acceptance.
- Characters may comply institutionally while disliking, resenting, or being embarrassed by a situation.
- NPCs do not teleport, change identity, or borrow another NPC’s dialogue/state because of name matching or observer ambiguity.

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

Choice buttons, if retained, are optional convenience suggestions only. They can never replace free input, become the only legal next action, alter the literal submitted action, or revive prior-turn options as fake current choices.

Whether the final product shows four Story-authored suggestions, no choices, or context-dependent suggestions remains OPEN until UI/experience review.

## P-MIND-001 — Mind Monitor

Status: OWNER_LOCKED

Mind Monitor is a core Company product surface.

- It represents relevant NPC internal perspective, not objective world truth.
- Conceptual fields: `surface` and `subconscious`.
- It is character-specific natural first-person Korean, not state labels/system terminology.
- It may not invent events, actions, memories, agreements, or contacts that did not occur.
- It is presentation/interpretation and must not control Story success, Commit, relationship state, or rule execution.
- Missing/failed Mind Monitor degrades locally and must never destroy a valid Story turn.
- Only relevant/current-scene characters should normally appear.

Exact generation call placement is an architecture decision.

## P-SCENE-001 — Spatial and interaction continuity

Status: OWNER_LOCKED

- Location and present actors remain coherent across turns.
- Story remembers immediately relevant current spatial/interaction facts: who is where, ongoing contact/pose when material, held/placed objects, and active conversation.
- A turn boundary alone does not reset physical/social continuity.
- Player action can naturally end/change an ongoing pose/contact unless an actual active world rule/physical condition prevents it.
- Do not solve this with a giant generic physical-action taxonomy.

The exact durable representation is an L3/L4 decision.

## P-MEMORY-001 — Long-play continuity

Status: OWNER_LOCKED

- Important prior conversations, decisions, rule changes, relationship-relevant events, promises, conflicts, and scene history must survive beyond the recent raw-turn window.
- Long-term memory remains chronological and grounded in committed Story.
- Missing optional summary generation cannot erase committed events.
- Memory must not fabricate a semantic ledger of facts Story never established.

## P-CSA-001 — `상식개변` MVP behavior

Status: OWNER_LOCKED

The first playable redesign intentionally uses a **small 9-rule catalog only**.

Exact active template IDs are defined by `07_CSA_MVP_CATALOG.md`:

### Weak — exactly 3

- `no_panties_under_work_clothes`
- `no_bra_under_work_clothes`
- `target_places_requester_hand_on_waist_or_thigh`

### Medium — exactly 3

- `work_nude`
- `masturbate_for_recipient`
- `work_in_underwear_only`

### Strong — exactly 3

- `vaginal_sex_with_recipient`
- `player_request_executes_immediately`
- `continue_until_recipient_orgasm`

Product laws:

- rule state is a real durable game mechanic;
- apply/change/remove actions are explicit transactions with clear success/failure;
- they do not consume a fake player Story turn;
- next Story receives the new active rule state;
- exact finite mechanics explicitly encoded by a retained rule may have deterministic projection;
- open-ended consequences remain Story-authored;
- no generic CSA execution DSL is built for the historical catalog;
- no tenth rule enters the active product until the 9-rule MVP passes owner play and one explicit new-rule decision is made.

Historical non-MVP rules are not `DEFERRED FEATURES`; they are **UNSELECTED CANDIDATES** and must not appear in runtime/UI/API/prompt behavior.

## P-CLOTHING-001 — Clothing continuity

Status: RETAIN_BY_DEFAULT

The established four-slot model remains the preferred finite clothing mechanic because multiple retained MVP rules directly need exact clothing continuity:

- uniform_top
- uniform_bottom
- underwear_top
- underwear_bottom

Exact structured CSA clothing requirements may update it deterministically. Ordinary Story changes require Story-grounded observation.

## P-PHYSICAL-001 — Generic physical state

Status: OPEN_DECISION

The product requirement is continuity, not a specific ontology. Compare at least a bounded natural-language current scene snapshot, minimal structured pose/contact state, and Story/memory-only continuity. Choose only what is necessary to pass acceptance scenarios.

## P-PLAYER-STATE-001 — Player meters

Status: OPEN_DECISION

Historical player sexual/arousal/erection/ejaculation UI is not automatically part of the redesign core.

If retained, it must be one narrow explicit mechanic with one writer and no generic event taxonomy. If removed, state/UI/prompt/tests are removed coherently.

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

Before implementation, L2/L3 classifies each field as profile identity, prompt-only context, UI-visible information, or removable. A field may not disappear merely because a minimal DB schema lacks it.

## P-UI-001 — Product surfaces

Status: RETAIN_BY_DEFAULT

The completed Company UI is evidence of intended product surfaces, not a frozen layout.

The redesign deliberately accounts for Story/history/current stream, free-form action, player setup, current scene/character state, Mind Monitor, player state, company map, `상식개변` app, media, TTS, history/download, feedback revision, reset, and responsive/mobile information order.

The `상식개변` UI specifically presents the small 3/3/3 MVP catalog rather than the historical full catalog.

## P-MEDIA-001 — Image and TTS

Status: RETAIN_BY_DEFAULT

- Image and TTS are presentation sidecars.
- Their failure never blocks or redefines Story/Commit.
- TTS OFF means zero TTS API calls.
- Media selection cannot become narrative truth authority.

## P-FEEDBACK-001 — Feedback revision

Status: RETAIN_BY_DEFAULT

The player should be able to request correction of the latest committed turn without treating the correction as a new chronological gameplay turn. Exact revision persistence is an architecture decision.

## P-RESET-001 — Reset/new game

Status: RETAIN_BY_DEFAULT

Reset/new-game behavior must be explicit, safe, and game-local. It never mutates preserved evidence games or silently reuses a prior manual-test UUID.

## P-REMOVED-001 — Explicitly removed mechanics

Status: OWNER_LOCKED

Do not reintroduce without a new owner product decision:

- standalone NPC find/search;
- bold-choice probability/risk UI and generic success-rate rolls;
- hypnosis/personal suggestion system from Hospital;
- generic `physical_reaction` Mind Monitor field;
- arbitrary server-generated save patches;
- automatic retry/regenerate-until-lucky Story behavior;
- generic assistant/helpdesk framing;
- bulk restoration of the historical CSA catalog.

## P-QUALITY-001 — Player acceptance outranks internal correctness

Status: OWNER_LOCKED

A release is not successful merely because CI, schema validation, source review, or hundreds of unit tests pass.

Relevant manual acceptance scenarios must pass on the exact deployed build. Product rejection blocks progression even when infrastructure tests are green.
