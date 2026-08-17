# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: test-additive-schema-bridge-single-statement-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This task continues from terminal `5317989486` (`BLOCKED_TEST_SCHEMA_BRIDGE / BLOCKED_ATOMIC_EXECUTION_CHANNEL`). The reviewed TEST bridge itself remains accepted; the blocker was only that the available `supabase db query` prepared-statement channel rejects multiple top-level SQL commands, while `psql` is unavailable.

The bridge was **not submitted** in the blocked task. TEST schema/data/migration history/gameplay remained unchanged.

## 0. Frozen evidence

- Repository: `zeroslove-ai/company-v1`
- Current main at registration: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Previous apply-task registration: `ee3885546de4c48b5835f3c891d2cc2b5bc95751`
- Previous blocked final SHA: `d507c5353ea3ad819b98a3f8d021027b71594de9`
- Previous terminal: `5317989486`
- Previous blocker: `BLOCKED_ATOMIC_EXECUTION_CHANNEL`
- Accepted bridge-audit final SHA: `f319c149ae92cdc9755f71f522b34c575049ce9d`
- TEST project: `fmcrspgxstsmxxsmkeee`
- Accepted reviewed bridge: `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE.sql`
- Reviewed bridge blob: `cf3158db1960a52053a8b31fda1c4473ed05486d`
- Reviewed bridge SHA-256: `6d0593b22d50c36a4c68c8c71407be7a25f03f8542ae73aee1083e9b102031f9`
- Accepted migration snapshot: 27 rows, canonical SHA-256 `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`, target row `20260817000200` absent.

Blocked-task evidence proved:
- all exact-SHA, environment, migration-snapshot, and five-function preflight checks passed;
- `psql` was unavailable;
- `supabase db query` rejected harmless multi-command transaction probes because its prepared-statement path accepts only one top-level SQL command;
- exact bridge bytes were never submitted;
- DB/schema/history writes = 0; gameplay writes = 0; deploy = 0; Production access = 0.

## 1. Goal

Determine whether the already-reviewed bridge can be represented **without semantic change** as exactly one top-level PostgreSQL statement that the prepared-statement execution channel accepts and that preserves all-or-nothing PostgreSQL statement atomicity.

Preferred form:
- one `DO ...` statement;
- each original bridge DDL/ACL command executed inside that block through PL/pgSQL dynamic `EXECUTE`;
- no transaction-control statements inside the block;
- any error must escape the block, causing the single statement to fail rather than being swallowed;
- no exception handler may convert a failure into success.

This task is an **audit/wrapper-generation task only**. Do not apply the real bridge.

## 2. Mandatory start freeze

Before generating anything:

1. Require `origin/main == 8f3c5326e483650211fbc6c9f54a7527d2278d4e`.
2. Require branch ancestry to descend directly from blocked final `d507c5353ea3ad819b98a3f8d021027b71594de9` with only this CURRENT_TASK registration added before execution.
3. Re-read terminal `5317989486`, accepted terminal `5317875505`, the reviewed bridge, and bridge plan.
4. Recompute the reviewed bridge SHA-256 and require exactly `6d0593b22d50c36a4c68c8c71407be7a25f03f8542ae73aee1083e9b102031f9`.
5. Rerun the exact accepted migration snapshot and require 27 rows / hash `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc` / `20260817000200` absent.
6. Confirm TEST identity is `fmcrspgxstsmxxsmkeee`.

Any drift: STOP `SINGLE_STATEMENT_BRIDGE_BLOCKED` without mutation.

## 3. Exact wrapper construction

Create only if it can be proven mechanically equivalent:
- `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_SINGLE_STATEMENT.sql`
- `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_SINGLE_STATEMENT_AUDIT.md`

### 3.1 One top-level statement invariant

The generated SQL file must contain exactly one executable top-level PostgreSQL statement after comments/whitespace: one `DO` block.

It must not contain top-level `BEGIN`, `COMMIT`, `ROLLBACK`, a second `DO`, or any other second statement.

### 3.2 Mechanical payload equivalence

Do not rewrite the accepted bridge semantics by hand.

Inventory every executable top-level statement in `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE.sql` in original order. For each statement:

1. capture the exact reviewed SQL payload, allowing only removal of the outer statement terminator and mechanically necessary quoting/escaping for embedding as a dynamic SQL string;
2. embed that payload as one dynamic `EXECUTE` inside the `DO` block;
3. preserve statement order exactly;
4. preserve the accepted `p_require_scene` parameter-name adaptation exactly;
5. do not add/drop/reorder function definitions, ACL operations, security modes, volatility attributes, grants, revokes, or function bodies.

Write a local, non-committed verification script or equivalent deterministic check that unwraps/extracts all embedded dynamic payloads and compares them to the original reviewed executable statements after only the documented terminator/quoting normalization.

The audit report must give:
- original executable statement count;
- wrapped dynamic statement count;
- per-statement digest before/after unwrapping;
- overall ordered payload digest;
- proof that semantic payload count/order/content are identical.

If byte/mechanical equivalence cannot be proven, STOP rather than hand-wave equivalence.

## 4. Prepared-statement channel proof — no persistent mutation

Use only harmless single-statement probes against TEST to prove the available channel accepts a `DO` statement and propagates errors.

Authorized probes:
1. a success probe equivalent to `DO ... BEGIN PERFORM 1; END ...` as exactly one top-level statement;
2. a failure probe equivalent to `DO ... BEGIN PERFORM 1; RAISE EXCEPTION 'single_statement_atomic_probe'; END ...` as exactly one top-level statement.

Requirements:
- no CREATE/ALTER/DROP/INSERT/UPDATE/DELETE/TRUNCATE;
- no migration-history mutation;
- no persistent/temp schema object creation;
- no gameplay/save/fixture mutation;
- success probe must succeed;
- failure probe must return a non-success/error result and must not be retried to get a different outcome.

This proves channel compatibility/error propagation only. Do not submit the real wrapper in this task.

## 5. Atomicity reasoning

The audit must explicitly explain why the proposed execution is all-or-nothing:
- the client submits one top-level `DO` statement;
- inner DDL is executed synchronously inside that statement through dynamic `EXECUTE`;
- no inner exception is swallowed;
- an uncaught failure aborts the statement and its effects rather than leaving earlier inner commands committed independently;
- the wrapper contains no autonomous transaction mechanism and no transaction-control command.

If any chosen SQL construct can commit independently or swallow a failure, classification must be BLOCKED.

## 6. Repository and DB scope

Allowed repository changes only:
- `docs/ops/CURRENT_TASK.md`
- `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_SINGLE_STATEMENT.sql`
- `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_SINGLE_STATEMENT_AUDIT.md`

Do not modify the accepted bridge/plan, `supabase/migrations/*`, runtime/source/content/tests/package/workflows, or unrelated docs.

DB rules:
- real bridge application = forbidden;
- DDL/DML writes = forbidden;
- migration apply/db push/repair/history mutation = forbidden;
- pure success/failure DO probes from section 4 only;
- TEST gameplay/save/fixture mutation = forbidden;
- Worker deploy/live provider turn = forbidden;
- Production access/change = forbidden.

`git diff --check` must PASS.

## 7. Terminal classification

Choose exactly one.

### `SINGLE_STATEMENT_BRIDGE_READY_FOR_REVIEW`
Use only if:
- start freeze matches;
- wrapper is exactly one top-level statement;
- all original reviewed bridge statements are mechanically preserved in exact order and equivalence is proven;
- success DO probe succeeds;
- failure DO probe returns failure;
- atomicity/no-error-swallow reasoning is complete;
- migration snapshot is unchanged at terminal;
- persistent DB writes = 0.

### `SINGLE_STATEMENT_BRIDGE_BLOCKED`
Use for any ambiguity, drift, payload mismatch, channel rejection, or atomicity uncertainty.

At terminal:
1. set CURRENT_TASK to `WAITING_REVIEW`;
2. post one immutable Issue #68 terminal with registration/final SHA/blob, original/wrapped statement counts and digests, wrapper SHA-256 if generated, channel probe results, start/final migration snapshot, and zero-write safety counts;
3. STOP. Do not apply the wrapper, deploy, or create the next task.

## 8. CODEX_WATCHER execution lifecycle

- EXECUTION STARTED comment: 5318067222
- Terminal classification: SINGLE_STATEMENT_BRIDGE_READY_FOR_REVIEW
- Start freeze: origin/main 8f3c5326e483650211fbc6c9f54a7527d2278d4e; branch registration 4cffae459d6e86260dba66fc87a387c9b3d82ffa descended from d507c5353ea3ad819b98a3f8d021027b71594de9; working tree was clean before execution.
- TEST identity: SUPABASE_PROJECT_REF matched fmcrspgxstsmxxsmkeee.
- Reviewed bridge blob/SHA-256 matched cf3158db1960a52053a8b31fda1c4473ed05486d / 6d0593b22d50c36a4c68c8c71407be7a25f03f8542ae73aee1083e9b102031f9.
- Mechanical wrapper result: original 8, wrapped top-level 1, dynamic EXECUTE 8, all payloads equal in exact order; ordered payload SHA-256 54fde93e424e3a34b730a2c48eb09c828c783e03b14b0efa0e3e1b950452848b; wrapper SHA-256 8a5e438919d25fae4a618348c0b32473dcef1adc9f6baa10c09700cc886495f2.
- Per-statement payload SHA-256 values are recorded in TEST_ADDITIVE_SCHEMA_BRIDGE_SINGLE_STATEMENT_AUDIT.md and matched before/after unwrapping.
- Atomicity reasoning: the wrapper is one top-level DO statement; inner commands execute synchronously through dynamic EXECUTE; there is no exception handler or transaction-control command; an uncaught error escapes and aborts the statement rather than being swallowed.
- Channel success probe: one DO statement through Supabase CLI 2.114.0 db query with the verified TEST direct connection; returned DO with exit code 0.
- Channel failure probe: one DO statement with PERFORM 1 and deliberate single_statement_bridge_failure_probe exception; exit code 1 with LegacyDbQueryExecError. No retry.
- Migration snapshot after probes: 27 rows; canonical SHA-256 6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc; target row 20260817000200 absent.
- Bridge/wrapper application = 0; DB/schema/migration-history writes = 0; migration applies/push/repair = 0; TEST gameplay/save/fixture writes/live turns = 0; Worker deploy = 0; Production access = 0.
- Changed paths are limited to docs/ops/CURRENT_TASK.md, docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_SINGLE_STATEMENT.sql, and docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_SINGLE_STATEMENT_AUDIT.md. Accepted bridge/plan and supabase/migrations/* are unchanged.
- git diff --check: PASS.
- STOP. The wrapper is review evidence only; it was not submitted or applied.
