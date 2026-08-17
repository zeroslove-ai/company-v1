-- Company v1 Cut 2 Scene Authority, Stage A.
-- Additive source only. Apply after review; it is intentionally compatible with
-- legacy saves and does not remove any historical scene fields.

create or replace function public.company_validate_scene_v1(
  p_save jsonb,
  p_require_scene boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_scene jsonb;
  v_key text;
  v_errors text[] := '{}';
  v_required_scene_keys text[] := array['version','scene_id','location_id','beat','goal','focus_thread','present_npc_ids','focal_character_id','last_speaker_id','updated_turn'];
begin
  if p_save is null or jsonb_typeof(p_save) <> 'object' then
    return jsonb_build_object('valid', false, 'errors', jsonb_build_array('save must be an object'));
  end if;
  if not (p_save ? 'scene') then
    if p_require_scene then v_errors := array_append(v_errors, 'missing required key: scene'); end if;
    return jsonb_build_object('valid', coalesce(array_length(v_errors, 1), 0) = 0, 'errors', to_jsonb(v_errors));
  end if;
  v_scene := p_save -> 'scene';
  if jsonb_typeof(v_scene) <> 'object' then
    return jsonb_build_object('valid', false, 'errors', jsonb_build_array('scene must be an object'));
  end if;
  foreach v_key in array v_required_scene_keys loop
    if not (v_scene ? v_key) then v_errors := array_append(v_errors, format('missing required key: scene.%s', v_key)); end if;
  end loop;
  if v_scene ->> 'version' <> '1' then v_errors := array_append(v_errors, 'scene.version must be 1'); end if;
  if jsonb_typeof(v_scene -> 'present_npc_ids') <> 'array' then
    v_errors := array_append(v_errors, 'scene.present_npc_ids must be an array');
  else
    if exists (
      select 1 from jsonb_array_elements_text(v_scene -> 'present_npc_ids') value
      where nullif(btrim(value), '') is null or value ~* '^player([_-]|$)'
    ) then v_errors := array_append(v_errors, 'scene.present_npc_ids contains invalid id'); end if;
    if (select count(*) from jsonb_array_elements_text(v_scene -> 'present_npc_ids'))
       <> (select count(distinct value) from jsonb_array_elements_text(v_scene -> 'present_npc_ids')) then
      v_errors := array_append(v_errors, 'scene.present_npc_ids must be unique');
    end if;
  end if;
  if (v_scene -> 'scene_id') is not null and jsonb_typeof(v_scene -> 'scene_id') <> 'string' and v_scene -> 'scene_id' <> 'null'::jsonb then v_errors := array_append(v_errors, 'scene.scene_id must be string or null'); end if;
  if (v_scene -> 'location_id') is not null and jsonb_typeof(v_scene -> 'location_id') <> 'string' and v_scene -> 'location_id' <> 'null'::jsonb then v_errors := array_append(v_errors, 'scene.location_id must be string or null'); end if;
  if (v_scene -> 'goal') is not null and jsonb_typeof(v_scene -> 'goal') <> 'string' and v_scene -> 'goal' <> 'null'::jsonb then v_errors := array_append(v_errors, 'scene.goal must be string or null'); end if;
  if (v_scene -> 'focus_thread') is not null and jsonb_typeof(v_scene -> 'focus_thread') <> 'string' and v_scene -> 'focus_thread' <> 'null'::jsonb then v_errors := array_append(v_errors, 'scene.focus_thread must be string or null'); end if;
  if (v_scene -> 'focal_character_id') is not null and jsonb_typeof(v_scene -> 'focal_character_id') <> 'string' and v_scene -> 'focal_character_id' <> 'null'::jsonb then v_errors := array_append(v_errors, 'scene.focal_character_id must be string or null'); end if;
  if (v_scene -> 'last_speaker_id') is not null and jsonb_typeof(v_scene -> 'last_speaker_id') <> 'string' and v_scene -> 'last_speaker_id' <> 'null'::jsonb then v_errors := array_append(v_errors, 'scene.last_speaker_id must be string or null'); end if;
  if (v_scene ->> 'beat') !~ '^[0-9]+$' or (v_scene ->> 'updated_turn') !~ '^[0-9]+$' then v_errors := array_append(v_errors, 'scene.beat and scene.updated_turn must be non-negative integers'); end if;
  if v_scene -> 'focal_character_id' <> 'null'::jsonb and not exists (select 1 from jsonb_array_elements_text(v_scene -> 'present_npc_ids') value where value = v_scene ->> 'focal_character_id') then v_errors := array_append(v_errors, 'scene.focal_character_id must be present'); end if;
  return jsonb_build_object('valid', coalesce(array_length(v_errors, 1), 0) = 0, 'errors', to_jsonb(v_errors));
end;
$$;

create or replace function public.company_bootstrap_scene_v1(p_data jsonb)
returns jsonb
language plpgsql
immutable
security definer
set search_path = public, pg_temp
as $$
declare
  v_scene jsonb;
  v_participants jsonb;
  v_present jsonb;
begin
  if jsonb_typeof(p_data) <> 'object' then raise exception 'save must be an object' using errcode = '22023'; end if;
  if jsonb_typeof(p_data -> 'scene') = 'object' and p_data -> 'scene' ->> 'version' = '1' then return p_data; end if;
  v_participants := case when jsonb_typeof(p_data -> 'scene_state' -> 'participants') = 'array' then p_data -> 'scene_state' -> 'participants' else coalesce(p_data -> 'last_npcs_present', '[]'::jsonb) end;
  select coalesce(jsonb_agg(value), '[]'::jsonb) into v_present
  from jsonb_array_elements_text(v_participants) item(value)
  where value !~* '^player([_-]|$)';
  v_scene := jsonb_build_object(
    'version', 1,
    'scene_id', coalesce(p_data -> 'scene_state' -> 'scene_id', 'null'::jsonb),
    'location_id', coalesce(p_data -> 'scene_state' -> 'location_id', 'null'::jsonb),
    'beat', coalesce(p_data -> 'scene_state' -> 'beat', '0'::jsonb),
    'goal', coalesce(p_data -> 'scene_state' -> 'scene_goal', 'null'::jsonb),
    'focus_thread', coalesce(p_data -> 'scene_state' -> 'focus_thread', 'null'::jsonb),
    'present_npc_ids', v_present,
    'focal_character_id', coalesce(p_data -> 'focal_character_id', 'null'::jsonb),
    'last_speaker_id', coalesce(p_data -> 'last_speaker_id', 'null'::jsonb),
    'updated_turn', coalesce(p_data -> 'scene_state' -> 'updated_turn', '0'::jsonb)
  );
  return jsonb_set(p_data, '{scene}', v_scene, true);
end;
$$;

-- Keep the existing save contract while adding validation when scene is present.
create or replace function public.validate_company_save_v1(p_save jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_errors text[] := '{}';
  v_key text;
  v_required text[] := array['save_schema_version','edition','turn_state','player','player_scene_state','player_sexual_state','world_state','scene_state','npc_stats','npc_emotion','npc_relationship_state','npc_scene_state','npc_work_state','csa_active','csa_rules','csa_attitudes','csa_runtime_state','csa_aftereffect_state','event_ledger','story_summary_overall','story_summary_recent','focal_character_id','last_speaker_id','last_npcs_present','last_image_id','last_choices','last_choice_meta'];
  v_scene_check jsonb;
begin
  if p_save is null or jsonb_typeof(p_save) <> 'object' then return jsonb_build_object('valid', false, 'errors', jsonb_build_array('save must be an object')); end if;
  foreach v_key in array v_required loop if not (p_save ? v_key) then v_errors := array_append(v_errors, format('missing required key: %s', v_key)); end if; end loop;
  if p_save ->> 'save_schema_version' <> '1' then v_errors := array_append(v_errors, 'save_schema_version must be 1'); end if;
  if p_save ->> 'edition' <> 'company-v1' then v_errors := array_append(v_errors, 'edition must be company-v1'); end if;
  if jsonb_typeof(p_save -> 'csa_active') <> 'array' or jsonb_array_length(p_save -> 'csa_active') > 5 then v_errors := array_append(v_errors, 'csa_active must be an array with at most five items'); end if;
  if jsonb_typeof(p_save -> 'event_ledger') <> 'array' then v_errors := array_append(v_errors, 'event_ledger must be an array'); end if;
  if jsonb_typeof(p_save -> 'last_choices') <> 'array' then v_errors := array_append(v_errors, 'last_choices must be an array'); end if;
  if jsonb_typeof(p_save -> 'last_npcs_present') <> 'array' then v_errors := array_append(v_errors, 'last_npcs_present must be an array'); end if;
  if jsonb_typeof(p_save -> 'turn_state') <> 'object' then v_errors := array_append(v_errors, 'turn_state must be an object'); end if;
  if jsonb_typeof(p_save -> 'scene_state') <> 'object' then v_errors := array_append(v_errors, 'scene_state must be an object'); end if;
  v_scene_check := public.company_validate_scene_v1(p_save, false);
  if not coalesce((v_scene_check ->> 'valid')::boolean, false) then v_errors := v_errors || array(select jsonb_array_elements_text(v_scene_check -> 'errors')); end if;
  return jsonb_build_object('valid', coalesce(array_length(v_errors, 1), 0) = 0, 'errors', to_jsonb(v_errors));
end;
$$;

create or replace function public.reset_company_game(p_game_id uuid, p_expected_title text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_game public.games%rowtype; v_master public.game_master%rowtype; v_save public.game_save%rowtype; v_data jsonb; v_validation jsonb;
begin
  select * into v_game from public.games where id = p_game_id for update;
  if not found or v_game.edition_id <> 'company-v1' or v_game.title <> p_expected_title then raise exception 'company game identity mismatch' using errcode = '22023'; end if;
  select * into v_master from public.game_master where game_id = p_game_id;
  select * into v_save from public.game_save where game_id = p_game_id for update;
  v_data := public.company_bootstrap_scene_v1(v_master.initial_save);
  v_validation := public.validate_company_save_v1(v_data);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then raise exception 'invalid reset initial save: %', v_validation -> 'errors' using errcode = '22023'; end if;
  delete from public.game_turns where game_id = p_game_id;
  delete from public.game_actions where game_id = p_game_id;
  update public.game_save set committed_turn = 0, save_revision = v_save.save_revision + 1, data = v_data, updated_at = now() where game_id = p_game_id;
  return jsonb_build_object('success', true, 'game_id', p_game_id, 'committed_turn', 0);
end;
$$;

revoke all on function public.company_validate_scene_v1(jsonb, boolean) from public, anon, authenticated;
revoke all on function public.company_bootstrap_scene_v1(jsonb) from public, anon, authenticated;
revoke all on function public.validate_company_save_v1(jsonb) from public, anon, authenticated;
revoke all on function public.reset_company_game(uuid, text) from public, anon, authenticated;
grant execute on function public.validate_company_save_v1(jsonb) to service_role;
grant execute on function public.reset_company_game(uuid, text) to service_role;
