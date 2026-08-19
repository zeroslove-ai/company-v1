# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-supabase-fetch-binding-v1
Mode: SOURCE CORRECTION — SUPABASE FETCH BINDING
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority / accepted live state

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Accepted Phase 1 runtime source:

- original source merge: `f80830e48f227e5a3718ecacaec82d9d3427b504`
- ACL correction merge: `ebdf1529dd05b7feafbb5857ffde1eb6e3e30617`
- rollout-resume BLOCKED terminal: Issue #68 comment `5340154630`
- operator BLOCKED review: Issue #68 comment `5340209458`

TEST live state that MUST be preserved:

- Supabase project: `fmcrspgxstsmxxsmkeee`
- migrations `20260819000200`, `20260819000300`, `20260819000400`, `20260819000500` are already applied exactly once and are historical applied migrations
- live v2 ACL/PK/fenced-RPC gate passed before deployment
- API Worker: `game-proxy-company-v2`, reported final deployed version `83569011-ecf9-4e61-8e42-50d26ef27f46`
- Frontend Worker: `gamebuilder-company-v2`, reported deployed version `cdbd6c10-0193-487e-a390-2c120946bfdd`
- first fresh Setup attempt failed before creating a game
- live `company_v2_games` count after failure: `0`
- `/api/v2/opening` was not called
- `/api/v2/turn` was called `0` times

All preserved v1/manual/QA/evidence games remain READ-ONLY. Production/hospital-v2 is forbidden.

## 1. Proven defect

The first live `POST /api/v2/setup` returned HTTP 422 with:

`Illegal invocation: function called with incorrect this reference`

Source inspection identifies the narrow receiver bug in:

`runtime-v2/server/supabase-store.js`

`V2SupabaseHttp` stores the injected/global fetch function as `this.fetchImpl`, and `request()` currently invokes it using a property-call shape equivalent to:

`this.fetchImpl(url, init)`

For the native Cloudflare Workers fetch, this supplies the `V2SupabaseHttp` instance as the JavaScript receiver and triggers illegal invocation. The v2 provider already invokes its lexical `fetchImpl(...)` directly and does not exhibit this receiver shape.

The previous invalid-context smoke did not catch this because missing `game_id` was rejected before Supabase transport execution.

This is NOT an ACL, migration, provider/model, Story/Observation, content, frontend, or DB-contract defect.

## 2. Goal

Make the Supabase HTTP transport invoke injected/global fetch in a receiver-neutral way so the native Cloudflare fetch works during Setup and all existing injected test fetches continue to work.

Keep the correction minimal. Do not redesign the transport and do not add retries, wrappers, adapters, gateways, or compatibility layers beyond the smallest local call-shape fix needed for correct invocation.

## 3. Implementation branch / PR

Create exactly one narrow implementation branch from current `main`:

`company-v2/phase1-supabase-fetch-binding-v1`

Create exactly one Draft PR targeting `main`.

Do not create an ops branch. Do not create another CURRENT_TASK file. Do not reopen PR #87 or #88.

Before implementation, synchronize the branch copy of this existing `docs/ops/CURRENT_TASK.md` to the exact main registration and do not mutate CURRENT_TASK again on the implementation branch.

## 4. Required source correction

Primary expected changed runtime file:

`runtime-v2/server/supabase-store.js`

Requirements:

1. Preserve `fetchImpl` dependency injection.
2. Invoke the stored fetch function without binding the `V2SupabaseHttp` instance as its receiver.
3. The production/native global fetch path must use the same receiver-neutral behavior as a direct lexical function call.
4. Do not bind native fetch to an arbitrary custom object.
5. Do not change Supabase URL construction, headers, RPC/table routes, response/error parsing, store API, DB RPC names, retry behavior, fencing, lease behavior, or state semantics.
6. Do not change `runtime-v2/server/provider.js`; its lexical fetch invocation is already the correct comparison behavior unless an unavoidable test-only import adjustment is required. No provider behavior change is authorized.
7. Do not change frontend, migrations, Worker config values, prompts, models, content, or Phase 1 domain contracts.

A minimal pattern such as copying the function reference to a local variable before invocation is acceptable if it preserves injection and passes the behavioral regression. Implement behavior, not unnecessary abstraction.

## 5. Required regression proof

Add the smallest focused regression in the existing v2 Phase 1 test surface, normally:

`test/company-v2-phase1.test.mjs`

The regression must be behavioral, not only source-regex proof.

At minimum prove:

1. inject a receiver-sensitive fetch test double into `SupabaseV2Store` that deliberately fails if it is called with a non-neutral object receiver;
2. exercise a public store path that reaches the Supabase transport — preferably `createGame()` through the create-game RPC and required context reads, not an exported test-only internal helper;
3. before the fix the old method-call shape would reproduce the same `Illegal invocation` class of failure;
4. after the fix the injected fetch is invoked receiver-neutrally and the store path completes with expected mocked responses;
5. existing injected fetch tests and all existing Phase 1 tests remain green;
6. no automatic retry or duplicate DB request is introduced by the correction.

Do not export `V2SupabaseHttp` solely to make the test easier unless there is no reasonable public-store behavioral test. Prefer testing the public `SupabaseV2Store` contract.

## 6. Scope / forbidden

This task is source/test/PR only.

Do NOT:

- apply or edit any migration, especially already-live 002/003/004/005;
- write to TEST DB;
- deploy either v2 Worker;
- retry Setup or create any live game;
- call Opening or `/api/v2/turn`;
- touch v1 Workers or preserved games;
- access Production/hospital-v2;
- change `SUPABASE_URL`, provider URL, models, secrets, prompts, content, CORS, or frontend API base;
- add retries/regeneration;
- add a new database abstraction, transport framework, semantic verifier/router, or compatibility path;
- start Phase 2;
- merge the correction PR automatically.

## 7. Validation before terminal

Require:

- focused receiver-binding regression: PASS, 0 fail / 0 skip;
- full repository tests: 0 fail;
- changed JS/MJS syntax checks: PASS;
- `git diff --check`: PASS;
- v2 API Wrangler dry-run using `wrangler.v2.api.jsonc`: PASS;
- exact-head GitHub Actions: SUCCESS;
- Draft PR OPEN / UNMERGED / mergeable;
- diff limited to the minimal Supabase transport correction, narrow test update, and synchronized branch copy of CURRENT_TASK only;
- zero DB writes/migrations/deployments/live-game operations during this task;
- Production/v1/preserved games untouched.

## 8. Review focus

The owner review must verify the actual final source, not only test counts:

- no `this.fetchImpl(...)` receiver-sensitive invocation remains on the Supabase transport path;
- the replacement invokes the function receiver-neutrally;
- dependency injection is preserved;
- no retry/fallback was added;
- no provider/frontend/migration/config semantic drift;
- regression genuinely distinguishes method-call receiver from receiver-neutral invocation.

If those pass, the next operator action will be exact-head merge and a rollout-resume task that starts from the failed Setup boundary. It must NOT reapply migrations 002-005 and should not redeploy the frontend unless source lineage/config requires it. The corrected API Worker must be deployed before one new Setup attempt.

## 9. Required terminal

Post one new immutable Issue #68 terminal:

`COMPANY_V2_PHASE1_SUPABASE_FETCH_BINDING_READY_FOR_REVIEW`

Include:

- task ID;
- exact final head;
- branch and Draft PR number;
- triggering blocked terminal `5340154630`;
- operator review `5340209458`;
- changed paths;
- concise root-cause statement;
- exact receiver-neutral source correction summary;
- behavioral regression description proving receiver-sensitive injected fetch now succeeds through the public store path;
- focused/full test counts;
- syntax/diff/Wrangler dry-run result;
- exact-head CI run/job;
- confirmation that migrations 002-005 were untouched and no DB/deploy/live-game/Production/v1 operation occurred.

Then STOP at `WAITING_REVIEW`. Do not merge and do not resume rollout yourself.
