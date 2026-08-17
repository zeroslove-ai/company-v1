# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-owner-landing-strategy-preflight-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`.
PR #67 must remain OPEN / DRAFT / UNMERGED for this task.

Previous task:
- Task: `minimal-story-runtime-final-release-handoff-descendant-inventory-closure-v1`
- Trigger/CURRENT_TASK_READY: Issue #68 comment `5311485236` (`IC_kwDOTfvo8c8AAAABPJbVNA`)
- STARTED: Issue #68 comment `5311505922`
- Terminal: Issue #68 comment `5311520756` (`IC_kwDOTfvo8c8AAAABPJdf9A`) — `EXECUTION: COMPLETE`
- Previous START SHA: `345f047903bc5a50304dc18b68a8959307a41f11`
- Previous FINAL SHA: `2d1d6e56dbe9ae71f9c6a4c363caee05f24ac0f7`
- Previous final CURRENT_TASK blob: `56cb893de2ebea8479b654917e0cf13682a2e2e5`
- Accepted executable/source-test SHA: `f03e32c4194c114d702c43df1f6122c17c4ca7c1`
- Accepted TEST API Worker: `761a01bb-8cca-47ad-afde-87c0ba85c01d`
- Accepted source CI: `31986414926` = SUCCESS.
- Previous FINAL CI: `31992111972` = SUCCESS.
- Final release handoff: `docs/ops/COMPANY_V1_RELEASE_CANDIDATE_HANDOFF_2026-08-17.md`.

## Operator review of previous terminal

Classification: `ACCEPTED_FINAL_RELEASE_HANDOFF`.

Independent verification:
- supplied Trigger resolves exactly to Issue #68 comment `5311485236`;
- task STARTED at comment `5311505922` and terminal is comment `5311520756`;
- START `345f0479...` -> FINAL `2d1d6e56...` is exactly one fast-forward commit;
- START -> FINAL changes only `docs/ops/COMPANY_V1_RELEASE_CANDIDATE_HANDOFF_2026-08-17.md` and `docs/ops/CURRENT_TASK.md`;
- accepted executable `f03e32c4...` -> FINAL compare is `ahead_by=12`, `behind_by=0`, and the complete changed-path set is exactly `CURRENT_TRUTH.md`, `docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`, `docs/ops/COMPANY_V1_RELEASE_CANDIDATE_HANDOFF_2026-08-17.md`, and `docs/ops/CURRENT_TASK.md`; therefore there is zero executable drift after the accepted source;
- final handoff now explicitly labels the retained six-commit sequence as partial historical context and not an exhaustive descendant inventory;
- PR #67 at reviewed FINAL `2d1d6e56...` is OPEN / DRAFT / UNMERGED / mergeable, with authoritative frozen metadata `commits=422`, `changed_files=243`, `additions=18778`, `deletions=13047`;
- FINAL CI `31992111972` is SUCCESS;
- accepted TEST Worker/live migration facts, v9/v10 gameplay evidence, and the explicit compact-clothing positive-path non-reach remain unchanged;
- no gameplay/game-ID access, DB write, migration application, deployment, source/test/runtime/config/content/script/package/workflow change, merge, Ready, rebase, squash, force-push, or main push occurred.

The release handoff is now factually sufficient for an owner landing decision. This task must not reopen gameplay acceptance or implementation cleanup.

## Objective

Produce a bounded **owner landing-strategy preflight** for PR #67 without performing any owner-only action.

The task must answer one practical question from fresh Git/GitHub facts:

> Given the accepted executable/source evidence, current PR #67 ancestry/diff, current `main`, and any still-open overlapping Company PRs, what is the safest landing strategy for the owner to authorize next?

Evaluate these four possible recommendations and choose exactly one:

1. `LANDING_RECOMMEND_MERGE_COMMIT_AS_IS`
2. `LANDING_RECOMMEND_SQUASH_AS_IS`
3. `LANDING_RECOMMEND_RECONSTRUCT`
4. `LANDING_HOLD_BLOCKER`

This task is recommendation/preflight only. It must **not** merge, mark Ready, push to main, create a reconstructed landing branch, deploy, or touch game/DB state.

## Mandatory fresh preflight

1. Fetch current remote refs and freeze exact `START_SHA` for `company/scene-location-presence-v1`.
2. Freeze current `origin/main` SHA separately. Do not assume it remains `1e3a5255...`.
3. Fresh-read:
   - PR #67 metadata/title/body;
   - `docs/ops/COMPANY_V1_RELEASE_CANDIDATE_HANDOFF_2026-08-17.md`;
   - `CURRENT_TRUTH.md`;
   - relevant current section of `09_CURRENT_TRUTH.md`;
   - previous terminal `5311520756` and this CURRENT_TASK.
4. Verify accepted executable `f03e32c4194c114d702c43df1f6122c17c4ca7c1` remains an ancestor of START and every descendant remains documentation-only.
5. Verify accepted source CI `31986414926` and previous FINAL CI `31992111972` remain SUCCESS.
6. Verify PR #67 remains OPEN / DRAFT / UNMERGED / mergeable. If current main moved and GitHub mergeability changed, record that exact fact instead of assuming prior CLEAN state.
7. No Worker/DB/game-row revalidation is required unless Git/PR evidence contains a new contradiction to the accepted handoff. Never access a game row.

## Landing-strategy analysis

### A. Current main divergence

Record:
- frozen `origin/main` SHA;
- frozen PR head SHA;
- merge-base between current main and PR head;
- PR ahead/behind relationship against current main;
- whether current main contains commits not present in the historical PR base;
- whether GitHub reports merge conflict/dirty/blocked state.

Do not rebase or merge main into the branch.

### B. Accepted executable traceability

For each candidate strategy, evaluate how it affects the ability to trace the landed main tree back to accepted executable `f03e32c4...` and Issue #68 evidence.

Specifically assess:
- **merge commit as-is:** preserves PR history and exact accepted executable ancestry;
- **squash as-is:** may preserve final tree content but replaces commit ancestry; determine how this would affect evidence/source identity and post-landing deploy traceability;
- **reconstruct:** may produce a cleaner history but creates a new unreviewed commit lineage unless exact tree equivalence and review scope can be proven; do not create it in this task.

Do not choose based on commit-count aesthetics alone.

### C. PR tree/diff coherence

Freshly verify that PR #67's broad diff against current main is still the intended Company release candidate and is not missing or duplicating a dependency because of another open PR.

Inspect current open Company PRs that could plausibly overlap, especially historical PRs #65 and #66 if still open. For each relevant PR:
- record state/base/head;
- determine ancestry/tree/diff relationship to PR #67 using actual compare/merge-base evidence;
- classify it as `ANCESTOR/INCLUDED`, `OVERLAP_BUT_NOT_REQUIRED`, `DEPENDENCY`, `INDEPENDENT`, or `UNKNOWN`;
- do not close, edit, merge, or retarget it.

Do not infer dependency merely because an older PR has a related title.

### D. Merge-method recommendation

Choose exactly one of the four recommendation values.

Use these rules:

- Prefer `LANDING_RECOMMEND_MERGE_COMMIT_AS_IS` if PR #67 is coherent/mergeable, current main introduces no unresolved conflict, and preserving reviewed ancestry materially helps traceability.
- Choose `LANDING_RECOMMEND_SQUASH_AS_IS` only if fresh evidence proves squash preserves the intended final tree and the loss of reviewed commit ancestry is acceptable and explicitly manageable; explain how accepted-source evidence would be mapped after squash.
- Choose `LANDING_RECOMMEND_RECONSTRUCT` only if PR #67 history/diff structurally prevents safe landing as-is even though the desired final tree is known. Explain exactly what would need reconstruction, but do not create it.
- Choose `LANDING_HOLD_BLOCKER` if current main drift, conflict, missing dependency, CI/evidence drift, or another concrete fact prevents a safe recommendation.

The recommendation must be evidence-based and include the smallest next owner-authorized action.

## Production boundary

This task must not call Production, inspect Production game data, or deploy anything.

It may state the already accepted TEST facts, but it must explicitly distinguish:
- **landing recommendation** from
- **TEST-to-Production rollout authorization**.

A successful landing recommendation is not Production approval.

If the recommended landing method is eventually authorized, list the post-landing verification that should happen before any Production rollout, such as:
- exact landed main SHA/tree identity;
- CI at landed main;
- runtime/source equivalence to accepted executable where applicable;
- deployment artifact/version traceability;
- DB migration compatibility;
- a separate explicit Production rollout authority.

Do not perform those future steps.

## Repository changes authorized

Only `docs/ops/CURRENT_TASK.md` may change in the repository for this task.

Do not create another handoff document. The final decision packet belongs in the immutable Issue #68 terminal report.

PR metadata is read-only for this task. Do not edit title/body.

## Validation

- `git diff --check` PASS.
- START -> FINAL, if a final status commit is needed, must change only `docs/ops/CURRENT_TASK.md`.
- Accepted executable -> FINAL must continue to show only documentation descendants after `f03e32c4...`.
- PR #67 remains OPEN / DRAFT / UNMERGED.
- No source/test/runtime/content/config/script/migration/package/workflow changes.
- No gameplay/game-ID access.
- No DB writes/SQL/migration application/DDL.
- No API/frontend deployment.
- No provider/model/config/retry/regeneration change.
- No merge/Ready/rebase/squash/force-push/main push.
- Do not create or push a reconstructed landing branch.

## Landing / terminal protocol

1. Perform the read-only landing-strategy analysis.
2. Update this file to `Status: WAITING_REVIEW` with a concise execution result and the chosen recommendation.
3. Make at most one final docs-only commit touching only this file.
4. Normal fast-forward push only.
5. Post exactly one immutable terminal report to Issue #68 and STOP. Do not generate another task.

Terminal must include:
- START and FINAL SHA;
- final CURRENT_TASK blob;
- frozen current main SHA and PR head/base/merge-base;
- current PR state/mergeability/metadata;
- accepted executable ancestry and CI status;
- relevant open-PR ancestry/dependency findings;
- comparison of merge commit vs squash vs reconstruct;
- exactly one recommendation from the four-value set;
- smallest next owner-authorized action;
- explicit statement that no merge/Ready/main push/Production/deploy/game/DB operation occurred;
- post-landing verification checklist before any Production rollout.

Then STOP.

## Execution result

- START SHA: `4883811da4241f18d3fcf975e1b272c1adeead30`.
- Frozen `origin/main`: `1e3a5255e51a284e45baf551dcfd415360981927`.
- Frozen PR #67 head: `4883811da4241f18d3fcf975e1b272c1adeead30`; PR base: `1e3a5255e51a284e45baf551dcfd415360981927`; merge-base with current main: `1e3a5255e51a284e45baf551dcfd415360981927`.
- Current main equals the historical PR base, so it contains no newer commits absent from that base. PR #67 is `ahead_by=423`, `behind_by=0`; GitHub reports OPEN / DRAFT / UNMERGED, `mergeable=true`, `mergeStateStatus=CLEAN`.
- Accepted executable `f03e32c4194c114d702c43df1f6122c17c4ca7c1` remains an ancestor of START. Accepted source CI `31986414926` and previous final CI `31992111972` are SUCCESS. The accepted-source descendants remain documentation-only after the accepted executable.
- Open-PR inventory found only PR #67. PR #65 is CLOSED, base `main`, head `46f6d93ff9b4d9ec02b3242b0939dbe57c058150`; its head is an ancestor of PR #67 and compare is `ahead_by=291`, `behind_by=0`, so `ANCESTOR/INCLUDED`. PR #66 is CLOSED, base `company/runtime-authority-consolidation-v1` at `46f6d93ff9b4d9ec02b3242b0939dbe57c058150`, head `a9d9c95efd3b8433873a693e34ab14e8f733a3e5`; its head is an ancestor of PR #67 and compare is `ahead_by=288`, `behind_by=0`, so `ANCESTOR/INCLUDED`. Neither is a dependency or missing overlapping open PR.
- Strategy comparison: merge commit as-is preserves the reviewed PR ancestry, accepted executable traceability, and exact Issue #68 evidence while current main has no divergence or conflict; squash as-is could preserve the final tree but would discard the reviewed commit ancestry and require an explicit post-squash traceability mapping; reconstruct would be unnecessary and would create a new unreviewed lineage requiring exact tree-equivalence proof. Recommendation: `LANDING_RECOMMEND_MERGE_COMMIT_AS_IS`.
- Smallest next owner-authorized action: authorize the existing PR #67 Draft-to-Ready transition without changing its branch/tree; if the owner then approves landing, merge PR #67 using a merge commit. No such action was performed here.
- Before any separate TEST-to-Production rollout, verify the landed main SHA/tree, CI at landed main, source/runtime equivalence to the accepted executable where applicable, deployment artifact/version traceability, migration compatibility, and obtain explicit Production rollout authority.
- No merge/Ready/main push, reconstructed branch, Production/game access, DB write/SQL/DDL/migration application, deploy, runtime/source/test/config/content/script/package/workflow change, provider/model/config change, retry/regeneration, or gameplay loop occurred.
