# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: SAME-JOB RECONNECT EDGE DIAGNOSTIC -> RECONNECT/REFRESH LIVE ACCEPTANCE -> CONTINUOUS TEST LIVE-QA / FIX / REDEPLOY LOOP
Updated: 2026-08-22 10:25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/task-registration branch, recovery branch, or alternate execution authority.

## 0. Binding authority / owner policy

The owner has rejected premature `WAITING_USER_FINAL_PLAYTEST` / `OWNER_READY`. Automation owns objective QA until the full deployed exit matrix is green.

Binding operating/product authority remains:

- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`
- PR #95 owner-locked product canon at `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- PR #96 A-prime engine/live-first canon at `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- `docs/redesign/00_*` through `11_*`
- Company UI/content donor snapshot `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`
- current accepted R3 source on main
- latest explicit owner decisions and Issue #68 operator review

Architecture remains frozen at A-prime/R3. Do not invent a new engine, generic semantic validator, NER/fuzzy mapper, physical ontology, consent DSL, second Story/choice LLM, retry/regeneration layer, or browser-owned Story -> Observer -> Commit orchestration.

TEST only. No Production access/deploy. Never mutate/reset/delete/replay preserved historical/manual/evidence games.

## 1. Accepted prior terminal / current source state

Accepted terminal and review:

- terminal: Issue #68 comment `5377060568`
- operator review: Issue #68 comment `5377084627`
- prior CURRENT_TASK blob: `31988c35326fd9a9ef4bd787e7bd9077a24dbeb5`
- registration main: `8311063dfa6372515eed0d518fb75b7ad7e92aae`
- accepted final executable main: `1e8c36d66f4fd93a91e3d5378862a990601f5e35`
- TEST API version reported at terminal: `53bddd8a-e243-43fc-91c3-50da4a71990d`

Independent Git verification confirms `8311063... -> 1e8c36d...` is exactly one commit changing only:

- `runtime-r3/server/provider.js`
- `runtime-r3/server/worker.js`
- `test/r3-production-boundary.test.mjs`
- `test/r3-turn-kernel.test.mjs`

The change is non-semantic timing visibility only. Reported validation: focused R3 12/12, full npm 452/452, syntax and `git diff --check` pass.

### Accepted first-content conclusion

The fixed three-sample diagnostic ran exactly 3 fresh disposable Korean Setup -> Opening attempts with no pass-seeking retry.

Result: 3/3 committed Opening and produced first Story content inside the existing 30s boundary. One visible sample recorded response headers at 165ms, first Story delta at 3028ms, Story complete at 12302ms, terminal commit at 16752ms.

Therefore:

- do **not** increase the 30s first-content timeout from current evidence;
- classify the earlier single 30s timeout as a transient provider incident for now;
- do not change provider, model, API URL, key/secret, temperature, retry policy, or Story semantic contract to chase availability.

### Current blocker

The reconnect acceptance then failed at a different layer:

- Setup/Opening progressed on fresh disposable games;
- while a turn job was already in flight, the duplicate same-job Turn request returned non-JSON Cloudflare HTML instead of the expected Worker JSON reconnect response;
- therefore `reconnect=true`, exact in-flight job identity and final exactly-once readback were not validly proven;
- an immediate health/catalog read returned Worker JSON 200;
- no retry loop was used and continuous QA did not start.

Current server source fact: `turnResponse()` checks `store.getJob(gameId, expectedTurn)` before reserving a new job. If the job already exists it should immediately return JSON `{status, reconnect:true, job, ...}` and must not invoke Story/provider again. The next task is therefore transport/edge/request-route diagnosis, not another provider timeout change.

## 2. Fixed same-job reconnect edge diagnostic

This is a bounded diagnostic, not retry-until-pass.

### 2.1 Preflight

1. Fetch exact latest `origin/main` and re-read latest Issue #68 before mutation/deploy.
2. Verify main is a descendant of `1e8c36d...`; inspect every newer delta.
3. Confirm TEST API/frontend deployed identities. Deploy only exact reviewed TEST artifacts when an actual source change requires it.
4. Do not change provider/model/API URL/key/secret, Story timeouts, retry count, or semantic prompts.
5. Use only fresh disposable R3 TEST games.

### 2.2 Existing evidence first

Before patching diagnostics, inspect whether current browser/network/SSE/Worker response data can already distinguish:

- exact request URL/path and method;
- HTTP status;
- `content-type`;
- Cloudflare `cf-ray` and relevant response headers;
- request start -> response elapsed time;
- whether the duplicate request reached the R3 Worker route;
- whether `turnResponse()` saw an existing job;
- whether any second Story/provider invocation occurred;
- DB/job state before duplicate, immediately after duplicate, and after original job terminal state.

For any non-JSON response preserve only a bounded body prefix sufficient to identify Cloudflare/error class. Do not store prompts, Story payloads, authorization headers, secrets, API keys, cookies, or unrelated private data.

If Worker-route reachability cannot be proven from current evidence, add the **smallest non-semantic request-correlation diagnostic** needed. Examples allowed: bounded TEST response/request correlation ID, route-stage diagnostic header/event/log, existing-job branch timing marker. Such diagnostics must not become gameplay state, Story context, durable semantic authority, or a new subsystem.

Any source/test diagnostic change requires focused regression, full suite, changed JS/MJS syntax checks and `git diff --check`, then fast-forward-only landing and exact TEST deploy before live use.

### 2.3 Exactly three independent reconnect samples

Run exactly **3** fresh disposable reconnect scenarios. Do not stop after an early pass/fail and do not retry a failed sample.

For each sample:

1. Korean Setup -> Opening normally.
2. Submit one ordinary Turn with a unique `action_id`, exact `literal_action`, and correct `expected_turn`.
3. Confirm the original job is actually `processing` using existing job/context/DB/SSE evidence; do not manufacture provider delay or change config merely to keep it open.
4. While that same job is still processing, send exactly **one** duplicate Turn POST with the same game, turn number, action ID and literal action.
5. Record duplicate-response:
   - HTTP status;
   - content-type;
   - cf-ray / request correlation if available;
   - elapsed time;
   - JSON reconnect fields if JSON;
   - bounded identifying prefix if non-JSON;
   - evidence of whether Worker route/existing-job branch was reached.
6. Allow the original job to reach its natural terminal state; do not regenerate/retry it.
7. Read back context/job/turn state and prove whether exactly one Story generation and exactly one committed turn occurred.

Also record adjacent health/catalog/context read behavior only as diagnostic evidence; do not treat an adjacent HTTP 200 as proof that the failed duplicate request itself succeeded.

### 2.4 Classification after all three samples

Do not guess. Classify from evidence:

**A. 3/3 duplicate requests return Worker JSON `reconnect:true` and all three finish exactly once**
- classify prior Cloudflare HTML as transient edge/transport incident for now;
- do not patch the server merely because one previous edge request failed;
- proceed directly to Section 3.

**B. One or more duplicate requests return non-JSON Cloudflare/edge response and evidence proves the request did not reach the Worker route**
- preserve exact HTTP/edge evidence;
- do not add semantic/runtime hacks or hidden request retries;
- inspect whether the deployed frontend already treats this as a recoverable transport interruption and can recover the same in-flight job after refresh/recovery control;
- if frontend instead strands the user or converts the transport error into a destructive/duplicate action path, a narrow frontend recovery correction is allowed;
- if frontend already recovers safely, do not patch product code solely to mask Cloudflare availability. Continue Section 3 with the fixed sample evidence; report the edge incident distinctly.

**C. The request reaches the Worker but the existing-job route returns/bubbles a non-JSON/5xx response or performs a second Story generation**
- this is a deterministic server correctness defect;
- fix only the proven R3 HTTP/turn reconnect path;
- add regression proving an existing processing job returns bounded JSON reconnect without provider invocation or duplicate reservation;
- full validation, fast-forward landing, exact TEST deploy, then rerun a new fixed three-sample set once. Do not loop until pass.

**D. The acceptance harness/request shape is wrong**
- fix the QA harness only;
- prove the browser/product request contract was not changed;
- rerun the fixed three-sample set once with the corrected harness.

If evidence remains ambiguous after the fixed sample and minimal diagnostics, STOP BLOCKED with exact evidence for operator review rather than widening scope.

## 3. Browser reconnect / refresh live acceptance

Once Section 2 provides a valid reconnect transport path, use a **new fresh disposable R3 TEST game** and complete the user-visible acceptance:

1. Korean Setup -> Opening -> at least one committed ordinary turn.
2. Refresh after commit and verify canonical committed context.
3. Start another turn and refresh/reload while its job is actively `processing`.
4. Exercise a real or controlled SSE disconnect and recover the **same job**.
5. Verify canonical committed context renders after terminal commit.
6. Verify recovery control is visible/usable when required.
7. Preserve `api=` and `game_id` through reload.
8. Prove no duplicate Story generation, no duplicate committed turn, no hidden retry/regeneration.
9. Inspect browser console/network, job/state/turn DB evidence and screenshot-visible UI together.

If a deterministic implementation defect appears, fix narrowly, validate, fast-forward land, exact TEST deploy, and replay once on a new disposable game. Do not certify from unit tests alone.

## 4. Continue the SAME P1 correction loop

A green reconnect scenario is not task completion. Continue immediately through the binding product-review priorities.

### P1 correctness

1. **Active CSA Story projection** — active rules must reach Story as relevant premise + selected scope. `active_rules: []` while active is a defect.
2. **Canonical Observer actor contract** — provide canonical `{id,name}` actor directory; no fuzzy/nearest mapping of unknown names.
3. **Mind Monitor** — actor-keyed relevant current/post-Story NPC output; new relevant entrants must not be dropped solely for being absent pre-turn.
4. **Canonical location** — at least four distinct locations through literal -> Story -> observer raw -> observer applied -> state_after -> next Story.
5. **Actor enter/exit evidence** — quote must identify that canonical actor; player movement quote cannot become NPC enter/exit evidence.
6. **scene_note** — bounded current-scene snapshot rewritten each turn; ended facts removed, continuing facts retained.
7. **Semantic player agency** — actor, target/counterparty, action, movement/direction, request/refusal, self-state and topic/intent must not be silently substituted.
8. **Product identity** — company work is texture, not mandatory work-assistant funnel; Story must not invent competing app mechanics outside canonical 9-rule `상식개변` authority.
9. **Choices** — exactly four current Story-authored choices at high reliability, one clear action/intention each; no stale/prior-turn fallback or deterministic fabricated replacements. Failure stays fail-open to literal free input.

### P2 / long-play / performance

10. Separate disposable fixtures: clean normal play, independent different style, clothing CSA, request/interaction CSA, long-memory.
11. Clean primary campaign: **30+ committed turns**.
12. Materially different independent campaign: **15+ committed turns**.
13. After shorter campaigns stabilize: **50+ committed turn** memory/continuity campaign.
14. Record submit -> first Story token, Story total, Observer tail and terminal commit across campaigns; derive p50/p95 where sample size permits. Measure before optimizing.
15. Exercise refresh-during-stream, same-job reconnect, duplicate-submit/concurrency and stale-attempt protection.

## 5. CSA acceptance

For each of all 9 canonical CSA templates, use dedicated/appropriate disposable fixtures and prove:

`apply -> revision increases while gameplay turn stays unchanged -> play an actually relevant scene -> Story premise/scope effect -> observer/readback/structured state as applicable -> remove -> next Story/readback confirms removal`

Also verify:

- clothing changes are structured only when warranted by Story/evidence;
- institutional/system CSA premise does not manufacture personal affection, comfort, consent or desire;
- scope flexibility remains within the canonical 9-rule MVP;
- RPC success alone is never acceptance evidence.

## 6. Retained surfaces / minimum deployed evidence

Exercise deployed history, TTS, download and other canon-retained sidecars. Feedback/revision, if still visibly promised/retained by canon, remains unfinished until functional or explicitly owner-deferred.

Before owner handoff require at minimum:

- clean desktop/mobile boot;
- Korean Setup -> Opening -> ordinary play;
- visible nonblocking Story streaming;
- reliable current four choices + literal Korean free input;
- clean 30 + independent 15 + long-memory 50 campaigns;
- semantic agency, identity, location/presence, scene_note and MM green;
- refresh/reconnect/double-submit green;
- all 9 CSA narrative/readback/remove coverage green;
- desktop, mobile `390x844`, and at least one wider mobile/tablet viewport;
- no blocking loader/fallback over Story streaming;
- no fabricated/crossed identity;
- DB/state/turn evidence agrees with visible Story/UI;
- screenshots visually inspected as the user sees them;
- retained sidecars usable or explicitly owner-deferred;
- no known objective P0/P1/P2 defect remains.

## 7. Safety boundaries

- TEST only; no Production.
- Fresh disposable R3 TEST games authorized; preserved/manual/evidence games read-only forever.
- No provider/model/API URL/key/secret change to mask defects.
- No timeout inflation from the accepted first-content evidence.
- No retry-until-pass, hidden retry/regeneration, second Story/choice LLM.
- No generic semantic classifier/NER/fuzzy identity mapper/physical ontology/consent DSL.
- No browser-owned orchestration replacing A-prime server-owned authority.
- Migrations only if a proven defect truly requires an additive independently reviewed migration; never rewrite applied history.
- Re-read latest Issue #68 before every source landing and TEST deploy decision.
- Fast-forward push only; never force-push/rewrite remote history.

## 8. Exit criteria / reporting

Remain `READY` while any known objective P0/P1/P2 defect or untested canon-retained behavior remains.

`WAITING_USER_FINAL_PLAYTEST` / `OWNER_READY` is forbidden until the complete deployed evidence matrix above is green. Only subjective narrative taste, emotional nuance, character appeal and pacing preference may remain for owner manual play.

Use Issue #68 for compact `AUTONOMOUS_LIVE_QA_ITERATION` reports containing exact main SHA, TEST versions, disposable game IDs/viewports, reconnect transport evidence, timings, turns/scenarios, defects, fixes, regression/live replay result, remaining gaps and next loop action.

If fixed-sample diagnostics remain ambiguous, a push/deploy race occurs, or a safety boundary is hit, post exact evidence and STOP. Otherwise continue this SAME task; do not create a new feature task because one iteration completed.
