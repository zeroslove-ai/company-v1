# Company v1 — CURRENT TASK

Status: READY
Task ID: committed-parsed-blocks-replay-authority-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Accepted gameplay executable before compatibility cleanup:
`0fc509911e5bdf5aabb92fe5241a845f686bdb17`.

Accepted compatibility cleanup source/test SHA:
`1025f4da096389838328afc1982ba9a47d421421`.

Operator review: Issue #68 comment `5303044529`.

Current narrative continuity remains latest 6 committed raw turns + chronological older natural-language `turn_summary`. Do not restore open_facts/open_observations or general relation/event/emotion/work memory authority.

Historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ-ONLY and must not be accessed or mutated.

## Objective

Close the remaining persisted Story reparse compatibility window where current committed `parsed_blocks` already provide replay/recovery authority.

Inventory actual stored-turn shapes and all replay/history/recovery callers. Make committed `parsed_blocks` the sole reader for current-format committed turns. Retain raw Story reparsing only as the minimum inert historical adapter for rows that demonstrably lack usable committed structured blocks. Delete redundant reparsing paths/tests once caller/data proof reaches zero.

This is deletion-first. Do not create a replacement parser, semantic fallback, or compatibility wrapper.

## Required work

### A. Current committed replay authority

- Inventory where `game_turns.parsed_blocks`, raw Story text, `parsePersistedNarrative`, and any reparse helpers are read.
- Prove the current commit path persists sufficient structured/parsed representation for current-format turns.
- Route current-format replay/history/recovery through committed `parsed_blocks` without reparsing raw Story.
- If any current caller reparses raw Story despite usable committed blocks, delete that reparse dependency and rewrite/delete stale tests accordingly.

### B. Historical compatibility window

- Determine from repository fixtures/contracts and non-mutating source evidence which historical stored rows can lack usable `parsed_blocks`.
- If such rows are genuinely supported, retain one minimum inert fallback boundary using the existing historical parser only for those rows.
- The fallback must never be used for fresh generation/current committed rows and must not become semantic authority.
- If no concrete historical consumer/data shape remains, delete the persisted reparse boundary entirely.

### C. Preserve product consumers

Do not regress scene/location/presence, npc_stats, physical/compact clothing, time/progression/TEST-only Lv7 seam, CSA identity/lifecycle/applicability, literal choices/free text, Mind Monitor, sexual_event_ledger, or image/media presentation adapters. Media classification must never gate Story/Extract fact occurrence.

## Required proof

Add/update focused tests proving:
1. current committed turns replay/recover from committed `parsed_blocks` without invoking raw Story parser;
2. literal four choices, dialogue/TTS-visible blocks, inner thought/status, and history ordering remain identical;
3. historical rows without usable structured blocks remain readable only if concrete support is proven;
4. malformed historical fallback cannot overwrite current committed structured authority;
5. six-raw + older-summary context remains unchanged;
6. no new parser/gateway/semantic fallback is introduced;
7. full suite, changed-file syntax checks, and `git diff --check` pass.

Test count alone is not acceptance evidence.

## Architecture constraints

- one durable domain -> one canonical writer/reader authority;
- current committed structured data outranks reparsed prose;
- Story authors narrative; Extract observes; Commit persists; replay reads committed authority;
- no semantic enums/allowlists/regex/fuzzy gates for open-ended narrative meaning;
- no direct player-input success inference or arbitrary LLM save patch;
- exactly-four choices are presentation shape, not semantic taxonomy.

## Authorized operations

Source/test/docs changes inside existing #67 branch only.
No TEST live gameplay, DB write/reset, migration/DDL, Worker/frontend deployment, or Production access.

## Forbidden

- new branch/PR, merge, Ready, rebase, squash, force-push;
- Production access or manual-game access;
- provider/model/temperature/token changes or retries;
- third parser generation, parser relaxation, new semantic gateway/classifier/ledger/graph;
- compatibility runtime solely to rescue stale tests;
- editing historical applied migrations;
- direct DB mutation.

## Completion

Commit source/test changes separately from final docs handoff where practical. Report exact source/test SHA and final docs SHA. Set CURRENT_TASK to WAITING_REVIEW in docs-only completion commit, post one immutable terminal report to Issue #68, and STOP.