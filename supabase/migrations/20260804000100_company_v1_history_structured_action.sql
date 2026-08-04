-- NOT APPLIED. Written per instruction (write the migration file only, never apply it).
--
-- Adds a structured_action column to game_turns so /api/history can return the exact
-- canonical_action (CSA app transaction, find_npc, etc) that produced a turn, instead of
-- always null. commit_company_turn and commit_feedback_revision would both need a new
-- p_structured_action jsonb parameter to populate it going forward; existing rows would
-- simply have structured_action = null (they never carried one).

alter table public.game_turns
  add column structured_action jsonb;

comment on column public.game_turns.structured_action is
  'The canonical_action (if any) that produced this turn — CSA app transactions, find_npc, etc. Null for ordinary free-text turns and for any row committed before this column existed.';
