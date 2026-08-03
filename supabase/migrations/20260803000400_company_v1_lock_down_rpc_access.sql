-- Supabase grants EXECUTE on new public functions to API roles by default.
-- Company v1 RPCs are Worker-only and must remain service-role-only.

revoke all on function public.set_updated_at()
  from public, anon, authenticated;
revoke all on function public.validate_company_save_v1(jsonb)
  from public, anon, authenticated;
revoke all on function public.create_company_game(text, jsonb, jsonb, text, uuid)
  from public, anon, authenticated;
revoke all on function public.get_company_context(uuid, integer)
  from public, anon, authenticated;
revoke all on function public.reserve_turn_action(uuid, uuid, integer, text)
  from public, anon, authenticated;
revoke all on function public.record_story_result(uuid, uuid, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.record_extract_result(uuid, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.get_action_status(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.commit_company_turn(uuid, uuid, integer, jsonb, text, jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function public.reserve_feedback_revision(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.commit_feedback_revision(uuid, uuid, uuid, jsonb, text, jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function public.reset_company_game(uuid, text)
  from public, anon, authenticated;

grant execute on function public.validate_company_save_v1(jsonb) to service_role;
grant execute on function public.create_company_game(text, jsonb, jsonb, text, uuid) to service_role;
grant execute on function public.get_company_context(uuid, integer) to service_role;
grant execute on function public.reserve_turn_action(uuid, uuid, integer, text) to service_role;
grant execute on function public.record_story_result(uuid, uuid, text, jsonb) to service_role;
grant execute on function public.record_extract_result(uuid, uuid, jsonb) to service_role;
grant execute on function public.get_action_status(uuid, uuid) to service_role;
grant execute on function public.commit_company_turn(uuid, uuid, integer, jsonb, text, jsonb, jsonb) to service_role;
grant execute on function public.reserve_feedback_revision(uuid, uuid, text) to service_role;
grant execute on function public.commit_feedback_revision(uuid, uuid, uuid, jsonb, text, jsonb, jsonb) to service_role;
grant execute on function public.reset_company_game(uuid, text) to service_role;
