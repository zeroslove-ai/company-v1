# Phase 4 frontend vertical loop

## Goal and scope

Phase 4 replaces the Phase 0 frontend skeleton with a responsive Company v1 play screen. The browser flow is Context → Story SSE → Extract → guarded Commit → Context refresh, with pending-action recovery after reload.

This PR changes frontend files only. The API Worker, engine, database, migrations, and existing Workers are unchanged. No frontend deployment, remote Story/Extract/Commit call, image, TTS, feedback, or reset runtime is included.

## File structure

- `src/frontend/pages/config.js`: public edition, API URL, game ID, and recent-turn configuration.
- `src/frontend/pages/api.js`: JSON API client and structured `ApiError`.
- `src/frontend/pages/sse.js`: chunk-safe SSE reader for meta, delta, complete, and error events.
- `src/frontend/pages/narrative.js`: browser-safe Story marker parser.
- `src/frontend/pages/state.js`: context validation, choices, pending localStorage state, and recovery mapping.
- `src/frontend/pages/render.js`: history, current Story, state, choice, warning, and monitor rendering.
- `src/frontend/pages/app.js`: page initialization and the vertical-loop orchestration.

## Interaction and recovery

The page resolves `?game=<uuid>` before falling back to the fixed development game ID. It loads Context, shows prior turns, and renders four choices when available alongside free text input. Choice clicks execute the complete text directly.

Before Story starts, the client persists only action metadata under `company-v1:pending-action:<game-id>`; it never stores secrets, full saves, Extract payloads, or Story text. Story delta text is parsed and rendered incrementally while preserving malformed text as fallback blocks. After Story completes, Extract and guarded Commit run with the same action ID. Commit success clears the pending action and reloads Context.

On reload, `/api/action-status` controls recovery. `retry_story`, `resume_extract`, `retry_extract`, `resume_commit`, `retry_commit`, `complete`, and `wait_story` are rendered as explicit recovery state; unknown states retain the pending action for inspection.

## Validation and next step

Mock unit tests cover API requests and errors, chunked SSE, narrative parsing, context/pending state, recovery mappings, and static frontend constraints. The frontend Wrangler configuration is bundle-checked with dry-run only.

The next step is review and merge, then one frontend Worker deployment and browser vertical-loop validation. The deployed API Worker remains `https://game-proxy-company-v1.zeroslove.workers.dev`.
