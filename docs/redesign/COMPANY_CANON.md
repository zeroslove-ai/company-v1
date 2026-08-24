# 상식개변: 회사편 — Product / Gameplay / Architecture Canon

Status: **OWNER_ACCEPTED / BINDING**  
Accepted: 2026-08-24 KST  
Product: `company-v1 / 상식개변: 회사편`

This file is the consolidated forward canon. It supersedes conflicting or incomplete product/design wording in historical Company v1/v2 tasks, draft PR #95/#96 documents, old Issue comments, tests, and current implementation details. Those remain evidence/provenance only.

`docs/ops/CURRENT_TASK.md` is execution authority only. It may implement this canon but may not reinterpret, narrow, or supersede it.

## 0. Authority order

1. Explicit current owner product decision.
2. This `COMPANY_CANON.md` and specialized accepted contracts linked from it.
3. `LIVE_ACCEPTANCE_MATRIX.md` observable acceptance.
4. `MEDIA_CATALOG_CONTRACT.md` for image/media catalog semantics.
5. Canonical repository content (`content/*.json`) that does not conflict with this canon.
6. A′ source/implementation and live DB/deploy evidence.
7. Historical PRs/issues/tests as evidence only.

If a lower layer conflicts with a higher layer, the lower layer is wrong. Fix the lower layer; do not normalize the conflict into new product behavior.

---

# L0 — Product Constitution

## P-IDENTITY-001 — Product identity

`상식개변: 회사편` is an **adult company-life interactive fiction / character simulation**.

It is not a productivity assistant, office chatbot, work quest checklist, or business-task simulator. Company work, hierarchy, meetings, documents, schedules, and office spaces are social/world texture. They may matter naturally, but every scene and every turn does not need a business objective.

Adult romantic/intimate/sexual play between adult characters is a normal supported part of the product and must be represented in live QA. Testing only polite office behavior is not representative acceptance.

## P-PREMISE-001 — Private `상식개변` app and institutional-rule effect

The player privately possesses an unfamiliar app/tool called `상식개변` and initially does not remember installing it. Merely possessing/opening it changes nothing.

APPLY of an accepted CSA preset causes that preset to become a **newly issued official company/institutional rule, notice, policy, or equivalent authority defined by the preset**.

Binding semantics:

- NPCs do not know the private app exists and do not sense a supernatural activation aura.
- The new rule does **not** retroactively rewrite memory into “this has always been normal.”
- NPCs may notice that the rule is new and react with surprise, confusion, embarrassment, disbelief, annoyance, awkwardness, questions, reluctance, or other character-specific reactions.
- When the rule actually applies to them, scoped NPCs ultimately follow the authoritative rule.
- Institutional compliance does not automatically create affection, comfort, private consent-as-feeling, sexual desire, arousal, romance, trust, loyalty, or a personality rewrite.
- Over later turns, characters may gradually adapt, practicalize, rationalize, joke about, resent, or otherwise live with the rule in their own way. **That adaptation arc is a core part of the game’s appeal.**
- CHANGE/REMOVE changes future rule authority; it does not rewrite already committed history.

## P-AGENCY-001 — Literal player agency

Free-form input is always available during ordinary play.

Story may decide feasibility, response, NPC reaction, consequence, and outcome. Story may **not silently replace** the player’s material actor, target, requested action, direction/movement, request, refusal, self-state, topic, or intent.

If a request is blocked or unwelcome, narrate the block/reaction rather than pretending the player requested something else.

Ongoing conversation, pose, contact, romantic/intimate interaction, or sexual interaction is not an invisible rail. The player may request stop/change/interruption unless an actually active rule or physical reality prevents it.

## P-PLAYER-THOUGHT-001 — The game does not author the player’s private mind

Any visible `player_inner_thought` / player monologue surface is subordinate to player agency.

It must not invent attraction, desire, consent interpretation, moral judgement, emotional commitment, decisions, permission, or motives that the player did not establish.

A safe projection may only:

- preserve/paraphrase an explicitly stated player thought/feeling/intention; or
- remain empty when there is no grounded player-thought evidence.

Observer convenience never authorizes defining the player character’s mind.

## P-STORY-001 — Story-first, character-first experience

Rich natural Korean narrative is the primary game surface and visibly streams. No blocking loader may cover arrived Story.

NPCs have personality, attention, work, personal interests, reactions, and initiative. They are not passive API responders or interchangeable exposition devices. Multi-character scenes may include NPC-to-NPC reaction.

Company work remains context, not compulsory quest progression. Adult/emotional/intimate scenes must not be mechanically dragged back to meetings/reports/schedules merely because the setting is an office.

Repeated scene restart, generic assistant voice, OOC/self-repair text, protocol garbage, visible internal prompt labels, or dossier-like character-profile recitation is product failure.

## P-CHARACTER-001 — Character identity, autonomy, and dramatization

Canonical registered IDs and names remain authoritative. Five heroines are 서원희, 윤민아, 김제나, 한리브, 이메이.

Character source material must be **playable/dramatizable**, not only tag-like labels. For each heroine Story must have enough material to perform distinctly across:

- ordinary initiative and habits;
- speech rhythm, addressing, and social distance;
- work vs private-life behavior;
- stress, anger, embarrassment, awkwardness, and conflict;
- helping/caring behavior;
- hierarchy/power imbalance;
- attraction/intimacy and boundary reactions;
- first reaction to a newly issued CSA rule;
- gradual adaptation to an active CSA rule;
- changed behavior after meaningful prior events.

Canonical character content should include a small number of short dialogue examples where useful. There is no arbitrary character-card length quota.

**Internal character-card labels are never player-facing exposition.** Terms such as “생활형 리더”, “빠른 판단형”, “조심스러운 관찰자”, “행동형 신입” may guide Story internally but should be shown through actions/dialogue, not recited as a database description.

Work cooperation is not affection. Hierarchy is not private submission. CSA compliance is not emotional acceptance.

## P-OPENING-001 — Opening is a living scene

Opening establishes the real Company setting, registered people/space, player-private unfamiliar app premise, and player freedom.

It should introduce characters **through a small living event and interaction**, not by reading out a roster/profile list. A character’s nature should be learned from what she does, says, notices, avoids, or initiates.

Opening does not create a mandatory first-work quest and does not speak for the player beyond validated setup facts.

## P-INPUT-001 — Four Story choices + free input; two-layer UI is intentional

Ordinary turns provide unrestricted free-form input plus exactly four natural next-action suggestions authored by the same Story LLM.

The completed Story itself contains the four full player-visible choices. Post-Story observer/extract copies/structures those literal strings; it does not invent replacements.

The established UI deliberately uses **two layers**:

1. the four full choices visible in/after the Story for comprehension; and
2. a separate row of four compact **roughly five-character, meaningfully distinguishable action labels/buttons** for quick selection.

That two-layer presentation is intentional and is not “duplicate choice UI.” Compact labels are presentation-only shorthand. They should be short, recognizable, mutually distinguishable, and clearly correspond to the full choice; they are **not required to be a blind prefix slice or exactly five characters**. Clicking one submits the full literal current-turn choice unchanged.

Choices must be meaningfully different directions, not four paraphrases or four variants of the same escalation. In adult/intimate scenes the four choices should not all force continued escalation; scene-appropriate alternatives such as continue/change intensity/talk/stop-or-switch-direction should remain possible when coherent.

If valid Story exists but choice projection fails, Story still commits and free input remains available. No stale previous choices and no second Story call.

## P-SCENE-001 — Minimal immediate continuity

Initial structural scene authority remains:

- current registered location;
- present registered actor IDs;
- one bounded replaceable natural-language `scene_note` for immediate physical/spatial/ongoing-interaction continuity;
- four-slot clothing only because retained CSA clothing rules require exact continuity.

Do not add a generic posture/contact/action ontology “just in case.” Add structure only after a concrete owner-visible failure proves a smaller solution insufficient.

## P-MEMORY-001 — Relational-context continuity without a relationship engine

Important prior conversations, promises, refusal, conflict, pressure, help, humiliation/discomfort, apologies, intimacy, meaningful CSA adaptation, and other relationship-relevant committed events may change the meaning of later dialogue.

One later sentence such as “불이익은 없어” or an apology does not automatically reset prior tension/history.

Preserve this first through committed Story + grounded chronological memory. Do **not** introduce a generic relation/consent/emotion matrix, affinity engine, pressure meter, or event ledger merely to emulate another platform.

If long play proves a specific missing structured fact is necessary, propose the smallest field tied to that concrete failure.

## P-MIND-001 — Mind Monitor is depth, not parallel reality

Mind Monitor is a core presentation surface for relevant NPC internal perspective.

- fields: `surface`, `subconscious`;
- natural, character-specific, first-person Korean;
- normally only current/relevant characters;
- no invented event/action/memory/agreement/contact;
- no invented player desire or consent interpretation;
- no private-app/supernatural awareness unless Story canonically established it (normally it must not);
- failure is local and never destroys valid Story.

**MM must describe the same committed reality as Story.** Its role is to deepen why a character acts as shown, not create a second world that contradicts Story. A newly issued CSA rule may legitimately produce surprise/awkwardness in MM while Story shows rule compliance; that is not a contradiction when both describe the same new-policy situation.

Prior MM itself is not durable world truth and does not control next Story. The same committed events and character canon provide continuity.

## P-CSA-001 — Exactly nine active MVP templates

Active first-product catalog remains exactly 9 templates.

Weak:
- `no_panties_under_work_clothes`
- `no_bra_under_work_clothes`
- `target_places_requester_hand_on_waist_or_thigh`

Medium:
- `work_nude`
- `masturbate_for_recipient`
- `work_in_underwear_only`

Strong:
- `vaginal_sex_with_recipient`
- `player_request_executes_immediately`
- `continue_until_recipient_orgasm`

Apply/change/remove is a non-Story transaction and does not consume an ordinary gameplay turn. Subject/counterparty scope uses finite shared canonical scope data, not a generic execution DSL.

### Rule-9 exact semantic boundary

`continue_until_recipient_orgasm` means the qualifying **current sexual action is already underway** and, when its request condition is met, that current action must continue until the specified end condition.

It does **not** authorize starting a new sexual act merely because the player requests one when no qualifying current sexual action exists.

Fix this preset narrowly. Do not create a generic sexual-action execution/consent DSL.

## P-MEDIA-001 — Image/TTS are grounded presentation sidecars

Image and TTS never block/redefine Story or Commit and never become narrative truth. TTS OFF means zero TTS calls.

Images must be grounded to the current committed registered heroine and current committed scene class. A general office scene must not silently display an unrelated adult/sexual image; an actually established adult/intimate/sexual scene should be able to reach an appropriate curated adult image when available. A requested-but-refused act is not evidence that the act occurred.

Media selection may use a small presentation-only hint derived by the existing post-Story observer or deterministic post-commit projection. That hint is not durable gameplay state. Do not restore sexual-event ledgers, generic physical ontology, or add a separate image LLM for media selection.

The canonical media catalog contract is `MEDIA_CATALOG_CONTRACT.md`.

## P-UI-001 — Story-first product surfaces

Retain Story/current stream, History, full four choices + compact short action buttons, free input, current scene/character, Mind Monitor, player profile/state, company map, `상식개변` app, image/media, TTS, download, feedback, reset, and responsive/mobile access as applicable.

Technical implementation vocabulary (`r3_*`, `revision`, `Commit`, internal retry jargon) should not appear as normal player-facing game language.

Mobile priority: Story -> full choices/compact actions/free input -> secondary insight/tools. Media/state/tools must not dominate reading flow.

## P-REMOVED-001 — Do not restore removed complexity

Do not reintroduce without new owner decision:

- standalone NPC find/search;
- bold-choice probability/risk UI;
- hypnosis/personal suggestion system;
- generic relationship/emotion/consent engine;
- generic physical posture/contact ontology;
- dynamic player arousal/erection/ejaculation gameplay gauge;
- sexual-event ledger supporting such a gauge;
- arbitrary LLM save-patch authority;
- automatic Story retry/regenerate-until-lucky;
- separate choice LLM;
- separate MM LLM;
- generic CSA execution DSL;
- historical 44-rule CSA catalog as active runtime.

## P-QUALITY-001 — Player acceptance outranks structural green

A release is not good because tests, schema, DB readback, `choices.length===4`, or turn Commit is green.

Actual deployed browser play must show correct agency, character differentiation, Story quality, CSA semantics, MM coherence, continuity, useful choices, and media/UI behavior. Owner rejection blocks release even when infrastructure is healthy.

---

# L1 — Binding live acceptance

`LIVE_ACCEPTANCE_MATRIX.md` is the observable acceptance contract. Automation must play the actual product in a real browser and include adult-oriented behavior. Structural/API/DB checks are diagnostics, not substitutes.

---

# L2 — Golden content / presentation

Canonical semantic sources remain repository content. Runtime/frontend/SQL/tests may not maintain shadow semantic catalogs.

Character cards in `content/characters.json` must be enriched in-place (or through one clearly named canonical character-content source) with dramatizable material required by `P-CHARACTER-001`, while keeping stable IDs/names and without creating a second character authority.

Forward image catalog semantic source is governed by `MEDIA_CATALOG_CONTRACT.md`.

The historical complete Company UI remains the high-parity presentation donor, but donor naming/implementation is not product authority. Full Story choices + compact short action buttons are explicitly retained.

---

# L3 — Gameplay / State / Memory model

## Kinds of truth

**Static content truth:** registered characters, locations, setup catalogs, active 9-rule CSA catalog, media catalog metadata.

**Narrative truth:** committed literal player action + committed Story. This owns dialogue, rejection/acceptance, open-ended social/intimate consequences, promises, conflicts, and scene events.

**Structural/mechanical truth:** validated player profile, time, current location, present actors, one `scene_note`, active CSA rule instances/scope/lifecycle, four-slot clothing.

**Presentation/interpretation:** MM, player-thought projection, four extracted choices/compact labels, media hint/image, TTS, focal/display character. These may fail locally and do not redefine narrative truth.

## Story context

Story receives exact literal action, relevant profile, current scene/time, relevant registered character canon, active CSA premises/scope, clothing where relevant, recent raw committed turns, older grounded chronological memory.

Character context is a **bounded projection** of canonical content. Story receives only fields useful for acting the currently relevant characters; it does not receive whole `characters.json` records or unrelated private/body/catalog data merely because they exist.

Opening context follows the same relevance principle. Physical co-location does not require every co-located heroine’s full prompt card to be focal in the first scene. Opening should project a small natural focal cast sufficient to create a living interaction while preserving broader world/presence truth separately.

Story does not receive a precomputed success verdict, relationship stage, consent matrix, generic action taxonomy, physical execution plan, dynamic sexual meter, or historical non-MVP CSA semantics.

## CSA zero-turn event bridge

CSA APPLY/CHANGE/REMOVE remains a **zero-ordinary-turn system transaction**. It may create one bounded canonical system event describing that a rule was newly issued, changed, or removed, including its activation timing/scope. The next ordinary Story receives that event as context so it can naturally show first reaction or changed authority while still processing the player’s actual literal action. The app operation itself must not masquerade as an ordinary player Story turn.

This bridge is not a second Story call, generic aftereffect engine, relation engine, or consent DSL. Once the next Story has incorporated the event as recent context, normal committed history/memory carries any meaningful consequences forward.

## One post-Story observer

Keep one small observer after Story. It may project only accepted structural/presentation fields such as elapsed time, location/presence evidence, replacement scene_note, clothing evidence, four copied choices, summary, Mind Monitor, grounded player-thought if any, safe dialogue/speaker presentation metadata, and a minimal optional media hint.

Observer failure is fail-open. No second Story generation.

## Memory

Recent turns remain raw. Older memory remains chronological and grounded in committed Story. Memory prioritizes facts/events that alter future interpretation, including promises, refusal/conflict, pressure/help, intimacy, and CSA adaptation, without turning them into generic numeric relation state.

---

# L4 — Binding architecture: A′

Forward architecture remains A′:

```text
Company high-parity presentation/content
+ thin frontend controller
+ minimal Company view model/domain
+ server-owned turn kernel with attempt fencing / streaming / atomic Commit
+ Story LLM
+ one post-Story observer
+ isolated R3 persistence
+ optional nonblocking media/TTS sidecars
```

Normal ordinary turn remains two LLM calls: Story -> Observer.

Do not redesign the engine because product output is currently weak. First fix content, prompt/context projection, observer contract, memory projection, media projection, and presentation at their owning boundaries.

The browser submits one literal action and renders streamed/committed context; it never owns Story -> Observer -> Commit orchestration.

---

# Reference evidence, not authority

- Draft PR #95: product-first redesign provenance.
- Draft PR #96: A′ architecture provenance.
- Issue #102 Crack review: benchmark/reference evidence only. Do not copy Crack stats, keyword-book, hidden architecture, prompt-length quotas, or inferred platform behavior. Its useful lesson is that richer dramatizable character material and context continuity help realize laws already defined here.
- Issue #68 browser product audit terminal `5394232327`: current implementation defect evidence.

Any future product-law change requires explicit owner decision, canon document update first, then implementation task registration.