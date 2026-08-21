# Company Redesign — Product Constitution

Status: OWNER-REVIEW DRAFT / FOUR OPEN DECISIONS RESOLVED  
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
- Rule activation changes only the rule’s stated premise. It does not automatically create affection, comfort, private consent, sexual desire, obedience, trust, romance, or unrelated physical facts.
- Applying/removing a rule is a system transaction, not a player-authored narrative turn.

## P-AGENCY-001 — Literal player agency

Status: OWNER_LOCKED

- Free-form player input is always available during ordinary play.
- The player’s material actor, target, requested action, direction, request, refusal, self-state, and intent may not be silently substituted.
- Story decides response, feasibility, consequences, NPC reaction, and outcome; it does not rewrite the requested action into another action.
- If an action is blocked or unwelcome, Story narrates that response rather than pretending the player asked for something else.
- Ongoing poses/contacts are not invisible rails. The player may naturally request interruption/change unless an active rule or physical condition actually prevents it.

## P-STORY-001 — Story-first experience

Status: OWNER_LOCKED

- Rich natural narrative is the primary game surface and visibly streams.
- No blocking loading overlay may cover the narrative while generation is in progress.
- NPCs have personality, work, attention, reactions, and initiative; they are not passive API responders.
- Multi-character scenes allow NPC-to-NPC reaction when context warrants it.
- Company work is living context, not compulsory quest progression.
- Repeated scene restart, generic assistant language, OOC/self-repair text, or visible protocol garbage is product failure.

## P-CONTENT-001 — Canonical Company world

Status: OWNER_LOCKED

Repository content is semantic truth for established finite world identity:

- `content/edition.json`;
- five heroines in `content/characters.json`: 서원희, 윤민아, 김제나, 한리브, 이메이;
- `content/general_npcs.json`;
- `content/map.json`;
- organization/department, position, body-type and speech-style catalogs;
- the accepted active CSA catalog governed by `07_CSA_MVP_CATALOG.md`.

The historical 44-rule CSA file is evidence/source material, not automatically the active forward product. The first playable redesign exposes exactly the approved 9-rule MVP. Runtime/frontend/SQL/tests may not maintain shadow semantic catalogs.

## P-CHARACTER-001 — Character identity and autonomy

Status: OWNER_LOCKED

- Stable registered character IDs are authoritative for structured identity.
- Relevant character prompt-card personality, speech, addressing, appearance, role and distinctive traits are available to Story.
- Character voice remains recognizably different across long play.
- Work cooperation is not affection; hierarchy is not private submission; rule compliance is not emotional acceptance.
- NPCs do not teleport, change identity, or borrow another NPC’s dialogue/state because of name matching or observer ambiguity.

## P-OPENING-001 — Opening

Status: OWNER_LOCKED

Opening establishes the real Company setting, real registered people/space, a living scene, the player-private unfamiliar `상식개변` premise, the fact that the app has not automatically changed reality, and player freedom to choose the next action.

It does not create a mandatory first-work quest or speak for the player beyond setup facts.

## P-INPUT-001 — Free input + four Story-authored choices

Status: OWNER_LOCKED

Ordinary turns provide **both**:

1. unrestricted free-form player input; and
2. exactly four current-turn suggested actions authored by the same Story LLM that writes the narrative.

Choice laws:

- choices are narrative suggestions, not a separate planning/choice LLM;
- Story outputs four natural full-action choices after the scene in a player-visible form, similar to the proven Hospital play pattern;
- choices must fit the just-written scene and should provide meaningfully different directions rather than four paraphrases;
- the post-Story Extract/observer reads the completed Story and returns the four literal choice strings for UI consumption;
- Extract does **not** invent replacement choices that Story did not write;
- a choice click submits the full literal action text exactly;
- UI may shorten a display label later as pure presentation, but the submitted action remains the full extracted choice;
- if Extract cannot safely recover four current-turn choices, valid Story still commits and free input remains available; stale/prior-turn choices are never used as fallback.

The exact visible formatting of the four Story choices may be tuned during prompt/UI implementation, but no hidden machine-only choice protocol is required merely to support them.

## P-MIND-001 — Mind Monitor

Status: OWNER_LOCKED

Mind Monitor is a core presentation surface for relevant NPC internal perspective, not objective world truth.

- fields: `surface` and `subconscious`;
- natural character-specific first-person Korean;
- no invented events/actions/memories/agreements/contacts;
- it never controls Story success, Commit, relationship state, or rule execution;
- failure/missing data degrades locally and never destroys valid Story;
- normally only relevant/current-scene characters appear.

## P-SCENE-001 — Spatial continuity via one `scene_note`

Status: OWNER_LOCKED FOR INITIAL REDESIGN

The initial redesign deliberately uses one bounded replaceable natural-language `scene_note` as the primary immediate physical/spatial continuity mechanism.

It carries only facts that materially need to survive into the next turn, such as:

- ongoing pose/contact;
- immediate relative position;
- held/placed objects;
- active conversational/spatial situation.

Location and present registered actors remain separately structured.

Rules:

- one current snapshot, not an accumulating physical ledger;
- grounded in committed Story/current supported scene state;
- rewritten as the scene changes;
- uncertain detail is omitted rather than invented;
- a turn boundary never resets supported continuity;
- no generic posture/contact/action taxonomy is built in parallel “just in case”.

If real manual play proves a single `scene_note` insufficient, the smallest extra structure may be proposed **only after** showing the failing acceptance case to the owner.

## P-MEMORY-001 — Long-play continuity

Status: OWNER_LOCKED

Important prior conversations, decisions, rule changes, relationship-relevant events, promises, conflicts, and scene history survive beyond the recent raw-turn window.

Long-term memory remains chronological and grounded in committed Story. Missing optional summary generation cannot erase committed events, and memory does not fabricate semantic facts Story never established.

## P-CSA-001 — `상식개변` 9-rule MVP

Status: OWNER_LOCKED

First playable redesign uses exactly 9 active templates.

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

Product laws:

- rule state is durable;
- apply/change/remove is an explicit non-Story transaction;
- next Story receives relevant active rule state;
- exact finite mechanics explicitly needed by a retained rule may project deterministically;
- open-ended consequences remain Story-authored;
- no generic CSA execution/action DSL is built for historical rules;
- historical non-MVP rules are `UNSELECTED_CANDIDATE`, not deferred runtime features;
- a tenth rule requires a new explicit owner decision after real play of the nine-rule MVP.

## P-CSA-SCOPE-001 — Flexible subject/counterparty scope

Status: OWNER_LOCKED DIRECTION

The 9-rule MVP should **not** hard-fix every retained rule to one historical affected group/counterparty combination.

The player should be able to configure subject/counterparty scope flexibly using a small canonical scope vocabulary instead of per-template hard-coded pairings.

Initial product intent:

- subject scope may be selected from supported canonical player/employee groups where the rule meaning is coherent;
- request/contact rules may independently select a supported counterparty scope;
- unary rules such as clothing rules do not require a meaningless counterparty;
- selected scope is stored explicitly with the active rule and projected literally to Story;
- UI/API use one shared scope vocabulary and never duplicate semantic labels;
- flexibility of **who the rule applies to** must not turn into a generic DSL for **how every rule executes**.

Architecture should first attempt a simple data model such as `{ template_id, subject_scope, counterparty_scope? }` plus finite scope validation.

If source audit proves genuinely free scope combinations cause disproportionate implementation complexity or incoherent rule semantics, do **not** silently narrow them. Return with concrete examples/cost and reopen this owner decision.

## P-CLOTHING-001 — Four-slot clothing continuity

Status: RETAIN_BY_DEFAULT

Because multiple retained rules need exact clothing continuity, prefer:

- uniform_top
- uniform_bottom
- underwear_top
- underwear_bottom

Exact rule requirements may update these slots deterministically. Ordinary Story changes require Story-grounded observation.

## P-PHYSICAL-001 — No generic physical ontology in core

Status: OWNER_LOCKED FOR INITIAL REDESIGN

The initial solution is the `scene_note` model under `P-SCENE-001`. Do not simultaneously retain the old generic posture/position/contact ontology. Add narrow structure later only if manual acceptance demonstrates a concrete gap.

## P-PLAYER-STATE-001 — Remove dynamic player sexual meter

Status: OWNER_LOCKED REMOVAL

The redesign removes the historical dynamic player sexual/arousal/erection/ejaculation gauge from the active product.

Therefore the new runtime/UI/prompt/observer/tests must not carry:

- arousal meter;
- erection state;
- ejaculation progress/count;
- sexual-event ledger used to drive those meters;
- compatibility zombie fields for the removed mechanic.

This does not remove static adult setup/profile facts such as penis length; it removes the dynamic gameplay gauge/mechanic.

## P-SETUP-001 — Player setup

Status: RETAIN_BY_DEFAULT

Established setup currently includes name, department, position, age, height, weight, penis length, body type and speech style. All players/characters are adults.

Before implementation, each field is classified as profile identity, prompt-only context, UI-visible information, or removable. A field cannot disappear merely because a minimal DB schema lacks it.

## P-UI-001 — Product surfaces

Status: RETAIN_BY_DEFAULT

The completed Company UI is product-surface evidence, not a frozen layout.

Redesign accounts deliberately for Story/history/current stream, four Story-authored choice suggestions, free-form action, setup, current scene/character state, Mind Monitor, player profile/state, company map, `상식개변` app, media, TTS, history/download, feedback, reset, and responsive/mobile order.

The old dynamic sexual gauge is explicitly removed and should not retain an empty placeholder solely for parity.

## P-MEDIA-001 — Image and TTS

Status: RETAIN_BY_DEFAULT

Image/TTS are presentation sidecars. Their failure never blocks or redefines Story/Commit. TTS OFF means zero TTS calls. Media never becomes narrative truth.

## P-FEEDBACK-001 — Feedback revision

Status: RETAIN_BY_DEFAULT

The player may request correction of the latest committed turn without creating a new chronological gameplay turn. Exact revision persistence is architectural.

## P-RESET-001 — Reset/new game

Status: RETAIN_BY_DEFAULT

Reset/new-game behavior is explicit, safe and game-local. It never mutates preserved evidence games or silently reuses a prior manual-test UUID.

## P-REMOVED-001 — Explicitly removed mechanics

Status: OWNER_LOCKED

Do not reintroduce without a new owner product decision:

- standalone NPC find/search;
- bold-choice probability/risk UI and generic success-rate rolls;
- hypnosis/personal suggestion system from Hospital;
- generic `physical_reaction` Mind Monitor field;
- generic posture/contact physical ontology in the initial redesign;
- dynamic player sexual/arousal/erection/ejaculation gauge;
- sexual-event ledger supporting that gauge;
- arbitrary server-generated save patches;
- automatic retry/regenerate-until-lucky Story behavior;
- generic assistant/helpdesk framing;
- bulk restoration of the historical CSA catalog.

## P-QUALITY-001 — Player acceptance outranks internal correctness

Status: OWNER_LOCKED

A release is not successful merely because CI/schema/source review/unit tests pass. Relevant manual acceptance scenarios must pass on the exact deployed build. Product rejection blocks progression even when infrastructure tests are green.
