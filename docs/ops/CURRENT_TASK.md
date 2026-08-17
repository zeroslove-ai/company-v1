# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: frontend-smoke-asset-canon-reconciliation-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

## Purpose

Repair only the stale read-only frontend smoke harness that blocked `test-runtime-live-acceptance-v3` after the current-main frontend was successfully deployed once. Independent operator review shows the deployed frontend failure was not a runtime asset omission: `scripts/smoke-frontend-worker.mjs` still hardcodes `/narrative.js`, while current main has no `src/frontend/pages/narrative.js`, no repository reference to `narrative.js`, and current `index.html` does not load it. Reconcile the smoke to the actual current frontend asset/module graph, prove the already-deployed TEST frontend passes the corrected smoke exactly once, then STOP for review. Do not redeploy or run gameplay.

## 0. Frozen authority

- Repository: `zeroslove-ai/company-v1`
- Expected `origin/main`: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Previous task: `test-runtime-live-acceptance-v3`
- Previous STARTED comment: `5319659300`
- Previous terminal comment: `5319673380`
- Previous terminal: `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V3`
- Previous final SHA: `4422eb97cb612b6dc19101bacd5a10bba7154cbb`
- Previous final CURRENT_TASK blob: `60dcf206c296cce0dd74a0c25794504e56b7d8bd`
- TEST Supabase: `fmcrspgxstsmxxsmkeee`
- API Worker: `game-proxy-company-v1`
- Accepted API version: `2a976491-451d-4fc8-8808-65353cad137b`
- Frontend Worker: `gamebuilder-company-v1`
- Already-deployed frontend version from the blocked terminal: `d3c1bb47-e779-431e-a0ac-98eb513561c6`
- Frontend URL: `https://gamebuilder-company-v1.zeroslove.workers.dev`
- Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- Preserved/manual game — do not touch: `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA game — do not touch: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`
- Protected sentinel/default fallback — do not mutate: `11111111-1111-4111-8111-111111111111`
- Production infrastructure: forbidden

Accepted TEST state remains:
- migration rows `27`;
- target migration `20260817000200` absent;
- bridge canonical `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`;
- forensic canonical `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`;
- protected sentinel turns/actions/save-turn/data-turn `18/18/18/18`;
- disposable `11/12/11/11`;
- preserved/manual `7/9/7/7`;
- QA `7/7/7/7`.

Independent operator root-cause evidence:
- current `scripts/smoke-frontend-worker.mjs` has a hardcoded `assetPaths` entry `/narrative.js`;
- current main `src/frontend/pages/**` contains no `narrative.js` file;
- repository search finds no current `narrative.js` reference;
- current main `index.html` loads `app.js`, `relationship-icons.js`, `history-tools.js`, `csa-product-ui.js`, `boot-guard.js`, `hospital-scroll.js` plus the current CSS set, and does not reference `narrative.js`;
- the blocked frontend smoke failed exactly on `/narrative.js` with HTTP 404 after a successful single deployment;
- therefore the observed 404 is a stale smoke-manifest failure, not evidence of a missing current runtime dependency.

## 1. Mandatory start freeze

Before editing:
1. fresh-fetch and require `origin/main` exactly the SHA above;
2. require this branch to descend directly from previous final `4422eb97cb612b6dc19101bacd5a10bba7154cbb`, with only this registration commit before execution;
3. re-read terminal `5319673380`, current `scripts/smoke-frontend-worker.mjs`, current main `src/frontend/pages/index.html`, `app.js`, and the `src/frontend/pages/**` file inventory;
4. prove `narrative.js` is absent from the current frontend runtime tree and not referenced by current frontend source;
5. fresh-read TEST migration/game safety snapshot and require no unexpected mutation since the blocked terminal;
6. verify the current frontend Worker is still version `d3c1bb47-e779-431e-a0ac-98eb513561c6` if available tooling can prove it. If version metadata cannot be independently queried, record that limitation; do not redeploy merely to obtain evidence;
7. prove no reset/live gameplay/API redeploy/frontend redeploy occurred after terminal `5319673380` from available durable evidence.

Any unrelated runtime/DB/environment drift: STOP `FRONTEND_SMOKE_ASSET_CANON_RECONCILIATION_BLOCKED` without source change.

## 2. Allowed repository scope

After registration, only these files may change:
- `scripts/smoke-frontend-worker.mjs`
- one narrowly-scoped regression test under `test/**` (prefer `test/frontend-smoke-contract.test.mjs` if new)
- `docs/ops/CURRENT_TASK.md` lifecycle evidence

Do not modify frontend runtime/assets, API/engine, content/catalog, Wrangler configs, migrations, package/lock/workflows, DB contract gates, provider/model/TTS/bindings, or unrelated tests/docs.

## 3. Required frontend smoke correction

The smoke must validate the frontend that the current HTML/module graph actually requires. Do not maintain a detached historical asset list that can demand deleted files.

### 3.1 Remove stale `narrative.js` authority

- `/narrative.js` must not be a required smoke asset unless the current deployed HTML/module graph actually references it.
- Do not create a placeholder `narrative.js` merely to satisfy smoke.
- Do not edit frontend imports/runtime to resurrect the file.

### 3.2 Make deployed HTML the direct-asset root

After fetching `/` and validating the existing structural HTML markers:
- discover same-origin stylesheet assets declared by `<link rel="stylesheet" href="...">`;
- discover same-origin module entrypoints declared by `<script type="module" src="...">`;
- normalize relative paths safely against the frontend origin;
- require every discovered direct asset to return HTTP 200;
- reject malformed/unsupported paths cleanly rather than silently skipping a required current asset.

The current direct asset set must therefore be proven from deployed HTML rather than a stale hand-maintained list.

## 8. Execution evidence — 2026-08-18

- Execution lease: Issue #68 comment `5319786053`.
- Start SHA: `72ebfbea24798f4cb3962c7d0adfaeff1d71746a`.
- Reviewed runtime/main baseline: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`.
- Changed repository files: `scripts/smoke-frontend-worker.mjs`,
  `test/frontend-smoke-contract.test.mjs`, and this lifecycle file only.
- Old smoke contract: a detached hardcoded asset list including deleted
  `/narrative.js`, plus a protected-sentinel config marker requirement.
- New smoke contract: deployed HTML stylesheet/module references are the
  direct-asset root; same-origin relative ES-module imports are followed
  transitively with visited-set cycle/duplicate protection; Company HTML/API
  markers and credential rejection remain fail-closed; the sentinel UUID is
  not a health marker.
- Focused regression: `node --test test/frontend-smoke-contract.test.mjs`
  — 9/9 passed.
- Full regression: `npm.cmd test` — 338/338 passed.
- Syntax/diff checks: both changed JS/MJS `node --check` commands passed;
  `git diff --check` passed.
- Read-only contract preflight: action Stage B and scene Stage B gates passed;
  `origin/main` remained frozen at `8f3c5326...`; current frontend remained
  deployed as `d3c1bb47-e779-431e-a0ac-98eb513561c6`; API remained
  `2a976491-451d-4fc8-8808-65353cad137b`.
- Corrected remote frontend smoke: invoked exactly once against
  `https://gamebuilder-company-v1.zeroslove.workers.dev` and passed.
  Discovered direct assets: 15. Reachable modules: 21 — `/app.js`,
  `/relationship-icons.js`, `/history-tools.js`, `/csa-product-ui.js`,
  `/boot-guard.js`, `/hospital-scroll.js`, `/api.js`, `/catalogs.js`,
  `/csa-app.js`, `/config.js`, `/render.js`, `/setup.js`, `/sse.js`,
  `/state.js`, `/utility-ui.js`, `/tts.js`, `/view-model.js`,
  `/turn-phase.js`, `/company-map.js`, `/hospital-mobile.js`, and
  `/loading-overlay.js`. No `/narrative.js` request occurred.
- TEST read-only invariants were identical before/after smoke: migration rows
  `27`; target `20260817000200` absent; bridge canonical
  `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`;
  forensic canonical
  `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`;
  protected `18/18/18/18`; disposable `11/12/11/11`; preserved/manual
  `7/9/7/7`; QA `7/7/7/7`.
- Safety counts: frontend/API redeploy `0`; TEST reset/live gameplay/provider
  turn `0`; DB/schema/migration/history writes `0`; Production access/change
  `0`; protected/preserved/QA mutation `0`.

### 3.3 Validate current ES-module dependency closure

For fetched same-origin JavaScript module entrypoints:
- follow static relative imports (`./...` and `../...`) transitively with a visited set;
- require each resolved same-origin imported module to return HTTP 200;
- do not follow bare package specifiers or external origins as if they were Worker static assets;
- keep this as availability/graph validation only; do not execute frontend code or invent a second runtime/parser.

This must naturally cover current modules such as `config.js`, `api.js`, `sse.js`, `state.js`, `render.js` only when they are actually reachable from the current module graph.

### 3.4 Preserve meaningful public-config checks

When the current module graph reaches `config.js`, keep strict checks that:
- it identifies Company v1;
- it points to `game-proxy-company-v1.zeroslove.workers.dev`;
- it contains no service-role/API key/Bearer credential marker.

Do not make the protected sentinel UUID a required health marker. Its current presence is a product fallback detail, not frontend asset-health authority, and future safe removal must not make smoke fail for an unrelated reason.

Do not weaken the smoke to only fetch `/` or only check HTTP 200. It must still prove the current HTML structure, direct asset availability, current module dependency availability, Company API binding, and absence of obvious credential leakage.

## 4. Regression requirements

Add focused behavior tests proving at least:
1. current-style HTML with its direct stylesheet/module assets passes;
2. no request is made to `/narrative.js` when the HTML/module graph does not reference it;
3. a missing HTML-declared direct asset fails with a precise endpoint/status/code;
4. a missing relative module dependency fails;
5. transitive relative imports are followed once without loops/duplicate fetch explosion;
6. external/bare imports are not mistaken for same-origin static assets;
7. required Company HTML markers still fail closed when absent;
8. `config.js` wrong edition/API binding fails;
9. credential markers in public config still fail;
10. source no longer contains `/narrative.js` as a hardcoded required smoke fixture.

Prefer behavior tests over source-text-only assertions. Minimal refactoring/export of smoke helpers is allowed inside `scripts/smoke-frontend-worker.mjs`; do not create a second semantic smoke implementation.

Run focused tests, then full `npm test`; require 0 failures. Run `node --check scripts/smoke-frontend-worker.mjs` and changed test files plus `git diff --check`.

## 5. Read-only remote proof

Only after source/test correction and all local tests pass:
1. do **not** redeploy frontend or API;
2. run the corrected frontend smoke exactly once against `https://gamebuilder-company-v1.zeroslove.workers.dev`;
3. require root HTML, every current HTML-declared local asset, the reachable local module dependency closure, and config checks to PASS;
4. record the discovered direct asset count and reachable module count/paths without dumping secrets;
5. re-read TEST migration/game snapshot afterward and prove the smoke caused no gameplay/DB mutation;
6. if any remote asset/module fails or evidence is ambiguous, STOP blocked. No smoke retry and no redeploy-to-pass.

## 6. Hard prohibitions

- frontend redeploy: forbidden;
- API redeploy: forbidden;
- TEST reset/live gameplay/provider turn: forbidden;
- DB/schema/DDL/DML/history write: forbidden;
- migration apply/push/repair/history mutation: forbidden;
- Production infrastructure access/change: forbidden;
- hospital/v2 access: forbidden;
- frontend/API/runtime/engine/content/config behavior changes: forbidden;
- provider/model/TTS/binding changes: forbidden;
- protected/preserved/QA game mutation: forbidden;
- gate weakening/skipping: forbidden;
- Cut 3: forbidden.

## 7. Terminal classification

Choose exactly one:

### `FRONTEND_SMOKE_ASSET_CANON_RECONCILED`
Only if the stale detached asset requirement is replaced by current HTML/module-graph validation, focused/full tests pass, exactly one corrected read-only smoke against the already-deployed frontend passes, TEST game/migration state remains unchanged, and no forbidden operation occurred.

### `FRONTEND_SMOKE_ASSET_CANON_RECONCILIATION_BLOCKED`
Use for any remaining frontend asset/module mismatch, inability to prove current graph coherently, test failure, unexpected deployment/runtime drift, corrected remote smoke failure, or scope drift.

At terminal:
1. set CURRENT_TASK `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal containing registration/final SHA/blob, changed files, old-vs-new smoke contract, focused/full test counts, exact corrected remote smoke result/discovered asset graph summary, TEST pre/post invariants, deploy/reset/gameplay/write counts, and terminal classification;
3. STOP. Do not resume live acceptance, redeploy, run gameplay, or create the next task/Cut.
