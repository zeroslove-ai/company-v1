# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: test-additive-schema-bridge-single-statement-apply-v2
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This is the corrected TEST-only application task after terminal `5318469522` (`WRAPPER_DIGEST_CORRECTION_BLOCKED`). The prior task safely stopped without applying anything. Independent operator review proved both apparent blockers were evidence-serialization issues rather than TEST schema/data drift:

- the immutable wrapper Git blob `1f959e140eacd88e281f3217cc1bf990f15dc41c` is exactly 8691 bytes and its canonical raw-byte SHA-256 is `433b8f2352b97536932350fcba5b1a3a4610a59546c5dc40b0a58e2459b2c3e0`;
- historical wrapper hash `8a5e438919d25fae4a618348c0b32473dcef1adc9f6baa10c09700cc886495f2` is exactly `SHA256(blob_bytes || LF)` and is superseded for execution-byte verification;
- current TEST migration history is still the same 27-row lineage: the earlier bridge-audit canonical `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc` is reproduced when both statement-array and row separators are literal backslash+n bytes; `240c423e5b8e6dc19096b3d8914f4c29cc648580659a3e30b5b928b035659d3e` is the same rows serialized with actual LF separators;
- the independent v2 forensic canonical is still exactly `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`;
- the five target functions remain in their pre-bridge definitions.

This task authorizes exactly one execution of the frozen wrapper against TEST and then read-only verification. It does not authorize Production, migration-history mutation, gameplay writes, deployment, or any semantic rewrite of the reviewed bridge.

## 0. Frozen authority

- Repository: `zeroslove-ai/company-v1`
- Expected main: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Previous terminal: `5318469522`
- Previous final SHA: `e998dcf0d85c56dee5b2fd1143e6dcedcd16db07`
- TEST project: `fmcrspgxstsmxxsmkeee`
- Original reviewed bridge blob: `cf3158db1960a52053a8b31fda1c4473ed05486d`
- Original reviewed bridge SHA-256: `6d0593b22d50c36a4c68c8c71407be7a25f03f8542ae73aee1083e9b102031f9`
- Frozen wrapper path: `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_SINGLE_STATEMENT.sql`
- Frozen wrapper blob: `1f959e140eacd88e281f3217cc1bf990f15dc41c`
- Canonical wrapper raw-byte SHA-256: `433b8f2352b97536932350fcba5b1a3a4610a59546c5dc40b0a58e2459b2c3e0`
- Wrapper byte length: `8691`
- Wrapper final byte: LF (`0a`)
- Ordered unwrapped payload SHA-256: `54fde93e424e3a34b730a2c48eb09c828c783e03b14b0efa0e3e1b950452848b`
- Corrected digest evidence: `docs/ops/TEST_SINGLE_STATEMENT_WRAPPER_DIGEST_CORRECTION.md`

### Canonical TEST migration snapshot rules

Do not reconstruct the migration snapshot hash in client code from displayed text.
Compute it inside PostgreSQL from `supabase_migrations.schema_migrations`.

Required invariants before and after execution:
- applied rows = `27`;
- target `20260817000200` absent;
- bridge-audit canonical = `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`, where the canonical input is ordered `version|name|array_to_string(statements, E'\\\\n')` rows joined with `E'\\\\n'` — i.e. literal backslash+n separators;
- independent v2 forensic canonical = `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`, where each ordered row is `version|name|statement_count|statements_bytes|statements_md5`, using actual LF to join the statements array and rows as documented in `TEST_MIGRATION_LINEAGE_RECONCILIATION.md`.

Diagnostic LF/LF hash `240c423e5b8e6dc19096b3d8914f4c29cc648580659a3e30b5b928b035659d3e` is expected for the same current rows when actual LF is used for both bridge-audit separators. It is not a drift hash.

## 1. Mandatory preflight — no writes before all checks pass

1. Fresh-fetch and require `origin/main == 8f3c5326e483650211fbc6c9f54a7527d2278d4e`.
2. Require this branch to descend directly from `e998dcf0d85c56dee5b2fd1143e6dcedcd16db07`, with only this CURRENT_TASK registration before execution.
3. Require TEST identity exactly `fmcrspgxstsmxxsmkeee`.
4. Re-read terminal `5318469522`, corrected digest evidence, original bridge, wrapper, wrapper audit, and bridge plan.
5. Resolve wrapper path to blob `1f959e140eacd88e281f3217cc1bf990f15dc41c`.
6. Read wrapper as raw bytes with binary-safe Git object access and require:
   - length `8691`;
   - SHA-256 `433b8f2352b97536932350fcba5b1a3a4610a59546c5dc40b0a58e2459b2c3e0`;
   - final byte `0a`.
7. Revalidate wrapper structure/equivalence without rewriting it:
   - original executable statements = 8;
   - wrapper top-level executable statements = 1 `DO`;
   - dynamic `EXECUTE` payloads = 8;
   - exact order/content match;
   - ordered payload SHA-256 `54fde93e424e3a34b730a2c48eb09c828c783e03b14b0efa0e3e1b950452848b`.
8. Compute both canonical TEST migration hashes **inside PostgreSQL** and require exact values from section 0, plus 27 rows and target absence.
9. Fresh-read the five target functions and require the known pre-bridge definitions/no unexplained drift. Expected pre-bridge `pg_get_functiondef` MD5 values:
   - `company_apply_opening_scene_v1(jsonb)` = `8a754cb7458696a248df4e655c8fccff`
   - `company_minimalize_save_v1(jsonb)` = `53968bc860f288c833db477828f07e13`
   - `company_validate_scene_v1(jsonb,boolean)` = `ccace7ee7fab211bfc8d3ed1c8623645`
   - `validate_company_save_v1(jsonb)` = `e65ebc00e0c48a2d605b5ecb68952775`
   - `reserve_company_player_setup(uuid,uuid,jsonb,jsonb)` = `e8d1eeb1bed91929acb3137324fbe16c`
10. Freeze read-only row counts plus deterministic stable-identifier/revision digests for `game_save`, `game_turns`, and `game_actions`.

Any mismatch: STOP `BLOCKED_TEST_SINGLE_STATEMENT_BRIDGE_V2` without wrapper execution.

## 2. Exact authorized mutation

Execute exactly once against TEST only the exact raw bytes of:

`docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_SINGLE_STATEMENT.sql`

Use the same prepared-statement channel already proven to accept one `DO` statement and propagate an uncaught error.

Hard rules:
- exactly one invocation;
- wrapper raw-byte SHA-256 immediately before invocation must still be `433b8f2352b97536932350fcba5b1a3a4610a59546c5dc40b0a58e2459b2c3e0`;
- do not edit, regenerate, normalize, concatenate, prepend, append, or reserialize the wrapper;
- do not add client-side transaction-control statements;
- do not use `supabase db push`;
- do not use `supabase migration repair`;
- do not write `supabase_migrations.schema_migrations`;
- do not replay historical migrations;
- do not invoke `reserve_company_player_setup` or any other write RPC;
- if the single invocation errors or has an ambiguous result, do not retry. Proceed only to read-only catalog/ledger verification and terminal BLOCKED.

Atomicity basis remains the reviewed one top-level `DO` statement with eight synchronous dynamic `EXECUTE`s, no inner transaction control, and no exception handler swallowing failures.

## 3. Mandatory post-execution verification

### 3.1 Migration history unchanged

Recompute both PostgreSQL-side canonical hashes from section 0 and require exact equality with preflight:
- rows 27;
- target `20260817000200` absent;
- bridge-audit canonical `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`;
- v2 forensic canonical `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`.

### 3.2 Five target functions converged

Fresh-read identity args, `pg_get_functiondef`, language, volatility, security mode, `proconfig`/search_path, owner and ACLs for:
- `company_apply_opening_scene_v1(jsonb)`;
- `company_minimalize_save_v1(jsonb)`;
- `company_validate_scene_v1(jsonb,boolean)`;
- `validate_company_save_v1(jsonb)`;
- `reserve_company_player_setup(uuid,uuid,jsonb,jsonb)`.

Require the reviewed bridge contract exactly:
- opening scene is the narrow six-key authority and removes stale work/scene-goal mirrors;
- minimalizer is the reviewed immutable SQL form and strips reviewed stale keys;
- scene validator is the narrow immutable structural validator; retained parameter name `p_require_scene` is expected and unused;
- save validator is the reviewed structural `SECURITY DEFINER` form and intended service-role boundary;
- setup RPC no longer enforces stale semantic catalogs/body bounds/work-hook/scene-goal authority and preserves intended service-role execution boundary;
- target ACLs match the bridge plan.

Do not require a hand-guessed post-bridge MD5 if PostgreSQL formatting differs; compare exact normalized definition/metadata against the reviewed SQL payload and record resulting MD5s as evidence.

### 3.3 Pure structural probes only

Synthetic, non-persisted JSON only:
- minimal opening plan -> `company_apply_opening_scene_v1` -> narrow scene;
- stale-key save -> `company_minimalize_save_v1` -> reviewed stale keys removed;
- narrow scene -> `company_validate_scene_v1` -> valid without extended fields;
- synthetic canonical save -> `validate_company_save_v1` -> reviewed structural behavior.

Never call `reserve_company_player_setup`.

### 3.4 Gameplay rows unchanged

Recompute the preflight row-count/digest evidence for `game_save`, `game_turns`, and `game_actions` and require exact equality.

## 4. Repository scope

Allowed repository change after registration:
- `docs/ops/CURRENT_TASK.md` lifecycle/terminal evidence only.

Do not modify:
- wrapper or original bridge;
- wrapper/digest/bridge audit evidence;
- `supabase/migrations/*`;
- runtime/source/content/tests/package/workflows;
- unrelated docs.

`git diff --check` must PASS.

## 5. Forbidden

- Production access/change;
- migration repair/history mutation;
- `supabase db push`;
- historical migration replay;
- second wrapper invocation/retry;
- TEST gameplay/save/fixture mutation/reset or live provider turn;
- Worker/frontend deploy;
- provider/model change;
- runtime/source/content/test/package/workflow changes;
- Cut 3 or unrelated work.

## 6. Terminal classification

Choose exactly one:

### `TEST_SINGLE_STATEMENT_BRIDGE_V2_APPLIED_VERIFIED`
Only if the exact wrapper was invoked once successfully, both migration canonical hashes remain identical, five target function/ACL contracts converge, pure probes pass, gameplay evidence is unchanged, and all forbidden-operation counts are zero.

### `BLOCKED_TEST_SINGLE_STATEMENT_BRIDGE_V2`
For any preflight mismatch, invocation error/ambiguity, post-apply catalog mismatch, migration-history difference, gameplay-data difference, or verification uncertainty. Never retry the wrapper.

At terminal:
1. set CURRENT_TASK to `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal with registration/final SHA/blob, wrapper byte digest and invocation count/result, both pre/post migration canonical hashes, five-function/ACL verification, pure probes, gameplay digest comparison and safety counts;
3. STOP. Do not deploy or create the next task.

## Execution lifecycle

- 2026-08-18: `EXECUTION: STARTED` lease posted to Issue #68 as comment `5318559043`.
- 2026-08-18: mandatory preflight passed. `origin/main` remained `8f3c5326e483650211fbc6c9f54a7527d2278d4e`; branch descended from `e998dcf0d85c56dee5b2fd1143e6dcedcd16db07` with only this registration; TEST identity matched `fmcrspgxstsmxxsmkeee`; wrapper blob/bridge blob matched frozen values; `git diff --check` was clean before execution.
- 2026-08-18: wrapper raw bytes immediately before invocation were 8691 bytes, SHA-256 `433b8f2352b97536932350fcba5b1a3a4610a59546c5dc40b0a58e2459b2c3e0`, final byte `0a`. Exact frozen wrapper was invoked exactly once through `supabase db query --file`; result `DO`, exit 0. No retry.
- 2026-08-18: migration post-check matched preflight: 27 rows, target `20260817000200` absent, bridge-audit canonical `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`, forensic canonical `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`.
- 2026-08-18: five target functions converged to the reviewed bridge contract. Post-apply `pg_get_functiondef` MD5s: `company_apply_opening_scene_v1` `415242b4a452ae218c01106b35900efe`; `company_minimalize_save_v1` `78547de247e2b6e8ee2a184cbf760de2`; `company_validate_scene_v1` `e982167db59fc5be1447b8866dd35a65`; `validate_company_save_v1` `d9a165eb01ee70cf92b63e7935e44f1b`; `reserve_company_player_setup` `74a8c352c5380fc2273821695ade4908`. Language, volatility, security mode, search path, and service-role ACLs matched the reviewed contract.
- 2026-08-18: pure synthetic non-persisted probes passed for opening scene narrowing, stale-key minimalization, narrow scene validation, and structural save validation. `reserve_company_player_setup` was not called.
- 2026-08-18: gameplay row evidence was unchanged: `game_save` 4 / `5fe7e4bfbcac6a92b73806df58496eb753ba7df9d3d3ebe889c025a02eb93503`; `game_turns` 43 / `7f0c07f2035e112f22ed373eeeecf95e03b2fffd1620b2ddce80260f44482857`; `game_actions` 46 / `f9374fbb749b0691b04130324604ba08bd847cba77ec7e5992a63166981a23b6` before and after.
- 2026-08-18: terminal classification `TEST_SINGLE_STATEMENT_BRIDGE_V2_APPLIED_VERIFIED`; stop without deployment or further task generation.
