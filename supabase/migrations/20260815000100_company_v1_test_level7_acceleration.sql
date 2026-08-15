-- TEST-only acceptance seam. This is source for a later operator-approved
-- migration; it must not be applied as part of this task.
-- It grants capability only on the dedicated disposable TEST game. It is not
-- a normal gameplay/progression writer and never changes game_master.initial_save.

create or replace function public.prepare_company_test_level7_fixture(
  p_game_id uuid,
  p_expected_title text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_expected_game_id constant uuid := '2d00d76e-85b1-4cf0-8dab-a04e8a044b84';
  v_save public.game_save%rowtype;
  v_data jsonb;
  v_validation jsonb;
begin
  if p_game_id is distinct from v_expected_game_id then
    raise exception 'dedicated TEST game is required' using errcode = '22023';
  end if;
  if p_expected_title is null or nullif(btrim(p_expected_title), '') is null then
    raise exception 'expected TEST game title is required' using errcode = '22023';
  end if;

  -- The canonical reset owns cleanup, title/edition identity, and baseline
  -- validation. The acceleration is layered only after that boundary.
  perform public.reset_company_game(p_game_id, p_expected_title);

  select * into v_save
  from public.game_save
  where game_id = p_game_id
  for update;
  if not found then
    raise exception 'dedicated TEST game save not found' using errcode = 'P0002';
  end if;

  v_data := jsonb_set(coalesce(v_save.data, '{}'::jsonb), '{player_progress,level}', '7'::jsonb, true);
  v_data := jsonb_set(v_data, '{player_progress,exp}', '0'::jsonb, true);
  v_validation := public.validate_company_save_v1(v_data);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'invalid accelerated TEST save: %', v_validation -> 'errors' using errcode = '22023';
  end if;

  update public.game_save
  set data = v_data,
      save_revision = v_save.save_revision + 1,
      updated_at = now()
  where game_id = p_game_id;

  return jsonb_build_object(
    'success', true,
    'game_id', p_game_id,
    'committed_turn', 0,
    'player_progress', v_data -> 'player_progress',
    'reset_before_seed', true,
    'test_only', true
  );
end;
$$;

revoke all on function public.prepare_company_test_level7_fixture(uuid, text)
  from public, anon, authenticated;
grant execute on function public.prepare_company_test_level7_fixture(uuid, text)
  to service_role;
