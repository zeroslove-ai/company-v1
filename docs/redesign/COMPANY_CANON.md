# 상식개변: 회사편 — Product / Gameplay / Architecture Canon

Status: **OWNER_ACCEPTED / BINDING**  
Accepted: 2026-08-24 KST  
Revised: 2026-08-24 KST — Owner CSA redesign promoted from Draft PR #103  
Product: `company-v1 / 상식개변: 회사편`

This file is the consolidated forward canon. It supersedes conflicting or incomplete product/design wording in historical Company v1/v2 tasks, draft PR #95/#96 documents, old Issue comments, tests, and current implementation details. Draft PR #103 is retained as design provenance; the product-law portions explicitly promoted below are now binding here and no longer depend on that draft branch.

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

APPLY of an accepted CSA preset causes that preset to become a **newly issued official company/institutional rule, notice, policy, delegated authority, or equivalent institutional fact defined by the preset**. CHANGE is an official amendment/reassignment; REMOVE is an official cancellation/revocation.

Binding semantics:

- NPCs do not know the private app exists and do not sense a supernatural activation aura.
- A rule change is learned through an ordinary institutional channel such as a phone notice, company monitor, intranet/company messenger, HR notice, employment-rule notice, regulator notice, or another grounded channel appropriate to the preset.
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

A committed CSA rule-change Story turn follows the same Story-owned four-choice convention for its resulting scene. The structured rule transaction itself is not rewritten into a free-text choice.

## P-SCENE-001 — Minimal immediate continuity

Initial structural scene authority remains:

- current registered location;
- present registered actor IDs;
- one bounded replaceable natural-language `scene_note` for immediate physical/spatial/ongoing-interaction continuity;
- four-slot clothing because retained/new clothing CSA presets require exact continuity.

Do not add a generic posture/contact/action ontology “just in case.” Add structure only after a concrete owner-visible failure proves a smaller solution insufficient.

## P-MEMORY-001 — Relational-context continuity without a relationship engine

Important prior conversations, promises, refusal, conflict, pressure, help, humiliation/discomfort, apologies, intimacy, meaningful CSA adaptation, and other relationship-relevant committed events may change the meaning of later dialogue.

One later sentence such as “불이익은 없어” or an apology does not automatically reset prior tension/history.

Preserve this first through committed Story + grounded chronological memory. Do **not** introduce a generic relation/consent/emotion matrix, affinity engine, pressure meter, corruption/adaptation meter, or event ledger merely to emulate another platform.

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

**MM must describe the same committed reality as Story.** Its role is to deepen why a character acts as shown, not create a second world that contradicts Story. A newly issued/changed/removed CSA rule may legitimately produce surprise, embarrassment, resistance-as-feeling, or awkwardness in MM while Story shows institutional compliance; that is not a contradiction when both describe the same policy situation.

A rule-change Story turn should expose same-turn MM for relevant affected characters when the observer can ground it. Prior MM itself is not durable world truth and does not control next Story. The same committed events and character canon provide continuity.

## P-CSA-001 — Three-tier curated CSA catalog, 7 presets per tier

The old exact-nine R3 catalog is superseded. The binding MVP product shape is **three visible strength tiers with seven curated finite presets in each tier: 약함 / 중간 / 강함 (21 product slots total).**

The `W1..W7`, `M1..M7`, `S1..S7` labels below are binding product-design slots. Runtime `template_id` values are lower-level implementation IDs and must map one-to-one to these slots in one canonical repository CSA catalog; they must not create a second semantic catalog.

### Weak / 약함 — company practice and etiquette

Authority presentation is normally `사내 운영지침`, `인사팀 운영지침`, or equivalent company practice.

- **W1 노브라 근무** — female employees work in normal work clothes without a bra.
- **W2 노팬티 근무** — female employees work in normal work clothes without panties.
- **W3 가슴골 노출 근무** — female employees wear their normal shirt/blouse with the upper opening deep enough that cleavage is visibly exposed.
- **W4 무릎 위에서 얼굴을 마주 보고 대화** — in qualifying 1:1 conversation/report situations, the female employee sits on the counterparty’s lap facing them while the conversation continues.
- **W5 가슴을 만진 상태로 대화** — in qualifying conversation, the configured counterparty may keep a hand on the female employee’s breast while the conversation continues.
- **W6 엉덩이를 만지며 대화** — in qualifying conversation, the configured counterparty may touch the female employee’s buttocks while the conversation continues.
- **W7 말끝마다 가볍게 입맞춤** — conversation between scoped employees includes recurring light kisses at sentence/turn endings as a conversational norm. This is **not** literal wall-clock counting or a “kiss every N seconds” timer.

### Medium / 중간 — company-wide mandatory employment rules

Authority presentation is normally `전사 취업규칙`, `전사 준수규정`, or equivalent mandatory company rule.

- **M1 속옷 근무** — female employees treat underwear-only clothing as normal work attire while on duty.
- **M2 나체 근무** — female employees treat full nudity as normal work attire while on duty.
- **M3 가슴으로 사정 지원** — when the rule’s explicit configured adult supporter/recipient condition is met, the supporter uses her breasts to stimulate the adult male recipient’s penis to ejaculation as defined company support work.
- **M4 손으로 사정 지원** — when the rule’s explicit configured adult supporter/recipient condition is met, the supporter manually stimulates the adult male recipient’s penis to ejaculation as defined company support work.
- **M5 정액은 피로회복 방법** — within the rule’s adult scope, consuming semen is treated by the institution as an unusually effective fatigue/stress-recovery practice. It is a world-norm premise that may combine with other presets; it is not a vague hidden trigger engine.
- **M6 성기 직접 검사** — within the configured adult scope, direct manual genital inspection/stimulation is treated as a mandatory company physical examination.
- **M7 가슴·유두 직접 검사** — within the configured adult scope, direct breast/nipple inspection/stimulation is treated as a company physical examination.

Medium presets should use direct, LLM-readable institutional wording. Do not weaken them into vague semantic prerequisites such as “when concentration is low” or “when stress is high” unless that prerequisite is itself an explicit finite product rule.

### Strong / 강함 — player-delegated institutional authority

Strong is differentiated primarily by **bounded player authority over the adult sexual-work system**, not by seven increasingly explicit standalone sex acts. Authority presentation is normally `관계당국 의무지침`, `법령에 따른 특별업무 권한`, or equivalent delegated authority.

- **S1 성적 업무지시권** — the player may issue supported sexual-work instructions to scoped adult employees and the supported instruction is treated as an official work order. The exact executable action families must be finite and explicit in the canonical catalog/runtime; this does **not** authorize an unrestricted generic execution DSL.
- **S2 플레이어 전담 성적 업무지원 직원 지정권** — the player may designate/revoke a named adult employee as the player’s dedicated sexual-work support employee; the designation is an observable institutional assignment.
- **S3 회사 공용 성적 업무지원 담당 지정권** — the player may designate/revoke a named adult employee as a company-wide sexual-work support employee for scoped adult coworkers.
- **S4 공동 참여 승인권** — the player may approve additional scoped adult participants in a current sexual-work interaction. Bystanders are never auto-injected merely because this authority exists; participation follows the player’s actual approval/direction and scene reality.
- **S5 성적 업무 대상자 지정권** — the player may designate/revoke a named adult employee as the official target/assignee for a supported sexual-work assignment; the designation itself is an observable institutional event.
- **S6 성적 업무 공식 평가권** — the player may issue an official evaluation of a supported employee’s sexual-work performance. This remains narrative/institutional consequence, not an affinity/obedience/corruption stat engine.
- **S7 성적 업무 교육·훈련 지정권** — the player may designate a qualified scoped adult employee as trainer and direct training of another scoped adult employee, enabling grounded NPC-to-NPC scenes.

### Scope / selector law

CSA is **semi-free through per-preset bounded selectors**, not a generic DSL.

- each preset declares its valid subject scopes;
- each preset declares its valid counterparty/recipient/designation scopes where needed;
- named-adult employee selectors are used for designation presets where the product meaning requires them;
- direction-sensitive presets expose only meaningful direction combinations;
- the UI must not expose raw `trigger/action/duration/modifier` composition, internal IDs, revision numbers, or arbitrary JSON;
- multiple compatible active presets may combine; **simple finite rules + interesting combinations** is the target interaction model.

### Legacy R3 nine-item disposition

The previous exact-nine catalog is no longer product authority.

- `no_bra_under_work_clothes` semantics survive as W1.
- `no_panties_under_work_clothes` semantics survive as W2.
- `work_in_underwear_only` semantics survive as M1.
- `work_nude` semantics survive as M2.
- `target_places_requester_hand_on_waist_or_thigh` is retired/replaced.
- `masturbate_for_recipient` is retired as a primary preset.
- `vaginal_sex_with_recipient` is retired as a standalone strong-tier slot; strong tier is authority-oriented.
- `player_request_executes_immediately` is retired in its generic form and replaced by bounded S1/S2-S7 authority semantics.
- `continue_until_recipient_orgasm` is retired as a required standalone catalog slot. Persistence/termination semantics, where needed, must be defined narrowly by the concrete supported rule/scene and may not grow into a generic sexual-action engine.

Historical persisted IDs/rows may be kept only as proven compatibility/evidence readers. Do not rewrite preserved evidence games merely to rename catalog history, and do not expose retired items as new selectable product rules.

## P-CSA-002 — APPLY / CHANGE / REMOVE are dedicated Story turns

The previous zero-turn CSA bridge is superseded.

APPLY / CHANGE / REMOVE are **major in-world rule-change events that consume exactly one gameplay Story turn when successfully committed**. They are not ordinary free-text player actions and Story may not reinterpret which rule/scope operation occurred.

Binding flow:

1. UI submits a structured `rule_change_turn` (or equivalent server-owned structured event) containing the exact validated operation and bounded preset scope.
2. The turn kernel reserves/fences that logical turn using the same server-owned correctness guarantees as ordinary play.
3. The rule-change transaction is staged authoritatively; the prior rule state remains canonical until the rule-change Story turn successfully commits.
4. Story is called once with the exact structured rule-change event, current scene, relevant registered character canon, and prior/next rule authority needed to dramatize the institutional announcement.
5. Story visibly shows the grounded announcement channel and immediate same-turn reactions. It does not invent private-app awareness or supernatural propagation.
6. The one existing post-Story observer may project same-turn MM and other accepted grounded fields.
7. On successful atomic Commit, the new active-rule state and the rule-change Story turn become canonical together. A failed Story/observer-local failure must not leave a half-applied rule state.
8. Later ordinary turns continuously receive all active rule premises/scopes until changed/removed. The announcement turn does not consume, satisfy, or finish the active rule itself.

A rule change therefore remains Story -> one Observer at the LLM layer, not “transaction Story + reaction Story” and not a second aftereffect engine.

## P-CSA-003 — CSA reaction/adaptation separation

Every rule-change acceptance must preserve these separations:

- new institutional rule vs retroactive memory rewrite;
- authoritative compliance vs private liking/consent-as-feeling/desire/arousal;
- immediate surprise/embarrassment/reluctance vs later character-specific adaptation;
- institutional designation/authority vs generic relationship or obedience score;
- rule scope vs unrelated characters/scenes.

Do not add `타락도`, corruption, sexual-adaptation, obedience, generic consent, or relationship meters to represent this arc.

## P-MEDIA-001 — Image/TTS are grounded presentation sidecars

Image and TTS never block/redefine Story or Commit and never become narrative truth. TTS OFF means zero TTS calls.

Images must be grounded to the current committed registered heroine and current committed scene class. A general office scene must not silently display an unrelated adult/sexual image; an actually established adult/intimate/sexual scene should be able to reach an appropriate curated adult image when available. A requested-but-refused act is not evidence that the act occurred.

Media selection may use a small presentation-only hint derived by the existing post-Story observer or deterministic post-commit projection. That hint is not durable gameplay state. Do not restore sexual-event ledgers, generic physical ontology, or add a separate image LLM for media selection.

The canonical media catalog contract is `MEDIA_CATALOG_CONTRACT.md`.

## P-UI-001 — Story-first product surfaces

Retain Story/current stream, History, full four choices + compact short action buttons, free input, current scene/character, Mind Monitor, player profile/state, company map, `상식개변` app, image/media, TTS, download, feedback, reset, and responsive/mobile access as applicable.

CSA app MVP surface is:

- `약함 | 중간 | 강함` as the three primary tabs;
- roughly seven rule cards per selected tier, with no extra category navigation;
- human-readable rule text and authority label;
- a `설정` flow that renders only selectors valid for that preset;
- separate active-rule visibility with `변경` / `해제`;
- no player-facing `template_id`, trigger enum, execution kind, revision, R3 identifier, JSON, or generic DSL fields.

Technical implementation vocabulary (`r3_*`, `revision`, `Commit`, internal retry jargon) should not appear as normal player-facing game language.

Mobile priority: Story -> full choices/compact actions/free input -> secondary insight/tools. Media/state/tools must not dominate reading flow. CSA configuration must remain reachable without replacing Story as the primary reading surface.

## P-REMOVED-001 — Do not restore removed complexity

Do not reintroduce without new owner decision:

- standalone NPC find/search;
- bold-choice probability/risk UI;
- hypnosis/personal suggestion system;
- generic relationship/emotion/consent engine;
- generic physical posture/contact ontology;
- dynamic player arousal/erection/ejaculation gameplay gauge;
- sexual-event ledger supporting such a gauge;
- generic corruption/sexual-adaptation/obedience meter;
- arbitrary LLM save-patch authority;
- automatic Story retry/regenerate-until-lucky;
- separate choice LLM;
- separate MM LLM;
- generic CSA execution DSL;
- historical 44/60+ rule CSA catalogs as active runtime.

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

The 21-slot CSA product semantics above must have **one forward canonical repository catalog source** containing stable runtime IDs, tier, human rule text, authority presentation, supported subject/counterparty selectors, and only the bounded implementation metadata required by each preset. The next implementation may adapt an existing canonical catalog file or create one clearly named source; it may not leave catalog meaning duplicated across frontend/runtime/SQL.

Forward image catalog semantic source is governed by `MEDIA_CATALOG_CONTRACT.md`.

The historical complete Company UI remains the high-parity presentation donor, but donor naming/implementation is not product authority. Full Story choices + compact short action buttons are explicitly retained.

---

# L3 — Gameplay / State / Memory model

## Kinds of truth

**Static content truth:** registered characters, locations, setup catalogs, the active 21-slot three-tier CSA catalog and per-preset selector contracts, media catalog metadata.

**Narrative truth:** committed literal player action + committed Story, plus committed structured rule-change Story events. This owns dialogue, rejection/acceptance, open-ended social/intimate consequences, promises, conflicts, immediate rule-announcement reactions, and scene events.

**Structural/mechanical truth:** validated player profile, time, current location, present actors, one `scene_note`, active CSA rule instances/scope/lifecycle/designations, four-slot clothing, and the minimum finite fields proven necessary by specific S2-S7 designation/authority presets.

**Presentation/interpretation:** MM, player-thought projection, four extracted choices/compact labels, media hint/image, TTS, focal/display character. These may fail locally and do not redefine narrative truth.

## Story context

Ordinary Story receives exact literal action, relevant profile, current scene/time, relevant registered character canon, all applicable active CSA premises/scopes/designations, clothing where relevant, recent raw committed turns, and older grounded chronological memory.

Rule-change Story receives the exact structured operation and bounded scope directly from the server-owned event; Story does not infer or rewrite the CSA transaction from natural-language prose.

Character context is a **bounded projection** of canonical content. Story receives only fields useful for acting the currently relevant characters; it does not receive whole `characters.json` records or unrelated private/body/catalog data merely because they exist.

Opening context follows the same relevance principle. Physical co-location does not require every co-located heroine’s full prompt card to be focal in the first scene. Opening should project a small natural focal cast sufficient to create a living interaction while preserving broader world/presence truth separately.

Story does not receive a precomputed success verdict, relationship stage, consent matrix, generic action taxonomy, generic physical execution plan, dynamic sexual/corruption meter, or historical non-canonical CSA semantics.

## CSA rule-change Story-turn bridge

The canonical CSA bridge is now a **dedicated structured Story turn**, not zero-turn.

- APPLY/CHANGE/REMOVE consumes one gameplay turn only on successful commit.
- one structured operation maps to one Story generation and one observer pass;
- active-rule state and the rule-change turn commit atomically;
- same-turn Story dramatizes institutional announcement and immediate reactions;
- same-turn MM may show grounded affected-character internal response;
- subsequent ordinary Story receives the active rule continuously;
- removal/change preserves committed history while changing future authority;
- no generic aftereffect engine, relation engine, consent DSL, corruption meter, or extra reaction LLM is added.

## One post-Story observer

Keep one small observer after Story. It may project only accepted structural/presentation fields such as elapsed time, location/presence evidence, replacement scene_note, clothing evidence, four copied choices, summary, Mind Monitor, grounded player-thought if any, safe dialogue/speaker presentation metadata, and a minimal optional media hint.

Observer failure is fail-open. No second Story generation. For rule-change turns, the observer may observe the committed Story reality but may not rewrite the authoritative structured CSA operation/scope.

## Memory

Recent turns remain raw. Older memory remains chronological and grounded in committed Story. Memory prioritizes facts/events that alter future interpretation, including promises, refusal/conflict, pressure/help, intimacy, CSA issuance/change/removal, immediate reactions, and gradual CSA adaptation, without turning them into generic numeric relation/adaptation state.

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

Normal ordinary turn remains two LLM calls: Story -> Observer. A CSA rule-change turn uses the same one-Story/one-observer architecture with a structured server-owned input event; it does not add a second Story or separate MM/reaction generator.

Do not redesign the engine because product output is currently weak. First fix content, prompt/context projection, observer contract, memory projection, media projection, and presentation at their owning boundaries.

The browser submits one literal ordinary action or one validated structured CSA operation and renders streamed/committed context; it never owns Story -> Observer -> Commit orchestration.

---

# Reference evidence, not authority

- Draft PR #95: product-first redesign provenance.
- Draft PR #96: A′ architecture provenance.
- Draft PR #103: Owner CSA redesign provenance. Its promoted product-law decisions are now binding in this canon; the draft branch itself remains non-authoritative and should not be merged as if it were the canon.
- Issue #102 Crack review: benchmark/reference evidence only. Do not copy Crack stats, keyword-book, hidden architecture, prompt-length quotas, or inferred platform behavior. Its useful lesson is that richer dramatizable character material and context continuity help realize laws already defined here.
- Issue #68 browser product audit terminal `5394232327`: current implementation defect evidence.
- Issue #68 Stage-A terminal `5396213794` / review `5396294637`: accepted narrative/MM/recovery implementation evidence.

Any future product-law change requires explicit owner decision, canon document update first, then implementation task registration.