# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: POST-RELOAD TURN TRANSPORT DURABLE CLASSIFICATION -> NARROW RECOVERY -> CSA STORY-EFFECT -> FOUR-LOCATION / SCENE / AGENCY -> 15 / 50 / 9-CSA CONTINUOUS TEST LIVE-QA
Updated: 2026-08-22 15:37 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/task-registration branch, recovery branch, or alternate execution authority.

## 0. Binding architecture / safety

Automation owns objective QA until the deployed exit matrix is green. `OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` is forbidden before then.

Binding authority remains:
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`
- owner-locked product canon PR #95 `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- A-prime canon PR #96 `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- `docs/redesign/00_*` through `11_*`
- latest accepted R3 source on main
- latest explicit Issue #68 operator decisions.

Architecture remains exactly:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Forbidden unless this task proves a narrow defect:
- provider/model/API URL/key/config/temperature/token/timeout changes;
- automatic Story retry/regeneration or second Story/choice LLM;
- generic NER/fuzzy/nearest/semantic actor/location matching;
- physical ontology or consent DSL;
- browser-owned Story/Observer/Commit orchestration;
- migration/history repair or Production access/deploy;
- preserved historical/manual/evidence game reset/mutation;
- direct-API substitution for browser acceptance;
- resubmitting an action merely because the browser lost the response.

Provider budgets remain Story first-content 30s / Story total 120s / Observer 75s.

## 1. Accepted terminal / frozen progress

Latest terminal:
- terminal comment `5378339600`
- operator review `5378566209`
- terminal task blob `5f27561d65da467562128f68f07fe78db390591d`
- registration main `8d229236cbb6b225819f61f8009ef294a545127b`
- verified terminal/final main `77d1391a16e891793a0682833bc5ce9ac88c5dfd`

Accepted TEST identities:
- API remains `game-proxy-company-r3` version `6e86c32e-22e5-400c-8bdb-9ae4ef7a639a`
- frontend after accepted layout correction: `gamebuilder-company-r3` version `012186e3-9144-43bb-8c48-521a7bd944bb`

Accepted final source delta from registration to terminal is exactly one FF commit and exactly two paths:
- `frontend-r3/hospital-shell.css`
- `test/r3-frontend-contract.test.mjs`

The accepted correction is narrow: `.action-panel` reserves `min-height: min-content` so action controls remain interactable above the audio bar after bootstrap/reload. Reported full suite is 467/467 PASS; syntax/diff-check/dry-run and TEST frontend deployment passed.

Do NOT reopen this layout correction absent new deterministic evidence.

### Frozen GREEN boundaries

Keep frozen absent new deterministic evidence:
1. P0 explicit failed-turn retry, same-row attempt fencing, stage-aware stale terminalization, invocation-based Story deadline, duplicate/reconnect baseline.
2. Story is sole canonical current-choice authority; Observer mismatch is diagnostic only when exact Story-tail choices survive; no Story tail => no fabricated/prior fallback.
3. Clean-30 fixture `4debc85b-2e19-4d0b-96cb-177e7379df1e`: literal parity 30/30; exact-four Story tail 16/30; no-tail 14/30; max no-tail streak 6; fabricated/prior fallback 0. Do not rerun merely to improve statistics.
4. Mind Monitor canonical actor-ID closure and same-turn grounded entrant mechanics.
5. Exact canonical-name enter/exit grounding; `박 팀장` is not canonical `박정우`; no alias/fuzzy/title repair.
6. Active CSA Story-context source `a4608ff7710468dd34ca7858ccaaf869eb9908bd`: active canonical rules are passed once into Story with scopes; source/test/deployment accepted.
7. Generic deployed browser submit: fresh control `650a615d-1612-4936-9e21-9adb4aba4cb7` proved one button click -> one `/turn` -> one exact literal -> one commit.
8. Fresh active-CSA same-page path: disposable `490f54c9-1675-421c-ba66-ab9dbfe5ce97` proved baseline submit, CSA apply with revision increase/no gameplay-turn increase, and same-page active-CSA submit.
9. The old fixture `a764e547-0eaf-4917-8cc5-e96bbb370c79` remains preserved/read-only at revision 6 / committed_turn 5.

## 2. New decisive blocker

Fresh replay fixture:
`017fdee2-ec0d-45e0-a866-1183afab0e74`

Proven before blocker:
- Setup + Opening passed;
- baseline one-click turn passed;
- CSA UI apply passed;
- same-page active-CSA one-click turn passed;
- one reload passed full readiness barrier;
- after reload UI showed Turn 2, exact game/API identity, context 200, connected status, overlays hidden, no active job, unique enabled action input/button.

Exactly one post-reload action was filled and clicked:
`자리에서 일어나 서원희 차장에게 팀의 업무 분위기에 대해 가볍게 대화를 나눈다.`

Browser evidence:
- exactly one `/turn` request was emitted;
- `literal_action` matched exactly;
- `expected_turn=3`;
- request ended as `Network.loadingFailed net::ERR_FAILED`;
- no response was visible to browser;
- UI remained Turn 2;
- no retry was attempted.

This browser result alone does NOT establish whether the server received/reserved/processed/committed Turn 3.

## 3. FIRST ACTION — durable read-only classification before any replay or source mutation

Before clicking anything or changing source, inspect TEST durable/readback state for `017fdee2-ec0d-45e0-a866-1183afab0e74`.

Record exactly:
- current `revision`;
- current `committed_turn`;
- turns present and whether Turn 3 exists;
- current `job` readback;
- Turn-3 action/job row if any;
- exact `literal_action`;
- `action_id` if available;
- `attempt_no`;
- job `status`, stage, stage_started_at, error_code if present;
- committed Turn-3 Story / Observer raw / Observer applied / state_after / choices / mind_monitor if present;
- active CSA readback.

Post `PROGRESS_HEARTBEAT` with one of these classifications:
A. `TURN3_COMMITTED_AFTER_BROWSER_LOSS`
B. `TURN3_PROCESSING_AFTER_BROWSER_LOSS`
C. `TURN3_FAILED_AFTER_BROWSER_LOSS`
D. `TURN3_RESERVED_OR_PARTIAL_AFTER_BROWSER_LOSS`
E. `NO_TURN3_SERVER_FOOTPRINT`

Do not mutate the fixture while classifying it.

## 4. Branch A/B/C/D — server footprint exists: diagnose browser transport/reconnect only

If any Turn-3 server footprint exists, do NOT submit that literal again.

First use read-only evidence to determine whether the server completed, is still processing, failed, or is partial/stale.

### 4.1 If already committed

This is a browser response/SSE-loss recovery defect, not gameplay failure.

Inspect only:
- `frontend-r3/app.js` submit error handling;
- `frontend-r3/r3-client.js` fetch/SSE consumption;
- existing reconnect/recovery tests.

Current known source boundary: submit recovery explicitly performs context/recovery for `r3_stream_reconnect_required`, while a generic browser fetch/stream network exception can fall through to plain error status without durable context reconciliation.

Allowed correction only if evidence matches:
- after a turn request has been attempted and an ambiguous transport/network exception occurs, perform one read-only context reconciliation;
- if the intended turn is already committed, render committed context and do not resubmit;
- if the job is processing, use the existing recovery/poll path without a second `/turn` submission;
- if failed, surface the committed failed-job state and preserve explicit user-controlled retry only;
- if no corresponding job/turn exists, do not fabricate success and do not auto-resubmit.

No second action submission. No hidden retry. No browser-owned Story/Observer/Commit.

### 4.2 If processing / partial

Use existing job readback and stage-aware lease behavior. Do not submit again.
If existing recovery correctly settles it, prove one browser reload/recovery reaches exactly one terminal commit/failure.
If generic transport error prevents entering existing recovery, the same narrow reconciliation fix above is authorized.

### 4.3 If failed

Do not retry merely for this QA sample. Confirm the failed row/action identity and classify the underlying error separately. Existing explicit retry remains frozen and user-controlled.

## 5. Branch E — no Turn-3 server footprint: isolate dispatch/CORS/network once

If read-only evidence proves there is no Turn-3 job/action/reservation at all, classify this as browser->API dispatch/transport failure.

Do not click the same fixture again.
Use ONE new disposable diagnostic game and ONE bounded post-reload action sequence:
1. Setup + Opening;
2. one baseline browser turn;
3. apply the same CSA rule once;
4. one same-page browser turn;
5. reload once and pass full readiness barrier;
6. attach request/response/requestfailed/pageerror/console instrumentation;
7. submit one different neutral action exactly once.

Capture:
- exact request URL and method;
- request headers relevant to CORS/Origin/content-type;
- whether OPTIONS occurs;
- requestfailed failure text;
- whether API sees/reserves the action via immediate read-only context;
- frontend origin and API origin;
- status/banner transitions.

Do not change API CORS, client headers, or runtime until this one fresh reproduction proves the boundary.

If the new fixture succeeds, classify the prior net error as a bounded transient/anomalous transport sample and continue without source patch. Do not sample repeatedly until pass.

## 6. Deterministic regression requirements for any frontend transport correction

If a narrow correction is authorized by Branch A/B/C/D, add tests proving at least:
1. network/stream loss after server commit causes one context reconciliation and zero second `/turn` submissions;
2. committed context wins and UI advances to the committed turn;
3. processing job enters existing recovery without duplicate submit;
4. failed job is surfaced and still requires explicit user retry;
5. no-job readback after transport loss does not auto-resubmit and keeps user control;
6. exact literal action bytes are unchanged;
7. normal successful SSE path remains one submit/one commit;
8. choice click path remains unchanged;
9. refresh/reconnect existing contracts remain green;
10. no generic retry/regeneration or direct API bypass is added.

Run focused frontend/recovery/transport tests, full npm, changed JS syntax and `git diff --check`.
Re-read Issue #68 before landing. FF only.
Deploy TEST frontend only if frontend source changes. API deploy only if API source actually changes and a deterministic API defect was proven; otherwise preserve API version.

Use one new disposable replay after deployment. No pass-seeking loop.

## 7. Resume active CSA Story-effect acceptance after transport is green

Use a valid active-CSA fixture after transport classification/recovery. Do not reapply a rule already active.

For active `no_panties_under_work_clothes`, capture:
- exact literal storage;
- Story active-rule effect when scene-relevant;
- Observer raw/applied;
- state_after/readback;
- clothing state;
- MM;
- choices;
- scene/location/presence;
- timings.

Acceptance:
- Story reflects the institutional premise/scope when relevant;
- no invented affection, comfort, consent, desire, romance, obedience, relationship, or player sexual state;
- RPC/storage activation alone is insufficient.

If one sample is not scene-relevant, record the miss and continue coherently; do not replay/sample until pass.

Then remove the rule:
`remove -> revision increases while gameplay turn unchanged -> csa_active absent -> exactly one next ordinary Story -> removed premise no longer applies`.

## 8. Four canonical locations / presence / scene_note / semantic agency

After CSA closure, continue on new disposable fixtures.

Four locations full chain:
`literal action -> Story exact canonical destination name -> observer_raw -> observer_applied -> state_after -> next Story/context/map`.
No fuzzy/nearest/generic-room upgrade.

Presence:
- exact canonical actor-name grounding;
- player movement alone cannot create NPC enter/exit;
- same-turn grounded entrant may receive MM;
- unrelated/off-scene actors cannot be injected.

scene_note:
- bounded current snapshot;
- stale ended people/objects/actions must not accumulate indefinitely.

Semantic agency must preserve actor, target/counterparty, action, movement/direction, request/refusal, self-state, and topic/intent.
Explicit regression targets remain:
- ask 한리브 about lunch must not become 김제나/work talk;
- `혼자 있고 싶다` must be narratively respected;
- `허리를 만진다` must not become touching a table edge.

Do not build a generic semantic classifier/gate.

## 9. Remaining objective campaigns

When P1 is green continue the SAME task through:
1. materially different independent 15+ turn campaign;
2. long-memory 50+ turn campaign;
3. dedicated clothing CSA fixture;
4. dedicated request/interaction CSA fixture;
5. all 9 canonical CSA templates.

For every CSA template prove:
`apply -> revision increases while gameplay turn unchanged -> relevant scene -> Story premise/scope effect -> observer/readback/structured state as applicable -> remove -> next Story/readback confirms removal`.

Continue choice reliability measurement without retry/regeneration/fallback fabrication.

## 10. Latency / retained surfaces / viewports

Across campaigns capture submit, response headers when available, first Story token, Story complete, Observer start/complete, commit; derive p50/p95 when sample permits. Measure before optimize.

Retain checks for:
- history/export/download;
- reconnect/reload;
- duplicate submit and explicit failed-job retry;
- TTS where current product contract retains it;
- feedback if current canon retains it;
- desktop, 390x844, and wider mobile/tablet viewport.

## 11. Heartbeat / terminal policy

During long QA phases post `PROGRESS_HEARTBEAT` about every 15 minutes.

On deterministic defect:
- preserve exact deployed evidence;
- narrow-fix only the proven boundary;
- validate and FF land;
- exact TEST deploy only as needed;
- no provider pass-seeking or hidden retries.

Before every landing/deploy re-read Issue #68 and verify no newer execution authority exists.

Terminal must include exact task blob, start/final main, changed paths, tests, TEST versions, fixture IDs, literal/request/job/readback evidence, warnings classified as diagnostic vs blocker, and remaining matrix.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remains forbidden until the full objective matrix is green.