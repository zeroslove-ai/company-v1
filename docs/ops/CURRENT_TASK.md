# Company v1 — CURRENT TASK

Status: READY
Task ID: test-additive-schema-bridge-apply-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This task is the controlled TEST-only execution step after accepted terminal `5317875505` (`ADDITIVE_SCHEMA_BRIDGE_READY_FOR_REVIEW`). The prior audit proved that the current TEST schema can be converged to the landed-main gameplay-core DB contract with five in-place function replacements and no table/data/history rewrite.

## 0. Frozen authority and evidence

- Repository: `zeroslove-ai/company-v1`
- Current main at registration: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Accepted audit final SHA: `f319c149ae92cdc9755f71f522b34c575049ce9d`
- Accepted audit terminal comment: `5317875505`
- Audit registration SHA: `f9c9c9403c5f71e472afb07175c50e2db3de073e`
- TEST project: `fmcrspgxstsmxxsmkeee`
- Reviewed bridge artifact: `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE.sql`
- Reviewed bridge Git blob: `cf3158db1960a52053a8b31fda1c4473ed05486d`
- Reviewed bridge SHA-256: `6d0593b22d50c36a4c68c8c71407be7a25f03f8542ae73aee1083e9b102031f9`
- Reviewed plan: `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_PLAN.md`
- Landed-main target source: `supabase/migrations/20260817000200_company_v1_gameplay_core_simplification.sql`
- Target source SHA-256 from accepted audit: `57b990f37988fb7dacc1a01b232fe475b58a146f8f18d8416169b7b257744e7b`
- Accepted audit migration snapshot: 27 rows, canonical SHA-256 `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`; row `20260817000200` absent.

The owner previously authorized autonomous TEST rollout inside the overnight loop. Registering this READY task is the operator approval for this exact reviewed TEST bridge only. It does not authorize Production or migration-history repair.

## 1. Mandatory fresh preflight — before any write

STOP without mutation if any check fails.

1. Fresh-fetch and require `origin/main == 8f3c5326e483650211fbc6c9f54a7527d2278d4e`.
2. Require this branch to descend from accepted audit final `f319c149ae92cdc9755f71f522b34c575049ce9d` with only this CURRENT_TASK registration added before execution.
3. Re-read terminal `5317875505`, the bridge SQL, and the bridge plan.
4. Recompute the bridge SHA-256 and require exactly `6d0593b22d50c36a4c68c8c71407be7a25f03f8542ae73aee1083e9b102031f9`.
5. Recompute the target source SHA-256 and require exactly `57b990f37988fb7dacc1a01b232fe475b58a146f8f18d8416169b7b257744e7b`.
6. Rerun the **same canonical migration-snapshot procedure used by the accepted audit** and require:
   - 27 applied rows;
   - canonical SHA-256 `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`;
   - `20260817000200` absent.
7. Fresh-read the five target function definitions/signatures/ACLs and require no unexplained drift from the accepted audit.
8. Verify `fmcrspgxstsmxxsmkeee` is the TEST project. Do not infer environment identity from a hostname or variable name alone.

Preflight failure terminal: `BLOCKED_TEST_BRIDGE_PREFLIGHT_DRIFT`.

## 2. Exact authorized TEST mutation

Apply **only** the exact reviewed bytes of `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE.sql` to TEST.

Requirements:
- one execution only;
- TEST project only;
- the whole SQL file must execute inside **one atomic transaction**;
- stop-on-first-error / equivalent behavior is mandatory;
- if the available client cannot prove atomic single-transaction execution, STOP `BLOCKED_ATOMIC_EXECUTION_CHANNEL` before any write;
- do not edit or regenerate the SQL artifact before execution;
- do not use `supabase db push`;
- do not use `supabase migration repair`;
- do not insert/update/delete `supabase_migrations.schema_migrations`;
- do not replay any historical migration;
- do not execute `supabase/migrations/20260817000200...` directly as a migration;
- do not call gameplay/setup RPCs during the mutation step.

A suitable execution path may be `psql --single-transaction -v ON_ERROR_STOP=1 -f <exact reviewed file>` against the proven TEST connection, or another client only if it provides equivalent all-or-nothing semantics. Do not assume a CLI subcommand exists; verify the execution channel before mutation.

## 3. Mandatory post-apply verification

After a successful commit, independently prove all of the following.

### 3.1 Migration ledger unchanged

Rerun the accepted audit's exact snapshot method and require:
- count remains 27;
- canonical SHA-256 remains `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`;
- row `20260817000200` remains absent.

Any ledger change is a hard failure: `BLOCKED_MIGRATION_LEDGER_CHANGED`.

### 3.2 Five target functions converged

Fresh-read `pg_get_functiondef`, identity arguments, volatility/security mode, and ACLs for:
- `company_apply_opening_scene_v1(jsonb)`;
- `company_minimalize_save_v1(jsonb)`;
- `company_validate_scene_v1(jsonb,boolean)`;
- `validate_company_save_v1(jsonb)`;
- `reserve_company_player_setup(uuid,uuid,jsonb,jsonb)`.

Require the accepted bridge contract exactly. The retained input name `p_require_scene` on `company_validate_scene_v1` is expected and accepted; the boolean is unused and all callers are positional.

### 3.3 Pure structural probes only

Read-only/pure function probes are authorized using synthetic JSON only. Verify at minimum:
- `company_apply_opening_scene_v1` accepts a minimal opening plan with primary character + location and produces the narrow six-key scene without `scene_goal`, `work_hook`, `scene_id`, `beat`, `goal`, or `focus_thread` authority;
- `company_minimalize_save_v1` removes the stale keys targeted by landed main;
- `company_validate_scene_v1` accepts the narrow structural scene and does not require the old extended fields;
- `validate_company_save_v1` validates a synthetically constructed minimal canonical save shape.

Do **not** invoke `reserve_company_player_setup` because it is a write RPC. Verify that function by catalog definition only in this task.

### 3.4 No unrelated state change

- no TEST game/save/turn/action row may be created, reset, or mutated;
- no Worker deploy;
- no live provider/gameplay turn;
- no Production access/change.

## 4. Repository scope

Execution evidence may update only `docs/ops/CURRENT_TASK.md` lifecycle/terminal text.

Do not modify:
- bridge SQL or bridge plan;
- `supabase/migrations/*`;
- runtime/source/content/tests/package/workflows;
- any other docs unless strictly required to preserve immutable execution evidence, in which case STOP for operator review instead of broadening scope.

`git diff --check` must PASS.

## 5. Terminal classification

Choose exactly one.

### `TEST_SCHEMA_BRIDGE_APPLIED_VERIFIED`
Use only if:
- all preflight checks matched;
- exact bridge SHA was executed exactly once;
- execution was atomic and committed successfully;
- migration ledger remained byte-for-byte/canonical-snapshot unchanged;
- all five function contracts/ACLs match the reviewed target;
- pure structural probes pass;
- TEST gameplay mutations = 0;
- deploy = 0;
- Production access = 0.

### `BLOCKED_TEST_SCHEMA_BRIDGE`
Use for any failure or ambiguity. If execution began, report whether the atomic transaction committed or rolled back and prove the resulting catalog state. Never retry the mutation speculatively.

At terminal:
1. set CURRENT_TASK to `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal with registration/final SHA/blob, exact pre/post migration snapshot, bridge SHA, execution channel, transaction result, five-function verification, pure-probe results, and safety counts;
3. STOP. Do not deploy or create the next task.
