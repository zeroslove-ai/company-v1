# Company Redesign — Executable Acceptance Scenarios

Status: OWNER-REVIEW DRAFT  
Date: 2026-08-21

These scenarios define whether the product is actually correct. They are not merely unit tests.

## Acceptance levels

- **P0 PRODUCT GATE**: failure means the build is not `상식개변: 회사편` or is not playable. No further phase progression.
- **P1 CORE GAMEPLAY**: required before core runtime architecture is accepted.
- **P2 FEATURE**: required when that feature is activated.
- **P3 RESILIENCE**: required before broader rollout.

Every implementation task must cite the exact scenario IDs it changes.

---

## A-SETUP-001 — Established player setup

Level: P0  
Mode: UI + persistence + prompt inspection

Given a new adult game, the setup experience deliberately supports the accepted player-profile fields.

At minimum the redesign review must explicitly decide each established field:

- name
- department
- position
- age
- height
- weight
- penis length
- body type
- speech style

Pass criteria:

- no field disappears because a minimal runtime schema lacks it;
- selected catalog IDs resolve from canonical `content/*.json`;
- stored profile survives refresh;
- Story receives only the profile fields justified by the current scene;
- setup completion does not invent Story actions for the player.

## A-OPENING-001 — This is the Company game, not an assistant

Level: P0  
Mode: owner manual first-impression test

Given a fresh game after Setup, Opening must:

- show `상식개변: 회사편` identity;
- use real Company location/registered people;
- establish a living company scene with concrete character behavior;
- establish the private unfamiliar `상식개변` app premise;
- make clear the app has not automatically altered reality;
- not frame itself as “How can I help with your first task?” or another office assistant/helpdesk;
- not create a mandatory work quest;
- leave the next action to the player.

Owner must be able to recognize the product before Turn 1.

## A-CANON-001 — Canonical cast/world only

Level: P0  
Mode: automated catalog parity + manual spot check

- five heroines resolve exactly from `content/characters.json`;
- general NPCs resolve from `content/general_npcs.json`;
- locations resolve from `content/map.json`;
- no demo `서원/다현/민지` or hand-written shadow list exists as runtime authority;
- a Story scene cannot introduce a new registered identity merely because a name appeared in prose.

## A-TURN-001 — Literal free-form action survives end-to-end

Level: P0

Given the player types a specific action with actor, target and directionality, the exact literal text is persisted as player input and supplied to Story.

Pass:

- Story may determine reaction/outcome;
- Story may not replace the player’s requested target/action with another action;
- a blocked/unwelcome action is narrated as blocked/unwelcome rather than rewritten;
- refresh/history displays the same literal action.

## A-STREAM-001 — Story remains visible while streaming

Level: P0

- first Story content appears incrementally;
- no full-screen/blocking loader covers already-arrived Story;
- disconnect/reconnect does not erase already-streamed committed/progress text;
- presentation status may appear unobtrusively outside the Story viewport.

## A-STORY-001 — Natural interactive fiction quality

Level: P0  
Mode: owner manual

Over five ordinary turns:

- no assistant/helpdesk voice;
- no OOC/self-repair/protocol garbage;
- no repeated scene restart;
- characters preserve distinct speech/personality;
- NPCs perform contextually natural small actions without stealing player agency;
- multi-NPC scenes may include NPC-to-NPC reaction;
- company work remains context, not compulsory quest progression.

A build failing this scenario is rejected even with green CI.

## A-INPUT-001 — Free input is never locked out

Level: P0

Ordinary play always retains a free-form input path.

If optional choices are later enabled:

- they are suggestions only;
- clicking one submits the full literal choice text;
- incomplete/missing choices do not block free input;
- prior-turn choices never appear as fake current choices.

## A-SCENE-001 — Location/presence continuity

Level: P1

Over movement and multi-character conversation:

- registered current location remains coherent;
- actors do not teleport between unrelated rooms;
- exact departure removes an actor when appropriate;
- omission from one turn does not automatically delete a still-present actor;
- next Story receives the committed current scene.

## A-SCENE-002 — Immediate spatial continuity without giant ontology

Level: P1

Scenario examples:

- an NPC is sitting on the player’s lap;
- a document is placed on the table;
- someone is holding an object;
- an ongoing close conversation/contact is material to the next action.

Next turns preserve those facts until Story changes them.

The player can request to stand up, move, put someone down, end contact, or otherwise change the situation unless an actual active world rule/physical condition prevents it.

Pass criteria are continuity and agency, not preservation of any particular posture schema.

## A-CONVERSATION-001 — Question/answer continuity

Level: P1

If Turn N ends with a direct question/request/decision, Turn N+1 should respond to it or give a character-grounded reason for avoiding/postponing it.

It must not restart introductions or ignore the immediately preceding exchange.

## A-MEMORY-001 — Beyond recent raw context

Level: P1  
Mode: owner 20+ turn manual + deterministic readback inspection

Establish a distinctive fact/decision/conflict early, then continue beyond the raw recent-turn window.

Pass:

- the older committed event remains available to later Story through grounded chronological memory;
- blank/failed optional summary cannot erase it;
- memory does not add facts absent from committed Story;
- later Story need not quote it constantly, but must recall it when relevant.

## A-MIND-001 — Relevant character Mind Monitor

Level: P1

For a turn involving one or more relevant NPCs:

- monitor uses real character names in UI, never internal IDs;
- surface/subconscious differ meaningfully and reflect character canon/current events;
- irrelevant office residents do not receive monitor entries by default;
- monitor does not invent a contact/event that Story did not establish;
- missing monitor data does not fail or regenerate the Story turn.

## A-CSA-001 — Rule application is not a fake Story turn

Level: P2

Given the player applies/changes/removes a valid `상식개변` rule:

- transaction reports success/failure explicitly;
- committed gameplay turn number does not advance merely due to the app transaction;
- no fake player literal action such as “회사 규정 변경사항이 공식 반영된다” is inserted into history;
- next ordinary Story receives the new active rule state;
- NPC emotional response remains character-authored and is not inferred as affection/consent from rule activation alone.

## A-CSA-002 — Rule scope is exact

Level: P2

A rule affects only its defined target/scope/mechanic.

Pass:

- rule does not imply unrelated romance, obedience, comfort, arousal, or permission;
- removal stops future premise enforcement but does not magically rewind already-realized physical positions/events;
- player may act naturally around the rule where its wording leaves freedom.

## A-CLOTHING-001 — Four-slot exact continuity

Level: P2 if clothing mechanic retained

- exact structured CSA required clothing state synchronizes deterministically;
- ordinary clothing changes require Story-grounded observation;
- one actor’s evidence cannot mutate another actor’s clothing;
- clothing persists across turns until Story/rule changes it.

## A-FEEDBACK-001 — Revise latest turn, do not advance chronology

Level: P2 if feedback retained

Given a committed latest turn and user correction request:

- original revision remains auditable;
- replacement Story is generated for the same chronological turn;
- game does not treat feedback as an additional player turn;
- subsequent context reads only the accepted latest revision as current narrative;
- failure during revision leaves the previously committed revision intact.

## A-RESET-001 — Safe new game/reset

Level: P2

- reset/new game acts only on the explicitly selected game;
- preserved evidence/manual-test games are never reused or reset;
- a fresh UUID is verified absent before fixture creation where test tooling is involved;
- new game reaches valid Setup/Opening state.

## A-MEDIA-001 — Media cannot break the game

Level: P2 if Image/TTS activated

- Story commit succeeds even when image generation/select or TTS fails;
- TTS OFF causes zero TTS API calls;
- media never changes scene/character/story truth;
- image shown corresponds only to the current relevant character/context under the accepted media rule.

## A-PLAYER-STATE-001 — Narrow player meter if retained

Level: P2 if player sexual mechanic retained

- one coherent writer/reducer owns the meter;
- exact grounded Story observation drives changes;
- there is no generic sexual-event taxonomy/permission inference;
- refresh/replay returns the same meter;
- if owner rejects the mechanic, UI/state/prompt/tests are removed together.

## A-RECOVERY-001 — One user action cannot become two turns

Level: P3

Under double click, reconnect, stale worker wakeup, explicit retry and network interruption:

- one `(game, turn)` has one active canonical attempt at a time;
- stale attempt cannot progress/fail/commit a newer retry;
- exactly one successful committed turn results;
- committed literal action and committed Story belong to the same attempt;
- no automatic Story retry occurs without explicit structural recovery policy/user action.

## A-OBSERVE-001 — Optional observation failure is local

Level: P3

If valid Story succeeds but optional observation/Mind Monitor/summary projection fails:

- Story remains usable/committable under the accepted fallback policy;
- no second Story generation occurs;
- no unrelated state is invented;
- memory fallback preserves committed Story.

## A-REFRESH-001 — Refresh/reconnect parity

Level: P3

At Opening, idle committed state, in-flight Story and after Commit:

- refresh reconstructs the same canonical game from server state;
- frontend cache is never a second gameplay authority;
- history/order/scene/time/player profile match committed state.

## A-UI-001 — Product surface completeness

Level: P0/P1 depending surface

Before a product-layer release, compare the exact deployed UI against the accepted Golden UI surface checklist.

A runtime phase may disable a future mechanic, but it cannot silently delete an accepted visible product surface. Disabled controls must not claim success.

## Owner manual-play cadence

The redesign intentionally places product checks early:

1. **Opening-only review** before deep runtime stabilization.
2. **5-turn owner play** once base Story/scene/memory/MM path works.
3. **10-turn owner play** after navigation + CSA/clothing.
4. **20–30+ turn owner play** after memory/feedback/media/player mechanics.

Automated long-play is diagnostic only and never substitutes for owner product acceptance.
