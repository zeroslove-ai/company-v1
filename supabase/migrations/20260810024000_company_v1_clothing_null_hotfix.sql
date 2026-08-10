-- Company v1 hotfix: preserve fresh turn-0 saves when clothing keys are absent.
-- The Phase 6 helper previously used `jsonb_typeof(value) <> 'object'`; when
-- `value` was SQL NULL (missing key), the condition evaluated to NULL/false,
-- allowing NULL to flow through `defaults || NULL` and `jsonb_set(..., NULL)`.
-- Use IS DISTINCT FROM so missing/non-object clothing normalizes to {}.

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
  if jsonb_typeof(v_player_scene) <> 'object' then
    v_player_scene := '{}'::jsonb;
  end if;
  v_existing_clothing := v_player_scene -> 'clothing';
  if jsonb_typeof(v_existing_clothing) is distinct from 'object' then
    v_existing_clothing := '{}'::jsonb;
  end if;
  v_player_scene := jsonb_set(
    v_player_scene,
    '{clothing}',
    public.company_initial_clothing_v2() || v_existing_clothing,
    true
  );
  v_data := jsonb_set(v_data, '{player_scene_state}', v_player_scene, true);

  if jsonb_typeof(v_npc_scene) <> 'object' then
    v_npc_scene := '{}'::jsonb;
  end if;
  for v_id, v_state in select key, value from jsonb_each(v_npc_scene)
  loop
    if jsonb_typeof(v_state) <> 'object' then
      v_state := '{}'::jsonb;
    end if;
    v_existing_clothing := v_state -> 'clothing';
    if jsonb_typeof(v_existing_clothing) is distinct from 'object' then
      v_existing_clothing := '{}'::jsonb;
    end if;
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

revoke all on function public.company_apply_initial_clothing_v2(jsonb)
  from public, anon, authenticated, service_role;
