# Company v1 — CURRENT TASK

Status: READY
Task ID: hospital-spine-pr82-lineage-reconcile-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority for this task identity.

## 0. Operator review decision

Binding design:

`docs/COMPANY_V1_HOSPITAL_REFERENCE_SPINE_ALIGNMENT_CANON_2026-08-18.md`

Blocked predecessor task:

`merge-hospital-spine-alignment-test-manual-handoff-v1`

Blocked terminal: Issue #68 comment `5325982174`.

Review classification: `ACCEPT_BLOCKED_LINEAGE_DRIFT`.

The block was correct and occurred before lease/merge/deploy. The only drift from the previously frozen main was the docs-only ops commit:

`6e405d31172bfe4b73e43fb4989dd96211a7200b`

Independent operator verification established:

- `20080497d782598600200afa45b5171087595ff9 -> 6e405d31172bfe4b73e43fb4989dd96211a7200b` is exactly one commit;
- that commit changes only `docs/ops/CURRENT_TASK.md`;
- no source/test/config/content/migration/runtime file changed on main;
- PR #82 remains exact head `4cc4b67b1b29d9269eedbbbb81b9ebf38ee76928` but is now `mergeable=false` because both lineages changed `docs/ops/CURRENT_TASK.md`;
- reviewed executable source/test SHA remains `67b8cce260e23a953ef8d8353b96fb0c316c64e2`;
- its exact-head Company v1 tests run `32115092019` was SUCCESS.

Therefore this task is **lineage reconciliation only**. It must not redesign or alter application semantics.

## 1. Frozen registration identity

Repository: `zeroslove-ai/company-v1`

Pre-registration main:

`6e405d31172bfe4b73e43fb4989dd96211a7200b`

Expected branch:

`company/hospital-spine-pr82-lineage-reconcile-v1`

The authoritative registration SHA and CURRENT_TASK blob SHA are supplied in the Issue #68 `CURRENT_TASK_READY` comment created for this task.

At execution start:

1. fresh-fetch GitHub;
2. require `main` == the exact registration SHA from that Issue comment;
3. require this branch HEAD == that same registration SHA;
4. require this file blob == the exact registered CURRENT_TASK blob;
5. require the registration commit(s) since `6e405d...` to be docs-only `docs/ops/CURRENT_TASK.md` authority changes;
6. require old PR #82 to remain OPEN, unmerged, base `main`, exact head `4cc4b67...`;
7. require reviewed executable SHA `67b8cce...` to remain reachable and unchanged.

If any source/config/test/content/migration drift exists on main, STOP `BLOCKED_HOSPITAL_SPINE_RELINEARIZE_DRIFT` rather than guessing.

## 2. Goal — cleanly relinearize the already-reviewed source/test patch

Create one clean replacement source lineage on this branch from the exact registered current main.

Do **not** merge or rebase PR #82 and do not cherry-pick its workflow/docs commits wholesale.

Apply only the already-reviewed non-doc source/test content represented by the diff:

`20080497d782598600200afa45b5171087595ff9..67b8cce260e23a953ef8d8353b96fb0c316c64e2`

restricted to current reviewed `src/**` and `test/**` paths.

The expected non-doc path set is exactly:

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

No other source/test/config/content/migration file may change.

## 3. Exact equivalence proof

This is not a reimplementation task. After applying the reviewed patch, prove:

1. every `src/**` and `test/**` file in the resulting candidate tree is byte/content-equivalent to the corresponding tree at reviewed executable SHA `67b8cce...`;
2. the only intentional difference between the new candidate lineage and old reviewed lineage is workflow/ops documentation ancestry;
3. no old `docs/ops/CURRENT_TASK.md` content from PR #82 is transplanted;
4. no semantic edit, cleanup, formatting pass, dependency change, config change, migration, content change, provider/model change, or unrelated repair is introduced.

If exact equivalence cannot be proven, STOP `BLOCKED_HOSPITAL_SPINE_RELINEARIZE_EQUIVALENCE`.

## 4. Verification and replacement PR

After exact equivalence is proven:

1. run the same focused alignment/navigation/scene/physical/sexual/memory suites used by the reviewed candidate;
2. run full `npm.cmd test`;
3. run changed JS/MJS syntax checks;
4. run `git diff --check`;
5. require all PASS;
6. open exactly one replacement PR from this branch to `main`;
7. PR body must state that it is a lineage-only replacement for now-conflicted PR #82 and that non-doc source/test content is exact-equivalent to reviewed executable `67b8cce...`;
8. require exact-head `Company v1 tests` CI SUCCESS for the replacement PR;
9. do **not** merge either PR in this task;
10. do not close PR #82 in this task; leave it as historical reviewed-but-conflicted evidence until owner review of the replacement PR.

If CI fails, STOP with the exact failure. Do not repair source in this task.

## 5. Success terminal

On success:

- set this CURRENT_TASK on this branch to `WAITING_REVIEW`;
- record candidate source/test commit SHA;
- record workflow docs head SHA;
- record replacement PR number/head;
- record exact equivalence proof result;
- record focused/full/syntax/diff results;
- record exact-head CI run/result;
- post one terminal to Issue #68;
- terminal classification: `HOSPITAL_SPINE_RELINEARIZED_READY`;
- STOP.

The next operator review may then authorize the normal merge -> merged-main CI -> exact TEST deployment -> structural smoke -> genuinely fresh Level-7 zero-turn manual fixture -> `WAITING_USER_LIVE_ACCEPTANCE` tail.

## 6. Absolute prohibitions

- no source semantic redesign or cleanup beyond the exact reviewed patch;
- no merge/rebase/cherry-pick-wholesale of PR #82;
- no merge of the replacement PR in this task;
- no closing PR #82 before owner review;
- no TEST deploy or gameplay;
- no game creation/reset/reseed;
- no DB write, migration, DDL, migration-history repair, or history mutation;
- no Production/hospital-v2 access;
- no provider/model/TTS/binding changes;
- no retry-until-lucky behavior;
- no semantic router/classifier/verifier;
- no relationship/event/emotion/open-fact ledger or generic CSA DSL;
- no next roadmap Cut.
