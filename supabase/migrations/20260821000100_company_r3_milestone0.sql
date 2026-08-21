-- Company R3 Milestone 0 source only.
-- Apply only through a separately authorized TEST rollout task.
-- Historical v1/v2 tables and games are immutable evidence.

begin;

create table if not exists public.company_r3_games (
  game_id uuid primary key default gen_random_uuid(),
  content_version text not null,
  profile jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.company_r3_state (
  game_id uuid primary key references public.company_r3_games(game_id) on delete cascade,
  revision integer not null default 0 check (revision >= 0),
  committed_turn integer not null default 0 check (committed_turn >= 0),
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.company_r3_turn_jobs (
  game_id uuid not null references public.company_r3_games(game_id) on delete cascade,
  turn_number integer not null check (turn_number > 0),
  action_id uuid not null,
  attempt_no integer not null default 1 check (attempt_no > 0),
  literal_action text not null check (char_length(literal_action) between 1 and 2000),
  status text not null check (status in ('processing', 'committed', 'failed')),
  stage text not null default 'reserved',
  story_text text not null default '',
  error_code text,
  progress_writes integer not null default 0 check (progress_writes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (game_id, turn_number)
);

create table if not exists public.company_r3_turns (
  game_id uuid not null references public.company_r3_games(game_id) on delete cascade,
  turn_number integer not null check (turn_number >= 0),
  revision integer not null default 1 check (revision > 0),
  literal_action text not null,
  story_text text not null,
  choices jsonb not null default '[]'::jsonb check (jsonb_typeof(choices) = 'array'),
  turn_summary text not null,
  mind_monitor jsonb not null default '{}'::jsonb,
  observer_raw jsonb not null default '{}'::jsonb,
  observer_applied jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  state_after jsonb not null,
  committed_at timestamptz not null default now(),
  primary key (game_id, turn_number)
);

create table if not exists public.company_r3_system_events (
  event_id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.company_r3_games(game_id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.company_r3_create_game(p_content_version text, p_profile jsonb, p_state jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_game_id uuid;
begin
  insert into public.company_r3_games(content_version, profile) values (p_content_version, p_profile) returning game_id into v_game_id;
  insert into public.company_r3_state(game_id, state) values (v_game_id, p_state);
  return jsonb_build_object('game_id', v_game_id);
end;
$$;

create or replace function public.company_r3_create_opening(
  p_game_id uuid, p_story_text text, p_choices jsonb, p_turn_summary text,
  p_mind_monitor jsonb, p_observer_raw jsonb, p_observer_applied jsonb, p_warnings jsonb, p_state_after jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_state public.company_r3_state%rowtype; v_existing public.company_r3_turns%rowtype;
begin
  if nullif(trim(p_story_text), '') is null or jsonb_typeof(p_choices) <> 'array' or nullif(trim(p_turn_summary), '') is null then raise exception 'company_r3_opening_invalid'; end if;
  if p_state_after is null then raise exception 'company_r3_opening_invalid'; end if;
  select * into v_state from public.company_r3_state where game_id = p_game_id for update;
  if not found then raise exception 'company_r3_opening_conflict'; end if;
  select * into v_existing from public.company_r3_turns where game_id = p_game_id and turn_number = 0 for update;
  if found then
    return jsonb_build_object('game_id', p_game_id, 'turn_number', 0, 'created', false, 'state_after', v_existing.state_after);
  end if;
  if v_state.committed_turn <> 0 then raise exception 'company_r3_opening_conflict'; end if;
  insert into public.company_r3_turns(game_id, turn_number, literal_action, story_text, choices, turn_summary, mind_monitor, observer_raw, observer_applied, warnings, state_after)
    values (p_game_id, 0, '', p_story_text, p_choices, trim(p_turn_summary), coalesce(p_mind_monitor, '{}'::jsonb), coalesce(p_observer_raw, '{}'::jsonb), coalesce(p_observer_applied, '{}'::jsonb), coalesce(p_warnings, '[]'::jsonb), p_state_after)
    on conflict (game_id, turn_number) do nothing;
  update public.company_r3_state set state = p_state_after, updated_at = now() where game_id = p_game_id;
  return jsonb_build_object('game_id', p_game_id, 'turn_number', 0, 'created', true, 'state_after', p_state_after);
end;
$$;

create or replace function public.company_r3_expire_stale_turn(p_game_id uuid, p_turn_number integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_job public.company_r3_turn_jobs%rowtype;
begin
  update public.company_r3_turn_jobs set status = 'failed', stage = 'failed', error_code = 'company_r3_stale_turn_timeout', updated_at = now()
    where game_id = p_game_id and turn_number = p_turn_number and status = 'processing' and updated_at <= now() - interval '180 seconds' returning * into v_job;
  if not found then return null; end if;
  return to_jsonb(v_job);
end;
$$;

create or replace function public.company_r3_reserve_turn(p_game_id uuid, p_turn_number integer, p_action_id uuid, p_literal_action text, p_retry_failed boolean default false)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_state public.company_r3_state%rowtype; v_job public.company_r3_turn_jobs%rowtype; v_created boolean := false;
begin
  if char_length(p_literal_action) not between 1 and 2000 or trim(p_literal_action) = '' then raise exception 'company_r3_literal_action_invalid'; end if;
  select * into v_state from public.company_r3_state where game_id = p_game_id for update;
  if not found or v_state.committed_turn + 1 <> p_turn_number then raise exception 'company_r3_turn_conflict'; end if;
  perform public.company_r3_expire_stale_turn(p_game_id, p_turn_number);
  select * into v_job from public.company_r3_turn_jobs where game_id = p_game_id and turn_number = p_turn_number for update;
  if found then
    if v_job.status = 'failed' and p_retry_failed then
      update public.company_r3_turn_jobs set action_id = p_action_id, literal_action = p_literal_action, status = 'processing', stage = 'reserved', story_text = '', error_code = null, attempt_no = attempt_no + 1, updated_at = now() where game_id = p_game_id and turn_number = p_turn_number returning * into v_job;
      v_created := true;
    end if;
  else
    insert into public.company_r3_turn_jobs(game_id, turn_number, action_id, literal_action, status) values (p_game_id, p_turn_number, p_action_id, p_literal_action, 'processing') returning * into v_job;
    v_created := true;
  end if;
  return jsonb_build_object('created', v_created, 'job', to_jsonb(v_job));
end;
$$;

create or replace function public.company_r3_update_turn_progress(p_game_id uuid, p_turn_number integer, p_action_id uuid, p_attempt_no integer, p_story_text text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_job public.company_r3_turn_jobs%rowtype;
begin
  update public.company_r3_turn_jobs set story_text = p_story_text, stage = 'story_streaming', progress_writes = progress_writes + 1, updated_at = now()
    where game_id = p_game_id and turn_number = p_turn_number and status = 'processing' and action_id = p_action_id and attempt_no = p_attempt_no returning * into v_job;
  if not found then raise exception 'company_r3_attempt_fence_conflict'; end if;
  return to_jsonb(v_job);
end;
$$;

create or replace function public.company_r3_mark_story_complete(p_game_id uuid, p_turn_number integer, p_action_id uuid, p_attempt_no integer, p_story_text text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_job public.company_r3_turn_jobs%rowtype;
begin
  update public.company_r3_turn_jobs set story_text = p_story_text, stage = 'story_complete', updated_at = now()
    where game_id = p_game_id and turn_number = p_turn_number and status = 'processing' and action_id = p_action_id and attempt_no = p_attempt_no returning * into v_job;
  if not found then raise exception 'company_r3_attempt_fence_conflict'; end if;
  return to_jsonb(v_job);
end;
$$;

create or replace function public.company_r3_fail_turn(p_game_id uuid, p_turn_number integer, p_action_id uuid, p_attempt_no integer, p_error_code text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_job public.company_r3_turn_jobs%rowtype;
begin
  update public.company_r3_turn_jobs set status = 'failed', stage = 'failed', error_code = coalesce(nullif(trim(p_error_code), ''), 'company_r3_turn_failed'), updated_at = now()
    where game_id = p_game_id and turn_number = p_turn_number and status = 'processing' and action_id = p_action_id and attempt_no = p_attempt_no returning * into v_job;
  if not found then raise exception 'company_r3_attempt_fence_conflict'; end if;
  return to_jsonb(v_job);
end;
$$;

create or replace function public.company_r3_commit_turn(
  p_game_id uuid, p_turn_number integer, p_action_id uuid, p_attempt_no integer, p_expected_revision integer,
  p_story_text text, p_choices jsonb, p_turn_summary text, p_mind_monitor jsonb, p_observer_raw jsonb,
  p_observer_applied jsonb, p_warnings jsonb, p_state_after jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_state public.company_r3_state%rowtype; v_job public.company_r3_turn_jobs%rowtype;
begin
  if nullif(trim(p_story_text), '') is null or jsonb_typeof(p_choices) <> 'array' or nullif(trim(p_turn_summary), '') is null then raise exception 'company_r3_commit_payload_invalid'; end if;
  select * into v_state from public.company_r3_state where game_id = p_game_id for update;
  if not found or v_state.revision <> p_expected_revision or v_state.committed_turn + 1 <> p_turn_number then raise exception 'company_r3_commit_conflict'; end if;
  select * into v_job from public.company_r3_turn_jobs where game_id = p_game_id and turn_number = p_turn_number for update;
  if not found or v_job.status <> 'processing' or v_job.action_id <> p_action_id or v_job.attempt_no <> p_attempt_no then raise exception 'company_r3_attempt_fence_conflict'; end if;
  update public.company_r3_state set revision = revision + 1, committed_turn = p_turn_number, state = p_state_after, updated_at = now() where game_id = p_game_id;
  insert into public.company_r3_turns(game_id, turn_number, literal_action, story_text, choices, turn_summary, mind_monitor, observer_raw, observer_applied, warnings, state_after)
    values (p_game_id, p_turn_number, v_job.literal_action, p_story_text, p_choices, trim(p_turn_summary), coalesce(p_mind_monitor, '{}'::jsonb), coalesce(p_observer_raw, '{}'::jsonb), coalesce(p_observer_applied, '{}'::jsonb), coalesce(p_warnings, '[]'::jsonb), p_state_after);
  update public.company_r3_turn_jobs set status = 'committed', stage = 'committed', story_text = p_story_text, updated_at = now() where game_id = p_game_id and turn_number = p_turn_number and action_id = p_action_id and attempt_no = p_attempt_no and status = 'processing';
  return jsonb_build_object('game_id', p_game_id, 'turn_number', p_turn_number, 'revision', p_expected_revision + 1);
end;
$$;

revoke all on public.company_r3_games, public.company_r3_state, public.company_r3_turn_jobs, public.company_r3_turns, public.company_r3_system_events from public, anon, authenticated;
revoke all on function public.company_r3_create_game(text, jsonb, jsonb), public.company_r3_create_opening(uuid, text, jsonb, text, jsonb, jsonb, jsonb, jsonb, jsonb), public.company_r3_expire_stale_turn(uuid, integer), public.company_r3_reserve_turn(uuid, integer, uuid, text, boolean), public.company_r3_update_turn_progress(uuid, integer, uuid, integer, text), public.company_r3_mark_story_complete(uuid, integer, uuid, integer, text), public.company_r3_fail_turn(uuid, integer, uuid, integer, text), public.company_r3_commit_turn(uuid, integer, uuid, integer, integer, text, jsonb, text, jsonb, jsonb, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant select on public.company_r3_games, public.company_r3_state, public.company_r3_turn_jobs, public.company_r3_turns, public.company_r3_system_events to service_role;
grant execute on function public.company_r3_create_game(text, jsonb, jsonb), public.company_r3_create_opening(uuid, text, jsonb, text, jsonb, jsonb, jsonb, jsonb, jsonb), public.company_r3_expire_stale_turn(uuid, integer), public.company_r3_reserve_turn(uuid, integer, uuid, text, boolean), public.company_r3_update_turn_progress(uuid, integer, uuid, integer, text), public.company_r3_mark_story_complete(uuid, integer, uuid, integer, text), public.company_r3_fail_turn(uuid, integer, uuid, integer, text), public.company_r3_commit_turn(uuid, integer, uuid, integer, integer, text, jsonb, text, jsonb, jsonb, jsonb, jsonb, jsonb) to service_role;

commit;
