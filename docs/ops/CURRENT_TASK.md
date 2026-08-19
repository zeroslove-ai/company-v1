# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-subrequest-budget-closure-v1
Mode: SOURCE RUNTIME CORRECTION — BOUNDED PROGRESS PERSISTENCE / 50-SUBREQUEST SAFETY
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority / accepted baseline

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Accepted Company v2 product baseline:

- product source terminal: Issue #68 `5341256206`
- product source acceptance: `5341316161`
- product accepted head: `16c5fecd1e407acf9f2f629a1b719e300f11b0ff`
- product merge: `ee46977747dc89b04dca65fc4632e88b45cae7e0`
- owner free-input/product law: `5341086841`
- owner rich-narrative law: `5341147788`

Accepted choice DB contract closure:

- source terminal: `5341760236`
- source acceptance: `5341789672`
- accepted head: `ef23d6c9090af17f5eca6f07689fb8067bb75bc1`
- PR #91 merge: `2c010a3ffac07750db72c4ee6035e8a8f1a2f253`
- migration: `20260819000600_company_v2_choice_contract_closure.sql`

Latest TEST rollout evidence:

- resume task: `company-v2-phase1-choice-db-contract-test-rollout-resume-v1`
- execution lease: Issue #68 `5341917786`
- blocked terminal: Issue #68 `5342027872`
- operator review: Issue #68 `5342085160`
- TEST project: `fmcrspgxstsmxxsmkeee`

This task is SOURCE REVIEW ONLY. Do not deploy, apply migrations, create/retry/reset games, or mutate TEST/Production data.

## 1. What is already proven closed

Do not reopen or re-fix the choices contract.

The latest rollout proved migration 006 successfully applied exactly once to TEST and the active DB contract is now correct:

- migration 006 ledger count = 1;
- old exact-four `company_v2_turns_choices_check` absent;
- new `company_v2_turns_choices_empty_check` present and `NOT VALID` / `convalidated=false`;
- historical four-choice rows remain preserved/readable;
- fresh Opening accepts/persists `choices=[]`;
- exact fenced Commit requires `choices=[]`;
- action_id + attempt_no fencing remains intact;
- no unfenced writer overload exists;
- replaced RPC ACL remains service_role-only;
- no Worker redeploy was required for migration 006.

Fresh UTF-8 Setup/Opening also passed.

Smoke A:

`9cda9783-76ae-436e-a517-a5c9377d273f`

Direct DB evidence:

- stored player name exactly `플레이어`;
- committed_turn = 0;
- revision = 0;
- exactly one Opening turn row;
- Opening `choices=[]`;
- Opening story/summary persisted correctly.

Therefore this task MUST NOT edit migration 006, migrations 002-005, DB choice rules, UTF-8 behavior, provider/model values, or frontend product behavior.

## 2. Proven new blocker — Worker subrequest exhaustion

Exactly one gameplay request was made on Smoke A with:

- action_id: `168c405a-08a6-4d19-87b6-2b52637028d1`
- expected_turn: 1
- retry_failed: false
- literal action: `서원에게 오늘 첫 업무가 무엇인지 물어본다.`

Observed SSE:

- 37 real `story_delta` events;
- then exactly one failed terminal;
- terminal error: `Too many subrequests by single Worker invocation. To configure this limit, refer to https://developers.cloudflare.com/workers/wrangler/configuration/#limits`.

Independent direct DB readback after failure proves:

- game remains committed_turn=0 / revision=0;
- no turn-1 committed row;
- exactly one turn-1 canonical job;
- job status = `processing`;
- attempt_no = 1;
- action_id exact above;
- literal action exact Korean input;
- partial job story_text length = 53;
- error_code = NULL.

Preserve this game/job immutable. Never retry, reset, delete, reuse, or repair it in this source task or later rollout.

### Source-level root cause

Current `runtime-v2/server/worker.js` persists Story progress with:

- first progress immediately;
- then whenever 100ms elapsed OR 256 new characters accumulated;
- no per-attempt maximum number of `store.updateProgress(...)` calls.

Production `SupabaseV2Store.updateProgress()` is one Supabase HTTP RPC subrequest each time.

The same incoming `/api/v2/turn` invocation also spends subrequests on context reads, stale-expiry/getJob, reservation, provider Story, Observation, Commit/Fail and final context readback.

Therefore the number of DB progress writes currently grows with Story stream duration/size and can consume the Cloudflare invocation budget before Commit or Fail. Once the platform budget is exhausted, the catch path cannot successfully call `failJob`, which is why live evidence emitted a failed SSE terminal while the canonical job remained `processing`.

Cloudflare's current documented minimum observed environment is 50 external subrequests per invocation on Workers Free. Paid/configured limits may be higher, but this runtime must not depend on raising the plan/config limit to remain structurally correct.

## 3. Required runtime correction

Create source branch:

`company-v2/phase1-subrequest-budget-closure-v1`

Open one Draft PR against `main`.

The correction must keep the existing single-request server-owned architecture and real-time Story streaming.

### A. Hard-bound progress persistence per attempt

Introduce an explicit deterministic maximum:

`MAX_PROGRESS_WRITES_PER_ATTEMPT = 4`

Equivalent naming/location is acceptable, but the behavioral cap of **4 total durable progress RPCs per attempt** is binding for this task.

Required behavior:

1. Every provider Story delta is still emitted to the client immediately as `story_delta`; do not buffer the live Story behind DB persistence.
2. The first non-empty Story progress should remain durably visible early enough for reconnect/recovery semantics.
3. Subsequent durable progress snapshots should be spread meaningfully through a longer Story rather than firing every 100ms indefinitely.
4. Recommended cadence after the first progress write: no more often than roughly 1 second OR 512 additional characters, while still respecting the hard total cap of 4.
5. The end-of-Story "final progress" write may occur only if it does not exceed the same cap. `commitTurn` is the final durable full-Story authority on success.
6. After the cap is reached, continue streaming all Story deltas normally; simply stop issuing additional progress RPCs for that attempt.
7. The cap resets only for a genuinely new fenced attempt. Do not create automatic retries.

Do not remove progress persistence entirely. Reconnect/reconstructed-worker tests must still see durable partial Story while a turn is actively processing.

### B. Preserve terminal DB budget

The source design must leave generous deterministic subrequest headroom under a simulated 50-subrequest invocation for:

- Observation request;
- Commit RPC and returned canonical context on success;
- or Fail RPC and returned canonical context on failure.

Do not solve the issue by:

- adding `limits.subrequests` to Wrangler;
- increasing Cloudflare plan/config limits;
- disabling Observation;
- suppressing Story deltas;
- batching the Story into a non-streaming response;
- adding a second Worker/coordinator;
- moving turn authority back to frontend;
- adding hidden retries/regeneration;
- changing provider/model/API endpoint;
- changing DB writer/fencing contracts.

A small reduction of redundant read-only store calls inside the same turn is allowed only if it is demonstrably semantics-preserving and directly supports subrequest headroom. It is not required if the hard progress cap alone gives robust budget margin. Keep the patch narrow.

### C. Failure persistence must remain canonical

For ordinary source/provider/observation/commit errors that occur while subrequest budget remains available:

- the same fenced attempt must be marked `failed` through `company_v2_fail_turn`;
- error_code must persist;
- no committed turn may appear;
- no duplicate job may be created;
- frontend receives exactly one authoritative failed terminal;
- no hidden retry.

The outer stream fallback must not be treated as sufficient if DB failure persistence did not happen. The source correction must prevent the known progress-write pattern from exhausting the budget before this canonical fail path can run.

## 4. Required deterministic regression tests

Add focused tests under `test/**` proving all of the following.

### A. Many-delta success under a 50-subrequest simulation

Use production-shaped `SupabaseV2Store`/Worker behavior or an equivalent deterministic shared subrequest counter that accurately charges Store/provider fetches.

Exercise a long Story with substantially more deltas than the live failure (target at least 100 Story chunks/deltas).

Require:

- every generated Story chunk reaches SSE as `story_delta` in order;
- total `updateProgress` persistence calls for the attempt <= 4;
- the simulated invocation never exceeds 50 subrequests;
- exactly one terminal event;
- terminal status `committed`;
- canonical turn commits exactly once;
- job status committed;
- attempt_no remains 1;
- no duplicate turn/job;
- no hidden retry.

Record/assert the deterministic subrequest count so future code cannot silently consume the remaining headroom.

### B. Many-delta late failure still durably fails

Exercise a Story/provider that emits many deltas and then throws late enough that the old unbounded policy would have made many progress writes.

Under the same simulated 50-subrequest cap require:

- Story deltas streamed before failure;
- progress writes <= 4;
- `company_v2_fail_turn` equivalent is reached successfully;
- canonical job status becomes `failed`, never remains `processing`;
- error_code is persisted;
- no committed turn row;
- same action_id/attempt_no fence;
- exactly one failed terminal;
- no retry/regeneration.

### C. Active reconnect progress remains useful

Preserve or strengthen the existing reconstructed-worker/reconnect test:

- first partial Story progress becomes durable before Story completion;
- a reconstructed Worker/context can observe `processing` plus non-empty partial `story_text`;
- releasing the provider allows the original attempt to finish normally.

### D. Structural invariants

Retain existing tests for:

- stale attempt cannot progress/fail/commit a newer attempt;
- explicit failed retry only, same canonical row, incremented attempt;
- Story first-content and total timeouts;
- no hidden retry;
- `ReadableStream.start()` remains attached to `processTurn` lifecycle;
- free-input/no-choice product law;
- migration 006 contract remains intact.

## 5. Scope

Allowed source changes:

- `runtime-v2/server/worker.js`
- `runtime-v2/server/job-policy.js` if it cleanly owns the new progress-write policy/constants
- focused `test/**` files
- `docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md` only if a concise runtime invariant needs to be recorded

Do not change unless source review proves strictly necessary; if necessary, explain before including:

- `runtime-v2/server/supabase-store.js`

Not authorized:

- frontend-v2 behavior changes;
- any migration source change;
- new migration;
- TEST DB writes;
- Worker deploy/redeploy;
- retry/reset/delete/reuse of Smoke A;
- creation of any TEST game;
- provider/model/config/secret changes;
- Wrangler subrequest-limit increase;
- v1/Production access;
- Phase 2 work.

If the clean correction appears to require DB/schema/frontend/provider changes, STOP and report rather than broadening this task.

## 6. Verification

Required before terminal:

- focused Company v2 runtime tests;
- new 50-subrequest success regression;
- new 50-subrequest late-failure regression;
- reconnect/progress regression;
- full `npm test`;
- JavaScript syntax checks for changed JS/tests;
- `git diff --check`;
- API Worker Wrangler dry-run only (no deploy);
- verify no migrations/config/frontend/provider/model changes;
- exact-head GitHub Actions success.

The test must make it mechanically clear that a longer Story cannot turn progress persistence into an unbounded number of outgoing requests.

## 7. Review stop

This is SOURCE REVIEW ONLY.

Do not deploy the API Worker, do not run a fresh live smoke, do not retry Smoke A, and do not create owner handoff B.

Required terminal:

`COMPANY_V2_PHASE1_SUBREQUEST_BUDGET_CLOSURE_READY_FOR_REVIEW`

Status: `WAITING_REVIEW`

Include:

- TASK_ID;
- branch;
- Draft PR number;
- final head SHA;
- exact changed files;
- root-cause call-budget explanation;
- exact progress-write cap/cadence implemented;
- proof every Story delta still streams immediately;
- 100+ delta success regression and exact simulated subrequest count;
- late-failure regression and proof canonical failed state persists rather than processing residue;
- reconnect partial-progress proof;
- attempt-fencing/no-retry proof;
- focused/full test counts;
- dry-run result;
- exact-head CI run/job IDs;
- explicit zero migration edit/apply, zero TEST DB write/game creation/retry/reset, zero deploy, zero frontend/provider/model/config/secret/v1/Production/Phase2 operation.

Then STOP. Do not create the rollout task yourself.