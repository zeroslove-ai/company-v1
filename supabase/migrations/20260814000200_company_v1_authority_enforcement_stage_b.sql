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
