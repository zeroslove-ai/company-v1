# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: hospital-spine-pr82-lineage-reconcile-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

## 7. Verified lineage handoff

- Candidate source/test commit: `9154c01d661d11918dedc873899d59bcb993fcc7`
- Replacement PR: `#83`, head `9154c01d661d11918dedc873899d59bcb993fcc7`, open/non-Draft/mergeable
- Exact reviewed source/test equivalence to `67b8cce260e23a953ef8d8353b96fb0c316c64e2`: EXACT
- Focused alignment/navigation/scene/physical/sexual/memory tests: `61/61 PASS`
- Full `npm.cmd test`: `359/359 PASS`
- Changed JS/MJS syntax: PASS
- `git diff --check`: PASS
- Exact-head Company v1 test workflow: run `32125134575`, SUCCESS
- Final branch/docs head SHA is the pushed workflow-handoff commit recorded in the Issue #68 terminal report.

This existing file is the sole active execution authority. Reuse it in place. Do not create a new CURRENT_TASK file or a new ops/task-registration branch.

## 0. Why this task exists

Binding design:

`docs/COMPANY_V1_HOSPITAL_REFERENCE_SPINE_ALIGNMENT_CANON_2026-08-18.md`

Blocked predecessor terminal: Issue #68 comment `5325982174`.

The predecessor correctly stopped because an ops-only `CURRENT_TASK.md` commit advanced `main` and made reviewed PR #82 mechanically conflicted. Independent review proved that the drift changed only `docs/ops/CURRENT_TASK.md`; no source/test/config/content/migration/runtime behavior changed.

Reviewed executable source/test authority remains:

`67b8cce260e23a953ef8d8353b96fb0c316c64e2`

Old reviewed PR:

- PR #82
- head `4cc4b67b1b29d9269eedbbbb81b9ebf38ee76928`
- source/test content accepted
- currently unmerged and mechanically conflicted only because both lineages changed `docs/ops/CURRENT_TASK.md`

This task is lineage reconciliation only. No application semantic redesign is authorized.

## 1. Execution identity — in-place CURRENT_TASK reuse

The Issue #68 rearm comment for this task supplies the exact authoritative `REGISTRATION_MAIN_SHA` and `CURRENT_TASK_BLOB_SHA`.

Execution start requirements:

1. fresh-fetch `origin/main`;
2. require `origin/main == REGISTRATION_MAIN_SHA` from the latest rearm comment;
3. require `docs/ops/CURRENT_TASK.md` blob == the registered blob;
4. use the already-existing branch `company/hospital-spine-pr82-lineage-reconcile-v1`; do not create another branch;
5. require that existing branch HEAD == `REGISTRATION_MAIN_SHA` before source application;
6. require old PR #82 remains OPEN/unmerged with exact head `4cc4b67b1b29d9269eedbbbb81b9ebf38ee76928`;
7. require reviewed executable SHA `67b8cce...` remains reachable;
8. if main has any non-doc source/config/test/content/migration drift after this registration, STOP `BLOCKED_HOSPITAL_SPINE_RELINEARIZE_DRIFT`.

Do not generate another task or another ops branch if any precondition fails.

## 2. Apply only the already-reviewed source/test content

On the existing reconciliation branch, reproduce only the non-doc content represented by:

`20080497d782598600200afa45b5171087595ff9..67b8cce260e23a953ef8d8353b96fb0c316c64e2`

restricted to these exact paths:

- `src/engine/extract-prompt.js`
- `src/engine/gameplay-state.js`
- `src/engine/runtime-core/commit-reducer.js`
- `src/engine/runtime-core/extract-observation.js`
- `src/engine/runtime-core/legacy-extract-adapter.js`
- `src/engine/runtime-core/observation-reducers.js`
- `src/engine/runtime-core/persisted-extract-observation.js`
- `src/engine/state/clothing.js`
- `src/engine/state/physical-state.js`
- `src/engine/story-prompt.js`
- `test/extract-observation-contract.test.mjs`
- `test/frontend-projection-contract.test.mjs`
- `test/gameplay-core-simplification.test.mjs`
- `test/narrative-request-contract.test.mjs`
- `test/state-evidence-boundaries.test.mjs`

Do not transplant PR #82's `docs/ops/CURRENT_TASK.md` changes. Do not rebase/merge PR #82 wholesale. No additional source/test/config/content/migration path may change.

## 3. Exact equivalence is mandatory

After application, prove all resulting `src/**` and `test/**` files are byte/content-equivalent to reviewed executable SHA `67b8cce...`.

The only allowed difference from the old reviewed lineage is ops/document ancestry.

No cleanup, formatting pass, refactor, dependency/config change, semantic tweak, compatibility patch, provider/model change, or unrelated repair is allowed.

If exact equivalence cannot be proven, STOP `BLOCKED_HOSPITAL_SPINE_RELINEARIZE_EQUIVALENCE`.

## 4. Verification and replacement PR

After equivalence proof:

1. run the same focused alignment/navigation/scene/physical/sexual/memory tests used for the reviewed candidate;
2. run full `npm.cmd test`;
3. run changed JS/MJS syntax checks;
4. run `git diff --check`;
5. require all PASS;
6. open exactly one replacement PR from the existing reconciliation branch to `main`;
7. state in the PR body that this is a lineage-only replacement for conflicted PR #82 and that non-doc source/test content is exact-equivalent to `67b8cce...`;
8. require exact-head `Company v1 tests` CI SUCCESS;
9. do not merge the replacement PR;
10. do not close or modify PR #82 in this task.

If CI fails, STOP with the exact failure. No source repair is authorized here.

## 5. Success terminal

On success, overwrite this same `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW` and record:

- candidate source/test commit SHA;
- final branch/docs head SHA;
- replacement PR number/head;
- exact equivalence result;
- focused/full/syntax/diff results;
- exact-head CI run/result.

Then post one terminal report to Issue #68 with classification:

`HOSPITAL_SPINE_RELINEARIZED_READY`

STOP. Do not create the next task.

## 6. Absolute prohibitions

- no new CURRENT_TASK file;
- no new ops/task-registration branch;
- no source semantic redesign beyond the exact reviewed patch;
- no merge/rebase/cherry-pick-wholesale of PR #82;
- no merge of the replacement PR;
- no closing/modifying PR #82;
- no TEST deploy/gameplay/game creation/reset/reseed;
- no DB write/migration/DDL/history repair;
- no Production/hospital-v2 access;
- no provider/model/TTS/binding change;
- no retry-until-lucky;
- no semantic router/classifier/verifier;
- no relationship/event/emotion/open-fact ledger or generic CSA DSL;
- no next roadmap Cut.
