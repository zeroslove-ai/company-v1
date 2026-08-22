# Company — CURRENT TASK

Status: READY
Task ID: company-r3-game-capability-source-fix-v1
Mode: IMPLEMENT MINIMAL PER-GAME CAPABILITY SOURCE FIX -> FOCUSED TESTS -> STOP BEFORE DEPLOY
Updated: 2026-08-23 00:42 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/recovery branch, auth framework, compatibility layer, or competing execution authority.

## 0. Authority / accepted baseline

Binding authority:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- owner lean-development directives `5380380688` and `5380381500`;
- accepted executable source before this correction `2898a929db239f210f448bab87579872aae8ec81`;
- feedback revision is fully TEST-accepted/frozen by review `5381157253`;
- RLS exposure audit terminal `5381207635`;
- operator review `5381230270`;
- this exact CURRENT_TASK blob after registration.

Known frozen unrelated exceptions:
- CSA rule 7 provider/model capability exception;
- CSA rule 9 provider/model capability exception.
Do not sample, tune, or reinterpret them.

## 1. Proven defect

The TEST read-only audit proved a real Worker API access-control defect:
- Supabase table/RPC privilege boundaries themselves were not anonymously open;
- but `GET /api/r3/games/:game_id/context` returned the full canonical gameplay context with HTTP 200 when called with no API key/token;
- source confirms `runtime-r3/server/worker.js` calls `store.context(gameId)` without a game access check;
- the same game-scoped route spine also exposes opening/turn/feedback/CSA without a credential boundary;
- `frontend-r3/r3-client.js` currently sends no game credential.

This is deterministic protected-data exposure and must be fixed before further product rollout.

This defect does NOT authorize:
- Supabase RLS/grant redesign;
- user accounts/login/OAuth;
- generic auth middleware/framework;
- semantic/runtime/gameplay changes;
- compatibility bypass for old bare `game_id` URLs.

## 2. Required minimal design

Implement a narrow **per-game bearer capability** for R3.

Preferred shape:
- stateless, versioned HMAC-SHA256 token bound to exactly one `game_id`;
- signed with a dedicated Worker secret named `R3_GAME_ACCESS_SECRET` (or an equivalently narrow dedicated R3 game-access secret if repository conventions require a different exact env name);
- no DB/schema/migration required;
- no raw secret or token written to logs, Issue comments, source, tests, URLs, Story context, DB rows, or error payloads.

Do not reuse the Supabase service-role key as the capability-signing secret if a dedicated secret can be used. Source may require the dedicated secret, but this task MUST NOT provision or deploy it.

Fail closed:
- production Worker setup/game access must not silently fall back to bare `game_id` when the signing secret is missing;
- no insecure development fallback may be active in deployed code.

Keep the implementation small. A tiny R3-specific capability helper/module is allowed if cleaner than embedding crypto in `worker.js`; do not create a general authentication subsystem.

## 3. Public vs protected routes

Remain public:
- `OPTIONS` transport handling;
- `GET /api/r3/catalogs`;
- `POST /api/r3/games` game creation/setup.

`POST /api/r3/games` must return the newly created game plus its bearer capability to the creating client. The capability is transport authority only; it must not become gameplay/domain state.

Require a valid capability bound to the path `game_id` BEFORE any store/provider/game mutation/read for every game-scoped route:
- `GET /api/r3/games/:game_id/context`;
- `POST /api/r3/games/:game_id/opening`;
- `POST /api/r3/games/:game_id/turn`;
- `POST /api/r3/games/:game_id/feedback`;
- `POST /api/r3/games/:game_id/csa`;
- any reconnect/recovery frontend call that reaches the above routes.

Credential transport:
- use `Authorization: Bearer <game capability>` unless an equally standard bearer header is already established in this R3 source;
- capability for game A must never authorize game B;
- malformed/missing/wrong/other-game token must return one generic access-denied response (401 preferred; 403 acceptable if existing error conventions strongly require it), without revealing whether the game exists;
- rejection must happen before `store.context`, job lookup, provider Story/Observer, feedback begin, CSA mutation, or any other game-specific call.

Do not protect catalogs/setup with this capability.

## 4. Frontend/client behavior

Update the thin R3 client/app only as needed to carry the capability.

Requirements:
- setup receives the capability from the server;
- client sends it on every protected game-scoped request, including SSE opening/turn/feedback and context/recovery/CSA;
- persist it locally keyed by the exact `game_id` so an ordinary same-browser refresh of the existing `?game_id=...` URL can resume the game;
- do NOT place the bearer token in the query string/hash or visible URL;
- do NOT print it in status/UI/console;
- if a `game_id` URL has no matching local capability (for example an old link or another browser), fail clearly as access-required instead of silently calling the API without a token or creating a compatibility bypass;
- setup for a new game should save the capability before the first context/opening request.

Use the smallest browser storage approach already compatible with this frontend. Do not add account/session UI.

## 5. Historical games / compatibility

Do NOT add a bare-ID compatibility escape hatch.

Existing pre-capability TEST URLs may stop being resumable after the future secured deployment unless the browser possesses a valid newly issued capability. That is acceptable for this correction boundary.

Do NOT:
- backfill tokens into DB;
- add token-exchange-by-game-id endpoints;
- infer ownership from game UUID;
- retain unauthenticated read-only context for legacy games.

Future TEST rollout should use a fresh disposable game created after the secured deployment.

## 6. Scope

Expected source areas only:
- `runtime-r3/server/worker.js`;
- optionally one narrowly named R3 game-capability helper under `runtime-r3/server/`;
- `frontend-r3/r3-client.js`;
- `frontend-r3/app.js`;
- focused R3 worker/client/access tests and only minimal existing test-fixture adjustments required by the new explicit credential boundary.

Do not edit Company content, Story/Observer prompts, reducer, CSA behavior, feedback semantics, provider/model/config/timeouts, DB store semantics, migrations, or unrelated UI.

No new dependencies unless Web Crypto/runtime primitives genuinely cannot express the small HMAC/token contract. Prefer platform Web Crypto and existing primitives.

## 7. Focused acceptance tests

Add/adjust focused deterministic tests proving at minimum:

### Server capability
1. catalogs remains public;
2. setup remains public and returns a non-empty capability without exposing the signing secret;
3. valid token + matching game_id allows context;
4. missing token denies context before store access;
5. malformed/wrong token denies before store access;
6. game-A token denies game-B path before store access;
7. the same missing/wrong/mismatched cases deny opening, turn, feedback, and CSA before provider/store mutation;
8. valid matching capability preserves existing opening/turn/feedback/CSA route behavior;
9. capability is not embedded in returned canonical context/turn state or persisted gameplay objects;
10. missing production signing secret fails closed rather than enabling bare-id access.

### Frontend/client
11. setup capability is retained keyed to its game id;
12. context/opening/turn/feedback/CSA requests carry the bearer header;
13. recovery polling uses the same credential path;
14. same-browser reload with game_id + stored capability can load normally;
15. game_id with no stored capability does not issue an unauthenticated protected request and produces a clear access-required failure;
16. capability is not appended to the visible URL.

Use narrow mocks/spies to prove denied calls do not reach store/provider. Do not build a security harness project.

## 8. Validation

Run only what this small correction needs:
- focused R3 game-capability/worker/client tests;
- directly affected existing R3 route/frontend tests;
- JS/MJS syntax checks for modified files;
- `git diff --check`.

Under the owner lean directive, do NOT run a broad full-repo suite unless this correction unexpectedly crosses a shared runtime boundary and focused evidence is insufficient. If a broader suite becomes necessary, explain why in terminal rather than creating another QA layer.

## 9. Forbidden in this task

Do NOT:
- provision/change Worker secrets;
- deploy/redeploy API or frontend;
- apply/edit/create migrations;
- change RLS/policies/grants/DB schema;
- mutate/create/reset/play any TEST game;
- touch Production;
- access preserved games;
- alter provider/model/config/timeouts;
- alter Story/Observer/reducer/CSA/feedback product behavior;
- rerun CSA7/9;
- add user accounts/login/OAuth/session service;
- add a generic auth/security framework;
- add bare-game-id legacy compatibility;
- put capability tokens in URLs/logs/Issue terminal evidence;
- overwrite CURRENT_TASK after execution.

## 10. Terminal report

Commit and push the source/test correction to `main`, then post one terminal comment to Issue #68 and STOP.

Expected success status:
`STATUS: WAITING_REVIEW_GAME_CAPABILITY_SOURCE_IMPLEMENTED_NOT_DEPLOYED`

If the minimal capability design cannot be implemented without a schema migration/account system or another material architecture change, STOP:
`STATUS: BLOCKED_GAME_CAPABILITY_DESIGN_BOUNDARY`

Terminal must include:
- Task ID and CURRENT_TASK blob;
- execution lease;
- start/final main SHA and source commit;
- exact changed paths;
- concise capability contract and credential transport (never token/secret values);
- proof all game-scoped routes reject missing/wrong/mismatched capabilities before store/provider access;
- proof valid capability preserves expected route behavior;
- frontend persistence/header/reload behavior;
- focused test counts + syntax/diff results;
- confirmation no secret provisioning/deploy/migration/RLS/grant/DB/game/Production/provider/CSA mutation occurred;
- any explicit follow-up deployment requirement, especially provisioning `R3_GAME_ACCESS_SECRET` in TEST before deploying the secured source.

Then STOP. Do not overwrite CURRENT_TASK or choose the next task.