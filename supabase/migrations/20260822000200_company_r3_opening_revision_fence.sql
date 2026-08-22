-- Company R3 opening/CSA stale-snapshot closure.
-- Apply only through the separately authorized TEST rollout task.

begin;

drop function if exists public.company_r3_create_opening(uuid, text, jsonb, text, jsonb, jsonb, jsonb, jsonb, jsonb);

create or replace function public.company_r3_create_opening(
  p_game_id uuid,
  p_expected_revision integer,
  p_story_text text,
  p_choices jsonb,
  p_turn_summary text,
  p_mind_monitor jsonb,
  p_observer_raw jsonb,
  p_observer_applied jsonb,
  p_warnings jsonb,
  p_state_after jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_state public.company_r3_state%rowtype; v_existing public.company_r3_turns%rowtype;
begin
  if nullif(trim(p_story_text), '') is null or jsonb_typeof(p_choices) <> 'array' or nullif(trim(p_turn_summary), '') is null then raise exception 'company_r3_opening_invalid'; end if;
  if p_state_after is null then raise exception 'company_r3_opening_invalid'; end if;
  select * into v_state from public.company_r3_state where game_id = p_game_id for update;
  if not found or v_state.revision <> p_expected_revision then raise exception 'company_r3_opening_conflict'; end if;
  select * into v_existing from public.company_r3_turns where game_id = p_game_id and turn_number = 0 for update;
  if found then
    return jsonb_build_object('game_id', p_game_id, 'turn_number', 0, 'created', false, 'state_after', v_existing.state_after);
  end if;
  if v_state.committed_turn <> 0 then raise exception 'company_r3_opening_conflict'; end if;
  insert into public.company_r3_turns(game_id, turn_number, literal_action, story_text, choices, turn_summary, mind_monitor, observer_raw, observer_applied, warnings, state_after)
    values (p_game_id, 0, '', p_story_text, p_choices, trim(p_turn_summary), coalesce(p_mind_monitor, '{}'::jsonb), coalesce(p_observer_raw, '{}'::jsonb), coalesce(p_observer_applied, '{}'::jsonb), coalesce(p_warnings, '[]'::jsonb), p_state_after)
    on conflict (game_id, turn_number) do nothing;
  update public.company_r3_state set state = p_state_after, updated_at = now() where game_id = p_game_id;
  return jsonb_build_object('game_id', p_game_id, 'turn_number', 0, 'created', true, 'state_after', p_state_after);
end;
$$;

revoke all on function public.company_r3_create_opening(uuid, integer, text, jsonb, text, jsonb, jsonb, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.company_r3_create_opening(uuid, integer, text, jsonb, text, jsonb, jsonb, jsonb, jsonb, jsonb) to service_role;

commit;
