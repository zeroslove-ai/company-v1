-- Company v1 Cut 2 Scene Authority, Stage A ACL closure.
-- Additive source only. 00500 is historical and immutable; this migration
-- closes the live default-privilege gap for internal SECURITY DEFINER helpers.

revoke all on function public.company_validate_scene_v1(jsonb, boolean)
  from public, anon, authenticated, service_role;

revoke all on function public.company_bootstrap_scene_v1(jsonb)
  from public, anon, authenticated, service_role;
