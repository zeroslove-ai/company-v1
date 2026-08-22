-- Company R3 same-game reset source contract.
-- Apply only through a separately authorized TEST rollout task.

begin;

create or replace function public.company_r3_reset_game(
  p_game_id uuid,
  p_expected_revision integer,
  p_state_after jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_state public.company_r3_state%rowtype;
  v_next_revision integer;
begin
  if p_expected_revision is null or p_expected_revision < 0 or p_state_after is null then
    raise exception 'company_r3_reset_payload_invalid';
  end if;

  select * into v_state
    from public.company_r3_state
   where game_id = p_game_id
   for update;
  if not found or v_state.revision <> p_expected_revision then
    raise exception 'company_r3_reset_revision_conflict';
  end if;

  if exists (
    select 1 from public.company_r3_turn_jobs
     where game_id = p_game_id and status = 'processing'
  ) or exists (
    select 1 from public.company_r3_feedback_attempts
     where game_id = p_game_id and status = 'processing'
  ) then
    raise exception 'company_r3_reset_in_flight';
  end if;

  -- Keep the game/profile identity, but remove every turn-local chronology and sidecar.
  delete from public.company_r3_feedback_attempts where game_id = p_game_id;
  delete from public.company_r3_turn_revision_history where game_id = p_game_id;
  delete from public.company_r3_turns where game_id = p_game_id;
  delete from public.company_r3_turn_jobs where game_id = p_game_id;
  delete from public.company_r3_system_events where game_id = p_game_id;

  v_next_revision := v_state.revision + 1;
  update public.company_r3_state
     set revision = v_next_revision,
         committed_turn = 0,
         state = p_state_after,
         updated_at = now()
   where game_id = p_game_id;

  return jsonb_build_object(
    'game_id', p_game_id,
    'revision', v_next_revision,
    'committed_turn', 0
  );
end;
$$;

revoke all on function public.company_r3_reset_game(uuid, integer, jsonb) from public, anon, authenticated;
grant execute on function public.company_r3_reset_game(uuid, integer, jsonb) to service_role;

commit;
