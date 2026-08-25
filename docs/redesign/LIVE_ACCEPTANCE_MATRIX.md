# Company Live Acceptance Matrix

Status: **OWNER_ACCEPTED / BINDING L1**  
Accepted: 2026-08-24 KST  
Revised: 2026-08-25 KST — owner recurrence-root addendum `5406605153` promoted  

Automated tests protect catastrophic invariants. **Actual deployed browser play is the product gate.**

A green turn Commit, DB readback, four-choice count, or healthy network call is not product acceptance.

## A-LIVE-001 — Real browser / real player behavior

Use the bare public TEST frontend in a real browser. Create fresh disposable games through visible Setup. Use visible free input, visible native choice clicks, visible CSA/map/History/TTS/media/feedback controls. No direct gameplay API as a substitute.

Automation must play like an adult user of an adult character simulation, not a polite corporate checklist.

Across acceptance campaigns include:

- ordinary non-work small talk;
- direct heroine conversation and follow-up;
- attraction/flirting/suggestive conversation;
- explicit adult/intimate request in plausible context;
- escalation **and** de-escalation;
- refusal;
- changing one’s mind;
- stopping/changing an ongoing conversation/contact/intimate interaction;
- being alone / asking to be left alone;
- self-directed thought/action;
- topic switch away from work;
- multi-NPC reaction;
- movement between distinct locations;
- work context without making work the mandatory objective;
- CSA APPLY/CHANGE/REMOVE through the visible three-tier app, including rule-change Story turns and later ordinary turns under active authority;
- compatible multi-rule combinations;
- refresh/re-entry;
- History and mobile inspection.

No stochastic retry/sample-until-pass.

Targeted 2–6 turn fixtures are for finding/fixing one boundary, not product acceptance. Before any `OWNER_READY` claim, run several ordinary **15–30 turn** browser games that judge character, Story, CSA, memory, agency, and continuity as a game. A long play is still evidence collection, not permission to patch many unrelated defects in one campaign.

## A-AGENCY-001

For representative free inputs record:

`literal input -> Story semantics -> observer raw -> observer applied -> durable state -> next Story/UI`

Fail when actor/target/action/topic/refusal/self-state/movement/intent is silently substituted.

Permanent probes include:

- `한리브 대리와 점심 메뉴에 대해 가볍게 이야기한다.` — must actually target 한리브 and lunch.
- `혼자 창가에 서서 오늘 아침의 낯선 앱에 대해 생각한다.` — must actually become/stay alone unless a concrete constraint prevents it.
- explicit registered-heroine movement, including 윤민아 when practical — no fabricated near-name NPC/wrong speaker.
- explicit refusal followed by changed intent.
- explicit request to stop/change an ongoing interaction.

## A-PLAYER-THOUGHT-001

On turns where the player did not state an internal desire/judgement, visible player inner thought must not invent attraction, “내 마음대로 해도 된다” permission, consent interpretation, moral judgement, or emotional decision.

If the player explicitly states a thought/feeling, projection may preserve it without changing meaning.

## A-CHARACTER-001

Over 10+ turns with multiple heroines:

- each heroine’s speech, initiative, embarrassment/conflict/help style remains distinguishable;
- canonical registered identity facts used by Story remain stable across turns; when Story states a registered NPC's formal department, position/rank, or role title, it must not invent a downgrade/upgrade or contradictory title relative to canonical repository content;
- character prompt labels are not recited as dossier prose;
- the same stimulus does not make every heroine respond with interchangeable office logic;
- adult/emotional situations are not routinely converted into “meeting schedule / report delay” solutions;
- prior meaningful encounters alter later tone where relevant.

## A-OPENING-001

Opening feels like entering a living Company scene. Characters are introduced through interaction/events rather than a five-profile roll call. The private unfamiliar app exists but has not changed reality merely by existing.

Before PLAYER explicitly reveals the app:

- passive player-private device-local/narrator exposure is allowed;
- Company, HR, security, onboarding, training, company artifacts, or another NPC must not install, distribute, recommend, require, explain, recognize, or announce `상식개변`;
- no generic substitute employee app may be used to smuggle in that provenance;
- later institutional channels may announce a committed **rule effect**, never the private app as its source.

## A-CHOICE-001

Every ordinary Story normally authors four literal choices. A committed CSA rule-change Story turn should also end in the normal four-choice Story convention for the resulting scene. Choices must be meaningfully different directions.

The intended UI is:

- four full choices visible with the Story;
- four separate compact roughly-5-character buttons;
- button click submits the full corresponding literal.

Do not report the two-layer design as duplication. Fail only for correspondence/submission/layout problems or semantically collapsed choices.

## A-MIND-001

For meaningful heroine interaction:

- MM uses `{surface, subconscious}` and does not disappear because the observer emitted an incompatible string shape;
- only relevant/current actors normally appear;
- content is first-person character thought, not action narration;
- Story and MM describe the same world;
- new/changed/removed CSA rule surprise, embarrassment, reluctance or awkwardness is allowed;
- same-turn MM on a rule-change Story must correspond to the actual announced rule and affected actor;
- supernatural/private-app awareness is not allowed;
- compliance is not rewritten as desire/consent-as-feeling.

Track both raw and applied observer when MM is empty/suspicious.

## A-MEMORY-001

Use 20+ turns when validating long memory. Establish at least one distinctive earlier refusal/conflict/help/promise/intimate/CSA-adaptation event, leave the topic, exceed recent raw context, then return.

Pass only if later reaction reflects the grounded prior context without inventing a numeric relationship stage or forgetting because an optional summary failed.

CSA issuance/change/remove and character-specific adaptation should remain interpretable later without a corruption/adaptation meter.

## A-CSA-001 — Three-tier catalog / selector surface

The visible CSA product must match binding canon:

- primary tabs are `약함 | 중간 | 강함`;
- seven canonical product slots are exposed per tier (21 total), subject only to explicitly documented temporary implementation staging during a non-release development cut;
- no extra category navigation is inserted merely to mirror internal metadata;
- each preset exposes only its valid bounded subject/counterparty/designation selectors;
- direction-sensitive rules do not allow nonsensical reversal;
- S2/S3/S5/S7 named-role rules provide explicit named-adult employee selection where applicable;
- raw `template_id`, trigger/action/duration DSL, revision, R3 IDs and JSON are not player-facing;
- retired exact-nine presets are not silently exposed as new active catalog options.

For catalog verification record the visible rule card -> canonical W/M/S slot -> runtime template ID mapping.

## A-CSA-002 — Rule-change Story turn / announcement / atomicity

Test APPLY, CHANGE and REMOVE through the visible app.

For each operation record:

`visible structured selection -> validated rule_change operation -> reserved logical turn -> streamed Story announcement -> observer raw/applied -> active-rule durable state -> next Story/UI`

Pass requires:

1. the operation consumes **exactly one gameplay turn on successful commit**;
2. it is not serialized as an ordinary free-text player action for Story to reinterpret;
3. Story visibly dramatizes a grounded institutional announcement (phone/company monitor/intranet/company messenger/HR or equivalent appropriate channel);
4. NPCs may recognize that the rule is new/changed/removed and react in character;
5. NPCs do not know the private app/supernatural cause, and company/HR/security/onboarding/training/NPC channels never become provenance for the private app itself before explicit PLAYER reveal;
6. same-turn MM, when present, matches the same affected actor/rule reality;
7. active-rule state and the rule-change Story turn become canonical together — no half-applied rule after a failed Story turn;
8. no duplicate Story/Commit occurs on refresh/reconnect;
9. later ordinary turns continue to receive the active rule until CHANGE/REMOVE;
10. the announcement turn itself does not satisfy/finish the ongoing rule;
11. CHANGE/REMOVE changes future authority without rewriting committed history.

If Story/provider failure is deliberately or naturally encountered, prove prior rule state remains canonical unless the rule-change turn successfully committed.

## A-CSA-003 — Reaction / compliance / adaptation separation

Across at least one disruptive Weak/Medium rule and one Strong authority rule verify:

- new official institutional rule, not retroactive “always normal” memory;
- immediate surprise/confusion/embarrassment/annoyance/reluctance can coexist with compliance;
- once a continuous rule successfully commits, it is current authority immediately;
- when a continuous rule's applicability condition is already true in the current scene, the first materially applicable Story beat visibly makes its required premise/state true rather than replacing compliance with `확인해보겠다`, discussion, confirmation, or future deferral;
- if the scoped actor is absent or the trigger/context is not currently applicable, do not force remote exposition; verify enforcement on the first later applicable beat instead;
- compliance does not create unrelated attraction, romance, comfort, arousal, loyalty or private consent-as-feeling;
- later turns can show character-specific adaptation without a numeric corruption/adaptation/obedience system;
- unrelated characters or scenes are not forced by out-of-scope rules.

## A-CSA-004 — Finite rule-specific semantics

Do not accept “the catalog loaded” as semantic acceptance. Exercise representative slots across all three tiers.

Minimum owner-ready representative set:

- Weak clothing: W1 or W2;
- Weak recurring conversation/contact: one of W4-W7, including W7 recurring conversational behavior without wall-clock timer logic;
- Medium clothing: M1 or M2;
- Medium direct physical/sexual institutional rule: one of M3/M4/M6/M7;
- Medium world-norm combination: M5 combined coherently with another compatible rule when practical;
- Strong direct bounded authority: S1;
- Strong named designation: at least one of S2/S3/S5;
- Strong multi-NPC capability: S4 or S7;
- Strong evaluation consequence: S6 when practical.

For S1, verify only catalog-supported finite action families receive institutional authority. A free-form unsupported action must not become mandatory merely because S1 exists.

When exact S1 scope/direction and a supported finite action-family match are satisfied, the behavior must **begin in the same Story turn**. Character reaction may surround execution but must not replace it with `뭐라고요?`, rule discussion, confirmation, refusal-as-veto, or future deferral. Unsupported/ambiguous actions remain ordinary requests. Do not accept a generic action executor/DSL as the solution.

For S4, verify bystanders are not auto-injected; an additional adult joins only when the player actually approves/directs participation and scene reality permits it.

For S6, verify evaluation changes narrative/institutional context without creating a hidden numeric affinity/obedience score.

## A-CSA-005 — Multi-rule combination and residue

Create at least one compatible two-rule combination and one three-rule combination during extended acceptance.

Pass requires:

- each active rule remains independently inspectable;
- Story can apply multiple compatible premises without collapsing them into one generic sexual mode;
- CHANGE/REMOVE of one rule does not erase or corrupt unrelated active rules;
- no stale enforcement remains after REMOVE;
- no historical retired rule is resurrected as a side effect;
- combination handling does not require a player-facing generic DSL.

Mandatory provenance regressions after the core P1 lanes:

- **M1 -> CHANGE same rule instance to W3:** M1-owned `uniform_top=removed` / `uniform_bottom=removed` must not survive merely because the old template was overwritten. W3 must be able to represent its own normal shirt/blouse worn/open premise.
- **W1 -> REMOVE:** W1-owned `underwear_top=removed` must not survive as current authority unless another active rule or later independently committed Story supports the same fact.
- General rule: CHANGE/REMOVE retracts requirements owned only by the replaced/removed rule before the new active set is interpreted; independent active-rule or later Story evidence may still support the same physical fact.
- These regressions must remain bounded to the finite rule-owned state boundary; do not build a generic clothing constraint solver.

## A-MEDIA-001

Use ordinary and genuinely committed adult scenes. Verify actual `/media/image` pool/request/response and visible image.

Pass rules are in `MEDIA_CATALOG_CONTRACT.md`; specifically prove an adult scene can actually reach sex-pool media and a refused/non-occurring act cannot.

## A-DIALOGUE-TTS-001

Registered-character dialogue should render naturally and, when using the accepted visible dialogue convention, be eligible for dialogue-card/TTS projection. Parser failure must fail open to readable Story, but systematic Story-format/parser mismatch that makes the retained dialogue/TTS surface inert is a product defect.

TTS OFF = zero calls. Replay should not silently re-synthesize unnecessarily.

## A-UI-001

Desktop plus at least 390x844 mobile:

- Story readable first;
- streaming does not blank/cover reading surface in a jarring blocking way;
- full choices + compact buttons + free input reachable;
- right-side/secondary panels do not dominate mobile reading;
- CSA `약함/중간/강함` tabs, rule cards, bounded selectors and active-rule change/remove controls remain usable on mobile without hiding the Story flow;
- technical `r3_*`/`revision`/`Commit` jargon is not normal game copy;
- History chronology is understandable, including rule-change Story turns;
- feedback/TTS availability is explicit rather than looking randomly broken.

## A-QA-PERMANENT-001 — Permanent lanes

Every owner-ready claim must have evidence across separate lanes:

1. ordinary social/non-work;
2. adult/intimate;
3. semantic agency/refusal/change-of-mind;
4. movement/alone/multi-NPC continuity;
5. CSA three-tier catalog + bounded selectors;
6. CSA APPLY/CHANGE/REMOVE Story turns + announcement/MM/atomicity;
7. representative Weak/Medium/Strong rule semantics + multi-rule combinations;
8. MM/player-thought;
9. memory beyond recent raw window including CSA adaptation;
10. media/TTS/feedback/History;
11. desktop/mobile;
12. refresh/reconnect/duplicate-submit structural integrity.

A four-turn P0/P1 smoke can be a deploy sanity check but can never produce `OWNER_READY` by itself. Before owner-ready, complement targeted fixtures with several ordinary 15–30 turn browser games and judge the product as a continuous character/story simulation.

For each defect record severity, domain, reproducibility, first broken boundary, visible impact, and why previous QA missed it.
