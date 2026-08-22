# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: TEST BROWSER SUBMIT-PATH DIAGNOSTIC -> CSA STORY-EFFECT CLOSURE -> FOUR-LOCATION / SCENE / AGENCY -> 15 / 50 / 9-CSA CONTINUOUS TEST LIVE-QA
Updated: 2026-08-22 14:20 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/task-registration branch, recovery branch, or alternate execution authority.

## 0. Binding authority / frozen architecture

Automation owns objective QA until the deployed exit matrix is green. `WAITING_USER_FINAL_PLAYTEST` / `OWNER_READY` is forbidden before then.

Binding authority remains:
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`
- PR #95 owner-locked product canon `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- PR #96 A-prime canon `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- `docs/redesign/00_*` through `11_*`
- current accepted R3 source on main
- latest explicit owner decisions and Issue #68 operator reviews.

Architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Do NOT add a new engine, generic semantic validator, NER/fuzzy/nearest actor matching, physical ontology, consent DSL, second Story/choice LLM, automatic Story retry/regeneration, browser-owned Story/Observer/Commit orchestration, timeout inflation, provider/model/config workaround, or another narrative parser generation.

TEST only. No Production access/deploy. Preserved historical/manual/evidence games are immutable/read-only.

## 1. Accepted terminal / operator decision

Previous terminal:
- terminal comment: `5378165279`
- operator review: `5378174592`
- terminal task blob: `5f205009fe41e900af5b95443f06125d0c8997be`
- terminal workflow head: `4a26c345ba88385cea80aa8ffa507db90ebe4bca`
- reviewed runtime source: `a4608ff7710468dd34ca7858ccaaf869eb9908bd`

Current TEST identities before this task:
- API: `game-proxy-company-r3` version `6e86c32e-22e5-400c-8bdb-9ae4ef7a639a`
- frontend: `gamebuilder-company-r3` version `ba4812c5-3883-4a90-8b9d-5482e4ccfabf`

No runtime/source/deploy mutation occurred in the previous continuation after `a4608ff...`.

### Frozen GREEN results

Do not reopen these absent new deterministic evidence:

1. **P0 failed-turn / transport**
   - explicit failed-turn retry;
   - same-row attempt fencing;
   - stage-aware stale terminalization;
   - invocation-based Story deadline;
   - same-job duplicate/reconnect behavior.

2. **Story current-choice authority**
   - Story terminal structurally valid 1..4 tail is the only canonical choice source;
   - Observer may warn but may not veto or author choices;
   - no Story tail => no previous/fabricated fallback, free input remains available;
   - `choices_observer_mismatch` is diagnostic only when committed choices remain exact Story-tail literals.

3. **Clean 30**
   - disposable `4debc85b-2e19-4d0b-96cb-177e7379df1e` completed Opening + 30 ordinary turns;
   - literal storage parity 30/30;
   - exact-four Story tail 16/30, no-tail 14/30, max no-tail streak 6;
   - no prior/deterministic fabricated choices;
   - one natural stale failure recovered once via the accepted explicit failed-turn retry.
   - Do not rerun clean 30 merely to improve these statistics.

4. **Mind Monitor actor contract**
   - source closure `480daad8d7255ecbc865af9f4bd4648910afd446` passes canonical `{id,name}` directory to Observer;
   - actor enter/exit evidence requires registered actor ID + exact Story quote containing exact canonical actor name;
   - MM eligibility is structurally current actors plus grounded entrants minus grounded exits;
   - deployed live game `a764e547-0eaf-4917-8cc5-e96bbb370c79` Turns 1-5 produced canonical actor-ID keyed raw/applied MM;
   - previous systemic 0/30 MM blocker is closed.

5. **Strict enter/exit grounding**
   - Turn 5 `general_park_jungwoo` evidence `박 팀장...` was correctly dropped because canonical name is `박정우`;
   - this is correct fail-closed behavior, not a bug;
   - do not add alias/fuzzy/title/name repair.

6. **Active CSA Story-context source closure candidate**
   - source `a4608ff...` projects active canonical `csa_rules` into Story context once, preserving scopes and excluding inactive rules;
   - Story prompt bounds institutional rule application and exact canonical destination-name evidence;
   - focused 42/42, full 466/466, syntax and diff-check passed before TEST deployment;
   - source deployed to TEST API version `6e86c32e-22e5-400c-8bdb-9ae4ef7a639a`.
   - Source/test/deployment are accepted; **live CSA Story-effect is still UNPROVEN** because no valid post-activation gameplay request was created.

## 2. Current blocker: TEST browser submit path, not gameplay/provider

Disposable TEST game:
`a764e547-0eaf-4917-8cc5-e96bbb370c79`

Read-only preflight at terminal proved:
- revision `6`;
- committed_turn `5`;
- turns only `0..5`;
- no Turn-6 job/action exists;
- `csa_active=[r3_csa_1]`;
- active rule is canonical `no_panties_under_work_clothes`, continuous/weak, female_employee scope;
- scoped clothing state persisted.

The attempted neutral post-activation literal was:
`회의 자료를 정리하며 팀원들의 설명을 차분히 듣는다.`

The deployed browser showed the textbox retaining this literal and `#submit-action` visible/enabled, but Playwright interaction produced:
- no `/turn` request;
- no job;
- no action row;
- no revision/turn movement;
- therefore no provider Story result exists to judge CSA Story effect.

Classify previous attempts carefully:
- plain Enter is NOT a product submit contract; current `frontend-r3/app.js` intentionally submits keyboard input only on `Ctrl/Cmd+Enter`;
- `#submit-action` click IS a product submit contract and source binds it directly to `submit()`;
- current `frontend-r3/app.js` blob is `258d98d3fdfe03a47f4927d047d4564c2c69ebd7`, unchanged from the accepted deployed frontend lineage.

Therefore next action is diagnostic separation of:
1. stale/corrupt Playwright/browser page state;
2. wrong frontend asset/deployment identity;
3. real deployed click/event wiring defect.

Do not touch runtime/provider/CSA logic before this is classified.

## 3. Phase A — deployed frontend identity + fresh-browser submit control

### A1. Verify exact deployed static assets

Before gameplay mutation:
- fetch deployed frontend root and `app.js` read-only;
- verify the live `app.js` content/hash corresponds to repository blob `258d98d3fdfe03a47f4927d047d4564c2c69ebd7` or otherwise prove exact equivalent content;
- verify `#submit-action` exists once and is a button;
- verify no unexpected frontend deployment drift.

If deployed asset identity is stale/different, STOP and classify before gameplay. Frontend redeploy of exact accepted source is allowed only when stale deployment identity is proven; do not change source merely to redeploy.

### A2. Use a completely fresh browser context for one generic-submit control

Do NOT reuse the prior corrupted Playwright page/context.

Create one disposable TEST control game only if needed to isolate generic frontend submission. It is not a certification campaign.

In a fresh browser context:
1. load deployed frontend with the authorized TEST API origin;
2. Setup once and Opening once;
3. wait until Opening terminal/readback is committed and no modal is open;
4. record console errors/page errors;
5. fill one simple Korean literal into `#player-action`;
6. install read-only request observation for `/turn`;
7. click `#submit-action` exactly once using the normal Playwright click path;
8. observe whether one `/turn` request is created and whether it commits.

Do not use plain Enter as a failure criterion. `Ctrl/Cmd+Enter` may be checked only as a separate documented keyboard contract after click behavior is classified; never fire both paths for the same intended turn.

Expected generic-control result:
- exactly one click event -> exactly one `/turn` request -> one canonical job/turn -> one commit.

If generic control works, classify the prior no-job event as harness/page-state corruption. Do not patch frontend source.

If generic control fails in a completely fresh browser while:
- button is visible/enabled,
- module asset loaded without page error,
- context/game ID is valid,
- no failed/processing job exists,
then collect exact DOM/event/network/status evidence and proceed to Phase B frontend source diagnosis.

## 4. Phase B — source correction only if real deployed frontend defect is proven

Do NOT enter this phase when the fresh control works.

If fresh control proves a real frontend defect:
- inspect the narrow `#submit-action -> submit() -> client.turn()` path only;
- determine whether `state.busy`, missing game ID, stale context/job, listener attachment, overlay state, or another deterministic client condition prevents the request;
- add the smallest non-semantic diagnostic/regression necessary to reproduce the exact condition;
- fix only the proven frontend boundary.

Requirements:
- no browser-owned gameplay orchestration;
- no automatic retry;
- no duplicate submission fallback;
- no direct API bypass in product UI;
- no provider/runtime/CSA semantic change;
- no normal Enter behavior change unless independently required by product canon (currently it is not);
- preserve full literal action bytes;
- preserve current choice-click path.

Run focused frontend/recovery/choice tests, full npm, changed JS syntax, `git diff --check`.

Re-read Issue #68 immediately before landing. Fast-forward only.
Deploy TEST frontend only if source changed. Record exact version.

Then repeat ONE fresh generic-submit control on a new disposable game. No pass-seeking loop.

## 5. Phase C — resume the already-active CSA fixture exactly once

Only after generic deployed browser submission is proven working.

Return to:
`a764e547-0eaf-4917-8cc5-e96bbb370c79`

Before mutation read-only confirm again:
- committed_turn=5;
- revision=6;
- no Turn-6 job/action;
- `csa_active=[r3_csa_1]`;
- rule content/scope remains present.

Use a **new fresh browser context/page**, not the previous corrupted page.
Ensure:
- CSA overlay is actually hidden;
- no utility modal overlays the action panel;
- no failed/processing job;
- `#submit-action` visible/enabled;
- console/page errors captured.

Fill exactly this neutral action unless a different neutral one is required solely to avoid accidental semantic overlap:
`회의 자료를 정리하며 팀원들의 설명을 차분히 듣는다.`

Submit via `#submit-action` normal click exactly once.

Do NOT copy the active CSA rule text into player input.
Do NOT call the turn API directly as a substitute for browser acceptance unless the browser path itself has just been proven defective and the operator task explicitly reaches Phase B correction/redeployment first.

Capture:
- request payload / exact literal bytes;
- Story input context evidence showing active_rules delivered to Story if available through existing diagnostics/test artifact;
- streamed Story;
- Observer raw/applied;
- state_after;
- committed turn readback;
- MM;
- choices;
- scene/location/presence;
- timing marks.

### CSA effect acceptance

For active `no_panties_under_work_clothes`:
- Story must reflect the active institutional rule when relevant to the scoped scene/context;
- effect must stay inside stated rule content + subject/counterparty scope;
- active institutional/system rule must NOT manufacture personal affection, comfort, consent, desire, romance, obedience, relationship, or player sexual state;
- Observer/readback/structured clothing state should remain coherent where applicable;
- RPC/storage activation alone is insufficient.

If the neutral turn contains no scene relevance to the scoped rule, do not replay the same turn until a visible effect appears. Record the sample and continue one coherent relevant scene only when naturally justified, without provider pass-seeking.

## 6. CSA remove + next Story proof

After a valid active-rule Story sample:
1. remove/deactivate the same `r3_csa_1` through the deployed CSA UI/API contract;
2. prove revision increases while committed_turn remains unchanged for the removal itself;
3. verify `csa_active=[]` / active rule absent in readback;
4. submit exactly one next ordinary browser turn;
5. prove next Story/readback no longer carries/applies that institutional rule.

Do not infer removal acceptance from RPC success alone.

## 7. Four-location canonical movement campaign

Once CSA active/effect/remove closure is green, use a NEW disposable fixture for location acceptance.

Prove at least four distinct canonical locations through the full chain:
`literal player action -> Story exact canonical destination name -> observer_raw -> observer_applied -> state_after -> next Story/context/map`.

Requirements:
- use exact canonical location names in movement literals;
- Story may naturally narrate movement but must not silently substitute destination/direction;
- Observer location quote must be an exact Story substring;
- canonical correction may use exact registered location name already present in that quote, not fuzzy/nearest semantics;
- next Story must start from/read the committed canonical location;
- company map must agree with committed state;
- do not turn a generic `회의실` into a specific canonical room unless exact canonical name evidence exists.

Stop on first deterministic divergence and fix only that proven boundary.

## 8. Presence / scene_note / semantic agency P1

Continue on fresh disposable fixtures as appropriate.

### Presence
- actor enter/exit evidence must identify exact canonical actor name;
- player movement cannot make NPC enter/exit;
- same-turn grounded entrants can receive MM;
- unrelated/off-scene actors cannot be injected.

### scene_note
- bounded current-scene snapshot;
- rewrite for current state rather than indefinite accumulation;
- stale ended persons/objects/actions should disappear when no longer current.

### Semantic player agency
Inspect Story meaning, not only stored literal equality.
Story must not silently replace:
- player actor;
- target/counterparty;
- action;
- movement/direction;
- request/refusal;
- self-state;
- topic/intent.

Known historical failure patterns remain explicit regression targets:
- asking 한리브 about lunch must not become talking to 김제나 about work;
- `혼자 있고 싶다` must not become an NPC continuing a forced conversation without narratively respecting refusal;
- `허리를 만진다` must not become touching a table edge.

Do not solve semantic agency with generic semantic classifiers/gates. Story prompt/context and human-like QA remain the authority.

## 9. Choice quality remains a measured P1 concern

Frozen clean-30 result:
- valid exact-four Story tails 16/30;
- no-tail 14/30;
- max no-tail streak 6.

Do not regenerate/retry Story to improve this rate.
Do not fabricate fallback choices.
Continue to record reliability in later campaigns.

Observer numbering mismatch remains diagnostic only when canonical Story choices survive.

## 10. Remaining campaigns after P1 green

Then continue the same task through:
1. materially different independent 15+ turn campaign;
2. long-memory 50+ turn campaign;
3. dedicated clothing CSA fixture;
4. dedicated request/interaction CSA fixture;
5. all 9 canonical CSA templates.

For every CSA template prove:
`apply -> revision increases while gameplay turn unchanged -> relevant scene -> Story premise/scope effect -> observer/readback/structured state as applicable -> remove -> next Story/readback confirms removal`.

RPC success alone is not acceptance.
Institutional/system CSA premise must not manufacture personal affection, comfort, consent, desire, romance, or relationship state.

## 11. Latency / retained surfaces / viewports

Across campaigns capture:
- submit;
- response headers if available;
- first Story token;
- Story complete;
- Observer start/complete/fail-open;
- terminal commit.

Derive p50/p95 when sample size permits. Measure before optimizing. Observer remains one call, fail-open, 75s budget unless future objective evidence justifies a separate owner-reviewed task.

Exercise retained product surfaces:
- history;
- TTS;
- download/export;
- refresh/reconnect;
- duplicate submit;
- failed-turn explicit retry;
- canon-retained feedback/revision surface if still present.

Required viewport evidence before final owner handoff:
- desktop;
- 390x844;
- one wider mobile/tablet viewport;
- screenshots visually inspected.

## 12. Safety / exit

- TEST only; no Production.
- Preserved/manual/evidence games immutable.
- No provider/model/API URL/key/secret/temperature change.
- Keep Story first-content 30s / Story total 120s / Observer 75s unchanged.
- No automatic Story retry/regeneration or second Story/choice LLM.
- No generic semantic classifier, NER, fuzzy/nearest mapper, physical ontology, or consent DSL.
- No Observer numbering stripping or choice semantic repair.
- No alias/title -> actor identity mapping; exact canonical actor grounding remains.
- No migration-history repair/rewrite unless a future separately proven DB blocker requires owner-reviewed authorization.
- Fast-forward only; no force push/history rewrite.
- Re-read Issue #68 before each source landing and deployment decision.
- During long QA, post useful `PROGRESS_HEARTBEAT` roughly every 15 minutes rather than going silent.

A deterministic defect should stop and produce a terminal with exact evidence. Harness invalidity is not gameplay failure, and normal diagnostic warnings are not product failures.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remains forbidden until the complete objective QA matrix is green.
