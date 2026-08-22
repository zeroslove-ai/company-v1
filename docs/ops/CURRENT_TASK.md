# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: POST-FIX CSA SAMPLE DURABLE CLASSIFICATION -> ONE VALID CLOTHING ACCEPTANCE -> FOUR-LOCATION / SCENE / AGENCY -> 15 / 50 / 9-CSA CONTINUOUS TEST LIVE-QA
Updated: 2026-08-22 16:29 KST
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
- current accepted R3 source on main
- latest explicit Issue #68 operator decisions.

Architecture remains exactly:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Forbidden unless a new deterministic defect specifically proves otherwise:
- provider/model/API URL/key/config/temperature/token/timeout changes;
- automatic Story retry/regeneration or second Story/choice LLM;
- generic semantic classifier/gate, NER, fuzzy/nearest actor/location matching;
- physical ontology or consent DSL;
- rule-specific semantic if/else engines;
- browser-owned Story/Observer/Commit orchestration;
- migration/history repair or Production access/deploy;
- preserved historical/manual/evidence game reset/mutation;
- direct-API substitution for browser acceptance;
- retry/sample-until-pass behavior.

Provider budgets remain Story first-content 30s / Story total 120s / Observer 75s.

## 1. Accepted terminal / source closure

Previous terminal:
- terminal comment: `5379012305`
- operator review: `5379026845`
- terminal task blob: `86334f20b015f37bc7874bae924e6388cad82448`
- terminal workflow head: `8bf2f4d8a306d6581a10c19c3df35eb4fbe395ec`
- accepted source final/main: `dd62988a121d586d333e7297b5b7cb4b4d8841d1`

Accepted TEST identities:
- API: `game-proxy-company-r3` version `bad0bbeb-574a-4d82-8875-3ade37df3de8`
- frontend: `gamebuilder-company-r3` version `012186e3-9144-43bb-8c48-521a7bd944bb`

Accept and freeze `dd62988...` absent new deterministic evidence. Independent source diff from registration is one FF commit touching only:
- `runtime-r3/server/provider.js`
- `test/r3-opening-contract.test.mjs`
- `test/r3-source-correction.test.mjs`

Reported validation is accepted:
- focused 20/20 PASS;
- full 468/468 PASS;
- changed JS/MJS syntax PASS;
- `git diff --check` PASS.

The Story prompt now generically states that every non-empty `active_rules` entry is an authoritative current-world institutional/system fact already in force; exact content and scope are preserved; materially relevant scenes/actions/consequences must make the premise visibly true; irrelevant scenes must not force exposition; no active rule may manufacture affection, comfort, consent, desire, romance, obedience, relationship, or player sexual state beyond explicit rule content.

Do NOT edit this prompt again before obtaining one valid post-fix relevant live Story sample.

## 2. Frozen GREEN results

Do not reopen absent new deterministic evidence:
1. P0 explicit failed-turn retry / same-row attempt fencing / stage-aware stale terminalization / invocation-based Story deadline / duplicate-reconnect baseline.
2. Story is sole canonical current-choice authority. Observer mismatch is diagnostic only when exact Story-tail choices survive. No Story tail => no fabricated/prior fallback; free input remains usable.
3. Clean-30 fixture `4debc85b-2e19-4d0b-96cb-177e7379df1e`: literal parity 30/30; exact-four Story tail 16/30; no-tail 14/30; max no-tail streak 6; fabricated/prior fallback 0. Do not rerun merely to improve statistics.
4. Mind Monitor canonical actor-ID contract and exact canonical-name enter/exit fail-closed behavior.
5. Action-panel bootstrap/layout correction `77d1391a16e891793a0682833bc5ce9ac88c5dfd` and TEST frontend deployment.
6. Generic deployed browser submit.
7. Fresh active-CSA same-page and post-reload submit/commit path. Diagnostic fixture `39ccffb6-5893-438a-b239-d7da51d983fc` proved post-reload `/turn` HTTP 200 and Turn 3 commit; earlier isolated `net::ERR_FAILED` remains a bounded anomaly.
8. CSA apply/remove transaction semantics: revision changes without gameplay-turn change, active rule readback toggles correctly, post-removal ordinary Story commits.
9. Active canonical rules are projected once into Story context with id/template/content/mode/trigger/strength/subject_scope/counterparty_scope; inactive rules excluded.

## 3. Current terminal sample is INVALID for Story-premise judgment

Terminal disposable fixture:
`86c5f524-b08c-4891-8ad4-ab51b75e3ce6`

What happened:
- Setup and Opening completed.
- `no_panties_under_work_clothes` was applied once through deployed CSA UI.
- UI showed one active rule and gameplay remained Turn 0.
- exactly one ordinary UI action was submitted:
  `서원희 차장이 자리에 앉아 자료를 정리하는 모습을 잠시 살펴보고, 회의 자료의 다음 검토 순서를 묻는다.`
- browser then reported `Failed to fetch`;
- history remained Opening-only;
- no Story/Observer/state_after/readback was available in the browser;
- no retry or second sample occurred.

Therefore this is a transport-invalid sample, not a Story-premise pass/fail.

The literal is also a weaker relevance probe because it does not explicitly concern clothing. Under the corrected prompt's own irrelevant-scene rule, it must NOT be used as the decisive clothing premise sample merely because the rule is active.

## 4. FIRST ACTION — read-only durable classification of fixture 86c5...

Before any gameplay mutation or source edit, inspect TEST readback/durable state for `86c5f524-b08c-4891-8ad4-ab51b75e3ce6`.

Record:
- revision;
- committed_turn;
- turns present;
- current job;
- whether an action/job/reservation exists for the submitted literal;
- action_id / attempt_no / status / stage / error_code if present;
- exact stored literal_action;
- committed Story / Observer raw / Observer applied / state_after / choices / MM if present;
- active CSA readback and rule fields.

Post `PROGRESS_HEARTBEAT` with one classification:
A. `POSTFIX_SAMPLE_COMMITTED_AFTER_FETCH_LOSS`
B. `POSTFIX_SAMPLE_PROCESSING_AFTER_FETCH_LOSS`
C. `POSTFIX_SAMPLE_FAILED_AFTER_FETCH_LOSS`
D. `POSTFIX_SAMPLE_RESERVED_OR_PARTIAL_AFTER_FETCH_LOSS`
E. `POSTFIX_SAMPLE_NO_SERVER_FOOTPRINT`

Do not resubmit while any footprint exists.

### Branch A
If already committed, inspect the actual Story. Because the literal did not explicitly concern clothing, classify relevance honestly. Do not manufacture a pass/fail from an unrelated scene. If Story naturally made clothing/premise materially relevant, judge it; otherwise preserve as non-decisive evidence and proceed to one dedicated relevant fixture only if no duplicate semantic sample is being substituted.

### Branch B/C/D
Do not submit again. Use existing readback/recovery semantics only. If it eventually commits, handle as Branch A. If failed, record the exact failure and do not retry this action for QA.

### Branch E
Preserve the fixture. The failed browser request had no server effect and may be replaced by exactly one new disposable dedicated clothing acceptance fixture. This is harness-invalid replacement, not provider pass-seeking.

If the read-only classification itself shows a new deterministic transport/system defect, STOP before touching Story semantics.

## 5. ONE decisive post-fix dedicated clothing acceptance

Use ONE NEW disposable R3 TEST game only when Section 4 permits it.

Do not change source, prompt, provider, model, config, timeouts, API deployment, or frontend before this sample unless source/deployment identity is proven stale.

Sequence:
1. Setup + Opening once.
2. Apply canonical `no_panties_under_work_clothes` once through deployed CSA UI.
3. Prove revision increases while gameplay turn does not.
4. Read back exact active rule fields and scoped clothing state.
5. Wait for full browser readiness and attach request/response/requestfailed/pageerror/console observation.
6. Submit exactly ONE neutral but unambiguously clothing-relevant literal, without copying the rule text:
   `서원희 차장의 근무복 차림을 잠시 살펴보고 회의 자료를 건넨다.`
7. Capture exact literal/request, Story input context if existing diagnostics expose it, streamed Story, Observer raw/applied, state_after, committed readback, clothing, MM, choices, scene/location/presence and timings.

A valid sample requires an actual canonical Story turn. Browser `Failed to fetch` without durable Story is harness/transport invalid and cannot be called a Story failure.

### PASS criteria
For this materially relevant scoped scene:
- Story visibly reflects the active institutional premise as a current-world fact;
- effect stays inside exact rule content and subject/counterparty scope;
- narration is natural, not a mechanical quote of the rule;
- no invented affection, comfort, consent, desire, romance, obedience, relationship, or player sexual state;
- player actor/target/action/topic remain faithful;
- Observer/readback/clothing remain coherent.

### FAIL criteria
If a valid committed post-fix Story still materially discusses the scoped NPC's work-clothing state but silently ignores the active premise:
- STOP `BLOCKED_ACTIVE_CSA_STORY_PREMISE_AFTER_PROMPT_CLOSURE`;
- capture exact active_rules input and raw Story output;
- do NOT make another prompt edit, provider/model/config change, or second sample in this task.

### Repeated transport failure
If this new dedicated fixture again fails browser transport before any durable Story:
- classify server footprint read-only;
- STOP with repeated-current-deployment transport evidence if no valid turn can be recovered;
- do not keep sampling until one succeeds.

## 6. Remove + next Story proof after active sample PASS

After the valid active sample passes:
1. remove the same `r3_csa_1` once through deployed CSA contract;
2. revision increases while gameplay turn remains unchanged;
3. `csa_active` no longer contains the rule and active Story context no longer contains it;
4. submit exactly one different ordinary next action;
5. prove next Story/readback no longer applies the removed institutional premise unless ordinary non-rule continuity independently supports a fact.

Then continue automatically; do not stop merely because clothing CSA is green.

## 7. Four canonical locations

Use a NEW disposable fixture.
Prove at least four distinct registered canonical locations through:
`literal action -> Story exact canonical destination name -> observer_raw -> observer_applied -> state_after -> next Story/context/map`.

Requirements:
- exact canonical location names in movement literals;
- Story must not silently substitute destination/direction;
- Observer quote must be an exact Story substring;
- canonical mapping only from exact registered-name evidence already present in Story;
- next Story reads committed canonical location;
- map agrees with committed state;
- generic room labels must not be upgraded to a specific canonical room without exact evidence.

Stop on first deterministic divergence and fix only that proven boundary.

## 8. Presence / scene_note / semantic agency

Presence:
- entered/exited require exact canonical actor-name evidence;
- player movement alone cannot create NPC enter/exit;
- same-turn grounded entrant may receive MM;
- unrelated/off-scene actors cannot be injected.

scene_note:
- bounded current-scene snapshot;
- stale ended people/objects/actions must disappear rather than accumulate.

Semantic player agency must preserve:
- actor;
- target/counterparty;
- action;
- movement/direction;
- request/refusal;
- self-state;
- topic/intent.

Explicit historical regression targets:
- ask 한리브 about lunch must not become 김제나/work talk;
- `혼자 있고 싶다` must be narratively respected;
- `허리를 만진다` must not become touching a table edge.

Do not build a generic semantic validator/gate.

## 9. Remaining objective campaigns

When P1 is green, continue this SAME Task ID through:
1. materially different independent 15+ turn campaign;
2. long-memory 50+ turn campaign;
3. dedicated request/interaction CSA fixture;
4. all 9 canonical CSA templates;
5. clothing CSA retained regression if needed.

For every CSA template prove:
`apply -> revision increases while gameplay turn unchanged -> relevant scene -> Story premise/scope effect -> observer/readback/structured state as applicable -> remove -> next Story/readback confirms removal`.

RPC/storage success alone is not acceptance.
Institutional/system rules must not manufacture personal affection, comfort, consent, desire, romance, obedience, or relationship state beyond explicit content.

Continue choice reliability measurement without retry/regeneration/fabricated fallback. Frozen clean-30 remains 16/30 valid tails, 14/30 no-tail, max no-tail streak 6.

## 10. Latency / retained surfaces / viewports

Across campaigns capture submit, response headers if available, first Story token, Story complete, Observer start/complete and commit; derive p50/p95 when sample permits.

Retain checks for:
- history/export/download;
- reconnect/reload;
- duplicate submit and explicit failed-job retry;
- TTS where current product contract retains it;
- feedback if current canon retains it;
- desktop, 390x844 and wider mobile/tablet viewport.

## 11. Execution / terminal policy

Post `PROGRESS_HEARTBEAT` at major phase boundaries and about every 15 minutes during long QA.

No retry-until-pass. Harness-invalid no-server-footprint attempts are not gameplay retries, but prove absence before replacement.

Before every landing/deploy, re-read Issue #68 and verify no newer execution authority exists. Fast-forward only.

Terminal must include exact task blob, start/final main, changed paths, tests, TEST versions, fixture IDs, literal/request/job/readback evidence, Story/Observer/applied/state evidence, warnings classified as diagnostic vs blocker, and remaining matrix.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remains forbidden until the full objective matrix is green.
