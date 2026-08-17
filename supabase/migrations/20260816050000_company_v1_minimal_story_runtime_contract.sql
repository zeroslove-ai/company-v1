-- Minimal Story Runtime contract (source only; do not apply in this cut).
-- Historical migrations and stored turn snapshots remain immutable.

create or replace function public.company_minimalize_save_v1(p_data jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(p_data, '{}'::jsonb)
    - 'npc_stats'
    - 'npc_relationship_state'
    - 'csa_attitudes'
    - 'csa_runtime_state'
    - 'csa_aftereffect_state'
    - 'sexual_event_ledger'
    - 'last_image_id'
    - 'story_summary_overall'
    - 'story_summary_recent'
    - 'npc_emotion'
    - 'npc_work_state'
    - 'event_ledger';
$$;

create or replace function public.create_company_game(
  p_title text,
  p_master_data jsonb,
  p_initial_save jsonb,
  p_content_version text default '0.0.1-skeleton',
  p_game_id uuid default gen_random_uuid()
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_data jsonb := public.company_minimalize_save_v1(p_initial_save);
  v_validation jsonb;
begin
  v_validation := public.validate_company_save_v1(v_data);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'invalid initial save: %', v_validation -> 'errors' using errcode = '22023';
  end if;
  if p_master_data is null or jsonb_typeof(p_master_data) <> 'object' then
    raise exception 'master data must be an object' using errcode = '22023';
  end if;
  insert into public.games (id, title, content_version) values (p_game_id, p_title, p_content_version);
  insert into public.game_master (game_id, data, initial_save) values (p_game_id, p_master_data, v_data);
  insert into public.game_save (game_id, committed_turn, data) values (p_game_id, 0, v_data);
  return p_game_id;
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
    'npc_scene_state', 'csa_active', 'csa_rules', 'last_choices', 'last_choice_meta'
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
  if jsonb_typeof(p_save -> 'last_choices') <> 'array' then v_errors := array_append(v_errors, 'last_choices must be an array'); end if;
  if jsonb_typeof(p_save -> 'turn_state') <> 'object' then v_errors := array_append(v_errors, 'turn_state must be an object'); end if;
  v_scene_check := public.company_validate_scene_v1(p_save, true);
  if not coalesce((v_scene_check ->> 'valid')::boolean, false) then v_errors := v_errors || array(select jsonb_array_elements_text(v_scene_check -> 'errors')); end if;
  return jsonb_build_object('valid', coalesce(array_length(v_errors, 1), 0) = 0, 'errors', to_jsonb(v_errors));
end;
$$;

-- Re-assert the existing setup/opening scene projection with the minimal save
-- boundary immediately before the returned value reaches its caller's write.
create or replace function public.company_apply_opening_scene_v1(p_data jsonb)
returns jsonb
language plpgsql
immutable
set search_path to 'public', 'pg_temp'
as $$
declare
  v_data jsonb := public.company_minimalize_save_v1(coalesce(p_data, '{}'::jsonb));
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
  if exists (select 1 from jsonb_array_elements(v_supporting) item where jsonb_typeof(item) <> 'string' or nullif(btrim(item #>> '{}'), '') is null) then
    raise exception 'opening supporting characters must contain non-empty ids' using errcode = '22023';
  end if;
  v_present_ids := array[v_primary];
  for v_id in select btrim(value) from jsonb_array_elements_text(v_supporting) item(value)
  loop
    if v_id = v_primary then raise exception 'opening supporting character duplicates primary id' using errcode = '22023'; end if;
    v_present_ids := v_present_ids || v_id;
  end loop;
  v_scene := jsonb_build_object(
    'version', 1, 'scene_id', 'opening', 'location_id', v_location, 'beat', 0,
    'goal', v_goal, 'focus_thread', v_hook, 'present_npc_ids', to_jsonb(v_present_ids),
    'focal_character_id', v_primary, 'last_speaker_id', null, 'updated_turn', 0
  );
  v_data := jsonb_set(v_data, '{scene}', v_scene, true) - 'scene_state' - 'last_npcs_present' - 'focal_character_id' - 'last_speaker_id';
  v_player_scene := coalesce(v_data -> 'player_scene_state', '{}'::jsonb);
  if jsonb_typeof(v_player_scene) <> 'object' then v_player_scene := '{}'::jsonb; end if;
  v_data := jsonb_set(v_data, '{player_scene_state}', (v_player_scene - 'location_id') || jsonb_build_object('updated_turn', 0), true);
  v_npc_scene := coalesce(v_data -> 'npc_scene_state', '{}'::jsonb);
  if jsonb_typeof(v_npc_scene) <> 'object' then v_npc_scene := '{}'::jsonb; end if;
  for v_id, v_state in select key, value from jsonb_each(v_npc_scene)
  loop
    if jsonb_typeof(v_state) <> 'object' then v_state := '{}'::jsonb; end if;
    v_state := v_state - 'present' - 'scene_id' - 'location_id';
    if v_id = any(v_present_ids) then
      v_clothing := case when jsonb_typeof(v_state -> 'clothing') = 'object' then v_state -> 'clothing' else public.company_initial_clothing_v2() end;
      v_state := jsonb_set(v_state || jsonb_build_object('updated_turn', 0), '{clothing}', v_clothing, true);
    end if;
    v_npc_scene := jsonb_set(v_npc_scene, array[v_id], v_state, true);
  end loop;
  foreach v_id in array v_present_ids
  loop
    if not (v_npc_scene ? v_id) then
      v_npc_scene := jsonb_set(v_npc_scene, array[v_id], jsonb_build_object('updated_turn', 0, 'clothing', public.company_initial_clothing_v2()), true);
    end if;
  end loop;
  return public.company_minimalize_save_v1(jsonb_set(v_data, '{npc_scene_state}', v_npc_scene, true));
end;
$$;

-- Reset is the other pre-turn durable writer. It canonicalizes the master
-- seed before validation and before the game_save update.
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
  v_validation jsonb;
begin
  select * into v_game from public.games where id = p_game_id for update;
  if not found or v_game.edition_id <> 'company-v1' then raise exception 'company game not found' using errcode = 'P0002'; end if;
  if v_game.title <> p_expected_title then raise exception 'expected title does not match game title' using errcode = '22023'; end if;
  select * into v_master from public.game_master where game_id = p_game_id;
  select * into v_save from public.game_save where game_id = p_game_id for update;
  v_data := public.company_minimalize_save_v1(v_master.initial_save);
  v_data := public.company_bootstrap_scene_v1(v_data);
  v_data := public.company_apply_initial_clothing_v2(v_data);
  v_data := public.company_minimalize_save_v1(v_data);
  v_validation := public.validate_company_save_v1(v_data);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then raise exception 'invalid reset initial save: %', v_validation -> 'errors' using errcode = '22023'; end if;
  delete from public.game_turns where game_id = p_game_id;
  delete from public.game_actions where game_id = p_game_id;
  update public.game_save set committed_turn = 0, save_revision = v_save.save_revision + 1, data = v_data, updated_at = now() where game_id = p_game_id;
  return jsonb_build_object('success', true, 'game_id', p_game_id, 'committed_turn', 0);
end;
$$;

create or replace function public.commit_company_opening(
  p_game_id uuid,
  p_setup_id uuid,
  p_background text,
  p_story_text text,
  p_choices jsonb,
  p_parsed_blocks jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_game public.games%rowtype;
  v_save public.game_save%rowtype;
  v_data jsonb;
  v_setup jsonb;
  v_opening jsonb;
begin
  if char_length(btrim(coalesce(p_background,''))) > 120 then raise exception 'background must be at most 120 characters' using errcode = '22023'; end if;
  if nullif(btrim(coalesce(p_story_text,'')), '') is null then raise exception 'opening story is required' using errcode = '22023'; end if;
  if p_choices is null or jsonb_typeof(p_choices) <> 'array' or jsonb_array_length(p_choices) <> 4 then raise exception 'opening choices must contain exactly four items' using errcode = '22023'; end if;
  if exists (select 1 from jsonb_array_elements(p_choices) item where jsonb_typeof(item) <> 'string' or nullif(btrim(item #>> '{}'),'') is null) then raise exception 'opening choices must be non-empty strings' using errcode = '22023'; end if;
  if p_parsed_blocks is null or jsonb_typeof(p_parsed_blocks) <> 'object' or jsonb_typeof(p_parsed_blocks -> 'blocks') <> 'array' then raise exception 'opening parsed_blocks must be an object with an array of blocks' using errcode = '22023'; end if;
  select * into v_game from public.games where id = p_game_id;
  if not found or v_game.edition_id <> 'company-v1' then raise exception 'company game not found' using errcode = 'P0002'; end if;
  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then raise exception 'company save not found' using errcode = 'P0002'; end if;
  if v_save.committed_turn <> 0 then raise exception 'opening can be committed only before turn 1' using errcode = '22023'; end if;
  v_setup := coalesce(v_save.data -> 'player_setup', '{}'::jsonb);
  v_opening := coalesce(v_save.data -> 'opening_state', '{}'::jsonb);
  if v_setup ->> 'setup_id' <> p_setup_id::text or v_opening ->> 'setup_id' <> p_setup_id::text then raise exception 'setup_id does not match reserved opening' using errcode = '22023'; end if;
  if coalesce((v_setup ->> 'completed')::boolean, false) then return jsonb_build_object('success', true, 'idempotent', true, 'opening_state', v_opening); end if;
  v_data := public.company_minimalize_save_v1(v_save.data);
  v_data := jsonb_set(v_data, '{player,background}', to_jsonb(btrim(coalesce(p_background,''))), true);
  v_data := jsonb_set(v_data, '{player_setup}', v_setup || jsonb_build_object('status', 'complete', 'completed', true), true);
  v_data := jsonb_set(v_data, '{opening_state}', v_opening || jsonb_build_object('status', 'complete', 'story_text', p_story_text, 'choices', p_choices, 'parsed_blocks', p_parsed_blocks), true);
  v_data := jsonb_set(v_data, '{last_choices}', p_choices, true);
  v_data := public.company_apply_opening_scene_v1(public.company_apply_initial_clothing_v2(v_data));
  v_data := public.company_minimalize_save_v1(v_data);
  update public.game_save set data = v_data, save_revision = save_revision + 1, updated_at = now() where game_id = p_game_id;
  return jsonb_build_object('success', true, 'idempotent', false, 'setup_id', p_setup_id, 'opening_state', v_data -> 'opening_state');
end;
$$;

-- Fresh setup/opening/reset callers must canonicalize immediately before their
-- game_save write. The existing reserve_company_player_setup function already
-- routes its candidate through company_apply_opening_scene_v1; replacing that
-- helper therefore closes setup as well without duplicating the setup RPC.
-- The existing lifecycle, choice and scene functions stay the transaction
-- authority; this helper is the single removal boundary.
revoke all on function public.company_minimalize_save_v1(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.validate_company_save_v1(jsonb) from public, anon, authenticated;
revoke all on function public.company_apply_opening_scene_v1(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.reset_company_game(uuid, text) from public, anon, authenticated;
revoke all on function public.create_company_game(text, jsonb, jsonb, text, uuid) from public, anon, authenticated;
revoke all on function public.commit_company_opening(uuid, uuid, text, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.reset_company_game(uuid, text) to service_role;
grant execute on function public.create_company_game(text, jsonb, jsonb, text, uuid) to service_role;
grant execute on function public.commit_company_opening(uuid, uuid, text, text, jsonb, jsonb) to service_role;
grant execute on function public.validate_company_save_v1(jsonb) to service_role;
