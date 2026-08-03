# Company v1 master architecture

## Product boundary

`zeroslove-ai/company-v1` is an independent company-game product. Its stable branch is `main`, and its bootstrap work is reviewed from `phase/0-bootstrap` through PR #1. It has no legacy repository or branch relationship at runtime. Historical material may be consulted only as a superseded reference; runtime dependency, direct import, and fallback behavior are prohibited.

## Repository layout

- API worker source: `src/api`
- Game engine contracts: `src/engine`
- Frontend assets: `src/frontend`
- Company content: `content`
- Product decisions: `docs`
- Static inputs: `fixtures`
- Contract tests: `test`
- Local helper scripts: `scripts`
- Planned database package: `supabase/migrations` and `supabase/seed`
- Root deployment configurations: `wrangler.api.jsonc` and `wrangler.frontend.jsonc`

## Runtime resources

The two product-owned Worker identifiers are `game-proxy-company-v1` for API and `gamebuilder-company-v1` for frontend. A dedicated Supabase project is planned, but no project, Worker resource, secret, or deployment has been created in Phase 0.

## Delivery sequence

- **Phase 0:** independent repository bootstrap.
- **Phase 0.5:** gameplay, recovery, and state contracts with fixtures and static tests.
- **Phase 1:** company-only database migration package, written but not applied.
- **Phase 2:** context → one Story SSE → one Extract → one guarded Commit vertical loop, with zero LLM repair calls and fail-open handling for noncritical failures.
- **Phase 3 and later:** content, CSA, choices, parser, frontend, images, and TTS.

Supabase and Cloudflare actions are outside the current scope and require explicit authorization. No deployment is part of this architecture baseline.
