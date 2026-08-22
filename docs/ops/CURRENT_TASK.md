# Company — CURRENT TASK

Status: READY
Task ID: company-r3-game-capability-test-rollout-v1
Mode: PROVISION TEST SECRET -> DEPLOY EXACT SECURED SOURCE -> BOUNDED LIVE ACCESS PROOF -> STOP
Updated: 2026-08-23 01:03 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/recovery branch, auth framework, compatibility layer, or competing execution authority.

## 0. Authority / accepted baseline

Binding authority:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- owner lean-development directives `5380380688` and `5380381500`;
- real exposure terminal `5381207635`;
- capability source terminal `5381298789`;
- operator source acceptance `5381316051`;
- accepted secured source `b511b35c3e294f77ecdffdcc2ad870c446a10e7b`;
- this exact CURRENT_TASK blob after registration.

Frozen product areas remain frozen:
- feedback revision behavior is TEST-accepted; do not invoke or modify it here;
- CSA rules 7/9 remain provider/model capability exceptions; do not sample/tune them;
- no Story/Observer/reducer/provider/model/config/timeout changes.

## 1. Purpose

Close the proven TEST Worker unauthorized game-context exposure by rolling out the already-reviewed per-game capability source and proving the real browser/API boundary once.

This is a bounded deployment/security acceptance task, not a new auth project.

Accepted source contract:
- public: `OPTIONS`, `GET /api/r3/catalogs`, `POST /api/r3/games`;
- protected by exact-game bearer capability: context, opening, turn, feedback, CSA and frontend reconnect/recovery calls;
- capability is stateless HMAC-SHA256 bound to game_id and signed by dedicated Worker secret `R3_GAME_ACCESS_SECRET`;
- no DB/schema/migration/RLS/grant change;
- no legacy bare-game-id bypass.

## 2. Preflight

Before mutation:
1. Re-read Issue #68 and this exact CURRENT_TASK; STOP if a competing owner/operator directive or active execution lease exists.
2. Verify main is executable-equivalent to exact source `b511b35c3e294f77ecdffdcc2ad870c446a10e7b` plus this docs-only registration only.
3. Verify TEST only. Do not access Production.
4. Verify the already-applied feedback migration ledger read-only; do not apply/reapply/edit any migration.
5. Re-run only the focused game-capability/directly affected tests if needed to ensure the local checkout matches accepted source. Do not broaden into a full-suite ritual.

If source identity or TEST target cannot be established, STOP before deployment.

## 3. Provision TEST capability secret

Provision exactly one dedicated high-entropy secret named:
`R3_GAME_ACCESS_SECRET`

Requirements:
- TEST API Worker only;
- generate using an appropriate cryptographically secure local/runtime mechanism;
- do not print, echo, commit, log, paste into Issue #68, or include the value in terminal evidence;
- do not reuse Supabase service-role, provider, model, or unrelated application secrets;
- after provisioning, verify only that the binding/secret name is present/usable, never reveal its value;
- do not provision/change any Production secret.

If secure provisioning cannot be completed without exposing the value, STOP `BLOCKED_GAME_CAPABILITY_SECRET_PROVISIONING`.

## 4. Exact TEST deployment

Deploy the accepted secured source exactly from `b511b35c3e294f77ecdffdcc2ad870c446a10e7b` to:
- TEST API `game-proxy-company-r3`;
- TEST frontend `gamebuilder-company-r3`.

Do not deploy unrelated source or Production.

Record new TEST API/frontend deployment/version identities. Verify API health/public catalog behavior after deployment.

No migration, schema, RLS, policy, grant, DB repair, reset, provider/model/config tuning, or content change is authorized.

## 5. Bounded live proof — one fresh disposable game

Create exactly one fresh disposable R3 game through the real deployed frontend after the secured deployment.

The frontend/browser must receive and persist its capability naturally from setup. Never expose the capability value in logs, screenshots, terminal comments, URLs, shell history, or artifacts intended for Issue #68.

### A. Valid-client path
Prove:
1. public catalogs load without game capability;
2. setup/create succeeds through frontend;
3. browser URL contains game_id but no capability/token;
4. immediate protected context succeeds through the frontend/client;
5. Opening completes through protected SSE with the same capability path;
6. refresh the same browser/game URL once and prove context reload succeeds from locally persisted exact-game capability;
7. after refresh the visible/canonical game state remains the same game and no duplicate Opening/turn is created.

Opening is sufficient to prove protected SSE transport. Do NOT submit an ordinary Turn unless Opening cannot provide the transport proof for a deterministic reason. If one Turn is genuinely necessary, use exactly one simple human-like ordinary action and no retry/regeneration.

### B. Negative access proof
Using safe read/nonmutating requests only, prove against protected endpoints:
1. fresh game context with no Authorization -> generic 401, no protected data;
2. fresh game context with malformed bearer -> generic 401, no protected data;
3. fresh game context with a syntactically valid but wrong token -> generic 401, no protected data;
4. use the fresh game's valid capability against one different known existing TEST game_id -> generic 401, no protected data.

For item 4, do not read/mutate the other game's data with a valid credential; only perform the deliberately mismatched capability request. Do not access preserved/manual/Production games.

Do not post token values. Evidence should contain only status/classification and bounded route identity.

### C. Public boundary
Also prove:
- `GET /api/r3/catalogs` remains public;
- `POST /api/r3/games` remains public but requires the server secret internally and returns a capability only to the creating response;
- capability does not appear in subsequent canonical context/game/state/turn payloads.

## 6. Frontend/browser acceptance

Focused browser acceptance only:
- new game creation works normally;
- game page opens without token in visible URL;
- same-browser refresh works;
- protected requests carry Authorization internally;
- a bare `?game_id=...` opened in a clean/no-capability client fails clearly as access-required and does not make an unauthenticated protected request from the thin client;
- no capability text appears in UI/status/console output captured for evidence.

Do not add compatibility for old bare game URLs. Existing old TEST games remain data-preserved.

## 7. Security classification

GREEN only if all agree:
- exact secured API/frontend are deployed to TEST;
- valid fresh-game capability permits the intended protected flow;
- missing/malformed/wrong/cross-game capability is denied with generic 401 and no protected context;
- same-browser refresh preserves access without token in URL;
- public catalog/setup remain functional;
- capability is absent from canonical gameplay payloads;
- no migration/RLS/grant/schema change was needed.

If a protected route still returns data without the correct capability, STOP immediately as `BLOCKED_GAME_CAPABILITY_TEST_EXPOSURE_REMAINS` and report the exact narrow route. Do not patch in the same task.

If valid clients fail because of a deterministic source/transport defect, STOP `BLOCKED_GAME_CAPABILITY_TEST_VALID_CLIENT` with exact evidence. Do not self-authorize a source patch.

## 8. Forbidden

Do NOT:
- touch Production or Production secrets;
- apply/edit/create/revert migrations;
- change RLS/policies/grants/schema;
- modify source/runtime/frontend/tests/content/config/provider/model/timeouts during rollout;
- invoke feedback;
- invoke CSA or rerun CSA7/9;
- access/reset/mutate preserved/manual games;
- run long gameplay campaigns;
- add auth/account/session framework;
- add token exchange/recovery-by-game-id compatibility;
- expose token/secret values in Issue comments, logs, URLs, committed files, or evidence;
- create another CURRENT_TASK file or ops branch;
- overwrite CURRENT_TASK after execution.

## 9. Terminal

Post exactly one terminal comment to Issue #68 and STOP.

Success:
`STATUS: COMPLETE_GAME_CAPABILITY_TEST_GREEN`

Secret provisioning blocker:
`STATUS: BLOCKED_GAME_CAPABILITY_SECRET_PROVISIONING`

Remaining unauthorized exposure:
`STATUS: BLOCKED_GAME_CAPABILITY_TEST_EXPOSURE_REMAINS`

Valid-client/source transport blocker:
`STATUS: BLOCKED_GAME_CAPABILITY_TEST_VALID_CLIENT`

Terminal must include:
- Task ID/current task blob/execution lease;
- start/final main SHA and accepted source SHA;
- confirmation dedicated TEST secret was provisioned without revealing its value;
- TEST API/frontend deployment identities;
- fresh disposable game ID is allowed, but NEVER capability/token/secret value;
- public catalog/setup result;
- valid context/Opening/refresh result;
- no-auth/malformed/wrong/cross-game negative status results;
- whether an ordinary Turn was needed (normally no);
- confirmation capability absent from URL and canonical context payloads;
- confirmation no source/migration/RLS/grant/schema/Production/provider/CSA/feedback mutation occurred;
- final classification.

Then STOP. Do not overwrite CURRENT_TASK or choose the next task.