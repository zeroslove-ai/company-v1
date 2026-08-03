# New session handoff

## Current baseline

- Repository: `zeroslove-ai/company-v1`
- Stable branch: `main`
- Main base SHA: `aee7262d2b3fc7dc22f49315b411cf79fbc61a80`
- Current work branch: `phase/1-db-migration-package`
- Current task: Phase 1 database migration package.
- PR #2 was merged before this phase began.
- Phase 0.5 gameplay contracts: completed and merged through PR #2
- Target Supabase project: `fmcrspgxstsmxxsmkeee` (`https://fmcrspgxstsmxxsmkeee.supabase.co`), project name `company-v1`, region `ap-northeast-1`.
- The new project's public schema was verified empty. Migration and seed have not been applied.
- The retired Dify project is not used and must not be modified.
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
8. `docs/NEXT_PHASE_PLAN.md`
9. `docs/PHASE_1_DB_MIGRATION_PACKAGE.md`

Phase 1 permits the unapplied SQL package, related documentation, and static tests only. Do not modify `src/**`, `content/**`, root Wrangler configuration, or `package.json`; do not provision Supabase or Cloudflare, apply migrations or seed data, deploy, or call Story, Extract, Commit, or TTS services. Do not force-push, reset, rebase, make merge commits, or automatically merge pull requests.
