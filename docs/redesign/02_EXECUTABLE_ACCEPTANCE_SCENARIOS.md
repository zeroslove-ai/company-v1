# Company Redesign — Executable Acceptance Scenarios

Status: OWNER-REVIEW DRAFT  
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

Given a new adult game, setup deliberately supports every owner-accepted profile field: name, department, position, age, height, weight, penis length, body type, speech style.

Pass:

- selected catalog IDs resolve from canonical content;
- stored profile survives refresh;
- Story receives only justified profile context;
- setup does not invent a player Story action.

## A-OPENING-001 — This is the Company game, not an assistant

Level: P0 / owner manual

Opening must:

- show `상식개변: 회사편` identity;
- use real Company location/registered people;
- establish a living company scene;
- establish the private unfamiliar `상식개변` premise;
- make clear the app has not automatically altered reality;
- avoid office-assistant/helpdesk framing;
- avoid a mandatory first-work quest;
- leave the next action to the player.

Owner must recognize the product before Turn 1.

## A-CANON-001 — Canonical cast/world only

Level: P0

- five heroines resolve exactly from `content/characters.json`;
- general NPCs resolve from `content/general_npcs.json`;
- locations resolve from `content/map.json`;
- no demo/shadow semantic list becomes runtime authority;
- prose cannot create a new registered identity by name inference alone.

## A-TURN-001 — Literal free-form action survives end-to-end

Level: P0

The exact typed player action is persisted and supplied to Story.

Story may determine reaction/outcome but may not replace the requested target/action. A blocked action is narrated as blocked rather than rewritten. Refresh/history shows the same literal input.

## A-STREAM-001 — Story remains visible while streaming

Level: P0

- first Story content appears incrementally;
- no blocking loader covers arrived Story;
- disconnect/reconnect does not erase durable/progress text;
- progress status remains outside the reading surface.

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

## A-INPUT-001 — Free input is never locked out

Level: P0

Free-form input is always available in ordinary play. If optional choices are later enabled, they remain suggestions only, submit full literal text, never block free input, and never fall back to stale prior-turn choices.

## A-SCENE-001 — Location/presence continuity

Level: P1

Across movement and multi-character conversation:

- current registered location remains coherent;
- actors do not teleport;
- exact departure removes an actor when appropriate;
- omission from one Story does not automatically delete a still-present actor;
- next Story receives committed scene state.

## A-SCENE-002 — Immediate spatial continuity without giant ontology

Level: P1

Material ongoing facts such as lap-sitting/contact, placed documents, held objects, or close conversation survive to the next turn until Story changes them.

The player can request to stand, move, put someone down, end contact, or otherwise alter the scene unless an actual active rule or physical condition directly prevents it.

Acceptance is continuity and agency, not a particular posture schema.

## A-CONVERSATION-001 — Question/answer continuity

Level: P1

If Turn N ends with a direct question/request/decision, Turn N+1 responds to it or gives a character-grounded reason to avoid/postpone it. It does not restart introductions or ignore the exchange.

## A-MEMORY-001 — Beyond recent raw context

Level: P1 / owner 20+ turn manual

A distinctive earlier committed fact/decision/conflict remains available after it leaves the recent raw window.

Pass:

- older events are available through grounded chronological memory;
- blank optional summary cannot erase them;
- memory adds no facts absent from committed Story.

## A-MIND-001 — Relevant character Mind Monitor

Level: P1

- UI uses real names, not internal IDs;
- `surface` and `subconscious` differ meaningfully and reflect canon/current events;
- irrelevant office residents do not receive entries by default;
- monitor invents no unestablished event/contact;
- monitor failure does not fail/regenerate Story.

## A-CSA-CATALOG-001 — Exactly the nine-rule MVP

Level: P2 / hard product gate for CSA phase

The active `상식개변` catalog is exactly:

### Weak

- `no_panties_under_work_clothes`
- `no_bra_under_work_clothes`
- `target_places_requester_hand_on_waist_or_thigh`

### Medium

- `work_nude`
- `masturbate_for_recipient`
- `work_in_underwear_only`

### Strong

- `vaginal_sex_with_recipient`
- `player_request_executes_immediately`
- `continue_until_recipient_orgasm`

Pass:

- exactly 3 weak + 3 medium + 3 strong appear in active source/runtime/UI;
- historical non-MVP templates cannot be activated by API, stale client state, hidden UI, copied SQL, or test fixtures;
- runtime has no generic machinery implemented solely to support removed historical rules;
- a future tenth rule requires an explicit owner product decision and its own acceptance scenario.

## A-CSA-001 — Rule application is not a fake Story turn

Level: P2

Applying/changing/removing one of the nine valid rules:

- reports transaction success/failure explicitly;
- does not advance the ordinary gameplay turn merely because of the app transaction;
- inserts no fake literal action into history;
- next ordinary Story receives the active rule state;
- NPC emotional response remains character-authored, not inferred as affection/consent.

## A-CSA-002 — Rule scope is exact

Level: P2

A retained rule affects only its stated subject/counterparty/scope/mechanic.

- no unrelated romance, obedience, comfort, arousal, trust, or generic permission is implied;
- removal stops future premise enforcement but does not rewrite already-realized Story history;
- where wording leaves freedom, player/NPC actions remain natural rather than mechanically overconstrained.

## A-CLOTHING-001 — Four-slot exact continuity

Level: P2

Because retained MVP rules include clothing mechanics:

- exact rule-required clothing state synchronizes deterministically;
- ordinary clothing changes require Story-grounded observation;
- one actor’s evidence cannot mutate another actor’s clothing;
- state persists until Story/rule changes it.

## A-FEEDBACK-001 — Revise latest turn, do not advance chronology

Level: P2 if retained

- original revision remains auditable;
- replacement Story is generated for the same chronological turn;
- failure leaves the previous committed revision intact;
- subsequent context uses the accepted latest revision.

## A-RESET-001 — Safe new game/reset

Level: P2

- reset/new game affects only the selected game;
- preserved evidence games are never reused/reset;
- test fixture UUID is fresh where applicable;
- new game reaches valid Setup/Opening.

## A-MEDIA-001 — Media cannot break the game

Level: P2 if Image/TTS activated

- Story commit succeeds despite media failure;
- TTS OFF causes zero TTS API calls;
- media never changes world truth.

## A-PLAYER-STATE-001 — Narrow player meter if retained

Level: P2 if retained

- one writer/reducer owns it;
- grounded Story observation drives changes;
- no generic event taxonomy/permission inference;
- refresh/replay is stable;
- if rejected, UI/state/prompt/tests disappear together.

## A-RECOVERY-001 — One user action cannot become two turns

Level: P3

Under double click, reconnect, stale worker wakeup, explicit retry and interruption:

- one `(game, turn)` has one active canonical attempt;
- stale attempt cannot mutate a newer retry;
- exactly one successful committed turn results;
- committed literal action and Story belong to the same attempt;
- no automatic retry-until-lucky occurs.

## A-OBSERVE-001 — Optional observation failure is local

Level: P3

If valid Story succeeds but optional observation/MM/summary projection fails:

- Story remains usable/committable under accepted fallback;
- no second Story generation occurs;
- no unrelated state is invented;
- memory fallback preserves committed Story.

## A-REFRESH-001 — Refresh/reconnect parity

Level: P3

At Opening, idle, in-flight and post-Commit states, refresh reconstructs the same canonical game from server state. Frontend cache is not gameplay authority.

## A-UI-001 — Product surface completeness

Level: P0/P1 depending surface

Compare deployed UI against the Golden UI checklist. A phase may visibly disable an accepted future mechanic, but may not silently delete an accepted surface or claim disabled behavior succeeded.

## Owner manual-play cadence

1. Opening-only review before deep stabilization.
2. 3–5 turn owner play for base Story/scene/MM.
3. 10–20 turn owner play for continuity/memory.
4. Add the exact 9-rule CSA MVP and test apply/change/remove inside real play.
5. Only after those 9 rules are accepted may one additional rule be considered.
6. Secondary systems follow after core product + CSA stability.

Automated long-play is diagnostic only and never substitutes for owner product acceptance.
