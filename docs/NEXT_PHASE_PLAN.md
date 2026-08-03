# Next phase plan

## Current PR state

- Repository: `zeroslove-ai/company-v1`
- Stable base: `main`
- PR #1: **Phase 0 independent repository bootstrap**
- Head branch: `phase/0-bootstrap`
- Head commit: use the current remote head of `phase/0-bootstrap`; do not hardcode a stale SHA in this plan.
- Status: documentation correction and contract validation completed; awaiting squash merge.
- Supabase, Cloudflare, and deployment have not been performed.

The active roots are `src/api`, `src/engine`, `src/frontend`, `content`, `docs`, `fixtures`, `test`, `scripts`, `supabase/migrations`, and `supabase/seed`.

## Required sequence

1. Squash-merge PR #1 into `main` after final review.
2. Create a `phase/0.5-*` branch from the merged `main`.
3. Implement **Phase 0.5** gameplay, recovery, and state contracts, fixtures, and static tests; open a dedicated PR.
4. Implement the Phase 1 company-only migration package without applying it.
5. Implement the Phase 2 context → Story SSE → Extract → guarded Commit vertical loop.
6. Add later content, CSA, choices, parser, frontend, images, and TTS work in Phase 3 and later.

## Phase 0.5 boundaries

Phase 0.5 produces only contracts, fixtures, and static tests. It does not create a Supabase project, apply migrations, create Cloudflare Workers, deploy, or call external game services.

## Repository boundary

`zeroslove-ai/company-v1` is the only active baseline. Legacy material is historical reference only, superseded, and prohibited as a runtime dependency, direct import, or fallback.
