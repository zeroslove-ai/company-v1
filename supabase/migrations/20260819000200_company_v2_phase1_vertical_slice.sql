-- Company v2 Phase 1: isolated mutable gameplay source.
-- Source only. This migration is intentionally not applied by the Phase 1 task.

create table if not exists public.company_v2_games (
  game_id uuid primary key default gen_random_uuid(),
  content_version text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.company_v2_state (
  game_id uuid primary key references public.company_v2_games(game_id) on delete cascade,
  revision integer not null default 0 check (revision >= 0),
  committed_turn integer not null default 0 check (committed_turn >= 0),
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.company_v2_turn_jobs (
  game_id uuid not null references public.company_v2_games(game_id) on delete cascade,
  turn_number integer not null check (turn_number > 0),
  action_id uuid not null,
  literal_action text not null check (char_length(literal_action) between 1 and 2000),
  status text not null check (status in ('processing', 'committed', 'failed')),
  story_text text not null default '',
  error_code text,
  attempt_no integer not null default 1 check (attempt_no > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (game_id, turn_number)
);

create or replace function public.company_v2_create_game(p_content_version text, p_state jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_game_id uuid;
begin
  insert into public.company_v2_games(content_version) values (p_content_version) returning game_id into v_game_id;
  insert into public.company_v2_state(game_id, state) values (v_game_id, p_state);
  return jsonb_build_object('game_id', v_game_id);
end;
$$;

create or replace function public.company_v2_create_opening(
  p_game_id uuid, p_story_text text, p_parsed_blocks jsonb, p_choices jsonb, p_turn_summary text, p_mind_monitor jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if nullif(trim(p_story_text), '') is null or jsonb_typeof(p_choices) <> 'array' or jsonb_array_length(p_choices) <> 4 or nullif(trim(p_turn_summary), '') is null then
    raise exception 'company_v2_opening_invalid';
  end if;
  insert into public.company_v2_turns(game_id, turn_number, literal_action, story_text, parsed_blocks, choices, turn_summary, mind_monitor, state_after)
    select p_game_id, 0, '', p_story_text, p_parsed_blocks, p_choices, p_turn_summary, coalesce(p_mind_monitor, '{}'::jsonb), state
    from public.company_v2_state where game_id = p_game_id
    on conflict (game_id, turn_number) do nothing;
  return jsonb_build_object('game_id', p_game_id, 'turn_number', 0);
end;
$$;

create or replace function public.company_v2_reserve_turn(
  p_game_id uuid, p_turn_number integer, p_action_id uuid, p_literal_action text, p_retry_failed boolean default false
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_job public.company_v2_turn_jobs%rowtype; v_created boolean := false; v_retried boolean := false;
begin
  if char_length(p_literal_action) not between 1 and 2000 or trim(p_literal_action) = '' then raise exception 'company_v2_literal_action_invalid'; end if;
  select * into v_job from public.company_v2_turn_jobs where game_id = p_game_id and turn_number = p_turn_number for update;
  if found then
    if v_job.status = 'failed' and p_retry_failed then
      update public.company_v2_turn_jobs set action_id = p_action_id, literal_action = p_literal_action, status = 'processing', story_text = '', error_code = null, attempt_no = attempt_no + 1, updated_at = now()
        where game_id = p_game_id and turn_number = p_turn_number returning * into v_job;
      v_created := true; v_retried := true;
    end if;
  else
    insert into public.company_v2_turn_jobs(game_id, turn_number, action_id, literal_action, status)
      values (p_game_id, p_turn_number, p_action_id, p_literal_action, 'processing') returning * into v_job;
    v_created := true;
  end if;
  return jsonb_build_object('created', v_created, 'retried', v_retried, 'job', to_jsonb(v_job));
end;
$$;

create or replace function public.company_v2_update_turn_progress(p_game_id uuid, p_turn_number integer, p_story_text text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_job public.company_v2_turn_jobs%rowtype;
begin
  update public.company_v2_turn_jobs set story_text = p_story_text, updated_at = now()
    where game_id = p_game_id and turn_number = p_turn_number and status = 'processing' returning * into v_job;
  if not found then raise exception 'company_v2_job_not_processing'; end if;
  return to_jsonb(v_job);
end;
$$;

create or replace function public.company_v2_fail_turn(p_game_id uuid, p_turn_number integer, p_error_code text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_job public.company_v2_turn_jobs%rowtype;
begin
  update public.company_v2_turn_jobs set status = 'failed', error_code = coalesce(nullif(trim(p_error_code), ''), 'turn_failed'), updated_at = now()
    where game_id = p_game_id and turn_number = p_turn_number and status = 'processing' returning * into v_job;
  if not found then raise exception 'company_v2_job_not_processing'; end if;
  return to_jsonb(v_job);
end;
$$;

create table if not exists public.company_v2_turns (
  game_id uuid not null references public.company_v2_games(game_id) on delete cascade,
  turn_number integer not null check (turn_number >= 0),
  literal_action text not null,
  story_text text not null,
  parsed_blocks jsonb not null,
  choices jsonb not null check (jsonb_array_length(choices) = 4),
  turn_summary text not null,
  mind_monitor jsonb not null default '{}'::jsonb,
  state_after jsonb not null,
  committed_at timestamptz not null default now(),
  primary key (game_id, turn_number)
);

create or replace function public.company_v2_commit_turn(
  p_game_id uuid,
  p_turn_number integer,
  p_expected_revision integer,
  p_story_text text,
  p_parsed_blocks jsonb,
  p_choices jsonb,
  p_turn_summary text,
  p_mind_monitor jsonb,
  p_state_after jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_state public.company_v2_state%rowtype;
  v_job public.company_v2_turn_jobs%rowtype;
begin
  if nullif(trim(p_story_text), '') is null or nullif(trim(p_turn_summary), '') is null or jsonb_typeof(p_choices) <> 'array' or jsonb_array_length(p_choices) <> 4 then
    raise exception 'company_v2_commit_payload_invalid';
  end if;
  select * into v_state from public.company_v2_state where game_id = p_game_id for update;
  if not found or v_state.revision <> p_expected_revision or v_state.committed_turn + 1 <> p_turn_number then
    raise exception 'company_v2_commit_conflict' using errcode = '40001';
  end if;
  select * into v_job from public.company_v2_turn_jobs where game_id = p_game_id and turn_number = p_turn_number for update;
  if not found or v_job.status <> 'processing' then raise exception 'company_v2_job_not_processing'; end if;

  update public.company_v2_state
    set revision = revision + 1, committed_turn = p_turn_number, state = p_state_after, updated_at = now()
    where game_id = p_game_id;
  insert into public.company_v2_turns(game_id, turn_number, literal_action, story_text, parsed_blocks, choices, turn_summary, mind_monitor, state_after)
    values (p_game_id, p_turn_number, v_job.literal_action, p_story_text, p_parsed_blocks, p_choices, trim(p_turn_summary), coalesce(p_mind_monitor, '{}'::jsonb), p_state_after);
  update public.company_v2_turn_jobs set status = 'committed', story_text = p_story_text, updated_at = now()
    where game_id = p_game_id and turn_number = p_turn_number;
  return jsonb_build_object('game_id', p_game_id, 'turn_number', p_turn_number, 'revision', p_expected_revision + 1);
end;
$$;

revoke all on function public.company_v2_commit_turn(uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb) from public;
grant execute on function public.company_v2_commit_turn(uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb) to service_role;

revoke all on public.company_v2_games, public.company_v2_state, public.company_v2_turn_jobs, public.company_v2_turns from public, anon, authenticated;
grant select on public.company_v2_games, public.company_v2_state, public.company_v2_turn_jobs, public.company_v2_turns to service_role;
revoke all on function public.company_v2_create_game(text, jsonb), public.company_v2_create_opening(uuid, text, jsonb, jsonb, text, jsonb), public.company_v2_reserve_turn(uuid, integer, uuid, text, boolean), public.company_v2_update_turn_progress(uuid, integer, text), public.company_v2_fail_turn(uuid, integer, text) from public;
grant execute on function public.company_v2_create_game(text, jsonb), public.company_v2_create_opening(uuid, text, jsonb, jsonb, text, jsonb), public.company_v2_reserve_turn(uuid, integer, uuid, text, boolean), public.company_v2_update_turn_progress(uuid, integer, text), public.company_v2_fail_turn(uuid, integer, text) to service_role;
