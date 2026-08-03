# Phase 1 database migration package

## Status

This repository contains an unapplied SQL package for a future, independent Company v1 Supabase project. No project has been created or connected, and no migration or seed has been applied.

## Migration order

1. `20260803000100_company_v1_core_schema.sql` creates the extension, updated-at helper, core tables, indexes, RLS, save validator, and service-role-only access boundary.
2. `20260803000200_company_v1_turn_rpcs.sql` creates game initialization, context, action reservation, Story and Extract recording, action status, and guarded turn commit RPCs.
3. `20260803000300_company_v1_feedback_and_reset_rpcs.sql` creates latest-turn feedback revision and title-confirmed reset RPCs.
4. `20260803000100_company_v1_dev_seed.sql` upserts one fixed development game only; it creates no image rows.

## Table roles

- `games` stores the product game identity and lifecycle status without an `is_active` flag.
- `game_master` stores immutable master data and `initial_save`; reset never modifies it.
- `game_save` is the current state. Its `committed_turn` column is the database authority and is synchronized with JSON turn state by RPCs.
- `game_actions` makes action IDs idempotent and records Story/Extract/Commit recovery state.
- `game_turns` stores full Story text, parsed blocks, Extract delta, pre-save, post-save, summary, monitor data, and choices. Feedback preserves the replaced row as `superseded`.
- `image_library` reserves independent image metadata without seeding images or fallback identifiers.

## RPC guarantees

Action reservation rejects expected-turn conflicts and returns an existing action for the same action ID. Story and Extract results are immutable once recorded. Commit locks the action and save, validates canonical save v1, preserves pre-save, and replays a completed action instead of creating another turn.

Feedback targets only the latest active turn. It preserves the original player action and pre-save, records feedback separately, adds a higher revision row, and marks the previous record `superseded`. Reset requires an exact title confirmation, deletes only that game's turn/action rows, restores `game_save` from `game_master.initial_save`, and leaves master data unchanged.

## Access boundary

Every table has RLS enabled. The package grants no direct browser table access and grants RPC execution only to `service_role`; functions revoke public execution before that grant. Browser clients must not access Supabase directly.

## Required user work before application

1. Create a new Supabase project.
2. Select its region.
3. Confirm the new project ref and API URL.
4. Store the service-role secret only in local or Cloudflare secret configuration.
5. Explicitly approve migration application.

Those actions are outside Phase 1 package authoring. Cloudflare resources and deployment are also outside this phase.
