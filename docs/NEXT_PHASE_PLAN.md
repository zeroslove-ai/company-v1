# Next phase plan

## Current status

- Repository: `zeroslove-ai/company-v1`
- API runtime: `src/api`
- Engine: `src/engine`
- Frontend: `src/frontend`
- Phase 0 independent repository bootstrap: complete and merged.
- Phase 0.5 gameplay, recovery, and state contracts: complete and merged.
- Phase 1 company database migration package: complete, merged, applied, and verified.
- Target Supabase project: `fmcrspgxstsmxxsmkeee` (`https://fmcrspgxstsmxxsmkeee.supabase.co`), project name `company-v1`, region `ap-northeast-1`.
- Four migrations and the fixed development seed are applied.
- Six application tables have RLS enabled.
- Company v1 RPC execution is restricted to `service_role`; `anon` and `authenticated` have no RPC execution access.
- The retired Dify project is not used and must not be modified.
- Current next phase: **Phase 2 context → Story SSE → Extract → guarded Commit vertical loop**.
- Cloudflare resources and deployment remain unperformed.

## Sequence

1. Implement the Phase 2 API and engine vertical loop.
2. Connect the Worker to Supabase with the service-role secret stored only as a secret.
3. Verify context loading, action reservation, Story streaming, Extract recording, guarded Commit, recovery, and feedback revision.
4. Add content, CSA presentation, choices, parser, frontend, images, and TTS in later phases.
