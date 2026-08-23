# Company — CURRENT TASK

Status: READY
Task ID: company-r3-turn-stream-timeout-terminalization-v1
Mode: FREEZE ACCEPTED PRODUCT -> REPRODUCE PARTIAL-STREAM ORPHAN -> FIX ONE TURN-LIFECYCLE TERMINALIZATION BOUNDARY -> TEST API LIVE SMOKE
Updated: 2026-08-24 03:54 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5387850977`
Operator review: Issue #68 comment `5387879263`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Accepted baseline — freeze

Accepted executable/source before this repair:
- `5d033404a411683ca7afbd2f97a5e274c034498c`

Current main before this registration:
- `933b9cc26730f7a8fe7f729d62dd8adb23eb6db7`
- docs-only holistic V3 terminal descendant of the accepted executable; V3 made no product/source/deploy change.

Accepted TEST artifacts:
- API `game-proxy-company-r3` version `53a91cb4-9317-4198-8d7c-52a9e8e34571`
- Frontend `gamebuilder-company-r3` version `71416b75-9cca-45ee-9b32-7cf209f16395`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Accepted repository validation before the failure:
- full `npm.cmd test`: 536/536 PASS
- identity/opening focused: 44/44 PASS
- accepted agency/navigation/choice/CSA/reset/media/TTS/current-scene behavior remains frozen unless this exact timeout task independently disproves it.

Preserved games — READ ONLY, never reset/revise/retry/mutate:
- owner manual game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`
- holistic V1 failure `f84aa0f0-6658-41a2-8fed-c307d4d2e219`
- CSA repair `f1285f4c-4719-4dc2-a18d-9fa5ad86d40c`
- holistic V2 identity failure `4b050667-cca3-43a0-b483-d16c86a2873e`
- identity executive acceptance `a78b91bd-4216-4e31-91ab-fd2705f0a99c`
- identity junior acceptance `6b8ba038-50f0-408b-8210-20fed28bd0bc`
- holistic V3 timeout failure `1ebc90a9-2957-4e00-bcbd-32287cd918bc`

Use new disposable TEST games for mutable live smoke only.

## 1. Exact proven defect

Holistic V3 Campaign A reached Opening + committed Turns 1–10 normally. It had already proven:
- executive canonical identity remained correct;
- visible CSA draft/Revert caused zero gameplay writes;
- APPLY produced one chronological `activate` turn;
- CHANGE produced one chronological `update` turn using the same rule id and a different preset;
- visible choice dispatch was being used normally.

At Turn 11 the exact visible choice was clicked once:
`네, 좋습니다. 초안을 이리 주시면 같이 확인하겠습니다. 그리고 방금 정리한 위험 항목 질문들도 함께 맞춰보지요.`

The public UI stayed at Turn 10 and exposed pending recovery instead of reaching a new ready state.

Independent READ ONLY DB inspection after the stop proves this was not merely an early 80-second harness observation:
- game: `1ebc90a9-2957-4e00-bcbd-32287cd918bc`
- Turn 11 action id: `31346716-87f9-4e1d-9e6b-dd2db2ebb049`
- attempt: 1
- final job status: `failed`
- final job stage: `failed`
- error: `company_r3_stale_turn_timeout`
- `progress_writes=3`
- partial Story text exists and ends mid-generation
- created: `2026-08-23 18:47:47.794704+00`
- stale-failed: `2026-08-23 18:50:01.432393+00`
- elapsed to stale failure: about 133.6 seconds
- no durable Turn 11 commit; committed state stayed Turn 10.

Current source contracts:
- `runtime-r3/server/provider.js`
  - `storyFirstContentMs = 30_000`
  - `storyTotalMs = 120_000`
  - streaming reader has its own total-deadline race and should raise `r3_story_timeout`.
- `runtime-r3/server/job-policy.js`
  - Story durable lease = `130_000`
  - comment explicitly says 120s provider budget + scheduling grace.
- live DB `company_r3_expire_stale_turn`
  - `reserved/story_streaming` processing jobs expire after 130 seconds as `company_r3_stale_turn_timeout`.
- `frontend-r3/app.js`
  - pending recovery polls context for up to 120 seconds.
- `runtime-r3/server/supabase-store.js::context()/getJob()`
  - read path calls stale-job expiry before returning context/job.

The intended normal timeout path is:
`provider total timeout -> processTurn catch -> store.failJob -> terminal failed context`.

The observed path was instead:
`partial Story/progress writes -> processing job survives -> normal failJob terminalization does not durably occur -> later context/getJob read triggers 130s stale expiry`.

Therefore the defect boundary is turn-stream lifecycle/terminalization. Do not reinterpret this as a Story-content, CSA, choice, identity, or DB-authority defect.

## 2. Hard scope freeze

Freeze and do not redesign:
- Story content semantics and product prompt;
- provider/model identity (`deepseek-v4-flash`), model selection, temperature/thinking settings, max_tokens;
- player agency contract;
- canonical identity contract;
- navigation/location/presence;
- Observer semantics/fail-open behavior;
- choice extraction/dispatch;
- CSA APPLY/CHANGE/REMOVE semantics;
- image/TTS;
- current-scene/History presentation;
- setup/reset/profile persistence;
- DB schema/table shape/RLS/grants unless a proven blocker requires a separate operator task.

Do NOT:
- retry/regenerate automatically;
- sample until a fast provider response occurs;
- increase the 120s Story provider timeout;
- increase the 130s Story lease;
- simply shorten timeouts as a guess to hide the lifecycle bug;
- change prompt/model/max_tokens/temperature/provider URL to make responses faster;
- add a second LLM, queue, Durable Object, cron, new worker, second turn executor, or hidden background system without first proving the current request lifecycle cannot satisfy the invariant;
- commit partial Story as a successful turn;
- mutate the preserved V3 fixture;
- access Production.

Expected source investigation boundary:
- `runtime-r3/server/provider.js`
- `runtime-r3/server/worker.js`
- `runtime-r3/worker-entry.js`
- `runtime-r3/server/job-policy.js`
- `runtime-r3/server/supabase-store.js`
- `frontend-r3/app.js`
- `frontend-r3/turn-transport.js`
- focused tests around provider streaming, worker turn lifecycle, stale lease, transport recovery.

Only change files actually proven necessary.

## 3. Mandatory pre-edit trace — prove the first lost terminalization boundary

Before editing, record all of the following.

### A. Preserved live evidence — READ ONLY
Re-read the V3 failure job/state without modifying it and confirm:
- Turn 11 is `failed/company_r3_stale_turn_timeout`;
- partial Story/progress writes exist;
- no Turn 11 durable row exists;
- canonical state remains committed Turn 10;
- no retry attempt 2 exists.

Do not open the game in a way that submits/retries/resets anything.

### B. Source timing trace
Trace exactly:
1. `createR3Provider().request()` total AbortController timer;
2. `readOpenAiStream()` first-content and total `Promise.race` timers;
3. `provider.story()` propagation of `r3_story_timeout`;
4. `processTurn()` catch and `store.failJob()`;
5. `streamTurn()` ReadableStream lifecycle when the downstream response/reader is cancelled or disconnected;
6. `worker-entry.js` response/body wrapping and whether execution lifetime is coupled to the response stream;
7. `company_r3_update_turn_progress`, `mark_story_complete`, `fail_turn`, and stale-expiry fencing assumptions;
8. frontend `consumeR3Sse`/transport reconciliation and `recoverPendingTurn()` behavior.

### C. Deterministic compressed reproduction
Create focused deterministic tests with fake/in-memory provider/stream timing. Do not wait real 120 seconds.

You must independently reproduce at least:
1. first Story delta arrives, then provider stream stalls past a compressed `storyTotalMs`;
2. Story has already produced enough text to write progress before the stall;
3. downstream/client stream cancellation or transport loss after partial content;
4. normal fast Story completion control case.

The reproduction must reveal whether:
- provider timeout fires but `processTurn/failJob` is not reached;
- response cancellation stops the request-side executor before failure persistence;
- a promise/timer cancellation race suppresses timeout propagation;
- DB attempt fencing rejects the late fail write;
- another exact boundary is responsible.

If no deterministic test can reproduce or prove the first boundary, STOP:
`BLOCKED_TIMEOUT_BOUNDARY_NOT_PROVEN`

Do not tune timeout values speculatively.

## 4. Required correction invariant

Fix only the first proven lifecycle boundary.

After the correction, every normal turn attempt must have exactly one durable terminal outcome:
- `committed`, or
- `failed` with an explicit bounded error.

For an over-budget Story stream or a transport-disconnected partial Story:
- no partial Story may be committed;
- committed turn/state/revision must not advance;
- the job must not remain `processing` until the 130s stale lease in the ordinary reproducible timeout/disconnect path;
- the normal durable failure path should win before stale expiry whenever the Company R3 worker is still capable of observing the timeout/cancellation;
- the frontend must eventually render a terminal failed/recoverable state, not leave prior choices looking ready while a hidden orphan job survives;
- user retry remains explicit only;
- there is never an automatic second provider call or second turn attempt.

Prefer a specific existing failure such as `r3_story_timeout` when the provider budget is what expired. If transport loss is independently distinguishable, use one stable explicit transport error rather than disguising it as a successful turn.

`company_r3_stale_turn_timeout` remains a last-resort crash/orphan safety net for executions that truly cannot terminalize themselves. Do not delete it.

## 5. Timeout values are not the primary fix

Current timing intent is coherent on paper:
- provider Story budget: 120s
- durable Story lease: 130s

Do not alter these numbers unless the deterministic trace proves an unavoidable platform/request ceiling that makes the current relationship impossible.

If such a platform ceiling is proven:
- record exact evidence;
- choose the smallest bounded relationship change that guarantees normal terminalization before the platform ceiling;
- do not increase latency budgets;
- do not change model/prompt/max_tokens as part of this task;
- add tests that encode the new ordering invariant.

A mere assumption that “Cloudflare probably cuts it off” is not proof.

## 6. Deterministic acceptance tests

Add/adjust focused tests proving at minimum:
1. partial-delta then compressed total timeout -> durable job `failed`, not processing;
2. error is explicit and stable; stale lease is not the primary terminalizer in that controlled path;
3. progress may exist but no partial turn commit exists;
4. canonical committed_turn/state/revision remain unchanged after failed attempt;
5. client/downstream cancellation after partial delta reaches the proven bounded terminal behavior;
6. no automatic retry/regeneration/provider call #2;
7. explicit retry capability remains separate and existing failed-action contract is not weakened;
8. a normal fast Story still streams and commits once;
9. choices are committed only on successful terminal commit;
10. active CSA operation is not applied if its Story turn fails before commit;
11. Observer timeout/fail-open remains independent and unchanged;
12. stale 130s expiry still handles a truly orphaned/crashed processing job as last resort;
13. frontend recovery renders committed/failed outcomes correctly and never submits another turn;
14. prior literal/full choice is not dispatched twice during reconciliation;
15. accepted identity/agency/navigation/CSA/media/timeline tests remain GREEN.

Use compressed milliseconds in tests. Do not add sleeps near production durations.

Run:
- focused provider/worker/turn-transport/job-policy tests;
- full `npm.cmd test`;
- changed JS/MJS `node --check`;
- `git diff --check`.

Do not weaken tests to accept orphan processing.

## 7. Source/deployment boundary

If backend/runtime code changes:
- deploy exact corrected source to TEST API `game-proxy-company-r3`;
- preserve all existing vars/secrets/bindings including TTS binding;
- record new API Worker version.

Frontend:
- redeploy only if a frontend source file was independently required by the proven correction;
- otherwise keep exact existing frontend `71416b75-9cca-45ee-9b32-7cf209f16395`.

No Production.
No migration/schema/RPC apply in this task.
No provider/model/config/secret changes.

If the proven fix actually requires DB function/schema migration or a second execution system, STOP before applying it and report `BLOCKED_REQUIRES_BROADER_LIFECYCLE_CHANGE` with exact evidence. The operator will decide the next cut.

## 8. Bare-public TEST smoke after deterministic GREEN

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

Create one NEW disposable normal game. Do not reuse the V3 failure fixture.

Run visible Setup -> Opening -> at least 5 ordinary committed turns without retry/regeneration, including:
- at least 2 visible choice clicks;
- at least 2 free-form inputs;
- one same-NPC conversation follow-up;
- one ordinary work or social action;
- one refresh/re-entry during the sequence.

Require:
- each normal turn ends in exactly one ready committed state;
- no duplicate POST/turn;
- no stale processing job after successful turns;
- current Story/choices/history reconstruct after refresh;
- accepted canonical identity remains correct;
- no CSA/media/navigation regression observed in this narrow smoke.

Do NOT try to manufacture a live 120s provider stall by changing prompts, model, config, network, or test hooks.
The timeout/disconnect invariant is proven deterministically in focused tests.

If a natural live timeout occurs during the smoke:
- do not retry;
- verify it terminalizes according to the corrected contract and preserve that fresh fixture;
- report the exact result.

## 9. Failure handling

GREEN only if:
- exact first lifecycle boundary is proven deterministically;
- bounded correction fixes that boundary;
- timeout/disconnect path no longer relies on stale expiry as its normal terminalizer;
- no partial commit/automatic retry occurs;
- normal fast turns remain single-commit;
- focused/full/syntax/diff tests pass;
- affected TEST deploy succeeds;
- bare-public normal-turn smoke passes;
- no DB/schema/migration/provider/model/product-semantics drift occurs.

Stop conditions:
- no proven first boundary -> `BLOCKED_TIMEOUT_BOUNDARY_NOT_PROVEN`
- requires DB migration/second execution system/broader architecture -> `BLOCKED_REQUIRES_BROADER_LIFECYCLE_CHANGE`
- corrected source still orphans deterministic stalled/cancelled turn -> `FAILED_PRODUCT`
- TEST infrastructure/provider unavailable independently -> report exact environment boundary; do not patch around it.

Do not claim owner-ready.
Do not restart holistic V3/V4 in this task.

## 10. Completion protocol

At completion post to Issue #68:
- source SHA and final main SHA;
- exact proven first failure boundary;
- changed files and why each was required;
- deterministic stall/cancel reproduction before/after;
- job status/error/state/partial-story behavior after correction;
- focused/full/syntax/diff results;
- TEST API/frontend versions;
- fresh smoke fixture id and turns;
- confirmation V3 fixture remained read-only;
- confirmation no auto retry/provider-model/config/DB migration/Production change;
- exact disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push main, post terminal report, and stop.

Do not create the next holistic task yourself.