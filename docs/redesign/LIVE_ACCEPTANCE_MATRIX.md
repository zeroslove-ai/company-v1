# Company Live Acceptance Matrix

Status: **OWNER_ACCEPTED / BINDING L1**  
Accepted: 2026-08-24 KST

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
- CSA apply/change/remove with unrelated turns between;
- refresh/re-entry;
- History and mobile inspection.

No stochastic retry/sample-until-pass.

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
- character prompt labels are not recited as dossier prose;
- the same stimulus does not make every heroine respond with interchangeable office logic;
- adult/emotional situations are not routinely converted into “meeting schedule / report delay” solutions;
- prior meaningful encounters alter later tone where relevant.

## A-OPENING-001

Opening feels like entering a living Company scene. Characters are introduced through interaction/events rather than a five-profile roll call. The private unfamiliar app exists but has not changed reality merely by existing.

## A-CHOICE-001

Every ordinary Story normally authors four literal choices. They must be meaningfully different directions.

The intended UI is:

- four full choices visible with the Story;
- four separate compact 5-character buttons;
- button click submits the full corresponding literal.

Do not report the two-layer design as duplication. Fail only for correspondence/submission/layout problems or semantically collapsed choices.

## A-MIND-001

For meaningful heroine interaction:

- MM uses `{surface, subconscious}` and does not disappear because the observer emitted an incompatible string shape;
- only relevant/current actors normally appear;
- content is first-person character thought, not action narration;
- Story and MM describe the same world;
- new CSA rule surprise/awkwardness is allowed;
- supernatural/private-app awareness is not;
- compliance is not rewritten as desire/consent-as-feeling.

Track both raw and applied observer when MM is empty/suspicious.

## A-MEMORY-001

Use 20+ turns when validating long memory. Establish at least one distinctive earlier refusal/conflict/help/promise/intimate/CSA-adaptation event, leave the topic, exceed recent raw context, then return.

Pass only if later reaction reflects the grounded prior context without inventing a numeric relationship stage or forgetting because an optional summary failed.

## A-CSA-001 — New rule / reaction / adaptation

APPLY a visibly disruptive valid rule. Observe:

1. the rule becomes a newly issued official rule/notice;
2. NPC notices/reacts in character;
3. NPC does not know the private app/supernatural cause;
4. rule is followed when scoped/applicable;
5. compliance does not create unrelated desire/romance/comfort;
6. subsequent turns can show gradual adaptation.

CHANGE and REMOVE with unrelated turns between. Check stale residue.

## A-CSA-002 — Rule 9 exact boundary

Test both cases:

- **No qualifying current sexual action underway:** a player request for a new sexual act must not be forced by `continue_until_recipient_orgasm`.
- **Qualifying current sexual action already underway:** when the preset request condition applies, the current action may be required to continue until the preset end condition.

Do not accept a generic “all sexual commands execute” interpretation.

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
- technical `r3_*`/`revision`/`Commit` jargon is not normal game copy;
- History chronology is understandable;
- feedback/TTS availability is explicit rather than looking randomly broken.

## A-QA-PERMANENT-001 — Permanent lanes

Every owner-ready claim must have evidence across separate lanes:

1. ordinary social/non-work;
2. adult/intimate;
3. semantic agency/refusal/change-of-mind;
4. movement/alone/multi-NPC continuity;
5. CSA lifecycle + rule-specific semantics;
6. MM/player-thought;
7. memory beyond recent raw window;
8. media/TTS/feedback/History;
9. desktop/mobile;
10. refresh/reconnect/duplicate-submit structural integrity.

A four-turn P0/P1 smoke can be a deploy sanity check but can never produce `OWNER_READY` by itself.

For each defect record severity, domain, reproducibility, first broken boundary, visible impact, and why previous QA missed it.