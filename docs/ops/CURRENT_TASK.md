# Company v1 — CURRENT TASK

Status: BLOCKED
Task ID: hospital-spine-test-manual-handoff-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This existing `docs/ops/CURRENT_TASK.md` is reused in place. Do not create a new CURRENT_TASK file and do not create a new ops/task-registration branch.

## 0. Owner review and merged source authority

Binding design:

`docs/COMPANY_V1_HOSPITAL_REFERENCE_SPINE_ALIGNMENT_CANON_2026-08-18.md`

Predecessor task: `hospital-spine-pr82-lineage-reconcile-v1`

Owner review decision: `ACCEPT`.

Replacement PR #83 was independently verified before merge:

- PR head: `66b1f777481b7f3989d09d037e24255003692438`
- candidate source/test commit: `9154c01d661d11918dedc873899d59bcb993fcc7`
- exact-head Company v1 tests: run `32125276984` — SUCCESS
- candidate `src` tree: `b397708faa738d41bd7c682af60d6e1e4d091936`
- candidate `test` tree: `9f24659243417edb40d38d7e0fdce9c7397fc19b`
- those tree SHAs exactly equal reviewed executable `67b8cce260e23a953ef8d8353b96fb0c316c64e2`
- focused 61/61, full 359/359, syntax, and diff checks accepted

Owner merged only PR #83 by normal merge with exact expected-head protection.

Merged source authority: `b8efd92085fb660e18090373800994b64d003e73`

Old PR #82 remains historical reviewed-but-conflicted evidence and must not be merged.

No source repair is authorized. This is the final TEST deployment + zero-turn manual-fixture handoff tail.

## 1. Frozen in-place registration identity

The latest Issue #68 `CURRENT_TASK_READY` comment for this Task ID supplies exact `REGISTRATION_MAIN_SHA` and `CURRENT_TASK_BLOB_SHA`.

At execution start:

1. fresh-fetch `origin/main`;
2. require `origin/main == REGISTRATION_MAIN_SHA` from that comment;
3. require this file blob == registered `CURRENT_TASK_BLOB_SHA`;
4. require `REGISTRATION_MAIN_SHA` to be a docs-only descendant of merged source `b8efd920...`, changing only `docs/ops/CURRENT_TASK.md`;
5. require current `src` tree == `b397708f...` and current `test` tree == `9f246592...`;
6. require PR #83 MERGED with merge commit `b8efd920...` and PR #82 UNMERGED;
7. create no task/ops branch; operational work proceeds from exact registered main;
8. if any non-doc source/config/test/content/migration drift exists, STOP `BLOCKED_HOSPITAL_HANDOFF_MAIN_DRIFT`.

## 2. Phase A — exact registration-main CI

The repository workflow runs on pushes to `main`. Require `Company v1 tests` for exact `REGISTRATION_MAIN_SHA` to complete SUCCESS before deployment.

If exact registration-main CI is not SUCCESS, STOP `BLOCKED_HOSPITAL_HANDOFF_MAIN_CI`. Do not patch source or alter workflow/provider/model settings.

## 3. Phase B — deploy exact registered main to TEST only

Deploy the exact Company v1 runtime from `REGISTRATION_MAIN_SHA` to TEST only using the current contract-gated deployment path.

Required:

- deploy exact API Worker/runtime from registered main;
- record Worker name/version/deployment timestamp and source SHA;
- frontend source was not changed by this alignment; do not perform an unnecessary frontend rewrite/workaround;
- retain existing source-equivalent TEST frontend unless the normal deployment contract explicitly requires a deploy;
- record frontend version only if actually deployed by the normal authorized path;
- no source/config/content repair during deployment.

Hard boundaries:

- TEST only;
- no Production/hospital-v2;
- no migration/DDL/migration-history repair/broad DB push;
- no provider/model/TTS/binding change;
- no retry-until-lucky/regeneration loop.

If exact registered main cannot deploy, STOP with the precise deployment blocker.

## 4. Phase C — structural/read-only smoke only

After deployment, perform only non-gameplay verification required to prove TEST is structurally ready:

- `/health` and API reachability/edition identity;
- effective TEST DB contract checks read-only;
- Action Stage A / Scene Stage B contract gates where applicable;
- frontend asset/public-route reachability;
- deployed-source/version identity checks.

Any infrastructure smoke fixture must be disposable and must not become the final manual fixture.

Do not run Setup, Opening, Story, Extract, or Commit gameplay turns as acceptance.

If structural smoke fails, STOP with exact evidence. Do not alter application semantics.

## 5. Phase D — one genuinely fresh Level-7 manual TEST fixture

Only after exact-head CI, deployment, and structural smoke pass, create exactly one fresh disposable Level-7 TEST game for the user's manual product-play acceptance.

Mandatory freshness procedure:

1. generate a brand-new UUID not copied from any prior manual/QA/evidence fixture;
2. BEFORE any write, prove zero rows for that UUID in at least `games`, `game_save`, `game_actions`, and `game_turns`;
3. if any row exists, discard that UUID without mutation and generate another;
4. seed/create only the proven-absent UUID using the current authorized TEST Level-7 fixture path;
5. never reset/reseed/reuse an existing UUID;
6. preserve all prior manual/QA/evidence games read-only, including `9755b57b-5cbb-44dd-a624-020fe516c16d`, `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`, and every other prior fixture;
7. perform ZERO Setup/Opening/Story/Extract/Commit gameplay calls in the final manual fixture;
8. verify after creation: Level 7, `committed_turn=0`, game action count 0, active committed turn count 0, idle/no pending gameplay action, TEST-only identity, and public frontend URL reachable;
9. record exact fresh UUID and public TEST URL.

The user, not Codex/Hermes, owns long gameplay acceptance.

## 6. Success terminal — WAITING_USER_LIVE_ACCEPTANCE

On full success, overwrite this SAME `docs/ops/CURRENT_TASK.md` on main in place to `Status: WAITING_USER_LIVE_ACCEPTANCE` and record:

- registration main SHA/blob;
- exact-head main CI run/result;
- deployed API Worker version and exact source SHA;
- frontend deployment status/version if any;
- DB/action/scene structural gate results;
- health/frontend reachability results;
- fresh UUID pre-write absence proof;
- final fresh Level-7 game UUID;
- zero-turn/action-count readback;
- public TEST frontend URL.

Post one terminal report to Issue #68 with classification `HOSPITAL_REFERENCE_SPINE_ALIGNMENT_WAITING_USER_LIVE_ACCEPTANCE`, then STOP.

Do not create another CURRENT_TASK and do not start another roadmap Cut. The user will next perform the long 30–50+ turn manual product-play acceptance.

## 7. Absolute prohibitions

- no new CURRENT_TASK file;
- no new ops/task-registration branch;
- no source/test/config/content semantic changes;
- no merge of PR #82 or any other PR;
- no automated long live gameplay;
- no gameplay turn in the final manual fixture;
- no reset/reseed/reuse/mutation of any pre-existing manual/QA/evidence game;
- no Production/hospital-v2 operation;
- no migration/DDL/history repair/broad DB push;
- no provider/model/TTS/binding change;
- no semantic router/classifier/verifier;
- no relationship/event/emotion/open-fact ledger;
- no generic CSA execution DSL;
- no retry/regenerate-until-lucky behavior;
- no next roadmap Cut.

## Terminal BLOCKED — 2026-08-18

Classification: `BLOCKED_HOSPITAL_HANDOFF_NO_FRESH_LEVEL7_WRITER`

The exact registered main (`e3d00dba4381a9f77f6d5aaa4be6f08e7fdc9c46`) was deployed to TEST API Worker `game-proxy-company-v1` as version `5eb3ebc7-a4a3-43c0-ba0b-b159ee93ce52` at `2026-08-18T10:42:49Z` (source tree `b397708faa738d41bd7c682af60d6e1e4d091936`). Read-only structural smoke passed: registration-main CI `32125901150`, action/scene contract gates passed, `/health` and `/api/version` returned company-v1 / phase-2-vertical-loop, preserved-game API smoke passed, and frontend asset/public-route smoke passed at `https://gamebuilder-company-v1.zeroslove.workers.dev`.

Fresh UUID `1ee28d34-af78-4a07-a784-248e075ebd9c` was generated and, before any write, read-only counts were zero in `games` (key `id`), `game_save`, `game_actions`, and `game_turns` (key `game_id`). The current TEST function definition for `public.prepare_company_test_level7_fixture(uuid,text)` hard-codes the existing dedicated UUID `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` and calls `reset_company_game` before applying Level 7. It therefore cannot seed the proven-absent UUID and would violate this task’s mandatory fresh-UUID/no-reuse/no-reset procedure. No fixture write was attempted; all preserved games remain untouched.

Required next action is an owner-authorized source/migration/runtime contract change that provides a genuinely fresh-UUID TEST-only Level-7 creation path. That is outside this task’s absolute prohibitions, so execution stops here. No Production, migration/DDL, source repair, gameplay call, or unpushed commit was performed.
