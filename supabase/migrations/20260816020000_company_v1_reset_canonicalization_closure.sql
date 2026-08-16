-- Company v1: restore canonical reset ordering after legacy residue cleanup.
-- Historical migrations remain immutable; this is the single additive reset fix.

create or replace function public.reset_company_game(p_game_id uuid, p_expected_title text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_game public.games%rowtype;
  v_master public.game_master%rowtype;
  v_save public.game_save%rowtype;
  v_data jsonb;
  v_validation jsonb;
begin
  select * into v_game from public.games where id = p_game_id for update;
  if not found or v_game.edition_id <> 'company-v1' then
    raise exception 'company game not found' using errcode = 'P0002';
  end if;
  if v_game.title <> p_expected_title then
    raise exception 'expected title does not match game title' using errcode = '22023';
  end if;
  select * into v_master from public.game_master where game_id = p_game_id;
  select * into v_save from public.game_save where game_id = p_game_id for update;

  v_data := v_master.initial_save
    - 'story_summary_overall'
    - 'story_summary_recent'
    - 'npc_emotion'
    - 'npc_work_state'
    - 'event_ledger';
  v_data := public.company_bootstrap_scene_v1(v_data);
  v_data := public.company_apply_initial_clothing_v2(v_data);
  v_validation := public.validate_company_save_v1(v_data);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'invalid reset initial save: %', v_validation -> 'errors' using errcode = '22023';
  end if;

  delete from public.game_turns where game_id = p_game_id;
  delete from public.game_actions where game_id = p_game_id;
  update public.game_save
  set committed_turn = 0,
      save_revision = v_save.save_revision + 1,
      data = v_data,
      updated_at = now()
  where game_id = p_game_id;
  return jsonb_build_object('success', true, 'game_id', p_game_id, 'committed_turn', 0);
end;
$$;

revoke all on function public.reset_company_game(uuid, text) from public, anon, authenticated;
grant execute on function public.reset_company_game(uuid, text) to service_role;
