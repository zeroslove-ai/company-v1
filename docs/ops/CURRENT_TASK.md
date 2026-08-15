# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: final-runtime-compatibility-residue-cleanup-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Accepted gameplay executable:
`0fc509911e5bdf5aabb92fe5241a845f686bdb17`.

Accepted V9 live review:
Issue #68 comment `5302811891`.

Current narrative continuity architecture is fixed for this cut:
**latest 6 committed raw turns + chronological older natural-language `turn_summary` entries.**
Do not restore open_facts/open_observations or general relation/event/emotion/work memory authority.

Historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ-ONLY and must not be accessed or mutated in this source/test cut.

## Objective

Perform one deletion-first final active-runtime compatibility residue cleanup after V9 broad acceptance.

Inventory real callers and persisted-data/replay dependencies first, then remove obsolete runtime/parser/extract/RPC/mirror/gateway/test compatibility code whose active or historical consumer count is proven zero.

This is not a naming cleanup. Names such as `legacy-*` or `hospital-*` are not deletion proof by themselves.

## Required work

### A. Parser / replay authority

- Fresh generation must continue to use `fresh-narrative-parser.js` only.
- Committed current-format turns must use their committed structured/parsed representation for replay/recovery where already available; do not introduce a third parser generation.
- Inventory every import/caller of `legacy-narrative-parser.js`, `narrative-parser.js`, persisted reparse helpers, and any legacy extract adapter.
- If a compatibility parser/adapter has zero live caller and zero required historical persisted-data reader, delete it and its stale tests in this cut.
- If historical rows genuinely still require a compatibility boundary, keep only the minimum inert read adapter and document the concrete caller/data proof. It must not become fresh semantic authority.

### B. Old API/RPC aliases and duplicate mirrors

Inventory remaining old RPC/API aliases, scene/location/presence mirrors, duplicate gameplay-state mirrors, deprecated save/read paths, and compatibility gateways.

For each candidate use REMOVE-OR-PROVE:
- delete it if no live caller or persisted-data dependency exists;
- keep only when a concrete current UI/mechanical/integrity or historical replay consumer is proven.

Do not add replacement wrappers merely to preserve stale tests.

### C. Frontend/client residues

Inventory donor/legacy frontend readers and duplicate state caches that can still act as gameplay authority.

- presentation cache may remain only as replaceable UI state;
- committed server context remains gameplay authority;
- delete dead duplicate readers/writers/tests where caller proof reaches zero.

Do not rename donor files just for aesthetics if behavior is still required.

### D. Preserve proven machine/UI/media state

Do not regress or delete without consumer proof:
- registered setup/world IDs/catalogs required for intentional setup;
- `npc_stats` UI projection;
- scene/location/presence;
- player/NPC physical and compact clothing continuity;
- time/progression and TEST-only Level-7 seam;
- institutional CSA identity/lifecycle/applicability context;
- choices/free text/Mind Monitor;
- `sexual_event_ledger` and derived sexual mechanics where consumed;
- image_library/catalog/tags/action families/general-sex pools/deterministic image selection as presentation/media adapters.

Media classification failure may affect image choice only; it must never determine whether a Story/Extract fact occurred.

## Architecture constraints

- one durable domain -> one canonical writer;
- deletion/root-cause redesign over compatibility layering;
- no semantic enum/allowlist/regex/fuzzy gate for open-ended narrative meaning;
- no direct player-input success inference;
- no arbitrary LLM save patch;
- unknown optional projection remains fail-open;
- institutional CSA compliance remains separate from consent/comfort/affection/emotion;
- exactly-four choices are presentation shape, not semantic taxonomy.

## Required proof

Before deleting each compatibility component, show caller/data inventory sufficient to establish zero required consumer or the exact reason it must remain.

Add/update focused regressions proving at minimum:
1. fresh Story generation still uses only the fresh parser contract;
2. current committed replay/recovery remains identical after deletions;
3. historical compatibility rows that are still supported remain readable/inert if such a reader is retained;
4. deleted aliases/mirrors have no active caller;
5. choices/free text and simplified six-raw + older-summary context contracts remain intact;
6. retained scene/stats/physical-clothing/CSA/sexual/media consumers remain unaffected;
7. full test suite, changed-file syntax checks, and `git diff --check` pass.

Test count alone is not acceptance evidence.

## Authorized operations

Source/test/docs changes inside the existing #67 branch only.
No TEST live gameplay, DB write/reset, migration/DDL, Worker/frontend deployment, or Production access in this lease.

## Forbidden

- new branch or PR;
- merge / PR Ready / rebase / squash / force-push;
- Production access;
- any access/mutation/reset of manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- provider/model/temperature/token changes;
- retry/regeneration to hide a defect;
- new parser generation or parser relaxation;
- new semantic gateway/classifier/ledger/graph;
- compatibility runtime added only to rescue stale tests;
- editing historical applied migrations.

## Completion

Commit source/test changes separately from final docs handoff where practical. Report exact executable SHA and exact final docs SHA.
Set CURRENT_TASK to `WAITING_REVIEW` in a docs-only completion commit, post one immutable terminal report to Issue #68, and STOP.

No live acceptance in this source/test lease.

## Completion handoff

Source/test cleanup is complete in `1025f4da096389838328afc1982ba9a47d421421`.
The zero-consumer historical parser alias was removed, persisted Story tests
now exercise the single persisted-read boundary, and the orphaned projection
residue was removed. Historical Story/Extract readers, old-save scene
hydration, canonical scene projection, frontend recovery, and proven product
state consumers were retained from concrete caller/data inventory.

Validation: `npm.cmd test` 417/417, targeted persisted/replay/scene/display
tests 92/92, changed JS/MJS syntax checks pass, and `git diff --check` pass.
No TEST/live DB access, DB write/reset, migration/DDL, deployment, or
Production access occurred. PR #67 remains OPEN / DRAFT / UNMERGED.

STOP: SOURCE/TEST COMPATIBILITY RESIDUE CLEANUP COMPLETE — WAITING FOR OPERATOR REVIEW
