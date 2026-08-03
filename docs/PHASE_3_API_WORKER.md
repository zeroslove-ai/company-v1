# Phase 3 API Worker deployment

## Deployment record

- Deployment date: 2026-08-03
- Worker: `game-proxy-company-v1`
- Worker URL: `https://game-proxy-company-v1.zeroslove.workers.dev`
- Version ID: `5b6471ab-d212-4f91-be11-bc9be463c129`
- Version tag: `phase-3-api-worker`
- Deployment message: `Deploy Company v1 Phase 3 API Worker`
- Deployment source: Wrangler upload
- Git SHA: `4cd7bd34e3e97720550e2ebd0ee611abae6657ac`

## Runtime configuration

Public variables:

- `GAME_EDITION=company-v1`
- `SUPABASE_URL=https://fmcrspgxstsmxxsmkeee.supabase.co`
- `LLM_API_URL=https://api.deepseek.com`
- `STORY_MODEL=deepseek-v4-flash`
- `EXTRACT_MODEL=deepseek-v4-flash`

Provisioned secret names:

- `SUPABASE_SERVICE_ROLE_KEY`
- `LLM_API_KEY`

Secret values are local deployment inputs and are not stored in this repository.

## Remote smoke result

The deployed Worker passed the following read-only checks:

- `GET /health`: HTTP 200, `edition_id=company-v1`, `phase=phase-2-vertical-loop`
- `GET /api/version`: HTTP 200, `edition_id=company-v1`, `phase=phase-2-vertical-loop`
- `POST /api/context`: HTTP 200 with `ok=true`; game and save edition are `company-v1`, save schema version is `1`, and committed turn is `0`.

The smoke test did not call Story, Extract, Commit, action-status, or reset endpoints. It made zero DeepSeek calls and zero Supabase writes.

## Scope confirmation

- Existing Workers were not changed.
- The frontend was not modified.
- The next implementation target is the frontend vertical loop against this API Worker.
