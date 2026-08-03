# New session handoff

## Read first

Read these documents before changing the implementation:

1. `docs/INDEPENDENT_RUNTIME_DECISION.md`
2. `docs/MASTER_ARCHITECTURE.md`
3. `docs/INFRASTRUCTURE_PLAN.md`
4. `docs/GAME_SYSTEM_DESIGN.md`
5. `docs/GAMEPLAY_DESIGN_OPTIONS.md`
6. `docs/NARRATIVE_OUTPUT_CONTRACT.md`
7. `docs/UI_UX_REDESIGN.md`
8. `docs/DESIGN_REVIEW_BACKLOG.md`
9. `docs/NEXT_PHASE_PLAN.md`
10. `docs/CODEX_IMPLEMENTATION_PLAN.md`

## Current state

- Repository: `zeroslove-ai/company-v1`
- Stable base branch: `main`
- Bootstrap PR: #1
- Bootstrap head branch: `phase/0-bootstrap`
- Bootstrap head commit: verify the current remote branch head instead of relying on a hardcoded SHA.
- Next authorized implementation phase: **Phase 0.5** gameplay, recovery, and state contracts.

The active product roots are `src/api`, `src/engine`, `src/frontend`, `content`, `docs`, `fixtures`, `test`, `scripts`, `supabase/migrations`, and `supabase/seed`. The planned Worker identifiers are `game-proxy-company-v1` and `gamebuilder-company-v1`.

## Scope guardrails

The repository is independent. Legacy material is historical reference only, superseded, and prohibited as a runtime dependency, direct import, or fallback.

Do not create Supabase projects, apply migrations, create Cloudflare Workers, configure secrets, deploy, or call real Story, Extract, Commit, or TTS services without explicit authorization. Do not force-push, reset, rebase, or merge a PR automatically.

Proceed in this order: finish and merge the Phase 0 bootstrap PR, then Phase 0.5 contracts with fixtures and static tests, then the Phase 1 migration package, then the Phase 2 vertical loop.
