# Company — CURRENT TASK

Status: READY
Task ID: company-r3-canon-convergence-product-repair-v1
Mode: OWNER-ACCEPTED CANON CONVERGENCE — IMPLEMENT / TEST / TEST-DEPLOY / REAL BROWSER REPLAY
Updated: 2026-08-24 19:55 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Registration canon SHA: `b6af51cbcf7d1d870ae48de012d5da42de161019`
Previous browser-audit terminal: Issue #68 comment `5394232327`
Crack reference: Issue #102 — reference only, never authority

Work on `main` only. Reuse this exact `docs/ops/CURRENT_TASK.md`. Do not create another task file or branch unless an objective Git conflict requires operator review.

## 0. Mandatory authority read — BEFORE source edits

Read in order and treat as binding:

1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
5. `docs/redesign/MEDIA_CATALOG_CONTRACT.md`
6. this CURRENT_TASK

Historical PR #95/#96, old tasks, old tests, current code, current DB behavior, and Issue #102 are evidence only. They may not override the main canon.

If source/tests conflict with canon, fix/rewrite/delete the lower-level assumption. Do not change canon to make current code easier.

Target terminal:
`CANON_CONVERGENCE_REPAIR_COMPLETE_AWAITING_OPERATOR_REVIEW`

Do NOT claim OWNER_READY in this task.

## 1. Purpose

Bring the current deployed R3 implementation back into the owner-accepted product canon after the 2026-08-24 real-browser audit showed that structural stability did not equal product correctness.

This is one coherent product convergence cut, not a redesign and not a chain of unrelated symptom patches.

Preserve A′:

```text
Company high-parity presentation/content
+ thin frontend controller
+ server-owned R3 turn kernel
+ Story LLM
+ one post-Story observer
+ atomic Commit
+ optional nonblocking media/TTS sidecars
```

Do not add generic relation/consent/emotion engines, generic physical ontology, generic CSA execution DSL, second Story/choice/MM/media LLM, automatic retry-until-lucky, or provider/model correctness swaps.

## 2. Required source repair A — character source + Story dramatization

Canon: `P-STORY-001`, `P-CHARACTER-001`, `P-OPENING-001`, `P-MEMORY-001`.

### Character source

Enrich the existing canonical five heroine entries in `content/characters.json` without changing their stable IDs/names.

Each heroine must provide compact but actionable dramatization material for Story, covering as appropriate:

- ordinary initiative/habits;
- speech rhythm/addressing/social distance;
- work vs private-life behavior;
- stress/anger/embarrassment/awkwardness/conflict;
- helping/caring behavior;
- hierarchy/power imbalance;
- attraction/intimacy/boundary reaction;
- newly issued CSA-rule first reaction;
- later CSA adaptation style;
- continuity after meaningful prior events;
- 2–3 short dialogue examples useful for voice, not script memorization.

Do not create a second character catalog. Keep prompt material bounded; no arbitrary 3000-character quota.

### Story behavior

Update Story prompt/context so it:

- **acts out** character traits instead of reciting internal labels/dossier facts;
- does not say things like `생활형 리더`, `빠른 판단형`, `조심스러운 관찰자`, `행동형 신입` as profile exposition unless a natural character literally says such words for an independent reason;
- gives different heroines different reactions to the same stimulus;
- treats work as social/world texture rather than the universal solution to adult/emotional situations;
- carries grounded prior refusal/conflict/pressure/help/promise/intimacy/CSA-adaptation context into later interpretation through existing memory/context, without generic relationship state;
- keeps the player literal actor/target/action/topic/refusal/self-state/movement/intent unchanged;
- authors exactly four semantically distinct next actions;
- does not make all four adult-scene choices the same escalation;
- uses the accepted natural visible dialogue convention `화자명(연기지시): "대사"` for registered-character dialogue where practical so dialogue-card/TTS projection can work, while keeping the surrounding Story natural prose and fail-open readable.

### Opening

Rewrite Opening prompt/content behavior as needed so the five heroines are not introduced as a roster/profile dump. Opening must be a living Company scene where one or more characters are learned through a small interaction/event. The private unfamiliar app is present but has changed nothing merely by existing.

## 3. Required source repair B — player thought + Mind Monitor

Canon: `P-PLAYER-THOUGHT-001`, `P-MIND-001`.

### Player inner thought

Observer/player-thought projection MUST NOT invent player attraction, desire, consent interpretation, moral judgement, emotional commitment, permission, or decisions.

Preferred narrow rule:
- if the literal player input explicitly establishes a thought/feeling/intention, a short faithful projection is allowed;
- otherwise player_inner_thought is empty/absent.

Do not use Story-generated invented player psychology as a loophole.

### Mind Monitor contract/reliability

Fix the observed schema/relevance failure without adding another LLM call.

- Observer contract must reliably emit `mind_monitor[actor_id] = {surface, subconscious}`.
- If malformed string entries still occur, do not silently present them as valid two-field MM. Preserve raw warning evidence; fix prompt/schema/output handling at the smallest owning boundary.
- Relevant/current-scene actor only by default.
- MM must be natural first-person character thought, not action narration.
- MM and Story must describe the same committed reality.
- Newly issued CSA surprise/awkwardness is valid.
- Private-app/supernatural awareness is invalid.
- CSA compliance must not become desire/consent-as-feeling/romance/personality rewrite.

Keep observer fail-open: valid Story survives MM failure; no second Story generation.

## 4. Required source repair C — CSA owner canon

Canon: `P-PREMISE-001`, `P-CSA-001`, `A-CSA-001`, `A-CSA-002`.

### Institutional notice/adaptation

Project active rule context to Story with exact semantics:

- APPLY = newly issued official rule/notice/policy at activation time;
- no retroactive `always normal` memory rewrite;
- NPC can notice newness and react in character;
- scoped applicable rule is authoritative and followed;
- emotional reluctance can coexist with compliance;
- compliance does not create unrelated affection/comfort/desire/arousal/private consent/romance/trust;
- later turns may show gradual character-specific adaptation;
- NPC never learns/senses the private app cause.

Ensure activation/change/remove timing is available to Story enough to avoid pre-activation hallucination and stale post-remove enforcement, without introducing a new generic aftereffect engine.

### Rule 9 narrow fix

`continue_until_recipient_orgasm` applies only when a qualifying **current sexual action is already underway** and the preset request condition is satisfied.

It MUST NOT turn a request for a new sexual act into mandatory execution when no qualifying current sexual action exists.

Implement the smallest preset-specific contextual distinction. Reuse `scene_note` / current committed Story context if sufficient. Do not create a generic sexual action DSL, sexual event ledger, or dynamic sexual state engine.

### Lifecycle

Fix any proven CHANGE/REMOVE residue so future Story receives only current active rule authority while committed history remains unchanged.

## 5. Required source repair D — grounded memory continuity

Canon: `P-MEMORY-001`, `A-MEMORY-001`.

Keep the existing simple memory architecture: recent raw turns + chronological grounded older memory/summary.

Ensure older memory preferentially preserves events that materially change later interpretation, including:

- refusal/boundary;
- conflict/pressure;
- help/care;
- promises/decisions;
- intimate events;
- meaningful CSA first-reaction/adaptation events.

Do not create generic event/relation labels or numeric relationship state. Preserve chronology and source-turn grounding. Blank optional summary must not erase committed events.

## 6. Required source repair E — canonical media catalog + reachable adult images

Canon: `P-MEDIA-001` and `docs/redesign/MEDIA_CATALOG_CONTRACT.md`.

### Canonical catalog

Create the forward repository semantic manifest:

`content/media_catalog.json`

Inventory actual existing Company image assets/read-only live `image_library` and, where safely inspectable, actual Storage objects under the registered heroine storage prefixes. Do not invent nonexistent image assets.

Manifest entries must use stable image metadata required by the media contract:
- image_id
- character_id
- pool `general|sex`
- situation
- tags
- active
- curation_rank
- asset locator/deployed mapping

Reconcile runtime/catalog readers so repository manifest is semantic/curation authority and `image_library` is the deployed query index. Avoid two independently editable semantic catalogs.

If actual general assets beyond the current one-per-heroine baseline do not exist, record that as a content-asset gap rather than fabricating images. Still make the catalog explicit and coherent.

### Selection/reachability

Fix the current dead adult path:
- frontend must not hardcode all current scenes to `general`;
- the current committed adult/intimate scene must be able to request/reach `sex` pool when actually established;
- a requested but refused/non-occurring act must not switch to sex media;
- de-escalation/end/leave must not retain stale sex media;
- wrong heroine is forbidden;
- image failure remains fail-open and never blocks Story/Commit.

Preferred implementation: add/repair a minimal **presentation-only** `media_hint` in the existing one observer or deterministic post-commit projection. It may include grounded character/pool/small tags. It is not durable world truth.

Do not restore sexual-event ledger, generic physical ontology, or add an image LLM.

Make selected pool/image id/reason observable enough in diagnostics to prove the browser path.

## 7. Required source repair F — Story presentation / dialogue / TTS / UI polish

Use audit evidence and actual browser review, not source suspicion alone.

### Story/dialogue

Fix any deterministic Story normalization/content-corruption path found in terminal `5394232327`. Preserve raw natural Korean Story and terminal four choices exactly enough that rendering does not corrupt player-visible content.

Ensure accepted registered-character dialogue convention can produce dialogue cards/TTS. Do not add fuzzy name inference or another semantic parser generation. Existing parser/observer projection must fail open to readable raw Story.

### UI copy

Remove/translate normal player-facing implementation jargon such as `r3_*`, `revision`, `Commit`, internal retry wording where the player can actually encounter it. Diagnostics/logs may retain technical codes.

### Streaming reading feel

Do not blank or cover the reading surface in a jarring way while the next Story streams. Preserve Story-first reading continuity while still showing current streamed content.

### Two-layer choice UI

PRESERVE intentionally:
- full four choices in Story;
- separate four compact 5-character buttons;
- full literal submitted on click.

Do not “fix duplicate choices.”

### Mobile 390x844

Rework only what actual browser evidence proves necessary so Story -> full choices/compact buttons/free input remains primary. Secondary media/MM/state/map/CSA tools must not dominate or create horizontal/reading-order friction.

### TTS / feedback

Keep TTS sidecar and OFF=zero calls. Verify one eligible heroine dialogue can be projected and played/replayed.

Make disabled/unavailable feedback state understandable to a player; do not add retries or fake success.

## 8. Tests — focused, canon-oriented

Add/rewrite only tests that cheaply protect deterministic contracts changed above.

Required focused coverage includes:

- player_inner_thought grounded-only behavior;
- MM object schema/relevance/fail-open;
- character-card internal labels not intentionally injected as Story instructions to recite;
- CSA activation-time institutional wording projection;
- CSA CHANGE/REMOVE current-state projection;
- Rule-9 no-current-action vs current-action continuation distinction;
- memory summary preserves grounded relational-context event without generic relation state;
- media manifest validation;
- general vs sex media hint/selection, refused-act negative case, stale-sex de-escalation case;
- full Story choices + compact button full-literal submission unchanged;
- dialogue/TTS projection for accepted visible dialogue format;
- no blocking/blank Story behavior if deterministic frontend test is cheap.

Run focused tests first. Run the existing full suite as regression signal and triage failures against canon; raw count is not an acceptance metric. Delete/rewrite stale assertions that encode superseded product meaning.

No provider/model/temperature/token/timeout change to manufacture better output unless an objective transport-capacity failure is separately proven and operator-approved.

## 9. TEST deployment

After source review/tests are clean:

- land normally on `main`;
- deploy exact accepted source to TEST API/frontend only as required by changed files;
- no Production;
- no destructive DB work;
- historical migrations immutable;
- additive DB/index reconciliation only if genuinely required for media catalog and safely scoped;
- preserve previous QA/evidence games read-only.

Record exact source SHA and Worker version IDs.

## 10. Mandatory post-fix real-browser acceptance

Use the deployed bare public TEST frontend, actual Chrome/browser UI only for gameplay.

Create TWO fresh disposable adult-profile games.

### Campaign A
- ordinary/junior adult profile;
- Opening + at least 15 ordinary turns.

### Campaign B
- experienced/authority adult profile;
- Opening + at least 10 ordinary turns.

No direct gameplay API substitute, no retry/sample-until-pass.

Cover the complete `LIVE_ACCEPTANCE_MATRIX.md`, including:

- non-work small talk;
- heroine differentiation;
- flirting/adult request;
- refusal/change-of-mind/de-escalation/stop;
- alone/self-directed action;
- multi-NPC scene;
- movement;
- work as context only;
- permanent agency probes (한리브 lunch, alone-at-window, 윤민아 movement when context permits);
- player-inner-thought negative cases;
- MM raw/applied inspection;
- CSA new-notice reaction -> compliance -> later adaptation;
- Rule 9 both negative and positive precondition cases;
- CSA CHANGE/REMOVE residue;
- memory event beyond recent raw window (extend one campaign beyond 20 turns if needed to prove it);
- ordinary media variation;
- genuinely established adult scene must visibly reach an appropriate sex-pool image if catalog has one;
- refused/non-occurring act must not show false sex image;
- de-escalation must clear stale sex media;
- dialogue card/TTS once;
- History;
- refresh/re-entry;
- desktop and 390x844 mobile.

Record per defect/turn:
`literal -> Story -> observer raw -> observer applied -> durable state -> next Story/UI`.

A structural success does not excuse a product defect. Do not call `OWNER_READY` from this run.

## 11. Completion / terminal

Post a NEW Issue #68 terminal containing:

- start/final main and source SHA;
- canon SHA `b6af51cbcf7d1d870ae48de012d5da42de161019` and confirmation it was read first;
- changed files grouped by owning canon requirement;
- character-content changes for all five heroines;
- CSA semantic implementation evidence including Rule 9;
- MM/player-thought evidence;
- memory evidence;
- media manifest inventory/counts and DB/index reconciliation;
- exact TEST deployment versions;
- focused/full-test results with stale-test triage if any;
- two fresh browser game IDs;
- adult/live acceptance matrix results;
- general/sex image reachability evidence;
- desktop/mobile evidence;
- remaining defects sorted P0/P1/P2/P3;
- source edits/deploy/DB operations explicitly listed;
- recommendation for operator review.

Then overwrite this SAME file to:

`Status: WAITING_REVIEW`

Terminal:
`CANON_CONVERGENCE_REPAIR_COMPLETE_AWAITING_OPERATOR_REVIEW`

STOP. Do not create the next task yourself.