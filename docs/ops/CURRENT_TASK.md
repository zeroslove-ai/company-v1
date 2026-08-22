# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: TEST-API 1042 ROUTE/DEPLOYMENT IDENTITY -> NARROW INFRA RECOVERY -> ONE VALID POST-FIX CLOTHING CSA ACCEPTANCE -> FOUR-LOCATION / SCENE / AGENCY -> 15 / 50 / 9-CSA CONTINUOUS TEST LIVE-QA
Updated: 2026-08-22 16:40 KST
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
- accepted R3 executable source on main
- latest explicit Issue #68 operator decisions.

Architecture remains exactly:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Global prohibitions remain unless this task proves the exact narrow exception:
- provider/model/LLM URL/key/temperature/token/timeout changes;
- Story prompt/CSA semantic edits while the API bootstrap blocker is unresolved;
- automatic Story retry/regeneration or second Story/choice LLM;
- generic semantic classifier/gate, NER, fuzzy/nearest actor/location matching;
- physical ontology or consent DSL;
- browser-owned Story/Observer/Commit orchestration;
- migration/history repair or Production access/deploy;
- preserved historical/manual/evidence game reset/mutation;
- direct-API gameplay substitution for browser acceptance;
- retry/sample-until-pass behavior.

Provider budgets remain Story first-content 30s / Story total 120s / Observer 75s.

## 1. Latest terminal and accepted source

Latest terminal:
- terminal comment `5379050261`
- operator review `5379071902`
- terminal task blob `5b0efd7821e12fd7478102d4e16a9af62f081c28`
- terminal start/final main `a5a3a9c7393d1bfc2611058d0604f0c5596f2ab9`

Accepted executable source remains:
`dd62988a121d586d333e7297b5b7cb4b4d8841d1`

Accepted TEST identities at terminal:
- API `game-proxy-company-r3` version `bad0bbeb-574a-4d82-8875-3ade37df3de8`
- frontend `gamebuilder-company-r3` version `012186e3-9144-43bb-8c48-521a7bd944bb`

`a5a3a9c...` is a docs-only descendant of accepted executable `dd62988...`.

Freeze `dd62988...` Story active-rule prompt closure absent a new valid committed Story regression:
- active rules are authoritative current-world institutional/system facts already in force;
- materially relevant scoped scenes/actions/consequences must make the premise visibly true;
- irrelevant scenes must not force exposition;
- exact content/scope preserved;
- no manufactured affection, comfort, consent, desire, romance, obedience, relationship or player sexual state;
- focused 20/20 and full 468/468 accepted;
- no further prompt/provider tuning before one valid post-fix live sample.

## 2. Frozen GREEN boundaries

Do not reopen without new deterministic evidence:
1. P0 explicit failed-turn retry, same-row attempt fencing, stale terminalization, invocation-based Story deadline, reconnect/duplicate behavior.
2. Story is sole canonical choice authority; Observer mismatch diagnostic-only when Story-tail choices survive; no Story tail means no fabricated/prior fallback.
3. Clean-30 `4debc85b-2e19-4d0b-96cb-177e7379df1e`: literal parity 30/30, valid exact-four tails 16/30, no-tail 14/30, max no-tail streak 6, fabricated fallback 0. Do not rerun to improve statistics.
4. Canonical actor-ID Mind Monitor contract and exact canonical-name enter/exit fail-closed behavior.
5. Action-panel layout correction `77d1391...` and TEST frontend deployment.
6. Generic browser submit and previously proven active-CSA same-page/post-reload turn path.
7. CSA apply/remove transaction semantics.
8. Active canonical rule projection into Story context exactly once.
9. Prior isolated post-reload `net::ERR_FAILED` classified bounded anomaly by a subsequent fresh 200/commit diagnostic. Do not add generic retry from that old sample.

## 3. Current decisive blocker — TEST API Cloudflare 1042 before gameplay

Preserved post-fix fixture:
`86c5f524-b08c-4891-8ad4-ab51b75e3ce6`

Read-only classification already proved:
- revision 1;
- committed_turn 0;
- Opening only;
- job null;
- zero Turn-1 job/action/reservation rows;
- active `r3_csa_1` remains present;
- the failed browser action had NO server footprint and must not be resubmitted.

The authorized replacement clothing fixture was not created. A fresh browser boot failed before Setup with:
`게임 화면을 불러오지 못했습니다: Failed to fetch`.

Independent local read-only probes to the current TEST API endpoint returned Cloudflare text error code `1042`, including `/api/r3/catalogs`.

`/api/r3/catalogs` is the decisive route because current `runtime-r3/server/worker.js` returns its catalog directly from loaded canonical content before any Supabase or LLM request. Therefore 1042 on that route is not evidence of a Story/provider/DB failure.

Repo facts to preserve during diagnosis:
- `wrangler.r3.api.jsonc`: name `game-proxy-company-r3`, compatibility date `2026-08-03`, `workers_dev: true`, no declared service binding, no `global_fetch_strictly_public` flag.
- API runtime's declared outbound hosts are Supabase and DeepSeek; catalog handling needs neither.
- `wrangler.r3.frontend.jsonc` is assets-only.
- `frontend-r3/app.js` constructs the API client from `query.get('api') || '/api/r3'`.
- Therefore exact browser URL, `api=` query value, deployed workers.dev hostname, any custom/proxy hostname and live Worker route/version identity are material evidence.

Cloudflare 1042 is diagnosis guidance for same-zone Worker-to-Worker fetch/routing. It is NOT by itself authorization to add a compatibility flag.

## 4. PHASE A — read-only deployment / hostname / route identity

Do not mutate source/config/deployment/game data before completing this phase.

Re-read Issue #68 and verify this exact task/blob/main authority.

Capture and post a `PROGRESS_HEARTBEAT` with all of the following:

### A1. Browser endpoint identity
From the exact TEST URL used by the failed fresh browser boot, record:
- full frontend origin;
- final browser URL after redirects;
- whether `api=` exists;
- exact decoded `api=` value if present;
- if absent, explicitly record that the client falls back to relative `/api/r3`;
- actual network request URL used for `catalogs`;
- any redirect chain;
- response status/body signature and relevant Cloudflare headers (`server`, `cf-ray`, error body/code) where available.

Do not guess an API hostname from a Worker name.

### A2. Direct deployed Worker identity
Using the existing authorized Cloudflare/Wrangler account context read-only:
- inspect current deployments/versions for `game-proxy-company-r3`;
- verify whether version `bad0bbeb-574a-4d82-8875-3ade37df3de8` is currently active and its source/config identity;
- obtain the exact workers.dev endpoint from authoritative deployment metadata/output, not string guessing;
- inspect any routes/custom domains/service bindings attached to this TEST Worker if the available read-only tooling exposes them;
- inspect the TEST frontend deployment identity and endpoint as needed to explain the browser request path;
- record whether any gateway/proxy Worker sits in front of the API hostname actually used by the browser.

Do not expose secrets. Do not change vars/secrets/routes in this phase.

### A3. Bounded endpoint matrix
From the local shell/client, issue one bounded read-only `GET /api/r3/catalogs` to each distinct relevant endpoint discovered above, at most once per endpoint in this phase:
1. exact direct API workers.dev endpoint;
2. exact API endpoint used by the failed browser, if different;
3. relative frontend `/api/r3/catalogs` only if the failed browser actually used that fallback.

For each capture:
- requested URL;
- final URL after redirects;
- HTTP status;
- content type;
- Cloudflare error code/body if any;
- `cf-ray`/server headers where available.

Do not probe nonexistent health routes repeatedly. `/api/r3/catalogs` is sufficient for bootstrap health.

### A4. Classification
Classify exactly one:
- `1042_WRONG_BROWSER_API_ENDPOINT`: direct API is healthy but browser points to wrong/proxy/relative endpoint.
- `1042_PROXY_OR_ROUTE_LAYER`: direct API is healthy but another Worker/route in front returns 1042.
- `1042_DIRECT_API_DEPLOYMENT_IDENTITY_DRIFT`: direct endpoint is 1042 and active deployment/config differs from accepted source/config expectation.
- `1042_PROVEN_INTENTIONAL_SAME_ZONE_WORKER_FETCH`: a concrete intended same-zone Worker fetch in the deployed path is identified.
- `1042_PLATFORM_TRANSIENT_RECOVERED`: exact intended direct endpoint is healthy again with no configuration/source change and metadata shows no drift.
- `1042_UNRESOLVED_EXTERNAL_PLATFORM_OR_ACCOUNT_ROUTING`: direct endpoint remains 1042 but no controllable repo/deployment misconfiguration or intended same-zone fetch can be proven.

No gameplay until classification is posted.

## 5. PHASE B — smallest infrastructure recovery only after proof

### B1. Wrong browser API endpoint
If direct API workers.dev is HTTP 200 but the browser used a wrong/proxy/relative endpoint:
- correct only the TEST launch/binding path that supplies the API endpoint if it is harness/deployment usage error;
- do not edit product source solely to compensate for a bad QA URL;
- if a persistent deployed frontend configuration is provably wrong and current product contract requires a built-in API base, stop and report the exact source/config gap before editing; do not invent a proxy layer.

### B2. Proxy/route layer
If a gateway/proxy/route causes 1042 while the direct API is healthy:
- prefer bypassing/removing the unintended TEST proxy from the acceptance URL or correcting its intended binding/route;
- Service Binding is preferred for intentional same-account Worker-to-Worker calls when that architecture is actually intended;
- do not add a broad global-fetch flag to the API Worker when the faulty same-zone fetch lives elsewhere.

### B3. Deployment identity drift/stale broken deployment
If direct intended API identity is wrong/stale while repo config/source is correct:
- re-read Issue #68 immediately before deployment;
- perform at most ONE exact TEST API redeploy from accepted executable source `dd62988...` plus current reviewed `wrangler.r3.api.jsonc`;
- no source semantic change;
- no frontend deploy unless its identity is independently proven stale;
- record exact new Worker Version ID and deployment output.

### B4. Proven intentional same-zone public fetch
Only if Phase A proves a concrete intended same-zone Worker public `fetch()` and establishes that the intended architecture is not a Service Binding/custom-domain/direct-endpoint correction:
- a minimal `wrangler.r3.api.jsonc` compatibility correction using `global_fetch_strictly_public` is permitted;
- first add a focused config/deployment contract test or deterministic static assertion proving the flag is intentional and scoped to R3 TEST/API config;
- run `git diff --check`, relevant config/source tests, full npm if repository source/test changed, Wrangler dry-run;
- FF-only land after another Issue #68 authority check;
- deploy TEST API once;
- no provider/model/Story/Observer/gameplay semantic edits.

Do not use this branch merely because Cloudflare error text mentions the flag.

### B5. Platform transient
If the exact intended direct endpoint has recovered before any mutation and metadata shows no drift:
- make no source/config/deploy change;
- record the prior 1042 as bounded infrastructure transient;
- proceed to Phase C.

### B6. Unresolved external/account routing
If direct API remains 1042 and no controllable root cause is proven:
- STOP `BLOCKED_TEST_API_CLOUDFLARE_1042_UNRESOLVED`;
- preserve all source/config;
- do not add compatibility flags, route workarounds, retries or gameplay samples.

## 6. PHASE C — pre-game recovery gate

After B1-B5 recovery, prove exactly once:
1. intended direct API `GET /api/r3/catalogs` -> HTTP 200 JSON with canonical catalog shape;
2. fresh browser context opens the intended TEST frontend with the exact intended API endpoint;
3. catalog load succeeds;
4. Setup UI becomes usable;
5. no `Failed to fetch`, Cloudflare 1042, pageerror or unexpected redirect.

This is a bootstrap control only. Do not create a game merely to repeat the health gate more than needed.

If the gate fails, STOP and classify; do not keep probing until pass.

## 7. PHASE D — one decisive post-fix clothing CSA acceptance

Only after Phase C is green, create ONE new disposable R3 TEST game.

Sequence:
1. Setup + Opening once.
2. Apply `no_panties_under_work_clothes` once through deployed CSA UI.
3. Prove revision increases while gameplay turn does not.
4. Read back exact active rule fields and scoped clothing state.
5. Wait for full browser readiness; capture request/response/requestfailed/pageerror/console.
6. Submit exactly ONE neutral, unambiguously clothing-relevant literal:
   `서원희 차장의 근무복 차림을 잠시 살펴보고 회의 자료를 건넨다.`
7. Capture exact literal/request, active rule Story context if existing diagnostics expose it, streamed Story, Observer raw/applied, state_after, committed readback, clothing, MM, choices, scene/location/presence and timings.

Valid PASS requires an actual committed Story and:
- active institutional premise visibly true in natural narration;
- exact subject/counterparty scope preserved;
- no mechanical rule quotation required;
- no invented affection, comfort, consent, desire, romance, obedience, relationship or player sexual state;
- literal player actor/target/action/topic preserved;
- Observer/readback coherent.

If a VALID committed Story materially discusses the scoped work-clothing state but still ignores the active premise:
- STOP `BLOCKED_ACTIVE_CSA_STORY_PREMISE_AFTER_PROMPT_CLOSURE`;
- include raw active_rules input + raw Story output;
- do NOT edit the prompt/provider/model/config or run a second semantic sample.

If transport fails before durable Story:
- classify footprint read-only;
- do not repeatedly create replacement fixtures;
- STOP on repeated current-deployment transport regression.

## 8. PHASE E — remove proof then continue objective P1

After Phase D PASS:
- remove same rule once;
- revision increases while gameplay turn unchanged;
- active rule absent from readback/Story context;
- one different next ordinary Story commits and no longer applies removed premise.

Then continue automatically in this same Task ID:
1. NEW fixture: at least four distinct canonical locations with full chain `literal exact destination -> Story exact canonical name -> observer_raw -> observer_applied -> state_after -> next Story/context/map`.
2. Presence: exact canonical actor-name enter/exit evidence, no player-movement-created NPC transition, same-turn grounded entrant MM, no off-scene injection.
3. `scene_note`: bounded current snapshot; stale ended people/objects/actions disappear.
4. Semantic agency: preserve actor, target/counterparty, action, movement/direction, request/refusal, self-state, topic/intent. Historical targets remain 한리브/lunch, `혼자 있고 싶다`, `허리를 만진다`.
5. materially different 15+ turn campaign.
6. long-memory 50+ turn campaign with actual older-summary continuity.
7. dedicated request/interaction CSA fixture.
8. all 9 canonical CSA templates using full apply/relevant Story/remove/next-Story proof.
9. latency p50/p95 when sample permits.
10. retained history/export/download/reconnect/duplicate submit/explicit failed retry/TTS/feedback if current canon plus desktop, 390x844 and wider mobile/tablet viewports.

No generic semantic validator/gate, fuzzy matching, retry-until-pass or provider tuning.

## 9. Heartbeat / terminal discipline

Post `PROGRESS_HEARTBEAT` at Phase A classification, after any infrastructure correction/deploy, after Phase C, and about every 15 minutes during long QA.

Before every landing/deployment, re-read Issue #68 and verify no newer execution authority exists.
Fast-forward only.

Terminal must include:
- exact task blob and start/final main;
- endpoint/route/deployment classification;
- changed paths if any;
- tests/dry-runs;
- exact TEST Worker Version IDs;
- bootstrap gate evidence;
- fixture IDs;
- literal/Story/Observer/applied/state/readback evidence;
- warning classification;
- remaining matrix.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remains forbidden until the full objective matrix is green.
