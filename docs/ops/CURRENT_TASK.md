# Company — CURRENT TASK

Status: READY
Task ID: company-r3-canon-convergence-staged-repair-v3
Mode: OWNER-ACCEPTED CANON — STAGED REPAIR / TEST DEPLOY / REAL BROWSER ACCEPTANCE
Updated: 2026-08-24 21:17 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Canon revision before this task: `32c5568b8b692e0e126bfb4e546bcd5d09fe93ec`
Original consolidated canon provenance: `b6af51cbcf7d1d870ae48de012d5da42de161019`
Accepted implementation baseline: `c166eee1ccbca23227a7b8f6fd30800c4ba392bb`
Previous failed terminal: Issue #68 comment `5394670021`
Previous broad product audit: Issue #68 comment `5394232327`
Superseded unstarted READY task: `company-r3-canon-convergence-p1-repair-and-acceptance-v2` / comment `5394762066`

## Reuse / authority law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Overwrite it in place for lifecycle state; do NOT create another CURRENT_TASK file.
- Do NOT create an ops branch.
- Read before edit, in order:
  1. `AGENTS.md`
  2. `CURRENT_TRUTH.md`
  3. `docs/redesign/COMPANY_CANON.md`
  4. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
  5. `docs/redesign/MEDIA_CATALOG_CONTRACT.md`
  6. this CURRENT_TASK
- Latest explicit owner decision and main canon outrank old PRs/issues/tests/current behavior.
- PR #95/#96 and Issue #102 are provenance/reference only.
- Preserve A′. Do not redesign the engine.
- Do not redo accepted `c166eee...` work unless evidence proves that landed behavior wrong.

Target terminal:
`CANON_CONVERGENCE_STAGED_REPAIR_COMPLETE_AWAITING_OPERATOR_REVIEW`

Never claim OWNER_READY in this task.

---

# 0. Why this task is staged

The previous convergence cut successfully landed character dramatization, bounded content projection, player-thought/MM guards, media manifest plumbing, media hints, CSA scope/residue work and memory contracts; focused tests and full tests passed and exact TEST API/frontend were deployed. Real browser play then found two P1 failures and stopped before the full acceptance matrix.

Do not repeat the old pattern of changing every subsystem at once and judging quality only at the end. Execute the following stages IN ORDER. A stage must close all newly proven P0/P1 defects in its own scope before large source changes for the next stage begin.

Per-stage loop:
`inspect evidence -> smallest owning-boundary fix -> focused tests/syntax/diff -> exact TEST deploy if source changed -> bounded real-browser acceptance -> classify`

If a stage still has a reproducible P0/P1 after its bounded repair/replay, STOP at WAITING_REVIEW with evidence. Do not compensate by modifying later stages.

Do NOT run the entire suite after every stage. Run focused deterministic contracts per stage. Run the full suite once at the final convergence checkpoint in Stage D, unless a particular source change has an established mandatory predeploy gate that itself requires more.

---

# Stage A — Narrative core + the two proven P1s

Canon: `P-AGENCY-001`, `P-PLAYER-THOUGHT-001`, `P-STORY-001`, `P-CHARACTER-001`, `P-OPENING-001`, `P-MEMORY-001`, `P-MIND-001`.

## A1. P1 stale-turn timeout forensic and root fix

Preserve/read-only prior evidence game:
`3295849e-3734-4c96-90f7-8ea54042968c`

Its Turn 11 action left committed_turn at 10 and the deployed UI showed `company_r3_stale_turn_timeout` / `Retry failed action`.

Before editing, reconstruct the exact boundary for that action using available request/job/system-event/read-only DB evidence:

`browser request -> R3 route -> job/lease -> Story -> observer -> commit/reconnect -> UI timeout classification`.

Classify the first broken boundary. Fix that boundary only.

Forbidden shortcuts:
- blind timeout inflation;
- hidden retry/regeneration;
- provider/model/temperature/token change;
- automatic sample-until-pass;
- client-side fake commit;
- a second turn writer.

A failed action must remain explicit/recoverable, but normal one-shot actions must not become permanently stale due to a broken lease/reconnect/terminal-state path.

## A2. P1 Story <-> Mind Monitor identity coherence

Preserve/read-only prior evidence game:
`17b85d0b-fc18-4a6f-9670-caab09cf09e8`

The Story participant and Mind Monitor heroine identity disagreed. Trace:
`Story registered actor identity -> observer raw mind_monitor key -> normalizer/applied projection -> frontend label`.

Fix the earliest broken boundary. MM may include only registered relevant/current-scene actors and must describe the same committed reality as Story.

Do NOT add fuzzy/near-name speaker inference or a second MM LLM. Invalid identity projection should drop/warn locally; valid Story must still commit.

## A3. Opening focal cast/context — inspect source, not prompt only

Inspect the current Opening actor/context collection including `relevantActorIds(opening)` or equivalent logic. Determine whether all heroines sharing the starting/default location are automatically receiving full character prompt cards and creating roster-dump pressure.

Preserve world/presence truth, but narrow **focal Story character projection** where appropriate. Opening should normally dramatize a small natural focal interaction rather than hand Story all co-located heroine cards merely because their default location matches.

Do not hide/remove physically present registered people from canonical world state just to simplify prose. Distinguish `present` from `focal prompt context`.

## A4. Character projection remains bounded

`content/characters.json` is canonical content, but Story must NOT receive whole character records.

Inspect the current `heroineCard()` / active-character projection. Keep an explicit whitelist of acting-useful fields. Include newly added dramatization fields selectively (initiative, speech/social distance, conflict/embarrassment, private-life behavior, hierarchy, intimacy/boundary, CSA first reaction/adaptation, continuity, a few dialogue examples) while excluding unrelated private/body/catalog data unless a separate canon rule makes it relevant to that scene.

The solution to thin characters is richer **bounded projection**, not dumping the entire JSON into the prompt.

## A5. Narrative behavior already landed — verify before re-editing

Verify the `c166eee...` character/Story/player-thought/MM/memory changes in source and focused tests. Only patch proven gaps. Preserve:
- dossier labels are acted, not recited;
- work is context, not universal solution;
- literal player actor/target/topic/refusal/self-state/intent;
- player_inner_thought grounded-only;
- MM `{surface, subconscious}` and same-reality semantics;
- recent raw + older grounded chronological memory;
- four semantically different Story choices.

## A6. Stage-A validation gate

Focused deterministic tests for the changed boundaries only, plus syntax/JSON/diff checks.

Deploy exact changed TEST API/frontend as required.

Then run one fresh adult-profile real-browser session of **8–10 ordinary turns**, no retry/sample-until-pass, covering:
- Opening living-scene focal interaction;
- social/non-work small talk;
- movement;
- one free input not suggested by choices;
- one refusal/change-of-mind/self-directed action;
- heroine conversation;
- multi-NPC when natural;
- player-thought negative case;
- MM identity and same-reality check;
- at least one adult/flirt/intimate request with de-escalation.

Stage A PASS requires no reproducible P0/P1 in narrative transport/agency/identity/MM/Opening scope. If not, STOP.

---

# Stage B — CSA zero-turn lifecycle + notice/reaction/adaptation + Rule 9

Begin Stage B only after Stage A passes.

Canon: `P-PREMISE-001`, `P-CSA-001`, L3 `CSA zero-turn event bridge`.

## B1. Prove current CSA UI/API transaction shape first

Do not assume current frontend is correct because the canon says zero-turn. Trace actual visible UI operation:
`CSA APPLY/CHANGE/REMOVE click -> frontend route -> server transaction -> durable state/system event -> committed_turn`.

Required behavior:
- APPLY/CHANGE/REMOVE consumes **zero ordinary gameplay turns**;
- no Story LLM call merely because the app button was pressed;
- committed ordinary turn number is unchanged;
- active rule/revision/system state changes atomically.

If current implementation routes CSA through ordinary `submit()`/turn flow, converge it to the existing non-Story transaction boundary rather than masking it.

## B2. Zero-turn event -> next Story bridge

A successful APPLY/CHANGE/REMOVE must leave one bounded canonical recent system event sufficient for the **next ordinary Story** to know that an official company rule was just issued/changed/removed.

The next Story must process the player’s actual literal action normally while also being able to dramatize first reaction/newness when relevant.

Required semantics:
- new official company/institution rule, not retroactive memory rewrite;
- NPC may be shocked/embarrassed/annoyed/questioning;
- applicable rule is authoritative and ultimately followed;
- compliance does not create affection/desire/arousal/romance/private consent-as-feeling;
- NPC cannot sense/know the private app;
- subsequent turns can show character-specific adaptation;
- CHANGE/REMOVE affects future authority and leaves committed history intact.

Do not add a second Story call or generic aftereffect engine.

## B3. Rule 9

`continue_until_recipient_orgasm` applies only if the qualifying current sexual action is already underway.

First try to solve/prove this by giving Story exact rule semantics plus current `scene_note`/recent committed Story. Do not create:
- sexual keyword regex authority;
- generic sexual-action enum;
- `current_sex_action` engine solely for this rule;
- sexual event ledger;
- generic execution/consent DSL.

Required live pair:
1. **negative:** no current qualifying action -> request for a new act must NOT become mandatory Rule-9 execution;
2. **positive:** qualifying action already underway -> request condition can require continuation to the rule endpoint.

## B4. Stage-B validation gate

Focused CSA lifecycle/system-event/Rule-9 tests only, plus syntax/diff.
Deploy exact TEST source if changed.

Real browser, adult user behavior, visible CSA UI:
- APPLY -> ordinary unrelated/social turn -> relevant reaction;
- at least one additional turn showing adaptation rather than instant memory rewrite;
- CHANGE -> ordinary turn -> changed authority only;
- REMOVE -> ordinary turn -> no stale enforcement;
- committed_turn unchanged by all app operations;
- Rule-9 negative and positive pair;
- MM may show surprise about the **new rule**, never private-app awareness.

No P0/P1 may remain in CSA scope before Stage C.

---

# Stage C — Media / dialogue-TTS / compact choice labels / reading UI / mobile

Begin Stage C only after Stage B passes.

Canon: `P-MEDIA-001`, `P-UI-001`, `P-INPUT-001`, `MEDIA_CATALOG_CONTRACT.md`.

## C1. Media catalog curation and stable locator

Repository semantic source remains `content/media_catalog.json`; Supabase `image_library` is deployed/query index.

`asset_locator` must be stable logical identity (for example bucket + object path / stable storage key / stable asset ID). Do NOT write signed URLs, temporary CDN URLs, or session URLs into canon/manifest. Runtime resolves serving URLs.

Read-only inventory actual existing Company `image_library` rows and, where safely inspectable, registered Storage objects. Do not invent assets.

For adult-pool assets, **do not guess situation/tags** from filenames or row count. Only mark active/curated metadata when the image or trusted existing metadata establishes the meaning. Ambiguous assets remain inactive/unclassified/manual-curation debt.

Preserve truthful known baseline rather than fabricating coverage.

## C2. General/sex reachability

Use the existing minimal presentation-only `media_hint` path. Prove/fix:
- correct registered heroine;
- ordinary scene -> appropriate general;
- genuinely committed adult/intimate scene -> appropriate curated sex asset when one is truly available;
- requested-but-refused/non-occurring act -> no false sex image;
- de-escalation/end/leave -> stale sex image cleared;
- media failure never blocks Story/Commit.

No media LLM, sexual ledger, generic physical ontology.

## C3. Compact choice label policy

Preserve the two-layer UI:
- full four Story choices;
- four compact quick-action buttons;
- click submits the **full literal** choice.

Update compact-label derivation only as needed so labels are roughly five characters/very short **and meaningfully distinguishable**. They are not required to be exactly five characters or a blind prefix slice. Four buttons should be recognizable and correspond clearly to their full choices.

Do not remove the two-layer UI.

## C4. Dialogue/TTS + Story reading UX

Verify/fix only proven boundaries:
- registered dialogue can reach dialogue-card/TTS projection;
- TTS OFF = zero synthesis calls; ON/replay works without resynthesis on replay when existing contract says so;
- no fuzzy speaker repair;
- next Story streaming does not unnecessarily blank/cover the reading surface;
- normal player UI does not expose `r3_*`, `revision`, `Commit`, `Retry failed action` or equivalent internal wording as game language; diagnostics may retain codes;
- feedback unavailable/disabled state is understandable rather than fake-success.

## C5. Mobile

Actual browser at desktop and ~390x844.
Priority must remain:
`Story -> full choices/compact actions/free input -> secondary MM/media/state/map/CSA tools`.

Fix proven horizontal overflow, action reachability, reading-order or panel domination. Do not redesign for aesthetics unrelated to evidence.

## C6. Stage-C validation gate

Focused media/frontend/dialogue/TTS/choice tests only, plus syntax/JSON/diff.
Deploy exact changed TEST source.

Run a bounded real-browser presentation session proving the above. No P0/P1 in presentation/media scope before Stage D.

---

# Stage D — Final holistic live acceptance

Only after A/B/C pass.

## D1. Final deterministic convergence checkpoint

Run focused invariant groups as appropriate, then **one full suite** as regression signal. Triage failures against canon; do not restore superseded behavior to make stale tests green.

No numeric pass count substitutes for browser acceptance.

## D2. Fresh real-browser campaigns

Use the deployed bare public TEST frontend and actual browser UI. Do not reuse prior failed campaigns as pass evidence; preserve them read-only.

Campaign A:
- fresh adult junior/ordinary profile;
- Opening + **15+ ordinary turns**.

Campaign B:
- fresh adult authority/experienced profile;
- Opening + **10+ ordinary turns**.

Extend at least one campaign to **20+ ordinary turns** if needed to prove memory beyond the recent raw window.

No direct gameplay API substitute, DOM mutation, storage preseed, hidden retry, regeneration, or sample-until-pass.

Across final campaigns cover the full `LIVE_ACCEPTANCE_MATRIX.md`, including:
- non-work small talk;
- heroine differentiation;
- adult/flirt/intimate play as a real adult user, not only polite office play;
- refusal/change-of-mind/stop/de-escalation;
- interrupt ongoing interaction;
- alone/self-directed action;
- movement and registered heroine identity;
- multi-NPC scene;
- work as context, not task funnel;
- permanent agency probes (Han Ribe lunch, alone-at-window, Mina movement when context permits);
- player-inner-thought negative cases;
- MM raw/applied identity and same-reality;
- CSA zero-turn issue/change/remove + reaction/compliance/adaptation;
- Rule-9 negative/positive;
- long-memory relational context;
- general/adult media evidence according to truthful curated catalog;
- History and refresh/re-entry;
- dialogue/TTS;
- desktop + 390x844.

Record important boundaries as:
`literal/visible action -> Story/system event -> observer raw -> observer applied -> durable state -> next Story/UI`.

Structural green does not excuse product defects.

---

# Global prohibitions

Unless a new owner decision explicitly changes canon, do NOT add:
- generic relation/consent/emotion engine;
- generic physical/posture/contact ontology;
- generic sexual-action/CSA execution DSL;
- sexual event ledger/dynamic sexual gauges;
- second Story/choice/MM/media LLM;
- semantic/fuzzy speaker or actor repair;
- automatic retry/regeneration-until-lucky;
- provider/model/config/secret changes as quality fixes;
- Production access/deploy;
- destructive DB/migration-history changes;
- a new CURRENT_TASK file or ops branch.

Historical/evidence games remain READ ONLY unless a task explicitly names a disposable game for mutation/reset.

---

# Completion

Post one terminal report to Issue #68 containing:
- start/final main and accepted source SHA(s);
- confirmation current main canon was read before each stage;
- Stage A/B/C/D PASS/FAIL and exact browser game IDs;
- exact first broken boundary for every repaired P0/P1;
- changed files grouped by canon owner;
- focused test/deploy evidence per stage;
- final full-suite result and stale-test triage;
- exact TEST API/frontend Worker versions;
- CSA zero-turn proof with committed_turn before/after app operations;
- Opening focal-cast/context proof;
- bounded heroineCard projection proof;
- MM identity proof;
- Rule-9 negative/positive proof;
- media manifest counts, stable locator form, curated vs unclassified adult assets, general/sex browser reachability;
- compact-label/full-literal proof;
- long-memory evidence;
- desktop/mobile evidence;
- remaining defects P0/P1/P2/P3;
- explicit source/deploy/DB operations.

Then overwrite this SAME file in place to `Status: WAITING_REVIEW` and STOP.

Terminal:
`CANON_CONVERGENCE_STAGED_REPAIR_COMPLETE_AWAITING_OPERATOR_REVIEW`

Do not register a next task yourself.