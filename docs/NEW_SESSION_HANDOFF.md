# New session handoff

## Current baseline

- Repository: `zeroslove-ai/company-v1`
- Stable branch: `main`
- Main base SHA: `609d7fad76d829a2de4b745b96f1d02b6705659b`
- Current work branch: `phase/0.5-gameplay-contracts`
- Current task: Phase 0.5 gameplay, recovery, and state contracts.
- PR #1 was merged before this phase began.

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

Phase 0.5 permits contracts, fixtures, and static tests only. Do not modify `src/**`, `content/**`, root Wrangler configuration, or `package.json`; do not write SQL; do not provision Supabase or Cloudflare; do not deploy; and do not call Story, Extract, Commit, or TTS services. Do not force-push, reset, rebase, make merge commits, or automatically merge pull requests.
