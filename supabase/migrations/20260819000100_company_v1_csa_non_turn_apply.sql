-- CSA app application is a save-only transaction. It never creates a gameplay action or turn.
create or replace function public.apply_company_csa_transaction(
  p_game_id uuid,
  p_expected_revision bigint,
  p_next_save jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_save public.game_save%rowtype;
  v_validation jsonb;
  v_current_turn integer;
  v_next_turn integer;
begin
  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then raise exception 'company save not found' using errcode = 'P0002'; end if;
  if p_expected_revision is null or v_save.save_revision <> p_expected_revision then
    raise exception 'save revision conflict' using errcode = '40001';
  end if;
  if jsonb_typeof(p_next_save) <> 'object' then
    raise exception 'next save must be an object' using errcode = '22023';
  end if;
  v_current_turn := coalesce((v_save.data -> 'turn_state' ->> 'committed_turn')::integer, v_save.committed_turn);
  v_next_turn := coalesce((p_next_save -> 'turn_state' ->> 'committed_turn')::integer, -1);
  if v_next_turn <> v_current_turn or p_next_save ? 'committed_turn' then
    raise exception 'CSA apply cannot change committed turn' using errcode = '22023';
  end if;
  if (p_next_save - 'csa_active' - 'csa_rules') <> (v_save.data - 'csa_active' - 'csa_rules') then
    raise exception 'CSA apply may change only csa definitions' using errcode = '22023';
  end if;
  v_validation := public.validate_company_save_v1(p_next_save);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'invalid company save: %', v_validation -> 'errors' using errcode = '22023';
  end if;
  update public.game_save
  set data = p_next_save, save_revision = save_revision + 1, updated_at = now()
  where game_id = p_game_id;
  return jsonb_build_object('success', true, 'committed_turn', v_save.committed_turn, 'save_revision', v_save.save_revision + 1);
end;
$$;

revoke all on function public.apply_company_csa_transaction(uuid, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.apply_company_csa_transaction(uuid, bigint, jsonb) to service_role;
