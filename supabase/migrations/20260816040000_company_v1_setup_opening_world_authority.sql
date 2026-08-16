-- Company v1 Setup/Opening world-definition authority consolidation.
-- Historical migrations remain immutable. Apply only after independent review.
-- Repository/application code owns semantic catalogs and registered membership;
-- this RPC keeps only structural, transaction, and idempotence invariants.

create or replace function public.company_apply_opening_scene_v1(p_data jsonb)
returns jsonb
language plpgsql
immutable
set search_path to 'public', 'pg_temp'
as $$
declare
  v_data jsonb := coalesce(p_data, '{}'::jsonb);
  v_opening jsonb;
  v_plan jsonb;
  v_primary text;
  v_location text;
  v_goal text;
  v_hook text;
  v_supporting jsonb;
  v_present_ids text[] := array[]::text[];
  v_id text;
  v_scene jsonb;
  v_player_scene jsonb;
  v_npc_scene jsonb;
  v_state jsonb;
  v_clothing jsonb;
begin
  if jsonb_typeof(v_data) <> 'object' then
    raise exception 'opening bootstrap data must be an object' using errcode = '22023';
  end if;

  v_opening := coalesce(v_data -> 'opening_state', '{}'::jsonb);
  v_plan := v_opening -> 'plan';
  if jsonb_typeof(v_plan) <> 'object' then
    raise exception 'opening plan is required for canonical bootstrap' using errcode = '22023';
  end if;

  v_primary := nullif(btrim(v_plan ->> 'primary_character_id'), '');
  v_location := nullif(btrim(v_plan ->> 'location_id'), '');
  v_goal := nullif(btrim(v_plan ->> 'scene_goal'), '');
  v_hook := nullif(btrim(v_plan ->> 'work_hook_id'), '');
  if v_primary is null or v_location is null or v_goal is null or v_hook is null then
    raise exception 'opening plan is incomplete for canonical bootstrap' using errcode = '22023';
  end if;

  v_supporting := coalesce(v_plan -> 'supporting_character_ids', '[]'::jsonb);
  if jsonb_typeof(v_supporting) <> 'array' or jsonb_array_length(v_supporting) > 1 then
    raise exception 'opening supporting characters must contain at most one id' using errcode = '22023';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(v_supporting) item
    where jsonb_typeof(item) <> 'string'
      or nullif(btrim(item #>> '{}'), '') is null
  ) then
    raise exception 'opening supporting characters must contain non-empty ids' using errcode = '22023';
  end if;
  v_present_ids := array[v_primary];
  for v_id in select btrim(value) from jsonb_array_elements_text(v_supporting) item(value)
  loop
    if v_id = v_primary then
      raise exception 'opening supporting character duplicates primary id' using errcode = '22023';
    end if;
    v_present_ids := v_present_ids || v_id;
  end loop;

  v_scene := jsonb_build_object(
    'version', 1,
    'scene_id', 'opening',
    'location_id', v_location,
    'beat', 0,
    'goal', v_goal,
    'focus_thread', v_hook,
    'present_npc_ids', to_jsonb(v_present_ids),
    'focal_character_id', v_primary,
    'last_speaker_id', null,
    'updated_turn', 0
  );
  v_data := jsonb_set(v_data, '{scene}', v_scene, true)
    - 'scene_state' - 'last_npcs_present' - 'focal_character_id' - 'last_speaker_id';

  v_player_scene := coalesce(v_data -> 'player_scene_state', '{}'::jsonb);
  if jsonb_typeof(v_player_scene) <> 'object' then v_player_scene := '{}'::jsonb; end if;
  v_player_scene := (v_player_scene - 'location_id') || jsonb_build_object('updated_turn', 0);
  v_data := jsonb_set(v_data, '{player_scene_state}', v_player_scene, true);

  v_npc_scene := coalesce(v_data -> 'npc_scene_state', '{}'::jsonb);
  if jsonb_typeof(v_npc_scene) <> 'object' then v_npc_scene := '{}'::jsonb; end if;
  for v_id, v_state in select key, value from jsonb_each(v_npc_scene)
  loop
    if jsonb_typeof(v_state) <> 'object' then v_state := '{}'::jsonb; end if;
    v_state := v_state - 'present' - 'scene_id' - 'location_id';
    if v_id = any(v_present_ids) then
      v_clothing := case when jsonb_typeof(v_state -> 'clothing') = 'object' then v_state -> 'clothing' else public.company_initial_clothing_v2() end;
      v_state := v_state || jsonb_build_object('updated_turn', 0);
      v_state := jsonb_set(v_state, '{clothing}', v_clothing, true);
    end if;
    v_npc_scene := jsonb_set(v_npc_scene, array[v_id], v_state, true);
  end loop;
  foreach v_id in array v_present_ids
  loop
    if not (v_npc_scene ? v_id) then
      v_npc_scene := jsonb_set(v_npc_scene, array[v_id], jsonb_build_object(
        'updated_turn', 0,
        'clothing', public.company_initial_clothing_v2()
      ), true);
    end if;
  end loop;
  return jsonb_set(v_data, '{npc_scene_state}', v_npc_scene, true);
end;
$$;

create or replace function public.reserve_company_player_setup(
  p_game_id uuid,
  p_setup_id uuid,
  p_player jsonb,
  p_opening_plan jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_game public.games%rowtype;
  v_master public.game_master%rowtype;
  v_save public.game_save%rowtype;
  v_data jsonb;
  v_existing_setup jsonb;
  v_name text;
  v_department text;
  v_position text;
  v_body_type text;
  v_speech_style text;
  v_height integer;
  v_weight integer;
  v_penis integer;
  v_primary text;
  v_supporting jsonb;
  v_item text;
begin
  if p_player is null or jsonb_typeof(p_player) <> 'object' then
    raise exception 'player must be an object' using errcode = '22023';
  end if;
  if p_opening_plan is null or jsonb_typeof(p_opening_plan) <> 'object' then
    raise exception 'opening plan must be an object' using errcode = '22023';
  end if;

  v_name := btrim(coalesce(p_player ->> 'name', ''));
  v_department := nullif(btrim(p_player ->> 'department_id'), '');
  v_position := nullif(btrim(p_player ->> 'position_id'), '');
  v_body_type := nullif(btrim(p_player ->> 'body_type_id'), '');
  v_speech_style := nullif(btrim(p_player ->> 'speech_style_id'), '');
  if char_length(v_name) < 1 or char_length(v_name) > 20 then
    raise exception 'player name must be 1-20 characters' using errcode = '22023';
  end if;
  if v_department is null or v_position is null or v_body_type is null or v_speech_style is null then
    raise exception 'player catalog ids must be non-empty strings' using errcode = '22023';
  end if;

  if coalesce(p_player ->> 'height_cm','') !~ '^[0-9]+$'
     or coalesce(p_player ->> 'weight_kg','') !~ '^[0-9]+$'
     or coalesce(p_player ->> 'penis_length_cm','') !~ '^[0-9]+$' then
    raise exception 'body measurements must be integers' using errcode = '22023';
  end if;
  v_height := (p_player ->> 'height_cm')::integer;
  v_weight := (p_player ->> 'weight_kg')::integer;
  v_penis := (p_player ->> 'penis_length_cm')::integer;
  if v_height < 140 or v_height > 220 then
    raise exception 'height_cm out of range' using errcode = '22023';
  end if;
  if v_weight < 40 or v_weight > 180 then
    raise exception 'weight_kg out of range' using errcode = '22023';
  end if;
  if v_penis < 5 or v_penis > 30 then
    raise exception 'penis_length_cm out of range' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_opening_plan ->> 'weekday','')), '') is null then
    raise exception 'opening weekday must be a non-empty string' using errcode = '22023';
  end if;
  if coalesce(p_opening_plan ->> 'minute_of_day','') !~ '^[0-9]+$'
     or (p_opening_plan ->> 'minute_of_day')::integer < 510
     or (p_opening_plan ->> 'minute_of_day')::integer > 1110 then
    raise exception 'opening minute_of_day out of range' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_opening_plan ->> 'location_id','')), '') is null
     or nullif(btrim(coalesce(p_opening_plan ->> 'work_hook_id','')), '') is null
     or nullif(btrim(coalesce(p_opening_plan ->> 'scene_goal','')), '') is null then
    raise exception 'opening plan is incomplete' using errcode = '22023';
  end if;
  v_primary := nullif(btrim(p_opening_plan ->> 'primary_character_id'), '');
  if v_primary is null then
    raise exception 'opening primary character id must be non-empty' using errcode = '22023';
  end if;
  v_supporting := coalesce(p_opening_plan -> 'supporting_character_ids', '[]'::jsonb);
  if jsonb_typeof(v_supporting) <> 'array' or jsonb_array_length(v_supporting) > 1 then
    raise exception 'supporting_character_ids must contain at most one id' using errcode = '22023';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(v_supporting) item
    where jsonb_typeof(item) <> 'string'
      or nullif(btrim(item #>> '{}'), '') is null
  ) then
    raise exception 'supporting_character_ids must contain non-empty ids' using errcode = '22023';
  end if;
  for v_item in select btrim(value) from jsonb_array_elements_text(v_supporting) item(value)
  loop
    if v_item = v_primary then
      raise exception 'supporting character id duplicates primary id' using errcode = '22023';
    end if;
  end loop;

  select * into v_game from public.games where id = p_game_id;
  if not found or v_game.edition_id <> 'company-v1' then
    raise exception 'company game not found' using errcode = 'P0002';
  end if;
  select * into v_master from public.game_master where game_id = p_game_id;
  if not found then
    raise exception 'company game master not found' using errcode = 'P0002';
  end if;
  if not coalesce(
    (jsonb_typeof(v_master.data -> 'characters') = 'object' and (v_master.data -> 'characters') ? v_primary)
    or (jsonb_typeof(v_master.data -> 'general_npcs') = 'object' and (v_master.data -> 'general_npcs') ? v_primary),
    false
  ) then
    raise exception 'opening primary character id is not registered' using errcode = '22023';
  end if;
  for v_item in select btrim(value) from jsonb_array_elements_text(v_supporting) item(value)
  loop
    if not coalesce(
      (jsonb_typeof(v_master.data -> 'characters') = 'object' and (v_master.data -> 'characters') ? v_item)
      or (jsonb_typeof(v_master.data -> 'general_npcs') = 'object' and (v_master.data -> 'general_npcs') ? v_item),
      false
    ) then
      raise exception 'opening supporting character id is not registered' using errcode = '22023';
    end if;
  end loop;
  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then
    raise exception 'company save not found' using errcode = 'P0002';
  end if;
  if v_save.committed_turn <> 0 then
    raise exception 'player setup is allowed only before turn 1' using errcode = '22023';
  end if;

  v_existing_setup := coalesce(v_save.data -> 'player_setup', '{}'::jsonb);
  if coalesce((v_existing_setup ->> 'completed')::boolean, false) then
    if v_existing_setup ->> 'setup_id' = p_setup_id::text then
      return jsonb_build_object('success', true, 'idempotent', true, 'data', v_save.data);
    end if;
    raise exception 'player setup already completed' using errcode = '23505';
  end if;
  if nullif(v_existing_setup ->> 'setup_id','') is not null
     and v_existing_setup ->> 'setup_id' <> p_setup_id::text then
    raise exception 'another player setup is already reserved' using errcode = '23505';
  end if;

  v_data := v_save.data;
  v_data := jsonb_set(v_data, '{player}', jsonb_build_object(
    'player_id', 'player-1', 'adult', true, 'name', v_name,
    'department_id', v_department, 'position_id', v_position,
    'height_cm', v_height, 'weight_kg', v_weight, 'penis_length_cm', v_penis,
    'body_type_id', v_body_type, 'speech_style_id', v_speech_style, 'background', ''
  ), true);
  v_data := jsonb_set(v_data, '{player_setup}', jsonb_build_object(
    'version', 1, 'setup_id', p_setup_id::text, 'status', 'reserved', 'completed', false
  ), true);
  v_data := jsonb_set(v_data, '{opening_state}', jsonb_build_object(
    'setup_id', p_setup_id::text, 'status', 'planned', 'plan', p_opening_plan
  ), true);
  v_data := jsonb_set(v_data, '{world_state}', coalesce(v_data -> 'world_state','{}'::jsonb) || jsonb_build_object(
    'game_time', jsonb_build_object('day', 1, 'minute_of_day', (p_opening_plan ->> 'minute_of_day')::integer),
    'weekday', p_opening_plan ->> 'weekday', 'date_label', coalesce(p_opening_plan ->> 'date_label', 'Day 1'),
    'time_block', case
      when (p_opening_plan ->> 'minute_of_day')::integer < 720 then 'morning'
      when (p_opening_plan ->> 'minute_of_day')::integer < 1080 then 'afternoon'
      else 'evening'
    end,
    'work_hook', jsonb_build_object('id', p_opening_plan ->> 'work_hook_id', 'status', 'open')
  ), true);
  v_data := jsonb_set(v_data, '{player_scene_state}', jsonb_build_object(
    'updated_turn', 0,
    'clothing', jsonb_build_object('uniform_top','worn','uniform_bottom','worn','underwear_top','worn','underwear_bottom','worn')
  ), true);
  v_data := jsonb_set(v_data, '{npc_scene_state}', coalesce(v_data -> 'npc_scene_state', '{}'::jsonb), true);
  v_data := v_data - 'scene_state' - 'last_npcs_present' - 'focal_character_id' - 'last_speaker_id';
  v_data := jsonb_set(v_data, '{last_choices}', '[]'::jsonb, true);
  v_data := jsonb_set(v_data, '{last_choice_meta}', '[]'::jsonb, true);
  v_data := public.company_apply_opening_scene_v1(public.company_apply_initial_clothing_v2(v_data));

  update public.game_save set data = v_data, save_revision = save_revision + 1, updated_at = now() where game_id = p_game_id;
  return jsonb_build_object('success', true, 'idempotent', false, 'setup_id', p_setup_id, 'opening_plan', p_opening_plan);
end;
$$;

revoke all on function public.company_apply_opening_scene_v1(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.reserve_company_player_setup(uuid, uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.reserve_company_player_setup(uuid, uuid, jsonb, jsonb) to service_role;
