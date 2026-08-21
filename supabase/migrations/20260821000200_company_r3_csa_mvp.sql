begin;

create or replace function public.company_r3_apply_csa(
  p_game_id uuid, p_expected_revision integer, p_state_after jsonb, p_operations jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_state public.company_r3_state%rowtype;
begin
  if p_state_after is null or jsonb_typeof(p_operations) <> 'array' then raise exception 'company_r3_csa_payload_invalid'; end if;
  select * into v_state from public.company_r3_state where game_id = p_game_id for update;
  if not found or v_state.revision <> p_expected_revision then raise exception 'company_r3_csa_revision_conflict'; end if;
  update public.company_r3_state set revision = revision + 1, state = p_state_after, updated_at = now() where game_id = p_game_id;
  insert into public.company_r3_system_events(game_id, event_type, payload) values (p_game_id, 'csa_transaction', p_operations);
  return jsonb_build_object('game_id', p_game_id, 'revision', p_expected_revision + 1, 'committed_turn', v_state.committed_turn);
end;
$$;

revoke all on function public.company_r3_apply_csa(uuid, integer, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.company_r3_apply_csa(uuid, integer, jsonb, jsonb) to service_role;

commit;
