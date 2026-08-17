# Company v1 — CURRENT TASK

Status: READY
Task ID: extract-scene-evidence-test-api-deploy-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

## Purpose

Deploy the accepted Extract scene-evidence round-trip runtime repair to the Company TEST API exactly once, verify the deployed API with the corrected read-only API smoke, prove TEST data remains unchanged, and STOP for review. This is deployment verification only. Do not resume/retry the stuck turn-6 action, reset a game, run gameplay/provider turns, deploy frontend, merge, or start Cut 3.

## 0. Frozen authority

- Repository: `zeroslove-ai/company-v1`
- Expected `origin/main`: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Previous task: `extract-scene-evidence-roundtrip-reconciliation-v1`
- Previous STARTED: Issue #68 comment `5320196241`
- Previous terminal: Issue #68 comment `5320266879`
- Previous classification: `EXTRACT_SCENE_EVIDENCE_ROUNDTRIP_RECONCILED`
- Previous final SHA: `d8fbc5cca47b62e897adc73afc816812f736316b`
- Previous final CURRENT_TASK blob: `49314240b700eead8c3996368cb6a2aba683589a`
- Expected branch: `company/extract-scene-evidence-test-api-deploy-v1`
- TEST Supabase: `fmcrspgxstsmxxsmkeee`
- API Worker: `game-proxy-company-v1`
- API URL: `https://game-proxy-company-v1.zeroslove.workers.dev`
- Previously accepted API version: `2a976491-451d-4fc8-8808-65353cad137b`
- Frontend Worker: `gamebuilder-company-v1`
- Frontend version to remain untouched: `d3c1bb47-e779-431e-a0ac-98eb513561c6`
- Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- Preserved/manual game: `78fb1d94-266f-455a-bda4-7656cc2370c1` — do not mutate
- QA game: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f` — do not mutate
- Protected sentinel: `11111111-1111-4111-8111-111111111111` — do not mutate
- Failed disposable action: `72cc2486-cc80-408c-9d86-8196cab7b6ad` — forensic evidence only; do not retry/repair/complete
- Production and hospital/v2: forbidden

Accepted repair facts from terminal `5320266879` and operator review:
- current Fresh V2 has no `scene_id`;
- current `kind:"scene"` evidence requires exact Story quote plus location matching `scene_observation.location_id`;
- current persisted V2 is deterministically separated from historical V2 compatibility;
- historical V2 with legacy `scene_id` remains readable on the historical path;
- Commit still re-reads persisted Extract through `normalizePersistedExtractObservation()`; no bypass/fallback was added;
- focused Extract tests `8/8 PASS`; full regression `342/342 PASS`; syntax/diff PASS;
- repair task performed zero deploy/gameplay/reset/DB writes/Production/hospital access.

Accepted TEST snapshot:
- migrations `27`; target `20260817000200` absent;
- disposable `save/turns/actions/committed_turn = 1/5/6/5`;
- preserved/manual `1/7/9/7`;
- QA `1/7/7/7`;
- protected sentinel `1/18/18/18`;
- failed action remains `processing_status=committing`, `expected_turn=6`, no durable turn 6.

## 1. Mandatory preflight — read-only

Before any deployment:
1. fresh-fetch and require `origin/main` exactly `8f3c5326e483650211fbc6c9f54a7527d2278d4e`;
2. require this branch to descend directly from accepted final `d8fbc5cca47b62e897adc73afc816812f736316b` with only this CURRENT_TASK registration commit before execution;
3. fresh-read terminal `5320266879` and verify previous final SHA/blob;
4. prove runtime delta from `origin/main` contains only the reviewed Extract/persisted-read repair lineage plus previously accepted ops/test harness repairs; no unrelated runtime/config/content/package/workflow drift;
5. inspect current HEAD for:
   - `src/engine/runtime-core/extract-observation.js`
   - `src/engine/runtime-core/persisted-extract-observation.js`
   - `test/extract-observation-contract.test.mjs`
   - `scripts/smoke-api-worker.mjs`;
6. require the accepted current-vs-historical V2 boundary and exact quote/location fail-closed behavior unchanged;
7. run focused Extract contract tests and full `npm.cmd test`; require zero failures;
8. run `node --check` on changed JS/MJS files and `git diff --check`; require PASS;
9. run corrected action Stage B and scene Stage B DB gates read-only; require PASS;
10. fresh-read TEST migration/game counts and require exactly the accepted snapshot above;
11. require failed action `72cc2486-...` unchanged and no durable turn 6;
12. record currently deployed Worker identities/versions where tooling exposes them. Lack of metadata is not authorization to redeploy for proof.

Any mismatch or ambiguity => terminal `EXTRACT_SCENE_EVIDENCE_TEST_API_DEPLOY_BLOCKED`, deployment count `0`, STOP.

## 2. Exactly one TEST API deploy

Only after all preflight checks pass:
- deploy API Worker `game-proxy-company-v1` exactly once from this branch/HEAD using the repository's normal Company TEST deployment path;
- deployed runtime must include accepted repair final `d8fbc5cca47b62e897adc73afc816812f736316b`; this registration/lifecycle doc is non-runtime;
- record resulting API Worker version/deployment evidence;
- frontend deployment count must remain `0`;
- no second API deployment or retry-to-pass is authorized.

If deployment fails or identity/version is ambiguous, STOP blocked without another deploy.

## 3. Post-deploy verification — read-only only

After the one successful API deploy:
1. run corrected API smoke exactly once:
   `node scripts/smoke-api-worker.mjs https://game-proxy-company-v1.zeroslove.workers.dev 2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
2. require `/health`, `/api/version`, `/api/context` PASS and final `REMOTE API SMOKE PASSED`;
3. frontend smoke is not required because frontend is unchanged; default frontend smoke count `0`;
4. fresh-read TEST and require migrations `27`, target absent, disposable `1/5/6/5`, preserved `1/7/9/7`, QA `1/7/7/7`, sentinel `1/18/18/18`;
5. failed action must remain `committing`, expected turn `6`, with no durable turn 6;
6. record counts: API deploy `1`; frontend deploy `0`; reset `0`; gameplay/provider turn `0`; DB/schema/migration/history write `0`; Production/hospital `0`.

Do not interpret API smoke as repaired Commit-path live acceptance. No gameplay is authorized here. The next owner-reviewed task will run a fresh disposable-game acceptance session.

## 4. Repository scope

After registration, repository changes are limited to `docs/ops/CURRENT_TASK.md` lifecycle/terminal evidence only.

Forbidden:
- any runtime/engine/API/frontend/content/config/script/test/package/workflow patch;
- migration/schema/RPC change;
- provider/model/TTS/binding change;
- gate/smoke weakening;
- PR/merge/Cut3.

If any new defect appears, preserve exact evidence and STOP blocked. Do not patch it in this deployment task.

## 5. Hard prohibitions

- more than one API deploy;
- any frontend deploy;
- reset;
- gameplay/provider Story/Extract/Commit turn;
- retry/repair/complete stuck action `72cc2486-...`;
- direct gameplay DML;
- DB/schema/migration/history write;
- migration apply/push/repair;
- protected/preserved/QA/sentinel mutation;
- Production or hospital/v2 access/change;
- Cut3 or unrelated work.

## 6. Terminal classification

Choose exactly one:

### `EXTRACT_SCENE_EVIDENCE_TEST_API_DEPLOYED`
Only if preflight/tests/gates pass, exactly one API deploy succeeds, corrected API smoke runs exactly once and passes, TEST DB/game counts remain unchanged, failed action remains untouched, frontend deploy/reset/gameplay/DB write/Production/hospital counts remain zero.

### `EXTRACT_SCENE_EVIDENCE_TEST_API_DEPLOY_BLOCKED`
Use for any preflight, deployment, smoke, identity, DB invariant, safety or scope failure. No retry/deploy/patch after the first failure.

At terminal:
1. set CURRENT_TASK `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal containing registration/final SHA/blob, preflight/tests/gates, pre/post API version, deployment count, smoke invocation/result/count, TEST pre/post snapshots, failed-action status, frontend/reset/gameplay/DB/safety counts, and terminal classification;
3. STOP. Do not resume gameplay, merge, create another task, or start Cut3.
