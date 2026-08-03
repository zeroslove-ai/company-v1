# New session handoff

## Current baseline

- Repository: `zeroslove-ai/company-v1`
- Stable branch: `main`
- Phase 0 independent repository bootstrap: complete and merged.
- Phase 0.5 gameplay contracts: complete and merged through PR #2.
- Phase 1 database migration package: complete, merged, applied, and verified.
- Main base SHA: `4cd7bd34e3e97720550e2ebd0ee611abae6657ac`.
- Current work branch: `phase/3-api-worker`.
- Current phase: Phase 3 API Worker configuration, deployment, and remote read-only smoke verification.
- Target Supabase project: `fmcrspgxstsmxxsmkeee` (`https://fmcrspgxstsmxxsmkeee.supabase.co`), project name `company-v1`, region `ap-northeast-1`.
- Four migrations and the fixed development seed are applied and verified.
- Six application tables have RLS enabled.
- Company v1 application RPCs remain `service_role` only.
- Phase 2 contract tests use mock Supabase and mock LLM calls; its separately authorized live E2E is complete.
- The Phase 3 smoke test performs no Story or Extract model call.
- Cloudflare API Worker `game-proxy-company-v1` is deployed and verified by remote read-only smoke tests.
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

Phase 2's API and engine vertical loop is complete. Phase 3 deploys the independent API Worker; its smoke test is limited to health, version, and read-only context checks.

Do not expose Supabase directly to the browser, place secrets in the repository, modify the retired Dify project, perform remote Story/Extract/Commit calls during smoke tests, force-push, reset, or rebase.

## Phase 2 live E2E result

The core live vertical loop passed: Context, Story persistence, Extract persistence, guarded Commit at turn 1, and cleanup all succeeded. The final harness verdict was a false negative because `reset_company_game` increments `save_revision`; validation now compares revisions relative to the run baseline. Live replay was not completed, and the two-attempt LLM limit has been reached. No further live calls are authorized in this phase. The later Phase 3 API Worker deployment and remote read-only smoke verification completed successfully.
