-- Company v2 Phase 1: fence every post-reservation writer to its immutable attempt.
-- Source only. This migration is intentionally not applied by the Phase 1 task.

drop function if exists public.company_v2_update_turn_progress(uuid, integer, text);
drop function if exists public.company_v2_fail_turn(uuid, integer, text);
drop function if exists public.company_v2_commit_turn(uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb);

create or replace function public.company_v2_update_turn_progress(
  p_game_id uuid,
  p_turn_number integer,
  p_action_id uuid,
  p_attempt_no integer,
  p_story_text text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.company_v2_turn_jobs%rowtype;
begin
  update public.company_v2_turn_jobs
    set story_text = p_story_text, updated_at = now()
    where game_id = p_game_id
      and turn_number = p_turn_number
      and status = 'processing'
      and action_id = p_action_id
      and attempt_no = p_attempt_no
    returning * into v_job;
  if not found then raise exception 'v2_attempt_fence_conflict'; end if;
  return to_jsonb(v_job);
end;
$$;

create or replace function public.company_v2_fail_turn(
  p_game_id uuid,
  p_turn_number integer,
  p_action_id uuid,
  p_attempt_no integer,
  p_error_code text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.company_v2_turn_jobs%rowtype;
begin
  update public.company_v2_turn_jobs
    set status = 'failed', error_code = coalesce(nullif(trim(p_error_code), ''), 'turn_failed'), updated_at = now()
    where game_id = p_game_id
      and turn_number = p_turn_number
      and status = 'processing'
      and action_id = p_action_id
      and attempt_no = p_attempt_no
    returning * into v_job;
  if not found then raise exception 'v2_attempt_fence_conflict'; end if;
  return to_jsonb(v_job);
end;
$$;

create or replace function public.company_v2_commit_turn(
  p_game_id uuid,
  p_turn_number integer,
  p_action_id uuid,
  p_attempt_no integer,
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
  if not found or v_job.status <> 'processing' or v_job.action_id <> p_action_id or v_job.attempt_no <> p_attempt_no then
    raise exception 'v2_attempt_fence_conflict';
  end if;

  update public.company_v2_state
    set revision = revision + 1, committed_turn = p_turn_number, state = p_state_after, updated_at = now()
    where game_id = p_game_id;
  insert into public.company_v2_turns(game_id, turn_number, literal_action, story_text, parsed_blocks, choices, turn_summary, mind_monitor, state_after)
    values (p_game_id, p_turn_number, v_job.literal_action, p_story_text, p_parsed_blocks, p_choices, trim(p_turn_summary), coalesce(p_mind_monitor, '{}'::jsonb), p_state_after);
  update public.company_v2_turn_jobs set status = 'committed', story_text = p_story_text, updated_at = now()
    where game_id = p_game_id and turn_number = p_turn_number and action_id = p_action_id and attempt_no = p_attempt_no and status = 'processing';
  return jsonb_build_object('game_id', p_game_id, 'turn_number', p_turn_number, 'revision', p_expected_revision + 1);
end;
$$;

revoke all on function public.company_v2_update_turn_progress(uuid, integer, uuid, integer, text) from public;
grant execute on function public.company_v2_update_turn_progress(uuid, integer, uuid, integer, text) to service_role;
revoke all on function public.company_v2_fail_turn(uuid, integer, uuid, integer, text) from public;
grant execute on function public.company_v2_fail_turn(uuid, integer, uuid, integer, text) to service_role;
revoke all on function public.company_v2_commit_turn(uuid, integer, uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb) from public;
grant execute on function public.company_v2_commit_turn(uuid, integer, uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb) to service_role;
