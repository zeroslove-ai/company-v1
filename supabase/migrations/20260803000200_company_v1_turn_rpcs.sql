-- Company v1 turn lifecycle RPCs. These functions are service-role-only.

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
  v_validation jsonb;
begin
  v_validation := public.validate_company_save_v1(p_initial_save);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'invalid initial save: %', v_validation -> 'errors' using errcode = '22023';
  end if;
  if p_master_data is null or jsonb_typeof(p_master_data) <> 'object' then
    raise exception 'master data must be an object' using errcode = '22023';
  end if;

  insert into public.games (id, title, content_version)
  values (p_game_id, p_title, p_content_version);
  insert into public.game_master (game_id, data, initial_save)
  values (p_game_id, p_master_data, p_initial_save);
  insert into public.game_save (game_id, committed_turn, data)
  values (p_game_id, 0, p_initial_save);

  return p_game_id;
end;
$$;

create or replace function public.get_company_context(
  p_game_id uuid,
  p_recent_turns integer default 15
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_game public.games%rowtype;
  v_master public.game_master%rowtype;
  v_save public.game_save%rowtype;
  v_recent_turns jsonb;
  v_limit integer := least(greatest(coalesce(p_recent_turns, 15), 1), 50);
begin
  select * into v_game from public.games where id = p_game_id;
  if not found or v_game.edition_id <> 'company-v1' then
    raise exception 'company game not found' using errcode = 'P0002';
  end if;
  select * into v_master from public.game_master where game_id = p_game_id;
  select * into v_save from public.game_save where game_id = p_game_id;

  select coalesce(jsonb_agg(row_data order by committed_at), '[]'::jsonb)
  into v_recent_turns
  from (
    select to_jsonb(t) as row_data, t.committed_at
    from (
      select * from public.game_turns
      where game_id = p_game_id and record_status = 'active'
      order by committed_at desc
      limit v_limit
    ) t
  ) recent;

  return jsonb_build_object(
    'game', to_jsonb(v_game),
    'master', to_jsonb(v_master),
    'save', to_jsonb(v_save),
    'recent_turns', v_recent_turns
  );
end;
$$;

create or replace function public.reserve_turn_action(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_turn integer,
  p_player_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_save public.game_save%rowtype;
  v_action public.game_actions%rowtype;
begin
  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then
    raise exception 'company game save not found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.games where id = p_game_id and edition_id = 'company-v1') then
    raise exception 'company edition required' using errcode = '22023';
  end if;

  select * into v_action from public.game_actions where action_id = p_action_id;
  if found then
    if v_action.game_id <> p_game_id then
      raise exception 'action belongs to a different game' using errcode = '22023';
    end if;
    return jsonb_build_object(
      'action_id', v_action.action_id, 'turn_id', v_action.turn_id,
      'expected_turn', v_action.expected_turn,
      'processing_status', v_action.processing_status, 'replayed', true
    );
  end if;

  if p_expected_turn <> v_save.committed_turn + 1 then
    raise exception 'expected turn conflict' using errcode = '40001';
  end if;

  insert into public.game_actions (
    action_id, game_id, expected_turn, player_action, processing_status
  ) values (
    p_action_id, p_game_id, p_expected_turn, p_player_action, 'story_streaming'
  ) returning * into v_action;

  return jsonb_build_object(
    'action_id', v_action.action_id, 'turn_id', v_action.turn_id,
    'expected_turn', v_action.expected_turn,
    'processing_status', v_action.processing_status, 'replayed', false
  );
end;
$$;

create or replace function public.record_story_result(
  p_game_id uuid,
  p_action_id uuid,
  p_story_text text,
  p_parsed_blocks jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_action public.game_actions%rowtype;
begin
  if nullif(btrim(p_story_text), '') is null then
    raise exception 'complete story text is required' using errcode = '22023';
  end if;
  select * into v_action from public.game_actions
    where action_id = p_action_id and game_id = p_game_id for update;
  if not found then
    raise exception 'action not found' using errcode = 'P0002';
  end if;
  if v_action.story_text is not null then
    if v_action.story_text is not distinct from p_story_text
       and v_action.parsed_blocks is not distinct from p_parsed_blocks then
      return jsonb_build_object('action_id', v_action.action_id, 'replayed', true, 'processing_status', v_action.processing_status);
    end if;
    raise exception 'story result cannot be overwritten' using errcode = '23505';
  end if;
  if v_action.processing_status <> 'story_streaming' then
    raise exception 'action is not accepting story output' using errcode = '22023';
  end if;
  update public.game_actions
  set story_text = p_story_text, parsed_blocks = coalesce(p_parsed_blocks, '{}'::jsonb), processing_status = 'extracting'
  where action_id = p_action_id;
  return jsonb_build_object('action_id', p_action_id, 'replayed', false, 'processing_status', 'extracting');
end;
$$;

create or replace function public.record_extract_result(
  p_game_id uuid,
  p_action_id uuid,
  p_extract_delta jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_action public.game_actions%rowtype;
begin
  if p_extract_delta is null or jsonb_typeof(p_extract_delta) <> 'object' then
    raise exception 'extract delta must be an object' using errcode = '22023';
  end if;
  select * into v_action from public.game_actions
    where action_id = p_action_id and game_id = p_game_id for update;
  if not found then
    raise exception 'action not found' using errcode = 'P0002';
  end if;
  if v_action.story_text is null then
    raise exception 'story result is required before extract' using errcode = '22023';
  end if;
  if v_action.extract_delta is not null then
    if v_action.extract_delta is not distinct from p_extract_delta then
      return jsonb_build_object('action_id', v_action.action_id, 'replayed', true, 'processing_status', v_action.processing_status);
    end if;
    raise exception 'extract result cannot be overwritten' using errcode = '23505';
  end if;
  if v_action.processing_status <> 'extracting' then
    raise exception 'action is not accepting extract output' using errcode = '22023';
  end if;
  update public.game_actions
  set extract_delta = p_extract_delta, processing_status = 'committing'
  where action_id = p_action_id;
  return jsonb_build_object('action_id', p_action_id, 'replayed', false, 'processing_status', 'committing');
end;
$$;

create or replace function public.get_action_status(p_game_id uuid, p_action_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_action public.game_actions%rowtype;
begin
  select * into v_action from public.game_actions where action_id = p_action_id and game_id = p_game_id;
  if not found then
    raise exception 'action not found' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'action_id', v_action.action_id, 'turn_id', v_action.turn_id,
    'expected_turn', v_action.expected_turn, 'processing_status', v_action.processing_status,
    'has_story', v_action.story_text is not null, 'has_extract', v_action.extract_delta is not null,
    'error_code', v_action.error_code
  );
end;
$$;

create or replace function public.commit_company_turn(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_turn integer,
  p_next_save jsonb,
  p_turn_summary text,
  p_mind_monitor jsonb,
  p_choices jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_save public.game_save%rowtype;
  v_action public.game_actions%rowtype;
  v_turn public.game_turns%rowtype;
  v_next_save jsonb;
  v_validation jsonb;
begin
  select * into v_save from public.game_save where game_id = p_game_id for update;
  select * into v_action from public.game_actions where action_id = p_action_id and game_id = p_game_id for update;
  if not found then
    raise exception 'action not found' using errcode = 'P0002';
  end if;
  if v_action.processing_status = 'committed' then
    select * into v_turn from public.game_turns where action_id = p_action_id;
    return jsonb_build_object('success', true, 'replayed', true, 'turn_number', v_turn.turn_number, 'turn_id', v_turn.turn_id, 'save_revision', v_save.save_revision);
  end if;
  if p_expected_turn <> v_save.committed_turn + 1 or p_expected_turn <> v_action.expected_turn then
    raise exception 'expected turn conflict' using errcode = '40001';
  end if;
  if v_action.processing_status <> 'committing' or v_action.story_text is null or v_action.extract_delta is null then
    raise exception 'complete story and extract are required before commit' using errcode = '22023';
  end if;
  v_next_save := jsonb_set(p_next_save, '{turn_state,committed_turn}', to_jsonb(p_expected_turn), true);
  v_validation := public.validate_company_save_v1(v_next_save);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'invalid next save: %', v_validation -> 'errors' using errcode = '22023';
  end if;

  insert into public.game_turns (
    turn_id, game_id, turn_number, action_id, player_action, story_text,
    parsed_blocks, extract_delta, pre_save, post_save, turn_summary, mind_monitor, choices
  ) values (
    v_action.turn_id, p_game_id, p_expected_turn, p_action_id, v_action.player_action,
    v_action.story_text, coalesce(v_action.parsed_blocks, '{}'::jsonb), v_action.extract_delta,
    v_save.data, v_next_save, coalesce(p_turn_summary, ''),
    coalesce(p_mind_monitor, '{}'::jsonb), coalesce(p_choices, '[]'::jsonb)
  );
  update public.game_save
  set committed_turn = p_expected_turn, save_revision = save_revision + 1, data = v_next_save
  where game_id = p_game_id;
  update public.game_actions set processing_status = 'committed' where action_id = p_action_id;

  return jsonb_build_object('success', true, 'replayed', false, 'turn_number', p_expected_turn, 'turn_id', v_action.turn_id, 'save_revision', v_save.save_revision + 1);
end;
$$;

revoke all on function public.create_company_game(text, jsonb, jsonb, text, uuid) from public;
revoke all on function public.get_company_context(uuid, integer) from public;
revoke all on function public.reserve_turn_action(uuid, uuid, integer, text) from public;
revoke all on function public.record_story_result(uuid, uuid, text, jsonb) from public;
revoke all on function public.record_extract_result(uuid, uuid, jsonb) from public;
revoke all on function public.get_action_status(uuid, uuid) from public;
revoke all on function public.commit_company_turn(uuid, uuid, integer, jsonb, text, jsonb, jsonb) from public;
grant execute on function public.create_company_game(text, jsonb, jsonb, text, uuid) to service_role;
grant execute on function public.get_company_context(uuid, integer) to service_role;
grant execute on function public.reserve_turn_action(uuid, uuid, integer, text) to service_role;
grant execute on function public.record_story_result(uuid, uuid, text, jsonb) to service_role;
grant execute on function public.record_extract_result(uuid, uuid, jsonb) to service_role;
grant execute on function public.get_action_status(uuid, uuid) to service_role;
grant execute on function public.commit_company_turn(uuid, uuid, integer, jsonb, text, jsonb, jsonb) to service_role;
