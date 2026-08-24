# Company — CURRENT TASK

Status: READY
Task ID: company-r3-test-schema-target-convergence-v1
Mode: CURRENT-R3 TEST SCHEMA TARGET AUDIT / SAFE ADDITIVE BRIDGE / NO MIGRATION-HISTORY REPAIR
Updated: 2026-08-24 22:00 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `d6ff6995b788ed7fff22e601618a59c85a29a0d8`
Accepted blocker review: Issue #68 comment `5395590824`
Blocked lineage terminal: Issue #68 comment `5395511287`
Earlier staged-repair blocker: Issue #68 comment `5395267488`
Owner-accepted canon: current main `docs/redesign/COMPANY_CANON.md`
Historical safe precedent only: Issue #68 additive-schema audit terminal `5317875505`, operator review `5317921790`, blocked apply `5317989486` / review `5318048332`
Staged product convergence to resume only after operator review: `company-r3-canon-convergence-staged-repair-v3`

## Reuse / authority law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Overwrite it in place for lifecycle state.
- Do NOT create a new CURRENT_TASK file.
- Do NOT create an ops branch or any other branch.
- Read before work, in order:
  1. `AGENTS.md`
  2. `CURRENT_TRUTH.md`
  3. `docs/redesign/COMPANY_CANON.md`
  4. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
  5. `docs/redesign/MEDIA_CATALOG_CONTRACT.md`
  6. current R3 migration files listed below
  7. Issue #68 terminal `5395511287`
  8. Issue #68 operator review `5395590824`
  9. this CURRENT_TASK
- Current owner canon and current main R3 source outrank historical v1/v2 bridge artifacts.
- The old `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE.sql` from historical branch evidence is precedent only. Do NOT reuse its SQL.
- Preserve A′ / R3 architecture. This task is TEST schema convergence only, not product redesign.

Target success terminal:
`R3_TEST_SCHEMA_TARGET_CONVERGED_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`R3_TEST_SCHEMA_TARGET_CONVERGENCE_BLOCKED_AWAITING_OPERATOR_REVIEW`

Never claim OWNER_READY. Do not deploy Workers or resume browser acceptance inside this task.

---

# 0. Why this task exists

Global TEST migration history is historically inconsistent with current repository filenames. Two lineage tasks correctly refused `supabase migration repair`; the latest fresh read found 36 applied ledger rows and many remote/local historical rows whose exact filename lineage remains ambiguous.

That ambiguity must NOT continue to block current R3 product work indefinitely.

Historical Issue #68 work already established the safe repository precedent: do not rewrite migration history; instead compare actual TEST schema objects to the current target contract and, when the delta is fully proven additive/non-destructive, apply the smallest TEST-only schema bridge without inserting/updating migration-history rows.

This task repeats that method FRESHLY for **current Company R3 only**. It must not attempt to reconcile all v1/v2 migration filenames.

---

# 1. Current R3 target source

Compute the final desired TEST schema by reading the current-main R3 migrations in chronological order, including at minimum:

1. `supabase/migrations/20260821000100_company_r3_milestone0.sql`
2. `supabase/migrations/20260821000200_company_r3_csa_mvp.sql`
3. `supabase/migrations/20260822000100_company_r3_failed_retry_stage_leases.sql`
4. `supabase/migrations/20260822000200_company_r3_opening_revision_fence.sql`
5. `supabase/migrations/20260822000300_company_r3_feedback_revision.sql`
6. `supabase/migrations/20260823000100_company_r3_same_game_reset.sql`

Include any later current-main migration that actually mutates `company_r3_*` objects if one exists at task start.

The target is the **final composed object state**, not the fact that a particular migration filename exists in the remote ledger.

Do not modify those historical/current migration files in this task.

---

# 2. Hard prohibitions

This task MUST NOT:

- run `supabase migration repair`;
- insert/update/delete `supabase_migrations.schema_migrations` or any migration-history table;
- run `supabase db push` (dry-run or non-dry-run is unnecessary for this task);
- replay every historical v1/v2 migration;
- rename/delete/rewrite any `supabase/migrations/*.sql` file;
- apply the old historical Company-v1 bridge SQL;
- fabricate target SQL from prose or filename similarity;
- deploy API/frontend Workers;
- create/reset/play/mutate TEST games;
- mutate preserved evidence game rows as part of schema installation;
- access Production;
- change runtime/frontend/content/provider/model/config/secrets;
- add a new semantic engine, compatibility layer, retry, or parser;
- create a new branch/task file/PR.

No provider/model/config changes.

---

# 3. Fresh live TEST schema audit

TEST project: `fmcrspgxstsmxxsmkeee`.

Use read-only catalog queries first. Do not infer from the migration ledger alone.

Inventory every R3 target object relevant to current main, including:

- `company_r3_games`
- `company_r3_state`
- `company_r3_turn_jobs`
- `company_r3_turns`
- `company_r3_system_events`
- `company_r3_turn_revision_history`
- `company_r3_feedback_attempts`
- all columns/defaults/nullability/checks/FKs/PKs/unique constraints required by current R3 source;
- all current `company_r3_*` RPC/function signatures and `pg_get_functiondef` bodies;
- execute/table grants and revokes relevant to service_role/public/anon/authenticated;
- indexes/constraints that current R3 source relies on;
- current row counts for R3 tables only, so an apparently additive ALTER can be classified for evidence/data impact.

Also read the TEST migration ledger only as corroborating evidence. Do not mutate it.

Capture a stable pre-apply schema fingerprint over the target R3 catalog/definitions so post-apply comparison is reproducible.

---

# 4. Required object-by-object classification

For every final target R3 object/attribute classify exactly one:

- `ALREADY_EQUIVALENT` — live TEST is already equivalent to current-main final R3 target;
- `SAFE_ADDITIVE_CREATE_OR_REPLACE` — missing/different target can be reached without deleting/reinterpreting committed gameplay data or migration history;
- `SAFE_ACL_ONLY` — only grant/revoke convergence is required;
- `MISSING_PREREQUISITE` — a required object/dependency is absent and cannot safely be created within this bounded bridge;
- `DATA_OR_EVIDENCE_REWRITE_REQUIRED` — reaching target would update/delete/rewrite existing R3 gameplay/evidence rows;
- `DESTRUCTIVE_OBJECT_CHANGE_REQUIRED` — target requires dropping data-bearing table/column/constraint in a way that risks existing evidence or current callers;
- `AMBIGUOUS` — target/live equivalence cannot be proven.

Do not treat comments, whitespace or function input parameter names as semantic differences when PostgreSQL identity/caller behavior proves equivalence. Conversely, do not treat function body differences as equivalent merely because signatures match.

## Mandatory safety rule for existing rows

Current failed/audit games are preserved evidence. Schema installation itself must not rewrite their gameplay rows.

Examples:
- a `CREATE OR REPLACE FUNCTION` is normally eligible for safe classification;
- creating a genuinely missing side table with no rewrite of existing rows may be eligible;
- adding a column may be eligible only when its installation semantics do not rewrite/reinterpret preserved rows and the final runtime contract is still correct;
- a required blanket `UPDATE company_r3_turn_jobs ...` backfill on preserved rows is `DATA_OR_EVIDENCE_REWRITE_REQUIRED` and must STOP this task unless read-only evidence proves the live schema already has the needed state and no backfill is required;
- `DROP TABLE`, data-bearing `DROP COLUMN`, or destructive reset of rows is not permitted.

If ANY required target remains `MISSING_PREREQUISITE`, `DATA_OR_EVIDENCE_REWRITE_REQUIRED`, `DESTRUCTIVE_OBJECT_CHANGE_REQUIRED`, or `AMBIGUOUS`, do not apply anything. STOP BLOCKED with the exact first unsafe boundary and full classification summary.

---

# 5. Build the smallest current-R3 bridge only if fully safe

Proceed only if the COMPLETE final R3 delta consists solely of:

- `ALREADY_EQUIVALENT`;
- `SAFE_ADDITIVE_CREATE_OR_REPLACE`;
- `SAFE_ACL_ONLY`.

Build the bridge from the exact current-main R3 SQL definitions, preserving final chronological supersession. Do not copy obsolete earlier function bodies when a later R3 migration supersedes them.

The bridge may exist only as an ephemeral `.tmp/` or OS temp artifact for this task; do not add another canonical SQL/migration source file. Record its SHA-256 in the terminal.

Installation SQL itself must contain **no gameplay-row INSERT/UPDATE/DELETE**, other than DML text inside a function body that is merely being defined and is not invoked during installation.

Do not add a migration-ledger row for the bridge.

---

# 6. Atomic TEST-only execution channel

Historical evidence shows `supabase db query --file` rejects multiple top-level commands through its prepared-statement path. Do not repeat that failed multi-command method.

If a bridge is required, package the entire safe bridge as **one PostgreSQL statement** compatible with that execution path, for example one `DO $bridge$ ... $bridge$` block using deterministic dynamic DDL, or another provably single-statement mechanism.

Requirements before mutation:

1. prove the artifact parses as one top-level SQL statement;
2. prove it contains exactly the classified bridge operations and nothing else;
3. re-read live R3 schema fingerprint immediately before execution and require it to equal the audited pre-apply fingerprint;
4. confirm TEST project identity exactly;
5. confirm migration-history write count remains 0;
6. confirm no R3 game mutation command is present in installation SQL.

Then execute the bridge **once** against TEST.

No speculative retry. If submission outcome is ambiguous, STOP and verify read-only state before any further action; do not submit a second time merely to get green.

A single PostgreSQL statement is atomic. If the available client cannot execute the proven single statement, STOP BLOCKED before mutation.

---

# 7. Post-apply verification

After a successful bridge execution, use read-only catalog checks only.

Prove:

- every current-main final R3 target object is now `ALREADY_EQUIVALENT`;
- required R3 function signatures/bodies match final current-main target semantics;
- table columns/constraints/ACLs match the safe target scope;
- preserved R3 table row counts are unchanged by bridge installation except metadata that PostgreSQL itself necessarily changes for schema definitions; gameplay rows themselves were not updated/deleted/inserted;
- migration ledger row count/content is unchanged from pre-apply snapshot;
- no v1/v2 object was unintentionally changed;
- no Production access occurred.

Do NOT create/play/reset a game in this task. Browser acceptance belongs to the staged convergence continuation after operator review.

If the live schema is already fully equivalent at preflight, make zero DB writes and classify success as `NO_BRIDGE_REQUIRED`.

---

# 8. Repository/lifecycle policy

Permitted repository change in this task:

- this existing `docs/ops/CURRENT_TASK.md` lifecycle state only.

Do not commit temp bridge artifacts.
Do not edit migration source.
Do not create a branch.

At terminal, overwrite this same CURRENT_TASK to `Status: WAITING_REVIEW` if runner convention requires it, and normally fast-forward main only for that docs lifecycle change.

---

# 9. Required terminal report

Post one Issue #68 terminal containing:

- START/FINAL main SHA;
- current canon SHA read;
- TEST project identity;
- pre/post R3 schema fingerprints;
- migration ledger pre/post count/fingerprint and confirmation history mutations = 0;
- complete R3 object classification counts and all non-equivalent objects;
- whether result was `NO_BRIDGE_REQUIRED` or `BRIDGE_APPLIED`;
- bridge SHA-256 if used;
- exact single-statement execution mechanism if used;
- DB schema write count;
- gameplay-row mutation count = 0;
- migration apply/db-push/repair count = 0;
- deploy count = 0;
- game creation/reset/turn count = 0;
- Production access = 0;
- changed repository paths;
- any unsafe/ambiguous object if blocked.

Success terminal:
`R3_TEST_SCHEMA_TARGET_CONVERGED_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`R3_TEST_SCHEMA_TARGET_CONVERGENCE_BLOCKED_AWAITING_OPERATOR_REVIEW`

STOP after terminal. Do not automatically restart `company-r3-canon-convergence-staged-repair-v3`; operator review will register the continuation.