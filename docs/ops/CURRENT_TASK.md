# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-physical-clothing-sexual-product-play-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5309409503` — `ACCEPTED_BLOCKED_EVIDENCE` for `minimal-story-runtime-csa-agency-continuity-product-play-v2`.
Previous terminal: `5309378384`; final docs SHA `494f00767199240398173c28220b74bf7321011e`.
Accepted Minimal Story Runtime executable SHA: `beae855ebc5a9706bae234af80b2569d73566f0a`.

The V2 product run is accepted evidence for the axes actually exercised: byte-for-byte Korean free text, one 9-turn continuous Story→Extract→Commit run, exact provider choices, canonical non-clothing CSA activation at its effective time, separation of that CSA from an unrelated personal request, coherent game time, refresh/history, replay/idempotence, and final reset. It is not labelled PRODUCT_PLAY_PASS because its temporary evidence reader requested `/api/context` with `recent_turns=10` and therefore did not explicitly capture the six-raw public-context boundary. Do not create V3 merely to reproduce that evidence. Current Story source already projects `turns.slice(-6)` plus older chronological `turn_summary_memory`, and prior live acceptance covered the six-raw boundary.

Independent operator verification before this registration:
- PR #67 remained OPEN / DRAFT / UNMERGED / mergeable at final docs head `494f00767199240398173c28220b74bf7321011e`.
- The V2 final commit was docs-only.
- Disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` is clean after reset: committed_turn=0, save_revision=1119, setup/opening not_started, canonical scene=setup with empty presence, Level 1/exp 0, csa_active=[], game_turns=0, game_actions=0.
- TEST Level-7 seam source still exists at `scripts/test-level7-acceleration.mjs` and is hard-scoped to the disposable TEST game/project.
- TEST migration `20260815000100_company_v1_test_level7_acceleration` is already applied. DO NOT REAPPLY, EDIT, OR REAUTHOR IT.
- Minimal Story Runtime migration `20260816050000_company_v1_minimal_story_runtime_contract` is already applied. DO NOT REAPPLY, EDIT, OR REAUTHOR IT.

Forbidden game IDs:
- Production/sentinel: `11111111-1111-4111-8111-111111111111`
- preserved manual: `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA evidence: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`

## Objective

Run one coherent disposable-TEST product-play scenario focused on the remaining narrow positive-path mechanics that have not yet been proved together under Minimal Story Runtime:

1. player physical/contact intent remains intent and Story decides what actually occurs;
2. durable NPC posture/position changes occur only when fresh Extract carries valid exact Story evidence for the changed axis;
3. compact clothing continuity follows Story-established clothing change and survives committed refresh/readback without becoming a general narrative authority;
4. intimate/sexual mechanical state (`player_sexual_state` and/or evidenced `sexual_event_ledger`) changes only when the Story actually establishes the corresponding event;
5. a sexual/intimate event does not automatically mutate unrelated consent, comfort, affection, trust, romance, relationship status, or CSA applicability;
6. image/media classification remains a presentation sidecar and cannot block Story→Extract→Commit;
7. exact free-text / provider literal transport, canonical time, committed refresh/history and replay/idempotence remain intact;
8. final canonical reset returns the disposable game to baseline.

This is a TEST product-acceptance task, not a source-fixing task. Do not create a new mechanic, semantic ledger, evidence gate, parser, retry, or compatibility path in order to make the scenario pass.

## Preflight

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Fail closed unless the game ID is exactly `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
3. Do not access any forbidden game ID.
4. Verify the TEST API Worker exact source lineage. If it already contains accepted executable `beae855ebc5a9706bae234af80b2569d73566f0a`, deploy 0. If exact lineage drift is proven, deploy only the accepted API lineage. Frontend deploy is forbidden.
5. Verify the TEST Level-7 seam RPC is live and the already-applied migration ledger contains `20260815000100_company_v1_test_level7_acceleration`. Do not apply/reapply any migration.
6. Use the existing guarded Level-7 seam only (`COMPANY_LEVEL7_SEAM_ENABLED=true`, fixed TEST project/game). No second fixture path, direct DB patch, or Production progression change.
7. Use a UTF-8-safe local execution/input path as established by the accepted V2 run. Do not regress to inline PowerShell non-ASCII source.

## One scenario attempt only

No provider retry/regeneration, second Opening, reroll for a preferred reaction, alternate scenario restart, or source patch.

### A. Prepare Level 7, Setup and Opening

- Starting from the clean disposable game, call the existing Level-7 fixture exactly once. It is allowed to perform its canonical reset and set only TEST `player_progress` to Level 7.
- Verify Level 7 / current capability from canonical readback; do not manufacture facts other than the fixture's existing progression acceleration.
- Run Setup + Opening once through the existing reviewed primitives.
- Verify exactly four provider-authored literal choices, canonical time/location/presence, and continue the same game without reset.

### B. Establish an evidence-grounded physical state change

Use natural adult workplace interaction and one or more exact UTF-8 player actions that make a posture/position/contact outcome possible without server-side manufacturing.

Requirements:
- player input is intent/attempt only; Story may accept, redirect with a plausible in-world result, or refuse according to the actual situation, but must not silently replace a harmless material intent with an unrelated action;
- inspect raw Story, parsed blocks, fresh Extract observation and committed `npc_scene_state`/physical display after each decisive turn;
- if a posture or position axis changes durably, record the exact Story evidence that justified that axis;
- if Extract proposes a changed axis without valid exact Story evidence, durable state must preserve the previous value and only a non-blocking warning may occur;
- do not edit/manufacture Extract output to force either case.

### C. Compact clothing continuity

Exercise one actual current clothing rule or natural clothing change only if it exists in the live content/scenario.

Preferred path:
- inspect the real Level-7 app manual/state and choose an existing applicable clothing-state CSA only if the current catalog exposes one with clear scope; otherwise use a natural player/NPC clothing interaction that Story may establish;
- if using a CSA, activate it only through `/api/app-state` → `/api/app-validate` → unchanged signed `structured_action` through Story/Extract/Commit;
- activation begins at its canonical effective time and is an in-force workplace premise only within its actual scope;
- verify Story-established clothing change projects into the compact clothing state, persists across later turns/refresh, and remains separate from affection/consent/relationship state;
- if Story never establishes a clothing change, do not force the state and record coverage limitation.

### D. Intimate / sexual narrow mechanics

Continue the same coherent scenario and use reasonable explicit adult player intent sufficient to exercise the existing intimate/sexual mechanics if the Story naturally establishes such an event.

Requirements:
- a CSA may normalize only what its actual rule says; it must never be cited as consent to an unrelated intimate/sexual request;
- if the Story establishes a supported sexual event, verify exact Story evidence, fresh Extract result, `sexual_event_ledger` append/dedupe, and any corresponding `player_sexual_state` mechanical delta;
- `sexual_event_ledger` is mechanical/UI history only. It must not automatically create or advance consent, comfort, affection, trust, romance, relationship stage, or unrelated CSA state;
- if the Story refuses or does not reach a sexual event, that alone is not a runtime defect. Record the coverage limitation and do not rerun until lucky;
- do not use a finite sexual taxonomy to judge whether an arbitrary narrative fact was allowed to occur. Only inspect the existing narrow mechanical projection when the Story actually establishes a supported event.

### E. Media / choices / time / refresh

Across the same scenario, aim for 10–14 committed ordinary turns unless a decisive product defect stops earlier.

- Mix exact UTF-8 free text with at least two actual provider-returned choice literals unchanged when available.
- Inspect choice sets for exact duplicates or effectively identical no-op restatements; do not server-repair choices.
- Capture canonical `world_state.game_time` each turn and note any real contradiction.
- Verify image/media selection may be null or use another valid classification without blocking Story/Extract/Commit. A presentation classification miss is not narrative failure.
- Fetch committed context/history after decisive physical/clothing/intimate turns and verify the same committed reality is rendered/read back.
- Preserve the existing six-raw + older-summary architecture; do not create a special evidence-only rerun for that already accepted boundary.

### F. Replay / idempotence

Before final cleanup, replay at least one committed ordinary action that includes a decisive narrow-state observation if available.

Verify:
- Story replay flags true;
- Extract replay true;
- Commit success/replayed true;
- no extra committed turn;
- no duplicate clothing/sexual ledger event;
- no repeated physical mutation;
- no save-revision mutation caused solely by replay.

## Stop-on-defect / coverage policy

On the first decisive product defect after a canonical request reaches the server:
- capture turn number, exact UTF-8 player input, canonical pre-state/time, raw Story, parsed blocks, Extract result, committed post-state/history and relevant narrow mechanic state;
- perform final canonical cleanup reset if safe;
- mark BLOCKED/FAILED and stop;
- no retry/regeneration/source patch/alternate scenario.

If a requested positive-path mechanic is simply not naturally reached in the single run:
- record `COVERAGE_LIMITATION` for that mechanic;
- do not classify absence alone as a defect;
- do not rerun solely to manufacture coverage.

Product PASS may only claim the positive paths actually observed. Do not overstate physical/clothing/sexual coverage.

## Final cleanup

Finish with one canonical reset and independently verify:
- committed_turn=0;
- game_turns=0;
- game_actions=0;
- processing idle/not active;
- setup/opening not_started;
- canonical scene=setup with empty presence;
- Level 1 / exp 0;
- csa_active=[];
- no Level-7 fixture residue remains.

## Architecture constraints

- Story LLM remains narrative authority.
- Extract observes Story-established narrow state; Commit is structural transaction authority.
- Player input/choice is intent, not a direct physical/sexual success writer.
- Exact Story evidence is required only for the existing narrow physical/clothing/sexual durable projections; do not generalize this into a narrative semantic gate.
- CSA is activation-time institutional/common-sense premise and stays separate from unrelated consent/emotion/relationship state.
- No generic relationship/event/emotion/open-fact memory ledger.
- No finite physical execution grammar or CSA enactment engine.
- Long continuity remains recent six raw turns + older natural-language `turn_summary`.
- Registered identity/navigation and canonical scene/time remain narrow deterministic mechanics.
- Choices remain provider-authored literal proposals.
- Image/media/TTS remain presentation sidecars.
- No new parser generation, semantic router/gateway, fuzzy matcher, compatibility layer, retry system, or third Summary/Memory LLM.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployed-identity inspection;
- existing guarded TEST Level-7 seam on the disposable game;
- exact reviewed TEST API deployment only if lineage drift is proven;
- disposable TEST Setup/Opening and one coherent gameplay scenario through existing canonical endpoints;
- read-only TEST DB verification for the disposable game only;
- external evidence artifacts outside the repository;
- docs-only completion commit and one immutable Issue #68 terminal report.

Not authorized:
- any forbidden game access;
- direct DB writes;
- migration/DDL author/edit/apply/reapply;
- frontend deploy;
- source/runtime/test/content/config behavior edits;
- provider/model/temperature/token changes;
- retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic gate, compatibility layer, new repository harness;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS the task only to the extent the single scenario proves actual observed product behavior for the requested narrow mechanics while preserving the Minimal Story Runtime spine, transaction/readback/replay contracts and final cleanup. A non-reached mechanic must be reported as coverage limitation, not silently marked passed.

On PASS, first real product defect, or bounded coverage-limited completion:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post exactly one immutable terminal report to Issue #68 with START SHA, reviewed/deployed Worker identity, Level-7 seam evidence, decisive physical/clothing/sexual turns and exact Story evidence, state deltas, unrelated consent/relationship checks, media/choice/time observations, replay result, coverage limitations, final reset, forbidden-operation confirmation and FINAL docs SHA;
- STOP. Do not generate the next task.