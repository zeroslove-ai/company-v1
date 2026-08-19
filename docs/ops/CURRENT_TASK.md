# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-clean-vertical-slice-v1
Mode: CORRECTION ROUND 2 — DEPLOYMENT BOUNDARY
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

This is still the SAME Phase 1 task, implementation branch, and Draft PR. It is not a new feature cut.

- canonical Draft PR: `#87`
- implementation branch: `company-v2/phase1-clean-vertical-slice-v1`
- prior correction terminal: Issue #68 comment `5339063880`
- operator review: Issue #68 comment `5339137010` — `CHANGES_REQUIRED_DEPLOYMENT_BOUNDARY`
- reviewed head before this correction: `3fbe8b5885965972e01710ffb739c2fb035890ca`
- exact-head CI already reviewed: run `32229152718` SUCCESS

All v1/manual/QA/evidence games, especially `df3045fd-c359-4cdc-8783-357ddfebe398`, remain READ-ONLY.

Do not create a replacement PR, implementation branch, or task ID.

## 1. Keep the accepted correction

Do not regress the already accepted Phase 1 corrections:

- production/default Worker uses `SupabaseV2Store` from env;
- `InMemoryV2Store` is test injection only;
- real env-configured Story/Observation provider is the production/default path;
- no deterministic provider fallback in production;
- one server-owned `/api/v2/turn` operation;
- durable processing Story progress and reconstructed-worker same-job readback;
- explicit retry only after terminal failed status on the same `(game_id, turn_number)` row;
- exactly one canonical job row per game+turn;
- literal player action fidelity;
- exactly four provider-authored choices;
- optional Observation fail-open with bounded summary fallback;
- minimal scene/time state and relevant-only Mind Monitor;
- no old Story/Extract/Commit client state machine;
- no Phase 2/3 mechanics.

## 2. Remaining blocker — separately deployed frontend cannot reach API

Current reviewed defect:

- `frontend-v2/app.js` calls `/api/v2/...` only as same-origin relative paths;
- binding canon §17 prefers separate TEST identities:
  - API `game-proxy-company-v2`
  - Frontend `gamebuilder-company-v2`;
- a static frontend deployed as `gamebuilder-company-v2` therefore sends `/api/v2/...` to the frontend asset worker rather than the API Worker;
- the API currently returns a bare `OPTIONS 204`, so an absolute cross-origin JSON POST would fail browser CORS preflight.

Phase 1 is not accepted until the source tree is genuinely deployable with the intended isolated v2 identities.

## 3. Frontend v2 API boundary

Implement one explicit v2 frontend API-base configuration.

Requirements:

- frontend-v2 must construct all API requests from one explicit API base;
- TEST/default build target may point to `https://game-proxy-company-v2.zeroslove.workers.dev`;
- do not point v2 frontend at `game-proxy-company-v1`;
- do not duplicate API URLs across multiple call sites;
- keep `game_id` query handling and same-job reconnect behavior unchanged;
- no service worker, proxy workflow, or new client stage machine.

A tiny `frontend-v2/config.js` or equivalent single-source constant is preferred.

## 4. Browser-valid CORS on v2 API

Make separate-origin frontend → API requests valid.

At minimum:

- `OPTIONS` returns the required CORS headers;
- allow origin for the intended TEST frontend or `*` for this isolated TEST-only Phase 1 if kept consistent with existing responses;
- allow methods needed by Phase 1 (`GET`, `POST`, `OPTIONS`);
- allow request header `content-type`;
- JSON success/error responses and SSE responses keep compatible CORS headers;
- no credential/cookie authority is introduced.

Add a focused contract test that simulates browser preflight for `POST /api/v2/turn` and proves the required headers are present.

## 5. Dedicated v2 deployment configs

Add source-controlled, isolated deployment configs so rollout does not need to mutate or repurpose v1 Worker identities.

Preferred files:

- `wrangler.v2.api.jsonc`
- `wrangler.v2.frontend.jsonc`

API config requirements:

- name: `game-proxy-company-v2`
- main: `runtime-v2/server/worker.js`
- same compatibility-date class as current Company worker unless a concrete v2 requirement proves otherwise;
- TEST `SUPABASE_URL` remains the existing Company TEST project;
- provider endpoint remains the repository's currently configured provider;
- preserve configured model roles; no provider/model change;
- required secrets remain service role DB key and LLM API key;
- no TTS/image/service bindings in Phase 1.

Frontend config requirements:

- name: `gamebuilder-company-v2`
- static assets directory: `frontend-v2`
- no v1 frontend files bundled.

Do not alter `wrangler.api.jsonc` or `wrangler.frontend.jsonc` for v1 unless strictly necessary; prefer new isolated files.

Run `wrangler deploy --dry-run` or the repository-equivalent dry-run for BOTH v2 configs. Do not deploy live in this source task.

## 6. Preserve current model roles

The current repository env contract distinguishes:

- `STORY_MODEL`
- `EXTRACT_MODEL`

Current TEST happens to configure both as `deepseek-v4-flash`, but the v2 source must not silently collapse the two roles.

Required:

- Story request uses `STORY_MODEL`;
- Observation request uses the existing observation/extract-model env role `EXTRACT_MODEL`;
- both use the existing `LLM_API_URL` + `LLM_API_KEY` provider transport;
- do not hardcode a different model/provider;
- if either required model env is missing, production v2 must fail configuration clearly.

This is role preservation, not reuse of old Extract schema/runtime.

## 7. Required focused tests

Add/adjust compact tests proving:

1. frontend-v2 has one explicit v2 API base and does not use the v1 API identity;
2. separately hosted frontend constructs API requests against the v2 API base;
3. POST JSON preflight succeeds with required CORS origin/method/header response fields;
4. JSON success/error and SSE responses remain CORS-compatible;
5. `wrangler.v2.api.jsonc` targets only `game-proxy-company-v2` + `runtime-v2/server/worker.js`;
6. `wrangler.v2.frontend.jsonc` targets only `gamebuilder-company-v2` + `frontend-v2`;
7. both v2 configs dry-run successfully;
8. Story uses `STORY_MODEL`; Observation uses `EXTRACT_MODEL`;
9. no v1 runtime/frontend orchestration imports appear;
10. all prior DB/reconnect/retry invariants continue to pass.

Do not port old v1 gameplay tests.

## 8. Safety / forbidden

This remains source/test/PR only.

Do NOT:

- apply any migration;
- deploy either v2 Worker;
- create/play a live v2 game;
- mutate/reset/reseed/replay any v1 evidence game;
- access Production/hospital-v2;
- change provider or configured model values;
- merge PR #87;
- create another PR/branch/task;
- start CSA/clothing/navigation/Image/TTS/feedback/sexual meter or any Phase 2/3 work.

## 9. Validation / terminal

Before terminal require:

- focused v2 tests: 0 fail / 0 skip;
- full repository tests: 0 fail;
- changed JS/MJS `node --check`: PASS;
- `git diff --check`: PASS;
- BOTH dedicated v2 wrangler dry-runs: PASS;
- exact-head GitHub CI: SUCCESS;
- PR #87 remains OPEN / DRAFT / UNMERGED / mergeable;
- branch copy of `docs/ops/CURRENT_TASK.md` is synchronized with the current main registration and does not create an obsolete ops conflict;
- zero migration apply/deploy/live game/Production/preserved-game mutation.

Post one new immutable Issue #68 terminal:

`COMPANY_V2_PHASE1_DEPLOYMENT_BOUNDARY_READY_FOR_REVIEW`

Include:

- exact final head
- previous review `5339137010`
- PR #87
- focused/full counts
- exact-head CI run/job
- both wrangler dry-run results
- changed paths
- proof of frontend API base, CORS preflight, v2 Worker identities, STORY_MODEL/EXTRACT_MODEL role preservation
- confirmation of zero live operations

Then STOP. Do not generate the rollout task.