-- Company v1 턴 진행 하드락 전면 제거 — fail-open 마이그레이션 (2026-08-07)
-- 1) reserve_turn_action: stale action 만료(3분) + ready 제외
-- 2) commit_company_turn: next save validator 실패 시 fail-open(기존 유효 save로 턴만 전진)
-- 3) commit_feedback_revision: stale target → terminated(commit_failed + feedback_target_stale)
-- 4) commit_company_opening: choices 4개 미만이어도 deterministic 기본 선택지로 채워 설정 완료

-- ── 1) reserve_turn_action (5-arg, structured_action 포함) ──────────────────
create or replace function public.reserve_turn_action(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_turn integer,
  p_player_action text,
  p_structured_action jsonb default null
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
  if p_structured_action is not null and jsonb_typeof(p_structured_action) <> 'object' then
    raise exception 'structured_action must be an object or null' using errcode = '22023';
  end if;

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
    if v_action.structured_action is distinct from p_structured_action then
      raise exception 'action structured payload mismatch' using errcode = '22023';
    end if;
    return jsonb_build_object(
      'action_id', v_action.action_id,
      'turn_id', v_action.turn_id,
      'expected_turn', v_action.expected_turn,
      'processing_status', v_action.processing_status,
      'structured_action', v_action.structured_action,
      'replayed', true
    );
  end if;

  -- stale action 만료 — 처리 중(ready 제외) 상태가 3분 이상 갱신되지 않았으면
  -- failed(stale_action_timeout)로 종료해 새 예약을 허용한다.
  update public.game_actions
  set processing_status = 'commit_failed', error_code = 'stale_action_timeout', updated_at = now()
  where game_id = p_game_id
    and expected_turn = p_expected_turn
    and action_id <> p_action_id
    and processing_status in ('story_streaming', 'extracting', 'committing')
    and updated_at < now() - interval '3 minutes';

  -- 같은 턴 동시 예약 차단 — ready는 현재 액션 처리 중이 아니므로 목록에서 제외한다.
  select * into v_inflight from public.game_actions
  where game_id = p_game_id
    and expected_turn = p_expected_turn
    and action_id <> p_action_id
    and processing_status in ('story_streaming', 'extracting', 'committing')
  for update;
  if found then
    if v_inflight.player_action is not distinct from p_player_action
       and v_inflight.structured_action is not distinct from p_structured_action then
      -- 같은 입력의 중복 예약 → 기존 액션을 재사용한다.
      return jsonb_build_object(
        'action_id', v_inflight.action_id,
        'turn_id', v_inflight.turn_id,
        'expected_turn', v_inflight.expected_turn,
        'processing_status', v_inflight.processing_status,
        'structured_action', v_inflight.structured_action,
        'replayed', true
      );
    end if;
    raise exception 'turn already in progress' using errcode = '40001';
  end if;

  if p_expected_turn <> v_save.committed_turn + 1 then
    raise exception 'expected turn conflict' using errcode = '40001';
  end if;

  insert into public.game_actions (
    action_id, game_id, expected_turn, player_action, structured_action, processing_status
  ) values (
    p_action_id, p_game_id, p_expected_turn, p_player_action, p_structured_action, 'story_streaming'
  ) returning * into v_action;

  return jsonb_build_object(
    'action_id', v_action.action_id,
    'turn_id', v_action.turn_id,
    'expected_turn', v_action.expected_turn,
    'processing_status', v_action.processing_status,
    'structured_action', v_action.structured_action,
    'replayed', false
  );
end;
$$;

-- ── 2) commit_company_turn — next save fail-open ─────────────────────────────
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
  v_fail_open boolean := false;
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
    -- fail-open: 상태 변경을 포기하고 기존 유효 save 기반으로 턴만 전진한다.
    -- (Story·parsed_blocks·summary·mind_monitor는 game_turns에 정상 저장된다)
    if not coalesce((public.validate_company_save_v1(v_save.data) ->> 'valid')::boolean, false) then
      raise exception 'invalid current save' using errcode = '22023'; -- DB save 자체가 무효 → 하드 실패
    end if;
    v_next_save := jsonb_set(v_save.data, '{turn_state,committed_turn}', to_jsonb(p_expected_turn), true);
    v_fail_open := true;
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
  update public.game_actions
  set processing_status = 'committed',
      error_code = case when v_fail_open then 'save_fail_open' else error_code end
  where action_id = p_action_id;

  return jsonb_build_object(
    'success', true, 'replayed', false, 'turn_number', p_expected_turn, 'turn_id', v_action.turn_id,
    'save_revision', v_save.save_revision + 1, 'degraded', v_fail_open,
    'warning', case when v_fail_open then 'save_fail_open' else null end
  );
end;
$$;

-- ── 3) commit_feedback_revision — stale target terminated ────────────────────
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
  where turn_id = v_action.target_turn_id and game_id = p_game_id
  for update;
  if not found
     or v_original.record_status <> 'active'
     or v_original.turn_number <> v_save.committed_turn
     or v_original.turn_number <> v_action.expected_turn then
    -- stale target — 예외로 pending을 남기지 않고 terminated 종료한다.
    update public.game_actions
    set processing_status = 'commit_failed', error_code = 'feedback_target_stale'
    where action_id = p_action_id;
    return jsonb_build_object(
      'success', false, 'terminated', true, 'error', 'feedback_target_stale',
      'action_id', p_action_id, 'committed_turn', v_save.committed_turn
    );
  end if;

  v_next_save := jsonb_set(p_next_save, '{turn_state,committed_turn}', to_jsonb(v_save.committed_turn), true);
  v_validation := public.validate_company_save_v1(v_next_save);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'invalid revision save: %', v_validation -> 'errors' using errcode = '22023';
  end if;

  update public.game_turns set record_status = 'superseded' where turn_id = v_original.turn_id;
  insert into public.game_turns (
    turn_id, game_id, turn_number, revision_number, record_status, action_id,
    supersedes_turn_id, revision_request_id, player_action, structured_action,
    feedback_text, story_text, parsed_blocks, extract_delta, pre_save, post_save,
    turn_summary, mind_monitor, choices
  ) values (
    v_action.turn_id, p_game_id, v_original.turn_number, v_original.revision_number + 1,
    'active', p_action_id, v_original.turn_id, p_revision_request_id,
    v_action.player_action, v_action.structured_action,
    v_action.feedback_text, v_action.story_text,
    coalesce(v_action.parsed_blocks, '{}'::jsonb), v_action.extract_delta,
    v_save.data, v_next_save, coalesce(p_turn_summary, ''),
    coalesce(p_mind_monitor, '{}'::jsonb), coalesce(p_choices, '[]'::jsonb)
  );
  update public.game_actions set processing_status = 'committed' where action_id = p_action_id;

  return jsonb_build_object('success', true, 'replayed', false, 'turn_number', v_original.turn_number, 'turn_id', v_action.turn_id, 'save_revision', v_save.save_revision);
end;
$$;

-- ── 4) commit_company_opening — choices fail-open ────────────────────────────
create or replace function public.commit_company_opening(p_game_id uuid, p_setup_id uuid, p_background text, p_story_text text, p_choices jsonb)
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
  if char_length(btrim(coalesce(p_background,''))) > 120 then
    raise exception 'background must be at most 120 characters' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_story_text,'')), '') is null then
    raise exception 'opening story is required' using errcode = '22023';
  end if;
  -- fail-open: 오프닝 선택지가 정확히 4개가 아니어도 설정 완료를 막지 않는다.
  -- 부족하면 deterministic 기본 선택지로 채운다.
  if p_choices is null or jsonb_typeof(p_choices) <> 'array' or jsonb_array_length(p_choices) <> 4
     or exists (select 1 from jsonb_array_elements(p_choices) item where jsonb_typeof(item) <> 'string' or nullif(btrim(item #>> '{}'),'') is null) then
    p_choices := jsonb_build_array(
      '분위기를 살피며 첫인사를 건넨다.',
      '자연스럽게 자리에 앉아 업무를 시작한다.',
      '새 동료에게 먼저 말을 걸어 본다.',
      '조용히 정리하며 상황을 파악한다.'
    );
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
  v_data := jsonb_set(v_data, '{opening_state}', v_opening || jsonb_build_object('status', 'complete', 'story_text', p_story_text, 'choices', p_choices), true);
  v_data := jsonb_set(v_data, '{last_choices}', p_choices, true);
  v_data := jsonb_set(v_data, '{story_summary_overall}', to_jsonb(case when nullif(btrim(coalesce(p_background,'')),'') is null then '회사에서의 첫 장면이 시작되었다.' else btrim(p_background) end), true);
  v_data := jsonb_set(v_data, '{story_summary_recent}', to_jsonb(left(p_story_text, 500)), true);

  update public.game_save set data = v_data, save_revision = save_revision + 1, updated_at = now() where game_id = p_game_id;
  return jsonb_build_object('success', true, 'idempotent', false, 'setup_id', p_setup_id, 'opening_state', v_data -> 'opening_state');
end;
$$;
