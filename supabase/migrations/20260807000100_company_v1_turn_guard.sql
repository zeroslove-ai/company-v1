-- Company v1 저장 파이프라인 안정화 핫픽스 (2026-08-07)
-- 1) reserve_turn_action: 같은 턴 동시 예약 차단
--    - 동일 game_id + expected_turn의 처리 중 액션(story_streaming/extracting/committing/ready) 존재 시
--      같은 입력이면 기존 액션 재사용, 다른 입력이면 turn_in_progress 거절
-- 2) commit_company_turn: expected turn conflict를 종료 상태로 전환
--    - processing_status = commit_failed, error_code = expected_turn_conflict 저장 후
--      종료 응답 반환 (committing 고착 방지)

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
  v_inflight public.game_actions%rowtype;
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

  -- 같은 턴 동시 예약 차단 — save를 잠근 뒤 처리 중인 같은 expected_turn 액션을 확인한다.
  select * into v_inflight from public.game_actions
  where game_id = p_game_id
    and expected_turn = p_expected_turn
    and action_id <> p_action_id
    and processing_status in ('story_streaming', 'extracting', 'committing', 'ready')
  for update;
  if found then
    if v_inflight.player_action is not distinct from p_player_action then
      -- 같은 입력의 중복 예약 → 기존 액션을 재사용한다.
      return jsonb_build_object(
        'action_id', v_inflight.action_id, 'turn_id', v_inflight.turn_id,
        'expected_turn', v_inflight.expected_turn,
        'processing_status', v_inflight.processing_status, 'replayed', true
      );
    end if;
    raise exception 'turn already in progress' using errcode = '40001';
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
    -- expected turn conflict — committing에 남기지 않고 반드시 종료 상태로 전환한다.
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
