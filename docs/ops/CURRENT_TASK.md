# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-final-release-handoff-metadata-correction-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous task:
- Task: `minimal-story-runtime-final-release-handoff-v1`
- STARTED: Issue #68 comment `5311312909` (`IC_kwDOTfvo8c8AAAABPJQ0DQ`)
- Terminal/Trigger: Issue #68 comment `5311366310` (`IC_kwDOTfvo8c8AAAABPJUEpg`) — `EXECUTION: COMPLETE`
- Previous START SHA: `1bb73802dfa0e0dc577af2cb168ed803d013df6a`
- Previous FINAL SHA: `09919ca2a13dcc1e026a9d323999dcd00dcdad85`
- Previous final CURRENT_TASK blob: `dcd6b452aa59b05389de206c4eb0c6c04535af67`
- Previous handoff doc blob: `99eee9ffae589699f946c368153b58817756e6ce`
- Accepted executable/source-test SHA: `f03e32c4194c114d702c43df1f6122c17c4ca7c1`
- Accepted TEST API Worker: `761a01bb-8cca-47ad-afde-87c0ba85c01d` (version 173)
- Accepted source CI: `31986414926` = SUCCESS.
- v10 final-docs CI: `31989482449` = SUCCESS.
- previous final handoff docs CI: `31990584300` = SUCCESS.

## Operator review of previous terminal

Classification: `CHANGES_REQUIRED_HANDOFF_METADATA_RECONCILIATION`.

The prior final-handoff task is accepted for executable/live scope:
- no executable drift exists after accepted source `f03e32c4...`;
- previous task changed only the four authorized documentation paths;
- accepted TEST Worker and migration metadata were read-only verified;
- source/v10/final-docs CI runs are SUCCESS;
- no gameplay/game-row access, DB write, migration application, deployment, source/test/runtime/config/content/script change, merge or Ready transition occurred;
- v9/v10 release-candidate evidence remains accepted for handoff, with the one explicit compact-clothing positive-path non-reach preserved as neither PASS nor demonstrated persistence failure.

Two owner-facing metadata issues require correction before the handoff can be treated as factually final:

1. **PR commit-count overclaim.**
   - Terminal `5311366310` and `docs/ops/COMPANY_V1_RELEASE_CANDIDATE_HANDOFF_2026-08-17.md` call `250` the exact paginated PR commit count.
   - Fresh GitHub PR metadata at head `09919ca2...` reports `commits: 418`, `changed_files: 243`, additions `18857`, deletions `13047`.
   - The PR commit-list REST surface can cap/enumerate only the first 250 entries for very large PRs; reaching 250 entries is therefore not proof that the total is exactly 250.
   - Do not preserve or rationalize the false `exact 250` claim. Use the authoritative PR metadata field for a frozen PR snapshot, or explicitly label any list enumeration as capped/incomplete.

2. **Stale current-status prose.**
   - Before this operator review, the PR body still described `minimal-story-runtime-authority-audit-v1` as the current task even though the release-candidate handoff was complete.
   - Operator has already replaced the PR title/body metadata with current release-candidate wording while preserving Draft/open/unmerged state. Re-read and verify that metadata; do not revert it to historical status prose.
   - `CURRENT_TRUTH.md` and the dated release-candidate supersession in `09_CURRENT_TRUTH.md` use the prior audit START `1bb73802...` as a “current/docs-only branch head”. After handoff commits this is no longer the literal current head. Rewrite this as a clearly dated audit snapshot or update to the frozen current head; avoid documentation that becomes false merely because another docs-only registration commit advances HEAD.

This is a documentation/metadata truth correction only. It does not reopen product acceptance, runtime architecture, deployment, DB, choice, Mina handoff, memory, CSA, or clothing implementation work.

## Objective

Produce a factually precise final owner handoff by correcting only release/landing metadata.

Required result:
- the handoff document no longer claims an exact total of 250 commits;
- PR #67 current metadata is represented using a source that can establish the total count, with the observation timestamp/head SHA stated;
- PR title/body reflect current release-candidate/owner-decision status and contain no false “current task” statement;
- current-truth release sections distinguish immutable accepted executable identity from moving docs-only branch-head snapshots;
- the landing classification remains one of the original four final-handoff classifications and is changed only if fresh facts warrant it.

If fresh verification finds no live/executable/structural blocker beyond the metadata mistakes, retain `HANDOFF_READY_OWNER_DECISION` after correction. Do not invent a new landing classification inside the handoff document.

## Mandatory fresh verification

1. Fetch origin and freeze exact branch head as `START_SHA`.
2. Fresh-read this CURRENT_TASK, previous terminal `5311366310`, PR #67 metadata/body, final handoff document, `CURRENT_TRUTH.md`, and the dated current supersession section of `09_CURRENT_TRUTH.md`.
3. Verify PR #67 is OPEN / DRAFT / UNMERGED and head equals START.
4. Verify accepted executable `f03e32c4194c114d702c43df1f6122c17c4ca7c1` remains an ancestor and that every change after it through START is documentation/metadata only. Any executable drift is a blocker; do not repair it here.
5. Verify accepted source CI `31986414926`, v10 final-docs CI `31989482449`, and previous handoff final CI `31990584300` remain SUCCESS.
6. No live Worker/DB revalidation is required unless metadata has actually drifted since terminal `5311366310`. If a read-only deployment/migration metadata check is necessary to resolve a contradiction, it is allowed; game-row access is never allowed.

## Commit-count correction rule

For PR #67:
- Freeze the PR head and retrieve the PR metadata snapshot.
- Treat GitHub's PR metadata `commits` field as the total commit count for that snapshot.
- Do not infer total count from a commit-list response that stops at 250 entries.
- If the connector/API itself reports conflicting counts, document the conflict and avoid the adjective `exact` rather than choosing a convenient number.
- Preserve changed-file/addition/deletion counts only when they come from the same frozen PR metadata snapshot.
- Explain in the handoff why the previous `250` statement was corrected so a future operator does not reintroduce it.

## Authorized edits

Repository edits are limited to:
- `docs/ops/COMPANY_V1_RELEASE_CANDIDATE_HANDOFF_2026-08-17.md`;
- `CURRENT_TRUTH.md` only if its release-candidate status section needs snapshot wording corrected;
- `docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md` only if its dated release-candidate supersession needs snapshot wording corrected;
- `docs/ops/CURRENT_TASK.md`.

PR #67 title/body metadata may be inspected and corrected if still stale. Keep the PR Draft/open/unmerged.

Do not rewrite historical audit evidence sections merely because their historical branch/PR identities are old. Correct only prose that presents an old snapshot as current truth.

## Handoff document correction

`docs/ops/COMPANY_V1_RELEASE_CANDIDATE_HANDOFF_2026-08-17.md` must continue to preserve:
- accepted executable/source-test SHA `f03e32c4...`;
- accepted TEST API Worker `761a01bb-8cca-47ad-afde-87c0ba85c01d`;
- expected migration metadata;
- v9/v10 evidence IDs;
- canonical Story → Extract → Commit authority boundaries;
- exact-four committed choice/history authority;
- six-raw + older-summary continuity;
- CSA activation-time/non-retroactivity/isolation;
- exact compact-clothing gap wording;
- owner-only merge/Ready/main/Production decisions.

Correct only false/stale owner-facing metadata. In particular:
- replace `250 commits` with the freshly verified PR metadata count for the frozen snapshot, or with a non-exact statement if the available authoritative surfaces conflict;
- keep the changed-file/additions/deletions snapshot internally consistent;
- distinguish `accepted executable SHA` from `current docs-only PR head`;
- keep landing classification `HANDOFF_READY_OWNER_DECISION` only if no new blocker is found.

## Validation

- `git diff --check` must pass.
- Changed repository files must be a subset of the authorized documentation paths above.
- No source/test/runtime/content/config/script/migration/package/workflow file may change.
- Fresh PR readback must remain OPEN / DRAFT / UNMERGED / mergeable.
- Final HEAD CI should complete SUCCESS; if still pending at terminal time, report it as pending rather than falsely claiming success.
- No gameplay/game-ID access, DB write, migration application, API/frontend deployment, provider/model/config change, retry/regeneration, merge, Ready, rebase, squash, force-push or main push.

## Landing / terminal protocol

1. Make the minimal coherent docs-only correction commit(s).
2. Finish this file as `Status: WAITING_REVIEW` in the final docs-only commit.
3. Normal fast-forward push only.
4. Post exactly one immutable Issue #68 terminal and STOP. Do not generate the next task.

Terminal must report:
- START and FINAL SHA;
- final CURRENT_TASK blob;
- exact changed repository paths;
- PR #67 frozen base/head/state/mergeability snapshot;
- PR metadata total commit count and why prior 250 was wrong/capped;
- changed-files/additions/deletions from the same snapshot;
- PR title/body reconciliation status;
- accepted executable lineage / executable-drift proof;
- CI status;
- handoff/current-truth files corrected and their blobs where applicable;
- exact clothing non-blocking gap wording retained;
- final landing classification using the original four-value classification set;
- zero forbidden-operation counts;
- owner-only next decisions.

Then STOP.

## Execution result - 2026-08-17

Metadata correction completed from START `5614ffe40f7308179e9c0f2413892be73ffc056c`. The handoff now uses the authoritative PR metadata total for the frozen snapshot and explains why the prior 250-entry REST enumeration was capped/incomplete; current-truth release prose now labels branch heads as dated docs-only snapshots. PR title/body were freshly verified as current release-candidate/owner-decision metadata. The accepted executable lineage remains unchanged and the landing classification remains `HANDOFF_READY_OWNER_DECISION`. Final SHA, blobs, CI, and final PR metadata are reported in the terminal Issue #68 comment.
