# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: test-additive-schema-bridge-audit-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This task continues from the accepted forensic terminal `5317733211` for `test-migration-lineage-forensics-v2`.

The prior forensic proved that TEST migration history cannot safely be repaired yet: final stable TEST history has 27 applied rows, 22 remote-only rows, and 25 local-only rows, with provenance totals `PROVEN_EXACT=13`, `PARTIAL=8`, `UNKNOWN=1`. The accepted recommendation was `LINEAGE_REMAINS_AMBIGUOUS`.

This task must **not** repair migration history. Its sole purpose is to determine whether the current TEST schema can be converged to the exact landed-main runtime contract using one fresh additive bridge migration, applied later as a single explicit TEST-only migration, without replaying or rewriting historical migrations.

## 0. Frozen facts

- Repository: `zeroslove-ai/company-v1`
- Current `main` at registration: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Accepted forensic terminal SHA: `ee1180b8e173ea5b9683c7704cf2ec543975c747`
- Forensic terminal comment: `5317733211`
- Forensic report: `docs/ops/TEST_MIGRATION_LINEAGE_RECONCILIATION.md`
- TEST Supabase project: `fmcrspgxstsmxxsmkeee`
- Landed-main target migration source: `supabase/migrations/20260817000200_company_v1_gameplay_core_simplification.sql`
- `20260817000200` is not present in TEST migration history.

Independent operator read-only verification at registration showed that TEST still has the older semantic scene/setup DB behavior, including:
- `company_apply_opening_scene_v1` requiring `scene_goal` and `work_hook_id` and producing `scene_id`, `beat`, `goal`, and `focus_thread`;
- `company_validate_scene_v1` requiring the older extended scene shape;
- `reserve_company_player_setup` enforcing catalog/body ranges plus `work_hook_id` / `scene_goal` semantics.

The landed-main `20260817000200` source instead defines the minimal scene/literal setup contract and removes those stale work/scene semantic requirements.

## 1. Primary question

Answer exactly this:

> Can the current TEST schema be brought to the landed-main Company v1 gameplay-core schema contract with one new additive migration that does not depend on legacy migration-history repair, does not replay already-applied historical SQL, and does not mutate existing persisted gameplay rows except through future normal runtime calls?

Do not assume the answer is yes. Prove it from current TEST catalog/function/permission state and the landed-main source.

## 2. Read-only TEST schema audit

Fresh-read the current TEST database using read-only catalog queries only.

Inventory every database object touched or depended on by `20260817000200_company_v1_gameplay_core_simplification.sql`, including at minimum:
- `company_apply_opening_scene_v1(jsonb)`;
- `company_minimalize_save_v1(jsonb)`;
- `company_validate_scene_v1(...)` including exact current signature(s);
- `validate_company_save_v1(jsonb)`;
- `reserve_company_player_setup(uuid,uuid,jsonb,jsonb)`;
- all functions called transitively by those functions that must already exist for the target definitions to compile;
- current EXECUTE privileges / ACLs for the target functions;
- any table columns or types referenced by the target SQL.

For each target statement/object, classify current TEST state as exactly one:
- `ALREADY_TARGET_EQUIVALENT`;
- `SAFE_CREATE_OR_REPLACE_REQUIRED`;
- `SAFE_GRANT_REVOKE_REQUIRED`;
- `MISSING_PREREQUISITE`;
- `DESTRUCTIVE_OR_DATA_REWRITE_REQUIRED`;
- `AMBIGUOUS`.

Use `pg_get_functiondef`, `pg_get_function_identity_arguments`, ACL/catalog metadata, and direct schema metadata. Do not infer from migration names alone.

## 3. Target-contract audit

Read the exact landed-main `20260817000200_company_v1_gameplay_core_simplification.sql` and current runtime/source callers.

Prove:
1. which SQL statements are still required on TEST;
2. which statements are already satisfied by later-applied TEST migrations;
3. whether any target statement would accidentally restore removed legacy authority;
4. whether any object signature must be dropped rather than `CREATE OR REPLACE`d;
5. whether all dependencies compile in current TEST without replaying older migration files;
6. whether the target can be expressed without table rewrites, data backfill, save reset, or historical-row mutation.

The bridge must implement the **current landed-main contract**, not blindly copy an old migration if current source has moved beyond it.

## 4. Bridge design

If and only if all required target changes are proven additive/safe, create:

- `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_PLAN.md`
- `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE.sql`

The SQL file is a **review artifact only**, not an entry in `supabase/migrations/` yet.

Bridge SQL rules:
- smallest possible delta from current TEST schema to the current landed-main contract;
- prefer `CREATE OR REPLACE FUNCTION`, exact `REVOKE`, and exact `GRANT` only where required;
- preserve existing tables and persisted rows;
- no `UPDATE`, `DELETE`, `INSERT`, `TRUNCATE`, reset, backfill, or fixture mutation;
- no mutation of `supabase_migrations.schema_migrations`;
- no recreation of old timestamps;
- no semantic compatibility shadow layer;
- no restoration of `work_hook`, `scene_goal`, extended scene authority, old npc stat authority, or other superseded semantics;
- no provider/model/retry logic;
- no runtime/source/content/test/package/workflow changes.

The plan must specify an exact future application mechanism that avoids `supabase db push` scanning the ambiguous legacy filename set. It may recommend one explicit new TEST-only migration application using the reviewed bridge SQL, but this task must not execute it.

If a single clean bridge cannot be proven safe, do not create speculative SQL. Record the blocking object(s) and stop.

## 5. Verification before terminal

Required:
- Fresh-read TEST migration-history snapshot at start and terminal; existing rows must not be removed or rewritten.
- `git diff --check` PASS.
- Changed paths limited to:
  - `docs/ops/CURRENT_TASK.md`
  - `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_PLAN.md`
  - `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE.sql` only if bridge is proven possible.
- No `supabase/migrations/*.sql` file may change.
- No DB/schema/migration-history write may occur.
- No Worker deploy.
- No TEST game creation/reset/mutation or live provider turn.
- No Production access/change.

## 6. Terminal classification

Choose exactly one:

### `ADDITIVE_SCHEMA_BRIDGE_READY_FOR_REVIEW`
Use only if:
- every required target object is fully inventoried;
- no destructive/data rewrite is required;
- the exact bridge SQL is written;
- compile/dependency/ACL reasoning is complete from current catalog evidence;
- future application can be performed as one explicit new TEST-only migration without repairing old migration history first.

### `ADDITIVE_SCHEMA_BRIDGE_BLOCKED`
Use if any required object remains ambiguous, a destructive/history mutation is required, the target depends on unavailable prerequisites, or a safe single bridge cannot be proven.

## 7. Forbidden operations

Strictly forbidden in this task:
- `supabase migration repair`;
- mutation of `supabase_migrations.schema_migrations`;
- applying any migration;
- non-dry-run `supabase db push`;
- DDL/DML writes to TEST;
- creating or editing files under `supabase/migrations/`;
- Worker deploy;
- TEST fixture/game writes, resets, or live gameplay;
- Production access/change;
- runtime/source/content/test/package/workflow changes;
- starting Cut 3 or unrelated gameplay work.

## 8. Stop condition

At terminal:
1. set this task to `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal containing:
   - registration/final SHA and task blob;
   - start/final TEST migration snapshot count/hash;
   - object classification totals;
   - bridge classification;
   - bridge SQL digest if created;
   - exact future application mechanism recommendation;
   - DB/schema/history writes = 0;
   - migration applies = 0;
   - deploys = 0;
   - TEST gameplay mutations/live turns = 0;
   - Production access = 0;
3. STOP. Do not apply the bridge, deploy, or create the next task.

## Lifecycle — CODEX_WATCHER execution

- STARTED comment: `5317815900`
- Terminal classification: `ADDITIVE_SCHEMA_BRIDGE_READY_FOR_REVIEW`
- Start TEST migration snapshot: 27 rows, canonical SHA-256 `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`
- Final TEST migration snapshot: 27 rows, canonical SHA-256 `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`
- Target migration row `20260817000200`: absent at start and final.
- Object classifications: `SAFE_CREATE_OR_REPLACE_REQUIRED=5`, `ALREADY_TARGET_EQUIVALENT=3`, all other classifications `0`.
- Bridge SQL SHA-256: `6d0593b22d50c36a4c68c8c71407be7a25f03f8542ae73aee1083e9b102031f9`.
- Future mechanism: one separately authorized `supabase db query --db-url <encoded TEST URL> --file docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE.sql` invocation after exact-SHA and unchanged-snapshot preflight; never `supabase db push`.
- Safety counts: DB/schema/migration-history writes `0`; migration applies `0`; deploys `0`; TEST gameplay mutations/live turns `0`; Production access `0`.
- Changed paths are limited to `docs/ops/CURRENT_TASK.md`, `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_PLAN.md`, and review-only `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE.sql`; no `supabase/migrations/*.sql` path changed.
