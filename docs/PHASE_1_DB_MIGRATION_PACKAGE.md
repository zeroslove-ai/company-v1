# Phase 1 database migration package

## Status

Phase 1 is applied and verified on the independent Company v1 Supabase project `fmcrspgxstsmxxsmkeee` (`https://fmcrspgxstsmxxsmkeee.supabase.co`), named `company-v1` in `ap-northeast-1`.

The retired Dify project is not used and must not be modified. Cloudflare resources and deployment remain outside this phase.

## Migration order

1. `20260803000100_company_v1_core_schema.sql` creates the extension, updated-at helper, core tables, indexes, RLS, save validator, and initial service-role boundary.
2. `20260803000200_company_v1_turn_rpcs.sql` creates game initialization, context, action reservation, Story and Extract recording, action status, and guarded turn commit RPCs.
3. `20260803000300_company_v1_feedback_and_reset_rpcs.sql` creates latest-turn feedback revision and title-confirmed reset RPCs.
4. `20260803000400_company_v1_lock_down_rpc_access.sql` removes Supabase default RPC execution from `anon` and `authenticated`, then preserves execution for `service_role` only.
5. `20260803000100_company_v1_dev_seed.sql` upserts one fixed development game only; it creates no image rows.

## Table roles

- `games` stores the product game identity and lifecycle status without an `is_active` flag.
- `game_master` stores immutable master data and `initial_save`; reset never modifies it.
- `game_save` is the current state. Its `committed_turn` column is the database authority and is synchronized with JSON turn state by RPCs.
- `game_actions` makes action IDs idempotent, records Story/Extract/Commit recovery state, and pins feedback reservations to `target_turn_id`.
- `game_turns` stores full Story text, parsed blocks, Extract delta, pre-save, post-save, summary, monitor data, and choices. Feedback preserves the replaced row as `superseded`.
- `image_library` reserves independent image metadata without seeding images or fallback identifiers.

## RPC guarantees

Action reservation rejects expected-turn conflicts and returns an existing action for the same action ID. Story and Extract results are immutable once recorded. Commit locks the action and save, validates canonical save v1, preserves pre-save, and replays a completed action instead of creating another turn.

Feedback targets only the latest active turn. A reservation stores that original turn ID, and replay returns its original turn ID, player action, and pre-save. Commit locks the reserved target and rejects a stale reservation before it can overwrite a newer revision. A valid revision preserves the original player action and pre-save, records feedback separately, adds a higher revision row, and marks the previous record `superseded`. Reset requires an exact title confirmation, deletes only that game's turn/action rows, restores `game_save` from `game_master.initial_save`, and leaves master data unchanged.

## Access boundary

Every table has RLS enabled and no browser-facing policies. Direct table privileges are absent for `anon` and `authenticated`. All Company v1 `SECURITY DEFINER` RPCs revoke execution from `public`, `anon`, and `authenticated`; all eleven application RPCs are executable by `service_role` only. Browser clients must not access Supabase directly.

## Applied verification

- Six application tables exist with RLS enabled.
- Eleven application RPCs exist as `SECURITY DEFINER` functions with `search_path = public, pg_temp`.
- `anon` executable RPC count: `0`.
- `authenticated` executable RPC count: `0`.
- `service_role` executable RPC count: `11`.
- The fixed development game exists with `save_schema_version = 1`, `committed_turn = 0`, and two active CSA rules.
- A rollback-only integration smoke test completed normal turn commit, feedback replay, and stale concurrent feedback rejection.
- The smoke test left zero actions and zero turns after rollback.

## Next step

Begin Phase 2: implement the context → Story SSE → Extract → guarded Commit vertical loop. Store the service-role secret only in local or Cloudflare secret configuration and never in this repository.
