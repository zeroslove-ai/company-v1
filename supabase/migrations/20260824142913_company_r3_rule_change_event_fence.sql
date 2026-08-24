-- Company R3 CSA rule-change event persistence.
-- Additive TEST-bound contract: the pending structured operation survives reconnect
-- and remains inside the existing fenced Story turn. No historical data is changed.

begin;

alter table public.company_r3_turn_jobs
  add column if not exists rule_change_event jsonb;

drop function if exists public.company_r3_reserve_turn(uuid, integer, uuid, text, boolean);

create or replace function public.company_r3_reserve_turn(
  p_game_id uuid, p_turn_number integer, p_action_id uuid, p_literal_action text,
  p_rule_change_event jsonb default null, p_retry_failed boolean default false
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_state public.company_r3_state%rowtype; v_job public.company_r3_turn_jobs%rowtype; v_created boolean := false;
begin
  if char_length(p_literal_action) not between 1 and 2000 or trim(p_literal_action) = '' then raise exception 'company_r3_literal_action_invalid'; end if;
  if p_rule_change_event is not null and jsonb_typeof(p_rule_change_event) <> 'object' then raise exception 'company_r3_rule_change_event_invalid'; end if;
  select * into v_state from public.company_r3_state where game_id = p_game_id for update;
  if not found or v_state.committed_turn + 1 <> p_turn_number then raise exception 'company_r3_turn_conflict'; end if;
  perform public.company_r3_expire_stale_turn(p_game_id, p_turn_number);
  select * into v_job from public.company_r3_turn_jobs where game_id = p_game_id and turn_number = p_turn_number for update;
  if found then
    if v_job.status = 'failed' and p_retry_failed then
      update public.company_r3_turn_jobs
         set action_id = p_action_id, literal_action = p_literal_action, rule_change_event = p_rule_change_event,
             status = 'processing', stage = 'reserved', stage_started_at = now(), story_text = '', error_code = null,
             attempt_no = attempt_no + 1, updated_at = now()
       where game_id = p_game_id and turn_number = p_turn_number returning * into v_job;
      v_created := true;
    end if;
  else
    insert into public.company_r3_turn_jobs(game_id, turn_number, action_id, literal_action, rule_change_event, status, stage_started_at)
      values (p_game_id, p_turn_number, p_action_id, p_literal_action, p_rule_change_event, 'processing', now()) returning * into v_job;
    v_created := true;
  end if;
  return jsonb_build_object('created', v_created, 'retried', v_created and v_job.attempt_no > 1, 'job', to_jsonb(v_job));
end;
$$;

grant execute on function public.company_r3_reserve_turn(uuid, integer, uuid, text, jsonb, boolean) to service_role;

commit;
