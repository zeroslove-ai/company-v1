# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: GENERIC TURN-TRANSPORT RECONCILIATION -> ONE B3 REPLACEMENT -> CLOTHING CSA B4-B6 -> ALL 9 CSA / LOCATION / AGENCY / 30+ / 15+ / 50+ OBJECTIVE LIVE QA
Updated: 2026-08-22 17:43 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/task-registration branch, recovery branch, alternate execution authority, or competing Task ID.

## 0. Binding authority / architecture

Continue the same autonomous R3 objective-QA program. Automation owns objective QA until the full deployed matrix is green; `OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remains forbidden before then.

Binding authority remains:
- owner product canon PR #95 `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine canon PR #96 `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- `docs/redesign/00_*` through `11_*`;
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`;
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`;
- owner UX directive Issue #68 `5379158664`;
- owner CSA addendum Issue #68 `5379172519`;
- prior operator review `5379246156`;
- latest operator review `5379384917`;
- this exact CURRENT_TASK blob once registered by `CURRENT_TASK_READY`.

A-prime architecture remains exactly:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

The server committed context is canonical. Browser code may present, stream and reconcile transport state but must never become a semantic/gameplay writer.

## 1. Reviewed terminal and frozen progress

Latest terminal:
- terminal comment `5379369533`;
- terminal task blob `6862475dfb439f77910528d23f2025ceb1080908`;
- start/final main `948079fd4627dd1d4ac36fd41847b5ad60cc168a`;
- operator review `5379384917`.

Accepted executable before this registration remains:
`dd62988a121d586d333e7297b5b7cb4b4d8841d1`.

Accepted TEST baseline at terminal:
- API `game-proxy-company-r3` version `bad0bbeb-574a-4d82-8875-3ade37df3de8`;
- frontend `gamebuilder-company-r3` version `012186e3-9144-43bb-8c48-521a7bd944bb`.

No source/test/config/deploy change occurred during the terminal lease. Main stayed at the task-registration SHA.

### 1.1 Reference calibration is COMPLETE for this QA cycle

Phase A Hospital/Gamebuilder v2 and old Company V1 reference calibration was completed under the prior lease and reported in Issue #68 `5379321494`.

Do NOT repeat reference discovery/play merely because later R3 transport blocked. Preserve the accepted `REFERENCE_KEEP` / `REFERENCE_REJECT` / `R3_GAPS_TO_REPLAY` evidence and continue current R3 work.

Reference systems remain read-only historical UX calibration; do not repair/redeploy/mutate them.

### 1.2 Current clothing campaign progress

Disposable current-R3 fixture:
`edc5704b-aff7-44d3-92f2-b5882f217e13`.

Accepted progress:
- Setup + Opening completed;
- one ordinary Turn 1 committed through the real UI;
- exact Turn 1 literal:
  `서원희 차장에게 오늘 회의 자료를 검토해 달라고 조심스럽게 건넨다.`
- canonical `no_panties_under_work_clothes` / `r3_csa_1` applied once through browser UI;
- active rule/readback and finite clothing state were coherent;
- no unrelated sexual/relationship state was manufactured.

B3 attempted movement:
`회의실로 이동해 창가 자리에 앉는다.`

The movement was submitted exactly once through the real browser UI, then browser showed `Failed to fetch`.

Immediate read-only context after the error proved:
- same game id;
- `revision=2`;
- `committed_turn=1`;
- only Turn 0 / Turn 1;
- `job={}`;
- no Turn 2 reservation/action/job/commit/failed attempt.

One refresh restored the same game and active rule. The movement literal remained in the input field and was NOT resubmitted.

Therefore this failed request has **zero durable server footprint** and is not a Story/Observer/CSA result.

## 2. Deterministic frontend gap proven by the terminal

Current `frontend-r3/app.js` reconciles server state after `r3_stream_reconnect_required`, but a raw browser `fetch()` rejection such as `TypeError: Failed to fetch` falls through to merely showing the error.

This is now a proven generic product/recovery gap because the browser cannot distinguish:
- request never reached server;
- server has a processing job but response/connection was lost;
- server committed but response/stream was lost;
- server has a failed job.

The fix is **transport reconciliation only**, not automatic retry.

### Required behavior after a turn transport/stream error

After any network/stream transport failure from the turn submission path, perform at most ONE read-only context reconciliation for the current game before deciding UI state.

Classify canonical server result:

A. committed turn advanced / committed context available
- render canonical committed context;
- clear input only when the exact action is durably committed;
- report saved/recovered state.

B. next-turn job is `processing`
- render context;
- call the already-existing bounded `recoverPendingTurn()` path;
- do not POST again.

C. next-turn job is `failed`
- render failed context and existing explicit Retry control;
- do not POST again automatically.

D. no new job and committed_turn unchanged
- classify `TURN_NOT_SENT_NO_SERVER_FOOTPRINT`;
- preserve exact literal in the input;
- show clear non-technical user status that the action was not sent/saved and can be explicitly submitted again;
- do not auto-resubmit.

E. reconciliation GET itself fails
- keep the original transport failure visible and preserve the literal;
- do not guess server state;
- do not auto-resubmit.

This behavior must remain generic. Do not special-case Cloudflare, a specific rule, action text, location or template id.

## 3. Hard prohibitions

Do NOT:
- automatically replay/resubmit a failed action;
- add exponential retry, hidden retry or retry-until-pass;
- add second Story/Observer/choice LLM;
- change provider/model/API key/API URL/temperature/token limits/Story or Observer timeouts;
- add semantic classifier/gate, NER, fuzzy matching, physical ontology or consent DSL;
- add Cloudflare compatibility flags, route rewrites, service bindings or deployment workarounds without new deterministic routing evidence;
- change Story/CSA semantics as part of the transport fix;
- mutate/reset preserved/manual/historical evidence games;
- use direct API gameplay as live acceptance;
- access/deploy Production;
- create a new task/ops/recovery branch.

Provider budgets stay Story first-content 30s / total 120s / Observer 75s.

## 4. Phase T1 — implement the narrow generic frontend correction

Primary expected source:
- `frontend-r3/app.js`

Tests may change as needed. Avoid unrelated refactors.

Implementation expectations:
1. Keep the generated action id / expected turn / literal available across the single submission attempt and reconciliation.
2. Normalize transport failure handling at the controller boundary, not in Story/provider/domain semantics.
3. On turn fetch rejection or stream transport failure, reconcile context once.
4. Never generate a second POST from reconciliation.
5. Preserve literal input for no-footprint/unknown cases.
6. Do not clear literal merely because a request was attempted.
7. If context proves commit, render server canonical result and clear appropriately.
8. If context proves processing, use existing recovery polling only; no second Story request.
9. If context proves failed, expose existing explicit failed-action Retry UX.
10. Keep choice authority, CSA UI, MM, history, TTS and location/map behavior unchanged.

If a smaller helper extraction is useful for testability, keep it within the frontend controller boundary and generic.

## 5. Phase T2 — deterministic tests before deploy

Add/extend focused frontend/controller tests proving at minimum:
1. raw `fetch` rejection + context no footprint => exactly one original POST, exactly one context read, input preserved, no second POST;
2. transport/stream failure + context committed => canonical committed context rendered, no second POST;
3. transport/stream failure + context processing => existing recovery path used, no second POST;
4. transport/stream failure + context failed => failed state / explicit Retry preserved, no automatic POST;
5. context reconciliation itself fails => literal preserved, no guessed commit, no second POST;
6. successful ordinary turn behavior unchanged;
7. explicit Retry failed action still requires user action and remains same-row semantics;
8. choice clicks still submit exactly one literal POST;
9. free Korean input still submits exactly one literal POST;
10. no Story/provider/model/config/timeout code changed.

Run:
- focused frontend/controller tests;
- full `npm test`;
- `node --check` for changed JS/MJS;
- `git diff --check`.

Reread Issue #68 immediately before landing.

Land fast-forward only on `main`.

If only frontend source changed:
- deploy TEST frontend only;
- do NOT redeploy API;
- record exact frontend Worker Version ID;
- verify TEST API version remains the accepted API baseline unless independently changed by a newer authorized task (which would invalidate this lease).

## 6. Phase T3 — deployed transport acceptance before semantic QA resumes

After TEST frontend deploy, attach browser instrumentation BEFORE the action:
- request URL/method/resource type;
- response status where available;
- `requestfailed` failure/error text;
- browser console/pageerror;
- current game id;
- expected_turn/action_id if observable from the client harness;
- post-error canonical context readback.

Do not use direct API gameplay as acceptance.

### 6.1 Bounded non-mutating browser-origin transport diagnostics

Before mutating the clothing fixture, it is permitted to issue a very small bounded set of browser-origin network diagnostics against the current TEST API solely to distinguish browser/CORS/platform transport from gameplay semantics. Prefer non-mutating routes (`catalogs`, OPTIONS, or a nonexistent disposable game id that cannot reserve/commit a turn). Do not invoke a real Story merely for diagnosis.

Record exact success/failure and stop diagnostics once the boundary is classified. Do not stress/sample indefinitely.

### 6.2 Exactly one B3 replacement is authorized

Because terminal evidence already proved the prior B3 request created **zero server footprint**, exactly ONE explicit replacement submission of the same movement literal is authorized after the new frontend reconciliation deploy:
`회의실로 이동해 창가 자리에 앉는다.`

Use the same disposable fixture `edc5704b-aff7-44d3-92f2-b5882f217e13` if its readback still exactly matches the frozen terminal state and no newer action/job exists. Otherwise preserve it and use one fresh equivalent disposable clothing fixture; explain why.

This replacement is not provider pass-seeking because there was no prior server action. It is nevertheless bounded to ONE attempt.

Acceptance if it commits:
- exactly one POST for the replacement;
- literal parity exact;
- canonical location movement/Story/readback coherent enough to continue B3;
- refresh once after commit;
- same game/save returns;
- active rule persists;
- finite clothing state remains coherent;
- no unrelated/off-scene female enumeration caused by broad scope.

If the replacement transport fails again:
- allow the new reconciliation behavior to run;
- capture browser/network evidence and canonical result;
- if no footprint again, STOP `BLOCKED_R3_REPEATED_BROWSER_TRANSPORT_AFTER_RECONCILIATION_FIX`;
- do not submit again and do not sample a second replacement.

If server footprint exists, follow canonical committed/processing/failed state; never blindly replay.

## 7. Resume clothing CSA campaign B4-B6 only after B3 transport is green

Do not rerun Phase A references.

### B4 — behaviorally decisive active policy conversation

With the clothing rule still active, submit exactly one natural direct domain inquiry:
`서원희 차장에게 요즘 여성 직원 근무복 규정에서 속옷 관련 기준이 있는지 묻는다.`

Capture literal/request, Story input active_rules if diagnostics expose it, raw Story, Observer raw/applied, state_after/readback, clothing/MM/choices/location/presence, timings, screenshot and console/network evidence.

PASS:
- Story is consistent with the active institutional premise;
- exact scope preserved;
- no mechanical system/hypnosis exposition;
- hidden facts are not visually invented, but direct policy discussion does not deny/evade the active rule;
- NPC personality remains specific;
- no affection/comfort/consent/desire/romance/obedience/trust/relationship state manufactured merely from CSA;
- player target/topic/request preserved.

Deterministic FAIL here may authorize only the previously bounded smallest generic Story-contract correction. One semantic replay maximum after such a correction. No model/provider/config tuning.

### B5 — ordinary interleaving

If B4 passes, submit one different mundane/nonsexual company-life turn.
Prove Story naturally returns to ordinary life and does not become permanently CSA-focused.

### B6 — remove semantics

Remove the same rule once through browser UI.
Prove revision increases while gameplay turn does not and active rule disappears from future Story context/readback.

Then play one or two ordinary follow-up turns.

Removal law:
- stops future enforcement;
- is NOT memory wipe/time rewind;
- prior historical conversation may remain remembered;
- physical slot need not instantly revert merely because rule was removed;
- new Story must not treat the removed rule as currently binding.

Post Phase-B heartbeat with transcript/evidence and `CLOTHING_CSA_UX: PASS` or exact blocker.

## 8. Continue the full objective matrix automatically when clothing is green

Do not terminal merely because clothing CSA passes.

Continue SAME Task ID through:
1. all 9 canonical CSA live-UX campaigns, one rule per clean fixture where practical;
2. request/interaction CSA special axis;
3. four canonical locations;
4. presence exact-name evidence and grounded entrant MM;
5. bounded current `scene_note` with stale ended entities/actions disappearing;
6. semantic agency regressions:
   - ask 한리브 about lunch must not become 김제나/work;
   - `혼자 있고 싶다` must be respected;
   - `허리를 만진다` must not become touching a table edge;
7. fresh primary ordinary campaign 30+ committed turns;
8. materially different independent campaign 15+;
9. long-memory campaign 50+;
10. Story exact-four choice reliability stats without fabricated/prior fallback;
11. latency submit -> first Story token -> Story complete -> Observer -> commit, derive p50/p95 when sample permits;
12. history/export/download;
13. reconnect/reload;
14. duplicate-submit and explicit failed-job retry;
15. TTS and feedback if retained by current product canon;
16. desktop, 390x844 and wider mobile/tablet viewports.

For each CSA template prove:
`apply -> revision increases while gameplay turn unchanged -> relevant multi-turn Story UX -> observer/readback/structured state as applicable -> remove -> future Story no longer treats rule as active`.

RPC/state success alone is not acceptance.

No retry/sample-until-pass. Harness/no-server-footprint transport replacement is allowed only where this task explicitly grants a bounded replacement after proving absence.

## 9. Terminal / heartbeat policy

Post `PROGRESS_HEARTBEAT` at major phase boundaries and roughly every 15 minutes during long execution.

Terminal reports must include:
- exact task blob;
- start/final main SHA;
- changed paths and source commit;
- focused/full test results and syntax/diff checks;
- TEST API/frontend Worker versions;
- exact transport classification and number of POSTs;
- fixture IDs, literals, action/job/readback evidence;
- Story/Observer/state evidence for semantic phases;
- remaining matrix.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` is forbidden until the full objective matrix above is green.