-- REVIEW ARTIFACT ONLY -- do not apply this wrapper.
-- Generated mechanically from docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE.sql.
-- Exactly one top-level PostgreSQL statement: one DO block with one EXECUTE per original executable statement.
-- This artifact is for review of the prepared-statement channel only.

do $company_single_statement_wrapper$
begin
  execute $company_bridge_01$
create or replace function public.company_apply_opening_scene_v1(p_data jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_data jsonb := coalesce(p_data, '{}'::jsonb);
  v_plan jsonb := coalesce(v_data -> 'opening_state' -> 'plan', '{}'::jsonb);
  v_primary text := nullif(btrim(v_plan ->> 'primary_character_id'), '');
  v_location text := nullif(btrim(v_plan ->> 'location_id'), '');
  v_supporting jsonb := coalesce(v_plan -> 'supporting_character_ids', '[]'::jsonb);
  v_present text[] := array[]::text[];
  v_id text;
  v_scene jsonb;
begin
  if jsonb_typeof(v_plan) <> 'object' or v_primary is null or v_location is null then
    raise exception 'opening plan requires location and primary character' using errcode = '22023';
  end if;
  if jsonb_typeof(v_supporting) <> 'array' or jsonb_array_length(v_supporting) > 1 then
    raise exception 'supporting_character_ids must contain at most one id' using errcode = '22023';
  end if;
  v_present := array[v_primary];
  for v_id in select btrim(value) from jsonb_array_elements_text(v_supporting) item(value)
  loop
    if v_id = v_primary then raise exception 'supporting character duplicates primary id' using errcode = '22023'; end if;
    v_present := v_present || v_id;
  end loop;
  v_scene := jsonb_build_object(
    'version', 1, 'location_id', v_location, 'present_npc_ids', to_jsonb(v_present),
    'focal_character_id', v_primary, 'last_speaker_id', null, 'updated_turn', 0
  );
  v_data := jsonb_set(v_data, '{scene}', v_scene, true)
    - 'scene_state' - 'last_npcs_present' - 'focal_character_id' - 'last_speaker_id'
    - 'work_hook' - 'scene_goal';
  v_data := jsonb_set(v_data, '{world_state}', coalesce(v_data -> 'world_state', '{}'::jsonb) - 'work_hook', true);
  return v_data;
end;
$$
$company_bridge_01$;
  execute $company_bridge_02$
create or replace function public.company_minimalize_save_v1(p_data jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(p_data, '{}'::jsonb)
    - 'npc_stats' - 'npc_relationship_state' - 'csa_attitudes'
    - 'csa_runtime_state' - 'csa_aftereffect_state' - 'sexual_event_ledger'
    - 'last_image_id' - 'last_choices' - 'last_choice_meta'
    - 'story_summary_overall' - 'story_summary_recent' - 'npc_emotion'
    - 'npc_work_state' - 'event_ledger' - 'work_hook';
$$
$company_bridge_02$;
  execute $company_bridge_03$
create or replace function public.company_validate_scene_v1(p_save jsonb, p_require_scene boolean default true)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_scene jsonb := p_save -> 'scene';
  v_required text[] := array['version','location_id','present_npc_ids','focal_character_id','last_speaker_id','updated_turn'];
  v_key text;
  v_errors text[] := '{}';
begin
  if jsonb_typeof(v_scene) <> 'object' then return jsonb_build_object('valid', false, 'errors', jsonb_build_array('scene must be an object')); end if;
  foreach v_key in array v_required loop
    if not (v_scene ? v_key) then v_errors := array_append(v_errors, format('scene missing key: %s', v_key)); end if;
  end loop;
  if v_scene ->> 'version' <> '1' then v_errors := array_append(v_errors, 'scene version must be 1'); end if;
  if jsonb_typeof(v_scene -> 'present_npc_ids') <> 'array' then v_errors := array_append(v_errors, 'present_npc_ids must be an array'); end if;
  if jsonb_typeof(v_scene -> 'updated_turn') <> 'number' then v_errors := array_append(v_errors, 'updated_turn must be numeric'); end if;
  return jsonb_build_object('valid', coalesce(array_length(v_errors, 1), 0) = 0, 'errors', to_jsonb(v_errors));
end;
$$
$company_bridge_03$;
  execute $company_bridge_04$
create or replace function public.validate_company_save_v1(p_save jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_errors text[] := '{}';
  v_key text;
  v_required text[] := array['save_schema_version','edition','turn_state','player','scene','player_scene_state','player_sexual_state','world_state','npc_scene_state','csa_active','csa_rules'];
  v_scene_check jsonb;
begin
  if p_save is null or jsonb_typeof(p_save) <> 'object' then return jsonb_build_object('valid', false, 'errors', jsonb_build_array('save must be an object')); end if;
  foreach v_key in array v_required loop if not (p_save ? v_key) then v_errors := array_append(v_errors, format('missing required key: %s', v_key)); end if; end loop;
  if p_save ->> 'save_schema_version' <> '1' then v_errors := array_append(v_errors, 'save_schema_version must be 1'); end if;
  if p_save ->> 'edition' <> 'company-v1' then v_errors := array_append(v_errors, 'edition must be company-v1'); end if;
  v_scene_check := public.company_validate_scene_v1(p_save, true);
  if not coalesce((v_scene_check ->> 'valid')::boolean, false) then v_errors := v_errors || array(select jsonb_array_elements_text(v_scene_check -> 'errors')); end if;
  return jsonb_build_object('valid', coalesce(array_length(v_errors, 1), 0) = 0, 'errors', to_jsonb(v_errors));
end;
$$
$company_bridge_04$;
  execute $company_bridge_05$
revoke all on function public.company_minimalize_save_v1(jsonb) from public, anon, authenticated, service_role
$company_bridge_05$;
  execute $company_bridge_06$
revoke all on function public.validate_company_save_v1(jsonb) from public, anon, authenticated
$company_bridge_06$;
  execute $company_bridge_07$
grant execute on function public.validate_company_save_v1(jsonb) to service_role
$company_bridge_07$;
  execute $company_bridge_08$
create or replace function public.reserve_company_player_setup(
  p_game_id uuid, p_setup_id uuid, p_player jsonb, p_opening_plan jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_save public.game_save%rowtype;
  v_data jsonb;
  v_existing jsonb;
  v_name text := nullif(btrim(p_player ->> 'name'), '');
  v_plan jsonb := coalesce(p_opening_plan, '{}'::jsonb);
begin
  if jsonb_typeof(p_player) <> 'object' or v_name is null then raise exception 'player is required' using errcode = '22023'; end if;
  if jsonb_typeof(v_plan) <> 'object' or nullif(btrim(v_plan ->> 'location_id'), '') is null then raise exception 'opening location is required' using errcode = '22023'; end if;
  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then raise exception 'company save not found' using errcode = 'P0002'; end if;
  if v_save.committed_turn <> 0 then raise exception 'player setup is allowed only before turn 1' using errcode = '22023'; end if;
  v_existing := coalesce(v_save.data -> 'player_setup', '{}'::jsonb);
  if coalesce((v_existing ->> 'completed')::boolean, false) then
    if v_existing ->> 'setup_id' = p_setup_id::text then return jsonb_build_object('success', true, 'idempotent', true); end if;
    raise exception 'player setup already completed' using errcode = '23505';
  end if;
  v_data := jsonb_set(v_save.data, '{player}', p_player || jsonb_build_object('player_id', 'player-1', 'adult', true), true);
  v_data := jsonb_set(v_data, '{player_setup}', jsonb_build_object('version', 1, 'setup_id', p_setup_id::text, 'status', 'reserved', 'completed', false), true);
  v_data := jsonb_set(v_data, '{opening_state}', jsonb_build_object('setup_id', p_setup_id::text, 'status', 'planned', 'plan', v_plan), true);
  v_data := jsonb_set(v_data, '{world_state}', coalesce(v_data -> 'world_state', '{}'::jsonb) || jsonb_build_object('game_time', jsonb_build_object('day', 1, 'minute_of_day', coalesce((v_plan ->> 'minute_of_day')::integer, 540)), 'weekday', v_plan ->> 'weekday', 'date_label', coalesce(v_plan ->> 'date_label', 'Day 1')), true);
  v_data := jsonb_set(v_data, '{player_scene_state}', jsonb_build_object('updated_turn', 0, 'clothing', public.company_initial_clothing_v2()), true);
  v_data := jsonb_set(v_data, '{npc_scene_state}', coalesce(v_data -> 'npc_scene_state', '{}'::jsonb), true);
  v_data := public.company_apply_opening_scene_v1(v_data);
  update public.game_save set data = v_data, save_revision = save_revision + 1, updated_at = now() where game_id = p_game_id;
  return jsonb_build_object('success', true, 'idempotent', false, 'setup_id', p_setup_id, 'opening_plan', v_plan);
end;
$$
$company_bridge_08$;
end;
$company_single_statement_wrapper$;
