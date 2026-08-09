-- Company v1 Phase 6: canonical turn-0 bootstrap projection.
-- Package only. Apply to Supabase in a separately approved operations step.

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
  v_player_id text := coalesce(nullif(v_data -> 'player' ->> 'player_id', ''), 'player-1');
  v_scene jsonb;
  v_scene_state jsonb;
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
  v_data := jsonb_set(v_data, '{scene}', v_scene, true);

  v_scene_state := coalesce(v_data -> 'scene_state', '{}'::jsonb);
  if jsonb_typeof(v_scene_state) <> 'object' then v_scene_state := '{}'::jsonb; end if;
  v_scene_state := v_scene_state || jsonb_build_object(
    'scene_id', 'opening',
    'location_id', v_location,
    'participants', jsonb_build_array(v_player_id) || to_jsonb(v_present_ids),
    'focus_thread', v_hook,
    'scene_goal', v_goal,
    'beat', 0,
    'updated_turn', 0
  );
  v_data := jsonb_set(v_data, '{scene_state}', v_scene_state, true);
  v_data := jsonb_set(v_data, '{last_npcs_present}', to_jsonb(v_present_ids), true);
  v_data := jsonb_set(v_data, '{focal_character_id}', to_jsonb(v_primary), true);
  v_data := jsonb_set(v_data, '{last_speaker_id}', 'null'::jsonb, true);

  v_player_scene := coalesce(v_data -> 'player_scene_state', '{}'::jsonb);
  if jsonb_typeof(v_player_scene) <> 'object' then v_player_scene := '{}'::jsonb; end if;
  v_player_scene := v_player_scene || jsonb_build_object('location_id', v_location, 'updated_turn', 0);
  v_data := jsonb_set(v_data, '{player_scene_state}', v_player_scene, true);

  v_npc_scene := coalesce(v_data -> 'npc_scene_state', '{}'::jsonb);
  if jsonb_typeof(v_npc_scene) <> 'object' then v_npc_scene := '{}'::jsonb; end if;
  for v_id, v_state in select key, value from jsonb_each(v_npc_scene)
  loop
    if jsonb_typeof(v_state) <> 'object' then v_state := '{}'::jsonb; end if;
    if v_id = any(v_present_ids) then
      v_clothing := case when jsonb_typeof(v_state -> 'clothing') = 'object' then v_state -> 'clothing' else public.company_initial_clothing_v2() end;
      v_state := v_state || jsonb_build_object('present', true, 'scene_id', 'opening', 'location_id', v_location, 'updated_turn', 0);
      v_state := jsonb_set(v_state, '{clothing}', v_clothing, true);
    else
      v_state := v_state || jsonb_build_object('present', false);
    end if;
    v_npc_scene := jsonb_set(v_npc_scene, array[v_id], v_state, true);
  end loop;
  foreach v_id in array v_present_ids
  loop
    if not (v_npc_scene ? v_id) then
      v_npc_scene := jsonb_set(v_npc_scene, array[v_id], jsonb_build_object(
        'present', true, 'scene_id', 'opening', 'location_id', v_location, 'updated_turn', 0,
        'clothing', public.company_initial_clothing_v2()
      ), true);
    end if;
  end loop;
  v_data := jsonb_set(v_data, '{npc_scene_state}', v_npc_scene, true);
  return v_data;
end;
$$;

-- Preserve the validated legacy transaction and add only the canonical projection.
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
  v_result jsonb;
begin
  v_result := public.reserve_company_player_setup_legacy_v2(p_game_id, p_setup_id, p_player, p_opening_plan);
  update public.game_save
  set data = public.company_apply_opening_scene_v1(public.company_apply_initial_clothing_v2(data)), updated_at = now()
  where game_id = p_game_id;
  return v_result;
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
set search_path to 'public', 'pg_temp'
as $$
declare
  v_result jsonb;
begin
  v_result := public.commit_company_opening_legacy_v2(p_game_id, p_setup_id, p_background, p_story_text, p_choices);
  update public.game_save
  set data = public.company_apply_opening_scene_v1(data), updated_at = now()
  where game_id = p_game_id;
  return v_result;
end;
$$;

-- Turn-0-only package backfill. No turn/action/story rows are changed.
update public.game_master
set initial_save = public.company_apply_opening_scene_v1(public.company_apply_initial_clothing_v2(initial_save))
where edition_id = 'company-v1'
  and jsonb_typeof(initial_save -> 'opening_state' -> 'plan') = 'object'
  and jsonb_typeof(initial_save -> 'scene') is distinct from 'object';

update public.game_save s
set data = public.company_apply_opening_scene_v1(public.company_apply_initial_clothing_v2(s.data)), updated_at = now()
from public.games g
where g.id = s.game_id
  and g.edition_id = 'company-v1'
  and coalesce(s.committed_turn, 0) = 0
  and jsonb_typeof(s.data -> 'opening_state' -> 'plan') = 'object'
  and jsonb_typeof(s.data -> 'scene') is distinct from 'object';

revoke all on function public.company_apply_opening_scene_v1(jsonb) from public, anon, authenticated;
revoke all on function public.reserve_company_player_setup(uuid, uuid, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.commit_company_opening(uuid, uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.company_apply_opening_scene_v1(jsonb) to service_role;
grant execute on function public.reserve_company_player_setup(uuid, uuid, jsonb, jsonb) to service_role;
grant execute on function public.commit_company_opening(uuid, uuid, text, text, jsonb) to service_role;
