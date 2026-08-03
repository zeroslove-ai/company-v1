-- Company v1 player setup and turn-0 opening RPCs. These functions are
-- service-role-only and build the authoritative save inside the database.

drop function if exists public.save_company_player_setup(uuid, uuid, jsonb, jsonb);
drop function if exists public.commit_company_opening(uuid, uuid, jsonb);

create or replace function public.reserve_company_player_setup(
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
  v_existing_setup_id text;
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
  if nullif(btrim(p_player ->> 'name'), '') is null or char_length(p_player ->> 'name') > 20
     or nullif(p_player ->> 'department_id', '') is null
     or nullif(p_player ->> 'position_id', '') is null
     or nullif(p_player ->> 'body_type_id', '') is null
     or nullif(p_player ->> 'speech_style_id', '') is null
     or jsonb_typeof(p_player -> 'height_cm') <> 'number'
     or (p_player ->> 'height_cm')::integer not between 140 and 220
     or jsonb_typeof(p_player -> 'weight_kg') <> 'number'
     or (p_player ->> 'weight_kg')::integer not between 40 and 180
     or jsonb_typeof(p_player -> 'penis_length_cm') <> 'number'
     or (p_player ->> 'penis_length_cm')::integer not between 5 and 30 then
    raise exception 'invalid player setup' using errcode = '22023';
  end if;
  if nullif(p_opening_plan ->> 'primary_character_id', '') is null
     or jsonb_typeof(p_opening_plan -> 'supporting_character_ids') <> 'array'
     or jsonb_array_length(p_opening_plan -> 'supporting_character_ids') > 1
     or (p_opening_plan -> 'supporting_character_ids') ? (p_opening_plan ->> 'primary_character_id')
     or nullif(p_opening_plan ->> 'location_id', '') is null
     or nullif(p_opening_plan ->> 'work_hook_id', '') is null
     or jsonb_typeof(p_opening_plan -> 'minute_of_day') <> 'number' then
    raise exception 'invalid opening plan' using errcode = '22023';
  end if;

  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then
    raise exception 'company game save not found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.games where id = p_game_id and edition_id = 'company-v1') then
    raise exception 'company edition required' using errcode = '22023';
  end if;

  v_existing_setup_id := v_save.data -> 'player_setup' ->> 'setup_id';
  if coalesce((v_save.data -> 'player_setup' ->> 'completed')::boolean, false) then
    raise exception 'player setup is already completed for this game; reset to configure again' using errcode = '22023';
  end if;
  if v_existing_setup_id is not null then
    if v_existing_setup_id <> p_setup_id::text then
      raise exception 'player setup is already reserved for this game' using errcode = '40001';
    end if;
    return jsonb_build_object(
      'setup_id', p_setup_id, 'completed', false, 'replayed', true,
      'player', v_save.data -> 'player', 'opening_state', v_save.data -> 'opening_state'
    );
  end if;

  v_next_save := jsonb_set(v_save.data, '{player}', coalesce(v_save.data -> 'player', '{}'::jsonb) || p_player, true);
  v_next_save := jsonb_set(v_next_save, '{player_setup}', jsonb_build_object(
    'version', 1, 'completed', false, 'setup_id', p_setup_id
  ), true);
  v_next_save := jsonb_set(v_next_save, '{opening_state}', jsonb_build_object(
    'plan', p_opening_plan, 'story_text', null, 'choices', '[]'::jsonb, 'status', 'reserved'
  ), true);

  update public.game_save set data = v_next_save where game_id = p_game_id;

  return jsonb_build_object(
    'setup_id', p_setup_id, 'completed', false, 'replayed', false,
    'player', v_next_save -> 'player', 'opening_state', v_next_save -> 'opening_state'
  );
end;
$$;

create or replace function public.commit_company_opening(
  p_game_id uuid,
  p_setup_id uuid,
  p_background text,
  p_story_text text,
  p_choices jsonb
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
  v_plan jsonb;
  v_participants jsonb;
begin
  if p_setup_id is null then
    raise exception 'setup id is required' using errcode = '22023';
  end if;
  if nullif(btrim(p_background), '') is null or char_length(p_background) > 120 then
    raise exception 'opening background must be 1 to 120 characters' using errcode = '22023';
  end if;
  if nullif(btrim(p_story_text), '') is null then
    raise exception 'opening story text is required' using errcode = '22023';
  end if;
  if p_choices is null or jsonb_typeof(p_choices) <> 'array' or jsonb_array_length(p_choices) <> 4
     or exists (select 1 from jsonb_array_elements_text(p_choices) choice where nullif(btrim(choice), '') is null) then
    raise exception 'opening choices must contain exactly four non-empty strings' using errcode = '22023';
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
    if v_save.data -> 'opening_state' ->> 'story_text' is distinct from p_story_text
       or v_save.data -> 'opening_state' -> 'choices' is distinct from p_choices
       or v_save.data -> 'player' ->> 'background' is distinct from p_background then
      raise exception 'opening result cannot be overwritten' using errcode = '23505';
    end if;
    return jsonb_build_object('success', true, 'replayed', true, 'save_revision', v_save.save_revision);
  end if;

  v_plan := v_save.data -> 'opening_state' -> 'plan';
  if v_save.data -> 'opening_state' ->> 'status' <> 'reserved'
     or v_plan is null or jsonb_typeof(v_plan) <> 'object' then
    raise exception 'opening plan is not reserved' using errcode = '22023';
  end if;
  v_participants := jsonb_build_array(v_plan ->> 'primary_character_id')
    || coalesce(v_plan -> 'supporting_character_ids', '[]'::jsonb);

  v_next_save := jsonb_set(v_save.data, '{player}', coalesce(v_save.data -> 'player', '{}'::jsonb) || jsonb_build_object('background', p_background), true);
  v_next_save := jsonb_set(v_next_save, '{world_state}', coalesce(v_next_save -> 'world_state', '{}'::jsonb) || jsonb_build_object(
    'game_time', jsonb_build_object('day', 1, 'minute_of_day', v_plan -> 'minute_of_day'),
    'weekday', v_plan -> 'weekday', 'date', v_plan -> 'date_label',
    'work_hook', jsonb_build_object('id', v_plan -> 'work_hook_id', 'status', 'active')
  ), true);
  v_next_save := jsonb_set(v_next_save, '{scene_state}', coalesce(v_next_save -> 'scene_state', '{}'::jsonb) || jsonb_build_object(
    'scene_id', concat('opening-', coalesce(v_plan ->> 'location_id', 'unknown')),
    'location_id', v_plan -> 'location_id', 'participants', v_participants,
    'scene_goal', v_plan -> 'scene_goal', 'beat', 0
  ), true);
  v_next_save := jsonb_set(v_next_save, '{last_choices}', p_choices, true);
  v_next_save := jsonb_set(v_next_save, '{last_npcs_present}', v_participants, true);
  v_next_save := jsonb_set(v_next_save, '{focal_character_id}', v_plan -> 'primary_character_id', true);
  v_next_save := jsonb_set(v_next_save, '{opening_state}', jsonb_build_object(
    'plan', v_plan, 'story_text', p_story_text, 'choices', p_choices, 'status', 'complete'
  ), true);
  v_next_save := jsonb_set(v_next_save, '{player_setup}', coalesce(v_next_save -> 'player_setup', '{}'::jsonb) || jsonb_build_object('completed', true), true);
  v_next_save := jsonb_set(v_next_save, '{turn_state,committed_turn}', to_jsonb(v_save.committed_turn), true);

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

revoke all on function public.reserve_company_player_setup(uuid, uuid, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.commit_company_opening(uuid, uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.reserve_company_player_setup(uuid, uuid, jsonb, jsonb) to service_role;
grant execute on function public.commit_company_opening(uuid, uuid, text, text, jsonb) to service_role;
