-- Company v1 acceptance cleanup: strict commit validation and structured-action parity.
-- This apply-only migration does not rewrite historical turns or saves.
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
    update public.game_actions
    set processing_status = 'commit_failed', error_code = 'expected_turn_conflict'
    where action_id = p_action_id;
    return jsonb_build_object(
      'success', false, 'terminated', true, 'error', 'expected_turn_conflict',
      'action_id', p_action_id, 'expected_turn', p_expected_turn,
      'committed_turn', v_save.committed_turn
    );
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
    turn_id, game_id, turn_number, action_id, player_action, structured_action,
    story_text, parsed_blocks, extract_delta, pre_save, post_save,
    turn_summary, mind_monitor, choices
  ) values (
    v_action.turn_id, p_game_id, p_expected_turn, p_action_id, v_action.player_action,
    v_action.structured_action, v_action.story_text,
    coalesce(v_action.parsed_blocks, '{}'::jsonb), v_action.extract_delta,
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

revoke all on function public.commit_company_turn(uuid, uuid, integer, jsonb, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.commit_company_turn(uuid, uuid, integer, jsonb, text, jsonb, jsonb) to service_role;
