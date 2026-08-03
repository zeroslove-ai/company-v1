# Next phase plan

## Current status

- Repository: `zeroslove-ai/company-v1`
- API runtime: `src/api`
- Engine: `src/engine`
- Frontend: `src/frontend`
- Phase 0 independent repository bootstrap: complete and merged.
- Phase 0.5 gameplay, recovery, and state contracts: complete and merged.
- Current work: **Phase 1 company-only migration package** on `phase/1-db-migration-package`.
- Base: `main` at `aee7262d2b3fc7dc22f49315b411cf79fbc61a80`.
- Target Supabase project: `fmcrspgxstsmxxsmkeee` (`https://fmcrspgxstsmxxsmkeee.supabase.co`), project name `company-v1`, region `ap-northeast-1`.
- The new project's public schema was verified empty. Migration and seed have not been applied.
- The retired Dify project is not used and must not be modified.
- Next step: final-review and merge PR #3, then apply the migrations and development seed to the target project with explicit authorization.
- Phase 2 follows with the context → Story SSE → Extract → guarded Commit vertical loop.
- Cloudflare resources and deployment remain unperformed.

## Sequence

1. Final-review and merge PR #3.
2. Apply the three migrations to the target Supabase project with explicit authorization.
3. Apply the development seed and verify tables, RPCs, RLS, and seed data.
4. Implement the Phase 2 context → Story SSE → Extract → guarded Commit vertical loop.
5. Add content, CSA presentation, choices, parser, frontend, images, and TTS in later phases.
