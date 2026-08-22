# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: EXISTING-GAME BOOTSTRAP READINESS -> CSA STORY-EFFECT -> ACTIVE-CSA RELOAD REPRO IF NEEDED -> FOUR-LOCATION / SCENE / AGENCY -> 15 / 50 / 9-CSA CONTINUOUS TEST LIVE-QA
Updated: 2026-08-22 14:37 KST
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
- latest Issue #68 operator decisions.

Architecture remains exactly:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Forbidden unless a deterministic defect in this task specifically proves otherwise:
- provider/model/API URL/key/config/temperature/token/timeout changes;
- automatic Story retry/regeneration or second Story/choice LLM;
- generic NER/fuzzy/nearest/semantic actor or location matching;
- physical ontology or consent DSL;
- browser-owned Story/Observer/Commit orchestration;
- migration/history repair or Production access/deploy;
- preserved historical/manual/evidence game reset/mutation;
- direct-API substitution for a browser acceptance that is explicitly testing the browser path.

Provider budgets remain Story first-content 30s / Story total 120s / Observer 75s.

## 1. Accepted progress / frozen GREEN

Latest terminal:
- terminal `5378229372`
- operator review `5378239095`
- terminal task blob `dc81810e3d450ca01c792f71343f1fafe9cd189f`
- terminal workflow head `78c51b8e1dee43eed9b4e11e91b1ec31f94e7682`
- reviewed runtime `a4608ff7710468dd34ca7858ccaaf869eb9908bd`

Current TEST baselines:
- API `game-proxy-company-r3` version `6e86c32e-22e5-400c-8bdb-9ae4ef7a639a`
- frontend `gamebuilder-company-r3` version `ba4812c5-3883-4a90-8b9d-5482e4ccfabf`

Freeze as GREEN absent new deterministic evidence:
1. P0 explicit failed-turn retry / same-row attempt fencing / stale terminalization / reconnect and duplicate transport behavior.
2. Story is sole canonical current-choice authority. Observer mismatch is diagnostic only when exact Story-tail choices survive. No Story tail => no fabricated/prior fallback and free input remains available.
3. Clean-30 disposable `4debc85b-2e19-4d0b-96cb-177e7379df1e`: literal parity 30/30; exact-four Story tail 16/30; no-tail 14/30; max no-tail streak 6; fabricated/prior fallback 0. Do not rerun to improve statistics.
4. Mind Monitor actor-ID closure `480daad8d7255ecbc865af9f4bd4648910afd446`: canonical actor directory, exact-name enter/exit grounding, post-Story entrant eligibility; live canonical-ID MM proven on focused turns.
5. Exact-name enter/exit fail-closed. `박 팀장` is not canonical `박정우`; do not add alias/fuzzy/title repair.
6. Active CSA Story-context source `a4608ff...`: active canonical `csa_rules` are projected into Story context once with scopes; inactive rules excluded; institutional scope must not manufacture personal affection/comfort/consent/desire/romance/relationship/player sexual state. Source tests 42/42 and full 466/466 passed before exact TEST API deployment.
7. Deployed frontend identity is GREEN: live `app.js` is byte-equivalent to accepted repo blob `258d98d3fdfe03a47f4927d047d4564c2c69ebd7` after CRLF/LF normalization; no frontend drift.
8. Generic deployed browser submit is GREEN: disposable `650a615d-1612-4936-9e21-9adb4aba4cb7` proved one normal `#submit-action` click -> exactly one POST `/turn` -> exact literal -> exactly one commit. Therefore no generic frontend source patch is authorized.

## 2. Current unresolved boundary

Old disposable active-CSA evidence fixture:
`a764e547-0eaf-4917-8cc5-e96bbb370c79`

Latest read-only state:
- revision 6
- committed_turn 5
- turns 0..5 only
- no Turn-6 job/action
- `csa_active=[r3_csa_1]`
- canonical `no_panties_under_work_clothes`, continuous/weak, female_employee scope
- scoped clothing state persisted.

A fresh page showed static `#submit-action` visible/enabled and source binding exists, but one click produced zero `/turn`, zero status transition, zero durable mutation.

This did NOT prove a product frontend defect because `#submit-action` is statically visible/enabled in `index.html` before module/context bootstrap completes. The previous probe did not establish a runtime readiness barrier before clicking.

Important keyboard contract:
- plain Enter is not submit;
- only Ctrl/Cmd+Enter is keyboard submit;
- normal button click remains the primary acceptance path.

## 3. Phase A — prove existing-game browser bootstrap readiness before click

Do not change source before completing this phase.

Use a completely NEW browser context/page. Navigate to the deployed frontend for the exact old fixture and TEST API.

Before filling or clicking anything, require all of the following and record them:
1. final page URL contains exact `game_id=a764e547-0eaf-4917-8cc5-e96bbb370c79` and the intended TEST API binding;
2. deployed `app.js` module request completes successfully;
3. successful context request for THIS exact game is observed;
4. `#api-status` has `aria-label="연결 완료"`;
5. rendered `#turn-number` is exactly `Turn 5`;
6. latest committed Turn-5 Story/history content is visible and corresponds to the readback game, not another stale page identity;
7. `#boot-fallback` is hidden;
8. CSA overlay and utility overlays are hidden;
9. no failed/processing job is present in current readback;
10. no `pageerror`; capture console errors/warnings;
11. `#submit-action` is visible/enabled AFTER all readiness conditions above, not merely from initial static HTML.

If any readiness condition does not become true, STOP and report the exact bootstrap failure. Do not click and do not mutate game data.

Once all readiness conditions are true:
- attach request observation for `/turn` and status/banner mutation observation;
- fill exactly one neutral literal: `회의 자료를 정리하며 팀원들의 설명을 차분히 듣는다.`
- click `#submit-action` exactly once;
- do not also press Enter/Ctrl+Enter;
- do not click again if no request appears.

Acceptance A:
- exactly one browser `/turn` request is created;
- request game ID is exact old fixture;
- literal bytes equal the filled action;
- exactly one canonical job/turn is created and committed;
- Story/Observer/state/readback are captured.

If Acceptance A passes, classify prior no-op attempts as Playwright bootstrap-readiness race. Do NOT patch frontend source. Continue directly to Phase C below without reapplying CSA.

## 4. Phase B — if old fixture still no-ops AFTER readiness, reproduce on one new active-CSA fixture

Enter this phase only if every Phase-A readiness condition was proven and the single click still produced zero `/turn`.

Do not repeatedly click/retry the old fixture. Preserve it after the one controlled Phase-A attempt.

Create ONE new disposable active-CSA reproduction game. This is a diagnostic fixture, not pass-seeking sampling.

Controlled sequence:
1. Setup + Opening.
2. Wait for full bootstrap readiness using the same barrier as Phase A.
3. Submit one ordinary baseline browser turn by `#submit-action`; require exactly one request/commit.
4. Apply `no_panties_under_work_clothes` through the deployed CSA UI; prove revision increases while committed_turn is unchanged.
5. Close the CSA overlay and prove it is hidden.
6. Without reload, wait for rendered context/readiness and submit one neutral browser turn exactly once.
7. If same-page active-CSA submit succeeds, reload the same game once.
8. After reload, wait for the full readiness barrier again.
9. Submit one different neutral browser turn exactly once.

Interpretation:
- baseline fails => generic browser defect contradicted prior control; STOP with evidence, no broad fix.
- baseline works + post-CSA same-page fails => deterministic CSA-UI/context client defect.
- same-page works + post-reload fails => deterministic active-CSA resume/bootstrap defect.
- both work => old fixture is anomalous/stale evidence; do not patch product code, preserve anomaly and continue CSA certification using the fresh fixture.

Before any source correction capture:
- exact page URL/game identity;
- all context/opening/turn/CSA requests;
- pageerror/console;
- status-banner transitions;
- overlay hidden state;
- rendered turn number;
- active CSA readback;
- whether click event was observed after readiness.

Only a deterministic fresh reproduction may authorize the smallest frontend correction.

### Allowed correction if and only if Phase B proves one

Inspect only the narrow frontend bootstrap/submit/CSA state boundary:
- module readiness/listener attachment;
- `state.busy` lifecycle;
- gameId/context identity;
- stale job state;
- CSA overlay/context render lifecycle;
- submit event wiring.

Do not change provider/runtime/CSA semantic rules.
Do not add retry, double-submit fallback, direct API bypass, polling that owns gameplay, or normal-Enter submission merely to make the test pass.

Add deterministic regression tests for the exact reproduced state. Run focused frontend/recovery/CSA tests, full npm, changed JS syntax, `git diff --check`. Re-read Issue #68 before FF landing. Deploy TEST frontend only if frontend source actually changes. Replay the single controlled reproduction once on a new disposable fixture.

## 5. Phase C — active CSA Story-effect acceptance

Use the fixture that is valid after Phase A/B:
- old fixture if Phase A submits successfully; OR
- the single fresh Phase-B fixture if the old fixture remains anomalous but fresh active-CSA submit/reload is healthy.

Do not reapply a rule already active.

For an active `r3_csa_1` neutral turn capture:
- literal action exact storage;
- Story input/context evidence showing active rule projection where available through existing diagnostics;
- streamed Story;
- Observer raw/applied;
- state_after and committed readback;
- clothing state;
- MM;
- choices;
- scene/location/presence;
- timing.

Acceptance:
- active institutional rule affects Story premise/scope when scene-relevant;
- effect stays inside canonical rule content and subject/counterparty scope;
- no invented affection, comfort, consent, desire, romance, obedience, relationship, or player sexual state;
- RPC/storage activation alone is not sufficient.

If one neutral sample is not relevant enough to visibly exercise the rule, do not replay/sample until pass. Continue one coherent naturally relevant ordinary action only if justified by the scene and record the miss.

## 6. Remove + next-Story proof

After a valid active-rule Story sample:
1. deactivate the same rule through deployed CSA UI/API contract;
2. revision increases while gameplay turn stays unchanged;
3. readback shows rule inactive/absent from `csa_active`;
4. submit exactly one next ordinary browser turn;
5. next Story/readback no longer carries or applies the removed institutional premise.

No RPC-only acceptance.

## 7. Four canonical locations

After CSA closure, use a NEW disposable fixture.
Prove at least four distinct registered canonical locations through:
`literal action -> Story exact canonical destination -> observer_raw -> observer_applied -> state_after -> next Story/context/map`.

No generic room text may be upgraded to a specific canonical location unless the exact canonical name is present in Story evidence. No fuzzy/nearest mapping.

Stop and narrow-fix only the first deterministic divergence.

## 8. Presence / scene_note / semantic player agency

Presence:
- exact canonical actor-name grounding for enter/exit;
- player movement alone cannot make NPC enter/exit;
- same-turn grounded entrant may receive MM;
- unrelated/off-scene actors cannot be injected.

scene_note:
- bounded current snapshot;
- stale ended people/objects/actions must not accumulate indefinitely.

Semantic agency must preserve actor, target/counterparty, action, movement/direction, request/refusal, self-state, and topic/intent.
Explicit historical regressions remain targets:
- ask 한리브 about lunch must not become 김제나/work talk;
- `혼자 있고 싶다` must be respected narratively;
- `허리를 만진다` must not become touching a table edge.

Do not build a generic semantic classifier to police these.

## 9. Remaining objective campaigns

When P1 is green, continue the SAME task through:
1. materially different independent 15+ turns;
2. long-memory 50+ turns;
3. dedicated clothing CSA fixture;
4. dedicated request/interaction CSA fixture;
5. all 9 canonical CSA templates.

For each CSA template prove:
`apply -> revision increases while gameplay turn unchanged -> relevant scene -> Story premise/scope effect -> observer/readback/structured state as applicable -> remove -> next Story/readback confirms removal`.

Continue recording Story exact-four choice reliability without retry/regeneration. Frozen clean-30 quality remains 16/30 valid tails, 14/30 no-tail, max no-tail streak 6.

## 10. Latency / retained surfaces / viewports

Across campaigns capture submit, provider headers when available, first Story token, Story complete, Observer start/complete, commit; derive p50/p95 when sample size permits. Measure before optimize.

Retain regression checks for:
- history/export/download;
- reconnect/reload;
- duplicate submit and accepted failed-job explicit retry;
- TTS behavior where in current product contract;
- feedback behavior if current canon retains it;
- desktop plus 390x844 and a wider mobile/tablet viewport.

## 11. Stop / terminal policy

During long QA phases post `PROGRESS_HEARTBEAT` at least about every 15 minutes.

On deterministic defect:
- collect exact deployed evidence;
- narrow-fix only the proven boundary if authorized here;
- validate, FF land, exact TEST deploy if needed;
- use a new disposable fixture for replay when required;
- no pass-seeking/provider sampling.

Before any landing/deploy, re-read Issue #68 and verify no newer execution authority exists.

Terminal must include exact task blob, start/final main, changed paths, tests, TEST versions, fixtures, literal/Story/Observer/applied/state/readback evidence, warnings classified as diagnostic vs blocker, and remaining matrix.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remains forbidden until the full objective matrix is green.