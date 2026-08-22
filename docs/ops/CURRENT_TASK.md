# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: PROVIDER FIRST-CONTENT DIAGNOSTIC -> RECONNECT LIVE ACCEPTANCE -> CONTINUOUS TEST LIVE-QA / FIX / REDEPLOY LOOP
Updated: 2026-08-22 10:09 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/task-registration branch, recovery branch, or alternate execution authority.

## 0. Binding owner policy / authority

The owner has explicitly rejected premature `WAITING_USER_FINAL_PLAYTEST` / `OWNER_READY` gates. Automation owns objective QA. Manual owner play begins only after the objective exit matrix is green.

Binding operating protocol:

- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`

Binding product/architecture authority remains:

1. PR #95 product-first Company canon at owner-locked lineage `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
2. PR #96 A-prime engine/live-first acceptance at `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
3. `docs/redesign/00_*` through `11_*`;
4. Company v1 UI/content donor snapshot `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`;
5. current accepted R3 source on main;
6. latest explicit owner decisions and Issue #68 operator review.

Architecture remains frozen at A-prime/R3. Do not respond to concrete defects by inventing a new engine, generic semantic validator, NER/fuzzy identity mapper, physical ontology, consent DSL, second Story/choice LLM, retry/regeneration layer, or browser-owned Story -> Observer -> Commit orchestration.

TEST only. No Production access/deploy. Never mutate/reset/delete/replay preserved historical/manual/evidence games.

## 1. Accepted prior terminal and current executable

Prior terminal:

- terminal comment: Issue #68 `5376967647`;
- operator review: Issue #68 `5376978387`;
- prior CURRENT_TASK blob: `328a556c495f600fd3b0c41adbf4ccddab142aa5`;
- executable main at terminal: `ed760bf0fa6a75fb6bcac27f490e074ad99a6b31`;
- landed reconnect commit changes exactly `frontend-r3/app.js` and `test/r3-frontend-contract.test.mjs` from its registration parent;
- focused frontend contract 3/3, full suite 451/451, syntax and diff checks passed;
- TEST API version at terminal: `c2bb5928-7ca3-4870-9fa7-d1f72d2b585e`;
- TEST Frontend version at terminal: `a7f7a308-a067-41a5-99e0-305b58ea9d57`.

Fresh disposable deployed game `90b6528f-8239-42a8-986d-503d14412627` booted correctly, preserved `api=` + `game_id`, hid the fallback shell, and rendered the Korean UI. Opening then produced no Story content before the configured first-content boundary and terminated with `r3_story_first_content_timeout`; committed turn remained 0.

Current source fact: `runtime-r3/server/provider.js` uses `storyFirstContentMs=30_000`, `storyTotalMs=120_000`, `observerMs=75_000`. The Story first-content deadline starts at provider request invocation and clears only on the first non-empty streamed Story delta.

The BLOCKED result is accepted. It does NOT prove that 30 seconds should simply be increased. It also does not invalidate the reconnect patch; that patch remains source/test-landed but live-unaccepted because the same-job recovery scenario was never reached.

## 2. Immediate first-content latency diagnostic

This section explicitly authorizes a bounded live diagnostic that the previous lease could not perform. It is measurement, not retry-until-pass.

### 2.1 Preflight

1. Fetch exact latest `origin/main`; re-read latest Issue #68 comments before any mutation or deploy.
2. Verify the current main is a descendant of `ed760bf0...` and inspect any newer delta. Never silently overwrite newer source/docs.
3. Confirm deployed TEST API/frontend identity. Deploy only exact reviewed TEST artifacts when source changes actually require it.
4. Do not change provider, model, API URL, key/secret, temperature, retry count, or Story semantic contract to make the test pass.

### 2.2 Timing visibility

First inspect existing R3 job/SSE/log diagnostics for whether these boundaries are already observable without a source patch:

- submit / Story request start;
- provider response headers received;
- first non-empty Story delta;
- Story complete;
- Observer start/complete;
- terminal commit.

If these boundaries are not independently distinguishable, add the smallest non-semantic timing instrumentation needed to expose them in TEST diagnostics/evidence. Timing metadata must not become gameplay state, Story context, semantic authority, or a new durable domain. Never log prompts, secrets, API keys, authorization headers, or private provider payloads merely for timing.

Any instrumentation source change must receive focused tests, full suite, syntax checks and `git diff --check`, then fast-forward-only landing and exact TEST deployment before live use.

### 2.3 Fixed availability sample — no pass-seeking retries

Against the exact current TEST runtime, run exactly **3** fresh disposable Korean Setup -> Opening samples, one Opening attempt per game.

For all three samples, regardless of early pass/fail, record:

- disposable game id;
- request start -> headers when observable;
- request start -> first Story delta, or right-censored `>=30s` timeout;
- Story completion if any;
- exact terminal code;
- committed turn count/state after the attempt.

Do not retry a failed game/job. Do not stop the sample early because one attempt succeeds. Do not use preserved/manual/evidence games.

Decision after the fixed three-sample set:

- If at least 2/3 produce first Story content inside the existing 30s boundary, classify the prior terminal as a transient provider incident for now; do **not** change the timeout from that evidence. Continue to Section 3 on a separate fresh game.
- If 2/3 or 3/3 hit the 30s boundary, first determine from timing evidence whether delay is before provider headers, after headers before first delta, or not distinguishable. Do not guess.
- A source change to the 30s first-content boundary is allowed only when existing/new measured evidence demonstrates that the boundary itself is systematically clipping otherwise healthy Story responses. A single timeout is not sufficient. Any new value must be evidence-backed, bounded, separately tested, and must not remove the independent total timeout.
- If evidence instead indicates provider unavailability/degradation with no implementation defect, do not mask it with a timeout inflation, model switch, secret/config change, or hidden retry. Post exact measurements and STOP BLOCKED for operator review.

The 120s Story total boundary is not authorized for arbitrary expansion. Observer 75s remains a later performance issue; do not change it until actual campaign timing measurements exist unless a deterministic correctness bug independently requires it.

## 3. Reconnect / refresh live acceptance

Once Section 2 demonstrates a usable Story path under an evidence-backed boundary, use a **new fresh disposable R3 TEST game** and complete the previously blocked focused acceptance:

1. Korean Setup -> Opening -> at least one committed ordinary turn;
2. refresh after commit;
3. refresh/reload while a turn job is actively `processing`;
4. real or controlled SSE disconnect followed by recovery of the **same job**;
5. canonical committed context rendered after completion;
6. recovery control visible/usable;
7. `api=` and `game_id` preserved;
8. no duplicate Story generation, no duplicate committed turn, no hidden retry/regeneration;
9. browser console/network + job/state/turn DB evidence + screenshot-visible UI inspected together.

If this focused scenario exposes a deterministic implementation defect, fix narrowly, test, fast-forward land, exact TEST deploy, and replay on a new disposable game. Do not certify the reconnect fix merely from unit tests.

## 4. Continue the SAME P1 correction loop

Do not stop after Section 3. Continue this same task through the binding product-review priorities.

### P1 correctness

1. **Active CSA Story projection** — active rules must reach Story as relevant premise + selected scope. `active_rules: []` while a rule is active is a defect.
2. **Canonical Observer actor contract** — pass canonical `{id,name}` actor directory. Unknown names must not be nearest/fuzzy-mapped to registered actors.
3. **Mind Monitor** — explicitly actor-keyed output for relevant current/post-Story NPCs; new relevant entrants must not be structurally dropped merely because they were absent pre-turn.
4. **Canonical location** — replay movement across at least four distinct canonical locations through literal -> Story -> observer raw -> observer applied -> state_after -> next Story.
5. **Actor enter/exit evidence** — quote must identify the canonical actor; player movement quote cannot be repurposed as NPC enter/exit evidence.
6. **scene_note** — current bounded scene snapshot, rewritten each turn; remove ended location/counterparty/object facts and retain only continuing facts.
7. **Semantic player agency** — inspect actor, target/counterparty, action, movement/direction, request/refusal, self-state and topic/intent. Byte-equal stored literal alone is not proof.
8. **Product identity** — workplace duties are texture, not a mandatory work-assistant funnel. Story must not invent competing fictional app mechanics outside the canonical 9-rule `상식개변` system.
9. **Choices** — exactly four current Story-authored choices at high reliability; one clear action/intention per choice; no stale/prior-turn fallback or deterministic fabricated replacements. Failure remains fail-open to free input.

### P2 / long-play / performance

10. Separate disposable fixtures: clean normal-play, materially different independent play, clothing CSA, request/interaction CSA, long-memory.
11. Run clean primary campaign **30+ committed turns**.
12. Run materially different independent campaign **15+ committed turns**.
13. After shorter campaigns are clean enough, run **50+ committed turn** memory/continuity campaign.
14. Record submit -> first Story token, Story total, Observer tail and terminal commit timing across campaigns; derive p50/p95 where sample size permits. Do not optimize latency before measuring it.
15. Exercise refresh-during-stream, same-job reconnect, duplicate-submit/concurrency and stale-attempt protection.

### CSA acceptance

For each of all 9 canonical CSA templates use a dedicated/appropriate disposable fixture and prove:

`apply -> revision increases while gameplay turn does not -> play an actually relevant scene -> Story premise/scope effect -> observer/readback/structured state as applicable -> remove -> next Story/readback confirms removal`

Additionally verify:

- clothing rules affect structured clothing only when warranted by Story/evidence;
- CSA institutional/system premise does not manufacture personal affection, comfort, consent or desire;
- scope stays flexible only within the canonical 9-rule MVP;
- RPC success alone is never acceptance evidence.

### Retained surfaces

Exercise deployed history, TTS, download and any other canon-retained sidecars. Feedback/revision, if still visibly promised/retained by canon, remains unfinished until functional or explicitly owner-deferred.

## 5. Minimum human-like deployed evidence before owner handoff

Do not certify from HTTP 200, RPC success, unit tests, DOM presence, turn count, deployment success, or uninspected screenshots.

Minimum evidence remains:

- fresh Korean Setup and Opening;
- visible nonblocking Story streaming;
- clean 30 + independent 15 + long-memory 50 campaigns;
- Story-authored choices and literal Korean free-form actions;
- refusal/negative/self-directed actions;
- multiple canonical locations and multi-NPC entry/exit;
- off-scene canonical NPC references without auto-spawn;
- object/pose/scene_note continuity including leave/return;
- relevant-only MM with fail-open behavior;
- refresh after commit and during active stream;
- same-job reconnect and duplicate-submit protection;
- high-reliability current four choices; free input always usable on choice projection failure;
- all 9 CSA apply -> Story effect -> readback -> remove coverage;
- desktop, mobile `390x844`, and at least one wider mobile/tablet viewport;
- no permanent loader/fallback or blocking overlay over streaming Story;
- required browser/network paths free of uncaught failure;
- no fabricated/crossed identity;
- committed location/presence/scene_note grounded in Story;
- literal action stored byte/codepoint-equivalent **and semantically respected** by Story;
- DB/state/turn evidence agrees with visible Story/UI;
- screenshots visually inspected as the user sees them.

## 6. Safety boundaries

- TEST only; no Production.
- Disposable R3 TEST games are authorized. Preserved/manual/evidence games are read-only forever.
- No provider/model/API URL/key/secret change merely to mask implementation defects.
- No retry-until-pass, hidden retry/regeneration, or second Story/choice LLM.
- No generic semantic classifier/NER/fuzzy identity mapper/physical ontology/consent DSL.
- No browser-owned orchestration replacing the A-prime server-owned turn path.
- Migrations, if a proven defect truly requires one, must be additive and independently reviewed; never rewrite applied history.
- Re-read latest Issue #68 before every source landing and TEST deployment decision to avoid races.
- Fast-forward push only. Never force-push or rewrite remote history.

## 7. Exit criteria

Remain `READY` and continue the same task while any known objective P0/P1/P2 defect or untested canon-retained objective behavior remains.

`WAITING_USER_FINAL_PLAYTEST` / `OWNER_READY` is forbidden until all of these are demonstrated with deployed evidence:

1. clean desktop/mobile boot;
2. Setup -> Opening -> ordinary play;
3. visible nonblocking Story streaming with acceptable measured first-content behavior;
4. reliable current 4 choices + literal free input;
5. clean 30 + independent 15 + 50 turn campaigns;
6. semantic agency, identity, location/presence, scene_note and MM green;
7. refresh/reconnect/double-submit green;
8. all 9 CSA narrative/readback/remove coverage green;
9. retained sidecars usable or explicitly owner-deferred;
10. screenshots visually inspected and required console/network paths clean;
11. DB/state/turn evidence agrees with visible Story/UI;
12. no known objective P0/P1/P2 defect remains.

Only genuinely subjective questions such as narrative taste, emotional nuance, character appeal and pacing preference may remain for owner manual play.

## 8. Reporting

Use Issue #68 for compact iteration evidence; do not spam per turn.

For each meaningful iteration post `AUTONOMOUS_LIVE_QA_ITERATION` with:

- exact source/main SHA;
- API/frontend TEST versions;
- disposable game IDs and browser viewports;
- timing samples;
- turns/scenarios exercised;
- concrete defects and exact evidence;
- fixes landed and regression results;
- live replay result;
- remaining objective gaps and next loop action.

If a provider incident, push/deploy race, unexpected local delta, or safety boundary blocks execution, post exact evidence and STOP. Otherwise continue this SAME task; do not create a new feature task merely because one iteration completed.
