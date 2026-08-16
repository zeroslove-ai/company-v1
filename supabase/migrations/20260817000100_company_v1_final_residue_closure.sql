-- Final Minimal Story Runtime residue closure (source only; do not apply in this cut).
-- Fresh save/reset/opening writers keep canonical scene, committed choices in history,
-- and narrow physical/clothing state. Historical rows and migrations remain immutable.

create or replace function public.company_minimalize_save_v1(p_data jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_data jsonb := coalesce(p_data, '{}'::jsonb);
  v_player_scene jsonb;
  v_npc_scene jsonb;
  v_id text;
  v_state jsonb;
begin
  if jsonb_typeof(v_data) <> 'object' then return '{}'::jsonb; end if;

  v_data := v_data
    - 'npc_stats'
    - 'npc_relationship_state'
    - 'csa_attitudes'
    - 'csa_runtime_state'
    - 'csa_aftereffect_state'
    - 'sexual_event_ledger'
    - 'last_image_id'
    - 'last_choices'
    - 'last_choice_meta'
    - 'story_summary_overall'
    - 'story_summary_recent'
    - 'npc_emotion'
    - 'npc_work_state'
    - 'event_ledger';

  if jsonb_typeof(v_data -> 'scene') = 'object' then
    v_data := v_data - 'scene_state' - 'last_npcs_present' - 'focal_character_id' - 'last_speaker_id';
  end if;

  v_player_scene := v_data -> 'player_scene_state';
  if jsonb_typeof(v_player_scene) = 'object' then
    v_data := jsonb_set(v_data, '{player_scene_state}', v_player_scene - 'location_id' - 'location_label', true);
  end if;

  v_npc_scene := v_data -> 'npc_scene_state';
  if jsonb_typeof(v_npc_scene) = 'object' then
    for v_id, v_state in select key, value from jsonb_each(v_npc_scene)
    loop
      if jsonb_typeof(v_state) <> 'object' then v_state := '{}'::jsonb; end if;
      v_npc_scene := jsonb_set(v_npc_scene, array[v_id], v_state - 'present' - 'scene_id' - 'location_id' - 'location_label', true);
    end loop;
    v_data := jsonb_set(v_data, '{npc_scene_state}', v_npc_scene, true);
  end if;

  return v_data;
end;
$$;

create or replace function public.validate_company_save_v1(p_save jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_errors text[] := '{}';
  v_key text;
  v_required text[] := array[
    'save_schema_version', 'edition', 'turn_state', 'player', 'scene',
    'player_scene_state', 'player_sexual_state', 'world_state',
    'npc_scene_state', 'csa_active', 'csa_rules'
  ];
  v_scene_check jsonb;
begin
  if p_save is null or jsonb_typeof(p_save) <> 'object' then
    return jsonb_build_object('valid', false, 'errors', jsonb_build_array('save must be an object'));
  end if;
  foreach v_key in array v_required loop
    if not (p_save ? v_key) then v_errors := array_append(v_errors, format('missing required key: %s', v_key)); end if;
  end loop;
  if p_save ->> 'save_schema_version' <> '1' then v_errors := array_append(v_errors, 'save_schema_version must be 1'); end if;
  if p_save ->> 'edition' <> 'company-v1' then v_errors := array_append(v_errors, 'edition must be company-v1'); end if;
  if jsonb_typeof(p_save -> 'csa_active') <> 'array' or jsonb_array_length(p_save -> 'csa_active') > 5 then v_errors := array_append(v_errors, 'csa_active must be an array with at most five items'); end if;
  if jsonb_typeof(p_save -> 'turn_state') <> 'object' then v_errors := array_append(v_errors, 'turn_state must be an object'); end if;
  v_scene_check := public.company_validate_scene_v1(p_save, true);
  if not coalesce((v_scene_check ->> 'valid')::boolean, false) then v_errors := v_errors || array(select jsonb_array_elements_text(v_scene_check -> 'errors')); end if;
  return jsonb_build_object('valid', coalesce(array_length(v_errors, 1), 0) = 0, 'errors', to_jsonb(v_errors));
end;
$$;

revoke all on function public.company_minimalize_save_v1(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.validate_company_save_v1(jsonb) from public, anon, authenticated;
grant execute on function public.validate_company_save_v1(jsonb) to service_role;
