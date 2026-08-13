# Supabase Database Baseline — Live Amended

Project: `fmcrspgxstsmxxsmkeee`

The following facts were independently verified read-only by the architecture
reviewer and supplied in Issue #64. They replace the prior UNKNOWN statements.
No DB write, RPC execution, reset, migration, or Production query occurred in
this follow-up.

## Live catalog facts

1. Exactly six core public tables exist:
   `games`, `game_master`, `game_save`, `game_actions`, `game_turns`,
   `image_library`.
2. RLS is enabled on all six tables.
3. Public `pg_policies` count is zero for these Company tables.
4. `service_role` has direct table privileges including INSERT/UPDATE/DELETE
   on the core tables. Direct REST mutation is therefore a real application
   mutation surface, not a hypothetical one.
5. `game_actions.structured_action` and `game_turns.structured_action` exist
   live as nullable `jsonb` columns.
6. Exactly 14 Company migrations are recorded as applied, through
   `20260812071904 company_v1_preapply_csa_transaction`.

## Live public functions

Exactly these 18 public functions exist live:

```text
apply_reserved_csa_transaction
commit_company_opening
commit_company_turn
commit_feedback_revision
company_apply_initial_clothing_v2
company_apply_opening_scene_v1
company_initial_clothing_v2
create_company_game
get_action_status
get_company_context
record_extract_result
record_story_result
reserve_company_player_setup
reserve_feedback_revision
reserve_turn_action
reset_company_game
set_updated_at
validate_company_save_v1
```

The old `_legacy_v2` aliases are not present live. Historical migration
comments such as `NOT APPLIED` do not override the recorded migration version
and resulting live schema.

## Mutation surfaces and confirmed conflicts

### Normal turn commit

Live `commit_company_turn` atomically validates the next save, inserts the
`game_turns` row, updates `game_save`, and marks the action committed. It is the
sole target boundary for normal-turn durable save/turn state.

### Direct action mutation

`src/api/supabase.js` contains direct REST PATCH helpers
`updateActionStatus` and `claimActionStatus`. Because live `service_role`
direct table DML is permitted, these are real mutation paths alongside named
RPC lifecycle functions. The target architecture removes direct PATCH writes;
read-only GET/SELECT may remain.

### CSA preapply writer

`apply_reserved_csa_transaction(uuid, uuid, integer)` exists live, is
`SECURITY DEFINER`, and grants EXECUTE to `service_role`. Its live body directly
updates `game_save.csa_active` / `csa_rules` and increments `save_revision`
before `commit_company_turn`. Q.2 source has no caller under `src/**`, but the
callable DB writer remains deployed. It is an obsolete pre-Commit writer and is
scheduled for revoke/drop by a new additive cleanup migration after caller
audit.

### Setup/opening content duplication

The live `reserve_company_player_setup` SQL hardcodes department IDs, position
IDs, body types, speech styles, `heroine1`–`heroine5`, and constructs turn-0
scene/player/NPC projection fields. This confirms duplication with repository
content/catalog files. DB persistence should retain structural integrity, but
semantic IDs and world membership must be owned by repository content/runtime
validation.

### Confirmed opening defect

The live `commit_company_opening` body contains a mojibake empty-background
fallback in `story_summary_overall`. This is recorded as a defect only; it was
not fixed in this docs-only amendment.

## Repository-to-live interpretation

Repository migrations remain useful for historical intent and SQL shape, but
live catalog facts are now the current DB truth. The live function list matches
the migration-declared unique function inventory, while live deployment proves
that `apply_reserved_csa_transaction` remains callable despite no current JS
caller.

## Remaining DB unknowns

- Exact live function bodies for functions other than the reviewer-inspected
  surfaces.
- Exact live indexes/constraints/RLS definitions beyond the supplied facts.
- Current TEST row values and action/turn counts.
- Whether any external client outside this repository calls the preapply RPC.
- Exact hardcoded `game_master` data beyond the setup SQL body.

These unknowns do not weaken the sole-writer target; they define the caller
audit required before cleanup migration execution.
