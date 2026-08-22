-- Company R3 latest-turn feedback revision source contract.
-- Apply only through a separately authorized TEST rollout task.

begin;

create table if not exists public.company_r3_turn_revision_history (
  revision_id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.company_r3_games(game_id) on delete cascade,
  turn_number integer not null check (turn_number >= 0),
  revision integer not null check (revision > 0),
  revision_kind text not null check (revision_kind in ('opening', 'ordinary', 'feedback')),
  revision_request_id uuid,
  feedback_text text,
  literal_action text not null,
  story_text text not null,
  choices jsonb not null default '[]'::jsonb check (jsonb_typeof(choices) = 'array'),
  turn_summary text not null,
  mind_monitor jsonb not null default '{}'::jsonb,
  observer_raw jsonb not null default '{}'::jsonb,
  observer_applied jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  state_before jsonb not null,
  state_after jsonb not null,
  state_revision_before integer not null check (state_revision_before >= 0),
  state_revision_after integer not null check (state_revision_after >= 0),
  supersedes_revision_id uuid references public.company_r3_turn_revision_history(revision_id),
  committed_at timestamptz not null default now(),
  unique (game_id, turn_number, revision),
  unique (game_id, revision_request_id),
  foreign key (game_id, turn_number) references public.company_r3_turns(game_id, turn_number) on delete cascade
);

create table if not exists public.company_r3_feedback_attempts (
  attempt_id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.company_r3_games(game_id) on delete cascade,
  revision_request_id uuid not null,
  target_turn_number integer not null check (target_turn_number > 0),
  target_revision integer not null check (target_revision > 0),
  expected_state_revision integer not null check (expected_state_revision >= 0),
  original_literal_action text not null,
  feedback_text text not null check (char_length(feedback_text) between 1 and 2000),
  status text not null check (status in ('processing', 'committed', 'failed')),
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, revision_request_id)
);

drop function if exists public.company_r3_begin_feedback_revision(uuid, uuid, integer, integer, text);
create or replace function public.company_r3_begin_feedback_revision(
  p_game_id uuid,
  p_revision_request_id uuid,
  p_expected_turn integer,
  p_expected_state_revision integer,
  p_feedback_text text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_state public.company_r3_state%rowtype;
  v_turn public.company_r3_turns%rowtype;
  v_history public.company_r3_turn_revision_history%rowtype;
  v_job public.company_r3_turn_jobs%rowtype;
  v_attempt public.company_r3_feedback_attempts%rowtype;
begin
  if p_revision_request_id is null or p_expected_turn <= 0 or p_expected_state_revision < 0
     or char_length(p_feedback_text) not between 1 and 2000 or btrim(p_feedback_text) = '' then
    raise exception 'company_r3_feedback_payload_invalid';
  end if;

  select * into v_attempt from public.company_r3_feedback_attempts
    where game_id = p_game_id and revision_request_id = p_revision_request_id for update;
  if found then
    select * into v_turn from public.company_r3_turns where game_id = p_game_id and turn_number = v_attempt.target_turn_number;
    select * into v_history from public.company_r3_turn_revision_history
      where game_id = p_game_id and turn_number = v_attempt.target_turn_number and revision = v_attempt.target_revision;
    if not found then raise exception 'company_r3_feedback_target_missing'; end if;
    return jsonb_build_object('created', false, 'attempt', to_jsonb(v_attempt), 'snapshot', jsonb_build_object('turn', to_jsonb(v_turn), 'history', to_jsonb(v_history)));
  end if;

  select * into v_state from public.company_r3_state where game_id = p_game_id for update;
  if not found or v_state.committed_turn <= 0 or v_state.committed_turn <> p_expected_turn
     or v_state.revision <> p_expected_state_revision then
    raise exception 'company_r3_feedback_revision_conflict';
  end if;

  -- A concurrent creator may have inserted the unique request while this call waited on the state lock.
  select * into v_attempt from public.company_r3_feedback_attempts
    where game_id = p_game_id and revision_request_id = p_revision_request_id for update;
  if found then
    select * into v_turn from public.company_r3_turns where game_id = p_game_id and turn_number = v_attempt.target_turn_number;
    select * into v_history from public.company_r3_turn_revision_history
      where game_id = p_game_id and turn_number = v_attempt.target_turn_number and revision = v_attempt.target_revision;
    if not found then raise exception 'company_r3_feedback_target_missing'; end if;
    return jsonb_build_object('created', false, 'attempt', to_jsonb(v_attempt), 'snapshot', jsonb_build_object('turn', to_jsonb(v_turn), 'history', to_jsonb(v_history)));
  end if;

  select * into v_turn from public.company_r3_turns
    where game_id = p_game_id and turn_number = v_state.committed_turn for update;
  if not found then raise exception 'company_r3_feedback_target_missing'; end if;

  select * into v_history from public.company_r3_turn_revision_history
    where game_id = p_game_id and turn_number = v_turn.turn_number and revision = v_turn.revision
      and state_before is not null
    for update;
  if not found then raise exception 'company_r3_feedback_pre_turn_missing'; end if;
  if v_history.state_revision_after <> v_state.revision then
    raise exception 'company_r3_feedback_revision_conflict';
  end if;

  select * into v_job from public.company_r3_turn_jobs
    where game_id = p_game_id and turn_number = v_state.committed_turn + 1 for update;
  if found and v_job.status in ('processing', 'failed') then
    raise exception 'company_r3_feedback_next_turn_unresolved';
  end if;

  insert into public.company_r3_feedback_attempts(
    game_id, revision_request_id, target_turn_number, target_revision,
    expected_state_revision, original_literal_action, feedback_text, status
  ) values (
    p_game_id, p_revision_request_id, v_turn.turn_number, v_turn.revision,
    v_state.revision, v_turn.literal_action, btrim(p_feedback_text), 'processing'
  ) returning * into v_attempt;

  return jsonb_build_object('created', true, 'attempt', to_jsonb(v_attempt), 'snapshot', jsonb_build_object('turn', to_jsonb(v_turn), 'history', to_jsonb(v_history)));
end;
$$;

drop function if exists public.company_r3_commit_feedback_revision(uuid, uuid, uuid, integer, integer, text, jsonb, text, jsonb, jsonb, jsonb, jsonb, jsonb);
create or replace function public.company_r3_commit_feedback_revision(
  p_game_id uuid,
  p_attempt_id uuid,
  p_revision_request_id uuid,
  p_expected_turn integer,
  p_expected_state_revision integer,
  p_story_text text,
  p_choices jsonb,
  p_turn_summary text,
  p_mind_monitor jsonb,
  p_observer_raw jsonb,
  p_observer_applied jsonb,
  p_warnings jsonb,
  p_state_after jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_state public.company_r3_state%rowtype;
  v_turn public.company_r3_turns%rowtype;
  v_history public.company_r3_turn_revision_history%rowtype;
  v_job public.company_r3_turn_jobs%rowtype;
  v_attempt public.company_r3_feedback_attempts%rowtype;
  v_next_revision integer;
  v_next_state_revision integer;
  v_revision_id uuid;
begin
  if nullif(btrim(p_story_text), '') is null or jsonb_typeof(p_choices) <> 'array'
     or nullif(btrim(p_turn_summary), '') is null or p_state_after is null then
    raise exception 'company_r3_feedback_commit_payload_invalid';
  end if;

  select * into v_state from public.company_r3_state where game_id = p_game_id for update;
  select * into v_attempt from public.company_r3_feedback_attempts
    where attempt_id = p_attempt_id and game_id = p_game_id and revision_request_id = p_revision_request_id for update;
  if not found then raise exception 'company_r3_feedback_attempt_missing'; end if;
  if v_attempt.status = 'committed' then
    return jsonb_build_object('game_id', p_game_id, 'turn_number', v_attempt.target_turn_number, 'revision', v_attempt.target_revision + 1, 'replayed', true);
  end if;
  if v_attempt.status <> 'processing' or v_state.revision <> p_expected_state_revision
     or v_state.committed_turn <> p_expected_turn or v_attempt.target_turn_number <> p_expected_turn
     or v_attempt.expected_state_revision <> p_expected_state_revision then
    raise exception 'company_r3_feedback_revision_conflict';
  end if;

  select * into v_turn from public.company_r3_turns
    where game_id = p_game_id and turn_number = p_expected_turn for update;
  if not found or v_turn.revision <> v_attempt.target_revision then
    raise exception 'company_r3_feedback_revision_conflict';
  end if;
  select * into v_history from public.company_r3_turn_revision_history
    where game_id = p_game_id and turn_number = v_turn.turn_number and revision = v_turn.revision
      and state_before is not null
    for update;
  if not found or v_history.state_revision_after <> v_state.revision then
    raise exception 'company_r3_feedback_revision_conflict';
  end if;

  select * into v_job from public.company_r3_turn_jobs
    where game_id = p_game_id and turn_number = p_expected_turn + 1 for update;
  if found and v_job.status in ('processing', 'failed') then
    raise exception 'company_r3_feedback_next_turn_unresolved';
  end if;

  v_next_revision := v_turn.revision + 1;
  v_next_state_revision := v_state.revision + 1;
  update public.company_r3_turns set
    revision = v_next_revision,
    story_text = p_story_text,
    choices = p_choices,
    turn_summary = btrim(p_turn_summary),
    mind_monitor = coalesce(p_mind_monitor, '{}'::jsonb),
    observer_raw = coalesce(p_observer_raw, '{}'::jsonb),
    observer_applied = coalesce(p_observer_applied, '{}'::jsonb),
    warnings = coalesce(p_warnings, '[]'::jsonb),
    state_after = p_state_after,
    committed_at = now()
  where game_id = p_game_id and turn_number = p_expected_turn;

  insert into public.company_r3_turn_revision_history(
    game_id, turn_number, revision, revision_kind, revision_request_id, feedback_text,
    literal_action, story_text, choices, turn_summary, mind_monitor, observer_raw,
    observer_applied, warnings, state_before, state_after, state_revision_before,
    state_revision_after, supersedes_revision_id
  ) values (
    p_game_id, v_turn.turn_number, v_next_revision, 'feedback', p_revision_request_id,
    v_attempt.feedback_text, v_attempt.original_literal_action, p_story_text, p_choices,
    btrim(p_turn_summary), coalesce(p_mind_monitor, '{}'::jsonb), coalesce(p_observer_raw, '{}'::jsonb),
    coalesce(p_observer_applied, '{}'::jsonb), coalesce(p_warnings, '[]'::jsonb),
    v_history.state_before, p_state_after, v_history.state_revision_before, v_next_state_revision, v_history.revision_id
  ) returning revision_id into v_revision_id;

  update public.company_r3_state set revision = v_next_state_revision, state = p_state_after, updated_at = now() where game_id = p_game_id;
  update public.company_r3_feedback_attempts set status = 'committed', updated_at = now() where attempt_id = p_attempt_id;
  return jsonb_build_object('game_id', p_game_id, 'turn_number', p_expected_turn, 'revision', v_next_revision, 'revision_id', v_revision_id, 'replayed', false);
end;
$$;

drop function if exists public.company_r3_fail_feedback_revision(uuid, uuid, uuid, text);
create or replace function public.company_r3_fail_feedback_revision(
  p_game_id uuid, p_attempt_id uuid, p_revision_request_id uuid, p_error_code text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_attempt public.company_r3_feedback_attempts%rowtype;
begin
  update public.company_r3_feedback_attempts set status = 'failed', error_code = coalesce(nullif(btrim(p_error_code), ''), 'company_r3_feedback_failed'), updated_at = now()
    where attempt_id = p_attempt_id and game_id = p_game_id and revision_request_id = p_revision_request_id and status = 'processing'
    returning * into v_attempt;
  if not found then
    select * into v_attempt from public.company_r3_feedback_attempts where attempt_id = p_attempt_id and game_id = p_game_id and revision_request_id = p_revision_request_id;
    if not found then raise exception 'company_r3_feedback_attempt_missing'; end if;
  end if;
  return to_jsonb(v_attempt);
end;
$$;

-- Replace only the canonical signatures already established by the R3 source.
create or replace function public.company_r3_create_opening(
  p_game_id uuid, p_expected_revision integer, p_story_text text, p_choices jsonb, p_turn_summary text,
  p_mind_monitor jsonb, p_observer_raw jsonb, p_observer_applied jsonb, p_warnings jsonb, p_state_after jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_state public.company_r3_state%rowtype; v_existing public.company_r3_turns%rowtype; v_turn public.company_r3_turns%rowtype;
begin
  if nullif(trim(p_story_text), '') is null or jsonb_typeof(p_choices) <> 'array' or nullif(trim(p_turn_summary), '') is null or p_state_after is null then raise exception 'company_r3_opening_invalid'; end if;
  select * into v_state from public.company_r3_state where game_id = p_game_id for update;
  if not found or v_state.revision <> p_expected_revision then raise exception 'company_r3_opening_conflict'; end if;
  select * into v_existing from public.company_r3_turns where game_id = p_game_id and turn_number = 0 for update;
  if found then return jsonb_build_object('game_id', p_game_id, 'turn_number', 0, 'created', false, 'state_after', v_existing.state_after); end if;
  if v_state.committed_turn <> 0 then raise exception 'company_r3_opening_conflict'; end if;
  insert into public.company_r3_turns(game_id, turn_number, revision, literal_action, story_text, choices, turn_summary, mind_monitor, observer_raw, observer_applied, warnings, state_after)
    values (p_game_id, 0, 1, '', p_story_text, p_choices, trim(p_turn_summary), coalesce(p_mind_monitor, '{}'::jsonb), coalesce(p_observer_raw, '{}'::jsonb), coalesce(p_observer_applied, '{}'::jsonb), coalesce(p_warnings, '[]'::jsonb), p_state_after)
    returning * into v_turn;
  insert into public.company_r3_turn_revision_history(
    game_id, turn_number, revision, revision_kind, literal_action, story_text, choices, turn_summary,
    mind_monitor, observer_raw, observer_applied, warnings, state_before, state_after,
    state_revision_before, state_revision_after
  ) values (
    p_game_id, 0, 1, 'opening', '', p_story_text, p_choices, trim(p_turn_summary),
    coalesce(p_mind_monitor, '{}'::jsonb), coalesce(p_observer_raw, '{}'::jsonb), coalesce(p_observer_applied, '{}'::jsonb), coalesce(p_warnings, '[]'::jsonb),
    v_state.state, p_state_after, v_state.revision, v_state.revision
  );
  update public.company_r3_state set state = p_state_after, updated_at = now() where game_id = p_game_id;
  return jsonb_build_object('game_id', p_game_id, 'turn_number', 0, 'created', true, 'state_after', p_state_after);
end;
$$;

create or replace function public.company_r3_commit_turn(
  p_game_id uuid, p_turn_number integer, p_action_id uuid, p_attempt_no integer, p_expected_revision integer,
  p_story_text text, p_choices jsonb, p_turn_summary text, p_mind_monitor jsonb, p_observer_raw jsonb,
  p_observer_applied jsonb, p_warnings jsonb, p_state_after jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_state public.company_r3_state%rowtype; v_job public.company_r3_turn_jobs%rowtype; v_turn public.company_r3_turns%rowtype;
begin
  if nullif(trim(p_story_text), '') is null or jsonb_typeof(p_choices) <> 'array' or nullif(trim(p_turn_summary), '') is null or p_state_after is null then raise exception 'company_r3_commit_payload_invalid'; end if;
  select * into v_state from public.company_r3_state where game_id = p_game_id for update;
  if not found or v_state.revision <> p_expected_revision or v_state.committed_turn + 1 <> p_turn_number then raise exception 'company_r3_commit_conflict'; end if;
  select * into v_job from public.company_r3_turn_jobs where game_id = p_game_id and turn_number = p_turn_number for update;
  if not found or v_job.status <> 'processing' or v_job.action_id <> p_action_id or v_job.attempt_no <> p_attempt_no then raise exception 'company_r3_attempt_fence_conflict'; end if;
  update public.company_r3_state set revision = revision + 1, committed_turn = p_turn_number, state = p_state_after, updated_at = now() where game_id = p_game_id;
  insert into public.company_r3_turns(game_id, turn_number, revision, literal_action, story_text, choices, turn_summary, mind_monitor, observer_raw, observer_applied, warnings, state_after)
    values (p_game_id, p_turn_number, 1, v_job.literal_action, p_story_text, p_choices, trim(p_turn_summary), coalesce(p_mind_monitor, '{}'::jsonb), coalesce(p_observer_raw, '{}'::jsonb), coalesce(p_observer_applied, '{}'::jsonb), coalesce(p_warnings, '[]'::jsonb), p_state_after)
    returning * into v_turn;
  insert into public.company_r3_turn_revision_history(
    game_id, turn_number, revision, revision_kind, literal_action, story_text, choices, turn_summary,
    mind_monitor, observer_raw, observer_applied, warnings, state_before, state_after,
    state_revision_before, state_revision_after
  ) values (
    p_game_id, p_turn_number, 1, 'ordinary', v_job.literal_action, p_story_text, p_choices, trim(p_turn_summary),
    coalesce(p_mind_monitor, '{}'::jsonb), coalesce(p_observer_raw, '{}'::jsonb), coalesce(p_observer_applied, '{}'::jsonb), coalesce(p_warnings, '[]'::jsonb),
    v_state.state, p_state_after, p_expected_revision, p_expected_revision + 1
  );
  update public.company_r3_turn_jobs set status = 'committed', stage = 'committed', story_text = p_story_text, updated_at = now()
    where game_id = p_game_id and turn_number = p_turn_number and action_id = p_action_id and attempt_no = p_attempt_no and status = 'processing';
  return jsonb_build_object('game_id', p_game_id, 'turn_number', p_turn_number, 'revision', 1);
end;
$$;

revoke all on public.company_r3_turn_revision_history, public.company_r3_feedback_attempts from public, anon, authenticated;
grant select on public.company_r3_turn_revision_history, public.company_r3_feedback_attempts to service_role;
revoke all on function public.company_r3_begin_feedback_revision(uuid, uuid, integer, integer, text), public.company_r3_commit_feedback_revision(uuid, uuid, uuid, integer, integer, text, jsonb, text, jsonb, jsonb, jsonb, jsonb, jsonb), public.company_r3_fail_feedback_revision(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.company_r3_begin_feedback_revision(uuid, uuid, integer, integer, text), public.company_r3_commit_feedback_revision(uuid, uuid, uuid, integer, integer, text, jsonb, text, jsonb, jsonb, jsonb, jsonb, jsonb), public.company_r3_fail_feedback_revision(uuid, uuid, uuid, text) to service_role;

commit;
