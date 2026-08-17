# Company v1 — CURRENT TASK

Status: READY
Task ID: test-migration-lineage-forensics-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority for a **read-only migration-lineage forensic task** after the accepted overnight Cut 1/Cut 2 blocker.

## 0. Why this task exists

The previous task `overnight-cut2-live-quality-loop-v1` correctly stopped at terminal:

`BLOCKED_OWNER_ARCHITECTURE_OR_PRODUCTION_DECISION`

Terminal evidence: Issue #68 comment `5317473958` (`IC_kwDOTfvo8c8AAAABPPI2pg`).

Accepted landed state before this task:
- main: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Cut 1 PR #70: merged, main merge `cfcd328a00b3caa9d87034e6ab7ca60c6ace51ce`, main CI `32043074446` SUCCESS
- Cut 2 PR #71: merged, merge `f91f2579947befacb10a45abde2599a92faf3276`, PR CI `32043791667` SUCCESS, landed-main CI `32043850713` SUCCESS
- docs-only PR #72: merged, merge `8f3c5326e483650211fbc6c9f54a7527d2278d4e`, final-main CI `32044041912` SUCCESS
- full local regression before blocker: `316/316`, zero failures
- no TEST migration applied after blocker detection
- no Worker deploy attempted after blocker detection
- no disposable live-test game created
- no live TEST turns run
- Production untouched

The blocker is migration-history lineage only: TEST Supabase contains applied migration versions that are absent as filenames from the current checkout, causing `supabase db push --dry-run` to stop with `LegacyDbPushMissingLocalError` before any write.

## 1. Objective

Reconstruct the migration lineage **without changing any database history or schema**.

For every remote-only applied migration version listed below, determine whether it is:
1. an earlier timestamp/name of a migration whose SQL/content later exists under a normalized/renamed local filename;
2. a historical migration whose exact SQL can be recovered from Git history / merged PR history / immutable Issue evidence;
3. a genuinely remote-only migration with no provable repository source;
4. an applied migration that was later superseded by an additive migration but whose original file was deleted/renamed;
5. otherwise ambiguous.

Remote-only versions from the blocker:
- `20260803043354`
- `20260803043423`
- `20260803043444`
- `20260803043638`
- `20260803124757`
- `20260803215756`
- `20260804102357`
- `20260810022340`
- `20260810022427`
- `20260810024638`
- `20260810091948`
- `20260810095457`
- `20260810095904`
- `20260812071904`
- `20260814023308`
- `20260814051254`
- `20260814091536`
- `20260814093123`
- `20260816011104`
- `20260816013408`
- `20260816021437`

Known clue that must be verified, not assumed:
- remote applied `20260804102357_company_v1_history_structured_action` appears historically related to current `20260804000100_company_v1_history_structured_action.sql`.

## 2. Mandatory fresh freeze

Before investigation:
1. fetch remote refs;
2. require `main` is still exactly `8f3c5326e483650211fbc6c9f54a7527d2278d4e`;
3. require this branch descends directly from that main plus this CURRENT_TASK registration only;
4. fresh-read Issue #68 terminal `5317473958`;
5. fresh-list current `supabase/migrations/**` filenames and hashes;
6. fresh-read TEST migration history using the same established TEST project identity `fmcrspgxstsmxxsmkeee` **read-only**;
7. confirm Production project/credentials/routes are not used.

If main or the blocker evidence materially changed, STOP and report drift.

## 3. Allowed evidence sources

Use all available read-only evidence needed to reconstruct provenance:
- `git log --all --full-history -- supabase/migrations`;
- deleted/renamed file history and parent commits;
- merge commits and PR history;
- GitHub Issue #68 immutable comments;
- repository docs that recorded migration application;
- current migration file content/hashes;
- Supabase migration list/history/status commands that are demonstrably read-only;
- read-only schema/function introspection only when needed to distinguish two candidate migrations.

Prefer exact file/content/hash proof over filename similarity.

## 4. Required reconciliation table

Produce `docs/ops/TEST_MIGRATION_LINEAGE_RECONCILIATION.md` containing one row for **every one of the 21 remote-only versions** with at least:
- remote applied version;
- remote migration name if available;
- original repository path/name if recoverable;
- original commit/PR/evidence ID;
- current canonical/renamed local migration candidate, if any;
- content relationship: exact / semantically same with documented rename-only delta / superseded / unique / unknown;
- confidence: PROVEN / PARTIAL / UNKNOWN;
- evidence references;
- safest remediation implication.

Also inventory the inverse side: local migration versions absent from remote, especially any current files that appear to be renamed copies of already-applied remote versions. This is required so a future fix cannot accidentally reapply equivalent SQL.

## 5. Critical safety rules

This task is **forensics only**.

Absolutely forbidden:
- `supabase migration repair` in any form;
- any command that mutates `supabase_migrations.schema_migrations`;
- `supabase db push` without `--dry-run`;
- applying any migration;
- SQL DDL/DML writes;
- altering remote migration history/status;
- renaming/deleting/replacing existing historical migration files in this task;
- adding legacy timestamp SQL files intended to satisfy the CLI in this task;
- Worker deployment;
- creating/resetting/mutating TEST games;
- provider/live gameplay calls;
- Production access/change;
- modifying runtime/source/content/test/package/workflow files.

A `supabase db push --dry-run` may be rerun **only after** the read-only lineage inventory is complete, strictly to capture the unchanged blocker/output. It is not required if the same error is already sufficiently evidenced.

Do not infer safety from a successful dry-run alone.

## 6. Decision analysis required

At the end, determine which of these is supported by evidence, but **do not execute the remediation**:

### A. `LOCAL_HISTORY_RESTORATION_POSSIBLE`
Every remote-only migration has exact recoverable historical provenance, and a repository-only restoration strategy can be described without rewriting remote history. The strategy must explicitly prove it would not cause current renamed/canonical migrations to be replayed as pending duplicates.

### B. `REMOTE_HISTORY_REPAIR_REQUIRED_BUT_PROVABLE`
Exact old→new mapping is proven, but Supabase CLI reconciliation would still require migration-history repair/marking. List the exact versions/status transitions that would be required and why, but do not run them.

### C. `ADDITIVE_BRIDGE_MIGRATION_POSSIBLE`
Remote history need not be rewritten and a new additive migration can safely bridge current schema to desired Cut 1/Cut 2 schema. This classification is valid only if the CLI/history mismatch itself can also be handled without hidden repair or duplicate replay.

### D. `LINEAGE_REMAINS_AMBIGUOUS`
One or more remote-only versions cannot be tied to exact repository/schema evidence strongly enough to choose a safe remediation.

Multiple technical facts may be true, but the terminal must name one recommended next path and explain why it is safer than alternatives.

## 7. Validation

Before terminal:
- `git diff --check` PASS;
- only `docs/ops/CURRENT_TASK.md` and `docs/ops/TEST_MIGRATION_LINEAGE_RECONCILIATION.md` may change;
- no DB/schema/history writes occurred;
- no Worker deploy occurred;
- no TEST fixture/game mutation occurred;
- no Production access occurred;
- no runtime/source/content/test/package/workflow change occurred.

No `npm test` or GitHub CI is required for a pure docs-only forensic report, but if the branch receives any unexpected non-doc delta, STOP as scope violation rather than validating it into acceptance.

## 8. Terminal

When the forensic report is complete:
1. set this CURRENT_TASK to `Status: WAITING_REVIEW`;
2. commit/push the reconciliation document and lifecycle update normally on `company/test-migration-lineage-forensics-v1`;
3. post exactly one immutable terminal report to Issue #68;
4. include:
   - registration SHA/blob and final SHA/blob;
   - exact main SHA;
   - count of remote-only versions classified PROVEN/PARTIAL/UNKNOWN;
   - exact old→new mappings discovered;
   - inverse local-only migration inventory;
   - recommended classification A/B/C/D;
   - exact next remediation proposal, **not executed**;
   - DB/history/schema write count = 0;
   - deploy count = 0;
   - TEST game mutation/live-turn count = 0;
   - Production access count = 0;
5. STOP for operator review.

Do not self-authorize migration-history repair from this task.