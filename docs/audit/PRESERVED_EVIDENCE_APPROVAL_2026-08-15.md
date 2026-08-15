# Company v1 — Preserved Untracked Evidence Approval

Date: 2026-08-15 KST
Authority: Operator approval for local preserved evidence only
Repository: `zeroslove-ai/company-v1`
Canonical branch: `company/scene-location-presence-v1`

## Why this approval exists

The local Codex Skill correctly stopped before executing a READY task with:

`UNKNOWN_UNTRACKED_FILE — OPERATOR REVIEW REQUIRED`

Hermes/worker were healthy. The stop was caused by the local worktree containing preserved TEST evidence files whose prior approval had not been carried forward into the current canon/audit approval surface.

The immutable terminal report for `extract-block-observation-wire-simplification-v1` (Issue #68 comment `5300270118`) explicitly recorded:

- `Preserved repository evidence: 16 approved untracked files unchanged, unstaged, uncommitted.`

No cleanup, reset, move, or commit of those evidence files is authorized.

## Explicit snapshot approval

The operator approves **the exact set of 16 untracked evidence paths that existed in the local repository at the STOP which reported `UNKNOWN_UNTRACKED_FILE` for `extract-block-observation-prompt-closure-v1`**.

This is a snapshot approval, not a filename-pattern or wildcard approval.

Known members reported from that exact local snapshot include:

- `phase12q1-opening-failure-current-context.json`
- `phase12q1-pre-deploy-39turn-action-history.json`
- `phase12q1-pre-deploy-39turn-current-context.json`

The remaining members are the already-existing preserved `phase12*` / `phase12q1*` TEST evidence files in the same 16-path local snapshot referenced above and by the preceding terminal report. Their approval is by membership in that exact contemporaneous 16-path snapshot, not merely by matching a filename prefix.

## Durable carry-forward rule

This approval persists across future `CURRENT_TASK` transitions. A new task must not require the operator to re-approve the same already-approved preserved snapshot merely because `CURRENT_TASK.md`, docs HEAD, or the execution identity changed.

For every future task:

1. The previously approved preserved evidence set remains approved while each path is still present as the same local untracked evidence artifact and remains unchanged, unstaged, and uncommitted.
2. Docs-only fast-forward and normal task lease acquisition may proceed in the presence of that approved set.
3. A task that is expected to create additional evidence must declare the intended evidence output path(s) or deterministic output location before execution when reasonably knowable.
4. Newly created evidence that was explicitly authorized by the active task may be preserved after terminal completion, but the terminal report must enumerate or otherwise identify it so the next operator handoff can extend this durable approval deliberately.
5. Unknown new paths, changed contents of previously approved artifacts, tracked dirt, or an unprovable evidence identity are still STOP conditions.
6. Never solve evidence-state friction with `git clean -fd`, `git reset --hard`, deletion, move, rename, overwrite, or automatic commit of preserved artifacts.

The purpose is to prevent repeated false stops on already-reviewed evidence without weakening protection against genuinely unknown local state.

## Safety conditions for Codex Skill

Before treating the local worktree as safely preserved, Codex must verify:

1. Previously approved preserved paths are unchanged, unstaged, and uncommitted.
2. No additional unknown untracked path exists unless the active task explicitly authorized its creation.
3. No tracked source/test/config/runtime file is dirty merely because preserved evidence exists.
4. Approved evidence is never cleaned, reset, deleted, moved, renamed, overwritten, or auto-committed.
5. If the approved set has changed unexpectedly, if any additional unknown file exists, or if identity cannot be proven, STOP for operator review.

This approval does not broaden gameplay/runtime task scope, authorize live TEST/Production operations, or weaken branch/SHA/lease checks.
