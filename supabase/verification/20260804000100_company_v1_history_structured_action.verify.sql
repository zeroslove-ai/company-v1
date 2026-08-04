-- Read-only verification for 20260804000100_company_v1_history_structured_action.sql
-- Applied migration: 20260804102357_company_v1_history_structured_action

-- 1. Both lifecycle tables expose the canonical structured action column.
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('game_actions', 'game_turns')
  and column_name = 'structured_action'
order by table_name;

-- Expected: exactly 2 rows, both jsonb.

-- 2. The old four-argument reservation signature is gone and the five-argument
-- signature is the only callable reserve_turn_action contract.
select p.proname, pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'reserve_turn_action',
    'reserve_feedback_revision',
    'commit_company_turn',
    'commit_feedback_revision',
    'validate_company_save_v1'
  )
order by p.proname, arguments;

-- 3. Service-role-only execution remains intact.
select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where specific_schema = 'public'
  and routine_name in (
    'reserve_turn_action',
    'reserve_feedback_revision',
    'commit_company_turn',
    'commit_feedback_revision',
    'validate_company_save_v1'
  )
order by routine_name, grantee;

-- Expected grantees: postgres and service_role only.

-- 4. Existing save and reset seed have progression keys without overwriting any
-- already-existing value.
select
  gs.game_id,
  gs.data -> 'player_progress' as live_player_progress,
  gs.data -> 'csa_experienced_ids' as live_csa_experienced_ids,
  gm.initial_save -> 'player_progress' as seed_player_progress,
  gm.initial_save -> 'csa_experienced_ids' as seed_csa_experienced_ids
from public.game_save gs
join public.game_master gm using (game_id)
where gs.game_id = '11111111-1111-4111-8111-111111111111'::uuid;

-- 5. Current save remains valid after the validator cap changes to five.
select public.validate_company_save_v1(data)
from public.game_save
where game_id = '11111111-1111-4111-8111-111111111111'::uuid;

-- 6. No active history row has a different structured action than its source
-- action. Ordinary turns are null on both sides and count as equal.
select count(*) as structured_action_mismatch_count
from public.game_turns t
join public.game_actions a on a.action_id = t.action_id
where t.structured_action is distinct from a.structured_action;

-- Expected: 0.

-- 7. Revision chains preserve structured action across every replacement.
select
  t.turn_number,
  t.revision_number,
  t.record_status,
  t.turn_id,
  t.supersedes_turn_id,
  t.structured_action
from public.game_turns t
where t.game_id = '11111111-1111-4111-8111-111111111111'::uuid
order by t.turn_number, t.revision_number;

-- 8. Constraint definitions include object-or-null structured payload checks.
select conrelid::regclass::text as table_name, conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in ('public.game_actions'::regclass, 'public.game_turns'::regclass)
  and conname in ('game_actions_structured_action_check', 'game_turns_structured_action_check')
order by table_name;
