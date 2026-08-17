# Company v1 — CURRENT TASK

Status: WAITING_OWNER_DECISION
Task ID: minimal-story-runtime-owner-pr69-merge-authorization-gate-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority for the Hermes watcher.

## Previous task review

Previous task: `minimal-story-runtime-landed-main-ci-trigger-closure-v1`

Execution identity:
- READY trigger: Issue #68 comment `5315099000` (`IC_kwDOTfvo8c8AAAABPM35eA`).
- STARTED: Issue #68 comment `5315128147`.
- Terminal: Issue #68 comment `5315178613` (`IC_kwDOTfvo8c8AAAABPM8wdQ`).
- Terminal classification: `MAIN_CI_TRIGGER_FIX_PR_READY`.
- START SHA: `a033eda9eceeb71b181f12eaa7681369841e8aed`.
- Final execution-branch SHA: `677051664dc2dc2185f0b5193fe3f11d4aa1b2a9`.
- Initial task blob: `ddaa53e91c33c07507ddb6041b956f892512ff6a`.
- Final execution-branch task blob: `d99a2807f77fda6ffc85462b074b93b5752812fc`.

Operator classification: `ACCEPTED_MAIN_CI_TRIGGER_FIX_PR_READY`.

Independent verification:
- PR #69 is OPEN / non-Draft / UNMERGED / mergeable, base `main`, head branch `company/post-landing-main-ci-closure-v1`.
- Exact reviewed PR #69 head is `677051664dc2dc2185f0b5193fe3f11d4aa1b2a9`.
- Current `main` remains `9d1a80137980baa67ccfba60bae2173ca17cf8d8`.
- `main` -> PR #69 head is `ahead_by=3`, `behind_by=0`.
- Complete changed-path set is exactly:
  - `.github/workflows/test.yml`
  - `docs/ops/CURRENT_TASK.md`
- The only substantive workflow change is one added branch entry: `main` under the existing `on.push.branches` list. Existing test commands, Node version, permissions, Wrangler dry-runs, runtime/source/tests/package/migrations and product behavior are unchanged.
- Exact final-head `Company v1 tests` run `32022784879` at `67705166...` is SUCCESS.
- PR #69 remains unmerged; direct/manual main push, deploy, Production/game access, DB write/migration, runtime change and gameplay remain zero.
- PR #67 remains correctly landed at `9d1a8013...`; it must not be reverted, reconstructed or re-merged.

## Owner decision required

No automated execution is authorized while this file is `WAITING_OWNER_DECISION`.

The smallest next owner-only action is:

`AUTHORIZE_PR69_MERGE_COMMIT_AS_IS`

This means authorizing exactly one normal GitHub merge of PR #69 using merge method `merge`, only after fresh no-drift checks and exact-head CI verification.

The purpose is to land the verified CI-only fix so that pushes/merges to `main` create `Company v1 tests`. The first proper landed-main CI closure evidence must be the `Company v1 tests` push run on the exact PR #69 merge commit after that merge.

This authorization does **not** authorize Production rollout, API/frontend deployment, Production/game access, DB writes, SQL/DDL/migration application, runtime/source/test/package/content/config changes, squash/rebase/cherry-pick/force-push/reconstructed landing, gameplay, or follow-on product work.

## If owner authorizes PR #69 merge

Register a separate `Status: READY` CURRENT_TASK that may do only the following:
1. fresh-freeze `main`, PR #69 exact head/state/mergeability and repository merge settings;
2. require `main` still equals `9d1a80137980baa67ccfba60bae2173ca17cf8d8`;
3. require PR #69 still OPEN / non-Draft / UNMERGED / mergeable with exact head `677051664dc2dc2185f0b5193fe3f11d4aa1b2a9`;
4. re-prove the complete PR diff is only the verified one-line workflow trigger plus CURRENT_TASK lifecycle docs;
5. require exact-head `Company v1 tests` SUCCESS;
6. merge PR #69 exactly once with GitHub merge method `merge` and exact expected-head guard;
7. verify the resulting GitHub merge commit is the exact new `main` and has prior main + exact PR head as parents, with the reviewed PR-head tree landed unchanged;
8. wait for and require the `Company v1 tests` **push** run on that exact new main merge commit to finish SUCCESS;
9. record the landed main SHA, merge parents/tree identity and exact main CI run ID/conclusion in one terminal;
10. STOP for operator review. Do not deploy Production.

If any precondition fails, do not merge. Report the blocker and STOP.

## Production boundary

Production remains a separate explicit owner decision even after a future successful PR #69 merge and landed-main CI SUCCESS.

Before any Production rollout, operator review must separately verify at least:
- exact landed `main` identity and CI SUCCESS;
- accepted executable/runtime traceability from `f03e32c4194c114d702c43df1f6122c17c4ca7c1` through the landed release lineage;
- current TEST API Worker identity `761a01bb-8cca-47ad-afde-87c0ba85c01d` and any intended Production artifact identity;
- migration compatibility/current live schema requirements;
- explicit rollout scope and rollback boundary.

## Forbidden until explicit owner authorization

- merge or auto-merge PR #69;
- direct/manual push to `main`;
- squash/rebase/cherry-pick/force-push/reconstructed landing;
- revert/re-merge PR #67;
- Production/game/game-ID access;
- DB writes/SQL/DDL/migration application;
- API/frontend deployment;
- runtime/source/test/package/content/config/provider/model/retry changes;
- gameplay/follow-on feature work.

## Resume protocol

Do not post `CURRENT_TASK_READY` for this gate and do not let Hermes execute it.

Resume only after an explicit owner instruction equivalent to:

> Authorize PR #69 merge commit as-is. Verify the new main CI run. Do not deploy Production yet.

Until then, STOP.
