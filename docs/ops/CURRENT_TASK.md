# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: gameplay-core-simplification-cut1-landing-sync-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority for the Cut 1 landing/synchronization boundary.

## Owner/operator authorization

The owner/operator has explicitly instructed that the next task be registered as `READY` after Cut 1 rework acceptance.

Decision: **do not start Cut 2 yet**.

This task authorizes only the controlled landing sequence below:

`merge PR #69 → verify new main push CI → sync new main into PR #70 → verify exact synchronized PR #70-head CI → STOP`

It does **not** authorize merging PR #70, starting Cut 2, deploying Workers, applying migrations, writing/resetting any DB, or accessing Production/game IDs.

## Frozen identities before execution

Repository: `zeroslove-ai/company-v1`
Expected pre-task `main`: `9d1a80137980baa67ccfba60bae2173ca17cf8d8`

Infrastructure PR #69:
- purpose: add `main` to existing `Company v1 tests` push trigger only
- expected branch: `company/post-landing-main-ci-closure-v1`
- expected head: `677051664dc2dc2185f0b5193fe3f11d4aa1b2a9`
- required pre-state: OPEN / non-Draft / UNMERGED / mergeable

Accepted Cut 1 PR #70:
- branch: `company/gameplay-core-simplification-v1`
- accepted implementation head: `0f1e36c049b16c51302376a4f46cc714c89315d1`
- accepted implementation task blob: `c824cbcf4920cc9b9637f4020d162deef6f9ec96`
- accepted exact-head CI: `Company v1 tests` run `32035382245` — SUCCESS
- operator review: `ACCEPTED_GAMEPLAY_CORE_SIMPLIFICATION_CUT1_REWORK`
- review comment: Issue #68 `5317065771`
- required pre-state before this registration commit: OPEN / non-Draft / UNMERGED / mergeable

Accepted Minimal Story Runtime executable ancestor:
- `f03e32c4194c114d702c43df1f6122c17c4ca7c1`

## Required read/freeze before mutation

Fresh-fetch and record:
1. `main` ref;
2. PR #69 state/head/base/mergeability;
3. PR #70 state/head/base/mergeability;
4. this exact CURRENT_TASK and the Issue #68 `CURRENT_TASK_READY` comment;
5. `.github/workflows/test.yml` on PR #69 head;
6. current PR #70 branch history.

Require:
- `main` is still exactly `9d1a80137980baa67ccfba60bae2173ca17cf8d8`;
- PR #69 head is exactly `677051664dc2dc2185f0b5193fe3f11d4aa1b2a9` and remains unmerged;
- PR #70 accepted implementation head `0f1e36c049b16c51302376a4f46cc714c89315d1` is an ancestor of the registration head;
- the only registration-time change after accepted PR #70 head is this `docs/ops/CURRENT_TASK.md` lifecycle commit;
- no newer owner instruction supersedes this task.

If any guard fails, STOP and report BLOCKED. Do not improvise.

## Phase 1 — land PR #69 only

1. Reconfirm PR #69 changes remain infrastructure-only:
   - `.github/workflows/test.yml`: add `main` under existing `on.push.branches` only;
   - `docs/ops/CURRENT_TASK.md`: lifecycle/ops metadata only.
2. Do not alter PR #69 branch.
3. Merge PR #69 exactly once through GitHub using merge method `merge` with exact expected-head guard `677051664dc2dc2185f0b5193fe3f11d4aa1b2a9`.
4. No squash, rebase, cherry-pick, force-push, auto-merge, reconstruction, or direct push to main.
5. Fresh-fetch `main` and prove the resulting merge commit has old main and exact PR #69 head as the intended lineage.
6. Because PR #69 enables main-push CI, require `Company v1 tests` to run on the resulting exact main merge commit and conclude `SUCCESS`.
7. If landed-main CI fails or does not appear, STOP. Do not continue to PR #70 sync.

## Phase 2 — synchronize accepted Cut 1 PR #70 to the new main

Only after Phase 1 and landed-main CI SUCCESS:

1. Fetch the new exact main.
2. Merge the new main into `company/gameplay-core-simplification-v1` with a normal merge commit. Do not rebase/squash/cherry-pick/force-push.
3. Preserve accepted Cut 1 implementation ancestry: `0f1e36c049b16c51302376a4f46cc714c89315d1` must remain an ancestor.
4. Expected overlap/conflict is limited to `docs/ops/CURRENT_TASK.md` because both PRs touched that file. Resolve that file by keeping this active landing-sync task authority/lifecycle. Do not restore PR #69's stale task text.
5. The workflow addition from landed main must be preserved exactly.
6. If any substantive source/runtime/content/test/migration conflict occurs, STOP as BLOCKED instead of hand-merging semantics.
7. Do not make gameplay/source fixes in this task.

## Validation after sync

Require all of the following before terminal:

- PR #70 remains OPEN / non-Draft / UNMERGED;
- new main is an ancestor of synchronized PR #70 head;
- accepted implementation head `0f1e36c049b16c51302376a4f46cc714c89315d1` remains an ancestor;
- no substantive delta beyond the already accepted Cut 1 implementation plus landed PR #69 workflow change plus CURRENT_TASK lifecycle/merge metadata;
- `npm test` passes with zero failures;
- `git diff --check` passes;
- `Company v1 tests` on the exact synchronized PR #70 final head is `SUCCESS`;
- no Worker deploy;
- no migration apply;
- no TEST/Production DB write/reset;
- no Production/game access;
- no live gameplay acceptance;
- PR #70 merge count remains 0;
- Cut 2 start count remains 0.

If the lifecycle update to `WAITING_REVIEW` creates a final docs-only commit after a successful CI run, require `Company v1 tests` SUCCESS again on that exact final head.

## Cut 2 decision

`presentation-sidecars-cleanup-v1` is **NOT AUTHORIZED in this task**.

Reason: Cut 1 must first be landed on main and its landed-main CI accepted. Only then may the operator register a separate Cut 2 task from the final accepted main baseline.

Do not create a Cut 2 branch, task, PR, commit, or READY signal here.

## Stop condition / terminal report

After PR #69 is landed with main CI SUCCESS and PR #70 is synchronized with exact-head CI SUCCESS:

1. update this file to `Status: WAITING_REVIEW` on `company/gameplay-core-simplification-v1`;
2. post exactly one immutable terminal report to Issue #68;
3. report:
   - registration SHA/blob and START SHA;
   - PR #69 merge commit and exact landed-main SHA;
   - landed-main `Company v1 tests` run ID/conclusion;
   - PR #70 sync merge SHA and final head;
   - ancestry proof for new main + accepted Cut 1 head;
   - exact final PR #70 CI run ID/conclusion;
   - exact changed/conflicted files during sync;
   - merge counts (#69 exactly 1, #70 exactly 0);
   - deploy/migration/DB/Production/gameplay/Cut2 counts all 0;
4. STOP for owner/operator review.

Do not merge PR #70 and do not start Cut 2.
