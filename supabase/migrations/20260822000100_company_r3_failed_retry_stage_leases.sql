-- Company R3 P0 failed retry and stage-aware stale terminalization.
-- Additive only; never edit or replay the applied Milestone 0 migration.

begin;

alter table public.company_r3_turn_jobs
  add column if not exists stage_started_at timestamptz;

update public.company_r3_turn_jobs
   set stage_started_at = coalesce(stage_started_at, updated_at, created_at)
 where stage_started_at is null;

alter table public.company_r3_turn_jobs
  alter column stage_started_at set default now(),
  alter column stage_started_at set not null;

create or replace function public.company_r3_expire_stale_turn(p_game_id uuid, p_turn_number integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_job public.company_r3_turn_jobs%rowtype;
begin
  update public.company_r3_turn_jobs
     set status = 'failed', stage = 'failed', error_code = 'company_r3_stale_turn_timeout',
         stage_started_at = now(), updated_at = now()
   where game_id = p_game_id
     and turn_number = p_turn_number
     and status = 'processing'
     and stage_started_at <= now() - case
       when stage in ('reserved', 'story_streaming') then interval '130 seconds'
       when stage = 'story_complete' then interval '85 seconds'
       else interval '130 seconds'
     end
   returning * into v_job;
  if not found then return null; end if;
  return to_jsonb(v_job);
end;
$$;

create or replace function public.company_r3_reserve_turn(
  p_game_id uuid, p_turn_number integer, p_action_id uuid, p_literal_action text,
  p_retry_failed boolean default false
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_state public.company_r3_state%rowtype; v_job public.company_r3_turn_jobs%rowtype; v_created boolean := false;
begin
  if char_length(p_literal_action) not between 1 and 2000 or trim(p_literal_action) = '' then raise exception 'company_r3_literal_action_invalid'; end if;
  select * into v_state from public.company_r3_state where game_id = p_game_id for update;
  if not found or v_state.committed_turn + 1 <> p_turn_number then raise exception 'company_r3_turn_conflict'; end if;
  perform public.company_r3_expire_stale_turn(p_game_id, p_turn_number);
  select * into v_job from public.company_r3_turn_jobs where game_id = p_game_id and turn_number = p_turn_number for update;
  if found then
    if v_job.status = 'failed' and p_retry_failed then
      update public.company_r3_turn_jobs
         set action_id = p_action_id, literal_action = p_literal_action, status = 'processing', stage = 'reserved',
             stage_started_at = now(), story_text = '', error_code = null, attempt_no = attempt_no + 1, updated_at = now()
       where game_id = p_game_id and turn_number = p_turn_number
       returning * into v_job;
      v_created := true;
    end if;
  else
    insert into public.company_r3_turn_jobs(game_id, turn_number, action_id, literal_action, status, stage_started_at)
      values (p_game_id, p_turn_number, p_action_id, p_literal_action, 'processing', now())
      returning * into v_job;
    v_created := true;
  end if;
  return jsonb_build_object('created', v_created, 'retried', v_created and v_job.attempt_no > 1, 'job', to_jsonb(v_job));
end;
$$;

create or replace function public.company_r3_update_turn_progress(
  p_game_id uuid, p_turn_number integer, p_action_id uuid, p_attempt_no integer, p_story_text text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_job public.company_r3_turn_jobs%rowtype;
begin
  update public.company_r3_turn_jobs
     set story_text = p_story_text, stage = 'story_streaming',
         stage_started_at = case when stage = 'story_streaming' then stage_started_at else now() end,
         progress_writes = progress_writes + 1, updated_at = now()
   where game_id = p_game_id and turn_number = p_turn_number and status = 'processing'
     and action_id = p_action_id and attempt_no = p_attempt_no
   returning * into v_job;
  if not found then raise exception 'company_r3_attempt_fence_conflict'; end if;
  return to_jsonb(v_job);
end;
$$;

create or replace function public.company_r3_mark_story_complete(
  p_game_id uuid, p_turn_number integer, p_action_id uuid, p_attempt_no integer, p_story_text text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_job public.company_r3_turn_jobs%rowtype;
begin
  update public.company_r3_turn_jobs
     set story_text = p_story_text, stage = 'story_complete',
         stage_started_at = case when stage = 'story_complete' then stage_started_at else now() end,
         updated_at = now()
   where game_id = p_game_id and turn_number = p_turn_number and status = 'processing'
     and action_id = p_action_id and attempt_no = p_attempt_no
   returning * into v_job;
  if not found then raise exception 'company_r3_attempt_fence_conflict'; end if;
  return to_jsonb(v_job);
end;
$$;

create or replace function public.company_r3_fail_turn(
  p_game_id uuid, p_turn_number integer, p_action_id uuid, p_attempt_no integer, p_error_code text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_job public.company_r3_turn_jobs%rowtype;
begin
  update public.company_r3_turn_jobs
     set status = 'failed', stage = 'failed', stage_started_at = now(),
         error_code = coalesce(nullif(trim(p_error_code), ''), 'company_r3_turn_failed'), updated_at = now()
   where game_id = p_game_id and turn_number = p_turn_number and status = 'processing'
     and action_id = p_action_id and attempt_no = p_attempt_no
   returning * into v_job;
  if not found then raise exception 'company_r3_attempt_fence_conflict'; end if;
  return to_jsonb(v_job);
end;
$$;

commit;
