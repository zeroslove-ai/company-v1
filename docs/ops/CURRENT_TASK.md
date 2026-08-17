# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-final-release-handoff-descendant-inventory-closure-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous task:
- Task: `minimal-story-runtime-final-release-handoff-metadata-correction-v1`
- Trigger/CURRENT_TASK_READY: Issue #68 comment `5311421861` (`IC_kwDOTfvo8c8AAAABPJXdpQ`)
- STARTED: Issue #68 comment `5311443810`
- Terminal: Issue #68 comment `5311463622` (`IC_kwDOTfvo8c8AAAABPJaAxg`) — `EXECUTION: COMPLETE`
- Previous START SHA: `5614ffe40f7308179e9c0f2413892be73ffc056c`
- Previous FINAL SHA: `18d97d6ff6fc09b236b8472e2cf2911d0becae10`
- Previous final CURRENT_TASK blob: `f10b12ca27eccb5fccbfb51fbd26e57ee19934ce`
- Accepted executable/source-test SHA: `f03e32c4194c114d702c43df1f6122c17c4ca7c1`
- Accepted TEST API Worker: `761a01bb-8cca-47ad-afde-87c0ba85c01d`
- Previous FINAL CI: `31991516753` = SUCCESS.

## Operator review of previous terminal

Classification: `CHANGES_REQUIRED_HANDOFF_DESCENDANT_INVENTORY`.

Accepted from the previous correction:
- the supplied Trigger resolves exactly to the metadata-correction READY comment;
- the immutable terminal for that task is Issue #68 comment `5311463622`;
- START `5614ffe4...` -> FINAL `18d97d6f...` is exactly one commit and changes only the four authorized documentation paths;
- accepted executable `f03e32c4...` remains an ancestor;
- PR title/body no longer contain the stale `minimal-story-runtime-authority-audit-v1` current-task wording;
- PR metadata correction from the capped `250` enumeration to authoritative PR metadata was correct: 419 commits at START and 420 at FINAL;
- `CURRENT_TRUTH.md` now treats `1bb73802...` and `5614ffe4...` as dated docs-only snapshots rather than executable identities;
- FINAL CI `31991516753` is SUCCESS;
- no source/test/runtime/config/content/script/migration/package/workflow change, gameplay/game-ID access, DB write, migration application, deploy, merge, Ready, rebase, squash, force-push or main push occurred;
- accepted v9/v10 evidence and the compact-clothing non-reach remain unchanged.

Remaining owner-facing defect:
- `docs/ops/COMPANY_V1_RELEASE_CANDIDATE_HANDOFF_2026-08-17.md` still says: `Against the accepted executable SHA, the six descendants are:` and lists only six commits through `1bb73802...`.
- Fresh GitHub compare `f03e32c4194c114d702c43df1f6122c17c4ca7c1...18d97d6ff6fc09b236b8472e2cf2911d0becae10` reports `ahead_by=10` / `total_commits=10`.
- Therefore the six-item wording is not an exhaustive descendant inventory at the corrected FINAL snapshot and makes the purported final owner handoff factually stale.
- This is documentation metadata only. It is not executable drift, live drift, or a product defect.

## Objective

Close the last brittle descendant-inventory wording in the final owner handoff without changing runtime/live conclusions.

The preferred durable correction is **not** to keep chasing a moving exact descendant count. Instead:
- remove or rewrite the brittle sentence/list that implies the six listed commits are the complete descendants after `f03e32c4...`;
- describe the executable-drift proof using a frozen compare boundary, e.g. accepted executable SHA -> frozen audit/correction snapshot;
- state the compare result and changed-path set for that frozen boundary;
- if individual orchestration commits are retained for historical context, label the list explicitly as a partial/historical sequence and not the exhaustive current descendant set;
- keep current docs-only registration commits from invalidating the handoff merely by advancing HEAD.

If fresh facts reveal no other blocker, retain landing classification `HANDOFF_READY_OWNER_DECISION`.

## Mandatory fresh verification

1. Fetch origin and freeze exact branch HEAD as `START_SHA`.
2. Fresh-read this CURRENT_TASK, terminal `5311463622`, PR #67 title/body/metadata, final handoff document, `CURRENT_TRUTH.md`, and the dated release section of `09_CURRENT_TRUTH.md`.
3. Verify PR #67 remains OPEN / DRAFT / UNMERGED / mergeable and head equals START.
4. Verify accepted executable `f03e32c4194c114d702c43df1f6122c17c4ca7c1` is an ancestor of START.
5. Use GitHub compare for accepted executable -> START and record `ahead_by/total_commits` plus the complete changed-path set. The important invariant is zero executable drift, not a brittle moving docs-commit count.
6. Verify previous FINAL CI `31991516753` SUCCESS and current START CI if present.
7. No Worker/DB/game-row revalidation is required unless fresh metadata contradicts previously accepted live facts.

## Authorized edits

Repository edits are limited to:
- `docs/ops/COMPANY_V1_RELEASE_CANDIDATE_HANDOFF_2026-08-17.md`;
- `CURRENT_TRUTH.md` only if needed to remove a newly discovered stale release-status claim;
- `docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md` only if needed to remove a newly discovered stale release-status claim;
- `docs/ops/CURRENT_TASK.md`.

PR #67 title/body may be read and only corrected if it has drifted back to stale status. Keep Draft/open/unmerged.

## Required handoff invariants

The final handoff must continue to preserve:
- accepted executable/source-test SHA `f03e32c4...`;
- accepted TEST API Worker `761a01bb-8cca-47ad-afde-87c0ba85c01d`;
- expected migration metadata already accepted;
- v9/v10 evidence IDs;
- Story -> Extract -> Commit authority boundaries;
- exact-four committed choice/history authority;
- six-raw + older-summary continuity;
- CSA activation-time/non-retroactivity/isolation;
- compact-clothing gap: one legitimate supported attempt, no Story/Extract completion evidence, neither positive PASS nor demonstrated persistence failure;
- owner-only merge/Ready/main/Production decisions;
- `HANDOFF_READY_OWNER_DECISION` unless fresh verification proves a different one of the original four landing classifications.

## Validation

- `git diff --check` PASS.
- Repository changes limited to authorized docs paths.
- No source/test/runtime/content/config/script/migration/package/workflow file changes.
- Fresh compare accepted executable -> FINAL must still prove docs-only descendants.
- PR #67 remains OPEN / DRAFT / UNMERGED / mergeable.
- Final HEAD CI SUCCESS; if pending at terminal time, report pending honestly.
- No gameplay/game-ID access, DB writes, migration application, API/frontend deploy, provider/model/config change, retry/regeneration, merge, Ready, rebase, squash, force-push, or main push.

## Landing / terminal protocol

1. Make the minimal docs-only correction.
2. Finish this file as `Status: WAITING_REVIEW` in the final docs-only commit.
3. Normal fast-forward push only.
4. Post exactly one immutable Issue #68 terminal and STOP. Do not generate the next task.

Terminal must include:
- START and FINAL SHA;
- final CURRENT_TASK blob;
- exact changed repository paths;
- accepted executable -> FINAL compare result including `ahead_by/total_commits` and changed-path set;
- PR #67 frozen base/head/state/mergeability/metadata snapshot;
- confirmation the false/exhaustive six-descendant wording was removed or correctly relabeled;
- PR title/body status;
- CI status;
- exact compact-clothing gap wording retained;
- final landing classification using the original four-value set;
- zero forbidden-operation counts;
- owner-only next decisions.

Then STOP.
