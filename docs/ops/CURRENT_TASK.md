# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: P0 FAILED-TURN RECOVERY + STALE TERMINALIZATION CLOSURE -> LIVE RETRY ACCEPTANCE -> CONTINUOUS TEST LIVE-QA
Updated: 2026-08-22 11:21 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/task-registration branch, recovery branch, or alternate execution authority.

## 0. Binding authority / owner policy

Automation owns objective QA until the deployed exit matrix is green. `WAITING_USER_FINAL_PLAYTEST` / `OWNER_READY` is forbidden before then.

Binding authority remains:
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`
- PR #95 owner-locked product canon `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- PR #96 A-prime canon `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- `docs/redesign/00_*` through `11_*`
- current accepted R3 source on main
- latest explicit owner decisions and Issue #68 operator review

Architecture stays frozen at A-prime/R3: Story 1 call -> Observer 1 call -> small reducer -> atomic commit. Do not add a new engine, generic semantic validator, NER/fuzzy mapper, physical ontology, consent DSL, second Story/choice LLM, hidden retry/regeneration, or browser-owned Story/Observer/Commit orchestration.

TEST only. No Production access/deploy. Preserved historical/manual/evidence games are read-only forever.

## 1. Accepted terminal / current evidence

Accepted terminal:
- terminal comment: `5377333071`
- operator review: `5377350682`
- terminal CURRENT_TASK blob: `f5ce1e4e2111028a7786518eeb17dad4c593d9d3`
- terminal/main SHA: `7a4de43d9d6c5d1114821bd13ab0e9f4f5b3850f`

### Already green — do not re-open without new evidence

1. Fixed deployed-browser Setup -> Opening classification passed 3/3:
   - `b9c586d7-840c-4b0c-a8ba-9dfb5cec91c0`: first Story 6881ms
   - `9ee50385-95dc-4447-b6b1-baf9bab7b592`: first Story 6135ms
   - `2cecad95-aca1-43d7-800f-ea6bebe183b8`: first Story 5840ms
   All were HTTP 200 SSE, normal visible committed Opening, no browser console errors, and inside the existing 30s first-content boundary.
2. Same-job duplicate transport is green 3/3 from the prior iteration: duplicate processing-job requests returned JSON `reconnect:true`, same action identity, exactly one Story/commit.
3. Browser reload/recovery is green on disposable game `e11d9cd1-cadc-4589-ae7b-4c107b4898ca`: one processing job survived reload and settled exactly once; api/game_id and four current choices survived.

Therefore do not increase the 30s first-content timeout, change provider/model/API URL/key/secret, or reopen the already-green reconnect transport path without deterministic new evidence.

### New P0 evidence

Clean campaign `d7c44734-05e2-4968-9c60-5976ced25185`:
- Opening normal; Turns 1-12 committed once each.
- Turn 13 was submitted once.
- SSE ended without a terminal event.
- durable job remained `processing`, stage `story_streaming`, committed_turn/revision stayed 12/12.
- no retry/duplicate/reset/pass-seeking replay was used.
- read-only polling later observed the job become `failed` after about 184s with `company_r3_stale_turn_timeout`.

Source review confirms two deterministic recoverability gaps that must be closed before more long campaigns:

1. `runtime-r3/server/worker.js` checks `getJob()` before `reserveTurn()`. Any existing job — including `failed` — returns reconnect JSON immediately. Therefore an explicit `retry_failed:true` request cannot reach `reserveTurn()` and the canonical next turn is hard-locked after failure.
2. `frontend-r3/app.js` has no explicit failed-turn retry submission path. A failed canonical next-turn job is displayed/read back but cannot be user-retried through the product.
3. Provider Story is bounded to 30s first content / 120s total and Observer to 75s, but DB stale expiry is only `updated_at <= now() - 180s`. If Worker/edge execution disappears during Story, provider timeout/failJob may never execute and the job can remain processing well beyond the Story maximum.
4. `runtime-r3/server/provider.js` currently creates the AbortController total timer at request invocation but returns a separate stream deadline computed as `Date.now()+timeoutMs` after response headers. Use one invocation-based absolute total deadline so response-header latency never extends the local body-read deadline.

This is a P0 product correctness/recoverability closure, not a provider-availability tuning task.

## 2. P0 source closure

### 2.1 Explicit failed-job retry — user driven only

Implement a narrow explicit retry contract for the canonical next-turn failed job.

Required behavior:
- `retry_failed:false` or absent + existing failed job => readback/reconnect only; no Story call, no mutation.
- `retry_failed:true` + existing failed job => may reach the existing reservation/retry authority.
- retry reuses the same canonical `(game_id, turn_number)` row.
- `attempt_no` increments exactly once.
- retry uses a fresh `action_id` supplied by the user/client.
- literal action remains explicit user input. It may default in UI to the failed job literal, but the user must be free to edit it before retry.
- old attempt can never update progress, fail, or commit after the fence changes.
- exactly one new Story call occurs for one explicit retry click/submission.
- no automatic retry, hidden regeneration, timer-driven retry, or second Story call.

Server correction must be minimal: do not bypass the existing `reserveTurn(... retryFailed)` authority; fix the early existing-job branch so failed+explicit-retry can reach it while processing/committed behavior remains unchanged.

Frontend correction must be explicit and visible:
- when canonical context/job is `failed`, restore or prefill the failed literal action if available;
- show a clear failed/retry state;
- allow user edit;
- the next explicit retry action sends `retry_failed:true` with a fresh action_id for the same expected turn;
- no retry happens merely because the page loads, polls, refreshes, or sees a failed SSE.

### 2.2 Stage-aware stale terminalization

The DB fallback must not leave abandoned Story execution stuck for an arbitrary 180s idle window when Story itself has a 120s maximum.

Keep the provider values unchanged. Align durable job expiry with actual stages and attempt lifetime:
- Story-side (`reserved` / `story_streaming`) abandoned work must become canonical `failed` after the 120s Story maximum plus only a small structural grace sufficient for network/DB scheduling.
- `story_complete` must retain enough time for the independent Observer 75s fail-open window plus small DB/commit grace. Do not expire a valid Observer merely because the Story consumed most of its own budget.
- expiry never calls Story/Observer and never retries anything; it only terminalizes stale durable work.
- expiry preserves committed_turn/revision and previously committed history.
- stale prior attempts remain fenced after retry.

If the existing row lacks a trustworthy per-attempt start timestamp because `updated_at` is also progress heartbeat, one small additive R3 migration is authorized to add a per-attempt lease/start timestamp and update the existing R3 RPCs. Never edit/rewrite `20260821000100_company_r3_milestone0.sql` or any applied migration. Any new migration is TEST-only until separately proven in this task.

Do not solve this by increasing provider timeouts.

### 2.3 Single absolute provider total deadline

In `runtime-r3/server/provider.js`, derive the Story total deadline once at request invocation and use that same absolute deadline for both AbortController timing and stream-body timeout enforcement. Response-header latency must count against the 120s total budget.

Do not change the configured 30s/120s/75s values.

## 3. Required deterministic tests before live mutation

Add/adjust focused tests that prove at least:

1. existing `processing` job => reconnect/readback only, zero second Story call;
2. existing `committed` job => replay/readback only, zero second Story call;
3. existing `failed` + no retry flag => no mutation, no Story call;
4. existing `failed` + `retry_failed:true` => same row, attempt_no +1, fresh action_id, one Story call;
5. stale previous attempt cannot progress/fail/commit after explicit retry;
6. frontend failed state is visible, literal is recoverable/editable, and only an explicit retry submission sets `retry_failed:true`;
7. refresh/load/poll on failed job never auto-retries;
8. Story total deadline includes response-header latency and still uses one provider call;
9. Story first-content remains 30s and total remains 120s;
10. abandoned `reserved/story_streaming` attempt expires on the Story-stage lease boundary, not an extra 180s idle wait;
11. `story_complete` is not prematurely expired during a valid Observer window;
12. stale expiry never increments committed_turn/revision and never invokes an LLM.

Run focused suites, full `npm` suite, changed JS/MJS syntax checks, SQL/static contract tests as applicable, and `git diff --check`.

## 4. Landing / TEST rollout

1. Re-read latest Issue #68 immediately before landing.
2. Fast-forward only. No force push/history rewrite/new branch.
3. If an additive migration was required, verify exact SQL diff and apply only that new migration to the R3 TEST project. No historical migration repair/reapply and no Production schema change.
4. Deploy exact reviewed TEST API/frontend artifacts only after source/tests are green.
5. Record exact main SHA, migration identity if any, Worker versions, and health.

## 5. Focused deployed acceptance after P0 fix

Use fresh disposable R3 TEST games only.

### 5.1 One explicit failure -> retry scenario

Create one controlled deterministic product scenario using the existing TEST seams/timeout injection only if a safe existing mechanism is available; do not change provider/model values or introduce a permanent failure simulator solely for acceptance.

Prove:
- canonical turn becomes `failed` without advancing committed_turn/revision;
- UI/readback shows failed state and preserves the literal action;
- no automatic retry occurs during observation window/refresh;
- user explicitly retries once;
- same `(game_id, turn_number)` row changes to attempt_no +1 with fresh action_id;
- exactly one new Story generation occurs;
- it commits at most once;
- prior attempt cannot later overwrite it.

If a deterministic controlled live failure cannot be safely produced, use exact source/integration proof for failure injection and then treat the first naturally occurring failed job in the clean campaign as the live explicit-retry acceptance. Do not sabotage provider configuration.

### 5.2 Fresh clean campaign restart

After P0 recovery is green, start a **new** disposable clean campaign from Opening. Do not continue `d7c44734...` as the clean acceptance fixture.

Run 30+ committed turns with one intended action per turn. A provider/edge failure may occur naturally; if it does, use the newly explicit user retry path once and record it rather than abandoning the campaign or hiding the failure. Do not retry repeatedly until pass.

Acceptance is still about semantic quality, not just turn count. Sample literal -> Story -> Observer raw -> Observer applied -> state_after throughout.

## 6. Continue existing P1 correction loop

After P0 recovery/live retry is green, continue immediately:

1. Active CSA Story projection: active rules reach Story as relevant premise + selected scope.
2. Observer canonical actor `{id,name}` directory; no fuzzy/nearest unknown-name mapping.
3. Mind Monitor actor-keyed for relevant current/post-Story NPCs, including newly entering relevant NPCs.
4. Canonical location across at least four distinct locations: literal -> Story -> observer raw -> observer applied -> state_after -> next Story.
5. Actor enter/exit quote must identify that canonical actor; player movement quote cannot support NPC enter/exit.
6. `scene_note` is a bounded current snapshot rewritten each turn; stale ended facts removed.
7. Semantic player agency: actor, target, action, movement, request/refusal, self-state, topic/intent cannot be substituted.
8. Product identity: company work is life texture, not a mandatory work-assistant funnel; no invented competing app mechanics outside canonical 9-rule `상식개변` authority.
9. Choices: four current Story-authored choices at high reliability, mostly one action/intention each; no previous-turn fallback/fabricated deterministic replacements. Literal free input remains available.

## 7. Remaining campaigns / CSA / retained surfaces

After the fresh clean 30-turn campaign stabilizes:
- independent materially different 15+ turn campaign;
- long-memory 50+ turn campaign;
- dedicated clothing CSA fixture;
- dedicated request/interaction CSA fixture.

Measure submit -> first Story token -> Story complete -> Observer complete/fail-open -> terminal commit, with p50/p95 where meaningful.

For all 9 canonical CSA templates prove:
`apply -> revision changes without gameplay turn -> relevant scene -> Story premise/scope effect -> observer/readback/structured state as applicable -> remove -> next Story/readback confirms removal`.

RPC success alone is not acceptance. Institutional/system CSA premise must not manufacture personal affection, comfort, consent, or desire.

Exercise retained history/TTS/download and any canon-retained sidecars. Feedback/revision remains unfinished until functional or explicitly owner-deferred.

## 8. Safety / exit

- TEST only; no Production.
- Preserved/manual/evidence games immutable.
- No provider/model/API URL/key/secret/temperature change.
- No timeout inflation.
- No automatic retry/regeneration.
- No second Story/choice LLM.
- No generic semantic classifier/NER/fuzzy mapper/physical ontology/consent DSL.
- No browser-owned orchestration replacing A-prime server authority.
- Additive migration only if the P0 lease contract truly requires it; never rewrite applied history.
- Re-read Issue #68 before source landing and deployment.
- Fast-forward only.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remains forbidden until P0/P1/P2 objective evidence, clean 30 + independent 15 + long-memory 50, all 9 CSA behavioral coverage, reconnect/double-submit/failed-retry recovery, and retained surfaces are green.

If a safety boundary or ambiguous deterministic failure is reached, post exact evidence and STOP. Otherwise continue this SAME task; do not create a new feature task.