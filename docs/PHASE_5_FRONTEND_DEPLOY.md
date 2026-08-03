# Phase 5 frontend deployment

## Deployment record

- Date: 2026-08-03
- Main base SHA: `7e74ed6c07fd39c05be7ddebc74c3a1743a04b65`
- Frontend Worker: `gamebuilder-company-v1`
- Frontend Worker URL: `https://gamebuilder-company-v1.zeroslove.workers.dev`
- Public game URL: `https://gamebuilder-company-v1.zeroslove.workers.dev/?game=11111111-1111-4111-8111-111111111111`
- Version ID: `f6522975-f653-4290-9ad1-ba66d86740e8`
- Deployment tag: `phase-5-frontend-deploy`
- Deployment message: `Deploy Company v1 Phase 5 frontend`
- Deployment method: manual Wrangler deploy
- GitHub automatic deployment: not configured

The Worker uses the static-asset-only `wrangler.frontend.jsonc` configuration. It has no Worker entrypoint, bindings, secrets, or direct Supabase access. The public frontend calls only the existing API Worker.

## Verification

- `npm.cmd test`: 55/55 passed before deployment.
- `git diff --check`: passed before deployment.
- Wrangler frontend dry-run: passed.
- Remote HTML, CSS, and JavaScript asset smoke: passed.
- Remote read-only Context smoke: passed for the Company v1 development game.
- Browser-rendered DOM smoke: passed for the public game page, including the game title, Turn 0, API-connected state, and the Phase 4 frontend marker.
- Direct `--dump-dom` output was unavailable from installed browser executables in this environment; no DOM artifact was retained.
- Public Story, Extract, and Commit calls: 0.
- Supabase writes: 0.

The API Worker `game-proxy-company-v1` and all existing Workers were not modified. No Cloudflare API Worker deployment occurred.

## User validation boundary

Public frontend deployment and Context smoke passed. The first public browser Story turn is reserved for user validation.

Next steps are user browser validation and Company v1 content configuration. A future enhancement backlog includes a game clock with default elapsed minutes and Extract-proposed time progression; it is not implemented in Phase 5.
