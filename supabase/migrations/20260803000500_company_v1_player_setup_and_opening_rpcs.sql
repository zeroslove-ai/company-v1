-- Company v1 player setup and random-opening RPCs. Service-role-only, like every other
-- Company v1 RPC. Catalog (department/position/body type/speech style) validation happens
-- in the Worker before these are called; these functions only enforce identity, shape,
-- and atomicity.

create or replace function public.save_company_player_setup(
  p_game_id uuid,
  p_setup_id uuid,
  p_player jsonb,
  p_opening_plan jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_save public.game_save%rowtype;
  v_next_save jsonb;
begin
  if p_setup_id is null then
    raise exception 'setup id is required' using errcode = '22023';
  end if;
  if p_player is null or jsonb_typeof(p_player) <> 'object' then
    raise exception 'player must be an object' using errcode = '22023';
  end if;
  if p_opening_plan is null or jsonb_typeof(p_opening_plan) <> 'object' then
    raise exception 'opening plan must be an object' using errcode = '22023';
  end if;

  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then
    raise exception 'company game save not found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.games where id = p_game_id and edition_id = 'company-v1') then
    raise exception 'company edition required' using errcode = '22023';
  end if;
  if coalesce((v_save.data -> 'player_setup' ->> 'completed')::boolean, false) then
    raise exception 'player setup is already completed for this game; reset to configure again' using errcode = '22023';
  end if;

  v_next_save := v_save.data;
  v_next_save := jsonb_set(v_next_save, '{player}', coalesce(v_next_save -> 'player', '{}'::jsonb) || p_player, true);
  v_next_save := jsonb_set(v_next_save, '{player_setup}', jsonb_build_object(
    'version', 1, 'completed', false, 'setup_id', p_setup_id
  ), true);
  v_next_save := jsonb_set(v_next_save, '{opening_plan}', p_opening_plan, true);

  update public.game_save set data = v_next_save where game_id = p_game_id;

  return jsonb_build_object(
    'setup_id', p_setup_id, 'completed', false,
    'player', v_next_save -> 'player', 'opening_plan', v_next_save -> 'opening_plan'
  );
end;
$$;

create or replace function public.commit_company_opening(
  p_game_id uuid,
  p_setup_id uuid,
  p_next_save jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_save public.game_save%rowtype;
  v_next_save jsonb;
  v_validation jsonb;
begin
  if p_setup_id is null then
    raise exception 'setup id is required' using errcode = '22023';
  end if;
  if p_next_save is null or jsonb_typeof(p_next_save) <> 'object' then
    raise exception 'next save must be an object' using errcode = '22023';
  end if;

  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then
    raise exception 'company game save not found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.games where id = p_game_id and edition_id = 'company-v1') then
    raise exception 'company edition required' using errcode = '22023';
  end if;
  if v_save.data -> 'player_setup' ->> 'setup_id' is distinct from p_setup_id::text then
    raise exception 'player setup identity mismatch' using errcode = '22023';
  end if;
  if coalesce((v_save.data -> 'player_setup' ->> 'completed')::boolean, false) then
    return jsonb_build_object('success', true, 'replayed', true, 'save_revision', v_save.save_revision);
  end if;

  -- The opening is turn 0: committed_turn never advances here, so the player's first
  -- real action still reserves expected_turn = 1 through the existing turn RPCs.
  v_next_save := jsonb_set(p_next_save, '{turn_state,committed_turn}', to_jsonb(v_save.committed_turn), true);
  v_validation := public.validate_company_save_v1(v_next_save);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'invalid opening save: %', v_validation -> 'errors' using errcode = '22023';
  end if;

  update public.game_save
  set save_revision = save_revision + 1, data = v_next_save
  where game_id = p_game_id;

  return jsonb_build_object('success', true, 'replayed', false, 'save_revision', v_save.save_revision + 1);
end;
$$;

revoke all on function public.save_company_player_setup(uuid, uuid, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.commit_company_opening(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.save_company_player_setup(uuid, uuid, jsonb, jsonb) to service_role;
grant execute on function public.commit_company_opening(uuid, uuid, jsonb) to service_role;
