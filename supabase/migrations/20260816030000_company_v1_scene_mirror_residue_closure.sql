-- Company v1: converge setup/opening/reset output on canonical scene v1.
-- Historical migrations remain immutable. Apply only after independent review.

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
  if v_primary not in ('heroine1', 'heroine2', 'heroine3', 'heroine4', 'heroine5') then
    raise exception 'invalid opening primary character' using errcode = '22023';
  end if;

  v_supporting := coalesce(v_plan -> 'supporting_character_ids', '[]'::jsonb);
  if jsonb_typeof(v_supporting) <> 'array' or jsonb_array_length(v_supporting) > 1 then
    raise exception 'opening supporting characters must contain at most one id' using errcode = '22023';
  end if;
  v_present_ids := array[v_primary];
  for v_id in select jsonb_array_elements_text(v_supporting)
  loop
    if v_id = v_primary or v_id not in ('heroine1', 'heroine2', 'heroine3', 'heroine4', 'heroine5') then
      raise exception 'invalid opening supporting character' using errcode = '22023';
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

create or replace function public.validate_company_save_v1(p_save jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_errors text[] := '{}';
  v_key text;
  v_required text[] := array[
    'save_schema_version', 'edition', 'turn_state', 'player', 'scene',
    'player_scene_state', 'player_sexual_state', 'world_state',
    'npc_stats', 'npc_relationship_state', 'npc_scene_state', 'csa_active',
    'csa_rules', 'csa_attitudes', 'csa_runtime_state', 'csa_aftereffect_state',
    'last_image_id', 'last_choices', 'last_choice_meta'
  ];
  v_scene_check jsonb;
begin
  if p_save is null or jsonb_typeof(p_save) <> 'object' then
    return jsonb_build_object('valid', false, 'errors', jsonb_build_array('save must be an object'));
  end if;
  foreach v_key in array v_required loop
    if not (p_save ? v_key) then
      v_errors := array_append(v_errors, format('missing required key: %s', v_key));
    end if;
  end loop;
  if p_save ->> 'save_schema_version' <> '1' then v_errors := array_append(v_errors, 'save_schema_version must be 1'); end if;
  if p_save ->> 'edition' <> 'company-v1' then v_errors := array_append(v_errors, 'edition must be company-v1'); end if;
  if jsonb_typeof(p_save -> 'csa_active') <> 'array' or jsonb_array_length(p_save -> 'csa_active') > 5 then v_errors := array_append(v_errors, 'csa_active must be an array with at most five items'); end if;
  if jsonb_typeof(p_save -> 'last_choices') <> 'array' then v_errors := array_append(v_errors, 'last_choices must be an array'); end if;
  if jsonb_typeof(p_save -> 'turn_state') <> 'object' then v_errors := array_append(v_errors, 'turn_state must be an object'); end if;
  v_scene_check := public.company_validate_scene_v1(p_save, true);
  if not coalesce((v_scene_check ->> 'valid')::boolean, false) then v_errors := v_errors || array(select jsonb_array_elements_text(v_scene_check -> 'errors')); end if;
  return jsonb_build_object('valid', coalesce(array_length(v_errors, 1), 0) = 0, 'errors', to_jsonb(v_errors));
end;
$$;

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
  v_player_scene jsonb;
  v_npc_scene jsonb;
  v_id text;
  v_state jsonb;
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

  v_data := public.company_bootstrap_scene_v1(v_master.initial_save
    - 'story_summary_overall' - 'story_summary_recent' - 'npc_emotion' - 'npc_work_state' - 'event_ledger');
  v_data := v_data - 'scene_state' - 'last_npcs_present' - 'focal_character_id' - 'last_speaker_id';
  v_player_scene := coalesce(v_data -> 'player_scene_state', '{}'::jsonb);
  if jsonb_typeof(v_player_scene) <> 'object' then v_player_scene := '{}'::jsonb; end if;
  v_data := jsonb_set(v_data, '{player_scene_state}', v_player_scene - 'location_id', true);
  v_npc_scene := coalesce(v_data -> 'npc_scene_state', '{}'::jsonb);
  if jsonb_typeof(v_npc_scene) <> 'object' then v_npc_scene := '{}'::jsonb; end if;
  for v_id, v_state in select key, value from jsonb_each(v_npc_scene)
  loop
    if jsonb_typeof(v_state) <> 'object' then v_state := '{}'::jsonb; end if;
    v_npc_scene := jsonb_set(v_npc_scene, array[v_id], v_state - 'present' - 'scene_id' - 'location_id', true);
  end loop;
  v_data := public.company_apply_initial_clothing_v2(jsonb_set(v_data, '{npc_scene_state}', v_npc_scene, true));
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

revoke all on function public.validate_company_save_v1(jsonb) from public, anon, authenticated;
grant execute on function public.validate_company_save_v1(jsonb) to service_role;
revoke all on function public.reset_company_game(uuid, text) from public, anon, authenticated;
grant execute on function public.reset_company_game(uuid, text) to service_role;
