# Company v1 — Preserved Untracked Evidence Approval

Date: 2026-08-15 KST
Authority: Operator approval for local preserved evidence only
Repository: `zeroslove-ai/company-v1`
Canonical branch: `company/scene-location-presence-v1`
Active task: `extract-block-observation-prompt-closure-v1`

## Why this approval exists

The local Codex Skill correctly stopped before executing the active READY task with:

`UNKNOWN_UNTRACKED_FILE — OPERATOR REVIEW REQUIRED`

Hermes/worker were healthy. The stop was caused by the local worktree containing preserved TEST evidence files that were not carried forward into the current canon/audit approval surface.

The immediately preceding immutable terminal report for `extract-block-observation-wire-simplification-v1` (Issue #68 comment `5300270118`) explicitly recorded:

- `Preserved repository evidence: 16 approved untracked files unchanged, unstaged, uncommitted.`

No cleanup, reset, move, or commit of those evidence files is authorized.

## Explicit snapshot approval

The operator hereby approves **the exact set of 16 untracked evidence paths that already existed in the local repository at the STOP which reported `UNKNOWN_UNTRACKED_FILE` for `extract-block-observation-prompt-closure-v1`**.

This is a snapshot approval of that existing 16-path set, **not a filename-pattern or wildcard approval**.

Known members reported from that exact local snapshot include:

- `phase12q1-opening-failure-current-context.json`
- `phase12q1-pre-deploy-39turn-action-history.json`
- `phase12q1-pre-deploy-39turn-current-context.json`

The remaining members are the already-existing preserved `phase12*` / `phase12q1*` TEST evidence files in the same 16-path local snapshot referenced above and by the preceding terminal report. Their approval is by membership in that exact contemporaneous 16-path snapshot, not merely by matching a filename prefix.

## Safety conditions for Codex Skill

Before treating the local worktree as safely preserved, Codex must verify all of the following:

1. The local untracked set is exactly the same 16-path snapshot that triggered the current `UNKNOWN_UNTRACKED_FILE` stop.
2. There are exactly 16 approved preserved untracked paths; no 17th/new untracked path is implicitly approved.
3. No tracked source/test/config/runtime file is dirty merely because this approval exists.
4. The approved evidence files remain untracked, unchanged, unstaged, and uncommitted.
5. Do not run `git clean -fd`, `git reset --hard`, delete, move, rename, overwrite, or auto-commit these files.
6. If the untracked set differs from that exact 16-path snapshot, if any additional unknown file exists, or if identity cannot be proven, STOP again for operator review.

This approval exists only to allow the safe docs-only fast-forward and execution of the already-registered active task. It does not broaden any task scope, authorize live TEST/Production operations, or weaken the dirty-worktree guard for future unknown artifacts.

## Active task remains unchanged

`extract-block-observation-prompt-closure-v1` remains the sole CURRENT_TASK authority. This audit approval does not alter its source/test-only scope or its prohibitions. Once the local evidence snapshot is verified, Codex may perform the normal docs-only fast-forward, acquire the execution lease, and execute that task exactly as written.
