# Company v1 — CURRENT TASK

Status: WAITING_OWNER_DECISION
Task ID: gameplay-core-simplification-cut1-landing-sequence-owner-gate-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active **landing-sequence owner decision authority**. It does not authorize execution by itself.

## Accepted Cut 1 review

Operator review classification:

`ACCEPTED_GAMEPLAY_CORE_SIMPLIFICATION_CUT1_REWORK`

Accepted implementation PR:
- PR: #70
- Branch: `company/gameplay-core-simplification-v1`
- Exact accepted head: `0f1e36c049b16c51302376a4f46cc714c89315d1`
- Final task blob on PR #70: `c824cbcf4920cc9b9637f4020d162deef6f9ec96`
- Exact-head CI: `Company v1 tests` run `32035382245` — SUCCESS
- Full suite reported and independently anchored by exact-head CI: 316/316
- PR #70 state at review: OPEN / non-Draft / UNMERGED / mergeable
- Merge/deploy/migration-apply/DB-write/Production-game-access/Cut-2-start counts: 0

The accepted rework closes the eight findings from Issue #68 comment `5316218766`: universal work-fiction authority, heroine mandatory-enactment wording, exact clothing CSA subject scope including player, Extract prompt/schema parity, clothing-visible body canon, dead work/generic execution residue, stale tests, and exact-head CI.

## Current landing topology

Current `main`:
- `9d1a80137980baa67ccfba60bae2173ca17cf8d8`

Separate infrastructure PR #69:
- title: `ci: run Company v1 tests on main`
- exact head: `677051664dc2dc2185f0b5193fe3f11d4aa1b2a9`
- state: OPEN / non-Draft / UNMERGED / mergeable
- purpose: add `main` to `Company v1 tests` push trigger
- runtime behavior change: none

Cut 1 PR #70:
- exact accepted head: `0f1e36c049b16c51302376a4f46cc714c89315d1`
- state: OPEN / non-Draft / UNMERGED / mergeable
- base: current `main` above

Both PRs contain `docs/ops/CURRENT_TASK.md`, so blindly landing either and then landing the other can create authority-document conflict/drift. Cut 2 must not start on top of an unlanded Cut 1.

## Recommended owner action

Recommended decision token:

`AUTHORIZE_PR69_MERGE_COMMIT_AS_IS_THEN_SYNC_PR70_TO_NEW_MAIN`

If the owner grants this token, the next executable task may do only this bounded sequence:

1. Fresh-freeze `main`, PR #69 exact head/state/mergeability and its exact-head successful CI evidence.
2. Merge PR #69 exactly once with normal GitHub merge commit and exact-head guard.
3. Verify PR #69 MERGED and `main` advanced to the resulting merge commit.
4. Require the newly enabled `main` push `Company v1 tests` run to complete SUCCESS on that landed main.
5. Sync that new `main` into PR #70's branch without rewriting accepted Cut 1 implementation history. Resolve only the expected `docs/ops/CURRENT_TASK.md` authority conflict if present; do not alter accepted Cut 1 runtime/content/test behavior except mechanically required conflict resolution.
6. Re-run `Company v1 tests` on the exact new PR #70 head and require SUCCESS.
7. Prove the accepted Cut 1 commit `0f1e36c049b16c51302376a4f46cc714c89315d1` remains an ancestor of the synchronized PR #70 head and that no unintended product diff was introduced by the sync.
8. Return to operator review and STOP **before PR #70 merge**.

A separate explicit owner authorization will still be required to merge PR #70 after that sync/revalidation.

## Not authorized

Until explicit owner decision, do not:
- merge PR #69;
- modify or sync PR #70;
- merge PR #70;
- start/create Cut 2 / `presentation-sidecars-cleanup-v1`;
- deploy API/frontend Workers;
- apply any migration;
- write/reset TEST or Production DB;
- access/mutate Production or preserved gameplay;
- change provider/model/retry behavior;
- add semantic gates, compatibility mirrors, generic execution layers, or unrelated source changes;
- force-push, rebase, squash, cherry-pick, reconstruct, or rewrite reviewed ancestry.

## Owner decision boundary

Owner may approve exactly:

`AUTHORIZE_PR69_MERGE_COMMIT_AS_IS_THEN_SYNC_PR70_TO_NEW_MAIN`

or decline/replace the sequence.

Status remains `WAITING_OWNER_DECISION` until an explicit owner decision is recorded in Issue #68. Do not post `CURRENT_TASK_READY` and do not let Hermes execute this gate automatically.
