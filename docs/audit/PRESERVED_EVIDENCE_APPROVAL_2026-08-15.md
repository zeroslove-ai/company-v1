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

The operator originally approved **the exact set of 16 untracked evidence paths that existed in the local repository at the STOP which reported `UNKNOWN_UNTRACKED_FILE` for `extract-block-observation-prompt-closure-v1`**.

This was a snapshot approval, not a filename-pattern or wildcard approval.

Known members reported from that exact local snapshot include:

- `phase12q1-opening-failure-current-context.json`
- `phase12q1-pre-deploy-39turn-action-history.json`
- `phase12q1-pre-deploy-39turn-current-context.json`

The remaining members were the already-existing preserved `phase12*` / `phase12q1*` TEST evidence files in the same 16-path local snapshot referenced above and by the preceding terminal report. Their approval was by membership in that exact contemporaneous 16-path snapshot, not merely by matching a filename prefix.

## V5 incident — one member is no longer trusted preserved evidence

`deep-level7-live-acceptance-v5` terminal report, Issue #68 comment `5300864698`, proved that an unsupported invocation:

`node scripts/live-playtest-canary.mjs --help`

executed the script's implicit opening-only live path and overwrote the previously approved local artifact:

`phase12h-opening-success.json`

Integrity evidence:

- expected pre-V5 SHA-256: `DE1061D5B1BBCE796E4113E6DC8FABEFE21815D8C5D59B7AE956868BF42A2BE0`
- observed post-overwrite SHA-256: `53758E55A651CDB506510A91C118E6E6D57620B73067A38E9C60A2C11A0D9A2F`
- the original contents are not recoverable from the current worktree, GitHub repository search, or Issue history available to the operator.

Therefore, effective immediately:

1. `phase12h-opening-success.json` is **removed from the trusted preserved-evidence set**.
2. The current overwritten file at that path may remain exactly as-is, untracked, unstaged, and uncommitted as a **known-corrupted quarantine artifact**, identified by observed SHA-256 `53758E55A651CDB506510A91C118E6E6D57620B73067A38E9C60A2C11A0D9A2F`.
3. Codex/Hermes must not treat this quarantined file as evidence supporting any gameplay/runtime conclusion.
4. Its known presence must not by itself trigger `UNKNOWN_UNTRACKED_FILE` while the path and observed hash remain exactly unchanged.
5. It must not be restored, rewritten, deleted, moved, renamed, staged, or committed unless a later explicit operator task authorizes disposal or replacement.
6. The **remaining 15 members** of the formerly approved 16-path snapshot retain their trusted preserved-evidence approval only while each remains unchanged, untracked, unstaged, and uncommitted.
7. Any further content change to the quarantined path, any change to the remaining 15 trusted artifacts, or any new unknown untracked path remains a STOP condition.

This incident does not convert corrupted evidence into approved evidence. It creates a narrow quarantine classification so the local worktree can remain forensically intact without repeatedly blocking unrelated work.

## Durable carry-forward rule

This approval persists across future `CURRENT_TASK` transitions. A new task must not require the operator to re-approve the same already-approved preserved snapshot merely because `CURRENT_TASK.md`, docs HEAD, or the execution identity changed.

For every future task:

1. The remaining 15 trusted preserved evidence paths remain approved while unchanged/untracked/unstaged/uncommitted.
2. The one quarantined `phase12h-opening-success.json` path may remain only at the exact observed corrupted hash documented above and is never evidence authority.
3. Docs-only fast-forward and normal task lease acquisition may proceed in the presence of those two known classes.
4. A task expected to create evidence must declare output outside the repository whenever possible. Live/playtest evidence should default to OS TEMP, not repo-root untracked files.
5. Newly created evidence explicitly authorized by the active task may be preserved after terminal completion only if the terminal report identifies it and the next operator handoff deliberately classifies it.
6. Unknown new paths, changed contents of trusted artifacts, changed contents of the quarantined artifact, tracked dirt, or unprovable identity are still STOP conditions.
7. Never solve evidence-state friction with `git clean -fd`, `git reset --hard`, deletion, move, rename, overwrite, or automatic commit of preserved/quarantined artifacts.

## Safety conditions for Codex Skill

Before treating the local worktree as safely preserved:

1. Verify the 15 trusted preserved artifacts remain unchanged, unstaged, and uncommitted.
2. Verify quarantined `phase12h-opening-success.json` remains present only at SHA-256 `53758E55A651CDB506510A91C118E6E6D57620B73067A38E9C60A2C11A0D9A2F`, untracked, unstaged, and uncommitted.
3. Verify no additional unknown untracked path exists unless explicitly authorized by the active task.
4. Verify no tracked source/test/config/runtime file is dirty merely because preserved/quarantined evidence exists.
5. Never clean, reset, delete, move, rename, overwrite, stage, or auto-commit trusted or quarantined artifacts.
6. If any expected identity differs, STOP for operator review.

This approval does not broaden gameplay/runtime scope, authorize live TEST/Production operations, or weaken branch/SHA/lease checks.
