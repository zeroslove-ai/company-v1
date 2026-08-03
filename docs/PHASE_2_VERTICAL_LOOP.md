# Phase 2 minimum vertical game loop

## Goal

Implement one recoverable Company v1 turn through the independent API and engine runtime:

```text
context → reserve action → Story SSE → Extract → guarded Commit
```

The Phase 2 implementation is intentionally narrow. It validates the runtime orchestration with mock Supabase and mock LLM calls; it does not make real Story or Extract calls during automated testing.

## API surface

The API preserves `GET /health` and `GET /api/version` and adds these JSON/SSE endpoints:

- `POST /api/context`
- `POST /api/story`
- `POST /api/extract`
- `POST /api/commit`
- `POST /api/action-status`

JSON successes use `{ "ok": true, "data": {} }`. JSON failures use `{ "ok": false, "error": { "code", "message", "retryable" } }`. Story output is streamed as SSE, including a terminal `done` event or an SSE `error` event.

## Required sequence

1. `context` loads the game/save/action context only through service-role RPC calls.
2. `story` reserves the action and makes exactly one streaming Story call. A stored Story result is replayed without another model call.
3. `extract` makes exactly one non-streaming Extract call for the stored Story result. A stored Extract result is replayed without another model call.
4. `commit` normalizes the Extract envelope, applies an engine-side guarded merge, then makes exactly one guarded Commit RPC call.
5. `action-status` exposes the recoverable phase derived from the persisted action status.

There are zero automatic LLM repair calls. Invalid Story markers are preserved as raw text with parser warnings. Invalid Extract envelopes, stale or unknown deltas, save/schema/edition mismatches, sexual completion without `sexual_resolution: true`, and commit conflicts are rejected or surfaced as guarded warnings according to the Phase 0.5 contracts.

## Engine responsibilities

- `story-prompt.js`: build the canonical Story prompt from edition, context, action, and expected turn.
- `extract-prompt.js`: build the canonical Extract prompt from Story output.
- `narrative-parser.js`: preserve raw Story text and parse recognized marker blocks conservatively.
- `extract-envelope.js`: validate and normalize the Extract result envelope.
- `guarded-merge.js`: apply only allowed state paths, accumulate warnings, deduplicate event-ledger entries, and build next turn state.
- `turn-state.js`: map persisted action status to recovery state.

## Security and scope

- Supabase is never exposed directly to the browser.
- The API reads `SUPABASE_URL` from the Worker environment and `SUPABASE_SERVICE_ROLE_KEY` only from runtime secrets; no secret is checked into this repository.
- Cloudflare resources are not created and no deployment is performed in this phase.
- The retired Dify project is outside this implementation.

## Validation

Phase 2 adds deterministic fixtures and mock API tests for valid and malformed Story responses, Extract validation, guarded merge warnings/rejections, replay recovery, single-call accounting, conflict responses, and existing bootstrap/Phase 0.5/Phase 1 contracts.
