# Supabase Database Baseline

Project reference: `fmcrspgxstsmxxsmkeee`

This is a repository-declared baseline plus an explicit access limitation. No
SQL write, migration, RPC execution, reset, or Production request was made.

## What the repository declares

The migration set contains six core tables:

- `games`
- `game_master`
- `game_save`
- `game_actions`
- `game_turns`
- `image_library`

The core schema creates RLS on gameplay tables and indexes action/turn lookup,
expected turn, processing status, target turn, committed time, and revision
request identifiers. `game_turns.action_id` is unique and references
`game_actions`; active turn and revision request uniqueness are enforced by
indexes in `20260803000100_company_v1_core_schema.sql`.

## Migration-declared mutation surfaces

The migrations contain 18 unique function names (some are recreated across
later migrations):

| Function | Intended role | Current JS caller evidence | Audit result |
|---|---|---|---|
| `create_company_game` | create game/save/master | bootstrap/tests | migration-declared; live definition unverified |
| `get_company_context` | hydrate save/master/history context | routes via Supabase client/context paths | active runtime boundary |
| `reserve_turn_action` | reserve ordinary/structured action | turn route/client | active runtime boundary |
| `record_story_result` | persist Story stage | route lifecycle | migration-declared; current route path needs owner confirmation |
| `record_extract_result` | persist Extract stage | route lifecycle | migration-declared; current route path needs owner confirmation |
| `get_action_status` | recovery/status | route/client | active recovery boundary |
| `commit_company_turn` | durable turn/save commit | turn route | primary durable commit candidate |
| `reserve_feedback_revision` | reserve feedback replacement | feedback route/client | active revision boundary |
| `commit_feedback_revision` | supersede/rewrite turn | feedback route/client | active revision boundary |
| `reset_company_game` | reset test game state | reset route/scripts | dangerous write surface; prohibited in audit |
| `reserve_company_player_setup` | reserve setup/opening plan | setup route | active opening boundary |
| `commit_company_opening` | complete opening/save bootstrap | opening route | active opening boundary |
| `company_apply_initial_clothing_v2` | clothing bootstrap helper | migration wrapper | legacy/compatibility candidate |
| `company_initial_clothing_v2` | clothing bootstrap helper | migration wrapper | legacy/compatibility candidate |
| `company_apply_opening_scene_v1` | opening scene bootstrap | migration wrapper | legacy/compatibility candidate |
| `validate_company_save_v1` | DB save shape validation | commit/opening SQL | DB-side validator; live authority unverified |
| `apply_reserved_csa_transaction` | pre-apply CSA action mutation | no caller found in `src/**` | dormant DB writer candidate; cleanup requires live DB review |
| `set_updated_at` | trigger helper | table trigger | infrastructure helper |

The exact current signatures, grants, applied migration order, and surviving
legacy functions cannot be asserted from repository SQL alone.

## Repo-declared lifecycle

`game_actions` is intended to move through reservation and Story/Extract/commit
stages. `game_turns` stores committed Story, parsed blocks, action metadata,
summary, monitor, choices, and revision linkage. Feedback creates a replacement
turn and marks the original superseded. The reset function deletes turns/actions
and restores the save bootstrap state.

Opening is separately reserved and committed in `game_save.player_setup` and
`game_save.opening_state`; later migrations consolidate the canonical function
names and revoke the legacy `_legacy_v2` function grants in the declared SQL.

## Hardcoded/duplicated world data in DB migrations

The opening and clothing migrations contain bootstrap logic and default state
construction. The repository also has content catalogs:

- `content/characters.json`
- `content/general_npcs.json`
- `content/map.json`
- `content/organization.json`
- `content/positions.json`
- `content/csa_presets.json`

This creates a potential duplicate-definition boundary: DB SQL knows enough
about opening/clothing/save shape to write state, while content JSON is the
runtime world catalog. Whether any live DB `game_master` rows contain
hardcoded world definitions that override the current content files is
**UNVERIFIED**.

## Actual database verification status

The audit environment has no callable Supabase management/SQL connector and
the locally available secret key is rejected for direct catalog REST access.
Consequently the following are unverified and intentionally not inferred:

- live tables/columns/constraints/indexes;
- applied migration history;
- live `pg_proc` function bodies and overloads;
- live grants/RLS policies;
- actual surviving legacy RPCs;
- current TEST save/action/turn row counts;
- whether `apply_reserved_csa_transaction` is deployed;
- live DB-side hardcoded master/world data.

Repository SQL is evidence of intended schema and mutation surfaces, not a
substitute for that missing read-only catalog query.

## DB disposition candidates

1. Compare live `pg_proc` and grants with the migration-declared list.
2. Confirm whether `apply_reserved_csa_transaction` has a live caller and
   whether it can mutate canonical state outside `commit_company_turn`.
3. Compare `game_master` data with `content/**` and declare one world source.
4. Inventory direct REST PATCH writers against action lifecycle RPCs.
5. Only after owner decision, remove dormant functions/migrations; not during
   this audit.
