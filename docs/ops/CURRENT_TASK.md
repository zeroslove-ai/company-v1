# Company v1 — CURRENT TASK

Status: WAITING_OWNER_DECISION
Task ID: minimal-story-runtime-owner-landing-authorization-gate-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`.

Previous task:
- Task: `minimal-story-runtime-owner-landing-strategy-preflight-v1`
- STARTED: Issue #68 comment `5311552995`.
- Terminal/Trigger: Issue #68 comment `5311568295` (`IC_kwDOTfvo8c8AAAABPJgZpw`) — `EXECUTION: COMPLETE`.
- Previous START SHA: `4883811da4241f18d3fcf975e1b272c1adeead30`.
- Previous FINAL SHA: `392d4609151e868672225d869b65ac56cb52ebbc`.
- Previous final CURRENT_TASK blob: `ae6038c01db17f76fc0642f5746f03113ee5a5a0`.
- Accepted executable/source-test SHA: `f03e32c4194c114d702c43df1f6122c17c4ca7c1`.
- Accepted TEST API Worker: `761a01bb-8cca-47ad-afde-87c0ba85c01d`.
- Final release handoff classification: `HANDOFF_READY_OWNER_DECISION`.

## Operator review of landing-strategy preflight

Classification: `ACCEPTED_LANDING_RECOMMENDATION`.

Fresh independent verification supports the terminal recommendation:
- supplied Trigger resolves exactly to terminal comment `5311568295` for the previous task;
- START `4883811d...` -> FINAL `392d4609...` is exactly one commit and changes only `docs/ops/CURRENT_TASK.md`;
- FINAL CI run `31992614748` is `SUCCESS`;
- current `main` is still `1e3a5255e51a284e45baf551dcfd415360981927`, equal to PR #67's base;
- PR #67 at reviewed FINAL `392d4609...` is OPEN / DRAFT / UNMERGED / mergeable with no main divergence;
- the only open PR in the repository is #67;
- PR #65 and #66 are CLOSED and their heads are ancestors of PR #67, so they are `ANCESTOR/INCLUDED`, not missing dependencies;
- accepted executable `f03e32c4...` remains in PR #67 ancestry and every later descendant remains documentation-only;
- merge-commit-as-is preserves the reviewed ancestry and Issue #68 evidence traceability, whereas squash would replace that ancestry and reconstruct would create a new unreviewed lineage.

Accepted recommendation:

`LANDING_RECOMMEND_MERGE_COMMIT_AS_IS`

This is a recommendation, not authorization to change PR state or merge.

## Owner decision gate

No automated execution is authorized while this file is `WAITING_OWNER_DECISION`.

The smallest next owner-only action recommended by the accepted preflight is:

`AUTHORIZE_PR67_DRAFT_TO_READY`

If the owner explicitly authorizes that action, register a new executable CURRENT_TASK that may do **only** the following:
1. fresh-freeze `main` and PR #67 head/state/mergeability;
2. verify no branch/main/executable drift and current CI success;
3. mark PR #67 Draft -> Ready without changing its branch/tree;
4. verify Ready/open/unmerged state and STOP.

That Draft-to-Ready task must **not** merge PR #67, push to `main`, deploy, access Production/game rows, write DB state, apply migrations, change source/runtime/config, or run gameplay.

Merge authorization remains a separate owner decision after Ready-state verification. If later explicitly authorized, the preferred merge method is a normal GitHub **merge commit**, with an exact expected-head guard and post-landing verification before any Production rollout.

## Preserved release facts

- Final handoff remains `HANDOFF_READY_OWNER_DECISION`.
- Landing recommendation remains `LANDING_RECOMMEND_MERGE_COMMIT_AS_IS` unless fresh drift later invalidates it.
- Accepted executable/source-test identity remains `f03e32c4194c114d702c43df1f6122c17c4ca7c1`.
- Accepted TEST Worker remains `761a01bb-8cca-47ad-afde-87c0ba85c01d`.
- v9/v10 release evidence remains accepted.
- Compact-clothing positive coverage remains exactly one legitimate supported attempt with no Story/Extract completion evidence; it is neither a positive PASS nor a demonstrated persistence failure.
- Landing/Ready decisions are separate from TEST-to-Production rollout authorization.

## Forbidden until explicit owner authorization

- Draft -> Ready transition;
- PR merge or auto-merge;
- rebase, squash, force-push, reconstructed landing branch, or `main` push;
- Production or game/game-ID access;
- DB write/SQL/DDL/migration application;
- API/frontend deployment;
- source/test/runtime/config/content/script/package/workflow/provider/model/retry changes;
- gameplay loop.

## Resume protocol

Do not post `CURRENT_TASK_READY` and do not let the watcher execute this gate.

Resume only after an explicit owner instruction. The safest next explicit instruction is equivalent to:

> Authorize PR #67 Draft-to-Ready only. Do not merge yet.

Until then, STOP.
