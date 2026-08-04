-- APPLIED to Supabase project fmcrspgxstsmxxsmkeee as migration 20260804102357_company_v1_history_structured_action.
-- Extends the existing action -> active turn/revision pipeline. No parallel history
-- store or replacement feedback model is introduced.

alter table public.game_actions
  add column if not exists structured_action jsonb;

alter table public.game_turns
  add column if not exists structured_action jsonb;

comment on column public.game_actions.structured_action is
  'Canonical structured action captured when an action is reserved. Null for ordinary free-text turns.';
comment on column public.game_turns.structured_action is
  'Canonical structured action copied from game_actions at commit. Preserved by feedback revisions.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.game_actions'::regclass
      and conname = 'game_actions_structured_action_check'
  ) then
    alter table public.game_actions
      add constraint game_actions_structured_action_check
      check (structured_action is null or jsonb_typeof(structured_action) = 'object');
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.game_turns'::regclass
      and conname = 'game_turns_structured_action_check'
  ) then
    alter table public.game_turns
      add constraint game_turns_structured_action_check
      check (structured_action is null or jsonb_typeof(structured_action) = 'object');
  end if;
end
$$;

-- Progression was added after the first Company save and seed were created.
-- Add only missing canonical keys; never overwrite existing progress.
update public.game_save
set data = data
  || case when data ? 'player_progress' then '{}'::jsonb else '{"player_progress":{"level":1,"exp":0}}'::jsonb end
  || case when data ? 'csa_experienced_ids' then '{}'::jsonb else '{"csa_experienced_ids":[]}'::jsonb end
where not (data ? 'player_progress') or not (data ? 'csa_experienced_ids');

update public.game_master
set initial_save = initial_save
  || case when initial_save ? 'player_progress' then '{}'::jsonb else '{"player_progress":{"level":1,"exp":0}}'::jsonb end
  || case when initial_save ? 'csa_experienced_ids' then '{}'::jsonb else '{"csa_experienced_ids":[]}'::jsonb end
where not (initial_save ? 'player_progress') or not (initial_save ? 'csa_experienced_ids');

-- Recreate reserve_turn_action with one additional optional argument. The previous
-- signature is removed to avoid PostgREST overload ambiguity.
drop function if exists public.reserve_turn_action(uuid, uuid, integer, text);

create or replace function public.reserve_turn_action(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_turn integer,
  p_player_action text,
  p_structured_action jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_save public.game_save%rowtype;
  v_action public.game_actions%rowtype;
begin
  if p_structured_action is not null and jsonb_typeof(p_structured_action) <> 'object' then
    raise exception 'structured_action must be an object or null' using errcode = '22023';
  end if;

  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then
    raise exception 'company game save not found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.games where id = p_game_id and edition_id = 'company-v1') then
    raise exception 'company edition required' using errcode = '22023';
  end if;

  select * into v_action from public.game_actions where action_id = p_action_id;
  if found then
    if v_action.game_id <> p_game_id then
      raise exception 'action belongs to a different game' using errcode = '22023';
    end if;
    if v_action.structured_action is distinct from p_structured_action then
      raise exception 'action structured payload mismatch' using errcode = '22023';
    end if;
    return jsonb_build_object(
      'action_id', v_action.action_id,
      'turn_id', v_action.turn_id,
      'expected_turn', v_action.expected_turn,
      'processing_status', v_action.processing_status,
      'structured_action', v_action.structured_action,
      'replayed', true
    );
  end if;

  if p_expected_turn <> v_save.committed_turn + 1 then
    raise exception 'expected turn conflict' using errcode = '40001';
  end if;

  insert into public.game_actions (
    action_id, game_id, expected_turn, player_action, structured_action, processing_status
  ) values (
    p_action_id, p_game_id, p_expected_turn, p_player_action, p_structured_action, 'story_streaming'
  ) returning * into v_action;

  return jsonb_build_object(
    'action_id', v_action.action_id,
    'turn_id', v_action.turn_id,
    'expected_turn', v_action.expected_turn,
    'processing_status', v_action.processing_status,
    'structured_action', v_action.structured_action,
    'replayed', false
  );
end;
$function$;

create or replace function public.reserve_feedback_revision(
  p_game_id uuid,
  p_revision_request_id uuid,
  p_feedback_text text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_save public.game_save%rowtype;
  v_existing public.game_actions%rowtype;
  v_original public.game_turns%rowtype;
  v_action public.game_actions%rowtype;
begin
  if p_revision_request_id is null then
    raise exception 'revision request id is required' using errcode = '22023';
  end if;
  if nullif(btrim(p_feedback_text), '') is null then
    raise exception 'feedback text is required' using errcode = '22023';
  end if;

  select * into v_save from public.game_save where game_id = p_game_id for update;
  if not found then
    raise exception 'company game save not found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.games where id = p_game_id and edition_id = 'company-v1') then
    raise exception 'company edition required' using errcode = '22023';
  end if;

  select * into v_existing from public.game_actions
  where game_id = p_game_id and revision_request_id = p_revision_request_id for update;
  if found then
    select * into v_original from public.game_turns
    where turn_id = v_existing.target_turn_id and game_id = p_game_id;
    if not found then
      raise exception 'feedback replay target integrity error' using errcode = 'XX000';
    end if;
    return jsonb_build_object(
      'revision_request_id', p_revision_request_id,
      'action_id', v_existing.action_id,
      'replacement_turn_id', v_existing.turn_id,
      'target_turn_number', v_original.turn_number,
      'original_turn_id', v_original.turn_id,
      'original_player_action', v_original.player_action,
      'structured_action', v_existing.structured_action,
      'pre_save', v_original.pre_save,
      'processing_status', v_existing.processing_status,
      'replayed', true
    );
  end if;

  select * into v_original from public.game_turns
  where game_id = p_game_id
    and turn_number = v_save.committed_turn
    and record_status = 'active'
  for update;
  if not found then
    raise exception 'latest active turn not found' using errcode = 'P0002';
  end if;

  insert into public.game_actions (
    action_id, game_id, action_kind, expected_turn, target_turn_id, player_action,
    structured_action, feedback_text, revision_request_id, processing_status
  ) values (
    gen_random_uuid(), p_game_id, 'feedback_revision', v_save.committed_turn, v_original.turn_id,
    v_original.player_action, v_original.structured_action, p_feedback_text,
    p_revision_request_id, 'story_streaming'
  ) returning * into v_action;

  return jsonb_build_object(
    'revision_request_id', p_revision_request_id,
    'action_id', v_action.action_id,
    'replacement_turn_id', v_action.turn_id,
    'target_turn_number', v_original.turn_number,
    'original_turn_id', v_original.turn_id,
    'original_player_action', v_original.player_action,
    'structured_action', v_action.structured_action,
    'pre_save', v_original.pre_save,
    'processing_status', v_action.processing_status,
    'replayed', false
  );
end;
$function$;

create or replace function public.commit_company_turn(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_turn integer,
  p_next_save jsonb,
  p_turn_summary text,
  p_mind_monitor jsonb,
  p_choices jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_save public.game_save%rowtype;
  v_action public.game_actions%rowtype;
  v_turn public.game_turns%rowtype;
  v_next_save jsonb;
  v_validation jsonb;
begin
  select * into v_save from public.game_save where game_id = p_game_id for update;
  select * into v_action from public.game_actions where action_id = p_action_id and game_id = p_game_id for update;
  if not found then
    raise exception 'action not found' using errcode = 'P0002';
  end if;
  if v_action.processing_status = 'committed' then
    select * into v_turn from public.game_turns where action_id = p_action_id;
    return jsonb_build_object('success', true, 'replayed', true, 'turn_number', v_turn.turn_number, 'turn_id', v_turn.turn_id, 'save_revision', v_save.save_revision);
  end if;
  if p_expected_turn <> v_save.committed_turn + 1 or p_expected_turn <> v_action.expected_turn then
    raise exception 'expected turn conflict' using errcode = '40001';
  end if;
  if v_action.processing_status <> 'committing' or v_action.story_text is null or v_action.extract_delta is null then
    raise exception 'complete story and extract are required before commit' using errcode = '22023';
  end if;

  v_next_save := jsonb_set(p_next_save, '{turn_state,committed_turn}', to_jsonb(p_expected_turn), true);
  v_validation := public.validate_company_save_v1(v_next_save);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'invalid next save: %', v_validation -> 'errors' using errcode = '22023';
  end if;

  insert into public.game_turns (
    turn_id, game_id, turn_number, action_id, player_action, structured_action,
    story_text, parsed_blocks, extract_delta, pre_save, post_save,
    turn_summary, mind_monitor, choices
  ) values (
    v_action.turn_id, p_game_id, p_expected_turn, p_action_id, v_action.player_action,
    v_action.structured_action, v_action.story_text,
    coalesce(v_action.parsed_blocks, '{}'::jsonb), v_action.extract_delta,
    v_save.data, v_next_save, coalesce(p_turn_summary, ''),
    coalesce(p_mind_monitor, '{}'::jsonb), coalesce(p_choices, '[]'::jsonb)
  );

  update public.game_save
  set committed_turn = p_expected_turn, save_revision = save_revision + 1, data = v_next_save
  where game_id = p_game_id;
  update public.game_actions set processing_status = 'committed' where action_id = p_action_id;

  return jsonb_build_object('success', true, 'replayed', false, 'turn_number', p_expected_turn, 'turn_id', v_action.turn_id, 'save_revision', v_save.save_revision + 1);
end;
$function$;

create or replace function public.commit_feedback_revision(
  p_game_id uuid,
  p_action_id uuid,
  p_revision_request_id uuid,
  p_next_save jsonb,
  p_turn_summary text,
  p_mind_monitor jsonb,
  p_choices jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_save public.game_save%rowtype;
  v_action public.game_actions%rowtype;
  v_original public.game_turns%rowtype;
  v_replacement public.game_turns%rowtype;
  v_next_save jsonb;
  v_validation jsonb;
begin
  select * into v_save from public.game_save where game_id = p_game_id for update;
  select * into v_action from public.game_actions
    where action_id = p_action_id and game_id = p_game_id for update;
  if not found then
    raise exception 'feedback action not found' using errcode = 'P0002';
  end if;
  if v_action.action_kind <> 'feedback_revision'
     or v_action.revision_request_id <> p_revision_request_id then
    raise exception 'feedback revision identity mismatch' using errcode = '22023';
  end if;
  if v_action.processing_status = 'committed' then
    select * into v_replacement from public.game_turns where action_id = p_action_id;
    return jsonb_build_object('success', true, 'replayed', true, 'turn_number', v_replacement.turn_number, 'turn_id', v_replacement.turn_id, 'save_revision', v_save.save_revision);
  end if;
  if v_action.processing_status <> 'committing' or v_action.story_text is null or v_action.extract_delta is null then
    raise exception 'complete feedback story and extract are required before commit' using errcode = '22023';
  end if;

  select * into v_original from public.game_turns
  where turn_id = v_action.target_turn_id and game_id = p_game_id
  for update;
  if not found
     or v_original.record_status <> 'active'
     or v_original.turn_number <> v_save.committed_turn
     or v_original.turn_number <> v_action.expected_turn then
    raise exception 'feedback target is no longer the latest active turn' using errcode = '40001';
  end if;

  v_next_save := jsonb_set(p_next_save, '{turn_state,committed_turn}', to_jsonb(v_save.committed_turn), true);
  v_validation := public.validate_company_save_v1(v_next_save);
  if not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'invalid revision save: %', v_validation -> 'errors' using errcode = '22023';
  end if;

  update public.game_turns set record_status = 'superseded' where turn_id = v_original.turn_id;
  insert into public.game_turns (
    turn_id, game_id, turn_number, revision_number, record_status, action_id,
    supersedes_turn_id, revision_request_id, player_action, structured_action,
    feedback_text, story_text, parsed_blocks, extract_delta, pre_save, post_save,
    turn_summary, mind_monitor, choices
  ) values (
    v_action.turn_id, p_game_id, v_original.turn_number, v_original.revision_number + 1,
    'active', p_action_id, v_original.turn_id, p_revision_request_id,
    v_original.player_action, v_action.structured_action, v_action.feedback_text,
    v_action.story_text, coalesce(v_action.parsed_blocks, '{}'::jsonb),
    v_action.extract_delta, v_original.pre_save, v_next_save,
    coalesce(p_turn_summary, ''), coalesce(p_mind_monitor, '{}'::jsonb),
    coalesce(p_choices, '[]'::jsonb)
  );

  update public.game_save
  set save_revision = save_revision + 1, data = v_next_save
  where game_id = p_game_id;
  update public.game_actions set processing_status = 'committed' where action_id = p_action_id;

  return jsonb_build_object(
    'success', true, 'replayed', false, 'turn_number', v_original.turn_number,
    'turn_id', v_action.turn_id, 'save_revision', v_save.save_revision + 1
  );
end;
$function$;

-- Align the database validator with the existing level-10 application contract:
-- levels 1/3/5/10 allow 2/3/4/5 active CSA slots.
create or replace function public.validate_company_save_v1(p_save jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_errors text[] := '{}';
  v_key text;
  v_required_keys text[] := array[
    'save_schema_version', 'edition', 'turn_state', 'player',
    'player_scene_state', 'player_sexual_state', 'world_state', 'scene_state',
    'npc_stats', 'npc_emotion', 'npc_relationship_state', 'npc_scene_state',
    'npc_work_state', 'csa_active', 'csa_rules', 'csa_attitudes',
    'csa_runtime_state', 'csa_aftereffect_state', 'event_ledger',
    'story_summary_overall', 'story_summary_recent', 'focal_character_id',
    'last_speaker_id', 'last_npcs_present', 'last_image_id', 'last_choices',
    'last_choice_meta'
  ];
begin
  if p_save is null or jsonb_typeof(p_save) <> 'object' then
    return jsonb_build_object('valid', false, 'errors', jsonb_build_array('save must be an object'));
  end if;

  foreach v_key in array v_required_keys loop
    if not (p_save ? v_key) then
      v_errors := array_append(v_errors, format('missing required key: %s', v_key));
    end if;
  end loop;

  if p_save ->> 'save_schema_version' <> '1' then
    v_errors := array_append(v_errors, 'save_schema_version must be 1');
  end if;
  if p_save ->> 'edition' <> 'company-v1' then
    v_errors := array_append(v_errors, 'edition must be company-v1');
  end if;
  if jsonb_typeof(p_save -> 'csa_active') <> 'array'
     or jsonb_array_length(p_save -> 'csa_active') > 5 then
    v_errors := array_append(v_errors, 'csa_active must be an array with at most five items');
  end if;
  if jsonb_typeof(p_save -> 'event_ledger') <> 'array' then
    v_errors := array_append(v_errors, 'event_ledger must be an array');
  end if;
  if jsonb_typeof(p_save -> 'last_choices') <> 'array' then
    v_errors := array_append(v_errors, 'last_choices must be an array');
  end if;
  if jsonb_typeof(p_save -> 'last_npcs_present') <> 'array' then
    v_errors := array_append(v_errors, 'last_npcs_present must be an array');
  end if;
  if jsonb_typeof(p_save -> 'turn_state') <> 'object' then
    v_errors := array_append(v_errors, 'turn_state must be an object');
  end if;
  if jsonb_typeof(p_save -> 'scene_state') <> 'object' then
    v_errors := array_append(v_errors, 'scene_state must be an object');
  end if;
  if p_save ? 'player_progress' and jsonb_typeof(p_save -> 'player_progress') <> 'object' then
    v_errors := array_append(v_errors, 'player_progress must be an object');
  end if;
  if p_save ? 'csa_experienced_ids' and jsonb_typeof(p_save -> 'csa_experienced_ids') <> 'array' then
    v_errors := array_append(v_errors, 'csa_experienced_ids must be an array');
  end if;
  if p_save ? 'player_setup' then
    if jsonb_typeof(p_save -> 'player_setup') <> 'object' then
      v_errors := array_append(v_errors, 'player_setup must be an object');
    elsif not ((p_save -> 'player_setup') ? 'completed') then
      v_errors := array_append(v_errors, 'player_setup.completed is required');
    end if;
  end if;
  if p_save ? 'opening_state' and jsonb_typeof(p_save -> 'opening_state') <> 'object' then
    v_errors := array_append(v_errors, 'opening_state must be an object');
  end if;

  return jsonb_build_object(
    'valid', coalesce(array_length(v_errors, 1), 0) = 0,
    'errors', to_jsonb(v_errors)
  );
end;
$function$;

revoke all on function public.reserve_turn_action(uuid, uuid, integer, text, jsonb) from public, anon, authenticated;
revoke all on function public.reserve_feedback_revision(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.commit_company_turn(uuid, uuid, integer, jsonb, text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.commit_feedback_revision(uuid, uuid, uuid, jsonb, text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.validate_company_save_v1(jsonb) from public, anon, authenticated;

grant execute on function public.reserve_turn_action(uuid, uuid, integer, text, jsonb) to service_role;
grant execute on function public.reserve_feedback_revision(uuid, uuid, text) to service_role;
grant execute on function public.commit_company_turn(uuid, uuid, integer, jsonb, text, jsonb, jsonb) to service_role;
grant execute on function public.commit_feedback_revision(uuid, uuid, uuid, jsonb, text, jsonb, jsonb) to service_role;
grant execute on function public.validate_company_save_v1(jsonb) to service_role;