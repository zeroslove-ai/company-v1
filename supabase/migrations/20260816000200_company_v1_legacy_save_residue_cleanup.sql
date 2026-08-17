-- Company v1: remove superseded save-level summary/emotion/work/event residue.
-- Historical migrations remain immutable. This migration is authored only; it
-- must be applied separately after review and live contract verification.

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
    'player_scene_state', 'player_sexual_state', 'world_state', 'scene_state',
    'npc_stats', 'npc_relationship_state', 'npc_scene_state', 'csa_active',
    'csa_rules', 'csa_attitudes', 'csa_runtime_state', 'csa_aftereffect_state',
    'focal_character_id', 'last_speaker_id', 'last_npcs_present', 'last_image_id',
    'last_choices', 'last_choice_meta'
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
  if jsonb_typeof(p_save -> 'scene_state') not in ('object', 'null') and (p_save ? 'scene_state') then v_errors := array_append(v_errors, 'scene_state must be an object when present'); end if;
  if jsonb_typeof(p_save -> 'last_npcs_present') not in ('array', 'null') and (p_save ? 'last_npcs_present') then v_errors := array_append(v_errors, 'last_npcs_present must be an array when present'); end if;
  if jsonb_typeof(p_save -> 'focal_character_id') not in ('string', 'null') and (p_save ? 'focal_character_id') then v_errors := array_append(v_errors, 'focal_character_id must be string or null when present'); end if;
  if jsonb_typeof(p_save -> 'last_speaker_id') not in ('string', 'null') and (p_save ? 'last_speaker_id') then v_errors := array_append(v_errors, 'last_speaker_id must be string or null when present'); end if;
  v_scene_check := public.company_validate_scene_v1(p_save, true);
  if not coalesce((v_scene_check ->> 'valid')::boolean, false) then v_errors := v_errors || array(select jsonb_array_elements_text(v_scene_check -> 'errors')); end if;
  return jsonb_build_object('valid', coalesce(array_length(v_errors, 1), 0) = 0, 'errors', to_jsonb(v_errors));
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
  if p_choices is null or jsonb_typeof(p_choices) <> 'array' or jsonb_array_length(p_choices) <> 4 then
    raise exception 'opening choices must contain exactly four items' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(p_choices) item where jsonb_typeof(item) <> 'string' or nullif(btrim(item #>> '{}'),'') is null) then
    raise exception 'opening choices must be non-empty strings' using errcode = '22023';
  end if;
  if p_parsed_blocks is null or jsonb_typeof(p_parsed_blocks) <> 'object' or jsonb_typeof(p_parsed_blocks -> 'blocks') <> 'array' then
    raise exception 'opening parsed_blocks must be an object with an array of blocks' using errcode = '22023';
  end if;
  select * into v_game from public.games where id = p_game_id;
  if not found or v_game.edition_id <> 'company-v1' then raise exception 'company game not found' using errcode = 'P0002'; end if;
  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then raise exception 'company save not found' using errcode = 'P0002'; end if;
  if v_save.committed_turn <> 0 then raise exception 'opening can be committed only before turn 1' using errcode = '22023'; end if;
  v_setup := coalesce(v_save.data -> 'player_setup', '{}'::jsonb);
  v_opening := coalesce(v_save.data -> 'opening_state', '{}'::jsonb);
  if v_setup ->> 'setup_id' <> p_setup_id::text or v_opening ->> 'setup_id' <> p_setup_id::text then raise exception 'setup_id does not match reserved opening' using errcode = '22023'; end if;
  if coalesce((v_setup ->> 'completed')::boolean, false) then return jsonb_build_object('success', true, 'idempotent', true, 'opening_state', v_opening); end if;
  v_data := v_save.data - 'story_summary_overall' - 'story_summary_recent' - 'npc_emotion' - 'npc_work_state' - 'event_ledger';
  v_data := jsonb_set(v_data, '{player,background}', to_jsonb(btrim(coalesce(p_background,''))), true);
  v_data := jsonb_set(v_data, '{player_setup}', v_setup || jsonb_build_object('status', 'complete', 'completed', true), true);
  v_data := jsonb_set(v_data, '{opening_state}', v_opening || jsonb_build_object('status', 'complete', 'story_text', p_story_text, 'choices', p_choices, 'parsed_blocks', p_parsed_blocks), true);
  v_data := jsonb_set(v_data, '{last_choices}', p_choices, true);
  v_data := public.company_apply_opening_scene_v1(public.company_apply_initial_clothing_v2(v_data));
  update public.game_save set data = v_data, save_revision = save_revision + 1, updated_at = now() where game_id = p_game_id;
  return jsonb_build_object('success', true, 'idempotent', false, 'setup_id', p_setup_id, 'opening_state', v_data -> 'opening_state');
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
  v_validation jsonb;
begin
  select * into v_game from public.games where id = p_game_id for update;
  if not found or v_game.edition_id <> 'company-v1' then raise exception 'company game not found' using errcode = 'P0002'; end if;
  if v_game.title <> p_expected_title then raise exception 'expected title does not match game title' using errcode = '22023'; end if;
  select * into v_master from public.game_master where game_id = p_game_id;
  select * into v_save from public.game_save where game_id = p_game_id for update;
  v_validation := public.validate_company_save_v1(v_master.initial_save);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then raise exception 'invalid reset initial save: %', v_validation -> 'errors' using errcode = '22023'; end if;
  delete from public.game_turns where game_id = p_game_id;
  delete from public.game_actions where game_id = p_game_id;
  update public.game_save
  set committed_turn = 0,
      save_revision = v_save.save_revision + 1,
      data = public.company_apply_initial_clothing_v2(v_master.initial_save - 'story_summary_overall' - 'story_summary_recent' - 'npc_emotion' - 'npc_work_state' - 'event_ledger')
  where game_id = p_game_id;
  return jsonb_build_object('success', true, 'game_id', p_game_id, 'committed_turn', 0);
end;
$$;

revoke all on function public.validate_company_save_v1(jsonb) from public, anon, authenticated;
grant execute on function public.validate_company_save_v1(jsonb) to service_role;
revoke all on function public.commit_company_opening(uuid, uuid, text, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.commit_company_opening(uuid, uuid, text, text, jsonb, jsonb) to service_role;
revoke all on function public.reset_company_game(uuid, text) from public, anon, authenticated;
grant execute on function public.reset_company_game(uuid, text) to service_role;
