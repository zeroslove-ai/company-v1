-- Company v1 Authority Consolidation Cut 1, Stage B.
-- Apply only after Stage A is deployed, the new API is live, and raw-reader /
-- external-caller inventory is complete. This file is not applied by Cut 1.

-- service_role retains direct SELECT for read paths. Durable gameplay writes
-- must use approved SECURITY DEFINER RPCs instead.
revoke insert, update, delete, truncate on table public.games from service_role;
revoke insert, update, delete, truncate on table public.game_master from service_role;
revoke insert, update, delete, truncate on table public.game_save from service_role;
revoke insert, update, delete, truncate on table public.game_actions from service_role;
revoke insert, update, delete, truncate on table public.game_turns from service_role;
revoke insert, update, delete, truncate on table public.image_library from service_role;

-- The pre-Commit CSA save writer is obsolete after the caller audit and the
-- normal commit reducer becomes the only durable CSA mutation path.
revoke all on function public.apply_reserved_csa_transaction(uuid, uuid, integer)
  from public, anon, authenticated, service_role;
drop function if exists public.apply_reserved_csa_transaction(uuid, uuid, integer);

-- Legacy unowned lifecycle writers are removed only after the new Worker has
-- passed the Stage A contract gate and the external-caller inventory is clean.
revoke all on function public.claim_game_action_stage(uuid, uuid, text, text, text, text, text, boolean)
  from public, anon, authenticated, service_role;
revoke all on function public.fail_game_action_stage(uuid, uuid, text, text, text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.record_story_result(uuid, uuid, text, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.record_extract_result(uuid, uuid, jsonb)
  from public, anon, authenticated, service_role;
drop function if exists public.record_story_result(uuid, uuid, text, jsonb);
drop function if exists public.record_extract_result(uuid, uuid, jsonb);
drop function if exists public.claim_game_action_stage(uuid, uuid, text, text, text, text, text, boolean);
drop function if exists public.fail_game_action_stage(uuid, uuid, text, text, text, text, text);
