-- Read-only verification for fresh turn-0 saves with no clothing key.
do $$
declare
  v_input jsonb := jsonb_build_object(
    'player', jsonb_build_object('player_id', 'player-1'),
    'player_scene_state', jsonb_build_object('location_id', 'brand_strategy_office'),
    'npc_scene_state', jsonb_build_object('heroine1', jsonb_build_object('present', true)),
    'opening_state', jsonb_build_object('plan', jsonb_build_object(
      'location_id', 'brand_strategy_office',
      'work_hook_id', 'hook-fresh',
      'scene_goal', '첫 업무를 시작한다',
      'primary_character_id', 'heroine1',
      'supporting_character_ids', jsonb_build_array()
    )),
    'unrelated_root', jsonb_build_object('keep', true)
  );
  v_clothed jsonb;
  v_projected jsonb;
begin
  v_clothed := public.company_apply_initial_clothing_v2(v_input);
  if v_clothed is null then raise exception 'fresh clothing helper returned SQL NULL'; end if;
  if v_clothed -> 'opening_state' -> 'plan' ->> 'primary_character_id' <> 'heroine1' then
    raise exception 'opening plan was lost while applying fresh clothing';
  end if;
  if v_clothed -> 'player_scene_state' -> 'clothing' ->> 'uniform_top' <> 'worn'
     or v_clothed -> 'player_scene_state' -> 'clothing' ->> 'uniform_bottom' <> 'worn'
     or v_clothed -> 'player_scene_state' -> 'clothing' ->> 'underwear_top' <> 'worn'
     or v_clothed -> 'player_scene_state' -> 'clothing' ->> 'underwear_bottom' <> 'worn' then
    raise exception 'fresh player clothing defaults missing';
  end if;
  if v_clothed -> 'npc_scene_state' -> 'heroine1' -> 'clothing' ->> 'uniform_top' <> 'worn'
     or v_clothed -> 'npc_scene_state' -> 'heroine1' -> 'clothing' ->> 'uniform_bottom' <> 'worn'
     or v_clothed -> 'npc_scene_state' -> 'heroine1' -> 'clothing' ->> 'underwear_top' <> 'worn'
     or v_clothed -> 'npc_scene_state' -> 'heroine1' -> 'clothing' ->> 'underwear_bottom' <> 'worn' then
    raise exception 'fresh NPC clothing defaults missing';
  end if;
  if v_clothed -> 'unrelated_root' ->> 'keep' <> 'true' then raise exception 'unrelated root changed'; end if;

  v_projected := public.company_apply_opening_scene_v1(v_clothed);
  if v_projected -> 'scene' ->> 'scene_id' <> 'opening'
     or v_projected -> 'scene' ->> 'focal_character_id' <> 'heroine1'
     or v_projected ->> 'last_speaker_id' is not null then
    raise exception 'fresh canonical opening projection mismatch';
  end if;
end;
$$;

select true as fresh_clothing_bootstrap_verified;
