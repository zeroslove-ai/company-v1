# Company v1 — CURRENT TASK

Status: WAITING_OWNER_DECISION
Task ID: gameplay-core-simplification-pr70-merge-authorization-gate-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active owner-decision authority for landing accepted Cut 1 PR #70. It does not authorize execution by itself.

## Accepted landing-sync review

Operator classification:

`ACCEPTED_GAMEPLAY_CORE_SIMPLIFICATION_CUT1_LANDING_SYNC`

Terminal reviewed:
- Issue #68 comment: `5317285584`
- terminal node: `IC_kwDOTfvo8c8AAAABPO9W0A`
- task: `gameplay-core-simplification-cut1-landing-sync-v1`
- registration SHA: `fc2e5f8ab7b30c05721379a86b1e4a90850b44ae`
- final PR #70 head: `917c03eb198f111bba69b9b6698136b592f48970`
- final task blob: `0fab41cbc48cb88e44f64cb4e553e590ffd13740`

## Frozen current state

Current `main`:
- `111be1fba0029c8086d76ca72afcd8b22a18fcca`
- this is the normal GitHub merge commit for PR #69
- parents: prior main `9d1a80137980baa67ccfba60bae2173ca17cf8d8` and exact PR #69 head `677051664dc2dc2185f0b5193fe3f11d4aa1b2a9`
- main-push `Company v1 tests` run `32041625494`: SUCCESS

PR #69:
- CLOSED / MERGED
- exact merged head: `677051664dc2dc2185f0b5193fe3f11d4aa1b2a9`
- merge commit: `111be1fba0029c8086d76ca72afcd8b22a18fcca`
- workflow semantic change: add `main` to existing `on.push.branches` only

Accepted Cut 1 PR #70:
- branch: `company/gameplay-core-simplification-v1`
- base: `main@111be1fba0029c8086d76ca72afcd8b22a18fcca`
- exact synchronized head: `917c03eb198f111bba69b9b6698136b592f48970`
- state: OPEN / non-Draft / UNMERGED / mergeable
- accepted implementation ancestor: `0f1e36c049b16c51302376a4f46cc714c89315d1`
- sync merge: `2be0c61a8ad23b401527712b5d7792cc79a0db51`
- sync parents: registration lineage `fc2e5f8ab7b30c05721379a86b1e4a90850b44ae` and new main `111be1fba0029c8086d76ca72afcd8b22a18fcca`
- sync substantive delta from new main: `.github/workflows/test.yml` `+ main` only
- final lifecycle commit: `917c03eb...`, `docs/ops/CURRENT_TASK.md` only
- exact final-head `Company v1 tests` run `32041771244`: SUCCESS
- local full suite reported: 316/316

No Worker deploy, migration apply, TEST/Production DB write/reset, Production/game access, live gameplay, Cut 2 start, or PR #70 merge occurred during landing-sync.

## Owner decision requested

Recommended action:

`AUTHORIZE_PR70_MERGE_COMMIT_AS_IS`

If the owner grants that exact authorization, register a separate READY merge-execution task with these binding guards:

1. Fresh-fetch `main`, PR #70, exact head CI, this gate, and Issue #68.
2. Require `main` still exactly `111be1fba0029c8086d76ca72afcd8b22a18fcca`.
3. Require PR #70 still OPEN / non-Draft / UNMERGED / mergeable at exact head `917c03eb198f111bba69b9b6698136b592f48970`.
4. Require `Company v1 tests` run `32041771244` SUCCESS on that exact head.
5. Merge PR #70 exactly once using normal GitHub merge method `merge` with exact expected-head guard `917c03eb198f111bba69b9b6698136b592f48970`.
6. No squash, rebase, cherry-pick, auto-merge, force-push, reconstructed landing, or direct manual push to `main`.
7. Fresh-fetch the resulting `main` merge commit and verify its parents are the previous main and exact PR #70 head.
8. Require `Company v1 tests` `push` run on the exact resulting main merge SHA and require SUCCESS.
9. No source/runtime/content/test/migration/workflow edits during merge execution.
10. No Worker deploy, migration apply, DB write/reset, Production/game access, or live gameplay.
11. After landed-main CI SUCCESS, STOP for operator review. Do not start Cut 2 automatically.

## Cut 2 decision

`presentation-sidecars-cleanup-v1` remains NOT AUTHORIZED until PR #70 is actually merged to `main` and the exact landed-main push CI is independently accepted.

After Cut 1 landing acceptance, Cut 2 may be designed and registered as a separate task from that final main baseline.

## Stop condition

This is an owner gate. Do not post `CURRENT_TASK_READY` and do not execute a merge until the owner explicitly authorizes:

`AUTHORIZE_PR70_MERGE_COMMIT_AS_IS`

Production rollout remains unauthorized.