-- Company v1 Cut 2 Scene Authority, Stage B.
-- Apply only after the API has been cut over to canonical scene readers and
-- Stage A has passed live validation. Legacy scene projections remain optional
-- mirrors, but are no longer structural requirements.

create or replace function public.validate_company_save_v1(p_save jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_errors text[] := '{}';
  v_key text;
  v_required text[] := array['save_schema_version','edition','turn_state','player','scene','player_scene_state','player_sexual_state','world_state','npc_stats','npc_emotion','npc_relationship_state','npc_scene_state','npc_work_state','csa_active','csa_rules','csa_attitudes','csa_runtime_state','csa_aftereffect_state','event_ledger','story_summary_overall','story_summary_recent','last_image_id','last_choices','last_choice_meta'];
  v_scene_check jsonb;
begin
  if p_save is null or jsonb_typeof(p_save) <> 'object' then return jsonb_build_object('valid', false, 'errors', jsonb_build_array('save must be an object')); end if;
  foreach v_key in array v_required loop if not (p_save ? v_key) then v_errors := array_append(v_errors, format('missing required key: %s', v_key)); end if; end loop;
  if p_save ->> 'save_schema_version' <> '1' then v_errors := array_append(v_errors, 'save_schema_version must be 1'); end if;
  if p_save ->> 'edition' <> 'company-v1' then v_errors := array_append(v_errors, 'edition must be company-v1'); end if;
  if jsonb_typeof(p_save -> 'csa_active') <> 'array' or jsonb_array_length(p_save -> 'csa_active') > 5 then v_errors := array_append(v_errors, 'csa_active must be an array with at most five items'); end if;
  if jsonb_typeof(p_save -> 'event_ledger') <> 'array' then v_errors := array_append(v_errors, 'event_ledger must be an array'); end if;
  if jsonb_typeof(p_save -> 'last_choices') <> 'array' then v_errors := array_append(v_errors, 'last_choices must be an array'); end if;
  if jsonb_typeof(p_save -> 'turn_state') <> 'object' then v_errors := array_append(v_errors, 'turn_state must be an object'); end if;
  if jsonb_typeof(p_save -> 'scene_state') not in ('object', 'null') and (p_save ? 'scene_state') then v_errors := array_append(v_errors, 'scene_state must be an object when present'); end if;
  if jsonb_typeof(p_save -> 'last_npcs_present') not in ('array', 'null') and (p_save ? 'last_npcs_present') then v_errors := array_append(v_errors, 'last_npcs_present must be an array when present'); end if;
  if jsonb_typeof(p_save -> 'focal_character_id') not in ('string', 'null') and (p_save ? 'focal_character_id') then v_errors := array_append(v_errors, 'focal_character_id must be string or null when present'); end if;
  if jsonb_typeof(p_save -> 'last_speaker_id') not in ('string', 'null') and (p_save ? 'last_speaker_id') then v_errors := array_append(v_errors, 'last_speaker_id must be string or null when present'); end if;
  v_scene_check := public.company_validate_scene_v1(p_save, true);
  if not coalesce((v_scene_check ->> 'valid')::boolean, false) then v_errors := v_errors || array(select jsonb_array_elements_text(v_scene_check -> 'errors')); end if;
  return jsonb_build_object('valid', coalesce(array_length(v_errors, 1), 0) = 0, 'errors', to_jsonb(v_errors));
end;
$$;

revoke all on function public.validate_company_save_v1(jsonb) from public, anon, authenticated;
grant execute on function public.validate_company_save_v1(jsonb) to service_role;
