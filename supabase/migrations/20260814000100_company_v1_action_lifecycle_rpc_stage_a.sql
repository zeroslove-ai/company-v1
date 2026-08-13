-- Company v1 Authority Consolidation Cut 1, Stage A.
-- Add named atomic action lifecycle CAS functions before the API rollout.
-- This migration intentionally does not revoke table DML or remove the CSA
-- preapply function; those enforcement changes belong to Stage B.

create or replace function public.claim_game_action_stage(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_status text,
  p_expected_error_mode text,
  p_expected_error_code text,
  p_next_status text,
  p_next_error_code text,
  p_require_stale boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_action public.game_actions%rowtype;
  v_mode text := upper(trim(coalesce(p_expected_error_mode, '')));
begin
  if v_mode not in ('ANY', 'NULL', 'EXACT') then
    raise exception 'invalid expected error mode' using errcode = '22023';
  end if;
  if v_mode = 'EXACT' and p_expected_error_code is null then
    raise exception 'exact expected error code is required' using errcode = '22023';
  end if;
  if p_expected_status = 'story_streaming' and p_next_status = 'story_streaming' and not coalesce(p_require_stale, false) then
    if p_expected_error_mode <> 'NULL' then
      raise exception 'fresh story claim requires NULL expected error condition' using errcode = '22023';
    end if;
  end if;
  if p_next_status = 'story_streaming' and (p_next_error_code is null or p_next_error_code not like 'story_in_progress:%') then
    raise exception 'story claim requires owner token' using errcode = '22023';
  end if;
  if not (
    (p_expected_status = 'story_failed' and p_next_status = 'story_streaming')
    or (p_expected_status = 'story_streaming' and p_next_status = 'story_streaming')
    or (p_expected_status = 'extract_failed' and p_next_status = 'extracting')
    or (p_expected_status = 'extracting' and p_next_status = 'extracting')
  ) then
    raise exception 'invalid action claim transition' using errcode = '22023';
  end if;

  select * into v_action
  from public.game_actions
  where game_id = p_game_id and action_id = p_action_id
  for update;
  if not found then
    raise exception 'action not found' using errcode = 'P0002';
  end if;

  update public.game_actions
  set processing_status = p_next_status,
      error_code = p_next_error_code,
      updated_at = now()
  where game_id = p_game_id
    and action_id = p_action_id
    and processing_status = p_expected_status
    and (
      v_mode = 'ANY'
      or (v_mode = 'NULL' and error_code is null)
      or (v_mode = 'EXACT' and error_code = p_expected_error_code)
    )
    and (
      not (p_expected_status = 'story_streaming' and p_next_status = 'story_streaming' and coalesce(p_require_stale, false))
      or v_action.updated_at <= now() - interval '3 minutes'
    )
  returning * into v_action;

  if not found then
    return null;
  end if;
  return to_jsonb(v_action);
end;
$$;

create or replace function public.fail_game_action_stage(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_status text,
  p_expected_error_mode text,
  p_expected_error_code text,
  p_next_status text,
  p_next_error_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_action public.game_actions%rowtype;
  v_mode text := upper(trim(coalesce(p_expected_error_mode, '')));
begin
  if v_mode not in ('ANY', 'NULL', 'EXACT') then
    raise exception 'invalid expected error mode' using errcode = '22023';
  end if;
  if v_mode = 'EXACT' and p_expected_error_code is null then
    raise exception 'exact expected error code is required' using errcode = '22023';
  end if;
  if p_next_error_code is null or trim(p_next_error_code) = '' then
    raise exception 'next error code is required for failure' using errcode = '22023';
  end if;
  if not (
    (p_expected_status = 'story_streaming' and p_next_status = 'story_failed')
    or (p_expected_status = 'extracting' and p_next_status = 'extract_failed')
  ) then
    raise exception 'invalid action failure transition' using errcode = '22023';
  end if;

  select * into v_action
  from public.game_actions
  where game_id = p_game_id and action_id = p_action_id
  for update;
  if not found then
    raise exception 'action not found' using errcode = 'P0002';
  end if;

  update public.game_actions
  set processing_status = p_next_status,
      error_code = p_next_error_code,
      updated_at = now()
  where game_id = p_game_id
    and action_id = p_action_id
    and processing_status = p_expected_status
    and (
      v_mode = 'ANY'
      or (v_mode = 'NULL' and error_code is null)
      or (v_mode = 'EXACT' and error_code = p_expected_error_code)
    )
  returning * into v_action;

  if not found then
    return null;
  end if;
  return to_jsonb(v_action);
end;
$$;

create or replace function public.record_story_result_owned(
  p_game_id uuid,
  p_action_id uuid,
  p_story_text text,
  p_parsed_blocks jsonb,
  p_owner_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_action public.game_actions%rowtype;
begin
  if p_owner_token is null or p_owner_token not like 'story_in_progress:%' then
    raise exception 'invalid story owner token' using errcode = '22023';
  end if;
  select * into v_action
  from public.game_actions
  where action_id = p_action_id and game_id = p_game_id
  for update;
  if not found then
    raise exception 'action not found' using errcode = 'P0002';
  end if;
  if v_action.processing_status <> 'story_streaming' or v_action.error_code <> p_owner_token then
    return null;
  end if;
  if p_story_text is null or trim(p_story_text) = '' then
    raise exception 'story result is required' using errcode = '22023';
  end if;
  update public.game_actions
  set story_text = p_story_text,
      parsed_blocks = coalesce(p_parsed_blocks, '{}'::jsonb),
      processing_status = 'extracting',
      error_code = null,
      updated_at = now()
  where game_id = p_game_id and action_id = p_action_id;
  return jsonb_build_object('action_id', p_action_id, 'replayed', false, 'processing_status', 'extracting');
end;
$$;

-- record_extract_result owns both the extracting -> committing transition and
-- clearing the exclusive Extract lock in the same transaction.
create or replace function public.record_extract_result(
  p_game_id uuid,
  p_action_id uuid,
  p_extract_delta jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_action public.game_actions%rowtype;
begin
  if p_extract_delta is null or jsonb_typeof(p_extract_delta) <> 'object' then
    raise exception 'extract delta must be an object' using errcode = '22023';
  end if;
  select * into v_action
  from public.game_actions
  where action_id = p_action_id and game_id = p_game_id
  for update;
  if not found then
    raise exception 'action not found' using errcode = 'P0002';
  end if;
  if v_action.story_text is null then
    raise exception 'story result is required before extract' using errcode = '22023';
  end if;
  if v_action.extract_delta is not null then
    if v_action.extract_delta is not distinct from p_extract_delta then
      return jsonb_build_object('action_id', v_action.action_id, 'replayed', true, 'processing_status', v_action.processing_status);
    end if;
    raise exception 'extract result cannot be overwritten' using errcode = '23505';
  end if;
  if v_action.processing_status <> 'extracting' then
    raise exception 'action is not accepting extract output' using errcode = '22023';
  end if;
  update public.game_actions
  set extract_delta = p_extract_delta,
      processing_status = 'committing',
      error_code = null,
      updated_at = now()
  where action_id = p_action_id and game_id = p_game_id;
  return jsonb_build_object('action_id', p_action_id, 'replayed', false, 'processing_status', 'committing');
end;
$$;

revoke all on function public.claim_game_action_stage(uuid, uuid, text, text, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.fail_game_action_stage(uuid, uuid, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.record_extract_result(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.record_story_result_owned(uuid, uuid, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.claim_game_action_stage(uuid, uuid, text, text, text, text, text, boolean) to service_role;
grant execute on function public.fail_game_action_stage(uuid, uuid, text, text, text, text, text) to service_role;
grant execute on function public.record_extract_result(uuid, uuid, jsonb) to service_role;
grant execute on function public.record_story_result_owned(uuid, uuid, text, jsonb, text) to service_role;
