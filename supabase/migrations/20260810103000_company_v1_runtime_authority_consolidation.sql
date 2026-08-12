-- Canonical runtime authority consolidation. Historical migrations remain immutable.
-- Direct canonical writers replace the legacy_v2 aliases before those aliases are dropped.

create or replace function public.reserve_company_player_setup(p_game_id uuid, p_setup_id uuid, p_player jsonb, p_opening_plan jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_game public.games%rowtype;
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
  v_participants jsonb;
  v_npc_scene jsonb := '{}'::jsonb;
  v_item text;
begin
  if p_player is null or jsonb_typeof(p_player) <> 'object' then
    raise exception 'player must be an object' using errcode = '22023';
  end if;
  if p_opening_plan is null or jsonb_typeof(p_opening_plan) <> 'object' then
    raise exception 'opening plan must be an object' using errcode = '22023';
  end if;

  v_name := btrim(coalesce(p_player ->> 'name', ''));
  v_department := p_player ->> 'department_id';
  v_position := p_player ->> 'position_id';
  v_body_type := p_player ->> 'body_type_id';
  v_speech_style := p_player ->> 'speech_style_id';

  if char_length(v_name) < 1 or char_length(v_name) > 20 then
    raise exception 'player name must be 1-20 characters' using errcode = '22023';
  end if;
  if not (v_department = any(array['brand_strategy','audit','human_resources','new_business_tf','finance_planning','public_relations'])) then
    raise exception 'invalid department_id' using errcode = '22023';
  end if;
  if not (v_position = any(array['intern','assistant_manager','tf_lead','executive'])) then
    raise exception 'invalid position_id' using errcode = '22023';
  end if;
  if not (v_body_type = any(array['balanced','muscular','athletic','slender','large_frame'])) then
    raise exception 'invalid body_type_id' using errcode = '22023';
  end if;
  if not (v_speech_style = any(array['polite','calm','friendly','playful','cold','rough_yangachi'])) then
    raise exception 'invalid speech_style_id' using errcode = '22023';
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

  if coalesce(p_opening_plan ->> 'weekday','') not in ('???','???','???','???','???') then
    raise exception 'invalid opening weekday' using errcode = '22023';
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
  v_primary := p_opening_plan ->> 'primary_character_id';
  if not (v_primary = any(array['heroine1','heroine2','heroine3','heroine4','heroine5'])) then
    raise exception 'invalid primary_character_id' using errcode = '22023';
  end if;
  v_supporting := coalesce(p_opening_plan -> 'supporting_character_ids', '[]'::jsonb);
  if jsonb_typeof(v_supporting) <> 'array' or jsonb_array_length(v_supporting) > 1 then
    raise exception 'supporting_character_ids must contain at most one id' using errcode = '22023';
  end if;
  for v_item in select jsonb_array_elements_text(v_supporting)
  loop
    if not (v_item = any(array['heroine1','heroine2','heroine3','heroine4','heroine5']))
       or v_item = v_primary then
      raise exception 'invalid supporting character id' using errcode = '22023';
    end if;
  end loop;

  select * into v_game from public.games where id = p_game_id;
  if not found or v_game.edition_id <> 'company-v1' then
    raise exception 'company game not found' using errcode = 'P0002';
  end if;
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

  v_participants := jsonb_build_array('player-1', v_primary) || v_supporting;
  v_npc_scene := jsonb_build_object(v_primary, jsonb_build_object(
    'present', true,
    'clothing', jsonb_build_object('uniform_top','worn','uniform_bottom','worn','underwear_top','worn','underwear_bottom','worn')
  ));
  for v_item in select jsonb_array_elements_text(v_supporting)
  loop
    v_npc_scene := v_npc_scene || jsonb_build_object(v_item, jsonb_build_object(
      'present', true,
      'clothing', jsonb_build_object('uniform_top','worn','uniform_bottom','worn','underwear_top','worn','underwear_bottom','worn')
    ));
  end loop;

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
  v_data := jsonb_set(v_data, '{scene_state}', jsonb_build_object(
    'scene_id', 'opening', 'location_id', p_opening_plan ->> 'location_id', 'participants', v_participants,
    'focus_thread', p_opening_plan ->> 'work_hook_id', 'scene_goal', p_opening_plan ->> 'scene_goal',
    'beat', 0, 'exit_conditions', '[]'::jsonb, 'updated_turn', 0
  ), true);
  v_data := jsonb_set(v_data, '{player_scene_state}', jsonb_build_object(
    'location_id', p_opening_plan ->> 'location_id', 'updated_turn', 0,
    'clothing', jsonb_build_object('uniform_top','worn','uniform_bottom','worn','underwear_top','worn','underwear_bottom','worn')
  ), true);
  v_data := jsonb_set(v_data, '{npc_scene_state}', v_npc_scene, true);
  v_data := jsonb_set(v_data, '{focal_character_id}', to_jsonb(v_primary), true);
  v_data := jsonb_set(v_data, '{last_speaker_id}', 'null'::jsonb, true);
  v_data := jsonb_set(v_data, '{last_npcs_present}', jsonb_build_array(v_primary) || v_supporting, true);
  v_data := jsonb_set(v_data, '{last_choices}', '[]'::jsonb, true);
  v_data := jsonb_set(v_data, '{last_choice_meta}', '[]'::jsonb, true);

  v_data := public.company_apply_opening_scene_v1(public.company_apply_initial_clothing_v2(v_data));
  update public.game_save set data = v_data, save_revision = save_revision + 1, updated_at = now() where game_id = p_game_id;
  return jsonb_build_object('success', true, 'idempotent', false, 'setup_id', p_setup_id, 'opening_plan', p_opening_plan);
end;
$$;

create or replace function public.commit_company_opening(p_game_id uuid, p_setup_id uuid, p_background text, p_story_text text, p_choices jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_game public.games%rowtype;
  v_save public.game_save%rowtype;
  v_data jsonb;
  v_setup jsonb;
  v_opening jsonb;
begin
  if char_length(btrim(coalesce(p_background,''))) > 120 then
    raise exception 'background must be at most 120 characters' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_story_text,'')), '') is null then
    raise exception 'opening story is required' using errcode = '22023';
  end if;
  if p_choices is null or jsonb_typeof(p_choices) <> 'array' or jsonb_array_length(p_choices) <> 4
     or exists (select 1 from jsonb_array_elements(p_choices) item where jsonb_typeof(item) <> 'string' or nullif(btrim(item #>> '{}'),'') is null) then
    p_choices := jsonb_build_array(
      '현재 대화를 조금 더 이어간다.',
      '상대에게 지금 상황을 차분히 물어본다.',
      '주변 반응을 잠시 살펴본다.',
      '대화를 정리하고 다음 행동을 생각한다.'
    );
  end if;

  select * into v_game from public.games where id = p_game_id;
  if not found or v_game.edition_id <> 'company-v1' then
    raise exception 'company game not found' using errcode = 'P0002';
  end if;
  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then
    raise exception 'company save not found' using errcode = 'P0002';
  end if;
  if v_save.committed_turn <> 0 then
    raise exception 'opening can be committed only before turn 1' using errcode = '22023';
  end if;

  v_setup := coalesce(v_save.data -> 'player_setup', '{}'::jsonb);
  v_opening := coalesce(v_save.data -> 'opening_state', '{}'::jsonb);
  if v_setup ->> 'setup_id' <> p_setup_id::text or v_opening ->> 'setup_id' <> p_setup_id::text then
    raise exception 'setup_id does not match reserved opening' using errcode = '22023';
  end if;
  if coalesce((v_setup ->> 'completed')::boolean, false) then
    return jsonb_build_object('success', true, 'idempotent', true, 'opening_state', v_opening);
  end if;

  v_data := v_save.data;
  v_data := jsonb_set(v_data, '{player,background}', to_jsonb(btrim(coalesce(p_background,''))), true);
  v_data := jsonb_set(v_data, '{player_setup}', v_setup || jsonb_build_object('status', 'complete', 'completed', true), true);
  v_data := jsonb_set(v_data, '{opening_state}', v_opening || jsonb_build_object('status', 'complete', 'story_text', p_story_text, 'choices', p_choices), true);
  v_data := jsonb_set(v_data, '{last_choices}', p_choices, true);
  v_data := jsonb_set(v_data, '{story_summary_overall}', to_jsonb(case when nullif(btrim(coalesce(p_background,'')),'') is null then '회사에서의 첫 장면이 시작되었다.' else btrim(p_background) end), true);
  v_data := jsonb_set(v_data, '{story_summary_recent}', to_jsonb(left(p_story_text, 500)), true);

  v_data := public.company_apply_opening_scene_v1(public.company_apply_initial_clothing_v2(v_data));
  update public.game_save set data = v_data, save_revision = save_revision + 1, updated_at = now() where game_id = p_game_id;
  return jsonb_build_object('success', true, 'idempotent', false, 'setup_id', p_setup_id, 'opening_state', v_data -> 'opening_state');
end;
$$;

create or replace function public.reset_company_game(
  p_game_id uuid,
  p_expected_title text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_game public.games%rowtype;
  v_master public.game_master%rowtype;
  v_save public.game_save%rowtype;
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
  v_validation := public.validate_company_save_v1(v_master.initial_save);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'invalid reset initial save: %', v_validation -> 'errors' using errcode = '22023';
  end if;

  delete from public.game_turns where game_id = p_game_id;
  delete from public.game_actions where game_id = p_game_id;
  update public.game_save
  set committed_turn = 0,
      save_revision = v_save.save_revision + 1,
      data = public.company_apply_initial_clothing_v2(v_master.initial_save)
  where game_id = p_game_id;

  return jsonb_build_object('success', true, 'game_id', p_game_id, 'committed_turn', 0);
end;
$$;

revoke all on function public.reserve_company_player_setup_legacy_v2(uuid, uuid, jsonb, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.commit_company_opening_legacy_v2(uuid, uuid, text, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.reset_company_game_legacy_v2(uuid, text) from public, anon, authenticated, service_role;

drop function if exists public.reserve_company_player_setup_legacy_v2(uuid, uuid, jsonb, jsonb);
drop function if exists public.commit_company_opening_legacy_v2(uuid, uuid, text, text, jsonb);
drop function if exists public.reset_company_game_legacy_v2(uuid, text);

revoke all on function public.reserve_company_player_setup(uuid, uuid, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.commit_company_opening(uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.reset_company_game(uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_company_player_setup(uuid, uuid, jsonb, jsonb) to service_role;
grant execute on function public.commit_company_opening(uuid, uuid, text, text, jsonb) to service_role;
grant execute on function public.reset_company_game(uuid, text) to service_role;
