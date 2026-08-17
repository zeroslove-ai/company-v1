-- Company v1 Authority Consolidation Cut 1 closure, Stage A.
-- This migration is additive and pre-deploy safe. It introduces provider-stage
-- ownership without removing legacy RPCs or direct service_role DML.

alter table public.game_actions
  add column if not exists stage_owner_token text null,
  add column if not exists stage_claimed_at timestamptz null;

create index if not exists game_actions_stage_ownership_idx
  on public.game_actions (game_id, processing_status, stage_claimed_at)
  where stage_owner_token is not null;

-- Owner-based claim. The legacy 8-argument overload remains below for old
-- Workers. New Workers must call this 9-argument overload.
create or replace function public.claim_game_action_stage(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_status text,
  p_expected_owner_mode text,
  p_expected_owner_token text,
  p_next_status text,
  p_next_owner_token text,
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
  v_mode text := upper(trim(coalesce(p_expected_owner_mode, '')));
begin
  if v_mode not in ('ANY', 'NULL', 'EXACT') then
    raise exception 'invalid expected owner mode' using errcode = '22023';
  end if;
  if v_mode = 'EXACT' and p_expected_owner_token is null then
    raise exception 'exact expected owner token is required' using errcode = '22023';
  end if;
  if p_next_error_code is not null then
    raise exception 'owner claim cannot write error_code' using errcode = '22023';
  end if;
  if p_expected_status = 'story_failed' and p_next_status = 'story_streaming' then
    if v_mode <> 'NULL' or p_require_stale then
      raise exception 'story retry requires an unowned action' using errcode = '22023';
    end if;
    if p_next_owner_token is null or p_next_owner_token not like 'story:%' then
      raise exception 'story claim requires owner token' using errcode = '22023';
    end if;
  elsif p_expected_status = 'story_streaming' and p_next_status = 'story_streaming' then
    if not p_require_stale and v_mode <> 'NULL' then
      raise exception 'fresh story claim requires NULL owner condition' using errcode = '22023';
    end if;
    if p_next_owner_token is null or p_next_owner_token not like 'story:%' then
      raise exception 'story claim requires owner token' using errcode = '22023';
    end if;
  elsif p_expected_status = 'extract_failed' and p_next_status = 'extracting' then
    if v_mode <> 'NULL' or p_require_stale then
      raise exception 'extract retry requires an unowned action' using errcode = '22023';
    end if;
    if p_next_owner_token is null or p_next_owner_token not like 'extract:%' then
      raise exception 'extract claim requires owner token' using errcode = '22023';
    end if;
  elsif p_expected_status = 'extracting' and p_next_status = 'extracting' then
    if not p_require_stale and v_mode <> 'NULL' then
      raise exception 'fresh extract claim requires NULL owner condition' using errcode = '22023';
    end if;
    if p_next_owner_token is null or p_next_owner_token not like 'extract:%' then
      raise exception 'extract claim requires owner token' using errcode = '22023';
    end if;
  else
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
      stage_owner_token = p_next_owner_token,
      stage_claimed_at = now(),
      error_code = p_next_error_code,
      updated_at = now()
  where game_id = p_game_id
    and action_id = p_action_id
    and processing_status = p_expected_status
    and (
      v_mode = 'ANY'
      or (v_mode = 'NULL' and stage_owner_token is null)
      or (v_mode = 'EXACT' and stage_owner_token = p_expected_owner_token)
    )
    and (
      not coalesce(p_require_stale, false)
      or stage_owner_token is null
      or stage_claimed_at <= now() - interval '3 minutes'
    )
  returning * into v_action;

  if not found then return null; end if;
  return to_jsonb(v_action);
end;
$$;

-- Owner-fenced failure. The extra boolean distinguishes this contract from
-- the legacy 7-argument error_code-based overload.
create or replace function public.fail_game_action_stage(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_status text,
  p_expected_owner_mode text,
  p_expected_owner_token text,
  p_next_status text,
  p_next_error_code text,
  p_require_owner_fence boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_action public.game_actions%rowtype;
begin
  if p_require_owner_fence is not true or upper(trim(coalesce(p_expected_owner_mode, ''))) <> 'EXACT' then
    raise exception 'owner-fenced failure requires EXACT owner mode' using errcode = '22023';
  end if;
  if p_expected_owner_token is null or p_next_error_code is null or trim(p_next_error_code) = '' then
    raise exception 'owner and failure code are required' using errcode = '22023';
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
  if not found then raise exception 'action not found' using errcode = 'P0002'; end if;

  update public.game_actions
  set processing_status = p_next_status,
      stage_owner_token = null,
      stage_claimed_at = null,
      error_code = p_next_error_code,
      updated_at = now()
  where game_id = p_game_id
    and action_id = p_action_id
    and processing_status = p_expected_status
    and stage_owner_token = p_expected_owner_token
  returning * into v_action;

  if not found then return null; end if;
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
  if p_owner_token is null or p_owner_token not like 'story:%' then
    raise exception 'invalid story owner token' using errcode = '22023';
  end if;
  if p_story_text is null or trim(p_story_text) = '' then
    raise exception 'story result is required' using errcode = '22023';
  end if;
  select * into v_action from public.game_actions
  where action_id = p_action_id and game_id = p_game_id for update;
  if not found then raise exception 'action not found' using errcode = 'P0002'; end if;
  if v_action.processing_status <> 'story_streaming' or v_action.stage_owner_token <> p_owner_token then
    return null;
  end if;
  update public.game_actions
  set story_text = p_story_text,
      parsed_blocks = coalesce(p_parsed_blocks, '{}'::jsonb),
      processing_status = 'extracting',
      stage_owner_token = null,
      stage_claimed_at = null,
      error_code = null,
      updated_at = now()
  where game_id = p_game_id and action_id = p_action_id;
  return jsonb_build_object('action_id', p_action_id, 'replayed', false, 'processing_status', 'extracting');
end;
$$;

create or replace function public.record_extract_result_owned(
  p_game_id uuid,
  p_action_id uuid,
  p_extract_delta jsonb,
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
  if p_owner_token is null or p_owner_token not like 'extract:%' then
    raise exception 'invalid extract owner token' using errcode = '22023';
  end if;
  if p_extract_delta is null or jsonb_typeof(p_extract_delta) <> 'object' then
    raise exception 'extract delta must be an object' using errcode = '22023';
  end if;
  select * into v_action from public.game_actions
  where action_id = p_action_id and game_id = p_game_id for update;
  if not found then raise exception 'action not found' using errcode = 'P0002'; end if;
  if v_action.processing_status <> 'extracting' or v_action.stage_owner_token <> p_owner_token then
    return null;
  end if;
  if v_action.extract_delta is not null then
    if v_action.extract_delta is not distinct from p_extract_delta then
      return jsonb_build_object('action_id', p_action_id, 'replayed', true, 'processing_status', v_action.processing_status);
    end if;
    raise exception 'extract result cannot be overwritten' using errcode = '23505';
  end if;
  update public.game_actions
  set extract_delta = p_extract_delta,
      processing_status = 'committing',
      stage_owner_token = null,
      stage_claimed_at = null,
      error_code = null,
      updated_at = now()
  where game_id = p_game_id and action_id = p_action_id;
  return jsonb_build_object('action_id', p_action_id, 'replayed', false, 'processing_status', 'committing');
end;
$$;

-- Legacy writers remain callable during Stage A, but cannot bypass a new
-- Worker owner. They only operate on unowned legacy actions.
create or replace function public.record_story_result(
  p_game_id uuid, p_action_id uuid, p_story_text text, p_parsed_blocks jsonb
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_action public.game_actions%rowtype;
begin
  if p_story_text is null or trim(p_story_text) = '' then raise exception 'story result is required' using errcode = '22023'; end if;
  select * into v_action from public.game_actions where game_id = p_game_id and action_id = p_action_id for update;
  if not found then raise exception 'action not found' using errcode = 'P0002'; end if;
  if v_action.stage_owner_token is not null then return null; end if;
  if v_action.story_text is not null then
    if v_action.story_text = p_story_text then return jsonb_build_object('action_id', p_action_id, 'replayed', true, 'processing_status', v_action.processing_status); end if;
    raise exception 'story result cannot be overwritten' using errcode = '23505';
  end if;
  if v_action.processing_status <> 'story_streaming' then raise exception 'action is not accepting story output' using errcode = '22023'; end if;
  update public.game_actions set story_text = p_story_text, parsed_blocks = coalesce(p_parsed_blocks, '{}'::jsonb), processing_status = 'extracting', error_code = null, updated_at = now() where game_id = p_game_id and action_id = p_action_id;
  return jsonb_build_object('action_id', p_action_id, 'replayed', false, 'processing_status', 'extracting');
end; $$;

create or replace function public.record_extract_result(
  p_game_id uuid, p_action_id uuid, p_extract_delta jsonb
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_action public.game_actions%rowtype;
begin
  if p_extract_delta is null or jsonb_typeof(p_extract_delta) <> 'object' then raise exception 'extract delta must be an object' using errcode = '22023'; end if;
  select * into v_action from public.game_actions where game_id = p_game_id and action_id = p_action_id for update;
  if not found then raise exception 'action not found' using errcode = 'P0002'; end if;
  if v_action.stage_owner_token is not null then return null; end if;
  if v_action.extract_delta is not null then
    if v_action.extract_delta is not distinct from p_extract_delta then return jsonb_build_object('action_id', p_action_id, 'replayed', true, 'processing_status', v_action.processing_status); end if;
    raise exception 'extract result cannot be overwritten' using errcode = '23505';
  end if;
  if v_action.processing_status <> 'extracting' then raise exception 'action is not accepting extract output' using errcode = '22023'; end if;
  update public.game_actions set extract_delta = p_extract_delta, processing_status = 'committing', error_code = null, updated_at = now() where game_id = p_game_id and action_id = p_action_id;
  return jsonb_build_object('action_id', p_action_id, 'replayed', false, 'processing_status', 'committing');
end; $$;

-- Keep the old 8-argument claim contract callable for the deployed Worker,
-- while refusing to touch rows owned by the new Worker.
create or replace function public.claim_game_action_stage(
  p_game_id uuid, p_action_id uuid, p_expected_status text,
  p_expected_error_mode text, p_expected_error_code text,
  p_next_status text, p_next_error_code text, p_require_stale boolean
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_action public.game_actions%rowtype; v_mode text := upper(trim(coalesce(p_expected_error_mode, '')));
begin
  if v_mode not in ('ANY', 'NULL', 'EXACT') then raise exception 'invalid expected error mode' using errcode = '22023'; end if;
  if v_mode = 'EXACT' and p_expected_error_code is null then raise exception 'exact expected error code is required' using errcode = '22023'; end if;
  if not ((p_expected_status = 'story_failed' and p_next_status = 'story_streaming') or (p_expected_status = 'story_streaming' and p_next_status = 'story_streaming') or (p_expected_status = 'extract_failed' and p_next_status = 'extracting') or (p_expected_status = 'extracting' and p_next_status = 'extracting')) then raise exception 'invalid action claim transition' using errcode = '22023'; end if;
  select * into v_action from public.game_actions where game_id = p_game_id and action_id = p_action_id for update;
  if not found then raise exception 'action not found' using errcode = 'P0002'; end if;
  if v_action.stage_owner_token is not null then return null; end if;
  update public.game_actions set processing_status = p_next_status, error_code = p_next_error_code, updated_at = now() where game_id = p_game_id and action_id = p_action_id and processing_status = p_expected_status and ((v_mode = 'ANY') or (v_mode = 'NULL' and error_code is null) or (v_mode = 'EXACT' and error_code = p_expected_error_code)) and (not coalesce(p_require_stale, false) or v_action.updated_at <= now() - interval '3 minutes') returning * into v_action;
  if not found then return null; end if;
  return to_jsonb(v_action);
end; $$;

-- Legacy error_code-based failure overload. New Worker uses the 8-argument
-- owner-fenced overload above and cannot be reached through this path.
create or replace function public.fail_game_action_stage(
  p_game_id uuid, p_action_id uuid, p_expected_status text,
  p_expected_error_mode text, p_expected_error_code text,
  p_next_status text, p_next_error_code text
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_action public.game_actions%rowtype; v_mode text := upper(trim(coalesce(p_expected_error_mode, '')));
begin
  if v_mode not in ('ANY', 'NULL', 'EXACT') then raise exception 'invalid expected error mode' using errcode = '22023'; end if;
  if p_next_error_code is null or trim(p_next_error_code) = '' then raise exception 'next error code is required for failure' using errcode = '22023'; end if;
  select * into v_action from public.game_actions where game_id = p_game_id and action_id = p_action_id for update;
  if not found then raise exception 'action not found' using errcode = 'P0002'; end if;
  if v_action.stage_owner_token is not null then return null; end if;
  update public.game_actions set processing_status = p_next_status, error_code = p_next_error_code, updated_at = now() where game_id = p_game_id and action_id = p_action_id and processing_status = p_expected_status and ((v_mode = 'ANY') or (v_mode = 'NULL' and error_code is null) or (v_mode = 'EXACT' and error_code = p_expected_error_code)) returning * into v_action;
  if not found then return null; end if;
  return to_jsonb(v_action);
end; $$;

-- Preserve reserve identity/replay semantics, but stage-owned stale rows use
-- stage_claimed_at and all terminated ownership is cleared atomically.
create or replace function public.reserve_turn_action(
  p_game_id uuid, p_action_id uuid, p_expected_turn integer,
  p_player_action text, p_structured_action jsonb default null
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_save public.game_save%rowtype; v_action public.game_actions%rowtype; v_inflight public.game_actions%rowtype;
begin
  if p_structured_action is not null and jsonb_typeof(p_structured_action) <> 'object' then raise exception 'structured_action must be an object or null' using errcode = '22023'; end if;
  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then raise exception 'company game save not found' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.games where id = p_game_id and edition_id = 'company-v1') then raise exception 'company edition required' using errcode = '22023'; end if;
  select * into v_action from public.game_actions where action_id = p_action_id;
  if found then
    if v_action.game_id <> p_game_id then raise exception 'action belongs to a different game' using errcode = '22023'; end if;
    if v_action.structured_action is distinct from p_structured_action then raise exception 'action structured payload mismatch' using errcode = '22023'; end if;
    return jsonb_build_object('action_id', v_action.action_id, 'turn_id', v_action.turn_id, 'expected_turn', v_action.expected_turn, 'processing_status', v_action.processing_status, 'structured_action', v_action.structured_action, 'replayed', true);
  end if;
  update public.game_actions
  set processing_status = 'commit_failed', error_code = 'stale_action_timeout', stage_owner_token = null, stage_claimed_at = null, updated_at = now()
  where game_id = p_game_id and expected_turn = p_expected_turn and action_id <> p_action_id
    and processing_status in ('story_streaming', 'extracting', 'committing')
    and ((stage_owner_token is not null and stage_claimed_at <= now() - interval '3 minutes') or (stage_owner_token is null and updated_at <= now() - interval '3 minutes'));
  select * into v_inflight from public.game_actions where game_id = p_game_id and expected_turn = p_expected_turn and action_id <> p_action_id and processing_status in ('story_streaming', 'extracting', 'committing') for update;
  if found then
    if v_inflight.player_action is not distinct from p_player_action and v_inflight.structured_action is not distinct from p_structured_action then
      return jsonb_build_object('action_id', v_inflight.action_id, 'turn_id', v_inflight.turn_id, 'expected_turn', v_inflight.expected_turn, 'processing_status', v_inflight.processing_status, 'structured_action', v_inflight.structured_action, 'replayed', true);
    end if;
    raise exception 'turn already in progress' using errcode = '40001';
  end if;
  if p_expected_turn <> v_save.committed_turn + 1 then raise exception 'expected turn conflict' using errcode = '40001'; end if;
  insert into public.game_actions (action_id, game_id, expected_turn, player_action, structured_action, processing_status) values (p_action_id, p_game_id, p_expected_turn, p_player_action, p_structured_action, 'story_streaming') returning * into v_action;
  return jsonb_build_object('action_id', v_action.action_id, 'turn_id', v_action.turn_id, 'expected_turn', v_action.expected_turn, 'processing_status', v_action.processing_status, 'structured_action', v_action.structured_action, 'replayed', false);
end; $$;

revoke all on function public.claim_game_action_stage(uuid, uuid, text, text, text, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.fail_game_action_stage(uuid, uuid, text, text, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.record_story_result_owned(uuid, uuid, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.record_extract_result_owned(uuid, uuid, jsonb, text) from public, anon, authenticated;
revoke all on function public.claim_game_action_stage(uuid, uuid, text, text, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.fail_game_action_stage(uuid, uuid, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.record_story_result(uuid, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.record_extract_result(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.reserve_turn_action(uuid, uuid, integer, text, jsonb) from public, anon, authenticated;

grant execute on function public.claim_game_action_stage(uuid, uuid, text, text, text, text, text, text, boolean) to service_role;
grant execute on function public.fail_game_action_stage(uuid, uuid, text, text, text, text, text, boolean) to service_role;
grant execute on function public.record_story_result_owned(uuid, uuid, text, jsonb, text) to service_role;
grant execute on function public.record_extract_result_owned(uuid, uuid, jsonb, text) to service_role;
grant execute on function public.claim_game_action_stage(uuid, uuid, text, text, text, text, text, boolean) to service_role;
grant execute on function public.fail_game_action_stage(uuid, uuid, text, text, text, text, text) to service_role;
grant execute on function public.record_story_result(uuid, uuid, text, jsonb) to service_role;
grant execute on function public.record_extract_result(uuid, uuid, jsonb) to service_role;
grant execute on function public.reserve_turn_action(uuid, uuid, integer, text, jsonb) to service_role;
