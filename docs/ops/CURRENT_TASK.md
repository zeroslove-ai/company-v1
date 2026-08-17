# Company v1 — CURRENT TASK

Status: READY
Task ID: test-additive-schema-bridge-single-statement-apply-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This is the controlled TEST-only application step after accepted terminal `5318141547` (`SINGLE_STATEMENT_BRIDGE_READY_FOR_REVIEW`). The prior audit proved that the already-reviewed eight-statement bridge is mechanically preserved inside one top-level PostgreSQL `DO` statement accepted by the available prepared-statement channel, with uncaught errors propagated.

This task authorizes exactly one execution of that frozen wrapper against TEST. It does not authorize Production, migration-history repair, `db push`, gameplay mutation, deployment, or any semantic change to the reviewed bridge.

## 0. Frozen authority and evidence

- Repository: `zeroslove-ai/company-v1`
- Main at registration: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Accepted wrapper terminal: `5318141547`
- Accepted wrapper final SHA: `2428b8765fe3ae44f6160c2b1262dc6d0c2243f3`
- Accepted wrapper final CURRENT_TASK blob: `a4c3cfec1dd8c91039b6f3a4e006d7ffaf57f044`
- TEST project: `fmcrspgxstsmxxsmkeee`
- Original reviewed bridge: `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE.sql`
- Original bridge blob: `cf3158db1960a52053a8b31fda1c4473ed05486d`
- Original bridge SHA-256: `6d0593b22d50c36a4c68c8c71407be7a25f03f8542ae73aee1083e9b102031f9`
- Accepted wrapper: `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_SINGLE_STATEMENT.sql`
- Accepted wrapper blob: `1f959e140eacd88e281f3217cc1bf990f15dc41c`
- Accepted wrapper SHA-256: `8a5e438919d25fae4a618348c0b32473dcef1adc9f6baa10c09700cc886495f2`
- Wrapper audit: `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_SINGLE_STATEMENT_AUDIT.md`
- Wrapper audit blob: `545c26f4d3b026d6f3a013e7b188f13a50d0961b`
- Ordered payload SHA-256: `54fde93e424e3a34b730a2c48eb09c828c783e03b14b0efa0e3e1b950452848b`
- Accepted migration snapshot: 27 rows; canonical SHA-256 `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`; row `20260817000200` absent.

Accepted wrapper proof:
- original executable statements = 8;
- wrapper top-level executable statements = 1 (`DO`);
- dynamic `EXECUTE` payloads = 8;
- payload order/content matched mechanically;
- single-DO success probe succeeded;
- deliberate-error single-DO probe failed as expected;
- no exception handler or transaction-control command exists;
- wrapper was not applied during the audit.

The wrapper file still contains its historical review-only comment. This later READY task is the explicit operator authority to execute those exact frozen bytes once on TEST. Do not edit or regenerate the wrapper.

## 1. Mandatory preflight — before any write

STOP without mutation if any check fails.

1. Fresh-fetch and require `origin/main == 8f3c5326e483650211fbc6c9f54a7527d2278d4e`.
2. Require this branch to descend directly from `2428b8765fe3ae44f6160c2b1262dc6d0c2243f3`, with only this CURRENT_TASK registration added before execution.
3. Re-read terminal `5318141547`, the original bridge, wrapper, and wrapper audit.
4. Recompute and require:
   - original bridge SHA-256 `6d0593b22d50c36a4c68c8c71407be7a25f03f8542ae73aee1083e9b102031f9`;
   - wrapper SHA-256 `8a5e438919d25fae4a618348c0b32473dcef1adc9f6baa10c09700cc886495f2`;
   - ordered unwrapped payload SHA-256 `54fde93e424e3a34b730a2c48eb09c828c783e03b14b0efa0e3e1b950452848b`.
5. Re-run the deterministic equivalence check: original statements 8, wrapper top-level 1, dynamic payloads 8, exact order/content match.
6. Verify TEST identity is exactly `fmcrspgxstsmxxsmkeee`.
7. Re-run the exact accepted migration snapshot and require 27 rows / canonical hash `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc` / `20260817000200` absent.
8. Fresh-read the five target function identities/definitions/security/ACLs and require no unexplained drift from the pre-bridge state.
9. Freeze read-only gameplay evidence before execution: row counts plus deterministic digests over stable identifiers/revision fields for `game_save`, `game_turns`, and `game_actions`.

Any preflight mismatch: terminal `BLOCKED_TEST_SINGLE_STATEMENT_BRIDGE_PREFLIGHT`; do not execute the wrapper.

## 2. Exact authorized TEST mutation

Execute exactly once, against TEST only, the exact frozen bytes of:

`docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_SINGLE_STATEMENT.sql`

Use the same prepared-statement path proven by the wrapper audit (Supabase CLI `db query --file` against the proven TEST direct DB URL, or exactly equivalent channel).

Hard requirements:
- one invocation only;
- immediately before invocation, wrapper SHA-256 must equal the frozen value;
- do not edit, regenerate, concatenate, prepend, or append SQL;
- do not add client-side `BEGIN/COMMIT`;
- submitted payload remains exactly one top-level `DO` statement after comments/whitespace;
- do not use `supabase db push`;
- do not use `supabase migration repair`;
- do not mutate `supabase_migrations.schema_migrations`;
- do not execute historical migration files;
- do not invoke `reserve_company_player_setup` or any other write RPC;
- do not retry if execution returns any error or ambiguous result.

Atomicity basis: all eight dynamic commands execute synchronously inside one PostgreSQL `DO` statement; no exception is swallowed; an uncaught error aborts that statement and its catalog effects.

If execution fails or is ambiguous, STOP immediately and prove resulting catalog state. Never attempt a second execution.

## 3. Mandatory post-execution verification

### 3.1 Migration ledger unchanged

Re-run the accepted snapshot and require:
- 27 rows;
- canonical SHA-256 `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`;
- `20260817000200` remains absent.

Any ledger change is a hard blocker.

### 3.2 Five target functions converged

Fresh-read `pg_get_functiondef`, identity args, language, volatility, security mode, configuration/search_path, and ACLs for:
- `company_apply_opening_scene_v1(jsonb)`;
- `company_minimalize_save_v1(jsonb)`;
- `company_validate_scene_v1(jsonb,boolean)`;
- `validate_company_save_v1(jsonb)`;
- `reserve_company_player_setup(uuid,uuid,jsonb,jsonb)`.

Require the accepted reviewed contract exactly. In particular:
- opening scene uses the narrow six-key scene authority and no `scene_goal`, `work_hook_id`, `scene_id`, `beat`, `goal`, or `focus_thread` semantic authority;
- minimalizer removes the reviewed stale keys;
- scene validator accepts the narrow structural scene and is immutable, not the stale extended-scene security-definer validator;
- retained input name `p_require_scene` is expected; the boolean is unused and callers are positional;
- save validator matches the reviewed structural contract and intended service-role boundary;
- setup RPC no longer enforces stale catalog/body/work-hook/scene-goal semantics and preserves intended service-role execution boundary.

### 3.3 Pure structural probes only

Using synthetic non-persisted JSON only, verify:
- minimal opening plan -> `company_apply_opening_scene_v1` -> narrow scene;
- stale-key synthetic save -> `company_minimalize_save_v1` -> stale keys removed;
- narrow scene -> `company_validate_scene_v1` -> valid without extended fields;
- synthetic minimal canonical save -> `validate_company_save_v1` -> reviewed structural behavior.

Do not invoke `reserve_company_player_setup`; catalog inspection only.

### 3.4 Gameplay data unchanged

Recompute the preflight row counts/digests for `game_save`, `game_turns`, and `game_actions` and require exact equality. Bridge installation itself must not mutate gameplay rows.

No TEST game/fixture creation, reset, or mutation is authorized.

## 4. Repository scope

Execution may change only `docs/ops/CURRENT_TASK.md` for lifecycle/terminal evidence.

Do not modify:
- original bridge;
- single-statement wrapper;
- wrapper audit;
- `supabase/migrations/*`;
- runtime/source/content/tests/package/workflows;
- unrelated docs.

`git diff --check` must PASS.

## 5. Forbidden operations

Strictly forbidden:
- Production access/change;
- migration repair/history mutation;
- `supabase db push`;
- historical migration replay;
- any second wrapper execution/retry;
- TEST gameplay/save/fixture write/reset;
- live provider/gameplay turns;
- Worker/frontend deploy;
- provider/model change;
- runtime/source/content/test/package/workflow changes;
- starting Cut 3 or unrelated gameplay work.

## 6. Terminal classification

Choose exactly one.

### `TEST_SINGLE_STATEMENT_BRIDGE_APPLIED_VERIFIED`
Only if:
- all preflight checks matched;
- exact wrapper was submitted exactly once and succeeded;
- migration ledger remained unchanged;
- all five target functions/ACLs match the reviewed target;
- pure structural probes pass;
- gameplay table row-count/digest evidence is unchanged;
- deploy/live gameplay/Production access = 0.

### `BLOCKED_TEST_SINGLE_STATEMENT_BRIDGE`
Use for any preflight drift, execution error/ambiguity, catalog mismatch, ledger change, data mutation, or verification uncertainty. If execution was attempted, report exact result and resulting catalog state. Do not retry.

At terminal:
1. set CURRENT_TASK to `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal with registration/final SHA/blob, pre/post migration snapshot, wrapper SHA, invocation count/result, five-function verification, pure probes, gameplay-data digest comparison, and safety counts;
3. STOP. Do not deploy or create the next task.