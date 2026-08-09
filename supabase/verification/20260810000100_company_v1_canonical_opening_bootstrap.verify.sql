-- Static/read-only verification for the Phase 6 migration package.
do $$
declare
  v_input jsonb := jsonb_build_object(
    'player', jsonb_build_object('player_id', 'player-1'),
    'opening_state', jsonb_build_object('plan', jsonb_build_object(
      'location_id', 'brand_strategy_office',
      'work_hook_id', 'hook-1',
      'scene_goal', '첫 업무를 시작한다',
      'primary_character_id', 'heroine1',
      'supporting_character_ids', jsonb_build_array('heroine3')
    )),
    'npc_scene_state', jsonb_build_object('heroine1', jsonb_build_object(), 'heroine3', jsonb_build_object(), 'heroine5', jsonb_build_object('present', true))
  );
  v_scene jsonb;
  v_again jsonb;
begin
  if to_regprocedure('public.company_apply_opening_scene_v1(jsonb)') is null then raise exception 'canonical opening helper missing'; end if;
  if to_regprocedure('public.reserve_company_player_setup(uuid,uuid,jsonb,jsonb)') is null then raise exception 'reserve wrapper missing'; end if;
  if to_regprocedure('public.commit_company_opening(uuid,uuid,text,text,jsonb)') is null then raise exception 'opening wrapper missing'; end if;
  if has_function_privilege('public', 'public.company_apply_opening_scene_v1(jsonb)', 'EXECUTE') then raise exception 'helper must not be publicly executable'; end if;

  v_scene := public.company_apply_opening_scene_v1(v_input) -> 'scene';
  if v_scene ->> 'scene_id' <> 'opening' or v_scene ->> 'location_id' <> 'brand_strategy_office' then raise exception 'canonical scene identity mismatch'; end if;
  if v_scene ->> 'focal_character_id' <> 'heroine1' or v_scene ->> 'last_speaker_id' is not null or (v_scene ->> 'updated_turn')::integer <> 0 then raise exception 'canonical focal/speaker/turn mismatch'; end if;
  if (v_scene -> 'present_npc_ids') <> jsonb_build_array('heroine1', 'heroine3') then raise exception 'canonical presence mismatch'; end if;
  if public.company_apply_opening_scene_v1(v_input) <> public.company_apply_opening_scene_v1(public.company_apply_opening_scene_v1(v_input)) then raise exception 'helper is not idempotent'; end if;
  v_again := public.company_apply_opening_scene_v1(v_input);
  if (v_again -> 'scene_state' -> 'participants') <> jsonb_build_array('player-1', 'heroine1', 'heroine3') then raise exception 'legacy participants projection mismatch'; end if;
  if (v_again -> 'npc_scene_state' -> 'heroine5' ->> 'present') <> 'false' then raise exception 'off-scene NPC projection mismatch'; end if;
end;
$$;

select
  to_regprocedure('public.company_apply_opening_scene_v1(jsonb)') is not null as helper_exists,
  to_regprocedure('public.reserve_company_player_setup(uuid,uuid,jsonb,jsonb)') is not null as reserve_exists,
  to_regprocedure('public.commit_company_opening(uuid,uuid,text,text,jsonb)') is not null as commit_exists;
