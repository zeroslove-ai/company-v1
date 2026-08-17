# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-pr67-draft-to-ready-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Owner authorization

The owner has explicitly resolved the previous `WAITING_OWNER_DECISION` gate and authorizes exactly this next action:

`AUTHORIZE_PR67_DRAFT_TO_READY`

This authorization is **only** for changing PR #67 from Draft to Ready for review after fresh no-drift checks.

It does **not** authorize merge, auto-merge, push to `main`, rebase, squash, force-push, reconstructed landing, Production rollout, deployment, DB/game access, migration application, source/runtime/config changes, or gameplay.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`.

Previous owner gate:
- Task: `minimal-story-runtime-owner-landing-authorization-gate-v1`.
- Gate registration SHA: `ccfbc629eecc33594c5a53d6f6d2c9f40c97336d`.
- Gate CURRENT_TASK blob: `fac3f5eb18379c85c4ad73ac7313a5147abcd4d4`.
- Issue #68 gate comment: `5311603347` (`IC_kwDOTfvo8c8AAAABPJiikw`).
- Accepted landing recommendation: `LANDING_RECOMMEND_MERGE_COMMIT_AS_IS`.
- Accepted executable/source-test SHA: `f03e32c4194c114d702c43df1f6122c17c4ca7c1`.
- Accepted TEST API Worker: `761a01bb-8cca-47ad-afde-87c0ba85c01d`.
- Gate HEAD CI: `31992966892` = SUCCESS.
- Fresh main at authorization time: `1e3a5255e51a284e45baf551dcfd415360981927`.

## Objective

Perform exactly one owner-authorized PR metadata transition:

> PR #67: Draft -> Ready for review

Do not merge it. Do not change its branch/tree except for the final `CURRENT_TASK.md` status commit required by this workflow.

## Mandatory fresh checks before Ready transition

1. Fetch remote refs and freeze exact branch HEAD as `START_SHA`.
2. Fresh-read this CURRENT_TASK and Issue #68 authorization comment that registered it.
3. Fresh-read PR #67 and `origin/main`.
4. Require all of the following before changing PR state:
   - PR #67 state is OPEN;
   - PR #67 is still DRAFT;
   - PR #67 is UNMERGED;
   - PR #67 base is `main`;
   - PR #67 is mergeable and has no newly reported conflict/dirty landing state;
   - `origin/main` is still `1e3a5255e51a284e45baf551dcfd415360981927`;
   - accepted executable `f03e32c4194c114d702c43df1f6122c17c4ca7c1` remains an ancestor of START;
   - all descendants after accepted executable remain documentation-only;
   - START CI for `Company v1 tests` is SUCCESS. If CI is still pending, wait only long enough to obtain the current result; do not mark Ready while CI is pending or failed.
5. If any required condition fails, do **not** mark Ready. Record the exact blocker, finish CURRENT_TASK as WAITING_REVIEW, post one terminal, and STOP.

## Authorized action

After all checks pass, perform only:

- mark PR #67 Ready for review using the normal GitHub Draft -> Ready transition.

The transition must not alter the PR branch/tree or base.

Then verify immediately:
- PR #67 remains OPEN;
- `draft=false` / Ready for review;
- `merged=false` / `merged_at=null`;
- base remains `main`;
- branch remains `company/scene-location-presence-v1`;
- branch HEAD is unchanged by the metadata transition itself;
- no merge or auto-merge was enabled.

## Repository changes authorized

Only `docs/ops/CURRENT_TASK.md` may change in Git for this task.

After the Ready transition and verification:
- update this file from `Status: READY` to `Status: WAITING_REVIEW`;
- record START SHA, final SHA, Ready transition result, PR state, main SHA, CI identity, and zero forbidden-operation counts;
- make one normal fast-forward docs-only commit/push;
- post one immutable terminal report to Issue #68;
- STOP.

## Terminal classifications

Use exactly one:

1. `PR67_READY_TRANSITION_COMPLETE`
2. `PR67_READY_BLOCKED_HEAD_OR_MAIN_DRIFT`
3. `PR67_READY_BLOCKED_CI`
4. `PR67_READY_BLOCKED_PR_STATE`
5. `PR67_READY_BLOCKED_OTHER`

## Forbidden operations

- merge PR #67;
- enable auto-merge;
- push/merge to `main`;
- rebase, squash, cherry-pick, force-push, or reconstruct the landing branch;
- edit source/test/runtime/config/content/script/package/workflow/migration files;
- Production or game/game-ID access;
- DB writes, SQL, DDL, migration application;
- API/frontend deployment;
- provider/model/config/retry/regeneration changes;
- gameplay loops.

## Required terminal evidence

The terminal must include:
- START and FINAL SHA;
- final CURRENT_TASK blob;
- frozen `origin/main` SHA;
- PR #67 state before and after transition;
- PR branch/base/head before the metadata transition and confirmation the transition itself did not change them;
- CI run ID/conclusion used for authorization;
- accepted executable ancestry/no-executable-drift confirmation;
- exact terminal classification;
- explicit `merge=0`, `auto_merge=0`, `main_push=0`, `deploy=0`, `game_access=0`, `db_write=0`;
- statement that merge remains a separate owner decision.

Then STOP. Do not self-generate the next CURRENT_TASK.

## Execution result

- START SHA: `54cb6a6ef7f9e8cb29e01f1dc4b081c1807967f2`.
- Fresh `origin/main` remained `1e3a5255e51a284e45baf551dcfd415360981927`.
- Before transition, PR #67 was OPEN / DRAFT / UNMERGED, base `main` at `1e3a5255e51a284e45baf551dcfd415360981927`, branch `company/scene-location-presence-v1` at START SHA, `mergeable=true`, `mergeStateStatus=CLEAN`.
- Accepted executable `f03e32c4194c114d702c43df1f6122c17c4ca7c1` remained an ancestor. Accepted-source -> START compare was `status=ahead`, `ahead_by=16`, `behind_by=0`, `total_commits=16`, with changed paths limited to `CURRENT_TRUTH.md`, `docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`, `docs/ops/COMPANY_V1_RELEASE_CANDIDATE_HANDOFF_2026-08-17.md`, and `docs/ops/CURRENT_TASK.md`; no executable drift was found.
- START `Company v1 tests` CI run `32016912997` was SUCCESS; gate CI `31992966892` was also SUCCESS.
- Authorized action `AUTHORIZE_PR67_DRAFT_TO_READY` completed. After transition PR #67 remained OPEN / READY (`draft=false`) / UNMERGED (`merged_at=null`), base remained `main`, branch and head remained unchanged at `54cb6a6ef7f9e8cb29e01f1dc4b081c1807967f2`, and GitHub still reported `mergeable=true`, `mergeStateStatus=CLEAN`. No merge or auto-merge was enabled.
- No merge, auto-merge, main push, rebase, squash, cherry-pick, force-push, reconstructed landing, Production/game access, DB write/SQL/DDL/migration, deploy, or source/runtime/test/config/content/script/package/workflow/provider/model/retry/regeneration/gameplay operation occurred.
- Merge remains a separate owner decision after Ready-state verification.
