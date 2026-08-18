-- TEST-only acceptance seam for one genuinely fresh Level-7 fixture.
-- Additive package only; do not edit or broaden the historical dedicated seam.

create or replace function public.create_company_test_level7_fixture(
  p_game_id uuid,
  p_expected_title text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_template_id constant uuid := '2d00d76e-85b1-4cf0-8dab-a04e8a044b84';
  v_template_game public.games%rowtype;
  v_template_master public.game_master%rowtype;
  v_template_save public.game_save%rowtype;
  v_data jsonb;
  v_validation jsonb;
  v_action_count bigint;
  v_turn_count bigint;
begin
  if p_game_id is null then
    raise exception 'fresh TEST game id is required' using errcode = '22023';
  end if;
  if p_expected_title is null or nullif(btrim(p_expected_title), '') is null then
    raise exception 'fresh TEST game title is required' using errcode = '22023';
  end if;
  if p_game_id in (
    v_template_id,
    '9755b57b-5cbb-44dd-a624-020fe516c16d'::uuid,
    '78fb1d94-266f-455a-bda4-7656cc2370c1'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid
  ) then
    raise exception 'fresh TEST game identity is reserved' using errcode = '22023';
  end if;

  -- Every target table is checked before any insert. A pre-existing row fails
  -- closed and the function transaction performs no target mutation.
  if exists (select 1 from public.games where id = p_game_id) then
    raise exception 'fresh TEST game already exists' using errcode = '23505';
  end if;
  if exists (select 1 from public.game_master where game_id = p_game_id) then
    raise exception 'fresh TEST game master already exists' using errcode = '23505';
  end if;
  if exists (select 1 from public.game_save where game_id = p_game_id) then
    raise exception 'fresh TEST game save already exists' using errcode = '23505';
  end if;
  if exists (select 1 from public.game_actions where game_id = p_game_id) then
    raise exception 'fresh TEST game actions already exist' using errcode = '23505';
  end if;
  if exists (select 1 from public.game_turns where game_id = p_game_id) then
    raise exception 'fresh TEST game turns already exist' using errcode = '23505';
  end if;

  -- The dedicated TEST game is a read-only template. It is never reset,
  -- updated, reseeded, or otherwise mutated by this function.
  select * into v_template_game
  from public.games
  where id = v_template_id;
  if not found or v_template_game.edition_id <> 'company-v1' then
    raise exception 'dedicated TEST template game is unavailable' using errcode = 'P0002';
  end if;

  select * into v_template_master
  from public.game_master
  where game_id = v_template_id;
  if not found then
    raise exception 'dedicated TEST template master is unavailable' using errcode = 'P0002';
  end if;

  select * into v_template_save
  from public.game_save
  where game_id = v_template_id;
  if not found then
    raise exception 'dedicated TEST template save is unavailable' using errcode = 'P0002';
  end if;

  v_data := v_template_save.data;
  v_data := jsonb_set(
    v_data,
    '{player_progress}',
    coalesce(v_data -> 'player_progress', '{}'::jsonb) || jsonb_build_object('level', 7, 'exp', 0),
    true
  );
  v_data := jsonb_set(
    v_data,
    '{turn_state}',
    coalesce(v_data -> 'turn_state', '{}'::jsonb) || jsonb_build_object(
      'turn_id', null,
      'action_id', null,
      'expected_turn', 1,
      'committed_turn', 0,
      'processing_status', 'idle'
    ),
    true
  );
  v_validation := public.validate_company_save_v1(v_data);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'fresh TEST save failed validation: %', v_validation -> 'errors'
      using errcode = '22023';
  end if;

  insert into public.games (id, edition_id, title, status, content_version)
  values (p_game_id, v_template_game.edition_id, p_expected_title,
    v_template_game.status, v_template_game.content_version);

  insert into public.game_master (
    game_id, master_schema_version, data, initial_save
  )
  values (
    p_game_id, v_template_master.master_schema_version,
    v_template_master.data, v_template_master.initial_save
  );

  insert into public.game_save (
    game_id, save_schema_version, committed_turn, save_revision, data
  )
  values (p_game_id, 1, 0, 0, v_data);

  select count(*) into v_action_count
  from public.game_actions where game_id = p_game_id;
  select count(*) into v_turn_count
  from public.game_turns where game_id = p_game_id;

  return jsonb_build_object(
    'success', true,
    'game_id', p_game_id,
    'committed_turn', 0,
    'player_progress', v_data -> 'player_progress',
    'processing_status', v_data #>> '{turn_state,processing_status}',
    'game_actions_count', v_action_count,
    'game_turns_count', v_turn_count,
    'test_only', true,
    'fresh_creation', true,
    'target_reused', false,
    'template_read_only', true,
    'reset_performed', false
  );
end;
$$;

revoke all on function public.create_company_test_level7_fixture(uuid, text)
  from public, anon, authenticated;
grant execute on function public.create_company_test_level7_fixture(uuid, text)
  to service_role;
