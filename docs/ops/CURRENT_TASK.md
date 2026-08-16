# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-physical-clothing-sexual-product-play-v2
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5309501183` — `ACCEPTED_BLOCKED_EVIDENCE` for V1.
Previous terminal: `5309485651`.
Previous docs-only final SHA: `2292d47152fd70a2b46d37f8d2008484c766493a`.
Reviewed Minimal Story Runtime executable SHA: `beae855ebc5a9706bae234af80b2569d73566f0a`.

V1 reached no product turn. The external evidence runner mistakenly sent Setup/Opening to `/api/story` instead of the reviewed `/api/opening` endpoint. This was an evidence-tool failure, not a runtime defect. Independent operator verification after V1 confirmed the disposable TEST game is clean: committed_turn=0, game_turns=0, game_actions=0, setup/opening not_started, canonical scene=setup, Level 1/exp 0, csa_active=[].

Disposable TEST game only:
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`

Forbidden game IDs — do not access:
- Production/sentinel `11111111-1111-4111-8111-111111111111`
- preserved manual `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA evidence `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`

Existing TEST Level-7 seam is already applied. Do not author/edit/reapply migrations and do not create another fixture/seam.

## Objective

Run one coherent disposable-TEST product-play scenario that actually reaches the product pipeline and evaluates the still-unclosed positive paths under Minimal Story Runtime:

1. player physical/contact input remains intent; Story decides what actually occurs;
2. durable posture/position changes require the existing exact Story-grounded Extract evidence;
3. compact clothing continuity reflects only Story-established clothing change and survives committed refresh/readback;
4. existing intimate/sexual mechanical projection (`player_sexual_state` and/or evidenced `sexual_event_ledger`) changes only if Story actually establishes a supported event;
5. intimate/sexual mechanics must not automatically mutate unrelated consent, comfort, affection, trust, romance, generic relationship state, or unrelated CSA state;
6. image/media remains presentation-only and never blocks Story → Extract → Commit;
7. exact UTF-8 free text, actual provider literal choices, canonical time, refresh/history and replay/idempotence remain intact;
8. final canonical reset returns the disposable game to baseline.

A requested mechanic that is not naturally reached in this single run is a `COVERAGE_LIMITATION`, not permission to retry until lucky.

## Deterministic route-contract preflight — before any fixture/provider call

The V1 mistake must not recur.

1. Freeze START HEAD and confirm PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Read the current API router / turn-route source and the already-reviewed Opening call shape.
3. Prove locally, without a product/provider call, that Setup/Opening is constructed for the canonical `/api/opening` endpoint and that ordinary actions use `/api/story` only after Opening has completed.
4. Record the exact endpoint + request body keys that will be used.
5. Do not invoke the Level-7 fixture until this deterministic route preflight passes.
6. Do not add or commit a new repository harness. A temporary external evidence runner is allowed only after its endpoint mapping has passed this preflight.

A local request-builder/evidence-tool error found during this preflight is not a product attempt. Correct the temporary local runner before the fixture/provider call. Once the Level-7 fixture is invoked, the single product scenario attempt begins and no alternate rerun is allowed.

## Preflight / environment

- Verify TEST API Worker source lineage read-only. Deploy 0 if it already contains reviewed executable `beae855e...`. If exact lineage drift is proven, deploy only the reviewed API lineage; frontend deploy is forbidden.
- Verify `/health` is HTTP 200 and `edition_id=company-v1`.
- Verify the existing TEST Level-7 seam RPC is live. Do not apply/reapply any migration.
- Use only a UTF-8-safe execution/input path.
- No direct DB writes.

## One product scenario attempt

### A. Level 7 + Setup + Opening

- Invoke the existing guarded Level-7 fixture exactly once for the disposable TEST game.
- Verify canonical readback is Level 7 and no gameplay facts/outcomes were seeded.
- Run Setup + Opening exactly once through `/api/opening` using the reviewed request contract.
- Require a real SSE response and exactly four provider-authored literal choices before continuing.
- Continue the same game without reset.

### B. Physical/contact positive path

Use reasonable adult workplace interactions and exact UTF-8 player actions that naturally allow posture/position/contact outcomes.

For every decisive turn capture:
- exact player input;
- canonical pre-state/time;
- raw Story / parsed blocks;
- fresh Extract result and evidence;
- committed post-state/readback.

If posture/position changes, record the exact Story evidence justifying each changed axis. If no valid evidence exists, durable state must remain unchanged. Do not manufacture Extract output.

### C. Compact clothing continuity

Exercise a real live-content clothing path only if naturally available:
- existing applicable clothing CSA through the canonical app-state/app-validate/signed structured-action path; or
- a natural Story-established clothing interaction.

If Story establishes a clothing change, verify compact clothing state persists across later committed turns and refresh/readback. Clothing state must not mutate affection/consent/relationship merely because clothing changed.

If no clothing change is naturally established, record `COVERAGE_LIMITATION` and continue.

### D. Intimate / sexual narrow mechanics

Continue the same coherent adult scenario with reasonable explicit player intent if context makes it possible.

If Story establishes a supported intimate/sexual event:
- verify exact Story evidence;
- inspect fresh Extract;
- verify `sexual_event_ledger` append/dedupe and any corresponding `player_sexual_state` delta;
- verify no automatic mutation of unrelated consent, comfort, affection, trust, romance, generic relationship status or unrelated CSA state.

If Story refuses or the scenario never reaches such an event, record `COVERAGE_LIMITATION`; do not retry/reroll.

### E. Choices / time / media / committed readback

Aim for roughly 10–14 ordinary committed turns unless a decisive product defect stops earlier.

- Mix exact UTF-8 free text with at least two actual provider-returned literal choices unchanged when available.
- Record canonical game time on decisive turns and any real contradiction.
- Media/image selection may be null or another valid classification; it must not block Story/Extract/Commit.
- Refresh committed context/history after decisive physical/clothing/intimate turns and verify the same committed state is shown.
- Preserve current six-raw + older natural-language `turn_summary` memory architecture; do not create a special rerun for already accepted memory evidence.

### F. Replay / idempotence

Replay at least one decisive committed ordinary action when available and verify:
- Story replayed=true;
- Extract replayed=true;
- Commit success/replayed=true;
- committed turn unchanged;
- no duplicate sexual/clothing ledger effect;
- no repeated physical mutation;
- no save-revision change caused solely by replay.

## Stop policy

After the Level-7 fixture/provider scenario begins: one attempt only.

On first decisive product defect:
- capture the smallest decisive evidence;
- perform final cleanup reset if safe;
- STOP BLOCKED/FAILED;
- no retry/regeneration, alternate scenario, source patch, parser change, semantic gate, compatibility layer or provider/model change.

If a mechanic is merely not reached, record `COVERAGE_LIMITATION`; absence alone is not a defect.

## Final cleanup

Perform one canonical reset and independently verify:
- committed_turn=0;
- game_turns=0;
- game_actions=0;
- processing idle/not active;
- setup/opening not_started;
- canonical scene=setup with empty presence;
- Level 1 / exp 0;
- csa_active=[];
- no Level-7 fixture residue.

## Architecture constraints

- Story LLM is narrative authority.
- Extract observes Story-established narrow mechanics; Commit remains structural/transaction authority.
- Player input/choice is intent, not direct success state.
- Exact Story evidence applies only to existing narrow physical/clothing/sexual projections; do not generalize into a semantic narrative gate.
- CSA is activation-time institutional/common-sense premise and remains separate from unrelated consent/emotion/relationship state.
- No generic relationship/event/emotion/open-fact ledger.
- No finite CSA physical enactment engine.
- Choices remain provider-authored literal proposals.
- Image/media/TTS remain presentation sidecars.
- No new parser generation, fuzzy repair, compatibility runtime, retry system, semantic router/gateway or third Summary/Memory LLM.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployed-identity inspection;
- deterministic local endpoint/request preflight;
- existing guarded TEST Level-7 seam exactly once after route preflight;
- disposable TEST Setup/Opening and one coherent gameplay scenario through canonical endpoints;
- exact reviewed TEST API deploy only if lineage drift is proven;
- read-only TEST DB verification for the disposable game only;
- temporary external evidence artifacts outside the repository;
- docs-only completion commit and one immutable Issue #68 terminal report.

Not authorized:
- any forbidden game access;
- direct DB writes;
- migration/DDL author/edit/apply/reapply;
- frontend deploy;
- source/runtime/test/content/config behavior edits;
- repository harness creation;
- provider/model/temperature/token changes;
- retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic gate, compatibility layer;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only to the extent of positive paths actually observed in the one product scenario. Do not overstate unobserved physical/clothing/sexual coverage.

On PASS, first real product defect, or bounded coverage-limited completion:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post exactly one immutable terminal report to Issue #68 with START SHA, reviewed/deployed Worker identity, deterministic `/api/opening` preflight proof, Level-7 seam evidence, decisive turns/state/evidence, coverage limitations, replay result, final reset and forbidden-operation confirmation;
- STOP. Do not generate the next task.

## Execution record — bounded coverage-limited completion

- Execution lease: Issue #68 comment `5309535961`.
- Start SHA: `bef5da21d1c36713a7ff7ba1260479473b48cef7`.
- Reviewed executable SHA: `beae855ebc5a9706bae234af80b2569d73566f0a`.
- Worker lineage read-only verified as `game-proxy-company-v1` version `51c5ac28-8d52-49bc-bb14-fdd1f0164126` at 100%; health HTTP 200 with `edition_id=company-v1`; deploy 0.
- Deterministic local route preflight passed before fixture/provider calls. `/api/opening` requires `game_id, setup_id`; ordinary `/api/story` requires `game_id, action_id, expected_turn, player_action`. Preflight artifact SHA-256: `80D50BF3B36D81C3B65F5B40C012664BD043A688F329CE0C7B7B19B7679B2E13`.
- Existing Level-7 seam fixture was invoked exactly once for disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`; canonical readback was Level 7. No migration was applied/reapplied.
- Setup/Opening used `/api/player-setup` once and `/api/opening` once. Opening returned HTTP/SSE success and exactly four provider-authored choices.
- One continuous scenario completed 12 committed turns. Story/Extract/Commit succeeded for every turn. Provider literals were transported unchanged on turns 4, 6, 8, 10, and 12. Canonical time advanced coherently from minute 584 to 617 in three-minute steps. History/context readback returned HTTP 200. Media remained presentation-only and did not block the pipeline.
- Physical/contact coverage: turn 3 Story explicitly narrated the attempted shoulder contact and boundary response; fresh Extract returned no physical/npc observation and committed narrow physical state remained unchanged. This is evidence-gated coverage limitation, not a manufactured state change.
- Clothing coverage: turn 5 Story narrated the jacket removal/shirt state, but fresh Extract returned no clothing observation; compact `npc_scene_state` remained at the prior worn values. No durable clothing change was asserted without typed evidence. Record as coverage limitation.
- Intimate/sexual coverage: turns 7 and 9 produced a refusal/boundary response; no supported sexual event was established, `player_sexual_state` remained zeroed, and no sexual ledger change occurred. Record as coverage limitation, not a defect.
- Unrelated consent/comfort/affection/trust/romance/relationship/CSA state was not mechanically advanced by the attempted contact or refused intimate request; `csa_active` remained empty.
- Replay of turn 10 returned Story meta/complete replayed, Extract replayed, Commit replayed, with unchanged state and no extra turn.
- Final reset succeeded and read back committed_turn=0, processing idle, setup/opening not_started, Level 1, csa_active=[], canonical scene=setup with empty presence.
- Artifact: `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-physical-v2-product-play-20260817.json`.
- Artifact SHA-256: `63626E296544FD9ADD3E8D023E5EB0DB0AD067204DB83D20A1902B1C403C38A8`.
- Forbidden operations: Production/preserved/QA access 0; migration/DDL 0; frontend deploy 0; runtime/source/test/content/config changes 0; direct DB writes 0; provider retry/regeneration 0; alternate scenario 0; PR/merge/Ready 0.
- Result: bounded coverage-limited completion; no product defect asserted and no next task generated.
