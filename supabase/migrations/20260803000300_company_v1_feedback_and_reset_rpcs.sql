-- Company v1 feedback revision and scoped reset RPCs.

create or replace function public.reserve_feedback_revision(
  p_game_id uuid,
  p_revision_request_id uuid,
  p_feedback_text text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_save public.game_save%rowtype;
  v_existing public.game_actions%rowtype;
  v_original public.game_turns%rowtype;
  v_action public.game_actions%rowtype;
begin
  if p_revision_request_id is null then
    raise exception 'revision request id is required' using errcode = '22023';
  end if;
  if nullif(btrim(p_feedback_text), '') is null then
    raise exception 'feedback text is required' using errcode = '22023';
  end if;

  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then
    raise exception 'company game save not found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.games where id = p_game_id and edition_id = 'company-v1') then
    raise exception 'company edition required' using errcode = '22023';
  end if;

  select * into v_existing from public.game_actions
  where game_id = p_game_id and revision_request_id = p_revision_request_id for update;
  if found then
    select * into v_original from public.game_turns
    where turn_id = v_existing.target_turn_id and game_id = p_game_id;
    if not found then
      raise exception 'feedback replay target integrity error' using errcode = 'XX000';
    end if;
    return jsonb_build_object(
      'revision_request_id', p_revision_request_id,
      'action_id', v_existing.action_id,
      'replacement_turn_id', v_existing.turn_id,
      'target_turn_number', v_original.turn_number,
      'original_turn_id', v_original.turn_id,
      'original_player_action', v_original.player_action,
      'pre_save', v_original.pre_save,
      'processing_status', v_existing.processing_status,
      'replayed', true
    );
  end if;

  select * into v_original from public.game_turns
  where game_id = p_game_id
    and turn_number = v_save.committed_turn
    and record_status = 'active'
  for update;
  if not found then
    raise exception 'latest active turn not found' using errcode = 'P0002';
  end if;

  insert into public.game_actions (
    action_id, game_id, action_kind, expected_turn, target_turn_id, player_action,
    feedback_text, revision_request_id, processing_status
  ) values (
    gen_random_uuid(), p_game_id, 'feedback_revision', v_save.committed_turn, v_original.turn_id,
    v_original.player_action, p_feedback_text, p_revision_request_id, 'story_streaming'
  ) returning * into v_action;

  return jsonb_build_object(
    'revision_request_id', p_revision_request_id,
    'action_id', v_action.action_id,
    'replacement_turn_id', v_action.turn_id,
    'target_turn_number', v_original.turn_number,
    'original_turn_id', v_original.turn_id,
    'original_player_action', v_original.player_action,
    'pre_save', v_original.pre_save,
    'processing_status', v_action.processing_status,
    'replayed', false
  );
end;
$$;

create or replace function public.commit_feedback_revision(
  p_game_id uuid,
  p_action_id uuid,
  p_revision_request_id uuid,
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
  v_original public.game_turns%rowtype;
  v_replacement public.game_turns%rowtype;
  v_next_save jsonb;
  v_validation jsonb;
begin
  select * into v_save from public.game_save where game_id = p_game_id for update;
  select * into v_action from public.game_actions
    where action_id = p_action_id and game_id = p_game_id for update;
  if not found then
    raise exception 'feedback action not found' using errcode = 'P0002';
  end if;
  if v_action.action_kind <> 'feedback_revision'
     or v_action.revision_request_id <> p_revision_request_id then
    raise exception 'feedback revision identity mismatch' using errcode = '22023';
  end if;
  if v_action.processing_status = 'committed' then
    select * into v_replacement from public.game_turns where action_id = p_action_id;
    return jsonb_build_object('success', true, 'replayed', true, 'turn_number', v_replacement.turn_number, 'turn_id', v_replacement.turn_id, 'save_revision', v_save.save_revision);
  end if;
  if v_action.processing_status <> 'committing' or v_action.story_text is null or v_action.extract_delta is null then
    raise exception 'complete feedback story and extract are required before commit' using errcode = '22023';
  end if;

  select * into v_original from public.game_turns
  where turn_id = v_action.target_turn_id
    and game_id = p_game_id
  for update;
  if not found
     or v_original.record_status <> 'active'
     or v_original.turn_number <> v_save.committed_turn
     or v_original.turn_number <> v_action.expected_turn then
    raise exception 'feedback target is no longer the latest active turn' using errcode = '40001';
  end if;

  v_next_save := jsonb_set(p_next_save, '{turn_state,committed_turn}', to_jsonb(v_save.committed_turn), true);
  v_validation := public.validate_company_save_v1(v_next_save);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'invalid revision save: %', v_validation -> 'errors' using errcode = '22023';
  end if;

  update public.game_turns set record_status = 'superseded' where turn_id = v_original.turn_id;
  insert into public.game_turns (
    turn_id, game_id, turn_number, revision_number, record_status, action_id,
    supersedes_turn_id, revision_request_id, player_action, feedback_text, story_text,
    parsed_blocks, extract_delta, pre_save, post_save, turn_summary, mind_monitor, choices
  ) values (
    v_action.turn_id, p_game_id, v_original.turn_number, v_original.revision_number + 1,
    'active', p_action_id, v_original.turn_id, p_revision_request_id,
    v_original.player_action, v_action.feedback_text, v_action.story_text,
    coalesce(v_action.parsed_blocks, '{}'::jsonb), v_action.extract_delta,
    v_original.pre_save, v_next_save, coalesce(p_turn_summary, ''),
    coalesce(p_mind_monitor, '{}'::jsonb), coalesce(p_choices, '[]'::jsonb)
  );
  update public.game_save
  set save_revision = save_revision + 1, data = v_next_save
  where game_id = p_game_id;
  update public.game_actions set processing_status = 'committed' where action_id = p_action_id;

  return jsonb_build_object(
    'success', true, 'replayed', false, 'turn_number', v_original.turn_number,
    'turn_id', v_action.turn_id, 'save_revision', v_save.save_revision + 1
  );
end;
$$;

create or replace function public.reset_company_game(
  p_game_id uuid,
  p_expected_title text
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
  v_validation jsonb;
begin
  select * into v_game from public.games where id = p_game_id for update;
  if not found or v_game.edition_id <> 'company-v1' then
    raise exception 'company game not found' using errcode = 'P0002';
  end if;
  if v_game.title <> p_expected_title then
    raise exception 'expected title does not match game title' using errcode = '22023';
  end if;
  select * into v_master from public.game_master where game_id = p_game_id;
  select * into v_save from public.game_save where game_id = p_game_id for update;
  v_validation := public.validate_company_save_v1(v_master.initial_save);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'invalid reset initial save: %', v_validation -> 'errors' using errcode = '22023';
  end if;

  delete from public.game_turns where game_id = p_game_id;
  delete from public.game_actions where game_id = p_game_id;
  update public.game_save
  set committed_turn = 0,
      save_revision = v_save.save_revision + 1,
      data = v_master.initial_save
  where game_id = p_game_id;

  return jsonb_build_object('success', true, 'game_id', p_game_id, 'committed_turn', 0);
end;
$$;

revoke all on function public.reserve_feedback_revision(uuid, uuid, text) from public;
revoke all on function public.commit_feedback_revision(uuid, uuid, uuid, jsonb, text, jsonb, jsonb) from public;
revoke all on function public.reset_company_game(uuid, text) from public;
grant execute on function public.reserve_feedback_revision(uuid, uuid, text) to service_role;
grant execute on function public.commit_feedback_revision(uuid, uuid, uuid, jsonb, text, jsonb, jsonb) to service_role;
grant execute on function public.reset_company_game(uuid, text) to service_role;
