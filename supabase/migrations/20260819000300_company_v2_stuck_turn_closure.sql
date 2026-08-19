-- Company v2 Phase 1 correction: terminalize abandoned processing jobs and
-- make the first reservation converge on the canonical primary-key row.
-- Source only. This migration is intentionally not applied by the Phase 1 task.

create or replace function public.company_v2_expire_stale_turn(
  p_game_id uuid, p_turn_number integer
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_job public.company_v2_turn_jobs%rowtype;
begin
  update public.company_v2_turn_jobs
    set status = 'failed', error_code = 'stale_turn_timeout', updated_at = now()
    where game_id = p_game_id
      and turn_number = p_turn_number
      and status = 'processing'
      and updated_at <= now() - interval '180 seconds'
    returning * into v_job;
  if not found then return null; end if;
  return to_jsonb(v_job);
end;
$$;

create or replace function public.company_v2_reserve_turn(
  p_game_id uuid, p_turn_number integer, p_action_id uuid, p_literal_action text, p_retry_failed boolean default false
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_job public.company_v2_turn_jobs%rowtype; v_created boolean := false; v_retried boolean := false;
begin
  if char_length(p_literal_action) not between 1 and 2000 or trim(p_literal_action) = '' then raise exception 'company_v2_literal_action_invalid'; end if;
  perform public.company_v2_expire_stale_turn(p_game_id, p_turn_number);
  select * into v_job from public.company_v2_turn_jobs where game_id = p_game_id and turn_number = p_turn_number for update;
  if found then
    if v_job.status = 'failed' and p_retry_failed then
      update public.company_v2_turn_jobs
        set action_id = p_action_id, literal_action = p_literal_action, status = 'processing', story_text = '', error_code = null, attempt_no = attempt_no + 1, updated_at = now()
        where game_id = p_game_id and turn_number = p_turn_number returning * into v_job;
      v_created := true; v_retried := true;
    end if;
  else
    insert into public.company_v2_turn_jobs(game_id, turn_number, action_id, literal_action, status)
      values (p_game_id, p_turn_number, p_action_id, p_literal_action, 'processing')
      on conflict (game_id, turn_number) do nothing
      returning * into v_job;
    if found then
      v_created := true;
    else
      select * into v_job from public.company_v2_turn_jobs where game_id = p_game_id and turn_number = p_turn_number for update;
    end if;
  end if;
  return jsonb_build_object('created', v_created, 'retried', v_retried, 'job', to_jsonb(v_job));
end;
$$;

revoke all on function public.company_v2_expire_stale_turn(uuid, integer) from public, anon, authenticated;
grant execute on function public.company_v2_expire_stale_turn(uuid, integer) to service_role;
revoke all on function public.company_v2_reserve_turn(uuid, integer, uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.company_v2_reserve_turn(uuid, integer, uuid, text, boolean) to service_role;
