-- Company v1: make server-produced Opening parsed_blocks durable and authoritative.
-- This additive migration replaces the active five-argument writer. Historical
-- applied migrations remain immutable; rows without parsed_blocks use the
-- existing persisted-read adapter until they are naturally superseded.

drop function if exists public.commit_company_opening(uuid, uuid, text, text, jsonb);

create function public.commit_company_opening(
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
  if p_parsed_blocks is null
     or jsonb_typeof(p_parsed_blocks) <> 'object'
     or jsonb_typeof(p_parsed_blocks -> 'blocks') <> 'array' then
    raise exception 'opening parsed_blocks must be an object with an array of blocks' using errcode = '22023';
  end if;

  select * into v_game from public.games where id = p_game_id;
  if not found or v_game.edition_id <> 'company-v1' then
    raise exception 'company game not found' using errcode = 'P0002';
  end if;
  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then
    raise exception 'company save not found' using errcode = 'P0002';
  end if;
  if v_save.committed_turn <> 0 then
    raise exception 'opening can be committed only before turn 1' using errcode = '22023';
  end if;

  v_setup := coalesce(v_save.data -> 'player_setup', '{}'::jsonb);
  v_opening := coalesce(v_save.data -> 'opening_state', '{}'::jsonb);
  if v_setup ->> 'setup_id' <> p_setup_id::text or v_opening ->> 'setup_id' <> p_setup_id::text then
    raise exception 'setup_id does not match reserved opening' using errcode = '22023';
  end if;
  if coalesce((v_setup ->> 'completed')::boolean, false) then
    return jsonb_build_object('success', true, 'idempotent', true, 'opening_state', v_opening);
  end if;

  v_data := v_save.data;
  v_data := jsonb_set(v_data, '{player,background}', to_jsonb(btrim(coalesce(p_background,''))), true);
  v_data := jsonb_set(v_data, '{player_setup}', v_setup || jsonb_build_object('status', 'complete', 'completed', true), true);
  v_data := jsonb_set(v_data, '{opening_state}', v_opening || jsonb_build_object('status', 'complete', 'story_text', p_story_text, 'choices', p_choices, 'parsed_blocks', p_parsed_blocks), true);
  v_data := jsonb_set(v_data, '{last_choices}', p_choices, true);
  v_data := jsonb_set(v_data, '{story_summary_overall}', to_jsonb(case when nullif(btrim(coalesce(p_background,'')),'') is null then '회사에서의 첫 장면이 시작되었다.' else btrim(p_background) end), true);
  v_data := jsonb_set(v_data, '{story_summary_recent}', to_jsonb(left(p_story_text, 500)), true);

  v_data := public.company_apply_opening_scene_v1(public.company_apply_initial_clothing_v2(v_data));
  update public.game_save set data = v_data, save_revision = save_revision + 1, updated_at = now() where game_id = p_game_id;
  return jsonb_build_object('success', true, 'idempotent', false, 'setup_id', p_setup_id, 'opening_state', v_data -> 'opening_state');
end;
$$;

revoke all on function public.commit_company_opening(uuid, uuid, text, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.commit_company_opening(uuid, uuid, text, text, jsonb, jsonb) to service_role;
