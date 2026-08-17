# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-pr67-merge-commit-landing-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Owner authorization

The owner explicitly resolves `minimal-story-runtime-owner-merge-authorization-gate-v1` and authorizes exactly:

`AUTHORIZE_PR67_MERGE_COMMIT_AS_IS`

This authorizes one normal GitHub merge of PR #67 using merge method `merge`, only after all fresh guards below pass.

This authorization does **not** authorize Production rollout, API/frontend deployment, Production/game access, DB writes, SQL/DDL/migration application, source/runtime/test/config/content/script/package/workflow changes, squash/rebase/cherry-pick/force-push/reconstructed landing, additional gameplay, or follow-on feature work.

## Canonical identities

Repository: `zeroslove-ai/company-v1`
Canonical PR: #67
PR branch: `company/scene-location-presence-v1`
PR base: `main`
Owner-gate registration SHA: `0209b779c954a967291702d759f49dcf5060b4a7`
Owner-gate CURRENT_TASK blob: `e4547e0415fcd3e37840b6d7168e75261a03a877`
Owner-gate Issue #68 comment: `5314567754` (`IC_kwDOTfvo8c8AAAABPMXeSg`)
Accepted executable/source-test SHA: `f03e32c4194c114d702c43df1f6122c17c4ca7c1`
Accepted TEST API Worker: `761a01bb-8cca-47ad-afde-87c0ba85c01d`
Accepted landing recommendation: `LANDING_RECOMMEND_MERGE_COMMIT_AS_IS`
Expected main before registration: `1e3a5255e51a284e45baf551dcfd415360981927`
Pre-registration PR HEAD: `0209b779c954a967291702d759f49dcf5060b4a7`
Pre-registration HEAD CI: `32017770788` = SUCCESS

## Objective

Land the accepted Company v1 Minimal Story Runtime release candidate by merging PR #67 **as-is with a normal merge commit**, preserving the reviewed ancestry and accepted executable traceability.

Perform no other product/runtime operation.

## Mandatory fresh pre-merge guards

Before any merge mutation:

1. Fetch current remote refs and freeze:
   - `START_SHA` = exact current `company/scene-location-presence-v1` head;
   - `PRE_MERGE_MAIN_SHA` = exact current `main` head.
2. Fresh-read this CURRENT_TASK and the Issue #68 owner authorization / CURRENT_TASK_READY comment that registered it.
3. Fresh-read PR #67 metadata and repository merge settings.
4. Require all of the following:
   - CURRENT_TASK is exactly `Status: READY` and Task ID `minimal-story-runtime-pr67-merge-commit-landing-v1`;
   - branch head equals the registration SHA from the CURRENT_TASK_READY comment; no later branch commit exists;
   - `main` is still exactly `1e3a5255e51a284e45baf551dcfd415360981927`;
   - PR #67 is OPEN / READY (`draft=false`) / UNMERGED;
   - PR base is `main` and head branch is `company/scene-location-presence-v1`;
   - GitHub reports the PR mergeable with no conflict/dirty blocker;
   - repository settings still permit normal merge commits;
   - accepted executable `f03e32c4194c114d702c43df1f6122c17c4ca7c1` remains an ancestor of START;
   - every commit after the accepted executable through START changes only the established release/ops documentation paths (`CURRENT_TRUTH.md`, `docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`, `docs/ops/COMPANY_V1_RELEASE_CANDIDATE_HANDOFF_2026-08-17.md`, `docs/ops/CURRENT_TASK.md`); no executable drift;
   - `Company v1 tests` for exact START SHA is completed SUCCESS.
5. If START CI is pending, wait only for its result. If failed/cancelled or any other guard fails, **do not merge**.

## Authorized merge action

If and only if all guards pass:

- merge PR #67 once using GitHub merge method `merge`;
- use an exact expected-head guard equal to `START_SHA` so the merge must fail rather than land a changed head;
- do not enable auto-merge;
- do not squash or rebase;
- do not manually push to `main`.

The GitHub-created merge commit is the only authorized `main` mutation.

## Required post-merge verification

Immediately after the merge:

1. Fresh-read PR #67 and require `MERGED` / `merged_at != null`.
2. Fetch `main` and require it advanced from `PRE_MERGE_MAIN_SHA` to the GitHub merge commit returned by the merge operation.
3. Fetch the merge commit and verify parent identities:
   - first parent = `PRE_MERGE_MAIN_SHA`;
   - second parent = `START_SHA` (or otherwise prove the PR head is the exact merged second-parent ancestry if GitHub representation differs; any ambiguity is a review blocker).
4. Verify `START_SHA` and accepted executable `f03e32c4...` are ancestors of landed `main`.
5. Verify the merge commit tree equals the reviewed `START_SHA` tree. Because `main` must not have diverged, any tree mismatch is a post-landing blocker requiring operator review.
6. Verify no extra commit appeared on `main` after the merge commit during this task.
7. Wait for the `Company v1 tests` run on the exact landed main merge commit and record its final conclusion.
8. Record exact landed main SHA, merge commit SHA, both parent SHAs, CI run ID/conclusion, and PR merged state in the terminal.

## Success / blocker classifications

Use exactly one terminal classification:

1. `PR67_MERGE_COMMIT_LANDED_VERIFIED` — merge completed, ancestry/tree checks pass, landed-main CI SUCCESS.
2. `PR67_MERGE_BLOCKED_PRECONDITION` — no merge occurred because a pre-merge guard failed.
3. `PR67_MERGE_BLOCKED_CI` — no merge occurred because START CI was not SUCCESS.
4. `PR67_MERGED_POSTCHECK_BLOCKER` — merge occurred but a post-merge ancestry/tree/main-state check failed or landed-main CI did not succeed.
5. `PR67_MERGE_BLOCKED_OTHER` — no merge occurred for another concrete reason.

Never attempt to undo, revert, force-push, or perform a second merge inside this task.

## CURRENT_TASK lifecycle for this landing task

### If merge does not occur

You may update only `docs/ops/CURRENT_TASK.md` on the PR branch to `Status: WAITING_REVIEW`, make one docs-only fast-forward commit, post one terminal, and STOP.

### If merge succeeds

**Do not make any Git commit after the merge**, neither on the PR branch nor on `main`.

Reason: the exact registered `START_SHA` is the reviewed head being landed; a post-merge branch status commit would create a new unlanded descendant, and a direct docs push to `main` would create a second unauthorized main mutation.

After successful merge and post-merge verification, post exactly one immutable terminal to Issue #68 and STOP. It is expected that the merged copy of this CURRENT_TASK on `main` still says `Status: READY`; the operator review will replace it with the next post-landing authority after verifying the terminal.

## Production boundary

A successful merge is **not** Production authorization.

Do not:
- deploy API/frontend;
- inspect or mutate Production or any game/game-ID;
- write DB state or apply migrations;
- change Worker/provider/model/retry/config;
- run gameplay acceptance.

After successful landing, STOP at operator post-landing review. Production rollout requires a new explicit owner authorization after landed-main identity, CI, deployment artifact traceability, and migration compatibility are reviewed.

## Forbidden operations

- auto-merge;
- squash/rebase/cherry-pick/force-push/reconstructed landing;
- manual/direct push to `main` other than the GitHub-created merge commit;
- any second merge or revert attempt;
- source/test/runtime/config/content/script/package/workflow/migration changes;
- Production/game/game-ID access;
- DB write/SQL/DDL/migration application;
- API/frontend deployment;
- provider/model/config/retry/regeneration changes;
- gameplay loops;
- starting the next feature/Cut.

## Required terminal evidence

Terminal must include:
- exact Task ID and registration CURRENT_TASK blob;
- `START_SHA` and `PRE_MERGE_MAIN_SHA`;
- exact START CI run ID/conclusion;
- PR pre-merge state and mergeability;
- accepted executable ancestry/no-executable-drift proof;
- merge method actually used;
- expected-head guard used;
- whether merge mutation occurred exactly once;
- resulting PR state;
- landed `main`/merge commit SHA;
- merge commit parent SHAs and tree-equivalence result;
- landed-main CI run ID/conclusion;
- exact terminal classification;
- explicit counts: `merge=0|1`, `auto_merge=0`, `manual_main_push=0`, `deploy=0`, `Production/game_access=0`, `db_write=0`, `migration_apply=0`, `runtime_change=0`, `gameplay=0`;
- explicit statement that Production rollout remains unauthorized.

Post exactly one terminal report to Issue #68 and STOP. Do not self-generate the next CURRENT_TASK.
