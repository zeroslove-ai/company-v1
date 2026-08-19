-- Source only. Apply only in the separately authorized TEST rollout task.

begin;

alter table public.company_v2_turns
  drop constraint if exists company_v2_turns_choices_check;

alter table public.company_v2_turns
  add constraint company_v2_turns_choices_empty_check
  check (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) = 0)
  not valid;

create or replace function public.company_v2_create_opening(
  p_game_id uuid,
  p_story_text text,
  p_parsed_blocks jsonb,
  p_choices jsonb,
  p_turn_summary text,
  p_mind_monitor jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if nullif(trim(p_story_text), '') is null
    or p_choices is null
    or jsonb_typeof(p_choices) <> 'array'
    or jsonb_array_length(p_choices) <> 0
    or nullif(trim(p_turn_summary), '') is null then
    raise exception 'company_v2_opening_invalid';
  end if;
  insert into public.company_v2_turns(game_id, turn_number, literal_action, story_text, parsed_blocks, choices, turn_summary, mind_monitor, state_after)
    select p_game_id, 0, '', p_story_text, p_parsed_blocks, p_choices, p_turn_summary, coalesce(p_mind_monitor, '{}'::jsonb), state
    from public.company_v2_state where game_id = p_game_id
    on conflict (game_id, turn_number) do nothing;
  return jsonb_build_object('game_id', p_game_id, 'turn_number', 0);
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
  if nullif(trim(p_story_text), '') is null
    or nullif(trim(p_turn_summary), '') is null
    or p_choices is null
    or jsonb_typeof(p_choices) <> 'array'
    or jsonb_array_length(p_choices) <> 0 then
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
  update public.company_v2_turn_jobs
    set status = 'committed', story_text = p_story_text, updated_at = now()
    where game_id = p_game_id
      and turn_number = p_turn_number
      and action_id = p_action_id
      and attempt_no = p_attempt_no
      and status = 'processing';
  return jsonb_build_object('game_id', p_game_id, 'turn_number', p_turn_number, 'revision', p_expected_revision + 1);
end;
$$;

revoke all on function public.company_v2_create_opening(uuid, text, jsonb, jsonb, text, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.company_v2_create_opening(uuid, text, jsonb, jsonb, text, jsonb) to service_role;
revoke all on function public.company_v2_commit_turn(uuid, integer, uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.company_v2_commit_turn(uuid, integer, uuid, integer, integer, text, jsonb, jsonb, text, jsonb, jsonb) to service_role;

commit;
