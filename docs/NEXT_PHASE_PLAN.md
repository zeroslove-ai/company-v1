# Next phase plan

## Current status

- Repository: `zeroslove-ai/company-v1`
- API runtime: `src/api`
- Engine: `src/engine`
- Frontend: `src/frontend`
- Phase 0 independent repository bootstrap: complete and merged.
- Current work: **Phase 0.5 gameplay, recovery, and state contracts** on `phase/0.5-gameplay-contracts`.
- Base: `main` at `609d7fad76d829a2de4b745b96f1d02b6705659b`.
- Next phase after this PR: Phase 1 company-only migration package.
- Supabase provisioning, Cloudflare work, and deployment remain unperformed.

## Sequence

1. Freeze Phase 0.5 contracts, fixtures, and static tests in a Draft PR.
2. Create the Phase 1 migration package without applying SQL or provisioning infrastructure.
3. Implement the Phase 2 context → Story SSE → Extract → guarded Commit vertical loop.
4. Add content, CSA presentation, choices, parser, frontend, images, and TTS in later phases.
