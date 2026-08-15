# Company v1 — CURRENT TASK

Status: READY
Task ID: opening-structured-replay-authority-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Accepted current-format replay source/test SHA:
`7b61c9fd69930e82afc97a2dc907136ce3678beb`.

Operator review: Issue #68 comment `5303313116`.

Current narrative continuity remains latest 6 committed raw turns + chronological older natural-language `turn_summary`. Do not restore open_facts/open_observations or general relation/event/emotion/work memory authority.

Historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ-ONLY and must not be accessed or mutated.

## Objective

Close the remaining Opening replay/recovery authority gap identified by the accepted parsed-blocks cut. Ordinary committed turns now replay from committed `parsed_blocks`; Opening must no longer require a separate prose-reparse semantic authority if its persisted contract can carry the same structured presentation state.

Use REMOVE-OR-PROVE. Prefer extending the existing canonical Opening persistence/readback contract to store/read structured blocks and deleting duplicate Opening reparse/projection paths. Do not create a second parser, a new semantic fallback, or a compatibility wrapper merely to preserve stale tests.

## Required work

### A. Inventory the Opening boundary

- Inventory `commit_company_opening`, opening save/action fields, setup/opening API routes, frontend opening recovery, persisted opening projection, and every raw-opening Story parser/reparse caller.
- Prove exactly what current Opening persistence lacks compared with ordinary committed turns.
- Identify any historical Opening rows that genuinely require an inert compatibility read boundary.

### B. Make committed structured Opening state authoritative

- If the existing DB/API contract can persist structured Opening blocks without DDL, use the existing canonical field/boundary and remove redundant reparsing.
- If additive DDL/RPC change is genuinely required, STOP with BLOCKED evidence and the exact minimal migration/API contract needed. Do not author/apply migration in this source/test lease.
- Current-format Opening replay/recovery/frontend hydration must prefer committed structured state over reparsed raw prose.
- Raw Opening Story remains presentation/evidence text; it must not override usable committed structured state.

### C. Delete superseded paths/tests

- Delete zero-consumer Opening reparse/projection helpers, aliases, and stale implementation-detail tests once caller/data proof reaches zero.
- Retain only one minimum inert historical read adapter if concrete historical stored shape proves it is required.
- Do not add runtime compatibility solely to keep old tests green.

### D. Preserve proven product consumers

Do not regress setup catalogs/stable IDs, scene/location/presence, npc_stats, physical/compact clothing, time/progression/TEST-only Lv7 seam, CSA identity/lifecycle/applicability, literal exactly-four choices/free text, Mind Monitor, sexual_event_ledger, or image/media presentation adapters. Media classification failure must never gate Story/Extract fact occurrence.

## Required proof

Focused tests must prove, where source contract permits:
1. current Opening replay/recovery uses committed structured blocks and does not reparse raw Story;
2. mutating raw Opening prose after persistence cannot replace usable committed structure;
3. literal four choices and visible dialogue/ACTING/inner-thought/status projection remain intact;
4. frontend refresh/recovery reads committed Opening authority;
5. historical unstructured Opening remains readable only if concrete support is proven;
6. six-raw + older-summary ordinary-turn context is unchanged;
7. no new parser/gateway/semantic fallback is introduced;
8. full suite, changed-file syntax checks, and `git diff --check` pass.

Test count alone is not acceptance evidence.

## Architecture constraints

- one durable domain -> one canonical writer/reader authority;
- committed structured data outranks reparsed prose;
- Story authors narrative; Extract observes; Commit persists; replay/recovery reads committed authority;
- no semantic enums/allowlists/regex/fuzzy gates for open-ended narrative meaning;
- no direct player-input success inference or arbitrary LLM save patch;
- exactly-four choices are presentation shape, not semantic taxonomy;
- institutional CSA compliance remains separate from consent/comfort/affection/emotion.

## Authorized operations

Source/test/docs changes inside existing #67 branch only.
No TEST live gameplay, DB write/reset, migration/DDL, Worker/frontend deployment, or Production access.

## Forbidden

- new branch/PR, merge, Ready, rebase, squash, force-push;
- Production access or manual-game access;
- provider/model/temperature/token changes or retries/regeneration;
- third parser generation, parser relaxation, new semantic gateway/classifier/ledger/graph;
- compatibility runtime solely to rescue stale tests;
- editing historical applied migrations;
- direct DB mutation;
- applying or deploying a migration in this lease.

## Completion

If source-only closure is possible, commit source/test changes separately from final docs handoff where practical, report exact source/test SHA and final docs SHA, set CURRENT_TASK to WAITING_REVIEW, post one immutable terminal report to Issue #68, and STOP.

If additive DB/RPC contract is required, do not patch around it. Record exact caller/schema evidence, set CURRENT_TASK to BLOCKED or WAITING_REVIEW as appropriate, post one immutable terminal report, and STOP for operator authorization of a dedicated migration cut.