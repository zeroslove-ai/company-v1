# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-landed-main-ci-trigger-closure-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`
Working branch: `company/post-landing-main-ci-closure-v1`
Branch base / landed main at branch creation: `9d1a80137980baa67ccfba60bae2173ca17cf8d8`
Merged release PR: #67
Merged PR head / merge second parent: `d8e301d0b28fc7a590c5f0c77854c114661395d5`
Accepted executable/source-test SHA: `f03e32c4194c114d702c43df1f6122c17c4ca7c1`
Accepted TEST API Worker: `761a01bb-8cca-47ad-afde-87c0ba85c01d`
Blocked landing terminal: Issue #68 comment `5314721284` (`IC_kwDOTfvo8c8AAAABPMg2BA`)

## Execution result — WAITING_REVIEW

- Workflow-only fix committed at `b414a524364d79a777881f71b1465df8c1fad895`; `.github/workflows/test.yml` adds exactly `main` to the existing `on.push.branches` list.
- `git diff --check`: PASS; YAML parse/review: PASS; `npm test`: PASS (`305` tests, `0` failures).
- API Worker dry-run: PASS (`npx --yes wrangler deploy --dry-run --config wrangler.api.jsonc`).
- Frontend Worker dry-run: PASS (`npx --yes wrangler deploy --dry-run --config wrangler.frontend.jsonc`).
- PR #69: `OPEN`, non-Draft, `MERGEABLE`, base `main`, workflow-fix head `b414a524364d79a777881f71b1465df8c1fad895`; `Company v1 tests` run `32022662736`: SUCCESS.
- Current `main`: `9d1a80137980baa67ccfba60bae2173ca17cf8d8`. The final docs-only status commit will change the PR head; its exact final SHA and CI run are recorded in the terminal report after that required recheck.
- Forbidden-operation counts: follow-up merges `0`; direct `main` pushes `0`; deployments `0`; Production/game access `0`; DB writes `0`; migrations `0`; runtime/source/test/package/content/config changes `0` beyond the authorized workflow file; gameplay `0`.

## Operator review of blocked landing terminal

Classification: `ACCEPTED_MERGE_LANDED_CI_TRIGGER_BLOCKER`.

Independent verification establishes:
- the supplied READY trigger belongs to `minimal-story-runtime-pr67-merge-commit-landing-v1`;
- PR #67 was merged exactly once with normal merge method `merge`;
- PR #67 is CLOSED / MERGED and `merged_at=2026-08-17T10:10:18Z`;
- landed `main` is exactly `9d1a80137980baa67ccfba60bae2173ca17cf8d8`;
- merge parents are exactly prior main `1e3a5255e51a284e45baf551dcfd415360981927` and reviewed PR head `d8e301d0b28fc7a590c5f0c77854c114661395d5`;
- merge tree `82bfa6505c38fc19224a97b5c2e7f7bd8fb7e5c7` equals the reviewed PR-head tree;
- accepted executable and reviewed PR head are ancestors of landed main;
- no second merge, revert, manual main push, deployment, Production/game access, DB write/migration, runtime change, or gameplay occurred;
- the blocker is CI-only: `.github/workflows/test.yml` does not subscribe `Company v1 tests` to pushes on `main`, so GitHub created no test run for the landed merge commit;
- the merged release itself must not be reverted or reconstructed for this CI configuration gap.

## Objective

Close the structural CI trigger gap with the smallest isolated workflow change, without touching Company runtime behavior or Production.

Create a tiny follow-up PR against `main` whose substantive change is only:

> add `main` to `.github/workflows/test.yml` under `on.push.branches` so every future push/merge to `main` creates a `Company v1 tests` run.

Do not change test commands, Node version, dry-run commands, job permissions, runtime source, package files, migrations, provider/model/config, or product behavior.

## Mandatory fresh checks

Before editing:
1. Fetch remote refs and freeze exact `START_SHA` for this branch and exact current `main`.
2. Require current `main` still equals `9d1a80137980baa67ccfba60bae2173ca17cf8d8`. If main moved, STOP and report exact drift.
3. Fresh-read PR #67, merge commit `9d1a8013...`, this CURRENT_TASK, blocked terminal `5314721284`, and `.github/workflows/test.yml` from current main.
4. Re-confirm workflow currently lacks `main` under `push.branches` and that this omission explains why no landed-main test run exists.
5. Confirm there is no already-open PR implementing the same main-trigger fix.
6. Confirm working tree is clean except any explicitly preserved runner artifacts allowed by the existing runner rules.

## Authorized repository changes

Only these paths may change:
- `.github/workflows/test.yml`
- `docs/ops/CURRENT_TASK.md`

The workflow diff must be minimal. Add exactly one branch entry:

```yaml
  push:
    branches:
      - main
      - company/full-feature-transplant-v1
      - company/scene-cast-structured-story-v2
```

Do not add `workflow_dispatch`, schedules, new jobs, new permissions, matrix changes, caching changes, action-version changes, or unrelated cleanup in this task.

## Validation

After the workflow edit:
1. `git diff --check` PASS.
2. Parse/review YAML and confirm the only workflow semantic change is enabling push CI on `main`.
3. Run `npm test` and require success.
4. Run the existing API Worker dry-run command exactly as CI does: `npx --yes wrangler deploy --dry-run --config wrangler.api.jsonc`.
5. Run the existing Frontend Worker dry-run command exactly as CI does: `npx --yes wrangler deploy --dry-run --config wrangler.frontend.jsonc`.
6. Confirm no runtime/source/test/package/migration file changed.

## Follow-up PR

After local validation passes:
1. Commit/push the authorized changes normally on `company/post-landing-main-ci-closure-v1`.
2. Open exactly one normal PR against `main` from this branch, not Draft, titled approximately `ci: run Company v1 tests on main`.
3. PR body must state:
   - PR #67 is already merged at `9d1a8013...`;
   - this PR is CI infrastructure-only and does not alter runtime behavior;
   - it fixes the missing `main` push trigger that caused terminal `PR67_MERGED_POSTCHECK_BLOCKER`;
   - Production rollout remains unauthorized.
4. Wait for the PR-triggered `Company v1 tests` workflow on the exact final branch head and require SUCCESS.
5. Fresh-read PR metadata and require OPEN / UNMERGED / mergeable.
6. Do **not** merge this follow-up PR. Its merge remains an explicit owner decision after operator review.

## Important evidence interpretation

The original landed merge commit `9d1a8013...` cannot retroactively acquire a `push` workflow run from a trigger that did not exist for `main` at merge time. Do not fake or mislabel another SHA as CI for that exact historical merge commit.

The purpose of this task is instead to prove all of the following honestly:
- PR #67 landing/tree/ancestry is already structurally correct;
- the missing run was caused by workflow trigger coverage, not runtime failure;
- the proposed workflow-only fix passes the same test/dry-run job on its PR head;
- once owner later merges the CI-fix PR, that new `main` push must generate the first proper `Company v1 tests` main run, which will become the post-landing CI closure evidence.

## Terminal classifications

Use exactly one:
1. `MAIN_CI_TRIGGER_FIX_PR_READY` — minimal workflow fix committed, PR opened, PR CI SUCCESS.
2. `MAIN_CI_TRIGGER_FIX_BLOCKED_MAIN_DRIFT`
3. `MAIN_CI_TRIGGER_FIX_BLOCKED_VALIDATION`
4. `MAIN_CI_TRIGGER_FIX_BLOCKED_PR_OR_CI`
5. `MAIN_CI_TRIGGER_FIX_BLOCKED_OTHER`

## Forbidden operations

- merge the CI-fix PR;
- direct/manual push to `main`;
- revert or alter PR #67 landing;
- modify runtime/source/test/package/migration/content/config files;
- change existing CI commands beyond adding the `main` branch trigger;
- Production/game/game-ID access;
- DB write/SQL/DDL/migration application;
- API/frontend deployment;
- provider/model/retry/config changes;
- gameplay or new product/Cut work.

## CURRENT_TASK lifecycle

When finished:
- update this file to `Status: WAITING_REVIEW` with exact result, final branch SHA, PR number/head, CI run ID/conclusion, current main SHA, and zero forbidden-operation counts;
- the final status commit may touch only `docs/ops/CURRENT_TASK.md` after the workflow-fix commit;
- push normally;
- if that final docs commit changes the PR head, wait for CI on the exact new final head and require SUCCESS before terminal;
- post exactly one immutable terminal to Issue #68 and STOP;
- do not self-generate the next task.

Production rollout remains unauthorized throughout this task.
