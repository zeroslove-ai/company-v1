# New session handoff

## Current baseline

- Repository: `zeroslove-ai/company-v1`
- Stable branch: `main`
- Phase 0 independent repository bootstrap: complete and merged.
- Phase 0.5 gameplay contracts: complete and merged through PR #2.
- Phase 1 database migration package: complete, merged, applied, and verified.
- Main base SHA: `19ffdfbd962cd883330466ba826025f625fd6b0b`.
- Current work branch: `phase/2-vertical-loop`.
- Current phase: Phase 2 context → Story SSE → Extract → guarded Commit vertical loop implementation.
- Target Supabase project: `fmcrspgxstsmxxsmkeee` (`https://fmcrspgxstsmxxsmkeee.supabase.co`), project name `company-v1`, region `ap-northeast-1`.
- Four migrations and the fixed development seed are applied and verified.
- Six application tables have RLS enabled.
- Company v1 application RPCs remain `service_role` only.
- Phase 2 implementation uses mock Supabase and mock LLM calls in tests.
- Real Story and Extract model calls have not been performed.
- Cloudflare resources have not been created and deployment has not been performed.
- The retired Dify project is not used and must not be modified.

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
9. `docs/PHASE_2_VERTICAL_LOOP.md`
10. `docs/NEXT_PHASE_PLAN.md`

Phase 2 may implement the API and engine vertical loop against the independent Company v1 database. The required runtime sequence is context → one Story SSE call → one Extract call → one guarded Commit call, with zero LLM repair calls.

Do not expose Supabase directly to the browser, place secrets in the repository, modify the retired Dify project, create Cloudflare resources, deploy, or perform real Story/Extract calls during this implementation PR. Do not force-push, reset, or rebase.

## Phase 2 live E2E result

The core live vertical loop passed: Context, Story persistence, Extract persistence, guarded Commit at turn 1, and cleanup all succeeded. The final harness verdict was a false negative because `reset_company_game` increments `save_revision`; validation now compares revisions relative to the run baseline. Live replay was not completed, and the two-attempt LLM limit has been reached. No further live calls are authorized in this phase. Cloudflare resources remain uncreated.
