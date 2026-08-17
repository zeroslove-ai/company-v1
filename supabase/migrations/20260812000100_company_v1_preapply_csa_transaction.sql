-- Phase 12H: apply signed CSA rule definitions before Story generation.
-- This is intentionally not a turn commit: committed_turn, game_turns, and
-- all observation domains remain untouched. The Worker verifies the signed
-- resolution before invoking this service-role-only RPC.
create or replace function public.apply_reserved_csa_transaction(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_turn integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_save public.game_save%rowtype;
  v_action public.game_actions%rowtype;
  v_resolution jsonb;
  v_next_active jsonb;
  v_next_rules jsonb;
  v_next_save jsonb;
  v_validation jsonb;
  v_replayed boolean := false;
begin
  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then raise exception 'company game save not found' using errcode = 'P0002'; end if;

  select * into v_action from public.game_actions where action_id = p_action_id for update;
  if not found or v_action.game_id <> p_game_id then raise exception 'action not found' using errcode = 'P0002'; end if;
  if v_action.expected_turn <> p_expected_turn or p_expected_turn <> v_save.committed_turn + 1 then
    raise exception 'expected turn conflict' using errcode = '40001';
  end if;
  if coalesce(jsonb_typeof(v_action.structured_action), 'null') <> 'object'
     or v_action.structured_action ->> 'type' <> 'app_transaction' then
    raise exception 'structured app transaction is required' using errcode = '22023';
  end if;

  v_resolution := v_action.structured_action -> 'transaction_resolution';
  if coalesce(jsonb_typeof(v_resolution), 'null') <> 'object'
     or jsonb_typeof(v_resolution -> 'next_csa_active') <> 'array'
     or jsonb_typeof(v_resolution -> 'next_csa_rules') <> 'object' then
    raise exception 'signed transaction resolution is required' using errcode = '22023';
  end if;
  v_next_active := v_resolution -> 'next_csa_active';
  v_next_rules := v_resolution -> 'next_csa_rules';

  if coalesce(v_save.data -> 'csa_active', '[]'::jsonb) = v_next_active
     and coalesce(v_save.data -> 'csa_rules', '{}'::jsonb) = v_next_rules then
    v_replayed := true;
  else
    v_next_save := jsonb_set(v_save.data, '{csa_active}', v_next_active, true);
    v_next_save := jsonb_set(v_next_save, '{csa_rules}', v_next_rules, true);
    v_validation := public.validate_company_save_v1(v_next_save);
    if not coalesce((v_validation ->> 'valid')::boolean, false) then
      raise exception 'invalid pre-applied save: %', v_validation -> 'errors' using errcode = '22023';
    end if;
    update public.game_save
    set save_revision = save_revision + 1, data = v_next_save, updated_at = now()
    where game_id = p_game_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'replayed', v_replayed,
    'applied', true,
    'committed_turn', v_save.committed_turn,
    'expected_turn', p_expected_turn,
    'save_revision', case when v_replayed then v_save.save_revision else v_save.save_revision + 1 end
  );
end;
$$;

revoke all on function public.apply_reserved_csa_transaction(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.apply_reserved_csa_transaction(uuid, uuid, integer) to service_role;
