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
  turn_number integer not null check (turn_number >= 0),
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
    values (p_game_id, p_turn_number, v_job.literal_action, p_story_text, p_parsed_blocks, p_choices, nullif(trim(p_turn_summary), ''), coalesce(p_mind_monitor, '{}'::jsonb), p_state_after);
  update public.company_v2_turn_jobs set status = 'committed', story_text = p_story_text, updated_at = now()
    where game_id = p_game_id and turn_number = p_turn_number;
  return jsonb_build_object('game_id', p_game_id, 'turn_number', p_turn_number, 'revision', p_expected_revision + 1);
end;
$$;

revoke all on function public.company_v2_commit_turn(uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb) from public;
grant execute on function public.company_v2_commit_turn(uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb) to service_role;
