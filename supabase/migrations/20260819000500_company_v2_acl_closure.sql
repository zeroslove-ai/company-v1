-- Company v2 Phase 1: close runtime ACLs without changing v2 behavior.
-- Source only. Apply only through the separately authorized TEST rollout task.

revoke all on function public.company_v2_create_game(text, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.company_v2_create_game(text, jsonb) to service_role;

revoke all on function public.company_v2_create_opening(uuid, text, jsonb, jsonb, text, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.company_v2_create_opening(uuid, text, jsonb, jsonb, text, jsonb) to service_role;

revoke all on function public.company_v2_reserve_turn(uuid, integer, uuid, text, boolean) from public, anon, authenticated, service_role;
grant execute on function public.company_v2_reserve_turn(uuid, integer, uuid, text, boolean) to service_role;

revoke all on function public.company_v2_expire_stale_turn(uuid, integer) from public, anon, authenticated, service_role;
grant execute on function public.company_v2_expire_stale_turn(uuid, integer) to service_role;

revoke all on function public.company_v2_update_turn_progress(uuid, integer, uuid, integer, text) from public, anon, authenticated, service_role;
grant execute on function public.company_v2_update_turn_progress(uuid, integer, uuid, integer, text) to service_role;

revoke all on function public.company_v2_fail_turn(uuid, integer, uuid, integer, text) from public, anon, authenticated, service_role;
grant execute on function public.company_v2_fail_turn(uuid, integer, uuid, integer, text) to service_role;

revoke all on function public.company_v2_commit_turn(uuid, integer, uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.company_v2_commit_turn(uuid, integer, uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb) to service_role;

revoke all on table public.company_v2_games, public.company_v2_state, public.company_v2_turn_jobs, public.company_v2_turns from public, anon, authenticated, service_role;
grant select on table public.company_v2_games, public.company_v2_state, public.company_v2_turn_jobs, public.company_v2_turns to service_role;
