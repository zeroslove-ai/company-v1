# Company v1 infrastructure plan

## Independent baseline

The active repository is `zeroslove-ai/company-v1`; its stable branch is `main`. Product changes use `phase/*` branches and pull requests. This infrastructure has no active relation to legacy branches or repositories. Any legacy description is historical reference only, superseded, and prohibited as a runtime dependency, direct import, or fallback.

## Planned resources

- API Worker: `game-proxy-company-v1`
- Frontend Worker: `gamebuilder-company-v1`
- API configuration: `wrangler.api.jsonc`
- Frontend configuration: `wrangler.frontend.jsonc`
- Future database migrations: `supabase/migrations`
- Future seed data: `supabase/seed`
- Future dedicated Supabase project: planned only

Cloudflare Git automatic deployment is prohibited during the initial phases. A future manual deployment may occur only after explicit authorization. No Worker resources, secrets, Supabase project, database migration application, or deployment are performed by Phase 0 or Phase 0.5.

## Operational sequence

1. Complete the independent repository bootstrap.
2. Complete **Phase 0.5** gameplay, recovery, and state contracts with fixtures and static tests.
3. Write the company-only database migration package in Phase 1 without applying it.
4. Implement the context, Story SSE, Extract, and guarded Commit loop in Phase 2.
5. Consider manual infrastructure provisioning only with explicit authorization.

TTS belongs to later product work. It is not a finalized shared legacy Worker or an authorized infrastructure dependency in this plan.

### 현재 저장소 구조

- API runtime: `src/api`
- Engine: `src/engine`
- Frontend: `src/frontend`
- Content: `content`
- Documentation: `docs`
- Fixtures: `fixtures`
- Tests: `test`
- Scripts: `scripts`
- Database migrations: `supabase/migrations`
- Database seed: `supabase/seed`
- API Wrangler config: `wrangler.api.jsonc`
- Frontend Wrangler config: `wrangler.frontend.jsonc`
