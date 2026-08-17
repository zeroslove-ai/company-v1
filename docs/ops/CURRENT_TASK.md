# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: api-smoke-context-canon-reconciliation-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

## Purpose

Repair only the stale read-only API smoke assertion that blocked `test-runtime-live-acceptance-v2` after a successful TEST API deployment. Independent operator verification shows the deployed/current-main API context contract is healthy; the smoke script is stale because it hardcodes the protected sentinel game and requires `turn_state.committed_turn === 0`, while that existing TEST game is legitimately at turn 18. Reconcile the smoke harness to the current committed-context canon, prove the already-deployed TEST API passes the corrected smoke once, and STOP for review. Do not redeploy or run gameplay.

## 0. Frozen authority

- Repository: `zeroslove-ai/company-v1`
- Expected `origin/main`: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Previous task: `test-runtime-live-acceptance-v2`
- Previous STARTED comment: `5319362207`
- Previous terminal comment: `5319385191`
- Previous terminal: `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V2`
- Previous final SHA: `36b916f40522f4814b0c432a6df130cece0ef57a`
- Previous final CURRENT_TASK blob: `6ed0f6b54535bec59ccc971010e8c5d339c119b5`
- TEST Supabase: `fmcrspgxstsmxxsmkeee`
- API Worker: `game-proxy-company-v1`
- Already-deployed API version from the accepted blocked terminal: `2a976491-451d-4fc8-8808-65353cad137b`
- API URL: `https://game-proxy-company-v1.zeroslove.workers.dev`
- Frontend Worker was not deployed in the blocked task.
- Disposable TEST game for read-only smoke: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- Preserved/manual game — do not touch: `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA game — do not touch: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`
- Protected sentinel — do not use as smoke fixture and do not mutate: `11111111-1111-4111-8111-111111111111`
- Production: forbidden

Accepted TEST schema invariants remain:
- migration rows `27`;
- target migration `20260817000200` absent;
- bridge canonical `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`;
- forensic canonical `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`.

Independent operator root-cause evidence:
- current `scripts/smoke-api-worker.mjs` hardcodes game ID `11111111-1111-4111-8111-111111111111` and rejects any context where `save.turn_state.committed_turn !== 0`;
- current TEST row for that game has `game_save.committed_turn=18` and `save.data.turn_state.committed_turn=18`;
- current TEST disposable game has `game_save.committed_turn=11` and `save.data.turn_state.committed_turn=11`;
- direct read-only `get_company_context` evidence for the protected sentinel has `game.edition_id=company-v1`, wrapped save `data.edition=company-v1`, `save_schema_version=1`, and committed turn `18`;
- API route canon returns `ok({ context: withOpeningTurnProjection(hydrated) })`; nonzero committed turn is valid state, not an API error;
- therefore the failed `/api/context` smoke is a stale fixture/assertion, not evidence that the deployed runtime is broken.

## 1. Mandatory start freeze

Before editing:
1. fresh-fetch and require `origin/main` exactly the SHA above;
2. require this branch to descend directly from previous final `36b916f40522f4814b0c432a6df130cece0ef57a`, with only this registration commit before execution;
3. re-read terminal `5319385191`, current `scripts/smoke-api-worker.mjs`, `src/api/turn-routes.js` context route, and relevant API-response tests;
4. fresh-read the two TEST games above and require the observed nonzero committed-turn values remain internally consistent between `game_save.committed_turn` and `save.data.turn_state.committed_turn`;
5. fresh-read TEST migration row count/target absence and both accepted migration canonicals;
6. verify API Worker current version is still `2a976491-451d-4fc8-8808-65353cad137b` if the available tooling can prove it. If Worker version cannot be independently read, record that limitation but do not redeploy merely to obtain evidence;
7. prove no frontend deployment/live gameplay/reset occurred after terminal `5319385191` from available durable evidence.

Any unrelated runtime/DB drift: STOP `API_SMOKE_CONTEXT_RECONCILIATION_BLOCKED` without source change.

## 2. Allowed repository scope

After registration, only these files may change:
- `scripts/smoke-api-worker.mjs`
- one narrowly-scoped smoke regression test file under `test/**` (prefer `test/api-smoke-contract.test.mjs` if a new file is needed)
- `docs/ops/CURRENT_TASK.md` lifecycle evidence

Do not modify API runtime, engine, frontend, content, migrations, Wrangler configs, package/workflow files, DB contract gate, provider/model/TTS config, or unrelated tests/docs.

## 3. Required smoke correction

The smoke must validate the current API contract, not a specific historical save state.

### 3.1 Remove hidden protected-sentinel fixture

Do not hardcode `11111111-1111-4111-8111-111111111111` in the API smoke.

Require the smoke game ID explicitly from CLI input after the base URL, for example:
`node scripts/smoke-api-worker.mjs <base-url> <game-id>`

For this task's one remote smoke, use only the disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` in read-only `/api/context`.

Invalid/missing game ID input must fail closed before network context validation. Do not silently substitute another game.

### 3.2 Validate context identity/schema and turn consistency, not turn zero

For `/api/context`, require at minimum:
- response envelope `ok === true` via existing `readSuccess`;
- `context.game.edition_id === 'company-v1'`;
- requested game identity is preserved when the current context payload exposes a game ID;
- save resolves correctly whether wrapped (`context.save.data`) or direct;
- `save.edition === 'company-v1'`;
- `save.save_schema_version === 1`;
- committed-turn values exposed by the save wrapper and canonical `save.turn_state.committed_turn` are non-negative integers when present;
- if both wrapper `context.save.committed_turn` and nested canonical `save.turn_state.committed_turn` are present, they must be exactly equal;
- a legitimate nonzero committed turn must PASS;
- malformed/missing edition/schema or contradictory committed-turn values must FAIL.

Do **not** weaken smoke to only HTTP 200/`ok=true`. It must still prove a coherent Company v1 context contract.

Do not require Opening, turn 0, empty history, or any other mutable fixture state merely to prove API health.

## 4. Regression requirements

Add focused tests proving at least:
1. a valid wrapped Company v1 context with committed turn `18` passes;
2. a valid direct-save shape with a nonzero committed turn passes if the route contract permits that compatibility shape;
3. wrapped-vs-nested committed-turn mismatch fails;
4. wrong edition fails;
5. wrong save schema version fails;
6. missing/invalid game-id CLI input fails closed;
7. the source no longer contains the protected sentinel as a smoke fixture;
8. the smoke still checks `/health`, `/api/version`, and `/api/context` and preserves existing failure codes/diagnostic clarity.

Prefer behavior tests over source-text-only tests. If the script must be minimally refactored to make assertions testable, keep the refactor inside `scripts/smoke-api-worker.mjs`; do not create a second semantic smoke implementation.

Run focused smoke tests, then full `npm.cmd test`; require 0 failures. Run `node --check` on changed MJS/JS and `git diff --check`.

## 5. Read-only remote proof

After the source/test correction and all local tests pass:
1. do **not** redeploy API;
2. run the corrected API smoke exactly once against `https://game-proxy-company-v1.zeroslove.workers.dev` with disposable game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`;
3. require `/health`, `/api/version`, `/api/context` all PASS;
4. record the returned context's edition/schema and committed-turn consistency without dumping secrets or full private save contents;
5. re-read disposable TEST game afterward and prove no row/action/turn count or committed-turn change occurred from the smoke;
6. recheck migration row count/target absence and both canonicals remain unchanged.

Only one corrected remote smoke invocation is authorized. If it fails or is ambiguous: STOP `API_SMOKE_CONTEXT_RECONCILIATION_BLOCKED`. No redeploy/retry-to-pass.

## 6. Hard prohibitions

- API Worker redeploy: forbidden;
- frontend deploy: forbidden;
- live gameplay/provider turn: forbidden;
- TEST reset: forbidden;
- any DB/schema/DDL/DML write: forbidden;
- migration apply/push/repair/history mutation: forbidden;
- Production access/change: forbidden;
- protected sentinel smoke usage/mutation: forbidden;
- preserved/manual or QA game mutation: forbidden;
- API/runtime/engine/frontend/content/config behavior changes: forbidden;
- gate weakening/skipping: forbidden;
- provider/model/TTS changes: forbidden;
- Cut 3: forbidden.

## 7. Terminal classification

Choose exactly one:

### `API_SMOKE_CONTEXT_CANON_RECONCILED`
Only if the stale fixture/turn-zero assertion is narrowly corrected, focused/full tests pass, one read-only corrected smoke against the already-deployed API passes, disposable/other game state and migration invariants remain unchanged, and no forbidden operation occurred.

### `API_SMOKE_CONTEXT_RECONCILIATION_BLOCKED`
Use for any runtime/context mismatch remaining after the smoke correction, inability to prove a coherent contract, test failure, unexpected Worker/runtime drift, remote smoke failure, or scope drift.

At terminal:
1. set CURRENT_TASK `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal containing registration/final SHA/blob, changed files, root cause, old vs corrected smoke assertions, focused/full test counts, exact remote smoke result, pre/post disposable game state, migration invariants, deploy/reset/gameplay/write counts, and terminal classification;
3. STOP. Do not resume frontend deployment/live acceptance and do not create the next task.

## 8. Execution evidence — COMPLETE

- Execution lease: Issue #68 comment `5319524827`.
- Starting SHA / registration SHA: `c9a334700bd1120d06dbab1d785ba289f40d5515`.
- Starting CURRENT_TASK blob: `13dfa9c18ccb3b566f2df3c2a758cf3c76c149ea`.
- Root cause: the old smoke hardcoded the protected sentinel game and required committed turn zero, although the current context route accepts coherent nonzero committed state.
- Changed files: `scripts/smoke-api-worker.mjs`, `test/api-smoke-contract.test.mjs`, and this CURRENT_TASK lifecycle evidence.
- Correction: explicit UUID game-id CLI input; missing/invalid input fails before network; Company edition/schema and requested identity are checked; wrapper/direct save shapes are accepted; nonnegative integer committed turns are required and wrapper/nested values must agree; zero-turn fixture assertion removed.
- Focused smoke regression: `9/9` PASS. Full regression: `329/329` PASS. `node --check scripts/smoke-api-worker.mjs`: PASS. `git diff --check`: PASS.
- API deployment: no redeploy. Already-deployed `game-proxy-company-v1` version `2a976491-451d-4fc8-8808-65353cad137b` was independently confirmed. Frontend deployment list showed no deployment after the previous blocked run; no frontend deployment was performed in this task.
- Corrected remote smoke: exactly one invocation against `https://game-proxy-company-v1.zeroslove.workers.dev` with disposable game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`; `/health`, `/api/version`, and `/api/context` all PASSed; context edition/schema and committed-turn consistency PASSed.
- TEST pre/post state identical: migration rows `27`; target `20260817000200` absent; bridge `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`; forensic `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`; disposable `game_save=1/actions=12/turns=11`, committed turn `11`/`11`; preserved/manual `1/9/7`, committed `7`/`7`; QA `1/7/7`, committed `7`/`7`.
- Safety: API redeploy `0`; frontend deploy `0`; TEST reset/live gameplay `0`; DB/schema/migration/history writes `0`; Production access/change `0`; protected sentinel/preserved/QA mutation `0`; provider/model/TTS/runtime/engine/frontend/content/config changes `0`.

Terminal classification: `API_SMOKE_CONTEXT_CANON_RECONCILED`.
STOP. Do not redeploy, run gameplay, resume frontend deployment, or create another task/Cut.
