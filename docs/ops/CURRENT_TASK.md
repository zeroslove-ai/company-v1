# Company v1 — CURRENT TASK

Status: WAITING_OWNER_DECISION
Task ID: minimal-story-runtime-owner-merge-authorization-gate-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Review result

Previous task:
- Task: `minimal-story-runtime-pr67-draft-to-ready-v1`
- Trigger/CURRENT_TASK_READY: Issue #68 comment `5314452710` (`IC_kwDOTfvo8c8AAAABPMQc5g`).
- STARTED: Issue #68 comment `5314474151`.
- Terminal: Issue #68 comment `5314500663` (`IC_kwDOTfvo8c8AAAABPMTYNw`) — `EXECUTION: COMPLETE`.
- START SHA: `54cb6a6ef7f9e8cb29e01f1dc4b081c1807967f2`.
- FINAL SHA: `df0349ce4026a7a5ca75a3f1586946fa2cd8dea0`.
- Final CURRENT_TASK blob: `92ebae508192bb7e5443a1cc11e4ae91b61b55c5`.
- Accepted executable/source-test SHA: `f03e32c4194c114d702c43df1f6122c17c4ca7c1`.
- Accepted TEST API Worker: `761a01bb-8cca-47ad-afde-87c0ba85c01d`.

Operator classification: `ACCEPTED_PR67_READY_TRANSITION`.

Independent verification:
- supplied Trigger resolves exactly to the owner-authorized READY comment for the Draft -> Ready task;
- task terminal is comment `5314500663` and reports `PR67_READY_TRANSITION_COMPLETE`;
- START -> FINAL is exactly one Git commit and changes only `docs/ops/CURRENT_TASK.md`;
- current `main` remains `1e3a5255e51a284e45baf551dcfd415360981927`;
- PR #67 is OPEN / READY (`draft=false`) / UNMERGED, base `main`, head `df0349ce4026a7a5ca75a3f1586946fa2cd8dea0`, and mergeable;
- accepted executable -> FINAL is `ahead_by=17`, `behind_by=0`; changed paths after the accepted executable remain limited to the four release/ops documentation paths, so executable drift is zero;
- FINAL CI `32017184173` at `df0349ce...` is SUCCESS;
- merge, auto-merge, main push, deploy, Production/game access, DB writes/migrations, runtime/source/test/config changes, and gameplay all remain zero;
- repository settings allow normal merge commits and auto-merge is disabled;
- PR owner-facing body has been corrected to reflect OPEN / READY / UNMERGED and that merge remains owner-only.

The previously accepted landing recommendation remains:

`LANDING_RECOMMEND_MERGE_COMMIT_AS_IS`

## Owner decision required

No automated execution is authorized while this file is `WAITING_OWNER_DECISION`.

The smallest next owner-only action is:

`AUTHORIZE_PR67_MERGE_COMMIT_AS_IS`

This means authorizing exactly one normal GitHub merge of PR #67 using merge method `merge`, only after fresh no-drift checks.

It does **not** authorize Production rollout, deployment, game access, DB writes, migration application, additional gameplay, source/runtime changes, squash/rebase, or any follow-on feature work.

## If owner authorizes merge

Register a separate `Status: READY` CURRENT_TASK that may do only the following:
1. fresh-freeze `main`, PR #67 head/state/mergeability, and repository merge-method settings;
2. require PR #67 OPEN / READY / UNMERGED and current HEAD CI SUCCESS;
3. require `main` still equals the expected frozen base or otherwise STOP for drift review;
4. require accepted executable `f03e32c4...` remains an ancestor and post-accepted descendants remain documentation-only;
5. merge PR #67 with GitHub merge method `merge` and an exact expected-head SHA guard;
6. verify PR becomes MERGED and `main` advances to the resulting merge commit with PR head as an ancestor;
7. verify the landed main tree contains the reviewed PR head tree unchanged apart from the merge commit parentage;
8. record landed main SHA, merge commit SHA, parent identities, and post-merge CI status;
9. STOP at post-landing review. Do not deploy Production.

If any precondition fails, do not merge; report the blocker and STOP.

## Production boundary

Landing and Production rollout remain separate authorities.

Even after a future successful merge, Production requires a separate explicit owner authorization after post-landing verification of:
- exact landed main SHA/tree;
- CI on landed main;
- accepted executable/runtime traceability;
- deployment artifact/version identity;
- migration compatibility;
- current Production rollout plan.

## Forbidden until explicit merge authorization

- merge or auto-merge PR #67;
- push/merge directly to `main`;
- squash, rebase, cherry-pick, force-push, or reconstructed landing;
- Production/game/game-ID access;
- DB writes/SQL/DDL/migration application;
- API/frontend deployment;
- source/test/runtime/config/content/script/package/workflow/provider/model/retry changes;
- gameplay loops.

## Resume protocol

Do not post `CURRENT_TASK_READY` for this gate and do not let Hermes watcher execute it.

Resume only after an explicit owner instruction equivalent to:

> Authorize PR #67 merge commit as-is. Do not deploy Production yet.

Until then, STOP.
