# New session handoff

## Current baseline

- Repository: `zeroslove-ai/company-v1`
- Stable branch: `main`
- Phase 0 independent repository bootstrap: complete and merged.
- Phase 0.5 gameplay contracts: complete and merged through PR #2.
- Phase 1 database migration package: complete and merged through PR #3.
- Target Supabase project: `fmcrspgxstsmxxsmkeee` (`https://fmcrspgxstsmxxsmkeee.supabase.co`), project name `company-v1`, region `ap-northeast-1`.
- Four migrations and the fixed development seed are applied and verified.
- Six application tables have RLS enabled.
- All eleven Company v1 application RPCs are `service_role` only; `anon` and `authenticated` have zero execute access.
- Rollback-only smoke testing verified normal turn commit, feedback replay, and stale concurrent feedback rejection.
- The retired Dify project is not used and must not be modified.
- Current phase: Phase 2 vertical loop preparation.
- Cloudflare resources not created; deployment not performed.

### Current repository structure

- API runtime: `src/api`
- Engine: `src/engine`
- Frontend: `src/frontend`

## Read before editing

1. `docs/INDEPENDENT_RUNTIME_DECISION.md`
2. `docs/PHASE_0_5_GAMEPLAY_CONTRACT.md`
3. `docs/TURN_RECOVERY_CONTRACT.md`
4. `docs/GUARDED_STATE_MERGE_CONTRACT.md`
5. `docs/FEEDBACK_REVISION_CONTRACT.md`
6. `docs/SAVE_SCHEMA_MIGRATION_CONTRACT.md`
7. `docs/NARRATIVE_OUTPUT_CONTRACT.md`
8. `docs/PHASE_1_DB_MIGRATION_PACKAGE.md`
9. `docs/NEXT_PHASE_PLAN.md`

Phase 2 may implement the API and engine vertical loop against the independent Company v1 database. Preserve the service-role-only boundary. Do not expose Supabase directly to the browser, do not place secrets in the repository, do not modify the retired Dify project, and do not create Cloudflare resources or deploy until that phase explicitly authorizes it. Do not force-push, reset, or rebase.
