-- Additive Company v1 initial-clothing repair.
-- This migration is intentionally not applied by the Phase 45 worktree.

create or replace function public.company_initial_clothing_v2()
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'uniform_top', 'worn',
    'uniform_bottom', 'worn',
    'underwear_top', 'worn',
    'underwear_bottom', 'worn'
  );
$$;

create or replace function public.company_apply_initial_clothing_v2(p_data jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_data jsonb := coalesce(p_data, '{}'::jsonb);
  v_npc_scene jsonb := coalesce(v_data -> 'npc_scene_state', '{}'::jsonb);
  v_player_scene jsonb := coalesce(v_data -> 'player_scene_state', '{}'::jsonb);
  v_existing_clothing jsonb;
  v_id text;
  v_state jsonb;
begin
  if jsonb_typeof(v_player_scene) <> 'object' then v_player_scene := '{}'::jsonb; end if;
  v_existing_clothing := v_player_scene -> 'clothing';
  if jsonb_typeof(v_existing_clothing) <> 'object' then v_existing_clothing := '{}'::jsonb; end if;
  v_player_scene := jsonb_set(
    v_player_scene,
    '{clothing}',
    public.company_initial_clothing_v2() || v_existing_clothing,
    true
  );
  v_data := jsonb_set(v_data, '{player_scene_state}', v_player_scene, true);
  if jsonb_typeof(v_npc_scene) <> 'object' then v_npc_scene := '{}'::jsonb; end if;
  for v_id, v_state in select key, value from jsonb_each(v_npc_scene)
  loop
    if jsonb_typeof(v_state) <> 'object' then v_state := '{}'::jsonb; end if;
    v_existing_clothing := v_state -> 'clothing';
    if jsonb_typeof(v_existing_clothing) <> 'object' then v_existing_clothing := '{}'::jsonb; end if;
    v_npc_scene := jsonb_set(
      v_npc_scene,
      array[v_id, 'clothing'],
      public.company_initial_clothing_v2() || v_existing_clothing,
      true
    );
  end loop;
  return jsonb_set(v_data, '{npc_scene_state}', v_npc_scene, true);
end;
$$;

-- Backfill stored initial/current JSON shapes when this additive migration is applied.
update public.game_master
set initial_save = public.company_apply_initial_clothing_v2(initial_save)
where initial_save ->> 'edition' = 'company-v1';

update public.game_save s
set data = public.company_apply_initial_clothing_v2(s.data), updated_at = now()
from public.games g
where g.id = s.game_id and g.edition_id = 'company-v1' and coalesce(s.committed_turn, 0) = 0;

-- Keep the already-validated RPC implementations intact behind private aliases,
-- then expose same-signature wrappers that enforce the canonical four-slot shape.
alter function public.reserve_company_player_setup(uuid, uuid, jsonb, jsonb)
  rename to reserve_company_player_setup_legacy_v2;
alter function public.commit_company_opening(uuid, uuid, text, text, jsonb)
  rename to commit_company_opening_legacy_v2;
alter function public.reset_company_game(uuid, text)
  rename to reset_company_game_legacy_v2;

create or replace function public.reserve_company_player_setup(
  p_game_id uuid,
  p_setup_id uuid,
  p_player jsonb,
  p_opening_plan jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_result jsonb;
begin
  v_result := public.reserve_company_player_setup_legacy_v2(
    p_game_id, p_setup_id, p_player, p_opening_plan
  );
  update public.game_save
  set data = public.company_apply_initial_clothing_v2(data), updated_at = now()
  where game_id = p_game_id;
  return v_result;
end;
$$;

create or replace function public.commit_company_opening(
  p_game_id uuid,
  p_setup_id uuid,
  p_background text,
  p_story_text text,
  p_choices jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  return public.commit_company_opening_legacy_v2(
    p_game_id, p_setup_id, p_background, p_story_text, p_choices
  );
end;
$$;

create or replace function public.reset_company_game(
  p_game_id uuid,
  p_expected_title text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_result jsonb;
begin
  v_result := public.reset_company_game_legacy_v2(p_game_id, p_expected_title);
  update public.game_save
  set data = public.company_apply_initial_clothing_v2(data), updated_at = now()
  where game_id = p_game_id;
  return v_result;
end;
$$;

revoke all on function public.company_initial_clothing_v2() from public;
revoke all on function public.company_apply_initial_clothing_v2(jsonb) from public;
revoke all on function public.reserve_company_player_setup_legacy_v2(uuid, uuid, jsonb, jsonb) from public;
revoke all on function public.commit_company_opening_legacy_v2(uuid, uuid, text, text, jsonb) from public;
revoke all on function public.reset_company_game_legacy_v2(uuid, text) from public;
revoke all on function public.reserve_company_player_setup(uuid, uuid, jsonb, jsonb) from public;
revoke all on function public.commit_company_opening(uuid, uuid, text, text, jsonb) from public;
revoke all on function public.reset_company_game(uuid, text) from public;
grant execute on function public.company_initial_clothing_v2() to service_role;
grant execute on function public.company_apply_initial_clothing_v2(jsonb) to service_role;
grant execute on function public.reserve_company_player_setup(uuid, uuid, jsonb, jsonb) to service_role;
grant execute on function public.commit_company_opening(uuid, uuid, text, text, jsonb) to service_role;
grant execute on function public.reset_company_game(uuid, text) to service_role;
