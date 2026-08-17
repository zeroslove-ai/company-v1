# TEST additive schema bridge audit

Status: `ADDITIVE_SCHEMA_BRIDGE_READY_FOR_REVIEW`

Task: `test-additive-schema-bridge-audit-v1`  
Registration SHA: `f9c9c9403c5f71e472afb07175c50e2db3de073e`  
Registration CURRENT_TASK blob: `f749d22526dac9f61e52b39f54e3603a6221d31d`  
Expected branch: `company/test-additive-schema-bridge-v1`  
TEST project: `fmcrspgxstsmxxsmkeee`

## Answer to the primary question

Yes, with a review-only bridge. The current TEST catalog has every required
function, helper, table, and target signature. The five target functions can
be replaced in place without dropping a function or replaying a historical
migration. The bridge performs no table/data/history write when it is reviewed
or committed; the only `UPDATE` is inside the future setup RPC and runs only
when a later normal runtime call explicitly invokes that RPC.

The one source-level adaptation is required by PostgreSQL: the current
`company_validate_scene_v1(jsonb,boolean)` input is named
`p_require_scene`, while the landed source names it `p_allow_legacy`.
`CREATE OR REPLACE FUNCTION` cannot rename an input parameter. Current callers
are positional, and the target boolean is intentionally unused, so the bridge
retains `p_require_scene` while replacing the body, volatility, and security
mode. Dropping the function would create an unnecessary dependency window and
is not required for the current runtime contract.

## Frozen source and TEST evidence

Target source: `supabase/migrations/20260817000200_company_v1_gameplay_core_simplification.sql`  
Target source blob SHA-1: `fd99a4aa8de5781c1b62ac7dba8e5ec3e3134254`  
Target source file SHA-256: `57b990f37988fb7dacc1a01b232fe475b58a146f8f18d8416169b7b257744e7b`  
Review bridge SQL SHA-256: `6d0593b22d50c36a4c68c8c71407be7a25f03f8542ae73aee1083e9b102031f9`  
Start migration snapshot query: `count(*)` plus SHA-256 over ordered
`version|name|array_to_string(statements, E'\\n')` rows.  
Start count: **27**  
Start canonical SHA-256: **6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc**  
Final count: **27**  
Final canonical SHA-256: **6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc**  
Target migration row present at start: **no**.

The terminal snapshot must rerun the identical read-only query and preserve
the same count/hash. The accepted preceding forensic independently recorded
27 rows at both snapshots under its own canonical hash; this task uses the
query above consistently for its own start/final comparison.

## Catalog inventory and classification

| Required object | Current TEST evidence | Classification |
|---|---|---|
| `company_apply_opening_scene_v1(jsonb)` | Exists; exact type identity; current body still requires `scene_goal`/`work_hook_id`; ACL has no EXECUTE for public/anon/authenticated/service_role | `SAFE_CREATE_OR_REPLACE_REQUIRED` |
| `company_minimalize_save_v1(jsonb)` | Exists; exact type identity; current PL/pgSQL body is not the landed SQL/immutable body; ACL has no EXECUTE for any listed role | `SAFE_CREATE_OR_REPLACE_REQUIRED` |
| `company_validate_scene_v1(jsonb,boolean)` | Exists with exact type identity; current input name is `p_require_scene`, body is extended-scene and `SECURITY DEFINER`; ACL has no EXECUTE for listed roles | `SAFE_CREATE_OR_REPLACE_REQUIRED` |
| `validate_company_save_v1(jsonb)` | Exists; exact identity; current body is older and volatile; `SECURITY DEFINER`, service_role-only EXECUTE already matches the target privilege contract | `SAFE_CREATE_OR_REPLACE_REQUIRED` |
| `reserve_company_player_setup(uuid,uuid,jsonb,jsonb)` | Exists; exact identity; current body enforces stale catalog/body/work-hook/scene-goal semantics; `SECURITY DEFINER`, service_role-only EXECUTE already matches target ACL | `SAFE_CREATE_OR_REPLACE_REQUIRED` |
| `company_initial_clothing_v2()` | Exists and is the only non-builtin helper called by the target bridge; no listed role has EXECUTE | `ALREADY_TARGET_EQUIVALENT` |
| `game_save(game_id, committed_turn, save_revision, data, updated_at)` | Required columns exist with `uuid`, `integer`, `bigint`, `jsonb`, `timestamptz` types and expected non-null constraints | `ALREADY_TARGET_EQUIVALENT` |
| Target function ACLs | Existing ACLs already equal the target: only `validate_company_save_v1` and `reserve_company_player_setup` are executable by `service_role`; the other target helpers are not executable by listed roles | `ALREADY_TARGET_EQUIVALENT` |

Totals over required object rows: `SAFE_CREATE_OR_REPLACE_REQUIRED=5`,
`ALREADY_TARGET_EQUIVALENT=3`, `SAFE_GRANT_REVOKE_REQUIRED=0`,
`MISSING_PREREQUISITE=0`, `DESTRUCTIVE_OR_DATA_REWRITE_REQUIRED=0`,
`AMBIGUOUS=0`.

## Dependency and caller proof

The target definitions use only PostgreSQL JSON/text/array built-ins,
`public.game_save`, and `public.company_initial_clothing_v2()`.
All exist in the current TEST catalog. The current database also contains
compiled callers `commit_company_opening`, `create_company_game`,
`reset_company_game`, `reserve_company_player_setup`, and
`validate_company_save_v1`; their type identities remain unchanged.

Current source has one direct RPC caller for the reserve function in
`src/api/turn-routes.js`. Its `buildOpeningPlan` emits weekday, minute,
location, primary character, and optional supporting character IDs; the new
reserve contract requires only a non-empty name and location at the DB
boundary, so the source call is compatible and no source change is authorized.
No current source caller uses named notation for the boolean scene-validator
argument; current SQL callers are positional. The bridge therefore avoids a
drop/recreate dependency window.

The target does not restore the removed work/scene semantic authority. It
removes `work_hook`/`scene_goal` from the opening projection, uses the narrow
six-key scene shape, and removes the stale semantic setup checks. It does not
alter tables or existing rows. The setup function's `UPDATE game_save` is
future runtime behavior inside the RPC, not execution-time bridge DML.

## Bridge contents and future application mechanism

`docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE.sql` contains only the five in-place
function replacements and the target validation ACL statements. It contains
no `INSERT`, `DELETE`, `TRUNCATE`, `ALTER TABLE`, migration-ledger operation,
or historical timestamp migration. Existing equivalent ACL statements for
the other functions are intentionally omitted as redundant.

The `company_validate_scene_v1` parameter-name adaptation is the only
difference from blindly copying the landed migration. It is necessary for a
valid in-place replacement and has no effect on positional callers.

After separate owner review, use one explicit TEST-only invocation with the
exact reviewed artifact SHA, for example:

```powershell
$env:npm_config_loglevel='silent'
npx.cmd --yes --silent supabase db query `
  --db-url $TEST_DB_URL `
  --file docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE.sql
```

This bypasses `supabase db push` filename scanning and must not be run until
the operator separately authorizes it. The operator must first recheck that
the TEST migration snapshot is unchanged, verify the bridge SHA, and then
rerun the same catalog/ACL checks. This one-off SQL-file mechanism intentionally
does not write `supabase_migrations.schema_migrations`; it is a fresh additive
TEST contract bridge, not historical migration repair.

## Safety and terminal evidence

No TEST DDL/DML, migration apply, migration-history mutation, fixture/game
write, reset, live provider turn, Worker deploy, or Production access was
performed by this audit. `git diff --check` and the final migration snapshot
are required before terminal. Only the three authorized docs paths may be
changed; no `supabase/migrations/*.sql` path may change.

Terminal evidence is complete: target row remained absent, the final
snapshot exactly matched the start snapshot, `git diff --check` passed, and
the bridge SQL SHA-256 is
`6d0593b22d50c36a4c68c8c71407be7a25f03f8542ae73aee1083e9b102031f9`.
DB/schema/history writes, migration applies, deploys, TEST gameplay
mutations/live turns, and Production access are all zero. CURRENT_TASK is
set to `WAITING_REVIEW` and one terminal report is required on Issue #68.
