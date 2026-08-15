# Company v1 — CURRENT TASK

Status: READY
Task ID: story-control-marker-test-rollout-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Operator review `5304229804` accepted source/test SHA `b3c06f931d8bd216f217412343621781670f0722` for `story-control-marker-root-cause-v1`.

Accepted live TEST contract already established before this task:
- additive migration `20260816000100_company_v1_opening_structured_persistence` is applied exactly once;
- canonical Opening writer is six-argument `commit_company_opening(uuid, uuid, text, text, jsonb, jsonb)` and old five-argument writer is absent;
- `opening_state.parsed_blocks` is persisted transactionally;
- prior TEST API identity was executable `c62c92e231a0f0b44a723474bd16a7dba1985124` / Worker version `4660b79f-8ff3-40f5-ae1f-cd8134219f7c`;
- prior rollout reached Setup + Opening and then failed first ordinary Story because provider emitted attributed `[SCENE brand_strategy_meeting_room]`.

Reviewed source/test fix `b3c06f931d8bd216f217412343621781670f0722` consolidates one producer grammar: `[SCENE]` is bare; JSON `scene_id` is data, not marker syntax; DIALOGUE alone carries registered `speaker_id`; parser strictness is unchanged.

Historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ-ONLY and must not be accessed or mutated. Production access is forbidden.

## Objective

Roll the exact reviewed Story-marker source fix to TEST and close the previously blocked Opening → ordinary Story boundary with one bounded dedicated TEST acceptance. This is a rollout/acceptance task, not authority to invent another parser/gateway/fallback.

## Required work

1. Verify exact ancestry and #67 topology. Distinguish executable SHA `b3c06f931d8bd216f217412343621781670f0722` from docs-only descendants.
2. Re-verify live TEST Opening RPC shape/security/search_path and that migration `20260816000100_company_v1_opening_structured_persistence` is already applied. Do not reapply or edit it.
3. Deploy the exact reviewed API executable lineage containing `b3c06f9...` to TEST only, then independently record deployed Worker identity/version and prove it corresponds to the reviewed executable. Do not deploy frontend unless direct evidence shows it is required; otherwise frontend deploy is forbidden.
4. Use one dedicated disposable TEST game through normal API paths. Existing reviewed TEST-only Level-7 acceleration seam may be used if needed, but do not directly mutate gameplay state in DB.
5. Execute Setup → Opening → at least two ordinary Story → Extract → Commit turns, including one literal provider-authored choice round-trip and one free-text input when reachable without retry. Acceptance requires:
   - Opening committed structured `parsed_blocks` remain present and recovery/replay uses them;
   - ordinary Story no longer fails with the attributed-SCENE marker class;
   - Story terminal SSE/parser status is complete/success;
   - Extract and Commit complete normally;
   - exactly four provider-authored literal choices survive parser/persist/UI contract and selected literal becomes player input;
   - free text remains ordinary player input;
   - current-format committed turn replay/recovery prefers committed `parsed_blocks` and is idempotent;
   - no relation/event/emotion/work semantic ledger or server-authored semantic choice fallback is reintroduced.
6. Do not retry/regenerate to obtain a pass. At the first deterministic failure, preserve bounded HTTP/SSE/action/parser/context evidence in OS TEMP and STOP as BLOCKED.
7. On success, reset only the dedicated TEST game and verify clean readback. Never access/reset the preserved manual game.
8. Run only the focused/local checks needed to corroborate the deployed reviewed executable; test count alone is not proof.

## Architecture constraints

- Fresh Story parser remains strict generation contract; no parser relaxation, new parser, normalization, regex cleanup, retry/regeneration, provider/model/temperature/token changes, fallback Story, or semantic hard gate.
- Story authors open-ended narrative; Extract observes facts. Do not add finite event/relation/emotion/posture/sexual semantic taxonomies.
- Exactly-four choices are provider-authored literal presentation shape, not a server semantic taxonomy.
- CSA remains natural institutional rule context; institutional compliance is not consent/comfort/affection/trust/emotion.
- Recent six raw Story + older natural-language `turn_summary` remains narrative continuity architecture.
- Media/image catalogs, sex/general pools, sexual image families, compact clothing UI state, scene/location/presence, sexual state/media adapters, and TEST Level-7 seam are protected actual-consumer functionality unless a direct defect proves otherwise.
- Historical applied migrations are immutable.

## Authorized operations

Authorized:
- TEST-only API deployment of the exact reviewed executable lineage containing `b3c06f931d8bd216f217412343621781670f0722`;
- read-only TEST DB/RPC/migration/deployed-identity verification;
- dedicated disposable TEST game Setup/Opening/ordinary turns/replay/recovery and final reset;
- OS TEMP evidence;
- docs/audit completion evidence in #67.

Not authorized:
- source/runtime/test semantic changes during this lease;
- new migration/DDL or reapplication/edit of historical migration;
- frontend deploy unless direct deterministic need is proven and operator review is obtained first;
- Production access;
- any access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- direct DB mutation to manufacture gameplay state;
- provider/model/temperature/token changes, retry/regeneration, fuzzy repair, parser relaxation/new parser/fallback Story;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Completion

On success or deterministic BLOCKED finding:
- report exact deployed executable + Worker identity, live TEST RPC/migration facts, dedicated game ID, turn/action evidence, Opening/ordinary parsed-block persistence/replay result, choice/free-text result, final reset state, and any blocker evidence;
- keep source/runtime unchanged in this lease;
- set CURRENT_TASK to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68;
- STOP for operator review.
